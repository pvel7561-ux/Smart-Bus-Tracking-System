const geolocationService = {
  isSupported() {
    return 'geolocation' in navigator;
  },

  getCurrentPosition(options = {}) {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('Geolocation is not supported by your browser.'));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
        ...options
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed || 0,
            heading: position.coords.heading || 0,
            timestamp: position.timestamp
          });
        },
        (error) => {
          reject(this.formatError(error));
        },
        defaultOptions
      );
    });
  },

  watchPosition(onSuccess, onError, options = {}) {
    if (!this.isSupported()) {
      onError({
        code: 0,
        message: 'Geolocation is not supported by your browser.'
      });
      return null;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    return navigator.geolocation.watchPosition(
      (position) => {
        onSuccess({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          speed: position.coords.speed || 0,
          heading: position.coords.heading || 0,
          timestamp: position.timestamp
        });
      },
      (error) => {
        onError(this.formatError(error));
      },
      defaultOptions
    );
  },

  clearWatch(watchId) {
    if (watchId !== null && this.isSupported()) {
      navigator.geolocation.clearWatch(watchId);
    }
  },

  formatError(error) {
    let message = 'An unknown geolocation error occurred.';
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        message = 'Location permission was denied. Please allow GPS access in your browser settings or lock icon in your address bar.';
        break;
      case 2: // POSITION_UNAVAILABLE
        message = 'GPS location is unavailable. Check your device GPS signal or location toggles.';
        break;
      case 3: // TIMEOUT
        message = 'Location request timed out. Retrying GPS fix...';
        break;
    }
    return {
      code: error.code,
      message,
      original: error
    };
  }
};

export default geolocationService;
