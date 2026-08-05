import { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUnclaimedAppointments } from '../../hooks/useAppointments';
import { Button } from '../ui/Button';



interface NavbarProps {
  variant?: 'public' | 'client' | 'staff' | 'admin';
}

type NavLinkItem = { to: string; label: string; action?: () => void };

export function Navbar({ variant = 'public' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Badge count for the staff "Available" queue link. Only actually
  // fetches when it'll be shown — every other variant passes
  // enabled: false so this never fires an unnecessary (and, for a
  // CLIENT, unauthorized) request.
  const { data: unclaimedQueue } = useUnclaimedAppointments({
    enabled: variant === 'staff' && isAuthenticated,
  });
  const unclaimedCount = unclaimedQueue?.length ?? 0;

  // Scroll listener — legitimate external system sync
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close drawer on browser back/forward navigation.
  // Every NavLink onClick already calls closeMenu for normal in-app navigation,
  // so this only needs to handle history-based nav (back/forward buttons).
  // The ref guard skips the initial mount so no setState fires on load.
  const prevKeyRef = useRef(location.key);
  useEffect(() => {
    if (prevKeyRef.current !== location.key) {
      prevKeyRef.current = location.key;
      setMenuOpen(false);
    }
  }, [location.key]);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
  };

  // NOTE: logout is intentionally excluded from link arrays — it is
  // rendered separately in both desktop (navbar-actions) and mobile
  // (drawer isAuthenticated block) so it never duplicates.
  const links: NavLinkItem[] = (() => {
    if (variant === 'admin') return [
      { to: '/dashboard',          label: 'Overview'  },
      { to: '/dashboard/calendar', label: 'Calendar'  },
      { to: '/dashboard/staff',    label: 'Staff'     },
      { to: '/dashboard/reports',  label: 'Reports'   },
      { to: '/dashboard/settings', label: 'Settings'  },
    ];
   if (variant === 'staff') return [
      { to: '/staff/dashboard', label: 'Dashboard'   },
      { to: '/staff/schedule',  label: 'My Schedule' },
      { to: '/staff/queue',     label: 'Available'    },
    ];
    if (variant === 'client') return [
      { to: '/book',        label: 'Book Now'    },
      { to: '/my/bookings', label: 'My Bookings' },
    ];
    // public — auth actions (Sign In / Register) live in navbar-actions only,
    // never duplicated here as plain links too.
    return [
      { to: '/book', label: 'Book Now' },
    ];
  })();

  return (
    <>
      <header className={`navbar variant-${variant}${scrolled ? ' scrolled' : ''}`}>
        <Link
          to={variant === 'admin' ? '/dashboard' : variant === 'staff' ? '/staff/dashboard' : '/'}
          className="navbar-logo"
        >
          <img
            src="/logo.png"
            alt="Locs Allure"
            className="navbar-logo-mark"
            onError={(e) => {
              // Fallback if logo.png is ever missing from /public — keeps the
              // navbar usable instead of showing a broken-image icon.
              e.currentTarget.replaceWith(
                Object.assign(document.createElement('div'), {
                  className: 'navbar-logo-mark navbar-logo-mark--fallback',
                  innerHTML:
                    '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>',
                })
              );
            }}
          />
          <span className="navbar-logo-name">Locs Allure</span>
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          {links.map(({ to, label, action }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              onClick={action ?? closeMenu}
            >
              {label}
              {to === '/staff/queue' && unclaimedCount > 0 && (
                <span className="navbar-link__badge">{unclaimedCount}</span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div className="navbar-session">
              <span className="navbar-user-chip">{user?.name?.split(' ')[0]}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Sign Out</Button>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign In</Button>
              <Button variant="primary" size="sm" onClick={() => navigate('/register')}>Register</Button>
            </>
          )}

          <button
            className="navbar-hamburger"
            onClick={() => setMenuOpen(o => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer — outside header so it doesn't inherit fixed positioning */}
      <div className={`navbar-drawer${menuOpen ? ' open' : ''}`} role="navigation" aria-hidden={!menuOpen}>
        {links.map(({ to, label, action }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => `drawer-link${isActive ? ' active' : ''}`}
            onClick={action ?? closeMenu}
          >
            {label}
            {to === '/staff/queue' && unclaimedCount > 0 && (
              <span className="navbar-link__badge">{unclaimedCount}</span>
            )}
          </NavLink>
        ))}

        <div className="drawer-divider" />

        {isAuthenticated ? (
          <button
            onClick={handleLogout}
            className="drawer-link"
            style={{ textAlign: 'left', width: '100%' }}
          >
            Sign Out
          </button>
        ) : (
          <div className="drawer-auth">
            <Button variant="outline" fullWidth onClick={() => { navigate('/login'); closeMenu(); }}>
              Sign In
            </Button>
            <Button variant="primary" fullWidth onClick={() => { navigate('/register'); closeMenu(); }}>
              Register
            </Button>
          </div>
        )}
      </div>
    </>
  );
}