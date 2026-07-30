import { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Link,
  useLocation as useRouterLocation,
  useNavigate,
} from "react-router-dom";
import LocationOffcanvas from "./LocationOffCanvas";
import DesktopSearch from "./DesktopSearch";
import MobileSearchDropdown from "./MobileSearchDropdown";
import { useCartContext } from "../../context/CartContext";
import { useProfile } from "../../context/ProfileContext";
import { useLocation } from "../../context/LocationContext";
import { useJsApiLoader } from "@react-google-maps/api";

import { axiosUserInstance, axiosCommonInstance } from "../../Apiservice";
import { getImageUrl } from "../../utils/index";
import { deleteFCMToken } from "../../core/redux/firebase/fcm";
import toast from "react-hot-toast";

// Constants
const CART_STORAGE_KEY = "pharmacyCart";
const PHONE_STORAGE_KEY = "phone";
const TOKEN_STORAGE_KEY = "medicomparestoken";
const IS_CART_STORAGE_KEY = "isCart";
const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";
const libraries = ["places"];

// Memory cache to prevent refetching addresses and notifications on every route transition
let cachedSavedAddresses = null;
let cachedUnreadCount = null;
let cachedNotificationsPromise = null;
let cachedAddressesPromise = null;
let lastFetchedPincode = null;
let lastFetchedLat = null;
let lastFetchedLng = null;

