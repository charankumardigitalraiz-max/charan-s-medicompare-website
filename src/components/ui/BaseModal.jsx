import React from "react";

const BaseModal = ({
  show,
  onClose,
  title,
  children,
  size = "md",
  centered = true,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  footer,
  closeButton = true,
  backdrop = true,
  zIndex = 99999999,
  disableBackdropBlur = false, // new prop
  isBottomSheetOnMobile = false, // new prop
}) => {
  if (!show) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-2xl",
  };

  return (
    <div
      className={`fixed inset-0 flex p-4 ${isBottomSheetOnMobile
          ? "sm:items-center sm:justify-center items-end justify-center !p-0 sm:!p-4"
          : "items-center justify-center"
        }`}

      style={{
        zIndex,
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      onClick={backdrop ? onClose : undefined}
    >
      <div
        className={`bg-white shadow-xl w-full ${sizeClasses[size]} transition-all flex flex-col ${isBottomSheetOnMobile
            ? "rounded-t-2xl sm:rounded-lg rounded-b-none sm:rounded-b-lg"
            : "rounded-lg"
          } ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          maxHeight: isBottomSheetOnMobile ? "90vh" : "80vh",
        }}
      >
        {/* Header */}
        {(title || closeButton) && (
          <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${headerClassName}`}>
            {title && (
              <h3 className="m-0 !text-base !font-semibold !leading-6 tracking-tight text-slate-900 break-words sm:!text-lg md:!text-xl">
                {title}
              </h3>
            )}
            {closeButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer border-none bg-transparent flex items-center justify-center"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div className={`overflow-y-auto px-6 py-4 flex-1 ${bodyClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default BaseModal;
