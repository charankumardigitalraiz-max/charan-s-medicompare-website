import React from "react";
import { createPortal } from "react-dom";

/**
 * Tailwind-based Offcanvas panel — drop-in replacement for react-bootstrap Offcanvas.
 * Props: show, onHide, placement ("start"|"end"|"top"|"bottom"), className, children
 */
const Offcanvas = ({ show, onHide, placement = "end", className = "", children }) => {
  const placementClasses = {
    end: `right-0 top-0 h-full translate-x-full ${show ? "!translate-x-0" : ""}`,
    start: `left-0 top-0 h-full -translate-x-full ${show ? "!translate-x-0" : ""}`,
    top: `top-0 left-0 w-full -translate-y-full ${show ? "!translate-y-0" : ""}`,
    bottom: `bottom-0 left-0 w-full translate-y-full ${show ? "!translate-y-0" : ""}`,
  };

  const panel = (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-[99999998] transition-opacity duration-300 ${show ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onHide}
      />

      {/* Panel */}
      <div
        className={`fixed bg-white z-[99999999] flex flex-col shadow-xl transition-transform duration-300 ease-in-out
          ${placementClasses[placement] ?? placementClasses.end}
          ${className}`}
        style={{ minWidth: 300 }}
      >
        {children}
      </div>
    </>
  );

  return createPortal(panel, document.body);
};

/** Header with optional close button */
const OffcanvasHeader = ({ children, closeButton, className = "", onHide }) => (
  <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 ${className}`}>
    <div className="font-semibold text-slate-800 text-[15px]">{children}</div>
    {closeButton && (
      <button
        type="button"
        aria-label="Close"
        onClick={onHide}
        className="w-7 h-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors border-0 cursor-pointer text-lg leading-none"
      >
        &times;
      </button>
    )}
  </div>
);

/** Body — scrollable area */
const OffcanvasBody = ({ children, className = "" }) => (
  <div className={`flex-1 overflow-y-auto p-4 ${className}`}>
    {children}
  </div>
);

/** Title helper (used as Offcanvas.Title) */
const OffcanvasTitle = ({ children, className = "" }) => (
  <div className={`font-semibold text-slate-800 ${className}`}>{children}</div>
);

// Attach sub-components
Offcanvas.Header = OffcanvasHeader;
Offcanvas.Body = OffcanvasBody;
Offcanvas.Title = OffcanvasTitle;

export { Offcanvas, OffcanvasHeader, OffcanvasBody, OffcanvasTitle };
export default Offcanvas;
