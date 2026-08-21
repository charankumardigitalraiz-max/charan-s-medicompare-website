import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ className = "", onClick }) => {
  const navigate = useNavigate();

  const handleBack = (e) => {
    if (onClick) {
      onClick(e);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 px-3 py-1.5 !text-sm !font-semibold text-gray-700 bg-white border border-gray-200 !rounded-lg shadow-sm hover:bg-gray-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-primary,#4c2691)] transition-all duration-200 cursor-pointer ${className}`}
    >
      <i className="fa-solid fa-arrow-left text-[14px]"></i>
      <span>Back</span>
    </button>
  );
};

export default BackButton;
