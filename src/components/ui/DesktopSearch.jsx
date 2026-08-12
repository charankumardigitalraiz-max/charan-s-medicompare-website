import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { axiosCommonInstance } from "../../Apiservice";
import VendorOffersModal from "./VendorOffersModal.jsx";
import { getImageUrl } from "../../utils/index";
import {
  getMedicinePincodeFromStorage,
  getProductNavigation,
} from "../../utils/productUtils";
import toast from "react-hot-toast";
import CartQuantityControls from "./CartQuantityControls";
import { useLocation as useLocationContext } from "../../context/LocationContext";
import VendorActions from "./VendorActions.jsx";
import { useCart } from "../../hooks/useCart";
import { useAddToCart } from "../../hooks/useAddToCart";

const ProductCard = React.memo(({ item, onClick }) => {
  const { getCartQuantity } = useCart();
  const { addToCart } = useAddToCart();

  const tablet = item?.tablet;
  const vendors = item?.vendors;
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const resolveImage = (item) => {
    const img =
      item?.files?.[0] ??
      (Array.isArray(item?.imageUrl) ? item.imageUrl[0] : item?.imageUrl);
    if (!img) return null;
    return getImageUrl(img);
  };

  const discountPercent = tablet?.variant?.[0]?.discount;

  const handleAddToCart = async () => {
    localStorage.setItem("isCart", true);
    const selectedVar = tablet?.variant?.[0];
    const firstVendor = vendors?.[0];
    const inStock = !!(
      (selectedVar && selectedVar.stock && selectedVar.stock > 0) ||
      firstVendor?.stock > 0 ||
      tablet?.stock > 0
    );
    if (!inStock) {
      toast.error("Item is out of stock");
      return;
    }
    const basePrice = parseFloat(firstVendor?.price || tablet?.variant?.[0]?.price || tablet?.price || 0);
    const discountPrice = parseFloat(firstVendor?.discountprice || firstVendor?.discountPrice || 0);
    const discountType = firstVendor?.discountType;

    let finalPrice = basePrice;
    if (discountType === "percentage" && discountPrice > 0) {
      finalPrice = basePrice - (basePrice * discountPrice) / 100;
    } else if (discountPrice > 0 && discountPrice < basePrice) {
      finalPrice = discountPrice;
    }

    const itemObj = {
      tabletdetails: tablet,
      vendordetails: firstVendor?.bussinessdetails || firstVendor,
      variants: tablet?.variant || [],
      price: finalPrice,
      discountprice: firstVendor?.discountprice,
      discountType: firstVendor?.discountType,
    };

    await addToCart(itemObj, selectedVar, {
      bookingType: "cart",
      type: "normal",
    });
  };

  const handleSingleAddToCart = async () => {
    localStorage.setItem("isCart", true);
    const firstVendor = vendors?.[0];
    const inStock = !!(
      tablet?.stock > 0 || firstVendor?.stock > 0
    );
    if (!inStock) {
      toast.error("Item is out of stock");
      return;
    }
    const basePrice = parseFloat(firstVendor?.price || tablet?.variant?.[0]?.price || tablet?.price || 0);
    const discountPrice = parseFloat(firstVendor?.discountprice || firstVendor?.discountPrice || 0);
    const discountType = firstVendor?.discountType;

    let finalPrice = basePrice;
    if (discountType === "percentage" && discountPrice > 0) {
      finalPrice = basePrice - (basePrice * discountPrice) / 100;
    } else if (discountPrice > 0 && discountPrice < basePrice) {
      finalPrice = discountPrice;
    }

    const itemObj = {
      tabletdetails: tablet,
      vendordetails: firstVendor?.bussinessdetails || firstVendor,
      variants: [],
      price: finalPrice,
      discountprice: firstVendor?.discountprice,
      discountType: firstVendor?.discountType,
    };

    await addToCart(itemObj, null, {
      bookingType: "cart",
      type: "normal",
    });
  };

  return (
    <div
      key={tablet?._id}
      className="desktop-product-card"
      style={{
        background: "#ffffff",
        borderRadius: "12px",
        padding: "10px",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.04)",
        border: "1px solid #f1f5f9",
        width: "190px",
        flexShrink: 0,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        transition: "all 0.2s ease-in-out",
        position: "relative",
      }}
      onClick={() => onClick(item)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 20px rgba(128, 89, 202, 0.08)";
        e.currentTarget.style.borderColor = "rgba(128, 89, 202, 0.2)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "none";
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.04)";
        e.currentTarget.style.borderColor = "#f1f5f9";
      }}
    >
      {/* Discount Badge */}
      {discountPercent > 0 && (
        <span
          style={{
            position: "absolute",
            top: "6px",
            left: "6px",
            fontSize: "8px",
            fontWeight: "700",
            color: "#ffffff",
            backgroundColor: "#ff6b35",
            padding: "2px 5px",
            borderRadius: "8px",
            zIndex: 2,
          }}
        >
          {discountPercent}% OFF
        </span>
      )}

      {/* Product Image */}
      <div style={{ position: "relative", width: "100%", height: "75px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        {!imageLoaded && !imageError && (
          <div style={{ position: "absolute", background: "#f8fafc", inset: 0, borderRadius: "6px" }} />
        )}
        <img
          src={
            !imageError
              ? resolveImage(tablet?.variant?.[0]) || resolveImage(tablet) || "/assets/default.png"
              : "/assets/default.png"
          }
          alt={tablet?.name}
          loading="lazy"
          style={{
            maxWidth: "100%",
            height: "75px",
            objectFit: "contain",
            opacity: imageLoaded ? 1 : 0,
            transition: "opacity 0.2s ease",
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
      </div>

      {/* Info Block */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", marginTop: "6px" }}>
        {/* Title */}
        <div
          style={{
            fontSize: "12px",
            fontWeight: "600",
            color: "#1e293b",
            lineHeight: "1.35",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            width: "100%",
            margin: "0 0 4px 0",
          }}
        >
          {tablet?.name || "Product"}
        </div>

        {/* Vendor and Price Section */}
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "6px", display: "flex", flexDirection: "column", gap: "6px" }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", minWidth: 0, flex: 1 }}>
              <img
                src={getImageUrl(
                  vendors?.[0]?.bussinessdetails?.bussiness_image?.url ||
                  "/assets/img/logo.png",
                )}
                alt="Vendor"
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "4px",
                  border: "1px solid #e2e8f0",
                  objectFit: "contain",
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.src = "/assets/default.png";
                }}
              />
              <span
                style={{
                  fontSize: "10.5px",
                  fontWeight: "500",
                  color: "#64748b",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {vendors?.[0]?.bussinessdetails?.name || "MediCompares"}
              </span>
            </div>

            {/* Price Calculations */}
            <span style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", whiteSpace: "nowrap" }}>
              {(() => {
                const vendor = vendors?.[0];
                const originalPrice = vendor?.price || tablet?.variant?.[0]?.price || tablet?.price || 0;
                const discountPrice = vendor?.discountprice || null;
                const discountType = vendor?.discountType || null;

                let calculatedDiscountPrice = discountPrice;
                if (discountType === "percentage" && discountPrice && discountPrice > 0) {
                  calculatedDiscountPrice = originalPrice - (originalPrice * discountPrice / 100);
                }

                return calculatedDiscountPrice && calculatedDiscountPrice > 0 && calculatedDiscountPrice !== originalPrice ? (
                  <>
                    <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "9px", fontWeight: "normal", marginRight: "3px" }}>
                      ₹{originalPrice}
                    </span>
                    ₹{calculatedDiscountPrice.toFixed(0)}
                  </>
                ) : originalPrice ? (
                  `₹${originalPrice}`
                ) : (
                  "Request"
                );
              })()}
            </span>
          </div>

          {/* Cart Quantity Control via VendorActions */}
          {vendors && vendors.length > 0 ? (
            <VendorActions
              bookingType={vendors?.[0]?.bookingType}
              isInStock={vendors?.[0]?.variant?.[0]?.inStock !== false}
              med={tablet}
              vendor={vendors?.[0] || {}}
              effectiveVariantId={tablet?.variant?.[0]?._id || null}
              price={(() => {
                const firstVendor = vendors?.[0];
                const basePrice = parseFloat(firstVendor?.price || tablet?.variant?.[0]?.price || tablet?.price || 0);
                const discountPrice = parseFloat(firstVendor?.discountprice || firstVendor?.discountPrice || 0);
                const discountType = firstVendor?.discountType;

                let finalPrice = basePrice;
                if (discountType === "percentage" && discountPrice > 0) {
                  finalPrice = basePrice - (basePrice * discountPrice) / 100;
                } else if (discountPrice > 0 && discountPrice < basePrice) {
                  finalPrice = discountPrice;
                }
                return finalPrice;
              })()}
              stock={vendors?.[0]?.variant?.[0]?.stock || vendors?.[0]?.stock || 0}
              service={tablet?.subcategorys?.category?.fixedType || tablet?.category?.fixedType || ""}
              calculatedDiscountPrice={vendors?.[0]?.discountprice}
              handleAddToCart={handleAddToCart}
              handleSingleAddToCart={handleSingleAddToCart}
              className="w-100"
              containerStyle={{
                display: "flex",
                width: "100%",
                gap: "6px",
                alignItems: "center",
              }}
              buttonStyle={{
                width: "100%",
                padding: "4px 6px",
                fontSize: "10px",
                fontWeight: "600",
                borderRadius: "6px",
              }}
              rentAndCartButtonStyles={{
                fontSize: "10px",
                padding: "4px 6px",
              }}
            />
          ) : (
            <div style={{ height: "20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "#94a3b8" }}>
              No seller available
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

const DesktopSearch = ({ showSearch, setShowSearchOverlay, myservice }) => {
  const [desktopSearchQuery, setDesktopSearchQuery] = useState("");
  const [desktopSearchSuggestions, setDesktopSearchSuggestions] = useState([]);
  const [desktopSearchLoading, setDesktopSearchLoading] = useState(false);
  const [desktopSearchRecommended, setDesktopSearchRecommended] = useState([]);
  const [desktopSearchShowSuggestions, setDesktopSearchShowSuggestions] =
    useState(true);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [suggestionsLimit, setSuggestionsLimit] = useState(10);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [desktopSearchIsListening, setDesktopSearchIsListening] =
    useState(false);
  const [desktopSearchRecentSearches, setDesktopSearchRecentSearches] =
    useState([]);
  const [showMicPermission, setShowMicPermission] = useState(false);
  const [skipMicPermission, setSkipMicPermission] = useState(false);
  const [isNavigatingFromRecent, setIsNavigatingFromRecent] = useState(false);
  const [vendorModel, setVendorModel] = useState(null);
  // const [searchCache, setSearchCache] = useState(new Map());
  const [hasFetchedRecent, setHasFetchedRecent] = useState(false);
  const { selectedPincode, latitude, longitude } = useLocationContext();
  const desktopSearchDebounceTimerRef = useRef(null);
  const searchContainerRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchDropdownRef = useRef(null);
  const productsRowRef = useRef(null);
  const latestSearchRef = useRef("");
  const searchCacheRef = useRef(new Map());

  const navigate = useNavigate();

  const closeSearchUI = () => {
    setIsDropdownVisible(false);
    setShowSearchOverlay(false);
    setDesktopSearchShowSuggestions(false);
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsDropdownVisible(false);
        setShowSearchOverlay(false);
        setDesktopSearchShowSuggestions(false);
      }
    };

    const handleInputFocus = () => {
      setIsDropdownVisible(true);
      setShowSearchOverlay(true);
    };

    const input = searchInputRef.current;
    if (input) {
      input.addEventListener("focus", handleInputFocus);
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      if (input) {
        input.removeEventListener("focus", handleInputFocus);
      }
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setShowSearchOverlay, setDesktopSearchShowSuggestions]);

  useEffect(() => {
    const productsRow = productsRowRef.current;
    if (productsRow && productsRow.children.length > 2) {
      productsRow.classList.remove("no-scroll");
      productsRow.classList.add("scroll");
    }
  }, [desktopSearchRecommended]);

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setDesktopSearchRecentSearches(JSON.parse(saved));
      } catch (e) {
        setDesktopSearchRecentSearches([]);
      }
    }
    const micPermission = localStorage.getItem("medicompares_mic_permission");
    setSkipMicPermission(micPermission === "granted");
  }, []);

  // const requestCacheRef = useRef(new Map());
  // const makeApiCall = async (searchQuery, requestType = "search") => {
  //   const cacheKey = `${requestType}-${searchQuery}`;
  //   if (requestCacheRef.current.has(cacheKey)) {
  //     return requestCacheRef.current.get(cacheKey);
  //   }

  //   try {
  //     const trimmedQuery =
  //       searchQuery.length > 50 ? searchQuery.substring(0, 50) : searchQuery;
  //     const pincodeParam = selectedPincode ? `&pincode=${selectedPincode}` : "";
  //     const latLngParams = (latitude && longitude) ? `&lat=${latitude}&lng=${longitude}` : "";
  //     const response = await axiosCommonInstance.get(
  //       `all/search/product?search=${encodeURIComponent(trimmedQuery)}${pincodeParam}${latLngParams}`,
  //     );

  //     const result = {
  //       list: response?.data?.data?.list || [],
  //       recentOrders: response?.data?.data?.recentOrders || [],
  //     };
  //     requestCacheRef.current.set(cacheKey, result);

  //     return result;
  //   } catch (error) {
  //     return { list: [], recentOrders: [] };
  //   }
  // };


  const makeApiCall = async (searchQuery, limitNum = 10) => {
    try {
      const trimmedQuery =
        searchQuery.length > 50
          ? searchQuery.substring(0, 50)
          : searchQuery;

      const pincodeParam = selectedPincode
        ? `&pincode=${selectedPincode}`
        : "";

      const latLngParams =
        latitude && longitude
          ? `&lat=${latitude}&lng=${longitude}`
          : "";

      const response = await axiosCommonInstance.get(
        `all/search/product?search=${encodeURIComponent(
          trimmedQuery
        )}${pincodeParam}${latLngParams}&page=1&limit=${limitNum}`
      );

      const list = response?.data?.data?.list || [];
      searchCacheRef.current.set(`${trimmedQuery.trim().toLowerCase()}-${limitNum}`, list);

      return {
        list,
        recentOrders: response?.data?.data?.recentOrders || [],
      };
    } catch (error) {
      console.error(error);
      return {
        list: [],
        recentOrders: [],
      };
    }
  };

  const fetchDesktopSuggestions = async (searchTerm, limitNum, isLoadMore = false) => {
    if (!isLoadMore) {
      setDesktopSearchLoading(true);
    } else {
      setIsMoreLoading(true);
    }
    setDesktopSearchShowSuggestions(true);

    try {
      const cacheKey = `${searchTerm.trim().toLowerCase()}-${limitNum}`;
      let result;
      if (!isLoadMore && searchCacheRef.current.has(cacheKey)) {
        const cachedList = searchCacheRef.current.get(cacheKey);
        result = {
          list: cachedList,
          recentOrders: desktopSearchRecommended,
        };
      } else {
        result = await makeApiCall(searchTerm, limitNum);
      }

      if (result) {
        // Ignore old responses
        if (latestSearchRef.current !== searchTerm) {
          return;
        }

        const suggestions =
          result.list.length > 0 ? result.list : [{ noResult: true }];

        setDesktopSearchSuggestions(suggestions);
        setDesktopSearchRecommended(result.recentOrders);

        if (result.list.length < limitNum) {
          setHasMoreSuggestions(false);
        } else {
          setHasMoreSuggestions(true);
        }
      }
    } catch (error) {
      if (!isLoadMore) {
        setDesktopSearchSuggestions([{ noResult: true }]);
      }
      setHasMoreSuggestions(false);
    } finally {
      setDesktopSearchLoading(false);
      setIsMoreLoading(false);
    }
  };

  const fetchRecentProducts = async () => {
    try {
      const result = await makeApiCall("recent", 10);

      if (result) {
        setDesktopSearchRecommended(result.recentOrders);
      }
    } catch (error) {
      setDesktopSearchRecommended([]);
    }
  };

  // const fetchRecentProducts = async () => {
  //   if (requestCacheRef.current.has("recent-products")) {
  //     const cached = requestCacheRef.current.get("recent-products");
  //     setDesktopSearchRecommended(cached.recentOrders);
  //     return;
  //   }

  //   try {
  //     const result = await makeApiCall("recent", "recent");
  //     if (result) {
  //       setDesktopSearchRecommended(result.recentOrders);
  //       requestCacheRef.current.set("recent-products", result);
  //     }
  //   } catch (error) {
  //     setDesktopSearchRecommended([]);
  //   }
  // };

  useEffect(() => {
    if (showSearch && !desktopSearchQuery) {
      setDesktopSearchLoading(false);
    }
  }, [showSearch, desktopSearchQuery]);

  useEffect(() => {
    if (isNavigatingFromRecent) {
      setIsNavigatingFromRecent(false);
      return;
    }

    if (desktopSearchDebounceTimerRef.current) {
      clearTimeout(desktopSearchDebounceTimerRef.current);
    }


    if (
      !desktopSearchQuery ||
      desktopSearchQuery.trim().length === 0
    ) {
      setDesktopSearchSuggestions([]);
      setDesktopSearchLoading(false);
      setSuggestionsLimit(10);
      setHasMoreSuggestions(true);
      setDesktopSearchShowSuggestions(true);
      return;
    }

    // if (
    //   !desktopSearchQuery ||
    //   desktopSearchQuery.trim().length === 0 ||
    //   !hasFetchedRecent
    // ) {
    //   setDesktopSearchSuggestions([]);
    //   setDesktopSearchLoading(false);
    //   setDesktopSearchShowSuggestions(true);
    //   return;
    // }

    // const cacheKey = desktopSearchQuery.trim().toLowerCase();
    // if (searchCache.has(cacheKey)) {
    //   const cachedResult = searchCache.get(cacheKey);
    //   setDesktopSearchSuggestions(cachedResult.suggestions);
    //   setDesktopSearchRecommended(cachedResult.recommended);
    //   setDesktopSearchLoading(false);
    //   setDesktopSearchShowSuggestions(true);
    //   return;
    // }

    desktopSearchDebounceTimerRef.current = setTimeout(async () => {
      const searchTerm = desktopSearchQuery.trim();

      latestSearchRef.current = searchTerm;
      setSuggestionsLimit(10);
      fetchDesktopSuggestions(searchTerm, 10, false);
    }, 300);

    return () => {
      if (desktopSearchDebounceTimerRef.current) {
        clearTimeout(desktopSearchDebounceTimerRef.current);
      }
    };
  }, [desktopSearchQuery, isNavigatingFromRecent, hasFetchedRecent]);

  useEffect(() => {
    return () => {
      if (desktopSearchDebounceTimerRef.current) {
        clearTimeout(desktopSearchDebounceTimerRef.current);
      }
    };
  }, []);

  // Voice recognition
  const startDesktopVoiceRecognition = (skipPermissionCheck = false) => {
    if (!skipPermissionCheck && !skipMicPermission) {
      setShowMicPermission(true);
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Your browser does not support voice search");
      return;
    }

    const recognition = new SpeechRecognition();

    recognition.lang = "en-IN";
    recognition.interimResults = false;
    recognition.continuous = false;

    try {
      recognition.start();
      setDesktopSearchIsListening(true);
    } catch (error) { }

    recognition.onstart = () => {
      setDesktopSearchIsListening(true);
    };

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setDesktopSearchQuery(voiceText);
      setDesktopSearchIsListening(false);
      addToDesktopRecentSearches(voiceText);
    };

    recognition.onerror = (event) => {
      setDesktopSearchIsListening(false);

      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied");
      } else if (event.error === "no-speech") {
        toast.error("No voice detected");
      } else {
        toast.error("Voice recognition failed");
      }
    };

    recognition.onend = () => {
      setDesktopSearchIsListening(false);
    };
  };

  // Handle microphone permission
  const handleDesktopMicPermission = (granted, skipFuture) => {
    setShowMicPermission(false);
    if (granted) {
      if (skipFuture) {
        setSkipMicPermission(true);
        localStorage.setItem("medicompares_mic_permission", "granted");
      }
      setTimeout(() => {
        startDesktopVoiceRecognition(true);
      }, 100);
    }
  };

  // Add to recent searches
  const addToDesktopRecentSearches = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") return;

    const updated = [
      searchTerm,
      ...desktopSearchRecentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 5);

    setDesktopSearchRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const clearDesktopRecentSearches = () => {
    setDesktopSearchRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Handle recent search click
  const handleDesktopRecentSearchClick = (searchTerm) => {
    if (desktopSearchDebounceTimerRef.current) {
      clearTimeout(desktopSearchDebounceTimerRef.current);
    }

    setIsNavigatingFromRecent(true);
    setDesktopSearchQuery(searchTerm);
    addToDesktopRecentSearches(searchTerm);
    navigateToFirstSearchResult(searchTerm);
  };

  const navigateToFirstSearchResult = async (searchTerm) => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) return;

    const cached = searchCacheRef.current.get(normalized);
    if (cached?.length > 0 && cached[0]?.tablet) {
      handleProductClick(cached[0]);
      return;
    }

    const visibleMatch = desktopSearchSuggestions.find((item) => item?.tablet);
    if (visibleMatch) {
      handleProductClick(visibleMatch);
      return;
    }

    closeSearchUI();

    const result = await makeApiCall(searchTerm.trim());
    if (result?.list?.length > 0) {
      handleProductClick(result.list[0]);
    } else {
      toast.error("No products found for this search");
    }
  };

  const handleSuggestionItemClick = (item) => {
    if (desktopSearchDebounceTimerRef.current) {
      clearTimeout(desktopSearchDebounceTimerRef.current);
    }

    if (item?.type === "package" && item.tablet?._id) {
      if (item.tablet?.name) {
        addToDesktopRecentSearches(item.tablet.name);
      }
      closeSearchUI();
      navigate(`/lab-package/${item.tablet._id}`);
      return;
    }

    if (item?.tablet) {
      if (item.tablet?.name) {
        addToDesktopRecentSearches(item.tablet.name);
      }
      handleProductClick(item);
      return;
    }

    const searchTerm = item?.query || item?.tablet?.name || desktopSearchQuery;
    if (!searchTerm) return;

    setIsNavigatingFromRecent(true);
    setDesktopSearchQuery(searchTerm);
    addToDesktopRecentSearches(searchTerm);
    navigateToFirstSearchResult(searchTerm);
  };

  const scrollProducts = (direction) => {
    const productsRow = productsRowRef.current;
    if (productsRow) {
      const scrollAmount = 200;
      if (direction === "left") {
        productsRow.scrollLeft -= scrollAmount;
      } else {
        productsRow.scrollLeft += scrollAmount;
      }
    }
  };

  const handleProductClick = (product) => {
    const navigation = getProductNavigation(product, {
      fallbackService: "medicine",
      pincode: getMedicinePincodeFromStorage(),
    });

    if (!navigation) {
      toast.error("Product details not available");
      return;
    }

    closeSearchUI();
    navigate(navigation.url, { state: navigation.state });
  };


  const capitalize = (text) => {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  };

  const highlightMatch = (text, query) => {
    if (!text) return "Unknown";
    const shortenedText = text.length > 35 ? text.slice(0, 35) + "..." : text;
    if (!query || typeof query !== 'string') return shortenedText;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = shortenedText.split(new RegExp(`(${escapedQuery})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} style={{ fontWeight: "normal" }}>
              {part}
            </span>
          ) : (
            <strong key={index} style={{ fontWeight: "600" }}>
              {part}
            </strong>
          )
        )}
      </>
    );
  };

  return (
    <div
      ref={searchContainerRef}
      className="desktop-search"
      style={{
        position: "relative",
        width: "380px",
        maxWidth: "100%",
        margin: "auto",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: "30px",
          border: "1.5px solid #e5e7eb",
          boxShadow:
            "0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "8px",
          width: "100%",
        }}
      >
        {/* Search Icon */}
        <div
          style={{
            width: "25px",
            height: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
          }}
        >
          <i className="fas fa-search"></i>
        </div>

        <div style={{ position: "relative", flex: 1 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <input
              ref={searchInputRef}
              type="text"
              className="search-input"
              autoComplete="off"
              placeholder="Search for medicines, etc..."
              value={desktopSearchQuery}
              onChange={(e) => {
                setDesktopSearchQuery(e.target.value);
                setDesktopSearchShowSuggestions(true);
              }}
              onFocus={() => {
                setDesktopSearchShowSuggestions(true);
                setIsDropdownVisible(true);
                setShowSearchOverlay(true);
                if (!hasFetchedRecent) {
                  setHasFetchedRecent(true);
                  fetchRecentProducts();
                }
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  desktopSearchQuery &&
                  desktopSearchQuery.trim().length > 0
                ) {
                  e.preventDefault();
                  addToDesktopRecentSearches(desktopSearchQuery.trim());
                  setDesktopSearchShowSuggestions(true);
                }
              }}
              style={{
                border: "none",
                outline: "none",
                width: "100%",
                fontSize: "15px",
                background: "transparent",
                color: "#111",
                paddingRight: "20px",
              }}
            />
          </div>
        </div>

        <button
          type="button"
          title="Upload prescription"
          onClick={() => navigate("/prescription-upload", { state: { mode: "search", pincode: selectedPincode, lat: latitude, lng: longitude } })}
          style={{
            background: "transparent",
            color: "rgb(107, 114, 128)",
            border: "1.5px solid #e5e7eb",
            borderRadius: "6px",
            padding: "2px",
            width: "25px",
            height: "25px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            flexShrink: 0,
            marginRight: "0px",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#7c3aed";
            e.currentTarget.style.borderColor = "#7c3aed";
            e.currentTarget.style.backgroundColor = "#f5f3ff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgb(107, 114, 128)";
            e.currentTarget.style.borderColor = "#e5e7eb";
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <i className="fas fa-file-prescription" style={{ fontSize: "13px" }}></i>
        </button>

        <button
          type="button"
          className="action-btn"
          onClick={startDesktopVoiceRecognition}
          style={{
            width: "25px",
            height: "25px",
            borderRadius: "6px",
            border: "1.5px solid #e5e7eb",
            background: desktopSearchIsListening ? "#321961" : "transparent",
            color: desktopSearchIsListening ? "#fff" : "#6b7280",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
          }}
          title="Voice search"
        >
          <i className="fas fa-microphone" style={{ fontSize: "14px" }}></i>
        </button>
      </div>

      <div
        ref={searchDropdownRef}
        className="desktop-search-dropdown"
        style={{
          position: "absolute",
          top: "calc(100% + 14px)",
          left: "50%",
          width:
            desktopSearchQuery && desktopSearchQuery.trim().length > 0
              ? "400px"
              : "850px",
          maxWidth: "calc(100vw - 30px)",
          background: "#fff",
          borderRadius: "20px",
          padding: "12px",
          boxShadow: "0 10px 35px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
          opacity: isDropdownVisible ? 1 : 0,
          transform: isDropdownVisible
            ? "translateX(-50%) translateY(0) scale(1)"
            : "translateX(-50%) translateY(-8px) scale(0.98)",
          pointerEvents: isDropdownVisible ? "auto" : "none",
          transition: "all 0.25s ease",
        }}
      >
        {desktopSearchShowSuggestions && (
          <>
            {/* Loading text */}
            {desktopSearchLoading && (
              <div style={{ textAlign: "center", padding: "30px 20px" }}>
                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                    marginBottom: "8px",
                  }}
                >
                  Loading...
                </p>
                <p style={{ color: "#9ca3af", fontSize: "12px" }}>
                  Searching for products
                </p>
              </div>
            )}

            {/* Search suggestions with magnifying glass */}
            {!desktopSearchLoading &&
              desktopSearchSuggestions.length > 0 &&
              !desktopSearchSuggestions[0].noResult && (
                <div>
                  <h6
                    style={{
                      fontWeight: 600,
                      marginBottom: "8px",
                      fontSize: "12px",
                    }}
                  >
                    Suggestions
                  </h6>
                  <div
                    style={{
                      maxHeight:
                        desktopSearchSuggestions.length > 6 ? "220px" : "auto",
                      overflowY:
                        desktopSearchSuggestions.length > 6 ? "auto" : "hidden",
                    }}
                  >
                    {desktopSearchSuggestions
                      .filter(item => {
                        if (item.noResult) return true;
                        return typeof item === 'object' && item !== null && (item.query || item?.tablet?.name);
                      })
                      .map((item, index) => (
                        <div
                          key={index}
                          className="desktop-search-suggestion"
                          onClick={() => handleSuggestionItemClick(item)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            padding: "6px 0",
                            cursor: "pointer",
                            fontSize: "13px",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          <i
                            className="fa fa-search"
                            style={{
                              color: "#999",
                              marginRight: "8px",
                              fontSize: "11px",
                            }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ flex: 1 }}>
                                {highlightMatch(
                                  capitalize(typeof item.query === 'string' ? item.query :
                                    (typeof item?.tablet?.name === 'string' ? item?.tablet?.name : 'Unknown')),
                                  desktopSearchQuery
                                )}
                              </span>

                              {item?.tablet?.packagingDetails && (
                                <span style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                  {item?.tablet?.packagingDetails}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{
                              fontSize: '10px',
                              color: '#666',
                              backgroundColor: '#f0f0f0',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              whiteSpace: 'nowrap'
                            }}>
                              {item?.type === "package"
                                ? capitalize(item?.type)
                                : item?.tablet?.category?.fixedType === "medicine"
                                  ? capitalize(item?.tablet?.medicineType || "product")
                                  : capitalize(item?.tablet?.category?.name || "product")}
                            </span> <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setVendorModel(item); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--color-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '24px', height: '24px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'scale(1.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }} title="Insert into search"><i className="fa fa-plus" style={{ fontSize: '11px' }} /></button></div>
                          </div>
                        </div>
                      ))}
                    {hasMoreSuggestions && desktopSearchSuggestions.length > 0 && !desktopSearchSuggestions[0].noResult && (
                      <button
                        type="button"
                        disabled={isMoreLoading}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const nextLimit = suggestionsLimit + 20;
                          setSuggestionsLimit(nextLimit);
                          fetchDesktopSuggestions(desktopSearchQuery, nextLimit, true);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px",
                          border: "none",
                          background: "#f9fafb",
                          color: isMoreLoading ? "#9ca3af" : "#321961",
                          fontWeight: "600",
                          textAlign: "center",
                          cursor: isMoreLoading ? "not-allowed" : "pointer",
                          fontSize: "13px",
                          borderTop: "1px solid #f3f4f6",
                          transition: "background-color 0.2s",
                          marginTop: "6px"
                        }}
                        onMouseEnter={(e) => {
                          if (!isMoreLoading) e.currentTarget.style.backgroundColor = "#f1f5f9";
                        }}
                        onMouseLeave={(e) => {
                          if (!isMoreLoading) e.currentTarget.style.backgroundColor = "#f9fafb";
                        }}
                      >
                        {isMoreLoading ? "Loading..." : "Load More"}
                      </button>
                    )}
                  </div>
                </div>
              )}

            {/* No results found message */}
            {!desktopSearchLoading &&
              desktopSearchQuery &&
              desktopSearchQuery.trim().length > 0 &&
              desktopSearchSuggestions.length > 0 &&
              desktopSearchSuggestions[0].noResult && (
                <div style={{ textAlign: "center", padding: "30px 20px" }}>
                  <p
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                      marginBottom: "8px",
                    }}
                  >
                    No results found
                  </p>
                  <p style={{ color: "#9ca3af", fontSize: "12px" }}>
                    Try searching with different keywords
                  </p>
                </div>
              )}

            {/* Recent searches */}
            {(!desktopSearchQuery || desktopSearchQuery.trim().length === 0) &&
              desktopSearchRecentSearches.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <h6 style={{ fontWeight: 600, fontSize: "14px" }}>
                      Recent Searches
                    </h6>
                    <button
                      onClick={clearDesktopRecentSearches}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#007bff",
                        cursor: "pointer",
                        fontSize: "11px",
                        fontWeight: 500,
                      }}
                    >
                      Clear All
                    </button>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {desktopSearchRecentSearches
                      .slice(0, 5)
                      .filter(searchTerm => typeof searchTerm === 'string')
                      .map((searchTerm, index) => (
                        <div
                          key={index}
                          className="desktop-recent-search-pill"
                          onClick={() =>
                            handleDesktopRecentSearchClick(searchTerm)
                          }
                          style={{
                            background: "#f8f9fa",
                            borderRadius: "16px",
                            padding: "4px 10px",
                            fontSize: "12px",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {searchTerm.length > 25
                            ? searchTerm.slice(0, 25) + "..."
                            : searchTerm}
                        </div>
                      ))}
                  </div>
                </div>
              )}
          </>
        )}

        {/* Recommended products */}
        {(!desktopSearchQuery || desktopSearchQuery.trim().length === 0) &&
          desktopSearchRecommended.length > 0 && (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <h6
                  className="mt-2"
                  style={{
                    fontWeight: 600,
                    fontSize: "14px",
                    marginBottom: "0",
                  }}
                >
                  Featured products
                </h6>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => scrollProducts("left")}
                    style={{
                      background: "#f0f0f0",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    <i className="fa fa-chevron-left"></i>
                  </button>
                  <button
                    onClick={() => scrollProducts("right")}
                    style={{
                      background: "#f0f0f0",
                      border: "none",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      fontSize: "12px",
                      color: "#666",
                    }}
                  >
                    <i className="fa fa-chevron-right"></i>
                  </button>
                </div>
              </div>
              <div
                ref={productsRowRef}
                className="desktop-products-row"
                style={{
                  display: "flex",
                  gap: "7px",
                  overflow: "hidden",
                  scrollBehavior: "smooth",
                }}
              >
                {desktopSearchRecommended.map((item, index) => (
                  <ProductCard
                    key={item?.tablet?._id || index}
                    item={item}
                    onClick={handleProductClick}
                  />
                ))}
              </div>
            </>
          )}
      </div>

      {/* Microphone permission modal */}
      {showMicPermission && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 10001,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setShowMicPermission(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              width: "400px",
              maxWidth: "90%",
              borderRadius: "12px",
              padding: "24px",
              boxShadow:
                "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#000",
                  margin: 0,
                }}
              >
                Shop faster with voice
              </h2>
              <button
                onClick={() => setShowMicPermission(false)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "#000",
                  padding: "0",
                  width: "24px",
                  height: "24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <i
                className="fa fa-microphone"
                style={{
                  fontSize: "48px",
                  color: "#0284c7",
                  marginBottom: "12px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                <input
                  type="checkbox"
                  id="mic-skip-checkbox"
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <span style={{ fontSize: "14px", color: "#374151" }}>
                  Allow this Medicompares app to access your microphone and skip
                  this step in the future.
                </span>
              </label>
              <p
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}
              >
                You can manage this access at any time in{" "}
                <span
                  style={{
                    color: "#0284c7",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  permissions settings
                </span>
                .
              </p>
              <p
                style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}
              >
                Your audio is transcribed in the cloud then automatically
                deleted. We store and use the transcripts as described in our{" "}
                <span
                  style={{
                    color: "#0284c7",
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Privacy Notice
                </span>
                .
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => handleDesktopMicPermission(false, false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  backgroundColor: "#ffffff",
                  color: "#000",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                }}
              >
                Not now
              </button>
              <button
                onClick={() => {
                  const checkbox = document.getElementById("mic-skip-checkbox");
                  handleDesktopMicPermission(true, checkbox?.checked || false);
                }}
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#321961",
                  color: "#000",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                }}
              >
                Turn on microphone
              </button>
            </div>
          </div>
        </div>
      )}
      <VendorOffersModal show={!!vendorModel} onClose={() => setVendorModel(null)} product={vendorModel} />
    </div>
  );
};



export default DesktopSearch;
