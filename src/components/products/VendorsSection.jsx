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
  prescription = false,
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
      <div className="relative">
        {/* Toggle Bar with 0 offers */}
        {!showAllVendors && (
          <div style={{ position: "relative", marginTop: "4px" }}>
            <div
              className="flex justify-between items-center bg-[#fafafa] border border-dashed border-slate-300 rounded-sm py-1.5 px-3 cursor-default"
            >
              <div className="flex items-center">
                <i className="fa-solid fa-right-left mr-2 style-vendor-icon" style={{ color: "#a3a3a3", fontSize: "10px" }}></i>
                <span className="text-[11px] font-medium text-[#8c8c8c] tracking-wide">
                  Not available
                </span>
              </div>
              <span className="inline-block text-[10px] px-1.5 py-0.5 rounded-[4px] bg-[#f0f0f0] text-gray-500 font-medium border-0">0</span>
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
        className="flex flex-col p-2.5 border border-slate-200 bg-white rounded-sm mb-1.5 transition-all hover:border-purple-200"
      >
        <div className="flex items-center gap-2.5 w-full">
          <div
            className="cursor-pointer w-7 h-7 rounded-full overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center bg-slate-50"
            onClick={() => handleVendorClick(vendor)}
          >
            {vendor?.bussinessdetails?.bussiness_image?.url ? (
              <img
                src={getImageUrl(
                  vendor.bussinessdetails.bussiness_image.url,
                )}
                alt={vendor?.bussinessdetails?.name || "Vendor"}
                title={vendor?.bussinessdetails?.name || "Vendor"}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "/assets/default.png";
                }}
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-slate-50 flex items-center justify-center">
                <i
                  className="fas fa-store text-slate-400 text-[10px]"
                ></i>
              </div>
            )}
          </div>
          <div className="flex flex-col min-w-0 items-start justify-center flex-1">
            <div
              className="text-xs font-semibold text-slate-700 cursor-pointer truncate w-full text-left line-clamp-1 flex items-center gap-1.5"
              onClick={() => handleVendorClick(vendor)}
              title={vendor?.bussinessdetails?.name || "Vendor"}
            >
              <span className="truncate max-w-full block">{vendor?.bussinessdetails?.name || "Vendor"}</span>
              {!!vendor?.averageRating && !!vendor?.ratingCount && (
                <div className="flex items-center gap-0.5 text-[9px] text-slate-400 font-medium">
                  <i
                    className="fas fa-star text-amber-400 text-[8px]"
                  ></i>
                  <span className="font-semibold text-slate-600">
                    {vendor.averageRating.toFixed(1)}
                  </span>
                  <span>
                    ({vendor.ratingCount}+)
                  </span>
                </div>
              )}
            </div>
            {vendor?.distanceInKm && (
              <div className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                <i
                  className="fas fa-location-dot text-[8px]"
                ></i>
                <span>{Number(vendor.distanceInKm).toFixed(1)} km away</span>
              </div>
            )}
          </div>
        </div>

        <div className="w-full mt-2">
          <div className="flex items-baseline gap-1.5 text-xs flex-wrap">
            {calculatedDiscountPrice &&
              calculatedDiscountPrice > 0 &&
              calculatedDiscountPrice !== vendorPrice ? (
              calculatedDiscountPrice > vendorPrice ? (
                <>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(vendorPrice).toFixed(2)}
                  </span>
                  <span className="text-[9.5px] text-slate-400 line-through">
                    ₹{Number(calculatedDiscountPrice).toFixed(2)}
                  </span>
                </>
              ) : (
                <>
                  <span className="font-semibold text-slate-800">
                    ₹{Number(calculatedDiscountPrice).toFixed(2)}
                  </span>
                  <span className="text-[9.5px] text-slate-400 line-through">
                    ₹{Number(vendorPrice).toFixed(2)}
                  </span>
                </>
              )
            ) : (
              <span className="font-semibold text-slate-800">
                ₹{Number(vendorPrice).toFixed(2)}
              </span>
            )}

            {discount > 0 && (
              <span className="bg-red-500 text-white text-[8px] px-1 py-0.5 rounded font-bold ml-1">
                {discountType === "percentage" && discountPrice
                  ? `${discountPrice}% OFF`
                  : `${discount}% OFF`}
              </span>
            )}

            {vendor?.perDayRent && (
              <div className="text-[9px] text-[#321961] font-medium flex items-center gap-1 mt-0.5">
                <i
                  className="fas fa-calendar-day text-[7px]"
                ></i>
                <span>₹{vendor.perDayRent} per day</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-1 mt-2.5 w-full">
          <div className="flex-1">
            <VendorActions
              bookingType={bookingType}
              isStockFalse={isStockFalse}
              isServiceType={isServiceType}
              prescription={prescription}
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
              className="w-full"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="relative w-full">
      {/* Inline view: Default to all if showAllVendors is true */}
      {showAllVendors && (
        <div className="flex flex-col gap-2">
          {vendors.map((vendor, vendorIndex) => renderVendorItem(vendor, vendorIndex))}
        </div>
      )}

      {/* Wrapper container to position the overlay exactly above the toggle bar (only if not showAllVendors) */}
      {!showAllVendors && (
        <div className="relative mt-2">
          {/* Toggle Bar to Compare Others */}
          {vendors.length > 0 ? (
            <div
              className="flex justify-between items-center bg-gradient-to-r from-purple-50 to-indigo-50/30  !rounded-sm px-3.5 py-1.5 cursor-pointer shadow-sm hover:from-purple-100/60 hover:to-indigo-50 transition-all"
              onClick={handleToggle}
            >
              <div className="flex items-center gap-1.5">
                <i className="fa-solid fa-right-left text-[#321961] text-[11px]"></i>
                <span className="text-[11.5px] font-bold text-[#321961] tracking-wide">
                  Compare
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-[#321961] text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                  {vendors.length} Available
                </span>
                <i className={`fas fa-chevron-down text-[#321961] text-[10px] transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}></i>
              </div>
            </div>
          ) : vendors.length === 0 ? (
            <div className="relative mt-1">
              <div className="flex justify-between items-center bg-slate-50 border border-dashed border-slate-300 rounded-xl px-3 py-1.5 cursor-default">
                <div className="flex items-center gap-1.5">
                  <i className="fa-solid fa-right-left text-slate-400 text-[10px]"></i>
                  <span className="text-[11px] font-medium text-slate-500 tracking-wide">
                    Not available
                  </span>
                </div>
                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded font-semibold">0</span>
              </div>
            </div>
          ) : null}

          {isExpanded && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-white rounded-xl shadow-[0_15px_40px_rgba(128,89,202,0.18),0_5px_15px_rgba(0,0,0,0.06)] z-[9999] p-4 flex flex-col max-h-[280px] border-0"
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-3 pb-2.5 border-b border-slate-100 bg-gradient-to-r from-purple-50/40 to-transparent -mx-3.5 -mt-3.5 px-3.5 pt-2.5 rounded-t-sm">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-purple-50 flex items-center justify-center">
                    <i className="fa-solid fa-right-left text-[#321961] text-[10px]"></i>
                  </div>
                  <span className="font-bold text-[12.5px] text-slate-800 tracking-wide">Compare Offers</span>
                  <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full font-bold">
                    {vendors.length}
                  </span>
                </div>
                <div
                  className="bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 w-6 h-6 !rounded-full flex items-center justify-center transition-all duration-150 cursor-pointer"
                  onClick={handleToggle}
                >
                  <i className="fas fa-times text-[9px]"></i>
                </div>
              </div>

              {/* Scroll Up Button Indicator */}
              {showScrollUp && (
                <div
                  className="absolute top-[48px] left-3.5 right-3.5 h-8 bg-gradient-to-b from-white/95 via-white/80 to-transparent flex justify-center items-center z-10 cursor-pointer transition-opacity duration-200"
                  onClick={() => {
                    scrollContainerRef.current?.scrollBy({ top: -80, behavior: "smooth" });
                  }}
                >
                  <div className="bg-white shadow-sm border border-slate-100 rounded-full w-6 h-6 flex items-center justify-center hover:scale-105 transition-transform">
                    <i className="fas fa-chevron-up text-[#321961] text-[10px]"></i>
                  </div>
                </div>
              )}

              {/* Scrollable List of All Vendors */}
              <div
                ref={scrollContainerRef}
                onScroll={updateScrollIndicators}
                className="flex-1 overflow-y-auto pr-0.5 scrollbar-thin space-y-2"
              >
                {vendors.map((vendor, vendorIndex) => renderVendorItem(vendor, vendorIndex))}
              </div>

              {/* Scroll Down Button Indicator */}
              {showScrollDown && (
                <div
                  className="absolute bottom-3.5 left-3.5 right-3.5 h-8 bg-gradient-to-t from-white/95 via-white/80 to-transparent flex justify-center items-center z-10 cursor-pointer transition-opacity duration-200"
                  onClick={() => {
                    scrollContainerRef.current?.scrollBy({ top: 80, behavior: "smooth" });
                  }}
                >
                  <div className="bg-white shadow-sm border border-slate-100 rounded-full w-6 h-6 flex items-center justify-center hover:scale-105 transition-transform">
                    <i className="fas fa-chevron-down text-[#321961] text-[10px]"></i>
                  </div>
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
