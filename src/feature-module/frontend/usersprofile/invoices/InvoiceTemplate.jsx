import React, { forwardRef } from "react";

const InvoiceTemplate = forwardRef(({ order, vendor }, ref) => {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const resolveItemVendor = (item) => {
    const packageVendorDetails = item?.packageDetails?.vendorDetails;
    const productVendorDetails = item?.productDetails?.vendorDetails;
    const snapshotVendorDetails = item?.productSnapshot?.vendorDetails;
    const rawVendorDetails =
      (Array.isArray(packageVendorDetails) && packageVendorDetails.length > 0
        ? packageVendorDetails[0]
        : packageVendorDetails && typeof packageVendorDetails === "object"
          ? packageVendorDetails
          : null) ||
      (Array.isArray(productVendorDetails) && productVendorDetails.length > 0
        ? productVendorDetails[0]
        : productVendorDetails && typeof productVendorDetails === "object"
          ? productVendorDetails
          : null) ||
      (Array.isArray(snapshotVendorDetails) && snapshotVendorDetails.length > 0
        ? snapshotVendorDetails[0]
        : snapshotVendorDetails && typeof snapshotVendorDetails === "object"
          ? snapshotVendorDetails
          : null) ||
      (item?.vendorDetails && typeof item.vendorDetails === "object"
        ? item.vendorDetails
        : null);

    if (!rawVendorDetails) return null;

    const vendorDetails = rawVendorDetails;

    const rawImage = Array.isArray(vendorDetails.bussiness_image)
      ? vendorDetails.bussiness_image[0]?.url
      : vendorDetails.bussiness_image?.url;

    return {
      vendorId: vendorDetails.vendorId || vendorDetails._id,
      name: vendorDetails.name || vendorDetails.bussiness_name || "N/A",
      address: vendorDetails.address || vendorDetails.bussiness_address || "",
      phone: vendorDetails.phone || vendorDetails.bussiness_mobile || "",
      email: vendorDetails.email || vendorDetails.bussiness_email || "",
    };
  };

  // Group all items by vendor
  const groupedItems = {};
  (order?.items || []).forEach((item) => {
    const itemVendor = resolveItemVendor(item) || { name: "Other Providers" };
    const key = String(itemVendor.vendorId || itemVendor.name);
    if (!groupedItems[key]) {
      groupedItems[key] = {
        vendorDetails: itemVendor,
        items: [],
      };
    }
    groupedItems[key].items.push(item);
  });

  // Determine active group keys based on filter
  const activeGroupKeys = vendor
    ? [String(vendor.vendorId || vendor.name)].filter(k => groupedItems[k])
    : Object.keys(groupedItems);

  // Pricing calculations
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let gst = 0;
  let igst = 0;
  let discount = 0;
  let sampleCollection = 0;
  let deliveryFee = 0;
  let totalGst = 0;
  let wallet = 0;

  if (vendor) {
    // Single Vendor Calculations
    const items = groupedItems[String(vendor.vendorId || vendor.name)]?.items || [];
    subtotal = items.reduce((sum, item) => {
      const price =
        item?.discountprice ||
        item?.productDetails?.variantDetails?.[0]?.discountprice ||
        item?.packageDetails?.discountprice ||
        item?.price ||
        item?.productDetails?.variantDetails?.[0]?.price ||
        item?.productDetails?.price ||
        item?.packageDetails?.price ||
        0;
      return sum + (price * (item?.quantity || 0));
    }, 0);

    // cgst = subtotal * 0.04;
    // sgst = subtotal * 0.14;
    gst = subtotal * 0.14;
    igst = subtotal * 0.14;
    discount = order?.discount ? (order.discount * (subtotal / (order.subtotal || 1))) : 0;

    sampleCollection = items.some(item => item?.packageDetails) ? (order?.samplecollection || order?.billingSummary?.sampleCollectionCharges || 0) : 0;
    deliveryFee = items.some(item => !item?.packageDetails) ? (order?.shipping || order?.billingSummary?.deliveryCharges || 0) : 0;
  } else {
    // Combined Order Calculations
    const bs = order?.billingSummary || {};
    subtotal = bs.subtotal ?? order?.subtotal ?? 0;
    cgst = Number(bs.cgst ?? order?.cgst ?? 0);
    sgst = Number(bs.sgst ?? order?.sgst ?? 0);
    gst = Number(bs.totalGst ?? order?.tax ?? 0);
    igst = Number(bs.totalIgst ?? 0);
    discount = Number(bs.couponAmount ?? order?.couponAmount ?? 0);
    sampleCollection = Number(bs.sampleCollection ?? order?.samplecollection ?? 0);
    deliveryFee = Number(bs.deliveryCharge ?? order?.shipping ?? 0);
    totalGst = Number(bs.totalGst ?? order?.tax ?? 0);
    wallet = Number(bs.walletAmount ?? order?.walletAmount ?? 0);
  }

  const total = vendor
    ? (subtotal + deliveryFee + sampleCollection - discount)
    : Number(order?.billingSummary?.total ?? order?.total ?? 0);

  // Header vendor display - if no vendor filter is passed but all items belong to a single vendor, show that vendor.
  const uniqueVendorKeys = Object.keys(groupedItems);
  const isSingleVendor = uniqueVendorKeys.length === 1;
  const singleVendorDetails = isSingleVendor ? groupedItems[uniqueVendorKeys[0]].vendorDetails : null;
  const currentVendor = vendor || (isSingleVendor && singleVendorDetails?.name !== "Other Providers" ? singleVendorDetails : null);


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
          <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.5" }}>
            <strong>ORU HEALTHCARE PVT LTD.</strong><br />
            Support: info@medicompares.com<br />
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
              // backgroundColor: order?.paymentStatus === "paid" ? "#d7f5e8" : "#ffe9d6",
              // color: order?.paymentStatus === "paid" ? "#00a86b" : "#ff7a00",
              padding: "2px 8px",
              borderRadius: "4px",
              fontSize: "11px",
              fontWeight: "600"
            }}>{order?.paymentStatus ? order.paymentStatus.toUpperCase() : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* BILL TO & PROVIDER INFO */}
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
            Bill To (Patient)
          </h4>
          <div style={{ lineHeight: "1.6" }}>
            <strong>Name:</strong> <span style={{ textTransform: "capitalize" }}>{order?.userDetails?.first_name} {order?.userDetails?.last_name}</span><br />
            <strong>Mobile:</strong> {order?.userDetails?.phone || "N/A"}<br />
            <strong>Email:</strong> {order?.userDetails?.email || "N/A"}<br />
            {Array.isArray(order?.familyDetails) && order.familyDetails.length > 0 && (
              <>
                <strong>Patient Name:</strong> <span style={{ textTransform: "capitalize" }}>{order.familyDetails[0]?.name}</span><br />
              </>
            )}
            <strong>Payment Method:</strong> <span style={{ textTransform: "capitalize" }}>{order?.paymentmethod ? order.paymentmethod.toLowerCase() : "N/A"}</span>
          </div>
        </div>

        {/* Vendor Details */}
        <div
          style={{
            backgroundColor: "#fcfaff",
            border: "1px solid #e9ddff",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h4 style={{ margin: "0 0 10px 0", color: "#8059ca", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Service Provider / Vendor
          </h4>
          {currentVendor ? (
            <div style={{ lineHeight: "1.6" }}>
              <strong>Name:</strong> <span style={{ textTransform: "capitalize" }}>{currentVendor.name}</span><br />
              {/* {currentVendor.address && (
                <>
                  <strong>Address:</strong> {currentVendor.address}<br />
                </>
              )} */}
              {/* {currentVendor.phone && (
                <>
                  <strong>Mobile:</strong> {currentVendor.phone}<br />
                </>
              )}
              {currentVendor.email && (
                <>
                  <strong>Email:</strong> {currentVendor.email}<br />
                </>
              )} */}
            </div>
          ) : (
            <div style={{ lineHeight: "1.6" }}>
              <strong>Multiple Providers</strong><br />
              <span style={{ fontSize: "12px", color: "#666" }}>
                This invoice includes services from multiple providers listed below.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ITEMS TABLE GROUPED BY VENDOR */}
      <div style={{ marginBottom: "25px" }}>
        {activeGroupKeys.map((groupKey) => {
          const group = groupedItems[groupKey];
          if (!group) return null;
          const groupVendor = group.vendorDetails;

          // Calculate subtotal for this vendor group
          const groupSubtotal = group.items.reduce((sum, item) => {
            const price =
              item?.billingSummary?.unitPrice ||
              item?.discountprice ||
              item?.productDetails?.variantDetails?.[0]?.discountprice ||
              item?.packageDetails?.discountprice ||
              item?.price ||
              item?.productDetails?.variantDetails?.[0]?.price ||
              item?.productDetails?.price ||
              item?.packageDetails?.price ||
              0;
            return sum + (price * (item?.quantity || 0));
          }, 0);

          return (
            <div key={groupKey} className="invoice-patient-card" style={{ marginBottom: "20px", pageBreakInside: "avoid", breakInside: "avoid" }}>
              {/* Group Vendor Header */}
              <div
                style={{
                  backgroundColor: "#f5f0ff",
                  border: "1px solid #dcd3ff",
                  borderBottom: "none",
                  borderRadius: "8px 8px 0 0",
                  padding: "8px 12px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "700", color: "#8059ca", fontSize: "13px" }}>
                  PROVIDER: {groupVendor?.name || "Other Provider"}
                </span>
                {groupVendor?.phone && (
                  <span style={{ fontSize: "11px", color: "#666" }}>
                    Tel: {groupVendor.phone}
                  </span>
                )}
              </div>

              {/* Group Items Table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "1px solid #dcd3ff",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#8059ca", color: "#fff" }}>
                    <th style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #8059ca", width: "40px", fontSize: "12px", fontWeight: "600" }}>S.No</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #8059ca", fontSize: "12px", fontWeight: "600" }}>Description / Item Name</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", border: "1px solid #8059ca", width: "130px", fontSize: "12px", fontWeight: "600" }}>Provider</th>
                    <th style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #8059ca", width: "70px", fontSize: "12px", fontWeight: "600" }}>Qty</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #8059ca", width: "110px", fontSize: "12px", fontWeight: "600" }}>Unit Price (₹)</th>
                    <th style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #8059ca", width: "110px", fontSize: "12px", fontWeight: "600" }}>Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, index) => {
                    const productName =
                      item?.productDetails?.variantcurrentDetails?.productname ||
                      item?.productSnapshot?.name ||
                      item?.productDetails?.tabletdetails?.name ||
                      item?.packageDetails?.name ||
                      "N/A";
                    const variantName =
                      item?.productDetails?.variantcurrentDetails?.name || "";
                    const quantity = item?.quantity || 0;
                    const itemProvider =
                      resolveItemVendor(item)?.name ||
                      groupVendor?.name ||
                      item?.packageDetails?.vendorDetails?.[0]?.name ||
                      item?.productSnapshot?.vendorDetails?.[0]?.name ||
                      item?.productDetails?.vendorDetails?.[0]?.name ||
                      "N/A";

                    const price =
                      item?.billingSummary?.unitPrice ||
                      item?.discountprice ||
                      item?.productDetails?.variantDetails?.[0]?.discountprice ||
                      item?.packageDetails?.discountprice ||
                      item?.price ||
                      item?.productDetails?.variantDetails?.[0]?.price ||
                      item?.productDetails?.price ||
                      item?.packageDetails?.price ||

                      0;

                    const itemTotal = price * quantity;

                    return (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fbf9ff" }}>
                        <td style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #eaeaea", fontSize: "12px" }}>{index + 1}</td>
                        <td style={{ padding: "8px 10px", border: "1px solid #eaeaea", fontSize: "12px" }}>
                          <div style={{ fontWeight: "600", color: "#333" }}>{productName}</div>
                          {variantName && <div style={{ fontSize: "11px", color: "#666", marginTop: "2px" }}>Variant: {variantName}</div>}
                        </td>
                        <td style={{ padding: "8px 10px", border: "1px solid #eaeaea", fontSize: "12px", color: "#444" }}>{itemProvider}</td>
                        <td style={{ padding: "8px 10px", textAlign: "center", border: "1px solid #eaeaea", fontSize: "12px" }}>{quantity}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px" }}>{(price || 0).toFixed(2)}</td>
                        <td style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px" }}>{(itemTotal || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {/* Vendor Specific Group Subtotal Row (only displayed on combined invoices) */}
                  {!vendor && (
                    <tr style={{ backgroundColor: "#faf8ff", fontWeight: "600" }}>
                      <td colSpan="4" style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px", color: "#555" }}>
                        Subtotal for {groupVendor?.name || "this provider"}:
                      </td>
                      <td style={{ padding: "8px 10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px", color: "#8059ca" }}>
                        ₹{(groupSubtotal || 0).toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* RENTAL DETAILS (IF APPLICABLE) */}
      {order?.orderType === "rental" && (
        <div style={{ marginBottom: "25px", border: "1px solid #e9ddff", borderRadius: "8px", overflow: "hidden" }}>
          <div style={{ backgroundColor: "#f5f0ff", padding: "8px 15px", fontWeight: "700", color: "#8059ca" }}>
            Rental Agreement Details
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {order?.startDate && (
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 15px", fontWeight: "600" }}>Rental Start Date</td>
                  <td style={{ padding: "8px 15px", textAlign: "right" }}>{formatDate(order.startDate)}</td>
                </tr>
              )}
              {order?.endDate && (
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 15px", fontWeight: "600" }}>Rental End Date</td>
                  <td style={{ padding: "8px 15px", textAlign: "right" }}>{formatDate(order.endDate)}</td>
                </tr>
              )}
              {order?.rentalPlan && (
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 15px", fontWeight: "600" }}>Rental Plan</td>
                  <td style={{ padding: "8px 15px", textAlign: "right", textTransform: "capitalize" }}>{order.rentalPlan}</td>
                </tr>
              )}
              {order?.fixedDeposit > 0 && (
                <tr style={{ borderBottom: "1px solid #f0f0f0" }}>
                  <td style={{ padding: "8px 15px", fontWeight: "600" }}>Refundable Deposit</td>
                  <td style={{ padding: "8px 15px", textAlign: "right" }}>₹{order.fixedDeposit.toFixed(2)}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* PRICING BREAKDOWN */}
      <div data-invoice-billing-summary style={{ display: "flex", justifyContent: "flex-end", pageBreakInside: "avoid", breakInside: "avoid" }}>
        <table style={{ width: "320px", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>Subtotal(Inclusive all Taxes)</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(subtotal || 0).toFixed(2)}</td>
            </tr>
            {sampleCollection > 0 && (
              <tr>
                <td style={{ padding: "6px 10px", color: "#666" }}>Sample Collection Fee</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(sampleCollection || 0).toFixed(2)}</td>
              </tr>
            )}
            {deliveryFee > 0 && (
              <tr>
                <td style={{ padding: "6px 10px", color: "#666" }}>Delivery Charges</td>
                <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(deliveryFee || 0).toFixed(2)}</td>
              </tr>
            )}
            {(gst > 0) && (<tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>GST</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(gst || 0).toFixed(2)}</td>
            </tr>)}
            {(igst > 0) && (<tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>IGST</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(igst || 0).toFixed(2)}</td>
            </tr>)}
            {(cgst > 0) && (<tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>CGST</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(cgst || 0).toFixed(2)}</td>
            </tr>)}
            {(sgst > 0) && (<tr>
              <td style={{ padding: "6px 10px", color: "#666" }}>SGST</td>
              <td style={{ padding: "6px 10px", textAlign: "right", fontWeight: "500" }}>₹{(sgst || 0).toFixed(2)}</td>
            </tr>)}
            {discount > 0 && (
              <tr>
                <td style={{ padding: "6px 10px", color: "#28a745" }}>Discount</td>
                <td style={{ padding: "6px 10px", textAlign: "right", color: "#28a745", fontWeight: "500" }}>-₹{(discount || 0).toFixed(2)}</td>
              </tr>
            )}
            {wallet > 0 && (
              <tr>
                <td style={{ padding: "6px 10px", color: "#28a745" }}>Wallet Deduction</td>
                <td style={{ padding: "6px 10px", textAlign: "right", color: "#28a745", fontWeight: "500" }}>-₹{(wallet || 0).toFixed(2)}</td>
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

      {/* Promotional Second Page */}
      <div
        style={{
          pageBreakBefore: "always",
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          paddingBottom: "20px",
        }}
      >
        <img
          src="/assets/img/Invoice.png"
          className="rounded"
          alt="Second Page"
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
          }}
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
    </div>
  );
});

export default InvoiceTemplate;
