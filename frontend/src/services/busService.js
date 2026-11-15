import api from './api';

const busService = {
  // Bus Management
  async getBuses(params = {}) {
    const response = await api.get('/buses/', { params });
    return response.data;
  },

  async getBus(id) {
    const response = await api.get(`/buses/${id}/`);
    return response.data;
  },

  async createBus(busData) {
    const response = await api.post('/buses/', busData);
    return response.data;
  },

  async updateBus(id, busData) {
    const response = await api.put(`/buses/${id}/`, busData);
    return response.data;
  },

  async deleteBus(id) {
    const response = await api.delete(`/buses/${id}/`);
    return response.data;
  },

  // Drivers
  async getDrivers() {
    const response = await api.get('/drivers/');
    return response.data;
  },

  async createDriver(driverData) {
    const response = await api.post('/drivers/', driverData);
    return response.data;
  },

  // Routes & Stops
  async getRoutes(params = {}) {
    const response = await api.get('/routes/', { params });
    return response.data;
  },

  async getRoute(id) {
    const response = await api.get(`/routes/${id}/`);
    return response.data;
  },

  async createRoute(routeData) {
    const response = await api.post('/routes/', routeData);
    return response.data;
  },

  async addBusStop(routeId, stopData) {
    const response = await api.post(`/routes/${routeId}/stops/`, stopData);
    return response.data;
  },

  // Trips
  async startTrip(busId, routeId) {
    const response = await api.post('/trips/start/', { bus_id: busId, route_id: routeId });
    return response.data;
  },

  async stopTrip(tripId, busId) {
    const response = await api.post('/trips/stop/', { trip_id: tripId, bus_id: busId });
    return response.data;
  },

  async getActiveTrip() {
    const response = await api.get('/trips/active/');
    return response.data;
  },

  // Live Tracking
  async updateLocation(locationData) {
    const response = await api.post('/tracking/update/', locationData);
    return response.data;
  },

  async getLiveBuses(params = {}) {
    const response = await api.get('/tracking/buses/', { params });
    return response.data;
  },

  async getLiveBusDetail(busId) {
    const response = await api.get(`/tracking/bus/${busId}/`);
    return response.data;
  },

  async getLocationHistory(busId, params = {}) {
    const response = await api.get(`/tracking/history/${busId}/`, { params });
    return response.data;
  },

  // Road Route Geometry via OSRM
  async getOSRMRoute(coordinatesString) {
    try {
      const response = await api.get('/tracking/osrm-route/', {
        params: { coords: coordinatesString }
      });
      return response.data;
    } catch (e) {
      console.warn('OSRM route fetch failed, using direct coordinates fallback:', e);
      return null;
    }
  },

  // Reverse Geocoding: Coordinates -> Actual Human-Readable Bus Stop Name
  async reverseGeocode(lat, lon) {
    try {
      const response = await api.get('/routes/reverse-geocode/', {
        params: { lat, lon }
      });
      return response.data;
    } catch (e) {
      return {
        status: 'fallback',
        stop_name: `Bus Stop (${parseFloat(lat).toFixed(4)}, ${parseFloat(lon).toFixed(4)})`
      };
    }
  },

  // Search places or landmarks
  async searchPlaces(query) {
    try {
      const response = await api.get('/routes/search-places/', {
        params: { query }
      });
      return response.data;
    } catch (e) {
      return [];
    }
  },

  // Haversine Distance Calculation (in kilometers)
  calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  // Identify next upcoming bus stop along route and calculate ETA
  findNextUpcomingStop(busLocation, stops, busSpeed = 0) {
    if (!busLocation || !stops || stops.length === 0) return null;

    const sortedStops = [...stops].sort((a, b) => a.stop_order - b.stop_order);
    const busLat = busLocation.latitude;
    const busLon = busLocation.longitude;

    // Find closest stop
    let minDistance = Infinity;
    let closestIndex = 0;

    sortedStops.forEach((stop, index) => {
      const dist = this.calculateDistance(busLat, busLon, stop.latitude, stop.longitude);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = index;
      }
    });

    // If within 100 meters (0.1 km) of a stop, the next stop is the following one
    let nextIndex = closestIndex;
    if (minDistance < 0.1 && closestIndex < sortedStops.length - 1) {
      nextIndex = closestIndex + 1;
    }

    const nextStop = sortedStops[nextIndex];
    const distToNext = this.calculateDistance(busLat, busLon, nextStop.latitude, nextStop.longitude);

    // Calculate ETA (use active bus speed or default city transit speed 28 km/h)
    const effectiveSpeed = busSpeed > 5 ? busSpeed : 25;
    const etaMinutes = Math.max(1, Math.round((distToNext / effectiveSpeed) * 60));

    return {
      stop: nextStop,
      stop_name: nextStop.stop_name,
      stop_order: nextStop.stop_order,
      distanceKm: distToNext.toFixed(2),
      distanceMeters: Math.round(distToNext * 1000),
      etaMinutes: distToNext < 0.1 ? '< 1 min' : `${etaMinutes} min${etaMinutes > 1 ? 's' : ''}`,
      totalStopsRemaining: sortedStops.length - nextIndex,
      isDestination: nextIndex === sortedStops.length - 1,
      currentIndex: nextIndex
    };
  }
};

export default busService;
