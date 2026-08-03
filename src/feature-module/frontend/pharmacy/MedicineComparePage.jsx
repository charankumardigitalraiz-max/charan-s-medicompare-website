import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Slider from "react-slick";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import Home2Header from "../../../components/home/Header-k";
import Footer from "../../../components/home/Footer-f";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import StickyBox from "react-sticky-box";
import { useAddToCart } from "../../../hooks/useAddToCart";
import { useCart } from "../../../hooks/useCart";
import CartQuantityControls from "../../../components/ui/CartQuantityControls.jsx";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import LeadModal from "./products-components/LeadModal.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import BackButton from "../../../components/ui/BackButton.jsx";
import RentModal from "./products-components/RentModal.jsx";
import ConsultationModal from "./products-components/ConsultationModal.jsx";
import { useResponsive } from "../../../hooks";
import AppointmentModal from "./products-components/AppointmentModal.jsx";
import { useProfile } from "../../../context/ProfileContext";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import { useLocation as useLocationContext } from "../../../context/LocationContext";
import { GOOGLE_MAPS_API_KEY } from "../../../utils/index.js"

// Constants
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

const bannerSliderSettings = {
  dots: false,
  infinite: true,
  speed: 500,
  slidesToShow: 1,
  slidesToScroll: 1,
  autoplay: true,
  autoplaySpeed: 3000,
  arrows: false,
  pauseOnHover: true,
};

const MedicineComparePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { productId, service } = useParams();
  const [pharmacies, setPharmacies] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [pincode, setPincode] = useState("");
  const [checkedPincode, setCheckedPincode] = useState(null);
  const [headerPincode, setHeaderPincode] = useState(null);
  const [loadingVendors, setLoadingVendors] = useState(false);
  const { isMobile } = useResponsive();
  const [fixedTypeSlug, setFixedTypeSlug] = useState(null);
  // Location Context
  const { currentLocation, updateLocation, latitude, longitude } =
    useLocationContext();

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentalModal, setShowRentalModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
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
  const [pagination, setPagination] = useState(null)
  const { profile: userProfile } = useProfile();
  const rightSideTop = banners.filter((b) => b.position === "rightside_Top");
  const rightSideBottom = banners.filter(
    (b) => b.position === "rightside_bottom",
  );

  const { addToCart } = useAddToCart();
  const {
    getCartQuantity: getCartQuantityFromHook,
    incrementItem,
    decrementItem,
  } = useCart();






  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  useEffect(() => {
    if (!productId) {
      toast.error("No product selected");
      navigate(-1);
      return;
    }

    const searchParams = new URLSearchParams(location.search);
    const urlPincode = searchParams.get("pincode");
    const urlServiceSlug = searchParams.get("serviceslug");
    if (urlPincode) {
      syncLocation(urlPincode);
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
          fetchProductData(
            productId,
            "show",
            locationData.pincode,
            true,
            urlServiceSlug,
          );
          return;
        }
      } catch (e) {
        // Error parsing saved location
      }
    }
    setHeaderPincode(null);
    setPincode("");
    setCheckedPincode(null);
    fetchProductData(productId, "show", null, true, urlServiceSlug);
  }, [productId]);

  useEffect(() => {
    const handleLocationChange = (event) => {
      const locationData = event.detail;
      if (locationData?.source === "checkout") {
        return;
      }
      const searchParams = new URLSearchParams(location.search);
      const urlServiceSlug = searchParams.get("serviceslug");
      if (locationData?.pincode && locationData.pincode.length === 6) {
        if (checkedPincode !== locationData.pincode) {
          setPincode(locationData.pincode);
          setCheckedPincode(locationData.pincode);
          setHeaderPincode(locationData.pincode);
          const prodId = product?.tablet?._id || product?._id || productId;
          if (prodId) {
            fetchProductData(
              prodId,
              "show",
              locationData.pincode,
              true,
              urlServiceSlug,

            );
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
  }, [checkedPincode, productId, navigate]);

  const fetchProductData = async (
    prodId,
    type,
    pincodeParam = null,
    showFullPageLoader = true,
    serviceSlug = null,
    pageParam = 1
  ) => {
    if (showFullPageLoader) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem("medicomparestoken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let url = `product/${type}/${prodId}`;
      const params = [];
      if (userProfile?._id || userProfile?.id) {
        params.push(`userId=${userProfile?._id || userProfile?.id}`);
      }
      if (pincodeParam) {
        params.push(`location=${pincodeParam}`);
        if (latitude && longitude) {
          params.push(`lat=${latitude}`);
          params.push(`lng=${longitude}`);
        }
      }
      if (serviceSlug) {
        params.push(`serviceslug=${serviceSlug}`);
      }

      params.push(`type=website`);
      params.push(`positiontype=rightside_Top ,rightside_bottom`);
      params.push(`page=${pageParam}`);
      params.push(`limit=10`);
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await axiosCommonInstance.get(url, {
        headers,
      });

      const apiProduct = response?.data?.data?.product;
      const vendorPagination = response?.data?.data?.vendorPagination;
      setPagination(vendorPagination)
      // console.log("api product", apiProduct);
      let extractedServiceSlug = serviceSlug;
      setFixedTypeSlug(apiProduct?.tablet?.category?.fixedType)
      // console.log("fixed type", apiProduct?.tablet?.category?.fixedType)
      if (
        !extractedServiceSlug &&
        apiProduct?.tablet?.subcategorys?.category?.slug
      ) {
        extractedServiceSlug = apiProduct.tablet.subcategorys.category.slug;
        if (extractedServiceSlug && !serviceSlug) {
          await fetchProductData(
            prodId,
            type,
            pincodeParam,
            showFullPageLoader,
            extractedServiceSlug,
            pageParam
          );
          return;
        }
      }

      if (!apiProduct) {
        if (pincodeParam === null || showFullPageLoader === true) {
          // toast.error("Product not found");
          // navigate(-1);
          setPharmacies([]);
          return;
        } else {
          setPharmacies([]);
          return;
        }
      }

      setProduct(apiProduct);
      let processedBanners = [];
      if (
        response?.data?.data?.banner &&
        Array.isArray(response.data.data.banner)
      ) {
        response.data.data.banner.forEach((b) => {
          if (b.banners && Array.isArray(b.banners)) {
            const nestedBanners = b.banners.map((bn) => ({
              _id: bn._id,
              name: bn.name,
              position: bn.position || b.position,
              files: bn.files || [],
              alt: bn.name || "Banner",
              title: bn.name || "Banner",
            }));
            processedBanners.push(...nestedBanners);
          } else {
            processedBanners.push({
              _id: b._id,
              name: b.name,
              position: b.position,
              files: b.files || [],
              alt: b.name || "Banner",
              title: b.name || "Banner",
            });
          }
        });
      }
      setBanners(processedBanners);
      const variants = apiProduct?.tablet?.variant || [];
      let variantToSelect = selectedVariantId;
      if (!variantToSelect && variants.length > 0) {
        variantToSelect = variants[0]._id;
        setSelectedVariantId(variantToSelect);
      }

      const vendors = apiProduct?.vendors || [];
      const displayVendors = pincodeParam
        ? vendors.filter((v) => v.isavailablepincode === true)
        : vendors;

      setPharmacies(displayVendors);
    } catch (error) {
      toast.error("Failed to load product data");
      navigate(-1);
    } finally {
      if (showFullPageLoader) {
        setLoading(false);
      }
    }
  };

  const handlePageChange = (pageNumber) => {
    const prodId = productId; // Keep the original URL parameter slug
    const searchParams = new URLSearchParams(location.search);
    // Use the route param 'service' (if any) or fallback to search param serviceslug or state slug
    const urlServiceSlug = service || searchParams.get("serviceslug") || product?.tablet?.subcategorys?.category?.slug;
    if (prodId) {
      fetchProductData(
        prodId,
        "show",
        checkedPincode,
        true,
        urlServiceSlug,
        pageNumber
      );
    }
  };

  const handleVariantChange = async (variantId) => {
    if (!product || !variantId) return;

    setLoading(true);
    setSelectedVariantId(variantId);
    try {
      const searchParams = new URLSearchParams(location.search);
      const urlServiceSlug = searchParams.get("serviceslug");
      const prodId = product?.tablet?._id || product?._id;
      if (prodId) {
        await fetchProductData(
          prodId,
          "show",
          checkedPincode,
          true,
          urlServiceSlug,
        );
      }
    } catch (err) {
      setLoading(false);
    }
  };

  const handlePincodeCheck = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const value = (pincode || "").trim();

    if (!value || value.trim() === "") {
      toast.error("Pincode is required");
      return;
    }
    if (value.length < 3 || !/^\d+$/.test(value)) {
      toast.error("Please enter a valid pincode (minimum 3 digits)");
      return;
    }

    const prodId = product?.tablet?._id || product?._id || productId;
    if (!prodId) return;

    try {
      setLoadingVendors(true);
      setCheckedPincode(value);
      syncLocation(value);
      const searchParams = new URLSearchParams(location.search);
      const urlServiceSlug = searchParams.get("serviceslug");
      const startTime = Date.now();
      await fetchProductData(prodId, "details", value, false, urlServiceSlug);
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, 1000 - elapsedTime);
      if (remainingTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingTime));
      }
    } catch (err) {
      toast.error("Failed to check pincode");
    } finally {
      setLoadingVendors(false);
    }
  };

  const handlePartnerClick = (partner) => {
    const vendorId = partner?._id || partner?.businessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      const name =
        partner?.bussinessdetails?.name || partner?.name || "Vendor Store";
      const vendorSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  const getCartQuantity = (vendorId, prodId, variantId) => {
    if (!isLoggedIn) {
      const uiQty = loadUiQuantities();
      const key = variantId
        ? `${vendorId}_${prodId}_${variantId}`
        : `${vendorId}_${prodId}`;
      return uiQty[key] || 0;
    }
    return getCartQuantityFromHook(vendorId, prodId, variantId);
  };

  const loadUiQuantities = () => {
    try {
      const raw = sessionStorage.getItem(UI_QTY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const handleAddToCart = async (
    vendor,
    med,
    variantId,
    matchedVariant,
    discountPrice = null,
  ) => {
    localStorage.setItem("isCart", true);
    const selectedVar = med.variant?.find((v) => v._id === variantId);
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
  };

  const syncLocation = async (pin) => {
    let locationName = "Selected Location";
    let coordinates = null;
    try {
      // const GOOGLE_MAPS_API_KEY = "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?components=postal_code:${pin}|country:IN&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await response.json();
      if (data.status === "OK" && data.results.length > 0) {
        const result = data.results[0];
        locationName = result.formatted_address || "Selected Location";
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
      pincode: pin,
      name: locationName,
      address: `Pincode: ${pin}`,
      addressId: null,
      coordinates: coordinates,
      timestamp: new Date().toISOString(),
    });
  };

  const handleSingleAddToCart = async (vendor, med) => {
    localStorage.setItem("isCart", true);
    const inStock = !!(med?.stock > 0 || vendor?.stock > 0);
    if (!inStock) {
      toast.error("Item is out of stock");
      return;
    }
    const item = {
      tabletdetails: med,
      vendordetails: vendor?.bussinessdetails || vendor,
      variants: [],
      price: med.price || 0,
    };

    const success = await addToCart(item, null, {
      bookingType: "cart",
      type: "normal",
    });
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
    if (currentQty >= maxStock) {
      toast.error("Quantity at maximum stock");
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
    if (currentQty >= maxStock) {
      toast.error("Quantity at maximum stock");
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
    return vendors
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
          const extractedDiscountType =
            found.discountType || null;

          return {
            _id: v._id,
            vendorId: v._id,
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
            isStock: found.isStock ?? v.isStock,
            distanceInKm: v?.bussinessdetails?.distance,
            averageRating: v.averageRating,
            ratingCount: v.ratingCount,
          };
        } else {
          const vendorDiscountPrice =
            v.discountprice || v.discountPrice || null;
          const vendorDiscountType = v.discountType || null;
          return {
            _id: v._id,
            vendorId: v._id,
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
            distanceInKm: v?.bussinessdetails?.distance,
            averageRating: v.averageRating,
            ratingCount: v.ratingCount,
          };
        }
      })
      .filter(Boolean);
  };

  const handleNavigateToBooking = async (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
  ) => {
    await handleGeneralBookingProcess({
      productId: med._id,
      variantId: effectiveVariantId,
      vendorId: vendor._id || vendor.vendorId,
      servicefixedTypes: fixedTypeSlug,
      navigate,
      redirectPath: "/booking-process"
    });
  };

  const handleRentalBookinProcess = async (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
    service
  ) => {
    await handleRentalBookingProcess({
      productId: med._id,
      variantId: effectiveVariantId,
      vendorId: vendor._id || vendor.vendorId,
      perDayRent: vendor?.perDayRent || 0,
      navigate,
      servicefixedTypes: fixedTypeSlug
    });
  };

  const handleAddLead = (vendor, med, variantId, matchedVariant) => {
    if (!isLoggedIn) {
      toast.error("Please login");
      navigate("/login");
      return;
    }

    setCurrentLeadData({ vendor, med, variantId, matchedVariant });
    const today = new Date().toISOString().split("T")[0];
    const fixedType = med?.subcategorys?.category?.fixedType || null;
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
          vendorId: vendor._id,
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
    const fixedType = med?.subcategorys?.category?.fixedType || null;
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

    const today = new Date().toISOString().split("T")[0];
    const fixedType = med?.subcategorys?.category?.fixedType || null;
    setAppointmentFormData({
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
    setShowAppointmentModal(true);
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
    try {
      const token = localStorage.getItem("medicomparestoken");
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

  const productName = product?.tablet?.name || "";
  const storage = product?.tablet?.strength || "";
  const mainCategory = product?.tablet?.subcategorys?.category?.name || "";
  const genericName = product?.tablet?.form || "";
  const isMedicineType =
    product?.tablet?.subcategorys?.category?.fixedType === "medicine";
  const variants = product?.tablet?.variant || [];
  const variants1 = [
    ...new Set(
      product?.tablet?.variant?.map((v) => v.pricePerUnit).filter(Boolean),
    ),
  ];

  const selectedVariant =
    variants.find((v) => v._id === selectedVariantId) || variants[0] || null;

  const renderVendorActions = (vendor, med, index, fullVendor) => {
    const bookingType = vendor.bookingType || vendor.bookingtype || null;

    const basePrice =
      selectedVariantId && vendor?.variant && Array.isArray(vendor.variant)
        ? (() => {
          const vendorVariant = vendor.variant.find(
            (v) =>
              v.variantId === selectedVariantId ||
              v._id === selectedVariantId,
          );
          if (vendorVariant) {
            return vendorVariant.price || 0;
          }
          return vendor?.price || 0;
        })()
        : vendor?.price || selectedVariant?.price || 0;

    const discountPrice =
      selectedVariantId && vendor?.variant && Array.isArray(vendor.variant)
        ? (() => {
          const vendorVariant = vendor.variant.find(
            (v) =>
              v.variantId === selectedVariantId ||
              v._id === selectedVariantId,
          );
          if (vendorVariant) {
            return (
              vendorVariant.discountprice ||
              vendorVariant.discountPrice ||
              null
            );
          }
          return vendor?.discountprice || vendor?.discountPrice || null;
        })()
        : vendor?.discountprice || vendor?.discountPrice || null;

    // Calculate discount price based on discountType
    let calculatedDiscountPrice = discountPrice;
    const discountType = selectedVariantId
      ? (vendor?.matchedVariantDiscountType ?? vendor?.discountType ?? null)
      : (vendor?.discountType ?? vendor?.matchedVariantDiscountType ?? null);

    if (discountType === "percentage" && discountPrice && discountPrice > 0) {
      calculatedDiscountPrice = basePrice - (basePrice * discountPrice / 100);
    }

    const matchedVariant =
      selectedVariantId && vendor?.variant && Array.isArray(vendor.variant)
        ? vendor.variant.find(
          (v) =>
            v.variantId === selectedVariantId || v._id === selectedVariantId,
        )
        : null;

    const stock = selectedVariantId
      ? matchedVariant?.stock ?? vendor?.matchedVariantStock ?? 0
      : vendor?.stock ?? vendor?.matchedStock ?? 0;

    const price =
      calculatedDiscountPrice && calculatedDiscountPrice > 0 ? calculatedDiscountPrice : basePrice;
    const effectivePriceForCart =
      calculatedDiscountPrice && calculatedDiscountPrice > 0 ? calculatedDiscountPrice : null;

    const isStockFalse =
      matchedVariant?.isStock === false ||
      matchedVariant?.isStock === "false" ||
      vendor?.isStock === false ||
      vendor?.isStock === "false" ||
      (matchedVariant ? matchedVariant.isStock === null && stock === 0 : stock === 0);

    const isServiceCategory = false;

    const serviceBookingTypes = [
      "consultation",
      "appointment",
      "ride",
      "rentals",
      "slots",
      "lead",
      "leads",
      "booking",
      "rentals_addtocarts",
      "cart",
    ];
    const isServiceType =
      serviceBookingTypes.includes(bookingType) || isServiceCategory;

    const isInStock = isServiceType || isServiceCategory ? true : stock > 0;

    const effectiveVariantId = selectedVariantId || null;
    const isVariant = !!selectedVariantId;

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
        const variantStock = med.variant?.find(
          (v) => v._id === effectiveVariantId,
        )?.stock;
        maxStock = variantStock !== undefined ? variantStock : 999;
      }
    } else {
      const vendorStock = vendor?.variant?.[0]?.stock;
      maxStock =
        vendorStock !== undefined && vendorStock !== null ? vendorStock : 999;
    }

    return (
      <VendorActions
        bookingType={bookingType}
        isMobile={isMobile}
        isInStock={isInStock}
        isStockFalse={isStockFalse}
        isServiceType={isServiceType}
        med={med}
        vendor={vendor}
        fullVendor={fullVendor}
        effectiveVariantId={effectiveVariantId}
        price={price}
        // stock={stock}
        service={fixedTypeSlug}
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
        handleOpenRideModal=""
        handleAddToCart={handleAddToCart}
        handleSingleAddToCart={handleSingleAddToCart}
        rentAndCartButtonStyles={{
          fontSize: "12px",
          padding: "6px 12px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          border: "none",
          width: "100%"
        }}
        containerStyle={{
          width: "100%",
          display: "flex"
        }}
        buttonStyle={{
          fontSize: "12px",
          padding: "6px 12px",
          borderRadius: "8px",
          background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
          border: "none",
          color: "white",
          width: "100%"
        }}
      />
    );
  };

  if (!product || loading) {
    return (
      <div className="main-wrapper">
        <Home2Header />
        <div
          className="content medicine-compare pt-[100px] pb-10 bg-gradient-to-b from-[#f8f9fa] to-white min-h-[80vh] flex items-center justify-center"
        >
          <div className="text-center">
            <div
              className="spinner-border text-primary w-12 h-12"
              role="status"
            >
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-[#6c757d] text-base">
              Loading product details...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const med = product?.tablet || null;
  const categoryFixedType = med?.category?.fixedType;
  const variantVendors =
    selectedVariantId && med
      ? buildVendorVariants(pharmacies, selectedVariantId)
      : [];
  const fallbackVendors = !variantVendors.length
    ? buildVendorVariants(pharmacies, null)
    : [];
  const vendorsToDisplay =
    variantVendors.length > 0
      ? variantVendors
      : fallbackVendors.length > 0
        ? fallbackVendors
        : pharmacies;

  const tabletFiles = product?.tablet?.files || [];
  const tabletImageUrl = product?.tablet?.imageUrl || [];
  const variantsList = product?.tablet?.variant || [];

  const selectedVariants =
    variantsList.find((v) => v._id === selectedVariantId) || null;

  const resolveImage = (item) => {
    const img =
      item?.files?.[0] ??
      (Array.isArray(item?.imageUrl) ? item.imageUrl[0] : item?.imageUrl);

    if (!img) return "/assets/default.png";

    return getImageUrl(img);
  };

  const imagePath =
    selectedVariants?.files?.length > 0
      ? selectedVariants.files[0]
      : tabletFiles?.length > 0
        ? tabletFiles[0]
        : Array.isArray(tabletImageUrl) && tabletImageUrl.length > 0
          ? tabletImageUrl[0]
          : null;

  return (
    <div className="main-wrapper">
      <Home2Header />
      <CategoryProvider />

      <div
        className="pb-10 bg-gradient-to-b from-[#f8f9fa] to-white"
      >
        <div className="container-fluid pt-2 px-4 pb-1">
          <BackButton />
        </div>
        <div
          className={`container-fluid ${!isMobile ? "mt-[10px]" : ""}`}
        >
          <div className="grid grid-cols-12 gap-4">
            <div className="col-span-12 lg:col-span-8 xl:col-span-9">
              {product?.tablet?.subcategorys?.category && (
                <div
                  className="card shadow-sm mb-4 border-none rounded-[14px] overflow-hidden bg-white shadow-[0_8px_24px_rgba(0,0,0,0.06)]"
                >
                  <div
                    className="p-[20px_22px] flex items-start justify-between gap-5 flex-wrap"
                  >
                    <div
                      className="flex items-start gap-4"
                    >
                      <div
                        className="w-10 h-10 bg-[#efe9ff] rounded-full flex items-center justify-center shrink-0"
                      >
                        <i
                          className="fas fa-location text-[#321961] text-[18px]"
                        ></i>
                      </div>

                      <div>
                        <h6
                          className="text-[15px] font-semibold mb-1 text-[#212529]"
                        >
                          Check Availability
                        </h6>
                        <p
                          className="text-[13px] text-[#6c757d] m-0"
                        >
                          Check availability in your area by entering your
                          pincode.
                        </p>
                      </div>
                    </div>

                    <div
                      className="flex min-w-[280px] flex-1 max-w-[400px]"
                    >
                      <input
                        type="text"
                        className="form-control h-10 text-[14px] !rounded-l-md border border-gray-300 px-3 focus:outline-none focus:ring-1 focus:ring-[#321961] focus:border-[#321961]"
                        placeholder="Enter Pin code"
                        value={pincode}
                        onChange={(e) => {
                          const value = e.target.value;
                          setPincode(value);
                          if (checkedPincode && value !== checkedPincode) {
                            setCheckedPincode(null);
                          }
                        }}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handlePincodeCheck(e);
                          }
                        }}
                        maxLength={6}
                      />

                      <button
                        className="btn bg-[#321961] text-white py-2 px-[18px] !rounded-r-md text-[14px] !font-medium border-none whitespace-nowrap transition-colors duration-200"
                        onClick={handlePincodeCheck}
                        disabled={loadingVendors}
                      >
                        Check
                      </button>
                    </div>
                  </div>

                  <hr
                    className="mx-[22px] border-t border-[#e9ecef]"
                  />

                  <div
                    className="pt-0 px-[22px] pb-5"
                  >
                    <div className="flex flex-wrap items-center gap-y-3">
                      <div className="w-1/4 md:w-[16.666%] lg:w-[8.333%] shrink-0">
                        <img
                          src={
                            imagePath
                              ? getImageUrl(imagePath)
                              : "/assets/default.png"
                          }
                          alt="image"
                          loading="lazy"
                          title={productName}
                          className="rounded-[6px] capitalize h-20 w-20 object-cover border border-[#eee]"
                        />
                      </div>

                      <div className="w-3/4 md:w-[41.666%] lg:w-[33.333%] px-2">
                        <div
                          className="text-[12px] text-[#6c757d]"
                        >
                          Name
                        </div>
                        <div
                          className="text-[14px] font-medium mt-1 text-[#212529]"
                        >
                          {productName}
                        </div>
                      </div>
                      {categoryFixedType === "medicine" && (
                        <div className="w-1/2 md:w-1/4 lg:w-[16.666%] px-2">
                          <div className="text-[12px] text-[#6c757d]">
                            Storage
                          </div>
                          <div
                            className="text-[14px] font-medium mt-1"
                          >
                            {storage}
                          </div>
                        </div>
                      )}
                      {categoryFixedType === "medicine" && (
                        <div className="w-1/2 md:w-[16.666%] lg:w-[16.666%] px-2">
                          <div className="text-[12px] text-[#6c757d]">
                            Form
                          </div>
                          <div
                            className="text-[14px] font-medium mt-1"
                          >
                            {genericName || "Tablet"}
                          </div>
                        </div>
                      )}
                      {variants?.length > 0 && (
                        <div className="w-full md:w-1/3 lg:w-1/4 px-2">
                          <div className="text-[12px] text-[#6c757d]">
                            Select Variant
                          </div>
                          <select
                            className="mt-1 w-full px-3 py-2 border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-[#321961] focus:border-[#321961] text-[14px] h-[38px] rounded-[8px]"
                            value={selectedVariantId || ""}
                            onChange={(e) =>
                              handleVariantChange(e.target.value)
                            }
                            disabled={loading}
                          >
                            {variants.map((variant) => (
                              <option key={variant._id} value={variant._id}>
                                {variant.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div
                className="card shadow-sm border-none rounded-[16px] overflow-hidden bg-white"
              >
                <div className="p-5 relative">
                  {loadingVendors && (
                    <div
                      className="absolute inset-0 bg-white/90 flex items-center justify-center z-10 rounded-[16px]"
                    >
                      <div className="text-center">
                        <div
                          className="spinner-border text-primary w-12 h-12"
                          role="status"
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-[#6c757d]">
                          Loading...
                        </p>
                      </div>
                    </div>
                  )}
                  {loading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary w-12 h-12"
                        role="status"
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <p className="mt-3 text-[#6c757d]">
                        Loading pharmacy prices...
                      </p>
                    </div>
                  ) : !headerPincode && !checkedPincode ? (
                    <div className="text-center py-5">
                      <i
                        className="fas fa-map-marker-alt text-[64px] text-[#dee2e6] mb-4"
                      ></i>
                      <p
                        className="text-[#6c757d] text-base m-0"
                      >
                        Please enter a pincode to see available pharmacies
                      </p>
                      <p
                        className="text-[#adb5bd] text-[14px] mt-2"
                      >
                        Enter your location to find pharmacies that deliver to
                        your area
                      </p>
                    </div>
                  ) : vendorsToDisplay.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vendorsToDisplay.map((pharmacy, index) => {
                        const vendorName =
                          pharmacy?.bussinessdetails?.name || "Pharmacy";
                        const vendorImageUrl =
                          pharmacy?.vendorImage ||
                          (pharmacy?.bussinessdetails?.bussiness_image?.url
                            ? getImageUrl(
                              pharmacy.bussinessdetails.bussiness_image.url.replace(
                                /\s/g,
                                "%20",
                              ),
                            )
                            : null);

                        // Use filtered vendor data (already normalized by buildVendorVariants)
                        const itemPrice =
                          parseFloat(
                            pharmacy?.matchedVariantPrice ||
                            pharmacy?.price ||
                            pharmacy?.matchedPrice ||
                            0,
                          ) || 0;
                        const itemDiscountprice =
                          pharmacy?.matchedVariantDiscountPrice ||
                          pharmacy?.discountprice ||
                          pharmacy?.discountPrice ||
                          null;

                        // Calculate discount price based on discountType
                        let calculatedItemDiscountPrice = itemDiscountprice;
                        const itemDiscountType = selectedVariantId
                          ? (pharmacy?.matchedVariantDiscountType ?? pharmacy?.discountType ?? null)
                          : (pharmacy?.discountType ?? pharmacy?.matchedVariantDiscountType ?? null);

                        if (itemDiscountType === "percentage" && itemDiscountprice && itemDiscountprice > 0) {
                          calculatedItemDiscountPrice = itemPrice - (itemPrice * itemDiscountprice / 100);
                        }

                        const distanceInKm = pharmacy?.distanceInKm || null;

                        const effectivePrice =
                          calculatedItemDiscountPrice &&
                            calculatedItemDiscountPrice > 0 &&
                            !isNaN(calculatedItemDiscountPrice)
                            ? calculatedItemDiscountPrice
                            : itemPrice;

                        let discount = 0;
                        if (
                          calculatedItemDiscountPrice &&
                          calculatedItemDiscountPrice > 0 &&
                          !isNaN(calculatedItemDiscountPrice) &&
                          itemPrice > 0 &&
                          !isNaN(itemPrice) &&
                          calculatedItemDiscountPrice !== itemPrice
                        ) {
                          if (calculatedItemDiscountPrice > itemPrice) {
                            discount = Math.round(
                              ((calculatedItemDiscountPrice - itemPrice) /
                                calculatedItemDiscountPrice) *
                              100,
                            );
                          } else {
                            discount = Math.round(
                              ((itemPrice - calculatedItemDiscountPrice) / itemPrice) *
                              100,
                            );
                          }
                        }

                        if (isNaN(discount) || discount <= 0) {
                          discount = 0;
                        }

                        const hasDiscount = discount > 0;
                        const price = effectivePrice;
                        const originalPrice = itemPrice;

                        const stockForDisplay =
                          pharmacy?.matchedVariantStock ?? pharmacy?.stock ?? 0;

                        const matchedVariantForStock =
                          selectedVariantId && pharmacy?.variant
                            ? pharmacy.variant.find(
                              (v) =>
                                v.variantId === selectedVariantId ||
                                v._id === selectedVariantId,
                            )
                            : null;
                        const isStockFalse =
                          matchedVariantForStock?.isStock === false ||
                          matchedVariantForStock?.isStock === "false" ||
                          pharmacy?.isStock === false ||
                          pharmacy?.isStock === "false" ||
                          (matchedVariantForStock ? matchedVariantForStock.isStock === null && stockForDisplay === 0 : stockForDisplay === 0);

                        const serviceBookingTypesForDisplay = [
                          "consultation",
                          "appointment",
                          "ride",
                          "rentals",
                          "slots",
                          "lead",
                          "leads",
                          "booking",
                          "rentals_addtocarts",
                          "cart",
                        ];
                        const isServiceTypeForDisplay =
                          serviceBookingTypesForDisplay.includes(
                            pharmacy.bookingType || pharmacy.bookingtype,
                          );
                        const isInStockForDisplay = isServiceTypeForDisplay ? true : stockForDisplay > 0;

                        // Get the full vendor object from pharmacies array to access all vendor properties
                        const fullVendor =
                          pharmacies.find(
                            (av) =>
                              av._id === pharmacy.vendorId ||
                              av._id === pharmacy._id,
                          ) || pharmacy;

                        return (
                          <div
                            key={pharmacy._id || index}
                            className="w-full"
                          >
                            <div
                              className="card vendor-compact-card mb-0 rounded-[12px] bg-white p-4 transition-all duration-300 ease-in-out shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:-translate-y-[3px] hover:shadow-[0_4px_15px_rgba(0,0,0,0.12)] h-full relative border border-[#e0e0e0]"
                            >
                              <div
                                className="flex flex-col gap-3"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-[70px] h-[70px] rounded-[10px] overflow-hidden bg-[#f8f9fa] flex items-center justify-center shrink-0 border-2 border-[#e0e0e0] shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                                  >
                                    {vendorImageUrl ? (
                                      <img
                                        src={vendorImageUrl}
                                        alt={vendorName}
                                        onClick={() =>
                                          handlePartnerClick(pharmacy)
                                        }
                                        loading="lazy"
                                        className="w-full h-full object-contain cursor-pointer"
                                        onError={(e) => {
                                          e.target.src = "/medicine.jpg";
                                        }}
                                      />
                                    ) : (
                                      <div
                                        className="w-full h-full bg-gradient-to-br from-[#321961] to-[#6a1fd9] text-white flex items-center justify-center font-bold text-[18px]"
                                      >
                                        {vendorName
                                          .substring(0, 2)
                                          .toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h6
                                      className="text-[15px] font-semibold text-[#212529] mb-1 leading-[1.3] break-words overflow-hidden cursor-pointer line-clamp-1"
                                      onClick={() =>
                                        handlePartnerClick(pharmacy)
                                      }
                                    >
                                      {vendorName}
                                    </h6>
                                    {pharmacy.averageRating > 0 && pharmacy.ratingCount > 0 && (
                                      <div
                                        className="flex items-center gap-1 text-[11px] text-[#666] mt-1 mb-2"
                                      >
                                        <i
                                          className="fas fa-star text-[#ffc107] text-[10px]"
                                        ></i>
                                        <span className="font-medium">
                                          {pharmacy.averageRating.toFixed(1)}
                                        </span>
                                        <span className="text-[#999]">
                                          ({pharmacy.ratingCount}+)
                                        </span>
                                      </div>
                                    )}
                                    <p
                                      className="text-[13px] text-[#6c757d] m-0"
                                    >
                                      <i
                                        className="fas fa-map-marker-alt mr-1 text-[#321961]"
                                      ></i>
                                      {pharmacy?.bussinessdetails?.address
                                        ? pharmacy.bussinessdetails.address
                                          .length > 40
                                          ? pharmacy.bussinessdetails.address.substring(
                                            0,
                                            40,
                                          ) + "..."
                                          : pharmacy.bussinessdetails.address
                                        : "Location not available"}
                                    </p>
                                    {distanceInKm && (
                                      <div
                                        className="flex items-center gap-1"
                                      >
                                        <i
                                          className="fas fa-map-marker-alt text-[10px]"
                                        ></i>
                                        <span
                                          className="text-[10px] font-semibold font-['Poppins']"
                                        >
                                          {distanceInKm.toFixed(1)} km away
                                        </span>
                                      </div>
                                    )}
                                    {(() => {
                                      const estimatedDelivery =
                                        fullVendor?.currentdeliverypincodes
                                          ?.estimateddelivery ||
                                        fullVendor?.deliverypincodess?.[0]
                                          ?.estimateddelivery ||
                                        null;
                                      {
                                        [
                                          "medicine",
                                          "medicalequipment",
                                        ].includes(categoryFixedType) &&
                                          estimatedDelivery && (
                                            <p
                                              className="text-[12px] text-[#321961] mt-1 font-semibold"
                                            >
                                              <i
                                                className="fas fa-truck mr-1 text-[10px]"
                                              ></i>
                                              {estimatedDelivery}
                                            </p>
                                          );
                                      }

                                      return null;
                                    })()}
                                  </div>
                                </div>

                                <div className="flex flex-col gap-3 mt-2">
                                  <div>
                                    <div>
                                      <div
                                        className="flex items-center gap-2 flex-wrap"
                                      >
                                        <div
                                          className="text-[18px] font-semibold text-[#212529] leading-[1.2]"
                                        >
                                          ₹{price.toFixed(2)}
                                        </div>

                                        {hasDiscount && discount > 0 && (
                                          <>
                                            <div
                                              className="text-[14px] text-[#6c757d] line-through"
                                            >
                                              ₹{originalPrice.toFixed(2)}
                                            </div>

                                            <span
                                              className="text-[12px] font-bold text-green-600"
                                            >
                                              {itemDiscountType === "percentage" && itemDiscountprice ? `${itemDiscountprice}% off` : `${discount}% off`}
                                            </span>
                                          </>
                                        )}
                                      </div>
                                      <div
                                        className="flex flex-wrap gap-2 mt-1.5"
                                      >
                                        {fullVendor?.serviceCharges && (
                                          <div
                                            className="text-[11px] font-semibold text-[#495057] bg-[#f8f9fa] py-0.5 px-1.5 rounded whitespace-nowrap"
                                          >
                                            Service Fee: ₹
                                            {fullVendor.serviceCharges}
                                          </div>
                                        )}
                                        {fullVendor?.fixedDeposit && (
                                          <div
                                            className="text-[11px] font-semibold text-[#495057] bg-[#f8f9fa] py-0.5 px-1.5 rounded whitespace-nowrap"
                                          >
                                            Security Deposit: ₹
                                            {fullVendor.fixedDeposit}
                                          </div>
                                        )}
                                        {fullVendor?.returnCharge && (
                                          <div
                                            className="text-[11px] font-semibold font-['Poppins'] whitespace-nowrap"
                                          >
                                            Return Charge: ₹
                                            {fullVendor.returnCharge}
                                          </div>
                                        )}
                                        {fullVendor?.perDayRent && (
                                          <div
                                            className="text-[11px] font-semibold bg-[#f8f9fa] py-0.5 px-1.5 rounded whitespace-nowrap text-[#321961]"
                                          >
                                            <i className="fas fa-calendar-day mr-0.5 text-[8px]"></i>
                                            Per Day Rent: ₹{Number(fullVendor?.perDayRent || 0).toFixed(2)}
                                          </div>
                                        )}
                                      </div>

                                      {selectedVariant?.pricePerUnit && (
                                        <div
                                          className="text-[12px] text-[#495057] mt-1"
                                        >
                                          {selectedVariant.pricePerUnit}
                                        </div>
                                      )}
                                    </div>
                                    {/* {!isInStockForDisplay && (
                                      <div
                                        style={{
                                          fontSize: "12px",
                                          color: "#dc3545",
                                          marginTop: "4px",
                                          fontWeight: "500",
                                        }}
                                      >
                                        unavailable
                                      </div>
                                    )} */}
                                  </div>
                                  <div style={{ width: "100%" }}>
                                    {renderVendorActions(
                                      pharmacy,
                                      product.tablet,
                                      index,
                                      fullVendor
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}



                      {pagination && pagination.pages > 0 && (
                        <Pagination
                          page={pagination.page}
                          totalPages={pagination.pages}
                          onPageChange={handlePageChange}
                        />
                      )}
                    </div>

                  ) : (
                    <div className="text-center py-5">
                      <i
                        className="fas fa-inbox"
                        style={{
                          fontSize: "64px",
                          color: "#dee2e6",
                          marginBottom: "16px",
                        }}
                      ></i>
                      <p
                        style={{
                          color: "#6c757d",
                          fontSize: "16px",
                          margin: 0,
                        }}
                      >
                        No services available at this moment
                      </p>
                      <p
                        style={{
                          color: "#adb5bd",
                          fontSize: "14px",
                          marginTop: "8px",
                        }}
                      >
                        Please try again later or check back soon
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-span-12 lg:col-span-4 xl:col-span-3">
              <StickyBox offsetTop={120} offsetBottom={20}>
                <div>
                  {(!rightSideTop || rightSideTop.length === 0) &&
                    (!rightSideBottom || rightSideBottom.length === 0) && (
                      <div className="bg-white rounded-[14px] overflow-hidden max-w-[420px] sm:max-w-full shadow-[0_8px_24px_rgba(0,0,0,0.06)] mb-3">
                        <div className="bg-[#eef6ff] p-3.5 text-center">
                          <h5 className="text-base font-semibold m-0">Why Compare?</h5>
                        </div>
                        <div className="p-[18px]">
                          <div className="flex gap-3.5 items-start mb-4">
                            <div className="w-10 h-10 bg-[#f3efff] rounded-[10px] flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-shield-halved text-[18px] text-[#321961]" />
                            </div>
                            <div>
                              <h6 className="text-[14px] font-semibold mb-0.5">Verified Pharmacies</h6>
                              <p className="text-[13px] text-[#6c757d] m-0">
                                All listed pharmacies are verified and licensed
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3.5 items-start mb-4">
                            <div className="w-10 h-10 bg-[#f3efff] rounded-[10px] flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-tags text-[18px] text-[#321961]" />
                            </div>
                            <div>
                              <h6 className="text-[14px] font-semibold mb-0.5">Best Price Guarantee</h6>
                              <p className="text-[13px] text-[#6c757d] m-0">Save up to 30% by comparing prices</p>
                            </div>
                          </div>
                          <div className="flex gap-3.5 items-start mb-4">
                            <div className="w-10 h-10 bg-[#f3efff] rounded-[10px] flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-bolt text-[18px] text-[#321961]" />
                            </div>
                            <div>
                              <h6 className="text-[14px] font-semibold mb-0.5">Quick Comparison</h6>
                              <p className="text-[13px] text-[#6c757d] m-0">
                                Compare prices from multiple sources instantly
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3.5 items-start last:mb-0">
                            <div className="w-10 h-10 bg-[#f3efff] rounded-[10px] flex items-center justify-center shrink-0">
                              <i className="fa-solid fa-box text-[18px] text-[#321961]" />
                            </div>
                            <div>
                              <h6 className="text-[14px] font-semibold mb-0.5">Reliable Delivery</h6>
                              <p className="text-[13px] text-[#6c757d] m-0">Fast and secure delivery to your doorstep</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                  <div className="text-center">
                    <div className="d-lg-block d-none">
                      {/* Right Side Top Banners */}
                      <div
                        className="text-center mb-4"
                      >
                        <Slider
                          {...{
                            ...bannerSliderSettings,
                            infinite: rightSideTop.length > 1,
                            autoplay: rightSideTop.length > 1,
                          }}
                        >
                          {rightSideTop.length > 0 ? (
                            rightSideTop.map((banner, index) => {
                              const imageUrl =
                                banner.files && banner.files.length > 0
                                  ? banner.files[0]
                                  : banner.src ||
                                  banner.image ||
                                  banner.url ||
                                  banner.bannerImage;
                              return (
                                <div key={banner._id || index}>
                                  <img
                                    src={
                                      imageUrl ||
                                      "/assets/img/surgeriesShort.png"
                                    }
                                    alt={
                                      banner.alt ||
                                      banner.title ||
                                      banner.name ||
                                      "Banner"
                                    }
                                    loading="lazy"
                                    className={`img-fluid rounded w-full h-[165px] object-cover ${index < rightSideTop.length - 1
                                      ? "mb-4"
                                      : "mb-0"
                                      }`}
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <div>
                              <img
                                src="/assets/img/surgeriesShort.png"
                                alt="Default Banner"
                                className="img-fluid rounded w-full h-[165px] object-cover"
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
                            rightSideBottom.map((banner, index) => {
                              const imageUrl =
                                banner.files && banner.files.length > 0
                                  ? banner.files[0]
                                  : banner.src ||
                                  banner.image ||
                                  banner.url ||
                                  banner.bannerImage;
                              return (
                                <div key={banner._id || index}>
                                  <img
                                    src={
                                      imageUrl || "/assets/img/longSugery.png"
                                    }
                                    alt={
                                      banner.alt ||
                                      banner.title ||
                                      banner.name ||
                                      "Banner"
                                    }
                                    loading="lazy"
                                    className={`img-fluid rounded w-full h-[165px] object-cover ${index < rightSideBottom.length - 1
                                      ? "mb-4"
                                      : "mb-0"
                                      }`}
                                  />
                                </div>
                              );
                            })
                          ) : (
                            <div>
                              <img
                                src="/assets/img/longSugery.png"
                                alt="Default Banner"
                                className="img-fluid rounded w-full h-[165px] object-cover"
                              />
                            </div>
                          )}
                        </Slider>
                      </div>
                    </div>
                  </div>
                </div>
              </StickyBox>
            </div>
          </div>
        </div>
      </div>

      {/* Lead Modal */}
      <LeadModal
        show={showLeadModal}
        onClose={() => {
          setShowLeadModal(false);
          setLeadFormData(INITIAL_LEAD_FORM);
          setCurrentLeadData(null);
        }}
        formData={leadFormData}
        onChange={(e) =>
          setLeadFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
        }
        onSubmit={handleSubmitLead}
        productId={currentLeadData?.med?._id || currentLeadData?.med?.id}
        vendorId={
          currentLeadData?.vendor?.vendorId || currentLeadData?.vendor?._id
        }
        variantId={currentLeadData?.variantId || null}
        fixedType={leadFormData.fixedType}
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
              med: null,
              vendor: null,
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
          fixedType={currentModalData.fixedType || "pharmacy"}
        />
      )}

      {/* Consultation Modal */}
      {currentModalData && (
        <ConsultationModal
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
          fixedType={currentModalData.fixedType}
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
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          formType="appointment"
          title="Book an Appointment"
        />
      )}

      <Footer />
    </div>
  );
};

export default MedicineComparePage;
