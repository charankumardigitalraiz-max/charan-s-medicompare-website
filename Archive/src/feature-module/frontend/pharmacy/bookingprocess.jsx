import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import LocationOffcanvas from "../../../components/home/LocationOffCanvas.jsx";
import {
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import { openRazorpayCheckout } from "../../../utils/razorpayUtils";
import { useResponsive } from "../../../hooks";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import { useProfile } from "../../../context/ProfileContext";
import { Offcanvas } from "../../../components/ui/Offcanvas";
import VendorCalendarSlotPicker from "../../../components/VendorCalendarSlotPicker";
import Select from "react-select";
import {
  getReferredDoctorSelectOptions,
  handleReferredDoctorInputChange,
  handleReferredDoctorSelectChange,
  referredDoctorSelectComponents,
} from "./referredDoctorSelectUtils";
import { fetchDoctorsList } from "../../../services/doctorService";
import { fetchFamilyMembersList } from "../../../services/familyMemberService";
import { useLocation } from "../../../context/LocationContext";
import LeadModal from "./products-components/LeadModal.jsx";
import BaseModal from "../../../components/ui/BaseModal.jsx";
import RecentlyViewedProducts from "../../../components/ui/RecentlyViewedProducts.jsx";
import CouponOffersModal from "../../../components/ui/CouponOffersModal.jsx";

import { Calendar, Clock, Check } from "react-feather";

// NOTE: "./bookingprocess.css" import removed — its rules (.meq-arrow-btn,
// .top-vendor-badge, .choice-cards-container/.choice-card etc, .scroll-container,
// .offers-modal-*) are referenced by className below and should now live as
// Tailwind utilities co-located on the elements themselves. If any of those
// classNames are still relied on elsewhere, keep the stylesheet import.

const TOKEN_STORAGE_KEY = "medicomparestoken";
const SUPPORT_WHATSAPP_NUMBER = "919010357778";
const PRIMARY_COLOR = "#8059ca";
const PRIMARY_SECTION_BG = "#f8f4ff";

// react-select is styled through its own `styles` prop API (JS objects, not
// DOM style/className), so this cannot be expressed as Tailwind classes —
// left as-is since it's how the library itself expects to be themed.
const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#8059ca" : "#e9ecef",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(128, 89, 202, 0.15)" : null,
    "&:hover": {
      borderColor: "#8059ca"
    },
    borderRadius: "8px",
    padding: "2px 6px",
    fontSize: "14px",
    fontFamily: "inherit",
    minHeight: "42px",
    cursor: "pointer"
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "#8059ca"
      : state.isFocused
        ? "#f3effa"
        : "#fff",
    color: state.isSelected ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "14px",
    padding: "10px 14px",
    "&:active": {
      backgroundColor: "#8059ca"
    }
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "#aaa",
    fontSize: "12px"
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "#333",
    fontSize: "14px"
  })
};

const VENDOR_LOCATION_SERVICES = [
  "dentalservice",
  "medicaltreatment",
  "nursingcare",
  "diagnostics"
];

