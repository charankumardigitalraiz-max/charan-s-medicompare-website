import { Link, useNavigate, useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Slider from "react-slick";
import CategoryProvider from "../../components/ui/CategoryProvider.jsx";
import PageLoader from "../../components/ui/PageLoader.jsx";
import { SectionHeader } from "../../components/ui/index.js";
import Home2Header from "../../components/layout/Header-k";
import Footer from "../../components/layout/Footer-f";
import { useEffect, useState, useRef, useCallback, useMemo, useLayoutEffect, lazy, Suspense, memo, use } from "react";
import toast from "react-hot-toast";
import { axiosCommonInstance, imgUrl } from "../../Apiservice.jsx";
import { getImageUrl } from "../../utils/index";
import { useLocation as useLocationContext } from "../../context/LocationContext";
import VendorOffersModal from "../../components/ui/VendorOffersModal.jsx";
import LabTest from "../services/labtests.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import { useResponsive, useVoiceRecognition } from "../../hooks";
import ServiceCards from "../../components/ui/ServiceCards.jsx";
import DynamicCategorySections from "../../components/home/DynamicCategorySections.jsx";
import HomeProductScrollCarousel from "../../components/home/HomeProductScrollCarousel.jsx";
import {
  getHealthcareHeroBannerSettings,
  getHealthcareMedicalEquipmentSettings,
  getHealthcareMiddleBannerSettings,
  getHealthcareSuperSavingSettings,
  HealthcareNextArrow,
  HealthcarePrevArrow,
} from "../services/healthcareSliderSettings.jsx";
import { redirectToLoginWithPendingBooking } from "../../utils/pendingBookingUtils";
import { shouldUseHomeLiteMode } from "../../utils/devicePerformance";
import { prefetchImageUrls } from "../../utils/prefetchImages";
import {
  getMedicinePincodeFromStorage,
  getProductNavigation,
  resolveProductTablet
} from "../../utils/productUtils";
// import { fetchServerCart } from "../../context/CartContext.jsx"

const getSearchItemId = (item) => item?.tablet?._id || item?._id || null;

const ServiceCategoryCard = memo(({ cat, index, onClick }) => (
  <div className="w-1/3 sm:w-1/2 md:w-1/4 lg:w-1/6 xl:w-1/6 px-1.5 sm:px-2 mb-4 flex">
    <div
      className="group flex-1 cursor-pointer bg-white !border !border-[#e5e7eb] hover:!border-[#321961]/40 !shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:!shadow-[0_8px_20px_rgba(128,89,202,0.08)] !rounded-md w-full text-center p-4 max-sm:p-2.5 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-center items-center"
      onClick={() => onClick(cat)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onClick(cat);
      }}
    >
      <span className="w-[68px] h-[68px] max-sm:w-[48px] max-sm:h-[48px] rounded-full mx-auto mb-3 max-sm:mb-2 flex items-center justify-center bg-slate-50 border border-slate-100 transition-all duration-300 group-hover:scale-105">
        <img
          src={getImageUrl(cat?.files?.[0]) || "/assets/default.png"}
          alt={cat?.name || "Category"}
          title={cat?.name}
          className="h-[46px] w-[46px] max-sm:h-[32px] max-sm:w-[32px] object-contain transition-transform duration-[700ms] ease-in-out group-hover:[transform:rotateY(360deg)]"
          loading={index < 8 ? "eager" : "lazy"}
          fetchPriority={index < 4 ? "high" : "auto"}
          decoding="async"
        />
      </span>
      <h4 className="!font-semibold !text-[13px] max-sm:!text-[10px] !text-slate-700 group-hover:!text-[#321961] transition-colors duration-200 mb-0 line-clamp-2 text-center leading-snug max-sm:leading-tight">
        {cat?.name || "No Category"}
      </h4>
    </div>
  </div>
));


ServiceCategoryCard.displayName = "ServiceCategoryCard";

const safeLazy = (importFunc) => {
  return lazy(() =>
    importFunc().catch((error) => {
      console.error("Chunk load error caught in servicedetails.jsx, reloading...", error);
      window.location.reload();
      return new Promise(() => { });
    })
  );
};

const MedicinesModule = safeLazy(() => import("../services/MedicinesModule.jsx"));
const Surgeries = safeLazy(() => import("../services/surgeries.jsx"));
const AmbulanceService = safeLazy(() => import("../services/ambulanceservice.jsx"));
const Diagnostics = safeLazy(() => import("../services/diagnostics.jsx"));
const MedicalEquipment = safeLazy(() => import("../services/medicalequipment.jsx"));
const MedicalTreatMent = safeLazy(() => import("../services/medicaltreatment.jsx"));
const HomeCareServices = safeLazy(() => import("../services/homecareservices.jsx"));
const NursingCare = safeLazy(() => import("../services/nursingcare.jsx"));
const DentalTeeth = safeLazy(() => import("../services/DentalTeeth.jsx"));

