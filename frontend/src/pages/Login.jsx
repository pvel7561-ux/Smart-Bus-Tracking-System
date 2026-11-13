import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.login(formData.username, formData.password);
      const role = data.user?.role;
      if (role === 'admin') {
        navigate('/admin');
      } else if (role === 'driver') {
        navigate('/driver');
      } else {
        navigate('/passenger');
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.non_field_errors?.[0] ||
        err.response?.data?.detail ||
        'Invalid credentials. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (username, password) => {
    setFormData({ username, password });
  };

  return (
    <div style={{
      minHeight: 'calc(100vh - 72px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      position: 'relative',
      backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.72) 0%, rgba(234, 88, 12, 0.65) 50%, rgba(245, 158, 11, 0.7) 100%), url('/bg-bus.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat'
    }}>
      <div style={{
        maxWidth: 450,
        width: '100%',
        background: 'rgba(255, 255, 255, 0.96)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.45)',
        padding: '38px 34px',
        border: '2px solid rgba(254, 215, 170, 0.9)',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Header with 2nd Bus Image Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 74,
            height: 74,
            borderRadius: 20,
            overflow: 'hidden',
            border: '3px solid #f97316',
            boxShadow: '0 8px 20px rgba(234, 88, 12, 0.4)',
            margin: '0 auto 14px',
            background: '#1c1917',
            padding: 3
          }}>
            <img
              src="/logo-bus.jpg"
              alt="SmartBus Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                borderRadius: 14
              }}
            />
          </div>
          <h1 style={{
            fontSize: 24,
            fontWeight: 800,
            color: '#1c1917',
            letterSpacing: '-0.3px'
          }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: 14, color: '#9a3412', fontWeight: 600, marginTop: 4 }}>
            Smart Bus Live Telemetry Portal
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '10px 14px',
            borderRadius: 'var(--radius)',
            fontSize: 13,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            border: '1px solid rgba(239, 68, 68, 0.2)'
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" style={{ color: '#7c2d12' }}>Username</label>
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="e.g. admin or driver_rajesh"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#7c2d12' }}>Password</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 8, fontSize: 16 }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Demo Logins in Orange & Yellow theme */}
        <div style={{ marginTop: 26, paddingTop: 20, borderTop: '1.5px solid #fed7aa' }}>
          <div style={{
            fontSize: 11,
            fontWeight: 800,
            color: '#b45309',
            textTransform: 'uppercase',
            marginBottom: 10,
            textAlign: 'center',
            letterSpacing: '0.6px'
          }}>
            Quick 1-Click Demo Accounts
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillQuickDemo('admin', 'admin123')}
            >
              Admin
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillQuickDemo('driver_rajesh', 'driver123')}
            >
              Driver
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fillQuickDemo('passenger_kavya', 'passenger123')}
            >
              Passenger
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#78350f' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#ea580c', fontWeight: 800, textDecoration: 'none' }}>
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
