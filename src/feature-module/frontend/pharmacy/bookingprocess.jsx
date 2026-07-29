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
import { Offcanvas } from "react-bootstrap";
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

  const renderRecentlyViewed = () => {
    if (!(relevantProducts?.length > 0)) return null;
    return (
      <div className="card shadow-sm mb-3 rounded-xl border-0 bg-[url('/assets/Medicompares_Background.png')] bg-cover bg-center bg-no-repeat">
        <div className="card-body p-2">
          {/* Header */}
          <div className="flex justify-start gap-3 items-center mb-2 border-l-4 border-[#8059ca] pl-3 leading-none">
            <div className="text-xl font-medium text-[#0f172a] m-0">
              Recently Viewed Products
            </div>
            <span className="text-[11px] text-[#8059ca] font-bold bg-[#f3e8ff] px-2.5 py-1 rounded-full uppercase tracking-wide">
              {relevantProducts.length} items
            </span>
          </div>

          <style>{`
            @keyframes comparePulse {
              0% {
                box-shadow: 0 0 0 0 rgba(128, 89, 202, 0.6);
              }
              70% {
                box-shadow: 0 0 0 6px rgba(128, 89, 202, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(128, 89, 202, 0);
              }
            }
            @keyframes compareAutoExpand {
              0%, 10%, 40%, 100% {
                width: 32px;
              }
              15%, 35% {
                width: 90px;
              }
            }
            @keyframes textFadeInOut {
              0%, 12%, 38%, 100% {
                opacity: 0;
              }
              15%, 35% {
                opacity: 1;
              }
            }
            .compare-btn-highlight {
              animation: comparePulse 2s infinite, compareAutoExpand 8s infinite ease-in-out;
            }
            .compare-text-label {
              animation: textFadeInOut 8s infinite ease-in-out;
            }
            .compare-btn-highlight:hover {
              animation: comparePulse 2s infinite !important;
            }
            .compare-btn-highlight:hover .compare-text-label {
              animation: none !important;
              opacity: 1 !important;
            }
          `}</style>

          {/* Carousel */}
          <div className="relative flex items-center">
            {/* Left Scroll */}
            <button
              className="meq-arrow-btn dental-prev flex -left-[15px]"
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) container.scrollLeft -= 250;
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            {/* Cards */}
            <div
              id="productCarousel"
              className="scroll-container flex overflow-x-auto gap-2 px-[60px] py-3 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            >
              {relevantProducts?.map((product, index) => {
                const originalPrice = product?.price || 0;
                const discountPrice = product?.discountprice || null;
                const discountType = product?.discountType || null;

                let calculatedDiscountPrice = discountPrice;
                let hasValidDiscount = false;

                if (discountType === "percentage" && discountPrice && discountPrice > 0) {
                  calculatedDiscountPrice = originalPrice - (originalPrice * discountPrice) / 100;
                  hasValidDiscount = true;
                } else if (discountPrice && discountPrice > 0 && discountPrice < originalPrice) {
                  calculatedDiscountPrice = discountPrice;
                  hasValidDiscount = true;
                }

                const displayPrice = hasValidDiscount ? calculatedDiscountPrice : originalPrice;
                const discountPercent = hasValidDiscount
                  ? discountType === "percentage"
                    ? discountPrice
                    : Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
                  : 0;

                const productImage =
                  product?.combinedvariant?.files?.[0] ||
                  product?.tabletDetails?.files?.[0] ||
                  (Array.isArray(product?.tabletDetails?.imageUrl)
                    ? product.tabletDetails.imageUrl[0]
                    : product?.tabletDetails?.imageUrl) ||
                  "/assets/default.png";

                const vendorName = product?.vendor?.name || "Vendor";
                const vendorImage = product?.vendor?.bussiness_image?.[0]?.url || "";

                return (
                  <div
                    key={`${product._id || "product"}-${product.vendor?.vendorId || "vendor"}-${product.combinedvariant?.variantId || "variant"}-${index}`}
                    className="min-w-[220px] max-w-[220px] bg-white rounded-xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] flex flex-col shrink-0 transition-all duration-300 relative overflow-hidden hover:-translate-y-[3px] hover:border-[#8059ca] hover:shadow-[0_8px_24px_rgba(128,89,202,0.15)]"
                  >
                    {/* Compare Button */}
                    <div className="compare-btn-highlight absolute right-2 top-2 z-10 cursor-pointer bg-[#8059ca] text-white border-[1.5px] border-[#8059ca] rounded-[20px] w-8 h-[26px] flex items-center justify-start pl-[9px] shadow-[0_2px_8px_rgba(128,89,202,0.4)] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden whitespace-nowrap hover:w-[90px] hover:bg-[#6a45b3] hover:border-[#6a45b3]">
                      <Link
                        to={`/${product?.tabletDetails?.subcategoryDetails?.categoryDetails?.slug}/${product?.tabletDetails?.subcategoryDetails?.slug}/${product?.tabletDetails?.slug}/compare`}
                        className="flex items-center text-white no-underline"
                      >
                        <i className="fa-solid fa-right-left shrink-0 text-[11px] text-white"></i>
                        <span className="compare-text-label ml-1.5 text-[11px] font-semibold text-white transition-opacity duration-200 ease-in-out">
                          Compare
                        </span>
                      </Link>
                    </div>

                    {/* Image */}
                    <div
                      className="w-full h-[130px] bg-[#f8f4ff] flex items-center justify-center p-3 cursor-pointer"
                      onClick={() => handleProductClick(product)}
                    >
                      <img
                        src={getImageUrl(productImage)}
                        alt="product"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    {/* Details */}
                    <div className="p-3 flex flex-col gap-2 flex-1">
                      {/* Name */}
                      <div className="cursor-pointer" onClick={() => handleProductClick(product)}>
                        <div className="text-[13px] font-medium text-[#0f172a] m-0 leading-[1.3] capitalize line-clamp-2 h-[34px] [display:-webkit-box] [-webkit-box-orient:vertical]">
                          {product?.tabletDetails?.name}
                        </div>
                      </div>

                      {/* Seller & Rating */}
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          <img
                            src={getImageUrl(vendorImage)}
                            alt={vendorName}
                            className="w-6 h-6 rounded-full object-cover bg-slate-100 shrink-0"
                            onError={(e) => { e.target.src = "/assets/img/logo.png"; }}
                          />
                          <span
                            className="text-[12.5px] font-semibold text-slate-700 text-ellipsis overflow-hidden whitespace-nowrap flex-1"
                            title={vendorName}
                          >
                            {vendorName}
                          </span>
                        </div>
                        <div className="flex items-center gap-0.5 shrink-0">
                          <span className="text-[11px] text-amber-400">★</span>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {product.tabletDetails?.averageRating ? product.tabletDetails.averageRating.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex flex-col gap-px">
                        <div className="flex items-center flex-wrap">
                          <span className="text-[15px] font-bold text-[#0f172a]">
                            ₹{displayPrice.toFixed(2)}
                          </span>
                          {hasValidDiscount && (
                            <span className="text-[11px] line-through text-slate-400 ml-1.5">
                              ₹{Number(originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {hasValidDiscount && (
                          <span className="text-[10px] font-bold text-red-600">
                            {discountPercent}% OFF
                          </span>
                        )}
                        {product?.perDayRent && (
                          <span className="text-[10px] text-slate-500">
                            ₹{Number(product.perDayRent).toFixed(2)}/day
                          </span>
                        )}
                      </div>

                      <div className="mt-auto w-full">
                        <div className="border-t border-slate-100 my-0.5 mb-1" />
                        <VendorActions
                          bookingType={
                            product?.tabletDetails?.subcategoryDetails?.categoryDetails?.categoryType || product?.bookingType ||
                            "cart"
                          }
                          med={{
                            ...product.tabletDetails,
                            productId: product.name,
                          }}
                          vendor={{
                            ...product.vendor,
                            vendorId: product.vendor?.vendorId,
                          }}
                          price={parseFloat(product.combinedvariant?.price) || 0}
                          calculatedDiscountPrice={parseFloat(product.combinedvariant?.discountprice || product.discountprice) || null}
                          service={
                            product?.tabletDetails?.subcategoryDetails?.categoryDetails?.fixedType
                          }
                          rentPerDay={product?.perDayRent}
                          className="custom-cart-controls w-100"
                          containerStyle={{
                            display: "flex",
                            width: "100%",
                          }}
                          selectedVariant={product.combinedvariant}
                          effectiveVariantId={product.combinedvariant?.variantId}
                          isVariant={!!product.combinedvariant}
                          handleRentalBookinProcess={handleRentalBookinProcess}
                          handleNavigateToBooking={handleBooking}
                          handleAddLead={handleAddLead}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll */}
            <button
              className="meq-arrow-btn dental-next flex -right-[15px]"
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) container.scrollLeft += 250;
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="main-wrapper min-h-screen bg-[#f8f9fa]">
      <Home2Header />
      <CategoryProvider />

      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-8 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 flex flex-col gap-6">
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
                                    className="inline-flex btn btn-primary items-center gap-2 py-[5px] px-2.5 bg-[#8059ca] text-white text-sm font-medium no-underline rounded-lg border border-[#6d46b5] shadow-[0_3px_8px_rgba(128,89,202,0.25)] transition-all duration-[250ms] ease cursor-pointer hover:bg-[#6d46b5] hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(128,89,202,0.35)]"
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
                          <div className="rounded-[10px] overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                            <div className="flex justify-between items-center border border-[#e0e0e0] py-4 px-[5px] bg-white rounded-tr-[10px] rounded-tl-[10px]">
                              <div
                                className={`top-vendor-badge ${isMobile ? "text-xs" : "text-xs"} font-semibold`}
                              // className="top-vendor-badge"
                              >
                                <i className="fas fa-bolt"></i>{" "}
                                <span className={isMobile ? "text-xs" : "text-[13px]"}>
                                  {getAddressTypeLabel()}
                                </span>
                              </div>
                              <div>
                                <button
                                  className={`text-[#8059ca] bg-transparent border-0 font-semibold cursor-pointer ${isMobile ? "text-xs" : "text-[13px]"}`}
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
                              <div className="border border-[#e0e0e0] border-t-0 p-4 bg-white text-sm text-[#333] rounded-bl-[10px] rounded-br-[10px]">
                                {selectedAddress ? (
                                  <div>
                                    {selectedAddress.name && (
                                      <div className="font-bold mb-1">
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
                                      <div>{selectedAddress.location.address} </div>
                                    )}
                                  </div>
                                ) : (
                                  selectedAddress?.address || ""
                                )}
                              </div>
                            ) : (
                              <div className="border border-[#e0e0e0] border-t-0 p-4 bg-white text-sm text-[#333] rounded-bl-[10px] rounded-br-[10px] flex items-center gap-2">
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
                        <div className="choice-cards-container flex gap-3">
                          <div className="choice-card-wrapper flex-1">
                            <label className={`choice-card flex items-center gap-2 border rounded-lg p-1 cursor-pointer transition-all ${personType === "self" ? "selected border-[#8059ca] bg-[#f8f4ff]" : "border-[#e0e0e0] bg-white"}`}>
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
                                className="hidden"
                              />
                              <i className="fas fa-user choice-card-icon"></i>
                              <span className="choice-card-text">Self</span>
                            </label>
                          </div>

                          <div className="choice-card-wrapper flex-1">
                            <label className={`choice-card flex items-center gap-2 border rounded-lg p-1 cursor-pointer transition-all ${personType === "forWhom" ? "selected border-[#8059ca] bg-[#f8f4ff]" : "border-[#e0e0e0] bg-white"}`}>
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
                                className="hidden"
                              />
                              <i className="fas fa-users choice-card-icon"></i>
                              <span className="choice-card-text">For Whom</span>
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

            <div className="card shadow-sm mb-3 order-2 order-md-1 rounded-xl border-0">
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
                        <div className={`flex items-center flex-wrap ${isMobile ? "gap-2" : "gap-3"} ${isMobile ? "mb-3" : "mb-0"}`}>
                          {discountPrice && mrpPrice > pricePerItem ? (
                            <>
                              <span className="text-xl font-semibold text-black">
                                ₹{pricePerItem.toFixed(2)}
                              </span>
                              <span className="text-base text-gray-400 line-through">
                                ₹{mrpPrice.toFixed(2)}
                              </span>

                              {discountPercent > 0 && (
                                <span className="badge bg-[#28a745] text-white text-xs py-1 px-2 rounded">
                                  {discountPercent}% OFF
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xl font-bold text-black">
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
                            <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                              <i className="fas fa-info-circle text-[#8059ca] text-xs"></i>
                              Condition : {data?.medicineDetails?.condition}
                            </li>
                          )}
                          {data?.medicineDetails?.machineType && (
                            <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                              <i className="fas fa-cogs text-[#8059ca] text-xs"></i>
                              Machine Type : {data?.medicineDetails?.machineType}
                            </li>
                          )}

                          {data?.medicineDetails?.compositionDetails?.name && (
                            <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                              <i className="fas fa-mortar-pestle text-[#8059ca] text-xs"></i>
                              Composition : {data?.medicineDetails?.compositionDetails?.name}
                            </li>
                          )}

                          {data?.medicineDetails?.reportsDuration && (
                            <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                              <i className="fas fa-clock text-[#8059ca] text-xs"></i>
                              {data?.medicineDetails?.reportsDuration.slice(0, 40) ||
                                data?.reportsDuration ||
                                "24"}
                            </li>
                          )}
                          {testsCount && (
                            <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                              <i className="fas fa-vial text-[#8059ca] text-xs"></i>
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
                            className="text-[13px] text-red-600 no-underline cursor-pointer flex items-center gap-1.5"
                          >
                            <i className="fas fa-trash-alt text-xs"></i>
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
            {!isMobile && productData?.length > 0 && (
              <div className="mt-2 order-lg-last">
                {renderRecentlyViewed()}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className={isMobile ? "relative top-0" : "sticky top-5 flex flex-col gap-6"}>
              {isSlotCategory && (
                <div className="card shadow-sm mb-4 rounded-xl border-0">
                  <div className="card-body p-3">
                    {/* Visit Type Option */}
                    {serviceDetails?.visitType && (
                      <div className="mb-4 border-b border-gray-100 pb-3">
                        <h6 className="text-xs font-bold text-[#8059ca] uppercase tracking-wide mb-2">
                          Visit Type
                        </h6>
                        {serviceDetails.visitType.toLowerCase() === "both" ? (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedVisitType("home")}
                              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${selectedVisitType === "home" ? "border-2 border-[#8059ca] bg-[#f8f4ff] text-[#8059ca]" : "border border-[#ddd] bg-white text-[#333]"}`}
                            >
                              <i className="fas fa-home"></i> Home Visit
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedVisitType("center")}
                              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs cursor-pointer transition-all duration-200 flex items-center justify-center gap-1.5 ${selectedVisitType === "center" ? "border-2 border-[#8059ca] bg-[#f8f4ff] text-[#8059ca]" : "border border-[#ddd] bg-white text-[#333]"}`}
                            >
                              <i className="fas fa-building"></i> Visit Center
                            </button>
                          </div>
                        ) : serviceDetails.visitType.toLowerCase() === "home" ? (
                          <div className="py-2 px-3 bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg text-[#065f46] text-xs font-semibold flex items-center gap-2">
                            <i className="fas fa-home text-[#059669]"></i>
                            Home Service Only Available
                          </div>
                        ) : (
                          <div className="py-2 px-3 bg-[#fffbeb] border border-[#fde68a] rounded-lg text-[#b45309] text-xs font-semibold flex items-center gap-2">
                            <i className="fas fa-exclamation-circle text-[#d97706]"></i>
                            Please visit the center for this booking
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex justify-between items-center mb-3">
                      <h6 className="text-sm font-semibold  m-0">
                        APPOINTMENT SLOT
                      </h6>
                      <button
                        onClick={() => setShowSlotPicker(true)}
                        className="highlighted-pick-slot-btn"
                      >
                        PICK SLOT
                      </button>
                    </div>
                    {selectedSlot || formatSelectedSlot() ? (
                      <div className="bg-[rgba(236,236,238,1)] rounded-lg p-3 text-[13px] text-black mb-3">
                        {selectedSlot ||
                          formatSelectedSlot() ||
                          "Select a slot"}
                      </div>
                    ) : (
                      <div className="bg-[#f8f4ff] rounded-lg p-3 text-[13px] text-[#8059ca] mb-3">
                        No slot selected
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="card shadow-sm mb-3 rounded-xl border-0">
                <div className="card-body p-0">
                  <div
                    className="p-4 border-b border-[#e0e0e0] cursor-pointer"
                    onClick={() =>
                      setIsTotalFareExpanded(!isTotalFareExpanded)
                    }
                  >
                    <div className="flex justify-between items-center">
                      <h6 className="text-sm font-semibold m-0 font-[500]">
                        CART BREAKDOWN
                      </h6>
                      <i
                        className={`fas fa-chevron-${isTotalFareExpanded ? "up" : "down"} ext-gray-600 text-xs`}
                      // className="text-gray-600 text-xs"
                      ></i>
                    </div>
                  </div>

                  {isTotalFareExpanded && (
                    <div className="p-4">
                      <div className="mb-4 pb-4 border-b border-[#e0e0e0]">
                        <div className="text-sm font-semibold mb-3 text-black">
                          Booking Summary
                        </div>

                        {/* OFFERS & COUPONS */}
                        <div className="mb-4">
                          <div
                            className="flex gap-3 bg-[#ecfdf5] p-4 rounded-xl items-center cursor-pointer border border-[#d1fae5]"
                            onClick={(e) => {
                              e.preventDefault();
                              const token =
                                localStorage.getItem("medicomparestoken");
                              if (!token) {
                                toast.error("Please login to apply coupons");
                                navigate("/login");
                                return;
                              }
                              setShowOffersModal(true);
                            }}
                          >
                            <div className="w-10 h-10 bg-[#16a34a] rounded-full flex items-center justify-center text-white text-base font-bold">
                              %
                            </div>

                            <div className="flex-1">
                              <div className="flex items-center justify-between text-sm font-semibold text-[#065f46] mb-0.5 cursor-pointer">
                                <span>Apply Coupon</span>
                                <i className="fas fa-chevron-right" />
                              </div>

                              <div className="text-xs text-[#047857]">
                                {appliedCoupon ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span>
                                      Applied:{" "}
                                      {appliedCoupon.code ||
                                        appliedCoupon.name}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setAppliedCoupon(null);
                                      }}
                                      className="bg-transparent border-0 p-0 cursor-pointer text-[#065f46] underline font-semibold text-xs"
                                    >
                                      Remove
                                    </button>
                                  </div>
                                ) : localStorage.getItem(
                                  "medicomparestoken",
                                ) ? (
                                  "View available coupons"
                                ) : (
                                  "Login to apply coupons"
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Manual Coupon Input */}
                          <div className="flex gap-2 mt-3 flex-row w-full">
                            <input
                              type="text"
                              placeholder="Enter Coupon Code"
                              value={couponInputText}
                              onChange={(e) => setCouponInputText(e.target.value)}
                              className="flex-1 min-w-0 border border-slate-300 rounded-lg py-2 px-3 text-[13px] outline-none transition-colors duration-200 focus:border-[#8059ca]"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                handleManualCouponApply();
                              }}
                              className="bg-[#8059ca] text-white border-0 rounded-lg py-2 px-4 text-[13px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#6f42c1] shrink-0"
                            >
                              Apply
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-between mb-2 text-[13px]">
                          <span className="text-gray-600">
                            Subtotal<small> (Inclusive of all Taxes)</small>
                          </span>
                          <span className="font-semibold text-black">
                            ₹{subtotal.toFixed(2)}
                          </span>
                        </div>

                        {(data?.medicineDetails?.CategoryDetails
                          ?.fixedType === "labtests" ||
                          cart?.type === "package") && (
                            <div className="flex justify-between mb-2 text-[13px]">
                              <span className="text-gray-600">
                                Sample Collection fee
                              </span>
                              <span className="font-semibold text-black">
                                ₹{samplecollection.toFixed(2)}
                              </span>
                            </div>
                          )}
                        <div className="flex justify-between mb-2 text-[13px]">
                          <span className="text-gray-600">GST</span>
                          <span className="font-semibold text-black">
                            ₹{tax.toFixed(2)}
                          </span>
                        </div>

                        {couponDiscount > 0 && (
                          <div className="flex justify-between mb-2 text-[13px] text-[#065f46]">
                            <span className="font-semibold text-[#065f46]">
                              Coupon Discount
                              {appliedCoupon?.code
                                ? ` (${appliedCoupon.code})`
                                : ""}
                            </span>
                            <span className="font-bold text-[#065f46]">
                              -₹{couponDiscount.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      {paymentMethod === "online" && walletAmount > 0 && (
                        <>
                          <div className="flex justify-between text-sm font-semibold text-[#047857] mb-3">
                            <span>Wallet Amount</span>
                            <span> - ₹{(dudcutedWalletAmount || 0).toFixed(2)}</span>
                          </div>
                        </>
                      )}

                      <div className="flex justify-between items-center mb-4">
                        <span className="text-base font-semibold text-black">
                          Amount to Pay
                        </span>
                        <span className="text-lg font-semibold text-black">
                          ₹{amountToPay.toFixed(2)}
                        </span>
                      </div>

                      {appliedCoupon && couponDiscount > 0 && (
                        <div className="bg-[#ECFDF5] rounded-lg p-3 text-center mb-4 border border-[#D1FAE5]">
                          <div className="text-[13px] font-semibold text-[#166534]">
                            YOU SAVED A TOTAL OF ₹{couponDiscount.toFixed(2)}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="card shadow-sm mb-4 rounded-xl border-0">
                <div className="card-body p-3">
                  <div className="text-base font-semibold my-6 mb-4 text-black">
                    Choose Payment Method
                  </div>

                  <div className={`flex ${isMobile || isTablet ? "flex-col" : "flex-row"} gap-2 mb-4 w-full box-border`}>
                    {/* Online Option */}
                    <div
                      // className={`flex-1 min-w-0 rounded-xl py-2.5 px-3 flex items-center gap-2 cursor-pointer transition-all duration-200 box-border ${paymentMethod === "online" ? "border-2 border-[#8059ca] bg-[#fdfaff] shadow-[0_4px_12px_rgba(128,89,202,0.08)]" : "border-[1.5px] border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"}`}
                      className={`flex-1 min-w-0 border rounded-xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${paymentMethod === "online"
                        ? "border-[#8059ca] bg-[#fdfaff] shadow-[0_4px_12px_rgba(128,89,202,0.08)]"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#fafbfc]"
                        }`}
                      onClick={() => setPaymentMethod("online")}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 shrink-0 ${paymentMethod === "online" ? "bg-[#8059ca] text-white" : "bg-slate-100 text-slate-500"}`}>
                        <i className="fas fa-credit-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold mb-px whitespace-nowrap overflow-hidden text-ellipsis ${paymentMethod === "online" ? "text-[#8059ca]" : "text-slate-800"}`}>
                          Online Payment
                        </div>
                        <div className="text-[10px] text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">UPI, Cards, NetBanking</div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 shrink-0 ${paymentMethod === "online" ? "border-4 border-[#8059ca]" : "border-2 border-slate-300"}`} />
                    </div>

                    {/* COD Option */}
                    <div
                      className={`flex-1 min-w-0 border rounded-xl px-3.5 py-3 flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${paymentMethod === "cod"
                        ? "border-[#8059ca] bg-[#fdfaff] shadow-[0_4px_12px_rgba(128,89,202,0.08)]"
                        : "border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#fafbfc]"
                        }`}
                      onClick={() => {
                        setPaymentMethod("cod");
                        setAppliedCoupon(null);
                      }}
                    >
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 shrink-0 ${paymentMethod === "cod" ? "bg-[#8059ca] text-white" : "bg-slate-100 text-slate-500"}`}>
                        <i className="fas fa-money-bill-wave" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-xs font-bold mb-px whitespace-nowrap overflow-hidden text-ellipsis ${paymentMethod === "cod" ? "text-[#8059ca]" : "text-slate-800"}`}>
                          Pay After Service
                        </div>
                        <div className="text-[10px] text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis">Pay at the time of delivery</div>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 shrink-0 ${paymentMethod === "cod" ? "border-4 border-[#8059ca]" : "border-2 border-slate-300"}`} />
                    </div>
                  </div>

                  <hr className="my-2.5 border-gray-200" />

                  <form onSubmit={(e) => handleSubmit(e)}>
                    <input
                      type="hidden"
                      name="paymentMethod"
                      value={paymentMethod}
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || (isSlotCategory && !hasSelectedSlot)}
                      className={`w-full text-white rounded-sm border-0 rounded-lg p-2 mb-3 transition-all duration-300 flex items-center justify-center gap-2 ${isSubmitting || (isSlotCategory && !hasSelectedSlot) ? "bg-gray-400 cursor-not-allowed" : "bg-[#8059ca] cursor-pointer"}`}
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
                      <p className="text-xs text-red-600 -mt-1.5 mb-2.5">
                        Appointment slot is required before submitting order.
                      </p>
                    )}
                  </form>

                  <div className="flex gap-4 justify-center flex-wrap">
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <i className="fas fa-check-circle text-[#28a745] text-sm"></i>
                      <span>Health satisfaction guarantee</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-600">
                      <i className="fas fa-shield-alt text-[#007bff] text-sm"></i>
                      <span>Secure Payments</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isMobile && productData?.length > 0 && (
            <div className="lg:col-span-3">
              {renderRecentlyViewed()}
            </div>
          )}
        </div>
      </div>

      {/* Show SlotPicker only when categoryType is "slots" */}
      {isSlotCategory && (
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
      )}

      <LocationOffcanvas
        isOpen={showLocationOffcanvas}
        onClose={closeLocationOffcanvas}
        position={offcanvasPosition}
        source="booking"
        onAddressSelect={(address) => {
          setSelectedAddress(address);
        }}
      />

      {/*  Coupon modal */}
      {showOffersModal && (
        <div
          className="offers-modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setShowOffersModal(false)}
        >
          <div
            className="offers-modal-content max-w-[580px] w-full bg-white rounded-xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="offers-modal-header flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="offers-modal-title text-lg font-semibold m-0">Apply Coupon</h3>
              <button
                className="offers-modal-close bg-transparent border-0 text-2xl leading-none cursor-pointer"
                onClick={() => setShowOffersModal(false)}
              >
                ×
              </button>
            </div>

            {(() => {
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

              const adminCoupons = getCouponsList("admin");
              const vendorCoupons = getCouponsList("vendor");

              return (
                <>
                  <div className="offers-modal-body p-3 bg-slate-50 overflow-y-auto">
                    <div className="offers-list flex flex-col gap-3.5">
                      {(() => {
                        const cartVendorIds = [
                          String(
                            data?.vendorDetails?.vendorId ||
                            data?.vendorId ||
                            cart?.vendorId ||
                            data?.businessDetails?._id ||
                            "",
                          ),
                        ];

                        const sortedVendorCoupons = [...vendorCoupons].sort((a, b) => {
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

                        const sortedAdminCoupons = [...adminCoupons].sort(
                          (a, b) => (b.discount || 0) - (a.discount || 0),
                        );

                        const getDiscountTier = (coupon) => {
                          const amount = parseFloat(coupon.discount) || 0;
                          if (coupon.discountType === "fixed") {
                            if (amount >= 300) return "mega";
                            if (amount >= 150) return "hot";
                            if (amount >= 50) return "good";
                            return "saver";
                          }
                          if (amount >= 30) return "mega";
                          if (amount >= 20) return "hot";
                          if (amount >= 10) return "good";
                          return "saver";
                        };

                        const couponThemes = {
                          saver: {
                            label: "Saver",
                            bg: "bg-[#fafffb]",
                            border: "border-[#d1fae5]",
                            accent: "text-[#22c55e]",
                            badgeBg: "bg-[#f0fdf4]",
                            badgeText: "text-[#16a34a]",
                            btnBg: "bg-[#f0fdf4]",
                            btnText: "text-[#16a34a]",
                            btnBorder: "border-[#bbf7d0]",
                          },
                          good: {
                            label: "Good Deal",
                            bg: "bg-[#f8fbff]",
                            border: "border-[#dbeafe]",
                            accent: "text-[#3b82f6]",
                            badgeBg: "bg-[#eff6ff]",
                            badgeText: "text-[#2563eb]",
                            btnBg: "bg-[#eff6ff]",
                            btnText: "text-[#2563eb]",
                            btnBorder: "border-[#bfdbfe]",
                          },
                          hot: {
                            label: "Hot Deal",
                            bg: "bg-[#fffdf7]",
                            border: "border-[#fde68a]",
                            accent: "text-[#d97706]",
                            badgeBg: "bg-[#fffbeb]",
                            badgeText: "text-[#b45309]",
                            btnBg: "bg-[#fffbeb]",
                            btnText: "text-[#d97706]",
                            btnBorder: "border-[#fcd34d]",
                          },
                          mega: {
                            label: "Mega Save",
                            bg: "bg-[#fcfaff]",
                            border: "border-[#e9d5ff]",
                            accent: "text-[#8059ca]",
                            badgeBg: "bg-[#f5f3ff]",
                            badgeText: "text-[#7c3aed]",
                            btnBg: "bg-[#f3e8ff]",
                            btnText: "text-[#8059ca]",
                            btnBorder: "border-[#ddd6fe]",
                          },
                        };

                        const renderCouponCard = (ele, ind, isVendorCoupon) => {
                          const isApplied = appliedCoupon?._id === ele._id;
                          const discountText =
                            ele.discountType === "fixed"
                              ? `₹${ele.discount}`
                              : `${ele.discount}%`;

                          const matchesCartVendor =
                            isVendorCoupon &&
                            (cartVendorIds.includes(String(ele.createdBy)) ||
                              cartVendorIds.includes(String(ele.businessDetails?._id)));

                          let applicableAmount = 0;
                          let isEligible = true;
                          let criteriaText = "";
                          const getEffectivePrice = (item) => {
                            const discountprice =
                              parseFloat(item.discountprice || item.discountPrice) || null;
                            const price = parseFloat(item.price) || 0;
                            let calculatedDiscountPrice = discountprice;
                            const discountType = item.discountType || null;

                            if (discountType === "percentage" && discountprice && discountprice > 0) {
                              calculatedDiscountPrice = price - (price * discountprice) / 100;
                            }

                            return calculatedDiscountPrice && calculatedDiscountPrice > 0
                              ? calculatedDiscountPrice
                              : price;
                          };

                          const cartItems = typeof relevantProducts !== 'undefined' && relevantProducts.length > 0
                            ? relevantProducts.map(item => ({
                              vendorId: item.vendor?.vendorId || item.vendorId || item.vendor?._id || item.vendorDetails?.vendorId || item.vendorDetails?._id || "",
                              price: item.price || item.tabletDetails?.price || pricePerItem,
                              discountprice: item.discountprice || item.discountPrice || discountPrice,
                              quantity: item.quantity || quantity || 1
                            }))
                            : [{
                              vendorId: data?.vendorDetails?.vendorId || data?.vendorId || cart?.vendorId || data?.businessDetails?._id || "",
                              price: pricePerItem,
                              discountprice: discountPrice,
                              quantity: quantity || 1
                            }];

                          let hasExpired = false;
                          if (ele?.endDate) {
                            const endDateStamp = new Date(ele.endDate).getTime();
                            const nowStamp = new Date().getTime();

                            if (endDateStamp < nowStamp) {
                              hasExpired = true;
                              criteriaText = "Coupon has expired";
                            }
                          }
                          if (isVendorCoupon) {
                            applicableAmount = subtotal;
                            if (hasExpired) {
                              isEligible = false;
                            } else if (applicableAmount < ele.minimumPurchase) {
                              isEligible = false;
                              const diff = (ele.minimumPurchase - applicableAmount).toFixed(2);
                              criteriaText = `Add ₹${diff} more to apply`;
                            } else if (ele?.canUseCoupon === false) {
                              isEligible = false;
                            } else if (ele?.remainingUses === 0) {
                              isEligible = false;
                            } else {
                              isEligible = true;
                            }
                          } else {
                            applicableAmount = total;
                            if (hasExpired) {
                              isEligible = false;
                            } else if (applicableAmount < ele.minimumPurchase) {
                              isEligible = false;
                              const diff = (ele.minimumPurchase - applicableAmount).toFixed(2);
                              criteriaText = `Add ₹${diff} more to apply`;
                            } else if (ele?.canUseCoupon === false) {
                              isEligible = false;
                            } else if (ele?.remainingUses === 0) {
                              isEligible = false;
                            } else {
                              isEligible = true;
                            }
                          }

                          const tier = getDiscountTier(ele);
                          const theme = couponThemes[tier];
                          const inactiveTheme = {
                            bg: "bg-slate-50",
                            border: "border-slate-200",
                            accent: "text-slate-400",
                            badgeBg: "bg-slate-100",
                            badgeText: "text-slate-500",
                            btnBg: "bg-slate-100",
                            btnText: "text-slate-400",
                            btnBorder: "border-slate-200",
                            label: "Unavailable",
                          };
                          const appliedTheme = {
                            bg: "bg-[#f6fef9]",
                            border: "border-[#a7f3d0]",
                            accent: "text-[#10b981]",
                            badgeBg: "bg-[#ecfdf5]",
                            badgeText: "text-[#059669]",
                            btnBg: "bg-[#ecfdf5]",
                            btnText: "text-[#059669]",
                            btnBorder: "border-[#a7f3d0]",
                            label: "Applied",
                          };
                          const activeTheme = !isEligible
                            ? inactiveTheme
                            : isApplied
                              ? appliedTheme
                              : theme;

                          const savingsPreview = isEligible
                            ? calculateCouponDiscount(ele, applicableAmount)
                            : 0;

                          return (
                            <div
                              key={ele._id || `${ele.code}-${ind}`}
                              className={`flex items-stretch w-full ${activeTheme.bg} border ${activeTheme.border} rounded-xl overflow-hidden transition-all duration-200 shadow-none ${isEligible ? "opacity-100" : "opacity-[0.72]"}`}
                            >
                              <div className={`min-w-[88px] max-w-[88px] py-3.5 px-2.5 ${activeTheme.badgeBg} border-r border-dashed ${activeTheme.border} flex flex-col items-center justify-center gap-1 text-center`}>
                                <span className={`text-xl font-extrabold ${activeTheme.badgeText} leading-[1.1]`}>
                                  {discountText}
                                </span>
                                <span className={`text-[9px] font-bold ${activeTheme.badgeText} uppercase tracking-[0.3px]`}>
                                  OFF
                                </span>
                                <span className={`text-[8.5px] font-bold ${activeTheme.accent} bg-white py-0.5 px-1.5 rounded-[10px] mt-1`}>
                                  {activeTheme.label}
                                </span>
                              </div>

                              <div className="flex-1 py-3 px-3.5 flex flex-col gap-1.5 min-w-0">
                                <h4 className="text-sm font-bold text-slate-900 m-0 leading-[1.3]">
                                  {ele.name}
                                </h4>

                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className={`text-[11px] font-bold font-mono ${activeTheme.accent} bg-white border border-dashed ${activeTheme.border} rounded-md py-[3px] px-2`}>
                                    {ele.code}
                                  </span>
                                  {ele.minimumPurchase > 0 && (
                                    <span className="text-[10px] text-slate-500">
                                      Minimum order ₹{ele.minimumPurchase}
                                    </span>
                                  )}
                                </div>

                                {ele.description && (
                                  <p className="text-[11px] text-slate-600 m-0 leading-[1.45] line-clamp-2 [display:-webkit-box] [-webkit-box-orient:vertical]">
                                    {ele.description}
                                  </p>
                                )}

                                <div className="flex flex-wrap gap-2 text-[10px] text-slate-500">
                                  {isEligible && savingsPreview > 0 && (
                                    <span className={`font-semibold ${activeTheme.accent}`}>
                                      You save ₹{savingsPreview.toFixed(2)}
                                    </span>
                                  )}
                                  {ele.discountType === "percentage" && (
                                    <span>{ele.discount}% discount</span>
                                  )}
                                  {ele.discountType === "fixed" && (
                                    <span>Flat ₹{ele.discount} off</span>
                                  )}
                                </div>

                                {!isEligible && criteriaText && (
                                  <span className="text-[10px] text-red-600 font-semibold">
                                    ⚠️ {criteriaText}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center py-3 pr-3 pl-0 shrink-0">
                                <button
                                  type="button"
                                  disabled={!isEligible}
                                  onClick={() => handleCouponApply(ele)}
                                  className={`py-[7px] px-3.5 rounded-sm border ${activeTheme.btnBorder} ${activeTheme.btnBg} ${activeTheme.btnText} text-xs font-semibold transition-all duration-200 whitespace-nowrap shadow-none ${!isEligible ? "cursor-not-allowed" : "cursor-pointer"}`}
                                >
                                  {isApplied ? "Applied" : "Apply"}
                                </button>
                              </div>
                            </div>
                          );
                        };

                        const renderSection = (coupons, isVendorCoupon) => {
                          if (coupons.length === 0) return null;
                          return coupons.map((ele, ind) =>
                            renderCouponCard(ele, ind, isVendorCoupon),
                          );
                        };

                        if (sortedVendorCoupons.length === 0 && sortedAdminCoupons.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-10 px-5 text-center text-slate-400">
                              <div className="text-3xl mb-3 text-slate-300">
                                🎟️
                              </div>
                              <span className="text-sm font-semibold text-slate-500">
                                No Coupons Available
                              </span>
                              <span className="text-xs text-slate-400 mt-1">
                                There are no active coupons at the moment.
                              </span>
                            </div>
                          );
                        }

                        return (
                          <>
                            {renderSection(sortedVendorCoupons, true)}
                            {sortedVendorCoupons.length > 0 && sortedAdminCoupons.length > 0 && (
                              <div className="h-px bg-slate-200 my-1" />
                            )}
                            {renderSection(sortedAdminCoupons, false)}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

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
    </div>
  );
};

export default BookingProcess;