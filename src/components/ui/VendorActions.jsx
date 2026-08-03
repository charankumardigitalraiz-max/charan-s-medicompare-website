import React from "react";
import CartQuantityControls from "./CartQuantityControls";

const VendorActions = ({
  bookingType,
  isMobile = false,
  isInStock = true,
  isStockFalse = false,
  isServiceType = false,
  med,
  vendor,
  fullVendor,
  effectiveVariantId,
  price,
  stock,
  service,
  calculatedDiscountPrice,
  isVariant = false,
  effectivePriceForCart = null,
  selectedVariant = null,
  maxStock = 999,
  IsPackage,
  // Handlers
  handleRentalBookinProcess,
  handleNavigateToBooking,
  handleAddLead,
  handleOpenConsultationModal,
  handleOpenAppointmentModal,
  handleOpenRideModal,
  handleAddToCart,
  handleSingleAddToCart,
  // Optional style overrides
  className = "",
  containerStyle = {},
  buttonStyle = {},
  rentAndCartButtonStyles = {},
  rentPerDay
}) => {
  const actualFullVendor = fullVendor || vendor;
  const perDayRent = rentPerDay || actualFullVendor?.perDayRent || null;

  const mergedContainerStyle = {
    display: "flex",
    width: "100%",
    gap: "8px",
    alignItems: "center",
    ...containerStyle,
  };

  const discount = 0; // Not strictly used for actions logic, but keeping variables clean

  if (bookingType === "rentals_addtocarts") {
    return (
      <div
        className={`flex w-full gap-2 items-center ${className}`}
        style={mergedContainerStyle}
      >
        <CartQuantityControls
          rentAndCartButtonStyles={{
            fontSize: "12px",
            padding: "5px 5px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            maxWidth: "100%",
            width: "100%",
            height: "100%",
            ...rentAndCartButtonStyles,
          }}
          contailerStyles={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0px",
            width: "100%",
            gap: "3px",
            flex: 1,
          }}
          individualStyleForCart={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "2px 10px",
            maxWidth: "100%",
            width: "100%",
            gap: "4px",
            borderRadius: "10px",
            border: "1px solid #321961",
            background: "#fdfaff",
            boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)",
          }}
          item={{
            tabletdetails: med,
            vendordetails: vendor?.bussinessdetails || vendor,
            variants: med?.variant || med?.variants,
            vendorId: vendor?.vendorId || vendor?._id || vendor?.vendorId,
            price:
              calculatedDiscountPrice && calculatedDiscountPrice > 0
                ? calculatedDiscountPrice
                : price,
            discountprice: calculatedDiscountPrice,
            perDayRent: perDayRent,
          }}
          variant={med?.variant?.find((v) => v._id === effectiveVariantId) || med?.variants?.find((v) => v._id === effectiveVariantId)}
          options={{
            bookingType: "cart",
            type: "normal",
          }}
          className="pd-cart-controls"
          service={service}
          style={{ flex: 1, width: "100%" }}
        />

        <button
          type="button"
          disabled={perDayRent === 0 || !perDayRent}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleRentalBookinProcess) {
              handleRentalBookinProcess(
                vendor,
                med,
                effectiveVariantId,
                price,
                stock,
                service
              );
            }
          }}
          className={`w-full flex-1 flex items-center justify-center gap-1.5 !py-1 !px-2.5 !rounded-md !text-xs !font-bold !text-white transition-all cursor-pointer border-none ${perDayRent === 0 || !perDayRent
            ? "bg-slate-300 opacity-60 cursor-not-allowed"
            : "bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98]"
            }`}
        >
          <i className="fa-solid fa-clipboard-check"></i>
          Rent
        </button>
      </div>
    );
  }

  // booking & slots - Navigate to BookingProcess
  if (bookingType === "booking" || bookingType === "slots") {
    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (isStockFalse && !isServiceType) return;
            if (handleNavigateToBooking) {
              handleNavigateToBooking(
                vendor,
                med,
                effectiveVariantId,
                price,
                stock,
                bookingType === "slots"
                  ? "/booking-process/slot"
                  : "/booking-process",
                service
              );
            }
          }}
          className="w-full flex-1 flex items-center justify-center gap-1.5 !py-1 px-3 !rounded-lg !text-xs !font-bold !text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          <i
            className={
              bookingType === "slots"
                ? "fa-solid fa-clock"
                : "fas fa-calendar-check"
            }
          ></i>
          {bookingType === "slots" ? "Book Now" : "Book Now"}
        </button>
      </div>
    );
  }

  // leads - Open Lead Modal (do NOT navigate)
  if (bookingType === "lead" || bookingType === "leads") {
    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleAddLead) {
              handleAddLead(vendor, med, effectiveVariantId, {
                price,
                stock,
              });
            }
          }}
          className="w-full flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 !rounded-lg text-xs font-bold !text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          <i className="fas fa-file-invoice-dollar"></i>
          Get An Enquiry
        </button>
      </div>
    );
  }

  // rentals - Open Rental Modal
  if (bookingType === "rentals") {
    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleRentalBookinProcess) {
              handleRentalBookinProcess(
                vendor,
                med,
                effectiveVariantId,
                price,
                stock,
                service
              );
            }
          }}
          className="w-full flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 !rounded-lg text-xs font-bold !text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          <i className="fa-solid fa-clipboard-check"></i>
          Rent
        </button>
      </div>
    );
  }

  if (bookingType === "consultation") {
    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleOpenConsultationModal) {
              handleOpenConsultationModal(
                vendor,
                med,
                effectiveVariantId,
                price,
                service
              );
            }
          }}
          className="w-full flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 !rounded-lg text-xs font-bold !text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          <i className="fa-solid fa-comments"></i>
          Consultation
        </button>
      </div>
    );
  }

  if (bookingType === "appointment") {
    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleOpenAppointmentModal) {
              handleOpenAppointmentModal(
                vendor,
                med,
                effectiveVariantId,
                price,
                service
              );
            }
          }}
          className="w-full flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 !rounded-lg text-xs font-bold !text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          <i className="fa-solid fa-calendar-check"></i>
          Appointment
        </button>
      </div>
    );
  }

  if (bookingType === "ride") {
    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleOpenRideModal) {
              handleOpenRideModal(
                vendor,
                med,
                effectiveVariantId,
                price,
                service
              );
            }
          }}
          className="w-full flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 !rounded-lg text-xs font-bold !text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          <i className="fas fa-car"></i>
          Add Ride
        </button>
      </div>
    );
  }

  if (bookingType === "cart") {
    const variantForCart = isVariant
      ? med?.variant?.find(
        (v) =>
          v._id === effectiveVariantId ||
          v.variantId === effectiveVariantId
      ) || med?.variants?.find(
        (v) =>
          v._id === effectiveVariantId ||
          v.variantId === effectiveVariantId
      ) || selectedVariant
      : null;

    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <CartQuantityControls
          item={{
            tabletdetails: med,
            vendordetails: vendor?.bussinessdetails || vendor,
            variants: med?.variant || med?.variants,
            vendorId: vendor?.vendorId || vendor?._id || vendor?.vendorId,
            price:
              calculatedDiscountPrice && calculatedDiscountPrice > 0
                ? calculatedDiscountPrice
                : price,
            discountprice: calculatedDiscountPrice,
          }}
          service={service}
          variant={variantForCart}
          options={{ bookingType: "cart", type: "normal" }}
          style={{ flex: 1, width: "100%" }}
          contailerStyles={{ width: "100%", flex: 1 }}
          individualStyleForCart={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 10px",
            maxWidth: "100%",
            width: "100%",
            gap: "4px",
            borderRadius: "10px",
            border: "1px solid #321961",
            background: "#fdfaff",
            boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)",
          }}
        />
      </div>
    );
  }

  if (bookingType === "cartslots") {
    const variantForCart = isVariant
      ? med?.variant?.find(
        (v) =>
          v._id === effectiveVariantId ||
          v.variantId === effectiveVariantId
      ) || med?.variants?.find(
        (v) =>
          v._id === effectiveVariantId ||
          v.variantId === effectiveVariantId
      ) || selectedVariant
      : null;

    const packageId = IsPackage ? (med?._id || null) : null;

    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <CartQuantityControls
          item={{
            tabletdetails: med,
            vendordetails: vendor?.bussinessdetails || vendor,
            variants: med?.variant || med?.variants,
            vendorId: vendor?._id || vendor?.vendorId,
            packageId: packageId,
            price:
              calculatedDiscountPrice && calculatedDiscountPrice > 0
                ? calculatedDiscountPrice
                : price,
            discountprice: calculatedDiscountPrice,
          }}
          service={service}
          variant={variantForCart}
          options={{ bookingType: "cartslots", type: IsPackage ? "package" : "normal" }}
          style={{ flex: 1, width: "100%" }}
          contailerStyles={{ width: "100%", flex: 1 }}
          individualStyleForCart={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "5px 10px",
            maxWidth: "100%",
            width: "100%",
            gap: "4px",
            borderRadius: "10px",
            border: "1px solid #321961",
            background: "#fdfaff",
            boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)",
          }}
        />
      </div>
    );
  }

  if (bookingType === "buy_now" || service === "surgeries") {
    return (
      <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (handleNavigateToBooking) {
              handleNavigateToBooking(
                vendor,
                med,
                effectiveVariantId,
                price,
                stock,
                "/booking-process",
                service
              );
            }
          }}
          className="w-full flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 !rounded-lg !text-xs !font-bold !text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
        >
          Book Now
        </button>
      </div>
    );
  }

  // Default: Add to Cart
  return (
    <div className={`flex w-full gap-2 items-center ${className}`} style={mergedContainerStyle}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isVariant || effectiveVariantId) {
            if (handleAddToCart) {
              handleAddToCart(
                vendor,
                med,
                effectiveVariantId,
                {
                  price,
                  stock,
                },
                effectivePriceForCart
              );
            }
          } else {
            if (handleSingleAddToCart) {
              handleSingleAddToCart(vendor, med, effectivePriceForCart);
            }
          }
        }}
        className="w-full flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 !rounded-lg text-xs font-bold text-white bg-[var(--color-primary)] hover:shadow-md active:scale-[0.98] transition-all cursor-pointer border-none"
      >
        Add to Cart
      </button>
    </div>
  );
};

export default VendorActions;
