import React, { useState, useEffect, useRef, useMemo } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import AppointmentFamilyInvoiceTemplate from "../invoices/AppointmentFamilyInvoiceTemplate";
import AppointmentItemInvoiceTemplate from "../invoices/AppointmentItemInvoiceTemplate";
import { axiosUserInstance, axiosCommonInstance } from "../../../../Apiservice";
import VendorCalendarSlotPicker from "../../../../components/VendorCalendarSlotPicker";
import { getImageUrl } from "../../../../utils/index";
import { useResponsive } from "../../../../hooks/useResponsive";
import { toast } from "react-hot-toast";
import OrderFeedbackOffcanvas from "../AppointmentFeedbackModal";
import AppointmentOrderCard from "./components/AppointmentOrderCard";
import { useNavigate } from "react-router";


// Styles migrated to Tailwind CSS


const getOrderStatusMeta = (status) => {
  const orderStatus = status?.toLowerCase() || "";
  const isProcessing = orderStatus === "new" || orderStatus === "pending";
  const isDelivered =
    orderStatus === "completed" || orderStatus === "delivered";
  const isConfirmed = orderStatus === "confirmed";
  const isCancelled = orderStatus === "cancelled" || orderStatus === "canceled";
  const isFailed = orderStatus === "failed";
  const isSampleCollected = orderStatus === "sample_collected";
  const isSampleNotCollected = orderStatus === "sample_not_collected";

  if (isDelivered) {
    return {
      badgeClass: "delivered",
      label: orderStatus === "completed" ? "Completed" : "Delivered",
    };
  }
  if (isConfirmed) {
    return { badgeClass: "confirmed", label: "Confirmed" };
  }
  if (isCancelled) {
    return { badgeClass: "cancelled", label: "Cancelled" };
  }
  if (isFailed) {
    return { badgeClass: "failed", label: "Failed" };
  }
  if (isSampleCollected) {
    return { badgeClass: "sample-collected", label: "Sample Collected" };
  }
  if (isSampleNotCollected) {
    return { badgeClass: "sample-not-collected", label: "Sample Not Collected" };
  }
  if (isProcessing) {
    return { badgeClass: "processing", label: "Processing" };
  }
  return {
    badgeClass: "in-progress",
    label: orderStatus ? "In Progress" : "N/A",
  };
};

