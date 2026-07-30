import React from "react";

/**
 * AppointmentOrderCard
 *
 * Reusable card component for displaying a single appointment order.
 */
const AppointmentOrderCard = ({
  order,
  onView,
  onInvoice,
  onReschedule,
  onReview,
  onReportIssue,
  resolveOrderImage,
  getOrderVendors,
  getOrderStatusMeta,
  selectedFilterTab
}) => {
  const getOrderItems = (order) => {
    if (Array.isArray(order?.items) && order.items.length > 0) {
      return order.items;
    }
    if (Array.isArray(order?.groupDetails)) {
      return order.groupDetails.flatMap((group) => group.items || []);
    }
    return [];
  };

  const orderItems = getOrderItems(order);
  const firstItem = orderItems[0];
  const statusMeta = getOrderStatusMeta(order.orderStatus);
  const allVendors = getOrderVendors(order);

  // Map state badge classes to Tailwind classes
  const badgeColorsMap = {
    delivered: "bg-[#d7f5e8] text-[#00a86b]",
    confirmed: "bg-[#e8f4fd] text-[#0d6efd]",
    cancelled: "bg-[#ffe0e0] text-[#dc3545]",
    failed: "bg-[#f8d7da] text-[#842029]",
    "sample-collected": "bg-[#f3effa] text-[#8059ca]",
    "sample-not-collected": "bg-[#fef3c7] text-[#92400e]",
    processing: "bg-[#ffe9d6] text-[#ff7a00]",
    "in-progress": "bg-[#ffe9d6] text-[#ff7a00]"
  };

  const badgeColorClasses = badgeColorsMap[statusMeta.badgeClass] || "bg-[#ffe9d6] text-[#ff7a00]";

  return (
    <div className="bg-white rounded-[10px] p-[12px_14px] shadow-[0_2px_12px_rgba(128,89,202,0.05)] mb-4 transition-all duration-300 border border-[#f0edf7] h-full hover:shadow-[0_6px_18px_rgba(128,89,202,0.12)] hover:-translate-y-[1px] flex flex-col justify-between">
      <div>
        {/* ── HEADER: Order ID + Date + Appointment slot ── */}
        <div className="flex flex-col md:flex-row justify-between items-start gap-2.5 border-b border-[#eee] pb-2 mb-2.5 overflow-visible">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="font-semibold text-[13px] text-[#333]">
                #{order.orderId}
              </div>
            </div>
            <div className="text-[12px] text-[#888]">
              Booked at{" "}
              {new Date(order.createdAt).toLocaleDateString("en-US", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            {/* Appointment date/time pill */}
            {order?.selectedDate && order?.selectedTimeSlot && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (selectedFilterTab !== "upcoming" || order?.isRescheduled || order?.orderStatus === "completed" || order?.orderStatus === "sample_collected") return;
                  onReschedule(order);
                }}
                className={`bg-[#f5f3ff] p-[6px_10px] rounded-md border border-dashed border-[#8059ca] text-left flex flex-col items-start transition-colors duration-200 ${order?.isRescheduled ? "cursor-default" : "cursor-pointer"
                  }`}
                title={order?.isRescheduled ? "" : "Click to reschedule"}
              >
                <span className="text-[10px] color-[#8059ca] font-semibold flex items-center gap-1">
                  <i className="fa-solid fa-calendar-days text-[#8059ca]" />
                  Appointment:
                </span>
                <div className="text-[11px] font-semibold text-[#333] mt-0.5 whitespace-nowrap">
                  {(() => {
                    try {
                      const d = new Date(order.selectedDate);
                      return isNaN(d.getTime())
                        ? order.selectedDate
                        : `${d.getUTCFullYear()}-${String(
                          d.getUTCMonth() + 1,
                        ).padStart(2, "0")}-${String(d.getUTCDate()).padStart(
                          2,
                          "0",
                        )}`;
                    } catch {
                      return order.selectedDate;
                    }
                  })()}{" "}
                  at {order.selectedTimeSlot}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── BODY: Image + Details ── */}
        <div className="flex align-items-start gap-3 flex-sm-nowrap flex-wrap">
          {/* Product image */}
          <div
            onClick={() => onView(order)}
            className="relative cursor-pointer inline-block shrink-0 mb-2.5"
          >
            <img
              src={resolveOrderImage(order)}
              className="w-[70px] h-[70px] object-contain"
              alt="Product"
              onError={(e) => {
                e.currentTarget.src = "/medicine.jpg";
              }}
            />
            {orderItems.length > 1 && (
              <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[#8059ca] text-[12px] font-semibold underline whitespace-nowrap">
                +{orderItems.length - 1} more items
              </div>
            )}
          </div>

          {/* Product details */}
          <div className="min-w-0 flex-1 w-full">
            <div
              className="text-capitalize font-semibold text-[13px] mb-2 cursor-pointer"
              onClick={() => onView(order)}
            >
              {firstItem?.productSnapshot?.name ||
                firstItem?.productSnapshot?.productDetails?.tabletDetails
                  ?.name ||
                firstItem?.productDetails?.variantcurrentDetails?.productname ||
                firstItem?.packageDetails?.name ||
                "Not Available"}
            </div>

            <div className="row mt-2">
              <div className="col-4">
                <div className="text-[12px] text-[#777]">
                  Payment Status:
                </div>
                <div
                  className="text-capitalize text-[12px] font-semibold"
                  style={{
                    color:
                      order.paymentStatus === "paid" ? "#28a745" : "#ffc107",
                  }}
                >
                  {order.paymentStatus
                    ? order.paymentStatus.toLowerCase()
                    : "N/A"}
                </div>
              </div>
              <div className="col-4">
                <div className="text-[12px] text-[#777]">
                  Payment Method:
                </div>
                <div className="text-capitalize text-[12px] font-semibold">
                  {order.paymentmethod
                    ? order.paymentmethod.toLowerCase()
                    : "N/A"}
                </div>
              </div>
              <div className="col-4">
                <div className="text-[12px] text-[#777]">
                  Appointment Status:
                </div>
                <div className="text-[12px]">
                  <span className={`inline-flex items-center justify-center shrink-0 text-[11px] leading-[1.35] py-[3px] px-2 rounded-[20px] font-medium whitespace-nowrap overflow-visible md:self-auto self-start ${badgeColorClasses}`}>
                    {statusMeta.label || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER: Amount + Action Buttons ── */}
      <div className="col-12 flex flex-wrap items-center justify-between gap-2 mt-2">
        <div>
          <span className="text-[12px] text-[#777] mr-1.5">
            Amount:
          </span>
          <span className="text-[16px] font-bold">
            ₹{order.billingSummary.subtotal?.toFixed(2) || "0.00"}
          </span>
        </div>

        {order?.orderStatus !== "failed" && (
          <div className="flex flex-wrap gap-2">
            {/* View Details */}
            <button
              type="button"
              className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
              onClick={() => onView(order)}
            >
              <i className="fas fa-eye text-[12px] w-3.5 text-center shrink-0" />
              View Details
            </button>

            {/* Medical report download */}
            {firstItem?.reportfile && (
              <a
                href={firstItem.reportfile}
                download={`Report_${order.orderId}.pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
              >
                <i className="fas fa-file-medical text-[12px] w-3.5 text-center shrink-0" />
                Report
              </a>
            )}

            {/* Invoice */}
            {order?.paymentStatus !== "pending" && order?.paymentStatus !== "failed" &&
              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                  onClick={() => onInvoice(order)}
                >
                  <i className="fas fa-receipt text-[12px] w-3.5 text-center shrink-0" />
                  Invoice
                </button>
              )}

            {/* Reschedule */}
            {order?.selectedDate &&
              !order?.isRescheduled &&
              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && selectedFilterTab === "upcoming" && order?.orderStatus !== "sample_collected" && order?.orderStatus !== "completed" && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                  onClick={() => onReschedule(order)}
                >
                  <i className="fas fa-calendar-check text-[12px] w-3.5 text-center shrink-0" />
                  Reschedule
                </button>
              )}

            {/* Review */}
            {
              order?.isRated === false && order?.paymentStatus !== "pending" &&
              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                  onClick={() => onReview(order)}
                >
                  <i className="fas fa-star text-[12px] w-3.5 text-center shrink-0" />
                  Review
                </button>
              )}

            {/* Report Issue */}
            {!order?.isRaiseTicket && order?.paymentStatus !== "pending" &&
              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && order?.orderStatus !== "completed" && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                  onClick={() => onReportIssue(order)}
                >
                  <i className="fas fa-headset text-[12px] w-3.5 text-center shrink-0" />
                  Report Issue
                </button>
              )}
          </div>
        )}
      </div>

      {/* ── VENDOR STRIP ── */}
      {allVendors?.length > 0 && (
        <div className="mt-2 p-2 bg-[#faf9fe] border border-[#f1eff9] rounded-lg text-[11px]">
          {allVendors.map((vendor, idx) => (
            <div
              key={vendor.vendorId || vendor.name || idx}
              className={`flex items-center justify-between flex-wrap gap-2 ${idx < allVendors.length - 1 ? "border-b border-[#f1eff9] pb-1.5 mb-1.5" : ""
                }`}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <img
                  src={vendor.imageUrl}
                  alt={vendor.name}
                  className="w-[22px] h-[22px] rounded-full object-cover border border-[#e1dcf5] shrink-0"
                  onError={(e) => {
                    e.currentTarget.src = "/medicine.jpg";
                  }}
                />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-[#4f358a] text-[11.5px] capitalize">
                    {vendor.name}
                  </div>
                  {vendor.address && (
                    <div
                      className="text-muted text-[10.5px] truncate w-full"
                      title={vendor.address}
                    >
                      <i className="fa-solid fa-location-dot mr-1 text-[#a088d8]" />
                      {vendor.address}
                    </div>
                  )}
                </div>

                {/* Show Maps link */}
                {(vendor.location?.coordinates?.length === 2 || vendor.address) && (
                  <a
                    href={
                      vendor.location?.coordinates?.length === 2
                        ? `https://www.google.com/maps?q=${vendor.location.coordinates[1]},${vendor.location.coordinates[0]}`
                        : `https://www.google.com/maps?q=${encodeURIComponent(vendor.address)}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-decoration-none text-[10px] color-[#8059ca] font-semibold p-[2px_6px] border border-[#8059ca] rounded bg-white"
                  >
                    <i className="fa-solid fa-map-location-dot" />
                    Show Maps
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AppointmentOrderCard;
