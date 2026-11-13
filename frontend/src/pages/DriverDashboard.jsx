import React, { useState, useEffect } from 'react';
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
      // Refresh user details to get assigned bus
      const updatedUser = await authService.getMe();
      setDriverUser(updatedUser);

      const tripData = await busService.getActiveTrip();
      if (tripData?.assigned_bus) {
        setAssignedBus(tripData.assigned_bus);
      } else if (updatedUser?.assigned_bus) {
        // Fetch full bus details
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

    // Poll bus live details every 5 seconds to update map marker
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

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Loading driver station...</div>;
  }

  // Map representation with assigned bus
  const mapBuses = assignedBus ? [{
    ...assignedBus,
    status: activeTrip ? 'active' : 'inactive',
    latest_location: liveLocation || assignedBus.latest_location
  }] : [];

  const routeStops = assignedBus?.route?.stops || assignedBus?.route_details?.stops || [];

  return (
    <div style={{ maxWidth: 960, margin: '0 auto' }}>
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
          marginBottom: 24,
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
                Operating Route
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

      {/* GPS Tracking Transmitter Module */}
      <div style={{ marginBottom: 24 }}>
        <GPSLocation
          assignedBus={assignedBus}
          activeTrip={activeTrip}
          onTripChange={handleTripChange}
        />
      </div>

      {/* Driver Real-Time Map View */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div>
            <div className="card-title">Driver Road Map View</div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              Live position along route stops (Follow mode active)
            </div>
          </div>
          <span className="badge badge-active">Live Position</span>
        </div>

        <BusMap
          buses={mapBuses}
          stops={routeStops}
          height="380px"
          followBus={true}
          center={liveLocation ? [liveLocation.latitude, liveLocation.longitude] : [13.0827, 80.2707]}
          zoom={14}
        />
      </div>
    </div>
  );
};

export default DriverDashboard;
