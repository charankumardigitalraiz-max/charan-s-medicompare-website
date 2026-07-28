import React, { forwardRef } from "react";

const RentalInvoiceTemplate = forwardRef(({ order, vendor }, ref) => {
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
    const rawVendor =
      (item?.packageDetails?.vendorDetails && item.packageDetails.vendorDetails.length > 0
        ? item.packageDetails.vendorDetails[0]
        : null) ||
      (item?.productDetails?.vendorDetails && item.productDetails.vendorDetails.length > 0
        ? item.productDetails.vendorDetails[0]
        : null) ||
      item?.vendorDetails ||
      null;

    if (!rawVendor) return null;

    return {
      vendorId: rawVendor.vendorId || rawVendor._id || rawVendor.id,
      name: rawVendor.name || rawVendor.bussiness_name || "N/A",
      address: rawVendor.address || rawVendor.bussiness_address || "",
      phone: rawVendor.phone || rawVendor.bussiness_mobile || "",
      email: rawVendor.email || rawVendor.bussiness_email || "",
    };
  };

  const groupedItems = {};
  (order?.items || []).forEach((item) => {
    const itemVendor = resolveItemVendor(item) || { name: "Other Provider" };
    const key = String(itemVendor.vendorId || itemVendor.name);
    if (!groupedItems[key]) {
      groupedItems[key] = {
        vendorDetails: itemVendor,
        items: [],
      };
    }
    groupedItems[key].items.push(item);
  });

  const activeGroupKeys = vendor
    ? [String(vendor.vendorId || vendor.name)].filter((k) => groupedItems[k])
    : Object.keys(groupedItems);

  const calculateItemPrice = (item) => {
    return (
      item?.discountprice ||
      item?.rentalDetails?.totalAmount ||
      item?.productDetails?.variantDetails?.[0]?.discountprice ||
      item?.packageDetails?.discountprice ||
      item?.price ||
      item?.productDetails?.variantDetails?.[0]?.price ||
      item?.productDetails?.price ||
      item?.packageDetails?.price ||
      0
    );
  };

  const getItemName = (item) => {
    return (
      item?.rentalDetails?.productSnapshot?.name ||
      item?.rentalDetails?.productSnapshot?.tabletName ||
      item?.productDetails?.tabletdetails?.name ||
      item?.productDetails?.variantcurrentDetails?.productname ||
      item?.packageDetails?.name ||
      item?.productSnapshot?.name ||
      "Rental Item"
    );
  };

  // ---------------------------------------------------------------------
  // BILLING CALCULATION — mirrors the "Rental Details" modal exactly
  // ---------------------------------------------------------------------
  const bs = order?.billingSummary || {};
  const item0 = order?.items?.[0];
  const rentalDetails = item0?.rentalDetails || {};
  console.log(" Rental Details", rentalDetails);
  const subtotal = bs.subtotal ?? order?.subtotal ?? item0?.totalPrice ?? 0;
  // const cgst = bs.cgst ?? order?.cgst ?? 0;
  // const sgst = bs.sgst ?? order?.sgst ?? 0;
  const gst = bs.tax ?? 0
  const igst = bs.totalIgst ?? 0
  const totalTax = gst + igst;
  const baseRentalCharges = Math.max(0, subtotal - totalTax);

  const fixedDeposit = bs.fixedDeposit ?? order?.fixedDeposit ?? item0?.rentalDetails?.fixedDeposit ?? 0;
  const serviceCharges = bs.serviceCharges ?? order?.serviceCharges ?? item0?.rentalDetails?.serviceCharges ?? 0;
  const returnCharge = bs.returnCharge ?? order?.returnCharge ?? item0?.rentalDetails?.returnCharge ?? 0;
  const deliveryFee = bs.deliveryCharge ?? order?.deliveryFee ?? 0;

  const billingRows = [
    {
      label: "Rental Charges (Exclusive all Taxes)",
      value: subtotal,
      suffix: rentalDetails?.totalDays
        ? ` (${rentalDetails.totalDays} days × ₹${Number(rentalDetails?.basePricePerDay || 0).toFixed(2)})`
        : "",
    },
    { label: "Fixed Deposit (Refundable)", value: fixedDeposit, prefix: "+" },
    { label: "Service Charges", value: serviceCharges, prefix: "+" },
    { label: "Return Charges", value: returnCharge, prefix: "+" },
    { label: "Delivery Fee", value: deliveryFee, prefix: "+" },

    { label: "GST", value: gst },
    { label: "IGST", value: igst },
  ].filter((r) => Number(r.value) > 0);

  const coupon = Number(bs.couponAmount ?? order?.couponAmount ?? 0);
  const total = Number(bs.total ?? order?.billingSummary?.total ?? 0);
  const paidAmount = Number(bs?.paidAmount ?? 0);

  // Header vendor display - if no vendor filter is passed but all items belong to a single vendor, show that vendor.
  const uniqueVendorKeys = Object.keys(groupedItems);
  const isSingleVendor = uniqueVendorKeys.length === 1;
  const singleVendorDetails = isSingleVendor ? groupedItems[uniqueVendorKeys[0]].vendorDetails : null;
  const currentVendor = vendor || (isSingleVendor && singleVendorDetails?.name !== "Other Provider" ? singleVendorDetails : null);

  const installments = order?.installments || [];
  const installmentCount = order?.numberOfInstallments || installments.length || 0;
  const installmentAmount = Number(order?.installmentAmount || installments[0]?.amount || 0);

  return (
    <div
      ref={ref}
      data-invoice-template="true"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "13px",
        color: "#333",
        width: "780px",
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
          paddingBottom: "18px",
          marginBottom: "24px",
        }}
      >
        <div>
          <img
            src="/MediCompares_Logo.png"
            alt="Medicompares Logo"
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
            <strong>Date:</strong> {formatDate(order?.createdAt || order?.orderDate)}<br />
            <strong>Status:</strong>{" "}
            <span
              style={{
                display: "inline-block",
                padding: "4px 10px",
                borderRadius: "999px",
                fontSize: "12px",
                fontWeight: "700",
              }}
            >
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
        <div
          style={{
            border: "1px solid #e9ddff",
            borderRadius: "10px",
            padding: "16px",
            backgroundColor: "#fcfaff",
          }}
        >
          <h4 style={{ margin: "0 0 10px", color: "#8059ca", fontSize: "14px", letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Bill To Customer
          </h4>
          <div style={{ lineHeight: "1.7", color: "#444" }}>
            <strong>Name:</strong>{" "}
            <span style={{ textTransform: "capitalize" }}>{(order?.userDetails?.first_name || order?.userDetails?.name || "N/A")}</span>
            <br />
            <strong>Mobile:</strong>{" "}{order?.userDetails?.phone || "N/A"}<br />
            <strong>Email:</strong>{" "}{order?.userDetails?.email || "N/A"}<br />
            <strong>Payment:</strong> <span style={{ textTransform: "capitalize" }}>{order?.paymentmethod ? String(order.paymentmethod).toLowerCase() : "N/A"}</span>
          </div>
        </div>

        <div
          style={{
            border: "1px solid #e9ddff",
            borderRadius: "10px",
            padding: "16px",
            backgroundColor: "#fcfaff",
          }}
        >
          <h4 style={{ margin: "0 0 10px", color: "#8059ca", fontSize: "14px", letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Provider Details
          </h4>
          {currentVendor ? (
            <div style={{ lineHeight: "1.7", color: "#444" }}>
              <strong>Name:</strong> <span style={{ textTransform: "capitalize" }}>{currentVendor.name}</span><br />
              {currentVendor.address && (
                <><strong>Address:</strong>{" "}{currentVendor.address}<br /></>
              )}
              {/* {currentVendor.phone && (
                <><strong>Mobile:</strong>{" "}{currentVendor.phone}<br /></>
              )}
              {currentVendor.email && (
                <><strong>Email:</strong>{" "}{currentVendor.email}<br /></>
              )} */}
            </div>
          ) : (
            <div style={{ color: "#555", lineHeight: "1.7" }}>
              Multiple providers are included in this rental invoice.
            </div>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        {activeGroupKeys.map((groupKey) => {
          const group = groupedItems[groupKey];
          if (!group) return null;
          const groupVendor = group.vendorDetails;
          const groupSubtotal = group.items.reduce((sum, item) => {
            const price = calculateItemPrice(item);
            return sum + price * (item?.quantity || 1);
          }, 0);

          return (
            <div key={groupKey} style={{ marginBottom: "18px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderRadius: "10px 10px 0 0",
                  backgroundColor: "#f5f0ff",
                  border: "1px solid #dcd3ff",
                }}
              >
                <div style={{ fontWeight: "700", color: "#8059ca", textTransform: "capitalize" }}>
                  Provider: {groupVendor?.name || "Other Provider"}
                </div>
                {groupVendor?.phone && (
                  <div style={{ fontSize: "12px", color: "#4b5563" }}>Tel: {groupVendor.phone}</div>
                )}
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #dcd3ff" }}>
                <thead>
                  <tr style={{ backgroundColor: "#8059ca", color: "#fff" }}>
                    <th style={{ padding: "10px", textAlign: "center", width: "45px", fontSize: "12px" }}>#</th>
                    <th style={{ padding: "10px", textAlign: "left", fontSize: "12px" }}>Item</th>
                    <th style={{ padding: "10px", textAlign: "right", width: "80px", fontSize: "12px" }}>Total Days</th>
                    <th style={{ padding: "10px", textAlign: "right", width: "110px", fontSize: "12px" }}>Per Day Rent</th>
                    <th style={{ padding: "10px", textAlign: "right", width: "120px", fontSize: "12px" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item, index) => {
                    const name = getItemName(item);
                    const price = calculateItemPrice(item);
                    const quantity = item?.quantity || 1;
                    const itemTotal = price * quantity;
                    const perDayRent = item?.rentalDetails?.basePricePerDay || 0;
                    const totalRentDays = item?.rentalDetails?.totalDays || 0;

                    return (
                      <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#fff" : "#fbf9ff" }}>
                        <td style={{ padding: "10px", textAlign: "center", border: "1px solid #eaeaea", fontSize: "12px" }}>{index + 1}</td>
                        <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px", textTransform: "capitalize" }}>{name}</td>
                        <td style={{ padding: "10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px" }}>{(totalRentDays || 0).toFixed(0)}</td>
                        <td style={{ padding: "10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px" }}>₹{(perDayRent || 0).toFixed(2)}</td>
                        <td style={{ padding: "10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px" }}>₹{(itemTotal || 0).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {!vendor && (
                    <tr style={{ backgroundColor: "#f5f0ff", fontWeight: "700" }}>
                      <td colSpan="4" style={{ padding: "10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px" }}>
                        Provider subtotal:
                      </td>
                      <td style={{ padding: "10px", textAlign: "right", border: "1px solid #eaeaea", fontSize: "12px", color: "#8059ca" }}>
                        ₹{groupSubtotal.toFixed(2)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })}
      </div>

      {/* RENTAL DETAILS */}
      <div style={{ marginBottom: "24px", border: "1px solid #dcd3ff", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ backgroundColor: "#f5f0ff", padding: "12px 16px", color: "#8059ca", fontWeight: "700" }}>
          Rental Details
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            {order?.startDate && (
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                <td style={{ padding: "10px", fontWeight: "600" }}>Start Date</td>
                <td style={{ padding: "10px", textAlign: "right" }}>{formatDate(order.startDate)}</td>
              </tr>
            )}
            {order?.endDate && (
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                <td style={{ padding: "10px", fontWeight: "600" }}>End Date</td>
                <td style={{ padding: "10px", textAlign: "right" }}>{formatDate(order.endDate)}</td>
              </tr>
            )}
            {rentalDetails?.rentalPlan && (
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                <td style={{ padding: "10px", fontWeight: "600" }}>Rental Plan</td>
                <td style={{ padding: "10px", textAlign: "right", textTransform: "capitalize" }}>{rentalDetails.rentalPlan}</td>
              </tr>
            )}
            {rentalDetails?.fixedDeposit && (
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                <td style={{ padding: "10px", fontWeight: "600" }}>Deposit</td>
                <td style={{ padding: "10px", textAlign: "right", textTransform: "capitalize" }}>₹{Number(rentalDetails.fixedDeposit || 0).toFixed(2)}</td>
              </tr>
            )}

            {rentalDetails?.returnCharge && (
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                <td style={{ padding: "10px", fontWeight: "600" }}>Return Charges</td>
                <td style={{ padding: "10px", textAlign: "right", textTransform: "capitalize" }}>₹{Number(rentalDetails?.returnCharge || 0).toFixed(2)}</td>
              </tr>
            )}

            {rentalDetails?.serviceCharges && (
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                <td style={{ padding: "10px", fontWeight: "600" }}>Delivery Charges</td>
                <td style={{ padding: "10px", textAlign: "right", textTransform: "capitalize" }}>₹{Number(rentalDetails?.serviceCharges || 0).toFixed(2)}</td>
              </tr>
            )}
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px", fontWeight: "600" }}>Per Day Rental Charges</td>
              <td style={{ padding: "10px", textAlign: "right" }}>₹{Number(rentalDetails?.basePricePerDay || 0).toFixed(2)}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid #eaeaea" }}>
              <td style={{ padding: "10px", fontWeight: "600" }}>Rental Duration</td>
              <td style={{ padding: "10px", textAlign: "right" }}>{rentalDetails?.totalDays || 0} day{(rentalDetails?.totalDays || 0) === 1 ? "" : "s"}</td>
            </tr>
            {order?.numberOfInstallments && (
              <tr style={{ borderBottom: "1px solid #eaeaea" }}>
                <td style={{ padding: "10px", fontWeight: "600" }}>Installments</td>
                <td style={{ padding: "10px", textAlign: "right" }}>{order.numberOfInstallments}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* INSTALLMENT DETAILS */}
      <div style={{ marginBottom: "24px", border: "1px solid #dcd3ff", borderRadius: "10px", overflow: "hidden" }}>
        <div style={{ backgroundColor: "#f5f0ff", padding: "12px 16px", color: "#8059ca", fontWeight: "700" }}>
          Installment Details
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ backgroundColor: "#fbf9ff", color: "#374151", textAlign: "left" }}>
              <th style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>#</th>
              <th style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>Amount</th>
              <th style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>Due Date</th>
              <th style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>Method</th>
              <th style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {installments.length > 0 ? (
              installments.map((installment, idx) => (
                <tr key={installment._id || idx} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fbf9ff" }}>
                  <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>{installment.installmentNumber || idx + 1}</td>
                  <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>₹{Number(installment.amount || installment.installmentAmount || installmentAmount).toFixed(2)}</td>
                  <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px" }}>{installment.dueDate ? formatDate(installment.dueDate) : "N/A"}</td>
                  <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px", textTransform: "capitalize" }}>{installment.paymentMethod || "N/A"}</td>
                  <td style={{ padding: "10px", border: "1px solid #eaeaea", fontSize: "12px", textTransform: "capitalize", color: installment.status === "paid" ? "#047857" : "#b45309" }}>
                    {installment.status || "pending"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" style={{ padding: "12px", border: "1px solid #eaeaea", color: "#6b7280", fontSize: "12px" }}>
                  {installmentCount > 0
                    ? `${installmentCount} installment${installmentCount === 1 ? "" : "s"} of ₹${installmentAmount.toFixed(2)} each.`
                    : "No installment schedule available."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* BILLING SUMMARY — matches modal calculation exactly */}
      <div data-invoice-billing-summary style={{ display: "flex", justifyContent: "flex-end" }}>
        <table style={{ width: "380px", borderCollapse: "collapse" }}>
          <tbody>
            {billingRows.map(({ label, value, prefix, suffix }) => (
              <tr key={label}>
                <td style={{ padding: "8px 10px", color: "#555" }}>{label}</td>
                <td style={{ padding: "8px 10px", textAlign: "right", fontWeight: "700" }}>
                  {prefix ? `${prefix} ` : ""}₹{Number(value).toFixed(2)}{suffix || ""}
                </td>
              </tr>
            ))}

            {coupon > 0 && (
              <tr>
                <td style={{ padding: "8px 10px", color: "#047857" }}>Coupon Discount</td>
                <td style={{ padding: "8px 10px", textAlign: "right", color: "#047857", fontWeight: "700" }}>-₹{coupon.toFixed(2)}</td>
              </tr>
            )}

            <tr style={{ borderTop: "2px solid #8059ca", borderBottom: paidAmount > 0 ? "none" : "2px solid #8059ca" }}>
              <td style={{ padding: "10px", fontWeight: "800", fontSize: "15px", color: "#8059ca" }}>Total Amount</td>
              <td style={{ padding: "10px", textAlign: "right", fontWeight: "800", fontSize: "15px", color: "#8059ca" }}>₹{total.toFixed(2)}</td>
            </tr>

            {paidAmount > 0 && (
              <tr style={{ borderBottom: "2px solid #8059ca" }}>
                <td style={{ padding: "10px", fontWeight: "700", fontSize: "13px", color: "#047857" }}>First Installment (Paid)</td>
                <td style={{ padding: "10px", textAlign: "right", fontWeight: "700", fontSize: "13px", color: "#047857" }}>₹{paidAmount.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "36px", paddingTop: "18px", borderTop: "1px solid #e5e7eb", textAlign: "center", color: "#8b8b8b", fontSize: "11px" }}>
        This invoice is generated for rental service. Please contact support for rental agreement or return queries.
      </div>
    </div>
  );
});

export default RentalInvoiceTemplate;