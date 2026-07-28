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
import "./bookingprocess.css";
import { openRazorpayCheckout } from "../../../utils/razorpayUtils";
import { useResponsive } from "../../../hooks";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import { useProfile } from "../../../context/ProfileContext";
import { useLocation } from "../../../context/LocationContext";
import LeadModal from "./products-components/LeadModal.jsx";

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

      openRazorpayCheckout({
        razorpayData,
        description: "Rental Order Payment",
        prefill: {
          name: selectedAddress?.name || userProfile?.first_name || "Customer",
          contact: selectedAddress?.phone || userProfile?.mobile || "",
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

  const renderRecentlyViewed = () => {
    if (!(relevantProducts?.length > 0)) return null;
    return (
      <div
        className="card shadow-sm mb-3"
        style={{
          borderRadius: "12px",
          border: "none",
          backgroundImage: "url('/assets/Medicompares Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="card-body" style={{ padding: "20px" }}>
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-start",
              gap: "12px",
              alignItems: "center",
              marginBottom: "16px",
              borderLeft: "4px solid #8059ca",
              paddingLeft: "12px",
              lineHeight: "1",
            }}
          >
            <div style={{ fontSize: "20px", fontWeight: 500, color: "#0f172a", margin: 0 }}>
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
                letterSpacing: "0.5px",
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

          {/* Carousel */}
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            {/* Left Scroll */}
            <button
              className="meq-arrow-btn dental-prev"
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) container.scrollLeft -= 250;
              }}
              style={{
                left: "-15px",
                display: "flex",
              }}
            >
              <i className="fas fa-chevron-left"></i>
            </button>

            {/* Cards */}
            <div
              id="productCarousel"
              className="scroll-container"
              style={{
                display: "flex",
                overflowX: "auto",
                gap: "20px",
                padding: "20px 60px",
                scrollBehavior: "smooth",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
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
                    style={{
                      minWidth: "220px",
                      maxWidth: "220px",
                      background: "#ffffff",
                      borderRadius: "12px",
                      border: "1px solid #f1f5f9",
                      boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      flexShrink: 0,
                      transition: "all 0.3s ease",
                      position: "relative",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-3px)";
                      e.currentTarget.style.borderColor = "#8059ca";
                      e.currentTarget.style.boxShadow = "0 8px 24px rgba(128, 89, 202, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.borderColor = "#f1f5f9";
                      e.currentTarget.style.boxShadow = "0 4px 20px rgba(0, 0, 0, 0.08)";
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

                    {/* Image */}
                    <div
                      style={{
                        width: "100%",
                        height: "130px",
                        background: "#f8f4ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "12px",
                        cursor: "pointer",
                      }}
                      onClick={() => handleProductClick(product)}
                    >
                      <img
                        src={getImageUrl(productImage)}
                        alt="product"
                        style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                      />
                    </div>

                    {/* Details */}
                    <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px", flex: 1 }}>
                      {/* Name */}
                      <div style={{ cursor: "pointer" }} onClick={() => handleProductClick(product)}>
                        <h4
                          style={{
                            fontSize: "13px",
                            fontWeight: "500",
                            color: "#0f172a",
                            margin: 0,
                            lineHeight: "1.3",
                            textTransform: "capitalize",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                            height: "34px",
                          }}
                        >
                          {product?.tabletDetails?.name}
                        </h4>
                      </div>

                      {/* Seller & Rating */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "6px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0, flex: 1 }}>
                          <img
                            src={getImageUrl(vendorImage)}
                            alt={vendorName}
                            style={{ width: "24px", height: "24px", borderRadius: "50%", objectFit: "cover", background: "#f1f5f9", flexShrink: 0 }}
                            onError={(e) => { e.target.src = "/assets/img/logo.png"; }}
                          />
                          <span
                            style={{ fontSize: "12.5px", fontWeight: "600", color: "#334155", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}
                            title={vendorName}
                          >
                            {vendorName}
                          </span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
                          <span style={{ fontSize: "11px", color: "#fbbf24" }}>★</span>
                          <span style={{ fontSize: "11px", fontWeight: "600", color: "#475569" }}>
                            {product.tabletDetails?.averageRating ? product.tabletDetails.averageRating.toFixed(1) : "0.0"}
                          </span>
                        </div>
                      </div>

                      {/* Price */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "1px" }}>
                        <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "15px", fontWeight: "700", color: "#0f172a" }}>
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
              className="meq-arrow-btn dental-next"
              onClick={() => {
                const container = document.getElementById("productCarousel");
                if (container) container.scrollLeft += 250;
              }}
              style={{
                right: "-15px",
                display: "flex",
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
    <div className="main-wrapper ">
      <Home2Header />

      <CategoryProvider />

      <div className="booking-process-wrapper mt-2">
        <div className="container-fluid px-2 px-md-3 px-lg-5">
          <nav aria-label="breadcrumb" className="mb-3 mb-md-4 mt-2 mt-md-3">
            <ol className="breadcrumb mb-0" style={{ fontSize: "14px" }}>
              <li className="breadcrumb-item">
                <Link to="/" className="text-decoration-none text-muted">
                  Home
                </Link>
              </li>

              <li className="breadcrumb-item active" aria-current="page">
                Booking
              </li>
            </ol>
          </nav>

          <div className="row g-3 g-md-4">
            <div className="col-lg-8 col-md-12 order-1 order-lg-1 d-flex flex-column">
              <div className="row order-lg-2">
                <div className="col-md-6 col-12">
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
                          <span
                            style={{ fontSize: isMobile ? "12px" : "13px" }}
                          >
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
                  <div style={{ marginBottom: "24px" }}>
                    <div
                      style={{
                        borderRadius: "10px",
                        overflow: "hidden",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        border: "1px solid #e0e0e0",
                        backgroundColor: "#fff",
                      }}
                    >
                      <div
                        style={{
                          padding: "16px",

                          borderBottom: "1px solid #e0e0e0",
                        }}
                      >
                        <h6
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000",
                          }}
                        >
                          Additional Information
                        </h6>
                      </div>

                      <div style={{ padding: "16px" }}>
                        <div className="row">
                          <div className="col-md-6 col-12 mb-2">
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "4px",
                                display: "block",
                              }}
                            >
                              Start Date
                            </label>

                            <input
                              type="date"
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                boxSizing: "border-box",
                              }}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>

                          <div className="col-md-6 col-12">
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "6px",
                                display: "block",
                              }}
                            >
                              Rental Plan
                            </label>

                            <select
                              value={rentalPlan}
                              onChange={(e) => setRentalPlan(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                              }}
                            >
                              <option value="">Select Plan</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>

                          <div className="col-md-6 col-12">
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "6px",
                                display: "block",
                              }}
                            >
                              Rental Duration{" "}
                              {rentalPlan &&
                                `(${rentalPlan.charAt(0).toUpperCase() + rentalPlan.slice(1)})`}
                            </label>

                            <select
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                backgroundColor: "#fff",
                              }}
                              value={rentalDuration}
                              onChange={(e) =>
                                setRentalDuration(e.target.value)
                              }
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

                          <div className="col-md-6 col-12">
                            <label
                              style={{
                                fontSize: "12px",
                                fontWeight: "500",
                                color: "#6b7280",
                                marginBottom: "6px",
                                display: "block",
                              }}
                            >
                              Payment Type
                            </label>

                            <select
                              value={paymentType}
                              onChange={(e) => {
                                setPaymentType(e.target.value);
                              }}
                              style={{
                                width: "100%",
                                padding: "8px 12px",
                                border: "1px solid #e5e7eb",
                                borderRadius: "6px",
                                fontSize: "14px",
                                outline: "none",
                                backgroundColor: "#fff",
                              }}
                            >
                              <option value="">Select Type</option>

                              <option value="onetimepayment">
                                One Time Payment
                              </option>

                              <option value="installment">Installment</option>
                            </select>
                          </div>

                          <div className="col-md-6 col-12">
                            {paymentType !== "onetimepayment" && (
                              <>
                                <label
                                  style={{
                                    fontSize: "12px",
                                    fontWeight: "500",
                                    color: "#6b7280",
                                    margin: "6px",
                                    display: "block",
                                  }}
                                >
                                  No. of installments{" "}
                                  {rentalPlan &&
                                    `(${rentalPlan.charAt(0).toUpperCase() + rentalPlan.slice(1)})`}
                                </label>

                                <select
                                  style={{
                                    width: "100%",
                                    padding: "8px 12px",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: "6px",
                                    fontSize: "14px",
                                    outline: "none",
                                  }}
                                  value={numberOfInstallments}
                                  onChange={(e) =>
                                    setNumberOfInstallments(e.target.value)
                                  }
                                >
                                  <option value="">Select installments</option>

                                  {calculatedTotalAmount > 0 &&
                                    rentalDuration &&
                                    Array.from(
                                      { length: parseInt(rentalDuration) },
                                      (_, i) => i + 1,
                                    ).map((num) => (
                                      <option key={num} value={num}>
                                        ₹
                                        {(calculatedTotalAmount / num).toFixed(
                                          2,
                                        )}{" "}
                                        ({num} installment)
                                      </option>
                                    ))}
                                </select>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="card shadow-sm mb-3 order-lg-2"
                style={{
                  borderRadius: "12px",
                  border: "none",
                }}
              >
                <div className="card-body p-3 p-md-4">
                  <div
                    className="d-flex"
                    style={{
                      gap: isMobile ? "12px" : "16px",
                      flexWrap: "wrap",
                      alignItems: "flex-start",
                    }}
                  >
                    <div style={{ position: "relative", flexShrink: 0 }}>
                      <div
                        style={{
                          width: isMobile ? "80px" : "100px",
                          height: isMobile ? "80px" : "100px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          backgroundColor: "#f0f4ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          border: "1px solid #e0e0e0",
                        }}
                      >
                        <img
                          src={
                            resolveImage(data) ||
                            resolveImage(data?.tabletDetails) ||
                            resolveImage(data?.currentVariation) ||
                            "/assets/img/doctors/labtest (3).svg"
                          }
                          alt={productName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                          }}
                          onError={(e) => {
                            e.target.src =
                              "/assets/img/doctors/labtest (3).svg";
                          }}
                        />
                      </div>
                    </div>

                    <div
                      style={{
                        flex: "1 1 auto",
                        minWidth: isMobile ? "0" : "200px",
                        width: isMobile ? "100%" : "auto",
                      }}
                    >
                      <div
                        className={`d-flex ${isMobile ? "flex-column" : "align-items-start"
                          } w-100`}
                      >
                        <div
                          className="d-flex flex-column"
                          style={{ width: isMobile ? "100%" : "auto" }}
                        >
                          <h6
                            style={{
                              fontSize: isMobile ? "14px" : "16px",
                              fontWeight: "600",
                              marginBottom: isMobile ? "8px" : "12px",
                              color: "#000",
                              textTransform: "capitalize",
                            }}
                          >
                            {productName}
                          </h6>
                        </div>

                        <div
                          style={{
                            marginLeft: isMobile ? "0" : "auto",
                            marginTop: isMobile ? "12px" : "0",
                            width: isMobile ? "100%" : "auto",
                          }}
                        >
                          <div
                            className="d-flex align-items-center"
                            style={{
                              gap: isMobile ? "8px" : "12px",
                              flexWrap: "wrap",
                              marginBottom: isMobile ? "12px" : "0px",
                            }}
                          >
                            {/* {discountPrice && mrpPrice > pricePerItem ? (

                                <>

                                  <span

                                    style={{

                                      fontSize: "20px",

                                      fontWeight: "700",

                                      color: "#000",

                                    }}

                                  >

                                    ₹{pricePerItem.toFixed(2)}

                                  </span>

                                  <span

                                    style={{

                                      fontSize: "16px",

                                      color: "#999",

                                      textDecoration: "line-through",

                                    }}

                                  >

                                    ₹{mrpPrice.toFixed(2)}

                                  </span>



                                  {discountPercent > 0 && (

                                    <span

                                      className="badge"

                                      style={{

                                        backgroundColor: "#28a745",

                                        color: "#fff",

                                        fontSize: "12px",

                                        padding: "4px 8px",

                                        borderRadius: "4px",

                                      }}

                                    >

                                      {discountPercent}% OFF

                                    </span>

                                  )}

                                </>

                              ) : (

                                <span

                                  style={{

                                    fontSize: "20px",

                                    fontWeight: "700",

                                    color: "#000",

                                  }}

                                >

                                  ₹{pricePerItem.toFixed(2)}

                                </span>

                              )} */}

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: "16px",
                                  fontWeight: "600",
                                  color: "black",
                                }}
                              >
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

                      <div
                        style={{
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "20px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div>
                          {/* {['surgeries', 'diagnosis'].} */}

                          <ul
                            style={{
                              listStyle: "none",
                              padding: 0,
                              margin: "0 0 12px 0",
                            }}
                          >
                            {data?.tabletDetails?.form && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#0c0b0bff",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-capsules"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Form : {data?.tabletDetails?.form}
                              </li>
                            )}

                            {data?.tabletDetails?.strength && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-bolt"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Strength : {data?.tabletDetails?.strength}
                              </li>
                            )}

                            {data?.tabletDetails?.duration && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-clock"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Duration : {data?.tabletDetails?.duration}
                              </li>
                            )}

                            {data?.tabletDetails?.shiftType && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-clock"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Shift Type : {data?.tabletDetails?.shiftType}
                              </li>
                            )}

                            {data?.tabletDetails?.nursecareType && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-clock"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Type : {data?.tabletDetails?.nursecareType}
                              </li>
                            )}

                            {data?.tabletDetails?.gender && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-venus-mars"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Gender : {data?.tabletDetails?.gender}
                              </li>
                            )}

                            {data?.tabletDetails?.complexity && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-layer-group"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Complexity : {data?.tabletDetails?.complexity}
                              </li>
                            )}

                            {data?.tabletDetails?.model && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-cube"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Model : {data?.tabletDetails?.model}
                              </li>
                            )}

                            {data?.tabletDetails?.condition && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-info-circle"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Condition : {data?.tabletDetails?.condition}
                              </li>
                            )}

                            {data?.tabletDetails?.machineType && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-cogs"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Machine Type :{" "}
                                {data?.tabletDetails?.machineType}
                              </li>
                            )}

                            {data?.tabletDetails?.compositionDetails?.name && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-mortar-pestle"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Composition :{" "}
                                {data?.tabletDetails?.compositionDetails?.name}
                              </li>
                            )}

                            {data?.tabletDetails?.reportsDuration && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-clock"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>

                                {data?.tabletDetails?.reportsDuration.slice(
                                  0,

                                  40,
                                ) ||
                                  data?.reportsDuration ||
                                  "24"}
                              </li>
                            )}

                            {testsCount && (
                              <li
                                style={{
                                  fontSize: "13px",
                                  color: "#666",
                                  marginBottom: "6px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                }}
                              >
                                <i
                                  className="fas fa-vial"
                                  style={{
                                    color: "#8059ca",
                                    fontSize: "12px",
                                  }}
                                ></i>
                                Includes {testsCount} parameters
                              </li>
                            )}
                          </ul>

                          <div
                            style={{
                              display: "flex",
                              gap: "20px",
                              flexWrap: "wrap",
                            }}
                          >
                            <a
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();

                                navigate(-1);
                              }}
                              style={{
                                fontSize: "13px",
                                color: "#dc3545",
                                textDecoration: "none",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                              }}
                            >
                              <i
                                className="fas fa-trash-alt"
                                style={{ fontSize: "12px" }}
                              ></i>
                              Delete
                            </a>
                          </div>
                        </div>

                        {(data?.businessDetails ||
                          data?.vendorDetails?.businessDetails) && (
                            <div
                              style={{
                                padding: "10px",
                                background: "#f8f9fa",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                border: "1px solid #eee",
                              }}
                            >
                              <img
                                src={getImageUrl(
                                  data?.businessDetails?.bussiness_image?.url ||
                                  data?.vendorDetails?.businessDetails
                                    ?.bussiness_image?.url ||
                                  "",
                                )}
                                alt="business"
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "6px",
                                  objectFit: "cover",
                                }}
                              />

                              <div>
                                <div
                                  style={{
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    color: "#111",
                                  }}
                                >
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

              {(relatedProducts && relatedProducts.length > 0 && !isMobile) && (
                <div
                  className="card shadow-sm order-lg-2"
                  style={{
                    borderRadius: "12px",
                    border: "none",
                  }}
                >
                  <div className="card-body p-3 p-md-4">
                    <h5
                      style={{
                        fontSize: "18px",
                        fontWeight: "600",
                        marginBottom: "16px",
                        color: "#333",
                      }}
                    >
                      Related Vendors
                    </h5>
                    <div className="row">
                      {relatedProducts.map((product, index) => (
                        <div key={index} className="col-md-6 col-lg-3">
                          <div
                            className="card"
                            style={{
                              borderRadius: "8px",
                              border: "1px solid #eee",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                height: "150px",
                                background: "#f8f9fa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "10px",
                              }}
                            >
                              <img
                                src={getImageUrl(
                                  product?.businessDetails?.bussiness_image?.[0]
                                    ?.url ||
                                  product?.tabletDetails?.files?.[0] ||
                                  "",
                                )}
                                alt={product?.tabletDetails?.name || "Product"}
                                style={{
                                  maxWidth: "100%",
                                  maxHeight: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            </div>
                            <div className="card-body p-3">
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  marginBottom: "8px",
                                  gap: "8px",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {product?.businessDetails?.name}
                                </div>
                              </div>

                              {product?.vendorRating && (
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                    marginBottom: "8px",
                                    fontSize: "12px",
                                  }}
                                >
                                  <div style={{ display: "flex", gap: "1px" }}>
                                    <i
                                      className="fas fa-star"
                                      style={{
                                        color: "#ffa500",
                                        fontSize: "10px",
                                      }}
                                    />
                                  </div>
                                  <span style={{ color: "#666" }}>
                                    {product.vendorRating.averageRating?.toFixed(
                                      1,
                                    ) || "0.0"}
                                  </span>
                                  <span style={{ color: "#999" }}>
                                    (
                                    {product.vendorRating.totalRatings.toFixed(
                                      1,
                                    ) || 0}{" "}
                                    reviews)
                                  </span>
                                </div>
                              )}

                              {product?.perDayRent && (
                                <div
                                  style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    marginBottom: "8px",
                                    fontSize: "12px",
                                  }}
                                >
                                  <span style={{ color: "#666" }}>
                                    Daily Rate
                                  </span>
                                  <span
                                    style={{ fontWeight: "600", color: "#000" }}
                                  >
                                    ₹{product.perDayRent.toFixed(2)}
                                  </span>
                                </div>
                              )}

                              <button
                                className="btn btn-primary btn-sm w-100"
                                onClick={() => {
                                  handleRentRelatedProduct(product);
                                  window.scrollTo({
                                    top: 0,
                                    behavior: "smooth",
                                  });
                                }}
                                disabled={!product?.perDayRent}
                                style={{
                                  fontSize: "13px",
                                  padding: "6px 12px",
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
                </div>
              )}

              {!isMobile && productData?.length > 0 && (
                <div className="mt-4 order-lg-last">
                  {renderRecentlyViewed()}
                </div>
              )}
            </div>

            <div className="col-lg-4 col-md-12 order-2 order-lg-2">
              <div
                style={{
                  position: isMobile ? "relative" : "sticky",
                  top: isMobile ? "0" : "20px",
                }}
              >
                <div
                  className="card shadow-sm mb-3"
                  style={{
                    borderRadius: "12px",
                    border: "none",
                  }}
                >
                  <div className="card-body p-0">
                    <div
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid #e0e0e0",
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setIsTotalFareExpanded(!isTotalFareExpanded)
                      }
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <h6
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            margin: 0,
                            color: "#000",
                          }}
                        >
                          CART BREAKDOWN
                        </h6>

                        <i
                          className={`fas fa-chevron-${isTotalFareExpanded ? "up" : "down"
                            }`}
                          style={{ color: "#666", fontSize: "12px" }}
                        ></i>
                      </div>
                    </div>

                    {isTotalFareExpanded && (
                      <div style={{ padding: "16px" }}>
                        <div
                          style={{
                            marginBottom: "16px",
                            paddingBottom: "16px",
                            borderBottom: "1px solid #e0e0e0",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "600",
                              marginBottom: "12px",
                              color: "#000",
                            }}
                          >
                            Booking Summary
                          </div>

                          {/* OFFERS & COUPONS */}

                          <div
                            style={{
                              marginBottom: "16px",
                            }}
                          >
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

                              <div style={{ flex: 1 }}>
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

                                <div
                                  style={{
                                    fontSize: "12px",
                                    color: "#047857",
                                  }}
                                >
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
                                        Applied:{" "}
                                        {appliedCoupon.code ||
                                          appliedCoupon.name}
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

                          {data?.rentalPricing?.endDate && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
                              }}
                            >
                              <span style={{ color: "#666" }}>End Date</span>

                              <span
                                style={{ fontWeight: "600", color: "#000" }}
                              >
                                {new Date(
                                  data.rentalPricing.endDate,
                                ).toLocaleDateString("en-IN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                })}
                              </span>
                            </div>
                          )}

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <span style={{ color: "#666" }}>Daily Rate</span>

                            <span style={{ fontWeight: "600", color: "#000" }}>
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

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <span style={{ color: "#666" }}>
                              Sub-total<small> (Rental Charges)</small>
                            </span>

                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{rentalSubtotal.toFixed(2)}
                            </span>
                          </div>

                          {serviceCharges > 0 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
                              }}
                            >
                              <span style={{ color: "#666" }}>
                                Delivery Charges
                              </span>

                              <span
                                style={{ fontWeight: "600", color: "#000" }}
                              >
                                ₹{serviceCharges.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {returnCharge > 0 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
                              }}
                            >
                              <span style={{ color: "#666" }}>
                                Return Charge
                              </span>

                              <span
                                style={{ fontWeight: "600", color: "#000" }}
                              >
                                ₹{returnCharge.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {fixedDeposit > 0 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
                              }}
                            >
                              <span style={{ color: "#666" }}>
                                Deposit (Refundable)
                              </span>

                              <span
                                style={{ fontWeight: "600", color: "#000" }}
                              >
                                ₹{fixedDeposit.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {/* <div
                            style={{
                              display: "flex",

                              justifyContent: "space-between",

                              marginBottom: "8px",

                              fontSize: "13px",
                            }}
                          >
                            <span style={{ color: "#666" }}>CGST (4%)</span>

                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{cgst.toFixed(2)}
                            </span>
                          </div> */}

                          {/* <div
                            style={{
                              display: "flex",

                              justifyContent: "space-between",

                              marginBottom: "8px",

                              fontSize: "13px",
                            }}
                          >
                            <span style={{ color: "#666" }}>SGST (14%)</span>

                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{sgst.toFixed(2)}
                            </span>
                          </div> */}


                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <span style={{ color: "#666" }}>GST</span>

                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{(tax || 0).toFixed(2)}
                            </span>
                          </div>

                          {data?.rentalPricing?.totalAmount && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
                              }}
                            >
                              <span style={{ color: "#666" }}>
                                Total Amount
                              </span>

                              <span
                                style={{ fontWeight: "600", color: "#000" }}
                              >
                                ₹{data.rentalPricing.totalAmount.toFixed(2)}
                              </span>
                            </div>
                          )}

                          {couponDiscount > 0 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
                                color: '#16a34a'
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
                        </div>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                          }}
                        >
                          <div>
                            <span
                              style={{
                                fontSize: "16px",
                                fontWeight: "700",
                                color: "#000",
                                display: "block",
                              }}
                            >
                              Amount to Pay
                            </span>
                          </div>

                          <div style={{ textAlign: "right" }}>
                            <span
                              style={{
                                fontSize: "18px",
                                fontWeight: "700",
                                color: "#000",
                                display: "block",
                              }}
                            >
                              ₹{amountToPay.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {paymentType === "installment" &&
                          numberOfInstallments &&
                          numberOfInstallments > 1 &&
                          installmentAmount > 0 && (
                            <div style={{ marginTop: "12px" }}>
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  padding: "8px 0",
                                  borderTop: "1px solid #e5e7eb",
                                  backgroundColor: "#f8f9fa",
                                  borderRadius: "6px",
                                }}
                              >
                                <div>
                                  <span
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      color: "#666",
                                      display: "block",
                                    }}
                                  >
                                    {numberOfInstallments} Installments
                                  </span>

                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "#999",
                                      display: "block",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {getInstallmentFrequencyText()}
                                  </span>
                                </div>

                                <span
                                  style={{
                                    fontSize: "16px",
                                    fontWeight: "700",
                                    color: "#007bff",
                                  }}
                                >
                                  ₹{installmentAmount.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          )}

                        {appliedCoupon && couponDiscount > 0 && (
                          <div
                            style={{
                              backgroundColor: "#ECFDF5",
                              borderRadius: "8px",
                              padding: "12px",
                              textAlign: "center",
                              marginBottom: "16px",
                              border: "1px solid #D1FAE5",
                            }}
                          >
                            <div
                              style={{
                                fontSize: "13px",
                                fontWeight: "600",
                                color: "#166534",
                              }}
                            >
                              YOU SAVED A TOTAL OF ₹{couponDiscount.toFixed(2)}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className="card shadow-sm mb-4"
                  style={{
                    borderRadius: "12px",
                    border: "none",
                  }}
                >
                  <div className="card-body p-3">
                    <form onSubmit={(e) => handleSubmit(e)}>
                      <input
                        type="hidden"
                        name="paymentMethod"
                        value={paymentMethod}
                      />

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          width: "100%",
                          backgroundColor: isSubmitting ? "#9ca3af" : "#8059ca",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "12px",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                          marginBottom: "12px",
                          transition: "all 0.3s ease",
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
                              <span className="visually-hidden">
                                Loading...
                              </span>
                            </div>
                            Processing...
                          </>
                        ) : (
                          "PROCEED TO PAY"
                        )}
                      </button>
                    </form>

                    <div
                      style={{
                        display: "flex",
                        gap: "16px",
                        justifyContent: "center",
                        flexWrap: "wrap",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11px",
                          color: "#666",
                        }}
                      >
                        <i
                          className="fas fa-check-circle"
                          style={{ color: "#28a745", fontSize: "14px" }}
                        ></i>

                        <span>Health satisfaction guarantee</span>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11px",
                          color: "#666",
                        }}
                      >
                        <i
                          className="fas fa-shield-alt"
                          style={{ color: "#007bff", fontSize: "14px" }}
                        ></i>

                        <span>Secure Payments</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {isMobile && productData?.length > 0 && (
              <div className="col-lg-12 col-md-12 order-3">
                {renderRecentlyViewed()}
              </div>
            )}
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
                  <div className="offers-modal-body" style={{ padding: "20px", background: "#f8fafc" }}>
                    <div className="offers-list" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
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
                            const vendorIdStr = String(ele.createdBy || ele.businessDetails?._id || "");
                            const vendorItems = cartItems.filter(item => String(item.vendorId) === vendorIdStr);
                            applicableAmount = vendorItems.reduce((sum, item) => {
                              const price = getEffectivePrice(item);
                              return sum + (price * (parseInt(item.quantity) || 1));
                            }, 0);

                            if (hasExpired) {
                              isEligible = false;
                            } else if (rentalSubtotal < ele.minimumPurchase) {
                              isEligible = false;
                              const diff = (ele.minimumPurchase - rentalSubtotal).toFixed(2);
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
                            } else if (rentalSubtotal < ele.minimumPurchase) {
                              isEligible = false;
                              const diff = (ele.minimumPurchase - rentalSubtotal).toFixed(2);
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
                            ? calculateCouponDiscount(ele, rentalSubtotal)
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
                                <h5
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "700",
                                    color: "#1e293b",
                                    margin: 0,
                                  }}
                                >
                                  {ele.name}
                                </h5>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: "6px",
                                    alignItems: "center",
                                  }}
                                >
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

                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "8px",
                                    fontSize: "10px",
                                    color: "#64748b",
                                  }}
                                >
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
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: "#dc2626",
                                      fontWeight: "600",
                                    }}
                                  >
                                    ⚠️ {criteriaText}
                                  </span>
                                )}
                              </div>

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
                          return coupons.map((ele, ind) =>
                            renderCouponCard(ele, ind, isVendorCoupon),
                          );
                        };

                        if (sortedVendorCoupons.length === 0 && sortedAdminCoupons.length === 0) {
                          return (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "40px 20px",
                                textAlign: "center",
                                color: "#94a3b8",
                              }}
                            >
                              <div style={{ fontSize: "32px", marginBottom: "12px", color: "#cbd5e1" }}>
                                🎟️
                              </div>
                              <span style={{ fontSize: "14px", fontWeight: "600", color: "#64748b" }}>
                                No Coupons Available
                              </span>
                              <span style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
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

      <Footer />
    </div>
  );
};

export default RentalBookingProcess;
