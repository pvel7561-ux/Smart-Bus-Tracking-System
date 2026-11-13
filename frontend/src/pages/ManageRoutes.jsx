import React, { useState, useEffect } from 'react';
import busService from '../services/busService';
import RouteMap from '../components/RouteMap';

const ManageRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const [routeForm, setRouteForm] = useState({
    route_name: '',
    starting_point: '',
    destination: '',
    description: ''
  });

  const [stopForm, setStopForm] = useState({
    stop_name: '',
    latitude: '',
    longitude: '',
    stop_order: 1
  });

  const loadRoutes = async () => {
    try {
      const data = await busService.getRoutes();
      setRoutes(data || []);
      if (data && data.length > 0 && !selectedRoute) {
        setSelectedRoute(data[0]);
      } else if (selectedRoute) {
        const updated = data.find((r) => r.id === selectedRoute.id);
        if (updated) setSelectedRoute(updated);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    try {
      const newRoute = await busService.createRoute(routeForm);
      setShowRouteModal(false);
      setRouteForm({ route_name: '', starting_point: '', destination: '', description: '' });
      await loadRoutes();
      setSelectedRoute(newRoute);
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to create route.');
    }
  };

  const handleAddStop = async (e) => {
    e.preventDefault();
    if (!selectedRoute) return;
    try {
      await busService.addBusStop(selectedRoute.id, {
        ...stopForm,
        latitude: parseFloat(stopForm.latitude),
        longitude: parseFloat(stopForm.longitude),
        stop_order: parseInt(stopForm.stop_order)
      });
      setShowStopModal(false);
      setStopForm({ stop_name: '', latitude: '', longitude: '', stop_order: (selectedRoute.stops?.length || 0) + 2 });
      loadRoutes();
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to add stop.');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>
            Bus Routes &amp; Bus Stops
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            Configure road routes, add ordered stops with GPS coordinates, and view road paths
          </p>
        </div>
        <button onClick={() => setShowRouteModal(true)} className="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add New Route
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
        {/* Left: Routes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase' }}>
            Available Routes ({routes.length})
          </div>

          {routes.map((r) => {
            const isSelected = selectedRoute?.id === r.id;
            return (
              <div
                key={r.id}
                onClick={() => setSelectedRoute(r)}
                className="card"
                style={{
                  cursor: 'pointer',
                  padding: '16px 20px',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--gray-200)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--white)',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--gray-900)' }}>
                  {r.route_name}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>{r.starting_point}</span>
                  <span>➔</span>
                  <span>{r.destination}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12 }}>
                  <span style={{ color: 'var(--gray-500)', fontWeight: 600 }}>
                    {r.stops?.length || 0} Bus Stops
                  </span>
                  <span className="badge badge-active" style={{ fontSize: 11 }}>
                    {r.bus_count || 0} Buses Assigned
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Route Details & Map */}
        {selectedRoute ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--gray-900)' }}>
                  {selectedRoute.route_name}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--gray-500)', marginTop: 4 }}>
                  {selectedRoute.description || 'No description provided.'}
                </div>
              </div>
              <button
                onClick={() => {
                  setStopForm({
                    stop_name: '',
                    latitude: '',
                    longitude: '',
                    stop_order: (selectedRoute.stops?.length || 0) + 1
                  });
                  setShowStopModal(true);
                }}
                className="btn btn-secondary btn-sm"
              >
                + Add Stop to Route
              </button>
            </div>

            {/* Road Route Map Preview */}
            <div style={{ marginBottom: 20 }}>
              <RouteMap route={selectedRoute} stops={selectedRoute.stops || []} height="360px" />
            </div>

            {/* Stops Sequence Table */}
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 12 }}>
              Ordered Stops Sequence
            </h3>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-500)' }}>
                    <th style={{ padding: '8px 12px' }}>Order</th>
                    <th style={{ padding: '8px 12px' }}>Stop Name</th>
                    <th style={{ padding: '8px 12px' }}>Latitude</th>
                    <th style={{ padding: '8px 12px' }}>Longitude</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRoute.stops || []).map((s) => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                      <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--primary)' }}>
                        #{s.stop_order}
                      </td>
                      <td style={{ padding: '10px 12px', fontWeight: 600 }}>
                        {s.stop_name}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--gray-600)', fontFamily: 'monospace' }}>
                        {s.latitude.toFixed(4)}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--gray-600)', fontFamily: 'monospace' }}>
                        {s.longitude.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray-400)' }}>
            Select a route to view its road path and stops.
          </div>
        )}
      </div>

      {/* Add Route Modal */}
      {showRouteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Create New Route</h3>
              <button onClick={() => setShowRouteModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleCreateRoute}>
              <div className="form-group">
                <label className="form-label">Route Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Route 101 - Central Station to Airport"
                  value={routeForm.route_name}
                  onChange={(e) => setRouteForm({ ...routeForm, route_name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Starting Point *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Central Railway Station"
                  value={routeForm.starting_point}
                  onChange={(e) => setRouteForm({ ...routeForm, starting_point: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Destination *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Chennai Airport Terminal 2"
                  value={routeForm.destination}
                  onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={routeForm.description}
                  onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowRouteModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Route</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Stop Modal */}
      {showStopModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: 18, fontWeight: 800 }}>Add Stop to {selectedRoute?.route_name}</h3>
              <button onClick={() => setShowStopModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <form onSubmit={handleAddStop}>
              <div className="form-group">
                <label className="form-label">Stop Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Thousand Lights Metro"
                  value={stopForm.stop_name}
                  onChange={(e) => setStopForm({ ...stopForm, stop_name: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Latitude *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="e.g. 13.0534"
                    value={stopForm.latitude}
                    onChange={(e) => setStopForm({ ...stopForm, latitude: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Longitude *</label>
                  <input
                    type="number"
                    step="any"
                    className="form-control"
                    placeholder="e.g. 80.2528"
                    value={stopForm.longitude}
                    onChange={(e) => setStopForm({ ...stopForm, longitude: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Stop Sequence Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={stopForm.stop_order}
                  onChange={(e) => setStopForm({ ...stopForm, stop_order: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowStopModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Stop</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoutes;
