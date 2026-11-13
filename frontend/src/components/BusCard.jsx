import React from 'react';
import { Link } from 'react-router-dom';

const BusCard = ({ bus }) => {
  const isActive = bus.status === 'active';
  const hasLocation = !!bus.latest_location;

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <span style={{ fontSize: 19, fontWeight: 800, color: '#1c1917', letterSpacing: '-0.3px' }}>
              {bus.bus_number}
            </span>
            <div style={{ fontSize: 12, color: '#b45309', fontWeight: 600 }}>
              {bus.registration_number}
            </div>
          </div>
          <span className={`badge badge-${bus.status}`}>
            {isActive && <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 6px #10b981' }}></span>}
            {bus.status}
          </span>
        </div>

        {/* Route Details in Warm Orange Card */}
        <div style={{
          backgroundColor: '#fff7ed',
          border: '1px solid #fed7aa',
          padding: '10px 14px',
          borderRadius: 'var(--radius)',
          marginBottom: 14
        }}>
          <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Operating Route
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#7c2d12', marginTop: 2 }}>
            {bus.route?.name || bus.route_details?.route_name || 'No Route Assigned'}
          </div>
          {(bus.route?.starting_point || bus.route_details?.starting_point) && (
            <div style={{ fontSize: 12, color: '#9a3412', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <span>{bus.route?.starting_point || bus.route_details?.starting_point}</span>
              <span style={{ color: '#ea580c' }}>➔</span>
              <span>{bus.route?.destination || bus.route_details?.destination}</span>
            </div>
          )}
        </div>

        {/* Driver & Location Specs */}
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Driver</div>
            <div style={{ fontWeight: 700, color: '#334155' }}>
              {bus.driver?.name || bus.driver_details?.name || 'Unassigned'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Live Speed</div>
            <div style={{ fontWeight: 800, color: isActive ? '#ea580c' : '#64748b', fontSize: 14 }}>
              {hasLocation ? `${Math.round(bus.latest_location.speed || 0)} km/h` : '0 km/h'}
            </div>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 10, marginTop: 'auto' }}>
        <Link to={`/tracking/${bus.id}`} className="btn btn-primary btn-sm" style={{ flex: 1 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
          Track Live
        </Link>
        <Link to={`/buses/${bus.id}`} className="btn btn-secondary btn-sm">
          Details
        </Link>
      </div>
    </div>
  );
};

export default BusCard;
