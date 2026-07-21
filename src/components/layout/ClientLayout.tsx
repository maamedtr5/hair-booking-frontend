// components/layout/ClientLayout.tsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthcontext';
import { ToastContainer } from '../ui/Toast';

export default function ClientLayout() {
  const { user, isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?';

  return (
    <div className="client-layout">
      <header className="client-nav">
        <NavLink to="/" className="client-nav__brand">
          <svg width="26" height="26" viewBox="0 0 32 32" fill="none" aria-hidden="true">
            <circle cx="16" cy="16" r="16" fill="#2c1a0e"/>
            <path d="M10 22 Q16 10 22 22" stroke="#c9a96e" strokeWidth="2" fill="none" strokeLinecap="round"/>
            <circle cx="16" cy="12" r="2.5" fill="#c9a96e"/>
          </svg>
          <span className="client-nav__brand-name">Locs Allure</span>
        </NavLink>

        <nav className="client-nav__links" aria-label="Main navigation">
          <NavLink to="/book" className={({ isActive }) => `client-nav__link ${isActive ? 'client-nav__link--active' : ''}`}>
            Book
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/my/bookings" className={({ isActive }) => `client-nav__link ${isActive ? 'client-nav__link--active' : ''}`}>
              My Bookings
            </NavLink>
          )}
        </nav>

        <div className="client-nav__actions">
          {isAuthenticated ? (
            <div className="client-nav__user-menu">
              <NavLink to="/profile" className="client-nav__avatar" aria-label="My profile">
                {initials}
              </NavLink>
              <button
                type="button"
                onClick={() => { logout(); navigate('/login'); }}
                className="client-nav__logout"
              >
                Sign out
              </button>
            </div>
          ) : (
            <>
              <NavLink to="/login" className="client-nav__link">Sign in</NavLink>
              <NavLink to="/book" className="btn btn--primary btn--sm">Book now</NavLink>
            </>
          )}
        </div>
      </header>

      <main className="client-main">
        <Outlet />
      </main>

      <ToastContainer />
    </div>
  );
}