import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, Scissors } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { useLocation } from 'react-router-dom';
import '../../styles/layout/navbar.css';

interface NavbarProps {
  variant?: 'public' | 'client' | 'staff' | 'admin';
}

export function Navbar({ variant = 'public' }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

  const closeMenu = () => setMenuOpen(false);

  // Links per variant
  type NavLinkItem = { to: string; label: string; action?: () => void }; 
   const links: NavLinkItem[] = (() => {
    if (variant === 'admin') return [
      { to: '/dashboard',          label: 'Overview'  },
      { to: '/dashboard/calendar', label: 'Calendar'  },
      { to: '/dashboard/staff',    label: 'Staff'     },
      { to: '/dashboard/reports',  label: 'Reports'   },
      { to: '/dashboard/settings', label: 'Settings'  },
    ];
    if (variant === 'staff') return [
      { to: '/staff/schedule', label: 'My Schedule' },
    ];
    if (variant === 'client') return [
      { to: '/services',      label: 'Services'   },   
      { to: '/booking',       label: 'Book Now'   },  
      { to: '/my/bookings',   label: 'My Bookings'},
      {to: 'logout', label: 'Sign Out', action: () => logout()}
      ];
     return [
      { to: '/services', label: 'Services' },         
      { to: '/login',    label: 'Sign In' ,action: () => navigate('/login')}, 
      { to : '/register', label: 'Register' },    
       
    ];
  })();
   
  return (
    <>
   
   <header className={`navbar variant-${variant}${scrolled ? ' scrolled' : ''}`}>
        <Link to={variant === 'admin' ? '/dashboard' : '/book'} className="navbar-logo">
          <div className="navbar-logo-mark">
            <Scissors size={17} strokeWidth={2} />
          </div>
          <span className="navbar-logo-name">Locs Allure</span>
        </Link>

        <nav className="navbar-links" aria-label="Main navigation">
          {links.map(({ to, label, action }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}
              onClick={action || closeMenu}  
            >
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <>
              <span className="navbar-user-chip">{user?.name?.split(' ')[0]}</span>
              <Button variant="ghost" size="sm" onClick={logout}>Sign Out</Button>
            </>
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
            aria-expanded={menuOpen}          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer — rendered outside header so it doesn't inherit fixed positioning */}
      <div className={`navbar-drawer${menuOpen ? ' open' : ''}`} role="navigation">
        {links.map(({ to, label, action }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard'}
            className={({ isActive }) => `drawer-link${isActive ? ' active' : ''}`}
            onClick={action || (() => setMenuOpen(false)    )}
          >
            {label}
          </NavLink>
        ))}

        {isAuthenticated && (
          <>
            <div className="drawer-divider" />
            <button
              onClick={() => { logout(); setMenuOpen(false); }}
              className="drawer-link"
              style={{ textAlign: 'left', width: '100%' }}
            >
              Sign Out
            </button>
          </>
        )}
      </div>
    </>
  );
}

