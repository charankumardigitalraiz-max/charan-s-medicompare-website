import React, { useState, useEffect } from "react";
import { SectionHeader } from "../../../components/ui/index.js";
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
          className="py-4 mx-2 bg-cover bg-center bg-no-repeat rounded-[16px]"
          style={{
            backgroundImage: "url('/assets/Medicompares%20Background.png')",
          }}
        >
          <div className="container-fluid px-3">
            <div className="!flex !items-center !justify-center !flex-wrap gap-3 !mb-4 !relative">
              <div className="!mb-2 !flex !flex-col !items-center !text-center !gap-1">
                <div className="!flex !items-center !justify-center !gap-2 !flex-wrap">
                  <span
                    className="!inline-flex !items-center !gap-[7px] bg-gradient-to-br from-[#6a0dad] to-[#9b59b6] !text-white !rounded-[30px] !py-[5px] !pr-[16px] !pl-[10px] !text-[12px] !font-semibold !tracking-[0.5px] !uppercase !shadow-[0_2px_10px_rgba(106,13,173,0.25)]"
                  >
                    <i className="fas fa-bolt !text-[11px]"></i>
                    Health Packages
                  </span>
                </div>
                <span
                  className="!text-[14px] !text-[#475569] !font-medium !mt-[6px] !block !tracking-[0.2px] !leading-[1.4] !max-w-[500px] !opacity-90"
                >
                  Compare all health packages side-by-side to choose the best option
                </span>
              </div>

              <div
                className={`!flex !items-center !justify-center !gap-3 !mb-2 ${isMobile
                  ? "!static !w-full"
                  : "!absolute !right-[15px] !top-1/2 !-translate-y-1/2 !w-auto"
                  }`}
              >
                <Link
                  to="/view-all-packages"
                  className={`inline-flex items-center justify-center !font-semibold !text-[12px] !text-[#321961] hover:!bg-[#321961] hover:!text-white transition-all duration-300 !rounded-[50px] !w-auto !h-auto bg-gradient-to-br from-[rgba(125,46,255,0.1)] to-[rgba(59,130,246,0.1)] ${isMobile ? "!py-[6px] !px-[18px]" : "!py-[8px] !px-[20px]"
                    }`}
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
                className={`!relative !mx-auto !my-[16px] !bg-[#321961] !rounded-[12px] !shadow-[0_6px_20px_rgba(128,89,202,0.3)] !z-10 !mb-4 ${isMobile
                  ? "!w-[95%] !py-[12px] !pr-[48px] !pl-[16px]"
                  : "!w-[80%] !py-[10px] !px-[15px]"
                  }`}
              >
                <div
                  className="!cursor-pointer !text-white !flex !items-center !justify-between !w-full"
                  onClick={() => {
                    if (compareItems.length < 2) {
                      toast.error("Select at least 2 packages to compare");
                    } else {
                      handleCompareBar();
                    }
                  }}
                >
                  <div className="!flex !items-center !gap-[10px] !w-full">
                    <span
                      className={`!text-white !font-extrabold !tracking-[0.5px] !uppercase ${isMobile ? "!text-[12px]" : "!text-[14px]"
                        }`}
                    >
                      Compare
                    </span>
                    <div className="!flex !items-center !gap-[6px] !flex-wrap">
                      <div className="!flex !flex-wrap !items-center !gap-[4px]">
                        {compareItems.map((itemId, index) => {
                          const pkg = packages.find((p) => p._id === itemId);
                          return (
                            <div key={index} className="!inline-flex !items-center">
                              <span
                                className={`!text-white !font-medium ${isMobile ? "!text-[11px]" : "!text-[13px]"
                                  }`}
                              >
                                {pkg?.name || `Item ${index + 1}`}
                              </span>
                              {index < compareItems.length - 1 && (
                                <span className="!text-white/70 !mx-[2px]">
                                  ,
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <span
                        className="!text-white !font-bold !text-[12px] !bg-white/20 !py-[2px] !px-[8px] !rounded-[20px] !ml-[6px] !whiteSpace-nowrap"
                      >
                        Total ({compareItems.length})
                      </span>
                      {!isMobile && (
                        <div className="!ml-5 !hidden lg:!flex !items-center !gap-[5px]">
                          <span className="!text-white !text-[13px] !font-medium">
                            View More
                          </span>
                          <i
                            className="fas fa-arrow-right !text-white !text-[12px]"
                            style={{
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
                  className="!absolute !right-[12px] !top-1/2 !-translate-y-1/2 !bg-white/20 !border-none !text-white !text-[18px] !w-[28px] !h-[28px] !rounded-full !cursor-pointer !flex !items-center !justify-center"
                >
                  ×
                </button>
              </div>
            )}

            <div className="!flex !flex-wrap !relative">
              {packages.length > 1 && (
                <button
                  className="meq-arrow-btn packages-prev !absolute !left-[-10px] !top-1/2 !-translate-y-1/2 !z-10"
                  aria-label="Previous"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <div className="!px-[20px] w-full">
                <Swiper {...swiperSettings}>
                  {packages.map((pkg, index) => {
                    return (
                      <SwiperSlide key={pkg._id || index}>
                        <div
                          className="!px-2 !pb-2 !h-full !flex !flex-col !cursor-pointer"
                          onClick={() => {
                            navigate(`/lab-package/${pkg._id}`);
                          }}
                        >
                          <div
                            className="!border-0 !rounded-[10px] !bg-white !shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 !flex !flex-col !h-full"
                          >
                            <div
                              className="!relative !w-full !pt-[50%] !overflow-hidden !bg-[#f8f9fa] !rounded-t-[10px] !flex !items-center !justify-center"
                            >
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const isChecked = !compareItems.includes(pkg._id);
                                  handleCompareToggle(pkg, isChecked);
                                }}
                                className={`!absolute !top-[10px] !right-[10px] !rounded-[30px] !py-[3px] !px-[14px] !flex !items-center !gap-[6px] !z-10 !border-[1.5px] !border-solid !border-white !cursor-pointer transition-all duration-300 ${!compareItems.includes(pkg._id) ? "pulse-compare-btn" : ""
                                  } ${compareItems.includes(pkg._id)
                                    ? "bg-gradient-to-br from-[#10b981] to-[#059669] !shadow-[0_4px_12px_rgba(16, 185, 129, 0.3)] !scale-[1.05]"
                                    : "bg-gradient-to-br from-[#f59e0b] to-[#d97706] !shadow-[0_4px_12px_rgba(245, 158, 11, 0.4)] !scale-100"
                                  }`}
                                title="Compare Package"
                              >
                                <i
                                  className={`fa-solid ${compareItems.includes(pkg._id) ? "fa-circle-check" : "fa-hand-pointer"
                                    } !text-[13px] !text-white !inline-block ${!compareItems.includes(pkg._id) ? "!rotate-90" : ""
                                    }`}
                                ></i>
                                <span
                                  className="!text-[11px] !font-extrabold !text-white !uppercase !tracking-[0.6px]"
                                >
                                  {compareItems.includes(pkg._id) ? "Compared" : "Compare"}
                                </span>
                              </div>
                              {pkg?.files?.[0] ? (
                                <img
                                  src={getImageUrl(pkg.files[0])}
                                  alt={pkg.name}
                                  onError={(e) => {
                                    e.target.src = "/assets/default.png";
                                  }}
                                  className="!absolute !top-0 !left-0 !w-full !h-full !object-contain"
                                />
                              ) : (
                                <div
                                  className="!absolute !top-0 !left-0 !w-full !h-full !flex !flex-col !items-center !justify-center bg-gradient-to-br from-[#F8F5FE] to-[#F2EDFE]"
                                >
                                  <div
                                    className="!w-[70px] !h-[70px] !border-2 !border-solid !border-[#321961] !rounded-[10px] !flex !flex-col !items-center !justify-center !bg-white !p-[12px]"
                                  >
                                    <i
                                      className="isax isax-health !text-[35px] !text-[#321961]"
                                    ></i>
                                    <span
                                      className="!text-[9px] !text-[#321961] !font-semibold !mt-[6px] !tracking-[0.5px]"
                                    >
                                      PACKAGE
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div
                              className="!p-[8px_10px] !flex !flex-col !grow"
                            >
                              <h6
                                className="!mb-1 !text-dark !text-[14px] !font-semibold !leading-[1.2] !capitalize"
                              >
                                {pkg.name}
                              </h6>
                              {/* Profiles, Tests, and Parameters Details */}
                              <div
                                className="!flex !gap-1 !mb-1 !flex-nowrap !overflow-hidden"
                              >
                                <div
                                  className="!flex !items-center !gap-1 !shrink-0 !bg-[#F8F5FE] !py-[3px] !px-[6px] !rounded-[5px] !border !border-solid !border-[#321961]/20"
                                >
                                  <i
                                    className="isax isax-profile-2user !text-[12px] !text-[#321961]"
                                  ></i>
                                  <span
                                    className="!text-[10px] !text-[#333] !font-semibold !whiteSpace-nowrap"
                                  >
                                    {pkg.subcategories?.length || 0} Profiles
                                  </span>
                                </div>
                                <div
                                  className="!flex !items-center !gap-1 !shrink-0 !bg-[#EAF3FF] !py-[3px] !px-[6px] !rounded-[5px] !border !border-solid !border-[#110efd]/20"
                                >
                                  <i
                                    className="isax isax-test-tube !text-[12px] !text-[#110EFD]"
                                  ></i>
                                  <span
                                    className="!text-[10px] !text-[#333] !font-semibold !whiteSpace-nowrap"
                                  >
                                    {pkg.products?.length || 0} Tests
                                  </span>
                                </div>
                                <div
                                  className="!flex !items-center !gap-1 !shrink-0 !bg-[#F1FAF3] !py-[3px] !px-[6px] !rounded-[5px] !border !border-solid !border-[#04bd6c]/20"
                                >
                                  <i
                                    className="isax isax-chart !text-[12px] !text-[#04BD6C]"
                                  ></i>
                                  <span
                                    className="!text-[10px] !text-[#333] !font-semibold !whiteSpace-nowrap"
                                  >
                                    {pkg.parameterss?.length || 0} Parameters
                                  </span>
                                </div>
                              </div>

                              <div
                                className="!text-[11px] !text-[#666] !mt-[4px]"
                              >
                                <i className="fa-regular fa-file-lines me-1" />{" "}
                                Reports in
                                <strong
                                  className="!text-[#333] !ml-[2px]"
                                >
                                  {pkg?.tablets?.[0]?.reportsDuration || "N/A"}
                                </strong>
                              </div>

                              {/* Pricing */}
                              <div className="!mb-1">
                                <div className="!flex !flex-row !items-center !gap-2 !mb-1">
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
                                          className="!text-[16px] !font-bold !text-[#1a1a1a]"
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
                                                className="!text-[#999] !line-through !text-[12px]"
                                              >
                                                ₹{itemPrice}
                                              </span>
                                              {discount > 0 && (
                                                <span
                                                  className="!bg-[#F97316] !text-white !text-[12px] !py-[2px] !px-[6px] !rounded-[4px] !inline-block"
                                                >
                                                  {discount}% off
                                                </span>
                                              )}
                                            </>
                                          )}
                                      </>
                                    );
                                  })()}
                                </div>
                              </div>
                              <div className="!flex !w-full !justify-center !mb-2 !mt-auto">


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
                              </div>

                              {/* Vendor Details */}
                              {pkg?.vendor && (
                                <div
                                  className="!mt-[6px] !pt-[6px] !border-t !border-solid !border-black/10"
                                >
                                  <div
                                    className="!flex !items-center !gap-2 !pt-[6px] !pb-0 !px-0 !cursor-pointer transition-all duration-200 hover:!opacity-80 hover:!translate-x-1"
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
                                  >
                                    <div
                                      className="!w-[36px] !h-[36px] !rounded-[8px] !overflow-hidden !shrink-0 !bg-white"
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
                                        className="!w-full !h-full !object-contain"
                                        onError={(e) => {
                                          e.target.src = "/assets/default.png";
                                        }}
                                      />
                                    </div>
                                    <div
                                      className="!grow !min-w-0"
                                    >
                                      <div className="!flex !items-center !justify-between !w-full !gap-2 !mb-[2px]">
                                        <h6
                                          className="!mb-0 !text-dark !text-[11.5px] !font-semibold !m-0 !overflow-hidden !text-ellipsis !whiteSpace-nowrap"
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
                                            className="!flex !items-center !gap-[4px] !text-[10px] !text-[#666] !shrink-0"
                                          >
                                            <i
                                              className="fas fa-star !text-[#ffc107] !text-[9px]"
                                            ></i>
                                            <span className="!font-medium">
                                              {pkg.vendor.averageRating.toFixed(1)}
                                            </span>
                                            <span className="!text-[#999]">
                                              ({pkg.vendor.ratingCount}+)
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {pkg?.vendor?.businessDetails
                                        ?.address && (
                                          <div
                                            className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !overflow-hidden"
                                            title={
                                              pkg?.vendor?.businessDetails
                                                ?.address
                                            }
                                          >
                                            <i
                                              className="isax isax-location !text-[12px] !text-[#321961]"
                                            ></i>
                                            <span
                                              className="!text-dark !overflow-hidden !text-ellipsis !whitespace-nowrap"
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
                                          className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !overflow-hidden"
                                          title={pkg?.vendor?.distanceInKm}
                                        >
                                          <i
                                            className="fas fa-map-marker-alt !text-[#321961] !text-[10px] !mr-[4px]"
                                          ></i>
                                          <span
                                            className="!text-dark !overflow-hidden !text-ellipsis !whiteSpace-nowrap"
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
                  className="meq-arrow-btn packages-next !absolute !right-[-10px] !top-1/2 !-translate-y-1/2 !z-10"
                  aria-label="Next"
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

      {/* {cheaplabtests && cheaplabtests.length > 0 && (
        <div
          className="content doctor-content !py-4 !mx-4 !bg-cover !bg-center !bg-no-repeat !rounded-[16px]"
          style={{
            backgroundImage: "url('/assets/Medicompares%20Background.png')",
          }}
        >
          <div className="container-fluid px-3">
            <SectionHeader
              title="Top CheckUp's"
              icon="fas fa-bolt"
              viewAllLink={`/${currentService}/all`}
              viewAllText="View All"
              isMobile={isMobile}
            />

            <div className="!flex !flex-wrap !relative">
              {cheaplabtests.length > 1 && (
                <button
                  className="meq-arrow-btn dental-prev !absolute !left-[-10px] !top-1/2 !-translate-y-1/2 !z-10"
                  aria-label="Previous"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <div className="!px-[20px] w-full">
                <Swiper {...swiperSettings1}>
                  {cheaplabtests.map((test) => {
                    const vendor = test.businessDetails;
                    const medicine = test.medicineDetails;
                    return (
                      <SwiperSlide key={test._id}>
                        <div
                          className="!px-2 !mb-2 !h-full !flex !flex-col !cursor-pointer"
                          onClick={() => handleTestClick(test)}
                        >
                          <div
                            className="!border !border-solid !border-gray-200 !rounded-[8px] !flex !flex-col !h-full !bg-white !shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
                          >
                            <div className="!relative !w-full !pt-[50%] !overflow-hidden !bg-[#f8f9fa] !rounded-t-[8px] !flex !items-center !justify-center">
                              <img
                                src={
                                  medicine?.files?.[0]
                                    ? getImageUrl(medicine.files[0])
                                    : "/assets/default.png"
                                }
                                alt={medicine.name}
                                className="!absolute !top-0 !left-0 !w-full !h-full !object-contain"
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
                                className="!absolute !top-[10px] !right-[10px] bg-gradient-to-br from-[#f59e0b] to-[#d97706] !rounded-[30px] !py-[3px] !px-[14px] !flex !items-center !gap-[6px] !shadow-[0_4px_12px_rgba(245, 158, 11, 0.4)] !z-10 !border-[1.5px] !border-solid !border-white !cursor-pointer transition-all duration-300 hover:!scale-[1.12] hover:!-translate-y-[2px] hover:!shadow-[0_8px_20px_rgba(245, 158, 11, 0.55)]"
                                title="Compare Package"
                              >
                                <i
                                  className="fa-solid fa-hand-pointer !text-[13px] !text-white !rotate-90 !inline-block"
                                ></i>
                                <span
                                  className="!text-[11px] !font-extrabold !text-white !uppercase !tracking-[0.6px]"
                                >
                                  Compare
                                </span>
                              </div>
                            </div>
                            <div
                              className="!p-[8px_10px] !flex !flex-col !grow"
                            >
                              <div className="!flex !items-center !justify-between !w-full !gap-2 !mb-1">
                                <h6
                                  className="!mb-0 !text-dark !text-[14px] !font-semibold !leading-[1.2] !capitalize !overflow-hidden !text-ellipsis !whiteSpace-nowrap"
                                >
                                  {medicine?.name?.length > 25
                                    ? medicine.name.slice(0, 25) + "..."
                                    : medicine?.name}
                                </h6>

                                <div
                                  className="!flex !items-center !justify-end !shrink-0 !text-[11px]"
                                >
                                  <i
                                    className="fa fa-star text-warning !text-[11px] !mr-1"
                                  ></i>
                                  <span
                                    className="!mr-1 !font-semibold"
                                  >
                                    {medicine?.averageRating.toFixed(1) > 0
                                      ? medicine.averageRating.toFixed(1)
                                      : 0}
                                  </span>

                                  <i
                                    className="fa fa-users !text-primary !text-[11px] !mr-1"
                                  ></i>
                                  <span className="!text-[#666]">
                                    (
                                    {medicine?.ratingCount > 0
                                      ? `${medicine.ratingCount}+`
                                      : 0}
                                    )
                                  </span>
                                </div>
                              </div>

                              <div className="!mt-2">
                                <div
                                  className="!flex !items-center !justify-center !gap-1 !flex-nowrap !overflow-hidden"
                                >
                                  <div
                                    className="!flex !items-center !gap-1 !shrink-0 !bg-[#F1FAF3] !py-[3px] !px-[7px] !rounded-[5px] !border !border-solid !border-[#04bd6c]/20"
                                  >
                                    <i
                                      className="isax isax-chart !text-[#04BD6C] !text-[11px]"
                                    ></i>
                                    <span
                                      className="!text-[10px] !text-[#333] !font-semibold !whiteSpace-nowrap"
                                    >
                                      {medicine?.parameters?.length || 0}{" "}
                                      Parameters
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div
                                className="!text-[11px] !my-[4px] !text-[#666]"
                              >
                                <i
                                  className="fa-regular fa-file-lines !text-[#321961] !text-[10.5px] !mr-1"
                                />{" "}
                                Reports in
                                <strong
                                  className="!text-[#333] !ml-[2px]"
                                >
                                  {" "}
                                  {medicine?.reportsDuration}
                                </strong>
                              </div>

                              <div className="!flex !flex-row !items-center !gap-2 !pb-2">
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

                              <div className="!mt-auto !mb-[8px]">
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
                                  className="!border-t !border-solid !border-black/10 !mt-1"
                                >
                                  <div
                                    className="!flex !items-center !gap-2 !pt-[8px] !pb-0 !px-0 !cursor-pointer transition-all duration-200 hover:!opacity-80 hover:!translate-x-1"
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
                                  >
                                    <div
                                      className="!w-[36px] !h-[36px] !rounded-[8px] !overflow-hidden !border !border-solid !border-[#f0f0f0] !bg-white !shrink-0 !p-[3px] !shadow-[0_2px_4px_rgba(0,0,0,0.02)]"
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
                                        className="!w-full !h-full !object-contain"
                                      />
                                    </div>

                                    <div
                                      className="!grow !min-w-0"
                                    >
                                      <div className="!flex !items-center !justify-between !w-full !gap-2 !mb-[2px]">
                                        <h6
                                          className="!mb-0 !text-[12px] !font-semibold !tracking-[-0.2px] !whiteSpace-nowrap !overflow-hidden !text-ellipsis"
                                        >
                                          {vendor.name}
                                        </h6>
                                        {test?.averageRating > 0 && test?.ratingCount > 0 && (
                                          <div
                                            className="!flex !items-center !gap-[4px] !text-[10px] !text-[#666] !shrink-0"
                                          >
                                            <i
                                              className="fas fa-star !text-[#ffc107] !text-[9px]"
                                            ></i>
                                            <span className="!font-medium">
                                              {test.averageRating.toFixed(1)}
                                            </span>
                                            <span className="!text-[#999]">
                                              ({test.ratingCount}+)
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      <div
                                        className="!flex !items-center !gap-1 !text-[#6b7280] !text-[11px] !overflow-hidden"
                                      >
                                        <i
                                          className="fa-solid fa-location-dot !text-[11px] !text-[#321961]"
                                        ></i>
                                        <span
                                          className="!overflow-hidden !text-ellipsis !whitespace-nowrap"
                                        >
                                          {vendor.address}
                                        </span>
                                      </div>
                                      <div
                                        className="!flex !items-center !gap-1 !text-[#6b7280] !text-[11px] !overflow-hidden"
                                      >
                                        <i
                                          className="fas fa-map-marker-alt !text-[10px] !text-[#321961] !mr-[4px]"
                                        ></i>

                                        <span
                                          className="!overflow-hidden !text-ellipsis !whitespace-nowrap"
                                        >
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
                  className="meq-arrow-btn dental-next !absolute !right-[-10px] !top-1/2 !-translate-y-1/2 !z-10"
                  aria-label="Next"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )} */}


      <section
        className="!relative !overflow-hidden !bg-cover !bg-center !bg-no-repeat"
      >
        <div className="container-fluid !px-4 md:!px-6 lg:!px-8 !py-4 lg:!py-10">
          <div className="!text-center !rounded-[20px] !p-[10px_12px_12px] !mt-[10px]">
            <div className="!inline-flex !items-center !gap-2 !mb-[12px] !mx-auto !px-4 !py-[6px] !rounded-full !bg-[rgba(128,89,202,0.12)] !text-[#321961] !text-[12px] !font-semibold !tracking-wide !border !border-[rgba(128,89,202,0.25)]">
              <i className="fa-solid fa-hand-pointer" />
              How to Book a Lab Test
            </div>
            <h2
              className="!text-[26px] !font-semibold !text-[#1a1a1a] !mb-[8px] !leading-[1.2]"
            >
              Three Easy Steps to Get Checked
            </h2>
            <p
              className="sectionse-subtitle !text-[14px] !text-[#666] !mx-auto !my-0 !mb-[12px] !max-w-[700px]"
            >
              Simple steps to get your health checkup done with certified
              professionals and accurate results
            </p>
            {isMobile ? (
              <div className="!px-[10px]">
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
                        className="!text-center !w-full !relative !p-[32px_16px_24px] !bg-white !rounded-[16px] !border !border-solid !border-[#e2e8f0] !shadow-[0_4px_12px_rgba(128, 89, 202, 0.02)] !flex !flex-col !items-center !h-full"
                      >
                        <span
                          className="!absolute !top-[16px] !right-[16px] !bg-[rgba(128,89,202,0.08)] !text-[#321961] !py-[4px] !px-[10px] !rounded-[20px] !text-[11px] !font-bold !tracking-[0.05em]"
                        >
                          {item.step}
                        </span>
                        <div
                          className="!w-[60px] !h-[60px] !mx-auto !mb-[20px] !flex !items-center !justify-center !bg-[rgba(128,89,202,0.06)] !rounded-[16px]"
                        >
                          <i className={item.icon} style={{ fontSize: "26px", color: "#321961" }} />
                        </div>
                        <h5
                          className="!text-[16px] !font-semibold !text-[#1c1e21] !mb-[10px] !tracking-[-0.01em]"
                        >
                          {item.title}
                        </h5>
                        <p
                          className="!text-[12.5px] !text-[#5c626a] !m-0 !leading-[1.6]"
                        >
                          {item.desc}
                        </p>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            ) : (
              <div className="!grid !grid-cols-1 md:!grid-cols-3 !gap-4 !items-stretch">
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
                  <div key={index} className="w-full">
                    <div
                      className="!text-center !h-full !relative !p-[32px_20px_24px] !bg-white !rounded-[16px] !border !border-solid !border-[#e2e8f0] !shadow-[0_4px_12px_rgba(128, 89, 202, 0.02)] transition-all duration-300 ease-out !cursor-pointer hover:!-translate-y-[6px] hover:!shadow-[0_12px_24px_rgba(128, 89, 202, 0.08)] hover:!border-[#321961]"
                    >
                      <span
                        className="!absolute !top-[16px] !right-[16px] !bg-[rgba(128,89,202,0.08)] !text-[#321961] !py-[4px] !px-[10px] !rounded-[20px] !text-[11px] !font-bold !tracking-[0.05em]"
                      >
                        {item.step}
                      </span>
                      <div
                        className="!w-[60px] !h-[60px] !mx-auto !mb-[20px] !flex !items-center !justify-center !bg-[rgba(128,89,202,0.06)] !rounded-[16px] transition-all duration-300"
                      >
                        <i className={item.icon} style={{ fontSize: "26px", color: "#321961" }} />
                      </div>
                      <h5
                        className="!text-[18px] !font-semibold !text-[#1c1e21] !mb-[10px] !tracking-[-0.01em]"
                      >
                        {item.title}
                      </h5>
                      <p
                        className="!text-[14px] !text-[#5c626a] !m-0 !leading-[1.6]"
                      >
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* why choose  */}
      <section
        className="!bg-[#E8E4F5] bg-cover bg-center bg-no-repeat !py-[40px] !px-0 !relative !overflow-hidden"
        style={{
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
        }}
      >
        <div
          className="container-fluid !px-4 md:!px-6 lg:!px-8 !relative !z-[1]"
        >
          <div className="text-center mb-4">
            <div
              className="section-badgese !mb-[12px] !mx-auto"
            >
              <i className="fa-solid fa-circle-info" />
              Why Choose Us
            </div>
            <h2
              className="!text-[26px] !font-semibold !text-[#0f172a] !mb-[8px] !leading-[1.2]"
            >
              Your Trusted Healthcare Partner
            </h2>
            <p
              className="!text-[14px] !text-[#64748b] !max-w-[700px] !mx-auto !my-0 !leading-[1.5]"
            >
              We are committed to providing you with accurate, reliable lab test
              results from NABL accredited laboratories with the convenience of
              home sample collection.
            </p>
          </div>
          {isMobile ? (
            <div className="!px-[10px]">
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
                      className="!bg-white !rounded-[16px] !p-[24px_16px] !h-full !border !border-solid !border-[#321961]/12 !flex !flex-col !shadow-[0_4px_15px_rgba(128, 89, 202, 0.03)] !w-full"
                    >
                      <div
                        className="!w-[48px] !h-[48px] !rounded-full !bg-[#f3effa] !flex !items-center !justify-center !mb-[16px] !text-[#321961] !text-[20px]"
                      >
                        <i className={feature.icon}></i>
                      </div>

                      <h4
                        className="!text-[15px] !font-semibold !text-[#1a1a1a] !mb-[10px] !leading-[1.4]"
                      >
                        {feature.title}
                      </h4>

                      <p
                        className="!text-[12.5px] !text-[#666] !leading-[1.6] !m-0"
                      >
                        {feature.description}
                      </p>
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          ) : (
            <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-3 !gap-4">
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
                  className="w-full"
                  data-aos="fade-up"
                  data-aos-delay={index * 100}
                >
                  <div
                    className="!bg-white !rounded-[16px] !p-[24px] !h-full !border !border-solid !border-[#321961]/12 transition-all duration-300 ease-out !cursor-pointer !flex !flex-col !shadow-[0_4px_15px_rgba(128,89,202,0.03)] hover:!-translate-y-[6px] hover:!shadow-[0_10px_25px_rgba(128,89,202,0.08)] hover:!border-[#321961]"
                  >
                    <div
                      className="!w-[48px] !h-[48px] !rounded-full !bg-[#f3effa] !flex !items-center !justify-center !mb-[16px] !text-[#321961] !text-[20px]"
                    >
                      <i className={feature.icon}></i>
                    </div>

                    <h4
                      className="!text-[16px] !font-semibold !text-[#1a1a1a] !mb-[10px] !leading-[1.4]"
                    >
                      {feature.title}
                    </h4>

                    <p
                      className="!text-[13.5px] !text-[#666] !leading-[1.6] !m-0"
                    >
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section
        className="!py-4 !relative !overflow-hidden !bg-cover !bg-center !bg-no-repeat"
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
          className="container-fluid !px-4 md:!px-6 lg:!px-8 !relative !z-[1]"
        >
          <div className="text-center mb-4">
            <h2
              className="!text-[26px] !font-semibold !text-[#1a1a1a] !mb-[8px] !leading-[1.2]"
            >
              Best Practices We Offer
            </h2>
          </div>
          {isMobile ? (
            <div className="!px-[10px]">
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
                    icon: <i className="fa-solid fa-shield-halved" style={{ fontSize: "24px", color: "#321961" }}></i>
                  },
                  {
                    title: "Online Reports",
                    desc: "You can download your reports online",
                    icon: <i className="fa-solid fa-file-invoice" style={{ fontSize: "24px", color: "#321961" }}></i>
                  },
                  {
                    title: "Home Sample Collection",
                    desc: "Our expert phlebotomists will come and collect your sample",
                    icon: <i className="fa-solid fa-house-chimney-medical" style={{ fontSize: "24px", color: "#321961" }}></i>
                  },
                  {
                    title: "MediCompares Advantage",
                    desc: "Enjoy upto 75% discount on diagnostic tests and health packages",
                    icon: <i className="fa-solid fa-award" style={{ fontSize: "24px", color: "#321961" }}></i>
                  },
                  {
                    title: "Competitive Prices",
                    desc: "We offer best prices on our diagnostic tests and health packages",
                    icon: <i className="fa-solid fa-tags" style={{ fontSize: "24px", color: "#321961" }}></i>
                  }
                ].map((practice, index) => (
                  <SwiperSlide key={index} style={{ height: "auto", display: "flex" }}>
                    <div
                      className="!text-center !w-full !p-[24px_5px] !bg-white !rounded-[16px] !border !border-solid !border-[#e2e8f0] !shadow-[0_4px_12px_rgba(128, 89, 202, 0.02)] !flex !flex-col !items-center !h-full"
                    >
                      <div
                        className="!w-[56px] !h-[56px] !mx-auto !mb-[16px] !flex !items-center !justify-center !bg-[rgba(128,89,202,0.06)] !rounded-[14px]"
                      >
                        {practice.icon}
                      </div>
                      <h5
                        className="!text-[15px] !font-semibold !text-[#1c1e21] !mb-[8px]"
                      >
                        {practice.title}
                      </h5>
                      <p
                        className="!text-[12.5px] !text-[#5c626a] !m-0 !leading-[1.5]"
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
              className="!flex !flex-wrap !gap-5 !justify-center"
            >
              {[
                {
                  title: "100% Safe & Secure",
                  desc: "We take all safety and hygiene measures to keep our customers safe",
                  icon: <i className="fa-solid fa-shield-halved" style={{ fontSize: "24px", color: "#321961" }}></i>
                },
                {
                  title: "Online Reports",
                  desc: "You can download your reports online",
                  icon: <i className="fa-solid fa-file-invoice" style={{ fontSize: "24px", color: "#321961" }}></i>
                },
                {
                  title: "Home Sample Collection",
                  desc: "Our expert phlebotomists will come and collect your sample",
                  icon: <i className="fa-solid fa-house-chimney-medical" style={{ fontSize: "24px", color: "#321961" }}></i>
                },
                {
                  title: "MediCompares Advantage",
                  desc: "Enjoy upto 75% discount on diagnostic tests and health packages",
                  icon: <i className="fa-solid fa-award" style={{ fontSize: "24px", color: "#321961" }}></i>
                },
                {
                  title: "Competitive Prices",
                  desc: "We offer best prices on our diagnostic tests and health packages",
                  icon: <i className="fa-solid fa-tags" style={{ fontSize: "24px", color: "#321961" }}></i>
                }
              ].map((practice, index) => (
                <div
                  key={index}
                  className="!flex-[1_1_200px] !max-w-[220px] !min-w-[200px]"
                >
                  <div
                    className="!text-center !h-full !p-[24px_16px] !bg-white !rounded-[16px] !border !border-solid !border-[#e2e8f0] !shadow-[0_4px_12px_rgba(128, 89, 202, 0.02)] transition-all duration-300 ease-out !cursor-pointer hover:!-translate-y-[6px] hover:!shadow-[0_12px_24px_rgba(128, 89, 202, 0.08)] hover:!border-[#321961]"
                  >
                    <div
                      className="!w-[56px] !h-[56px] !mx-auto !mb-[16px] !flex !items-center !justify-center !bg-[rgba(128,89,202,0.06)] !rounded-[14px] transition-all duration-300"
                    >
                      {practice.icon}
                    </div>
                    <h5
                      className="!text-[16px] !font-semibold !text-[#1c1e21] !mb-[8px] !tracking-[-0.01em]"
                    >
                      {practice.title}
                    </h5>
                    <p
                      className="!text-[13px] !text-[#5c626a] !m-0 !leading-[1.5]"
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
      {/* {
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
                  "linear-gradient(135deg, #321961 0%, #822BD4 50%, #A855F7 100%)",
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
                    color: "#321961",
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
      } */}

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
