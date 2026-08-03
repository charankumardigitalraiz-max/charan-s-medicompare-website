import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// import { UseMediaQuery } from "../../hooks/UseMediaQuery";
import ProductImage from "./ProductImage.jsx";
import PriceDisplay from "./PriceDisplay.jsx";
import { getImageUrl } from "../../utils/index";
import { CartQuantityControls } from "./index";
import CompareOverlayButton from "./CompareOverlayButton.jsx";

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
    "labtests",
    "lab-tests",
    "diagnostics",
    "homecare",
    "home-care",
    "nursingcare",
    "clinics-and-rehabs",
    "dentalservice",
    "dental-care",
    "medicaltreatment",
    "treatments",
    "surgeries",
    "ambulanceservice",
    "Ambulance"
  ];

  return (
    <div
      className={`group !bg-white !border !border-[#f1f5f9] !rounded-[20px] !p-2.5 !shadow-[0_8px_20px_rgba(0,0,0,0.03)] hover:!shadow-[0_20px_40px_rgba(0,0,0,0.08)] hover:!-translate-y-2 !transition-all !duration-300 !h-full !w-full !flex !flex-col !relative !overflow-hidden !cursor-pointer ${className}`}
      style={style}
      onClick={handleImageClick}
    >
      <img
        className="!w-full !h-[100px] !object-contain !mb-1 !p-1 !bg-[#fdfdfd] !rounded-lg"
        src={displayImage}
        alt={productName}
        title={productName}
        loading={imageLoading}
        fetchPriority={fetchPriority}
        decoding="async"
      />

      {showCompare && (
        <CompareOverlayButton
          tablet={item?.tabletdetails || item?.tablet || item}
          serviceType={currentService}
          onClick={handleCompareIconClick}
        />
      )}

      <div className="!flex !flex-col">
        <p className="!text-[11px] sm:!text-xs !font-semibold !text-slate-800 !mb-2 !leading-tight !line-clamp-2 !overflow-hidden !min-h-[2.4em] capitalize" style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
          {truncateText(productName, titleMaxLength)}
        </p>

        <div
          className="flex flex-wrap gap-1 mt-1"
          style={{ fontSize: "10px", color: "#6b7280" }}
        >
          <span className="flex items-center gap-1">
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
              className="flex items-center gap-1"
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
              className="flex items-center gap-1"
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

        {isMobile && effectivePrice > 0 && (
          <div className="!flex !flex-row !items-end !flex-wrap !mt-auto">
            <span className="!font-bold !text-sm !text-[#1a1a1a] !leading-none">₹{formatCurrency(effectivePrice)}</span>
            {itemDiscountprice &&
              itemDiscountprice > 0 &&
              itemDiscountprice !== itemPrice &&
              discount > 0 && (
                <span className="!text-[10px] !text-slate-400 !line-through !ml-1.5">₹{formatCurrency(itemPrice)}</span>
              )}
          </div>
        )}
      </div>
      <div className="!flex !flex-col !gap-[2px] !pt-2 !mt-auto">
        <div
          className="!flex !items-center !justify-between !border-t-0 transition-all duration-200 pt-1 sm:pt-0 flex-col gap-1"
          onClick={handleVendorClick}
          style={{
            cursor:
              onVendorClick && item?.vendordetails ? "pointer" : "default",
          }}
        >
          <div className="flex items-center justify-between w-full flex-row gap-2">
            {vendorName ? (
              <div className="flex items-center gap-2">
                <div className="!w-[32px] !h-[32px] sm:!w-[45px] sm:!h-[45px] !rounded-[6px] sm:!rounded-[8px] !overflow-hidden !bg-[#f8fafc] !border !border-solid !border-[#f1f5f9] !shrink-0 !flex !items-center !justify-center">
                  {vendorImage ? (
                    <img src={vendorImage} alt={vendorName} className="!w-full !h-full !object-contain !p-[3px]" />
                  ) : (
                    <div className="!w-full !h-full !bg-gradient-to-br !from-[#321961] !to-[#321961] !text-white !flex !items-center !justify-center !font-bold !text-[12px]">
                      {vendorName.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-start !gap-0">
                  <p className="!text-[10.4px] sm:!text-[11.5px] !font-semibold !text-[#1a1a1a] !m-0">
                    {truncateText(vendorName, vendorNameMaxLength)}
                  </p>
                  {!isMobile && effectivePrice > 0 && (
                    <div className="!flex !flex-row !items-center !justify-start !gap-1.5 !shrink-0">
                      <span className="!font-bold !text-[13px] sm:!text-[14px] !text-[#1a1a1a] !leading-[1.2]">
                        ₹{formatCurrency(effectivePrice)}
                      </span>
                      {itemDiscountprice &&
                        itemDiscountprice > 0 &&
                        itemDiscountprice !== itemPrice &&
                        discount > 0 && (
                          <span className="!text-[10px] sm:!text-[12px] !text-[#94a3b8] !line-through">
                            ₹{formatCurrency(itemPrice)}
                          </span>
                        )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="!w-[32px] !h-[32px] sm:!w-[45px] sm:!h-[45px] !rounded-[6px] sm:!rounded-[8px] !overflow-hidden !bg-[#f8fafc] !border !border-solid !border-[#f1f5f9] !shrink-0 !flex !items-center !justify-center">
                  <img src="/assets/img/logo.png" alt="medicompare" className="!w-full !h-full !object-contain !p-[3px]" />
                </div>
                <div className="flex flex-col items-start !gap-0">
                  <p className="!text-[10.4px] sm:!text-[11.5px] !font-semibold !text-[#1a1a1a] !m-0">
                    {truncateText("MediCompares", vendorNameMaxLength)}
                  </p>
                  {!isMobile && effectivePrice > 0 && (
                    <div className="!flex !flex-row !items-center !justify-start !gap-1.5 !shrink-0">
                      <span className="!font-bold !text-[13px] sm:!text-[14px] !text-[#1a1a1a] !leading-[1.2]">
                        ₹{formatCurrency(effectivePrice)}
                      </span>
                      {itemDiscountprice &&
                        itemDiscountprice > 0 &&
                        itemDiscountprice !== itemPrice &&
                        discount > 0 && (
                          <span className="!text-[10px] sm:!text-[12px] !text-[#94a3b8] !line-through">
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
            className="w-full flex items-center justify-center gap-2 py-0.5 px-2 !rounded-md !text-[13px] !font-semibold !text-white bg-[#321961] shadow-sm shadow-[#321961]/20 hover:shadow-md transition-all duration-300 cursor-pointer border-none"
          >
            {BookNowButtons.includes(currentService?.toLowerCase()) ? 'Book Now' : 'Order Now'}
            <i
              className="fas fa-shopping-basket"
              style={{ fontSize: "10px" }}
            ></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCardMC;
