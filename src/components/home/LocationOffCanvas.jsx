import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { axiosCommonInstance } from "../../Apiservice";
import LocationModal from "../LocationModal";
import { useNavigate } from "react-router";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useLocation } from "../../context/LocationContext";

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

  const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

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

    // Close autocomplete on scroll to prevent detached dropdown
    const handleScroll = (e) => {
      const isPacContainer = e.target?.classList?.contains && e.target.classList.contains("pac-container");
      const isPacItem = e.target?.closest && e.target.closest(".pac-container");

      if (isPacContainer || isPacItem) {
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
        .pac-container {
          z-index: 99999999999999999 !important;
          max-height: 120px !important;
          overflow-y: auto !important;
          overflow-x: hidden !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 10px !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important;
        }
        @media (max-width: 768px) {
          .pac-container {
            left: 12px !important;
            right: 12px !important;
            transform: none !important;
            width: auto !important;
            max-height: 180px !important;
          }
        }
        .pac-item {
          padding: 8px 12px !important;
          cursor: pointer !important;
          font-size: 13px !important;
          white-space: nowrap !important;
          border-top: 1px solid #f1f5f9 !important;
          display: flex !important;
          align-items: center !important;
        }
        .pac-item:hover { background-color: #f8fafc !important; }
        .pac-item-query { font-weight: 500 !important; color: #0f172a !important; }
        .pac-icon { margin-right: 6px !important; }
        .loc-search-input::placeholder { color: #94a3b8; font-size: 13px; }
        .loc-search-input:focus { outline: none; border-color: #321961 !important; }
      `}</style>

      {/* Overlay */}
      <div
        className="location-offcanvas-overlay"
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          zIndex: 999999999,
          display: "flex",
          alignItems: "center",
          justifyContent: position === "right" ? "flex-end" : "flex-start",
        }}
        onClick={handleOverlayClick}
      >
        {/* Panel */}
        <div
          className="location-offcanvas-content"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            maxWidth: "420px",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            background: "#f8f7fc",
            boxShadow: "-4px 0 32px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}
        >
          {/* ── HEADER ── */}
          <div
            style={{
              background: "linear-gradient(135deg, #321961 0%, #a07de0 100%)",
              padding: "18px 20px 16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div
                style={{
                  width: "34px", height: "34px",
                  borderRadius: "10px",
                  background: "rgba(255,255,255,0.18)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                <i className="fas fa-map-marker-alt" style={{ color: "#fff", fontSize: "14px" }} />
              </div>
              <div>
                <div style={{ color: "#fff", fontWeight: 700, fontSize: "15px", lineHeight: 1.2 }}>
                  Select Location
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "11px", marginTop: "2px" }}>
                  Choose your delivery address
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: "32px", height: "32px",
                borderRadius: "8px",
                border: "1.5px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.15)",
                color: "#fff",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer",
                fontSize: "13px",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.28)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
            >
              <i className="fas fa-times" />
            </button>
          </div>

          {/* ── SEARCH SECTION ── */}
          <div
            style={{
              padding: "14px 16px",
              background: "#fff",
              borderBottom: "1px solid #ede9f8",
              flexShrink: 0,
            }}
          >
            {/* Search bar */}
            <div
              style={{
                display: "flex",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1.5px solid #e0d8f8",
                background: "#fff",
              }}
            >
              <div style={{ flex: 1, display: "flex", alignItems: "center", paddingLeft: "10px", gap: "8px" }}>
                <i className="fas fa-search" style={{ color: "#c4a8f0", fontSize: "12px", flexShrink: 0 }} />
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
                    onPlaceChanged={() => {
                      const place = autocompleteRef.current?.getPlace();
                      if (place) handlePlaceSelect(place);
                    }}
                    options={{
                      componentRestrictions: { country: "in" },
                      fields: ["formatted_address", "geometry", "name", "place_id", "address_components"],
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search area, street name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="loc-search-input"
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
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    placeholder="Loading places..."
                    disabled
                    style={{
                      width: "100%", border: "none", outline: "none",
                      fontSize: "13px", color: "#94a3b8",
                      background: "transparent", padding: "10px 0",
                    }}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={handleLocateButtonClick}
                title="Use current GPS location"
                style={{
                  display: "flex", alignItems: "center", gap: "6px",
                  padding: "0 14px",
                  background: "linear-gradient(135deg, #321961 0%, #9d72e8 100%)",
                  border: "none",
                  color: "#fff",
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "all 0.2s",
                  minWidth: "80px",
                  justifyContent: "center",
                }}
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

            {/* Current location chip */}
            <div
              style={{
                marginTop: "10px",
                display: "flex",
                alignItems: "flex-start",
                gap: "7px",
                padding: "8px 10px",
                background: "#f5f0ff",
                borderRadius: "8px",
                border: "1px solid #ede5ff",
              }}
            >
              <div
                style={{
                  width: "22px", height: "22px", borderRadius: "6px",
                  background: "#321961",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, marginTop: "1px",
                }}
              >
                <i className="fas fa-location-arrow" style={{ color: "#fff", fontSize: "9px" }} />
              </div>
              <div>
                <div style={{ fontSize: "10px", color: "#321961", fontWeight: 600, marginBottom: "1px" }}>
                  Current GPS Location
                </div>
                <div style={{ fontSize: "12px", color: "#475569", fontWeight: 500, lineHeight: 1.4 }}>
                  {currentAddress}
                </div>
              </div>
            </div>
          </div>

          {/* ── SAVED ADDRESSES LABEL ── */}
          <div
            style={{
              padding: "12px 16px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <i className="fas fa-bookmark" style={{ color: "#321961", fontSize: "12px" }} />
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1e293b" }}>Saved Addresses</span>
              <span
                style={{
                  fontSize: "11px", fontWeight: 700,
                  color: "#321961",
                  background: "#f0e8ff",
                  border: "1.5px solid #d4b8f8",
                  borderRadius: "999px",
                  padding: "1px 8px",
                }}
              >
                {savedAddresses.length}
              </span>
            </div>
          </div>

          {/* ── ADDRESS LIST ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>
            {isLoading ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "200px", gap: "12px" }}>
                <div
                  style={{
                    width: "36px", height: "36px",
                    border: "3px solid #f0e8ff",
                    borderTop: "3px solid #321961",
                    borderRadius: "50%",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span style={{ fontSize: "13px", color: "#94a3b8" }}>Loading addresses...</span>
              </div>
            ) : savedAddresses.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 24px", gap: "12px" }}>
                <div
                  style={{
                    width: "64px", height: "64px", borderRadius: "18px",
                    background: "#f5f0ff",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    marginBottom: "4px",
                  }}
                >
                  <i className="fas fa-map-marker-alt" style={{ fontSize: "24px", color: "#c4a8f0" }} />
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", marginBottom: "4px" }}>No Saved Addresses</div>
                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>Add an address to get started</div>
                </div>
                <button
                  onClick={() => {
                    const token = localStorage.getItem("medicomparestoken");
                    if (!token) navigate("/login");
                    else setShowLocationModal(true);
                  }}
                  style={{
                    marginTop: "8px",
                    padding: "10px 24px",
                    background: "linear-gradient(135deg, #321961 0%, #9d72e8 100%)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "7px",
                    boxShadow: "0 4px 14px rgba(128,89,202,0.35)",
                  }}
                >
                  <i className="fas fa-plus" style={{ fontSize: "11px" }} />
                  Add Address
                </button>
              </div>
            ) : (
              <div style={{ padding: "12px" }}>
                {(showAllAddresses ? savedAddresses : savedAddresses.slice(0, 3)).map((address) => {
                  const hasLocation = hasLocationData(address);
                  const isSelected = selectedAddressId === address._id;

                  return (
                    <div
                      key={address._id}
                      onClick={() => hasLocation && handleAddressSelect(address._id, true)}
                      style={{
                        position: "relative",
                        borderRadius: "12px",
                        marginBottom: "12px",
                        overflow: "hidden",
                        cursor: hasLocation ? "pointer" : "default",
                        border: "1.5px solid",
                        borderColor: isSelected ? "#321961" : "#e2e8f0",
                        background: "#fff",
                        boxShadow: isSelected
                          ? "0 4px 20px rgba(128,89,202,0.12)"
                          : "0 2px 10px rgba(15,23,42,0.04)",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#c4a8f0";
                          e.currentTarget.style.boxShadow = "0 6px 16px rgba(128,89,202,0.08)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = "#e2e8f0";
                          e.currentTarget.style.boxShadow = "0 2px 10px rgba(15,23,42,0.04)";
                        }
                      }}
                    >

                      {/* Header */}
                      <div
                        style={{
                          padding: "10px 14px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: isSelected ? "#faf9fe" : "#fff",
                          borderBottom: "1px solid #f1f5f9",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {hasLocation && (
                            <input
                              type="radio"
                              name="selectedAddress"
                              value={address._id}
                              checked={isSelected}
                              onChange={() => handleAddressSelect(address._id, true)}
                              onClick={(e) => e.stopPropagation()}
                              className="accent-[#321961]"
                              style={{ width: "14px", height: "14px", cursor: "pointer", flexShrink: 0 }}
                            />
                          )}
                          {/* Icon badge */}
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: isSelected ? "#321961" : "#f1f5f9",
                              flexShrink: 0,
                            }}
                          >
                            <i
                              className={`fas fa-${getAddressTypeIcon(address.addressType)}`}
                              style={{ fontSize: "11px", color: isSelected ? "#fff" : "#64748b" }}
                            />
                          </div>
                          <span
                            style={{
                              fontSize: "13px",
                              fontWeight: 600,
                              color: isSelected ? "#321961" : "#334155",
                              textTransform: "capitalize",
                            }}
                          >
                            {address.addressType}
                          </span>
                          {/* Location badge */}
                          {hasLocation ? (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 500,
                                color: "#16a34a",
                                background: "#f0fdf4",
                                borderRadius: "6px",
                                padding: "2px 6px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <i className="fas fa-check-circle" style={{ fontSize: "8px" }} />
                              Located
                            </span>
                          ) : (
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 500,
                                color: "#ea580c",
                                background: "#fff7ed",
                                borderRadius: "6px",
                                padding: "2px 6px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <i className="fas fa-exclamation-circle" style={{ fontSize: "8px" }} />
                              No Location
                            </span>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditAddress(address); }}
                            title="Edit"
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#f5f3ff";
                              e.currentTarget.style.color = "#321961";
                              e.currentTarget.style.borderColor = "#c4a8f0";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff";
                              e.currentTarget.style.color = "#64748b";
                              e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                          >
                            <i className="fas fa-pen" style={{ fontSize: "10px" }} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteAddress(address._id); }}
                            title="Delete"
                            style={{
                              width: "26px",
                              height: "26px",
                              borderRadius: "6px",
                              border: "1px solid #e2e8f0",
                              background: "#fff",
                              color: "#64748b",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = "#fef2f2";
                              e.currentTarget.style.color = "#ef4444";
                              e.currentTarget.style.borderColor = "#fca5a5";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = "#fff";
                              e.currentTarget.style.color = "#64748b";
                              e.currentTarget.style.borderColor = "#e2e8f0";
                            }}
                          >
                            <i className="fas fa-trash" style={{ fontSize: "10px" }} />
                          </button>
                        </div>
                      </div>

                      {/* Body */}
                      <div style={{ padding: "10px 14px", background: isSelected ? "#faf9fe" : "#fff" }}>
                        <p style={{ margin: 0, fontSize: "13px", color: "#475569", fontWeight: 500, lineHeight: 1.5 }}>
                          {formatAddress(address)}
                        </p>
                        {address.description && (
                          <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#64748b" }}>
                            {address.description}
                          </p>
                        )}
                        {hasLocation && address.location?.address && (
                          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px" }}>
                            <i className="fas fa-map-pin" style={{ fontSize: "9px", color: "#321961" }} />
                            {address.location.address}
                          </p>
                        )}
                        {!hasLocation && (
                          <p style={{ margin: "6px 0 0", fontSize: "11px", color: "#ea580c", display: "flex", alignItems: "center", gap: "4px" }}>
                            <i className="fas fa-exclamation-triangle" style={{ fontSize: "9px" }} />
                            Location not set — click edit to add
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}

                {savedAddresses.length > 3 && (
                  <div style={{ textAlign: "center", margin: "4px 0 12px" }}>
                    <button
                      onClick={() => setShowAllAddresses(!showAllAddresses)}
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#321961",
                        background: "#f5f0ff",
                        border: "1.5px solid #ddd0f8",
                        borderRadius: "8px",
                        padding: "5px 16px",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {showAllAddresses ? "↑ View Less" : `↓ View ${savedAddresses.length - 3} More`}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setShowLocationModal(true)}
                  style={{
                    width: "100%",
                    padding: "11px",
                    background: "linear-gradient(135deg, #321961 0%, #9d72e8 100%)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "7px",
                    boxShadow: "0 4px 14px rgba(128,89,202,0.35)",
                    marginTop: "4px",
                    transition: "all 0.2s",
                  }}
                >
                  <i className="fas fa-plus" style={{ fontSize: "11px" }} />
                  Add New Address
                </button>
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

