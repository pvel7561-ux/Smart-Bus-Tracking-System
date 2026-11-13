import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import busService from '../services/busService';
import BusMap from '../components/BusMap';

const LiveTracking = () => {
  const { id } = useParams();
  const [bus, setBus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [osrmRoutePoints, setOsrmRoutePoints] = useState([]);
  const [routeDistanceInfo, setRouteDistanceInfo] = useState(null);
  const [followMode, setFollowMode] = useState(true);

  // Fetch Bus Live Details
  const fetchBusData = async () => {
    try {
      const data = await busService.getLiveBusDetail(id);
      setBus(data);
      setError(null);
    } catch (e) {
      console.error(e);
      setError('Failed to fetch bus telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBusData();

    // 5-Second Real-Time Telemetry Polling
    const interval = setInterval(() => {
      fetchBusData();
    }, 5000);

    return () => clearInterval(interval);
  }, [id]);

  // Fetch true road-following route from OSRM when route stops are available
  useEffect(() => {
    if (bus?.route?.stops && bus.route.stops.length >= 2) {
      const sortedStops = [...bus.route.stops].sort((a, b) => a.stop_order - b.stop_order);
      const coordsString = sortedStops.map((s) => `${s.longitude},${s.latitude}`).join(';');

      busService.getOSRMRoute(coordsString).then((res) => {
        if (res && res.points) {
          setOsrmRoutePoints(res.points);
          if (res.distance_km) {
            setRouteDistanceInfo({
              distance: res.distance_km,
              duration: res.duration_min
            });
          }
        } else {
          // Direct fallback
          setOsrmRoutePoints(sortedStops.map((s) => [s.latitude, s.longitude]));
        }
      });
    }
  }, [bus?.route?.id]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Connecting to bus satellite GPS telemetry...</div>;
  }

  if (error || !bus) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)' }}>{error || 'Bus not found.'}</h3>
        <Link to="/passenger" className="btn btn-secondary" style={{ marginTop: 16 }}>
          Return to Passenger Portal
        </Link>
      </div>
    );
  }

  const latestLoc = bus.latest_location;
  const stops = bus.route?.stops || [];
  const isActive = bus.status === 'active';

  return (
    <div>
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/passenger" style={{ color: 'var(--gray-500)', textDecoration: 'none', fontSize: 14 }}>
              ← All Buses
            </Link>
            <span style={{ color: 'var(--gray-300)' }}>/</span>
            <span style={{ fontWeight: 700, color: 'var(--gray-900)' }}>{bus.bus_number}</span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)', marginTop: 4 }}>
            Live Telemetry: {bus.bus_number}
          </h1>
          <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
            Plate: <strong>{bus.registration_number}</strong> | {bus.route?.route_name || 'Assigned Corridor'}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setFollowMode(!followMode)}
            className={`btn btn-sm ${followMode ? 'btn-primary' : 'btn-secondary'}`}
          >
            {followMode ? '✓ Follow Bus Center' : 'Free Map Drag'}
          </button>
          <span className={`badge badge-${bus.status}`} style={{ fontSize: 13, padding: '6px 14px' }}>
            {isActive && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>}
            {bus.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Main Grid: Left Map, Right Route Progress & Telemetry */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Left Column: Full Road Map */}
        <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column' }}>
          {/* Status Bar above Map */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, padding: '0 4px' }}>
            <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
              Road Routing: <strong>{routeDistanceInfo ? `${routeDistanceInfo.distance} km (OSRM Road Path)` : 'OpenStreetMap Roads'}</strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-400)' }}>
              Auto-refreshes every 5 seconds
            </div>
          </div>

          <BusMap
            buses={[bus]}
            stops={stops}
            routePoints={osrmRoutePoints}
            height="560px"
            followBus={followMode}
            selectedBusId={bus.id}
          />

          {/* Quick Telemetry Footnote in Orange & Yellow theme */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 16 }}>
            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800 }}>LIVE SPEED</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#ea580c', marginTop: 2 }}>
                {latestLoc ? `${Math.round(latestLoc.speed || 0)} km/h` : '0 km/h'}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800 }}>GPS ACCURACY</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#78350f', marginTop: 2 }}>
                {latestLoc?.accuracy ? `±${Math.round(latestLoc.accuracy)}m` : '--'}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800 }}>DRIVER</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1917', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {bus.driver?.name || 'Unassigned'}
              </div>
            </div>

            <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '10px 14px', borderRadius: 'var(--radius)' }}>
              <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800 }}>LAST UPDATE</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#16a34a', marginTop: 2 }}>
                {latestLoc ? new Date(latestLoc.timestamp).toLocaleTimeString() : 'Waiting fix'}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Route Stops Progression */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)', marginBottom: 4 }}>
            Route Stops Sequence
          </h2>
          <div style={{ fontSize: 13, color: 'var(--gray-500)', marginBottom: 20 }}>
            {bus.route?.starting_point} ➔ {bus.route?.destination}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 6 }}>
            {stops.length > 0 ? (
              stops.map((stop, idx) => {
                const isStart = idx === 0;
                const isEnd = idx === stops.length - 1;
                return (
                  <div key={stop.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', position: 'relative' }}>
                    {/* Step line indicator */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative'
                    }}>
                      <div style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        backgroundColor: isStart ? '#10b981' : isEnd ? '#ef4444' : '#f59e0b',
                        color: isStart || isEnd ? 'white' : '#78350f',
                        fontWeight: 800,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: 'var(--shadow-sm)',
                        zIndex: 2,
                        border: '2px solid #ffffff'
                      }}>
                        {stop.stop_order}
                      </div>
                      {idx !== stops.length - 1 && (
                        <div style={{
                          width: 2.5,
                          height: 40,
                          backgroundColor: '#fed7aa',
                          marginTop: 4
                        }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>
                        {stop.stop_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-400)', marginTop: 2 }}>
                        {isStart ? 'Origin Terminal' : isEnd ? 'Destination Terminal' : `Transit Stop #${stop.stop_order}`}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={{ color: 'var(--gray-400)', fontSize: 13, textAlign: 'center', padding: 20 }}>
                No stops configured on this route.
              </div>
            )}
          </div>

          {/* Driver Contact Card */}
          {bus.driver && (
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--gray-200)' }}>
              <div style={{ fontSize: 11, color: 'var(--gray-400)', fontWeight: 700, textTransform: 'uppercase' }}>
                Assigned Driver Information
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--gray-900)' }}>
                    {bus.driver.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                    License: {bus.driver.license_number || 'Verified'}
                  </div>
                </div>
                {bus.driver.phone && (
                  <a href={`tel:${bus.driver.phone}`} className="btn btn-secondary btn-sm">
                    Call Driver
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
