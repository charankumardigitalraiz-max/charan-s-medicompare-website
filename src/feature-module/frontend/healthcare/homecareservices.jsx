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

  const PRIMARY_COLOR = "#8059ca";
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
        <section
          className="section pb-5"
          style={{ backgroundColor: PRIMARY_SECTION_BG, paddingTop: "0" }}
        >
          <div className="container-fluid">
            <div className="row align-items-center py-3">
              <div className="col-6 text-start">
                <h3 className="mb-2 top-vendor-badge">
                  <i className="fas fa-bolt"></i>
                  Top Services
                </h3>
              </div>

              <div className="col-6 text-end">
                <Link
                  to={`/${currentService}/all`}
                  className="top-vendor-badge"
                  style={{
                    fontWeight: "600"
                  }}
                >
                  View All
                  <i className="isax isax-arrow-right-1 ms-1"></i>
                </Link>
              </div>
            </div>

            <div
              className="meq-swiper-wrapper"
              style={{ position: "relative" }}
            >
              <button
                className="meq-arrow-btn homecare-prev"
                aria-label="Previous"
              >
                <i className="fas fa-chevron-left"></i>
              </button>
              <Swiper {...swiperSettings}>
                {medicalTreatments?.map((treatment, index) => {
                  const vendor = treatment?.vendordetails;
                  const med = treatment?.tabletdetails;
                  const bookingType = vendor?.bookingType || service?.categoryType || "cart";
                  return (
                    <SwiperSlide
                      key={index}
                      style={{ display: "flex", alignSelf: "stretch" }}
                    >
                      <div
                        className="card border-0"
                        style={{
                          borderRadius: "16px",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          overflow: "hidden",
                          display: "flex",
                          flexDirection: "column",
                          width: "100%",
                          height: "100%",
                        }}
                      >
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            const data = treatment?.tabletdetails;

                            const categorySlug =
                              data?.subcategorydetails?.catdetails?.slug;

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

                        <div
                          style={{
                            width: "100%",
                            height: "220px",
                            borderTopLeftRadius: "16px",
                            borderTopRightRadius: "16px",
                            overflow: "hidden",
                            backgroundColor: "#fff",
                          }}
                        >
                          <img
                            src={getImageUrl(
                              treatment?.tabletdetails?.files[0],
                            )}
                            alt={treatment?.tabletdetails?.name}
                            title={treatment?.tabletdetails?.name}
                            onClick={() => handleProductClick(treatment)}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              cursor: "pointer",
                            }}
                          />
                        </div>

                        <div
                          className="card-body"
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            padding: "8px 8px 0 8px",
                          }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <h3
                              className="titlee text-dark mb-0 mt-0"
                              style={{ marginTop: "0", textTransform: "capitalize" }}
                            >
                              {treatment?.tabletdetails.name?.length > 20
                                ? treatment?.tabletdetails.name.slice(0, 20) +
                                "..."
                                : treatment?.tabletdetails.name}
                            </h3>

                            <div
                              className="d-flex align-items-center justify-content-end"
                              style={{ minWidth: "80px", fontSize: "12px" }}
                            >
                              <i className="fa fa-star text-warning me-1"></i>
                              <span className="me-1">
                                {treatment?.tabletdetails?.averageRating?.toFixed(
                                  1,
                                ) > 0
                                  ? treatment?.tabletdetails.averageRating?.toFixed(
                                    1,
                                  )
                                  : 0}
                              </span>

                              <i
                                className="fa fa-users me-1"
                                style={{ color: PRIMARY_COLOR }}
                              ></i>
                              <span>
                                (
                                {treatment?.tabletdetails?.ratingCount > 0
                                  ? `${treatment?.tabletdetails.ratingCount}+`
                                  : 0}
                                )
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              // flexGrow: 1,
                              cursor: "pointer",
                              display: "flex",
                              flexDirection: "column",
                            }}
                            onClick={() => handleProductClick(treatment)}
                          >
                            <p
                              style={{
                                fontSize: "13px",
                                color: "#666",
                                lineHeight: "1.5",
                                display: "block",
                                marginBottom: "0",
                              }}
                              className="mb-1"
                            >
                              {formatDescription(
                                treatment?.tabletdetails?.description,
                                100,
                              )}
                            </p>

                            {treatment?.tabletdetails?.duration && (
                              <div className="report-timee d-flex align-items-center gap-2">
                                <i
                                  className="fa-regular fa-clock"
                                  style={{ color: PRIMARY_COLOR }}
                                ></i>
                                <span>Duration : </span>
                                <strong>
                                  {treatment?.tabletdetails?.duration}
                                </strong>
                              </div>
                            )}
                            {treatment?.tabletdetails?.shiftType && (
                              <div className="report-timee d-flex align-items-center gap-2">
                                <i
                                  className="fa-regular fa-calendar-days"
                                  style={{ color: PRIMARY_COLOR }}
                                ></i>
                                <span>Shift : </span>
                                <strong>
                                  {treatment?.tabletdetails?.shiftType}
                                </strong>
                              </div>
                            )}
                            {treatment?.tabletdetails?.nursecareType && (
                              <div className="report-timee d-flex align-items-center gap-2">
                                <i
                                  className="fas fa-house-user"
                                  style={{ color: PRIMARY_COLOR }}
                                ></i>
                                <span>Type : </span>
                                <strong>
                                  {treatment?.tabletdetails?.nursecareType}
                                </strong>
                              </div>
                            )}
                            {treatment?.tabletdetails?.homecareMode && (
                              <div className="report-timee d-flex align-items-center gap-2">
                                <i
                                  className="fa-solid fa-house"
                                  style={{ color: PRIMARY_COLOR }}
                                ></i>
                                <span>Mode : </span>
                                <strong>
                                  {treatment?.tabletdetails?.homecareMode}
                                </strong>
                              </div>
                            )}

                            <div
                              style={{
                                backgroundColor: PRIMARY_SECTION_BG,
                                padding: "10px",
                                borderRadius: "8px",
                                border: "1px solid rgba(128, 89, 202, 0.15)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: "11px",
                                    color: "#000",
                                    marginBottom: "4px",
                                    fontWeight: "500",
                                  }}
                                >
                                  Starting From
                                </div>
                                {treatment?.discountprice ? (
                                  <div>
                                    <span
                                      style={{
                                        fontWeight: "bold",
                                        marginRight: "8px",
                                        fontSize: "16px",
                                      }}
                                    >
                                      ₹{treatment.discountprice}
                                    </span>

                                    <span
                                      style={{
                                        textDecoration: "line-through",
                                        color: "#999",
                                        marginRight: "8px",
                                      }}
                                    >
                                      ₹{treatment.price}
                                    </span>

                                    <span
                                      style={{ color: "red", fontSize: "12px" }}
                                    >
                                      {Math.round(
                                        ((treatment.price -
                                          treatment.discountprice) /
                                          treatment.price) *
                                        100,
                                      )}
                                      % OFF
                                    </span>
                                  </div>
                                ) : (
                                  <span>₹{treatment?.price || 0}</span>
                                )}
                              </div>
                            </div>
                          </div>
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
                            calculatedDiscountPrice={
                              treatment?.discountprice ||
                              treatment?.discountPrice ||
                              null
                            }
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
                            containerStyle={{ width: "100%" }}
                            buttonStyle={{
                              width: "100%",
                              padding: "8px 8px",
                              borderRadius: "8px",
                              fontSize: "12px",
                              fontWeight: "600",
                            }}
                          />
                          {vendor && (
                            <div
                              style={{
                                marginTop: "4px",
                                borderTop: "1px solid #e0e0e0",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                className="d-flex align-items-center gap-2 footers"
                                style={{
                                  padding: "0px 0 0 0",
                                  justifyContent: "center",
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const vendorId =
                                    vendor?.slug ||
                                    vendor?.vendorId ||
                                    vendor?._id ||
                                    vendor?.bussinessdetails?.slug ||
                                    vendor?.bussinessdetails?.vendorId ||
                                    vendor?.bussinessdetails?._id;
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
                                    navigate(`/vendor-profile/${vendorSlug}`);
                                  } else {
                                    toast.error(
                                      "Vendor information not available",
                                    );
                                  }
                                }}
                              >
                                <div
                                  style={{
                                    width: "48px",
                                    height: "48px",
                                    borderRadius: "6px",
                                    overflow: "hidden",
                                    background: "#fff",
                                    flexShrink: 0,
                                  }}
                                >
                                  <img
                                    src={
                                      getImageUrl(
                                        vendor?.bussiness_image?.[0]?.url,
                                      ) || ""
                                    }
                                    alt={vendor.name}
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
                                  <h6
                                    className="mb-0 text-dark"
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "600",
                                      whiteSpace: "nowrap",
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                    }}
                                  >
                                    {vendor.name}
                                  </h6>


                                  {(() => {
                                    const rating = Number(treatment?.averageRating);
                                    const count = Number(treatment?.ratingCount);
                                    if (!rating || !count || rating === 0 || count === 0) return null;

                                    return (
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
                                        <i className="fas fa-star" style={{ color: "#ffc107", fontSize: "9px" }}></i>
                                        <span style={{ fontWeight: "500" }}>{rating.toFixed(1)}</span>
                                        <span style={{ color: "#999" }}>({count}+)</span>
                                      </div>
                                    );
                                  })()}


                                  {/* {treatment?.averageRating && treatment?.ratingCount && (
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
                                        {treatment?.averageRating.toFixed(1)}
                                      </span>
                                      <span style={{ color: "#999" }}>
                                        ({treatment?.ratingCount}+)
                                      </span>
                                    </div>
                                  )} */}



                                  <div
                                    className="d-flex align-items-center gap-1 text-dark"
                                    style={{ marginTop: "2px" }}
                                  >
                                    <i
                                      className="fa-solid fa-location-dot"
                                      style={{
                                        fontSize: "11px",
                                        color: "#8059ca",
                                        flexShrink: 0,
                                      }}
                                    ></i>
                                    <span
                                      style={{
                                        fontSize: "11px",
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                      }}
                                    >
                                      {vendor.address?.length > 22
                                        ? vendor.address.slice(0, 22) + "..."
                                        : vendor.address ||
                                        "Address not available"}
                                    </span>
                                  </div>
                                  {treatment?.distanceInKm && (
                                    <div
                                      className="d-flex align-items-center gap-1 text-muted"
                                      style={{ marginTop: "2px" }}
                                    >
                                      <i
                                        className="isax isax-route-square"
                                        style={{
                                          fontSize: "11px",
                                          color: "#8059ca",
                                        }}
                                      ></i>

                                      <span style={{ fontSize: "11px" }}>
                                        {parseFloat(
                                          treatment.distanceInKm,
                                        ).toFixed(1)}{" "}
                                        km away
                                      </span>
                                    </div>
                                  )}
                                </div>
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
        </section >
      )}

      {/* How It Works Section */}
      <section
        className="how-it-work-fourteen py-5"
        style={{
          backgroundColor: "#E8E4F5",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <style>{`
          .hc-mobile-steps {
            display: none;
          }

          @media (max-width: 991.98px) {
            .how-it-work-fourteen .work-flow-chart {
              display: none !important;
            }

            .hc-mobile-steps {
              display: flex;
              flex-direction: column;
              gap: 0;
              margin-top: 8px;
              padding: 0 4px;
            }

            .how-it-work-fourteen .section-work-head {
              text-align: center;
            }
          }

          .hc-mobile-step {
            display: flex;
            align-items: flex-start;
            gap: 14px;
            position: relative;
            padding-bottom: 18px;
          }

          .hc-mobile-step:not(:last-child)::after {
            content: "";
            position: absolute;
            left: 23px;
            top: 50px;
            bottom: 2px;
            width: 2px;
            background: linear-gradient(180deg, #8059ca 0%, #d8c9f5 100%);
          }

          .hc-mobile-step__badge {
            width: 48px;
            height: 48px;
            border-radius: 14px;
            background: #fff;
            border: 2px solid #8059ca;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            box-shadow: 0 4px 12px rgba(128, 89, 202, 0.14);
            z-index: 1;
          }

          .hc-mobile-step__badge img {
            width: 24px;
            height: 24px;
          }

          .hc-mobile-step__content {
            flex: 1;
            background: #fff;
            border-radius: 14px;
            padding: 14px 16px;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
            border: 1px solid rgba(128, 89, 202, 0.12);
          }

          .hc-mobile-step__content.hc-highlight {
            background: #fff8e6;
            border-color: #f0d56b;
          }

          .hc-mobile-step__count {
            font-size: 11px;
            font-weight: 700;
            color: #8059ca;
            letter-spacing: 0.4px;
          }

          .hc-mobile-step__title {
            font-size: 15px;
            font-weight: 600;
            color: #1a1a1a;
            margin: 4px 0 0;
          }
        `}</style>

        <div className="container">
          <div className="row align-items-center">
            <div className="col-xl-5 col-lg-4">
              <div
                className="section-work-head aos-init aos-animate"
                data-aos="fade-up"
                data-aos-delay={400}
              >
                <span>Simple booking process</span>
                <h2>
                  How it <span>Works &amp; Booking</span>
                </h2>
                <p className="text-muted mt-3">
                  Book professional home care services in just a few simple
                  steps. Our streamlined process ensures you get the care you
                  need quickly and efficiently.
                </p>
              </div>
            </div>
            <div className="col-xl-7 col-lg-8">
              <ul className="work-flow-chart">
                <li
                  data-aos="fade-up"
                  data-aos-delay={500}
                  className="aos-init aos-animate"
                >
                  <img src="assets/img/bg/chart-arrow-3.png" alt="Img" />
                  <div className="flow-chart-list">
                    <span className="chart-icon">
                      <img
                        src="assets/img/icons/flow-chart-icon-01.svg"
                        alt="Img"
                      />
                    </span>
                    <h6 style={{ fontSize: "11px" }}>Select Service</h6>
                    <span className="chart-count">01</span>
                  </div>
                </li>
                <li
                  data-aos="fade-up"
                  data-aos-delay={600}
                  className="aos-init aos-animate"
                >
                  <img src="assets/img/bg/chart-arrow-01.png" alt="Img" />
                  <div className="flow-chart-list bg-yelllow">
                    <span className="chart-icon">
                      <img
                        src="assets/img/icons/flow-chart-icon-02.svg"
                        alt="Img"
                      />
                    </span>
                    <h6 style={{ fontSize: "11px" }}>Book Appointment</h6>
                    <span className="chart-count">02</span>
                  </div>
                </li>
                <li
                  data-aos="fade-up"
                  data-aos-delay={700}
                  className="aos-init aos-animate"
                >
                  <img src="assets/img/bg/chart-arrow-3.png" alt="Img" />
                  <div className="flow-chart-list">
                    <span className="chart-icon">
                      <img
                        src="assets/img/icons/flow-chart-icon-03.svg"
                        alt="Img"
                      />
                    </span>
                    <h6 style={{ fontSize: "11px" }}>Caregiver Arrives</h6>
                    <span className="chart-count">03</span>
                  </div>
                </li>
                <li
                  data-aos="fade-up"
                  data-aos-delay={800}
                  className="aos-init aos-animate"
                >
                  <img src="assets/img/bg/chart-arrow-02.png" alt="Img" />
                  <div className="flow-chart-list bg-yelllow">
                    <span className="chart-icon">
                      <img
                        src="assets/img/icons/flow-chart-icon-04.svg"
                        alt="Img"
                      />
                    </span>
                    <h6 style={{ fontSize: "11px" }}>Receive Care</h6>
                    <span className="chart-count">04</span>
                  </div>
                </li>
              </ul>

              <div className="hc-mobile-steps">
                {MOBILE_BOOKING_STEPS.map((item) => (
                  <div key={item.step} className="hc-mobile-step">
                    <div className="hc-mobile-step__badge">
                      <img src={item.icon} alt="" />
                    </div>
                    <div
                      className={`hc-mobile-step__content${item.highlight ? " hc-highlight" : ""}`}
                    >
                      <span className="hc-mobile-step__count">
                        Step {item.step}
                      </span>
                      <h6 className="hc-mobile-step__title">{item.title}</h6>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {
        middleBanners?.length > 0 && (
          <section
            className="section welcome-section px-3 mt-3 offers-section"
            style={{ backgroundColor: PRIMARY_SECTION_BG }}
          >
            <div className="container-fluid">
              <div className="text-center mb-3">
                <h2
                  className="mb-3"
                  style={{
                    fontSize: "28px",
                    fontWeight: "600",
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
        )
      }

      <section
        className="section py-5 d-none d-md-block"
        style={{ backgroundColor: PRIMARY_SECTION_BG, overflow: "hidden" }}
      >
        <div className="container">
          {/* Header */}
          <div className="row mb-5" data-aos="fade-up">
            <div className="col-12 text-center">
              <h2
                className="mb-2"
                style={{
                  fontSize: "42px",
                  fontWeight: "600",
                  background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  letterSpacing: "-1px",
                }}
              >
                How do we Deliver Fastest Recovery?
              </h2>
              <p
                className="text-muted mx-auto"
                style={{ maxWidth: "600px", fontSize: "16px" }}
              >
                Our scientifically-backed methodology focuses on personalized
                milestones and holistic care for rapid rehabilitation.
              </p>
            </div>
          </div>

          <div className="row align-items-stretch g-4">
            {/* Left Column - Interaction Phases */}
            <div className="col-lg-5 col-md-6" data-aos="fade-right">
              <div className="d-flex flex-column gap-3 h-100 justify-content-center">
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
                ].map((card, index) => (
                  <div
                    key={card.id}
                    className={`recovery-phase-card ${selectedCard === card.id ? "active" : ""}`}
                    style={{
                      borderRadius: "20px",
                      padding: "24px",
                      backgroundColor:
                        selectedCard === card.id ? card.bg : "#ffffff",
                      border: `2px solid ${selectedCard === card.id ? card.color : "#f0f0f0"}`,
                      transition:
                        "all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                      cursor: "pointer",
                      position: "relative",
                      boxShadow:
                        selectedCard === card.id
                          ? `0 10px 30px ${card.color}20`
                          : "0 4px 12px rgba(0,0,0,0.05)",
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
                    <div className="d-flex align-items-center gap-3 mb-1">
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "12px",
                          backgroundColor: card.color,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: "20px",
                          boxShadow: `0 4px 12px ${card.color}40`,
                        }}
                      >
                        <i className={card.icon}></i>
                      </div>
                      <div>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: "700",
                            textTransform: "uppercase",
                            color: card.color,
                            letterSpacing: "1px",
                          }}
                        >
                          {card.phase}
                        </span>
                        <h5
                          className="mb-0"
                          style={{
                            fontWeight: "600",
                            color: "#1a1a1a",
                            fontSize: "18px",
                          }}
                        >
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
                      <p
                        className="mb-0 text-muted"
                        style={{ fontSize: "14px", lineHeight: "1.6" }}
                      >
                        {card.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column - Dynamic Image Showcase */}
            <div className="col-lg-7 col-md-6 mt-4 mt-lg-0" data-aos="zoom-in">
              <div
                style={{
                  position: "relative",
                  height: "100%",
                  minHeight: "450px",
                  borderRadius: "30px",
                  overflow: "hidden",
                  boxShadow: "0 20px 50px rgba(0,0,0,0.15)",
                }}
              >
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
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                    <div className="glass-caption-recovery">
                      <div className="d-flex align-items-center gap-3">
                        <div
                          style={{
                            width: "4px",
                            height: "40px",
                            backgroundColor: PRIMARY_COLOR,
                            borderRadius: "2px",
                          }}
                        ></div>
                        <p
                          className="mb-0 text-white"
                          style={{
                            fontSize: "15px",
                            fontWeight: "400",
                            lineHeight: "1.6",
                          }}
                        >
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

      <section
        style={{
          background: PRIMARY_SECTION_BG,
          padding: "40px 0",
          position: "relative",
        }}
        className="container-fluid px-md-5"
      >
        <div className="container">
          <div className="text-center mb-5">
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
            <p
              style={{
                fontSize: "16px",
                color: "#666",
                maxWidth: "600px",
                margin: "0 auto",
                fontWeight: "400",
              }}
            >
              Professional, compassionate care tailored to your family's needs
            </p>
          </div>

          <div className="row g-3">
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
                <div key={index} className="col-lg-4 col-md-6">
                  <div
                    style={{
                      position: "relative",
                      padding: "20px",
                      background: "#fff",
                      borderRadius: "12px",
                      border: "1px solid #f0f0f0",

                      marginTop: "8px",
                      height: "100%",
                      overflow: "hidden",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow =
                        "0 12px 24px rgba(0,0,0,0.1)";
                      e.currentTarget.style.borderColor = PRIMARY_COLOR;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                      e.currentTarget.style.borderColor = "#f0f0f0";
                    }}
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

                    <div
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "16px",
                      }}
                    >
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
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <h5
                          style={{
                            fontSize: "16px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                            marginBottom: "6px",
                            lineHeight: "1.3",
                          }}
                        >
                          {item.title}
                        </h5>
                        <p
                          style={{
                            fontSize: "13px",
                            color: "#666",
                            lineHeight: "1.5",
                            marginBottom: "0",
                            fontWeight: "400",
                          }}
                        >
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            onClick={() => {
              if (medicalTreatments && medicalTreatments.length > 0) {
                handleBookNow(medicalTreatments[0]);
              }
            }}
            className="contact-circle d-none"
            style={{ cursor: "pointer" }}
          >
            Contact
            <br />
            Us
          </div>
        </div>
      </section>

      <section className="section py-3" style={{ backgroundColor: PRIMARY_SECTION_BG }}>
        <div className="container">
          <div className="row">
            <div className="col-12 text-center mb-3">
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
                <i className="fas fa-bolt"></i>
                Frequently Asked Questions
              </span>
              <h2 style={{
                fontSize: "36px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginTop: "16px",
                marginBottom: "12px",
                lineHeight: "1.2",
              }}>
                Common Questions About Home Care
              </h2>
            </div>
          </div>

          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="accordion" id="homeCareFAQ">
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
                      className="accordion-item border-0 mb-3 shadow-sm"
                      style={{ borderRadius: "12px" }}
                    >
                      <h2 className="accordion-header">
                        <button
                          type="button"
                          onClick={() => toggleFAQ(index)}
                          className={`accordion-button ${!isOpen ? "collapsed" : ""
                            }`}
                          style={{
                            borderRadius: "12px",
                            fontWeight: "600",
                            backgroundColor:
                              index % 2 === 0 ? "#ffffff" : PRIMARY_SECTION_BG,
                          }}
                        >
                          {faq.question}
                        </button>
                      </h2>

                      <div
                        className={`accordion-collapse collapse ${isOpen ? "show" : ""
                          }`}
                      >
                        <div
                          className="accordion-body"
                          style={{ lineHeight: "1.8" }}
                        >
                          {faq.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
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
