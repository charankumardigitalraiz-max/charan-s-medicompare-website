import React from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { ProductCard } from "../ui";
import { useResponsive } from "../../hooks";
import HomeProductScrollCarousel from "./HomeProductScrollCarousel";

const DynamicCategorySections = ({
  sections,
  onProductClick,
  onCompareClick,
  onVendorClick,
  imgUrl,
  currentService,
  isMobile: isMobileProp,
  sliderSettings,
  liteMode = false,
}) => {
  const {
    isXs: extraSmallScreen,
    isTabletOrBelow: isSmallLaptop,
    isMobile: isMobileLocal,
    isTablet,
  } = useResponsive();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileLocal;
  // console.log("current service in category section",)
  const slidesToShow = extraSmallScreen
    ? 2
    : isTablet
      ? 3
      : isSmallLaptop
        ? 5
        : 6;

  const NextArrow = (props) => {
    const { style, onClick } = props;
    return (
      <button
        className="meq-arrow-btn dental-next"
        style={{ ...style, display: "block" }}
        onClick={onClick}
        aria-label="Next"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    );
  };

  const PrevArrow = (props) => {
    const { style, onClick } = props;
    return (
      <button
        className="meq-arrow-btn dental-prev"
        style={{ ...style, display: "block" }}
        onClick={onClick}
        aria-label="Previous"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
    );
  };

  const dynamicSettings = {
    dots: false,
    infinite: true,
    speed: 400,
    slidesToShow: slidesToShow,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    pauseOnHover: true,
    pauseOnFocus: true,
    arrows: slidesToShow > 2,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    ...(sliderSettings || {}),
  };

  // const bgColors = [
  //   "#E0FDFF",
  //   "#E0FFEA",
  //   "#EEFFE0",
  //   "#f3e8ff",
  //   "#FFDFD1",
  //   "#FEE0FF",
  // ];

  const bgColors = [
    "#e9faff",
    "#f2ffec",
    "#fff1e0",
    "#fff3f0",
    "#fbeeff",
    "#fff7e6",
  ];

  const normalizeItem = (item) => {
    const DiscusedPrice = item?.tablet?.price;

    // NEW API SUPPORT
    const productDetails = item?.productDetails || {};
    const businessDetails = productDetails?.businessDetails || {};
    const vendorDetails = productDetails?.vendor || {};

    const firstVendor =
      item.vendordetails ||
      (item.vendors && item.vendors[0]) ||
      item.vendor ||
      null;

    // Extract vendor information from new API structure
    const newApiVendor = {
      vendorId: vendorDetails._id || vendorDetails.id,
      name: businessDetails.name || vendorDetails.firstName + " " + vendorDetails.lastName || "",
      price: productDetails.price || 0,
      discountprice: productDetails.discountprice || null,
      discountType: productDetails.discountType || null,
      stock: productDetails.stock || 0,
      bussiness_image: businessDetails.bussiness_image || null,
      bussinessdetails: {
        name: businessDetails.name || "",
        bussiness_image: businessDetails.bussiness_image || null,
      },
    };

    // Use new API vendor if available, otherwise fall back to old structure
    const finalVendor = productDetails.price ? newApiVendor : (firstVendor ? {
      ...firstVendor,
      vendorId:
        firstVendor.vendorId ||
        firstVendor._id ||
        firstVendor.id,
      name:
        firstVendor.name ||
        firstVendor.vendorName ||
        firstVendor?.bussinessdetails?.name ||
        "",
      price:
        firstVendor.price ||
        firstVendor.matchedVariantPrice ||
        firstVendor.matchedPrice ||
        firstVendor.mrp ||
        firstVendor.sellingPrice ||
        DiscusedPrice ||
        0,
    } : null);

    return {
      ...item,
      tabletdetails: item.tabletdetails || item.tablet || item,
      vendordetails: finalVendor,
      variants:
        item.variants ||
        item.tablet?.variant ||
        item.tabletdetails?.variant ||
        productDetails.variants ||
        [],
    };
  };

  return (
    sections &&
    sections.length > 0 &&
    sections.map((section, index) => {
      const { title, serviceId, products } = section;

      const useSlider = products?.length > slidesToShow;

      return (
        <section
          className={`container-fluid px-3 py-3 my-3${liteMode ? " home-dynamic-section-lite" : ""
            }`}
          style={
            liteMode
              ? {
                background:
                  "linear-gradient(135deg, rgba(243, 232, 255, 0.85) 0%, rgba(237, 233, 254, 0.9) 100%)",
                border: "1px solid rgba(128, 89, 202, 0.12)",
                borderRadius: "24px",
                boxShadow: "0 8px 24px -8px rgba(147, 51, 234, 0.1)",
              }
              : {
                background:
                  "linear-gradient(135deg, rgba(243, 232, 255, 0.4) 0%, rgba(216, 180, 254, 0.15) 100%)",
                backdropFilter: "blur(24px) saturate(180%)",
                WebkitBackdropFilter: "blur(24px) saturate(180%)",
                border: "1px solid rgba(255, 255, 255, 0.55)",
                borderRadius: "24px",
                boxShadow:
                  "inset 0 1px 1px 0 rgba(255, 255, 255, 0.65), 0 12px 32px -4px rgba(147, 51, 234, 0.08)",
              }
          }
          key={section._id}
        >

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
            <div
              style={{
                padding: "4px 10px",
                background:
                  "linear-gradient(135deg, rgba(125, 46, 255, 0.1), rgba(59, 130, 246, 0.1))",
                borderRadius: "50px",
                fontSize: "14px",
                fontWeight: "600",
                color: "#8059ca",
              }}
            >
              <i className="fas fa-bolt me-1"></i>
              {title}
            </div>

            <Link
              to={`/${currentService || serviceId?.slug || "medicine"}/all`}
              className="top-vendor-badge"
              style={{
                padding: isMobile ? "8px" : "8px 20px",
                borderRadius: isMobile ? "50%" : "50px",
                width: isMobile ? "36px" : "auto",
                height: isMobile ? "36px" : "auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "600",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#8059ca";
                e.currentTarget.style.color = "#ffffff";
              }}
            // onMouseLeave={(e) => {
            //   e.currentTarget.style.background = "#ffffff";
            //   e.currentTarget.style.color = "#8059ca";
            // }}
            >
              {isMobile ? "" : "View All"}
              <i className={isMobile ? "fas fa-arrow-right" : "fas fa-arrow-right ms-1"}></i>
            </Link>
          </div>



          <div className={extraSmallScreen ? "px-2" : ""}>
            {useSlider ? (
              <Slider {...dynamicSettings}>
                {products.map((item, i) => {
                  const normalizedItem = normalizeItem(item);
                  const variant = Array.isArray(normalizedItem?.variants)
                    ? normalizedItem.variants[0]
                    : normalizedItem?.variants;

                  return (
                    <div key={i} className="px-2">
                      <ProductCard
                        item={normalizedItem}
                        variant={variant}
                        imgUrl={imgUrl}
                        onProductClick={onProductClick}
                        onCompareClick={onCompareClick}
                        onVendorClick={onVendorClick}
                        maxStock={variant?.stock || 999}
                        isMobile={isMobile}
                        currentService={currentService}
                        disableTooltips={liteMode}
                      />
                    </div>
                  );
                })}
              </Slider>
            ) : (
              <div className="row g-3">
                {products.map((item, i) => {
                  const normalizedItem = normalizeItem(item);
                  const variant = Array.isArray(normalizedItem?.variants)
                    ? normalizedItem.variants[0]
                    : normalizedItem?.variants;

                  return (
                    <div
                      key={i}
                      className="col-xl-2 col-lg-3 col-md-4 col-6"
                    >
                      <ProductCard
                        item={normalizedItem}
                        variant={variant}
                        imgUrl={imgUrl}
                        onProductClick={onProductClick}
                        onCompareClick={onCompareClick}
                        onVendorClick={onVendorClick}
                        maxStock={variant?.stock || 999}
                        isMobile={isMobile}
                        currentService={currentService}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      );
    })
  );
};

export default DynamicCategorySections;