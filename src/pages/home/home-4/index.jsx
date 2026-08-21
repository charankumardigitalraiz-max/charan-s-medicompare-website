import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import Home2Header from "../../../components/layout/Header-k";
import SEOHelmet from "../../../components/ui/SEOHelmet";
import Home2Footer from "../../../components/layout/Footer-f";
import { Link, useNavigate, useLocation, useParams } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import { Swiper } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { TypeAnimation } from "react-type-animation";
import toast from "react-hot-toast";
import Slider from "react-slick";
import {
  axiosInstance,
  axiosCommonInstance,
  imgUrl,
} from "../../../Apiservice";
import { useMediaQuery } from "react-responsive";
import MedicineSection from "../../../components/ui/MedicineSection";
import { useLocation as useLocationContext } from "../../../context/LocationContext";
import CustomerReviewsSuccessModal from "../../../components/modals/CustomerReviewSuccessModal";
import DynamicCategorySections2 from "../../../components/home/DynamicCategorySections2";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import { getImageUrl } from "../../../utils";
import PrescriptionUploadModal from "../../../components/modals/PrescriptionUploadModal";
import VendorOffersModal from "../../../components/ui/VendorOffersModal.jsx";
import { useVoiceRecognition } from "../../../hooks";
import {
  collectHomeImagePaths,
  prefetchImageUrls,
  preloadStaticImages,
} from "../../../utils/prefetchImages";
import { shouldUseHomeLiteMode } from "../../../utils/devicePerformance";
import {
  getMedicinePincodeFromStorage,
  getProductNavigation,
} from "../../../utils/productUtils";

const HERO_TYPE_WORDS = [
  "Medicines",
  "Surgeries",
  "Dental",
  "Diagnostics",
  "Lab Prices",
];

