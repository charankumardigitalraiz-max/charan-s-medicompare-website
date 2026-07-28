import React from "react";

const ProductDetailField = ({
  icon,
  label,
  value,
  truncate = 0,
  className = "",
  iconClassName = "",
  labelClassName = "",
  valueClassName = "",
}) => {
  if (!value && value !== 0) return null;

  const displayValue =
    truncate > 0 && typeof value === "string" && value.length > truncate
      ? value.slice(0, truncate) + "..."
      : value;

  return (
    <div className={`col-6 mb-1 ${className}`} style={{ padding: "0px", lineHeight:"1.2" }}>
      <p className="mb-0" style={{ fontSize: "10px", color: "black", lineHeight: "1.3" }}>
        {icon && (
          <i className={`${icon} me-1 text-primary ${iconClassName}`} style={{ fontSize: "9px" }} />
        )}
        {label && (
          <span className={labelClassName} style={{ fontSize: "10px", fontWeight: "600", color:"#6B7280" }}>
            {label}:
          </span>
        )}{" "}
        <span className={valueClassName} style={{ fontSize: "10px", color: "black", fontWeight:"600" }}>
          {displayValue}
        </span>
      </p>
    </div>
  );
};

export default ProductDetailField;

