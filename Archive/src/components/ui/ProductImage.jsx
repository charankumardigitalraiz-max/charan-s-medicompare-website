import React from "react";
import { imgUrl } from "../../Apiservice";
import { getImageUrl } from "../../utils/index";

const ProductImage = ({
  src,
  alt = "Product",
  fallback = "/medicine.jpg",
  className = "",
  style = {},
  onClick,
  containerStyle = {},
}) => {
  const imageSrc = src ? getImageUrl(src.replace(/\s/g, "%20")) : fallback;

  const defaultContainerStyle = {
    width: "100%",
    height: "170px",
    borderRadius: "16px 16px 0 0",
    position: "relative",
    background: "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    padding: "15px",
    boxSizing: "border-box",
    ...containerStyle,
  };

  const defaultImageStyle = {
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
    cursor: onClick ? "pointer" : "default",
    ...style,
  };

  return (
    <div style={defaultContainerStyle}>
      <img
        src={imageSrc}
        alt={alt}
        title={alt}
        className={className}
        style={defaultImageStyle}
        onClick={onClick}
        onError={(e) => {
          if (e.target.src !== fallback) {
            e.target.src = fallback;
          }
        }}
        loading="lazy"
      />
    </div>
  );
};

export default ProductImage;

