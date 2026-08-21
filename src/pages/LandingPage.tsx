import { Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { GettingHere } from '../components/GettingHere';
import { useServices } from '../hooks/useServices';
import { usePaymentPolicy } from '../hooks/useSettings';
import { Spinner } from '../components/ui/Spinner';
import { computeDepositAmount } from '../utils/formatCurrency';
import { formatDuration } from '../utils/formatDate';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
  }).format(price);
}

export function LandingPage() {
  const { data: services, isLoading } = useServices();
  // Read-only, public endpoint (see settingsRoutes.js) — safe to call without
  // auth. Used here only to *display* the deposit figure; the actual charge
  // is always recomputed and enforced server-side at payment time.
  const { data: paymentPolicy } = usePaymentPolicy();
  const featured = (services ?? []).filter((s) => s.isActive).slice(0, 3);

  return (
    <div className="landing-page">
      <Navbar variant="public" />

      <section className="landing-hero">
        <div className="landing-hero__content">
          <span className="landing-hero__eyebrow">Madina Estates, Accra</span>
          <h1 className="landing-hero__title">
            Beautiful locs, braids &amp; natural hair. Crafted with care
          </h1>
          <p className="landing-hero__sub">
            Book your appointment online in minutes. Choose your stylist, your time,
            and let us take care of the rest.
          </p>
          <div className="landing-hero__actions">
            <Link to="/book" className="btn btn--gold btn--lg">Book Now</Link>
            <Link to="/register" className="btn btn--ghost btn--lg">Create Account</Link>
          </div>
        </div>
      </section>

      <section className="landing-trust container">
        <p className="landing-trust__headline">
          Trained in loc &amp; natural hair care.
        </p>
        <p className="landing-trust__caption">
          Book online in minutes — no calls needed
          <span className="divider">·</span>
          Pay by card or MoMo, deposit only upfront
        </p>
      </section>

      <section className="landing-services container">
        <div className="landing-services__header">
          <div>
            <p className="landing-services__eyebrow">Popular services</p>
          </div>
          <Link to="/book" className="landing-services__link">View all →</Link>
        </div>

        {isLoading ? (
          <div className="spinner-overlay"><Spinner size="lg" /></div>
        ) : (
          <>
            <div className="landing-services__list">
              {featured.map((service) => {
                const deposit = paymentPolicy
                  ? computeDepositAmount(service.price, paymentPolicy)
                  : 0;
                return (
                  <Link key={service.id} to="/book" className="landing-service-row">
                    <div>
                      <div className="landing-service-row__name">{service.name}</div>
                      <div className="landing-service-row__meta">
                        {formatDuration(service.duration)}
                        {paymentPolicy?.requireDeposit && deposit > 0 && (
                          <> · deposit {formatPrice(deposit)}</>
                        )}
                      </div>
                    </div>
                    <div className="landing-service-row__price">{formatPrice(service.price)}</div>
                  </Link>
                );
              })}
            </div>
            <div className="landing-services__cta">
              <Link to="/book" className="btn btn--gold">Book now</Link>
            </div>
          </>
        )}
      </section>

      <GettingHere />

      <footer className="landing-footer">
        <p>Locs Allure — Madina Estates, Accra, Ghana © {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
}