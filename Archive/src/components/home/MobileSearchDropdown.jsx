import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { axiosCommonInstance, imgUrl } from "../../Apiservice";
import { getImageUrl } from "../../utils/index";
import {
  getMedicinePincodeFromStorage,
  getProductNavigation,
  resolveProductTablet,
} from "../../utils/productUtils";
import toast from "react-hot-toast";
import { useLocation as useLocationContext } from "../../context/LocationContext";

const MobileSearchDropdown = ({
  isOpen,
  onClose,
  placeholderTexts,
  placeholderIndex
}) => {
  const [mobileSearchQuery, setMobileSearchQuery] = useState("");
  const [mobileSearchSuggestions, setMobileSearchSuggestions] = useState([]);
  const [mobileSearchLoading, setMobileSearchLoading] = useState(false);
  const [mobileSearchRecommended, setMobileSearchRecommended] = useState([]);
  const [mobileSearchShowSuggestions, setMobileSearchShowSuggestions] = useState(true);
  const [mobileSearchIsListening, setMobileSearchIsListening] = useState(false);
  const [mobileSearchShowDots, setMobileSearchShowDots] = useState(false);
  const [mobileSearchRecentSearches, setMobileSearchRecentSearches] = useState([]);
  const [showMicPermission, setShowMicPermission] = useState(false);
  const [skipMicPermission, setSkipMicPermission] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [suggestionsLimit, setSuggestionsLimit] = useState(10);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
  const mobileSearchDebounceTimerRef = useRef(null);

  const navigate = useNavigate();
  const { selectedPincode, latitude, longitude } = useLocationContext();

  const resolveImage = (item) => {
    const img =
      item?.files?.[0] ??
      (Array.isArray(item?.imageUrl) ? item.imageUrl[0] : item?.imageUrl);
    if (!img) return null;

    return getImageUrl(img);
  };

  useEffect(() => {
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      try {
        setMobileSearchRecentSearches(JSON.parse(saved));
      } catch (e) {
        setMobileSearchRecentSearches([]);
      }
    }

    const micPermission = localStorage.getItem("medicompares_mic_permission");

    setSkipMicPermission(micPermission === "granted");
  }, []);

  const [hasFetchedRecent, setHasFetchedRecent] = useState(false);
  const searchCacheRef = useRef(new Map());
  const requestCacheRef = useRef(new Map());

  const makeApiCall = async (searchQuery, limitNum = 10, requestType = 'search') => {
    const cacheKey = `${requestType}-${searchQuery}-${limitNum}`;

    if (requestType !== 'search' && requestCacheRef.current.has(cacheKey)) {
      return requestCacheRef.current.get(cacheKey);
    }

    try {
      const trimmedQuery = searchQuery.length > 50 ? searchQuery.substring(0, 50) : searchQuery;
      const pincodeParam = selectedPincode ? `&pincode=${selectedPincode}` : "";
      const latLngParams = (latitude && longitude) ? `&lat=${latitude}&lng=${longitude}` : "";
      const response = await axiosCommonInstance.get(
        `all/search/product?search=${encodeURIComponent(trimmedQuery)}${pincodeParam}${latLngParams}&page=1&limit=${limitNum}`
      );

      const result = {
        list: response?.data?.data?.list || [],
        recentOrders: response?.data?.data?.recentOrders || []
      };

      if (requestType !== 'search') {
        requestCacheRef.current.set(cacheKey, result);
      }

      return result;
    } catch (error) {
      return { list: [], recentOrders: [] };
    }
  };

  const fetchMobileSuggestions = async (searchTerm, limitNum, isLoadMore = false) => {
    if (!isLoadMore) {
      setMobileSearchLoading(true);
      setMobileSearchShowDots(true);
    } else {
      setIsMoreLoading(true);
    }

    try {
      const cacheKey = `${searchTerm.trim().toLowerCase()}-${limitNum}`;
      let result;
      if (!isLoadMore && searchCacheRef.current.has(cacheKey)) {
        const cachedResult = searchCacheRef.current.get(cacheKey);
        result = {
          list: cachedResult.suggestions,
          recentOrders: cachedResult.recommended,
        };
      } else {
        const apiResult = await makeApiCall(searchTerm.trim(), limitNum, 'search');
        result = {
          list: apiResult.list,
          recentOrders: apiResult.recentOrders,
        };
        searchCacheRef.current.set(cacheKey, {
          suggestions: apiResult.list,
          recommended: apiResult.recentOrders,
        });
      }

      if (result) {
        const suggestions = result.list.length > 0 ? result.list : [{ noResult: true }];
        setMobileSearchSuggestions(suggestions);
        setMobileSearchRecommended(result.recentOrders);

        if (result.list.length < limitNum) {
          setHasMoreSuggestions(false);
        } else {
          setHasMoreSuggestions(true);
        }
      }
    } catch (error) {
      if (!isLoadMore) {
        setMobileSearchSuggestions([{ noResult: true }]);
      }
      setHasMoreSuggestions(false);
    } finally {
      setMobileSearchLoading(false);
      setMobileSearchShowDots(false);
      setIsMoreLoading(false);
    }
  };

  const fetchRecentProducts = async () => {
    if (hasFetchedRecent) return;

    const result = await makeApiCall('recent', 10, 'recent');
    if (result) {
      setMobileSearchRecommended(result.recentOrders);
      setHasFetchedRecent(true);
    }
  };

  useEffect(() => {
    if (isOpen && !mobileSearchQuery) {
      setMobileSearchLoading(false);
      if (!hasFetchedRecent) {
        fetchRecentProducts();
      }
    }
  }, [isOpen, mobileSearchQuery, hasFetchedRecent]);

  useEffect(() => {
    if (mobileSearchDebounceTimerRef.current) {
      clearTimeout(mobileSearchDebounceTimerRef.current);
    }

    if (!mobileSearchQuery || mobileSearchQuery.trim().length === 0) {
      setMobileSearchSuggestions([]);
      setMobileSearchLoading(false);
      setMobileSearchShowDots(false);
      setSuggestionsLimit(10);
      setHasMoreSuggestions(true);
      return;
    }

    mobileSearchDebounceTimerRef.current = setTimeout(async () => {
      setSuggestionsLimit(10);
      fetchMobileSuggestions(mobileSearchQuery, 10, false);
    }, 300);

    return () => {
      if (mobileSearchDebounceTimerRef.current) {
        clearTimeout(mobileSearchDebounceTimerRef.current);
      }
    };
  }, [mobileSearchQuery]);

  useEffect(() => {
    return () => {
      if (mobileSearchDebounceTimerRef.current) {
        clearTimeout(mobileSearchDebounceTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";

      const handleEscape = (e) => {
        if (e.key === "Escape") {
          onClose();
        }
      };

      window.addEventListener("keydown", handleEscape);

      return () => {
        document.body.style.overflow = "";
        document.documentElement.style.overflow = "";
        window.removeEventListener("keydown", handleEscape);
      };
    }
  }, [isOpen, onClose]);

  // Voice 
  const startMobileVoiceRecognition = (skipPermissionCheck = false) => {
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
      setMobileSearchIsListening(true);
    } catch (error) { }

    recognition.onstart = () => {
      setMobileSearchIsListening(true);
    };

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setMobileSearchQuery(voiceText);
      setMobileSearchIsListening(false);
      addToMobileRecentSearches(voiceText);
    };

    recognition.onerror = (event) => {
      setMobileSearchIsListening(false);

      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied");
      } else if (event.error === "no-speech") {
        toast.error("No voice detected");
      } else {
        toast.error("Voice recognition failed");
      }
    };

    recognition.onend = () => {
      setMobileSearchIsListening(false);
    };
  };

  const handleMobileMicPermission = (granted, skipFuture) => {
    setShowMicPermission(false);
    if (granted) {
      if (skipFuture) {
        setSkipMicPermission(true);
        localStorage.setItem("medicompares_mic_permission", "granted");
      }
      setTimeout(() => {
        startMobileVoiceRecognition(true);
      }, 100);
    }
  };

  const addToMobileRecentSearches = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") return;

    const updated = [
      searchTerm,
      ...mobileSearchRecentSearches.filter((s) => s !== searchTerm),
    ].slice(0, 5);

    setMobileSearchRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const removeMobileRecentSearch = (searchTerm) => {
    const updated = mobileSearchRecentSearches.filter((s) => s !== searchTerm);
    setMobileSearchRecentSearches(updated);
    localStorage.setItem("recentSearches", JSON.stringify(updated));
  };

  const clearMobileRecentSearches = () => {
    setMobileSearchRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  const handleMobileRecentSearchClick = (searchTerm) => {
    setMobileSearchQuery(searchTerm);
    addToMobileRecentSearches(searchTerm);
    setMobileSearchShowSuggestions(true);
  };

  const handleMobileProductClick = (product) => {
    if (!product || typeof product !== "object") {
      toast.error("Invalid product data");
      return;
    }

    if (product.type === "package" && product.tablet?._id) {
      onClose();
      navigate(`/lab-package/${product.tablet._id}`);
      if (product.tablet.name) {
        window.setTimeout(() => addToMobileRecentSearches(product.tablet.name), 0);
      }
      return;
    }

    const navigation = getProductNavigation(product, {
      fallbackService: "medicine",
      pincode: getMedicinePincodeFromStorage(),
    });

    if (!navigation) {
      toast.error("Product details not available");
      return;
    }

    const tablet = resolveProductTablet(product);
    const productName = tablet?.name || "";
    onClose();
    navigate(navigation.url, { state: navigation.state });

    if (productName && typeof productName === "string") {
      window.setTimeout(() => addToMobileRecentSearches(productName), 0);
    }
  };

  const handleClose = () => {
    setMobileSearchQuery("");
    setMobileSearchSuggestions([]);
    onClose();
  };

  const highlightMatch = (text, query) => {
    if (!text) return "Unknown";
    const shortenedText = text.length > 45 ? text.slice(0, 45) + "..." : text;
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

  if (!isOpen) return null;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .search-barss {
            width: 100% !important;
            min-height: 48px !important;
            padding: 10px 14px !important;
          }
          .search-barss input {
            font-size: 16px !important;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
          }
          .shopping-scrolle {
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
          }
          .shopping-scrolle::-webkit-scrollbar {
            height: 4px;
          }
          .shopping-scrolle::-webkit-scrollbar-track {
            background: #f1f1f1;
            border-radius: 10px;
          }
          .shopping-scrolle::-webkit-scrollbar-thumb {
            background: #888;
            border-radius: 10px;
          }
        }
        @media (max-width: 480px) {
          .search-barss {
            padding: 8px 12px !important;
          }
          .search-barss input {
            font-size: 16px !important;
            padding-left: 36px !important;
          }
          .shopping-cardds {
            min-width: 120px !important;
            max-width: 120px !important;
          }
        }
      `}</style>
      <div
        className="lg:!hidden"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "#f5f6f7",
          zIndex: 10000,
          overflowY: mobileSearchQuery.trim() && mobileSearchSuggestions.length > 0 && !mobileSearchSuggestions[0].noResult ? "hidden" : "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        <div
          style={{
            position: "sticky",
            top: 0,
            backgroundColor: "#ffffff",
            padding: "10px 15px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            borderBottom: "1px solid #f1f1f1",
            zIndex: 10001,
          }}
        >
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "20px",
              cursor: "pointer",
              color: "#000",
              padding: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <i className="fa fa-arrow-left"></i>
          </button>
          <h5
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "#000",
              flex: 1,
            }}
          >
            Search
          </h5>
        </div>

        <div className="container py-3" style={{ backgroundColor: "#f5f6f7", maxWidth: "100%", paddingLeft: "15px", paddingRight: "15px" }}>
          <div className="relative w-full flex items-center mb-2" style={{ minHeight: "48px" }}>
            <i
              className="fa fa-search"
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#6b7280",
                fontSize: "16px",
                zIndex: 2,
                pointerEvents: "none",
                flexShrink: 0,
              }}
            />
            <input
              type="text"
              autoComplete="off"
              placeholder={placeholderTexts[placeholderIndex]}
              value={mobileSearchQuery}
              onChange={(e) => {
                setMobileSearchQuery(e.target.value);
                setMobileSearchShowSuggestions(true);
              }}
              onFocus={() => {
                setMobileSearchShowSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && mobileSearchQuery && mobileSearchQuery.trim().length > 0) {
                  e.preventDefault();
                  addToMobileRecentSearches(mobileSearchQuery.trim());
                  setMobileSearchShowSuggestions(true);
                }
              }}
              style={{
                paddingLeft: "42px",
                paddingRight: mobileSearchShowDots && mobileSearchLoading ? "80px" : "50px",
                width: "100%",
                height: "46px",
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
                backgroundColor: "#ffffff",
                fontSize: "15px",
                outline: "none",
                boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                color: "#1f2937",
              }}
            />

            {mobileSearchShowDots && mobileSearchLoading && (
              <div
                className="google-dots"
                style={{
                  position: "absolute",
                  right: "50px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  zIndex: 3,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span className="dott blue" />
                <span className="dott red" />
                <span className="dott yellow" />
                <span className="dott green" />
              </div>
            )}

            <i
              className="fa fa-microphone"
              onClick={startMobileVoiceRecognition}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                color: mobileSearchIsListening ? "#8059ca" : "#6b7280",
                transition: "color 0.2s ease",
                fontSize: "18px",
                zIndex: 4,
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "32px",
                height: "32px",
                minWidth: "32px",
                minHeight: "32px",
              }}
            />

            {/* Dropdown  */}
            {mobileSearchShowSuggestions && mobileSearchSuggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  marginTop: "8px",
                  background: "#ffffff",
                  borderRadius: "10px",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
                  zIndex: 999,
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {mobileSearchSuggestions
                  .filter(item => {
                    // Filter out invalid objects that could cause rendering errors
                    if (item.noResult) return true;
                    return typeof item === 'object' && item !== null && (item?.query || item?.tablet?.name);
                  })
                  .map((item, index) => (
                    <button
                      key={item._id || index}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!item.noResult) {
                          handleMobileProductClick(item);
                        }
                      }}
                      style={{
                        width: "100%",
                        padding: "12px 16px",
                        border: "none",
                        background: "transparent",
                        textAlign: "left",
                        cursor: "pointer",
                        fontSize: "14px",
                        color: "#111827",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        borderBottom:
                          index < mobileSearchSuggestions.length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                      }}
                    >
                      {!item.noResult ? (
                        <>
                          <div style={{ display: 'flex', justifyContent: "space-between", alignItems: "center", gap: "10px", width: "100%" }}>
                            <div style={{ display: 'flex', alignItems: "center", gap: "10px" }}>

                              <img
                                src={
                                  resolveImage(item?.tablet?.variant?.[0]) ||
                                  resolveImage(item?.tablet) ||
                                  "/assets/default.png"
                                }
                                alt={item?.tablet?.name}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "6px",
                                  objectFit: "contain",
                                  backgroundColor: "#f8f9fa",
                                  flexShrink: 0,
                                  textTransform: "capitalize",
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ flex: 1 }}>
                                  {highlightMatch(
                                    (typeof item?.query === 'string' ? item?.query :
                                      (typeof item?.tablet?.name === 'string' ? item?.tablet?.name : 'Unknown')),
                                    mobileSearchQuery
                                  )}
                                </span>


                                {item.tablet?.packagingDetails && (
                                  <span style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                                    {item?.tablet?.packagingDetails}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span style={{
                              fontSize: '10px',
                              color: '#666',
                              backgroundColor: '#f0f0f0',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              whiteSpace: 'nowrap',
                              marginLeft: '8px',
                              textTransform: "capitalize"
                            }}>
                              {item?.type === "package"
                                ? item?.type
                                : item?.tablet?.category?.fixedType === "medicine"
                                  ? (item?.tablet?.medicineType || "product")
                                  : (item?.tablet?.category?.name || "product")}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span
                          style={{
                            flex: 1,
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          No results found
                        </span>
                      )}
                    </button>
                  ))}
                {hasMoreSuggestions && mobileSearchSuggestions.length > 0 && !mobileSearchSuggestions[0].noResult && (
                  <button
                    type="button"
                    disabled={isMoreLoading}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const nextLimit = suggestionsLimit + 20;
                      setSuggestionsLimit(nextLimit);
                      fetchMobileSuggestions(mobileSearchQuery, nextLimit, true);
                    }}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "none",
                      background: "#f9fafb",
                      color: isMoreLoading ? "#9ca3af" : "#8059ca",
                      fontWeight: "600",
                      textAlign: "center",
                      cursor: isMoreLoading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      borderTop: "1px solid #f3f4f6",
                      transition: "background-color 0.2s",
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
            )}
          </div>

          {(!mobileSearchQuery || mobileSearchQuery.trim().length === 0) && mobileSearchRecommended.length > 0 && (
            <div className="mt-4 px-1">
              <h6 className="!text-[14px] !font-semibold text-gray-800 mb-3">Recommended for you</h6>
              <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin select-none">
                {mobileSearchRecommended
                  .filter(item => typeof item === 'object' && item !== null && item?.tablet)
                  .map((item, index) => {
                    const tablet = item?.tablet;
                    return (
                      <div
                        key={tablet?._id || index}
                        onClick={() => handleMobileProductClick(item)}
                        className="bg-white rounded-sm p-3 border border-gray-200 shadow-sm cursor-pointer min-w-[130px] max-w-[130px] flex-shrink-0 flex flex-col hover:border-[#8059ca] transition-all"
                      >
                        <div className="w-full h-20 bg-gray-50 rounded-lg flex items-center justify-center overflow-hidden mb-2">
                          <img
                            src={
                              resolveImage(tablet?.variant?.[0]) ||
                              resolveImage(tablet) ||
                              "/medicine.jpg"
                            }
                            alt={tablet?.name}
                            loading="lazy"
                            className="max-w-full max-h-full object-contain p-1"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/medicine.jpg";
                            }}
                          />
                        </div>
                        <p className="text-[12px] font-bold text-gray-800 truncate m-0 leading-tight">
                          {tablet?.name || "Unknown"}
                        </p>
                        <div className="text-[11px] font-bold text-[#8059ca] mt-1.5 flex items-center flex-wrap gap-1">
                          {item?.vendors && item?.vendors.length > 0 ? (
                            item?.vendors?.[0]?.discountprice ? (
                              <>
                                <span className="line-through text-gray-400 text-[9px]">
                                  ₹{item?.vendors?.[0]?.price}
                                </span>
                                <span>₹{item?.vendors?.[0]?.discountprice}</span>
                              </>
                            ) : (
                              item?.vendors?.[0]?.price ? `₹${item?.vendors?.[0]?.price}` : "Price on request"
                            )
                          ) : (
                            tablet?.variant?.[0]?.price || tablet?.price
                              ? `₹${(tablet?.variant?.[0]?.price || tablet?.price).toFixed(2)}`
                              : "Price on request"
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {(!mobileSearchQuery || mobileSearchQuery.trim().length === 0) &&
            mobileSearchRecentSearches.length > 0 && (
              <div className="mt-5 px-1">
                <div className="flex justify-between items-center mb-3">
                  <h6 className="!text-[14px] !font-semibold text-gray-800 m-0">
                    Recent Searches
                  </h6>
                  <button
                    type="button"
                    onClick={clearMobileRecentSearches}
                    className="!text-[11px] !font-semibold !text-red-500 hover:text-red-700 bg-red-55 hover:bg-red-100 rounded-full px-3 py-1 cursor-pointer transition-colors border-none"
                  >
                    Clear All
                  </button>
                </div>
                <div className="bg-white rounded-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
                  {mobileSearchRecentSearches
                    .filter(searchTerm => typeof searchTerm === 'string')
                    .map((searchTerm, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          onClick={() => handleMobileRecentSearchClick(searchTerm)}
                          className="flex-1 flex items-center gap-2 cursor-pointer text-[14px] text-gray-700 font-medium truncate"
                        >
                          <i className="fa-regular fa-clock text-gray-400 shrink-0 text-sm" />
                          <span className="truncate">{searchTerm}</span>
                        </div>
                        <button
                          onClick={() => removeMobileRecentSearch(searchTerm)}
                          className="text-gray-400 hover:text-gray-600 p-1 border-none bg-transparent cursor-pointer"
                        >
                          <i className="fa-solid fa-xmark text-sm shrink-0" />
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

          {mobileSearchQuery && mobileSearchQuery.trim().length > 0 && !mobileSearchLoading && mobileSearchSuggestions.length > 0 && mobileSearchSuggestions[0].noResult && (
            <div className="mt-4 text-center" style={{ padding: "40px 20px" }}>
              <p style={{ color: "#9ca3af", fontSize: "14px" }}>
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>

        {/* Microphone  */}
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
              alignItems: "flex-end",
              justifyContent: "center",
            }}
            onClick={() => setShowMicPermission(false)}
          >
            <div
              style={{
                backgroundColor: "#ffffff",
                width: "100%",
                maxWidth: "100%",
                borderTopLeftRadius: "20px",
                borderTopRightRadius: "20px",
                padding: "24px",
                maxHeight: "70vh",
                overflowY: "auto",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h2
                  style={{
                    fontSize: "22px",
                    fontWeight: "bold",
                    color: "#000",
                    margin: 0,
                    fontFamily: "serif",
                  }}
                >
                  Shop faster with voice
                </h2>
                <button
                  onClick={() => setShowMicPermission(false)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "24px",
                    cursor: "pointer",
                    color: "#000",
                    padding: "0",
                    width: "32px",
                    height: "32px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>

              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <i
                  className="fa fa-microphone"
                  style={{
                    fontSize: "64px",
                    color: "#0284c7",
                    marginBottom: "16px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    marginBottom: "16px",
                  }}
                >
                  <input
                    type="checkbox"
                    id="mic-skip-checkbox"
                    style={{ width: "20px", height: "20px", cursor: "pointer" }}
                  />
                  <span style={{ fontSize: "14px", color: "#374151" }}>
                    Allow this MediCompares app to access your microphone and skip this step in the future.
                  </span>
                </label>
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "8px" }}>
                  You can manage this access at any time in{" "}
                  <span style={{ color: "#0284c7", textDecoration: "underline", cursor: "pointer" }}>
                    permissions settings
                  </span>
                  .
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "12px" }}>
                  Your audio is transcribed in the cloud then automatically deleted. We store and use the transcripts as described in our{" "}
                  <span style={{ color: "#0284c7", textDecoration: "underline", cursor: "pointer" }}>
                    Privacy Notice
                  </span>
                  .
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  onClick={() => handleMobileMicPermission(false, false)}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    backgroundColor: "#ffffff",
                    color: "#000",
                    fontSize: "16px",
                    fontWeight: "500",
                    cursor: "pointer",
                  }}
                >
                  Not now
                </button>
                <button
                  onClick={() => {
                    const checkbox = document.getElementById("mic-skip-checkbox");
                    handleMobileMicPermission(true, checkbox?.checked || false);
                  }}
                  style={{
                    flex: 1,
                    padding: "14px",
                    border: "none",
                    borderRadius: "8px",
                    backgroundColor: "#8059ca",
                    color: "#000",
                    fontSize: "16px",
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

      </div>
    </>
  );
};

export default MobileSearchDropdown;

