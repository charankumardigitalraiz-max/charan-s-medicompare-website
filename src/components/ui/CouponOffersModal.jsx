import React, { useState } from "react";
import BaseModal from "./BaseModal";

/**
 * CouponOffersModal - Reusable presentational modal to view and apply coupons.
 *
 * Props:
 *   show           {boolean}   - Control modal visibility
 *   onClose        {function}  - Close callback
 *   onApplyCoupon  {function}  - Apply callback, receives the coupon object
 *   adminCoupons   {Array}     - List of pre-calculated admin coupons
 *   vendorCoupons  {Array}     - List of pre-calculated vendor coupons
 */
const CouponOffersModal = ({
  show,
  onClose,
  onApplyCoupon,
  adminCoupons = [],
  vendorCoupons = [],
}) => {
  const [copiedCode, setCopiedCode] = useState(null);

  if (!show) return null;

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const getDiscountTier = (coupon) => {
    const amount = parseFloat(coupon.discount) || 0;
    if (coupon.discountType === "fixed") {
      if (amount >= 300) return "mega";
      if (amount >= 150) return "hot";
      if (amount >= 50) return "good";
      return "saver";
    }
    if (amount >= 30) return "mega";
    if (amount >= 20) return "hot";
    if (amount >= 10) return "good";
    return "saver";
  };

  const renderCouponCard = (ele, ind) => {
    const isApplied = !!ele.isApplied;
    const isEligible = ele.isEligible !== false;
    const discountText =
      ele.discountType === "fixed" ? `₹${ele.discount}` : `${ele.discount}%`;

    const tier = getDiscountTier(ele);

    const gradients = {
      saver: "from-emerald-400 to-emerald-500",
      good: "from-blue-400 to-indigo-500",
      hot: "from-orange-400 to-rose-500",
      mega: "from-purple-500 to-[#321961]",
      inactive: "from-slate-300 to-slate-400",
      applied: "from-emerald-500 to-teal-600",
    };

    const activeGradient = !isEligible
      ? gradients.inactive
      : isApplied
        ? gradients.applied
        : gradients[tier] || gradients.saver;

    return (
      <div
        key={ele._id || `${ele.code}-${ind}`}
        className={`!relative !flex !flex-col !rounded-sm !w-full !p-3 !bg-white !transition-all !duration-500 !ease-[cubic-bezier(0.22,1,0.36,1)] ${!isEligible
          ? "!opacity-75 !bg-slate-50/50"
          : isApplied
            ? "!bg-emerald-50/5 hover:!-translate-y-0.5"
            : "hover:!-translate-y-0.5 hover:!shadow-[0_8px_32px_rgba(15,23,42,0.12)]"
          }`}
        style={{
          border: isApplied
            ? "1px solid color-mix(in oklab, var(--color-emerald-300) 80%, transparent)"
            : "1px solid color-mix(in oklab, var(--color-slate-200) 80%, transparent)",
          boxShadow: isApplied
            ? "0 4px 24px rgba(16, 185, 129, 0.12)"
            : "0 4px 24px rgba(15, 23, 42, 0.06)",
          borderRadius: "1rem",
        }}
      >
        {/* Main row: Circle badge + Code/Info + Apply button */}
        <div className="!flex !items-center !justify-between !w-full !gap-3">

          {/* Circular badge displaying discount */}
          <div className={`!w-11 !h-11 !rounded-full !flex !flex-col !items-center !justify-center !shrink-0 !bg-gradient-to-br ${activeGradient} !text-white !shadow-sm`}>
            <span className="!text-[12px] !font-black !leading-none">
              {discountText}
            </span>
            <span className="!text-[7px] !font-bold !tracking-wider !leading-none !mt-0.5">
              OFF
            </span>
          </div>
          {/* Mid: Code, description, limits */}
          <div className="!min-w-0 !flex-1">
            <div className="!flex !items-center !justify-start !gap-2 !flex-wrap !w-full">
              {/* Coupon Name/Description */}
              <p
                className="!text-[13.5px] !font-semibold !text-slate-700 !m-0 !leading-tight !truncate"
                style={{ fontFamily: '"Poppins", sans-serif' }}
                title={ele.description || ele.name}
              >
                {ele.description || ele.name}
              </p>
              {/* Code Badge */}
              <span
                onClick={(e) => handleCopyCode(ele.code, e)}
                className="!text-[11px] !font-semibold !text-[#321961] !bg-purple-50 hover:!bg-purple-100 !border !border-dashed !border-purple-200 !rounded-md !px-2.5 !py-0.5 !cursor-pointer !transition-all !shrink-0"
                style={{ fontFamily: '"Poppins", sans-serif', letterSpacing: "0.05em" }}
                title="Click to copy coupon code"
              >
                {ele.code}
                {copiedCode === ele.code && (
                  <span className="!text-[8.5px] !font-semibold !text-emerald-600 !ml-1" style={{ fontFamily: '"Poppins", sans-serif', letterSpacing: "normal" }}>Copied!</span>
                )}
              </span>



              {/* Savings Badge */}
              {isEligible && ele.savingsPreview > 0 && (
                <span className="!text-[9.5px] !font-bold !text-emerald-700 !bg-emerald-50 !border !border-emerald-100 !px-1.5 !py-0.5 !rounded-full !shrink-0">
                  Saves ₹{ele.savingsPreview.toFixed(0)}
                </span>
              )}
            </div>

            {ele.minimumPurchase > 0 && (
              <span
                className="!text-[11px] !text-slate-400 !font-medium !mt-1 !inline-flex !items-center !gap-1"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                <i className="fa-solid fa-circle-info !text-[9px] !text-slate-300" />
                Valid on orders above <span className="!font-bold !text-slate-500">₹{ele.minimumPurchase}</span>
              </span>
            )}
          </div>

          {/* Right: compact button / lock reason */}
          <div className="!shrink-0">
            {isApplied ? (
              <button
                type="button"
                onClick={() => onApplyCoupon({ ...ele, remove: true })}
                className="!py-1 !px-3 !rounded-md !text-[11px] !font-bold !border !border-red-200 !bg-red-50 !text-red-600 hover:!bg-red-100 !transition-all !duration-200 !cursor-pointer"
              >
                Remove
              </button>
            ) : isEligible ? (
              <button
                type="button"
                onClick={() => onApplyCoupon(ele)}
                className={`!py-1 !px-3 !rounded-md !text-[11px] !font-bold !border-0 !transition-all !duration-200 hover:!scale-105 active:!scale-95 !shadow-[0_2px_4px_rgba(0,0,0,0.08)] !cursor-pointer ${tier === "mega"
                  ? "!bg-[#321961] hover:!bg-[#4c2d8c] !text-white"
                  : tier === "hot"
                    ? "!bg-rose-500 hover:!bg-rose-600 !text-white"
                    : tier === "good"
                      ? "!bg-blue-600 hover:!bg-blue-700 !text-white"
                      : "!bg-emerald-600 hover:!bg-emerald-700 !text-white"
                  }`}
              >
                Apply
              </button>
            ) : (
              <div
                className="!text-[10px] !font-semibold !text-red-650 !bg-red-50/70 !border !border-red-100 !py-1 !px-2.5 !rounded-md !text-center !leading-tight !max-w-[110px] !break-words"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                {ele.criteriaText || "Locked"}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderSection = (coupons) => {
    if (coupons.length === 0) return null;
    return coupons.map((ele, ind) => renderCouponCard(ele, ind));
  };

  const hasCoupons = vendorCoupons.length > 0 || adminCoupons.length > 0;

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title={
        <div className="!flex !items-center !gap-2">
          <i className="fa-solid fa-tags !text-[#321961] !text-lg" />
          <span
            className="!text-[16px] !font-semibold !text-slate-800 !tracking-wide"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          >
            Apply Coupons & Offers
          </span>
        </div>
      }
      size="lg"
      className="!rounded-md !overflow-hidden !bg-slate-50 !border-0 shadow-[0_20px_25px_-5px_rgba(0,0,0,0.1),0_10px_10px_-5px_rgba(0,0,0,0.04)] max-w-[500px] w-full mx-auto"
      headerClassName="!border-b !border-slate-100 !bg-white !py-3.5 !px-5 [&>button]:!bg-slate-50 [&>button]:!rounded-full [&>button]:!w-8 [&>button]:!h-8 [&>button]:!p-0 [&>button]:hover:!bg-slate-100 [&>button]:hover:!text-slate-900"
      bodyClassName="!p-0 !bg-slate-50"
    >
      <div className="offers-modal-body !p-4 !bg-slate-50 !overflow-y-auto !max-h-[60vh] !scrollbar-thin">
        {/* Banner Card */}
        {hasCoupons && (
          <div className="!bg-gradient-to-r !from-[#321961] !to-[#4c2a8f] !p-4 !rounded-sm !text-white !mb-4 !shadow-sm !relative !overflow-hidden">
            <div className="!absolute !-right-6 !-bottom-6 !w-24 !h-24 !bg-white/10 !rounded-full !blur-xl !pointer-events-none" />
            <div className="!absolute !-left-4 !-top-4 !w-16 !h-16 !bg-white/5 !rounded-full !blur-lg !pointer-events-none" />

            <div className="!relative !flex !items-center !gap-3">
              <div className="!w-10 !h-10 !rounded-lg !bg-white/15 !backdrop-blur-md !flex !items-center !justify-center !text-amber-300 !text-lg !shrink-0 !shadow-inner">
                <i className="fa-solid fa-gift !animate-bounce" />
              </div>
              <div>
                <h4 className="!text-sm !font-bold !text-white !m-0 !tracking-wide">Special Offers For You</h4>
                <p className="!text-[10.5px] !text-purple-200/90 !m-0 !mt-0.5">Maximize your savings by choosing the best coupon below.</p>
              </div>
            </div>
          </div>
        )}

        <div className="offers-list !flex !flex-col !gap-3">
          {!hasCoupons ? (
            <div className="!flex !flex-col !items-center !justify-center !py-12 !px-5 !text-center !bg-white !rounded-xl !border !border-slate-100 !shadow-sm">
              <div className="!text-3xl !mb-3">🎟️</div>
              <span className="!text-sm !font-bold !text-slate-700">
                No Coupons Available
              </span>
              <span className="!text-[11px] !text-slate-400 !mt-1 !max-w-[240px]">
                There are no active discount coupons available for your current items.
              </span>
            </div>
          ) : (
            <>
              {vendorCoupons.length > 0 && (
                <div className="!flex !flex-col !gap-3">
                  <div className="!flex !items-center !gap-2 !px-1 !pb-1 !border-b !border-slate-200/50 !mb-0.5">
                    <div className="!w-1 !h-3.5 !bg-emerald-500 !rounded-full" />
                    <span
                      className="!text-[11px] !font-bold !text-slate-700 !uppercase !tracking-wider"
                      style={{ fontFamily: '"Poppins", sans-serif' }}
                    >
                      Vendor Coupons
                    </span>
                  </div>
                  {renderSection(vendorCoupons)}
                </div>
              )}

              {vendorCoupons.length > 0 && adminCoupons.length > 0 && (
                <div className="!h-px !bg-slate-200/60 !my-1" />
              )}

              {adminCoupons.length > 0 && (
                <div className="!flex !flex-col !gap-3">
                  <div className="!flex !items-center !gap-2 !px-1 !pb-1 !border-b !border-slate-200/50 !mb-0.5">
                    <div className="!w-1 !h-3.5 !bg-[#321961] !rounded-full" />
                    <span
                      className="!text-[11px] !font-bold !text-slate-700 !uppercase !tracking-wider"
                      style={{ fontFamily: '"Poppins", sans-serif' }}
                    >
                      Platform Coupons
                    </span>
                  </div>
                  {renderSection(adminCoupons)}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </BaseModal>
  );
};

export default CouponOffersModal;
