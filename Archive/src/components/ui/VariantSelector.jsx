import React from "react";

const VariantSelector = ({
  variants = [],
  selectedVariantId,
  onChange,
  label = "Select Variant:",
  className = "",
  selectClassName = "",
  showLabel = true,
}) => {
  if (!variants || variants.length <= 1) return null;

  return (
    <div className={`pd-variant-selector ${className}`}>
      {showLabel && <div className="pd-variant-label">{label}</div>}
      <select
        className={`pd-variant-select ${selectClassName}`}
        value={selectedVariantId || ""}
        onChange={(e) => onChange(e.target.value)}
      >
        {variants.map((variant) => (
          <option key={variant._id || variant.id} value={variant._id || variant.id}>
            {variant.name || variant.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default VariantSelector;