const LabTestSection = (props) => {
  const [countdown, setCountdown] = useState({
    hours: 2,
    minutes: 30,
    seconds: 0,
  });

  useEffect(() => {
    if (!props.showDiscountPopup || props.fixedType !== "labtests") {
      return undefined;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        let { hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds -= 1;
        } else if (minutes > 0) {
          minutes -= 1;
          seconds = 59;
        } else if (hours > 0) {
          hours -= 1;
          minutes = 59;
          seconds = 59;
        } else {
          return { hours: 0, minutes: 0, seconds: 0 };
        }

        return { hours, minutes, seconds };
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [props.showDiscountPopup, props.fixedType]);

  return <LabTest {...props} countdown={countdown} />;
};

const HealthcareModuleFallback = () => (
  <div className="service-module-loading" aria-hidden="true" />
);

const ServiceDetails = () => {
  const { isMobile } = useResponsive();
  const navigate = useNavigate();
  const { service } = useParams();
  const { selectedPincode, latitude, longitude } = useLocationContext();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const [suggestionsLimit, setSuggestionsLimit] = useState(10);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [nursingOfferProducts, setnursingOfferProducts] = useState([]);
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [product, setproduct] = useState([]);
  const [myservice, setServices] = useState({});
  const [compareItems, setCompareItems] = useState([]);
  const [cheaplabtests, setcheaplabtests] = useState([]);
  const [medicalTreatments, setmedicalTreatments] = useState([]);
  const [newProducts, setnewProducts] = useState([]);
  const [topCategories, settopCategories] = useState([]);
  const [topCategoriesProducts, settopCategoriesProducts] = useState([]);
  const [topdoctors, settopdoctors] = useState([]);
  const [categoryvendor, setcategoryvendor] = useState([]);
  const { isListening, startListening } = useVoiceRecognition();
  const [vendorproducts, setvendorproducts] = useState([]);
  const [partners, setpartners] = useState([]);
  const [packages, setPackages] = useState([]);
  const [discountProducts, setdiscountProducts] = useState([]);
  const [popularProducts, setpopularProducts] = useState([]);
  const [trendingProducts, settrendingProducts] = useState([]);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [banners, setBanners] = useState([]);
  const [sections, setSections] = useState([]);
  const [showDiscountPopup, setShowDiscountPopup] = useState(true);
  const pageLiteMode = useMemo(() => shouldUseHomeLiteMode(), []);
  const searchInputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const latestSearchRef = useRef("");
  const [searchCache, setSearchCache] = useState(new Map());
  const [vendorModel, setVendorModel] = useState(null);
  const requestCacheRef = useRef(new Map());
  const serviceFetchIdRef = useRef(0);
  const [serviceDetails, setServicesDetails] = useState(null);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const makeApiCall = async (searchQuery, limitNum = 10, requestType = "search") => {
    try {
      const trimmedQuery =
        searchQuery.length > 50 ? searchQuery.substring(0, 50) : searchQuery;
      const response = await axiosCommonInstance.get(
        `all/search/product?search=${encodeURIComponent(trimmedQuery)}&page=1&limit=${limitNum}`,
      );

      const result = {
        list: response?.data?.data?.list || [],
        recentOrders: response?.data?.data?.recentOrders || [],
      };

      return result;
    } catch (error) {
      return { list: [], recentOrders: [] };
    }
  };

  const placeholderTexts = [
    "Search anything for... Medicines",
    "Search anything for... Surgeries",
    "Search anything for... Lab Tests",
    "Search anything for... Diagnostics",
    "Search anything for... Home Care Services",
    "Search anything for... Medical Equipment",
    "Search anything for... Nursing Care",
    "Search anything for... Medical Treatment",
    "Search anything for... Dental Service",
  ];

  // useEffect(() => {
  //   fetchServerCart();
  // }, []);

  useLayoutEffect(() => {
    if (pageLiteMode) {
      document.documentElement.classList.add("home-lite");
      document.documentElement.classList.add("service-details-lite");
    }

    return () => {
      document.documentElement.classList.remove("home-lite");
      document.documentElement.classList.remove("service-details-lite");
    };
  }, [pageLiteMode]);

  useEffect(() => {
    if (pageLiteMode) {
      AOS.init({ disable: true });
      return undefined;
    }

    AOS.init({
      duration: 800,
      once: true,
      mirror: false,
      offset: 80,
      throttleDelay: 99,
      debounceDelay: 50,
    });

    return undefined;
  }, [pageLiteMode]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % placeholderTexts.length;
      if (searchInputRef.current) {
        searchInputRef.current.placeholder = placeholderTexts[index];
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const swiperSettings = useMemo(
    () => ({
      modules: pageLiteMode ? [Navigation] : [Navigation, Autoplay],
      slidesPerView: isMobile ? 3 : 6,
      spaceBetween: isMobile ? 6 : 8,
      autoplay: pageLiteMode
        ? false
        : {
          delay: 5000,
          disableOnInteraction: false,
        },
      pagination: false,
      loop: !pageLiteMode && partners?.length > 1,
      observer: !pageLiteMode,
      observeParents: !pageLiteMode,
      watchSlidesProgress: !pageLiteMode,
      breakpoints: {
        1200: { slidesPerView: 6, spaceBetween: 16 },
        992: { slidesPerView: 4, spaceBetween: 16 },
        768: { slidesPerView: 4, spaceBetween: 12 },
        576: { slidesPerView: 4, spaceBetween: 8 },
      },
    }),
    [isMobile, pageLiteMode, partners?.length],
  );

  const STORAGE_KEY = "searchHistory";

  const loadSearchHistory = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const history = JSON.parse(saved);
        const validHistory = history.filter(
          (item) =>
            typeof item === "string" ||
            (typeof item === "object" &&
              item !== null &&
              (item.searchTerm || item._id)),
        );
        const limitedHistory = validHistory.slice(0, 10);
        setSearchHistory(limitedHistory);
        return limitedHistory;
      }
    } catch (error) { }
    return [];
  };

  const fetchSearchResults = useCallback(
    async (searchValue, limitNum = 10, isLoadMore = false) => {
      if (abortControllerRef.current && !isLoadMore) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      if (!isLoadMore) {
        abortControllerRef.current = abortController;
        setIsLoading(true);
      } else {
        setIsMoreLoading(true);
      }

      const cacheKey = `${searchValue.trim().toLowerCase()}-${limitNum}`;
      if (!isLoadMore && searchCache.has(cacheKey)) {
        const cachedResult = searchCache.get(cacheKey);
        setFilteredSuggestions(cachedResult.list);

        if (cachedResult.list.length < limitNum) {
          setHasMoreSuggestions(false);
        } else {
          setHasMoreSuggestions(true);
        }

        const variantsMap = {};
        cachedResult.list.forEach((item) => {
          variantsMap[getSearchItemId(item)] = item.selectedVariantId || null;
        });
        setSelectedVariants(variantsMap);
        setIsLoading(false);
        setIsMoreLoading(false);
        return;
      }

      const currentSearch = searchValue.trim();
      latestSearchRef.current = currentSearch;

      const result = await makeApiCall(currentSearch, limitNum, "search");

      if (latestSearchRef.current !== currentSearch) {
        return;
      }
      if (result) {
        setFilteredSuggestions(result.list);

        if (result.list.length < limitNum) {
          setHasMoreSuggestions(false);
        } else {
          setHasMoreSuggestions(true);
        }

        const variantsMap = {};
        result.list.forEach((item) => {
          variantsMap[getSearchItemId(item)] = item.selectedVariantId || null;
        });
        setSelectedVariants(variantsMap);

        const newCache = new Map(searchCache);
        newCache.set(cacheKey, result);
        setSearchCache(newCache);
      } else {
        if (!isLoadMore) {
          setFilteredSuggestions([]);
        }
        setHasMoreSuggestions(false);
      }

      setIsLoading(false);
      setIsMoreLoading(false);
    },
    [searchCache],
  );

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!value.trim()) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      setFilteredSuggestions([]);
      setSuggestionsLimit(10);
      setHasMoreSuggestions(true);
      setIsLoading(false);
      setIsMoreLoading(false);
      const history = loadSearchHistory();
      if (history.length > 0) {
        setSearchHistory(history);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
      return;
    }

    setShowSuggestions(true);
    setSuggestionsLimit(10);
    debounceTimerRef.current = setTimeout(() => {
      fetchSearchResults(value, 10, false);
    }, 300);
  };

  const saveToSearchHistory = (item) => {
    try {
      let history = loadSearchHistory();

      const historyEntry = {
        _id: getSearchItemId(item),
        searchTerm: item.tablet?.name || "Unknown",
        item: item,
      };

      history = history.filter((h) =>
        typeof h === "string" ? true : h._id !== getSearchItemId(item),
      );

      history.unshift(historyEntry);
      history = history.slice(0, 5);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) { }
  };

  const handleSelect = (item) => {
    if (!item) return;

    if (item.type === "package" && item.tablet?._id) {
      setShowSuggestions(false);
      setQuery(item.tablet?.name || "");
      window.setTimeout(() => saveToSearchHistory(item), 0);
      navigate(`/lab-package/${item.tablet._id}`);
      return;
    }

    setShowSuggestions(false);
    handleProductClick(item);
    setQuery(item?.tablet?.name || "");
    window.setTimeout(() => saveToSearchHistory(item), 0);
  };

  const handleHistorySelect = async (historyItem) => {
    if (typeof historyItem === "object" && historyItem.item) {
      handleProductClick(historyItem.item);
      setQuery(historyItem.searchTerm || "");
      setShowSuggestions(false);
      return;
    }
    if (
      typeof historyItem === "string" ||
      (historyItem && historyItem.searchTerm)
    ) {
      const searchTerm =
        typeof historyItem === "string"
          ? historyItem
          : historyItem.searchTerm || "";
      setQuery(searchTerm);
      setShowSuggestions(true);
      handleChange({ target: { value: searchTerm } });
    }
  };

  const startVoiceRecognition = () => {
    startListening((voiceText) => {
      setQuery(voiceText);
      handleChange({ target: { value: voiceText } });
    });
  };

  useEffect(() => {
    loadSearchHistory();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchWrapper = document.querySelector(".search-wrapper1");
      if (searchWrapper && !searchWrapper.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const getCategoryData = useCallback(async (fetchId) => {
    let apiUrl = `service/${service}`;

    if (selectedPincode) {
      apiUrl += `?location=${selectedPincode}`;
      if (latitude && longitude) {
        apiUrl += `&lat=${latitude}&lng=${longitude}`;
      }
    }

    const params = {
      type: "website",
      positiontype: "top,bottom,middle",
    };
    try {
      const [response, categoriesResponse] = await Promise.all([
        axiosCommonInstance.get(apiUrl, { params }),
        axiosCommonInstance.get(`allcategory/slug/${service}`, {
          params: {
            type: "website",
            positiontype: "top,bottom",
            page: 1,
            limit: 18,
          },
        }).catch((err) => {
          console.error("Failed to fetch from allcategory/slug API:", err);
          return null;
        }),
      ]);

      if (fetchId !== serviceFetchIdRef.current) return;

      const data = response.data?.data || {};
      const {
        service: servicdeDetails,
        category,
        products,
        vendors,
        vendor,
        cheaprice,
        topdoctors,
        categoryvendor,
        vendorproducts,
        discountproducts,
        trendingproducts,
        topratedproducts,
        topproducts,
        topcategory,
        topcategoryproducts,
        offerproducts,
        newproducts,
        package: packagesData,
        sections,
      } = response.data.data;
      const fetchedCategories = categoriesResponse?.data?.data?.allcategory || category || [];
      setCategories(fetchedCategories);
      if (fetchedCategories?.length) {
        prefetchImageUrls(
          fetchedCategories
            .slice(0, 12)
            .map((item) => getImageUrl(item?.files?.[0]))
            .filter(Boolean),
        );
      }
      setServicesDetails(servicdeDetails);
      setproduct(products);
      setpartners(vendors || vendor);
      settopdoctors(topdoctors);
      setcategoryvendor(categoryvendor);
      setvendorproducts(vendorproducts);
      setcheaplabtests(cheaprice);
      setnursingOfferProducts(offerproducts);
      setdiscountProducts(discountproducts);
      setpopularProducts(topratedproducts);
      settrendingProducts(trendingproducts);
      setmedicalTreatments(topproducts);
      setnewProducts(newproducts);
      settopCategories(topcategory);
      settopCategoriesProducts(topcategoryproducts);
      setServices(data.service);
      setPackages(packagesData || []);
      setSections(sections || []);


      localStorage.removeItem("fixedType");
      localStorage.setItem(
        "fixedType",
        data?.service?.fixedType || ""
      );

      if (data.banner && Array.isArray(data.banner)) {
        const allBanners = [];

        data.banner.forEach((b) => {
          if (b.banners && Array.isArray(b.banners)) {
            const bannerItems = b.banners.map((bn) => {
              const fileUrl =
                bn?.files && Array.isArray(bn.files) && bn.files.length > 0
                  ? getImageUrl(bn.files[0]) || "/assets/default.png"
                  : "/assets/default.png";

              return {
                src: fileUrl,
                alt: bn?.name || "Banner Image",
                position: b.position || "top",
              };
            });
            allBanners.push(...bannerItems);
          }
        });

        setBanners(allBanners);
      }

      sessionStorage.setItem("healthcarePageLoaded", "true");
      if (fetchId !== serviceFetchIdRef.current) return;
      setIsPageLoading(false);
    } catch (err) {
      if (fetchId !== serviceFetchIdRef.current) return;
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
      sessionStorage.setItem("healthcarePageLoaded", "true");
      setIsPageLoading(false);
    }
  }, [service, selectedPincode, latitude, longitude]);

  useEffect(() => {
    setIsPageLoading(true);
    const fetchId = ++serviceFetchIdRef.current;
    getCategoryData(fetchId);
  }, [getCategoryData]);

  const bottomBanners = banners.filter((b) => b.position === "bottom");
  const topBanners = banners.filter((b) => b.position === "top");
  const middleBanners = banners.filter((b) => b.position === "middle");

  useEffect(() => {
    const savedCompareItems = localStorage.getItem("compareItems");
    if (savedCompareItems) {
      try {
        const parsedItems = JSON.parse(savedCompareItems);
        setCompareItems(parsedItems);
      } catch (error) {
        toast.error(error);
      }
    }
  }, []);

  const handleCompareToggle = (pkg, isChecked) => {
    let updatedItems;

    if (isChecked) {
      if (compareItems.length >= 3) {
        toast.error("You can only compare up to 3 packages!");
        return;
      }
      updatedItems = [...compareItems, pkg._id];
    } else {
      updatedItems = compareItems.filter((item) => item !== pkg._id);
    }

    setCompareItems(updatedItems);
    localStorage.setItem("compareItems", JSON.stringify(updatedItems));
  };

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");
  const currentService = service;

  const clearAllCompare = () => {
    setCompareItems([]);
    localStorage.removeItem("compareItems");
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowSuggestions(false);
  };

  const deleteSearchHistoryItem = (index, historyItem) => {
    try {
      let history = loadSearchHistory();
      history = history.filter((item, i) => i !== index);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      setSearchHistory(history);

      if (history.length === 0) {
        setShowSuggestions(false);
      }
    } catch (error) { }
  };

  const settings = getHealthcareMiddleBannerSettings();
  const settings1 = getHealthcareHeroBannerSettings();
  const medicalEquipment = getHealthcareMedicalEquipmentSettings();
  const supersaving = getHealthcareSuperSavingSettings();

  const partnerSliderSettings = {
    dots: false,
    infinite: partners?.length > 8,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    slidesToShow: 8,
    slidesToScroll: 1,
    arrows: true,
    nextArrow: <HealthcareNextArrow />,
    prevArrow: <HealthcarePrevArrow />,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 8,
          infinite: partners?.length > 8,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 6,
          infinite: partners?.length > 6,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 4,
          infinite: partners?.length > 4,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 4,
          infinite: partners?.length > 4,
        }
      }
    ]
  };

  const PRIMARY_COLOR = "#321961";
  const PRIMARY_SECTION_BG = "#f8f4ff";

  const displayCategories = useMemo(
    () => (categories?.length ? categories.slice(0, 18) : []),
    [categories],
  );

  const buildBookPayload = (item, bookingType = "normal") => {
    if (bookingType === "package") {
      return [
        {
          productId: null,
          variantId: null,
          vendorId: item.vendor?._id || item.vendorId,
          packageId: item._id,
          type: "package",
          bookingType: "buy_now",
        },
      ];
    }

    return [
      {
        productId: item.name,
        variantId: null,
        vendorId: item.vendor?._id || item.vendorId,
        packageId: item._id,
        type: "normal",
        bookingType: "buy_now",
      },
    ];
  };

  const handleBook = async (item, bookingType = "normal") => {
    const payload = buildBookPayload(item, bookingType);
    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      toast.error("Please login to book service");
      redirectToLoginWithPendingBooking(navigate, payload);
      return;
    }

    try {
      const response = await axiosCommonInstance.post(
        "cart/buynow/create",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;
      navigate("/booking-process", { state: { bookingData: result } });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        redirectToLoginWithPendingBooking(navigate, payload);
      } else {
        toast.error("Something went wrong while creating booking.");
      }
    }
  };

  const handleCompareBar = async () => {
    try {
      const response = await axiosCommonInstance.post(
        "compare/list",
        { id: compareItems },
        { headers: { "content-type": "application/json" } },
      );

      if (response?.data?.list || response?.data?.data) {
        const dataToPass = response.data.list || response.data.data;
        navigate("/package-view", {
          state: {
            compareData: dataToPass,
            packageIds: compareItems,
          },
        });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch comparison data",
      );
    }
  };

  const handleCategoryClick = useCallback(
    (item) => {
      sessionStorage.setItem("activeCategoryLoader", JSON.stringify({
        name: item.name,
        fixedType: item.fixedType || item.slug || "",
        colorcode: item.colorcode || ""
      }));
      navigate(`/${service}/all?maincategories=${item.slug}`);
    },
    [navigate, service],
  );

  const handleProductClick = useCallback((product) => {
    const navigation = getProductNavigation(product, {
      fallbackService: service || "medicine",
      pincode: getMedicinePincodeFromStorage(),
    });

    if (!navigation) {
      toast.error("Product details not available");
      return;
    }

    navigate(navigation.url, { state: navigation.state });
  }, [navigate, service]);




  const dynamicSectionClick = useCallback((product) => {
    const tablet = resolveProductTablet(product)
    const productSlug = tablet.slug || tablet._id || tablet.id;
    if (!productSlug) return null;

    const subcategoryData = tablet.subcategorys || tablet.subcategoryDetails;
    const categoryData =
      subcategoryData?.category ||
      subcategoryData?.categoryDetails ||
      tablet.category;

    const fixedType = categoryData?.fixedType;
    const serviceSlug = service || "medicine";

    const categories =
      subcategoryData?.slug ||
      (subcategoryData?.name
        ? subcategoryData.name.toLowerCase().replace(/\s+/g, "-")
        : null)

    if (!navigation) {
      toast.error("Product details not available");
      return;
    }

    const productnavigation = `${categories}/${productSlug}`
    console.log(productnavigation, "productnavigation")
    navigate(productnavigation);
  })

  const handleAddToCart = async (pkg) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("No token found. Please login again.");
        navigate("/login");
        return;
      }
      const vendorId = pkg.vendor?._id || pkg.vendorId || null;

      if (!vendorId) {
      }

      const payload = [
        {
          productId: null,
          variantId: null,
          vendorId,
          packageId: pkg._id,
          type: "package",
        },
      ];

      const response = await axiosCommonInstance.post("cart/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const result = response.data;
      navigate("/cart");
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Something went wrong while creating booking.");
      }
    }
  };

  const handlePartnerClick = (partner) => {
    const vendorId = partner?.bussinessdetails?.vendorId || partner?._id || partner?.businessdetails?.vendorId;
    console.log("partner", partner)
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);

      const name =
        partner?.bussinessdetails?.name || partner?.name ||
        `${partner?.firstName || ""} ${partner?.lastName || ""}` ||
        "Vendor Store";

      const vendorSlug = name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      // console.log("vendorSlug", vendorSlug)
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  const handleCompareClick = (item, section) => {
    const tablet =
      item?.tabletdetails || item?.tabletDetails || item?.tablet || item;

    const productSlug = tablet?.slug;
    if (!productSlug) {
      toast.error("Product not available");
      return;
    }

    let sub =
      tablet?.subcatdetails ||
      tablet?.subcategorydetails ||
      tablet?.subcategoryDetails ||
      tablet?.subcategorys;

    if (Array.isArray(sub)) sub = sub[0];

    const service =
      section?.serviceId?.slug ||
      sub?.categoryDetails?.slug ||
      sub?.category?.slug ||
      currentService ||
      "medicine";

    const subcategory = sub?.slug || "general";

    navigate(`/${service}/${subcategory}/${productSlug}/compare`);
  };

  const handleVendorClick = (vendor) => {
    // console.log("partner", vendor)
    handlePartnerClick(vendor);
  };


  const highlightMatch = (text, query) => {
    if (!text) return "Unknown";
    if (!query || typeof query !== "string") return text;

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));
    return (
      <>
        {parts.map((part, index) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={index} className="font-normal">
              {part}
            </span>
          ) : (
            <strong key={index} className="font-semibold">
              {part}
            </strong>
          ),
        )}
      </>
    );
  };

  if (isPageLoading) {
    return <PageLoader />;
  }

  return (
    <div className="service-details-page">
      <Home2Header />
      <CategoryProvider />

      {myservice.fixedType !== "ambulanceservice" && (
        <section
          style={{
            background: PRIMARY_SECTION_BG,
          }}
          className={`hidden lg:block search-section1${showSuggestions ? " is-search-open" : ""} py-[30px] px-0 relative mt-0 overflow-visible ${showSuggestions ? "z-25" : "z-[1]"}`}
        >
          <div
            className="w-full px-3 md:px-4 relative z-[1] max-w-[850px] mx-auto"
          >
            <div className="flex flex-wrap">
              <div className="w-full">
                <div
                  className="relative z-[1] max-w-[850px]"
                >
                  <div className="flex flex-wrap">
                    <div className="w-full mt-3">
                      <div
                        ref={searchContainerRef}
                        className={`search-wrapper1 mx-auto relative ${showSuggestions ? "z-30" : "z-[2]"}`}
                      >
                        <form onSubmit={(e) => e.preventDefault()}>
                          <div
                            className={`bg-white rounded-[30px] border-[1.5px] border-solid border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-300 ease-in-out overflow-hidden relative ${isMobile ? "hidden" : "flex"} items-center p-[8px] gap-[8px]`}
                          >
                            <div
                              className="flex items-center justify-center w-[25px] h-[25px] text-[#9ca3af] shrink-0"
                            >
                              <i
                                className="fas fa-search text-[14px]"
                              ></i>
                            </div>

                            <input
                              ref={searchInputRef}
                              type="text"
                              className="search-input border-none outline-none flex-1 text-[clamp(14px,2vw,16px)] p-0 text-[#111827] bg-transparent font-inherit font-normal min-w-0"
                              placeholder={placeholderTexts[0]}
                              value={query}
                              onChange={handleChange}
                              onFocus={() => {
                                if (!query.trim() && searchHistory.length > 0) {
                                  setShowSuggestions(true);
                                } else if (query) {
                                  setShowSuggestions(true);
                                }
                              }}
                            />

                            {isLoading && (
                              <div
                                className="google-dots"
                                style={{
                                  position: "absolute",
                                  right: "75px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                }}
                              >
                                <span className="dott blue" />
                                <span className="dott red" />
                                <span className="dott yellow" />
                                <span className="dott green" />
                              </div>
                            )}

                            <button
                              type="button"
                              title="Upload prescription"
                              onClick={() => navigate("/prescription-upload", { state: { mode: "search", pincode: selectedPincode, lat: latitude, lng: longitude } })}
                              className="!flex !items-center !justify-center !w-[30px] !h-[30px] !rounded-full !bg-violet-50 !text-violet-600 !border !border-solid !border-violet-100/80 !cursor-pointer !transition-all !duration-300 !ease-in-out !shrink-0 hover:!bg-violet-600 hover:!text-white hover:!border-violet-600 hover:!scale-110 active:!scale-90 hover:!shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
                            >
                              <i className="fas fa-file-prescription text-[13px]"></i>
                            </button>

                            <button
                              type="button"
                              title="Voice search"
                              onClick={startVoiceRecognition}
                              className={`!flex !items-center !justify-center !w-[30px] !h-[30px] !rounded-full !border !border-solid !transition-all !duration-300 !ease-in-out !cursor-pointer active:!scale-90 ${
                                isListening
                                  ? "!bg-gradient-to-r !from-rose-500 !to-red-600 !text-white !border-rose-500 !shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:!scale-110 hover:!shadow-[0_0_16px_rgba(244,63,94,0.7)]"
                                  : "!bg-blue-50 !text-blue-600 !border-blue-100/80 hover:!bg-blue-600 hover:!text-white hover:!border-blue-600 hover:!scale-110 hover:!shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                              }`}
                            >
                              <svg
                                width={14}
                                height={14}
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                                className={`${isListening ? "animate-pulse" : ""}`}
                              >
                                <path
                                  d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M19 10V12C19 15.87 15.87 19 12 19C8.13 19 5 15.87 5 12V10"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M12 19V23"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                                <path
                                  d="M8 23H16"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          </div>

                          {(isLoading ||
                            (showSuggestions &&
                              (filteredSuggestions.length > 0 ||
                                (!query.trim() &&
                                  searchHistory.length > 0)))) && (
                              <div
                                className={`absolute top-full left-0 right-0 mt-0 bg-white rounded-[10px] border-[1.5px] border-solid border-[#e5e7eb] shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)] z-[999999] max-h-[400px] overflow-y-auto overflow-x-hidden ${pageLiteMode ? "animate-none" : "animate-[fadeInUp_0.2s_ease-out]"}`}
                              >
                                {isLoading && (
                                  <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-slate-400">
                                    <i className="fas fa-circle-notch fa-spin text-2xl text-[#321961]"></i>
                                    <span className="text-xs font-medium text-slate-500">Searching for medicines & services...</span>
                                  </div>
                                )}
                                {!isLoading &&
                                  !query.trim() &&
                                  searchHistory.length > 0 && (
                                    <>
                                      <div
                                        className="py-[10px] px-[15px] text-[12px] border-b border-solid border-[#f3f4f6] bg-[#f9fafb] flex justify-between items-center"
                                      >
                                        <span>Recent Search History</span>
                                        <button
                                          type="button"
                                          onClick={clearSearchHistory}
                                          className="service-suggestion-clear bg-none border-none text-[#ef4444] text-[11px] cursor-pointer py-[4px] px-[8px] rounded-[4px]"
                                        >
                                          Clear All
                                        </button>
                                      </div>
                                      {searchHistory.map((historyItem, index) => (
                                        <button
                                          key={
                                            typeof historyItem === "object" &&
                                              historyItem._id
                                              ? `history-${historyItem._id}`
                                              : `history-${index}`
                                          }
                                          onClick={() =>
                                            handleHistorySelect(historyItem)
                                          }
                                          className="service-suggestion-item"
                                          style={{
                                            width: "100%",
                                            padding: "10px 15px",
                                            border: "none",
                                            background: "transparent",
                                            textAlign: "left",
                                            cursor: "pointer",
                                            fontSize: "15px",
                                            color: "#111827",
                                            display: "flex",
                                            zIndex: "9999999",
                                            alignItems: "center",
                                            gap: "14px",
                                            borderBottom:
                                              index < searchHistory.length - 1
                                                ? "1px solid #f3f4f6"
                                                : "none",
                                            position: "relative",
                                          }}
                                        >
                                          <img
                                            src={getImageUrl(
                                              historyItem?.item?.tablet?.imageUrl
                                                ?.length > 0
                                                ? historyItem.item.tablet
                                                  .imageUrl[0]
                                                : historyItem?.item?.tablet?.files
                                                  ?.length > 0
                                                  ? historyItem.item.tablet
                                                    .files[0]
                                                  : historyItem?.item?.imageUrl
                                                    ?.length > 0
                                                    ? historyItem.item.imageUrl[0]
                                                    : historyItem?.item?.files
                                                      ?.length > 0
                                                      ? historyItem.item.files[0]
                                                      : historyItem?.tablet
                                                        ?.imageUrl?.length > 0
                                                        ? historyItem.tablet
                                                          .imageUrl[0]
                                                        : historyItem?.tablet
                                                          ?.files?.length > 0
                                                          ? historyItem.tablet
                                                            .files[0]
                                                          : "/assets/default.png",
                                            )}
                                            alt="image"
                                            className="w-[40px] h-[40px] rounded-[6px] object-contain bg-[#f8f9fa] shrink-0"
                                            onError={(e) => {
                                              e.target.src =
                                                "/assets/default.png";
                                            }}
                                          />
                                          <span
                                            className="flex-1 leading-[1.5]"
                                          >
                                            {typeof historyItem === "string"
                                              ? historyItem
                                              : historyItem.searchTerm ||
                                              historyItem}
                                          </span>
                                          {typeof historyItem === "object" &&
                                            (historyItem?.item?.tablet
                                              ?.medicineType ||
                                              historyItem?.item?.tablet?.type ||
                                              historyItem?.tablet?.medicineType ||
                                              historyItem?.tablet?.type) && (
                                              <span
                                                className="ms-auto badge rounded-pill bg-primary text-[11px] mr-[8px]"
                                              >
                                                {historyItem?.item?.tablet
                                                  ?.medicineType ||
                                                  historyItem?.item?.tablet
                                                    ?.type ||
                                                  historyItem?.tablet
                                                    ?.medicineType ||
                                                  historyItem?.tablet?.type}
                                              </span>
                                            )}
                                          <div
                                            role="button"
                                            tabIndex={0}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              deleteSearchHistoryItem(
                                                index,
                                                historyItem,
                                              );
                                            }}
                                            onKeyDown={(e) => {
                                              if (
                                                e.key === "Enter" ||
                                                e.key === " "
                                              ) {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                deleteSearchHistoryItem(
                                                  index,
                                                  historyItem,
                                                );
                                              }
                                            }}
                                            className="service-suggestion-clear bg-none border-none text-[#ef4444] text-[14px] cursor-pointer p-[4px] rounded-[4px] flex items-center justify-center w-[24px] h-[24px] shrink-0"
                                            title="Delete this search"
                                          >
                                            <i className="fas fa-times"></i>
                                          </div>
                                        </button>
                                      ))}
                                    </>
                                  )}

                                {!isLoading &&
                                  query.trim() &&
                                  filteredSuggestions.map((item, index) => (
                                    <div
                                      key={getSearchItemId(item) || `search-${index}`}
                                      onClick={() => handleSelect(item)}
                                      className={`w-full p-[10px] border-none bg-transparent text-left cursor-pointer text-[15px] text-[#111827] flex z-[9999999] items-center gap-[14px] transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] relative ${index < filteredSuggestions.length - 1 ? "border-b border-solid border-[#f3f4f6]" : "border-b-0"}`}
                                    >
                                      <div
                                        className="text-[#9ca3af] shrink-0"
                                      >
                                        <i className="fas fa-search"></i>
                                      </div>
                                      <span
                                        className="flex-1 leading-[1.5] capitalize"
                                      >
                                        {highlightMatch(
                                          item.tablet?.name,
                                          query,
                                        )}
                                      </span>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span
                                        className="text-[10px] text-[#666] bg-[#f0f0f0] py-[2px] px-[8px] rounded-[12px] whitespace-nowrap ml-[8px] capitalize"
                                      >
                                        {item?.type === "package"
                                          ? item?.type
                                          : item?.tablet?.category?.fixedType === "medicine"
                                            ? (item?.tablet?.medicineType || "product")
                                            : (item?.tablet?.category?.name || "product")}
                                      </span> <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); setVendorModel(item); }} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', color: 'var(--color-primary)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', width: '24px', height: '24px', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }} onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--color-primary)'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.transform = 'scale(1.08)'; }} onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = 'var(--color-primary)'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; }} title="Insert into search"><i className="fa fa-plus" style={{ fontSize: '11px' }} /></button></div>
                                    </div>
                                  ))}
                                {!isLoading && query.trim() && hasMoreSuggestions && filteredSuggestions.length > 0 && (
                                  <button
                                    type="button"
                                    disabled={isMoreLoading}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const nextLimit = suggestionsLimit + 20;
                                      setSuggestionsLimit(nextLimit);
                                      fetchSearchResults(query, nextLimit, true);
                                    }}
                                    className={`w-full p-[10px] border-none font-semibold text-center text-[13px] border-t border-solid border-[#f3f4f6] transition-colors duration-200 ${isMoreLoading ? "text-[#9ca3af] cursor-not-allowed bg-[#f9fafb]" : "text-[#321961] cursor-pointer bg-[#f9fafb] hover:bg-[#f1f5f9]"}`}
                                  >
                                    {isMoreLoading ? "Loading..." : "Load More"}
                                  </button>
                                )}
                              </div>
                            )}
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {myservice.fixedType !== "ambulanceservice" && (
        <div
          className={`relative overflow-visible ${showSuggestions ? "z-[1]" : "z-[5]"} mt-0`}
          style={{
            backgroundColor: PRIMARY_SECTION_BG,
            contain: "none",
          }}
        >
          <ServiceCards serviceType={myservice?.fixedType} liteMode={pageLiteMode} />
        </div>
      )}

      {topBanners.length > 0 && (
        <section className="relative pt-[30px] xl:!pt-[20px] px-2 mb-4 md:!mb-3">
          <div className="w-full mt-0">
            {topBanners.length > 1 ? (
              <div className="relative banner-slider-wrap">
                <style>{`
                  .banner-slider-wrap .slick-dots {
                    position: absolute !important;
                    bottom: 8px !important;
                    left: 0 !important;
                    right: 0 !important;
                    margin: 0 !important;
                    padding: 0 4px !important;
                    z-index: 10 !important;
                  }
                  .banner-slider-wrap .slick-dots li button:before {
                    color: #fff !important;
                    opacity: 0.7 !important;
                    font-size: 8px !important;
                  }
                  .banner-slider-wrap .slick-dots li.slick-active button:before {
                    color: #fff !important;
                    opacity: 1 !important;
                  }
                `}</style>
                <Slider {...settings1}>
                  {topBanners.map((image, index) => (
                    <div key={index} className="w-full flex">
                      <img
                        src={image.src}
                        alt={image.alt}
                        title={image.alt}
                        loading="lazy"
                        className="!w-full !rounded-[10px] !aspect-[5.5/1] !object-cover !block px-1"
                      />
                    </div>
                  ))}
                </Slider>
              </div>
            ) : (
              <div className="w-full flex">
                <img
                  src={topBanners[0].src}
                  alt={topBanners[0].alt}
                  title={topBanners[0].alt}
                  loading="lazy"
                  className="!w-full !rounded-[10px] !aspect-[5.5/1] !object-cover !block px-1"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {myservice.fixedType !== "ambulanceservice" && (
        <section className="py-3" style={{ backgroundColor: PRIMARY_SECTION_BG }}>
          <div className="w-full px-4">
            <div className="flex items-center justify-between flex-wrap result-wrap gap-3 mb-4">
              <h3 className="mb-2 top-vendor-badge">
                <i className="fas fa-bolt mx-1"></i>
                {service
                  ?.replace(/-/g, " ")
                  .replace(/\b\w/g, (c) => c.toUpperCase())}
              </h3>

              <div className="flex items-center flex-wrap gap-3">
                <Link
                  to={`/view-all-categories/${service}`}
                  className={`!bg-primary !text-white !font-semibold flex items-center justify-center transition-all duration-300 ${isMobile ? "!p-0 !flex rounded-full text-[10px] w-[36px] h-[36px] shrink-0 grow-0 self-center" : "py-[6px] px-[15px] rounded-[50px] text-[14px] w-auto h-auto"}`}
                >
                  {isMobile ? "" : "View All"}
                  <i className={isMobile ? "isax isax-arrow-right-1" : "isax isax-arrow-right-1 ml-1"}></i>
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap justify-center mt-3">
              {displayCategories.length > 0 ? (
                displayCategories.slice(0, 12).map((cat, index) => (
                  <ServiceCategoryCard
                    key={cat._id || index}
                    cat={cat}
                    index={index}
                    onClick={handleCategoryClick}
                  />
                ))
              ) : (
                <div className="w-full text-center py-5">
                  <h5>No Data Available</h5>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {!["medicine", "labtests", "ambulanceservice"].includes(
        myservice.fixedType,
      ) &&
        sections &&
        sections.length > 0 && (
          <DynamicCategorySections
            sections={sections}
            onProductClick={dynamicSectionClick}
            onCompareClick={handleCompareClick}
            onVendorClick={handleVendorClick}
            imgUrl={imgUrl}
            sliderSettings={supersaving}
            liteMode={pageLiteMode}
            isMobile={isMobile}
            currentService={myservice.fixedType}
          />
        )}

      {myservice.fixedType == "medicine" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <MedicinesModule
            discountProducts={discountProducts}
            handleProductClick={dynamicSectionClick}
            popularProducts={popularProducts}
            trendingProducts={trendingProducts}
            handlePartnerClick={handlePartnerClick}
            imgUrl={imgUrl}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
            settings={settings}
            supersaving={supersaving}
            service={service}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
          />
        </Suspense>
      )}

      {myservice.fixedType == "surgeries" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <Surgeries
            imgUrl={imgUrl}
            topdoctors={topdoctors}
            categoryvendor={categoryvendor}
            vendorproducts={vendorproducts}
            handleProductClick={dynamicSectionClick}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
          />
        </Suspense>
      )}

      {myservice.fixedType == "labtests" && (
        <LabTestSection
          fixedType={myservice.fixedType}
          product={product}
          packages={packages}
          compareItems={compareItems}
          handleCompareToggle={handleCompareToggle}
          handleBook={handleBook}
          currentService={currentService}
          handleAddToCart={handleAddToCart}
          imgUrl={imgUrl}
          service={service}
          setShowDiscountPopup={setShowDiscountPopup}
          handleCompareBar={handleCompareBar}
          clearAllCompare={clearAllCompare}
          cheaplabtests={cheaplabtests}
          showDiscountPopup={showDiscountPopup}
          handleProductClick={dynamicSectionClick}
          handleVendorClick={handleVendorClick}
          handleCompareClick={handleCompareClick}
          middleBanners={middleBanners}
          bottomBanners={bottomBanners}
          settings={settings}
          sections={sections}
          serviceDetails={serviceDetails}
        />
      )}

      {myservice.fixedType == "diagnostics" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <Diagnostics
            product={product}
            packages={packages}
            compareItems={compareItems}
            handleCompareToggle={handleCompareToggle}
            handleBook={handleBook}
            handleAddToCart={handleAddToCart}
            currentService={currentService}
            imgUrl={imgUrl}
            service={service}
            handleCompareBar={handleCompareBar}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
            settings={settings}
            clearAllCompare={clearAllCompare}
            cheaplabtests={cheaplabtests}
            handleProductClick={dynamicSectionClick}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
          />
        </Suspense>
      )}

      {myservice.fixedType == "dentalservice" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <DentalTeeth
            imgUrl={imgUrl}
            handleBook={handleBook}
            cheaplabtests={cheaplabtests}
            topdoctors={topdoctors}
            currentService={currentService}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
            service={service}
            settings={settings}
            handleProductClick={dynamicSectionClick}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
          />
        </Suspense>
      )}

      {myservice.fixedType == "nursingcare" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <NursingCare
            imgUrl={imgUrl}
            handleBook={handleBook}
            medicalTreatments={medicalTreatments}
            currentService={currentService}
            nursingOfferProducts={nursingOfferProducts}
            handleProductClick={dynamicSectionClick}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
            service={service}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
          />
        </Suspense>
      )}

      {myservice.fixedType == "homecare" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <HomeCareServices
            medicalTreatments={medicalTreatments}
            imgUrl={imgUrl}
            handleProductClick={dynamicSectionClick}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
            currentService={currentService}
            service={service}
            settings={settings}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
          />
        </Suspense>
      )}

      {myservice.fixedType == "medicalequipment" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <MedicalEquipment
            medicalEquipment={medicalEquipment}
            topCategories={topCategories}
            topCategoriesProducts={topCategoriesProducts}
            newProducts={newProducts}
            trendingProducts={trendingProducts}
            settopCategoriesProducts={settopCategoriesProducts}
            handleProductClick={dynamicSectionClick}
            imgUrl={imgUrl}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
          />
        </Suspense>
      )}

      {myservice.fixedType == "medicaltreatment" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <MedicalTreatMent
            handleBook={handleBook}
            imgUrl={imgUrl}
            topdoctors={topdoctors}
            currentService={currentService}
            service={service}
            medicalTreatments={medicalTreatments}
            handleProductClick={dynamicSectionClick}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
            handleVendorClick={handleVendorClick}
            handleCompareClick={handleCompareClick}
            sections={sections}
          />
        </Suspense>
      )}

      {myservice.fixedType == "ambulanceservice" && (
        <Suspense fallback={<HealthcareModuleFallback />}>
          <AmbulanceService
            imgUrl={imgUrl}
            categories={product}
            categories1={medicalTreatments}
            medicalTreatments={medicalTreatments}
            handleProductClick={dynamicSectionClick}
            middleBanners={middleBanners}
            bottomBanners={bottomBanners}
            isMobile={isMobile}
            selectedPincode={selectedPincode}
            latitude={latitude}
            longitude={longitude}
            hasTopBanner={topBanners.length > 0}
          />
        </Suspense>
      )}

      {myservice.fixedType == "medicine" && sections && sections.length > 0 && (
        <DynamicCategorySections
          sections={sections}
          onProductClick={dynamicSectionClick}
          onCompareClick={handleCompareClick}
          onVendorClick={handleVendorClick}
          imgUrl={imgUrl}
          sliderSettings={supersaving}
          liteMode={pageLiteMode}
          isMobile={isMobile}
          currentService={service}
        />
      )}

      {partners && partners.length > 0 && (
        <section
          className="w-full px-3 py-3 my-3 rounded-[12px] border border-[rgba(128,89,202,0.12)]"
          style={{
            background: "linear-gradient(135deg, rgba(243,232,255,0.85) 0%, rgba(237,233,254,0.9) 100%)",
            boxShadow: "0 8px 24px -8px rgba(147,51,234,0.1)",
          }}
        >
          <div>
            <SectionHeader
              title={`Trusted Partners${isMobile ? "" : ` (${partners.length})`}`}
              icon="fas fa-bolt"
              viewAllLink={`/partners/${service}`}
              viewAllText="View All"
            />

            <div
              className={`pb-1 mt-2 relative ${isMobile ? "py-[10px] px-[5px]" : "py-[10px] px-[20px]"}`}
              style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
            >
              <div className="!p-0 !-mx-2 !mb-0 max-sm:!pt-[5px] max-sm:!pb-[20px] max-sm:!px-0">
                <Slider {...partnerSliderSettings}>
                  {partners.map((partner, index) => {
                    const businessImage =
                      partner?.businessdetails?.bussiness_image?.[0]?.url;
                    const businessName = partner?.businessdetails?.name;

                    return (
                      <div key={partner._id || index} className="px-2">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => handlePartnerClick(partner)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              handlePartnerClick(partner);
                            }
                          }}
                          className={
                            isMobile
                              ? "cursor-pointer bg-white rounded-full w-[80px] h-[80px] p-[10px] flex flex-col justify-center items-center overflow-hidden border border-[#eef0f6] shadow-[0_4px_10px_rgba(0,0,0,0.04)] transition-all duration-200"
                              : "cursor-pointer bg-white rounded-[12px] p-3 flex flex-col justify-start items-center overflow-hidden border border-[#eef0f6] shadow-[0_4px_10px_rgba(0,0,0,0.04)] h-[170px] w-full transition-all duration-200 hover:shadow-[0_8px_20px_rgba(128,89,202,0.12)] hover:-translate-y-[2px]"
                          }
                        >
                          {!isMobile ? (
                            <>
                              <div className="w-full h-[100px] rounded-[8px] bg-[#faf9fe] overflow-hidden flex items-center justify-center p-[6px] mb-[10px]">
                                <img
                                  src={businessImage ? getImageUrl(businessImage) : "/assets/default.png"}
                                  alt={businessName || partner.name}
                                  loading="lazy"
                                  decoding="async"
                                  className="max-w-full max-h-full object-contain"
                                />
                              </div>
                              <h6 className="mb-0 !text-[13px] !font-semibold text-[#222] text-center leading-[1.4] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                                {businessName || "N/A"}
                              </h6>
                            </>
                          ) : (
                            <img
                              src={businessImage ? getImageUrl(businessImage) : "/assets/default.png"}
                              alt={businessName || partner.name}
                              loading="lazy"
                              decoding="async"
                              className="max-w-full max-h-full object-contain"
                            />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </Slider>
              </div>
            </div>
          </div>
        </section>
      )}

      {bottomBanners.length > 0 && (
        <section className="feedback-section-fifteen px-2 mb-5">

          <div className="w-full mt-0">
            {bottomBanners.length > 1 ? (
              <Slider {...settings1}>
                {bottomBanners.map((image, index) => (
                  <div key={index} className="lg:w-[33.333%] md:w-[50%] flex">
                    <img
                      src={image.src}
                      alt={image.alt}
                      title={image.alt}
                      loading="lazy"
                      className="px-1 banner-image rounded-[10px] aspect-[5.5/1] object-cover"
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="lg:w-full flex">
                <img
                  src={bottomBanners[0].src}
                  alt={bottomBanners[0].alt}
                  title={bottomBanners[0].alt}
                  loading="lazy"
                  className="px-1 banner-image rounded-[10px] aspect-[5.5/1] object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* {myservice.fixedType == "dentalservice" && (
        <section className="features-section bg-[#E8E4F5] bg-[url('/assets/Medicompares%20Background.png')] bg-cover bg-center bg-no-repeat"
        >
          <div className="features-container">
            <div className="feature-box">
              <i className="fa-solid fa-hand-holding-dollar feature-icon icon-box"></i>
              <h3>Affordable Price</h3>
              <p className="text-dark">
                Transparent pricing with no hidden charges, ensuring quality
                dental care that fits your budget.
              </p>
            </div>

            <div className="feature-box">
              <i className="fa-solid fa-user-doctor feature-icon icon-box"></i>
              <h3>Professional Dentist</h3>
              <p className="text-dark">
                Experienced and certified dental specialists delivering safe,
                precise, and reliable treatments.
              </p>
            </div>

            <div className="feature-box">
              <i className="fa-solid fa-thumbs-up feature-icon icon-box"></i>
              <h3>Satisfactory Service</h3>
              <p className="text-dark">
                Patient-focused care with high hygiene standards, comfort, and
                trusted treatment outcomes.
              </p>
            </div>
          </div>
        </section>
      )} */}

      <VendorOffersModal show={!!vendorModel} onClose={() => setVendorModel(null)} product={vendorModel} />
      <Footer />
    </div>
  );
};



export default ServiceDetails;

