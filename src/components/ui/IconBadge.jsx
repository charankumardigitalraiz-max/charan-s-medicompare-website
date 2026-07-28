import React from "react";

const IconBadge = ({
  icon,
  text,
  variant = "primary",
  size = "sm",
  className = "",
  onClick,
}) => {
  const variantStyles = {
    primary: { backgroundColor: "#8059ca", color: "white" },
    success: { backgroundColor: "#28a745", color: "white" },
    danger: { backgroundColor: "#dc3545", color: "white" },
    warning: { backgroundColor: "#ffc107", color: "black" },
    info: { backgroundColor: "#17a2b8", color: "white" },
    light: { backgroundColor: "#f8f9fa", color: "#333" },
  };

  const sizeStyles = {
    sm: { fontSize: "10px", padding: "2px 6px" },
    md: { fontSize: "12px", padding: "4px 8px" },
    lg: { fontSize: "14px", padding: "6px 12px" },
  };

  const style = {
    ...variantStyles[variant],
    ...sizeStyles[size],
    borderRadius: "6px",
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s",
  };

  return (
    <span
      className={className}
      style={style}
      onClick={onClick}
      onMouseEnter={(e) => onClick && (e.currentTarget.style.opacity = "0.8")}
      onMouseLeave={(e) => onClick && (e.currentTarget.style.opacity = "1")}
    >
      {icon && <i className={icon} style={{ fontSize: sizeStyles[size].fontSize }} />}
      {text}
    </span>
  );
};

export default IconBadge;

