import React, { useEffect, useRef } from "react";
// import { UseMediaQuery } from "../../hooks/UseMediaQuery";
import ProductImage from "./ProductImage.jsx";
import PriceDisplay from "./PriceDisplay.jsx";
import { getImageUrl } from "../../utils/index";
import { CartQuantityControls } from "./index";
/**
 * Reusable Product Card Component
 * Displays product information in a card format with image, details, pricing, and cart controls
 *
 * @param {Object} props
 * @param {Object} props.item - Product item object with tabletdetails and vendordetails
 * @param {Object} props.variant - Selected variant object (optional)
 * @param {string} props.imgUrl - Base URL for product images
 * @param {Function} props.onProductClick - Callback when product is clicked
 * @param {Function} props.onCompareClick - Callback when compare icon is clicked (optional)
 * @param {Function} props.onVendorClick - Callback when vendor is clicked (optional)
 * @param {string} props.deliveryText - Delivery information text (optional, default: "Get By 4pm, Today")
 * @param {number} props.maxStock - Maximum stock available (optional, default: 999)
 * @param {string} props.className - Additional CSS classes (optional)
 * @param {Object} props.style - Inline styles (optional)
 * @param {number} props.titleMaxLength - Maximum length for product title (optional, default: 30)
 * @param {number} props.vendorNameMaxLength - Maximum length for vendor name (optional, default: 30)
 * @param {boolean} props.showCompare - Show compare icon (optional, default: true)
 * @param {boolean} props.showDeliveryInfo - Show delivery information (optional, default: true)
 */
