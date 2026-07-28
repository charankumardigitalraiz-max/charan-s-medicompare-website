import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import Select from "react-select";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import { Trash2, Calendar, Clock, User, Check, AlertCircle } from "react-feather";
import toast from "react-hot-toast";
import LocationOffcanvas from "../../../components/home/LocationOffCanvas.jsx";
import { useCartContext } from "../../../context/CartContext";
import { useLocation } from "../../../context/LocationContext";
import { navigateToLogin } from "../../../utils/redirectUtils";
import { openRazorpayCheckout } from "../../../utils/razorpayUtils";
import { useResponsive } from "../../../hooks";
import { useProfile } from "../../../context/ProfileContext";
import { Offcanvas } from "react-bootstrap";
import VendorCalendarSlotPicker from "../../../components/VendorCalendarSlotPicker";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import "./bookingprocess.css";
import {
  getReferredDoctorSelectOptions,
  handleReferredDoctorInputChange,
  handleReferredDoctorSelectChange,
  referredDoctorSelectComponents,
} from "./referredDoctorSelectUtils";

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
};

export const LabTestCheckout = () => {
  const [loading, setLoading] = useState(true);
  const {
    cartItems,
    couponDetails,
    walletAmount,
    serviceFeeDetails,
    serviceDetails,
    removeItem,
    clearCart,
    refreshCart,
    vendorLocation,
    cartBilling
  } = useCartContext();
  console.log("service fee details 1 ", serviceFeeDetails);
  console.log("service fee details 2", serviceDetails)
  const navigate = useNavigate();
  console.log("LabTestCheckout state:", { cartItems, loading });
  const { profile: userProfile } = useProfile();

  const [showLocationOffcanvas, setShowLocationOffcanvas] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("online");
  const [offcanvasPosition, setOffcanvasPosition] = useState("right");
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = localStorage.getItem("checkoutAppliedCoupon_labtest");
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [couponInputText, setCouponInputText] = useState("");

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    currentLocation,
    updateLocation,
    latitude,
    longitude,
  } = useLocation();

  const { isXs: xsMobile, isMobile, isTabletOrBelow: isTablet } = useResponsive();

  // Lab Test specific states
  const [selectedPatients, setSelectedPatients] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);


  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [vendorTimings, setVendorTimings] = useState({});
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [slotCalendarDays, setSlotCalendarDays] = useState([]);
  const [slotCalendarMonth, setSlotCalendarMonth] = useState(new Date().getMonth() + 1);
  const [slotCalendarYear, setSlotCalendarYear] = useState(new Date().getFullYear());
  const [slotTimingsLoading, setSlotTimingsLoading] = useState(false);
  const [selectedSlotText, setSelectedSlotText] = useState("");

  const fetchSlotVendorCalendar = async (month, year) => {
    const vendorId = labTestItems?.[0]?.vendorId;
    if (!vendorId) {
      console.warn("No vendorId found for calendar fetch!");
      return;
    }

    setSlotTimingsLoading(true);
    try {
      const token = localStorage.getItem("medicomparestoken");
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

  // Doctor referral states
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const doctorSearchRequestRef = useRef(0);

  // Filter only lab test items
  const labTestItems = cartItems;

  const [collectionMethod, setCollectionMethod] = useState("home"); // home or lab

  const visitConfig = useMemo(() => {
    if (serviceDetails?.visitType) return serviceDetails.visitType;
    if (serviceDetails?.services?.visitType) return serviceDetails.services.visitType;
    if (serviceFeeDetails?.visitType) return serviceFeeDetails.visitType;
    if (serviceFeeDetails?.services?.visitType) return serviceFeeDetails.services.visitType;
    if (serviceFeeDetails?.labtests) return serviceFeeDetails.labtests;
    const firstItem = labTestItems?.[0];
    if (firstItem) {
      if (firstItem.visitType) return firstItem.visitType;
      if (firstItem.vendorDetails?.visit) return firstItem.vendorDetails.visit;
      if (firstItem.vendorDetails?.businessProfile?.visit) return firstItem.vendorDetails.businessProfile.visit;
      if (firstItem.packageDetails?.visit) return firstItem.packageDetails.visit;
      if (firstItem.productDetails?.visit) return firstItem.productDetails.visit;
    }
    return {};
  }, [serviceDetails, serviceFeeDetails, labTestItems]);

  const visitType = typeof visitConfig === "string" ? visitConfig : (visitConfig?.visitType || "both"); // home, lab, center, or both

  useEffect(() => {
    const vt = typeof visitType === "string" ? visitType.toLowerCase() : "";
    if (vt === "home") {
      setCollectionMethod("home");
    } else if (vt === "center" || vt === "lab") {
      setCollectionMethod(vt);
    }
  }, [visitType]);

  const uniquePatientsInCart = useMemo(() => {
    const list = [];
    const ids = new Set();
    cartItems.forEach(item => {
      (item.labTestPatients || []).forEach(p => {
        const id = p.selectType === "self" ? "self" : p.patientId;
        if (id && !ids.has(id)) {
          ids.add(id);
          list.push(id);
        }
      });
    });
    return list.length > 0 ? list : ["self"];
  }, [cartItems]);

  const fetchDoctors = async (searchQuery = "") => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) {
      setDoctors([]);
      return;
    }

    const requestId = ++doctorSearchRequestRef.current;

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) return;

      const url = `doctors/list?search=${encodeURIComponent(trimmedQuery)}`;

      const response = await axiosCommonInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
      toast.error("Error fetching doctors");
    }
  };

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

  const handleRemovePatientItem = async (cartId, patientId) => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      const isSelf = patientId === "self";
      const actualPatientId = isSelf ? null : patientId;
      const patientType = isSelf ? "self" : "family";

      const payload = {
        cartId,
        patientId: actualPatientId,
      };
      if (patientType != null) {
        payload.patientType = patientType;
      }

      const response = await axiosCommonInstance.post("cart/groupcartdelete", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.data.success) {
        toast.success("Item removed successfully");
        refreshCart();
      } else {
        toast.error(response.data.message || "Failed to remove item");
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to remove item");
    }
  };

  const handleLocationClick = (position = "right") => {
    setOffcanvasPosition(position);
    setShowLocationOffcanvas(true);
  };

  const loadSavedAddresses = async () => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) return;

      const response = await axiosCommonInstance.get("address/list", {
        headers: { Authorization: `Bearer ${token}` },
        params: currentLocation?.pincode
          ? {
            pincode: currentLocation.pincode,
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

        const savedLocationStr =
          localStorage.getItem("selectedLocationCheckout") ||
          localStorage.getItem("selectedLocationBooking") ||
          localStorage.getItem("selectedLocation");
        let matchedAddress = null;

        if (savedLocationStr) {
          try {
            const parsedLocation = JSON.parse(savedLocationStr);
            if (parsedLocation.addressId) {
              matchedAddress = addresses.find(
                (addr) => addr._id === parsedLocation.addressId,
              );
            }
          } catch (e) { }
        }

        if (matchedAddress) {
          setSelectedAddress(matchedAddress);
        } else {
          if (addresses.length > 0) {
            setSelectedAddress(addresses[0]);
          } else {
            setSelectedAddress(null);
          }
        }
      }
    } catch (error) { }
  };

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) return;
      const response = await axiosUserInstance.get("family-member/list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setFamilyMembers(response.data.data || []);
      }
    } catch (error) {
      toast.error("Error fetching family members");
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to access checkout");
      navigateToLogin(navigate);
      return;
    }

    // Load selected patients from sessionStorage
    try {
      const stored = sessionStorage.getItem("booking_selectedPatients");
      if (stored) {
        setSelectedPatients(JSON.parse(stored));
      } else {
        setSelectedPatients(["self"]);
      }
    } catch (e) {
      setSelectedPatients(["self"]);
    }

    Promise.all([
      fetchFamilyMembers(),
      loadSavedAddresses(),
      refreshCart()
    ]).finally(() => {
      setLoading(false);
    });
  }, []);


  const handlePatientToggleForItem = async (item, patientId) => {
    const currentPatients = item.labTestPatients || [];
    const isSelf = patientId === "self";

    let updated;
    const exists = currentPatients.some(p =>
      isSelf ? p.selectType === "self" : p.patientId === patientId
    );

    if (exists) {
      // Remove
      updated = currentPatients.filter(p =>
        isSelf ? p.selectType !== "self" : p.patientId !== patientId
      );
    } else {
      // Add
      const newPatient = isSelf
        ? { selectType: "self", patientId: null }
        : { selectType: "family", patientId: patientId };
      updated = [...currentPatients, newPatient];
    }

    // Optimistically update local cart
    item.labTestPatients = updated;

    // Send update to server
    try {
      const token = localStorage.getItem("medicomparestoken");
      const payload = [
        {
          productId: item.productId || item.tabletId,
          vendorId: item.vendorId,
          variantId: item.variantId || null,
          quantity: item.quantity || 1,
          bookingType: "cart",
          type: item.type || "normal",
          packageId: item.packageId || null,
          pincode: currentLocation?.pincode || null,
          labTestPatients: updated,
        }
      ];

      await axiosCommonInstance.post("cart/create", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      refreshCart();
    } catch (error) {
      toast.error("Failed to update patient selection");
    }
  };

  const getEffectivePrice = (item) => {
    const isPackage = item?.type === "package" || !!item?.packageId;
    const targetDetails = isPackage ? item?.packageDetails : item;

    const discountprice = parseFloat(targetDetails?.discountprice || targetDetails?.discountPrice) || null;
    const price = parseFloat(targetDetails?.price) || 0;
    let calculatedDiscountPrice = discountprice;
    const discountType = targetDetails?.discountType || null;

    if (discountType === "percentage" && discountprice && discountprice > 0) {
      calculatedDiscountPrice = price - (price * discountprice) / 100;
    }

    return calculatedDiscountPrice && calculatedDiscountPrice > 0
      ? calculatedDiscountPrice
      : price;
  };

  const handleCouponApply = async (coupon, isManualInput = false) => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login first");
        return;
      }

      if (selectedPayment === "cod") {
        toast.error("Coupons are not applicable for Pay at Sample Collection");
        return;
      }
      const resolvedHomeVisitFee = parseFloat(
        serviceDetails?.homeVisitFee ||
        serviceDetails?.visit?.homeVisitFee ||
        serviceDetails?.services?.visit?.homeVisitFee ||
        serviceFeeDetails?.services?.visit?.homeVisitFee ||
        serviceFeeDetails?.labtests?.homeVisitFee ||
        0
      );

      let totalAmount;
      const finalAmount = parseFloat(cartBilling?.finalAmount || 0);

      if (visitType?.toLowerCase() === "both" && (collectionMethod === "lab" || collectionMethod === "center")) {
        totalAmount = finalAmount - resolvedHomeVisitFee;
      } else {
        totalAmount = finalAmount;
      }

      const payload = {
        couponId: isManualInput ? null : (coupon._id || null),
        couponCode: coupon.code || null,
        code: coupon.code || null,
        totalAmount: totalAmount,
        bookingTypes: "cart",
        servicefixedTypes: labTestItems?.[0]?.productDetails?.tabletDetails?.subcategoryDetails?.categoryDetails?.fixedType || labTestItems?.[0]?.packageDetails?.fixedType || null,
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
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to apply coupons");
      navigateToLogin(navigate, "/labtest-checkout");
      return;
    }

    if (selectedPayment === "cod") {
      toast.error("Coupons are not applicable for Pay at Sample Collection");
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



  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (collectionMethod === "home" && !selectedAddress) {
      toast.error("Please select a Patient Address");
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      toast.error("Please select a date and time slot for collection");
      return;
    }

    // Verify all tests have at least one patient assigned
    const missingPatients = labTestItems.some(item => !item.labTestPatients || item.labTestPatients.length === 0);
    if (missingPatients) {
      toast.error("Please assign at least one patient to each lab test");
      return;
    }


    if (!selectedDoctor || !selectedDoctor.value || selectedDoctor.value === "") {
      toast.error("Please select a doctor");
      return;
    }


    const token = localStorage.getItem("medicomparestoken");
    setIsSubmitting(true);

    const tax = CGstCalculate(subtotal) + SGstCalculate(subtotal);

    const itemsWithPatients = labTestItems.map(item => ({
      cartId: item?._id,
      productId: item.productId || item.tabletId,
      vendorId: item.vendorId,
      variantId: item.variantId || null,
      quantity: item.quantity,
      price: getEffectivePrice(item),
      type: item.type || "normal",
      bookingTypes: "cart",
      labTestPatients: item.labTestPatients,
      servicefixedTypes: item.productDetails?.tabletDetails?.subcategoryDetails?.categoryDetails?.fixedType || item?.packageDetails?.fixedType || null,
      billingSummary: item?.billingSummary
    }));

    // Gather family ids and names for selected patients overall
    const familyIds = uniquePatientsInCart.filter(id => id !== "self");
    const selectedMembers = familyMembers.filter(m => familyIds.includes(m._id));
    const familyNames = selectedMembers.map(m => m.name);

    const payload = {
      items: itemsWithPatients,
      subtotal: cartBilling?.subtotal,
      shipping: 0,
      couponId: selectedPayment === "cod" ? null : (appliedCoupon?._id || null),
      couponAmount: selectedPayment === "cod" ? 0 : (couponDiscount || 0),
      // discount: couponDiscount,
      tax: tax,
      cgst: CGstCalculate(subtotal),
      sgst: SGstCalculate(subtotal),
      total: withCouponAndWithoutWallet,
      shippingAddress: selectedAddress?._id || null,
      billingAddress: selectedAddress?._id || null,
      paymentmethod: selectedPayment,
      // couponId: appliedCoupon?._id || null,
      bookingTypes: "cart",
      // couponAmount: couponDiscount,
      iswallet: (walletUsed > 0 && selectedPayment === "online") ? true : false,
      walletamount: selectedPayment === "online" ? walletUsed : 0,
      walletAmount: selectedPayment === "online" ? walletUsed : 0,
      doctorName:
        selectedDoctor?.value === "self_referral"
          ? "Self Referral"
          : selectedDoctor?.label || "",
      doctorId:
        selectedDoctor?.value === "self_referral"
          ? null
          : selectedDoctor?.value || null,
      familyids: familyIds,
      familynames: familyNames,
      persontype: uniquePatientsInCart.includes("self") ? (familyIds.length > 0 ? "both" : "self") : "forWhom",
      pincode: currentLocation?.pincode || selectedAddress?.location?.pincode || "",
      samplecollection: homeVisitFee,
      selectedDate: selectedDate instanceof Date
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        : selectedDate,
      selectedTimeSlot: selectedTimeSlot,
      billingSummary: {
        ...cartBilling,
        couponAmount: selectedPayment === "online" ? couponDiscount : 0,
        walletAmount: selectedPayment === "online" ? walletUsed : 0,
        homeVisitFee,
        samplecollectionCharges: homeVisitFee,
        subtotal: cartBilling?.subtotal,
        finalAmount: withoutCouponAndWallet,
        couponId: selectedPayment === "cod" ? null : (appliedCoupon?._id || null),
        collectionType: collectionMethod,
        withoutCouponAndWithoutWallet,
        withCouponAndWithoutWallet,
        withoutCouponAndWithWallet,
        withCouponAndWithWallet,
        walletUsedWithoutCoupon,
        walletUsedWithCoupon,
        paidAmount: amountToPay
      }
    };

    try {
      const response = await axiosUserInstance.post("orders/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.data.success) {
        toast.error("Order creation failed");
        return;
      }

      const orderId = response.data.data.orderId;
      sessionStorage.setItem("orderId", orderId);

      if (amountToPay <= 0) {
        clearCart();
        setAppliedCoupon(null);
        localStorage.removeItem("checkoutAppliedCoupon_labtest");
        sessionStorage.setItem("paymentMethod", "wallet");
        navigate("/payment-success?type=slot");
        return;
      }

      if (selectedPayment === "cod") {
        clearCart();
        setAppliedCoupon(null);
        localStorage.removeItem("checkoutAppliedCoupon_labtest");
        sessionStorage.setItem("paymentMethod", "cod");
        navigate("/payment-success?type=slot");
        return;
      }

      const razorpayData = response.data.data;

      if (!window.Razorpay) {
        toast.error("Razorpay not loaded");
        return;
      }

      openRazorpayCheckout({
        razorpayData,
        description: "Lab Test Order Payment",
        prefill: {
          name: selectedAddress?.name || "Customer",
          contact: selectedAddress?.phone || "",
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
              bookingTypes: "labtests",
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          clearCart();
          setAppliedCoupon(null);
          localStorage.removeItem("checkoutAppliedCoupon_labtest");
          sessionStorage.setItem("paymentMethod", "online");
          navigate("/payment-success?type=slot");
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

  const SGstCalculate = (subtotal) => {
    return subtotal * 0.14;
  };

  const CGstCalculate = (subtotal) => {
    return subtotal * 0.04;
  };

  const subtotal = labTestItems.reduce((acc, item) => {
    const effectivePrice = getEffectivePrice(item);
    const quantity = parseInt(item.quantity) || 1;
    return acc + effectivePrice * quantity;
  }, 0);

  const tax = parseFloat((subtotal * 0.18).toFixed(2));
  const total = parseFloat(subtotal.toFixed(2));

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

  // Home visit fee from serviceDetails (data.serviceFee) or serviceFeeDetails fallback
  const homeVisitFee =
    collectionMethod === "home"
      ? parseFloat(
        serviceDetails?.homeVisitFee ||
        serviceDetails?.visit?.homeVisitFee ||
        serviceDetails?.services?.visit?.homeVisitFee ||
        serviceFeeDetails?.services?.visit?.homeVisitFee ||
        serviceFeeDetails?.labtests?.homeVisitFee ||
        0,
      )
      : 0;

  // Always derive from current cart — serverDiscount/serverFinalAmount are stale after item changes
  const baseFinalAmount = cartBilling?.subtotal || 0;
  const deliveryCharges = cartBilling?.deliveryCharges || 0;

  const couponDiscount = calculateCouponDiscount(appliedCoupon, baseFinalAmount);
  const couponAmountApplied = appliedCoupon
    ? +Math.max(0, baseFinalAmount - couponDiscount).toFixed(2)
    : baseFinalAmount;

  // 1. Without Coupon & Without Wallet
  const withoutCouponAndWithoutWallet = +(baseFinalAmount + deliveryCharges + homeVisitFee).toFixed(2);

  // 2. With Coupon & Without Wallet
  const withCouponAndWithoutWallet = +(couponAmountApplied + deliveryCharges + homeVisitFee).toFixed(2);

  const useWallet = true;
  const walletVal = Math.max(0, walletAmount || 0);

  // 3. Without Coupon & With Wallet
  const walletUsedWithoutCoupon = useWallet
    ? +Math.min(walletVal, withoutCouponAndWithoutWallet).toFixed(2)
    : 0;
  const withoutCouponAndWithWallet = +(withoutCouponAndWithoutWallet - walletUsedWithoutCoupon).toFixed(2);

  // 4. With Coupon & With Wallet (Actual amount to pay)
  const walletUsedWithCoupon = useWallet
    ? +Math.min(walletVal, withCouponAndWithoutWallet).toFixed(2)
    : 0;
  const withCouponAndWithWallet = +(withCouponAndWithoutWallet - walletUsedWithCoupon).toFixed(2);

  // Map to the existing variables for backward compatibility and UI rendering
  const couponAmmountApplied = couponAmountApplied;
  const addedDeliveryCharge = withCouponAndWithoutWallet;
  const withoutCouponAndWallet = withoutCouponAndWithoutWallet;
  const walletUsed = walletUsedWithCoupon;
  const amountToPay = selectedPayment === "cod" ? withoutCouponAndWallet : withCouponAndWithWallet;

  console.log("Clarified Billing breakdown (Labtest):", {
    withoutCouponAndWithoutWallet,
    withCouponAndWithoutWallet,
    withoutCouponAndWithWallet,
    withCouponAndWithWallet,
    walletUsedWithoutCoupon,
    walletUsedWithCoupon,
    couponDiscount,
    deliveryCharges,
    homeVisitFee,
    walletAmount,
    useWallet
  });
  // Validate applied coupon and drop if cart is empty or minimum purchase not met
  useEffect(() => {
    if (cartItems.length === 0 && appliedCoupon) {
      setAppliedCoupon(null);
      localStorage.removeItem("checkoutAppliedCoupon_labtest");
      return;
    }

    if (!appliedCoupon) return;
    const minPurchase = parseFloat(appliedCoupon.minimumPurchase);
    if (Number.isFinite(minPurchase) && minPurchase > 0) {
      if (appliedCoupon.createdType === "vendor") {
        const vendorIdStr = String(appliedCoupon.createdBy || appliedCoupon.businessDetails?._id || "");
        const vendorItems = cartItems.filter(item => String(item.vendorId) === vendorIdStr);
        const vendorSubtotal = vendorItems.reduce((sum, item) => {
          const price = getEffectivePrice(item);
          return sum + (price * (parseInt(item.quantity) || 1));
        }, 0);
        if (vendorSubtotal < minPurchase) {
          setAppliedCoupon(null);
          toast.error(
            `Coupon removed — minimum spend for ${appliedCoupon.businessDetails?.businessName || 'vendor'} is ₹${minPurchase}`,
          );
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
  }, [cartItems, total, appliedCoupon]);

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(
          "checkoutAppliedCoupon_labtest",
          JSON.stringify(appliedCoupon),
        );
      } else {
        localStorage.removeItem("checkoutAppliedCoupon_labtest");
      }
    } catch (e) { }
  }, [appliedCoupon]);

  const getPatientDisplayName = (id) => {
    if (id === "self") {
      return `Self (${userProfile?.first_name || "Owner"})`;
    }
    const member = familyMembers.find(m => m._id === id);
    if (member) {
      const relationship = member.relationship ? member.relationship.charAt(0).toUpperCase() + member.relationship.slice(1).toLowerCase() : "Family";
      return `${member.name} (${relationship})`;
    }
    // Fallback: search in cart items for patientDetails
    for (const item of cartItems) {
      const patient = (item.labTestPatients || []).find(p => String(p.patientId) === String(id));
      if (patient && patient.patientDetails) {
        const name = patient.patientDetails.name || "Family Member";
        const relationship = patient.patientDetails.relationship ? patient.patientDetails.relationship.charAt(0).toUpperCase() + patient.patientDetails.relationship.slice(1).toLowerCase() : "Family";
        return `${name} (${relationship})`;
      }
    }
    return "Family Member";
  };

  // Generate date options for the next 7 days
  const getDateOptions = () => {
    const options = [];
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    for (let i = 1; i <= 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const dayName = days[d.getDay()];
      const dateNum = d.getDate();
      const monthName = months[d.getMonth()];
      const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      options.push({
        label: `${dayName}, ${dateNum} ${monthName}`,
        value: formattedDate,
      });
    }
    return options;
  };

  const timeSlots = [
    "07:00 AM - 09:00 AM",
    "09:00 AM - 11:00 AM",
    "11:00 AM - 01:00 PM",
    "01:00 PM - 03:00 PM",
    "03:00 PM - 05:00 PM",
    "05:00 PM - 07:00 PM",
  ];

  const getAddressTypeLabel = () => {
    if (collectionMethod === "lab") {
      return "Diagnostic Centre Address";
    }
    if (selectedAddress?.addressType) {
      const addressType = selectedAddress.addressType;
      return (
        addressType.charAt(0).toUpperCase() + addressType.slice(1).toLowerCase()
      );
    }
    return "Home Collection Address";
  };

  const resolveImage = (item) => {
    const isPackage = item?.type === "package" || !!item?.packageId;
    const targetDetails = isPackage ? item?.packageDetails : item;
    const img =
      targetDetails?.files?.[0] ??
      (Array.isArray(targetDetails?.imageUrl) ? targetDetails.imageUrl[0] : targetDetails?.imageUrl);
    if (!img) return "/assets/default.png";

    return getImageUrl(img);
  };

  if (loading) {
    return <PageLoader />;
  }

  return (
    <div className="main-wrapper" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Home2Header />
      <CategoryProvider />

      <div
        style={{
          display: "flex",
          flexDirection: isMobile || isTablet ? "column" : "row",
          gap: "24px",
          paddingTop: xsMobile ? "180px" : isMobile ? "110px" : "150px",
          paddingBottom: "48px",
          background: "#f8f9fa",
          alignItems: "flex-start",
          paddingRight: isMobile ? "12px" : "30px",
          paddingLeft: isMobile ? "12px" : "30px",
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
        <div
          className="card shadow-sm"
          style={{
            width:
              labTestItems.length === 0
                ? "100%"
                : isMobile || isTablet
                  ? "100%"
                  : "67%",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#fff",
            padding: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? "20px" : "0",
            position: "relative",
          }}
        >
          <div style={{ paddingTop: "0px", marginBottom: "15px" }}>
            <Link
              to="/"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#8059ca",
                border: "1px solid #e9d5ff",
                borderRadius: "30px",
                padding: "6px 18px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                background: "#fdfaff",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 5px rgba(128, 89, 202, 0.05)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.background = "linear-gradient(135deg, #8059ca 0%, #6f42c1 100%)";
                e.currentTarget.style.borderColor = "#8059ca";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(128, 89, 202, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#8059ca";
                e.currentTarget.style.background = "#fdfaff";
                e.currentTarget.style.borderColor = "#e9d5ff";
                e.currentTarget.style.boxShadow = "0 2px 5px rgba(128, 89, 202, 0.05)";
              }}
            >
              <i className="fas fa-arrow-left" style={{ fontSize: "11px" }} />
              Back to Home
            </Link>
          </div>

          {labTestItems.length === 0 ? (
            <div className="text-center py-5">
              <i
                className="fas fa-microscope text-muted mb-3"
                style={{ fontSize: "48px", color: "#8059ca" }}
              ></i>
              <h5 className="text-muted">
                Your Lab Cart is Empty
              </h5>
              <p className="text-muted mb-3">No lab tests added to your cart yet</p>
              <Link
                to="/"
                className="btn btn-primary"
                style={{ width: "180px", backgroundColor: "#8059ca", borderColor: "#8059ca", borderRadius: "30px" }}
              >
                Browse Lab Tests
              </Link>
            </div>
          ) : (
            <div className="row g-3">
              {/* Vendor Details Card */}
              {labTestItems?.[0]?.vendorDetails && (
                <div className="col-12">
                  <div
                    style={{
                      borderRadius: "16px",
                      border: "1px solid #e9d5ff",
                      background: "linear-gradient(135deg, #fdfaff 0%, #f5f0ff 100%)",
                      padding: "18px 20px",
                      marginBottom: "4px",
                      boxShadow: "0 4px 16px rgba(128, 89, 202, 0.07)",
                      display: "flex",
                      alignItems: "center",
                      gap: "16px"
                    }}
                  >
                    {/* Vendor logo/icon */}
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        borderRadius: "14px",
                        background: "#ffffff",
                        border: "1.5px solid #e9d5ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(128,89,202,0.1)"
                      }}
                    >
                      {labTestItems[0].vendorDetails?.businessProfile?.files?.[0] || labTestItems[0].vendorDetails?.files?.[0] ? (
                        <img
                          src={getImageUrl(labTestItems[0].vendorDetails?.businessProfile?.files?.[0] || labTestItems[0].vendorDetails?.files?.[0])}
                          alt="vendor"
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <i className="fas fa-microscope" style={{ fontSize: "22px", color: "#8059ca" }} />
                      )}
                    </div>

                    {/* Vendor info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: "700",
                          color: "#1e1b4b",
                          marginBottom: "4px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          textTransform: "capitalize"
                        }}
                      >
                        {labTestItems[0]?.vendorDetails?.businessProfile?.name ||
                          labTestItems[0]?.vendorDetails?.name ||
                          labTestItems[0]?.vendorName ||
                          "Diagnostic Centre"}
                      </div>

                      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", fontSize: "12px", color: "#64748b" }}>
                        {(labTestItems[0].vendorDetails?.businessProfile?.mobile ||
                          labTestItems[0].vendorDetails?.mobile ||
                          labTestItems[0].vendorDetails?.phone) && (
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <i className="fas fa-phone" style={{ color: "#8059ca", fontSize: "10px" }} />
                              {labTestItems[0].vendorDetails?.businessProfile?.mobile ||
                                labTestItems[0].vendorDetails?.mobile ||
                                labTestItems[0].vendorDetails?.phone}
                            </span>
                          )}
                        {(vendorLocation?.address ||
                          labTestItems[0].vendorDetails?.businessProfile?.location?.address ||
                          labTestItems[0].vendorDetails?.residentaladdress) && (
                            <span
                              style={{ display: "flex", alignItems: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                              <i className="fas fa-map-marker-alt" style={{ color: "#8059ca", fontSize: "10px" }} />
                              <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "260px" }}>
                                {vendorLocation?.address ||
                                  labTestItems[0].vendorDetails?.businessProfile?.location?.address ||
                                  labTestItems[0].vendorDetails?.residentaladdress}
                              </span>
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Verified badge */}
                    <div
                      style={{
                        background: "#ecfdf5",
                        border: "1px solid #a7f3d0",
                        borderRadius: "8px",
                        padding: "5px 10px",
                        fontSize: "11px",
                        fontWeight: "700",
                        color: "#059669",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        flexShrink: 0
                      }}
                    >
                      <i className="fas fa-check-circle" style={{ fontSize: "10px" }} />
                      Verified
                    </div>
                  </div>
                </div>
              )}
              {/* Patient assignment block */}

              {/* Delivery / Collection Address */}
              <div className="col-md-6 col-12">
                <div
                  style={{
                    borderRadius: "16px",
                    overflow: "hidden",
                    border: "1px solid #e9ecef",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                    background: "#ffffff",
                    marginBottom: "24px"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "16px 20px",
                      backgroundColor: "#faf8ff",
                      borderBottom: "1px solid #f3e8ff"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: "700",
                        color: "#5b21b6",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <i className="fas fa-map-marker-alt" style={{ color: "#8059ca" }}></i>
                      <span>{getAddressTypeLabel()}</span>
                    </div>
                    <div>
                      {collectionMethod === "home" && (
                        <button
                          style={{
                            color: "#ffffff",
                            background: "linear-gradient(135deg, #8059ca 0%, #6f42c1 100%)",
                            border: "none",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: "11px",
                            padding: "6px 16px",
                            borderRadius: "5px",
                            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                          }}
                          onClick={() => {
                            const token = localStorage.getItem("medicomparestoken");
                            if (!token) {
                              toast.error("Please login to change address");
                              navigateToLogin(navigate, "/labtest-checkout");
                              return;
                            }
                            handleLocationClick("right");
                          }}
                        >
                          {selectedAddress ? "Change" : "Add"}
                        </button>
                      )}
                    </div>
                  </div>

                  {collectionMethod === "home" ? (
                    selectedAddress ? (
                      <div
                        style={{
                          padding: "20px",
                          backgroundColor: "#fff",
                          fontSize: "13.5px",
                          color: "#475569",
                          lineHeight: "1.6"
                        }}
                      >
                        <div>
                          {selectedAddress.name && (
                            <div
                              style={{
                                fontWeight: "700",
                                color: "#0f172a",
                                marginBottom: "6px",
                                fontSize: "14.5px"
                              }}
                            >
                              {selectedAddress.name}
                            </div>
                          )}
                          {selectedAddress.phone && (
                            <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "4px" }}>{selectedAddress.phone}</div>
                          )}
                          {selectedAddress.addressLine1 || selectedAddress.location?.address ? (
                            <div style={{ color: "#334155" }}>
                              {selectedAddress.addressLine1 || selectedAddress.location?.address}
                              {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          padding: "24px 20px",
                          backgroundColor: "#fff",
                          fontSize: "13.5px",
                          color: "#64748b",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "10px",
                          flexDirection: "column",
                          textAlign: "center"
                        }}
                      >
                        <i className="fas fa-map-marked-alt" style={{ fontSize: "24px", color: "#cbd5e1" }}></i>
                        <span>No collection address selected yet</span>
                      </div>
                    )
                  ) : (
                    <div
                      style={{
                        padding: "20px",
                        backgroundColor: "#fff",
                        fontSize: "13.5px",
                        color: "#475569",
                        lineHeight: "1.6"
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontWeight: "700",
                            color: "#0f172a",
                            marginBottom: "6px",
                            fontSize: "14.5px",
                            textTransform: "capitalize"
                          }}
                        >
                          {labTestItems[0]?.vendorDetails?.businessProfile?.name ||
                            labTestItems[0]?.vendorDetails?.name ||
                            labTestItems[0]?.vendorName ||
                            "Diagnostic Centre"}
                        </div>
                        {(labTestItems?.[0]?.vendorDetails?.businessProfile?.mobile || labTestItems?.[0]?.vendorDetails?.mobile || labTestItems?.[0]?.vendorDetails?.phone) && (
                          <div style={{ color: "#64748b", fontSize: "13px", marginBottom: "4px" }}>
                            Phone: {labTestItems?.[0]?.vendorDetails?.businessProfile?.mobile || labTestItems?.[0]?.vendorDetails?.mobile || labTestItems?.[0]?.vendorDetails?.phone}
                          </div>
                        )}
                        <div style={{ color: "#334155" }}>
                          {vendorLocation?.address || labTestItems?.[0]?.vendorDetails?.businessProfile?.location?.address || labTestItems?.[0]?.vendorDetails?.businessProfile?.address || labTestItems?.[0]?.vendorDetails?.residentaladdress || "Address not available"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Referred Doctor Selection */}
              <div className="col-md-6 col-12 mb-4">
                <div
                  style={{
                    borderRadius: "16px",
                    border: "1px solid #e9ecef",
                    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
                    background: "#ffffff",
                    padding: "20px"
                  }}
                >
                  <h5 style={{ fontSize: "15px", fontWeight: "500", color: "#0f172a", marginBottom: "12px" }} className="d-flex align-items-center gap-2">
                    <i className="fa-solid fa-user-doctor" style={{ color: "#8059ca" }}></i>
                    Referred Doctor
                  </h5>
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
              </div>

              {/* Lab Tests — Patient-wise Grouped View */}
              <div className="col-12">
                <div
                  style={isMobile ? {
                    background: "transparent",
                    borderRadius: "0",
                    boxShadow: "none",
                    padding: "0"
                  } : {
                    background: "#fff",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
                    padding: "24px"
                  }}
                >
                  {/* Section header — Vendor details (highlighted) */}
                  <div
                    style={{
                      background: "linear-gradient(135deg, #f5f0ff 0%, #ede9ff 100%)",
                      border: "1.5px solid #c4b5fd",
                      borderLeft: "4px solid #8059ca",
                      borderRadius: "12px",
                      padding: "14px 16px",
                      marginBottom: "20px",
                      boxShadow: "0 4px 14px rgba(128, 89, 202, 0.12)"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      {/* Vendor icon */}
                      <div style={{ width: 44, height: 44, borderRadius: "12px", background: "#ffffff", border: "2px solid #e9d5ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", boxShadow: "0 2px 8px rgba(128,89,202,0.15)" }}>
                        {labTestItems[0]?.vendorDetails?.businessProfile?.files?.[0] || labTestItems[0]?.vendorDetails?.files?.[0] ? (
                          <img
                            src={getImageUrl(labTestItems[0]?.vendorDetails?.businessProfile?.files?.[0] || labTestItems[0]?.vendorDetails?.files?.[0])}
                            alt="vendor"
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : (
                          <i className="fas fa-microscope" style={{ fontSize: "18px", color: "#8059ca" }} />
                        )}
                      </div>

                      {/* Vendor name + details */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: "800", color: "#3b0764", fontSize: "14.5px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "4px", textTransform: "capitalize" }}>
                          {labTestItems[0]?.vendorDetails?.businessProfile?.name ||
                            labTestItems[0]?.vendorDetails?.name ||
                            labTestItems[0]?.vendorName ||
                            "Diagnostic Centre"}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                          {(labTestItems[0]?.vendorDetails?.businessProfile?.mobile || labTestItems[0]?.vendorDetails?.mobile || labTestItems[0]?.vendorDetails?.phone) && (
                            <span style={{ fontSize: "11.5px", color: "#6d28d9", display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                              <i className="fas fa-phone" style={{ color: "#8059ca", fontSize: "9px" }} />
                              {labTestItems[0]?.vendorDetails?.businessProfile?.mobile || labTestItems[0]?.vendorDetails?.mobile || labTestItems[0]?.vendorDetails?.phone}
                            </span>
                          )}
                          {(vendorLocation?.address || labTestItems[0]?.vendorDetails?.businessProfile?.location?.address || labTestItems[0]?.vendorDetails?.residentaladdress) && (
                            <span style={{ fontSize: "11.5px", color: "#6d28d9", display: "flex", alignItems: "center", gap: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "300px", fontWeight: "500" }}>
                              <i className="fas fa-map-marker-alt" style={{ color: "#8059ca", fontSize: "9px" }} />
                              {vendorLocation?.address || labTestItems[0]?.vendorDetails?.businessProfile?.location?.address || labTestItems[0]?.vendorDetails?.residentaladdress}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Test count badge */}
                      <div style={{ background: "#8059ca", borderRadius: "8px", padding: "5px 12px", fontSize: "12px", fontWeight: "700", color: "#fff", whiteSpace: "nowrap", flexShrink: 0, boxShadow: "0 2px 6px rgba(128,89,202,0.3)" }}>
                        {labTestItems.length} test{labTestItems.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    {uniquePatientsInCart.map((patientId, pIdx) => {
                      const patientItems = labTestItems.filter(item =>
                        (item.labTestPatients || []).some(p =>
                          patientId === "self"
                            ? (p.selectType === "self" || p?.patientDetails?.selectType === "self")
                            : (p.patientId === patientId || p?.patientDetails?.patientId === patientId)
                        )
                      );
                      const displayItems = patientItems;
                      const patientName = getPatientDisplayName(patientId);
                      const initials = patientName
                        .split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
                      const avatarColors = ["#8059ca", "#6d28d9", "#7c3aed", "#5b21b6"];
                      const avatarColor = avatarColors[pIdx % avatarColors.length];

                      return (
                        <div
                          key={patientId}
                          style={{
                            background: "#ffffff",
                            borderRadius: "14px",
                            border: "1px solid #e9ecef",
                            overflow: "hidden"
                          }}
                        >
                          {/* Patient header */}
                          <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", borderBottom: displayItems.length > 0 ? "1px solid #f1f5f9" : "none" }}>
                            {/* Avatar */}
                            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#8059ca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "#fff", fontSize: "13px", fontWeight: "800", letterSpacing: "0.5px" }}>
                              {initials}
                            </div>
                            {/* Name & count */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {patientName}
                              </div>
                              <div style={{ fontSize: "11.5px", color: "#64748b", marginTop: "1px" }}>
                                {displayItems.length === 0 ? "No tests assigned" : `${displayItems.length} test${displayItems.length !== 1 ? "s" : ""} booked`}
                              </div>
                            </div>
                            {/* Count chip */}
                            {displayItems.length > 0 && (
                              <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", color: "#475569", whiteSpace: "nowrap", flexShrink: 0 }}>
                                {displayItems.length} test{displayItems.length !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>

                          {/* Test rows */}
                          {displayItems.length === 0 ? (
                            <div style={{ padding: "18px 16px", textAlign: "center", color: "#94a3b8", fontSize: "12.5px", fontStyle: "italic" }}>
                              No tests assigned to this patient yet
                            </div>
                          ) : (
                            <div style={{ padding: "8px 16px 14px" }}>
                              {displayItems.map((item, idx) => {
                                const isPackage = item?.type === "package" || !!item?.packageId;
                                const targetDetails = isPackage ? item?.packageDetails : item;
                                const name = targetDetails?.name || "Lab Test";
                                const price = getEffectivePrice(item);
                                const originalPrice = parseFloat(targetDetails?.price) || 0;
                                const hasDiscount = !!(targetDetails?.discountprice || targetDetails?.discountPrice);
                                const discount = hasDiscount && originalPrice > 0
                                  ? Math.round(((originalPrice - price) / originalPrice) * 100)
                                  : 0;


                                let billingSummary = item?.billingSummary;
                                return (
                                  <div
                                    key={item.cartKey || item._id}
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: "12px",
                                      padding: "10px 0",
                                      borderBottom: idx < displayItems.length - 1 ? "1px solid #f8fafc" : "none"
                                    }}
                                  >
                                    {/* Flask icon or image */}
                                    <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#f5f3ff", border: "1px solid #ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                                      {resolveImage(item) ? (
                                        <img src={resolveImage(item)} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                      ) : (
                                        <i className="fa-solid fa-flask" style={{ fontSize: "16px", color: "#8059ca" }} />
                                      )}
                                    </div>

                                    {/* Name + price */}
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "3px", textTransform: "capitalize" }}>
                                        {name}
                                      </div>
                                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                        <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>₹{(billingSummary?.unitPrice || 0).toFixed(0)}</span>
                                        {billingSummary?.isDiscount && <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through" }}>₹{(billingSummary?.basePrice || 0).toFixed(0)}</span>}
                                        {billingSummary?.isDiscount && (
                                          <span style={{ background: "#f0fdf4", color: "#16a34a", fontSize: "9.5px", fontWeight: "700", padding: "1px 6px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                                            {`${Math.round(((billingSummary.basePrice - billingSummary.unitPrice) / billingSummary.basePrice) * 100)}% OFF`}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePatientItem(item._id, patientId)}
                                      style={{ width: 30, height: 30, borderRadius: "8px", background: "#fff5f5", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                                    >
                                      <Trash2 size={13} color="#ef4444" />
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Unassigned items */}
                    {(() => {
                      const unassigned = labTestItems.filter(item => !item.labTestPatients || item.labTestPatients.length === 0);
                      if (unassigned.length === 0) return null;
                      return (
                        <div
                          style={{
                            background: "#fff",
                            borderRadius: "14px",
                            border: "1px solid #fecaca",
                            borderLeft: "4px solid #ef4444",
                            boxShadow: "0 2px 12px rgba(239,68,68,0.06)",
                            overflow: "hidden"
                          }}
                        >
                          {/* Header */}
                          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px", borderBottom: "1px solid #fee2e2", background: "#fff5f5" }}>
                            <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#fee2e2", border: "1.5px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <AlertCircle size={16} color="#ef4444" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ fontSize: "13.5px", fontWeight: "700", color: "#991b1b" }}>Unassigned Tests</div>
                              <div style={{ fontSize: "11px", color: "#dc2626", marginTop: "1px" }}>Assign a patient to each test before checkout</div>
                            </div>
                            <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "20px", padding: "3px 10px", fontSize: "11px", fontWeight: "700", color: "#ef4444", flexShrink: 0 }}>
                              {unassigned.length} pending
                            </div>
                          </div>

                          {/* Items */}
                          <div style={{ padding: "8px 16px 14px" }}>
                            {unassigned.map((item, idx) => {
                              const isPackage = item?.type === "package" || !!item?.packageId;
                              const targetDetails = isPackage ? item?.packageDetails : item;
                              const name = targetDetails?.name || "Lab Test";
                              const price = getEffectivePrice(item);
                              return (
                                <div
                                  key={item.cartKey || item._id}
                                  style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px 0", borderBottom: idx < unassigned.length - 1 ? "1px solid #fff5f5" : "none" }}
                                >
                                  <div style={{ width: 42, height: 42, borderRadius: "10px", background: "#fff5f5", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
                                    {resolveImage(item) ? (
                                      <img src={resolveImage(item)} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <i className="fa-solid fa-flask" style={{ fontSize: "16px", color: "#ef4444" }} />
                                    )}
                                  </div>
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: "13px", fontWeight: "600", color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: "2px" }}>{name}</div>
                                    <span style={{ fontSize: "13px", fontWeight: "800", color: "#0f172a" }}>₹{price.toFixed(0)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.vendorId, item.productId, item.variantId, item.packageId)}
                                    style={{ width: 30, height: 30, borderRadius: "8px", background: "#fff5f5", border: "1px solid #fecaca", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}
                                  >
                                    <Trash2 size={13} color="#ef4444" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {labTestItems.length > 0 && (
          <div
            className="card shadow-sm"
            style={{
              width: isMobile || isTablet ? "100%" : "33%",
              position: isMobile || isTablet ? "static" : "sticky",
              top: "100px",
              borderRadius: "16px",
              border: "1px solid #f1f5f9",
              backgroundColor: "#fff",
              padding: isMobile ? "20px" : "28px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)",
              marginTop: "10px",
            }}
          >
            {/* Coupon Card Summary */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  fontSize: "15.5px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <i className="fas fa-percentage" style={{ color: "#8059ca" }}></i>
                Offers & Discounts
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  background: appliedCoupon ? "#f0fdf4" : "#fdfaff",
                  padding: "16px",
                  borderRadius: "12px",
                  alignItems: "center",
                  cursor: "pointer",
                  border: appliedCoupon ? "1.5px dashed #bbf7d0" : "1.5px dashed #e9d5ff",
                  transition: "all 0.2s ease",
                }}
                onClick={() => {
                  const token = localStorage.getItem("medicomparestoken");
                  if (!token) {
                    toast.error("Please login to apply coupons");
                    navigateToLogin(navigate, "/labtest-checkout");
                    return;
                  }
                  setShowOffersModal(true);
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    background: appliedCoupon ? "#16a34a" : "#8059ca",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                  }}
                >
                  <i className="fas fa-tag" />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      fontWeight: 600,
                      color: appliedCoupon ? "#166534" : "#8059ca",
                      marginBottom: "2px",
                    }}
                  >
                    <span>{appliedCoupon ? "Coupon Applied!" : "Apply Coupon"}</span>
                    <i className="fas fa-chevron-right" style={{ fontSize: "11px" }} />
                  </div>
                  <div style={{ fontSize: "12px", color: appliedCoupon ? "#15803d" : "#64748b" }}>
                    {appliedCoupon ? (
                      <div className="d-flex align-items-center justify-content-between gap-2 mt-1">
                        <span style={{ fontWeight: 600 }}>{appliedCoupon.code}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAppliedCoupon(null);
                          }}
                          style={{
                            background: "#fee2e2",
                            border: "none",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            color: "#ef4444",
                            fontWeight: 700,
                            fontSize: "10px",
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    ) : "View available coupons & save more"}
                  </div>
                </div>
              </div>

              {/* Manual Coupon Input */}
              <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                <input
                  type="text"
                  placeholder="Enter Coupon Code"
                  value={couponInputText}
                  onChange={(e) => setCouponInputText(e.target.value)}
                  style={{
                    flex: 1,
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "8px 12px",
                    fontSize: "13px",
                    outline: "none",
                    transition: "border-color 0.2s",
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#8059ca"}
                  onBlur={(e) => e.target.style.borderColor = "#cbd5e1"}
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleManualCouponApply();
                  }}
                  style={{
                    background: "#8059ca",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "8px 16px",
                    fontSize: "13px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "#6f42c1"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "#8059ca"}
                >
                  Apply
                </button>
              </div>
            </div>


            {/* Sample Collection Schedule */}
            <div style={{ marginBottom: "28px" }}>
              <div
                style={{
                  fontSize: "15.5px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}
              >
                <Calendar size={16} style={{ color: "#8059ca" }} />
                Collection Schedule & Method
              </div>

              <div
                style={{
                  borderRadius: "14px",
                  border: "1.5px solid #f3e8ff",
                  background: "#fdfaff",
                  padding: "18px",
                  boxShadow: "0 2px 8px rgba(128, 89, 202, 0.04)"
                }}
              >
                {/* Collection Method Toggle */}
                {visitType === "both" ? (
                  <div style={{
                    display: "flex",
                    background: "#f1f5f9",
                    padding: "4px",
                    borderRadius: "10px",
                    marginBottom: "18px"
                  }}>
                    {/* Home Collection */}
                    <div
                      onClick={() => setCollectionMethod("home")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backgroundColor: collectionMethod === "home" ? "#ffffff" : "transparent",
                        color: collectionMethod === "home" ? "#8059ca" : "#64748b",
                        fontWeight: "600",
                        fontSize: "13px",
                        boxShadow: collectionMethod === "home" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
                      }}
                    >
                      <i className="fas fa-house-medical" style={{ fontSize: "14px" }} />
                      <span>Home Collection</span>
                    </div>

                    {/* Lab Visit */}
                    <div
                      onClick={() => setCollectionMethod("lab")}
                      style={{
                        flex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        backgroundColor: collectionMethod === "lab" ? "#ffffff" : "transparent",
                        color: collectionMethod === "lab" ? "#8059ca" : "#64748b",
                        fontWeight: "600",
                        fontSize: "13px",
                        boxShadow: collectionMethod === "lab" ? "0 2px 6px rgba(0,0,0,0.08)" : "none"
                      }}
                    >
                      <i className="fas fa-flask" style={{ fontSize: "14px" }} />
                      <span>Lab Visit</span>
                    </div>
                  </div>
                ) : visitType === "home" ? (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#fdfaff",
                      color: "#8059ca",
                      fontWeight: "700",
                      fontSize: "13.5px",
                      border: "1.5px solid #e9d5ff"
                    }}>
                      <i className="fas fa-house-medical" style={{ fontSize: "15px" }} />
                      <span>Home Collection Only</span>
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#7c3aed",
                      background: "#faf5ff",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      marginTop: "8px",
                      border: "1px solid #f3e8ff"
                    }}>
                      <i className="fas fa-info-circle" style={{ marginRight: "6px" }} />
                      Note: This diagnostic center only supports Home Sample Collection. A technician will visit your address.
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "18px" }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      padding: "12px 16px",
                      borderRadius: "10px",
                      backgroundColor: "#f8fafc",
                      color: "#475569",
                      fontWeight: "700",
                      fontSize: "13.5px",
                      border: "1.5px solid #e2e8f0"
                    }}>
                      <i className="fas fa-flask" style={{ fontSize: "15px" }} />
                      <span>Lab Visit Only</span>
                    </div>
                    <div style={{
                      fontSize: "12px",
                      color: "#475569",
                      background: "#f1f5f9",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      marginTop: "8px",
                      border: "1px solid #e2e8f0"
                    }}>
                      <i className="fas fa-info-circle" style={{ marginRight: "6px" }} />
                      Note: You must visit the diagnostic center for sample collection.
                    </div>
                  </div>
                )}


                {/* Divider */}
                <hr style={{ margin: "0 0 16px 0", border: "none", borderTop: "1.5px dashed #e9d5ff" }} />

                {/* Appointment Slot */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock size={13} style={{ color: "#8059ca" }} />
                      <label style={{ fontSize: "11px", fontWeight: "700", color: "#475569", margin: 0, letterSpacing: "0.5px" }}>
                        APPOINTMENT SLOT
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSlotPicker(true)}
                      style={{
                        background: "linear-gradient(135deg, #8059ca 0%, #6d3fc7 100%)",
                        border: "none",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "7px 14px",
                        fontSize: "12px",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        boxShadow: "0 2px 6px rgba(128,89,202,0.35)",
                        letterSpacing: "0.3px"
                      }}
                    >
                      <Calendar size={12} />
                      {selectedDate && selectedTimeSlot ? "CHANGE SLOT" : "PICK SLOT"}
                    </button>
                  </div>

                  {selectedDate && selectedTimeSlot ? (
                    <div
                      style={{
                        background: "linear-gradient(135deg, #f5f0ff 0%, #ede9ff 100%)",
                        borderRadius: "10px",
                        padding: "12px 14px",
                        border: "1.5px solid #c4b5fd",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px"
                      }}
                    >
                      <span style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        backgroundColor: "#8059ca",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Calendar size={16} color="#fff" />
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "11px", color: "#7c3aed", fontWeight: "600", marginBottom: "2px" }}>
                          Selected Slot
                        </div>
                        <div style={{ fontSize: "13px", color: "#1e293b", fontWeight: "700" }}>
                          {selectedSlotText || (
                            selectedDate instanceof Date
                              ? `${selectedDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · ${selectedTimeSlot}`
                              : `${selectedDate} · ${selectedTimeSlot}`
                          )}
                        </div>
                      </div>
                      <span style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        backgroundColor: "#16a34a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0
                      }}>
                        <Check size={12} color="#fff" />
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowSlotPicker(true)}
                      style={{
                        border: "1.5px dashed #c4b5fd",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        background: "#faf5ff",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px"
                      }}
                    >
                      <div style={{ fontSize: "24px", flexShrink: 0 }}>📅</div>
                      <div>
                        <div style={{ fontSize: "12.5px", color: "#7c3aed", fontWeight: "600" }}>No slot selected</div>
                        <div style={{ fontSize: "11px", color: "#a78bfa", marginTop: "2px" }}>Tap to pick a date &amp; time</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bill details */}
            <div style={{ marginBottom: "5px" }}>
              <div
                style={{
                  fontSize: "15.5px",
                  fontWeight: "600",
                  marginBottom: "12px",
                  color: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px"
                }}>
                Booking Summary
              </div>
              <div
                style={{
                  background: "#fdfaff",
                  border: "1.5px solid #f3e8ff",
                  borderRadius: "14px",
                  padding: "20px",
                  boxShadow: "0 2px 8px rgba(128, 89, 202, 0.02)"
                }}
              >
                <div style={{ display: "flex", justifySpace: "space-between", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "14px" }}>
                  <span style={{ fontWeight: 500 }}>Subtotal <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 400 }}>(Included of all taxes)</span></span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>₹{cartBilling?.subtotal?.toFixed(2)}</span>
                </div>



                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "14px" }}>
                  <span style={{ fontWeight: 500 }}>GST</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>₹{(cartBilling?.totalGst || 0).toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#16a34a", marginBottom: "14px" }}>
                    <span style={{ fontWeight: 600 }}>Coupon Discount</span>
                    <span style={{ fontWeight: 750 }}>- ₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {/* <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "14px" }}>
                  <span style={{ fontWeight: 500 }}>SGST (14%)</span>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>₹{SGstCalculate(subtotal).toFixed(2)}</span>
                </div> */}

                {homeVisitFee > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: "#475569", marginBottom: "14px", backgroundColor: "#fdf8ff", padding: "8px 12px", borderRadius: "8px", border: "1px dashed #e9d5ff" }}>
                    <span style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "6px" }}>
                      <i className="fas fa-house-medical" style={{ color: "#8059ca", fontSize: "11px" }} />
                      Home Visit Fee
                    </span>
                    <span style={{ fontWeight: 700, color: "#8059ca" }}>+ ₹{(serviceDetails?.homeVisitFee || 0).toFixed(2)}</span>
                  </div>
                )}
                {(walletUsed > 0 && selectedPayment === "online") && (
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "13px",
                      color: "#059669",
                      marginBottom: "14px",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>
                      Wallet Deduction
                    </span>
                    <span style={{ fontWeight: 600, color: "#059669" }}>
                      - ₹{walletUsed.toFixed(2)}
                    </span>
                  </div>
                )}
                <hr style={{ margin: "14px 0", border: '2px solid #c4b5fd' }} />


                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "15px", fontWeight: 600, color: '#8059ca' }}>
                  <span>Amount To Pay</span>
                  <span style={{ color: "#8059ca", fontSize: "17.5px" }}>₹{amountToPay.toFixed(2)}</span>
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "12.5px",
                    color: "#1e293b",
                    fontWeight: "600"
                  }}
                >
                  <span>Remaining Wallet Balance</span>
                  <span style={{ color: "#475569" }}>₹{(walletAmount - walletUsed).toFixed(2)}</span>
                </div>

              </div>


              {appliedCoupon && couponDiscount > 0 && (
                <div style={{ background: "#f0fdf4", padding: "10px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, color: "#15803d", marginTop: "12px", textAlign: "center", border: "1px solid #bbf7d0", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  <i className="fas fa-sparkles" style={{ color: "#16a34a" }} />
                  <span>YOU SAVED ₹{couponDiscount.toFixed(2)} ON THIS ORDER!</span>
                </div>
              )}

              <div style={{
                // fontSize: "15.5px", 
                // fontWeight: "600", 
                margin: isMobile ? "16px 0 10px 0" : "28px 0 12px 0",
                // color: "#1e293b"
                fontSize: "15.5px",
                fontWeight: "600",
                marginBottom: "12px",
                color: "#1e293b",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                Choose Payment Method
              </div>

              <div style={{ display: "flex", flexDirection: isMobile || isTablet ? "column" : "row", gap: "8px", marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
                {/* Online Option */}
                <div
                  style={{
                    flex: "1 1 0%",
                    minWidth: 0,
                    border: selectedPayment === "online" ? "2px solid #8059ca" : "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: selectedPayment === "online" ? "#fdfaff" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: selectedPayment === "online" ? "0 4px 12px rgba(128, 89, 202, 0.08)" : "none",
                    boxSizing: "border-box"
                  }}
                  onClick={() => setSelectedPayment("online")}
                  onMouseEnter={(e) => {
                    if (selectedPayment !== "online") {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.backgroundColor = "#fafbfc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPayment !== "online") {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.backgroundColor = "#ffffff";
                    }
                  }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: selectedPayment === "online" ? "#8059ca" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: selectedPayment === "online" ? "#fff" : "#64748b", fontSize: "12px", transition: "all 0.2s ease", flexShrink: 0 }}>
                    <i className="fas fa-credit-card" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: selectedPayment === "online" ? "#8059ca" : "#1e293b", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Online Payment
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>UPI, Cards, NetBanking</div>
                  </div>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: selectedPayment === "online" ? "4px solid #8059ca" : "2px solid #cbd5e1", background: "#fff", transition: "all 0.2s ease", flexShrink: 0 }} />
                </div>

                {/* COD Option */}
                <div
                  style={{
                    flex: "1 1 0%",
                    minWidth: 0,
                    border: selectedPayment === "cod" ? "2px solid #8059ca" : "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    padding: "10px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    backgroundColor: selectedPayment === "cod" ? "#fdfaff" : "#ffffff",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    boxShadow: selectedPayment === "cod" ? "0 4px 12px rgba(128, 89, 202, 0.08)" : "none",
                    boxSizing: "border-box"
                  }}
                  onClick={() => {
                    setSelectedPayment("cod");
                    setAppliedCoupon(null);
                  }}
                  onMouseEnter={(e) => {
                    if (selectedPayment !== "cod") {
                      e.currentTarget.style.borderColor = "#cbd5e1";
                      e.currentTarget.style.backgroundColor = "#fafbfc";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedPayment !== "cod") {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.backgroundColor = "#ffffff";
                    }
                  }}
                >
                  <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: selectedPayment === "cod" ? "#8059ca" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: selectedPayment === "cod" ? "#fff" : "#64748b", fontSize: "12px", transition: "all 0.2s ease", flexShrink: 0 }}>
                    <i className="fas fa-money-bill-wave" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: selectedPayment === "cod" ? "#8059ca" : "#1e293b", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Pay at Sample Collection
                    </div>
                    <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Pay at the time of sample collection</div>
                  </div>
                  <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: selectedPayment === "cod" ? "4px solid #8059ca" : "2px solid #cbd5e1", background: "#fff", transition: "all 0.2s ease", flexShrink: 0 }} />
                </div>
              </div>

              <hr style={{ margin: "18px 0", borderColor: "#f1f5f9" }} />

              {/* Checkout Actions */}
              <div style={{ display: "flex", flexDirection: "row", gap: "12px", backgroundColor: "#fdfaff", padding: "16px", borderRadius: "14px", alignItems: "center", border: "1px solid #f3e8ff" }}>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
                  <div style={{ fontSize: "12px", fontWeight: 600, color: "#6b7280" }}>Total Payable</div>
                  <div style={{ fontSize: "20px", fontWeight: 800, color: "#1e1b4b" }}>₹{amountToPay.toFixed(2)}</div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  style={{
                    flex: 1,
                    padding: "8px 20px",
                    background: isSubmitting ? "#cbd5e1" : "linear-gradient(135deg, #8059ca 0%, #6f42c1 100%)",
                    color: "#fff",
                    border: "none",
                    borderRadius: "10px",
                    fontSize: "14.5px",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                    boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(128, 89, 202, 0.25)",
                    transition: "all 0.2s ease"
                  }}
                >
                  {isSubmitting ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <Offcanvas
        show={showSlotPicker}
        onHide={() => setShowSlotPicker(false)}
        placement="end"
        style={{ zIndex: "9999999999" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Book A Slot</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <VendorCalendarSlotPicker
            layout="row"
            selectedDate={selectedDate instanceof Date ? selectedDate : (selectedDate ? new Date(selectedDate) : null)}
            selectedTimeSlot={selectedTimeSlot}
            calendarDays={slotCalendarDays}
            calendarMonth={slotCalendarMonth}
            calendarYear={slotCalendarYear}
            isLoading={slotTimingsLoading}
            onMonthChange={(month, year) => fetchSlotVendorCalendar(month, year)}
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
              setSelectedSlotText(formattedSlot);
              setShowSlotPicker(false);
            }}
          />
        </Offcanvas.Body>
      </Offcanvas>

      <Footer />

      {/* Location Offcanvas */}
      <LocationOffcanvas
        isOpen={showLocationOffcanvas}
        onClose={() => {
          setShowLocationOffcanvas(false);
          loadSavedAddresses();
        }}
        position={offcanvasPosition}
        source="header"
      />

      {/* Coupon modal */}
      {showOffersModal && (
        <div
          className="offers-modal-overlay"
          onClick={() => setShowOffersModal(false)}
        >
          <div
            className="offers-modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "580px" }}
          >
            <div className="offers-modal-header">
              <h3 className="offers-modal-title">Apply Coupon</h3>
              <button
                className="offers-modal-close"
                onClick={() => setShowOffersModal(false)}
              >
                ×
              </button>
            </div>

            {(() => {
              const getCouponsList = (type) => {
                if (couponDetails) {
                  if (Array.isArray(couponDetails)) {
                    return couponDetails.filter(c => c.createdType === type);
                  }
                  if (type === 'admin' && Array.isArray(couponDetails.adminCoupons)) {
                    return couponDetails.adminCoupons;
                  }
                  if (type === 'vendor' && Array.isArray(couponDetails.vendorCoupons)) {
                    return couponDetails.vendorCoupons;
                  }
                }
                return [];
              };

              const adminCoupons = getCouponsList('admin');
              const vendorCoupons = getCouponsList('vendor');

              return (
                <>
                  <div className="offers-modal-body" style={{ padding: '20px', background: '#f8fafc' }}>
                    <div className="offers-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                      {(() => {
                        const cartVendorIds = Array.isArray(cartItems) ? cartItems.map(item => String(item.vendorId)) : [];

                        // Sort vendor coupons: matching vendor first, then higher discount first
                        const sortedVendorCoupons = [...vendorCoupons].sort((a, b) => {
                          const aMatches = cartVendorIds.includes(String(a.createdBy)) || cartVendorIds.includes(String(a.businessDetails?._id));
                          const bMatches = cartVendorIds.includes(String(b.createdBy)) || cartVendorIds.includes(String(b.businessDetails?._id));

                          if (aMatches && !bMatches) return -1;
                          if (!aMatches && bMatches) return 1;

                          return (b.discount || 0) - (a.discount || 0);
                        });

                        // Sort admin coupons: higher discount first
                        const sortedAdminCoupons = [...adminCoupons].sort((a, b) => (b.discount || 0) - (a.discount || 0));

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
                            bg: "#fafffb",
                            border: "#d1fae5",
                            accent: "#22c55e",
                            badgeBg: "#f0fdf4",
                            badgeText: "#16a34a",
                            btnBg: "#f0fdf4",
                            btnText: "#16a34a",
                            btnBorder: "#bbf7d0",
                          },
                          good: {
                            label: "Good Deal",
                            bg: "#f8fbff",
                            border: "#dbeafe",
                            accent: "#3b82f6",
                            badgeBg: "#eff6ff",
                            badgeText: "#2563eb",
                            btnBg: "#eff6ff",
                            btnText: "#2563eb",
                            btnBorder: "#bfdbfe",
                          },
                          hot: {
                            label: "Hot Deal",
                            bg: "#fffdf7",
                            border: "#fde68a",
                            accent: "#d97706",
                            badgeBg: "#fffbeb",
                            badgeText: "#b45309",
                            btnBg: "#fffbeb",
                            btnText: "#d97706",
                            btnBorder: "#fcd34d",
                          },
                          mega: {
                            label: "Mega Save",
                            bg: "#fcfaff",
                            border: "#e9d5ff",
                            accent: "#8059ca",
                            badgeBg: "#f5f3ff",
                            badgeText: "#7c3aed",
                            btnBg: "#f3e8ff",
                            btnText: "#8059ca",
                            btnBorder: "#ddd6fe",
                          },
                        };

                        const renderCouponCard = (ele, ind, isVendorCoupon) => {
                          const isApplied = appliedCoupon?._id === ele._id;
                          const discountText = ele?.discountType === "fixed"
                            ? `₹${ele.discount}`
                            : `${ele.discount}%`;

                          let isEligible;

                          let applicableAmount = 0;
                          let criteriaText = "";

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
                            const vendorIdStr = String(ele.createdBy || ele.businessDetails?._id || "");
                            const vendorItems = cartItems.filter(item => String(item.vendorId) === vendorIdStr);
                            applicableAmount = vendorItems.reduce((sum, item) => {
                              const price = getEffectivePrice(item);
                              return sum + (price * (parseInt(item.quantity) || 1));
                            }, 0);

                            if (hasExpired) {
                              isEligible = false;
                            } else if (applicableAmount < ele.minimumPurchase) {
                              isEligible = false;
                              const diff = (ele.minimumPurchase - applicableAmount).toFixed(2);
                              criteriaText = `Add ₹${diff} more of this vendor's items`;
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
                            bg: "#f8fafc",
                            border: "#e2e8f0",
                            accent: "#94a3b8",
                            badgeBg: "#f1f5f9",
                            badgeText: "#64748b",
                            btnBg: "#f1f5f9",
                            btnText: "#94a3b8",
                            btnBorder: "#e2e8f0",
                            label: "Unavailable",
                          };
                          const appliedTheme = {
                            bg: "#f6fef9",
                            border: "#a7f3d0",
                            accent: "#10b981",
                            badgeBg: "#ecfdf5",
                            badgeText: "#059669",
                            btnBg: "#ecfdf5",
                            btnText: "#059669",
                            btnBorder: "#a7f3d0",
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
                              style={{
                                display: "flex",
                                alignItems: "stretch",
                                width: "100%",
                                background: activeTheme.bg,
                                border: `1px solid ${activeTheme.border}`,
                                borderRadius: "12px",
                                overflow: "hidden",
                                transition: "all 0.2s ease",
                                boxShadow: "none",
                                opacity: isEligible ? 1 : 0.72,
                              }}
                            >
                              {/* Discount badge column */}
                              <div
                                style={{
                                  minWidth: "88px",
                                  maxWidth: "88px",
                                  padding: "14px 10px",
                                  background: activeTheme.badgeBg,
                                  borderRight: `1px dashed ${activeTheme.border}`,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "4px",
                                  textAlign: "center",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "20px",
                                    fontWeight: "800",
                                    color: activeTheme.badgeText,
                                    lineHeight: 1.1,
                                  }}
                                >
                                  {discountText}
                                </span>
                                <span
                                  style={{
                                    fontSize: "9px",
                                    fontWeight: "700",
                                    color: activeTheme.badgeText,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.3px",
                                  }}
                                >
                                  OFF
                                </span>
                                <span
                                  style={{
                                    fontSize: "8.5px",
                                    fontWeight: "700",
                                    color: activeTheme.accent,
                                    background: "#ffffff",
                                    padding: "2px 6px",
                                    borderRadius: "10px",
                                    marginTop: "4px",
                                  }}
                                >
                                  {activeTheme.label}
                                </span>
                              </div>

                              {/* Details column */}
                              <div
                                style={{
                                  flex: 1,
                                  padding: "12px 14px",
                                  display: "flex",
                                  flexDirection: "column",
                                  gap: "6px",
                                  minWidth: 0,
                                }}
                              >
                                <h4
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    color: "#0f172a",
                                    margin: 0,
                                    lineHeight: 1.3,
                                  }}
                                >
                                  {ele.name}
                                </h4>

                                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "center" }}>
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      fontFamily: "monospace",
                                      color: activeTheme.accent,
                                      background: "#ffffff",
                                      border: `1px dashed ${activeTheme.border}`,
                                      borderRadius: "6px",
                                      padding: "3px 8px",
                                    }}
                                  >
                                    {ele.code}
                                  </span>
                                  {ele.minimumPurchase > 0 && (
                                    <span style={{ fontSize: "10px", color: "#64748b" }}>
                                      Minimum order ₹{ele.minimumPurchase}
                                    </span>
                                  )}
                                </div>

                                {ele.description && (
                                  <p
                                    style={{
                                      fontSize: "11px",
                                      color: "#475569",
                                      margin: 0,
                                      lineHeight: 1.45,
                                      display: "-webkit-box",
                                      WebkitLineClamp: 2,
                                      WebkitBoxOrient: "vertical",
                                      overflow: "hidden",
                                    }}
                                  >
                                    {ele.description}
                                  </p>
                                )}

                                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", fontSize: "10px", color: "#64748b" }}>
                                  {isEligible && savingsPreview > 0 && (
                                    <span style={{ fontWeight: "600", color: activeTheme.accent }}>
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
                                  <span style={{ fontSize: "10px", color: "#dc2626", fontWeight: "600" }}>
                                    ⚠️ {criteriaText}
                                  </span>
                                )}
                              </div>

                              {/* Apply button column */}
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  padding: "12px 12px 12px 0",
                                  flexShrink: 0,
                                }}
                              >
                                <button
                                  type="button"
                                  disabled={!isEligible}
                                  onClick={() => handleCouponApply(ele)}
                                  style={{
                                    padding: "7px 14px",
                                    borderRadius: "8px",
                                    border: `1px solid ${activeTheme.btnBorder}`,
                                    background: activeTheme.btnBg,
                                    color: activeTheme.btnText,
                                    fontSize: "12px",
                                    fontWeight: "600",
                                    cursor: !isEligible ? "not-allowed" : "pointer",
                                    transition: "all 0.2s ease",
                                    whiteSpace: "nowrap",
                                    boxShadow: "none",
                                  }}
                                >
                                  {isApplied ? "Applied" : "Apply"}
                                </button>
                              </div>
                            </div>
                          );
                        };

                        const renderSection = (coupons, isVendorCoupon) => {
                          if (coupons.length === 0) return null;

                          return coupons.map((ele, ind) => renderCouponCard(ele, ind, isVendorCoupon));
                        };

                        if (sortedVendorCoupons.length === 0 && sortedAdminCoupons.length === 0) {
                          return (
                            <div style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '40px 20px',
                              textAlign: 'center',
                              color: '#94a3b8'
                            }}>
                              <div style={{ fontSize: '32px', marginBottom: '12px', color: '#cbd5e1' }}>🎟️</div>
                              <span style={{ fontSize: '14px', fontWeight: '600', color: '#64748b' }}>
                                No Coupons Available
                              </span>
                              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                There are no active coupons at the moment.
                              </span>
                            </div>
                          );
                        }

                        return (
                          <>
                            {renderSection(sortedVendorCoupons, true)}
                            {sortedVendorCoupons.length > 0 && sortedAdminCoupons.length > 0 && (
                              <div
                                style={{
                                  height: "1px",
                                  background: "#e2e8f0",
                                  margin: "4px 0",
                                }}
                              />
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
    </div>
  );
};
