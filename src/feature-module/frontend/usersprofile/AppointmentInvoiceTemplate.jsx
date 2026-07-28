import React, { forwardRef } from "react";

const AppointmentInvoiceTemplate = forwardRef(({ order }, ref) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getPatientName = (group) => {
    if (group.selectType === "self") {
      return order.userDetails
        ? `${order.userDetails.first_name || ""} ${order.userDetails.last_name || ""}`.trim() || "Self"
        : "Self";
    }
    if (group.selectType === "family") {
      return group.patientDetails?.name || "Family Member";
    }
    return "Patient";
  };

  // Pricing calculations from order
  const subtotal = order?.billingSummary?.subtotalWithoutTaxSampleCollectionAndDelivery || 0;
  console.log("sub total", subtotal)
  const cgst = order?.billingSummary?.cgst || 0;
  console.log("cgst", cgst)
  const sgst = order?.billingSummary?.sgst || 0;
  console.log("sgst", sgst)
  const discount = order?.discount || 0;
  console.log("discount", discount)
  const sampleCollection = order?.billingSummary?.sampleCollectionFee || 0;
  console.log("sampleCollection", sampleCollection)
  const total = order?.billingSummary?.total;
  console.log("total", total)

  return (
    <div
      ref={ref}
      data-invoice-template="true"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "13px",
        color: "#444",
        width: "790px",
        margin: "0 auto",
        padding: "30px",
        backgroundColor: "#fff",
        boxSizing: "border-box",
      }}
    >
      {/* HEADER SECTION */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "2px solid #8059ca",
          paddingBottom: "20px",
          marginBottom: "20px",
        }}
      >
        <div>
          <img
            src="/assets/img/logo.png"
            alt="Logo"
            style={{ width: "140px", height: "auto", marginBottom: "8px" }}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <div style={{ fontSize: "12px", color: "#666", lineHeight: "1.4" }}>
            <strong>Medicompares Pvt. Ltd.</strong><br />
            Support: support@medicompares.com<br />
            Website: www.medicompares.com
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <h2 style={{ margin: "0 0 8px 0", color: "#8059ca", fontWeight: "700", fontSize: "24px" }}>
            INVOICE
          </h2>
          <div style={{ fontSize: "13px", color: "#555", lineHeight: "1.5" }}>
            <strong>Invoice No:</strong> #{order?.orderId || "N/A"}<br />
            <strong>Date:</strong> {formatDate(order?.createdAt)}<br />
            <strong>Status:</strong> <span style={{
              backgroundColor: order?.paymentStatus === "paid" ? "#d7f5e8" : "#ffe9d6",
              color: order?.paymentStatus === "paid" ? "#00a86b" : "#ff7a00",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600"
            }}>{order?.paymentStatus ? order.paymentStatus.toUpperCase() : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* BILL TO & DOCTOR DETAILS */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginBottom: "25px",
        }}
      >
        {/* Customer Details */}
        <div
          style={{
            backgroundColor: "#fcfaff",
            border: "1px solid #e9ddff",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#8059ca", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Bill To (Account Holder)
          </h4>
          <div style={{ lineHeight: "1.6" }}>
            <strong>Name:</strong> <span style={{ textTransform: "capitalize" }}>{order?.userDetails?.first_name} {order?.userDetails?.last_name}</span><br />
            <strong>Mobile:</strong> {order?.userDetails?.phone || "N/A"}<br />
            <strong>Email:</strong> {order?.userDetails?.email || "N/A"}<br />
            <strong>Payment Method:</strong> {order?.paymentmethod ? order.paymentmethod.toUpperCase() : "N/A"}
          </div>
        </div>

        {/* Doctor Details */}
        <div
          style={{
            backgroundColor: "#fcfaff",
            border: "1px solid #e9ddff",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#8059ca", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Referred By
          </h4>
          <div style={{ lineHeight: "1.6" }}>
            <strong>Doctor Name:</strong> {order?.doctorName || "Self Referral"}<br />
            {order?.selectedDate && order?.selectedTimeSlot && (
              <>
                <strong>Appointment Date:</strong> {formatDate(order.selectedDate)}<br />
                <strong>Appointment Slot:</strong> {order.selectedTimeSlot}<br />
              </>
            )}
          </div>
        </div>
      </div>

      {/* FAMILY MEMBER WISE ITEMS */}
      <div style={{ marginBottom: "25px" }}>
        <h4 style={{ margin: "0 0 15px 0", color: "#8059ca", fontSize: "15px", fontWeight: "700", textTransform: "uppercase", borderBottom: "1px solid #e9ddff", paddingBottom: "5px" }}>
          Patient & Test Details
        </h4>

        {order?.groupDetails?.length > 0 && order?.groupDetails?.map((group, groupIndex) => {
          const patientName = getPatientName(group);
          const relationship = group.patientDetails?.relationship || (group.selectType === "self" ? "Self" : "Family");
          const items = group.items || [];

          return (
            <div key={group._id || groupIndex} style={{ marginBottom: "20px", border: "1px solid #efe7ff", borderRadius: "10px", overflow: "hidden" }}>
              {/* Member Header */}
              <div
                style={{
                  backgroundColor: "#f5f0ff",
                  borderBottom: "1px solid #dcd3ff",
                  padding: "10px 15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "700", color: "#6d28d9", fontSize: "13.5px" }}>
                  Patient {groupIndex + 1}: {patientName} ({relationship})
                </span>
                {group.totalTests != null && (
                  <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#8059ca", background: "#fff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #dcd3ff" }}>
                    {group.totalTests} Test{group.totalTests !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {/* Member Items Table */}
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#8059ca", color: "#fff" }}>
                    <th style={{ padding: "8px 12px", textAlign: "center", width: "50px", fontSize: "12px", fontWeight: "600" }}>S.No</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", fontWeight: "600" }}>Test / Package Name</th>
                    <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", fontWeight: "600" }}>Provider</th>
                    <th style={{ padding: "8px 12px", textAlign: "right", width: "120px", fontSize: "12px", fontWeight: "600" }}>Price (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => {
                    const testName =
                      item?.packageDetails?.name ||
                      item?.productSnapshot?.name ||
                      item?.productDetails?.tabletDetails?.name ||
                      item?.productSnapshot?.tabletDetails?.name ||
                      item?.productSnapshot?.variantcurrentDetails?.productname ||
                      "N/A";

                    const vendorName =
                      item?.packageDetails?.vendorDetails?.[0]?.name ||
                      item?.productSnapshot?.vendorDetails?.[0]?.name ||
                      "N/A";

                    const price =
                      item?.discountprice ||
                      item?.packageDetails?.discountprice ||
                      item?.productDetails?.price ||
                      item?.price ||
                      0;

                    return (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fdfaff", borderBottom: "1px solid #efe7ff" }}>
                        <td style={{ padding: "8px 12px", textAlign: "center", fontSize: "12px" }}>{index + 1}</td>
                        <td style={{ padding: "8px 12px", fontSize: "12px", fontWeight: "600", color: "#333" }}>{testName}</td>
                        <td style={{ padding: "8px 12px", fontSize: "12px", color: "#666" }}>{vendorName}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#444" }}>{price.toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })}




        <div style={{ marginBottom: "20px", border: "1px solid #efe7ff", borderRadius: "10px", overflow: "hidden" }}>
          {/* Member Header */}
          {/* <div
                style={{
                  backgroundColor: "#f5f0ff",
                  borderBottom: "1px solid #dcd3ff",
                  padding: "10px 15px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "700", color: "#6d28d9", fontSize: "13.5px" }}>
                  Patient {groupIndex + 1}: {patientName} ({relationship})
                </span>
                {group.totalTests != null && (
                  <span style={{ fontSize: "11.5px", fontWeight: "600", color: "#8059ca", background: "#fff", padding: "2px 8px", borderRadius: "6px", border: "1px solid #dcd3ff" }}>
                    {group.totalTests} Test{group.totalTests !== 1 ? "s" : ""}
                  </span>
                )}
              </div> */}

          {/* Member Items Table */}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#8059ca", color: "#fff" }}>
                {/* <th style={{ padding: "8px 12px", textAlign: "center", width: "50px", fontSize: "12px", fontWeight: "600" }}>S.No</th> */}
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", fontWeight: "600" }}>Test / Package Name</th>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", fontWeight: "600" }}>Provider</th>
                <th style={{ padding: "8px 12px", textAlign: "right", width: "120px", fontSize: "12px", fontWeight: "600" }}>Price (₹)</th>
              </tr>
            </thead>
            <tbody>
              {order?.items?.length > 0 && order?.items?.map((item, groupIndex) => {


                const testName =
                  item?.packageDetails?.name ||
                  item?.productSnapshot?.name ||
                  item?.productDetails?.tabletDetails?.name ||
                  item?.productSnapshot?.tabletDetails?.name ||
                  item?.productSnapshot?.variantcurrentDetails?.productname ||
                  "N/A";

                const vendorName =
                  item?.packageDetails?.vendorDetails?.[0]?.name ||
                  item?.productSnapshot?.vendorDetails?.[0]?.name ||
                  "N/A";

                const price =
                  item?.discountprice ||
                  item?.packageDetails?.discountprice ||
                  item?.productDetails?.price ||
                  item?.productSnapshot?.price ||
                  0;

                return (
                  <tr key={groupIndex} style={{ backgroundColor: "#fdfaff", borderBottom: "1px solid #efe7ff" }}>
                    {/* <td style={{ padding: "8px 12px", textAlign: "center", fontSize: "12px" }}>{groupIndex + }</td> */}
                    <td style={{ padding: "8px 12px", fontSize: "12px", fontWeight: "600", color: "#333" }}>{testName}</td>
                    <td style={{ padding: "8px 12px", fontSize: "12px", color: "#666" }}>{vendorName}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontSize: "12px", fontWeight: "700", color: "#444" }}>{(subtotal || 0).toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

      {/* PRICING BREAKDOWN */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
        <table style={{ width: "320px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>Subtotal</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(subtotal || 0).toFixed(2)}</td>
            </tr>
            {sampleCollection > 0 && (
              <tr>
                <td style={{ padding: "6px 10px", color: "#666" }}>Sample Collection Fee</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(sampleCollection || 0).toFixed(2)}</td>
              </tr>
            )}
            <tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>CGST (4%)</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(cgst || 0).toFixed(2)}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>SGST (14%)</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(sgst || 0).toFixed(2)}</td>
            </tr>
            {discount > 0 && (
              <tr>
                <td style={{ padding: "6px 10px", color: "#28a745" }}>Discount</td>
                <td style={{ padding: "6px 10px", textAlign: "right", color: "#28a745", fontWeight: "500" }}>-₹{(discount || 0).toFixed(2)}</td>
              </tr>
            )}
            <tr style={{ borderTop: "2px solid #8059ca", borderBottom: "2px solid #8059ca" }}>
              <td style={{ padding: "10px", fontWeight: "700", fontSize: "15px", color: "#8059ca" }}>Grand Total</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: "700", fontSize: "15px", color: "#8059ca" }}>₹{(total || 0).toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div style={{ marginTop: "40px", borderTop: "1px solid #eaeaea", paddingTop: "15px", textAlign: "center", fontSize: "11px", color: "#999" }}>
        This is a computer generated invoice. For any inquiries, please contact our support desk. Thank you for choosing Medicompares!
      </div>
    </div>
  );
});

export default AppointmentInvoiceTemplate;