const parseOrderDate = (dateValue) => {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [year, month, day] = dateValue.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  const parsed = new Date(dateValue);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const formatDateForApi = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatOrderAppointmentLabel = (order) => {
  try {
    const dateLabel = parseOrderDate(order?.selectedDate).toLocaleDateString(
      "en-US",
      { year: "numeric", month: "short", day: "numeric" },
    );
    return `${dateLabel} (${order?.selectedTimeSlot || ""})`;
  } catch {
    return `${order?.selectedDate || ""} (${order?.selectedTimeSlot || ""})`;
  }
};

const getOrderItems = (order) => {
  if (Array.isArray(order?.items) && order.items.length > 0) {
    return order.items;
  }

  if (Array.isArray(order?.groupDetails)) {
    return order.groupDetails.flatMap((group) => group.items || []);
  }

  return [];
};

const AppoitmentsOrders = ({ HomeNavigate, ServiceTabs }) => {
  const invoiceRef = useRef();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("upcoming");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReportOrder, setSelectedReportOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleOrder, setRescheduleOrder] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleTimeSlot, setRescheduleTimeSlot] = useState("");
  const [rescheduleCalendarDays, setRescheduleCalendarDays] = useState([]);
  const [rescheduleCalendarMonth, setRescheduleCalendarMonth] = useState(null);
  const [rescheduleCalendarYear, setRescheduleCalendarYear] = useState(null);
  const [rescheduleTimingsLoading, setRescheduleTimingsLoading] =
    useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleModalKey, setRescheduleModalKey] = useState(0);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [reportDropdownList, setReportDropdownList] = useState([]);
  const productDropdownRef = useRef(null);

  const [formData, setFormData] = useState({
    product: [],
    category: "",
    subject: "",
    description: "",
    priority: "",
    attachments: [],
  });
  const [showVendorModal, setShowVendorModal] = useState(false);
  const [selectedVendorOrder, setSelectedVendorOrder] = useState(null);
  const [selectedTabType, setSelectedTabType] = useState("all");
  const { isMobile } = useResponsive();
  const navigate = useNavigate()
  const ordersPerPage = 4;

  const isFamilyInvoice = (order) =>
    Array.isArray(order?.groupDetails) && order.groupDetails.length > 0;

  const createInvoiceOrder = (order) => {
    if (!order) return null;
    return typeof structuredClone === "function"
      ? structuredClone(order)
      : JSON.parse(JSON.stringify(order));
  };



  const downloadInvoice = async () => {
    try {
      const element = invoiceRef.current;
      const invoiceRect = element?.getBoundingClientRect();
      const scale = 2;

      // Find all elements we want to avoid breaking (patient cards & billing summary)
      const avoidElements = element?.querySelectorAll(".invoice-patient-card, [data-invoice-billing-summary]");
      const avoidOffsets = avoidElements && invoiceRect
        ? Array.from(avoidElements).map(el => {
          const rect = el.getBoundingClientRect();
          return {
            top: Math.max(0, Math.round((rect.top - invoiceRect.top) * scale)),
            bottom: Math.max(0, Math.round((rect.bottom - invoiceRect.top) * scale)),
            height: Math.round(rect.height * scale)
          };
        })
        : [];

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

        // If nextY intersects any of our avoidElements, split before that element starts
        for (const range of avoidOffsets) {
          if (nextY > range.top && nextY < range.bottom && currentY < range.top) {
            nextY = range.top;
            break;
          }
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

      pdf.save(`Invoice_${invoiceOrder?.orderId || selectedOrder?.orderId || "invoice"}.pdf`);
      toast.dismiss();
    } catch (error) {
      console.error(error);
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
        search: searchTerm,
        servicefixedTypes: selectedTabType,
      });

      const res = await axiosUserInstance.get(
        `orders/list/appointment?${params.toString()}`,
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
    fetchOrders(currentPage, selectedTab, searchTerm);
  }, [currentPage, selectedTab, searchTerm, selectedTabType]);

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

  const filteredOrders = orders.filter((order) => {
    if (!order.createdAt) return false;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesOrderId = order.orderId?.toLowerCase().includes(searchLower);

      const matchesItemName = order.groupDetails?.some((item) => {
        const itemName =
          item?.items?.[0]?.productSnapshot?.productname ||
          item?.items?.[0]?.productSnapshot?.productDetails?.tabletDetails
            ?.name ||
          item?.packageDetails?.name ||
          "";
        return itemName.toLowerCase().includes(searchLower);
      });

      if (!matchesOrderId && !matchesItemName) return false;
    }

    return true;
  });

  const currentOrders = filteredOrders;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleView = (order) => {
    setSelectedOrder(order);
    setInvoiceOrder(createInvoiceOrder(order));
    setShowModel(true);
  };

  const handleReview = (order) => {

    // console.log("order ", order)



    setSelectedReviewOrder(order);
    setShowReviewModal(true);
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

  const fetchVendorCalendar = async (order, month, year) => {
    // console.log("fetchVendorCalendar called with order:", order, "month:", month, "year:", year);
    // const resolvedVendors = getOrderVendors(order);
    const vendorId = order?.groupDetails?.[0]?.items?.[0]?.vendorId || order?.groupDetails?.[0]?.items?.[0]?.productSnapshot?.vendorId || order?.items?.[0]?.productSnapshot?.vendorId || order?.vendorId;

    // console.log("Resolved vendorId:", vendorId);
    if (!vendorId) {
      console.warn("No vendorId resolved for order!");
      return { days: [], month, year };
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      // console.log("Calling getvendortimings API with vendorId:", vendorId, "month:", month, "year:", year);
      const res = await axiosCommonInstance.get("getvendortimings", {
        params: {
          month,
          year,
          vendorId,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      // console.log("getvendortimings API response:", res.data);
      const calendarData = res.data?.data || {};
      return {
        days: calendarData.days || [],
        month: calendarData.month || month,
        year: calendarData.year || year,
      };
    } catch (error) {
      console.error("Error in fetchVendorCalendar:", error);
      toast.error(
        error?.response?.data?.message ||
        "Failed to load vendor calendar. Please try again.",
      );
      return { days: [], month, year };
    }
  };

  const loadRescheduleCalendar = async (order, date) => {
    const targetDate = date || new Date();
    const month = targetDate.getMonth() + 1;
    const year = targetDate.getFullYear();

    setRescheduleTimingsLoading(true);
    try {
      const calendarData = await fetchVendorCalendar(order, month, year);
      setRescheduleCalendarDays(calendarData.days);
      setRescheduleCalendarMonth(calendarData.month);
      setRescheduleCalendarYear(calendarData.year);
    } finally {
      setRescheduleTimingsLoading(false);
    }
  };

  const handleOpenReschedule = async (order) => {
    const initialDate = parseOrderDate(order.selectedDate);
    setRescheduleOrder(order);
    setRescheduleDate(initialDate);
    setRescheduleTimeSlot(order.selectedTimeSlot || "");
    setRescheduleCalendarDays([]);
    setRescheduleCalendarMonth(null);
    setRescheduleCalendarYear(null);
    setRescheduleModalKey((prev) => prev + 1);
    setShowRescheduleModal(true);
    await loadRescheduleCalendar(order, initialDate);
  };

  const handleRescheduleMonthChange = async (month, year) => {
    if (!rescheduleOrder) return;
    await loadRescheduleCalendar(rescheduleOrder, new Date(year, month - 1, 1));
  };

  const submitRescheduleOrder = async (order, date, timeSlot) => {
    const orderId = order?._id || order?.id;
    if (!orderId || !date || !timeSlot) {
      toast.error("Please select a date and time slot");
      return false;
    }

    const res = await axiosUserInstance.post(
      `orders/reschedule/${orderId}`,
      {
        selectedDate: formatDateForApi(date),
        selectedTimeSlot: timeSlot,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (res.data?.success === false) {
      toast.error(res.data?.message || "Failed to reschedule appointment");
      return false;
    }

    toast.success(res.data?.message || "Appointment rescheduled successfully");
    return true;
  };

  const handleRescheduleConfirm = async (date, timeSlot) => {
    if (!rescheduleOrder || !date || !timeSlot || isRescheduling) return;

    setIsRescheduling(true);
    try {
      const success = await submitRescheduleOrder(
        rescheduleOrder,
        date,
        timeSlot,
      );
      if (success) {
        setShowRescheduleModal(false);
        setRescheduleOrder(null);
        fetchOrders(currentPage, selectedTab);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
        "Failed to reschedule appointment. Please try again.",
      );
    } finally {
      setIsRescheduling(false);
    }
  };

  const onFormChange = (e) => {
    const { name, value, type } = e.target;
    if (name === "product" && type === "select-multiple") {
      const selectedOptions = Array.from(e.target.selectedOptions, (option) => option.value);
      setFormData((prev) => ({
        ...prev,
        [name]: selectedOptions,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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
      let vendorId = firstMatchedProduct?.vendorId ||
        selectedReportOrder?.groupDetails?.[0]?.items?.[0]?.vendorId ||
        selectedReportOrder?.items?.[0]?.vendorId;

      const formDataPayload = new FormData();
      formDataPayload.append("orderId", selectedReportOrder.orderId || "");
      formDataPayload.append("productId", JSON.stringify(selectedProducts));
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

  const productSubtotal = selectedOrder?.subtotal || 0;
  const deliveryFee = selectedOrder?.samplecollection || 0;
  const cgstAmount = selectedOrder?.cgst || 0;
  const sgstAmount = selectedOrder?.sgst || 0;
  const gstAmount = selectedOrder?.tax || 0;
  const grandTotal = selectedOrder?.total || 0;
  const patientCount =
    selectedOrder?.groups && selectedOrder.groups.length > 0
      ? selectedOrder.groups.length
      : 1;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTab]);

  useEffect(() => { }, [showReviewModal]);


  // Styles elements removed


  const resolveOrderImage = (order) => {
    const item = getOrderItems(order)[0];

    if (
      Array.isArray(
        item?.productSnapshot?.imageUrl,
      ) &&
      item?.productSnapshot?.imageUrl?.length > 0
    ) {
      return getImageUrl(
        item?.productSnapshot?.imageUrl?.[0],
      );
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

    return "/assets/img/placeholder.png";
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

  const getOrderVendors = (order) => {
    const seen = new Set();
    const vendors = [];

    getOrderItems(order).forEach((item) => {
      const vendor = resolveItemVendor(item);
      if (!vendor) return;

      const key = String(vendor.vendorId || vendor.name);
      if (seen.has(key)) return;

      seen.add(key);
      vendors.push(vendor);
    });

    return vendors;
  };

  const getOrderItemName = (item) => {
    return (
      item?.productSnapshot?.name ||
      item?.productDetails?.tabletdetails?.name ||
      item?.packageDetails?.name ||
      "N/A"
    );
  };

  const renderOrderItemCard = (orderItem, key) => {
    const name = getOrderItemName(orderItem);
    // const vendorName = resolveItemVendor(orderItem)?.name || "N/A";
    const vendorName = orderItem?.productSnapshot?.vendorDetails?.[0]?.name;
    console.log("vendor name", vendorName)
    const originalPrice =
      orderItem?.billingSummary?.basePrice ||
      orderItem?.productSnapshot?.price ||
      orderItem?.productSnapshot?.variantDetails?.[0]?.price ||
      orderItem?.productDetails?.price ||
      orderItem?.packageDetails?.price ||
      0;
    const discountPrice =
      orderItem?.billingSummary?.unitPrice ||
      orderItem?.discountprice ||
      orderItem?.productDetails?.variantDetails?.[0]?.discountprice ||
      orderItem?.packageDetails?.discountprice ||
      0;
    const effectivePrice = discountPrice || originalPrice;
    const hasDiscount = !!discountPrice && discountPrice < originalPrice;
    const discountPct =
      hasDiscount && originalPrice > 0
        ? Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
        : 0;
    const itemTotal = (orderItem?.billingSummary?.baseAmount) || (effectivePrice * (orderItem?.quantity || 0)).toFixed(2);
    const status = orderItem?.orderStatus || "";
    const statusStyle =
      status.toLowerCase() === "completed" || status.toLowerCase() === "delivered"
        ? { bg: "#d1fae5", color: "#065f46" }
        : status.toLowerCase() === "cancelled" || status.toLowerCase() === "canceled"
          ? { bg: "#fee2e2", color: "#991b1b" }
          : status.toLowerCase() === "sample_collected"
            ? { bg: "#f3effa", color: "#8059ca" }
            : status.toLowerCase() === "sample_not_collected"
              ? { bg: "#fef3c7", color: "#92400e" }
              : { bg: "#fef3c7", color: "#92400e" };

    return (
      <div
        key={key}
        style={{
          display: "flex",
          gap: "14px",
          padding: "14px",
          background: "#fff",
          border: "1px solid #f1eaff",
          borderRadius: "14px",
          alignItems: "flex-start",
          boxShadow: "0 8px 20px rgba(109, 40, 217, 0.05)",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "12px",
            border: "1px solid #efe7ff",
            background: "#faf7ff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          <img
            src={resolveOrderItemImage(orderItem)}
            alt="product"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
            }}
          />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "4px",
            }}
          >
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                fontSize: "13.5px",
                color: "#1e1b4b",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                textTransform: "capitalize",
              }}
            >
              {name.length > 30 ? name.slice(0, 30) + "…" : name}
            </p>
            {/* {status && (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: "5px",
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  flexShrink: 0,
                  textTransform: "capitalize",
                }}
              >
                {status}
              </span>
            )} */}
          </div>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: "11.5px",
              color: "#7c3aed",
              fontWeight: 600,
              textTransform: "capitalize",
            }}
          >
            <i
              className="fas fa-hospital"
              style={{ marginRight: "5px", fontSize: "10px" }}
            />
            {vendorName}
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: "11.5px", color: "#64748b" }}>
              Qty:{" "}
              <strong style={{ color: "#334155" }}>
                {orderItem?.quantity}
              </strong>
            </span>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "5px",
              }}
            >
              {hasDiscount && (
                <span
                  style={{
                    fontSize: "11px",
                    color: "#94a3b8",
                    textDecoration: "line-through",
                  }}
                >
                  ₹{originalPrice}
                </span>
              )}
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color: "#16a34a",
                }}
              >
                ₹
                {effectivePrice.toFixed
                  ? effectivePrice.toFixed(2)
                  : effectivePrice}
              </span>
              {hasDiscount && (
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    color: "#ef4444",
                    background: "#fee2e2",
                    padding: "1px 5px",
                    borderRadius: "4px",
                  }}
                >
                  {discountPct}% off
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right", alignSelf: "flex-end", flexShrink: 0 }}>
          <div
            style={{
              fontSize: "11px",
              color: "#94a3b8",
              marginBottom: "2px",
            }}
          >
            Total
          </div>
          <div
            style={{
              fontWeight: 800,
              fontSize: "14.5px",
              color: "#7c3aed",
            }}
          >
            ₹{itemTotal}
          </div>
        </div>
      </div>
    );
  };

  const getPatientName = (group, order) => {
    if (group.selectType === "self") {
      return order.userDetails
        ? `${order.userDetails.first_name || ""} ${order.userDetails.last_name || ""}`.trim() ||
        "Self"
        : "Self";
    }
    if (group.selectType === "family") {
      const member = order.familyDetails?.find(
        (m) => String(m._id) === String(group.patientId),
      );
      return member
        ? `${member.name} (${member.relationship})`
        : "Family Member";
    }
    return "Unknown Patient";
  };

  return (
    <div className="w-full">
      <div className="col-lg-12">
        {/* Header */}
        <div className="mb-5 mt-2">
          {/* Main header row */}
          <div className="flex items-center justify-between gap-3">
            {/* Left: icon + title */}
            <div className="flex items-center gap-3 min-w-0">
              <i className="fa-solid fa-calendar-check text-[#8059ca] text-[20px] shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <h4 className="m-0 text-slate-800 font-bold text-[16px] md:text-[18px] tracking-tight leading-none">My Appointments</h4>
                <p className="text-slate-500 text-[11px] md:text-[12px] m-0 font-medium hidden sm:block">
                  View and manage all your appointments
                </p>
              </div>
            </div>
            {/* Right: search (desktop) + HomeNavigate (hamburger on mobile, home icon always) */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="relative hidden sm:block w-[240px]">
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
          {/* Mobile-only: subtitle + full-width search bar */}
          <div className="sm:hidden mt-2 flex flex-col gap-2">
            <p className="text-slate-500 text-[11px] m-0 font-medium">
              View and manage all your appointments
            </p>
            <div className="relative w-full">
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
          {ServiceTabs?.filter(
            (item) =>
              item?.categoryType === "slots" ||
              item?.categoryType === "cartslots" ||
              item?.categoryType === "all",
          ).map((service) => (
            <button
              key={service?._id}
              type="button"
              onClick={() => setSelectedTabType(service?.fixedType)}
              style={{
                padding: "10px 18px",
                borderRadius: "10px",
                border:
                  selectedTabType === service?.fixedType
                    ? "1px solid #8059ca"
                    : "1px solid #e5e7eb",
                backgroundColor:
                  selectedTabType === service?.fixedType
                    ? "#8059ca"
                    : "#ffffff",
                color:
                  selectedTabType === service?.fixedType
                    ? "#ffffff"
                    : "#374151",
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

        {/* Tabs Section */}
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
            {/* Mobile */}
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
                  { id: "upcoming", label: "Upcoming Appointments" },
                  { id: "past", label: "Past Appointments" },
                  { id: "failed", label: "Failed" },
                  { id: "cancelled", label: "Cancelled" },
                ].map((tab) => {
                  return (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
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
                  {
                    id: "upcoming",
                    label: "Upcoming Appointments",
                    icon: "fa-calendar-alt",
                  },
                  {
                    id: "past",
                    label: "Past Appointments",
                    icon: "fa-history",
                  },
                  {
                    id: "cancelled",
                    label: "Cancelled",
                    icon: "fa-times-circle",
                  },
                  {
                    id: "failed",
                    label: "Failed",
                    icon: "fa-circle-exclamation",
                  },
                ].map((tab) => {
                  const isActive = selectedTab === tab.id;

                  return (
                    <li className="nav-item" key={tab.id}>
                      <button
                        className={`nav-link ${isActive ? "active" : ""}`}
                        onClick={() => {
                          setSelectedTab(tab.id);
                          setCurrentPage(1);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        <i className={`fa-solid ${tab.icon}`}></i>
                        {tab.label}
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
                return (
                  <div key={index} className="col-md-6 col-12 mb-4">
                    <AppointmentOrderCard
                      order={order}
                      onView={handleView}
                      onInvoice={(ord) => {
                        if (typeof toast.loading === "function") {
                          toast.loading("Generating invoice PDF. Please wait...");
                        } else if (typeof toast === "function") {
                          toast("Generating invoice PDF. Please wait...");
                        } else if (toast && typeof toast.success === "function") {
                          toast.success("Generating invoice PDF. Please wait...");
                        }
                        setSelectedOrder(ord);
                        setInvoiceOrder(createInvoiceOrder(ord));
                        setTimeout(() => downloadInvoice(), 100);
                      }}
                      onReschedule={handleOpenReschedule}
                      onReview={handleReview}
                      onReportIssue={handleReportIssue}
                      resolveOrderImage={resolveOrderImage}
                      getOrderVendors={getOrderVendors}
                      getOrderStatusMeta={getOrderStatusMeta}
                      selectedFilterTab={selectedTab}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="empty-state">
                <i
                  className="fa-solid fa-calendar-times fa-3x text-muted mb-3"
                  style={{ color: "#8059ca" }}
                ></i>
                <h5 className="text-muted">No appointments found</h5>
                {/* <p className="text-muted">
                      You haven't booked any appointments yet.
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
              }}
            >
              {/* HEADER */}
              <div style={{
                padding: "18px 20px 14px", borderBottom: "1px solid #f0f0f0",
                display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0,
              }}>
                <div>
                  <div className="d-flex align-items-center gap-2 flex-wrap">
                    <div style={{ fontWeight: 700, fontSize: "16px", color: "#222" }}>Appointment Details</div>
                    {selectedOrder && (
                      <span
                        className={`status-badge ${getOrderStatusMeta(selectedOrder.orderStatus).badgeClass}`}
                        style={{ fontSize: "10px", padding: "2px 8px" }}
                      >
                        {getOrderStatusMeta(selectedOrder.orderStatus).label || "N/A"}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "11px", color: "#888", marginTop: "2px" }}>#{selectedOrder?.orderId || "N/A"}</div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {/* <button
                        onClick={downloadInvoice}
                        style={{
                          background: "#f5f3ff", border: "none", borderRadius: "8px",
                          padding: "6px 12px", display: "flex", alignItems: "center",
                          gap: "6px", cursor: "pointer", color: "#8059ca", fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        <i className="fas fa-file-download" /> Invoice
                      </button> */}
                  <button onClick={() => setShowModel(false)} style={{
                    background: "#f5f3ff", border: "none", borderRadius: "50%",
                    width: "30px", height: "30px", display: "flex", alignItems: "center",
                    justifyContent: "center", cursor: "pointer", color: "#8059ca", fontSize: "18px", flexShrink: 0,
                  }}>&times;</button>
                </div>
              </div>

              {/* SCROLLABLE BODY */}
              <div style={{ overflowY: "auto", flex: 1, padding: "20px" }}>

                {/* ITEMS */}
                {selectedOrder?.groupDetails?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                      Patients & Tests
                    </div>
                    {selectedOrder.groupDetails.map((group, groupIndex) => {
                      const groupItems = group?.items || [];
                      const patientName =
                        group?.patientDetails?.name ||
                        getPatientName(group, selectedOrder) ||
                        `Patient ${groupIndex + 1}`;
                      const patientRelationship = group?.patientDetails?.relationship || "";

                      return (
                        <div key={group._id || groupIndex} style={{
                          background: "#faf9fe", border: "1px solid #f1eff9",
                          borderRadius: "12px", padding: "12px", marginBottom: "12px",
                        }}>
                          <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                            <div className="d-flex align-items-center gap-2">
                              <div style={{
                                width: "28px", height: "28px", borderRadius: "50%",
                                background: "#efe7ff", color: "#8059ca", display: "flex",
                                alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px"
                              }}>
                                {(patientName || "P").charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span style={{ fontSize: "13px", fontWeight: 600, color: "#333", textTransform: "capitalize" }}>{patientName}</span>
                                {patientRelationship && (
                                  <span style={{ fontSize: "10px", color: "#8059ca", background: "#f5f3ff", padding: "1px 6px", borderRadius: "10px", marginLeft: "6px", fontWeight: 500, textTransform: "capitalize" }}>
                                    {patientRelationship}
                                  </span>
                                )}
                              </div>
                            </div>
                            {group.totalTests != null && (
                              <span style={{ fontSize: "11px", fontWeight: 600, color: "#8059ca", background: "#f5f3ff", padding: "2px 8px", borderRadius: "6px" }}>
                                {group.totalTests} {group.totalTests === 1 ? "Test" : "Tests"}
                              </span>
                            )}
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {groupItems.length > 0 ? (
                              groupItems.map((orderItem, itemIndex) =>
                                renderOrderItemCard(orderItem, `${groupIndex}-${itemIndex}`)
                              )
                            ) : (
                              <div style={{ fontSize: "12px", color: "#999", padding: "8px", textAlign: "center" }}>
                                No products found for this member.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}


                {selectedOrder?.items?.length > 0 && (
                  <div style={{ marginBottom: "20px" }}>
                    {selectedOrder.items.map((group, groupIndex) => {
                      return (
                        <div key={group._id || groupIndex} style={{
                          background: "#faf9fe", border: "1px solid #f1eff9",
                          borderRadius: "12px", padding: "12px", marginBottom: "12px",
                        }}>
                          {/* <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
                                <div className="d-flex align-items-center gap-2">
                                  <div style={{
                                    width: "28px", height: "28px", borderRadius: "50%",
                                    background: "#efe7ff", color: "#8059ca", display: "flex",
                                    alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "12px"
                                  }}>
                                    {(patientName || "P").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <span style={{ fontSize: "13px", fontWeight: 600, color: "#333" }}>{patientName}</span>
                                    {patientRelationship && (
                                      <span style={{ fontSize: "10px", color: "#8059ca", background: "#f5f3ff", padding: "1px 6px", borderRadius: "10px", marginLeft: "6px", fontWeight: 500 }}>
                                        {patientRelationship}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {group.totalTests != null && (
                                  <span style={{ fontSize: "11px", fontWeight: 600, color: "#8059ca", background: "#f5f3ff", padding: "2px 8px", borderRadius: "6px" }}>
                                    {group.totalTests} {group.totalTests === 1 ? "Test" : "Tests"}
                                  </span>
                                )}
                              </div> */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {group && (
                              renderOrderItemCard(group, `${groupIndex}`)  // ✅
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* DOCTOR DETAILS */}
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                    Referral Details
                  </div>
                  <div style={{ background: "#faf9fe", borderRadius: "12px", padding: "12px", border: "1px solid #f1eff9" }}>
                    <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px" }}>Doctor Name</div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#333", textTransform: "capitalize" }}>
                      {selectedOrder?.doctorName && selectedOrder?.doctorId ? selectedOrder.doctorName : "Self Referral"}
                    </div>
                  </div>
                </div>

                {/* APPOINTMENT SCHEDULE */}
                {selectedOrder?.selectedDate && selectedOrder?.selectedTimeSlot && (
                  <div style={{ marginBottom: "20px" }}>
                    <div style={{ fontSize: "10px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                      Appointment Schedule
                    </div>
                    <div className="row g-2">
                      {[
                        {
                          label: "Selected Date",
                          value: (() => {
                            try {
                              const d = new Date(selectedOrder.selectedDate);
                              return isNaN(d.getTime())
                                ? selectedOrder.selectedDate
                                : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
                            } catch (_) {
                              return selectedOrder.selectedDate;
                            }
                          })()
                        },
                        { label: "Selected Slot", value: selectedOrder.selectedTimeSlot },
                      ].map(({ label, value }) => (
                        <div className="col-6" key={label}>
                          <div style={{ background: "#faf9fe", borderRadius: "8px", padding: "8px 12px", border: "1px solid #f1eff9" }}>
                            <div style={{ fontSize: "10px", color: "#aaa", marginBottom: "2px" }}>{label}</div>
                            <div style={{ fontSize: "12px", fontWeight: 600, color: "#333", textTransform: "capitalize" }}>{value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* BILL SUMMARY */}
                <div>
                  <div style={{ fontSize: "10px", fontWeight: 700, color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: "10px" }}>
                    Bill Summary
                  </div>
                  {(() => {
                    const bs = selectedOrder?.billingSummary || {};
                    const rows = [
                      { label: "Subtotal (Inclusive of all Taxes)", value: bs.subtotal ?? 0 },
                      { label: "Sample Collection Fee", value: bs.sampleCollection ?? bs.samplecollectionCharges ?? 0 },
                      { label: "GST", value: bs?.tax ?? 0 }
                    ].filter(r => Number(r.value) > 0);
                    const coupon = Number(bs.couponAmount || bs?.couponmount || 0);
                    const total = Number(selectedOrder?.billingSummary?.total);
                    const wallet = Number(bs.walletAmount || bs.walletamount || selectedOrder?.walletamount || selectedOrder?.walletAmount || 0);

                    const payMethod = (selectedOrder?.paymentmethod ?? selectedOrder?.paymentMethod ?? "").toLowerCase();
                    const isCOD = payMethod === "cod" || payMethod.includes("cash");
                    const remainingPayable = Math.max(0, total - wallet);

                    const valWithoutCouponAndWithoutWallet = Number(bs.withoutCouponAndWithoutWallet ?? (Number(bs.subtotal || 0) + Number(bs.deliveryCharge ?? bs.deliveryCharges ?? 0) + Number(bs.sampleCollection ?? bs.samplecollectionCharges ?? 0)));
                    const valWithCouponAndWithoutWallet = Number(bs.withCouponAndWithoutWallet ?? (valWithoutCouponAndWithoutWallet - coupon));
                    const valWithoutCouponAndWithWallet = Number(bs.withoutCouponAndWithWallet ?? (valWithoutCouponAndWithoutWallet - wallet));
                    const valWithCouponAndWithWallet = Number(bs.withCouponAndWithWallet ?? (valWithCouponAndWithoutWallet - wallet));

                    return (
                      <div style={{ background: "#faf9fe", borderRadius: "12px", padding: "14px 16px", border: "1px solid #f1eff9" }}>
                        {rows.map(({ label, value }) => (
                          <div key={label} className="d-flex justify-content-between align-items-center" style={{ marginBottom: "9px", fontSize: "13px" }}>
                            <span style={{ color: "#666" }}>{label}</span>
                            <span style={{ fontWeight: 500 }}>₹{Number(value).toFixed(2)}</span>
                          </div>
                        ))}
                        {coupon > 0 && (
                          <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "9px", fontSize: "13px", color: "#28a745" }}>
                            <span>Coupon Discount</span>
                            <span style={{ fontWeight: 600 }}>-₹{coupon.toFixed(2)}</span>
                          </div>
                        )}
                        {wallet > 0 && (
                          <div className="d-flex justify-content-between align-items-center" style={{ marginBottom: "9px", fontSize: "13px", color: "#28a745" }}>
                            <span>Wallet Deduction</span>
                            <span style={{ fontWeight: 600 }}>-₹{wallet.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="d-flex justify-content-between align-items-center" style={{ borderTop: "1.5px dashed #e0daf5", paddingTop: "12px", marginTop: "6px", fontSize: "15px", fontWeight: 700 }}>
                          <span style={{ color: "#333" }}>{wallet > 0 ? "Total Value" : "Total Amount"}</span>
                          <span style={{ color: wallet > 0 ? "#333" : "#7c4dc4", fontSize: "16px" }}>₹{total.toFixed(2)}</span>
                        </div>
                        {/* 
                            {wallet > 0 && remainingPayable > 0 && !isCOD && (
                              <div className="d-flex justify-content-between align-items-center" style={{ marginTop: "8px", fontSize: "15px", fontWeight: 800, color: "#7c4dc4" }}>
                                <span>{isCOD ? "Payable via Cash" : "Payable via Online"}</span>
                                <span style={{ fontSize: "17px" }}>₹{remainingPayable.toFixed(2)}</span>
                              </div>
                            )} */}

                        {/* Detailed Breakdown for Clarification */}
                        {/* <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "10px", marginTop: "12px" }}>
                              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#64748b", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Billing Breakdown (Clarification)</div>
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#f1f5f9", padding: "10px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#475569" }}>
                                  <span>Without Coupon & Without Wallet</span>
                                  <span style={{ fontWeight: 600 }}>₹{valWithoutCouponAndWithoutWallet.toFixed(2)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#475569" }}>
                                  <span>With Coupon & Without Wallet</span>
                                  <span style={{ fontWeight: 600 }}>₹{valWithCouponAndWithoutWallet.toFixed(2)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#475569" }}>
                                  <span>Without Coupon & With Wallet</span>
                                  <span style={{ fontWeight: 600 }}>₹{valWithoutCouponAndWithWallet.toFixed(2)}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", color: "#475569" }}>
                                  <span>With Coupon & With Wallet (Amount to Pay)</span>
                                  <span style={{ fontWeight: 700, color: "#7c4dc4" }}>₹{valWithCouponAndWithWallet.toFixed(2)}</span>
                                </div>
                              </div>
                            </div> */}
                      </div>
                    );
                  })()}
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
              <div
                className="modal-content"
                style={{
                  borderRadius: "16px",
                  border: "none",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
                }}
              >
                {/* HEADER */}
                <div
                  className="modal-header d-flex justify-content-between align-items-center"
                  style={{
                    padding: "20px 24px 16px",
                    borderBottom: "1px solid #f0f0f0",
                  }}
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
                            <span
                              style={{ fontSize: "11px", color: "#888" }}
                            >
                              ID: {vendor.vendorId || "N/A"}
                            </span>
                          </div>
                        </div>

                        <div
                          className="pt-2"
                          style={{ borderTop: "1px dashed #eaeaea" }}
                        >
                          {vendor.phone && (
                            <div
                              className="d-flex align-items-center gap-2 mb-2"
                              style={{ fontSize: "12px", color: "#555" }}
                            >
                              <i
                                className="fa-solid fa-phone"
                                style={{ color: "#8059ca", width: "16px" }}
                              />
                              <span>{vendor.phone}</span>
                            </div>
                          )}
                          {vendor.email && (
                            <div
                              className="d-flex align-items-center gap-2 mb-2"
                              style={{ fontSize: "12px", color: "#555" }}
                            >
                              <i
                                className="fa-solid fa-envelope"
                                style={{ color: "#8059ca", width: "16px" }}
                              />
                              <span style={{ wordBreak: "break-all" }}>
                                {vendor.email}
                              </span>
                            </div>
                          )}
                          {vendor.address && (
                            <div
                              className="d-flex align-items-start gap-2 mb-2"
                              style={{ fontSize: "12px", color: "#555" }}
                            >
                              <i
                                className="fa-solid fa-location-dot"
                                style={{
                                  color: "#8059ca",
                                  width: "16px",
                                  marginTop: "3px",
                                }}
                              />
                              <span>{vendor.address}</span>
                            </div>
                          )}
                          {(vendor.location?.coordinates?.length === 2 ||
                            vendor.address) && (
                              <div className="mt-3">
                                <a
                                  href={
                                    vendor.location?.coordinates?.length === 2
                                      ? `https://www.google.com/maps/search/?api=1&query=${vendor.location.coordinates[1]},${vendor.location.coordinates[0]}`
                                      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center gap-2"
                                  style={{
                                    fontSize: "12px",
                                    padding: "6px 12px",
                                    borderRadius: "8px",
                                    borderColor: "#8059ca",
                                    color: "#8059ca",
                                    fontWeight: "600",
                                    backgroundColor: "transparent",
                                  }}
                                >
                                  <i className="fa-solid fa-map-location-dot"></i>
                                  Show Maps
                                </a>
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

        {/* Review Modal */}
        <OrderFeedbackOffcanvas
          isOpen={showReviewModal}
          toggle={() => setShowReviewModal(!showReviewModal)}
          order={selectedReviewOrder}
          onReviewSubmitted={(orderId) => {
            setOrders((prevOrders) =>
              prevOrders.map((ord) =>
                ord._id === orderId || ord.orderId === orderId
                  ? { ...ord, isRated: true }
                  : ord,
              ),
            );

            setSelectedReviewOrder((prev) =>
              prev
                ? {
                  ...prev,
                  isRated: true,
                }
                : prev,
            );
          }}
        />

        {/* Reschedule Modal */}
        {showRescheduleModal && (
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
            <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
              <div className="modal-content border-0 rounded-4">
                <div className="modal-header border-0 pb-0">
                  <div>
                    <h5 className="fw-bold mb-1">Reschedule Appointment</h5>
                    <p
                      className="text-muted mb-0"
                      style={{ fontSize: "13px" }}
                    >
                      Order #{rescheduleOrder?.orderId}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowRescheduleModal(false)}
                    disabled={isRescheduling}
                  />
                </div>
                <div className="modal-body pt-3">
                  <div
                    className="mb-3 p-3 rounded-3"
                    style={{
                      background: "#f8f5ff",
                      border: "1px solid #e9ddff",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#8059ca",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.4px",
                      }}
                    >
                      Current Appointment
                    </div>
                    <div
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: "#333",
                        marginTop: "4px",
                      }}
                    >
                      {formatOrderAppointmentLabel(rescheduleOrder)}
                    </div>
                  </div>

                  <div style={{ position: "relative", minHeight: "330px" }}>
                    <VendorCalendarSlotPicker
                      key={`reschedule-${rescheduleOrder?._id}-${rescheduleModalKey}-${rescheduleCalendarMonth}-${rescheduleCalendarYear}`}
                      layout="column"
                      selectedDate={rescheduleDate}
                      selectedTimeSlot={rescheduleTimeSlot}
                      calendarDays={rescheduleCalendarDays}
                      calendarMonth={rescheduleCalendarMonth}
                      calendarYear={rescheduleCalendarYear}
                      isLoading={rescheduleTimingsLoading}
                      onMonthChange={handleRescheduleMonthChange}
                      confirmLabel="Confirm Reschedule"
                      onSelectSlot={(date, time) => {
                        setRescheduleDate(date);
                        setRescheduleTimeSlot(time);
                        handleRescheduleConfirm(date, time);
                      }}
                    />
                    {isRescheduling && (
                      <div
                        className="position-absolute top-0 start-0 end-0 bottom-0 d-flex align-items-center justify-content-center"
                        style={{
                          background: "rgba(255,255,255,0.75)",
                          zIndex: 30,
                          borderRadius: "12px",
                        }}
                      >
                        <div
                          className="spinner-border text-primary"
                          role="status"
                        >
                          <span className="visually-hidden">
                            Rescheduling...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
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

                  {/* Form */}
                  <form onSubmit={handleSubmit}>
                    <div className="row g-3">
                      {/* Product */}
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

                          const selectedNames = (Array.isArray(formData.product) ? formData.product : [])
                            .map(p => `${p.orderName} (${p.patientName})`);

                          return (
                            <div ref={productDropdownRef} style={{ position: "relative" }}>
                              <div
                                onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                                style={{
                                  borderRadius: "8px",
                                  border: "1px solid #e0e0e0",
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
                        <label className="form-label" style={{ fontSize: "14px", fontWeight: "500", color: "#333", marginBottom: "6px" }}>Category *</label>
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
                          <option value="service_delayed">
                            Provider delayed / Did not arrive
                          </option>
                          <option value="results_delayed">
                            Reports / Results delayed
                          </option>
                          <option value="partner_behavior">
                            Provider behavior / Quality issue
                          </option>
                          <option value="billing_payment">
                            Billing, Payment or Refund Issue
                          </option>
                          <option value="rescheduling_issue">
                            Rescheduling issue
                          </option>
                          <option value="cancellation_refund">
                            Cancellation & Refund query
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
                                toast.error(
                                  `${file.name} is too large. Max file size is 5MB.`,
                                );
                              } else {
                                validFiles.push(file);
                              }
                            });

                            setFormData((prev) => ({
                              ...prev,
                              attachments: [
                                ...(prev.attachments || []),
                                ...validFiles,
                              ],
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
                        <div
                          className="text-muted mt-1"
                          style={{ fontSize: "11px" }}
                        >
                          Max file size: 5MB. Multiple files allowed.
                        </div>
                      </div>

                      {formData.attachments &&
                        formData.attachments.length > 0 && (
                          <div className="col-12 mt-2">
                            <label
                              className="form-label d-block mb-1"
                              style={{
                                fontSize: "12px",
                                fontWeight: "600",
                                color: "#666",
                              }}
                            >
                              Selected Attachments (
                              {formData.attachments.length})
                            </label>
                            <div className="d-flex flex-wrap gap-2">
                              {formData.attachments.map(
                                (attachment, index) => {
                                  const objectUrl =
                                    URL.createObjectURL(attachment);
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
                                        boxShadow:
                                          "0 2px 4px rgba(0,0,0,0.05)",
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
                                            attachments:
                                              prev.attachments.filter(
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
                                          boxShadow:
                                            "0 1px 3px rgba(0,0,0,0.2)",
                                        }}
                                      >
                                        <i className="fas fa-times"></i>
                                      </button>
                                    </div>
                                  );
                                },
                              )}
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
          </div>
        )}

        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          {(invoiceOrder || selectedOrder) && (
            isFamilyInvoice(invoiceOrder || selectedOrder) ? (
              <AppointmentFamilyInvoiceTemplate
                ref={invoiceRef}
                order={invoiceOrder || selectedOrder}
              />
            ) : (
              <AppointmentItemInvoiceTemplate
                ref={invoiceRef}
                order={invoiceOrder || selectedOrder}
              />
            )
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
      </div>
    </div>
  );
};

export default AppoitmentsOrders;
