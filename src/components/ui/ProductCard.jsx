import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import { UseMediaQuery } from "../../hooks/UseMediaQuery";
import ProductImage from "./ProductImage.jsx";
import PriceDisplay from "./PriceDisplay.jsx";
import { getImageUrl } from "../../utils/index";
import { CartQuantityControls } from "./index";

const getSlugs = (data) => {
  let sub =
    data?.subcatdetails ||
    data?.subcategorydetails ||
    data?.subcategoryDetails ||
    data?.subcategorys;
  if (Array.isArray(sub)) {
    sub = sub[0];
  }

  const cat = sub?.catdetails || sub?.categoryDetails || sub?.category;

  return {
    category: cat?.slug,
    subcategory: sub?.slug,
    slug: data?.slug,
  };
};
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
const ProductCard = ({
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
  imageLoading = "lazy",
  fetchPriority = "auto",
  disableTooltips = false,
  currentService
}) => {
  const navigate = useNavigate();
  const location = useLocation();

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

  // useEffect(() => {
  //   console.log("currentService", currentService)
  // }, [currentService])

  const variantFiles =
    (selectedVariant?.files?.length > 0 ? selectedVariant.files : null) ||
    (item?.tabletdetails?.files?.length > 0 ? item.tabletdetails.files : null) ||
    (item?.files?.length > 0 ? item.files : null) ||
    item?.tabletvariants?.[0]?.files ||
    [];
  const variantImageUrl =
    (selectedVariant?.imageUrl?.length > 0 ? selectedVariant.imageUrl : null) ||
    (item?.tabletdetails?.imageUrl?.length > 0 ? item.tabletdetails.imageUrl : null) ||
    (item?.imageUrl?.length > 0 ? item.imageUrl : null) ||
    item?.tabletvariants?.[0]?.files ||
    [];
  const allImageFiles =
    variantFiles.length > 0 ? variantFiles : variantImageUrl;
  const productImageRaw = getImageUrl(allImageFiles[0]);
  const productImage = (
    !productImageRaw ||
    productImageRaw === "" ||
    productImageRaw === "null" ||
    productImageRaw === "undefined" ||
    productImageRaw.includes("default.png") ||
    productImageRaw.includes("placeholder")
  ) ? "/medicine.jpg" : productImageRaw;

  const [displayImage, setDisplayImage] = useState("/medicine.jpg");

  useEffect(() => {
    if (productImage && productImage !== "/medicine.jpg") {
      const img = new Image();
      img.onload = () => setDisplayImage(productImage);
      img.onerror = () => setDisplayImage("/medicine.jpg");
      img.src = productImage;
    } else {
      setDisplayImage("/medicine.jpg");
    }
  }, [productImage]);
  // Extract vendor details
  const price = item?.price || item?.tabletvariants?.[0]?.price || 0;
  const averageRating = item.averageRating || item?.tablet?.averageRating || 0;
  const totalRatings = item.totalRatings || item?.tablet?.ratingCount || 0;
  const vendorName = item?.vendordetails?.name || item?.vendorName || "";
  // console.log("vendordetails", item?.vendordetails?.name)
  // console.log("vendorname", item?.vendorName)
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
      return;
    }
    const tablet = item?.tabletdetails || item?.tabletDetails || item?.tablet || item;
    const { category, subcategory, slug } = getSlugs(tablet);
    if (slug) {
      const searchParams = location.search || "";
      navigate(`/${category || currentService || "medicine"}/${subcategory || "tablets"}/${slug}/compare${searchParams}`);
    }
  };

  const handleVendorClick = (e) => {
    e.stopPropagation();
    if (onVendorClick && item?.vendordetails) {
      onVendorClick(item.vendordetails);
      // console.log("vendorradetails", item.vendordetails)
    }
  };

  const compareIconRef = useRef(null);
  const tooltipInstanceRef = useRef(null);
  const compositionRef = useRef(null);
  const compositionTooltipRef = useRef(null);

  useEffect(() => {
    if (disableTooltips) return undefined;

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
  }, [showCompare, composition, disableTooltips]);

  const stock = selectedVariant?.stock || item?.stock || 0;
  const isPrescriptionRequired =
    item?.tabletdetails?.isPrescriptionRequired ||
    item?.isPrescriptionRequired ||
    false;
  const formatCurrency = (value) => Number(value || 0).toFixed(0);


  const BookNowButtons = [
    // "rx-medicines",
    // "medicine",
    "labtests",
    "lab-tests",
    "diagnostics",
    "homecare",
    "home-care",
    // "medical-equipment",
    // "medicalequipment",
    "nursingcare",
    "clinics-and-rehabs",
    "dentalservice",
    "dental-care",
    "medicaltreatment",
    "treatments",
    "surgeries",
    "ambulanceservice",
    "Ambulance"
  ]

  return (
    <div
      className={`tablet-card ${className}`}
      style={style}
      onClick={handleImageClick}
    >
      <img
        className="tablet-card-img"
        src={displayImage}
        alt={productName}
        title={productName}
        loading={imageLoading}
        fetchPriority={fetchPriority}
        decoding="async"
      />

      {/* Price and Rating Display */}
      {/* <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "#ffffff",
          padding: "4px 8px",
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
            fontSize: "10px",
          }}
        >
          ({totalRatings > 0 ? `${totalRatings}+ ratings` : "0 ratings"})
        </span>
      </div> */}

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
      {showCompare && (
        <>
          <style>{`
            .compare-flip-container {
              position: absolute;
              top: 10px;
              right: 10px;
              width: 26px;
              height: 26px;
              perspective: 1000px;
              cursor: pointer;
              z-index: 11;
              transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .compare-flip-inner {
              position: relative;
              width: 100%;
              height: 100%;
              text-align: center;
              transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
              transform-style: preserve-3d;
            }
            @keyframes compareContainerAutoWidth {
              0%, 15%, 85%, 100% {
                width: 26px;
              }
              30%, 70% {
                width: 70px;
              }
            }
            @keyframes compareAutoFlip {
              0%, 15%, 85%, 100% {
                transform: rotateY(0deg);
              }
              30%, 70% {
                transform: rotateY(180deg);
              }
            }
            .compare-flip-container-auto {
              animation: compareContainerAutoWidth 8s infinite ease-in-out;
            }
            .compare-flip-inner-auto {
              animation: compareAutoFlip 8s infinite ease-in-out;
            }
            .compare-flip-container:hover {
              width: 70px !important;
              animation: none !important;
            }
            .compare-flip-container:hover .compare-flip-inner {
              transform: rotateY(180deg) !important;
              animation: none !important;
            }
            .compare-face-front, .compare-face-back {
              position: absolute;
              width: 100%;
              height: 100%;
              backface-visibility: hidden;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 8px rgba(128, 89, 202, 0.35);
              border-radius: 13px;
            }
            .compare-face-front {
              background: #8059ca;
              color: #ffffff;
              border: 1.5px solid #8059ca;
            }
            .compare-face-back {
              background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
              color: #ffffff;
              border: none;
              transform: rotateY(180deg);
              font-size: 7.5px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.3px;
              white-space: nowrap;
              padding: 0 4px;
            }
          `}</style>
          <button
            ref={compareIconRef}
            onClick={handleCompareIconClick}
            data-tooltip-id="global-tooltip"
            data-tooltip-content="Compare"
            className="compare-flip-container compare-flip-container-auto focus:outline-none border-none bg-transparent p-0"
          >
            <div className="compare-flip-inner compare-flip-inner-auto">
              <div className="compare-face-front">
                <i className="fa-solid fa-right-left" style={{ fontSize: "10px", color: "inherit" }}></i>
              </div>
              <div className="compare-face-back">
                <i className="fa-solid fa-hand-point-right"
                  style={{ fontSize: "13px", marginRight: "2px", color: "#fff" }}></i>
                Compare
              </div>
            </div>
          </button>
        </>
      )}

      {/* {discount > 0 && (
        <div
          className="position-absolute"
          style={{
            top: "8px",
            left: "8px",
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "white",
            padding: "4px 8px",
            borderRadius: "6px",
            fontSize: "11px",
            fontWeight: "700",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            zIndex: 1,
          }}
        >
          {itemDiscountType === "percentage" && itemDiscountprice ? `${itemDiscountprice}% OFF` : `${discount}% OFF`}
        </div>
      )} */}

      {/* {stock > 0 && stock <= 10 && (
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
      )} */}

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
            onClick={(e) => {
              e.stopPropagation();
              onProductClick(item);
            }}
            className="w-full flex items-center justify-center gap-2 py-0.5 px-2 !rounded-md text-[8px] font-bold text-white bg-[#8059ca] shadow-sm shadow-[#8059ca]/20 hover:shadow-md transition-all duration-300 cursor-pointer border-none"
          >

            {BookNowButtons.includes(currentService?.toLowerCase()) ? 'Book Now' : 'Order Now'}
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
export default ProductCard;
