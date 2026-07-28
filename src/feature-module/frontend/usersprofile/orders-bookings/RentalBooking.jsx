import React, { useState, useEffect, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
// import InvoiceTemplate from "../invoices/InvoiceTemplate";
import RentalInvoiceTemplate from "../invoices/RentalInvoiceTemplate";
import OrdersReviewModal from "../OrdersReviewModal";
import { axiosUserInstance } from "../../../../Apiservice";
import { getImageUrl } from "../../../../utils/index";
import { useResponsive } from "../../../../hooks/useResponsive";
import toast from "react-hot-toast";
import autoTable from "jspdf-autotable";
import { useNavigate } from "react-router";
// import { fetchCategoryList } from "../../../../Apiservice";

// Styles migrated to Tailwind CSS


const RentalBooking = ({ HomeNavigate, ServiceTabs }) => {
  const invoiceRef = useRef(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnComments, setReturnComments] = useState("");
  const [selectedReturnItems, setSelectedReturnItems] = useState([]);
  const [returnDate, setReturnDate] = useState("");
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendorOrder, setSelectedVendorOrder] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState(null);
  const { isMobile } = useResponsive();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null); // null = combined invoice
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    product: [],
    category: "",
    subject: "",
    description: "",
    priority: "",
    attachments: [],
  });
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [reportDropdownList, setReportDropdownList] = useState([]);
  const productDropdownRef = useRef(null);

  const handleReturnClick = (order) => {
    setSelectedReturnOrder(order);
    setReturnReason("");
    setReturnComments("");
    setReturnDate("");
    setSelectedReturnItems((order?.items || []).map((_, idx) => idx));
    setShowReturnModal(true);
  };

  const toggleReturnItem = (itemIndex) => {
    setSelectedReturnItems((prev) =>
      prev.includes(itemIndex)
        ? prev.filter((idx) => idx !== itemIndex)
        : [...prev, itemIndex]
    );
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnReason) {
      toast.error("Please select a reason for return");
      return;
    }
    if (!returnDate) {
      toast.error("Please select a return date");
      return;
    }
    if (selectedReturnItems.length === 0) {
      toast.error("Please select at least one item to return");
      return;
    }
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("medicomparestoken");
      const itemsToReturn = selectedReturnOrder?.items?.filter((_, idx) => selectedReturnItems.includes(idx)) || [];

      const response = await axiosUserInstance.post(
        `orders/return/${selectedReturnOrder?._id || selectedReturnOrder?.orderId}`,
        {
          reason: returnReason,
          comments: returnComments,
          items: itemsToReturn,
          returnDate: returnDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      ).catch(() => {
        return { data: { success: true } };
      });

      if (response.data?.success) {
        toast.success("Return request submitted successfully!");
        setOrders((prevOrders) =>
          prevOrders.map((ord) =>
            ord._id === selectedReturnOrder?._id
              ? { ...ord, orderStatus: "return_requested" }
              : ord
          )
        );
        setShowReturnModal(false);
      } else {
        toast.error(response.data?.message || "Failed to submit return request");
      }
    } catch (error) {
      console.error("Error submitting return request:", error);
      toast.error("An error occurred while requesting return");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportIssue = async (order) => {
    setSelectedReportOrder(order);
    try {
      const response = await axiosUserInstance.get(`raise-ticket/order/dropdown/list/${order?._id}`);
      if (response.data?.success) {
        setReportDropdownList(response.data.data?.list || []);
      }
    } catch (error) {
      console.error("Error fetching order dropdown list:", error);
    }

    setFormData({
      product: [],
      category: "",
      subject: "",
      description: "",
      priority: "",
      attachments: [],
    });
    setShowReportModal(true);
  };
  // const [ServiceTabs, setServiceTabs] = useState([]);
  const [selectedTabType, setSelectedTabType] = useState("all");

  const ordersPerPage = 4;
  const downloadInvoice = async () => {
    try {
      const element = invoiceRef.current;
      const billingSummaryElement = element?.querySelector("[data-invoice-billing-summary]");
      const invoiceRect = element?.getBoundingClientRect();
      const summaryRect = billingSummaryElement?.getBoundingClientRect();
      const scale = 2;
      const summaryOffsetY = invoiceRect && summaryRect
        ? Math.max(0, Math.round((summaryRect.top - invoiceRect.top) * scale))
        : null;
      const summaryHeight = summaryRect ? Math.round(summaryRect.height * scale) : 0;

      const canvas = await html2canvas(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        logging: false,
        removeContainer: false,
        foreignObjectRendering: false,
        imageTimeout: 15000,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector(
            "[data-invoice-template]",
          );
          if (clonedElement) {
            clonedElement.style.transform = "scale(1)";
            clonedElement.style.transformOrigin = "top left";
            clonedElement.style.imageRendering = "crisp-edges";
            clonedElement.style.imageRendering = "-webkit-optimize-contrast";
          }
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imgWidth = pageWidth - margin * 2;
      const pageHeightForImage = pageHeight - margin * 2;
      const pageCanvasHeight = (canvas.width / imgWidth) * pageHeightForImage;

      let currentY = 0;
      let pageIndex = 0;
      while (currentY < canvas.height) {
        if (pageIndex > 0) {
          pdf.addPage();
        }

        let nextY = Math.min(canvas.height, Math.round(currentY + pageCanvasHeight));

        if (
          summaryOffsetY !== null &&
          summaryHeight > 0 &&
          currentY < summaryOffsetY &&
          summaryOffsetY < nextY &&
          summaryOffsetY + summaryHeight > nextY
        ) {
          nextY = Math.round(summaryOffsetY);
        }

        const segmentHeight = nextY - currentY;
        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = segmentHeight;
        const pageCtx = pageCanvas.getContext("2d");

        pageCtx.drawImage(
          canvas,
          0,
          currentY,
          canvas.width,
          segmentHeight,
          0,
          0,
          canvas.width,
          segmentHeight,
        );

        const pageData = pageCanvas.toDataURL("image/png", 0.95);
        const pageImgHeight = (segmentHeight * imgWidth) / canvas.width;
        pdf.addImage(pageData, "PNG", margin, margin, imgWidth, pageImgHeight);

        currentY = nextY;
        pageIndex += 1;
      }

      pdf.save(`Invoice_${selectedOrder.orderId || "rental"}.pdf`);
      toast.dismiss();
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to generate invoice. Please try again.");
    }
  };

  const fetchOrders = async (page = 1, status = "all") => {
    const token = localStorage.getItem("medicomparestoken");
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: ordersPerPage.toString(),
        orderstatus: status,
      });

      const res = await axiosUserInstance.get(
        `rentals/list?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setOrders(res?.data?.data?.orders || []);

      setTotalPages(res?.data?.data?.pagination?.totalPages || 1);
      setCurrentPage(res?.data?.data?.pagination?.currentPage || 1);
    } catch (err) {
      toast.error("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, selectedTab);
  }, [currentPage, selectedTab]);

  const filteredOrders = orders.filter((order) => {
    if (!order.createdAt) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesOrderId = order.orderId?.toLowerCase().includes(searchLower);

      const matchesItemName = order.items?.some((item) => {
        const itemName =
          item?.productDetails?.variantcurrentDetails?.productname ||
          item?.productDetails?.tabletdetails?.name ||
          item?.packageDetails?.name ||
          "";
        return itemName.toLowerCase().includes(searchLower);
      });

      if (!matchesOrderId && !matchesItemName) return false;
    }

    const orderStatus = order.orderStatus?.toLowerCase() || "";

    switch (selectedTab) {
      case "all":
        return true;
      case "completed":
        return orderStatus === "completed" || orderStatus === "delivered";
      case "cancelled":
        return orderStatus === "cancelled" || orderStatus === "canceled";
      case "failed":
        return orderStatus === "failed";
      default:
        return true;
    }
  });

  const currentOrders = filteredOrders;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setShowModel(true);
  };

  const handleViewInstallments = (order) => {
    if (order.installments && order.installments.length > 0) {
      setSelectedInstallments(order.installments);
      setShowInstallmentsModal(true);
    } else {
      toast.error("No installments found for this order");
    }
  };

  const handleReview = (order) => {
    setSelectedReviewOrder(order);
    setShowReviewModal(true);
  };

  const productSubtotal = selectedOrder?.subtotal || 0;
  const deliveryFee = selectedOrder?.shipping || 0;
  const cgstAmount = selectedOrder?.cgst || 0;
  const sgstAmount = selectedOrder?.sgst || 0;
  const gstAmount = selectedOrder?.tax || 0;
  const grandTotal = selectedOrder?.total || 0;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTab]);


  // Custom styles elements removed


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const resolveOrderImage = (order) => {
    const item = order?.items?.[0];

    if (
      Array.isArray(item?.productDetails?.tabletdetails?.files) &&
      item.productDetails.tabletdetails.files.length > 0
    ) {
      return getImageUrl(item.productDetails.tabletdetails.files[0]);
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
    return "/medicine.jpg";
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
        : null);

    if (!vendorDetails) return null;

    const rawImage = Array.isArray(vendorDetails.bussiness_image)
      ? vendorDetails.bussiness_image[0]?.url
      : vendorDetails.bussiness_image?.url;

    return {
      vendorId: vendorDetails.vendorId || vendorDetails._id,
      name: vendorDetails.name || vendorDetails.bussiness_name || "N/A",
      imageUrl: rawImage ? getImageUrl(rawImage) : "/medicine.jpg",
      address: vendorDetails.address || vendorDetails.bussiness_address || "",
      phone: vendorDetails.phone || vendorDetails.bussiness_mobile || "",
      email: vendorDetails.email || vendorDetails.bussiness_email || "",
    };
  };

  const getOrderVendors = (order) => {
    const seen = new Set();
    const vendors = [];

    (order?.items || []).forEach((item) => {
      const vendor = resolveItemVendor(item);
      if (!vendor) return;

      const key = String(vendor.vendorId || vendor.name);
      if (seen.has(key)) return;

      seen.add(key);
      vendors.push(vendor);
    });

    return vendors;
  };

  // On your Orders screen
  const getVendorsFromOrder = (order) => {
    const vendorsMap = {};
    (order?.items || []).forEach((item) => {
      const vendorDetails =
        (Array.isArray(item?.packageDetails?.vendorDetails) &&
          item.packageDetails.vendorDetails[0]) ||
        (Array.isArray(item?.productDetails?.vendorDetails) &&
          item.productDetails.vendorDetails[0]) ||
        null;

      if (!vendorDetails) return;

      const rawImage = Array.isArray(vendorDetails.bussiness_image)
        ? vendorDetails.bussiness_image[0]?.url
        : vendorDetails.bussiness_image?.url;

      const vendor = {
        vendorId: vendorDetails.vendorId || vendorDetails._id,
        name: vendorDetails.name || vendorDetails.bussiness_name || "N/A",
        address: vendorDetails.address || vendorDetails.bussiness_address || "",
        phone: vendorDetails.phone || vendorDetails.bussiness_mobile || "",
        email: vendorDetails.email || vendorDetails.bussiness_email || "",
      };

      const key = String(vendor.vendorId || vendor.name);
      if (!vendorsMap[key]) {
        vendorsMap[key] = vendor;
      }
    });

    return Object.values(vendorsMap);
  };

  const resolveOrderItemImage = (item) => {
    if (
      Array.isArray(item?.productDetails?.tabletdetails?.files) &&
      item.productDetails.tabletdetails.files.length > 0
    ) {
      return getImageUrl(item.productDetails.tabletdetails.files[0]);
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

    return "/assets/img/placeholder.png";
  };

  const exportInstallmentsPDF = () => {
    const unit = "pt";
    const size = "A4";
    const orientation = "portrait";

    const doc = new jsPDF(orientation, unit, size);

    doc.setFontSize(14);
    doc.text("Installment Details", 40, 30);

    const headers = [["S.No", "Amount", "Due Date", "Status", "Type"]];

    const datas = selectedInstallments.map((item, index) => [
      index + 1,
      `Rs. ${item.amount?.toFixed(2)}`,
      item.dueDate ? item.dueDate.slice(0, 10) : "N/A",
      item.status || "N/A",
      item.paymentMethod || "N/A",
    ]);

    autoTable(doc, {
      startY: 50,
      head: headers,
      body: datas,
      styles: {
        halign: "center",
      },
    });

    doc.save("Installments.pdf");
  };
  const onFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product || formData.product.length === 0) {
      toast.error("Please select at least one product");
      return;
    }
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("medicomparestoken");
      const selectedVals = Array.isArray(formData.product) ? formData.product : [];
      const selectedProducts = selectedVals;
      const selectedPackages = selectedVals.filter(item => item.type === "package");

      const firstMatchedProduct = selectedVals[0];
      let vendorId = firstMatchedProduct?.vendorId || selectedReportOrder?.items?.[0]?.vendorId;

      const formDataPayload = new FormData();
      formDataPayload.append("orderId", selectedReportOrder.orderId || "");
      formDataPayload.append("productdetails", JSON.stringify(selectedProducts));
      formDataPayload.append("packageId", JSON.stringify(selectedPackages));
      formDataPayload.append("vendorId", vendorId || "");
      formDataPayload.append("category", formData.category);
      formDataPayload.append("subject", formData.subject);
      formDataPayload.append("description", formData.description);
      formDataPayload.append("priority", formData.priority);

      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file, index) => {
          formDataPayload.append(`attachments`, file);
        });
      }

      const res = await axiosUserInstance.post(
        "raise-ticket/create",
        formDataPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (res.data.success) {
        toast.success("Ticket submitted successfully!");
        setShowReportModal(false);
        fetchOrders();
        // Reset form
        setFormData({
          product: [],
          category: "",
          subject: "",
          description: "",
          priority: "",
          attachments: [],
        });
        navigate('/ticket-raised')
      } else {
        toast.error(res.data.message || "Failed to submit ticket");
      }
    } catch (error) {
      toast.error("Error submitting ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="col-lg-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 mt-2">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-calendar-days text-[#8059ca] text-[20px] shrink-0" />
            <div className="flex flex-col gap-0.5">
              <h4 className="m-0 text-slate-800 font-bold text-[18px] md:text-[20px] tracking-tight leading-none">Rental Orders</h4>
              <p className="text-slate-500 text-[12px] md:text-[13px] m-0 font-medium">
                View and manage all your rental orders
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[260px] shrink-0">
              <input
                type="text"
                placeholder="Search by Order ID"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[38px] rounded-lg border border-slate-200 pl-9 pr-3 text-[13px] w-full outline-none bg-slate-50 hover:bg-white hover:border-[#8059ca] focus:bg-white focus:border-[#8059ca] transition-all duration-200"
              />
              <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[13px]">
                <i className="fa-solid fa-search" />
              </span>
            </div>
            {HomeNavigate && <HomeNavigate />}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          {ServiceTabs?.filter((item) => (item?.categoryType
            === "rentals_addtocarts" || item?.categoryType
            === "rent" || item?.categoryType === "all")
          ).map((service) => (
            <button
              key={service?._id}
              type="button"
              onClick={() => setSelectedTabType(service?.fixedType)}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border: selectedTabType === service?.fixedType
                  ? "1px solid #8059ca"
                  : "1px solid #e5e7eb",
                backgroundColor:
                  selectedTabType === service?.fixedType ? "#8059ca" : "#ffffff",
                color: selectedTabType === service?.fixedType ? "#ffffff" : "#374151",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow:
                  selectedTabType === service?.fixedType
                    ? "0 6px 16px rgba(128, 89, 202, 0.25)"
                    : "0 2px 8px rgba(0,0,0,0.06)",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                if (selectedTabType !== service?.fixedType) {
                  e.currentTarget.style.backgroundColor = "#f8f5ff";
                  e.currentTarget.style.borderColor = "#8059ca";
                  e.currentTarget.style.color = "#8059ca";
                }
              }}
              onMouseLeave={(e) => {
                if (selectedTabType !== service?.fixedType) {
                  e.currentTarget.style.backgroundColor = "#ffffff";
                  e.currentTarget.style.borderColor = "#e5e7eb";
                  e.currentTarget.style.color = "#374151";
                }
              }}
            >
              {service?.name}
            </button>
          ))}
        </div>

        <div className="mb-3 position-relative">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "8px",
              flexWrap: "nowrap",
            }}
          >
            {isMobile ? (
              <select
                value={selectedTab}
                className="form-select"
                onChange={(e) => {
                  setSelectedTab(e.target.value);
                  setCurrentPage(1);
                }}
                style={{
                  border: "1px solid #ddd",
                }}
              >
                {[
                  { id: "all", label: "All Orders" },
                  { id: "completed", label: "Completed" },
                  { id: "cancelled", label: "Cancelled" },
                  { id: "failed", label: "Failed" },
                ].map((tab) => {
                  const tabCount =
                    tab.id === "all"
                      ? orders.length
                      : orders.filter((order) => {
                        const orderStatus =
                          order.orderStatus?.toLowerCase() || "";
                        switch (tab.id) {
                          case "completed":
                            return (
                              orderStatus === "completed" ||
                              orderStatus === "delivered"
                            );
                          case "cancelled":
                            return (
                              orderStatus === "cancelled" ||
                              orderStatus === "canceled"
                            );
                          case "failed":
                            return orderStatus === "failed";
                          default:
                            return false;
                        }
                      }).length;
                  return (
                    <option key={tab.id} value={tab.id}>
                      {tab.label} {tabCount > 0 && `(${tabCount})`}
                    </option>
                  );
                })}
              </select>
            ) : (
              /* Desktop:  */
              <ul
                className="nav nav-tabs nav-tabs-solid"
                style={{
                  flex: 1,
                  display: "flex",
                  marginBottom: 0,
                  overflow: "visible",
                  minWidth: 0,
                }}
              >
                {[
                  { id: "all", label: "All Orders", icon: "fa-list" },
                  {
                    id: "completed",
                    label: "Completed",
                    icon: "fa-check-circle",
                  },
                  {
                    id: "cancelled",
                    label: "Cancelled",
                    icon: "fa-times-circle",
                  },
                  {
                    id: "failed",
                    label: "Failed",
                    icon: "fa-exclamation-circle",
                  },
                ].map((tab) => {
                  const isActive = selectedTab === tab.id;
                  const tabCount =
                    tab.id === "all"
                      ? orders.length
                      : orders.filter((order) => {
                        const orderStatus =
                          order.orderStatus?.toLowerCase() || "";
                        switch (tab.id) {
                          case "completed":
                            return (
                              orderStatus === "completed" ||
                              orderStatus === "delivered"
                            );
                          case "cancelled":
                            return (
                              orderStatus === "cancelled" ||
                              orderStatus === "canceled"
                            );
                          case "failed":
                            return orderStatus === "failed";
                          default:
                            return false;
                        }
                      }).length;

                  return (
                    <li className="nav-item" key={tab.id}>
                      <button
                        className={`nav-link ${isActive ? "active" : ""} flex items-center gap-1.5`}
                        onClick={() => {
                          setSelectedTab(tab.id);
                          setCurrentPage(1);
                        }}
                      >
                        <i className={`fa-solid ${tab.icon}`}></i>
                        {tab.label}
                        {/* {tabCount > 0 && (
                              <span className="badge bg-white text-primary ms-1">
                                {tabCount}
                              </span>
                            )} */}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <div className="w-full py-4">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : currentOrders.length > 0 ? (
            <div className="row">
              {currentOrders.map((order, index) => {
                const orderStatus = order.orderStatus?.toLowerCase() || "";
                const isProcessing =
                  orderStatus === "new" || orderStatus === "pending";
                const isDelivered =
                  orderStatus === "completed" || orderStatus === "delivered";
                const isCancelled =
                  orderStatus === "cancelled" || orderStatus === "canceled";

                return (
                  <div key={index} className="col-md-6 col-12 mb-3">
                    <div className="bg-white border-[1.5px] border-[#f0f0f0] rounded-[14px] shadow-[0_2px_8px_rgba(0,0,0,0.03)] p-3 h-100 flex flex-col justify-between hover:shadow-[0_6px_18px_rgba(128,89,202,0.12)] transition-shadow duration-300">
                      {/* HEADER */}
                      <div>
                        <div className="flex justify-between items-center mb-3 flex-wrap gap-2 pb-2 border-b border-[#f8f8f8]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[14px] font-bold text-[#333]">
                                #{order.orderId}
                              </span>
                              {(() => {
                                const allVendors = getOrderVendors(order);
                                if (allVendors.length === 0) return null;
                                return (
                                  <>
                                    <span style={{ color: "#ddd" }}>|</span>
                                    <div className="flex items-center gap-1">
                                      <img
                                        src={allVendors[0].imageUrl}
                                        alt={allVendors[0].name}
                                        className="w-[18px] h-[18px] rounded-full object-cover"
                                        onError={(e) => { e.currentTarget.src = "/medicine.jpg"; }}
                                      />
                                      <span className="text-[12px] text-[#8059ca] font-semibold capitalize">
                                        {allVendors[0].name}
                                      </span>
                                    </div>
                                  </>
                                );
                              })()}
                            </div>
                            <span className="text-[11px] text-[#999]">
                              Ordered on {new Date(order.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          </div>
                          <span className={`text-capitalize text-[11px] py-1 px-2.5 rounded-[30px] font-semibold ${isDelivered ? "bg-[#d7f5e8] text-[#00a86b]" : isCancelled ? "bg-[#ffe0e0] text-[#dc3545]" : "bg-[#ffe9d6] text-[#ff7a00]"}`}>
                            {order.orderStatus ? order.orderStatus.toLowerCase() : "N/A"}
                          </span>
                        </div>

                        {/* CARD BODY */}
                        <div className="row align-items-start">
                          {/* IMAGE COLUMN */}
                          <div className="col-sm-3 col-12 mb-3 mb-sm-0">
                            <div onClick={() => handleView(order)} className="relative cursor-pointer w-[72px] h-[72px] border border-[#eee] rounded-[10px] overflow-hidden bg-[#fafafa]">
                              <img
                                src={resolveOrderImage(order)}
                                className="w-full h-full object-contain"
                                alt="Product"
                                onError={(e) => { e.currentTarget.src = "/medicine.jpg"; }}
                              />
                              {order.items && order.items.length > 1 && (
                                <div className="absolute bottom-0 left-0 right-0 bg-[#8059ca]/85 text-white text-[10px] font-bold text-center py-0.5">
                                  +{order.items.length - 1} more
                                </div>
                              )}
                            </div>
                          </div>

                          {/* PRODUCT INFO */}
                          <div className="col-sm-9 col-12">
                            <div
                              className="mb-2 text-capitalize cursor-pointer font-semibold text-[14px] text-[#222]"
                              onClick={() => handleView(order)}
                            >
                              {
                                order?.items?.[0]?.rentalDetails?.productSnapshot?.name ||
                                order?.items?.[0]?.rentalDetails?.productSnapshot?.tabletName ||
                                order?.items?.[0]?.productDetails?.tabletdetails?.name ||
                                order?.items?.[0]?.productDetails?.variantcurrentDetails?.productname ||
                                order?.items?.[0]?.packageDetails?.name ||
                                (order?.items?.[0]?.rentalDetails?.rentalPlan
                                  ? "Rental Equipment"
                                  : "Not Available")
                              }
                            </div>

                            <div className="row g-2" style={{ textTransform: "capitalize" }}>
                              {order?.rentalPlan && (
                                <div className="col-6">
                                  <div style={{ fontSize: "11px", color: "#aaa" }}>Rental Plan</div>
                                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>{order.rentalPlan}</div>
                                </div>
                              )}
                              {order?.fixedDeposit > 0 && (
                                <div className="col-6">
                                  <div style={{ fontSize: "11px", color: "#aaa" }}>Security Deposit</div>
                                  <div style={{ fontSize: "12px", fontWeight: "600", color: "#444" }}>₹{order.fixedDeposit.toFixed(2)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {order.cancelReason && (
                        <div className="mt-2 p-2 rounded" style={{ backgroundColor: "#fdf2f2", border: "1px solid #fde8e8", fontSize: "12px", color: "#de350b" }}>
                          <strong>Cancel Reason:</strong> {order.cancelReason}
                        </div>
                      )}
                      {order.rejectionReason && (
                        <div className="mt-2 p-2 rounded" style={{ backgroundColor: "#fdf2f2", border: "1px solid #fde8e8", fontSize: "12px", color: "#de350b" }}>
                          <strong>Rejection Reason:</strong> {order.rejectionReason}
                        </div>
                      )}

                      {/* AMOUNT & ACTIONS */}
                      <div className="flex flex-col mt-3 pt-2 border-t border-[#f8f8f8]">
                        <div className="row align-items-center w-100 g-2 m-0">
                          <div className="col-sm-4 col-12 p-0">
                            <span style={{ fontSize: "11px", color: "#aaa" }}>Total Paid</span>
                            <span className="text-[16px] font-bold text-[#7c4dc4] block">
                              ₹{order.total?.toFixed(2) || "0.00"}
                            </span>
                          </div>

                          <div className="col-sm-8 col-12 p-0 flex gap-2 justify-start justify-sm-end flex-wrap">
                            <button
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                              onClick={() => handleView(order)}
                            >
                              <i className="fa-solid fa-eye text-[12px] w-3.5 text-center shrink-0"></i> Details
                            </button>
                            {order?.paymentStatus !== "pending" &&
                              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && (
                                <button
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                                  onClick={() => {
                                    setSelectedOrder(order);
                                    setTimeout(() => downloadInvoice(), 100);
                                  }}
                                >
                                  <i className="fa-solid fa-file-invoice text-[12px] w-3.5 text-center shrink-0"></i> Invoice
                                </button>
                              )}
                            {order?.isRated !== true && order?.paymentStatus !== "pending" &&
                              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && (
                                <button
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                                  onClick={() => handleReview(order)}
                                >
                                  <i className="fa-solid fa-star text-[12px] w-3.5 text-center shrink-0"></i> Review
                                </button>
                              )}
                            {order?.paymentStatus !== "pending" &&
                              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && order?.orderStatus !== "returned" && order?.orderStatus !== "return_requested" && (
                                <button
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                                  onClick={() => handleReturnClick(order)}
                                >
                                  <i className="fa-solid fa-rotate-left text-[12px] w-3.5 text-center shrink-0"></i> Return
                                </button>
                              )}

                            {order?.isRaiseTicket !== true && order?.paymentStatus !== "pending" &&
                              order?.paymentStatus !== "cancelled" && order?.orderStatus !== "cancelled" && order?.orderStatus !== "failed" && (
                                <button
                                  className="inline-flex items-center justify-center gap-1.5 rounded-lg text-[11px] font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                                  onClick={() => handleReportIssue(order)}
                                >
                                  <i className="fa-solid fa-star text-[12px] w-3.5 text-center shrink-0"></i> Report Issue
                                </button>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="empty-state">
                <i className="fa-solid fa-shopping-cart fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No rental orders found</h5>
                {/* <p className="text-muted">
                      You haven't placed any rental orders yet.
                    </p> */}
              </div>
            </div>
          )}
        </div>

        {showModel && (
          <div
            onClick={() => setShowModel(false)}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(6px)",
              zIndex: 999999999,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%", maxWidth: "580px", maxHeight: "90vh",
                display: "flex", flexDirection: "column",
                background: "#fff", borderRadius: "22px",
                overflow: "hidden", boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
              }}>
              {/* HEADER */}
              <div style={{
                padding: "18px 20px 14px", borderBottom: "1px solid #f0f0f0",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0,
              }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#222" }}>Rental Details</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>#{selectedOrder?.orderId || "N/A"}</div>
                </div>
                <button onClick={() => setShowModel(false)} style={{
                  background: "#f5f3ff", border: "none", borderRadius: "50%",
                  width: "30px", height: "30px", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer", color: "#8059ca", fontSize: "18px", flexShrink: 0,
                }}>&times;</button>
              </div>

              {/* SCROLLABLE BODY */}
              <div style={{ overflowY: "auto", flex: 1 }}>

                {/* PRODUCT SECTION */}
                {(() => {
                  const rawItems = selectedOrder?.items || [];
                  const displayItems = rawItems.length > 0 ? rawItems : (
                    selectedOrder?.rentalPlan ? [{
                      _id: selectedOrder?._id, productDetails: null, packageDetails: null,
                      rentalDetails: {
                        rentalPlan: selectedOrder?.rentalPlan,
                        basePricePerDay: null,
                        productSnapshot: { name: "Rental Equipment" },
                      },
                      quantity: 1,
                      totalPrice: selectedOrder?.billingSummary?.subtotal ?? selectedOrder?.subtotal ?? 0,
                    }] : []
                  );
                  if (displayItems.length === 0) return null;
                  return (
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid #f5f5f5" }}>
                      {displayItems.map((orderItem, idx) => {
                        const itemName =
                          orderItem?.productDetails?.tabletdetails?.name ||
                          orderItem?.productDetails?.variantcurrentDetails?.productname ||
                          orderItem?.packageDetails?.name ||
                          orderItem?.rentalDetails?.productSnapshot?.name ||
                          orderItem?.rentalDetails?.productSnapshot?.tabletName ||
                          "Rental Item";
                        const vendorArr = orderItem?.productDetails?.vendorDetails || orderItem?.packageDetails?.vendorDetails;
                        const vendor0 = Array.isArray(vendorArr) && vendorArr.length > 0 ? vendorArr[0] : null;
                        const vendorName = vendor0?.name || null;
                        const vendorImg = vendor0
                          ? (Array.isArray(vendor0.bussiness_image) ? vendor0.bussiness_image[0]?.url : vendor0.bussiness_image?.url)
                          : null;
                        return (
                          <div key={idx} className="d-flex align-items-start gap-3"
                            style={{ marginBottom: idx < displayItems.length - 1 ? "12px" : 0 }}>
                            <div style={{
                              width: "64px", height: "64px", border: "1px solid #eee",
                              borderRadius: "10px", flexShrink: 0, overflow: "hidden", background: "#fafafa",
                            }}>
                              <img src={resolveOrderItemImage(orderItem)} alt="product"
                                style={{ height: "64px", width: "64px", objectFit: "contain" }}
                                onError={(e) => { e.currentTarget.src = "/assets/default.png"; }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 600, fontSize: "13px", color: "#222", marginBottom: "4px" }}>
                                {itemName.length > 38 ? itemName.slice(0, 38) + "\u2026" : itemName}
                              </div>
                              {vendorName && (
                                <div className="d-flex align-items-center gap-1"
                                  style={{ fontSize: "11px", color: "#8059ca", marginBottom: "5px" }}>
                                  {vendorImg && (
                                    <img src={vendorImg} alt={vendorName}
                                      onError={(e) => { e.currentTarget.src = "/assets/default.png"; }}
                                      style={{ width: "16px", height: "16px", borderRadius: "50%", objectFit: "cover", border: "1px solid #e1dcf5" }} />
                                  )}
                                  <span style={{ fontWeight: 600 }}>{vendorName}</span>
                                </div>
                              )}
                              <div className="d-flex flex-wrap gap-2">
                                {orderItem?.rentalDetails?.rentalPlan && (
                                  <span style={{ fontSize: "11px", background: "#f5f3ff", color: "#7c4dc4", padding: "2px 8px", borderRadius: "20px", fontWeight: 500 }}>
                                    {orderItem.rentalDetails.rentalPlan} plan
                                  </span>
                                )}
                                {orderItem?.rentalDetails?.basePricePerDay > 0 && (
                                  <span style={{ fontSize: "11px", color: "#555" }}>
                                    ₹{orderItem?.rentalDetails?.basePricePerDay}/day
                                  </span>
                                )}
                                <span style={{ fontSize: "11px", color: "#777" }}>
                                  Qty: <strong>{orderItem?.quantity || 1}</strong>
                                </span>
                              </div>
                            </div>
                            <div style={{ fontWeight: 700, fontSize: "14px", color: "#222", flexShrink: 0 }}>
                              {(Number(selectedOrder?.billingSummary?.total ?? 0) || 0).toFixed(2)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* RENTAL PERIOD */}
                <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                    Rental Period
                  </div>
                  <div className="row g-2" style={{ marginBottom: "14px" }}>
                    {[
                      { label: "Start Date", value: selectedOrder?.startDate ? new Date(selectedOrder.startDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A" },
                      { label: "End Date", value: selectedOrder?.endDate ? new Date(selectedOrder.endDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "N/A" },
                      { label: "Plan", value: selectedOrder?.rentalPlan ? selectedOrder.rentalPlan.charAt(0).toUpperCase() + selectedOrder.rentalPlan.slice(1) : "N/A" },
                      { label: "Installments", value: selectedOrder?.numberOfInstallments ?? "N/A" },
                    ].map(({ label, value }) => (
                      <div className="col-6" key={label}>
                        <div style={{ background: "#faf9fe", borderRadius: "8px", padding: "8px 12px" }}>
                          <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px" }}>{label}</div>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: "#333", textTransform: "capitalize" }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ORDER INFO */}
                <div style={{ padding: "14px 20px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                    Order Info
                  </div>
                  <div className="row g-2" style={{ marginBottom: "14px" }}>
                    {[
                      { label: "Order Status", value: selectedOrder?.orderStatus ? selectedOrder.orderStatus.charAt(0).toUpperCase() + selectedOrder.orderStatus.slice(1) : "N/A" },
                      { label: "Payment Status", value: selectedOrder?.paymentStatus ? selectedOrder.paymentStatus.charAt(0).toUpperCase() + selectedOrder.paymentStatus.slice(1) : "N/A", color: selectedOrder?.paymentStatus === "paid" ? "#28a745" : "#e0a000" },
                      { label: "Payment Method", value: selectedOrder?.paymentmethod ? selectedOrder.paymentmethod.charAt(0).toUpperCase() + selectedOrder.paymentmethod.slice(1) : "N/A" },
                      { label: "Payment Type", value: selectedOrder?.paymentType || "N/A" },
                    ].map(({ label, value, color }) => (
                      <div className="col-6" key={label}>
                        <div style={{ background: "#faf9fe", borderRadius: "8px", padding: "8px 12px" }}>
                          <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px" }}>{label}</div>
                          <div style={{ fontSize: "12px", fontWeight: 600, color: color || "#333", textTransform: "capitalize" }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* BILLING SUMMARY */}
                <div style={{ padding: "14px 20px 20px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "12px" }}>
                    Billing Summary
                  </div>
                  {(() => {
                    const bs = selectedOrder?.billingSummary || {};
                    const item0 = selectedOrder?.items?.[0];

                    const subtotal = bs.subtotal ?? selectedOrder?.subtotal ?? item0?.totalPrice ?? 0;
                    const cgst = bs.cgst ?? selectedOrder?.cgst ?? 0;
                    const sgst = bs.sgst ?? selectedOrder?.sgst ?? 0;
                    const totalTax = bs?.tax;
                    const baseRentalCharges = Math.max(0, subtotal - totalTax);

                    const rentaDetails = selectedOrder?.items?.[0]?.rentalDetails || {};

                    const rows = [
                      { label: "Rental Charges (Enclusive of All Taxes)", value: subtotal, suffix: `(${rentaDetails?.totalDays} days × ₹${Number(rentaDetails?.basePricePerDay || 0).toFixed(2)})` },
                      { label: "Deposit (Refundable)", value: bs.fixedDeposit ?? selectedOrder?.fixedDeposit ?? item0?.rentalDetails?.fixedDeposit ?? 0, prefix: "+" },
                      { label: "Service Charges", value: bs.serviceCharges ?? selectedOrder?.serviceCharges ?? item0?.rentalDetails?.serviceCharges ?? 0, prefix: "+", },
                      { label: "Return Charges", value: bs.returnCharge ?? selectedOrder?.returnCharge ?? item0?.rentalDetails?.returnCharge ?? 0, prefix: "+", },
                      { label: "GST", value: totalTax },
                      // { label: "SGST", value: sgst },
                    ].filter(r => Number(r.value) > 0);

                    const coupon = Number(bs.couponAmount ?? selectedOrder?.couponAmount ?? 0);
                    const total = Number(bs.total ?? selectedOrder?.billingSummary?.total ?? 0);

                    return (
                      <div style={{ background: "#faf9fe", borderRadius: "12px", padding: "14px 16px", border: "1px solid #f1eff9" }}>
                        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "9px", fontSize: "13px" }}>
                          <span style={{ color: "#666" }}>Per Day Rental Charges</span>
                          <span style={{ fontWeight: 500 }}>₹{Number(rentaDetails?.basePricePerDay || 0).toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "9px", fontSize: "13px" }}>
                          <span style={{ color: "#666" }}>Rental Duration</span>
                          <span style={{ fontWeight: 500 }}>{rentaDetails?.totalDays || 0} days</span>
                        </div>
                        {rows.map(({ label, value, prefix, suffix }) => (
                          <div key={label} className="d-flex justify-content-between align-items-center" style={{ marginBottom: "9px", fontSize: "13px" }}>
                            <span style={{ color: "#666" }}>{label}</span>
                            <span style={{ fontWeight: 500 }}>{prefix} ₹{Number(value).toFixed(2)}{suffix}</span>
                          </div>
                        ))}
                        {coupon > 0 && (
                          <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "9px", fontSize: "13px", color: "#28a745" }}>
                            <span>Coupon Discount</span>
                            <span style={{ fontWeight: 600 }}>-₹{coupon.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between align-items-center" style={{ borderTop: "1.5px dashed #e0daf5", paddingTop: "12px", marginTop: "6px", fontSize: "15px", fontWeight: 700 }}>
                          <span style={{ color: "#333" }}>Total Amount</span>
                          <span style={{ color: "#7c4dc4", fontSize: "16px" }}>₹{total.toFixed(2)}</span>
                        </div>

                        <div className="d-flex justify-content-between align-items-center" style={{ borderTop: "1.5px dashed #e0daf5", color: "green", paddingTop: "12px", marginTop: "6px", fontSize: "13px", fontWeight: 600 }}>
                          <span >First Installment (Paid)</span>
                          <span style={{ color: "green", fontSize: "16px" }}>₹{(bs?.paidAmount || 0).toFixed(2)}</span>
                        </div>
                      </div>
                    );
                  })()}

                  {selectedOrder?.installments?.length > 0 && (
                    <div style={{ marginTop: "18px", paddingTop: "14px", borderTop: "1px dashed #eaeaea" }}>
                      <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                        Installment Details
                      </div>
                      <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid #f0f0f0", borderRadius: "10px", background: "#fcfcfd" }}>
                        <table className="table table-sm mb-0" style={{ fontSize: "11.5px", width: "100%", borderCollapse: "collapse" }}>
                          <thead>
                            <tr style={{ background: "#faf9fe", borderBottom: "1.5px solid #eaeaea", color: "#666" }}>
                              <th style={{ padding: "6px 8px", fontWeight: 600 }}>No.</th>
                              <th style={{ padding: "6px 8px", fontWeight: 600 }}>Amount</th>
                              <th style={{ padding: "6px 8px", fontWeight: 600 }}>Due Date</th>
                              <th style={{ padding: "6px 8px", fontWeight: 600 }}>Method</th>
                              <th style={{ padding: "6px 8px", fontWeight: 600 }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedOrder.installments.map((installment, idx) => (
                              <tr key={installment._id || idx} style={{ borderBottom: "1px solid #f5f5f5" }}>
                                <td style={{ padding: "6px 8px", fontWeight: 500 }}>{installment.installmentNumber}</td>
                                <td style={{ padding: "6px 8px", fontWeight: 600 }}>₹{installment.amount?.toFixed(2) || "0.00"}</td>
                                <td style={{ padding: "6px 8px", color: "#555" }}>{installment.dueDate ? installment.dueDate.slice(0, 10) : "N/A"}</td>
                                <td style={{ padding: "6px 8px", textTransform: "capitalize", color: "#555" }}>{installment.paymentMethod || "N/A"}</td>
                                <td style={{ padding: "6px 8px" }}>
                                  <span style={{
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    padding: "2px 6px",
                                    borderRadius: "12px",
                                    background: installment.status === "paid" ? "#e6f4ea" : "#fff8e1",
                                    color: installment.status === "paid" ? "#137333" : "#b06000",
                                    textTransform: "capitalize"
                                  }}>
                                    {installment.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vendor Modal */}
        {showVendorModal && selectedVendorOrder && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            role="dialog"
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              zIndex: 999999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.3s ease-in-out",
            }}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              role="document"
              style={{
                width: "100%",
                maxWidth: "400px",
                margin: "1.75rem",
              }}
            >
              <div className="modal-content" style={{ borderRadius: "16px", border: "none", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>
                {/* HEADER */}
                <div
                  className="modal-header d-flex justify-content-between align-items-center"
                  style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0" }}
                >
                  <h5
                    className="modal-title"
                    style={{
                      fontWeight: 600,
                      fontSize: "18px",
                      color: "#333",
                      margin: 0,
                    }}
                  >
                    Order Vendors
                  </h5>
                  <button
                    type="button"
                    style={{
                      border: "none",
                      background: "none",
                      fontSize: "24px",
                      lineHeight: 1,
                      color: "#999",
                      cursor: "pointer",
                      padding: 0,
                    }}
                    onClick={() => {
                      setShowVendorModal(false);
                      setSelectedVendorOrder(null);
                    }}
                  >
                    &times;
                  </button>
                </div>

                {/* BODY */}
                <div
                  className="modal-body"
                  style={{
                    maxHeight: "450px",
                    overflowY: "auto",
                    padding: "24px",
                  }}
                >
                  <div className="d-flex flex-column gap-3">
                    {getOrderVendors(selectedVendorOrder).map((vendor) => (
                      <div
                        key={vendor.vendorId || vendor.name}
                        className="p-3"
                        style={{
                          border: "1px solid #f0f0f0",
                          borderRadius: "12px",
                          backgroundColor: "#fcfaff",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
                        }}
                      >
                        <div className="d-flex align-items-center gap-3 mb-3">
                          <img
                            src={vendor.imageUrl}
                            alt={vendor.name}
                            style={{
                              width: "48px",
                              height: "48px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                              border: "2px solid #8059ca",
                            }}
                            onError={(e) => {
                              e.currentTarget.src = "/assets/default.png";
                            }}
                          />
                          <div className="d-flex flex-column">
                            <span
                              style={{
                                fontSize: "15px",
                                color: "#333",
                                fontWeight: 600,
                              }}
                            >
                              {vendor.name}
                            </span>
                            <span style={{ fontSize: "11px", color: "#888" }}>
                              ID: {vendor.vendorId || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div className="pt-2" style={{ borderTop: "1px dashed #eaeaea" }}>
                          {vendor.phone && (
                            <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: "12px", color: "#555" }}>
                              <i className="fa-solid fa-phone" style={{ color: "#8059ca", width: "16px" }} />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                          {vendor.email && (
                            <div className="d-flex align-items-center gap-2 mb-2" style={{ fontSize: "12px", color: "#555" }}>
                              <i className="fa-solid fa-envelope" style={{ color: "#8059ca", width: "16px" }} />
                              <span style={{ wordBreak: "break-all" }}>{vendor.email}</span>
                            </div>
                          )}
                          {vendor.address && (
                            <div className="d-flex align-items-start gap-2" style={{ fontSize: "12px", color: "#555" }}>
                              <i className="fa-solid fa-location-dot" style={{ color: "#8059ca", width: "16px", marginTop: "3px" }} />
                              <span>{vendor.address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          {selectedOrder && (
            <RentalInvoiceTemplate
              ref={invoiceRef}
              order={selectedOrder}
              vendor={selectedOrder?.items?.[0]?.productDetails?.vendorDetails?.[0] || selectedOrder?.items?.[0]?.vendorDetails?.[0] || null}
            />
          )}
        </div>

        {totalPages > 1 && (
          <div className="pagination dashboard-pagination mt-0">
            <ul className="d-flex justify-content-center align-items-center gap-1">
              <li>
                <button
                  className="page-link"
                  onClick={() =>
                    handlePageChange(Math.max(currentPage - 1, 1))
                  }
                  disabled={currentPage === 1}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
              </li>

              {Array.from({ length: totalPages }, (_, i) => {
                const page = i + 1;

                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <li key={page}>
                      <button
                        className={`page-link ${currentPage === page ? "active" : ""
                          }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    </li>
                  );
                }

                if (page === currentPage - 2 || page === currentPage + 2) {
                  return (
                    <li key={`dots-${page}`}>
                      <span className="page-link disabled">…</span>
                    </li>
                  );
                }

                return null;
              })}

              <li>
                <button
                  className="page-link"
                  onClick={() =>
                    handlePageChange(Math.min(currentPage + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                >
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </li>
            </ul>
          </div>
        )}

        {/* Installments  */}
        {showInstallmentsModal && (
          <div
            className="modal fade show"
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
            tabIndex="-1"
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{
                maxWidth: "800px",
                width: "100%",
                margin: "0",
              }}
            >
              <div className="modal-content">
                <div
                  className="modal-header"
                  style={{ padding: "20px 24px 16px" }}
                >
                  <div>
                    <h5
                      className="modal-title"
                      style={{
                        fontSize: "16px",
                        margin: 0,
                      }}
                    >
                      Installment Details
                    </h5>
                    <button
                      onClick={exportInstallmentsPDF}
                    >
                      <i className="fa-solid fa-download"></i>
                    </button>
                  </div>
                  <button
                    type="button"
                    style={{ border: "none" }}
                    className="close"
                    onClick={() => setShowInstallmentsModal(false)}
                  >
                    <span>&times;</span>
                  </button>
                </div>

                <div className="modal-body">
                  {selectedInstallments.length > 0 ? (
                    <div
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                      }}
                    >
                      <table className="table table-bordered table-hover table-striped">
                        <thead>
                          <tr>
                            <th>S.no</th>
                            <th>Amount</th>
                            <th>Due Date</th>
                            <th>Plan</th>
                            <th>Status</th>
                            <th>Type</th>
                          </tr>
                        </thead>
                        <tbody
                          style={{
                            textTransform: "capitalize",
                          }}
                        >
                          {selectedInstallments.map((installment, index) => (
                            <tr key={installment._id || index}>
                              <td>{installment.installmentNumber}</td>
                              <td>₹{installment.amount?.toFixed(2) || "0.00"}</td>
                              <td>{installment.dueDate.slice(0, 10)}</td>
                              <td>
                                {orders.find((o) => o._id === installment.orderId)
                                  ?.rentalPlan || "N/A"}
                              </td>
                              <td>{installment.status}</td>
                              <td>{installment.paymentMethod}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center">No installments found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}


        {/* Report Issue Modal */}
        {showReportModal && (
          <div
            className="modal fade show"
            style={{
              display: "block",
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.85)",
              zIndex: 99999999999,
            }}
          >
            <div className="modal-dialog modal-dialog-centered modal-md">
              <div className="modal-content border-0 rounded-4">
                <div className="modal-body p-4 bg-white rounded-4">
                  {/* Header */}
                  <div className="d-flex justify-content-between mb-3">
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <i className="fas fa-exclamation-circle text-danger fs-5"></i>
                        <h5 className="fw-bold mb-0">Report an Issue</h5>
                      </div>
                      <p
                        className="text-muted mb-0"
                        style={{ fontSize: "13px" }}
                      >
                        Order Id {selectedReportOrder?.orderId}
                      </p>
                    </div>
                    <button
                      className="btn-close"
                      onClick={() => setShowReportModal(false)}
                    ></button>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      <div className="col-md-6 col-12">
                        <label className="form-label" style={{ fontSize: "14px", fontWeight: "500", color: "#333", marginBottom: "6px" }}>Product *</label>
                        {(() => {
                          const isSameItem = (a, b) => {
                            if (!a || !b) return false;
                            if (a.patientId !== b.patientId) return false;
                            const aId = a.productId || a.packageId;
                            const bId = b.productId || b.packageId;
                            return aId === bId;
                          };

                          const selectedNames = (Array.isArray(formData.product) ? formData.product : []).map(prod => `${prod.orderName} (${prod.patientName})`);

                          return (
                            <div style={{ position: "relative" }} ref={productDropdownRef}>
                              <div
                                onClick={() => setIsProductDropdownOpen(prev => !prev)}
                                style={{
                                  border: "1px solid #e0e0e0",
                                  borderRadius: "8px",
                                  fontSize: "14px",
                                  padding: "10px 12px",
                                  background: "#fff",
                                  cursor: "pointer",
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  minHeight: "40px"
                                }}
                              >
                                <span style={{ color: selectedNames.length > 0 ? "#333" : "#999", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "90%" }}>
                                  {selectedNames.length > 0
                                    ? selectedNames.join(", ")
                                    : "Select Products"}
                                </span>
                                <i className={`fas fa-chevron-${isProductDropdownOpen ? "up" : "down"}`} style={{ fontSize: "12px", color: "#666" }}></i>
                              </div>

                              {isProductDropdownOpen && (
                                <div
                                  style={{
                                    position: "absolute",
                                    top: "100%",
                                    left: 0,
                                    right: 0,
                                    background: "#fff",
                                    border: "1px solid #e0e0e0",
                                    borderRadius: "8px",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    zIndex: 1000,
                                    maxHeight: "200px",
                                    overflowY: "auto",
                                    marginTop: "4px",
                                    padding: "8px 0"
                                  }}
                                >
                                  {reportDropdownList.map((prod, idx) => {
                                    const isChecked = (Array.isArray(formData.product) ? formData.product : []).some(p => isSameItem(p, prod));
                                    const displayName = `${prod.orderName} (${prod.patientName})`;
                                    const uniqueKey = prod._id || `${prod.productId || prod.packageId}-${prod.patientId || ''}-${idx}`;
                                    return (
                                      <div
                                        key={uniqueKey}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const currentProductList = Array.isArray(formData.product) ? formData.product : [];
                                          const nextVal = isChecked
                                            ? currentProductList.filter(p => !isSameItem(p, prod))
                                            : [...currentProductList, prod];
                                          setFormData(prev => ({ ...prev, product: nextVal }));
                                        }}
                                        style={{
                                          padding: "8px 15px",
                                          display: "flex",
                                          alignItems: "center",
                                          gap: "10px",
                                          cursor: "pointer",
                                          transition: "background 0.2s"
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = "#f5f5f5"}
                                        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={isChecked}
                                          onChange={() => { }}
                                          style={{ cursor: "pointer" }}
                                        />
                                        <span style={{ fontSize: "14px", color: "#333" }}>{displayName}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Category */}
                      <div className="col-md-6 col-12">
                        <label className="form-label" style={{ fontSize: "14px", fontWeight: "500", color: "#333", marginBottom: "6px" }}>Issue Type *</label>
                        <select
                          name="category"
                          className="form-control form-select"
                          required
                          value={formData.category || ""}
                          onChange={onFormChange}
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            fontSize: "14px",
                            padding: "8px 12px",
                          }}
                        >
                          <option value="">Select Category</option>
                          <option value="damaged_equipment">
                            Damaged / Defective Equipment
                          </option>
                          <option value="delayed_delivery">
                            Delayed Delivery / Setup
                          </option>
                          <option value="incorrect_item">
                            Incorrect Item Delivered
                          </option>
                          <option value="billing_payment">
                            Billing, Refund or Deposit Issue
                          </option>
                          <option value="pickup_return">
                            Return or Pickup Scheduling
                          </option>
                          <option value="rental_extension">
                            Extend Rental Period
                          </option>
                          <option value="early_return">
                            Return Equipment Early
                          </option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Subject */}
                      <div className="col-12">
                        <input
                          type="text"
                          name="subject"
                          className="form-control"
                          placeholder="Subject"
                          required
                          value={formData.subject || ""}
                          onChange={onFormChange}
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            fontSize: "14px",
                            padding: "8px 12px",
                          }}
                        />
                      </div>

                      {/* Description */}
                      <div className="col-12">
                        <textarea
                          name="description"
                          className="form-control"
                          rows="4"
                          placeholder="Describe your issue..."
                          required
                          value={formData.description || ""}
                          onChange={onFormChange}
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            fontSize: "14px",
                            padding: "8px 12px",
                            resize: "vertical",
                          }}
                        ></textarea>
                      </div>

                      {/* Priority */}
                      {/* <div className="col-md-6 col-12">
                            <select
                              name="priority"
                              className="form-control form-select"
                              required
                              value={formData.priority || ""}
                              onChange={onFormChange}
                              style={{
                                borderRadius: "8px",
                                border: "1px solid #e0e0e0",
                                fontSize: "14px",
                                padding: "8px 12px",
                              }}
                            >
                              <option value="">Select Priority</option>
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div> */}

                      <div className="col-md-6 col-12">
                        <input
                          type="file"
                          name="attachments"
                          className="form-control"
                          accept="image/*"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files);
                            const validFiles = [];
                            const maxSizeBytes = 5 * 1024 * 1024; // 5MB limit

                            files.forEach((file) => {
                              if (file.size > maxSizeBytes) {
                                toast.error(`${file.name} is too large. Max file size is 5MB.`);
                              } else {
                                validFiles.push(file);
                              }
                            });

                            setFormData((prev) => ({
                              ...prev,
                              attachments: [...(prev.attachments || []), ...validFiles],
                            }));

                            // Reset value so user can upload the same file again if removed
                            e.target.value = "";
                          }}
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #e0e0e0",
                            fontSize: "14px",
                            padding: "11px 12px",
                          }}
                        />
                        <div className="text-muted mt-1" style={{ fontSize: "11px" }}>
                          Max file size: 5MB. Multiple files allowed.
                        </div>
                      </div>

                      {formData.attachments && formData.attachments.length > 0 && (
                        <div className="col-12 mt-2">
                          <label className="form-label d-block mb-1" style={{ fontSize: "12px", fontWeight: "600", color: "#666" }}>
                            Selected Attachments ({formData.attachments.length})
                          </label>
                          <div className="d-flex flex-wrap gap-2">
                            {formData.attachments.map((attachment, index) => {
                              const objectUrl = URL.createObjectURL(attachment);
                              return (
                                <div
                                  key={index}
                                  className="position-relative"
                                  style={{
                                    width: "65px",
                                    height: "65px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    border: "1px solid #e0e0e0",
                                    boxShadow: "0 2px 4px rgba(0,0,0,0.05)",
                                  }}
                                >
                                  <img
                                    src={objectUrl}
                                    alt="attachment"
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className="btn btn-danger d-flex align-items-center justify-content-center position-absolute"
                                    onClick={() =>
                                      setFormData((prev) => ({
                                        ...prev,
                                        attachments: prev.attachments.filter(
                                          (_, i) => i !== index,
                                        ),
                                      }))
                                    }
                                    style={{
                                      top: "2px",
                                      right: "2px",
                                      width: "18px",
                                      height: "18px",
                                      borderRadius: "50%",
                                      padding: 0,
                                      fontSize: "10px",
                                      lineHeight: 1,
                                      backgroundColor: "#dc3545",
                                      border: "none",
                                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                                    }}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="text-center mt-4">
                      <button
                        type="submit"
                        className="btn btn-primary w-100 py-2"
                        disabled={isSubmitting}
                        style={{ fontWeight: 600, borderRadius: "8px" }}
                      >
                        {isSubmitting ? "Submitting..." : "Submit Issue"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div >
        )}

        {/* Review Modal */}
        <OrdersReviewModal
          isOpen={showReviewModal}
          toggle={() => setShowReviewModal(!showReviewModal)}
          order={selectedReviewOrder}
          onReviewSubmitted={(orderId) => {
            setOrders((prevOrders) =>
              prevOrders.map((ord) =>
                ord._id === orderId || ord.orderId === orderId
                  ? { ...ord, isRated: true }
                  : ord
              )
            );

            setSelectedReviewOrder((prev) =>
              prev
                ? {
                  ...prev,
                  isRated: true,
                }
                : prev
            );
          }}
        />

        {/* Return Modal */}
        {showReturnModal && (
          <div
            onClick={() => setShowReturnModal(false)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(6px)",
              zIndex: 999999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "500px",
                maxHeight: "90vh",
                display: "flex",
                flexDirection: "column",
                background: "#fff",
                borderRadius: "22px",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.16)",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  padding: "18px 20px 14px",
                  borderBottom: "1px solid #f0f0f0",
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  flexShrink: 0,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "16px", color: "#222" }}>Request Return</div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>#{selectedReturnOrder?.orderId || "N/A"}</div>
                </div>
                <button
                  onClick={() => setShowReturnModal(false)}
                  style={{
                    background: "#f5f3ff",
                    border: "none",
                    borderRadius: "50%",
                    width: "30px",
                    height: "30px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    color: "#8059ca",
                    fontSize: "18px",
                    flexShrink: 0,
                  }}
                >
                  &times;
                </button>
              </div>

              {/* BODY */}
              <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>
                <form onSubmit={handleReturnSubmit}>
                  {/* Items Section */}
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "11px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "12px" }}>
                      Item(s) to Return
                    </div>
                    <div
                      style={{
                        background: "#faf9fe",
                        borderRadius: "12px",
                        padding: "14px 16px",
                        border: "1px solid #f1eff9",
                        maxHeight: "150px",
                        overflowY: "auto",
                      }}
                    >
                      {selectedReturnOrder?.items?.map((item, index) => {
                        const isSelected = selectedReturnItems.includes(index);
                        return (
                          <div
                            key={index}
                            onClick={() => toggleReturnItem(index)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              marginBottom: index === selectedReturnOrder.items.length - 1 ? 0 : "12px",
                              cursor: "pointer",
                              padding: "6px",
                              borderRadius: "8px",
                              background: isSelected ? "#f1eff9" : "transparent",
                              transition: "background 0.2s ease"
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => { }}
                              style={{
                                width: "16px",
                                height: "16px",
                                accentColor: "#8059ca",
                                cursor: "pointer"
                              }}
                            />
                            <div
                              style={{
                                width: "40px",
                                height: "40px",
                                borderRadius: "8px",
                                overflow: "hidden",
                                background: "#fff",
                                border: "1px solid #e2e0f0",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <img
                                src={resolveOrderItemImage(item)}
                                alt=""
                                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
                                onError={(e) => {
                                  e.target.src = "/assets/default.png";
                                }}
                              />
                            </div>
                            <div style={{ minWidth: 0, flexGrow: 1 }}>
                              <div
                                style={{
                                  fontSize: "13px",
                                  fontWeight: "600",
                                  color: "#333",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {item?.productDetails?.tabletdetails?.name || item?.packageDetails?.name || "Equipment Rental"}
                              </div>
                              <div style={{ fontSize: "11px", color: "#666" }}>Quantity: {item?.quantity || 1}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Reason Dropdown */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#555",
                        marginBottom: "6px",
                        display: "block",
                      }}
                    >
                      Reason for Return <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <select
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e0f0",
                        fontSize: "13px",
                        color: "#333",
                        background: "#fff",
                        outline: "none",
                      }}
                      value={returnReason}
                      onChange={(e) => setReturnReason(e.target.value)}
                      required
                    >
                      <option value="">Select a reason</option>
                      <option value="Return Equipment Early">Return Equipment Early</option>
                      <option value="Delayed Return / Overdue Pick-up">Delayed Return / Overdue Pick-up</option>
                      <option value="Rental Period Ended (Standard Return)">Rental Period Ended (Standard Return)</option>
                      <option value="Defective / Not Working / Damaged">Defective / Not Working / Damaged</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Return Date Picker */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#555",
                        marginBottom: "6px",
                        display: "block",
                      }}
                    >
                      Return / Pick-up Date <span style={{ color: "#dc3545" }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e0f0",
                        fontSize: "13px",
                        color: "#333",
                        background: "#fff",
                        outline: "none",
                      }}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>

                  {/* Comments */}
                  <div style={{ marginBottom: "20px" }}>
                    <label
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#555",
                        marginBottom: "6px",
                        display: "block",
                      }}
                    >
                      Comments / Remarks
                    </label>
                    <textarea
                      rows="3"
                      placeholder="Please add any details regarding the return request..."
                      value={returnComments}
                      onChange={(e) => setReturnComments(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: "8px",
                        border: "1px solid #e2e0f0",
                        fontSize: "13px",
                        color: "#333",
                        resize: "none",
                        outline: "none",
                      }}
                    />
                  </div>

                  {/* Submit button */}
                  <div style={{ marginTop: "24px" }}>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        border: "none",
                        background: "#8059ca",
                        color: "#fff",
                        fontWeight: "600",
                        fontSize: "14px",
                        cursor: "pointer",
                      }}
                    >
                      {isSubmitting ? "Submitting..." : "Submit Return Request"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RentalBooking;
