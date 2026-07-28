import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import Slider from "react-slick";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import { CartQuantityControls, VendorActions } from "../../../components/ui";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import LeadModal from "../pharmacy/products-components/LeadModal.jsx";
import RentModal from "../pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../pharmacy/products-components/AppointmentModal.jsx";
import { useCart, useResponsive } from "../../../hooks";
import { useProfile } from "../../../context/ProfileContext";
import DynamicCategorySections from "../../../components/home/DynamicCategorySections.jsx";
import { getHealthcareSwiperSettings } from "./healthcareSliderSettings.jsx";
import { redirectToLoginWithPendingBooking } from "../../../utils/pendingBookingUtils";
import SEOHelmet from "../../../components/SEOHelmet";


const labtests = ({
  service,
  imgUrl,
  packages,
  handleCompareToggle,
  handleBook,
  cheaplabtests,
  handleAddToCart,
  compareItems,
  currentService,
  clearAllCompare,
  handleCompareBar,
  middleBanners,
  settings,
  countdown,
  showDiscountPopup,
  setShowDiscountPopup,
  handleProductClick,
  handleVendorClick,
  handleCompareClick,
  sections,
  serviceDetails
}) => {
  // details...
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const { isMobile } = useResponsive();
  const [rentProduct, setRentProduct] = useState(null);
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();
  const [hoveredCompareId, setHoveredCompareId] = useState(null);

  // Form data states
  const INITIAL_LEAD_FORM = {
    date: "",
    name: "",
    email: "",
    mobile: "",
    policyNumber: "",
    relation: "",
    address: "",
  };
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

  const {
    getCartQuantity: getCartQuantityFromHook,
    incrementItem,
    decrementItem,
  } = useCart();

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  // Cart helper
  const getCartQuantity = (vendorId, prodId, variantId) => {
    if (!isLoggedIn) {
      return 0;
    }
    return getCartQuantityFromHook(vendorId, prodId, variantId);
  };


  // console.log("servicedetails", serviceDetails)

  // Handler functions for vendor actions
  const handleAddLead = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login");
      navigate("/login");
      return;
    }

    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    setCurrentLeadData({ vendor, med, variantId });
    const today = new Date().toISOString().split("T")[0];
    setLeadFormData({
      ...INITIAL_LEAD_FORM,
      date: today,
      relation: "self",
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      mobile: userProfile?.phone || "",
      email: userProfile?.email || "",
    });
    setShowLeadModal(true);
  };

  const buildVendorTestBookPayload = (test) => [
    {
      productId: test?.name,
      variantId: null,
      vendorId: test?.vendorId,
      packageId: null,
      type: "normal",
      bookingType: "buy_now",
    },
  ];

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id || med?.name,
      variantId: effectiveVariantId || null,
      vendorId: vendor?.vendorId || vendor?._id || vendor?.businessDetails?._id,
      // servicefixedTypes: serviceDetails?.fixedType || med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "labtests",
      servicefixedTypes: serviceDetails,
      packageId: med?._id || null,
      navigate,
      redirectPath: path || "/booking-process",
    });
  };

  const handleSlots = async (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to select slot");
      navigate("/login");
      return;
    }
    await handleBooking(vendor, med, null, 0, 999, "/booking-process/slot");
  };

  const handleRentalBookinProcess = async (vendor, med, effectiveVariantId, price, stock, servicePassed) => {
    await handleRentalBookingProcess({
      productId: med?._id || med?.id || med?.name,
      variantId: effectiveVariantId || null,
      vendorId: vendor?.vendorId || vendor?._id || vendor?.businessDetails?._id,
      perDayRent: vendor?.perDayRent || 0,
      packageId: med?._id || null,
      navigate,
      // servicefixedTypes: servicePassed || serviceDetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "labtests",
      servicefixedTypes: servicePassed

    });
  };

  const handleRentClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to rent equipment");
      navigate("/login");
      return;
    }

    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    const item = {
      tabletdetails: med,
      vendordetails: vendor?.bussinessdetails || vendor,
      variants: med.variant || [],
      price: med.price || 0,
      productId: med?._id || med?.id,
      vendorId: vendor?.vendorId || vendor?._id,
      variantId,
    };

    setRentProduct(item);
    setShowRentModal(true);
  };

  const handleConsultationClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    setConsultationFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      productId: med?._id || med?.id,
      vendorId: vendor?.vendorId || vendor?._id,
      variantId,
    });
    setShowConsultationModal(true);
  };

  const handleAppointmentClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    setAppointmentFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      productId: med?._id || med?.id,
      vendorId: vendor?.vendorId || vendor?._id,
      variantId,
    });
    setShowAppointmentModal(true);
  };

  const handleIncrement = async (
    bookingType,
    vendorId,
    prodId,
    variantId,
    maxStock,
    vendor,
    selectedVar,
  ) => {
    const currentQty = getCartQuantity(vendorId, prodId, variantId);
    if (currentQty >= maxStock) {
      toast.error("Quantity at maximum stock");
      return;
    }

    try {
      await incrementItem(vendorId, prodId, variantId);
    } catch (err) {
      toast.error("Failed to update quantity");
    }
  };

  const handleDecrement = async (
    bookingType,
    vendorId,
    prodId,
    variantId,
    vendor,
    selectedVar,
  ) => {
    try {
      await decrementItem(vendorId, prodId, variantId);
    } catch (err) {
      toast.error("Failed to update quantity");
    }
  };

  // Form handlers
  const handleRentFormChange = (e) => {
    const { name, value } = e.target;
    setRentFormData((prev) => ({
      ...prev,
      [name]: value,
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
    }));
  };

  const handleSubmitLeadNew = async (e) => {
    e.preventDefault();
    if (!currentLeadData?.med && !currentLeadData?.vendor) return;

    const { vendor, med } = currentLeadData;
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
          productId: med?._id || med?.id,
          vendorId: vendor._id || vendor.vendorId,
          variantId: null,
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

      toast.success("Lead added successfully!");
      setShowLeadModal(false);
      setLeadFormData(INITIAL_LEAD_FORM);
      setCurrentLeadData(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add lead");
    }
  };

  const navigate = useNavigate();

  const handleTestClick = (item) => {
    const categorySlug = item?.medicineDetails?.subcatdetails?.catdetails?.slug;
    const subcategorySlug = item?.medicineDetails?.subcatdetails?.slug;
    const medicineSlug = item?.medicineDetails?.slug;
    navigate(`/${categorySlug}/${subcategorySlug}/${medicineSlug}`);
  };

  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      @keyframes pulse {
        0%, 100% {
          opacity: 1;
        }
        50% {
          opacity: 0.7;
        }
      }
      
      @keyframes slideRight {
        0%, 100% {
          transform: translateX(0);
        }
        50% {
          transform: translateX(3px);
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  const swiperSettings = getHealthcareSwiperSettings({
    modules: [Navigation],
    navigation: {
      nextEl: ".packages-next",
      prevEl: ".packages-prev",
    },
    loop: packages?.length > 4,
  });

  const swiperSettings1 = getHealthcareSwiperSettings({
    modules: [Navigation, Autoplay],
    navigation: {
      nextEl: ".dental-next",
      prevEl: ".dental-prev",
    },
    loop: cheaplabtests?.length > 1,
  });

  return (
    <>
      <SEOHelmet page="labtests" />
      {packages && packages.length > 0 && (
        <section
          className="py-4 mx-2"
          style={{
            backgroundImage: "url('/assets/Medicompares%20Background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "16px",
          }}
        >
          <div className="container-fluid">
            <div className="d-flex align-items-center justify-content-center flex-wrap result-wrap gap-3 mb-4" style={{ position: "relative" }}>
              <div className="mb-2 d-flex flex-column align-items-center text-center gap-1">
                <div className="d-flex align-items-center justify-content-center gap-2 flex-wrap">
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "7px",
                      background: "linear-gradient(135deg, #6a0dad 0%, #9b59b6 100%)",
                      color: "#fff",
                      borderRadius: "30px",
                      padding: "5px 16px 5px 10px",
                      fontSize: "12px",
                      fontWeight: "600",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      boxShadow: "0 2px 10px rgba(106,13,173,0.25)",
                    }}
                  >
                    <i className="fas fa-bolt" style={{ fontSize: "11px" }}></i>
                    Health Packages
                  </span>
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: "#475569",
                    fontWeight: "500",
                    marginTop: "6px",
                    display: "block",
                    letterSpacing: "0.2px",
                    lineHeight: "1.4",
                    maxWidth: "500px",
                    opacity: 0.9,
                  }}
                >
                  Compare all health packages side-by-side to choose the best option
                </span>
              </div>

              <div
                className="d-flex align-items-center justify-content-center gap-3 mb-2"
                style={{
                  position: isMobile ? "static" : "absolute",
                  right: "15px",
                  top: "50%",
                  transform: isMobile ? "none" : "translateY(-50%)",
                  width: isMobile ? "100%" : "auto",
                }}
              >
                <Link
                  to="/view-all-packages"
                  className="top-vendor-badge"
                  style={{
                    padding: isMobile ? "6px 18px" : "8px 20px",
                    borderRadius: "50px",
                    width: "auto",
                    height: "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                  onClick={(e) => {
                    if (!isLoggedIn) {
                      e.preventDefault();
                      toast.error("Please login to view all packages");
                      navigate("/login");
                    }
                  }}
                >
                  View All
                  <i className="isax isax-arrow-right-1 ms-1.5"></i>
                </Link>
              </div>
            </div>

            {packages && packages.length > 0 && compareItems.length > 0 && (
              <div
                className="compare-bar mb-4"
                style={{
                  position: "relative",
                  width: isMobile ? "95%" : "80%",
                  margin: "16px auto",
                  padding: isMobile ? "12px 48px 12px 16px" : "10px 15px",
                  backgroundColor: "#8059ca",
                  borderRadius: "12px",
                  boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)",
                  zIndex: "10",
                }}
              >
                <div
                  className="compare-bar-content"
                  onClick={() => {
                    if (compareItems.length < 2) {
                      toast.error("Select at least 2 packages to compare");
                    } else {
                      handleCompareBar();
                    }
                  }}
                  style={{
                    cursor: "pointer",
                    color: "#ffffff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      width: "100%",
                    }}
                  >
                    <span
                      className="compare-label"
                      style={{
                        color: "#ffffff",
                        fontWeight: "750",
                        fontSize: isMobile ? "12px" : "14px",
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                      }}
                    >
                      Compare
                    </span>
                    <div
                      className="compare-items"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        flexWrap: "wrap",
                      }}
                    >
                      <div className="d-flex flex-wrap align-items-center" style={{ gap: "4px" }}>
                        {compareItems.map((itemId, index) => {
                          const pkg = packages.find((p) => p._id === itemId);
                          return (
                            <div key={index} className="compare-item" style={{ display: "inline-flex", alignItems: "center" }}>
                              <span
                                className="item-name"
                                style={{
                                  color: "#ffffff",
                                  fontSize: isMobile ? "11px" : "13px",
                                  fontWeight: "500",
                                }}
                              >
                                {pkg?.name || `Item ${index + 1}`}
                              </span>
                              {index < compareItems.length - 1 && (
                                <span
                                  className="item-comma"
                                  style={{
                                    color: "rgba(255, 255, 255, 0.7)",
                                    margin: "0 2px",
                                  }}
                                >
                                  ,
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <span
                        className="item-count"
                        style={{
                          color: "#ffffff",
                          fontWeight: "700",
                          fontSize: "12px",
                          background: "rgba(255, 255, 255, 0.22)",
                          padding: "2px 8px",
                          borderRadius: "20px",
                          marginLeft: "6px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        Total ({compareItems.length})
                      </span>
                      {!isMobile && (
                        <div
                          className="ms-5 d-none d-lg-block"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span
                            style={{
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            View More
                          </span>
                          <i
                            className="fas fa-arrow-right"
                            style={{
                              color: "#ffffff",
                              fontSize: "12px",
                              animation: "slideRight 1.5s ease-in-out infinite",
                            }}
                          ></i>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={clearAllCompare}
                  className="compare-clear-btn"
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "rgba(255, 255, 255, 0.2)",
                    border: "none",
                    color: "#ffffff",
                    fontSize: "18px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ×
                </button>
              </div>
            )}

            <div className="row" style={{ position: "relative" }}>
              {packages.length > 1 && (
                <button
                  className="meq-arrow-btn packages-prev"
                  aria-label="Previous"
                  style={{
                    position: "absolute",
                    left: "-10px",
                    top: "50%",
                    zIndex: 10,
                  }}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <div style={{ padding: "0 20px" }}>
                <Swiper {...swiperSettings}>
                  {packages.map((pkg, index) => {
                    return (
                      <SwiperSlide key={pkg._id || index}>
                        <div
                          className="px-2 pb-2 h-100"
                          style={{ display: "flex", flexDirection: "column", cursor: "pointer" }}
                          onClick={() => {
                            navigate(`/lab-package/${pkg._id}`);
                          }}
                        >
                          <div
                            className="card border-0"
                            style={{
                              borderRadius: "10px",
                              backgroundColor: "#ffffff",
                              boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                              transition: "all 0.3s ease",
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                            }}
                          >
                            <div
                              style={{
                                position: "relative",
                                width: "100%",
                                paddingTop: "50%",
                                overflow: "hidden",
                                background: "#f8f9fa",
                                borderRadius: "10px 10px 0 0",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isChecked = !compareItems.includes(pkg._id);
                                  handleCompareToggle(pkg, isChecked);
                                }}
                                className={!compareItems.includes(pkg._id) ? "pulse-compare-btn" : ""}
                                style={{
                                  position: "absolute",
                                  top: "10px",
                                  right: "10px",
                                  background: compareItems.includes(pkg._id)
                                    ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                    : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "30px",
                                  padding: "3px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  boxShadow: compareItems.includes(pkg._id)
                                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                                    : "0 4px 12px rgba(245, 158, 11, 0.4)",
                                  zIndex: 10,
                                  border: "1.5px solid #ffffff",
                                  cursor: "pointer",
                                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                  transform: compareItems.includes(pkg._id) ? "scale(1.05)" : "scale(1)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.12) translateY(-2px)";
                                  e.currentTarget.style.boxShadow = compareItems.includes(pkg._id)
                                    ? "0 8px 20px rgba(16, 185, 129, 0.45)"
                                    : "0 8px 20px rgba(245, 158, 11, 0.55)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = compareItems.includes(pkg._id) ? "scale(1.05)" : "scale(1)";
                                  e.currentTarget.style.boxShadow = compareItems.includes(pkg._id)
                                    ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                                    : "0 4px 12px rgba(245, 158, 11, 0.4)";
                                }}
                                title="Compare Package"
                              >
                                <i
                                  className={compareItems.includes(pkg._id) ? "fa-solid fa-circle-check" : "fa-solid fa-hand-pointer"}
                                  style={{
                                    fontSize: "13px",
                                    color: "#ffffff",
                                    transform: !compareItems.includes(pkg._id) ? "rotate(90deg)" : "none",
                                    display: "inline-block",
                                  }}
                                ></i>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    color: "#ffffff",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.6px",
                                  }}
                                >
                                  {compareItems.includes(pkg._id) ? "Compared" : "Compare"}
                                </span>
                              </div>
                              {pkg?.files?.[0] ? (
                                <img
                                  src={
                                    pkg?.files?.[0]
                                      ? getImageUrl(pkg.files[0])
                                      : "/assets/default.png"
                                  }
                                  alt={pkg.name}
                                  onError={(e) => {
                                    e.target.src = "/assets/default.png";
                                  }}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "contain",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background:
                                      "linear-gradient(135deg, #F8F5FE 0%, #F2EDFE 100%)",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: "70px",
                                      height: "70px",
                                      border: "2px solid #8059ca",
                                      borderRadius: "10px",
                                      display: "flex",
                                      flexDirection: "column",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      background: "#ffffff",
                                      padding: "12px",
                                    }}
                                  >
                                    <i
                                      className="isax isax-health"
                                      style={{
                                        fontSize: "35px",
                                        color: "#8059ca",
                                      }}
                                    ></i>
                                    <span
                                      style={{
                                        fontSize: "9px",
                                        color: "#8059ca",
                                        fontWeight: "600",
                                        marginTop: "6px",
                                        letterSpacing: "0.5px",
                                      }}
                                    >
                                      PACKAGE
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div
                              className="card-body"
                              style={{
                                padding: "8px 10px",
                                display: "flex",
                                flexDirection: "column",
                                flexGrow: 1,
                              }}
                            >
                              <h6
                                className="mb-1 text-dark"
                                style={{
                                  fontSize: "14px",
                                  fontWeight: "600",
                                  lineHeight: "1.2",
                                  textTransform: "capitalize",
                                }}
                              >
                                {pkg.name}
                              </h6>
                              {/* Profiles, Tests, and Parameters Details */}
                              <div
                                className="d-flex gap-1 mb-1"
                                style={{
                                  flexWrap: "nowrap",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  className="d-flex align-items-center gap-1 flex-shrink-0"
                                  style={{
                                    background: "#F8F5FE",
                                    padding: "3px 6px",
                                    borderRadius: "5px",
                                    border: "1px solid rgba(125, 46, 255, 0.2)",
                                  }}
                                >
                                  <i
                                    className="isax isax-profile-2user"
                                    style={{
                                      color: "#8059ca",
                                      fontSize: "12px",
                                    }}
                                  ></i>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: "#333",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {pkg.subcategories?.length || 0} Profiles
                                  </span>
                                </div>
                                <div
                                  className="d-flex align-items-center gap-1 flex-shrink-0"
                                  style={{
                                    background: "#EAF3FF",
                                    padding: "3px 6px",
                                    borderRadius: "5px",
                                    border: "1px solid rgba(17, 14, 253, 0.2)",
                                  }}
                                >
                                  <i
                                    className="isax isax-test-tube"
                                    style={{
                                      color: "#110EFD",
                                      fontSize: "12px",
                                    }}
                                  ></i>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: "#333",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {pkg.products?.length || 0} Tests
                                  </span>
                                </div>
                                <div
                                  className="d-flex align-items-center gap-1 flex-shrink-0"
                                  style={{
                                    background: "#F1FAF3",
                                    padding: "3px 6px",
                                    borderRadius: "5px",
                                    border: "1px solid rgba(4, 189, 108, 0.2)",
                                  }}
                                >
                                  <i
                                    className="isax isax-chart"
                                    style={{
                                      color: "#04BD6C",
                                      fontSize: "12px",
                                    }}
                                  ></i>
                                  <span
                                    style={{
                                      fontSize: "10px",
                                      color: "#333",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                    }}
                                  >
                                    {pkg.parameterss?.length || 0} Parameters
                                  </span>
                                </div>
                              </div>

                              <div
                                className="report-timee"
                                style={{
                                  fontSize: "11px",
                                  color: "#666",
                                  marginTop: "4px",
                                }}
                              >
                                <i className="fa-regular fa-file-lines me-1" />{" "}
                                Reports in
                                <strong
                                  style={{ color: "#333", marginLeft: "2px" }}
                                >
                                  {pkg?.tablets?.[0]?.reportsDuration || "N/A"}
                                </strong>
                              </div>

                              {/* Pricing */}
                              <div className="mb-1">
                                <div className="d-flex gap-2 mb-1">
                                  {(() => {
                                    const itemPrice =
                                      parseFloat(pkg?.price) || 0;
                                    const itemDiscountprice =
                                      parseFloat(
                                        pkg?.discountprice ||
                                        pkg?.discountPrice,
                                      ) || null;
                                    const effectivePrice =
                                      itemDiscountprice && itemDiscountprice > 0
                                        ? itemDiscountprice
                                        : itemPrice;
                                    let discount = 0;
                                    if (
                                      itemDiscountprice &&
                                      itemDiscountprice > 0 &&
                                      itemDiscountprice !== itemPrice
                                    ) {
                                      if (itemDiscountprice > itemPrice) {
                                        discount = Math.round(
                                          ((itemDiscountprice - itemPrice) /
                                            itemDiscountprice) *
                                          100,
                                        );
                                      } else {
                                        discount = Math.round(
                                          ((itemPrice - itemDiscountprice) /
                                            itemPrice) *
                                          100,
                                        );
                                      }
                                    }

                                    return (
                                      <>
                                        <span
                                          style={{
                                            fontSize: "16px",
                                            fontWeight: "700",
                                            color: "#1a1a1a",
                                          }}
                                        >
                                          ₹
                                          {effectivePrice.toLocaleString(
                                            "en-IN",
                                          )}
                                        </span>
                                        {itemDiscountprice &&
                                          itemDiscountprice > 0 &&
                                          itemDiscountprice !== itemPrice && (
                                            <>
                                              <span
                                                style={{
                                                  color: "#999",
                                                  textDecoration:
                                                    "line-through",
                                                  fontSize: "12px",
                                                }}
                                              >
                                                ₹{itemPrice}
                                              </span>
                                              {discount > 0 && (
                                                <div className="discountts">
                                                  <span
                                                    style={{
                                                      backgroundColor:
                                                        "#F97316",
                                                      fontSize: "12px",
                                                      padding: "2px 6px",
                                                      borderRadius: "4px",
                                                    }}
                                                  >
                                                    {discount}% off
                                                  </span>
                                                </div>
                                              )}
                                            </>
                                          )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="d-flex w-100 justify-content-center mb-2" style={{ marginTop: "auto", width: "100%" }}>


                                <VendorActions
                                  bookingType={
                                    serviceDetails?.categoryType ||
                                    "cart"
                                  }
                                  IsPackage={true}
                                  med={pkg}
                                  vendor={pkg?.vendor || {}}
                                  price={parseFloat(pkg?.price) || 0}
                                  calculatedDiscountPrice={parseFloat(pkg?.discountprice || pkg?.discountPrice) || null}
                                  stock={pkg?.stock || 999}
                                  service={serviceDetails?.fixedType}
                                  handleRentalBookinProcess={handleRentalBookinProcess}
                                  handleNavigateToBooking={handleBooking}
                                  handleAddLead={handleAddLead}
                                  handleOpenConsultationModal={handleConsultationClick}
                                  handleOpenAppointmentModal={handleAppointmentClick}
                                  handleOpenRideModal=""
                                  className="w-100"
                                  containerStyle={{
                                    display: "flex",
                                    width: "100%",
                                  }}
                                />

                                {/* <button
                                  className="btn"
                                  style={{
                                    backgroundColor: "#8059ca",
                                    color: "#ffffff",
                                    border: "none",
                                    borderRadius: "6px",
                                    padding: "5px 12px",
                                    fontSize: "11px",
                                    fontWeight: "600",
                                    // width: "auto",
                                    minWidth: "100%",
                                    marginTop: "auto",
                                    boxShadow:
                                      "0 2px 8px rgba(125, 46, 255, 0.25)",
                                    transition: "all 0.3s ease",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBook(pkg, "package");
                                  }}
                                >
                                  Book Now
                                </button> */}
                              </div>

                              {/* Vendor Details */}
                              {pkg?.vendor && (
                                <div
                                  style={{
                                    marginTop: "6px",
                                    paddingTop: "6px",
                                    borderTop: "1px solid #0000002e",
                                  }}
                                >
                                  <div
                                    className="d-flex align-items-center gap-2"
                                    style={{
                                      padding: "6px 0 0 0",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const vendorId =
                                        pkg.vendor?.businessDetails?.slug ||
                                        pkg.vendor?.businessDetails?.vendorId ||
                                        pkg.vendor?.businessDetails?._id ||
                                        pkg.vendor?.slug ||
                                        pkg.vendor?.vendorId ||
                                        pkg.vendor?._id;
                                      if (vendorId) {
                                        sessionStorage.setItem(
                                          "vendorId",
                                          vendorId,
                                        );
                                        const name =
                                          pkg.vendor?.bussinessdetails?.name ||
                                          pkg.vendor?.name ||
                                          "Vendor Store";
                                        const vendorSlug =
                                          pkg.vendor?.slug ||
                                          name
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")
                                            .replace(/[^a-z0-9-]/g, "");
                                        navigate(
                                          `/vendor-profile/${vendorSlug}`,
                                        );
                                      } else {
                                        toast.error(
                                          "Vendor information not available",
                                        );
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.opacity = "0.8";
                                      e.currentTarget.style.transform =
                                        "translateX(4px)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.opacity = "1";
                                      e.currentTarget.style.transform =
                                        "translateX(0)";
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        flexShrink: 0,
                                        background: "#ffffff",
                                      }}
                                    >
                                      <img
                                        src={
                                          pkg.vendor?.businessDetails
                                            ?.bussiness_image?.url
                                            ? getImageUrl(
                                              pkg.vendor?.businessDetails
                                                ?.bussiness_image?.url,
                                            )
                                            : "/assets/default.png"
                                        }
                                        alt={pkg.vendorName || "Vendor"}
                                        title={pkg.vendorName || "Vendor"}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "contain",
                                        }}
                                        onError={(e) => {
                                          e.target.src = "/assets/default.png";
                                        }}
                                      />
                                    </div>
                                    <div
                                      className="flex-grow-1"
                                      style={{ minWidth: 0 }}
                                    >
                                      <h6
                                        className="mb-0 text-dark"
                                        style={{
                                          fontSize: "11.5px",
                                          fontWeight: "600",
                                          margin: 0,
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                        title={
                                          pkg.vendor?.businessDetails
                                            ?.businessName ||
                                          pkg.vendor?.name ||
                                          "Vendor"
                                        }
                                      >
                                        {pkg.vendor?.businessDetails?.name ||
                                          pkg.vendor?.name ||
                                          "Vendor"}
                                      </h6>
                                      {pkg.vendor?.averageRating > 0 && pkg.vendor?.ratingCount > 0 && (
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
                                              fontSize: "9px"
                                            }}
                                          ></i>
                                          {/* {pkg?.vendor?.averageRating > 0 && ( */}
                                          <span style={{ fontWeight: "500" }}>
                                            {pkg.vendor.averageRating.toFixed(1)}
                                          </span>
                                          {/* )} */}
                                          {/* {pkg?.vendor?.ratingCount > 0 && ( */}
                                          <span style={{ color: "#999" }}>
                                            ({pkg.vendor.ratingCount}+)
                                          </span>
                                          {/* )} */}
                                        </div>
                                      )}

                                      {pkg?.vendor?.businessDetails
                                        ?.address && (
                                          <div
                                            className="d-flex align-items-center gap-2"
                                            style={{
                                              fontSize: "11px",
                                              color: "#555",
                                              overflow: "hidden",
                                            }}
                                            title={
                                              pkg?.vendor?.businessDetails
                                                ?.address
                                            }
                                          >
                                            <i
                                              className="isax isax-location"
                                              style={{
                                                fontSize: "12px",
                                                color: "#8059ca",
                                              }}
                                            ></i>
                                            <span
                                              className="text-dark"
                                              style={{
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap",
                                              }}
                                            >
                                              {
                                                pkg?.vendor?.businessDetails
                                                  ?.address
                                              }
                                            </span>
                                          </div>
                                        )}

                                      {pkg?.vendor?.distanceInKm && (
                                        <div
                                          className="d-flex align-items-center gap-2"
                                          style={{
                                            fontSize: "11px",
                                            color: "#555",
                                            overflow: "hidden",
                                          }}
                                          title={pkg?.vendor?.distanceInKm}
                                        >
                                          <i
                                            className="isax isax-route-square"
                                            style={{
                                              fontSize: "12px",
                                              color: "#8059ca",
                                            }}
                                          ></i>
                                          <span



                                            className="text-dark"
                                            style={{
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            {pkg?.vendor?.distanceInKm?.toFixed(1)} km away
                                          </span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
              {packages.length > 1 && (
                <button
                  className="meq-arrow-btn packages-next"
                  aria-label="Next"
                  style={{
                    position: "absolute",
                    right: "-10px",
                    top: "50%",
                    zIndex: 10,
                  }}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {sections && sections.length > 0 && (
        <DynamicCategorySections
          sections={sections}
          onProductClick={handleProductClick}
          onCompareClick={handleCompareClick}
          onVendorClick={handleVendorClick}
          imgUrl={imgUrl}
          currentService="lab-tests"
        />
      )}

      {/* Offer Banner 1 */}
      {middleBanners?.length > 0 && (
        <section
          className="section welcome-section px-3 mt-3 offers-section"
          style={{
            backgroundImage: "url('/assets/Medicompares%20Background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "16px",
          }}
        >
          <div className="container-fluid">
            <div className="text-center mb-3">
              <h2
                className="mb-3"
                style={{
                  fontSize: "28px",
                  fontWeight: "700",
                  color: "#1a1a1a",
                }}
              >
                <i className="fas fa-bolt text-warning me-2"></i>Offers &
                Promotions
              </h2>
            </div>
            {middleBanners.length > 1 ? (
              <Slider {...settings}>
                {middleBanners.map((image, index) => (
                  <div key={index} className="col-lg-4 col-md-6 d-flex">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="px-1"
                      style={{
                        borderRadius: "10px",
                      }}
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="col-lg-12 d-flex">
                <img
                  src={middleBanners[0]?.src}
                  alt={middleBanners[0]?.alt}
                  title={middleBanners[0]?.alt}
                  loading="lazy"
                  className="px-1"
                  style={{ borderRadius: "10px" }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {cheaplabtests && cheaplabtests.length > 0 && (
        <div
          className="content doctor-content py-4 mx-4"
          style={{
            backgroundImage: "url('/assets/Medicompares%20Background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            borderRadius: "16px",
          }}
        >
          <div className="container-fluid">
            <div className="d-flex align-items-center justify-content-between flex-wrap result-wrap gap-3 mb-4">
              <h3
                className="mb-2"
                style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  color: "#1a1a1a",
                }}
              >
                <i className="fas fa-bolt text-warning me-2"></i>
                Top CheckUp's
              </h3>

              <div className="d-flex align-items-center flex-wrap gap-3 mb-2">
                <Link
                  to={`/${currentService}/all`}
                  className="top-vendor-badge"
                  style={{
                    padding: isMobile ? "8px" : "8px 20px",
                    borderRadius: isMobile ? "50%" : "50px",
                    width: isMobile ? "36px" : "auto",
                    height: isMobile ? "36px" : "auto",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "600",
                  }}
                >
                  {isMobile ? "" : "View All"}
                  <i className={isMobile ? "isax isax-arrow-right-1" : "isax isax-arrow-right-1 ms-1"}></i>
                </Link>
              </div>
            </div>

            <div className="row" style={{ position: "relative" }}>
              {cheaplabtests.length > 1 && (
                <button
                  className="meq-arrow-btn dental-prev"
                  aria-label="Previous"
                  style={{
                    position: "absolute",
                    left: "-10px",
                    top: "50%",
                    zIndex: 10,
                  }}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <div style={{ padding: "0 20px" }}>
                <Swiper {...swiperSettings1}>
                  {cheaplabtests.map((test) => {
                    const vendor = test.businessDetails;
                    const medicine = test.medicineDetails;
                    return (
                      <SwiperSlide key={test._id}>
                        <div
                          className="px-2 mb-2 h-100"
                          style={{ display: "flex", flexDirection: "column" }}
                          onClick={() => handleTestClick(test)}
                        >
                          <div
                            className="health-card border rounded-3"
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                            }}
                          >
                            <div className="card-imgs">
                              <img
                                src={
                                  medicine?.files?.[0]
                                    ? getImageUrl(medicine.files[0])
                                    : "/assets/default.png"
                                }
                                alt={medicine.name}
                                style={{ objectFit: "contain" }}
                                onError={(e) => {
                                  e.target.src = "/assets/default.png";
                                }}
                              />
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const data = test?.medicineDetails || test;
                                  const categorySlug =
                                    data?.subcatdetails?.catdetails?.slug;
                                  const subcategorySlug =
                                    data?.subcatdetails?.slug;
                                  const medicineSlug = data?.slug;
                                  if (
                                    !categorySlug ||
                                    !subcategorySlug ||
                                    !medicineSlug
                                  )
                                    return;

                                  navigate(
                                    `/${categorySlug}/${subcategorySlug}/${medicineSlug}/compare`,
                                  );
                                }}
                                style={{
                                  position: "absolute",
                                  top: "10px",
                                  right: "10px",
                                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                                  borderRadius: "30px",
                                  padding: "3px 14px",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)",
                                  zIndex: 10,
                                  border: "1.5px solid #ffffff",
                                  cursor: "pointer",
                                  transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                                  transform: "scale(1)",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform = "scale(1.12) translateY(-2px)";
                                  e.currentTarget.style.boxShadow = "0 8px 20px rgba(245, 158, 11, 0.55)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform = "scale(1)";
                                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(245, 158, 11, 0.4)";
                                }}
                                title="Compare Package"
                              >
                                <i
                                  className="fa-solid fa-hand-pointer"
                                  style={{
                                    fontSize: "13px",
                                    color: "#ffffff",
                                    transform: "rotate(90deg)",
                                    display: "inline-block",
                                  }}
                                ></i>
                                <span
                                  style={{
                                    fontSize: "11px",
                                    fontWeight: "800",
                                    color: "#ffffff",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.6px",
                                  }}
                                >
                                  Compare
                                </span>
                              </div>
                            </div>
                            <div
                              className="card-bodyyy"
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                flexGrow: 1,
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <h6
                                  className="mb-1 text-dark"
                                  style={{
                                    fontSize: "14px",
                                    fontWeight: "600",
                                    lineHeight: "1.2",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {medicine?.name?.length > 25
                                    ? medicine.name.slice(0, 25) + "..."
                                    : medicine?.name}
                                </h6>

                                <div
                                  className="d-flex align-items-center justify-content-end"
                                  style={{ minWidth: "60px", fontSize: "11px" }}
                                >
                                  <i
                                    className="fa fa-star text-warning me-1"
                                    style={{ fontSize: "11px" }}
                                  ></i>
                                  <span
                                    className="me-1"
                                    style={{ fontWeight: "600" }}
                                  >
                                    {medicine?.averageRating.toFixed(1) > 0
                                      ? medicine.averageRating.toFixed(1)
                                      : 0}
                                  </span>

                                  <i
                                    className="fa fa-users me-1 text-primary"
                                    style={{ fontSize: "11px" }}
                                  ></i>
                                  <span style={{ color: "#666" }}>
                                    (
                                    {medicine?.ratingCount > 0
                                      ? `${medicine.ratingCount}+`
                                      : 0}
                                    )
                                  </span>
                                </div>
                              </div>

                              <div className="statsss mt-2">
                                <div
                                  className="d-flex align-items-center justify-content-center gap-1"
                                  style={{
                                    flexWrap: "nowrap",
                                    overflow: "hidden",
                                  }}
                                >
                                  {/* <div
                                className="d-flex align-items-center gap-1 flex-shrink-0"
                                style={{
                                  background: "#F8F5FE",
                                  padding: "3px 7px",
                                  borderRadius: "5px",
                                  border: "1px solid rgba(125, 46, 255, 0.15)",
                                }}
                              >
                                <i
                                  className="isax isax-profile-2user"
                                  style={{ color: "#8059ca", fontSize: "11px" }}
                                ></i>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#333",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {medicine?.Profiles?.length || 0} Profiles
                                </span>
                              </div> */}
                                  {/* <div
                                className="d-flex align-items-center gap-1 flex-shrink-0"
                                style={{
                                  background: "#EAF3FF",
                                  padding: "3px 7px",
                                  borderRadius: "5px",
                                  border: "1px solid rgba(17, 14, 253, 0.15)",
                                }}
                              >
                                <i
                                  className="isax isax-test-tube"
                                  style={{ color: "#110EFD", fontSize: "11px" }}
                                ></i>
                                <span
                                  style={{
                                    fontSize: "10px",
                                    color: "#333",
                                    fontWeight: "600",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {medicine?.Tests?.length || 0} Tests
                                </span>
                              </div> */}
                                  <div
                                    className="d-flex align-items-center gap-1 flex-shrink-0"
                                    style={{
                                      background: "#F1FAF3",
                                      padding: "3px 7px",
                                      borderRadius: "5px",
                                      border:
                                        "1px solid rgba(4, 189, 108, 0.15)",
                                    }}
                                  >
                                    <i
                                      className="isax isax-chart"
                                      style={{
                                        color: "#04BD6C",
                                        fontSize: "11px",
                                      }}
                                    ></i>
                                    <span
                                      style={{
                                        fontSize: "10px",
                                        color: "#333",
                                        fontWeight: "600",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {medicine?.parameters?.length || 0}{" "}
                                      Parameters
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div
                                className="report-timee"
                                style={{
                                  fontSize: "11px",
                                  margin: "4px 0",
                                  color: "#666",
                                }}
                              >
                                <i
                                  className="fa-regular fa-file-lines"
                                  style={{
                                    fontSize: "10.5px",
                                    color: "#8059ca",
                                  }}
                                />{" "}
                                Reports in
                                <strong
                                  style={{ color: "#333", marginLeft: "2px" }}
                                >
                                  {" "}
                                  {medicine?.reportsDuration}
                                </strong>
                              </div>

                              <div className="price-section d-flex align-items-center flex-wrap gap-2 pb-2">
                                {(() => {
                                  const originalPrice =
                                    parseFloat(test?.price) || 0;
                                  const discountPrice =
                                    parseFloat(
                                      test?.discountprice ||
                                      test?.discountPrice,
                                    ) || null;

                                  const showDiscount =
                                    discountPrice &&
                                    discountPrice > 0 &&
                                    discountPrice < originalPrice;
                                  const displayPrice = showDiscount
                                    ? discountPrice
                                    : originalPrice;

                                  const discountPercent = showDiscount
                                    ? Math.round(
                                      ((originalPrice - discountPrice) /
                                        originalPrice) *
                                      100,
                                    )
                                    : 0;

                                  return (
                                    <>
                                      <span
                                        className="current-price text-dark"
                                        style={{
                                          fontSize: "16px",
                                          fontWeight: "700",
                                        }}
                                      >
                                        ₹{displayPrice.toLocaleString("en-IN")}
                                      </span>

                                      {showDiscount && (
                                        <>
                                          <span
                                            className="old-price"
                                            style={{ fontSize: "11.5px" }}
                                          >
                                            ₹
                                            {originalPrice.toLocaleString(
                                              "en-IN",
                                            )}
                                          </span>
                                          <span
                                            className="discountts"
                                            style={{
                                              backgroundColor: "#F97316",
                                              fontSize: "10px",
                                              padding: "2px 6px",
                                              borderRadius: "4px",
                                              fontWeight: "600",
                                            }}
                                          >
                                            {discountPercent}% OFF
                                          </span>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>

                              <div style={{ marginTop: "auto", marginBottom: "8px" }}>
                                <VendorActions
                                  bookingType={
                                    test?.businessDetails?.bookingType ||
                                    service?.categoryType ||
                                    "cart"
                                  }
                                  med={test?.medicineDetails || test}
                                  vendor={test?.businessDetails || {}}
                                  price={parseFloat(test?.price) || 0}
                                  calculatedDiscountPrice={parseFloat(test?.discountprice || test?.discountPrice) || null}
                                  stock={test?.stock || (test?.medicineDetails || test).stock || (test?.businessDetails || {}).stock || 999}
                                  service={test?.medicineDetails?.subcategorydetails?.catdetails?.fixedType || "labtests"}
                                  handleRentalBookinProcess={handleRentalBookinProcess}
                                  handleNavigateToBooking={handleBooking}
                                  handleAddLead={handleAddLead}
                                  handleOpenConsultationModal={handleConsultationClick}
                                  handleOpenAppointmentModal={handleAppointmentClick}
                                  handleOpenRideModal=""
                                  className="w-100"
                                  containerStyle={{
                                    display: "flex",
                                    width: "100%",
                                  }}
                                />
                              </div>

                              {vendor && (
                                <div
                                  style={{
                                    borderTop: "1px solid #00000015",
                                  }}
                                >
                                  <div
                                    className="d-flex align-items-center gap-2 footers"
                                    style={{
                                      padding: "8px 0 0 0",
                                      cursor: "pointer",
                                      transition: "all 0.2s ease",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const vendorId =
                                        vendor?.slug ||
                                        vendor?.vendorId ||
                                        vendor?._id;
                                      if (vendorId) {
                                        sessionStorage.setItem(
                                          "vendorId",
                                          vendorId,
                                        );
                                        const name =
                                          vendor?.bussinessdetails?.name ||
                                          vendor?.name ||
                                          "Vendor Store";
                                        const vendorSlug =
                                          vendor?.slug ||
                                          name
                                            .toLowerCase()
                                            .replace(/\s+/g, "-")
                                            .replace(/[^a-z0-9-]/g, "");
                                        navigate(
                                          `/vendor-profile/${vendorSlug}`,
                                        );
                                      } else {
                                        toast.error(
                                          "Vendor information not available",
                                        );
                                      }
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.opacity = "0.8";
                                      e.currentTarget.style.transform =
                                        "translateX(4px)";
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.opacity = "1";
                                      e.currentTarget.style.transform =
                                        "translateX(0)";
                                    }}
                                  >
                                    <div
                                      style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        border: "1px solid #f0f0f0",
                                        backgroundColor: "#fff",
                                        flexShrink: 0,
                                        padding: "3px",
                                        boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                                      }}
                                    >
                                      <img
                                        src={
                                          vendor?.bussiness_image?.url
                                            ? getImageUrl(
                                              vendor.bussiness_image.url,
                                            )
                                            : "/assets/default.png"
                                        }
                                        alt={vendor.name}
                                        onError={(e) => {
                                          e.target.src = "/assets/default.png";
                                        }}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "contain",
                                        }}
                                      />
                                    </div>

                                    <div
                                      className="flex-grow-1"
                                      style={{ minWidth: 0 }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center' }}>
                                        <h6
                                          className="mb-0 "
                                          style={{
                                            fontSize: "12px",
                                            fontWeight: "600",
                                            letterSpacing: "-0.2px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                          }}
                                        >
                                          {vendor.name}
                                        </h6>
                                        {test?.averageRating > 0 && test?.ratingCount > 0 && (
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
                                                fontSize: "9px"
                                              }}
                                            ></i>
                                            <span style={{ fontWeight: "500" }}>
                                              {test.averageRating.toFixed(1)}
                                            </span>
                                            <span style={{ color: "#999" }}>
                                              ({test.ratingCount}+)
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div
                                        className="d-flex align-items-center gap-1 text-muted"
                                        style={{ fontSize: "11px" }}
                                      >
                                        <i
                                          className="fa-solid fa-location-dot"
                                          style={{
                                            fontSize: "11px",
                                            color: "#8059ca",
                                          }}
                                        ></i>
                                        <span
                                          style={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                          }}
                                        >
                                          {vendor.address}
                                        </span>
                                      </div>
                                      <div
                                        className="d-flex align-items-center gap-1 text-muted"
                                        style={{ fontSize: "11px" }}
                                      >
                                        <i
                                          className="isax isax-route-square"
                                          style={{
                                            fontSize: "11px",
                                            color: "#8059ca",
                                          }}
                                        ></i>

                                        <span>
                                          {test?.distanceInKm
                                            ? `${parseFloat(test.distanceInKm).toFixed(1)} km away`
                                            : ""}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
              {cheaplabtests.length > 1 && (
                <button
                  className="meq-arrow-btn dental-next"
                  aria-label="Next"
                  style={{
                    position: "absolute",
                    right: "-10px",
                    top: "50%",
                    zIndex: 10,
                  }}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}


      <section
        style={{
          // backgroundColor: "#E8E4F5",
          // backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          // padding: isMobile ? "60px 0 45px 0" : "40px 0",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className=" py-4  py-lg-10  ">
          <div className="text-center"
            style={{
              borderRadius: "20px",
              padding: "10px 12px 12px",
              marginTop: "10px"
            }}>
            <div className="section-badgese mx-auto" style={{ marginBottom: "12px" }}>
              <i className="fa-solid fa-hand-pointer" />
              How to Book a Lab Test
            </div>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "8px",
                lineHeight: "1.2",
              }}
            >
              Three Easy Steps to Get Checked
            </h2>
            <p
              className="sectionse-subtitle"
              style={{ fontSize: "14px", color: "#666", margin: "0 auto 12px", maxWidth: "700px" }}
            >
              Simple steps to get your health checkup done with certified
              professionals and accurate results
            </p>
            {isMobile ? (
              <div style={{ padding: "0 10px" }}>
                <Swiper
                  modules={[Autoplay, Pagination]}
                  slidesPerView={1.2}
                  spaceBetween={16}
                  autoplay={{ delay: 4000, disableOnInteraction: false }}
                  pagination={{ clickable: true }}
                  style={{ paddingBottom: "45px", paddingTop: "20px" }}
                >
                  {[
                    {
                      step: "STEP 01",
                      icon: "fa-solid fa-magnifying-glass",
                      title: "Choose Your Test",
                      desc: "Select the test that matches your health needs or doctor’s recommendation."
                    },
                    {
                      step: "STEP 02",
                      icon: "fa-solid fa-calendar-days",
                      title: "Book Appointment",
                      desc: "A certified phlebotomist visits you for sample collection at your selected time slot."
                    },
                    {
                      step: "STEP 03",
                      icon: "fa-solid fa-file-medical",
                      title: "Get Results",
                      desc: "Get reports in 12–24 hrs. View and download from the app anytime."
                    }
                  ].map((item, index) => (
                    <SwiperSlide key={index} style={{ height: "auto", display: "flex" }}>
                      <div
                        className="text-center w-100"
                        style={{
                          position: "relative",
                          padding: "32px 16px 24px",
                          background: "#ffffff",
                          borderRadius: "16px",
                          border: "1px solid #e2e8f0",
                          boxShadow: "0 4px 12px rgba(128, 89, 202, 0.02)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          height: "100%",
                        }}
                      >
                        <span
                          style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            background: "rgba(128, 89, 202, 0.08)",
                            color: "#8059ca",
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: "700",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {item.step}
                        </span>
                        <div
                          style={{
                            width: "60px",
                            height: "60px",
                            margin: "0 auto 20px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "rgba(128, 89, 202, 0.06)",
                            borderRadius: "16px",
                          }}
                        >
                          <i className={item.icon} style={{ fontSize: "26px", color: "#8059ca" }} />
                        </div>
                        <h5
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1c1e21",
                            marginBottom: "10px",
                            letterSpacing: "-0.01em",
                          }}
                        >
                          {item.title}
                        </h5>
                        <p
                          style={{
                            fontSize: "12.5px",
                            color: "#5c626a",
                            margin: 0,
                            lineHeight: "1.6",
                          }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            ) : (
              <div className="row align-items-center g-4">
                {[
                  {
                    step: "STEP 01",
                    icon: "fa-solid fa-magnifying-glass",
                    title: "Choose Your Test",
                    desc: "Select the test that matches your health needs or doctor’s recommendation."
                  },
                  {
                    step: "STEP 02",
                    icon: "fa-solid fa-calendar-days",
                    title: "Book Appointment",
                    desc: "A certified phlebotomist visits you for sample collection at your selected time slot."
                  },
                  {
                    step: "STEP 03",
                    icon: "fa-solid fa-file-medical",
                    title: "Get Results",
                    desc: "Get reports in 12–24 hrs. View and download from the app anytime."
                  }
                ].map((item, index) => (
                  <div key={index} className="col-md-4 col-12">
                    <div
                      className="text-center h-100"
                      style={{
                        position: "relative",
                        padding: "32px 20px 24px",
                        background: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(128, 89, 202, 0.02)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px)";
                        e.currentTarget.style.boxShadow = "0 12px 24px rgba(128, 89, 202, 0.08)";
                        e.currentTarget.style.borderColor = "#8059ca";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 4px 12px rgba(128, 89, 202, 0.02)";
                        e.currentTarget.style.borderColor = "#e2e8f0";
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          top: "16px",
                          right: "16px",
                          background: "rgba(128, 89, 202, 0.08)",
                          color: "#8059ca",
                          padding: "4px 10px",
                          borderRadius: "20px",
                          fontSize: "11px",
                          fontWeight: "700",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {item.step}
                      </span>
                      <div
                        style={{
                          width: "60px",
                          height: "60px",
                          margin: "0 auto 20px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(128, 89, 202, 0.06)",
                          borderRadius: "16px",
                          transition: "all 0.3s ease",
                        }}
                      >
                        <i className={item.icon} style={{ fontSize: "26px", color: "#8059ca" }} />
                      </div>
                      <h5
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#1c1e21",
                          marginBottom: "10px",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {item.title}
                      </h5>
                      <p
                        style={{
                          fontSize: "14px",
                          color: "#5c626a",
                          margin: 0,
                          lineHeight: "1.6",
                        }}
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div >
      </section >

      {/* why choose  */}
      < section
        style={{
          backgroundColor: "#E8E4F5",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "40px 0",
          position: "relative",
          overflow: "hidden",
        }
        }
      >
        <div
          className="container-fluid"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="text-center mb-4">
            <div
              className="section-badgese mx-auto"
              style={{ marginBottom: "12px" }}
            >
              <i className="fa-solid fa-circle-info" />
              Why Choose Us
            </div>
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "600",
                color: "#0F172A",
                marginBottom: "8px",
                lineHeight: "1.2",
              }}
            >
              Your Trusted Healthcare Partner
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "#64748B",
                maxWidth: "700px",
                margin: "0 auto",
                lineHeight: "1.5",
              }}
            >
              We are committed to providing you with accurate, reliable lab test
              results from NABL accredited laboratories with the convenience of
              home sample collection.
            </p>
          </div>
          {isMobile ? (
            <div style={{ padding: "0 10px" }}>
              <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1.2}
                spaceBetween={16}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                style={{ paddingBottom: "35px" }}
              >
                {[
                  {
                    icon: "fa-solid fa-flask-vial",
                    title: "NABL Accredited Labs",
                    description:
                      "All tests are conducted at NABL accredited laboratories ensuring highest quality and accuracy standards.",
                  },
                  {
                    icon: "fa-solid fa-house-medical",
                    title: "Home Sample Collection",
                    description:
                      "Expert phlebotomists visit your home at your preferred time slot for convenient sample collection.",
                  },
                  {
                    icon: "fa-solid fa-file-circle-check",
                    title: "Fast Report Delivery",
                    description:
                      "Get your test reports delivered online within 24-48 hours with detailed analysis and expert insights.",
                  },
                  {
                    icon: "fa-solid fa-user-doctor",
                    title: "Expert Phlebotomists",
                    description:
                      "Trained and certified phlebotomists ensure painless sample collection with proper hygiene protocols.",
                  },
                  {
                    icon: "fa-solid fa-mobile-screen-button",
                    title: "Online Report Access",
                    description:
                      "Access your reports anytime, anywhere through our secure online portal and mobile app.",
                  },
                  {
                    icon: "fa-solid fa-indian-rupee-sign",
                    title: "Competitive Pricing",
                    description:
                      "Compare prices across multiple labs and get the best deals with up to 75% discount on tests.",
                  },
                ].map((feature, index) => (
                  <SwiperSlide key={index} style={{ height: "auto", display: "flex" }}>
                    <div
                      style={{
                        background: "#FFFFFF",
                        borderRadius: "16px",
                        padding: "24px 16px",
                        height: "100%",
                        border: "1px solid rgba(128, 89, 202, 0.12)",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "0 4px 15px rgba(128, 89, 202, 0.03)",
                        width: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "50%",
                          backgroundColor: "#f3effa",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "16px",
                          color: "#8059ca",
                          fontSize: "20px"
                        }}
                      >
                        <i className={feature.icon}></i>
                      </div>

                      <h4
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                          marginBottom: "10px",
                          lineHeight: "1.4",
                        }}
                      >
                        {feature.title}
                      </h4>

                      <p
                        style={{
                          fontSize: "12.5px",
                          color: "#666",
                          lineHeight: "1.6",
                          margin: 0,
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div className="row g-4">
              {[
                {
                  icon: "fa-solid fa-flask-vial",
                  title: "NABL Accredited Labs",
                  description:
                    "All tests are conducted at NABL accredited laboratories ensuring highest quality and accuracy standards.",
                },
                {
                  icon: "fa-solid fa-house-medical",
                  title: "Home Sample Collection",
                  description:
                    "Expert phlebotomists visit your home at your preferred time slot for convenient sample collection.",
                },
                {
                  icon: "fa-solid fa-file-circle-check",
                  title: "Fast Report Delivery",
                  description:
                    "Get your test reports delivered online within 24-48 hours with detailed analysis and expert insights.",
                },
                {
                  icon: "fa-solid fa-user-doctor",
                  title: "Expert Phlebotomists",
                  description:
                    "Trained and certified phlebotomists ensure painless sample collection with proper hygiene protocols.",
                },
                {
                  icon: "fa-solid fa-mobile-screen-button",
                  title: "Online Report Access",
                  description:
                    "Access your reports anytime, anywhere through our secure online portal and mobile app.",
                },
                {
                  icon: "fa-solid fa-indian-rupee-sign",
                  title: "Competitive Pricing",
                  description:
                    "Compare prices across multiple labs and get the best deals with up to 75% discount on tests.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="col-lg-4 col-md-6 col-sm-12"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 10px 25px rgba(128, 89, 202, 0.08)";
                      e.currentTarget.style.borderColor = "#8059ca";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 15px rgba(128, 89, 202, 0.03)";
                      e.currentTarget.style.borderColor = "rgba(128, 89, 202, 0.12)";
                    }}
                    style={{
                      background: "#FFFFFF",
                      borderRadius: "16px",
                      padding: "24px",
                      height: "100%",
                      border: "1px solid rgba(128, 89, 202, 0.12)",
                      transition: "all 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      boxShadow: "0 4px 15px rgba(128, 89, 202, 0.03)",
                    }}
                  >
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#f3effa",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "16px",
                        color: "#8059ca",
                        fontSize: "20px"
                      }}
                    >
                      <i className={feature.icon}></i>
                    </div>

                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        marginBottom: "10px",
                        lineHeight: "1.4",
                      }}
                    >
                      {feature.title}
                    </h4>

                    <p
                      style={{
                        fontSize: "13.5px",
                        color: "#666",
                        lineHeight: "1.6",
                        margin: 0,
                      }}
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section >

      <section
        className="py-4"
        style={{
          // backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "300px",
            height: "300px",
            background:
              "linear-gradient(135deg, rgba(125, 46, 255, 0.05) 0%, rgba(17, 14, 253, 0.05) 100%)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            left: "-80px",
            width: "250px",
            height: "250px",
            background:
              "linear-gradient(135deg, rgba(4, 189, 108, 0.05) 0%, rgba(255, 202, 24, 0.05) 100%)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        ></div>

        <div
          className="container-fluid"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="text-center mb-4">
            <h2
              style={{
                fontSize: "26px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "8px",
                lineHeight: "1.2",
              }}
            >
              Best Practices We Offer
            </h2>
          </div>
          {isMobile ? (
            <div style={{ padding: "0 10px" }}>
              <Swiper
                modules={[Autoplay, Pagination]}
                slidesPerView={1.2}
                spaceBetween={16}
                autoplay={{ delay: 4000, disableOnInteraction: false }}
                pagination={{ clickable: true }}
                style={{ paddingBottom: "35px" }}
              >
                {[
                  {
                    title: "100% Safe & Secure",
                    desc: "We take all safety and hygiene measures to keep our customers safe",
                    icon: <i className="fa-solid fa-shield-halved" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                  },
                  {
                    title: "Online Reports",
                    desc: "You can download your reports online",
                    icon: <i className="fa-solid fa-file-invoice" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                  },
                  {
                    title: "Home Sample Collection",
                    desc: "Our expert phlebotomists will come and collect your sample",
                    icon: <i className="fa-solid fa-house-chimney-medical" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                  },
                  {
                    title: "MediCompares Advantage",
                    desc: "Enjoy upto 75% discount on diagnostic tests and health packages",
                    icon: <i className="fa-solid fa-award" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                  },
                  {
                    title: "Competitive Prices",
                    desc: "We offer best prices on our diagnostic tests and health packages",
                    icon: <i className="fa-solid fa-tags" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                  }
                ].map((practice, index) => (
                  <SwiperSlide key={index} style={{ height: "auto", display: "flex" }}>
                    <div
                      className="text-center w-100"
                      style={{
                        padding: "24px 5px",
                        background: "#ffffff",
                        borderRadius: "16px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 12px rgba(128, 89, 202, 0.02)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        height: "100%",
                      }}
                    >
                      <div
                        style={{
                          width: "56px",
                          height: "56px",
                          margin: "0 auto 16px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "rgba(128, 89, 202, 0.06)",
                          borderRadius: "14px",
                        }}
                      >
                        {practice.icon}
                      </div>
                      <h5
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#1c1e21",
                          marginBottom: "8px",
                        }}
                      >
                        {practice.title}
                      </h5>
                      <p
                        style={{
                          fontSize: "12.5px",
                          color: "#5c626a",
                          margin: 0,
                          lineHeight: "1.5",
                        }}
                      >
                        {practice.desc}
                      </p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "20px",
                justifyContent: "center",
              }}
            >
              {[
                {
                  title: "100% Safe & Secure",
                  desc: "We take all safety and hygiene measures to keep our customers safe",
                  icon: <i className="fa-solid fa-shield-halved" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                },
                {
                  title: "Online Reports",
                  desc: "You can download your reports online",
                  icon: <i className="fa-solid fa-file-invoice" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                },
                {
                  title: "Home Sample Collection",
                  desc: "Our expert phlebotomists will come and collect your sample",
                  icon: <i className="fa-solid fa-house-chimney-medical" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                },
                {
                  title: "MediCompares Advantage",
                  desc: "Enjoy upto 75% discount on diagnostic tests and health packages",
                  icon: <i className="fa-solid fa-award" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                },
                {
                  title: "Competitive Prices",
                  desc: "We offer best prices on our diagnostic tests and health packages",
                  icon: <i className="fa-solid fa-tags" style={{ fontSize: "24px", color: "#8059ca" }}></i>
                }
              ].map((practice, index) => (
                <div
                  key={index}
                  style={{
                    flex: "1 1 200px",
                    maxWidth: "220px",
                    minWidth: "200px",
                  }}
                >
                  <div
                    className="text-center h-100"
                    style={{
                      padding: "24px 16px",
                      background: "#ffffff",
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 12px rgba(128, 89, 202, 0.02)",
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: "pointer",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-6px)";
                      e.currentTarget.style.boxShadow = "0 12px 24px rgba(128, 89, 202, 0.08)";
                      e.currentTarget.style.borderColor = "#8059ca";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "0 4px 12px rgba(128, 89, 202, 0.02)";
                      e.currentTarget.style.borderColor = "#e2e8f0";
                    }}
                  >
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        margin: "0 auto 16px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "rgba(128, 89, 202, 0.06)",
                        borderRadius: "14px",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {practice.icon}
                    </div>
                    <h5
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1c1e21",
                        marginBottom: "8px",
                        letterSpacing: "-0.01em",
                      }}
                    >
                      {practice.title}
                    </h5>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "#5c626a",
                        margin: 0,
                        lineHeight: "1.5",
                      }}
                    >
                      {practice.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* discoount popup */}
      {
        showDiscountPopup && (
          <div
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              zIndex: 9999,
              animation: "slideInUp 0.5s ease-out",
            }}
            className="d-none"
          >
            <style>{`
            @keyframes slideInUp {
              from {
                transform: translateY(100px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            @keyframes pulse {
              0%, 100% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.05);
              }
            }
          `}</style>
            <div
              style={{
                background:
                  "linear-gradient(135deg, #8059ca 0%, #822BD4 50%, #A855F7 100%)",
                borderRadius: "18px",
                padding: "20px",
                boxShadow: "0 10px 40px rgba(125, 46, 255, 0.4)",
                minWidth: "280px",
                maxWidth: "320px",
                position: "relative",
                border: "2px solid rgba(255, 255, 255, 0.2)",
                backdropFilter: "blur(10px)",
              }}
            >
              {/* Close Button */}
              <button
                onClick={() => setShowDiscountPopup(false)}
                style={{
                  position: "absolute",
                  top: "10px",
                  right: "10px",
                  background: "rgba(255, 255, 255, 0.2)",
                  border: "none",
                  borderRadius: "50%",
                  width: "28px",
                  height: "28px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#ffffff",
                  fontSize: "16px",
                  fontWeight: "700",
                  transition: "all 0.3s ease",
                  zIndex: 10,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                  e.currentTarget.style.transform = "rotate(90deg)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                  e.currentTarget.style.transform = "rotate(0deg)";
                }}
              >
                ×
              </button>

              {/* Decorative Elements */}
              <div
                style={{
                  position: "absolute",
                  top: "-20px",
                  right: "-20px",
                  width: "80px",
                  height: "80px",
                  background: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "50%",
                  filter: "blur(20px)",
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  bottom: "-15px",
                  left: "-15px",
                  width: "60px",
                  height: "60px",
                  background: "rgba(255, 255, 255, 0.08)",
                  borderRadius: "50%",
                  filter: "blur(15px)",
                }}
              ></div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div
                  style={{
                    background: "#FFCA18",
                    borderRadius: "10px",
                    padding: "10px 16px",
                    textAlign: "center",
                    marginBottom: "14px",
                    boxShadow: "0 4px 16px rgba(255, 202, 24, 0.4)",
                    animation: "pulse 2s ease-in-out infinite",
                  }}
                >
                  <div
                    style={{
                      fontSize: "30px",
                      fontWeight: "800",
                      color: "#1a1a1a",
                      lineHeight: "1",
                      marginBottom: "3px",
                    }}
                  >
                    50% OFF
                  </div>
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#1a1a1a",
                      letterSpacing: "0.5px",
                    }}
                  >
                    LIMITED TIME OFFER
                  </div>
                </div>

                {/* Title */}
                <h4
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#ffffff",
                    marginBottom: "10px",
                    lineHeight: "1.3",
                  }}
                >
                  🎉 Special Discount on Lab Tests!
                </h4>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#ffffff",
                    opacity: 0.95,
                    marginBottom: "16px",
                    lineHeight: "1.5",
                  }}
                >
                  Book any health package now and save big!
                </p>

                {/* Countdown Timer */}
                <div
                  style={{
                    background: "rgba(255, 255, 255, 0.15)",
                    borderRadius: "10px",
                    padding: "12px",
                    marginBottom: "14px",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      color: "#ffffff",
                      textAlign: "center",
                      marginBottom: "10px",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    ⏰ Offer Ends In
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      gap: "8px",
                    }}
                  >
                    {/* Hours */}
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        minWidth: "50px",
                        textAlign: "center",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          color: "#ffffff",
                          lineHeight: "1",
                          marginBottom: "3px",
                        }}
                      >
                        {String(countdown.hours).padStart(2, "0")}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: "600",
                          color: "#ffffff",
                          opacity: 0.9,
                          textTransform: "uppercase",
                        }}
                      >
                        Hours
                      </div>
                    </div>

                    {/* Minutes */}
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        minWidth: "50px",
                        textAlign: "center",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          color: "#ffffff",
                          lineHeight: "1",
                          marginBottom: "3px",
                        }}
                      >
                        {String(countdown.minutes).padStart(2, "0")}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: "600",
                          color: "#ffffff",
                          opacity: 0.9,
                          textTransform: "uppercase",
                        }}
                      >
                        Minutes
                      </div>
                    </div>

                    {/* Seconds */}
                    <div
                      style={{
                        background: "rgba(255, 255, 255, 0.2)",
                        borderRadius: "8px",
                        padding: "8px 10px",
                        minWidth: "50px",
                        textAlign: "center",
                        border: "1px solid rgba(255, 255, 255, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          color: "#ffffff",
                          lineHeight: "1",
                          marginBottom: "3px",
                        }}
                      >
                        {String(countdown.seconds).padStart(2, "0")}
                      </div>
                      <div
                        style={{
                          fontSize: "9px",
                          fontWeight: "600",
                          color: "#ffffff",
                          opacity: 0.9,
                          textTransform: "uppercase",
                        }}
                      >
                        Seconds
                      </div>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => {
                    navigate(`/search/${service}`);
                    setShowDiscountPopup(false);
                  }}
                  style={{
                    width: "100%",
                    background: "#ffffff",
                    border: "none",
                    borderRadius: "10px",
                    padding: "12px",
                    fontSize: "15px",
                    fontWeight: "700",
                    color: "#8059ca",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(0, 0, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 12px rgba(0, 0, 0, 0.2)";
                  }}
                >
                  Book Now & Save 50%
                </button>
              </div>
            </div>
          </div>
        )
      }

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
          setLeadFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
        }
        productId={
          currentLeadData?.med?._id || currentLeadData?.med?.id || null
        }
        vendorId={
          currentLeadData?.vendor?.vendorId ||
          currentLeadData?.vendor?._id ||
          null
        }
        variantId={currentLeadData?.variantId || null}
        onSubmit={handleSubmitLeadNew}
        fixedType="labtests"
      />

      {/* Rental Modal */}
      {
        rentProduct && (
          <RentModal
            show={showRentModal}
            fixedType="labtests"
            onClose={() => {
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
            }}
            rentProduct={rentProduct}
            formData={rentFormData}
            onFormChange={handleRentFormChange}
            onSubmit={handleRentSubmit}
            productId={rentProduct?.productId || rentProduct?.tabletdetails?._id}
            vendorId={rentProduct?.vendorId || rentProduct?.vendordetails?._id}
            variantId={rentProduct?.variantId || null}
          />
        )
      }

      {/* Consultation Modal */}
      <ConsultationModal
        show={showConsultationModal}
        fixedType="labtests"
        onClose={() => {
          setShowConsultationModal(false);
          setConsultationFormData({
            date: "",
            name: "",
            phone: "",
            category: "",
            address: "",
          });
        }}
        formData={consultationFormData}
        onFormChange={handleConsultationFormChange}
        onSubmit={handleConsultationSubmit}
        productId={consultationFormData.productId || null}
        vendorId={consultationFormData.vendorId || null}
        variantId={consultationFormData.variantId || null}
        title="Book a Consultation"
      />

      {/* Appointment Modal */}
      <AppointmentModal
        show={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setAppointmentFormData({
            date: "",
            name: "",
            phone: "",
            category: "",
            address: "",
          });
        }}
        formData={appointmentFormData}
        onFormChange={handleAppointmentFormChange}
        formType="appointment"
        fixedType="labtests"
        productId={appointmentFormData.productId || null}
        vendorId={appointmentFormData.vendorId || null}
        variantId={appointmentFormData.variantId || null}
      />
    </>
  );
};

export default labtests;
