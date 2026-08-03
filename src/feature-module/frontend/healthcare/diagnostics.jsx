import React, { useState } from "react";
import { SectionHeader } from "../../../components/ui/index.js";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Swiper, SwiperSlide, } from "swiper/react";
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
import { useAddToCart } from "../../../hooks/useAddToCart";
import { useCart } from "../../../hooks/useCart";
import { useProfile } from "../../../context/ProfileContext";
import { getHealthcareSwiperSettings } from "./healthcareSliderSettings.jsx";
import SEOHelmet from "../../../components/SEOHelmet";

const diagnostics = ({
  imgUrl,
  packages,
  handleBook,
  cheaplabtests,
  compareItems,
  clearAllCompare,
  currentService,
  handleCompareBar,
  middleBanners,
  settings,
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
  const { addToCart } = useAddToCart();
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

    setCurrentLeadData({ vendor, med });
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
      med,
      vendor,
    });
    setShowLeadModal(true);
  };

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id,
      variantId: effectiveVariantId || null,
      vendorId: vendor.vendorId || vendor._id,
      servicefixedTypes: servicePassed || test?.medicineDetails?.category?.fixedType || "diagnostics",
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
      servicefixedTypes: servicePassed || test?.medicineDetails?.category?.fixedType || "diagnostics",
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
    setAppointmentFormData({
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

      const { vendor, med } = currentLeadData || {};
      if (!vendor || !med) {
        toast.error("Invalid appointment details");
        return;
      }

      await axiosUserInstance.post(
        "lead/create",
        {
          name: appointmentFormData.name,
          phone: appointmentFormData.phone,
          category: appointmentFormData.category || "Diagnostic Test",
          date: appointmentFormData.date,
          address: appointmentFormData.address || "",
          productId: med._id || med.id,
          vendorId: vendor.vendorId || vendor._id,
          variantId: null,
          leadSource: "Website",
          leadStage: "New",
          formType: "appointment",
          status: "active",
          serviceType: "diagnostics",
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

  const swiperSettings = getHealthcareSwiperSettings({
    modules: [Navigation, Autoplay],
    navigation: {
      nextEl: ".dental-next",
      prevEl: ".dental-prev",
    },
    loop: cheaplabtests?.length > 4,
    slidesPerView: 4,
    spaceBetween: 12,
    breakpoints: {
      1200: { slidesPerView: 4, spaceBetween: 12 },
      992: { slidesPerView: 3, spaceBetween: 10 },
      768: { slidesPerView: 2.2, spaceBetween: 8 },
      0: { slidesPerView: 1.2, spaceBetween: 6 },
    },
  });

  const navigate = useNavigate();

  const handleProductClick = (item) => {
    const medicine = item?.medicineDetails;

    const categorySlug = medicine?.subcatdetails?.catdetails?.slug;

    const subcategorySlug = medicine?.subcatdetails?.slug;

    const medicineSlug = medicine?.slug;

    navigate(`/${categorySlug}/${subcategorySlug}/${medicineSlug}`);
  };

  return (
    <>
      <SEOHelmet page="diagnostics" />
      {cheaplabtests && cheaplabtests.length > 0 && (
        <div className="!py-3 !mx-2 !px-2">
          <div className="!w-full">
            <SectionHeader
              title="Top CheckUp's"
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
                        {/* Card */}
                        <div className="!flex !flex-col !h-full !w-full !bg-white !rounded-[14px] !overflow-hidden !shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:!shadow-[0_4px_24px_rgba(128,89,202,0.12)] !transition-all !duration-300">

                          {/* Image */}
                          <div className="!relative !w-full !h-[140px] !bg-[#f8f6fc] !overflow-hidden !flex-shrink-0">
                            <img
                              src={medicine?.files?.[0] ? getImageUrl(medicine.files[0]) : "/assets/default.png"}
                              className="!w-full !h-full !object-contain"
                              alt={medicine?.name}
                              onError={(e) => { e.target.src = "/assets/default.png"; }}
                            />
                            {/* Compare Button */}
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

                          {/* Body */}
                          <div className="!flex !flex-col !flex-grow !p-[10px] !gap-[6px]">
                            {/* Title + Rating */}
                            <div className="!flex !items-start !justify-between !gap-2">
                              <h3 className="!m-0 !text-[13px] !font-semibold !text-[#1a1a1a] !leading-snug !capitalize">
                                {medicine?.name?.length > 20 ? medicine.name.slice(0, 20) + "..." : medicine?.name}
                              </h3>
                              <div className="!flex !items-center !shrink-0 !text-[11px] !gap-[3px]">
                                <i className="fa fa-star" style={{ color: "#ffc107" }}></i>
                                <span className="!text-[#444]">{medicine?.averageRating?.toFixed(1) > 0 ? medicine.averageRating?.toFixed(1) : ""}</span>
                              </div>
                            </div>

                            {medicine?.reportsDuration && (
                              <p className="!m-0 !flex !items-center !gap-[5px] !text-[10px] !text-[#444]">
                                <i className="fa-regular fa-file-lines !text-[#321961]"></i>
                                Reports in <strong>{medicine?.reportsDuration}</strong>
                              </p>
                            )}

                            {/* Price */}
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
                              bookingType={vendor?.bookingType || service?.categoryType || "cart"}
                              med={test.medicineDetails || test}
                              vendor={vendor}
                              effectiveVariantId={null}
                              price={test.price || 0}
                              stock={test.stock || 999}
                              service={test?.medicineDetails?.category?.fixedType || "diagnostics"}
                              calculatedDiscountPrice={test?.discountprice || test?.discountPrice || null}
                              handleRentalBookinProcess={handleRentalBookinProcess}
                              handleNavigateToBooking={handleBooking}
                              handleAddLead={handleAddLead}
                              handleOpenConsultationModal={handleConsultationClick}
                              handleOpenAppointmentModal={handleAppointmentClick}
                              containerStyle={{ width: "100%" }}
                              buttonStyle={{ width: "100%", padding: "8px 8px", borderRadius: "8px", fontSize: "12px", fontWeight: "600" }}
                            />

                            {/* Vendor */}
                            {vendor && (
                              <div className="!mt-[8px] !pt-[8px] !border-t !border-[#0000001a]">
                                <div
                                  className="!flex !items-center !gap-[8px] !cursor-pointer hover:!opacity-90"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const vendorId = vendor?.slug || vendor?.vendorId || vendor?._id;
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
                                    {test?.averageRating > 0 && test?.ratingCount > 0 && (
                                      <div className="!flex !items-center !gap-[3px] !text-[10px] !text-[#666]">
                                        <i className="fas fa-star !text-[#ffc107] !text-[9px]"></i>
                                        <span className="!font-medium">{test.averageRating.toFixed(1)}</span>
                                        <span className="!text-[#999]">({test.ratingCount}+)</span>
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
      )}

      {/* Upload & View cards */}
      <div className="!my-6 !py-2 !px-4">
        <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-4">

          {/* Upload and Book */}
          <div className="!flex !items-center !gap-4 !p-4 !rounded-[14px] !bg-gradient-to-br !from-[#F8F5FE] !to-[#F2EDFE] !border !border-[rgba(125,46,255,0.12)] !cursor-pointer !transition-all !duration-300 hover:!-translate-y-[3px] hover:!shadow-[0_6px_20px_rgba(125,46,255,0.15)] hover:!border-[rgba(125,46,255,0.3)]">
            {/* Icon */}
            <div className="!relative !shrink-0 !w-[70px] !h-[70px] !bg-gradient-to-br !from-[#321961] !to-[#822BD4] !rounded-[16px] !shadow-[0_4px_12px_rgba(125,46,255,0.3)] !flex !items-center !justify-center">
              <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "30px", color: "#fff", position: "relative", zIndex: 2, animation: "upload-bounce 2s ease-in-out infinite" }}></i>
              {/* Badge */}
              <div style={{ position: "absolute", top: "-4px", right: "-4px", width: "22px", height: "22px", background: "#FFCA18", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(255,202,24,0.4)", animation: "pulse-badge 1.5s ease-in-out infinite", zIndex: 3 }}>
                <i className="isax isax-add" style={{ fontSize: "11px", color: "#fff" }}></i>
              </div>
              <style>{`
                @keyframes upload-bounce { 0%,100%{transform:translateY(0)} 40%{transform:translateY(-4px)} }
                @keyframes pulse-badge { 0%,100%{transform:scale(1)} 50%{transform:scale(1.12)} }
              `}</style>
            </div>
            {/* Text */}
            <div className="!flex-1 !min-w-0">
              <h6 className="!m-0 !text-[17px] !font-semibold !text-[#1a1a1a]">Upload and Book</h6>
              <p className="!m-0 !mt-1 !text-[13px] !text-[#666] !leading-[1.4]">Upload prescription &amp; place booking</p>
            </div>
            {/* Arrow */}
            <div className="!shrink-0 !w-[44px] !h-[44px] !rounded-[12px] !flex !items-center !justify-center !transition-all !duration-300 hover:!scale-110" style={{ background: "linear-gradient(135deg, #321961 0%, #822BD4 100%)", boxShadow: "0 3px 10px rgba(125,46,255,0.3)" }}>
              <i className="fa-solid fa-cloud-arrow-up" style={{ color: "#fff", fontSize: "20px" }}></i>
            </div>
          </div>

          {/* View Reports */}
          <div className="!flex !items-center !gap-4 !p-4 !rounded-[14px] !bg-gradient-to-br !from-[#EAF3FF] !to-[#D4E8FF] !border !border-[rgba(17,14,253,0.1)] !cursor-pointer !transition-all !duration-300 hover:!-translate-y-[3px] hover:!shadow-[0_6px_20px_rgba(17,14,253,0.15)] hover:!border-[rgba(17,14,253,0.3)]">
            {/* Icon */}
            <div className="!relative !shrink-0 !w-[70px] !h-[70px] !bg-gradient-to-br !from-[#110EFD] !to-[#3538CD] !rounded-[16px] !shadow-[0_4px_12px_rgba(17,14,253,0.3)] !flex !items-center !justify-center">
              <i className="fa-solid fa-eye" style={{ fontSize: "30px", color: "#fff", position: "relative", zIndex: 2, animation: "view-pulse 2s ease-in-out infinite" }}></i>
              {/* Badge */}
              <div style={{ position: "absolute", right: "-8px", top: "50%", transform: "translateY(-50%)", width: "32px", height: "32px", background: "#fff", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", animation: "badge-bounce 1.5s ease-in-out infinite", zIndex: 3 }}>
                <i className="fa-solid fa-file-lines" style={{ fontSize: "15px", color: "#110EFD" }}></i>
              </div>
              <style>{`
                @keyframes view-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }
                @keyframes badge-bounce { 0%,100%{transform:translateY(-50%) scale(1)} 50%{transform:translateY(-50%) scale(1.12)} }
              `}</style>
            </div>
            {/* Text */}
            <div className="!flex-1 !min-w-0">
              <h6 className="!m-0 !text-[17px] !font-semibold !text-[#1a1a1a]">View Reports in My Bookings</h6>
              <p className="!m-0 !mt-1 !text-[13px] !text-[#666] !leading-[1.4]">Access your diagnostic test reports</p>
            </div>
            {/* Arrow */}
            <div className="!shrink-0 !w-[44px] !h-[44px] !rounded-[12px] !flex !items-center !justify-center !transition-all !duration-300 hover:!scale-110" style={{ background: "linear-gradient(135deg, #110EFD 0%, #3538CD 100%)", boxShadow: "0 3px 10px rgba(17,14,253,0.3)" }}>
              <i className="fa-solid fa-eye" style={{ color: "#fff", fontSize: "20px" }}></i>
            </div>
          </div>

        </div>
      </div>

      {/* 3-Steps Section */}
      <section className="!py-6 !bg-[#E8E4F5] !bg-[url('/assets/Medicompares%20Background.png')] !bg-cover !bg-center !bg-no-repeat">
        <div className="!max-w-7xl !mx-auto !px-6">
          <div className="!flex !flex-col lg:!flex-row !items-center !gap-8">

            {/* Title */}
            <div className="lg:!w-[260px] !shrink-0 !text-center lg:!text-left">
              <h3 className="!m-0 !text-[26px] !font-bold !leading-[1.3] !text-[#1a1a1a]">
                How to book<br />
                a Diagnostic test<br />
                <span className="!text-[#321961]">in 3 simple steps</span>
              </h3>
            </div>

            {/* Steps */}
            <div className="!flex-1 !grid !grid-cols-1 md:!grid-cols-3 !gap-6 !relative">

              {/* Step 1 */}
              <div className="!relative !flex !flex-col !items-center !text-center">
                <span className="!inline-block !mb-3 !px-[20px] !py-[7px] !rounded-full !text-[11px] !font-semibold !text-white !tracking-wide" style={{ background: "linear-gradient(135deg, #321961 0%, #822BD4 100%)", boxShadow: "0 4px 12px rgba(125,46,255,0.3)" }}>STEP 1</span>
                <div className="!w-[110px] !h-[110px] !mb-3 !flex !items-center !justify-center !relative !rounded-[24px] !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_12px_32px_rgba(125,46,255,0.3)]" style={{ background: "linear-gradient(135deg, #F8F5FE 0%, #F2EDFE 100%)", boxShadow: "0 8px 24px rgba(125,46,255,0.2)" }}>
                  <i className="isax isax-mobile" style={{ fontSize: "50px", background: "linear-gradient(135deg,#321961,#822BD4)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}></i>
                  <div className="!absolute !bottom-[12px] !right-[12px] !flex !items-center !justify-center !rounded-[8px] !border-[2px] !border-white" style={{ width: "45px", height: "32px", background: "linear-gradient(135deg, #FFCA18 0%, #FFB300 100%)", boxShadow: "0 4px 12px rgba(255,202,24,0.4)" }}>
                    <span className="!text-[9px] !font-bold !text-[#1a1a1a]">BOOK</span>
                  </div>
                </div>
                <h5 className="!mb-1 !text-[18px] !font-semibold !text-[#1a1a1a]">Book Appointment</h5>
                <p className="!m-0 !text-[12px] !text-[#666] !leading-[1.6]">Select a Test/Package and book an appointment on our platform</p>
                {/* Connector */}
                <div className="!hidden md:!block !absolute !top-[52px] !right-[-28px] !w-[52px] !h-[3px] !rounded-[2px] !z-10" style={{ background: "linear-gradient(90deg, #321961, #04BD6C)" }}>
                  <div style={{ position: "absolute", right: "-6px", top: "50%", transform: "translateY(-50%)", borderLeft: "8px solid #04BD6C", borderTop: "6px solid transparent", borderBottom: "6px solid transparent" }}></div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="!relative !flex !flex-col !items-center !text-center">
                <span className="!inline-block !mb-3 !px-[20px] !py-[7px] !rounded-full !text-[11px] !font-semibold !text-white !tracking-wide" style={{ background: "linear-gradient(135deg, #04BD6C 0%, #00A86B 100%)", boxShadow: "0 4px 12px rgba(4,189,108,0.3)" }}>STEP 2</span>
                <div className="!w-[110px] !h-[110px] !mb-3 !flex !items-center !justify-center !relative !rounded-[24px] !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_12px_32px_rgba(4,189,108,0.3)]" style={{ background: "linear-gradient(135deg, #F1FAF3 0%, #E8FFF2 100%)", boxShadow: "0 8px 24px rgba(4,189,108,0.2)" }}>
                  <i className="isax isax-hospital" style={{ fontSize: "50px", background: "linear-gradient(135deg,#04BD6C,#00A86B)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}></i>
                  <div className="!absolute !top-[12px] !right-[12px] !flex !items-center !justify-center !rounded-full !border-[2px] !border-white" style={{ width: "28px", height: "28px", background: "linear-gradient(135deg,#FFCA18,#FFB300)", boxShadow: "0 4px 12px rgba(255,202,24,0.4)" }}>
                    <i className="isax isax-location" style={{ fontSize: "14px", color: "#1a1a1a" }}></i>
                  </div>
                </div>
                <h5 className="!mb-1 !text-[18px] !font-semibold !text-[#1a1a1a]">Visit Diagnostics Center</h5>
                <p className="!m-0 !text-[12px] !text-[#666] !leading-[1.6]">Access reliable testing centers with ease</p>
                {/* Connector */}
                <div className="!hidden md:!block !absolute !top-[52px] !right-[-28px] !w-[52px] !h-[3px] !rounded-[2px] !z-10" style={{ background: "linear-gradient(90deg, #04BD6C, #FFCA18)" }}>
                  <div style={{ position: "absolute", right: "-6px", top: "50%", transform: "translateY(-50%)", borderLeft: "8px solid #FFCA18", borderTop: "6px solid transparent", borderBottom: "6px solid transparent" }}></div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="!flex !flex-col !items-center !text-center">
                <span className="!inline-block !mb-3 !px-[20px] !py-[7px] !rounded-full !text-[11px] !font-semibold !text-white !tracking-wide" style={{ background: "linear-gradient(135deg, #110EFD 0%, #3538CD 100%)", boxShadow: "0 4px 12px rgba(17,14,253,0.3)" }}>STEP 3</span>
                <div className="!w-[110px] !h-[110px] !mb-3 !flex !items-center !justify-center !relative !rounded-[24px] !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_12px_32px_rgba(17,14,253,0.3)]" style={{ background: "linear-gradient(135deg, #EAF3FF 0%, #D4E8FF 100%)", boxShadow: "0 8px 24px rgba(17,14,253,0.2)" }}>
                  <i className="isax isax-document-download" style={{ fontSize: "50px", background: "linear-gradient(135deg,#110EFD,#3538CD)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}></i>
                  <div className="!absolute !top-[18px] !right-[18px] !flex !items-center !justify-center !rounded-full !border-[2px] !border-white" style={{ width: "40px", height: "40px", background: "linear-gradient(135deg,#04BD6C,#00A86B)", boxShadow: "0 4px 12px rgba(4,189,108,0.4)" }}>
                    <i className="isax isax-tick-circle" style={{ fontSize: "22px", color: "#fff" }}></i>
                  </div>
                </div>
                <h5 className="!mb-1 !text-[18px] !font-semibold !text-[#1a1a1a]">Fast &amp; Accurate Results</h5>
                <p className="!m-0 !text-[12px] !text-[#666] !leading-[1.6]">Get reports in 12-24 hrs. View and download from the app anytime</p>
              </div>

            </div>
          </div>
        </div>
      </section>


      {/* Short banners */}
      {middleBanners?.length > 0 && (
        <section
          className="section welcome-section px-3 mt-3 offers-section"
          style={{ backgroundColor: "#ffffff" }}
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
      )}

      <section className="!py-8 !bg-white !relative !overflow-hidden">
        {/* Decorative blobs */}
        <div className="!absolute !top-[-100px] !right-[-100px] !w-[300px] !h-[300px] !rounded-full !pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(125,46,255,0.05), rgba(17,14,253,0.05))" }}></div>
        <div className="!absolute !bottom-[-80px] !left-[-80px] !w-[250px] !h-[250px] !rounded-full !pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(4,189,108,0.05), rgba(255,202,24,0.05))" }}></div>

        <div className="!relative !z-10 !max-w-7xl !mx-auto !px-4">
          {/* Heading */}
          <div className="!text-center !mb-8">
            <h2 className="!m-0 !text-[30px] !font-semibold !text-[#1a1a1a] !leading-snug">Best Practices We Offer</h2>
          </div>

          {/* Cards Grid */}
          <div className="!grid !grid-cols-2 md:!grid-cols-3 lg:!grid-cols-5 !gap-4">

            {/* Card 1 – 100% Safe & Secure */}
            <div className="!group !flex !flex-col !items-center !text-center !p-6 !bg-white !rounded-[16px] !border !border-[#e9ecef] !shadow-[0_2px_8px_rgba(0,0,0,0.05)] !cursor-pointer !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_8px_20px_rgba(125,46,255,0.15)] hover:!border-[#321961]">
              <div className="!w-[90px] !h-[90px] !mb-4 !flex !items-center !justify-center !bg-white !rounded-full !border-[2px] !border-[#110EFD] !shadow-[0_2px_8px_rgba(17,14,253,0.15)] !relative !shrink-0">
                <div className="!relative !w-[60px] !h-[60px]">
                  <i className="fa-solid fa-shield-halved" style={{ fontSize: "48px", color: "#110EFD", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}></i>
                  <i className="fa-solid fa-heart-pulse" style={{ fontSize: "26px", color: "#04BD6C", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", zIndex: 1 }}></i>
                </div>
              </div>
              <h5 className="!m-0 !mb-2 !text-[15px] !font-semibold !text-[#1a1a1a]">100% Safe &amp; Secure</h5>
              <p className="!m-0 !text-[11px] !text-[#666] !leading-[1.5]">We take all safety and hygiene measures to keep our customers safe</p>
            </div>

            {/* Card 2 – Online Reports */}
            <div className="!group !flex !flex-col !items-center !text-center !p-6 !bg-white !rounded-[16px] !border !border-[#e9ecef] !shadow-[0_2px_8px_rgba(0,0,0,0.05)] !cursor-pointer !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_8px_20px_rgba(17,14,253,0.15)] hover:!border-[#110EFD]">
              <div className="!w-[90px] !h-[90px] !mb-4 !flex !items-center !justify-center !bg-white !rounded-full !border-[2px] !border-[#110EFD] !shadow-[0_2px_8px_rgba(17,14,253,0.15)] !relative !shrink-0">
                <div className="!relative !w-[60px] !h-[60px]">
                  <i className="fa-solid fa-file-lines" style={{ fontSize: "48px", color: "#110EFD", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}></i>
                  <div style={{ position: "absolute", top: "2px", right: "2px", width: "18px", height: "18px", background: "#04BD6C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", zIndex: 2 }}>
                    <i className="fa-solid fa-heart-pulse" style={{ fontSize: "10px", color: "#fff" }}></i>
                  </div>
                  <div style={{ position: "absolute", bottom: "2px", right: "2px", width: "16px", height: "16px", background: "#110EFD", borderRadius: "4px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", zIndex: 2 }}>
                    <i className="fa-solid fa-certificate" style={{ fontSize: "9px", color: "#fff" }}></i>
                  </div>
                </div>
              </div>
              <h5 className="!m-0 !mb-2 !text-[15px] !font-semibold !text-[#1a1a1a]">Online Reports</h5>
              <p className="!m-0 !text-[11px] !text-[#666] !leading-[1.5]">You can download your reports online</p>
            </div>

            {/* Card 3 – Home Sample Collection */}
            <div className="!group !flex !flex-col !items-center !text-center !p-6 !bg-white !rounded-[16px] !border !border-[#e9ecef] !shadow-[0_2px_8px_rgba(0,0,0,0.05)] !cursor-pointer !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_8px_20px_rgba(4,189,108,0.15)] hover:!border-[#04BD6C]">
              <div className="!w-[90px] !h-[90px] !mb-4 !flex !items-center !justify-center !bg-white !rounded-full !border-[2px] !border-[#04BD6C] !shadow-[0_2px_8px_rgba(4,189,108,0.15)] !relative !shrink-0">
                <div className="!relative !w-[60px] !h-[60px]">
                  <i className="fa-solid fa-house" style={{ fontSize: "48px", color: "#04BD6C", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}></i>
                  <div style={{ position: "absolute", bottom: "-2px", left: "50%", transform: "translateX(-50%)", width: "24px", height: "24px", background: "#04BD6C", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "2px solid #fff", zIndex: 2 }}>
                    <i className="fa-solid fa-briefcase-medical" style={{ fontSize: "12px", color: "#fff" }}></i>
                  </div>
                </div>
              </div>
              <h5 className="!m-0 !mb-2 !text-[15px] !font-semibold !text-[#1a1a1a]">Home Sample Collection</h5>
              <p className="!m-0 !text-[11px] !text-[#666] !leading-[1.5]">Our expert phlebotomists will come and collect your sample</p>
            </div>

            {/* Card 4 – MediCompares Advantage */}
            <div className="!group !flex !flex-col !items-center !text-center !p-6 !bg-white !rounded-[16px] !border !border-[#e9ecef] !shadow-[0_2px_8px_rgba(0,0,0,0.05)] !cursor-pointer !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_8px_20px_rgba(255,202,24,0.2)] hover:!border-[#FFCA18]">
              <div className="!w-[90px] !h-[90px] !mb-4 !flex !items-center !justify-center !bg-white !rounded-full !border-[2px] !border-[#FFCA18] !shadow-[0_2px_8px_rgba(255,202,24,0.2)] !relative !shrink-0">
                <div className="!relative !w-[60px] !h-[60px]">
                  <div style={{ width: "52px", height: "52px", background: "#FFCA18", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 2px 8px rgba(255,202,24,0.3)" }}>
                    <i className="fa-solid fa-star" style={{ fontSize: "28px", color: "#fff" }}></i>
                  </div>
                  <div style={{ position: "absolute", top: "-5px", left: "-5px", width: "70px", height: "70px", border: "2px solid #FFCA18", borderRadius: "50%", opacity: 0.35 }}></div>
                </div>
              </div>
              <h5 className="!m-0 !mb-2 !text-[15px] !font-semibold !text-[#1a1a1a]">MediCompares Advantage</h5>
              <p className="!m-0 !text-[11px] !text-[#666] !leading-[1.5]">Enjoy upto 75% discount on diagnostic tests and health packages</p>
            </div>

            {/* Card 5 – Competitive Prices */}
            <div className="!group !col-span-2 md:!col-span-1 !flex !flex-col !items-center !text-center !p-6 !bg-white !rounded-[16px] !border !border-[#e9ecef] !shadow-[0_2px_8px_rgba(0,0,0,0.05)] !cursor-pointer !transition-all !duration-300 hover:!-translate-y-[5px] hover:!shadow-[0_8px_20px_rgba(125,46,255,0.15)] hover:!border-[#321961]">
              <div className="!w-[90px] !h-[90px] !mb-4 !flex !items-center !justify-center !bg-white !rounded-full !border-[2px] !border-[#321961] !shadow-[0_2px_8px_rgba(125,46,255,0.15)] !relative !shrink-0">
                <div className="!relative !w-[60px] !h-[60px]">
                  <div style={{ width: "52px", height: "52px", background: "#321961", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", boxShadow: "0 2px 8px rgba(125,46,255,0.3)" }}>
                    <span style={{ fontSize: "26px", fontWeight: "700", color: "#fff" }}>%</span>
                  </div>
                  <div style={{ position: "absolute", top: "-5px", left: "-5px", width: "70px", height: "70px", border: "2px solid #321961", borderRadius: "50%", opacity: 0.35 }}></div>
                </div>
              </div>
              <h5 className="!m-0 !mb-2 !text-[15px] !font-semibold !text-[#1a1a1a]">Competitive Prices</h5>
              <p className="!m-0 !text-[11px] !text-[#666] !leading-[1.5]">We offer best prices on our diagnostic tests and health packages</p>
            </div>

          </div>
        </div>
      </section>
      {/* comparsiion BAR */}
      {packages &&
        packages.length > 0 &&
        compareItems &&
        compareItems.length > 0 && (
          <div className="compare-bar">
            <div
              className="compare-bar-content"
              onClick={() => {
                if (!compareItems || compareItems.length < 2) {
                  toast.error("Select at least 2 packages to compare");
                } else {
                  handleCompareBar();
                }
              }}
            >
              <span className="compare-label">Compare :-</span>
              <div className="compare-items">
                {compareItems.map((itemId, index) => {
                  const pkg = packages.find((p) => p._id === itemId);
                  return (
                    <div key={index} className="compare-item">
                      <span className="item-name">
                        {pkg?.name || `Item ${index + 1}`}
                      </span>
                      {compareItems && index < compareItems.length - 1 && (
                        <span className="item-comma">,</span>
                      )}
                    </div>
                  );
                })}
                <span className="item-count">
                  Total ({compareItems?.length || 0})
                </span>
              </div>
            </div>

            <button onClick={clearAllCompare} className="compare-clear-btn">
              ×
            </button>
          </div>
        )}

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
          setCurrentLeadData(null);
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
        fixedType="diagnostics"
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
          userProfile={userProfile}
          formType="rentals"
          fixedType="diagnostics"
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
          });
        }}
        formData={consultationFormData}
        onFormChange={handleConsultationFormChange}
        onSubmit={handleConsultationSubmit}
        fixedType="diagnostics"
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
            med: null,
            vendor: null,
          });
        }}
        formData={appointmentFormData}
        onFormChange={handleAppointmentFormChange}
        onSubmit={handleAppointmentSubmit}
        formType="appointment"
        fixedType="diagnostics"
        productId={
          appointmentFormData?.med?._id || appointmentFormData?.med?.id || null
        }
        vendorId={
          appointmentFormData?.vendor?.vendorId ||
          appointmentFormData?.vendor?._id ||
          null
        }
        variantId={null}
      />
    </>
  );
};

export default diagnostics;
