 import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useBookingFlowStore } from '../../store/bookingFlowStore';
import { useAuthContext } from '../../hooks/useAuthcontext';
import { useCreateAppointment } from '../../hooks/useAppointments';
import { useInitializePayment, useFetchPaymentQuote } from '../../hooks/usePayments';
import { usePaymentPolicy } from '../../hooks/useSettings';
import { useConsentForm } from '../../hooks/useConsentForm';
import { useValidatePromoCode } from '../../hooks/usePromocdes';
import { slotKeys } from '../../hooks/useSlots';
import { ServiceSelector } from '../../components/booking/ServiceSelector';
import { StaffPicker } from '../../components/booking/StaffPicker';
import { SlotCalender } from '../../components/booking/SlotCalender';
import { CoilDivider } from '../../components/booking/CoilDivider';
import { ConsentForm } from '../../components/forms/ConsentForm';
import { toast } from '../../store/uiStore';
import { getErrorMessage, getErrorCode } from '../../utils/apiClient';
import type { PaymentMethod } from '../../types/models';

function formatGHS(value: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
  }).format(value);
}

const STEPS = [
  { num: 1, label: 'Service' },
  { num: 2, label: 'Stylist & Time' },
  { num: 3, label: 'Consent' },
  { num: 4, label: 'Review & Confirm' },
] as const;

