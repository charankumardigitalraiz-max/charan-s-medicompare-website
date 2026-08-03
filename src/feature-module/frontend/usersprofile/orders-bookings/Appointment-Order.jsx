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
import Pagination from "../../../../components/ui/Pagination.jsx";
import OrderFeedbackOffcanvas from "../AppointmentFeedbackModal";
import AppointmentOrderCard from "./components/AppointmentOrderCard";
import { useNavigate } from "react-router";
import BaseModal from "../../../../components/ui/BaseModal";
import { Tabs } from "../../../../components/ui";

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
        className="flex gap-[14px] p-[14px] bg-white border border-[#f1eaff] rounded-[14px] items-start shadow-[0_8px_20px_rgba(109,40,217,0.05)]"
      >
        <div
          className="w-[72px] h-[72px] rounded-[12px] border border-[#efe7ff] bg-[#faf7ff] flex items-center justify-center shrink-0 overflow-hidden"
        >
          <img
            src={resolveOrderItemImage(orderItem)}
            alt="product"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className="flex items-start justify-between gap-2 mb-1"
          >
            <p
              className="m-0 !font-bold !text-[13.5px] !text-[#1e1b4b] truncate flex-1 capitalize"
            >
              {name.length > 30 ? name.slice(0, 30) + "…" : name}
            </p>
          </div>
          <p
            className="m-0 mb-1 !text-[11.5px] !text-[#7c3aed] !font-semibold capitalize"
          >
            <i
              className="fas fa-hospital !mr-1 !text-[10px]"
            />
            {vendorName}
          </p>
          <div
            className="flex items-center gap-3 flex-wrap"
          >
            <span className="text-[11.5px] text-slate-500">
              Qty:{" "}
              <strong className="text-slate-700">
                {orderItem?.quantity}
              </strong>
            </span>
            <div
              className="flex items-center gap-1"
            >
              {hasDiscount && (
                <span
                  className="text-[11px] text-slate-400 line-through"
                >
                  ₹{originalPrice}
                </span>
              )}
              <span
                className="text-[13px] font-bold text-green-600"
              >
                ₹
                {effectivePrice.toFixed
                  ? effectivePrice.toFixed(2)
                  : effectivePrice}
              </span>
              {hasDiscount && (
                <span
                  className="text-[10px] font-bold text-red-500 bg-red-100 px-1 py-0.5 rounded"
                >
                  {discountPct}% off
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="text-right self-end shrink-0">
          <div
            className="text-[11px] text-slate-400 mb-0.5"
          >
            Total
          </div>
          <div
            className="font-extrabold text-[14.5px] text-[#7c3aed]"
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

  const onClose = () => {
    setShowModel(false)
  }

  return (
    <div className="w-full">
      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
          <div className="flex items-center gap-3.5">
            {HomeNavigate && <HomeNavigate />}
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
              <i className="fa-solid fa-calendar-check" />
            </div>


            {/* <div className="flex flex-col gap-1">
              <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                My Appointments
              </div>
              <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                View and manage all your appointments
              </p>
            </div> */}


            <div className="flex flex-col gap-1">
              <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                My Appointments
              </div>
              <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                View and manage all your appointments
              </div>
            </div>

          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[250px] shrink-0">
              <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-[42px] rounded-sm border border-[#e0e0e0] pl-10 pr-4 text-sm w-full outline-none focus:border-[#8059ca] transition-colors"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none">
                <i className="fa-solid fa-search" />
              </span>
            </div>
          </div>
        </div>

        <Tabs
          tabs={ServiceTabs?.filter(
            (item) =>
              item?.categoryType === "slots" ||
              item?.categoryType === "cartslots" ||
              item?.categoryType === "all",
          )}
          activeTab={selectedTabType}
          onChange={setSelectedTabType}
        />

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
                className="w-full h-[38px] rounded-lg border border-slate-200 px-3 text-[13px] outline-none bg-slate-50 focus:bg-white focus:border-[#8059ca] transition-all duration-200"
                onChange={(e) => {
                  setSelectedTab(e.target.value);
                  setCurrentPage(1);
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
              <ul className="flex border-b border-slate-200 w-full mb-0 overflow-visible min-w-0 gap-2 list-none p-0">
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
                        className={`py-2.5 px-4 text-[13px] font-semibold !border-b-2 -mb-[1px] transition-all duration-200 flex items-center gap-1.5 ${isActive ? "!border-[#8059ca] !text-[#8059ca]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                        onClick={() => {
                          setSelectedTab(tab.id);
                          setCurrentPage(1);
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
            <div className="text-center py-10 flex justify-center items-center">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-[#8059ca] border-t-transparent rounded-full" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          ) : currentOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentOrders.map((order, index) => {
                return (
                  <div key={index} className="w-full">
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

          <BaseModal
            show={showModel}
            onClose={onClose}
            title={
              <div className="flex flex-col">
                <span className="text-[15px] md:text-[17px] font-semibold text-slate-900">
                  Appointment Details
                </span>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span
                    className={`inline-flex items-center justify-center text-[10px] leading-[1.35] py-0.5 px-2 rounded-full font-semibold border ${{
                        delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                        cancelled: "bg-red-50 text-red-700 border-red-200",
                        failed: "bg-red-50 text-red-700 border-red-200",
                        "sample-collected": "bg-purple-50 text-purple-700 border-purple-200",
                        "sample-not-collected": "bg-amber-50 text-amber-700 border-amber-200",
                        processing: "bg-orange-50 text-orange-700 border-orange-200",
                        "in-progress": "bg-orange-50 text-orange-700 border-orange-200"
                      }[getOrderStatusMeta(selectedOrder?.orderStatus)?.badgeClass] || "bg-orange-50 text-orange-700 border-orange-200"
                      }`}
                  >
                    {getOrderStatusMeta(selectedOrder?.orderStatus)?.label || "N/A"}
                  </span>

                  <span className="text-[11px] text-slate-500">
                    #{selectedOrder?.orderId || "N/A"}
                  </span>
                </div>
              </div>
            }
            size="lg"
            className="max-w-3xl"
            bodyClassName="!p-4 md:!p-5"
            headerClassName="border-b border-slate-200 pb-4"
          >

            {/* <div
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
              > */}
            {/* HEADER */}
            {/* <div style={{
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
                    <button
                      onClick={downloadInvoice}
                      style={{
                        background: "#f5f3ff", border: "none", borderRadius: "8px",
                        padding: "6px 12px", display: "flex", alignItems: "center",
                        gap: "6px", cursor: "pointer", color: "#8059ca", fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      <i className="fas fa-file-download" /> Invoice
                    </button>
                    <button onClick={() => setShowModel(false)} style={{
                      background: "#f5f3ff", border: "none", borderRadius: "50%",
                      width: "30px", height: "30px", display: "flex", alignItems: "center",
                      justifyContent: "center", cursor: "pointer", color: "#8059ca", fontSize: "18px", flexShrink: 0,
                    }}>&times;</button>
                  </div>
                </div> */}

            {/* SCROLLABLE BODY */}
            <div className="space-y-5">

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
                      <div key={group._id || groupIndex} className="bg-[#faf9fe] border border-[#f1eff9] rounded-xl p-3 mb-3">
                        <div className="flex justify-between items-center mb-2 flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-[#efe7ff] text-[#8059ca] flex items-center justify-center font-bold text-xs">
                              {(patientName || "P").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-slate-700 capitalize">{patientName}</span>
                              {patientRelationship && (
                                <span className="!text-[10px] !text-[#8059ca] bg-[#f5f3ff] px-1.5 py-0.5 rounded-full ml-1.5 !font-medium capitalize">
                                  {patientRelationship}
                                </span>
                              )}
                            </div>
                          </div>
                          {group.totalTests != null && (
                            <span className="text-[11px] font-semibold text-[#8059ca] bg-[#f5f3ff] px-2 py-0.5 rounded-md">
                              {group.totalTests} {group.totalTests === 1 ? "Test" : "Tests"}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          {groupItems.length > 0 ? (
                            groupItems.map((orderItem, itemIndex) =>
                              renderOrderItemCard(orderItem, `${groupIndex}-${itemIndex}`)
                            )
                          ) : (
                            <div className="text-xs text-slate-400 py-2 text-center">
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
                <div className="mb-5">
                  {selectedOrder.items.map((group, groupIndex) => {
                    return (
                      <div key={group._id || groupIndex} className="bg-[#faf9fe] border border-[#f1eff9] rounded-xl p-3 mb-3">
                        <div className="flex flex-col gap-2">
                          {group && (
                            renderOrderItemCard(group, `${groupIndex}`)
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* DOCTOR DETAILS */}
              <div className="mb-5">
                <div className="text-[10px] font-bold text-[#8059ca] uppercase tracking-wider mb-2.5">
                  Referral Details
                </div>
                <div className="bg-[#faf9fe] rounded-xl p-3 border border-[#f1eff9]">
                  <div className="text-[10px] text-slate-400 mb-0.5">Doctor Name</div>
                  <div className="text-xs font-semibold text-slate-700 capitalize">
                    {selectedOrder?.doctorName && selectedOrder?.doctorId ? selectedOrder.doctorName : "Self Referral"}
                  </div>
                </div>
              </div>

              {/* APPOINTMENT SCHEDULE */}
              {selectedOrder?.selectedDate && selectedOrder?.selectedTimeSlot && (
                <div className="mb-5">
                  <div className="text-[10px] font-bold text-[#8059ca] uppercase tracking-wider mb-2.5">
                    Appointment Schedule
                  </div>
                  <div className="grid grid-cols-2 gap-2">
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
                      <div className="w-full" key={label}>
                        <div className="bg-[#faf9fe] rounded-lg p-2 px-3 border border-[#f1eff9]">
                          <div className="text-[10px] text-slate-400 mb-0.5">{label}</div>
                          <div className="text-xs font-semibold text-slate-700 capitalize">{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* BILL SUMMARY */}
              <div>
                <div className="text-[10px] font-bold text-[#8059ca] uppercase tracking-wider mb-2.5">
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
                    <div className="bg-[#faf9fe] rounded-xl p-3 border border-[#f1eff9]">
                      {rows.map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center mb-2.5 text-xs">
                          <span className="text-slate-500">{label}</span>
                          <span className="font-medium text-slate-700">₹{Number(value).toFixed(2)}</span>
                        </div>
                      ))}
                      {coupon > 0 && (
                        <div className="flex justify-between items-center mb-2.5 text-xs text-green-600">
                          <span>Coupon Discount</span>
                          <span className="font-semibold">-₹{coupon.toFixed(2)}</span>
                        </div>
                      )}
                      {wallet > 0 && (
                        <div className="flex justify-between items-center mb-2.5 text-xs text-green-600">
                          <span>Wallet Deduction</span>
                          <span className="font-semibold">-₹{wallet.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center border-t border-dashed border-[#e0daf5] pt-3 mt-1.5 text-[15px] font-bold">
                        <span className="text-slate-800">{wallet > 0 ? "Total Value" : "Total Amount"}</span>
                        <span className={`text-[16px] ${wallet > 0 ? "text-slate-800" : "text-[#7c4dc4]"}`}>₹{total.toFixed(2)}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </BaseModal>
        )}

        {/* Vendor Modal */}
        < BaseModal
          show={showVendorModal && !!selectedVendorOrder}
          onClose={() => {
            setShowVendorModal(false);
            setSelectedVendorOrder(null);
          }}
          title="Order Vendors"
          size="sm"
        >
          <div className="flex flex-col gap-3">
            {getOrderVendors(selectedVendorOrder).map((vendor) => (
              <div
                key={vendor.vendorId || vendor.name}
                className="p-3 border border-slate-100 rounded-xl bg-purple-50/30 shadow-sm"
              >
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={vendor.imageUrl}
                    alt={vendor.name}
                    className="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-[#8059ca]"
                    onError={(e) => {
                      e.currentTarget.src = "/assets/default.png";
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-[15px] text-slate-800 font-semibold">
                      {vendor.name}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ID: {vendor.vendorId || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-dashed border-slate-200">
                  {vendor.phone && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
                      <i className="fa-solid fa-phone text-[#8059ca] w-4" />
                      <span>{vendor.phone}</span>
                    </div>
                  )}
                  {vendor.email && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-slate-600">
                      <i className="fa-solid fa-envelope text-[#8059ca] w-4" />
                      <span className="break-all">{vendor.email}</span>
                    </div>
                  )}
                  {vendor.address && (
                    <div className="flex items-start gap-2 mb-2 text-xs text-slate-600">
                      <i className="fa-solid fa-location-dot text-[#8059ca] w-4 mt-0.5" />
                      <span>{vendor.address}</span>
                    </div>
                  )}
                  {(vendor.location?.coordinates?.length === 2 || vendor.address) && (
                    <div className="mt-3">
                      <a
                        href={
                          vendor.location?.coordinates?.length === 2
                            ? `https://www.google.com/maps/search/?api=1&query=${vendor.location.coordinates[1]},${vendor.location.coordinates[0]}`
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(vendor.address)}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-center gap-2 text-xs font-semibold text-[#8059ca] border border-[#8059ca] rounded-lg py-1.5 hover:bg-purple-50 transition-colors"
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
        </BaseModal>

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
        <BaseModal
          show={showRescheduleModal}
          onClose={() => setShowRescheduleModal(false)}
          title="Reschedule Appointment"
          size="lg"
        >
          <div className="-mt-3 mb-4 text-xs text-slate-500">
            Order #{rescheduleOrder?.orderId}
          </div>
          <div className="mb-4 p-4 rounded-xl bg-purple-50/50 border border-purple-100">
            <div className="text-[11px] text-[#8059ca] font-semibold uppercase tracking-wider">
              Current Appointment
            </div>
            <div className="text-[15px] font-semibold text-slate-700 mt-1">
              {formatOrderAppointmentLabel(rescheduleOrder)}
            </div>
          </div>

          <div className="relative min-h-[330px]">
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
              <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-30 rounded-xl">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-[#8059ca] border-t-transparent rounded-full" role="status">
                  <span className="sr-only">Rescheduling...</span>
                </div>
              </div>
            )}
          </div>
        </BaseModal>

        {/* Report Issue Modal */}
        <BaseModal
          show={showReportModal}
          onClose={() => setShowReportModal(false)}
          title={
            <div className="flex items-center gap-2 text-red-600">
              <i className="fas fa-exclamation-circle text-lg"></i>
              <span className="font-bold text-slate-800">Report an Issue</span>
            </div>
          }
          size="md"
        >
          <div className="-mt-3 mb-4 text-xs text-slate-500">
            Order Id {selectedReportOrder?.orderId}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Product */}
              <div className="w-full md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Product *</label>
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
                    <div ref={productDropdownRef} className="relative">
                      <div
                        onClick={() => setIsProductDropdownOpen(!isProductDropdownOpen)}
                        className="w-full flex items-center justify-between min-h-[40px] px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white cursor-pointer select-none"
                      >
                        <span className={`truncate max-w-[90%] ${selectedNames.length > 0 ? "text-slate-800" : "text-slate-400"}`}>
                          {selectedNames.length > 0
                            ? selectedNames.join(", ")
                            : "Select Products"}
                        </span>
                        <i className={`fas fa-chevron-${isProductDropdownOpen ? "up" : "down"} text-slate-400 text-xs`}></i>
                      </div>

                      {isProductDropdownOpen && (
                        <div className="absolute top-[100%] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-[200px] overflow-y-auto py-1">
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
                                className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => { }}
                                  className="w-4 h-4 text-[#8059ca] border-slate-300 rounded focus:ring-[#8059ca] cursor-pointer"
                                />
                                <span className="text-sm text-slate-700">{displayName}</span>
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
              <div className="w-full md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Category *</label>
                <select
                  name="category"
                  required
                  value={formData.category || ""}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent bg-white"
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
              <div className="w-full md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject *</label>
                <input
                  type="text"
                  name="subject"
                  placeholder="Subject"
                  required
                  value={formData.subject || ""}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent bg-white"
                />
              </div>

              {/* Description */}
              <div className="w-full md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Description *</label>
                <textarea
                  name="description"
                  rows="4"
                  placeholder="Describe your issue..."
                  required
                  value={formData.description || ""}
                  onChange={onFormChange}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent bg-white resize-vertical"
                ></textarea>
              </div>

              {/* Attachments */}
              <div className="w-full md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Attachments</label>
                <input
                  type="file"
                  name="attachments"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files);
                    const validFiles = [];
                    const maxSizeBytes = 5 * 1024 * 1024;

                    files.forEach((file) => {
                      if (file.size > maxSizeBytes) {
                        toast.error(`${file.name} is too large. Max file size is 5MB.`);
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

                    e.target.value = "";
                  }}
                  className="w-full px-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent bg-white file:mr-4 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 file:cursor-pointer"
                />
                <div className="text-slate-400 mt-1 text-[11px]">
                  Max file size: 5MB. Multiple files allowed.
                </div>
              </div>

              {formData.attachments && formData.attachments.length > 0 && (
                <div className="w-full md:col-span-2 mt-2">
                  <label className="block mb-1 text-xs font-semibold text-slate-500">
                    Selected Attachments ({formData.attachments.length})
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {formData.attachments.map((attachment, index) => {
                      const objectUrl = URL.createObjectURL(attachment);
                      return (
                        <div
                          key={index}
                          className="relative w-[65px] h-[65px] rounded-lg overflow-hidden border border-slate-200 shadow-sm"
                        >
                          <img
                            src={objectUrl}
                            alt="attachment"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 w-[18px] h-[18px] bg-red-600 hover:bg-red-700 text-white rounded-full flex items-center justify-center border-none shadow-sm cursor-pointer"
                            onClick={() =>
                              setFormData((prev) => ({
                                ...prev,
                                attachments: prev.attachments.filter((_, i) => i !== index),
                              }))
                            }
                          >
                            <i className="fas fa-times text-[9px]"></i>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Submit */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 bg-[#8059ca] hover:bg-[#6a4ab0] text-white font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Issue"}
              </button>
            </div>
          </form>
        </BaseModal>

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

        <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
};

export default AppoitmentsOrders;
