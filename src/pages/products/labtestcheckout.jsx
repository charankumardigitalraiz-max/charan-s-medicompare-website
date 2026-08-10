import { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import Home2Header from "../../components/layout/Header-k";
import Footer from "../../components/layout/Footer-f";
import Select from "react-select";
import CategoryProvider from "../../components/ui/CategoryProvider.jsx";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../Apiservice.jsx";
import { getImageUrl } from "../../utils/index";
import { Trash2, Calendar, Clock, User, Check, AlertCircle } from "react-feather";
import toast from "react-hot-toast";
import LocationOffcanvas from "../../components/ui/LocationOffCanvas.jsx";
import { useCartContext } from "../../context/CartContext";
import { useLocation } from "../../context/LocationContext";
import { navigateToLogin } from "../../utils/redirectUtils";
import { openRazorpayCheckout } from "../../utils/razorpayUtils";
import { useResponsive } from "../../hooks";
import { useProfile } from "../../context/ProfileContext";
import { Offcanvas } from "../../components/ui/Offcanvas";
import VendorCalendarSlotPicker from "../../components/ui/VendorCalendarSlotPicker";
import PageLoader from "../../components/ui/PageLoader.jsx";
import RecentlyViewedProducts from "../../components/ui/RecentlyViewedProducts.jsx";
import CouponOffersModal from "../../components/ui/CouponOffersModal.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../services/bookingService";
import {
  getReferredDoctorSelectOptions,
  handleReferredDoctorInputChange,
  handleReferredDoctorSelectChange,
  referredDoctorSelectComponents,
} from "../../components/ui/referredDoctorSelectUtils";

const customSelectStyles = {
  control: (provided, state) => ({
    ...provided,
    borderColor: state.isFocused ? "#321961" : "#e9ecef",
    boxShadow: state.isFocused ? "0 0 0 3px rgba(128, 89, 202, 0.15)" : null,
    "&:hover": {
      borderColor: "#321961"
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
      ? "#321961"
      : state.isFocused
        ? "#f3effa"
        : "#fff",
    color: state.isSelected ? "#fff" : "#333",
    cursor: "pointer",
    fontSize: "14px",
    padding: "10px 14px",
    "&:active": {
      backgroundColor: "#321961"
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
    cartBilling,
    relevantProducts,
  } = useCartContext();
  console.log("service fee details 1 ", serviceFeeDetails);
  console.log("service fee details 2", serviceDetails)
  const navigate = useNavigate();
  const handleProductClick = (item) => {
    if (item.type === "package" || item.packageId) return;

    const product = item?.productDetails || item;
    const tablet = product?.tabletDetails || item?.tabletDetails;

    const subcategoryData =
      tablet?.subcategoryDetails || product?.subcategoryDetails;

    const categoryData =
      subcategoryData?.categoryDetails || product?.categoryDetails;

    const service =
      categoryData?.slug ||
      tablet?.subcategoryDetails?.categoryDetails?.slug ||
      "pharmacy";
    const subcategory =
      subcategoryData?.slug || tablet?.subcategoryDetails?.slug || "otc";
    const productSlug = tablet?.slug || product?.slug;

    if (productSlug && subcategory && service) {
      navigate(`/${service}/${subcategory}/${productSlug}`);
    }
  };

  const handleBooking = async (
    vendor,
    med,
    effectiveVariantId,
    price,
    stock,
    path,
    servicePassed
  ) => {
    const isLoggedIn = !!localStorage.getItem("medicomparestoken");
    await handleGeneralBookingProcess(
      isLoggedIn,
      navigate,
      vendor,
      med,
      effectiveVariantId,
      price,
      stock,
      path,
      servicePassed
    );
  };
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
    if (coupon?.remove) {
      setAppliedCoupon(null);
      toast.success("Coupon removed successfully!");
      return;
    }

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
      const phone = localStorage.getItem("phone")
      const email = localStorage.getItem("email")
      const name = localStorage.getItem("name") || "Customer"

      openRazorpayCheckout({
        razorpayData,
        description: "Lab Test Order Payment",
        prefill: {
          name: name,
          contact: phone,
          email: email
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
    <div className="main-wrapper bg-[#f8f9fa] min-h-screen">
      <Home2Header />
      <CategoryProvider />

      <div
        className={`flex gap-4 md:gap-6 items-start max-w-[1440px] mx-auto pt-4 pb-12 ${isMobile || isTablet ? "flex-col px-3" : "flex-row px-[30px]"
          } 
          }`}
      >
        <div
          className={`card shadow-sm border-none bg-white relative rounded-xl ${labTestItems.length === 0 || isMobile || isTablet ? "w-full" : "w-[67%]"
            } ${isMobile ? "p-4 mb-1" : "p-6 mb-0"
            }`}
        >
          <div className="pt-0 mb-[15px]">
            <Link
              to="/"
              className="inline-flex items-center gap-2 !text-[#321961] !border !border-[#e9d5ff] !rounded-[30px] px-[18px] py-1.5 no-underline !text-[13px] !font-semibold !bg-[#fdfaff] transition-all duration-200 !hover:!text-white !hover:bg-primary !hover:border-[#321961] !hover:shadow-[0_4px_12px_rgba(128,89,202,0.2)] !shadow-[0_2px_5px_rgba(128,89,202,0.05)]"
            >
              <i className="fas fa-arrow-left text-[11px]" />
              Back to Home
            </Link>
          </div>

          {labTestItems.length === 0 ? (
            <div className="text-center py-8">
              <i className="fas fa-microscope text-slate-400 mb-3 text-[48px] !text-[#321961]" />
              <h5 className="text-slate-500 font-bold mb-1">
                Your Lab Cart is Empty
              </h5>
              <p className="text-slate-400 mb-5">No lab tests added to your cart yet</p>
              <Link
                to="/"
                className="inline-flex items-center justify-center w-[180px] bg-[#321961] hover:bg-[#6d3fc7] text-white font-semibold py-2.5 rounded-full shadow-sm text-sm border-none transition-colors duration-200"
              >
                Browse Lab Tests
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
              {/* Vendor Details Card */}
              {labTestItems?.[0]?.vendorDetails && (
                <div className="col-span-1 md:col-span-2">
                  <div
                    className="rounded-2xl border border-[#e9d5ff] bg-gradient-to-br from-[#fdfaff] to-[#f5f0ff] px-5 py-[18px] mb-1 flex items-center gap-4 shadow-[0_4px_16px_rgba(128,89,202,0.07)]"
                  >
                    {/* Vendor logo/icon */}
                    <div
                      className="w-[52px] h-[52px] rounded-[14px] bg-white border-[1.5px] border-[#e9d5ff] flex items-center justify-center shrink-0 overflow-hidden shadow-[0_2px_8px_rgba(128,89,202,0.1)]"
                    >
                      {labTestItems[0].vendorDetails?.businessProfile?.files?.[0] || labTestItems[0].vendorDetails?.files?.[0] ? (
                        <img
                          src={getImageUrl(labTestItems[0].vendorDetails?.businessProfile?.files?.[0] || labTestItems[0].vendorDetails?.files?.[0])}
                          alt="vendor"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <i className="fas fa-microscope text-[22px] text-[#321961]" />
                      )}
                    </div>

                    {/* Vendor info */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-bold text-[#1e1b4b] mb-1 overflow-hidden text-ellipsis whitespace-nowrap capitalize">
                        {labTestItems[0]?.vendorDetails?.businessProfile?.name ||
                          labTestItems[0]?.vendorDetails?.name ||
                          labTestItems[0]?.vendorName ||
                          "Diagnostic Centre"}
                      </div>

                      <div className="flex flex-wrap gap-2.5 text-xs text-[#64748b]">
                        {(labTestItems[0].vendorDetails?.businessProfile?.mobile ||
                          labTestItems[0].vendorDetails?.mobile ||
                          labTestItems[0].vendorDetails?.phone) && (
                            <span className="flex items-center gap-1">
                              <i className="fas fa-phone text-[#321961] text-[10px]" />
                              {labTestItems[0].vendorDetails?.businessProfile?.mobile ||
                                labTestItems[0].vendorDetails?.mobile ||
                                labTestItems[0].vendorDetails?.phone}
                            </span>
                          )}
                        {(vendorLocation?.address ||
                          labTestItems[0].vendorDetails?.businessProfile?.location?.address ||
                          labTestItems[0].vendorDetails?.residentaladdress) && (
                            <span
                              className="flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap"
                            >
                              <i className="fas fa-map-marker-alt text-[#321961] text-[10px]" />
                              <span className="overflow-hidden text-ellipsis whitespace-nowrap max-w-[260px]">
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
                      className="bg-[#ecfdf5] border border-[#a7f3d0] rounded-lg px-2.5 py-1 text-[11px] font-bold text-[#059669] flex items-center gap-1 shrink-0"
                    >
                      <i className="fas fa-check-circle text-[10px]" />
                      Verified
                    </div>
                  </div>
                </div>
              )}
              {/* Patient assignment block */}

              {/* Delivery / Collection Address */}
              <div className="col-span-1">
                <div
                  className="rounded-md overflow-hidden border border-[#e9ecef] bg-white mb-4 md:mb-6 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),_0_8px_10px_-6px_rgba(0,0,0,0.05)]"
                >
                  <div
                    className="flex justify-between items-center px-3 py-4 bg-[#faf8ff] border-b border-[#f3e8ff]"
                  >
                    <div
                      className="text-[13px] font-bold text-[#5b21b6] flex items-center gap-2"
                    >
                      <i className="fas fa-map-marker-alt text-[#321961]"></i>
                      <span>{getAddressTypeLabel()}</span>
                    </div>
                    <div>
                      {collectionMethod === "home" && (
                        <button
                          className="text-white bg-primary border-none !font-semibold cursor-pointer !text-[11px] px-4 py-1.5 !rounded-[20px] shadow-[0_2px_4px_rgba(0,0,0,0.1)] hover:-translate-y-px transition-all duration-200"
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
                        className="p-3 bg-white text-[13.5px] text-[#475569] leading-relaxed"
                      >
                        <div>
                          {selectedAddress.name && (
                            <div
                              className="font-bold text-[#0f172a] mb-1.5 text-[14.5px]"
                            >
                              {selectedAddress.name}
                            </div>
                          )}
                          {selectedAddress.phone && (
                            <div className="text-[#64748b] text-[13px] mb-1">{selectedAddress.phone}</div>
                          )}
                          {selectedAddress.addressLine1 || selectedAddress.location?.address ? (
                            <div className="text-[#334155]">
                              {selectedAddress.addressLine1 || selectedAddress.location?.address}
                              {selectedAddress.addressLine2 ? `, ${selectedAddress.addressLine2}` : ""}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="px-5 py-6 bg-white text-[13.5px] text-[#64748b] flex flex-col items-center justify-center gap-2.5 text-center"
                      >
                        <i className="fas fa-map-marked-alt text-[24px] text-[#cbd5e1]"></i>
                        <span>No collection address selected yet</span>
                      </div>
                    )
                  ) : (
                    <div
                      className="p-3 bg-white text-[13.5px] text-[#475569] leading-relaxed"
                    >
                      <div>
                        <div
                          className="font-bold text-[#0f172a] mb-1.5 text-[14.5px] capitalize"
                        >
                          {labTestItems[0]?.vendorDetails?.businessProfile?.name ||
                            labTestItems[0]?.vendorDetails?.name ||
                            labTestItems[0]?.vendorName ||
                            "Diagnostic Centre"}
                        </div>
                        {(labTestItems?.[0]?.vendorDetails?.businessProfile?.mobile || labTestItems?.[0]?.vendorDetails?.mobile || labTestItems?.[0]?.vendorDetails?.phone) && (
                          <div className="text-[#64748b] text-[13px] mb-1">
                            Phone: {labTestItems?.[0]?.vendorDetails?.businessProfile?.mobile || labTestItems?.[0]?.vendorDetails?.mobile || labTestItems?.[0]?.vendorDetails?.phone}
                          </div>
                        )}
                        <div className="text-[#334155]">
                          {vendorLocation?.address || labTestItems?.[0]?.vendorDetails?.businessProfile?.location?.address || labTestItems?.[0]?.vendorDetails?.businessProfile?.address || labTestItems?.[0]?.vendorDetails?.residentaladdress || "Address not available"}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>


              {/* Referred Doctor Selection */}
              <div className="col-span-1 mb-4 md:mb-6">
                <div
                  className="rounded-md border border-[#e9ecef] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)] bg-white p-3"
                >
                  <div className="text-[15px] font-[500] text-[#0f172a] mb-3 flex items-center gap-2">
                    <i className="fa-solid fa-user-doctor text-[#321961] "></i>
                    Referred Doctor
                  </div>
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
              <div className="col-span-1 md:col-span-2">
                <div
                  className={isMobile ? "bg-transparent rounded-none shadow-none p-0" : "bg-white rounded-md border border-[#e2e8f0] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6"}
                >
                  {/* Section header — Vendor details (highlighted) */}
                  <div
                    className="border-[1.5px] border-l-4 border-[#c4b5fd] border-l-[#321961] rounded-xl px-4 py-3.5 mb-5 flex items-center gap-3 bg-gradient-to-br from-[#f5f0ff] to-[#ede9ff] shadow-[0_4px_14px_rgba(128,89,202,0.12)]"
                  >
                    <div className="flex items-center gap-3 w-full">
                      {/* Vendor icon */}
                      <div
                        className="w-11 h-11 rounded-xl bg-white border-2 border-[#e9d5ff] flex items-center justify-center shrink-0 overflow-hidden shadow-[0_2px_8px_rgba(128,89,202,0.15)]"
                      >
                        {labTestItems[0]?.vendorDetails?.businessProfile?.files?.[0] || labTestItems[0]?.vendorDetails?.files?.[0] ? (
                          <img
                            src={getImageUrl(labTestItems[0]?.vendorDetails?.businessProfile?.files?.[0] || labTestItems[0]?.vendorDetails?.files?.[0])}
                            alt="vendor"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <i className="fas fa-microscope text-[18px] text-[#321961]" />
                        )}
                      </div>

                      {/* Vendor name + details */}
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-[#3b0764] text-[14.5px] overflow-hidden text-ellipsis whitespace-nowrap mb-1 capitalize">
                          {labTestItems[0]?.vendorDetails?.businessProfile?.name ||
                            labTestItems[0]?.vendorDetails?.name ||
                            labTestItems[0]?.vendorName ||
                            "Diagnostic Centre"}
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {(labTestItems[0]?.vendorDetails?.businessProfile?.mobile || labTestItems[0]?.vendorDetails?.mobile || labTestItems[0]?.vendorDetails?.phone) && (
                            <span className="text-[11.5px] text-[#6d28d9] flex items-center gap-1 font-semibold">
                              <i className="fas fa-phone text-[#321961] text-[9px]" />
                              {labTestItems[0]?.vendorDetails?.businessProfile?.mobile || labTestItems[0]?.vendorDetails?.mobile || labTestItems[0]?.vendorDetails?.phone}
                            </span>
                          )}
                          {(vendorLocation?.address || labTestItems[0]?.vendorDetails?.businessProfile?.location?.address || labTestItems[0]?.vendorDetails?.residentaladdress) && (
                            <span className="text-[11.5px] text-[#6d28d9] flex items-center gap-1 overflow-hidden text-ellipsis whitespace-nowrap max-w-[300px] font-medium">
                              <i className="fas fa-map-marker-alt text-[#321961] text-[9px]" />
                              {vendorLocation?.address || labTestItems[0]?.vendorDetails?.businessProfile?.location?.address || labTestItems[0]?.vendorDetails?.residentaladdress}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Test count badge */}
                      <div
                        className="bg-[#321961] rounded-lg px-3 py-1.5 text-xs font-bold text-white whitespace-nowrap shrink-0 shadow-[0_2px_6px_rgba(128,89,202,0.3)]"
                      >
                        {labTestItems.length} test{labTestItems.length !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
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

                      return (
                        <div
                          key={patientId}
                          className="bg-white rounded-md border border-[#e9ecef] overflow-hidden"
                        >
                          {/* Patient header */}
                          <div className={`px-4 py-3.5 flex items-center gap-3 ${displayItems.length > 0 ? "border-b border-[#f1f5f9]" : "border-b-0"}`}>
                            {/* Avatar */}
                            <div className="w-[38px] h-[38px] rounded-full bg-[#321961] flex items-center justify-center shrink-0 text-white text-xs font-extrabold tracking-wide">
                              {initials}
                            </div>
                            {/* Name & count */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-[#1e293b] overflow-hidden text-ellipsis whitespace-nowrap">
                                {patientName}
                              </div>
                              <div className="text-[11.5px] text-[#64748b] mt-0.5">
                                {displayItems.length === 0 ? "No tests assigned" : `${displayItems.length} test${displayItems.length !== 1 ? "s" : ""} booked`}
                              </div>
                            </div>
                            {/* Count chip */}
                            {displayItems.length > 0 && (
                              <div className="bg-[#f1f5f9] border border-[#e2e8f0] rounded-[20px] px-2.5 py-1 text-[11px] font-bold text-[#475569] whitespace-nowrap shrink-0">
                                {displayItems.length} test{displayItems.length !== 1 ? "s" : ""}
                              </div>
                            )}
                          </div>

                          {/* Test rows */}
                          {displayItems.length === 0 ? (
                            <div className="px-4 py-4 text-center text-[#94a3b8] text-[12.5px] italic">
                              No tests assigned to this patient yet
                            </div>
                          ) : (
                            <div className="px-4 pt-2 pb-3.5">
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
                                    className={`flex items-center gap-3 py-2.5 ${idx < displayItems.length - 1 ? "border-b border-[#f8fafc]" : ""}`}
                                  >
                                    {/* Flask icon or image */}
                                    <div className="w-[42px] h-[42px] rounded-[10px] bg-[#f5f3ff] border border-[#ede9fe] flex items-center justify-center shrink-0 overflow-hidden">
                                      {resolveImage(item) ? (
                                        <img src={resolveImage(item)} alt={name} className="w-full h-full object-cover" />
                                      ) : (
                                        <i className="fa-solid fa-flask text-[16px] text-[#321961]" />
                                      )}
                                    </div>

                                    {/* Name + price */}
                                    <div className="flex-1 min-w-0">
                                      <div className="text-[13px] font-semibold text-[#1e293b] overflow-hidden text-ellipsis whitespace-nowrap mb-[3px] capitalize">
                                        {name}
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[13px] font-extrabold text-[#0f172a]">₹{(billingSummary?.unitPrice || 0).toFixed(0)}</span>
                                        {billingSummary?.isDiscount && <span className="text-[11px] text-[#94a3b8] line-through">₹{(billingSummary?.basePrice || 0).toFixed(0)}</span>}
                                        {billingSummary?.isDiscount && (
                                          <span className="bg-[#f0fdf4] text-[#16a34a] text-[9.5px] font-bold px-1.5 py-0.5 rounded border border-[#bbf7d0]">
                                            {`${Math.round(((billingSummary.basePrice - billingSummary.unitPrice) / billingSummary.basePrice) * 100)}% OFF`}
                                          </span>
                                        )}
                                      </div>
                                    </div>

                                    {/* Delete */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePatientItem(item._id, patientId)}
                                      className="w-[30px] h-[30px] rounded-lg bg-[#fff5f5] border border-[#fecaca] flex items-center justify-center cursor-pointer shrink-0"
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
                          className="bg-white rounded-2xl border border-[#fecaca] border-l-4 border-l-[#ef4444] shadow-[0_2px_12px_rgba(239,68,68,0.06)] overflow-hidden"
                        >
                          {/* Header */}
                          <div className="px-4 py-3 flex items-center gap-2.5 border-b border-[#fee2e2] bg-[#fff5f5]">
                            <div className="w-[34px] h-[34px] rounded-full bg-[#fee2e2] border-[1.5px] border-[#fecaca] flex items-center justify-center shrink-0">
                              <AlertCircle size={16} color="#ef4444" />
                            </div>
                            <div className="flex-grow">
                              <div className="text-[13.5px] font-bold text-[#991b1b]">Unassigned Tests</div>
                              <div className="text-[11px] text-[#dc2626] mt-0.5">Assign a patient to each test before checkout</div>
                            </div>
                            <div className="bg-[#fee2e2] border border-[#fecaca] rounded-[20px] px-2.5 py-1 text-[11px] font-bold text-[#ef4444] shrink-0">
                              {unassigned.length} pending
                            </div>
                          </div>

                          {/* Items */}
                          <div className="px-4 pt-2 pb-3.5">
                            {unassigned.map((item, idx) => {
                              const isPackage = item?.type === "package" || !!item?.packageId;
                              const targetDetails = isPackage ? item?.packageDetails : item;
                              const name = targetDetails?.name || "Lab Test";
                              const price = getEffectivePrice(item);
                              return (
                                <div
                                  key={item.cartKey || item._id}
                                  className={`flex items-center gap-3 py-2.5 ${idx < unassigned.length - 1 ? "border-b border-[#fff5f5]" : ""}`}
                                >
                                  <div className="w-[42px] h-[42px] rounded-[10px] bg-[#fff5f5] border border-[#fecaca] flex items-center justify-center shrink-0 overflow-hidden">
                                    {resolveImage(item) ? (
                                      <img src={resolveImage(item)} alt={name} className="w-full h-full object-cover" />
                                    ) : (
                                      <i className="fa-solid fa-flask text-[16px] text-[#ef4444]" />
                                    )}
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <div className="text-[13px] font-semibold text-[#1e293b] overflow-hidden text-ellipsis whitespace-nowrap mb-0.5">{name}</div>
                                    <span className="text-[13px] font-extrabold text-[#0f172a]">₹{price.toFixed(0)}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => removeItem(item.vendorId, item.productId, item.variantId, item.packageId)}
                                    className="w-[30px] h-[30px] rounded-lg bg-[#fff5f5] border border-[#fecaca] flex items-center justify-center cursor-pointer shrink-0"
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
            className={`card shadow-sm border border-[#f1f5f9] bg-white rounded-2xl ${isMobile || isTablet ? "w-full static" : "w-[33%] sticky top-[0px]"
              } ${isMobile ? "p-4 " : "p-7"
              }`}
          >
            {/* Coupon Card Summary */}
            <div className="mb-6 bg-white rounded-md border border-[#e5e7eb] shadow-[0_8px_24px_rgba(15,23,42,0.06)] p-3">
              {/* Heading */}
              <div className="flex items-center gap-2 text-[17px] font-[600] text-[#1f2937] mb-2">
                <i className="fas fa-percentage text-[#321961] text-[18px]"></i>
                <span>Offers & Discounts</span>
              </div>

              {/* Coupon Card */}
              <div
                className={`group flex items-center gap-4 p-3 rounded-md cursor-pointer transition-all duration-300 border ${appliedCoupon
                  ? "bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] border-[#86efac] shadow-[0_8px_20px_rgba(34,197,94,0.12)]"
                  : "bg-gradient-to-r from-[#faf5ff] to-[#ffffff] border-[#d8b4fe] hover:border-[#321961] "
                  }`}
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
                {/* Icon */}
                <div
                  className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center text-white text-lg shadow-md ${appliedCoupon
                    ? "bg-gradient-to-br from-[#22c55e] to-[#15803d]"
                    : "bg-primary"
                    }`}
                >
                  <i className="fas fa-tags"></i>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div
                    className={`flex items-center justify-between font-semibold text-[13px] ${appliedCoupon ? "text-[#166534]" : "text-[#6d28d9]"
                      }`}
                  >
                    <span>
                      {appliedCoupon ? "Coupon Applied Successfully!" : "Apply Coupon"}
                    </span>

                    <i className="fas fa-chevron-right text-[11px] opacity-60 group-hover:translate-x-1 transition-transform duration-200"></i>
                  </div>

                  <div
                    className={`text-[11px] mt-1 ${appliedCoupon ? "text-[#15803d]" : "text-[#64748b]"
                      }`}
                  >
                    {appliedCoupon ? (
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <span className="inline-flex items-center gap-2 bg-[#ede9fe] text-[#6d28d9] px-3 py-1 rounded-full font-bold tracking-wide">
                          <i className="fas fa-ticket-alt text-[11px]" />
                          {appliedCoupon.code}
                        </span>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAppliedCoupon(null);
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1 rounded-full text-[11px] font-semibold transition-all duration-200"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <span>
                        View available coupons and save more on your order.
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Manual Coupon */}
              <div className="mt-2">
                <label className="block text-[13px] font-medium text-[#475569] mb-2">
                  Have a Coupon Code?
                </label>

                <div className="flex  mt-2 flex-row w-full">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponInputText}
                    onChange={(e) => setCouponInputText(e.target.value)}
                    className="flex-1 min-w-0 border border-slate-300 rounded-l-lg px-3 py-2 text-sm bg-[#f8fafc] outline-none transition-colors focus:border-[#321961]"
                  />

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleManualCouponApply();
                    }}
                    className="px-4 py-2 bg-primary hover:bg-[#7148c5] !text-white !text-sm !font-semibold !rounded-r-lg border-none transition-all duration-200 shrink-0"
                  >
                    Apply
                  </button>
                </div>

                {!appliedCoupon && (
                  <div className="mt-2 text-[12px] font-[500] text-[#94a3b8]">
                    Enter your coupon code to get instant discounts on your booking.
                  </div>
                )}
              </div>
            </div>


            {/* Sample Collection Schedule */}
            <div className="mb-7">
              <div
                className="text-[15.5px] font-semibold mb-3 text-[#1e293b] flex items-center gap-2"
              >
                <Calendar size={16} className="text-[#321961]" />
                Collection Schedule & Method
              </div>

              <div
                className="rounded-sm border border-[1.5px] border-[#f3e8ff] bg-[#fdfaff] p-[12px] shadow-[0_2px_8px_rgba(128,89,202,0.04)]"
              >
                {/* Collection Method Toggle */}
                {visitType === "both" ? (
                  <div className="flex bg-[#f1f5f9] p-1 rounded-[10px] mb-[18px]">
                    {/* Home Collection */}
                    <div
                      onClick={() => setCollectionMethod("home")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-sm cursor-pointer transition-all duration-200 text-[13px] font-semibold ${collectionMethod === "home"
                        ? "bg-white text-[#321961] shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                        : "bg-transparent text-[#64748b]"
                        }`}
                    >
                      <i className="fas fa-house-medical text-sm" />
                      <span>Home Collection</span>
                    </div>

                    {/* Lab Visit */}
                    <div
                      onClick={() => setCollectionMethod("lab")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-sm cursor-pointer transition-all duration-200 text-[13px] font-semibold ${collectionMethod === "lab"
                        ? "bg-white text-[#321961] shadow-[0_2px_6px_rgba(0,0,0,0.08)]"
                        : "bg-transparent text-[#64748b]"
                        }`}
                    >
                      <i className="fas fa-flask text-sm" />
                      <span>Lab Visit</span>
                    </div>
                  </div>
                ) : visitType === "home" ? (
                  <div className="mb-[12px]">
                    <div className="flex items-center gap-2 px-4 py-3 rounded-[10px] bg-[#fdfaff] text-[#321961] font-bold text-[13.5px] border-[1.5px] border-[#e9d5ff]">
                      <i className="fas fa-house-medical text-[15px]" />
                      <span>Home Collection Only</span>
                    </div>
                    <div className="text-xs text-[#7c3aed] bg-[#faf5ff] px-3 py-2 rounded-lg mt-2 border border-[#f3e8ff]">
                      <i className="fas fa-info-circle mr-1.5" />
                      Note: This diagnostic center only supports Home Sample Collection. A technician will visit your address.
                    </div>
                  </div>
                ) : (
                  <div className="mb-[12px]">
                    <div className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3.5 rounded-lg transition-all duration-200 text-[13.5px] font-bold border border-[#e2e8f0] bg-[#f8fafc] text-[#475569] cursor-default">
                      <i className="fas fa-flask text-[15px]" />
                      <span>Lab Visit Only</span>
                    </div>
                    <div className="text-xs text-[#475569] bg-[#f1f5f9] px-3 py-2 rounded-lg mt-2 border border-[#e2e8f0]">
                      <i className="fas fa-info-circle mr-1.5" />
                      Note: You must visit the diagnostic center for sample collection.
                    </div>
                  </div>
                )}


                {/* Divider */}
                <hr className="my-2 border-none border-t-[1.5px] border-dashed border-[#e9d5ff]" />

                {/* Appointment Slot */}
                <div>
                  <div className="flex justify-between items-center mb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} className="text-[#321961]" />
                      <label className="text-[11px] font-bold text-[#475569] m-0 tracking-[0.5px]">
                        APPOINTMENT SLOT
                      </label>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowSlotPicker(true)}
                      className="bg-primary border-none !text-white !rounded-sm px-3.5 py-[7px] !text-xs !font-bold cursor-pointer flex items-center gap-1.5 shadow-[0_2px_6px_rgba(128,89,202,0.35)] tracking-[0.3px] hover:-translate-y-px transition-all duration-200"
                    >
                      <Calendar size={12} />
                      {selectedDate && selectedTimeSlot ? "CHANGE SLOT" : "PICK SLOT"}
                    </button>
                  </div>

                  {selectedDate && selectedTimeSlot ? (
                    <div
                      className="bg-gradient-to-br from-[#f5f0ff] to-[#ede9ff] rounded-[10px] px-3.5 py-3 border border-[#c4b5fd] flex items-center gap-2.5"
                    >
                      <span className="w-9 h-9 rounded-[10px] bg-[#321961] flex items-center justify-center shrink-0">
                        <Calendar size={16} color="#fff" />
                      </span>
                      <div className="flex-1">
                        <div className="text-[11px] text-[#7c3aed] font-semibold mb-0.5">
                          Selected Slot
                        </div>
                        <div className="text-sm text-[#1e293b] font-bold">
                          {selectedSlotText || (
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
              </div>
            </div>

            {/* Bill details */}
            <div className="mb-[5px]">
              <div
                className="text-[15.5px] font-semibold mb-3 text-[#1e293b] flex items-center gap-2"
              >
                Booking Summary
              </div>
              <div
                className="rounded-sm bg-[#fdfaff] border border-[#f3e8ff] p-3 shadow-[0_2px_8px_rgba(128,89,202,0.02)]"
              >
                <div className="flex justify-between items-start gap-3 text-[13px] text-[#475569] mb-3.5">
                  <span className="font-semibold flex flex-row leading-tight">
                    Subtotal
                    <span className="block text-[11px] text-[#94a3b8] font-normal mt-0.5"> (Included of all taxes)</span>
                  </span>
                  <span className="font-semibold text-[#1e293b] shrink-0">₹{cartBilling?.subtotal?.toFixed(2)}</span>
                </div>

                <div className="flex justify-between items-center text-[13px] text-[#475569] mb-3.5">
                  <span className="font-medium">GST</span>
                  <span className="font-semibold text-[#1e293b]">₹{(cartBilling?.totalGst || 0).toFixed(2)}</span>
                </div>

                {appliedCoupon && (
                  <div className="flex justify-between items-center text-[13px] text-[#16a34a] mb-3.5">
                    <span className="font-semibold">Coupon Discount</span>
                    <span className="font-bold">- ₹{couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {/* SGST (14%) row intentionally kept disabled, matches original markup:
                <div className="flex justify-between items-center text-[13px] text-[#475569] mb-3.5">
                  <span className="font-medium">SGST (14%)</span>
                  <span className="font-semibold text-[#1e293b]">₹{SGstCalculate(subtotal).toFixed(2)}</span>
                </div> */}

                {homeVisitFee > 0 && (
                  <div className="flex justify-between items-center text-[13px] text-[#475569] mb-3.5 bg-[#fdf8ff] px-3 py-2 rounded-lg border border-dashed border-[#e9d5ff]">
                    <span className="font-semibold flex items-center gap-1.5">
                      <i className="fas fa-house-medical text-[#321961] text-[11px]" />
                      Home Visit Fee
                    </span>
                    <span className="font-bold text-[#321961] shrink-0">+ ₹{(serviceDetails?.homeVisitFee || 0).toFixed(2)}</span>
                  </div>
                )}
                {(walletUsed > 0 && selectedPayment === "online") && (
                  <div
                    className="flex justify-between items-center text-[13px] text-[#059669] mb-3.5"
                  >
                    <span className="font-medium">
                      Wallet Deduction
                    </span>
                    <span className="font-semibold text-[#059669]">
                      - ₹{walletUsed.toFixed(2)}
                    </span>
                  </div>
                )}
                <hr className="my-2 border-t-2 border-[#c4b5fd]" />

                <div className="flex justify-between items-center text-[15px] font-semibold text-[#321961]">
                  <span>Amount To Pay</span>
                  <span className="text-[#321961] text-[17.5px] leading-none">₹{amountToPay.toFixed(2)}</span>
                </div>

                <div
                  className="flex justify-between items-center text-[12.5px] text-[#1e293b] font-semibold mt-2.5"
                >
                  <span>Remaining Wallet Balance</span>
                  <span className="text-[#475569]">₹{(walletAmount - walletUsed).toFixed(2)}</span>
                </div>

              </div>


              {appliedCoupon && couponDiscount > 0 && (
                <div className="bg-[#f0fdf4] p-2.5 rounded-lg text-xs font-bold text-[#15803d] mt-3.5 text-center border border-[#bbf7d0] flex items-center justify-center gap-1.5">
                  <i className="fas fa-sparkles text-[#16a34a]" />
                  <span>YOU SAVED ₹{couponDiscount.toFixed(2)} ON THIS ORDER!</span>
                </div>
              )}

              <div className={`text-[15.5px] font-semibold text-[#1e293b] flex items-center gap-2 ${isMobile ? "mt-4 mb-2.5" : "mt-7 mb-3"
                }`}>
                Choose Payment Method
              </div>

              <div className={`flex gap-2.5 mb-4 w-full ${isMobile || isTablet ? "flex-col" : "flex-row"}`}>
                {/* Online Option */}
                <div
                  className={`flex-1 min-w-0 !border !rounded-md px-3.5 py-2 flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${selectedPayment === "online"
                    ? "!border-[#321961] bg-[#fdfaff] shadow-[0_4px_12px_rgba(128,89,202,0.08)]"
                    : "!border-[#e2e8f0] bg-white hover:!border-[#cbd5e1] hover:bg-[#fafbfc]"
                    }`}
                  onClick={() => setSelectedPayment("online")}
                  title="Online Payment"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 shrink-0 ${selectedPayment === "online" ? "bg-[#321961] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                    }`}>
                    <i className="fas fa-credit-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${selectedPayment === "online" ? "text-[#321961]" : "text-[#1e293b]"
                      }`}>
                      Online Payment
                    </div>
                    <div className="text-[10px] text-[#64748b] whitespace-nowrap overflow-hidden text-ellipsis">UPI, Cards, NetBanking</div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border bg-white transition-all duration-200 shrink-0 ${selectedPayment === "online" ? "!border-4 !border-[#321961]" : "!border-2 !border-[#cbd5e1]"
                    }`} />
                </div>

                {/* COD Option */}
                <div
                  className={`flex-1 min-w-0 !border !rounded-md px-3.5 py-2 flex items-center gap-2.5 cursor-pointer transition-all duration-200 ${selectedPayment === "cod"
                    ? "!border-[#321961] bg-[#fdfaff] shadow-[0_4px_12px_rgba(128,89,202,0.08)]"
                    : "!border-[#e2e8f0] bg-white hover:!border-[#cbd5e1] hover:bg-[#fafbfc]"
                    }`}
                  onClick={() => {
                    setSelectedPayment("cod");
                    setAppliedCoupon(null);
                  }}
                  title="Pay at Sample Collection"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-200 shrink-0 ${selectedPayment === "cod" ? "bg-[#321961] text-white" : "bg-[#f1f5f9] text-[#64748b]"
                    }`}>
                    <i className="fas fa-money-bill-wave" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-bold mb-0.5 whitespace-nowrap overflow-hidden text-ellipsis ${selectedPayment === "cod" ? "text-[#321961]" : "text-[#1e293b]"
                      }`}>
                      Pay at Sample Collection
                    </div>
                    <div className="text-[10px] text-[#64748b] whitespace-nowrap overflow-hidden text-ellipsis">Pay at sample collection</div>
                  </div>
                  <div className={`w-3.5 h-3.5 rounded-full border bg-white transition-all duration-200 shrink-0 ${selectedPayment === "cod" ? "!border-4 !border-[#321961]" : "!border-2 !border-[#cbd5e1]"
                    }`} />
                </div>
              </div>

              <hr className="my-1 border-[#f1f5f9]" />

              {/* Checkout Actions */}
              <div className="flex gap-3 bg-[#fdfaff] p-4 rounded-2xl items-center border border-[#f3e8ff]">
                <div className="flex-1 min-w-0 flex flex-col items-start justify-center leading-tight">
                  <div className="text-xs font-semibold text-gray-500">Total Payable</div>
                  <div className="text-xl font-semibold text-[#1e1b4b] mt-0.5">₹{amountToPay.toFixed(2)}</div>
                </div>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={`flex-1 min-w-0 flex items-center justify-center py-2.5 px-3 !text-white border-none !rounded-[20px] !text-[14.5px] !font-semibold transition-all duration-200 ${isSubmitting
                    ? "bg-slate-350 cursor-not-allowed"
                    : "bg-primary cursor-pointer shadow-[0_4px_14px_rgba(128,89,202,0.25)] hover:-translate-y-px"
                    }`}
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
        className="z-[9999999999]"
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

      <RecentlyViewedProducts
        products={relevantProducts}
        onProductClick={handleProductClick}
        onRentalBooking={handleRentalBookingProcess}
        onBooking={handleBooking}
      />

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
      {showOffersModal && (() => {
        const getCouponsList = (type) => {
          if (couponDetails) {
            if (Array.isArray(couponDetails)) {
              return couponDetails.filter((c) => c.createdType === type);
            }
            if (type === "admin" && Array.isArray(couponDetails.adminCoupons)) {
              return couponDetails.adminCoupons;
            }
            if (type === "vendor" && Array.isArray(couponDetails.vendorCoupons)) {
              return couponDetails.vendorCoupons;
            }
          }
          return [];
        };

        const cartVendorIds = Array.isArray(cartItems)
          ? cartItems.map((item) => String(item.vendorId))
          : [];

        const mapCoupons = (coupons, isVendorCoupon) => {
          return coupons.map((coupon) => {
            const isApplied = appliedCoupon?._id === coupon._id;
            let applicableAmount = 0;
            const resolvedHomeVisitFee = parseFloat(
              serviceDetails?.homeVisitFee ||
              serviceDetails?.visit?.homeVisitFee ||
              serviceDetails?.services?.visit?.homeVisitFee ||
              serviceFeeDetails?.services?.visit?.homeVisitFee ||
              serviceFeeDetails?.labtests?.homeVisitFee ||
              0
            );

            let totalAmountForCheck = parseFloat(cartBilling?.finalAmount || 0);
            if (visitType?.toLowerCase() === "both" && (collectionMethod === "lab" || collectionMethod === "center")) {
              totalAmountForCheck = totalAmountForCheck - resolvedHomeVisitFee;
            }

            if (isVendorCoupon) {
              const vendorIdStr = String(
                coupon.createdBy || coupon.businessDetails?._id || "",
              );
              applicableAmount = cartItems
                .filter((item) => String(item.vendorId) === vendorIdStr)
                .reduce((sum, item) => sum + (getEffectivePrice(item) * item.quantity), 0);
            } else {
              applicableAmount = totalAmountForCheck;
            }

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
            } else if (applicableAmount < coupon.minimumPurchase) {
              isEligible = false;
              const diff = (coupon.minimumPurchase - applicableAmount).toFixed(2);
              criteriaText = `Add ₹${diff} more to apply`;
            } else if (coupon?.canUseCoupon === false) {
              isEligible = false;
            } else if (coupon?.remainingUses === 0) {
              isEligible = false;
            }

            const savingsPreview = isEligible ? (coupon.discountType === "fixed" ? coupon.discount : (applicableAmount * coupon.discount) / 100) : 0;

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
          const aMatches = cartVendorIds.includes(String(a.createdBy)) || cartVendorIds.includes(String(a.businessDetails?._id));
          const bMatches = cartVendorIds.includes(String(b.createdBy)) || cartVendorIds.includes(String(b.businessDetails?._id));

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
      })()}
    </div>
  );
};