const ProductCardMC = ({
  item,
  variant = "",
  imgUrl = "",
  onProductClick,
  onCompareClick,
  onVendorClick,
  deliveryText = "Get By <strong>4pm, Today</strong>",
  maxStock = 999,
  className = "",
  style = {},
  titleMaxLength = 30,
  vendorNameMaxLength = 30,
  showCompare = true,
  showDeliveryInfo = true,
  isMobile,
}) => {
  const selectedVariant =
    variant ||
    (Array.isArray(item?.variants) ? item.variants[0] : item?.variants) ||
    null;
  const productName =
    (typeof item?.tabletdetails?.name === "object"
      ? item.tabletdetails.name.name
      : item?.tabletdetails?.name) ||
    (typeof item?.name === "object" ? item.name.name : item?.name) ||
    "";
  const manufacturerName =
    (typeof item?.tabletdetails?.manufacture?.name === "object"
      ? item.tabletdetails.manufacture.name.name
      : item?.tabletdetails?.manufacture?.name) ||
    (typeof item?.manufacture?.name === "object"
      ? item.manufacture.name.name
      : item?.manufacture?.name) ||
    "";

  const composition =
    (typeof item?.tablet?.compositions?.name === "object"
      ? item.tablet.compositions.name.name
      : item?.tablet?.compositions?.name) ||
    (typeof item?.compositions === "object"
      ? item.compositions.name
      : item?.compositions) ||
    "";

  const vendorBookingType = item?.vendordetails?.bookingType;
  const variantName =
    (typeof selectedVariant?.name === "object"
      ? selectedVariant.name.name
      : selectedVariant?.name) || "";

  const itemPrice =
    parseFloat(
      selectedVariant?.price ||
      item?.price ||
      item?.vendordetails?.price ||
      item?.tabletdetails?.price ||
      0,
    ) || 0;

  const itemDiscountprice =
    parseFloat(
      selectedVariant?.discountPrice ||
      selectedVariant?.discountprice ||
      item?.vendordetails?.discountprice ||
      item?.vendordetails?.discountPrice ||
      null,
    ) || null;

  // Calculate discount price based on discountType
  let calculatedItemDiscountPrice = itemDiscountprice;
  const itemDiscountType =
    selectedVariant?.discountType ||
    item?.vendordetails?.discountType ||
    null;

  if (itemDiscountType === "percentage" && itemDiscountprice && itemDiscountprice > 0) {
    calculatedItemDiscountPrice = itemPrice - (itemPrice * itemDiscountprice / 100);
  }

  const effectivePrice =
    calculatedItemDiscountPrice && calculatedItemDiscountPrice > 0 && !isNaN(calculatedItemDiscountPrice)
      ? calculatedItemDiscountPrice
      : itemPrice;

  let discount = 0;
  if (
    calculatedItemDiscountPrice &&
    calculatedItemDiscountPrice > 0 &&
    !isNaN(calculatedItemDiscountPrice) &&
    itemPrice > 0 &&
    !isNaN(itemPrice) &&
    calculatedItemDiscountPrice !== itemPrice
  ) {
    if (calculatedItemDiscountPrice > itemPrice) {
      const calculatedDiscount =
        ((calculatedItemDiscountPrice - itemPrice) / calculatedItemDiscountPrice) * 100;
      discount = isNaN(calculatedDiscount) ? 0 : Math.round(calculatedDiscount);
    } else {
      const calculatedDiscount =
        ((itemPrice - calculatedItemDiscountPrice) / itemPrice) * 100;
      discount = isNaN(calculatedDiscount) ? 0 : Math.round(calculatedDiscount);
    }
  }

  if (isNaN(discount) || discount <= 0) {
    discount = 0;
  }

  const variantFiles =
    selectedVariant?.files || item?.tabletdetails?.files || item?.files || [];
  const variantImageUrl =
    selectedVariant?.imageUrl ||
    item?.tabletdetails?.imageUrl ||
    item?.imageUrl ||
    [];
  const allImageFiles =
    variantFiles.length > 0 ? variantFiles : variantImageUrl;
  const productImage = getImageUrl(allImageFiles[0]) || "/assets/default.png";
  // Extract vendor details
  const price = item?.price || item?.tabletvariants?.[0]?.price || 0;
  const averageRating = item.averageRating || item?.tablet?.averageRating || 0;
  const totalRatings = item.totalRatings || item?.tablet?.ratingCount || 0;
  const vendorName = item?.vendordetails?.name || item?.vendorName || "";
  const vendorImageUrl =
    item?.vendordetails?.bussiness_image?.[0]?.url ||
    item?.vendordetails?.bussiness_image?.url ||
    item?.vendordetails?.bussinessdetails?.bussiness_image?.[0]?.url ||
    item?.vendordetails?.bussinessdetails?.bussiness_image?.url ||
    item?.products?.vendor?.[0]?.bussinessdetails?.bussiness_image?.url ||
    item?.vendors?.[0]?.bussinessdetails?.bussiness_image?.url ||
    "";
  const vendorImage = getImageUrl(vendorImageUrl);

  // Extract distance from vendor details
  const distanceInKm = item?.vendordetails?.distanceInKm || item?.distanceInKm;
  // Truncate text helpers
  const truncateText = (text, maxLength) => {
    if (!text || typeof text !== "string") return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };
  const handleImageClick = () => {
    if (onProductClick) {
      onProductClick(item);
    }
  };
  const handleVariantClick = () => {
    if (onProductClick) {
      onProductClick(item);
    }
  };

  const handleCompareIconClick = (e) => {
    e.stopPropagation();
    if (onCompareClick) {
      onCompareClick(item);
    }
  };

  const handleVendorClick = (e) => {
    e.stopPropagation();
    if (onVendorClick && item?.vendordetails) {
      onVendorClick(item.vendordetails);
    }
  };

  const compareIconRef = useRef(null);
  const tooltipInstanceRef = useRef(null);
  const compositionRef = useRef(null);
  const compositionTooltipRef = useRef(null);

  useEffect(() => {
    // Compare Icon Tooltip
    if (showCompare && compareIconRef.current && window.bootstrap) {
      const tooltipElement = compareIconRef.current;
      const existingTooltip =
        window.bootstrap.Tooltip.getInstance(tooltipElement);
      if (!existingTooltip) {
        tooltipInstanceRef.current = new window.bootstrap.Tooltip(
          tooltipElement,
          {
            placement: "top",
            title: "Add this compare",
          },
        );
      }
    }

    // Composition Tooltip
    if (compositionRef.current && window.bootstrap && composition) {
      const compElement = compositionRef.current;
      const existingCompTooltip =
        window.bootstrap.Tooltip.getInstance(compElement);
      if (!existingCompTooltip) {
        compositionTooltipRef.current = new window.bootstrap.Tooltip(
          compElement,
          {
            placement: "top",
            title: composition,
          },
        );
      }
    }

    return () => {
      if (tooltipInstanceRef.current) {
        tooltipInstanceRef.current.dispose();
        tooltipInstanceRef.current = null;
      }
      if (compositionTooltipRef.current) {
        compositionTooltipRef.current.dispose();
        compositionTooltipRef.current = null;
      }
    };
  }, [showCompare, composition]);

  const stock = selectedVariant?.stock || item?.stock || 0;
  const isPrescriptionRequired =
    item?.tabletdetails?.isPrescriptionRequired ||
    item?.isPrescriptionRequired ||
    false;
  const formatCurrency = (value) => Number(value || 0).toFixed(2);

  return (
    <div
      className={`tablet-card ${className}`}
      style={style}
      onClick={handleImageClick}
    >
      <img
        className="tablet-card-img"
        src={productImage}
        alt={productName}
        title={productName}
        loading="lazy"
        onError={(e) => {
          e.target.src = "/medicine.jpg";
        }}
      />

      {/* Price and Rating Display */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "#ffffff",
          padding: "2px 8px",
          borderRadius: "20px",
          fontSize: "11px",
          fontWeight: "600",
          display: "flex",
          alignItems: "center",
          gap: "4px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          border: "1px solid #e0e0e0",
          zIndex: 10,
        }}
      >
        <i
          className="fas fa-star text-warning"
          style={{ fontSize: "10px" }}
        ></i>
        <span>{averageRating.toFixed(1)}</span>
        <span
          style={{
            color: "#9ca3af",
            fontWeight: "400",
            fontSize: "9px",
          }}
        >
          ({totalRatings > 0 ? `${totalRatings}+` : "0+"})
        </span>
      </div>

      {/* {price > 0 && (
  <div className="d-flex justify-content-end fw-semibold mt-2 pe-2">
    <PriceDisplay 
      price={price} 
      size="sm" 
      className="mb-0"
      currencyText=""
      currency="₹"
    />
  </div>
)} */}
      {/* Compare Icon */}
      {showCompare && (
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
          <span
            ref={compareIconRef}
            onClick={handleCompareIconClick}
            data-tooltip-id="global-tooltip"
            data-tooltip-content="Compare"
            className="compare-btn-highlight"
            style={{
              position: "absolute",
              top: "10px",
              right: "10px",
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
          </span>
        </>
      )}

      {discount > 0 && (
        <div
          className="position-absolute"
          style={{
            top: "30%",
            left: "8px",
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "white",
            padding: "2px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: "600",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            zIndex: 1,
          }}
        >
          {itemDiscountType === "percentage" && itemDiscountprice ? `${itemDiscountprice}% OFF` : `${discount}% OFF`}
        </div>
      )}

      {stock > 0 && stock <= 10 && (
        <div
          className="position-absolute"
          style={{
            top: "8px",
            left: "8px",
            background: "#fbbf24",
            color: "#78350f",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "10px",
            fontWeight: "600",
            zIndex: 1,
          }}
        >
          Low Stock
        </div>
      )}

      <div className="tablet-card-content">
        <p className="tablet-card-title text-capitalize">
          {truncateText(productName, titleMaxLength)}
        </p>

        <div
          className="d-flex flex-wrap gap-1"
          style={{ fontSize: "10px", color: "#6b7280" }}
        >
          <span className="d-flex align-items-center gap-1">
            <i
              className="fas fa-shield-alt"
              style={{ fontSize: "9px", color: "#10b981" }}
            ></i>
            100% Authentic
          </span>
          <span>•</span>
          {composition && (
            <span
              ref={compositionRef}
              className="d-flex align-items-center gap-1"
              style={{ fontSize: "10px", color: "#6b7280", cursor: "help" }}
              data-bs-toggle="tooltip"
            >
              <i
                className="fas fa-flask"
                style={{ fontSize: "9px", color: "#8b5cf6" }}
              ></i>
              {truncateText(composition, titleMaxLength)}
            </span>
          )}

          {manufacturerName && (
            <span
              className="d-flex align-items-center gap-1"
              style={{ fontSize: "10px", color: "#6b7280", cursor: "help" }}
            >
              <i
                className="fas fa-info-circle"
                style={{ fontSize: "9px", color: "#8b5cf6" }}
              ></i>
              {truncateText(manufacturerName, titleMaxLength)}
            </span>
          )}
        </div>

        {isPrescriptionRequired && (
          <span
            className="badge mb-1"
            style={{
              background: "#fef3c7",
              color: "#92400e",
              fontSize: "9px",
              fontWeight: "600",
              padding: "3px 6px",
              border: "1px solid #fde68a",
            }}
          >
            <i
              className="fas fa-prescription"
              style={{ fontSize: "8px", marginRight: "3px" }}
            ></i>
            Prescription Required
          </span>
        )}

        {/* {variantName && (
          <p className="tablet-card-sub" onClick={handleVariantClick}>
            {variantName}
          </p>
        )} */}

        {isMobile && effectivePrice > 0 && (
          <div className="d-flex flex-row align-items-end price-details-wrapper">
            <span className="tablet-card-price-amount">₹{formatCurrency(effectivePrice)}</span>
            {itemDiscountprice &&
              itemDiscountprice > 0 &&
              itemDiscountprice !== itemPrice &&
              discount > 0 && (
                <span className="tablet-card-old-price">₹{formatCurrency(itemPrice)}</span>
              )}
          </div>
        )}
      </div>
      <div className="tablet-card-vendor-area">
        <div
          className="tablet-card-footer d-flex flex-column gap-1"
          onClick={handleVendorClick}
          style={{
            cursor:
              onVendorClick && item?.vendordetails ? "pointer" : "default",
          }}
        >
          <div className="d-flex align-items-center justify-content-between w-100 vendor-price-summary gap-2">
            {vendorName ? (
              <div className="d-flex align-items-center gap-2">
                <div className="vendor-img-wrapper">
                  {vendorImage ? (
                    <img src={vendorImage} alt={vendorName} />
                  ) : (
                    <div className="vendor-avatar-placeholder">
                      {vendorName.charAt(0)} /assets/img/logo.png
                    </div>
                  )}
                </div>
                <div className="vendor-info d-flex flex-column align-items-start">
                  {/* <span className="vendor-label">Sold by</span> */}
                  <p className="tablet-card-footer-title m-0">
                    {truncateText(vendorName, vendorNameMaxLength)}
                  </p>
                  {distanceInKm && (
                    <p className="tablet-card-distance m-0 text-primary" style={{ fontSize: "10px", color: "#6b7280" }}>
                      <i className="fas fa-map-marker-alt text-primary" style={{ fontSize: "8px", marginRight: "4px" }}></i>
                      {distanceInKm.toFixed(1)} km
                    </p>
                  )}
                  {!isMobile && effectivePrice > 0 && (
                    <div className="d-flex flex-row align-items-center justify-content-center gap-1 price-details-wrapper">
                      <span className="tablet-card-price-amount">
                        ₹{formatCurrency(effectivePrice)}
                      </span>
                      {itemDiscountprice &&
                        itemDiscountprice > 0 &&
                        itemDiscountprice !== itemPrice &&
                        discount > 0 && (
                          <span className="tablet-card-old-price">
                            ₹{formatCurrency(itemPrice)}
                          </span>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center gap-2">
                <div className="vendor-img-wrapper">
                  <img src="/assets/img/logo.png" alt="medicompare" />

                  {/* <div className="vendor-avatar-placeholder">
                    Medicompares
                  </div> */}
                </div>
                <div className="vendor-info d-flex flex-column align-items-start">
                  {/* <span className="vendor-label">Sold by</span> */}
                  <p className="tablet-card-footer-title m-0">
                    {truncateText("MediCompares", vendorNameMaxLength)}
                  </p>
                  {distanceInKm && (
                    <p className="tablet-card-distance m-0" style={{ fontSize: "10px", color: "#6b7280" }}>
                      <i className="fas fa-map-marker-alt" style={{ fontSize: "8px", marginRight: "4px" }}></i>
                      {distanceInKm.toFixed(1)} km away
                    </p>
                  )}
                  {!isMobile && effectivePrice > 0 && (
                    <div className="d-flex flex-row align-items-center justify-content-center price-details-wrapper">
                      <span className="tablet-card-price-amount">
                        ₹{formatCurrency(effectivePrice)}
                      </span>
                      {itemDiscountprice &&
                        itemDiscountprice > 0 &&
                        itemDiscountprice !== itemPrice &&
                        discount > 0 && (
                          <span className="tablet-card-old-price">
                            ₹{formatCurrency(itemPrice)}
                          </span>
                        )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            className="btn w-100"
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(item);
            }}
            style={{
              backgroundColor: "#8059ca",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: "600",
              boxShadow: "0 2px 4px rgba(79, 70, 229, 0.2)",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            Order Now
            <i
              className="fas fa-shopping-basket"
              style={{ fontSize: "10px" }}
            ></i>
          </button>

          {/* <CartQuantityControls
            bookingType="cart"

          /> */}
        </div>
      </div>
    </div>
  );
};
export default ProductCardMC;
