import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookingFlowStore } from '../../store/bookingFlowStore';
import { useAuthContext } from '../../hooks/useAuthcontext';
import { useCreateAppointment } from '../../hooks/useAppointments';
import { useCreateBooking } from '../../hooks/usebookings';
import { useInitializePayment } from '../../hooks/usePayments';
import { ServiceSelector } from '../../components/booking/ServiceSelector';
import { StaffPicker } from '../../components/booking/StaffPicker';
import { SlotCalender } from '../../components/booking/SlotCalender';
import { ConsentForm } from '../../components/forms/ConsentForm';
import { toast } from '../../store/uiStore';
import { getErrorMessage } from '../../utils/apiClient';
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
  { num: 4, label: 'Review & Pay' },
] as const;

export function BookingPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const {
    step, nextStep, prevStep,
    selectedService, selectedStaff, selectedSlot,
    notes, setNotes,
    reset,
  } = useBookingFlowStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('MOBILE_MONEY');
  const [submitting, setSubmitting] = useState(false);

  const createAppointment = useCreateAppointment();
  const createBooking = useCreateBooking();
  const initPayment = useInitializePayment();

  
  const clientId = user?.client?.id;

  const canProceedFromStep1 = !!selectedService;
  const canProceedFromStep2 = !!selectedSlot; // staff is optional ("no preference")

  async function handleConfirmAndPay() {
    if (!selectedService || !selectedSlot) {
      toast.error('Please complete all booking steps.');
      return;
    }
    if (!clientId) {
      toast.error('Your account is missing a client profile. Please contact support.');
      return;
    }
    if (!user?.email) {
      toast.error('Your account is missing an email address for payment.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create the appointment
      const appointment = await createAppointment.mutateAsync({
        serviceId: selectedService.id,
        staffId:   selectedStaff?.id,
        date:      selectedSlot.startTime,
        notes:     notes || undefined,
      });

      // 2. Wrap it in a booking tied to this client
      const booking = await createBooking.mutateAsync({
        appointmentId: appointment.id,
        clientId,
      });

      // 3. Initialise payment — Paystack returns a redirect URL
      const paymentRes = await initPayment.mutateAsync({
        bookingId: booking.id,
        amount:    selectedService.price,
        method:    paymentMethod,
        email:     user.email,
      });

      reset(); // clear booking flow state — the flow is complete

      if (paymentRes.authorizationUrl) {
        // Redirect to Paystack. Paystack will redirect back to a
        // confirmation URL configured on the backend after payment.
        window.location.href = paymentRes.authorizationUrl;
      } else {
        // No payment URL returned — go straight to confirmation and let
        // it poll the real payment status from the backend.
        navigate(`/booking/confirmation/${booking.id}`);
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
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
            {i < STEPS.length - 1 && <span className="booking-step__divider" />}
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

        {step === 3 && clientId && (
          <ConsentForm clientId={clientId} onComplete={() => nextStep()} />
        )}

        {step === 3 && !clientId && (
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
              <label className="form-label">Payment method</label>
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
            </div>

            <button
              type="button"
              className="btn btn--gold btn--full btn--lg"
              onClick={handleConfirmAndPay}
              disabled={submitting}
            >
              {submitting ? 'Processing…' : `Pay ${selectedService ? formatGHS(selectedService.price) : ''} & Confirm`}
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