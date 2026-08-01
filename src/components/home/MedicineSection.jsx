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
      className="home-medicine-section bg-[rgba(128,89,202,0.06)] rounded-[24px] shadow-[0_12px_32px_-4px_rgba(128,89,202,0.08)] py-4 pb-5 relative overflow-hidden my-3 mx-[15px] px-2 md:px-3"
    >
      {decorativeElements?.map((element, index) => (
        <div key={index} className={element.className} style={element.style}>
          <i className={element.icon} />
        </div>
      ))}

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 px-1">
          <div
            className="inline-block py-1 px-2.5 rounded-full text-[14px] font-semibold"
            style={{
              backgroundColor: `${iconColor}20`,
              color: iconColor,
            }}
          >
            <i className={`${icon} mr-2`} />
            {title}
          </div>

          <Link
            to={viewAllLink}
            onClick={() => {
              localStorage.setItem("fixedType", "medicine");
            }}
            className={`top-vendor-badge flex items-center justify-center font-semibold transition-all duration-300 ${isMobile ? "p-2 rounded-full w-8 h-8" : "py-1 px-2.5 rounded-full w-auto h-auto text-sm"
              }`}
            style={{
              color: iconColor,
              borderColor: iconColor,
              backgroundColor: `${iconColor}15`,
            }}
          >
            {!isMobile && "View All"}
            <i className={`isax isax-arrow-right-1 ${!isMobile ? "ml-1" : ""}`} />
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
