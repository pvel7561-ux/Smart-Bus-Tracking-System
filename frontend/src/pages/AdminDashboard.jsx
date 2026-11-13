import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import busService from '../services/busService';
import StatCard from '../components/StatCard';
import BusMap from '../components/BusMap';

const AdminDashboard = () => {
  const [buses, setBuses] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [activeTrips, setActiveTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      const [busesData, driversData, routesData, liveBusesData, tripsData] = await Promise.all([
        busService.getBuses(),
        busService.getDrivers(),
        busService.getRoutes(),
        busService.getLiveBuses(),
        busService.getActiveTrip()
      ]);

      setBuses(liveBusesData || busesData || []);
      setDrivers(driversData || []);
      setRoutes(routesData || []);
      if (tripsData && tripsData.trips) {
        setActiveTrips(tripsData.trips);
      }
    } catch (e) {
      console.error('Failed to load admin dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Auto-refresh live map every 5 seconds
    const interval = setInterval(() => {
      busService.getLiveBuses().then((data) => {
        if (data) setBuses(data);
      }).catch(console.error);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const totalBuses = buses.length;
  const activeBusesCount = buses.filter((b) => b.status === 'active').length;
  const totalDrivers = drivers.length;
  const totalRoutes = routes.length;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>
            Admin Fleet Command Center
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            Real-time telemetry, driver status, and active city transit routes
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/admin/buses" className="btn btn-primary btn-sm">
            + Add Bus
          </Link>
          <Link to="/admin/routes" className="btn btn-secondary btn-sm">
            + New Route
          </Link>
        </div>
      </div>

      {/* Metric Cards in Orange & Yellow Theme */}
      <div className="grid-cols-4" style={{ marginBottom: 28 }}>
        <StatCard
          title="Total Buses"
          value={totalBuses}
          subtitle="Registered in fleet"
          color="#ea580c"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/></svg>}
        />
        <StatCard
          title="Active Live Buses"
          value={activeBusesCount}
          subtitle="Broadcasting live GPS"
          color="#16a34a"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>}
        />
        <StatCard
          title="Bus Routes"
          value={totalRoutes}
          subtitle="Scheduled corridors"
          color="#f59e0b"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4M12 16V8"/></svg>}
        />
        <StatCard
          title="Verified Drivers"
          value={totalDrivers}
          subtitle="Active on fleet"
          color="#d97706"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>}
        />
      </div>

      {/* Live Fleet Road Map */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="card-title">Live Fleet Map (Auto-updates every 5s)</div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              Real-time driver GPS markers over OpenStreetMap road network
            </div>
          </div>
          <span className="badge badge-active">
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
            5s Telemetry Active
          </span>
        </div>

        <BusMap buses={buses} height="520px" />
      </div>

      {/* Ongoing Trips & Buses Table */}
      <div className="card">
        <div className="card-title" style={{ marginBottom: 16 }}>
          Fleet Status &amp; Recent Activity
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--gray-200)', color: 'var(--gray-500)', fontSize: 12, textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Bus Number</th>
                <th style={{ padding: '12px 16px' }}>Reg Number</th>
                <th style={{ padding: '12px 16px' }}>Assigned Driver</th>
                <th style={{ padding: '12px 16px' }}>Assigned Route</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px' }}>Last GPS Ping</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {buses.map((bus) => {
                const hasLoc = !!bus.latest_location;
                return (
                  <tr key={bus.id} style={{ borderBottom: '1px solid var(--gray-100)' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--gray-900)' }}>
                      {bus.bus_number}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-600)' }}>
                      {bus.registration_number}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-700)' }}>
                      {bus.driver?.name || bus.driver_details?.name || <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-700)' }}>
                      {bus.route?.name || bus.route_details?.route_name || <span style={{ color: 'var(--gray-400)' }}>Unassigned</span>}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span className={`badge badge-${bus.status}`}>
                        {bus.status}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--gray-500)', fontSize: 13 }}>
                      {hasLoc ? new Date(bus.latest_location.timestamp).toLocaleTimeString() : 'No GPS yet'}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <Link to={`/tracking/${bus.id}`} className="btn btn-primary btn-sm">
                        Track
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
