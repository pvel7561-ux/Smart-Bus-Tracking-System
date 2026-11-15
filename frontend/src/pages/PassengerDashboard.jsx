import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import busService from '../services/busService';
import BusMap from '../components/BusMap';
import BusCard from '../components/BusCard';

const PassengerDashboard = () => {
  const navigate = useNavigate();
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [searchBusNumber, setSearchBusNumber] = useState('');
  const [searchSource, setSearchSource] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBus, setSelectedBus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLiveBuses = async () => {
    try {
      const [liveData, routesData] = await Promise.all([
        busService.getLiveBuses(),
        busService.getRoutes()
      ]);
      setBuses(liveData || []);
      setRoutes(routesData || []);

      if (liveData && liveData.length > 0 && !selectedBus) {
        // default select first active bus
        const active = liveData.find((b) => b.status === 'active') || liveData[0];
        setSelectedBus(active);
      } else if (selectedBus) {
        const refreshed = liveData.find((b) => b.id === selectedBus.id);
        if (refreshed) setSelectedBus(refreshed);
      }
    } catch (e) {
      console.error('Failed to fetch buses:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveBuses();
    // Auto-refresh every 5 seconds without page reload
    const interval = setInterval(() => {
      busService.getLiveBuses().then((data) => {
        if (data) {
          setBuses(data);
          if (selectedBus) {
            const updated = data.find((b) => b.id === selectedBus.id);
            if (updated) setSelectedBus(updated);
          }
        }
      }).catch(console.error);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedBus?.id]);

  // Filter logic
  const filteredBuses = buses.filter((bus) => {
    // Bus number match
    if (searchBusNumber && !bus.bus_number.toLowerCase().includes(searchBusNumber.toLowerCase())) {
      return false;
    }
    // Status filter
    if (statusFilter !== 'all' && bus.status !== statusFilter) {
      return false;
    }
    // Route source/destination match
    const startPoint = (bus.route?.starting_point || '').toLowerCase();
    const endPoint = (bus.route?.destination || '').toLowerCase();

    if (searchSource && !startPoint.includes(searchSource.toLowerCase())) {
      return false;
    }
    if (searchDestination && !endPoint.includes(searchDestination.toLowerCase())) {
      return false;
    }

    return true;
  });

  const activeStops = useMemo(() => {
    const raw = selectedBus?.route?.stops || [];
    return [...raw].sort((a, b) => a.stop_order - b.stop_order);
  }, [selectedBus]);

  // Next stop calculation for selected bus
  const selectedNextStop = useMemo(() => {
    if (!selectedBus?.latest_location || activeStops.length === 0) return null;
    return busService.findNextUpcomingStop(selectedBus.latest_location, activeStops, selectedBus.latest_location.speed || 0);
  }, [selectedBus, activeStops]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--gray-900)' }}>
            Passenger Live Bus Tracker
          </h1>
          <p style={{ fontSize: 14, color: 'var(--gray-500)' }}>
            Find your bus, track live road movements, and check upcoming named bus stops
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="badge badge-active">
            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--success)' }}></span>
            5s Live Telemetry Active
          </span>
        </div>
      </div>

      {/* Multi-Criteria Search Card */}
      <div className="card" style={{ padding: '20px', marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray-400)', textTransform: 'uppercase', marginBottom: 12 }}>
          Search &amp; Filter Buses
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          <div>
            <label className="form-label" style={{ fontSize: 12 }}>Bus Number</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. BUS-101"
              value={searchBusNumber}
              onChange={(e) => setSearchBusNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12 }}>Origin / From</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Central Station"
              value={searchSource}
              onChange={(e) => setSearchSource(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12 }}>Destination / To</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Airport"
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
            />
          </div>

          <div>
            <label className="form-label" style={{ fontSize: 12 }}>Filter Status</label>
            <select
              className="form-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Buses ({buses.length})</option>
              <option value="active">Active Running ({buses.filter((b) => b.status === 'active').length})</option>
              <option value="inactive">Parked / Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Live Interactive Map Showcase with Named Stop Pills */}
      <div className="card" style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div className="card-title">Live City Transit Map</div>
            <div className="card-subtitle" style={{ marginBottom: 0 }}>
              {selectedBus ? (
                <span>
                  Tracking <strong>{selectedBus.bus_number}</strong> ({selectedBus.route?.starting_point} ➔ {selectedBus.route?.destination})
                  {selectedNextStop?.stop && (
                    <strong style={{ color: '#d97706', marginLeft: 8 }}>
                      • Next: {selectedNextStop.stop.stop_name} (~{selectedNextStop.etaMinutes}m)
                    </strong>
                  )}
                </span>
              ) : 'Click any bus marker to view its route stops'}
            </div>
          </div>
          {selectedBus && (
            <button
              onClick={() => navigate(`/tracking/${selectedBus.id}`)}
              className="btn btn-primary btn-sm"
            >
              Open Dedicated Full-Screen Track View ➔
            </button>
          )}
        </div>

        <BusMap
          buses={filteredBuses}
          stops={activeStops}
          height="480px"
          selectedBusId={selectedBus?.id}
          nextStopId={selectedNextStop?.stop?.id}
          onBusSelect={(bus) => setSelectedBus(bus)}
        />
      </div>

      {/* Available Buses Grid */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--gray-900)' }}>
            Available Fleet ({filteredBuses.length} Buses Found)
          </h2>
        </div>

        {filteredBuses.length > 0 ? (
          <div className="grid-cols-3">
            {filteredBuses.map((bus) => (
              <div
                key={bus.id}
                onClick={() => setSelectedBus(bus)}
                style={{
                  cursor: 'pointer',
                  transform: selectedBus?.id === bus.id ? 'translateY(-2px)' : 'none',
                  transition: 'var(--transition)'
                }}
              >
                <BusCard bus={bus} />
              </div>
            ))}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--gray-500)' }}>
            No buses matched your search query. Try clearing the filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default PassengerDashboard;
