import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaExchangeAlt } from "react-icons/fa";

const getSlugs = (data) => {
  let sub =
    data?.subcatdetails ||
    data?.subcategorydetails ||
    data?.subcategoryDetails ||
    data?.subcategorys;
  if (Array.isArray(sub)) {
    sub = sub[0];
  }

  const cat = sub?.catdetails || sub?.categoryDetails || sub?.category;

  return {
    category: cat?.slug,
    subcategory: sub?.slug,
    slug: data?.slug,
  };
};

const CompareOverlayButton = ({ tablet, serviceType = "medicine", onClick }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleCompareClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
      return;
    }

    const { category, subcategory, slug } = getSlugs(tablet);
    if (slug) {
      const searchParams = location.search || "";
      navigate(`/${category || serviceType}/${subcategory || "tablets"}/${slug}/compare${searchParams}`);
    }
  };

  return (
    <>
      <style>{`
        @keyframes comparePulse {
          0% {
            box-shadow: 0 0 0 0 rgba(128, 89, 202, 0.6);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(128, 89, 202, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(128, 89, 202, 0);
          }
        }
        @keyframes compareAutoExpand {
          0%, 10%, 40%, 100% {
            width: 32px;
          }
          15%, 35% {
            width: 90px;
          }
        }
        @keyframes textFadeInOut {
          0%, 12%, 38%, 100% {
            opacity: 0;
          }
          15%, 35% {
            opacity: 1;
          }
        }
        .compare-btn-highlight {
          animation: comparePulse 2s infinite, compareAutoExpand 8s infinite ease-in-out;
          border-radius: 20px !important;
        }
        .compare-text-label {
          animation: textFadeInOut 8s infinite ease-in-out;
        }
        .compare-btn-highlight:hover {
          animation: comparePulse 2s infinite !important;
        }
        .compare-btn-highlight:hover .compare-text-label {
          animation: none !important;
          opacity: 1 !important;
        }
      `}</style>
      <button
        data-tooltip-id="global-tooltip"
        className="compare-btn-highlight absolute top-[10px] right-[10px] bg-primary !text-white border-[1.5px] border-primary !rounded-[20px] w-8 h-[26px] flex items-center justify-start pl-[9px] cursor-pointer z-10 shadow-[0_2px_8px_rgba(128,89,202,0.4)] transition-all duration-300 overflow-hidden whitespace-nowrap hover:w-[90px] hover:bg-profile-secondary hover:border-profile-secondary focus:outline-none"
        onClick={handleCompareClick}
      >
        <FaExchangeAlt className="text-[11px] !text-white shrink-0" />
        <span className="compare-text-label ml-1.5 text-[11px] font-[600] !text-white transition-opacity duration-200">
          Compare
        </span>
      </button>
    </>
  );
};

export default CompareOverlayButton;
