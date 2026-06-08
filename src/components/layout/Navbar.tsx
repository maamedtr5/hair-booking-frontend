import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Scissors, Bell, LogOut, Calendar, BookOpen, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { Button } from '../ui/Button';

export function Navbar() {
  const { isAuthenticated, user, isAdmin, isStaff, isClient, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const unread = useUnreadCount(user?.id ?? 0);

  const location = useLocation();

  // Handle scroll to toggle 'scrolled' state
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu when route changes (safe pattern)
  useEffect(() => {
    if (menuOpen) {
      // schedule state update after paint
      setTimeout(() => setMenuOpen(false), 0);
    }
  }, [location, menuOpen]);

  // Lock body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  // Build navigation links based on role
  type NavLinkItem = {
    to: string;
    label: string;
    icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  };
  const navLinks: NavLinkItem[] = isAdmin
    ? [
        { to: '/dashboard', label: 'Overview', icon: LayoutDashboard },
        { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
      ]
    : isStaff
    ? [
        { to: '/staff/schedule', label: 'My Schedule', icon: Calendar },
      ]
    : isClient
    ? [
        { to: '/book', label: 'Book Now', icon: Scissors },
        ...(isAuthenticated ? [{ to: '/my/bookings', label: 'My Bookings', icon: BookOpen }] : []),
      ]
    : [];

  return (
    <>
      {/* Styles */}
      <style>{`
        /* Navbar container styles */
        .navbar {
          position: fixed;
          top: 0; left: 0; right: 0;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          z-index: 100;
          transition: background 0.35s ease, box-shadow 0.35s ease, backdrop-filter 0.35s ease;
        }
        /* State styles */
        .navbar.top {
          background: transparent;
          box-shadow: none;
        }
        .navbar.scrolled {
          background: rgba(250, 246, 240, 0.88);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 1px 0 rgba(28,16,8,0.08);
        }
        .navbar.solid {
          background: var(--espresso);
          box-shadow: 0 1px 0 rgba(255,255,255,0.06);
        }

        /* Logo styles */
        .navbar-logo {
          display: flex; align-items: center; gap: 10px;
          text-decoration: none; flex-shrink: 0;
        }
        .navbar-logo-mark {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 17px; font-weight: 700;
          flex-shrink: 0;
          transition: background var(--transition), color var(--transition);
        }
        /* Logo mark color based on state */
        .navbar.solid .navbar-logo-mark { background: var(--gold); color: var(--espresso); }
        .navbar.scrolled .navbar-logo-mark, .navbar.top .navbar-logo-mark { background: var(--espresso); color: var(--gold); }

        /* Brand styles */
        .navbar-brand {
          font-family: var(--font-display);
          font-size: 1.1rem; font-weight: 600;
          letter-spacing: 0.02em;
          transition: color var(--transition);
        }
        .navbar.solid .navbar-brand { color: var(--gold-light); }
        .navbar.scrolled .navbar-brand, .navbar.top .navbar-brand { color: var(--espresso); }

        /* Desktop links container */
        .navbar-links {
          display: flex; align-items: center; gap: 2px;
          flex: 1; justify-content: center;
        }
        /* Individual link styles */
        .navbar-link {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 13px;
          text-decoration: none;
          font-size: 13.5px; font-weight: 400;
          border-radius: var(--radius-md);
          transition: all var(--transition);
          white-space: nowrap;
        }
        /* Link hover & active styles based on state */
        .navbar.solid .navbar-link { color: var(--sidebar-text); }
        .navbar.scrolled .navbar-link, .navbar.top .navbar-link { color: var(--text-secondary); }
        .navbar.solid .navbar-link:hover { background: var(--espresso-soft); color: var(--gold-light); }
        .navbar.scrolled .navbar-link:hover { background: var(--cream-mid); color: var(--espresso); }
        .navbar.top .navbar-link:hover { background: rgba(28,16,8,0.06); color: var(--espresso); }
        .navbar.solid .navbar-link.active { color: var(--gold); background: rgba(201,168,76,0.12); font-weight: 500; }
        .navbar.scrolled .navbar-link.active, .navbar.top .navbar-link.active { color: var(--gold-muted); font-weight: 500; }

        /* Actions container (notif + auth) */
        .navbar-actions {
          display: flex; align-items: center; gap: 8px; flex-shrink: 0;
        }

        /* Notification button styles */
        .navbar-notif {
          position: relative;
          width: 36px; height: 36px;
          border: none; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all var(--transition);
        }
        /* Notification styles based on state */
        .navbar.solid .navbar-notif { background: rgba(255,255,255,0.08); color: var(--sidebar-text); }
        .navbar.scrolled .navbar-notif, .navbar.top .navbar-notif { background: var(--cream-mid); color: var(--text-secondary); }
        .navbar-notif:hover { background: var(--cream-dark) !important; color: var(--espresso) !important; }

        /* Notification dot (unread indicator) */
        .notif-dot {
          position: absolute; top: 4px; right: 4px;
          width: 8px; height: 8px; border-radius: 50%;
          background: #C62828;
          border: 1.5px solid var(--bg-card);
        }
        .navbar.solid .notif-dot { border-color: var(--espresso); }

        /* Hamburger menu styles */
        .hamburger {
          width: 36px; height: 36px;
          background: none; border: none;
          display: none; align-items: center; justify-content: center;
          cursor: pointer; border-radius: var(--radius-md);
          transition: background var(--transition);
        }
        .hamburger:hover { background: var(--cream-mid); }
        .navbar.solid .hamburger:hover { background: var(--espresso-soft); }

        /* Mobile menu overlay styles */
        .mobile-menu-overlay {
          display: none;
          position: fixed; inset: 0; z-index: 99;
          background: rgba(28,16,8,0.4);
          backdrop-filter: blur(2px);
          animation: fadeIn 0.2s ease;
        }
        /* Show overlay when menu is open */
        .mobile-menu-overlay.show { display: block; }

        /* Mobile menu container styles */
        .mobile-menu {
          position: fixed;
          top: 64px; left: 0; right: 0;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border);
          z-index: 99;
          padding: 12px 16px 20px;
          display: flex; flex-direction: column; gap: 4px;
          animation: slideDown 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: var(--shadow-lg);
        }
        /* Mobile links styles */
        .mobile-link {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px;
          text-decoration: none;
          font-size: 14px; font-weight: 400;
          color: var(--text-secondary);
          border-radius: var(--radius-md);
          transition: all var(--transition);
        }
        /* Hover & active states for mobile links */
        .mobile-link:hover { background: var(--cream-mid); color: var(--espresso); }
        .mobile-link.active { color: var(--gold-muted); font-weight: 500; background: #FFFDF7; }

        /* Divider in mobile menu */
        .mobile-divider {
          height: 1px; background: var(--border);
          margin: 8px 0;
        }

        /* User info in mobile menu */
        .mobile-user {
          display: flex; align-items: center; gap: 10px;
          padding: 11px 14px;
          font-size: 13.5px; color: var(--text-muted);
        }
        .mobile-avatar {
          width: 30px; height: 30px; border-radius: 50%;
          background: var(--espresso);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display);
          font-size: 13px; font-weight: 600; color: var(--gold);
          flex-shrink: 0;
        }

        /* Animations */
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .navbar-links { display: none; }
          .hamburger { display: flex; }
        }
        @media (min-width: 769px) {
          .mobile-menu { display: none !important; }
          .mobile-menu-overlay { display: none !important; }
        }
      `}</style>

      {/* Navbar header */}
      <header className={`navbar ${isAdmin || isStaff ? 'solid' : scrolled ? 'scrolled' : 'top'}`}>
        {/* Logo */}
        <Link to={isAdmin ? '/dashboard' : isStaff ? '/staff/schedule' : '/book'} className="navbar-logo">
          <div className="navbar-logo-mark">L</div>
          <span className="navbar-brand">Locs Allure</span>
        </Link>

        {/* Desktop navigation links */}
        <nav className="navbar-links" aria-label="Main navigation">
          {navLinks.map(({ to, label, icon: Icon }: { to: string; label: string; icon: React.ComponentType<{ size: number; strokeWidth: number }> }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
            >
              <Icon size={14} strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions: notifications + auth + hamburger */}
        <div className="navbar-actions">
          {isAuthenticated && (
            <button
              className="navbar-notif"
              aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
              onClick={() => navigate(isAdmin ? '/dashboard' : '/my/bookings')}
            >
              <Bell size={16} strokeWidth={1.8} />
              {unread > 0 && <span className="notif-dot" aria-hidden="true" />}
            </button>
          )}

          {!isAuthenticated && (
            <Button variant="primary" size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}

          {/* Hamburger menu for mobile */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <X size={20} strokeWidth={1.8} color={isAdmin || isStaff ? 'var(--sidebar-text)' : 'var(--espresso)'} />
            ) : (
              <Menu size={20} strokeWidth={1.8} color={isAdmin || isStaff ? 'var(--sidebar-text)' : 'var(--espresso)'} />
            )}
          </button>
        </div>
      </header>

      {/* Mobile menu overlay & drawer */}
      {menuOpen && (
        <>
          <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)} />
          <nav className="mobile-menu" aria-label="Mobile navigation">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/dashboard'}
                className={({ isActive }) => `mobile-link${isActive ? ' active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={16} strokeWidth={1.8} />
                {label}
              </NavLink>
            ))}

            {isAuthenticated && (
              <>
                <div className="mobile-divider" />
                <div className="mobile-user">
                  <div className="mobile-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div style={{ fontWeight: 500, color: 'var(--espresso)', fontSize: 13 }}>
                      {user?.name}
                    </div>
                    <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {user?.role}
                    </div>
                  </div>
                </div>
                <button
                  className="mobile-link"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                  }}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <LogOut size={16} strokeWidth={1.8} />
                  Sign Out
                </button>
              </>
            )}

            {!isAuthenticated && (
              <>
                <div className="mobile-divider" />
                <div style={{ padding: '8px 14px' }}>
                  <Button
                    fullWidth
                    onClick={() => {
                      navigate('/login');
                      setMenuOpen(false);
                    }}
                  >
                    Sign In
                  </Button>
                </div>
              </>
            )}
          </nav>
        </>
      )}
    </>
  );
}