import { useEffect, useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { axiosCommonInstance } from "../../Apiservice";
import LocationModal from "../modals/LocationModal";
import { useNavigate } from "react-router";
import { useJsApiLoader } from "@react-google-maps/api";
import { useLocation } from "../../context/LocationContext";
import { GOOGLE_MAPS_API_KEY } from "../../utils";

const libraries = ["places"];

const constructLocationName = (components, fallback) => {
  if (!components) return fallback;

  if (fallback && fallback.length > 10 && /[a-zA-Z]/.test(fallback)) {
    return fallback;
  }

  let streetNumber = "";
  let route = "";
  let sublocality = "";
  let locality = "";
  let administrative_area_level_2 = "";
  let state = "";
  let country = "";
  let postalCode = "";

  for (const component of components) {
    const types = component.types;
    if (types.includes("street_number")) streetNumber = component.long_name;
    if (types.includes("route")) route = component.long_name;
    if (types.includes("sublocality") || types.includes("sublocality_level_1"))
      sublocality = component.long_name;
    if (types.includes("locality")) locality = component.long_name;
    if (types.includes("administrative_area_level_2"))
      administrative_area_level_2 = component.long_name;
    if (types.includes("administrative_area_level_1"))
      state = component.long_name;
    if (types.includes("country")) country = component.long_name;
    if (types.includes("postal_code")) postalCode = component.long_name;
  }

  const parts = [];
  if (streetNumber) parts.push(streetNumber);
  if (route) parts.push(route);
  if (sublocality) parts.push(sublocality);
  if (locality) parts.push(locality);

  if (
    administrative_area_level_2 &&
    !parts.includes(administrative_area_level_2)
  ) {
    parts.push(administrative_area_level_2);
  }

  if (state && !parts.includes(state)) parts.push(state);
  if (country && !parts.includes(country)) parts.push(country);
  if (postalCode && !parts.includes(postalCode)) parts.push(postalCode);

  if (parts.length > 0) return parts.join(", ");
  return fallback;
};

const LocationOffcanvas = ({
  isOpen,
  onClose,
  position = "right",
  source = "header",
}) => {
  const { updateLocation, latitude, longitude } = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [currentLocation, setCurrentLocation] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(
    "Detecting your location..."
  );
  const [currentLocationData, setCurrentLocationData] = useState(null);
  const [recentLocations, setRecentLocations] = useState([]);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAllAddresses, setShowAllAddresses] = useState(false);
  const navigate = useNavigate();
  const autocompleteRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const searchTimeoutRef = useRef(null);
  const [predictions, setPredictions] = useState([]);
  const [showPredictions, setShowPredictions] = useState(false);

  // const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // Initialize AutocompleteService once Maps API is loaded
  useEffect(() => {
    if (isLoaded && window.google?.maps?.places) {
      autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      // PlacesService needs a DOM element (a hidden div is fine)
      const mapDiv = document.createElement("div");
      placesServiceRef.current = new window.google.maps.places.PlacesService(mapDiv);
    }
  }, [isLoaded]);

  // Fetch predictions when searchQuery changes
  const fetchPredictions = useCallback((value) => {
    if (!autocompleteServiceRef.current || !value || value.trim().length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }
    autocompleteServiceRef.current.getPlacePredictions(
      { input: value, componentRestrictions: { country: "in" } },
      (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          setPredictions(results);
          setShowPredictions(true);
        } else {
          setPredictions([]);
          setShowPredictions(false);
        }
      }
    );
  }, []);

  // Resolve a prediction placeId into full place details
  const handlePredictionSelect = useCallback((prediction) => {
    setShowPredictions(false);
    setPredictions([]);
    setSearchQuery(prediction.description);
    if (!placesServiceRef.current) return;
    placesServiceRef.current.getDetails(
      { placeId: prediction.place_id, fields: ["formatted_address", "geometry", "name", "place_id", "address_components"] },
      (place, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
          handlePlaceSelect(place);
        }
      }
    );
  }, []);

  useEffect(() => {
    const handleFocus = () => {
      setTimeout(() => {
        const pac = document.querySelector(".pac-container");
        if (pac) {
          pac.classList.add(
            "!z-[10000000]",
            "!max-h-[320px]",
            "!overflow-y-auto",
            "!rounded-lg",
            "!shadow-lg",
            "!border",
            "!border-slate-100",
            "!font-sans"
          );
        }
      }, 300);
    };

    document.addEventListener("focusin", handleFocus);
    return () => document.removeEventListener("focusin", handleFocus);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSavedAddresses();
      loadRecentLocations();

      let activeAddressId = null;
      const savedLocation = localStorage.getItem("selectedLocation");
      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          activeAddressId = locationData.addressId || null;
        } catch (e) { }
      }
      setSelectedAddressId(activeAddressId);

      setShowAllAddresses(false);
      setSearchQuery(""); // Reset search on open
    }
  }, [isOpen]);

  useEffect(() => {
    const handleAddressUpdate = () => {
      if (isOpen) setTimeout(() => loadSavedAddresses(), 600);
    };
    const handleAddressSaved = () => {
      if (isOpen) setTimeout(() => loadSavedAddresses(), 600);
    };
    const handleAddressDeleted = () => {
      if (isOpen) setTimeout(() => loadSavedAddresses(), 600);
    };

    window.addEventListener("addressUpdated", handleAddressUpdate);
    window.addEventListener("addressSaved", handleAddressSaved);
    window.addEventListener("addressDeleted", handleAddressDeleted);

    // Close autocomplete on scroll — but NOT when scrolling inside our custom predictions dropdown
    const handleScroll = (e) => {
      // Skip if scrolling inside the predictions dropdown itself
      if (e.target?.closest && e.target.closest(".loc-predictions-dropdown")) {
        return;
      }

      if (document.activeElement && document.activeElement.tagName === "INPUT" && document.activeElement.closest(".location-offcanvas-content")) {
        document.activeElement.blur();
      }
    };

    if (isOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("addressUpdated", handleAddressUpdate);
      window.removeEventListener("addressSaved", handleAddressSaved);
      window.removeEventListener("addressDeleted", handleAddressDeleted);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && navigator.geolocation) {
      setCurrentAddress("Detecting your location...");
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLocation({ lat, lng });

          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();

            if (data.status === "OK" && data.results.length > 0) {
              const result = data.results[0];
              const formattedAddress = constructLocationName(result.address_components, result.formatted_address);
              setCurrentAddress(formattedAddress);

              // Extract pincode from address components first
              let postalCode =
                result.address_components?.find((component) =>
                  component.types.includes("postal_code")
                )?.long_name || null;

              // If pincode not found in address_components, try to extract from formatted_address
              if (!postalCode && formattedAddress) {
                const pincodeMatch = formattedAddress.match(/\b\d{6}\b/);
                if (pincodeMatch) {
                  postalCode = pincodeMatch[0];
                }
              }

              // If still no pincode, try other results from geocoding
              if (!postalCode && data.results.length > 1) {
                for (let i = 1; i < data.results.length; i++) {
                  const altResult = data.results[i];
                  const pincodeFromAlt =
                    altResult.address_components?.find((component) =>
                      component.types.includes("postal_code")
                    )?.long_name || null;

                  if (pincodeFromAlt) {
                    postalCode = pincodeFromAlt;
                    break;
                  }

                  // Also try extracting from formatted_address
                  if (!postalCode && altResult.formatted_address) {
                    const pincodeMatch =
                      altResult.formatted_address.match(/\b\d{6}\b/);
                    if (pincodeMatch) {
                      postalCode = pincodeMatch[0];
                      break;
                    }
                  }
                }
              }

              // Store full location data for use with Locate button
              const locationData = {
                name: formattedAddress || "Current Location",
                address: formattedAddress,
                coordinates: { lat, lng },
                placeId: result.place_id,
                pincode: postalCode,
                timestamp: new Date().toISOString(),
              };
              setCurrentLocationData(locationData);
            } else {
              setCurrentAddress("Location found, but address unavailable.");
              setCurrentLocationData(null);
            }
          } catch (err) {
            // Reverse geocoding error
            setCurrentAddress("Unable to fetch address.");
            setCurrentLocationData(null);
          }
        },
        (error) => {
          // Geolocation error
          if (error.code === error.PERMISSION_DENIED) {
            setCurrentAddress(
              "Location access denied. Please enable in browser settings."
            );
          } else {
            setCurrentAddress("Unable to detect location.");
          }
          setCurrentLocationData(null);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } else if (isOpen) {
      setCurrentAddress("Geolocation not supported by your browser.");
      setCurrentLocationData(null);
    }
  }, [isOpen]);

  const loadSavedAddresses = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) return;

      let currentPincode = null;
      const selectedLocationData = localStorage.getItem("selectedLocation");
      if (selectedLocationData) {
        try {
          const locationData = JSON.parse(selectedLocationData);
          currentPincode = locationData.pincode;
        } catch (e) {
        }
      }

      const params = {};
      if (currentPincode) {
        params.pincode = currentPincode;
        if (latitude && longitude) {
          params.lat = latitude;
          params.lng = longitude;
        }
      }

      const response = await axiosCommonInstance.get("address/list", {
        headers: { Authorization: `Bearer ${token}` },
        params: params,
      });

      if (response.data.success || response.data.data?.address) {
        const addresses =
          response.data.data?.address ||
          response.data.address ||
          response.data.addresses ||
          [];
        const sortedAddresses = sortAddressesByLatest(addresses);
        setSavedAddresses(sortedAddresses);
      }
    } catch (error) {
      toast.error("Failed to load saved addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentLocations = () => {
    const saved = localStorage.getItem("recentLocations");
    if (saved) {
      try {
        setRecentLocations(JSON.parse(saved));
      } catch (e) {
        // Failed to parse recent locations
      }
    }
  };

  const handlePlaceSelect = async (place) => {
    if (!place?.geometry?.location) return;

    // Extract pincode from address components first
    let postalCode =
      place.address_components?.find((component) =>
        component.types.includes("postal_code")
      )?.long_name || null;

    // If pincode not found in address_components, try to extract from formatted_address
    if (!postalCode && place.formatted_address) {
      const pincodeMatch = place.formatted_address.match(/\b\d{6}\b/);
      if (pincodeMatch) {
        postalCode = pincodeMatch[0];
      }
    }

    // If still no pincode, try reverse geocoding for more detailed info
    if (!postalCode && place.geometry?.location) {
      try {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.results.length > 0) {
          // Try to find pincode in all results, not just the first one
          for (const result of data.results) {
            const pincodeFromResult =
              result.address_components?.find((component) =>
                component.types.includes("postal_code")
              )?.long_name || null;

            if (pincodeFromResult) {
              postalCode = pincodeFromResult;
              break;
            }

            // Also try extracting from formatted_address
            if (!postalCode && result.formatted_address) {
              const pincodeMatch = result.formatted_address.match(/\b\d{6}\b/);
              if (pincodeMatch) {
                postalCode = pincodeMatch[0];
                break;
              }
            }
          }
        }
      } catch (err) {
        // Reverse geocoding error for pincode
      }
    }

    const locationData = {
      name: constructLocationName(place.address_components, place.formatted_address) || place.name,
      address: constructLocationName(place.address_components, place.formatted_address),
      coordinates: {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      },
      placeId: place.place_id,
      pincode: postalCode,
      timestamp: new Date().toISOString(),
    };

    const storageKey =
      source === "booking" ? "selectedLocationBooking" : "selectedLocation";
    localStorage.setItem(storageKey, JSON.stringify(locationData));

    if (source === "booking") {
      localStorage.setItem("selectedLocation", JSON.stringify(locationData));
    }

    addToRecentLocations(locationData);

    // Use LocationContext to update location globally
    updateLocation({ ...locationData, source });

    setSearchQuery("");
    onClose();
  };

  const addToRecentLocations = (location) => {
    const recent = JSON.parse(localStorage.getItem("recentLocations") || "[]");
    const updated = [
      location,
      ...recent.filter((loc) => loc.placeId !== location.placeId),
    ].slice(0, 5);
    localStorage.setItem("recentLocations", JSON.stringify(updated));
    setRecentLocations(updated);
  };

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowLocationModal(true);
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("No token found. Please login again.");
        return;
      }

      const response = await axiosCommonInstance.post(
        `address/delete/${addressId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success("Address deleted successfully!");
        loadSavedAddresses();
        window.dispatchEvent(
          new CustomEvent("addressDeleted", { detail: { addressId } })
        );
        window.dispatchEvent(new CustomEvent("addressUpdated"));
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete address");
    }
  };

  const handleSaveAddress = async (newAddress) => {
    setShowLocationModal(false);
    setEditingAddress(null);
    await loadSavedAddresses();

    // Auto-select the newly added address
    if (newAddress && newAddress._id) {
      setSelectedAddressId(newAddress._id);

      // Update location data for the new address
      if (hasLocationData(newAddress)) {
        const addressString =
          newAddress.location?.address || formatAddress(newAddress);
        let extractedPincode = extractPincodeFromAddress(addressString);

        const locationData = {
          name: addressString,
          address: addressString,
          coordinates: {
            lat: newAddress.location.coordinates[1],
            lng: newAddress.location.coordinates[0],
          },
          addressId: newAddress._id,
          pincode: extractedPincode || newAddress.pincode || newAddress.location?.pincode,
          timestamp: new Date().toISOString(),
        };

        const storageKey =
          source === "booking" ? "selectedLocationBooking" : "selectedLocation";
        localStorage.setItem(storageKey, JSON.stringify(locationData));

        if (source === "booking") {
          localStorage.setItem("selectedLocation", JSON.stringify(locationData));
        }

        addToRecentLocations(locationData);

        // Use LocationContext to update location globally
        updateLocation({ ...locationData, source });
      }
    }

    setTimeout(() => {
      window.dispatchEvent(new CustomEvent("addressSaved"));
      window.dispatchEvent(new CustomEvent("addressUpdated"));
      setTimeout(() => {
        loadSavedAddresses();
        onClose();
      }, 200);
    }, 500);
  };

  const handleAddressSelect = async (addressId, autoSubmit = false) => {
    setSelectedAddressId(addressId);

    if (autoSubmit) {
      const selectedAddress = savedAddresses.find(
        (addr) => addr._id === addressId
      );
      if (selectedAddress && hasLocationData(selectedAddress)) {
        const addressString =
          selectedAddress.location?.address || formatAddress(selectedAddress);
        let extractedPincode = extractPincodeFromAddress(addressString);

        // If pincode not found, try to get it from saved address fields
        if (!extractedPincode) {
          extractedPincode =
            selectedAddress.pincode ||
            selectedAddress.location?.pincode ||
            null;
        }

        // If still no pincode, try reverse geocoding
        if (!extractedPincode && selectedAddress.location?.coordinates) {
          try {
            const lat = selectedAddress.location.coordinates[1];
            const lng = selectedAddress.location.coordinates[0];
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await response.json();

            if (data.status === "OK" && data.results.length > 0) {
              // Try to find pincode in all results
              for (const result of data.results) {
                const pincodeFromResult =
                  result.address_components?.find((component) =>
                    component.types.includes("postal_code")
                  )?.long_name || null;

                if (pincodeFromResult) {
                  extractedPincode = pincodeFromResult;
                  break;
                }

                // Also try extracting from formatted_address
                if (!extractedPincode && result.formatted_address) {
                  const pincodeMatch =
                    result.formatted_address.match(/\b\d{6}\b/);
                  if (pincodeMatch) {
                    extractedPincode = pincodeMatch[0];
                    break;
                  }
                }
              }
            }
          } catch (err) {
            // Reverse geocoding error for pincode
          }
        }

        const locationData = {
          name: selectedAddress.location?.address || addressString || formatAddress(selectedAddress),
          address: addressString,
          coordinates: {
            lat: selectedAddress.location.coordinates[1],
            lng: selectedAddress.location.coordinates[0],
          },
          placeId: selectedAddress.location?.placeId || null,
          addressId: selectedAddress._id,
          pincode: extractedPincode,
          timestamp: new Date().toISOString(),
        };

        const storageKey =
          source === "booking" ? "selectedLocationBooking" : "selectedLocation";
        localStorage.setItem(storageKey, JSON.stringify(locationData));
        if (source === "booking")
          localStorage.setItem(
            "selectedLocation",
            JSON.stringify(locationData)
          );

        addToRecentLocations(locationData);

        setTimeout(() => {
          // Use LocationContext to update location globally
          updateLocation({ ...locationData, source });
          setTimeout(() => onClose(), 100);
        }, 50);
      }
    }
  };

  const handleSubmitAddress = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!selectedAddressId) return toast.error("Please select an address");

    handleAddressSelect(selectedAddressId, true);
  };

  const handleCloseModal = () => {
    setShowLocationModal(false);
    setEditingAddress(null);
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const formatAddress = (address) => {
    const parts = [];
    if (address.houseNo) parts.push(address.houseNo);
    if (address.area) parts.push(address.area);
    if (address.landmark) parts.push(address.landmark);
    return parts.join(", ");
  };

  const hasLocationData = (address) =>
    address.location &&
    address.location.coordinates &&
    address.location.coordinates.length === 2;

  const extractPincodeFromAddress = (addressString) => {
    if (!addressString) return null;
    const match = addressString.match(/\b\d{6}\b/);
    return match ? match[0] : null;
  };

  const handleLocateButtonClick = () => {
    // First, try to use current GPS location if available
    if (currentLocationData && currentLocationData.coordinates) {
      const locationData = { ...currentLocationData };

      const storageKey =
        source === "booking" ? "selectedLocationBooking" : "selectedLocation";
      localStorage.setItem(storageKey, JSON.stringify(locationData));

      if (source === "booking") {
        localStorage.setItem("selectedLocation", JSON.stringify(locationData));
      }

      addToRecentLocations(locationData);

      // Use LocationContext to update location globally
      updateLocation({ ...locationData, source });

      setSearchQuery("");
      onClose();
      return;
    }

    // Fallback: try to use Autocomplete selection if available
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (place && place.geometry && place.geometry.location) {
        handlePlaceSelect(place);
        return;
      }
    }

    // If neither is available, show error
    if (!currentLocationData) {
      toast.error(
        "Please wait for location detection or search for a location"
      );
    } else {
      toast.error("Please select a valid location from the suggestions");
    }
  };

  const sortAddressesByLatest = (addresses) => {
    return [...addresses].sort((a, b) => {
      if (a.createdAt && b.createdAt)
        return new Date(b.createdAt) - new Date(a.createdAt);
      if (a.updatedAt && b.updatedAt)
        return new Date(b.updatedAt) - new Date(a.updatedAt);
      if (a._id && b._id) {
        const tsA = parseInt(a._id.substring(0, 8), 16) * 1000;
        const tsB = parseInt(b._id.substring(0, 8), 16) * 1000;
        return tsB - tsA;
      }
      return 0;
    });
  };

  const getAddressTypeIcon = (type) => {
    switch (type) {
      case "home":
        return "home";
      case "office":
        return "building";
      case "work":
        return "briefcase";
      default:
        return "map-marker-alt";
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        .loc-search-input::placeholder { color: #94a3b8; font-size: 13px; }
        .loc-search-input:focus { outline: none; border-color: var(--color-primary,#4c2691) !important; }
      `}</style>

      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/55 backdrop-blur-[2px] z-[999999999] flex items-center ${position === "right" ? "justify-end" : "justify-start"}`}
        onClick={handleOverlayClick}
      >
        {/* Panel */}
        <div
          className="location-offcanvas-content w-full max-w-[420px] h-full flex flex-col bg-[#f8f7fc] shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* ── HEADER ── */}
          <div className="bg-primary py-[18px] px-5 pb-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-[34px] h-[34px] rounded-[10px] bg-white/18 flex items-center justify-center">
                <i className="fas fa-map-marker-alt text-white text-[14px]" />
              </div>
              <div>
                <div className="text-white font-bold text-[15px] leading-tight">
                  Select Location
                </div>
                <div className="text-white/70 text-[11px] mt-0.5">
                  Choose your delivery address
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 !rounded-full border border-white/30 bg-white/15 text-white flex items-center justify-center cursor-pointer text-[13px] transition-all duration-150 hover:bg-white/28"
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* ── SEARCH SECTION ── */}
          <div className="p-[14px] px-4 bg-white border-b border-[#ede9f8] shrink-0">
            {/* Search bar with custom autocomplete dropdown */}
            <div className="flex rounded-[10px] overflow-hidden border-[1.5px] border-[#e0d8f8] bg-white" style={{ position: "relative" }}>
              <div className="flex-1 flex items-center pl-2.5 gap-2">
                <i className="fas fa-search text-[#c4a8f0] text-[12px] shrink-0" />
                <input
                  type="text"
                  placeholder="Search area, street name..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    searchTimeoutRef.current = setTimeout(() => fetchPredictions(e.target.value), 300);
                  }}
                  onBlur={() => setTimeout(() => setShowPredictions(false), 200)}
                  onFocus={() => { if (predictions.length > 0) setShowPredictions(true); }}
                  className="loc-search-input"
                  autoComplete="off"
                  style={{
                    width: "100%",
                    border: "none",
                    outline: "none",
                    fontSize: "13px",
                    color: "#1e293b",
                    background: "transparent",
                    padding: "10px 0",
                    fontFamily: "inherit",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleLocateButtonClick}
                title="Use current GPS location"
                className="flex items-center gap-1.5 px-3.5 bg-primary text-white text-[12px] font-semibold !rou-r-md cursor-pointer shrink-0 transition-all duration-200 min-w-[80px] justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <g transform="translate(-8921 -11863)">
                    <rect width="24" height="24" transform="translate(8921 11863)" fill="none" />
                    <g transform="translate(8923 11865)">
                      <path d="M10,6.363A3.636,3.636,0,1,0,13.635,10,3.647,3.647,0,0,0,10,6.363Zm8.09,2.727a8.119,8.119,0,0,0-7.181-7.181V0H9.09V1.909A7.954,7.954,0,0,0,1.909,9.09H0v1.818H1.909A8.119,8.119,0,0,0,9.09,18.089V20h1.818V18.089a8.119,8.119,0,0,0,7.181-7.181H20V9.09ZM10,16.362A6.363,6.363,0,1,1,16.362,10,6.324,6.324,0,0,1,10,16.362Z" />
                    </g>
                  </g>
                </svg>
                Locate
              </button>
            </div>

            {/* Custom predictions dropdown */}
            {showPredictions && predictions.length > 0 && (
              <div
                className="loc-predictions-dropdown mt-1.5 rounded-[10px] border border-slate-200 bg-white shadow-lg overflow-y-auto"
                style={{ zIndex: 9999, maxHeight: "240px" }}
              >
                {predictions.map((pred) => (
                  <button
                    key={pred.place_id}
                    type="button"
                    onMouseDown={() => handlePredictionSelect(pred)}
                    className="w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 hover:bg-purple-50/60 border-b border-slate-100 last:border-0 transition-colors"
                  >
                    <i className="fas fa-map-marker-alt text-[#c4a8f0] text-[11px] mt-1 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-slate-800 truncate">
                        {pred.structured_formatting?.main_text || pred.description}
                      </div>
                      {pred.structured_formatting?.secondary_text && (
                        <div className="text-[11px] text-slate-400 truncate">
                          {pred.structured_formatting.secondary_text}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Current location chip */}
            <div className="mt-2.5 flex items-start gap-1.5 p-2 px-2.5 bg-[#f5f0ff] rounded-lg border border-[#ede5ff]">
              <div className="w-[22px] h-[22px] rounded-md bg-primary flex items-center justify-center shrink-0 mt-0.5">
                <i className="fas fa-location-arrow text-white text-[9px]" />
              </div>
              <div>
                <div className="text-[10px] text-primary font-semibold mb-0.5">
                  Current GPS Location
                </div>
                <div className="text-[12px] text-slate-600 font-medium leading-normal">
                  {currentAddress}
                </div>
              </div>
            </div>
          </div>

          {/* ── SAVED ADDRESSES LABEL ── */}
          <div className="py-3 px-4 pb-2.5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <i className="fas fa-bookmark text-primary text-[12px]" />
              <span className="text-[13px] font-bold text-slate-800">Saved Addresses</span>
              <span className="text-[11px] font-bold text-primary bg-[#f0e8ff] border-[1.5px] border-[#d4b8f8] rounded-full px-2 py-0.5">
                {savedAddresses.length}
              </span>
            </div>
          </div>

          {/* ── ADDRESS LIST ── */}
          <div className="flex-1 overflow-y-auto p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-[200px] gap-3">
                <div className="w-9 h-9 border-3 border-[#f0e8ff] border-t-primary rounded-full animate-spin" />
                <span className="text-[13px] text-slate-400">Loading addresses...</span>
              </div>
            ) : savedAddresses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 gap-3">
                <div className="w-16 h-16 rounded-[18px] bg-[#f5f0ff] flex items-center justify-center mb-1">
                  <i className="fas fa-map-marker-alt text-2xl text-[#c4a8f0]" />
                </div>
                <div className="text-center">
                  <div className="text-[15px] font-bold text-slate-800 mb-1">No Saved Addresses</div>
                  <div className="text-[13px] text-slate-400">Add an address to get started</div>
                </div>
                <button
                  onClick={() => {
                    const token = localStorage.getItem("medicomparestoken");
                    if (!token) navigate("/login");
                    else setShowLocationModal(true);
                  }}
                  className="mt-2 py-2.5 px-6 bg-primary text-white text-[13px] font-semibold border-none !rounded-xl cursor-pointer flex items-center gap-1.5 shadow-[0_4px_14px_rgba(128,89,202,0.35)]"
                >
                  <i className="fas fa-plus text-[11px]" />
                  Add Address
                </button>
              </div>
            ) : (
              <div className="p-3">
                {(showAllAddresses ? savedAddresses : savedAddresses.slice(0, 3)).map((address) => {
                  const hasLocation = hasLocationData(address);
                  const isSelected = selectedAddressId === address._id;

                  return (
                    <div
                      key={address._id}
                      onClick={() => hasLocation && handleAddressSelect(address._id, true)}
                      className={`relative rounded-md mb-3 overflow-hidden transition-all duration-250 ${hasLocation ? "cursor-pointer" : "cursor-default"
                        } border-[1.5px] bg-white ${isSelected
                          ? "border-primary shadow-[0_4px_20px_rgba(128,89,202,0.12)]"
                          : "border-slate-200 shadow-[0_2px_10px_rgba(15,23,42,0.04)] hover:border-[#c4a8f0]"
                        }`}
                    >
                      {/* Header */}
                      <div className={`p-2.5 px-3.5 flex items-center justify-between border-b border-slate-100 ${isSelected ? "bg-[#faf9fe]" : "bg-white"}`}>
                        <div className="flex items-center gap-2">
                          {hasLocation && (
                            <input
                              type="radio"
                              name="selectedAddress"
                              value={address._id}
                              checked={isSelected}
                              onChange={() => handleAddressSelect(address._id, true)}
                              onClick={(e) => e.stopPropagation()}
                              className="accent-primary w-3.5 h-3.5 cursor-pointer shrink-0"
                            />
                          )}
                          {/* Icon badge */}
                          <div className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${isSelected ? "bg-primary text-white" : "bg-slate-100 text-slate-500"}`}>
                            <i className={`fas fa-${getAddressTypeIcon(address.addressType)} text-[11px]`} />
                          </div>
                          <span className={`text-[13px] font-semibold capitalize ${isSelected ? "text-primary" : "text-slate-700"}`}>
                            {address.addressType}
                          </span>
                          {/* Location badge */}
                          {hasLocation ? (
                            <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                              <i className="fas fa-check-circle text-[8px]" />
                              Located
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-orange-600 bg-orange-50 rounded-md px-1.5 py-0.5 flex items-center gap-1">
                              <i className="fas fa-exclamation-circle text-[8px]" />
                              No Location
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div className="flex gap-1.5 shrink-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}
                            title="Edit"
                            className="w-[26px] h-[26px] !rounded-full border border-purple-100 !bg-primary text-white flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-primary hover:text-white hover:border-[var(--color-primary-dark,#5c33a6)]"
                          >
                            <i className="fas fa-pen text-[10px]" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(address._id); }}
                            title="Delete"
                            className="w-[26px] h-[26px] !rounded-full border border-rose-100 bg-rose-600 text-rose-600 flex items-center justify-center cursor-pointer transition-all duration-150 hover:bg-rose-600 hover:text-white hover:border-rose-600"
                          >
                            <i className="fas fa-trash text-[10px]" />
                          </button>
                        </div>
                      </div>

                      {/* Body */}
                      <div className={`p-2.5 px-3.5 ${isSelected ? "bg-[#faf9fe]" : "bg-white"}`}>
                        <p className="m-0 text-[13px] text-slate-600 font-medium leading-relaxed">
                          {formatAddress(address)}
                        </p>
                        {address.description && (
                          <p className="mt-1 text-[11px] text-slate-500">
                            {address.description}
                          </p>
                        )}
                        {hasLocation && address.location?.address && (
                          <p className="mt-1.5 text-[11px] text-slate-500 flex items-center gap-1">
                            <i className="fas fa-map-pin text-[9px] text-primary" />
                            {address.location.address}
                          </p>
                        )}
                        {!hasLocation && (
                          <p className="mt-1.5 text-[11px] text-orange-600 flex items-center gap-1">
                            <i className="fas fa-exclamation-triangle text-[9px]" />
                            Location not set — click edit to add
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {savedAddresses.length > 3 && (
                  <div className="text-center my-1 mb-3">
                    <button
                      onClick={() => setShowAllAddresses(!showAllAddresses)}
                      className="text-[12px] font-semibold text-primary bg-[#f5f0ff] border-[1.5px] border-[#ddd0f8] rounded-lg px-4 py-1.5 cursor-pointer transition-all duration-150 hover:bg-[#ede5ff]"
                    >
                      {showAllAddresses ? "↑ View Less" : `↓ View ${savedAddresses.length - 3} More`}
                    </button>
                  </div>
                )}

                <div className="flex justify-center mt-3 w-full">
                  <button
                    onClick={() => setShowLocationModal(true)}
                    className="w-full max-w-[240px] py-2.5 bg-primary text-white text-[13px] font-semibold border-none !rounded-xl cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(128,89,202,0.35)] transition-all duration-200"
                  >
                    <i className="fas fa-plus text-[11px]" />
                    Add New Address
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showLocationModal && createPortal(
        <LocationModal
          showModal={showLocationModal}
          onClose={handleCloseModal}
          onSaveAddress={handleSaveAddress}
          editingAddress={editingAddress}
          isLoaded={isLoaded}
        />,
        document.body
      )}
    </>
  );
};

export default LocationOffcanvas;

