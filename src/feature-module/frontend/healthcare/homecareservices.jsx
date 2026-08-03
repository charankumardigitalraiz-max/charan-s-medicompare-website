import React, { useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation } from "swiper/modules";
import { useNavigate, Link } from "react-router-dom";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import { CartQuantityControls, VendorActions } from "../../../components/ui";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import LeadModal from "../pharmacy/products-components/LeadModal.jsx";
import RentModal from "../pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../pharmacy/products-components/AppointmentModal.jsx";
import { useCart } from "../../../hooks/useCart";
import { useProfile } from "../../../context/ProfileContext";
import Slider from "react-slick";
import {
  getHealthcareSwiperSettings,
  getHealthcareTwoSlideOfferSettings,
} from "./healthcareSliderSettings.jsx";
import { Autoplay } from "swiper/modules";
import SEOHelmet from "../../../components/SEOHelmet";
const HomeCareServices = ({
  medicalTreatments,
  imgUrl,
  currentService,
  service,
  settings,
  middleBanners,
}) => {
  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [rentProduct, setRentProduct] = useState(null);
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };
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
      servicefixedTypes: med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || servicePassed || "homecareservices",
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
      servicefixedTypes: med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || servicePassed || "homecareservices",
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

  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState("milestone");

  const stripHtmlTags = (html) => {
    if (!html) return "";
    const tmp = document.createElement("div");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  };

  const formatDescription = (description, maxLength = 100) => {
    if (!description) return "";
    const plainText = stripHtmlTags(description);
    const trimmed = plainText.trim();
    if (trimmed.length > maxLength) {
      return trimmed.substring(0, maxLength) + "...";
    }
    return trimmed;
  };
  const [showModal, setShowModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  const [bookingFormData, setBookingFormData] = useState({
    date: "",
    name: "",
    mobile: "",
    time: "",
    address: "",
  });

  const swiperSettings = getHealthcareSwiperSettings({
    modules: [Navigation, Autoplay],
    navigation: {
      nextEl: ".homecare-next",
      prevEl: ".homecare-prev",
    },
    loop: medicalTreatments?.length > 1,
  });
  const settings1 = getHealthcareTwoSlideOfferSettings();

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedTreatment(null);
    setBookingFormData({
      date: "",
      name: "",
      mobile: "",
      time: "",
      address: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    try {
      const leadPayload = {
        name: bookingFormData.name,
        date: bookingFormData.date,
        phone: bookingFormData.mobile,
        address: bookingFormData.address,
        time: bookingFormData.time,
      };

      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login");
        navigate("/login");
        return;
      }

      await axiosUserInstance.post("lead/create", leadPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Lead added successfully!");
      handleCloseModal();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to add lead",
      );
    }
  };

  const handleBookNow = (treatment) => {
    const isLoggedIn = !!localStorage.getItem("medicomparestoken");
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }
    setSelectedTreatment(treatment);
    setShowModal(true);
  };

  const handleProductClick = (item) => {
    const data = item?.tabletdetails || item?.medicineDetails || item;

    const categorySlug =
      data?.subcategorydetails?.catdetails?.slug ||
      data?.subcatdetails?.catdetails?.slug;

    const subcategorySlug =
      data?.subcategorydetails?.slug || data?.subcatdetails?.slug;

    const productSlug = data?.slug;

    navigate(`/${categorySlug}/${subcategorySlug}/${productSlug}`);
  };

  const PRIMARY_COLOR = "#321961";
  const PRIMARY_SECTION_BG = "#f8f4ff";
  const PRIMARY_DARK = "#6d48b8";

  const MOBILE_BOOKING_STEPS = [
    {
      step: "01",
      title: "Select Service",
      icon: "assets/img/icons/flow-chart-icon-01.svg",
      highlight: false,
    },
    {
      step: "02",
      title: "Book Appointment",
      icon: "assets/img/icons/flow-chart-icon-02.svg",
      highlight: true,
    },
    {
      step: "03",
      title: "Caregiver Arrives",
      icon: "assets/img/icons/flow-chart-icon-03.svg",
      highlight: false,
    },
    {
      step: "04",
      title: "Receive Care",
      icon: "assets/img/icons/flow-chart-icon-04.svg",
      highlight: true,
    },
  ];

  return (
    <>
      <SEOHelmet page="homecare" />
      {medicalTreatments && medicalTreatments.length > 0 && (
        <section className="!pb-5 !pt-0 !bg-[#f8f4ff]">
          <div className="container-fluid !px-3">
            {/* Header */}
            <div className="!flex !items-center !justify-between !flex-wrap !gap-3 !mb-4 !pt-4">
              <h3 className="!m-0 !text-[20px] !font-semibold !text-[#1a1a1a]">
                <i className="fas fa-bolt !text-warning !me-2"></i>
                Top Services
              </h3>
              <Link
                to={`/${currentService}/all`}
                className="!inline-flex !items-center !justify-center !font-semibold !text-[12px] !text-[#321961] hover:!bg-[#321961] hover:!text-white !transition-all !duration-300 !bg-gradient-to-br !from-[rgba(125,46,255,0.1)] !to-[rgba(59,130,246,0.1)] !p-[8px] !rounded-full !w-[36px] !h-[36px] md:!py-[8px] md:!px-[20px] md:!rounded-[50px] md:!w-auto md:!h-auto"
              >
                <span className="!hidden md:!inline">View All</span>
                <i className="isax isax-arrow-right-1 md:!ms-1"></i>
              </Link>
            </div>

            {/* Swiper */}
            <div className="meq-swiper-wrapper !relative [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto">
              <button className="meq-arrow-btn homecare-prev" aria-label="Previous">
                <i className="fas fa-chevron-left"></i>
              </button>
              <Swiper {...swiperSettings}>
                {medicalTreatments?.map((treatment, index) => {
                  const vendor = treatment?.vendordetails;
                  const med = treatment?.tabletdetails;
                  const bookingType = vendor?.bookingType || service?.categoryType || "cart";
                  return (
                    <SwiperSlide key={index} className="!p-2 !flex !self-stretch">
                      <div className="!flex !flex-col !h-full !w-full !rounded-[16px] !bg-white !shadow-[0_4px_20px_rgba(0,0,0,0.1)] !overflow-hidden !transition-all !duration-300 hover:!shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:!-translate-y-[2px] !relative">

                        {/* Compare Badge */}
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const data = treatment?.tabletdetails;
                            const categorySlug = data?.subcategorydetails?.catdetails?.slug;
                            const subcategorySlug = data?.subcategorydetails?.slug;
                            const productSlug = data?.slug;
                            if (!categorySlug || !subcategorySlug || !productSlug) return;
                            navigate(`/${categorySlug}/${subcategorySlug}/${productSlug}/compare`);
                          }}
                          className="!absolute !top-[10px] !right-[10px] !flex !items-center !gap-[6px] !z-10 !cursor-pointer !transition-all !duration-300 hover:!scale-[1.12] hover:!-translate-y-[2px]"
                          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "30px", padding: "3px 14px", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", border: "1.5px solid #fff" }}
                          title="Compare Package"
                        >
                          <i className="fa-solid fa-hand-pointer" style={{ fontSize: "13px", color: "#fff", transform: "rotate(90deg)", display: "inline-block" }}></i>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "0.6px" }}>Compare</span>
                        </div>

                        {/* Product Image */}
                        <div className="!w-full !h-[180px] !rounded-t-[16px] !overflow-hidden !bg-white">
                          <img
                            src={getImageUrl(treatment?.tabletdetails?.files[0])}
                            alt={treatment?.tabletdetails?.name}
                            title={treatment?.tabletdetails?.name}
                            onClick={() => handleProductClick(treatment)}
                            className="!w-full !h-full !object-contain !cursor-pointer"
                          />
                        </div>

                        {/* Card Body */}
                        <div className="!flex !flex-col !flex-1 !p-3">

                          {/* Name & Rating */}
                          <div className="!flex !items-start !justify-between !gap-2 !mb-2">
                            <h3 className="!m-0 !text-[14px] !font-semibold !text-[#1a1a1a] !capitalize !leading-snug !line-clamp-2 !min-h-[2.8em] !cursor-pointer" onClick={() => handleProductClick(treatment)}>
                              {treatment?.tabletdetails?.name || "Service"}
                            </h3>
                            <div className="!flex !items-center !shrink-0 !gap-[3px] !text-[11px]">
                              <i className="fa fa-star !text-[#ffc107]"></i>
                              <span className="!text-[#444]">
                                {treatment?.tabletdetails?.averageRating?.toFixed(1) > 0 ? treatment?.tabletdetails.averageRating?.toFixed(1) : 0}
                              </span>
                              <i className="fa fa-users !ml-1 !text-primary"></i>
                              <span className="!text-[#666]">
                                ({treatment?.tabletdetails?.ratingCount > 0 ? `${treatment?.tabletdetails.ratingCount}+` : 0})
                              </span>
                            </div>
                          </div>

                          {/* Description */}
                          <p className="!m-0 !mb-2 !text-[11px] !text-[#666] !leading-normal !line-clamp-2 !min-h-[2.8em] !cursor-pointer" onClick={() => handleProductClick(treatment)}>
                            {formatDescription(treatment?.tabletdetails?.description, 100)}
                          </p>

                          {/* Optional metadata */}
                          {treatment?.tabletdetails?.duration && (
                            <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[4px]">
                              <i className="fa-regular fa-clock !text-primary"></i>
                              <span>Duration:</span>
                              <strong>{treatment?.tabletdetails?.duration}</strong>
                            </div>
                          )}
                          {treatment?.tabletdetails?.shiftType && (
                            <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[2px]">
                              <i className="fa-regular fa-calendar-days !text-primary"></i>
                              <span>Shift:</span>
                              <strong>{treatment?.tabletdetails?.shiftType}</strong>
                            </div>
                          )}
                          {treatment?.tabletdetails?.nursecareType && (
                            <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[2px]">
                              <i className="fas fa-house-user !text-primary"></i>
                              <span>Type:</span>
                              <strong>{treatment?.tabletdetails?.nursecareType}</strong>
                            </div>
                          )}
                          {treatment?.tabletdetails?.homecareMode && (
                            <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[2px]">
                              <i className="fa-solid fa-house !text-primary"></i>
                              <span>Mode:</span>
                              <strong>{treatment?.tabletdetails?.homecareMode}</strong>
                            </div>
                          )}

                          {/* Price — pushed to bottom */}
                          <div className="!rounded-[8px] !p-[8px] !mt-auto !border !border-[rgba(128,89,202,0.15)] !bg-[#f8f4ff]">
                            <div className="!text-[11px] !text-[#000] !font-medium !mb-1">Starting From</div>
                            {treatment?.discountprice ? (
                              <div className="!flex !flex-wrap !items-center !gap-2">
                                <span className="!font-bold !text-[16px] !text-[#1a1a1a]">₹{treatment.discountprice}</span>
                                <span className="!line-through !text-[#999] !text-[13px]">₹{treatment.price}</span>
                                <span className="!text-green-600 !text-[11px] !font-semibold">
                                  {Math.round(((treatment.price - treatment.discountprice) / treatment.price) * 100)}% OFF
                                </span>
                              </div>
                            ) : (
                              <span className="!font-bold !text-[16px] !text-[#1a1a1a]">₹{treatment?.price || 0}</span>
                            )}
                          </div>

                          {/* Actions */}
                          <VendorActions
                            bookingType={
                              ["cart", "booking", "slots", "leads", "lead", "rentals", "consultation", "ride", "appointment", "rentals_addtocarts"].includes(bookingType)
                                ? bookingType
                                : "buy_now"
                            }
                            med={med}
                            vendor={vendor}
                            effectiveVariantId={null}
                            price={treatment?.price || 0}
                            stock={treatment?.stock || 999}
                            service={treatment?.tabletdetails?.subcategorydetails?.catdetails?.fixedType || treatment?.tabletdetails?.subcategorydetails?.category?.fixedType || treatment?.tabletdetails?.category?.fixedType || "homecareservices"}
                            calculatedDiscountPrice={treatment?.discountprice || treatment?.discountPrice || null}
                            handleRentalBookinProcess={handleRentalBookinProcess}
                            handleNavigateToBooking={
                              ["cart", "booking", "slots", "leads", "lead", "rentals", "consultation", "ride", "appointment", "rentals_addtocarts"].includes(bookingType)
                                ? handleBooking
                                : () => handleBookNow(treatment)
                            }
                            handleAddLead={handleAddLead}
                            handleOpenConsultationModal={handleConsultationClick}
                            handleOpenAppointmentModal={handleAppointmentClick}
                            handleOpenRideModal=""
                            containerStyle={{ width: "100%", marginTop: "6px" }}
                            buttonStyle={{ width: "100%", padding: "8px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}
                          />

                          {/* Vendor footer */}
                          {vendor && (
                            <div
                              className="!flex !items-center !gap-2 !mt-[6px] !pt-[6px] !border-t !border-[#e0e0e0] !cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                const vendorId = vendor?.slug || vendor?.vendorId || vendor?._id || vendor?.bussinessdetails?.slug || vendor?.bussinessdetails?.vendorId || vendor?.bussinessdetails?._id;
                                if (vendorId) {
                                  sessionStorage.setItem("vendorId", vendorId);
                                  const name = vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
                                  const vendorSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                                  navigate(`/vendor-profile/${vendorSlug}`);
                                } else {
                                  toast.error("Vendor information not available");
                                }
                              }}
                            >
                              <div className="!w-10 !h-10 !rounded-lg !overflow-hidden !bg-white !border !border-[rgba(125,46,255,0.15)] !shrink-0">
                                <img
                                  src={getImageUrl(vendor?.bussiness_image?.[0]?.url) || ""}
                                  alt={vendor.name}
                                  className="!w-full !h-full !object-contain"
                                />
                              </div>
                              <div className="!grow !min-w-0">
                                <div className="!flex !items-center !justify-between !gap-2 !mb-[2px]">
                                  <h6 className="!m-0 !text-[12px] !font-semibold !truncate">{vendor.name}</h6>
                                  {(() => {
                                    const rating = Number(treatment?.averageRating);
                                    const count = Number(treatment?.ratingCount);
                                    if (!rating || !count || rating === 0 || count === 0) return null;
                                    return (
                                      <div className="!flex !items-center !gap-[4px] !text-[10px] !text-[#666] !shrink-0">
                                        <i className="fas fa-star !text-[#ffc107] !text-[9px]"></i>
                                        <span className="!font-medium">{rating.toFixed(1)}</span>
                                        <span className="!text-[#999]">({count}+)</span>
                                      </div>
                                    );
                                  })()}
                                </div>
                                <div className="!flex !items-center !gap-1 !text-[#6b7280] !text-[10px] !overflow-hidden">
                                  <i className="fa-solid fa-location-dot !text-[10px] !text-[#321961]"></i>
                                  <span className="!truncate">{vendor.address}</span>
                                </div>
                                {treatment?.distanceInKm && (
                                  <div className="!flex !items-center !gap-1 !text-[#6b7280] !text-[10px]">
                                    <i className="fas fa-map-marker-alt !text-[9px] !text-[#321961]"></i>
                                    <span>{parseFloat(treatment.distanceInKm).toFixed(1)} km away</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              <button className="meq-arrow-btn homecare-next" aria-label="Next">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </section>
      )}



      {/* How It Works Section */}
      <section
        className="!py-10"
        style={{
          backgroundColor: "#E8E4F5",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="!max-w-7xl !mx-auto !px-4">
          <div className="!flex !flex-col lg:!flex-row !items-center !gap-8">

            {/* Left Column Header Info */}
            <div className="lg:!w-5/12 !text-center lg:!text-left">
              <span className="!text-[12px] !font-semibold !text-[#321961] !tracking-wider !uppercase">Simple booking process</span>
              <h2 className="!mt-2 !text-[32px] !font-bold !text-[#1a1a1a] !leading-tight">
                How it <span className="!text-[#321961]">Works &amp; Booking</span>
              </h2>
              <p className="!text-[#666] !text-[14px] !leading-[1.6] !mt-3">
                Book professional home care services in just a few simple
                steps. Our streamlined process ensures you get the care you
                need quickly and efficiently.
              </p>
            </div>

            {/* Right Column Step Indicators */}
            <div className="lg:!w-7/12 !w-full">
              {/* Desktop view */}
              <div className="!hidden md:!grid !grid-cols-4 !gap-4 !relative">

                {/* Step 1 */}
                <div className="!flex !flex-col !items-center !text-center !p-4 !bg-white !rounded-[16px] !shadow-[0_4px_16px_rgba(0,0,0,0.05)] !relative">
                  <div className="!w-[54px] !h-[54px] !bg-[#f8f6fc] !rounded-full !flex !items-center !justify-center !mb-3">
                    <img src="assets/img/icons/flow-chart-icon-01.svg" alt="Img" className="!w-[28px] !h-[28px]" />
                  </div>
                  <h6 className="!m-0 !text-[13px] !font-semibold !text-[#1a1a1a]">Select Service</h6>
                  <span className="!absolute !bottom-2 !right-3 !text-[11px] !font-bold !text-[#321961] !opacity-30">01</span>
                </div>

                {/* Step 2 */}
                <div className="!flex !flex-col !items-center !text-center !p-4 !bg-white !rounded-[16px] !shadow-[0_4px_16px_rgba(0,0,0,0.05)] !relative">
                  <div className="!w-[54px] !h-[54px] !bg-[#fffbe6] !rounded-full !flex !items-center !justify-center !mb-3">
                    <img src="assets/img/icons/flow-chart-icon-02.svg" alt="Img" className="!w-[28px] !h-[28px]" />
                  </div>
                  <h6 className="!m-0 !text-[13px] !font-semibold !text-[#1a1a1a]">Book Appointment</h6>
                  <span className="!absolute !bottom-2 !right-3 !text-[11px] !font-bold !text-[#321961] !opacity-30">02</span>
                </div>

                {/* Step 3 */}
                <div className="!flex !flex-col !items-center !text-center !p-4 !bg-white !rounded-[16px] !shadow-[0_4px_16px_rgba(0,0,0,0.05)] !relative">
                  <div className="!w-[54px] !h-[54px] !bg-[#f8f6fc] !rounded-full !flex !items-center !justify-center !mb-3">
                    <img src="assets/img/icons/flow-chart-icon-03.svg" alt="Img" className="!w-[28px] !h-[28px]" />
                  </div>
                  <h6 className="!m-0 !text-[13px] !font-semibold !text-[#1a1a1a]">Caregiver Arrives</h6>
                  <span className="!absolute !bottom-2 !right-3 !text-[11px] !font-bold !text-[#321961] !opacity-30">03</span>
                </div>

                {/* Step 4 */}
                <div className="!flex !flex-col !items-center !text-center !p-4 !bg-white !rounded-[16px] !shadow-[0_4px_16px_rgba(0,0,0,0.05)] !relative">
                  <div className="!w-[54px] !h-[54px] !bg-[#fffbe6] !rounded-full !flex !items-center !justify-center !mb-3">
                    <img src="assets/img/icons/flow-chart-icon-04.svg" alt="Img" className="!w-[28px] !h-[28px]" />
                  </div>
                  <h6 className="!m-0 !text-[13px] !font-semibold !text-[#1a1a1a]">Receive Care</h6>
                  <span className="!absolute !bottom-2 !right-3 !text-[11px] !font-bold !text-[#321961] !opacity-30">04</span>
                </div>

              </div>

              {/* Mobile steps */}
              <div className="md:!hidden !flex !flex-col !gap-3 !mt-4">
                {MOBILE_BOOKING_STEPS.map((item) => (
                  <div key={item.step} className="!flex !items-center !gap-4 !p-4 !bg-white !rounded-[14px] !shadow-[0_2px_8px_rgba(0,0,0,0.05)] !border !border-[rgba(128,89,202,0.1)]">
                    <div className="!w-[44px] !h-[44px] !rounded-[10px] !bg-[#f8f6fc] !flex !items-center !justify-center !shrink-0 !border !border-[#321961]">
                      <img src={item.icon} alt="" className="!w-[22px] !h-[22px]" />
                    </div>
                    <div className="!grow">
                      <span className="!text-[10px] !font-bold !text-[#321961] !uppercase">Step {item.step}</span>
                      <h6 className="!m-0 !text-[14px] !font-semibold !text-[#1a1a1a]">{item.title}</h6>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Offers & Promotions */}
      {middleBanners?.length > 0 && (
        <section
          className="!py-8 !px-4"
          style={{ backgroundColor: PRIMARY_SECTION_BG }}
        >
          <div className="!max-w-7xl !mx-auto">
            <div className="!text-center !mb-6">
              <h2 className="!m-0 !text-[26px] !font-semibold !text-[#1a1a1a]">
                <i className="fas fa-bolt text-warning me-2"></i>Offers &amp; Promotions
              </h2>
            </div>
            {middleBanners.length > 1 ? (
              <Slider {...settings}>
                {middleBanners.map((image, index) => (
                  <div key={index} className="!px-2">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="!w-full !rounded-[12px] !object-cover"
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="!w-full">
                <img
                  src={middleBanners[0]?.src}
                  alt={middleBanners[0]?.alt}
                  title={middleBanners[0]?.alt}
                  loading="lazy"
                  className="!w-full !rounded-[12px] !object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )}

      <section
        className="!py-10 !hidden md:!block !overflow-hidden"
        style={{ backgroundColor: PRIMARY_SECTION_BG }}
      >
        <div className="!max-w-7xl !mx-auto !px-4">
          {/* Header */}
          <div className="!text-center !mb-8">
            <h2 className="!text-[38px] !font-semibold !bg-gradient-to-r !from-[#321961] !to-[#5d3ebc] !bg-clip-text !text-transparent !tracking-tight">
              How do we Deliver Fastest Recovery?
            </h2>
            <p className="!text-[#666] !mx-auto !mt-2 !max-w-[600px] !text-[15px] !leading-relaxed">
              Our scientifically-backed methodology focuses on personalized
              milestones and holistic care for rapid rehabilitation.
            </p>
          </div>

          <div className="!grid !grid-cols-12 !gap-6 !items-stretch">
            {/* Left Column - Interaction Phases */}
            <div className="!col-span-5 !flex !flex-col !justify-center !gap-3">
              {[
                {
                  id: "milestone",
                  phase: "Phase 01",
                  title: "Milestone Based Approach",
                  desc: "MediCompares ensures Fastest Recovery with clear goals at every step of recovery journey.",
                  icon: "fa-solid fa-flag-checkered",
                  color: PRIMARY_COLOR,
                  bg: PRIMARY_SECTION_BG,
                },
                {
                  id: "pmr",
                  phase: "Phase 02",
                  title: "Personalized Treatment",
                  desc: "Expert medical supervision ensures personalized treatment plans tailored to each patient's unique recovery needs.",
                  icon: "fa-solid fa-user-doctor",
                  color: PRIMARY_COLOR,
                  bg: PRIMARY_SECTION_BG,
                },
                {
                  id: "team",
                  phase: "Phase 03",
                  title: "Multidisciplinary Team",
                  desc: "A comprehensive team of specialists including physiotherapists, occupational therapists, and speech therapists.",
                  icon: "fa-solid fa-people-group",
                  color: PRIMARY_COLOR,
                  bg: PRIMARY_SECTION_BG,
                },
              ].map((card) => (
                <div
                  key={card.id}
                  className={`recovery-phase-card ${selectedCard === card.id ? "active" : ""}`}
                  style={{
                    borderRadius: "20px",
                    padding: "20px",
                    backgroundColor: selectedCard === card.id ? card.bg : "#ffffff",
                    border: `2px solid ${selectedCard === card.id ? card.color : "#f0f0f0"}`,
                    transition: "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                    cursor: "pointer",
                    position: "relative",
                    boxShadow: selectedCard === card.id ? `0 10px 30px ${card.color}20` : "0 4px 12px rgba(0,0,0,0.05)",
                  }}
                  onClick={() => setSelectedCard(card.id)}
                  onMouseEnter={(e) => {
                    if (selectedCard !== card.id) {
                      e.currentTarget.style.transform = "translateX(5px)";
                      e.currentTarget.style.borderColor = card.color;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedCard !== card.id) {
                      e.currentTarget.style.transform = "translateX(0)";
                      e.currentTarget.style.borderColor = "#f0f0f0";
                    }
                  }}
                >
                  <div className="!flex !items-center !gap-3">
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "12px",
                        backgroundColor: card.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontSize: "18px",
                        boxShadow: `0 4px 12px ${card.color}40`,
                      }}
                    >
                      <i className={card.icon}></i>
                    </div>
                    <div>
                      <span className="!block !text-[10px] !font-bold !text-[#321961] !uppercase !tracking-wider">
                        {card.phase}
                      </span>
                      <h5 className="!m-0 !text-[16px] !font-semibold !text-[#1a1a1a]">
                        {card.title}
                      </h5>
                    </div>
                  </div>
                  <div
                    style={{
                      maxHeight: selectedCard === card.id ? "100px" : "0",
                      opacity: selectedCard === card.id ? "1" : "0",
                      overflow: "hidden",
                      transition: "all 0.4s ease",
                      marginTop: selectedCard === card.id ? "12px" : "0",
                    }}
                  >
                    <p className="!m-0 !text-[13px] !text-[#666] !leading-relaxed">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column - Dynamic Image Showcase */}
            <div className="!col-span-7 !relative" style={{ minHeight: "450px" }}>
              <div className="!relative !w-full !h-full !rounded-[30px] !overflow-hidden !shadow-[0_20px_50px_rgba(0,0,0,0.15)]">
                <style>
                  {`
                    @keyframes slideUpRecovery {
                      from { transform: translateY(30px); opacity: 0; }
                      to { transform: translateY(0); opacity: 1; }
                    }
                    .phase-image-container {
                      position: absolute;
                      top: 0;
                      left: 0;
                      width: 100%;
                      height: 100%;
                      transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
                      opacity: 0;
                      transform: scale(1.1);
                      visibility: hidden;
                    }
                    .phase-image-container.active {
                      opacity: 1;
                      transform: scale(1);
                      visibility: visible;
                      z-index: 1;
                    }
                    .glass-caption-recovery {
                      position: absolute;
                      bottom: 30px;
                      left: 30px;
                      right: 30px;
                      background: rgba(0, 0, 0, 0.5);
                      backdrop-filter: blur(12px);
                      -webkit-backdrop-filter: blur(12px);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      border-radius: 20px;
                      padding: 25px;
                    }
                    .active .glass-caption-recovery {
                      animation: slideUpRecovery 0.6s ease-out 0.4s both;
                    }
                  `}
                </style>

                {[
                  {
                    id: "milestone",
                    img: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1000&fit=crop",
                    caption:
                      "Structured rehabilitation with measurable goals and regular assessments to track your recovery indicators precisely.",
                  },
                  {
                    id: "pmr",
                    img: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=1000&fit=crop",
                    caption:
                      "Expert PMR doctors providing medical supervision and personalized recovery plans tailored to your unique clinical needs.",
                  },
                  {
                    id: "team",
                    img: "https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1000&fit=crop",
                    caption:
                      "A collaborative force of specialists working in harmony to provide holistic rehabilitation and comprehensive care.",
                  },
                ].map((phase) => (
                  <div
                    key={phase.id}
                    className={`phase-image-container ${selectedCard === phase.id ? "active" : ""}`}
                  >
                    <img
                      src={phase.img}
                      alt={phase.id}
                      className="!w-full !h-full !object-cover"
                    />
                    <div className="glass-caption-recovery">
                      <div className="!flex !items-center !gap-3">
                        <div
                          style={{
                            width: "4px",
                            height: "40px",
                            backgroundColor: PRIMARY_COLOR,
                            borderRadius: "2px",
                          }}
                        ></div>
                        <p className="!m-0 !text-white !text-[14px] !leading-relaxed">
                          {phase.caption}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Families Choose Us */}
      <section
        style={{
          background: PRIMARY_SECTION_BG,
        }}
        className="!py-10 !px-4"
      >
        <div className="!max-w-7xl !mx-auto">
          <div className="!text-center !mb-8">
            <span
              style={{
                display: "inline-block",
                padding: "6px 20px",
                background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
                color: "#fff",
                borderRadius: "50px",
                fontSize: "12px",
                fontWeight: "600",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              Service Excellence
            </span>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginTop: "16px",
                marginBottom: "12px",
                lineHeight: "1.2",
              }}
            >
              Why Families Choose Us?
            </h2>
            <p className="!text-[#666] !text-[15px] !max-w-[600px] !mx-auto !font-normal">
              Professional, compassionate care tailored to your family's needs
            </p>
          </div>

          <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 !gap-4">
            {[
              {
                icon: "fas fa-users-cog",
                title: "Dedicated Care Team",
                desc: "Support 7 days a week to help you find the best caregiver",
              },
              {
                icon: "fas fa-user-clock",
                title: "Manage Replacements",
                desc: "Ensure right replacement during absence of key staff",
              },
              {
                icon: "fas fa-briefcase-medical",
                title: "Handle Emergency",
                desc: "Always get advice and care quickly when needed",
              },
              {
                icon: "fas fa-money-check-alt",
                title: "Manage Payrolls",
                desc: "Ensure attendance and payments are tracked on time",
              },
              {
                icon: "fas fa-headset",
                title: "Staying Connected",
                desc: "Compliment interested discretion estimating apartments",
              },
              {
                icon: "fas fa-balance-scale",
                title: "Handle Conflicts & Issues",
                desc: "Active support ensuring quality care delivery",
              },
            ].map((item, index) => {
              const primaryGradient = `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`;
              return (
                <div key={index} className="!w-full">
                  <div
                    className="!group !relative !p-5 !bg-white !rounded-[12px] !border !border-[#f0f0f0] !h-full !overflow-hidden !transition-all !duration-300 hover:!-translate-y-[4px] hover:!shadow-[0_12px_24px_rgba(0,0,0,0.1)] hover:!border-[#321961]"
                  >
                    {/* Diagonal accent line */}
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "4px",
                        height: "100%",
                        background: primaryGradient,
                      }}
                    />

                    <div className="!flex !items-start !gap-4">
                      {/* Icon */}
                      <div
                        style={{
                          width: "50px",
                          height: "50px",
                          background: primaryGradient,
                          borderRadius: "10px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: `0 4px 12px ${PRIMARY_COLOR}30`,
                        }}
                      >
                        <i
                          className={item.icon}
                          style={{
                            fontSize: "22px",
                            color: "#fff",
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="!flex-1 !min-w-0">
                        <h5 className="!m-0 !mb-[6px] !text-[16px] !font-semibold !text-[#1a1a1a] !leading-snug">
                          {item.title}
                        </h5>
                        <p className="!m-0 !text-[13px] !text-[#666] !leading-normal !font-normal">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="!py-10 !px-4" style={{ backgroundColor: PRIMARY_SECTION_BG }}>
        <div className="!max-w-4xl !mx-auto">
          <div className="!text-center !mb-8">
            <span style={{
              display: "inline-block",
              padding: "6px 20px",
              background: `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
              color: "#fff",
              borderRadius: "50px",
              fontSize: "12px",
              fontWeight: "600",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}>
              <i className="fas fa-bolt me-2"></i>Frequently Asked Questions
            </span>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginTop: "16px",
                marginBottom: "12px",
                lineHeight: "1.2",
              }}
            >
              Common Questions About Home Care
            </h2>
          </div>

          <div className="!flex !flex-col !gap-3">
            {[
              {
                question: "What services are included in home care?",
                answer:
                  "Our home care services include nursing care, doctor visits, physiotherapy, elderly care, postpartum care, lab tests at home, injection services, and health monitoring. We provide comprehensive healthcare solutions tailored to your needs.",
              },
              {
                question: "How do I book a home care service?",
                answer:
                  "You can book a service by calling our helpline, using our online booking system, or through our mobile app. Simply select the service you need, choose your preferred date and time, and provide your location details.",
              },
              {
                question: "Are the caregivers certified and verified?",
                answer:
                  "Yes, all our caregivers and medical professionals are certified, licensed, and undergo thorough background checks. We ensure they have the necessary qualifications and experience to provide quality care.",
              },
              {
                question: "What are the charges for home care services?",
                answer:
                  "Pricing varies based on the type of service, duration, and specific requirements. We offer competitive rates and transparent pricing. Contact us for a detailed quote tailored to your needs.",
              },
              {
                question: "Is home care available 24/7?",
                answer:
                  "Yes, we provide 24/7 availability for emergency services and scheduled care. Our team is always ready to assist you whenever you need medical care at home.",
              },
              {
                question: "Can I choose a specific caregiver?",
                answer:
                  "We try to accommodate preferences for specific caregivers when possible. However, availability depends on scheduling and location. We ensure all our caregivers meet our high standards of care.",
              },
            ].map((faq, index) => {
              const isOpen = openIndex === index;

              return (
                <div
                  key={index}
                  className="!bg-white !rounded-[12px] !border !border-solid !border-[#e5e7eb] !overflow-hidden !shadow-sm"
                >
                  <h2>
                    <button
                      type="button"
                      onClick={() => toggleFAQ(index)}
                      className="!w-full !flex !items-center !justify-between !px-5 !py-4 !text-left !text-[15px] !font-semibold !text-[#1a1a1a] !transition-all !duration-200"
                      style={{
                        backgroundColor: index % 2 === 0 ? "#ffffff" : PRIMARY_SECTION_BG,
                      }}
                    >
                      <span>{faq.question}</span>
                      <i className={`fas fa-chevron-${isOpen ? "up" : "down"} !text-[12px] !text-[#321961]`}></i>
                    </button>
                  </h2>

                  <div
                    className={`!transition-all !duration-300 ${isOpen ? "!block" : "!hidden"}`}
                  >
                    <div className="!px-5 !py-4 !text-[14px] !text-[#666] !leading-relaxed !bg-white !border-t !border-solid !border-[#f0f0f0]">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {
        showModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              backgroundColor: "rgba(0,0,0,0.88)",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: "999999999",
              backdropFilter: "blur(2px)",
            }}
            onClick={handleCloseModal}
          >
            <div
              className="modal-dialog modal-dialog-centered modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="modal-content shadow-lg"
                style={{
                  borderRadius: "12px",
                  overflow: "hidden",
                  border: "none",
                }}
              >
                <div className="modal-body p-0">
                  <div className="row g-0">
                    {selectedTreatment && (
                      <div className="col-md-5 d-none d-md-block">
                        <img
                          src={
                            imgUrl + selectedTreatment?.tabletdetails?.files[0]
                          }
                          alt={selectedTreatment?.tabletdetails?.name}
                          style={{
                            height: "100%",
                            width: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                    )}

                    <div
                      className={
                        selectedTreatment
                          ? "col-md-7 bg-white p-4"
                          : "col-md-12 bg-white p-4"
                      }
                    >
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 className="mb-0">Book Now</h5>
                        <button
                          type="button"
                          className="btn-close"
                          onClick={handleCloseModal}
                        ></button>
                      </div>

                      <form
                        className="d-flex flex-column"
                        onSubmit={handleSubmitBooking}
                      >
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              Date <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              name="date"
                              className="form-control"
                              required
                              value={bookingFormData.date}
                              onChange={handleInputChange}
                              min={new Date().toISOString().split("T")[0]}
                            />
                          </div>

                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              className="form-control"
                              placeholder="Enter full name"
                              required
                              value={bookingFormData.name}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>

                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              Mobile Number <span className="text-danger">*</span>
                            </label>
                            <input
                              type="tel"
                              name="mobile"
                              className="form-control"
                              placeholder="Enter mobile number"
                              pattern="[0-9]{10}"
                              required
                              value={bookingFormData.mobile}
                              onChange={handleInputChange}
                              maxLength="10"
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              Preferred Time{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="time"
                              name="time"
                              className="form-control"
                              required
                              value={bookingFormData.time}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="mb-3">
                          <label className="form-label">
                            Address <span className="text-danger">*</span>
                          </label>
                          <textarea
                            name="address"
                            className="form-control"
                            rows="3"
                            placeholder="Enter your address"
                            required
                            value={bookingFormData.address}
                            onChange={handleInputChange}
                          ></textarea>
                        </div>

                        <div className="d-flex justify-content-end">
                          <button
                            type="submit"
                            className="btn btn-primary rounded-pill"
                          >
                            Submit <i className="fas fa-check-circle"></i>
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {/* Lead Modal */}
      <LeadModal
        show={showLeadModal}
        fixedType="homecare"
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
      />

      {/* Rental Modal */}
      {
        rentProduct && (
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
            fixedType="homecare"
          />
        )
      }

      {/* Consultation Modal */}
      <ConsultationModal
        show={showConsultationModal}
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
        fixedType="homecare"
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
        productId={appointmentFormData.productId || null}
        vendorId={appointmentFormData.vendorId || null}
        variantId={appointmentFormData.variantId || null}
        fixedType="homecare"
      />
    </>
  );
};

export default HomeCareServices;
