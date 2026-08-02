import { useNavigate, useParams } from "react-router-dom";
import { FaRegShareSquare, FaHeart } from "react-icons/fa";
import { IoIosHeartEmpty } from "react-icons/io";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../../Apiservice.jsx";
import { getImageUrl } from "../../../../utils/index";
import toast from "react-hot-toast";
import { useCart } from "../../../../hooks/useCart.js";
import { useAddToCart } from "../../../../hooks/useAddToCart.js";
import CartQuantityControls from "../../../../components/ui/CartQuantityControls.jsx";
import LeadModal from "./LeadModal.jsx";
import RentModal from "./RentModal.jsx";
import ConsultationModal from "./ConsultationModal.jsx";
import AppointmentModal from "./AppointmentModal.jsx";
import { useState } from "react";

const GenericProducts = ({
  relatedproducts = [],
  service,
  onShareClick,
  onFavoriteToggle,
  isMobile = false,
  isLoggedIn = false,
  userProfile = null,
}) => {
  const navigate = useNavigate();
  const params = useParams();
  const { getCartQuantity, incrementItem, decrementItem } = useCart();
  const { addToCart } = useAddToCart();

  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentModalData, setCurrentModalData] = useState(null);

  // Form data states for modals
  const [rentalFormData, setRentalFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
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
  const [leadFormData, setLeadFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    policyNumber: "",
    relation: "",
  });

  // Form change handlers
  const handleRentalFormChange = (e) => {
    const { name, value } = e.target;
    setRentalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsultationFormChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppointmentFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeadFormChange = (e) => {
    const { name, value } = e.target;
    setLeadFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorClick = (vendor) => {
    const vendorId =
      vendor?._id ||
      vendor?.businessdetails?._id ||
      vendor?.bussinessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      const name =
        vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
      const vendorSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  const hasValidImage = (product) => {
    const tablet = product?.tablet || {};

    // Check tablet level imageUrl
    if (tablet.imageUrl && Array.isArray(tablet.imageUrl) && tablet.imageUrl.length > 0) {
      return true;
    }

    // Check variant level imageUrls
    if (tablet.variant && Array.isArray(tablet.variant)) {
      for (const variant of tablet.variant) {
        if (variant.imageUrl && Array.isArray(variant.imageUrl) && variant.imageUrl.length > 0) {
          return true;
        }
      }
    }

    return false;
  };

  const validProducts = relatedproducts.filter(product => hasValidImage(product));

  if (!validProducts || validProducts.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: isMobile ? "0px" : "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <div
          style={{
            fontSize: "16px",
            fontWeight: "600",
            color: "#191C1F",
          }}
        >
          Generic Products
        </div>

        <div
          style={{
            fontSize: "14px",
            fontWeight: "500",
            color: "#8059ca",
            cursor: "pointer",
          }}
          onClick={() => {
            const currentService = service || params.service || "medicine";
            navigate(`/${currentService}/all`);
          }}
        >
          View All
        </div>
      </div>

      <div
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          gap: "16px",
          paddingBottom: "8px",
          scrollbarWidth: "thin",
          scrollbarColor: "#8059ca #f0f0f0",
          WebkitOverflowScrolling: "touch",
          alignItems: "stretch",
        }}
        className="related-products-scroll"
      >
        {validProducts.map((product, index) => {
          const firstVariant = product?.tablet?.variant?.[0];
          const firstVendor = product?.vendors?.[0];
          const variantImageFile =
            firstVariant?.files?.[0] ||
            firstVariant?.frontImage?.[0] ||
            product?.tablet?.files?.[0] ||
            null;

          const variantImageUrl =
            firstVariant?.imageUrl?.[0] ||
            product?.tablet?.imageUrl?.[0] ||
            null;

          const allImageFiles = variantImageFile ? [variantImageFile] : (variantImageUrl ? [variantImageUrl] : []);

          const variantImage = allImageFiles[0]
            ? getImageUrl(allImageFiles[0])
            : "/assets/default.png";
          const vendorImage =
            getImageUrl(firstVendor?.bussinessdetails?.bussiness_image?.url) ||
            "/assets/default.png";
          const vendorName = firstVendor?.bussinessdetails?.name || "N/A";
          const bookingType =
            firstVendor?.bookingType || firstVendor?.bookingtype || null;
          const isVariant = !!firstVariant;
          const basePrice = isVariant
            ? (firstVendor?.variant?.[0]?.price ??
              firstVendor?.price ??
              firstVariant?.price ??
              product?.tablet?.price ??
              0)
            : (firstVendor?.price ?? product?.tablet?.price ?? 0);

          const discountPrice = isVariant
            ? (firstVendor?.variant?.[0]?.discountprice ??
              firstVendor?.variant?.[0]?.discountPrice ??
              firstVendor?.discountprice ??
              firstVendor?.discountPrice ??
              null)
            : (firstVendor?.discountprice ??
              firstVendor?.discountPrice ??
              null);
          const hasValidDiscount =
            discountPrice && discountPrice > 0 && discountPrice < basePrice;
          const finalPrice = hasValidDiscount ? discountPrice : basePrice;
          const originalPrice = hasValidDiscount ? basePrice : null;
          let discountPercent = 0;
          if (hasValidDiscount) {
            discountPercent = Math.round(
              ((basePrice - discountPrice) / basePrice) * 100,
            );
          }

          const stock = isVariant
            ? (firstVendor?.variant?.[0]?.stock ?? firstVendor?.stock ?? 0)
            : (firstVendor?.stock ?? 0);

          const serviceBookingTypes = [
            "consultation",
            "appointment",
            "ride",
            "rentals",
            "slots",
            "lead",
            "leads",
            "booking",
            "rentals_addtocarts",
            "cart",
          ];
          const isServiceTypeForStock =
            serviceBookingTypes.includes(bookingType);
          const isInStock = isServiceTypeForStock ? true : stock > 0;
          const effectiveVariantId = firstVariant?._id || null;
          const quantity = getCartQuantity(
            firstVendor?._id || firstVendor?.vendorId,
            product?.tablet?._id || product?._id,
            effectiveVariantId,
          );
          let maxStock = 999;
          if (isVariant && effectiveVariantId) {
            const matchedVendorVariant = firstVendor?.variant?.find(
              (v) =>
                v.variantId === effectiveVariantId ||
                v._id === effectiveVariantId,
            );
            if (matchedVendorVariant && matchedVendorVariant.isStock) {
              maxStock = matchedVendorVariant.stock ?? 0;
            } else if (
              matchedVendorVariant &&
              matchedVendorVariant.stock !== undefined
            ) {
              maxStock = matchedVendorVariant.stock ?? 999;
            } else {
              const vendorStock = firstVendor?.stock;
              maxStock =
                vendorStock !== undefined && vendorStock !== null
                  ? vendorStock
                  : 999;
            }
          } else {
            const vendorStock = firstVendor?.stock;
            maxStock =
              vendorStock !== undefined && vendorStock !== null
                ? vendorStock
                : 999;
          }

          const vendorAddress = firstVendor?.bussinessdetails?.address || "N/A";
          const composition = product?.tablet?.compositions || "N/A";
          const isFavorite = product?.tablet?.isFavorite || false;
          const productSlug = product?.tablet?.slug;
          const productId = product?.tablet?._id || product?._id;
          const productType =
            product?.tablet?.subcategorys?.category?.fixedType || "";
          const isServiceType = [
            "homecare",
            "nursingcare",
            "medicaltreatment",
            "medicalequipment",
            "dentalservice",
            "diagnostics",
            "labtests",
          ].includes(productType);
          const categoryData = product?.tablet?.subcategorys?.category;
          const subcategoryData = product?.tablet?.subcategorys;
          const productService =
            categoryData?.slug ||
            (categoryData?.name
              ? categoryData.name.toLowerCase().replace(/\s+/g, "-")
              : null) ||
            categoryData?.fixedType ||
            service ||
            "medicines";
          const categories =
            subcategoryData?.slug ||
            (subcategoryData?.name
              ? subcategoryData.name.toLowerCase().replace(/\s+/g, "-")
              : null) ||
            productSlug;

          const handleProductClick = () => {
            if (productService && categories && (productSlug || productId)) {
              navigate(
                `/${encodeURIComponent(productService)}/${encodeURIComponent(
                  categories,
                )}/${encodeURIComponent(productSlug || productId)}`,
                {
                  state: {
                    selectedVariantId: firstVariant?._id || null,
                  },
                },
              );
            } else {
              navigate(`/${productService}/${productSlug || productId}`);
            }
          };

          const handleNavigateToBooking = async () => {
            if (!isLoggedIn) {
              toast.error("Please login to proceed");
              navigate("/login");
              return;
            }

            try {
              const token = localStorage.getItem("medicomparestoken");
              const payload = [
                {
                  productId: product?.tablet?._id || productId,
                  variantId: effectiveVariantId,
                  vendorId: firstVendor?._id || firstVendor?.vendorId,
                  packageId: null,
                  type: "normal",
                  bookingType: "buy_now",
                },
              ];

              await axiosCommonInstance.post("cart/buynow/create", payload, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });

              navigate("/booking-process");
            } catch (error) {
              toast.error(
                error.response?.status === 401
                  ? "Session expired. Please login again."
                  : "Failed to create booking",
              );
              if (error.response?.status === 401) {
                navigate("/login");
              }
            }
          };

          const handleRentalBookinProcess = async () => {
            if (!isLoggedIn) {
              toast.error("Please login to proceed");
              navigate("/login");
              return;
            }

            try {
              const token = localStorage.getItem("medicomparestoken");
              const payload = [
                {
                  productId: product?.tablet?._id || productId,
                  variantId: effectiveVariantId,
                  vendorId: firstVendor?._id || firstVendor?.vendorId,
                  packageId: null,
                  type: "normal",
                  bookingType: "buy_now",
                },
              ];

              await axiosCommonInstance.post("cart/buynow/create", payload, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              });

              navigate("/rental-booking-process");
            } catch (error) {
              toast.error(
                error.response?.status === 401
                  ? "Session expired. Please login again."
                  : "Failed to create booking",
              );
              if (error.response?.status === 401) {
                navigate("/login");
              }
            }
          };

          const handleAddLead = () => {
            if (!isLoggedIn) {
              toast.error("Please login");
              navigate("/login");
              return;
            }

            setLeadFormData({
              name: userProfile
                ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
                  }`.trim()
                : "",
              email: userProfile?.email || "",
              mobile: userProfile?.phone || "",
              address: userProfile?.address || "",
              policyNumber: "",
              relation: "",
            });

            setCurrentModalData({
              vendor: firstVendor,
              med: product?.tablet || product,
              variantId: effectiveVariantId,
              matchedVariant: { price: basePrice, stock },
            });
            setShowLeadModal(true);
          };

          const handleOpenRentalModal = () => {
            if (!isLoggedIn) {
              toast.error("Please login to rent");
              navigate("/login");
              return;
            }

            setRentalFormData({
              startDate: "",
              startTime: "",
              endDate: "",
              endTime: "",
              deliveryAddress: userProfile?.address || "",
            });

            const selectedVar = product?.tablet?.variant?.find(
              (v) => v._id === effectiveVariantId,
            );
            setCurrentModalData({
              vendor: firstVendor,
              med: product?.tablet || product,
              effectiveVariantId,
              price: basePrice,
              stock,
              selectedVar,
            });
            setShowRentModal(true);
          };

          const handleOpenConsultationModal = () => {
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
              address: userProfile?.address || "",
            });

            setCurrentModalData({
              vendor: firstVendor,
              med: product?.tablet || product,
              effectiveVariantId,
              price: basePrice,
              stock,
            });
            setShowConsultationModal(true);
          };


          const handleOpenAppointmentModal = () => {
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
              address: userProfile?.address || "",
            });

            setCurrentModalData({
              vendor: firstVendor,
              med: product?.tablet || product,
              effectiveVariantId,
              price: basePrice,
              stock,
            });
            setShowAppointmentModal(true);
          };

          const handleAddToCart = async () => {
            localStorage.setItem("isCart", true);
            const selectedVar = product?.tablet?.variant?.find(
              (v) => v._id === effectiveVariantId,
            );
            const inStock = !!(
              (selectedVar && selectedVar.stock && selectedVar.stock > 0) ||
              firstVendor?.stock > 0 ||
              product?.tablet?.stock > 0
            );
            if (!inStock) {
              toast.error("Item is out of stock");
              return;
            }
            const finalPrice =
              discountPrice && discountPrice > 0 ? discountPrice : basePrice;
            const item = {
              tabletdetails: product?.tablet || product,
              vendordetails: firstVendor?.bussinessdetails || firstVendor,
              variants: product?.tablet?.variant || [],
              price: finalPrice,
            };

            await addToCart(item, selectedVar, {
              bookingType: "cart",
              type: "normal",
            });
          };

          const handleSingleAddToCart = async () => {
            localStorage.setItem("isCart", true);
            const inStock = !!(
              product?.tablet?.stock > 0 || firstVendor?.stock > 0
            );
            if (!inStock) {
              toast.error("Item is out of stock");
              return;
            }
            const finalPrice =
              discountPrice && discountPrice > 0 ? discountPrice : basePrice;
            const item = {
              tabletdetails: product?.tablet || product,
              vendordetails: firstVendor?.bussinessdetails || firstVendor,
              variants: [],
              price: finalPrice,
            };

            await addToCart(item, null, {
              bookingType: "cart",
              type: "normal",
            });
          };

          const handleIncrement = async () => {
            const currentQty = getCartQuantity(
              firstVendor?._id || firstVendor?.vendorId,
              product?.tablet?._id || productId,
              effectiveVariantId,
            );
            if (maxStock > 0 && currentQty >= maxStock) {
              toast.error("Maximum stock reached");
              return;
            }

            try {
              await incrementItem(
                firstVendor?._id || firstVendor?.vendorId,
                product?.tablet?._id || productId,
                effectiveVariantId,
              );
            } catch (err) {
              toast.error("Failed to update quantity");
            }
          };

          const handleDecrement = async () => {
            try {
              await decrementItem(
                firstVendor?._id || firstVendor?.vendorId,
                product?.tablet?._id || productId,
                effectiveVariantId,
              );
            } catch (err) {
              toast.error("Failed to update quantity");
            }
          };

          const renderActionButton = () => {
            if (bookingType === "rentals_addtocarts") {
              return (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    gap: "8px",
                  }}
                >
                  {isInStock ? (
                    <CartQuantityControls
                      item={{
                        tabletdetails: product?.tablet || product,
                        vendordetails:
                          firstVendor?.bussinessdetails || firstVendor,
                        variants: product?.tablet?.variant || [],
                        vendorId: firstVendor?._id || firstVendor?.vendorId,
                        price:
                          discountPrice && discountPrice > 0
                            ? discountPrice
                            : basePrice,
                        discountprice: discountPrice,
                      }}
                      variant={product?.tablet?.variant?.find(
                        (v) => v._id === effectiveVariantId,
                      )}
                      maxStock={maxStock}
                      options={{
                        bookingType: "cart",
                        type: "normal",
                      }}
                      style={{
                        minWidth: "120px",
                        color: "#8059ca",
                        border: "1px solid #8059ca",
                        backgroundColor: "#f8f4ff",
                      }}
                      className="btn btn-primary w-100"
                    />
                  ) : (
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "10px 16px",
                        border: "none",
                        cursor: "not-allowed",
                        backgroundColor: "#ccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                        minHeight: "40px",
                      }}
                      disabled
                    >
                      <i
                        className="fas fa-ban"
                        style={{ display: "flex", alignItems: "center" }}
                      ></i>
                      <span style={{ display: "flex", alignItems: "center" }}>
                        Unavailable
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    className="bg-primary"
                    style={{
                      width: "100%",
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#fff",
                      borderRadius: "8px",
                      padding: "10px 16px",
                      border: "none",
                      cursor: isInStock ? "pointer" : "not-allowed",
                      backgroundColor: isInStock ? "#8059ca" : "#ccc",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.2s ease",
                      minHeight: "40px",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isInStock) handleRentalBookinProcess();
                    }}
                    disabled={!isInStock}
                    onMouseEnter={(e) => {
                      if (isInStock) {
                        e.currentTarget.style.backgroundColor = "#6b21d6";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (isInStock) {
                        e.currentTarget.style.backgroundColor = "#8059ca";
                        e.currentTarget.style.transform = "translateY(0)";
                      }
                    }}
                  >
                    <i
                      className="fa-solid fa-clipboard-check"
                      style={{ display: "flex", alignItems: "center" }}
                    ></i>
                    <span style={{ display: "flex", alignItems: "center" }}>
                      Rent
                    </span>
                  </button>
                </div>
              );
            }

            if (quantity > 0) {
              return (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    width: "100%",
                    border: "1px solid #8059ca",
                    borderRadius: "6px",
                    backgroundColor: "#f8f4ff",
                    padding: "4px",
                    minHeight: "36px",
                  }}
                >
                  <button
                    type="button"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#8059ca",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      padding: 0,
                      flexShrink: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDecrement();
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor =
                        "rgba(125, 46, 255, 0.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <i
                      className="fas fa-minus"
                      style={{ fontSize: "10px" }}
                    ></i>
                  </button>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: "13px",
                      minWidth: "30px",
                      textAlign: "center",
                      color: "#1a1a1a",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {quantity}
                  </span>
                  <button
                    type="button"
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "4px",
                      border: "none",
                      backgroundColor: "transparent",
                      color: "#8059ca",
                      cursor:
                        maxStock > 0 && quantity >= maxStock
                          ? "not-allowed"
                          : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.2s ease",
                      opacity: maxStock > 0 && quantity >= maxStock ? 0.5 : 1,
                      padding: 0,
                      flexShrink: 0,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (maxStock === 0 || quantity < maxStock) {
                        handleIncrement();
                      }
                    }}
                    disabled={maxStock > 0 && quantity >= maxStock}
                    onMouseEnter={(e) => {
                      if (!(maxStock > 0 && quantity >= maxStock)) {
                        e.currentTarget.style.backgroundColor =
                          "rgba(125, 46, 255, 0.1)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <i className="fas fa-plus" style={{ fontSize: "10px" }}></i>
                  </button>
                </div>
              );
            }

            if (bookingType === "booking" || bookingType === "slots") {
              return (
                <button
                  type="button"
                  className="bg-primary"
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    border: "none",
                    cursor: isInStock ? "pointer" : "not-allowed",
                    backgroundColor: isInStock ? "#8059ca" : "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    minHeight: "40px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isInStock) handleNavigateToBooking();
                  }}
                  disabled={!isInStock}
                  onMouseEnter={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#6b21d6";
                      e.currentTarget.style.transform = "translateY(-1px)";
                      e.currentTarget.style.boxShadow =
                        "0 4px 8px rgba(125, 46, 255, 0.3)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#8059ca";
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <i
                    className={
                      bookingType === "slots"
                        ? "fa-solid fa-clock"
                        : "fas fa-calendar-check"
                    }
                    style={{
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  ></i>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    {bookingType === "slots" ? "Book Now" : "Book Now"}
                  </span>
                </button>
              );
            }

            // leads - Open Lead Modal
            if (bookingType === "lead" || bookingType === "leads") {
              return (
                <button
                  type="button"
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#8059ca",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    minHeight: "40px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddLead();
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#6b21d6";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#8059ca";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <i
                    className="fas fa-file-invoice-dollar"
                    style={{
                      fontSize: "12px",
                      display: "flex",
                      alignItems: "center",
                    }}
                  ></i>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    Get An Enquiry
                  </span>
                </button>
              );
            }

            // rentals - Open Rental Modal
            if (bookingType === "rentals") {
              return (
                <button
                  type="button"
                  className="bg-primary"
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    border: "none",
                    cursor: isInStock ? "pointer" : "not-allowed",
                    backgroundColor: isInStock ? "#8059ca" : "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    minHeight: "40px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isInStock) handleRentalBookinProcess();
                  }}
                  disabled={!isInStock}
                  onMouseEnter={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#6b21d6";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#8059ca";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <i
                    className="fa-solid fa-clipboard-check"
                    style={{ display: "flex", alignItems: "center" }}
                  ></i>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    Rent
                  </span>
                </button>
              );
            }

            // consultation - Open Consultation Modal
            if (bookingType === "consultation") {
              return (
                <button
                  type="button"
                  className="bg-primary"
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    border: "none",
                    cursor: isInStock ? "pointer" : "not-allowed",
                    backgroundColor: isInStock ? "#8059ca" : "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    minHeight: "40px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isInStock) handleOpenConsultationModal();
                  }}
                  disabled={!isInStock}
                  onMouseEnter={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#6b21d6";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#8059ca";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <i
                    className="fa-solid fa-comments"
                    style={{ display: "flex", alignItems: "center" }}
                  ></i>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    Consultation
                  </span>
                </button>
              );
            }


            // appointment - Open Appointment Modal
            if (bookingType === "appointment") {
              return (
                <button
                  type="button"
                  className="bg-primary"
                  style={{
                    width: "100%",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "#fff",
                    borderRadius: "8px",
                    padding: "10px 16px",
                    border: "none",
                    cursor: isInStock ? "pointer" : "not-allowed",
                    backgroundColor: isInStock ? "#8059ca" : "#ccc",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s ease",
                    minHeight: "40px",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isInStock) handleOpenAppointmentModal();
                  }}
                  disabled={!isInStock}
                  onMouseEnter={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#6b21d6";
                      e.currentTarget.style.transform = "translateY(-1px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (isInStock) {
                      e.currentTarget.style.backgroundColor = "#8059ca";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <i
                    className="fa-solid fa-calendar-check"
                    style={{ display: "flex", alignItems: "center" }}
                  ></i>
                  <span style={{ display: "flex", alignItems: "center" }}>
                    Appointment
                  </span>
                </button>
              );
            }

            if (bookingType === "cart") {
              const canUseCart = isInStock;
              return (
                <div
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {canUseCart ? (
                    <CartQuantityControls
                      item={{
                        tabletdetails: product?.tablet || product,
                        vendordetails:
                          firstVendor?.bussinessdetails || firstVendor,
                        variants: product?.tablet?.variant || [],
                        vendorId: firstVendor?._id || firstVendor?.vendorId,
                        price:
                          discountPrice && discountPrice > 0
                            ? discountPrice
                            : basePrice,
                        discountprice: discountPrice,
                      }}
                      variant={product?.tablet?.variant?.find(
                        (v) => v._id === effectiveVariantId,
                      )}
                      maxStock={maxStock}
                      style={{
                        minWidth: "120px",
                        color: "#8059ca",
                        border: "1px solid #8059ca",
                        backgroundColor: "#f8f4ff",
                      }}
                      className="btn btn-primary w-100"
                      options={{ bookingType: "cart", type: "normal" }}
                    />
                  ) : (
                    <button
                      type="button"
                      style={{
                        width: "100%",
                        fontSize: "14px",
                        fontWeight: "600",
                        color: "#fff",
                        borderRadius: "8px",
                        padding: "10px 16px",
                        border: "none",
                        cursor: "not-allowed",
                        backgroundColor: "#ccc",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px",
                      }}
                      disabled
                    >
                      <i className="fas fa-ban"></i> Unavailable
                    </button>
                  )}
                </div>
              );
            }

            return (
              <button
                type="button"
                className="bg-primary"
                style={{
                  width: "100%",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#fff",
                  borderRadius: "8px",
                  padding: "10px 16px",
                  border: "none",
                  cursor: isInStock ? "pointer" : "not-allowed",
                  backgroundColor: isInStock ? "#8059ca" : "#ccc",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "all 0.2s ease",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (isInStock) {
                    if (effectiveVariantId) {
                      handleAddToCart();
                    } else {
                      handleSingleAddToCart();
                    }
                  }
                }}
                disabled={!isInStock}
                onMouseEnter={(e) => {
                  if (isInStock) {
                    e.currentTarget.style.backgroundColor = "#6b21d6";
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow =
                      "0 4px 8px rgba(125, 46, 255, 0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (isInStock) {
                    e.currentTarget.style.backgroundColor = "#8059ca";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }
                }}
              >
                <i
                  className="fas fa-shopping-cart"
                  style={{
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                  }}
                ></i>
                <span style={{ display: "flex", alignItems: "center" }}>
                  Add to Cart
                </span>
              </button>
            );
          };

          return (
            <div
              key={product._id || product?.tablet?._id || index}
              style={{
                minWidth: "280px",
                maxWidth: "280px",
                flexShrink: 0,
                border: "1px solid #e0e0e0",
                borderRadius: "12px",
                overflow: "visible",
                backgroundColor: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                height: "100%",
                position: "relative",
                alignSelf: "stretch",
              }}
            >

              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: "180px",
                  overflow: "hidden",
                  flexShrink: 0,
                }}
                onClick={handleProductClick}
              >
                <img
                  src={variantImage}
                  alt={product?.tablet?.name || "Product"}
                  title={product?.tablet?.name || "Product"}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    borderRadius: "10px 10px 0 0",
                  }}
                  onError={(e) => {
                    e.target.src = "/assets/default.png";
                  }}
                />
                {productSlug && (
                  <div
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();

                      const data = product?.tablet;

                      const categorySlug = data?.subcategorys?.category?.slug;

                      const subcategorySlug = data?.subcategorys?.slug;

                      const productSlug = data?.slug;
                      if (!categorySlug || !subcategorySlug || !productSlug)
                        return;

                      navigate(
                        `/${categorySlug}/${subcategorySlug}/${productSlug}/compare`,
                      );
                    }}
                    className="bg-primary"
                  >
                    <i
                      className="fa-solid fa-right-left"
                      style={{ fontSize: "14px", color: "#fff" }}
                    ></i>
                  </div>
                )}
              </div>

              <div
                style={{
                  padding: "12px",
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "10px",
                    gap: "8px",
                  }}
                >
                  <h6
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      color: "#1a1a1a",
                      margin: 0,
                      flex: 1,
                      lineHeight: "1.4",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    onClick={handleProductClick}
                  >
                    {(() => {
                      const name = product?.tablet?.name || "Product Name";
                      const capitalizedName = typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name;
                      return capitalizedName.length > 40
                        ? `${capitalizedName.substring(0, 40)}...`
                        : capitalizedName;
                    })()}
                  </h6>
                </div>

                {(product?.tablet?.reportsDuration ||
                  product?.tablet?.reportDuration) && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        marginBottom: "12px",
                        fontSize: "12px",
                        color: "#666",
                      }}
                    >
                      <i
                        className="fas fa-file-alt"
                        style={{
                          color: "#8059ca",
                          fontSize: "12px",
                          flexShrink: 0,
                        }}
                      ></i>
                      <span>
                        Reports in{" "}
                        <strong>
                          {product?.tablet?.reportsDuration ||
                            product?.tablet?.reportDuration}
                        </strong>
                      </span>
                    </div>
                  )}
                {/* {product?.tablet?.medicineType || "Product Name"} */}

                {typeof finalPrice === "number" && finalPrice > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "8px",
                      marginBottom: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "16px",
                        fontWeight: "700",
                        color: "#1a1a1a",
                        lineHeight: "1",
                      }}
                    >
                      ₹{finalPrice.toFixed(2)}
                    </span>
                    {originalPrice && originalPrice > finalPrice && (
                      <>
                        <span
                          style={{
                            fontSize: "14px",
                            color: "#999",
                            textDecoration: "line-through",
                          }}
                        >
                          ₹{originalPrice.toFixed(2)}
                        </span>
                        {discountPercent > 0 && (
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#fff",
                              backgroundColor: "#FF6B35",
                              padding: "2px 8px",
                              borderRadius: "4px",
                            }}
                          >
                            {discountPercent}% OFF
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}

                {(() => {
                  const tablet = product?.tablet || {};
                  const availableKeys = [];

                  if (tablet.manufacture?.name) {
                    availableKeys.push({
                      icon: "fas fa-industry",
                      label: "Manufacturer",
                      value:
                        tablet.manufacture.name.length > 15
                          ? tablet.manufacture.name.slice(0, 15) + "..."
                          : tablet.manufacture.name,
                    });
                  }
                  if (tablet.form) {
                    availableKeys.push({
                      icon: "fas fa-pills",
                      label: "Form",
                      value: tablet.form,
                    });
                  }
                  if (tablet.complexity) {
                    availableKeys.push({
                      icon: "fas fa-cogs",
                      label: "Complexity",
                      value: tablet.complexity,
                      color:
                        tablet.complexity === "simple"
                          ? "#059669"
                          : tablet.complexity === "medium"
                            ? "#d97706"
                            : tablet.complexity === "complex"
                              ? "#dc2626"
                              : "#666",
                    });
                  }
                  if (tablet.gender) {
                    availableKeys.push({
                      icon: "fas fa-venus-mars",
                      label: "Gender",
                      value: tablet.gender,
                    });
                  }
                  if (tablet.smapletype) {
                    availableKeys.push({
                      icon: "fas fa-flask",
                      label: "Sample Type",
                      value: tablet.smapletype,
                    });
                  }
                  if (tablet.isFasting) {
                    availableKeys.push({
                      icon: "fas fa-moon",
                      label: "Fasting",
                      value:
                        tablet.isFasting?.charAt(0)?.toUpperCase() +
                        tablet.isFasting?.slice(1) || "No Fasting",
                    });
                  }
                  if (tablet.duration) {
                    availableKeys.push({
                      icon: "fas fa-clock",
                      label: "Duration",
                      value: tablet.duration,
                    });
                  }
                  if (tablet.bodypart) {
                    availableKeys.push({
                      icon: "fas fa-person",
                      label: "Body Part",
                      value: tablet.bodypart,
                    });
                  }
                  if (tablet.compositions?.name) {
                    availableKeys.push({
                      icon: "fas fa-vial",
                      label: "Composition",
                      value:
                        tablet.compositions.name.length > 20
                          ? tablet.compositions.name.slice(0, 20) + "..."
                          : tablet.compositions.name,
                    });
                  }

                  const keysToShow = availableKeys.slice(0, 4);

                  return keysToShow.length > 0 ? (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        marginBottom: "12px",
                        fontSize: "11px",
                        color: "#666",
                      }}
                    >
                      {keysToShow.map((key, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          <i
                            className={key.icon}
                            style={{
                              color: "#8059ca",
                              fontSize: "10px",
                              minWidth: "14px",
                              flexShrink: 0,
                            }}
                          ></i>
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              flexWrap: "wrap",
                            }}
                          >
                            <strong>{key.label}:</strong>
                            <span
                              style={{
                                color: key.color || "#666",
                                textTransform: key.color
                                  ? "capitalize"
                                  : "none",
                              }}
                            >
                              {key.value}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                <div
                  style={{
                    marginBottom: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderActionButton()}
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    paddingTop: "12px",
                    borderTop: "1px solid #e0e0e0",
                    marginTop: "auto",
                  }}
                >
                  {firstVendor ? (
                    <>
                      <div
                        style={{ flexShrink: 0, cursor: "pointer" }}
                        onClick={() => handleVendorClick(firstVendor)}
                      >
                        <img
                          src={vendorImage}
                          alt={vendorName}
                          style={{
                            width: "40px",
                            height: "40px",
                            objectFit: "contain",
                            borderRadius: "6px",
                            border: "1px solid #e0e0e0",
                            padding: "4px",
                            backgroundColor: "#fff",
                          }}
                          onError={(e) => {
                            e.target.src = "/assets/default.png";
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          flex: 1,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "13px",
                            fontWeight: "600",
                            color: "#1a1a1a",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            cursor: "pointer",
                          }}
                          onClick={() => handleVendorClick(firstVendor)}
                        >
                          {vendorName}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <i
                            className="fas fa-map-marker-alt"
                            style={{
                              fontSize: "10px",
                              color: "#8059ca",
                              flexShrink: 0,
                            }}
                          ></i>
                          <span
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {vendorAddress.length > 30
                              ? vendorAddress.slice(0, 30) + "..."
                              : vendorAddress}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        minHeight: "68px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#999",
                        fontSize: "12px",
                      }}
                    >
                      No vendor available
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      {showLeadModal && currentModalData && (
        <LeadModal
          show={showLeadModal}
          onClose={() => {
            setShowLeadModal(false);
            setLeadFormData({
              name: "",
              email: "",
              mobile: "",
              address: "",
              policyNumber: "",
              relation: "",
            });
            setCurrentModalData(null);
          }}
          formData={leadFormData}
          onChange={handleLeadFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.variantId}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
          formType="leads"
        />
      )}

      {showRentModal && currentModalData && (
        <RentModal
          show={showRentModal}
          onClose={() => {
            setShowRentModal(false);
            setRentalFormData({
              startDate: "",
              startTime: "",
              endDate: "",
              endTime: "",
              deliveryAddress: "",
            });
            setCurrentModalData(null);
          }}
          rentProduct={{
            tabletdetails: currentModalData.med,
            vendordetails:
              currentModalData.vendor?.bussinessdetails ||
              currentModalData.vendor,
            price: currentModalData.price,
          }}
          formData={rentalFormData}
          onFormChange={handleRentalFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          userProfile={userProfile}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
        />
      )}

      {showConsultationModal && currentModalData && (
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
            setCurrentModalData(null);
          }}
          formData={consultationFormData}
          onFormChange={handleConsultationFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
          formType="consultation"
          title="Book a Consultation"
        />
      )}

      {showAppointmentModal && currentModalData && (
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
            setCurrentModalData(null);
          }}
          formData={appointmentFormData}
          onFormChange={handleAppointmentFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
          formType="appointment"
        />
      )}

    </div>
  );
};

export default GenericProducts;
