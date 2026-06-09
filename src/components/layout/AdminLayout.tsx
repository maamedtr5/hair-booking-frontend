import React, { useState } from 'react';
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
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications, useUnreadCount } from '../../hooks/useNotifications';
import { Navbar } from './Navbar';
import '../../styles/layout/adminLayout.css';

const NAV = [
  { to: '/dashboard', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/dashboard/calendar', label: 'Calendar', icon: Calendar, end: false },
  { to: '/dashboard/staff', label: 'Staff', icon: Users, end: false },
  { to: '/dashboard/reports', label: 'Reports', icon: BarChart2, end: false },
  { to: '/dashboard/settings', label: 'Settings', icon: Settings, end: false },
];

export function AdminLayout() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const userId = user?.id ?? 0;
  const unread = useUnreadCount(userId);
  const { data: notifications = [] } = useNotifications(userId);

  const sidebarWidth = collapsed ? 64 : 220; // sidebar width in px

  return (
    <>
      {/* Navbar at the top */}
      <Navbar variant="admin" />

      {/* Main layout container */}
      <div
        className="admin-root"
        style={{ '--sw': `${sidebarWidth}px` } as React.CSSProperties}
      >
        {/* Sidebar navigation */}
        <aside className="admin-sidebar" aria-label="Admin navigation">
          {/* Collapse/Expand toggle */}
          <button
            className="sidebar-toggle"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>

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

        {/* Main Content Area */}
        <div className="admin-main">
          <main className="admin-content">
            
           </main>
       </div>
          {/* Notifications */}
          <header className="admin-header">
            <div className="notif-wrap">
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

              {/* Notification Dropdown */}
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
                      <div
                        key={n.id}
                        className={`notif-item${!n.read ? ' unread' : ''}`}
                      >
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </header>

          {/* Page Content */}
          <main className="admin-content">
            <Outlet />
          </main>
        </div>
    </>
  );
}