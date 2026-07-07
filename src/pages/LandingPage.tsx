import { Link } from 'react-router-dom';
import { Scissors, Clock, ShieldCheck } from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useServices } from '../hooks/useServices';
import { Spinner } from '../components/ui/Spinner';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
    minimumFractionDigits: 0,
  }).format(price);
}

export function LandingPage() {
  const { data: services, isLoading } = useServices();
  const featured = (services ?? []).filter((s) => s.isActive).slice(0, 3);

  return (
    <div className="landing-page">
      <Navbar variant="public" />

      <section className="landing-hero">
        <div className="landing-hero__content">
          <span className="landing-hero__eyebrow">Madina Estates, Accra</span>
          <h1 className="landing-hero__title">
            Beautiful locs, braids &amp; natural hair — crafted with care
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

      <section className="landing-features container">
        <div className="landing-feature">
          <div className="landing-feature__icon"><Scissors size={22} /></div>
          <h3 className="landing-feature__title">Skilled Stylists</h3>
          <p className="landing-feature__body">
            Every member of our team is trained in protective styling, natural hair
            care, and loc maintenance.
          </p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature__icon"><Clock size={22} /></div>
          <h3 className="landing-feature__title">Easy Scheduling</h3>
          <p className="landing-feature__body">
            Pick a service, a stylist, and a time that works for you — all online,
            no phone calls needed.
          </p>
        </div>
        <div className="landing-feature">
          <div className="landing-feature__icon"><ShieldCheck size={22} /></div>
          <h3 className="landing-feature__title">Secure Payments</h3>
          <p className="landing-feature__body">
            Pay safely by card or mobile money through Paystack — Ghana's trusted
            payment partner.
          </p>
        </div>
      </section>

      <section className="landing-services container">
        <div className="landing-services__header">
          <h2 className="section-title">Popular Services</h2>
          <Link to="/book" className="landing-services__link">View all →</Link>
        </div>

        {isLoading ? (
          <div className="spinner-overlay"><Spinner size="lg" /></div>
        ) : (
          <div className="landing-services__grid">
            {featured.map((service) => (
              <div key={service.id} className="landing-service-card">
                <h3 className="landing-service-card__name">{service.name}</h3>
                {service.description && (
                  <p className="landing-service-card__desc">{service.description}</p>
                )}
                <div className="landing-service-card__footer">
                  <span className="landing-service-card__price">
                    {formatPrice(service.price)}
                  </span>
                  <Link to="/book" className="btn btn--ghost btn--sm">Book</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer className="landing-footer">
        <p>Locs Allure — Madina Estates, Accra, Ghana</p>
      </footer>
    </div>
  );
}