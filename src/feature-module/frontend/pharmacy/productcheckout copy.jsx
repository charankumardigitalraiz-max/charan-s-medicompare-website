import { useState, useEffect } from "react";
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
import "./bookingprocess.css";
import { useMediaQuery } from "react-responsive";
import CartQuantityControls from "../../../components/ui/CartQuantityControls.jsx";

export const Cart = () => {
  const [loading, setLoading] = useState(true);
  const {
    cartItems,
    relevantProducts,
    walletAmount,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    refreshCart,
  } = useCartContext();

  const [showLocationOffcanvas, setShowLocationOffcanvas] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState("online");
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
  const isMobile = useMediaQuery({ maxWidth: 768 });
  const isTablet = useMediaQuery({ maxWidth: 1024 });
  const ExtraSmall = useMediaQuery({ query: "(max-width: 480px)" });
  const [personType, setPersonType] = useState("self");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctorName, setDoctorName] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");

  const fetchDoctors = async (searchQuery = "") => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) return;

      let url = "doctors/list";
      if (searchQuery.trim()) {
        url += `?search=${encodeURIComponent(searchQuery.trim())}`;
      }

      const response = await axiosCommonInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (response.data.success) {
        setDoctors(
          response.data?.data?.doctors ||
          response.data?.data?.familyDoctors ||
          [],
        );
      }
    } catch (error) {
      toast.error("Error fetching doctors:", error);
    }
  };

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await axiosCommonInstance.get("coupon/list");
        setCouponList(response.data.data.couponlist);
      } catch (error) {
        toast.error(error);
      }
    };

    const fetchFamilyMembers = async () => {
      try {
        const token = localStorage.getItem("medicomparestoken");
        if (!token) return;
        const response = await axiosUserInstance.get("family-member/list", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setFamilyMembers(response.data.data);
        }
      } catch (error) {
        toast.error("Error fetching family members:", error);
      }
    };

    fetchCoupons();
    fetchFamilyMembers();
    fetchDoctors();
    // refreshCart();
  }, []);

  useEffect(() => {
    if (!doctorSearchQuery.trim()) {
      fetchDoctors();
      return;
    }

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
          const addressWithLocation = addresses.find(
            (addr) => addr.location && addr.location.address,
          );
          if (addressWithLocation) {
            setSelectedAddress(addressWithLocation);
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

    const days = parseInt(returnDetails);
    if (isNaN(days)) return "";

    return `Returnable in ${days}days`;
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
    if (!item) return;
    const maxQty = getItemMaxQuantity(item);
    if (item.quantity >= maxQty) {
      toast.error(`Only ${maxQty} item${maxQty === 1 ? "" : "s"} available in stock`);
      return;
    }
    const pkgId = item.packageId || (item.type === "package" ? item._id : null);
    incrementItem(
      item.vendorId,
      item.productId,
      item.variantId,
      maxQty,
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

  const handleCouponApply = async (coupon) => {
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
        couponId: coupon._id,
        totalAmount: amountToPay,
        bookingTypes: "cart",
      };

      const response = await axiosCommonInstance.post("coupon/apply", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        const { discount, finalAmount } = response.data.data;
        setAppliedCoupon({
          ...coupon,
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
      orderSubtotal,
    );

    const orderCGST = +CGstCalculate(orderSubtotal).toFixed(2);
    const orderSGST = +SGstCalculate(orderSubtotal).toFixed(2);

    const itemsWithServiceType = cartItems.map((item) => ({
      ...item,
      serviceType:
        item?.productDetails?.tabletDetails?.subcategoryDetails?.categoryDetails
          ?.fixedType,
      servicefixedTypes:
        item?.productDetails?.tabletDetails?.subcategoryDetails?.categoryDetails
          ?.fixedType,
    }));

    const payload = {
      items: itemsWithServiceType,
      subtotal: orderSubtotal,
      shipping: 0,
      discount: orderCouponDiscount,
      tax: orderTax,
      cgst: orderCGST,
      sgst: orderSGST,
      // total: orderPayableTotal,
      total: amountToPay,
      shippingAddress: selectedAddress._id,
      billingAddress: selectedAddress._id,
      paymentmethod: selectedPayment,
      couponId: appliedCoupon?._id || null,
      bookingTypes: "cart",
      couponAmount: orderCouponDiscount,
      // walletamount: selectedPayment === "online" && walletAmount > 0 ? walletAmount : null,
      iswallet: selectedPayment === "online" && walletAmount > 0 ? true : false,
      doctorName:
        selectedDoctor?.value === "not_applicable"
          ? "Not Applicable"
          : selectedDoctor?.label || "",
      doctorId:
        selectedDoctor?.value === "not_applicable"
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

      if (
        selectedPayment === "online" &&
        walletAmount >= amountToPay &&
        walletAmount > 0
      ) {
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

      const options = {
        key: "rzp_live_TB29Bn3l1ssijC",
        amount: razorpayData.amount,
        currency: razorpayData.currency,
        order_id: razorpayData.razorpayOrderId,
        name: "MediCompares",
        description: "Order Payment",

        handler: async function (res) {
          try {
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
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              },
            );

            clearCart();
            setAppliedCoupon(null);
            localStorage.removeItem("checkoutAppliedCoupon");
            sessionStorage.setItem("paymentMethod", "online");
            navigate("/payment-success");
          } catch {
            toast.error("Payment verification failed");
          }
        },

        prefill: {
          name: selectedAddress?.name || "Customer",
          contact: selectedAddress?.phone || "",
        },

        theme: { color: "#8059ca" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
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
  const couponDiscount = calculateCouponDiscount(appliedCoupon, total);
  const amountToPay = appliedCoupon
    ? +Math.max(0, total - couponDiscount).toFixed(2)
    : total;

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
    if (
      Number.isFinite(minPurchase) &&
      minPurchase > 0 &&
      total < minPurchase
    ) {
      setAppliedCoupon(null);
      toast.error(
        `Coupon removed — minimum order amount is ₹${minPurchase}`,
      );
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
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          width: "100vw",
          fontSize: "30px",
          fontWeight: "bold",
        }}
      >
        <img src="/assets/img/logo.png" alt="loaderLogo" />
      </div>
    );
  }

  const resolveImage = (item) => {
    const img =
      item?.files?.[0] ??
      (Array.isArray(item?.imageUrl) ? item.imageUrl[0] : item?.imageUrl);
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
          paddingTop: isMobile ? "100px" : "140px",
          // minHeight: "80vh",
          background: "#f8f9fa",
          alignItems: "flex-start",
          paddingRight: "20px",
          paddingLeft: "20px",
          marginTop: isMobile ? "90px" : "0px",
        }}
      >
        <div
          style={{
            width:
              cartItems.length === 0
                ? "100%"
                : isMobile || isTablet
                  ? "100%"
                  : "67%",
            border: "1px solid #f5f0ff",
            borderRadius: "16px",
            backgroundColor: "#fff",
            boxShadow: "0 8px 32px rgba(125, 46, 255, 0.08)",
            padding: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? "20px" : "0",
            position: "relative",
            overflow: "hidden",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: "4px",
              background:
                "linear-gradient(90deg, #8059ca 0%, #9d6aff 50%, #8059ca 100%)",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
            },
          }}
        >
          <div style={{ paddingTop: "0px", marginBottom: "15px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "400",
                  color: "#666",
                  cursor: "pointer",
                  "&:hover": {
                    color: "#333",
                  },
                }}
              >
                <Link
                  to="/"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: ExtraSmall ? "25px" : "32px",
                    height: ExtraSmall ? "25px" : "32px",
                    borderRadius: "8px",
                    color: "#6f42c1",
                    textDecoration: "none",
                    transition: "background 0.2s ease",
                  }}
                >
                  <i
                    className="isax isax-home-15"
                    style={{ fontSize: "16px" }}
                  />
                </Link>
              </div>
              <div
                style={{
                  fontSize: "14px",
                  color: "#999",
                }}
              >
                /
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#8059ca",
                  position: "relative",
                  paddingBottom: "2px",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: "0",
                    left: "0",
                    width: "100%",
                    height: "2px",
                    backgroundColor: "#8059ca",
                    borderRadius: "1px",
                  },
                }}
              >
                My Cart
              </div>
            </div>
          </div>
          {cartItems.length > 0 && (
            <div className="row">
              <div className={isLoggedIn ? "col-md-6 col-12" : "col-12"}>
                <div style={{ marginBottom: "24px" }}>
                  <div
                    style={{
                      borderRadius: "10px",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        border: "1px solid #e0e0e0",
                        padding: "16px 5px",
                        backgroundColor: "#fff",
                        borderTopRightRadius: "10px",
                        borderTopLeftRadius: "10px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: isMobile ? "12px" : "12px",
                          fontWeight: "600",
                        }}
                        className="top-vendor-badge"
                      >
                        <i className="fas fa-bolt"></i>{" "}
                        <span style={{ fontSize: isMobile ? "12px" : "13px" }}>
                          {getAddressTypeLabel()}
                        </span>
                      </div>
                      <div>
                        <button
                          style={{
                            color: "#8059ca",
                            background: "transparent",
                            border: "none",
                            fontWeight: "600",
                            cursor: "pointer",
                            fontSize: isMobile ? "12px" : "13px",
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
                          border: "1px solid #e0e0e0",
                          borderTop: "none",
                          padding: "16px",
                          backgroundColor: "#fff",
                          fontSize: "14px",
                          color: "#333",
                          borderBottomLeftRadius: "10px",
                          borderBottomRightRadius: "10px",
                        }}
                      >
                        {selectedAddress ? (
                          <div>
                            {selectedAddress.name && (
                              <div
                                style={{
                                  fontWeight: "bold",
                                  marginBottom: "4px",
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
                              <div>{selectedAddress.location.address} </div>
                            )}
                          </div>
                        ) : (
                          selectedAddress?.address || ""
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          border: "1px solid #e0e0e0",
                          borderTop: "none",
                          padding: "16px",
                          backgroundColor: "#fff",
                          fontSize: "14px",
                          color: "#333",
                          borderBottomLeftRadius: "10px",
                          borderBottomRightRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
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
              </div>
              <div className="col-md-6 col-12">
                {isLoggedIn && (
                  <div className="row g-3">
                    <div className="col-6">
                      <label className="radio-box">
                        <input
                          type="radio"
                          name="personType"
                          checked={personType === "self"}
                          onChange={() => {
                            setPersonType("self");
                            setSelectedDoctor(null);
                          }}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-text">Self</span>
                      </label>
                    </div>

                    <div className="col-6">
                      <label className="radio-box">
                        <input
                          type="radio"
                          name="personType"
                          checked={personType === "forWhom"}
                          onChange={() => {
                            setPersonType("forWhom");
                            setSelectedFamilyMember(null);
                            setSelectedDoctor(null);
                            setDoctorName("");
                          }}
                        />
                        <span className="radio-custom"></span>
                        <span className="radio-text">For Whom</span>
                      </label>
                    </div>

                    {personType === "self" && (
                      <div className="col-12">
                        <label className="form-label" style={{ color: "#333" }}>
                          Select Referred Doctor{" "}
                          <span style={{ color: "red" }}>*</span>
                        </label>
                        <Select
                          options={[
                            {
                              value: "not_applicable",
                              label: "Not Applicable",
                            },
                            ...doctors.map((doctor) => ({
                              value: doctor._id,
                              label: `${doctor.name}${doctor["AreaOfPractice "] ? ` (${doctor["AreaOfPractice "]})` : ""}${doctor.place ? `, ${doctor.place}` : ""}`,
                            })),
                          ]}
                          value={selectedDoctor}
                          onChange={(selectedOption) => {
                            setSelectedDoctor(selectedOption);
                            setDoctorName(selectedOption?.label || "");
                          }}
                          onInputChange={(inputValue) => {
                            setDoctorSearchQuery(inputValue);
                          }}
                          placeholder="Search and Select Referred Doctor"
                          isClearable
                          isLoading={doctorSearchLoading}
                          noOptionsMessage={({ inputValue }) =>
                            inputValue.length > 0
                              ? "No doctors found"
                              : "Type to search doctors"
                          }
                        />
                      </div>
                    )}

                    {personType === "forWhom" && (
                      <>
                        <div className="col-12">
                          <label
                            className="form-label"
                            style={{ color: "#333" }}
                          >
                            Select Family Member{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <Select
                            options={familyMembers.map((member) => ({
                              value: member._id,
                              label: member.name,
                            }))}
                            value={selectedFamilyMember}
                            onChange={(selectedOption) =>
                              setSelectedFamilyMember(selectedOption)
                            }
                            placeholder="Select a family member"
                            isClearable
                          />
                        </div>
                        <div className="col-12">
                          <label
                            className="form-label"
                            style={{ color: "#333" }}
                          >
                            Select Referred Doctor{" "}
                            <span style={{ color: "red" }}>*</span>
                          </label>
                          <Select
                            options={[
                              {
                                value: "not_applicable",
                                label: "Not Applicable",
                              },
                              ...doctors.map((doctor) => ({
                                value: doctor._id,
                                label: `${doctor.name}${doctor["AreaOfPractice "] ? ` (${doctor["AreaOfPractice "]})` : ""}${doctor.place ? `, ${doctor.place}` : ""}`,
                              })),
                            ]}
                            value={selectedDoctor}
                            onChange={(selectedOption) =>
                              setSelectedDoctor(selectedOption)
                            }
                            onInputChange={(inputValue) => {
                              setDoctorSearchQuery(inputValue);
                            }}
                            placeholder="Search and Select Referred Doctor"
                            isClearable
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Cart Items Table */}
          <div
            style={{
              background: "#fff",
              borderRadius: "16px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              padding: "20px",
              overflowX: "auto",
              WebkitOverflowScrolling: "touch",
            }}
          >
            <div
              style={{ minWidth: cartItems.length === 0 ? "100%" : "400px" }}
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
              ) : (
                <table
                  className="table"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    marginBottom: 0,
                    minWidth: "400px",
                  }}
                >
                  <thead>
                    <tr>
                      <th
                        style={{
                          ...thStyle,
                          borderBottom: "2px solid #eee",
                          minWidth: "300px",
                          textAlign: "center",
                        }}
                      >
                        MEDICINES
                      </th>
                      <th
                        style={{
                          ...thStyle,
                          borderBottom: "2px solid #eee",
                          minWidth: "120px",
                          textAlign: "center",
                        }}
                      >
                        QUANTITY
                      </th>
                      <th
                        style={{
                          ...thStyle,
                          borderBottom: "2px solid #eee",
                          minWidth: "150px",
                          textAlign: "center",
                        }}
                      >
                        SUB-TOTAL
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item, index) => {
                      const itemProductDetails = item.productDetails;
                      const maxQuantity = getItemMaxQuantity(item);
                      const atMaxStock = item?.quantity >= maxQuantity;
                      const itemPrice = parseFloat(item.price) || 0;
                      const itemDiscountprice =
                        parseFloat(item.discountprice || item.discountPrice) ||
                        null;

                      // Calculate discount price based on discountType
                      let calculatedItemDiscountPrice = itemDiscountprice;
                      const itemDiscountType = item.discountType || null;

                      if (
                        itemDiscountType === "percentage" &&
                        itemDiscountprice &&
                        itemDiscountprice > 0
                      ) {
                        calculatedItemDiscountPrice =
                          itemPrice - (itemPrice * itemDiscountprice) / 100;
                      }

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
                            ((itemPrice - calculatedItemDiscountPrice) /
                              itemPrice) *
                            100,
                          );
                        }
                      }

                      if (isNaN(discount) || discount <= 0) {
                        discount = 0;
                      }

                      return (
                        <tr
                          key={
                            item.uniqueKey ||
                            item._id ||
                            item.cartKey ||
                            `cart-item-${index}`
                          }
                          style={{
                            verticalAlign: "middle",
                            padding: "16px 0",
                            borderBottom: "0.5px solid #C0C0C0",
                          }}
                        >
                          <td style={{ padding: "10px 0", minWidth: "300px" }}>
                            <div
                              style={{
                                display: "flex",
                                gap: "12px",
                                alignItems: "center",
                              }}
                            >
                              <div
                                onClick={() => handleProductClick(item)}
                                style={{ cursor: "pointer" }}
                              >
                                <img
                                  src={resolveImage(item)}
                                  alt={item.name || "Product"}
                                  style={{
                                    width: 70,
                                    height: 70,
                                    borderRadius: "12px",
                                    objectFit: "cover",
                                    boxShadow: "0 6px 16px rgba(0,0,0,0.1)",
                                  }}
                                />
                                {/* <div style={{ fontSize: "12px", fontWeight: 700, color: "#8059ca" }}>
                                  Save For Later
                                </div> */}
                              </div>
                              <div style={{ flex: 1 }}>
                                <div
                                  onClick={() => handleProductClick(item)}
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: 600,
                                    color: "#000",
                                    cursor: "pointer",
                                  }}
                                >
                                  {item.name || "Product Name"}
                                </div>
                                {/* {(item.variantName ||
                                  item.selectedVariantName) && (
                                    <div style={subText}>
                                      {" "}
                                      {item.variantName ||
                                        item.selectedVariantName}
                                    </div>
                                  )} */}
                                <div style={subText} className="text-primary">
                                  {item.vendorName}
                                </div>
                                <span
                                  style={{
                                    background: "#e6fff0",
                                    color: "#16a34a",
                                    fontSize: "11px",
                                    padding: "4px 10px",
                                    borderRadius: "6px",
                                    fontWeight: 600,
                                  }}
                                >
                                  <span>
                                    ₹{effectivePrice.toFixed(0) + " "}
                                    {effectivePrice.toFixed(0) !=
                                      itemProductDetails?.price && (
                                        <span
                                          style={{
                                            textDecoration: "line-through",
                                          }}
                                        >
                                          {itemProductDetails?.price}
                                        </span>
                                      )}
                                  </span>

                                  {discount > 0 && (
                                    <span
                                      className="text-success ms-2"
                                      style={{
                                        fontSize: "11px",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {itemDiscountType === "percentage" &&
                                        itemDiscountprice
                                        ? `${itemDiscountprice}% off`
                                        : `${discount}% off`}
                                    </span>
                                  )}
                                </span>

                                {["medicine", "medicalequipment"].includes(
                                  itemProductDetails?.tabletDetails
                                    ?.subcategoryDetails.categoryDetails
                                    .fixedType,
                                ) && (
                                    <div
                                      style={{
                                        fontSize: "12px",
                                        color: "#555",
                                      }}
                                    ></div>
                                  )}
                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#555",
                                  }}
                                >
                                  {formatReturnablePeriod(item.returnDetails)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ minWidth: "120px" }}>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                className="d-flex align-items-center"
                                style={{
                                  border: "1px solid #8059ca",
                                  borderRadius: "6px",
                                  width: "fit-content",
                                  backgroundColor: "#f8f4ff",
                                }}
                              >
                                <button
                                  className="btn btn-sm"
                                  onClick={() =>
                                    decrementQuantity(item.cartKey)
                                  }
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "transparent",
                                    border: "none",
                                    color: "#8059ca",
                                    fontSize: "12px",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <i
                                    className="fas fa-minus"
                                    style={{ fontSize: "10px" }}
                                  ></i>
                                </button>
                                <span
                                  className="mx-2 fw-semibold text-center"
                                  style={{
                                    minWidth: "30px",
                                    color: "#8059ca",
                                    fontWeight: "600",
                                    fontSize: "14px",
                                  }}
                                >
                                  {item.quantity}
                                </span>
                                <button
                                  className="btn btn-sm"
                                  onClick={() =>
                                    incrementQuantity(item.cartKey)
                                  }
                                  disabled={atMaxStock}
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    background: "transparent",
                                    border: "none",
                                    color: atMaxStock ? "#ccc" : "#8059ca",
                                    fontSize: "12px",
                                    padding: 0,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <i
                                    className="fas fa-plus"
                                    style={{ fontSize: "10px" }}
                                  ></i>
                                </button>
                              </div>
                              {atMaxStock && maxQuantity < 999 && (
                                <small
                                  style={{
                                    display: "block",
                                    textAlign: "center",
                                    color: "#b45309",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    marginTop: "6px",
                                    lineHeight: 1.3,
                                    maxWidth: "150px",
                                  }}
                                >
                                  Only {maxQuantity} in stock
                                </small>
                              )}
                            </div>
                          </td>
                          <td style={{ minWidth: "150px", textAlign: "right" }}>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                justifyContent: "flex-end",
                              }}
                            >
                              <div
                                style={{ fontSize: "16px", fontWeight: 700 }}
                              >
                                <span
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                  }}
                                >
                                  ₹
                                  {(
                                    effectivePrice * (item.quantity || 1)
                                  ).toFixed(2)}
                                </span>
                              </div>
                              {itemPrice > effectivePrice && (
                                <div
                                  style={{
                                    fontSize: "14px",
                                    textDecoration: "line-through",
                                    color: "#999",
                                  }}
                                >
                                  ₹
                                  {(itemPrice * (item.quantity || 1)).toFixed(
                                    2,
                                  )}
                                </div>
                              )}
                              <Trash2
                                size={22}
                                color="#ef4444"
                                style={{ cursor: "pointer" }}
                                onClick={() => handleRemove(item.cartKey)}
                              />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {cartItems.length > 0 && (
          <div
            style={{
              width: isMobile || isTablet ? "100%" : "33%",
              position: isMobile || isTablet ? "static" : "sticky",
              top: "100px",
              border: "1px solid #e6e6ff",
              borderRadius: "16px",
              backgroundColor: "#fff",
              boxShadow: "0 8px 32px rgba(125, 46, 255, 0.08)",
              padding: isMobile ? "16px" : "24px",
              marginTop: "10px",
              overflow: "hidden",
              "&::before": {
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "4px",
                background:
                  "linear-gradient(90deg, #16a34a 0%, #22c55e 50%, #16a34a 100%)",
                borderTopLeftRadius: "16px",
                borderTopRightRadius: "16px",
              },
            }}
          >
            <div
              style={{
                background: "#fff",
                borderRadius: "16px",
                boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
                padding: "24px",
              }}
            >
              {/* OFFERS */}
              <div style={{ marginBottom: "24px" }}>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#000",
                  }}
                >
                  Offers & Discounts
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "12px",
                    background: "#ecfdf5",
                    padding: "16px",
                    borderRadius: "12px",
                    alignItems: "center",
                    cursor: "pointer",
                    border: "1px solid #d1fae5",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      background: "#16a34a",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#fff",
                      fontSize: "16px",
                      fontWeight: 700,
                    }}
                  >
                    %
                  </div>

                  <div
                    style={{ flex: 1 }}
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
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        fontSize: "14px",
                        fontWeight: 600,
                        color: "#065f46",
                        marginBottom: "2px",
                        cursor: "pointer",
                      }}
                    >
                      <span>Apply Coupon</span>
                      <i className="fas fa-chevron-right" />
                    </div>

                    <div style={{ fontSize: "12px", color: "#047857" }}>
                      {appliedCoupon ? (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <span>
                            Applied: {appliedCoupon.code || appliedCoupon.name}
                          </span>
                          {/* <span
                            style={{
                              background: "#dcfce7",
                              color: "#166534",
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              fontWeight: 700,
                            }}
                          >
                            Coupon Applied
                          </span> */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Coupon removed by user
                              setAppliedCoupon(null);
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              padding: 0,
                              cursor: "pointer",
                              color: "#065f46",
                              textDecoration: "underline",
                              fontWeight: 600,
                              fontSize: "12px",
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ) : localStorage.getItem("medicomparestoken") ? (
                        "View available coupons"
                      ) : (
                        "Login to apply coupons"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* BILL SUMMARY */}
              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "8px",
                    color: "#000",
                  }}
                >
                  Cart Summary
                </div>
                <div
                  style={{
                    border: "1px solid #eee",
                    borderTopLeftRadius: "10px",
                    borderTopRightRadius: "10px",
                    padding: "10px",
                    fontSize: "14px",
                    color: "#000",
                    fontWeight: 600,
                  }}
                >
                  Total Bill
                </div>
                <div
                  style={{
                    border: "1px solid #eee",
                    borderBottomLeftRadius: "10px",
                    borderBottomRightRadius: "10px",
                    padding: "20px",
                  }}
                >
                  {cartItems.length > 0 && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#444",
                          marginBottom: "12px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          Subtotal
                          {/* ({cartItems.length} {cartItems.length === 1 ? "item" : "items"})  */}
                          {""} <small>(Inclusive of all taxes)</small>
                        </span>
                        <span style={{ fontWeight: 600 }}>
                          ₹{isNaN(subtotal) ? "0.00" : subtotal.toFixed(2)}
                        </span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#444",
                          marginBottom: "12px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          Delivery Charges
                        </span>
                        <span style={{ fontWeight: 600 }}>0.00</span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#444",
                          marginBottom: "12px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>CGST (4%)</span>
                        <span style={{ fontWeight: 600 }}>
                          ₹
                          {CGstCalculate(isNaN(subtotal))
                            ? "0.00"
                            : CGstCalculate(subtotal).toFixed(2)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#444",
                          marginBottom: "12px",
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>SGST (14%)</span>
                        <span style={{ fontWeight: 600 }}>
                          ₹
                          {SGstCalculate(isNaN(subtotal))
                            ? "0.00"
                            : SGstCalculate(subtotal).toFixed(2)}
                        </span>
                      </div>

                      {couponDiscount > 0 && (
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            fontSize: "12px",
                            color: "#166534",
                            marginBottom: "12px",
                          }}
                        >
                          <span style={{ fontWeight: 600 }}>
                            Coupon Discount
                            {appliedCoupon?.code
                              ? ` (${appliedCoupon.code})`
                              : ""}
                          </span>
                          <span style={{ fontWeight: 700 }}>
                            -₹{couponDiscount.toFixed(2)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <hr style={{ margin: "8px 0", borderColor: "#eee" }} />

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#000",
                    }}
                  >
                    <span>Amount To Pay</span>
                    <span>
                      {" "}
                      ₹
                      {isNaN(amountToPay) || amountToPay === 0
                        ? "0.00"
                        : amountToPay.toFixed(2)}
                    </span>
                  </div>
                  {selectedPayment === "online" && walletAmount > 0 && (
                    <>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#000",
                        }}
                        className="mt-2"
                      >
                        <span>Wallet Amount</span>
                        <span>₹{walletAmount.toFixed(2)}</span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "12px",
                          color: "#444",
                          marginBottom: "12px",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#047857",
                            marginTop: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <span style={{ fontWeight: 500 }}>
                            Wallet amount will be deducted from your total
                            payable
                          </span>
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {appliedCoupon && couponDiscount > 0 && (
                  <div
                    style={{
                      background: "#ECFDF5",
                      padding: "8px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#166534",
                      marginTop: "16px",
                      textAlign: "center",
                      border: "1px solid #D1FAE5",
                    }}
                  >
                    YOU SAVED A TOTAL OF ₹{couponDiscount.toFixed(2)}
                  </div>
                )}

                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    margin: "24px 0 16px 0",
                    color: "#000",
                  }}
                >
                  Choose Payment Method
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "20px",
                  }}
                >
                  <div
                    style={{
                      border: "1px solid #e0e0e0",
                      padding: "12px",
                      gap: "10px",
                      borderRadius: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flex: 1,
                      backgroundColor: "#f9f9f9",
                      cursor: "pointer",
                    }}
                    className={`${selectedPayment === "cod" ? "border-primary bg-light" : ""
                      }`}
                    onClick={() => setSelectedPayment("cod")}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#000",
                      }}
                    >
                      Cash on Delivery
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      id="cod"
                      style={{ transform: "scale(1.2)" }}
                      checked={selectedPayment === "cod"}
                      onChange={() => setSelectedPayment("cod")}
                    />
                  </div>

                  <div
                    style={{
                      border: "1px solid #e0e0e0",
                      padding: "12px",
                      gap: "10px",
                      borderRadius: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flex: 1,
                      backgroundColor: "#f9f9f9",
                      cursor: "pointer",
                    }}
                    className={`${selectedPayment === "online"
                      ? "border-primary bg-light"
                      : ""
                      }`}
                    onClick={() => setSelectedPayment("online")}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#000",
                      }}
                    >
                      Online Payment
                    </div>
                    <input
                      type="radio"
                      name="payment"
                      id="online"
                      style={{ transform: "scale(1.2)" }}
                      checked={selectedPayment === "online"}
                      onChange={() => setSelectedPayment("online")}
                    />
                  </div>
                </div>

                <hr style={{ margin: "10px 0", borderColor: "#eee" }} />

                {/* Checkout Section */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "10px",
                    backgroundColor: "#f8f9fa",
                    padding: "16px",
                    borderRadius: "12px",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "10px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        gap: "10px",
                        alignItems: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: "#000",
                        }}
                      >
                        Amount to Pay
                      </div>
                      <div style={{ color: "#666" }}>
                        <ChevronDown size={18} color="#666" />
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: "20px",
                        fontWeight: 700,
                        color: "#8059ca",
                      }}
                    >
                      ₹{amountToPay.toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={cartItems.length === 0 || isSubmitting}
                    style={{
                      flex: 1,
                      padding: "12px",
                      background: isSubmitting ? "#9ca3af" : "#8059ca",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontSize: "14px",
                      fontWeight: 600,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                      minWidth: "130px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
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

            <div className="offers-modal-body">
              <div className="offers-list">
                {couponList.map((ele, ind) => {
                  return (
                    <div className="offer-card" key={ind}>
                      <div className="offer-discount-badge">
                        {ele.discountType === "fixed"
                          ? `₹${ele.discount} OFF`
                          : `${ele.discount}% OFF`}
                      </div>

                      <div className="offer-card-content">
                        <h5 className="offer-title">{ele.name}</h5>
                        <p className="offer-description">{ele.description}</p>
                        <div className="offer-code-wrapper">
                          <div className="offer-code">
                            <span className="offer-code-value">{ele.code}</span>
                          </div>
                          <button
                            type="button"
                            className="offer-apply-btn"
                            onClick={() => handleCouponApply(ele)}
                          >
                            {appliedCoupon?._id === ele._id
                              ? "Applied"
                              : "Apply"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {relevantProducts?.length > 0 && (
        <div
          style={{
            padding: "20px",
            position: "relative",
            marginBottom: isMobile ? "40px" : "0px",
          }}
        >
          <div
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#000",
              marginBottom: "16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: isMobile ? "13px" : "16px" }}>
              Recently Viewed Products
            </span>
            <div
              style={{ fontSize: "14px", color: "#8059ca", fontWeight: 600 }}
            >
              {relevantProducts.length} products
            </div>
          </div>

          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) {
                  container.scrollLeft -= 250;
                }
              }}
              style={{
                position: "absolute",
                left: "10px",
                zIndex: 10,
                width: "30px",
                height: "30px",
                fontSize: "15px",
                borderRadius: "50%",
                backgroundColor: "#ffffff",
                border: "1px solid #8059ca",
                color: "#8059ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#8059ca",
                  color: "#fff",
                  transform: "scale(1.1)",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              ‹
            </button>

            <div
              id="productCarousel"
              className="scroll-container"
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "20px",
                padding: "20px 60px",
                scrollBehavior: "smooth",
                alignItems: "stretch",
              }}
            >
              {relevantProducts?.map((product, index) => (
                <div
                  key={`${product._id || "product"}-${product.vendor?.vendorId || "vendor"}-${product.combinedvariant?.variantId || "variant"}-${index}`}
                  style={{
                    minWidth: "200px",
                    maxWidth: "230px",
                    background: "#fff",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    border: "1px solid #eaeaea",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    flexShrink: 0,
                    transition: "transform 0.3s ease",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "15px",
                      alignItems: "flex-start",
                      position: "relative",
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        right: "0px",
                        top: "0px",
                        zIndex: 10,
                        cursor: "pointer",
                        background: "#8059ca",
                        borderTopRightRadius: "16px",
                        borderBottomLeftRadius: "16px",
                        padding: "5px",
                        width: "30px",
                        height: "30px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                        transition: "all 0.3s ease",
                        "&:hover": {
                          background: "#8059ca",

                          color: "#fff",
                          transform: "scale(1.1)",
                        },
                      }}
                    >
                      <Link
                        to={`/${product?.tabletDetails?.subcategoryDetails
                          ?.categoryDetails?.slug
                          }/${product?.tabletDetails?.subcategoryDetails?.slug}/${product?.tabletDetails?.slug
                          }/compare`}
                      >
                        <i
                          className="fas fa-exchange-alt"
                          style={{
                            fontSize: "14px",
                            color: "#fff",
                          }}
                        ></i>
                      </Link>
                    </div>

                    <div
                      style={{
                        width: "100%",
                        height: "150px",
                        borderRadius: "12px 12px 0 0",
                        background: "#F1FAFE",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: "12px",
                        position: "relative",
                        cursor: "pointer",
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      <div
                        style={{
                          width: 140,
                          height: 140,
                          borderRadius: "50%",
                          overflow: "hidden",
                          flexShrink: 0,
                          background: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <img
                          src={(() => {
                            const img =
                              product?.combinedvariant?.files?.[0] ||
                              product?.tabletDetails?.files?.[0] ||
                              (Array.isArray(product?.tabletDetails?.imageUrl)
                                ? product.tabletDetails.imageUrl[0]
                                : product?.tabletDetails?.imageUrl);

                            if (!img) return "/assets/default.png";
                            return getImageUrl(img);
                          })()}
                          alt="product"
                          style={{
                            width: "90px",
                            height: "90px",
                            objectFit: "contain",
                          }}
                          className="rounded"
                        />
                      </div>
                    </div>

                    <div style={{ padding: "0 20px 20px 20px" }}>
                      <div
                        style={{ flex: 1, cursor: "pointer" }}
                        onClick={() => handleProductClick(product)}
                      >
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#111",
                            marginBottom: "4px",
                            lineHeight: "1.3",
                            textTransform: "capitalize"
                          }}
                        >
                          {product?.tabletDetails?.name.length > 30
                            ? product?.tabletDetails?.name.slice(0, 30) + "..."
                            : product?.tabletDetails?.name}
                        </div>
                      </div>

                      {/* MRP & Discount */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          background: "#f8f9fa",
                          borderRadius: "10px",
                          marginBottom: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: product.tabletvariantDetails.price
                              ? "flex"
                              : "none",
                            flexDirection: "row",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "11px",
                              color: "#555",
                              fontWeight: "500",
                            }}
                          >
                            MRP
                          </div>
                          <span
                            style={{
                              fontSize: "15px",
                              fontWeight: "700",
                              color: "#111",
                            }}
                          >
                            ₹
                            {getEffectivePrice(product) ||
                              product.tabletvariantDetails.price ||
                              product.price ||
                              ""}
                          </span>
                        </div>

                        <div
                          style={{
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            justifyContent: "flex-end",
                          }}
                        >
                          <div
                            style={{
                              background: "#8059ca",
                              color: "#ffffff",
                              padding: "2px 6px",
                              fontSize: "11px",
                              fontWeight: "500",
                              marginRight: "4px",
                              textAlign: "center",
                              borderRadius: "4px",
                            }}
                          >
                            <i className="fas fa-star text-white"></i>{" "}
                            {product.tabletDetails?.averageRating.toFixed(1) ||
                              0}
                          </div>
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              background: "#f8f9fa",
                              borderRadius: "4px",
                            }}
                          >
                            {product.tabletDetails?.ratingCount || 0}+
                          </span>
                        </div>
                      </div>

                      {/* Seller Info & Price */}
                      <div
                        style={{
                          borderTop: "1px dashed #e0e0e0",
                          paddingTop: "16px",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "stretch",
                            gap: "12px",
                            marginBottom: "16px",
                            minHeight: "70px",
                          }}
                        >
                          <div
                            style={{
                              flex: "0 0 40%",
                              maxWidth: "40%",
                              display: "flex",
                              alignItems: "flex-start",
                            }}
                          >
                            <div
                              style={{
                                width: "100%",
                                aspectRatio: "1 / 1",
                                borderRadius: "50%",
                                background:
                                  "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#999",
                                fontSize: "10px",
                                textAlign: "center",
                                lineHeight: "1.2",
                                overflow: "hidden",
                              }}
                            >
                              <img
                                src={getImageUrl(
                                  product?.vendor?.bussiness_image?.[0]?.url ||
                                  "",
                                )}
                                alt="product"
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            </div>
                          </div>

                          <div
                            style={{
                              flex: "0 0 60%",
                              maxWidth: "60%",
                              display: "flex",
                              flexDirection: "column",
                              justifyContent: "center",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "11px",
                                fontWeight: "600",
                                color: "#333",
                              }}
                            >
                              {product?.vendor?.name}
                            </div>

                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                marginBottom: "4px",
                              }}
                            >
                              <div>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    color: "#111",
                                  }}
                                >
                                  {(() => {
                                    const originalPrice = product?.price || 0;
                                    const discountPrice =
                                      product?.discountprice || null;
                                    const discountType =
                                      product?.discountType || null;

                                    // Calculate effective price based on discountType
                                    let calculatedDiscountPrice = discountPrice;
                                    let hasValidDiscount = false;

                                    if (
                                      discountType === "percentage" &&
                                      discountPrice &&
                                      discountPrice > 0
                                    ) {
                                      calculatedDiscountPrice =
                                        originalPrice -
                                        (originalPrice * discountPrice) / 100;
                                      hasValidDiscount = true;
                                    } else if (
                                      discountPrice &&
                                      discountPrice > 0 &&
                                      discountPrice < originalPrice
                                    ) {
                                      calculatedDiscountPrice = discountPrice;
                                      hasValidDiscount = true;
                                    }

                                    if (hasValidDiscount) {
                                      return (
                                        <>
                                          ₹{calculatedDiscountPrice.toFixed(2)}
                                          <span
                                            style={{
                                              fontSize: "12px",
                                              textDecoration: "line-through",
                                              color: "#999",
                                              marginLeft: "4px",
                                              display: "block",
                                            }}
                                          >
                                            ₹{Number(originalPrice || 0).toFixed(2)}
                                          </span>
                                          {product?.perDayRent && (
                                            <span
                                              style={{
                                                fontSize: "10px",
                                                color: "#666",
                                                marginLeft: "4px",
                                                display: "block",
                                              }}
                                            >
                                              ₹{Number(product?.perDayRent || 0).toFixed(2)} per day
                                            </span>
                                          )}
                                        </>
                                      );
                                    }

                                    return (
                                      <>
                                        ₹{Number(originalPrice || 0).toFixed(2)}
                                        {product?.perDayRent && (
                                          <span
                                            style={{
                                              fontSize: "10px",
                                              color: "#666",
                                              marginLeft: "4px",
                                              display: "block",
                                            }}
                                          >
                                            ₹{Number(product?.perDayRent || 0).toFixed(2)}/day
                                          </span>
                                        )}
                                      </>
                                    );
                                  })()}
                                </span>
                              </div>
                            </div>

                            {product?.combinedvariant?.discountprice ||
                              product?.discountprice ? (
                              <div
                                style={{
                                  color: "#d63031",
                                  borderRadius: "4px",
                                  fontSize: "9px",
                                  fontWeight: "600",
                                  whiteSpace: "nowrap",
                                  marginBottom: "4px",
                                }}
                              >
                                Get{" "}
                                {(() => {
                                  const originalPrice = product?.price || 0;
                                  const discountPrice =
                                    product?.discountprice || null;
                                  const discountType =
                                    product?.discountType || null;

                                  if (
                                    discountType === "percentage" &&
                                    discountPrice &&
                                    discountPrice > 0
                                  ) {
                                    return `${discountPrice}% OFF`;
                                  } else {
                                    return `${Math.round(
                                      ((originalPrice - discountPrice) /
                                        originalPrice) *
                                      100,
                                    )} % OFF`;
                                  }
                                })()}
                              </div>
                            ) : null}
                          </div>
                        </div>
                        <CartQuantityControls
                          rentAndCartButtonStyles={{
                            fontSize: "12px",
                            padding: "5px 8px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            maxWidth: "50%",
                            width: "100%",
                          }}
                          contailerStyles={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            width: "100%",
                          }}
                          individualStyleForCart={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            borderRadius: "10px",
                            border: "1px solid #8059ca",
                            background: "#FDFAFF",
                            padding: "2px 8px",
                            flex: 1,
                            width: "100px",
                          }}
                          style={{
                            maxWidth: "70%",
                            width: "100%",
                            padding: "5px 8px",
                            background: "#8059ca",
                            color: "#fff",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "background 0.3s, transform 0.2s",
                          }}
                          item={{
                            tabletdetails: {
                              ...product.tabletDetails,
                              productId: product.name,
                            },
                            vendordetails: {
                              ...product.vendor,
                              vendorId:
                                product.vendor?.vendorId ||
                                product.vendor?.vendorId,
                            },
                            variants: {
                              ...product.combinedvariant,
                              variantId: product.combinedvariant.variantId,
                            },
                            price: product.combinedvariant?.price || 0,
                            discountprice:
                              product.combinedvariant?.discountprice ||
                              product.discountprice ||
                              0,
                            perDayRent: product.perDayRent,
                            _id: product._id,
                            id: product._id,
                          }}
                          variant={product.combinedvariant}
                          maxStock={product.combinedvariant?.stock || 999}
                          inStock={product.combinedvariant?.isStock !== false}
                          options={{
                            bookingType: product.bookingType,
                          }}
                          className="custom-cart-controls"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Scroll Button */}
            <button
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) {
                  container.scrollLeft += 250;
                }
              }}
              style={{
                position: "absolute",
                right: "10px",
                zIndex: 10,
                width: "30px",
                height: "30px",
                borderRadius: "50%",
                backgroundColor: "#fff",
                border: "1px solid #8059ca",
                color: "#8059ca",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transition: "all 0.3s ease",
                fontSize: "20px",
                fontWeight: "bold",
                "&:hover": {
                  backgroundColor: "#8059ca",
                  color: "#fff",
                  transform: "scale(1.1)",
                },
                "&:active": {
                  transform: "scale(0.95)",
                },
              }}
            >
              ›
            </button>
          </div>
        </div>
      )}

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
    </div>
  );
};

export default Cart;
