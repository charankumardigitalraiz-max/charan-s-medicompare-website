import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import { CartQuantityControls, VendorActions } from "../../../components/ui";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import LeadModal from "../pharmacy/products-components/LeadModal.jsx";
import RentModal from "../pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../pharmacy/products-components/AppointmentModal.jsx";
import { useCart, useResponsive } from "../../../hooks";
import { useProfile } from "../../../context/ProfileContext";
import Slider from "react-slick";
import {
  getHealthcareTwoSlideOfferSettings,
  healthcareSlickAutoplay,
  HealthcareNextArrow,
  HealthcarePrevArrow,
} from "./healthcareSliderSettings.jsx";
import SEOHelmet from "../../../components/SEOHelmet";
const NursingCare = ({
  imgUrl,
  handleBook,
  medicalTreatments,
  nursingOfferProducts,
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

  const {
    isXs: extraSmallScreen,
    isTabletOrBelow: isSmallLaptop,
    isMobile: isMobileLocal,
    isTablet,
  } = useResponsive();

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
      servicefixedTypes: servicePassed || med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "nursingcare",
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
      servicefixedTypes: servicePassed || med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "nursingcare",
    });
  };

  const sliderSettings = getHealthcareTwoSlideOfferSettings();

  const medicalSliderSettings = {
    dots: false,
    infinite: true,
    slidesToShow: 4,
    slidesToScroll: 1,
    nextArrow: <HealthcareNextArrow />,
    prevArrow: <HealthcarePrevArrow />,
    ...healthcareSlickAutoplay,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
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

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }

    toast.success("Appointment booked successfully!");
    setShowAppointmentModal(false);
    setAppointmentFormData({
      date: "",
      name: "",
      phone: "",
      category: "",
      address: "",
    });
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

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [bookingFormData, setBookingFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    date: "",
    time: "",
  });

  const handleBookNow = (treatment) => {
    const isLoggedIn = !!localStorage.getItem("medicomparestoken");
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }
    setSelectedTreatment(treatment);
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedTreatment(null);
    setBookingFormData({
      name: "",
      mobile: "",
      email: "",
      address: "",
      date: "",
      time: "",
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitBooking = (e) => {
    e.preventDefault();
    if (handleBook) {
      handleBook();
    }
    handleCloseModal();
  };

  const handleProductClick = (treatment) => {
    const data = treatment?.tabletdetails;

    const categorySlug = data?.subcategorydetails?.catdetails?.slug;

    const subcategorySlug = data?.subcategorydetails?.slug;

    const productSlug = data?.slug;

    if (!categorySlug || !subcategorySlug || !productSlug) return;

    navigate(`/${categorySlug}/${subcategorySlug}/${productSlug}`);
  };

  const PRIMARY_COLOR = "#8059ca";
  const PRIMARY_SECTION_BG = "#f8f4ff";
  const PRIMARY_DARK = "#6d48b8";

  return (
    <>
      <SEOHelmet page="clinics" />
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
                  {isMobileLocal ? "" : "View All"}
                  <i className={isMobileLocal ? "fas fa-arrow-right" : "fas fa-arrow-right ms-1"}></i>
                </Link>
              </div>
            </div>

            <div className="px-2">
              <Slider {...medicalSliderSettings}>
                {medicalTreatments?.map((treatment, index) => {
                  const vendor = treatment?.vendordetails;
                  return (
                    <div key={index} className="px-2">
                      <div
                        className="card border-0 h-100"
                        style={{
                          borderRadius: "16px",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                          transition: "transform 0.3s, box-shadow 0.3s",
                          overflow: "hidden",
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
                          className="card-body p-3"
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div className="d-flex justify-content-between align-items-center">
                            <h3 className="titlee text-dark mb-0 text-capitalize">
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
                            style={{ flexGrow: 1, cursor: "pointer" }}
                            onClick={() => handleProductClick(treatment)}
                          >
                            <p
                              className="tablet-desc"
                              dangerouslySetInnerHTML={{
                                __html:
                                  treatment?.tabletdetails?.description
                                    ?.length > 100
                                    ? treatment?.tabletdetails?.description?.slice(
                                      0,
                                      100,
                                    ) + "..."
                                    : treatment?.tabletdetails?.description,
                              }}
                            ></p>

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
                                  {treatment?.tabletdetails?.shiftType?.replace(
                                    /_/g,
                                    " ",
                                  )}
                                </strong>
                              </div>
                            )}
                            {treatment?.tabletdetails?.nursecareType && (
                              <div className="report-timee d-flex align-items-center gap-2">
                                <i
                                  className="fa-solid fa-tag"
                                  style={{ color: PRIMARY_COLOR }}
                                ></i>
                                <span>Type : </span>
                                <strong>
                                  {treatment?.tabletdetails?.nursecareType?.replace(
                                    /_/g,
                                    " ",
                                  )}
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
                              treatment?.vendordetails?.bookingType ||
                              service?.categoryType ||
                              "cart"
                            }
                            med={treatment?.tabletdetails || treatment}
                            vendor={treatment?.vendordetails || {}}
                            price={parseFloat(treatment?.price) || 0}
                            calculatedDiscountPrice={parseFloat(treatment?.discountprice || treatment?.discountPrice) || null}
                            // stock={treatment?.stock || (treatment?.tabletdetails || treatment).stock || (treatment?.vendordetails || {}).stock || 999}
                            service={treatment?.tabletdetails?.subcategorydetails?.catdetails?.fixedType || "nursingcare"}
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
                          {vendor && (
                            <div
                              style={{
                                marginTop: "12px",
                                borderTop: "1px solid #0000002e",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                className="d-flex align-items-center gap-3 footers"
                                style={{ padding: "10px 0 0 0" }}
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
                                    width: "56px",
                                    height: "56px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    background: "#fff",
                                  }}
                                >
                                  <img
                                    src={getImageUrl(
                                      vendor?.bussiness_image[0]?.url,
                                    )}
                                    alt={vendor.name}
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "contain",
                                    }}
                                  />
                                </div>

                                <div className="flex-grow-1">
                                  <h6
                                    className="mb-1"
                                    style={{
                                      fontSize: "12px",
                                      fontWeight: "600 !important"
                                    }}
                                  >
                                    {vendor.name}
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
                                  )}
                                  <div className="d-flex align-items-center gap-2 text-dark">
                                    <i
                                      className="fa-solid fa-location-dot"
                                      style={{
                                        fontSize: "13px",
                                        color: "#8059ca",
                                      }}
                                    ></i>
                                    <span>
                                      {vendor.address.length > 22
                                        ? vendor.address.slice(0, 22) + "..."
                                        : vendor.address}
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
                    </div>
                  );
                })}
              </Slider>
            </div>
          </div>
        </section>
      )}

      {middleBanners?.length > 0 && (
        <section
          className="section welcome-section px-3 mt-3 "
          style={{ backgroundColor: PRIMARY_SECTION_BG, minHeight: "280px" }}
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
              <Slider {...sliderSettings}>
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

      {/* How It Works Section */}
      <section
        className="section py-3"
        style={{
          backgroundColor: "#E8E4F5",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container">
          <div className="row mb-3">
            <div className="col-12 text-center">
              <h2
                className="mb-3"
                style={{
                  fontSize: "36px",
                  fontWeight: "600",
                  background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                How It Works
              </h2>
              <p
                className="mb-0"
                style={{
                  fontSize: "16px",
                  color: "#666",
                  maxWidth: "700px",
                  margin: "0 auto",
                }}
              >
                Get guidance and assistance for your nursing care requirements.
                Explore the section to know more.
              </p>
            </div>
          </div>

          <div
            className="row align-items-center justify-content-between"
            style={{ padding: "30px 0" }}
          >
            {/* Step 1 */}
            <div className="col-lg-2 col-md-3 col-sm-6 mb-4 mb-lg-0">
              <div className="text-center position-relative">
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    borderRadius: "50%",
                    backgroundColor: PRIMARY_COLOR,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)",
                    border: "4px solid rgba(128, 89, 202, 0.2)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-6px) scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(128, 89, 202, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(128, 89, 202, 0.3)";
                  }}
                >
                  <i
                    className="fa fa-calendar-check"
                    style={{
                      fontSize: "40px",
                      color: "#ffffff",
                    }}
                  ></i>
                  <div
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_DARK,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "2.5px solid #ffffff",
                      boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)",
                    }}
                  >
                    1
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: PRIMARY_COLOR,
                    marginBottom: "8px",
                  }}
                >
                  Book Nursing Care Service
                </h5>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: 0,
                    lineHeight: "1.6",
                  }}
                >
                  Fill up the booking form to place your request
                </p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div
              className="col-lg-1 d-none d-lg-flex justify-content-center align-items-center"
              style={{ position: "relative", height: "100px" }}
            >
              <i
                className="fa fa-arrow-right"
                style={{
                  fontSize: "28px",
                  color: PRIMARY_COLOR,
                  opacity: 0.3,
                }}
              ></i>
            </div>

            {/* Step 2 */}
            <div className="col-lg-2 col-md-3 col-sm-6 mb-4 mb-lg-0">
              <div className="text-center position-relative">
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    borderRadius: "50%",
                    backgroundColor: PRIMARY_COLOR,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)",
                    border: "4px solid rgba(128, 89, 202, 0.2)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-6px) scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(128, 89, 202, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(128, 89, 202, 0.3)";
                  }}
                >
                  <i
                    className="fa fa-phone-alt"
                    style={{
                      fontSize: "40px",
                      color: "#ffffff",
                    }}
                  ></i>
                  <div
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_DARK,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "2.5px solid #ffffff",
                      boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)",
                    }}
                  >
                    2
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: PRIMARY_COLOR,
                    marginBottom: "8px",
                  }}
                >
                  MediCompares Nursing Expert
                </h5>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: 0,
                    lineHeight: "1.6",
                  }}
                >
                  You will receive a confirmation call
                </p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div
              className="col-lg-1 d-none d-lg-flex justify-content-center align-items-center"
              style={{ position: "relative", height: "100px" }}
            >
              <i
                className="fa fa-arrow-right"
                style={{
                  fontSize: "28px",
                  color: PRIMARY_COLOR,
                  opacity: 0.3,
                }}
              ></i>
            </div>

            {/* Step 3 */}
            <div className="col-lg-2 col-md-3 col-sm-6 mb-4 mb-lg-0">
              <div className="text-center position-relative">
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    borderRadius: "50%",
                    backgroundColor: PRIMARY_COLOR,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)",
                    border: "4px solid rgba(128, 89, 202, 0.2)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-6px) scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(128, 89, 202, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(128, 89, 202, 0.3)";
                  }}
                >
                  <i
                    className="fa fa-heartbeat"
                    style={{
                      fontSize: "40px",
                      color: "#ffffff",
                    }}
                  ></i>
                  <div
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_DARK,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "2.5px solid #ffffff",
                      boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)",
                    }}
                  >
                    3
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: PRIMARY_COLOR,
                    marginBottom: "8px",
                  }}
                >
                  Nursing Professional Arrives
                </h5>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: 0,
                    lineHeight: "1.6",
                  }}
                >
                  Receive professional nursing care at your home
                </p>
              </div>
            </div>

            {/* Arrow 3 */}
            <div
              className="col-lg-1 d-none d-lg-flex justify-content-center align-items-center"
              style={{ position: "relative", height: "100px" }}
            >
              <i
                className="fa fa-arrow-right"
                style={{
                  fontSize: "28px",
                  color: PRIMARY_COLOR,
                  opacity: 0.3,
                }}
              ></i>
            </div>

            {/* Step 4 */}
            <div className="col-lg-2 col-md-3 col-sm-6">
              <div className="text-center position-relative">
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    borderRadius: "50%",
                    backgroundColor: PRIMARY_COLOR,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    position: "relative",
                    boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)",
                    border: "4px solid rgba(128, 89, 202, 0.2)",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform =
                      "translateY(-6px) scale(1.05)";
                    e.currentTarget.style.boxShadow =
                      "0 10px 30px rgba(128, 89, 202, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0) scale(1)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(128, 89, 202, 0.3)";
                  }}
                >
                  <i
                    className="fa fa-star"
                    style={{
                      fontSize: "40px",
                      color: "#ffffff",
                    }}
                  ></i>
                  <div
                    style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_DARK,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#ffffff",
                      fontSize: "14px",
                      fontWeight: "700",
                      border: "2.5px solid #ffffff",
                      boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)",
                    }}
                  >
                    4
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "16px",
                    fontWeight: "700",
                    color: PRIMARY_COLOR,
                    marginBottom: "8px",
                  }}
                >
                  Quality Care Delivered
                </h5>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#666",
                    marginBottom: 0,
                    lineHeight: "1.6",
                  }}
                >
                  Share your feedback with MediCompares
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Other Healthcare Services Section */}
      {nursingOfferProducts && nursingOfferProducts.length > 0 && (
        <section
          className="section py-5"
          style={{ backgroundColor: PRIMARY_SECTION_BG }}
        >
          <div className="container">
            <div className="row mb-5">
              <div className="col-12 text-center">
                <h2
                  className="mb-2"
                  style={{ fontSize: "32px", fontWeight: "600", color: "#1a1a1a" }}
                >
                  Other Services We Offer
                </h2>
                <p
                  className="mt-2"
                  style={{
                    fontSize: "16px",
                    color: "#666",
                    maxWidth: "800px",
                    margin: "0 auto",
                  }}
                >
                  Choose from our wide variety of services. Get Assurance for
                  quality round the clock care.
                </p>
              </div>
            </div>

            <div className="row g-4">
              {nursingOfferProducts?.slice(0, 8).map((ele, ind) => {
                return (
                  <div className="col-lg-3 col-md-4 col-sm-6" key={ind}>
                    <div
                      className="card border-0"
                      style={{
                        height: "220px",
                        borderRadius: "16px",
                        overflow: "hidden",
                        position: "relative",
                        boxShadow: "0 4px 20px rgba(128, 89, 202, 0.06)",
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: "pointer",
                        border: "1px solid rgba(128, 89, 202, 0.08)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "translateY(-6px)";
                        e.currentTarget.style.boxShadow =
                          "0 12px 30px rgba(128, 89, 202, 0.25)";
                        e.currentTarget.style.borderColor = PRIMARY_COLOR;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow =
                          "0 4px 20px rgba(128, 89, 202, 0.06)";
                        e.currentTarget.style.borderColor = "rgba(128, 89, 202, 0.08)";
                      }}
                      onClick={() => handleProductClick(ele)}
                    >
                      {/* Full Background Image */}
                      <img
                        src={
                          getImageUrl(ele?.tabletdetails?.files?.[0]) ||
                          "/assets/default.png"
                        }
                        alt={ele?.tabletdetails?.name}
                        title={ele?.tabletdetails?.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          position: "absolute",
                          top: 0,
                          left: 0,
                        }}
                      />

                      {/* Gradient Overlay for Text Readability */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          width: "100%",
                          height: "60%",
                          background: "linear-gradient(to top, rgba(0, 0, 0, 0.85) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%)",
                          zIndex: 1,
                        }}
                      />

                      {/* Title Text Overlaid */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          width: "100%",
                          padding: "16px",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "flex-end",
                          justifyContent: "center",
                          textAlign: "center",
                        }}
                      >
                        <h5
                          style={{
                            fontSize: "15px",
                            fontWeight: "600",
                            color: "#ffffff",
                            marginBottom: 0,
                            textTransform: "capitalize",
                            lineHeight: "1.4",
                            textShadow: "0 2px 4px rgba(0,0,0,0.6)",
                          }}
                        >
                          {ele.tabletdetails?.name
                            ? ele.tabletdetails.name.length > 30
                              ? ele.tabletdetails.name.substring(0, 30) + "..."
                              : ele.tabletdetails.name
                            : ""}
                        </h5>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Feedback/Testimonials Section */}
      <section
        className="section py-4"
        style={{
          backgroundColor: "#E8E4F5",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container">
          <div className="row mb-5">
            <div className="col-12 text-center">
              <h2
                className="mb-3"
                style={{
                  fontSize: "36px",
                  fontWeight: "700",
                  background: `linear-gradient(90deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`,
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                What Our Customers Say
              </h2>
              <p
                className="mb-0"
                style={{
                  fontSize: "16px",
                  color: "#666",
                  maxWidth: "700px",
                  margin: "0 auto",
                }}
              >
                Read testimonials from families who have experienced our
                professional nursing care services
              </p>
            </div>
          </div>

          <div className="row g-4 justify-content-center">
            {[
              {
                initials: "RK",
                name: "Rajesh Kumar",
                role: "Elder Care Patient",
                stars: 5,
                feedback: "The nursing care service was exceptional! The nurse was professional, caring, and very attentive to my mother's needs. Highly recommended for anyone looking for quality home care."
              },
              {
                initials: "PM",
                name: "Priya Mehta",
                role: "ICU Care Patient",
                stars: 5,
                feedback: "MediCompares provided excellent ICU care for my father. The nurses were highly skilled, compassionate, and available 24/7. The service exceeded our expectations in every way."
              },
              {
                initials: "AS",
                name: "Anjali Sharma",
                role: "Patient Care Service",
                stars: 5,
                feedback: "Outstanding patient care service! The nursing staff was professional, punctual, and very caring. They made the recovery process smooth and comfortable. Thank you MediCompares!"
              }
            ].map((testimonial, index) => (
              <div key={index} className="col-lg-4 col-md-6 col-sm-12">
                <div
                  className="card border-0 h-100"
                  style={{
                    borderRadius: "12px",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 6px 16px rgba(128, 89, 202, 0.06)",
                    padding: "20px 24px",
                    transition: "all 0.3s ease",
                    position: "relative",
                    overflow: "hidden",
                    border: "1px solid rgba(128, 89, 202, 0.1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-6px)";
                    e.currentTarget.style.boxShadow =
                      "0 12px 24px rgba(128, 89, 202, 0.12)";
                    e.currentTarget.style.borderColor = PRIMARY_COLOR;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow =
                      "0 6px 16px rgba(128, 89, 202, 0.06)";
                    e.currentTarget.style.borderColor = "rgba(128, 89, 202, 0.1)";
                  }}
                >
                  {/* Quote Icon */}
                  <div
                    style={{
                      position: "absolute",
                      top: "16px",
                      right: "16px",
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_SECTION_BG,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: 0.7,
                    }}
                  >
                    <i
                      className="fa fa-quote-right"
                      style={{ fontSize: "16px", color: PRIMARY_COLOR }}
                    ></i>
                  </div>

                  {/* Rating Stars */}
                  <div style={{ marginBottom: "12px" }}>
                    {Array.from({ length: testimonial.stars }).map((_, starIdx) => (
                      <i
                        key={starIdx}
                        className="fa fa-star"
                        style={{
                          fontSize: "14px",
                          color: PRIMARY_COLOR,
                          marginRight: "3px",
                        }}
                      ></i>
                    ))}
                  </div>

                  {/* Feedback Text */}
                  <p
                    style={{
                      fontSize: "14px",
                      color: "#555",
                      lineHeight: "1.6",
                      marginBottom: "16px",
                      fontStyle: "italic",
                    }}
                  >
                    "{testimonial.feedback}"
                  </p>

                  {/* Patient Info */}
                  <div className="d-flex align-items-center mt-auto">
                    <div
                      style={{
                        width: "44px",
                        height: "44px",
                        borderRadius: "50%",
                        backgroundColor: PRIMARY_COLOR,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                        fontSize: "16px",
                        color: "#ffffff",
                        fontWeight: "700",
                        flexShrink: 0,
                      }}
                    >
                      {testimonial.initials}
                    </div>
                    <div>
                      <h6
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "#000",
                          marginBottom: "2px",
                        }}
                      >
                        {testimonial.name}
                      </h6>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          marginBottom: 0,
                        }}
                      >
                        {testimonial.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Statistics Row */}
          <div
            className="row mt-5 pt-4"
            style={{ borderTop: "2px solid rgba(128, 89, 202, 0.2)" }}
          >
            {[
              { value: "500+", label: "Happy Patients" },
              { value: "4.8/5", label: "Average Rating" },
              { value: "200+", label: "Certified Nurses" },
              { value: "24/7", label: "Support Available" }
            ].map((stat, idx) => (
              <div key={idx} className="col-lg-3 col-md-6 mb-4 mb-lg-0">
                <div className="text-center">
                  <div
                    style={{
                      fontSize: "36px",
                      fontWeight: "600",
                      color: PRIMARY_COLOR,
                      marginBottom: "6px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {stat.value}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#5c626a",
                      marginBottom: 0,
                    }}
                  >
                    {stat.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Modal */}
      {showBookingModal && selectedTreatment && (
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
                  <div className="col-md-5 d-none d-md-block">
                    <img
                      src={getImageUrl(
                        selectedTreatment?.tabletdetails?.files[0],
                      )}
                      alt={selectedTreatment?.tabletdetails?.name}
                      style={{
                        height: "100%",
                        width: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>

                  <div className="col-md-7 bg-white p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0">Book Nursing Care</h5>
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
        fixedType="nursingcare"
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
          fixedType="nursingcare"
          onSubmit={handleRentSubmit}
          productId={rentProduct?.productId || rentProduct?.tabletdetails?._id}
          vendorId={rentProduct?.vendorId || rentProduct?.vendordetails?._id}
          variantId={rentProduct?.variantId || null}
        />
      )}

      {/* Consultation Modal */}
      <ConsultationModal
        show={showConsultationModal}
        fixedType="nursingcare"
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
        fixedType="nursingcare"
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
      />
    </>
  );
};

export default NursingCare;
