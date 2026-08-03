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
import { GOOGLE_MAPS_API_KEY } from "../../utils/index"
// Constants
const CART_STORAGE_KEY = "pharmacyCart";
const PHONE_STORAGE_KEY = "phone";
const TOKEN_STORAGE_KEY = "medicomparestoken";
const IS_CART_STORAGE_KEY = "isCart";
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
  const [isDesktop, setIsDesktop] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const checkIsDesktop = () => {
        setIsDesktop(window.innerWidth >= 1024);
      };
      checkIsDesktop();
      window.addEventListener("resize", checkIsDesktop);
      return () => window.removeEventListener("resize", checkIsDesktop);
    }
  }, []);

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

      const headerEl = document.querySelector('header.mobile-header');
      if (headerEl) {
        setMobileHeaderHeight(headerEl.offsetHeight);
      }

      if (isMobile) {
        const mobileHeader = document.querySelector('header.mobile-header');
        const mobileSearch = document.querySelector('section.mobile-search');
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
    let lastIsScrolled = window.scrollY > 0;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollY = window.scrollY;
        const shouldShow = currentScrollY > 200;
        if (shouldShow !== lastShowSearch) {
          lastShowSearch = shouldShow;
          setShowSearch(shouldShow);
        }

        const scrolled = currentScrollY > 0;
        if (scrolled !== lastIsScrolled) {
          lastIsScrolled = scrolled;
          setIsScrolled(scrolled);
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
        className={`mobile-header fixed top-0 left-0 right-0 w-full px-[15px] py-[11px] flex-nowrap items-center justify-between bg-white border-b border-[#f1f1f1] z-[9999] lg:hidden ${isLocationUpdating ? "hidden" : "flex"
          }`}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            minWidth: 0,
            flex: 1,
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
                  <small className="font-bold text-[10px] text-gray-800 truncate block max-w-[120px]">
                    {(() => {
                      const loc = getLocationDisplayName();
                      return loc.length > 18 ? `${loc.slice(0, 18)}...` : loc;
                    })()}
                  </small>
                  <i className="fa-solid fa-chevron-down text-gray-600 text-[7px] shrink-0 mt-[1px]"></i>
                </div>
                <small className="text-[8px] text-gray-500 font-medium leading-none block truncate max-w-[120px]">
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
            flexWrap: "nowrap",
          }}
        >
          <Link
            to="#"
            onClick={(e) => {
              e.preventDefault();
              setShowCartChoiceModal(true);
            }}
            className="w-[32px] h-[32px] !rounded-full border !border-solid !border-[#e5e7eb] hover:!border-[#8059ca] flex items-center justify-center !text-[#8059ca] bg-white hover:bg-[#f0ebff] cursor-pointer transition-all duration-200 no-underline relative"
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
              className="w-[32px] h-[32px] !rounded-full !border !border-solid !border-[#e5e7eb] hover:!border-[#8059ca] !flex !items-center !justify-center !text-[#8059ca] !bg-white hover:!bg-[#f0ebff] !cursor-pointer !transition-all !duration-200 no-underline relative"
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
                  className="!rounded-full"
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
            className="mobile-search lg:!hidden fixed left-0 right-0 px-[15px] py-[14px] bg-white border-b border-solid border-[#f1f1f1] z-[998]"
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
        className={`header-custom w-full h-[75px] bg-[#fcfcfc] border-b border-gray-100 hidden lg:block fixed top-0 left-0 right-0 z-[99999999] ${isScrolled ? "shadow-sm" : ""} ${isLocationUpdating ? "hidden" : "block"
          }`}
      >
        <div
          className="w-full h-full max-w-[1400px] mx-auto px-6"
        >
          <nav className="flex items-center justify-between w-full h-full">
            <div className="flex items-center gap-6 min-w-0 flex-1 h-full">
              <Link to="/" className="shrink-0 flex items-center">
                <img
                  src="/MediCompares_Logo.png"
                  className="img-fluid"
                  alt="Logo"
                  loading="lazy"
                  style={{ width: "115px", height: "auto", marginLeft: "17px" }}
                />
              </Link>

              <span
                className="hidden lg:flex items-center -ml-2.5 cursor-pointer transition-all duration-300 ease-in-out text-slate-800 font-semibold location-selector"
                title={currentLocation?.name || "Select Location"}
                onClick={() => handleLocationClick("right")}
              >
                <div className="flex items-center">
                  <div className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center shrink-0">
                    <i className="fas fa-map-marker-alt text-[#8059ca] text-[18px]"></i>
                  </div>
                  <div
                    className="flex flex-col justify-center min-w-[180px] cursor-pointer tooltip-wrappers"
                    id="locationTooltip"
                  >
                    {isLocationUpdating ? (
                      <div className="flex items-center">
                        <i className="fa-solid fa-spinner fa-spin mr-2 text-[#9f64ff] text-[12px]"></i>
                        <div className="flex flex-col hover-texts">
                          <span className="text-[12px] font-semibold text-gray-800 leading-[1.4] tracking-[0.01em]">
                            Detecting Location...
                          </span>
                          <small className="text-gray-500 text-[10px] mt-[3px] font-medium">
                            Please wait...
                          </small>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center mb-[3px] tooltip-wrappers">
                          <span className="hover-texts text-[12px] font-semibold text-gray-800 leading-[1.4] truncate max-w-[200px] tracking-[0.01em] block">
                            {getLocationDisplayName()}
                          </span>
                          <i className="fa-solid fa-chevron-down ml-2 text-[10px] text-[#9f64ff] shrink-0 transition-transform duration-200 ease-in-out"></i>
                        </div>
                        <div className="flex items-center max-w-[150px] min-w-0">
                          <small className="hover-texts text-gray-500 text-[10px] font-medium truncate block min-w-0 w-full">
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
                      <div className="flex flex-wrap">
                        <div className="w-full">
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
            <div className="hidden">
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
            <ul className="flex items-center list-none m-0 p-0 gap-3">
              <li className="relative">
                <Link
                  to="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowCartChoiceModal(true);
                  }}
                  className="w-9 h-9 flex items-center justify-center !rounded-full bg-gray-50 !border !border-gray-200 !text-[#8059ca] hover:bg-[#f0ebff] hover:!border-[#8059ca] transition-all relative cursor-pointer !no-underline"
                  title={`${cartCount} product${cartCount !== 1 ? "s" : ""} in cart`}
                >
                  <i className="isax isax-shopping-cart text-[18px]" />
                  {cartCount > 0 && (
                    <span
                      className={`flex items-center justify-center font-bold text-white rounded-full bg-red-500 absolute -top-1 -right-1 min-w-[16px] h-4 text-[9px] px-1`}
                    >
                      {cartCount > 99 ? "99+" : cartCount}
                    </span>
                  )}
                </Link>
              </li>
              {isLoggedIn && (
                <li className="relative">
                  <Link
                    to="/notifications"
                    className="w-9 h-9 flex items-center justify-center !rounded-full bg-gray-50 !border !border-gray-200 !text-[#8059ca] hover:bg-[#f0ebff] hover:!border-[#8059ca] transition-all relative cursor-pointer !no-underline"
                    title="Notifications"
                  >
                    <i className="fas fa-bell text-[16px]"></i>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[#8059ca] text-white rounded-full min-w-[16px] h-4 flex items-center justify-center text-[9px] font-bold px-1">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                </li>
              )}

              {!isLoggedIn ? (
                <>
                  <ul className="flex items-center list-none m-0 p-0">
                    <li>
                      <Link
                        className="!bg-[linear-gradient(135deg,#8059ca_0%,#822BD4_100%)] hover:opacity-90 !text-white !font-semibold !text-[13px] !px-4 !py-2 !rounded-full inline-flex items-center !border-none shadow-sm !transition-all"
                        to="/login"
                      >
                        <i className="isax isax-lock-1 mr-1" />
                        Login/Sign Up
                      </Link>
                    </li>
                  </ul>
                </>
              ) : (
                <>
                  <li className="relative">
                    <div
                      ref={profileButtonRef}
                      className="w-9 h-9 flex items-center justify-center !rounded-full !border !border-gray-200 overflow-hidden cursor-pointer"
                      onClick={() => setShowDropdown(!showDropdown)}
                    >
                      {profiles?.files && profiles.files.length > 0 ? (
                        <img
                          className="w-full h-full object-cover"
                          src={getImageUrl(profiles.files[0])}
                          loading="lazy"
                          alt={profiles?.first_name}
                          title={profiles?.first_name}
                        />
                      ) : (
                        <div className="w-full h-full bg-[#8059ca] text-white flex items-center justify-center text-[15px] font-semibold uppercase">
                          {profiles?.first_name?.charAt(0)}
                        </div>
                      )}
                    </div>
                    {showDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-0 mt-2 p-0 w-[260px] rounded-[12px] border border-[#eee] bg-white shadow-[0_8px_24px_rgba(0,0,0,0.08)] overflow-hidden z-50"
                      >
                        {/* Header */}
                        <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F9FA]">
                          {profiles?.files && profiles.files.length > 0 ? (
                            <img
                              src={getImageUrl(profiles.files[0])}
                              alt={profiles?.first_name}
                              loading="lazy"
                              className="w-11 h-11 rounded-full object-cover border-2 border-[#E6E6FF]"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#6F42C1] text-white text-[20px] font-semibold uppercase">
                              {profiles?.first_name?.charAt(0)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="text-[13px] font-semibold text-[#222] capitalize whitespace-nowrap overflow-hidden text-ellipsis">
                              {profiles?.first_name}
                            </div>
                            <div className="text-[11px] text-[#888] whitespace-nowrap overflow-hidden text-ellipsis">
                              {profiles?.email}
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-[#eee]" />
                        {/* Items */}
                        <Link
                          to="/my-orders"
                          className="flex items-center gap-2 px-3 py-2 text-[12px] text-[#555] hover:bg-gray-100 w-full text-left no-underline"
                        >
                          <i className="fas fa-user-circle"></i>
                          My Account
                        </Link>
                        <button
                          className="flex items-center gap-2 px-3 py-2 !text-[12px] !text-red-500 hover:bg-gray-100 w-full text-left border-none bg-transparent cursor-pointer"
                          onClick={confirmLogout}
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
      {!isDesktop && (
        <MobileSearchDropdown
          isOpen={showMobileSearchDropdown}
          onClose={() => setShowMobileSearchDropdown(false)}
          placeholderTexts={placeholderTexts}
          placeholderIndex={placeholderIndex}
        />
      )}

      {/* Cart Choice Modal */}
      {showCartChoiceModal && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 bg-[#0f172a]/60 z-[999999] backdrop-blur-[4px] flex sm:items-center sm:justify-center items-end"
          onClick={() => setShowCartChoiceModal(false)}
        >
          {/* Bottom sheet on mobile, centered card on desktop */}
          <div
            className="w-full sm:max-w-[580px] sm:mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white sm:rounded-[20px] rounded-t-[24px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border-0 w-full">
              {/* Drag handle for mobile */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-300"></div>
              </div>

              <div className="border-0 pb-0 p-[16px_20px_10px_20px] sm:p-[24px_24px_12px_24px] flex justify-between items-center">
                <h5 className="text-[17px] sm:text-[19px] font-semibold text-[#0f172a] tracking-[-0.3px] m-0">
                  Select Cart Type
                </h5>
                <button
                  type="button"
                  onClick={() => setShowCartChoiceModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition-colors border-none cursor-pointer"
                >
                  <i className="fas fa-times text-[14px]"></i>
                </button>
              </div>

              <div className="p-[8px_16px_24px_16px] sm:p-[12px_24px_24px_24px]">
                <p className="text-[13px] sm:text-[14px] text-[#64748b] mb-4">
                  Please choose which cart you would like to view.
                </p>

                {/* Always 3 columns — compact on mobile, full on desktop */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {/* Medicine Card */}
                  <div
                    onClick={() => {
                      setShowCartChoiceModal(false);
                      navigate("/cart?carttype=medicines");
                    }}
                    className="group/card border-[1.5px] border-[#f1f5f9] rounded-[12px] sm:rounded-[16px] p-3 sm:p-5 text-center cursor-pointer bg-[#f5f9ff] transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 hover:border-[#3b82f6] hover:shadow-[0_10px_15px_-3px_rgba(59,130,246,0.15)] relative"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-[#eff6ff] flex items-center justify-center transition-colors group-hover/card:bg-[#3b82f6]/10">
                      <i className="fa-solid fa-prescription-bottle-medical text-lg sm:text-2xl text-[#3b82f6]"></i>
                    </div>
                    <div>
                      <h6 className="text-[12px] sm:text-[15px] font-bold text-[#0f172a] mb-0.5">
                        Pharmacy
                      </h6>
                      <span className="text-[10px] sm:text-[11px] text-[#64748b] leading-[1.3] block">
                        Medicines
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-semibold text-[#3b82f6] bg-[#eff6ff] py-0.5 px-1.5 sm:px-2.5 rounded-full border border-[#bfdbfe]">
                      {ServiceCartCount?.medicine || 0}
                    </span>
                  </div>

                  {/* Lab Test Card */}
                  <div
                    onClick={() => {
                      setShowCartChoiceModal(false);
                      navigate("/labtest-checkout?carttype=labtests");
                    }}
                    className="group/card border-[1.5px] border-[#f1f5f9] rounded-[12px] sm:rounded-[16px] p-3 sm:p-5 text-center cursor-pointer bg-[#fcfaff] transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 hover:border-[#8059ca] hover:shadow-[0_10px_15px_-3px_rgba(128,89,202,0.15)] relative"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-[#f3eefc] flex items-center justify-center transition-colors group-hover/card:bg-[#8059ca]/10">
                      <i className="fa-solid fa-microscope text-lg sm:text-2xl text-[#8059ca]"></i>
                    </div>
                    <div>
                      <h6 className="text-[12px] sm:text-[15px] font-bold text-[#0f172a] mb-0.5">
                        Lab Tests
                      </h6>
                      <span className="text-[10px] sm:text-[11px] text-[#64748b] leading-[1.3] block">
                        Health packages
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-semibold text-[#8059ca] bg-[#f3eefc] py-0.5 px-1.5 sm:px-2.5 rounded-full border border-[#ddd6fe]">
                      {ServiceCartCount?.labtests || 0}
                    </span>
                  </div>

                  {/* Medical Equipment Card */}
                  <div
                    onClick={() => {
                      setShowCartChoiceModal(false);
                      navigate("/cart?carttype=medicalequipment");
                    }}
                    className="group/card border-[1.5px] border-[#f1f5f9] rounded-[12px] sm:rounded-[16px] p-3 sm:p-5 text-center cursor-pointer bg-[#fffaf8] transition-all duration-200 flex flex-col items-center gap-2 sm:gap-3 hover:border-[#f97316] hover:shadow-[0_10px_15px_-3px_rgba(249,115,22,0.15)] relative"
                  >
                    <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-[#ffebd5] flex items-center justify-center transition-colors group-hover/card:bg-[#f97316]/10">
                      <i className="fas fa-wheelchair text-lg sm:text-2xl text-[#f97316]"></i>
                    </div>
                    <div>
                      <h6 className="text-[12px] sm:text-[15px] font-bold text-[#0f172a] mb-0.5">
                        Equipment
                      </h6>
                      <span className="text-[10px] sm:text-[11px] text-[#64748b] leading-[1.3] block">
                        Rentals & sales
                      </span>
                    </div>
                    <span className="text-[9px] sm:text-[11px] font-semibold text-[#f97316] bg-[#ffebd5] py-0.5 px-1.5 sm:px-2.5 rounded-full border border-[#fed7aa]">
                      {ServiceCartCount?.medicalequipment || 0}
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

