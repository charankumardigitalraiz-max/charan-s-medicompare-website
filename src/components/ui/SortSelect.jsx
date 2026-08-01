import React from "react";

const SortSelect = ({
  value = "",
  onChange,
  options = [
    { value: "", label: "Sort By" },
    { value: "price_low", label: "Price: Low to High" },
    { value: "price_high", label: "Price: High to Low" },
    { value: "popularity", label: "Popularity" },
    { value: "newest", label: "Newest First" },
  ],
  className = "",
  style = {},
}) => {
  return (
    <select
      className={`form-select !appearance-none !bg-no-repeat !bg-right ${className}`}
      value={value}
      onChange={onChange}
      style={{
        border: "1px solid #e2e8f0",
        borderRadius: "8px",
        fontSize: "13px",
        minWidth: "160px",
        fontWeight: "500",
        minHeight: "38px",
        maxHeight: "38px",
        color: "#1e293b",
        backgroundColor: "#fff",
        paddingLeft: "12px",
        paddingRight: "28px",
        appearance: "none",
        WebkitAppearance: "none",
        MozAppearance: "none",
        backgroundPosition: "right 8px center",
        cursor: "pointer",
        ...style,
      }}
    >
      {options.map((option, index) => (
        <option key={option.value || index} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

export default SortSelect;