export function BookingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthContext();
  const {
    step, nextStep, prevStep,
    selectedService, selectedStaff, selectedSlot,
    notes, setNotes,
    consentData,
    appliedPromocode, setPromocode,
    reset,
  } = useBookingFlowStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOBILE_MONEY');
  const [submitting, setSubmitting] = useState(false);

  // Promo code entry — validated against the server as soon as they hit
  // "Apply" so they see a live discount preview, but the real amount is
  // always recomputed authoritatively server-side via getPaymentQuote
  // once the booking exists (see resolveBookingAmount in
  // paymentController.js). This is a preview, not the source of truth.
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const validatePromo = useValidatePromoCode();

  async function handleApplyPromo() {
    if (!promoCodeInput.trim()) return;
    try {
      const promo = await validatePromo.mutateAsync(promoCodeInput.trim().toUpperCase());
      const now = new Date();
      if (!promo.isActive || now < new Date(promo.validFrom) || now > new Date(promo.validUntil)) {
        toast.error('That promo code is not currently valid.');
        return;
      }
      setPromocode(promo);
      toast.success(`Promo code "${promo.code}" applied.`);
    } catch (err) {
      toast.error(getErrorMessage(err) || 'That promo code was not found.');
    }
  }

  function handleRemovePromo() {
    setPromocode(null);
    setPromoCodeInput('');
  }

  // Guest checkout fields — only used when !isAuthenticated
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  const createAppointment = useCreateAppointment();
  const initPayment = useInitializePayment();
  const fetchQuote = useFetchPaymentQuote();
  const { data: paymentPolicy } = usePaymentPolicy();
  const consentFormMutation = useConsentForm();

  const clientId = user?.client?.id;
  const guestFieldsComplete = guestName.trim() && guestEmail.trim() && guestPhone.trim();

  const canProceedFromStep1 = !!selectedService;
  const canProceedFromStep2 = !!selectedSlot; // staff is optional ("no preference")

  const estimatedDepositLabel = (() => {
    if (!selectedService || !paymentPolicy?.requireDeposit) return '';
    const amount =
      paymentPolicy.depositType === 'PERCENTAGE'
        ? Math.round(((selectedService.price * paymentPolicy.depositAmount) / 100) * 100) / 100
        : Math.min(paymentPolicy.depositAmount, selectedService.price);
    return formatGHS(amount);
  })();

  async function handleConfirmAndPay() {
    if (!selectedService || !selectedSlot) {
      toast.error('Please complete all booking steps.');
      return;
    }

    let payEmail: string | undefined;

    if (!isAuthenticated) {
      if (!guestFieldsComplete) {
        toast.error('Please fill in your name, email, and phone to continue.');
        return;
      }
      payEmail = guestEmail.trim();
    } else if (!clientId) {
      toast.error('Your account is missing a client profile. Please contact support.');
      return;
    } else if (!user?.email) {
      toast.error('Your account is missing an email address for payment.');
      return;
    } else {
      payEmail = user.email;
    }

    setSubmitting(true);
    try {
      // The backend creates the Appointment AND its Booking together in one
      // transaction (Booking.appointmentId is unique — a second, separate
      // "create booking" call would always fail). For guests, it also
      // creates the User + Client behind the scenes from guestName/
      // guestEmail/guestPhone — no clientId needed up front.
      const appointment = await createAppointment.mutateAsync({
        serviceId: selectedService.id,
        staffId:   selectedStaff?.id,
        date:      selectedSlot.startTime,
        notes:     notes || undefined,
        promoCode: appliedPromocode?.code,
        ...(!isAuthenticated
          ? {
              guestName: guestName.trim(),
              guestEmail: guestEmail.trim(),
              guestPhone: guestPhone.trim(),
            }
          : {}),
      });

      const booking = appointment.booking;
      if (!booking) {
        throw new Error('Booking could not be confirmed. Please try again.');
      }

      // Guests couldn't submit consent at step 3 (no Client existed yet).
      // Their consent choices are sitting in the booking flow store —
      // submit them now against the client the call above just created.
      if (!isAuthenticated && consentData) {
        try {
          await consentFormMutation.mutateAsync({
            clientId: booking.clientId,
            consentGiven: true,
            signature: JSON.stringify(consentData),
          });
        } catch {
          toast.error('Booking confirmed, but we could not save your consent record. Our team will follow up.');
        }
      }

      // Every stylist was booked for this time, so the appointment landed
      // on the waitlist instead of a real slot — there is nothing to
      // charge for yet (see resolveBookingAmount in paymentController.js,
      // which now rejects amountDue for a WAITLISTED appointment as a
      // server-side backstop to this check). Skip the quote/payment step
      // entirely; the client pays once promoted, which is when a slot
      // — and therefore a real amount owed — actually exists.
      if (appointment.waitlisted) {
        reset();
        toast.success('You\u2019ve been added to the waitlist. We\u2019ll notify you the moment a slot opens up.');
        navigate(`/booking/confirmation/${booking.id}`);
        return;
      }

      // Ask the server what (if anything) is actually due right now —
      // under the default pay-after policy this is 0 and no payment step
      // runs at all; a deposit policy returns the deposit-only amount.
      // The full/remaining balance is always collected in person and
      // logged by staff/admin afterwards (see AppointmentDetailModal).
      const quote = await fetchQuote.mutateAsync(booking.id);

      if (quote.amountDue <= 0) {
        reset();
        toast.success('Booking successful! Check your email or SMS for confirmation.');
        navigate(`/booking/confirmation/${booking.id}`);
        return;
      }

      const paymentRes = await initPayment.mutateAsync({
        bookingId: booking.id,
        method:    paymentMethod,
        provider:  'PAYSTACK', // both MoMo and Card deposits route through Paystack
        email:     payEmail!,
      });

      reset(); // clear booking flow state — the flow is complete

      if (paymentRes.authorizationUrl) {
        // Redirect to Paystack. Paystack will redirect back to a
        // confirmation URL configured on the backend after payment.
        window.location.href = paymentRes.authorizationUrl;
      } else {
        // No payment URL returned — go straight to confirmation and let
        // it poll the real payment status from the backend.
        toast.success('Booking successful! Check your email or SMS for confirmation.');
        navigate(`/booking/confirmation/${booking.id}`);
      }
    } catch (err) {
      // Two distinct 409s can come back from POST /appointments and both
      // need very different messaging — conflating them (as "someone
      // booked that slot") is confusing and, for ACCOUNT_EXISTS, flat out
      // wrong. The backend tags each with a `code` so we don't have to
      // guess from status alone.
      const code = getErrorCode(err);

      if (code === 'SLOT_CONFLICT') {
        // Someone else took this exact staff/time between the client
        // loading the calendar and hitting "confirm". Re-submitting with
        // the same slot will just fail again — send them back to the
        // calendar with the stale slot cleared and force a refetch.
        toast.error('Sorry — that time was just booked by someone else. Please pick another.');
        useBookingFlowStore.getState().setSlot(null);
        queryClient.invalidateQueries({ queryKey: slotKeys.all });
        useBookingFlowStore.getState().setStep(2);
      } else if (code === 'ACCOUNT_EXISTS') {
        // Almost always means: this exact booking already went through
        // (often on an earlier submit) and they're retrying with the same
        // guest email. Internal detail ("an account already exists") isn't
        // useful to a client mid-booking — tell them plainly what to do.
        toast.error(
          'Looks like you already have a booking with these details — check your email or SMS for confirmation. To book again, please sign in.'
        );
      } else {
        toast.error(getErrorMessage(err));
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="booking-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Book an Appointment</h1>
          <p className="page-subtitle">Choose your service, stylist, and time</p>
        </div>
      </div>

      <div className="booking-steps">
        {STEPS.map((s, i) => (
          <div key={s.num} className="booking-steps__item">
            <div
              className={`booking-step ${step === s.num ? 'booking-step--active' : ''} ${step > s.num ? 'booking-step--done' : ''}`}
            >
              <span className="booking-step__num">{step > s.num ? '✓' : s.num}</span>
              <span className="booking-step__label">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <CoilDivider done={step > s.num} />}
          </div>
        ))}
      </div>

      <div className="booking-panel">
        {step === 1 && <ServiceSelector />}

        {step === 2 && (
          <div className="booking-step-content">
            <h2 className="section-title">Choose your stylist</h2>
            <StaffPicker />
            <h2 className="section-title booking-step-content__gap">Choose a date &amp; time</h2>
            <SlotCalender />
          </div>
        )}

        {step === 3 && (!isAuthenticated || clientId) && (
          <ConsentForm clientId={clientId} onComplete={() => nextStep()} />
        )}

        {step === 3 && isAuthenticated && !clientId && (
          <div className="booking-empty-state">
            <p>Your account doesn't have a client profile yet. Please contact support to complete your booking.</p>
          </div>
        )}

        {step === 4 && (
          <div className="booking-review">
            <h2 className="section-title">Review your booking</h2>

            <div className="booking-summary">
              <div className="booking-summary__row">
                <span className="booking-summary__label">Service</span>
                <span className="booking-summary__value">{selectedService?.name ?? '—'}</span>
              </div>
              <div className="booking-summary__row">
                <span className="booking-summary__label">Stylist</span>
                <span className="booking-summary__value">
                  {selectedStaff?.user?.name ?? 'No preference'}
                </span>
              </div>
              <div className="booking-summary__row">
                <span className="booking-summary__label">Date &amp; Time</span>
                <span className="booking-summary__value">
                  {selectedSlot
                    ? new Date(selectedSlot.startTime).toLocaleString('en-GH', {
                        weekday: 'short', month: 'short', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })
                    : '—'}
                </span>
              </div>
              <div className="booking-summary__row">
                <span className="booking-summary__label">Total</span>
                <span className="booking-summary__total">
                  {selectedService ? formatGHS(selectedService.price) : '—'}
                </span>
              </div>
            </div>

            {!isAuthenticated && (
              <div className="booking-guest-fields">
                <h2 className="section-title">Your details</h2>
                <div className="form-field">
                  <label htmlFor="guestName" className="form-label">Full name</label>
                  <input
                    id="guestName"
                    className="form-input"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Your full name"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="guestEmail" className="form-label">Email address</label>
                  <input
                    id="guestEmail"
                    type="email"
                    className="form-input"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="guestPhone" className="form-label">Phone number</label>
                  <input
                    id="guestPhone"
                    type="tel"
                    className="form-input"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+233 123 456 789"
                  />
                </div>
                <p className="booking-guest-note">
                  Booking as a guest. Already have an account? <Link to="/login">Sign in</Link> for faster checkout.
                </p>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="notes" className="form-label">Notes for your stylist (optional)</label>
              <textarea
                id="notes"
                className="form-textarea"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything your stylist should know…"
              />
            </div>

            <div className="form-field">
              <label htmlFor="promoCode" className="form-label">Promo code (optional)</label>
              {appliedPromocode ? (
                <div className="booking-promo-applied">
                  <span>
                    <strong>{appliedPromocode.code}</strong> applied —{' '}
                    {appliedPromocode.type === 'PERCENTAGE'
                      ? `${appliedPromocode.discount}% off`
                      : `GHS ${appliedPromocode.discount.toFixed(2)} off`}
                  </span>
                  <button type="button" className="booking-promo-remove" onClick={handleRemovePromo}>
                    Remove
                  </button>
                </div>
              ) : (
                <div className="booking-promo-input">
                  <input
                    id="promoCode"
                    className="form-input"
                    value={promoCodeInput}
                    onChange={(e) => setPromoCodeInput(e.target.value)}
                    placeholder="Enter code"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleApplyPromo}
                    disabled={validatePromo.isPending || !promoCodeInput.trim()}
                  >
                    {validatePromo.isPending ? 'Checking…' : 'Apply'}
                  </button>
                </div>
              )}
              {/* Final discount is always recalculated server-side at
                  payment time — this is a preview only, not a guarantee. */}
            </div>

            {paymentPolicy?.requireDeposit && (
              <div className="form-field">
                <label className="form-label">Deposit payment method</label>
                <div className="booking-payment-methods">
                  <button
                    type="button"
                    className={`booking-payment-method ${paymentMethod === 'MOBILE_MONEY' ? 'booking-payment-method--active' : ''}`}
                    onClick={() => setPaymentMethod('MOBILE_MONEY')}
                  >
                    Mobile Money
                  </button>
                  <button
                    type="button"
                    className={`booking-payment-method ${paymentMethod === 'CARD' ? 'booking-payment-method--active' : ''}`}
                    onClick={() => setPaymentMethod('CARD')}
                  >
                    Card
                  </button>
                </div>
                <p className="booking-deposit-note">
                  A {estimatedDepositLabel} deposit secures your slot. The remaining balance is paid directly to
                  your stylist at the salon (cash or MoMo).
                </p>
              </div>
            )}

            <button
              type="button"
              className="btn btn--gold btn--full btn--lg"
              onClick={handleConfirmAndPay}
              disabled={submitting || (!isAuthenticated && !guestFieldsComplete)}
            >
              {submitting
                ? 'Processing…'
                : paymentPolicy?.requireDeposit
                  ? `Pay ${estimatedDepositLabel} Deposit & Confirm`
                  : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>

      <div className="booking-nav">
        {step > 1 && (
          <button type="button" className="btn btn--ghost" onClick={prevStep} disabled={submitting}>
            Back
          </button>
        )}

        {step < 3 && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={nextStep}
            disabled={
              (step === 1 && !canProceedFromStep1) ||
              (step === 2 && !canProceedFromStep2)
            }
          >
            Continue
          </button>
        )}
      </div>
    </div>
  );
}