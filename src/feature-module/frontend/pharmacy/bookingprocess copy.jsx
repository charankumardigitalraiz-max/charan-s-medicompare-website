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
import { useParams } from "react-router-dom";
import { useMediaQuery } from "react-responsive";
import CartQuantityControls from "../../../components/ui/CartQuantityControls.jsx";
import { useProfile } from "../../../context/ProfileContext";
import { Offcanvas } from "react-bootstrap";
import SlotPickerComponent from "./SlotPickerComponent";
import Select from "react-select";
import { useLocation } from "../../../context/LocationContext";

const TOKEN_STORAGE_KEY = "medicomparestoken";
const SUPPORT_WHATSAPP_NUMBER = "919010357778";

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
  const {
    currentLocation,
    isLocationUpdating,
    selectedPincode,
    latitude,
    longitude,
  } = useLocation();
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [couponList, setCouponList] = useState([]);
  const [personType, setPersonType] = useState("self");
  const [familyMembers, setFamilyMembers] = useState([]);
  const [doctorName, setDoctorName] = useState("");
  const [selectedFamilyMember, setSelectedFamilyMember] = useState(null);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [doctorSearchLoading, setDoctorSearchLoading] = useState(false);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    try {
      const stored = localStorage.getItem("appliedCoupon");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [walletAmount, setWalletAmount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { type } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

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
    data?.medicineDetails?.CategoryDetails?.fixedType === "labtests" ||
      cart?.type === "package"
      ? (data?.samplecollection ?? cart?.samplecollection ?? 100)
      : 0;
  const cgst = parseFloat(
    CGstCalculate(subtotal + samplecollection).toFixed(2),
  );
  const sgst = parseFloat(
    SGstCalculate(subtotal + samplecollection).toFixed(2),
  );
  const tax = parseFloat((cgst + sgst).toFixed(2));
  // const total = parseFloat((subtotal + tax + samplecollection).toFixed(2));
  const total = parseFloat((subtotal + samplecollection).toFixed(2));

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

  const couponDiscount =
    appliedCoupon?.serverDiscount !== undefined
      ? appliedCoupon.serverDiscount
      : calculateCouponDiscount(appliedCoupon, total);
  const amountToPay =
    appliedCoupon?.serverFinalAmount !== undefined
      ? appliedCoupon.serverFinalAmount
      : parseFloat(Math.max(0, total - couponDiscount).toFixed(2));

  const handleCouponApply = async (coupon) => {
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
        couponId: coupon._id,
        totalAmount: amountToPay,
        bookingTypes: "buy_now",
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

      setData(cartData);
      setCart(cartInfo);
      setReleventBookings(releventBookingsData);
      setVendorTimings(vendorTimingsData);
      setWalletAmount(walletData);
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

      const response = await axiosUserInstance.get("family-member/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setFamilyMembers(response.data.data || []);
      }
    } catch (error) {
      // Error loading family members
    }
  };

  const fetchDoctors = async (searchQuery = "") => {
    try {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);
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

  //  order
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;
    const isSlotCategory =
      data?.medicineDetails?.CategoryDetails?.categoryType === "slots";
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

    if (!isSlotCategory && !selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    if (isSlotCategory && !hasSelectedSlot) {
      toast.error("Please select an appointment slot");
      setShowSlotPicker(true);
      return;
    }

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
          quantity: quantity,
          pricePerItem: pricePerItem,
          subtotal: subtotal,
          price: mrpPrice,
          discountprice: discountPrice || 0,
          serviceType: data?.medicineDetails?.CategoryDetails?.fixedType,
        },
      ],
      bookingTypes: "buy_now",
      subtotal,
      shipping: 0,
      discount: couponDiscount,
      tax: orderTax,
      cgst: orderCGST,
      sgst: orderSGST,
      total: amountToPay,
      shippingAddress: isSlotCategory ? null : selectedAddress._id,
      billingAddress: isSlotCategory ? null : selectedAddress._id,
      paymentmethod: paymentMethod,
      couponId: appliedCoupon?._id || null,
      couponAmount: couponDiscount,
      samplecollection: samplecollection,
      walletamount:
        paymentMethod === "online" && walletAmount > 0 ? walletAmount : null,
      iswallet: paymentMethod === "online" && walletAmount > 0 ? true : false,
      doctorName:
        selectedDoctor?.value === "not_applicable"
          ? "Not Applicable"
          : selectedDoctor?.label || "",
      doctorId:
        selectedDoctor?.value === "not_applicable"
          ? null
          : selectedDoctor?.value || "",
      familyids:
        personType === "forWhom" && selectedFamilyMember
          ? [selectedFamilyMember.value].filter(Boolean)
          : [],
      familynames:
        personType === "forWhom" && selectedFamilyMember
          ? [selectedFamilyMember.label].filter(Boolean)
          : [],
      persontype: personType,
      selectedDate: selectedDate ? selectedDate.toISOString() : null,
      selectedTimeSlot: selectedTimeSlot,
      pincode:
        currentLocation?.pincode ||
        selectedPincode ||
        selectedAddress?.location?.pincode ||
        "",
    };

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
        walletAmount >= amountToPay &&
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

        navigate("/payment-success");
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

        navigate("/payment-success");
        return;
      }

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
                bookingTypes: "buy_now",
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
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

            navigate("/payment-success");
          } catch {
            toast.error("Payment verification failed");
          }
        },
        prefill: {
          name: selectedAddress?.name || userProfile?.first_name || "Customer",
          contact: selectedAddress?.phone || userProfile?.mobile || "",
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

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const response = await axiosCommonInstance.get("coupon/list");
        setCouponList(response.data.data.couponlist);
      } catch (error) {
        toast.error(error);
      }
    };

    fetchCoupons();
  }, []);

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
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          getData(),
          loadSavedAddresses(),
          fetchFamilyMembers(),
          fetchDoctors(),
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
    data?.medicineDetails?.CategoryDetails?.categoryType === "slots";
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

  const renderRecentlyViewed = () => {
    if (!(productData?.length > 0)) return null;
    return (
      <div
        className="card shadow-sm mb-3"
        style={{
          borderRadius: "12px",
          border: "none",
        }}
      >
        <div className="card-body">
          <div
            style={{
              // padding: "20px",
              position: "relative",
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
                style={{
                  fontSize: "14px",
                  color: "#8059ca",
                  fontWeight: 600,
                }}
              >
                {productData.length} products
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
                style={{
                  display: "flex",
                  overflowX: "auto",
                  gap: "20px",
                  padding: "12px",
                  scrollbarColor: "#8059ca #f0f0f0",
                  scrollBehavior: "smooth",
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  alignItems: "stretch",
                  "&::-webkit-scrollbar": {
                    display: "none",
                  },
                }}
              >
                {relevantProducts?.map((product) => (
                  <div
                    key={product._id}
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
                            }/${product?.tabletDetails?.subcategoryDetails?.slug
                            }/${product?.tabletDetails?.slug}/compare`}
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
                            src={
                              resolveImage(product?.tabletDetails) ||
                              resolveImage(product?.combinedvariant) ||
                              "/assets/default.png"
                            }
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
                        <div style={{ flex: 1 }}>
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
                            {product?.tabletDetails?.name?.length > 30
                              ? product?.tabletDetails?.name?.slice(0, 30) +
                              "..."
                              : product?.tabletDetails?.name}
                          </div>
                        </div>

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
                              display: product?.tabletvariantDetails?.price
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
                                        }}
                                      >
                                        ₹{Number(originalPrice || 0).toFixed(2)}
                                      </span>
                                    </>
                                  );
                                }

                                return `₹${Number(originalPrice || 0).toFixed(2)}`;
                              })()}
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
                              {product.tabletDetails?.averageRating?.toFixed(
                                1,
                              ) || 0}
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
                              }}
                            >
                              <div
                                style={{
                                  width: "100%",
                                  borderRadius: "8px",
                                  background:
                                    "linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  color: "#999",
                                  fontSize: "10px",
                                  textAlign: "center",
                                  lineHeight: "1.2",
                                }}
                              >
                                <img
                                  src={getImageUrl(
                                    product?.vendor?.bussiness_image?.[0]
                                      ?.url || "",
                                  )}
                                  alt="product"
                                  style={{
                                    width: "80%",
                                    height: "80%",
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
                                      let calculatedDiscountPrice =
                                        discountPrice;
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
                                            ₹
                                            {calculatedDiscountPrice.toFixed(2)}
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
                              tabletdetails: product?.tabletDetails,
                              vendordetails: {
                                ...product?.vendor,
                                vendorId: product?.vendor?.vendorId,
                              },
                              variants: {
                                ...product?.combinedvariant,
                              },
                              price: product?.combinedvariant?.price || 0,
                              discountprice:
                                product?.combinedvariant?.discountprice || 0,
                              perDayRent: product.perDayRent,
                              _id: product?._id,
                              id: product?._id,
                            }}
                            variant={product?.combinedvariant}
                            maxStock={product?.combinedvariant?.stock || 999}
                            inStock={
                              product?.combinedvariant?.isStock !== false
                            }
                            options={{
                              bookingType: product?.bookingType,
                            }}
                            className="custom-cart-controls"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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
        </div>
      </div>
    );
  };

  return (
    <div className="main-wrapper ">
      <Home2Header />
      <CategoryProvider />

      <div className="booking-process-wrapper mt-5">
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
              <div className="row">
                <div className={isLoggedIn ? "col-md-6 col-12" : "col-12"}>
                  {isSlotCategory ? (
                    <div style={{ marginBottom: "24px" }}>
                      <div
                        style={{
                          border: "1px solid #d1fae5",
                          borderRadius: "10px",
                          padding: "16px",
                          backgroundColor: "#f0fdf4",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            marginBottom: "10px",
                          }}
                        >
                          <i
                            className="fab fa-whatsapp"
                            style={{ color: "#16a34a", fontSize: "22px" }}
                          ></i>
                          <div
                            style={{
                              fontSize: isMobile ? "13px" : "14px",
                              fontWeight: "700",
                              color: "#111827",
                            }}
                          >
                            Booking Support
                          </div>
                        </div>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#4b5563",
                            marginBottom: "12px",
                          }}
                        >
                          Need help with this appointment? Chat with our support
                          team on WhatsApp.
                        </p>
                        <button
                          type="button"
                          onClick={handleWhatsAppSupport}
                          style={{
                            width: "100%",
                            border: "none",
                            borderRadius: "8px",
                            backgroundColor: "#16a34a",
                            color: "#fff",
                            padding: "10px 12px",
                            fontSize: "13px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "8px",
                          }}
                        >
                          <i className="fab fa-whatsapp"></i>
                          Contact on WhatsApp
                        </button>
                      </div>
                    </div>
                  ) : (
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
                  )}
                </div>
                {isLoggedIn && (
                  <div className="col-md-6 col-12">
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
                              placeholder="Select family members"
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
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div
                className="card shadow-sm mb-3 order-2 order-md-1"
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
                            resolveImage(data?.medicineDetails) ||
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
                            {discountPrice && mrpPrice > pricePerItem ? (
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
                            )}
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
                            {data?.medicineDetails?.form && (
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
                                  className="fas fa-capsules"
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Form : {data?.medicineDetails?.form}
                              </li>
                            )}

                            {data?.medicineDetails?.strength && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Strength : {data?.medicineDetails?.strength}
                              </li>
                            )}

                            {data?.medicineDetails?.duration && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Duration : {data?.medicineDetails?.duration}
                              </li>
                            )}
                            {data?.medicineDetails?.shiftType && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Shift Type : {data?.medicineDetails?.shiftType}
                              </li>
                            )}
                            {data?.medicineDetails?.nursecareType && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Type : {data?.medicineDetails?.nursecareType}
                              </li>
                            )}
                            {data?.medicineDetails?.gender && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Gender : {data?.medicineDetails?.gender}
                              </li>
                            )}
                            {data?.medicineDetails?.complexity && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Complexity : {data?.medicineDetails?.complexity}
                              </li>
                            )}

                            {data?.medicineDetails?.model && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Model : {data?.medicineDetails?.model}
                              </li>
                            )}
                            {data?.medicineDetails?.condition && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Condition : {data?.medicineDetails?.condition}
                              </li>
                            )}
                            {data?.medicineDetails?.machineType && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>
                                Machine Type :{" "}
                                {data?.medicineDetails?.machineType}
                              </li>
                            )}

                            {data?.medicineDetails?.compositionDetails
                              ?.name && (
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
                                    style={{ color: "#8059ca", fontSize: "12px" }}
                                  ></i>
                                  Composition :{" "}
                                  {
                                    data?.medicineDetails?.compositionDetails
                                      ?.name
                                  }
                                </li>
                              )}

                            {data?.medicineDetails?.reportsDuration && (
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
                                ></i>

                                {data?.medicineDetails?.reportsDuration.slice(
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
                                  style={{ color: "#8059ca", fontSize: "12px" }}
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
                {isSlotCategory && (
                  <div
                    className="card shadow-sm mb-4"
                    style={{
                      borderRadius: "12px",
                      border: "none",
                    }}
                  >
                    <div className="card-body p-3">
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: "12px",
                        }}
                      >
                        <h6
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#000",
                            margin: 0,
                          }}
                        >
                          APPOINTMENT SLOT
                        </h6>
                        <button
                          onClick={() => setShowSlotPicker(true)}
                          style={{
                            backgroundColor: "transparent",
                            border: "1px solid #8059ca",
                            color: "#8059ca",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                          }}
                        >
                          PICK SLOT
                        </button>
                      </div>
                      {selectedSlot || formatSelectedSlot() ? (
                        <div
                          style={{
                            backgroundColor: "rgba(236, 236, 238, 1)",
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "13px",
                            color: "#000",
                            marginBottom: "12px",
                          }}
                        >
                          {selectedSlot ||
                            formatSelectedSlot() ||
                            "Select a slot"}
                        </div>
                      ) : (
                        <div
                          style={{
                            backgroundColor: "#fff3cd",
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "13px",
                            color: "#856404",
                            marginBottom: "12px",
                          }}
                        >
                          No slot selected
                        </div>
                      )}
                    </div>
                  </div>
                )}

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
                                  style={{ fontSize: "12px", color: "#047857" }}
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
                              Sub-total<small> (Inclusive of all Taxes)</small>
                            </span>
                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{subtotal.toFixed(2)}
                            </span>
                          </div>

                          {(data?.medicineDetails?.CategoryDetails
                            ?.fixedType === "labtests" ||
                            cart?.type === "package") && (
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: "8px",
                                  fontSize: "13px",
                                }}
                              >
                                <span style={{ color: "#666" }}>
                                  Sample Collection fee
                                </span>
                                <span
                                  style={{ fontWeight: "600", color: "#000" }}
                                >
                                  ₹{samplecollection.toFixed(2)}
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
                            <span style={{ color: "#666" }}>CGST (4%)</span>
                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{cgst.toFixed(2)}
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
                            <span style={{ color: "#666" }}>SGST (14%)</span>
                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{sgst.toFixed(2)}
                            </span>
                          </div>

                          {couponDiscount > 0 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
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

                        {paymentMethod === "online" && walletAmount > 0 && (
                          <>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "14px",
                                color: "#000",
                                marginBottom: "12px",
                              }}
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

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            marginBottom: "16px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "16px",
                              fontWeight: "700",
                              color: "#000",
                            }}
                          >
                            Amount to Pay
                          </span>
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              color: "#000",
                            }}
                          >
                            ₹{amountToPay.toFixed(2)}
                          </span>
                        </div>

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
                          backgroundColor:
                            paymentMethod === "cod" ? "#f0f4ff" : "#f9f9f9",
                          cursor: "pointer",
                          borderColor:
                            paymentMethod === "cod" ? "#8059ca" : "#e0e0e0",
                        }}
                        onClick={() => setPaymentMethod("cod")}
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
                          checked={paymentMethod === "cod"}
                          onChange={() => setPaymentMethod("cod")}
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
                          backgroundColor:
                            paymentMethod === "online" ? "#f0f4ff" : "#f9f9f9",
                          cursor: "pointer",
                          borderColor:
                            paymentMethod === "online" ? "#8059ca" : "#e0e0e0",
                        }}
                        onClick={() => setPaymentMethod("online")}
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
                          checked={paymentMethod === "online"}
                          onChange={() => setPaymentMethod("online")}
                        />
                      </div>
                    </div>

                    <hr style={{ margin: "10px 0", borderColor: "#eee" }} />

                    <form onSubmit={(e) => handleSubmit(e)}>
                      <input
                        type="hidden"
                        name="paymentMethod"
                        value={paymentMethod}
                      />
                      <button
                        type="submit"
                        disabled={isSubmitting || (isSlotCategory && !hasSelectedSlot)}
                        style={{
                          width: "100%",
                          backgroundColor:
                            isSubmitting || (isSlotCategory && !hasSelectedSlot)
                              ? "#9ca3af"
                              : "#8059ca",
                          color: "#fff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "12px",
                          cursor:
                            isSubmitting || (isSlotCategory && !hasSelectedSlot)
                              ? "not-allowed"
                              : "pointer",
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
                      {isSlotCategory && !hasSelectedSlot && (
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#dc2626",
                            marginTop: "-6px",
                            marginBottom: "10px",
                          }}
                        >
                          Appointment slot is required before submitting order.
                        </p>
                      )}
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
              <div
                className={`col-lg-${showProductDetails ? "8" : "12"} col-md-12 order-3`}
              >
                {renderRecentlyViewed()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Show SlotPicker only when categoryType is "slots" */}
      {isSlotCategory && (
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
            <SlotPickerComponent
              selectedDate={selectedDate}
              selectedTimeSlot={selectedTimeSlot}
              vendorTimings={vendorTimings}
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
              }}
              onClose={() => setShowSlotPicker(false)}
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

      <Footer />
    </div>
  );
};

export default BookingProcess;
