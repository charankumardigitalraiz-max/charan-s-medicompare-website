import { useNavigate, useParams } from "react-router-dom";
import { FaRegShareSquare, FaHeart } from "react-icons/fa";
import { IoIosHeartEmpty } from "react-icons/io";
import {
  imgUrl,
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../../Apiservice.jsx";
import toast from "react-hot-toast";
import { useCart } from "../../../../hooks/useCart";
import { useAddToCart } from "../../../../hooks/useAddToCart";
import { getImageUrl } from "../../../../utils/index";
import CartQuantityControls from "../../../../components/ui/CartQuantityControls.jsx";
import VendorActions from "../../../../components/ui/VendorActions.jsx";
import LeadModal from "./LeadModal.jsx";
import RentModal from "./RentModal.jsx";
import ConsultationModal from "./ConsultationModal.jsx";
import AppointmentModal from "./AppointmentModal.jsx";
import { useState, useRef, useEffect } from "react";
import { redirectToLoginWithPendingBooking } from "../../../../utils/pendingBookingUtils.js";

const COMPACT_CART_BTN_STYLES = {
  fontSize: "10px",
  padding: "4px 6px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "100%",
  gap: "4px",
  backgroundColor: "#8059ca",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  minHeight: "26px",
};

const COMPACT_CART_CONTAINER = {
  display: "flex",
  alignItems: "center",
  width: "100%",
};

const COMPACT_QTY_WRAP = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "4px",
  width: "100%",
  border: "1px solid #8059ca",
  borderRadius: "6px",
  backgroundColor: "#f8f4ff",
  padding: "2px 6px",
  minHeight: "28px",
};

