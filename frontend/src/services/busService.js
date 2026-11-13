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
  }
};

export default busService;
