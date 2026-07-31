import React, { useEffect, useState, useRef, useMemo, useLayoutEffect } from "react";
import Home2Header from "../../../../components/home/Header-k";
import SEOHelmet from "../../../../components/SEOHelmet";
import Home2Footer from "../../../../components/home/Footer-f";
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
} from "../../../../Apiservice";
import { useMediaQuery } from "react-responsive";
import MedicineSection from "../../../../components/home/MedicineSection";
import "../../../../components/home/home-enhanced.css";
import { useLocation as useLocationContext } from "../../../../context/LocationContext";
import CustomerReviewsSuccessModal from "../../pharmacy/products-components/CustomerReviewSuccessModal";
import DynamicCategorySections from "../../../../components/home/DynamicCategorySections";
import PageLoader from "../../../../components/ui/PageLoader.jsx";
import { getImageUrl } from "../../../../utils";
import PrescriptionUploadModal from "../../../../components/pharmacy/PrescriptionUploadModal";
import {
  collectHomeImagePaths,
  prefetchImageUrls,
  preloadStaticImages,
} from "../../../../utils/prefetchImages";
import { shouldUseHomeLiteMode } from "../../../../utils/devicePerformance";
import {
  getMedicinePincodeFromStorage,
  getProductNavigation,
} from "../../../../utils/productUtils";

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
  const [isListening, setIsListening] = useState(false);
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
  const { service } = useParams();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });
  const [openIndex, setOpenIndex] = useState(null);
  const searchRef = useRef("");
  const searchInputRef = useRef(null);
  const heroTypeRef = useRef(null);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const homeLiteMode = useMemo(() => shouldUseHomeLiteMode(), []);

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

  const [recognition, setRecognition] = useState(null);

  const startVoiceRecognition = () => {
    if (recognition) {
      try {
        recognition.stop();
        recognition.onstart = null;
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
      } catch (error) { }
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Your browser does not support voice search");
      return;
    }

    const newRecognition = new SpeechRecognition();

    newRecognition.lang = "en-IN";
    newRecognition.interimResults = false;
    newRecognition.continuous = false;

    newRecognition.onstart = () => {
      setIsListening(true);
    };

    newRecognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setQuery(voiceText);
      handleChange({ target: { value: voiceText } });
      setIsListening(false);
    };

    newRecognition.onerror = (event) => {
      setIsListening(false);

      if (event.error === "not-allowed") {
        toast.error("Microphone permission denied");
      } else if (event.error === "no-speech") {
        toast.error("No voice detected");
      } else {
        toast.error("Voice recognition failed");
      }
    };

    newRecognition.onend = () => {
      setIsListening(false);
    };

    try {
      newRecognition.start();
      setIsListening(true);
      setRecognition(newRecognition);
    } catch (error) {
      // Handle error silently or show toast if needed
    }
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
        testimonial,
        sections,
      } = homeResponse.data.data;

      setCategories(categories);
      setblogss(blogs);
      setTestimonials(testimonial?.testimonial || []);
      setMediciness(topsalesproductvendor);
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
    return () => {
      if (recognition) {
        try {
          recognition.stop();
          recognition.onstart = null;
          recognition.onresult = null;
          recognition.onerror = null;
          recognition.onend = null;
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    };
  }, [recognition]);

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
              className="w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#8059ca] to-[#3b82f6] flex items-center justify-center text-white text-[24px] font-bold uppercase"
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
          className={`main-wrapper${homeLiteMode ? " home-lite-page" : ""} overflow-x-hidden w-full font-['Poppins',sans-serif] ${homeLiteMode ? "overflow-y-visible h-auto" : "overflow-y-hidden h-full"
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
                  <h1 className="m-0 !mb-[10px] !text-[clamp(17px,4vw,45px)] font-semibold text-[#343434]">
                    Compare &amp; Choose{" "}
                    <span className="text-[#8059ca]">
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
                    <span className="font-semibold text-[#8059ca]"> MediCompares</span>
                  </p>
                </div>
                <section
                  className="p-[30px] md:py-0 md:px-[10px] relative mt-[10px] mobileview z-[9]"
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
                              >
                                <form onSubmit={(e) => e.preventDefault()}>
                                  <div
                                    className="bg-white rounded-[30px] border border-solid border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-250 ease-in-out overflow-hidden relative flex items-center p-2 gap-2"
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
                                      className="search-input !border-none !outline-none flex-1 text-[clamp(14px,2vw,16px)] p-0 text-[#111827] bg-transparent font-inherit font-normal min-w-0"
                                    />

                                    {isLoading && (
                                      <div
                                        className="google-dots absolute right-[70px] top-1/2 -translate-y-1/2"
                                      >
                                        <span className="dott blue" />
                                        <span className="dott red" />
                                        <span className="dott yellow" />
                                        <span className="dott green" />
                                      </div>
                                    )}
                                    {/* 
                                <button
                                  type="button"
                                  title="Upload prescription"
                                  onClick={() => setShowPrescriptionModal(true)}
                                  style={{
                                    background: "transparent",
                                    color: "rgb(107, 114, 128)",
                                    border: "1.5px solid rgb(229, 231, 235)",
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
                                    marginRight: "4px",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#7c3aed";
                                    e.currentTarget.style.borderColor = "#7c3aed";
                                    e.currentTarget.style.backgroundColor = "#f5f3ff";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "rgb(107, 114, 128)";
                                    e.currentTarget.style.borderColor = "rgb(229, 231, 235)";
                                    e.currentTarget.style.backgroundColor = "transparent";
                                  }}
                                >
                                  <i className="fa-solid fa-file-medical" style={{ fontSize: "12px" }}></i>
                                </button> */}

                                    <button
                                      type="button"
                                      title="Voice search"
                                      onClick={startVoiceRecognition}
                                      className={`rounded-[6px] p-[2px] w-[25px] h-[25px] flex items-center justify-center cursor-pointer transition-all duration-200 ease shrink-0 ${isListening
                                        ? "bg-[#e0f2fe] text-[#0284c7] border-[1.5px] border-solid border-[#0284c7] shadow-[0_0_6px_rgba(2,132,199,0.6)]"
                                        : "bg-transparent text-[rgb(107,114,128)] border-[1.5px] border-solid border-[rgb(229,231,235)] shadow-none"
                                        }`}
                                    >
                                      <svg
                                        width={14}
                                        height={14}
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
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
                                        className="absolute top-full left-0 right-0 mt-0 bg-white rounded-[10px] border-[1.5px] border-solid border-[#e5e7eb] shadow-[0_20px_40px_rgba(0,0,0,0.12),0_8px_16px_rgba(0,0,0,0.08)] z-[999999] max-h-[400px] overflow-y-auto overflow-x-hidden animate-[fadeInUp_0.2s_ease-out]"
                                      >
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
                                            <button
                                              key={item._id || item.tablet?._id || index}
                                              onClick={() => handleSelect(item)}
                                              className={`w-full p-[10px] border-none bg-transparent text-left cursor-pointer text-[15px] text-[#111827] flex z-[9999999] items-center justify-between gap-[14px] transition-all duration-200 ease relative hover:bg-[#f9fafb] ${index < filteredSuggestions.length - 1
                                                ? "border-b border-solid border-[#f3f4f6]"
                                                : "border-b-0"
                                                }`}
                                            >
                                              <div className="flex items-center gap-[14px]">
                                                <div
                                                  className="text-[#9ca3af] shrink-0"
                                                >
                                                  <i className="fas fa-search"></i>
                                                </div>
                                                <div className="flex flex-col">
                                                  <span
                                                    className="flex-1 leading-[1.5] capitalize"
                                                  >
                                                    {highlightMatch(
                                                      item.tablet?.name,
                                                      query,
                                                    )}
                                                  </span>

                                                  {item.tablet?.packagingDetails && (
                                                    <span className="text-[11px] text-[#888] mt-[2px]">
                                                      {item?.tablet?.packagingDetails}
                                                    </span>
                                                  )}
                                                </div>
                                              </div>
                                              <span
                                                className="text-[10px] text-[#666] bg-[#f0f0f0] py-[2px] px-[8px] rounded-[12px] whitespace-nowrap ml-[8px] capitalize"
                                              >
                                                {item?.type === "package"
                                                  ? item?.type
                                                  : item?.tablet?.category?.fixedType === "medicine"
                                                    ? (item?.tablet?.medicineType || "product")
                                                    : (item?.tablet?.category?.name || "product")}
                                              </span>
                                            </button>
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
                                              : "text-[#8059ca] cursor-pointer bg-[#f9fafb] hover:bg-[#f1f5f9]"
                                              }`}
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
              </div>
            </div>
          </section>

          {categories && categories.length > 0 && (
            <section
              className="specialities-section-one overflow-hidden"
            >
              <div className="container">
                <div
                  className="row d-none d-lg-block mt-0"
                >
                  <div className="col-md-12">
                    <div className="section-header-one section-header-slider text-center">
                      <h2
                        className="mb-[12px] !text-[23px] !font-semibold"
                      >
                        Explore Multiple Categories Compare
                      </h2>
                      <p
                        className="text-[13px] max-w-[700px] mx-auto mb-[20px] leading-[1.6]"
                      >
                        Browse a wide range of medicines across various categories.
                        Compare prices, read detailed information, and find the best
                        options for your health needs.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="row row-cols-7 row-cols-xxl-7 row-cols-xl-6 row-cols-lg-6 rows-cols-md-6 justify-content-center mt-3">
                  {categories.map((item, categoryIndex) => (
                    <div className="col-6 d-flex col-lg-2 col-sm-6" key={item._id}>
                      <div
                        className="serv-wrap medi-bg flex-fill cursor-pointer"
                        onClick={() => handleCategoryClick(item)}
                      >
                        <span>
                          <img
                            src={
                              item?.files
                                ? getImageUrl(item.files)
                                : "/assets/default.png"
                            }
                            alt={item.name}
                            title={item.name}
                            className="h-[50px]"
                            loading={categoryIndex < 8 ? "eager" : "lazy"}
                            fetchPriority={categoryIndex < 4 ? "high" : "auto"}
                            decoding="async"
                          />
                        </span>
                        <h4>{item.name}</h4>
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
              iconColor="#8059ca"
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
                        color: "#8059ca",
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
                        color: "#8059ca",
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
                        color: "#8059ca",
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
          <DynamicCategorySections
            sections={sections.filter(sec => sec.title?.toLowerCase() !== "top most medicines" && sec.title?.toLowerCase() !== "top sales medicines")}
            onProductClick={handleProductClick}
            onCompareClick={handleCompareDynamic}
            onVendorClick={handleVendorClick}
            imgUrl={imgUrl}
            liteMode={homeLiteMode}
            isMobile={isMobile}
          />

          {/* PROMOTIONAL BANNER */}
          <section className="my-4 px-3">
            <div className="container-fluid">
              <div
                className={`bg-[#AA6DF6] rounded-[20px] relative overflow-hidden shadow-[0_10px_30px_rgba(128,89,202,0.3)] flex items-center justify-between ${isMobile
                  ? "p-[30px_20px] flex-col min-h-auto text-center gap-[20px]"
                  : "p-[20px_40px] flex-row min-h-[150px] text-left gap-0"
                  }`}
              >
                {/* Abstract Shapes */}
                <div
                  className="absolute top-[-50px] right-[-50px] w-[150px] h-[150px] rounded-full bg-white/10"
                ></div>
                <div
                  className="absolute bottom-[-30px] left-[100px] w-[150px] h-[150px] rounded-full bg-white/5"
                ></div>

                <div
                  className="relative z-10 text-white max-w-[600px]"
                >
                  <span
                    className="bg-white/20 py-[6px] px-[16px] rounded-[30px] text-[13px] font-semibold inline-block mb-[15px] border border-solid border-white/30"
                  >
                    <i className="fas fa-heartbeat me-2"></i> Complete Healthcare
                  </span>
                  <h2
                    className={`font-extrabold mb-[10px] text-white ${isMobile ? "text-[20px]" : "text-[24px]"
                      }`}
                  >
                    Your Trusted Healthcare Partner
                  </h2>
                  <p
                    className={`opacity-90 m-0 text-white ${isMobile ? "text-[14px]" : "text-[16px]"
                      }`}
                  >
                    Access quality healthcare services, medicines, diagnostics, and
                    expert consultation all in one place.
                  </p>
                </div>

                <div className="relative z-10">
                  <button
                    className="btn bg-white text-[#8059ca] py-[12px] px-[30px] rounded-[50px] font-bold text-[13px] shadow-[0_5px_15px_rgba(0,0,0,0.1)] border-none"
                    onClick={() => {
                      localStorage.setItem("fixedType", "medicine");
                      navigate("/medicine/all");
                    }}
                  >
                    Explore Services <i className="fas fa-arrow-right ms-2"></i>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section
            className={`py-3 home-bg-pattern-section`}
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

            <div className="container">
              <div className="text-center mb-5 aos" data-aos="fade-up">
                <h2
                  className="!text-[28px] !font-semibold mb-[12px] inline-block w-full bg-gradient-to-br from-[#8059ca] to-[#6d48b8] bg-clip-text text-transparent text-[#8059ca]"
                >
                  Explore Surgeries
                </h2>
                <p
                  className="text-[14px] text-[#6b7280] max-w-[700px] mx-auto mb-[20px] leading-[1.6]"
                >
                  Discover a wide range of surgical procedures across various
                  medical specialties. Compare prices, read patient reviews, and
                  find the best surgeons and hospitals near you.
                </p>
                <div
                  className="row g-3 justify-content-center mb-4 max-w-[800px] mx-auto"
                >
                  <div className="col-md-4 col-sm-6">
                    <div
                      className="group p-[16px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:scale-[1.02]"
                    >
                      <div
                        className="w-[50px] h-[50px] mx-auto mb-[12px] bg-gradient-to-br from-[#8059ca] to-[#6d48b8] rounded-[12px] flex items-center justify-center text-[24px] text-white relative transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      >
                        <i className="fas fa-search-dollar transition-all duration-300 group-hover:scale-110"></i>
                      </div>
                      <h5
                        className="!text-[16px] !font-semibold text-[#1f2937] mb-[6px]"
                      >
                        Compare Prices
                      </h5>
                      <p className="text-[13px] text-[#6b7280] m-0">
                        Compare costs across multiple hospitals
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div
                      className="group p-[16px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:scale-[1.02]"
                    >
                      <div
                        className="w-[50px] h-[50px] mx-auto mb-[12px] bg-gradient-to-br from-[#8059ca] to-[#6d48b8] rounded-[12px] flex items-center justify-center text-[24px] text-white relative transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      >
                        <i className="fas fa-user-md transition-all duration-300 group-hover:scale-110"></i>
                      </div>
                      <h5
                        className="!text-[16px] !font-semibold text-[#1f2937] mb-[6px]"
                      >
                        Expert Surgeons
                      </h5>
                      <p className="text-[13px] text-[#6b7280] m-0">
                        Find experienced and qualified surgeons
                      </p>
                    </div>
                  </div>
                  <div className="col-md-4 col-sm-6">
                    <div
                      className="group p-[16px] bg-white rounded-[12px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-center cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:scale-[1.02]"
                    >
                      <div
                        className="w-[50px] h-[50px] mx-auto mb-[12px] bg-gradient-to-br from-[#8059ca] to-[#6d48b8] rounded-[12px] flex items-center justify-center text-[24px] text-white relative transition-all duration-300 group-hover:scale-110 group-hover:rotate-6"
                      >
                        <i className="fas fa-shield-alt transition-all duration-300 group-hover:scale-110"></i>
                      </div>
                      <h5
                        className="!text-[16px] !font-semibold text-[#1f2937] mb-[6px]"
                      >
                        Safe & Reliable
                      </h5>
                      <p className="text-[13px] text-[#6b7280] m-0">
                        Trusted hospitals with proven track records
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="py-4"
            style={{
              background:
                "linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f0f4ff 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >

            <div className="quick-access-bg-shape quick-access-bg-shape-1"></div>
            <div className="quick-access-bg-shape quick-access-bg-shape-2"></div>
            <div className="container relative z-10">
              <div className="row align-items-center g-4">
                <div className="col-lg-5 col-md-12 aos" data-aos="fade-right">
                  <div className="relative">
                    <div
                      className="inline-block py-[8px] px-[20px] bg-gradient-to-br from-[#8059ca]/20 to-[#6d48b8]/20 rounded-[50px] mb-[10px] text-[14px] font-semibold text-[#8059ca]"
                    >
                      <i
                        className="fas fa-clock mr-[8px] text-[#8059ca]"
                      ></i>
                      Instant Healthcare Access
                    </div>
                    <h2
                      className="!text-[28px] md:!text-[32px] !font-semibold text-[#1a1a1a] mb-[10px] tracking-normal leading-[1.3]"
                    >
                      Quick Access to{" "}
                      <span
                        className="bg-gradient-to-br from-[#8059ca] via-[#3b82f6] to-[#059669] bg-[length:200%_200%] bg-clip-text text-transparent animate-[gradient_3s_ease_infinite]"
                      >
                        Healthcare Services
                      </span>
                    </h2>
                    <p
                      className="text-[#4b5563] text-[14px] font-normal leading-[1.7]"
                    >
                      Get instant access to Dental, lab tests, and emergency
                      ambulance services. Compare prices, book appointments, and
                      find the best healthcare providers near you all in one place.
                    </p>

                    <div>
                      {[
                        {
                          icon: "fas fa-check-circle",
                          text: "Compare prices across multiple providers",
                        },
                        {
                          icon: "fas fa-check-circle",
                          text: "Book appointments instantly online",
                        },
                        {
                          icon: "fas fa-check-circle",
                          text: "24/7 emergency services available",
                        },
                      ].map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center mb-[14px]"
                        >
                          <div
                            className="w-[32px] h-[32px] rounded-[8px] bg-gradient-to-br from-[#8059ca] to-[#6d48b8] flex items-center justify-center mr-[14px] shrink-0"
                          >
                            <i
                              className={`${feature.icon} text-white text-[14px]`}
                            ></i>
                          </div>
                          <span
                            className="text-[#374151] text-[14px] font-medium"
                          >
                            {feature.text}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div
                      className="flex gap-[15px] flex-wrap p-[12px] bg-gradient-to-br from-[#7d2eff]/5 to-[#3b82f6]/5 rounded-[16px] border border-solid border-[#7d2eff]/10"
                    >
                      {/* Hospitals */}
                      <div
                        className="flex items-center gap-[12px]"
                      >
                        <i
                          className="fa fa-hospital text-[28px] text-[#8059ca]"
                        ></i>
                        <div
                          className="flex flex-col leading-[1.2]"
                        >
                          <span
                            className="text-[22px] bg-gradient-to-br from-[#8059ca] to-[#3b82f6] bg-clip-text text-transparent font-semibold"
                          >
                            500+
                          </span>
                          <span className="text-[12px] font-medium">
                            Hospitals
                          </span>
                        </div>
                      </div>

                      <div
                        className="flex items-center gap-[12px]"
                      >
                        <i
                          className="fa fa-smile text-[28px] text-[#3b82f6]"
                        ></i>
                        <div
                          className="flex flex-col leading-[1.2]"
                        >
                          <span
                            className="text-[22px] bg-gradient-to-br from-[#3b82f6] to-[#059669] bg-clip-text text-transparent font-semibold"
                          >
                            10K+
                          </span>
                          <span className="text-[12px] font-medium">
                            Happy Patients
                          </span>
                        </div>
                      </div>

                      {/* Support */}
                      <div
                        className="flex items-center gap-[12px]"
                      >
                        <i
                          className="fa fa-headset text-[28px] text-[#059669]"
                        ></i>
                        <div
                          className="flex flex-col leading-[1.2]"
                        >
                          <span
                            className="text-[22px] bg-gradient-to-br from-[#059669] to-[#10b981] bg-clip-text text-transparent font-semibold"
                          >
                            24/7
                          </span>
                          <span className="text-[12px] font-medium">
                            Support
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-lg-7 col-md-12">
                  <div className="row g-1">
                    {[
                      {
                        id: 1,
                        title: "Dental",
                        description:
                          "Find the best dental care options and compare prices",
                        icon: "fas fa-tooth",
                        gradient:
                          "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
                        hoverGradient:
                          "linear-gradient(135deg, #822BD4 0%, #8059ca 100%)",
                        shadowColor: "rgba(125, 46, 255, 0.25)",
                        topBarGradient:
                          "linear-gradient(90deg, #8059ca, #3b82f6, #822BD4)",
                        link: "/dentalservice",
                      },
                      {
                        id: 2,
                        title: "Lab Tests",
                        description:
                          "Book lab tests online and get results quickly",
                        icon: "fas fa-vial",
                        gradient:
                          "linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)",
                        hoverGradient:
                          "linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)",
                        shadowColor: "rgba(59, 130, 246, 0.25)",
                        topBarGradient:
                          "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)",
                        link: "/labtests",
                      },
                      {
                        id: 3,
                        title: "Ambulance",
                        description: "Emergency ambulance services available 24/7",
                        icon: "fas fa-ambulance",
                        gradient:
                          "linear-gradient(135deg, #dc2626 0%, #ef4444 100%)",
                        hoverGradient:
                          "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
                        shadowColor: "rgba(220, 38, 38, 0.25)",
                        topBarGradient:
                          "linear-gradient(90deg, #dc2626, #ef4444, #f87171)",
                        link: "/ambulanceservice",
                      },
                    ].map((item, index) => (
                      <div key={item.id} className="col-md-12">
                        <div
                          className={`quick-access-card group aos p-[12px] rounded-[14px] bg-white border-2 border-solid border-transparent transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_3px_15px_rgba(0,0,0,0.08)] relative overflow-hidden cursor-pointer hover:-translate-y-[8px] hover:scale-[1.02] ${item.gradient.includes("#8059ca")
                            ? "hover:shadow-[0_12px_40px_rgba(125,46,255,0.25)] hover:border-[#8059ca]"
                            : item.gradient.includes("#3b82f6")
                              ? "hover:shadow-[0_12px_40px_rgba(59,130,246,0.25)] hover:border-[#3b82f6]"
                              : "hover:shadow-[0_12px_40px_rgba(220,38,38,0.25)] hover:border-[#dc2626]"
                            }`}
                          data-aos="fade-up"
                          data-aos-delay={index * 100}
                          onClick={() => navigate(item.link)}
                          style={{
                            animationDelay: `${index * 0.1}s`,
                          }}
                        >
                          <div
                            className="absolute top-0 left-0 right-0 h-[3px] scale-x-0 origin-left transition-transform duration-400 ease group-hover:scale-x-100"
                            style={{
                              background: item.topBarGradient,
                            }}
                          />
                          <div
                            className="flex items-center gap-4"
                          >
                            <div
                              className="quick-access-icon-wrapper relative inline-block shrink-0"
                            >
                              <div
                                className="quick-access-icon w-[60px] h-[60px] rounded-[14px] flex items-center justify-center text-[24px] text-white relative z-[1] transition-all duration-300 ease group-hover:scale-110 group-hover:rotate-6"
                                style={{
                                  background: item.gradient,
                                  boxShadow: `0 6px 20px ${item.shadowColor}`,
                                }}
                              >
                                <i className={item.icon}></i>
                              </div>
                            </div>
                            <div className="flex-1 text-left">
                              <h4
                                className="!text-[16px] !font-semibold mb-[6px] text-[#1f2937] leading-[1.3]"
                              >
                                {item.title}
                              </h4>
                              <p
                                className="text-[#6b7280] text-[13px] leading-[1.5] m-0 mb-[8px]"
                              >
                                {item.description}
                              </p>
                              <div
                                className={`inline-flex items-center gap-[6px] text-[13px] font-semibold transition-all duration-300 ease group-hover:translate-x-[4px] ${item.gradient.includes("#8059ca")
                                  ? "text-[#8059ca]"
                                  : item.gradient.includes("#3b82f6")
                                    ? "text-[#3b82f6]"
                                    : "text-[#dc2626]"
                                  }`}
                              >
                                <span>Explore</span>
                                <i className="fas fa-arrow-right"></i>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="work-section">
            <div className="container">
              <div className="row">
                <div
                  className="col-lg-4 col-md-12 work-img-info aos"
                  data-aos="fade-up"
                >
                  <div className="work-img">
                    <img
                      src="/assets/img/work-img.png"
                      className="img-fluid"
                      alt="doctor-image"
                      loading="lazy"
                    />
                  </div>
                </div>
                <div className="col-lg-8 col-md-12 work-details">
                  <div className="section-header-one aos" data-aos="fade-up">
                    <div
                      className="mb-2 inline-block py-[8px] px-[20px] bg-gradient-to-br from-[#ea580c]/20 to-[#f97316]/20 rounded-[50px] text-[14px] font-semibold text-[#ea580c]"
                    >
                      <i
                        className="fas fa-info-circle mr-[8px]"
                      ></i>
                      How it Works
                    </div>
                    <br />
                    <h2
                      className="!text-[28px] !font-semibold mb-[12px]"
                    >
                      4 easy steps to get your solution
                    </h2>
                  </div>
                  <div className="row g-4">
                    <div className="col-lg-6 col-md-6 aos" data-aos="fade-up">
                      <div className="work-info">
                        <div className="work-icon">
                          <span>
                            <img
                              src="/assets/img/icons/searchubg.png"
                              alt="search-doctor-icon"
                              loading="lazy"
                            />
                          </span>
                        </div>
                        <div className="work-content">
                          <h5>Search Medicines</h5>
                          <p className="text-[14px]">
                            Search for medicines by name, category, or health
                            condition.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 aos" data-aos="fade-up">
                      <div className="work-info">
                        <div className="work-icon">
                          <span>
                            <img
                              src="/assets/img/icons/first-aid-kit.png"
                              alt="doctor-profile-icon"
                              loading="lazy"
                            />
                          </span>
                        </div>
                        <div className="work-content">
                          <h5>Check Medicine Details</h5>
                          <p className="text-[14px]">
                            View detailed information about the medicine including
                            brand, composition, and alternatives.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 aos" data-aos="fade-up">
                      <div className="work-info">
                        <div className="work-icon">
                          <span>
                            <img
                              src="/assets/img/icons/price-comparison.png"
                              alt="calendar-icon"
                              loading="lazy"
                            />
                          </span>
                        </div>
                        <div className="work-content">
                          <h5>Compare Prices</h5>
                          <p className="text-[14px]">
                            Compare prices from multiple pharmacies and choose the
                            best deal.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-6 aos" data-aos="fade-up">
                      <div className="work-info">
                        <div className="work-icon">
                          <span>
                            <img
                              src="/assets/img/icons/doctor-consultation.png"
                              alt="solution-icon"
                              loading="lazy"
                            />
                          </span>
                        </div>
                        <div className="work-content">
                          <h5>Get Your Solution</h5>
                          <p className="text-[14px]">
                            Select the pharmacy, place your order, and get your
                            medicines at the best price.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="features-section"
            style={{
              padding: "50px 0",
              background:
                "linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f8f9fa 100%)",
              position: "relative",
              overflow: "hidden",
            }}
          >

            <div className="gradient-bg-shape gradient-bg-shape-1"></div>
            <div className="gradient-bg-shape gradient-bg-shape-2"></div>
            <div className="container" style={{ position: "relative", zIndex: 2 }}>
              <div className="row">
                <div className="col-md-12 aos" data-aos="fade-up">
                  <div className="section-header-one section-header-slider text-center">
                    <h2
                      className="!text-[24px] !font-semibold mb-[8px]"
                    >
                      Key Features & Benefits
                    </h2>
                    <p
                      className="!text-[#6b7280] !text-[13px] !max-w-[500px] !mx-auto !mt-[6px] !mb-0 !font-normal"
                    >
                      Compare prices from 500+ pharmacies, get 100% genuine
                      medicines, find cheaper alternatives, set price alerts, enjoy
                      fast delivery, and receive expert support 24/7.
                    </p>
                  </div>
                </div>
              </div>
              <div className="row g-3 mt-1">
                {[
                  {
                    id: 1,
                    title: "Price Comparison",
                    description: "Compare prices from 500+ pharmacies instantly. Find the best deals and save up to 40% on your medicine bills.",
                    icon: "fas fa-search-dollar",
                    topBarGradient: "linear-gradient(90deg, #8059ca, #3b82f6, #059669)",
                    iconGradient: "from-[#8059ca] to-[#6d48b8]",
                    hoverShadow: "hover:shadow-[0_12px_40px_rgba(125,46,255,0.2)] hover:border-[#8059ca]",
                    delay: "0s"
                  },
                  {
                    id: 2,
                    title: "100% Genuine",
                    description: "All medicines are verified and sourced from licensed pharmacies. Your health and safety is our top priority.",
                    icon: "fas fa-shield-alt",
                    topBarGradient: "linear-gradient(90deg, #059669, #10b981, #34d399)",
                    iconGradient: "from-[#059669] to-[#10b981]",
                    hoverShadow: "hover:shadow-[0_12px_40px_rgba(5,150,105,0.2)] hover:border-[#059669]",
                    delay: "0.1s"
                  },
                  {
                    id: 3,
                    title: "Find Alternatives",
                    description: "Discover cheaper alternatives with the same composition. Get detailed information about substitutes and save more.",
                    icon: "fas fa-exchange-alt",
                    topBarGradient: "linear-gradient(90deg, #8059ca, #3b82f6, #822BD4)",
                    iconGradient: "from-[#8059ca] to-[#6d48b8]",
                    hoverShadow: "hover:shadow-[0_12px_40px_rgba(125,46,255,0.2)] hover:border-[#8059ca]",
                    delay: "0.2s"
                  },
                  {
                    id: 4,
                    title: "Price Alerts",
                    description: "Set price alerts for your regular medicines and get notified when prices drop. Never miss a great deal again.",
                    icon: "fas fa-bell",
                    topBarGradient: "linear-gradient(90deg, #dc2626, #ef4444, #f87171)",
                    iconGradient: "from-[#dc2626] to-[#ef4444]",
                    hoverShadow: "hover:shadow-[0_12px_40px_rgba(220,38,38,0.2)] hover:border-[#dc2626]",
                    delay: "0.3s"
                  },
                  {
                    id: 5,
                    title: "Fast Delivery",
                    description: "Choose from home delivery or store pickup. Get your medicines delivered to your doorstep quickly and safely.",
                    icon: "fas fa-truck",
                    topBarGradient: "linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)",
                    iconGradient: "from-[#3b82f6] to-[#60a5fa]",
                    hoverShadow: "hover:shadow-[0_12px_40px_rgba(59,130,246,0.2)] hover:border-[#3b82f6]",
                    delay: "0.4s"
                  },
                  {
                    id: 6,
                    title: "Expert Support",
                    description: "Get expert guidance on medicines, alternatives, and health tips. Our support team is available 24/7 to help you.",
                    icon: "fas fa-user-md",
                    topBarGradient: "linear-gradient(90deg, #059669, #10b981, #34d399)",
                    iconGradient: "from-[#059669] to-[#10b981]",
                    hoverShadow: "hover:shadow-[0_12px_40px_rgba(5,150,105,0.2)] hover:border-[#059669]",
                    delay: "0.5s"
                  }
                ].map((feature) => (
                  <div className="col-lg-4 col-md-6" key={feature.id}>
                    <div
                      className={`feature-card group feature-card-animated aos p-[24px] rounded-[12px] bg-white border-2 border-solid border-transparent transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_4px_20px_rgba(0,0,0,0.06)] relative overflow-hidden h-full hover:-translate-y-[8px] ${feature.hoverShadow}`}
                      data-aos="fade-up"
                      data-aos-delay={feature.id * 100}
                      style={{
                        animationDelay: feature.delay,
                      }}
                    >
                      <div
                        className="absolute top-0 left-0 right-0 h-[4px] scale-x-0 origin-left transition-transform duration-400 ease group-hover:scale-x-100"
                        style={{
                          background: feature.topBarGradient,
                        }}
                      />
                      <div
                        className="feature-icon-wrapper mb-[12px] relative inline-block"
                      >
                        <div
                          className={`feature-icon w-[48px] h-[48px] mx-auto bg-gradient-to-br ${feature.iconGradient} rounded-[12px] flex items-center justify-center text-[18px] text-white relative z-10 shadow-[0_4px_12px_rgba(0,0,0,0.1)] group-hover:animate-[iconBounce_0.6s_ease-in-out]`}
                        >
                          <i className={feature.icon}></i>
                        </div>
                      </div>
                      <h4
                        className="!text-[16px] !font-semibold mb-[6px] text-[#1f2937] leading-[1.3]"
                      >
                        {feature.title}
                      </h4>
                      <p
                        className="text-[#6b7280] text-[12px] leading-[1.6] m-0"
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section
            className="price-showcase-section !py-[40px] !bg-[linear-gradient(135deg,#8059ca_0%,#822BD4_100%)] !text-white"
          >
            <div className="container">
              <div className="row align-items-center">
                <div className="col-lg-6 mb-4 mb-lg-0">
                  <div className="showcase-content aos" data-aos="fade-right">
                    <h2
                      className="!text-[32px] !font-semibold !mb-[16px] !text-white"
                    >
                      See How Much You Can Save
                    </h2>
                    <p
                      className="!text-[15px] !leading-[1.6] !mb-[24px] !text-white/90"
                    >
                      Compare prices across multiple pharmacies and find the best
                      deals. Our users save an average of 25-40% on their medicine
                      bills every month.
                    </p>
                    <div className="savings-stats d-flex gap-4 mb-4">
                      <div>
                        <h3
                          className="!text-[32px] !font-semibold !m-0 !text-[#04BD6C]"
                        >
                          ₹2Cr+
                        </h3>
                        <p
                          className="!m-0 !text-[14px] !text-white/80"
                        >
                          Total Savings
                        </p>
                      </div>
                      <div>
                        <h3
                          className="!text-[32px] !font-semibold !m-0 !text-[#04BD6C]"
                        >
                          25-40%
                        </h3>
                        <p
                          className="!m-0 !text-[14px] !text-white/80"
                        >
                          Average Savings
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/medicine/all"
                      className="btn btn-light btn-lg !py-[12px] !px-[30px] !rounded-[50px] !font-medium !text-[15px] !no-underline !inline-block !transition-all !duration-300"
                    >
                      Start Comparing Now{" "}
                      <i className="fas fa-arrow-right ms-2"></i>
                    </Link>
                  </div>
                </div>
                <div className="col-lg-6">
                  <div
                    className="price-comparison-card aos !bg-white !rounded-[16px] !p-[24px] !border !border-solid !border-[#e9ecef]"
                    data-aos="fade-left"
                  >
                    <h4
                      className="!text-[#2c3e50] !mb-[20px] !text-[18px] !font-semibold"
                    >
                      Example: Paracetamol 500mg
                    </h4>
                    <div
                      className="price-comparison-item mb-3 !p-[12px] !bg-[#f8f9fa] !rounded-[8px] !border !border-solid !border-[#e9ecef]"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6
                            className="!m-0 !text-[#495057] !text-[14px] !font-medium"
                          >
                            Pharmacy A
                          </h6>
                          <p
                            className="!m-0 !text-[#6c757d] !text-[12px]"
                          >
                            2.5 km away
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className="!text-[16px] !font-semibold !text-[#495057]"
                          >
                            ₹45
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="price-comparison-item mb-3 !p-[12px] !bg-[linear-gradient(135deg,#04BD6C_0%,#05a85c_100%)] !rounded-[8px] !border !border-solid !border-[#04BD6C] relative"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6
                            className="!m-0 !text-white !text-[14px] !font-medium"
                          >
                            Pharmacy B (Best Deal)
                          </h6>
                          <p
                            className="!m-0 !text-white/90 !text-[12px]"
                          >
                            1.8 km away
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className="!text-[16px] !font-semibold !text-white"
                          >
                            ₹32
                          </span>
                        </div>
                      </div>
                      <div
                        className="absolute top-[-10px] right-[15px] !bg-[#FFA726] !text-white !py-[2px] !px-[10px] !rounded-[20px] !text-[11px] !font-semibold"
                      >
                        Save 29%
                      </div>
                    </div>
                    <div
                      className="price-comparison-item mb-3 !p-[12px] !bg-[#f8f9fa] !rounded-[8px] !border !border-solid !border-[#e9ecef]"
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <h6
                            className="!m-0 !text-[#495057] !text-[14px] !font-medium"
                          >
                            Pharmacy C
                          </h6>
                          <p
                            className="!m-0 !text-[#6c757d] !text-[12px]"
                          >
                            3.2 km away
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className="!text-[16px] !font-semibold !text-[#495057]"
                          >
                            ₹50
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      className="total-savings mt-3 text-center !p-[16px] !bg-[linear-gradient(135deg,#f8f9fa_0%,#ffffff_100%)] !rounded-[12px]"
                    >
                      <p className="m-0 !text-[#6c757d] !text-[13px]">
                        You Save
                      </p>
                      <h3
                        className="!mt-[4px] !mx-0 !mb-0 !text-[#04BD6C] !text-[28px] !font-semibold"
                      >
                        ₹13 per strip
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {testimonials && testimonials.length > 0 && (
            <section
              className="home-deferred-section py-5 bg-[#f8f9fa]"
            >
              <div className="container">
                <div
                  className="section-header sec-header-one text-center aos"
                  data-aos="fade-up"
                >
                  <div
                    className="mb-2 inline-block py-[8px] px-[20px] bg-gradient-to-br from-[#7d2eff]/10 to-[#3b82f6]/10 rounded-[50px] text-[14px] font-semibold text-[#8059ca]"
                  >
                    <i className="fas fa-bolt mr-[8px]"></i>
                    Reviews
                  </div>
                  <h2>What Our Users Say</h2>
                  <p
                    className="text-[#6b7280] text-[14px] max-w-[600px] mx-auto mt-[8px] mb-0 font-normal"
                  >
                    Read what our satisfied customers have to say about our
                    services, doctors, and platform. Real reviews from real users
                    who have experienced the benefits of our medical comparison
                    platform.
                  </p>
                </div>

                <div className="row g-4 aos" data-aos="fade-up">
                  {homeLiteMode ? (
                    <div className="row g-3">
                      {testimonials.slice(0, 3).map((review) => (
                        <div key={review._id} className="col-lg-4 col-md-6">
                          {renderTestimonialCard(review)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Slider {...bestDoctorsSlider}>
                      {testimonials.map((review) => (
                        <div key={review._id} className="col-lg-4 col-md-6 px-1">
                          {renderTestimonialCard(review)}
                        </div>
                      ))}
                    </Slider>
                  )}
                </div>
              </div>
            </section>
          )}

          {faqss && faqss.length > 0 && (
            <section className="faq-section mt-4 home-deferred-section">
              <div className="container">
                <div className="row">
                  <div className="col-md-12 ">
                    <div
                      className="section-header-one text-center"
                      data-aos="fade-up"
                    >
                      <div
                        className="mb-2 inline-block py-[8px] px-[20px] bg-gradient-to-br from-[#8059ca]/20 to-[#6d48b8]/20 rounded-[50px] text-[14px] font-semibold text-[#8059ca]"
                      >
                        <i
                          className="fas fa-question-circle mr-[8px] text-[#8059ca]"
                        ></i>
                        Get Your Answer
                      </div>
                      <h2
                        className="!text-[28px] !font-semibold mb-[12px]"
                      >
                        Frequently Asked Questions
                      </h2>
                      <p
                        className="text-[#6b7280] text-[14px] max-w-[600px] mx-auto mt-[8px] mb-0 font-normal"
                      >
                        Find the best medicine prices, ensure authenticity with
                        verified products, explore cost-effective alternatives, get
                        price alerts, enjoy quick delivery, and access expert
                        assistance anytime.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="row align-items-center">
                  <div
                    className="col-lg-6 col-md-12 aos d-none d-lg-block"
                    data-aos="fade-up"
                  >
                    <div className="faq-img">
                      <img
                        src="/assets/Medicomapres FAQ (2).png"
                        className="img-fluid"
                        alt="img"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  </div>
                  <div className="col-lg-6 col-md-12">
                    <div className="faq-info aos" data-aos="fade-up">
                      <div className="accordion" id="faq-details">
                        {faqss.map((faq, index) => {
                          const isOpen = openIndex === index;

                          return (
                            <div className="accordion-item" key={index}>
                              <h2 className="accordion-header">
                                <button
                                  type="button"
                                  onClick={() => toggleAccordion(index)}
                                  aria-expanded={isOpen}
                                  className={`accordion-button faq-toggle-btn flex items-center justify-between w-full gap-3 ${!isOpen ? "collapsed" : ""
                                    }`}
                                >
                                  <span className="flex-1 text-left">
                                    {faq.question}
                                  </span>
                                  <i
                                    className={`fas ${isOpen ? "fa-minus text-white bg-[#8059ca]" : "fa-plus text-[#8059ca] bg-white"} shrink-0 text-[12px] w-[25px] h-[25px] rounded-[4px] inline-flex items-center justify-center`}
                                    aria-hidden="true"
                                  />
                                </button>
                              </h2>

                              <div
                                className={`accordion-collapse collapse ${isOpen ? "show" : ""
                                  }`}
                              >
                                <div className="accordion-body">
                                  <div className="accordion-content">
                                    <p>{faq.answer}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {blogss && blogss.length > 0 && (
            <section
              className="py-4 mb-2 home-deferred-section home-bg-pattern-section"
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
              <div className="container">
                <div
                  className="d-flex align-items-center justify-content-center flex-wrap gap-3 mb-3 aos"
                  data-aos="fade-up"
                >
                  <div
                    className="section-header-one text-center"
                    data-aos="fade-up"
                  >
                    <div
                      className="mb-2 inline-block py-[8px] px-[20px] bg-gradient-to-br from-[#8059ca]/20 to-[#6d48b8]/20 rounded-[50px] text-[14px] font-semibold text-[#8059ca]"
                    >
                      <i
                        className="fas fa-bolt mr-[8px] text-[#8059ca]"
                      ></i>
                      Our Blogs
                    </div>
                    <h2
                      className="text-[36px] !font-semibold mb-[12px] inline-block w-full bg-gradient-to-br from-[#8059ca] to-[#6d48b8] bg-clip-text text-transparent text-[#8059ca]"
                    >
                      Insights and Tips on Medicines
                    </h2>
                    <p
                      className="text-[#6b7280] text-[14px] max-w-[600px] mx-auto mt-[8px] mb-0 font-normal"
                    >
                      Stay informed with our latest blog posts on medicine pricing,
                      authentic products, cost-effective alternatives, and health
                      tips. Learn how to save on medicines while ensuring quality
                      and safety.
                    </p>
                  </div>
                </div>
                {homeLiteMode ? (
                  <div className="row g-3">
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
                        <div className="col-lg-4 col-md-6" key={index}>
                          <div
                            onClick={() => getByBlogDetails(blog)}
                            className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_8px_rgba(128,89,202,0.08)] border border-solid border-[#8059ca]/10 h-full flex flex-col cursor-pointer"
                          >
                            <div
                              className="w-full h-[180px] overflow-hidden bg-[#f8f4ff] flex items-center justify-center"
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
                            <div className="p-[14px]">
                              <h5 className="!text-[16px] !font-semibold mb-[8px]">
                                {blog.title}
                              </h5>
                              <p
                                className="m-0 text-[14px] text-[#6b7280] leading-[1.6]"
                              >
                                {shortDescription}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <Slider {...blogsSettings}>
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
                        <div className="col-lg-4 col-md-6 px-2" key={index}>
                          <div
                            onClick={() => getByBlogDetails(blog)}
                            className="bg-white rounded-[16px] overflow-hidden shadow-[0_2px_12px_rgba(128,89,202,0.1)] border border-solid border-[#8059ca]/10 transition-all duration-300 ease h-full flex flex-col cursor-pointer hover:shadow-[0_8px_24px_rgba(128,89,202,0.15)]"
                          >
                            <div
                              className="relative w-full h-[200px] overflow-hidden bg-[#f8f4ff] flex items-center justify-center"
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
                            <div
                              className="p-[14px] flex-1 flex flex-col"
                            >
                              <div
                                className="flex items-center gap-3 mb-[10px] flex-wrap"
                              >
                                <div
                                  className="flex items-center gap-2"
                                >
                                  <img
                                    src={getImageUrl(blog.files[0])}
                                    alt={blog.title}
                                    loading="lazy"
                                    className="w-[32px] h-[32px] rounded-full object-cover border-2 border-solid border-[#e5e7eb]"
                                  />
                                  <span
                                    className="text-[13px] font-medium text-[#4b5563]"
                                  >
                                    {blog.title.slice(0, 12)}
                                  </span>
                                </div>
                                <div
                                  className="flex items-center gap-[6px] text-[13px] text-[#9ca3af]"
                                >
                                  <i className="fas fa-calendar-alt" />
                                  <span>{blog.createdAt?.slice(0, 10)}</span>
                                </div>
                              </div>

                              <h3
                                className="!text-[16px] !font-semibold text-[#8059ca] mb-[4px] leading-[1.4]"
                              >
                                {blog.title}
                              </h3>

                              <div
                                className="text-[14px] text-[#6b7280] leading-[1.6] flex-1"
                              >
                                <p
                                  className="m-0 text-[14px] text-[#6b7280] leading-[1.6]"
                                >
                                  {shortDescription}
                                </p>
                                {isLongDescription && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      getByBlogDetails(blog);
                                    }}
                                    className="mt-[8px] p-0 border-none bg-none text-[#8059ca] text-[13px] font-semibold cursor-pointer"
                                  >
                                    Read more
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Slider>
                )}
              </div>
            </section>
          )}

          <section className="app-section app-sec-twelve pharmacy-app-sec home-deferred-section">
            <div className="container">
              <div className="app-twelve border-0">
                <div className="app-bg">
                  <div className="row align-items-center">
                    <div
                      className="col-lg-6 col-md-12 aos aos-init aos-animate"
                      data-aos="fade-up"
                    >
                      <div className="mobile-img">
                        <img
                          src="/assets/mobileapp.png"
                          className="img-fluid"
                          alt="mobileapp"
                          title="mobileapp"
                          loading="lazy"
                          decoding="async"
                        />
                      </div>
                    </div>
                    <div className="col-lg-6 col-md-12">
                      <div className="app-content">
                        <div
                          className="app-header aos aos-init aos-animate"
                          data-aos="fade-up"
                        >
                          <h5>Download Our App Now.</h5>
                          <h2 className="!text-[38px]">
                            MediCompares India's #1 Medicine Price Comparision
                          </h2>
                        </div>
                        <div
                          className="app-scan aos aos-init aos-animate"
                          data-aos="fade-up"
                        >
                          <p>Scan the QR code to get the app now</p>
                          <img src="/assets/qurcode.png" alt="scan-image" />
                        </div>
                        <div className="app-store-links gap-2 d-flex flex-column flex-md-row ">
                          <a
                            href="https://www.apple.com/app-store/"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="/assets/img/icons/app-store-icon.svg"
                              alt="app-store"
                              title="app-store"
                            />
                          </a>
                          <a
                            href="https://play.google.com/store/games"
                            target="blank"
                            rel="noopener noreferrer"
                          >
                            <img
                              src="/assets/img/icons/playstore.svg"
                              alt="play-store"
                              title="play-store"
                            />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="app-bgs">
                    <img
                      src="assets/img/bg/app-bg-01.png"
                      alt="image"
                      style={{ height: "360px" }}
                    />
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
            ×
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
          <Home2Footer />
        </div>
      )}
    </>
  );
};

export default Home2;
