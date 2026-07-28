import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(() => {
    const saved = localStorage.getItem('selectedLocation');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [selectedPincode, setSelectedPincode] = useState(() => {
    const saved = localStorage.getItem('selectedLocation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.pincode || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [isLocationUpdating, setIsLocationUpdating] = useState(false);

  useEffect(() => {
    const loadSavedLocation = () => {
      const savedLocation = localStorage.getItem('selectedLocation');
      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          setCurrentLocation(locationData);
          setSelectedPincode(locationData.pincode || null);
        } catch (error) {
          console.log('Error parsing saved location:', error);
        }
      } else {
        getCurrentLocation();
      }
    };

    const savedLocation = localStorage.getItem('selectedLocation');
    if (!savedLocation) {
      getCurrentLocation();
    }

    const handleLocationChange = (event) => {
      const locationData = event.detail;
      if (locationData) {
        setCurrentLocation(locationData);
        setSelectedPincode(locationData.pincode || null);
        localStorage.setItem('selectedLocation', JSON.stringify(locationData));
      }
    };

    window.addEventListener('locationChanged', handleLocationChange);

    return () => {
      window.removeEventListener('locationChanged', handleLocationChange);
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      console.log('Geolocation is not supported by this browser.');
      return;
    }

    setIsLocationUpdating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
          );
          const data = await response.json();

          if (data.status === "OK" && data.results.length > 0) {
            const result = data.results[0];
            let postalCode = result.address_components?.find((component) =>
              component.types.includes("postal_code")
            )?.long_name || null;
            if (!postalCode && result.formatted_address) {
              const pincodeMatch = result.formatted_address.match(/\b\d{6}\b/);
              if (pincodeMatch) {
                postalCode = pincodeMatch[0];
              }
            }

            const locationData = {
              name: result.formatted_address || "Current Location",
              address: result.formatted_address,
              coordinates: { lat: latitude, lng: longitude },
              placeId: result.place_id,
              pincode: postalCode,
              timestamp: new Date().toISOString(),
            };

            updateLocation(locationData);
          }
        } catch (error) {
          console.log('Error reverse geocoding location:', error);
        } finally {
          setIsLocationUpdating(false);
        }
      },
      (error) => {
        console.log('Geolocation error:', error);
        setIsLocationUpdating(false);
        if (error.code === error.PERMISSION_DENIED) {
          console.log('Location permission denied by user');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          console.log('Location information unavailable');
        } else if (error.code === error.TIMEOUT) {
          console.log('Location request timed out');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const updateLocation = (locationData) => {
    if (locationData) {
      setCurrentLocation(locationData);
      setSelectedPincode(locationData.pincode || null);
      localStorage.setItem('selectedLocation', JSON.stringify(locationData));
      window.dispatchEvent(
        new CustomEvent('locationChanged', {
          detail: locationData,
          bubbles: true,
          cancelable: true,
        })
      );
    }
  };

  const clearLocation = () => {
    setCurrentLocation(null);
    setSelectedPincode(null);
    localStorage.removeItem('selectedLocation');

    window.dispatchEvent(
      new CustomEvent('locationChanged', {
        detail: null,
        bubbles: true,
        cancelable: true,
      })
    );
  };

  const getLocationDisplayName = (selectedAddressLocation = null) => {
    const addressString = selectedAddressLocation ||
      currentLocation?.name ||
      currentLocation?.address ||
      'Select Location';

    if (!addressString) {
      return isLocationUpdating ? "Detecting location..." : "Please Allow Location Access";
    }

    return addressString.length > 45
      ? addressString.slice(0, 45) + "..."
      : addressString;
  };

  const value = {
    currentLocation,
    selectedPincode,
    isLocationUpdating,
    setIsLocationUpdating,
    getCurrentLocation,
    updateLocation,
    clearLocation,
    getLocationDisplayName,
    latitude: currentLocation?.coordinates?.lat || null,
    longitude: currentLocation?.coordinates?.lng || null,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

export default LocationContext;
