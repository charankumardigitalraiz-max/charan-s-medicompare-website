import React, { useState } from "react";
import { SectionHeader } from "../../../components/ui/index.js";
import { Link, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Autoplay } from "swiper/modules";
import { getHealthcareSwiperSettings } from "./healthcareSliderSettings.jsx";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import { CartQuantityControls, VendorActions } from "../../../components/ui";
import LeadModal from "../pharmacy/products-components/LeadModal.jsx";
import RentModal from "../pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../pharmacy/products-components/AppointmentModal.jsx";
import { useCart } from "../../../hooks/useCart";
import { useProfile } from "../../../context/ProfileContext";
import Slider from "react-slick";
import SEOHelmet from "../../../components/SEOHelmet";
const DentalTeeth = ({
  handleBook,
  settings,
  cheaplabtests,
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

    setCurrentLeadData({ vendor, med, variantId: null });
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
      med, // Add med to form data
      vendor, // Add vendor to form data
    });
    setShowLeadModal(true);
  };

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id || med?.name,
      variantId: effectiveVariantId || null,
      vendorId: vendor?.vendorId || vendor?._id,
      servicefixedTypes: servicePassed || med?.subcatdetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "dental",
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
      vendorId: vendor?.vendorId || vendor?._id,
      perDayRent: vendor?.perDayRent || 0,
      navigate,
      servicefixedTypes: servicePassed || med?.subcatdetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "dental",
    });
  };



  const handleConsultationClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    setConsultationFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      med,
      vendor,
    });
    setShowConsultationModal(true);
  };

  const handleAppointmentSubmit = async (e) => {
    e.preventDefault();

    if (!appointmentFormData.date) {
      toast.error("Please select a date");
      return;
    }

    if (!appointmentFormData.name) {
      toast.error("Please enter your name");
      return;
    }

    if (!appointmentFormData.phone) {
      toast.error("Please enter your phone number");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login to book an appointment");
        navigate("/login");
        return;
      }

      // Get the selected vendor and product from the form data
      const { vendor, med } = appointmentFormData;
      if (!vendor || !med) {
        toast.error("Invalid appointment details");
        return;
      }

      await axiosUserInstance.post(
        "lead/create",
        {
          name: appointmentFormData.name,
          phone: appointmentFormData.phone,
          category: appointmentFormData.category || "Dental Service",
          date: appointmentFormData.date,
          address: appointmentFormData.address || "",
          productId: med._id || med.id,
          vendorId: vendor.vendorId || vendor._id,
          variantId: null,
          leadSource: "Website",
          leadStage: "New",
          formType: "appointment",
          status: "active",
          serviceType: "dentalservice",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      toast.success("Appointment booked successfully!");
      setShowAppointmentModal(false);
      setAppointmentFormData({
        date: "",
        name: "",
        phone: "",
        category: "",
        address: "",
        med: null,
        vendor: null,
      });
    } catch (err) {
      // Error booking appointment
      toast.error(
        err.response?.data?.message ||
        err.message ||
        "Failed to book appointment",
      );
    }
  };

  const handleAppointmentClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    setAppointmentFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      med, // Add med to form data
      vendor, // Add vendor to form data
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
  const [expandedFaq, setExpandedFaq] = useState(null);

  const swiperSettings = {
    ...getHealthcareSwiperSettings({
      modules: [Navigation, Autoplay],
      navigation: {
        nextEl: ".dental-next",
        prevEl: ".dental-prev",
      },
      loop: cheaplabtests?.length > 4,
    }),
    slidesPerView: 4,
    spaceBetween: 12,
    breakpoints: {
      1200: { slidesPerView: 4, spaceBetween: 12 },
      992: { slidesPerView: 3, spaceBetween: 10 },
      768: { slidesPerView: 2.2, spaceBetween: 8 },
      0: { slidesPerView: 1.2, spaceBetween: 6 },
    },
  };

  const faqs = [
    {
      id: 1,
      question: "What dental services can I book through MediCompares?",
      answer:
        "You can book various dental services including routine checkups, teeth cleaning, root canal treatment, dental fillings, teeth whitening, braces, and more.",
    },
    {
      id: 2,
      question: "Are dental consultations available online?",
      answer:
        "Yes, we offer online dental consultations where you can speak with qualified dentists from the comfort of your home.",
    },
    {
      id: 3,
      question: "Is teeth cleaning (scaling) painful?",
      answer:
        "Teeth cleaning is generally not painful. You may experience slight discomfort or sensitivity, but most patients find it comfortable.",
    },
    {
      id: 4,
      question: "How often should I visit a dentist?",
      answer:
        "It's recommended to visit a dentist every 6 months for routine checkups and cleanings to maintain optimal oral health.",
    },
    {
      id: 5,
      question: "Does insurance cover dental care?",
      answer:
        "Many dental insurance plans cover preventive care, basic procedures, and major treatments. Coverage varies by plan, so check with your insurance provider.",
    },
    {
      id: 6,
      question: "How often should I visit a dentist?",
      answer:
        "It's recommended to visit a dentist every 6 months for routine checkups and cleanings to maintain optimal oral health.",
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const stats = [
    {
      iconClass: "fa-tooth",
      value: "1,200+",
      label: "Happy Clients",
      color: "text-primary",
    },
    {
      iconClass: "fa-users",
      value: "15+",
      label: "Years Experience",
      color: "text-primary",
    },
    {
      iconClass: "fa-user-doctor",
      value: "70+",
      label: "Doctors & Staff",
      color: "text-primary",
    },
    {
      iconClass: "fa-calendar-check",
      value: "340+",
      label: "Online Appointments",
      color: "text-primary",
    },
  ];

  const handleProductClick = (item) => {
    const data = item?.medicineDetails || item?.tabletdetails || item;
    const categorySlug =
      data?.subcategorydetails?.catdetails?.slug ||
      data?.subcatdetails?.catdetails?.slug;


    const subcategorySlug =
      data?.subcategorydetails?.slug || data?.subcatdetails?.slug;
    const productSlug = data?.slug;
    navigate(`/${categorySlug}/${subcategorySlug}/${productSlug}`);
  };

  return (
    <>
      <SEOHelmet page="dental" />

      {/* {cheaplabtests && cheaplabtests.length > 0 && (
        <div className="!py-3 !mx-2 !px-2">
          <div className="!w-full">
            <SectionHeader
              title="Dental Care Services"
              icon="fas fa-bolt"
              viewAllLink={`/${currentService}/all`}
              viewAllText="View All"
            />

            <div className="meq-swiper-wrapper" style={{ position: "relative" }}>
              <button className="meq-arrow-btn dental-prev" aria-label="Previous">
                <i className="fas fa-chevron-left"></i>
              </button>

              <Swiper {...swiperSettings}>
                {cheaplabtests?.map((test) => {
                  const vendor = test?.businessDetails;
                  const medicine = test?.medicineDetails;
                  const transformedProduct = {
                    ...test,
                    tabletdetails: {
                      _id: medicine?._id || test?._id,
                      slug: medicine?.slug || test?.slug || test?.categorySlug || currentService,
                      name: medicine?.name || test?.name,
                      files: medicine?.files || [],
                      description: medicine?.description || test?.description,
                    },
                  };
                  return (
                    <SwiperSlide key={test?._id} className="!flex !self-stretch">
                      <div
                        className="!w-full !px-1 !pb-2 !h-full !flex !flex-col !cursor-pointer"
                        onClick={() => handleProductClick(transformedProduct)}
                      >
                       
                        <div className="!flex !flex-col !h-full !w-full !bg-white !rounded-[14px] !overflow-hidden !shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:!shadow-[0_4px_24px_rgba(128,89,202,0.12)] !transition-all !duration-300">

                  
                          <div className="!relative !w-full !h-[140px] !bg-[#f8f6fc] !overflow-hidden !flex-shrink-0">
                            <img
                              src={medicine?.files?.[0] ? getImageUrl(medicine.files[0]) : "/assets/default.png"}
                              className="!w-full !h-full !object-contain"
                              alt={medicine?.name}
                              onError={(e) => { e.target.src = "/assets/default.png"; }}
                            />
                          
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                const data = test?.medicineDetails || test;
                                const categorySlug = data?.subcatdetails?.catdetails?.slug;
                                const subcategorySlug = data?.subcatdetails?.slug;
                                const medicineSlug = data?.slug;
                                if (!categorySlug || !subcategorySlug || !medicineSlug) return;
                                navigate(`/${categorySlug}/${subcategorySlug}/${medicineSlug}/compare`);
                              }}
                              className="!absolute !top-[8px] !right-[8px] !bg-gradient-to-br !from-[#f59e0b] !to-[#d97706] !rounded-[30px] !px-[10px] !py-[3px] !flex !items-center !gap-[5px] !shadow-[0_4px_12px_rgba(245,158,11,0.4)] !z-10 !cursor-pointer !transition-all !duration-300 hover:!scale-[1.08]"
                              title="Compare Package"
                            >
                              <i className="fa-solid fa-hand-pointer !text-[11px] !text-white !rotate-90 !inline-block"></i>
                              <span className="!text-[10px] !font-extrabold !text-white !uppercase !tracking-[0.6px]">Compare</span>
                            </div>
                          </div>

                         
                          <div className="!flex !flex-col !flex-grow !p-[10px] !gap-[6px]">
                        
                            <div className="!flex !items-start !justify-between !gap-2">
                              <h3 className="!m-0 !text-[13px] !font-semibold !text-[#1a1a1a] !leading-snug">
                                {medicine?.name?.length > 20 ? medicine.name.slice(0, 20) + "..." : medicine?.name}
                              </h3>
                              <div className="!flex !items-center !shrink-0 !text-[11px] !gap-[3px]">
                                <i className="fa fa-star" style={{ color: "#ffc107" }}></i>
                                <span className="!text-[#444]">{medicine?.averageRating?.toFixed(1) > 0 ? medicine.averageRating?.toFixed(1) : ""}</span>
                              </div>
                            </div>

                            <p className="!m-0 !text-[11px] !text-[#666]">Routine checkup, scaling & polishing</p>

                     
                            <div className="!flex !flex-col !gap-[3px]">
                              <p className="!m-0 !flex !items-center !gap-[5px] !text-[10px] !text-[#444] !capitalize">
                                <i className="fas fa-procedures !text-[#321961] !w-[12px]"></i>
                                <span>Treatment:</span>
                                <strong>{medicine?.treatmenttype}</strong>
                              </p>
                              <p className="!m-0 !flex !items-center !gap-[5px] !text-[10px] !text-[#444]">
                                <i className="fas fa-clock !text-[#321961] !w-[12px]"></i>
                                <span>Duration:</span>
                                <strong>30–90 mins</strong>
                              </p>
                              <p className="!m-0 !flex !items-center !gap-[5px] !text-[10px] !text-[#444]">
                                <i className="fas fa-user-md !text-[#321961] !w-[12px]"></i>
                                <span>Specialist:</span>
                                <strong>Dentist</strong>
                              </p>
                              {medicine?.reportsDuration && (
                                <p className="!m-0 !flex !items-center !gap-[5px] !text-[10px] !text-[#444]">
                                  <i className="fa-regular fa-file-lines !text-[#321961]"></i>
                                  Reports in <strong>{medicine?.reportsDuration}</strong>
                                </p>
                              )}
                            </div>

                           
                            <div className="!flex !items-center !flex-wrap !gap-[6px] !mt-auto !pt-[4px]">
                              {(() => {
                                const originalPrice = parseFloat(test?.price) || 0;
                                const discountPrice = parseFloat(test?.discountprice || test?.discountPrice) || null;
                                const showDiscount = discountPrice && discountPrice > 0 && discountPrice < originalPrice;
                                const displayPrice = showDiscount ? discountPrice : originalPrice;
                                const discountPercent = showDiscount ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100) : 0;
                                return (
                                  <>
                                    <span className="!font-bold !text-[14px] !text-[#1a1a1a]">₹{displayPrice.toLocaleString("en-IN")}</span>
                                    {showDiscount && (
                                      <>
                                        <span className="!text-[11px] !text-[#999] !line-through">₹{originalPrice.toLocaleString("en-IN")}</span>
                                        <span className="!text-[10px] !font-bold !text-white !bg-[#F97316] !rounded-[4px] !px-[5px] !py-[2px]">{discountPercent}% OFF</span>
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                            </div>

                            <VendorActions
                              bookingType={test?.medicineDetails?.subcatdetails?.catdetails?.categoryType || service?.categoryType || "cart"}
                              med={test?.medicineDetails || test}
                              vendor={test?.businessDetails || {}}
                              price={parseFloat(test?.price) || 0}
                              calculatedDiscountPrice={parseFloat(test?.discountprice || test?.discountPrice) || null}
                              service={test?.medicineDetails?.subcatdetails?.catdetails?.fixedType || "dentalservice"}
                              handleRentalBookinProcess={handleRentalBookinProcess}
                              handleNavigateToBooking={handleBooking}
                              handleAddLead={handleAddLead}
                              handleOpenConsultationModal={handleConsultationClick}
                              handleOpenAppointmentModal={handleAppointmentClick}
                              handleOpenRideModal=""
                              className="w-100"
                              containerStyle={{ display: "flex", width: "100%" }}
                            />

                            {vendor && (
                              <div className="!mt-[8px] !pt-[8px] !border-t !border-[#0000001a]">
                                <div
                                  className="!flex !items-center !gap-[8px] !cursor-pointer hover:!opacity-90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const vendorId = vendor?.slug || vendor?.vendorId || vendor?._id || vendor?.bussinessdetails?.slug || vendor?.bussinessdetails?.vendorId || vendor?.bussinessdetails?._id;
                                    if (vendorId) {
                                      const name = vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
                                      const vendorSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
                                      sessionStorage.setItem("vendorId", vendorId);
                                      navigate(`/vendor-profile/${vendorSlug}`);
                                    } else {
                                      toast.error("Vendor information not available");
                                    }
                                  }}
                                >
                                  <div className="!w-[44px] !h-[44px] !rounded-[8px] !overflow-hidden !bg-[#f0f0f0] !shrink-0">
                                    <img
                                      src={vendor?.bussiness_image?.url ? getImageUrl(vendor.bussiness_image.url) : "/assets/default.png"}
                                      alt={vendor.name}
                                      onError={(e) => { e.target.src = "/assets/default.png"; }}
                                      className="!w-full !h-full !object-contain"
                                    />
                                  </div>
                                  <div className="!flex-1 !min-w-0">
                                    <h6 className="!m-0 !text-[12px] !font-semibold !text-[#1a1a1a] !truncate">{vendor.name}</h6>
                                    {Number(test?.averageRating) > 0 && Number(test?.ratingCount) > 0 && (
                                      <div className="!flex !items-center !gap-[3px] !text-[10px] !text-[#666]">
                                        <i className="fas fa-star !text-[#ffc107] !text-[9px]"></i>
                                        <span className="!font-medium">{Number(test.averageRating).toFixed(1)}</span>
                                        <span className="!text-[#999]">({test?.ratingCount}+)</span>
                                      </div>
                                    )}
                                    <div className="!flex !items-center !gap-[4px] !text-[10px] !text-[#444] !mt-[1px]">
                                      <i className="fa-solid fa-location-dot !text-[#321961] !text-[10px]"></i>
                                      <span className="!truncate">{vendor.address?.length > 22 ? vendor.address.slice(0, 22) + "..." : vendor.address || "Address not available"}</span>
                                    </div>
                                    {test?.distanceInKm && (
                                      <div className="!flex !items-center !gap-[3px] !text-[10px] !text-[#666] !mt-[1px]">
                                        <i className="isax isax-route-square !text-[#321961] !text-[10px]"></i>
                                        <span>{parseFloat(test.distanceInKm).toFixed(1)} km away</span>
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

              <button className="meq-arrow-btn dental-next" aria-label="Next">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )} */}

      {middleBanners?.length > 0 && (
        <section
          className="section welcome-section px-3 mt-3 offers-section bg-white"
        >
          <div className="container-fluid">
            <div className="text-center mb-3">
              <h2
                className="mb-3 text-[28px] font-semibold text-[#1a1a1a]"
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
                      className="px-1 rounded-[10px]"
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
                  className="px-1 rounded-[10px]"
                />
              </div>
            )}
          </div>
        </section>
      )}
      <section
        className="!mt-3 !bg-[#E8E4F5] !bg-[url('/assets/Medicompares%20Background.png')] !bg-cover !bg-center !bg-no-repeat"
      >
        <div className="!w-full !px-4">
          <div className="!flex !flex-col md:!flex-row !items-center !pt-3 !w-full">
            <div className="!w-full md:!w-1/2 !text-center !mb-4 md:!mb-0 lg:!block !hidden">
              <div className="!relative !inline-block">
                <img
                  src="/assets/Medicompares Dentist Webpage 2 (1).png"
                  alt="Dental Doctor"
                  className="!max-w-full !h-auto !max-h-[420px]"
                />
              </div>
            </div>

            <div className="!w-full md:!w-1/2">
              <h2
                className="!font-semibold !text-[#1a1a1a] !text-[32px] md:!text-[36px] !leading-[46px]"
              >
                The Best Dental Clinics <br /> That You Can Trust
              </h2>

              <p
                className="!text-[#1a1a1a] !text-[14px] !leading-[28px]"
              >
                Our clinic delivers comprehensive dental solutions, from routine
                checkups to advanced procedures, supported by modern equipment
                and skilled dentists. We are committed to providing reliable,
                patient-centered care in a calm and comfortable environment.
                <br />
                Comprehensive dental care delivered by experienced professionals
                using modern technology, focused on comfort, safety, and
                long-term oral health.
              </p>

              <div className="!grid !grid-cols-2 !gap-3 !mb-2">
                <div className="!flex !items-center !gap-2">
                  <i className="fa-solid fa-circle-check" style={{ color: "#22c55e", fontSize: "16px", flexShrink: 0 }}></i>
                  <span className="!text-sm !font-semibold !text-[#1a1a1a]">
                    Modern Equipment
                  </span>
                </div>

                <div className="!flex !items-center !gap-2">
                  <i className="fa-solid fa-circle-check" style={{ color: "#22c55e", fontSize: "16px", flexShrink: 0 }}></i>
                  <span className="!text-sm !font-semibold !text-[#1a1a1a]">
                    Easy Online Appointment
                  </span>
                </div>

                <div className="!flex !items-center !gap-2">
                  <i className="fa-solid fa-circle-check" style={{ color: "#22c55e", fontSize: "16px", flexShrink: 0 }}></i>
                  <span className="!text-sm !font-semibold !text-[#1a1a1a]">
                    Comfortable Clinic
                  </span>
                </div>

                <div className="!flex !items-center !gap-2">
                  <i className="fa-solid fa-circle-check" style={{ color: "#22c55e", fontSize: "16px", flexShrink: 0 }}></i>
                  <span className="!text-sm !font-semibold !text-[#1a1a1a]">
                    Always Monitored
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="!py-8 md:!py-12 !bg-[#f8f6fc]">
        <div className="!max-w-6xl !mx-auto !px-4">
          <div className="!grid !grid-cols-2 lg:!grid-cols-4 !gap-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="!flex !items-center !gap-3 !bg-white !rounded-sm !px-4 !py-5 !shadow-[0_4px_24px_rgba(128,89,202,0.10)]"
              >
                <div
                  className="!flex !items-center !justify-center !shrink-0 !w-[52px] !h-[52px] !rounded-[12px]"
                  style={{ background: "linear-gradient(135deg, #321961, #a07dd8)" }}
                >
                  <i
                    className={`fa-solid ${stat.iconClass}`}
                    style={{ color: "#fff", fontSize: "20px" }}
                  ></i>
                </div>
                <div>
                  <h3 className="!m-0 !font-bold !text-[24px] !leading-none !text-[#321961]">
                    {stat.value.split("+")[0]}<span>+</span>
                  </h3>
                  <p className="!mt-[4px] !mb-0 !text-[12px] !font-medium !text-[#666] !leading-tight">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAQ  */}
      <section
        className="!mx-2 !py-[30px] !px-0 !bg-[#E8E4F5] !bg-[url('/assets/Medicompares%20Background.png')] !bg-cover !bg-center !bg-no-repeat"
      >
        <div className="!w-full !px-4">
          <div className="!flex !flex-col lg:!flex-row !gap-6">
            <div className="!w-full lg:!w-[40%] !mb-4 lg:!mb-0">
              <img
                src="/assets/Medicomapres Dentist Website (1).png"
                alt="FAQ"
                className="!img-fluid !rounded !w-100 lg:!block !hidden !max-h-[420px]"
              />
            </div>
            <div className="!w-full lg:!w-[60%]">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="!bg-white !rounded-[12px] !mb-[15px] !overflow-hidden !shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                >
                  <div
                    className="!py-[14px] !px-[16px] !flex !justify-between !items-center !cursor-pointer"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <h5
                      className="!text-[16px] !font-semibold !text-[#212121] !m-0 !flex-1"
                    >
                      {faq.question}
                    </h5>
                    <span
                      className="!text-[20px] !text-[#7f2ef6] !font-semibold !transition-all !duration-300 !ease !flex !items-center !justify-center !w-[24px] !h-[24px]"
                    >
                      {expandedFaq === faq.id ? (
                        <i className="fas fa-minus"></i>
                      ) : (
                        <i className="fas fa-plus"></i>
                      )}
                    </span>
                  </div>
                  {expandedFaq === faq.id && (
                    <div
                      className="!pt-0 !pb-[16px] !px-[16px] !text-[14px] !text-[#757575] !leading-[1.6]"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Lead Modal */}
      <LeadModal
        show={showLeadModal}
        onClose={() => {
          setShowLeadModal(false);
          setLeadFormData({
            ...INITIAL_LEAD_FORM,
            med: null,
            vendor: null,
          });
        }}
        formData={leadFormData}
        onChange={(e) =>
          setLeadFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }))
        }
        productId={leadFormData?.med?._id || leadFormData?.med?.id || null}
        vendorId={
          leadFormData?.vendor?.vendorId || leadFormData?.vendor?._id || null
        }
        variantId={null}
        onSubmit={handleSubmitLeadNew}
        fixedType="dentalservice"
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
              med: null,
              vendor: null,
            });
          }}
          rentProduct={rentProduct}
          formData={rentFormData}
          onFormChange={handleRentFormChange}
          productId={rentFormData?.med?._id || rentFormData?.med?.id || null}
          vendorId={
            rentFormData?.vendor?.vendorId || rentFormData?.vendor?._id || null
          }
          variantId={null}
          onSubmit={handleRentSubmit}
          fixedType="dentalservice"
        />
      )}

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
            med: null,
            vendor: null,
          });
        }}
        formData={consultationFormData}
        onFormChange={(e) =>
          setConsultationFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }))
        }
        productId={
          consultationFormData?.med?._id ||
          consultationFormData?.med?.id ||
          null
        }
        vendorId={
          consultationFormData?.vendor?.vendorId ||
          consultationFormData?.vendor?._id ||
          null
        }
        variantId={null}
        onSubmit={handleConsultationSubmit}
        fixedType="dentalservice"
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
            med: null,
            vendor: null,
          });
        }}
        formData={appointmentFormData}
        onFormChange={(e) =>
          setAppointmentFormData((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
          }))
        }
        productId={
          appointmentFormData?.med?._id || appointmentFormData?.med?.id || null
        }
        vendorId={
          appointmentFormData?.vendor?.vendorId ||
          appointmentFormData?.vendor?._id ||
          null
        }
        variantId={null}
        onSubmit={handleAppointmentSubmit}
        fixedType="dentalservice"
      />
    </>
  );
};

export default DentalTeeth;
