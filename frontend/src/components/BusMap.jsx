import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import busService from '../services/busService';

// Fix for default Leaflet icon paths in Vite / React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom Bus Icon in Vibrant Orange & Golden Yellow
export const createBusIcon = (busNumber, isActive = true, heading = 0) => {
  const bgColor = isActive ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : '#64748b';
  const ringColor = isActive ? '#facc15' : '#cbd5e1';
  return L.divIcon({
    className: 'custom-bus-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer;">
        <div style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: ${bgColor};
          border: 3.5px solid ${ringColor};
          box-shadow: 0 4px 14px rgba(234, 88, 12, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          ${isActive ? 'animation: pulse 2s infinite;' : ''}
        ">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
        <div style="
          background: #1c1917;
          color: #fef08a;
          font-weight: 800;
          font-size: 11px;
          padding: 2px 8px;
          border-radius: 6px;
          margin-top: 3px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 1.5px solid #f59e0b;
        ">
          ${busNumber || 'BUS'}
        </div>
      </div>
    `,
    iconSize: [48, 62],
    iconAnchor: [24, 31],
    popupAnchor: [0, -32],
  });
};

// Ola/Uber Style Custom Bus Stop Marker with Actual Stop Name Visible on Map
export const createStopIcon = (stop, isStart = false, isEnd = false, isNext = false) => {
  const stopName = typeof stop === 'object' ? (stop.stop_name || `Stop ${stop.stop_order || ''}`) : `Stop ${stop}`;
  const stopOrder = typeof stop === 'object' ? (stop.stop_order || 1) : stop;

  let badgeBg = '#ffffff';
  let badgeBorder = '#f59e0b';
  let badgeText = '#78350f';
  let pinColor = '#f59e0b';
  let pinLabel = `${stopOrder}`;

  if (isStart) {
    badgeBg = '#ecfdf5';
    badgeBorder = '#10b981';
    badgeText = '#065f46';
    pinColor = '#10b981';
    pinLabel = 'Start';
  } else if (isEnd) {
    badgeBg = '#fef2f2';
    badgeBorder = '#ef4444';
    badgeText = '#991b1b';
    pinColor = '#ef4444';
    pinLabel = 'End';
  } else if (isNext) {
    badgeBg = '#fff7ed';
    badgeBorder = '#ea580c';
    badgeText = '#9a3412';
    pinColor = '#ea580c';
  }

  const nextPulseStyle = isNext
    ? 'animation: pulse 1.8s infinite; box-shadow: 0 0 0 4px rgba(234, 88, 12, 0.4); border-color: #ea580c;'
    : '';

  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto; cursor: pointer;">
        <!-- Stop Name Pill with Visible Name on Map -->
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          background: ${badgeBg};
          border: 1.5px solid ${badgeBorder};
          border-radius: 14px;
          padding: 3px 9px 3px 4px;
          box-shadow: 0 3px 10px rgba(0,0,0,0.18);
          white-space: nowrap;
          font-family: 'Plus Jakarta Sans', -apple-system, sans-serif;
          ${nextPulseStyle}
        ">
          <span style="
            min-width: 18px;
            height: 18px;
            padding: 0 4px;
            border-radius: 10px;
            background: ${pinColor};
            color: #ffffff;
            font-size: 10px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            justify-content: center;
          ">${pinLabel}</span>
          <span style="
            font-size: 11px;
            font-weight: 800;
            color: ${badgeText};
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
          ">${stopName}</span>
          ${isNext ? '<span style="font-size: 9px; background: #ea580c; color: white; padding: 1px 5px; border-radius: 4px; font-weight: 800; letter-spacing: 0.3px;">NEXT</span>' : ''}
        </div>
        <!-- Pointer Pin -->
        <div style="width: 2px; height: 5px; background: ${badgeBorder};"></div>
        <div style="width: 7px; height: 7px; border-radius: 50%; background: ${pinColor}; border: 1.5px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    iconSize: [180, 40],
    iconAnchor: [90, 40],
    popupAnchor: [0, -42],
  });
};

// Map Recenter / Pan Controller
const MapRecenter = ({ center, zoom, follow = false }) => {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      if (follow) {
        map.panTo(center, { animate: true, duration: 1 });
      } else {
        map.setView(center, zoom || map.getZoom());
      }
    }
  }, [center, zoom, follow, map]);
  return null;
};

// Auto-Fit Bounds for Route & Buses
const MapBoundsFitter = ({ bounds }) => {
  const map = useMap();
  const fittedRef = useRef(false);

  useEffect(() => {
    if (bounds && bounds.length > 1 && !fittedRef.current) {
      map.fitBounds(bounds, { padding: [60, 60] });
      fittedRef.current = true;
    }
  }, [bounds, map]);

  return null;
};

const BusMap = ({
  buses = [],
  stops = [],
  routePoints = [],
  center = [13.0827, 80.2707],
  zoom = 13,
  selectedBusId = null,
  followBus = false,
  height = '500px',
  onBusSelect = null,
  nextStopId = null
}) => {
  const boundsCoords = [];
  buses.forEach((b) => {
    if (b.latest_location?.latitude && b.latest_location?.longitude) {
      boundsCoords.push([b.latest_location.latitude, b.latest_location.longitude]);
    }
  });
  stops.forEach((s) => {
    if (s.latitude && s.longitude) {
      boundsCoords.push([s.latitude, s.longitude]);
    }
  });

  let activeCenter = center;
  let activeBus = null;
  if (selectedBusId) {
    activeBus = buses.find((b) => b.id === selectedBusId);
    if (activeBus?.latest_location) {
      activeCenter = [activeBus.latest_location.latitude, activeBus.latest_location.longitude];
    }
  } else if (buses.length > 0 && buses[0].latest_location) {
    activeBus = buses[0];
  }

  // Determine which stop is the next stop if not explicitly provided
  let computedNextStop = null;
  if (activeBus?.latest_location && stops.length > 0) {
    computedNextStop = busService.findNextUpcomingStop(
      activeBus.latest_location,
      stops,
      activeBus.latest_location.speed || 0
    );
  }

  const effectiveNextStopId = nextStopId || computedNextStop?.stop?.id;

  return (
    <div style={{
      height,
      width: '100%',
      position: 'relative',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      border: '2px solid #fed7aa',
      boxShadow: '0 4px 14px rgba(234, 88, 12, 0.1)'
    }}>
      <MapContainer
        center={activeCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapRecenter center={activeCenter} zoom={zoom} follow={followBus} />
        {boundsCoords.length > 1 && !followBus && <MapBoundsFitter bounds={boundsCoords} />}

        {/* Road Route Polyline in Vibrant Orange & Gold */}
        {routePoints.length > 1 && (
          <Polyline
            positions={routePoints}
            pathOptions={{
              color: '#ea580c',
              weight: 5,
              opacity: 0.85,
              dashArray: '8, 8',
              lineCap: 'round',
              lineJoin: 'round'
            }}
          />
        )}

        {/* Bus Stop Markers with Visible Stop Names on Map */}
        {stops.map((stop, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === stops.length - 1;
          const isNext = stop.id === effectiveNextStopId;

          // Calculate distance from active bus to this stop
          let distanceStr = null;
          let etaStr = null;
          if (activeBus?.latest_location) {
            const dist = busService.calculateDistance(
              activeBus.latest_location.latitude,
              activeBus.latest_location.longitude,
              stop.latitude,
              stop.longitude
            );
            distanceStr = dist < 1 ? `${Math.round(dist * 1000)} meters away` : `${dist.toFixed(1)} km away`;
            const speed = activeBus.latest_location.speed > 5 ? activeBus.latest_location.speed : 25;
            const etaMin = Math.max(1, Math.round((dist / speed) * 60));
            etaStr = dist < 0.1 ? 'Arrived / At Stop' : `~${etaMin} min${etaMin > 1 ? 's' : ''}`;
          }

          return (
            <Marker
              key={`stop-${stop.id || idx}`}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon(stop, isStart, isEnd, isNext)}
            >
              <Popup>
                <div style={{ minWidth: 200, padding: '2px 4px' }}>
                  <div style={{
                    fontSize: 11,
                    color: isStart ? '#10b981' : isEnd ? '#ef4444' : isNext ? '#ea580c' : '#b45309',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}>
                    {isNext && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#ea580c' }} />}
                    {isStart ? '🏁 Starting Terminal' : isEnd ? '🏁 Final Destination' : isNext ? '📍 Next Upcoming Stop' : `Transit Stop #${stop.stop_order}`}
                  </div>

                  <div style={{ fontSize: 16, fontWeight: 800, color: '#1c1917', marginTop: 4 }}>
                    {stop.stop_name}
                  </div>

                  {distanceStr && (
                    <div style={{
                      backgroundColor: '#fff7ed',
                      border: '1px solid #fed7aa',
                      padding: '6px 10px',
                      borderRadius: 6,
                      marginTop: 8,
                      fontSize: 12,
                      color: '#9a3412',
                      fontWeight: 700
                    }}>
                      <div>📍 Distance: {distanceStr}</div>
                      <div>⏱️ Estimated Arrival: {etaStr}</div>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#64748b', marginTop: 8 }}>
                    Sequence: <strong>Stop {stop.stop_order} of {stops.length}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Live Bus Markers */}
        {buses.map((bus) => {
          if (!bus.latest_location || !bus.latest_location.latitude || !bus.latest_location.longitude) {
            return null;
          }

          const lat = bus.latest_location.latitude;
          const lon = bus.latest_location.longitude;
          const isActive = bus.status === 'active';

          return (
            <Marker
              key={`bus-${bus.id}`}
              position={[lat, lon]}
              icon={createBusIcon(bus.bus_number, isActive, bus.latest_location.heading)}
              eventHandlers={{
                click: () => {
                  if (onBusSelect) onBusSelect(bus);
                }
              }}
            >
              <Popup>
                <div style={{ minWidth: 220, padding: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#1c1917' }}>
                      {bus.bus_number}
                    </span>
                    <span className={`badge badge-${bus.status}`}>
                      {bus.status}
                    </span>
                  </div>

                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    <strong>Route:</strong> {bus.route?.name || bus.route_details?.route_name || 'Unassigned'}
                  </div>

                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>
                    <strong>Driver:</strong> {bus.driver?.name || bus.driver_details?.name || 'Unassigned'}
                  </div>

                  <div style={{ fontSize: 12, color: '#ea580c', fontWeight: 800, marginBottom: 8 }}>
                    <strong>Live Speed:</strong> {Math.round(bus.latest_location.speed || 0)} km/h
                  </div>

                  {computedNextStop && (
                    <div style={{
                      backgroundColor: '#fff7ed',
                      border: '1px solid #fed7aa',
                      borderRadius: 6,
                      padding: '6px 8px',
                      fontSize: 12,
                      color: '#9a3412',
                      marginBottom: 8
                    }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: '#ea580c', textTransform: 'uppercase' }}>Next Stop</div>
                      <div style={{ fontWeight: 800 }}>{computedNextStop.stop_name}</div>
                      <div style={{ fontSize: 11 }}>{computedNextStop.distanceKm} km away • {computedNextStop.etaMinutes}</div>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#94a3b8', borderTop: '1px solid #fed7aa', paddingTop: 6 }}>
                    Last GPS update: {new Date(bus.latest_location.timestamp).toLocaleTimeString()}
                  </div>

                  {onBusSelect && (
                    <button
                      onClick={() => onBusSelect(bus)}
                      style={{
                        marginTop: 10,
                        width: '100%',
                        padding: '7px 10px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: 6,
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: 'pointer',
                        boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)'
                      }}
                    >
                      Focus Live View
                    </button>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default BusMap;
