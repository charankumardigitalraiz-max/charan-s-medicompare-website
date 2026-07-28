import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../Apiservice.jsx";
import { CartQuantityControls, VendorActions } from "../ui";
import { getImageUrl } from "../../utils/index.js";
import toast from "react-hot-toast";
import ShareModal from "../../feature-module/frontend/pharmacy/products-components/ShareModal.jsx";
import LeadModal from "../../feature-module/frontend/pharmacy/products-components/LeadModal.jsx";
import RentModal from "../../feature-module/frontend/pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../../feature-module/frontend/pharmacy/products-components/ConsultationModal.jsx";
import {
  getShareUrl,
  copyToClipboard,
} from "../../feature-module/frontend/pharmacy/utils/shareUtils.js";
import AppointmentModal from "../../feature-module/frontend/pharmacy/products-components/AppointmentModal.jsx";
import { useProfile } from "../../context/ProfileContext";
import { redirectToLoginWithPendingBooking } from "../../utils/pendingBookingUtils";
import FamilyMemberSelectionModal from "../../feature-module/frontend/pharmacy/products-components/FamilyMemberSelectionModal.jsx";

const INITIAL_LEAD_FORM = {
  date: "",
  name: "",
  email: "",
  mobile: "",
  policyNumber: "",
  relation: "",
  address: "",
};

