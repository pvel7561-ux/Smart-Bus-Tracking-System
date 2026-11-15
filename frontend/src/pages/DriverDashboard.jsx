import React, { useState, useEffect, useMemo } from 'react';
import busService from '../services/busService';
import authService from '../services/authService';
import GPSLocation from '../components/GPSLocation';
import BusMap from '../components/BusMap';

const DriverDashboard = () => {
  const [driverUser, setDriverUser] = useState(authService.getUser());
  const [assignedBus, setAssignedBus] = useState(null);
  const [activeTrip, setActiveTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [liveLocation, setLiveLocation] = useState(null);

  const fetchDriverContext = async () => {
    try {
      const updatedUser = await authService.getMe();
      setDriverUser(updatedUser);

      const tripData = await busService.getActiveTrip();
      if (tripData?.assigned_bus) {
        setAssignedBus(tripData.assigned_bus);
      } else if (updatedUser?.assigned_bus) {
        const bus = await busService.getBus(updatedUser.assigned_bus.id);
        setAssignedBus(bus);
      }

      if (tripData?.has_active_trip) {
        setActiveTrip(tripData.trip);
      } else {
        setActiveTrip(null);
      }
    } catch (e) {
      console.error('Failed to load driver context:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDriverContext();

    // Poll bus live details every 5 seconds to update map marker and telemetry
    const pollInterval = setInterval(() => {
      if (assignedBus?.id) {
        busService.getLiveBusDetail(assignedBus.id).then((data) => {
          if (data?.latest_location) {
            setLiveLocation(data.latest_location);
          }
        }).catch(console.error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [assignedBus?.id]);

  const handleTripChange = (trip) => {
    setActiveTrip(trip);
    fetchDriverContext();
  };

  // Route stops list sorted in sequence
  const routeStops = useMemo(() => {
    const raw = assignedBus?.route?.stops || assignedBus?.route_details?.stops || [];
    return [...raw].sort((a, b) => a.stop_order - b.stop_order);
  }, [assignedBus]);

  // Current GPS coordinates & telemetry
  const currentCoords = liveLocation || assignedBus?.latest_location;

  // Next Upcoming Stop calculation
  const nextStopInfo = useMemo(() => {
    if (!currentCoords || routeStops.length === 0) return null;
    return busService.findNextUpcomingStop(currentCoords, routeStops, currentCoords.speed || 0);
  }, [currentCoords, routeStops]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading driver station...</div>;
  }

  // Map representation with assigned bus
  const mapBuses = assignedBus ? [{
    ...assignedBus,
    status: activeTrip ? 'active' : 'inactive',
    latest_location: currentCoords
  }] : [];

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto' }}>
      {/* Driver Station Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>
            Driver Mobile GPS Console
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            Signed in as <strong>{driverUser?.first_name || driverUser?.username}</strong> | License: {driverUser?.license_number || 'Registered'}
          </p>
        </div>
        <div>
          <span className={`badge ${activeTrip ? 'badge-active' : 'badge-inactive'}`} style={{ fontSize: 13, padding: '6px 14px' }}>
            {activeTrip ? '● Trip In Progress' : '○ Bus Parked'}
          </span>
        </div>
      </div>

      {/* Assigned Vehicle Overview in Orange & Gold Theme */}
      {assignedBus ? (
        <div className="card" style={{
          marginBottom: 20,
          background: 'linear-gradient(135deg, #1c1917 0%, #292524 60%, #451a03 100%)',
          color: 'white',
          border: '2px solid #f97316',
          boxShadow: '0 10px 25px -4px rgba(234, 88, 12, 0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <div style={{ fontSize: 12, color: '#fed7aa', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.8px' }}>
                Assigned Vehicle
              </div>
              <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.5px', marginTop: 2, color: '#ffffff' }}>
                {assignedBus.bus_number}
              </div>
              <div style={{ fontSize: 13, color: '#fde68a' }}>
                Reg: <strong style={{ color: '#ffffff' }}>{assignedBus.registration_number}</strong> | Capacity: {assignedBus.capacity} passengers
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 12, color: '#fed7aa', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.8px' }}>
                Assigned Corridor Route
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#facc15', marginTop: 2 }}>
                {assignedBus.route?.name || assignedBus.route?.route_name || assignedBus.route_name || 'No Route'}
              </div>
              {(assignedBus.route?.starting_point || assignedBus.route_details?.starting_point) && (
                <div style={{ fontSize: 13, color: '#ffedd5', marginTop: 2 }}>
                  {assignedBus.route?.starting_point || assignedBus.route_details?.starting_point} ➔ {assignedBus.route?.destination || assignedBus.route_details?.destination}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning)', marginBottom: 24 }}>
          <div style={{ fontWeight: 700, color: '#b45309', fontSize: 16 }}>
            No Bus Assigned to Your Account
          </div>
          <div style={{ fontSize: 14, color: '#92400e', marginTop: 4 }}>
            Please contact the Fleet Administrator to assign a bus to your profile before starting a trip.
          </div>
        </div>
      )}

      {/* Ola/Uber Style Next Upcoming Bus Stop Banner */}
      {nextStopInfo?.stop && (
        <div style={{
          backgroundColor: '#fffbeb',
          border: '2px solid #f59e0b',
          borderRadius: 'var(--radius)',
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 12,
          boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              backgroundColor: '#f59e0b',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 900,
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)'
            }}>
              📍
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#92400e', textTransform: 'uppercase', letterSpacing: '0.6px' }}>
                NEXT UPCOMING BUS STOP
              </div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#78350f', marginTop: 2 }}>
                {nextStopInfo.stop.stop_name}
              </div>
              <div style={{ fontSize: 12, color: '#b45309' }}>
                Stop #{nextStopInfo.stop.stop_order} of {routeStops.length} stops
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#92400e', fontWeight: 800 }}>DISTANCE</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#b45309' }}>
                {nextStopInfo.distanceText}
              </div>
            </div>
            <div style={{ width: 1, height: 32, backgroundColor: '#fcd34d' }}></div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#92400e', fontWeight: 800 }}>ESTIMATED TIME</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#16a34a' }}>
                ~{nextStopInfo.etaMinutes} min
              </div>
            </div>
          </div>
        </div>
      )}

      {/* GPS Tracking Transmitter Module */}
      <div style={{ marginBottom: 20 }}>
        <GPSLocation
          assignedBus={assignedBus}
          activeTrip={activeTrip}
          onTripChange={handleTripChange}
        />
      </div>

      {/* Driver Real-Time Map View & Sequenced Stops Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 20, marginBottom: 24 }}>
        {/* Map View */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="card-title">Driver Road Navigation Map</div>
              <div className="card-subtitle" style={{ marginBottom: 0 }}>
                Live GPS path with named bus stops &amp; next stop highlight
              </div>
            </div>
            <span className="badge badge-active">Live GPS</span>
          </div>

          <BusMap
            buses={mapBuses}
            stops={routeStops}
            height="420px"
            followBus={true}
            nextStopId={nextStopInfo?.stop?.id}
            center={currentCoords ? [currentCoords.latitude, currentCoords.longitude] : [13.0827, 80.2707]}
            zoom={14}
          />
        </div>

        {/* Route Stops Sequence Progression */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div className="card-title" style={{ fontSize: 16 }}>Route Stop Sequence</div>
              <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
                {routeStops.length} ordered stops along this route
              </div>
            </div>
          </div>

          <div style={{ flex: 1, maxHeight: 390, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
            {routeStops.length > 0 ? (
              routeStops.map((stop, idx) => {
                const isStart = idx === 0;
                const isEnd = idx === routeStops.length - 1;
                const isNext = nextStopInfo?.stop?.id === stop.id;

                return (
                  <div
                    key={stop.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      padding: '10px 12px',
                      borderRadius: 'var(--radius)',
                      backgroundColor: isNext ? '#fffbeb' : '#ffffff',
                      border: isNext ? '2px solid #f59e0b' : '1px solid var(--gray-200)',
                      boxShadow: isNext ? '0 2px 8px rgba(245, 158, 11, 0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {/* Order Circle */}
                    <div style={{
                      width: 30,
                      height: 30,
                      borderRadius: '50%',
                      backgroundColor: isStart ? '#10b981' : isEnd ? '#ef4444' : isNext ? '#f59e0b' : '#e2e8f0',
                      color: isStart || isEnd || isNext ? '#ffffff' : '#475569',
                      fontWeight: 800,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      {stop.stop_order}
                    </div>

                    {/* Stop Name & Status */}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, fontSize: 13, color: isNext ? '#92400e' : 'var(--gray-900)' }}>
                        {stop.stop_name}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--gray-500)', marginTop: 2 }}>
                        {isStart ? '🏁 Starting Terminal' : isEnd ? '🏁 Ending Terminal' : `Transit Stop #${stop.stop_order}`}
                      </div>
                    </div>

                    {/* Next Badge */}
                    {isNext && (
                      <span className="badge" style={{ backgroundColor: '#f59e0b', color: '#ffffff', fontWeight: 800, fontSize: 10, padding: '4px 8px' }}>
                        NEXT STOP
                      </span>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ textAlign: 'center', padding: 20, color: 'var(--gray-400)', fontSize: 13 }}>
                No stops registered on this route yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
