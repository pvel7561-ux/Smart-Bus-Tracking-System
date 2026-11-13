import React from 'react';
import { NavLink } from 'react-router-dom';
import authService from '../services/authService';

const Sidebar = () => {
  const user = authService.getUser();
  const isAdmin = user?.role === 'admin';
  const isDriver = user?.role === 'driver';

  const linkStyle = ({ isActive }) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    color: isActive ? '#ea580c' : '#78350f',
    backgroundColor: isActive ? 'linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)' : 'transparent',
    border: isActive ? '1.5px solid #fed7aa' : '1.5px solid transparent',
    fontWeight: isActive ? 800 : 600,
    textDecoration: 'none',
    fontSize: 14,
    transition: 'var(--transition)',
    boxShadow: isActive ? '0 2px 8px rgba(234, 88, 12, 0.12)' : 'none'
  });

  return (
    <aside style={{
      width: 260,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      borderRight: '2px solid #fed7aa',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      minHeight: 'calc(100vh - 72px)'
    }}>
      <div style={{ padding: '0 12px 12px', fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
        Navigation
      </div>

      <NavLink to="/passenger" style={linkStyle}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4M12 16V8"/></svg>
        Passenger Live Map
      </NavLink>

      {isDriver && (
        <>
          <div style={{ padding: '16px 12px 8px', fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Driver Controls
          </div>
          <NavLink to="/driver" style={linkStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><path d="M19.1 4.9C23 8.8 23 15.1 19.1 19M4.9 19.1C1 15.2 1 8.9 4.9 5"/></svg>
            GPS Tracking Console
          </NavLink>
        </>
      )}

      {isAdmin && (
        <>
          <div style={{ padding: '16px 12px 8px', fontSize: 11, fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
            Fleet Administration
          </div>
          <NavLink to="/admin" end style={linkStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>
            Dashboard Overview
          </NavLink>
          <NavLink to="/admin/buses" style={linkStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M8 6v6M15 6v6M2 12h19.6M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.2 6 18.2 6H5.8C4.8 6 3.9 6.8 3.6 7.8l-1.4 5c-.1.4-.2.8-.2 1.2 0 .4.1.8.2 1.2.3 1.1.8 2.8.8 2.8h3M7 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM17 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>
            Manage Buses
          </NavLink>
          <NavLink to="/admin/drivers" style={linkStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Manage Drivers
          </NavLink>
          <NavLink to="/admin/routes" style={linkStyle}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/></svg>
            Manage Routes &amp; Stops
          </NavLink>
        </>
      )}

      <div style={{ marginTop: 'auto', padding: '16px 12px', borderTop: '1.5px solid #fed7aa' }}>
        <div style={{ fontSize: 12, color: '#78350f', lineHeight: 1.6 }}>
          <strong>Fleet Network:</strong><br />
          <span style={{ color: '#16a34a', fontWeight: 700 }}>● Online</span> | Orange-Gold Corridor
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
