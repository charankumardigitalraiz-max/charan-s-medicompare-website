import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductCard } from "../../../components/ui";
import { getImageUrl } from "../../../utils/index";
import CompareModal from "../../../components/CompareModal";
import SEOHelmet from "../../../components/SEOHelmet";
import { useResponsive } from "../../../hooks";
import DynamicCategorySections from "../../../components/home/DynamicCategorySections";

const MedicinesModule = ({
  imgUrl,
  discountProducts,
  supersaving,
  popularProducts,
  trendingProducts,
  handleProductClick,
  middleBanners,
  settings,
  service,
  categories,
}) => {
  const params = useParams();
  const currentService = service || params.service || "medicine";
  const navigate = useNavigate();
  const { isMobile, isXs: extraSmallScreen } = useResponsive();
  const [triggerModal, setTriggerModal] = useState(false);

  useEffect(() => {
    if (currentService === "medicine" || currentService === "medicines") {
      setTriggerModal(true);
    }
  }, [currentService]);

  const handleCompareClick = (item) => {
    const productId =
      item?.tabletdetails?.slug || item?.tablet?.slug || item?.slug || null;

    if (!productId) {
      toast.error("Product ID not found");
      return;
    }
    const tablet = item?.tabletdetails || item?.tablet || item;
    const categorySlug = tablet?.category?.slug || tablet?.subcategorys?.category?.slug || 'medicine';
    const subcategorySlug = tablet?.subcategorys?.slug || 'tablets';

    navigate(`/${categorySlug}/${subcategorySlug}/${productId}/compare`);
  };

  const handleVendorClick = (vendor) => {

    console.log("vendor", vendor?.bussinessdetails?.vendorId);
    const vendorId =
      vendor?.businessdetails?.vendorId ||
      vendor?.vendorId ||
      vendor?.businessdetails?._id ||
      vendor?.bussinessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      console.log(sessionStorage.getItem("vendorId"));
      const name =
        vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
      const vendorSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  return (
    <>
      <SEOHelmet page="medicines" />
      <CompareModal triggerShow={triggerModal} />

      {/* {discountProducts && discountProducts.length > 0 && (
        <section
          className="container-fluid px-3 py-3 mb-3"
          style={{
            marginTop: isMobile && "20px",
            backgroundColor: "#0596691f",
          }}
        >
          <div className="container-fluid">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <div
                style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  background:
                    "linear-gradient(135deg, rgba(125, 46, 255, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)",
                  borderRadius: "50px",
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#8059ca",
                }}
              >
                <i className="fas fa-bolt" style={{ marginRight: "8px" }}></i>
                You May Like
              </div>

              <Link
                to={`/${currentService}/all`}
                style={{
                  padding: "8px 20px",
                  borderRadius: "50px",
                  border: "1px solid #e5e7eb",
                  background: "#fff",
                  color: "#1a1a1a",
                  fontSize: "14px",
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.3s ease",
                }}
              >
                View All
                <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            <div
              className={`doctor-slider-one owl-theme aos ${
                extraSmallScreen ? "px-3" : ""
              }`}
            >
              <Slider {...supersaving}>
                {discountProducts.map((item, index) => {
                  const DiscusedPrice = item?.tablet?.price;
                  const firstVendor =
                    item.vendordetails ||
                    (item.vendors && item.vendors[0]
                      ? item.vendors[0]
                      : null) ||
                    (item.vendor ? item.vendor : null);
                  const normalizedItem = {
                    ...item,
                    tabletdetails: item.tabletdetails || item.tablet || item,
                    vendordetails: firstVendor
                      ? {
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
                        }
                      : null,
                    variants:
                      item.variants ||
                      item.tablet?.variant ||
                      item.tabletdetails?.variant ||
                      [],
                  };
                  const variant = Array.isArray(normalizedItem?.variants)
                    ? normalizedItem.variants[0]
                    : normalizedItem?.variants;
                  return (
                    <div key={index} className="slider-card-wrapper">
                      <ProductCard
                        item={normalizedItem}
                        variant={variant}
                        onProductClick={handleProductClick}
                        onCompareClick={handleCompareClick}
                        onVendorClick={handleVendorClick}
                        isMobile={isMobile}
                        maxStock={variant?.stock || 999}
                      />
                    </div>
                  );
                })}
              </Slider>
            </div>
          </div>
        </section>
      )} */}

      {/* Short banners */}
      {middleBanners?.length > 0 && (
        <section
          className="section welcome-section px-3 mt-3 offers-section bg-white"
        >
          <div className="container-fluid">
            <div className="text-center mb-3">
              <h2
                className="mb-3 text-[28px] font-semibold text-[#1a1a1a]"
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
                      className="px-1 rounded-[10px]"
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
                  className="px-1 rounded-[10px]"
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Dynamic Products Sections */}
      <DynamicCategorySections
        sections={[
          popularProducts && popularProducts.length > 0 && {
            _id: "trending-now",
            title: "Trending Now",
            products: popularProducts,
            serviceId: { slug: currentService },
          },
          trendingProducts && trendingProducts.length > 0 && {
            _id: "popular-products",
            title: "Popular Products",
            products: trendingProducts,
            serviceId: { slug: currentService },
          },
        ].filter(Boolean)}
        onProductClick={handleProductClick}
        onCompareClick={handleCompareClick}
        onVendorClick={handleVendorClick}
        imgUrl={imgUrl}
        currentService={currentService}
        sliderSettings={supersaving}
      />
    </>
  );
};

export default MedicinesModule;