const SERVICE_BOOKING_TYPES = [
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

const getVendorActionContext = (
  vendor,
  product,
  firstVariant,
  effectiveVariantId,
  getCartQuantity,
  productId,
) => {
  const isVariant = !!firstVariant;
  const bookingType = vendor?.bookingType || vendor?.bookingtype || null;
  let basePrice;
  let discountPrice;
  let discountType;
  let stock;

  if (isVariant && effectiveVariantId) {
    const matched = vendor?.variant?.find(
      (v) =>
        v.variantId === effectiveVariantId || v._id === effectiveVariantId,
    );
    if (matched) {
      basePrice =
        matched.price ??
        vendor?.price ??
        firstVariant?.price ??
        product?.tablet?.price ??
        0;
      discountPrice =
        matched.discountprice ??
        matched.discountPrice ??
        vendor?.discountprice ??
        vendor?.discountPrice ??
        null;
      discountType = matched.discountType ?? vendor?.discountType ?? null;
      stock = matched.stock ?? vendor?.stock ?? 0;
    } else {
      basePrice =
        vendor?.variant?.[0]?.price ??
        vendor?.price ??
        firstVariant?.price ??
        product?.tablet?.price ??
        0;
      discountPrice =
        vendor?.variant?.[0]?.discountprice ??
        vendor?.variant?.[0]?.discountPrice ??
        vendor?.discountprice ??
        vendor?.discountPrice ??
        null;
      discountType =
        vendor?.variant?.[0]?.discountType ?? vendor?.discountType ?? null;
      stock = vendor?.variant?.[0]?.stock ?? vendor?.stock ?? 0;
    }
  } else {
    basePrice = vendor?.price ?? product?.tablet?.price ?? 0;
    discountPrice = vendor?.discountprice ?? vendor?.discountPrice ?? null;
    discountType = vendor?.discountType ?? null;
    stock = vendor?.stock ?? 0;
  }

  let calculatedDiscountPrice = discountPrice;
  if (discountType === "percentage" && discountPrice && discountPrice > 0) {
    calculatedDiscountPrice =
      basePrice - (basePrice * discountPrice) / 100;
  }

  const hasValidDiscount =
    (discountType === "percentage" && discountPrice && discountPrice > 0) ||
    (discountPrice && discountPrice > 0 && discountPrice < basePrice);
  const finalPrice = hasValidDiscount ? calculatedDiscountPrice : basePrice;

  const isInStock = SERVICE_BOOKING_TYPES.includes(bookingType)
    ? true
    : stock > 0;

  let maxStock = 999;
  if (isVariant && effectiveVariantId) {
    const matchedVendorVariant = vendor?.variant?.find(
      (v) =>
        v.variantId === effectiveVariantId || v._id === effectiveVariantId,
    );
    if (matchedVendorVariant && matchedVendorVariant.isStock) {
      maxStock = matchedVendorVariant.stock ?? 0;
    } else if (
      matchedVendorVariant &&
      matchedVendorVariant.stock !== undefined
    ) {
      maxStock = matchedVendorVariant.stock ?? 999;
    } else {
      const vendorStock = vendor?.stock;
      maxStock =
        vendorStock !== undefined && vendorStock !== null ? vendorStock : 999;
    }
  } else {
    const vendorStock = vendor?.stock;
    maxStock =
      vendorStock !== undefined && vendorStock !== null ? vendorStock : 999;
  }

  const vendorId = vendor?._id || vendor?.vendorId;
  const tabletId = product?.tablet?._id || productId;
  const quantity = getCartQuantity(vendorId, tabletId, effectiveVariantId);

  return {
    bookingType,
    basePrice,
    discountPrice,
    discountType,
    finalPrice,
    stock,
    isInStock,
    maxStock,
    quantity,
    vendorId,
  };
};

const CollapsibleVendorList = ({
  vendors,
  handleVendorClick,
  renderVendorAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const vendorCount = vendors ? vendors.length : 0;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (event.target.closest(".modal") || event.target.closest(".modal-backdrop")) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} style={{ width: "100%", position: "relative" }}>
      {/* Collapsible Trigger Header */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          backgroundColor: "#f9f6ff",
          borderRadius: "8px",
          cursor: "pointer",
          border: "1px solid rgba(128, 89, 202, 0.15)",
          userSelect: "none",
          transition: "all 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(128, 89, 202, 0.3)";
          e.currentTarget.style.backgroundColor = "#f4edff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(128, 89, 202, 0.15)";
          e.currentTarget.style.backgroundColor = "#f9f6ff";
        }}
      >
        <span style={{ fontSize: "12px", fontWeight: "600", color: "#8059ca" }}>
          {vendorCount} {vendorCount === 1 ? "Vendor" : "Vendors"} Available
        </span>
        <i
          className={`fas fa-chevron-${isOpen ? "up" : "down"}`}
          style={{
            fontSize: "10px",
            color: "#8059ca",
            transition: "transform 0.2s ease",
          }}
        ></i>
      </div>

      {/* Expanded Vendor List + action button */}
      {isOpen && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: 0,
            right: 0,
            backgroundColor: "#fff",
            border: "1px solid #e0e0e0",
            borderRadius: "8px",
            boxShadow: "0 -4px 16px rgba(0,0,0,0.12)",
            zIndex: 99,
            padding: "6px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            marginBottom: "6px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              maxHeight: "220px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            {vendorCount === 0 ? (
              <div
                style={{
                  width: "100%",
                  padding: "12px",
                  textAlign: "center",
                  color: "#999",
                  fontSize: "12px",
                }}
              >
                No vendor available
              </div>
            ) : (
              vendors.map((vendor, idx) => {
                const vendorImage =
                  getImageUrl(vendor?.bussinessdetails?.bussiness_image?.url) ||
                  "/assets/default.png";
                const vendorName = vendor?.bussinessdetails?.name || "N/A";
                const vendorAddress = vendor?.bussinessdetails?.address || "N/A";

                // Price Calculation
                const basePrice = parseFloat(vendor?.price || 0);
                const discountPrice = parseFloat(vendor?.discountprice || vendor?.discountPrice || 0);
                const discountType = vendor?.discountType;

                let finalPrice = basePrice;
                let hasDiscount = false;

                if (discountType === "percentage" && discountPrice > 0) {
                  finalPrice = basePrice - (basePrice * discountPrice) / 100;
                  hasDiscount = true;
                } else if (discountPrice > 0 && discountPrice < basePrice) {
                  finalPrice = discountPrice;
                  hasDiscount = true;
                }

                return (
                  <div
                    key={vendor?._id || idx}
                    className="rp-vendor-row"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#f8f4ff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "transparent";
                    }}
                  >
                    <div
                      className="rp-vendor-row-info"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVendorClick(vendor);
                      }}
                    >
                      <div style={{ flexShrink: 0 }}>
                        <img
                          src={vendorImage}
                          alt={vendorName}
                          style={{
                            width: "28px",
                            height: "28px",
                            objectFit: "contain",
                            borderRadius: "4px",
                            border: "1px solid #e2e8f0",
                            padding: "2px",
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
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        <div className="rp-vendor-row-name">{vendorName}</div>
                        <div className="rp-vendor-row-address">
                          <i className="fas fa-map-marker-alt" />
                          <span style={{ marginRight: "6px" }}>{vendorAddress}</span>
                        </div>

                        {/* Price Info */}
                        {basePrice > 0 && (
                          <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginTop: "1px" }}>
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#1a1a1a" }}>
                              ₹{finalPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span style={{ fontSize: "9px", color: "#999", textDecoration: "line-through" }}>
                                ₹{basePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {renderVendorAction && (
                      <div
                        className="rp-vendor-action-col"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderVendorAction(vendor)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const RelatedProducts = ({
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
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };
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

    if (
      tablet.imageUrl &&
      Array.isArray(tablet.imageUrl) &&
      tablet.imageUrl.length > 0
    ) {
      return true;
    }

    if (
      tablet.files &&
      Array.isArray(tablet.files) &&
      tablet.files.length > 0
    ) {
      return true;
    }

    if (tablet.variant && Array.isArray(tablet.variant)) {
      for (const variant of tablet.variant) {
        if (
          variant.imageUrl &&
          Array.isArray(variant.imageUrl) &&
          variant.imageUrl.length > 0
        ) {
          return true;
        }

        if (
          variant.files &&
          Array.isArray(variant.files) &&
          variant.files.length > 0
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const validProducts = relatedproducts.filter((product) =>
    hasValidImage(product),
  );

  if (!validProducts || validProducts.length === 0) {
    return null;
  }

  return (
    <div style={{ marginTop: isMobile ? "0px" : "20px" }}>
      <div className="rp-section-header">
        <div className="rp-section-title-wrap">
          <span className="rp-section-accent" aria-hidden="true" />
          <div
            style={{
              fontSize: isMobile ? '20px' : '20px',
              fontWeight: 500,
              color: '#0f172a',
              margin: 0
            }}>
            Related Products
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#8059ca',
              padding: '4px 10px',
              borderRadius: '20px'
            }}>{validProducts.length}</div>
        </div>

        <button
          type="button"
          className="rp-view-all-btn"
          onClick={() => {
            const currentService = service || params.service || "medicine";
            localStorage.setItem("fixedType", currentService);
            navigate(`/${currentService}/all`);
          }}
        >
          View All
          <i className="fas fa-arrow-right" aria-hidden="true" />
        </button>
      </div>

      <style>{`
        .rp-section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #ede9f5;
        }

        .rp-section-title-wrap {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }

        .rp-section-accent {
          width: 4px;
          height: 38px;
          border-radius: 4px;
          background: linear-gradient(180deg, #8059ca 0%, #6d48b8 100%);
          flex-shrink: 0;
        }

        .rp-section-text {
          min-width: 0;
        }

        .rp-section-title {
          font-size: 18px;
          font-weight: 700;
          color: #191c1f;
          margin: 0;
          line-height: 1.25;
        }

        .rp-section-subtitle {
          font-size: 12px;
          color: #667085;
          margin: 3px 0 0;
          line-height: 1.35;
        }

        .rp-section-count {
          background: #f3f0fa;
          color: #8059ca;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
          line-height: 1.2;
        }

        .rp-view-all-btn {
          font-size: 13px;
          font-weight: 600;
          color: #8059ca;
          cursor: pointer;
          border: 1.5px solid #8059ca;
          padding: 7px 14px;
          border-radius: 8px;
          background: #fdfbff;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          transition: all 0.2s ease-in-out;
          white-space: nowrap;
          flex-shrink: 0;
        }

        .rp-view-all-btn i {
          font-size: 10px;
        }

        .rp-view-all-btn:hover {
          background: #8059ca;
          color: #fff;
        }

        @media (max-width: 576px) {
          .rp-section-title {
            font-size: 16px;
          }

          .rp-section-accent {
            height: 32px;
          }

          .rp-view-all-btn {
            font-size: 12px;
            padding: 6px 10px;
          }
        }

        .related-products-scroll::-webkit-scrollbar {
          display: none !important;
        }

        .rp-action-row {
          display: flex;
          flex-direction: row;
          gap: 6px;
          width: 100%;
        }

        .rp-action-row > * {
          flex: 1;
          min-width: 0;
        }

        .rp-vendor-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 6px;
          transition: background-color 0.2s ease;
        }

        .rp-vendor-row-info {
          flex: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }

        .rp-vendor-row-name {
          font-size: 11px;
          font-weight: 600;
          color: #1a1a1a;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rp-vendor-row-address {
          font-size: 9px;
          color: #64748b;
          display: flex;
          align-items: center;
          gap: 3px;
          overflow: hidden;
        }

        .rp-vendor-row-address i {
          font-size: 8px;
          color: #8059ca;
          flex-shrink: 0;
        }

        .rp-vendor-row-address span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .rp-vendor-action-col {
          flex-shrink: 0;
          width: 82px;
        }

        .rp-action-row--stack {
          flex-direction: column;
          gap: 4px;
        }

        .rp-action-btn {
          width: 100%;
          font-size: 11px;
          font-weight: 600;
          border-radius: 6px;
          padding: 5px 8px;
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          transition: all 0.2s ease;
          min-height: 28px;
          line-height: 1.2;
          white-space: nowrap;
        }

        .rp-action-btn i {
          font-size: 10px;
          flex-shrink: 0;
        }

        .rp-action-btn--primary {
          color: #fff !important;
          background: #8059ca !important;
          border: none !important;
          cursor: pointer;
        }

        .rp-action-btn--primary i {
          color: #fff !important;
        }

        .rp-action-btn--primary:hover:not(:disabled) {
          background: #6b21d6 !important;
        }

        .rp-action-btn--primary:disabled {
          background: #ccc !important;
          color: #fff !important;
          cursor: not-allowed;
        }

        .rp-action-btn--disabled {
          background: #e5e7eb;
          color: #9ca3af;
          cursor: not-allowed;
        }

        .rp-vendor-action-col .vendor-add-btn,
        .rp-vendor-action-col .vendor-add-btn.rp-cart-control,
        .rp-vendor-action-col .vendor-action-btn.vendor-add-btn {
          min-width: 0 !important;
          width: 100%;
          font-size: 10px !important;
          min-height: 26px !important;
          padding: 4px 6px !important;
          color: #fff !important;
          border: none !important;
          background-color: #8059ca !important;
          border-radius: 6px !important;
        }

        .rp-vendor-action-col .vendor-add-btn i,
        .rp-vendor-action-col .vendor-action-btn i {
          color: #fff !important;
        }

        .rp-cart-control.cart-qty-controls {
          color: #8059ca !important;
          border: 1px solid #8059ca !important;
          background-color: #f8f4ff !important;
        }

        .rp-qty-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          width: 100%;
          border: 1px solid #8059ca;
          border-radius: 6px;
          background-color: #f8f4ff;
          padding: 2px 6px;
          min-height: 28px;
        }

        .rp-qty-btn {
          width: 24px;
          height: 24px;
          border-radius: 5px;
          border: none;
          background-color: transparent;
          color: #8059ca;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          flex-shrink: 0;
          transition: background 0.15s ease;
        }

        .rp-qty-btn:hover:not(:disabled) {
          background-color: rgba(128, 89, 202, 0.1);
        }

        .rp-qty-btn:disabled {
          opacity: 0.45;
          cursor: not-allowed;
        }

        .rp-qty-btn i {
          font-size: 9px;
        }

        .rp-qty-count {
          font-weight: 600;
          font-size: 11px;
          min-width: 24px;
          text-align: center;
          color: #1a1a1a;
        }
      `}</style>

      <div style={{ position: "relative", width: "100%" }}>
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={scrollLeft}
          style={{
            position: "absolute",
            left: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            border: "1px solid rgba(128, 89, 202, 0.2)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
            color: "#8059ca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#8059ca";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.color = "#8059ca";
          }}
        >
          <i className="fa-solid fa-chevron-left" style={{ fontSize: "14px" }}></i>
        </button>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={scrollRight}
          style={{
            position: "absolute",
            right: "8px",
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 10,
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            backgroundColor: "#ffffff",
            border: "1px solid rgba(128, 89, 202, 0.2)",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.12)",
            color: "#8059ca",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#8059ca";
            e.currentTarget.style.color = "#ffffff";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ffffff";
            e.currentTarget.style.color = "#8059ca";
          }}
        >
          <i className="fa-solid fa-chevron-right" style={{ fontSize: "14px" }}></i>
        </button>

        <div
          ref={scrollRef}
          style={{
            display: "grid",
            gridAutoColumns: "250px",
            gridAutoFlow: "column",
            gap: "16px",
            overflowX: "auto",
            overflowY: "hidden",
            paddingBottom: "8px",
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
          className="related-products-scroll"
        >
          {relatedproducts
            .filter((product) => hasValidImage(product))
            .map((product, index) => {
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

              const allImageFiles = variantImageFile
                ? [variantImageFile]
                : variantImageUrl
                  ? [variantImageUrl]
                  : [];

              const variantImage = allImageFiles[0]
                ? allImageFiles[0].startsWith("/")
                  ? getImageUrl(allImageFiles[0])
                  : allImageFiles[0]
                : "/assets/default.png";
              const vendorImage =
                getImageUrl(
                  firstVendor?.bussinessdetails?.bussiness_image?.url,
                ) || "/assets/default.png";
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
              const discountType = isVariant
                ? (firstVendor?.variant?.[0]?.discountType ??
                  firstVendor?.discountType ??
                  null)
                : (firstVendor?.discountType ??
                  null);

              // Calculate effective price based on discountType
              let calculatedDiscountPrice = discountPrice;
              if (discountType === "percentage" && discountPrice && discountPrice > 0) {
                calculatedDiscountPrice = basePrice - (basePrice * discountPrice / 100);
              }

              const hasValidDiscount =
                (discountType === "percentage" && discountPrice && discountPrice > 0) ||
                (discountPrice && discountPrice > 0 && discountPrice < basePrice);
              const finalPrice = hasValidDiscount ? calculatedDiscountPrice : basePrice;
              const originalPrice = hasValidDiscount ? basePrice : null;
              let discountPercent = 0;
              if (hasValidDiscount) {
                if (discountType === "percentage") {
                  discountPercent = discountPrice; // Use original percentage
                } else {
                  discountPercent = Math.round(
                    ((basePrice - discountPrice) / basePrice) * 100,
                  );
                }
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

              const vendorAddress =
                firstVendor?.bussinessdetails?.address || "N/A";
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

              const bookingRedirectPath =
                bookingType === "slots"
                  ? "/booking-process/slot"
                  : "/booking-process";

              const handleNavigateToBooking = async (vendor) => {
                const payload = [
                  {
                    productId: product?.tablet?._id || productId,
                    variantId: effectiveVariantId,
                    vendorId: vendor?._id || vendor?.vendorId,
                    packageId: null,
                    type: "normal",
                    bookingType: "buy_now",
                    servicefixedTypes: service
                  },
                ];
                const token = localStorage.getItem("medicomparestoken");

                if (!token) {
                  toast.error("Please login to proceed");
                  redirectToLoginWithPendingBooking(navigate, payload, {
                    redirectPath: bookingRedirectPath,
                  });
                  return;
                }

                try {
                  const response = await axiosCommonInstance.post(
                    "cart/buynow/create",
                    payload,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  navigate(bookingRedirectPath, {
                    state: { bookingData: response.data },
                  });
                } catch (error) {
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    redirectToLoginWithPendingBooking(navigate, payload, {
                      redirectPath: bookingRedirectPath,
                    });
                  } else {
                    toast.error("Failed to create booking");
                  }
                }
              };

              const handleRentalBookinProcess = async (vendor) => {
                const payload = [
                  {
                    productId: product?.tablet?._id || productId,
                    variantId: effectiveVariantId,
                    vendorId: vendor?._id || vendor?.vendorId,
                    packageId: null,
                    type: "normal",
                    bookingType: "buy_now",
                    perDayRent: vendor?.perDayRent || 0,
                    servicefixedTypes: service
                  },
                ];
                const token = localStorage.getItem("medicomparestoken");

                if (!token) {
                  toast.error("Please login to proceed");
                  redirectToLoginWithPendingBooking(navigate, payload, {
                    redirectPath: "/rental-booking-process",
                    perDayRent: vendor?.perDayRent || 0,
                  });
                  return;
                }

                try {
                  if (vendor?.perDayRent) {
                    localStorage.setItem("perDayRent", vendor.perDayRent);
                  }

                  const response = await axiosCommonInstance.post(
                    "cart/buynow/create",
                    payload,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  navigate("/rental-booking-process", {
                    state: { bookingData: response.data },
                  });
                } catch (error) {
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    redirectToLoginWithPendingBooking(navigate, payload, {
                      redirectPath: "/rental-booking-process",
                      perDayRent: vendor?.perDayRent || 0,
                    });
                  } else {
                    toast.error("Failed to create booking");
                  }
                }
              };

              const handleAddLead = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
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
                  vendor,
                  med: product?.tablet || product,
                  variantId: effectiveVariantId,
                  matchedVariant: {
                    price: vendorCtx.basePrice,
                    stock: vendorCtx.stock,
                  },
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

              const handleOpenConsultationModal = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
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
                  vendor,
                  med: product?.tablet || product,
                  effectiveVariantId,
                  price: vendorCtx.basePrice,
                  stock: vendorCtx.stock,
                });
                setShowConsultationModal(true);
              };

              const handleOpenAppointmentModal = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
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
                  vendor,
                  med: product?.tablet || product,
                  effectiveVariantId,
                  price: vendorCtx.basePrice,
                  stock: vendorCtx.stock,
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
                  discountprice: discountPrice,
                  discountType: discountType,
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
                  discountprice: discountPrice,
                  discountType: discountType,
                };

                await addToCart(item, null, {
                  bookingType: "cart",
                  type: "normal",
                });
              };

              const renderVendorActionButton = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
                const {
                  bookingType: vendorBookingType,
                  isInStock: vendorInStock,
                  maxStock: vendorMaxStock,
                  finalPrice: vendorFinalPrice,
                  discountPrice: vendorDiscountPrice,
                } = vendorCtx;

                return (
                  <VendorActions
                    bookingType={vendorBookingType}
                    isInStock={vendorInStock}
                    med={product?.tablet || product}
                    vendor={vendor || vendor || {}}
                    effectiveVariantId={effectiveVariantId}
                    price={vendorFinalPrice}
                    // stock={vendorMaxStock}
                    service={product?.tablet?.category?.fixedType}
                    calculatedDiscountPrice={vendorDiscountPrice}
                    handleRentalBookinProcess={handleRentalBookinProcess}
                    handleNavigateToBooking={handleNavigateToBooking}
                    handleAddLead={handleAddLead}
                    handleOpenConsultationModal={handleOpenConsultationModal}
                    handleOpenAppointmentModal={handleOpenAppointmentModal}
                    handleAddToCart={handleAddToCart}
                    handleSingleAddToCart={handleSingleAddToCart}
                    className="w-100"
                    containerStyle={{
                      display: "flex",
                      flexDirection: vendorBookingType === "rentals_addtocarts" ? "column" : "row",
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
                );
              };

              return (
                <div
                  key={product._id || product?.tablet?._id || index}
                  style={{
                    width: "250px",
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
                  }}
                >
                  {product?.tablet?.medicineType && (
                    <div
                      className="medicompare-ribbons"
                      style={{ textTransform: "capitalize" }}
                    >
                      {product.tablet.medicineType}
                    </div>
                  )}

                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      height: "140px",
                      overflow: "hidden",
                      flexShrink: 0,
                    }}
                    onClick={handleProductClick}
                  >
                    <img
                      src={variantImage}
                      title={product?.tablet?.name || "Product"}
                      alt={product?.tablet?.name || "Product"}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        borderRadius: "10px 10px 0 0",
                      }}
                      onError={(e) => {
                        e.target.src = "/medicine.jpg";
                      }}
                    />
                    {productSlug && (
                      <>
                        <style>{`
                          @keyframes comparePulse {
                            0% {
                              box-shadow: 0 0 0 0 rgba(128, 89, 202, 0.6);
                            }
                            70% {
                              box-shadow: 0 0 0 6px rgba(128, 89, 202, 0);
                            }
                            100% {
                              box-shadow: 0 0 0 0 rgba(128, 89, 202, 0);
                            }
                          }
                          @keyframes compareAutoExpand {
                            0%, 10%, 40%, 100% {
                              width: 32px;
                            }
                            15%, 35% {
                              width: 90px;
                            }
                          }
                          @keyframes textFadeInOut {
                            0%, 12%, 38%, 100% {
                              opacity: 0;
                            }
                            15%, 35% {
                              opacity: 1;
                            }
                          }
                          .compare-btn-highlight {
                            animation: comparePulse 2s infinite, compareAutoExpand 8s infinite ease-in-out;
                          }
                          .compare-text-label {
                            animation: textFadeInOut 8s infinite ease-in-out;
                          }
                          .compare-btn-highlight:hover {
                            animation: comparePulse 2s infinite !important;
                          }
                          .compare-btn-highlight:hover .compare-text-label {
                            animation: none !important;
                            opacity: 1 !important;
                          }
                        `}</style>
                        <div
                          className="compare-btn-highlight"
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
                          style={{
                            position: "absolute",
                            top: "8px",
                            right: "8px",
                            background: "#8059ca",
                            color: "#ffffff",
                            border: "1.5px solid #8059ca",
                            borderRadius: "20px",
                            width: "32px",
                            height: "26px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-start",
                            paddingLeft: "9px",
                            cursor: "pointer",
                            zIndex: 10,
                            boxShadow: "0 2px 8px rgba(128, 89, 202, 0.4)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.width = "90px";
                            e.currentTarget.style.backgroundColor = "#6a45b3";
                            e.currentTarget.style.borderColor = "#6a45b3";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.width = "32px";
                            e.currentTarget.style.backgroundColor = "#8059ca";
                            e.currentTarget.style.borderColor = "#8059ca";
                          }}
                        >
                          <i
                            className="fa-solid fa-right-left shrink-0"
                            style={{ fontSize: "11px", color: "inherit" }}
                          ></i>
                          <span
                            className="compare-text-label"
                            style={{
                              marginLeft: "6px",
                              fontSize: "11px",
                              fontWeight: "600",
                              color: "#ffffff",
                              opacity: 0,
                              transition: "opacity 0.2s ease-in-out",
                            }}
                          >
                            Compare
                          </span>
                        </div>
                      </>
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
                          fontWeight: "600",
                          color: "#2d3748",
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
                          return capitalizedName.length > 80
                            ? `${capitalizedName.substring(0, 80)}...`
                            : capitalizedName;
                        })()}
                      </h6>
                    </div>
                    {/* {typeof finalPrice === "number" && finalPrice > 0 && (
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
                    )} */}
                    {(product?.tablet?.reportsDuration ||
                      product?.tablet?.reportDuration) && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
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



                    {(() => {
                      const tablet = product?.tablet || {};
                      const availableKeys = [];

                      if (tablet.manufacture?.name) {
                        availableKeys.push({
                          icon: "fas fa-industry",
                          label: "Manufacturer",
                          value:
                            tablet.manufacture.name.length > 25
                              ? tablet.manufacture.name.slice(0, 25) + "..."
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
                      if (tablet.treatmenttype) {
                        availableKeys.push({
                          icon: "fas fa-tooth",
                          label: "Treatment Type",
                          value: tablet.treatmenttype,
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
                        display: "flex",
                        flexDirection: "column",
                        width: "100%",
                        marginTop: "auto",
                        position: "relative",
                      }}
                    >
                      <CollapsibleVendorList
                        vendors={product?.vendors}
                        handleVendorClick={handleVendorClick}
                        renderVendorAction={renderVendorActionButton}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
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

export default RelatedProducts;
