import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { axiosCommonInstance } from "../../Apiservice.jsx";
import toast from "react-hot-toast";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../../utils/index";
import { useProfile } from "../../context/ProfileContext.jsx";
import { useLocation } from "../../context/LocationContext";
import { useResponsive } from "../../hooks";
import { GOOGLE_MAPS_API_KEY } from "../../utils/index.js"

const libraries = ["places"];

const AmbulanceBookingModal = ({
  show,
  onClose,
  selectedCategory,
  editData,
}) => {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { selectedPincode, latitude, longitude } = useLocation();
  const [ambulanceData, setAmbulanceData] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [location, setLocation] = useState({
    pickup: {
      lat: null,
      lng: null,
      address: "",
    },
    drop: {
      lat: null,
      lng: null,
      address: "",
    },
  });

  const [pickupLocation, setPickupLocation] = useState("");
  const [dropLocation, setDropLocation] = useState("");
  const { isMobile } = useResponsive();

  const pickupAutocompleteRef = useRef(null);
  const dropAutocompleteRef = useRef(null);

  // const GOOGLE_MAPS_API_KEY =
  //   import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  //   "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  useEffect(() => {
    if (!show) {
      setPickupLocation("");
      setDropLocation("");
      setAmbulanceData([]);
      setLocation({
        pickup: { lat: null, lng: null, address: "" },
        drop: { lat: null, lng: null, address: "" },
      });
      setIsSearching(false);
    }
  }, [show]);

  useEffect(() => {
    if (!show) return undefined;

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
    };
  }, [show]);

  useEffect(() => {
    const handleScroll = (e) => {
      const isPacContainer =
        e.target?.classList?.contains &&
        e.target.classList.contains("pac-container");
      const isPacItem = e.target?.closest && e.target.closest(".pac-container");

      if (isPacContainer || isPacItem) {
        return;
      }

      const activeElement = document.activeElement;
      if (
        activeElement &&
        activeElement.tagName === "INPUT" &&
        (activeElement.closest("form") ||
          activeElement.closest(".location-input-wrapper"))
      ) {
        activeElement.blur();
      }
    };

    if (show) {
      window.addEventListener("scroll", handleScroll, true);
    }

    if (show && isLoaded) {
      if (editData) {
        setLocation({
          pickup: editData.pickup || { lat: null, lng: null, address: "" },
          drop: editData.drop || { lat: null, lng: null, address: "" },
        });
        setPickupLocation(editData.pickup?.address || "");
        setDropLocation(editData.drop?.address || "");

        if (
          editData.pickup?.address &&
          editData.drop?.address &&
          selectedCategory
        ) {
          setTimeout(() => {
            handleSearchDirectWithData(editData.pickup, editData.drop);
          }, 1000);
        }
      } else {
        detectUserLocation();
      }
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [show, isLoaded, editData, selectedCategory]);

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        return data.results[0].formatted_address || "Unknown Location";
      }
      return "Unknown Location";
    } catch (err) {
      return "Location not available";
    }
  };

  const getCoordinatesFromAddress = async (address) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
          address: data.results[0].formatted_address || address,
        };
      }
      return null;
    } catch (err) {
      // Geocoding error
      return null;
    }
  };

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const address = await getAddressFromCoordinates(lat, lng);

        setLocation((prev) => ({
          ...prev,
          pickup: { lat, lng, address },
        }));
        setPickupLocation(address);
      },
      () => toast.error("Location permission denied. Please allow access."),
      { enableHighAccuracy: true },
    );
  };

  const handlePickupPlaceSelect = (place) => {
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name || "";

    setLocation((prev) => ({
      ...prev,
      pickup: { lat, lng, address },
    }));
    setPickupLocation(address);
  };

  const handleDropPlaceSelect = (place) => {
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const address = place.formatted_address || place.name || "";

    setLocation((prev) => ({
      ...prev,
      drop: { lat, lng, address },
    }));
    setDropLocation(address);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    await handleSearchDirect();
  };

  const handleSearchDirect = async () => {
    if (!location.pickup.address || !location.drop.address) {
      toast.error("Please select both pickup and drop locations");
      return;
    }

    if (!selectedCategory) {
      toast.error("No ambulance category selected");
      return;
    }

    await performSearch(location.pickup, location.drop);
  };

  const handleSearchDirectWithData = async (pickupData, dropData) => {
    if (!pickupData?.address || !dropData?.address) {
      toast.error("Please select both pickup and drop locations");
      return;
    }

    if (!selectedCategory) {
      toast.error("No ambulance category selected");
      return;
    }

    await performSearch(pickupData, dropData);
  };

  const performSearch = async (pickupData, dropData) => {
    setIsSearching(true);
    setAmbulanceData([]);

    try {
      let finalPickupData = pickupData;
      if (!pickupData.lat || !pickupData.lng) {
        const pickupCoords = await getCoordinatesFromAddress(
          pickupData.address,
        );
        if (pickupCoords) {
          finalPickupData = pickupCoords;
        } else {
          toast.error(
            "Invalid pickup location. Please select from the dropdown.",
          );
          setIsSearching(false);
          return;
        }
      }

      let finalDropData = dropData;
      if (!dropData.lat || !dropData.lng) {
        const dropCoords = await getCoordinatesFromAddress(dropData.address);
        if (dropCoords) {
          finalDropData = dropCoords;
        } else {
          toast.error(
            "Invalid drop location. Please select from the dropdown.",
          );
          setIsSearching(false);
          return;
        }
      }

      const payload = {
        pickup: {
          lat: finalPickupData.lat,
          lng: finalPickupData.lng,
          address: finalPickupData.address,
        },
        drop: {
          lat: finalDropData.lat,
          lng: finalDropData.lng,
          address: finalDropData.address,
        },
        duration: 35,
        supportRequired: true,
        serviceType: "ambulance-service",
        productId: selectedCategory.name,
        emergencyType: "nonemergency",
        ...(selectedPincode && {
          pincode: selectedPincode,
          ...(latitude && longitude ? { lat: latitude, lng: longitude } : {})
        })
      };

      const response = await axiosCommonInstance.post("ride/search", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
        },
      });

      if (response?.data?.success) {
        const vendors = response?.data?.data?.vendor || [];
        setAmbulanceData(vendors);

        if (vendors.length === 0) {
          toast.info("No ambulances available for this route");
        }
      } else {
        toast.error(response?.data?.message || "No ambulances found");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearPickup = () => {
    setLocation((prev) => ({
      ...prev,
      pickup: { lat: null, lng: null, address: "" },
    }));
    setPickupLocation("");
  };

  const handleClearDrop = () => {
    setLocation((prev) => ({
      ...prev,
      drop: { lat: null, lng: null, address: "" },
    }));
    setDropLocation("");
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleClick = (vendorItem) => {
    // Check if user is logged in
    if (!profile) {
      toast.error("Please login to book an ambulance");
      navigate("/login");
      onClose();
      return;
    }

    const payload = {
      vendorId: vendorItem?.vendorId,
      productId: selectedCategory?.name || selectedCategory?._id,

      pickup: location.pickup,
      drop: location.drop,

      price:
        vendorItem?.discountprice > 0
          ? vendorItem?.discountprice
          : vendorItem?.price || 0,
      distance: vendorItem?.distance || 0,
    };

    sessionStorage.setItem("ambulanceBookingData", JSON.stringify(payload));
    sessionStorage.setItem(
      "selectedCategory",
      JSON.stringify(selectedCategory),
    );

    navigate("/ambulance-checkout");
    onClose();
  };

  const renderContent = () => {
    return (
      <>
        <style>{`
          .pac-container {
            z-index: 2147483647 !important;
          }
        `}</style>
        <form onSubmit={handleSearch}>
          <div className="flex flex-col md:flex-row gap-3 mb-5">
            <div className="flex-1 relative">
              <div className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#666] text-[18px] z-[1]">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) =>
                    (pickupAutocompleteRef.current = autocomplete)
                  }
                  onPlaceChanged={() => {
                    const place = pickupAutocompleteRef.current?.getPlace();
                    if (place) handlePickupPlaceSelect(place);
                  }}
                  options={{
                    componentRestrictions: { country: "in" },
                    fields: ["formatted_address", "geometry", "name", "place_id"],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Pickup Location"
                    value={location.pickup.address}
                    onChange={(e) => {
                      const newAddress = e.target.value;
                      setLocation((prev) => ({
                        ...prev,
                        pickup: { ...prev.pickup, address: newAddress },
                      }));
                      setPickupLocation(newAddress);
                    }}
                    className="w-full py-[10px] px-[30px] border border-solid border-[#e0e0e0] rounded-[8px] text-[13px] font-normal"
                    autoComplete="off"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  placeholder="Loading places..."
                  disabled
                  className="w-full py-[10px] px-[30px] border border-solid border-[#e0e0e0] rounded-[8px] text-[13px] font-normal"
                />
              )}
              {location.pickup.address && (
                <button
                  type="button"
                  onClick={handleClearPickup}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-none border-none text-[#666] cursor-pointer"
                  title="Clear pickup location"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            <div className="flex-1 relative">
              <div className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#666] text-[18px] z-[1]">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              {isLoaded ? (
                <Autocomplete
                  onLoad={(autocomplete) =>
                    (dropAutocompleteRef.current = autocomplete)
                  }
                  onPlaceChanged={() => {
                    const place = dropAutocompleteRef.current?.getPlace();
                    if (place) handleDropPlaceSelect(place);
                  }}
                  options={{
                    componentRestrictions: { country: "in" },
                    fields: ["formatted_address", "geometry", "name", "place_id"],
                  }}
                >
                  <input
                    type="text"
                    placeholder="Drop Location"
                    value={location.drop.address}
                    onChange={(e) => {
                      const newAddress = e.target.value;
                      setLocation((prev) => ({
                        ...prev,
                        drop: { ...prev.drop, address: newAddress },
                      }));
                      setDropLocation(newAddress);
                    }}
                    className="w-full py-[10px] px-[30px] border border-solid border-[#e0e0e0] rounded-[8px] text-[13px] font-normal"
                    autoComplete="off"
                  />
                </Autocomplete>
              ) : (
                <input
                  type="text"
                  placeholder="Loading places..."
                  disabled
                  className="w-full py-[10px] px-[30px] border border-solid border-[#e0e0e0] rounded-[8px] text-[13px] font-normal"
                />
              )}
              {location.drop.address && (
                <button
                  type="button"
                  onClick={handleClearDrop}
                  className="absolute right-[12px] top-1/2 -translate-y-1/2 bg-none border-none text-[#666] text-[16px] cursor-pointer z-[2] p-[4px] rounded-[4px] flex items-center justify-center"
                  title="Clear drop location"
                >
                  <i className="fas fa-times"></i>
                </button>
              )}
            </div>

            <div className="md:w-[140px] shrink-0">
              <button
                type="submit"
                disabled={isSearching || !isLoaded}
                className={`w-full h-full min-h-[42px] p-[10px] text-white border-none !rounded-[8px] text-[13px] font-semibold flex items-center justify-center gap-[8px] ${isSearching ? "bg-[#9ca3af] cursor-not-allowed" : "bg-[#321961] cursor-pointer"}`}
              >
                <i className="fas fa-search"></i> Search
              </button>
            </div>
          </div>
        </form>

        {/* Header Section */}
        {(isSearching ||
          ambulanceData.length > 0 ||
          (location.pickup.address && location.drop.address)) && (
            <div style={{ marginBottom: "14px" }}>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "#111",
                  marginBottom: "4px",
                }}
              >
                {isSearching
                  ? "Searching..."
                  : `Available Ambulances (${ambulanceData.length})`}
              </h3>
              <p style={{ fontSize: "13px", color: "#555", margin: 0 }}>
                {isSearching
                  ? "Looking for available ambulances in your area..."
                  : "Select the best option for your medical transport"}
              </p>
            </div>
          )}

        {isSearching ? (
          <div className="text-center py-[60px]">
            <div className="inline-block w-10 h-10 border-4 border-[#321961] border-t-transparent rounded-full animate-spin" role="status"></div>
            <p className="mt-4 text-[#555]">Searching for ambulances...</p>
          </div>
        ) : ambulanceData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ambulanceData.map((vendorItem, index) => {
              const vendor = vendorItem?.businessdetails || {};
              const price = vendorItem?.price || 0;
              const discountPrice = vendorItem?.discountprice || 0;
              const distance = vendorItem?.distance || 0;
              const name =
                vendorItem.businessdetails?.name ||
                vendor?.name ||
                "Ambulance Service";

              // Calculate total fare
              const totalFare =
                discountPrice > 0 ? distance * discountPrice : distance * price;
              const perKilometerRate =
                discountPrice > 0 ? discountPrice : price;

              return (
                <div key={vendorItem._id || index}>
                  <div
                    className="bg-white border border-solid border-[#e5e7eb] rounded-[12px] p-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.12)] transition-all duration-200 ease h-full cursor-pointer"
                  >
                    <h4
                      className="!text-[15px] !font-medium mb-[10px] !text-[#111]"
                    >
                      {name} {""}
                    </h4>
                    <div
                      className="flex items-center gap-[8px] mb-[12px] text-[12px]"
                    >
                      <span className="text-[#333] font-medium">
                        Emergency
                      </span>
                      <i
                        className="fas fa-ambulance text-[#2563eb]"
                      ></i>
                      <span
                        className="text-[#2563eb] font-medium"
                      >
                        {distance} km away
                      </span>
                    </div>

                    <div
                      className="flex items-center justify-between mb-[12px]"
                    >
                      <div className="flex gap-[8px]">
                        {selectedCategory?.tabletdetails?.facilitiesdetails
                          ?.length > 0 ? (
                          selectedCategory.tabletdetails.facilitiesdetails.map(
                            (facility) => (
                              <img
                                key={facility._id}
                                src={
                                  facility?.files?.[0]
                                    ? getImageUrl(facility.files[0])
                                    : "/assets/default.png"
                                }
                                alt={facility?.name || "Facility"}
                                title={facility?.name || "Facility"}
                                className="w-[32px] h-[32px] object-contain"
                              />
                            ),
                          )
                        ) : (
                          <>
                            <img
                              src="/assets/default.png"
                              alt="First Aid"
                              className="w-[32px] h-[32px] object-contain"
                            />
                          </>
                        )}
                      </div>

                      <div
                        className="text-[14px] font-medium text-[#111]"
                      >
                        ₹{totalFare.toLocaleString("en-IN")}
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between text-[12px] text-[#444] gap-[8px]"
                    >
                      <div
                        className="flex items-center gap-[12px]"
                      >
                        <div
                          className="flex items-center gap-[4px]"
                        >
                          <span>₹{perKilometerRate} per kilometer</span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="py-[5px] px-[10px] bg-[#321961] text-white border-none !rounded-[4px] text-[12px] font-semibold cursor-pointer whitespace-nowrap"
                        onClick={() => handleClick(vendorItem)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : location.pickup.address && location.drop.address ? (
          <div
            className="text-center py-[60px] px-0 text-[#555]"
          >
            <p>
              No ambulances available for this route.
              <br />
              Please try different locations or try again later.
            </p>
          </div>
        ) : (
          <div
            className="text-center py-[60px] px-0 text-[#555]"
          >
            <p>
              Enter your pickup and drop locations above and click Search to
              find available ambulances.
            </p>
          </div>
        )}
      </>
    );
  };

  if (!show) return null;

  const modalContent = isMobile ? (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .pac-container { z-index: 2147483647 !important; }
      `}</style>
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[999999999] flex items-end animate-[fadeIn_0.3s_ease]"
        onClick={handleOverlayClick}
      >
        <div
          className="w-full bg-white rounded-t-[16px] max-h-[92vh] flex flex-col animate-[slideUp_0.4s_ease-out]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-[12px_0] text-center">
            <div
              className="w-[40px] h-[4px] bg-[#d1d5db] rounded-[2px] mx-auto"
            ></div>
          </div>
          <div
            className="p-[12px_16px] border-b border-solid border-[#eee] flex justify-between items-center"
          >
            <h3
              className="text-[15px] text-black font-semibold m-0"
            >
              Medical Transport Booking
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="!text-[28px] !rounde-full bg-none border-none cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-[20px]">
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  ) : (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .pac-container { z-index: 2147483647 !important; }
      `}</style>
      <div
        className="fixed inset-0 bg-[rgba(0,0,0,0.5)] z-[999999999] flex items-center justify-center p-[20px] overflow-y-auto"
        onClick={handleOverlayClick}
      >
        <div
          className="bg-white rounded-[16px] w-full max-w-[860px] max-h-[min(90vh,calc(100vh-40px))] overflow-y-auto m-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className="p-[20px_28px] border-b border-solid border-[#eee] flex justify-between items-center"
          >
            <h3 className="text-[16px] font-medium m-0">
              Medical Transport Booking
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="bg-[#f3f4f6] border-none w-[36px] h-[36px] !rounded-full !text-[24px] cursor-pointer flex items-center justify-center"
            >
              ×
            </button>
          </div>
          <div className="p-[10px_12px]">{renderContent()}</div>
        </div>
      </div>
    </>
  );

  return createPortal(modalContent, document.body);
};

export default AmbulanceBookingModal;
