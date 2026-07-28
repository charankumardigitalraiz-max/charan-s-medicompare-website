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
import "./bookingprocess.css";
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

const TOKEN_STORAGE_KEY = "medicomparestoken";
const SUPPORT_WHATSAPP_NUMBER = "919010357778";
const PRIMARY_COLOR = "#8059ca";
const PRIMARY_SECTION_BG = "#f8f4ff";
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

      <div className="booking-process-wrapper mt-2 md:mt-4">
        <div className="container-fluid px-2 px-md-3 px-lg-5">
          {/* <nav aria-label="breadcrumb" className="mb-3 mb-md-4 mt-2 mt-md-3">
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
          </nav> */}

          <div className="row g-3 g-md-4">
            <div className="col-lg-8 col-md-12 order-1 order-lg-1 d-flex flex-column">
              <div className="row" style={{ padding: "2px" }}>
                <div className={isLoggedIn ? "col-md-6 col-12" : "col-12"}>
                  {isSlotCategory && cart?.type !== "package" && selectedVisitType !== "home" ? (
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

                    <>
                      {VENDOR_LOCATION_SERVICES.includes(data?.medicineDetails?.CategoryDetails?.fixedType) && (
                        <div style={{ marginBottom: "24px" }}>
                          <div
                            style={{
                              border: "1px solid #e0e0e0",
                              borderRadius: "10px",
                              padding: "16px",
                              backgroundColor: "#fff",
                              fontSize: "14px",
                              color: "#333",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            }}
                          >
                            <div
                              style={{
                                fontWeight: "bold",
                                marginBottom: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                gap: "8px",
                              }}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                                <i className="fas fa-hospital" style={{ color: "#8059ca" }}></i>
                                <span
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    color: "#000",
                                    margin: 0,
                                  }}>Provider Address</span>
                              </div>
                              {data?.businessDetails?.location?.coordinates &&
                                data.businessDetails.location.coordinates.length === 2 && (
                                  <div>
                                    <a
                                      href={`https://www.google.com/maps/search/?api=1&query=${data.businessDetails.location.coordinates[1]},${data.businessDetails.location.coordinates[0]}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        padding: "5px 10px",
                                        background: "#8059ca",
                                        color: "#fff",
                                        fontSize: "14px",
                                        fontWeight: "500",
                                        textDecoration: "none",
                                        borderRadius: "8px",
                                        border: "1px solid #6d46b5",
                                        boxShadow: "0 3px 8px rgba(128, 89, 202, 0.25)",
                                        transition: "all 0.25s ease",
                                        cursor: "pointer",
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = "#6d46b5";
                                        e.currentTarget.style.transform = "translateY(-2px)";
                                        e.currentTarget.style.boxShadow =
                                          "0 6px 14px rgba(128, 89, 202, 0.35)";
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = "#8059ca";
                                        e.currentTarget.style.transform = "translateY(0)";
                                        e.currentTarget.style.boxShadow =
                                          "0 3px 8px rgba(128, 89, 202, 0.25)";
                                      }}
                                    >
                                      <i className="fas fa-map-marked-alt"></i>
                                      View on Map
                                    </a>
                                  </div>
                                )}
                            </div>

                            {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}> */}
                            {data?.businessDetails?.name && (
                              <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                                {data?.businessDetails?.name}
                              </div>
                            )}
                            {/* </div> */}
                            {data?.businessDetails?.address && (
                              <div style={{ color: "#4b5563" }}>
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
                    </>
                  )}
                </div>
                {isLoggedIn && (
                  <div className="col-md-6 col-12">
                    <div
                      style={{
                        borderRadius: "10px",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                        backgroundColor: "#fff",
                        border: "none",
                        padding: "16px",
                      }}
                    >
                      <div className="row g-3">
                        <div className="col-12 ">
                          <div className="choice-cards-container">
                            <div className="choice-card-wrapper">
                              <label className={`choice-card ${personType === "self" ? "selected" : ""}`}>
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

                            <div className="choice-card-wrapper">
                              <label className={`choice-card ${personType === "forWhom" ? "selected" : ""}`}>
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
                  </div>
                )}
              </div>

              {selectedVisitType === "home" && (
                <div style={{ marginBottom: "10px" }}>
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
              )}

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
                <div className="mt-2 order-lg-last">
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
                      {/* Visit Type Option */}
                      {serviceDetails?.visitType && (
                        <div style={{ marginBottom: "16px", borderBottom: "1px solid #f1f1f1", paddingBottom: "12px" }}>
                          <h6
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: "#8059ca",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                              marginBottom: "8px",
                            }}
                          >
                            Visit Type
                          </h6>
                          {serviceDetails.visitType.toLowerCase() === "both" ? (
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedVisitType("home")}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: selectedVisitType === "home" ? "2px solid #8059ca" : "1px solid #ddd",
                                  background: selectedVisitType === "home" ? "#f8f4ff" : "#fff",
                                  color: selectedVisitType === "home" ? "#8059ca" : "#333",
                                  fontWeight: "600",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                <i className="fas fa-home"></i> Home Visit
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedVisitType("center")}
                                style={{
                                  flex: 1,
                                  padding: "8px 12px",
                                  borderRadius: "8px",
                                  border: selectedVisitType === "center" ? "2px solid #8059ca" : "1px solid #ddd",
                                  background: selectedVisitType === "center" ? "#f8f4ff" : "#fff",
                                  color: selectedVisitType === "center" ? "#8059ca" : "#333",
                                  fontWeight: "600",
                                  fontSize: "12px",
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  gap: "6px",
                                }}
                              >
                                <i className="fas fa-building"></i> Visit Center
                              </button>
                            </div>
                          ) : serviceDetails.visitType.toLowerCase() === "home" ? (
                            <div
                              style={{
                                padding: "8px 12px",
                                background: "#ecfdf5",
                                border: "1px solid #a7f3d0",
                                borderRadius: "8px",
                                color: "#065f46",
                                fontSize: "12px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <i className="fas fa-home" style={{ color: "#059669" }}></i>
                              Home Service Only Available
                            </div>
                          ) : (
                            <div
                              style={{
                                padding: "8px 12px",
                                background: "#fffbeb",
                                border: "1px solid #fde68a",
                                borderRadius: "8px",
                                color: "#b45309",
                                fontSize: "12px",
                                fontWeight: "600",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                              }}
                            >
                              <i className="fas fa-exclamation-circle" style={{ color: "#d97706" }}></i>
                              Please visit the center for this booking
                            </div>
                          )}
                        </div>
                      )}

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
                          className="highlighted-pick-slot-btn"
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
                            backgroundColor: PRIMARY_SECTION_BG,
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "13px",
                            color: PRIMARY_COLOR,
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

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: "8px",
                              fontSize: "13px",
                            }}
                          >
                            <span style={{ color: "#666" }}>
                              Subtotal<small> (Inclusive of all Taxes)</small>
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
                            <span style={{ color: "#666" }}>GST</span>
                            <span style={{ fontWeight: "600", color: "#000" }}>
                              ₹{tax.toFixed(2)}
                            </span>
                          </div>

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

                          {couponDiscount > 0 && (
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                marginBottom: "8px",
                                fontSize: "13px",
                                color: "#065f46",
                              }}
                            >
                              <span style={{ fontWeight: 600, color: "#065f46 !important" }}>
                                Coupon Discount
                                {appliedCoupon?.code
                                  ? ` (${appliedCoupon.code})`
                                  : ""}
                              </span>
                              <span style={{ fontWeight: 700, color: "#065f46 !important" }}>
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
                                fontWeight: 600,
                                color: "#047857",
                                marginBottom: "12px",
                              }}
                            >
                              <span>Wallet Amount</span>
                              <span> - ₹{(dudcutedWalletAmount || 0).toFixed(2)}</span>
                            </div>

                            {/* <div
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
                            </div> */}
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
                              fontWeight: "600",
                              color: "#000",
                            }}
                          >
                            Amount to Pay
                          </span>
                          <span
                            style={{
                              fontSize: "18px",
                              fontWeight: "600",
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

                    <div style={{ display: "flex", flexDirection: isMobile || isTablet ? "column" : "row", gap: "8px", marginBottom: "16px", width: "100%", boxSizing: "border-box" }}>
                      {/* Online Option */}
                      <div
                        style={{
                          flex: "1 1 0%",
                          minWidth: 0,
                          border: paymentMethod === "online" ? "2px solid #8059ca" : "1.5px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "10px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: paymentMethod === "online" ? "#fdfaff" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: paymentMethod === "online" ? "0 4px 12px rgba(128, 89, 202, 0.08)" : "none",
                          boxSizing: "border-box"
                        }}
                        onClick={() => setPaymentMethod("online")}
                        onMouseEnter={(e) => {
                          if (paymentMethod !== "online") {
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.backgroundColor = "#fafbfc";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (paymentMethod !== "online") {
                            e.currentTarget.style.borderColor = "#e2e8f0";
                            e.currentTarget.style.backgroundColor = "#ffffff";
                          }
                        }}
                      >
                        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: paymentMethod === "online" ? "#8059ca" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: paymentMethod === "online" ? "#fff" : "#64748b", fontSize: "12px", transition: "all 0.2s ease", flexShrink: 0 }}>
                          <i className="fas fa-credit-card" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: paymentMethod === "online" ? "#8059ca" : "#1e293b", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Online Payment
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>UPI, Cards, NetBanking</div>
                        </div>
                        <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: paymentMethod === "online" ? "4px solid #8059ca" : "2px solid #cbd5e1", background: "#fff", transition: "all 0.2s ease", flexShrink: 0 }} />
                      </div>

                      {/* COD Option */}
                      <div
                        style={{
                          flex: "1 1 0%",
                          minWidth: 0,
                          border: paymentMethod === "cod" ? "2px solid #8059ca" : "1.5px solid #e2e8f0",
                          borderRadius: "12px",
                          padding: "10px 12px",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          backgroundColor: paymentMethod === "cod" ? "#fdfaff" : "#ffffff",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                          boxShadow: paymentMethod === "cod" ? "0 4px 12px rgba(128, 89, 202, 0.08)" : "none",
                          boxSizing: "border-box"
                        }}
                        onClick={() => {
                          setPaymentMethod("cod");
                          setAppliedCoupon(null);
                        }}
                        onMouseEnter={(e) => {
                          if (paymentMethod !== "cod") {
                            e.currentTarget.style.borderColor = "#cbd5e1";
                            e.currentTarget.style.backgroundColor = "#fafbfc";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (paymentMethod !== "cod") {
                            e.currentTarget.style.borderColor = "#e2e8f0";
                            e.currentTarget.style.backgroundColor = "#ffffff";
                          }
                        }}
                      >
                        <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: paymentMethod === "cod" ? "#8059ca" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: paymentMethod === "cod" ? "#fff" : "#64748b", fontSize: "12px", transition: "all 0.2s ease", flexShrink: 0 }}>
                          <i className="fas fa-money-bill-wave" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: paymentMethod === "cod" ? "#8059ca" : "#1e293b", marginBottom: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            Pay After Service
                          </div>
                          <div style={{ fontSize: "10px", color: "#64748b", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>Pay at the time of delivery</div>
                        </div>
                        <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: paymentMethod === "cod" ? "4px solid #8059ca" : "2px solid #cbd5e1", background: "#fff", transition: "all 0.2s ease", flexShrink: 0 }} />
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
                            applicableAmount = subtotal;
                            // console.log(applicableAmount);
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
                            // console.log(isEligible)
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

                                <div
                                  style={{
                                    display: "flex",
                                    flexWrap: "wrap",
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
