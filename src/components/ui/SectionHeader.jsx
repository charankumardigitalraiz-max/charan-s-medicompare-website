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
    const buttonClasses = `inline-flex items-center justify-center gap-1.5 text-[11px] md:text-[13px] font-bold !rounded-full transition-all duration-300 !no-underline shadow-sm hover:shadow active:scale-[0.98] w-[32px] h-[32px] md:w-auto md:h-auto px-0 md:px-4 py-0 md:py-1.5`;

    const buttonStyle = {
      color: '#ffffff',
      backgroundColor: 'var(--color-primary, #4c2691)',
      border: '1.5px solid var(--color-primary, #4c2691)',
    };

    const handleMouseEnter = (e) => {
      e.currentTarget.style.backgroundColor = 'transparent';
      e.currentTarget.style.color = 'var(--color-primary, #4c2691)';
      e.currentTarget.style.borderColor = 'var(--color-primary, #4c2691)';
    };

    const handleMouseLeave = (e) => {
      e.currentTarget.style.backgroundColor = 'var(--color-primary, #4c2691)';
      e.currentTarget.style.color = '#ffffff';
      e.currentTarget.style.borderColor = 'var(--color-primary, #4c2691)';
    };

    const content = (
      <>
        <span className="hidden md:inline">{viewAllText}</span>
        <i className="fas fa-arrow-right text-[10px]" />
      </>
    );

    if (viewAllLink) {
      return (
        <Link
          to={viewAllLink}
          className={buttonClasses}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {content}
        </Link>
      );
    }

    if (onViewAll) {
      return (
        <button
          onClick={onViewAll}
          className={buttonClasses}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
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
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100/80 shrink-0">
            <i className={`${icon} text-lg`} />
          </div>
        )}
        <h3 className="!text-lg md:!text-xl !font-semibold !text-slate-800 tracking-tight !mb-0">
          {title}
        </h3>
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
