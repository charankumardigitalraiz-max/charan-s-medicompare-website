import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { axiosInstance, } from "../../../../Apiservice.jsx";
import { getImageUrl } from "../../../../utils/index";
import toast from "react-hot-toast";
import { useResponsive } from "../../../../hooks";

const ProductReviewModal = ({ show, onClose, product, position = "right", onReviewSubmit }) => {
  const navigate = useNavigate();
  const { service } = useParams();
  const { isMobile } = useResponsive();
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [selectedTag, setSelectedTag] = useState("Quality of Product");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const experienceTags = [
    "Quality of Product",
    "Packaging",
    "Pricing Value",
    "Service & Timeliness",
    "Product color",
  ];

  const handleStarClick = (starValue) => {
    setRating(starValue);
  };

  const handleReviewChange = (e) => {
    const text = e.target.value;
    if (text.length <= 500) {
      setReviewText(text);
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      sessionStorage.setItem("redirectAfterLogin", window.location.pathname);
      navigate("/login");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        vendorId: product?.vendorId || null,
        productId: product?._id || "",
        rating: rating.toString(),
        comment: reviewText || "",
        productreviewType: selectedTag || "",
      };

      const response = await axiosInstance.post("rating/create", payload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
        },
      });

      if (response.data.success) {
        toast.success("Thank you for your review!");
        setRating(0);
        setReviewText("");
        setSelectedTag("Quality of Product");
        if (onReviewSubmit) {
          onReviewSubmit();
        }
        
        onClose();
      } else {
        throw new Error(response.data.message || "Failed to submit review");
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRating(0);
      setReviewText("");
      setSelectedTag("Quality of Product");
      onClose();
    } catch (error) {
      // Error submitting review
      toast.error(
        error.response?.data?.message ||
          "Failed to submit review. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setReviewText("");
    setSelectedTag("Quality of Product");
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!show) return null;

  //  product image
  const getProductImage = () => {
    if (product?.files && product.files.length > 0) {
      return product.files[0];
    }

    if (product?.imageUrl && product.imageUrl.length > 0) {
      return product.imageUrl[0];
    }

    if (
      product?.variant &&
      Array.isArray(product.variant) &&
      product.variant.length > 0
    ) {
      const firstVariant = product.variant[0];

      if (firstVariant?.files && firstVariant.files.length > 0) {
        return firstVariant.files[0];
      }

      if (firstVariant?.imageUrl && firstVariant.imageUrl.length > 0) {
        return firstVariant.imageUrl[0];
      }
    }

    return "/assets/default.png";
  };

  const productImage = getProductImage();
  const productImageSrc = getImageUrl(productImage);
  const productName = product?.name || "Product";

  // Mobile
  if (isMobile) {
    if (!show) return null;

    return (
      <>
        <style>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes slideUp {
            from {
              transform: translateY(100%);
              opacity: 0;
            }
            to {
              transform: translateY(0);
              opacity: 1;
            }
          }
        `}</style>
        <div
          className="product-review-offcanvas-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 999999999,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            animation: "fadeIn 0.4s ease-in-out",
          }}
          onClick={handleOverlayClick}
        >
          <div
            className="product-review-offcanvas-content"
            style={{
              width: "100%",
              maxWidth: "100%",
              maxHeight: "90vh",
              backgroundColor: "white",
              borderTopLeftRadius: "16px",
              borderTopRightRadius: "16px",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: "40px",
                height: "4px",
                backgroundColor: "#d1d5db",
                borderRadius: "2px",
                margin: "12px auto 8px",
                cursor: "grab",
              }}
            ></div>
            <div
              style={{
                padding: "14px 10px",
                borderBottom: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: "#f8f9fa",
              }}
            >
              <div
                className="w-100 text-center"
                style={{ position: "relative" }}
              >
                <h6 className="mb-0" style={{ fontSize: "16px" }}>
                  Product Ratings & Reviews
                </h6>
                <p
                  className="mb-0 text-muted mt-1"
                  style={{ fontSize: "12px", color: "#6b7280" }}
                >
                  Your feedback helps others make informed decisions
                </p>
              </div>
              <button
                onClick={handleClose}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "18px",
                  cursor: "pointer",
                  color: "#6c757d",
                  padding: "4px 8px",
                }}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
              <div className="d-flex align-items-center gap-3">
                <img
                  src={productImageSrc}
                  alt={productName}
                  style={{
                    width: "60px",
                    height: "60px",
                    objectFit: "contain",
                    borderRadius: "8px",
                    border: "1px solid #e9ecef",
                  }}
                />
                <div className="flex-grow-1">
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <h6
                      className="mb-0 fw-bold"
                      style={{ fontSize: "14px", color: "#111827", textTransform:"capitalize" }}
                    >
                      {productName.length > 40
                        ? productName.substring(0, 40) + "..."
                        : productName}
                    </h6>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="d-flex gap-2 justify-content-center mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: "pointer",
                        fontSize: "20px",
                        color: star <= rating ? "#ffc107" : "#d1d5db",
                        transition: "color 0.2s",
                      }}
                    >
                      <i className="fas fa-star"></i>
                    </button>
                  ))}
                </div>
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <p
                    className="mb-0"
                    style={{ fontSize: "12px", color: "#6b7280" }}
                  >
                    Tap to rate this product
                  </p>
                </div>
              </div>
     
              {(service === "medicine" || service === "medicines") && (
              <div className="mb-4">
                <h6 className="fw-bold mb-3" style={{ fontSize: "14px" }}>
                  How was your overall experience with this product?
                </h6>
                <div className="d-flex flex-wrap gap-2">
                  {experienceTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: "20px",
                        border:
                          selectedTag === tag ? "none" : "1px solid #d1d5db",
                        backgroundColor:
                          selectedTag === tag ? "#8059ca" : "white",
                        color: selectedTag === tag ? "white" : "#374151",
                        fontSize: "12px",
                        cursor: "pointer",

                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                      }}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              )}

              <div className="mb-4">
                <h6 className=" mb-2" style={{ fontSize: "14px" }}>
                  Write Your Review
                </h6>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder=" Write Your Review..."
                  value={reviewText}
                  onChange={handleReviewChange}
                  style={{
                    borderRadius: "8px",
                    border: "1px solid #e0e0e0",
                    fontSize: "10px",
                    resize: "none",
                    backgroundColor: "#f9fafb",
                    padding: "10px",
                  }}
                />
                <div
                  className="text-end mt-1"
                  style={{ fontSize: "12px", color: "#6b7280" }}
                >
                  {reviewText.length}/500
                </div>
              </div>
            </div>
            <div style={{ padding: "16px 20px", borderTop: "1px solid #eee" }}>
              <button
                type="button"
                className="btn w-100 fw-bold"
                onClick={handleSubmit}
                style={{
                  backgroundColor: "#8059ca",
                  color: "white",
                  borderRadius: "8px",
                  fontSize: "16px",
                  border: "none",
                }}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Desktop
  if (!show) return null;

  return (
    <>
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
      <div
        className="product-review-offcanvas-overlay"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 999999999,
          display: "flex",
          alignItems: "center",
          justifyContent: position === "right" ? "flex-end" : "flex-start",
          animation: "fadeIn 0.4s ease-in-out",
        }}
        onClick={handleOverlayClick}
      >
        <div
          className="product-review-offcanvas-content"
          style={{
            width: "100%",
            maxWidth: "350px",
            height: "100%",
            backgroundColor: "white",
            boxShadow: "-2px 0 10px rgba(0,0,0,0.1)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            animation:
              position === "right"
                ? "slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                : "slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              padding: "14px 10px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "#f8f9fa",
            }}
          >
            <div className="w-100 text-center" style={{ position: "relative" }}>
              <button
                type="button"
                onClick={handleClose}
                style={{
                  background: "none",
                  border: "none",
                  padding: "8px",
                  cursor: "pointer",
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  transform: "translateY(-50%)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  transition: "background-color 0.2s",
                }}
              >
                <i
                  className="fas fa-arrow-left"
                  style={{ fontSize: "16px", color: "#374151" }}
                ></i>
              </button>
              <h6 className="mb-0" style={{ fontSize: "14px" }}>
                Product Ratings & Reviews
              </h6>
              <p
                className="mb-0 text-muted mt-1"
                style={{ fontSize: "10px", color: "#6b7280" }}
              >
                Your feedback helps others make informed decisions
              </p>
            </div>
          </div>

          <div style={{ flex: 1, overflow: "auto", padding: "20px" }}>
            <div className="d-flex align-items-center gap-3 mb-2">
              <img
                src={productImageSrc}
                alt={productName}
                loading="lazy"
                title={productName}
                style={{
                  width: "60px",
                  height: "60px",
                  objectFit: "contain",
                  borderRadius: "8px",
                  border: "1px solid #e9ecef",
                }}
              />
              <div className="flex-grow-1">
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h6
                    className="mb-0 fw-bold"
                    style={{ fontSize: "14px", color: "#111827", textTransform:"capitalize" }}
                  >
                    {productName.length > 40
                      ? productName.substring(0, 40) + "..."
                      : productName}
                  </h6>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex gap-2 justify-content-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    style={{
                      background: "none",
                      border: "none",
                      padding: 0,
                      cursor: "pointer",
                      fontSize: "20px",
                      color: star <= rating ? "#ffc107" : "#d1d5db",
                      transition: "color 0.2s",
                    }}
                  >
                    <i className="fas fa-star"></i>
                  </button>
                ))}
              </div>
              <div className="d-flex align-items-center justify-content-center gap-2">
                <p
                  className="mb-0"
                  style={{ fontSize: "12px", color: "#6b7280" }}
                >
                  Tap to rate this product
                </p>
              </div>
            </div>

            {(service === "medicine" || service === "medicines") && (
            <div className="mb-3">
              <h6 className=" mb-3 text-center" style={{ fontSize: "12px" }}>
                How was your overall experience with this product?
              </h6>
              <div className="d-flex flex-wrap gap-2">
                {experienceTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: "20px",
                      border:
                        selectedTag === tag ? "none" : "1px solid #d1d5db",
                      backgroundColor:
                        selectedTag === tag ? "#8059ca" : "white",
                      color: selectedTag === tag ? "white" : "#374151",
                      fontSize: "12px",
                      fontWeight: selectedTag === tag ? "500" : "400",
                      cursor: "pointer",

                      display: "flex",
                      alignItems: "center",
                      gap: "2px",
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            )}

            <div className="mb-4">
              <h6 className=" mb-2" style={{ fontSize: "14px" }}>
                Write Your Review
              </h6>
              <textarea
                className="form-control"
                rows="4"
                 placeholder=" Write Your Review..."
                value={reviewText}
                onChange={handleReviewChange}
                style={{
                  borderRadius: "8px",
                  border: "1px solid #e0e0e0",
                  fontSize: "12px",
                  resize: "none",
                  backgroundColor: "#f9fafb",
                  padding: "10px",
                }}
              />
              <div
                className="text-end mt-1"
                style={{ fontSize: "12px", color: "#6b7280" }}
              >
                {reviewText.length}/500
              </div>
            </div>
          </div>
          <div style={{ padding: "16px 20px", borderTop: "1px solid #eee" }}>
            <button
              type="button"
              className="btn w-100 fw-bold"
              onClick={handleSubmit}
              style={{
                backgroundColor: "#8059ca",
                color: "white",
                borderRadius: "8px",
                padding: "12px",
                fontSize: "16px",
                border: "none",
              }}
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductReviewModal;
