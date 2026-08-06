import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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
 * Modern Premium Product Card Component
 */
const SectionProductCard = ({
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
  titleMaxLength = 35,
  vendorNameMaxLength = 20,
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
  console.log("currectservice", currentService)

  const selectedVariant =
    variant ||
    (Array.isArray(item?.variants) ? item.variants[0] : item?.variants) ||
    (Array.isArray(item?.tabletvariants) ? item.tabletvariants[0] : item?.tabletvariants) ||
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
    (typeof item?.manufacture === "string"
      ? item.manufacture
      : "") ||
    "";

  const composition =
    (typeof item?.tablet?.compositions?.name === "object"
      ? item.tablet.compositions.name.name
      : item?.tablet?.compositions?.name) ||
    (typeof item?.compositions === "object"
      ? item.compositions.name
      : item?.compositions) ||
    (typeof item?.compositions?.name === "string"
      ? item.compositions.name
      : "") ||
    "";

  const itemPrice =
    parseFloat(
      selectedVariant?.price ||
      item?.productDetails?.price ||
      item?.price ||
      item?.vendordetails?.price ||
      item?.tabletdetails?.price ||
      0,
    ) || 0;

  const itemDiscountprice =
    parseFloat(
      selectedVariant?.discountPrice ||
      selectedVariant?.discountprice ||
      item?.productDetails?.discountprice ||
      item?.productDetails?.discountPrice ||
      item?.vendordetails?.discountprice ||
      item?.vendordetails?.discountPrice ||
      null,
    ) || null;

  // Calculate discount price based on discountType
  let calculatedItemDiscountPrice = itemDiscountprice;
  const itemDiscountType =
    selectedVariant?.discountType ||
    item?.productDetails?.discountType ||
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

  const truncateText = (text, maxLength) => {
    if (!text || typeof text !== "string") return "";
    return text.length > maxLength
      ? text.substring(0, maxLength) + "..."
      : text;
  };

  // Dynamic detail resolver: returns up to two non-empty specification details
  const getProductSpecs = () => {
    const specs = [];

    // Check fields in order of priority
    if (item?.form) specs.push({ label: "Form", value: item.form });
    if (item?.testtype) specs.push({ label: "Test Type", value: item.testtype });
    if (item?.smapletype) specs.push({ label: "Sample", value: item.smapletype });
    if (item?.isFasting) specs.push({ label: "Fasting", value: item.isFasting });
    if (item?.reportsDuration) specs.push({ label: "Reports", value: item.reportsDuration });
    if (item?.shiftType) specs.push({ label: "Shift", value: item.shiftType });
    if (item?.ambulancetype) specs.push({ label: "Type", value: item.ambulancetype });
    if (item?.condition) specs.push({ label: "Condition", value: item.condition });
    if (item?.model) specs.push({ label: "Model", value: item.model });

    // Return at most two specifications
    return specs.slice(0, 2);
  };

  const specs = getProductSpecs();

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

    if (showCompare && compareIconRef.current && window.bootstrap) {
      const tooltipElement = compareIconRef.current;
      const existingTooltip =
        window.bootstrap.Tooltip.getInstance(tooltipElement);
      if (!existingTooltip) {
        tooltipInstanceRef.current = new window.bootstrap.Tooltip(
          tooltipElement,
          {
            placement: "top",
            title: "Add to Compare",
          },
        );
      }
    }

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

  const isPrescriptionRequired =
    item?.tabletdetails?.isPrescriptionRequired ||
    item?.isPrescriptionRequired ||
    false;
  const formatCurrency = (value) => Number(value || 0).toFixed(0);

  // Map each service/category to its specific button label + icon
  const SERVICE_BUTTON_MAP = {
    medicine: { label: "Compare & Buy", icon: "fa-pills" },
    "rx-medicines": { label: "Compare & Buy", icon: "fa-pills" },
    labtests: { label: "Book a Lab Test", icon: "fa-flask" },
    "lab-tests": { label: "Book a Lab Test", icon: "fa-flask" },
    diagnostics: { label: "Book a Scan", icon: "fa-microscope" },
    homecare: { label: "Book a Home Visit", icon: "fa-home" },
    "home-care": { label: "Book a Home Visit", icon: "fa-home" },
    nursingcare: { label: "Book a Nurse", icon: "fa-user-nurse" },
    "clinics-and-rehabs": { label: "Book a Appointment", icon: "fa-clinic-medical" },
    dentalservice: { label: "Book a Dental", icon: "fa-tooth" },
    "dental-care": { label: "Book a Dental", icon: "fa-tooth" },
    medicalequipment: { label: "Rent / Buy", icon: "fa-wheelchair" },
    medicaltreatment: { label: "Book a Treatment", icon: "fa-procedures" },
    treatments: { label: "Book a Treatment", icon: "fa-procedures" },
    surgeries: { label: "Book a Surgery", icon: "fa-syringe" },
    ambulanceservice: { label: "Book a Ambulance", icon: "fa-ambulance" },
    ambulance: { label: "Book a Ambulance", icon: "fa-ambulance" },
  };

  const getButtonConfig = (service) => {
    if (!service) return { label: "Compare Prices", icon: "fa-balance-scale" };
    const s = service.toLowerCase();
    if (SERVICE_BUTTON_MAP[s]) return SERVICE_BUTTON_MAP[s];
    const matchedKey = Object.keys(SERVICE_BUTTON_MAP).find((key) => s.includes(key) || key.includes(s));
    return matchedKey ? SERVICE_BUTTON_MAP[matchedKey] : { label: "Compare Prices", icon: "fa-balance-scale" };
  };

  const ctaConfig = getButtonConfig(currentService);

  return (
    <div
      className={`group relative flex flex-col bg-white rounded-md border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] hover:shadow-[0_20px_50px_rgba(128,89,202,0.08)] hover:-translate-y-1.5 transition-all duration-300 overflow-hidden w-full cursor-pointer p-4 ${className}`}
      style={style}
      onClick={handleImageClick}
    >
      {/* Product Image Section */}
      <div className="relative w-full h-[140px] flex items-center justify-center p-3 bg-slate-50/50 rounded-2xl overflow-hidden mb-3">

        <img
          className="w-[115px] h-[115px] rounded-full object-cover bg-white border border-slate-200/80 shadow-sm group-hover:scale-105 transition-transform duration-300 relative z-10"
          src={displayImage}
          alt={productName}
          title={productName}
          loading={imageLoading}
          fetchPriority={fetchPriority}
          decoding="async"
        />

        {/* Dynamic Water Wave Flow Effect at the Bottom Side */}
        {/* <div className="absolute bottom-0 left-0 w-[150%] h-[20px] pointer-events-none z-0 overflow-hidden flex items-end">
          <svg
            className="w-full h-[14px] opacity-35 absolute bottom-0 left-0"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{
              animation: "waveMove 6s ease-in-out infinite",
              fill: "rgba(109, 77, 184, 0.1)",
            }}
          >
            <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" />
          </svg>
          <svg
            className="w-full h-[18px] opacity-55 absolute bottom-0 left-0"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
            style={{
              animation: "waveMove 9s ease-in-out infinite alternate",
              fill: "rgba(109, 77, 184, 0.15)",
            }}
          >
            <path d="M0,50 C100,80 200,20 300,50 C400,80 500,20 600,50 C700,80 800,20 900,50 C1000,80 1100,20 1200,50 L1200,120 L0,120 Z" />
          </svg>
        </div> */}

        {/* Prescription Badge */}
        {isPrescriptionRequired && (
          <span className="absolute top-2.5 left-2.5 bg-amber-500/10 backdrop-blur-md text-amber-700 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1 shadow-sm z-10">
            <i className="fas fa-prescription text-[8px]" />
            Rx Required
          </span>
        )}

        {/* Compare Button */}
        {/* {showCompare && (
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <CompareOverlayButton
              tablet={item?.tabletdetails || item?.tablet || item}
              serviceType={currentService}
              onClick={handleCompareIconClick}
            />
          </div>
        )} */}

        {/* Discount Tag */}
        {discount > 0 && (
          <span className="absolute bottom-2.5 left-2.5 z-20 bg-red-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-lg shadow-sm">
            {discount}% OFF
          </span>
        )}
      </div>

      {/* Product Info Section */}
      <div className="flex flex-col flex-1">
        {/* Manufacturer / Subtitle */}
        {manufacturerName && (
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#321961] mb-1">
            {truncateText(manufacturerName, 20)}
          </span>
        )}

        {/* Product Title */}
        <h4 className="!text-sm !font-bold !text-gray-800 !leading-snug group-hover:text-[#321961] transition-colors line-clamp-2 min-h-[40px] !m-0 !mb-2 !capitalize">
          {truncateText(productName, titleMaxLength)}
        </h4>

        {/* Composition / Properties */}
        {composition && (
          <div
            ref={compositionRef}
            className="!flex !items-center !gap-1.5 !text-[11px] !text-gray-400 !font-medium !line-clamp-1 !mb-1.5"
            data-bs-toggle="tooltip"
          >
            <i className="fas fa-flask text-[10px] text-violet-400" />
            <span>{truncateText(composition, 25)}</span>
          </div>
        )}

        {/* Dynamic Key Details (Max 2) — same style as composition */}
        {specs.map((spec, idx) => (
          <div key={idx} className="!flex !items-center !gap-1.5 !text-[11px] !text-gray-400 !font-medium !line-clamp-1 !mb-1">
            <i className="fas fa-tag text-[10px] text-violet-400" />
            <span>{spec.label}: {spec.value}</span>
          </div>
        ))}

        {/* Pricing Area */}
        {effectivePrice > 0 && (
          <div className="flex items-baseline gap-1.5 mt-auto mb-2">
            <span className="!text-lg font-[600]  text-gray-900 leading-none">
              ₹{formatCurrency(effectivePrice)}
            </span>
            {itemDiscountprice && discount > 0 && (
              <span className="!text-xs text-gray-400 !line-through !font-medium">
                ₹{formatCurrency(itemPrice)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Footer Area: Button Only */}
      <div className="flex flex-col gap-2">
        {/* CTA Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onProductClick(item);
          }}
          className="!w-full !mt-1.5 !flex !items-center !justify-center !gap-2 !py-2 !px-4 !rounded-sm !text-xs !font-bold !text-white !bg-[#321961] hover:!bg-[#6d4db8] !transition-all !duration-300 !shadow-[0_4px_12px_rgba(128,89,202,0.15)] hover:!shadow-[0_6px_20px_rgba(128,89,202,0.25)] !border-none !cursor-pointer"
        >
          <i className={`fas ${ctaConfig.icon} text-[10px]`} />
          <span>{ctaConfig.label}</span>
          <i className="fas fa-arrow-right text-[9px] ml-auto group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};

export default SectionProductCard;
