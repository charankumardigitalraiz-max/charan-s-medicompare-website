import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import toast from "react-hot-toast";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { Navigation, Autoplay } from "swiper/modules";
import {
  getHealthcareSwiperSettings,
  getHealthcareTwoSlideOfferSettings,
} from "./healthcareSliderSettings.jsx";
import Slider from "react-slick";
import { useNavigate, useParams } from "react-router-dom";
import { axiosCommonInstance, axiosUserInstance } from "../../Apiservice";
import { getImageUrl } from "../../utils/index";
import { CartQuantityControls, VendorActions, BaseModal } from "../../components/ui";
import LeadModal from "../../components/modals/LeadModal.jsx";
import RentModal from "../../components/modals/RentModal.jsx";
import ConsultationModal from "../../components/modals/ConsultationModal.jsx";
import AppointmentModal from "../../components/modals/AppointmentModal.jsx";
import { useAddToCart } from "../../hooks/useAddToCart";
import { useCart } from "../../hooks/useCart";
import { useProfile } from "../../context/ProfileContext";
import { useLocation } from "../../context/LocationContext";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../services/bookingService";
import SEOHelmet from "../../components/ui/SEOHelmet";
const TrendingProducts = ({
  medicalEquipment,
  topCategories,
  topCategoriesProducts,
  settopCategoriesProducts,
  newProducts,
  trendingProducts,
  middleBanners,
  imgUrl,
}) => {
  const { service } = useParams();
  const { selectedPincode, latitude, longitude } = useLocation();
  const hasEnoughTrending =
    newProducts?.length > 4 || trendingProducts?.length > 4;
  const hasEnoughFeatured = topCategoriesProducts?.length > 4;

  const swiperSettings = getHealthcareSwiperSettings({
    modules: [Navigation, Autoplay],
    navigation: hasEnoughTrending
      ? {
        nextEl: ".trending-next",
        prevEl: ".trending-prev",
      }
      : false,
    loop: hasEnoughTrending,
  });

  const swiperSettings1 = getHealthcareSwiperSettings({
    modules: [Navigation, Autoplay],
    navigation: hasEnoughFeatured
      ? {
        nextEl: ".featured-next",
        prevEl: ".featured-prev",
      }
      : false,
    loop: hasEnoughFeatured,
  });

  const navigate = useNavigate();

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
  const [activeTab, setActiveTab] = useState("newProducts");
  const [activeTab1, setActiveTab1] = useState(topCategories[0]?.name || "");
  const [activeCategory, setActiveCategory] = useState(
    topCategories[0] || null,
  );
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

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

  const settings = getHealthcareTwoSlideOfferSettings();

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

  const toggleModal = () => setShowModal(!showModal);
  const toggleRentModal = () => setShowRentModal(!showRentModal);

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
    setShowModal(false); // Close quickview modal if open
    setShowLeadModal(true);
  };

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id,
      variantId: effectiveVariantId || null,
      vendorId: vendor.vendorId || vendor._id,
      servicefixedTypes: servicePassed || med?.tabletdetails?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "medicalequipment",
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
      servicefixedTypes: servicePassed || med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "medicalequipment",
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

    setShowModal(false);
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
    setShowModal(false);
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
    setShowModal(false);
    setShowAppointmentModal(true);
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

  const handleTabClick = async (category) => {
    setActiveTab1(category.name);
    setActiveCategory(category);

    try {
      let apiUrl = `service/subcategory/${category._id}`;
      const params = new URLSearchParams();

      if (selectedPincode) {
        params.append("location", selectedPincode);
        if (latitude && longitude) {
          params.append("lat", latitude);
          params.append("lng", longitude);
        }
      }

      if (params.toString()) {
        apiUrl += `?${params.toString()}`;
      }

      const response = await axiosCommonInstance.get(apiUrl);
      const products = response?.data?.data?.topcategoryproducts || [];
      settopCategoriesProducts(products);
    } catch (error) {
      toast.error("Error fetching products");
      settopCategoriesProducts([]);
    }
  };

  useEffect(() => {
    if (topCategories.length) {
      handleTabClick(topCategories[0]);
    }
  }, [topCategories]);

  const handleProductClick = (item) => {
    const data = item?.tabletdetails || item;
    const subcategory = data?.subcategorydetails || data?.subcatdetails;
    const categorySlug = subcategory?.catdetails?.slug;
    const subcategorySlug = subcategory?.slug;
    const productSlug = data?.slug;
    navigate(`/${categorySlug}/${subcategorySlug}/${productSlug}`);
  };

  return (
    <>
      <SEOHelmet page="medicalequipment" />
      {(activeTab === "newProducts"
        ? newProducts?.length > 0
        : trendingProducts?.length > 0) && (
          <div className="!py-4 !mx-2 !px-2">
            <div className="!flex !items-center !justify-between !flex-wrap !gap-4 !mb-4 !px-2">
              <h3 className="!m-0 !text-[20px] !font-semibold !text-[#1a1a1a] !flex !items-center !gap-2">
                <i className="fas fa-bolt !text-warning"></i>Our Trending Products
              </h3>

              <div className="!flex !items-center">
                <ul className="!flex !list-none !p-0 !m-0 !border-b !border-[#e5e7eb] !gap-1">
                  <li className="!m-0">
                    <button
                      className={`!px-4 !py-2 !text-[13px] !font-semibold !transition-all !border-none !bg-transparent ${activeTab === "newProducts"
                        ? "!text-primary !border-b-2 !border-primary"
                        : "!text-[#6b7280] hover:!text-primary"
                        }`}
                      onClick={() => setActiveTab("newProducts")}
                    >
                      New Products
                    </button>
                  </li>

                  <li className="!nav-item">
                    <button
                      className={`!px-4 !py-2 !text-[13px] !font-semibold !transition-all !border-none !bg-transparent ${activeTab === "trendingProducts"
                        ? "!text-primary !border-b-2 !border-primary"
                        : "!text-[#6b7280] hover:!text-primary"
                        }`}
                      onClick={() => setActiveTab("trendingProducts")}
                    >
                      Best Selling
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="meq-swiper-wrapper !relative [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto">
              {hasEnoughTrending && (
                <button
                  className="meq-arrow-btn trending-prev"
                  aria-label="Previous"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <Swiper {...swiperSettings}>
                {(activeTab === "newProducts"
                  ? newProducts || []
                  : trendingProducts || []
                )?.map((item, index) => {
                  if (!item?.tabletdetails) {
                    return null;
                  }

                  return (
                    <SwiperSlide
                      key={index}
                      className="!p-2 !flex !self-stretch"
                    >
                      <div
                        className="!flex !flex-col !h-full !w-full !rounded-[16px] !bg-white !shadow-[0_4px_20px_rgba(0,0,0,0.08)] !overflow-hidden !transition-all !duration-300 hover:!shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:!-translate-y-[2px] !cursor-pointer"
                        onClick={() => handleProductClick(item)}
                      >
                        <div className="!relative !w-full !h-[180px] !bg-white !rounded-t-[16px] !overflow-hidden">
                          <img
                            src={
                              getImageUrl(item?.tabletdetails?.files?.[0]) || "/assets/img/default-product.png"
                            }
                            alt={item?.tabletdetails?.name || "Product"}
                            className="!w-full !h-full !object-contain"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/img/default-product.png";
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleProductClick(item);
                            }}
                          />

                          {/* View Icon */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedProduct(item);
                              toggleModal();
                            }}
                            data-tooltip-id="global-tooltip"
                            data-tooltip-content="Quick View"
                            className="!absolute !top-2 !left-2 !p-[6px_10px] !rounded-full !shadow-[0_2px_8px_rgba(0,0,0,0.15)] !text-[13px] !cursor-pointer !bg-[#321961] !text-white !transition-all hover:!scale-110 !z-10"
                          >
                            <i className="fas fa-eye"></i>
                          </div>

                          {/* Compare Icon */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const data = item?.tabletdetails || item;
                              const categorySlug = data?.subcatdetails?.catdetails?.slug;
                              const subcategorySlug = data?.subcatdetails?.slug;
                              const tabletSlug = data?.slug;
                              if (!categorySlug || !subcategorySlug || !tabletSlug) return;
                              navigate(`/${categorySlug}/${subcategorySlug}/${tabletSlug}/compare`);
                            }}
                            className="!absolute !top-[10px] !right-[10px] !flex !items-center !gap-[6px] !z-10 !cursor-pointer !transition-all !duration-300 hover:!scale-[1.1] hover:!-translate-y-[2px]"
                            style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "30px", padding: "3px 14px", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", border: "1.5px solid #fff" }}
                            title="Compare Package"
                          >
                            <i className="fa-solid fa-hand-pointer" style={{ fontSize: "13px", color: "#fff", transform: "rotate(90deg)", display: "inline-block" }}></i>
                            <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "0.6px" }}>Compare</span>
                          </div>
                        </div>

                        <div className="!flex !flex-col !flex-1 !p-3">
                          {/* Vendor info header */}
                          <div
                            className="!flex !items-center !gap-2 !mb-3 !pb-2 !border-b !border-[rgba(125,46,255,0.1)] !transition-all !duration-200 hover:!opacity-80 hover:!translate-x-[2px]"
                            onClick={(e) => {
                              e.stopPropagation();
                              const vendorId =
                                item.vendordetails?.slug ||
                                item.vendordetails?.vendorId ||
                                item.vendors?.slug ||
                                item.vendors?.vendorId;
                              if (vendorId) {
                                sessionStorage.setItem("vendorId", vendorId);
                                const name =
                                  item.vendors?.bussinessdetails?.name ||
                                  item.vendors?.name ||
                                  "Vendor Store";
                                const vendorSlug = name
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")
                                  .replace(/[^a-z0-9-]/g, "");
                                navigate(`/vendor-profile/${vendorSlug}`);
                              } else {
                                toast.error("Vendor information not available");
                              }
                            }}
                          >
                            <img
                              alt="Vendor"
                              src={
                                getImageUrl(
                                  item.vendordetails?.bussiness_image[0]?.url || "",
                                ) || "/assets/img/default-product.png"
                              }
                              className="!w-9 !h-9 !rounded-lg !object-cover !border-2 !border-[rgba(125,46,255,0.2)] !shrink-0"
                              onError={(e) => {
                                e.currentTarget.src = "/assets/img/default-product.png";
                              }}
                            />

                            <div className="!grow !min-w-0">
                              <div className="!text-[12px] !font-bold !text-[#1a1a1a] !truncate !mb-[2px]">
                                {item.vendordetails?.name || "Vendor"}
                              </div>
                              {(() => {
                                const rating = Number(item?.averageRating);
                                const count = Number(item?.ratingCount);
                                if (!rating || !count || rating === 0 || count === 0) return null;

                                return (
                                  <div className="!flex !items-center !gap-[3px] !text-[10px] !text-[#666] !mb-[2px]">
                                    <i className="fas fa-star !text-[#ffc107] !text-[9px]"></i>
                                    <span className="!font-medium">{rating.toFixed(1)}</span>
                                    <span className="!text-[#999]">({count}+)</span>
                                  </div>
                                );
                              })()}

                              <div className="!text-[10px] !text-[#6b7280] !flex !items-center !gap-1 !overflow-hidden">
                                <i className="fas fa-map-marker-alt !text-[9px]" />
                                <span className="!truncate">
                                  {item.vendordetails?.address || ""}
                                </span>
                              </div>
                              {item?.distanceInKm && (
                                <div className="!flex !items-center !gap-1">
                                  <i className="isax isax-route-square !text-[11px] !text-primary"></i>
                                  <span>{parseFloat(item.distanceInKm).toFixed(1)} km away</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="!flex !items-start !justify-between !gap-2">
                            <h3
                              className="!m-0 !text-[14px] !font-semibold !text-[#1a1a1a] !capitalize !leading-snug !cursor-pointer !min-h-[2.8em] !line-clamp-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(item);
                              }}
                            >
                              {item?.tabletdetails?.name || "Unknown Product"}
                            </h3>

                            <div className="!flex !items-center !shrink-0 !gap-[3px] !text-[11px]">
                              <i className="fa fa-star !text-[#ffc107]"></i>
                              <span className="!text-[#444]">
                                {item?.tabletdetails?.averageRating.toFixed(1) > 0
                                  ? item?.tabletdetails.averageRating.toFixed(1)
                                  : 0}
                              </span>
                              <i className="fa fa-users !ml-1 !text-primary"></i>
                              <span className="!text-[#666]">
                                ({item?.tabletdetails?.ratingCount > 0 ? `${item?.tabletdetails.ratingCount}+` : 0})
                              </span>
                            </div>
                          </div>

                          <p
                            className="!m-0 !mt-2 !text-[11px] !text-[#666] !leading-normal !line-clamp-2 !min-h-[2.8em] [&_*]:!text-[11px] [&_*]:!text-[#666] [&_*]:!leading-normal"
                            dangerouslySetInnerHTML={{
                              __html: formatDescription(item?.tabletdetails?.description, 100)
                            }}
                          ></p>

                          {item?.tabletdetails?.model && (
                            <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[6px]">
                              <i className="fas fa-microchip !text-primary"></i>
                              <span>Model:</span>
                              <strong>{item?.tabletdetails?.model}</strong>
                            </div>
                          )}
                          {item?.tabletdetails?.condition && (
                            <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[2px]">
                              <i className="fas fa-circle-check !text-primary"></i>
                              <span>Condition:</span>
                              <strong>{item?.tabletdetails?.condition}</strong>
                            </div>
                          )}
                          {item?.tabletdetails?.machineType && (
                            <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[2px]">
                              <i className="fas fa-toolbox !text-primary"></i>
                              <span>Machine Type:</span>
                              <strong>{item?.tabletdetails?.machineType}</strong>
                            </div>
                          )}

                          {/* Price Details */}
                          <div className="!rounded-[8px] !p-[8px] !mt-auto !border !border-[rgba(128,89,202,0.15)] !bg-primary-bg">
                            <div className="!flex !flex-wrap !items-center !gap-2">
                              {(() => {
                                const price = parseFloat(item.price) || 0;
                                const discountprice = parseFloat(item.discountprice || item.discountPrice) || null;
                                const effectivePrice = discountprice && discountprice > 0 ? discountprice : price;

                                let discount = 0;
                                if (discountprice && discountprice > 0 && discountprice !== price) {
                                  if (discountprice > price) {
                                    discount = Math.round(((discountprice - price) / discountprice) * 100);
                                  } else {
                                    discount = Math.round(((price - discountprice) / price) * 100);
                                  }
                                }

                                return discountprice && discountprice > 0 && discountprice !== price ? (
                                  <>
                                    <span className="!font-bold !text-[16px] !text-[#1a1a1a]">₹{effectivePrice.toFixed(2)}</span>
                                    <span className="!line-through !text-[#999] !text-[13px]">₹{price.toFixed(2)}</span>
                                    {discount > 0 && (
                                      <span className="!bg-green-500 !text-white !text-[10px] !px-1.5 !py-[2px] !rounded !font-semibold">{discount}% OFF</span>
                                    )}
                                  </>
                                ) : (
                                  <span className="!font-bold !text-[16px] !text-[#1a1a1a]">₹{effectivePrice}</span>
                                );
                              })()}
                            </div>

                            {Number(item?.perDayRent || 0) > 0 && (
                              <>
                                {/* Delivery Badge */}
                                <div className="!flex !items-center !gap-[6px] !text-[11px] !text-primary !mt-[4px] !font-medium">
                                  <i className="fas fa-truck-fast"></i>
                                  <span>Free Delivery Available</span>
                                </div>
                                <div className="!flex !items-center !gap-[6px] !text-[11px] !text-[#321961] !mt-[4px] !font-medium">
                                  <i className="fas fa-calendar-day"></i>
                                  <span>Per Day Rent:</span>
                                  <strong>₹{item.perDayRent}</strong>
                                </div>
                              </>
                            )}
                          </div>

                          <div className="!flex !gap-2 !w-full !mt-3">
                            <VendorActions
                              bookingType={
                                item.vendors?.bookingType ||
                                item.vendordetails?.bookingType ||
                                item.vendordetails?.bookingtype ||
                                item.bookingType ||
                                "cart"
                              }
                              med={item.tabletdetails || item}
                              vendor={item.vendordetails || item.vendors || {}}
                              price={parseFloat(item.perDayRent) || 0}
                              rentPerDay={item?.perDayRent}
                              calculatedDiscountPrice={parseFloat(item.discountprice || item.discountPrice) || null}
                              service={item?.tabletdetails?.subcatdetails?.catdetails?.fixedType}
                              handleRentalBookinProcess={handleRentalBookinProcess}
                              handleNavigateToBooking={handleBooking}
                              handleAddLead={handleAddLead}
                              handleOpenConsultationModal={handleConsultationClick}
                              handleOpenAppointmentModal={handleAppointmentClick}
                              handleOpenRideModal=""
                              containerStyle={{
                                display: "flex",
                                flexDirection: "row",
                                width: "100%",
                                gap: "8px",
                                alignItems: "center",
                              }}
                              buttonStyle={{
                                flex: 1,
                              }}
                              rentAndCartButtonStyles={{
                                flex: 1,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </SwiperSlide>
                  );
                })}
              </Swiper>
              {hasEnoughTrending && (
                <button className="meq-arrow-btn trending-next" aria-label="Next">
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
          </div>
        )}

      {middleBanners?.length > 0 && (
        <section
          className="!py-6"
          style={{ backgroundColor: "#ffffff" }}
        >
          <div className="!max-w-7xl !mx-auto !px-4">
            <div className="!text-center !mb-6">
              <h2 className="!m-0 !text-[28px] !font-semibold !text-[#1a1a1a] !flex !items-center !justify-center !gap-2">
                <i className="fas fa-bolt !text-warning"></i>Offers & Promotions
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
                      className="!w-full !rounded-[12px]"
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
                  className="!w-full !rounded-[12px]"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* {topCategories && topCategories.length > 0 && topCategoriesProducts && topCategoriesProducts.length > 0 && ( */}
      <div className="!py-4 !mx-2 !px-2">
        <div className="!flex !items-center !justify-between !flex-wrap !gap-4 !mb-4 !px-2">
          <div className="!flex !items-center !gap-2">
            <h3 className="!m-0 !text-[20px] !font-semibold !text-[#1a1a1a]">
              <i className="fas fa-bolt !text-warning !mr-2"></i>Featured Products
            </h3>
          </div>

          <div className="!flex !items-center">
            <ul className="!flex !list-none !p-0 !m-0 !border-b !border-[#e5e7eb] !gap-1">
              {topCategories.slice(0, 3).map((category, index) => (
                <li className="!m-0" key={index}>
                  <button
                    className={`!px-4 !py-2 !text-[13px] !font-semibold !transition-all !duration-300 ${activeTab1 === category.name
                      ? "!text-primary !border-b-2 !border-primary"
                      : "!text-[#6b7280] hover:!text-primary"
                      }`}
                    onClick={() => handleTabClick(category)}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="meq-swiper-wrapper !relative [&_.swiper-wrapper]:!items-stretch [&_.swiper-slide]:!h-auto">
          {hasEnoughFeatured && (
            <button
              className="meq-arrow-btn featured-prev"
              aria-label="Previous"
            >
              <i className="fas fa-chevron-left"></i>
            </button>
          )}
          <Swiper key={activeTab1} {...swiperSettings1}>
            {(topCategoriesProducts || [])?.map((item, index) => {
              if (!item?.tabletdetails) {
                return null;
              }

              return (
                <SwiperSlide
                  key={index}
                  className="!p-2 !flex !self-stretch"
                >
                  <div
                    className="!flex !flex-col !h-full !w-full !rounded-[16px] !bg-white !shadow-[0_4px_20px_rgba(0,0,0,0.08)] !overflow-hidden !transition-all !duration-300 hover:!shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:!-translate-y-[2px] !cursor-pointer"
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="!relative !w-full !h-[180px] !bg-white !rounded-t-[16px] !overflow-hidden">
                      <img
                        src={
                          getImageUrl(item?.tabletdetails?.files?.[0]) || "/assets/img/default-product.png"
                        }
                        alt={item?.tabletdetails?.name || "Product"}
                        className="!w-full !h-full !object-contain"
                        onError={(e) => {
                          e.currentTarget.src = "/assets/img/default-product.png";
                        }}
                      />

                      {/* View Icon */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProduct(item);
                          toggleModal();
                        }}
                        data-tooltip-id="global-tooltip"
                        data-tooltip-content="Quick View"
                        className="!absolute !top-2 !left-2 !p-[6px_10px] !rounded-full !shadow-[0_2px_8px_rgba(0,0,0,0.15)] !text-[13px] !cursor-pointer !bg-primary !text-white !transition-all hover:!scale-110 !z-10"
                      >
                        <i className="fas fa-eye"></i>
                      </div>

                      {/* Compare Icon */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          const data = item?.tabletdetails || item;
                          const categorySlug = data?.subcatdetails?.catdetails?.slug;
                          const subcategorySlug = data?.subcatdetails?.slug;
                          const tabletSlug = data?.slug;
                          if (!categorySlug || !subcategorySlug || !tabletSlug) return;
                          navigate(`/${categorySlug}/${subcategorySlug}/${tabletSlug}/compare`);
                        }}
                        className="!absolute !top-[10px] !right-[10px] !flex !items-center !gap-[6px] !z-10 !cursor-pointer !transition-all !duration-300 hover:!scale-[1.1] hover:!-translate-y-[2px]"
                        style={{ background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)", borderRadius: "30px", padding: "3px 14px", boxShadow: "0 4px 12px rgba(245,158,11,0.4)", border: "1.5px solid #fff" }}
                        title="Compare Package"
                      >
                        <i className="fa-solid fa-hand-pointer" style={{ fontSize: "13px", color: "#fff", transform: "rotate(90deg)", display: "inline-block" }}></i>
                        <span style={{ fontSize: "11px", fontWeight: "800", color: "#fff", textTransform: "uppercase", letterSpacing: "0.6px" }}>Compare</span>
                      </div>
                    </div>

                    <div className="!flex !flex-col !flex-1 !p-3">
                      {/* Vendor info header */}
                      <div
                        className="!flex !items-center !gap-2 !mb-3 !pb-2 !border-b !border-[rgba(125,46,255,0.1)] !transition-all !duration-200 hover:!opacity-80 hover:!translate-x-[2px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          const vendorId =
                            item.vendordetails?.slug ||
                            item.vendordetails?.vendorId ||
                            item.vendors?.slug ||
                            item.vendors?.vendorId;
                          if (vendorId) {
                            sessionStorage.setItem("vendorId", vendorId);
                            const name =
                              item.vendors?.bussinessdetails?.name ||
                              item.vendors?.name ||
                              "Vendor Store";
                            const vendorSlug = name
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "");
                            navigate(`/vendor-profile/${vendorSlug}`);
                          } else {
                            toast.error("Vendor information not available");
                          }
                        }}
                      >
                        <img
                          alt="Vendor"
                          src={
                            getImageUrl(
                              item.vendordetails?.bussiness_image?.[0]?.url ||
                              "",
                            ) || "/assets/img/default-product.png"
                          }
                          className="!w-9 !h-9 !rounded-lg !object-cover !border-2 !border-[rgba(125,46,255,0.2)] !shrink-0"
                          onError={(e) => {
                            e.currentTarget.src = "/assets/img/default-product.png";
                          }}
                        />

                        <div className="!grow !min-w-0">
                          <div className="!text-[12px] !font-bold !text-[#1a1a1a] !truncate !mb-[2px]">
                            {item.vendordetails.name}
                          </div>
                          {item?.averageRating && item?.ratingCount && (
                            <div className="!flex !items-center !gap-[3px] !text-[10px] !text-[#666] !mb-[2px]">
                              <i className="fas fa-star !text-[#ffc107] !text-[9px]"></i>
                              <span className="!font-medium">
                                {item?.averageRating.toFixed(1)}
                              </span>
                              <span className="!text-[#999]">
                                ({item?.ratingCount}+)
                              </span>
                            </div>
                          )}

                          <div className="!text-[10px] !text-[#6b7280] !flex !items-center !gap-1 !overflow-hidden">
                            <i className="fas fa-map-marker-alt !text-[9px]" />
                            <span className="!truncate">
                              {item.vendordetails?.address || ""}
                            </span>
                          </div>
                          {item?.distanceInKm && (
                            <div className="!flex !items-center !gap-1 !text-[#6b7280] !text-[10px] !mt-[2px]">
                              <i className="isax isax-route-square !text-[11px] !text-primary"></i>
                              <span>
                                {parseFloat(item.distanceInKm).toFixed(1)} km away
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="!flex !items-start !justify-between !gap-2">
                        <h3 className="!m-0 !text-[14px] !font-semibold !text-[#1a1a1a] !capitalize !leading-snug !min-h-[2.8em] !line-clamp-2">
                          {item?.tabletdetails?.name || "Unknown Product"}
                        </h3>

                        <div className="!flex !items-center !shrink-0 !gap-[3px] !text-[11px]">
                          <i className="fa fa-star !text-[#ffc107]"></i>
                          <span className="!text-[#444]">
                            {item?.tabletdetails?.averageRating.toFixed(1) > 0
                              ? item?.tabletdetails.averageRating.toFixed(1)
                              : 0}
                          </span>
                          <i className="fa fa-users !ml-1 !text-primary"></i>
                          <span className="!text-[#666]">
                            ({item?.tabletdetails?.ratingCount > 0 ? `${item?.tabletdetails.ratingCount}+` : 0})
                          </span>
                        </div>
                      </div>

                      <p
                        className="!m-0 !mt-2 !text-[11px] !text-[#666] !leading-normal !line-clamp-2 !min-h-[2.8em] [&_*]:!text-[11px] [&_*]:!text-[#666] [&_*]:!leading-normal"
                        dangerouslySetInnerHTML={{
                          __html: formatDescription(item.tabletdetails?.description, 100)
                        }}
                      ></p>

                      {item?.tabletdetails?.model && (
                        <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[6px]">
                          <i className="fas fa-microchip !text-primary"></i>
                          <span>Model:</span>
                          <strong>{item?.tabletdetails?.model}</strong>
                        </div>
                      )}
                      {item?.tabletdetails?.condition && (
                        <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[2px]">
                          <i className="fas fa-circle-check !text-primary"></i>
                          <span>Condition:</span>
                          <strong>{item?.tabletdetails?.condition}</strong>
                        </div>
                      )}
                      {item?.tabletdetails?.machineType && (
                        <div className="!flex !items-center !gap-2 !text-[11px] !text-[#555] !mt-[2px]">
                          <i className="fas fa-toolbox !text-primary"></i>
                          <span>Machine Type:</span>
                          <strong>{item?.tabletdetails?.machineType}</strong>
                        </div>
                      )}

                      {/* Price details */}
                      <div className="!rounded-[8px] !p-[8px] !mt-auto !border !border-[rgba(128,89,202,0.15)] !bg-primary-bg">
                        <div className="!flex !flex-wrap !items-center !gap-2">
                          {(() => {
                            const price = parseFloat(item.price) || 0;
                            const discountprice = parseFloat(item.discountprice || item.discountPrice) || null;
                            const effectivePrice = discountprice && discountprice > 0 ? discountprice : price;

                            let discount = 0;
                            if (discountprice && discountprice > 0 && discountprice !== price) {
                              if (discountprice > price) {
                                discount = Math.round(((discountprice - price) / discountprice) * 100);
                              } else {
                                discount = Math.round(((price - discountprice) / price) * 100);
                              }
                            }

                            return discountprice && discountprice > 0 && discountprice !== price ? (
                              <>
                                <span className="!font-bold !text-[16px] !text-[#1a1a1a]">₹{effectivePrice.toFixed(2)}</span>
                                <span className="!line-through !text-[#999] !text-[13px]">₹{price.toFixed(2)}</span>
                                {discount > 0 && (
                                  <span className="!bg-green-500 !text-white !text-[10px] !px-1.5 !py-[2px] !rounded !font-semibold">{discount}% OFF</span>
                                )}
                              </>
                            ) : (
                              <span className="!font-bold !text-[16px] !text-[#1a1a1a]">₹{effectivePrice}</span>
                            );
                          })()}
                        </div>

                        {item?.perDayRent && (
                          <div className="!flex !items-center !gap-[6px] !text-[11px] !text-primary !mt-[4px] !font-medium">
                            <i className="fas fa-calendar-day"></i>
                            <span>Per Day Rent:</span>
                            <strong>₹{item.perDayRent}</strong>
                          </div>
                        )}
                      </div>

                      <div className="!flex !gap-2 !w-full !mt-3">
                        <VendorActions
                          bookingType={
                            item.vendors?.bookingType ||
                            item.vendordetails?.bookingType ||
                            item.vendordetails?.bookingtype ||
                            item.bookingType ||
                            "cart"
                          }
                          med={item.tabletdetails || item}
                          vendor={item.vendordetails || item.vendors || {}}
                          price={parseFloat(item.price) || 0}
                          rentPerDay={item?.perDayRent}
                          calculatedDiscountPrice={parseFloat(item.discountprice || item.discountPrice) || null}
                          service={item?.tabletdetails?.subcatdetails?.catdetails?.fixedType}
                          handleRentalBookinProcess={handleRentalBookinProcess}
                          handleNavigateToBooking={handleBooking}
                          handleAddLead={handleAddLead}
                          handleOpenConsultationModal={handleConsultationClick}
                          handleOpenAppointmentModal={handleAppointmentClick}
                          handleOpenRideModal=""
                          containerStyle={{
                            display: "flex",
                            flexDirection: "row",
                            width: "100%",
                            gap: "8px",
                            alignItems: "center",
                          }}
                          buttonStyle={{
                            flex: 1,
                          }}
                          rentAndCartButtonStyles={{
                            flex: 1,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
          {hasEnoughFeatured && (
            <button className="meq-arrow-btn featured-next" aria-label="Next">
              <i className="fas fa-chevron-right"></i>
            </button>
          )}
        </div>
      </div>
      {/* )} */}

      <section
        className="!py-8 !px-4"
        style={{
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="!max-w-7xl !mx-auto">
          <div className="!grid !grid-cols-1 md:!grid-cols-2 lg:!grid-cols-4 !gap-6 !divide-y md:!divide-y-0 lg:!divide-x !divide-gray-200">
            {[
              {
                icon: "fas fa-truck-fast",
                title: "Fast Shipping",
                subtitle: "Free delivery for order over ₹1999.00.",
              },
              {
                icon: "fas fa-headset",
                title: "Online Support",
                subtitle: "Feel free to call us & get best support.",
              },
              {
                icon: "fas fa-credit-card",
                title: "EMI",
                subtitle: "Convenient Credit Card EMIs Available.",
              },
              {
                icon: "fas fa-shield-alt",
                title: "Secure Payment",
                subtitle: "Safe & more secure way to pay online.",
              },
            ].map((service, index) => (
              <div
                key={index}
                className="!flex !items-center !gap-4 !py-4 lg:!py-0 lg:!px-6 first:!pt-0 lg:first:!pl-0"
              >
                <div className="!w-12 !h-12 !rounded-full !bg-[#f3effd] !flex !items-center !justify-center !shrink-0">
                  <i className={`${service.icon} !text-primary !text-[20px]`}></i>
                </div>

                <div className="!flex-1">
                  <h3 className="!m-0 !mb-1 !text-[15px] !font-semibold !text-[#1a1a1a]">
                    {service.title}
                  </h3>
                  <p className="!m-0 !text-[12px] !text-[#6b7280] !leading-relaxed">
                    {service.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* quick view */}
      {showModal && selectedProduct && createPortal(
        <BaseModal
          show={showModal}
          onClose={toggleModal}
          closeButton={false}
          size="xl"
          className="!max-w-4xl !rounded-2xl !overflow-hidden"
          bodyClassName="!p-0"
        >
          <div className="!grid !grid-cols-1 md:!grid-cols-2">
            {/* Product Image Column */}
            <div className="!hidden md:!flex !items-center !justify-center !bg-gray-50 !p-6 !min-h-[350px]">
              <img
                src={getImageUrl(selectedProduct.tabletdetails?.files?.[0]) || "/assets/img/default-product.png"}
                alt={selectedProduct.tabletdetails?.name || "Product"}
                className="!max-h-[320px] !object-contain !rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "/assets/img/default-product.png";
                }}
              />
            </div>

            {/* Product Details Column */}
            <div className="!p-6 !flex !flex-col !justify-between !bg-white">
              <div>
                <div className="!flex !items-center !justify-between !gap-4 !mb-4">
                  <h5 className="!m-0 !text-[18px] !font-semibold !text-[#1a1a1a]">
                    {(selectedProduct.tabletdetails?.name || "").substring(0, 30) +
                      (selectedProduct.tabletdetails?.name?.length > 30 ? "..." : "")}
                  </h5>

                  <button
                    type="button"
                    className="!w-7 !h-7 !rounded-full !bg-gray-100 hover:!bg-gray-200 !flex !items-center !justify-center !text-[#666] !transition-colors !cursor-pointer !border-none"
                    onClick={toggleModal}
                  >
                    <i className="fas fa-times !text-[12px]"></i>
                  </button>
                </div>

                <div className="!flex !items-center !gap-3 !flex-wrap !pb-3 !mb-3 !border-b !border-gray-200">
                  {(() => {
                    const price = parseFloat(selectedProduct.price) || 0;
                    const discountprice = parseFloat(selectedProduct.discountprice || selectedProduct.discountPrice) || null;
                    const effectivePrice = discountprice && discountprice > 0 ? discountprice : price;

                    let discount = 0;
                    if (discountprice && discountprice > 0 && discountprice !== price) {
                      if (discountprice > price) {
                        discount = Math.round(((discountprice - price) / discountprice) * 100);
                      } else {
                        discount = Math.round(((price - discountprice) / price) * 100);
                      }
                    }

                    return discountprice &&
                      discountprice > 0 &&
                      discountprice !== price ? (
                      <>
                        <span className="!text-[20px] !font-bold !text-primary">
                          ₹{effectivePrice.toFixed(2)}
                        </span>
                        <span className="!line-through !text-gray-400 !text-[15px]">
                          ₹{price.toFixed(2)}
                        </span>
                        {discount > 0 && (
                          <span className="!bg-green-500 !text-white !text-[11px] !px-1.5 !py-[2px] !rounded !font-semibold">
                            {discount}% OFF
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="!text-[20px] !font-bold !text-primary">
                        ₹{effectivePrice.toFixed(2)}
                      </span>
                    );
                  })()}
                </div>

                <div className="!mb-4">
                  <p
                    className="!m-0 !text-[13px] !text-gray-600 !leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html:
                        (selectedProduct.tabletdetails?.description || "").substring(0, 200) +
                        (selectedProduct.tabletdetails?.description?.length > 200 ? "..." : ""),
                    }}
                  />
                </div>

                {/* Vendor Details Box */}
                <div className="!rounded-[12px] !p-4 !border !border-gray-200 !bg-gray-50 !mb-4">
                  <div className="!flex !items-center !gap-3 !mb-3">
                    <img
                      alt="Vendor"
                      src={
                        getImageUrl(
                          selectedProduct.vendordetails?.bussiness_image?.[0]?.url ||
                          selectedProduct.vendors?.bussiness_image?.[0]?.url ||
                          "",
                        ) || "/assets/img/default-product.png"
                      }
                      className="!w-10 !h-10 !rounded-lg !object-cover !border-2 !border-[rgba(125,46,255,0.2)] !shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/img/default-product.png";
                      }}
                    />
                    <div className="!min-w-0 !flex-1">
                      <div className="!text-[14px] !font-bold !text-[#1a1a1a] !truncate">
                        {selectedProduct.vendordetails?.name || selectedProduct.vendors?.name || "Vendor"}
                      </div>
                      <div className="!text-[12px] !text-gray-500 !flex !items-center !gap-1">
                        <i className="fas fa-map-marker-alt !text-[10px]" />
                        <span className="!truncate">
                          {(selectedProduct.vendordetails?.address || selectedProduct.vendors?.address || "").substring(0, 50) +
                            ((selectedProduct.vendordetails?.address || selectedProduct.vendors?.address || "")?.length > 50 ? "..." : "")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(selectedProduct.vendordetails?.phone || selectedProduct.vendors?.phone) && (
                    <div className="!text-[12px] !text-gray-600 !flex !items-center !gap-2 !mb-2">
                      <i className="fas fa-phone !text-[10px]" />
                      <span>{selectedProduct.vendordetails?.phone || selectedProduct.vendors?.phone}</span>
                    </div>
                  )}

                  <div className="!flex !items-center !gap-4 !pt-3 !mt-3 !border-t !border-gray-200 !text-[11px] !text-gray-500">
                    <div className="!flex !items-center !gap-1">
                      <i className="fas fa-star !text-[#ffc107] !text-[10px]" />
                      <span>
                        User Rating: {selectedProduct.tabletdetails?.averageRating > 0 ? selectedProduct.tabletdetails.averageRating.toFixed(1) : "0.0"}
                      </span>
                    </div>
                    <div className="!flex !items-center !gap-1">
                      <i className="fa fa-users !text-primary !text-[10px]" />
                      <span>
                        Reviews: {selectedProduct.tabletdetails?.ratingCount > 0 ? `${selectedProduct.tabletdetails.ratingCount}+` : "0"}
                      </span>
                    </div>
                  </div>

                  <div className="!flex !items-center !gap-4 !mt-1.5 !text-[11px] !text-gray-500">
                    <div className="!flex !items-center !gap-1">
                      <i className="fas fa-store !text-blue-500 !text-[10px]" />
                      <span>
                        Vendor Rating: {selectedProduct.vendordetails?.averageRating > 0 ? selectedProduct.vendordetails.averageRating.toFixed(1) : selectedProduct.vendors?.averageRating > 0 ? selectedProduct.vendors.averageRating.toFixed(1) : "0.0"}
                      </span>
                    </div>
                    <div className="!flex !items-center !gap-1">
                      <i className="fa fa-shopping-bag !text-green-500 !text-[10px]" />
                      <span>
                        Orders: {selectedProduct.vendordetails?.ratingCount > 0 ? `${selectedProduct.vendordetails.ratingCount}+` : selectedProduct.vendors?.ratingCount > 0 ? `${selectedProduct.vendors.ratingCount}+` : "0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions Button */}
              <div className="!flex !gap-3 !w-full">
                <VendorActions
                  bookingType={
                    selectedProduct.vendors?.bookingType ||
                    selectedProduct.vendordetails?.bookingType ||
                    selectedProduct.vendordetails?.bookingtype ||
                    selectedProduct.bookingType ||
                    "cart"
                  }
                  med={selectedProduct.tabletdetails || selectedProduct}
                  vendor={selectedProduct.vendordetails || selectedProduct.vendors || {}}
                  price={parseFloat(selectedProduct.price) || 0}
                  rentPerDay={selectedProduct?.perDayRent}
                  calculatedDiscountPrice={parseFloat(selectedProduct.discountprice || selectedProduct.discountPrice) || null}
                  stock={selectedProduct.stock || (selectedProduct.tabletdetails || selectedProduct).stock || (selectedProduct.vendordetails || selectedProduct.vendors || {}).stock || 999}
                  service={selectedProduct?.tabletdetails?.subcatdetails?.catdetails?.fixedType || service}
                  handleRentalBookinProcess={handleRentalBookinProcess}
                  handleNavigateToBooking={handleBooking}
                  handleAddLead={handleAddLead}
                  handleOpenConsultationModal={handleConsultationClick}
                  handleOpenAppointmentModal={handleAppointmentClick}
                  handleOpenRideModal=""
                  containerStyle={{
                    display: "flex",
                    flexDirection: "row",
                    width: "100%",
                    gap: "8px",
                    alignItems: "center",
                  }}
                  buttonStyle={{
                    flex: 1,
                  }}
                  rentAndCartButtonStyles={{
                    flex: 1,
                  }}
                />
              </div>
            </div>
          </div>
        </BaseModal>,
        document.body
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
        fixedType="medicalequipment"
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
          fixedType="medicalequipment"
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
        productId={consultationFormData.productId || null}
        vendorId={consultationFormData.vendorId || null}
        variantId={consultationFormData.variantId || null}
        fixedType="medicalequipment"
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
        productId={appointmentFormData.productId || null}
        vendorId={appointmentFormData.vendorId || null}
        variantId={appointmentFormData.variantId || null}
        fixedType="medicalequipment"
      />
    </>
  );
};

export default TrendingProducts;
