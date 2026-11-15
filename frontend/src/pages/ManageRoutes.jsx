import React, { useState, useEffect } from 'react';
import busService from '../services/busService';
import RouteMap from '../components/RouteMap';

const ManageRoutes = () => {
  const [routes, setRoutes] = useState([]);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [showRouteModal, setShowRouteModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & Geocode states for Add Stop Modal
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);

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
    stop_order: 1,
    stop_type: 'intermediate' // 'start', 'intermediate', 'end'
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
        stop_name: stopForm.stop_name,
        latitude: parseFloat(stopForm.latitude),
        longitude: parseFloat(stopForm.longitude),
        stop_order: parseInt(stopForm.stop_order)
      });
      setShowStopModal(false);
      setStopForm({ stop_name: '', latitude: '', longitude: '', stop_order: (selectedRoute.stops?.length || 0) + 2, stop_type: 'intermediate' });
      setSearchQuery('');
      setSearchResults([]);
      loadRoutes();
    } catch (e) {
      alert(e.response?.data ? JSON.stringify(e.response.data) : 'Failed to add stop.');
    }
  };

  // Auto Reverse Geocode from Latitude and Longitude
  const handleAutoReverseGeocode = async () => {
    if (!stopForm.latitude || !stopForm.longitude) {
      alert('Please enter Latitude and Longitude first to auto-detect the bus stop name.');
      return;
    }
    setIsGeocoding(true);
    try {
      const result = await busService.reverseGeocode(stopForm.latitude, stopForm.longitude);
      if (result?.stop_name) {
        setStopForm((prev) => ({
          ...prev,
          stop_name: result.stop_name
        }));
      }
    } catch (err) {
      console.error('Reverse geocode error:', err);
    } finally {
      setIsGeocoding(false);
    }
  };

  // Search Places using OSM / Nominatim
  const handlePlaceSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await busService.searchPlaces(searchQuery);
      setSearchResults(results || []);
    } catch (err) {
      console.error('Search places error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Select place from search results
  const handleSelectPlace = (place) => {
    setStopForm((prev) => ({
      ...prev,
      stop_name: place.name || place.display_name.split(',')[0],
      latitude: place.latitude,
      longitude: place.longitude
    }));
    setSearchResults([]);
    setSearchQuery(place.name || place.display_name.split(',')[0]);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>
            Bus Routes &amp; Bus Stops
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            Configure road routes with human-readable stop names, auto-geocoding, and sequenced stops
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
                  <span style={{ fontWeight: 600 }}>{r.starting_point}</span>
                  <span style={{ color: 'var(--primary)' }}>➔</span>
                  <span style={{ fontWeight: 600 }}>{r.destination}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, fontSize: 12 }}>
                  <span style={{ color: 'var(--gray-500)', fontWeight: 600 }}>
                    📍 {r.stops?.length || 0} Named Bus Stops
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
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <span className="badge" style={{ backgroundColor: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }}>
                    Start: {selectedRoute.starting_point}
                  </span>
                  <span className="badge" style={{ backgroundColor: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }}>
                    End: {selectedRoute.destination}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  const nextOrder = (selectedRoute.stops?.length || 0) + 1;
                  setStopForm({
                    stop_name: '',
                    latitude: '',
                    longitude: '',
                    stop_order: nextOrder,
                    stop_type: nextOrder === 1 ? 'start' : 'intermediate'
                  });
                  setSearchQuery('');
                  setSearchResults([]);
                  setShowStopModal(true);
                }}
                className="btn btn-primary btn-sm"
              >
                + Add Bus Stop to Route
              </button>
            </div>

            {/* Road Route Map Preview with Named Stops */}
            <div style={{ marginBottom: 20 }}>
              <RouteMap route={selectedRoute} stops={selectedRoute.stops || []} height="360px" />
            </div>

            {/* Stops Sequence Table with Stop Names & Categorization */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>
                Ordered Stops Sequence ({selectedRoute.stops?.length || 0} Stops)
              </h3>
              <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                Showing official stop names in progression order
              </span>
            </div>

            <div style={{ maxHeight: 280, overflowY: 'auto', border: '1px solid var(--gray-200)', borderRadius: 'var(--radius)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-600)' }}>
                    <th style={{ padding: '10px 12px' }}>Order</th>
                    <th style={{ padding: '10px 12px' }}>Bus Stop Name</th>
                    <th style={{ padding: '10px 12px' }}>Stop Role</th>
                    <th style={{ padding: '10px 12px' }}>Coordinates</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedRoute.stops || []).map((s, idx, arr) => {
                    const isFirst = idx === 0;
                    const isLast = idx === arr.length - 1 && arr.length > 1;
                    return (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 800, color: 'var(--primary)' }}>
                          #{s.stop_order}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 700, color: 'var(--gray-900)' }}>
                          <span style={{ marginRight: 6 }}>📍</span>
                          {s.stop_name}
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          {isFirst ? (
                            <span className="badge" style={{ backgroundColor: '#10b981', color: '#ffffff', fontWeight: 800 }}>
                              START TERMINAL
                            </span>
                          ) : isLast ? (
                            <span className="badge" style={{ backgroundColor: '#ef4444', color: '#ffffff', fontWeight: 800 }}>
                              END TERMINAL
                            </span>
                          ) : (
                            <span className="badge" style={{ backgroundColor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', fontWeight: 700 }}>
                              INTERMEDIATE STOP
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 12px', color: 'var(--gray-500)', fontSize: 12, fontFamily: 'monospace' }}>
                          {s.latitude.toFixed(4)}, {s.longitude.toFixed(4)}
                        </td>
                      </tr>
                    );
                  })}
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
                <label className="form-label">Starting Bus Stop / Origin *</label>
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
                <label className="form-label">Ending Bus Stop / Destination *</label>
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
                  placeholder="Add corridor details, arterial roads, or service schedule..."
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

      {/* Add Stop Modal with Reverse Geocoding & Place Search */}
      {showStopModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: 540 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 800 }}>Add Bus Stop</h3>
                <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
                  Adding to {selectedRoute?.route_name}
                </div>
              </div>
              <button onClick={() => setShowStopModal(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>

            {/* Place Search Tool */}
            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 'var(--radius)', padding: 12, marginBottom: 18 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#9a3412', display: 'block', marginBottom: 6 }}>
                🔍 Search Stop Name / Landmark (Auto-fills Coordinates)
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Thousand Lights Metro, Guindy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handlePlaceSearch}
                  className="btn btn-secondary btn-sm"
                  disabled={isSearching}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Search Suggestions dropdown */}
              {searchResults.length > 0 && (
                <div style={{ marginTop: 8, maxHeight: 150, overflowY: 'auto', backgroundColor: '#ffffff', borderRadius: 'var(--radius)', border: '1px solid #fed7aa' }}>
                  {searchResults.map((p, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSelectPlace(p)}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f3f4f6',
                        fontSize: 12,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef3c7'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      <div>
                        <strong>{p.name}</strong>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{p.display_name}</div>
                      </div>
                      <span style={{ fontSize: 11, color: '#d97706', fontWeight: 700 }}>Select ➔</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={handleAddStop}>
              <div className="form-group">
                <label className="form-label">Bus Stop Name *</label>
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

              {/* Auto Reverse Geocode Button */}
              <div style={{ marginBottom: 16 }}>
                <button
                  type="button"
                  onClick={handleAutoReverseGeocode}
                  disabled={isGeocoding || !stopForm.latitude || !stopForm.longitude}
                  className="btn btn-secondary btn-sm"
                  style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  {isGeocoding ? 'Detecting Stop Name...' : 'Auto-Detect Stop Name from Coordinates (OSM Reverse Geocode)'}
                </button>
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
                <small style={{ color: 'var(--gray-500)', fontSize: 11, marginTop: 4, display: 'block' }}>
                  Stop order determines progression: #1 is Starting Terminal, last number is Ending Terminal.
                </small>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
                <button type="button" onClick={() => setShowStopModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Save Bus Stop</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageRoutes;
