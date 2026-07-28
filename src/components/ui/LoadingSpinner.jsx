import React from "react";

const LoadingSpinner = ({
  size = "md",
  color = "primary",
  text = "",
  fullScreen = false,
  className = "",
}) => {
  const sizeClasses = {
    sm: "spinner-border-sm",
    md: "",
    lg: "spinner-border-lg",
  };

  const colorClasses = {
    primary: "text-primary",
    white: "text-white",
    secondary: "text-secondary",
    success: "text-success",
    danger: "text-danger",
  };

  const spinner = (
    <div
      className={`spinner-border ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
      role="status"
    >
      <span className="visually-hidden">Loading...</span>
    </div>
  );

  if (fullScreen) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          width: "100vw",
        }}
      >
        {spinner}
        {text && (
          <p className={`mt-3 ${colorClasses[color]}`} style={{ fontSize: "14px" }}>
            {text}
          </p>
        )}
      </div>
    );
  }

  if (text) {
    return (
      <div className="d-flex flex-column align-items-center">
        {spinner}
        <p className={`mt-2 ${colorClasses[color]}`} style={{ fontSize: "14px" }}>
          {text}
        </p>
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;

