import { useState, useEffect, useRef } from "react";
import {
  GoogleMap,
  Marker,
  useJsApiLoader,
  Autocomplete,
} from "@react-google-maps/api";
import toast from "react-hot-toast";
import { axiosCommonInstance } from "../Apiservice";
import { useResponsive } from "../hooks";
import { GOOGLE_MAPS_API_KEY } from "../utils";

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

const LocationModal = ({
  showModal,
  onClose,
  onSaveAddress,
  editingAddress = null,
  initialLocation = { lat: 17.443, lng: 78.473 },
  initialAddressDetails = { state: "", city: "", pincode: "" },
  isLoaded: isLoadedProp = null,
}) => {
  const [mapLocation, setMapLocation] = useState(initialLocation);
  const [hasAutoDetectedLocation, setHasAutoDetectedLocation] = useState(false);
  const [locationName, setLocationName] = useState(
    editingAddress?.location?.address || ""
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationPermissionDenied, setLocationPermissionDenied] =
    useState(false);
  const [addressDetails, setAddressDetails] = useState(initialAddressDetails);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("address-details");
  const [customAddressType, setCustomAddressType] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [locationChange, setLocationChange] = useState(false);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  // Tab-specific refs to avoid conflicts during initialization
  const addressAutocompleteRef = useRef(null);
  const addressInputRef = useRef(null);
  const recipientAutocompleteRef = useRef(null);
  const recipientInputRef = useRef(null);

  const { isMobile } = useResponsive();

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
    }
  };

  const handleSearchInputChange = (value) => {
    setLocationName(value);
    setSearchLocation(value);
    setFormData((prev) => ({
      ...prev,
      location: {
        ...prev.location,
        address: value,
      },
    }));
    if (!value || value.trim() === "") {
      setAddressDetails({
        pincode: "",
        city: "",
        state: "",
      });
    }
  };

  useEffect(() => {
    if (showModal && !editingAddress) {
      // Reset form fields and state back to empty defaults
      setFormData({
        houseNo: "",
        area: "",
        landmark: "",
        description: "",
        addressType: "home",
        location: {
          type: "point",
          coordinates: [],
          address: null,
        },
      });
      setCustomAddressType("");
      setActiveTab("address-details");
      setLocationName("");
      setSearchLocation("");
      setAddressDetails({ state: "", city: "", pincode: "" });
      setHasAutoDetectedLocation(false);
      setLocationChange(false);

      const savedLocation = localStorage.getItem("selectedLocation");
      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          if (locationData.coordinates && !locationData.addressId) {
            setMapLocation(locationData.coordinates);
            setLocationName(locationData.address || locationData.name || "");

            let pincode = locationData.pincode || "";
            let city = locationData.city || "";
            let state = locationData.state || "";

            if ((!city || !state) && locationData.coordinates) {
              fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${locationData.coordinates.lat},${locationData.coordinates.lng}&key=${GOOGLE_MAPS_API_KEY}`,
              )
                .then((response) => response.json())
                .then((data) => {
                  if (data.status === "OK" && data.results.length > 0) {
                    const result = data.results[0];
                    let geocodedCity = "";
                    let geocodedState = "";
                    let geocodedPincode = "";

                    for (const component of result.address_components) {
                      const types = component.types;
                      if (types.includes("locality"))
                        geocodedCity = component.long_name;
                      if (types.includes("administrative_area_level_1"))
                        geocodedState = component.long_name;
                      if (types.includes("postal_code"))
                        geocodedPincode = component.long_name;
                    }

                    setAddressDetails({
                      pincode: pincode || geocodedPincode || "",
                      city: city || geocodedCity || "",
                      state: state || geocodedState || "",
                    });
                  }
                })
                .catch((err) => {
                  toast.error("Reverse geocoding failed:", err);
                });
            } else {
              setAddressDetails({
                pincode: pincode,
                city: city,
                state: state,
              });
            }

            setHasAutoDetectedLocation(true);
            setSearchLocation(locationData.address || "");

            // Pre-populate formData with the coordinates and address from localStorage
            setFormData((prev) => ({
              ...prev,
              location: {
                type: "point",
                coordinates: [
                  locationData.coordinates.lng,
                  locationData.coordinates.lat,
                ],
                address: locationData.address || locationData.name || null,
                pincode: locationData.pincode || null,
              },
            }));
          } else {
            getCurrentLocation(false);
          }
        } catch (error) {
          toast.error("Error loading saved location:", error);
        }
      }
    }
  }, [showModal, editingAddress]);

  // Form state management
  const [formData, setFormData] = useState({
    houseNo: "",
    area: "",
    landmark: "",
    description: "",
    addressType: "home",
    location: {
      type: "point",
      coordinates: [],
      address: null,
    },
  });

  // const GOOGLE_MAPS_API_KEY =
  //   import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  //   "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded: localIsLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const isLoaded = isLoadedProp !== null ? isLoadedProp : localIsLoaded;

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
    if (editingAddress) {
      setFormData({
        houseNo: editingAddress.houseNo || "",
        area: editingAddress.area || "",
        landmark: editingAddress.landmark || "",
        description: editingAddress.description || "",
        addressType: editingAddress.addressType || "home",
        location: editingAddress.location || {
          type: "point",
          coordinates: [],
          address: null,
        },
      });

      const pincode =
        editingAddress.pincode || editingAddress.location?.pincode || "";
      const city = editingAddress.city || editingAddress.location?.city || "";
      const state =
        editingAddress.state || editingAddress.location?.state || "";

      if (pincode || city || state) {
        setAddressDetails({
          pincode: pincode,
          city: city,
          state: state,
        });
      }

      setLocationChange(true);
      if (editingAddress.location?.coordinates?.length === 2) {
        const [lng, lat] = editingAddress.location.coordinates;
        setMapLocation({ lat, lng });
        const locationAddress = editingAddress.location.address || "";
        setLocationName(locationAddress || "");
        setSearchLocation(locationAddress || "");
        setHasAutoDetectedLocation(true);

        const hasAllDetails = pincode && city && state;
        if (!hasAllDetails) {
          fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
          )
            .then((response) => response.json())
            .then((data) => {
              if (data.status === "OK" && data.results.length > 0) {
                const result = data.results[0];
                let geocodedCity = "",
                  geocodedState = "",
                  geocodedPincode = "";

                for (const component of result.address_components) {
                  const types = component.types;
                  if (types.includes("locality"))
                    geocodedCity = component.long_name;
                  if (types.includes("administrative_area_level_1"))
                    geocodedState = component.long_name;
                  if (types.includes("postal_code"))
                    geocodedPincode = component.long_name;
                }

                setAddressDetails({
                  pincode: pincode || geocodedPincode || "",
                  city: city || geocodedCity || "",
                  state: state || geocodedState || "",
                });
              }
            })
            .catch((err) => {
              // Reverse geocoding failed
            });
        }
      } else {
        getCurrentLocation(false);
      }

      if (editingAddress.addressType === "other") {
        setCustomAddressType(editingAddress.addressType || "");
      }
    }
  }, [editingAddress]);

  const onPlaceChanged = async (type = "default") => {
    const currentAutocompleteRef =
      type === "address"
        ? addressAutocompleteRef
        : type === "recipient"
          ? recipientAutocompleteRef
          : autocompleteRef;

    const currentInputRef =
      type === "address"
        ? addressInputRef
        : type === "recipient"
          ? recipientInputRef
          : searchInputRef;

    if (currentAutocompleteRef.current) {
      const place = currentAutocompleteRef.current.getPlace();

      if (place?.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();

        setMapLocation({ lat, lng });

        // Update the input value is handled by controlled state but let's keep direct ref as backup
        if (currentInputRef.current && place.formatted_address) {
          currentInputRef.current.value = place.formatted_address;
        }
        setSearchLocation("");

        let formattedAddress = constructLocationName(
          place.address_components,
          place.formatted_address || "",
        );
        let city = "";
        let state = "";
        let pincode = "";

        if (place.address_components) {
          for (const component of place.address_components) {
            const types = component.types;
            if (types.includes("locality")) city = component.long_name;
            if (types.includes("administrative_area_level_1"))
              state = component.long_name;
            if (types.includes("postal_code")) pincode = component.long_name;
          }
        }

        // If pincode not found in address_components, try to extract from formatted_address
        if (!pincode && formattedAddress) {
          const pincodeMatch = formattedAddress.match(/\b\d{6}\b/);
          if (pincodeMatch) {
            pincode = pincodeMatch[0];
          }
        }

        // If still no pincode, try reverse geocoding for more detailed info
        if (!pincode) {
          try {
            // const GOOGLE_MAPS_API_KEY =
            //   import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
            //   "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
            );
            const data = await response.json();

            if (data.status === "OK" && data.results.length > 0) {
              // Try to find pincode in all results, not just the first one
              for (const result of data.results) {
                const pincodeFromResult =
                  result.address_components?.find((component) =>
                    component.types.includes("postal_code"),
                  )?.long_name || null;

                if (pincodeFromResult) {
                  pincode = pincodeFromResult;
                  break;
                }

                // Also try extracting from formatted_address
                if (!pincode && result.formatted_address) {
                  const pincodeMatch =
                    result.formatted_address.match(/\b\d{6}\b/);
                  if (pincodeMatch) {
                    pincode = pincodeMatch[0];
                    break;
                  }
                }
              }
            }
          } catch (err) {
            // Reverse geocoding error for pincode
          }
        }

        setLocationName(formattedAddress);
        setAddressDetails({ state, city, pincode });
        setFormData((prev) => ({
          ...prev,
          location: {
            type: "point",
            coordinates: [lng, lat],
            address: formattedAddress,
            pincode: pincode || null,
          },
        }));

        // No immediate selectedLocation update here; wait until save button is clicked
      }
    }
  };

  const getCurrentLocation = async (showToast = true) => {
    if (!navigator.geolocation) {
      if (showToast)
        toast.error("Geolocation is not supported by your browser.");
      return;
    }

    const permissionState = await checkGeolocationPermission();
    if (permissionState === "denied") {
      setLocationPermissionDenied(true);
      if (showToast)
        toast.error(
          "Location permission denied. Please enable it in your browser settings.",
        );
      return;
    }

    setIsGettingLocation(true);
    setLocationPermissionDenied(false);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setMapLocation({ lat, lng });

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
          );
          const data = await response.json();

          if (data.status === "OK" && data.results.length > 0) {
            const result = data.results[0];
            const formattedAddress = constructLocationName(
              result.address_components,
              result.formatted_address,
            );

            let city = "",
              state = "",
              pincode = "";
            for (const component of result.address_components) {
              const types = component.types;
              if (types.includes("locality")) city = component.long_name;
              if (types.includes("administrative_area_level_1"))
                state = component.long_name;
              if (types.includes("postal_code")) pincode = component.long_name;
            }

            // If pincode not found in address_components, try to extract from formatted_address
            if (!pincode && formattedAddress) {
              const pincodeMatch = formattedAddress.match(/\b\d{6}\b/);
              if (pincodeMatch) {
                pincode = pincodeMatch[0];
              }
            }

            // If still no pincode, try other results from geocoding
            if (!pincode && data.results.length > 1) {
              for (let i = 1; i < data.results.length; i++) {
                const altResult = data.results[i];
                const pincodeFromAlt =
                  altResult.address_components?.find((component) =>
                    component.types.includes("postal_code"),
                  )?.long_name || null;

                if (pincodeFromAlt) {
                  pincode = pincodeFromAlt;
                  break;
                }

                // Also try extracting from formatted_address
                if (!pincode && altResult.formatted_address) {
                  const pincodeMatch =
                    altResult.formatted_address.match(/\b\d{6}\b/);
                  if (pincodeMatch) {
                    pincode = pincodeMatch[0];
                    break;
                  }
                }
              }
            }

            setLocationName(formattedAddress);
            setAddressDetails({ state, city, pincode });

            setFormData((prev) => ({
              ...prev,
              location: {
                type: "point",
                coordinates: [lng, lat],
                address: formattedAddress,
                pincode: pincode || null,
              },
            }));

            // No immediate selectedLocation update here; wait until save button is clicked

          }
        } catch (err) {
          // Reverse geocoding failed
        }

        setHasAutoDetectedLocation(true);
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermissionDenied(true);
          if (showToast)
            toast.error(
              "Location access denied. Please allow location access.",
            );
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  };

  const checkGeolocationPermission = async () => {
    if (!navigator.permissions) return "unknown";
    try {
      const permission = await navigator.permissions.query({
        name: "geolocation",
      });
      return permission.state;
    } catch {
      return "unknown";
    }
  };

  // Handle map click
  const handleMapClick = async (event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMapLocation({ lat, lng });

    // Reverse geocoding with Google
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        const formattedAddress = constructLocationName(
          result.address_components,
          result.formatted_address,
        );

        let city = "",
          state = "",
          pincode = "";
        for (const component of result.address_components) {
          const types = component.types;
          if (types.includes("locality")) city = component.long_name;
          if (types.includes("administrative_area_level_1"))
            state = component.long_name;
          if (types.includes("postal_code")) pincode = component.long_name;
        }

        setLocationName(formattedAddress);
        setAddressDetails({ state, city, pincode });

        setFormData((prev) => ({
          ...prev,
          location: {
            type: "point",
            coordinates: [lng, lat],
            address: formattedAddress,
            pincode: pincode || null,
          },
        }));

        // No immediate selectedLocation update here; wait until save button is clicked
      }
    } catch (err) {
      // Reverse geocoding failed on map click
    }
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    if (
      !formData.houseNo.trim() ||
      !formData.area.trim() ||
      formData.location.coordinates.length === 0
    ) {
      toast.error("Please fill all required fields and select a location.");
      return;
    }

    if (formData.addressType === "other" && !customAddressType.trim()) {
      toast.error("Please enter a custom address type.");
      return;
    }

    setIsSubmitting(true);

    try {
      const addressPayload = {
        houseNo: formData.houseNo,
        area: formData.area,
        landmark: formData.landmark,
        description: formData.description || null,
        addressType:
          formData.addressType === "other"
            ? customAddressType
            : formData.addressType,
        location: {
          ...formData.location,
          pincode: addressDetails.pincode || formData.location?.pincode || null,
        },
        pincode: addressDetails.pincode || formData.location?.pincode || null,
      };

      const success = await saveAddress(addressPayload);

      if (success) {
        if (formData.location.coordinates.length === 2) {
          const [lng, lat] = formData.location.coordinates;
          const locationData = {
            name: locationName || formData.location.address,
            address: locationName || formData.location.address,
            coordinates: { lat, lng },
            pincode: addressDetails.pincode || null,
            timestamp: new Date().toISOString(),
          };

          localStorage.setItem(
            "selectedLocation",
            JSON.stringify(locationData),
          );
          window.dispatchEvent(
            new CustomEvent("locationChanged", {
              detail: { ...locationData, source: "header" },
              bubbles: true,
              cancelable: true,
            }),
          );
        }
        onClose();
      }
    } catch (error) {
      // Save address failed
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveAddress = async (addressData) => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("You are not logged in. Please login again.");
        return false;
      }

      let response;
      if (editingAddress) {
        response = await axiosCommonInstance.post(
          `address/update/${editingAddress._id}`,
          addressData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } else {
        response = await axiosCommonInstance.post(
          "address/create",
          addressData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      }

      if (response.data.success) {
        toast.success(
          editingAddress
            ? "Address updated successfully!"
            : "Address saved successfully!",
        );
        onSaveAddress(response.data.data.address);
        return true;
      } else {
        toast.error(response.data.message || "Failed to save address.");
        return false;
      }
    } catch (error) {
      // API error

      let errorMessage = "Failed to save address. Please try again.";

      if (error.response) {
        errorMessage = error.response.data?.message || errorMessage;
        if (error.response.status === 401) {
          errorMessage = "Session expired. Please login again.";
        }
      } else if (error.request) {
        errorMessage =
          "No response from server. Check your internet connection.";
      } else {
        errorMessage = error.message || errorMessage;
      }

      toast.error(errorMessage);
      return false;
    }
  };

  const handleAddressTypeChange = (type) => {
    setFormData((prev) => ({ ...prev, addressType: type }));
    if (type !== "other") setCustomAddressType("");
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTabChange = (tabId) => setActiveTab(tabId);

  useEffect(() => {
    if (!showModal) {
      setSearchLocation("");
      setHasAutoDetectedLocation(false);
      setLocationPermissionDenied(false);
      if (searchInputRef.current) {
        searchInputRef.current.value = "";
      }
    } else if (
      showModal &&
      isLoaded &&
      editingAddress?.location?.address &&
      searchInputRef.current
    ) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.value = editingAddress.location.address;
        }
      }, 200);
    }
  }, [showModal, editingAddress, isLoaded]);

  useEffect(() => {
    const handleScroll = (e) => {
      const isPacContainer =
        e.target?.classList?.contains &&
        e.target.classList.contains("pac-container");
      const isPacItem = e.target?.closest && e.target.closest(".pac-container");

      if (isPacContainer || isPacItem) {
        return;
      }

      if (
        searchInputRef.current &&
        document.activeElement === searchInputRef.current
      ) {
        searchInputRef.current.blur();
      }
    };

    if (showModal) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [showModal]);

  if (!showModal) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  // Mobile Bottom Sheet View
  if (isMobile) {
    return (
      <>
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
          .custom-btn {
            border: 1px solid #dee2e6;
            background-color: white;
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 14px;
          }
          .custom-btn.active {
            background-color: #007bff;
            color: white;
            border-color: #007bff;
          }
          .location-input-wrapper {
            position: relative;
          }
          .pac-container {
            z-index: 2147483647 !important;
          }
        `}</style>
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999999999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: "fadeIn 0.4s ease-in-out",
          }}
          onClick={handleOverlayClick}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "100%",
              maxHeight: "95vh",
              backgroundColor: "white",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag Handle */}
            <div
              style={{
                width: "40px",
                height: "4px",
                backgroundColor: "#d1d5db",
                borderRadius: "2px",
                margin: "12px auto 8px",
                cursor: "grab",
              }}
            ></div>

            {/* Header */}
            <div
              style={{
                padding: "14px 16px",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f8f9fa",
              }}
            >
              <h5
                className="mb-0"
                style={{ fontSize: "18px", fontWeight: "600" }}
              >
                {editingAddress ? "Edit Address" : "Add New Address"}
              </h5>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#6c757d",
                  padding: "4px 8px",
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Scrollable Content */}
            <div
              style={{
                flex: 1,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div className="flex flex-wrap" style={{ flex: 1 }}>
                {/* Google Map - Mobile */}
                <div
                  className="w-full"
                  style={{
                    position: "relative",
                    height: "300px",
                    minHeight: "300px",
                  }}
                >
                  {loadError ? (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50 border rounded p-4">
                      <i
                        className="fas fa-exclamation-triangle text-amber-500 mb-3"
                        style={{ fontSize: "2rem" }}
                      ></i>
                      <h6
                        className="text-red-500 mb-2"
                        style={{ fontSize: "14px" }}
                      >
                        Google Maps Error
                      </h6>
                      <p
                        className="text-slate-500 text-center small mb-3"
                        style={{ fontSize: "12px" }}
                      >
                        Unable to load Google Maps. Please check your API key
                        and configuration.
                      </p>
                    </div>
                  ) : isLoaded ? (
                    <div style={{ position: "relative", height: "100%" }}>
                      <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={mapLocation}
                        zoom={15}
                        onClick={handleMapClick}
                      >
                        <Marker position={mapLocation} />
                      </GoogleMap>

                      <button
                        type="button"
                        className="btn btn-primary position-absolute"
                        style={{
                          top: "8px",
                          right: "8px",
                          zIndex: 1000,
                          borderRadius: "50%",
                          width: "40px",
                          height: "40px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: 0,
                        }}
                        onClick={() => getCurrentLocation(true)}
                        disabled={isGettingLocation}
                        title="Get my current location"
                      >
                        {isGettingLocation ? (
                          <div
                            className="spinner-border spinner-border-sm text-white"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <i
                            className="fas fa-crosshairs text-white"
                            style={{ fontSize: "14px" }}
                          ></i>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50 border rounded">
                      <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p
                        className="text-slate-500 mb-0"
                        style={{ fontSize: "12px" }}
                      >
                        Loading map...
                      </p>
                    </div>
                  )}
                </div>

                {/* Form - Mobile */}
                <div
                  className="w-full bg-white"
                  style={{ position: "relative" }}
                >
                  <div className="p-3 flex flex-col">
                    {/* Tabs */}
                    <div className="mb-2">
                      <ul
                        className="nav nav-tabs"
                        id="addressTabs"
                        role="tablist"
                        style={{ fontSize: "12px" }}
                      >
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${activeTab === "address-details" ? "active" : ""
                              }`}
                            type="button"
                            onClick={() => handleTabChange("address-details")}
                            style={{ fontSize: "12px", padding: "6px 10px" }}
                          >
                            Address Details
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${activeTab === "recipient-details" ? "active" : ""
                              }`}
                            type="button"
                            onClick={() => handleTabChange("recipient-details")}
                            style={{ fontSize: "12px", padding: "6px 10px" }}
                          >
                            Recipient Details
                          </button>
                        </li>
                      </ul>
                    </div>

                    <div
                      className="tab-content pt-2 flex-grow-1 flex flex-col"
                      style={{ minHeight: "400px" }}
                    >
                      <div
                        className={`tab-pane ${activeTab === "address-details" ? "show active" : ""
                          }`}
                        id="address-details"
                      >
                        <div className="flex flex-col">
                          <div className="mb-3">
                            <label
                              className="form-label mb-2"
                              style={{ fontSize: "13px" }}
                            >
                              Search Location (optional)
                            </label>
                            <div className="flex gap-2 items-center mb-2">
                              <div className="position-relative flex-grow-1">
                                <i
                                  className="fa-solid fa-location-dot position-absolute"
                                  style={{
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    zIndex: 1,
                                  }}
                                ></i>
                                {isLoaded ? (
                                  <Autocomplete
                                    onLoad={(autocomplete) => {
                                      addressAutocompleteRef.current = autocomplete;
                                    }}
                                    onPlaceChanged={() =>
                                      onPlaceChanged("address")
                                    }
                                    options={{
                                      componentRestrictions: { country: "in" },
                                      fields: [
                                        "formatted_address",
                                        "geometry",
                                        "address_components",
                                        "place_id",
                                      ],
                                    }}
                                  >
                                    <input
                                      ref={addressInputRef}
                                      type="text"
                                      disabled={!locationChange}
                                      className="form-control"
                                      placeholder="Enter location, pincode, city, state..."
                                      value={locationName || ""}
                                      onChange={(e) =>
                                        handleSearchInputChange(e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      style={{
                                        paddingLeft: "40px",
                                        fontSize: "14px",
                                      }}
                                    />
                                  </Autocomplete>
                                ) : (
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Loading Google Places..."
                                    disabled
                                    style={{
                                      paddingLeft: "40px",
                                      fontSize: "14px",
                                    }}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn btn-primary whitespace-nowrap"
                                onClick={() =>
                                  setLocationChange(!locationChange)
                                }
                                style={{
                                  height: "38px",
                                  minWidth: "80px",
                                  fontSize: "13px",
                                }}
                              >
                                {locationChange ? "Save" : "Change"}
                              </button>
                            </div>
                          </div>

                          {/* Location Name */}
                          <div className="mb-3">
                            <label
                              className="form-label mb-0"
                              style={{ fontSize: "13px" }}
                            >
                              Location Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={
                                isGeocoding
                                  ? "Loading location..."
                                  : locationName || ""
                              }
                              onChange={(e) => {
                                const newLocationName = e.target.value;
                                setLocationName(newLocationName);
                                setFormData((prev) => ({
                                  ...prev,
                                  location: {
                                    ...prev.location,
                                    address: newLocationName,
                                  },
                                }));
                              }}
                              placeholder="Enter location name or address"
                              style={{ fontSize: "14px" }}
                              disabled
                            />
                          </div>

                          {/* Pincode, City, State */}
                          <div className="mb-3">
                            <div className="flex flex-wrap -mx-1 [&>*]:px-1">
                              <div className="w-full md:w-[33.333%]">
                                <label
                                  className="form-label small"
                                  style={{ fontSize: "12px" }}
                                >
                                  Pincode
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-slate-50"
                                  value={addressDetails.pincode}
                                  readOnly
                                  style={{ fontSize: "13px" }}
                                />
                              </div>
                              <div className="w-full md:w-[33.333%]">
                                <label
                                  className="form-label small"
                                  style={{ fontSize: "12px" }}
                                >
                                  City
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-slate-50"
                                  value={addressDetails.city}
                                  readOnly
                                  style={{ fontSize: "13px" }}
                                />
                              </div>
                              <div className="w-full md:w-[33.333%]">
                                <label
                                  className="form-label small"
                                  style={{ fontSize: "12px" }}
                                >
                                  State
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-slate-50"
                                  value={addressDetails.state}
                                  readOnly
                                  style={{ fontSize: "13px" }}
                                />
                              </div>
                            </div>
                            <small
                              className="text-slate-500"
                              style={{ fontSize: "10px" }}
                            >
                              <i className="fas fa-info-circle mr-1"></i>
                              These fields are automatically filled when you
                              select a location
                            </small>
                          </div>

                          <div className="mt-auto">
                            <button
                              type="button"
                              className="btn btn-primary w-full"
                              onClick={() =>
                                handleTabChange("recipient-details")
                              }
                              style={{ fontSize: "14px", padding: "10px" }}
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Recipient Details Tab */}
                      <div
                        className={`tab-pane ${activeTab === "recipient-details" ? "show active" : ""
                          }`}
                        id="recipient-details"
                      >
                        <form
                          onSubmit={handleSaveAddress}
                          className="flex flex-col"
                        >
                          <div className="mb-2">
                            <label
                              className="form-label mb-2"
                              style={{ fontSize: "13px" }}
                            >
                              Save this address as{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "home"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() => handleAddressTypeChange("home")}
                                style={{
                                  fontSize: "12px",
                                  padding: "6px 12px",
                                  flex: "1",
                                  minWidth: "calc(50% - 4px)",
                                }}
                              >
                                Home
                              </button>
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "office"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() =>
                                  handleAddressTypeChange("office")
                                }
                                style={{
                                  fontSize: "12px",
                                  padding: "6px 12px",
                                  flex: "1",
                                  minWidth: "calc(50% - 4px)",
                                }}
                              >
                                Office
                              </button>
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "work"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() => handleAddressTypeChange("work")}
                                style={{
                                  fontSize: "12px",
                                  padding: "6px 12px",
                                  flex: "1",
                                  minWidth: "calc(50% - 4px)",
                                }}
                              >
                                Work
                              </button>
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "other"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() => handleAddressTypeChange("other")}
                                style={{
                                  fontSize: "12px",
                                  padding: "6px 12px",
                                  flex: "1",
                                  minWidth: "calc(50% - 4px)",
                                }}
                              >
                                Other
                              </button>
                            </div>
                          </div>

                          {formData.addressType === "other" && (
                            <div className="mb-2">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g., Hospital, School, Shop, etc."
                                value={customAddressType}
                                onChange={(e) =>
                                  setCustomAddressType(e.target.value)
                                }
                                required
                                style={{ fontSize: "14px" }}
                              />
                            </div>
                          )}

                          <div className="flex flex-wrap -mx-1 [&>*]:px-1 mb-2">
                            <div className="w-full mb-2 flex gap-2 items-center">
                              <div className="position-relative flex-grow-1">
                                <i
                                  className="fa-solid fa-location-dot position-absolute"
                                  style={{
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    zIndex: 1,
                                  }}
                                ></i>
                                {isLoaded ? (
                                  <Autocomplete
                                    onLoad={(autocomplete) => {
                                      recipientAutocompleteRef.current =
                                        autocomplete;
                                      if (
                                        editingAddress?.location?.address &&
                                        recipientInputRef.current
                                      ) {
                                        recipientInputRef.current.value =
                                          editingAddress.location.address;
                                      }
                                    }}
                                    onPlaceChanged={() =>
                                      onPlaceChanged("recipient")
                                    }
                                    options={{
                                      componentRestrictions: { country: "in" },
                                      fields: [
                                        "formatted_address",
                                        "geometry",
                                        "address_components",
                                        "place_id",
                                      ],
                                    }}
                                  >
                                    <input
                                      ref={recipientInputRef}
                                      type="text"
                                      disabled={!locationChange}
                                      className="form-control"
                                      placeholder="Enter location, pincode, city, state..."
                                      value={locationName}
                                      onChange={(e) =>
                                        handleSearchInputChange(e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      style={{
                                        paddingLeft: "40px",
                                        fontSize: "14px",
                                      }}
                                    />
                                  </Autocomplete>
                                ) : (
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Loading Google Places..."
                                    disabled
                                    style={{
                                      paddingLeft: "40px",
                                      fontSize: "14px",
                                    }}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn btn-primary whitespace-nowrap"
                                onClick={() =>
                                  setLocationChange(!locationChange)
                                }
                                style={{
                                  height: "38px",
                                  minWidth: "80px",
                                  fontSize: "13px",
                                }}
                              >
                                {locationChange ? "Save" : "Change"}
                              </button>
                            </div>
                            <div className="w-full">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter House/ Office/ Flat *"
                                value={formData.houseNo}
                                onChange={(e) =>
                                  handleInputChange("houseNo", e.target.value)
                                }
                                required
                                style={{ fontSize: "14px" }}
                              />
                            </div>
                            <div className="w-full">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Apartment/ Area *"
                                value={formData.area}
                                onChange={(e) =>
                                  handleInputChange("area", e.target.value)
                                }
                                required
                                style={{ fontSize: "14px" }}
                              />
                            </div>
                          </div>

                          <div className="flex flex-wrap -mx-1 [&>*]:px-1 mb-2">
                            <div className="w-full">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Nearby LandMark (optional)"
                                value={formData.landmark}
                                onChange={(e) =>
                                  handleInputChange("landmark", e.target.value)
                                }
                                style={{ fontSize: "14px" }}
                              />
                            </div>
                            <div className="w-full">
                              <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Ex: Near Gate, Pink Colour Building"
                                value={formData.description}
                                onChange={(e) =>
                                  handleInputChange(
                                    "description",
                                    e.target.value,
                                  )
                                }
                                style={{ fontSize: "14px" }}
                              ></textarea>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <button
                              type="submit"
                              className="btn btn-primary w-full"
                              disabled={isSubmitting}
                              style={{ fontSize: "14px", padding: "10px" }}
                            >
                              {isSubmitting ? (
                                <>
                                  <div
                                    className="spinner-border spinner-border-sm mr-2"
                                    role="status"
                                  >
                                    <span className="visually-hidden">
                                      Loading...
                                    </span>
                                  </div>
                                  {editingAddress ? "Updating..." : "Saving..."}
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-save mr-2"></i>
                                  {editingAddress
                                    ? "Update Address"
                                    : "Save Address"}
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop Modal View
  return (
    <>
      <style>{`
        @keyframes spin {
          0% { transform: translateY(-50%) rotate(0deg); }
          100% { transform: translateY(-50%) rotate(360deg); }
        }
        .custom-btn {
          border: 1px solid #dee2e6;
          background-color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 14px;
        }
        .custom-btn.active {
          background-color: #007bff;
          color: white;
          border-color: #007bff;
        }
        .location-input-wrapper {
          position: relative;
        }
        .pac-container {
          z-index: 2147483647 !important;
        }
      `}</style>

      <div
        className="modal show"
        style={{
          display: "block",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: "9999999999",
        }}
      >
        <div className="modal-dialog modal-xl modal-dialog-centered">
          <div
            className="modal-content shadow-lg"
            style={{
              borderRadius: "12px",
              overflow: "hidden",
              border: "none",
            }}
          >
            <div className="modal-body p-0">
              <div className="flex flex-wrap">
                {/* Google Map */}
                <div
                  className="md:w-[58.333%]"
                  style={{ position: "relative", height: "500px" }}
                >
                  {loadError ? (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50 border rounded p-4">
                      <i
                        className="fas fa-exclamation-triangle text-amber-500 mb-3"
                        style={{ fontSize: "3rem" }}
                      ></i>
                      <h6 className="text-red-500 mb-2">Google Maps Error</h6>
                      <p className="text-slate-500 text-center small mb-3">
                        Unable to load Google Maps. Please check your API key
                        and configuration.
                      </p>
                    </div>
                  ) : isLoaded ? (
                    <div style={{ position: "relative", height: "100%" }}>
                      <GoogleMap
                        mapContainerStyle={{ width: "100%", height: "100%" }}
                        center={mapLocation}
                        zoom={15}
                        onClick={handleMapClick}
                      >
                        <Marker position={mapLocation} />
                      </GoogleMap>

                      <button
                        type="button"
                        className="btn btn-primary position-absolute"
                        style={{
                          top: "8px",
                          right: "8px",
                          zIndex: 1000,
                          borderRadius: "50%",
                          width: "46px",
                          height: "46px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                        onClick={() => getCurrentLocation(true)}
                        disabled={isGettingLocation}
                        title="Get my current location"
                      >
                        {isGettingLocation ? (
                          <div
                            className="spinner-border spinner-border-sm text-white"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <i className="fas fa-crosshairs text-white"></i>
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-slate-50 border rounded">
                      <div
                        className="spinner-border text-primary mb-3"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="text-slate-500 mb-0">Loading map...</p>
                    </div>
                  )}
                </div>

                {/* Form */}
                <div className="md:w-[41.666%] bg-white" style={{ height: "500px" }}>
                  <div className="p-4 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="mb-0">
                        {editingAddress ? "Edit Address" : "Add New Address"}
                      </h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={onClose}
                      ></button>
                    </div>

                    {/* Tabs */}
                    <div className="mb-1">
                      <ul
                        className="nav nav-tabs"
                        id="addressTabs"
                        role="tablist"
                      >
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${activeTab === "address-details" ? "active" : ""
                              }`}
                            type="button"
                            onClick={() => handleTabChange("address-details")}
                          >
                            Address Details
                          </button>
                        </li>
                        <li className="nav-item" role="presentation">
                          <button
                            className={`nav-link ${activeTab === "recipient-details" ? "active" : ""
                              }`}
                            type="button"
                            onClick={() => handleTabChange("recipient-details")}
                          >
                            Recipient Details
                          </button>
                        </li>
                      </ul>
                    </div>

                    <div className="tab-content pt-2 flex-grow-1 flex flex-col">
                      {/* Address Details Tab */}
                      <div
                        className={`tab-pane ${activeTab === "address-details" ? "show active" : ""
                          }`}
                        id="address-details"
                      >
                        <div className="flex flex-col h-full">
                          {/* Location Search with Google Places Autocomplete */}
                          <div className="mb-1">
                            <label className="form-label mb-2">
                              Search Location (optional)
                            </label>
                            <div className="flex gap-2 items-center mb-1">
                              <div className="position-relative flex-grow-1">
                                <i
                                  className="fa-solid fa-location-dot position-absolute"
                                  style={{
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    zIndex: 1,
                                  }}
                                ></i>
                                {isLoaded ? (
                                  <Autocomplete
                                    onLoad={(autocomplete) => {
                                      addressAutocompleteRef.current =
                                        autocomplete;
                                    }}
                                    onPlaceChanged={() =>
                                      onPlaceChanged("address")
                                    }
                                    options={{
                                      componentRestrictions: { country: "in" },
                                      fields: [
                                        "formatted_address",
                                        "geometry",
                                        "address_components",
                                        "place_id",
                                      ],
                                    }}
                                  >
                                    <input
                                      ref={addressInputRef}
                                      type="text"
                                      disabled={!locationChange}
                                      className="form-control"
                                      placeholder="Enter location, pincode, city, state..."
                                      value={locationName}
                                      onChange={(e) =>
                                        handleSearchInputChange(e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      style={{ paddingLeft: "40px" }}
                                    />
                                  </Autocomplete>
                                ) : (
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Loading Google Places..."
                                    disabled
                                    style={{ paddingLeft: "40px" }}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn btn-primary whitespace-nowrap"
                                onClick={() =>
                                  setLocationChange(!locationChange)
                                }
                                style={{ height: "38px", minWidth: "80px" }}
                              >
                                {locationChange ? "Save" : "Change"}
                              </button>
                            </div>
                          </div>

                          {/* Area Details (Editable) */}
                          <div className="mb-2">
                            <label className="form-label mb-0">
                              Location Name
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={
                                isGeocoding
                                  ? "Loading location..."
                                  : locationName || ""
                              }
                              onChange={(e) => {
                                const newLocationName = e.target.value;
                                setLocationName(newLocationName);
                                // Update formData.location.address when user edits location name
                                setFormData((prev) => ({
                                  ...prev,
                                  location: {
                                    ...prev.location,
                                    address: newLocationName,
                                  },
                                }));
                              }}
                              placeholder="Enter location name or address"
                              disabled
                            />
                          </div>

                          <div className="mb-4">
                            <div className="flex flex-wrap -mx-1 [&>*]:px-1">
                              <div className="col-md-6">
                                <label className="form-label small">
                                  Pincode
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-slate-50"
                                  value={addressDetails.pincode}
                                  readOnly
                                  style={{ fontSize: "14px" }}
                                />
                              </div>
                              <div className="col-md-6">
                                <label className="form-label small">City</label>
                                <input
                                  type="text"
                                  className="form-control bg-slate-50"
                                  value={addressDetails.city}
                                  readOnly
                                  style={{ fontSize: "14px" }}
                                />
                              </div>
                              <div className="col-md-12">
                                <label className="form-label small">
                                  State
                                </label>
                                <input
                                  type="text"
                                  className="form-control bg-slate-50"
                                  value={addressDetails.state}
                                  readOnly
                                  style={{ fontSize: "14px" }}
                                />
                              </div>
                            </div>
                            <small
                              className="text-slate-500"
                              style={{ fontSize: "11px" }}
                            >
                              <i className="fas fa-info-circle mr-1"></i>
                              These fields are automatically filled when you
                              select a location
                            </small>
                          </div>

                          <div className="mt-auto">
                            <button
                              type="button"
                              className="btn btn-primary w-full"
                              onClick={() =>
                                handleTabChange("recipient-details")
                              }
                            >
                              Next
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Recipient Details Tab */}
                      <div
                        className={`tab-pane ${activeTab === "recipient-details" ? "show active" : ""
                          }`}
                        id="recipient-details"
                      >
                        <form
                          onSubmit={handleSaveAddress}
                          className="flex flex-col h-full"
                        >
                          <div className="mb-2">
                            <label className="form-label mb-2">
                              Save this address as{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <div className="flex gap-2 flex-wrap">
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "home"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() => handleAddressTypeChange("home")}
                              >
                                Home
                              </button>
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "office"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() =>
                                  handleAddressTypeChange("office")
                                }
                              >
                                Office
                              </button>
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "work"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() => handleAddressTypeChange("work")}
                              >
                                Work
                              </button>
                              <button
                                type="button"
                                className={`custom-btn ${formData.addressType === "other"
                                  ? "active"
                                  : ""
                                  }`}
                                onClick={() => handleAddressTypeChange("other")}
                              >
                                Other
                              </button>
                            </div>
                          </div>

                          <div className="row mb-2 mt-1">
                            <div className="col-md-12 mb-2 flex gap-2 items-center">
                              <div className="position-relative flex-grow-1">
                                <i
                                  className="fa-solid fa-location-dot position-absolute"
                                  style={{
                                    left: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#6c757d",
                                    zIndex: 1,
                                  }}
                                ></i>
                                {isLoaded ? (
                                  <Autocomplete
                                    onLoad={(autocomplete) => {
                                      recipientAutocompleteRef.current =
                                        autocomplete;
                                      // Set initial value when editing
                                      if (
                                        editingAddress?.location?.address &&
                                        recipientInputRef.current
                                      ) {
                                        recipientInputRef.current.value =
                                          editingAddress.location.address;
                                      }
                                    }}
                                    onPlaceChanged={() =>
                                      onPlaceChanged("recipient")
                                    }
                                    options={{
                                      componentRestrictions: { country: "in" },
                                      fields: [
                                        "formatted_address",
                                        "geometry",
                                        "address_components",
                                        "place_id",
                                      ],
                                    }}
                                  >
                                    <input
                                      ref={recipientInputRef}
                                      type="text"
                                      disabled={!locationChange}
                                      className="form-control"
                                      placeholder="Enter location, pincode, city, state..."
                                      value={locationName}
                                      onChange={(e) =>
                                        handleSearchInputChange(e.target.value)
                                      }
                                      onKeyDown={handleKeyDown}
                                      style={{ paddingLeft: "40px" }}
                                    />
                                  </Autocomplete>
                                ) : (
                                  <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Loading Google Places..."
                                    disabled
                                    style={{ paddingLeft: "40px" }}
                                  />
                                )}
                              </div>
                              <button
                                type="button"
                                className="btn btn-primary whitespace-nowrap"
                                onClick={() =>
                                  setLocationChange(!locationChange)
                                }
                                style={{ height: "38px", minWidth: "80px" }}
                              >
                                {locationChange ? "Save" : "Change"}
                              </button>
                            </div>
                            {formData.addressType === "other" && (
                              <div className="mb-1">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="e.g., Hospital, School, Shop, etc."
                                  value={customAddressType}
                                  onChange={(e) =>
                                    setCustomAddressType(e.target.value)
                                  }
                                  required
                                />
                              </div>
                            )}
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter House/ Office/ Flat *"
                                value={formData.houseNo}
                                onChange={(e) =>
                                  handleInputChange("houseNo", e.target.value)
                                }
                                required
                              />
                            </div>
                            <div className="col-md-6">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Enter Apartment/ Area *"
                                value={formData.area}
                                onChange={(e) =>
                                  handleInputChange("area", e.target.value)
                                }
                                required
                              />
                            </div>
                          </div>

                          <div className="row mb-2">
                            <div className="col-md-12 mb-2">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Nearby LandMark (optional)"
                                value={formData.landmark}
                                onChange={(e) =>
                                  handleInputChange("landmark", e.target.value)
                                }
                              />
                            </div>
                            <div className="col-md-12">
                              <textarea
                                className="form-control"
                                rows="3"
                                placeholder="Ex: Near Gate, Pink Colour Building"
                                value={formData.description}
                                onChange={(e) =>
                                  handleInputChange(
                                    "description",
                                    e.target.value,
                                  )
                                }
                              ></textarea>
                            </div>
                          </div>

                          <div className="mt-auto">
                            <button
                              type="submit"
                              className="btn btn-primary w-full"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <div
                                    className="spinner-border spinner-border-sm mr-2"
                                    role="status"
                                  >
                                    <span className="visually-hidden">
                                      Loading...
                                    </span>
                                  </div>
                                  {editingAddress ? "Updating..." : "Saving..."}
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-save mr-2"></i>
                                  {editingAddress
                                    ? "Update Address"
                                    : "Save Address"}
                                </>
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LocationModal;

