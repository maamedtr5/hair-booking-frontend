import React, { Fragment, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '../../components/ui/Button';
import { PageSpinner, Spinner } from '../../components/ui/Spinner';

import { useAuth } from '../../hooks/useAuth';
import { useAvailableSlots } from '../../hooks/useSlots';
import { useServices } from '../../hooks/useServices';
import { useStaff } from '../../hooks/useStaff';

import { useBookingFlowStore } from '../../store/bookingFlowStore';
import { toast } from '../../store/uiStore';

import apiClient, { getErrorMessage } from '../../utils/apiClient';

import {
  formatAppointmentDate,
  formatDuration,
  formatSlotRange,
} from '../../utils/formatDate';

import {
  applyDiscount,
  formatGHS,
} from '../../utils/formatCurrency';

import type {
  Service,
  Slot,
  Staff,
} from '../../types/models';


const STEPS = [
  'Service',
  'Stylist',
  'Time',
  'Confirm',
] as const;

const MAX_PROMO_LENGTH = 50;


const handleEnterKey = (
  event: KeyboardEvent<HTMLElement>,
  callback: () => void,
) => {
  if (event.key === 'Enter') {
    callback();
  }
};


function StepBar({
  current,
}: {
  current: number;
}) {
  return (
    <>
      <style>{`
        .step-bar {
          display: flex;
          align-items: center;
          margin-bottom: 36px;
        }

        .step-wrapper {
          position: relative;
          margin-bottom: 14px;
        }

        .step-circle {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 13px;
          font-weight: 600;
          border: 2px solid var(--border);
          background: var(--bg-card);
          color: var(--text-muted);
          flex-shrink: 0;
          transition: all 0.3s ease;
          position: relative;
          z-index: 1;
        }

        .step-circle.done {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--espresso);
        }

        .step-circle.active {
          background: var(--espresso);
          border-color: var(--espresso);
          color: var(--gold);
          box-shadow: 0 0 0 4px rgba(28,16,8,0.1);
        }

        .step-label {
          position: absolute;
          top: 34px;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 6px;
          white-space: nowrap;
          text-align: center;
          font-size: 11.5px;
          font-weight: 500;
          color: var(--text-muted);
        }

        .step-label.active {
          color: var(--espresso);
          font-weight: 600;
        }

        .step-label.done {
          color: var(--gold-muted);
        }

        .step-connector {
          flex: 1;
          height: 2px;
          margin: 0 4px 14px;
          background: var(--border);
          transition: background 0.3s ease;
        }

        .step-connector.done {
          background: var(--gold);
        }
      `}</style>

      <div className="step-bar">
        {STEPS.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < current;
          const isActive = stepNumber === current;

          return (
            <Fragment key={label}>
              <div className="step-wrapper">
                <div
                  className={[
                    'step-circle',
                    isCompleted && 'done',
                    isActive && 'active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {isCompleted ? '✓' : stepNumber}
                </div>

                <span
                  className={[
                    'step-label',
                    isCompleted && 'done',
                    isActive && 'active',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  className={`step-connector${
                    isCompleted ? ' done' : ''
                  }`}
                />
              )}
            </Fragment>
          );
        })}
      </div>
    </>
  );
}


function ServiceStep() {
  const { data: services = [], isLoading } = useServices();

  const {
    selectedService,
    setService,
    nextStep,
  } = useBookingFlowStore();

  const activeServices = useMemo(
    () => services.filter(service => service.isActive),
    [services],
  );

  if (isLoading) {
    return <PageSpinner message="Loading services…" />;
  }

  return (
    <>
      <h2 className="step-title">
        Choose a service
      </h2>

      <p className="step-sub">
        Select the style you'd like for your appointment
      </p>

      <div className="service-grid">
        {activeServices.map((service: Service) => {
          const isSelected =
            selectedService?.id === service.id;

          return (
            <div
              key={service.id}
              className={`service-card${
                isSelected ? ' selected' : ''
              }`}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              onClick={() => setService(service)}
              onKeyDown={event =>
                handleEnterKey(event, () =>
                  setService(service),
                )
              }
            >
              {isSelected && (
                <span className="service-check">
                  ✓
                </span>
              )}

              <div className="service-card-name">
                {service.name}
              </div>

              {service.description && (
                <div className="service-card-desc">
                  {service.description}
                </div>
              )}

              <div className="service-card-meta">
                <span>
                  ⏱ {formatDuration(service.duration)}
                </span>

                <span className="service-price">
                  {formatGHS(service.price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        size="lg"
        disabled={!selectedService}
        onClick={nextStep}
      >
        Continue with {selectedService?.name ?? '...'} →
      </Button>
    </>
  );
}


function StaffStep() {
  const { data: staff = [], isLoading } = useStaff();

  const {
    selectedStaff,
    setStaff,
    nextStep,
    prevStep,
  } = useBookingFlowStore();

  if (isLoading) {
    return (
      <PageSpinner message="Loading stylists…" />
    );
  }

  return (
    <>
      <h2 className="step-title">
        Choose your stylist
      </h2>

      <p className="step-sub">
        Select a preferred stylist, or let us assign
        one for you
      </p>

      <div className="staff-grid">
        <div
          className={`no-pref-card${
            selectedStaff === null
              ? ' selected'
              : ''
          }`}
          role="radio"
          tabIndex={0}
          aria-checked={selectedStaff === null}
          onClick={() => setStaff(null)}
          onKeyDown={event =>
            handleEnterKey(event, () =>
              setStaff(null),
            )
          }
        >
          <div
            style={{
              fontSize: 24,
              marginBottom: 8,
            }}
          >
            ✦
          </div>

          <div
            style={{
              fontWeight: 500,
              marginBottom: 4,
            }}
          >
            No preference
          </div>

          <div style={{ fontSize: 12 }}>
            We'll assign the best available stylist
          </div>
        </div>

        {staff.map((member: Staff) => {
          const isSelected =
            selectedStaff?.id === member.id;

          const stylistName =
            member.user?.name ??
            `Stylist #${member.id}`;

          const avatarLetter =
            member.user?.name
              ?.charAt(0)
              .toUpperCase() ?? 'S';

          return (
            <div
              key={member.id}
              className={`staff-card${
                isSelected ? ' selected' : ''
              }`}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              onClick={() => setStaff(member)}
              onKeyDown={event =>
                handleEnterKey(event, () =>
                  setStaff(member),
                )
              }
            >
              {isSelected && (
                <span className="staff-check">
                  ✓
                </span>
              )}

              <div className="staff-avatar">
                {avatarLetter}
              </div>

              <div className="staff-name">
                {stylistName}
              </div>

              {member.bio && (
                <div className="staff-bio">
                  {member.bio}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="step-actions">
        <Button
          variant="outline"
          size="lg"
          onClick={prevStep}
        >
          ← Back
        </Button>

        <Button
          size="lg"
          onClick={nextStep}
        >
          Continue →
        </Button>
      </div>
    </>
  );
}


function TimeStep() {
  const {
    selectedStaff,
    selectedSlot,
    selectedDate,
    setSlot,
    setDate,
    nextStep,
    prevStep,
  } = useBookingFlowStore();

  const today = useMemo(
    () => new Date().toISOString().split('T')[0],
    [],
  );

  const [pickedDate, setPickedDate] = useState(
    selectedDate ?? today,
  );

  const {
    data: slots = [],
    isLoading,
  } = useAvailableSlots(
    selectedStaff?.id ?? null,
    pickedDate,
  );

  const stylistName =
    selectedStaff?.user?.name ??
    'your stylist';

  const formattedDate =
    formatAppointmentDate(
      `${pickedDate}T00:00:00`,
    );

  const hasSlots = slots.length > 0;

  const handleDateChange = (
    date: string,
  ) => {
    setPickedDate(date);
    setDate(date);

    // Reset slot selection when
    // switching to a different day.
    setSlot(null);
  };

  const renderSlots = () => {
    if (isLoading) {
      return null;
    }

    if (!hasSlots) {
      return (
        <div className="slots-empty">
          No available slots on{' '}
          {formattedDate}.
          <br />
          <span
            style={{
              fontSize: 13,
            }}
          >
            Try a different date.
          </span>
        </div>
      );
    }

    return (
      <div className="slots-grid">
        {slots.map((slot: Slot) => {
          const isBooked =
            slot.isBooked;

          const isSelected =
            selectedSlot?.id === slot.id;

          return (
            <button
              key={slot.id}
              type="button"
              disabled={isBooked}
              aria-pressed={isSelected}
              onClick={() => {
                if (!isBooked) {
                  setSlot(slot);
                }
              }}
              className={[
                'slot-btn',
                isBooked && 'booked',
                isSelected && 'selected',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <div className="slot-time">
                {formatSlotRange(
                  slot.startTime,
                  slot.endTime,
                )}
              </div>

              <div className="slot-status">
                {isBooked
                  ? 'Taken'
                  : 'Available'}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <style>{`
        .time-date-row {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 24px;
        }

        .time-date-label {
          font-size: 12px;
          font-weight: 500;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }

        .time-date-input {
          padding: 9px 14px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-family: var(--font-body);
          font-size: 14px;
          color: var(--espresso);
          background: var(--bg-card);
          outline: none;
          cursor: pointer;
          transition: border-color var(--transition);
        }

        .time-date-input:focus {
          border-color: var(--gold);
          box-shadow: var(--shadow-gold);
        }

        .slots-grid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fill,
              minmax(130px, 1fr)
            );
          gap: 10px;
          margin-bottom: 28px;
        }

        .slot-btn {
          padding: 12px 8px;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          background: var(--bg-card);
          cursor: pointer;
          text-align: center;
          transition: all var(--transition);
          font-family: var(--font-body);
        }

        .slot-btn:hover {
          border-color: var(--gold-light);
          background: #FFFDF7;
        }

        .slot-btn.selected {
          border-color: var(--gold);
          background: #FFFDF7;
          box-shadow: var(--shadow-gold);
        }

        .slot-btn.booked {
          opacity: 0.4;
          cursor: not-allowed;
          background: var(--cream-mid);
          border-style: dashed;
        }

        .slot-time {
          font-size: 13.5px;
          font-weight: 500;
          color: var(--espresso);
        }

        .slot-status {
          font-size: 11px;
          color: var(--text-muted);
          margin-top: 3px;
        }

        .slots-empty {
          padding: 40px 20px;
          text-align: center;
          font-style: italic;
          color: var(--text-muted);
          font-family: var(--font-display);
          font-size: 1rem;
          border: 1.5px dashed var(--border);
          border-radius: var(--radius-lg);
          margin-bottom: 28px;
        }
      `}</style>

      <h2 className="step-title">
        Pick a time
      </h2>

      <p className="step-sub">
        Available slots for{' '}
        {stylistName}
      </p>

      <div className="time-date-row">
        <span className="time-date-label">
          Date
        </span>

        <input
          type="date"
          min={today}
          value={pickedDate}
          className="time-date-input"
          aria-label="Select date"
          onChange={event =>
            handleDateChange(
              event.target.value,
            )
          }
        />

        {isLoading && (
          <Spinner size="sm" />
        )}
      </div>

      {renderSlots()}

      <div className="step-actions">
        <Button
          variant="outline"
          size="lg"
          onClick={prevStep}
        >
          ← Back
        </Button>

        <Button
          size="lg"
          disabled={!selectedSlot}
          onClick={nextStep}
        >
          Continue →
        </Button>
      </div>
    </>
  );
}


function ConfirmStep() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const {
    selectedService,
    selectedStaff,
    selectedSlot,
    appliedPromocode,
    notes,
    setNotes,
    setPromocode,
    prevStep,
    reset,
  } = useBookingFlowStore();

  const [promoInput, setPromoInput] =
    useState('');

  const [promoLoading, setPromoLoading] =
    useState(false);

  const [promoError, setPromoError] =
    useState('');

  const [submitting, setSubmitting] =
    useState(false);

  
  const basePrice =
    selectedService?.price ?? 0;

  const finalPrice = useMemo(() => {
    if (!appliedPromocode) {
      return basePrice;
    }

    return applyDiscount(
      basePrice,
      appliedPromocode.discount,
      appliedPromocode.type,
    );
  }, [appliedPromocode, basePrice]);

  const stylistName =
    selectedStaff?.user?.name ??
    'Any available stylist';

  const serviceDuration =
    selectedService
      ? formatDuration(
          selectedService.duration,
        )
      : '—';


  const handlePromoInputChange = (
    value: string,
  ) => {
    setPromoInput(
      value.toUpperCase(),
    );

    if (promoError) {
      setPromoError('');
    }
  };

  const handleApplyPromo =
    async () => {
      const code =
        promoInput.trim();

      if (!code) {
        return;
      }

      setPromoLoading(true);
      setPromoError('');

      try {
        const response =
          await apiClient.get(
            `/promocodes/code/${code}`,
          );

        const promo =
          response.data.data ??
          response.data;

        if (!promo?.isActive) {
          throw new Error(
            'This promo code has expired',
          );
        }

        setPromocode(promo);

        toast.success(
          `${promo.discount}${
            promo.type ===
            'PERCENTAGE'
              ? '%'
              : ' GHS'
          } discount applied!`,
        );
      } catch (error) {
        setPromoError(
          getErrorMessage(error),
        );

        setPromocode(null);
      } finally {
        setPromoLoading(false);
      }
    };

 

  const createAppointment =
    async () => {
      if (
        !selectedService ||
        !selectedSlot
      ) {
        throw new Error(
          'Missing booking details',
        );
      }

      const response =
        await apiClient.post(
          '/appointments',
          {
            serviceId:
              selectedService.id,

            staffId:
              selectedStaff?.id ??
              undefined,

            date:
              selectedSlot.startTime,

            notes:
              notes || undefined,

            status: 'PENDING',
          },
        );

      return (
        response.data.data ??
        response.data
      );
    };

  const createBooking =
    async (
      appointment: {
        id: number;
        clientId?: number | null;
      },
    ) => {
      const response =
        await apiClient.post(
          '/bookings',
          {
            appointmentId:
              appointment.id,

            clientId:
              appointment.clientId ??
              1,

            promocodeId:
              appliedPromocode?.id ??
              undefined,
          },
        );

      return (
        response.data.data ??
        response.data
      );
    };

  const initializePayment =
    async (
      bookingId: number,
    ) => {
      const response =
        await apiClient.post(
          '/payments/init',
          {
            bookingId,
            amount: finalPrice,
            method: 'CARD',
            email:
              user?.email ?? '',
          },
        );

      return response.data;
    };



  const handleConfirm =
    async () => {
      if (
        !selectedService ||
        !selectedSlot
      ) {
        return;
      }

      setSubmitting(true);

      try {
        const appointment =
          await createAppointment();

        const booking =
          await createBooking(
            appointment,
          );

        const payment =
          await initializePayment(
            booking.id,
          );

        const authorizationUrl =
          payment.authorizationUrl ??
          payment.authorization_url;

        reset();

        if (
          authorizationUrl
        ) {
          window.location.href =
            authorizationUrl;

          return;
        }

        navigate(
          '/booking/confirmation',
          {
            state: { booking },
          },
        );
      } catch (error) {
        toast.error(
          getErrorMessage(error),
        );
      } finally {
        setSubmitting(false);
      }
    };

  return (
    <>
      <h2 className="step-title">
        Review & confirm
      </h2>

      <p className="step-sub">
        Check your booking details
        and proceed to payment
      </p>

      <div className="confirm-grid">
        {/* Left Column */}

        <div className="confirm-fields">
          <div>
            <label
              htmlFor="booking-notes"
              className="confirm-field-label"
            >
              Notes for your stylist
              (optional)
            </label>

            <textarea
              id="booking-notes"
              className="notes-textarea"
              maxLength={500}
              value={notes}
              placeholder="Any special requests, hair concerns, or instructions..."
              onChange={event =>
                setNotes(
                  event.target.value,
                )
              }
            />
          </div>

          <div>
            <label className="confirm-field-label">
              Promo code
            </label>

            <div className="promo-row">
              <input
                className="promo-input"
                placeholder="ENTER CODE"
                maxLength={MAX_PROMO_LENGTH}
                value={promoInput}
                onChange={event =>
                  handlePromoInputChange(
                    event.target.value,
                  )
                }
                onKeyDown={event => {
                  if (
                    event.key ===
                    'Enter'
                  ) {
                    handleApplyPromo();
                  }
                }}
              />

              <Button
                variant="outline"
                disabled={
                  !promoInput.trim()
                }
                loading={
                  promoLoading
                }
                onClick={
                  handleApplyPromo
                }
              >
                Apply
              </Button>
            </div>

            {promoError && (
              <div className="promo-error">
                ⚠ {promoError}
              </div>
            )}

            {appliedPromocode && (
              <div className="promo-success">
                ✓{' '}
                {
                  appliedPromocode.discount
                }
                {appliedPromocode.type ===
                'PERCENTAGE'
                  ? '%'
                  : ' GHS'}{' '}
                discount applied
              </div>
            )}
          </div>
        </div>

        {/* Summary Column */}

        <div>
          <div className="confirm-summary">
            <div className="confirm-summary-title">
              Booking Summary
            </div>

            <div className="confirm-line">
              <span className="confirm-line-label">
                Service
              </span>

              <span className="confirm-line-value">
                {
                  selectedService?.name
                }
              </span>
            </div>

            <div className="confirm-line">
              <span className="confirm-line-label">
                Stylist
              </span>

              <span className="confirm-line-value">
                {stylistName}
              </span>
            </div>

            {selectedSlot && (
              <div className="confirm-line">
                <span className="confirm-line-label">
                  Date & Time
                </span>

                <span className="confirm-line-value">
                  {formatAppointmentDate(
                    selectedSlot.startTime,
                  )}

                  <br />

                  <span
                    style={{
                      fontSize: 12,
                      color:
                        'var(--text-muted)',
                    }}
                  >
                    {formatSlotRange(
                      selectedSlot.startTime,
                      selectedSlot.endTime,
                    )}
                  </span>
                </span>
              </div>
            )}

            <div className="confirm-line">
              <span className="confirm-line-label">
                Duration
              </span>

              <span className="confirm-line-value">
                {
                  serviceDuration
                }
              </span>
            </div>

            <div className="confirm-total">
              <span className="confirm-total-label">
                Total
              </span>

              <div
                style={{
                  textAlign:
                    'right',
                }}
              >
                {appliedPromocode && (
                  <span className="confirm-original">
                    {formatGHS(
                      basePrice,
                    )}
                  </span>
                )}

                <span className="confirm-total-price">
                  {formatGHS(
                    finalPrice,
                  )}
                </span>
              </div>
            </div>
          </div>

          <div
            className="confirm-actions"
            style={{
              marginTop: 16,
            }}
          >
            <Button
              size="lg"
              fullWidth
              loading={
                submitting
              }
              disabled={
                !selectedService ||
                !selectedSlot
              }
              onClick={
                handleConfirm
              }
            >
              Pay{' '}
              {formatGHS(
                finalPrice,
              )}{' '}
              via Paystack →
            </Button>

            <Button
              variant="ghost"
              size="sm"
              disabled={
                submitting
              }
              onClick={
                prevStep
              }
              style={{
                textAlign:
                  'center',
              }}
            >
              ← Back
            </Button>

            <div className="paystack-note">
               Secure payment
              powered by Paystack
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export function BookingPage() {
  const { step } = useBookingFlowStore();

  const renderCurrentStep = () => {
    switch (step) {
      case 1:
        return <ServiceStep />;

      case 2:
        return <StaffStep />;

      case 3:
        return <TimeStep />;

      case 4:
        return <ConfirmStep />;

      default:
        return <ServiceStep />;
    }
  };

  return (
    <>
      <style>{`
        .booking-page {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 0 80px;
        }

        .booking-header {
          margin-bottom: 40px;
        }

        .booking-hero-title {
          font-family: var(--font-display);
          font-size: clamp(2rem, 4vw, 2.8rem);
          font-weight: 600;
          line-height: 1.15;
          color: var(--espresso);
          margin-bottom: 8px;
        }

        .booking-hero-sub {
          max-width: 460px;
          font-size: 15px;
          line-height: 1.7;
          color: var(--text-muted);
        }

        .booking-card {
          padding: 36px 40px;
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-sm);
        }

        @media (max-width: 600px) {
          .booking-page {
            padding: 24px 0 60px;
          }

          .booking-card {
            padding: 24px 20px;
          }
        }
      `}</style>

      <div className="booking-page animate-fade-up">
        <header className="booking-header">
          <h1 className="booking-hero-title">
            Book an Appointment
          </h1>

          <p className="booking-hero-sub">
            Premium hair care at Locs Allure,
            Madina Estates, Accra.
            Beautiful results, every time.
          </p>
        </header>

        <section className="booking-card">
          <StepBar current={step} />
          {renderCurrentStep()}
        </section>
      </div>
    </>
  );
}