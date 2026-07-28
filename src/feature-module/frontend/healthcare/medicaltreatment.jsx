import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Autoplay } from "swiper/modules";
import { getHealthcareSwiperSettings } from "./healthcareSliderSettings.jsx";
import Slider from "react-slick";
import { Link, useNavigate } from "react-router-dom";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import toast from "react-hot-toast";
import { CartQuantityControls, VendorActions } from "../../../components/ui";
import LeadModal from "../pharmacy/products-components/LeadModal.jsx";
import RentModal from "../pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../pharmacy/products-components/AppointmentModal.jsx";
import { useCart } from "../../../hooks/useCart";
import { useProfile } from "../../../context/ProfileContext";
import SEOHelmet from "../../../components/SEOHelmet";
const medicaltreatment = ({
  medicalTreatments,
  imgUrl,
  topdoctors,
  handleBook,
  settings,
  currentService,
  middleBanners,
  service,
}) => {
  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [rentProduct, setRentProduct] = useState(null);
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();

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

  // Cart hooks
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

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id,
      variantId: effectiveVariantId || null,
      vendorId: vendor.vendorId || vendor._id,
      servicefixedTypes: servicePassed || service || med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "medicaltreatment",
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
      productId: med?._id || med?.id,
      variantId: effectiveVariantId || null,
      vendorId: vendor.vendorId || vendor._id,
      perDayRent: vendor?.perDayRent || 0,
      navigate,
      servicefixedTypes: servicePassed || service || med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "medicaltreatment",
    });
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

  const hasEnoughTreatments = medicalTreatments?.length > 4;

  const swiperSettings = getHealthcareSwiperSettings({
    modules: [Navigation, Autoplay],
    navigation: hasEnoughTreatments
      ? {
        nextEl: ".treatment-next",
        prevEl: ".treatment-prev",
      }
      : false,
    loop: hasEnoughTreatments,
  });

  const navigate = useNavigate();

  const handleProductClick = (treatment) => {
    const data = treatment?.tabletdetails;

    const categorySlug = data?.subcategorydetails?.catdetails?.slug;

    const subcategorySlug = data?.subcategorydetails?.slug;

    const productSlug = data?.slug;
    navigate(`/${categorySlug}/${subcategorySlug}/${productSlug}`);
  };

  return (
    <>
      <SEOHelmet page="treatments" />
      <section
        style={{
          padding: "40px 0",
          background: "#f8f9fa",
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
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(125, 46, 255, 0.1) 0%, rgba(125, 46, 255, 0.05) 100%)",
            filter: "blur(40px)",
            zIndex: 0,
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "400px",
            height: "400px",
            borderRadius: "50%",
            background:
              "linear-gradient(135deg, rgba(125, 46, 255, 0.08) 0%, rgba(125, 46, 255, 0.03) 100%)",
            filter: "blur(50px)",
            zIndex: 0,
          }}
        ></div>

        {/* Geometric Shapes */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "5%",
            width: "60px",
            height: "60px",
            border: "3px solid rgba(125, 46, 255, 0.15)",
            borderRadius: "12px",
            transform: "rotate(45deg)",
            zIndex: 0,
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            right: "8%",
            width: "80px",
            height: "80px",
            border: "3px solid rgba(125, 46, 255, 0.12)",
            borderRadius: "50%",
            zIndex: 0,
          }}
        ></div>

        <div
          className="container-fluid"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="row mb-3">
            <div className="col-12 text-center">
              <h2
                style={{
                  fontSize: "40px",
                  fontWeight: "700",
                  display: "inline-block",
                  background:
                    "linear-gradient(135deg, #8059ca 0%, #6d48b8 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  marginBottom: "15px",
                  color: "#8059ca",
                }}
                data-aos="fade-up"
                data-aos-delay="100"
              >
                Our Treatment Process
              </h2>
              <p
                style={{
                  fontSize: "18px",
                  color: "#67748e",
                  maxWidth: "600px",
                  margin: "0 auto",
                }}
                data-aos="fade-up"
                data-aos-delay="200"
              >
                A simple, streamlined process from consultation to recovery
              </p>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: "30px",
                  position: "relative",
                }}
              >
                {[
                  {
                    step: "01",
                    title: "Initial Consultation",
                    description:
                      "Schedule an appointment and meet with our specialists for comprehensive evaluation",
                    icon: "fas fa-calendar-check",
                  },
                  {
                    step: "02",
                    title: "Diagnosis & Planning",
                    description:
                      "Comprehensive evaluation and personalized treatment plan development",
                    icon: "fas fa-clipboard-list",
                  },
                  {
                    step: "03",
                    title: "Treatment Execution",
                    description:
                      "Expert care delivery using latest medical techniques and technologies",
                    icon: "fas fa-procedures",
                  },
                  {
                    step: "04",
                    title: "Recovery & Follow-up",
                    description:
                      "Post-treatment care, monitoring, and continuous support for optimal recovery",
                    icon: "fas fa-heart",
                  },
                ].map((process, index) => {
                  const colors = [
                    { primary: "#8059ca", light: "#F8F5FE" },
                    { primary: "#4ECDC4", light: "#E0F7F4" },
                    { primary: "#FFE66D", light: "#FFF9E6" },
                    { primary: "#A8E6CF", light: "#F0FDF4" },
                  ];
                  const color = colors[index % 4];

                  return (
                    <div
                      key={index}
                      style={{
                        flex: "1 1 250px",
                        maxWidth: "280px",
                        position: "relative",
                      }}
                      data-aos="fade-up"
                      data-aos-delay={index * 150}
                    >
                      {/* Connecting Line with Primary Color */}
                      {index < 3 && (
                        <div
                          className="d-none d-lg-block"
                          style={{
                            position: "absolute",
                            top: "50%",
                            right: "-20px",
                            transform: "translateY(-50%)",
                            zIndex: 0,
                          }}
                        >
                          <div
                            style={{
                              width: "40px",
                              height: "3px",
                              background:
                                "linear-gradient(90deg, #8059ca 0%, rgba(125, 46, 255, 0.3) 100%)",
                              borderRadius: "2px",
                              position: "relative",
                            }}
                          >
                            <div
                              style={{
                                position: "absolute",
                                right: "-6px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                width: 0,
                                height: 0,
                                borderLeft: "8px solid #8059ca",
                                borderTop: "4px solid transparent",
                                borderBottom: "4px solid transparent",
                              }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Top Accent Line */}
                      <div
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          height: "4px",
                          background: `linear-gradient(90deg, ${color.primary} 0%, rgba(125, 46, 255, 0.3) 100%)`,
                          borderRadius: "15px 15px 0 0",
                        }}
                      ></div>

                      <div
                        style={{
                          background: "#ffffff",
                          borderRadius: "15px",
                          padding: "40px 30px",
                          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                          border: "1px solid #e5e7eb",
                          borderTop: "none",
                          textAlign: "center",
                          height: "100%",
                          transition: "all 0.3s ease",
                          position: "relative",
                          zIndex: 1,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-5px)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 30px rgba(125, 46, 255, 0.2)";
                          e.currentTarget.style.borderColor = "#8059ca";
                          const accentLine =
                            e.currentTarget.previousElementSibling;
                          if (accentLine) {
                            accentLine.style.height = "6px";
                            accentLine.style.background = `linear-gradient(90deg, ${color.primary} 0%, ${color.primary}80 100%)`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 20px rgba(0, 0, 0, 0.08)";
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          const accentLine =
                            e.currentTarget.previousElementSibling;
                          if (accentLine) {
                            accentLine.style.height = "4px";
                            accentLine.style.background = `linear-gradient(90deg, ${color.primary} 0%, rgba(125, 46, 255, 0.3) 100%)`;
                          }
                        }}
                      >
                        {/* Icon Container with Primary Color Accent */}
                        <div
                          style={{
                            position: "relative",
                            display: "inline-block",
                            marginBottom: "25px",
                          }}
                        >
                          {/* Decorative Circle Behind Icon */}
                          <div
                            style={{
                              position: "absolute",
                              top: "50%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "100px",
                              height: "100px",
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${color.primary}15 0%, ${color.primary}05 100%)`,
                              zIndex: 0,
                            }}
                          ></div>
                          <div
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${color.light} 0%, #ffffff 100%)`,
                              border: `3px solid ${color.primary}30`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              margin: "0 auto",
                              transition: "all 0.3s ease",
                              position: "relative",
                              zIndex: 1,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.1)";
                              e.currentTarget.style.background = `linear-gradient(135deg, ${color.primary} 0%, #110EFD 100%)`;
                              e.currentTarget.style.borderColor = color.primary;
                              e.currentTarget.style.boxShadow = `0 8px 25px ${color.primary}40`;
                              const icon = e.currentTarget.querySelector("i");
                              if (icon) icon.style.color = "#ffffff";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = "scale(1)";
                              e.currentTarget.style.background = `linear-gradient(135deg, ${color.light} 0%, #ffffff 100%)`;
                              e.currentTarget.style.borderColor = `${color.primary}30`;
                              e.currentTarget.style.boxShadow = "none";
                              const icon = e.currentTarget.querySelector("i");
                              if (icon) icon.style.color = color.primary;
                            }}
                          >
                            <i
                              className={process.icon}
                              style={{
                                fontSize: "32px",
                                color: color.primary,
                                transition: "color 0.3s ease",
                              }}
                            ></i>
                          </div>
                        </div>

                        <div
                          style={{
                            display: "inline-block",
                            padding: "6px 16px",
                            background: `linear-gradient(135deg, ${color.primary}15 0%, ${color.primary}05 100%)`,
                            borderRadius: "20px",
                            marginBottom: "15px",
                            border: `1px solid ${color.primary}20`,
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              fontWeight: "700",
                              color: color.primary,
                              letterSpacing: "2px",
                              textTransform: "uppercase",
                            }}
                          >
                            STEP {process.step}
                          </span>
                        </div>

                        <h3
                          style={{
                            fontSize: "22px",
                            fontWeight: "700",
                            color: "#1a1a1a",
                            marginBottom: "15px",
                          }}
                        >
                          {process.title}
                        </h3>

                        <p
                          style={{
                            fontSize: "15px",
                            color: "#67748e",
                            lineHeight: "1.7",
                            margin: 0,
                          }}
                        >
                          {process.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {middleBanners?.length > 0 && (
        <section
          className="section welcome-section px-3 mt-3 "
          style={{ backgroundColor: "#ffffff", minHeight: "280px" }}
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

      {medicalTreatments && medicalTreatments.length > 0 && (
        <div className="content doctor-content pb-0 mx-2"
          style={{
            backgroundImage: "url('/assets/Medicompares Background.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            // padding: '20px'
          }}>
          <div className="container-fluid">
            <div className="d-flex align-items-center justify-content-between flex-wrap result-wrap gap-3">
              <h3 className="mb-2 top-vendor-badge">
                <i className="fas fa-bolt"></i>
                Top Popular Treatments
              </h3>

              <div className="d-flex align-items-center flex-wrap gap-3 mb-3">
                <Link
                  to={`/${currentService}/all`}
                  className="top-vendor-badge"
                >
                  View All
                  <i className="isax isax-arrow-right-1 ms-1"></i>
                </Link>
              </div>
            </div>

            <div className="row">
              <div
                className="meq-swiper-wrapper"
                style={{ position: "relative" }}
              >
                {hasEnoughTreatments && (
                  <button
                    className="meq-arrow-btn treatment-prev"
                    aria-label="Previous"
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                )}
                <Swiper {...swiperSettings}>
                  {medicalTreatments.map((treatment, index) => {
                    const vendor = treatment?.vendordetails;
                    const med = treatment?.tabletdetails;
                    return (
                      <SwiperSlide
                        key={treatment?._id || index}
                        style={{ display: "flex", alignSelf: "stretch" }}
                      >
                        <div
                          className="px-2 mb-2"
                          onClick={() => handleProductClick(treatment)}
                        >
                          <div
                            className="health-card"
                            style={{
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                              height: "100%",
                            }}
                          >
                            <div className="card-imgs">
                              {med?.files?.[0] ? (
                                <img
                                  src={getImageUrl(med.files[0])}
                                  alt={med.name}
                                  loading="lazy"
                                  style={{
                                    height: "150px",
                                    objectFit: "contain",
                                    width: "100%",
                                  }}
                                />
                              ) : (
                                <div
                                  style={{
                                    height: "150px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    background: "#f8f9fa",
                                    borderRadius: "8px",
                                    width: "100%",
                                  }}
                                >
                                  <i className="fas fa-briefcase-medical" style={{ fontSize: "40px", color: "#ccc" }}></i>
                                </div>
                              )}
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const data = treatment?.tabletdetails;
                                  const categorySlug =
                                    data?.subcategorydetails?.catdetails
                                      ?.slug;
                                  const subcategorySlug =
                                    data?.subcategorydetails?.slug;
                                  const productSlug = data?.slug;
                                  if (
                                    !categorySlug ||
                                    !subcategorySlug ||
                                    !productSlug
                                  )
                                    return;
                                  navigate(
                                    `/${categorySlug}/${subcategorySlug}/${productSlug}/compare`,
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
                            <div className="card-bodyyy">
                              <div className="d-flex justify-content-between align-items-center">
                                <h3 className="titlee text-dark mb-2">
                                  {med?.name?.length > 20
                                    ? med.name.slice(0, 20) + "..."
                                    : med?.name}
                                </h3>

                                <div
                                  className="d-flex align-items-center justify-content-end"
                                  style={{ minWidth: "80px", fontSize: "12px" }}
                                >
                                  <i className="fa fa-star text-warning me-1"></i>
                                  <span className="me-1">
                                    {med?.averageRating?.toFixed(1) > 0
                                      ? med.averageRating?.toFixed(1)
                                      : 0}
                                  </span>

                                  <i className="fa fa-users me-1 text-primary"></i>
                                  <span>
                                    (
                                    {med?.ratingCount > 0
                                      ? `${med.ratingCount}+`
                                      : 0}
                                    )
                                  </span>
                                </div>
                              </div>
                              {med?.subcategorydetails && (
                                <div style={{ flex: "0 0 50%" }}>
                                  <p
                                    className="mb-1 d-flex align-items-center"
                                    style={{ fontSize: "11px", color: "black" }}
                                  >
                                    <i
                                      className="fas fa-user-md me-1 text-primary"
                                      style={{ width: "14px" }}
                                    ></i>
                                    <span className="me-1">
                                      Specialist Type :
                                    </span>
                                    <strong>
                                      {med?.subcategorydetails?.name?.length >
                                        15
                                        ? med.subcategorydetails.name.slice(
                                          0,
                                          15,
                                        ) + "..."
                                        : med?.subcategorydetails?.name ||
                                        "General"}
                                    </strong>
                                  </p>
                                </div>
                              )}
                              <div style={{ flex: "0 0 50%" }}>
                                <p
                                  className="mb-1 d-flex align-items-center"
                                  style={{ fontSize: "11px", color: "black" }}
                                >
                                  <i
                                    className="fas fa-clock me-1 text-primary"
                                    style={{ width: "14px" }}
                                  ></i>
                                  <span className="me-1">Duration :</span>
                                  <strong>3-5 Hours</strong>
                                </p>
                              </div>

                              <div style={{ flex: "0 0 50%" }}>
                                <p
                                  className="mb-1 d-flex align-items-center"
                                  style={{ fontSize: "11px", color: "black" }}
                                >
                                  <i
                                    className="fas fa-hospital me-1 text-primary"
                                    style={{ width: "14px" }}
                                  ></i>
                                  <span className="me-1">Hospital stay :</span>
                                  <strong>Required</strong>
                                </p>
                              </div>

                              <div className="price-section d-flex align-items-center flex-wrap gap-2 pb-2">
                                {(() => {
                                  const originalPrice =
                                    parseFloat(treatment?.price) || 0;
                                  const discountPrice =
                                    parseFloat(
                                      treatment?.discountprice ||
                                      treatment?.discountPrice,
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
                                      <span className="current-price text-dark">
                                        ₹{displayPrice.toLocaleString("en-IN")}
                                      </span>

                                      {showDiscount && (
                                        <>
                                          <span className="old-price">
                                            ₹
                                            {originalPrice.toLocaleString(
                                              "en-IN",
                                            )}
                                          </span>
                                          <span
                                            className="discountts"
                                            style={{
                                              backgroundColor: "#F97316",
                                              fontSize: "12px",
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
                              <div style={{ marginTop: 'auto' }}>
                                <VendorActions
                                  bookingType={
                                    treatment?.vendordetails?.bookingType ||
                                    service?.categoryType ||
                                    "cart"
                                  }
                                  med={treatment?.tabletdetails || treatment}
                                  vendor={treatment?.vendordetails || {}}
                                  price={parseFloat(treatment?.price) || 0}
                                  calculatedDiscountPrice={parseFloat(treatment?.discountprice || treatment?.discountPrice) || null}
                                  stock={treatment?.stock || (treatment?.tabletdetails || treatment).stock || (treatment?.vendordetails || {}).stock || 999}
                                  service={treatment?.tabletdetails?.subcategorydetails?.catdetails?.fixedType || "medicaltreatment"}
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
                                    marginTop: "12px",
                                    borderTop: "1px solid #0000002e",
                                  }}
                                >
                                  <div
                                    className="d-flex align-items-center gap-1 footers"
                                    style={{
                                      padding: "10px 0 0 0",
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
                                        const vendorSlug = name
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
                                        width: "56px",
                                        height: "56px",
                                        borderRadius: "8px",
                                        overflow: "hidden",
                                        background: "#fff",
                                      }}
                                    >
                                      <img
                                        src={getImageUrl(
                                          vendor?.bussiness_image?.[0]?.url ||
                                          vendor?.bussiness_image?.url,
                                        )}
                                        alt={vendor?.name}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "contain",
                                        }}
                                      />
                                    </div>

                                    <div className="flex-grow-1">
                                      <h6
                                        className="mb-1 "
                                        style={{
                                          fontSize: "12px",
                                          fontWeight: "600 !important"
                                        }}
                                      >
                                        {vendor?.name}
                                      </h6>
                                      {treatment?.averageRating > 0 && treatment?.ratingCount > 0 && (
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
                                          {treatment?.averageRating > 0 && (
                                            <>
                                              <i
                                                className="fas fa-star"
                                                style={{
                                                  color: "#ffc107",
                                                  fontSize: "9px"
                                                }}
                                              ></i>
                                              <span style={{ fontWeight: "500" }}>
                                                {treatment?.averageRating.toFixed(1)}
                                              </span>
                                            </>
                                          )}
                                          {treatment?.ratingCount > 0 && (
                                            <span style={{ color: "#999" }}>
                                              ({treatment?.ratingCount}+)
                                            </span>
                                          )}
                                        </div>
                                      )}

                                      <div className="d-flex align-items-center text-dark">
                                        <i
                                          className="fa-solid fa-location-dot"
                                          style={{
                                            fontSize: "13px",
                                            color: "#8059ca",
                                          }}
                                        ></i>
                                        <span>
                                          {vendor?.address?.length > 22
                                            ? vendor.address.slice(0, 22) +
                                            "..."
                                            : vendor?.address}
                                        </span>
                                      </div>
                                      {treatment?.distanceInKm && (
                                        <span
                                          style={{
                                            fontSize: "11px",
                                            color: "#666",
                                          }}
                                        >
                                          <i
                                            className="isax isax-route-square"
                                            style={{
                                              fontSize: "11px",
                                              color: "#8059ca",
                                            }}
                                          ></i>{" "}
                                          {treatment.distanceInKm.toFixed(1)} km
                                          away
                                        </span>
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
                {hasEnoughTreatments && (
                  <button
                    className="meq-arrow-btn treatment-next"
                    aria-label="Next"
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {topdoctors && topdoctors.length > 0 && (
        <section
          style={{
            padding: "40px 0",
            background: "#ffffff",
          }}
          className="mx-2"
        >
          <div className="container-fluid">
            <div className="row mb-3">
              <div className="col-12 text-center">
                <h2
                  style={{
                    fontSize: "40px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                    marginBottom: "15px",
                  }}
                  data-aos="fade-up"
                >
                  Our Featured Specialists
                </h2>
                <p
                  style={{
                    fontSize: "18px",
                    color: "#67748e",
                    maxWidth: "600px",
                    margin: "0 auto",
                  }}
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  Meet our expert medical professionals dedicated to your health
                </p>
              </div>
            </div>

            <div className="row g-4">
              {topdoctors.slice(0, 4).map((doctor, index) => (
                <div
                  key={index}
                  className="col-lg-3 col-md-6"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div
                    style={{
                      background: "#ffffff",
                      borderRadius: "12px",
                      padding: "30px",
                      boxShadow: "0 2px 12px rgba(0, 0, 0, 0.08)",
                      border: "1px solid #e5e7eb",
                      textAlign: "center",
                      height: "100%",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-5px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 20px rgba(0, 0, 0, 0.12)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow =
                        "0 2px 12px rgba(0, 0, 0, 0.08)";
                    }}
                  >
                    <div
                      style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        margin: "0 auto 20px auto",
                        overflow: "hidden",
                        border: "3px solid #f3f4f6",
                      }}
                    >
                      <img
                        src={imgUrl + doctor?.profileImage[0]}
                        alt={doctor.name}
                        title={doctor.name}
                        loading="lazy"
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <h3
                      style={{
                        fontSize: "20px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        marginBottom: "8px",
                      }}
                    >
                      {doctor.name.length > 20
                        ? doctor.name.substring(0, 20) + "..."
                        : doctor.name}
                    </h3>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "#8059ca",
                        fontWeight: "500",
                        marginBottom: "15px",
                      }}
                    >
                      {doctor.position.length > 20
                        ? doctor.position.substring(0, 20) + "..."
                        : doctor.position}
                    </p>

                    <div style={{ marginBottom: "20px" }}>
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className="fas fa-star"
                          style={{
                            color:
                              i < Math.floor(doctor.ratings)
                                ? "#FFC107"
                                : "#e0e0e0",
                            fontSize: "13px",
                            marginRight: "3px",
                          }}
                        ></i>
                      ))}
                      <span
                        style={{
                          fontSize: "14px",
                          color: "#67748e",
                          marginLeft: "8px",
                        }}
                      >
                        {doctor.ratings}
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-around",
                        paddingTop: "20px",
                        borderTop: "1px solid #f3f4f6",
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginBottom: "4px",
                          }}
                        >
                          Experience
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                          }}
                        >
                          {doctor.experience}+ Years
                        </div>
                      </div>

                      <div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#9ca3af",
                            marginBottom: "4px",
                          }}
                        >
                          Patients
                        </div>
                        <div
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                          }}
                        >
                          10+
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

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
        fixedType="medicaltreatment"
      />

      {/* Rental Modal */}
      {rentProduct && (
        <RentModal
          show={showRentModal}
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
          fixedType="medicaltreatment"
        />
      )}

      {/* Consultation Modal */}
      <ConsultationModal
        show={showConsultationModal}
        fixedType="medicaltreatment"
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
        fixedType="medicaltreatment"
        formType="appointment"
        productId={appointmentFormData.productId || null}
        vendorId={appointmentFormData.vendorId || null}
        variantId={appointmentFormData.variantId || null}
      />
    </>
  );
};

export default medicaltreatment;
