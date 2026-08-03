import React, { useState } from "react";
import { SectionHeader } from "../../../components/ui/index.js";
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
      <section className="!py-10 !bg-[#f8f9fa] !relative !overflow-hidden">
        <div className="!absolute !top-[-100px] !right-[-100px] !w-[300px] !h-[300px] !rounded-full !bg-gradient-to-br !from-[rgba(125,46,255,0.1)] !to-[rgba(125,46,255,0.05)] !blur-[40px] !z-0"></div>
        <div className="!absolute !bottom-[-150px] !left-[-150px] !w-[400px] !h-[400px] !rounded-full !bg-gradient-to-br !from-[rgba(125,46,255,0.08)] !to-[rgba(125,46,255,0.03)] !blur-[50px] !z-0"></div>

        {/* Geometric Shapes */}
        <div className="!absolute !top-[20%] !left-[5%] !w-[60px] !h-[60px] !border-3 !border-solid !border-[rgba(125,46,255,0.15)] !rounded-[12px] !rotate-45 !z-0"></div>
        <div className="!absolute !bottom-[15%] !right-[8%] !w-[80px] !h-[80px] !border-3 !border-solid !border-[rgba(125,46,255,0.12)] !rounded-full !z-0"></div>

        <div className="container-fluid !relative !z-10">
          <div className="row mb-3">
            <div className="col-12 text-center">
              <h2
                className="!text-[40px] !font-semibold !inline-block !bg-gradient-to-br !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent !mb-[15px]"
                data-aos="fade-up"
                data-aos-delay="100"
              >
                Our Treatment Process
              </h2>
              <p
                className="!text-[18px] !text-[#67748e] !max-w-[600px] !mx-auto"
                data-aos="fade-up"
                data-aos-delay="200"
              >
                A simple, streamlined process from consultation to recovery
              </p>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="!flex !flex-wrap !justify-center !gap-[30px] !relative">
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
                    { primary: "#321961", light: "#F8F5FE" },
                    { primary: "#4ECDC4", light: "#E0F7F4" },
                    { primary: "#FFE66D", light: "#FFF9E6" },
                    { primary: "#A8E6CF", light: "#F0FDF4" },
                  ];
                  const color = colors[index % 4];

                  return (
                    <div
                      key={index}
                      className="!flex-[1_1_250px] !max-w-[280px] !relative group"
                      data-aos="fade-up"
                      data-aos-delay={index * 150}
                    >
                      {/* Connecting Line with Primary Color */}
                      {index < 3 && (
                        <div className="d-none d-lg-block !absolute !top-1/2 !right-[-20px] !-translate-y-1/2 !z-0">
                          <div className="!w-[40px] !h-[3px] !bg-gradient-to-r !from-[#321961] !to-[rgba(125,46,255,0.3)] !rounded-[2px] !relative">
                            <div className="!absolute !right-[-6px] !top-1/2 !-translate-y-1/2 !w-0 !h-0 !border-l-[8px] !border-l-solid !border-l-[#321961] !border-t-[4px] !border-t-transparent !border-b-[4px] !border-b-transparent"></div>
                          </div>
                        </div>
                      )}

                      {/* Top Accent Line */}
                      <div
                        className="!absolute !top-0 !left-0 !right-0 !h-[4px] !rounded-t-[15px] !transition-all !duration-300 group-hover:!h-[6px]"
                        style={{
                          background: `linear-gradient(90deg, ${color.primary} 0%, rgba(125, 46, 255, 0.3) 100%)`,
                        }}
                      ></div>

                      <div className="!bg-white !rounded-[15px] !py-10 !px-[30px] !shadow-[0_4px_20px_rgba(0,0,0,0.08)] !border !border-solid !border-[#e5e7eb] !border-t-0 !text-center !h-full !transition-all !duration-300 !relative !z-10 hover:!-translate-y-[5px] hover:!shadow-[0_8px_30px_rgba(125,46,255,0.2)] hover:!border-[#321961]">
                        {/* Icon Container with Primary Color Accent */}
                        <div className="!relative !inline-block !mb-[25px]">
                          {/* Decorative Circle Behind Icon */}
                          <div
                            className="!absolute !top-1/2 !left-1/2 !-translate-x-1/2 !-translate-y-1/2 !w-[100px] !h-[100px] !rounded-full !z-0"
                            style={{
                              background: `linear-gradient(135deg, ${color.primary}15 0%, ${color.primary}05 100%)`,
                            }}
                          ></div>
                          <div
                            className="!w-[80px] !h-[80px] !rounded-full !flex !items-center !justify-center !mx-auto !transition-all !duration-300 !relative !z-10 !border-3 !border-solid group-hover:!scale-[1.1] group-hover:!shadow-[0_8px_25px_rgba(128,89,202,0.4)]"
                            style={{
                              background: `linear-gradient(135deg, ${color.light} 0%, #ffffff 100%)`,
                              borderColor: `${color.primary}30`,
                            }}
                          >
                            <i
                              className={`${process.icon} !text-[32px] !transition-colors !duration-300`}
                              style={{
                                color: color.primary,
                              }}
                            ></i>
                          </div>
                        </div>

                        <div
                          className="!inline-block !py-[6px] !px-[16px] !rounded-[20px] !mb-[15px] !border !border-solid"
                          style={{
                            background: `linear-gradient(135deg, ${color.primary}15 0%, ${color.primary}05 100%)`,
                            borderColor: `${color.primary}20`,
                          }}
                        >
                          <span
                            className="!text-[12px] !font-semibold !tracking-[2px] !uppercase"
                            style={{
                              color: color.primary,
                            }}
                          >
                            STEP {process.step}
                          </span>
                        </div>

                        <h3 className="!text-[22px] !font-semibold !text-[#1a1a1a] !mb-[15px]">
                          {process.title}
                        </h3>

                        <p className="!text-[15px] !text-[#67748e] !leading-[1.7] !m-0">
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
        <div className="!m-0 !pt-5 lg:!pt-[15px] !pb-0 !mx-2 !bg-cover !bg-center !bg-no-repeat"
          style={{
            backgroundImage: "url('/assets/Medicompares Background.png')",
          }}>
          <div className="container-fluid !px-4 md:!px-6">
            <SectionHeader
              title="Top Popular Treatments"
              icon="fas fa-bolt"
              viewAllLink={`/${currentService}/all`}
              viewAllText="View All"
            />

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
                        className="!px-2 !mb-2 !h-full !flex !flex-col !cursor-pointer !w-full"
                        onClick={() => handleProductClick(treatment)}
                      >
                        <div
                          className="!bg-white !rounded-[16px] !overflow-hidden !shadow-[0_8px_20px_rgba(0,0,0,0.08)] !my-[20px] !w-full !flex !flex-col !h-full"
                        >
                          <div className="!relative">
                            {med?.files?.[0] ? (
                              <img
                                src={getImageUrl(med.files[0])}
                                alt={med.name}
                                loading="lazy"
                                className="!h-[150px] !object-contain !w-full"
                              />
                            ) : (
                              <div className="!h-[150px] !flex !items-center !justify-center !bg-[#f8f9fa] !rounded-[8px] !w-full">
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
                              className="!absolute !top-[10px] !right-[10px] !bg-gradient-to-br !from-[#f59e0b] !to-[#d97706] !rounded-[30px] !px-[14px] !py-[3px] !flex !items-center !gap-[6px] !shadow-[0_4px_12px_rgba(245,158,11,0.4)] !z-10 !border-[1.5px] !border-solid !border-white !cursor-pointer !transition-all !duration-300 hover:!scale-[1.12] hover:!-translate-y-[2px] hover:!shadow-[0_8px_20px_rgba(245,158,11,0.55)]"
                              title="Compare Package"
                            >
                              <i
                                className="fa-solid fa-hand-pointer !text-[13px] !text-white !rotate-90 !inline-block"
                              ></i>
                              <span className="!text-[11px] !font-extrabold !text-white !uppercase !tracking-[0.6px]">
                                Compare
                              </span>
                            </div>
                          </div>
                          <div className="!p-[6px_12px] !flex-grow !flex !flex-col">
                            <div className="d-flex justify-content-between align-items-center">
                              <h3 className="!font-medium !text-[#1a1a1a] !mb-[10px] !capitalize !text-[16px]">
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
                              <div className="!flex-[0_0_50%]">
                                <p className="mb-1 d-flex align-items-center !text-[11px] !text-black">
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
                            <div className="!flex-[0_0_50%]">
                              <p className="mb-1 d-flex align-items-center !text-[11px] !text-black">
                                <i
                                  className="fas fa-clock me-1 text-primary"
                                  style={{ width: "14px" }}
                                ></i>
                                <span className="me-1">Duration :</span>
                                <strong>3-5 Hours</strong>
                              </p>
                            </div>

                            <div className="!flex-[0_0_50%]">
                              <p className="mb-1 d-flex align-items-center !text-[11px] !text-black">
                                <i
                                  className="fas fa-hospital me-1 text-primary"
                                  style={{ width: "14px" }}
                                ></i>
                                <span className="me-1">Hospital stay :</span>
                                <strong>Required</strong>
                              </p>
                            </div>

                            <div className="!flex !flex-row !items-center !gap-2 !pb-2">
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
                                    <span
                                      className="!text-[16px] !font-bold !text-[#1a1a1a]"
                                    >
                                      ₹{displayPrice.toLocaleString("en-IN")}
                                    </span>

                                    {showDiscount && (
                                      <>
                                        <span
                                          className="!text-[#999] !line-through !text-[11.5px]"
                                        >
                                          ₹
                                          {originalPrice.toLocaleString(
                                            "en-IN",
                                          )}
                                        </span>
                                        <span
                                          className="!bg-[#F97316] !text-white !text-[10px] !py-[2px] !px-[6px] !rounded-[4px] !font-semibold !inline-block"
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
                              <div className="!mt-[12px] !border-t !border-solid !border-[#0000002e]">
                                <div
                                  className="!flex !items-center !gap-1 !pt-[10px] !pb-0 !px-0 !cursor-pointer !transition-all !duration-200 hover:!opacity-80 hover:!translate-x-[4px]"
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
                                >
                                  <div className="!w-[56px] !h-[56px] !rounded-[8px] !overflow-hidden !bg-white">
                                    <img
                                      src={getImageUrl(
                                        vendor?.bussiness_image?.[0]?.url ||
                                        vendor?.bussiness_image?.url,
                                      )}
                                      alt={vendor?.name}
                                      className="!w-full !h-full !object-contain"
                                    />
                                  </div>

                                  <div className="!grow !min-w-0">
                                    <div className="!flex !items-center !justify-between !w-full !gap-2 !mb-[2px]">
                                      <h6 className="!mb-0 !text-[12px] !font-semibold !tracking-[-0.2px] !whitespace-nowrap !overflow-hidden !text-ellipsis">
                                        {vendor?.name}
                                      </h6>
                                      {treatment?.averageRating > 0 && treatment?.ratingCount > 0 && (
                                        <div className="!flex !items-center !gap-[4px] !text-[10px] !text-[#666] !shrink-0">
                                          <i className="fas fa-star !text-[#ffc107] !text-[9px]"></i>
                                          <span className="!font-medium">
                                            {treatment?.averageRating.toFixed(1)}
                                          </span>
                                          <span className="!text-[#999]">
                                            ({treatment?.ratingCount}+)
                                          </span>
                                        </div>
                                      )}
                                    </div>

                                    <div className="!flex !items-center !gap-1 !text-[#6b7280] !text-[11px] !overflow-hidden">
                                      <i className="fa-solid fa-location-dot !text-[11px] !text-[#321961]"></i>
                                      <span className="!overflow-hidden !text-ellipsis !whitespace-nowrap">
                                        {vendor?.address}
                                      </span>
                                    </div>
                                    {treatment?.distanceInKm && (
                                      <div className="!flex !items-center !gap-1 !text-[#6b7280] !text-[11px] !overflow-hidden">
                                        <i className="fas fa-map-marker-alt !text-[10px] !text-[#321961] !mr-[4px]"></i>

                                        <span className="!overflow-hidden !text-ellipsis !whitespace-nowrap">
                                          {parseFloat(treatment.distanceInKm).toFixed(1)} km away
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
                        color: "#321961",
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
