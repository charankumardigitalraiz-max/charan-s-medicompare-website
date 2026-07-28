import React from "react";

const ProductDetailItem = ({
  icon,
  label,
  value,
  className = "",
  iconClassName = "",
  labelClassName = "",
  valueClassName = "",
}) => {
  if (!value && value !== 0) return null;

  return (
    <div className={`pd-detail-item ${className}`}>
      <div className={`pd-detail-icon ${iconClassName}`}>
        <i className={icon}></i>
      </div>
      <div className="pd-detail-content">
        <div className={`pd-detail-label ${labelClassName}`}>{label}</div>
        <div className={`pd-detail-value ${valueClassName}`}>{value}</div>
      </div>
    </div>
  );
};

export default ProductDetailItem;

