import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import Slider from "react-slick";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import { useResponsive } from "../../../hooks";
import { getImageUrl } from "../../../utils/index";
import {
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../Apiservice.jsx";
import toast from "react-hot-toast";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import { useAddToCart } from "../../../hooks/useAddToCart";
import { useCart } from "../../../hooks/useCart";
import ShareModal from "./products-components/ShareModal.jsx";
import LeadModal from "./products-components/LeadModal.jsx";
import ProductReviewModal from "./products-components/ProductReviewModal.jsx";
import RentModal from "./products-components/RentModal.jsx";
import ConsultationModal from "./products-components/ConsultationModal.jsx";
import RelatedProducts from "./products-components/RelatedProducts.jsx";
import Branded from "./products-components/Branded.jsx";
import CartQuantityControls from "../../../components/ui/CartQuantityControls.jsx";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import {
  getShareUrl,
  getShareText,
  shareToWhatsApp,
  shareToFacebook,
  shareToTwitter,
  shareToLinkedIn,
  shareToTelegram,
  shareToEmail,
  copyToClipboard,
} from "./utils/shareUtils.js";
import { FaRegShareSquare, FaHeart, FaFileMedical, FaExchangeAlt } from "react-icons/fa";
import { IoIosHeartEmpty } from "react-icons/io";
import AppointmentModal from "./products-components/AppointmentModal.jsx";
import ProductDescriptionTabs from "./products-components/ProductDescriptionTabs.jsx";
import Reviews from "./products-components/Reviews.jsx";
import GenericProducts from "./products-components/Generic.jsx";
import { useLocation as useLocationContext } from "../../../context/LocationContext";
import AlternateProducts from "./products-components/AlternateProducts.jsx";
import { redirectToLoginWithPendingBooking } from "../../../utils/pendingBookingUtils";
import VideoPopupModal from "./products-components/VideoPopupModal.jsx";
import { FaPlay } from "react-icons/fa";
import axios from "axios";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { GOOGLE_MAPS_API_KEY } from "../../../utils/index.js"

const libraries = ["places"];
// const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

const UI_QTY_KEY = "pharmacyCartQuantitiesUI";
const INITIAL_LEAD_FORM = {
  date: "",
  name: "",
  email: "",
  mobile: "",
  policyNumber: "",
  relation: "",
  address: "",
};

const createSlug = (name) => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

const ProductDescription = () => {
  const { service, productId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentLocation, updateLocation, latitude, longitude } =
    useLocationContext();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [tablets, setTablets] = useState([]);
  const [relatedproducts, setRelatedproducts] = useState([]);
  const [brandProducts, setBrandProducts] = useState([]);
  const [genericProducts, setGenericProducts] = useState([]);
  const [alternativeproduct, setAlternativeproduct] = useState([]);
  const [uploadingPrescription, setUploadingPrescription] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState(
    location.state?.selectedVariantId || null,
  );
  const [ratingview, setRatingView] = useState([]);
  const [ratingsum, setRatingSum] = useState(null);
  const [ratingpeople, setRatingPeople] = useState(0);
  const [banners, setBanners] = useState([]);
  const [fixedtypeSlug, setFixedtypeSlug] = useState(null);
  const [compoissitionForViewAll, setComposittionForViewAll] = useState("");
  // Filter banners by position
  const rightSideTop = banners.filter((b) => b.position === "rightside_Top");
  const rightSideBottom = banners.filter(
    (b) => b.position === "rightside_bottom",
  );
  const descriptionTop = banners.filter((b) => b.position === "top");

  const bannerSliderSettings = {
    dots: false,
    infinite: true,
    arrows: true,
    speed: 2000,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 2000,
  };

  const [currentTopSlide, setCurrentTopSlide] = useState(0);

  const descriptionTopSettings = {
    dots: true,
    infinite: true,
    arrows: false,
    speed: 1500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1500,
    beforeChange: (current, next) => setCurrentTopSlide(next),
    dotsClass: "slick-dots !flex !justify-center !items-center !gap-2 !bottom-5 !w-full !left-0 !right-0 [&_li]:!w-auto [&_li]:!h-auto [&_li]:!m-0 [&_li]:!p-0",
    appendDots: (dots) => (
      <ul className="!flex !justify-center !items-center !gap-2 !m-0 !p-0 !list-none">
        {dots}
      </ul>
    ),
    customPaging: (i) => (
      <button
        className={`!h-1.5 !rounded-full !border-none !p-0 !cursor-pointer !transition-all !duration-300 before:!content-none before:!hidden ${currentTopSlide === i
          ? "!w-[30px] !bg-white"
          : "!w-2 !bg-white/50"
          }`}
      />
    ),
  };

  const [selectedVariants, setSelectedVariants] = useState({});
  const [cartQuantities, setCartQuantities] = useState({});
  const [tabletvariantobject, setTabletvariantobject] = useState({});
  const [singleproductobject, setSingleproductobject] = useState({});
  const [showMoreProductInfo, setShowMoreProductInfo] = useState(false);
  const [showMoreDirections, setShowMoreDirections] = useState(false);
  const [showMoreSideEffects, setShowMoreSideEffects] = useState(false);
  const [showMorePrecautions, setShowMorePrecautions] = useState(false);
  const [activeTab, setActiveTab] = useState("productInfo");
  const [selectedInteraction, setSelectedInteraction] = useState(null);
  const [isParamsOpen, setIsParamsOpen] = useState(true);
  const [isTabContentOpen, setIsTabContentOpen] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductForReview, setSelectedProductForReview] =
    useState(null);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [imageZoom, setImageZoom] = useState({ x: 50, y: 50, scale: 1 });
  const imageZoomRef = useRef(null);
  const [leadFormData, setLeadFormData] = useState(INITIAL_LEAD_FORM);
  const [rentalFormData, setRentalFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    deliveryAddress: "",
  });
  const [consultationFormData, setConsultationFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });
  const [appointmentFormData, setAppointmentFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const [currentModalData, setCurrentModalData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoModalSrc, setVideoModalSrc] = useState("");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [thumbnailStartIndex, setThumbnailStartIndex] = useState(0);
  const [productDetailsId, setProductDetailsID] = useState(null);
  const [pincode, setPincode] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [checkedPincode, setCheckedPincode] = useState(null);
  const [headerPincode, setHeaderPincode] = useState(null);
  const [shareProductDataForModal, setShareProductDataForModal] =
    useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const { isMobile } = useResponsive();

  const autocompleteRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.has("pincode")) {
      searchParams.delete("pincode");
      const newSearch = searchParams.toString();
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ""}`, {
        replace: true,
      });
    }

    const savedLocation = localStorage.getItem("selectedLocation");
    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        if (locationData.pincode && locationData.pincode.length === 6) {
          setCheckedPincode(locationData.pincode || '500085');
          setHeaderPincode(locationData.pincode || '500085');
          setPincode(locationData.pincode || '500085');
          setSearchQuery(locationData.pincode || '500085');
          return;
        }
      } catch (e) {
        // Error parsing saved location
      }
    }
    setHeaderPincode(null);
    setPincode("");
    setSearchQuery("");
    setCheckedPincode(null);
  }, [location.search, navigate, location.pathname]);

  useEffect(() => {
    const handleLocationChange = (event) => {
      const locationData = event.detail;
      if (locationData?.source === "checkout") {
        return;
      }
      if (locationData?.pincode && locationData.pincode.length === 6) {
        if (checkedPincode !== locationData.pincode) {
          setPincode(locationData.pincode);
          setSearchQuery(locationData.pincode);
          setCheckedPincode(locationData.pincode || '500085');
          setHeaderPincode(locationData.pincode || '500085');
          const lat = locationData.coordinates?.lat;
          const lng = locationData.coordinates?.lng;
          if (userId !== null) {
            fetchProductData(userId, locationData.pincode, true, null, lat, lng);
          } else {
            fetchProductData(null, locationData.pincode, true, null, lat, lng);
          }
        }
      } else {
        setHeaderPincode(null);
      }
    };

    window.addEventListener("locationChanged", handleLocationChange);
    return () => {
      window.removeEventListener("locationChanged", handleLocationChange);
    };
  }, [checkedPincode, product, userId]);

  useEffect(() => {
    if (!product || !tablets.length) return;

    const med = tablets[0];
    const isSurgery =
      product?.tablet?.subcategorys?.category?.fixedType === "surgeries";
    const currentVariantId = selectedVariantId || selectedVariants[med._id];

    if (!currentVariantId) return;

    const currentVariant = med.variant?.find((v) => v._id === currentVariantId);
    if (!currentVariant) return;
    if (!isSurgery) {
      const vendorVariants = buildVendorVariants(
        product?.vendors || [],
        currentVariantId,
      );
      setTabletvariantobject((prev) => ({
        ...prev,
        [med._id]: {
          mainVariant: currentVariant,
          vendorVariants,
        },
      }));
    } else {
      setTabletvariantobject((prev) => ({
        ...prev,
        [med._id]: {
          mainVariant: currentVariant,
          vendorVariants: [],
        },
      }));
    }
  }, [checkedPincode, product, selectedVariantId, selectedVariants, tablets]);

  const STORAGE_KEY = `pharmacy_selected_variants_${productId || "product"}`;
  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  const { addToCart } = useAddToCart();
  const {
    getCartQuantity: getCartQuantityFromHook,
    incrementItem,
    decrementItem,
  } = useCart();

  useEffect(() => {
    AOS.init({ duration: 800, easing: "ease-out", once: true, offset: 80 });
  }, []);

  useEffect(() => {
    setActiveTab("productInfo");
    setShowMoreProductInfo(false);
    setShowMoreDirections(false);
    setShowMoreSideEffects(false);
    setShowMorePrecautions(false);
  }, [productId]);

  useEffect(() => {
    const fetchProfileAndProductData = async () => {
      const token = localStorage.getItem("medicomparestoken");
      const savedLocation = localStorage.getItem("selectedLocation");
      let pincodeParam = null;
      let latParam = null;
      let lngParam = null;

      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          if (locationData.pincode && locationData.pincode.length > 0) {
            pincodeParam = locationData.pincode;
          }
          if (locationData.coordinates) {
            latParam = locationData.coordinates.lat;
            lngParam = locationData.coordinates.lng;
          }
        } catch (e) {
          // Error parsing saved location
        }
      }

      if (!token) {
        setUserProfile(null);
        setUserId(null);
        fetchProductData(null, pincodeParam, false, null, latParam, lngParam);
        return;
      }

      try {
        const res = await axiosUserInstance.get("profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = res?.data?.data?.user || {};
        setUserProfile(userData);
        setUserId(userData._id || null);
        fetchProductData(userData._id, pincodeParam, false, null, latParam, lngParam);
      } catch (err) {
        setUserProfile(null);
        setUserId(null);
        fetchProductData(null, pincodeParam, false, null, latParam, lngParam);
      }
    };

    fetchProfileAndProductData();
  }, [isLoggedIn, productId]);

  const getCart = () => {
    const cart = localStorage.getItem("pharmacyCart");
    return cart ? JSON.parse(cart) : [];
  };

  const loadUiQuantities = () => {
    try {
      const raw = sessionStorage.getItem(UI_QTY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveUiQuantities = (q) => {
    sessionStorage.setItem(UI_QTY_KEY, JSON.stringify(q));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const fetchFavoritesAndUpdateProduct = async (product) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token || !product?.tablet?._id) {
      setProduct((prev) =>
        prev
          ? {
            ...prev,
            tablet: { ...prev.tablet, isFavorite: false },
          }
          : prev,
      );
      return;
    }

    try {
      const response = await axiosUserInstance.get("favourite/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const favs = response.data?.data?.favourites || [];
      const favoriteTabletIds = new Set();
      favs.forEach((fav) => {
        if (fav.tablets && Array.isArray(fav.tablets)) {
          fav.tablets.forEach((tablet) => {
            if (tablet._id) {
              favoriteTabletIds.add(tablet._id);
            }
          });
        }
      });
      const isFavorite =
        product?.tablet?._id && favoriteTabletIds.has(product.tablet._id);
      setProduct((prev) => {
        if (prev?.tablet?._id === product?.tablet?._id) {
          return {
            ...prev,
            tablet: { ...prev.tablet, isFavorite: isFavorite || false },
          };
        }
        return prev;
      });
    } catch (error) {
      // Error fetching favorites
      setProduct((prev) => {
        if (prev?.tablet?._id === product?.tablet?._id) {
          return {
            ...prev,
            tablet: { ...prev.tablet, isFavorite: false },
          };
        }
        return prev;
      });
    }
  };

  const fetchProductData = async (
    userIdParam,
    pincodeParam = null,
    skipMainLoader = false,
    locationParam = null,
    latParam = null,
    lngParam = null,
  ) => {
    try {
      if (!skipMainLoader) {
        setLoading(true);
      }
      let url = `product/show/${productId}`;
      const params = [];
      if (userIdParam) {
        params.push(`userId=${userIdParam}`);
      }

      if (service) {
        params.push(`serviceslug=${service}`);
      }

      params.push(`type=website`);
      params.push(`positiontype=rightside_Top ,rightside_bottom,top`);

      const isSurgery =
        product?.tablet?.subcategorys?.category?.fixedType === "surgeries";
      if (isSurgery && locationParam) {
        params.push(`location=${encodeURIComponent(locationParam)}`);
      } else if (pincodeParam) {
        params.push(`location=${pincodeParam}`);
        const finalLat = latParam !== null ? latParam : latitude;
        const finalLng = lngParam !== null ? lngParam : longitude;
        if (finalLat && finalLng) {
          params.push(`lat=${finalLat}`);
          params.push(`lng=${finalLng}`);
        }
      } else if (locationParam) {
        params.push(`location=${encodeURIComponent(locationParam)}`);
      }

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }
      const response = await axiosCommonInstance.get(url);
      setRatingView(response.data.data.ratingview || []);
      setRatingSum(response.data.data.ratingsum || null);
      setRatingPeople(response.data.data.ratingpeople || 0);

      if (
        response.data.data.banner &&
        Array.isArray(response.data.data.banner)
      ) {
        const allBanners = [];

        response.data.data.banner.forEach((b) => {
          if (b.banners && Array.isArray(b.banners)) {
            const bannerItems = b.banners.map((bn) => {
              const fileUrl =
                bn?.files && Array.isArray(bn.files) && bn.files.length > 0
                  ? bn.files[0]
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

      const {
        product: fetchedProduct,
        relatedproducts: fetchedRelatedProducts,
        brandProducts: fetchedBrandProducts,
        genericProducts: fetchedGenericProducts,
        alternativeproduct: fetchedAlternativeProducts,
      } = response.data.data;


      // Check if product exists, if not show error
      if (!fetchedProduct) {
        toast.error("Product not found or no vendors available");
        if (!skipMainLoader) {
          setLoading(false);
        }
        return;
      }
      if (fetchedProduct?.tablet?.compositions?._id) {
        setComposittionForViewAll(fetchedProduct.tablet.compositions._id);
      } else {
        setComposittionForViewAll(
          fetchedProduct.tablet?.slug || ""
        );
      }
      setFixedtypeSlug(fetchedProduct?.tablet?.category?.fixedType)
      setProduct(fetchedProduct);
      setProductDetailsID(fetchedProduct?._id);
      setTabletvariantobject({});
      setSingleproductobject({});
      setRelatedproducts(fetchedRelatedProducts || []);
      setBrandProducts(fetchedBrandProducts || []);
      setGenericProducts(fetchedGenericProducts || []);
      setAlternativeproduct(fetchedAlternativeProducts || []);
      const fetchedIsSurgery =
        fetchedProduct?.tablet?.subcategorys?.category?.fixedType ===
        "surgeries";
      if (pincodeParam && pincodeParam.length === 6) {
        setCheckedPincode(pincodeParam);
      }

      const tabletData = fetchedProduct?.tablet;
      if (tabletData) {
        const normalizedTablet = {
          ...tabletData,
          vendors: fetchedProduct?.vendors || [],
        };
        const medOrTablet = currentLeadData?.med || normalizedTablet;
        const fixedType = medOrTablet?.subcategorys?.category?.fixedType;
        let storedSelections = {};
        const savedSelections = sessionStorage.getItem(STORAGE_KEY);
        if (savedSelections) {
          try {
            storedSelections = JSON.parse(savedSelections);
          } catch (e) {
            // Failed to parse saved selections
          }
        }

        const availableVariantIds = Array.isArray(normalizedTablet.variant)
          ? normalizedTablet.variant.map((v) => v._id)
          : [];

        let variantToUse = storedSelections[normalizedTablet._id];
        if (variantToUse && !availableVariantIds.includes(variantToUse)) {
          variantToUse = null;
        }
        if (!variantToUse && availableVariantIds.length > 0) {
          variantToUse =
            selectedVariantId && availableVariantIds.includes(selectedVariantId)
              ? selectedVariantId
              : availableVariantIds[0];
        }

        if (variantToUse) {
          const nextSelections = {
            ...storedSelections,
            [normalizedTablet._id]: variantToUse,
          };
          setSelectedVariantId(variantToUse);
          setSelectedVariants(nextSelections);
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(nextSelections));
        } else {
          setSelectedVariantId(null);
          setSelectedVariants({});
        }

        setTablets([normalizedTablet]);

        if (variantToUse) {
          const currentVariant = normalizedTablet.variant?.find(
            (v) => v._id === variantToUse,
          );
          if (currentVariant) {
            const vendorVariants = buildVendorVariants(
              fetchedProduct?.vendors || [],
              variantToUse,
            );
            setTabletvariantobject((prev) => ({
              ...prev,
              [normalizedTablet._id]: {
                mainVariant: currentVariant,
                vendorVariants,
              },
            }));
          }
        }
      } else {
        setTablets([]);
      }

      if (isLoggedIn) {
        await fetchFavoritesAndUpdateProduct(fetchedProduct);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      if (!skipMainLoader) {
        setLoading(false);
      }
    }
  };

  const handleReviewSubmit = async () => {
    const savedLocation = localStorage.getItem("selectedLocation");
    let pincodeParam = null;
    let locationParam = null;
    let latParam = null;
    let lngParam = null;

    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        if (locationData.pincode && locationData.pincode.length > 0) {
          pincodeParam = locationData.pincode;
        }
        if (locationData.coordinates) {
          latParam = locationData.coordinates.lat;
          lngParam = locationData.coordinates.lng;
        }
      } catch (e) {
        // Error parsing saved location
      }
    }

    const searchParams = new URLSearchParams(location.search);
    const cityFromUrl = searchParams.get("city");
    if (cityFromUrl && cityFromUrl.trim()) {
      locationParam = cityFromUrl.trim();
    }

    await fetchProductData(userId, pincodeParam, true, locationParam, latParam, lngParam);
  };

  const handlePlaceSelect = async (place) => {
    if (!place?.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

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
    if (!postalCode) {
      try {
        // const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";
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
              postalCode = pincodeFromResult;
              break;
            }

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
        // Reverse geocoding error
      }
    }

    const locationName = place.formatted_address || place.name || "Selected Location";

    if (!postalCode) {
      toast.error("Could not determine pincode for the selected area. Please enter a pincode directly.");
      return;
    }

    setPincode(postalCode);
    setSearchQuery(postalCode);

    try {
      setLoadingVendors(true);

      const locationData = {
        name: locationName,
        address: locationName,
        coordinates: { lat, lng },
        placeId: place.place_id,
        pincode: postalCode,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("selectedLocation", JSON.stringify(locationData));
      updateLocation(locationData);

      window.dispatchEvent(
        new CustomEvent("locationChanged", { detail: locationData })
      );

      if (userId !== null) {
        await fetchProductData(userId, postalCode, true, null, lat, lng);
      } else {
        await fetchProductData(null, postalCode, true, null, lat, lng);
      }

      setCheckedPincode(postalCode);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "Failed to update location",
      );
    } finally {
      setLoadingVendors(false);
    }
  };

  const handlePincodeCheck = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const queryValue = searchQuery.trim();

    if (!queryValue || queryValue === "") {
      toast.error("Location or pincode is required");
      return;
    }

    try {
      setLoadingVendors(true);

      let locationName = queryValue;
      let postalCode = null;
      let coordinates = null;

      // const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";
      const isNumber = /^\d+$/.test(queryValue);

      let url = "";
      if (isNumber) {
        if (queryValue.length < 3) {
          toast.error("Please enter a valid pincode (minimum 3 digits)");
          setLoadingVendors(false);
          return;
        }
        url = `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${queryValue}|country:IN&key=${GOOGLE_MAPS_API_KEY}`;
      } else {
        url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(queryValue)}&key=${GOOGLE_MAPS_API_KEY}`;
      }

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        locationName = result.formatted_address || queryValue;

        if (result.geometry && result.geometry.location) {
          coordinates = {
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
          };
        }

        postalCode =
          result.address_components?.find((component) =>
            component.types.includes("postal_code")
          )?.long_name || null;

        if (!postalCode && result.formatted_address) {
          const pincodeMatch = result.formatted_address.match(/\b\d{6}\b/);
          if (pincodeMatch) {
            postalCode = pincodeMatch[0];
          }
        }
      }

      if (!postalCode) {
        if (isNumber) {
          postalCode = queryValue;
        } else {
          if (coordinates) {
            try {
              const revResponse = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinates.lat},${coordinates.lng}&key=${GOOGLE_MAPS_API_KEY}`
              );
              const revData = await revResponse.json();
              if (revData.status === "OK" && revData.results.length > 0) {
                for (const r of revData.results) {
                  const pinc = r.address_components?.find((c) =>
                    c.types.includes("postal_code")
                  )?.long_name;
                  if (pinc) {
                    postalCode = pinc;
                    break;
                  }
                }
              }
            } catch (err) { }
          }
        }
      }

      if (!postalCode) {
        toast.error("Could not find a valid pincode for this location. Please be more specific.");
        setLoadingVendors(false);
        return;
      }

      setPincode(postalCode);
      setSearchQuery(postalCode);

      const locationData = {
        name: locationName,
        address: locationName,
        coordinates: coordinates,
        addressId: null,
        pincode: postalCode,
        timestamp: new Date().toISOString(),
      };

      localStorage.setItem("selectedLocation", JSON.stringify(locationData));
      updateLocation(locationData);

      window.dispatchEvent(
        new CustomEvent("locationChanged", { detail: locationData })
      );

      const startTime = Date.now();
      const lat = coordinates?.lat;
      const lng = coordinates?.lng;
      if (userId !== null) {
        await fetchProductData(userId, postalCode, true, null, lat, lng);
      } else {
        await fetchProductData(null, postalCode, true, null, lat, lng);
      }
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setCheckedPincode(postalCode);
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err.message ||
        "Failed to check pincode",
      );
    } finally {
      setLoadingVendors(false);
    }
  };

  const handlePincodeClear = () => {
    setPincode("");
    setSearchQuery("");
  };

  const handlePincodeInputFocus = () => { };

  const fetchProductDetails = async (variantId, showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const params = [];
      if (userId) {
        params.push(`userId=${userId}`);
      }
      if (variantId) {
        params.push(`variantId=${variantId}`);
      }
      if (checkedPincode) {
        params.push(`location=${checkedPincode}`);
      }
      const url = `product/details/${productDetailsId}${params.length > 0 ? `?${params.join("&")}` : ""
        }`;
      const response = await axiosCommonInstance.get(url);
      const {
        product: fetchedProduct,
        relatedproducts: fetchedRelatedProducts,
        alternativeproduct: fetchedAlternativeProducts,
      } = response.data.data;

      if (!fetchedProduct) {
        setLoading(false);
        return;
      }

      setProduct(fetchedProduct);
      setRelatedproducts(fetchedRelatedProducts || []);
      setAlternativeproduct(fetchedAlternativeProducts || []);
      const responseData = response.data.data;
      if (responseData.product) {
        const fetchedProduct = responseData.product;
        setProduct(fetchedProduct);

        const tabletData = fetchedProduct?.tablet;
        if (tabletData) {
          const normalizedTablet = {
            ...tabletData,
            vendors: fetchedProduct?.vendors || [],
          };

          setTablets([normalizedTablet]);
          setSelectedVariantId(variantId);
          setSelectedVariants((prev) => {
            const updated = { ...prev, [tabletData._id]: variantId };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
            return updated;
          });

          const currentVariant = tabletData.variant?.find(
            (v) => v._id === variantId,
          );
          if (currentVariant) {
            const vendorVariants = buildVendorVariants(
              fetchedProduct?.vendors || [],
              variantId,
            );

            setTabletvariantobject((prev) => ({
              ...prev,
              [tabletData._id]: {
                mainVariant: currentVariant,
                vendorVariants,
              },
            }));
          }
        }
      }

      return responseData;
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to load variant details",
      );
      throw err;
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const getProduct = async (prodId) => {
    const token = localStorage.getItem("medicomparestoken");
    const params = [];
    if (userId) {
      params.push(`userId=${userId}`);
    }
    if (checkedPincode) {
      params.push(`location=${checkedPincode}`);
    }
    const url = `product/show/${prodId}${params.length > 0 ? `?${params.join("&")}` : ""
      }`;
    const response = await axiosCommonInstance.get(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.data.product;
  };

  const getCartQuantity = (vendorId, productId, variantId = null) => {
    return getCartQuantityFromHook(vendorId, productId, variantId);
  };

  const handleAddToCart = async (
    vendor,
    med,
    variantId,
    matchedVariant,
    discountPrice = null,
  ) => {
    localStorage.setItem("isCart", true);
    const allVariants = med?.variant || product?.tablet?.variant || [];
    const selectedVar = allVariants.find(
      (v) => v._id === (variantId || selectedVariantId),
    );
    const inStock = !!(
      (matchedVariant && matchedVariant.stock && matchedVariant.stock > 0) ||
      vendor?.stock > 0 ||
      med?.stock > 0
    );
    if (!inStock) {
      toast.error("Item is out of stock");
      return;
    }
    const basePrice = matchedVariant?.price || med.price || 0;
    const finalPrice =
      discountPrice && discountPrice > 0 ? discountPrice : basePrice;
    const item = {
      tabletdetails: med,
      vendordetails: vendor?.bussinessdetails || vendor,
      variants: med.variant || [],
      price: finalPrice,
    };

    const success = await addToCart(item, selectedVar, {
      bookingType: "cart",
      type: "normal",
    });

    if (success) {
      try {
        const updatedProduct = await getProduct(med._id);
        const vendorVariants = buildVendorVariants(
          updatedProduct?.vendors || [],
          variantId,
        );
        setTabletvariantobject((prev) => ({
          ...prev,
          [med._id]: {
            ...prev[med._id],
            mainVariant: selectedVar,
            vendorVariants,
          },
        }));
      } catch (err) {
        // Error refreshing product data
      }
    }
  };

  const handleSingleAddToCart = async (vendor, med, discountPrice = null) => {
    localStorage.setItem("isCart", true);

    const inStock = !!(med?.stock > 0 || vendor?.stock > 0);
    if (!inStock) {
      toast.error("Item is out of stock");
      return;
    }

    const basePrice = med.price || 0;
    const finalPrice =
      discountPrice && discountPrice > 0 ? discountPrice : basePrice;

    const item = {
      tabletdetails: med,
      vendordetails: vendor?.bussinessdetails || vendor,
      variants: [],
      price: finalPrice,
    };

    const success = await addToCart(item, null, {
      bookingType: "cart",
      type: "normal",
    });

    if (success) {
      try {
        const updatedProduct = await getProduct(med._id);
        setSingleproductobject((prev) => ({
          ...prev,
          [updatedProduct._id]: {
            vendors: updatedProduct?.vendors || [],
            productId: updatedProduct._id,
            med: updatedProduct,
          },
        }));
      } catch (err) {
        // Error refreshing product data
      }
    }
  };

  const handleIncrement = async (
    bookingType,
    vendorId,
    prodId,
    variantId,
    maxStock,
    vendor,
    selectedVar,
  ) => {
    const currentQty = getCartQuantity(vendorId, prodId, variantId);
    if (maxStock > 0 && currentQty >= maxStock) {
      toast.error(
        `Only ${maxStock} item${maxStock === 1 ? "" : "s"} available in stock`,
      );
      return;
    }

    try {
      await incrementItem(vendorId, prodId, variantId, maxStock);
    } catch (err) {
      toast.error("Failed to update quantity");
    }
  };

  const handleDecrement = async (
    bookingType,
    vendorId,
    prodId,
    variantId,
    vendor,
    selectedVar,
  ) => {
    try {
      await decrementItem(vendorId, prodId, variantId);
    } catch (err) {
      toast.error("Failed to update quantity");
    }
  };

  const handleSingleIncrement = async (vendorId, prodId, maxStock = 999) => {
    const currentQty = getCartQuantity(vendorId, prodId, null);
    if (maxStock > 0 && currentQty >= maxStock) {
      toast.error(
        `Only ${maxStock} item${maxStock === 1 ? "" : "s"} available in stock`,
      );
      return;
    }

    try {
      await incrementItem(vendorId, prodId, null, maxStock);
    } catch (err) {
      toast.error("Failed to update quantity");
    }
  };

  const handleSingleDecrement = async (vendorId, prodId) => {
    try {
      await decrementItem(vendorId, prodId, null);
    } catch (err) {
      toast.error("Failed to update quantity");
    }
  };

  const buildVendorVariants = (vendors, variantId) => {
    return (vendors || [])
      .map((v) => {
        const vendorName =
          v?.bussinessdetails?.name || v?.vendorName || "Unknown Vendor";
        const bookingType = v.bookingType || v.bookingtype || null;
        if (v.variant && v.variant.length > 0) {
          const found = v.variant.find(
            (vv) => vv.variantId === variantId || vv._id === variantId,
          );
          if (!found) return null;

          const extractedDiscountPrice =
            found.discountprice || found.discountPrice || null;
          const extractedDiscountType = found.discountType || null;

          return {
            _id: v._id,
            vendorId: v.bussinessdetails?.vendorId || v._id,
            vendorName,
            matchedPrice: found.price || v.price || 0,
            matchedVariantId: found.variantId || variantId,
            matchedVariantName: found.name,
            matchedVariantPrice: found.price || v.price || 0,
            matchedVariantDiscountPrice: extractedDiscountPrice,
            matchedVariantDiscountType: extractedDiscountType,
            matchedVariantStock: found.stock ?? v.stock ?? 0,
            matchedStock: found.stock ?? v.stock ?? 0,
            cartdetails: v.cartdetails ?? null,
            bookingType:
              bookingType || found.bookingType || found.bookingtype || null,
            bussinessdetails: v.bussinessdetails,
            variant: v.variant,
            price: found.price || v.price || 0,
            discountprice: extractedDiscountPrice,
            discountPrice: extractedDiscountPrice,
            discountType: extractedDiscountType,
            stock: found.stock ?? v.stock ?? 0,
            isStock: found.isStock,
            distanceInKm: v.bussinessdetails?.distanceInKm,
            averageRating: v.averageRating,
            ratingCount: v.ratingCount,
            perDayRent: v.perDayRent || found.perDayRent,
          };
        }
        const vendorDiscountPrice = v.discountprice || v.discountPrice || null;
        const vendorDiscountType = v.discountType || null;
        return {
          _id: v._id,
          vendorId: v.bussinessdetails?.vendorId || v._id,
          vendorName,
          matchedPrice: v.price || 0,
          matchedVariantId: null,
          matchedVariantName: null,
          matchedVariantPrice: v.price || 0,
          matchedVariantDiscountPrice: vendorDiscountPrice,
          matchedVariantDiscountType: vendorDiscountType,
          matchedVariantStock: v.stock ?? 0,
          matchedStock: v.stock ?? 0,
          cartdetails: v.cartdetails ?? null,
          bookingType,
          bussinessdetails: v.bussinessdetails,
          variant: v.variant || [],
          price: v.price || 0,
          discountprice: vendorDiscountPrice,
          discountPrice: vendorDiscountPrice,
          discountType: vendorDiscountType,
          stock: v.stock ?? 0,
          isStock: v.isStock,
          distanceInKm: v.bussinessdetails?.distanceInKm,
          averageRating: v.averageRating,
          ratingCount: v.ratingCount,
          perDayRent: v.perDayRent,
        };
      })
      .filter(Boolean);
  };

  const handleSelectVariant = async (variantId, med) => {
    if (!variantId || !med) return;
    const previousVariantId = selectedVariants[med._id];
    setSelectedVariantId(variantId);
    setSelectedVariants((prev) => {
      const updated = { ...prev, [med._id]: variantId };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
    setSelectedImageIndex(0);
    const currentVariant = med.variant?.find((v) => v._id === variantId);
    const isMedicine =
      product?.tablet?.subcategorys?.category?.fixedType === "medicine";

    if (currentVariant) {
      if (isMedicine && !checkedPincode) {
        setTabletvariantobject((prev) => ({
          ...prev,
          [med._id]: { mainVariant: currentVariant, vendorVariants: [] },
        }));
      } else {
        const vendorVariants = buildVendorVariants(
          med?.vendors || [],
          variantId,
        );
        setTabletvariantobject((prev) => ({
          ...prev,
          [med._id]: { mainVariant: currentVariant, vendorVariants },
        }));
      }
    }

    try {
      if (productDetailsId) {
        await fetchProductDetails(variantId, false);
      } else {
        if (!isMedicine && currentVariant) {
          const vendorVariants = buildVendorVariants(
            med?.vendors || [],
            variantId,
          );
          setTabletvariantobject((prev) => ({
            ...prev,
            [med._id]: { mainVariant: currentVariant, vendorVariants },
          }));
        }
      }
    } catch (err) {
      toast.error("Failed to load variant details");
      if (previousVariantId) {
        setSelectedVariantId(previousVariantId);
        setSelectedVariants((prev) => {
          const reverted = { ...prev, [med._id]: previousVariantId };
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(reverted));
          return reverted;
        });
        const previousVariant = med.variant?.find(
          (v) => v._id === previousVariantId,
        );
        const isMedicine =
          product?.tablet?.subcategorys?.category?.fixedType === "medicine";
        if (previousVariant) {
          if (isMedicine && !checkedPincode) {
            setTabletvariantobject((prev) => ({
              ...prev,
              [med._id]: { mainVariant: previousVariant, vendorVariants: [] },
            }));
          } else {
            const vendorVariants = buildVendorVariants(
              med?.vendors || [],
              previousVariantId,
            );
            setTabletvariantobject((prev) => ({
              ...prev,
              [med._id]: { mainVariant: previousVariant, vendorVariants },
            }));
          }
        }
      }
    }
  };

  const handleSelectVariantall = (variantId, med) => {
    setSelectedVariantId(variantId);
    setSelectedVariants((prev) => {
      const updated = { ...prev, [med._id]: variantId };
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    const currentvariant = med.variant?.find((v) => v._id === variantId);
    const isMedicine =
      product?.tablet?.subcategorys?.category?.fixedType === "medicine";
    const vendorVariants =
      isMedicine && !checkedPincode
        ? []
        : buildVendorVariants(med?.vendors || [], variantId);
    setTabletvariantobject((prev) => ({
      ...prev,
      [med._id]: { mainVariant: currentvariant, vendorVariants },
    }));
  };

  const handleSingleProductall = (prodId, med) => {
    const vendorVariants = buildVendorVariants(med?.vendors || [], null);
    setSingleproductobject((prev) => ({
      ...prev,
      [prodId]: { vendors: vendorVariants, productId: prodId, med },
    }));
  };

  useEffect(() => {
    // PROTECT MANUAL SELECTION: If we already have a selection, don't let background tasks reset it.
    if (!tablets.length || selectedVariantId) return;

    let storedSelections = {};
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        storedSelections = JSON.parse(saved);
      } catch (e) { }
    }

    tablets.forEach((med) => {
      const firstVariantId =
        med?.variant?.length > 0 ? med.variant[0]._id : null;
      if (firstVariantId) {
        const preferredVariantId =
          storedSelections[med._id] &&
            med.variant.some((v) => v._id === storedSelections[med._id])
            ? storedSelections[med._id]
            : firstVariantId;
        handleSelectVariantall(preferredVariantId, med);
      } else {
        handleSingleProductall(med._id, med);
      }
    });
  }, [tablets]);

  const handleToggleFavourite = async (
    itemId,
    currentStatus,
    isRelatedProduct = false,
    relatedProductIndex = null,
  ) => {
    if (!isLoggedIn) {
      toast.error("Please login to manage favourites");
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("No token found. Please login again.");
      navigate("/login");
      return;
    }

    if (!isRelatedProduct) {
      setProduct((prev) =>
        prev
          ? {
            ...prev,
            tablet: prev.tablet
              ? { ...prev.tablet, isFavorite: !currentStatus }
              : prev.tablet,
          }
          : prev,
      );
    } else {
      setRelatedproducts((prev) => {
        const updated = [...prev];
        if (updated[relatedProductIndex]?.tablet) {
          updated[relatedProductIndex] = {
            ...updated[relatedProductIndex],
            tablet: {
              ...updated[relatedProductIndex].tablet,
              isFavorite: !currentStatus,
            },
          };
        }
        return updated;
      });

      setBrandProducts((prev) => {
        const updated = [...prev];
        if (updated[relatedProductIndex]?.tablet) {
          updated[relatedProductIndex] = {
            ...updated[relatedProductIndex],
            tablet: {
              ...updated[relatedProductIndex].tablet,
              isFavorite: !currentStatus,
            },
          };
        }
        return updated;
      });

      setGenericProducts((prev) => {
        const updated = [...prev];
        if (updated[relatedProductIndex]?.tablet) {
          updated[relatedProductIndex] = {
            ...updated[relatedProductIndex],
            tablet: {
              ...updated[relatedProductIndex].tablet,
              isFavorite: !currentStatus,
            },
          };
        }
        return updated;
      });

      setAlternativeproduct((prev) => {
        const updated = [...prev];
        if (updated[relatedProductIndex]?.tablet) {
          updated[relatedProductIndex] = {
            ...updated[relatedProductIndex],
            tablet: {
              ...updated[relatedProductIndex].tablet,
              isFavorite: !currentStatus,
            },
          };
        }
        return updated;
      });
    }

    try {
      const endpoint = currentStatus ? "favourite/remove" : "favourite/add";
      await axiosUserInstance.post(
        endpoint,
        { itemId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      if (!isRelatedProduct) {
        setProduct((prev) =>
          prev
            ? {
              ...prev,
              tablet: prev.tablet
                ? { ...prev.tablet, isFavorite: currentStatus }
                : prev.tablet,
            }
            : prev,
        );
      } else {
        setRelatedproducts((prev) => {
          const updated = [...prev];
          if (updated[relatedProductIndex]?.tablet) {
            updated[relatedProductIndex] = {
              ...updated[relatedProductIndex],
              tablet: {
                ...updated[relatedProductIndex].tablet,
                isFavorite: currentStatus,
              },
            };
          }
          return updated;
        });

        setBrandProducts((prev) => {
          const updated = [...prev];
          if (updated[relatedProductIndex]?.tablet) {
            updated[relatedProductIndex] = {
              ...updated[relatedProductIndex],
              tablet: {
                ...updated[relatedProductIndex].tablet,
                isFavorite: currentStatus,
              },
            };
          }
          return updated;
        });

        setGenericProducts((prev) => {
          const updated = [...prev];
          if (updated[relatedProductIndex]?.tablet) {
            updated[relatedProductIndex] = {
              ...updated[relatedProductIndex],
              tablet: {
                ...updated[relatedProductIndex].tablet,
                isFavorite: currentStatus,
              },
            };
          }
          return updated;
        });

        setAlternativeproduct((prev) => {
          const updated = [...prev];
          if (updated[relatedProductIndex]?.tablet) {
            updated[relatedProductIndex] = {
              ...updated[relatedProductIndex],
              tablet: {
                ...updated[relatedProductIndex].tablet,
                isFavorite: currentStatus,
              },
            };
          }
          return updated;
        });
      }

      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  const handleAddLead = (vendor, med, variantId, matchedVariant) => {
    if (!isLoggedIn) {
      toast.error("Please login to add lead");
      navigate("/login");
      return;
    }

    const fixedType = med?.subcategorys?.category?.fixedType;
    setCurrentLeadData({
      vendor,
      med,
      variantId,
      matchedVariant,
      fixedType,
    });
    const today = new Date().toISOString().split("T")[0];
    setLeadFormData({
      ...INITIAL_LEAD_FORM,
      date: today,
      relation: "self",
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      mobile: userProfile?.phone || "",
      email: userProfile?.email || "",
      fixedType,
    });
    setShowLeadModal(true);
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!currentLeadData?.med) return;

    const { vendor, med, variantId } = currentLeadData;
    try {
      const token = localStorage.getItem("medicomparestoken");
      await axiosUserInstance.post(
        "lead/create",
        {
          name: leadFormData.name,
          email: leadFormData.email,
          phone: leadFormData.mobile,
          address: leadFormData.address,
          policyNumber: leadFormData.policyNumber,
          relation: leadFormData.relation,
          productId: med._id,
          vendorId:
            vendor.bussinessdetails?.vendorId || vendor.vendorId || vendor._id,
          variantId,
          leadSource: "Website",
          leadStage: "New",
          status: "active",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      toast.success("Lead added successfully!");
      setShowLeadModal(false);
      setLeadFormData(INITIAL_LEAD_FORM);
      setCurrentLeadData(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add lead");
    }
  };

  const handleVendorClick = (vendor) => {
    const vendorId =
      vendor?._id ||
      vendor?.businessdetails?._id ||
      vendor?.bussinessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      const name =
        vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
      const vendorSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  // ============ MODAL HANDLERS ============
  const buildBuyNowPayload = (
    vendor,
    med,
    effectiveVariantId,
    extra = {},
    service,

  ) => [
      {
        productId: med._id,
        variantId: effectiveVariantId,
        vendorId: vendor._id || vendor.vendorId,
        packageId: null,
        type: "normal",
        bookingType: "buy_now",
        servicefixedTypes: service,
        ...extra,
      },
    ];

  const handleNavigateToBooking = async (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
    redirectPath = "/booking-process",
    service
  ) => {
    const payload = buildBuyNowPayload(vendor, med, effectiveVariantId, {}, service);
    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      toast.error("Please login to proceed");
      redirectToLoginWithPendingBooking(navigate, payload, { redirectPath });
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

      navigate(redirectPath, { state: { bookingData: response.data } });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        redirectToLoginWithPendingBooking(navigate, payload, { redirectPath });
      } else {
        toast.error("Failed to create booking");
      }
    }
  };

  const handleRentalBookinProcess = async (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
    service
  ) => {
    const payload = buildBuyNowPayload(vendor, med, effectiveVariantId, {
      perDayRent: vendor?.perDayRent || 0,
      servicefixedTypes: service
    }, service);
    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      toast.error("Please login to proceed");
      redirectToLoginWithPendingBooking(navigate, payload, {
        redirectPath: "/rental-booking-process",
        perDayRent: vendor?.perDayRent || 0,
      });
      return;
    }

    try {
      // if (vendor?.perDayRent) {
      //   localStorage.setItem("perDayRent", vendor.perDayRent);
      // }

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

      navigate("/rental-booking-process", {
        state: { bookingData: response.data },
      });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        redirectToLoginWithPendingBooking(navigate, payload, {
          redirectPath: "/rental-booking-process",
          perDayRent: vendor?.perDayRent || 0,
        });
      } else {
        toast.error("Failed to create booking");
      }
    }
  };

  const handleOpenRentalModal = (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
  ) => {
    if (!isLoggedIn) {
      toast.error("Please login to rent");
      navigate("/login");
      return;
    }
    const fixedType = med?.subcategorys?.category?.fixedType || "dentalservice";
    const selectedVar = med.variant?.find((v) => v._id === effectiveVariantId);

    // Set rental form data with vendor and med
    setRentalFormData({
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      deliveryAddress: "",
      med, // Add med to form data
      vendor, // Add vendor to form data
    });

    setCurrentModalData({
      vendor,
      med,
      effectiveVariantId,
      price,
      stock,
      selectedVar,
      fixedType,
    });
    setShowRentalModal(true);
  };

  const handleOpenConsultationModal = (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
  ) => {
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const fixedType = med?.subcategorys?.category?.fixedType;
    setConsultationFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      fixedType,
    });

    setCurrentModalData({
      vendor,
      med,
      effectiveVariantId,
      price,
      stock,
    });
    setShowConsultationModal(true);
  };

  const handleOpenAppointmentModal = (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
  ) => {
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }

    const fixedType = med?.subcategorys?.category?.fixedType || "dentalservice";
    const today = new Date().toISOString().split("T")[0];

    setAppointmentFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      fixedType,
      med,
      vendor,
    });

    setCurrentModalData({
      vendor,
      med,
      effectiveVariantId,
      price,
      stock,
      fixedType,
    });

    setShowAppointmentModal(true);
  };

  // Handle appointment form submission
  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentFormData.date) {
      toast.error("Please select a date");
      return;
    }

    if (!appointmentFormData.name) {
      toast.error("Please enter your name");
      return;
    }

    if (!appointmentFormData.phone) {
      toast.error("Please enter your phone number");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login to book an appointment");
        navigate("/login");
        return;
      }
      const vendor = appointmentFormData.vendor || currentModalData?.vendor;
      const med = appointmentFormData.med || currentModalData?.med;

      if (!vendor || !med) {
        toast.error("Invalid appointment details");
        return;
      }

      await axiosUserInstance.post(
        "lead/create",
        {
          name: appointmentFormData.name,
          phone: appointmentFormData.phone,
          category: appointmentFormData.category || "Dental Service",
          date: appointmentFormData.date,
          address: appointmentFormData.address || "",
          productId: med._id || med.id,
          vendorId: vendor.vendorId || vendor._id,
          variantId: currentModalData?.effectiveVariantId || null,
          leadSource: "Website",
          leadStage: "New",
          formType: "appointment",
          status: "active",
          serviceType: appointmentFormData.fixedType || "dentalservice",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      toast.success("Appointment booked successfully!");
      setShowAppointmentModal(false);
      setAppointmentFormData({
        date: "",
        name: "",
        phone: "",
        category: "",
        address: "",
        med: null,
        vendor: null,
        fixedType: "",
      });
      setCurrentModalData(null);
    } catch (err) {
      // Error booking appointment
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Failed to book appointment",
      );
    }
  };

  // Modal form handlers
  const handleRentalFormChange = (e) => {
    const { name, value } = e.target;
    setRentalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsultationFormChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppointmentFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRentalSubmit = async (e) => {
    e.preventDefault();
    if (!currentModalData) return;

    const { vendor, med, effectiveVariantId } = currentModalData;
    const vendorId = vendor?.vendorId || vendor?._id;
    const productId = med?._id || med?.id;
    const variantId = effectiveVariantId || med?.variants?.[0]?._id;

    try {
      const token = localStorage.getItem("medicomparestoken");
      const rentalData = {
        ...rentalFormData,
        productId,
        vendorId,
        variantId,
        fixedType: currentModalData.fixedType || "equipment",
      };

      await axiosUserInstance.post("/rentals/create", rentalData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Rental request submitted successfully!");
      setShowRentalModal(false);
      setRentalFormData({
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        deliveryAddress: "",
      });
      setCurrentModalData(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to submit rental request",
      );
    }
  };

  const shareProductData = product ? { tablet: product.tablet } : null;
  const shareSelectedVariants = product?.tablet?._id
    ? {
      ...selectedVariants,
      [product.tablet._id]:
        selectedVariantId ||
        selectedVariants[product.tablet._id] ||
        product.tablet.variant?.[0]?._id,
    }
    : selectedVariants;

  const createShareHandler = (productData, selectedVariantsData) => {
    return {
      copy: async () => {
        try {
          const url = getShareUrl(productData);
          await copyToClipboard(url, () => {
            toast.success("Link copied to clipboard!");
            setShowShareModal(false);
            setShareProductDataForModal(null);
          });
        } catch (err) {
          toast.error("Failed to copy link");
        }
      },
      whatsapp: () => {
        const url = getShareUrl(productData);
        const text = getShareText(productData, selectedVariantsData);
        shareToWhatsApp(url, text, () => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        });
      },
      facebook: () => {
        const url = getShareUrl(productData);
        shareToFacebook(url, () => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        });
      },
      twitter: () => {
        const url = getShareUrl(productData);
        const text = getShareText(productData, selectedVariantsData);
        shareToTwitter(url, text, () => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        });
      },
      email: () => {
        const url = getShareUrl(productData);
        const text = getShareText(productData, selectedVariantsData);
        shareToEmail(url, text, () => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        });
      },
      telegram: () => {
        const url = getShareUrl(productData);
        const text = getShareText(productData, selectedVariantsData);
        shareToTelegram(url, text, () => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        });
      },
      linkedin: () => {
        const url = getShareUrl(productData);
        const text = getShareText(productData, selectedVariantsData);
        shareToLinkedIn(url, text, () => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        });
      },
    };
  };

  const handleShare = createShareHandler(
    shareProductData,
    shareSelectedVariants,
  );

  useEffect(() => {
    const init = async () => {
      if (!isLoggedIn) {
        const cart = getCart();
        const quantities = {};
        cart.forEach((item) => (quantities[item.cartKey] = item.quantity));
        setCartQuantities(quantities);
      } else {
        try {
          const token = localStorage.getItem("medicomparestoken");
          const response = await axiosCommonInstance.get("cart/list", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = response.data.data;
          if (data?.cart) {
            const quantities = {};
            data.cart.forEach((item) => {
              quantities[
                `${item.vendorId}_${item.variantId || item.productId}`
              ] = item.quantity || 0;
            });
            saveUiQuantities(quantities);
            setCartQuantities(quantities);
          }
        } catch {
          setCartQuantities(loadUiQuantities());
        }
      }
    };
    init();

    const onUpdated = () => {
      if (localStorage.getItem("medicomparestoken")) {
        setCartQuantities(loadUiQuantities());
      } else {
        const cart = getCart();
        const quantities = {};
        cart.forEach((item) => (quantities[item.cartKey] = item.quantity));
        setCartQuantities(quantities);
      }
    };

    window.addEventListener("cartUpdated", onUpdated);
    return () => window.removeEventListener("cartUpdated", onUpdated);
  }, [isLoggedIn]);

  useEffect(() => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return;
    const local = getCart();

    if (local.length > 0) {
      axiosCommonInstance
        .post("cart/create", local, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then(() => {
          const quantities = {};
          local.forEach((item) => (quantities[item.cartKey] = item.quantity));
          sessionStorage.setItem(UI_QTY_KEY, JSON.stringify(quantities));
          localStorage.removeItem("pharmacyCart");
          window.dispatchEvent(new Event("cartUpdated"));
          setCartQuantities(quantities);
        })
        .catch(() => toast.error("Could not sync cart"));
    }
  }, [isLoggedIn]);

  const getSelectedVariant = () => {
    if (!product?.tablet?.variant) return null;
    return (
      product.tablet.variant.find((v) => v._id === selectedVariantId) ||
      product.tablet.variant[0]
    );
  };

  const tablet = product?.tablet || {};
  const allVendors = product?.vendors || [];
  const isSurgery =
    product?.tablet?.subcategorys?.category?.fixedType === "surgeries";

  const selectedVariant = getSelectedVariant();
  const med =
    tablets[0] ||
    (product?.tablet ? { ...product.tablet, vendors: allVendors || [] } : null);

  const isMedicine =
    product?.tablet?.subcategorys?.category?.fixedType === "medicine";
  const currentVariantId =
    (med && selectedVariants[med._id]) || selectedVariantId;

  const variantVendors = useMemo(() => {
    if (!med || (isMedicine && !checkedPincode)) return [];
    return buildVendorVariants(allVendors, currentVariantId);
  }, [med, allVendors, currentVariantId, isMedicine, checkedPincode]);

  const fallbackVendors = useMemo(() => {
    if (variantVendors.length > 0 || !med) return [];
    return buildVendorVariants(allVendors, null);
  }, [variantVendors.length, med, allVendors]);

  const filteredVariantVendors = checkedPincode
    ? variantVendors.filter((v) => {
      const vendor = allVendors.find(
        (av) => av._id === v.vendorId || av._id === v._id,
      );
      return vendor?.isavailablepincode === true;
    })
    : [];

  const filteredFallbackVendors = checkedPincode
    ? fallbackVendors.filter((v) => {
      const vendor = allVendors.find(
        (av) => av._id === v.vendorId || av._id === v._id,
      );
      return vendor?.isavailablepincode === true;
    })
    : [];

  const filteredVendors = checkedPincode
    ? allVendors.filter((v) => v.isavailablepincode === true)
    : [];

  const renderVendorCard = (vendor, index, isVariant = true) => {
    if (!med) return null;

    const serviceBookingTypes = [
      "consultation",
      "appointment",
      "rentals",
      "slots",
      "lead",
      "leads",
      "booking",
      "rentals_addtocarts",
      "cart",
    ];


    const DistanceShowable = [
      "rx-medicines",
      "medicine",
      "labtests",
      "lab-tests",
      "diagnostics",
      "homecare",
      "home-care",
      "medical-equipment",
      "medicalequipment",
      "nursingcare",
      "clinics-and-rehabs",
      "dentalservice",
      "dental-care",
      "medicaltreatment",
      "treatments",
      "surgeries",
      // "ambulanceservice",
      // "Ambulance"
    ]
    const bookingType = vendor.bookingType || vendor.bookingtype || null;

    let price;
    if (fixedtypeSlug === "medicalequipment" || fixedtypeSlug === "medical-equipment") {
      price = isVariant
        ? (vendor.matchedVariantPrice ?? vendor.matchedPrice ?? vendor.price ?? 0)
        : (vendor.price ?? vendor.matchedPrice ?? 0);
    } else {
      price = isVariant
        ? (vendor.matchedVariantPrice ?? vendor.matchedPrice ?? vendor.price ?? 0)
        : (vendor.price ?? vendor.matchedPrice ?? 0);
    }
    const discountPrice = isVariant
      ? (vendor.matchedVariantDiscountPrice ??
        vendor.matchedDiscountPrice ??
        vendor.discountprice ??
        vendor.discountPrice ??
        null)
      : (vendor.discountprice ??
        vendor.discountPrice ??
        vendor.matchedVariantDiscountPrice ??
        vendor.matchedDiscountPrice ??
        vendor.discount ??
        null);




    // Calculate discount price based on discountType
    let calculatedDiscountPrice = discountPrice;
    const discountType = isVariant
      ? (vendor.matchedVariantDiscountType ?? vendor.discountType ?? null)
      : (vendor.discountType ?? vendor.matchedVariantDiscountType ?? null);

    if (discountType === "percentage" && discountPrice && discountPrice > 0) {
      calculatedDiscountPrice = price - (price * discountPrice) / 100;
    }

    const vendorName =
      vendor.vendorName || vendor.bussinessdetails?.name || "Vendor";

    const stock = isVariant
      ? (vendor.matchedVariantStock ?? vendor.matchedStock ?? vendor.stock ?? 0)
      : (vendor.stock ??
        vendor.matchedStock ??
        vendor.matchedVariantStock ??
        0);



    const isServiceType = serviceBookingTypes.includes(bookingType);
    const isInStock = isServiceType ? true : stock > 0;

    // Pin selection: Use vendor match if available, otherwise use UI selection. Never fall back to null.
    const uiSelection = selectedVariants[med._id] || selectedVariantId;
    const effectiveVariantId =
      isVariant && vendor.matchedVariantId
        ? vendor.matchedVariantId
        : uiSelection || med.variant?.[0]?._id

    const quantity = getCartQuantity(
      vendor._id || vendor.vendorId,
      med._id,
      effectiveVariantId,
    );

    let maxStock = 999;
    if (isVariant && effectiveVariantId) {
      const matchedVendorVariant = vendor?.variant?.find(
        (v) =>
          v.variantId === effectiveVariantId || v._id === effectiveVariantId,
      );
      if (matchedVendorVariant && matchedVendorVariant.isStock) {
        maxStock = matchedVendorVariant.stock ?? 0;
      } else if (
        matchedVendorVariant &&
        matchedVendorVariant.stock !== undefined
      ) {
        maxStock = matchedVendorVariant.stock ?? 999;
      } else {
        const vendorStock =
          vendor.matchedVariantStock ?? vendor.matchedStock ?? vendor.stock;
        if (vendorStock !== undefined && vendorStock !== null) {
          maxStock = vendorStock;
        } else {
          const variantStock = med.variant?.find(
            (v) => v._id === effectiveVariantId,
          )?.stock;
          maxStock = variantStock !== undefined ? variantStock : 999;
        }
      }
    } else {
      const vendorStock =
        vendor.stock ?? vendor.matchedStock ?? vendor.matchedVariantStock;
      maxStock =
        vendorStock !== undefined && vendorStock !== null ? vendorStock : 999;
    }
    let discount = 0;
    if (
      calculatedDiscountPrice &&
      calculatedDiscountPrice > 0 &&
      calculatedDiscountPrice !== price
    ) {
      if (calculatedDiscountPrice > price) {
        discount = Math.round(
          ((calculatedDiscountPrice - price) / calculatedDiscountPrice) * 100,
        );
      } else {
        discount = Math.round(
          ((price - calculatedDiscountPrice) / price) * 100,
        );
      }
    }

    const effectivePriceForCart =
      calculatedDiscountPrice && calculatedDiscountPrice > 0
        ? calculatedDiscountPrice
        : null;
    const fullVendor = allVendors.find(
      (av) =>
        av._id === vendor.vendorId ||
        av._id === vendor._id ||
        av.id === vendor.vendorId ||
        av.id === vendor._id,
    );
    const estimatedDelivery =
      fullVendor?.currentdeliverypincodes?.estimateddelivery ||
      fullVendor?.deliverypincodess?.[0]?.estimateddelivery ||
      null;
    const distance = estimatedDelivery || "Delivery time not available";
    const distanceInKm = vendor.distanceInKm || fullVendor?.bussinessdetails?.distance;
    const renderVendorActions = () => {
      return (
        <VendorActions
          bookingType={bookingType}
          isMobile={isMobile}
          isInStock={isInStock}
          med={med}
          vendor={vendor}
          fullVendor={fullVendor}
          effectiveVariantId={effectiveVariantId}
          price={price}
          containerStyle={{
            flexDirection: "column"
          }}
          // stock={stock}
          service={fixedtypeSlug}
          calculatedDiscountPrice={calculatedDiscountPrice}
          isVariant={isVariant}
          effectivePriceForCart={effectivePriceForCart}
          selectedVariant={selectedVariant}
          // maxStock={maxStock}
          handleRentalBookinProcess={handleRentalBookinProcess}
          handleNavigateToBooking={handleNavigateToBooking}
          handleAddLead={handleAddLead}
          handleOpenConsultationModal={handleOpenConsultationModal}
          handleOpenAppointmentModal={handleOpenAppointmentModal}
          handleAddToCart={handleAddToCart}
          handleSingleAddToCart={handleSingleAddToCart}
        />
      );
    };

    return (
      <div
        key={vendor._id || vendor.vendorId || index}
        onClick={() => handleVendorClick(vendor)}
        className="p-[10px_12px] !border !border-[#e5e7eb] !rounded-sm mb-2 bg-white transition-all duration-200 flex flex-wrap items-start gap-2 w-full last:mb-0 hover:border-[#321961] hover:shadow-sm cursor-pointer"
      >
        {bookingType === "rentals_addtocarts" ? (
          <div
            className="flex gap-[10px] flex-1 min-w-0 items-center"
          >
            {vendor.bussinessdetails?.bussiness_image?.url && (
              <div
                className="w-10 h-10 rounded-lg bg-[#f4f0ff] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
              >
                <img
                  src={getImageUrl(vendor.bussinessdetails.bussiness_image.url)}
                  alt={vendorName}
                  title={vendorName}
                />
              </div>
            )}
            <div
              className={`flex-1 min-w-0 flex ${isMobile ? "flex-col" : "flex-row"} justify-between gap-[2px]`}
            >
              <div>
                <div
                  className="flex items-center justify-between gap-1 flex-wrap"
                >
                  <div
                    className="!text-[14px] !font-semibold !text-[#1a1d26] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap hover:text-[#321961] transition-colors duration-200 font-sans max-w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVendorClick(vendor);
                    }}
                  >
                    {vendorName}
                  </div>
                </div>

                <div
                  className="text-[10px] text-[#6b7280] flex items-center gap-1 flex-wrap"
                >
                  <div
                    className="flex items-baseline gap-[6px] flex-wrap"
                  >
                    {calculatedDiscountPrice &&
                      calculatedDiscountPrice > 0 &&
                      calculatedDiscountPrice !== price ? (
                      <>
                        <span
                          className="text-[13px] font-[500] text-[#321961]"
                          style={{ fontFamily: '"Poppins", sans-serif' }}
                        >
                          ₹{calculatedDiscountPrice.toFixed(2)}
                        </span>
                        <span
                          className="text-[11px] text-[#6b7280] line-through"
                          style={{
                            fontFamily: '"Poppins", sans-serif',
                            color: "#321961",
                          }}
                        >
                          ₹{price.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span
                        className="text-[13px] font-[500] text-[#321961]"
                        style={{
                          fontFamily: '"Poppins", sans-serif',
                          color: "#321961",
                          fontWeight: "600",
                        }}
                      >
                        ₹{price.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div
                    className="flex items-center gap-1 flex-wrap"
                  >
                    {discount > 0 && (
                      <small
                        className="text-green-600 text-[11px] font-sans whitespace-nowrap"
                      >
                        {discountType === "percentage" && discountPrice
                          ? `${discountPrice}% OFF`
                          : `${discount}% OFF`}
                      </small>
                    )}
                  </div>
                </div>

                <div
                  className="flex flex-wrap items-center gap-[6px] mt-[2px]"
                >
                  {Number(fullVendor?.serviceCharges || 0) > 0 && (
                    <small
                      className="text-[10px] font-semibold font-sans whitespace-nowrap"
                    >
                      Service Fee: ₹{Number(fullVendor?.serviceCharges).toFixed(2)}
                    </small>
                  )}
                  {Number(fullVendor?.fixedDeposit || 0) > 0 && (
                    <small
                      className="text-[10px] font-semibold font-sans whitespace-nowrap"
                    >
                      Security Deposit: ₹{Number(fullVendor?.fixedDeposit).toFixed(2)}
                    </small>
                  )}
                  {Number(fullVendor?.returnCharge || 0) > 0 && (
                    <small
                      className="text-[10px] font-semibold font-sans whitespace-nowrap"
                    >
                      Return Charge: ₹{Number(fullVendor?.returnCharge).toFixed(2)}
                    </small>
                  )}
                  {Number(fullVendor?.perDayRent || vendor?.perDayRent || 0) > 0 && (
                    <small
                      className="text-[10px] font-semibold font-sans whitespace-nowrap text-[#321961]"
                    >
                      <i
                        className="fas fa-calendar-day mr-0.5 text-[8px]"
                      ></i>
                      Per Day Rent: ₹{Number(fullVendor?.perDayRent || vendor?.perDayRent).toFixed(2)}
                    </small>
                  )}
                </div>

                {vendor.bussinessdetails?.address && (
                  <div
                    className="text-[11px] text-[#666] overflow-hidden text-ellipsis whitespace-nowrap max-w-full font-sans"
                  >
                    <i
                      className="fas fa-map-marker-alt text-[9px] mr-1 text-[#321961]"
                    ></i>
                    {vendor.bussinessdetails.address.slice(0, 26)}
                  </div>
                )}

                <div
                  className="flex flex-col gap-[2px] flex-wrap"
                >
                  {distanceInKm && (
                    <div
                      className="flex items-center gap-1"
                    >
                      <i
                        className="fas fa-map-marker-alt text-[10px]"
                      ></i>
                      <span
                        className="text-[10px] font-semibold font-sans"
                      >
                        {distanceInKm.toFixed(1)} km away
                      </span>
                    </div>
                  )}

                  {

                    (product.tablet.category.fixedType === 'medicine' || product.tablet.category.fixedType === 'medicines') && (
                      <div
                        className="flex items-center gap-1"
                      >
                        <i
                          className="fas fa-truck mr-1 text-[10px]"
                        ></i>
                        <span
                          className="text-[10px] font-semibold font-sans"
                        >
                          {distance}
                        </span>
                      </div>
                    )
                  }
                </div>
              </div>
              <div className="shrink-0">{renderVendorActions()}</div>
            </div>
          </div>
        ) : (
          <div
            className="flex gap-[10px] flex-1 min-w-0 flex-wrap items-center"
          >
            {vendor.bussinessdetails?.bussiness_image?.url && (
              <div
                className="w-10 h-10 rounded-lg bg-[#f4f0ff] flex items-center justify-center shrink-0 overflow-hidden cursor-pointer"
              >
                <img
                  src={getImageUrl(vendor.bussinessdetails.bussiness_image.url)}
                  alt={vendorName}
                  title={vendorName}
                />
              </div>
            )}
            <div
              className="flex-1 min-w-0 flex flex-col gap-[2px]"
            >
              <div
                className="flex items-center justify-between gap-1 flex-wrap"
              >
                <div
                  className="text-[11px] font-semibold text-[#1a1d26] cursor-pointer overflow-hidden text-ellipsis whitespace-nowrap hover:text-[#321961] transition-colors duration-200 font-sans max-w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVendorClick(vendor);
                  }}
                >
                  {vendorName.length > 20
                    ? vendorName.slice(0, 20) + "..."
                    : vendorName}
                </div>
                {!isMobile && (
                  <div className="shrink-0">{renderVendorActions()}</div>
                )}
              </div>

              <div
                className="text-[10px] text-[#6b7280] flex items-center gap-[3px] flex-wrap"
              >
                <div
                  className="flex items-baseline gap-[6px] flex-wrap"
                >
                  {calculatedDiscountPrice &&
                    calculatedDiscountPrice > 0 &&
                    calculatedDiscountPrice !== price ? (
                    <>
                      <span
                        className="text-[13px] font-[500] text-[#321961]"
                        style={{ fontFamily: '"Poppins", sans-serif' }}
                      >
                        ₹{calculatedDiscountPrice.toFixed(2)}
                      </span>
                      <span
                        className="text-[11px] text-[#6b7280] line-through"
                        style={{
                          fontFamily: '"Poppins", sans-serif',
                          color: "#321961",
                        }}
                      >
                        ₹{price.toFixed(2)}
                      </span>
                    </>
                  ) : (
                    <span
                      className="text-[13px] font-[500] text-[#321961]"
                      style={{
                        fontFamily: '"Poppins", sans-serif',
                        color: "#321961",
                        fontWeight: "600",
                      }}
                    >
                      ₹{price.toFixed(2)}
                    </span>
                  )}
                </div>
                <div
                  className="flex items-center gap-[4px] flex-wrap"
                >
                  {discount > 0 && (
                    <small
                      className="text-green-600 text-[11px] font-sans whitespace-nowrap"
                    >
                      {discountType === "percentage" && discountPrice
                        ? `${discountPrice}% OFF`
                        : `${discount}% OFF`}
                    </small>
                  )}
                </div>
              </div>

              <div
                className="flex flex-wrap items-center gap-[6px] mt-[2px]"
              ></div>

              {vendor.bussinessdetails?.address && (
                <div
                  className="text-[11px] text-[#666] overflow-hidden text-ellipsis whitespace-nowrap max-w-full font-sans"
                >
                  <i
                    className="fas fa-map-marker-alt text-[9px] mr-1 text-[#321961]"
                  ></i>
                  {vendor.bussinessdetails.address.slice(0, 26)}
                </div>
              )}
              <div
                className="flex flex-col gap-[2px] flex-wrap"
              >
                {distanceInKm && DistanceShowable.includes(service) && (
                  <div className="flex items-center gap-1">
                    <i className="fas fa-map-marker-alt text-[10px]"></i>
                    <span className="text-[10px] font-semibold font-sans">
                      {distanceInKm.toFixed(1)} km away
                    </span>
                  </div>
                )}

                {

                  (product?.tablet?.category?.fixedType === 'medicine' || product?.tablet?.category?.fixedType === 'medicines') && (
                    <div className="flex items-center gap-1">
                      <i className="fas fa-truck mr-1 text-[10px]"></i>
                      <span className="text-[10px] font-semibold font-sans">
                        {distance}
                      </span>
                    </div>
                  )
                }

              </div>

              {isMobile && (
                <div className="shrink-0">{renderVendorActions()}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <PageLoader />;
  }

  if (!product) {
    return (
      <div className="w-full px-4 p-0">
        <div className="w-full overflow-hidden relative flex-wrap block h-screen">
          <div className="flex flex-wrap justify-center items-center h-screen overflow-auto flex-wrap ">
            <div className="lg:w-[66.666%] md:w-full text-center">
              <div className="error-info">
                <div className="error-404-img">
                  <img
                    src="/assets/404error.png"
                    className="max-w-full h-auto bg-white errorimage"
                    alt="error-404-image"
                    title="error image"
                  />
                  <div className="error-content">
                    <h5 className="mb-2">Oops! That Page Can’t Be Found.</h5>
                    <p>The page you are looking for was never existed.</p>
                    <Link to="/" className="inline-flex items-center gap-1 px-4 py-2 bg-[#321961] text-white rounded-lg text-sm font-medium hover:bg-[#6d46b8] transition-colors">
                      <i className="fas fa-home mr-1"></i> Back to Home
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getFirstNWords = (htmlText, wordCount = 50) => {
    if (!htmlText) return "";

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0);

    if (words.length <= wordCount) {
      return htmlText;
    }

    const firstNWords = words.slice(0, wordCount).join(" ");

    const textIndex = textContent.indexOf(firstNWords);
    if (textIndex === -1) {
      return htmlText.substring(0, Math.min(htmlText.length, 800)) + "...";
    }

    let htmlIndex = 0;
    let textPos = 0;
    const targetTextPos = textIndex + firstNWords.length;

    let insideTag = false;

    while (htmlIndex < htmlText.length && textPos < targetTextPos) {
      const char = htmlText[htmlIndex];

      if (char === "<") {
        insideTag = true;
        htmlIndex++;
        while (htmlIndex < htmlText.length && htmlText[htmlIndex] !== ">") {
          htmlIndex++;
        }
        if (htmlIndex < htmlText.length) {
          htmlIndex++;
        }
        insideTag = false;
        continue;
      }

      if (!insideTag) {
        if (char.trim() || textPos > 0) {
          textPos++;
        }
      }

      htmlIndex++;
    }

    let safeCutPosition = htmlIndex;
    for (
      let i = htmlIndex;
      i < Math.min(htmlText.length, htmlIndex + 50);
      i++
    ) {
      if (htmlText[i] === " " || htmlText[i] === ">" || htmlText[i] === "\n") {
        safeCutPosition = i + 1;
        break;
      }
    }

    return htmlText.substring(0, safeCutPosition) + "...";
  };

  const hasMoreThanNWords = (htmlText, wordCount = 50) => {
    if (!htmlText) return false;
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlText;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";
    const words = textContent
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0);
    return words.length > wordCount;
  };

  const scrollToElement = (elementId) => {
    setTimeout(() => {
      const element = document.getElementById(elementId);
      if (element) {
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - 100;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    }, 100);
  };

  const formatDynamicFieldValue = (value) => {
    if (typeof value === "string" && value.includes("|")) {
      const items = value.split("|").map(item => item.trim()).filter(Boolean);
      const isShortItems = items.every(item => item.length < 30);
      if (isShortItems) {
        return (
          <div className="flex flex-wrap gap-1 mt-1">
            {items.map((item, idx) => (
              <span key={idx} className="inline-block bg-gray-100 text-gray-900 border border-gray-200 text-[11px] font-medium px-2 py-1 rounded-xl capitalize">
                {item}
              </span>
            ))}
          </div>
        );
      } else {
        return (
          <ul className="mb-0 pl-3" style={{ listStyleType: "disc", paddingLeft: "15px" }}>
            {items.map((item, idx) => (
              <li key={idx} style={{ marginBottom: "2px", lineHeight: "1.4" }}>
                {item}
              </li>
            ))}
          </ul>
        );
      }
    }
    return value;
  };

  return (
    <>
      {<Home2Header />}
      <CategoryProvider isLoading={loading} />
      <div className="w-full max-w-[1440px] mx-auto px-3 md:px-5 mt-3 mb-6">
        <div className="grid grid-cols-1 lg:grid-cols-[74%_1fr] gap-6">
          <div
            className="min-w-0"
          // style={{ marginTop: isMobile ? "40px" : "40px" }}
          >
            <div className="lg:mt-1 md:mt-1">
              <div className="mb-2">
                <button
                  className="flex items-center gap-[6px] p-[4px_10px] border border-[#e0e0e0] bg-white text-[#333] font-[500] text-[12px] !rounded-[6px] shadow-sm cursor-pointer transition-all duration-300 hover:border-[#321961] hover:text-[#321961] hover:bg-[#f8f5ff] hover:shadow-[0_4px_8px_rgba(125,46,255,0.15)] hover:-translate-y-px"
                  onClick={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();

                    if (isNavigating) {
                      return;
                    }

                    setIsNavigating(true);

                    try {
                      const navigationMethods = [
                        () => navigate(-1),
                        () => window.history.back(),
                        () => navigate(-1, { replace: true }),
                      ];

                      for (const method of navigationMethods) {
                        try {
                          method();
                          await new Promise((resolve) =>
                            setTimeout(resolve, 200),
                          );

                          if (window.location.pathname !== location.pathname) {
                            break;
                          }
                        } catch (err) {
                          continue;
                        }
                      }
                    } catch (error) {
                    } finally {
                      setTimeout(() => {
                        setIsNavigating(false);
                      }, 500);
                    }
                  }}
                >
                  <i className="fas fa-arrow-left text-[11px]"></i>
                  <span className="text-[12px] font-medium">
                    Back
                  </span>
                </button>
              </div>

              <div className="w-full">
                {descriptionTop && descriptionTop.length > 0 && (
                  <div className="text-center mb-3">
                    <Slider
                      {...{
                        ...descriptionTopSettings,
                        dots: descriptionTop.length > 1,
                        infinite: descriptionTop.length > 1,
                        autoplay: descriptionTop.length > 1,
                      }}
                    >
                      {descriptionTop.map((banner, index) => (
                        <div key={index} className="mx-1">
                          <img
                            src={banner.src}
                            alt={banner.alt}
                            loading="lazy"
                            className="w-full rounded-[10px] object-cover"
                          />
                        </div>
                      ))}
                    </Slider>
                  </div>
                )}

                <div className="bg-white rounded-sm shadow-sm">
                  <div className="p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-[58%_1fr] gap-4 items-start">
                      <div className="relative">
                        <div className="relative w-full px-3 flex flex-wrap justify-between gap-2 mb-4">
                          <div className="flex flex-col flex-wrap items-start md:items-center gap-2">
                            <div className="flex items-center gap-2 bg-white px-2 py-1 rounded small">
                              <span className="text-yellow-500 font-semibold bg-primary px-1 rounded">
                                <i className="fas fa-star mr-1 text-[10px]"></i>{" "}
                                <span className="text-white font-semibold text-[10px]">
                                  {ratingsum && typeof ratingsum === "number"
                                    ? ratingsum.toFixed(1)
                                    : "0"}
                                </span>
                              </span>
                              <span className="text-gray-500">
                                <i className="fas fa-users mr-1"></i>(
                                {ratingpeople > 0 ? `${ratingpeople}+` : "0"})
                              </span>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <div
                              className="w-7 h-7 !rounded-full bg-slate-100/80 hover:bg-purple-50 flex items-center justify-center transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-slate-200/60 cursor-pointer"
                              onClick={() => setShowShareModal(true)}
                              data-tooltip-id="global-tooltip"
                              data-tooltip-content="Share"
                            >
                              <FaRegShareSquare size={15} color="#9ca3af" />
                            </div>
                            <div
                              className="w-7 h-7 !rounded-full bg-slate-100/80 hover:bg-red-50 flex items-center justify-center transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-slate-200/60 cursor-pointer"
                              data-tooltip-id="global-tooltip"
                              data-tooltip-content="Wishlist"
                              onClick={() =>
                                handleToggleFavourite(
                                  product.tablet._id,
                                  product.tablet.isFavorite,
                                )
                              }
                            >
                              {product?.tablet?.isFavorite ? (
                                <FaHeart size={16} color="#ef4444" />
                              ) : (
                                <IoIosHeartEmpty size={16} color="#9ca3af" />
                              )}
                            </div>
                            <div
                              className="w-7 h-7 !rounded-full bg-slate-100/80 hover:bg-blue-50 flex items-center justify-center transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-slate-200/60 cursor-pointer"
                              data-tooltip-id="global-tooltip"
                              data-tooltip-content="Compare"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (tablet.slug) {
                                  const categorySlug =
                                    tablet.category?.slug ||
                                    tablet.subcategorys?.category?.slug ||
                                    "medicine";
                                  const subcategorySlug =
                                    tablet.subcategorys?.slug || "tablets";
                                  navigate(
                                    `/${categorySlug}/${subcategorySlug}/${tablet.slug}/compare${pincode || checkedPincode ? `?pincode=${pincode || checkedPincode}` : ""}`,
                                  );
                                }
                              }}
                            >
                              <FaExchangeAlt size={14} color="#9ca3af" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-[2fr_3fr] mt-4 items-start gap-4">
                          <div className="min-w-0 flex flex-col items-center">
                            {/* Main Image Container */}
                            <div
                              className={`relative overflow-hidden w-full aspect-square max-h-[280px] sm:max-h-[320px] bg-slate-50/70 border border-slate-100 rounded-2xl flex items-center justify-center p-4 hover:cursor-zoom-in group transition-all duration-300 ${isMobile ? "mt-[10px]" : ""}`}
                              ref={imageZoomRef}
                              onMouseMove={(e) => {
                                if (isMobile) return;
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                const x =
                                  ((e.clientX - rect.left) / rect.width) * 100;
                                const y =
                                  ((e.clientY - rect.top) / rect.height) * 100;
                                setImageZoom({ x, y, scale: 1.8 });
                              }}
                              onClick={() => {
                                if (isMobile) {
                                  const variantImages =
                                    selectedVariant?.files || [];
                                  const tabletImages =
                                    tablet?.files?.length > 0
                                      ? tablet.files
                                      : tablet?.imageUrl || [];

                                  let allImages;
                                  if (variantImages.length > 0) {
                                    allImages = [
                                      ...variantImages,
                                    ];
                                  } else {
                                    allImages = tabletImages.length > 0 ? [...tabletImages] : ["/medicine.jpg"];
                                  }

                                  const imageUrl =
                                    allImages[selectedImageIndex] ||
                                    allImages[0] ||
                                    "/medicine.jpg";
                                  const finalSrc = getImageUrl(imageUrl);
                                  setPreviewImage(finalSrc);
                                  setCurrentModalIndex(selectedImageIndex);
                                  setShowImageModal(true);
                                }
                              }}
                              onMouseLeave={() => {
                                setImageZoom({ x: 50, y: 50, scale: 1 });
                              }}
                            >
                              {(() => {
                                const variantImages =
                                  selectedVariant?.files || [];

                                const tabletImages =
                                  tablet?.files?.length > 0
                                    ? tablet.files
                                    : tablet?.imageUrl || [];

                                let allImages;
                                if (variantImages.length > 0) {
                                  allImages = [
                                    ...variantImages,
                                  ];
                                } else {
                                  allImages = tabletImages.length > 0 ? [...tabletImages] : ["/medicine.jpg"];
                                }

                                const imageUrl =
                                  allImages[selectedImageIndex] ||
                                  allImages[0] ||
                                  "/medicine.jpg";

                                const finalSrc = getImageUrl(imageUrl);

                                return (
                                  <img
                                    src={finalSrc}
                                    alt={tablet?.name}
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        "/medicine.jpg";
                                    }}
                                    className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out will-change-transform group-hover:shadow-sm"
                                    style={{
                                      transform: `scale(${imageZoom.scale})`,
                                      transformOrigin: `${imageZoom.x}% ${imageZoom.y}%`,
                                      cursor: isMobile ? "pointer" : "zoom-in",
                                    }}
                                  />
                                );
                              })()}
                            </div>

                            {/* Gallery Thumbnails */}
                            {(() => {
                              const variantImages =
                                selectedVariant?.files || [];

                              const tabletImages =
                                tablet?.files?.length > 0
                                  ? tablet.files
                                  : tablet?.imageUrl || [];
                              let allImages;
                              if (variantImages.length > 0) {
                                allImages = [
                                  ...variantImages,
                                ];
                              } else {
                                allImages = tabletImages.length > 0 ? [...tabletImages] : ["/medicine.jpg"];
                              }

                              const maxThumbnails = allImages.length;
                              const visibleThumbnails = 3;

                              const handlePrevThumbnails = () => {
                                setThumbnailStartIndex((prev) =>
                                  Math.max(0, prev - 1),
                                );
                              };

                              const handleNextThumbnails = () => {
                                setThumbnailStartIndex((prev) =>
                                  Math.min(
                                    maxThumbnails - visibleThumbnails,
                                    prev + 1,
                                  ),
                                );
                              };

                              return (
                                <div className="flex flex-col items-center w-full mt-3">
                                  {maxThumbnails > 1 && (
                                    <div className="flex items-center justify-center gap-2 w-full px-1">
                                      {maxThumbnails > visibleThumbnails && (
                                        <button
                                          onClick={handlePrevThumbnails}
                                          disabled={thumbnailStartIndex === 0}
                                          className={`flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-[#321961] hover:text-[#321961] hover:bg-slate-50 transition-all duration-200 bg-white w-7 h-7 p-0 shadow-sm ${thumbnailStartIndex === 0
                                            ? "opacity-40 cursor-not-allowed"
                                            : "opacity-100 cursor-pointer"
                                            }`}
                                        >
                                          <i className="fas fa-chevron-left text-[10px]"></i>
                                        </button>
                                      )}

                                      <div className="flex gap-2 justify-center overflow-hidden py-0.5">
                                        {allImages
                                          .slice(
                                            thumbnailStartIndex,
                                            thumbnailStartIndex +
                                            visibleThumbnails,
                                          )
                                          .map((img, idx) => {
                                            const actualIndex =
                                              thumbnailStartIndex + idx;
                                            return (
                                              <img
                                                key={actualIndex}
                                                src={getImageUrl(img)}
                                                alt={`${tablet?.name} ${actualIndex + 1}`}
                                                title={`${tablet?.name} ${actualIndex + 1}`}
                                                className={`w-[50px] h-[50px] sm:w-[56px] sm:h-[56px] object-contain border rounded-xl p-1 bg-white cursor-pointer transition-all duration-200 hover:scale-105 ${selectedImageIndex === actualIndex ? "border-[#321961] ring-2 ring-[#321961]/20 shadow-sm" : "border-slate-200 hover:border-slate-350"}`}
                                                onClick={() =>
                                                  setSelectedImageIndex(
                                                    actualIndex,
                                                  )
                                                }
                                                onMouseEnter={() =>
                                                  setSelectedImageIndex(
                                                    actualIndex,
                                                  )
                                                }
                                              />
                                            );
                                          })}
                                      </div>

                                      {maxThumbnails > visibleThumbnails && (
                                        <button
                                          onClick={handleNextThumbnails}
                                          disabled={
                                            thumbnailStartIndex >=
                                            maxThumbnails - visibleThumbnails
                                          }
                                          className={`flex items-center justify-center rounded-full border border-slate-200 text-slate-600 hover:border-[#321961] hover:text-[#321961] hover:bg-slate-50 transition-all duration-200 bg-white w-7 h-7 p-0 shadow-sm ${thumbnailStartIndex >=
                                            maxThumbnails - visibleThumbnails
                                            ? "opacity-40 cursor-not-allowed"
                                            : "opacity-100 cursor-pointer"
                                            }`}
                                        >
                                          <i className="fas fa-chevron-right text-[10px]"></i>
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  <button
                                    className="inline-flex items-center gap-1.5 px-4 py-1.5 !text-xs !font-semibold !border !border-[#321961] !text-[#321961] rounded-full hover:!bg-[#321961] hover:!text-white transition-all duration-200 ease-in-out cursor-pointer mt-6 shadow-sm hover:shadow"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      const token =
                                        localStorage.getItem(
                                          "medicomparestoken",
                                        );
                                      if (!token) {
                                        toast.error(
                                          "Please login to write a review",
                                        );
                                        navigate("/login");
                                        return;
                                      }

                                      setSelectedProductForReview(
                                        tablet || med,
                                      );
                                      setShowReviewModal(true);
                                    }}
                                  >
                                    <i className="fas fa-edit text-xs"></i>
                                    <span>Write a Review</span>
                                  </button>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="min-w-0">
                            <h5 className="font-semibold mb-1 capitalize">
                              {tablet?.name ? tablet.name.charAt(0).toUpperCase() + tablet.name.slice(1) : ""}
                            </h5>
                            {tablet?.medicineType && (
                              <div className="mb-1">
                                <span
                                  className="inline-block bg-[#321961] text-white text-xs px-2 py-0.5 rounded-full capitalize"
                                  style={{ textTransform: "capitalize" }}
                                >
                                  {tablet?.medicineType}
                                </span>
                              </div>
                            )}

                            {med?.variant && med.variant.length > 0 && (
                              <div className="mb-2" style={{ maxWidth: "200px" }}>
                                <label
                                  className="font-semibold text-gray-500 mb-1"
                                  style={{ fontSize: "11px", display: "block" }}
                                >
                                  Select Variant
                                </label>
                                <select
                                  className="w-full text-xs border border-gray-200 rounded px-2 py-1 outline-none focus:border-[#321961]"
                                  style={{
                                    width: "100%",
                                    fontSize: "12px",
                                    paddingTop: "2px",
                                    paddingBottom: "2px",
                                    height: "auto"
                                  }}
                                  value={selectedVariants[med?._id] || ""}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    const variantId = e.target.value;
                                    if (variantId) {
                                      handleSelectVariant(variantId, med);
                                    }
                                  }}
                                >
                                  {med.variant.map((variant) => (
                                    <option
                                      key={variant._id}
                                      value={variant._id}
                                    >
                                      {variant.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            {(selectedVariant?.price || tablet?.price) && (
                              <div
                                className="mb-2"
                                style={{ fontSize: "16px" }}
                              >
                                <span className="text-gray-500 mr-1">MRP</span>
                                <span className="font-bold text-[#321961]">
                                  ₹
                                  {(
                                    selectedVariant?.price || tablet?.price
                                  ).toFixed(2)}
                                </span>
                                <small className="text-gray-500 ml-1 text-sm">
                                  {selectedVariant?.pricePerUnit} (Inclusive of
                                  all Taxes)
                                </small>
                              </div>
                            )}

                            {med?.prescriptionRequired && (
                              <div className="w-[83.333%] mb-2">
                                <span
                                  style={{
                                    color: "red",
                                    fontSize: "13px",
                                    fontWeight: "500",
                                  }}
                                >
                                  R<sub>x</sub> Prescription Required
                                </span>
                              </div>
                            )}
                            <div
                              style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                                gap: "8px 12px",
                                fontSize: "12px",
                                width: "100%",
                                marginTop: "12px",
                                textTransform: "capitalize"
                              }}
                            >
                              {(() => {
                                const fixedType = (
                                  tablet?.category?.fixedType ||
                                  tablet?.category?.fixedtype ||
                                  tablet?.subcategorys?.category?.fixedType ||
                                  tablet?.subcategorys?.category?.fixedtype ||
                                  tablet?.subcategory?.category?.fixedType ||
                                  tablet?.subcategory?.category?.fixedtype ||
                                  tablet?.fixedType ||
                                  tablet?.fixedtype ||
                                  ""
                                ).toLowerCase();

                                const renderField = (iconClass, label, value, isLink = false, onLinkClick = null) => {
                                  if (!value) return null;

                                  const isSurgeryKey = ["complexity", "duration", "procedure type", "recovery time"].includes(label.toLowerCase());

                                  if (isSurgeryKey) {
                                    const isComplexity = label.toLowerCase() === "complexity";
                                    const complexityIcon = value === "simple" ? "fa-check text-green-600" : value === "medium" ? "fa-exclamation-triangle text-yellow-500" : "fa-exclamation-circle text-red-600";
                                    const finalIconClass = isComplexity ? `fa ${complexityIcon}` : iconClass;

                                    return (
                                      <div className="flex items-start gap-1" style={{ fontSize: "12px" }}>
                                        <i className={`${finalIconClass} fa-xs mt-1`} style={{ width: "14px", flexShrink: 0, color: isComplexity ? undefined : "#321961" }}></i>
                                        <span style={{ wordBreak: "break-word" }}>
                                          <span className="text-gray-500 font-normal mr-1" style={{ fontSize: "12px" }}>{label}:</span>
                                          <span className="font-semibold" style={{ fontSize: "12px", color: '#495057', textTransform: isComplexity ? "capitalize" : "none" }}>{formatDynamicFieldValue(value)}</span>
                                        </span>
                                      </div>
                                    );
                                  }

                                  return (
                                    <div
                                      className="flex items-center gap-2 p-2 rounded"
                                      style={{
                                        background: "#f7f4fc",
                                        border: "1px solid #eadef7",
                                        transition: "all 0.2s ease"
                                      }}
                                    >
                                      <i className={`${iconClass} fa-sm`} style={{ color: "#321961", flexShrink: 0, width: "14px", textAlign: "center" }}></i>
                                      <span style={{ fontSize: "12px", wordBreak: "break-word", lineHeight: "1.3" }}>
                                        <span className="text-gray-500 font-normal mr-1" style={{ fontSize: "12px" }}>{label}:</span>
                                        {isLink ? (
                                          <span
                                            className="font-semibold text-primary"
                                            style={{ cursor: "pointer", textDecoration: "underline", fontSize: "12px" }}
                                            onClick={onLinkClick}
                                          >
                                            {formatDynamicFieldValue(value)}
                                          </span>
                                        ) : (
                                          <span className="font-semibold text-gray-900" style={{ fontSize: "12px", textTransform: label === "Complexity" || label === "Body Part" || label === "Contrast" || label === "Model" || label === "Machine Type" || label === "Reports" ? "capitalize" : "none" }}>{formatDynamicFieldValue(value)}</span>
                                        )}
                                      </span>
                                    </div>
                                  );
                                };

                                const renderSurgeries = () => (
                                  <>
                                    {(tablet?.category?.name || tablet?.subcategorys?.category?.name || tablet?.subcategory?.category?.name) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Category:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.category?.name || tablet?.subcategorys?.category?.name || tablet?.subcategory?.category?.name}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.complexity && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className={`fa ${tablet.complexity === "simple" ? "fa-check text-green-600" : tablet.complexity === "medium" ? "fa-exclamation-triangle text-yellow-500" : "fa-exclamation-circle text-red-600"} fa-xs`} style={{ width: "14px", flexShrink: 0 }}></i>
                                          <span>Complexity:</span>
                                        </div>
                                        <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.complexity}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.duration && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-clock fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Duration:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.duration}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.procedureType && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-stethoscope fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Procedure Type:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.procedureType}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.recoveryTime && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-clock fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Recovery Time:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.recoveryTime}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.dynamicFields?.map((field) => (
                                      <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>{field.label}:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {formatDynamicFieldValue(field.value)}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );

                                const renderMedicines = () => (
                                  <>
                                    {(tablet?.subcategorys?.name || tablet?.subcategorys?.category?.name || tablet?.subcategory?.category?.name) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Category:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.subcategorys?.name || tablet?.subcategorys?.category?.name || tablet?.subcategory?.category?.name}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.manufacture?.name && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-industry fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Manufacturer:</span>
                                        </div>
                                        <span
                                          className="font-semibold text-primary"
                                          style={{ cursor: "pointer", textDecoration: "underline", wordBreak: "break-word" }}
                                          onClick={() => navigate(`/manufacture/${createSlug(tablet.manufacture.name)}-${tablet.manufacture._id}`)}
                                        >
                                          {tablet.manufacture.name}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.form && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-tablets fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Form:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.form}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.packagingDetails && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-box fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Pack Size:</span>
                                        </div>
                                        <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.packagingDetails}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.strength && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-prescription-bottle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Storage:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.strength}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.dynamicFields?.map((field) => (
                                      <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>{field.label}:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {formatDynamicFieldValue(field.value)}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );

                                const renderLabs = () => (
                                  <>
                                    {(tablet?.subcategorys?.name) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Category:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.subcategorys?.name}
                                        </span>
                                      </div>
                                    )}
                                    {(tablet?.smapletype || tablet?.sampleType || tablet?.sampletype) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-flask fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Sample Type:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.smapletype || tablet?.sampleType || tablet?.sampletype}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.gender && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-venus-mars fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Gender:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.gender}
                                        </span>
                                      </div>
                                    )}
                                    {(tablet?.reportsDuration || tablet?.reportDuration || tablet?.reportduration) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-file-alt fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Report Duration:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.reportsDuration || tablet?.reportDuration || tablet?.reportduration}
                                        </span>
                                      </div>
                                    )}

                                    {(tablet?.isFasting || tablet?.isFasting || tablet?.isFasting) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-file-alt fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Fasting:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.isFasting || tablet?.isFasting || tablet?.isFasting}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.parameterss?.length > 0 && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-cogs fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Parameters:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.parameterss.length === 1 ? "1 Parameter" : `${tablet.parameterss.length} Parameters`}
                                        </span>
                                      </div>
                                    )}
                                    {(tablet?.keywords || tablet?.keyword) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-tags fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Keywords:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {Array.isArray(tablet?.keywords) ? tablet.keywords.join(", ") : tablet?.keywords || tablet?.keyword}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.dynamicFields?.map((field) => (
                                      <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>{field.label}:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {formatDynamicFieldValue(field.value)}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );

                                const renderDiagnostics = () => (
                                  <>
                                    {(tablet?.subcategorys?.name || tablet?.subcategorys?.category?.name || tablet?.subcategory?.category?.name) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Category:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.subcategorys?.name}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.bodypart && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-person fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Body Part:</span>
                                        </div>
                                        <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.bodypart}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.iscontrast && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-adjust fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Contrast:</span>
                                        </div>
                                        <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.iscontrast}
                                        </span>
                                      </div>
                                    )}
                                    {(tablet?.reportsDuration || tablet?.reportDuration || tablet?.reportduration) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-file-alt fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Report Duration:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet?.reportsDuration || tablet?.reportDuration || tablet?.reportduration}
                                        </span>
                                      </div>
                                    )}
                                    {(tablet?.keywords || tablet?.keyword) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-tags fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Keywords:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {Array.isArray(tablet?.keywords) ? tablet.keywords.join(", ") : tablet?.keywords || tablet?.keyword}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.dynamicFields?.map((field) => (
                                      <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>{field.label}:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {formatDynamicFieldValue(field.value)}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );

                                const renderNurse = () => (
                                  <>
                                    {tablet?.subcategorys?.name && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Category:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.subcategorys.name}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.nursecareType && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-house-user fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Care Type:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.nursecareType.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.duration && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-clock fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Duration:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.duration}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.shiftType && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-clock fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Shift Type:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {tablet.shiftType.replace(/_/g, " ")}
                                        </span>
                                      </div>
                                    )}
                                    {(tablet?.keywords || tablet?.keyword) && (
                                      <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fa fa-tags fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>Keywords:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {Array.isArray(tablet?.keywords) ? tablet.keywords.join(", ") : tablet?.keywords || tablet?.keyword}
                                        </span>
                                      </div>
                                    )}
                                    {tablet?.dynamicFields?.map((field) => (
                                      <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                        <div className="flex items-center gap-1 text-gray-500 font-normal">
                                          <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                          <span>{field.label}:</span>
                                        </div>
                                        <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                          {formatDynamicFieldValue(field.value)}
                                        </span>
                                      </div>
                                    ))}
                                  </>
                                );

                                const renderEquipment = () => {
                                  const brandName = tablet?.manufacture?.name || (typeof tablet?.manufacture === "string" ? tablet?.manufacture : null) || tablet?.manufacture?.name;
                                  return (
                                    <>
                                      {brandName && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-copyright fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Brand:</span>
                                          </div>
                                          <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {brandName}
                                          </span>
                                        </div>
                                      )}
                                      {(tablet?.subcategorys?.name) && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Category:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet?.subcategorys?.name}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.model && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-microchip fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Model:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.model}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.condition && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-circle-check fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Condition:</span>
                                          </div>
                                          <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.condition}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.machineType && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-toolbox fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Machine Type:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.machineType}
                                          </span>
                                        </div>
                                      )}
                                      {(tablet?.keywords || tablet?.keyword) && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-tags fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Keywords:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {Array.isArray(tablet?.keywords) ? tablet.keywords.join(", ") : tablet?.keywords || tablet?.keyword}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.dynamicFields?.map((field) => (
                                        <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>{field.label}:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {formatDynamicFieldValue(field.value)}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  );
                                };

                                const renderHomecare = () => {
                                  return (
                                    <>
                                      {tablet?.subcategorys?.name && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Category:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.subcategorys.name}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.duration && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-clock fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Duration:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.duration}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.homecareMode && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-house-user fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Homecare Mode:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.homecareMode}
                                          </span>
                                        </div>
                                      )}
                                      {(tablet?.keywords || tablet?.keyword) && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-tags fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Keywords:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {Array.isArray(tablet?.keywords) ? tablet.keywords.join(", ") : tablet?.keywords || tablet?.keyword}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.dynamicFields?.map((field) => (
                                        <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>{field.label}:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {formatDynamicFieldValue(field.value)}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  );
                                };

                                const renderMedicalTreatment = () => {
                                  return (
                                    <>
                                      {tablet?.subcategorys?.name && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Category:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.subcategorys.name}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.duration && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-clock fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Duration:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.duration}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.gender && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-venus-mars fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Gender:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.gender}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.complexity && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className={`fa ${tablet.complexity === "simple" ? "fa-check text-green-600" : tablet.complexity === "medium" ? "fa-exclamation-triangle text-yellow-500" : "fa-exclamation-circle text-red-600"} fa-xs`} style={{ width: "14px", flexShrink: 0 }}></i>
                                            <span>Complexity:</span>
                                          </div>
                                          <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.complexity}
                                          </span>
                                        </div>
                                      )}
                                      {(tablet?.keywords || tablet?.keyword) && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-tags fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Keywords:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {Array.isArray(tablet?.keywords) ? tablet.keywords.join(", ") : tablet?.keywords || tablet?.keyword}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.dynamicFields?.map((field) => (
                                        <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>{field.label}:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {formatDynamicFieldValue(field.value)}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  );
                                };

                                const renderDental = () => {
                                  return (
                                    <>
                                      {(tablet?.subcategorys?.name || tablet?.subcategorys?.category?.name || tablet?.subcategory?.category?.name) && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-folder fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Category:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet?.subcategorys?.name || tablet?.subcategorys?.category?.name || tablet?.subcategory?.category?.name}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.treatmenttype && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-tooth fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Treatment Type:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.treatmenttype}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.complexity && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className={`fa ${tablet.complexity === "simple" ? "fa-check text-green-600" : tablet.complexity === "medium" ? "fa-exclamation-triangle text-yellow-500" : "fa-exclamation-circle text-red-600"} fa-xs`} style={{ width: "14px", flexShrink: 0 }}></i>
                                            <span>Complexity:</span>
                                          </div>
                                          <span className="font-semibold capitalize" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {tablet.complexity}
                                          </span>
                                        </div>
                                      )}
                                      {(tablet?.keywords || tablet?.keyword) && (
                                        <div style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fa fa-tags fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>Keywords:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {Array.isArray(tablet?.keywords) ? tablet.keywords.join(", ") : tablet?.keywords || tablet?.keyword}
                                          </span>
                                        </div>
                                      )}
                                      {tablet?.dynamicFields?.map((field) => (
                                        <div key={field.label} style={{ display: "grid", gridTemplateColumns: "125px 1fr", gap: "8px", fontSize: "12px", alignItems: "start" }}>
                                          <div className="flex items-center gap-1 text-gray-500 font-normal">
                                            <i className="fas fa-info-circle fa-xs" style={{ width: "14px", flexShrink: 0, color: "#321961" }}></i>
                                            <span>{field.label}:</span>
                                          </div>
                                          <span className="font-semibold" style={{ color: '#495057', wordBreak: "break-word" }}>
                                            {formatDynamicFieldValue(field.value)}
                                          </span>
                                        </div>
                                      ))}
                                    </>
                                  );
                                }

                                // 1. SURGERIES
                                if (fixedType === "surgeries") return renderSurgeries();
                                if (fixedType === "surgery") return renderSurgeries();
                                if (fixedType === "surgical") return renderSurgeries();

                                // 2. MEDICINES / PHARMACY
                                if (fixedType === "medicine") return renderMedicines();
                                if (fixedType === "medicines") return renderMedicines();
                                if (fixedType === "pharmacy") return renderMedicines();

                                // 3. LABS / DIAGNOSTICS
                                if (fixedType === "labtests") return renderLabs();
                                if (fixedType === "labtest") return renderLabs();
                                if (fixedType === "labs") return renderLabs();
                                if (fixedType === "test") return renderLabs();
                                if (fixedType === "tests") return renderLabs();
                                if (fixedType === "diagnostics") return renderDiagnostics();
                                if (fixedType === "diagnosis") return renderDiagnostics();
                                if (fixedType === "scans") return renderDiagnostics();
                                if (fixedType === "radiology") return renderDiagnostics();
                                if (fixedType === "homecare") return renderHomecare();


                                // 5. NURSE CARE / HOMECARE
                                if (fixedType === "nurse") return renderNurse();
                                if (fixedType === "homecare") return renderNurse();

                                // 5.5 MEDICAL EQUIPMENT
                                if (fixedType === "medical equipment") return renderEquipment();
                                if (fixedType === "medical equipments") return renderEquipment();
                                if (fixedType === "equipment") return renderEquipment();
                                if (fixedType === "equipments") return renderEquipment();
                                if (fixedType === "medicalequipment") return renderEquipment();
                                if (fixedType === "medicalequipments") return renderEquipment();


                                // 5.6 MEDICAL EQUIPMENT
                                if (fixedType === "medicaltreatment") return renderMedicalTreatment();
                                // if (fixedType === "medicaltreatment") return renderPharmacy();
                                // if (fixedType === "medicaltreatment") return renderPharmacy();
                                // if (fixedType === "medicaltreatment") return renderPharmacy();

                                //5.7 NURSING CARE
                                if (fixedType === "nursingcare") return renderNurse();


                                // 4. DENTAL
                                if (fixedType === "dental") return renderDental();
                                if (fixedType === "dentalservice") return renderDental()
                                // 6. FALLBACK FOR OTHER CATEGORIES
                                return (
                                  <>
                                    {renderField(
                                      "fas fa-industry",
                                      "Manufacturer",
                                      tablet?.manufacture?.name,
                                      true,
                                      () => navigate(`/manufacture/${createSlug(tablet.manufacture.name)}-${tablet.manufacture._id}`)
                                    )}
                                    {renderField("fas fa-tablets", "Form", tablet?.form)}
                                    {renderField("fas fa-box", "Pack Size", tablet?.packagingDetails)}
                                    {renderField("fa fa-cogs", "Parameters", tablet.parameterss?.length > 0 ? tablet.parameterss.length : null)}
                                    {renderField("fa fa-venus-mars", "Gender", tablet.gender)}
                                    {renderField("fa fa-flask", "Sample Type", tablet?.smapletype)}
                                    {renderField(
                                      "fa fa-moon",
                                      "Fasting",
                                      tablet?.isFasting ? (tablet.isFasting?.charAt(0)?.toUpperCase() + tablet.isFasting?.slice(1)) : null
                                    )}
                                    {renderField("fa fa-clock", "Duration", tablet?.duration)}
                                    {renderField("fas fa-person", "Body Part", tablet?.bodypart)}
                                    {renderField("fas fa-adjust", "Contrast", tablet?.iscontrast)}
                                    {renderField("fas fa-microchip", "Model", tablet?.model)}
                                    {renderField("fas fa-toolbox", "Machine Type", tablet?.machineType)}
                                    {renderField("fas fa-file-alt", "Reports", tablet.reportsDuration || tablet.reportDuration)}
                                    {renderField(
                                      tablet.complexity === "simple" ? "fa fa-check text-green-600" : tablet.complexity === "medium" ? "fa-exclamation-triangle text-yellow-500" : "fa-exclamation-circle text-red-600",
                                      "Complexity",
                                      tablet.complexity
                                    )}
                                    {renderField("fa fa-tooth", "Treatment Type", tablet?.treatmenttype)}
                                    {renderField("fa fa-stethoscope", "Procedure Type", tablet?.procedureType)}
                                    {renderField("fa fa-clock", "Recovery Time", tablet?.recoveryTime)}
                                    {renderField("fas fa-circle-check", "Condition", tablet?.condition)}
                                    {renderField("fas fa-clock", "Shift", tablet?.shiftType?.replace(/_/g, " "))}
                                    {renderField("fas fa-house-user", "Type", tablet?.nursecareType?.replace(/_/g, " "))}
                                    {renderField("fas fa-house-user", "Mode", tablet?.homecareMode)}
                                    {renderField("fas fa-prescription-bottle", "Storage", tablet?.strength)}
                                    {tablet?.dynamicFields?.map((field) =>
                                      renderField("fas fa-info-circle", field.label, field.value)
                                    )}
                                  </>
                                );
                              })()}




                            </div>

                            {tablet?.compositions?.name && (
                              <div
                                className="w-[83.333%] mb-2"
                                style={{ fontSize: "12px" }}
                              >
                                <strong>Composition:</strong>
                                <br />
                                <span
                                  style={{
                                    cursor: "pointer",
                                    color: "#007bff",
                                    textDecoration: "underline",
                                  }}
                                  onClick={() =>
                                    navigate(
                                      // `/composition/${createSlug(tablet.compositions.name)}-${tablet.compositions._id}`,
                                      `/composition/${tablet.compositions._id}`
                                    )
                                  }
                                >
                                  {tablet.compositions.name}
                                </span>
                              </div>
                            )}




                            {(product?.tablet?.category?.fixedType === "medicine" ||
                              product?.tablet?.category?.fixedType === "medicines") && (
                                <div className="flex justify-center mt-4">
                                  <a
                                    href="#related-products-section"
                                    className="w-[200px] flex items-center rounded-md justify-center gap-1 bg-gradient-to-br from-[#a878f1] via-[#321961] to-[#7541a8] text-white text-[14px] font-medium py-[5px] px-3 rounded-lg hover:opacity-90 transition-opacity duration-200"
                                  >
                                    <span className="mx-1 text-[14px]">Smarter Substitutes</span>
                                    <i className="fa-solid fa-arrow-right text-[12px]"></i>
                                  </a>
                                </div>
                              )}
                          </div>

                          <div>
                            {tablet?.complexity && (
                              <div
                                className="w-full"
                                style={{ fontSize: "12px" }}
                              >
                                This procedure’s complexity depends on several
                                factors, including the technique involved, the
                                patient’s condition, and the required level of
                                care. Proper preparation and adherence to
                                guidelines are essential to ensure safety and
                                optimal outcomes.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="w-full">
                        <div className="!border !border-gray-200 !rounded-sm p-4 bg-white shadow-sm">
                          {/* pincode */}
                          <div className="flex flex-wrap gap-2 items-center mb-3">
                            <div className="flex-1">
                              {isLoaded ? (
                                <div className="relative">
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
                                      inputMode="numeric"
                                      placeholder="Enter pincode"
                                      value={searchQuery}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const numericValue = value.replace(/\D/g, "");
                                        setSearchQuery(numericValue);
                                        if (
                                          checkedPincode &&
                                          numericValue !== checkedPincode
                                        ) {
                                          setCheckedPincode(null);
                                        }
                                      }}
                                      onFocus={handlePincodeInputFocus}
                                      onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          handlePincodeCheck(e);
                                        }
                                      }}
                                      className={`form-control h-[38px] w-full border border-[#c9c9c9ad] rounded-[6px] text-[14px] pl-3 focus:outline-none focus:ring-1 focus:ring-[#321961] focus:border-[#321961] ${searchQuery.trim() !== "" ? "pr-8" : "pr-3"
                                        }`}
                                    />
                                  </Autocomplete>
                                  {searchQuery.trim() !== "" && (
                                    <button
                                      type="button"
                                      onClick={handlePincodeClear}
                                      disabled={loadingVendors}
                                      className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-transparent border-none p-0 cursor-pointer text-[#aaa] z-[5]"
                                    >
                                      <i className="fas fa-times" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <input
                                  type="text"
                                  placeholder="Loading maps..."
                                  className="form-control h-[38px] w-full border border-[#c9c9c9ad] rounded-[6px] text-[14px] px-3 bg-gray-50 cursor-not-allowed"
                                  disabled
                                />
                              )}
                            </div>
                            {/* <div className="col-auto">
                              <button
                                className="btn btn-primary px-4"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handlePincodeCheck(e);
                                }}
                                style={{
                                  padding: "8px 16px",
                                  borderRadius: "6px",
                                  backgroundColor: "#321961",
                                  borderColor: "#321961"
                                }}
                                disabled={loadingVendors}
                              >
                                Check
                              </button>
                            </div> */}
                          </div>

                          {/* vendors */}
                          <div className="relative" style={{ maxHeight: "260px", overflowY: "auto", overflowX: "hidden" }}>
                            {loadingVendors && (
                              <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10 rounded-lg">
                                <div
                                  className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent border-[#321961]"
                                  role="status"
                                >
                                  <span className="sr-only">
                                    Loading...
                                  </span>
                                </div>
                              </div>
                            )}
                            {!headerPincode && !checkedPincode ? (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                <i
                                  className="fas fa-map-marker-alt mb-2 text-3xl text-gray-300"
                                ></i>
                                <p className="mb-0 text-gray-500">
                                  Please enter a pincode and click "Check" to
                                  see available vendors
                                </p>
                              </div>
                            ) : filteredVariantVendors.length > 0 ? (
                              filteredVariantVendors.map((v, i) =>
                                renderVendorCard(v, i, true),
                              )
                            ) : filteredFallbackVendors.length > 0 ? (
                              filteredFallbackVendors.map((v, i) =>
                                renderVendorCard(v, i, false),
                              )
                            ) : filteredVendors.length > 0 ? (
                              filteredVendors.map((v, i) =>
                                renderVendorCard(v, i, false),
                              )
                            ) : (
                              <div className="text-center py-4 text-gray-500 text-sm">
                                <i
                                  className="fas fa-store-slash mb-2 text-3xl text-gray-300"
                                ></i>
                                <p className="mb-0 text-gray-500">
                                  No vendors available for this pincode
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {tablet?.points && tablet.points.length > 0 && (
                  <div className="bg-white !rounded-sm shadow-sm mb-4 mt-4 p-3" style={{ background: "#fcfaff", border: "1px solid #f2ebfa" }}>
                    <h5 className="font-bold mb-3 flex items-center gap-2" style={{ fontSize: "15px", color: "#321961" }}>
                      <i className="fas fa-handshake-alt"></i>Interactions
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      {tablet.points?.slice().map((item, index) => {
                        const key = Object.keys(item)[0];
                        const label = key
                          ? key
                            .replace(/Interaction$/, "")
                            .replace(/([A-Z])/g, " $1")
                            .trim()
                            .charAt(0)
                            .toUpperCase() +
                          key
                            .replace(/Interaction$/, "")
                            .replace(/([A-Z])/g, " $1")
                            .trim()
                            .slice(1)
                          : "Points";
                        const value = item[key];
                        return (
                          <div key={index} className="w-full">
                            <div
                              className="p-4 !rounded-sm bg-white !border !border-gray-100  !shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)] !transition-all !duration-300 h-full flex flex-col justify-between"
                            >
                              <div>
                                <div className="font-bold text-gray-900 mb-1 capitalize" style={{ fontSize: "12px" }}>
                                  {label?.replace(/_/g, " ")}
                                </div>
                                <div
                                  className="text-gray-500 capitalize"
                                  style={{
                                    fontSize: "12px",
                                    lineHeight: "1.5",
                                    fontWeight: "400",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden"
                                  }}
                                >
                                  {value?.toLowerCase().replace(/_/g, " ")}
                                </div>
                              </div>
                              {value && value.length > 90 && (
                                <span
                                  className="font-semibold text-[#321961] mt-2 d-inline-block"
                                  style={{ cursor: "pointer", fontSize: "11px", textDecoration: "underline", alignSelf: "flex-start" }}
                                  onClick={() => setSelectedInteraction({
                                    label: label?.replace(/_/g, " "),
                                    value: value?.toLowerCase().replace(/_/g, " ")
                                  })}
                                >
                                  View More
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <ProductDescriptionTabs
                  isTabContentOpen={isTabContentOpen}
                  setIsTabContentOpen={setIsTabContentOpen}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                  showMoreProductInfo={showMoreProductInfo}
                  setShowMoreProductInfo={setShowMoreProductInfo}
                  showMoreDirections={showMoreDirections}
                  setShowMoreDirections={setShowMoreDirections}
                  showMoreSideEffects={showMoreSideEffects}
                  setShowMoreSideEffects={setShowMoreSideEffects}
                  showMorePrecautions={showMorePrecautions}
                  setShowMorePrecautions={setShowMorePrecautions}
                  tablet={tablet}
                  product={product}
                  getFirstNWords={getFirstNWords}
                  hasMoreThanNWords={hasMoreThanNWords}
                  scrollToElement={scrollToElement}
                  isParamsOpen={isParamsOpen}
                  setIsParamsOpen={setIsParamsOpen}
                />
              </div>
            </div>
          </div>

          {/* banners */}
          <div
            className="min-w-0"
            style={{ marginTop: isMobile ? "0px" : "36px", display: isMobile ? "none" : "block" }}
          >
            <div className="lg:block ">
              {/* Promo video — same responsive box as right-side banners (zoom-safe) */}
              <div className="text-center" style={{ marginBottom: "16px", }}>
                <div
                  className="rounded w-full"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    lineHeight: 0,
                  }}
                >
                  <video
                    src="/description-video.mp4"
                    controls
                    loop
                    autoPlay
                    muted
                    playsInline
                    className="rounded w-full"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxWidth: "100%",
                      objectFit: "contain",
                      display: "block",
                      verticalAlign: "middle",
                    }}
                  />
                </div>
              </div>
              {/* Right Side Top Banners */}
              <div className="text-center" style={{ marginBottom: "16px", }}>
                <Slider
                  {...{
                    ...bannerSliderSettings,
                    infinite: rightSideTop.length > 1,
                    autoplay: rightSideTop.length > 1,
                  }}
                >
                  {rightSideTop.length > 0 ? (
                    rightSideTop.map((banner, index) => (
                      <div key={index}>
                        <img
                          src={banner.src || "/assets/img/surgeriesShort.png"}
                          alt={banner.alt}
                          loading="lazy"
                          className="max-w-full h-auto rounded"
                          style={{
                            width: "100%",
                            height: "165px",
                            // objectFit: "cover",
                            marginBottom:
                              index < rightSideTop.length - 1 ? "16px" : "0",
                            bannerSliderSettings,
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <img
                        src="/assets/img/surgeriesShort.png"
                        alt="Default Banner"
                        className="max-w-full h-auto rounded"
                        style={{
                          width: "100%",
                          height: "165px",
                          // objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </Slider>
              </div>

              {/* Right Side Bottom Banners */}
              <div className="text-center">
                <Slider
                  {...{
                    ...bannerSliderSettings,
                    infinite: rightSideBottom.length > 1,
                    autoplay: rightSideBottom.length > 1,
                  }}
                >
                  {rightSideBottom.length > 0 ? (
                    rightSideBottom.map((banner, index) => (
                      <div key={index}>
                        <img
                          src={banner.src || "/assets/img/longSugery.png"}
                          alt={banner.alt}
                          loading="lazy"
                          className="max-w-full h-auto rounded"
                          style={{
                            width: "100%",
                            height: "482px",
                            // objectFit: "cover",
                            marginBottom:
                              index < rightSideBottom.length - 1 ? "16px" : "0",
                            bannerSliderSettings,
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <img
                        src="/assets/img/longSugery.png"
                        alt="Default Banner"
                        className="max-w-full h-auto rounded"
                        style={{
                          width: "100%",
                          height: "482px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </Slider>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 space-y-8">

          {service == "medicines" && (
            <>
              <div id="related-products-section">
                <Branded
                  relatedproducts={brandProducts}
                  service={service}
                  isMobile={isMobile}
                  isLoggedIn={isLoggedIn}
                  userProfile={userProfile}
                  onShareClick={(product) => {
                    setShareProductDataForModal(product);
                    setShowShareModal(true);
                  }}
                  onFavoriteToggle={(productId, isFavorite, index) => {
                    handleToggleFavourite(productId, isFavorite, true, index);
                  }}
                />
              </div>
              <div id="related-products-section">
                <GenericProducts
                  relatedproducts={genericProducts}
                  service={service}
                  isMobile={isMobile}
                  isLoggedIn={isLoggedIn}
                  userProfile={userProfile}
                  onShareClick={(product) => {
                    setShareProductDataForModal(product);
                    setShowShareModal(true);
                  }}
                  onFavoriteToggle={(productId, isFavorite, index) => {
                    handleToggleFavourite(productId, isFavorite, true, index);
                  }}
                />
              </div>
            </>
          )}
          <div id="related-products-section">
            <AlternateProducts
              relatedproducts={alternativeproduct}
              service={service}
              isMobile={isMobile}
              isLoggedIn={isLoggedIn}
              userProfile={userProfile}
              composition={compoissitionForViewAll}
              onShareClick={(product) => {
                setShareProductDataForModal(product);
                setShowShareModal(true);
              }}
              onFavoriteToggle={(productId, isFavorite, index) => {
                handleToggleFavourite(productId, isFavorite, true, index);
              }}
            />
            <RelatedProducts
              relatedproducts={relatedproducts}
              service={service === "dental" ? 'dentalservice' : service === "rx-medicines" ? 'medicine' : service}
              slug={tablet?.subcategorys?.slug || tablet?.subcategorys?.category?.slug || tablet?.subcategory?.category?.slug}
              isMobile={isMobile}
              isLoggedIn={isLoggedIn}
              userProfile={userProfile}
              onShareClick={(product) => {
                setShareProductDataForModal(product);
                setShowShareModal(true);
              }}
              onFavoriteToggle={(productId, isFavorite, index) => {
                handleToggleFavourite(productId, isFavorite, true, index);
              }}
            />
          </div>


          <div
            className="w-full lg:w-1/4 min-w-0 shrink-0"
            style={{ marginTop: isMobile ? "0px" : "145px", display: isMobile ? "block" : "none" }}
          >
            <div className="lg:block ">
              {/* Promo video — same responsive box as right-side banners (zoom-safe) */}
              <div className="text-center" style={{ marginBottom: "16px", }}>
                <div
                  className="rounded w-full"
                  style={{
                    width: "100%",
                    maxWidth: "100%",
                    backgroundColor: "#f8fafc",
                    border: "1px solid #f1f5f9",
                    lineHeight: 0,
                  }}
                >
                  <video
                    src="/description-video.mp4"
                    controls
                    loop
                    autoPlay
                    muted
                    playsInline
                    className="rounded w-full"
                    style={{
                      width: "100%",
                      height: "auto",
                      maxWidth: "100%",
                      objectFit: "contain",
                      display: "block",
                      verticalAlign: "middle",
                    }}
                  />
                </div>
              </div>
              {/* Right Side Top Banners */}
              <div className="text-center" style={{ marginBottom: "16px", }}>
                <Slider
                  {...{
                    ...bannerSliderSettings,
                    infinite: rightSideTop.length > 1,
                    autoplay: rightSideTop.length > 1,
                  }}
                >
                  {rightSideTop.length > 0 ? (
                    rightSideTop.map((banner, index) => (
                      <div key={index}>
                        <img
                          src={banner.src || "/assets/img/surgeriesShort.png"}
                          alt={banner.alt}
                          loading="lazy"
                          className="max-w-full h-auto rounded"
                          style={{
                            width: "100%",
                            height: "165px",
                            // objectFit: "cover",
                            marginBottom:
                              index < rightSideTop.length - 1 ? "16px" : "0",
                            bannerSliderSettings,
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <img
                        src="/assets/img/surgeriesShort.png"
                        alt="Default Banner"
                        className="max-w-full h-auto rounded"
                        style={{
                          width: "100%",
                          height: "165px",
                          // objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </Slider>
              </div>

              {/* Right Side Bottom Banners */}
              <div className="text-center">
                <Slider
                  {...{
                    ...bannerSliderSettings,
                    infinite: rightSideBottom.length > 1,
                    autoplay: rightSideBottom.length > 1,
                  }}
                >
                  {rightSideBottom.length > 0 ? (
                    rightSideBottom.map((banner, index) => (
                      <div key={index}>
                        <img
                          src={banner.src || "/assets/img/longSugery.png"}
                          alt={banner.alt}
                          loading="lazy"
                          className="max-w-full h-auto rounded"
                          style={{
                            width: "100%",
                            height: "482px",
                            // objectFit: "cover",
                            marginBottom:
                              index < rightSideBottom.length - 1 ? "16px" : "0",
                            bannerSliderSettings,
                          }}
                        />
                      </div>
                    ))
                  ) : (
                    <div>
                      <img
                        src="/assets/img/longSugery.png"
                        alt="Default Banner"
                        className="max-w-full h-auto rounded"
                        style={{
                          width: "100%",
                          height: "482px",
                          objectFit: "cover",
                        }}
                      />
                    </div>
                  )}
                </Slider>
              </div>
            </div>
          </div>




          <Reviews reviews={ratingview || []} />
        </div>
      </div>

      <Footer />

      {/* Share Modal */}
      <ShareModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        }}
        onShare={
          shareProductDataForModal
            ? (() => {
              const relatedProductData = {
                tablet: shareProductDataForModal.tablet,
              };
              const relatedSelectedVariants = shareProductDataForModal.tablet
                ?._id
                ? {
                  [shareProductDataForModal.tablet._id]:
                    shareProductDataForModal.tablet.variant?.[0]?._id,
                }
                : {};
              return createShareHandler(
                relatedProductData,
                relatedSelectedVariants,
              );
            })()
            : handleShare
        }
      />

      {/* Lead Modal */}
      <LeadModal
        show={showLeadModal}
        onClose={() => {
          setShowLeadModal(false);
          setLeadFormData({
            ...INITIAL_LEAD_FORM,
            med: null,
            vendor: null,
          });
          setCurrentLeadData(null);
        }}
        formData={leadFormData}
        onChange={(e) =>
          setLeadFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }))
        }
        productId={
          currentLeadData?.med?._id || currentLeadData?.med?.id || null
        }
        vendorId={
          currentLeadData?.vendor?.vendorId ||
          currentLeadData?.vendor?._id ||
          null
        }
        variantId={currentLeadData?.variantId || null}
        onSubmit={handleSubmitLead}
        fixedType={
          leadFormData.fixedType ||
          currentLeadData?.fixedType ||
          "dentalservice"
        }
      />

      {/* Rental Modal */}
      {currentModalData && (
        <RentModal
          show={showRentalModal}
          onClose={() => {
            setShowRentalModal(false);
            setRentalFormData({
              startDate: "",
              startTime: "",
              endDate: "",
              endTime: "",
              deliveryAddress: "",
            });
            setCurrentModalData(null);
          }}
          rentProduct={{
            tabletdetails: currentModalData.med,
            vendordetails:
              currentModalData.vendor?.bussinessdetails ||
              currentModalData.vendor,
            price: currentModalData.price,
          }}
          formData={rentalFormData}
          onFormChange={handleRentalFormChange}
          onSubmit={handleRentalSubmit}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          fixedType={currentModalData.fixedType}
        />
      )}

      {/* Consultation Modal */}
      {currentModalData && (
        <ConsultationModal
          fixedType={currentModalData.fixedType}
          show={showConsultationModal}
          onClose={() => {
            setShowConsultationModal(false);
            setConsultationFormData({
              date: "",
              name: "",
              phone: "",
              category: "",
              address: "",
            });
            setCurrentModalData(null);
          }}
          formData={consultationFormData}
          onFormChange={handleConsultationFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          formType="consultation"
          title="Book a Consultation"
        />
      )}

      {/* Appointment Modal */}
      {currentModalData && (
        <AppointmentModal
          fixedType={appointmentFormData.fixedType}
          show={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setAppointmentFormData({
              date: "",
              name: "",
              phone: "",
              category: "",
              address: "",
            });
            setCurrentModalData(null);
          }}
          formData={appointmentFormData}
          onFormChange={handleAppointmentFormChange}
          onSubmit={handleAppointmentSubmit}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          formType="appointment"
          title="Book an Appointment"
        />
      )}

      {/* Mobile Image  */}
      {showImageModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "#fff",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "20px",
              left: "20px",
              cursor: "pointer",
              zIndex: 10002,
              padding: "10px",
            }}
            onClick={() => setShowImageModal(false)}
          >
            <i
              className="fas fa-times"
              style={{ fontSize: "24px", color: "#321961" }}
            ></i>
          </div>

          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
              position: "relative",
            }}
          >
            {(() => {
              const variantImages = selectedVariant?.files || [];
              const tabletImages =
                tablet?.files?.length > 0
                  ? tablet.files
                  : tablet?.imageUrl || [];
              const allImages = [...variantImages, ...tabletImages];
              const currentImage =
                allImages[currentModalIndex] ||
                allImages[0] ||
                "/assets/default.png";
              const finalSrc = getImageUrl(currentImage);

              return (
                <>
                  {currentModalIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentModalIndex((prev) => prev - 1);
                      }}
                      style={{
                        position: "absolute",
                        left: "10px",
                        zIndex: 10001,
                        background: "rgba(0,0,0,0.5)",
                        border: "none",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                  )}

                  <img
                    src={finalSrc}
                    alt="Preview"
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                    }}
                  />

                  {currentModalIndex < allImages.length - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentModalIndex((prev) => prev + 1);
                      }}
                      style={{
                        position: "absolute",
                        right: "10px",
                        zIndex: 10001,
                        background: "rgba(0,0,0,0.5)",
                        border: "none",
                        borderRadius: "50%",
                        width: "40px",
                        height: "40px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "white",
                      }}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {selectedInteraction && (
        <div className="modal fade show block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
              <div className="modal-header border-0 pb-0" style={{ padding: "20px 20px 10px 20px" }}>
                <h5 className="modal-title font-bold capitalize" style={{ fontSize: "16px", color: "#321961" }}>
                  {selectedInteraction.label}
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedInteraction(null)} aria-label="Close"></button>
              </div>
              <div className="modal-body" style={{ padding: "10px 20px 20px 20px" }}>
                <p className="text-gray-500 capitalize" style={{ fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                  {selectedInteraction.value}
                </p>
              </div>
              <div className="modal-footer border-0 pt-0" style={{ padding: "0 20px 20px 20px" }}>
                <button type="button" className="px-4 py-[6px] bg-[#321961] text-white rounded-[6px] text-sm border-0 cursor-pointer hover:bg-[#6d46b8] transition-colors" onClick={() => setSelectedInteraction(null)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/*  Review  */}
      <ProductReviewModal
        show={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedProductForReview(null);
        }}
        product={selectedProductForReview}
        onReviewSubmit={handleReviewSubmit}
      />
    </>
  );
};

export default ProductDescription;