const Home2Header = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showMobileSearchDropdown, setShowMobileSearchDropdown] =
    useState(false);

  const { profile: profiles, refetchProfile } = useProfile();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const { getUniqueItemCount, cartItems } = useCartContext();
  const cartCount = getUniqueItemCount();
  const [showLocationOffcanvas, setShowLocationOffcanvas] = useState(false);
  const [offcanvasPosition, setOffcanvasPosition] = useState("right");
  const [showCartChoiceModal, setShowCartChoiceModal] = useState(false);
  const {
    ServiceCartCount,
    refreshCart,
  } = useCartContext();
  // Use LocationContext instead of local state
  const {
    currentLocation,
    selectedPincode,
    isLocationUpdating,
    setIsLocationUpdating,
    updateLocation,
    getLocationDisplayName,
    latitude,
    longitude,
  } = useLocation();

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressLocation, setSelectedAddressLocation] = useState(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const profileButtonRef = useRef(null);
  const dropdownRef = useRef(null);

  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(62);

  useEffect(() => {
    const updateHeaderHeight = () => {
      let height = 0;
      const isMobile = window.innerWidth <= 991;

      const headerEl = document.querySelector('header.d-lg-none');
      if (headerEl) {
        setMobileHeaderHeight(headerEl.offsetHeight);
      }

      if (isMobile) {
        const mobileHeader = document.querySelector('header.d-lg-none');
        const mobileSearch = document.querySelector('section.d-lg-none');
        if (mobileHeader) {
          height += mobileHeader.offsetHeight;
        }
        if (mobileSearch && window.getComputedStyle(mobileSearch).display !== 'none') {
          height += mobileSearch.offsetHeight;
        }
      } else {
        const desktopHeader = document.querySelector('header.header-custom');
        if (desktopHeader) {
          height = desktopHeader.offsetHeight;
        }
      }
      document.documentElement.style.setProperty('--header-height', `${height}px`);
    };

    updateHeaderHeight();
    const interval = setInterval(updateHeaderHeight, 200);
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
      document.documentElement.style.setProperty('--header-height', '0px');
    };
  }, []);

  useEffect(() => {
    const handleUnreadCountUpdate = (event) => {
      const { unreadCount } = event.detail;
      setUnreadCount(unreadCount);
    };

    window.addEventListener("updateUnreadCount", handleUnreadCountUpdate);

    return () => {
      window.removeEventListener("updateUnreadCount", handleUnreadCountUpdate);
    };
  }, []);

  const navigate = useNavigate();
  const location = useRouterLocation();

  // Load Google Maps API
  const { isLoaded: isGoogleMapsLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const placeholderTexts = [
    "Search for... Medicines",
    "Search for... Surgeries",
    "Search for... Lab Tests",
    "Search for... Diagnostics",
    "Search for... Home Care Services",
    "Search for... Medical Equipment",
    "Search for... Nursing Care",
    "Search for... Medical Treatment",
    "Search for... Ambulance Service",
    "Search for... Dental Service",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % placeholderTexts.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const extractPincodeFromAddress = (addressString) => {
    if (!addressString) return null;
    const pincodeMatch = addressString.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : null;
  };

  const fetchNotifications = async () => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return;

    if (cachedUnreadCount !== null) {
      setUnreadCount(cachedUnreadCount);
      return;
    }

    try {
      if (!cachedNotificationsPromise) {
        cachedNotificationsPromise = axiosUserInstance.get("notifications/list", {
          headers: { Authorization: `Bearer ${token}` },
        }).then((response) => {
          if (response.data.success) {
            return response.data.data.unreadCount || 0;
          }
          return null;
        }).catch((error) => {
          console.error("Error fetching notifications:", error);
          cachedNotificationsPromise = null;
          return null;
        });
      }

      const count = await cachedNotificationsPromise;
      if (count !== null) {
        cachedUnreadCount = count;
        setUnreadCount(count);
      }
    } catch (error) {
      toast.error("Error fetching notifications:", error);
    }
  };

  const handleAddressesLoaded = (addresses) => {
    const savedLocation = localStorage.getItem("selectedLocation");
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        if (locationData.placeId && !locationData.addressId) {
          setSelectedAddressLocation(null);
          updateLocation(locationData);
          return;
        }

        if (locationData.addressId) {
          const matchingAddress = addresses.find(
            (addr) => addr._id === locationData.addressId,
          );
          if (matchingAddress && matchingAddress.location?.address) {
            setSelectedAddressLocation(matchingAddress.location.address);
            const pincode = extractPincodeFromAddress(
              matchingAddress.location.address,
            );
            if (pincode) {
              const updatedLocationData = {
                ...locationData,
                pincode: pincode,
              };
              updateLocation(updatedLocationData);
            }
            return;
          }
        }
      } catch (e) {
        // Error parsing saved location
      }
    }

    const savedLocationCheck = localStorage.getItem("selectedLocation");
    let shouldUseSavedAddress = true;
    if (savedLocationCheck) {
      try {
        const locationData = JSON.parse(savedLocationCheck);
        if (locationData.addressId) {
          shouldUseSavedAddress = true;
        } else if (
          locationData.placeId ||
          locationData.pincode ||
          (locationData.name && locationData.name !== "Select Location")
        ) {
          shouldUseSavedAddress = false;
        }
      } catch (e) { }
    }

    if (shouldUseSavedAddress) {
      const addressWithLocation = addresses.find(
        (addr) => addr.location && addr.location.address,
      );

      if (addressWithLocation && addressWithLocation.location.address) {
        setSelectedAddressLocation(addressWithLocation.location.address);
        const pincode = extractPincodeFromAddress(
          addressWithLocation.location.address,
        );
        if (pincode) {
          const savedLocation = localStorage.getItem("selectedLocation");
          if (savedLocation) {
            try {
              const locationData = JSON.parse(savedLocation);
              if (
                !locationData.pincode ||
                locationData.pincode !== pincode
              ) {
                const updatedLocationData = {
                  ...locationData,
                  pincode: pincode,
                };
                updateLocation(updatedLocationData);
              }
            } catch (e) {
              const newLocationData = {
                name: addressWithLocation.location.address,
                address: addressWithLocation.location.address,
                coordinates: addressWithLocation.location.coordinates
                  ? {
                    lat: addressWithLocation.location.coordinates[1],
                    lng: addressWithLocation.location.coordinates[0],
                  }
                  : null,
                placeId: null,
                addressId: addressWithLocation._id,
                pincode: pincode,
                timestamp: new Date().toISOString(),
              };
              updateLocation(newLocationData);
            }
          } else {
            const newLocationData = {
              name: addressWithLocation.location.address,
              address: addressWithLocation.location.address,
              coordinates: addressWithLocation.location.coordinates
                ? {
                  lat: addressWithLocation.location.coordinates[1],
                  lng: addressWithLocation.location.coordinates[0],
                }
                : null,
              placeId: null,
              addressId: addressWithLocation._id,
              pincode: pincode,
              timestamp: new Date().toISOString(),
            };
            updateLocation(newLocationData);
          }
        }
      } else {
        setSelectedAddressLocation(null);
      }
    } else {
      setSelectedAddressLocation(null);
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        return;
      }

      let currentPincode = null;
      const selectedLocationData = localStorage.getItem("selectedLocation");
      if (selectedLocationData) {
        try {
          const locationData = JSON.parse(selectedLocationData);
          currentPincode = locationData.pincode;
        } catch (e) { }
      }

      const currentLat = latitude;
      const currentLng = longitude;

      // Use memory cached addresses if pincode and coordinates have not changed
      if (
        cachedSavedAddresses &&
        lastFetchedPincode === currentPincode &&
        lastFetchedLat === currentLat &&
        lastFetchedLng === currentLng
      ) {
        setSavedAddresses(cachedSavedAddresses);
        handleAddressesLoaded(cachedSavedAddresses);
        return;
      }

      const params = {};
      if (currentPincode) {
        params.pincode = currentPincode;
        if (currentLat && currentLng) {
          params.lat = currentLat;
          params.lng = currentLng;
        }
      }

      // If we don't have an active promise matching current location parameters, fetch it
      if (
        !cachedAddressesPromise ||
        lastFetchedPincode !== currentPincode ||
        lastFetchedLat !== currentLat ||
        lastFetchedLng !== currentLng
      ) {
        lastFetchedPincode = currentPincode;
        lastFetchedLat = currentLat;
        lastFetchedLng = currentLng;

        cachedAddressesPromise = axiosCommonInstance.get("address/list", {
          headers: { Authorization: `Bearer ${token}` },
          params: params,
        }).then((response) => {
          if (response.data.success) {
            return response.data.data?.address ||
              response.data.address ||
              response.data.addresses ||
              [];
          }
          return null;
        }).catch((error) => {
          console.error("Error fetching addresses:", error);
          cachedAddressesPromise = null;
          return null;
        });
      }

      const addresses = await cachedAddressesPromise;
      if (addresses) {
        cachedSavedAddresses = addresses;
        setSavedAddresses(addresses);
        handleAddressesLoaded(addresses);
      }
    } catch (error) {
      // Error loading saved addresses
    }
  };

  useEffect(() => {
    const handleAddressUpdate = (event) => {
      if (isLoggedIn) {
        cachedSavedAddresses = null;
        cachedAddressesPromise = null;
        setTimeout(() => {
          loadSavedAddresses();
        }, 500);
      }
    };

    const handleAddressSaved = (event) => {
      if (isLoggedIn) {
        cachedSavedAddresses = null;
        cachedAddressesPromise = null;
        setTimeout(() => {
          loadSavedAddresses();
        }, 500);
      }
    };

    const handleAddressDeleted = (event) => {
      if (isLoggedIn) {
        cachedSavedAddresses = null;
        cachedAddressesPromise = null;
        setTimeout(() => {
          loadSavedAddresses();
        }, 500);
      }
    };

    window.addEventListener("addressUpdated", handleAddressUpdate);
    window.addEventListener("addressSaved", handleAddressSaved);
    window.addEventListener("addressDeleted", handleAddressDeleted);

    return () => {
      window.removeEventListener("addressUpdated", handleAddressUpdate);
      window.removeEventListener("addressSaved", handleAddressSaved);
      window.removeEventListener("addressDeleted", handleAddressDeleted);
    };
  }, [isLoggedIn]);

  useEffect(() => {
    if (currentLocation && !currentLocation.pincode && !selectedPincode) {
      const addressString = currentLocation.address || currentLocation.name;
      if (addressString) {
        const pincode = extractPincodeFromAddress(addressString);
        if (pincode) {
          const updatedLocationData = {
            ...currentLocation,
            pincode: pincode,
          };
          updateLocation(updatedLocationData);
        }
      }
    }
  }, [currentLocation?.address, currentLocation?.name]);

  useEffect(() => {
    if (
      (currentLocation?.pincode ||
        (currentLocation?.name &&
          currentLocation?.name !== "Select Location")) &&
      !currentLocation.addressId
    ) {
      setSelectedAddressLocation(null);
      localStorage.removeItem("selectedAddressLocation");
    }
  }, [currentLocation?.pincode, currentLocation?.addressId]);

  useEffect(() => {
    const handlePaymentSuccess = () => {
      fetchNotifications();
    };

    window.addEventListener("paymentSuccess", handlePaymentSuccess);

    return () => {
      window.removeEventListener("paymentSuccess", handlePaymentSuccess);
    };
  }, []);

  useEffect(() => {
    const userToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const isLoggedIn = !!userToken;
    setIsLoggedIn(isLoggedIn);

    if (isLoggedIn) {
      const timer = setTimeout(() => {
        loadSavedAddresses();
        fetchNotifications();
        if (!profiles) {
          refetchProfile();
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [profiles, refetchProfile]);

  useEffect(() => {
    const userToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    const isLoggedIn = !!userToken;
    setIsLoggedIn(isLoggedIn);

    if (isLoggedIn && !profiles) {
      refetchProfile();
    }
  }, [location.pathname, profiles, refetchProfile]);

  const handleLocationClick = (position = "right") => {
    setOffcanvasPosition(position);
    setShowLocationOffcanvas(true);
  };

  // Close location offcanvas
  const closeLocationOffcanvas = () => {
    setShowLocationOffcanvas(false);
    if (isLoggedIn) {
      setTimeout(() => {
        loadSavedAddresses();
      }, 300);
    }
  };

  // Confirm logout
  const confirmLogout = async () => {
    const confirmed = window.confirm("Are you sure you want to logout?");

    if (confirmed) {
      await deleteFCMToken();
      try {
        const token = localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
          await axiosUserInstance.post(
            "auth/logout",
            {},
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          );
        }
      } catch (error) {
        toast.error("Logout API error:", error);
      } finally {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem("cart");
        localStorage.removeItem(PHONE_STORAGE_KEY);
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(IS_CART_STORAGE_KEY);
        localStorage.removeItem("activeSection");
        localStorage.removeItem("compareItems"); // package view comparision bar
        localStorage.removeItem("fcmToken"); // Clear FCM token on logout
        setIsLoggedIn(false);
        setShowDropdown(false);
        window.dispatchEvent(new Event("cartUpdated"));
        window.dispatchEvent(new Event("userLoggedOut"));
        window.location.href = "/";
      }
    }
  };

  useEffect(() => {
    let ticking = false;
    let lastShowSearch = window.scrollY > 200;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const shouldShow = window.scrollY > 200;
        if (shouldShow !== lastShowSearch) {
          lastShowSearch = shouldShow;
          setShowSearch(shouldShow);
        }
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showDropdown &&
        profileButtonRef.current &&
        dropdownRef.current &&
        !profileButtonRef.current.contains(event.target) &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    const input = document.getElementById("searchInput");
    const dropdown = document.getElementById("searchDropdown");
    const productsRow = document.getElementById("productsRow");

    if (!input || !dropdown || !productsRow) return;

    const handleFocus = () => {
      if (showSearch) {
        dropdown.classList.add("show");
        setShowSearchOverlay(true);
      }
    };

    const handleClick = (e) => {
      if (!e.target.closest(".desktop-search")) {
        dropdown.classList.remove("show");
        setShowSearchOverlay(false);
      }
    };

    if (productsRow.children.length > 2) {
      productsRow.classList.remove("no-scroll");
      productsRow.classList.add("scroll");
    }

    input.addEventListener("focus", handleFocus);
    document.addEventListener("click", handleClick);

    return () => {
      input.removeEventListener("focus", handleFocus);
      document.removeEventListener("click", handleClick);
    };
  }, [showSearch]);

  useEffect(() => {
    if (!showSearch) {
      setShowSearchOverlay(false);
      const dropdown = document.getElementById("searchDropdown");
      if (dropdown) {
        dropdown.classList.remove("show");
      }
    }
  }, [showSearch]);
  const excludedPaths = ["/", "/search"];

  return (
    <>
      {/* Mobile Header */}
      <header
        className="d-lg-none"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          padding: "11px 15px",
          display: isLocationUpdating ? "none" : "flex",
          flexDirection: "row",
          flexWrap: "nowrap",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#ffffff",
          borderBottom: "1px solid #f1f1f1",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minWidth: 0,
            flex: 1,
            flexDirection: "row",
            flexWrap: "nowrap",
          }}
        >
          <Link to="/" className="shrink-0 flex items-center">
            <img
              src="/MediCompares_Logo.png"
              alt="Logo"
              className="img-fluid"
              loading="lazy"
              style={{ width: "85px", height: "auto" }}
            />
          </Link>

          <div
            onClick={() => handleLocationClick("right")}
            title={currentLocation?.name || "Select Location"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              cursor: "pointer",
              marginLeft: "8px",
              minWidth: 0,
            }}
          >
            {isLocationUpdating ? (
              <span className="text-[10px] font-semibold text-gray-600">Detecting...</span>
            ) : (
              <div className="flex flex-col leading-tight min-w-0">
                <div className="flex items-center gap-[2px] min-w-0">
                  <small className="font-bold text-[10px] text-gray-800 truncate block max-w-[65px]">
                    {(() => {
                      const loc = getLocationDisplayName();
                      return loc.length > 10 ? `${loc.slice(0, 10)}...` : loc;
                    })()}
                  </small>
                  <i className="fa-solid fa-chevron-down text-gray-600 text-[7px] shrink-0 mt-[1px]"></i>
                </div>
                <small className="text-[8px] text-gray-500 font-medium leading-none block truncate max-w-[65px]">
                  {currentLocation?.pincode || selectedPincode || "No Pincode"}
                </small>
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            flexShrink: 0,
            flexDirection: "row",
            flexWrap: "nowrap",
          }}
        >
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setShowCartChoiceModal(true);
            }}
            className="w-[32px] h-[32px] !rounded-full border !border-solid !border-[#e5e7eb] flex items-center justify-center !text-[#374151] bg-white cursor-pointer transition-all duration-200 no-underline relative"
          >
            <i className="fas fa-shopping-cart"></i>
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-4px",
                  right: "-4px",
                  background: "#ef4444",
                  color: "#fff",
                  borderRadius: "50%",
                  width: "16px",
                  height: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>

          {isLoggedIn && (
            <Link
              to="/notifications"
              className="w-[32px] h-[32px] !rounded-full !border !border-solid !border-[#e5e7eb] !flex !items-center !justify-center !text-[#374151] !bg-white !cursor-pointer !transition-all !duration-200 no-underline relative"
              title="Notifications"
            >
              <i
                className="fas fa-bell"
                style={{
                  fontSize: "16px",
                }}
              ></i>
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#8059ca",
                    color: "#fff",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Link>
          )}

          {!isLoggedIn ? (
            <Link
              to="/login"
              className="w-[32px] h-[32px] rounded-full border border-solid border-[#e5e7eb] flex items-center justify-center text-[#374151] bg-white cursor-pointer transition-all duration-200 no-underline"
            >
              <i className="fas fa-user"></i>
            </Link>
          ) : (
            <div
              ref={profileButtonRef}
              className="mobile-profile-button w-[32px] h-[32px] rounded-full border border-solid border-[#e5e7eb] flex items-center justify-center text-[#374151] bg-white cursor-pointer transition-all duration-200 relative"
              onClick={(e) => {
                e.preventDefault();
                navigate("/my-orders");
              }}
            >
              {profiles?.files && profiles.files.length > 0 ? (
                <img
                  className="rounded-circle"
                  src={getImageUrl(profiles.files[0])}
                  loading="lazy"
                  alt={profiles?.first_name}
                  title={profiles?.first_name}
                  style={{
                    width: "26px",
                    height: "26px",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    background: "#9f64ff",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "12px",
                    textTransform: "uppercase",
                  }}
                >
                  {profiles?.first_name?.charAt(0)}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Global Spacer to prevent page content from sliding behind fixed headers */}
      <div
        style={{
          height: "calc(var(--header-height, 0px) + var(--nav-height, 0px))",
        }}
      />

      {/* Search Overlay */}
      {showSearchOverlay && (
        <div
          className="search-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.4)",
            zIndex: 999,
            backdropFilter: "blur(2px)",
            transition: "opacity 0.3s ease",
            opacity: 1,
          }}
        />
      )}

      {/* mobile search  */}
      {(() => {
        const isSearchExcluded = [
          "/search",
          "/profile-sidebar",
          "/my-favourites",
          "/family-members",
          "/doctor-list",
          "/myorders",
          "/my-reports",
          "/my-enquiries",
          "/ticket-raised",
          "/my-appointments",
          "/my-consultations",
          "/notifications",
          "/my-transactions",
          "/wallet",
          "/manage-address",
          "/reviews",
          "/referals",
          "/contact",
          "/policies",
          "/payment-success"
        ].some(path => location.pathname.startsWith(path));

        return !isSearchExcluded && (
          <section
            className="d-lg-none fixed left-0 right-0 px-[15px] py-[14px] bg-white border-b border-solid border-[#f1f1f1] z-[998]"
            style={{
              top: `${mobileHeaderHeight}px`,
            }}
          >
            <div
              className="bg-white rounded-[30px] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.01)] flex items-center gap-[8px] p-[8px] w-full"
              style={{
                border: "1.5px solid #e5e7eb",
              }}
            >
              {/* Search Icon */}
              <div
                className="w-[25px] h-[25px] flex items-center justify-center text-[#9ca3af]"
              >
                <i className="fas fa-search"></i>
              </div>

              <div className="relative flex-1">
                <input
                  type="search"
                  className="border-none outline-none w-full text-[15px] bg-transparent text-[#111] focus:ring-0 focus:outline-none focus:border-none p-0 m-0 shadow-none"
                  onClick={() => setShowMobileSearchDropdown(true)}
                  onFocus={() => setShowMobileSearchDropdown(true)}
                  readOnly
                  placeholder={placeholderTexts[placeholderIndex]}
                  value=""
                />
              </div>
            </div>
          </section>
        );
      })()}

      {/* Desktop Header */}
      <header
        className="header header-custom header-fixed inner-header d-none d-lg-block"
        style={{
          borderBottom: "none",
          zIndex: "999999999",
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          width: "100%",
          display: isLocationUpdating ? "none" : "block",
        }}
      >
        <div
          className="container-fluid "
          style={{ backgroundColor: "#fcfcfc" }}
        >
          <nav className="navbar navbar-expand-lg header-nav ">
            <div className="navbar-header">
              <Link to="/" className="navbar-brand logo">
                <img
                  src="/MediCompares_Logo.png"
                  className="img-fluid"
                  alt="Logo"
                  loading="lazy"
                  style={{ width: "115px", height: "auto", marginLeft: "17px" }}
                />
              </Link>

              <span
                className="d-flex align-items-center text-dark fw-semibold d-none d-lg-block location-selector"
                title={currentLocation?.name || "Select Location"}
                style={{
                  marginLeft: "-10px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  // marginLeft: "7px"
                }}
                onClick={() => handleLocationClick("right")}
              >
                <div className="d-flex align-items-center">
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className="fas fa-map-marker-alt"
                      style={{
                        color: "#8059ca",
                        fontSize: "18px",
                      }}
                    ></i>
                  </div>
                  <div
                    className="pointer d-flex flex-column tooltip-wrappers"
                    id="locationTooltip"
                    style={{
                      minWidth: "180px",
                      justifyContent: "center",
                    }}
                  >
                    {isLocationUpdating ? (
                      <div className="d-flex align-items-center">
                        <i
                          className="fa-solid fa-spinner fa-spin me-2"
                          style={{
                            color: "#9f64ff",
                            fontSize: "12px",
                          }}
                        ></i>
                        <div className="d-flex flex-column hover-texts">
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#1f2937",
                              lineHeight: "1.4",
                              letterSpacing: "0.01em",
                            }}
                          >
                            Detecting Location...
                          </span>
                          <small
                            style={{
                              color: "#6b7280",
                              fontSize: "10px",
                              marginTop: "3px",
                              fontWeight: "500",
                            }}
                          >
                            Please wait...
                          </small>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="d-flex align-items-center tooltip-wrappers"
                          style={{ marginBottom: "3px" }}
                        >
                          <span
                            className="hover-texts"
                            style={{
                              fontSize: "12px",
                              fontWeight: "600",
                              color: "#1f2937",
                              lineHeight: "1.4",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "200px",
                              letterSpacing: "0.01em",
                            }}
                          >
                            {getLocationDisplayName()}
                          </span>
                          <i
                            className="fa-solid fa-chevron-down ms-2"
                            style={{
                              fontSize: "10px",
                              color: "#9f64ff",
                              flexShrink: 0,
                              transition: "transform 0.2s ease",
                            }}
                          ></i>
                        </div>
                        <div
                          className="d-flex align-items-center"
                          style={{ maxWidth: "150px", minWidth: 0 }}
                        >
                          <small
                            style={{
                              color: "#6b7280",
                              fontSize: "10px",
                              fontWeight: "500",
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "block",
                              minWidth: 0,
                              width: "100%",
                            }}
                            className="hover-texts"
                          >
                            {currentLocation?.pincode || selectedPincode
                              ? `Pincode: ${currentLocation?.pincode || selectedPincode}`
                              : "Pin Code Not Found"}
                          </small>
                        </div>
                      </>
                    )}

                    <div
                      className="tooltip-boxs"
                      style={{
                        fontSize: "10px",
                        color: "#fff",
                        width: "250px",
                        maxWidth: "250px",
                        wordWrap: "break-word",
                        wordBreak: "break-word",
                        overflowWrap: "break-word",
                        whiteSpace: "normal",
                      }}
                    >
                      <div style={{ marginBottom: "4px" }}>
                        {getLocationDisplayName()}
                      </div>
                      {(currentLocation?.pincode || selectedPincode) && (
                        <div style={{ opacity: 0.8, fontSize: "9px" }}>
                          Pincode: {currentLocation?.pincode || selectedPincode}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </span>

              {!location.pathname.startsWith("/payment-success") &&
                showSearch && (
                  <section
                    style={{
                      padding: "0px",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "relative",
                        zIndex: 1,
                      }}
                    >
                      <div className="row">
                        <div className="col-12">
                          <div
                            style={{
                              maxWidth: "100%",
                              margin: "0px 30px",
                              position: "relative",
                              zIndex: 10,
                            }}
                          >
                            <DesktopSearch
                              showSearch={showSearch}
                              setShowSearchOverlay={setShowSearchOverlay}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                )}
            </div>
            <div className="main-menu-wrapper">
              <div className="menu-header">
                <Link to="/" className="menu-logo">
                  <img
                    src="/MediCompares_Logo.png"
                    className="img-fluid"
                    alt="Logo"
                    loading="lazy"
                    style={{ height: "auto", width: "100px" }}
                  />
                </Link>
              </div>
            </div>

            {/* cart, profile */}
            <ul className="nav header-navbar-rht">
              <li className="nav-item dropdown noti-nav view-cart-header me-2 pe-0">
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCartChoiceModal(true);
                  }}
                  className="dropdown-toggle nav-link p-0 position-relative"
                  style={{ cursor: "pointer" }}
                  title={`${cartCount} product${cartCount !== 1 ? "s" : ""
                    } in cart`}
                >
                  <i
                    className="isax isax-shopping-cart "
                    style={{ fontSize: "20px" }}
                  />
                  {cartCount > 0 && (
                    <span
                      className="cart-badge"
                      style={{
                        minWidth: cartCount > 9 ? "20px" : "18px",
                        height: cartCount > 9 ? "20px" : "18px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: cartCount > 99 ? "9px" : "11px",
                        fontWeight: "700",
                        padding: cartCount > 99 ? "0 4px" : "0",
                      }}
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              </li>
              {isLoggedIn && (
                <li className="nav-item dropdown noti-nav view-cart-header me-2 pe-0">
                  <Link
                    to="/notifications"
                    className="dropdown-toggle nav-link p-0 position-relative"
                    style={{ cursor: "pointer" }}
                    title="Notifications"
                  >
                    <i
                      className="fas fa-bell"
                      style={{
                        fontSize: "18px",
                        color: "#000"
                      }}
                    ></i>
                    {unreadCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          background: "#8059ca",
                          color: "#fff",
                          borderRadius: "50%",
                          width: "16px",
                          height: "16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "bold",
                        }}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              )}

              {!isLoggedIn ? (
                <>
                  <ul className="nav header-navbar-rht">
                    {/* <li>
                      <a
                        href="https://vendor.medicompares.digitalraiz.co.in/register"
                        target="_blank"
                      >
                        <button
                          className="btn btn-md btn-primary-gradient d-inline-flex align-items-center rounded-pill"
                          to=""
                          style={{
                            fontSize: "13px",
                            borderRadius: "47px",
                            border: "none",
                          }}
                        >
                          <i className="fas fa-handshake me-1" />
                          Partner with Us
                        </button>
                      </a>
                    </li> */}
                    <li>
                      <Link
                        className="btn btn-md btn-primary-gradient d-inline-flex align-items-center rounded-pill"
                        to="/login"
                        style={{
                          fontSize: "13px",
                          borderRadius: "47px",
                          border: "none",
                        }}
                      >
                        <i className="isax isax-lock-1 me-1" />
                        Login/Sign Up
                      </Link>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <li className="nav-item dropdown has-arrow logged-item">
                    <div
                      ref={profileButtonRef}
                      className="nav-link ps-0"
                      style={{ cursor: "pointer" }}
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      <span className="user-img">
                        {profiles?.files && profiles.files.length > 0 ? (
                          <img
                            className="rounded-circle"
                            src={getImageUrl(profiles.files[0])}
                            loading="lazy"
                            alt={profiles?.first_name}
                            title={profiles?.first_name}
                            style={{
                              width: "36px",
                              height: "36px",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            className="rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                              width: "36px",
                              height: "36px",
                              backgroundColor: "#8059ca",
                              border: "1px solid #C6A4FF",
                              color: "white",
                              fontSize: "26px",
                            }}
                          >
                            {profiles?.first_name?.charAt(0)}
                          </div>
                        )}
                      </span>
                    </div>
                    {showDropdown && (
                      <div
                        ref={dropdownRef}
                        className="dropdown-menu dropdown-menu-end show mt-2 p-0"
                        style={{
                          width: "260px",
                          borderRadius: "12px",
                          border: "1px solid #eee",
                          boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                          overflow: "hidden",
                        }}
                      >
                        {/* Header */}
                        <div
                          className="d-flex align-items-center gap-1 px-3 py-2"
                          style={{ background: "#F8F9FA" }}
                        >
                          {profiles?.files && profiles.files.length > 0 ? (
                            <img
                              src={getImageUrl(profiles.files[0])}
                              alt={profiles?.first_name}
                              loading="lazy"
                              style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "2px solid #E6E6FF",
                              }}
                            />
                          ) : (
                            <div
                              className="d-flex align-items-center justify-content-center"
                              style={{
                                width: "44px",
                                height: "44px",
                                borderRadius: "50%",
                                background: "#6F42C1",
                                color: "#fff",
                                fontSize: "20px",
                                fontWeight: 600,
                                textTransform: "uppercase",
                              }}
                            >
                              {profiles?.first_name?.charAt(0)}
                            </div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: 600,
                                color: "#222",
                                textTransform: "capitalize",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {profiles?.first_name}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "#888",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {profiles?.email}
                            </div>
                          </div>
                        </div>
                        <div style={{ borderTop: "1px solid #eee" }} />
                        {/* Items */}
                        <Link
                          to="/my-orders"
                          className="dropdown-item d-flex align-items-center gap-2 px-3 py-2"
                          style={{ fontSize: "12px", color: "#555" }}
                        >
                          <i className="fas fa-user-circle"></i>
                          My Account
                        </Link>
                        <button
                          className="dropdown-item d-flex align-items-center gap-2 px-3 py-2 text-danger"
                          onClick={confirmLogout}
                          style={{ fontSize: "12px" }}
                        >
                          <i className="fas fa-sign-out-alt"></i>
                          Logout
                        </button>
                      </div>
                    )}
                  </li>
                </>
              )}
            </ul>
          </nav>
        </div>
      </header>

      {/* Location off mosas */}
      <LocationOffcanvas
        isOpen={showLocationOffcanvas}
        onClose={closeLocationOffcanvas}
        position={offcanvasPosition}
        source="header"
      />

      {/* Mobile Search  */}
      <MobileSearchDropdown
        isOpen={showMobileSearchDropdown}
        onClose={() => setShowMobileSearchDropdown(false)}
        placeholderTexts={placeholderTexts}
        placeholderIndex={placeholderIndex}
      />

      {/* Cart Choice Modal */}
      {showCartChoiceModal && typeof document !== "undefined" && createPortal(
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 999999,
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowCartChoiceModal(false)}
        >
          <div
            className="modal-dialog modal-dialog-centered"
            style={{ maxWidth: "580px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="modal-content border-0"
              style={{
                borderRadius: "20px",
                overflow: "hidden",
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                background: "#ffffff",
              }}
            >
              <div
                className="modal-header border-0 pb-0"
                style={{ padding: "24px 24px 12px 24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}
              >
                <h5
                  className="modal-title"
                  style={{
                    fontSize: "19px",
                    fontWeight: "500",
                    color: "#0f172a",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Select Cart Type
                </h5>
                <button
                  type="button"
                  className="btn-close shadow-none"
                  onClick={() => setShowCartChoiceModal(false)}
                  style={{ cursor: "pointer" }}
                ></button>
              </div>

              <div className="modal-body" style={{ padding: "12px 24px 24px 24px" }}>
                <p style={{ fontSize: "14px", color: "#64748b", marginBottom: "20px" }}>
                  Please choose which cart you would like to view.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "16px",
                  }}
                >


                  {/* Medicine Card */}
                  <div
                    onClick={() => {
                      setShowCartChoiceModal(false);
                      navigate("/cart?carttype=medicines");
                    }}
                    style={{
                      border: "1.5px solid #f1f5f9",
                      borderRadius: "16px",
                      padding: "20px",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: "#f5f9ff",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "#3b82f6";
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(59, 130, 246, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#f1f5f9";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        backgroundColor: "#eff6ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa-solid fa-prescription-bottle-medical" style={{ fontSize: "24px", color: "#3b82f6" }}></i>
                    </div>
                    <div>
                      <h6 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                        Pharmacy
                      </h6>
                      <span style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4", display: "block" }}>
                        Prescriptions & Medicines
                      </span>
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        letterSpacing: "0.3px",
                        color: "#3b82f6",
                        background: "#eff6ff",
                        padding: "2px 10px",
                        borderRadius: "20px",
                        border: "1px solid #bfdbfe",
                        boxShadow: "0 2px 5px rgba(59, 130, 246, 0.08)",
                      }}
                    >
                      {ServiceCartCount?.medicine || 0} Items
                    </span>
                  </div>



                  {/* Lab Test Card */}
                  <div
                    onClick={() => {
                      setShowCartChoiceModal(false);
                      navigate("/labtest-checkout?carttype=labtests");
                    }}
                    style={{
                      border: "1.5px solid #f1f5f9",
                      borderRadius: "16px",
                      padding: "20px",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: "#fcfaff",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "#8059ca";
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(128, 89, 202, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#f1f5f9";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        backgroundColor: "#f3eefc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fa-solid fa-microscope" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                    </div>
                    <div>
                      <h6 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                        Lab Tests
                      </h6>
                      <span style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4", display: "block" }}>
                        Bookings & health packages
                      </span>
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        letterSpacing: "0.3px",
                        color: "#8059ca",
                        background: "#f3eefc",
                        padding: "2px 10px",
                        borderRadius: "20px",
                        border: "1px solid #ddd6fe",
                        boxShadow: "0 2px 5px rgba(128, 89, 202, 0.08)",
                      }}
                    >
                      {ServiceCartCount?.labtests || 0} Items
                    </span>
                  </div>



                  {/* Medical Equipment Card */}
                  <div
                    onClick={() => {
                      setShowCartChoiceModal(false);
                      navigate("/cart?carttype=medicalequipment");
                    }}
                    style={{
                      border: "1.5px solid #f1f5f9",
                      borderRadius: "16px",
                      padding: "20px",
                      textAlign: "center",
                      cursor: "pointer",
                      backgroundColor: "#fffaf8",
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "12px",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                      position: "relative",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.borderColor = "#f97316";
                      e.currentTarget.style.boxShadow = "0 10px 15px -3px rgba(249, 115, 22, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#f1f5f9";
                      e.currentTarget.style.boxShadow = "0 2px 4px rgba(0,0,0,0.02)";
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "12px",
                        backgroundColor: "#ffebd5",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <i className="fas fa-wheelchair" style={{ fontSize: "24px", color: "#f97316" }}></i>
                    </div>
                    <div>
                      <h6 style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a", marginBottom: "4px" }}>
                        Medical Equipment
                      </h6>
                      <span style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.4", display: "block" }}>
                        Rentals & sales products
                      </span>
                    </div>
                    <span
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        fontSize: "11px",
                        fontWeight: "600",
                        fontFamily: "'Outfit', 'Inter', sans-serif",
                        letterSpacing: "0.3px",
                        color: "#f97316",
                        background: "#ffebd5",
                        padding: "2px 10px",
                        borderRadius: "20px",
                        border: "1px solid #fed7aa",
                        boxShadow: "0 2px 5px rgba(249, 115, 22, 0.08)",
                      }}
                    >
                      {ServiceCartCount?.medicalequipment || 0} Items
                    </span>
                  </div>


                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Home2Header;
