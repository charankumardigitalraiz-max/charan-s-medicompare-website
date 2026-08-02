import React from "react";
import { createPortal } from "react-dom";

/**
 * Tailwind-based Modal — drop-in replacement for react-bootstrap Modal.
 * Props: show, onHide, centered, size ("sm"|"md"|"lg"|"xl"), className, children
 */
const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

const Modal = ({ show, onHide, centered = false, size = "md", className = "", children }) => {
  if (!show) return null;

  const modal = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-[99999998]"
        onClick={onHide}
      />

      {/* Dialog */}
      <div
        className={`fixed inset-0 z-[99999999] flex ${centered ? "items-center" : "items-start pt-16"} justify-center px-4`}
        onClick={onHide}
      >
        <div
          className={`bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.15)] w-full ${sizeClasses[size] ?? sizeClasses.md} ${className}`}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );

  return createPortal(modal, document.body);
};

/** Modal.Header */
const ModalHeader = ({ children, closeButton, onHide, className = "" }) => (
  <div className={`flex items-center justify-between px-6 py-4 border-b border-slate-100 ${className}`}>
    <div className="font-semibold text-slate-800 text-[16px]">{children}</div>
    {closeButton && (
      <button
        type="button"
        aria-label="Close"
        onClick={onHide}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-0 cursor-pointer text-xl leading-none"
      >
        &times;
      </button>
    )}
  </div>
);

/** Modal.Body */
const ModalBody = ({ children, className = "" }) => (
  <div className={`px-6 py-4 ${className}`}>
    {children}
  </div>
);

/** Modal.Footer */
const ModalFooter = ({ children, className = "" }) => (
  <div className={`flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 ${className}`}>
    {children}
  </div>
);

/** Modal.Title */
const ModalTitle = ({ children, className = "" }) => (
  <div className={`font-semibold text-slate-800 text-[16px] ${className}`}>{children}</div>
);

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
Modal.Title = ModalTitle;

export default Modal;
