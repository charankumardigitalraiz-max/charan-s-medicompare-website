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
  zIndex = "999999999",
}) => {
  if (!show) return null;

  const sizeClasses = {
    sm: "modal-sm",
    md: "",
    lg: "modal-lg",
    xl: "modal-xl",
  };

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: backdrop ? "rgba(0,0,0,0.85)" : "transparent",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex,
        backdropFilter: backdrop ? "blur(2px)" : "none",
      }}
      onClick={backdrop ? onClose : undefined}
    >
      <div
        className={`modal-dialog ${sizeClasses[size]} ${centered ? "modal-dialog-centered" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`modal-content shadow-lg ${className}`}
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "none",
          }}
        >
          {(title || closeButton) && (
            <div
              className={`modal-header ${headerClassName}`}
              style={{
                borderBottom: "1px solid #e9ecef",
                padding: "20px 24px 16px",
              }}
            >
              {title && (
                <h5
                  className="modal-title"
                  style={{ fontWeight: "600", fontSize: "18px", margin: 0 }}
                >
                  {title}
                </h5>
              )}
              {closeButton && (
                <button
                  type="button"
                  className="btn-close"
                  onClick={onClose}
                  style={{ fontSize: "14px" }}
                />
              )}
            </div>
          )}
          <div
            className={`modal-body ${bodyClassName}`}
            style={{ padding: title ? "16px 24px" : "24px" }}
          >
            {children}
          </div>
          {footer && (
            <div
              className="modal-footer"
              style={{
                borderTop: "1px solid #e9ecef",
                padding: "16px 24px",
              }}
            >
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;

