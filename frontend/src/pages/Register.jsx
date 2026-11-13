import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'passenger',
    phone_number: '',
    license_number: '',
    first_name: '',
    last_name: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await authService.register(formData);
      const role = data.user?.role;
      if (role === 'driver') {
        navigate('/driver');
      } else {
        navigate('/passenger');
      }
    } catch (err) {
      console.error(err);
      const errorData = err.response?.data;
      if (typeof errorData === 'object') {
        const firstKey = Object.keys(errorData)[0];
        const val = errorData[firstKey];
        setError(`${firstKey}: ${Array.isArray(val) ? val.join(' ') : val}`);
      } else {
        setError('Registration failed. Please check your details.');
      }
    } finally {
      setLoading(false);
    }
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
        maxWidth: 520,
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
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 70,
            height: 70,
            borderRadius: 18,
            overflow: 'hidden',
            border: '3px solid #f97316',
            boxShadow: '0 8px 20px rgba(234, 88, 12, 0.4)',
            margin: '0 auto 12px',
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
                borderRadius: 12
              }}
            />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1c1917' }}>
            Create an Account
          </h1>
          <p style={{ fontSize: 14, color: '#9a3412', fontWeight: 600, marginTop: 4 }}>
            Register as a Passenger or Fleet Driver
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

        <form onSubmit={handleRegister}>
          {/* Account Role Selector */}
          <div className="form-group">
            <label className="form-label" style={{ color: '#7c2d12' }}>I want to register as</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <button
                type="button"
                className={`btn ${formData.role === 'passenger' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, role: 'passenger' })}
              >
                Passenger
              </button>
              <button
                type="button"
                className={`btn ${formData.role === 'driver' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFormData({ ...formData, role: 'driver' })}
              >
                Bus Driver
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="form-label" style={{ color: '#7c2d12' }}>First Name</label>
              <input
                type="text"
                name="first_name"
                className="form-control"
                placeholder="e.g. Rajesh"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label className="form-label" style={{ color: '#7c2d12' }}>Last Name</label>
              <input
                type="text"
                name="last_name"
                className="form-control"
                placeholder="e.g. Kumar"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#7c2d12' }}>Username *</label>
            <input
              type="text"
              name="username"
              className="form-control"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#7c2d12' }}>Email Address *</label>
            <input
              type="email"
              name="email"
              className="form-control"
              placeholder="user@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: '#7c2d12' }}>Phone Number</label>
            <input
              type="text"
              name="phone_number"
              className="form-control"
              placeholder="+91 98765 43210"
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>

          {formData.role === 'driver' && (
            <div className="form-group">
              <label className="form-label" style={{ color: '#7c2d12' }}>Driver License Number *</label>
              <input
                type="text"
                name="license_number"
                className="form-control"
                placeholder="e.g. DL-TN-2024-9988"
                value={formData.license_number}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" style={{ color: '#7c2d12' }}>Password *</label>
            <input
              type="password"
              name="password"
              className="form-control"
              placeholder="Minimum 6 characters"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: 10 }}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: 22, fontSize: 13, color: '#78350f' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#ea580c', fontWeight: 800, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
