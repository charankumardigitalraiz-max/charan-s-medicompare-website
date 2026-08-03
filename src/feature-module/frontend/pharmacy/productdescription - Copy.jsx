import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useLocation, useNavigate, Link } from "react-router-dom";
import Slider from "react-slick";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import { useMediaQuery } from "react-responsive";
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
import { FaRegShareSquare, FaHeart, FaFileMedical } from "react-icons/fa";
import { IoIosHeartEmpty } from "react-icons/io";
import AppointmentModal from "./products-components/AppointmentModal.jsx";
import ProductDescriptionTabs from "./products-components/ProductDescriptionTabs.jsx";
import Reviews from "./products-components/Reviews.jsx";
import GenericProducts from "./products-components/Generic.jsx";
import { useLocation as useLocationContext } from "../../../context/LocationContext";
import AlternateProducts from "./products-components/AlternateProducts.jsx";
import VideoPopupModal from "./products-components/VideoPopupModal.jsx";
import { GOOGLE_MAPS_API_KEY } from "../../../utils/index.js"
import { FaPlay } from "react-icons/fa";
import axios from "axios";

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

  const descriptionTopSettings = {
    dots: true,
    infinite: true,
    arrows: false,
    speed: 1500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1500,
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
  const [loadingVendors, setLoadingVendors] = useState(false);
  const [checkedPincode, setCheckedPincode] = useState(null);
  const [headerPincode, setHeaderPincode] = useState(null);
  const [shareProductDataForModal, setShareProductDataForModal] =
    useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);
  const [previewImage, setPreviewImage] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

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
          setCheckedPincode(locationData.pincode);
          setHeaderPincode(locationData.pincode);
          setPincode(locationData.pincode);
          return;
        }
      } catch (e) {
        // Error parsing saved location
      }
    }
    setHeaderPincode(null);
    setPincode("");
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
          setCheckedPincode(locationData.pincode);
          setHeaderPincode(locationData.pincode);
          if (userId !== null) {
            fetchProductData(userId, locationData.pincode, true);
          } else {
            fetchProductData(null, locationData.pincode, true);
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

      if (savedLocation) {
        try {
          const locationData = JSON.parse(savedLocation);
          if (locationData.pincode && locationData.pincode.length > 0) {
            pincodeParam = locationData.pincode;
          }
        } catch (e) {
          // Error parsing saved location
        }
      }

      if (!token) {
        setUserProfile(null);
        setUserId(null);
        fetchProductData(null, pincodeParam, false);
        return;
      }

      try {
        const res = await axiosUserInstance.get("profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userData = res?.data?.data?.user || {};
        setUserProfile(userData);
        setUserId(userData._id || null);
        fetchProductData(userData._id, pincodeParam, false);
      } catch (err) {
        setUserProfile(null);
        setUserId(null);
        fetchProductData(null, pincodeParam, false);
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
        if (latitude && longitude) {
          params.push(`lat=${latitude}`);
          params.push(`lng=${longitude}`);
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

    if (savedLocation) {
      try {
        const locationData = JSON.parse(savedLocation);
        if (locationData.pincode && locationData.pincode.length > 0) {
          pincodeParam = locationData.pincode;
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

    await fetchProductData(userId, pincodeParam, true, locationParam);
  };

  const handlePincodeCheck = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const pincodeValue = pincode.trim();

    if (!pincodeValue || pincodeValue === "") {
      toast.error("Pincode is required");
      return;
    }

    if (pincodeValue.length < 3 || !/^\d+$/.test(pincodeValue)) {
      toast.error("Please enter a valid pincode (minimum 3 digits)");
      return;
    }

    try {
      setLoadingVendors(true);

      let locationName = "Selected Location";
      let coordinates = null;
      try {
        // const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${pincodeValue}|country:IN&key=${GOOGLE_MAPS_API_KEY}`,
        );
        const data = await response.json();
        if (data.status === "OK" && data.results.length > 0) {
          const result = data.results[0];
          locationName = result.formatted_address || "Selected Location";

          // Extract coordinates from the geometry
          if (result.geometry && result.geometry.location) {
            coordinates = {
              lat: result.geometry.location.lat,
              lng: result.geometry.location.lng,
            };
          }
        }
      } catch (geoErr) { }

      updateLocation({
        ...(currentLocation || {}),
        pincode: pincodeValue,
        name: locationName,
        address: `Pincode: ${pincodeValue}`,
        addressId: null,
        coordinates: coordinates,
        timestamp: new Date().toISOString(),
      });

      const startTime = Date.now();
      if (userId !== null) {
        await fetchProductData(userId, pincodeValue, true);
      } else {
        await fetchProductData(null, pincodeValue, true);
      }
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }

      setCheckedPincode(pincodeValue);
    } catch (err) {
      // Error checking pincode
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
      toast.error("Maximum stock reached");
      return;
    }

    try {
      await incrementItem(vendorId, prodId, variantId);
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
      toast.error("Maximum stock reached");
      return;
    }

    try {
      await incrementItem(vendorId, prodId, null);
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
            distanceInKm: v.distanceInKm,
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
          distanceInKm: v.distanceInKm,
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
  const handleNavigateToBooking = async (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
  ) => {
    if (!isLoggedIn) {
      toast.error("Please login to proceed");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      const payload = [
        {
          productId: med._id,
          variantId: effectiveVariantId,
          vendorId: vendor._id || vendor.vendorId,
          packageId: null,
          type: "normal",
          bookingType: "buy_now",
        },
      ];

      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      navigate("/booking-process");
    } catch (error) {
      toast.error(
        error.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to create booking",
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleRentalBookinProcess = async (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
  ) => {
    if (!isLoggedIn) {
      toast.error("Please login to proceed");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");

      // Store perDayRent in localStorage if available
      if (vendor?.perDayRent) {
        localStorage.setItem("perDayRent", vendor.perDayRent);
      }

      const payload = [
        {
          productId: med._id,
          variantId: effectiveVariantId,
          vendorId: vendor._id || vendor.vendorId,
          packageId: null,
          type: "normal",
          bookingType: "buy_now",
          perDayRent: vendor?.perDayRent || 0,
        },
      ];

      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      navigate("/rental-booking-process");
    } catch (error) {
      toast.error(
        error.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to create booking",
      );
      if (error.response?.status === 401) {
        navigate("/login");
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

    const bookingType = vendor.bookingType || vendor.bookingtype || null;

    const price = isVariant
      ? (vendor.matchedVariantPrice ?? vendor.matchedPrice ?? vendor.price ?? 0)
      : (vendor.price ?? vendor.matchedPrice ?? 0);

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
    const isServiceType = serviceBookingTypes.includes(bookingType);
    const isInStock = isServiceType ? true : stock > 0;

    // Pin selection: Use vendor match if available, otherwise use UI selection. Never fall back to null.
    const uiSelection = selectedVariants[med._id] || selectedVariantId;
    const effectiveVariantId =
      isVariant && vendor.matchedVariantId
        ? vendor.matchedVariantId
        : uiSelection || med.variant?.[0]?._id || med._id;

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
    const distanceInKm = vendor.distanceInKm || fullVendor?.distanceInKm;
    const renderVendorActions = () => {
      if (bookingType === "rentals_addtocarts") {
        const buttonWidthStyle = isMobile
          ? { width: "50%", minWidth: "80px" }
          : { width: "100%", minWidth: "120px" };

        return (
          <div
            className="pd-vendor-actions"
            style={{
              display: "flex",
              flexDirection: isMobile ? "row" : "column",
              gap: "8px",
              alignItems: "center",
            }}
          >
            {isInStock ? (
              <CartQuantityControls
                rentAndCartButtonStyles={{
                  fontSize: "12px",
                  padding: "5px 5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  maxWidth: isMobile ? "50%" : "100%",
                  width: "100%",
                  height: "100%",
                }}
                contailerStyles={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0px 5px",
                  maxWidth: "50%",
                  width: "100%",
                  gap: "3px",
                }}
                individualStyleForCart={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "2px 10px",
                  maxWidth: isMobile ? "50%" : "100%",
                  width: "100%",
                  gap: "4px",
                  borderRadius: "10px",
                  border: "1px solid #321961",
                  background: "#fdfaff",
                  boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)",
                }}
                item={{
                  tabletdetails: med,
                  vendordetails: vendor?.bussinessdetails || vendor,
                  variants: med.variant,
                  vendorId: vendor._id || vendor.vendorId,
                  price:
                    calculatedDiscountPrice && calculatedDiscountPrice > 0
                      ? calculatedDiscountPrice
                      : price,
                  discountprice: calculatedDiscountPrice,
                  perDayRent: vendor.perDayRent,
                }}
                variant={med.variant?.find((v) => v._id === effectiveVariantId)}
                maxStock={maxStock || 999}
                options={{
                  bookingType: "cart",
                  type: "normal",
                }}
                className="pd-cart-controls"
                style={buttonWidthStyle}
              />
            ) : (
              <button
                type="button"
                className="pd-btn pd-btn-disabled"
                disabled
                style={buttonWidthStyle}
              >
                <i className="fas fa-ban"></i>Unavailable
              </button>
            )}

            <button
              type="button"
              className="pd-btn text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRentalBookinProcess(
                  vendor,
                  med,
                  effectiveVariantId,
                  price,
                  stock,
                );
              }}
              disabled={!isInStock || !vendor?.perDayRent}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #321961 0%, #822BD4 100%)",
                border: "none",
                fontWeight: 400,
                opacity: vendor?.perDayRent ? 1 : 0.6,
                cursor: vendor?.perDayRent ? "pointer" : "not-allowed",
                fontSize: "12px",
                // minWidth: isMobile ? "85px" : "70px",
                maxWidth: isMobile ? "50%" : "100%",
                flex: "1 1 auto",
              }}
            >
              <i className="fa-solid fa-clipboard-check"></i>
              Rent
            </button>
          </div>
        );
      }

      if (quantity > 0) {
        return (
          <div className="pd-vendor-actions">
            <button
              type="button"
              className="pd-btn pd-btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isVariant || effectiveVariantId
                  ? handleDecrement(
                    "normal",
                    vendor._id || vendor.vendorId,
                    med._id,
                    effectiveVariantId,
                    vendor,
                    selectedVariant,
                  )
                  : handleSingleDecrement(vendor._id, med._id);
              }}
            >
              <i className="fas fa-minus"></i>
            </button>
            <span
              style={{ padding: "0 8px", fontWeight: 600, fontSize: "12px" }}
            >
              {quantity}
            </span>
            <button
              type="button"
              className="pd-btn pd-btn-secondary"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                isVariant || effectiveVariantId
                  ? handleIncrement(
                    "normal",
                    vendor._id || vendor.vendorId,
                    med._id,
                    effectiveVariantId,
                    maxStock,
                    vendor,
                    selectedVariant,
                  )
                  : handleSingleIncrement(vendor._id, med._id, maxStock);
              }}
              disabled={maxStock > 0 && quantity >= maxStock}
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
        );
      }

      // booking & slots - Navigate to BookingProcess
      if (bookingType === "booking" || bookingType === "slots") {
        return (
          <div className="pd-vendor-actions">
            <button
              type="button"
              className={
                bookingType === "slots"
                  ? "pd-btn pd-btn-book"
                  : "pd-btn pd-btn-book"
              }
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigateToBooking(
                  vendor,
                  med,
                  effectiveVariantId,
                  price,
                  stock,
                );
              }}
              disabled={!isInStock}
            >
              <i
                className={
                  bookingType === "slots"
                    ? "fa-solid fa-clock"
                    : "fas fa-calendar-check"
                }
              ></i>
              {bookingType === "slots" ? "Book Now" : "Book Now"}
            </button>
          </div>
        );
      }

      // leads - Open Lead Modal (do NOT navigate)
      if (bookingType === "lead" || bookingType === "leads") {
        return (
          <div className="pd-vendor-actions">
            <button
              type="button"
              className="pd-btn pd-btn-lead"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleAddLead(vendor, med, effectiveVariantId, {
                  price,
                  stock,
                });
              }}
              disabled={!isInStock}
            >
              Get An Enquiry
            </button>
          </div>
        );
      }

      // rentals - Open Rental Modal
      if (bookingType === "rentals") {
        return (
          <div className="pd-vendor-actions">
            <button
              type="button"
              className="pd-btn pd-btn-ride"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRentalBookinProcess(
                  vendor,
                  med,
                  effectiveVariantId,
                  price,
                  stock,
                );
              }}
              disabled={!isInStock || !vendor?.perDayRent}
              style={{
                opacity: vendor?.perDayRent ? 1 : 0.6,
                cursor: vendor?.perDayRent ? "pointer" : "not-allowed",
              }}
            >
              <i className="fa-solid fa-clipboard-check"></i>
              Rent
            </button>
          </div>
        );
      }

      if (bookingType === "consultation") {
        return (
          <div className="pd-vendor-actions">
            <button
              type="button"
              className="pd-btn pd-btn-consultation text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenConsultationModal(
                  vendor,
                  med,
                  effectiveVariantId,
                  price,
                  stock,
                );
              }}
              disabled={!isInStock}
            >
              <i className="fa-solid fa-comments text-white"></i>
              Consultation
            </button>
          </div>
        );
      }

      if (bookingType === "appointment") {
        return (
          <div className="pd-vendor-actions">
            <button
              type="button"
              className="pd-btn pd-btn-appointment text-white"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleOpenAppointmentModal(
                  vendor,
                  med,
                  effectiveVariantId,
                  price,
                  stock,
                );
              }}
              disabled={!isInStock}
            >
              <i className="fa-solid fa-calendar-check text-white"></i>
              Appointment
            </button>
          </div>
        );
      }

      if (bookingType === "cart") {
        const variantForCart = isVariant
          ? med?.variant?.find(
            (v) =>
              v._id === effectiveVariantId ||
              v.variantId === effectiveVariantId,
          ) || selectedVariant
          : null;

        const canUseCart = isInStock;

        return (
          <div className="pd-vendor-actions">
            {canUseCart ? (
              <CartQuantityControls
                item={{
                  tabletdetails: med,
                  vendordetails: vendor?.bussinessdetails || vendor,
                  variants: med.variant,
                  vendorId: vendor._id || vendor.vendorId,
                  price:
                    calculatedDiscountPrice && calculatedDiscountPrice > 0
                      ? calculatedDiscountPrice
                      : price,
                  discountprice: calculatedDiscountPrice,
                }}
                variant={variantForCart}
                maxStock={maxStock}
                options={{ bookingType: "cart", type: "normal" }}
              />
            ) : (
              <button
                type="button"
                className="pd-btn pd-btn-secondary"
                disabled
              >
                <i className="fas fa-ban"></i> Unavailable
              </button>
            )}
          </div>
        );
      }

      if (bookingType === "buy_now" || service === "surgeries") {
        return (
          <div className="pd-vendor-actions">
            <button
              type="button"
              className="pd-btn pd-btn-book"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleNavigateToBooking(
                  vendor,
                  med,
                  effectiveVariantId,
                  price,
                  stock,
                );
              }}
              disabled={!isInStock}
            >
              Book Now
            </button>
          </div>
        );
      }

      return (
        <div className="pd-vendor-actions">
          <button
            type="button"
            className="pd-btn pd-btn-cart"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              isVariant || effectiveVariantId
                ? handleAddToCart(
                  vendor,
                  med,
                  effectiveVariantId,
                  {
                    price,
                    stock,
                  },
                  effectivePriceForCart,
                )
                : handleSingleAddToCart(vendor, med, effectivePriceForCart);
            }}
            disabled={!isInStock}
          >
            Add to Cart
          </button>
        </div>
      );
    };

    return (
      <div
        key={vendor._id || vendor.vendorId || index}
        className="pd-vendor-item"
        onClick={() => handleVendorClick(vendor)}
        style={{
          cursor: "pointer",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "flex-start",
          gap: "8px",
          width: "100%",
        }}
      >
        {bookingType === "rentals_addtocarts" ? (
          <div
            className="pd-vendor-info"
            style={{
              display: "flex",
              gap: "10px",
              flex: "1 1 auto",
              minWidth: 0,
              alignItems: "center",
            }}
          >
            {vendor.bussinessdetails?.bussiness_image?.url && (
              <div
                className="pd-vendor-avatar"
                style={{ cursor: "pointer", flexShrink: 0 }}
              >
                <img
                  src={getImageUrl(vendor.bussinessdetails.bussiness_image.url)}
                  alt={vendorName}
                  title={vendorName}
                />
              </div>
            )}
            <div
              className="pd-vendor-details"
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                display: "flex",
                flexDirection: isMobile ? "column" : "row",
                justifyContent: "space-between",
                gap: "2px",
              }}
            >
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "4px",
                    flexWrap: "wrap",
                  }}
                >
                  <div
                    className="pd-vendor-name"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleVendorClick(vendor);
                    }}
                    style={{
                      cursor: "pointer",
                      fontFamily: '"Poppins", sans-serif',
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {vendorName}
                  </div>
                </div>

                <div
                  className="pd-vendor-location"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "4px",
                    fontSize: "10px",
                  }}
                >
                  <div
                    className="pd-vendor-price"
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "6px",
                      flexWrap: "wrap",
                    }}
                  >
                    {calculatedDiscountPrice &&
                      calculatedDiscountPrice > 0 &&
                      calculatedDiscountPrice !== price ? (
                      <>
                        <span
                          className="pd-vendor-price-new color-primary"
                          style={{ fontFamily: '"Poppins", sans-serif' }}
                        >
                          ₹{calculatedDiscountPrice.toFixed(2)}
                        </span>
                        <span
                          className="pd-vendor-price-old "
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
                        className="pd-vendor-price-new color-primary"
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
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      flexWrap: "wrap",
                    }}
                  >
                    {discount > 0 && (
                      <small
                        className="text-success"
                        style={{
                          fontSize: "11px",
                          fontFamily: '"Poppins", sans-serif',
                          whiteSpace: "nowrap",
                        }}
                      >
                        {discountType === "percentage" && discountPrice
                          ? `${discountPrice}% OFF`
                          : `${discount}% OFF`}
                      </small>
                    )}
                  </div>
                </div>

                <div
                  className="pd-vendor-price-section"
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: "6px",
                    marginTop: "2px",
                  }}
                >
                  {fullVendor?.serviceCharges && (
                    <small
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        fontFamily: '"Poppins", sans-serif',
                        whiteSpace: "nowrap",
                      }}
                    >
                      Service Fee: ₹{Number(fullVendor?.serviceCharges || 0).toFixed(2)}
                    </small>
                  )}
                  {fullVendor?.fixedDeposit && (
                    <small
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        fontFamily: '"Poppins", sans-serif',
                        whiteSpace: "nowrap",
                      }}
                    >
                      Security Deposit: ₹{Number(fullVendor?.fixedDeposit || 0).toFixed(2)}
                    </small>
                  )}
                  {fullVendor?.returnCharge && (
                    <small
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        fontFamily: '"Poppins", sans-serif',
                        whiteSpace: "nowrap",
                      }}
                    >
                      Return Charge: ₹{Number(fullVendor?.returnCharge || 0).toFixed(2)}
                    </small>
                  )}
                  {vendor?.perDayRent && (
                    <small
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        fontFamily: '"Poppins", sans-serif',
                        whiteSpace: "nowrap",
                        color: "#321961",
                      }}
                    >
                      <i
                        className="fas fa-calendar-day"
                        style={{ marginRight: "2px", fontSize: "8px" }}
                      ></i>
                      Per Day Rent: ₹{Number(vendor?.perDayRent || 0).toFixed(2)}
                    </small>
                  )}
                </div>

                {vendor.bussinessdetails?.address && (
                  <div
                    className="pd-vendor-address"
                    style={{
                      fontSize: "11px",
                      color: "#666",
                      fontFamily: '"Poppins", sans-serif',
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    <i
                      className="fas fa-map-marker-alt"
                      style={{
                        fontSize: "9px",
                        marginRight: "4px",
                        color: "#321961",
                      }}
                    ></i>
                    {vendor.bussinessdetails.address.slice(0, 26)}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                    flexWrap: "wrap",
                  }}
                >
                  {distanceInKm && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <i
                        className="fas fa-map-marker-alt"
                        style={{ fontSize: "10px" }}
                      ></i>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          fontFamily: '"Poppins", sans-serif',
                        }}
                      >
                        {distanceInKm.toFixed(1)} km away
                      </span>
                    </div>
                  )}

                  {

                    (product.tablet.category.fixedType === 'medicine' || product.tablet.category.fixedType === 'medicines') && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                        }}
                      >
                        <i
                          className="fas fa-truck me-1"
                          style={{ fontSize: "10px" }}
                        ></i>
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: "600",
                            fontFamily: '"Poppins", sans-serif',
                          }}
                        >
                          {distance}
                        </span>
                      </div>
                    )
                  }
                </div>
              </div>
              <div>
                <div style={{ flexShrink: 0 }}>{renderVendorActions()}</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className="pd-vendor-info"
            style={{
              display: "flex",
              gap: "10px",
              flex: "1 1 auto",
              minWidth: 0,
              flexWrap: "wrap",
              alignItems: "center",
            }}
          >
            {vendor.bussinessdetails?.bussiness_image?.url && (
              <div
                className="pd-vendor-avatar"
                style={{ cursor: "pointer", flexShrink: 0 }}
              >
                <img
                  src={getImageUrl(vendor.bussinessdetails.bussiness_image.url)}
                  alt={vendorName}
                  title={vendorName}
                />
              </div>
            )}
            <div
              className="pd-vendor-details"
              style={{
                flex: "1 1 auto",
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
                gap: "2px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "4px",
                  flexWrap: "wrap",
                }}
              >
                <div
                  className="pd-vendor-name"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVendorClick(vendor);
                  }}
                  style={{
                    cursor: "pointer",
                    fontFamily: '"Poppins", sans-serif',
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  {vendorName.length > 20
                    ? vendorName.slice(0, 20) + "..."
                    : vendorName}
                  {vendor?.averageRating > 0 && vendor?.ratingCount > 0 && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        fontSize: "11px",
                        color: "#666",
                        marginTop: "2px",
                      }}
                    >
                      <i
                        className="fas fa-star"
                        style={{
                          color: "#ffc107",
                          fontSize: "10px",
                        }}
                      ></i>
                      <span style={{ fontWeight: "500" }}>
                        {vendor.averageRating.toFixed(1)}
                      </span>
                      <span style={{ color: "#999" }}>
                        ({vendor.ratingCount}+)
                      </span>
                    </div>
                  )}
                </div>
                {!isMobile && (
                  <div style={{ flexShrink: 0 }}>{renderVendorActions()}</div>
                )}
              </div>

              <div
                className="pd-vendor-location"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "4px",
                  fontSize: "10px",
                }}
              >
                <div
                  className="pd-vendor-price"
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: "6px",
                    flexWrap: "wrap",
                  }}
                >
                  {calculatedDiscountPrice &&
                    calculatedDiscountPrice > 0 &&
                    calculatedDiscountPrice !== price ? (
                    <>
                      <span
                        className="pd-vendor-price-new color-primary"
                        style={{ fontFamily: '"Poppins", sans-serif' }}
                      >
                        ₹{calculatedDiscountPrice.toFixed(2)}
                      </span>
                      <span
                        className="pd-vendor-price-old "
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
                      className="pd-vendor-price-new color-primary"
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
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    flexWrap: "wrap",
                  }}
                >
                  {discount > 0 && (
                    <small
                      className="text-success"
                      style={{
                        fontSize: "11px",
                        fontFamily: '"Poppins", sans-serif',
                        whiteSpace: "nowrap",
                      }}
                    >
                      {discountType === "percentage" && discountPrice
                        ? `${discountPrice}% OFF`
                        : `${discount}% OFF`}
                    </small>
                  )}
                </div>
              </div>

              <div
                className="pd-vendor-price-section"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "6px",
                  marginTop: "2px",
                }}
              ></div>

              {vendor.bussinessdetails?.address && (
                <div
                  className="pd-vendor-address"
                  style={{
                    fontSize: "11px",
                    color: "#666",
                    fontFamily: '"Poppins", sans-serif',
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    maxWidth: "100%",
                  }}
                >
                  <i
                    className="fas fa-map-marker-alt"
                    style={{
                      fontSize: "9px",
                      marginRight: "4px",
                      color: "#321961",
                    }}
                  ></i>
                  {vendor.bussinessdetails.address.slice(0, 26)}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px",
                  flexWrap: "wrap",
                }}
              >
                {distanceInKm && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                    }}
                  >
                    <i
                      className="fas fa-map-marker-alt"
                      style={{ fontSize: "10px" }}
                    ></i>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "600",
                        fontFamily: '"Poppins", sans-serif',
                      }}
                    >
                      {distanceInKm.toFixed(1)} km away
                    </span>
                  </div>
                )}

                {

                  (product.tablet.category.fixedType === 'medicine' || product.tablet.category.fixedType === 'medicines') && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      <i
                        className="fas fa-truck me-1"
                        style={{ fontSize: "10px" }}
                      ></i>
                      <span
                        style={{
                          fontSize: "10px",
                          fontWeight: "600",
                          fontFamily: '"Poppins", sans-serif',
                        }}
                      >
                        {distance}
                      </span>
                    </div>
                  )
                }

              </div>

              {isMobile && (
                <div style={{ flexShrink: 0 }}>{renderVendorActions()}</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="pd-loader">
        <img src="/assets/img/logo.png" alt="Loading..." />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-fluid p-0">
        <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
          <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
            <div className="col-lg-8 col-md-12 text-center">
              <div className="error-info">
                <div className="error-404-img">
                  <img
                    src="/assets/404error.png"
                    className="img-fluid bg-white errorimage"
                    alt="error-404-image"
                    title="error image"
                  />
                  <div className="error-content">
                    <h5 className="mb-2">Oops! That Page Can’t Be Found.</h5>
                    <p>The page you are looking for was never existed.</p>
                    <Link to="/" className="btn btn-primary-gradient btn-sm">
                      <i className="fas fa-home me-1"></i> Back to Home
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

  return (
    <>
      {<Home2Header />}
      <CategoryProvider isLoading={loading} />
      <div className="container-fluid">
        <div className="row">
          <div
            className="col-lg-9 col-md-12 pt-5"
            style={{ marginTop: isMobile ? "10px" : "50px" }}
          >
            <div className="content">
              <div className="mb-3">
                <button
                  className="btn btn-light btn-sm rounded shadow-sm back-btn"
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
                  style={{
                    padding: "8px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    border: "1px solid #e0e0e0",
                    background: "#ffffff",
                    color: "#333",
                    fontWeight: "500",
                    fontSize: "14px",
                    borderRadius: "8px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.08)",
                    transition: "all 0.3s ease",
                    cursor: "pointer",
                  }}
                >
                  <i
                    className="fas fa-arrow-left"
                    style={{ fontSize: "12px" }}
                  ></i>
                  <span style={{ fontSize: "14px", fontWeight: "500" }}>
                    Back
                  </span>
                </button>
              </div>

              <div className="container">
                {descriptionTop && descriptionTop.length > 0 && (
                  <div className="text-center mb-5">
                    <Slider
                      {...{
                        ...descriptionTopSettings,
                        infinite: rightSideTop.length > 1,
                        autoplay: rightSideTop.length > 1,
                      }}
                    >
                      {descriptionTop.map((banner, index) => (
                        <div key={index} className="mx-1">
                          <img
                            src={banner.src}
                            alt={banner.alt}
                            loading="lazy"
                            className="img-fluid rounded banner-image"
                            style={{
                              descriptionTopSettings,
                              borderRadius: "10px",
                              aspectRatio: "5.5 / 1",
                              objectFit: "cover",
                            }}
                          />
                        </div>
                      ))}
                    </Slider>
                  </div>
                )}
                <div className="card shadow-sm rounded-3">
                  <div className="card-body">
                    <div className="row g-4 align-items-start">
                      <div className="col-lg-7 col-12 position-relative">
                        <div className="position-absolute top-0 start-0 end-0 px-3 d-flex  flex-md-row justify-content-between gap-2">
                          <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2">
                            <div className="d-flex align-items-center gap-2 bg-white px-2 py-1 rounded  small">
                              <span className="text-warning fw-semibold bg-primary px-1 rounded ">
                                <i
                                  className="fas fa-star me-1"
                                  style={{ fontSize: "10px" }}
                                ></i>{" "}
                                <span
                                  className="text-white "
                                  style={{
                                    fontWeight: "600",
                                    fontSize: "10px",
                                  }}
                                >
                                  {ratingsum && typeof ratingsum === "number"
                                    ? ratingsum.toFixed(1)
                                    : "0"}
                                </span>
                              </span>
                              <span className="text-muted">
                                <i className="fas fa-users me-1"></i>(
                                {ratingpeople > 0 ? `${ratingpeople}+` : "0"})
                              </span>
                            </div>
                          </div>

                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-light btn-sm rounded-circle shadow-sm"
                              onClick={() => setShowShareModal(true)}
                              style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "50%",
                                border: "1px solid #e0e0e0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                backgroundColor: "#fff",
                                transition: "all 0.2s ease",
                              }}
                            >
                              <FaRegShareSquare color="#000000" size={20} />
                            </button>
                            <button
                              className={`pd-action-btn ${product?.tablet?.isFavorite ? "active" : ""
                                }`}
                              onClick={() =>
                                handleToggleFavourite(
                                  product.tablet._id,
                                  product.tablet.isFavorite,
                                )
                              }
                              style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "50%",
                                border: "1px solid #e0e0e0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                backgroundColor: "#fff",
                                transition: "all 0.2s ease",
                              }}
                            >
                              {product?.tablet?.isFavorite ? (
                                <FaHeart color="red" size={20} />
                              ) : (
                                <IoIosHeartEmpty size={20} />
                              )}
                            </button>
                            <div
                              data-tooltip-id="global-tooltip"
                              data-tooltip-content="Compare"
                              className="pd-action-btn"
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
                              style={{
                                width: "35px",
                                height: "35px",
                                borderRadius: "50%",
                                border: "1px solid #e0e0e0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                cursor: "pointer",
                                backgroundColor: "#fff",
                                transition: "all 0.2s ease",
                              }}
                            >
                              {" "}
                              <i
                                className="fa-solid fa-right-left"
                                style={{ color: "#000" }}
                              ></i>{" "}
                            </div>
                          </div>
                        </div>

                        <div className="row mt-4 align-items-start g-3">
                          <div className="col-12 col-sm-5 text-center">
                            <div
                              className="product-img-wrapper mx-auto"
                              style={{ marginTop: isMobile && "10px" }}
                              ref={imageZoomRef}
                              onMouseMove={(e) => {
                                if (isMobile) return;
                                const rect =
                                  e.currentTarget.getBoundingClientRect();
                                const x =
                                  ((e.clientX - rect.left) / rect.width) * 100;
                                const y =
                                  ((e.clientY - rect.top) / rect.height) * 100;
                                setImageZoom({ x, y, scale: 2 });
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
                                      // ...tabletImages,
                                    ];
                                  } else {
                                    if (tabletImages.length > 0) {
                                      allImages = [
                                        // ...variantImages,
                                        ...tabletImages,
                                      ];
                                    }
                                    else {
                                      allImages = [
                                        ...variantImages,
                                        ...tabletImages,
                                      ];
                                    }

                                  }

                                  const imageUrl =
                                    allImages[selectedImageIndex] ||
                                    allImages[0] ||
                                    "/assets/default.png";
                                  const finalSrc = getImageUrl(imageUrl);
                                  setPreviewImage(finalSrc);
                                  setCurrentModalIndex(selectedImageIndex); // Set initial index
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
                                    // ...tabletImages,
                                  ];
                                } else {
                                  if (tabletImages.length > 0) {
                                    allImages = [
                                      // ...variantImages,
                                      ...tabletImages,
                                    ];
                                  }
                                  else {
                                    allImages = [
                                      ...variantImages,
                                      ...tabletImages,
                                    ];
                                  }
                                }

                                const imageUrl =
                                  allImages[selectedImageIndex] ||
                                  allImages[0] ||
                                  "/assets/default.png";

                                const finalSrc = getImageUrl(imageUrl);

                                return (
                                  <>
                                    <img
                                      src={finalSrc}
                                      alt={tablet?.name}
                                      onError={(e) => {
                                        e.currentTarget.src =
                                          "/assets/default.png";
                                      }}
                                      className="img-fluid product-img border zoom-image"
                                      style={{
                                        transform: `scale(${imageZoom.scale})`,
                                        transformOrigin: `${imageZoom.x}% ${imageZoom.y}%`,
                                        transition:
                                          imageZoom.scale === 1
                                            ? "transform 0.3s ease"
                                            : "none",
                                        cursor: isMobile
                                          ? "pointer"
                                          : "zoom-in",
                                        width: "100%",
                                        height: "220px",
                                        objectFit: "contain",
                                      }}
                                    />
                                  </>
                                );
                              })()}
                            </div>

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
                                  // ...tabletImages,
                                ];
                              } else {
                                if (tabletImages.length > 0) {
                                  allImages = [
                                    // ...variantImages,
                                    ...tabletImages,
                                  ];
                                }
                                else {
                                  allImages = [
                                    ...variantImages,
                                    ...tabletImages,
                                  ];
                                }
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
                                <div className="thumbnail-container d-flex flex-column align-items-center">
                                  {maxThumbnails > 1 && (
                                    <div className="d-flex align-items-center gap-1">
                                      {maxThumbnails > visibleThumbnails && (
                                        <button
                                          onClick={handlePrevThumbnails}
                                          disabled={thumbnailStartIndex === 0}
                                          className="btn btn-sm btn-outline-secondary mt-3 "
                                          style={{
                                            borderRadius: "50%",
                                            width: "20px",
                                            height: "20px",
                                            padding: "0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity:
                                              thumbnailStartIndex === 0
                                                ? 0.5
                                                : 1,
                                            cursor:
                                              thumbnailStartIndex === 0
                                                ? "not-allowed"
                                                : "pointer",
                                          }}
                                        >
                                          <i
                                            className="fas fa-chevron-left"
                                            style={{ fontSize: "10px" }}
                                          ></i>
                                        </button>
                                      )}

                                      <div
                                        className="thumbnail-wrapper d-flex gap-2"
                                        style={{ overflow: "hidden" }}
                                      >
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
                                                className={`thumbnail-img ${selectedImageIndex ===
                                                  actualIndex
                                                  ? "active"
                                                  : ""
                                                  }`}
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
                                                style={{
                                                  width: "50px",
                                                  height: "50px",
                                                  objectFit: "contain",
                                                  borderRadius: "4px",
                                                  cursor: "pointer",
                                                  transition: "all 0.2s ease",
                                                }}
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
                                          className="btn btn-sm btn-outline-secondary mt-3"
                                          style={{
                                            borderRadius: "50%",
                                            width: "20px",
                                            height: "20px",
                                            padding: "0",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            opacity:
                                              thumbnailStartIndex >=
                                                maxThumbnails - visibleThumbnails
                                                ? 0.5
                                                : 1,
                                            cursor:
                                              thumbnailStartIndex >=
                                                maxThumbnails - visibleThumbnails
                                                ? "not-allowed"
                                                : "pointer",
                                          }}
                                        >
                                          <i
                                            className="fas fa-chevron-right"
                                            style={{ fontSize: "10px" }}
                                          ></i>
                                        </button>
                                      )}
                                    </div>
                                  )}

                                  <div
                                    className="mt-2 d-flex align-items-center gap-1 text-primary"
                                    style={{ cursor: "pointer" }}
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
                                    <i className="fas fa-edit fs-sm"></i>
                                    <small>
                                      <u>Write a Review</u>
                                    </small>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>

                          <div className="col-12 col-sm-7">
                            <h5 className="fw-bold mb-1 text-capitalize">
                              {tablet?.name}
                            </h5>
                            {tablet?.medicineType && (
                              <div className="mb-1">
                                <span
                                  className="badge bg-primary rounded-pill"
                                  style={{ textTransform: "capitalize" }}
                                >
                                  {tablet?.medicineType}
                                </span>
                              </div>
                            )}

                            {med?.variant && med.variant.length > 0 && (
                              <>
                                <label className="small fw-semibold">
                                  Select Variant
                                </label>
                                <select
                                  className="form-select form-select-sm mb-2"
                                  style={{ width: "280px" }}
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
                              </>
                            )}

                            {(selectedVariant?.price || tablet?.price) && (
                              <div
                                className="mb-2"
                                style={{ fontSize: "16px" }}
                              >
                                <span className="text-muted me-1">MRP</span>
                                <span className="fw-bold text-primary">
                                  ₹
                                  {(
                                    selectedVariant?.price || tablet?.price
                                  ).toFixed(2)}
                                </span>
                                <small className="text-muted ms-1">
                                  {selectedVariant?.pricePerUnit} (Inclusive of
                                  all Taxes)
                                </small>
                              </div>
                            )}

                            {med?.prescriptionRequired && (
                              <div className="col-10 mb-2">
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
                              className="row small"
                              style={{ fontSize: "12px" }}
                            >
                              {tablet?.manufacture?.name && (
                                <div
                                  className="col-6 mb-2"
                                  style={{ fontSize: "12px" }}
                                >
                                  <strong>Manufacturer:</strong>
                                  <br />
                                  <span
                                    style={{
                                      cursor: "pointer",
                                      color: "#007bff",
                                      textDecoration: "underline",
                                    }}
                                    onClick={() =>
                                      navigate(
                                        `/manufacture/${createSlug(tablet.manufacture.name)}-${tablet.manufacture._id}`,
                                      )
                                    }
                                  >
                                    {tablet.manufacture.name}
                                  </span>
                                </div>
                              )}

                              {tablet?.form && (
                                <div
                                  className="col-6 mb-2"
                                  style={{ fontSize: "12px" }}
                                >
                                  <strong>Form:</strong>
                                  <br />
                                  {tablet.form}
                                </div>
                              )}

                              {tablet.parameterss?.length > 0 && (
                                <p
                                  className="mt-2"
                                  style={{ fontSize: "12px" }}
                                >
                                  <i
                                    className="fa fa-cogs fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Parameters:</strong>{" "}
                                  {tablet.parameterss.length}
                                </p>
                              )}

                              {tablet.gender && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-venus-mars fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Gender:</strong> {tablet.gender}
                                </p>
                              )}

                              {tablet?.smapletype && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-flask fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Sample Type:</strong>{" "}
                                  {tablet.smapletype}
                                </p>
                              )}

                              {tablet?.isFasting && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-moon fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Fasting:</strong>{" "}
                                  {tablet.isFasting?.charAt(0)?.toUpperCase() +
                                    tablet.isFasting?.slice(1) || "No Fasting"}
                                </p>
                              )}

                              {tablet?.duration && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-clock fa-sm mt-3"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Duration:</strong> {tablet.duration}
                                </p>
                              )}

                              {tablet?.bodypart && (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  <i
                                    className="fas fa-person fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Body Part:</strong> {tablet.bodypart}
                                </p>
                              )}

                              {tablet?.iscontrast && (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  <i
                                    className="fas fa-adjust fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Contrast:</strong> {tablet.iscontrast}
                                </p>
                              )}

                              {tablet?.model && (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  <i
                                    className="fas fa-microchip fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Modal:</strong> {tablet.model}
                                </p>
                              )}
                              {tablet?.machineType && (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  <i
                                    className="fas fa-toolbox fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Machine Type:</strong>{" "}
                                  {tablet.machineType}
                                </p>
                              )}

                              {tablet?.reportsDuration && (
                                <p
                                  style={{
                                    fontSize: "12px",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  <i
                                    className="fas fa-file-alt fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Reports:</strong>{" "}
                                  {tablet.reportsDuration}
                                </p>
                              )}

                              {tablet?.complexity && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className={`fa ${tablet.complexity === "simple"
                                      ? "fa-check"
                                      : tablet.complexity === "medium"
                                        ? "fa-exclamation-triangle"
                                        : tablet.complexity === "complex"
                                          ? "fa-exclamation-circle"
                                          : "fa-question-circle"
                                      } fa-sm`}
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Complexity:</strong>{" "}
                                  <span
                                    className={`fw-normal ${tablet.complexity === "simple"
                                      ? "text-success"
                                      : tablet.complexity === "medium"
                                        ? "text-warning"
                                        : tablet.complexity === "complex"
                                          ? "text-danger"
                                          : "text-secondary"
                                      }`}
                                    style={{
                                      textTransform: "capitalize",
                                      fontSize: "12px",
                                    }}
                                  >
                                    {tablet.complexity}
                                  </span>
                                </p>
                              )}

                              {tablet?.treatmenttype && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-tooth"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Treatment Type:</strong>{" "}
                                  {tablet.treatmenttype}
                                </p>
                              )}
                              {tablet?.procedureType && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-stethoscope fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Procedure Type:</strong>{" "}
                                  {tablet.procedureType}
                                </p>
                              )}

                              {tablet?.recoveryTime && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-clock fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Recovery Time:</strong>{" "}
                                  {tablet.recoveryTime}
                                </p>
                              )}

                              {tablet?.condition && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fas fa-circle-check fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Condition:</strong> {tablet.condition}
                                </p>
                              )}
                              {tablet?.shiftType && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fas fa-clock fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Shift:</strong>
                                  {tablet.shiftType?.replace(/_/g, " ")}
                                </p>
                              )}
                              {tablet?.nursecareType && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fas fa-house-user fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Type:</strong>{" "}
                                  {tablet.nursecareType?.replace(/_/g, " ")}
                                </p>
                              )}
                              {tablet?.homecareMode && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fas fa-house-user fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Mode:</strong> {tablet.homecareMode}
                                </p>
                              )}

                              {tablet.reportDuration && (
                                <p style={{ fontSize: "12px" }}>
                                  <i
                                    className="fa fa-calendar fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  <strong>Reports in:</strong>{" "}
                                  {tablet.reportDuration}
                                </p>
                              )}

                              {tablet?.strength && (
                                <div
                                  className="col-6 mb-2"
                                  style={{ fontSize: "12px" }}
                                >
                                  <strong>Storage:</strong>
                                  <br />
                                  {tablet.strength}
                                </div>
                              )}
                            </div>

                            {tablet?.compositions?.name && (
                              <div
                                className="col-10 mb-2"
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
                                      `/composition/${createSlug(tablet.compositions.name)}-${tablet.compositions._id}`,
                                    )
                                  }
                                >
                                  {tablet.compositions.name}
                                </span>
                              </div>
                            )}

                            {tablet?.points && tablet.points.length > 0 && (
                              <div className="col-12 mb-3">
                                <h6
                                  className="fw-[500] mb-2"
                                  style={{ fontSize: "14px" }}
                                >
                                  <i
                                    className="fa fa-info-circle fa-sm"
                                    style={{ color: "#321961" }}
                                  ></i>{" "}
                                  Interactions
                                </h6>
                                <div className="row">
                                  {tablet.points.map((item, index) => {
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
                                      <div
                                        key={index}
                                        className="col-md-4 col-sm-12 mb-2"
                                        style={{ fontSize: "12px" }}
                                      >
                                        <strong>{label}:</strong>
                                        <br />
                                        <span
                                          style={{
                                            textTransform: "capitalize",
                                          }}
                                        >
                                          {value
                                            ?.toLowerCase()
                                            .replace(/_/g, " ")}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* let local = localStorage.getItem('fixedType');
                          if(local == service)
                          {
                            service = service;
                          }else{
                            service = local;
                          } */}

                          {(service === "medicine" ||
                            service === "medicines") && (
                              <div className="d-flex justify-content-center mt-0">
                                <a
                                  href="#related-products-section"
                                  className="cta-button"
                                  style={{
                                    width: "200px",
                                    background:
                                      "linear-gradient(135deg, #a878f1, #321961, #7541a8)",
                                    color: "white",
                                    padding: "5px",
                                    textAlign: "center",
                                  }}
                                >
                                  <span
                                    className="mx-1"
                                    style={{ fontSize: "14px" }}
                                  >
                                    Smarter Substitutes
                                  </span>
                                  <i
                                    className="fa-solid fa-arrow-right"
                                    style={{ fontSize: "12px" }}
                                  ></i>
                                </a>
                              </div>
                            )}

                          <div>
                            {tablet?.complexity && (
                              <div
                                className="col-12"
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

                      <div className="col-lg-5 col-12">
                        <div className="border rounded-3 p-2">
                          {/* pincode */}
                          <div className="input-group mb-3">
                            <input
                              type="number"
                              className="form-control"
                              placeholder="Enter pincode"
                              value={pincode}
                              required
                              onChange={(e) => {
                                const value = e.target.value;
                                setPincode(value);
                                if (
                                  checkedPincode &&
                                  value !== checkedPincode
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
                            />
                            {pincode.trim() !== "" && (
                              <button
                                className="btn btn-outline-secondary"
                                type="button"
                                onClick={handlePincodeClear}
                                disabled={loadingVendors}
                              >
                                <i className="fas fa-times" />
                              </button>
                            )}
                            <button
                              className="btn btn-primary px-4 mx-1"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handlePincodeCheck(e);
                              }}
                              style={{ padding: "8px 1px" }}
                              disabled={loadingVendors}
                            >
                              Check
                            </button>
                          </div>

                          {/* vendors */}
                          <div className="vendor-list-wrapper position-relative">
                            {loadingVendors && (
                              <div
                                className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
                                style={{
                                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                                  zIndex: 10,
                                  borderRadius: "8px",
                                }}
                              >
                                <div
                                  className="spinner-border text-primary"
                                  role="status"
                                >
                                  <span className="visually-hidden">
                                    Loading...
                                  </span>
                                </div>
                              </div>
                            )}
                            {!headerPincode && !checkedPincode ? (
                              <div className="pd-no-vendors text-center py-4">
                                <i
                                  className="fas fa-map-marker-alt mb-2"
                                  style={{ fontSize: "2rem", color: "#ccc" }}
                                ></i>
                                <p className="mb-0" style={{ color: "#666" }}>
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
                              <div className="pd-no-vendors text-center py-4">
                                <i
                                  className="fas fa-store-slash mb-2"
                                  style={{ fontSize: "2rem", color: "#ccc" }}
                                ></i>
                                <p className="mb-0" style={{ color: "#666" }}>
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
            className="col-lg-3 col-md-12"
            style={{ marginTop: isMobile ? "0px" : "145px" }}
          >
            <div className="d-lg-block d-none">
              <div
                className="position-relative mb-3 cursor-pointer"
                style={{ cursor: "pointer" }}
              >
                <video
                  src="/description-video.mp4"
                  controls
                  loop
                  autoPlay
                  muted
                  playsInline
                  className="img-fluid rounded w-100"
                  style={{
                    height: "300px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
              {/* Right Side Top Banners */}
              <div className="text-center" style={{ marginBottom: "16px" }}>
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
                          className="img-fluid rounded"
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
                        className="img-fluid rounded"
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
                          className="img-fluid rounded"
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
                        className="img-fluid rounded"
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
        <div>
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
