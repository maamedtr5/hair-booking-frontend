import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { useBooking } from '../../hooks/usebookings';
import { Spinner } from '../../components/ui/Spinner';

function formatGHS(value: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
  }).format(value);
}

export function ConfirmationPage() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const id = bookingId ? Number(bookingId) : 0;

  const { data: booking, isLoading, isError, refetch } = useBooking(id);

  const paymentStatus = booking?.payment?.status;
  const isPending = paymentStatus === 'PENDING';

  // Poll while payment is still pending — the Paystack webhook can lag
  // a few seconds behind the redirect. We never treat the redirect itself
  // as confirmation; only the backend payment record decides success.
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (isPending) {
      pollRef.current = setInterval(() => refetch(), 4000);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isPending, refetch]);

  if (!bookingId) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <AlertTriangle size={40} className="confirmation-icon confirmation-icon--warning" />
          <h1 className="confirmation-title">No booking reference found</h1>
          <p className="confirmation-sub">
            We couldn't find a booking to confirm. If you just completed a payment,
            check "My Bookings" for the latest status.
          </p>
          <Link to="/my/bookings" className="btn btn--primary">View My Bookings</Link>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="confirmation-page">
        <div className="spinner-overlay">
          <Spinner size="lg" />
          <p>Checking your booking…</p>
        </div>
      </div>
    );
  }

  if (isError || !booking) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <XCircle size={40} className="confirmation-icon confirmation-icon--error" />
          <h1 className="confirmation-title">Booking not found</h1>
          <p className="confirmation-sub">
            We couldn't load this booking. If you believe this is a mistake,
            contact us with your booking reference.
          </p>
          <Link to="/my/bookings" className="btn btn--primary">View My Bookings</Link>
        </div>
      </div>
    );
  }

  // ── Payment failed ──────────────────────────────────────────────────
  if (paymentStatus === 'FAILED') {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <XCircle size={40} className="confirmation-icon confirmation-icon--error" />
          <h1 className="confirmation-title">Payment failed</h1>
          <p className="confirmation-sub">
            Your appointment was reserved but payment didn't go through.
            You can try paying again from your bookings page.
          </p>
          <div className="confirmation-ref">
            <div>Booking Reference</div>
            <div className="confirmation-ref__id">#{booking.id}</div>
          </div>
          <Link to="/my/bookings" className="btn btn--primary">Go to My Bookings</Link>
        </div>
      </div>
    );
  }

  // ── Payment still pending / webhook lag ─────────────────────────────
  if (isPending || !booking.payment) {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <Clock size={40} className="confirmation-icon confirmation-icon--pending" />
          <h1 className="confirmation-title">Confirming your payment…</h1>
          <p className="confirmation-sub">
            This usually takes a few seconds. This page will update automatically —
            no need to refresh.
          </p>
          <div className="confirmation-ref">
            <div>Booking Reference</div>
            <div className="confirmation-ref__id">#{booking.id}</div>
          </div>
        </div>
      </div>
    );
  }

  // ── Waitlisted — every stylist was already booked for this time ──────
  const service = booking.appointment?.service;
  const staff = booking.appointment?.staff;

  if (booking.appointment?.status === 'WAITLISTED') {
    return (
      <div className="confirmation-page">
        <div className="confirmation-card">
          <Clock size={40} className="confirmation-icon confirmation-icon--pending" />
          <h1 className="confirmation-title">You're on the waitlist</h1>
          <p className="confirmation-sub">
            Every stylist is already booked for your requested time. We've saved your
            spot on the waitlist and will email and text you the moment a slot opens up —
            no action needed from you right now.
          </p>

          <div className="confirmation-ref">
            <div>Booking Reference</div>
            <div className="confirmation-ref__id">#{booking.id}</div>
          </div>

          <div className="confirmation-details">
            <div className="confirmation-details__row">
              <span>Service</span>
              <span>{service?.name ?? '—'}</span>
            </div>
            <div className="confirmation-details__row">
              <span>Requested time</span>
              <span>
                {booking.appointment?.date
                  ? new Date(booking.appointment.date).toLocaleString('en-GH', {
                      weekday: 'short', month: 'short', day: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : '—'}
              </span>
            </div>
          </div>

          <div className="confirmation-actions">
            <Link to="/my/bookings" className="btn btn--primary btn--full">View My Bookings</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Confirmed ────────────────────────────────────────────────────────

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <CheckCircle2 size={40} className="confirmation-icon confirmation-icon--success" />
        <h1 className="confirmation-title">Booking confirmed!</h1>
        <p className="confirmation-sub">
          Your appointment at Locs Allure has been booked and paid for.
          We'll send you a reminder before your appointment.
        </p>

        <div className="confirmation-ref">
          <div>Booking Reference</div>
          <div className="confirmation-ref__id">#{booking.id}</div>
        </div>

        <div className="confirmation-details">
          <div className="confirmation-details__row">
            <span>Service</span>
            <span>{service?.name ?? '—'}</span>
          </div>
          <div className="confirmation-details__row">
            <span>Stylist</span>
            <span>{staff?.user?.name ?? 'No preference'}</span>
          </div>
          <div className="confirmation-details__row">
            <span>Date &amp; Time</span>
            <span>
              {booking.appointment?.date
                ? new Date(booking.appointment.date).toLocaleString('en-GH', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })
                : '—'}
            </span>
          </div>
          <div className="confirmation-details__row confirmation-details__row--total">
            <span>Amount paid</span>
            <span>{formatGHS(booking.payment.amount)}</span>
          </div>
        </div>

        <div className="confirmation-actions">
          <Link to="/my/bookings" className="btn btn--primary btn--full">View My Bookings</Link>
          <Link to="/book" className="btn btn--ghost btn--full">Book Another Appointment</Link>
        </div>
      </div>
    </div>
  );
}