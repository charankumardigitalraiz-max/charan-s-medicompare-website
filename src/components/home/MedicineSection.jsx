import React from "react";
import { Link } from "react-router-dom";
import { ProductCard } from "../ui";
import { useMediaQuery } from "react-responsive";
import Slider from "react-slick";

const MedicineSection = ({
  title,
  icon,
  iconColor,
  viewAllLink = "/medicine/all",
  medicines,
  decorativeElements,
  onProductClick,
  onCompareClick,
  onVendorClick,
  imgUrl,
  liteMode = false,
}) => {
  const isMobile = useMediaQuery({ query: "(max-width: 768px)" });

  const normalizeItem = (item) => {
    const DiscusedPrice = item?.tablet?.price;
    const vendorsWithCurrentVariation =
      item?.vendors?.map((vendor) => {
        const currentVariation =
          vendor?.variant
            ?.map((vendorVar) => {
              const tabletVar = item?.tablet?.variant?.find(
                (tVar) =>
                  tVar?._id?.toString() === vendorVar?.variantId?.toString(),
              );

              if (!tabletVar) return null;

              return {
                _id: tabletVar._id,
                tabletVariantId: tabletVar._id,
                name: tabletVar.name,
                files: tabletVar.files,
                price: vendorVar.price || DiscusedPrice,
                discountPrice: vendorVar.discountprice ?? null,
                stock: vendorVar.stock,
                isStock: vendorVar.isStock,
              };
            })
            ?.filter(Boolean) || [];

        return {
          ...vendor,
          currentVariation,
        };
      }) || [];

    const currentvendor = vendorsWithCurrentVariation[0];
    const variants = currentvendor?.currentVariation?.[0];

    return {
      ...item,
      tabletdetails: item.tabletdetails || item.tablet || item,
      vendordetails: currentvendor
        ? {
          ...currentvendor,
          vendorId:
            currentvendor.vendorId || currentvendor._id || currentvendor.id,
          name:
            currentvendor.name ||
            currentvendor.vendorName ||
            currentvendor?.bussinessdetails?.name ||
            "",
          price:
            currentvendor.price ||
            currentvendor.matchedVariantPrice ||
            currentvendor.matchedPrice ||
            currentvendor.mrp ||
            currentvendor.sellingPrice ||
            DiscusedPrice ||
            0,
          bookingType:
            currentvendor.bookingType || currentvendor.bookingtype || "cart",
        }
        : {
          name: "",
          price: DiscusedPrice || 0,
          bookingType: "cart",
        },
      variants: variants,
      vendors: item.vendors || [],
    };
  };

  if (!medicines?.length) return null;

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

  const sliderSettings = {
    dots: false,
    infinite: medicines.length > 6,
    speed: 500,
    autoplay: true,
    autoplaySpeed: 3000,
    slidesToShow: 6,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 4,
          infinite: medicines.length > 4,
        }
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 3,
          infinite: medicines.length > 3,
        }
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          infinite: medicines.length > 2,
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 2,
          infinite: medicines.length > 2,
        }
      }
    ]
  };

  return (
    <section
      className="my-2 px-2 px-md-3 home-medicine-section"
      style={{
        background: "rgba(128, 89, 202, 0.06)",
        borderRadius: "24px",
        boxShadow: "0 12px 32px -4px rgba(128, 89, 202, 0.08)",
        padding: "16px 0 20px 0",
        position: "relative",
        overflow: "hidden",
        margin: "12px 15px",
      }}
    >
      {decorativeElements?.map((element, index) => (
        <div key={index} className={element.className} style={element.style}>
          <i className={element.icon} />
        </div>
      ))}

      <div style={{ position: "relative", zIndex: 1 }}>
        <div className="d-flex align-items-center justify-content-between mb-3 px-1">
          <div
            style={{
              display: "inline-block",
              padding: "4px 10px",
              background: `${iconColor}20`,
              borderRadius: "50px",
              fontSize: "14px",
              fontWeight: "600",
              color: iconColor,
            }}
          >
            <i className={icon} style={{ marginRight: "8px" }} />
            {title}
          </div>

          <Link
            to={viewAllLink}
            onClick={() => {
              localStorage.setItem("fixedType", "medicine");
            }}
            className="top-vendor-badge"
            style={{
              padding: isMobile ? "8px" : "4px 10px",
              color: iconColor,
              borderColor: iconColor,
              fontWeight: "600",
              background: `${iconColor}15`,
              borderRadius: isMobile ? "50%" : "50px",
              width: isMobile ? "32px" : "auto",
              height: isMobile ? "32px" : "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {!isMobile && "View All"}
            <i className={`isax isax-arrow-right-1 ${!isMobile ? "ms-1" : ""}`} />
          </Link>
        </div>

        <div className="doctor-slider-one owl-theme px-3">
          <Slider {...sliderSettings}>
            {medicines.map((item, index) => {
              const normalizedItem = normalizeItem(item);
              const variants = normalizedItem.variants;

              return (
                <div
                  key={item._id || index}
                  className="slider-card-wrapper"
                >
                  <ProductCard
                    item={normalizedItem}
                    variant={variants}
                    imgUrl={imgUrl}
                    onProductClick={onProductClick}
                    onCompareClick={onCompareClick}
                    onVendorClick={onVendorClick}
                    maxStock={variants?.stock || 999}
                    imageLoading={index < 6 ? "eager" : "lazy"}
                    fetchPriority={index < 3 ? "high" : "auto"}
                    disableTooltips={liteMode}
                  />
                </div>
              );
            })}
          </Slider>
        </div>
      </div>
    </section>
  );
};

export default React.memo(MedicineSection);