const Home2 = ({ handleProductClick: propHandleProductClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedPincode, latitude, longitude } = useLocationContext();
  const [categories, setCategories] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [blogss, setblogss] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMoreLoading, setIsMoreLoading] = useState(false);
  const { isListening, startListening, MicPermissionModal } = useVoiceRecognition();
  const [faqss, setFaqs] = useState([]);
  const [sections, setSections] = useState([]);
  const [part1Vendors, setPart1Vendors] = useState([]);
  const [part2Vendors, setPart2Vendors] = useState([]);
  const [mediciness, setMediciness] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionsLimit, setSuggestionsLimit] = useState(10);
  const [hasMoreSuggestions, setHasMoreSuggestions] = useState(true);
  const [show, setshow] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [searchHistory, setSearchHistory] = useState([]);
  const [compareSection, setCompareSection] = useState([]);
  const [vendors, setVendors] = useState([]);
  const { service } = useParams();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [openIndex, setOpenIndex] = useState(null);
  const searchRef = useRef("");
  const searchInputRef = useRef(null);
  const heroTypeRef = useRef(null);
  const searchContainerRef = useRef(null);
  const serviceSliderRef = useRef(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [vendorModel, setVendorModel] = useState(null);
  const homeLiteMode = useMemo(() => shouldUseHomeLiteMode(), []);

  const { row1, row2 } = useMemo(() => {
    if (vendors && vendors.length > 0 && (vendors[0]?.part1 || vendors[0]?.part2)) {
      return {
        row1: vendors[0].part1 || [],
        row2: vendors[0].part2 || []
      };
    }
    if (part1Vendors?.length > 0 || part2Vendors?.length > 0) {
      return {
        row1: part1Vendors,
        row2: part2Vendors
      };
    }
    if (vendors && vendors.length > 0) {
      const half = Math.ceil(vendors.length / 2);
      return {
        row1: vendors.slice(0, half),
        row2: vendors.slice(half)
      };
    }
    return { row1: [], row2: [] };
  }, [vendors, part1Vendors, part2Vendors]);

  const repeatedRow1 = useMemo(() => {
    if (!row1 || row1.length === 0) return [];
    const minItems = 15;
    const repeats = Math.ceil(minItems / row1.length) + 1;
    let list = [];
    for (let i = 0; i < repeats; i++) {
      list = [...list, ...row1];
    }
    return list;
  }, [row1]);

  const repeatedRow2 = useMemo(() => {
    if (!row2 || row2.length === 0) return [];
    const minItems = 15;
    const repeats = Math.ceil(minItems / row2.length) + 1;
    let list = [];
    for (let i = 0; i < repeats; i++) {
      list = [...list, ...row2];
    }
    return list;
  }, [row2]);

  useLayoutEffect(() => {
    if (!homeLiteMode) return undefined;

    document.documentElement.classList.add("home-lite");
    return () => document.documentElement.classList.remove("home-lite");
  }, [homeLiteMode]);

  const toggleAccordion = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };
  const handleClose = () => {
    setshow(false);
    localStorage.setItem("hasSeenModal", "true");
  };

  useEffect(() => {
    const assets = ["/assets/default.png", "/assets/img/work-img.png"];
    if (!homeLiteMode) {
      assets.unshift("/assets/Medicompares%20Background.png");
    }
    preloadStaticImages(assets);
  }, [homeLiteMode]);

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

  useEffect(() => {
    if (!homeLiteMode) return undefined;

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % HERO_TYPE_WORDS.length;
      if (heroTypeRef.current) {
        heroTypeRef.current.textContent = HERO_TYPE_WORDS[index];
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [homeLiteMode]);

  const STORAGE_KEY = "searchHistory";
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

  const saveSearchHistory = (history) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      setSearchHistory(history);
    } catch (error) { }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(STORAGE_KEY);
    setShowSuggestions(false);
  };

  const getByBlogDetails = (blog) => {
    navigate(`/blog-details/${blog.slug}`);
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

  const addToSearchHistory = (item) => {
    if (!item) return;

    const searchTerm = item.tablet?.name || "Unknown";
    if (!searchTerm.trim()) return;

    let history = loadSearchHistory();

    const historyEntry = {
      _id: item._id,
      searchTerm: searchTerm.trim(),
      item: item,
    };

    history = history.filter(
      (h) => typeof h === "string" || !h._id || h._id !== item._id,
    );

    history.unshift(historyEntry);
    history = history.slice(0, 5);

    saveSearchHistory(history);
  };

  const fetchSuggestions = async (searchQuery, limitNum, isLoadMore = false) => {
    if (!searchQuery.trim()) return;
    if (isLoadMore) {
      setIsMoreLoading(true);
    } else {
      setIsLoading(true);
    }
    try {
      const trimmedValue = searchQuery.length > 50 ? searchQuery.substring(0, 50) : searchQuery;
      const response = await axiosCommonInstance.get(
        `all/search/product?search=${encodeURIComponent(trimmedValue)}&page=1&limit=${limitNum}`
      );

      if (searchRef.current === searchQuery) {
        const list = response?.data?.data?.list || [];
        setFilteredSuggestions(list);

        if (list.length < limitNum) {
          setHasMoreSuggestions(false);
        } else {
          setHasMoreSuggestions(true);
        }

        if (list.length > 0) {
          const variantsMap = {};
          list.forEach((item) => {
            variantsMap[item._id] = item.selectedVariantId || null;
          });
          setSelectedVariants((prev) => ({ ...prev, ...variantsMap }));
        }
      }
    } catch (err) {
      if (searchRef.current === searchQuery) {
        if (!isLoadMore) {
          setFilteredSuggestions([]);
        }
        setHasMoreSuggestions(false);
      }
    } finally {
      if (searchRef.current === searchQuery) {
        setIsLoading(false);
        setIsMoreLoading(false);
      }
    }
  };

  const handleChange = async (e) => {
    const value = e.target.value;
    setQuery(value);
    searchRef.current = value;

    if (!value.trim()) {
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
    fetchSuggestions(value, 10, false);
  };

  const startVoiceRecognition = () => {
    startListening((voiceText) => {
      setQuery(voiceText);
      handleChange({ target: { value: voiceText } });
    });
  };

  const handlePrescriptionSearchCompleted = (resData) => {
    setShowPrescriptionModal(false);
    if (resData && resData.length > 0) {
      const list = resData.map(item => ({
        _id: item._id,
        name: item.name,
        slug: item.slug,
        imageUrl: item.imageUrl,
        files: item.files,
        tablet: {
          _id: item._id,
          name: item.name,
          slug: item.slug,
          imageUrl: item.imageUrl,
          files: item.files,
          form: item.form,
          strength: item.strength,
        },
        selectedVariantId: item.product?._id || null,
      }));

      setFilteredSuggestions(list);
      setShowSuggestions(true);
      setQuery("Prescription search results");
      toast.success(`Found ${resData.length} matching medicines!`);
    } else {
      setFilteredSuggestions([]);
      toast.error("No matching medicines found in your prescription.");
    }
  };

  const handleSelect = (item) => {
    if (!item) return;

    // Navigate directly to package details for package type
    if (item.type === "package" && item.tablet?._id) {
      setShowSuggestions(false);
      setQuery(item.tablet?.name || "");
      window.setTimeout(() => addToSearchHistory(item), 0);
      navigate(`/lab-package/${item.tablet._id}`);
      return;
    }

    setShowSuggestions(false);
    handleProductClick(item);
    setQuery(item.tablet?.name || "");
    window.setTimeout(() => addToSearchHistory(item), 0);
  };

  const handleHistorySelect = (historyItem) => {
    if (typeof historyItem === "object" && historyItem.item) {
      setShowSuggestions(false);
      handleProductClick(historyItem.item);
      setQuery(historyItem.searchTerm || "");
      return;
    }

    const searchTerm =
      typeof historyItem === "string"
        ? historyItem
        : historyItem.searchTerm || "";
    if (searchTerm) {
      setQuery(searchTerm);
      setShowSuggestions(true);
      handleChange({ target: { value: searchTerm } });
    }
  };

  const blogsSettings = {
    dots: true,
    arrows: false,
    infinite: blogss?.length > 3,
    speed: 500,
    slidesToShow: blogss?.length >= 3 ? 3 : blogss?.length || 1,
    slidesToScroll: 1,
    autoplay: blogss?.length > 1,
    autoplaySpeed: 3500,
    pauseOnHover: true,
    centerMode: blogss?.length === 1,
    centerPadding: blogss?.length === 1 ? "300px" : "0px",
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: blogss?.length >= 2 ? 2 : 1,
          centerMode: blogss?.length === 1,
          centerPadding: blogss?.length === 1 ? "150px" : "0px",
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 1,
          centerMode: false,
        },
      },
    ],
  };

  useEffect(() => {
    if (homeLiteMode) {
      AOS.init({ disable: true });
      return;
    }

    AOS.init({
      duration: 800,
      once: true,
      mirror: false,
      offset: 80,
      throttleDelay: 99,
      debounceDelay: 50,
    });
  }, [homeLiteMode]);

  useEffect(() => {
    if (loading || homeLiteMode) return undefined;

    const refreshTimer = setTimeout(() => {
      AOS.refresh();
    }, 150);

    return () => clearTimeout(refreshTimer);
  }, [loading, categories, sections, mediciness, blogss, testimonials, homeLiteMode]);

  const getAllHomeData = async () => {
    const bodyData = {
      type: "website",
      positionType: ["top", "bottom"],
    };

    let apiUrl = "home";
    if (selectedPincode) {
      apiUrl += `?location=${selectedPincode}`;
      if (latitude && longitude) {
        apiUrl += `&lat=${latitude}&lng=${longitude}`;
      }
    }

    try {
      const [homeResponse] = await Promise.all([
        axiosInstance.get(apiUrl, bodyData),
      ]);

      const {
        categories,
        faqs,
        vendor,
        blogs,
        topsalesproductvendor,
        camparesection,
        testimonial,
        sections,
      } = homeResponse.data.data;

      setCategories(categories);
      setblogss(blogs);
      setCompareSection(camparesection || [])
      setTestimonials(testimonial?.testimonial || []);
      setMediciness(topsalesproductvendor);
      setVendors(vendor || []);
      setSections(sections || []);
      if (vendor && vendor.length > 0) {
        const parts = vendor[0];
        setPart1Vendors(parts.part1 || []);
        setPart2Vendors(parts.part2 || []);
      } else {
        setPart1Vendors([]);
        setPart2Vendors([]);
      }
      setFaqs(faqs);
      console.log("vendors List", vendor)
      if (!homeLiteMode) {
        prefetchImageUrls(
          collectHomeImagePaths({
            categories,
            topsalesproductvendor,
            sections,
            blogs,
            vendor,
          }),
          28,
        );
      }

      setLoading(false);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
      setLoading(false);
    }
  };

  useEffect(() => {
    getAllHomeData();

    const hasSeenModal = localStorage.getItem("hasSeenModal");
    if (!hasSeenModal) {
      setshow(true);
    }
  }, [selectedPincode]);

  useEffect(() => {
    const initializeComponent = async () => {
      try {
        await Promise.all([loadSearchHistory()]);

        setQuery("");
        setFilteredSuggestions([]);
        setShowSuggestions(false);
      } catch (error) {
        setQuery("");
        setFilteredSuggestions([]);
        setShowSuggestions(false);
      }
    };

    initializeComponent();
  }, []);

  useEffect(() => {
    setQuery("");
    setFilteredSuggestions([]);
    setShowSuggestions(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const searchWrapper = document.querySelector(".search-wrapper");
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

  const handleCategoryClick = (item) => {
    sessionStorage.setItem("activeCategoryLoader", JSON.stringify({
      name: item.name,
      fixedType: item.fixedType || item.slug || "",
      colorcode: item.colorcode || ""
    }));
    navigate(`/${item.slug}`);
  };

  const bestDoctorsSlider = {
    dots: true,
    infinite: true,
    arrows: false,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const leftSliderSettings = {
    dots: false,
    arrows: false,
    infinite: true,
    speed: 20000,
    autoplay: true,
    autoplaySpeed: 0,
    cssEase: "linear",
    slidesToShow: 4,
    slidesToScroll: 1,
    pauseOnHover: true,
    responsive: [
      { breakpoint: 992, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2 } },
      { breakpoint: 480, settings: { slidesToShow: 1 } },
    ],
  };

  const rightSliderSettings = {
    ...leftSliderSettings,
    rtl: true,
  };

  const handleCompareClick = (item) => {
    const productId =
      item?.tabletdetails?.slug || item?.tablet?.slug || item?.slug || null;

    if (!productId) {
      toast.error("Product ID not found");
      return;
    }
    const tablet = item?.tabletdetails || item?.tablet || item;
    const categorySlug =
      tablet?.category?.slug || tablet?.subcategorys?.category?.slug;
    const subcategorySlug = tablet?.subcategorys?.slug;

    navigate(`/${categorySlug}/${subcategorySlug}/${productId}/compare`);
  };

  const handleCompareDynamic = (item, section) => {
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

    const serviceName =
      section?.serviceId?.slug ||
      sub?.categoryDetails?.slug ||
      sub?.category?.slug ||
      "medicine";

    const subcategory = sub?.slug || "general";

    navigate(`/${serviceName}/${subcategory}/${productSlug}/compare`);
  };

  const handleVendorClick = (vendor) => {
    const vendorId =
      vendor?._id ||
      vendor?.vendorId ||
      vendor?.businessdetails?._id ||
      vendor?.bussinessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      const name =
        vendor?.businessdetails?.name || vendor?.name || "Vendor Store";
      const vendorSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  const handleProductClick = (product, serviceSlug) => {
    if (propHandleProductClick) {
      return propHandleProductClick(product);
    }

    const navigation = getProductNavigation(product, {
      fallbackService: serviceSlug || "medicine",
      pincode: getMedicinePincodeFromStorage(),
    });

    if (!navigation) {
      toast.error("Product details not available");
      return;
    }

    navigate(navigation.url, { state: navigation.state });
  };

  const renderTestimonialCard = (review) => (
    <div
      className={`bg-gradient-to-br from-white to-[#f8f9ff] rounded-[16px] p-6 border border-[#7d2eff]/10 h-full flex flex-col relative overflow-hidden ${homeLiteMode
        ? "shadow-[0_2px_10px_rgba(125,46,255,0.08)] transition-none"
        : "shadow-[0_4px_20px_rgba(125,46,255,0.1)] transition-all duration-300 ease-in-out"
        }`}
    >
      <div
        className="absolute top-[16px] right-[16px] flex items-center gap-[4px] py-[4px] px-[8px] rounded-[20px] z-[1]"
      >
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`${star <= Number(review.rating) ? "fas fa-star" : "far fa-star"
              } text-[12px] ${star <= Number(review.rating) ? "text-[#facc15]" : "text-[#d1d5db]"
              }`}
          />
        ))}
      </div>

      <div
        className="flex items-start gap-[16px] mb-[16px] relative z-[1]"
      >
        <div
          className="relative w-[60px] h-[60px] shrink-0"
        >
          {Array.isArray(review.image) && review.image.length > 0 ? (
            <img
              src={review.image[0]}
              alt={review.name || "User"}
              loading="lazy"
              decoding="async"
              className="w-[60px] h-[60px] rounded-full object-cover border-[3px] border-solid border-[#7d2eff]/20"
            />
          ) : (
            <div
              className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#321961] to-[#3b82f6] flex items-center justify-center text-white text-[24px] font-bold uppercase"
            >
              {review.name && review.name.trim().length > 0
                ? review.name.trim()[0]
                : "U"}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h5
            className="text-[16px] font-bold text-[#1e3a8a] m-0 mb-[4px] leading-[1.3]"
          >
            {review.name}
          </h5>
          <p
            className="text-[12px] m-0 text-[#6b7280] leading-[1.4]"
          >
            {review?.designation || "Hyderabad, India"}
          </p>
        </div>
      </div>

      <p
        className="text-[14px] text-[#4b5563] m-0 leading-[1.6] flex-1"
      >
        {review?.description || "Excellent service and very smooth experience."}
      </p>
    </div>
  );

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

  return (
    <>
      <SEOHelmet page="home" />
      {loading ? (
        <PageLoader />
      ) : (
        <div
          className={`main-wrapper ${homeLiteMode ? " home-lite-page" : ""} overflow-x-hidden w-full font-['Poppins',sans-serif] ${homeLiteMode ? "overflow-y-visible h-auto" : "overflow-y-hidden h-full"
            } ${isMobile ? "bg-[#f9f9f9]" : ""}`}
        >
          <Home2Header />
          <section className="relative min-h-[420px] bg-[#f9f9f9] bg-[url('/assets/search-bg.png')] bg-no-repeat bg-bottom bg-[length:100%_auto] pt-10 pb-[60px] max-lg:min-h-[280px] max-md:pt-5 max-md:pb-[50px] max-[480px]:min-h-[220px] max-[480px]:px-[15px] max-[480px]:pb-[30px]">
            {/* Overlay */}
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,white_0%,white_20%,transparent_40%,rgba(128,70,241,0.3)_100%)] max-lg:bg-[linear-gradient(180deg,transparent_40%,rgba(128,70,241,0.3)_100%)] opacity-50" />

            <div className="container-fluid relative z-10">
              <div className="mx-auto w-full max-w-[800px] max-lg:max-w-[720px]">

                <div
                  className="mb-[25px] text-center"
                  data-aos="fade-up"
                >
                  <h1 className="m-0 !mb-[10px] !text-[clamp(17px,4vw,45px)] !font-semibold text-[#343434]">
                    Compare &amp; Choose{" "}
                    <span className="text-[#321961]">
                      {homeLiteMode ? (
                        <span ref={heroTypeRef}>Medicines</span>
                      ) : (
                        <TypeAnimation
                          sequence={[
                            "Medicines", 3000,
                            "Surgeries", 3000,
                            "Dental", 3000,
                            "Diagnostics", 3000,
                            "Lab Prices", 3000,
                          ]}
                          wrapper="span"
                          speed={200}
                          repeat={Infinity}
                          cursor
                        />
                      )}
                    </span>
                  </h1>

                  <p className="m-0 text-[clamp(13px,2vw,20px)] text-[#757575]">
                    Compare the best healthcare services near you only on
                    <span className="font-semibold text-[#321961]"> MediCompares</span>
                  </p>

                </div>

                <section
                  className="p-[12px] md:py-0 md:px-[10px] relative mt-[10px] mobileview z-[9]"
                >
                  <div
                    className="container-fluid px-3 px-md-4 relative z-[1] w-full max-w-[600px] mx-auto"
                  >
                    <div className="row">
                      <div className="col-12">
                        <div
                          className="relative z-[1] max-w-[600px]"
                        >
                          <div className="row">
                            <div className="col-12">
                              <div
                                className="search-wrapper searchhome m-auto relative z-10"
                                ref={searchContainerRef}
                              >
                                <form onSubmit={(e) => e.preventDefault()}>
                                  {(() => {
                                    const isDropdownActive = isLoading || (showSuggestions && (filteredSuggestions.length > 0 || (!query.trim() && searchHistory.length > 0)));
                                    return (
                                      <>
                                        <div
                                          className={`bg-white border border-solid transition-all duration-250 ease-in-out overflow-hidden relative flex items-center p-2.5 gap-2.5 ${isDropdownActive
                                            ? "rounded-t-[20px] rounded-b-none border-slate-200 border-b-transparent shadow-[0_15px_30px_rgba(50,25,97,0.05)]"
                                            : "rounded-[30px] border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.02),0_1px_3px_rgba(0,0,0,0.01)] hover:border-[#321961]/50 focus-within:border-[#321961]"
                                            }`}
                                        >
                                          <div
                                            className="flex items-center justify-center w-[25px] h-[25px] text-[#321961]/60 shrink-0"
                                          >
                                            <i
                                              className="fas fa-search text-[15px]"
                                            ></i>
                                          </div>

                                          <input
                                            ref={searchInputRef}
                                            type="text"
                                            placeholder={placeholderTexts[0]}
                                            value={query}
                                            onChange={handleChange}
                                            onFocus={() => {
                                              if (
                                                !query.trim() &&
                                                searchHistory.length > 0
                                              ) {
                                                setShowSuggestions(true);
                                              } else if (query) {
                                                setShowSuggestions(true);
                                              }
                                            }}
                                            className="search-input !border-none !outline-none flex-1 text-[clamp(14.5px,2vw,16px)] p-0 text-[#111827] bg-transparent font-inherit font-medium min-w-0 placeholder-slate-400"
                                          />

                                          {isLoading && (
                                            <div
                                              className="google-dots absolute right-[75px] top-1/2 -translate-y-1/2"
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
                                            className="!flex !items-center !justify-center !w-[30px] !h-[30px] !rounded-full !bg-violet-100 !text-[#7c3aed] !border-none !cursor-pointer !transition-all !duration-300 !ease-in-out !shrink-0 hover:!bg-[#7c3aed] hover:!text-white hover:!scale-110 active:!scale-90 hover:!shadow-[0_4px_12px_rgba(124,58,237,0.25)]"
                                          >
                                            <i className="fas fa-file-prescription text-[13px]"></i>
                                          </button>

                                          <button
                                            type="button"
                                            title="Voice search"
                                            onClick={startVoiceRecognition}
                                            className={`!flex !items-center !justify-center !w-[30px] !h-[30px] !rounded-full !border-none !transition-all !duration-300 !ease-in-out !cursor-pointer !shrink-0 active:!scale-90 ${isListening
                                              ? "!bg-gradient-to-r !from-rose-500 !to-red-600 !text-white !shadow-[0_0_12px_rgba(244,63,94,0.5)] hover:!scale-110 hover:!shadow-[0_0_16px_rgba(244,63,94,0.7)]"
                                              : "!bg-blue-50 !text-blue-600 hover:!bg-blue-600 hover:!text-white hover:!scale-110 hover:!shadow-[0_4px_12px_rgba(37,99,235,0.25)]"
                                              }`}
                                          >
                                            <i className={`${isListening ? "fas fa-microphone text-white animate-pulse" : "fas fa-microphone"} text-[14px]`}></i>
                                          </button>
                                        </div>

                                        {(isLoading || isDropdownActive) && (
                                          <div
                                            className={`absolute top-full left-0 right-0 mt-0 bg-white border border-solid border-slate-200 z-[999999] max-h-[400px] overflow-y-auto overflow-x-hidden animate-[fadeInUp_0.2s_ease-out] ${isDropdownActive
                                              ? "rounded-b-[20px] rounded-t-none border-t-0 shadow-[0_20px_45px_rgba(50,25,97,0.12)]"
                                              : "rounded-[20px] shadow-[0_10px_30px_rgba(0,0,0,0.08)]"
                                              }`}
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
                                                    className="py-[6px] px-[15px] text-[12px] border-b border-solid border-[#f3f4f6] bg-[#f9fafb] flex justify-between items-center"
                                                  >
                                                    <span>Recent Search History</span>
                                                    <button
                                                      type="button"
                                                      onClick={clearSearchHistory}
                                                      className="bg-none border-none text-[#ef4444] text-[11px] cursor-pointer py-1 px-2 rounded-[4px] transition-all duration-200 ease hover:bg-[#fef2f2]"
                                                    >
                                                      Clear All
                                                    </button>
                                                  </div>
                                                  {searchHistory.map(
                                                    (historyItem, index) => (
                                                      <button
                                                        key={
                                                          typeof historyItem ===
                                                            "object" && historyItem._id
                                                            ? `history-${historyItem._id}`
                                                            : `history-${index}`
                                                        }
                                                        onClick={() =>
                                                          handleHistorySelect(historyItem)
                                                        }
                                                        className={`w-full py-[10px] px-[15px] border-none bg-transparent text-left cursor-pointer text-[15px] text-[#111827] flex z-[9999999] items-center gap-[14px] transition-all duration-200 ease relative hover:bg-[#f9fafb] ${index < searchHistory.length - 1
                                                          ? "border-b border-solid border-[#f3f4f6]"
                                                          : "border-b-0"
                                                          }`}
                                                      >
                                                        <img
                                                          src={getImageUrl(
                                                            historyItem?.item?.tablet
                                                              ?.imageUrl?.length > 0
                                                              ? historyItem.item.tablet
                                                                .imageUrl[0]
                                                              : historyItem?.item?.tablet
                                                                ?.files?.length > 0
                                                                ? historyItem.item.tablet
                                                                  .files[0]
                                                                : historyItem?.item
                                                                  ?.imageUrl?.length >
                                                                  0
                                                                  ? historyItem.item
                                                                    .imageUrl[0]
                                                                  : historyItem?.item
                                                                    ?.files?.length >
                                                                    0
                                                                    ? historyItem.item
                                                                      .files[0]
                                                                    : historyItem?.tablet
                                                                      ?.imageUrl
                                                                      ?.length > 0
                                                                      ? historyItem.tablet
                                                                        .imageUrl[0]
                                                                      : historyItem
                                                                        ?.tablet
                                                                        ?.files
                                                                        ?.length > 0
                                                                        ? historyItem
                                                                          .tablet
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

                                                        {/* Product Name */}
                                                        <span
                                                          className="flex-1 leading-[1.5] overflow-hidden text-ellipsis whitespace-nowrap"
                                                        >
                                                          {typeof historyItem === "string"
                                                            ? historyItem
                                                            : historyItem.searchTerm ||
                                                            "Unknown"}
                                                        </span>

                                                        {/* Medicine Type Badge */}
                                                        {typeof historyItem ===
                                                          "object" &&
                                                          (historyItem?.item?.tablet
                                                            ?.medicineType ||
                                                            historyItem?.item?.tablet
                                                              ?.type ||
                                                            historyItem?.tablet
                                                              ?.medicineType ||
                                                            historyItem?.tablet
                                                              ?.type) && (
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
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            deleteSearchHistoryItem(
                                                              index,
                                                              historyItem,
                                                            );
                                                          }}
                                                          className="bg-none border-none text-[#ef4444] text-[14px] cursor-pointer p-[4px] rounded-[4px] transition-all duration-200 ease flex items-center justify-center w-[24px] h-[24px] shrink-0 hover:bg-[#fef2f2]"
                                                          title="Delete this search"
                                                        >
                                                          <i className="fas fa-times"></i>
                                                        </div>
                                                      </button>
                                                    ),
                                                  )}
                                                </>
                                              )}

                                            {!isLoading &&
                                              query.trim() &&
                                              filteredSuggestions.map((item, index) => (
                                                <div
                                                  key={item._id || item.tablet?._id || index}
                                                  onClick={() => handleSelect(item)}
                                                  className={`w-full p-[11px] border-none bg-transparent text-left cursor-pointer text-[14.5px] text-slate-800 flex z-[9999999] items-center justify-between gap-[14px] transition-all duration-200 ease relative hover:bg-[#321961]/5 ${index < filteredSuggestions.length - 1
                                                    ? "border-b border-solid border-slate-100"
                                                    : "border-b-0"
                                                    }`}
                                                >
                                                  <div className="flex items-center gap-[12px]">
                                                    <div
                                                      className="text-[#321961]/40 shrink-0"
                                                    >
                                                      <i className="fas fa-search text-[13px]"></i>
                                                    </div>
                                                    <div className="flex flex-col">
                                                      <span
                                                        className="flex-1 leading-snug font-medium text-slate-800 capitalize"
                                                      >
                                                        {highlightMatch(
                                                          item.tablet?.name,
                                                          query,
                                                        )}
                                                      </span>

                                                      {item.tablet?.packagingDetails && (
                                                        <span className="text-[11px] text-[#888] mt-[2px] font-normal">
                                                          {item?.tablet?.packagingDetails}
                                                        </span>
                                                      )}
                                                    </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                    <span
                                                      className="text-[10px] text-[#321961] bg-[#321961]/8 py-[2.5px] px-[9px] rounded-full whitespace-nowrap ml-[8px] capitalize font-bold"
                                                    >
                                                      {item?.type === "package"
                                                        ? item?.type
                                                        : item?.tablet?.category?.fixedType === "medicine"
                                                          ? (item?.tablet?.medicineType || "product")
                                                          : (item?.tablet?.category?.name || "product")}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        setVendorModel(item);
                                                      }}
                                                      style={{
                                                        background: '#ffffff',
                                                        border: '1px solid #e2e8f0',
                                                        color: '#321961',
                                                        cursor: 'pointer',
                                                        padding: '4px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: '50%',
                                                        width: '24px',
                                                        height: '24px',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                                      }}
                                                      onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#321961';
                                                        e.currentTarget.style.color = '#ffffff';
                                                        e.currentTarget.style.borderColor = '#321961';
                                                        e.currentTarget.style.transform = 'scale(1.08)';
                                                      }}
                                                      onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#ffffff';
                                                        e.currentTarget.style.color = '#321961';
                                                        e.currentTarget.style.borderColor = '#e2e8f0';
                                                        e.currentTarget.style.transform = 'none';
                                                      }}
                                                      title="Insert into search"
                                                    >
                                                      <i className="fa fa-plus" style={{ fontSize: '10px' }} />
                                                    </button>
                                                  </div>
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
                                                  fetchSuggestions(query, nextLimit, true);
                                                }}
                                                className={`w-full p-[10px] border-none font-semibold text-center text-[13px] border-t border-solid border-[#f3f4f6] transition-all duration-200 ${isMoreLoading
                                                  ? "text-[#9ca3af] cursor-not-allowed bg-[#f9fafb]"
                                                  : "text-[#321961] cursor-pointer bg-[#f9fafb] hover:bg-[#f1f5f9]"
                                                  }`}
                                              >
                                                {isMoreLoading ? "Loading..." : "Load More"}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </>
                                    );
                                  })()}
                                </form>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>

          {categories && categories.length > 0 && (
            <section className="py-8 bg-[#fafafc] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/20 via-white to-[#fafafc] relative overflow-hidden">
              <div className="absolute top-0 left-1/4 w-[350px] h-[350px] rounded-full bg-[#7c3aed]/3 blur-[100px] pointer-events-none"></div>
              <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] rounded-full bg-[#059669]/3 blur-[100px] pointer-events-none"></div>

              <div className="max-w-full mx-auto px-6 md:px-12 lg:px-20 relative z-10">
                <div className="text-center mb-12 max-w-2xl lg:max-w-4xl mx-auto" data-aos="fade-up">
                  {/* <div className="inline-flex items-center gap-1.5 bg-[#321961]/10 border border-solid border-[#321961]/20 py-1.5 px-4 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#321961] animate-pulse"></span>
                    <span className="text-[11px] uppercase tracking-wider text-[#321961] font-semibold">Specialized Care</span>
                  </div> */}
                  <h2 className="text-[34px] font-light text-[#0f172a] leading-tight tracking-tight mb-3">
                    Explore Multiple <span className="font-normal text-[#321961]">Services</span>
                  </h2>
                  <p className="text-[13.5px] text-[#64748b] font-light leading-relaxed">
                    Browse a wide range of medical categories to compare pricing, verify compositions, and find the best deals.
                  </p>
                </div>

                <style dangerouslySetInnerHTML={{
                  __html: `
                  .category-icon-img {
                    filter: brightness(0) invert(13%) sepia(55%) saturate(3990%) hue-rotate(258deg) brightness(79%) contrast(97%);
                    transition: filter 0.3s ease, transform 0.4s ease;
                  }
                  .group:hover .category-icon-img {
                    filter: brightness(0) invert(1);
                    transform: translateY(-2px);
                  }
                `}} />

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 w-full mt-4">
                  {categories.map((item, categoryIndex) => (
                    <div
                      key={item._id}
                      onClick={() => handleCategoryClick(item)}
                      className="group cursor-pointer bg-white border border-solid border-slate-200/80 rounded-md p-4 flex flex-row items-center gap-4 transition-all duration-300 hover:border-[#321961]/35 hover:shadow-[0_12px_30px_rgba(50,25,97,0.06)] hover:-translate-y-1 relative overflow-hidden"
                    >
                      {/* Glow Blob decoration on card hover */}
                      <div className="absolute -bottom-10 -right-10 w-20 h-20 bg-[#7c3aed]/5 rounded-full blur-xl group-hover:bg-[#7c3aed]/10 transition-colors duration-300"></div>

                      {/* Interactive Accent Line */}
                      <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-[#321961] to-[#7c3aed] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                      <div className="w-[52px] h-[52px] rounded-xl bg-gradient-to-br from-[#321961]/5 to-[#7c3aed]/5 border border-solid border-slate-200/40 flex items-center justify-center transition-all duration-300 group-hover:from-[#321961] group-hover:to-[#7c3aed] group-hover:shadow-[0_4px_12px_rgba(125,46,255,0.25)] shrink-0">
                        <img
                          src={
                            item?.files
                              ? getImageUrl(item.files)
                              : "/assets/default.png"
                          }
                          alt={item.name}
                          title={item.name}
                          className="h-[28px] w-[28px] object-contain category-icon-img"
                          loading={categoryIndex < 8 ? "eager" : "lazy"}
                          fetchPriority={categoryIndex < 4 ? "high" : "auto"}
                          decoding="async"
                        />
                      </div>

                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="!font-semibold !text-[14px] text-slate-800 group-hover:text-[#321961] transition-colors duration-300 mb-0.5 tracking-wide leading-snug truncate">
                          {item.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-0.5 group-hover:text-[#7c3aed] transition-colors duration-300">
                          <span>Compare Live</span>
                          <i className="fas fa-chevron-right text-[8px] transform group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}



          {mediciness?.length > 0 && (
            <MedicineSection
              title="Top Most Medicines"
              icon="fas fa-capsules"
              bgColor="rgba(79, 70, 229, 0.12)"
              iconColor="#321961"
              medicines={mediciness}
              isMobile={isMobile}
              decorativeElements={
                homeLiteMode
                  ? []
                  : [
                    {
                      className: "floating-shape",
                      style: {
                        top: "10%",
                        left: "5%",
                        fontSize: "40px",
                        color: "#321961",
                        animation: "floatBlob 25s infinite",
                      },
                      icon: "fas fa-capsules",
                    },
                    {
                      className: "floating-shape",
                      style: {
                        top: "40%",
                        left: "-2%",
                        fontSize: "24px",
                        color: "#818cf8",
                        animation: "wobble 15s infinite",
                        opacity: 0.1,
                      },
                      icon: "fas fa-pills",
                    },
                    {
                      className: "floating-shape",
                      style: {
                        top: "15%",
                        right: "20%",
                        fontSize: "20px",
                        color: "#321961",
                        animation: "driftScale 18s infinite",
                        animationDelay: "2s",
                      },
                      icon: "fas fa-plus",
                    },
                    {
                      className: "floating-shape",
                      style: {
                        bottom: "20%",
                        right: "5%",
                        fontSize: "35px",
                        color: "#6366f1",
                        animation: "floatBlob 22s infinite reverse",
                      },
                      icon: "fas fa-notes-medical",
                    },
                    {
                      className: "floating-shape",
                      style: {
                        bottom: "5%",
                        left: "15%",
                        fontSize: "28px",
                        color: "#321961",
                        animation: "wobble 20s infinite",
                        opacity: 0.1,
                      },
                      icon: "fas fa-prescription-bottle",
                    },
                    {
                      className: "floating-shape",
                      style: {
                        top: "50%",
                        right: "40%",
                        fontSize: "18px",
                        color: "#a5b4fc",
                        animation: "driftScale 25s infinite",
                        opacity: 0.15,
                      },
                      icon: "fas fa-tablets",
                    },
                  ]}
              liteMode={homeLiteMode}
              onProductClick={handleProductClick}
              onCompareClick={handleCompareClick}
              onVendorClick={handleVendorClick}
              imgUrl={imgUrl}
            />
          )}

          <DynamicCategorySections2
            sections={sections.filter(sec => sec.title?.toLowerCase() !== "top most medicines" && sec.title?.toLowerCase() !== "top sales medicines")}
            onProductClick={handleProductClick}
            onCompareClick={handleCompareDynamic}
            onVendorClick={handleVendorClick}
            imgUrl={imgUrl}
            liteMode={homeLiteMode}
            isMobile={isMobile}
          // currentService={sections?.}
          />          {/* PROMOTIONAL SECTION */}
          <section className="py-12 my-6 px-3 relative overflow-hidden bg-[#faf9fc]/30">
            <div className="max-w-full mx-auto px-6 md:px-12 lg:px-20 relative z-10">

              {/* Section Header */}
              <div className="text-center mb-12 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 bg-[#321961]/10 border border-solid border-[#321961]/20 py-1.5 px-4 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#321961] animate-pulse"></span>
                  <span className="text-[11px] uppercase tracking-wider text-[#321961] font-semibold">Ecosystem Overview</span>
                </div>
                <h2 className="text-[34px] font-light text-[#0f172a] leading-tight tracking-tight mb-3">
                  Quick Access to <span className="font-normal !text-green">Healthcare Services</span>
                </h2>
                <p className="text-[13.5px] text-[#64748b] font-light leading-relaxed">
                  Easily browse prescriptions, find fast emergency support, or request clinical diagnostic test bookings.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left Card: Brand Promo */}
                <div className="lg:col-span-5 relative overflow-hidden rounded-sm bg-gradient-to-br from-[#f8f4ff] to-[#e8e3f5] border border-solid border-[#321961]/15 p-[30px] text-slate-800 shadow-[0_10px_30px_rgba(50,25,97,0.06)] flex flex-col justify-between min-h-[220px]">
                  {/* Glowing blobs */}
                  <div className="absolute -top-[50px] -right-[50px] w-[150px] h-[150px] rounded-full bg-[#321961]/5 blur-[30px]"></div>

                  <div className="relative z-10">
                    <span className="inline-flex items-center gap-1.5 bg-[#321961]/10 py-[4px] px-[12px] rounded-full text-[11px] font-semibold border border-[#321961]/25 text-[#321961] mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      All-in-One Platform
                    </span>
                    <h3 className="text-[22px] font-extrabold mb-2 tracking-tight text-[#321961]">Your Health, Simplified.</h3>
                    <p className="text-[13px] text-slate-600 leading-relaxed opacity-95">
                      Compare pricing, locate emergency services, and book medical appointments instantly.
                    </p>
                  </div>

                  <div className="relative z-10 mt-6 flex gap-6 text-[12px]">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-[16px] text-[#6d48b8]">24/7</span>
                      <span className="text-slate-500 text-[11px]">Availability</span>
                    </div>
                    <div className="w-[1px] bg-[#321961]/10"></div>
                    <div className="flex flex-col">
                      <span className="font-extrabold text-[16px] text-[#059669]">100%</span>
                      <span className="text-slate-500 text-[11px]">Verified Partners</span>
                    </div>
                  </div>
                </div>

                {/* Right Cards: Quick Service Access */}
                <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    {
                      icon: "fas fa-pills",
                      title: "Buy Medicines",
                      desc: "Compare and order prescriptions from local pharmacies.",
                      label: "Explore",
                      fixedType: "medicine",
                      path: "/medicine/all",
                      cardBg: "bg-gradient-to-br from-[#f8f6fc] to-[#ebdffc] hover:from-[#ebdffc] hover:to-[#e1ccfc]",
                      iconClass: "bg-[#321961]/10 text-[#321961]",
                      labelClass: "text-[#321961]/80",
                      titleClass: "text-[#321961]",
                      descClass: "text-slate-600",
                      borderClass: "border-[#321961]/15",
                      shadowHover: "hover:shadow-[0_15px_35px_rgba(50,25,97,0.12)]",
                    },
                    {
                      icon: "fas fa-microscope",
                      title: "Diagnostics",
                      desc: "Compare test packages & schedule home sample collection.",
                      label: "Book a Test",
                      fixedType: "labtest",
                      path: "/diagnostics/all",
                      cardBg: "bg-gradient-to-br from-[#f0fdf4] to-[#d1fae5] hover:from-[#d1fae5] hover:to-[#bbf7d0]",
                      iconClass: "bg-[#059669]/10 text-[#059669]",
                      labelClass: "text-[#065f46]/80",
                      titleClass: "text-[#065f46]",
                      descClass: "text-slate-600",
                      borderClass: "border-emerald-500/15",
                      shadowHover: "hover:shadow-[0_15px_35px_rgba(5,150,105,0.12)]",
                    },
                    {
                      icon: "fas fa-ambulance",
                      title: "Ambulances",
                      desc: "Instant dispatch & real-time booking tracking map.",
                      label: "Book Dispatch",
                      fixedType: "ambulance",
                      path: "/ambulance",
                      cardBg: "bg-gradient-to-br from-[#fff5f5] to-[#ffe3e3] hover:from-[#ffe3e3] hover:to-[#ffd1d1]",
                      iconClass: "bg-[#dc2626]/10 text-[#dc2626]",
                      labelClass: "text-[#991b1b]/80",
                      titleClass: "text-[#991b1b]",
                      descClass: "text-slate-600",
                      borderClass: "border-red-500/15",
                      shadowHover: "hover:shadow-[0_15px_35px_rgba(220,38,38,0.12)]",
                    },
                  ].map((card, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        localStorage.setItem("fixedType", card.fixedType);
                        navigate(card.path);
                      }}
                      className={`group cursor-pointer border border-solid ${card.borderClass} ${card.cardBg} p-5 rounded-sm shadow-[0_4px_15px_rgba(0,0,0,0.03)] ${card.shadowHover} transition-all duration-300 flex flex-col justify-between min-h-[180px] hover:-translate-y-1`}
                    >
                      <div>
                        <div className={`w-10 h-10 rounded-[12px] flex items-center justify-center transition-all duration-300 mb-4 shadow-sm ${card.iconClass}`}>
                          <i className={`${card.icon} text-[16px]`}></i>
                        </div>
                        <h4 className={`text-[14px] font-medium mb-1 transition-colors duration-300 ${card.titleClass}`}>{card.title}</h4>
                        <p className={`text-[11.5px] font-light leading-normal transition-colors duration-300 ${card.descClass}`}>{card.desc}</p>
                      </div>
                      <span className={`text-[11px] font-medium flex items-center gap-1 mt-4 transition-colors duration-300 ${card.labelClass}`}>
                        {card.label} <i className="fas fa-arrow-right text-[9px] transition-transform group-hover:translate-x-0.5"></i>
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </section>

          <section className="py-14 relative overflow-hidden bg-gradient-to-br from-[#faf9fc] via-[#f3effc] to-[#faf9fc]">
            {/* Ambient blobs */}
            <div className="absolute top-[-80px] left-[-60px] w-[320px] h-[320px] rounded-full bg-[#aa6df6]/8 blur-[90px] pointer-events-none"></div>
            <div className="absolute bottom-[-100px] right-[-80px] w-[380px] h-[380px] rounded-full bg-[#0ea5e9]/6 blur-[100px] pointer-events-none"></div>

            <div className="max-w-full mx-auto px-6 md:px-12 lg:px-20 relative z-10">

              {/* Top header */}
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between mb-12 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-[2px] bg-[#7c3aed] rounded-full"></div>
                    <span className="text-[#7c3aed] text-[11px] uppercase tracking-[0.3em] font-bold">Surgical Care</span>
                  </div>
                  <h2 className="text-[38px] font-light text-[#0f172a] leading-tight tracking-tight">
                    Explore <span className="font-normal bg-gradient-to-r from-[#7c3aed] to-[#aa6df6] bg-clip-text text-transparent">Surgeries</span>
                  </h2>
                </div>
                <p className="text-[13px] text-[#64748b] font-light leading-relaxed max-w-[360px] lg:text-right">
                  Compare pricing, read reviews, and find elite surgical clinics and certified surgeons near you.
                </p>
              </div>

              {/* Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[
                  {
                    num: "01",
                    icon: "fas fa-search-dollar",
                    title: "Compare Prices",
                    desc: "Instantly compare surgical package costs and hidden fees across multiple hospitals.",
                    accent: "from-[#7c3aed] to-[#4c1d95]",
                    cardBg: "from-[#f5f3ff] to-[#e8dffc] border-violet-200/60 hover:border-[#7c3aed]/40",
                    glow: "rgba(124,58,237,0.15)",
                    tag: "Cost Transparency",
                  },
                  {
                    num: "02",
                    icon: "fas fa-user-md",
                    title: "Expert Surgeons",
                    desc: "Locate board-certified specialist surgeons with verified credentials and patient reviews.",
                    accent: "from-[#0ea5e9] to-[#0369a1]",
                    cardBg: "from-[#f0f9ff] to-[#d5f0fc] border-sky-200/60 hover:border-[#0ea5e9]/40",
                    glow: "rgba(14,165,233,0.15)",
                    tag: "Verified Specialists",
                  },
                  {
                    num: "03",
                    icon: "fas fa-shield-alt",
                    title: "Safe & Reliable",
                    desc: "Book NABH-accredited partner clinics with proven safety protocols and track records.",
                    accent: "from-[#10b981] to-[#065f46]",
                    cardBg: "from-[#f0fdf4] to-[#d1fae5] border-emerald-200/60 hover:border-[#10b981]/40",
                    glow: "rgba(16,185,129,0.15)",
                    tag: "Accredited Clinics",
                  },
                ].map((card, idx) => (
                  <div
                    key={idx}
                    className={`group relative overflow-hidden rounded-[20px] border border-solid ${card.cardBg} bg-gradient-to-br p-6 transition-all duration-400 hover:-translate-y-1 cursor-pointer`}
                    style={{ transition: "all 0.35s cubic-bezier(0.4, 0, 0.2, 1)" }}
                    onMouseEnter={e => e.currentTarget.style.boxShadow = `0 20px 45px -10px ${card.glow}`}
                    onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
                  >
                    {/* Subtle gradient overlay on hover */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.accent} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-400 rounded-[20px]`}></div>

                    {/* Number watermark */}
                    <span className="absolute top-4 right-5 text-[52px] font-bold text-slate-200/30 leading-none select-none">{card.num}</span>

                    {/* Icon */}
                    <div className={`relative w-11 h-11 rounded-[14px] bg-gradient-to-br ${card.accent} flex items-center justify-center mb-5 shadow-sm`}>
                      <i className={`${card.icon} text-white text-[14px]`}></i>
                    </div>

                    {/* Tag */}
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full bg-gradient-to-r ${card.accent} text-white mb-3 opacity-95`}>
                      {card.tag}
                    </span>

                    {/* Title */}
                    <h5 className="text-[16px] font-semibold text-[#0f172a] mb-2 leading-snug">{card.title}</h5>

                    {/* Desc */}
                    <p className="text-[12px] text-[#64748b] font-light leading-relaxed">{card.desc}</p>

                    {/* Bottom arrow */}
                    <div className="mt-5 flex items-center gap-1.5">
                      <div className={`w-5 h-[1.5px] bg-gradient-to-r ${card.accent} rounded-full transition-all duration-300 group-hover:w-8`}></div>
                      <i className="fas fa-arrow-right text-slate-400 text-[9px] group-hover:text-[#7c3aed] transition-colors duration-300"></i>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </section>

          <section className="py-16 bg-white relative overflow-hidden">
            <style>{`
              .QuickAccessSlider .slick-dots {
                bottom: -24px !important;
                display: flex !important;
                justify-content: center;
                align-items: center;
                list-style: none;
                padding: 0;
                margin: 0;
              }
              .QuickAccessSlider .slick-dots li {
                margin: 0 4px !important;
                display: inline-block;
                width: auto !important;
                height: auto !important;
              }
              .QuickAccessSlider .slick-dots li button {
                width: 8px !important;
                height: 8px !important;
                padding: 0 !important;
                border-radius: 9999px !important;
                background-color: #e2e8f0 !important;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
                border: none !important;
                cursor: pointer;
                font-size: 0 !important;
                line-height: 0 !important;
              }
              .QuickAccessSlider .slick-dots li button:before {
                display: none !important;
              }
              .QuickAccessSlider .slick-dots li.slick-active button {
                width: 28px !important;
                height: 8px !important;
                background-color: #321961 !important;
              }
            `}</style>
            <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 50% at 20% 50%, rgba(124,58,237,0.04) 0%, transparent 70%), radial-gradient(ellipse 50% 60% at 80% 50%, rgba(14,165,233,0.04) 0%, transparent 70%)" }}></div>

            <div className="max-w-full mx-auto px-6 md:px-12 lg:px-20 relative z-10">

              {/* Section header */}
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-10 gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-6 h-[2px] bg-[#321961] rounded-full"></span>
                    <span className="text-[11px] text-[#321961] uppercase tracking-[0.25em] font-medium">Healthcare Access</span>
                  </div>
                  <h2 className="text-[32px] font-light text-[#0f172a] leading-tight tracking-tight">
                    Quick Access to <span className="text-[#321961] font-normal">Services</span>
                  </h2>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-[13px] text-[#94a3b8] font-light max-w-[280px] sm:text-right leading-relaxed hidden md:block">
                    Compare, book and connect with top healthcare providers near you.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => serviceSliderRef.current?.slickPrev()}
                      className="w-9 h-9 !rounded-full border border-solid border-[#e2e8f0] hover:border-[#321961] hover:bg-[#321961]/5 flex items-center justify-center text-[#64748b] hover:text-[#321961] transition-all duration-300 cursor-pointer shadow-sm"
                      aria-label="Previous Slide"
                    >
                      <i className="fas fa-chevron-left text-[12px]"></i>
                    </button>
                    <button
                      onClick={() => serviceSliderRef.current?.slickNext()}
                      className="w-9 h-9 !rounded-full border border-solid border-[#e2e8f0] hover:border-[#321961] hover:bg-[#321961]/5 flex items-center justify-center text-[#64748b] hover:text-[#321961] transition-all duration-300 cursor-pointer shadow-sm"
                      aria-label="Next Slide"
                    >
                      <i className="fas fa-chevron-right text-[12px]"></i>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bento grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Hero info card — left */}
                <div className="lg:col-span-4 rounded-sm p-7 flex flex-col justify-between min-h-[360px] relative overflow-hidden border border-solid border-white/10" style={{ background: "#7c3aed" }}>
                  {/* Watermark circle */}
                  <div className="absolute -bottom-10 -right-10 w-[180px] h-[180px] rounded-full border border-solid border-white/10"></div>
                  <div className="absolute -bottom-6 -right-6 w-[120px] h-[120px] rounded-full border border-solid border-white/10"></div>

                  <div>
                    <div className="w-11 h-11 rounded-[14px] bg-white/20 flex items-center justify-center mb-5">
                      <i className="fas fa-heartbeat text-white text-[18px]"></i>
                    </div>
                    <h3 className="text-[24px] font-light text-white leading-snug mb-3">
                      All your healthcare,<br />
                      <span className="font-semibold text-violet-250 text-[#eddffc]">one platform</span>
                    </h3>
                    <p className="text-[13px] text-white/80 font-light leading-relaxed">
                      Compare prices across 500+ hospitals and clinics. Book instantly. Get the best care at the price.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-6">
                    {[
                      { val: "500+", label: "Hospitals" },
                      { val: "10K+", label: "Patients" },
                      { val: "24/7", label: "Support" },
                    ].map((s, i) => (
                      <div key={i} className="bg-white/10 rounded-[12px] p-3 text-center">
                        <div className="text-[18px] font-semibold text-white">{s.val}</div>
                        <div className="text-[10px] text-white/60 font-light mt-0.5">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Service cards carousel — right */}
                <div className="lg:col-span-8 QuickAccessSlider">
                  <Slider
                    ref={serviceSliderRef}
                    dots={false}
                    infinite={true}
                    speed={500}
                    slidesToShow={3}
                    slidesToScroll={1}
                    arrows={false}
                    autoplay={true}
                    autoplaySpeed={3500}
                    responsive={[
                      {
                        breakpoint: 1024,
                        settings: {
                          slidesToShow: 2,
                          slidesToScroll: 1,
                        }
                      },
                      {
                        breakpoint: 640,
                        settings: {
                          slidesToShow: 1,
                          slidesToScroll: 1,
                        }
                      }
                    ]}
                  >
                    {[
                      {
                        icon: "fas fa-tooth",
                        title: "Dental Care",
                        desc: "Find top dentists and compare prices across clinics in your city.",
                        cta: "Browse Dentists",
                        link: "/dentalservice/all",
                        from: "#7c3aed",
                        to: "#4c1d95",
                        glow: "rgba(124,58,237,0.18)",
                        badge: "Oral Health",
                      },
                      {
                        icon: "fas fa-vial",
                        title: "Lab Tests",
                        desc: "Book diagnostic tests online and get reports delivered at home.",
                        cta: "Book a Test",
                        link: "/labtests/all",
                        from: "#0ea5e9",
                        to: "#0369a1",
                        glow: "rgba(14,165,233,0.18)",
                        badge: "Diagnostics",
                      },
                      {
                        icon: "fas fa-ambulance",
                        title: "Ambulance",
                        desc: "Emergency ambulance with 24/7 availability and real-time tracking.",
                        cta: "Book Now",
                        link: "/ambulanceservice",
                        from: "#f43f5e",
                        to: "#be123c",
                        glow: "rgba(244,63,94,0.18)",
                        badge: "Emergency",
                      },
                      {
                        icon: "fas fa-pills",
                        title: "Buy Medicines",
                        desc: "Compare and order prescriptions from local pharmacies.",
                        cta: "Explore",
                        link: "/medicine/all",
                        from: "#321961",
                        to: "#4c1d95",
                        glow: "rgba(50,25,97,0.18)",
                        badge: "Medicines",
                      },
                      {
                        icon: "fas fa-microscope",
                        title: "Diagnostics Lab",
                        desc: "Compare test packages & schedule sample collection.",
                        cta: "Book a Test",
                        link: "/diagnostics/all",
                        from: "#059669",
                        to: "#065f46",
                        glow: "rgba(5,150,105,0.18)",
                        badge: "Lab Tests",
                      },
                      {
                        icon: "fas fa-user-md",
                        title: "Surgical Care",
                        desc: "Explore surgeries, certified clinics, and surgeons.",
                        cta: "Explore",
                        link: "/surgeries/all",
                        from: "#8b5cf6",
                        to: "#6d28d9",
                        glow: "rgba(139,92,246,0.18)",
                        badge: "Surgeries",
                      }
                    ].map((card, idx) => (
                      <div key={idx} className="px-2 pb-6">
                        <div
                          onClick={() => navigate(card.link)}
                          className="group relative rounded-sm border border-solid bg-white cursor-pointer flex flex-col overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.04)]"
                          style={{ transition: "all 0.3s ease", minHeight: "280px", borderColor: `${card.from}22` }}
                          onMouseEnter={e => {
                            e.currentTarget.style.boxShadow = `0 20px 45px -8px ${card.glow}`;
                            e.currentTarget.style.borderColor = card.from;
                            e.currentTarget.style.transform = "translateY(-5px)";
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.04)";
                            e.currentTarget.style.borderColor = `${card.from}22`;
                            e.currentTarget.style.transform = "translateY(0)";
                          }}
                        >
                          {/* Colored top bar */}
                          <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${card.from}, ${card.to})` }}></div>

                          <div className="p-6 flex flex-col flex-1">
                            {/* Icon */}
                            <div
                              className="w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-105"
                              style={{ background: `linear-gradient(135deg, ${card.from}, ${card.to})`, boxShadow: `0 6px 20px ${card.glow}` }}
                            >
                              <i className={`${card.icon} text-white text-[18px]`}></i>
                            </div>

                            {/* Badge */}
                            <span
                              className="text-[10px] font-medium px-2.5 py-0.5 rounded-full mb-3 inline-block w-fit"
                              style={{ background: `${card.from}15`, color: card.from }}
                            >{card.badge}</span>

                            {/* Title */}
                            <h4 className="text-[15px] font-medium text-[#0f172a] mb-2">{card.title}</h4>

                            {/* Desc */}
                            <p className="text-[12px] text-[#64748b] font-light leading-relaxed flex-1">{card.desc}</p>

                            {/* Arrow CTA */}
                            <div
                              className="mt-5 flex items-center gap-1.5 text-[12px] font-medium transition-all duration-300 group-hover:gap-2.5"
                              style={{ color: card.from }}
                            >
                              <span>{card.cta}</span>
                              <i className="fas fa-arrow-right text-[10px]"></i>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </Slider>

                  {/* Horizontal Info Strip */}
                  <div
                    className="mt-2 p-4 rounded-sm bg-gradient-to-r from-[#f8f6fc] to-[#e0f2fe] border border-solid border-[#7c3aed]/15 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_15px_30px_rgba(124,58,237,0.06)] relative overflow-hidden group hover:scale-[1.01] transition-transform duration-300"
                  >
                    {/* Glowing glass overlay */}
                    <div className="absolute inset-0 bg-[#7c3aed]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute -top-10 -left-10 w-24 h-24 rounded-full bg-[#aa6df6]/10 blur-[20px]"></div>

                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-10 h-10 rounded-[14px] bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed] shrink-0 border border-solid border-[#7c3aed]/10 shadow-inner">
                        <i className="fas fa-magic text-[14px] animate-pulse"></i>
                      </div>
                      <div className="text-left">
                        <span className="text-[10px] font-bold tracking-wider text-[#7c3aed] uppercase block mb-0.5">Instant Assistance</span>
                        <p className="text-[12.5px] text-slate-600 font-light m-0 leading-relaxed">
                          Can't find a specific service? Get free support from our medical coordinators.
                        </p>
                      </div>
                    </div>

                    <Link
                      to="/contact-us"
                      className="relative z-10 px-5 py-2 rounded-full !bg-[#7c3aed] !text-white hover:bg-[#6d28d9] transition-all no-underline duration-300 text-[12.5px] !font-medium flex items-center gap-1.5 whitespace-nowrap shadow-md group-hover:-translate-x-1"
                    >
                      <span>Connect Now</span>
                      <i className="fas fa-arrow-right text-[10px]"></i>
                    </Link>

                  </div>

                </div>
              </div>
            </div>
          </section>

          <section
            className="py-2 lg:py-0 lg:h-[600px] flex items-center justify-center relative overflow-hidden"
            style={{
              backgroundImage: "url('/assets/workflow_background.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
            }}
          >
            {/* Soft modern glass overlay to maintain high contrast for cards */}
            <div className="absolute inset-0 bg-white/80 backdrop-blur-[1px] pointer-events-none"></div>

            {/* High-tech grid pattern overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25"></div>

            {/* Ambient gradients */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-[#ea580c]/5 blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#321961]/5 blur-[120px] pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10 text-center">

              {/* Centered header */}
              <div className="mb-16 max-w-2xl mx-auto">
                <div className="inline-flex items-center gap-1.5 bg-[#ea580c]/10 border border-solid border-[#ea580c]/20 py-1.5 px-4 rounded-full mb-4">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ea580c] animate-pulse"></span>
                  <span className="text-[11px] uppercase tracking-wider text-[#ea580c] font-medium">Simple Workflow</span>
                </div>
                <h2 className="text-[34px] font-light text-[#0f172a] leading-tight tracking-tight mb-3">
                  4 Easy Steps to Get <span className="font-normal text-[#ea580c]">Your Solution</span>
                </h2>
                <p className="text-[13.5px] text-[#64748b] font-light leading-relaxed tracking-wide">
                  <span className="font-semibold text-[#ea580c]">Compare pricing matrices</span>, <span className="font-semibold text-[#7c3aed]">verify compositions</span>, and get <span className="font-semibold text-[#10b981]">prompt home deliveries</span> with ease.
                </p>
              </div>

              {/* Horizontal stepper workflow */}
              <div className="relative">
                {/* Connecting timeline line for desktop */}
                <div className="hidden lg:block absolute top-[44px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-[#ea580c] via-[#7c3aed] to-[#10b981] opacity-20 pointer-events-none"></div>

                <style>{`
                  .flip-card-container {
                    perspective: 1000px;
                  }
                  .flip-card-inner {
                    position: relative;
                    width: 100%;
                    height: 100%;
                    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
                    transform-style: preserve-3d;
                  }
                  .flip-card-container:hover .flip-card-inner {
                    transform: rotateY(180deg);
                  }
                  .flip-card-front, .flip-card-back {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    -webkit-backface-visibility: hidden;
                    backface-visibility: hidden;
                    border-radius: 1.5rem;
                  }
                  .flip-card-back {
                    transform: rotateY(180deg);
                  }
                `}</style>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    {
                      step: "01",
                      title: "Search Products",
                      desc: "Look up your prescription, brand name, or generic salts.",
                      icon: "fas fa-search",
                      color: "#ea580c",
                      glow: "rgba(234,88,12,0.15)",
                    },
                    {
                      step: "02",
                      title: "Verify Salt Details",
                      desc: "Verify chemical compositions, dosage, and substitute drugs.",
                      icon: "fas fa-file-medical",
                      color: "#7c3aed",
                      glow: "rgba(124,58,237,0.15)",
                    },
                    {
                      step: "03",
                      title: "Compare Quotes",
                      desc: "Compare real-time pricing from verified local pharmacies.",
                      icon: "fas fa-balance-scale",
                      color: "#0ea5e9",
                      glow: "rgba(14,165,233,0.15)",
                    },
                    {
                      step: "04",
                      title: "Fast Delivery",
                      desc: "Place your order securely and get it delivered in minutes.",
                      icon: "fas fa-shipping-fast",
                      color: "#10b981",
                      glow: "rgba(16,185,129,0.15)",
                    }
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      className="flip-card-container w-full max-w-[230px] h-[240px] mx-auto relative select-none"
                    >
                      <div className="flip-card-inner">
                        {/* Front Side */}
                        <div
                          className="flip-card-front bg-white/95 backdrop-blur-md border border-solid flex flex-col items-center justify-between p-5 text-center shadow-[0_12px_30px_-5px_rgba(0,0,0,0.03)]"
                          style={{
                            borderColor: `${item.color}25`
                          }}
                        >
                          {/* Step index badge indicator */}
                          <div className="px-3 py-0.5 rounded-full bg-slate-50 text-[9px] font-bold tracking-wider uppercase border border-solid border-slate-200/60 shadow-sm" style={{ color: item.color }}>
                            Step {item.step}
                          </div>

                          {/* Icon with glowing background wrapper */}
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
                            style={{
                              background: `linear-gradient(135deg, ${item.color}15, ${item.color}05)`,
                              border: `1px solid ${item.color}30`,
                              boxShadow: `0 6px 15px -4px ${item.glow}`
                            }}
                          >
                            <i className={`${item.icon} text-[18px]`} style={{ color: item.color }}></i>
                          </div>

                          {/* Step Header */}
                          <h4 className="!text-[14px] font-semibold text-[#0f172a] mb-1 leading-tight">{item.title}</h4>

                          {/* Action Hint */}
                          <span className="text-[9px] text-slate-400 font-medium flex items-center gap-1 justify-center">
                            <span>Hover to reveal</span>
                            <i className="fas fa-sync text-[7px] animate-spin" style={{ animationDuration: '4s' }}></i>
                          </span>
                        </div>

                        {/* Back Side */}
                        <div
                          className="flip-card-back text-white flex flex-col items-center justify-between p-5 text-center shadow-lg"
                          style={{
                            background: `linear-gradient(135deg, ${item.color}, ${item.color}dd)`,
                            boxShadow: `0 15px 35px -8px ${item.glow}`
                          }}
                        >
                          <span className="text-[9px] font-mono tracking-widest text-white/60 uppercase">Step {item.step}</span>

                          <div className="my-auto flex flex-col gap-2">
                            <h4 className="text-[14px] font-bold text-white leading-tight">{item.title}</h4>
                            <p className="text-[11px] text-white/90 font-light leading-relaxed m-0 max-w-[180px] mx-auto">{item.desc}</p>
                          </div>

                          <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center text-[9px] text-white/80">
                            <i className="fas fa-check"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </section>

          <section className="py-24 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/4 left-0 w-[400px] h-[400px] rounded-full bg-[#7c3aed]/3 blur-[100px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] rounded-full bg-[#059669]/3 blur-[100px] pointer-events-none"></div>

            <div className="container mx-auto px-4 max-w-7xl relative z-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                {/* Left Side: Spotlight Big Feature Card */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                  <div className="text-left">
                    <div className="inline-flex items-center gap-1.5 bg-[#7c3aed]/10 border border-solid border-[#7c3aed]/20 py-1.5 px-4 rounded-full mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse"></span>
                      <span className="text-[11px] uppercase tracking-wider text-[#7c3aed] font-bold">Core Strengths</span>
                    </div>
                    <h2 className="text-[36px] font-light text-[#0f172a] leading-tight tracking-tight mb-4">
                      Key Features & <span className="font-normal text-[#7c3aed]">Benefits</span>
                    </h2>
                    <p className="text-[14.5px] text-[#64748b] font-light leading-relaxed max-w-[380px] mb-6">
                      Explore the tools that make Medicompare the smartest platform to compare prices, verify compostions, and buy medicines.
                    </p>
                  </div>

                  {/* Mega Spotlight Box */}
                  <div className="rounded-md p-8 text-slate-800 relative overflow-hidden shadow-[0_20px_50px_rgba(50,25,97,0.06)] border border-solid border-[#321961]/15" style={{ background: "linear-gradient(135deg, #f8f4ff 0%, #e8e3f5 100%)" }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#7c3aed]/10 blur-[25px] pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#0ea5e9]/5 blur-[25px] pointer-events-none"></div>

                    <div className="relative z-10 text-left">
                      <span className="text-[11px] font-bold text-[#7c3aed] tracking-widest uppercase block mb-3">Highlight Feature</span>
                      <h3 className="text-[28px] font-normal leading-snug mb-3 text-[#321961]">
                        Save Up to <span className="text-[#ea580c] font-semibold">40%</span> On Medical Bills
                      </h3>
                      <p className="text-[13.5px] text-slate-600 font-light leading-relaxed mb-6 tracking-wide">
                        <span className="font-medium text-[#321961]">Medicompare</span> queries over <span className="font-semibold text-slate-800">500+ local pharmacies</span> in real-time to find you the <span className="font-semibold text-[#059669]">lowest prices</span> and substitutes automatically.
                      </p>

                      {/* Mock Compare Strip */}
                      <div className="group/strip cursor-pointer bg-white/60 hover:bg-[#321961] rounded-sm p-4 border border-solid border-[#321961]/10 flex items-center justify-between transition-all duration-300 shadow-sm hover:shadow-sm">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#ea580c] group-hover/strip:bg-white/20 flex items-center justify-center text-[#ea580c] group-hover/strip:text-white transition-all duration-300">
                            <i className="fas fa-search-dollar text-[14px]"></i>
                          </div>
                          <div>
                            <div className="text-[12px] font-semibold !text-slate-800 group-hover/strip:!text-white transition-colors duration-300">Compare Prices</div>
                            <div className="text-[10px] !text-slate-500 group-hover/strip:text-white/70 transition-colors duration-300">500+ Verified Partners</div>
                          </div>
                        </div>
                        <i className="fas fa-arrow-right text-[#321961]/40 group-hover/strip:!text-white text-[12px] transition-colors duration-300"></i>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side: Staggered Asymmetrical Benefits List */}
                <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">

                  {/* Left Column of Staggered Grid */}
                  <div className="grid grid-cols-1 gap-6">
                    {[
                      {
                        id: 2,
                        title: "100% Genuine",
                        description: "Sourced directly from verified licensed pharmacies to guarantee quality.",
                        icon: "fas fa-shield-alt",
                        accent: "#10b981",
                        glow: "rgba(16,185,129,0.18)",
                      },
                      {
                        id: 4,
                        title: "Real-time Price Alerts",
                        description: "Track your prescriptions and get notified immediately when rates drop.",
                        icon: "fas fa-bell",
                        accent: "#f43f5e",
                        glow: "rgba(244,63,94,0.18)",
                      },
                      {
                        id: 6,
                        title: "Expert Support 24/7",
                        description: "Get instant support on generic substitutes and active medical salts.",
                        icon: "fas fa-user-md",
                        accent: "#8b5cf6",
                        glow: "rgba(139,92,246,0.18)",
                      }
                    ].map((card) => (
                      <div
                        key={card.id}
                        className="group relative bg-white border border-solid border-slate-200/60 rounded-sm p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        style={{ transition: "all 0.3s ease" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = `0 15px 35px -8px ${card.glow}`;
                          e.currentTarget.style.borderColor = card.accent;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.borderColor = "rgba(226,232,240,0.6)";
                        }}
                      >
                        {/* Dynamic colored accent bar on the left */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:w-1.5"
                          style={{ background: card.accent }}
                        ></div>

                        <div className="flex items-start gap-4 text-left pl-1">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md text-white transition-transform duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${card.accent}, ${card.accent}dd)`,
                              boxShadow: `0 4px 12px ${card.glow}`
                            }}
                          >
                            <i className={`${card.icon} text-[15px]`}></i>
                          </div>
                          <div>
                            <h4 className="!text-[15px] !font-semibold !text-[#0f172a] mb-1.5">{card.title}</h4>
                            <p className="!text-[12.5px] !text-[#64748b]/95 !font-light leading-relaxed m-0 tracking-wide">{card.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Right Column of Staggered Grid (Vertically Offset/Staggered) */}
                  <div className="grid grid-cols-1 gap-6 sm:mt-8">
                    {[
                      {
                        id: 3,
                        title: "Alternative Suggestions",
                        description: "Compare generic alternatives with the exact same chemical compositions.",
                        icon: "fas fa-exchange-alt",
                        accent: "#ea580c",
                        glow: "rgba(234,88,12,0.18)",
                      },
                      {
                        id: 5,
                        title: "Fast Doorstep Delivery",
                        description: "Order online for speedy home delivery or convenient local pickup.",
                        icon: "fas fa-truck",
                        accent: "#0ea5e9",
                        glow: "rgba(14,165,233,0.18)",
                      }
                    ].map((card) => (
                      <div
                        key={card.id}
                        className="group relative bg-white border border-solid border-slate-200/60 rounded-[20px] p-6 transition-all duration-300 hover:-translate-y-1 overflow-hidden"
                        style={{ transition: "all 0.3s ease" }}
                        onMouseEnter={e => {
                          e.currentTarget.style.boxShadow = `0 15px 35px -8px ${card.glow}`;
                          e.currentTarget.style.borderColor = card.accent;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.boxShadow = "none";
                          e.currentTarget.style.borderColor = "rgba(226,232,240,0.6)";
                        }}
                      >
                        {/* Dynamic colored accent bar on the left */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-[3px] transition-all duration-300 group-hover:w-1.5"
                          style={{ background: card.accent }}
                        ></div>

                        <div className="flex items-start gap-4 text-left pl-1">
                          <div
                            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-md text-white transition-transform duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${card.accent}, ${card.accent}dd)`,
                              boxShadow: `0 4px 12px ${card.glow}`
                            }}
                          >
                            <i className={`${card.icon} text-[15px]`}></i>
                          </div>
                          <div>
                            <h4 className="!text-[15px] !font-semibold !text-[#0f172a] mb-1.5">{card.title}</h4>
                            <p className="!text-[12.5px] !text-[#64748b]/95 !font-light leading-relaxed m-0 tracking-wide">{card.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          </section>




          {(() => {
            const sectionData = compareSection?.[0];
            const title = sectionData?.title || "See How Much You Can Save";
            const subtitle = sectionData?.subtitle || "Compare prices across multiple pharmacies and find the best deals. Our users save an average of 25-40% on their medicine bills every month.";
            const totalSaving = typeof sectionData?.totalSaving === 'number' ? `₹${sectionData.totalSaving}` : "₹2Cr+";
            const averageSaving = typeof sectionData?.averageSaving === 'number' ? `${sectionData.averageSaving}%` : "25-40%";

            const tabletName = sectionData?.tabletName?.[0] || "Paracetamol 500mg";

            const vendors = sectionData?.vendors || [];

            // Calculate dynamic savings if we have vendors
            let bestDealPrice = null;
            let maxPrice = 0;
            let savingsAmount = 13; // default fallback
            let savingsPercent = 29; // default fallback

            if (vendors.length > 0) {
              const prices = vendors.map(v => v.products?.[0]?.displayPrice).filter(p => typeof p === 'number');
              if (prices.length > 0) {
                const bestDealVendor = vendors.find(v => v.isBestDeal) || vendors[0];
                bestDealPrice = bestDealVendor?.products?.[0]?.displayPrice;
                maxPrice = Math.max(...prices);
                if (typeof bestDealPrice === 'number' && maxPrice > bestDealPrice) {
                  savingsAmount = maxPrice - bestDealPrice;
                  savingsPercent = Math.round((savingsAmount / maxPrice) * 100);
                } else {
                  savingsAmount = 0;
                  savingsPercent = 0;
                }
              }
            }

            const formattedSavingsAmount = savingsAmount % 1 === 0 ? savingsAmount : savingsAmount.toFixed(2);

            return (
              <section className="py-15 bg-gradient-to-br from-[#faf9fc] via-[#f1ebfa] to-[#ebdffc] text-slate-800 relative overflow-hidden">
                {/* Modern light mesh gradient background blobs */}
                <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#7c3aed]/8 blur-[90px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[450px] h-[450px] rounded-full bg-[#321961]/5 blur-[100px] pointer-events-none"></div>

                <div className="container mx-auto px-4 max-w-7xl relative z-10">

                  {/* Eyebrow and header */}
                  <div className="text-center mb-16 max-w-2xl mx-auto">
                    <div className="inline-flex items-center gap-1.5 bg-[#7c3aed]/10 border border-solid border-[#7c3aed]/25 py-1.5 px-4 rounded-full mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#7c3aed] animate-pulse"></span>
                      <span className="text-[11px] uppercase tracking-wider text-[#7c3aed] font-semibold">Visual comparison</span>
                    </div>
                    <h2 className="text-[36px] font-light text-[#0f172a] leading-tight tracking-tight mb-3">
                      How Much You Can <span className="font-normal text-[#7c3aed]">Really Save</span>
                    </h2>
                    <p className="text-[14px] text-[#64748b] font-light max-w-lg mx-auto">
                      Compare a standard offline pharmacy receipt with a Medicompare digital receipt to witness the price gap.
                    </p>
                  </div>

                  {/* Asymmetrical 3-Column Receipt Splitter */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                    {/* Bill A: Standard Retail Receipt */}
                    <div className="lg:col-span-4 bg-white text-slate-800 rounded-2xl p-6 shadow-[0_15px_35px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(239,68,68,0.06)] transition-all duration-300 relative flex flex-col justify-between overflow-hidden border border-solid border-red-100/80 min-h-[390px]">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#ef4444]"></div>
                      <div>
                        <div className="flex justify-between items-start border-b border-solid border-slate-100 pb-3 mb-4 font-mono text-[11px] text-slate-400">
                          <span>STANDARD RETAIL RATE</span>
                          <span>EST. HIGHEST SHOP</span>
                        </div>
                        <h4 className="text-[16px] font-semibold text-slate-700 font-mono mb-4 text-left">RETAIL INVOICE</h4>

                        <div className="flex flex-col gap-3 font-mono text-[13px] text-left">
                          <div className="flex justify-between">
                            <span>1x {tabletName}</span>
                            <span className="font-semibold text-slate-600">₹{maxPrice || 45.00}</span>
                          </div>
                          <div className="flex justify-between text-slate-400">
                            <span>Estimated Local Markup</span>
                            <span>₹15.00</span>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mt-8 border-t border-dashed border-slate-200 pt-4 text-left font-mono">
                          <div className="flex justify-between items-center text-[15px] font-bold text-slate-800">
                            <span>TOTAL DUE</span>
                            <span className="text-[#ef4444]">₹{maxPrice ? (maxPrice + 15) : 60.00}</span>
                          </div>
                          <span className="text-[9px] text-[#ef4444] bg-[#ef4444]/5 px-2 py-0.5 rounded-full mt-2 inline-block">Estimated standard retail shop rate</span>
                        </div>

                        {/* Stylized Receipt Barcode for Standard Retail */}
                        {/* <div className="mt-4 flex flex-col items-center opacity-30 hover:opacity-60 transition-opacity duration-300 select-none">
                          <div className="flex gap-[2.5px] h-5 items-stretch">
                            <div className="w-[1.5px] bg-slate-800"></div>
                            <div className="w-[2px] bg-slate-800"></div>
                            <div className="w-[1px] bg-slate-800"></div>
                            <div className="w-[4px] bg-slate-800"></div>
                            <div className="w-[1px] bg-slate-800"></div>
                            <div className="w-[2px] bg-slate-800"></div>
                            <div className="w-[1.5px] bg-slate-800"></div>
                            <div className="w-[3px] bg-slate-800"></div>
                            <div className="w-[2px] bg-slate-800"></div>
                            <div className="w-[1px] bg-slate-800"></div>
                            <div className="w-[4px] bg-slate-800"></div>
                            <div className="w-[1px] bg-slate-800"></div>
                          </div>
                          <span className="text-[7.5px] font-mono tracking-[0.3em] mt-1.5 text-slate-500">MC-RETAIL-OVERPAY</span>
                        </div> */}
                      </div>
                    </div>

                    {/* Column 2: VS Divider & Live Stats */}
                    <div className="lg:col-span-4 flex flex-col justify-center items-center gap-6 text-center py-6 lg:py-0">
                      <div className="relative flex items-center justify-between my-2 w-full max-w-[340px] gap-2">
                        <style>{`
                          @keyframes compareSway {
                            0%, 100% { transform: translateX(0); }
                            25% { transform: translateX(-8px); }
                            75% { transform: translateX(8px); }
                          }
                          @keyframes swipeLeft {
                            0%, 100% { transform: translateX(0); opacity: 0.4; }
                            50% { transform: translateX(-6px); opacity: 1; }
                          }
                          @keyframes swipeRight {
                            0%, 100% { transform: translateX(0); opacity: 0.4; }
                            50% { transform: translateX(6px); opacity: 1; }
                          }
                          .animate-compare-sway {
                            animation: compareSway 4s ease-in-out infinite;
                          }
                          .animate-swipe-left {
                            animation: swipeLeft 2s ease-in-out infinite;
                          }
                          .animate-swipe-right {
                            animation: swipeRight 2s ease-in-out infinite;
                          }
                        `}</style>

                        {/* Left Retail Pointer */}
                        <div className="text-[#ef4444] animate-swipe-left text-[12px] flex items-center gap-1 font-semibold select-none shrink-0">
                          <i className="fas fa-chevron-left text-[9px]"></i>
                          <span className="text-[13px] font-mono tracking-tighter uppercase">Other's</span>
                        </div>

                        {/* VS Circle */}
                        <div className="w-16 h-16 shrink-0 rounded-full bg-gradient-to-br from-[#321961] to-[#7c3aed] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(50,25,97,0.3)] relative z-10 transition-transform duration-500 hover:scale-110 hover:rotate-12 cursor-default animate-compare-sway">
                          <span className="text-[18px] font-bold tracking-widest font-mono">VS</span>
                        </div>

                        {/* Right Savings Pointer */}
                        <div className="text-[#7c3aed] animate-swipe-right text-[12px] flex items-center gap-1 font-semibold select-none shrink-0">
                          <span className="text-[13px] font-mono tracking-tighter uppercase">Medicompares</span>
                          <i className="fas fa-chevron-right text-[9px]"></i>
                        </div>
                      </div>

                      <div className="p-6 rounded-md bg-white border border-solid border-[#7c3aed]/15 shadow-[0_15px_35px_rgba(0,0,0,0.03)] hover:shadow-[0_20px_50px_rgba(124,58,237,0.06)] transition-all duration-300 w-full">
                        <h4 className="text-[20px] font-medium text-[#0f172a] mb-2">Smart Price Check</h4>
                        <p className="text-[12.5px] text-[#64748b] font-light leading-relaxed mb-4">
                          Medicompare acts as your digital broker, sorting through regional pharmacy databases to slice your margins.
                        </p>

                        <div className="bg-[#7c3aed]/10 border border-solid border-[#7c3aed]/20 rounded-md p-3.5 mb-4">
                          <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-0.5">Average savings</span>
                          <span className="text-[22px] font-bold text-[#7c3aed]">Save {savingsPercent}% Instantly</span>
                        </div>

                        <Link
                          to="/medicine/all"
                          className="!bg-gradient-to-r from-[#321961] to-[#7c3aed] text-white hover:from-[#4c2d96] hover:to-[#6d28d9] py-3 px-6 rounded-full font-semibold text-[13.5px] no-underline inline-flex items-center gap-2 transition-all duration-300 w-full justify-center shadow-md shadow-indigo-500/10"
                        >
                          <span>Compare live prices</span>
                          <i className="fas fa-arrow-right text-[10px]"></i>
                        </Link>
                      </div>
                    </div>

                    {/* Bill B: Medicompare Glowing Digital Invoice (Scaled up & Highlighted) */}
                    <div className="lg:col-span-4 bg-gradient-to-b from-white to-[#f5f3ff]/70 text-slate-800 rounded-2xl p-6 shadow-[0_25px_60px_rgba(124,58,237,0.1)] hover:shadow-[0_25px_60px_rgba(124,58,237,0.18)] transition-all duration-300 relative flex flex-col justify-between overflow-hidden scale-[1.03] lg:scale-[1.05] z-10 min-h-[390px] border border-solid border-[#7c3aed]/20">
                      <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#7c3aed]"></div>

                      {/* Premium Authentic Watermark Stamp */}
                      <div className="absolute -right-4 top-10 opacity-[0.07] pointer-events-none -rotate-12 select-none">
                        <i className="fas fa-shield-alt text-[100px] text-[#7c3aed]"></i>
                      </div>

                      <div>
                        <div className="flex justify-between items-center border-b border-solid border-slate-100 pb-3 mb-4 font-mono text-[11px] text-[#7c3aed] font-semibold">
                          <span>MEDICOMPARES</span>
                          <span className="flex items-center gap-1"><i className="fas fa-star text-[9px] animate-pulse"></i> BEST DEAL</span>
                        </div>
                        <h4 className="text-[16px] font-semibold text-slate-700 font-mono mb-4 text-left flex items-center gap-1.5">
                          <span>SAVINGS INVOICE</span>
                        </h4>

                        <div className="flex flex-col gap-2 font-mono text-[12px] text-left">
                          {vendors.length > 0 ? (
                            vendors.map((vendor, idx) => {
                              const price = vendor.products?.[0]?.displayPrice;
                              const isBest = vendor.isBestDeal;
                              const name = vendor.businessdetails?.name || "Pharmacy";

                              return (
                                <div
                                  key={vendor._id || idx}
                                  className={`flex justify-between items-center py-1.5 px-2.5 rounded-lg border border-solid transition-all duration-300 ${isBest
                                    ? "bg-[#7c3aed]/8 border-[#7c3aed]/25 shadow-[0_4px_12px_rgba(124,58,237,0.06)] scale-[1.02] text-slate-800"
                                    : "border-transparent bg-transparent text-slate-500"
                                    }`}
                                >
                                  <span className={isBest ? "text-[#7c3aed] font-semibold flex items-center gap-1.5 min-w-0" : "text-slate-500 truncate"}>
                                    <span className="truncate max-w-[100px] sm:max-w-[130px] block">{name}</span>
                                    {isBest && <span className="text-[9px] text-white bg-[#7c3aed] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 shadow-sm">Best Deal</span>}
                                  </span>
                                  <span className={`font-semibold shrink-0 ${isBest ? "text-[#7c3aed] text-[13px]" : "text-slate-600"}`}>
                                    ₹{price}
                                  </span>
                                </div>
                              );
                            })
                          ) : (
                            <>
                              <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg border border-solid border-transparent text-slate-500 min-w-0">
                                <span className="truncate max-w-[100px] sm:max-w-[130px] block">Pharmacy A</span>
                                <span className="font-semibold text-slate-600 shrink-0">₹45.00</span>
                              </div>
                              <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg border border-solid bg-[#7c3aed]/8 border-[#7c3aed]/25 shadow-[0_4px_12px_rgba(124,58,237,0.06)] scale-[1.02] text-slate-800 min-w-0">
                                <span className="text-[#7c3aed] font-semibold flex items-center gap-1.5 min-w-0">
                                  <span className="truncate max-w-[100px] sm:max-w-[130px] block">Pharmacy B</span>
                                  <span className="text-[9px] text-white bg-[#7c3aed] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 shadow-sm">Best Deal</span>
                                </span>
                                <span className="text-[#7c3aed] font-bold text-[13px] shrink-0">₹32.00</span>
                              </div>
                              <div className="flex justify-between items-center py-1.5 px-2.5 rounded-lg border border-solid border-transparent text-slate-500 min-w-0">
                                <span className="truncate max-w-[100px] sm:max-w-[130px] block">Pharmacy C</span>
                                <span className="text-slate-600 font-semibold shrink-0">₹50.00</span>
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="mt-8 border-t border-dashed border-slate-200 pt-4 text-left font-mono">
                          <div className="flex justify-between items-center text-[15px] font-bold text-slate-800">
                            <span>BEST PRICE</span>
                            <span className="text-[#7c3aed] text-[17px]">₹{bestDealPrice || 32.00}</span>
                          </div>
                          <span className="text-[10px] text-[#7c3aed] bg-[#7c3aed]/10 border border-solid border-[#7c3aed]/25 px-2.5 py-1 rounded-full mt-2 inline-flex items-center gap-1 font-semibold">
                            <i className="fas fa-piggy-bank text-[10px]"></i>
                            Saved ₹{formattedSavingsAmount} {vendors.length > 0 ? "" : "per strip"}
                          </span>
                        </div>

                        {/* Stylized Receipt Barcode */}
                        {/* <div className="mt-4 flex flex-col items-center opacity-40 hover:opacity-75 transition-opacity duration-300 select-none">
                          <div className="flex gap-[2.5px] h-5 items-stretch">
                            <div className="w-[2px] bg-slate-800"></div>
                            <div className="w-[1px] bg-slate-800"></div>
                            <div className="w-[3px] bg-slate-800"></div>
                            <div className="w-[1px] bg-slate-800"></div>
                            <div className="w-[2px] bg-slate-800"></div>
                            <div className="w-[4px] bg-slate-800"></div>
                            <div className="w-[1.5px] bg-slate-800"></div>
                            <div className="w-[3px] bg-slate-800"></div>
                            <div className="w-[2px] bg-slate-800"></div>
                            <div className="w-[1px] bg-slate-800"></div>
                            <div className="w-[4px] bg-slate-800"></div>
                            <div className="w-[2px] bg-slate-800"></div>
                          </div>
                          <span className="text-[7.5px] font-mono tracking-[0.3em] mt-1.5 text-slate-500">MC-DEAL-ACTIVE</span>
                        </div> */}
                      </div>
                    </div>

                  </div>
                </div>
              </section>
            );
          })()}











          {testimonials && testimonials.length > 0 && (
            <section
              className="py-12 bg-[#f8f9fa]"
            >
              <div className="container mx-auto px-4">
                <div
                  className="text-center mb-10 aos"
                  data-aos="fade-up"
                >
                  <div
                    className="mb-2 inline-block py-[8px] px-[20px] bg-gradient-to-br from-[#7d2eff]/10 to-[#3b82f6]/10 rounded-[50px] text-[14px] font-semibold text-[#321961]"
                  >
                    <i className="fas fa-bolt mr-[8px]"></i>
                    Reviews
                  </div>
                  <h2 className="!text-[28px] !font-semibold mb-2">What Our Users Say</h2>
                  <p
                    className="text-[#6b7280] text-[14px] max-w-[600px] mx-auto mt-[8px] mb-0 font-normal"
                  >
                    Read what our satisfied customers have to say about our
                    services, doctors, and platform. Real reviews from real users
                    who have experienced the benefits of our medical comparison
                    platform.
                  </p>
                </div>

                <div className="mt-8 aos" data-aos="fade-up">
                  {homeLiteMode ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {testimonials.slice(0, 3).map((review) => (
                        <div key={review._id}>
                          {renderTestimonialCard(review)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Slider {...bestDoctorsSlider}>
                      {testimonials.map((review) => (
                        <div key={review._id} className="px-1">
                          {renderTestimonialCard(review)}
                        </div>
                      ))}
                    </Slider>
                  )}
                </div>
              </div>
            </section>
          )}


          {((row1 && row1.length > 0) || (row2 && row2.length > 0)) && (
            <section className="py-20 bg-gradient-to-br from-[#faf9fc] via-[#f1ebfa] to-[#e8e2f2] overflow-hidden relative">
              <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes marquee-left {
                  0% { transform: translateX(0); }
                  100% { transform: translateX(-50%); }
                }
                @keyframes marquee-right {
                  0% { transform: translateX(-50%); }
                  100% { transform: translateX(0); }
                }
                .animate-marquee-left-scroll {
                  display: flex;
                  width: max-content;
                  animation: marquee-left 45s linear infinite;
                }
                .animate-marquee-right-scroll {
                  display: flex;
                  width: max-content;
                  animation: marquee-right 45s linear infinite;
                }
                .marquee-track-container:hover .animate-marquee-left-scroll,
                .marquee-track-container:hover .animate-marquee-right-scroll {
                  animation-play-state: paused;
                }
              `}} />

              <div className="max-w-full mx-auto px-6 md:px-12 lg:px-20 relative z-10">
                <div className="text-center mb-14" data-aos="fade-up">
                  <div className="inline-flex items-center gap-1.5 bg-[#321961]/10 border border-solid border-[#321961]/25 py-1.5 px-4 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse"></span>
                    <span className="text-[11px] uppercase tracking-wider text-[#321961] font-bold">Our Partners</span>
                  </div>
                  <h2 className="text-[34px] font-light text-[#0f172a] leading-tight tracking-tight mb-3">
                    Trusted Network of Healthcare <span className="font-normal text-[#059669]">Partners</span>
                  </h2>
                  <p className="text-[13.5px] text-slate-600 font-light leading-relaxed max-w-lg mx-auto">
                    Collaborating with India's top certified pharmacies, diagnostic labs, and medical providers to bring you the best prices.
                  </p>
                </div>
              </div>

              {/* Infinite Scrolling Marquee Track Container */}
              <div className="marquee-track-container flex flex-col gap-6 w-full relative">
                {/* Row 1: Scrolling Left */}
                {repeatedRow1.length > 0 && (
                  <div className="overflow-hidden w-full select-none py-2">
                    <div className="animate-marquee-left-scroll gap-5 px-3">
                      {repeatedRow1.map((vendor, idx) => {
                        const name = vendor?.businessdetails?.[0].name || vendor?.name || "Partner Store";
                        const bDetails = vendor?.businessdetails?.[0] || vendor?.bussinessdetails || vendor?.businessDetails;
                        const bImg = bDetails?.bussiness_image || vendor?.bussiness_image || vendor?.image;
                        const logoSrc = Array.isArray(bImg)
                          ? (bImg[0]?.url || (typeof bImg[0] === 'string' ? bImg[0] : null))
                          : (bImg?.url || (typeof bImg === 'string' ? bImg : (bDetails?.logo || vendor?.logo)));

                        return (
                          <div
                            key={`r1-${vendor._id || idx}-${idx}`}
                            onClick={() => handleVendorClick(vendor)}
                            className="w-[280px] h-[88px] bg-white rounded-xl border border-solid border-[#321961]/10 p-3 flex flex-row items-center gap-3.5 cursor-pointer transition-all duration-300 hover:border-[#321961]/35 hover:shadow-[0_8px_25px_rgba(50,25,97,0.06)] hover:-translate-y-1 relative group overflow-hidden shrink-0"
                          >
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#321961]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="w-[64px] h-[64px] rounded-lg bg-white flex items-center justify-center p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
                              {logoSrc ? (
                                <img
                                  src={getImageUrl(logoSrc)}
                                  alt={name}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.nextSibling;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                style={{ display: logoSrc ? 'none' : 'flex' }}
                                className="w-full h-full rounded-lg bg-gradient-to-br from-[#321961] to-[#7d2eff] text-white font-bold items-center justify-center text-lg uppercase"
                              >
                                {name ? name[0] : 'V'}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="!text-[15px] font-semibold text-slate-800 m-0 leading-snug whitespace-normal break-words w-full capitalize group-hover:text-[#059669] transition-colors duration-300 font-sans tracking-wide">
                                {name}
                              </h4>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Row 2: Scrolling Right */}
                {repeatedRow2.length > 0 && (
                  <div className="overflow-hidden w-full select-none py-2">
                    <div className="animate-marquee-right-scroll gap-5 px-3">
                      {repeatedRow2.map((vendor, idx) => {
                        const name = vendor?.businessdetails?.[0]?.name || vendor?.name || "Partner Store";
                        const bDetails = vendor?.businessdetails?.[0] || vendor?.bussinessdetails || vendor?.businessDetails;
                        const bImg = bDetails?.bussiness_image || vendor?.bussiness_image || vendor?.image;
                        const logoSrc = Array.isArray(bImg)
                          ? (bImg[0]?.url || (typeof bImg[0] === 'string' ? bImg[0] : null))
                          : (bImg?.url || (typeof bImg === 'string' ? bImg : (bDetails?.logo || vendor?.logo)));

                        return (
                          <div
                            key={`r2-${vendor._id || idx}-${idx}`}
                            onClick={() => handleVendorClick(vendor)}
                            className="w-[280px] h-[88px] bg-white rounded-xl border border-solid border-[#321961]/10 p-3 flex flex-row items-center gap-3.5 cursor-pointer transition-all duration-300 hover:border-[#321961]/35 hover:shadow-[0_8px_25px_rgba(50,25,97,0.06)] hover:-translate-y-1 relative group overflow-hidden shrink-0"
                          >
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#321961]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                            <div className="w-[64px] h-[64px] rounded-lg bg-white flex items-center justify-center p-1.5 shadow-sm transition-transform duration-300 group-hover:scale-105 shrink-0">
                              {logoSrc ? (
                                <img
                                  src={getImageUrl(logoSrc)}
                                  alt={name}
                                  className="w-full h-full object-contain mix-blend-multiply"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const fallback = e.target.nextSibling;
                                    if (fallback) fallback.style.display = 'flex';
                                  }}
                                />
                              ) : null}
                              <div
                                style={{ display: logoSrc ? 'none' : 'flex' }}
                                className="w-full h-full rounded-lg bg-gradient-to-br from-[#321961] to-[#7d2eff] text-white font-bold items-center justify-center text-lg uppercase"
                              >
                                {name ? name[0] : 'V'}
                              </div>
                            </div>

                            <div className="flex-1 min-w-0 text-left">
                              <h4 className="!text-[15px] font-semibold text-slate-800 m-0 leading-snug whitespace-normal break-words w-full capitalize group-hover:text-[#059669] transition-colors duration-300 font-sans tracking-wide">
                                {name}
                              </h4>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}


          {faqss && faqss.length > 0 && (
            <section className="py-12 bg-white">
              <div className="container mx-auto px-4">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 bg-[#321961]/10 border border-solid border-[#321961]/20 py-1.5 px-4 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#321961] animate-pulse"></span>
                    <span className="text-[11px] uppercase tracking-wider text-[#321961] font-bold">FAQ Support</span>
                  </div>
                  <h2 className="text-[34px] font-light text-[#0f172a] leading-tight tracking-tight mb-3">
                    Frequently Asked <span className="font-normal text-[#321961]">Questions</span>
                  </h2>
                  <p className="text-[13.5px] text-[#64748b] font-light leading-relaxed max-w-lg mx-auto tracking-wide">
                    Find the <span className="font-semibold text-[#321961]">best medicine prices</span>, ensure <span className="font-semibold text-[#059669]">authenticity</span> with verified products, explore <span className="font-semibold text-[#7c3aed]">cost-effective alternatives</span>, and get instant answers.
                  </p>
                </div>

                {/* Desktop Split-Pane View */}
                <div className="hidden lg:grid grid-cols-12 gap-8 items-stretch">
                  {/* Left: Interactive Question Cards */}
                  <div className="col-span-5 flex flex-col gap-3 justify-center">
                    {faqss.map((faq, index) => {
                      const isActive = openIndex === index;
                      return (
                        <div
                          key={index}
                          onClick={() => toggleAccordion(index)}
                          className={`p-4.5 rounded-md border-2 border-solid cursor-pointer text-left transition-all duration-300 flex items-center justify-between gap-4 ${isActive
                            ? "bg-gradient-to-r from-white to-[#faf9fc] border-[#321961] shadow-[0_12px_30px_rgba(50,25,97,0.06)] translate-x-2"
                            : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 shadow-sm"
                            }`}
                        >
                          <span className={`text-[14.5px] font-semibold transition-colors duration-200 ${isActive ? "text-[#321961]" : "text-slate-700"}`}>
                            {faq.question}
                          </span>
                          <i className={`fas fa-chevron-right text-[12px] transition-transform duration-300 ${isActive ? "text-[#321961] translate-x-1" : "text-slate-400"}`}></i>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right: Glowing Spotlight Answer Panel */}
                  <div className="col-span-7">
                    <div className="bg-gradient-to-br from-[#7c3aed] to-[#5b21b6] rounded-md p-8 text-white shadow-[0_20px_50px_rgba(124,58,237,0.15)] h-full flex flex-col justify-between relative overflow-hidden min-h-[380px] border border-solid border-white/10">
                      {/* Decorative glowing blobs */}
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/10 blur-[30px] pointer-events-none"></div>
                      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-[#10b981]/10 blur-[30px] pointer-events-none"></div>

                      <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-center h-full">
                        {/* Left Column: Text Content */}
                        <div className="md:col-span-7 text-left flex flex-col justify-between h-full">
                          <div>
                            {/* Eyebrow badge */}
                            <div className="inline-flex items-center gap-1.5 bg-white/15 border border-solid border-white/20 py-1 px-3.5 rounded-full mb-6">
                              <i className="fas fa-magic text-[#ebdffc] text-[10px] animate-pulse"></i>
                              <span className="text-[10px] uppercase tracking-wider text-[#ebdffc] font-semibold">Answer Spotlight</span>
                            </div>

                            {/* Title and Answer */}
                            <h4 className="text-[17px] font-semibold text-white mb-4 leading-snug">
                              {faqss[openIndex === null ? 0 : openIndex]?.question}
                            </h4>
                            <p className="text-[12.5px] text-white/85 font-light leading-relaxed mb-6">
                              {faqss[openIndex === null ? 0 : openIndex]?.answer}
                            </p>
                          </div>

                          {/* Bottom Quick Help Section */}
                          <div className="pt-4 border-t border-solid border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5 text-left">
                              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white shrink-0">
                                <i className="fas fa-comment-dots text-[11px]"></i>
                              </div>
                              <div>
                                <div className="text-[8.5px] text-white/50 uppercase tracking-wider">Still have questions?</div>
                                <div className="text-[11px] font-semibold text-white">Get real-time support</div>
                              </div>
                            </div>
                            {/* <Link
                              to="/contact"
                              className="px-4 py-2 rounded-full bg-white text-[#321961] hover:bg-[#c4b5fd] hover:text-white transition-all duration-300 text-[11.5px] font-semibold no-underline shadow-md shadow-white/5 shrink-0"
                            >
                              Chat Now
                            </Link> */}
                          </div>
                        </div>

                        {/* Right Column: Dynamic Question Image */}
                        <div className="md:col-span-5 flex justify-center items-center h-full relative">
                          <img
                            src={(() => {
                              const qText = (faqss[openIndex === null ? 0 : openIndex]?.question || "").toLowerCase();
                              if (qText.includes("authentic") || qText.includes("genuine") || qText.includes("safe") || qText.includes("original") || qText.includes("quality")) {
                                return "/assets/faq_authenticity.png";
                              } else if (qText.includes("substitute") || qText.includes("alternative") || qText.includes("generic") || qText.includes("salt")) {
                                return "/assets/faq_substitute.png";
                              } else if (qText.includes("delivery") || qText.includes("shipping") || qText.includes("speed") || qText.includes("home")) {
                                return "/assets/faq_delivery.png";
                              } else if (qText.includes("prescription") || qText.includes("require") || qText.includes("rx") || qText.includes("upload")) {
                                return "/assets/faq_prescription.png";
                              }
                              return "/assets/faq_pricing.png";
                            })()}
                            className="max-h-[220px] object-contain transition-all duration-500 transform hover:scale-105 filter drop-shadow-[0_12px_25px_rgba(0,0,0,0.15)]"
                            key={openIndex} // Triggers React reflow/fade animation on index change
                            alt="Question illustration"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Mobile Accordion View */}
                <div className="block lg:hidden w-full">
                  <div className="flex flex-col gap-3">
                    {faqss.map((faq, index) => {
                      const isOpen = openIndex === index;
                      return (
                        <div className={`bg-white rounded-xl border transition-all duration-300 overflow-hidden ${isOpen ? 'border-[#321961] shadow-[0_8px_20px_rgba(50,25,97,0.08)]' : 'border-gray-200 shadow-sm'}`} key={index}>
                          <h2 className="m-0">
                            <button
                              type="button"
                              onClick={() => toggleAccordion(index)}
                              aria-expanded={isOpen}
                              className="flex items-center justify-between w-full p-4 font-semibold text-left border-none bg-white hover:bg-gray-50/50 transition-colors cursor-pointer gap-4"
                            >
                              <span className={`flex-1 text-[14px] font-semibold tracking-tight transition-colors duration-200 ${isOpen ? 'text-[#321961]' : 'text-gray-800'}`}>
                                {faq.question}
                              </span>
                              <i
                                className={`fa-solid fa-chevron-down text-gray-400 text-[12px] transition-transform duration-300 ${isOpen ? 'rotate-180 text-[#321961]' : ''} shrink-0`}
                                aria-hidden="true"
                              />
                            </button>
                          </h2>

                          <div
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[500px] opacity-100 border-t border-gray-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
                          >
                            <div className="p-4 bg-[#faf9fc]/40 text-[13px] text-gray-500 leading-relaxed">
                              <p className="m-0">{faq.answer}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>
          )}

          {blogss && blogss.length > 0 && (
            <section
              className="py-12 relative overflow-hidden"
              style={{
                backgroundColor: "#E8E4F5",
                backgroundImage: homeLiteMode
                  ? "none"
                  : "url('/assets/Medicompares%20Background.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
              }}
            >
              <div className="container mx-auto px-4">
                <div className="text-center mb-16 max-w-2xl mx-auto">
                  <div className="inline-flex items-center gap-1.5 bg-[#321961]/10 border border-solid border-[#321961]/20 py-1.5 px-4 rounded-full mb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#321961] animate-pulse"></span>
                    <span className="text-[11px] uppercase tracking-wider text-[#321961] font-bold">Our Blogs</span>
                  </div>
                  <h2 className="text-[34px] font-light text-[#0f172a] leading-tight tracking-tight mb-3">
                    Insights & Tips on <span className="font-normal text-[#321961]">Medicines</span>
                  </h2>
                  <p className="text-[13.5px] text-[#64748b] font-light leading-relaxed max-w-lg mx-auto">
                    Stay informed with our latest blog posts on medicine pricing, authentic products, cost-effective alternatives, and smart savings tips.
                  </p>
                </div>
                {homeLiteMode ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
                    {blogss.slice(0, 3).map((blog, index) => {
                      const BLOG_DESC_LIMIT = 120;
                      const plainDescription = (blog.description || "")
                        .replace(/<[^>]*>/g, "")
                        .trim();
                      const isLongDescription =
                        plainDescription.length > BLOG_DESC_LIMIT;
                      const shortDescription = isLongDescription
                        ? `${plainDescription.slice(0, BLOG_DESC_LIMIT)}...`
                        : plainDescription;

                      return (
                        <div key={index} className="flex flex-col h-full w-full">
                          <div
                            onClick={() => getByBlogDetails(blog)}
                            className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_12px_rgba(128,89,202,0.1)] border border-solid border-[#321961]/10 transition-all duration-300 ease flex flex-col flex-1 cursor-pointer hover:shadow-[0_8px_24px_rgba(128,89,202,0.15)] h-full w-full"
                          >
                            <div
                              className="relative w-full h-[200px] overflow-hidden bg-[#f8f4ff] flex items-center justify-center shrink-0"
                            >
                              <img
                                src={getImageUrl(blog.files[0])}
                                alt={blog.title}
                                loading={index < 2 ? "eager" : "lazy"}
                                decoding="async"
                                className="w-full h-full"
                                style={{ objectFit: "contain", width: "100%", height: "100%" }}
                              />
                            </div>
                            <div className="p-[14px] flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-[10px] flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getImageUrl(blog.files[0])}
                                      alt={blog.title}
                                      loading="lazy"
                                      className="w-[32px] h-[32px] rounded-full object-cover border-2 border-solid border-[#e5e7eb]"
                                    />
                                    <span className="text-[13px] font-medium text-[#4b5563]">
                                      {blog.title.slice(0, 12)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-[6px] text-[13px] text-[#9ca3af]">
                                    <i className="fas fa-calendar-alt" />
                                    <span>{blog.createdAt?.slice(0, 10)}</span>
                                  </div>
                                </div>

                                <h3 className="!text-[16px] !font-semibold text-[#321961] mb-[4px] leading-[1.4] line-clamp-1 truncate">
                                  {blog.title}
                                </h3>

                                <div className="text-[14px] text-[#6b7280] leading-[1.6]">
                                  <p className="m-0 text-[14px] text-[#6b7280] leading-[1.6] line-clamp-3">
                                    {shortDescription}
                                  </p>
                                </div>
                              </div>

                              {isLongDescription && (
                                <div className="mt-2 pt-2 border-t border-slate-50">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      getByBlogDetails(blog);
                                    }}
                                    className="p-0 border-none bg-none !text-[#321961] !text-[13px] !font-semibold cursor-pointer flex items-center gap-1"
                                  >
                                    Read more <i className="fas fa-arrow-right text-[10px]" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Slider {...blogsSettings} className="equal-height-slider">
                    {blogss.map((blog, index) => {
                      const BLOG_DESC_LIMIT = 120;
                      const plainDescription = (blog.description || "")
                        .replace(/<[^>]*>/g, "")
                        .trim();
                      const isLongDescription =
                        plainDescription.length > BLOG_DESC_LIMIT;
                      const shortDescription = isLongDescription
                        ? `${plainDescription.slice(0, BLOG_DESC_LIMIT)}...`
                        : plainDescription;

                      return (
                        <div className="px-2 h-full flex flex-col w-full" key={index}>
                          <div
                            onClick={() => getByBlogDetails(blog)}
                            className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_12px_rgba(128,89,202,0.1)] border border-solid border-[#321961]/10 transition-all duration-300 ease flex flex-col flex-1 cursor-pointer hover:shadow-[0_8px_24px_rgba(128,89,202,0.15)] h-full w-full"
                          >
                            <div
                              className="relative w-full h-[200px] overflow-hidden bg-[#f8f4ff] flex items-center justify-center shrink-0"
                            >
                              <img
                                src={getImageUrl(blog.files[0])}
                                alt={blog.title}
                                loading={index < 3 ? "eager" : "lazy"}
                                fetchPriority={index === 0 ? "high" : "auto"}
                                decoding="async"
                                className="w-full h-full"
                                style={{ objectFit: "contain", width: "100%", height: "100%" }}
                              />
                            </div>
                            <div className="p-[14px] flex-1 flex flex-col justify-between">
                              <div>
                                <div className="flex items-center gap-3 mb-[10px] flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={getImageUrl(blog.files[0])}
                                      alt={blog.title}
                                      loading="lazy"
                                      className="w-[32px] h-[32px] rounded-full object-cover border-2 border-solid border-[#e5e7eb]"
                                    />
                                    <span className="text-[13px] font-medium text-[#4b5563]">
                                      {blog.title.slice(0, 12)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-[6px] text-[13px] text-[#9ca3af]">
                                    <i className="fas fa-calendar-alt" />
                                    <span>{blog.createdAt?.slice(0, 10)}</span>
                                  </div>
                                </div>

                                <h3 className="!text-[16px] !font-semibold text-[#321961] mb-[4px] leading-[1.4] line-clamp-1 truncate">
                                  {blog.title}
                                </h3>

                                <div className="text-[14px] text-[#6b7280] leading-[1.6]">
                                  <p className="m-0 text-[14px] text-[#6b7280] leading-[1.6] line-clamp-3">
                                    {shortDescription}
                                  </p>
                                </div>
                              </div>

                              {isLongDescription && (
                                <div className="mt-2 pt-2 border-t border-slate-50">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      getByBlogDetails(blog);
                                    }}
                                    className="p-0 border-none bg-none !text-[#321961] !text-[13px] !font-semibold cursor-pointer flex items-center gap-1"
                                  >
                                    Read more <i className="fas fa-arrow-right text-[10px]" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                )}

                {/* View All Blogs Button */}
                <div className="text-center mt-10" data-aos="fade-up">
                  <button
                    type="button"
                    onClick={() => navigate("/blogs")}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-[#321961] hover:bg-[#6d48b8] !text-white !text-sm !font-semibold !rounded-full shadow-lg shadow-[#321961]/25 hover:shadow-xl hover:shadow-[#321961]/35 transition-all duration-200 cursor-pointer active:scale-[0.98] border-none"
                  >
                    View All Blogs <i className="fas fa-arrow-right text-xs"></i>
                  </button>
                </div>
              </div>
            </section>
          )}



          <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
              <div className="bg-gradient-to-br from-[#1e0a3d] via-[#321961] to-[#4c1d95] rounded-md p-8 lg:p-12 relative overflow-hidden shadow-[0_20px_50px_rgba(50,25,97,0.2)]">
                {/* Decorative floating background elements */}
                <div className="absolute top-[-20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-[#7c3aed]/15 blur-[60px] pointer-events-none"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] rounded-full bg-[#10b981]/10 blur-[50px] pointer-events-none"></div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">

                  {/* Left Column: Floating Phone Mockup */}
                  <div
                    className="lg:col-span-5 flex justify-center aos"
                    data-aos="fade-up"
                  >
                    <div className="max-w-[280px] lg:max-w-full relative">
                      {/* Soft backdrop glow behind phone */}
                      <div className="absolute inset-0 bg-[#7c3aed]/25 rounded-full filter blur-[40px] transform scale-75 animate-pulse pointer-events-none"></div>
                      <img
                        src="/assets/mobileapp.png"
                        className="max-w-full h-auto object-contain relative z-10 animate-[float_4s_ease-in-out_infinite]"
                        alt="Medicompare Mobile App Mockup"
                        title="Medicompare Mobile App"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>

                  {/* Right Column: Content and Download Access */}
                  <div className="lg:col-span-7 text-left">
                    <div className="app-content flex flex-col gap-6">

                      {/* Eyebrow and main header */}
                      <div className="aos" data-aos="fade-up">
                        <div className="inline-flex items-center gap-1.5 bg-white/10 border border-solid border-white/20 py-1.5 px-4 rounded-full mb-4 backdrop-blur-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"></span>
                          <span className="text-[11px] uppercase tracking-wider text-[#10b981] font-bold">Go Mobile</span>
                        </div>
                        <h2 className="text-[32px] lg:text-[40px] font-bold text-white leading-tight tracking-tight">
                          Compare & Save On the Go
                        </h2>
                        <p className="text-[14px] text-slate-200/90 font-light mt-3 leading-relaxed max-w-xl">
                          Download India's #1 medicine price comparison app. Check live pricing, upload prescriptions, and track deliveries straight from your phone.
                        </p>
                      </div>

                      {/* Key Features Bullet List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-2 text-white">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#10b981] shrink-0">
                            <i className="fas fa-search-dollar text-[12px]"></i>
                          </div>
                          <span className="text-[13px] font-medium text-slate-200">Real-Time Price Checks</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#10b981] shrink-0">
                            <i className="fas fa-file-prescription text-[12px]"></i>
                          </div>
                          <span className="text-[13px] font-medium text-slate-200">Easy Rx Uploads</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#10b981] shrink-0">
                            <i className="fas fa-bell text-[12px]"></i>
                          </div>
                          <span className="text-[13px] font-medium text-slate-200">Instant Price Alerts</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#10b981] shrink-0">
                            <i className="fas fa-truck-loading text-[12px]"></i>
                          </div>
                          <span className="text-[13px] font-medium text-slate-200">Fast Doorstep Delivery</span>
                        </div>
                      </div>

                      {/* Download Section (Buttons + QR Code) */}
                      <div className="flex flex-col sm:flex-row items-center gap-6 mt-4 pt-6 border-t border-solid border-white/10">
                        {/* Store Buttons */}
                        <div className="flex flex-col gap-3 w-full sm:w-auto shrink-0">
                          <a
                            href="https://play.google.com/store/apps/details?id=com.medicompares.medicompares"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-transform duration-300 hover:scale-[1.03] block"
                          >
                            <img
                              src="/assets/img/icons/playstore.svg"
                              alt="Download Play Store"
                              className="h-[44px]"
                            />
                          </a>
                          <a
                            href="https://www.apple.com/app-store/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="transition-transform duration-300 hover:scale-[1.03] block"
                          >
                            <img
                              src="/assets/img/icons/app-store-icon.svg"
                              alt="Download App Store"
                              className="h-[44px]"
                            />
                          </a>
                        </div>

                        {/* Scanner QR Card */}
                        <div className="flex items-center gap-4 bg-white/5 border border-solid border-white/10 p-3.5 rounded-2xl backdrop-blur-md w-full sm:w-auto">
                          <div className="w-[84px] h-[84px] bg-white rounded-xl p-1.5 shadow-md flex items-center justify-center shrink-0">
                            <QRCodeSVG
                              value="https://play.google.com/store/apps/details?id=com.medicompares.medicompares"
                              size={72}
                              level="H"
                              imageSettings={{
                                src: "/favicon.png",
                                height: 12,
                                width: 12,
                                excavate: true,
                              }}
                            />
                          </div>
                          <div className="text-left">
                            <div className="text-[10px] text-white/50 uppercase tracking-widest font-semibold mb-0.5">Quick Download</div>
                            <h5 className="text-[13px] font-bold text-white mb-1">Scan QR Code</h5>
                            <p className="text-[11px] text-slate-300/80 leading-normal m-0 max-w-[130px]">
                              Point your phone camera to scan and download instantly.
                            </p>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* <Modal
        show={show}
        onHide={handleClose}
        centered
        style={{ zIndex: 9999999999999, backgroundColor: "#010101db" }}
        backdrop="static"
      >
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={handleClose}
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
            className="absolute top-[10px] right-[10px] z-[10000] bg-[#dc3545] border-none text-white rounded-full w-[25px] h-[25px] flex items-center justify-center cursor-pointer text-[16px]"
          >
            Ãƒâ€”
          </button>

          <Modal.Body className="p-0">
            <div className="call-box incoming-box">
              <img
                alt="coming-soon"
                title="coming-soon"
                src="/assets/img/products/commingsoon.jpg"
                style={{ width: "100%", height: "auto", objectFit: "cover" }}
              />
            </div>
          </Modal.Body>
        </div>
      </Modal> */}
          {/* <CustomerReviewsSuccessModal/> */}


          <PrescriptionUploadModal
            show={showPrescriptionModal}
            onClose={() => setShowPrescriptionModal(false)}
            onValidated={handlePrescriptionSearchCompleted}
            mode="search"
            pincode={selectedPincode}
            lat={latitude}
            lng={longitude}
          />
          <VendorOffersModal show={!!vendorModel} onClose={() => setVendorModel(null)} product={vendorModel} />
          <MicPermissionModal />
          <Home2Footer />
        </div>
      )}
    </>
  );
};



export default Home2;
