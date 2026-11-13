import React, { useState, useEffect } from 'react';
import busService from '../services/busService';
import authService from '../services/authService';

const ManageDrivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    license_number: ''
  });

  const loadDrivers = async () => {
    try {
      const data = await busService.getDrivers();
      setDrivers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.register({
        ...formData,
        role: 'driver'
      });
      setShowModal(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        license_number: ''
      });
      loadDrivers();
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to create driver.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>
            Manage Drivers
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            Driver profiles, contact information, and license records
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Driver
        </button>
      </div>

      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-500)', fontSize: 12, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Driver Name</th>
                <th style={{ padding: '12px 16px' }}>Username</th>
                <th style={{ padding: '12px 16px' }}>Phone Number</th>
                <th style={{ padding: '12px 16px' }}>License Number</th>
                <th style={{ padding: '12px 16px' }}>Assigned Bus</th>
                <th style={{ padding: '12px 16px' }}>Availability</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((d) => {
                const name = d.user_details?.first_name ? `${d.user_details.first_name} ${d.user_details.last_name || ''}` : d.user_details?.username;
                return (
                  <tr key={d.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--gray-900)' }}>
                      {name}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)' }}>
                      @{d.user_details?.username}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-700)' }}>
                      {d.phone_number || '--'}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-700)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {d.license_number}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {d.assigned_bus_number ? (
                        <span className="badge badge-active">{d.assigned_bus_number}</span>
                      ) : (
                        <span className="badge badge-inactive">None</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge ${d.is_available ? 'badge-active' : 'badge-inactive'}`}>
                        {d.is_available ? 'Available' : 'On Duty'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Driver Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Create Driver Account</h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">First Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Username *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="driver_username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="driver@smartbus.local"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">License Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. DL-TN-2024-5678"
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Initial Password *</label>
                <input
                  type="password"
                  className="form-control"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Driver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDrivers;
