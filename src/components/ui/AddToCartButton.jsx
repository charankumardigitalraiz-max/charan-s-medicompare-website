import React, { useState } from "react";
import { useAddToCart } from "../../hooks/useAddToCart";
import { LoadingSpinner } from "./index";

/**
 * Reusable Add to Cart Button Component
 * 
 * @param {Object} props
 * @param {Object} props.item - Product item
 * @param {Object} props.variant - Variant object (optional)
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.style - Inline styles
 * @param {string} props.text - Button text (default: "Add")
 * @param {string} props.icon - Icon class (default: "fas fa-shopping-cart")
 * @param {Object} props.options - Additional options for addToCart
 * @param {function} props.onSuccess - Callback on successful add
 * @param {function} props.onError - Callback on error
 * @param {boolean} props.showIcon - Show icon (default: true)
 * @param {string} props.variant - Button variant style
 */
const AddToCartButton = ({
  item,
  variant = null,
  className = "",
  style = {},
  text = "Add",
  icon = "fas fa-shopping-cart",
  options = {},
  onSuccess,
  onError,
  showIcon = true,
  variant: buttonVariant = "primary",
  disabled = false,
  ...props
}) => {
  const { addToCart } = useAddToCart();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }

    if (disabled || isLoading) return;

    setIsLoading(true);
    try {
      const success = await addToCart(item, variant, options);
      if (success && onSuccess) {
        onSuccess(item, variant);
      } else if (!success && onError) {
        onError(item, variant);
      }
    } catch (error) {
      if (onError) {
        onError(item, variant, error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const defaultClassName = `tablet-card-add-btn ${className}`.trim();
  const defaultStyle = {
    cursor: disabled || isLoading ? "not-allowed" : "pointer",
    opacity: disabled || isLoading ? 0.6 : 1,
    ...style,
  };

  return (
    <button
      className={defaultClassName}
      onClick={handleClick}
      disabled={disabled || isLoading}
      type="button"
      style={defaultStyle}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span className="ms-2">Adding...</span>
        </>
      ) : (
        <>
          {showIcon && <i className={icon}></i>}
          {text && <span>{text}</span>}
        </>
      )}
    </button>
  );
};

export default AddToCartButton;

