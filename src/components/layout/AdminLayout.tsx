 import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Navbar } from './Navbar'; // global navbar with logo + hamburger
import { Calendar, User, BarChart2, Settings } from 'react-feather';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { useNotifications } from '../../hooks/useNotifications';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: null },
  { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar },
  { to: '/dashboard/staff', label: 'Staff', icon: User },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart2 },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userId = user?.id ?? 0;
  const unread = useUnreadCount(userId);
  const { data: notifications = [] } = useNotifications(userId);

  const styles = {
    root: { display: 'flex', minHeight: '100vh', paddingTop: '64px' },
    sidebar: {
      width: collapsed ? '64px' : '220px',
      background: 'var(--espresso)',
      display: 'flex',
      flexDirection: 'column' as React.CSSProperties['flexDirection'],
      position: 'fixed' as React.CSSProperties['position'],
      top: 0,
      left: 0,
      bottom: 0,
      zIndex: 50,
      transition: 'width var(--transition-slow)',
      overflow: 'hidden',
    },
    logoContainer: {
      padding: collapsed ? '20px 0' : '24px 20px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    logoMark: {
      width: 32,
      height: 32,
      borderRadius: 8,
      background: 'var(--gold)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 16,
      fontWeight: 700,
      color: 'var(--espresso)',
      flexShrink: 0,
    },
    logoText: {
      fontFamily: 'var(--font-display)',
      fontSize: '1rem',
      fontWeight: 600,
      color: 'var(--gold-light)',
      whiteSpace: 'nowrap',
      opacity: collapsed ? 0 : 1,
      transition: 'opacity var(--transition)',
    },
    nav: { flex: 1, padding: '12px 0' },
    navItem: (isActive: boolean): React.CSSProperties => ({
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: collapsed ? '12px 0' : '10px 16px',
      justifyContent: collapsed ? 'center' : 'flex-start',
      textDecoration: 'none',
      color: 'var(--sidebar-text)',
      fontSize: 13.5,
      fontWeight: isActive ? 500 : 400,
      borderLeft: `3px solid ${isActive ? 'var(--gold)' : 'transparent'}`,
      margin: '2px 0',
      borderRadius: 0,
      transition: 'all var(--transition)',
      position: 'relative',
      whiteSpace: 'nowrap',
      backgroundColor: isActive ? 'var(--espresso-mid)' : 'transparent',
    }),
    navIcon: { fontSize: 16, flexShrink: 0 },
    navLabel: { opacity: collapsed ? 0 : 1, transition: 'opacity var(--transition)' },
    footer: {
      padding: collapsed ? '12px 0' : '16px',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      justifyContent: collapsed ? 'center' : 'flex-start',
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: '50%',
      background: 'var(--espresso-soft)',
      border: '1.5px solid var(--gold-muted)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'var(--font-display)',
      fontSize: 13,
      fontWeight: 600,
      color: 'var(--gold-light)',
      flexShrink: 0,
    },
    userInfo: { flex: 1, minWidth: 0, opacity: collapsed ? 0 : 1, transition: 'opacity var(--transition)' },
    userName: {
      fontSize: 12.5,
      fontWeight: 500,
      color: 'var(--sidebar-text)',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    userRole: {
      fontSize: 10.5,
      color: 'var(--text-muted)',
      textTransform: 'uppercase',
      letterSpacing: '0.06em',
    },
    logoutBtn: {
      width: 28,
      height: 28,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: 'var(--text-muted)',
      fontSize: 14,
      borderRadius: 'var(--radius-sm)',
      transition: 'all var(--transition)',
      flexShrink: 0,
      opacity: collapsed ? 0 : 1,
    },
    toggleBtn: {
      position: 'absolute' as const,
      top: 24,
      right: -12,
      width: 24,
      height: 24,
      borderRadius: '50%',
      background: 'var(--espresso-soft)',
      border: '1.5px solid rgba(255,255,255,0.12)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      zIndex: 10,
      transition: 'all var(--transition)',
    } as React.CSSProperties,
    mainArea: {
      marginLeft: collapsed ? '64px' : '220px',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      transition: 'margin-left var(--transition-slow)',
      minHeight: '100vh',
    } as React.CSSProperties,
    topbar: {
      height: 60,
      background: 'var(--bg-card)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      position: 'sticky' as const,
      top: 64, // sits below global Navbar
      zIndex: 40,
    },
    topbarTitle: {
      fontFamily: 'var(--font-display)',
      fontSize: '1.1rem',
      fontWeight: 600,
      color: 'var(--espresso)',
    },
    actionsContainer: { display: 'flex', alignItems: 'center', gap: 8, position: 'relative' as React.CSSProperties['position'] },
    notifButton: {
      position: 'relative' as const,
      width: 36,
      height: 36,
      background: 'var(--cream-mid)',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: 16,
      transition: 'all var(--transition)',
    } as React.CSSProperties,
  };

  return (

      <Navbar /> {/* Global Navbar always visible */}

      <div style={styles.root}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          <div style={styles.logoContainer}>
            <div style={styles.logoMark}>A</div>
            <span style={styles.logoText}>Admin</span>
          </div>
          <nav style={styles.nav}>
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                style={({ isActive }) => styles.navItem(isActive)}
              >
                {Icon && <Icon style={styles.navIcon} />}
                <span style={styles.navLabel}>{label}</span>
              </NavLink>
            ))}
          </nav>
          <div style={styles.footer}>
            <div style={styles.avatar}>{user?.name?.[0] ?? 'A'}</div>
            <div style={styles.userInfo}>
              <div style={styles.userName}>{user?.name}</div>
              <div style={styles.userRole}>Admin</div>
            </
    notifButton: {
      position: 'relative' as const,
      width: 36,
      height: 36,
      background: 'var(--cream-mid)',
      border: 'none',
      borderRadius: 'var(--radius-md)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      fontSize: 16,
      transition: 'all var(--transition)',
    } as React.CSSProperties,
    notifButtonHover: { background: 'var(--cream-dark)' },
    notifBadge: {
      position: 'absolute' as const,
      top: -3,
      right: -3,
      minWidth: 16,
      height: 16,
      padding: '0 4px',
      background: '#C62828',
      color: '#fff',
      fontSize: 9,
      fontWeight: 700,
      borderRadius: 'var(--radius-full)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1.5px solid var(--bg-card)',
    } as React.CSSProperties,
    notifDropdown: {
      position: 'absolute' as const,
      top: 48,
      right: 0,
      width: 320,
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 200,
      overflow: 'hidden',
      animation: 'fadeUp 0.15s ease',
    } as React.CSSProperties,
    notifHeader: {
      padding: '14px 16px',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 13,
      fontWeight: 500,
      color: 'var(--espresso)',
    },
    notifItem: (isUnread: boolean) => ({
      padding: '12px 16px',
      borderBottom: '1px solid var(--cream-mid)',
      fontSize: 12.5,
      color: 'var(--text-secondary)',
      lineHeight: 1.5,
      cursor: 'default',
      background: isUnread ? '#FFFDF7' : 'inherit',
    }),
    notifEmpty: {
      padding: '24px 16px',
      textAlign: 'center',
      fontSize: 13,
      color: 'var(--text-muted)',
      fontStyle: 'italic',
    } as React.CSSProperties,

    // Page content styles
    content: {
      flex: 1,
      padding: '32px 28px',
      background: 'var(--bg-primary)',
    },
  };

  return (
    <>
      {/* Optional style for animations */}
      <style>
        {`
          @keyframes fadeUp {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>

      <div style={styles.root}>
        {/* Sidebar */}
        <aside style={styles.sidebar}>
          {/* Collapse toggle button */}
          <button
            style={styles.toggleBtn}
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? '›' : '‹'}
          </button>

          {/* Logo section */}
          <div style={styles.logoContainer}>
            <div style={styles.logoMark}>L</div>
            {!collapsed && (
              <span style={styles.logoText}>Locs Allure</span>
            )}
          </div>

          {/* Navigation menu */}
          <nav style={styles.nav} aria-label="Admin navigation">
            {NAV.map(({ to, label, icon }) => {
              const Icon = icon;
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/dashboard'}
                  style={({ isActive }) => styles.navItem(isActive)}
                >
                  {Icon && <Icon style={styles.navIcon} />}
                  {!collapsed && <span style={styles.navLabel}>{label}</span>}
                </NavLink>
              );
            })}
          </nav>

          {/* User info and logout */}
          <div style={styles.footer}>
            <div style={styles.avatar}>{user?.name?.charAt(0).toUpperCase() ?? 'A'}</div>
            {!collapsed && (
              <>
                <div style={styles.userInfo}>
                  <div style={styles.userName}>{user?.name}</div>
                  <div style={styles.userRole}>Admin</div>
                </div>
                <button style={styles.logoutBtn} onClick={logout} title="Sign out">
                  ⎋
                </button>
              </>
            )}
          </div>
        </aside>

        {/* Main area */}
        <div style={styles.mainArea}>
          {/* Topbar */}
          <header style={styles.topbar}>
            <span style={styles.topbarTitle}>Locs Allure — Dashboard</span>
            {/* Actions: notifications */}
            <div style={styles.actionsContainer}>
              <button
                style={styles.notifButton}
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
              >
                
                {unread > 0 && (
                  <span style={styles.notifBadge}>{unread > 9 ? '9+' : unread}</span>
                )}
              </button>

              {/* Notifications dropdown */}
              {notifOpen && (
                <div style={styles.notifDropdown}>
                  <div style={styles.notifHeader}>
                    Notifications
                    {unread > 0 && (
                      <span
                        style={{
                          fontSize: 11,
                          background: 'var(--cream-mid)',
                          padding: '2px 8px',
                          borderRadius: 20,
                          color: 'var(--text-muted)',
                        }}
                      >
                        {unread} new
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div style={styles.notifEmpty}>No notifications</div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        style={styles.notifItem(!n.read)}
                        className={!n.read ? 'unread' : ''}
                      >
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Main page content */}
          <main style={styles.content}>
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}