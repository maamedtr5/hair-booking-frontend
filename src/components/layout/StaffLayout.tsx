import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { Navbar } from './Navbar'; 

export function StaffLayout() {
  const { user, logout } = useAuth();

  return (
    <>
      <Navbar /> {/* Global Navbar always visible */}

      <style>{`
        /* Root */
        .staff-root {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          padding-top: 64px; /* prevent content hiding behind fixed Navbar */
        }

        /* Topbar */
        .staff-topbar {
          background: var(--espresso-mid);
          height: 60px;
          display: flex;
          align-items: center;
          padding: 0 28px;
          gap: 24px;
          position: sticky;
          top: 64px; /* sits below global Navbar */
          z-index: 40;
        }
        .staff-brand {
          font-family: var(--font-display);
          font-size: 1rem;
          font-weight: 600;
          color: var(--gold-light);
          margin-right: 16px;
          white-space: nowrap;
        }

        /* Navigation */
        .staff-nav-link {
          font-size: 13px;
          color: var(--sidebar-text);
          text-decoration: none;
          padding: 6px 12px;
          border-radius: var(--radius-md);
          transition: all var(--transition);
          white-space: nowrap;
        }
        .staff-nav-link:hover {
          background: rgba(255,255,255,0.06);
          color: var(--gold-light);
        }
        .staff-nav-link.active {
          color: var(--gold);
          background: rgba(201,168,76,0.12);
        }

        /* Spacer */
        .staff-spacer {
          flex: 1;
        }

        /* User section */
        .staff-user {
          font-size: 12.5px;
          color: var(--sidebar-text);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Content */
        .staff-content {
          flex: 1;
          padding: 32px 28px;
          background: var(--bg-primary);
          max-width: 1200px;
          width: 100%;
          margin: 0 auto;
        }
      `}</style>

      <div className="staff-root">
        {/* Staff-specific Topbar */}
        <header className="staff-topbar">
          <span className="staff-brand">Locs Allure</span>

          <NavLink
            to="/staff/schedule"
            className={({ isActive }) =>
              `staff-nav-link${isActive ? ' active' : ''}`
            }
          >
            My Schedule
          </NavLink>

          <div className="staff-spacer" />

          <div className="staff-user">
            <span>{user?.name}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              style={{ color: 'var(--sidebar-text)', fontSize: 12 }}
            >
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <main className="staff-content">
          <Outlet />
        </main>
      </div>
    </>
  );
}
