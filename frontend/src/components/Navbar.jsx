import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Navbar = () => {
  const navigate = useNavigate();
  const user = authService.getUser();
  const isAuthenticated = authService.isAuthenticated();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      borderBottom: '2px solid #fed7aa',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.08)'
    }}>
      <div style={{
        maxWidth: 1440,
        margin: '0 auto',
        padding: '0 24px',
        height: 72,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo with 2nd Bus Image */}
        <Link to="/" style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          textDecoration: 'none',
          color: 'var(--gray-900)'
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            overflow: 'hidden',
            border: '2px solid #f97316',
            background: 'linear-gradient(135deg, #1c1917, #0f172a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(234, 88, 12, 0.35)',
            flexShrink: 0,
            padding: 2
          }}>
            <img
              src="/logo-bus.jpg"
              alt="SmartBus Fleet Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 10
              }}
            />
          </div>
          <div>
            <div style={{
              fontWeight: 800,
              fontSize: 20,
              letterSpacing: '-0.4px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#1c1917'
            }}>
              Smart<span style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #d97706 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800
              }}>Bus</span>
              <span style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#b45309',
                backgroundColor: '#fef3c7',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid #fde68a'
              }}>
                TRACKING
              </span>
            </div>
            <div style={{ fontSize: 11, color: '#9a3412', fontWeight: 600 }}>
              Live GPS Fleet &amp; Transit Navigator
            </div>
          </div>
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {isAuthenticated && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {user?.role === 'admin' && (
                <>
                  <Link to="/admin" style={{ textDecoration: 'none', color: '#7c2d12', fontWeight: 700, fontSize: 14 }}>
                    Admin Panel
                  </Link>
                  <Link to="/admin/buses" style={{ textDecoration: 'none', color: '#7c2d12', fontWeight: 700, fontSize: 14 }}>
                    Buses
                  </Link>
                  <Link to="/admin/routes" style={{ textDecoration: 'none', color: '#7c2d12', fontWeight: 700, fontSize: 14 }}>
                    Routes
                  </Link>
                </>
              )}

              {user?.role === 'driver' && (
                <Link to="/driver" style={{
                  textDecoration: 'none',
                  color: '#ea580c',
                  fontWeight: 700,
                  fontSize: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '7px 14px',
                  backgroundColor: '#fff7ed',
                  borderRadius: 'var(--radius)',
                  border: '1.5px solid #fed7aa',
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.1)'
                }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>
                  Driver GPS Console
                </Link>
              )}

              <Link to="/passenger" style={{
                textDecoration: 'none',
                color: '#7c2d12',
                fontWeight: 700,
                fontSize: 14,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4M12 16V8"/></svg>
                Passenger Map
              </Link>
            </div>
          )}

          {/* User Profile / Auth Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#1c1917' }}>
                    {user?.first_name || user?.username}
                  </div>
                  <span className="badge badge-role" style={{ fontSize: 10, padding: '2px 8px' }}>
                    {user?.role?.toUpperCase()}
                  </span>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary btn-sm" title="Log out">
                  Logout
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <Link to="/login" className="btn btn-secondary btn-sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
