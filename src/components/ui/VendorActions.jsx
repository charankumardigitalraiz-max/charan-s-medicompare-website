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
  // console.log("price", price)
  const mergedContainerStyle = {
    display: "flex",
    width: "100%",
    gap: "8px",
    alignItems: "center",
    ...containerStyle,
  };

  const mergedButtonStyle = {
    width: "100%",
    flex: 1,
    ...buttonStyle,
  };

  // console.log('perDayRent', perDayRent)

  // console.log(service);
  // console.log(med);
  if (bookingType === "rentals_addtocarts") {
    return (
      <div
        className={`pd-vendor-actions ${className}`}
        style={mergedContainerStyle}
      >
        {/* {isInStock ? ( */}
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
            border: "1px solid #8059ca",
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
        {/* ) : (
          <button
            type="button"
            className="pd-btn pd-btn-disabled"
            disabled
            style={mergedButtonStyle}
          >
            <i className="fas fa-ban"></i>Unavailable
          </button>
        )} */}



        <button
          type="button"
          className="pd-btn text-white"
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
          style={{
            background: (perDayRent === 0 || !perDayRent)
              ? "#d3d3d3"
              : "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
            border: "none",
            fontWeight: "600",
            opacity: (perDayRent === 0 || !perDayRent) ? 0.65 : 1,
            cursor: (perDayRent === 0 || !perDayRent) ? "not-allowed" : "pointer",
            fontSize: "12px",
            padding: "5px 5px",
            borderRadius: "5px",
            height: "100%",
            ...mergedButtonStyle,
          }}
        >
          <i className="fa-solid fa-clipboard-check me-2"></i>
          Rent
        </button>
      </div>
    );
  }

  // booking & slots - Navigate to BookingProcess
  if (bookingType === "booking" || bookingType === "slots") {
    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          className="pd-btn pd-btn-book"
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
          // disabled={!isInStock && !isServiceType}
          style={mergedButtonStyle}
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

  // console.log("bookingType", bookingType)

  // leads - Open Lead Modal (do NOT navigate)
  if (bookingType === "lead" || bookingType === "leads") {
    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          className="pd-btn pd-btn-lead"
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
          // disabled={!isInStock}
          style={mergedButtonStyle}
        >
          <i className="fas fa-file-invoice-dollar me-1"></i>
          Get An Enquiry
        </button>
      </div>
    );
  }

  // rentals - Open Rental Modal
  if (bookingType === "rentals") {
    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          className="pd-btn pd-btn-ride"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // if (isStockFalse && !isServiceType) return;
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
          // disabled={(!isInStock && !isServiceType) || !perDayRent}
          style={{
            opacity: 1,
            cursor: "pointer",
            ...mergedButtonStyle,
          }}
        >
          <i className="fa-solid fa-clipboard-check"></i>
          Rent
        </button>
      </div>
    );
  }

  if (bookingType === "consultation") {
    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          className="pd-btn pd-btn-consultation text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // if (isStockFalse && !isServiceType) return;
            if (handleOpenConsultationModal) {
              handleOpenConsultationModal(
                vendor,
                med,
                effectiveVariantId,
                price,
                // stock,
                service
              );
            }
          }}
          // disabled={!isInStock}
          style={mergedButtonStyle}
        >
          <i className="fa-solid fa-comments text-white"></i>
          Consultation
        </button>
      </div>
    );
  }

  if (bookingType === "appointment") {
    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          className="pd-btn pd-btn-appointment text-white"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // if (isStockFalse && !isServiceType) return;
            if (handleOpenAppointmentModal) {
              handleOpenAppointmentModal(
                vendor,
                med,
                effectiveVariantId,
                price,
                // stock,
                service
              );
            }
          }}
          // disabled={!isInStock}
          style={mergedButtonStyle}
        >
          <i className="fa-solid fa-calendar-check text-white"></i>
          Appointment
        </button>
      </div>
    );
  }

  if (bookingType === "ride") {
    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          className="pd-btn pd-btn-ride"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // if (isStockFalse && !isServiceType) return;
            if (handleOpenRideModal) {
              handleOpenRideModal(
                vendor,
                med,
                effectiveVariantId,
                price,
                // stock,
                service
              );
            }
          }}
          // disabled={!isInStock}
          style={mergedButtonStyle}
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

    const canUseCart = !isStockFalse && isInStock;

    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        {/* {canUseCart ? ( */}
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
          // maxStock={maxStock}
          options={{ bookingType: "cart", type: "normal" }}
          style={mergedButtonStyle}
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
            border: "1px solid #8059ca",
            background: "#fdfaff",
            boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)",
          }}
        />
        {/* ) : (
          <button
            type="button"
            className="pd-btn pd-btn-secondary"
            disabled
            style={buttonStyle}
          >
            <i className="fas fa-ban"></i> Unavailable
          </button>
        )} */}
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


    const canUseCart = !isStockFalse && isInStock;

    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        {/* {canUseCart ? ( */}
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
          // maxStock={maxStock}
          options={{ bookingType: "cartslots", type: IsPackage ? "package" : "normal" }}
          style={mergedButtonStyle}
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
            border: "1px solid #8059ca",
            background: "#fdfaff",
            boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)",
          }}
        />
        {/* ) : (
          <button
            type="button"
            className="pd-btn pd-btn-secondary"
            disabled
            style={buttonStyle}
          >
            <i className="fas fa-ban"></i> Unavailable
          </button>
        )} */}
      </div>
    );
  }

  if (bookingType === "buy_now" || service === "surgeries") {
    return (
      <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
        <button
          type="button"
          className="pd-btn pd-btn-book"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // if (isStockFalse && !isServiceType) return;
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
          // disabled={!isInStock}
          style={mergedButtonStyle}
        >
          Book Now
        </button>
      </div>
    );
  }

  // Default: Add to Cart
  return (
    <div className={`pd-vendor-actions ${className}`} style={mergedContainerStyle}>
      <button
        type="button"
        className="pd-btn pd-btn-cart"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          // if (isStockFalse && !isServiceType) return;
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
        // disabled={!isInStock}
        style={mergedButtonStyle}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default VendorActions;
