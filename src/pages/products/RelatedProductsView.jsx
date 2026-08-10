import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useLocation, Link } from "react-router-dom";
import Slider from "react-slick";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../Apiservice.jsx";
import {
  getImageUrl,
  getDisplayPrice,
  getVendorPrice,
  createShareHandler,
} from "../../utils/index";
import toast from "react-hot-toast";
import Home2Header from "../../components/layout/Header-k";
import Footer from "../../components/layout/Footer-f";
import CategoryProvider from "../../components/ui/CategoryProvider.jsx";
import StickyBox from "react-sticky-box";
import { ShareModal } from "../../components/products";
import ProductCard from "../../components/products/ProductCard.jsx";
import { useAddToCart } from "../../hooks/useAddToCart.js";
import { useCart } from "../../hooks/useCart.js";
import { BackButton, Pagination } from "../../components/ui/index.js";
import LeadModal from "../../components/modals/LeadModal.jsx";
import RentModal from "../../components/modals/RentModal.jsx";
import ConsultationModal from "../../components/modals/ConsultationModal.jsx";
import { useResponsive } from "../../hooks/index.js";
import AppointmentModal from "../../components/modals/AppointmentModal.jsx";
import { useProfile } from "../../context/ProfileContext.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../services/bookingService.js";
import { useLocation as useLocationContext } from "../../context/LocationContext.jsx";
import { GOOGLE_MAPS_API_KEY } from "../../utils/index";

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