const VendorsSection = ({
  vendors,
  tablet,
  selectedVariants,
  selectedVendors,
  expandedVendors,
  onToggleExpand,
  onVendorAction,
  getVendorPrice,
  getQuantityForVariant,
  rentAndCartButtonStyles,
  contailerStyles,
  service,
  id,
  navigate,
  allVendorsCount = 0,
  showAllVendors = false,
}) => {
  // console.log("Vendor Card", vendors, "products", tablet)
  // Modal states
  const [showShareModal, setShowShareModal] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [rentProduct, setRentProduct] = useState(null);
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();

  // State for current vendor and variant data
  const [currentVendor, setCurrentVendor] = useState(null);
  const [currentMed, setCurrentMed] = useState(null);
  const [currentVariantId, setCurrentVariantId] = useState(null);
  const [familyMemberModel, setFamilyMemberModel] = useState(false);
  const [familyMembersData, setFamilyMembersData] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState(["self"]);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedTests, setSelectedTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const scrollContainerRef = useRef(null);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const [showScrollDown, setShowScrollDown] = useState(false);

  // Form data states
  const [leadFormData, setLeadFormData] = useState(INITIAL_LEAD_FORM);
  const [rentFormData, setRentFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    duration: "",
    deliveryAddress: "",
  });
  const [consultationFormData, setConsultationFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });
  const [appointmentFormData, setAppointmentFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");
  const handleVendorClick = (vendor) => {
    const vendorId =
      vendor?._id ||
      vendor?.businessdetails?._id ||
      vendor?.bussinessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      const name =
        vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
      const vendorSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  const updateScrollIndicators = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setShowScrollUp(scrollTop > 5);
      setShowScrollDown(scrollHeight - scrollTop - clientHeight > 5);
    }
  };

  // if (!vendors || vendors.length === 0) return null;
  if (!vendors || vendors.length === 0) {
    return (
      <div className="product-vendors-section-full" style={{ position: "relative" }}>
        {/* Toggle Bar with 0 offers */}
        {!showAllVendors && (
          <div style={{ position: "relative", marginTop: "4px" }}>
            <div
              className="vendors-section-header d-flex justify-content-between align-items-center"
              style={{
                background: "#fafafa",
                border: "1px dashed #cbd5e1",
                borderRadius: "10px",
                padding: "6px 12px",
                cursor: "default"
              }}
            >
              <div className="vendors-header-left d-flex align-items-center">
                <i className="fa-solid fa-right-left me-2" style={{ color: "#a3a3a3", fontSize: "10px" }}></i>
                <span style={{ fontSize: "11px", fontWeight: "500", color: "#8c8c8c", letterSpacing: "0.02em" }}>
                  Not available
                </span>
              </div>
              <span className="badge text-secondary border-0" style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#f0f0f0" }}>0</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  const selectedVariantId =
    selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
  const isExpanded = expandedVendors[tablet._id];

  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => {
        updateScrollIndicators();
      }, 120);
      return () => clearTimeout(timer);
    } else {
      setShowScrollUp(false);
      setShowScrollDown(false);
    }
  }, [isExpanded, vendors]);

  const totalVendorsCount =
    allVendorsCount > 0 ? allVendorsCount : vendors.length;

  const handleToggle = () => {
    if (typeof onToggleExpand === "function") {
      onToggleExpand(tablet._id);
    }
  };

  const getFixedType = (med) => {
    return med?.subcategorys?.category?.fixedType || "surgeries";
  };

  const buildBuyNowPayload = (vendor, med, extra = {}) => {
    const variantId =
      selectedVariants[med._id] ||
      med.variant?.[0]?._id ||
      med.variants?.[0]?._id;
    return [
      {
        productId: med._id,
        variantId: variantId || null,
        vendorId: vendor._id,
        packageId: null,
        quantity: 1,
        type: "normal",
        bookingType: "buy_now",
        patientId: null,
        selectType: "self",
        groupcart: [],
        servicefixedTypes: service,
        ...extra,
      },
    ];
  };

  const handleSlots = async (vendor, med) => {
    const payload = buildBuyNowPayload(vendor, med);
    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      toast.error("Please login to book slot");
      redirectToLoginWithPendingBooking(navigate, payload, {
        redirectPath: "/booking-process/slot",
      });
      return;
    }

    try {
      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      navigate("/booking-process/slot");
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        redirectToLoginWithPendingBooking(navigate, payload, {
          redirectPath: "/booking-process/slot",
        });
      } else {
        toast.error("Booking failed");
      }
    }
  };

  // Handler for appointment
  const handleAppointment = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }
    setCurrentVendor(vendor);
    setCurrentMed(med);
    const variantId = selectedVariants[med._id] || med.variants?.[0]?._id;
    setCurrentVariantId(variantId);

    const today = new Date().toISOString().split("T")[0];
    setAppointmentFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: getFixedType(med),
      address: "",
      vendorId: vendor?.vendorId || vendor?._id,
      productId: med._id,
      variantId: variantId,
    });

    setShowAppointmentModal(true);
  };

  const handleRent = async (vendor, med) => {
    const payload = buildBuyNowPayload(vendor, med, {
      perDayRent: vendor?.perDayRent || 0, servicefixedTypes: service
    });
    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      toast.error("Please login to rent");
      redirectToLoginWithPendingBooking(navigate, payload, {
        redirectPath: "/rental-booking-process",
        perDayRent: vendor?.perDayRent || 0,
      });
      return;
    }

    try {
      if (vendor?.perDayRent) {
        localStorage.setItem("perDayRent", vendor.perDayRent);
      }

      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      navigate("/rental-booking-process");
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        redirectToLoginWithPendingBooking(navigate, payload, {
          redirectPath: "/rental-booking-process",
          perDayRent: vendor?.perDayRent || 0,
        });
      } else {
        toast.error("Renting failed");
      }
    }
  };

  // Handler for consultation
  const handleConsultation = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }
    setCurrentVendor(vendor);
    setCurrentMed(med);
    const variantId = selectedVariants[med._id] || med.variants?.[0]?._id;
    setCurrentVariantId(variantId);

    const today = new Date().toISOString().split("T")[0];
    setConsultationFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      vendorId: vendor?.vendorId || vendor?._id,
      productId: med._id,
      variantId: variantId,
    });
    setShowConsultationModal(true);
  };

  // Handler for lead
  const handleAddLead = (vendor, med, variantId) => {
    if (!isLoggedIn) {
      toast.error("Please login to add lead");
      navigate("/login");
      return;
    }
    const effectiveVariantId =
      variantId || selectedVariants[med._id] || med.variants?.[0]?._id;
    setCurrentLeadData({
      vendor,
      med,
      variantId: effectiveVariantId,
      effectiveVariantId,
    });
    setCurrentVendor(vendor);
    setCurrentMed(med);
    setCurrentVariantId(effectiveVariantId);

    const today = new Date().toISOString().split("T")[0];
    setLeadFormData({
      ...INITIAL_LEAD_FORM,
      date: today,
      relation: "self",
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim()
        : "",
      mobile: userProfile?.phone || "",
      email: userProfile?.email || "",
      fixedType: getFixedType(med),
      vendorId: vendor?.vendorId || vendor?._id,
      productId: med._id,
      variantId: effectiveVariantId,
    });
    setShowLeadModal(true);
  };

  // Form handlers
  const handleRentFormChange = (e) => {
    const { name, value } = e.target;
    setRentFormData((prev) => ({
      ...prev,
      [name]: value,
      vendorId: currentVendor?.vendorId || currentVendor?._id,
      productId: currentMed?._id,
      variantId: currentVariantId,
    }));
  };

  const handleRentSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }
    toast.success("Rental request submitted successfully!");
    setShowRentModal(false);
    setRentFormData({
      startDate: "",
      startTime: "",
      endDate: "",
      endTime: "",
      duration: "",
      deliveryAddress: "",
    });
    setRentProduct(null);
  };

  const handleConsultationFormChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({
      ...prev,
      [name]: value,
      vendorId: currentVendor?.vendorId || currentVendor?._id,
      productId: currentMed?._id,
      variantId: currentVariantId,
    }));
  };

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }
    toast.success("Consultation request submitted successfully!");
    setShowConsultationModal(false);
    setConsultationFormData({
      date: "",
      name: "",
      phone: "",
      category: "",
      address: "",
    });
  };

  const handleAppointmentFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFormData((prev) => ({
      ...prev,
      [name]: value,
      vendorId: currentVendor?.vendorId || currentVendor?._id,
      productId: currentMed?._id,
      variantId: currentVariantId,
    }));
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }
    toast.success("Appointment request submitted successfully!");
    setShowAppointmentModal(false);
    setAppointmentFormData({
      date: "",
      name: "",
      phone: "",
      category: "",
      address: "",
    });
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!currentLeadData?.med) return;

    const { vendor, med, variantId } = currentLeadData;
    try {
      const token = localStorage.getItem("medicomparestoken");
      await axiosUserInstance.post(
        "lead/create",
        {
          name: leadFormData.name,
          email: leadFormData.email,
          phone: leadFormData.mobile,
          address: leadFormData.address,
          policyNumber: leadFormData.policyNumber,
          relation: leadFormData.relation,
          productId: med._id,
          vendorId: vendor._id,
          variantId,
          leadSource: "Website",
          leadStage: "New",
          status: "active",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      toast.success("Lead submitted successfully!");
      setShowLeadModal(false);
      setLeadFormData(INITIAL_LEAD_FORM);
      setCurrentLeadData(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to add lead",
      );
    }
  };

  const toggleConsultationModal = () =>
    setShowConsultationModal(!showConsultationModal);

  const handleShare = {
    copy: async () => {
      try {
        const url = getShareUrl(tablet);
        await copyToClipboard(url, () => {
          toast.success("Link copied to clipboard!");
          setShowShareModal(false);
        });
      } catch (err) {
        toast.error("Failed to copy link");
      }
    },
  };

  useEffect(() => {
    if (service && familyMemberModel) {
      const fetchFamilyMembers = async () => {
        try {
          const token = localStorage.getItem("medicomparestoken");
          if (!token) return;
          const response = await axiosUserInstance.get("family-member/list", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            setFamilyMembersData(response.data.data || []);
          }
        } catch (error) {
          toast.error("Error fetching family members:", error);
        }
      };
      fetchFamilyMembers();
    }
  }, [familyMemberModel, service]);

  useEffect(() => {
    if (bookingTarget && bookingTarget.tablet) {
      setSelectedTests([bookingTarget.tablet]);
      setBookingStep(1);
      setSearchQuery("");
      setSearchResults([]);
    }
  }, [bookingTarget]);

  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const response = await axiosCommonInstance.post("category/search", {
          serviceType: "labtests",
          search: searchQuery,
          page: 1,
          limit: 10,
        });
        if (response.data?.success) {
          setSearchResults(response.data.data?.products || []);
        } else {
          setSearchResults([]);
        }
      } catch (err) {
        console.error("Error searching lab tests:", err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const handleNavigateToBookingForSection = (vendor, med, effectiveVariantId, price, stock, path, service) => {
    const isSlots = path.includes("slot");
    const targetBookingType = "buy_now";
    if (service === "labtests" || service === "lab-tests") {
      setBookingTarget({ vendor, tablet: med, bookingType: targetBookingType, service });
      setFamilyMemberModel(true);
      return;
    }
    if (isSlots) {
      handleSlots(vendor, med, targetBookingType);
    } else {
      onVendorAction("booking", vendor, med, targetBookingType, service);
    }
  };

  const renderVendorItem = (vendor, vendorIndex) => {
    const matchedVendorVariant = vendor?.variant?.find(
      (v) => v.variantId === selectedVariantId || v._id === selectedVariantId,
    );
    const bookingType = vendor?.bookingType || "cart";
    const isServiceCategory = false;
    const serviceBookingTypes = [
      "consultation",
      "appointment",
      "rentals",
      "slots",
      "lead",
      "leads",
      "booking",
      "rentals_addtocarts",
      "cart",
    ];
    const isServiceType =
      serviceBookingTypes.includes(bookingType) || isServiceCategory;

    const stock = matchedVendorVariant?.stock ?? vendor?.stock ?? 0;
    const isStockFalse =
      matchedVendorVariant?.isStock === false ||
      vendor?.isStock === false ||
      matchedVendorVariant?.isStock === "false" ||
      vendor?.isStock === "false";
    const inStock =
      isServiceType || isServiceCategory
        ? !isStockFalse
        : !isStockFalse &&
        !!(matchedVendorVariant?.isStock && stock > 0);

    const qtyForVariant = getQuantityForVariant(tablet, vendor);
    const isSelectedVendor =
      selectedVendors[tablet._id] === vendor._id;
    const vendorPrice =
      getVendorPrice(vendor, tablet, selectedVariants) ||
      matchedVendorVariant?.price ||
      vendor?.price ||
      0;

    const discountPrice = matchedVendorVariant
      ? (matchedVendorVariant.discountprice || matchedVendorVariant.discountPrice || null)
      : (vendor?.discountprice || vendor?.discountPrice || null);

    // Calculate discount price based on discountType
    let calculatedDiscountPrice = discountPrice;
    const discountType = matchedVendorVariant
      ? (matchedVendorVariant.discountType || null)
      : (vendor?.discountType || null);

    if (
      discountType === "percentage" &&
      discountPrice &&
      discountPrice > 0
    ) {
      calculatedDiscountPrice =
        vendorPrice - (vendorPrice * discountPrice) / 100;
    }

    let discount = 0;
    if (
      calculatedDiscountPrice &&
      calculatedDiscountPrice > 0 &&
      calculatedDiscountPrice !== vendorPrice
    ) {
      if (calculatedDiscountPrice > vendorPrice) {
        discount = Math.round(
          ((calculatedDiscountPrice - vendorPrice) /
            calculatedDiscountPrice) *
          100,
        );
      } else {
        discount = Math.round(
          ((vendorPrice - calculatedDiscountPrice) / vendorPrice) *
          100,
        );
      }
    }

    return (
      <div
        key={vendorIndex}
        className="vendor-item-compact"
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "6px 8px",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          background: "#fff",
          marginBottom: "6px",
        }}
      >
        <div
          className="vendor-top-section"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            gap: "6px",
            width: "100%",
          }}
        >
          <div
            className="vendor-img"
            onClick={() => handleVendorClick(vendor)}
            style={{
              cursor: "pointer",
              width: "26px",
              height: "26px",
              borderRadius: "50%",
              overflow: "hidden",
              flexShrink: 0,
              border: "1px solid #e2e8f0",
            }}
          >
            {vendor?.bussinessdetails?.bussiness_image?.url ? (
              <img
                src={getImageUrl(
                  vendor.bussinessdetails.bussiness_image.url,
                )}
                alt={vendor?.bussinessdetails?.name || "Vendor"}
                title={vendor?.bussinessdetails?.name || "Vendor"}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  e.target.src = "/assets/default.png";
                }}
              />
            ) : (
              <div
                style={{
                  width: "26px",
                  height: "26px",
                  borderRadius: "50%",
                  background: "#f9fafb",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i
                  className="fas fa-store"
                  style={{ color: "#9ca3af", fontSize: "10px" }}
                ></i>
              </div>
            )}
          </div>
          <div
            className="vendor-info"
            style={{
              display: "flex",
              flexDirection: "column",
              minWidth: 0,
              alignItems: "flex-start",
              justifyContent: "flex-start",
            }}
          >
            <div
              className="vendor-name"
              style={{
                fontSize: "12px",
                fontWeight: "500",
                cursor: "pointer",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                lineHeight: "1.2",
                color: "#1e293b",
                display: "block",
                width: "100%",
                textAlign: "left",
                alignSelf: "flex-start",
              }}
              onClick={() => handleVendorClick(vendor)}
              title={vendor?.bussinessdetails?.name || "Vendor"}
            >
              {vendor?.bussinessdetails?.name || "Vendor"}
              {vendor?.averageRating && vendor?.ratingCount && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "2px",
                    fontSize: "9px",
                    color: "#666",
                    marginTop: "1px",
                    marginBottom: "2px",
                  }}
                >
                  <i
                    className="fas fa-star"
                    style={{
                      color: "#ffc107",
                      fontSize: "8px",
                    }}
                  ></i>
                  <span style={{ fontWeight: "500" }}>
                    {vendor.averageRating.toFixed(1)}
                  </span>
                  <span style={{ color: "#999" }}>
                    ({vendor.ratingCount}+)
                  </span>
                </div>
              )}
            </div>
            {vendor?.distanceInKm && (
              <div
                className="vendor-distance"
                style={{
                  fontSize: "9px",
                  color: "#6b7280",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <i
                  className="fas fa-location-dot"
                  style={{ marginRight: "2px", fontSize: "7px" }}
                ></i>
                {Number(vendor.distanceInKm).toFixed(1)} km away
              </div>
            )}
          </div>
        </div>

        <div
          className="vendor-price-section"
          style={{
            width: "100%",
            marginTop: "2px",
          }}
        >
          <div
            className="vendor-price"
            style={{
              display: "flex",
              gap: "3px",
              alignItems: "baseline",
              fontSize: "11px",
              justifyContent: "flex-start",
              flexWrap: "wrap",
            }}
          >
            {calculatedDiscountPrice &&
              calculatedDiscountPrice > 0 &&
              calculatedDiscountPrice !== vendorPrice ? (
              calculatedDiscountPrice > vendorPrice ? (
                <>
                  <span
                    className="new"
                    style={{ fontWeight: "600", color: "#111827" }}
                  >
                    ₹{Number(vendorPrice).toFixed(2)}
                  </span>
                  <span
                    className="old"
                    style={{
                      fontSize: "9.5px",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹{Number(calculatedDiscountPrice).toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  <span
                    className="new"
                    style={{ fontWeight: "600", color: "#111827" }}
                  >
                    ₹{Number(calculatedDiscountPrice).toFixed(2)}
                  </span>
                  <span
                    className="old"
                    style={{
                      fontSize: "9.5px",
                      textDecoration: "line-through",
                    }}
                  >
                    ₹{Number(vendorPrice).toFixed(2)}
                  </span>
                </>
              )
            ) : (
              <span
                className="new"
                style={{ fontWeight: "600", color: "#111827" }}
              >
                ₹{Number(vendorPrice).toFixed(2)}
              </span>
            )}

            {discount > 0 && (
              <span
                className="off"
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  fontSize: "8px",
                  padding: "0.5px 3px",
                  borderRadius: "3px",
                  fontWeight: "500",
                  marginLeft: "2px",
                }}
              >
                {discountType === "percentage" && discountPrice
                  ? `${discountPrice}% OFF`
                  : `${discount}% OFF`}
              </span>
            )}

            {vendor?.perDayRent && (
              <div
                style={{
                  fontSize: "9px",
                  color: "#8059ca",
                  fontWeight: "500",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                  marginTop: "1px",
                }}
              >
                <i
                  className="fas fa-calendar-day"
                  style={{ fontSize: "7px" }}
                ></i>
                <span>₹{vendor.perDayRent} per day</span>
              </div>
            )}
          </div>
        </div>

        <div
          className="vendor-actions-compact w-100"
          style={{
            display: "flex",
            gap: "4px",
            marginTop: "4px",
          }}
        >
          <div style={{ flex: 1 }}>
            <VendorActions
              bookingType={bookingType}
              isStockFalse={isStockFalse}
              isServiceType={isServiceType}
              med={tablet}
              vendor={vendor}
              effectiveVariantId={selectedVariantId}
              price={vendorPrice}
              service={service}
              calculatedDiscountPrice={calculatedDiscountPrice}
              handleRentalBookinProcess={handleRent}
              handleNavigateToBooking={handleNavigateToBookingForSection}
              handleAddLead={handleAddLead}
              handleOpenConsultationModal={handleConsultation}
              handleOpenAppointmentModal={handleAppointment}
              className="w-100"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="product-vendors-section-full" style={{ position: "relative" }}>
      {/* Inline view: Default to all if showAllVendors is true */}
      {showAllVendors && (
        <div className="vendors-list-compact" style={{ maxHeight: "none", opacity: 1, overflow: "visible" }}>
          {vendors.map((vendor, vendorIndex) => renderVendorItem(vendor, vendorIndex))}
        </div>
      )}

      {/* Wrapper container to position the overlay exactly above the toggle bar (only if not showAllVendors) */}
      {!showAllVendors && (
        <div style={{ position: "relative", marginTop: "8px" }}>
          {/* Toggle Bar to Compare Others */}
          {vendors.length > 0 ? (
            <div
              className="vendors-section-header clickable d-flex justify-content-between align-items-center"
              onClick={handleToggle}
              style={{
                background: "linear-gradient(135deg, #f5f3ff 0%, #f0ebff 100%)",
                border: "1px solid #d8b4fe",
                borderRadius: "10px",
                padding: "6px 14px",
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(124, 58, 237, 0.04)",
                transition: "all 0.2s ease-in-out"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #ede9fe 0%, #e4daff 100%)";
                e.currentTarget.style.borderColor = "#c084fc";
                e.currentTarget.style.boxShadow = "0 3px 6px rgba(124, 58, 237, 0.08)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "linear-gradient(135deg, #f5f3ff 0%, #f0ebff 100%)";
                e.currentTarget.style.borderColor = "#d8b4fe";
                e.currentTarget.style.boxShadow = "0 2px 4px rgba(124, 58, 237, 0.04)";
              }}
            >
              <div className="vendors-header-left d-flex align-items-center">
                <i className="fa-solid fa-right-left me-2" style={{ color: "#7c3aed", fontSize: "11px" }}></i>
                <span style={{ fontSize: "11.5px", fontWeight: "700", color: "#7c3aed", letterSpacing: "0.01em" }}>
                  Compare
                </span>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge text-white border-0" style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "20px", background: "#7c3aed" }}>
                  {vendors.length} Available
                </span>
                <i className="fas fa-chevron-down" style={{
                  color: "#7c3aed",
                  fontSize: "10px",
                  transition: "transform 0.2s",
                  transform: isExpanded ? "rotate(180deg)" : "none"
                }}></i>
              </div>
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ position: "relative", marginTop: "4px" }}>
              <div
                className="vendors-section-header d-flex justify-content-between align-items-center"
                style={{
                  background: "#fafafa",
                  border: "1px dashed #cbd5e1",
                  borderRadius: "10px",
                  padding: "6px 12px",
                  cursor: "default"
                }}
              >
                <div className="vendors-header-left d-flex align-items-center">
                  <i className="fa-solid fa-right-left me-2" style={{ color: "#a3a3a3", fontSize: "10px" }}></i>
                  <span style={{ fontSize: "11px", fontWeight: "500", color: "#8c8c8c", letterSpacing: "0.02em" }}>
                    Not available
                  </span>
                </div>
                <span className="badge text-secondary border-0" style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "4px", background: "#f0f0f0" }}>0</span>
              </div>
            </div>
          ) : null}

          {/* Upward Floating Overlay for Comparing All Vendors */}
          {isExpanded && (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                bottom: "calc(100% + 4px)", // 4px gap exactly above the header
                left: 0,
                right: 0,
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                boxShadow: "0 -4px 20px rgba(0, 0, 0, 0.12)",
                zIndex: 9999,
                padding: "12px",
                display: "flex",
                flexDirection: "column",
                maxHeight: "250px",
              }}
            >
              {/* Header */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
                paddingBottom: "8px",
                borderBottom: "1px solid #f1f5f9"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <i className="fa-solid fa-right-left" style={{ color: "#8059ca", fontSize: "13px" }}></i>
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "#1e293b" }}>Compare</span>
                  <span style={{ fontSize: "11px", color: "#64748b", background: "#f1f5f9", padding: "2px 6px", borderRadius: "12px", fontWeight: "600" }}>
                    {vendors.length}
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    border: "none",
                    background: "#f1f5f9",
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    padding: 0,
                  }}
                  onClick={handleToggle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e2e8f0";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f1f5f9";
                    e.currentTarget.style.color = "#64748b";
                  }}
                >
                  <i className="fas fa-times" style={{ fontSize: "10px" }}></i>
                </button>
              </div>

              {/* Scroll Up Button Indicator */}
              {showScrollUp && (
                <div
                  style={{
                    position: "absolute",
                    top: "45px",
                    left: "12px",
                    right: "12px",
                    height: "28px",
                    background: "linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0))",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    scrollContainerRef.current?.scrollBy({ top: -80, behavior: "smooth" });
                  }}
                >
                  <i className="fas fa-chevron-up" style={{ color: "#8059ca", fontSize: "12px" }}></i>
                </div>
              )}

              {/* Scrollable List of All Vendors */}
              <div
                ref={scrollContainerRef}
                onScroll={updateScrollIndicators}
                style={{ flex: 1, overflowY: "auto", paddingRight: "2px" }}
              >
                {vendors.map((vendor, vendorIndex) => renderVendorItem(vendor, vendorIndex))}
              </div>

              {/* Scroll Down Button Indicator */}
              {showScrollDown && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "12px",
                    left: "12px",
                    right: "12px",
                    height: "28px",
                    background: "linear-gradient(to top, rgba(255,255,255,0.95), rgba(255,255,255,0))",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 10,
                    cursor: "pointer"
                  }}
                  onClick={() => {
                    scrollContainerRef.current?.scrollBy({ top: 80, behavior: "smooth" });
                  }}
                >
                  <i className="fas fa-chevron-down" style={{ color: "#8059ca", fontSize: "12px" }}></i>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {
        typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Share  */}
            <ShareModal
              show={showShareModal}
              onClose={() => setShowShareModal(false)}
              onShare={handleShare}
            />

            {/* Lead Modal */}
            <LeadModal
              show={showLeadModal}
              onClose={() => {
                setShowLeadModal(false);
                setLeadFormData(INITIAL_LEAD_FORM);
                setCurrentLeadData(null);
              }}
              formData={leadFormData}
              onChange={(e) =>
                setLeadFormData((p) => ({
                  ...p,
                  [e.target.name]: e.target.value,
                }))
              }
              productId={currentMed?._id}
              vendorId={currentVendor?.vendorId || currentVendor?._id}
              variantId={currentVariantId}
              onSubmit={handleSubmitLead}
              fixedType={leadFormData.fixedType}
            />

            {/* Rent Modal */}
            <RentModal
              show={showRentModal}
              onClose={() => {
                setShowRentModal(false);
                setRentProduct(null);
              }}
              rentProduct={rentProduct}
              formData={rentFormData}
              onFormChange={handleRentFormChange}
              onSubmit={handleRentSubmit}
              productId={currentMed?._id}
              vendorId={currentVendor?.vendorId || currentVendor?._id}
              variantId={currentVariantId}
              fixedType={rentProduct?.fixedType || getFixedType(currentMed)}
            />

            {/* Consultation Modal */}
            <ConsultationModal
              show={showConsultationModal}
              onClose={toggleConsultationModal}
              formData={consultationFormData}
              onFormChange={handleConsultationFormChange}
              onSubmit={handleConsultationSubmit}
              productId={currentMed?._id}
              vendorId={currentVendor?.vendorId || currentVendor?._id}
              variantId={currentVariantId}
              fixedType={
                consultationFormData.category || getFixedType(currentMed)
              }
            />

            {/* Appointment Modal */}
            <AppointmentModal
              show={showAppointmentModal}
              onClose={() => setShowAppointmentModal(false)}
              formData={appointmentFormData}
              onFormChange={handleAppointmentFormChange}
              onSubmit={handleAppointmentSubmit}
              productId={currentMed?._id}
              vendorId={currentVendor?.vendorId || currentVendor?._id}
              variantId={currentVariantId}
              title="Book an Appointment"
              fixedType={
                appointmentFormData.category || getFixedType(currentMed)
              }
            />
            <FamilyMemberSelectionModal
              show={familyMemberModel}
              onClose={() => {
                setFamilyMemberModel(false);
                setBookingTarget(null);
              }}
              userProfile={userProfile}
              selectedPatients={selectedPatients}
              setSelectedPatients={setSelectedPatients}
              onProceed={async (patients, familyMembers) => {
                if (patients.length === 0) {
                  toast.error("Please select at least one patient");
                  return;
                }
                if (selectedTests.length === 0) {
                  toast.error("Please select at least one test to book");
                  return;
                }
                const authToken = localStorage.getItem("medicomparestoken");
                if (!authToken) {
                  toast.error("Please login to create booking");
                  navigate("/login");
                  return;
                }

                const labTestPatients = patients.map(id => ({
                  selectType: id === "self" ? "self" : "family",
                  patientId: id === "self" ? null : id
                }));

                const payload = selectedTests.map((test) => {
                  const variantId = test.variant?.[0]?._id || test.variants?.[0]?._id;
                  return {
                    productId: test._id,
                    variantId: variantId || null,
                    vendorId: bookingTarget.vendor._id,
                    packageId: null,
                    type: "normal",
                    bookingType: bookingTarget.bookingType || "buy_now",
                    labTestPatients,
                    servicefixedTypes: service || bookingTarget.service
                  };
                });

                try {
                  const response = await axiosCommonInstance.post(
                    "cart/buynow/create",
                    payload,
                    {
                      headers: {
                        Authorization: `Bearer ${authToken}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );
                  setFamilyMemberModel(false);
                  setBookingTarget(null);
                  navigate("/booking-process", { state: { bookingData: response.data } });
                } catch (error) {
                  console.error("Booking error:", error);
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    navigate("/login");
                  } else {
                    toast.error("Something went wrong while creating booking.");
                  }
                }
              }}
            />
          </>,
          document.body,
        )
      }
    </div>
  );
};

export default VendorsSection;
