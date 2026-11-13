import React, { useState, useEffect, useRef } from 'react';
import busService from '../services/busService';
import geolocationService from '../services/geolocation';

const GPSLocation = ({ assignedBus, activeTrip, onTripChange }) => {
  const [isTracking, setIsTracking] = useState(false);
  const [gpsData, setGpsData] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [loading, setLoading] = useState(false);

  const watchIdRef = useRef(null);
  const intervalRef = useRef(null);
  const latestGpsRef = useRef(null);
  const simStepRef = useRef(0);

  // Sync with initial trip status
  useEffect(() => {
    if (activeTrip && activeTrip.status === 'ongoing') {
      setIsTracking(true);
    } else {
      setIsTracking(false);
    }
  }, [activeTrip]);

  // Handle Starting the Trip & GPS Tracking
  const handleStartTrip = async () => {
    if (!assignedBus) {
      setErrorMsg('No assigned bus available to track.');
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      // 1. Verify Browser Geolocation Support
      if (!geolocationService.isSupported()) {
        throw new Error('Geolocation is not supported by your browser.');
      }

      // 2. Start Trip on Backend
      const res = await busService.startTrip(assignedBus.id, assignedBus.route?.id || assignedBus.route_id);
      if (onTripChange) {
        onTripChange(res.trip);
      }

      setIsTracking(true);

      // 3. Request initial GPS fix
      try {
        const initialPos = await geolocationService.getCurrentPosition();
        latestGpsRef.current = initialPos;
        setGpsData(initialPos);
        await sendLocationToBackend(initialPos, res.trip?.id);
      } catch (locErr) {
        console.warn('Initial GPS fix failed, falling back to watchPosition / simulation:', locErr);
        setErrorMsg(locErr.message || 'GPS Signal weak. Acquiring satellite lock...');
      }

      // 4. Start watchPosition
      startWatchingGPS(res.trip?.id);

    } catch (err) {
      console.error('Failed to start trip:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to start trip.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Stopping the Trip
  const handleStopTrip = async () => {
    setLoading(true);
    try {
      stopWatchingGPS();
      if (activeTrip) {
        await busService.stopTrip(activeTrip.id, assignedBus?.id);
      } else if (assignedBus) {
        await busService.stopTrip(null, assignedBus.id);
      }
      setIsTracking(false);
      setIsSimulating(false);
      if (onTripChange) {
        onTripChange(null);
      }
    } catch (err) {
      console.error('Failed to stop trip:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Failed to stop trip.');
    } finally {
      setLoading(false);
    }
  };

  // Watch position listener
  const startWatchingGPS = (tripId) => {
    stopWatchingGPS();

    // Browser GPS watchPosition
    watchIdRef.current = geolocationService.watchPosition(
      (pos) => {
        latestGpsRef.current = pos;
        setGpsData(pos);
        setErrorMsg(null);
      },
      (err) => {
        console.error('GPS watch error:', err);
        setErrorMsg(err.message);
      }
    );

    // 5-Second Interval Sender to Backend API
    intervalRef.current = setInterval(() => {
      if (latestGpsRef.current && assignedBus) {
        sendLocationToBackend(latestGpsRef.current, tripId || activeTrip?.id);
      }
    }, 5000);
  };

  const stopWatchingGPS = () => {
    if (watchIdRef.current !== null) {
      geolocationService.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // Send Coordinates to Django REST API
  const sendLocationToBackend = async (coords, tripId) => {
    if (!assignedBus) return;
    try {
      await busService.updateLocation({
        bus_id: assignedBus.id,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy || 10.0,
        speed: coords.speed || 0.0,
        heading: coords.heading || 0.0,
        trip_id: tripId || activeTrip?.id
      });
      setUpdateCount((prev) => prev + 1);
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (e) {
      console.error('Error uploading GPS to Django backend:', e);
    }
  };

  // Simulator for developer desktop testing along route stops
  const toggleSimulator = () => {
    if (isSimulating) {
      setIsSimulating(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    if (!assignedBus) return;
    setIsSimulating(true);
    setErrorMsg(null);

    // Simulation route coordinates along Chennai corridor
    const demoWaypoints = [
      { lat: 13.0827, lon: 80.2707, speed: 25.0 },
      { lat: 13.0760, lon: 80.2725, speed: 32.0 },
      { lat: 13.0694, lon: 80.2742, speed: 28.5 },
      { lat: 13.0617, lon: 80.2647, speed: 35.0 },
      { lat: 13.0534, lon: 80.2528, speed: 42.0 },
      { lat: 13.0450, lon: 80.2480, speed: 38.0 },
      { lat: 13.0375, lon: 80.2452, speed: 30.0 },
      { lat: 13.0250, lon: 80.2300, speed: 45.0 },
      { lat: 13.0189, lon: 80.2227, speed: 40.0 },
      { lat: 13.0084, lon: 80.2122, speed: 36.0 },
      { lat: 12.9815, lon: 80.1636, speed: 20.0 }
    ];

    simStepRef.current = 0;

    // Send immediately
    const wp = demoWaypoints[0];
    const initialSim = {
      latitude: wp.lat,
      longitude: wp.lon,
      accuracy: 6.5,
      speed: wp.speed,
      heading: 210,
      timestamp: Date.now()
    };
    latestGpsRef.current = initialSim;
    setGpsData(initialSim);
    sendLocationToBackend(initialSim, activeTrip?.id);

    // Run every 5 seconds
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      simStepRef.current = (simStepRef.current + 1) % demoWaypoints.length;
      const point = demoWaypoints[simStepRef.current];
      const simCoords = {
        latitude: point.lat,
        longitude: point.lon,
        accuracy: 5.0 + Math.random() * 3,
        speed: point.speed + (Math.random() * 4 - 2),
        heading: 210,
        timestamp: Date.now()
      };
      latestGpsRef.current = simCoords;
      setGpsData(simCoords);
      sendLocationToBackend(simCoords, activeTrip?.id);
    }, 5000);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopWatchingGPS();
    };
  }, []);

  return (
    <div className="card" style={{ border: isTracking ? '2.5px solid #ea580c' : '1.5px solid #fed7aa' }}>
      {/* Header with GPS Pulse */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 15,
            height: 15,
            borderRadius: '50%',
            backgroundColor: isTracking ? '#ea580c' : '#94a3b8',
            boxShadow: isTracking ? '0 0 0 4px rgba(234, 88, 12, 0.3)' : 'none',
            animation: isTracking ? 'pulse 2s infinite' : 'none'
          }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, color: 'var(--gray-900)' }}>
              Driver GPS Tracking Engine
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>
              Status: <strong>{isTracking ? 'Active & Broadcasting Live' : 'Idle (Trip Stopped)'}</strong>
            </div>
          </div>
        </div>

        <span className={`badge ${isTracking ? 'badge-active' : 'badge-inactive'}`}>
          {isTracking ? 'Broadcasting 5s' : 'Off Air'}
        </span>
      </div>

      {/* Error alert if any */}
      {errorMsg && (
        <div style={{
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
          padding: '12px 16px',
          borderRadius: 'var(--radius)',
          fontSize: 13,
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10
        }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div>{errorMsg}</div>
        </div>
      )}

      {/* Live Coordinates Display Grid */}
      <div className="grid-cols-2" style={{ marginBottom: 20 }}>
        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Current Latitude</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-800)', marginTop: 4 }}>
            {gpsData?.latitude ? gpsData.latitude.toFixed(6) : 'Waiting fix...'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Current Longitude</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-800)', marginTop: 4 }}>
            {gpsData?.longitude ? gpsData.longitude.toFixed(6) : 'Waiting fix...'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>GPS Accuracy</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#ea580c', marginTop: 4 }}>
            {gpsData?.accuracy ? `± ${Math.round(gpsData.accuracy)} meters` : '--'}
          </div>
        </div>

        <div style={{ backgroundColor: '#fff7ed', border: '1px solid #fed7aa', padding: '14px', borderRadius: 'var(--radius)' }}>
          <div style={{ fontSize: 11, color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>Updates Transmitted</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#16a34a', marginTop: 4 }}>
            {updateCount} pings ({lastUpdate || 'None'})
          </div>
        </div>
      </div>

      {/* Main Start / Stop Action Buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isTracking ? (
          <button
            onClick={handleStartTrip}
            disabled={loading || !assignedBus}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', fontSize: 17, padding: '16px' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
            START TRIP &amp; BROADCAST GPS
          </button>
        ) : (
          <button
            onClick={handleStopTrip}
            disabled={loading}
            className="btn btn-danger btn-lg"
            style={{ width: '100%', fontSize: 17, padding: '16px' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12"/>
            </svg>
            STOP TRIP &amp; END TRACKING
          </button>
        )}

        {/* Developer simulation helper */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
          <span style={{ fontSize: 12, color: 'var(--gray-500)' }}>
            Indoor / Desktop Testing Tool:
          </span>
          <button
            type="button"
            onClick={toggleSimulator}
            className={`btn btn-sm ${isSimulating ? 'btn-success' : 'btn-secondary'}`}
          >
            {isSimulating ? '✓ Simulating Route Live' : 'Simulate GPS Driving'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GPSLocation;
