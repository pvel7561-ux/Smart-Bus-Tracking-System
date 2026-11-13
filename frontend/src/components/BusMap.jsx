import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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
          width: 42px;
          height: 42px;
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
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z"/>
          </svg>
        </div>
        <div style="
          background: #1c1917;
          color: #fef08a;
          font-weight: 800;
          font-size: 11px;
          padding: 2px 7px;
          border-radius: 5px;
          margin-top: 3px;
          white-space: nowrap;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 1.5px solid #f59e0b;
        ">
          ${busNumber || 'BUS'}
        </div>
      </div>
    `,
    iconSize: [46, 58],
    iconAnchor: [23, 29],
    popupAnchor: [0, -30],
  });
};

// Custom Bus Stop Icon in Amber/Yellow
export const createStopIcon = (stopOrder, isTerminal = false) => {
  const bg = isTerminal ? '#ef4444' : '#f59e0b';
  const textColor = isTerminal ? '#ffffff' : '#78350f';
  return L.divIcon({
    className: 'custom-stop-marker',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: ${bg};
        border: 2.5px solid #ffffff;
        box-shadow: 0 3px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: ${textColor};
        font-weight: 900;
        font-size: 12px;
      ">
        ${stopOrder}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -15],
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
      map.fitBounds(bounds, { padding: [50, 50] });
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
  onBusSelect = null
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
  if (selectedBusId) {
    const selected = buses.find((b) => b.id === selectedBusId);
    if (selected?.latest_location) {
      activeCenter = [selected.latest_location.latitude, selected.latest_location.longitude];
    }
  }

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

        {/* Bus Stop Markers */}
        {stops.map((stop, idx) => {
          const isTerminal = idx === 0 || idx === stops.length - 1;
          return (
            <Marker
              key={`stop-${stop.id || idx}`}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon(stop.stop_order || idx + 1, isTerminal)}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: isTerminal ? '#ef4444' : '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>
                    {idx === 0 ? 'Starting Point' : idx === stops.length - 1 ? 'Final Destination' : `Stop #${stop.stop_order || idx + 1}`}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1c1917', marginTop: 2 }}>
                    {stop.stop_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#78350f', marginTop: 4 }}>
                    Coordinates: {stop.latitude.toFixed(4)}, {stop.longitude.toFixed(4)}
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
                <div style={{ minWidth: 200, padding: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#1c1917' }}>
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

                  <div style={{ fontSize: 12, color: '#ea580c', fontWeight: 700, marginBottom: 8 }}>
                    <strong>Speed:</strong> {Math.round(bus.latest_location.speed || 0)} km/h
                  </div>

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
