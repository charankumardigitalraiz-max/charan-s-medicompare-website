import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import RecentlyViewedProducts from "../../../components/ui/RecentlyViewedProducts.jsx";
import CouponOffersModal from "../../../components/ui/CouponOffersModal.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import { useProfile } from "../../../context/ProfileContext";
import { useLocation } from "../../../context/LocationContext";
import LeadModal from "./products-components/LeadModal.jsx";
import BaseModal from "../../../components/ui/BaseModal.jsx";
const TOKEN_STORAGE_KEY = "medicomparestoken";

const RentalBookingProcess = () => {
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [data, setData] = useState({});
  const [cart, setCart] = useState({});
  const [releventBookings, setReleventBookings] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [cartResult, setCartResult] = useState(null);
  const [vendorTimings, setVendorTimings] = useState({});
  const [showLocationOffcanvas, setShowLocationOffcanvas] = useState(false);
  const [offcanvasPosition, setOffcanvasPosition] = useState("right");
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [paymentType, setPaymentType] = useState("onetimepayment");
  const [rentalPlan, setRentalPlan] = useState("monthly");
  const [numberOfInstallments, setNumberOfInstallments] = useState("1");
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const { profile: userProfile } = useProfile();

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
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = localStorage.getItem("appliedCoupon");

      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [couponInputText, setCouponInputText] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRentalSubmitting, setIsRentalSubmitting] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  });

  const [rentalDuration, setRentalDuration] = useState("1");

  const [perDayRent, setPerDayRent] = useState(() => {
    try {
      return parseFloat(localStorage.getItem("perDayRent")) || 0;
    } catch {
      return 0;
    }
  });

  const navigate = useNavigate();

  const { isMobile } = useResponsive();

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    const resolvedService = servicePassed || med?.subcategoryDetails?.categoryDetails?.fixedType || med?.CategoryDetails?.fixedType || med?.subcategorys?.category?.fixedType || med?.category?.fixedType || med?.fixedType;
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
    const resolvedService = servicePassed || med?.subcategoryDetails?.categoryDetails?.fixedType || med?.CategoryDetails?.fixedType || med?.subcategorys?.category?.fixedType || med?.category?.fixedType || med?.fixedType;
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

  const discountPrice = data?.discountprice;

  const pricePerItem = (() => {
    if (discountPrice && discountPrice > 0) {
      return discountPrice;
    }

    if (cart?.type === "normal" && data?.tabletDetails?.price) {
      return data.tabletDetails.price;
    }

    if (cart?.type === "package" && data?.price) {
      return data.price;
    }

    return (
      data?.currentVariation?.price ??
      data?.tabletDetails?.price ??
      data?.price ??
      cart?.price ??
      0
    );
  })();

  const mrpPrice = (() => {
    if (discountPrice && discountPrice > 0) {
      return (
        data?.currentVariation?.mrp ??
        data?.tabletDetails?.mrp ??
        data?.mrp ??
        cart?.mrp ??
        data?.price ??
        cart?.price ??
        (pricePerItem > 0 ? pricePerItem * 1.5 : 0)
      );
    }

    if (cart?.type === "normal" && data?.tabletDetails?.mrp) {
      return data.tabletDetails.mrp;
    }

    if (cart?.type === "package") {
      if (data?.mrp) return data.mrp;

      if (data?.price) return data.price;
    }

    return (
      data?.currentVariation?.mrp ??
      data?.tabletDetails?.mrp ??
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

  const serviceCharges =
    data?.rentalPricing?.serviceCharges || data?.serviceCharges || 0;

  const returnCharge =
    data?.rentalPricing?.returnCharge || data?.returnCharge || 0;

  const fixedDeposit =
    data?.rentalPricing?.fixedDeposit || data?.fixedDeposit || 0;
  const basePricePerDay = data?.rentalPricing?.basePricePerDay || 0;
  const rentalPrice = data?.rentalPricing?.rentalPrice || 0;
  const totalRentalPrice = data?.rentalPricing?.totalRentalPrice || 0;
  const totalPayAmount = data?.rentalPricing?.totalPayAmount || 0;
  const totalAmount = data?.rentalPricing?.totalAmount || 0;
  const totalDays = data?.rentalPricing?.totalDays || 0;
  const rentalDays = totalDays || 1;
  const rentalSubtotal = rentalPrice || basePricePerDay * rentalDays;
  const tax = data?.rentalPricing?.gstAmount;


  const calculateTotalAmount = () => {
    const rate = perDayRent || data?.perDayRent || data?.rentalPricing?.perDayRent || 0;
    if (!rate || !rentalDuration || !rentalPlan) return 0;

    let days = 0;

    if (rentalPlan === "weekly") {
      days = parseInt(rentalDuration) * 7;
    } else if (rentalPlan === "monthly") {
      days = parseInt(rentalDuration) * 30;
    } else if (rentalPlan === "yearly") {
      days = parseInt(rentalDuration) * 365;
    }

    return rate * days;
  };

  const calculatedTotalAmount = calculateTotalAmount();

  const getInstallmentAmounts = () => {
    if (!calculatedTotalAmount || !numberOfInstallments) return [];

    const installmentCount = parseInt(numberOfInstallments);

    const installmentAmounts = [];

    for (let i = 1; i <= installmentCount; i++) {
      if (i === 1) {
        installmentAmounts.push(calculatedTotalAmount);
      } else {
        installmentAmounts.push(calculatedTotalAmount / installmentCount);
      }
    }

    return installmentAmounts;
  };

  const installmentAmounts = getInstallmentAmounts();

  useEffect(() => {
    if (rentalDuration, rentalPlan) {
      setNumberOfInstallments(rentalDuration);
    }
  }, [rentalDuration, rentalPlan]);

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

  const cgst = parseFloat(CGstCalculate(rentalSubtotal).toFixed(2));

  const sgst = parseFloat(SGstCalculate(rentalSubtotal).toFixed(2));

  // const tax = parseFloat(().toFixed(2));


  const total = parseFloat(
    (
      totalRentalPrice || rentalSubtotal + serviceCharges + returnCharge
    ).toFixed(2),
  );

  const calculateCouponDiscount = (coupon, baseAmount) => {
    if (!coupon) return 0;

    const base = Number.isFinite(baseAmount) ? baseAmount : 0;

    let discountAmount = 0;

    if (coupon.discountType === "percentage") {
      const percentage = parseFloat(coupon.discount) || 0;

      discountAmount = (base * percentage) / 100;
    } else if (coupon.discountType === "fixed") {
      discountAmount = parseFloat(coupon.discount) || 0;
    }

    discountAmount = Math.max(0, Math.min(discountAmount, base));

    return +discountAmount.toFixed(2);
  };

  const couponDiscount = calculateCouponDiscount(appliedCoupon, totalPayAmount || totalAmount || total);

  const amountToPay = parseFloat(
    Math.max(
      0,
      (totalPayAmount || totalAmount || total) - couponDiscount,
    ).toFixed(2),
  );

  const remainingAmount = parseFloat(
    Math.max(0, amountToPay - fixedDeposit).toFixed(2),
  );

  const installmentAmount = data?.rentalPricing?.installmentAmount || 0;

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
        totalAmount: rentalSubtotal || amountToPay,
        bookingTypes: "buy_now",
        servicefixedTypes: data?.medicineDetails?.CategoryDetails?.fixedType || data?.tabletDetails?.CategoryDetails?.fixedType,
      };

      const response = await axiosCommonInstance.post("coupon/apply", payload, {
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

  const getInstallmentFrequencyText = () => {
    switch (rentalPlan) {
      case "weekly":
        return "Every week";

      case "monthly":
        return "Every month";

      case "yearly":
        return "Every year";

      default:
        return "";
    }
  };

  const testsCount =
    data?.tabletDetails?.parameters?.length ||
    data?.products?.length ||
    data?.tabletDetails?.parameterss?.length;

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

      const cartInfo = response?.data?.data?.cart || {};

      const releventBookingsData = response?.data?.data?.relevantProducts || [];

      const vendorTimingsData = response?.data?.data?.vendortimings || {};

      const apiData = response?.data?.data?.products || {};

      const storedPerDayRent = localStorage.getItem("perDayRent");

      if (storedPerDayRent && !apiData.perDayRent) {
        apiData.perDayRent = parseFloat(storedPerDayRent);
      }

      setData(apiData);

      setCart(cartInfo);

      setReleventBookings(releventBookingsData);

      setVendorTimings(vendorTimingsData);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    }
  };

  const loadSavedAddresses = async () => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) return;

      const response = await axiosCommonInstance.get("address/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  //  order

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!paymentMethod) {
      toast.error("Please select a payment method");

      return;
    }

    if (!token) {
      toast.error("Please login first");

      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");

      return;
    }

    if (!paymentType) {
      toast.error("Please select a Payment Type");

      return;
    }

    if (paymentType === "installment") {
      if (!rentalPlan) {
        toast.error("Please select a Rental Plan");

        return;
      }

      if (!numberOfInstallments) {
        toast.error("Please select Number of Installments");

        return;
      }
    }

    if (!startDate) {
      toast.error("Please select a Start Date");

      return;
    }

    setIsSubmitting(true);

    const orderCGST = parseFloat(CGstCalculate(rentalSubtotal).toFixed(2));
    const orderSGST = parseFloat(SGstCalculate(rentalSubtotal).toFixed(2));
    const orderTax = parseFloat((orderCGST + orderSGST).toFixed(2));
    const finalAmount = amountToPay;
    const payload = {
      rentalCartIds: cartResult?.cartItem?._id ? [cartResult.cartItem._id] : [],

      items: [
        {
          type: cart?.type,
          cartId: cart?._id,
          quantity: quantity,
          pricePerItem: pricePerItem,
          subtotal: rentalSubtotal,
          price: mrpPrice,
          discountprice: discountPrice || 0,
          rentalDays: rentalDays,
          serviceType: data?.tabletDetails?.CategoryDetails?.fixedType,
          servicefixedTypes: data?.medicineDetails?.CategoryDetails?.fixedType || data?.tabletDetails?.CategoryDetails?.fixedType,
        },
      ],
      bookingTypes: "buy_now",
      orderType: "rental",
      startDate: startDate || null,
      endDate: data?.rentalPricing?.endDate,
      paymentType: paymentType || null,
      rentalPlan: rentalPlan || null,
      numberOfInstallments: numberOfInstallments || null,
      rentalDays: rentalDays,
      subtotal: rentalSubtotal,
      shipping: 0,
      discount: couponDiscount,
      tax: tax,
      cgst: orderCGST,
      sgst: orderSGST,
      total: totalAmount,
      amountToPay: finalAmount,
      remainingAmount: remainingAmount,
      fixedDeposit: fixedDeposit,
      shippingAddress: selectedAddress._id,
      billingAddress: selectedAddress._id,
      paymentmethod: paymentMethod,
      couponId: appliedCoupon?._id || null,
      couponAmount: couponDiscount,
      serviceCharges: serviceCharges,
      returnCharge: returnCharge,
      firstAmount: finalAmount,
      secondAmount: installmentAmount,
      pincode:
        currentLocation?.pincode ||
        selectedPincode ||
        selectedAddress?.location?.pincode ||
        "",
    };

    try {
      const response = await axiosUserInstance.post(
        "orders/rental/create",
        payload,

        {
          headers: {
            Authorization: `Bearer ${token}`,

            "Content-Type": "application/json",
          },
        },
      );

      const orderId = response?.data?.data?.orderId || response?.data?.orderId;

      if (orderId) {
        sessionStorage.setItem("orderId", orderId);
      }

      const orderItems = [
        {
          type: "rental",
          name: data?.tabletDetails?.name || data?.name,
          id: data?.tabletDetails?._id || data?.id,
        },
      ];
      sessionStorage.setItem("orderItems", JSON.stringify(orderItems));

      const razorpayData = response.data.data;

      if (paymentMethod === "cod") {
        setAppliedCoupon(null);

        localStorage.removeItem("appliedCoupon");

        sessionStorage.setItem("paymentMethod", "cod");

        navigate("/payment-success");

        return;
      }

      if (finalAmount <= 0) {
        setAppliedCoupon(null);
        localStorage.removeItem("checkoutAppliedCoupon");
        sessionStorage.setItem("paymentMethod", "wallet");
        navigate("/payment-success");
        return;
      }

      if (!window.Razorpay) {
        toast.error("Razorpay not loaded");

        return;
      }

      const phone = localStorage.getItem("phone")
      const email = localStorage.getItem("email")
      const name = localStorage.getItem("name") || "Customer"

      openRazorpayCheckout({
        razorpayData,
        description: "Rental Order Payment",
        prefill: {
          name: name || "Customer",
          contact: phone || "",
          email: email || ""
        },
        setIsSubmitting,
        onSuccess: async (res) => {
          await axiosUserInstance.post(
            "orders/rental/verify-payment",
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
              type: "rental",
              name: data?.tabletDetails?.name || data?.name,
              id: data?.tabletDetails?._id || data?.id,
            },
          ];
          sessionStorage.setItem("orderItems", JSON.stringify(orderItems));
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

  useEffect(() => {
    if (data?.perDayRent) {
      setPerDayRent(data.perDayRent);
      localStorage.setItem("perDayRent", data.perDayRent.toString());
    }
  }, [data]);

  const productId = data?.tabletDetails?._id || data?._id;
  const vendorId = data?.vendorDetails?._id || data?.vendorId;

  useEffect(() => {
    const autoUpdateRentalPricing = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token || !productId || !vendorId || !startDate || !paymentType || !rentalPlan || !rentalDuration) {
        return;
      }

      if (paymentType === "installment" && !numberOfInstallments) {
        return;
      }

      const payload = {
        productId,
        vendorId,
        startDate,
        paymentType,
        rentalPlan,
        rentalDuration,
        numberOfInstallments: paymentType === "installment" ? numberOfInstallments : "1",
      };

      try {
        const response = await axiosUserInstance.post(
          "rentals/search/checkout",
          payload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.data?.success) {
          const responseData = response.data.data;
          setData((prevData) => {
            const updatedData = { ...prevData };
            if (responseData.product) {
              Object.keys(responseData.product).forEach((key) => {
                if (
                  key !== "tabletDetails" &&
                  key !== "vendorDetails" &&
                  key !== "bussinessdetails"
                ) {
                  updatedData[key] = responseData.product[key];
                }
              });

              if (responseData.product.tabletDetails) {
                updatedData.tabletDetails = {
                  ...prevData.tabletDetails,
                  ...responseData.product.tabletDetails,
                };
              }

              if (responseData.product.vendorDetails) {
                updatedData.vendorDetails = {
                  ...prevData.vendorDetails,
                  ...responseData.product.vendorDetails,
                };
              }

              if (responseData.product.bussinessdetails) {
                updatedData.bussinessdetails = {
                  ...prevData.bussinessdetails,
                  ...responseData.product.bussinessdetails,
                };
              }
            }

            updatedData.rentalPricing = responseData.rentalPricing;
            return updatedData;
          });

          if (responseData.relatedproduct) {
            setRelatedProducts(responseData.relatedproduct);
          }

          if (responseData.cartResult) {
            setCartResult(responseData.cartResult);
          }

          if (responseData.couponlist) {
            setCouponList(responseData.couponlist);
          }
        }
      } catch (error) {
        console.error("Error auto-updating rental pricing:", error);
      }
    };

    autoUpdateRentalPricing();
  }, [
    startDate,
    rentalPlan,
    rentalDuration,
    paymentType,
    numberOfInstallments,
    productId,
    vendorId
  ]);

  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);

      try {
        await Promise.all([getData(), loadSavedAddresses()]);
      } catch (error) {
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

  const productName =
    cart?.type === "normal" && data?.tabletDetails?.name
      ? data.tabletDetails.name
      : cart?.type === "package" && data?.name
        ? data.name
        : "Product";

  const handleSubmitAdditionalInfo = async () => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      toast.error("Please login to continue");
      return;
    }
    setIsRentalSubmitting(true);
    if (!startDate || !paymentType) {
      toast.error("Please fill all required fields");
      setIsRentalSubmitting(false);
      return;
    }
    if (!rentalPlan) {
      toast.error("Please select a rental plan");
      setIsRentalSubmitting(false);
      return;
    }
    if (!rentalDuration) {
      toast.error("Please select rental duration");
      setIsRentalSubmitting(false);
      return;
    }
    if (paymentType === "installment" && !numberOfInstallments) {
      toast.error("Please select number of installments");
      setIsRentalSubmitting(false);
      return;
    }
    const payload = {
      productId: data?.tabletDetails?._id || data?._id,
      vendorId: data?.vendorDetails?._id || data?.vendorId,
      startDate,
      paymentType,
      rentalPlan: rentalPlan,
      rentalDuration: rentalDuration,
      numberOfInstallments: numberOfInstallments,
    };
    try {
      const response = await axiosUserInstance.post(
        "rentals/search/checkout",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.data?.success) {
        const responseData = response.data.data;
        setData((prevData) => {
          const updatedData = { ...prevData };
          if (responseData.product) {
            Object.keys(responseData.product).forEach((key) => {
              if (
                key !== "tabletDetails" &&
                key !== "vendorDetails" &&
                key !== "bussinessdetails"
              ) {
                updatedData[key] = responseData.product[key];
              }
            });

            if (responseData.product.tabletDetails) {
              updatedData.tabletDetails = {
                ...prevData.tabletDetails,

                ...responseData.product.tabletDetails,
              };
            }

            if (responseData.product.vendorDetails) {
              updatedData.vendorDetails = {
                ...prevData.vendorDetails,

                ...responseData.product.vendorDetails,
              };
            }

            if (responseData.product.bussinessdetails) {
              updatedData.bussinessdetails = {
                ...prevData.bussinessdetails,

                ...responseData.product.bussinessdetails,
              };
            }
          }

          updatedData.rentalPricing = responseData.rentalPricing;

          return updatedData;
        });

        // Store related products
        if (responseData.relatedproduct) {
          setRelatedProducts(responseData.relatedproduct);
        }

        // Store cart result
        if (responseData.cartResult) {
          setCartResult(responseData.cartResult);
        }
      } else {
        toast.error(
          response.data?.message || "Failed to calculate rental pricing",
        );
      }
    } catch (error) {
      console.error("Error submitting booking:", error);

      toast.error(
        error.response?.data?.message || "Failed to calculate rental pricing",
      );
    } finally {
      setIsRentalSubmitting(false);
    }
  };

  const handleRentRelatedProduct = async (relatedProduct) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!token) {
      toast.error("Please login to continue");
      return;
    }

    if (!startDate || !paymentType) {
      toast.error("Please fill all required fields");
      return;
    }

    if (!rentalPlan) {
      toast.error("Please select a rental plan");
      return;
    }

    if (!rentalDuration) {
      toast.error("Please select rental duration");
      return;
    }

    if (paymentType === "installment" && !numberOfInstallments) {
      toast.error("Please select number of installments");
      return;
    }

    const payload = {
      productId: relatedProduct.name || relatedProduct.tabletDetails?._id,
      vendorId: relatedProduct.vendorId,
      startDate,
      paymentType,
      rentalPlan: rentalPlan,
      rentalDuration: rentalDuration,
      numberOfInstallments: numberOfInstallments,
    };

    try {
      setIsRentalSubmitting(true);
      const response = await axiosUserInstance.post(
        "rentals/search/checkout",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.data?.success) {
        const responseData = response.data.data;

        setData((prevData) => {
          const updatedData = { ...prevData };

          if (responseData.product) {
            Object.keys(responseData.product).forEach((key) => {
              if (
                key !== "tabletDetails" &&
                key !== "vendorDetails" &&
                key !== "bussinessdetails"
              ) {
                updatedData[key] = responseData.product[key];
              }
            });

            if (responseData.product.tabletDetails) {
              updatedData.tabletDetails = {
                ...prevData.tabletDetails,
                ...responseData.product.tabletDetails,
              };
            }

            if (responseData.product.vendorDetails) {
              updatedData.vendorDetails = {
                ...prevData.vendorDetails,
                ...responseData.product.vendorDetails,
              };
            }

            if (responseData.product.bussinessdetails) {
              updatedData.bussinessdetails = {
                ...prevData.bussinessdetails,
                ...responseData.product.bussinessdetails,
              };
            }
          }

          updatedData.rentalPricing = responseData.rentalPricing;

          return updatedData;
        });
        if (responseData.relatedproduct) {
          setRelatedProducts(responseData.relatedproduct);
        }
        if (responseData.cartResult) {
          setCartResult(responseData.cartResult);
        }
        // localStorage.removeItem("perDayRent");
      } else {
        toast.error(
          response.data?.message || "Failed to calculate rental pricing",
        );
      }
    } catch (error) {
      console.error("Error submitting booking:", error);
      toast.error(
        error.response?.data?.message || "Failed to calculate rental pricing",
      );
    } finally {
      setIsRentalSubmitting(false);
    }
  };

  const [isTotalFareExpanded, setIsTotalFareExpanded] = useState(true);

  const resolveImage = (item) => {
    if (
      item?.tabletDetails?.files &&
      Array.isArray(item.tabletDetails.files) &&
      item.tabletDetails.files.length > 0
    ) {
      const file = item.tabletDetails.files[0];

      return getImageUrl(file);
    }

    if (
      item?.tabletDetails?.imageUrl &&
      Array.isArray(item.tabletDetails.imageUrl) &&
      item.tabletDetails.imageUrl.length > 0
    ) {
      const file = item.tabletDetails.imageUrl[0];

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
    <div className="flex flex-col min-h-screen">
      <div className="main-wrapper min-h-screen bg-[#f8f9fa]">
        <Home2Header />

        <CategoryProvider />

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 pt-2 pb-12">
          <div className="!mb-3">
            <button
              onClick={() => navigate(-1)}
              className="!flex !items-center !gap-[6px] !p-[4px_10px] !border !border-[#e0e0e0] !bg-white !text-[#333] !font-[500] !text-[12px] !rounded-[6px] !shadow-sm !cursor-pointer !transition-all !duration-300 hover:!border-[#321961] hover:!text-[#321961] hover:!bg-[#f8f5ff] hover:!shadow-[0_4px_8px_rgba(125,46,255,0.15)] hover:!-translate-y-px"
            >
              <i className="fas fa-arrow-left text-[11px]"></i>
              <span className="text-[12px] font-medium">Back</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 flex flex-col gap-2">
              <div className="card shadow-sm border-none bg-white relative rounded-xl p-4 md:p-6 !flex !flex-col !gap-6">

                {/* Row 1: Address and Additional Info */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 md:gap-6 !pb-6 !border-b !border-[#f1f5f9]">
                  <div className="w-full md:col-span-5">
                    <div className="rounded-md overflow-hidden border border-[#e9ecef] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] bg-white h-full flex flex-col">
                      <div className="flex justify-between items-center px-3 py-4 bg-[#faf8ff] border-b border-[#f3e8ff]">
                        <div className="text-[13px] font-semibold text-[#5b21b6] flex items-center gap-2">
                          <i className="fas fa-map-marker-alt text-[#321961]"></i>{" "}
                          <span className="text-[13px]">
                            {getAddressTypeLabel()}
                          </span>
                        </div>

                        <div>
                          <button
                            className="text-white bg-gradient-to-br from-[#321961] to-[#6f42c1] border-0 !font-semibold cursor-pointer !text-[11px] px-4 py-1.5 !rounded-[5px] shadow-[0_2px_4px_rgba(0,0,0,0.1)]"
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
                        <div className="p-4 bg-white text-sm text-[#475569] leading-relaxed flex-1">
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
                                <div className="text-slate-400 mt-1 text-[13px]">
                                  {selectedAddress.location.address}
                                </div>
                              )}
                            </div>
                          ) : (
                            selectedAddress?.address || ""
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-white text-sm text-slate-400 flex items-center gap-2 flex-1">
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

                  <div className="w-full md:col-span-7">
                    <div className="rounded-md overflow-hidden border border-[#e9ecef] shadow-[0_10px_25px_-5px_rgba(0,0,0,0.05),0_8px_10px_-6px_rgba(0,0,0,0.05)] bg-white h-full flex flex-col">
                      <div className="px-3 !py-1 ">
                        <h6 className="!text-sm !font-semibold !m-0 !text-slate-800 !uppercase">
                          ADDITIONAL INFORMATION
                        </h6>
                      </div>

                      <div className="px-4 pb-4 pt-3 flex-1">
                        <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-x-4 !gap-y-3.5">
                          <div className="!flex !flex-col !mb-1">
                            <label className="!text-[11px] !font-semibold !text-slate-500 !uppercase !tracking-wider !mb-1.5">
                              Start Date
                            </label>
                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              className="!w-full !py-1 !px-2.5 !border !border-slate-200 !rounded-sm !text-[13px] !text-slate-800 !bg-slate-50/55 focus:!border-[#321961] focus:!bg-white focus:!ring-1 focus:!ring-[#321961] !transition-all !outline-none"
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>

                          <div className="!flex !flex-col !mb-1">
                            <label className="!text-[11px] !font-semibold !text-slate-500 !uppercase !tracking-wider !mb-1.5">
                              Rental Plan
                            </label>
                            <select
                              value={rentalPlan}
                              onChange={(e) => setRentalPlan(e.target.value)}
                              className="!w-full !py-1 !px-2.5 !border !border-slate-200 !rounded-sm !text-[13px] !text-slate-800 !bg-slate-50/55 focus:!border-[#321961] focus:!bg-white focus:!ring-1 focus:!ring-[#321961] !transition-all !outline-none"
                            >
                              <option value="">Select Plan</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>

                          <div className="!flex !flex-col !mb-1">
                            <label className="!text-[11px] !font-semibold !text-slate-500 !uppercase !tracking-wider !mb-1.5">
                              Rental Duration{" "}
                              {rentalPlan &&
                                `(${rentalPlan.charAt(0).toUpperCase() + rentalPlan.slice(1)})`}
                            </label>
                            <select
                              value={rentalDuration}
                              onChange={(e) => setRentalDuration(e.target.value)}
                              className="!w-full !py-1 !px-2.5 !border !border-slate-200 !rounded-sm !text-[13px] !text-slate-800 !bg-slate-50/55 focus:!border-[#321961] focus:!bg-white focus:!ring-1 focus:!ring-[#321961] !transition-all !outline-none"
                            >
                              <option value="">Select duration</option>
                              {rentalPlan === "weekly" && (
                                <>
                                  <option value="1">1 week</option>
                                  <option value="2">2 weeks</option>
                                  <option value="3">3 weeks</option>
                                  <option value="4">4 weeks</option>
                                </>
                              )}
                              {rentalPlan === "monthly" && (
                                <>
                                  <option value="1">1 month</option>
                                  <option value="2">2 months</option>
                                  <option value="3">3 months</option>
                                  <option value="4">4 months</option>
                                  <option value="5">5 months</option>
                                  <option value="6">6 months</option>
                                  <option value="7">7 months</option>
                                  <option value="8">8 months</option>
                                  <option value="9">9 months</option>
                                  <option value="10">10 months</option>
                                  <option value="11">11 months</option>
                                  <option value="12">12 months</option>
                                </>
                              )}
                              {rentalPlan === "yearly" && (
                                <>
                                  <option value="1">1 year</option>
                                  <option value="2">2 years</option>
                                  <option value="3">3 years</option>
                                  <option value="4">4 years</option>
                                  <option value="5">5 years</option>
                                </>
                              )}
                            </select>
                          </div>

                          <div className="!flex !flex-col !mb-1">
                            <label className="!text-[11px] !font-semibold !text-slate-500 !uppercase !tracking-wider !mb-1.5">
                              Payment Type
                            </label>
                            <select
                              value={paymentType}
                              onChange={(e) => setPaymentType(e.target.value)}
                              className="!w-full !py-1 !px-2.5 !border !border-slate-200 !rounded-sm !text-[13px] !text-slate-800 !bg-slate-50/55 focus:!border-[#321961] focus:!bg-white focus:!ring-1 focus:!ring-[#321961] !transition-all !outline-none"
                            >
                              <option value="">Select Type</option>
                              <option value="onetimepayment">One Time Payment</option>
                              <option value="installment">Installment</option>
                            </select>
                          </div>

                          {paymentType !== "onetimepayment" && (
                            <div className="!flex !flex-col !mb-1 !col-span-1 md:!col-span-2">
                              <label className="!text-[11px] !font-semibold !text-slate-500 !uppercase !tracking-wider !mb-1.5">
                                No. of installments{" "}
                                {rentalPlan &&
                                  `(${rentalPlan.charAt(0).toUpperCase() + rentalPlan.slice(1)})`}
                              </label>
                              <select
                                value={numberOfInstallments}
                                onChange={(e) => setNumberOfInstallments(e.target.value)}
                                className="!w-full !py-1 !px-2.5 !border !border-slate-200 !rounded-sm !text-[13px] !text-slate-800 !bg-slate-50/55 focus:!border-[#321961] focus:!bg-white focus:!ring-1 focus:!ring-[#321961] !transition-all !outline-none"
                              >
                                <option value="">Select installments</option>
                                {calculatedTotalAmount > 0 &&
                                  rentalDuration &&
                                  Array.from(
                                    { length: parseInt(rentalDuration) },
                                    (_, i) => i + 1,
                                  ).map((num) => (
                                    <option key={num} value={num}>
                                      ₹{(calculatedTotalAmount / num).toFixed(2)} ({num} {num === 1 ? 'installment' : 'installments'})
                                    </option>
                                  ))}
                              </select>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Product Details Section */}
                <div className="!pb-6 !border-b !border-[#f1f5f9] mb-3 order-2 order-md-1">
                  <div className={`flex flex-wrap items-start ${isMobile ? "gap-3" : "gap-4"}`}>
                    <div className="relative shrink-0">
                      <div className={`${isMobile ? "w-20 h-20" : "w-[100px] h-[100px]"} rounded-lg overflow-hidden bg-[#f0f4ff] flex items-center justify-center border border-[#e0e0e0]`}>
                        <img
                          src={
                            resolveImage(data) ||
                            resolveImage(data?.tabletDetails) ||
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
                            <div className="flex flex-col gap-1">
                              <span className="text-base font-semibold text-black">
                                {data?.perDayRent ? (
                                  <>
                                    {data?.rentalPricing
                                      ?.calculatedTotalAmount > 0
                                      ? `Price per day: ₹${data.rentalPricing?.basePricePerDay.toFixed(2)}`
                                      : `Price per day: ₹${data.perDayRent.toFixed(2)}`}
                                  </>
                                ) : (
                                  <>
                                    {calculatedTotalAmount > 0
                                      ? `Price per day: ₹${perDayRent.toFixed(2)}`
                                      : `Total: ₹${perDayRent.toFixed(2)}`}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-row items-center justify-between gap-5 flex-wrap">
                        <div>
                          <ul className="list-none p-0 mt-0 mb-3">
                            {data?.tabletDetails?.form && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-capsules text-[#321961] text-xs"></i>
                                Form : {data?.tabletDetails?.form}
                              </li>
                            )}

                            {data?.tabletDetails?.strength && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-bolt text-[#321961] text-xs"></i>
                                Strength : {data?.tabletDetails?.strength}
                              </li>
                            )}

                            {data?.tabletDetails?.duration && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock text-[#321961] text-xs"></i>
                                Duration : {data?.tabletDetails?.duration}
                              </li>
                            )}

                            {data?.tabletDetails?.shiftType && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock text-[#321961] text-xs"></i>
                                Shift Type : {data?.tabletDetails?.shiftType}
                              </li>
                            )}

                            {data?.tabletDetails?.nursecareType && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock text-[#321961] text-xs"></i>
                                Type : {data?.tabletDetails?.nursecareType}
                              </li>
                            )}

                            {data?.tabletDetails?.gender && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-venus-mars text-[#321961] text-xs"></i>
                                Gender : {data?.tabletDetails?.gender}
                              </li>
                            )}

                            {data?.tabletDetails?.complexity && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-layer-group text-[#321961] text-xs"></i>
                                Complexity : {data?.tabletDetails?.complexity}
                              </li>
                            )}

                            {data?.tabletDetails?.model && (
                              <li className="text-[13px] text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-cube text-[#321961] text-xs"></i>
                                Model : {data?.tabletDetails?.model}
                              </li>
                            )}

                            {data?.tabletDetails?.condition && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-info-circle !text-[#321961] !text-xs"></i>
                                Condition : {data?.tabletDetails?.condition}
                              </li>
                            )}

                            {data?.tabletDetails?.machineType && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-cogs !text-[#321961] !text-xs"></i>
                                Machine Type : {data?.tabletDetails?.machineType}
                              </li>
                            )}

                            {data?.tabletDetails?.compositionDetails?.name && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-mortar-pestle !text-[#321961] !text-xs"></i>
                                Composition : {data?.tabletDetails?.compositionDetails?.name}
                              </li>
                            )}

                            {data?.tabletDetails?.reportsDuration && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-clock !text-[#321961] !text-xs"></i>
                                {data?.tabletDetails?.reportsDuration.slice(
                                  0,

                                  40,
                                ) ||
                                  data?.reportsDuration ||
                                  "24"}
                              </li>
                            )}

                            {testsCount && (
                              <li className="!text-[13px] !text-gray-600 mb-1.5 flex items-center gap-2">
                                <i className="fas fa-vial !text-[#321961] !text-xs"></i>
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

              {/* Row 3: Related Vendors Section */}
              {(relatedProducts && relatedProducts.length > 0) && (
                <div className="card shadow-sm border-none bg-white relative rounded-xl p-4 md:p-6 mt-2">
                  <h6 className="!text-sm !font-semibold !m-0 !text-slate-800 !mb-4 !uppercase">
                    RELATED VENDORS
                  </h6>
                  <div className="!grid !grid-cols-2 md:!grid-cols-4 !gap-4">
                    {relatedProducts.map((product, index) => (
                      <div key={index} className="!w-full">
                        <div className="card rounded-lg border border-gray-100 overflow-hidden h-full flex flex-col justify-between">
                          <div className="h-[150px] bg-gray-50 flex items-center justify-center p-2.5">
                            <img
                              src={getImageUrl(
                                product?.businessDetails?.bussiness_image?.[0]
                                  ?.url ||
                                product?.tabletDetails?.files?.[0] ||
                                "",
                              )}
                              alt={product?.tabletDetails?.name || "Product"}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <div className="card-body p-3 flex-1 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center mb-2 gap-2">
                                <div className="text-sm font-bold line-clamp-1">
                                  {product?.businessDetails?.name}
                                </div>
                              </div>

                              {product?.vendorRating && (
                                <div className="flex items-center gap-1 mb-2 text-xs">
                                  <div className="flex gap-[1px]">
                                    <i className="fas fa-star text-orange-400 text-[10px]" />
                                  </div>
                                  <span className="text-gray-600">
                                    {product.vendorRating.averageRating?.toFixed(
                                      1,
                                    ) || "0.0"}
                                  </span>
                                  <span className="text-gray-400">
                                    ({product.vendorRating.totalRatings.toFixed(0) || 0})
                                  </span>
                                </div>
                              )}

                              {product?.perDayRent && (
                                <div className="flex justify-between mb-2 text-xs">
                                  <span className="text-gray-600">
                                    Daily Rate
                                  </span>
                                  <span className="font-semibold text-black">
                                    ₹{product.perDayRent.toFixed(2)}
                                  </span>
                                </div>
                              )}
                            </div>

                            <button
                              className="btn btn-primary btn-sm w-full text-white bg-[#321961] border-0 hover:bg-[#6f42c1] !rounded-sm py-1.5 px-3 text-xs mt-2"
                              onClick={() => {
                                handleRentRelatedProduct(product);
                                window.scrollTo({
                                  top: 0,
                                  behavior: "smooth",
                                });
                              }}
                              disabled={!product?.perDayRent}
                              style={{
                                opacity: product?.perDayRent ? 1 : 0.6,
                                cursor: product?.perDayRent
                                  ? "pointer"
                                  : "not-allowed",
                              }}
                            >
                              Rent
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className={`${isMobile ? "relative top-0" : "sticky top-5 flex flex-col gap-6"}`}>
                <div className="card shadow-sm mb-4 rounded-xl border-0 !bg-white">
                  <div className="card-body !p-4 !flex !flex-col !gap-4">

                    {/* Cart Breakdown Section */}
                    <div>
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
                                  : "!bg-gradient-to-r !from-[#fbf9ff] !to-[#ffffff] !border-[#e2d5f8] hover:!border-[#321961]"
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
                                    : "!bg-gradient-to-br !from-[#321961] !to-[#6d28d9]"
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
                                  className="!flex-1 !min-w-0 !border !border-slate-200 !rounded-l-xl !py-2 !px-3 !text-[12.5px] !outline-none !transition-colors !duration-200 focus:!border-[#321961] !bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleManualCouponApply();
                                  }}
                                  className="!bg-[#321961] !text-white !border-0 !rounded-r-xl !py-2 !px-4 !text-[12.5px] !font-semibold !cursor-pointer !transition-colors !duration-200 hover:!bg-[#6f42c1] !shrink-0"
                                >
                                  Apply
                                </button>
                              </div>
                            </div>

                            {data?.rentalPricing?.endDate && (
                              <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                                <span className="!text-slate-500">End Date</span>
                                <span className="!font-semibold !text-slate-800">
                                  {new Date(data.rentalPricing.endDate).toLocaleDateString("en-IN", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                            )}

                            <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                              <span className="!text-slate-500">Daily Rate</span>
                              <span className="!font-semibold !text-slate-800">
                                ₹{(data?.perDayRent || perDayRent).toFixed(2)} ×{" "}
                                {rentalDuration
                                  ? rentalPlan === "weekly"
                                    ? `${rentalDuration} weeks`
                                    : rentalPlan === "monthly"
                                      ? `${rentalDuration} months`
                                      : rentalPlan === "yearly"
                                        ? `${rentalDuration} years`
                                        : `${rentalDuration} periods`
                                  : "0 periods"}
                              </span>
                            </div>

                            <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                              <span className="!text-slate-500">
                                Sub-total<small> (Rental Charges)</small>
                              </span>
                              <span className="!font-semibold !text-slate-800">
                                ₹{rentalSubtotal.toFixed(2)}
                              </span>
                            </div>

                            {serviceCharges > 0 && (
                              <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                                <span className="!text-slate-500">Delivery Charges</span>
                                <span className="!font-semibold !text-slate-800">
                                  ₹{serviceCharges.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {returnCharge > 0 && (
                              <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                                <span className="!text-slate-500">Return Charge</span>
                                <span className="!font-semibold !text-slate-800">
                                  ₹{returnCharge.toFixed(2)}
                                </span>
                              </div>
                            )}

                            {fixedDeposit > 0 && (
                              <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                                <span className="!text-slate-500">Deposit (Refundable)</span>
                                <span className="!font-semibold !text-slate-800">
                                  ₹{fixedDeposit.toFixed(2)}
                                </span>
                              </div>
                            )}

                            <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                              <span className="!text-slate-500">GST</span>
                              <span className="!font-semibold !text-slate-800">
                                ₹{(tax || 0).toFixed(2)}
                              </span>
                            </div>

                            {data?.rentalPricing?.totalAmount && (
                              <div className="!flex !justify-between !mb-2 !text-[12.5px]">
                                <span className="!text-slate-500">Total Amount</span>
                                <span className="!font-semibold !text-slate-800">
                                  ₹{data.rentalPricing.totalAmount.toFixed(2)}
                                </span>
                              </div>
                            )}

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

                          <div className="!flex !justify-between !items-center !mb-1.5">
                            <span className="!text-[13.5px] !font-semibold !text-slate-800">
                              Amount to Pay
                            </span>
                            <span className="!text-base !font-semibold !text-[#321961]">
                              ₹{amountToPay.toFixed(2)}
                            </span>
                          </div>

                          {paymentType === "installment" &&
                            numberOfInstallments &&
                            numberOfInstallments > 1 &&
                            installmentAmount > 0 && (
                              <div className="!mt-1.5">
                                <div className="!flex !justify-between !items-center !p-2.5 !bg-slate-50 !rounded-lg !border !border-slate-100">
                                  <div>
                                    <span className="!text-[12px] !font-semibold !text-slate-600 !block">
                                      {numberOfInstallments} Installments
                                    </span>
                                    <span className="!text-[10px] !text-slate-400 !block !mt-0.5">
                                      {getInstallmentFrequencyText()}
                                    </span>
                                  </div>
                                  <span className="!text-sm !font-semibold !text-[#321961]">
                                    ₹{installmentAmount.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            )}

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

                    {/* Submit Section */}
                    <div className="!pt-4 !border-t !border-[#f1f5f9]">
                      <form onSubmit={(e) => handleSubmit(e)}>
                        <input
                          type="hidden"
                          name="paymentMethod"
                          value={paymentMethod}
                        />
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className={`!w-full !text-white !rounded-xl !border-0 !py-2.5 !px-4 !mb-3 !transition-all !duration-300 !flex !items-center !justify-center !gap-2 !font-semibold !text-xs ${isSubmitting ? "!bg-gray-400 !cursor-not-allowed" : "!bg-gradient-to-r !from-[#321961] !to-[#822BD4] hover:!shadow-md active:!scale-[0.98] !cursor-pointer"}`}
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


          </div>
        </div>
      </div>

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
        <BaseModal
          show={showOffersModal}
          onClose={() => setShowOffersModal(false)}
          title={"Apply Coupon"}
          size="lg"
          className="max-w-md mx-auto"
          bodyClassName="!p-2"
        >

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
                const baseAmount = isVendorCoupon ? rentalSubtotal : (totalPayAmount || totalAmount || total);

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
          })()}

        </BaseModal>
      )}

      <Footer />
    </div>
  );
};

export default RentalBookingProcess;
