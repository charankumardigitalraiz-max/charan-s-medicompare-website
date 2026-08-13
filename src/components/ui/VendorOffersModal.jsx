import React, { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { axiosCommonInstance } from "../../Apiservice";
import { getImageUrl } from "../../utils/index";
import { useLocation as useLocationContext } from "../../context/LocationContext";
import VendorActions from "./VendorActions";

const VendorOffersModal = ({ show, onClose, product }) => {
  const { selectedPincode, latitude, longitude } = useLocationContext();
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && product) {
      const fetchOffers = async () => {
        try {
          setLoading(true);
          const productId = product?._id || product?.tablet?._id;
          const url = `all/search/product/details`;

          const response = await axiosCommonInstance.post(url, {
            productId,
            pincode: selectedPincode,
            lat: latitude,
            lng: longitude,
            page: 1,
            limit: 10,
            type: product?.type
          });

          const matchedItem = response?.data?.data || {};
          const vendorsList = matchedItem.productlist || matchedItem.list?.[0]?.vendors || [];

          setVendors(vendorsList);
        } catch (err) {
          console.error("Error fetching vendor offers:", err);
          setVendors([]);
        } finally {
          setLoading(false);
        }
      };
      fetchOffers();
    } else {
      setVendors([]);
    }
  }, [show, product, selectedPincode, latitude, longitude]);

  return (
    <BaseModal
      title={"Choose Product Vendor"}
      show={show}
      onClose={onClose}
      showCloseButton={true}
      size="xl"
      isBottomSheetOnMobile={true}
    >
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-400">
          <i className="fas fa-circle-notch fa-spin text-2xl text-[var(--color-primary)]"></i>
          <span className="text-xs font-medium text-slate-500">Fetching live vendor offers...</span>
        </div>
      ) : vendors.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <i className="fas fa-store-slash text-3xl text-slate-300 mb-2 block"></i>
          No offers available for this product at your location.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 py-1">
          {vendors.map((vendor, index) => {
            const logo = getImageUrl(vendor?.businessDetails?.business_image || vendor?.bussinessdetails?.logo);
            const shopName = vendor?.businessDetails?.name || "Store";
            const basePrice = parseFloat(vendor?.price || 0);
            const sellingPrice = parseFloat(vendor?.discountprice || vendor?.discountPrice || basePrice);
            const discountType = vendor?.discountType;
            const tablet = product?.tablet || product;
            const selectedVar = tablet?.variant?.[0] || tablet?.variants?.[0];
            const category = tablet?.category;

            // Ratings & Distance
            const rating = vendor?.businessDetails?.averageRating || vendor?.averageRating || 0;
            const distance = vendor?.businessDetails?.distance !== undefined ? parseFloat(vendor?.businessDetails?.distance).toFixed(1) : null;

            let discountText = "";
            if (discountType === "percentage" && vendor?.discountprice) {
              discountText = `${vendor.discountprice}% OFF`;
            } else if (sellingPrice < basePrice) {
              const pct = Math.round(((basePrice - sellingPrice) / basePrice) * 100);
              if (pct > 0) discountText = `${pct}% OFF`;
            }

            return (
              <div
                key={index}
                className="flex flex-col items-center text-center p-3 bg-white border border-[#f1f5f9] rounded-sm shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_28px_rgba(0,0,0,0.12)] hover:border-slate-250 transition-all duration-300 h-full justify-between gap-2.5"
              >
                {/* Header: Store Circle Avatar with Ratings & Distance */}
                <div className="flex items-center gap-2.5 w-full text-left">
                  <div className="w-10 h-10 rounded-full border border-slate-100 overflow-hidden flex items-center justify-center bg-white p-0.5 shrink-0">
                    {logo ? (
                      <img
                        src={logo}
                        alt={shopName}
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          e.target.src = "/assets/default.png";
                        }}
                      />
                    ) : (
                      <i className="fas fa-store text-slate-400 text-sm" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h4 className="!text-[12px] font-bold text-slate-800 line-clamp-1 m-0">
                      {shopName}
                    </h4>
                    <div className="flex items-center gap-1.5 text-[9.5px] text-slate-400 mt-0.5">
                      {rating > 0 && (
                        <span className="text-amber-500 font-bold flex items-center gap-0.5">
                          <i className="fas fa-star" /> {rating.toFixed(1)}
                        </span>
                      )}
                      {rating > 0 && distance && <span>•</span>}
                      {distance && <span>{distance} km</span>}
                    </div>
                  </div>
                </div>

                {/* Price Details */}
                <div className="w-full bg-[#fbfbfe] rounded-lg py-1.5 px-2.5 flex items-center justify-between text-left">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-slate-400 leading-none mb-0.5">Selling Price</span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[14px] font-extrabold text-slate-850">
                        ₹{sellingPrice}
                      </span>
                      {sellingPrice < basePrice && (
                        <span className="line-through text-slate-400 text-[10px]">
                          ₹{basePrice}
                        </span>
                      )}
                    </div>
                  </div>
                  {sellingPrice < basePrice && discountText && (
                    <span className="bg-red-50 text-red-500 text-[8.5px] font-bold px-1 rounded shrink-0">
                      {discountText}
                    </span>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="w-full mt-auto">
                  <VendorActions
                    bookingType={category?.categoryType}
                    med={tablet}
                    vendor={vendor}
                    price={basePrice}
                    calculatedDiscountPrice={sellingPrice}
                    effectiveVariantId={selectedVar?._id}
                    isVariant={!!selectedVar}
                    rentAndCartButtonStyles={{
                      fontSize: "11px",
                      padding: "4px 8px"
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </BaseModal>
  );
};

export default VendorOffersModal;
