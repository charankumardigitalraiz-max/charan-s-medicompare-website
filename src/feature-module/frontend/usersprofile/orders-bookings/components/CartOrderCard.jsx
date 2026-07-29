import React from "react";

/**
 * CartOrderCard
 *
 * Reusable card component for displaying a single cart / booking order.
 * Matches the AppointmentOrderCard style exactly.
 */
const CartOrderCard = ({
  order,
  onView,
  onReview,
  onInvoice,
  onReschedule,
  onReportIssue,
  onCancel,
  resolveOrderImage,
  getOrderVendors,
  getOrderStatusMeta,
}) => {
  const firstItem = order?.items?.[0];
  const statusMeta = getOrderStatusMeta(order.orderStatus);
  const allVendors = getOrderVendors(order);
  const total = order?.billingSummary?.total ?? order?.billingSummary?.finalAmount ?? order?.total ?? 0;

  // Map state badge classes to Tailwind classes
  const badgeColorsMap = {
    delivered: "bg-[#d7f5e8] text-[#00a86b]",
    confirmed: "bg-[#e8f4fd] text-[#0d6efd]",
    cancelled: "bg-[#ffe0e0] text-[#dc3545]",
    failed: "bg-[#f8d7da] text-[#842029]",
    returned: "bg-[#e2e8f0] text-[#475569]",
    processing: "bg-[#ffe9d6] text-[#ff7a00]",
    "in-progress": "bg-[#ffe9d6] text-[#ff7a00]"
  };

  const badgeColorClasses = badgeColorsMap[statusMeta.badgeClass] || "bg-[#ffe9d6] text-[#ff7a00]";

  return (
    <div className="bg-white border-[1.5px] border-[#f0f0f0] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-3 h-100 flex flex-col justify-between hover:shadow-[0_6px_18px_rgba(128,89,202,0.12)] transition-shadow duration-300">
      <div>
        {/* ── HEADER: Order ID + vendor inline + date + status badge ── */}
        <div className="flex justify-between items-center mb-3 flex-wrap gap-2 pb-2 border-b border-[#f8f8f8]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[14px] font-bold text-[#333]">
                #{order.orderId}
              </span>

              {allVendors.length > 0 && (
                <>
                  <span style={{ color: "#ddd" }}>|</span>
                  <div className="flex items-center gap-1">
                    <img
                      src={allVendors[0].imageUrl}
                      alt={allVendors[0].name}
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      onError={(e) => {
                        e.currentTarget.src = "/medicine.jpg";
                      }}
                    />
                    <span style={{ fontSize: "12px", color: "#8059ca", fontWeight: 600, textTransform: "capitalize" }}>
                      {allVendors[0].name}
                    </span>
                  </div>
                </>
              )}
            </div>

            <span style={{ fontSize: "11px", color: "#999" }}>
              Ordered on{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <span className={`text-capitalize text-[11px] py-1 px-2.5 rounded-[30px] font-semibold ${badgeColorClasses}`}>
            {statusMeta.label}
          </span>
        </div>

        {/* Cancellation Reason Alert */}
        {(order.orderStatus?.toLowerCase() === "cancelled" || order.orderStatus?.toLowerCase() === "canceled") && order.cancelReason && (
          <div className="mb-3 p-2 flex items-center gap-2 bg-[#fff5f5] border border-[#ffe3e3] rounded-lg text-[11.5px] text-[#c53030]">
            <i className="fa-solid fa-circle-info text-[#e53e3e]" />
            <span>
              <strong>Cancellation Reason:</strong> {order.cancelReason}
            </span>
          </div>
        )}

        {/* ── CARD BODY: Image + Info ── */}
        <div className="row align-items-start">
          {/* IMAGE */}
          <div className="col-sm-3 col-12 mb-3 mb-sm-0">
            <div
              onClick={() => onView(order)}
              className="relative cursor-pointer w-[72px] h-[72px] border border-[#eee] rounded-[10px] overflow-hidden bg-[#fafafa]"
            >
              <img
                src={resolveOrderImage(order)}
                className="w-full h-full object-contain"
                alt="Product"
                onError={(e) => {
                  e.currentTarget.src = "/medicine.jpg";
                }}
              />
              {order?.items?.length > 1 && (
                <div className="absolute bottom-0 left-0 right-0 bg-[#8059ca]/85 text-white text-[10px] font-bold text-center py-0.5">
                  +{order.items.length - 1} more
                </div>
              )}
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="col-sm-9 col-12">
            <div
              className="mb-2 cursor-pointer font-semibold text-[14px] text-[#222] text-capitalize"
              onClick={() => onView(order)}
            >
              {firstItem?.productSnapshot?.name ||
                firstItem?.productDetails?.tabletdetails?.name ||
                firstItem?.productDetails?.variantcurrentDetails?.productname ||
                firstItem?.packageDetails?.name ||
                "Not Available"}
            </div>

            <div className="row g-2">
              <div className="col-6">
                <div style={{ fontSize: "11px", color: "#aaa" }}>Payment</div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: order.paymentStatus === "paid" ? "#28a745" : "#e0a000",
                    textTransform: "capitalize",
                  }}
                >
                  {order.paymentStatus
                    ? order.paymentStatus.toLowerCase()
                    : "N/A"}
                </div>
              </div>
              <div className="col-6">
                <div style={{ fontSize: "11px", color: "#aaa" }}>Method</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: "#444", textTransform: "capitalize" }}>
                  {order.paymentmethod ? order.paymentmethod.toLowerCase() : "N/A"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER: Total Paid + Action Buttons ── */}
      <div className="flex flex-col align-items-sm-end justify-between mt-3 pt-2 border-t border-[#f8f8f8]">
        <div className="d-flex justify-content-between align-items-center w-100 mb-2">
          <div>
            <span style={{ fontSize: "11px", color: "#aaa" }}>Total Paid</span>
            <span className="text-[16px] font-bold text-[#7c4dc4] block">
              ₹{total != null ? Number(total).toFixed(2) : "0.00"}
            </span>
          </div>
          {order?.orderStatus !== "failed" && (
            <div className="flex gap-2 justify-end flex-wrap">
              {/* Details */}
              <button
                type="button"
                className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[12px] font-medium  min-w-fit whitespace-nowrap leading-tight text-primary border-1 border-dashed border-[#8059ca] transition-all duration-200 "
                onClick={() => onView(order)}
              >
                <i className="fa-solid fa-eye text-[12px] w-3.5 text-center shrink-0" /> Details
              </button>

              {/* Report download */}
              {firstItem?.reportfile && (
                <a
                  href={firstItem.reportfile}
                  download={`Report_${order._id}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 !rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                >
                  <i className="fas fa-file-medical text-[12px] w-3.5 text-center shrink-0" /> Report
                </a>
              )}

              {/* Invoice */}
              {order?.paymentStatus !== "pending" &&
                order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && order?.orderStatus !== "returned" && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 !rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                    onClick={() => onInvoice(order)}
                  >
                    <i className="fa-solid fa-file-invoice text-[12px] w-3.5 text-center shrink-0" /> Invoice
                  </button>
                )}

              {(!order?.isRated) && order?.paymentStatus !== "pending" &&
                order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && order?.orderStatus !== "returned" && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 !rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                    onClick={() => onReview(order)}
                  >
                    <i className="fa-solid fa-star text-[12px] w-3.5 text-center shrink-0" /> Review
                  </button>
                )}

              {/* Report Issue */}
              {!order?.isRaiseTicket && order?.paymentStatus !== "pending" && order?.paymentStatus !== "refunded" &&
                order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && (
                  <button
                    type="button"
                    className="inline-flex items-center justify-center gap-1.5 !rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                    onClick={() => onReportIssue(order)}
                  >
                    <i className="fas fa-headset text-[12px] w-3.5 text-center shrink-0" /> Report
                  </button>
                )}

              {/* Cancel Order */}
              {!["completed", "delivered", "cancelled", "canceled", "failed", "returned"].includes(order.orderStatus?.toLowerCase()) && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 bg-danger !rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight border border-[#dc3545] text-[#dc3545] bg-white transition-all duration-200 no-underline shadow-none hover:bg-[#dc3545] hover:text-white hover:border-[#dc3545] focus:bg-[#dc3545] focus:text-white focus:border-[#dc3545]"
                  onClick={() => onCancel(order)}
                >
                  <i className="fa-solid fa-ban text-[12px] w-3.5 text-center shrink-0" /> Cancel Order
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartOrderCard;
