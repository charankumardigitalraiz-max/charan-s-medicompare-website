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
import { useResponsive } from "../../../hooks";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import RecentlyViewedProducts from "../../../components/ui/RecentlyViewedProducts.jsx";
import CouponOffersModal from "../../../components/ui/CouponOffersModal.jsx";
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
import BaseModal from "../../../components/ui/BaseModal.jsx";
// NOTE: react-select requires its styling to be passed as a JS "styles" object via its own
// styling API (it does not read className/Tailwind for its internal parts like control/option/
// placeholder). This is a component configuration object, not manual/inline CSS on a DOM node
// we control directly, so it is kept as-is.
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
      getFirst(item?.productImage) ||
      getFirst(item?.varientDetails?.image) ||
      getFirst(item?.varientDetails?.files) ||
      getFirst(item?.variantDetails?.files) ||
      getFirst(item?.variantDetails?.image) ||
      getFirst(item?.imageUrl) ||
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


  const handleCloseModal = () => {
    setShowOffersModal(false)
  }





  // const newLocal = <div className="offers-modal-header">
  //   <h3 className="offers-modal-title">Apply Coupon</h3>
  //   <button
  //     className="offers-modal-close"
  //     onClick={() => setShowOffersModal(false)}
  //   >
  //     ×
  //   </button>
  // </div>;
  return (
    <div className="main-wrapper">
      <Home2Header />
      <CategoryProvider />

      <div
        className={`flex ${isMobile || isTablet ? "flex-col" : "flex-row"} gap-6 items-start bg-[#f8f9fa] max-w-[1440px] mx-auto ${xsMobile ? "pt-[30px]" : isMobile ? "pt-[50px]" : "pt-5"} pb-12 ${isMobile ? "px-3" : "px-[30px]"}`}
      >
        <div
          className={`card shadow-sm rounded-xl border-0 bg-white relative ${cartItems.length === 0 ? "w-full" : isMobile || isTablet ? "w-full" : "w-[67%]"} ${isMobile ? "p-4 mb-5" : "p-6 mb-0"}`}
        >
          <div className="pt-0 mb-[15px]">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-[#321961] border border-[#e9d5ff] rounded-[30px] px-[18px] py-[6px] no-underline text-[13px] font-semibold bg-[#fdfaff] transition-all duration-[250ms] ease-[cubic-bezier(0.4,0,0.2,1)] shadow-[0_2px_5px_rgba(128,89,202,0.05)] hover:text-white hover:bg-gradient-to-br hover:from-[#321961] hover:to-[#6f42c1] hover:border-[#321961] hover:shadow-[0_4px_12px_rgba(128,89,202,0.2)]"
            >
              <i className="fas fa-arrow-left text-[11px]" />
              Back to Home
            </Link>
          </div>
          {cartItems.length > 0 && (
            <div className={`grid gap-6 ${isLoggedIn ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
              <div className="w-full">
                <div className="mb-6">
                  <div className="rounded-md overflow-hidden border border-[#e9ecef] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] bg-white">
                    <div className="flex justify-between items-center px-3 py-4 bg-[#faf8ff] border-b border-[#f3e8ff]">
                      <div className="text-[13px] font-bold text-[#5b21b6] flex items-center gap-2">
                        <i className="fas fa-map-marker-alt text-[#321961]"></i>
                        <span>{getAddressTypeLabel()}</span>
                      </div>
                      <div>
                        <button
                          className="text-white bg-gradient-to-br from-[#321961] to-[#6f42c1] border-0 !font-semibold cursor-pointer !text-[11px] px-4 py-1.5 !rounded-[5px] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
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
                      <div className="p-3 bg-white text-[13.5px] text-[#475569] leading-[1.6]">
                        <div>
                          {selectedAddress.name && (
                            <div className="font-bold text-[#0f172a] mb-1.5 text-[14.5px]">
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
                            <div className="text-[#64748b] mt-1 text-[12.5px]">
                              {selectedAddress.location.address}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 px-5 bg-white text-[13.5px] text-[#64748b] flex items-center justify-center gap-2.5 flex-col text-center">
                        <i className="fas fa-map-marked-alt text-2xl text-[#cbd5e1]"></i>
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

              <div className="w-full">
                {isLoggedIn && (
                  <div className="w-full">
                    <div className="!border !border-[#e9ecef]  !rounded-[10px] !shadow-[0_2px_8px_rgba(0,0,0,0.05)] bg-white border-0 p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                          <div className="!flex !w-full gap-1 !rounded-lg !bg-[#f1f3f9] p-1">

                            <div className="flex flex-1">
                              <label
                                className={`flex w-full items-center justify-center !gap-2 !rounded-sm border !px-3 !py-1 shadow-sm transition-all duration-200 ${personType === "self"
                                  ? "!border-[#321961] !bg-[#321961] text-white"
                                  : "!border-slate-300 !bg-white hover:bg-white/50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="personType"
                                  checked={personType === "self"}
                                  className="sr-only"
                                  onChange={() => {
                                    setPersonType("self");
                                    setSelectedDoctor(null);
                                    setDoctorSearchQuery("");
                                    setDoctors([]);
                                  }}
                                />
                                <i className={`fas fa-user text-sm transition-all duration-200 ${personType === "self" ? "text-white" : "text-slate-500"}`}></i>
                                <span className={`text-[13px] font-semibold transition-all duration-200 ${personType === "self" ? "text-white" : "text-slate-700"}`}>Self</span>
                              </label>
                            </div>

                            <div className="flex flex-1">
                              <label
                                className={`flex w-full !items-center !justify-center !gap-2 !rounded-sm !border !px-3 !py-1 shadow-sm transition-all duration-200 ${personType === "forWhom"
                                  ? "!border-[#321961] !bg-[#321961] text-white"
                                  : "!border-slate-300 !bg-white hover:bg-white/50"
                                  }`}
                              >
                                <input
                                  type="radio"
                                  name="personType"
                                  checked={personType === "forWhom"}
                                  className="sr-only"
                                  onChange={() => {
                                    setPersonType("forWhom");
                                    setSelectedFamilyMember(null);
                                    setSelectedDoctor(null);
                                    setDoctorName("");
                                    setDoctorSearchQuery("");
                                    setDoctors([]);
                                  }}
                                />
                                <i className={`fas fa-users text-sm transition-all duration-200 ${personType === "forWhom" ? "text-white" : "text-slate-500"}`}></i>
                                <span className={`text-[13px] font-semibold transition-all duration-200 ${personType === "forWhom" ? "text-white" : "text-slate-700"}`}>For Whom</span>
                              </label>
                            </div>

                          </div>
                        </div>

                        {personType === "self" && (
                          <div className="col-span-1 md:col-span-2">
                            <label className="form-label text-[#333] text-sm font-medium mb-1.5">
                              Select Referred Doctor{" "}
                              <span className="text-red-600">*</span>
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
                                Select Family Member{" "}
                                <span className="text-red-600">*</span>
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
                            <div className="col-span-1">
                              <label className="form-label text-[#333] text-sm font-medium mb-1.5">
                                Select Referred Doctor{" "}
                                <span className="text-red-600">*</span>
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
            </div>
          )}
          {/* Cart Items Table */}
          <div
            className={
              isMobile
                ? "bg-transparent rounded-none shadow-none p-0 overflow-x-visible"
                : "bg-white rounded-2xl border border-[#e2e8f0] shadow-[0_4px_20px_rgba(0,0,0,0.02)] p-6 overflow-x-auto [-webkit-overflow-scrolling:touch]"
            }
          >
            <div
              className={cartItems.length === 0 || isMobile ? "min-w-full" : "min-w-[400px]"}
            >
              {cartItems.length === 0 ? (
                <div className="text-center py-5">
                  <i
                    className="fas fa-shopping-cart text-muted mb-3 text-[48px]"
                  ></i>
                  <h5 className="text-slate-500 font-bold mb-1">
                    Cart products are not available in this location
                  </h5>
                  <p className="text-slate-400 mb-4">Change pincode</p>
                  <Link
                    to="/"
                    className="inline-flex items-center justify-center w-[150px] bg-[#321961] hover:bg-[#6d3fc7] text-white font-semibold py-2.5 rounded-full text-sm transition-colors duration-200 border-none"
                  >
                    Go Back
                  </Link>
                </div>
              ) : isMobile ? (
                // <>
                <div className="flex flex-col gap-3.5">
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
                        className="bg-white border border-[#f1f5f9] rounded-[14px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative"
                      >
                        {/* Top Section: Image, Name, and Trash */}
                        <div className="flex gap-3 items-start">
                          <img
                            src={resolveImage(item)}
                            alt={item.name || "Product"}
                            className="w-[68px] h-[68px] rounded-[10px] object-cover border border-[#f3effa] shrink-0"
                            onClick={() => handleProductClick(item)}
                          />
                          <div className="flex-1 min-w-0 pr-6">
                            <div
                              onClick={() => handleProductClick(item)}
                              className="text-sm font-semibold text-[#1e293b] leading-[1.3] mb-1 text-ellipsis overflow-hidden [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] capitalize"
                            >
                              {item.name || "Product Name"}
                            </div>

                            {item?.variantName && (
                              <div
                                onClick={() => handleProductClick(item)}
                                className="inline-block mb-1 cursor-pointer"
                              >
                                <span
                                  className="bg-[#f3e8ff] text-[#7e22ce] text-[10.5px] font-semibold px-1.5 py-[1px] rounded border border-[#e9d5ff] inline-block"
                                >
                                  Variant: {item.variantName}
                                </span>
                              </div>
                            )}

                            {/* Vendor Image and Name */}
                            <div className="flex items-center gap-1 mb-1.5">
                              {item.vendorImage ? (
                                <img
                                  src={getImageUrl(item.vendorImage)}
                                  alt={item.vendorName}
                                  className="w-3.5 h-3.5 rounded-[3px] object-cover"
                                />
                              ) : (
                                <i className="fas fa-store text-[8px] text-[#321961]" />
                              )}
                              <span className="text-[10.5px] text-[#321961] font-semibold capitalize">
                                {item.vendorName}
                              </span>
                            </div>

                            {/* Prices */}
                            <div className="flex items-center gap-1.5 flex-wrap">

                              <span className="text-sm font-bold text-[#0f172a]">
                                ₹{billingSummary?.unitPrice.toFixed(0)}
                              </span>
                              {billingSummary?.isDiscount && (
                                <span className="line-through text-[#94a3b8] text-[11px]">
                                  ₹{billingSummary?.basePrice}
                                </span>
                              )}
                              {billingSummary?.isDiscount && (
                                <span
                                  className="bg-[#ecfdf5] text-[#059669] text-[9.5px] px-[5px] py-[1px] rounded font-bold border border-[#d1fae5]"
                                >
                                  {`${Math.round(((billingSummary.basePrice - billingSummary.unitPrice) / billingSummary.basePrice) * 100)}% OFF`}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Trash button at top right */}
                          <div
                            className="absolute top-3 right-3 w-7 h-7 rounded-md bg-[#fef2f2] flex items-center justify-center cursor-pointer border border-[#fee2e2]"
                            onClick={() => handleRemove(item.cartKey)}
                          >
                            <Trash2 size={13} color="#ef4444" />
                          </div>
                        </div>

                        {/* Returnable Policy row */}
                        {formatReturnablePeriod(item.returnDetails) && (
                          <div
                            className="flex items-center gap-1 text-[10px] text-[#64748b] mt-2 pt-2 border-t border-dashed border-[#f1f5f9]"
                          >
                            <i className="fas fa-undo-alt text-[8px] text-[#321961]" />
                            <span>{formatReturnablePeriod(item.returnDetails)}</span>
                          </div>
                        )}

                        {/* Prescription Uploaded Preview */}
                        {prescriptionImage && (
                          <div
                            className="flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-lg px-2.5 py-1.5 mt-2"
                          >
                            <img
                              src={getImageUrl(prescriptionImage)}
                              alt="Prescription"
                              className="w-8 h-8 rounded object-cover"
                            />
                            <div className="flex flex-col">
                              <span className="text-[10px] text-[#16a34a] font-semibold">
                                Prescription Uploaded
                              </span>
                              <a
                                href={getImageUrl(prescriptionImage)}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[9px] text-[#15803d] underline"
                              >
                                View Prescription
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Bottom row: Qty Controls and Subtotal */}
                        <div
                          className="flex justify-between items-center mt-3 pt-3 border-t border-[#f1f5f9]"
                        >
                          {/* Qty Controls */}
                          <div className="inline-flex items-center !border-[1.5px] !border-[#e9d5ff] !rounded-md overflow-hidden bg-white">
                            <button
                              onClick={() => decrementQuantity(item.cartKey)}
                              className="w-7 h-7 flex items-center justify-center !text-[#321961] hover:bg-purple-50 transition"
                            >
                              <i className="fas fa-minus !text-[8px]"></i>
                            </button>

                            <span className="w-8 h-7 flex items-center justify-center !text-xs !font-bold !text-[#1e1b4b]">
                              {item.quantity}
                            </span>

                            <button
                              onClick={() => incrementQuantity(item.cartKey)}
                              className="w-7 h-7 flex items-center justify-center !text-[#321961] hover:bg-purple-50 transition"
                            >
                              <i className="fas fa-plus !text-[8px]"></i>
                            </button>
                          </div>

                          {/* Subtotal */}
                          <div className="text-right">
                            <div className="text-[11px] text-[#64748b]">Subtotal</div>
                            <div className="text-sm font-bold text-[#0f172a]">
                              ₹{(billingSummary?.baseAmount || 0).toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col">
                  {/* Header Row */}
                  <div
                    className="flex justify-between items-center pb-3 border-b border-[#e2e8f0] mb-2"
                  >
                    <div className="flex-1 font-semibold text-[#475569] text-[13.5px]">
                      Medicines ({cartItems.length})
                    </div>
                    <div className="w-[120px] text-center font-semibold text-[#475569] text-[13.5px]">
                      Quantity
                    </div>
                    <div className="w-[150px] text-right font-semibold text-[#475569] text-[13.5px]">
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
                        className={`flex items-center justify-between py-4 ${index === cartItems.length - 1 ? "border-b-0" : "border-b border-[#f1f5f9]"}`}
                      >
                        {/* Medicine Details Info */}
                        <div
                          className="flex gap-4 items-center flex-1 min-w-0"
                        >
                          <div
                            onClick={() => handleProductClick(item)}
                            className="cursor-pointer shrink-0"
                          >
                            <img
                              src={resolveImage(item)}
                              alt={item.name || "Product"}
                              className="w-[70px] h-[70px] rounded-xl object-cover shadow-[0_4px_12px_rgba(128,89,202,0.06)] border border-[#f3effa] transition-transform duration-200 ease-in-out hover:scale-[1.03]"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div
                              onClick={() => handleProductClick(item)}
                              className="text-[14.5px] font-semibold text-[#1e293b] cursor-pointer leading-[1.3] mb-1 text-ellipsis overflow-hidden whitespace-nowrap capitalize hover:text-[#321961]"
                            >
                              {item.name || "Product Name"}
                            </div>
                            {item?.variantName && (
                              <div
                                onClick={() => handleProductClick(item)}
                                className="inline-block mb-1 cursor-pointer"
                              >
                                <span
                                  className="bg-[#f3e8ff] text-[#7e22ce] text-[11px] font-semibold px-2 py-0.5 rounded border border-[#e9d5ff] inline-block"
                                >
                                  Variant: {item.variantName}
                                </span>
                              </div>
                            )}

                            <div className="flex items-center gap-2 text-[11px] text-[#64748b] mb-1.5">
                              <div className="flex items-center gap-1.5">
                                {item.vendorImage ? (
                                  <img
                                    src={getImageUrl(item.vendorImage)}
                                    alt={item.vendorName}
                                    className="w-[18px] h-[18px] rounded object-cover border border-[#e9d5ff]"
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <i className="fas fa-store text-[9px] text-[#321961]" />
                                )}
                                <span className="text-[#321961] font-semibold capitalize">{item.vendorName}</span>
                              </div>
                              {formatReturnablePeriod(item.returnDetails) && (
                                <>
                                  <span className="text-[#cbd5e1]">•</span>
                                  <span className="inline-flex items-center gap-[3px]">
                                    <i className="fas fa-undo-alt text-[9px]" />
                                    {formatReturnablePeriod(item.returnDetails)}
                                  </span>
                                </>
                              )}
                            </div>

                            {/* Prescription Uploaded Preview (Desktop) */}
                            {prescriptionImage && (
                              <div
                                className="inline-flex items-center gap-2 bg-[#f0fdf4] border border-[#bbf7d0] rounded-md px-2 py-1 mb-1.5"
                              >
                                <img
                                  src={getImageUrl(prescriptionImage)}
                                  alt="Prescription"
                                  className="w-6 h-6 rounded-[3px] object-cover"
                                />
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[9.5px] text-[#16a34a] font-semibold">
                                    Prescription Uploaded
                                  </span>
                                  {/* <a
                                    href={getImageUrl(prescriptionImage)}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[9.5px] text-[#15803d] underline"
                                  >
                                    View
                                  </a> */}
                                </div>
                              </div>
                            )}

                            <div
                              className="flex items-center gap-1.5 flex-wrap"
                            >
                              <span
                                className="text-sm font-bold text-[#0f172a]"
                              >
                                ₹{billingSummary?.unitPrice?.toFixed(2)}
                              </span>

                              {billingSummary?.isDiscount && (
                                <span
                                  className="line-through text-[#94a3b8] text-[11.5px]"
                                >
                                  ₹{billingSummary?.basePrice?.toFixed(2)}
                                </span>
                              )}

                              {billingSummary?.basePrice > billingSummary?.unitPrice && (
                                <span
                                  className="bg-[#ecfdf5] text-[#059669] text-[10px] px-1.5 py-[1px] rounded font-bold border border-[#d1fae5]"
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
                        <div className="flex items-center justify-center w-[120px] shrink-0">
                          <div
                            className="inline-flex !border-[1.5px] !border-[#e9d5ff] rounded-lg bg-white !shadow-[0_1px_4px_rgba(128,89,202,0.04)] overflow-hidden"
                          >
                            <button
                              className="btn btn-sm w-7 h-7 bg-transparent border-0 text-[#321961] text-[11px] p-0 flex items-center justify-center transition-colors duration-200 ease-in-out hover:bg-[#fdfaff]"
                              onClick={() =>
                                decrementQuantity(item.cartKey)
                              }
                            >
                              <i
                                className="fas fa-minus text-[8px]"
                              ></i>
                            </button>
                            <span
                              className="mx-1 fw-bold text-center min-w-[28px] text-[#1e1b4b] font-bold text-[13px] leading-7"
                            >
                              {item.quantity}
                            </span>
                            <button
                              className="btn btn-sm w-7 h-7 bg-transparent border-0 text-[#321961] text-[11px] p-0 flex items-center justify-center transition-colors duration-200 ease-in-out hover:bg-[#fdfaff]"
                              onClick={() =>
                                incrementQuantity(item.cartKey)
                              }
                            >
                              <i
                                className="fas fa-plus text-[8px]"
                              ></i>
                            </button>
                          </div>
                        </div>

                        {/* Sub-Total and Actions */}
                        <div className="flex items-center gap-4 w-[150px] shrink-0 justify-end">
                          <div
                            className="flex flex-col items-end gap-[1px]"
                          >
                            <div
                              className="text-[15px] font-bold text-[#0f172a]"
                            >
                              ₹{(billingSummary?.baseAmount || 0).toFixed(2)}
                            </div>
                            {billingSummary?.baseAmount > billingSummary?.unitPrice && (
                              <div
                                className="text-[11.5px] line-through text-[#94a3b8]"
                              >
                                ₹{(billingSummary?.basePrice * (item.quantity || 1)).toFixed(2)}
                              </div>
                            )}
                          </div>
                          <div
                            className="w-[30px] h-[30px] rounded-lg bg-[#fef2f2] flex items-center justify-center cursor-pointer transition-all duration-200 ease-in-out border border-[#fee2e2] hover:bg-[#fee2e2] hover:scale-105"
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
            className={`card shadow-sm rounded-2xl border border-[#f1f5f9] bg-white shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05)]  ${isMobile || isTablet ? "w-full static" : "w-[33%] sticky"} ${isMobile ? "p-3" : "p-7"}`}
          >
            <div>
              {/* OFFERS */}
              <div className="mb-7">
                <div
                  className="text-[15.5px] font-semibold mb-3 text-[#1e293b] flex items-center gap-2"
                >
                  <i className="fas fa-percentage text-[#321961]"></i>
                  Offers & Discounts
                </div>

                {/* Coupon Card */}
                <div
                  className={`group flex items-center gap-4 p-3 rounded-md cursor-pointer transition-all duration-300 border ${appliedCoupon
                    ? "bg-gradient-to-r from-[#f0fdf4] to-[#ecfdf5] border-[#86efac] shadow-[0_8px_20px_rgba(34,197,94,0.12)]"
                    : "bg-gradient-to-r from-[#faf5ff] to-[#ffffff] border-[#d8b4fe] "
                    }`}
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
                >
                  {/* Icon */}
                  <div
                    className={`w-[42px] h-[42px] rounded-xl flex items-center justify-center text-white text-lg shadow-md ${appliedCoupon
                      ? "bg-gradient-to-br from-[#22c55e] to-[#15803d]"
                      : "bg-gradient-to-br from-[#321961] to-[#6d28d9]"
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
                            {appliedCoupon.code || appliedCoupon.name}
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
                {/* <div className="flex gap-2 mt-3">
                  <input
                    type="text"
                    placeholder="Enter Coupon Code"
                    value={couponInputText}
                    onChange={(e) => setCouponInputText(e.target.value)}
                    className="flex-1 border border-[#cbd5e1] rounded-lg px-3 py-2 text-[13px] outline-none transition-colors duration-200 focus:border-[#321961]"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleManualCouponApply();
                    }}
                    className="bg-[#321961] text-white border-0 rounded-lg px-4 py-2 text-[13px] font-semibold cursor-pointer transition-colors duration-200 hover:bg-[#6f42c1]"
                  >
                    Apply
                  </button>
                </div> */}





                <div className="mt-2">
                  <label className="block text-[13px] font-medium text-[#475569] mb-2">
                    Have a Coupon Code?
                  </label>

                  <div className="flex mt-2 flex-row w-full">
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
                      className="px-4 py-2 bg-gradient-to-r from-[#321961] to-[#6d28d9] hover:from-[#7148c5] hover:to-[#5b21b6] text-white !text-sm !font-semibold !rounded-r-lg !border-none transition-all duration-200 shrink-0"
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

              {/* BILL SUMMARY */}
              <div className="mb-[5px]">
                <div
                  className="text-[15.5px] font-semibold mb-3 text-[#1e293b]"
                >
                  Cart Summary
                </div>
                <div
                  className="bg-[#fdfaff] !border-[1.5px] !border-[#f3e8ff] !rounded-[14px] p-3 shadow-[0_2px_8px_rgba(128,89,202,0.02)]"
                >
                  {cartItems.length > 0 && (
                    <>
                      <div
                        className="flex justify-between text-[13px] text-[#475569] mb-3.5"
                      >
                        <span className="font-medium">
                          Subtotal <small className="text-[#94a3b8]">(Incl. of all taxes)</small>
                        </span>
                        <span className="font-semibold text-[#1e293b]">
                          ₹{(cartBilling?.subtotal || 0).toFixed(2)}
                        </span>
                      </div>

                      <div
                        className="flex justify-between text-[13px] text-[#475569] mb-3.5"
                      >
                        <span className="font-medium">GST</span>
                        <span className="font-semibold text-[#1e293b]">
                          ₹
                          {(cartBilling?.totalGst || 0).toFixed(2)}
                        </span>
                      </div>
                      <div
                        className="flex justify-between text-[13px] text-[#475569] mb-3.5"
                      >
                        <span className="font-medium">
                          Delivery Charges
                        </span>
                        <span className="font-semibold text-[#16a34a]">
                          {cartBilling?.deliveryCharges === 0 ? "Free" :
                            `₹${(cartBilling?.deliveryCharges || 0).toFixed(2)}`}
                        </span>
                      </div>

                      {(cartBilling?.couponAmount > 0 || couponDiscount > 0) && (
                        <div
                          className="flex justify-between text-[13px] text-[#475569] mb-3.5"
                        >
                          <span className="font-medium text-[#16a34a]">
                            Coupon Discount
                          </span>
                          <span className="font-semibold text-[#16a34a]">
                            - ₹{cartBilling?.couponAmount ?
                              cartBilling?.couponAmount.toFixed(2) :
                              (couponDiscount || 0).toFixed(2)}
                          </span>
                        </div>
                      )}

                      {selectedPayment === "online" && walletUsed > 0 && (
                        <div
                          className="flex justify-between text-[13px] text-[#059669] mb-3.5"
                        >
                          <span className="font-medium">
                            Wallet Deduction
                          </span>
                          <span className="font-semibold text-[#059669]">
                            - ₹{walletUsed.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <hr className="my-3.5 border-2 border-[#c4b5fd]" />

                  <div
                    className="flex justify-between text-[15px] font-semibold text-[#321961]"
                  >
                    <span>Amount To Pay</span>
                    <span className="text-[#321961] text-[17.5px]">
                      ₹
                      {(amountToPay || 0).toFixed(2)}
                    </span>
                  </div>

                  {selectedPayment === "online" && walletAmount > 0 && (
                    <>
                      <hr className="my-3 border-[#f3e8ff]" />
                      <div
                        className="flex justify-between text-[12.5px] text-[#1e293b] font-semibold"
                      >
                        <span>Remaining Wallet Balance</span>
                        <span className="text-[#475569]">₹{(walletAmount - walletUsed).toFixed(2)}</span>
                      </div>

                      <div
                        className="text-[11px] text-[#059669] mt-2 leading-[1.4]"
                      >
                        Wallet amount is automatically deducted from your total payable.
                      </div>
                    </>
                  )}
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div
                    className="bg-[#f0fdf4] p-2.5 rounded-[10px] text-xs font-bold text-[#15803d] mt-3 text-center border border-[#bbf7d0] flex items-center justify-center gap-1.5"
                  >
                    <i className="fas fa-sparkles text-[#16a34a]" />
                    <span>YOU SAVED A TOTAL OF ₹{couponDiscount.toFixed(2)} WITH THIS ORDER!</span>
                  </div>
                )}

                <div
                  className={`text-[15.5px] font-semibold text-[#1e293b] ${isMobile ? "my-4 mb-2.5" : "mt-7 mb-3"}`}
                >
                  Choose Payment Method
                </div>

                <div
                  className={`flex gap-2 mb-4 w-full box-border ${isMobile || isTablet ? "flex-col" : "flex-row"}`}
                >
                  {/* COD Option */}
                  <div
                    className={`flex-1 min-w-0 !rounded-md px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-all duration-200 ease-in-out !box-border ${selectedPayment === "cod" ? "!border-2 !border-[#321961] !bg-[#fdfaff] shadow-[0_4px_12px_rgba(128,89,202,0.08)]" : "!border-[1.5px] !border-[#e2e8f0] bg-white hover:border-[#cbd5e1] hover:bg-[#fafbfc]"}`}
                    onClick={() => setSelectedPayment("cod")}
                  >
                    <div
                      className={`w-7 h-7 !rounded-lg flex items-center justify-center text-xs transition-all duration-200 ease-in-out shrink-0 ${selectedPayment === "cod" ? "bg-[#321961] text-white" : "!bg-[#f1f5f9] !text-[#64748b]"}`}
                    >
                      <i className="fas fa-money-bill-wave" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-bold mb-[1px] whitespace-nowrap overflow-hidden text-ellipsis ${selectedPayment === "cod" ? "!text-[#321961]" : "!text-[#1e293b]"}`}
                      >
                        Cash on Delivery
                      </div>
                      <div className="text-[10px] !text-[#64748b] whitespace-nowrap overflow-hidden text-ellipsis">
                        Pay at delivery
                      </div>
                    </div>
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 ease-in-out shrink-0 ${selectedPayment === "cod" ? "border-4 border-[#321961]" : "border-2 border-[#cbd5e1]"}`}
                    />
                  </div>

                  {/* Online Option */}
                  <div
                    className={`flex-1 min-w-0 !rounded-md px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-all duration-200 ease-in-out !box-border ${selectedPayment === "online" ? "!border-2 !border-[#321961] !bg-[#fdfaff] shadow-[0_4px_12px_rgba(128,89,202,0.08)]" : "!border-[1.5px] !border-[#e2e8f0] !bg-white hover:border-[#cbd5e1] hover:bg-[#fafbfc]"}`}
                    onClick={() => setSelectedPayment("online")}
                  >
                    <div
                      className={`w-7 h-7 !rounded-lg flex items-center justify-center text-xs transition-all duration-200 ease-in-out shrink-0 ${selectedPayment === "online" ? "!bg-[#321961] !text-white" : "!bg-[#f1f5f9] !text-[#64748b]"}`}
                    >
                      <i className="fas fa-credit-card" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`text-xs font-bold mb-[1px] whitespace-nowrap overflow-hidden text-ellipsis ${selectedPayment === "online" ? "text-[#321961]" : "text-[#1e293b]"}`}
                      >
                        Online Payment
                      </div>
                      <div className="text-[10px] text-[#64748b] whitespace-nowrap overflow-hidden text-ellipsis">
                        UPI, Cards, NetBanking
                      </div>
                    </div>
                    <div
                      className={`w-3.5 h-3.5 rounded-full bg-white transition-all duration-200 ease-in-out shrink-0 ${selectedPayment === "online" ? "border-4 border-[#321961]" : "border-2 border-[#cbd5e1]"}`}
                    />
                  </div>
                </div>

                <hr className="my-[18px] border-[#f1f5f9]" />

                {/* Checkout Section */}
                <div
                  className="flex flex-row gap-3 bg-[#fdfaff] p-4 rounded-[14px] items-center border border-[#f3e8ff]"
                >
                  <div
                    className="flex-1 flex flex-col items-start"
                  >
                    <div
                      className="flex flex-row gap-1 items-center"
                    >
                      <div
                        className="!text-xs !font-semibold !text-[#6b7280]"
                      >
                        Total Payable
                      </div>
                    </div>
                    <div
                      className="!text-xl !font-extrabold !text-[#1e1b4b]"
                    >
                      ₹{(amountToPay || 0).toFixed(2)}
                    </div>
                  </div>


                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={cartItems.length === 0 || isSubmitting}
                    className={`flex-1 px-3 py-2 !text-white border-0 !rounded-[10px] !text-[14.5px] !font-semibold min-w-[140px] flex items-center justify-center gap-2 transition-all duration-200 ease-in-out ${isSubmitting ? "!bg-[#cbd5e1] cursor-not-allowed shadow-none" : "!bg-gradient-to-br from-[#321961] to-[#6f42c1] cursor-pointer shadow-[0_4px_14px_rgba(128,89,202,0.25)] hover:-translate-y-px hover:shadow-[0_6px_18px_rgba(128,89,202,0.35)]"}`}
                  >
                    {isSubmitting ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm w-4 h-4 border-2"
                          role="status"
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
        (() => {
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

          const cartVendorIds = Array.isArray(cartItems) ? cartItems.map(item => String(item.vendorId)) : [];

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

          const mapCoupons = (coupons, isVendorCoupon) => {
            return coupons.map((coupon) => {
              const isApplied = appliedCoupon?._id === coupon._id;
              let applicableAmount = 0;
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

              if (isVendorCoupon) {
                const vendorIdStr = String(coupon.createdBy || coupon.businessDetails?._id || "");
                const vendorItems = cartItems.filter(item => String(item.vendorId) === vendorIdStr);
                applicableAmount = vendorItems.reduce((sum, item) => {
                  const price = getEffectivePrice(item);
                  return sum + (price * (parseInt(item.quantity) || 1));
                }, 0);

                if (hasExpired) {
                  isEligible = false;
                } else if (applicableAmount < coupon.minimumPurchase) {
                  isEligible = false;
                  const diff = (coupon.minimumPurchase - applicableAmount).toFixed(2);
                  criteriaText = `Add ₹${diff} more of this vendor's items`;
                } else if (coupon?.canUseCoupon === false) {
                  isEligible = false;
                } else if (coupon?.remainingUses === 0) {
                  isEligible = false;
                }
              } else {
                applicableAmount = total;
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
              }

              const savingsPreview = isEligible ? calculateCouponDiscount(coupon, applicableAmount) : 0;

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
              onClose={handleCloseModal}
              onApplyCoupon={handleCouponApply}
              adminCoupons={sortedAdminCoupons}
              vendorCoupons={sortedVendorCoupons}
            />
          );
        })()
      )}

      <RecentlyViewedProducts
        products={relevantProducts}
        onProductClick={handleProductClick}
        onRentalBooking={handleRentalBookingProcess}
        onBooking={handleBooking}
      />

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