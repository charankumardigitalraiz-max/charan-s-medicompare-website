import React from "react";
import { Link } from "react-router-dom";
import { useResponsive } from "../../hooks";

const SectionHeader = ({
  title,
  subtitle,
  icon,
  viewAllLink,
  onViewAll,
  viewAllText = "View All",
  className = "",
}) => {
  const { isMobile } = useResponsive();
  const renderViewAllButton = () => {
    const buttonClasses = `inline-flex items-center justify-center !font-bold !text-[14px] !text-[#321961] hover:!bg-[#321961] hover:!text-white transition-all duration-300 ${
      isMobile
        ? "!p-0 !rounded-full !w-[36px] !h-[36px] !shrink-0 !grow-0 !self-center !bg-[#321961]/10"
        : "py-[8px] px-[20px] rounded-[50px] w-auto h-auto bg-gradient-to-br from-[rgba(125,46,255,0.1)] to-[rgba(59,130,246,0.1)]"
    }`;

    const content = (
      <>
        {!isMobile && viewAllText}
        <i className={`isax isax-arrow-right-1 ${!isMobile ? "ml-1" : ""}`} />
      </>
    );

    if (viewAllLink) {
      return (
        <Link to={viewAllLink} className={buttonClasses}>
          {content}
        </Link>
      );
    }

    if (onViewAll) {
      return (
        <button onClick={onViewAll} className={buttonClasses}>
          {content}
        </button>
      );
    }

    return null;
  };

  return (
    <div
      className={`flex items-center justify-between result-wrap gap-3 my-2 ${className}`}
    >
      <div
        className="inline-block py-[4px] px-[10px] bg-gradient-to-br from-[#321961]/10 to-[#321961]/20 rounded-[50px] text-[14px] font-semibold text-[#321961] mb-0"
      >
        {icon && <i className={`${icon} mr-[6px]`}></i>}
        {title}
      </div>

      {(viewAllLink || onViewAll) && (
        <div className="flex shrink-0 items-center">
          {renderViewAllButton()}
        </div>
      )}
    </div>
  );
};

export default SectionHeader;
