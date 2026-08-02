import React from "react";
import { useNavigate } from "react-router-dom";
import { imgUrl } from "../../Apiservice";
import { getImageUrl } from "../../utils/index";
import { Button, LoadingSpinner } from "./index";

const VendorCard = ({
  vendor,
  price,
  stock = 0,
  quantity = 0,
  maxStock = 999,
  isInStock = true,
  vendorName,
  vendorImage,
  vendorAddress,
  onVendorClick,
  onAddToCart,
  onIncrement,
  onDecrement,
  onGetQuote,
  onBookNow,
  bookingType = "cart",
  isLoading = false,
  className = "",
  showActions = true,
}) => {
  const navigate = useNavigate();

  const displayName = vendorName || vendor?.bussinessdetails?.name || "Vendor";
  const displayImage = vendorImage || vendor?.bussinessdetails?.bussiness_image?.url;
  const displayAddress = vendorAddress || vendor?.bussinessdetails?.address;
  const displayPrice = price || vendor?.price || vendor?.matchedPrice || 0;
  const formatCurrency = (value) => Number(value || 0).toFixed(2);
  const displayStock = stock || vendor?.stock || vendor?.matchedStock || 0;
  const isStockAvailable = isInStock !== undefined ? isInStock : displayStock > 0;

  const handleVendorClick = (vendor) => {
    if (onVendorClick) {
      onVendorClick(vendor);
      return;
    }
    
    const vendorId = vendor?._id || vendor?.businessdetails?._id || vendor?.bussinessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      const name = vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
      const vendorSlug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  return (
    <div className={`pd-vendor-item ${className}`}>
      <div className="pd-vendor-info">
        <div 
          className="pd-vendor-avatar" 
          onClick={() => handleVendorClick(vendor)}
          style={{ cursor: "pointer" }}
        >
          {displayImage ? (
            <img
              src={getImageUrl(displayImage)}
              alt={displayName}
              onError={(e) => {
                e.target.style.display = "none";
                if (e.target.parentElement) {
                  e.target.parentElement.textContent = displayName.charAt(0).toUpperCase();
                }
              }}
            />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="pd-vendor-details">
          <div 
            className="pd-vendor-name" 
            onClick={() => handleVendorClick(vendor)} 
            style={{ cursor: "pointer" }}
          >
            {displayName}
          </div>
          {displayAddress && (
            <div className="pd-vendor-location">
              <i className="fas fa-map-marker-alt"></i>
              {displayAddress.length > 25 ? displayAddress.slice(0, 25) + "..." : displayAddress}
            </div>
          )}
          <div className="pd-vendor-price">₹{formatCurrency(displayPrice)}</div>
          <div className={`pd-vendor-stock ${!isStockAvailable ? "out" : ""}`}>
            {isStockAvailable ? `Stock: ${displayStock}` : "Out of Stock"}
          </div>
        </div>
      </div>

      {showActions && (
        <div className="pd-vendor-actions">
          {isLoading ? (
            <LoadingSpinner size="sm" color="primary" />
          ) : !isStockAvailable ? (
            <Button variant="secondary" disabled className="pd-btn pd-btn-secondary">
              Out of Stock
            </Button>
          ) : quantity > 0 ? (
            <div className="pd-qty-controls">
              <button
                className="pd-qty-btn"
                onClick={onDecrement}
                type="button"
              >
                -
              </button>
              <div className="pd-qty-value">{quantity}</div>
              <button
                className="pd-qty-btn"
                disabled={quantity >= maxStock}
                onClick={onIncrement}
                type="button"
              >
                +
              </button>
            </div>
          ) : bookingType === "leads" ? (
            <Button
              variant="secondary"
              onClick={onGetQuote}
              className="pd-btn pd-btn-secondary"
              icon="fas fa-file-invoice"
            >
              Get Quote
            </Button>
          ) : bookingType === "booking" ? (
            <Button
              variant="primary"
              onClick={onBookNow}
              className="pd-btn pd-btn-primary"
            >
              Book Now
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={onAddToCart}
              className="pd-btn pd-btn-primary"
            >
              Add to Cart
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default VendorCard;

