import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../Apiservice.jsx";
import { CartQuantityControls } from "../ui";
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
  // if (!vendors || vendors.length === 0) return null;
  if (!vendors || vendors.length === 0) {
    return (
      <div className="product-vendors-section-full">
        <div className="vendors-section-header clickable">
          <div className="vendors-header-left">
            <i className="fa-solid fa-right-left me-2"></i>
            <span style={{ fontSize: "12px", fontWeight: "600" }}>
              Compare Others
            </span>
            <span className="vendor-count-badge">0</span>
          </div>
        </div>
        <div className="vendors-list-compact collapsed">
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "#6b7280",
              fontSize: "14px",
              fontStyle: "italic",
            }}
          >
            <i
              className="fas fa-store-slash"
              style={{ marginRight: "8px", fontSize: "16px" }}
            ></i>
            No vendors available
          </div>
        </div>
      </div>
    );
  }

  const selectedVariantId =
    selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
  const isExpanded = expandedVendors[tablet._id];
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

  // Handler for slots booking
  const handleSlots = async (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book slot");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      const variantId = selectedVariants[med._id] || med.variant?.[0]?._id;
      await axiosCommonInstance.post(
        "cart/buynow/create",
        [
          {
            productId: med._id,
            variantId,
            vendorId: vendor._id,
            packageId: null,
            type: "normal",
            bookingType: "buy_now",
          },
        ],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      navigate("/booking-process/slot");
    } catch (error) {
      toast.error(
        error.response?.status === 401 ? "Session expired" : "Booking failed",
      );
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

  // Handler for rentals
  const handleRent = async (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to rent");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");

      if (vendor?.perDayRent) {
        localStorage.setItem("perDayRent", vendor.perDayRent);
      }

      const variantId = selectedVariants[med._id] || med.variants?.[0]?._id;
      await axiosCommonInstance.post(
        "cart/buynow/create",
        [
          {
            productId: med._id,
            variantId,
            vendorId: vendor._id,
            packageId: null,
            type: "normal",
            bookingType: "buy_now",
            perDayRent: vendor?.perDayRent || 0,
          },
        ],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      navigate("/rental-booking-process");
    } catch (error) {
      toast.error(
        error.response?.status === 401 ? "Session expired" : "Renting failed",
      );
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

  return (
    <div className="product-vendors-section-full">
      <div className="vendors-section-header clickable" onClick={handleToggle}>
        <div className="vendors-header-left">
          <i className="fa-solid fa-right-left me-2"></i>
          <span style={{ fontSize: "12px", fontWeight: "600" }}>
            Compare Others
          </span>
          <span className="vendor-count-badge">{vendors.length}</span>
        </div>
        <i
          className={`fas fa-chevron-${isExpanded ? "up" : "down"
            } vendors-toggle-icon`}
        ></i>
      </div>
      <div
        className={`vendors-list-compact ${isExpanded ? "expanded" : "collapsed"
          }`}
        style={{ overflowY: "scroll" }}
      >
        <div>
          {vendors
            .slice(0, showAllVendors ? vendors.length : 1)
            .map((vendor, vendorIndex) => {
              const matchedVendorVariant = vendor?.variant?.find(
                (v) => v.variantId === selectedVariantId,
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

              const maxStock =
                vendor?.stock ||
                matchedVendorVariant?.stock ||
                tablet?.variant?.find((v) => v._id === selectedVariantId)
                  ?.stock ||
                999;
              const qtyForVariant = getQuantityForVariant(tablet, vendor);
              const isSelectedVendor =
                selectedVendors[tablet._id] === vendor._id;
              const vendorPrice =
                getVendorPrice(vendor, tablet, selectedVariants) ||
                matchedVendorVariant?.price ||
                vendor?.price ||
                0;

              const discountPrice =
                matchedVendorVariant?.discountprice ||
                matchedVendorVariant?.discountPrice ||
                vendor?.discountprice ||
                vendor?.discountPrice ||
                null;

              // Calculate discount price based on discountType
              let calculatedDiscountPrice = discountPrice;
              const discountType =
                matchedVendorVariant?.discountType ||
                vendor?.discountType ||
                null;

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
                    padding: "8px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    background: "#fff",
                    marginBottom: "8px",
                  }}
                >
                  <div
                    className="vendor-top-section"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: "8px",
                      width: "100%",
                    }}
                  >
                    <div
                      className="vendor-img"
                      onClick={() => handleVendorClick(vendor)}
                      style={{
                        cursor: "pointer",
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        overflow: "hidden",
                        flexShrink: 0,
                        border: "1px solid #e5e7eb",
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
                            width: "32px",
                            height: "32px",
                            borderRadius: "50%",
                            background: "#f9fafb",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <i
                            className="fas fa-store"
                            style={{ color: "#9ca3af", fontSize: "12px" }}
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
                          fontSize: "13px",
                          fontWeight: "500",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          lineHeight: "1.3",
                          color: "#374151",
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
                              gap: "4px",
                              fontSize: "10px",
                              color: "#666",
                              marginTop: "2px",
                              marginBottom: "4px",
                            }}
                          >
                            <i
                              className="fas fa-star"
                              style={{
                                color: "#ffc107",
                                fontSize: "9px",
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
                            fontSize: "10px",
                            color: "#6b7280",
                            display: "flex",
                            alignItems: "center",
                          }}
                        >
                          <i
                            className="fas fa-location-dot"
                            style={{ marginRight: "2px", fontSize: "8px" }}
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
                    }}
                  >
                    <div
                      className="vendor-price"
                      style={{
                        display: "flex",
                        gap: "4px",
                        alignItems: "baseline",
                        fontSize: "12px",
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
                                fontSize: "11px",
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
                                fontSize: "11px",
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
                            fontSize: "9px",
                            padding: "1px 4px",
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
                            fontSize: "10px",
                            color: "#8059ca",
                            fontWeight: "500",
                            display: "flex",
                            alignItems: "center",
                            gap: "2px",
                            marginTop: "2px",
                          }}
                        >
                          <i
                            className="fas fa-calendar-day"
                            style={{ fontSize: "8px" }}
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
                    }}
                  >
                    {bookingType === "leads" && (
                      <button
                        type="button"
                        className="vendor-action-btn pd-btn-lead w-100"
                        onClick={(e) => {
                          if (isStockFalse) return;
                          const variantId = tablet.variants?.[0]?._id || null;
                          handleAddLead(vendor, tablet, variantId);
                        }}
                        disabled={isStockFalse}
                      >
                        Get An Enquiry
                      </button>
                    )}
                    {bookingType === "booking" && (
                      <button
                        type="button"
                        className="vendor-action-btn vendor-book-btn w-100"
                        onClick={(e) => {
                          if (isStockFalse) return;
                          onVendorAction(
                            "booking",
                            vendor,
                            tablet,
                            bookingType,
                          );
                        }}
                        disabled={isStockFalse}
                      >
                        <i className="fas fa-calendar-check"></i>Book Now
                      </button>
                    )}
                    {bookingType === "slots" && (
                      <button
                        type="button"
                        className="vendor-action-btn pd-btn-lead w-100"
                        onClick={(e) => {
                          if (isStockFalse) return;
                          handleSlots(vendor, tablet, bookingType);
                        }}
                        disabled={isStockFalse}
                      >
                        <i className="fa-solid fa-clock"></i>Slot
                      </button>
                    )}
                    {bookingType === "rentals" && (
                      <button
                        type="button"
                        className="vendor-action-btn pd-btn-lead"
                        onClick={(e) => {
                          if (isStockFalse) return;
                          handleRent(vendor, tablet);
                        }}
                        disabled={isStockFalse || !vendor?.perDayRent}
                        style={{
                          opacity: vendor?.perDayRent ? 1 : 0.6,
                          cursor: vendor?.perDayRent
                            ? "pointer"
                            : "not-allowed",
                        }}
                      >
                        <i className="fa-solid fa-clipboard-check"></i>Rent
                      </button>
                    )}
                    {bookingType === "consultation" && (
                      <button
                        type="button"
                        className="vendor-action-btn pd-btn-lead w-100"
                        onClick={(e) => {
                          if (isStockFalse) return;
                          handleConsultation(vendor, tablet);
                        }}
                        disabled={isStockFalse}
                      >
                        <i className="fa-solid fa-comments"></i>Consultation
                      </button>
                    )}
                    {bookingType === "appointment" && (
                      <button
                        type="button"
                        className="vendor-action-btn pd-btn-lead w-100"
                        onClick={(e) => {
                          if (isStockFalse) return;
                          handleAppointment(vendor, tablet);
                        }}
                        disabled={isStockFalse}
                      >
                        <i className="fa-solid fa-calendar-check"></i>
                        Appointment
                      </button>
                    )}
                    {bookingType === "rentals_addtocarts" && (
                      <div
                        style={contailerStyles}
                        className="d-flex gap-2 w-100"
                      >
                        {inStock ? (
                          <CartQuantityControls
                            rentAndCartButtonStyles={rentAndCartButtonStyles}
                            contailerStyles={contailerStyles}
                            item={{
                              tabletdetails: tablet,
                              vendordetails: vendor?.bussinessdetails || vendor,
                              variants: tablet.variant,
                              vendorId: vendor._id,
                              price:
                                calculatedDiscountPrice &&
                                  calculatedDiscountPrice > 0
                                  ? calculatedDiscountPrice
                                  : vendorPrice,
                              discountprice: calculatedDiscountPrice,
                              perDayRent: vendor.perDayRent,
                            }}
                            variant={tablet.variant?.find(
                              (v) => v._id === selectedVariantId,
                            )}
                            maxStock={maxStock}
                            options={{
                              bookingType: "cart",
                              type: "normal",
                            }}
                            className="vendor-cart-controls w-100"
                          />
                        ) : (
                          <button
                            className="vendor-action-btn vendor-disabled-btn"
                            disabled
                            style={{ width: "100%" }}
                          >
                            <i className="fas fa-ban"></i>Unavailable
                          </button>
                        )}
                        <button
                          type="button"
                          className="vendor-action-btn vendor-rent-btn"
                          onClick={(e) => {
                            if (isStockFalse) return;
                            handleRent(vendor, tablet);
                          }}
                          style={{
                            marginTop: inStock ? "0px" : "0",
                            ...rentAndCartButtonStyles,
                            width: "100%",
                            opacity: vendor?.perDayRent ? 1 : 0.6,
                            cursor: vendor?.perDayRent
                              ? "pointer"
                              : "not-allowed",
                            backgroundColor: "#f3effa",
                            color: "#8059ca",
                            border: "1px solid rgba(128, 89, 202, 0.2)",
                            fontWeight: "600"
                          }}
                          disabled={isStockFalse || !vendor?.perDayRent}
                        >
                          <i className="fa-solid fa-clipboard-check me-1"></i>
                          Rent
                        </button>
                      </div>
                    )}

                    {bookingType === "cart" &&
                      !inStock &&
                      !isServiceCategory && (
                        <button
                          type="button"
                          className="vendor-action-btn vendor-disabled-btn"
                          disabled
                        >
                          <i className="fas fa-ban"></i>Unavailable
                        </button>
                      )}

                    {bookingType === "cart" &&
                      (inStock || isServiceCategory) && (
                        <CartQuantityControls
                          item={{
                            tabletdetails: tablet,
                            vendordetails: vendor?.bussinessdetails || vendor,
                            variants: tablet.variant,
                            vendorId: vendor._id,
                            price:
                              discountPrice && discountPrice > 0
                                ? discountPrice
                                : vendorPrice,
                            discountprice: discountPrice,
                          }}
                          variant={tablet.variant?.find(
                            (v) => v._id === selectedVariantId,
                          )}
                          maxStock={maxStock}
                          options={{
                            bookingType: "cart",
                            type: "normal",
                          }}
                          className="vendor-cart-controls w-50"
                        />
                      )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
      {/* {totalVendorsCount > 1 && (
        <div className="vendors-more-link">
          <span onClick={() => navigate(`/${service}/${id}/${tablet.slug}`)}>
            View All <i className="fas fa-arrow-right"></i>
          </span>
        </div>
      )} */}

      {typeof document !== "undefined" &&
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
          </>,
          document.body,
        )}
    </div>
  );
};

export default VendorsSection;
