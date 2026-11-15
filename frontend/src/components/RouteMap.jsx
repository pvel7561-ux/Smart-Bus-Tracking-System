import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import { createStopIcon } from './BusMap';
import busService from '../services/busService';

const RouteFitBounds = ({ stops }) => {
  const map = useMap();
  useEffect(() => {
    if (stops && stops.length > 0) {
      const coords = stops.map((s) => [s.latitude, s.longitude]);
      if (coords.length === 1) {
        map.setView(coords[0], 14);
      } else {
        map.fitBounds(coords, { padding: [40, 40] });
      }
    }
  }, [stops, map]);
  return null;
};

const RouteMap = ({ route, stops = [], height = '400px' }) => {
  const [osrmPoints, setOsrmPoints] = useState([]);
  const [distanceInfo, setDistanceInfo] = useState(null);

  useEffect(() => {
    if (stops && stops.length >= 2) {
      const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
      const coordsString = sortedStops.map((s) => `${s.longitude},${s.latitude}`).join(';');

      busService.getOSRMRoute(coordsString).then((res) => {
        if (res && res.points) {
          setOsrmPoints(res.points);
          if (res.distance_km) {
            setDistanceInfo({
              distance: res.distance_km,
              duration: res.duration_min
            });
          }
        } else {
          // Fallback to straight lines
          setOsrmPoints(sortedStops.map((s) => [s.latitude, s.longitude]));
        }
      });
    } else {
      setOsrmPoints([]);
      setDistanceInfo(null);
    }
  }, [stops]);

  const defaultCenter = stops.length > 0 ? [stops[0].latitude, stops[0].longitude] : [13.0827, 80.2707];

  return (
    <div style={{
      height,
      width: '100%',
      position: 'relative',
      borderRadius: 'var(--radius)',
      overflow: 'hidden',
      border: '2px solid #fed7aa',
      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.1)'
    }}>
      {distanceInfo && (
        <div style={{
          position: 'absolute',
          top: 12,
          right: 12,
          zIndex: 1000,
          background: 'rgba(28, 25, 23, 0.9)',
          color: '#fef08a',
          padding: '6px 14px',
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 700,
          backdropFilter: 'blur(4px)',
          border: '1px solid #f59e0b',
          boxShadow: 'var(--shadow-md)'
        }}>
          Road Distance: <strong style={{ color: '#ffffff' }}>{distanceInfo.distance} km</strong> (~{distanceInfo.duration} mins)
        </div>
      )}

      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RouteFitBounds stops={stops} />

        {osrmPoints.length > 1 && (
          <Polyline
            positions={osrmPoints}
            pathOptions={{ color: '#ea580c', weight: 5, opacity: 0.85 }}
          />
        )}

        {stops.map((stop, idx) => {
          const isStart = idx === 0;
          const isEnd = idx === stops.length - 1;
          return (
            <Marker
              key={`route-stop-${stop.id || idx}`}
              position={[stop.latitude, stop.longitude]}
              icon={createStopIcon(stop, isStart, isEnd)}
            >
              <Popup>
                <div style={{ minWidth: 170, padding: 2 }}>
                  <div style={{ fontSize: 11, color: isStart ? '#10b981' : isEnd ? '#ef4444' : '#ea580c', fontWeight: 800, textTransform: 'uppercase' }}>
                    {isStart ? '🏁 Starting Terminal' : isEnd ? '🏁 Final Destination' : `Transit Stop #${stop.stop_order}`}
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#1c1917', marginTop: 3 }}>
                    {stop.stop_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#78350f', marginTop: 4 }}>
                    Sequence: <strong>Stop {stop.stop_order} of {stops.length}</strong>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default RouteMap;
