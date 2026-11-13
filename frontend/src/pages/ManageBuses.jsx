import React, { useState, useEffect } from 'react';
import busService from '../services/busService';

const ManageBuses = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [formData, setFormData] = useState({
    bus_number: '',
    registration_number: '',
    capacity: 40,
    driver: '',
    route: '',
    status: 'inactive'
  });
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = async () => {
    try {
      const [busList, driverList, routeList] = await Promise.all([
        busService.getBuses(),
        busService.getDrivers(),
        busService.getRoutes()
      ]);
      setBuses(busList || []);
      setDrivers(driverList || []);
      setRoutes(routeList || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingBus(null);
    setFormData({
      bus_number: '',
      registration_number: '',
      capacity: 40,
      driver: '',
      route: '',
      status: 'inactive'
    });
    setShowModal(true);
  };

  const openEditModal = (bus) => {
    setEditingBus(bus);
    setFormData({
      bus_number: bus.bus_number,
      registration_number: bus.registration_number,
      capacity: bus.capacity,
      driver: bus.driver || '',
      route: bus.route || '',
      status: bus.status
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        driver: formData.driver ? parseInt(formData.driver) : null,
        route: formData.route ? parseInt(formData.route) : null,
        capacity: parseInt(formData.capacity)
      };

      if (editingBus) {
        await busService.updateBus(editingBus.id, payload);
      } else {
        await busService.createBus(payload);
      }
      setShowModal(false);
      loadData();
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to save bus.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this bus?')) {
      try {
        await busService.deleteBus(id);
        loadData();
      } catch (e) {
        alert('Failed to delete bus.');
      }
    }
  };

  const filteredBuses = buses.filter((b) => {
    const matchesStatus = !statusFilter || b.status === statusFilter;
    const matchesSearch = !searchTerm ||
      b.bus_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.registration_number.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>
            Manage Bus Fleet
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            Add, configure, assign drivers, and monitor fleet status
          </p>
        </div>
        <button onClick={openAddModal} className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New Bus
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 24, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        <input
          type="text"
          className="form-control"
          placeholder="Search by bus number or registration..."
          style={{ maxWidth: 360 }}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="form-control"
          style={{ maxWidth: 200 }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Buses Table */}
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-500)', fontSize: 12, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Bus Number</th>
                <th style={{ padding: '12px 16px' }}>Registration</th>
                <th style={{ padding: '12px 16px' }}>Capacity</th>
                <th style={{ padding: '12px 16px' }}>Assigned Driver</th>
                <th style={{ padding: '12px 16px' }}>Assigned Route</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBuses.map((bus) => (
                <tr key={bus.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--gray-900)' }}>
                    {bus.bus_number}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--gray-600)' }}>
                    {bus.registration_number}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--gray-700)' }}>
                    {bus.capacity} seats
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--gray-700)' }}>
                    {bus.driver_details?.name || <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '14px 16px', color: 'var(--gray-700)' }}>
                    {bus.route_details?.route_name || <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge badge-${bus.status}`}>
                      {bus.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: 8 }}>
                      <button onClick={() => openEditModal(bus)} className="btn btn-secondary btn-sm">
                        Edit
                      </button>
                      <button onClick={() => handleDelete(bus.id)} className="btn btn-danger btn-sm">
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>
                {editingBus ? 'Edit Bus' : 'Add New Bus'}
              </h3>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Bus Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. BUS-101"
                  value={formData.bus_number}
                  onChange={(e) => setFormData({ ...formData, bus_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Registration Number *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. TN-01-AB-1234"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <input
                  type="number"
                  className="form-control"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Assign Driver</label>
                <select
                  className="form-control"
                  value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                >
                  <option value="">No Driver Assigned</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.user_details?.first_name ? `${d.user_details.first_name} ${d.user_details.last_name || ''}` : d.user_details?.username} ({d.license_number})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Assign Route</label>
                <select
                  className="form-control"
                  value={formData.route}
                  onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                >
                  <option value="">No Route Assigned</option>
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.route_name} ({r.starting_point} ➔ {r.destination})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="inactive">Inactive</option>
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBus ? 'Save Changes' : 'Create Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBuses;
