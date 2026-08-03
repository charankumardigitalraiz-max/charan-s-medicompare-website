import { useState, useEffect } from "react";
import { Offcanvas, OffcanvasHeader, OffcanvasBody } from "../../../components/ui/Offcanvas";
import { axiosInstance, imgUrl } from "../../../Apiservice";
import toast from "react-hot-toast";
import { getImageUrl } from "../../../utils";

const OrderFeedbackOffcanvas = ({ isOpen, toggle, order, onReviewSubmitted }) => {
  const [ratings, setRatings] = useState({});
  const [comments, setComments] = useState({});
  const [vendorRatings, setVendorRatings] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderItemsList, setOrderItemsList] = useState([])
  const handleProductRating = (itemIndex, rating) => {
    setRatings((prev) => ({
      ...prev,
      [itemIndex]: rating,
    }));
  };

  // const orderItems = Array.isArray(order) ? order : order?.items || [];
  // setOrderItemsList(orderItems);

  useEffect(() => {
    let items = [];
    // console.log("orders", order);

    if (Array.isArray(order?.groupDetails)) {
      items = order.groupDetails?.flatMap(group => group?.items || []);
    }
    if (Array.isArray(order?.items)) {
      items = order.items;
    }

    // Remove duplicates
    const uniqueItems = [];
    const seen = new Set();

    items.forEach(item => {
      const vendorId =
        item?.productSnapshot?.vendorDetails?.[0]?.vendorId ||
        item?.packageDetails?.vendorDetails?.[0]?.vendorId ||
        item?.productDetails?.vendorDetails?.[0]?.vendorId ||
        item?.vendorId ||
        "";

      const productId =
        item?.productId ||
        item?.packageId ||
        "";

      // Change this key based on your requirement
      const key = `${vendorId}-${productId}`;

      if (!seen.has(key)) {
        seen.add(key);
        uniqueItems.push(item);
      }
    });

    setOrderItemsList(uniqueItems);
  }, [order]);

  const handleVendorRating = (itemIndex, rating) => {
    setVendorRatings((prev) => ({
      ...prev,
      [itemIndex]: rating,
    }));
  };

  const handleCommentChange = (itemIndex, comment) => {
    setComments((prev) => ({
      ...prev,
      [itemIndex]: comment,
    }));
  };

  const clearAllRatings = () => {
    setRatings({});
    setVendorRatings({});
    setComments({});
  };

  const handleClose = () => {
    clearAllRatings();
    toggle();
  };

  const handleSubmit = async () => {
    console.log("submitted")
    if (!orderItemsList?.length) {
      toast.error("No items found.");
      return;
    }
    console.log(orderItemsList, "orderItemsList")
    // Validate that all items with a vendor have a vendor rating
    for (let index = 0; index < orderItemsList.length; index++) {
      const item = orderItemsList[index];
      const vendor =
        item?.productSnapshot?.vendorDetails?.[0] ||
        item?.packageDetails?.vendorDetails?.[0];

      if (vendor) {
        const vRating = Number(vendorRatings[index]) || 0;
        if (vRating < 1 || vRating > 5) {
          const vendorName = vendor.name || "the vendor";
          toast.error(`Please provide a all ratings for vendors: ${vendorName}`);
          return;
        }
      }
    }

    setIsSubmitting(true);

    try {
      const vendorIds = [
        ...new Set(
          orderItemsList.map((item) =>
            item?.productSnapshot?.vendorDetails?.[0]?.vendorId ||
            item?.packageDetails?.vendorDetails?.[0]?.vendorId ||
            item?.vendorId
          )
        ),
      ];
      console.log(JSON.stringify("vendors", vendorIds, null, 2))
      const ratingsArray = orderItemsList.map((item, index) => {
        const productRating = Number(ratings[index]) || 0;
        const vendorRating = Number(vendorRatings[index]) || 0;
        const comment = String(comments[index] || "").trim();

        const ratingData = {
          productId: item.productId || null,
          packageId: item.packageId || null,
          vendorId: item.vendorId || null,
          rating: Math.min(5, Math.max(0, productRating)),
          vendorrating: Math.min(5, Math.max(0, vendorRating)),
          productreviewType: "product",
        };

        if (comment) {
          ratingData.comment = comment;
        }

        return ratingData;
      });

      const payload = {
        orderId:
          orderItemsList?.[0]?.orderId ||
          order?._id ||
          order?.orderId,

        vendorIds: vendorIds.filter(Boolean),

        ratings: ratingsArray,
      };

      const token = localStorage.getItem("medicomparestoken");
      const response = await axiosInstance.post("rating/multirating", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        toast.success("Ratings submitted successfully!");
        if (onReviewSubmitted) {
          onReviewSubmitted(
            orderItemsList?.[0]?.orderId ||
            order?._id ||
            order?.orderId
          );
        }
        clearAllRatings();
        toggle();
      } else {
        toast.error(response.data?.message || "Failed to submit ratings");
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        "Error submitting ratings",
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <>
      <style>{`
        .card-box1 {
          background: #faf9fcff;
          border: 1px solid rgba(240, 235, 250, 1);
          border-radius: 10px;
          padding: 10px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
          margin-bottom: 10px;
        }

        .rating-starss i {
          font-size: 14px;
          color: #cfcfcf;
          cursor: pointer;
          margin-right: 2px;
        }

        .product-img1 {
          width: 45px;
          height: 45px;
          border-radius: 10px;
          object-fit: contain;
         
        }

        .submit-btn {
          border: none;
          width: 100%;
        }

        .vendor-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
          padding: 15px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .vendor-name {
          font-weight: 600;
          color: #333;
        }
      `}</style>

      {isOpen && (
        <div
          className="fixed inset-0 bg-[rgba(0,0,0,0.8)] z-[999999999] flex items-center"
          onClick={handleClose}
        />
      )}

      <Offcanvas
        show={isOpen}
        onHide={handleClose}
        placement="end"
        className="!w-[350px]"
      >
        <OffcanvasHeader closeButton onHide={handleClose}>
          Product Review We value your feedback!
        </OffcanvasHeader>

        <OffcanvasBody className="!pb-[90px]">
          {orderItemsList.map((item, index) => {


            const vendor =
              item?.productSnapshot?.vendorDetails?.[0] ||
              item?.items?.[0]?.productSnapshot?.vendorDetails?.[0]?.name ||
              item?.productDetails?.vendorDetails?.[0] ||
              item?.packageDetails?.vendorDetails?.[0];
            const productName =
              item?.rentalDetails?.productSnapshot?.name ||
              item?.productSnapshot?.name ||
              item?.items?.[0]?.productSnapshot?.name ||
              item?.productDetails?.variantcurrentDetails?.productname ||
              item?.packageDetails?.name ||
              item?.productDetails?.name ||
              item?.rentalDetails?.productSnapshot?.name ||
              "Unknown Product";
            const rawProductImage =
              ((item?.productDetails?.tabletdetails?.imageUrl?.length || item?.productSnapshot?.imageUrl?.length) > 0
                ? item?.productSnapshot?.imageUrl?.[0]
                : item?.productDetails?.tabletdetails?.files?.[0]) ||
              item?.items?.[0]?.productSnapshot?.name ||
              item?.productDetails?.variantcurrentDetails?.files?.[0] ||
              item?.items?.[0]?.productSnapshot?.imageUrl?.[0] ||
              item?.packageDetails?.files?.[0] ||
              item?.packageDetails?.imageUrl?.[0];

            const productImage = rawProductImage
              ? getImageUrl(rawProductImage)
              : "/assets/default.png";

            const packageDescription = item?.packageDetails?.description;
            const packagePrice = item?.packageDetails?.price;

            const vendorImage = vendor?.bussiness_image?.[0]?.url;
            const formattedVendorImage = vendorImage
              ? getImageUrl(vendorImage)
              : "/assets/default.png";

            return (
              <div key={index} className="mb-[15px]">
                {vendor && (
                  <div className="card-box1 flex items-center">
                    <img
                      src={formattedVendorImage}
                      className="product-img1 mr-2 bg-white"
                      alt="Vendor"
                    />
                    <div className="flex-grow">
                      <div
                        className="font-medium mb-[5px] whitespace-nowrap overflow-hidden text-ellipsis text-[13px]"
                      >
                        {vendor.name.length > 30 ? vendor.name.slice(0, 30) + "..." : vendor.name}
                        <span className="text-[#dc3545] ml-[4px]" title="Mandatory">*</span>
                      </div>
                      <div className="rating-starss">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <i
                            key={star}
                            className={`fa-solid fa-star cursor-pointer ${vendorRatings[index] >= star ? "text-warning" : ""
                              }`}
                            onClick={() => handleVendorRating(index, star)}
                          ></i>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div className="card-box1 flex items-center">
                  <img
                    src={productImage}
                    className="product-img1 mr-2 bg-white"
                    alt={productName}
                  />
                  <div className="flex-grow">
                    <div
                      className="font-medium mb-[5px] whitespace-nowrap overflow-hidden text-ellipsis text-[13px]"
                    >
                      {productName.length > 30 ? productName.slice(0, 30) + "..." : productName}
                    </div>
                    {/* {packageDescription && (
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#666",
                          marginBottom: "5px",
                        }}
                      >
                        {packageDescription}
                      </div>
                    )}
                    {packagePrice && (
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#333",
                          fontWeight: "600",
                          marginBottom: "5px",
                        }}
                      >
                        ₹{packagePrice}
                      </div>
                    )} */}
                    <div className="rating-starss">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fa-solid fa-star cursor-pointer ${ratings[index] >= star ? "text-warning" : ""
                            }`}
                          onClick={() => handleProductRating(index, star)}
                        ></i>
                      ))}
                    </div>
                    <div className="mt-2">
                      <textarea
                        className="form-control form-control-sm text-[12px]"
                        placeholder="Add a comment..."
                        rows="2"
                        value={comments[index] || ""}
                        onChange={(e) =>
                          handleCommentChange(index, e.target.value)
                        }
                      ></textarea>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </OffcanvasBody>

        <div className="p-3 position-absolute bottom-0 start-0 end-0 border-top">
          <button
            className="submit-btn mb-0"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </button>
        </div>
      </Offcanvas>
    </>
  );
};

export default OrderFeedbackOffcanvas;
