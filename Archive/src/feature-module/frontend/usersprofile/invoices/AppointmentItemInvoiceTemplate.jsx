import React, { forwardRef } from "react";

const AppointmentItemInvoiceTemplate = forwardRef(({ order }, ref) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getItemName = (item) => {
    return (
      item?.packageDetails?.name ||
      item?.productSnapshot?.name ||
      item?.productDetails?.tabletDetails?.name ||
      item?.productSnapshot?.tabletDetails?.name ||
      item?.productSnapshot?.variantcurrentDetails?.productname ||
      "N/A"
    );
  };

  const getVendorName = (item) => {
    return (
      item?.packageDetails?.vendorDetails?.[0]?.name ||
      item?.productSnapshot?.vendorDetails?.[0]?.name ||
      item?.productDetails?.vendorDetails?.[0]?.name ||
      "N/A"
    );
  };

  const getItemPrice = (item) => {
    return (
      item?.discountprice ||
      item?.packageDetails?.discountprice ||
      item?.productDetails?.price ||
      item?.price ||
      item?.productSnapshot?.price ||
      0
    );
  };

  const items = order?.items || [];
  const subtotal = order?.billingSummary?.subtotal ?? 0;
  const gst = order?.billingSummary?.totalGst ?? 0;
  const igst = order?.billingSummary?.totalIgst ?? 0;

  // const cgst = order?.billingSummary?.cgst ?? 0;
  // const sgst = order?.billingSummary?.sgst ?? 0;
  const discount = order?.billingSummary?.couponAmount ?? order?.discount ?? 0;
  const sampleCollection = order?.billingSummary?.deliveryCharge ?? order?.billingSummary?.sampleCollectionFee ?? 0;
  const fixedDeposit = order?.billingSummary?.fixedDeposit ?? 0;
  const serviceCharges = order?.billingSummary?.serviceCharges ?? 0;
  const returnCharge = order?.billingSummary?.returnCharge ?? 0;
  const total = order?.billingSummary?.total ?? 0;
  const couponAmount = order?.billingSummary?.couponAmount || 0;
  const walletAmount = order?.billingSummary?.walletAmount || 0;

  return (
    <div
      ref={ref}
      data-invoice-template="true"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "13px",
        color: "#333",
        width: "790px",
        margin: "0 auto",
        padding: "30px",
        backgroundColor: "#fff",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "3px solid #8059ca",
          paddingBottom: "20px",
          marginBottom: "24px",
        }}
      >
        <div>
          <img
            src="/assets/img/logo.png"
            alt="Logo"
            style={{ width: "140px", height: "auto", marginBottom: "10px" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.5" }}>
            <strong>ORU HEALTHCARE PVT LTD.</strong><br />
            Support: info@medicompares.com<br />
            Website: www.medicompares.com
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: "0 0 8px", color: "#8059ca", fontWeight: "700", fontSize: "26px" }}>
            INVOICE
          </h2>
          <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.6" }}>
            <strong>Invoice No:</strong> #{order?.orderId || "N/A"}<br />
            <strong>Date:</strong> {formatDate(order?.createdAt)}<br />
            <strong>Status:</strong>{" "}
            <span style={{
              display: "inline-block",
              padding: "4px 10px",
              borderRadius: "999px",
              fontSize: "12px",
              fontWeight: "700",
            }}>
              {order?.paymentStatus ? order.paymentStatus.toUpperCase() : "N/A"}
            </span>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "24px",
          marginBottom: "22px",
        }}
      >
        <div style={{ border: "1px solid #e9ddff", borderRadius: "10px", padding: "16px", backgroundColor: "#fcfaff" }}>
          <h4 style={{ margin: "0 0 10px", color: "#8059ca", fontSize: "14px", letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Bill To
          </h4>
          <div style={{ lineHeight: "1.7", color: "#444" }}>
            <strong>Name:</strong> <span style={{ textTransform: "capitalize" }}>{order?.userDetails?.first_name || order?.userDetails?.name || "N/A"}</span><br />
            <strong>Mobile:</strong>{" "}{order?.userDetails?.phone || "N/A"}<br />
            <strong>Email:</strong>{" "}{order?.userDetails?.email || "N/A"}<br />
            <strong>Payment:</strong> <span style={{ textTransform: "capitalize" }}>{order?.paymentmethod ? String(order.paymentmethod).toLowerCase() : "N/A"}</span>
          </div>
        </div>

        <div style={{ border: "1px solid #e9ddff", borderRadius: "10px", padding: "16px", backgroundColor: "#fcfaff" }}>
          <h4 style={{ margin: "0 0 10px", color: "#8059ca", fontSize: "14px", letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Appointment Details
          </h4>
          <div style={{ lineHeight: "1.7", color: "#444" }}>
            <strong>Doctor:</strong> <span style={{ textTransform: "capitalize" }}>{order?.doctorName || "Self Referral"}</span><br />
            {order?.selectedDate && (
              <><strong>Date:</strong>{" "}{formatDate(order.selectedDate)}<br /></>
            )}
            {order?.selectedTimeSlot && (
              <><strong>Slot:</strong>{" "}{order.selectedTimeSlot}<br /></>
            )}
          </div>
        </div>
      </div>

      <div style={{ marginBottom: "26px", border: "1px solid #dcd3ff", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ backgroundColor: "#f5f0ff", padding: "12px 16px", fontWeight: "700", color: "#8059ca" }}>
          Item Wise Invoice Detail
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#8059ca", color: "#fff" }}>
              <th style={{ padding: "10px", textAlign: "center", width: "50px", fontSize: "12px", fontWeight: "600" }}>#</th>
              <th style={{ padding: "10px", textAlign: "left", fontSize: "12px", fontWeight: "600" }}>Service</th>
              <th style={{ padding: "10px", textAlign: "left", fontSize: "12px", fontWeight: "600" }}>Provider</th>
              <th style={{ padding: "10px", textAlign: "center", width: "80px", fontSize: "12px", fontWeight: "600" }}>Qty</th>
              <th style={{ padding: "10px", textAlign: "right", width: "110px", fontSize: "12px", fontWeight: "600" }}>Price</th>
              <th style={{ padding: "10px", textAlign: "right", width: "120px", fontSize: "12px", fontWeight: "600" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => {
              const name = getItemName(item);
              const vendor = getVendorName(item);
              const price = getItemPrice(item);
              const quantity = item?.quantity || 1;
              const itemTotal = price * quantity;

              return (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fbf9ff" }}>
                  <td style={{ padding: "10px", textAlign: "center", border: "1px solid #eaeaea", fontSize: "12px" }}>{index + 1}</td>
                  <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px", fontWeight: "600", color: "#111", textTransform: "capitalize" }}>{name}</td>
                  <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px", color: "#444", textTransform: "capitalize" }}>{vendor}</td>
                  <td style={{ padding: "10px", textAlign: "center", border: "1px solid #eaeaea", fontSize: "12px", color: "#444" }}>{quantity}</td>
                  <td style={{ padding: "10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px", fontWeight: "700", color: "#111" }}>₹{price.toFixed(2)}</td>
                  <td style={{ padding: "10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px", fontWeight: "700", color: "#111" }}>₹{itemTotal.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div data-invoice-billing-summary style={{ display: "flex", justifyContent: "flex-end" }}>
        <table style={{ width: "340px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "8px 10px", color: "#555" }}>Subtotal(Inclusive all Taxes)</td>
              <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>₹{((subtotal || 0)).toFixed(2)}</td>
            </tr>
            {sampleCollection > 0 && (
              <tr>
                <td style={{ padding: "8px 10px", color: "#555" }}>Sample Collection Fee</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}> + ₹{(sampleCollection || 0).toFixed(2)}</td>
              </tr>
            )}

            {(gst > 0) && (
              <tr>
                <td style={{ padding: "8px 10px", color: "#555" }}>GST</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>₹{(gst || 0).toFixed(2)}</td>
              </tr>
            )}

            {(igst > 0) && (
              <tr>
                <td style={{ padding: "8px 10px", color: "#555" }}>IGST</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>₹{(igst || 0).toFixed(2)}</td>
              </tr>
            )}

            {couponAmount > 0 && (
              <tr>
                <td style={{ padding: "8px 10px", color: "#047857" }}>Coupon Discount</td>
                <td style={{ padding: "8px 10px", textAlign: "right", color: "#047857", fontWeight: "700" }}>-₹{(couponAmount || 0).toFixed(2)}</td>
              </tr>
            )}
            {
              (walletAmount > 0) && (

                <tr>
                  <td style={{ padding: "8px 10px", color: "#555" }}>Wallet Deduction</td>
                  <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>- ₹{(walletAmount || 0).toFixed(2)}</td>
                </tr>
              )
            }
            <tr style={{ borderTop: "2px solid #8059ca", borderBottom: "2px solid #8059ca" }}>
              <td style={{ padding: "10px", fontWeight: "800", fontSize: "15px", color: "#8059ca" }}>Grand Total</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: "800", fontSize: "15px", color: "#8059ca" }}>₹{(total || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "36px", paddingTop: "18px", borderTop: "1px solid #e5e7eb", textAlign: "center", color: "#8b8b8b", fontSize: "11px" }}>
        This invoice is generated for item-wise appointment billing. Contact support for appointment or billing help.
      </div>
    </div>
  );
});

export default AppointmentItemInvoiceTemplate;
