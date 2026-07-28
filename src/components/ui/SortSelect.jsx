import React, { useState } from "react";

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
  const [showMobileModal, setShowMobileModal] = useState(false);

  const defaultStyle = {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "10px",
    minWidth: "200px",
    fontWeight: "600",
    minHeight: "30px",
    maxHeight: "30px",
    color: "#000",
    ...style,
  };

  const mobileButtonStyle = {
    border: "1px solid #e0e0e0",
    borderRadius: "8px",
    fontSize: "14px",
    fontWeight: "600",
    padding: "8px 16px",
    color: "#000",
    backgroundColor: "#fff",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
  };

  const handleOptionSelect = (optionValue) => {
    setShowMobileModal(false);
    if (typeof onChange === 'function') {
      onChange({ target: { value: optionValue } });
    }
  };


  return (
    <>
      {/* Desktop View */}
      <select
        className={`form-select d-none d-lg-block ${className}`}
        value={value}
        onChange={onChange}
        style={defaultStyle}
      >
        {options.map((option, index) => (
          <option key={option.value || index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Mobile View */}
      <button
        className={`d-none ${className}`}
        onClick={() => setShowMobileModal(true)}
        style={mobileButtonStyle}
      >
        <span>Sort By</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Mobile Modal */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 999999,
          display: showMobileModal ? "block" : "none",
        }}
      >
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
          onClick={() => setShowMobileModal(false)}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: "white",
            borderRadius: "16px 16px 0 0",
            maxHeight: "70vh",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              padding: "20px 24px 16px",
              borderBottom: "1px solid #e9ecef",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <h5 style={{ fontWeight: "600", fontSize: "18px", margin: 0 }}>
              Sort By
            </h5>
            <button
              type="button"
              onClick={() => setShowMobileModal(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "24px",
                cursor: "pointer",
                color: "#666",
              }}
            >
              ×
            </button>
          </div>
          <div style={{ padding: "8px 0" }}>
            {options.map((option, index) => (
              <button
                key={option.value || index}
                onClick={() => handleOptionSelect(option.value)}
                style={{
                  width: "100%",
                  padding: "16px 24px",
                  border: "none",
                  backgroundColor: "transparent",
                  textAlign: "left",
                  fontSize: "16px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: index < options.length - 1 ? "1px solid #f0f0f0" : "none",
                  color: value === option.value ? "#007bff" : "#000",
                  fontWeight: value === option.value ? "600" : "400",
                }}
              >
                <span>{option.label}</span>
                {value === option.value && (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default SortSelect;

