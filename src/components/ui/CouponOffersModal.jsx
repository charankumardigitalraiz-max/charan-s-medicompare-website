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

  const couponThemes = {
    saver: {
      label: "Saver",
      accent: "!text-emerald-600",
      accentBg: "!from-emerald-50 !to-emerald-100",
      badgeText: "!text-emerald-700",
      btnBg: "!bg-emerald-600 hover:!bg-emerald-700 !text-white",
      border: "!border-emerald-200",
      cutoutBorder: "!border-emerald-200",
    },
    good: {
      label: "Good Deal",
      accent: "!text-blue-600",
      accentBg: "!from-blue-50 !to-blue-100",
      badgeText: "!text-blue-700",
      btnBg: "!bg-blue-600 hover:!bg-blue-700 !text-white",
      border: "!border-blue-200",
      cutoutBorder: "!border-blue-200",
    },
    hot: {
      label: "Hot Deal",
      accent: "!text-amber-600",
      accentBg: "!from-amber-50 !to-amber-100",
      badgeText: "!text-amber-700",
      btnBg: "!bg-amber-600 hover:!bg-amber-700 !text-white",
      border: "!border-amber-200",
      cutoutBorder: "!border-amber-200",
    },
    mega: {
      label: "Mega Save",
      accent: "!text-[#321961]",
      accentBg: "!from-purple-50 !to-purple-100",
      badgeText: "!text-[#321961]",
      btnBg: "!bg-[#321961] hover:!bg-[#6c48b0] !text-white",
      border: "!border-purple-200",
      cutoutBorder: "!border-purple-200",
    },
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
    const theme = couponThemes[tier] || couponThemes.saver;

    const inactiveTheme = {
      accent: "!text-slate-400",
      accentBg: "!from-slate-100 !to-slate-100",
      badgeText: "!text-slate-500",
      btnBg: "!bg-slate-200 !text-slate-400 !cursor-not-allowed",
      border: "!border-slate-200",
      cutoutBorder: "!border-slate-300",
      label: "Locked",
    };

    const appliedTheme = {
      accent: "!text-emerald-600",
      accentBg: "!from-emerald-100 !to-emerald-100",
      badgeText: "!text-emerald-700",
      btnBg: "!bg-emerald-100 !text-emerald-800 !border !border-emerald-300 hover:!bg-emerald-250",
      border: "!border-emerald-300",
      cutoutBorder: "!border-emerald-300",
      label: "Applied",
    };

    const activeTheme = !isEligible
      ? inactiveTheme
      : isApplied
        ? appliedTheme
        : theme;

    return (
      <div
        key={ele._id || `${ele.code}-${ind}`}
        className={`!relative !flex !items-stretch !w-full !rounded-[8px] !overflow-visible !transition-all !duration-200 !bg-white !border ${activeTheme.border} !shadow-[0_2px_4px_rgba(0,0,0,0.02)] ${!isEligible
            ? "!opacity-70 !bg-slate-50"
            : isApplied
              ? "!bg-[#fcfdfd] hover:!shadow-[0_5px_12px_rgba(128,89,202,0.08)] hover:!-translate-y-[1.5px]"
              : "hover:!shadow-[0_5px_12px_rgba(128,89,202,0.08)] hover:!-translate-y-[1.5px] hover:!border-slate-350"
          }`}
      >
        {/* Left Column: Promo Details */}
        <div className={`!min-w-[110px] !max-w-[110px] !py-3 !px-1 !flex !flex-col !items-center !justify-center !text-center !border-r !border-dashed !rounded-l-[7px] !shrink-0 bg-gradient-to-br ${activeTheme.accentBg} ${!isEligible ? "!border-r-slate-200" : isApplied ? "!border-r-emerald-300" : "!border-r-slate-200"}`}>
          <span className={`!text-[22px] !font-extrabold !tracking-tight !leading-none !mb-0.5 ${activeTheme.badgeText}`}>
            {discountText}
          </span>
          <span className={`!text-[10px] !font-bold !tracking-wider !leading-none !mb-1 ${activeTheme.badgeText}`}>
            OFF
          </span>
          <span className={`!text-[9.5px] !font-bold !bg-white !border !border-slate-100 !shadow-[0_1px_2px_rgba(0,0,0,0.02)] !py-0.5 !px-1.5 !rounded-full !white-space-nowrap ${activeTheme.accent}`}>
            {activeTheme.label}
          </span>
        </div>

        {/* Punch Hole Cutouts */}
        <div className="absolute top-0 bottom-0 left-[110px] -translate-x-1/2 flex flex-col justify-between pointer-events-none z-10 w-3 h-full">
          <div className={`w-3 h-2 bg-white !border-b !border-x ${activeTheme.cutoutBorder} rounded-b-full -mt-px`} />
          <div className={`w-3 h-2 bg-white !border-t !border-x ${activeTheme.cutoutBorder} rounded-t-full -mb-px`} />
        </div>

        {/* Right Column: Descriptions & Action */}
        <div className="!flex-1 !py-3 !px-3.5 !flex !flex-col !justify-between !min-w-0">

          {/* Header Row: Title & Button */}
          <div className="!flex !items-start !justify-between !gap-2">
            <div className="!min-w-0 !flex-1">
              <div className="!flex !items-center !gap-1 !mb-0.5">
                <h4 className="!text-[14.5px] !font-semibold !text-slate-800 !m-0 !leading-snug !truncate" title={ele.name}>
                  {ele.name}
                </h4>
                {isApplied && (
                  <span className="!flex !items-center !justify-center !w-3.5 !h-3.5 !rounded-full !bg-emerald-500 !text-white !text-[8.5px] !shrink-0">
                    <i className="fa-solid fa-check" />
                  </span>
                )}
              </div>
              {ele.description && (
                <p className="!text-[12px] !text-slate-500 !m-0 !mt-1 !leading-normal !line-clamp-1">
                  {ele.description}
                </p>
              )}
            </div>

            <div className="!shrink-0">
              <button
                type="button"
                disabled={!isEligible}
                onClick={() => onApplyCoupon(ele)}
                className={`!py-1.5 !px-3.5 !rounded-[6px] !text-[12px] !font-bold !border-0 !shadow-[0_1px_2px_rgba(0,0,0,0.05)] !transition-all !duration-200 active:!scale-95 ${activeTheme.btnBg} ${!isEligible ? "!cursor-not-allowed !opacity-50" : "!cursor-pointer"}`}
              >
                {isApplied ? "Applied" : "Apply"}
              </button>
            </div>
          </div>

          {/* Footer Row: Code, Min Order & Inline Savings */}
          <div className="!mt-1.5 !pt-1 !border-t !border-slate-100">
            <div className="!flex !items-center !justify-between !gap-2 !flex-wrap">
              <div className="!flex !items-center !gap-1.5">
                <div
                  onClick={(e) => handleCopyCode(ele.code, e)}
                  className={`!flex !items-center !gap-1 !text-[11px] !font-bold !font-mono !bg-slate-50 !border !border-dashed !border-slate-350 !rounded-[4px] !py-0.5 !px-1.5 !cursor-pointer hover:!bg-slate-100 !transition-all ${activeTheme.accent}`}
                  title="Click to copy coupon code"
                >
                  <span>{ele.code}</span>
                  {copiedCode === ele.code ? (
                    <span className="!text-[8.5px] !font-sans !text-emerald-600 !font-semibold">Copied!</span>
                  ) : (
                    <i className="fa-regular fa-copy !text-slate-400 group-hover:!text-slate-650 !text-[8px] !transition-colors" />
                  )}
                </div>

                {ele.minimumPurchase > 0 && (
                  <span className="!text-[11px] !text-slate-450">
                    Min: <span className="!font-semibold !text-slate-600">₹{ele.minimumPurchase}</span>
                  </span>
                )}
              </div>

              {isEligible && ele.savingsPreview > 0 && (
                <span className="!text-[11px] !font-bold !text-emerald-700 !bg-emerald-50 !border !border-emerald-200 !py-0.5 !px-1.5 !rounded-[4px]">
                  Saves ₹{ele.savingsPreview.toFixed(0)}
                </span>
              )}
            </div>

            {!isEligible && ele.criteriaText && (
              <div className="!text-[11px] !font-semibold !text-red-700 !bg-red-50 !border !border-red-100 !py-0.5 !px-1.5 !rounded-[4px] !mt-1 !flex !items-center !gap-1">
                <span>⚠️ {ele.criteriaText}</span>
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
      title="Available Coupons"
      size="lg"
      className="!rounded-[12px] !overflow-hidden !bg-white !border-0 !shadow-[0_15px_20px_-5px_rgba(0,0,0,0.1),0_8px_8px_-5px_rgba(0,0,0,0.04)] max-w-[500px] mx-auto"
      headerClassName="!border-b !border-slate-100 !bg-white !py-2.5 !px-3.5 [&>button]:!bg-slate-50 [&>button]:!rounded-full [&>button]:!w-7 [&>button]:!h-7 [&>button]:!p-0 [&>button]:hover:!bg-slate-100 [&>button]:hover:!text-slate-900"
      bodyClassName="!p-0 !bg-white"
    >
      <div className="offers-modal-body p-3.5 bg-white overflow-y-auto max-h-[60vh]">
        <div className="offers-list flex flex-col gap-2.5">
          {!hasCoupons ? (
            <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
              <div className="text-2xl mb-2">🎟️</div>
              <span className="text-xs font-bold text-slate-700">
                No Coupons Available
              </span>
              <span className="text-[10px] text-slate-400 mt-1 max-w-xs">
                There are no active discount coupons available for your current items.
              </span>
            </div>
          ) : (
            <>
              {vendorCoupons.length > 0 && (
                <div className="flex flex-col gap-2">
                  {renderSection(vendorCoupons)}
                </div>
              )}

              {vendorCoupons.length > 0 && adminCoupons.length > 0 && (
                <div className="h-px bg-slate-100 my-1" />
              )}

              {adminCoupons.length > 0 && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-1.5 px-1 border-b border-slate-100 pb-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Platform Coupons</span>
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
