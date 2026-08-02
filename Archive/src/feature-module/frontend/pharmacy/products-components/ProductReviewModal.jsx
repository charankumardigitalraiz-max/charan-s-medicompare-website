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
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `}</style>
        <div
          className="fixed inset-0 bg-black/50 z-[999999999] flex items-end justify-center animate-[fadeIn_0.4s_ease-in-out]"
          onClick={handleOverlayClick}
        >
          <div
            className="w-full max-h-[90vh] bg-white rounded-t-[16px] overflow-hidden flex flex-col animate-[slideUp_0.5s_cubic-bezier(0.4,0,0.2,1)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-[2px] mx-auto mt-3 mb-2 cursor-grab"></div>
            <div className="px-2.5 py-2 border-b border-gray-100 flex !items-center !justify-between bg-gray-50">

              <button
                onClick={handleClose}
                className="!bg-transparent !border-none !text-lg cursor-pointer !text-gray-400 hover:!text-gray-600 px-2 py-1"
              >
                <i className="fas fa-times"></i>
              </button>


              <div className="w-full text-center relative">
                <h6 className="m-0 text-base font-semibold text-gray-900">
                  Product Ratings & Reviews
                </h6>
                <p className="m-0 text-xs text-gray-500 mt-1">
                  Your feedback helps others make informed decisions
                </p>
              </div>

            </div>

            <div className="flex-1 overflow-auto p-5">
              <div className="flex items-center gap-3">
                <img
                  src={productImageSrc}
                  alt={productName}
                  className="w-[60px] h-[60px] object-contain rounded-lg border border-gray-100"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h6 className="m-0 font-bold text-[14px] text-gray-900 capitalize">
                      {productName.length > 40
                        ? productName.substring(0, 40) + "..."
                        : productName}
                    </h6>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex gap-2 justify-center mb-2 mt-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      className="bg-transparent border-none p-0 cursor-pointer text-2xl transition-colors duration-200"
                    >
                      <i
                        className={`fas fa-star ${star <= rating ? "!text-amber-400" : "!text-gray-300"
                          }`}
                      ></i>
                    </button>
                  ))}
                </div>
                <div className="flex items-center justify-center gap-2">
                  <p className="m-0 text-xs text-gray-500">
                    Tap to rate this product
                  </p>
                </div>
              </div>

              {(service === "medicine" || service === "medicines") && (
                <div className="mb-4">
                  <h6 className="font-bold mb-3 text-[14px] text-gray-850">
                    How was your overall experience with this product?
                  </h6>
                  <div className="flex flex-wrap gap-2">
                    {experienceTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSelectedTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-xs cursor-pointer flex items-center gap-1 transition-all duration-200 ${selectedTag === tag
                          ? "bg-[#8059ca] text-white border-none"
                          : "border border-gray-300 bg-white text-gray-700"
                          }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4">
                <h6 className="mb-2 text-[14px] text-gray-800">
                  Write Your Review
                </h6>
                <textarea
                  className="w-full rounded-lg border border-gray-200 text-[10px] resize-none bg-gray-50 p-2.5 outline-none focus:border-[#8059ca] focus:bg-white transition-all duration-200"
                  rows="4"
                  placeholder=" Write Your Review..."
                  value={reviewText}
                  onChange={handleReviewChange}
                />
                <div className="text-right mt-1 text-xs text-gray-500">
                  {reviewText.length}/500
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button
                type="button"
                className="w-full font-bold bg-[#8059ca] hover:bg-[#6a45b3] text-white rounded-lg text-base border-none py-3 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={handleSubmit}
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
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideInLeft {
          from { transform: translateX(-100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
      <div
        className="fixed inset-0 bg-black/80 z-[999999999] flex items-center justify-end animate-[fadeIn_0.4s_ease-in-out]"
        style={{
          justifyContent: position === "right" ? "flex-end" : "flex-start",
        }}
        onClick={handleOverlayClick}
      >
        <div
          className="w-full max-w-[350px] h-full bg-white shadow-[-2px_0_10px_rgba(0,0,0,0.1)] overflow-hidden flex flex-col"
          style={{
            animation:
              position === "right"
                ? "slideInRight 0.5s cubic-bezier(0.4, 0, 0.2, 1)"
                : "slideInLeft 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="!px-2.5 !py-3.5 !border-b !border-gray-100 flex items-center justify-between !bg-gray-50">
            <div className="w-full text-center relative">
              <button
                type="button"
                onClick={handleClose}
                className="!bg-transparent !border-none p-2 cursor-pointer absolute left-0 top-1/2 -translate-y-1/2 flex !items-center !justify-center w-8 h-8 !rounded-full hover:!bg-gray-150 transition-colors duration-200"
              >
                <i className="fas fa-arrow-left text-base text-gray-700"></i>
              </button>
              <h6 className="m-0 !text-sm !font-semibold text-gray-900">
                Product Ratings & Reviews
              </h6>
              <p className="m-0 !text-[10px] !text-gray-500 mt-1">
                Your feedback helps others make informed decisions
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-5">
            <div className="flex items-center gap-3">
              <img
                src={productImageSrc}
                alt={productName}
                loading="lazy"
                title={productName}
                className="w-[60px] h-[60px] object-contain rounded-lg border border-gray-100"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h6 className="m-0 font-bold text-[14px] text-gray-900 capitalize">
                    {productName.length > 40
                      ? productName.substring(0, 40) + "..."
                      : productName}
                  </h6>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex gap-2 justify-center mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => handleStarClick(star)}
                    className="bg-transparent !border-none p-0 cursor-pointer !text-2xl transition-colors duration-200"
                  >
                    <i
                      className={`fas fa-star ${star <= rating ? "!text-amber-400" : "!text-gray-300"
                        }`}
                    ></i>
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-center gap-2">
                <p className="m-0 text-xs text-gray-500">
                  Tap to rate this product
                </p>
              </div>
            </div>

            {(service === "medicine" || service === "medicines") && (
              <div className="mb-3">
                <h6 className="!mb-3 text-center text-xs text-gray-800">
                  How was your overall experience with this product?
                </h6>
                <div className="flex flex-wrap gap-2">
                  {experienceTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(tag)}
                      className={`px-3 py-1 !rounded-full !text-xs flex items-center gap-0.5 cursor-pointer transition-all duration-200 ${selectedTag === tag
                        ? "!bg-[#8059ca] !text-white !border-none !font-medium"
                        : "!border !border-gray-300 !bg-white !text-gray-700 !font-normal"
                        }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 mt-4">
              <h6 className="!mb-2 !text-[14px] !text-gray-800">
                Write Your Review
              </h6>
              <textarea
                className="!w-full !rounded-lg !border !border-gray-200 !text-xs !resize-none !bg-gray-50 !p-2.5 !outline-none !focus:border-[#8059ca] !focus:bg-white !transition-all !duration-200"
                rows="4"
                placeholder=" Write Your Review..."
                value={reviewText}
                onChange={handleReviewChange}
              />
              <div className="text-right mt-1 text-xs text-gray-500">
                {reviewText.length}/500
              </div>
            </div>
          </div>
          <div className="p-5 border-t border-gray-100">
            <button
              type="button"
              className="w-full !font-bold !bg-[#8059ca] hover:!bg-[#6a45b3] text-white !rounded-lg !py-2 !text-sm !border-none !shadow-md hover:!shadow-lg !transition-all !duration-200 !cursor-pointer"
              onClick={handleSubmit}
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