const RelatedProductsView = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { slug, service } = useParams();
  const productId = slug;
  const [pharmacies, setPharmacies] = useState([]);
  const [banners, setBanners] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState(null);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [loadingVendors, setLoadingVendors] = useState(false);
  const { isMobile } = useResponsive();
  const [fixedTypeSlug, setFixedTypeSlug] = useState(null);

  // Location Context
  const { currentLocation, selectedPincode, updateLocation, latitude, longitude } =
    useLocationContext();
  const checkedPincodeRef = useRef(null);

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
  const [pagination, setPagination] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLoading, setPageLoading] = useState(false);
  const [isFull, setIsFull] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState({});
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProductData, setShareProductData] = useState(null);
  const { profile: userProfile } = useProfile();

  const { addToCart } = useAddToCart();
  const {
    getCartQuantity: getCartQuantityFromHook,
    incrementItem,
    decrementItem,
  } = useCart();

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  // On mount: fetch once using pincode from global context (no manual localStorage reads)
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
      navigate(`${location.pathname}${newSearch ? `?${newSearch}` : ""}`, { replace: true });
    }

    const pinFromContext = urlPincode || selectedPincode || null;
    checkedPincodeRef.current = pinFromContext;
    fetchProductData(productId, "show", pinFromContext, true, service || urlServiceSlug);
  }, [productId]);

  // Re-fetch when global location changes
  useEffect(() => {
    if (!productId) return;
    const prevPin = checkedPincodeRef.current;
    if (selectedPincode && selectedPincode !== prevPin) {
      checkedPincodeRef.current = selectedPincode;
      const searchParams = new URLSearchParams(location.search);
      const urlServiceSlug = searchParams.get("serviceslug");
      const prodId = product?.tablet?._id || product?._id || productId;
      fetchProductData(prodId, "show", selectedPincode, true, service || urlServiceSlug);
    }
  }, [selectedPincode]);

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
    } else {
      setPageLoading(true);
    }
    try {
      const token = localStorage.getItem("medicomparestoken");
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      let url = type === "show" ? `product/subcategory/show/${slug}` : `product/${type}/${prodId}`;
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
        params.push(`pincode=${pincodeParam}`);
      }
      if (serviceSlug) {
        params.push(`serviceslug=${serviceSlug}`);
      }

      params.push(`type=website`);
      params.push(`positiontype=rightside_Top ,rightside_bottom`);
      params.push(`page=${pageParam}`);
      params.push(`limit=20`);
      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const response = await axiosCommonInstance.get(url, {
        headers,
      });

      const apiProductList = response?.data?.data?.products || [];
      setAllProducts(apiProductList);
      let apiProduct = response?.data?.data?.product;
      if (!apiProduct && apiProductList.length > 0) {
        apiProduct = apiProductList[0];
      }
      const apiPagination = response?.data?.data?.pagination || response?.data?.data?.vendorPagination;
      setPagination(apiPagination);
      if (apiPagination?.currentPage) {
        setCurrentPage(apiPagination.currentPage);
      }
      setFixedTypeSlug(apiProduct?.tablet?.category?.fixedType)

      if (!apiProduct) {
        setPharmacies([]);
        return;
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
      const initialVariants = {};
      apiProductList.forEach((p) => {
        if (p.tablet?.variant?.length > 0) {
          initialVariants[p.tablet._id] = p.tablet.variant[0]._id;
        }
      });
      setSelectedVariants((prev) => ({ ...prev, ...initialVariants }));

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
      } else {
        setPageLoading(false);
      }
    }
  };

  const handlePageChange = (pageNumber) => {
    const prodId = productId;
    const searchParams = new URLSearchParams(location.search);
    const urlServiceSlug = service || searchParams.get("serviceslug") || product?.tablet?.subcategorys?.category?.slug;
    setCurrentPage(pageNumber);
    if (prodId) {
      fetchProductData(
        prodId,
        "show",
        selectedPincode || null,
        false,
        urlServiceSlug,
        pageNumber
      );
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

  const handleToggleFavourite = async (itemId) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to manage favourites");
      navigate("/login");
      return;
    }

    const item = allProducts.find((p) => p?.tablet?._id === itemId);
    if (!item) return;

    const newStatus = !item?.tablet?.isFavorite;

    setAllProducts((prev) =>
      prev.map((p) =>
        p?.tablet?._id === itemId
          ? { ...p, tablet: { ...p.tablet, isFavorite: newStatus } }
          : p,
      ),
    );

    try {
      const endpoint = newStatus ? "favourite/add" : "favourite/remove";
      await axiosUserInstance.post(
        endpoint,
        { productId: itemId }
      );
      toast.success(newStatus ? "Added to favourites" : "Removed from favourites");
    } catch (err) {
      setAllProducts((prev) =>
        prev.map((p) =>
          p?.tablet?._id === itemId
            ? { ...p, tablet: { ...p.tablet, isFavorite: !newStatus } }
            : p,
        ),
      );
      toast.error("Failed to update favourites");
    }
  };

  const getQuantityForVariant = (tablet, vendor) => {
    if (!vendor) return 0;
    const variantId = selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
    return getCartQuantity(vendor._id || vendor.vendorId, tablet._id, variantId);
  };

  const handleRide = async (vendor, tablet) => {
    toast.success("Added to ride");
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
      });
      setCurrentModalData(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to book appointment");
    }
  };



  if (allProducts.length === 0 || loading) {
    return (
      <div className="flex flex-col min-h-screen bg-white">
        <Home2Header />
        <div className="flex-1 flex items-center justify-center pt-[100px] pb-10 bg-gradient-to-b from-gray-50 to-white min-h-[80vh]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#321961] border-t-transparent rounded-full animate-spin inline-block" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-3 text-gray-500 text-base font-medium">
              Loading product details...
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Home2Header />
      <CategoryProvider />

      {/* Header section from vendor profile */}
      <div className="relative w-full overflow-hidden bg-gray-50" style={{ minHeight: "120px" }}>
        <img
          src="/assets/Medicompares Background.png"
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-5 flex flex-wrap items-center justify-between min-h-[120px]">
          <BackButton className="!rounded-full !bg-white/90 border border-[#321961]/30 !text-[#321961] hover:!bg-[#321961] hover:!text-white shadow-sm" />

          <div className="hidden lg:flex items-center gap-4 relative pr-12">
            <div className="relative h-[120px] w-[140px]">
              <img
                src="/assets/doctors.png"
                alt="Doctors"
                className="h-[120px] absolute bottom-0 left-0 object-contain"
              />
            </div>
            <h2 className="text-gray-900 text-[24px] font-bold leading-tight">
              Trusted Excellence <br /> in Healthcare
            </h2>
          </div>
        </div>
      </div>

      <div className="pt-5 pb-10 bg-gradient-to-b from-gray-50 to-white flex-1">
        <div className={`max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 ${!isMobile ? "mt-[50px]" : ""}`}>
          <div className="flex flex-wrap -mx-2">
            <div className="w-full px-2 relative">
              {pageLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-50 flex items-center justify-center min-h-[300px] rounded-xl">
                  <div className="w-10 h-10 border-4 border-[#321961] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}

              {/* Renders exactly 5 columns on desktop grid layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
                {allProducts?.length > 0 ? (
                  allProducts.map((productItem, index) => {
                    const tablet = productItem?.tablet;
                    if (!tablet?._id) return null;

                    return (
                      <ProductCard
                        key={`${tablet._id}-${index}`}
                        product={productItem}
                        index={index}
                        isFull={false}
                        service={service || "medicine"}
                        id={slug}
                        navigate={navigate}
                        selectedVariants={selectedVariants}
                        expandedVendors={expandedVendors}
                        isSidebarOpen={false}
                        rentAndCartButtonStyles={{
                          fontSize: "10px",
                          padding: "3px 5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          minWidth: "90px",
                          width: "100%"
                        }}
                        contailerStyles={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "0px 5px",
                          minWidth: "100px",
                          width: "100%",
                          gap: "3px"
                        }}
                        individualStyleForCart={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "2px 10px",
                          minWidth: "100px",
                          width: "100%",
                          gap: "4px",
                          borderRadius: "50px",
                          border: "1px solid #321961",
                          background: "#fdfaff",
                          boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)"
                        }}
                        onToggleExpand={(productId) => {
                          setExpandedVendors((prev) => ({
                            ...prev,
                            [productId]: !prev[productId],
                          }));
                        }}
                        onToggleFavourite={handleToggleFavourite}
                        onShare={(prod) => {
                          setShareProductData(prod);
                          setShowShareModal(true);
                        }}
                        onVendorAction={(action, vendor, tablet, bookingType, servicePassed) => {
                          const variantId = selectedVariants[tablet._id] || (tablet.variant && tablet.variant[0]?._id);
                          const selectedVar = tablet.variant?.find((v) => v._id === variantId);
                          const maxStock = selectedVar?.stock || tablet.stock || 999;
                          const price = getVendorPrice(vendor, tablet, selectedVariants) || tablet.price || 0;
                          const stock = selectedVar?.stock || tablet.stock || 0;

                          if (action === "lead") {
                            handleAddLead(vendor, tablet, variantId, selectedVar);
                          } else if (action === "booking") {
                            if (bookingType === "booking") {
                              handleNavigateToBooking(vendor, tablet, variantId, price, stock);
                            } else if (bookingType === "rent") {
                              handleRentalBookinProcess(vendor, tablet, variantId, price, stock, servicePassed);
                            } else if (bookingType === "consultation") {
                              handleOpenConsultationModal(vendor, tablet, variantId, price, stock);
                            } else if (bookingType === "appointment") {
                              handleOpenAppointmentModal(vendor, tablet, variantId, price, stock);
                            }
                          } else if (action === "ride") {
                            handleRide(vendor, tablet);
                          } else if (action === "add") {
                            if (variantId) {
                              handleAddToCart(vendor, tablet, variantId);
                            } else {
                              handleSingleAddToCart(vendor, tablet);
                            }
                          } else if (action === "increase") {
                            if (variantId) {
                              handleIncrement(bookingType, vendor._id || vendor.vendorId, tablet._id, variantId, maxStock, vendor, selectedVar);
                            } else {
                              handleSingleIncrement(vendor._id || vendor.vendorId, tablet._id, maxStock);
                            }
                          } else if (action === "decrease") {
                            if (variantId) {
                              handleDecrement(bookingType, vendor._id || vendor.vendorId, tablet._id, variantId, vendor, selectedVar);
                            } else {
                              handleSingleDecrement(vendor._id || vendor.vendorId, tablet._id);
                            }
                          }
                        }}
                        getDisplayPrice={(prod) => getDisplayPrice(prod, selectedVariants)}
                        getVendorPrice={(v, t) => getVendorPrice(v, t, selectedVariants)}
                        getQuantityForVariant={getQuantityForVariant}
                        selectedVendors={selectedVariants}
                        categoryName={product?.tablet?.subcategorys?.name || "Related Products"}
                        priceRange={[1, 1000000]}
                        onSelectVariant={(variantId, tablet) => {
                          setSelectedVariants((prev) => ({
                            ...prev,
                            [tablet._id]: variantId,
                          }));
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-10">
                    <p className="text-gray-500 text-[18px] font-semibold">No products found</p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {pagination?.totalPages > 1 && (
                <div className="mt-6 mb-4">
                  <Pagination
                    page={currentPage}
                    totalPages={pagination.totalPages}
                    onPageChange={(pageNum) => {
                      setCurrentPage(pageNum);
                      handlePageChange(pageNum);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <ShareModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareProductData(null);
        }}
        product={shareProductData}
        selectedVariants={selectedVariants}
        serviceType={service}
      />

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
        vendorId={currentLeadData?.vendor?.vendorId || currentLeadData?.vendor?._id}
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
            });
            setCurrentModalData(null);
          }}
          rentProduct={{
            tabletdetails: currentModalData.med,
            vendordetails: currentModalData.vendor?.bussinessdetails || currentModalData.vendor,
            price: currentModalData.price,
          }}
          formData={rentalFormData}
          onFormChange={handleRentalFormChange}
          onSubmit={handleRentalSubmit}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={currentModalData.vendor?.vendorId || currentModalData.vendor?._id}
          variantId={currentModalData.effectiveVariantId}
          fixedType={currentModalData.fixedType}
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
          vendorId={currentModalData.vendor?.vendorId || currentModalData.vendor?._id}
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
          onSubmit={handleAppointmentSubmit}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={currentModalData.vendor?.vendorId || currentModalData.vendor?._id}
          variantId={currentModalData.effectiveVariantId}
          formType="appointment"
          title="Book an Appointment"
        />
      )}
    </div>
  );
};

export default RelatedProductsView;
