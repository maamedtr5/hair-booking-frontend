import { Link, useLocation } from 'react-router-dom';
import { Button } from '../../components/ui/Button';


export function ConfirmationPage() {
  const { state } = useLocation();
  const booking = state?.booking;

  return (
    <>
      <style>{`
        .confirm-page {
          min-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
        }
        .confirm-card {
          max-width: 480px;
          width: 100%;
          text-align: center;
          animation: fadeUp 0.5s ease both;
        }
        .confirm-icon {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: #D1FAE5;
          border: 3px solid #065F46;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          margin: 0 auto 24px;
          animation: fadeIn 0.6s 0.2s ease both;
        }
        .confirm-title {
          font-family: var(--font-display);
          font-size: 2rem;
          font-weight: 600;
          color: var(--espresso);
          margin-bottom: 10px;
        }
        .confirm-sub {
          font-size: 14px;
          color: var(--text-muted);
          line-height: 1.7;
          margin-bottom: 32px;
          max-width: 360px;
          margin-left: auto;
          margin-right: auto;
        }
        .confirm-ref {
          background: var(--cream-mid);
          border-radius: var(--radius-lg);
          padding: 18px 24px;
          margin-bottom: 28px;
          font-size: 13px;
          color: var(--text-secondary);
        }
        .confirm-ref-id {
          font-family: var(--font-display);
          font-size: 1.2rem;
          font-weight: 600;
          color: var(--espresso);
          letter-spacing: 0.04em;
        }
        .confirm-btns {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
      `}</style>

      <div className="confirm-page">
        <div className="confirm-card">
          <div className="confirm-icon">✓</div>
          <h1 className="confirm-title">Booking Confirmed!</h1>
          <p className="confirm-sub">
            Your appointment at Locs Allure has been successfully booked.
            We'll send you a reminder before your appointment.
          </p>

          {booking && (
            <div className="confirm-ref">
              <div style={{ marginBottom: 6 }}>Booking Reference</div>
              <div className="confirm-ref-id">#{booking.id}</div>
            </div>
          )}

          <div className="confirm-btns">
            <Link to="/my/bookings">
              <Button fullWidth size="lg">View My Bookings</Button>
            </Link>
            <Link to="/book">
              <Button fullWidth variant="outline" size="md">
                Book Another Appointment
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
