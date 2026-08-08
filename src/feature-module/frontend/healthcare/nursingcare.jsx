import { useState } from "react";
import { SectionHeader } from "../../../components/ui/index.js";
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

  const PRIMARY_COLOR = "#321961";
  const PRIMARY_SECTION_BG = "#f8f4ff";
  const PRIMARY_DARK = "#6d48b8";

  return (
    <>
      <SEOHelmet page="clinics" />

      {/* {medicalTreatments && medicalTreatments.length > 0 && (
        <div className="!py-3 !mx-2 !px-2">
          <div className="!w-full">
            <SectionHeader
              title="Top Services"
              icon="fas fa-bolt"
              viewAllLink={`/${currentService}/all`}
              viewAllText="View All"
            />

            <div className="!px-2">
              <Slider {...medicalSliderSettings}>
                {medicalTreatments?.map((treatment, index) => {
                  const vendor = treatment?.vendordetails;
                  return (
                    <div key={index} className="!px-2 !py-2">
                      <div className="!flex !flex-col !h-full !w-full !rounded-[16px] !bg-white !shadow-[0_4px_20px_rgba(0,0,0,0.08)] !overflow-hidden !transition-all !duration-300 hover:!shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:!-translate-y-[2px]">
                     
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
                          className="!absolute !top-[10px] !right-[10px] !flex !items-center !gap-[6px] !z-10 !cursor-pointer !transition-all !duration-300 hover:!scale-[1.1] hover:!-translate-y-[2px]"
                          style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "30px", padding: "3px 14px", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", border: "1.5px solid #fff" }}
                          title="Compare Package"
                        >
                          <i className="fa-solid fa-hand-pointer" style={{ fontSize: "13px", color: "#fff", transform: "rotate(90deg)", display: "inline-block" }}></i>
                          <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "0.6px" }}>Compare</span>
                        </div>

                       
                        <div className="!w-full !h-[180px] !overflow-hidden !bg-white !rounded-t-[16px]">
                          <img
                            src={getImageUrl(treatment?.tabletdetails?.files[0])}
                            alt={treatment?.tabletdetails?.name}
                            title={treatment?.tabletdetails?.name}
                            onClick={() => handleProductClick(treatment)}
                            className="!w-full !h-full !object-contain !cursor-pointer"
                          />
                        </div>

                    
                        <div className="!flex !flex-col !flex-1 !p-3">
                          <div className="!flex !items-start !justify-between !gap-2 !mb-1">
                            <h3 className="!m-0 !text-[14px] !font-semibold !text-[#1a1a1a] !capitalize !leading-snug">
                              {treatment?.tabletdetails.name?.length > 20
                                ? treatment?.tabletdetails.name.slice(0, 20) + "..."
                                : treatment?.tabletdetails.name}
                            </h3>

                            <div className="!flex !items-center !shrink-0 !gap-[3px] !text-[11px]">
                              <i className="fa fa-star !text-[#ffc107]"></i>
                              <span className="!text-[#444]">
                                {treatment?.tabletdetails?.averageRating?.toFixed(1) > 0
                                  ? treatment?.tabletdetails.averageRating?.toFixed(1)
                                  : 0}
                              </span>
                              <i className="fa fa-users !ml-1" style={{ color: PRIMARY_COLOR }}></i>
                              <span className="!text-[#666]">
                                ({treatment?.tabletdetails?.ratingCount > 0 ? `${treatment?.tabletdetails.ratingCount}+` : 0})
                              </span>
                            </div>
                          </div>

                          <div className="!flex !flex-col !cursor-pointer" onClick={() => handleProductClick(treatment)}>
                            <p
                              className="!m-0 !mb-2 !text-[11px] !text-[#666] !leading-normal [&_*]:!text-[11px] [&_*]:!text-[#666] [&_*]:!leading-normal"
                              dangerouslySetInnerHTML={{
                                __html:
                                  treatment?.tabletdetails?.description?.length > 100
                                    ? treatment?.tabletdetails?.description?.slice(0, 100) + "..."
                                    : treatment?.tabletdetails?.description,
                              }}
                            ></p>

                            {treatment?.tabletdetails?.duration && (
                              <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mb-[2px]">
                                <i className="fa-regular fa-clock" style={{ color: PRIMARY_COLOR }}></i>
                                <span>Duration:</span>
                                <strong>{treatment?.tabletdetails?.duration}</strong>
                              </div>
                            )}
                            {treatment?.tabletdetails?.shiftType && (
                              <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mb-[2px]">
                                <i className="fa-regular fa-calendar-days" style={{ color: PRIMARY_COLOR }}></i>
                                <span>Shift:</span>
                                <strong>{treatment?.tabletdetails?.shiftType?.replace(/_/g, " ")}</strong>
                              </div>
                            )}
                            {treatment?.tabletdetails?.nursecareType && (
                              <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mb-[2px]">
                                <i className="fa-solid fa-tag" style={{ color: PRIMARY_COLOR }}></i>
                                <span>Type:</span>
                                <strong>{treatment?.tabletdetails?.nursecareType?.replace(/_/g, " ")}</strong>
                              </div>
                            )}

                    }
                            <div className="!rounded-[8px] !p-[8px] !mt-[4px] !border !border-[rgba(128,89,202,0.15)]" style={{ backgroundColor: PRIMARY_SECTION_BG }}>
                              <div className="!text-[10px] !text-[#444] !font-medium !mb-[3px]">Starting From</div>
                              {treatment?.discountprice ? (
                                <div className="!flex !items-center !flex-wrap !gap-1">
                                  <span className="!font-bold !text-[15px] !text-[#1a1a1a]">₹{treatment.discountprice}</span>
                                  <span className="!line-through !text-[#999] !text-[12px]">₹{treatment.price}</span>
                                  <span className="!text-red-500 !text-[11px] !font-semibold">
                                    {Math.round(((treatment.price - treatment.discountprice) / treatment.price) * 100)}% OFF
                                  </span>
                                </div>
                              ) : (
                                <span className="!font-bold !text-[15px] !text-[#1a1a1a]">₹{treatment?.price || 0}</span>
                              )}
                            </div>
                          </div>

                          <VendorActions
                            bookingType={treatment?.vendordetails?.bookingType || service?.categoryType || "cart"}
                            med={treatment?.tabletdetails || treatment}
                            vendor={treatment?.vendordetails || {}}
                            price={parseFloat(treatment?.price) || 0}
                            calculatedDiscountPrice={parseFloat(treatment?.discountprice || treatment?.discountPrice) || null}
                            service={treatment?.tabletdetails?.subcategorydetails?.catdetails?.fixedType || "nursingcare"}
                            handleRentalBookinProcess={handleRentalBookinProcess}
                            handleNavigateToBooking={handleBooking}
                            handleAddLead={handleAddLead}
                            handleOpenConsultationModal={handleConsultationClick}
                            handleOpenAppointmentModal={handleAppointmentClick}
                            handleOpenRideModal=""
                            containerStyle={{ display: "flex", width: "100%", marginTop: "8px" }}
                          />

                      
                          {vendor && (
                            <div
                              className="!mt-3 !pt-2 !border-t !border-[#e0e0e0] !cursor-pointer"
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
                              <div className="!flex !items-center !gap-2">
                                <div className="!w-[40px] !h-[40px] !rounded-[6px] !overflow-hidden !bg-white !shrink-0">
                                  <img
                                    src={getImageUrl(vendor?.bussiness_image[0]?.url)}
                                    alt={vendor.name}
                                    className="!w-full !h-full !object-contain"
                                  />
                                </div>

                                <div className="!grow !min-w-0">
                                  <div className="!flex !items-center !justify-between !gap-2 !mb-[2px]">
                                    <h6 className="!m-0 !text-[12px] !font-semibold !truncate">{vendor.name}</h6>
                                    {treatment?.averageRating > 0 && treatment?.ratingCount > 0 && (
                                      <div className="!flex !items-center !gap-[3px] !text-[10px] !text-[#666] !shrink-0">
                                        <i className="fas fa-star !text-[#ffc107] !text-[9px]"></i>
                                        <span className="!font-medium">{treatment?.averageRating.toFixed(1)}</span>
                                        <span className="!text-[#999]">({treatment?.ratingCount}+)</span>
                                      </div>
                                    )}
                                  </div>
                                  <div className="!flex !items-center !gap-1 !text-[#6b7280] !text-[11px] !overflow-hidden">
                                    <i className="fa-solid fa-location-dot !text-[11px] !text-[#321961]"></i>
                                    <span className="!truncate">{vendor.address}</span>
                                  </div>
                                  {treatment?.distanceInKm && (
                                    <div className="!flex !items-center !gap-1 !text-[#6b7280] !text-[11px]">
                                      <i className="fas fa-map-marker-alt !text-[10px] !text-[#321961]"></i>
                                      <span className="!truncate">{parseFloat(treatment.distanceInKm).toFixed(1)} km away</span>
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
        </div>
      )} */}

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
          <div className="!text-center !mb-8">
            <h2 className="!m-0 !text-[36px] !font-semibold !bg-gradient-to-r !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent !tracking-tight">
              How It Works
            </h2>
            <p className="!text-[#666] !text-[15px] !max-w-[700px] !mx-auto !mt-2">
              Get guidance and assistance for your nursing care requirements.
              Explore the section to know more.
            </p>
          </div>

          <div className="!flex !flex-col md:!flex-row !items-center !justify-between !gap-6 !mt-6">

            {/* Step 1 */}
            <div className="!flex-1 !w-full !text-center">
              <div className="!flex !flex-col !items-center">
                <div
                  style={{ boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)" }}
                  className="!w-[90px] !h-[90px] !rounded-full !bg-[#321961] !flex !items-center !justify-center !relative !border-[4px] !border-[rgba(128,89,202,0.2)] !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_10px_30px_rgba(128,89,202,0.4)]"
                >
                  <i className="fa fa-calendar-check !text-white !text-[36px]"></i>
                  <div
                    style={{ boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)" }}
                    className="!absolute !top-[-4px] !right-[-4px] !w-[28px] !h-[28px] !rounded-full !bg-[#6d48b8] !flex !items-center !justify-center !text-white !text-[12px] !font-bold !border-2 !border-white"
                  >
                    1
                  </div>
                </div>
                <h5 className="!mt-4 !mb-2 !text-[16px] !font-bold !text-[#321961]">
                  Book Nursing Care Service
                </h5>
                <p className="!m-0 !text-[13px] !text-[#666] !leading-relaxed">
                  Fill up the booking form to place your request
                </p>
              </div>
            </div>

            {/* Arrow 1 */}
            <div className="!hidden md:!flex !items-center !justify-center">
              <i className="fa fa-arrow-right !text-[24px] !text-[#321961] !opacity-30"></i>
            </div>

            {/* Step 2 */}
            <div className="!flex-1 !w-full !text-center">
              <div className="!flex !flex-col !items-center">
                <div
                  style={{ boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)" }}
                  className="!w-[90px] !h-[90px] !rounded-full !bg-[#321961] !flex !items-center !justify-center !relative !border-[4px] !border-[rgba(128,89,202,0.2)] !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_10px_30px_rgba(128,89,202,0.4)]"
                >
                  <i className="fa fa-phone-alt !text-white !text-[36px]"></i>
                  <div
                    style={{ boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)" }}
                    className="!absolute !top-[-4px] !right-[-4px] !w-[28px] !h-[28px] !rounded-full !bg-[#6d48b8] !flex !items-center !justify-center !text-white !text-[12px] !font-bold !border-2 !border-white"
                  >
                    2
                  </div>
                </div>
                <h5 className="!mt-4 !mb-2 !text-[16px] !font-bold !text-[#321961]">
                  MediCompares Nursing Expert
                </h5>
                <p className="!m-0 !text-[13px] !text-[#666] !leading-relaxed">
                  You will receive a confirmation call
                </p>
              </div>
            </div>

            {/* Arrow 2 */}
            <div className="!hidden md:!flex !items-center !justify-center">
              <i className="fa fa-arrow-right !text-[24px] !text-[#321961] !opacity-30"></i>
            </div>

            {/* Step 3 */}
            <div className="!flex-1 !w-full !text-center">
              <div className="!flex !flex-col !items-center">
                <div
                  style={{ boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)" }}
                  className="!w-[90px] !h-[90px] !rounded-full !bg-[#321961] !flex !items-center !justify-center !relative !border-[4px] !border-[rgba(128,89,202,0.2)] !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_10px_30px_rgba(128,89,202,0.4)]"
                >
                  <i className="fa fa-heartbeat !text-white !text-[36px]"></i>
                  <div
                    style={{ boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)" }}
                    className="!absolute !top-[-4px] !right-[-4px] !w-[28px] !h-[28px] !rounded-full !bg-[#6d48b8] !flex !items-center !justify-center !text-white !text-[12px] !font-bold !border-2 !border-white"
                  >
                    3
                  </div>
                </div>
                <h5 className="!mt-4 !mb-2 !text-[16px] !font-bold !text-[#321961]">
                  Nursing Professional Arrives
                </h5>
                <p className="!m-0 !text-[13px] !text-[#666] !leading-relaxed">
                  Receive professional nursing care at your home
                </p>
              </div>
            </div>

            {/* Arrow 3 */}
            <div className="!hidden md:!flex !items-center !justify-center">
              <i className="fa fa-arrow-right !text-[24px] !text-[#321961] !opacity-30"></i>
            </div>

            {/* Step 4 */}
            <div className="!flex-1 !w-full !text-center">
              <div className="!flex !flex-col !items-center">
                <div
                  style={{ boxShadow: "0 6px 20px rgba(128, 89, 202, 0.3)" }}
                  className="!w-[90px] !h-[90px] !rounded-full !bg-[#321961] !flex !items-center !justify-center !relative !border-[4px] !border-[rgba(128,89,202,0.2)] !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_10px_30px_rgba(128,89,202,0.4)]"
                >
                  <i className="fa fa-star !text-white !text-[36px]"></i>
                  <div
                    style={{ boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)" }}
                    className="!absolute !top-[-4px] !right-[-4px] !w-[28px] !h-[28px] !rounded-full !bg-[#6d48b8] !flex !items-center !justify-center !text-white !text-[12px] !font-bold !border-2 !border-white"
                  >
                    4
                  </div>
                </div>
                <h5 className="!mt-4 !mb-2 !text-[16px] !font-bold !text-[#321961]">
                  Quality Care Delivered
                </h5>
                <p className="!m-0 !text-[13px] !text-[#666] !leading-relaxed">
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
          className="!py-12"
          style={{ backgroundColor: PRIMARY_SECTION_BG }}
        >
          <div className="!max-w-7xl !mx-auto !px-4">
            <div className="!text-center !mb-10">
              <h2 className="!m-0 !text-[32px] !font-semibold !text-[#1a1a1a]">
                Other Services We Offer
              </h2>
              <p className="!text-[#666] !text-[15px] !max-w-[800px] !mx-auto !mt-2">
                Choose from our wide variety of services. Get Assurance for
                quality round the clock care.
              </p>
            </div>

            <div className="!grid !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-3 lg:!grid-cols-4 !gap-6">
              {nursingOfferProducts?.slice(0, 8).map((ele, ind) => {
                return (
                  <div key={ind} className="!w-full">
                    <div
                      className="!relative !h-[220px] !rounded-[16px] !overflow-hidden !cursor-pointer !border !border-[rgba(128,89,202,0.08)] !shadow-[0_4px_20px_rgba(128,89,202,0.06)] !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_12px_30px_rgba(128,89,202,0.25)] hover:!border-[#321961]"
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
                        className="!absolute !inset-0 !w-full !h-full !object-cover !z-0"
                      />

                      {/* Gradient Overlay for Text Readability */}
                      <div className="!absolute !bottom-0 !left-0 !w-full !h-[60%] !bg-gradient-to-t !from-[rgba(0,0,0,0.85)] !via-[rgba(0,0,0,0.4)] !to-transparent !z-[1]" />

                      {/* Title Text Overlaid */}
                      <div className="!absolute !bottom-0 !left-0 !w-full !p-4 !z-[2] !flex !items-end !justify-center !text-center">
                        <h5
                          className="!m-0 !text-[15px] !font-semibold !text-white !capitalize !leading-normal"
                          style={{ textShadow: "0 2px 4px rgba(0,0,0,0.6)" }}
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
        className="!py-12"
        style={{
          backgroundColor: "#E8E4F5",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="!max-w-7xl !mx-auto !px-4">
          <div className="!text-center !mb-10">
            <h2 className="!m-0 !text-[36px] !font-semibold !bg-gradient-to-r !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent !tracking-tight">
              What Our Customers Say
            </h2>
            <p className="!text-[#666] !text-[15px] !max-w-[700px] !mx-auto !mt-2">
              Read testimonials from families who have experienced our
              professional nursing care services
            </p>
          </div>

          <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 !gap-6">
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
              <div key={index} className="!w-full !flex">
                <div
                  className="!flex !flex-col !w-full !p-6 !bg-white !rounded-[16px] !shadow-[0_6px_16px_rgba(128,89,202,0.06)] !border !border-[rgba(128,89,202,0.1)] !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_12px_24px_rgba(128,89,202,0.12)] hover:!border-[#321961]"
                >
                  {/* Top content wrapper */}
                  <div className="!flex !justify-between !items-start !mb-4">
                    {/* Rating Stars */}
                    <div className="!flex !gap-[3px]">
                      {Array.from({ length: testimonial.stars }).map((_, starIdx) => (
                        <i
                          key={starIdx}
                          className="fa fa-star !text-[#321961] !text-[13px]"
                        ></i>
                      ))}
                    </div>

                    {/* Quote Icon */}
                    <div className="!w-8 !h-8 !rounded-full !bg-[#f8f4ff] !flex !items-center !justify-center !opacity-80">
                      <i className="fa fa-quote-right !text-[#321961] !text-[14px]"></i>
                    </div>
                  </div>

                  {/* Feedback Text */}
                  <p className="!text-[14px] !text-[#555] !leading-relaxed !italic !mb-6 !flex-grow">
                    "{testimonial.feedback}"
                  </p>

                  {/* Patient Info */}
                  <div className="!flex !items-center !gap-3 !mt-auto">
                    <div className="!w-11 !h-11 !rounded-full !bg-[#321961] !flex !items-center !justify-center !text-white !text-[15px] !font-bold !shrink-0">
                      {testimonial.initials}
                    </div>
                    <div>
                      <h6 className="!m-0 !text-[14px] !font-semibold !text-black !mb-[2px]">{testimonial.name}</h6>
                      <p className="!m-0 !text-[12px] !text-[#666]">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Statistics Row */}
          <div className="!grid !grid-cols-2 md:!grid-cols-4 !gap-6 !mt-10 !pt-8 !border-t-2 !border-[rgba(128,89,202,0.2)]">
            {[
              { value: "500+", label: "Happy Patients" },
              { value: "4.8/5", label: "Average Rating" },
              { value: "200+", label: "Certified Nurses" },
              { value: "24/7", label: "Support Available" }
            ].map((stat, idx) => (
              <div key={idx} className="!text-center">
                <div className="!text-[36px] !font-bold !text-[#321961] !mb-1 !tracking-tight">
                  {stat.value}
                </div>
                <p className="!m-0 !text-[14px] !font-semibold !text-[#5c626a]">
                  {stat.label}
                </p>
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
