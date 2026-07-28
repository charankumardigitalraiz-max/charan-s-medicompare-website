import React, { useState } from "react";
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
    loop: cheaplabtests?.length > 1,
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
        <div
          className="content doctor-content px-3 py-3"
        // style={{ backgroundColor: "#fcfcfc" }}
        >
          <div className="container-fluid bg-[url('/assets/Medicompares%20Background.png')] bg-cover bg-center bg-no-repeat rounded-[12px] p-[20px]">
            <div className="d-flex align-items-center justify-content-between flex-wrap result-wrap gap-3">
              <h2 className="mb-2 top-vendor-badge">
                <i className="fas fa-bolt mx-1"></i>
                Top CheckUp's
              </h2>

              <div className="d-flex align-items-center flex-wrap gap-3">
                <Link
                  to={`/${currentService}/all`}
                  className="top-vendor-badge px-[20px] py-[8px] rounded-[50px] border border-solid border-[#e5e7eb] text-[#8059ca] text-[14px] font-semibold flex items-center gap-[8px] transition-all duration-300"
                >
                  View All
                  <i className="fas fa-arrow-right"></i>
                </Link>
              </div>
            </div>

            <div className="row relative">
              {cheaplabtests.length > 1 && (
                <button
                  className="meq-arrow-btn dental-prev absolute left-[-10px] top-1/2 z-10"
                  aria-label="Previous"
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
              )}
              <div className="px-[20px]">
                <Swiper {...swiperSettings}>
                  {cheaplabtests?.map((test) => {
                    const vendor = test?.businessDetails;
                    const medicine = test?.medicineDetails;
                    const transformedProduct = {
                      ...test,
                      tabletdetails: {
                        _id: medicine?._id || test?._id,
                        slug:
                          medicine?.slug ||
                          test?.slug ||
                          test?.categorySlug ||
                          currentService,
                        name: medicine?.name || test?.name,
                        files: medicine?.files || [],
                        description: medicine?.description || test?.description,
                      },
                    };
                    return (
                      <SwiperSlide key={test?._id}>
                        <div
                          className="slider-card-wrapper p-2"
                          onClick={() => handleProductClick(transformedProduct)}
                        >
                          <div
                            className="health-card"
                            style={{ cursor: "pointer" }}
                          >
                            <div className="card-imgs">
                              <img
                                src={
                                  medicine?.files?.[0]
                                    ? getImageUrl(medicine.files[0])
                                    : "/assets/default.png"
                                }
                                alt={medicine.name}
                                onError={(e) => {
                                  e.target.src = "/assets/default.png";
                                }}
                                style={{ objectFit: "contain" }}
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
                                className="absolute top-[10px] right-[10px] bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-[30px] px-[14px] py-[3px] flex items-center gap-[6px] shadow-[0_4px_12px_rgba(245,158,11,0.4)] z-10 border-[1.5px] border-solid border-white cursor-pointer transition-all duration-300 transform scale-100 hover:scale-[1.12] hover:-translate-y-[2px] hover:shadow-[0_8px_20px_rgba(245,158,11,0.55)]"
                                title="Compare Package"
                              >
                                <i
                                  className="fa-solid fa-hand-pointer text-[13px] text-white rotate-90 inline-block"
                                ></i>
                                <span
                                  className="text-[11px] font-extrabold text-white uppercase tracking-[0.6px]"
                                >
                                  Compare
                                </span>
                              </div>
                            </div>
                            <div className="card-bodyyy">
                              <div className="d-flex justify-content-between align-items-center">
                                <h3 className="titlee text-dark mb-0 text-capitalize">
                                  {medicine?.name?.length > 20
                                    ? medicine.name.slice(0, 20) + "..."
                                    : medicine?.name}
                                </h3>

                                <div
                                  className="d-flex align-items-center justify-content-end"
                                  style={{ minWidth: "80px", fontSize: "12px" }}
                                >
                                  <i className="fa fa-star text-warning me-1"></i>
                                  <span className="me-1">
                                    {medicine?.averageRating?.toFixed(1) > 0
                                      ? medicine.averageRating?.toFixed(1)
                                      : 0}
                                  </span>

                                  <i className="fa fa-users me-1 text-primary"></i>
                                  <span>
                                    (
                                    {medicine?.ratingCount > 0
                                      ? `${medicine.ratingCount}+`
                                      : 0}
                                    )
                                  </span>
                                </div>
                              </div>

                              {medicine?.reportsDuration && (
                                <div className="report-timee">
                                  <i className="fa-regular fa-file-lines" />{" "}
                                  Reports in
                                  <small> {medicine?.reportsDuration}</small>
                                </div>
                              )}

                              <div className="price-section d-flex align-items-center flex-wrap gap-2 pb-2">
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
                                      <span className="current-price text-dark">
                                        ₹{displayPrice.toLocaleString("en-IN")}
                                      </span>

                                      {showDiscount && (
                                        <>
                                          <span className="old-price">
                                            ₹
                                            {originalPrice.toLocaleString(
                                              "en-IN",
                                            )}
                                          </span>
                                          <span
                                            className="discountts bg-[#F97316] text-[12px]"
                                          >
                                            {discountPercent}% OFF
                                          </span>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>

                              <VendorActions
                                bookingType={
                                  vendor?.bookingType ||
                                  service?.categoryType ||
                                  "cart"
                                }
                                med={test.medicineDetails || test}
                                vendor={vendor}
                                effectiveVariantId={null}
                                price={test.price || 0}
                                stock={test.stock || 999}
                                service={test?.medicineDetails?.category?.fixedType || "diagnostics"}
                                calculatedDiscountPrice={
                                  test?.discountprice ||
                                  test?.discountPrice ||
                                  null
                                }
                                handleRentalBookinProcess={handleRentalBookinProcess}
                                handleNavigateToBooking={handleBooking}
                                handleAddLead={handleAddLead}
                                handleOpenConsultationModal={handleConsultationClick}
                                handleOpenAppointmentModal={handleAppointmentClick}
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
                                  className="mt-[12px] border-t border-solid border-[#0000002e]"
                                >
                                  <div
                                    className="d-flex align-items-center footers pt-[10px] pb-0 px-0 cursor-pointer transition-all duration-200 hover:opacity-80 hover:translate-x-[4px]"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const vendorId =
                                        vendor?.slug ||
                                        vendor?.vendorId ||
                                        vendor?._id;
                                      if (vendorId) {
                                        const name =
                                          vendor?.bussinessdetails?.name ||
                                          vendor?.name ||
                                          "Vendor Store";
                                        const vendorSlug = name
                                          .toLowerCase()
                                          .replace(/\s+/g, "-")
                                          .replace(/[^a-z0-9-]/g, "");
                                        sessionStorage.setItem(
                                          "vendorId",
                                          vendorId,
                                        );
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
                                      className="w-[56px] h-[56px] rounded-[8px] overflow-hidden bg-white"
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
                                        className="w-full h-full object-contain"
                                      />
                                    </div>

                                    <div className="flex-grow-1">
                                      <div className="flex items-center">
                                        <h6
                                          className="text-[13px] font-semibold"
                                        >
                                          {vendor.name}
                                        </h6>
                                        {test?.averageRating > 0 && test?.ratingCount > 0 && (
                                          <div
                                            className="flex items-center gap-[4px] text-[10px] text-[#666] mt-[2px] mb-[4px]"
                                          >
                                            <i
                                              className="fas fa-star text-[#ffc107] text-[9px]"
                                            ></i>
                                            <span className="font-semibold">
                                              {test.averageRating.toFixed(1)}
                                            </span>
                                            <span className="text-[#999]">
                                              ({test.ratingCount}+)
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      <div className="d-flex align-items-center gap-2 text-dark">
                                        <i
                                          className="fa-solid fa-location-dot text-[13px] text-[#8059ca]"
                                        ></i>
                                        <span>
                                          {vendor.address?.length > 22
                                            ? vendor.address.slice(0, 22) +
                                            "..."
                                            : vendor.address ||
                                            "Address not available"}
                                        </span>
                                      </div>
                                      {test?.distanceInKm && (
                                        <div
                                          className="d-flex align-items-center gap-2 text-muted"
                                          style={{ marginTop: "2px" }}
                                        >
                                          <i
                                            className="isax isax-route-square"
                                            style={{
                                              fontSize: "12px",
                                              color: "#8059ca",
                                            }}
                                          ></i>

                                          <span style={{ fontSize: "12px" }}>
                                            {parseFloat(
                                              test.distanceInKm,
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
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
              {cheaplabtests.length > 1 && (
                <button
                  className="meq-arrow-btn dental-next absolute right-[-10px] top-1/2 z-10"
                  aria-label="Next"
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid my-3">
        <div className="row g-3">
          <div className="col-lg-6 col-md-6">
            <div
              className="d-flex align-items-center p-4 rounded bg-gradient-to-br from-[#F8F5FE] to-[#F2EDFE] border border-solid border-[rgba(125,46,255,0.1)] cursor-pointer transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_6px_20px_rgba(125,46,255,0.15)] hover:border-[rgba(125,46,255,0.3)]"
            >
              <div
                className="flex-shrink-0 d-flex align-items-center justify-content-center position-relative w-[70px] h-[70px] bg-gradient-to-br from-[#8059ca] to-[#822BD4] rounded-[16px] shadow-[0_4px_12px_rgba(125,46,255,0.3)]"
              >
                {/* Animated pulsing ring */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "70px",
                    height: "70px",
                    borderRadius: "16px",
                    border: "2px solid rgba(125, 46, 255, 0.4)",
                    animation: "pulse-ring 2s ease-in-out infinite",
                  }}
                ></div>
                {/* Upload icon with animation */}
                <i
                  className="fa-solid fa-cloud-arrow-up"
                  style={{
                    fontSize: "32px",
                    color: "#ffffff",
                    position: "relative",
                    zIndex: 2,
                    animation: "upload-bounce 2s ease-in-out infinite",
                    transformOrigin: "center",
                  }}
                ></i>
                {/* Animated particles */}
                <div
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    width: "24px",
                    height: "24px",
                    background: "#FFCA18",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(255, 202, 24, 0.4)",
                    animation: "pulse-badge 1.5s ease-in-out infinite",
                    zIndex: 3,
                  }}
                >
                  <i
                    className="isax isax-add"
                    style={{
                      fontSize: "12px",
                      color: "#ffffff",
                      fontWeight: "bold",
                      animation: "rotate-icon 3s linear infinite",
                    }}
                  ></i>
                </div>
                {/* Animated sparkles */}
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "4px",
                    fontSize: "16px",
                    animation: "sparkle 2s ease-in-out infinite",
                    animationDelay: "0s",
                  }}
                >
                  ✨
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    fontSize: "16px",
                    animation: "sparkle 2s ease-in-out infinite",
                    animationDelay: "1s",
                  }}
                >
                  ✨
                </div>
                {/* CSS Animations */}
                <style>{`
                      @keyframes pulse-ring {
                        0% {
                          transform: translate(-50%, -50%) scale(1);
                          opacity: 1;
                        }
                        50% {
                          transform: translate(-50%, -50%) scale(1.15);
                          opacity: 0.6;
                        }
                        100% {
                          transform: translate(-50%, -50%) scale(1);
                          opacity: 1;
                        }
                      }
                      @keyframes upload-bounce {
                        0%, 100% {
                          transform: translateY(0) scale(1);
                        }
                        25% {
                          transform: translateY(-4px) scale(1.05);
                        }
                        50% {
                          transform: translateY(0) scale(1);
                        }
                        75% {
                          transform: translateY(-2px) scale(1.02);
                        }
                      }
                      @keyframes pulse-badge {
                        0%, 100% {
                          transform: scale(1);
                          box-shadow: 0 2px 8px rgba(255, 202, 24, 0.4);
                        }
                        50% {
                          transform: scale(1.1);
                          box-shadow: 0 4px 16px rgba(255, 202, 24, 0.6);
                        }
                      }
                      @keyframes rotate-icon {
                        0% {
                          transform: rotate(0deg);
                        }
                        100% {
                          transform: rotate(360deg);
                        }
                      }
                      @keyframes sparkle {
                        0%, 100% {
                          opacity: 0.6;
                          transform: scale(1);
                        }
                        50% {
                          opacity: 1;
                          transform: scale(1.2);
                        }
                      }
                    `}</style>
              </div>
              <div className="ms-3 flex-grow-1">
                <h6
                  className="mb-0 fw-semibold"
                  style={{ fontSize: "17px", color: "#1a1a1a" }}
                >
                  Upload and Book
                </h6>
                <p
                  className="mb-0 mt-1"
                  style={{ fontSize: "13px", color: "#666", lineHeight: "1.4" }}
                >
                  Upload prescription & place booking
                </p>
              </div>
              <div
                className="flex-shrink-0"
                style={{
                  width: "44px",
                  height: "44px",
                  background:
                    "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 3px 10px rgba(125, 46, 255, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow =
                    "0 5px 15px rgba(125, 46, 255, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 3px 10px rgba(125, 46, 255, 0.3)";
                }}
              >
                <i
                  className="fa-solid fa-cloud-arrow-up"
                  style={{
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: "600",
                  }}
                ></i>
              </div>
            </div>
          </div>

          <div className="col-lg-6 col-md-6">
            <div
              className="d-flex align-items-center p-4 rounded bg-gradient-to-br from-[#EAF3FF] to-[#D4E8FF] border border-solid border-[rgba(17,14,253,0.1)] cursor-pointer transition-all duration-300 hover:-translate-y-[3px] hover:shadow-[0_6px_20px_rgba(17,14,253,0.15)] hover:border-[rgba(17,14,253,0.3)]"
            >
              <div
                className="flex-shrink-0 d-flex align-items-center justify-content-center position-relative w-[70px] h-[70px] bg-gradient-to-br from-[#110EFD] to-[#3538CD] rounded-[16px] shadow-[0_4px_12px_rgba(17,14,253,0.3)]"
              >
                {/* Animated pulsing ring */}
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "70px",
                    height: "70px",
                    borderRadius: "16px",
                    border: "2px solid rgba(17, 14, 253, 0.4)",
                    animation: "pulse-ring-view 2s ease-in-out infinite",
                  }}
                ></div>
                {/* View icon with animation */}
                <i
                  className="fa-solid fa-eye"
                  style={{
                    fontSize: "32px",
                    color: "#ffffff",
                    position: "relative",
                    zIndex: 2,
                    animation: "view-pulse 2s ease-in-out infinite",
                    transformOrigin: "center",
                  }}
                ></i>
                {/* Animated badge */}
                <div
                  style={{
                    position: "absolute",
                    right: "-8px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: "32px",
                    height: "32px",
                    background: "#ffffff",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
                    animation: "badge-bounce 1.5s ease-in-out infinite",
                    zIndex: 3,
                  }}
                >
                  <i
                    className="fa-solid fa-file-lines"
                    style={{
                      fontSize: "16px",
                      color: "#110EFD",
                      animation: "document-shake 2s ease-in-out infinite",
                    }}
                  ></i>
                </div>
                {/* Animated sparkles */}
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    left: "4px",
                    fontSize: "16px",
                    animation: "sparkle-view 2s ease-in-out infinite",
                    animationDelay: "0s",
                  }}
                >
                  ✨
                </div>
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    fontSize: "16px",
                    animation: "sparkle-view 2s ease-in-out infinite",
                    animationDelay: "1s",
                  }}
                >
                  ✨
                </div>
                {/* CSS Animations */}
                <style>{`
                      @keyframes pulse-ring-view {
                        0% {
                          transform: translate(-50%, -50%) scale(1);
                          opacity: 1;
                        }
                        50% {
                          transform: translate(-50%, -50%) scale(1.15);
                          opacity: 0.6;
                        }
                        100% {
                          transform: translate(-50%, -50%) scale(1);
                          opacity: 1;
                        }
                      }
                      @keyframes view-pulse {
                        0%, 100% {
                          transform: scale(1);
                          opacity: 1;
                        }
                        25% {
                          transform: scale(1.1);
                          opacity: 0.9;
                        }
                        50% {
                          transform: scale(1);
                          opacity: 1;
                        }
                        75% {
                          transform: scale(1.05);
                          opacity: 0.95;
                        }
                      }
                      @keyframes badge-bounce {
                        0%, 100% {
                          transform: translateY(-50%) scale(1);
                          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                        }
                        50% {
                          transform: translateY(-50%) scale(1.15) translateX(-2px);
                          box-shadow: 0 4px 12px rgba(17, 14, 253, 0.3);
                        }
                      }
                      @keyframes document-shake {
                        0%, 100% {
                          transform: rotate(0deg);
                        }
                        25% {
                          transform: rotate(-5deg);
                        }
                        75% {
                          transform: rotate(5deg);
                        }
                      }
                      @keyframes sparkle-view {
                        0%, 100% {
                          opacity: 0.6;
                          transform: scale(1);
                        }
                        50% {
                          opacity: 1;
                          transform: scale(1.2);
                        }
                      }
                    `}</style>
              </div>
              <div className="ms-3 flex-grow-1">
                <h6
                  className="mb-0 fw-semibold"
                  style={{ fontSize: "17px", color: "#1a1a1a" }}
                >
                  View Reports in My Bookings
                </h6>
                <p
                  className="mb-0 mt-1"
                  style={{ fontSize: "13px", color: "#666", lineHeight: "1.4" }}
                >
                  Access your diagnostic test reports
                </p>
              </div>
              <div
                className="flex-shrink-0"
                style={{
                  width: "44px",
                  height: "44px",
                  background:
                    "linear-gradient(135deg, #110EFD 0%, #3538CD 100%)",
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 3px 10px rgba(17, 14, 253, 0.3)",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.1)";
                  e.currentTarget.style.boxShadow =
                    "0 5px 15px rgba(17, 14, 253, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow =
                    "0 3px 10px rgba(17, 14, 253, 0.3)";
                }}
              >
                <i
                  className="fa-solid fa-eye"
                  style={{
                    color: "#ffffff",
                    fontSize: "22px",
                    fontWeight: "600",
                  }}
                ></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section
        className="py-3"
        style={{
          backgroundColor: "#E8E4F5",
          backgroundImage: "url('/assets/Medicompares%20Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container-fluid">
          <div
            className="card border-0"
            style={{
              borderRadius: "20px",
              background: "transparent",
              padding: "30px 40px",
              boxShadow: "none",
            }}
          >
            <div className="row align-items-center">
              {/* Title Section */}
              <div className="col-lg-3 col-md-12 mb-md-4 mb-lg-0">
                <h3 className="mb-0 diagnostic-booking-heading">
                  <span className="diagnostic-booking-heading__line">
                    How to book
                  </span>
                  <br />
                  <span className="diagnostic-booking-heading__line">
                    a Diagnostic test
                  </span>
                  <br />
                  <span className="diagnostic-booking-heading__accent">
                    in 3 simple steps
                  </span>
                </h3>
              </div>

              {/* Steps Section */}
              <div className="col-lg-9 col-md-12">
                <div className="row g-4 position-relative">
                  {/* Step 1 */}
                  <div className="col-md-4 position-relative">
                    <div className="d-flex flex-column align-items-center text-center h-100">
                      {/* Step Badge */}
                      <div
                        className="mb-3"
                        style={{
                          background:
                            "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
                          color: "#ffffff",
                          padding: "8px 20px",
                          borderRadius: "25px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block",
                          boxShadow: "0 4px 12px rgba(125, 46, 255, 0.3)",
                          letterSpacing: "0.5px",
                        }}
                      >
                        STEP 1
                      </div>

                      {/* Icon Container with Gradient Background */}
                      <div
                        className="mb-3"
                        style={{
                          width: "110px",
                          height: "110px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          background:
                            "linear-gradient(135deg, #F8F5FE 0%, #F2EDFE 100%)",
                          borderRadius: "24px",
                          boxShadow: "0 8px 24px rgba(125, 46, 255, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(-5px) scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 32px rgba(125, 46, 255, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 24px rgba(125, 46, 255, 0.2)";
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          <i
                            className="isax isax-mobile"
                            style={{
                              fontSize: "50px",
                              background:
                                "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                            }}
                          ></i>
                          <div
                            style={{
                              position: "absolute",
                              bottom: "12px",
                              right: "12px",
                              width: "45px",
                              height: "32px",
                              background:
                                "linear-gradient(135deg, #FFCA18 0%, #FFB300 100%)",
                              borderRadius: "8px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(255, 202, 24, 0.4)",
                              border: "2px solid #ffffff",
                            }}
                          >
                            <span
                              style={{
                                fontSize: "9px",
                                fontWeight: "700",
                                color: "#1a1a1a",
                              }}
                            >
                              BOOK
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h5
                        className="mb-2"
                        style={{
                          fontSize: "20px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                        }}
                      >
                        Book Appointment
                      </h5>

                      {/* Description */}
                      <p
                        className="mb-0"
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          lineHeight: "1.6",
                        }}
                      >
                        Select a Test/Package and book an appointment on our
                        platform
                      </p>
                    </div>

                    {/* Connector Line */}
                    <div
                      className="d-none d-md-block"
                      style={{
                        position: "absolute",
                        top: "70px",
                        right: "-25px",
                        width: "50px",
                        height: "3px",
                        background:
                          "linear-gradient(90deg, #8059ca 0%, #110EFD 50%, #04BD6C 100%)",
                        borderRadius: "2px",
                        zIndex: 1,
                        boxShadow: "0 2px 8px rgba(125, 46, 255, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          right: "-6px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "0",
                          height: "0",
                          borderLeft: "8px solid #04BD6C",
                          borderTop: "6px solid transparent",
                          borderBottom: "6px solid transparent",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 2 */}
                  <div className="col-md-4 position-relative">
                    <div className="d-flex flex-column align-items-center text-center h-100">
                      {/* Step Badge */}
                      <div
                        className="mb-3"
                        style={{
                          background:
                            "linear-gradient(135deg, #04BD6C 0%, #00A86B 100%)",
                          color: "#ffffff",
                          padding: "8px 20px",
                          borderRadius: "25px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block",
                          boxShadow: "0 4px 12px rgba(4, 189, 108, 0.3)",
                          letterSpacing: "0.5px",
                        }}
                      >
                        STEP 2
                      </div>

                      {/* Icon Container with Gradient Background */}
                      <div
                        className="mb-3"
                        style={{
                          width: "110px",
                          height: "110px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          background:
                            "linear-gradient(135deg, #F1FAF3 0%, #E8FFF2 100%)",
                          borderRadius: "24px",
                          boxShadow: "0 8px 24px rgba(4, 189, 108, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(-5px) scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 32px rgba(4, 189, 108, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 24px rgba(4, 189, 108, 0.2)";
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          <i
                            className="isax isax-hospital"
                            style={{
                              fontSize: "50px",
                              background:
                                "linear-gradient(135deg, #04BD6C 0%, #00A86B 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                            }}
                          ></i>
                          <div
                            style={{
                              position: "absolute",
                              top: "12px",
                              right: "12px",
                              width: "28px",
                              height: "28px",
                              background:
                                "linear-gradient(135deg, #FFCA18 0%, #FFB300 100%)",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(255, 202, 24, 0.4)",
                              border: "2px solid #ffffff",
                            }}
                          >
                            <i
                              className="isax isax-location"
                              style={{
                                fontSize: "16px",
                                color: "#1a1a1a",
                              }}
                            ></i>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h5
                        className="mb-2"
                        style={{
                          fontSize: "20px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                        }}
                      >
                        Visit Diagnostics Center
                      </h5>

                      {/* Description */}
                      <p
                        className="mb-0"
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          lineHeight: "1.6",
                        }}
                      >
                        Access reliable testing centers with ease
                      </p>
                    </div>

                    {/* Connector Line */}
                    <div
                      className="d-none d-md-block"
                      style={{
                        position: "absolute",
                        top: "70px",
                        right: "-25px",
                        width: "50px",
                        height: "3px",
                        background:
                          "linear-gradient(90deg, #04BD6C 0%, #110EFD 50%, #FFCA18 100%)",
                        borderRadius: "2px",
                        zIndex: 1,
                        boxShadow: "0 2px 8px rgba(4, 189, 108, 0.3)",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          right: "-6px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          width: "0",
                          height: "0",
                          borderLeft: "8px solid #FFCA18",
                          borderTop: "6px solid transparent",
                          borderBottom: "6px solid transparent",
                        }}
                      ></div>
                    </div>
                  </div>

                  {/* Step 3 */}
                  <div className="col-md-4">
                    <div className="d-flex flex-column align-items-center text-center h-100">
                      {/* Step Badge */}
                      <div
                        className="mb-3"
                        style={{
                          background:
                            "linear-gradient(135deg, #110EFD 0%, #3538CD 100%)",
                          color: "#ffffff",
                          padding: "8px 20px",
                          borderRadius: "25px",
                          fontSize: "12px",
                          fontWeight: "600",
                          display: "inline-block",
                          boxShadow: "0 4px 12px rgba(17, 14, 253, 0.3)",
                          letterSpacing: "0.5px",
                        }}
                      >
                        STEP 3
                      </div>

                      {/* Icon Container with Gradient Background */}
                      <div
                        className="mb-3"
                        style={{
                          width: "110px",
                          height: "110px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          background:
                            "linear-gradient(135deg, #EAF3FF 0%, #D4E8FF 100%)",
                          borderRadius: "24px",
                          boxShadow: "0 8px 24px rgba(17, 14, 253, 0.2)",
                          transition: "all 0.3s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(-5px) scale(1.05)";
                          e.currentTarget.style.boxShadow =
                            "0 12px 32px rgba(17, 14, 253, 0.3)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform =
                            "translateY(0) scale(1)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 24px rgba(17, 14, 253, 0.2)";
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            position: "relative",
                          }}
                        >
                          <i
                            className="isax isax-document-download"
                            style={{
                              fontSize: "50px",
                              background:
                                "linear-gradient(135deg, #110EFD 0%, #3538CD 100%)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                              backgroundClip: "text",
                            }}
                          ></i>
                          <div
                            style={{
                              position: "absolute",
                              top: "18px",
                              right: "18px",
                              width: "40px",
                              height: "40px",
                              background:
                                "linear-gradient(135deg, #04BD6C 0%, #00A86B 100%)",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(4, 189, 108, 0.4)",
                              border: "2px solid #ffffff",
                            }}
                          >
                            <i
                              className="isax isax-tick-circle"
                              style={{
                                fontSize: "22px",
                                color: "#ffffff",
                              }}
                            ></i>
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <h5
                        className="mb-2"
                        style={{
                          fontSize: "20px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                        }}
                      >
                        Fast & Accurate Results
                      </h5>

                      {/* Description */}
                      <p
                        className="mb-0"
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          lineHeight: "1.6",
                        }}
                      >
                        Get reports in 12-24 hrs. View and download from the app
                        anytime
                      </p>
                    </div>
                  </div>
                </div>
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

      <section
        className="py-3"
        style={{
          backgroundColor: "#ffffff",
          position: "relative",
          overflow: "hidden",
        }}
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
          className="container-fluid"
          style={{ position: "relative", zIndex: 1 }}
        >
          <div className="text-center mb-4">
            <h2
              style={{
                fontSize: "36px",
                fontWeight: "600",
                color: "#1a1a1a",
                marginBottom: "12px",
                lineHeight: "1.2",
              }}
            >
              Best Practices We Offer
            </h2>
          </div>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "20px",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "220px",
                minWidth: "200px",
              }}
            >
              <div
                className="text-center h-100"
                style={{
                  padding: "30px 20px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(125, 46, 255, 0.15)";
                  e.currentTarget.style.borderColor = "#8059ca";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#e9ecef";
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    borderRadius: "50%",
                    border: "2px solid #110EFD",
                    position: "relative",
                    boxShadow: "0 2px 8px rgba(17, 14, 253, 0.15)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "70px",
                      height: "70px",
                    }}
                  >
                    <i
                      className="fa-solid fa-shield-halved"
                      style={{
                        fontSize: "56px",
                        color: "#110EFD",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    ></i>
                    <i
                      className="fa-solid fa-heart-pulse"
                      style={{
                        fontSize: "32px",
                        color: "#04BD6C",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        zIndex: 1,
                      }}
                    ></i>
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "10px",
                  }}
                >
                  100% Safe & Secure
                </h5>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  We take all safety and hygiene measures to keep our customers
                  safe
                </p>
              </div>
            </div>

            {/* Practice 2: Online Reports */}
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "220px",
                minWidth: "200px",
              }}
            >
              <div
                className="text-center h-100"
                style={{
                  padding: "30px 20px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(17, 14, 253, 0.15)";
                  e.currentTarget.style.borderColor = "#110EFD";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#e9ecef";
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    borderRadius: "50%",
                    border: "2px solid #110EFD",
                    position: "relative",
                    boxShadow: "0 2px 8px rgba(17, 14, 253, 0.15)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "70px",
                      height: "70px",
                    }}
                  >
                    <i
                      className="fa-solid fa-file-lines"
                      style={{
                        fontSize: "56px",
                        color: "#110EFD",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    ></i>
                    <div
                      style={{
                        position: "absolute",
                        top: "2px",
                        right: "2px",
                        width: "20px",
                        height: "20px",
                        background: "#04BD6C",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #ffffff",
                        zIndex: 2,
                      }}
                    >
                      <i
                        className="fa-solid fa-heart-pulse"
                        style={{
                          fontSize: "12px",
                          color: "#ffffff",
                        }}
                      ></i>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "2px",
                        right: "2px",
                        width: "18px",
                        height: "18px",
                        background: "#110EFD",
                        borderRadius: "4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #ffffff",
                        zIndex: 2,
                      }}
                    >
                      <i
                        className="fa-solid fa-certificate"
                        style={{
                          fontSize: "10px",
                          color: "#ffffff",
                        }}
                      ></i>
                    </div>
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "10px",
                  }}
                >
                  Online Reports
                </h5>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  You can download your reports online
                </p>
              </div>
            </div>

            {/* Practice 3: Home Sample Collection */}
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "220px",
                minWidth: "200px",
              }}
            >
              <div
                className="text-center h-100"
                style={{
                  padding: "30px 20px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(4, 189, 108, 0.15)";
                  e.currentTarget.style.borderColor = "#04BD6C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#e9ecef";
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    borderRadius: "50%",
                    border: "2px solid #04BD6C",
                    position: "relative",
                    boxShadow: "0 2px 8px rgba(4, 189, 108, 0.15)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "70px",
                      height: "70px",
                    }}
                  >
                    <i
                      className="fa-solid fa-house"
                      style={{
                        fontSize: "56px",
                        color: "#04BD6C",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    ></i>
                    <div
                      style={{
                        position: "absolute",
                        bottom: "-2px",
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "28px",
                        height: "28px",
                        background: "#04BD6C",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "2px solid #ffffff",
                        boxShadow: "0 2px 6px rgba(4, 189, 108, 0.3)",
                        zIndex: 2,
                      }}
                    >
                      <i
                        className="fa-solid fa-briefcase-medical"
                        style={{
                          fontSize: "16px",
                          color: "#ffffff",
                        }}
                      ></i>
                    </div>
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "10px",
                  }}
                >
                  Home Sample Collection
                </h5>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  Our expert phlebotomists will come and collect your sample
                </p>
              </div>
            </div>

            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "220px",
                minWidth: "200px",
              }}
            >
              <div
                className="text-center h-100"
                style={{
                  padding: "30px 20px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(255, 202, 24, 0.15)";
                  e.currentTarget.style.borderColor = "#FFCA18";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#e9ecef";
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    borderRadius: "50%",
                    border: "2px solid #FFCA18",
                    position: "relative",
                    boxShadow: "0 2px 8px rgba(255, 202, 24, 0.15)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "70px",
                      height: "70px",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#FFCA18",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        boxShadow: "0 2px 8px rgba(255, 202, 24, 0.3)",
                      }}
                    >
                      <i
                        className="fa-solid fa-star"
                        style={{
                          fontSize: "32px",
                          color: "#ffffff",
                        }}
                      ></i>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "-5px",
                        left: "-5px",
                        width: "80px",
                        height: "80px",
                        border: "2px solid #FFCA18",
                        borderRadius: "50%",
                        opacity: 0.4,
                      }}
                    ></div>
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "10px",
                  }}
                >
                  MediCompares Advantage
                </h5>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  Enjoy upto 75% discount on diagnostic tests and health
                  packages
                </p>
              </div>
            </div>

            {/* Practice 5: Competitive Prices */}
            <div
              style={{
                flex: "1 1 200px",
                maxWidth: "220px",
                minWidth: "200px",
              }}
            >
              <div
                className="text-center h-100"
                style={{
                  padding: "30px 20px",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #e9ecef",
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)";
                  e.currentTarget.style.boxShadow =
                    "0 8px 20px rgba(125, 46, 255, 0.15)";
                  e.currentTarget.style.borderColor = "#8059ca";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow =
                    "0 2px 8px rgba(0, 0, 0, 0.05)";
                  e.currentTarget.style.borderColor = "#e9ecef";
                }}
              >
                <div
                  style={{
                    width: "100px",
                    height: "100px",
                    margin: "0 auto 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#ffffff",
                    borderRadius: "50%",
                    border: "2px solid #8059ca",
                    position: "relative",
                    boxShadow: "0 2px 8px rgba(125, 46, 255, 0.15)",
                  }}
                >
                  <div
                    style={{
                      position: "relative",
                      width: "70px",
                      height: "70px",
                    }}
                  >
                    <div
                      style={{
                        width: "60px",
                        height: "60px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: "#8059ca",
                        borderRadius: "50%",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        boxShadow: "0 2px 8px rgba(125, 46, 255, 0.3)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "28px",
                          fontWeight: "600",
                          color: "#ffffff",
                        }}
                      >
                        %
                      </span>
                    </div>
                    <div
                      style={{
                        position: "absolute",
                        top: "-5px",
                        left: "-5px",
                        width: "80px",
                        height: "80px",
                        border: "2px solid #8059ca",
                        borderRadius: "50%",
                        opacity: 0.4,
                      }}
                    ></div>
                  </div>
                </div>
                <h5
                  style={{
                    fontSize: "18px",
                    fontWeight: "600",
                    color: "#1a1a1a",
                    marginBottom: "10px",
                  }}
                >
                  Competitive Prices
                </h5>
                <p
                  style={{
                    fontSize: "12px",
                    color: "#666",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  We offer best prices on our diagnostic tests and health
                  packages
                </p>
              </div>
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
