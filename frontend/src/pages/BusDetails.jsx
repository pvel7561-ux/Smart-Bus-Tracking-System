import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import busService from '../services/busService';

const BusDetails = () => {
  const { id } = useParams();
  const [bus, setBus] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        const [busData, historyData] = await Promise.all([
          busService.getLiveBusDetail(id),
          busService.getLocationHistory(id, { limit: 50 })
        ]);
        setBus(busData);
        setHistory(historyData || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadDetails();
  }, [id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading bus telemetry records...</div>;
  }

  if (!bus) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3>Bus not found</h3>
        <Link to="/passenger" className="btn btn-secondary" style={{ marginTop: 12 }}>
          Back to List
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/passenger" style={{ color: 'var(--gray-500)', textDecoration: 'none', fontSize: 14 }}>
              ← Buses
            </Link>
            <span style={{ color: 'var(--gray-300)' }}>/</span>
            <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{bus.bus_number}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)', marginTop: 4 }}>
            Vehicle Specification &amp; History: {bus.bus_number}
          </h1>
        </div>

        <Link to={`/tracking/${bus.id}`} className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Open Live Map
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 28 }}>
        {/* Specifications Card */}
        <div className="card">
          <h3 className="card-title">Vehicle &amp; Route Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-500)' }}>Bus Number</span>
              <span style={{ fontWeight: 700 }}>{bus.bus_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-500)' }}>Registration Number</span>
              <span style={{ fontWeight: 700 }}>{bus.registration_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-500)' }}>Seating Capacity</span>
              <span style={{ fontWeight: 700 }}>{bus.capacity} seats</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-500)' }}>Current Status</span>
              <span className={`badge badge-${bus.status}`}>{bus.status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
              <span style={{ color: 'var(--gray-500)' }}>Assigned Route</span>
              <span style={{ fontWeight: 700 }}>{bus.route?.route_name || 'None'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--gray-500)' }}>Corridor Terminals</span>
              <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>
                {bus.route?.starting_point} ➔ {bus.route?.destination}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Driver Card */}
        <div className="card">
          <h3 className="card-title">Assigned Driver Profile</h3>
          {bus.driver ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>Driver Name</span>
                <span style={{ fontWeight: 700 }}>{bus.driver.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>Phone Contact</span>
                <span style={{ fontWeight: 700 }}>{bus.driver.phone || 'N/A'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid var(--gray-100)' }}>
                <span style={{ color: 'var(--gray-500)' }}>Commercial License</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{bus.driver.license_number || 'Registered'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--gray-500)' }}>Active Ongoing Trip</span>
                <span style={{ fontWeight: 700, color: bus.active_trip ? 'var(--success)' : 'var(--gray-400)' }}>
                  {bus.active_trip ? `Trip #${bus.active_trip.id} (Ongoing)` : 'No active trip'}
                </span>
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--gray-400)', marginTop: 20 }}>No driver assigned to this vehicle.</div>
          )}
        </div>
      </div>

      {/* GPS Telemetry History Breadcrumbs */}
      <div className="card">
        <h3 className="card-title">Recent GPS Telemetry Log ({history.length} data points)</h3>
        <div className="card-subtitle">Chronological record of coordinates transmitted by driver's mobile device</div>

        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-500)' }}>
                <th style={{ padding: '8px 12px' }}>Timestamp</th>
                <th style={{ padding: '8px 12px' }}>Latitude</th>
                <th style={{ padding: '8px 12px' }}>Longitude</th>
                <th style={{ padding: '8px 12px' }}>Speed</th>
                <th style={{ padding: '8px 12px' }}>Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-800)', fontWeight: 600 }}>
                    {new Date(h.timestamp).toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                    {h.latitude.toFixed(6)}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace' }}>
                    {h.longitude.toFixed(6)}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--primary)', fontWeight: 700 }}>
                    {Math.round(h.speed || 0)} km/h
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--gray-500)' }}>
                    {h.accuracy ? `±${Math.round(h.accuracy)}m` : '--'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BusDetails;