const BookingProcess = () => {
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [data, setData] = useState({});
  const [cart, setCart] = useState({});
  const [releventBookings, setReleventBookings] = useState([]);
  const [vendorTimings, setVendorTimings] = useState({});
  const [showLocationOffcanvas, setShowLocationOffcanvas] = useState(false);
  const [offcanvasPosition, setOffcanvasPosition] = useState("right");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const { profile: userProfile } = useProfile();
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [slotCalendarDays, setSlotCalendarDays] = useState([]);
  const [slotCalendarMonth, setSlotCalendarMonth] = useState(new Date().getMonth() + 1);
  const [slotCalendarYear, setSlotCalendarYear] = useState(new Date().getFullYear());
  const [slotTimingsLoading, setSlotTimingsLoading] = useState(false);
  const {
    currentLocation,
    isLocationUpdating,
    selectedPincode,
    latitude,
    longitude,
  } = useLocation();
  // Lead modal state
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [leadFormData, setLeadFormData] = useState({ name: "", mobile: "", email: "", address: "", policyNumber: "", relation: "self", date: "" });
  const [currentLeadData, setCurrentLeadData] = useState(null);

  const [showOffersModal, setShowOffersModal] = useState(false);
  const [couponList, setCouponList] = useState([]);
  const [personType, setPersonType] = useState("self");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [doctorName, setDoctorName] = useState("");
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    const resolvedService = servicePassed || med?.subcategoryDetails?.categoryDetails?.fixedType || med?.subcategorys?.category?.fixedType || med?.category?.fixedType || med?.fixedType;
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id,
      variantId: effectiveVariantId || null,
      vendorId: vendor?.vendorId || vendor?._id,
      servicefixedTypes: resolvedService,
      navigate,
      redirectPath: path || "/booking-process",
    });
  };

  const handleRentalBookinProcess = async (vendor, med, effectiveVariantId, price, stock, servicePassed) => {
    const resolvedService = servicePassed || med?.subcategoryDetails?.categoryDetails?.fixedType || med?.subcategorys?.category?.fixedType || med?.category?.fixedType || med?.fixedType;
    await handleRentalBookingProcess({
      productId: med?._id || med?.id,
      variantId: effectiveVariantId || null,
      vendorId: vendor?.vendorId || vendor?._id,
      perDayRent: vendor?.perDayRent || 0,
      navigate,
      servicefixedTypes: resolvedService,
    });
  };

  const handleAddLead = (vendor, med) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to submit an enquiry");
      navigate("/login");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    setCurrentLeadData({ vendor, med });
    setLeadFormData({
      name: userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "",
      mobile: userProfile?.phone || "",
      email: userProfile?.email || "",
      address: "",
      policyNumber: "",
      relation: "self",
      date: today,
    });
    setShowLeadModal(true);
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!currentLeadData?.med) return;
    const { vendor, med } = currentLeadData;
    try {
      const token = localStorage.getItem("medicomparestoken");
      await axiosUserInstance.post(
        "lead/create",
        {
          name: leadFormData.name,
          email: leadFormData.email || "",
          phone: leadFormData.mobile,
          address: leadFormData.address,
          policyNumber: leadFormData.policyNumber,
          relation: leadFormData.relation,
          productId: med?._id || med?.id,
          vendorId: vendor?.bussinessdetails?.vendorId || vendor?.vendorId || vendor?._id,
          leadSource: "Website",
          leadStage: "New",
          status: "active",
        },
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
      );
      toast.success("Enquiry submitted successfully!");
      setShowLeadModal(false);
      setLeadFormData({ name: "", mobile: "", email: "", address: "", policyNumber: "", relation: "self", date: "" });
      setCurrentLeadData(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to submit enquiry");
    }
  };

  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const doctorSearchRequestRef = useRef(0);
  const [serviceDetails, setServiceDetails] = useState({ visitType: "", homeVisitFee: "", urgentSurcharge: "", maxRadius: "" })
  const [selectedVisitType, setSelectedVisitType] = useState("home");

  useEffect(() => {
    if (serviceDetails?.visitType) {
      const type = serviceDetails.visitType.toLowerCase();
      if (type === "center") {
        setSelectedVisitType("center");
      } else {
        setSelectedVisitType("home");
      }
    }
  }, [serviceDetails]);

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = localStorage.getItem("appliedCoupon");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [couponInputText, setCouponInputText] = useState("");
  const [walletAmount, setWalletAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { type } = useParams();
  const navigate = useNavigate();
  const { isMobile, isTabletOrBelow: isTablet } = useResponsive();

  const productData = releventBookings || [];
  const relevantProducts = productData.map((p) => {
    const tabletDetails = p?.tabletDetails || p?.tablet || {};
    const rawVariant =
      p?.combinedvariant ||
      p?.tabletvariantDetails ||
      p?.tablet?.variant?.[0] ||
      tabletDetails?.variant?.[0] ||
      {};
    const vendorRaw =
      p?.vendor || p?.vendors?.[0]?.bussinessdetails || p?.vendors?.[0] || {};
    const vendorId =
      vendorRaw?.vendorId ||
      p?.vendors?.[0]?._id ||
      p?.vendors?.[0]?.vendorId ||
      p?.vendor?.vendorId ||
      p?.vendor?._id;

    const bussinessImage = Array.isArray(vendorRaw?.bussiness_image)
      ? vendorRaw.bussiness_image
      : vendorRaw?.bussiness_image?.url
        ? [{ url: vendorRaw.bussiness_image.url }]
        : [];

    const vendor = {
      ...vendorRaw,
      vendorId,
      bussiness_image: bussinessImage,
    };

    const normalizedVariantFiles = Array.isArray(rawVariant?.files)
      ? rawVariant.files
      : rawVariant?.files
        ? [rawVariant.files]
        : [];

    const combinedvariant = {
      ...rawVariant,
      files: normalizedVariantFiles,
    };

    const normalizedTabletFiles = Array.isArray(tabletDetails?.files)
      ? tabletDetails.files
      : tabletDetails?.files
        ? [tabletDetails.files]
        : [];

    return {
      ...p,
      tabletDetails: {
        ...tabletDetails,
        files: normalizedTabletFiles,
      },
      vendor,
      combinedvariant,
      tabletvariantDetails: p?.tabletvariantDetails || rawVariant,
    };
  });

  const discountPrice =
    data?.variantDetails?.discountprice ?? data?.discountprice;
  const diagnosisPrice = data?.variantDetails?.price ?? data?.price;
  const pricePerItem = (() => {
    if (discountPrice && discountPrice > 0) {
      return discountPrice;
    }

    if (data?.variantDetails?.price) {
      return data.variantDetails.price;
    }

    if (cart?.type === "normal" && data?.medicineDetails?.price) {
      return data.medicineDetails.price;
    }
    if (cart?.type === "package" && data?.price) {
      return data.price;
    }
    return (
      data?.variantDetails?.price ??
      data?.currentVariation?.price ??
      data?.medicineDetails?.price ??
      data?.price ??
      cart?.price ??
      0
    );
  })();

  const mrpPrice = (() => {
    if (discountPrice && discountPrice > 0) {
      return (
        data?.variantDetails?.price ??
        data?.currentVariation?.mrp ??
        data?.medicineDetails?.mrp ??
        data?.mrp ??
        cart?.mrp ??
        data?.price ??
        cart?.price ??
        (pricePerItem > 0 ? pricePerItem * 1.5 : 0)
      );
    }

    if (data?.variantDetails?.price) {
      return data.variantDetails.price;
    }

    if (cart?.type === "normal" && data?.medicineDetails?.mrp) {
      return data.medicineDetails.mrp;
    }
    if (cart?.type === "package") {
      if (data?.mrp) return data.mrp;
      if (data?.price) return data.price;
    }
    return (
      data?.variantDetails?.price ??
      data?.currentVariation?.mrp ??
      data?.medicineDetails?.mrp ??
      data?.mrp ??
      cart?.mrp ??
      data?.price ??
      cart?.price ??
      (pricePerItem > 0 ? pricePerItem * 1.5 : 0)
    );
  })();

  const discount = mrpPrice - pricePerItem;
  const discountPercent =
    mrpPrice > 0 ? Math.round((discount / mrpPrice) * 100) : 0;

  function SGstCalculate(subtotal) {
    const sgst = 0.14;
    const gstAmount = subtotal * sgst;
    return gstAmount;
  }

  function CGstCalculate(subtotal) {
    const cgst = 0.04;
    const gstAmount = subtotal * cgst;
    return gstAmount;
  }

  const subtotal = pricePerItem * quantity;

  const handleProductClick = (item) => {
    if (item.type === "package" || item.packageId) {
      return;
    }

    const tabletData = item?.tabletDetails;
    const subcategoryData = tabletData?.subcategoryDetails;
    const categoryData = subcategoryData?.categoryDetails;

    const service =
      categoryData?.slug ||
      (categoryData?.name
        ? categoryData.name.toLowerCase().replace(/\s+/g, "-")
        : null);

    const categories =
      subcategoryData?.slug ||
      (subcategoryData?.name
        ? subcategoryData.name.toLowerCase().replace(/\s+/g, "-")
        : null);

    const productId = tabletData?.slug || item?.slug || item?._id;

    if (!service || !categories || !productId) {
      toast.error("Product details not available");
      return;
    }

    navigate(
      `/${encodeURIComponent(service)}/${encodeURIComponent(
        categories,
      )}/${encodeURIComponent(productId)}`,
      {
        state: {
          selectedVariantId: item.variantId || null,
        },
      },
    );
  };
  const totalDiscount = discount > 0 ? discount * quantity : 0;
  const samplecollection =
    (data?.medicineDetails?.CategoryDetails?.fixedType === "labtests" ||
      cart?.type === "package") && selectedVisitType === "home"
      ? parseInt(serviceDetails?.homeVisitFee)
      : 0;
  // const cgst = parseFloat(
  //   CGstCalculate(subtotal + samplecollection).toFixed(2),
  // );
  // const sgst = parseFloat(
  //   SGstCalculate(subtotal + samplecollection).toFixed(2),
  // );

  const tax = parseFloat((cart?.billingSummary?.totalTax || 0).toFixed(2));
  // const total = parseFloat((subtotal + tax + samplecollection).toFixed(2));
  const total = parseFloat((subtotal + samplecollection).toFixed(2));

  const calculateCouponDiscount = (coupon, baseAmount) => {
    if (!coupon) return 0;
    const base = Number.isFinite(baseAmount) ? baseAmount : 0;
    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      const percentage = parseFloat(coupon.discount) || 0;
      discountAmount = (base * percentage) / 100;
      const maxDiscount = parseFloat(coupon.maximumDiscount);
      if (Number.isFinite(maxDiscount) && maxDiscount > 0 && discountAmount > maxDiscount) {
        discountAmount = maxDiscount;
      }
    } else if (coupon.discountType === "fixed") {
      discountAmount = parseFloat(coupon.discount) || 0;
    }

    discountAmount = Math.max(0, Math.min(discountAmount, base));
    return +discountAmount.toFixed(2);
  };




  const couponDiscount = calculateCouponDiscount(appliedCoupon, total);
  const amountAfterCoupon = appliedCoupon
    ? +Math.max(0, total - couponDiscount).toFixed(2)
    : total;

  let dudcutedWalletAmount = 0;
  let amountToPay = amountAfterCoupon;

  if (paymentMethod === "online" && walletAmount > 0) {
    if (walletAmount >= amountAfterCoupon) {

      dudcutedWalletAmount = amountAfterCoupon;
      amountToPay = 0;
    } else {
      dudcutedWalletAmount = walletAmount;
      amountToPay = +(amountAfterCoupon - walletAmount).toFixed(2);
    }
  }

  const handleCouponApply = async (coupon, isManualInput = false) => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) {
        toast.error("Please login first");
        return;
      }

      if (paymentMethod === "cod") {
        toast.error("Coupons are not applicable for Cash on Delivery");
        return;
      }

      const payload = {
        couponId: isManualInput ? null : (coupon._id || null),
        couponCode: coupon.code || null,
        code: coupon.code || null,
        totalAmount: subtotal,
        bookingTypes: "buy_now",
        servicefixedTypes: data?.medicineDetails?.CategoryDetails?.fixedType,
      };

      const response = await axiosCommonInstance.post(`coupon/apply?pincode=${currentLocation?.pincode || selectedAddress?.pinCode || ""}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        const { discount, finalAmount, coupon: serverCoupon } = response.data.data;
        setAppliedCoupon({
          ...(serverCoupon || coupon),
          serverDiscount: discount,
          serverFinalAmount: finalAmount,
        });
        setShowOffersModal(false);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(response.data.message || "Failed to apply coupon");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Error applying coupon");
    }
  };

  const handleManualCouponApply = () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      toast.error("Please login to apply coupons");
      return;
    }

    if (paymentMethod === "cod") {
      toast.error("Coupons are not applicable for Cash on Delivery");
      return;
    }

    if (!couponInputText || !couponInputText.trim()) {
      toast.error("Please enter a coupon code");
      return;
    }

    const codeToSearch = couponInputText.trim().toUpperCase();

    handleCouponApply({ code: codeToSearch }, true);
    setCouponInputText("");
  };

  // Calculate tests count
  const testsCount =
    data?.medicineDetails?.parameters?.length ||
    data?.products?.length ||
    data?.medicineDetails?.parameterss?.length;

  // Offcanvas
  const handleLocationClick = (position = "right") => {
    setOffcanvasPosition(position);
    setShowLocationOffcanvas(true);
  };
  const closeLocationOffcanvas = () => setShowLocationOffcanvas(false);

  const getData = async () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) return;

      const response = await axiosCommonInstance.get("cart/booklist", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        params: selectedPincode
          ? {
            pincode: selectedPincode,
            ...(latitude && longitude
              ? { lat: latitude, lng: longitude }
              : {}),
          }
          : {},
      });

      const cartData = response?.data?.data?.products || {};
      const cartInfo = response?.data?.data?.cart || {};
      const releventBookingsData = response?.data?.data?.relevantProducts || [];
      const vendorTimingsData = response?.data?.data?.vendortimings || {};
      const walletData = response?.data?.data?.walletamount || 0;
      const couponList = response?.data?.data?.couponlist || [];
      const serviceDetails = response?.data?.data?.serviceFee?.visit || {};
      setCouponList(couponList);
      setData(cartData);
      setCart(cartInfo);
      setReleventBookings(releventBookingsData);
      setVendorTimings(vendorTimingsData);
      setWalletAmount(walletData);
      setServiceDetails(serviceDetails)
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    }
  };

  const fetchSlotVendorCalendar = async (month, year) => {
    const vendorId =
      data?.vendorDetails?.vendorId ||
      data?.vendorId ||
      cart?.vendorId ||
      data?.businessDetails?.vendorId ||
      data?.businessDetails?._id ||
      data?.vendorDetails?.businessDetails?.vendorId ||
      data?.vendorDetails?.businessDetails?._id ||
      data?.vendorDetails?._id ||
      data?.vendor?._id ||
      data?.vendor?.vendorId;

    console.log("Resolved VendorID for slots:", vendorId);
    if (!vendorId) {
      console.warn("No vendorId found for calendar fetch!");
      return;
    }

    setSlotTimingsLoading(true);
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      const res = await axiosCommonInstance.get("getvendortimings", {
        params: {
          month,
          year,
          vendorId,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log("getvendortimings API raw response:", res.data);
      const calendarData = res.data?.data || {};
      setSlotCalendarDays(calendarData.days || []);
      setSlotCalendarMonth(calendarData.month || month);
      setSlotCalendarYear(calendarData.year || year);


      // console.log(JSON.stringify("calemder days ", calendarData));
    } catch (error) {
      console.error("Error fetching vendor timings:", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to load vendor calendar. Please try again.",
      );
    } finally {
      setSlotTimingsLoading(false);
    }
  };

  useEffect(() => {
    if (showSlotPicker) {
      const targetDate = selectedDate ? new Date(selectedDate) : new Date();
      fetchSlotVendorCalendar(targetDate.getMonth() + 1, targetDate.getFullYear());
    }
  }, [showSlotPicker]);

  const loadSavedAddresses = async () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) return;

      const response = await axiosCommonInstance.get("address/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: selectedPincode
          ? {
            pincode: selectedPincode,
            ...(latitude && longitude
              ? { lat: latitude, lng: longitude }
              : {}),
          }
          : {},
      });

      if (response.data.success) {
        const addresses =
          response.data.data?.address ||
          response.data.address ||
          response.data.addresses ||
          [];

        setSavedAddresses(addresses);
        const sortedAddresses = [...addresses].sort((a, b) => {
          if (a.createdAt && b.createdAt) {
            return new Date(b.createdAt) - new Date(a.createdAt);
          }
          if (a.updatedAt && b.updatedAt) {
            return new Date(b.updatedAt) - new Date(a.updatedAt);
          }
          if (a._id && b._id) {
            const timestampA = parseInt(a._id.substring(0, 8), 16) * 1000;
            const timestampB = parseInt(b._id.substring(0, 8), 16) * 1000;
            return timestampB - timestampA;
          }
          return 0;
        });

        const savedLocationStr =
          localStorage.getItem("selectedLocationBooking") ||
          localStorage.getItem("selectedLocation");
        let matchedAddress = null;
        if (savedLocationStr) {
          try {
            const savedLocation = JSON.parse(savedLocationStr);
            if (savedLocation?.addressId) {
              matchedAddress = addresses.find(
                (addr) => addr._id === savedLocation.addressId,
              );
            }
          } catch (e) {
            // Error parsing savedLocation
          }
        }

        if (matchedAddress) {
          setSelectedAddress(matchedAddress);
        } else {
          const addressWithLocation = sortedAddresses.find(
            (addr) => addr.location && addr.location.address,
          );
          if (addressWithLocation) {
            setSelectedAddress(addressWithLocation);
          } else if (sortedAddresses.length > 0) {
            setSelectedAddress(sortedAddresses[0]);
          }
        }
      }
    } catch (error) {
      // Error loading saved addresses
    }
  };

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) return;

      const response = await fetchFamilyMembersList();

      if (response.data.success) {
        setFamilyMembers(response.data.data || []);
      }
    } catch (error) {
      // Error loading family members
    }
  };

  const fetchDoctors = async (searchQuery = "") => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setDoctors([]);
      return;
    }

    const requestId = ++doctorSearchRequestRef.current;

    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!token) return;

      const response = await fetchDoctorsList(trimmedQuery);

      if (requestId !== doctorSearchRequestRef.current) return;

      if (response.data.success) {
        setDoctors(
          response.data?.data?.doctors ||
          response.data?.data?.familyDoctors ||
          [],
        );
      }
    } catch (error) {
      if (requestId !== doctorSearchRequestRef.current) return;
      toast.error("Error fetching doctors:", error);
    }
  };

  //  order
  const handleSubmit = async (e) => {
    e.preventDefault();


    if (isSubmitting) return;
    const isSlotCategory =
      data?.medicineDetails?.CategoryDetails?.categoryType === "slots" || cart?.type === "package";
    const hasSelectedSlot = Boolean(selectedDate && selectedTimeSlot);

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (!token) {
      toast.error("Please login first");
      return;
    }

    const isVendorLocationService = VENDOR_LOCATION_SERVICES.includes(data?.medicineDetails?.CategoryDetails?.fixedType);
    if (!isVendorLocationService && (!isSlotCategory || selectedVisitType === "home") && !selectedAddress) {
      toast.error("Please select a Patient address");
      return;
    }

    if (isSlotCategory && !hasSelectedSlot) {
      toast.error("Please select an appointment slot");
      setShowSlotPicker(true);
      return;
    }

    // if ()

    // if (!selectedDate) {
    //   toast.error("Please select a delivery date");
    //   return;
    // }

    // if (!selectedTimeSlot) {
    //   toast.error("Please select a delivery time slot");
    //   return;
    // }

    if (
      personType === "forWhom" &&
      (!selectedFamilyMember || selectedFamilyMember.length === 0)
    ) {
      toast.error("Please select at least one family member");
      return;
    }
    if (personType === "forWhom" && !selectedDoctor) {
      toast.error("Please select a referred doctor");
      return;
    }
    if (personType === "self" && !selectedDoctor) {
      toast.error("Please select a Referred Doctor");
      return;
    }

    if (!selectedVisitType) {
      toast.error("Please select a visit type");
      return;
    }

    setIsSubmitting(true);

    const orderCGST = parseFloat(
      CGstCalculate(subtotal + samplecollection).toFixed(2),
    );
    const orderSGST = parseFloat(
      SGstCalculate(subtotal + samplecollection).toFixed(2),
    );
    const orderTax = parseFloat((orderCGST + orderSGST).toFixed(2));

    const payload = {
      items: [
        {
          type: cart?.type,
          cartId: cart?._id,
          productId: cart?.productId || data?.medicineDetails?._id || data?.medicineDetails?.id || data?._id || data?.id || null,
          vendorId: cart?.vendorId || data?.medicineDetails?.vendorId || data?.vendors?.[0]?._id || data?.vendors?.[0]?.vendorId || data?.vendor?.vendorId || data?.vendor?._id || null,
          variantId: cart?.variantId || data?.variantDetails?._id || data?.variantDetails?.id || null,
          packageId: cart?.packageId || (cart?.type === "package" ? cart?._id : null),
          quantity: quantity,
          pricePerItem: pricePerItem,
          subtotal: subtotal,
          price: mrpPrice,
          discountprice: discountPrice || 0,
          serviceType: data?.medicineDetails?.CategoryDetails?.fixedType,
          servicefixedTypes: data?.medicineDetails?.CategoryDetails?.fixedType,
          visitType: selectedVisitType,
          billingSummary: cart?.billingSummary || null,
        },
      ],

      billingSummary: {
        subtotal: cart?.billingSummary?.unitPrice || subtotal,
        totalGst: cart?.billingSummary?.gstAmount,
        totalIgst: cart?.billingSummary?.totalIgst || 0,
        deliveryCharges: cart?.billingSummary?.deliveryCharges || samplecollection,
        couponAmount: cart?.billingSummary?.couponAmount || couponDiscount,
        couponId: cart?.billingSummary?.couponId || appliedCoupon?._id || null,
        finalAmount: cart?.billingSummary?.unitPrice || amountToPay,
        walletAmount: cart?.billingSummary?.walletAmount || (paymentMethod === "online" && walletAmount > 0 ? walletAmount : null),
        walletUsedWithCoupon: cart?.billingSummary?.walletUsedWithCoupon || 0,
        walletUsedWithoutCoupon: cart?.billingSummary?.walletUsedWithoutCoupon || 0,
        withCouponAndWithWallet: cart?.billingSummary?.withCouponAndWithWallet || 0,
        withCouponAndWithoutWallet: cart?.billingSummary?.withCouponAndWithoutWallet || 0,
        withoutCouponAndWithWallet: cart?.billingSummary?.withoutCouponAndWithWallet || 0,
        withoutCouponAndWithoutWallet: cart?.billingSummary?.withoutCouponAndWithoutWallet || 0,
        paidAmount: amountToPay

      },
      bookingTypes: "buy_now",
      subtotal,
      shipping: 0,
      discount: couponDiscount,
      tax: orderTax,
      cgst: orderCGST,
      sgst: orderSGST,
      total: amountAfterCoupon,
      // iswallet: paymentMethod === "cod" ? false : true,
      shippingAddress: (isSlotCategory && selectedVisitType !== "home") ? null : selectedAddress?._id,
      billingAddress: (isSlotCategory && selectedVisitType !== "home") ? null : selectedAddress?._id,
      paymentmethod: paymentMethod,
      couponId: appliedCoupon?._id || null,
      couponAmount: couponDiscount,
      samplecollection: selectedVisitType === 'center' ? 0 : samplecollection,
      walletamount:
        paymentMethod === "online" && walletAmount > 0 ? walletAmount : null,
      iswallet: paymentMethod === "online" && walletAmount > 0 ? true : false,
      visitType: selectedVisitType,
      // doctorName:
      //   selectedDoctor?.value === "not_applicable"
      //     ? "Not Applicable"
      //     : selectedDoctor?.label || "",
      // doctorId:
      //   selectedDoctor?.value === "not_applicable"
      //     ? null
      //     : selectedDoctor?.value || ""

      doctorName:
        selectedDoctor?.value === "self_referral"
          ? "Self Referral"
          : selectedDoctor?.label || "",
      doctorId:
        selectedDoctor?.value === "self_referral"
          ? null
          : selectedDoctor?.value || null,
      familyids:
        personType === "forWhom" && selectedFamilyMember
          ? [selectedFamilyMember.value].filter(Boolean)
          : [],
      familynames:
        personType === "forWhom" && selectedFamilyMember
          ? [selectedFamilyMember.label].filter(Boolean)
          : [],
      persontype: personType,
      selectedDate: selectedDate && selectedDate instanceof Date
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        : selectedDate,
      selectedTimeSlot: selectedTimeSlot && selectedTimeSlot,
      pincode:
        currentLocation?.pincode ||
        selectedPincode ||
        selectedAddress?.location?.pincode ||
        "",
    };

    let slotType;
    if (selectedDate) {
      slotType = "slot"
    } else {
      slotType = null
    }

    try {
      const response = await axiosUserInstance.post("orders/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const orderId = response?.data?.data?.orderId || response?.data?.orderId;
      if (orderId) {
        sessionStorage.setItem("orderId", orderId);
      }

      const orderItems = [
        {
          type: cart?.type || "package",
          name: data?.medicineDetails?.name || data?.name,
          id: data?.medicineDetails?._id || data?.id,
        },
      ];
      sessionStorage.setItem("orderItems", JSON.stringify(orderItems));


      if (
        paymentMethod === "online" &&
        walletAmount >= amountAfterCoupon &&
        walletAmount > 0
      ) {
        setAppliedCoupon(null);
        localStorage.removeItem("appliedCoupon");
        sessionStorage.setItem("paymentMethod", "wallet");

        const orderItems = [
          {
            type: cart?.type || "package",
            name: data?.medicineDetails?.name || data?.name,
            id: data?.medicineDetails?._id || data?.id,
          },
        ];
        sessionStorage.setItem("orderItems", JSON.stringify(orderItems));

        navigate(`/payment-success?type=${slotType}`);
        return;
      }

      const razorpayData = response.data.data;

      if (paymentMethod === "cod") {
        setAppliedCoupon(null);
        localStorage.removeItem("appliedCoupon");
        sessionStorage.setItem("paymentMethod", "cod");

        const orderItems = [
          {
            type: cart?.type || "package",
            name: data?.medicineDetails?.name || data?.name,
            id: data?.medicineDetails?._id || data?.id,
          },
        ];
        sessionStorage.setItem("orderItems", JSON.stringify(orderItems));

        navigate(`/payment-success?type=${slotType}`);
        return;
      }

      if (amountAfterCoupon <= 0) {
        // clearCart();
        setAppliedCoupon(null);
        localStorage.removeItem("checkoutAppliedCoupon");
        sessionStorage.setItem("paymentMethod", "wallet");
        navigate(`/payment-success?type=${slotType}`);
        return;
      }

      if (!window.Razorpay) {
        toast.error("Razorpay not loaded");
        return;
      }

      openRazorpayCheckout({
        razorpayData,
        description: "Order Payment",
        prefill: {
          name: selectedAddress?.name || userProfile?.first_name || "Customer",
          contact: selectedAddress?.phone || userProfile?.mobile || "",
        },
        setIsSubmitting,
        onSuccess: async (res) => {
          await axiosUserInstance.post(
            "orders/verify-payment",
            {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              orderId: sessionStorage.getItem("orderId"),
              bookingTypes: "buy_now",
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          setAppliedCoupon(null);
          localStorage.removeItem("appliedCoupon");
          sessionStorage.setItem("paymentMethod", "online");
          const orderItems = [
            {
              type: cart?.type || "package",
              name: data?.medicineDetails?.name || data?.name,
              id: data?.medicineDetails?._id || data?.id,
            },
          ];
          sessionStorage.setItem("orderItems", JSON.stringify(orderItems));
          navigate(`/payment-success?type=${slotType}`);
        },
        onCancel: () => {
          setIsSubmitting(false);
          toast.error("Payment cancelled. Please try again.");
        },
      });
    } catch (error) {
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // useEffect(() => {
  //   const fetchCoupons = async () => {
  //     try {
  //       const response = await axiosCommonInstance.get("coupon/list");
  //       setCouponList(response.data.data.couponlist);
  //     } catch (error) {
  //       toast.error(error);
  //     }
  //   };

  //   fetchCoupons();
  // }, []);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
      } else {
        localStorage.removeItem("appliedCoupon");
      }
    } catch (e) {
      // no-op
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (paymentMethod === "cod" && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [paymentMethod]);

  // Drop coupon if order no longer meets minimum purchase
  useEffect(() => {
    if (!appliedCoupon) return;
    const minPurchase = parseFloat(appliedCoupon.minimumPurchase);
    if (Number.isFinite(minPurchase) && minPurchase > 0) {
      if (appliedCoupon.createdType === "vendor") {
        const vendorIdStr = String(appliedCoupon.createdBy || appliedCoupon.businessDetails?._id || "");
        const itemVendorId = String(data?.vendorDetails?.vendorId || data?.vendorId || cart?.vendorId || data?.businessDetails?._id || "");
        if (itemVendorId === vendorIdStr) {
          if (subtotal < minPurchase) {
            setAppliedCoupon(null);
            toast.error(
              `Coupon removed — minimum spend for ${appliedCoupon.businessDetails?.businessName || 'vendor'} is ₹${minPurchase}`,
            );
          }
        } else {
          setAppliedCoupon(null);
          toast.error(`Coupon removed — this coupon is only valid for ${appliedCoupon.businessDetails?.businessName || 'the matching vendor'}`);
        }
      } else {
        if (total < minPurchase) {
          setAppliedCoupon(null);
          toast.error(
            `Coupon removed — minimum order amount is ₹${minPurchase}`,
          );
        }
      }
    }
  }, [subtotal, total, appliedCoupon, data, cart]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          getData(),
          loadSavedAddresses(),
          fetchFamilyMembers(),
        ]);
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    initializeData();
    const today = new Date();
    setSelectedDate(today);
  }, []);

  useEffect(() => {
    if (!doctorSearchQuery.trim()) {
      setDoctors([]);
      doctorSearchRequestRef.current += 1;
      return;
    }

    setDoctors([]);

    const timeoutId = setTimeout(() => {
      setDoctorSearchLoading(true);
      fetchDoctors(doctorSearchQuery).finally(() => {
        setDoctorSearchLoading(false);
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [doctorSearchQuery]);

  useEffect(() => {
    if (currentLocation?.addressId && savedAddresses.length > 0) {
      const matched = savedAddresses.find(
        (a) => a._id === currentLocation.addressId,
      );
      if (matched) {
        setSelectedAddress(matched);
      }
    } else if (currentLocation && !currentLocation.addressId) {
      setSelectedAddress(null);
    }
  }, [currentLocation, savedAddresses]);

  useEffect(() => {
    const handleAddressUpdate = (event) => {
      setTimeout(() => {
        loadSavedAddresses();
      }, 500);
    };

    const handleAddressSaved = (event) => {
      setTimeout(() => {
        loadSavedAddresses();
      }, 500);
    };

    const handleAddressDeleted = (event) => {
      setTimeout(() => {
        loadSavedAddresses();
      }, 500);
    };

    window.addEventListener("addressUpdated", handleAddressUpdate);
    window.addEventListener("addressSaved", handleAddressSaved);
    window.addEventListener("addressDeleted", handleAddressDeleted);

    return () => {
      window.removeEventListener("addressUpdated", handleAddressUpdate);
      window.removeEventListener("addressSaved", handleAddressSaved);
      window.removeEventListener("addressDeleted", handleAddressDeleted);
    };
  }, []);

  const getAddressTypeLabel = () => {
    if (selectedAddress?.addressType) {
      const addressType = selectedAddress.addressType;
      return (
        addressType.charAt(0).toUpperCase() + addressType.slice(1).toLowerCase()
      );
    }
    return "Delivery Address";
  };

  const formatSelectedSlot = () => {
    if (!selectedDate || !selectedTimeSlot) return "";
    const day = selectedDate.getDate();
    const suffix =
      day === 1 || day === 21 || day === 31
        ? "st"
        : day === 2 || day === 22
          ? "nd"
          : day === 3 || day === 23
            ? "rd"
            : "th";
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const month = monthNames[selectedDate.getMonth()];
    return `${day}${suffix} ${month} | ${selectedTimeSlot}`;
  };
  const isSlotCategory =
    data?.medicineDetails?.CategoryDetails?.categoryType === "slots" ||
    cart?.type === "package" ||
    VENDOR_LOCATION_SERVICES.includes(data?.medicineDetails?.CategoryDetails?.fixedType);
  const hasSelectedSlot = Boolean(selectedDate && selectedTimeSlot);

  const productName =
    cart?.type === "normal" && data?.medicineDetails?.name
      ? data.medicineDetails.name
      : cart?.type === "package" && data?.name
        ? data.name
        : "Product";

  const handleWhatsAppSupport = () => {
    const message = `Hi MediCompares support, I need help with booking ${productName}.`;
    window.open(
      `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message,
      )}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const [isTotalFareExpanded, setIsTotalFareExpanded] = useState(true);

  const resolveImage = (item) => {
    if (
      item?.medicineDetails?.files &&
      Array.isArray(item.medicineDetails.files) &&
      item.medicineDetails.files.length > 0
    ) {
      const file = item.medicineDetails.files[0];
      return getImageUrl(file);
    }

    if (
      item?.medicineDetails?.imageUrl &&
      Array.isArray(item.medicineDetails.imageUrl) &&
      item.medicineDetails.imageUrl.length > 0
    ) {
      const file = item.medicineDetails.imageUrl[0];
      return getImageUrl(file);
    }

    if (item?.files && Array.isArray(item.files) && item.files.length > 0) {
      const file = item.files[0];
      return getImageUrl(file);
    }

    if (
      item?.imageUrl &&
      Array.isArray(item.imageUrl) &&
      item.imageUrl.length > 0
    ) {
      const imageUrl = item.imageUrl[0];
      return getImageUrl(imageUrl);
    }

    if (item?.imageUrl && typeof item.imageUrl === "string") {
      return getImageUrl(item.imageUrl);
    }

    if (item?.url) {
      return getImageUrl(item.url);
    }

    if (
      item?.combinedvariant?.files &&
      Array.isArray(item.combinedvariant.files) &&
      item.combinedvariant.files.length > 0
    ) {
      const file = item.combinedvariant.files[0];
      return getImageUrl(file);
    }

    return "/assets/default.png";
  };

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="main-wrapper min-h-screen bg-[#f8f9fa]">
      <Home2Header />
      <CategoryProvider />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-4 pb-12">
        <div className="!mb-3">
          <button
            onClick={() => navigate(-1)}
            className="!flex !items-center !gap-[6px] !p-[4px_10px] !border !border-[#e0e0e0] !bg-white !text-[#333] !font-[500] !text-[12px] !rounded-[6px] !shadow-sm !cursor-pointer !transition-all !duration-300 hover:!border-[#8059ca] hover:!text-[#8059ca] hover:!bg-[#f8f5ff] hover:!shadow-[0_4px_8px_rgba(125,46,255,0.15)] hover:!-translate-y-px"
          >
            <i className="fas fa-arrow-left text-[11px]"></i>
            <span className="text-[12px] font-medium">Back</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <div className="card shadow-sm border-none bg-white relative rounded-xl p-4 md:p-6">
              <div className={`grid gap-6 ${isLoggedIn ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
                <div className="w-full">
                  {isSlotCategory && cart?.type !== "package" && selectedVisitType !== "home" ? (
                    <div className="mb-6">
                      <div className="border border-[#d1fae5] rounded-[10px] p-4 bg-[#f0fdf4] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-2.5 mb-2.5">
                          <i className="fab fa-whatsapp text-[#16a34a] text-[22px]"></i>
                          <div className={`${isMobile ? "text-[13px]" : "text-sm"} font-bold text-gray-900`}>
                            Booking Support
                          </div>
                        </div>
                        <p className="text-[13px] text-gray-600 mb-3">
                          Need help with this appointment? Chat with our support
                          team on WhatsApp.
                        </p>
                        <button
                          type="button"
                          onClick={handleWhatsAppSupport}
                          className="w-full border-0 rounded-lg bg-[#16a34a] text-white py-2.5 px-3 text-[13px] font-bold cursor-pointer flex items-center justify-center gap-2"
                        >
                          <i className="fab fa-whatsapp"></i>
                          Contact on WhatsApp
                        </button>
                      </div>
                    </div>
                  ) : (

                    <>
                      {VENDOR_LOCATION_SERVICES.includes(data?.medicineDetails?.CategoryDetails?.fixedType) && (
                        <div className="mb-6">
                          <div className="border border-[#e0e0e0] rounded-[10px] p-4 bg-white text-sm text-[#333] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                            <div className="font-bold mb-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-[5px]">
                                <i className="fas fa-hospital text-[#8059ca]"></i>
                                <span className="text-sm font-semibold text-black m-0">Provider Address</span>
                              </div>
                              {data?.businessDetails?.location?.coordinates &&
                                data.businessDetails.location.coordinates.length === 2 && (
                                  <div>
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${data.businessDetails.location.coordinates[1]},${data.businessDetails.location.coordinates[0]}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-2 py-[5px] px-2.5 !bg-[#8059ca] text-white !text-sm !font-medium no-underline !rounded-sm border border-[#6d46b5] shadow-[0_3px_8px_rgba(128,89,202,0.25)] transition-all duration-[250ms] ease cursor-pointer hover:bg-[#6d46b5] hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(128,89,202,0.35)]"
                                    >
                                      <i className="fas fa-map-marked-alt"></i>
                                      View on Map
                                    </a>
                                  </div>
                                )}
                            </div>

                            {data?.businessDetails?.name && (
                              <div className="font-semibold mb-1">
                                {data?.businessDetails?.name}
                              </div>
                            )}
                            {data?.businessDetails?.address && (
                              <div className="text-gray-600">
                                {data?.businessDetails?.address}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {(data?.medicineDetails?.CategoryDetails?.fixedType !== "dentalservice" &&
                        data?.medicineDetails?.CategoryDetails?.fixedType !== "medicaltreatment" &&
                        data?.medicineDetails?.CategoryDetails?.fixedType !== "nursingcare" &&
                        data?.medicineDetails?.CategoryDetails?.fixedType !== "diagnostics") && (
                          <div className="mb-6">
                            <div className="rounded-md overflow-hidden border border-[#e9ecef] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] bg-white">
                              <div className="flex justify-between items-center px-3 py-4 bg-[#faf8ff] border-b border-[#f3e8ff]">
                                <div className="text-[13px] font-bold text-[#5b21b6] flex items-center gap-2">
                                  <i className="fas fa-map-marker-alt text-[#8059ca]"></i>
                                  <span>{getAddressTypeLabel()}</span>
                                </div>
                                <div>
                                  <button
                                    className="text-white bg-gradient-to-br from-[#8059ca] to-[#6f42c1] border-0 !font-semibold cursor-pointer !text-[11px] px-4 py-1.5 !rounded-[5px] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
                                    onClick={() => {
                                      const token =
                                        localStorage.getItem("medicomparestoken");
                                      if (!token) {
                                        toast.error("Please login to change address");
                                        navigate("/login");
                                        return;
                                      }
                                      handleLocationClick("right");
                                    }}
                                  >
                                    {selectedAddress ? "Change" : "Add"}
                                  </button>
                                </div>
                              </div>

                              {selectedAddress ? (
                                <div className="p-4 bg-white text-sm text-[#475569] leading-relaxed">
                                  {selectedAddress ? (
                                    <div>
                                      {selectedAddress.name && (
                                        <div className="font-bold text-slate-800 mb-1.5">
                                          {selectedAddress.name}
                                        </div>
                                      )}
                                      {selectedAddress.houseNo && (
                                        <div>{selectedAddress.houseNo}</div>
                                      )}
                                      {selectedAddress.street && (
                                        <div>{selectedAddress.street}</div>
                                      )}
                                      {selectedAddress.area && (
                                        <div>{selectedAddress.area}</div>
                                      )}
                                      {selectedAddress.location?.address && (
                                        <div className="text-slate-400 mt-1 text-[13px]">{selectedAddress.location.address} </div>
                                      )}
                                    </div>
                                  ) : (
                                    selectedAddress?.address || ""
                                  )}
                                </div>
                              ) : (
                                <div className="p-4 bg-white text-sm text-slate-400 flex items-center gap-2">
                                  <i className="fas fa-map-marker-alt"></i>
                                  <span>
                                    {isLocationUpdating
                                      ? "Detecting location..."
                                      : "Add address"}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                    </>
                  )}
                </div>
                {isLoggedIn && (
                  <div className="w-full">
                    <div className="rounded-[10px] shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-white border-0 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                          <div className="!flex !w-full gap-1 !rounded-lg !bg-[#f1f3f9] p-1">
                            {/* Self */}
                            <div className="flex flex-1">
                              <label
                                className={`flex w-full items-center justify-center !gap-2 rounded-sm border px-3 py-1 shadow-sm transition-all duration-200 ${personType === "self"
                                  ? "!border-[#8059ca] bg-[#8059ca] text-white"
                                  : "!border-slate-300 bg-white hover:bg-white/50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="personType"
                                  checked={personType === "self"}
                                  onChange={() => {
                                    setPersonType("self");
                                    setSelectedDoctor(null);
                                    setDoctorSearchQuery("");
                                    setDoctors([]);
                                  }}
                                  className="sr-only"
                                />

                                <i
                                  className={`fas fa-user text-sm transition-colors duration-200 ${personType === "self" ? "text-white" : "text-gray-500"
                                    }`}
                                ></i>

                                <span
                                  className={`!text-[13px] !font-semibold transition-colors duration-200 ${personType === "self" ? "text-white" : "text-gray-600"
                                    }`}
                                >
                                  Self
                                </span>
                              </label>
                            </div>

                            {/* For Whom */}
                            <div className="flex flex-1">
                              <label
                                className={`flex w-full !items-center !justify-center !gap-2 !rounded-sm !border px-3 py-1 shadow-sm transition-all duration-200 ${personType === "forWhom"
                                  ? "!border-[#8059ca] !bg-[#8059ca] text-white"
                                  : "!border-slate-300 !bg-white hover:bg-white/50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="personType"
                                  checked={personType === "forWhom"}
                                  onChange={() => {
                                    setPersonType("forWhom");
                                    setSelectedFamilyMember(null);
                                    setSelectedDoctor(null);
                                    setDoctorName("");
                                    setDoctorSearchQuery("");
                                    setDoctors([]);
                                  }}
                                  className="sr-only"
                                />

                                <i
                                  className={`fas fa-users text-sm transition-colors duration-200 ${personType === "forWhom" ? "text-white" : "text-gray-500"
                                    }`}
                                ></i>

                                <span
                                  className={`!text-[13px] !font-semibold transition-colors duration-200 ${personType === "forWhom" ? "text-white" : "text-gray-600"
                                    }`}
                                >
                                  For Whom
                                </span>
                              </label>
                            </div>
                          </div>
                        </div>

                        {personType === "self" && (
                          <div className="col-span-1 md:col-span-2">
                            <label className="form-label text-[#333] text-sm font-medium mb-1.5">
                              Select Referred Doctor <span className="text-red-600">*</span>
                            </label>
                            <Select
                              styles={customSelectStyles}
                              options={getReferredDoctorSelectOptions(doctors)}
                              components={referredDoctorSelectComponents}
                              filterOption={() => true}
                              inputValue={doctorSearchQuery}
                              value={selectedDoctor}
                              onChange={(selectedOption) =>
                                handleReferredDoctorSelectChange(
                                  selectedOption,
                                  setSelectedDoctor,
                                  setDoctorName,
                                  setDoctorSearchQuery,
                                )
                              }
                              onInputChange={(inputValue, actionMeta) =>
                                handleReferredDoctorInputChange(
                                  inputValue,
                                  actionMeta,
                                  setDoctorSearchQuery,
                                )
                              }
                              openMenuOnFocus
                              openMenuOnClick
                              placeholder="Search and Select Referred Doctor"
                              isClearable
                              isSearchable
                              isLoading={doctorSearchLoading}
                              menuPortalTarget={document.body}
                              menuPosition="fixed"
                              noOptionsMessage={({ inputValue }) =>
                                inputValue.trim() ? "No doctors found" : null
                              }
                            />
                          </div>
                        )}

                        {personType === "forWhom" && (
                          <>
                            <div className="col-span-1">
                              <label className="form-label text-[#333] text-sm font-medium mb-1.5">
                                Select Family Member <span className="text-red-600">*</span>
                              </label>
                              <Select
                                isMulti={false}
                                styles={customSelectStyles}
                                options={familyMembers.map((member) => ({
                                  value: member._id,
                                  label: member.name,
                                }))}
                                value={selectedFamilyMember}
                                onChange={(selectedOption) =>
                                  setSelectedFamilyMember(selectedOption)
                                }
                                placeholder="Select family members"
                                isClearable
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                              />
                            </div>
                            <div className="col-span-1">
                              <label className="form-label text-[#333] text-sm font-medium mb-1.5">
                                Select Referred Doctor <span className="text-red-600">*</span>
                              </label>
                              <Select
                                styles={customSelectStyles}
                                options={getReferredDoctorSelectOptions(doctors)}
                                components={referredDoctorSelectComponents}
                                filterOption={() => true}
                                inputValue={doctorSearchQuery}
                                value={selectedDoctor}
                                onChange={(selectedOption) =>
                                  handleReferredDoctorSelectChange(
                                    selectedOption,
                                    setSelectedDoctor,
                                    setDoctorName,
                                    setDoctorSearchQuery,
                                  )
                                }
                                onInputChange={(inputValue, actionMeta) =>
                                  handleReferredDoctorInputChange(
                                    inputValue,
                                    actionMeta,
                                    setDoctorSearchQuery,
                                  )
                                }
                                openMenuOnFocus
                                openMenuOnClick
                                placeholder="Search and Select Referred Doctor"
                                isClearable
                                isSearchable
                                isLoading={doctorSearchLoading}
                                menuPortalTarget={document.body}
                                menuPosition="fixed"
                                noOptionsMessage={({ inputValue }) =>
                                  inputValue.trim() ? "No doctors found" : null
                                }
                              />
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {selectedVisitType === "home" && (
                <div className="mb-2.5">
                  <div className="border border-[#d1fae5] rounded-[10px] p-4 bg-[#f0fdf4] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <i className="fab fa-whatsapp text-[#16a34a] text-[22px]"></i>
                      <div className={`${isMobile ? "text-[13px]" : "text-sm"} font-bold text-gray-900`}>
                        Booking Support
                      </div>
                    </div>
                    <p className="text-[13px] text-gray-600 mb-3">
                      Need help with this appointment? Chat with our support
                      team on WhatsApp.
                    </p>
                    <button
                      type="button"
                      onClick={handleWhatsAppSupport}
                      className="w-full border-0 rounded-lg bg-[#16a34a] text-white py-2.5 px-3 text-[13px] font-bold cursor-pointer flex items-center justify-center gap-2"
                    >
                      <i className="fab fa-whatsapp"></i>
                      Contact on WhatsApp
                    </button>
                  </div>
                </div>
              )}

              <div className="card shadow-sm mb-3 rounded-xl border-0">
                <div className="card-body p-3 p-md-4">
                  <div className={`d-flex flex-wrap items-start ${isMobile ? "gap-3" : "gap-4"}`}>
                    <div className="relative shrink-0">
                      <div className={`${isMobile ? "w-20 h-20" : "w-[100px] h-[100px]"} rounded-lg overflow-hidden bg-[#f0f4ff] flex items-center justify-center border border-[#e0e0e0]`}>
                        <img
                          src={
                            resolveImage(data) ||
                            resolveImage(data?.medicineDetails) ||
                            resolveImage(data?.currentVariation) ||
                            "/assets/img/doctors/labtest (3).svg"
                          }
                          alt={productName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.target.src =
                              "/assets/img/doctors/labtest (3).svg";
                          }}
                        />
                      </div>
                    </div>

                    <div className={`flex-1 ${isMobile ? "min-w-0 w-full" : "min-w-[200px] w-auto"}`}>
                      <div className={`flex ${isMobile ? "flex-column" : "items-start"} w-100`}>
                        <div className={`flex flex-column ${isMobile ? "w-full" : "w-auto"}`}>
                          <div className={`${isMobile ? "text-sm" : "text-base"} font-semibold ${isMobile ? "mb-2" : "mb-3"} text-black capitalize`}>
                            {productName}
                          </div>
                        </div>

                        <div className={`${isMobile ? "ml-0 mt-3 w-full" : "ml-auto mt-0 w-auto"}`}>
                          <div className={`flex items-center flex-wrap ${isMobile ? "gap-2 mb-3" : "gap-3 mb-0"}`}>
                            {discountPrice && mrpPrice > pricePerItem ? (
                              <>
                                <span className="text-lg font-semibold text-black sm:text-xl md:text-2xl">
                                  ₹{pricePerItem.toFixed(2)}
                                </span>

                                <span className="text-sm text-gray-400 line-through sm:text-base">
                                  ₹{mrpPrice.toFixed(2)}
                                </span>

                                {discountPercent > 0 && (
                                  <span className="rounded bg-[#28a745] px-2 py-1 text-[10px] font-medium text-white sm:text-xs">
                                    {discountPercent}% OFF
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-lg font-bold text-black sm:text-xl md:text-2xl">
                                ₹{pricePerItem.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between gap-5 flex-wrap">
                        <div>
                          <ul className="list-none p-0 mt-0 mb-3">
                            {data?.medicineDetails?.form && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-capsules text-[#8059ca] text-xs"></i>
                                Form : {data?.medicineDetails?.form}
                              </li>
                            )}

                            {data?.medicineDetails?.strength && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-bolt text-[#8059ca] text-xs"></i>
                                Strength : {data?.medicineDetails?.strength}
                              </li>
                            )}

                            {data?.medicineDetails?.duration && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock text-[#8059ca] text-xs"></i>
                                Duration : {data?.medicineDetails?.duration}
                              </li>
                            )}
                            {data?.medicineDetails?.shiftType && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock text-[#8059ca] text-xs"></i>
                                Shift Type : {data?.medicineDetails?.shiftType}
                              </li>
                            )}
                            {data?.medicineDetails?.nursecareType && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock text-[#8059ca] text-xs"></i>
                                Type : {data?.medicineDetails?.nursecareType}
                              </li>
                            )}
                            {data?.medicineDetails?.gender && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-venus-mars text-[#8059ca] text-xs"></i>
                                Gender : {data?.medicineDetails?.gender}
                              </li>
                            )}
                            {data?.medicineDetails?.complexity && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-layer-group text-[#8059ca] text-xs"></i>
                                Complexity : {data?.medicineDetails?.complexity}
                              </li>
                            )}

                            {data?.medicineDetails?.model && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-cube text-[#8059ca] text-xs"></i>
                                Model : {data?.medicineDetails?.model}
                              </li>
                            )}
                            {data?.medicineDetails?.condition && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-info-circle !text-[#8059ca] !text-xs"></i>
                                Condition : {data?.medicineDetails?.condition}
                              </li>
                            )}
                            {data?.medicineDetails?.machineType && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-cogs !text-[#8059ca] !text-xs"></i>
                                Machine Type : {data?.medicineDetails?.machineType}
                              </li>
                            )}

                            {data?.medicineDetails?.compositionDetails?.name && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-mortar-pestle !text-[#8059ca] !text-xs"></i>
                                Composition : {data?.medicineDetails?.compositionDetails?.name}
                              </li>
                            )}

                            {data?.medicineDetails?.reportsDuration && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock !text-[#8059ca] !text-xs"></i>
                                {data?.medicineDetails?.reportsDuration.slice(0, 40) ||
                                  data?.reportsDuration ||
                                  "24"}
                              </li>
                            )}
                            {testsCount && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-vial !text-[#8059ca] !text-xs"></i>
                                Includes {testsCount} parameters
                              </li>
                            )}
                          </ul>

                          <div className="flex gap-5 flex-wrap">
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(-1);
                              }}
                              className="!text-[13px] !text-red-600 no-underline cursor-pointer flex items-center gap-1.5"
                            >
                              <i className="fas fa-trash-alt !text-xs"></i>
                              Delete
                            </a>
                          </div>
                        </div>

                        {(data?.businessDetails ||
                          data?.vendorDetails?.businessDetails) && (
                            <div className="p-2.5 bg-gray-50 rounded-lg flex items-center gap-3 border border-gray-100">
                              <img
                                src={getImageUrl(
                                  data?.businessDetails?.bussiness_image?.url ||
                                  data?.vendorDetails?.businessDetails
                                    ?.bussiness_image?.url ||
                                  "",
                                )}
                                alt="business"
                                className="w-10 h-10 rounded-md object-cover"
                              />
                              <div>
                                <div className="text-[13px] font-semibold text-gray-900">
                                  {
                                    (
                                      data?.businessDetails ||
                                      data?.vendorDetails?.businessDetails
                                    )?.name
                                  }
                                </div>
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!isMobile && productData?.length > 0 && (
              <RecentlyViewedProducts
                products={relevantProducts}
                onProductClick={handleProductClick}
                onRentalBooking={handleRentalBookingProcess}
                onBooking={handleBooking}
                onAddLead={handleAddLead}
              />
            )}
          </div>

          <div className="lg:col-span-1">
            <div className={isMobile ? "relative top-0" : "sticky top-5 flex flex-col gap-6"}>
              <div className="card shadow-sm mb-4 rounded-xl border-0 !bg-white">
                <div className="card-body !p-4 !flex !flex-col !gap-4">

                  {/* Visit Type & Appointment Slot Section */}
                  {isSlotCategory && (
                    <div className="!pb-4 !border-b !border-[#f1f5f9]">
                      {/* Visit Type Option */}
                      {serviceDetails?.visitType && (
                        <div className="!mb-4 !pb-1">
                          <h6 className="!text-[11px] !font-semibold !text-[#8059ca] !uppercase !tracking-wide !mb-2.5">
                            Visit Type
                          </h6>
                          {serviceDetails.visitType.toLowerCase() === "both" ? (
                            <div className="!flex !gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedVisitType("home")}
                                className={`!flex-1 !py-2 !px-3 !rounded-lg !font-semibold !text-xs !cursor-pointer !transition-all !duration-200 !flex !items-center !justify-center !gap-1.5 ${selectedVisitType === "home" ? "!border-2 !border-[#8059ca] !bg-[#f8f4ff] !text-[#8059ca]" : "!border !border-[#e2e8f0] !bg-white !text-[#333]"}`}
                              >
                                <i className="fas fa-home"></i> Home Visit
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedVisitType("center")}
                                className={`!flex-1 !py-2 !px-3 !rounded-lg !font-semibold !text-xs !cursor-pointer !transition-all !duration-200 !flex !items-center !justify-center !gap-1.5 ${selectedVisitType === "center" ? "!border-2 !border-[#8059ca] !bg-[#f8f4ff] !text-[#8059ca]" : "!border !border-[#e2e8f0] !bg-white !text-[#333]"}`}
                              >
                                <i className="fas fa-building"></i> Visit Center
                              </button>
                            </div>
                          ) : serviceDetails.visitType.toLowerCase() === "home" ? (
                            <div className="!py-2 !px-3 !bg-[#ecfdf5] !border !border-[#a7f3d0] !rounded-lg !text-[#065f46] !text-xs !font-semibold !flex !items-center !gap-2">
                              <i className="fas fa-home text-[#059669]"></i>
                              Home Service Only Available
                            </div>
                          ) : (
                            <div className="!py-2 !px-3 !bg-[#fffbeb] !border !border-[#fde68a] !rounded-lg !text-[#b45309] !text-xs !font-semibold !flex !items-center !gap-2">
                              <i className="fas fa-exclamation-circle text-[#d97706]"></i>
                              Please visit the center for this booking
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center mb-2.5">
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-[#8059ca]" />
                          <label className="text-[11px] font-bold text-[#475569] m-0 tracking-[0.5px]">
                            APPOINTMENT SLOT
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowSlotPicker(true)}
                          className="bg-gradient-to-r from-[#8059ca] to-[#6d3fc7] border-none !text-white !rounded-sm px-3.5 py-[7px] !text-xs !font-bold cursor-pointer flex items-center gap-1.5 shadow-[0_2px_6px_rgba(128,89,202,0.35)] tracking-[0.3px] hover:-translate-y-px transition-all duration-200"
                        >
                          <Calendar size={12} />
                          {selectedDate && selectedTimeSlot ? "CHANGE SLOT" : "PICK SLOT"}
                        </button>
                      </div>

                      {selectedDate && selectedTimeSlot ? (
                        <div
                          className="bg-gradient-to-br from-[#f5f0ff] to-[#ede9ff] rounded-[10px] px-3.5 py-3 border border-[#c4b5fd] flex items-center gap-2.5"
                        >
                          <span className="w-9 h-9 rounded-[10px] bg-[#8059ca] flex items-center justify-center shrink-0">
                            <Calendar size={16} color="#fff" />
                          </span>
                          <div className="flex-1">
                            <div className="text-[11px] text-[#7c3aed] font-semibold mb-0.5">
                              Selected Slot
                            </div>
                            <div className="text-sm text-[#1e293b] font-bold">
                              {selectedSlot || (
                                selectedDate instanceof Date
                                  ? `${selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${selectedTimeSlot}`
                                  : `${selectedDate} · ${selectedTimeSlot}`
                              )}
                            </div>
                          </div>
                          <span className="w-[22px] h-[22px] rounded-full bg-[#16a34a] flex items-center justify-center shrink-0">
                            <Check size={12} color="#fff" />
                          </span>
                        </div>
                      ) : (
                        <div
                          onClick={() => setShowSlotPicker(true)}
                          className="border-[1.5px] border-dashed border-[#c4b5fd] rounded-[10px] px-3.5 py-2.5 bg-[#faf5ff] cursor-pointer flex items-center gap-3"
                        >
                          <div className="text-2xl shrink-0">📅</div>
                          <div>
                            <div className="text-[12.5px] text-[#7c3aed] font-semibold">No slot selected</div>
                            <div className="text-[11px] text-[#a78bfa] mt-0.5">Tap to pick a date &amp; time</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cart Breakdown Section */}
                  <div className={isSlotCategory ? "!pb-2" : ""}>
                    <div
                      className="!pb-3 !flex !justify-between !items-center !cursor-pointer"
                      onClick={() =>
                        setIsTotalFareExpanded(!isTotalFareExpanded)
                      }
                    >
                      <h6 className="!text-sm !font-semibold !m-0 !text-slate-800">
                        CART BREAKDOWN
                      </h6>
                      <i
                        className={`fas fa-chevron-${isTotalFareExpanded ? "up" : "down"} !text-gray-500 !text-xs`}
                      ></i>
                    </div>

                    {isTotalFareExpanded && (
                      <div className="!flex !flex-col !gap-3">
                        <div className="!pb-3 !border-b !border-[#f1f5f9]">
                          <div className="!text-[13px] !font-semibold !mb-2.5 !text-slate-800">
                            Booking Summary
                          </div>

                          {/* OFFERS & COUPONS */}
                          <div className="!mb-3">
                            <div
                              className={`group !flex !items-center !gap-3.5 !rounded-xl !border !p-3 !cursor-pointer !transition-all !duration-300 ${appliedCoupon
                                ? "!bg-gradient-to-r !from-[#f0fdf4] !to-[#ecfdf5] !border-[#86efac] !shadow-[0_4px_12px_rgba(34,197,94,0.06)]"
                                : "!bg-gradient-to-r !from-[#fbf9ff] !to-[#ffffff] !border-[#e2d5f8] hover:!border-[#8059ca]"
                                }`}
                              onClick={(e) => {
                                e.preventDefault();

                                const token = localStorage.getItem("medicomparestoken");

                                if (!token) {
                                  toast.error("Please login to apply coupons");
                                  navigate("/login");
                                  return;
                                }

                                setShowOffersModal(true);
                              }}
                            >
                              {/* Icon */}
                              <div
                                className={`!flex !h-10 !w-10 !items-center !justify-center !rounded-xl !text-base !text-white !shadow-sm ${appliedCoupon
                                  ? "!bg-gradient-to-br !from-[#22c55e] !to-[#15803d]"
                                  : "!bg-gradient-to-br !from-[#8059ca] !to-[#6d28d9]"
                                  }`}
                              >
                                <i className="fas fa-tags"></i>
                              </div>

                              {/* Content */}
                              <div className="!flex-1">
                                <div
                                  className={`!flex !items-center !justify-between !text-[12.5px] !font-semibold ${appliedCoupon ? "!text-[#166534]" : "!text-[#6d28d9]"
                                    }`}
                                >
                                  <span>
                                    {appliedCoupon ? "Coupon Applied Successfully!" : "Apply Coupon"}
                                  </span>

                                  <i className="fas fa-chevron-right !text-[10px] !opacity-60 !transition-transform !duration-200 group-hover:!translate-x-0.5"></i>
                                </div>

                                <div
                                  className={`!mt-1 !text-[11px] ${appliedCoupon ? "!text-[#15803d]" : "!text-slate-500"
                                    }`}
                                >
                                  {appliedCoupon ? (
                                    <div className="!flex !flex-wrap !items-center !justify-between !gap-2">
                                      <span className="!inline-flex !items-center !gap-1.5 !rounded-full !bg-[#ede9fe] !px-2.5 !py-0.5 !font-semibold !tracking-wide !text-[#6d28d9] !text-[10.5px]">
                                        <i className="fas fa-ticket-alt !text-[10px]" />
                                        {appliedCoupon.code || appliedCoupon.name}
                                      </span>

                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setAppliedCoupon(null);
                                        }}
                                        className="!rounded-full !bg-red-50 !px-2.5 !py-0.5 !text-[10.5px] !font-semibold !text-red-600 !transition-all !duration-200 hover:!bg-red-100 !border-0"
                                      >
                                        Remove
                                      </button>
                                    </div>
                                  ) : localStorage.getItem("medicomparestoken") ? (
                                    <span>
                                      View available coupons and save more on your order.
                                    </span>
                                  ) : (
                                    <span>Login to apply coupons.</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Manual Coupon Input */}
                            <div className="!flex !mt-2.5 !flex-row !w-full">
                              <input
                                type="text"
                                placeholder="Enter Coupon Code"
                                value={couponInputText}
                                onChange={(e) => setCouponInputText(e.target.value)}
                                className="!flex-1 !min-w-0 !border !border-slate-200 !rounded-l-xl !py-2 !px-3 !text-[12.5px] !outline-none !transition-colors !duration-200 focus:!border-[#8059ca] !bg-white"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleManualCouponApply();
                                }}
                                className="!bg-[#8059ca] !text-white !border-0 !rounded-r-xl !py-2 !px-4 !text-[12.5px] !font-semibold !cursor-pointer !transition-colors !duration-200 hover:!bg-[#6f42c1] !shrink-0"
                              >
                                Apply
                              </button>
                            </div>
                          </div>

                          <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                            <span className="!text-slate-500">
                              Subtotal<small> (Inclusive of all Taxes)</small>
                            </span>
                            <span className="!font-semibold !text-slate-800">
                              ₹{subtotal.toFixed(2)}
                            </span>
                          </div>

                          {(data?.medicineDetails?.CategoryDetails
                            ?.fixedType === "labtests" ||
                            cart?.type === "package") && (
                              <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                                <span className="!text-slate-500">
                                  Sample Collection fee
                                </span>
                                <span className="!font-semibold !text-slate-800">
                                  ₹{samplecollection.toFixed(2)}
                                </span>
                              </div>
                            )}
                          <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                            <span className="!text-slate-500">GST</span>
                            <span className="!font-semibold !text-slate-800">
                              ₹{tax.toFixed(2)}
                            </span>
                          </div>

                          {couponDiscount > 0 && (
                            <div className="!flex !justify-between !mb-2 !text-[12.5px] !text-[#065f46] !bg-emerald-50/50 !p-1.5 !rounded-lg !border !border-emerald-100">
                              <span className="!font-semibold !text-[#065f46]">
                                Coupon Discount
                                {appliedCoupon?.code
                                  ? ` (${appliedCoupon.code})`
                                  : ""}
                              </span>
                              <span className="!font-semibold !text-[#065f46]">
                                -₹{couponDiscount.toFixed(2)}
                              </span>
                            </div>
                          )}
                        </div>

                        {paymentMethod === "online" && walletAmount > 0 && (
                          <div className="!flex !justify-between !text-[12.5px] !font-semibold !text-[#047857] !mb-1.5">
                            <span>Wallet Amount</span>
                            <span>- ₹{(dudcutedWalletAmount || 0).toFixed(2)}</span>
                          </div>
                        )}

                        <div className="!flex !justify-between !items-center !mb-1.5">
                          <span className="!text-[13.5px] !font-semibold !text-slate-800">
                            Amount to Pay
                          </span>
                          <span className="!text-base !font-semibold !text-[#8059ca]">
                            ₹{amountToPay.toFixed(2)}
                          </span>
                        </div>

                        {appliedCoupon && couponDiscount > 0 && (
                          <div className="!bg-emerald-50 !rounded-lg !p-2.5 !text-center !border !border-emerald-100">
                            <div className="!text-[12px] !font-semibold !text-[#166534] !flex !items-center !justify-center !gap-1">
                              <i className="fa-solid fa-sparkles !text-emerald-500 animate-pulse" />
                              YOU SAVED A TOTAL OF ₹{couponDiscount.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Payment Method Section */}
                  <div className="!pt-4 !border-t !border-[#f1f5f9]">
                    <div className="!text-sm !font-semibold !mb-3 !text-slate-800">
                      Choose Payment Method
                    </div>

                    <div className={`!flex ${isMobile || isTablet ? "!flex-col" : "!flex-row"} !gap-2.5 !mb-4 !w-full !box-border`}>
                      {/* Online Option */}
                      <div
                        className={`!flex-1 !min-w-0 !border !rounded-xl !px-3.5 !py-3 !flex !items-center !gap-2.5 !cursor-pointer !transition-all !duration-200 ${paymentMethod === "online"
                          ? "!border-[#8059ca] !bg-[#fdfaff] !shadow-[0_4px_12px_rgba(128,89,202,0.06)]"
                          : "!border-[#e2e8f0] !bg-white hover:!border-[#cbd5e1] hover:!bg-[#fafbfc]"
                          }`}
                        onClick={() => setPaymentMethod("online")}
                      >
                        <div className={`!w-7.5 !h-7.5 !rounded-lg !flex !items-center !justify-center !text-xs !transition-all !duration-200 !shrink-0 ${paymentMethod === "online" ? "!bg-[#8059ca] !text-white" : "!bg-slate-100 !text-slate-500"}`}>
                          <i className="fas fa-credit-card" />
                        </div>
                        <div className="!flex-1 !min-w-0">
                          <div className={`!text-xs !font-semibold !mb-0.5 !whitespace-nowrap !overflow-hidden !text-ellipsis ${paymentMethod === "online" ? "!text-[#8059ca]" : "!text-slate-800"}`}>
                            Online Payment
                          </div>
                          <div className="!text-[10px] !text-slate-500 !whitespace-nowrap !overflow-hidden !text-ellipsis">UPI, Cards, NetBanking</div>
                        </div>
                        <div className={`!w-3.5 !h-3.5 !rounded-full !bg-white !transition-all !duration-200 !shrink-0 ${paymentMethod === "online" ? "!border-4 !border-[#8059ca]" : "!border-2 !border-slate-300"}`} />
                      </div>

                      {/* COD Option */}
                      <div
                        className={`!flex-1 !min-w-0 !border !rounded-xl !px-3.5 !py-3 !flex !items-center !gap-2.5 !cursor-pointer !transition-all !duration-200 ${paymentMethod === "cod"
                          ? "!border-[#8059ca] !bg-[#fdfaff] !shadow-[0_4px_12px_rgba(128,89,202,0.06)]"
                          : "!border-[#e2e8f0] !bg-white hover:!border-[#cbd5e1] hover:!bg-[#fafbfc]"
                          }`}
                        onClick={() => {
                          setPaymentMethod("cod");
                          setAppliedCoupon(null);
                        }}
                      >
                        <div className={`!w-7.5 !h-7.5 !rounded-lg !flex !items-center !justify-center !text-xs !transition-all !duration-200 !shrink-0 ${paymentMethod === "cod" ? "!bg-[#8059ca] !text-white" : "!bg-slate-100 !text-slate-500"}`}>
                          <i className="fas fa-money-bill-wave" />
                        </div>
                        <div className="!flex-1 !min-w-0">
                          <div className={`!text-xs !font-semibold !mb-0.5 !whitespace-nowrap !overflow-hidden !text-ellipsis ${paymentMethod === "cod" ? "!text-[#8059ca]" : "!text-slate-800"}`}>
                            Pay After Service
                          </div>
                          <div className="!text-[10px] !text-slate-500 !whitespace-nowrap !overflow-hidden !text-ellipsis">Pay at the time of delivery</div>
                        </div>
                        <div className={`!w-3.5 !h-3.5 !rounded-full !bg-white !transition-all !duration-200 !shrink-0 ${paymentMethod === "cod" ? "!border-4 !border-[#8059ca]" : "!border-2 !border-slate-300"}`} />
                      </div>
                    </div>

                    <hr className="!my-3 !border-slate-100" />

                    <form onSubmit={(e) => handleSubmit(e)}>
                      <input
                        type="hidden"
                        name="paymentMethod"
                        value={paymentMethod}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || (isSlotCategory && !hasSelectedSlot)}
                        className={`!w-full !text-white !rounded-xl !border-0 !py-2.5 !px-4 !mb-3 !transition-all !duration-300 !flex !items-center !justify-center !gap-2 !font-bold !text-xs ${isSubmitting || (isSlotCategory && !hasSelectedSlot) ? "!bg-gray-400 !cursor-not-allowed" : "!bg-gradient-to-r !from-[#8059ca] !to-[#822BD4] hover:!shadow-md active:!scale-[0.98] !cursor-pointer"}`}
                      >
                        {isSubmitting ? (
                          <>
                            <div
                              className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"
                              role="status"
                            />
                            Processing...
                          </>
                        ) : (
                          "PROCEED TO PAY"
                        )}
                      </button>
                      {isSlotCategory && !hasSelectedSlot && (
                        <p className="!text-xs !text-red-650 !-mt-1.5 !mb-2.5 !font-semibold">
                          Appointment slot is required before submitting order.
                        </p>
                      )}
                    </form>

                    <div className="!flex !gap-4 !justify-center !flex-wrap">
                      <div className="!flex !items-center !gap-1.5 !text-[11px] !text-gray-500">
                        <i className="fas fa-check-circle !text-[#28a745] !text-xs"></i>
                        <span>Health satisfaction guarantee</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                        <i className="fas fa-shield-alt text-[#007bff] text-xs"></i>
                        <span>Secure Payments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isMobile && productData?.length > 0 && (
            <div className="lg:col-span-3">
              <RecentlyViewedProducts
                products={relevantProducts}
                onProductClick={handleProductClick}
                onRentalBooking={handleRentalBookingProcess}
                onBooking={handleBooking}
                onAddLead={handleAddLead}
              />
            </div>
          )}
        </div>
      </div>

      {/* Show SlotPicker only when categoryType is "slots" */}
      {
        isSlotCategory && (
          <Offcanvas
            show={showSlotPicker}
            onHide={() => setShowSlotPicker(false)}
            placement="end"
            className="z-[9999999999]"
          >
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Book A Slot</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <VendorCalendarSlotPicker
                layout="row"
                selectedDate={selectedDate}
                selectedTimeSlot={selectedTimeSlot}
                calendarDays={slotCalendarDays}
                calendarMonth={slotCalendarMonth}
                calendarYear={slotCalendarYear}
                isLoading={slotTimingsLoading}
                onMonthChange={(month, year) => {
                  fetchSlotVendorCalendar(month, year);
                }}
                confirmLabel="Confirm Slot"
                onSelectSlot={(date, time) => {
                  setSelectedDate(date);
                  setSelectedTimeSlot(time);
                  const day = date.getDate();
                  const monthNames = [
                    "Jan",
                    "Feb",
                    "Mar",
                    "Apr",
                    "May",
                    "Jun",
                    "Jul",
                    "Aug",
                    "Sep",
                    "Oct",
                    "Nov",
                    "Dec",
                  ];
                  const month = monthNames[date.getMonth()];
                  const formattedSlot = `${day} ${month}, ${date.getFullYear()}, ${time.toLowerCase()}`;
                  setSelectedSlot(formattedSlot);
                  setShowSlotPicker(false);
                }}
              />
            </Offcanvas.Body>
          </Offcanvas>
        )
      }

      <LocationOffcanvas
        isOpen={showLocationOffcanvas}
        onClose={closeLocationOffcanvas}
        position={offcanvasPosition}
        source="booking"
        onAddressSelect={(address) => {
          setSelectedAddress(address);
        }}
      />

      {
        (() => {
          const getCouponsList = (type) => {
            if (couponList) {
              if (type === "admin" && Array.isArray(couponList.adminCoupons)) {
                return couponList.adminCoupons;
              }
              if (type === "vendor" && Array.isArray(couponList.vendorCoupons)) {
                return couponList.vendorCoupons;
              }
              if (Array.isArray(couponList)) {
                return couponList.filter((c) => c.createdType === type);
              }
            }
            return [];
          };

          const cartVendorIds = [
            String(
              data?.vendorDetails?.vendorId ||
              data?.vendorId ||
              cart?.vendorId ||
              data?.businessDetails?._id ||
              "",
            ),
          ];

          const mapCoupons = (coupons, isVendorCoupon) => {
            return coupons.map((coupon) => {
              const isApplied = appliedCoupon?._id === coupon._id;
              const baseAmount = isVendorCoupon ? subtotal : total;

              let isEligible = true;
              let criteriaText = "";
              let hasExpired = false;

              if (coupon?.endDate) {
                const endDateStamp = new Date(coupon.endDate).getTime();
                const nowStamp = new Date().getTime();
                if (endDateStamp < nowStamp) {
                  hasExpired = true;
                  criteriaText = "Coupon has expired";
                }
              }

              if (hasExpired) {
                isEligible = false;
              } else if (baseAmount < coupon.minimumPurchase) {
                isEligible = false;
                const diff = (coupon.minimumPurchase - baseAmount).toFixed(2);
                criteriaText = `Add ₹${diff} more to apply`;
              } else if (coupon?.canUseCoupon === false) {
                isEligible = false;
              } else if (coupon?.remainingUses === 0) {
                isEligible = false;
              }

              const savingsPreview = isEligible ? calculateCouponDiscount(coupon, baseAmount) : 0;

              return {
                ...coupon,
                isApplied,
                isEligible,
                criteriaText,
                savingsPreview,
              };
            });
          };

          const sortedVendorCoupons = mapCoupons(getCouponsList("vendor"), true).sort((a, b) => {
            const aMatches =
              cartVendorIds.includes(String(a.createdBy)) ||
              cartVendorIds.includes(String(a.businessDetails?._id));
            const bMatches =
              cartVendorIds.includes(String(b.createdBy)) ||
              cartVendorIds.includes(String(b.businessDetails?._id));

            if (aMatches && !bMatches) return -1;
            if (!aMatches && bMatches) return 1;

            return (b.discount || 0) - (a.discount || 0);
          });

          const sortedAdminCoupons = mapCoupons(getCouponsList("admin"), false).sort(
            (a, b) => (b.discount || 0) - (a.discount || 0),
          );

          return (
            <CouponOffersModal
              show={showOffersModal}
              onClose={() => setShowOffersModal(false)}
              onApplyCoupon={handleCouponApply}
              adminCoupons={sortedAdminCoupons}
              vendorCoupons={sortedVendorCoupons}
            />
          );
        })()
      }

      <LeadModal
        show={showLeadModal}
        onClose={() => {
          setShowLeadModal(false);
          setLeadFormData({ name: "", mobile: "", email: "", address: "", policyNumber: "", relation: "self", date: "" });
          setCurrentLeadData(null);
        }}
        formData={leadFormData}
        onChange={(e) => setLeadFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
        productId={currentLeadData?.med?._id || currentLeadData?.med?.id || null}
        vendorId={currentLeadData?.vendor?.bussinessdetails?.vendorId || currentLeadData?.vendor?.vendorId || currentLeadData?.vendor?._id || null}
        onSubmit={handleSubmitLead}
      />

      <Footer />
    </div >
  );
};

export default BookingProcess;