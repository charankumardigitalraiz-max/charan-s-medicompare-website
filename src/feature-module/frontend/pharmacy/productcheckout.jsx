import { useState, useEffect, useRef } from "react";
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
import { Trash2, ChevronDown } from "react-feather";
import toast from "react-hot-toast";
import LocationOffcanvas from "../../../components/home/LocationOffCanvas.jsx";
import { useCartContext } from "../../../context/CartContext";
import { useLocation } from "../../../context/LocationContext";
import { navigateToLogin } from "../../../utils/redirectUtils";
import { openRazorpayCheckout } from "../../../utils/razorpayUtils";
import "./bookingprocess.css";
import { useResponsive } from "../../../hooks";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import {
  getReferredDoctorSelectOptions,
  handleReferredDoctorInputChange,
  handleReferredDoctorSelectChange,
  referredDoctorSelectComponents,
} from "./referredDoctorSelectUtils";
import { fetchDoctorsList } from "../../../services/doctorService";
import { fetchFamilyMembersList } from "../../../services/familyMemberService";

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

export const Cart = () => {
  const [loading, setLoading] = useState(true);
  const {
    cartItems,
    cartBilling,
    relevantProducts,
    couponDetails,
    walletAmount,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    refreshCart,
  } = useCartContext();

  console.log("cartitems", cartItems)

  const [showLocationOffcanvas, setShowLocationOffcanvas] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("online");
  const [useWallet, setUseWallet] = useState(true);
  const [offcanvasPosition, setOffcanvasPosition] = useState("right");
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [couponList, setCouponList] = useState([]);
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = localStorage.getItem("checkoutAppliedCoupon");
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
    isLocationUpdating,
    updateLocation,
    latitude,
    longitude,
  } = useLocation();
  const { isXs: xsMobile, isMobile, isTabletOrBelow: isTablet, isXs: ExtraSmall } = useResponsive();
  const [personType, setPersonType] = useState("self");
  const [familyMembers, setFamilyMembers] = useState([]);
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




  // console.log("cartitems", cartItems)



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
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const doctorSearchRequestRef = useRef(0);




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

  useEffect(() => {
    //   const fetchCoupons = async () => {
    //     try {
    //       const response = await axiosCommonInstance.get("coupon/list");
    //       setCouponList(response.data.data.couponlist);
    //     } catch (error) {
    //       toast.error(error);
    //     }
    //   };

    const fetchFamilyMembers = async () => {
      try {
        const token = localStorage.getItem("medicomparestoken");
        if (!token) return;
        const response = await fetchFamilyMembersList();
        if (response.data.success) {
          setFamilyMembers(response.data.data);
        }
      } catch (error) {
        toast.error("Error fetching family members:", error);
      }
    };

    //   fetchCoupons();
    fetchFamilyMembers();
    refreshCart();
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

  const navigate = useNavigate();

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
            const savedLocation = JSON.parse(savedLocationStr);
            if (savedLocation?.addressId) {
              matchedAddress = addresses.find(
                (addr) => addr._id === savedLocation.addressId,
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

  const formatReturnablePeriod = (returnDetails) => {
    if (!returnDetails) return "";

    const normalized = returnDetails.toString().trim().toLowerCase();
    if (normalized === "non-returnable" || normalized === "non returnable") {
      return "Non Returnable";
    }

    const days = parseInt(returnDetails);
    if (isNaN(days)) return "";

    return `Returnable in ${days} days`;
  };

  const handleLocationClick = (position = "right") => {
    setOffcanvasPosition(position);
    setShowLocationOffcanvas(true);
  };

  const closeLocationOffcanvas = () => setShowLocationOffcanvas(false);

  const getItemMaxQuantity = (item) => {
    const limits = [];
    const stock = parseInt(item?.productDetails?.stock, 10);
    const restricted = parseInt(item?.productDetails?.restrictedQuantity, 10);
    if (Number.isFinite(stock) && stock > 0) limits.push(stock);
    if (Number.isFinite(restricted) && restricted > 0) limits.push(restricted);
    return limits.length > 0 ? Math.min(...limits) : 999;
  };

  const incrementQuantity = (cartKey) => {
    const item = cartItems.find((i) => i.cartKey === cartKey);
    console.log("item", item)
    if (!item) return;
    // const maxQty = getItemMaxQuantity(item);

    // if (item.quantity >= maxQty) {
    //   toast.error(`Only ${maxQty} item${maxQty === 1 ? "" : "s"} available in stock`);
    //   return;
    // }
    const pkgId = item.packageId || (item.type === "package" ? item._id : null);
    incrementItem(
      item.vendorId,
      item.productId,
      item.variantId,
      pkgId,
    );
  };

  const decrementQuantity = (cartKey) => {
    const item = cartItems.find((i) => i.cartKey === cartKey);
    if (!item) return;
    const pkgId = item.packageId || (item.type === "package" ? item._id : null);
    decrementItem(item.vendorId, item.productId, item.variantId, pkgId);
  };

  const handleRemove = (cartKey) => {
    const item = cartItems.find((i) => i.cartKey === cartKey);
    if (!item) return;
    const pkgId = item.packageId || (item.type === "package" ? item._id : null);
    removeItem(item.vendorId, item.productId, item.variantId, pkgId);
  };

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
      (categoryData?.name
        ? categoryData.name.toLowerCase().replace(/\s+/g, "-")
        : null);

    const categories =
      subcategoryData?.slug ||
      (subcategoryData?.name
        ? subcategoryData.name.toLowerCase().replace(/\s+/g, "-")
        : null);

    const productId = tablet?.slug || product?.slug || item?.slug;

    navigate(
      `/${encodeURIComponent(service)}/${encodeURIComponent(categories)}/${encodeURIComponent(productId)}`,
      {
        state: {
          selectedVariantId: item.variantId || null,
        },
      },
    );
  };

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

  const getAddressTypeLabel = () => {
    if (selectedAddress?.addressType) {
      const addressType = selectedAddress.addressType;
      return (
        addressType.charAt(0).toUpperCase() + addressType.slice(1).toLowerCase()
      );
    }
    return "Delivery Address";
  };

  const handleCouponApply = async (coupon, isManualInput = false) => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login first");
        return;
      }

      if (selectedPayment === "cod") {
        toast.error("Coupons are not applicable for Cash on Delivery");
        return;
      }

      const payload = {
        couponId: isManualInput ? null : (coupon._id || null),
        couponCode: coupon.code || null,
        code: coupon.code || null,
        totalAmount: cartBilling?.finalAmount,
        bookingTypes: "cart",
        servicefixedTypes: cartItems?.[0]?.productDetails?.tabletDetails?.subcategoryDetails?.categoryDetails?.fixedType,
        // pincode: currentLocation?.pincode || selectedAddress?.location?.pincode || selectedAddress?.pincode || ""
      };

      const response = await axiosCommonInstance.post(`coupon/apply?pincode=${currentLocation?.pincode || selectedAddress?.location?.pincode || selectedAddress?.pincode || ""}`, payload, {
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
      navigateToLogin(navigate, "/cart");
      return;
    }

    if (selectedPayment === "cod") {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const token = localStorage.getItem("medicomparestoken");
    if (!selectedPayment) {
      toast.error("Please select a payment method");
      return;
    }
    if (!token) {
      toast.error("Please login first");
      navigateToLogin(navigate, "/cart");
      // navigate("/")
      return;
    }
    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (personType === "forWhom" && !selectedFamilyMember) {
      toast.error("Please select a family member");
      return;
    }
    if (personType === "forWhom" && !selectedDoctor) {
      toast.error("Please select a doctor");
      return;
    }
    if (personType === "self" && !selectedDoctor) {
      toast.error("Please select a Referred Doctor");
      return;
    }
    setIsSubmitting(true);
    const orderSubtotal = cartItems.reduce((acc, item) => {
      const effectivePrice = getEffectivePrice(item);
      return acc + effectivePrice * (parseInt(item.quantity) || 1);
    }, 0);

    const orderTax = +(orderSubtotal * 0.18).toFixed(2);

    const orderCouponDiscount = calculateCouponDiscount(
      appliedCoupon,
      baseFinalAmount,
    );

    const orderCGST = +CGstCalculate(orderSubtotal).toFixed(2);
    const orderSGST = +SGstCalculate(orderSubtotal).toFixed(2);

    const itemsWithServiceType = cartItems.map((item) => ({
      ...item,
      serviceType:
        item?.productDetails?.tabletDetails?.subcategoryDetails?.categoryDetails
          ?.fixedType || null,
    }));

    const payload = {
      items: itemsWithServiceType,
      subtotal: orderSubtotal,
      shipping: 0,
      discount: orderCouponDiscount,
      tax: orderTax,
      // cgst: orderCGST,
      // sgst: orderSGST,
      // total: orderPayableTotal,
      total: withCouponAndWithoutWallet,
      shippingAddress: selectedAddress._id,
      billingAddress: selectedAddress._id,
      paymentmethod: selectedPayment,
      couponId: selectedPayment === "cod" ? null : appliedCoupon?._id || null,
      // amountToPay: amountToPay,
      billingSummary: {
        ...cartBilling,
        walletAmount: selectedPayment === "cod" ? null : walletUsed > 0 ? walletUsed : null,
        couponAmount: selectedPayment === "cod" ? null : orderCouponDiscount,
        couponId: selectedPayment === "cod" ? null : appliedCoupon?._id || null,
        finalAmount: withoutCouponAndWallet,
        withoutCouponAndWithoutWallet,
        withCouponAndWithoutWallet,
        withoutCouponAndWithWallet,
        withCouponAndWithWallet,
        walletUsedWithoutCoupon,
        walletUsedWithCoupon,
        paidAmount: amountToPay
      },
      bookingTypes: "cart",
      couponAmount: orderCouponDiscount,
      walletamount: selectedPayment === "cod" ? null : walletUsed > 0 ? walletUsed : null,
      walletAmount: selectedPayment === "cod" ? null : walletUsed > 0 ? walletUsed : null,
      iswallet: selectedPayment === "cod" ? false : walletUsed > 0 ? true : false,
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
          ? [selectedFamilyMember.value]
          : [],
      familynames:
        personType === "forWhom" && selectedFamilyMember
          ? [selectedFamilyMember.label]
          : [],
      persontype: personType,
      pincode:
        currentLocation?.pincode || selectedAddress?.location?.pincode || "",
    };

    // console.Console(payload)

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
        localStorage.removeItem("checkoutAppliedCoupon");
        sessionStorage.setItem("paymentMethod", "wallet");
        navigate("/payment-success");
        return;
      }

      if (selectedPayment === "cod") {
        clearCart();
        setAppliedCoupon(null);
        localStorage.removeItem("checkoutAppliedCoupon");
        sessionStorage.setItem("paymentMethod", "cod");
        navigate("/payment-success");
        return;
      }

      const razorpayData = response.data.data;

      if (!window.Razorpay) {
        toast.error("Razorpay not loaded");
        return;
      }

      openRazorpayCheckout({
        razorpayData,
        description: "Order Payment",
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
              bookingTypes: "cart",
            },
            {
              headers: { Authorization: `Bearer ${token}` },
            },
          );
          clearCart();
          setAppliedCoupon(null);
          localStorage.removeItem("checkoutAppliedCoupon");
          sessionStorage.setItem("paymentMethod", "online");
          navigate("/payment-success");
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

  const subtotal = cartItems.reduce((acc, item) => {
    const effectivePrice = getEffectivePrice(item);
    const quantity = parseInt(item.quantity) || 1;
    return acc + effectivePrice * quantity;
  }, 0);

  const tax = parseFloat((subtotal * 0.18).toFixed(2));
  // const total = parseFloat((subtotal + tax).toFixed(2));
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

  // Always derive from current cart — serverDiscount/serverFinalAmount are stale after item changes
  const baseFinalAmount = cartBilling?.finalAmount || 0;
  const deliveryCharges = cartBilling?.deliveryCharges || 0;

  const couponDiscount = calculateCouponDiscount(appliedCoupon, baseFinalAmount);
  const couponAmountApplied = appliedCoupon
    ? +Math.max(0, baseFinalAmount - couponDiscount).toFixed(2)
    : baseFinalAmount;

  // 1. Without Coupon & Without Wallet
  const withoutCouponAndWithoutWallet = +(baseFinalAmount + deliveryCharges).toFixed(2);

  // 2. With Coupon & Without Wallet
  const withCouponAndWithoutWallet = +(couponAmountApplied + deliveryCharges).toFixed(2);

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
  const withoutCouponAndWallet = baseFinalAmount;
  const walletUsed = walletUsedWithCoupon;
  const amountToPay = selectedPayment === "cod" ? withCouponAndWithoutWallet : withCouponAndWithWallet;

  console.log("Clarified Billing breakdown:", {
    withoutCouponAndWithoutWallet,
    withCouponAndWithoutWallet,
    withoutCouponAndWithWallet,
    withCouponAndWithWallet,
    walletUsedWithoutCoupon,
    walletUsedWithCoupon,
    couponDiscount,
    deliveryCharges,
    walletAmount,
    useWallet
  });

  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem(
          "checkoutAppliedCoupon",
          JSON.stringify(appliedCoupon),
        );
      } else {
        localStorage.removeItem("checkoutAppliedCoupon");
      }
    } catch (e) {
      // no-op
    }
  }, [appliedCoupon]);

  useEffect(() => {
    if (selectedPayment === "cod" && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [selectedPayment]);

  // Drop coupon if cart no longer meets minimum purchase after item changes
  useEffect(() => {
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
    const initializeData = async () => {
      setLoading(true);
      try {
        await loadSavedAddresses();
      } catch (error) {
        // Error initializing data
      } finally {
        setLoading(false);
      }
    };

    initializeData();
  }, []);

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
    const handleNewAddressSaved = (event) => {
      setTimeout(() => {
        loadSavedAddresses().then(() => {
          const savedLocationStr =
            localStorage.getItem("selectedLocationBooking") ||
            localStorage.getItem("selectedLocation");
          if (savedLocationStr) {
            try {
              const savedLocation = JSON.parse(savedLocationStr);
              if (savedLocation?.addressId) {
                const matched = savedAddresses.find(
                  (a) => a._id === savedLocation.addressId,
                );
                if (matched) {
                  setSelectedAddress(matched);
                }
              }
            } catch (e) {
              // Error parsing savedLocation
            }
          }
        });
      }, 800);
    };

    window.addEventListener("addressSaved", handleNewAddressSaved);

    return () => {
      window.removeEventListener("addressSaved", handleNewAddressSaved);
    };
  }, [savedAddresses]);

  useEffect(() => {
    const handleAddressUpdate = (event) => {
      setTimeout(() => {
        loadSavedAddresses();
      }, 300);
    };

    window.addEventListener("addressUpdated", handleAddressUpdate);
    window.addEventListener("addressSaved", handleAddressUpdate);
    window.addEventListener("addressDeleted", handleAddressUpdate);

    return () => {
      window.removeEventListener("addressUpdated", handleAddressUpdate);
      window.removeEventListener("addressSaved", handleAddressUpdate);
      window.removeEventListener("addressDeleted", handleAddressUpdate);
    };
  }, []);

  const thStyle = {
    fontSize: "14px",
    fontWeight: 600,
    color: "#111827",
  };

  const subText = {
    fontSize: "12px",
    color: "#6b7280",
    marginTop: "2px",
  };

  if (loading) {
    return <PageLoader />;
  }

  const resolveImage = (item) => {
    const getFirst = (val) => {
      if (Array.isArray(val)) return val?.[0];
      if (typeof val === "string" && val.trim() !== "") return val;
      return null;
    };

    const img =
      getFirst(item?.varientDetails?.image) ||
      getFirst(item?.varientDetails?.files) ||
      getFirst(item?.variantDetails?.files) ||
      getFirst(item?.variantDetails?.image) ||
      getFirst(item?.files) ||
      getFirst(item?.imageUrl) ||
      getFirst(item?.file) ||
      getFirst(item?.variant?.files) ||
      getFirst(item?.variant?.file) ||
      getFirst(item?.productDetails?.variant);

    if (!img) return "/assets/default.png";

    return getImageUrl(img);
  };

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  return (
    <div className="main-wrapper">
      <Home2Header />
      <CategoryProvider />

      <div
        style={{
          display: "flex",
          flexDirection: isMobile || isTablet ? "column" : "row",
          gap: "24px",
          paddingTop: xsMobile ? "200px" : isMobile ? "110px" : "80px",
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
              cartItems.length === 0
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
          {cartItems.length > 0 && (
            <div className="row">
              <div className={isLoggedIn ? "col-md-6 col-12" : "col-12"}>
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      borderRadius: "16px",
                      overflow: "hidden",
                      border: "1px solid #e9ecef",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                      background: "#ffffff"
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
                            const token =
                              localStorage.getItem("medicomparestoken");
                            if (!token) {
                              toast.error("Please login to change address");
                              navigateToLogin(navigate, "/cart");
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
                            <div style={{ color: "#64748b", marginTop: "4px", fontSize: "12.5px" }}>
                              {selectedAddress.location.address}
                            </div>
                          )}
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
                        <span>
                          {isLocationUpdating
                            ? "Detecting your location..."
                            : "No delivery address selected yet"}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-md-6 col-12">
                {isLoggedIn && (
                  <div
                    style={{
                      borderRadius: "16px",
                      backgroundColor: "#fff",
                      border: "1px solid #e9ecef",
                      padding: "20px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                      marginBottom: "24px"
                    }}
                  >
                    <div className="row g-3">
                      <div className="col-12 ">
                        <div className="choice-cards-container" style={{ display: "flex", gap: "10px" }}>
                          <div className="choice-card-wrapper" style={{ flex: 1 }}>
                            <label className={`choice-card ${personType === "self" ? "selected" : ""}`} style={{ width: "100%", margin: 0 }}>
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
                              />
                              <i className="fas fa-user choice-card-icon"></i>
                              <span className="choice-card-text">Self</span>
                            </label>
                          </div>

                          <div className="choice-card-wrapper" style={{ flex: 1 }}>
                            <label className={`choice-card ${personType === "forWhom" ? "selected" : ""}`} style={{ width: "100%", margin: 0 }}>
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
                              />
                              <i className="fas fa-users choice-card-icon"></i>
                              <span className="choice-card-text">For Whom</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      {personType === "self" && (
                        <div className="col-12">
                          <label
                            className="form-label"
                            style={{ color: "#333", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}
                          >
                            Select Referred Doctor{" "}
                            <span style={{ color: "red" }}>*</span>
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
                          <div className="col-md-6 col-12">
                            <label
                              className="form-label"
                              style={{ color: "#333", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}
                            >
                              Select Family Member{" "}
                              <span style={{ color: "red" }}>*</span>
                            </label>
                            <Select
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
                          <div className="col-md-6 col-12">
                            <label
                              className="form-label"
                              style={{ color: "#333", fontSize: "14px", fontWeight: "500", marginBottom: "6px" }}
                            >
                              Select Referred Doctor{" "}
                              <span style={{ color: "red" }}>*</span>
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
                )}
              </div>
            </div>
          )}
          {/* Cart Items Table */}
          <div
            style={isMobile ? {
              background: "transparent",
              borderRadius: "0",
              boxShadow: "none",
              padding: "0",
              overflowX: "visible",
            } : {
              background: "#fff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.02)",
              padding: "24px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{ minWidth: cartItems.length === 0 || isMobile ? "100%" : "400px" }}
            >
              {cartItems.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="fas fa-shopping-cart text-muted mb-3"
                    style={{ fontSize: "48px" }}
                  ></i>
                  <h5 className="text-muted">
                    Cart products are not available in this location
                  </h5>
                  <p className="text-muted mb-3">Change pincode</p>
                  <Link
                    to="/"
                    className="btn btn-primary"
                    style={{ width: "150px" }}
                  >
                    Go Back
                  </Link>
                </div>
              ) : isMobile ? (
                // <>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  {cartItems.map((item, index) => {
                    const itemProductDetails = item.productDetails;
                    // const maxQuantity = getItemMaxQuantity(item);
                    const billingSummary = item?.billingSummary;
                    const prescriptionImage = item?.prescriptionImage;
                    // console.log(billingSummary)
                    // console.log(item)
                    return (
                      <div
                        key={
                          item.uniqueKey ||
                          item._id ||
                          item.cartKey ||
                          `cart-item-mobile-${index}`
                        }
                        style={{
                          background: "#fff",
                          border: "1px solid #f1f5f9",
                          borderRadius: "14px",
                          padding: "16px",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.02)",
                          position: "relative"
                        }}
                      >
                        {/* Top Section: Image, Name, and Trash */}
                        <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          <img
                            src={resolveImage(item)}
                            alt={item.name || "Product"}
                            style={{
                              width: "68px",
                              height: "68px",
                              borderRadius: "10px",
                              objectFit: "cover",
                              border: "1px solid #f3effa",
                              flexShrink: 0
                            }}
                            onClick={() => handleProductClick(item)}
                          />
                          <div style={{ flex: 1, minWidth: 0, paddingRight: "24px" }}>
                            <div
                              onClick={() => handleProductClick(item)}
                              style={{
                                fontSize: "14px",
                                fontWeight: 600,
                                color: "#1e293b",
                                lineHeight: "1.3",
                                marginBottom: "4px",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                textTransform: "capitalize"
                              }}
                            >
                              {item.name || "Product Name"}
                            </div>

                            {item?.variantName && (
                              <div
                                onClick={() => handleProductClick(item)}
                                style={{
                                  display: "inline-block",
                                  marginBottom: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                <span
                                  style={{
                                    background: "#f3e8ff",
                                    color: "#7e22ce",
                                    fontSize: "10.5px",
                                    fontWeight: "600",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    border: "1px solid #e9d5ff",
                                    display: "inline-block"
                                  }}
                                >
                                  Variant: {item.variantName}
                                </span>
                              </div>
                            )}

                            {/* Vendor Image and Name */}
                            <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "6px" }}>
                              {item.vendorImage ? (
                                <img
                                  src={getImageUrl(item.vendorImage)}
                                  alt={item.vendorName}
                                  style={{
                                    width: "14px",
                                    height: "14px",
                                    borderRadius: "3px",
                                    objectFit: "cover"
                                  }}
                                />
                              ) : (
                                <i className="fas fa-store" style={{ fontSize: "8px", color: "#8059ca" }} />
                              )}
                              <span style={{ fontSize: "10.5px", color: "#8059ca", fontWeight: "600", textTransform: "capitalize" }}>
                                {item.vendorName}
                              </span>
                            </div>

                            {/* Prices */}
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>

                              <span style={{ fontSize: "14px", fontWeight: "750", color: "#0f172a" }}>
                                ₹{billingSummary?.unitPrice.toFixed(0)}
                              </span>
                              {billingSummary?.isDiscount && (
                                <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "11px" }}>
                                  ₹{billingSummary?.basePrice}
                                </span>
                              )}
                              {billingSummary?.isDiscount && (
                                <span
                                  style={{
                                    background: "#ecfdf5",
                                    color: "#059669",
                                    fontSize: "9.5px",
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                    fontWeight: "700",
                                    border: "1px solid #d1fae5"
                                  }}
                                >
                                  {`${Math.round(((billingSummary.basePrice - billingSummary.unitPrice) / billingSummary.basePrice) * 100)}% OFF`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Trash button at top right */}
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              width: "28px",
                              height: "28px",
                              borderRadius: "6px",
                              background: "#fef2f2",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              border: "1px solid #fee2e2"
                            }}
                            onClick={() => handleRemove(item.cartKey)}
                          >
                            <Trash2 size={13} color="#ef4444" />
                          </div>
                        </div>

                        {/* Returnable Policy row */}
                        {formatReturnablePeriod(item.returnDetails) && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              fontSize: "10px",
                              color: "#64748b",
                              marginTop: "8px",
                              paddingTop: "8px",
                              borderTop: "1px dashed #f1f5f9"
                            }}
                          >
                            <i className="fas fa-undo-alt" style={{ fontSize: "8px", color: "#8059ca" }} />
                            <span>{formatReturnablePeriod(item.returnDetails)}</span>
                          </div>
                        )}

                        {/* Prescription Uploaded Preview */}
                        {prescriptionImage && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              background: "#f0fdf4",
                              border: "1px solid #bbf7d0",
                              borderRadius: "8px",
                              padding: "6px 10px",
                              marginTop: "8px"
                            }}
                          >
                            <img
                              src={getImageUrl(prescriptionImage)}
                              alt="Prescription"
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "4px",
                                objectFit: "cover"
                              }}
                            />
                            <div style={{ display: "flex", flexDirection: "column" }}>
                              <span style={{ fontSize: "10px", color: "#16a34a", fontWeight: "600" }}>
                                Prescription Uploaded
                              </span>
                              <a
                                href={getImageUrl(prescriptionImage)}
                                target="_blank"
                                rel="noreferrer"
                                style={{ fontSize: "9px", color: "#15803d", textDecoration: "underline" }}
                              >
                                View Prescription
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Bottom row: Qty Controls and Subtotal */}
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginTop: "12px",
                            paddingTop: "12px",
                            borderTop: "1px solid #f1f5f9"
                          }}
                        >
                          {/* Qty Controls */}
                          <div
                            style={{
                              display: "inline-flex",
                              border: "1.5px solid #e9d5ff",
                              borderRadius: "6px",
                              backgroundColor: "#fff",
                              overflow: "hidden"
                            }}
                          >
                            <button
                              className="btn btn-sm"
                              onClick={() => decrementQuantity(item.cartKey)}
                              style={{
                                width: "26px",
                                height: "26px",
                                background: "transparent",
                                border: "none",
                                color: "#8059ca",
                                fontSize: "10px",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <i className="fas fa-minus" style={{ fontSize: "7px" }} />
                            </button>
                            <span
                              style={{
                                minWidth: "24px",
                                color: "#1e1b4b",
                                fontWeight: "700",
                                fontSize: "12px",
                                textAlign: "center",
                                lineHeight: "26px"
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              className="btn btn-sm"
                              onClick={() => incrementQuantity(item.cartKey)}
                              style={{
                                width: "26px",
                                height: "26px",
                                background: "transparent",
                                border: "none",
                                color: "#8059ca",
                                fontSize: "10px",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              <i className="fas fa-plus" style={{ fontSize: "7px" }} />
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "11px", color: "#64748b" }}>Subtotal</div>
                            <div style={{ fontSize: "14px", fontWeight: "750", color: "#0f172a" }}>
                              ₹{(billingSummary?.baseAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {/* Header Row */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "12px",
                      borderBottom: "1px solid #e2e8f0",
                      marginBottom: "8px"
                    }}
                  >
                    <div style={{ flex: 1, fontWeight: "600", color: "#475569", fontSize: "13.5px" }}>
                      Medicines ({cartItems.length})
                    </div>
                    <div style={{ width: "120px", textAlign: "center", fontWeight: "600", color: "#475569", fontSize: "13.5px" }}>
                      Quantity
                    </div>
                    <div style={{ width: "150px", textAlign: "right", fontWeight: "600", color: "#475569", fontSize: "13.5px" }}>
                      Sub-Total
                    </div>
                  </div>

                  {cartItems.map((item, index) => {
                    const itemProductDetails = item.productDetails;
                    const maxQuantity = getItemMaxQuantity(item);
                    const atMaxStock = item?.quantity >= maxQuantity;
                    const itemPrice = parseFloat(item.price) || 0;
                    const prescriptionImage = item?.prescriptionImage
                    const billingSummary = item?.billingSummary;


                    return (
                      <div
                        key={
                          item.uniqueKey ||
                          item._id ||
                          item.cartKey ||
                          `cart-item-${index}`
                        }
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "16px 0",
                          borderBottom: index === cartItems.length - 1 ? "none" : "1px solid #f1f5f9",
                        }}
                      >
                        {/* Medicine Details Info */}
                        <div
                          style={{
                            display: "flex",
                            gap: "16px",
                            alignItems: "center",
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            onClick={() => handleProductClick(item)}
                            style={{ cursor: "pointer", flexShrink: 0 }}
                          >
                            <img
                              src={resolveImage(item)}
                              alt={item.name || "Product"}
                              style={{
                                width: 70,
                                height: 70,
                                borderRadius: "12px",
                                objectFit: "cover",
                                boxShadow: "0 4px 12px rgba(128, 89, 202, 0.06)",
                                border: "1px solid #f3effa",
                                transition: "transform 0.2s ease"
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = "scale(1.03)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                              }}
                            />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              onClick={() => handleProductClick(item)}
                              style={{
                                fontSize: "14.5px",
                                fontWeight: 600,
                                color: "#1e293b",
                                cursor: "pointer",
                                lineHeight: "1.3",
                                marginBottom: "4px",
                                textOverflow: "ellipsis",
                                overflow: "hidden",
                                whiteSpace: "nowrap",
                                textTransform: "capitalize"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = "#8059ca"}
                              onMouseLeave={(e) => e.currentTarget.style.color = "#1e293b"}
                            >
                              {item.name || "Product Name"}
                            </div>
                            {item?.variantName && (
                              <div
                                onClick={() => handleProductClick(item)}
                                style={{
                                  display: "inline-block",
                                  marginBottom: "4px",
                                  cursor: "pointer"
                                }}
                              >
                                <span
                                  style={{
                                    background: "#f3e8ff",
                                    color: "#7e22ce",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    border: "1px solid #e9d5ff",
                                    display: "inline-block"
                                  }}
                                >
                                  Variant: {item.variantName}
                                </span>
                              </div>
                            )}

                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              fontSize: "11px",
                              color: "#64748b",
                              marginBottom: "5px"
                            }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                {item.vendorImage ? (
                                  <img
                                    src={getImageUrl(item.vendorImage)}
                                    alt={item.vendorName}
                                    style={{
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "4px",
                                      objectFit: "cover",
                                      border: "1px solid #e9d5ff"
                                    }}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <i className="fas fa-store" style={{ fontSize: "9px", color: "#8059ca" }} />
                                )}
                                <span style={{ color: "#8059ca", fontWeight: "600", textTransform: "capitalize" }}>{item.vendorName}</span>
                              </div>
                              {formatReturnablePeriod(item.returnDetails) && (
                                <>
                                  <span style={{ color: "#cbd5e1" }}>•</span>
                                  <span style={{ display: "inline-flex", alignItems: "center", gap: "3px" }}>
                                    <i className="fas fa-undo-alt" style={{ fontSize: "9px" }} />
                                    {formatReturnablePeriod(item.returnDetails)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Prescription Uploaded Preview (Desktop) */}
                            {prescriptionImage && (
                              <div
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  background: "#f0fdf4",
                                  border: "1px solid #bbf7d0",
                                  borderRadius: "6px",
                                  padding: "4px 8px",
                                  marginBottom: "6px"
                                }}
                              >
                                <img
                                  src={getImageUrl(prescriptionImage)}
                                  alt="Prescription"
                                  style={{
                                    width: "24px",
                                    height: "24px",
                                    borderRadius: "3px",
                                    objectFit: "cover"
                                  }}
                                />
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "9.5px", color: "#16a34a", fontWeight: "600" }}>
                                    Prescription Uploaded
                                  </span>
                                  {/* <a
                                    href={getImageUrl(prescriptionImage)}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ fontSize: "9.5px", color: "#15803d", textDecoration: "underline" }}
                                  >
                                    View
                                  </a> */}
                                </div>
                              </div>
                            )}

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                                flexWrap: "wrap"
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 750,
                                  color: "#0f172a",
                                }}
                              >
                                ₹{billingSummary?.unitPrice?.toFixed(2)}
                              </span>

                              {billingSummary?.isDiscount && (
                                <span
                                  style={{
                                    textDecoration: "line-through",
                                    color: "#94a3b8",
                                    fontSize: "11.5px",
                                  }}
                                >
                                  ₹{billingSummary?.basePrice?.toFixed(2)}
                                </span>
                              )}

                              {billingSummary?.basePrice > billingSummary?.unitPrice && (
                                <span
                                  style={{
                                    background: "#ecfdf5",
                                    color: "#059669",
                                    fontSize: "10px",
                                    padding: "1px 6px",
                                    borderRadius: "4px",
                                    fontWeight: "700",
                                    border: "1px solid #d1fae5"
                                  }}
                                >
                                  {billingSummary?.basePrice > 0
                                    ? `${Math.round(((billingSummary.basePrice - billingSummary.unitPrice) / billingSummary.basePrice) * 100)}% OFF`
                                    : ""}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Quantity controls */}
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "120px", flexShrink: 0 }}>
                          <div
                            style={{
                              display: "inline-flex",
                              border: "1.5px solid #e9d5ff",
                              borderRadius: "8px",
                              backgroundColor: "#fff",
                              boxShadow: "0 1px 4px rgba(128, 89, 202, 0.04)",
                              overflow: "hidden"
                            }}
                          >
                            <button
                              className="btn btn-sm"
                              onClick={() =>
                                decrementQuantity(item.cartKey)
                              }
                              style={{
                                width: "28px",
                                height: "28px",
                                background: "transparent",
                                border: "none",
                                color: "#8059ca",
                                fontSize: "11px",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background-color 0.2s ease"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fdfaff"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <i
                                className="fas fa-minus"
                                style={{ fontSize: "8px" }}
                              ></i>
                            </button>
                            <span
                              className="mx-1 fw-bold text-center"
                              style={{
                                minWidth: "28px",
                                color: "#1e1b4b",
                                fontWeight: "700",
                                fontSize: "13px",
                                lineHeight: "28px"
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              className="btn btn-sm"
                              onClick={() =>
                                incrementQuantity(item.cartKey)
                              }
                              style={{
                                width: "28px",
                                height: "28px",
                                background: "transparent",
                                border: "none",
                                color: "#8059ca",
                                fontSize: "11px",
                                padding: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                transition: "background-color 0.2s ease"
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#fdfaff"}
                              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                            >
                              <i
                                className="fas fa-plus"
                                style={{ fontSize: "8px" }}
                              ></i>
                            </button>
                          </div>
                        </div>

                        {/* Sub-Total and Actions */}
                        <div style={{ display: "flex", alignItems: "center", gap: "16px", width: "150px", flexShrink: 0, justifyContent: "flex-end" }}>
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "flex-end",
                              gap: "1px"
                            }}
                          >
                            <div
                              style={{ fontSize: "15px", fontWeight: "750", color: "#0f172a" }}
                            >
                              ₹{(billingSummary?.baseAmount || 0).toFixed(2)}
                            </div>
                            {billingSummary?.baseAmount > billingSummary?.unitPrice && (
                              <div
                                style={{
                                  fontSize: "11.5px",
                                  textDecoration: "line-through",
                                  color: "#94a3b8",
                                }}
                              >
                                ₹{(billingSummary?.basePrice * (item.quantity || 1)).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "8px",
                              background: "#fef2f2",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                              border: "1px solid #fee2e2"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#fee2e2";
                              e.currentTarget.style.transform = "scale(1.05)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#fef2f2";
                              e.currentTarget.style.transform = "scale(1)";
                            }}
                            onClick={() => handleRemove(item.cartKey)}
                          >
                            <Trash2
                              size={14}
                              color="#ef4444"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
              }
            </div>
          </div>
        </div>

        {cartItems.length > 0 && (
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
            <div>
              {/* OFFERS */}
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
                    background: "#f0fdf4",
                    padding: "16px",
                    borderRadius: "12px",
                    alignItems: "center",
                    cursor: "pointer",
                    border: "1.5px dashed #bbf7d0",
                    transition: "all 0.2s ease",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    const token = localStorage.getItem("medicomparestoken");
                    if (!token) {
                      toast.error("Please login to apply coupons");
                      navigateToLogin(navigate, "/cart");
                      return;
                    }
                    setShowOffersModal(true);
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = "0 4px 12px rgba(22, 163, 74, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      background: "#16a34a",
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
                        color: "#166534",
                        marginBottom: "2px",
                      }}
                    >
                      <span>{appliedCoupon ? "Coupon Applied!" : "Apply Coupon"}</span>
                      <i className="fas fa-chevron-right" style={{ fontSize: "11px", color: "#16a34a" }} />
                    </div>

                    <div style={{ fontSize: "12px", color: "#15803d" }}>
                      {appliedCoupon ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "8px",
                            flexWrap: "wrap",
                            marginTop: "4px"
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            {appliedCoupon.code || appliedCoupon.name}
                          </span>
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
                      ) : localStorage.getItem("medicomparestoken") ? (
                        "View available coupons & save more"
                      ) : (
                        "Login to apply coupons"
                      )}
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

              {/* BILL SUMMARY */}
              <div style={{ marginBottom: "5px" }}>
                <div
                  style={{
                    fontSize: "15.5px",
                    fontWeight: "600",
                    marginBottom: "12px",
                    color: "#1e293b",
                  }}
                >
                  Cart Summary
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
                  {cartItems.length > 0 && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "14px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          Subtotal <small style={{ color: "#94a3b8" }}>(Incl. of all taxes)</small>
                        </span>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          ₹{(cartBilling?.subtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "14px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>GST</span>
                        <span style={{ fontWeight: 600, color: "#1e293b" }}>
                          ₹
                          {(cartBilling?.totalGst || 0).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          color: "#475569",
                          marginBottom: "14px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          Delivery Charges
                        </span>
                        <span style={{ fontWeight: 600, color: "#16a34a" }}>
                          {cartBilling?.deliveryCharges === 0 ? "Free" :
                            `₹${(cartBilling?.deliveryCharges || 0).toFixed(2)}`}
                        </span>
                      </div>

                      {(cartBilling?.couponAmount > 0 || couponDiscount > 0) && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "#475569",
                            marginBottom: "14px",
                          }}
                        >
                          <span style={{ fontWeight: 500, color: "#16a34a" }}>
                            Coupon Discount
                          </span>
                          <span style={{ fontWeight: 600, color: "#16a34a" }}>
                            - ₹{cartBilling?.couponAmount ?
                              cartBilling?.couponAmount.toFixed(2) :
                              (couponDiscount || 0).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {/* {cartBilling?.couponAmount > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "13px",
                            color: "#16a34a",
                            marginBottom: "14px",
                            backgroundColor: "#f0fdf4",
                            padding: "8px 12px",
                            borderRadius: "8px",
                            border: "1px dashed #bbf7d0"
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            Coupon Discount
                            {appliedCoupon?.code
                              ? ` (${appliedCoupon.code})`
                              : ""}
                          </span>
                          <span style={{ fontWeight: 750 }}>
                            -₹{couponDiscount.toFixed(2)}
                          </span>
                        </div>
                      )} */}

                      {selectedPayment === "online" && walletUsed > 0 && (
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
                    </>
                  )}

                  <hr style={{ margin: "14px 0", border: '2px solid #c4b5fd' }} />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "15px",
                      fontWeight: 600,
                      // color: "#0f172a",
                      color: '#8059ca'
                    }}
                  >
                    <span>Amount To Pay</span>
                    <span style={{ color: "#8059ca", fontSize: "17.5px" }}>
                      ₹
                      {(amountToPay || 0).toFixed(2)}
                    </span>
                  </div>

                  {selectedPayment === "online" && walletAmount > 0 && (
                    <>
                      <hr style={{ margin: "12px 0", borderColor: "#f3e8ff" }} />
                      {/* <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12.5px",
                          color: "#475569",
                          marginBottom: "6px"
                        }}
                      >
                        <span>Wallet Balance</span>
                        <span style={{ fontWeight: "500" }}>₹{walletAmount.toFixed(2)}</span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12.5px",
                          color: "#16a34a",
                          marginBottom: "6px",
                          fontWeight: "500"
                        }}
                      >
                        <span>Wallet Applied</span>
                        <span>- ₹{walletUsed.toFixed(2)}</span>
                      </div>  */}
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

                      <div
                        style={{
                          fontSize: "11px",
                          color: "#059669",
                          marginTop: "8px",
                          lineHeight: "1.4"
                        }}
                      >
                        Wallet amount is automatically deducted from your total payable.
                      </div>
                    </>
                  )}
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div
                    style={{
                      background: "#f0fdf4",
                      padding: "10px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 700,
                      color: "#15803d",
                      marginTop: "12px",
                      textAlign: "center",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fas fa-sparkles" style={{ color: "#16a34a" }} />
                    <span>YOU SAVED A TOTAL OF ₹{couponDiscount.toFixed(2)} WITH THIS ORDER!</span>
                  </div>
                )}

                <div
                  style={{
                    fontSize: "15.5px",
                    fontWeight: "600",
                    margin: isMobile ? "16px 0 10px 0" : "28px 0 12px 0",
                    color: "#1e293b",
                  }}
                >
                  Choose Payment Method
                </div>

                {/* {walletAmount > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#fdfaff",
                      border: useWallet ? "2px solid #8059ca" : "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "10px 12px",
                      marginBottom: "12px",
                      cursor: "pointer",
                      boxShadow: useWallet ? "0 4px 12px rgba(128, 89, 202, 0.08)" : "none",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setUseWallet(!useWallet)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "8px",
                          background: useWallet ? "#8059ca" : "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: useWallet ? "#fff" : "#64748b",
                          fontSize: "12px",
                          transition: "all 0.2s"
                        }}
                      >
                        <i className="fas fa-wallet" />
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", fontWeight: "700", color: useWallet ? "#8059ca" : "#1e293b" }}>
                          Use Wallet Balance
                        </div>
                        <div style={{ fontSize: "10px", color: "#64748b" }}>
                          Available: ₹{walletAmount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: useWallet ? "4px solid #8059ca" : "2px solid #cbd5e1",
                        background: "#fff",
                        transition: "all 0.2s ease"
                      }}
                    />
                  </div>
                )} */}

                <div
                  style={{
                    display: "flex",
                    flexDirection: isMobile || isTablet ? "column" : "row",
                    gap: "8px",
                    marginBottom: "16px",
                    width: "100%",
                    boxSizing: "border-box"
                  }}
                >
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
                    onClick={() => setSelectedPayment("cod")}
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
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: selectedPayment === "cod" ? "#8059ca" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: selectedPayment === "cod" ? "#fff" : "#64748b",
                        fontSize: "12px",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                    >
                      <i className="fas fa-money-bill-wave" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: selectedPayment === "cod" ? "#8059ca" : "#1e293b",
                          marginBottom: "1px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        Cash on Delivery
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        Pay at delivery
                      </div>
                    </div>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: selectedPayment === "cod" ? "4px solid #8059ca" : "2px solid #cbd5e1",
                        background: "#fff",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                    />
                  </div>

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
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "8px",
                        background: selectedPayment === "online" ? "#8059ca" : "#f1f5f9",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: selectedPayment === "online" ? "#fff" : "#64748b",
                        fontSize: "12px",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                    >
                      <i className="fas fa-credit-card" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: "700",
                          color: selectedPayment === "online" ? "#8059ca" : "#1e293b",
                          marginBottom: "1px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis"
                        }}
                      >
                        Online Payment
                      </div>
                      <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        UPI, Cards, NetBanking
                      </div>
                    </div>
                    <div
                      style={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        border: selectedPayment === "online" ? "4px solid #8059ca" : "2px solid #cbd5e1",
                        background: "#fff",
                        transition: "all 0.2s ease",
                        flexShrink: 0
                      }}
                    />
                  </div>
                </div>

                <hr style={{ margin: "18px 0", borderColor: "#f1f5f9" }} />

                {/* Checkout Section */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "12px",
                    backgroundColor: "#fdfaff",
                    padding: "16px",
                    borderRadius: "14px",
                    alignItems: "center",
                    border: "1px solid #f3e8ff"
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "4px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#6b7280",
                        }}
                      >
                        Total Payable
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 800,
                        color: "#1e1b4b",
                      }}
                    >
                      ₹{(amountToPay || 0).toFixed(2)}
                    </div>
                  </div>


                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={cartItems.length === 0 || isSubmitting}
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
                      minWidth: "140px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      boxShadow: isSubmitting ? "none" : "0 4px 14px rgba(128, 89, 202, 0.25)",
                      transition: "all 0.2s ease"
                    }}
                    onMouseEnter={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 6px 18px rgba(128, 89, 202, 0.35)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSubmitting) {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "0 4px 14px rgba(128, 89, 202, 0.25)";
                      }
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                          style={{
                            width: "16px",
                            height: "16px",
                            borderWidth: "2px",
                          }}
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        Processing...
                      </>
                    ) : (
                      "Proceed to Pay"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/*  Coupon modal */}
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
                if (couponList) {
                  if (Array.isArray(couponList) && couponList.length > 0) {
                    return couponList.filter(c => c.createdType === type);
                  }
                  if (type === 'admin' && Array.isArray(couponList.adminCoupons)) {
                    return couponList.adminCoupons;
                  }
                  if (type === 'vendor' && Array.isArray(couponList.vendorCoupons)) {
                    return couponList.vendorCoupons;
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

                          const matchesCartVendor = isVendorCoupon && (
                            cartVendorIds.includes(String(ele.createdBy)) ||
                            cartVendorIds.includes(String(ele.businessDetails?._id))
                          );

                          let applicableAmount = 0;
                          // let isEligible = false;
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
                              // criteriaText = `Coupon cannot be applied to this vendor`;
                            } else if (ele?.remainingUses === 0) {
                              isEligible = false;
                            } else {
                              isEligible = true;
                            }

                            // isEligible = ele?.canUseCoupon;
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
                              // criteriaText = `Coupon cannot be applied to this vendor`;
                            } else if (ele?.remainingUses === 0) {
                              isEligible = false;
                            } else {
                              isEligible = true;
                            }
                            // isEligible = ele?.canUseCoupon;
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
                                  {/* {matchesCartVendor && isEligible && (
                                    <span
                                      style={{
                                        fontSize: "9px",
                                        fontWeight: "700",
                                        color: "#8059ca",
                                        background: "#f3e8ff",
                                        padding: "2px 6px",
                                        borderRadius: "4px",
                                      }}
                                    >
                                      Matches Cart
                                    </span>
                                  )} */}
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

      {relevantProducts?.length > 0 && (
        <div
          style={{
            padding: "20px",
            position: "relative",
            marginBottom: isMobile ? "40px" : "0px",
            backgroundImage: "url('/assets/Medicompares Background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            // borderRadius: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: "12px",
              alignItems: "center",
              marginBottom: "20px",
              borderLeft: "4px solid #8059ca",
              paddingLeft: "12px",
              lineHeight: "1",
            }}
          >
            <div style={{
              fontSize: isMobile ? "20px" : "20px",
              fontWeight: 500,
              color: "#0f172a",
              margin: 0
            }}>
              Recently Viewed Products
            </div>
            <span
              style={{
                fontSize: "11px",
                color: "#8059ca",
                fontWeight: "700",
                background: "#f3e8ff",
                padding: "4px 10px",
                borderRadius: "20px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}
            >
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

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "stretch",
            }}
          >
            <button
              className="meq-arrow-btn dental-prev"
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) {
                  container.scrollLeft -= 250;
                }
              }}
              style={{
                left: "-15px",
                display: "flex",
                alignSelf: "center",
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            <div
              id="productCarousel"
              className="scroll-container"
              style={{
                display: "flex",
                alignItems: "stretch",
                overflowX: "auto",
                gap: "20px",
                padding: "16px 60px",
                scrollBehavior: "smooth",
              }}
            >
              {relevantProducts?.map((product, index) => {
                const originalPrice = product?.price || 0;
                const discountPrice = product?.discountprice || null;
                const discountType = product?.discountType || null;

                // Calculate effective price
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
                  ? (discountType === "percentage" ? discountPrice : Math.round(((originalPrice - discountPrice) / originalPrice) * 100))
                  : 0;

                const productImage = product?.combinedvariant?.files?.[0] ||
                  product?.tabletDetails?.files?.[0] ||
                  (Array.isArray(product?.tabletDetails?.imageUrl)
                    ? product.tabletDetails.imageUrl[0]
                    : product?.tabletDetails?.imageUrl) || "/assets/default.png";

                const vendorName = product?.vendor?.name || "Vendor";
                const vendorImage = product?.vendor?.bussiness_image?.[0]?.url || "";

                return (
                  <div
                    key={`${product._id || "product"}-${product.vendor?.vendorId || "vendor"}-${product.combinedvariant?.variantId || "variant"}-${index}`}
                    style={{
                      minWidth: "220px",
                      maxWidth: "220px",
                      alignSelf: "stretch",
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      flexShrink: 0,
                      transition: "all 0.3s ease",
                      position: "relative",
                      overflow: "hidden"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.borderColor = '#8059ca';
                      e.currentTarget.style.boxShadow = '0 8px 24px rgba(128, 89, 202, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = '#f1f5f9';
                      e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.08)';
                    }}
                  >
                    {/* Compare Button */}
                    <div
                      className="compare-btn-highlight"
                      style={{
                        position: "absolute",
                        right: "8px",
                        top: "8px",
                        zIndex: 10,
                        cursor: "pointer",
                        background: "#8059ca",
                        color: "#ffffff",
                        border: "1.5px solid #8059ca",
                        borderRadius: "20px",
                        width: "32px",
                        height: "26px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "flex-start",
                        paddingLeft: "9px",
                        boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.width = "90px";
                        e.currentTarget.style.backgroundColor = "#6a45b3";
                        e.currentTarget.style.borderColor = "#6a45b3";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.width = "32px";
                        e.currentTarget.style.backgroundColor = "#8059ca";
                        e.currentTarget.style.borderColor = "#8059ca";
                      }}
                    >
                      <Link
                        to={`/${product?.tabletDetails?.subcategoryDetails?.categoryDetails?.slug}/${product?.tabletDetails?.subcategoryDetails?.slug}/${product?.tabletDetails?.slug}/compare`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          color: "#ffffff",
                          textDecoration: "none",
                        }}
                      >
                        <i
                          className="fa-solid fa-right-left shrink-0"
                          style={{ fontSize: "11px", color: "#ffffff" }}
                        ></i>
                        <span
                          className="compare-text-label"
                          style={{
                            marginLeft: "6px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#ffffff",
                            opacity: 0,
                            transition: "opacity 0.2s ease-in-out",
                          }}
                        >
                          Compare
                        </span>
                      </Link>
                    </div>

                    {/* Image Area */}
                    <div
                      style={{
                        width: "100%",
                        height: "138px",
                        background: "#f8fafc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "8px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      <img
                        src={getImageUrl(productImage)}
                        alt="product"
                        style={{
                          maxHeight: "100%",
                          maxWidth: "100%",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    {/* Details Area */}
                    <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "7px", flex: 1, minHeight: 0 }}>
                      {/* Name */}
                      <div
                        style={{ cursor: "pointer", marginBottom: "4px" }}
                        onClick={() => handleProductClick(product)}
                      >
                        <h4
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#0f172a",
                            margin: 0,
                            lineHeight: "1.3",
                            textTransform: "capitalize",
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: '36px',
                          }}
                        >
                          {product?.tabletDetails?.name}
                        </h4>
                      </div>

                      {/* Ratings and Seller Row */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}>
                          <img
                            src={getImageUrl(vendorImage)}
                            alt={vendorName}
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              background: '#f1f5f9',
                              flexShrink: 0
                            }}
                            onError={(e) => {
                              e.target.src = '/assets/img/logo.png';
                            }}
                          />
                          <span
                            style={{
                              fontSize: "12.5px",
                              fontWeight: "600",
                              color: "#334155",
                              textOverflow: "ellipsis",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              flex: 1
                            }}
                            title={vendorName}
                          >
                            {vendorName}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
                          <span style={{ fontSize: '11px', color: '#fbbf24' }}>★</span>
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>
                            {product.tabletDetails?.averageRating ? product.tabletDetails.averageRating.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>

                      {/* Pricing block — fixed min height keeps cards aligned */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minHeight: '32px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "#0f172a" }}>
                            ₹{displayPrice.toFixed(2)}
                          </span>
                          {hasValidDiscount && (
                            <span style={{ fontSize: "11px", textDecoration: "line-through", color: "#94a3b8", marginLeft: "6px" }}>
                              ₹{Number(originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        {hasValidDiscount && (
                          <span style={{ fontSize: "10px", fontWeight: "700", color: "#dc2626" }}>
                            {discountPercent}% OFF
                          </span>
                        )}
                        {product?.perDayRent && (
                          <span style={{ fontSize: "10px", color: "#64748b" }}>
                            ₹{Number(product.perDayRent).toFixed(2)}/day
                          </span>
                        )}
                      </div>

                      <div style={{ marginTop: "auto", width: "100%" }}>
                        <div style={{ borderTop: "1px solid #f1f5f9", margin: "2px 0 4px 0" }} />
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
                          className="custom-cart-controls w-100"
                          containerStyle={{
                            display: "flex",
                            width: "100%",
                          }}
                          rentPerDay={product?.perDayRent}
                          selectedVariant={product.combinedvariant}
                          effectiveVariantId={product.combinedvariant?.variantId}
                          isVariant={!!product.combinedvariant}
                          handleRentalBookinProcess={handleRentalBookinProcess}
                          handleNavigateToBooking={handleBooking}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Scroll Button */}
            <button
              className="meq-arrow-btn dental-next"
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) {
                  container.scrollLeft += 250;
                }
              }}
              style={{
                right: "-15px",
                display: "flex",
                alignSelf: "center",
              }}
            >
              <i className="fas fa-chevron-right"></i>
            </button>
          </div>
        </div>
      )
      }

      <LocationOffcanvas
        isOpen={showLocationOffcanvas}
        onClose={closeLocationOffcanvas}
        position={offcanvasPosition}
        source="checkout"
        onAddressSelect={(address) => {
          setSelectedAddress(address);
          if (address?.location?.address || address?.address) {
            const addressString =
              address?.location?.address ||
              address?.address ||
              `${address?.street || ""} ${address?.city || ""} ${address?.state || ""} ${address?.pincode || ""}`.trim();
            const locationData = {
              name: address?.name || addressString,
              address: addressString,
              coordinates: address?.location?.coordinates
                ? {
                  lat: address.location.coordinates[1],
                  lng: address.location.coordinates[0],
                }
                : null,
              placeId: address?.location?.placeId || null,
              pincode: address?.pincode || address?.location?.pincode || null,
              addressId: address?._id || null,
              timestamp: new Date().toISOString(),
            };
            localStorage.setItem(
              "selectedLocationCheckout",
              JSON.stringify(locationData),
            );
            localStorage.setItem(
              "selectedLocation",
              JSON.stringify(locationData),
            );
            localStorage.setItem(
              "selectedLocationBooking",
              JSON.stringify(locationData),
            );
            setCurrentLocation(locationData);
            window.dispatchEvent(
              new CustomEvent("locationChanged", {
                detail: { ...locationData, source: "header" },
                bubbles: true,
                cancelable: true,
              }),
            );

            window.dispatchEvent(
              new CustomEvent("locationChanged", {
                detail: { ...locationData, source: "booking" },
                bubbles: true,
                cancelable: true,
              }),
            );

            window.dispatchEvent(
              new CustomEvent("locationChanged", {
                detail: { ...locationData, source: "checkout" },
                bubbles: true,
                cancelable: true,
              }),
            );
          }
        }}
      />
      <Footer />

      <style>{`
        @media (max-width: 576px) {
          .list-group-item {
            padding: 12px !important;
          }
          .list-group-item img {
            width: 60px !important;
            height: 60px !important;
          }
          .sticky-box {
            position: relative !important;
            top: 0 !important;
          }
        }
      `}</style>
    </div >
  );
};

export default Cart;
