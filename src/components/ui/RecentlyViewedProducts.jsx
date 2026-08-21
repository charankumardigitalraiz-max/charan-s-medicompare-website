import { Link } from "react-router-dom";
import { getImageUrl } from "../../utils/index";
import VendorActions from "./VendorActions.jsx";

/**
 * RecentlyViewedProducts — shared carousel shown on all checkout/booking pages.
 *
 * Props:
 *   products        {Array}    — relevantProducts from parent
 *   onProductClick  {Function} — navigate to product detail
 *   onRentalBooking {Function} — handleRentalBookingProcess
 *   onBooking       {Function} — handleBooking / handleNavigateToBooking
 *   onAddLead       {Function} — handleAddLead (optional)
 */
const RecentlyViewedProducts = ({
  products = [],
  onProductClick,
  onRentalBooking,
  onBooking,
  onAddLead,
}) => {
  if (!products?.length) return null;

  return (
    <div
      className="w-full rounded-xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.07)] mb-3 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/assets/Medicompares Background.png')" }}
    >
      <div className="p-4 md:p-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-4 border-l-4 border-[#321961] pl-3">
          <h2 className="!text-lg sm:!text-xl !font-semibold !text-[#0f172a] m-0 leading-none">
            Recently Viewed Products
          </h2>
          <span className="text-[11px] text-[#321961] font-bold bg-[#f3e8ff] px-2.5 py-1 rounded-full uppercase tracking-wide shrink-0">
            {products.length} items
          </span>
        </div>

        {/*
          @keyframes blocks cannot be expressed as Tailwind utility classes without
          extending tailwind.config.js — kept here as the only non-Tailwind CSS.
        */}
        <style>{`
          @keyframes rvp-pulse {
            0%   { box-shadow: 0 0 0 0 rgba(128,89,202,0.6); }
            70%  { box-shadow: 0 0 0 6px rgba(128,89,202,0); }
            100% { box-shadow: 0 0 0 0 rgba(128,89,202,0); }
          }
          @keyframes rvp-expand {
            0%,10%,40%,100% { width: 32px; }
            15%,35%         { width: 90px; }
          }
          @keyframes rvp-text {
            0%,12%,38%,100% { opacity: 0; }
            15%,35%         { opacity: 1; }
          }
          .rvp-compare        { animation: rvp-pulse 2s infinite, rvp-expand 8s infinite ease-in-out; }
          .rvp-compare-label  { animation: rvp-text 8s infinite ease-in-out; }
          .rvp-compare:hover  { animation: rvp-pulse 2s infinite !important; }
          .rvp-compare:hover .rvp-compare-label { animation: none !important; opacity: 1 !important; }
          #rvpCarousel::-webkit-scrollbar {
            display: none !important;
          }
          #rvpCarousel {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `}</style>

        {/* Carousel */}
        <div className="relative flex items-stretch">

          {/* Left arrow */}
          <button
            className="meq-arrow-btn dental-prev flex self-center"
            style={{ left: "-15px" }}
            onClick={() => {
              document.getElementById("rvpCarousel")?.scrollBy({ left: -250, behavior: "smooth" });
            }}
          >
            <i className="fas fa-chevron-left" />
          </button>

          {/* Cards track */}
          <div
            id="rvpCarousel"
            className="flex items-stretch overflow-x-auto gap-3 px-14 py-3 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {products.map((product, index) => {
              const originalPrice = product?.price || 0;
              const discountPrice = product?.discountprice || null;
              const discountType = product?.discountType || null;

              let calcDiscount = discountPrice;
              let hasDiscount = false;

              if (discountType === "percentage" && discountPrice > 0) {
                calcDiscount = originalPrice - (originalPrice * discountPrice) / 100;
                hasDiscount = true;
              } else if (discountPrice > 0 && discountPrice < originalPrice) {
                calcDiscount = discountPrice;
                hasDiscount = true;
              }

              const displayPrice = hasDiscount ? calcDiscount : originalPrice;
              const discountPct = hasDiscount
                ? discountType === "percentage"
                  ? discountPrice
                  : Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
                : 0;

              const productImage =
                product?.combinedvariant?.files?.[0] ||
                product?.tabletDetails?.files?.[0] ||
                (Array.isArray(product?.tabletDetails?.imageUrl)
                  ? product.tabletDetails.imageUrl[0]
                  : product?.tabletDetails?.imageUrl) ||
                "/assets/default.png";

              const vendorName = product?.vendor?.name || "Vendor";
              const vendorImage = product?.vendor?.bussiness_image?.[0]?.url || "";

              return (
                <div
                  key={`rvp-${product._id || "p"}-${product.vendor?.vendorId || "v"}-${index}`}
                  className="min-w-[210px] max-w-[210px] flex-shrink-0 self-stretch flex flex-col bg-white rounded-md border border-[#f1f5f9] shadow-[0_4px_18px_rgba(0,0,0,0.07)] relative overflow-hidden transition-all duration-300 hover:-translate-y-[3px] hover:border-[#321961] hover:shadow-[0_8px_24px_rgba(128,89,202,0.15)]"
                >
                  {/* Compare badge */}
                  <div className="rvp-compare absolute right-2 top-2 z-10 cursor-pointer bg-[#321961] text-white border-[1.5px] border-[#321961] rounded-[20px] w-8 h-[26px] flex items-center justify-start pl-[9px] shadow-[0_2px_8px_rgba(128,89,202,0.4)] overflow-hidden whitespace-nowrap transition-all duration-300">
                    <Link
                      to={`/${product?.tabletDetails?.subcategoryDetails?.categoryDetails?.slug}/${product?.tabletDetails?.subcategoryDetails?.slug}/${product?.tabletDetails?.slug}/compare`}
                      className="flex items-center text-white no-underline"
                    >
                      <i className="fa-solid fa-right-left shrink-0 text-[11px] text-white" />
                      <span className="rvp-compare-label ml-1.5 text-[11px] font-semibold text-white">
                        Compare
                      </span>
                    </Link>
                  </div>

                  {/* Image */}
                  <div
                    className="w-full h-[130px] bg-[#f8fafc] flex items-center justify-center p-2.5 cursor-pointer shrink-0"
                    onClick={() => onProductClick?.(product)}
                  >
                    <img
                      src={getImageUrl(productImage)}
                      alt="product"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex flex-col gap-1.5 p-2.5 flex-1">

                    {/* Name */}
                    <div
                      className="cursor-pointer"
                      onClick={() => onProductClick?.(product)}
                    >
                      <p className="text-[12.5px] font-medium text-[#0f172a] m-0 leading-[1.35] capitalize overflow-hidden"
                        style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {product?.tabletDetails?.name}
                      </p>
                    </div>

                    {/* Seller & rating */}
                    <div className="flex items-center justify-between gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                        <img
                          src={getImageUrl(vendorImage)}
                          alt={vendorName}
                          className="w-5 h-5 rounded-full object-cover bg-[#f1f5f9] shrink-0"
                          onError={(e) => { e.target.src = "/assets/img/logo.png"; }}
                        />
                        <span
                          className="text-[11.5px] font-semibold text-[#334155] truncate"
                          title={vendorName}
                        >
                          {vendorName}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <span className="text-[11px] text-[#fbbf24]">★</span>
                        <span className="text-[10.5px] font-semibold text-[#475569]">
                          {product.tabletDetails?.averageRating
                            ? product.tabletDetails.averageRating.toFixed(1)
                            : "0.0"}
                        </span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex flex-col gap-px">
                      <div className="flex items-center flex-wrap gap-1">
                        {displayPrice > 0 && (
                          <span className="text-[13.5px] font-bold text-[#0f172a]">
                            ₹{displayPrice.toFixed(2)}
                          </span>
                        )}
                        {hasDiscount && originalPrice > 0 && (
                          <span className="text-[10.5px] line-through text-[#94a3b8]">
                            ₹{Number(originalPrice).toFixed(2)}
                          </span>
                        )}
                      </div>
                      {hasDiscount && discountPct > 0 && (
                        <span className="text-[10px] font-bold text-[#dc2626]">
                          {discountPct}% OFF
                        </span>
                      )}
                      {product?.perDayRent && parseFloat(product.perDayRent) > 0 && (
                        <span className="text-[10px] text-[#64748b]">
                          ₹{Number(product.perDayRent).toFixed(2)}/day
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-auto pt-1.5 border-t border-[#f1f5f9]">
                      <VendorActions
                        bookingType={
                          product?.tabletDetails?.subcategoryDetails?.categoryDetails?.categoryType ||
                          product?.bookingType ||
                          "cart"
                        }
                        med={{ ...product.tabletDetails, productId: product.name }}
                        vendor={{ ...product.vendor, vendorId: product.vendor?.vendorId }}
                        price={parseFloat(product.combinedvariant?.price) || 0}
                        calculatedDiscountPrice={
                          parseFloat(product.combinedvariant?.discountprice || product.discountprice) || null
                        }
                        service={product?.tabletDetails?.subcategoryDetails?.categoryDetails?.fixedType}
                        className="custom-cart-controls w-100"
                        containerStyle={{ display: "flex", width: "100%" }}
                        rentPerDay={product?.perDayRent}
                        selectedVariant={product.combinedvariant}
                        effectiveVariantId={product.combinedvariant?.variantId}
                        isVariant={!!product.combinedvariant}
                        handleRentalBookinProcess={onRentalBooking}
                        handleNavigateToBooking={onBooking}
                        handleAddLead={onAddLead}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right arrow */}
          <button
            className="meq-arrow-btn dental-next flex self-center"
            style={{ right: "-15px" }}
            onClick={() => {
              document.getElementById("rvpCarousel")?.scrollBy({ left: 250, behavior: "smooth" });
            }}
          >
            <i className="fas fa-chevron-right" />
          </button>
        </div>

      </div>
    </div>
  );
};

export default RecentlyViewedProducts;
