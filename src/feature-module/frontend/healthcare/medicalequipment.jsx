import React, { useState, useEffect } from "react";
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
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import { CartQuantityControls, VendorActions } from "../../../components/ui";
import LeadModal from "../pharmacy/products-components/LeadModal.jsx";
import RentModal from "../pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../pharmacy/products-components/AppointmentModal.jsx";
import { useAddToCart } from "../../../hooks/useAddToCart";
import { useCart } from "../../../hooks/useCart";
import { useProfile } from "../../../context/ProfileContext";
import { useLocation } from "../../../context/LocationContext";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
import SEOHelmet from "../../../components/SEOHelmet";
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
          <div className="container-fluid py-3">
            <div className="row align-items-center mb-2">
              <div className="col-12 col-md-4 text-center text-md-start">
                <h3 className="top-vendor-badge">
                  <i className="fas fa-bolt"></i>Our Trending Products
                </h3>
              </div>

              <div className="col-12 col-md-8">
                <ul className="nav nav-tabs justify-content-end">
                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "newProducts" ? "active" : ""
                        }`}
                      onClick={() => setActiveTab("newProducts")}
                    >
                      New Products
                    </button>
                  </li>

                  <li className="nav-item">
                    <button
                      className={`nav-link ${activeTab === "trendingProducts" ? "active" : ""
                        }`}
                      onClick={() => setActiveTab("trendingProducts")}
                    >
                      Best Selling
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="meq-swiper-wrapper" style={{ position: "relative" }}>
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
                      className="p-2"
                      style={{ display: "flex", alignSelf: "stretch" }}
                    >
                      <div
                        className="cardss shadow-sm product-card-hover"
                        style={{
                          cursor: "pointer",
                          display: "flex",
                          flexDirection: "column",
                          width: "100%",
                          background: "#fff"
                        }}
                        onClick={() => handleProductClick(item)}
                      >
                        <div className="position-relative">
                          <img
                            src={
                              getImageUrl(item?.tabletdetails?.files?.[0]) || "/assets/img/default-product.png"
                            }
                            alt={item?.tabletdetails?.name || "Product"}
                            className="product-img p-0"
                            style={{
                              cursor: "pointer",
                              borderRadius: "0px",
                              objectFit: "contain",
                            }}
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
                            style={{
                              position: "absolute",
                              top: "8px",
                              left: "8px",
                              padding: "6px 8px",
                              borderRadius: "50px",
                              boxShadow: "0 0 6px rgba(0,0,0,0.15)",
                              fontSize: "13px",
                              cursor: "pointer",
                              backgroundColor: "#8059ca",
                              color: "#fff",
                            }}
                          >
                            <i className="fas fa-eye"></i>
                          </div>

                          {/* Compare Icon */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();

                              const data = item?.tabletdetails || item;

                              const categorySlug =
                                data?.subcatdetails?.catdetails?.slug;

                              const subcategorySlug = data?.subcatdetails?.slug;

                              const tabletSlug = data?.slug;
                              if (
                                !categorySlug ||
                                !subcategorySlug ||
                                !tabletSlug
                              )
                                return;

                              navigate(
                                `/${categorySlug}/${subcategorySlug}/${tabletSlug}/compare`,
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

                        <div className="cardss-body p-3">
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                              marginBottom: 12,
                              paddingBottom: 12,
                              borderBottom: "1px solid rgba(125, 46, 255, 0.1)",
                              cursor: "pointer",
                              transition: "all 0.2s ease",
                            }}
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
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "0.8";
                              e.currentTarget.style.transform = "translateX(4px)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.transform = "translateX(0)";
                            }}
                          >
                            <img
                              alt="Vendor"
                              src={
                                getImageUrl(
                                  item.vendordetails?.bussiness_image[0]?.url || "",
                                ) || "/assets/img/default-product.png"
                              }
                              style={{
                                width: 36,
                                height: 36,
                                borderRadius: 8,
                                objectFit: "cover",
                                border: "2px solid rgba(125, 46, 255, 0.2)",
                              }}
                              onError={(e) => {
                                e.currentTarget.src = "/assets/img/default-product.png";
                              }}
                            />

                            <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 600,
                                  color: "rgb(26, 26, 26)",
                                  marginBottom: 2,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item.vendordetails?.name || "Vendor"}
                              </div>
                              {(() => {
                                const rating = Number(item?.averageRating);
                                const count = Number(item?.ratingCount);
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

                              <div
                                style={{
                                  fontSize: 10,
                                  color: "rgb(107, 114, 128)",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <i
                                  className="fas fa-map-marker-alt"
                                  style={{ fontSize: 9 }}
                                />
                                <span
                                  style={{
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {(item.vendordetails?.address || "").substring(
                                    0,
                                    45,
                                  ) +
                                    (item.vendordetails?.address?.length > 45
                                      ? "..."
                                      : "")}
                                </span>
                              </div>
                              {item?.distanceInKm && (
                                <div
                                  className="d-flex align-items-center gap-1 text-muted"
                                  style={{ marginTop: "4px" }}
                                >
                                  <i
                                    className="isax isax-route-square"
                                    style={{
                                      fontSize: "11px",
                                      color: "#8059ca",
                                    }}
                                  ></i>

                                  <span style={{ fontSize: "11px" }}>
                                    {parseFloat(item.distanceInKm).toFixed(1)} km
                                    away
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="d-flex justify-content-between align-items-center">
                            <h3
                              className="titlee text-dark mb-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleProductClick(item);
                              }}
                            >
                              {item?.tabletdetails?.name?.length > 20
                                ? item?.tabletdetails?.name.slice(0, 20) + "..."
                                : item?.tabletdetails?.name || "Unknown Product"}
                            </h3>

                            <div
                              className="d-flex align-items-center justify-content-end"
                              style={{ minWidth: "80px", fontSize: "12px" }}
                            >
                              <i className="fa fa-star text-warning me-1"></i>
                              <span className="me-1">
                                {item?.tabletdetails?.averageRating.toFixed(1) > 0
                                  ? item?.tabletdetails.averageRating.toFixed(1)
                                  : 0}
                              </span>

                              <i className="fa fa-users me-1 text-primary"></i>
                              <span>
                                (
                                {item?.tabletdetails?.ratingCount > 0
                                  ? `${item?.tabletdetails.ratingCount}+`
                                  : 0}
                                )
                              </span>
                            </div>
                          </div>

                          <small
                            style={{
                              fontSize: "13px",
                              color: "#666",
                              lineHeight: "1.5",
                              display: "block",
                            }}
                            className="mt-2"
                          >
                            {formatDescription(
                              item?.tabletdetails?.description,
                              100,
                            )}
                          </small>
                          {item?.tabletdetails?.model && (
                            <div className="report-timee mb-0 d-flex align-items-center gap-2">
                              <i className="fas fa-microchip text-primary"></i>
                              <span>Modal : </span>
                              <span
                                style={{ fontWeight: "600", fontSize: "13px" }}
                              >
                                {item?.tabletdetails?.model}
                              </span>
                            </div>
                          )}
                          {item?.tabletdetails?.condition && (
                            <div className="report-timee mb-0 d-flex align-items-center gap-2">
                              <i className="fas fa-circle-check text-primary"></i>
                              <span>Condition : </span>
                              <span
                                style={{ fontWeight: "600", fontSize: "13px" }}
                              >
                                {item?.tabletdetails?.condition}
                              </span>
                            </div>
                          )}
                          {item?.tabletdetails?.machineType && (
                            <div className="report-timee mb-0 d-flex align-items-center gap-2">
                              <i className="fas fa-toolbox text-primary"></i>
                              <span>Machine Type : </span>
                              <span
                                style={{ fontWeight: "600", fontSize: "13px" }}
                              >
                                {item?.tabletdetails?.machineType}
                              </span>
                            </div>
                          )}

                          <div
                            style={{
                              backgroundColor: "#f8f9fa",
                              padding: "10px",
                              borderRadius: "8px",
                              border: "1px solid #e0e0e0",
                            }}
                            className="my-2"
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "18px",
                                  fontWeight: "700",
                                  color: "#000",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "8px",
                                  flexWrap: "wrap",
                                }}
                              >
                                {(() => {
                                  const price = parseFloat(item.price) || 0;
                                  const discountprice =
                                    parseFloat(
                                      item.discountprice || item.discountPrice,
                                    ) || null;

                                  const effectivePrice =
                                    discountprice && discountprice > 0
                                      ? discountprice
                                      : price;

                                  let discount = 0;
                                  if (
                                    discountprice &&
                                    discountprice > 0 &&
                                    discountprice !== price
                                  ) {
                                    if (discountprice > price) {
                                      discount = Math.round(
                                        ((discountprice - price) /
                                          discountprice) *
                                        100,
                                      );
                                    } else {
                                      discount = Math.round(
                                        ((price - discountprice) / price) * 100,
                                      );
                                    }
                                  }

                                  return discountprice &&
                                    discountprice > 0 &&
                                    discountprice !== price ? (
                                    <>
                                      <span
                                        style={{
                                          fontSize: "18px",
                                          fontWeight: "600",
                                          color: "#000",
                                        }}
                                      >
                                        ₹{effectivePrice.toFixed(2)}
                                      </span>

                                      <span
                                        className="text-muted text-decoration-line-through"
                                        style={{ fontSize: "14px" }}
                                      >
                                        ₹{price.toFixed(2)}
                                      </span>

                                      {discount > 0 && (
                                        <span
                                          className="badge bg-success"
                                          style={{ fontSize: "11px" }}
                                        >
                                          {discount}% OFF
                                        </span>
                                      )}
                                      {Number(item?.perDayRent || 0) > 0 && (
                                        <div
                                          style={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: "4px",
                                            fontSize: "12px",
                                            color: "#8059ca",
                                          }}
                                        >
                                          <i className="fas fa-calendar-day"></i>
                                          <span style={{ fontWeight: "500" }}>
                                            Per Day Rent:
                                          </span>
                                          <span style={{ fontWeight: "700" }}>
                                            ₹{item.perDayRent}
                                          </span>
                                        </div>
                                      )}
                                    </>
                                  ) : (
                                    <span
                                      style={{
                                        fontSize: "18px",
                                        fontWeight: "600",
                                        color: "#000",
                                      }}
                                    >
                                      ₹{effectivePrice}
                                    </span>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          <div className="d-flex gap-2 w-100" style={{ marginTop: 'auto' }}>
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
                              // stock={item.stock || (item.tabletdetails || item).stock || (item.vendordetails || item.vendors || {}).stock || 999}
                              service={item?.tabletdetails?.subcatdetails?.catdetails?.fixedType}
                              handleRentalBookinProcess={handleRentalBookinProcess}
                              handleNavigateToBooking={handleBooking}
                              handleAddLead={handleAddLead}
                              handleOpenConsultationModal={handleConsultationClick}
                              handleOpenAppointmentModal={handleAppointmentClick}
                              handleOpenRideModal=""
                              className="w-100"
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

      {/* {topCategories && topCategories.length > 0 && topCategoriesProducts && topCategoriesProducts.length > 0 && ( */}
      <div className="container-fluid">
        <div className="row align-items-center mb-2">
          <div className="col-12 col-md-4 text-center text-md-start">
            <h3 className="top-vendor-badge">
              <i className="fas fa-bolt"></i>Featured Products
            </h3>
          </div>

          <div className="col-12 col-md-8">
            <ul className="nav nav-tabs justify-content-end">
              {topCategories.slice(0, 3).map((category, index) => (
                <li className="nav-item" key={index}>
                  <button
                    className={`nav-link ${activeTab1 === category.name ? "active" : ""
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

        <div className="meq-swiper-wrapper" style={{ position: "relative" }}>
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
                  className="p-2"
                  style={{ display: "flex", alignSelf: "stretch", }}
                >
                  <div
                    className="cardss shadow-sm product-card-hover"
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      width: "100%",
                      background: "#fff"
                    }}
                    onClick={() => handleProductClick(item)}
                  >
                    <div className="position-relative">
                      <img
                        src={
                          getImageUrl(item?.tabletdetails?.files?.[0]) || "/assets/img/default-product.png"
                        }
                        alt={item?.tabletdetails?.name || "Product"}
                        className="product-img p-0"
                        style={{
                          cursor: "pointer",
                          borderRadius: "0px",
                          objectFit: "contain",
                        }}
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
                        style={{
                          position: "absolute",
                          top: "8px",
                          left: "8px",
                          padding: "6px 8px",
                          borderRadius: "50px",
                          boxShadow: "0 0 6px rgba(0,0,0,0.15)",
                          fontSize: "13px",
                          cursor: "pointer",
                          backgroundColor: "#8059ca",
                          color: "#fff",
                        }}
                      >
                        <i className="fas fa-eye"></i>
                      </div>

                      {/* Compare Icon */}
                      <div
                        onClick={(e) => {
                          e.stopPropagation();

                          const data = item?.tabletdetails || item;

                          const categorySlug =
                            data?.subcatdetails?.catdetails?.slug;

                          const subcategorySlug = data?.subcatdetails?.slug;

                          const tabletSlug = data?.slug;
                          if (
                            !categorySlug ||
                            !subcategorySlug ||
                            !tabletSlug
                          )
                            return;

                          navigate(
                            `/${categorySlug}/${subcategorySlug}/${tabletSlug}/compare`,
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

                    <div className="cardss-body p-3">
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 12,
                          paddingBottom: 12,
                          borderBottom: "1px solid rgba(125, 46, 255, 0.1)",
                          cursor: "pointer",
                          transition: "all 0.2s ease",
                        }}
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
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = "0.8";
                          e.currentTarget.style.transform = "translateX(4px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = "1";
                          e.currentTarget.style.transform = "translateX(0)";
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
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 8,
                            objectFit: "contain",
                            border: "2px solid rgba(125, 46, 255, 0.2)",
                          }}
                          onError={(e) => {
                            e.currentTarget.src = "/assets/img/default-product.png";
                          }}
                        />

                        <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "rgb(26, 26, 26)",
                              marginBottom: 2,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {item.vendordetails.name}
                          </div>
                          {item?.averageRating && item?.ratingCount && (
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
                                  fontSize: "9px",
                                }}
                              ></i>
                              <span style={{ fontWeight: "500" }}>
                                {item?.averageRating.toFixed(1)}
                              </span>
                              <span style={{ color: "#999" }}>
                                ({item?.ratingCount}+)
                              </span>
                            </div>
                          )}

                          <div
                            style={{
                              fontSize: 10,
                              color: "rgb(107, 114, 128)",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <i
                              className="fas fa-map-marker-alt"
                              style={{ fontSize: 9 }}
                            />
                            <span
                              style={{
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                            >
                              {(item.vendordetails?.address || "").substring(
                                0,
                                45,
                              ) +
                                (item.vendordetails?.address?.length > 45
                                  ? "..."
                                  : "")}
                            </span>
                          </div>
                          {item?.distanceInKm && (
                            <div
                              className="d-flex align-items-center gap-1 text-muted"
                              style={{ marginTop: "4px" }}
                            >
                              <i
                                className="isax isax-route-square"
                                style={{
                                  fontSize: "11px",
                                  color: "#8059ca",
                                }}
                              ></i>

                              <span style={{ fontSize: "11px" }}>
                                {parseFloat(item.distanceInKm).toFixed(1)} km
                                away
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center">
                        <h3 className="titlee text-dark mb-0">
                          {item?.tabletdetails.name?.length > 20
                            ? item?.tabletdetails.name.slice(0, 20) + "..."
                            : item?.tabletdetails.name}
                        </h3>

                        <div
                          className="d-flex align-items-center justify-content-end"
                          style={{ minWidth: "80px", fontSize: "12px" }}
                        >
                          <i className="fa fa-star text-warning me-1"></i>
                          <span className="me-1">
                            {item?.tabletdetails?.averageRating.toFixed(1) > 0
                              ? item?.tabletdetails.averageRating.toFixed(1)
                              : 0}
                          </span>

                          <i className="fa fa-users me-1 text-primary"></i>
                          <span>
                            (
                            {item?.tabletdetails?.ratingCount > 0
                              ? `${item?.tabletdetails.ratingCount}+`
                              : 0}
                            )
                          </span>
                        </div>
                      </div>

                      <small
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          lineHeight: "1.5",
                          display: "block",
                        }}
                        className="mt-2"
                      >
                        {formatDescription(
                          item.tabletdetails?.description,
                          100,
                        )}
                      </small>
                      {item?.tabletdetails?.model && (
                        <div className="report-timee mb-0 d-flex align-items-center gap-2">
                          <i className="fas fa-microchip text-primary"></i>
                          <span>Modal : </span>
                          <span
                            style={{ fontWeight: "600", fontSize: "13px" }}
                          >
                            {item?.tabletdetails?.model}
                          </span>
                        </div>
                      )}
                      {item?.tabletdetails?.condition && (
                        <div className="report-timee mb-0 d-flex align-items-center gap-2">
                          <i className="fas fa-circle-check text-primary"></i>
                          <span>Condition : </span>
                          <span
                            style={{ fontWeight: "600", fontSize: "13px" }}
                          >
                            {item?.tabletdetails?.condition}
                          </span>
                        </div>
                      )}
                      {item?.tabletdetails?.machineType && (
                        <div className="report-timee mb-0 d-flex align-items-center gap-2">
                          <i className="fas fa-toolbox text-primary"></i>
                          <span>Machine Type : </span>
                          <span
                            style={{ fontWeight: "600", fontSize: "13px" }}
                          >
                            {item?.tabletdetails?.machineType}
                          </span>
                        </div>
                      )}

                      <div
                        style={{
                          backgroundColor: "#f8f9fa",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #e0e0e0",
                        }}
                        className="my-2"
                      >
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          <div
                            style={{
                              fontSize: "18px",
                              fontWeight: "700",
                              color: "#000",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              flexWrap: "wrap",
                            }}
                          >
                            {(() => {
                              const price = parseFloat(item.price) || 0;
                              const discountprice =
                                parseFloat(
                                  item.discountprice || item.discountPrice,
                                ) || null;

                              const effectivePrice =
                                discountprice && discountprice > 0
                                  ? discountprice
                                  : price;

                              let discount = 0;
                              if (
                                discountprice &&
                                discountprice > 0 &&
                                discountprice !== price
                              ) {
                                if (discountprice > price) {
                                  discount = Math.round(
                                    ((discountprice - price) /
                                      discountprice) *
                                    100,
                                  );
                                } else {
                                  discount = Math.round(
                                    ((price - discountprice) / price) * 100,
                                  );
                                }
                              }

                              return discountprice &&
                                discountprice > 0 &&
                                discountprice !== price ? (
                                <>
                                  <span
                                    style={{
                                      fontSize: "16px",
                                      fontWeight: "600",
                                      color: "#000",
                                    }}
                                  >
                                    ₹{effectivePrice.toFixed(2)}
                                  </span>

                                  <span
                                    className="text-muted text-decoration-line-through"
                                    style={{ fontSize: "14px" }}
                                  >
                                    ₹{price.toFixed(2)}
                                  </span>

                                  {discount > 0 && (
                                    <span
                                      className="badge bg-success"
                                      style={{ fontSize: "11px" }}
                                    >
                                      {discount}% OFF
                                    </span>
                                  )}
                                  {item?.perDayRent && (
                                    <div
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "4px",
                                        fontSize: "12px",
                                        color: "#8059ca",
                                      }}
                                    >
                                      <i className="fas fa-calendar-day"></i>
                                      <span style={{ fontWeight: "500" }}>
                                        Per Day Rent:
                                      </span>
                                      <span style={{ fontWeight: "700" }}>
                                        ₹{item.perDayRent}
                                      </span>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <span
                                  style={{
                                    fontSize: "18px",
                                    fontWeight: "600",
                                    color: "#000",
                                  }}
                                >
                                  ₹{effectivePrice}
                                </span>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="d-flex gap-2 w-100" style={{ marginTop: "auto" }}>
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
                          // stock={item.stock || (item.tabletdetails || item).stock || (item.vendordetails || item.vendors || {}).stock || 999}
                          service={item?.tabletdetails?.subcatdetails?.catdetails?.fixedType}
                          handleRentalBookinProcess={handleRentalBookinProcess}
                          handleNavigateToBooking={handleBooking}
                          handleAddLead={handleAddLead}
                          handleOpenConsultationModal={handleConsultationClick}
                          handleOpenAppointmentModal={handleAppointmentClick}
                          handleOpenRideModal=""
                          className="w-100"
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
        style={{
          padding: "20px 0",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container-fluid">
          <div className="row">
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
                className="col-lg-3 col-md-6 col-sm-12"
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "20px",
                  borderRight: index < 3 ? "1px solid #e5e7eb" : "none",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                    width: "100%",
                  }}
                >
                  <div
                    style={{
                      width: "60px",
                      height: "60px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <i
                      className={service.icon}
                      style={{ fontSize: "32px", color: "#8059ca" }}
                    ></i>
                  </div>

                  <div style={{ flex: 1 }}>
                    <h3
                      style={{
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "#1a1a1a",
                        margin: "0 0 5px 0",
                      }}
                    >
                      {service.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        margin: 0,
                        lineHeight: "1.5",
                      }}
                    >
                      {service.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* quick view */}
      {showModal && selectedProduct && (
        <div
          className="modal fade show"
          style={{
            display: "block",
            backgroundColor: "rgba(0,0,0,0.5)",
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: "999999999",
            backdropFilter: "blur(2px)",
            overflowY: "auto",
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div
              className="modal-content shadow-lg"
              style={{
                borderRadius: "12px",
                border: "none",
                overflow: "hidden",
              }}
            >
              <div className="modal-body p-0">
                <div className="row g-0">
                  <div
                    className="col-lg-6 d-flex align-items-center justify-content-center d-lg-block d-none"
                    style={{ height: "350px" }}
                  >
                    <img
                      src={getImageUrl(selectedProduct.tabletdetails?.files?.[0]) || "/assets/img/default-product.png"}
                      alt={selectedProduct.tabletdetails?.name || "Product"}
                      className="rounded"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = "/assets/img/default-product.png";
                      }}
                    />
                  </div>

                  <div className="col-lg-6 bg-white p-3 d-flex flex-column">
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <h5 style={{ fontSize: "18px", margin: 0 }}>
                          {(
                            selectedProduct.tabletdetails?.name || ""
                          ).substring(0, 30) +
                            (selectedProduct.tabletdetails?.name?.length > 30
                              ? "..."
                              : "")}
                        </h5>

                        <button
                          type="button"
                          className="btn-close bg-light"
                          onClick={toggleModal}
                          style={{
                            borderRadius: "50%",
                            width: "25px",
                            height: "25px",
                            fontSize: "12px",
                          }}
                        ></button>
                      </div>
                      <div
                        className="mb-2 pb-2 border-bottom d-flex align-items-center gap-2 flex-wrap"
                        style={{ borderColor: "#e5e7eb" }}
                      >
                        {(() => {
                          const price = parseFloat(selectedProduct.price) || 0;
                          const discountprice =
                            parseFloat(
                              selectedProduct.discountprice ||
                              selectedProduct.discountPrice,
                            ) || null;
                          const effectivePrice =
                            discountprice && discountprice > 0
                              ? discountprice
                              : price;

                          let discount = 0;
                          if (
                            discountprice &&
                            discountprice > 0 &&
                            discountprice !== price
                          ) {
                            if (discountprice > price) {
                              discount = Math.round(
                                ((discountprice - price) / discountprice) * 100,
                              );
                            } else {
                              discount = Math.round(
                                ((price - discountprice) / price) * 100,
                              );
                            }
                          }

                          return discountprice &&
                            discountprice > 0 &&
                            discountprice !== price ? (
                            <>
                              <span
                                style={{
                                  fontSize: "20px",
                                  fontWeight: 700,
                                  color: "#007bff",
                                }}
                              >
                                ₹{effectivePrice.toFixed(2)}
                              </span>
                              <span
                                className="text-muted text-decoration-line-through"
                                style={{ fontSize: "16px" }}
                              >
                                ₹{price.toFixed(2)}
                              </span>
                              {discount > 0 && (
                                <span
                                  className="badge bg-success"
                                  style={{ fontSize: "12px" }}
                                >
                                  {discount}% OFF
                                </span>
                              )}
                            </>
                          ) : (
                            <span
                              style={{
                                fontSize: "20px",
                                fontWeight: 700,
                                color: "#007bff",
                              }}
                            >
                              ₹{effectivePrice.toFixed(2)}
                            </span>
                          );
                        })()}
                      </div>

                      <div className="mb-1">
                        <p
                          dangerouslySetInnerHTML={{
                            __html:
                              (
                                selectedProduct.tabletdetails?.description || ""
                              ).substring(0, 200) +
                              (selectedProduct.tabletdetails?.description
                                ?.length > 200
                                ? "..."
                                : ""),
                          }}
                        />
                      </div>

                      <div className="mb-3">
                        <div
                          style={{
                            backgroundColor: "#f8f9fa",
                            padding: "6px",
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: "8px",
                            }}
                          >
                            <img
                              alt="Vendor"
                              src={
                                getImageUrl(
                                  selectedProduct.vendordetails
                                    ?.bussiness_image?.[0]?.url ||
                                  selectedProduct.vendors?.bussiness_image?.[0]
                                    ?.url ||
                                  "",
                                ) || "/assets/img/default-product.png"
                              }
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                border: "2px solid rgba(125, 46, 255, 0.2)",
                                objectFit: "contain",
                              }}
                              onError={(e) => {
                                e.currentTarget.src = "/assets/img/default-product.png";
                              }}
                            />
                            <div style={{ flex: 1 }}>
                              <div
                                style={{
                                  fontSize: "14px",
                                  fontWeight: 600,
                                  color: "#1a1a1a",
                                  marginBottom: "2px",
                                }}
                              >
                                {selectedProduct.vendordetails?.name ||
                                  selectedProduct.vendors?.name ||
                                  "Vendor"}
                              </div>
                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#6b7280",
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <i
                                  className="fas fa-map-marker-alt"
                                  style={{ fontSize: "10px" }}
                                />
                                <span>
                                  {(
                                    selectedProduct.vendordetails?.address ||
                                    selectedProduct.vendors?.address ||
                                    ""
                                  ).substring(0, 50) +
                                    ((
                                      selectedProduct.vendordetails?.address ||
                                      selectedProduct.vendors?.address ||
                                      ""
                                    )?.length > 50
                                      ? "..."
                                      : "")}
                                </span>
                              </div>
                            </div>
                          </div>
                          {selectedProduct.vendordetails?.phone ||
                            selectedProduct.vendors?.phone ? (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "#6b7280",
                                marginBottom: "4px",
                              }}
                            >
                              <i
                                className="fas fa-phone me-2"
                                style={{ fontSize: "10px" }}
                              />
                              {selectedProduct.vendordetails?.phone ||
                                selectedProduct.vendors?.phone}
                            </div>
                          ) : null}
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginTop: "8px",
                              paddingTop: "8px",
                              borderTop: "1px solid #e0e0e0",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              <i
                                className="fas fa-star text-warning"
                                style={{ fontSize: "10px" }}
                              />
                              <span>
                                User Rating:{" "}
                                {selectedProduct.tabletdetails?.averageRating >
                                  0
                                  ? selectedProduct.tabletdetails.averageRating.toFixed(
                                    1,
                                  )
                                  : "0.0"}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                fontSize: "12px",
                                color: "#6b7280",
                              }}
                            >
                              <i
                                className="fa fa-users text-primary"
                                style={{ fontSize: "10px" }}
                              />
                              <span>
                                Reviews:{" "}
                                {selectedProduct.tabletdetails?.ratingCount > 0
                                  ? `${selectedProduct.tabletdetails.ratingCount}+`
                                  : "0"}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginTop: "4px",
                              fontSize: "12px",
                              color: "#6b7280",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <i
                                className="fas fa-store text-info"
                                style={{ fontSize: "10px" }}
                              />
                              <span>
                                Vendor Rating:{" "}
                                {selectedProduct.vendordetails?.averageRating > 0
                                  ? selectedProduct.vendordetails.averageRating.toFixed(1)
                                  : selectedProduct.vendors?.averageRating > 0
                                    ? selectedProduct.vendors.averageRating.toFixed(1)
                                    : "0.0"}
                              </span>
                            </div>
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                              }}
                            >
                              <i
                                className="fa fa-shopping-bag text-success"
                                style={{ fontSize: "10px" }}
                              />
                              <span>
                                Orders:{" "}
                                {selectedProduct.vendordetails?.ratingCount > 0
                                  ? `${selectedProduct.vendordetails.ratingCount}+`
                                  : selectedProduct.vendors?.ratingCount > 0
                                    ? `${selectedProduct.vendors.ratingCount}+`
                                    : "0"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* BUTTONS */}
                      <div className="d-flex gap-3 flex-wrap mb-3">
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
                          calculatedDiscountPrice={parseFloat(selectedProduct.discountprice || selectedProduct.discountPrice) || null}
                          stock={selectedProduct.stock || (selectedProduct.tabletdetails || selectedProduct).stock || (selectedProduct.vendordetails || selectedProduct.vendors || {}).stock || 999}
                          service={service}
                          handleRentalBookinProcess={handleRentalBookinProcess}
                          handleNavigateToBooking={handleBooking}
                          handleAddLead={handleAddLead}
                          handleOpenConsultationModal={handleConsultationClick}
                          handleOpenAppointmentModal={handleAppointmentClick}
                          handleOpenRideModal=""
                          className="w-100"
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
