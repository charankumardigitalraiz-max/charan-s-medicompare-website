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
          border-radius: 6px !important;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1) !important;
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
        .pac-item:hover {
          background-color: #f8fafc !important;
        }
        .pac-item-query {
          font-weight: 500 !important;
          color: #0f172a !important;
        }
        .pac-icon {
          margin-right: 6px !important;
        }
      `}</style>

      <div
        className={`location-offcanvas-overlay fixed inset-0 bg-black/80 z-[999999999] flex items-center ${position === "right" ? "justify-end" : "justify-start"}`}
        onClick={handleOverlayClick}
      >
        <div
          className="location-offcanvas-content w-full max-w-[450px] h-full bg-white shadow-[-2px_0_10px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="p-[15px_20px] border-b border-b-[#eee] flex items-center justify-between bg-[#f8f9fa]"
          >
            <h6 className="mb-0">Select Your Location</h6>
            <button
              onClick={onClose}
              className="bg-none border-none text-[18px] cursor-pointer text-[#6c757d]"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Search Section */}
          <div className="p-[15px_20px] border-b border-b-[#eee]">
            <div className="row g-2 align-items-center">
              {/* INPUT - col-8 */}
              <div className="col-9">
                {isLoaded ? (
                  <Autocomplete
                    onLoad={(autocomplete) =>
                      (autocompleteRef.current = autocomplete)
                    }
                    onPlaceChanged={() => {
                      const place = autocompleteRef.current?.getPlace();
                      if (place) handlePlaceSelect(place);
                    }}
                    options={{
                      componentRestrictions: { country: "in" },
                      fields: [
                        "formatted_address",
                        "geometry",
                        "name",
                        "place_id",
                        "address_components",
                      ],
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Search for area, street name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="form-control p-[6px_12px] border border-[#c9c9c9ad] rounded-[6px] text-[14px]"
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    placeholder="Loading places..."
                    disabled
                    className="form-control"
                  />
                )}
              </div>

              <div className="col-3">
                <button
                  type="button"
                  onClick={handleLocateButtonClick}
                  className="locate-btn d-flex align-items-center justify-content-center p-[6px_12px] border border-[#8059ca] !rounded-[6px] !bg-[#8059ca] text-white cursor-pointer transition-all duration-200 w-full hover:bg-[#6a45b3] hover:border-[#6a45b3]"
                  title="Use current GPS location"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <g transform="translate(-8921 -11863)">
                      <rect
                        width="24"
                        height="24"
                        transform="translate(8921 11863)"
                        fill="none"
                      />
                      <g transform="translate(8923 11865)">
                        <path d="M10,6.363A3.636,3.636,0,1,0,13.635,10,3.647,3.647,0,0,0,10,6.363Zm8.09,2.727a8.119,8.119,0,0,0-7.181-7.181V0H9.09V1.909A7.954,7.954,0,0,0,1.909,9.09H0v1.818H1.909A8.119,8.119,0,0,0,9.09,18.089V20h1.818V18.089a8.119,8.119,0,0,0,7.181-7.181H20V9.09ZM10,16.362A6.363,6.363,0,1,1,16.362,10,6.324,6.324,0,0,1,10,16.362Z" />
                      </g>
                    </g>
                  </svg>{" "}
                  Locate
                </button>
              </div>
            </div>

            <div className="mt-2.5">
              <p className="text-[12px] text-[#6c757d] m-0">
                Current Location:{" "}
                <small className="text-dark">{currentAddress}</small>
              </p>
            </div>
          </div>

          <div
            className="border-b border-b-[#eee] p-[10px_20px] bg-[#f8f9fa]"
          >
            <p className="mb-0 fw-bold">
              Saved Addresses ({savedAddresses.length})
            </p>
          </div>

          <div className="flex-1 overflow-auto p-0">
            {isLoading ? (
              <div
                className="d-flex justify-content-center align-items-center h-[200px]"
              >
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : savedAddresses.length === 0 ? (
              <div className="text-center p-[40px_20px]">
                <i
                  className="fas fa-map-marker-alt text-muted text-[2rem]"
                ></i>
                <p className="text-muted mb-2">No saved addresses yet</p>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    const token = localStorage.getItem("medicomparestoken");
                    if (!token) navigate("/login");
                    else setShowLocationModal(true);
                  }}
                >
                  <i className="fas fa-plus me-2"></i>Add Address
                </button>
              </div>
            ) : (
              <div className="p-2.5">
                {(showAllAddresses
                  ? savedAddresses
                  : savedAddresses.slice(0, 3)
                ).map((address) => {
                  const hasLocation = hasLocationData(address);
                  const isSelected = selectedAddressId === address._id;

                  return (
                    <div
                      key={address._id}
                      className={`p-3 border rounded-[8px] mb-2 transition-all duration-200 ${isSelected ? "border-2 border-[#007bff] bg-[#f0f8ff]" : "border-[#e9ecef] bg-white"
                        } ${hasLocation ? "cursor-pointer" : "cursor-default"}`}
                      onClick={() =>
                        hasLocation && handleAddressSelect(address._id, true)
                      }
                    >
                      <div className="d-flex justify-content-between align-items-start">
                        <div className="flex-1">
                          <div className="d-flex align-items-center mb-1">
                            {hasLocation && (
                              <input
                                type="radio"
                                name="selectedAddress"
                                value={address._id}
                                checked={isSelected}
                                onChange={() =>
                                  handleAddressSelect(address._id, true)
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="mr-2.5 cursor-pointer w-[18px] h-[18px]"
                              />
                            )}
                            <i
                              className={`fas fa-${getAddressTypeIcon(
                                address.addressType
                              )} text-primary me-2`}
                            />
                            <span className="fw-bold text-capitalize">
                              {address.addressType}
                            </span>
                            {hasLocation ? (
                              <span
                                className="badge bg-success ms-2 text-[10px]"
                              >
                                <i className="fas fa-map-marker-alt me-1"></i>
                                Located
                              </span>
                            ) : (
                              <span
                                className="badge bg-warning ms-2 text-[10px]"
                              >
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                No Location
                              </span>
                            )}
                          </div>
                          <p
                            className="mb-1 text-[14px] text-[#333]"
                          >
                            {formatAddress(address)}
                          </p>
                          {address.description && (
                            <p
                              className="mb-1 text-[12px] text-[#6c757d]"
                            >
                              {address.description}
                            </p>
                          )}
                          {hasLocation && address.location.address && (
                            <p
                              className="mb-0 text-[11px] text-[#6c757d]"
                            >
                              <i className="fas fa-map-pin me-1"></i>
                              {address.location.address}
                            </p>
                          )}
                          {!hasLocation && (
                            <p
                              className="mb-0 text-[11px] text-[#ffc107]"
                            >
                              <i className="fas fa-exclamation-triangle me-1"></i>
                              Location not set - Click edit to add location
                            </p>
                          )}
                        </div>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                            title="Edit address"
                          >
                            <i className="fas fa-edit"></i>
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(address._id);
                            }}
                            title="Delete address"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {savedAddresses.length > 3 && (
                  <div className="text-center mt-2 mb-2">
                    <span
                      className="cursor-pointer text-[14px] font-[500]"
                      onClick={() => setShowAllAddresses(!showAllAddresses)}
                    >
                      {showAllAddresses ? (
                        <>View Less</>
                      ) : (
                        <>View More ({savedAddresses.length - 3} more)</>
                      )}
                    </span>
                  </div>
                )}

                <div className="text-center mt-3 mb-3">
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowLocationModal(true)}
                  >
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
