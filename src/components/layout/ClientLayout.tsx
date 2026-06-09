import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Navbar } from './Navbar'; 
import '../../styles/layout/ClientLayout.css';

interface ClientLayoutProps {
  children?: React.ReactNode;
}

export function ClientLayout({ children }: ClientLayoutProps) {
  const { isAuthenticated } = useAuth();

  return (
    <>
      {/* Global Navbar — switches between public and client */}
      <Navbar variant={isAuthenticated ? 'client' : 'public'} />

      <div className="client-root">
        {/* Main Content */}
        <main className="client-content">
          {children ?? <Outlet />}
        </main>

        {/* Footer */}
        <footer className="client-footer">
          <p>
            © {new Date().getFullYear()} Locs Allure · Madina Estates, Accra ·{' '}
            <a href="tel:+233208690943">+233 20 869 0943</a>
          </p>
        </footer>
      </div>
    </>
  );
}
