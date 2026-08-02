import React from "react";

const PriceDisplay = ({
  price,
  originalPrice,
  showDiscount = true,
  size = "md",
  className = "",
  currency = " ₹",
  currencyText = "MRP ",
}) => {
  if (!price && price !== 0) return null;

  const discount = originalPrice && showDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const sizeStyles = {
    sm: { fontSize: "14px", },
    md: { fontSize: "16px", },
    lg: { fontSize: "18px" },
  };

  return (
    <div className={`d-flex align-items-center ${className}`} style={{ fontFamily: "Poppins" }}>
      <h5
        className="mb-0"
        style={{ color: "#000", fontFamily: "Poppins" }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "4px", fontFamily: "Poppins" }}>
          <span style={{ fontSize: "13px", fontWeight: '600', color: "#000", fontFamily: "Poppins" }}>
            {currencyText}
          </span>
          <strong style={{ ...sizeStyles[size], color: "#000", fontSize: "13px", fontWeight: "600", fontFamily: "Poppins" }} >
            {currency}{typeof price === "number" ? price.toFixed(2) : price}
          </strong>
        </span>
      </h5>
      {/* {originalPrice && originalPrice > price && (
        <>
          <small className="ms-2 text-decoration-line-through" style={{ fontSize: "11px", color: "#666" }}>
            {currency}
            {typeof originalPrice === "number" ? originalPrice.toFixed(2) : originalPrice}
          </small>
          {discount > 0 && (
            <span className="ms-2 badge bg-success" style={{ fontSize: "10px" }}>
              {discount}% OFF
            </span>
          )}
        </>
      )} */}
    </div>
  );
};

export default PriceDisplay;

