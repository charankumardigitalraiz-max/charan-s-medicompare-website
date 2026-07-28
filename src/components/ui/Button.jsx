import React from "react";

const Button = ({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  onClick,
  disabled = false,
  loading = false,
  icon,
  iconPosition = "left",
  className = "",
  fullWidth = false,
  ...props
}) => {
  const baseClasses = "btn";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    light: "btn-light",
    white: "btn-white",
    gray: "btn-gray",
    danger: "btn-danger",
    success: "btn-success",
    outline: "btn-outline-primary",
  };

  const sizeClasses = {
    xs: "btn-xs",
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
    xl: "btn-xl",
  };

  const classes = `${baseClasses} ${variantClasses[variant] || variantClasses.primary} ${
    sizeClasses[size] || ""
  } ${fullWidth ? "w-100" : ""} ${className}`.trim();

  const iconElement = icon && (
    <i className={icon} style={{ marginRight: iconPosition === "left" ? "8px" : 0, marginLeft: iconPosition === "right" ? "8px" : 0 }} />
  );

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <div
            className="spinner-border spinner-border-sm me-2"
            role="status"
            style={{ width: "1rem", height: "1rem" }}
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          {children}
        </>
      ) : (
        <>
          {iconPosition === "left" && iconElement}
          {children}
          {iconPosition === "right" && iconElement}
        </>
      )}
    </button>
  );
};

export default Button;

