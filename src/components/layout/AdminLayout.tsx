import React, { useState, useRef, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Users,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  ClipboardList,
  UserCircle,
  Scissors,
  Tag,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications, useUnreadCount } from '../../hooks/useNotifications';
import { ThemeToggle } from '../ui/ThemeToggle';


const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar, end: false },
  { to: '/dashboard/appointments', label: 'Appointments', icon: ClipboardList, end: false },
  { to: '/dashboard/clients', label: 'Clients', icon: UserCircle, end: false },
  { to: '/dashboard/services', label: 'Services', icon: Scissors, end: false },
  { to: '/dashboard/promocodes', label: 'Promo codes', icon: Tag, end: false },
  { to: '/dashboard/staff', label: 'Staff', icon: Users, end: false },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart2, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!notifOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [notifOpen]);

  const userId = user?.id ?? 0;
  const unread = useUnreadCount(userId);
  const { data: notifications = [] } = useNotifications(userId);

  const sidebarWidth = collapsed ? 64 : 220; // sidebar width in px — desktop only, ignored below the mobile breakpoint

  return (
    <div
      className="admin-root admin-root--full"
      style={{ '--sw': `${sidebarWidth}px` } as React.CSSProperties}
    >
      {/* Below the mobile breakpoint the sidebar becomes an off-canvas
          drawer instead of a permanent grid column (see the
          "ADMIN — MOBILE" media query in index.css) — this backdrop
          closes it on outside tap, same pattern as the notif dropdown. */}
      {mobileOpen && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar navigation */}
      <aside
        className={`admin-sidebar${mobileOpen ? ' admin-sidebar--open' : ''}`}
        aria-label="Admin navigation"
      >
        {/* Collapse/Expand toggle — desktop only; hidden on mobile via CSS
            since the drawer's own close button (below) replaces it there. */}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* Brand mark — the sidebar is now the only nav, so it carries branding too */}
        <div className={`sidebar-brand${collapsed ? ' collapsed-link' : ''}`}>
          <span className="sidebar-brand__mark">LA</span>
          {!collapsed && <span className="sidebar-brand__name">Locs Allure</span>}
          <button
            className="sidebar-mobile-close"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
          <nav
            style={{
              flex: 1,
              padding: '12px 0',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            {NAV.map(({ to, label, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `sidebar-nav-link${isActive ? ' active' : ''}${
                    collapsed ? ' collapsed-link' : ''
                  }`
                }
              >
                <Icon size={16} strokeWidth={1.8} style={{ flexShrink: 0 }} />
                {!collapsed && <span className="nav-label">{label}</span>}
              </NavLink>
            ))}
          </nav>

          {/* Sidebar footer with user info and logout */}
          <div
            className={`sidebar-footer${collapsed ? ' collapsed-footer' : ''}`}
          >
            <div className="sidebar-avatar">
              {user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            {!collapsed && (
              <>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="sidebar-user-name">{user?.name}</div>
                  <div className="sidebar-user-role">Admin</div>
                </div>
                <button
                  className="sidebar-logout"
                  onClick={logout}
                  title="Sign out"
                >
                  <LogOut size={14} />
                </button>
              </>
            )}
          </div>
        </aside>

      {/* Main content column */}
        <div className="admin-main">
          <header className="admin-header">
            <button
              className="admin-header-hamburger"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={20} strokeWidth={1.8} />
            </button>
            <ThemeToggle />
            <button
              className="admin-header-logout"
              onClick={logout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={16} strokeWidth={1.8} />
              <span>Sign out</span>
            </button>
            <div className="notif-wrap" ref={notifRef}>
              <button
                className="notif-btn"
                onClick={() => setNotifOpen((o) => !o)}
                aria-label={`Notifications${unread > 0 ? `, ${unread} unread` : ''}`}
              >
                <Bell size={16} strokeWidth={1.8} />
                {unread > 0 && (
                  <span className="notif-dot">{unread > 9 ? '9+' : unread}</span>
                )}
              </button>

              {notifOpen && (
                <div className="notif-dropdown">
                  <div className="notif-header">
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
                    <div className="notif-empty">No notifications</div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div key={n.id} className={`notif-item${!n.read ? ' unread' : ''}`}>
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </header>

          <main className="admin-content">
            <Outlet />
          </main>
        </div>
      </div>
  );
}