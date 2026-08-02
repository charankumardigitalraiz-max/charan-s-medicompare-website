import React from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { SectionProductCard, SectionHeader } from "../ui";
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
          className={`w-full px-3 py-3 my-3${liteMode ? " home-dynamic-section-lite" : ""
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

          <SectionHeader
            title={title}
            icon="fas fa-bolt"
            viewAllLink={`/${currentService || serviceId?.slug || "medicine"}/all`}
            viewAllText="View All"
            className="!mb-4"
          />

          <div className={extraSmallScreen ? "px-2" : ""}>
            {useSlider ? (
              <>
                <style>{`
                  .dynamic-equal-slider .slick-track {
                    display: flex !important;
                    align-items: stretch !important;
                  }
                  .dynamic-equal-slider .slick-slide {
                    height: auto !important;
                    display: flex !important;
                    flex-direction: column !important;
                  }
                  .dynamic-equal-slider .slick-slide > div {
                    height: 100% !important;
                    display: flex !important;
                    flex-direction: column !important;
                    flex: 1 !important;
                  }
                `}</style>
                <Slider {...dynamicSettings} className="dynamic-equal-slider">
                  {products.map((item, i) => {
                    const normalizedItem = normalizeItem(item);
                    const variant = Array.isArray(normalizedItem?.variants)
                      ? normalizedItem.variants[0]
                      : normalizedItem?.variants;

                    return (
                      <div key={i} className="px-2 h-full flex">
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
                          className="!h-full"
                        />
                      </div>
                    );
                  })}
                </Slider>
              </>
            ) : (
              <div className="flex flex-wrap -mx-3 items-stretch">
                {products.map((item, i) => {
                  const normalizedItem = normalizeItem(item);
                  const variant = Array.isArray(normalizedItem?.variants)
                    ? normalizedItem.variants[0]
                    : normalizedItem?.variants;

                  return (
                    <div
                      key={i}
                      className="w-1/2 md:w-[33.333%] lg:w-[25%] xl:w-[16.666%] px-3 mb-6 flex"
                    >
                      <SectionProductCard
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