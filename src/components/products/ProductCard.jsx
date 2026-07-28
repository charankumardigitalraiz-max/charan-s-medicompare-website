import React, { useState } from "react";
import { imgUrl } from "../../Apiservice.jsx";
import VendorsSection from "./VendorsSection.jsx";
import { ProductImage, PriceDisplay, ProductDetailField } from "../ui";
import { getImageUrl } from "../../utils/index.js";
import { FaRegShareSquare, FaHeart } from "react-icons/fa";
import { IoIosHeartEmpty } from "react-icons/io";

const DetailRow = ({ label, value, title }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!value) return null;

  return (
    <div
      className={`detail-item-compact ${isExpanded ? "is-expanded" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      style={{
        cursor: value.length > 25 ? "pointer" : "default",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "4px 8px",
        // borderBottom: "1px solid #f1f5f9",
        width: "100%"
      }}
      title={title || value}
    >
      <span className="detail-label" style={{ fontSize: "11px", fontWeight: "500", color: "#6b7280", textTransform: "capitalize", letterSpacing: "0.02em" }}>{label}</span>
      <span className="detail-value" style={{ fontSize: "11.5px", fontWeight: "500", color: "#1f2937", textAlign: "right" }}>{value}</span>
    </div>
  );
};

const ProductCard = ({
  product,
  index,
  isFull,
  service,
  id,
  navigate,
  selectedVariants,
  expandedVendors,
  onToggleExpand,
  onToggleFavourite,
  onShare,
  onVendorAction,
  getDisplayPrice,
  getVendorPrice,
  getQuantityForVariant,
  rentAndCartButtonStyles,
  individualStyleForCart,
  contailerStyles,
  selectedVendors,
  categoryName,
  priceRange = [200, 100000],
  onSelectVariant,
  isSidebarOpen = true,
}) => {
  const formatCurrency = (value) => Number(value || 0).toFixed(2);

  // console.log('product card ', product);
  const tablet = product?.tablet || {};


  const hasValidImage = () => {
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

    return true;
  };

  if (!hasValidImage()) {
    return null;
  }

  const allVendors = product?.vendors || [];
  const maxQuantity = product?.tablet?.stock || 999;
  const selectedVariantId =
    selectedVariants[tablet._id] ||
    (tablet.variant &&
      Array.isArray(tablet.variant) &&
      tablet.variant.length > 0
      ? tablet.variant[0]._id
      : null);

  const vendors = allVendors.filter((vendor) => {
    try {
      const vendorPrice = getVendorPrice(vendor, tablet, selectedVariants);
      if (!vendorPrice || typeof vendorPrice !== "number") {
        return true;
      }
      return vendorPrice >= priceRange[0] && vendorPrice <= priceRange[1];
    } catch (error) {
      return true;
    }
  });

  const displayVendors = vendors.length > 0 ? vendors : allVendors;
  // console.log("vendor details", displayVendors)
  const getProductImage = () => {
    let imgSrc = null;

    if (
      selectedVariants[tablet._id] &&
      tablet.variant &&
      Array.isArray(tablet.variant)
    ) {
      const variant = tablet.variant.find(
        (v) => v && v._id === selectedVariants[tablet._id],
      );

      if (variant?.files?.length > 0) {
        imgSrc = getImageUrl(variant.files[0]);
      } else if (variant?.imageUrl?.length > 0) {
        imgSrc = variant.imageUrl[0];
      }
    }

    if (
      !imgSrc &&
      tablet.variant &&
      Array.isArray(tablet.variant) &&
      tablet.variant.length > 0
    ) {
      if (tablet.variant[0].files?.length > 0) {
        imgSrc = getImageUrl(tablet.variant[0].files[0]);
      } else if (tablet.variant[0].imageUrl?.length > 0) {
        imgSrc = tablet.variant[0].imageUrl[0];
      }
    }

    if (!imgSrc && tablet.files?.length > 0) {
      imgSrc = getImageUrl(tablet.files[0]);
    }

    if (!imgSrc && tablet.imageUrl?.length > 0) {
      imgSrc = tablet.imageUrl[0];
    }

    // Check if image source is valid, otherwise use default medicine.jpg
    if (
      !imgSrc ||
      imgSrc === "" ||
      imgSrc === "null" ||
      imgSrc === "undefined" ||
      imgSrc.includes("default.png") ||
      imgSrc.includes("placeholder")
    ) {
      return "/medicine.jpg";
    }

    return imgSrc;
  };

  const currentPrice = getDisplayPrice(product);
  const bookVendor =
    vendors.find((v) => v?.bookingType === "booking") || vendors[0];
  const isSurgery =
    categoryName?.toLowerCase().includes("surgery") ||
    tablet?.category?.name?.toLowerCase().includes("surgery");

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

  const gridClasses = isFull
    ? "col-12"
    : isSidebarOpen
      ? "col-lg-3 col-md-3 col-sm-6 col-12"
      : "col-lg-2 col-md-3 col-sm-6 col-6";

  if (isFull) {
    return (
      <div className="col-12 mb-2">
        {/* <div className="col-10 offset-1 col-md-8 offset-md-2 mb-2"> */}
        <div
          className="product-carddd w-100"
          onClick={() => navigate(`/${service}/${id}/${tablet.slug}`)}
          style={{
            cursor: "pointer",
            border: "1px solid #dee2e6",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            borderRadius: "8px",
            background: "#ffffff",
            transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)"
          }}
        >
          <div className="row">
            <div
              className="col-md-2"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >

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
                <span>{tablet?.averageRating?.toFixed(1) || "0"}</span>
                <span
                  style={{
                    color: "#9ca3af",
                    fontWeight: "400",
                    fontSize: "10px",
                  }}
                >
                  (
                  {tablet?.ratingCount > 0
                    ? `${tablet.ratingCount}+ ratings`
                    : "0 ratings"}
                  )
                </span>
              </div>

              <ProductImage
                src={getProductImage()}
                alt={tablet.name}
                className="img-fluid"
                onClick={() => navigate(`/${service}/${id}/${tablet.slug}`)}
              />
            </div>

            <div className="col-md-6 product-details-divider">
              <div
                className="product-name-titles text-capitalize"
                style={{
                  fontSize: "12px",
                  fontWeight: "600",
                  color: "#0f172a",
                  lineHeight: "1.4",
                  marginBottom: "4px"
                }}
              >
                {typeof tablet.name === "object"
                  ? tablet.name.name : tablet.name
                }
              </div>

              {tablet?.variant &&
                Array.isArray(tablet.variant) &&
                tablet.variant.length > 0 && (
                  <div
                    className="mt-2"
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      width: "200px",
                      marginBottom: "8px",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Select Variant :
                    </label>
                    <select
                      className="form-select form-select-sm"
                      value={String(
                        selectedVariantId || tablet.variant?.[0]?._id || "",
                      )}
                      onChange={(e) => {
                        e.stopPropagation();
                        onSelectVariant &&
                          onSelectVariant(e.target.value, tablet);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "auto",
                        height: "30px",
                        fontSize: "12px",
                        padding: "2px 6px",
                      }}
                    >
                      {tablet.variant
                        .filter((v) => v && v._id && v.name)
                        .map((v) => (
                          <option key={v._id} value={String(v._id)}>
                            {v.name}
                          </option>
                        ))}
                    </select>
                  </div>
                )}

              {currentPrice && (
                <div className="text-dark">
                  <span>MRP</span>
                  <span className="text-primary ms-1">₹{formatCurrency(currentPrice)}</span>
                  <small className="ms-4" style={{ fontSize: "11px" }}>
                    {" "}
                    (Inclusive of all Taxes)
                  </small>
                  {/* <small className="ms-2">
                    <i
                      className="fas fa-users text-primary ms-3 me-1"
                    ></i>
                    {tablet?.ratingCount > 0 ? `${tablet.ratingCount}+ ratings` : "0 ratings"}
                  </small> */}
                </div>
              )}

              <div
                className="metas mt-3"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px 16px",
                }}
              >
                {tablet?.manufacture?.name && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Manufacturer
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.manufacture.name.slice(0, 12)}
                    </span>
                  </span>
                )}

                {tablet?.form && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Form
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.form}
                    </span>
                  </span>
                )}

                {tablet?.strength && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Storage
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.strength.slice(0, 10)}
                    </span>
                  </span>
                )}

                {tablet?.compositions?.name && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Composition
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.compositions.name.slice(0, 10)}
                    </span>
                  </span>
                )}

                {tablet?.smapletype && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Sample
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.smapletype}
                    </span>
                  </span>
                )}

                {tablet?.model && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Model
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.model}
                    </span>
                  </span>
                )}

                {tablet?.condition && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Condition
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.condition}
                    </span>
                  </span>
                )}

                {tablet?.duration && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Duration
                    </span>
                    <span style={{ fontSize: "13px", fontWeight: "500", color: "#1f2937", marginTop: "2px" }}>
                      {tablet.duration}
                    </span>
                  </span>
                )}

                {tablet?.complexity && (
                  <span style={{ display: "flex", flexDirection: "column", paddingLeft: "10px", borderLeft: "2px solid #e2e8f0", minWidth: "110px", marginBottom: "10px" }}>
                    <span
                      style={{
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#6b7280",
                        textTransform: "uppercase",
                        letterSpacing: "0.03em"
                      }}
                    >
                      Complexity
                    </span>
                    <span
                      className={`fw-normal ${tablet?.complexity === "simple"
                        ? "text-success"
                        : tablet?.complexity === "medium"
                          ? "text-warning"
                          : tablet?.complexity === "complex"
                            ? "text-danger"
                            : "text-secondary"
                        }`}
                      style={{ fontSize: "13px", fontWeight: "600", marginTop: "2px" }}
                    >
                      {tablet?.complexity}
                    </span>
                  </span>
                )}

                {tablet?.treatmenttype && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Treatment Type
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.treatmenttype}
                    </span>
                  </span>
                )}

                {tablet?.procedureType && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Procedure Type
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.procedureType}
                    </span>
                  </span>
                )}

                {tablet?.recoveryTime && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Recovery Time
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.recoveryTime}
                    </span>
                  </span>
                )}

                {tablet?.shiftType && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Shift
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.shiftType.replace(/_/g, " ")}
                    </span>
                  </span>
                )}

                {tablet?.nursecareType && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Type
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.nursecareType}
                    </span>
                  </span>
                )}

                {tablet?.gender && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Gender
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.gender}
                    </span>
                  </span>
                )}

                {tablet?.bodypart && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Body Part
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.bodypart}
                    </span>
                  </span>
                )}

                {tablet?.reportsDuration && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Reports
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.reportsDuration}
                    </span>
                  </span>
                )}

                {tablet?.iscontrast && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "bold",
                        color: "black",
                      }}
                    >
                      Contrast
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.iscontrast}
                    </span>
                  </span>
                )}

                {tablet?.isFasting && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Fasting
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.isFasting
                        ? typeof tablet.isFasting === "string"
                          ? tablet.isFasting
                          : "Yes"
                        : "No"}
                    </span>
                  </span>
                )}

                {tablet?.parameterss?.length > 0 && (
                  <span style={{ display: "flex", flexDirection: "column" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#333",
                      }}
                    >
                      Parameters
                    </span>
                    <span style={{ fontSize: "14px" }}>
                      {tablet.parameterss.length}
                    </span>
                  </span>
                )}
              </div>
            </div>

            {/* VENDOR SECTION */}
            <div className="col-md-4">
              <div
                className="d-flex justify-content-end gap-2 mb-2"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="pd-action-btn"
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content="Compare"
                  onClick={(e) => {
                    e.stopPropagation();

                    const { category, subcategory, slug } = getSlugs(tablet);

                    if (slug) {
                      navigate(
                        `/${category || service}/${subcategory}/${slug}/compare`,
                      );
                    }
                  }}
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    border: "1px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                    transition: "all 0.2s ease",
                  }}
                >
                  <i
                    className="fa-solid fa-right-left"
                    style={{ fontSize: "14px", color: "#000" }}
                  ></i>
                </button>

                <button
                  className={`pd-action-btn ${tablet.isFavorite ? "active" : ""
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavourite(tablet._id);
                  }}
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    border: "1px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                    transition: "all 0.2s ease",
                  }}
                >
                  {tablet.isFavorite ? (
                    <FaHeart color="red" size={20} />
                  ) : (
                    <IoIosHeartEmpty size={20} />
                  )}
                </button>

                <button
                  className="pd-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(product);
                  }}
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    border: "1px solid #e0e0e0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    backgroundColor: "#fff",
                    transition: "all 0.2s ease",
                  }}
                >
                  <FaRegShareSquare size={18} />
                </button>
              </div>

              <div className="vendor-wrapperres">
                <div onClick={(e) => e.stopPropagation()}>
                  <VendorsSection
                    vendors={displayVendors}
                    tablet={tablet}
                    selectedVariants={selectedVariants}
                    selectedVendors={selectedVendors}
                    expandedVendors={{
                      ...expandedVendors,
                      [tablet._id]:
                        isFull && expandedVendors[tablet._id] === undefined
                          ? true
                          : expandedVendors[tablet._id],
                    }}
                    onToggleExpand={() => onToggleExpand(tablet._id)}
                    onVendorAction={onVendorAction}
                    getVendorPrice={getVendorPrice}
                    getQuantityForVariant={getQuantityForVariant}
                    service={service}
                    id={id}
                    navigate={navigate}
                    allVendorsCount={allVendors.length}
                    showAllVendors={isFull} // Pass a prop to show all vendors in full width
                    rentAndCartButtonStyles={rentAndCartButtonStyles}
                    contailerStyles={contailerStyles}
                    individualStyleForCart={individualStyleForCart}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  // console.log("product card design issue ", service)
  return (
    <div className={`${gridClasses} mb-3 mb-md-4 d-flex`}>
      <div
        className={`modern-product-card modern-product-card-${service} ${isFull ? "product-card-list-view" : "product-card-vertical h-100"
          }`}
        style={{
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          height: isFull ? "auto" : "100%",
          width: "100%",
          border: "1px solid #dee2e6",
          boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
          borderRadius: "10px",
          backgroundColor: "#ffffff",
          transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)"
        }}
        onClick={() => navigate(`/${service}/${id}/${tablet.slug}`)}
      >
        {/* Image Container */}
        <div className="product-image-container-vertical">
          <ProductImage
            src={getProductImage()}
            alt={tablet.name}
            onClick={() => navigate(`/${service}/${id}/${tablet.slug}`)}
          />

          {/* Rating Overlay for Grid View */}
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
            <span>{tablet?.averageRating?.toFixed(1) || "0"}</span>
            <span
              style={{ color: "#9ca3af", fontWeight: "400", fontSize: "10px" }}
            >
              ({tablet?.ratingCount > 0 ? `${tablet.ratingCount}` : "0"})
            </span>
          </div>

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
            data-tooltip-id="global-tooltip"
            // data-tooltip-content="Compare Prices"
            className="compare-btn-highlight"
            onClick={(e) => {
              e.stopPropagation();

              const { category, subcategory, slug } = getSlugs(tablet);

              if (slug) {
                navigate(
                  `/${category || service}/${subcategory}/${slug}/compare`,
                );
              }
            }}
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
          </div>
        </div>

        <div
          className="product-card-body"
          style={{
            flex: 1,
            padding: "8px 10px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <div className="d-flex align-items-start justify-content-between">
            <div
              className="product-title text-capitalize"
              title={tablet.name || ""}
              style={{
                fontSize: "13px",
                fontWeight: "500",
                lineHeight: "1.4",
                margin: 0,
                color: "#0f172a",
                letterSpacing: "-0.01em",
                overflow: "hidden",
                textOverflow: "ellipsis",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
              }}
            >
              {tablet.name}
            </div>
            <div
              className="d-flex align-items-center gap-1 ms-2"
              style={{ flexShrink: 0, marginTop: "2px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="action-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavourite(tablet._id);
                }}
              >
                {tablet.isFavorite ? (
                  <FaHeart size={16} color="#ef4444" />
                ) : (
                  <IoIosHeartEmpty size={16} color="#9ca3af" />
                )}
              </div>
              <div
                className="action-icon-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(product);
                }}
              >
                <FaRegShareSquare size={15} color="#9ca3af" />
              </div>
            </div>
          </div>

          <div
            className="d-flex align-items-center justify-content-between"
            style={{ gap: "4px", minWidth: 0 }}
          >
            {tablet?.manufacture?.name && (
              <span
                style={{
                  fontSize: "10.5px",
                  color: "#8059ca",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "0.02em",
                  background: "#f5f3ff",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  border: "1px solid rgba(125, 46, 255, 0.1)",
                  display: "inline-block",
                  maxWidth: "100%",
                }}
                title={tablet.manufacture.name}
              >
                By {tablet.manufacture.name}
              </span>
            )}
            <div></div>
          </div>

          {/* Product Details Grid — max 3 fields shown */}
          <div className="product-details-grid">
            {(() => {
              const allFields = [
                { label: "Form", value: tablet?.form },
                { label: "Storage", value: tablet?.strength },
                { label: "Composition", value: tablet?.compositions?.name },
                { label: "Packing", value: tablet?.packagingDetails },
                { label: "Sample", value: tablet?.smapletype },
                { label: "Model", value: tablet?.model },
                { label: "Condition", value: tablet?.condition },
                { label: "Time", value: tablet?.duration },
                { label: "Complexity", value: tablet?.complexity },
                { label: "Procedure", value: tablet?.procedureType },
                { label: "Treatment", value: tablet?.treatmenttype },
                { label: "Recovery", value: tablet?.recoveryTime },
                { label: "Shift", value: tablet?.shiftType?.replace(/_/g, " ") },
                { label: "Type", value: tablet?.nursecareType },
                { label: "Gender", value: tablet?.gender },
                { label: "Body", value: tablet?.bodypart },
                { label: "Contrast", value: tablet?.iscontrast },
                ...(tablet?.parameterss?.length > 0
                  ? [{ label: "Param", value: `${tablet.parameterss.length} Tests` }]
                  : []),
              ];

              const visibleFields = allFields.filter((f) => !!f.value).slice(0, 3);

              return visibleFields.map((field, idx) => (
                <DetailRow key={idx} label={field.label} value={field.value} />
              ));
            })()}

            {tablet?.variant &&
              Array.isArray(tablet.variant) &&
              tablet.variant.length > 0 && (
                <div className="detail-item-compact variant-select-item">
                  <select
                    className="variant-select-minimal"
                    value={String(selectedVariantId)}
                    onChange={(e) => {
                      e.stopPropagation();
                      onSelectVariant && onSelectVariant(e.target.value, tablet);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      outline: "none",
                      fontSize: "11px",
                      padding: "2px 4px",
                      width: "100%",
                      height: "24px",
                      border: "1px solid #dee2e6",
                      borderRadius: "4px",
                    }}
                  >
                    {tablet.variant.map((v) => (
                      <option key={v._id} value={String(v._id)}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
          </div>

          <div className={`d-flex ${isFull ? "" : "mt-auto"}`}>
            {currentPrice && (
              <PriceDisplay
                price={currentPrice}
                originalPrice={tablet.originalPrice || currentPrice * 1.4}
                size="md"
              />
            )}
          </div>
        </div>

        {/* Vendors Section */}
        <div onClick={(e) => e.stopPropagation()}>
          <VendorsSection
            vendors={displayVendors}
            tablet={tablet}
            rentAndCartButtonStyles={rentAndCartButtonStyles}
            contailerStyles={contailerStyles}
            individualStyleForCart={individualStyleForCart}
            selectedVariants={selectedVariants}
            selectedVendors={selectedVendors}
            expandedVendors={expandedVendors}
            onToggleExpand={() => onToggleExpand(tablet._id)}
            onVendorAction={onVendorAction}
            getVendorPrice={getVendorPrice}
            getQuantityForVariant={getQuantityForVariant}
            service={service}
            id={id}
            navigate={navigate}
            allVendorsCount={allVendors.length}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
