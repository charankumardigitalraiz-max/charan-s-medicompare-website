import { useState, useEffect } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "../../components/ui/Offcanvas";
import { axiosInstance } from "../../Apiservice";
import toast from "react-hot-toast";
import { getImageUrl } from "../../utils";

const AppointmentFeedbackOffcanvas = ({ isOpen, toggle, order, onReviewSubmitted }) => {
  const [vendorRatings, setVendorRatings] = useState({}); // vendorId -> rating
  const [productRatings, setProductRatings] = useState({}); // uniqueKey -> rating
  const [comments, setComments] = useState({}); // uniqueKey -> comment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [groupedItems, setGroupedItems] = useState([]);

  // Helper functions matching Appointment-Order.jsx exactly
  const getOrderItemName = (item) => {
    return (
      item?.productSnapshot?.name ||
      item?.productDetails?.tabletdetails?.name ||
      item?.packageDetails?.name ||
      "N/A"
    );
  };

  const resolveOrderItemImage = (item) => {
    if (
      Array.isArray(item?.productSnapshot?.imageUrl) &&
      item.productSnapshot.imageUrl.length > 0
    ) {
      return getImageUrl(item.productSnapshot.imageUrl[0]);
    }

    if (
      Array.isArray(item?.productDetails?.tabletdetails?.imageUrl) &&
      item.productDetails.tabletdetails.imageUrl.length > 0
    ) {
      return getImageUrl(item.productDetails.tabletdetails.imageUrl[0]);
    }

    if (
      Array.isArray(item?.productDetails?.variantcurrentDetails?.files) &&
      item.productDetails.variantcurrentDetails.files.length > 0
    ) {
      return getImageUrl(item.productDetails.variantcurrentDetails.files[0]);
    }

    if (
      Array.isArray(item?.packageDetails?.files) &&
      item.packageDetails.files.length > 0
    ) {
      return getImageUrl(item.packageDetails.files[0]);
    }

    return "/assets/default.png";
  };

  const resolveItemVendor = (item) => {
    const vendorDetails =
      (Array.isArray(item?.packageDetails?.vendorDetails) &&
        item.packageDetails.vendorDetails.length > 0
        ? item.packageDetails.vendorDetails[0]
        : null) ||
      (Array.isArray(item?.productDetails?.vendorDetails) &&
        item.productDetails.vendorDetails.length > 0
        ? item.productDetails.vendorDetails[0]
        : null) ||
      (Array.isArray(item?.productSnapshot?.vendorDetails) &&
        item.productSnapshot.vendorDetails.length > 0
        ? item.productSnapshot.vendorDetails[0]
        : null);

    if (!vendorDetails) return null;

    const rawImage = Array.isArray(vendorDetails.bussiness_image)
      ? vendorDetails.bussiness_image[0]?.url
      : vendorDetails.bussiness_image?.url;

    return {
      vendorId: vendorDetails.vendorId || vendorDetails._id,
      name: vendorDetails.name || vendorDetails.bussiness_name || "N/A",
      imageUrl: rawImage ? getImageUrl(rawImage) : "/assets/default.png",
      address: vendorDetails.address || vendorDetails.bussiness_address || "",
      phone: vendorDetails.phone || vendorDetails.bussiness_mobile || "",
      email: vendorDetails.email || vendorDetails.bussiness_email || "",
      location: vendorDetails.location || null,
    };
  };

  useEffect(() => {
    let items = [];

    if (Array.isArray(order?.groupDetails) && order.groupDetails.length > 0) {
      items = order.groupDetails?.flatMap(group => group?.items || []);
    } else if (Array.isArray(order?.items) && order.items.length > 0) {
      items = order.items;
    }

    // Filter duplicates using the exact same keys
    const uniqueItems = [];
    const seenKeys = new Set();

    items.forEach(item => {
      if (!item) return;

      const vendor = resolveItemVendor(item);
      const vendorId = vendor?.vendorId || "unknown_vendor";
      const productId = item.productId || item.packageId || "";
      const key = `${vendorId}-${productId}`;

      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        uniqueItems.push(item);
      }
    });

    // Group items by vendor
    const groups = {};

    uniqueItems.forEach(item => {
      const vendor = resolveItemVendor(item);
      const vendorId = vendor?.vendorId || "unknown_vendor";

      if (!groups[vendorId]) {
        groups[vendorId] = {
          vendor: vendor || { vendorId, name: "Healthcare Partner", imageUrl: "/assets/default.png" },
          vendorId,
          items: []
        };
      }
      groups[vendorId].items.push(item);
    });

    setGroupedItems(Object.values(groups));
  }, [order]);

  const handleVendorRating = (vendorId, rating) => {
    setVendorRatings((prev) => ({
      ...prev,
      [vendorId]: rating,
    }));
  };

  const handleProductRating = (itemKey, rating) => {
    setProductRatings((prev) => ({
      ...prev,
      [itemKey]: rating,
    }));
  };

  const handleCommentChange = (itemKey, comment) => {
    setComments((prev) => ({
      ...prev,
      [itemKey]: comment,
    }));
  };

  const clearAllRatings = () => {
    setVendorRatings({});
    setProductRatings({});
    setComments({});
  };

  const handleClose = () => {
    clearAllRatings();
    toggle();
  };

  const handleSubmit = async () => {
    if (!groupedItems?.length) {
      toast.error("No items found.");
      return;
    }

    // Validation: check that each vendor is rated
    for (const group of groupedItems) {
      const vRating = Number(vendorRatings[group.vendorId]) || 0;
      if (vRating < 1 || vRating > 5) {
        const vendorName = group.vendor?.name || "the vendor";
        toast.error(`Please provide a rating for the vendor: ${vendorName}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const vendorIds = groupedItems.map(g => g.vendorId).filter(Boolean);
      const ratingsArray = [];

      groupedItems.forEach(group => {
        const vRating = Number(vendorRatings[group.vendorId]) || 0;

        group.items.forEach(item => {
          const productId = item.productId || null;
          const packageId = item.packageId || null;
          const key = `${group.vendorId}-${productId || packageId}`;

          const pRating = Number(productRatings[key]) || 0;
          const comment = String(comments[key] || "").trim();

          const ratingData = {
            productId,
            packageId,
            vendorId: group.vendorId || null,
            rating: Math.min(5, Math.max(0, pRating)),
            vendorrating: Math.min(5, Math.max(0, vRating)),
            productreviewType: "product",
          };

          if (comment) {
            ratingData.comment = comment;
          }

          ratingsArray.push(ratingData);
        });
      });

      const payload = {
        orderId: order?._id || order?.orderId,
        vendorIds,
        ratings: ratingsArray,
      };

      const token = localStorage.getItem("medicomparestoken");
      const response = await axiosInstance.post("rating/multirating", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Feedback submitted successfully!");
        if (onReviewSubmitted) {
          onReviewSubmitted(order?._id || order?.orderId);
        }
        clearAllRatings();
        toggle();
      } else {
        toast.error(response.data?.message || "Failed to submit feedback");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Error submitting feedback",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 !z-[999999999]"
          onClick={handleClose}
        />
      )}

      <Offcanvas
        show={isOpen}
        onHide={handleClose}
        placement="end"
        className="w-[380px]"
      >
        <OffcanvasHeader closeButton onHide={handleClose}>
          Appointment Feedback
        </OffcanvasHeader>

        <OffcanvasBody className="pb-[90px] bg-[#fafafc]">
          {groupedItems.map((group) => {
            const vendor = group.vendor;
            const vendorId = group.vendorId;

            const vendorImage = vendor?.bussiness_image?.[0]?.url || vendor?.imageUrl;
            const formattedVendorImage = vendorImage
              ? getImageUrl(vendorImage)
              : "/assets/default.png";

            return (
              <div key={vendorId} className="bg-[#f8f6fc] border border-[#eadeff] rounded-xl p-4 mb-5 shadow-[0_2px_6px_rgba(128,89,202,0.04)]">
                {/* Vendor Section */}
                <div className="flex items-center gap-3 mb-3 border-b border-dashed border-[#e2d5f8] pb-3">
                  <img
                    src={formattedVendorImage}
                    className="w-[50px] h-[50px] rounded-full object-cover border-2 border-[var(--color-primary,#4c2691)]"
                    alt="Vendor Logo"
                    onError={(e) => { e.currentTarget.src = "/assets/default.png"; }}
                  />
                  <div className="flex-grow-1">
                    <div className="font-semibold text-sm text-[#1a1a1a]">
                      {vendor?.name || "Lab Provider"}
                      <span className="text-[#dc3545] ml-1">*</span>
                    </div>
                    <div className="mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fa-solid fa-star text-base cursor-pointer mr-1 transition-colors duration-150 ease ${(vendorRatings[vendorId] || 0) >= star ? "text-[#ffc107]" : "text-[#cfcfcf]"
                            }`}
                          onClick={() => handleVendorRating(vendorId, star)}
                        ></i>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Products/Tests List under this Vendor */}
                <div className="text-[12px] font-semibold text-[#666] mb-2">
                  Items Booked:
                </div>
                {group.items.map((item) => {
                  const productId = item.productId || item.packageId || "";
                  const key = `${vendorId}-${productId}`;

                  const productName = getOrderItemName(item);
                  const productImage = resolveOrderItemImage(item);

                  return (
                    <div key={productId} className="bg-white border border-[#f0ecf7] rounded-[10px] p-3 mt-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <img
                          src={productImage}
                          className="w-[45px] h-[45px] rounded-lg object-contain bg-[#fdfdfd]"
                          alt={productName}
                          onError={(e) => { e.currentTarget.src = "/assets/default.png"; }}
                        />
                        <div className="font-medium text-[13px] text-[#333] break-all">
                          {productName}
                        </div>
                      </div>

                      {/* Product Rating */}
                      <div className="mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fa-solid fa-star text-base cursor-pointer mr-1 transition-colors duration-150 ease ${(productRatings[key] || 0) >= star ? "text-[#ffc107]" : "text-[#cfcfcf]"
                              }`}
                            onClick={() => handleProductRating(key, star)}
                          ></i>
                        ))}
                      </div>

                      {/* Product Comment */}
                      <textarea
                        className="form-control form-control-sm text-[12px] rounded-[6px]"
                        placeholder="Add your review for this item..."
                        rows="2"
                        value={comments[key] || ""}
                        onChange={(e) => handleCommentChange(key, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            );
          })}
        </OffcanvasBody>

        <div className="p-3 position-absolute bottom-0 start-0 end-0 border-t border-[#eef0f2] bg-white border-top">
          <button
            className="border-0 w-full bg-[var(--color-primary,#4c2691)] text-white p-2.5 rounded-lg font-semibold transition-colors duration-200 ease hover:bg-[var(--color-primary-dark,#5c33a6)] disabled:bg-[#cccccc] disabled:cursor-not-allowed"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Review"}
          </button>
        </div>
      </Offcanvas>
    </>
  );
};

export default AppointmentFeedbackOffcanvas;
