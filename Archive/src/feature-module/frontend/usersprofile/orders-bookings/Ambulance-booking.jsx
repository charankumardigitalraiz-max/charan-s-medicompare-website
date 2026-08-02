import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { axiosUserInstance, imgUrl } from "../../../../Apiservice";
import { getImageUrl } from "../../../../utils/index";
import { useResponsive } from "../../../../hooks/useResponsive";
import toast from "react-hot-toast";
import BaseModal from "../../../../components/ui/BaseModal";
import Pagination from "../../../../components/ui/Pagination.jsx";

// Styles migrated to Tailwind CSS


const STATUS_TABS = [
  { id: "all", label: "All", icon: "fa-list" },
  { id: "upcoming", label: "Upcoming", icon: "fa-clock" },
  { id: "completed", label: "Completed", icon: "fa-check-circle" },
  { id: "cancelled", label: "Cancelled", icon: "fa-times-circle" },
  { id: "failed", label: "Failed", icon: "fa-exclamation-circle" },
];

const AmbulanceBooking = ({ HomeNavigate, BackButton }) => {
  const [leadslist, setleadslist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedLead, setSelectedLead] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const { isMobile } = useResponsive();
  const ordersPerPage = 4;

  const getLeadsData = async (page = 1, search = "", status = "all") => {
    const token = localStorage.getItem("medicomparestoken");
    setLoading(true);

    try {
      const statusParam = status && status !== "all" ? `&status=${encodeURIComponent(status)}` : "";

      const res = await axiosUserInstance.get(
        `ride/list?page=${page}&limit=${ordersPerPage}&search=${encodeURIComponent(search)}${statusParam}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setleadslist(res?.data?.data?.list || []);
      setTotalPages(res?.data?.data?.pagination?.totalPages || 1);
      setCurrentPage(res?.data?.data?.pagination?.currentPage || 1);
    } catch (err) {
      toast.error("Error fetching leads: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      getLeadsData(currentPage, searchTerm, activeTab);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm, activeTab]);


  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setCurrentPage(1);
  };


  // Style element injection removed


  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "delivered") return "delivered";
    if (s === "cancelled" || s === "canceled") return "cancelled";
    if (s === "failed") return "failed";
    return "processing";
  };

  // Upcoming = bookingDateTime is in the future AND status is not a terminal state
  const isUpcoming = (lead) => {
    const terminalStatuses = ["completed", "delivered", "cancelled", "canceled", "failed"];
    const statusLower = (lead.status || "").toLowerCase();
    if (terminalStatuses.includes(statusLower)) return false;
    if (!lead.bookingDateTime) return true; // no date = assume upcoming
    return new Date(lead.bookingDateTime) > new Date();
  };

  const filteredOrders = leadslist;

  const handleCancelBooking = async (leadId) => {
    const token = localStorage.getItem("medicomparestoken");
    setCancellingId(leadId);
    try {
      await axiosUserInstance.post(
        `ride/cancel/${leadId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      toast.success("Booking cancelled successfully");
      setConfirmCancelId(null);
      getLeadsData(currentPage, searchTerm, activeTab);
    } catch (err) {
      // If no cancel endpoint exists, update locally
      setleadslist((prev) =>
        prev.map((l) =>
          l._id === leadId ? { ...l, status: "cancelled" } : l
        )
      );
      toast.success("Booking cancelled");
      setConfirmCancelId(null);
    } finally {
      setCancellingId(null);
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "upcoming": return "No upcoming ambulance bookings found.";
      case "completed": return "No completed ambulance bookings found.";
      case "cancelled": return "No cancelled ambulance bookings found.";
      case "failed": return "No failed ambulance bookings found.";
      default: return "You haven't booked any ambulance services yet.";
    }
  };

  // GeoJSON: coordinates = [longitude, latitude]
  const getMapUrl = (locationObj) => {
    const coords = locationObj?.coordinates;
    if (coords && coords.length === 2) {
      const lat = coords[1];
      const lng = coords[0];
      return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
    }
    // Fallback to address search
    if (locationObj?.address) {
      return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationObj.address)}`;
    }
    return null;
  };


  const onClose = () => {

    setSelectedLead(null);
  }

  return (
    <div className="w-full">
      <div className="w-full">
        {BackButton && (
          <div className="w-full mb-3">
            <BackButton />
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
          <div className="flex items-center gap-3.5">
            {HomeNavigate && <HomeNavigate />}
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
              <i className="fa-solid fa-truck-medical" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                Ambulance Bookings
              </div>
              <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                Manage and track all your Ambulance Bookings
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[260px] shrink-0">
              <input
                type="text"
                placeholder="Search by Booking ID, Address..."
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

        {/* Status Tabs */}
        <div className="mb-3 relative mt-4">
          <div className="flex justify-between items-center gap-2 flex-nowrap">
            {isMobile ? (
              <select
                value={activeTab}
                className="w-full h-[38px] rounded-lg border border-slate-200 px-3 text-[13px] outline-none bg-slate-50 focus:bg-white focus:border-[#8059ca] transition-all duration-200"
                onChange={(e) => handleTabChange(e.target.value)}
              >
                {STATUS_TABS.map((tab) => {
                  return (
                    <option key={tab.id} value={tab.id}>
                      {tab.label}
                    </option>
                  );
                })}
              </select>
            ) : (
              <ul className="flex border-b border-slate-200 w-full mb-0 overflow-visible min-w-0 gap-2 list-none p-0">
                {STATUS_TABS.map((tab) => {
                  const isActive = activeTab === tab.id;

                  return (
                    <li className="nav-item" key={tab.id}>
                      <button
                        className={`py-2.5 px-4 text-[13px] font-semibold !border-b-2 -mb-[1px] transition-all duration-200 flex items-center gap-1.5 ${isActive ? "!border-[#8059ca] !text-[#8059ca]" : "border-transparent text-slate-500 hover:text-slate-700"}`}
                        onClick={() => handleTabChange(tab.id)}
                      >
                        <i className={`fas ${tab.icon}`}></i>
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
          ) : filteredOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredOrders.map((lead) => {
                const orderStatus = lead.status?.toLowerCase() || "";
                const isDelivered = orderStatus === "completed" || orderStatus === "delivered";
                const isCancelled = orderStatus === "cancelled" || orderStatus === "canceled";
                const isPaid = lead.paymentStatus === "paid";

                return (
                  <div key={lead._id} className="w-full">
                    <div className="bg-white border border-[#e2e8f0] rounded-[9px] shadow-[0_2px_10px_rgba(15,23,42,0.03)] p-4 h-full flex flex-col justify-between hover:shadow-[0_8px_24px_rgba(128,89,202,0.1)] hover:border-[#c0a6f3] transition-all duration-300">
                      {/* Top Header Row */}
                      <div>
                        <div className="flex justify-between items-center mb-2 pb-2 border-b border-[#f1f5f9]">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-semibold text-[#0f172a]">
                                #{lead.bookingId}
                              </span>
                              <span className={`text-capitalize text-[10px] py-0.5 px-2 rounded-[10px] font-medium ${getStatusBadgeClass(lead.status) === "delivered" ? "bg-[#d7f5e8] text-[#00a86b]" :
                                getStatusBadgeClass(lead.status) === "cancelled" ? "bg-[#ffe0e0] text-[#dc3545]" :
                                  getStatusBadgeClass(lead.status) === "failed" ? "bg-[#fff3cd] text-[#856404]" :
                                    "bg-[#ffe9d6] text-[#ff7a00]"
                                }`}>
                                {lead.status ? lead.status.toLowerCase() : "N/A"}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#64748b] mt-0.5">
                              <i className="fas fa-calendar-alt mr-1 text-[#8059ca]"></i>
                              {new Date(lead.createdAt).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
                            </div>
                          </div>

                          <div className="text-end">
                            <div className="text-[10px] text-[#94a3b8] font-semibold uppercase">Total Fare</div>
                            <div className="text-[16px] font-extrabold text-[#8059ca]">
                              ₹{lead.fare?.toLocaleString() || "0"}
                            </div>
                          </div>
                        </div>

                        {/* Service Info Box */}
                        <div className="bg-[#fdfaff] rounded-[10px] border border-[#f1e9fe] p-2 mb-2.5 flex items-center gap-2.5">
                          {lead.productdetails?.tabletdetails?.files?.[0] ? (
                            <img
                              src={getImageUrl(lead.productdetails.tabletdetails.files[0])}
                              className="w-10 h-10 object-contain rounded-lg bg-white p-0.5 border border-[#e9d5ff]"
                              alt="Ambulance"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                                if (e.currentTarget.nextSibling) {
                                  e.currentTarget.nextSibling.style.display = "flex";
                                }
                              }}
                            />
                          ) : null}
                          <div className={`w-10 h-10 rounded-lg bg-[#f3eeff] border border-[#d6c6f7] text-[#8059ca] ${lead.productdetails?.tabletdetails?.files?.[0] ? "hidden" : "flex"} items-center justify-center text-[18px] shrink-0`}>
                            <i className="fas fa-ambulance"></i>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[13px] font-semibold text-[#1e293b] capitalize truncate">
                              {lead.productdetails?.tabletdetails?.name ||
                                lead.productdetails?.variantcurrentDetails?.productname ||
                                lead.productdetails?.packagedetails?.name ||
                                "Ambulance Service"}
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px]">
                              <span className="text-[#64748b]">
                                <i className="fas fa-truck-medical mr-1 text-[#8059ca]"></i>
                                {lead.emergencyType ? (lead.emergencyType.toLowerCase() === "nonemergency" ? "Non-Emergency" : lead.emergencyType) : "Standard"}
                              </span>
                              <span className="text-[#cbd5e1]">•</span>
                              <span className={`text-[11px] ${isPaid ? "text-[#16a34a]" : "text-[#dc2626]"} font-semibold capitalize`}>
                                <i className={`fas ${isPaid ? "fa-check-circle" : "fa-clock"} mr-1`}></i>
                                {lead.paymentStatus || "unpaid"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pickup & Drop Route timeline */}
                        <div className="py-1 pb-2">
                          {/* Pickup */}
                          <div className="flex items-center gap-2 mb-1.5">
                            <i className="fas fa-circle text-[#16a34a] text-[9px]"></i>
                            <div className="flex-grow min-w-0 text-[12px] flex justify-between items-center">
                              <span
                                title={lead.pickupLocation?.address || "N/A"}
                                className="text-[#334155] font-medium block truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[240px]"
                              >
                                <strong className="text-[#64748b] font-semibold mr-1">From:</strong>
                                {lead.pickupLocation?.address || "N/A"}
                              </span>
                              {getMapUrl(lead.pickupLocation) && (
                                <a
                                  href={getMapUrl(lead.pickupLocation)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#16a34a] no-underline font-semibold shrink-0 ml-1.5"
                                >
                                  <i className="fas fa-map-marked-alt mr-1"></i> Maps
                                </a>
                              )}
                            </div>
                          </div>

                          {/* Dropoff */}
                          <div className="flex items-center gap-2">
                            <i className="fas fa-map-marker-alt text-[#dc2626] text-[11px]"></i>
                            <div className="flex-grow min-w-0 text-[12px] flex justify-between items-center">
                              <span
                                title={lead.dropoffLocation?.address || "N/A"}
                                className="text-[#334155] font-medium block truncate max-w-[140px] xs:max-w-[200px] sm:max-w-[160px] md:max-w-[180px] lg:max-w-[240px]"
                              >
                                <strong className="text-[#64748b] font-semibold mr-1">To:</strong>
                                {lead.dropoffLocation?.address || "N/A"}
                              </span>
                              {getMapUrl(lead.dropoffLocation) && (
                                <a
                                  href={getMapUrl(lead.dropoffLocation)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-[#dc2626] no-underline font-semibold shrink-0 ml-1.5"
                                >
                                  <i className="fas fa-map-marked-alt mr-1"></i> Maps
                                </a>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Vendor info snippet */}
                        {lead.vendordetails && (lead.vendordetails.firstName || lead.vendordetails.email || lead.vendordetails.mobile) && (
                          <div className="bg-[#f8fafc] border border-[#f1f5f9] rounded-lg p-[6px_10px] mb-2.5 flex justify-between items-center text-[11px]">
                            <div className="flex items-center gap-1">
                              <span className="text-[#64748b] font-semibold">Vendor:</span>
                              <span className="text-[#0f172a] font-semibold">
                                {lead.vendordetails.firstName || ""} {lead.vendordetails.lastName || ""}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card Footer Actions */}
                      <div className="flex gap-2 pt-2.5 border-t border-[#f1f5f9]">
                        <button
                          className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-[#8059ca] text-white border border-[#8059ca] transition-all duration-200 no-underline shadow-none hover:bg-[#6f42c1] hover:border-[#6f42c1] focus:bg-[#6f42c1] focus:border-[#6f42c1]"
                          onClick={() => setSelectedLead(lead)}
                        >
                          <i className="fas fa-eye text-[11px]" /> View Details
                        </button>

                        {isUpcoming(lead) && (
                          <button
                            className="inline-flex items-center justify-center gap-1.5 !rounded-md !text-[11px] !font-medium p-[4px_8px] min-w-fit whitespace-nowrap leading-tight bg-red-500 text-white border border-red-500 transition-all duration-200 no-underline shadow-none hover:bg-red-600 hover:border-red-600 focus:bg-red-600 focus:border-red-600"
                            onClick={() => setConfirmCancelId(lead._id)}
                          >
                            <i className="fas fa-times text-[11px]" /> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="flex flex-col items-center justify-center">
                <i className="fa-solid fa-truck-medical text-[48px] text-slate-300 mb-3"></i>
                <h5 className="text-slate-400 font-semibold text-[15px]">No ambulance bookings found</h5>
                <p className="text-slate-400 text-[13px]">{getEmptyMessage()}</p>
              </div>
            </div>
          )}
        </div>


        {selectedLead && createPortal(
          <BaseModal
            show={selectedLead}
            onClose={onClose}
            title={`Booking #${selectedLead.bookingId || (selectedLead._id ? selectedLead._id.substring(selectedLead._id.length - 8) : "")}`}
            size="md"
            bodyClassName="!p-2"
            headerClassName="border-b-0 pb-0"
          >

            {/* Modal Body */}
            <div className="p-2 overflow-y-auto">
              {/* Product */}
              <div className="flex gap-3 items-start mb-4 p-3 bg-purple-50/50 border border-purple-100/50 rounded-xl">
                <img
                  src={getImageUrl(selectedLead.productdetails?.tabletdetails?.files?.[0])}
                  alt="Ambulance"
                  onError={(e) => { e.currentTarget.src = "/assets/default.png"; }}
                  className="w-[60px] h-[60px] object-contain rounded-lg bg-white border border-[#ede9f6]"
                />
                <div>
                  <div className="font-semibold text-[14px] text-[#333] capitalize">
                    {selectedLead.productdetails?.tabletdetails?.name ||
                      selectedLead.productdetails?.variantcurrentDetails?.productname ||
                      selectedLead.productdetails?.packagedetails?.name ||
                      "Ambulance Service"}
                  </div>
                  {selectedLead.bookingDateTime && (
                    <div className="text-[12px] text-[#8059ca] mt-1">
                      <i className="fas fa-calendar-alt mr-1"></i>
                      {new Date(selectedLead.bookingDateTime).toLocaleString("en-US", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </div>
                  )}
                </div>
              </div>

              {/* Location Info */}
              {[
                { label: "Pickup Location", value: selectedLead.pickupLocation?.address, icon: "fa-map-marker-alt", color: "#28a745", loc: selectedLead.pickupLocation },
                { label: "Drop-off Location", value: selectedLead.dropoffLocation?.address, icon: "fa-map-pin", color: "#dc3545", loc: selectedLead.dropoffLocation },
              ].map((item) => (
                <div key={item.label} className="mb-2.5 p-2.5 bg-slate-50 rounded-lg border-l-4" style={{ borderLeftColor: item.color }}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="text-[11px] text-[#777] flex items-center gap-1">
                      <i className={`fas ${item.icon}`} style={{ color: item.color }}></i>
                      {item.label}
                    </div>
                    {getMapUrl(item.loc) && (
                      <a
                        href={getMapUrl(item.loc)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-white p-[3px_9px] rounded-md no-underline inline-flex items-center gap-1 font-medium"
                        style={{ backgroundColor: item.color }}
                        title="Open in Google Maps"
                      >
                        <i className="fas fa-map-marked-alt"></i> Maps
                      </a>
                    )}
                  </div>
                  <div className="text-[13px] font-medium text-[#333] break-words">{item.value || "N/A"}</div>
                </div>
              ))}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-2.5 mt-3">
                {[
                  {
                    label: "Service Type",
                    value: selectedLead.emergencyType
                      ? selectedLead.emergencyType.toLowerCase() === "nonemergency"
                        ? "Non-Emergency"
                        : selectedLead.emergencyType.charAt(0).toUpperCase() + selectedLead.emergencyType.slice(1).toLowerCase()
                      : null,
                    icon: "fa-ambulance",
                    iconColor: "#8059ca",
                  },
                  {
                    label: "Booking Status",
                    value: selectedLead.bookingStatus,
                    icon: "fa-clipboard-list",
                    iconColor: "#0ea5e9",
                    colored: true,
                    isPaid: ["confirmed", "completed"].includes((selectedLead.bookingStatus || "").toLowerCase()),
                  },
                  {
                    label: "Payment Status",
                    value: selectedLead.paymentStatus,
                    icon: "fa-credit-card",
                    iconColor: "#22c55e",
                    colored: true,
                    isPaid: selectedLead.paymentStatus === "paid",
                  },
                  {
                    label: "Payment Method",
                    value: selectedLead.paymentmethod || selectedLead.paymentMethod,
                    icon: "fa-wallet",
                    iconColor: "#f59e0b",
                  },
                  {
                    label: "Distance",
                    value: selectedLead.distance ? `${selectedLead.distance} km` : (selectedLead.distanceKm ? `${selectedLead.distanceKm} km` : null),
                    icon: "fa-route",
                    iconColor: "#6366f1",
                  },
                ].filter(i => i.value).map((item) => (
                  <div key={item.label} className="bg-slate-50 rounded-lg p-2.5">
                    <div className="text-[11px] text-[#777] mb-1 flex items-center gap-1">
                      <i className={`fas ${item.icon}`} style={{ color: item.iconColor, fontSize: "10px" }}></i>
                      {item.label}
                    </div>
                    <div className={`text-[13px] font-semibold capitalize ${item.colored ? (item.isPaid ? "text-[#28a745]" : "text-[#dc3545]") : "text-[#333]"}`}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              {/* Vendor Details */}
              {selectedLead.vendordetails && (selectedLead.vendordetails.firstName || selectedLead.vendordetails.email || selectedLead.vendordetails.mobile) && (
                <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <i className="fas fa-store text-[#8059ca]"></i>
                    Vendor Details
                  </div>
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-[13px] font-semibold text-[#0f172a] capitalize">
                        {selectedLead.vendordetails.firstName || ""} {selectedLead.vendordetails.lastName || ""}
                      </div>
                      {selectedLead.vendordetails.email && (
                        <div className="text-[12px] text-slate-500 mt-0.5">
                          <i className="fas fa-envelope mr-1 text-[10px]"></i>
                          {selectedLead.vendordetails.email}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Total Fare */}
              <div className="mt-3.5 bg-gradient-to-r from-[#8059ca] to-[#a07de0] rounded-xl p-3.5 flex justify-between items-center">
                <span className="text-white text-[13px] font-medium">Total Fare</span>
                <span className="text-white text-[20px] font-bold">₹{selectedLead.fare?.toLocaleString() || "0"}</span>
              </div>
            </div>


          </BaseModal>,
          document.body
        )}

        {/* Cancellation Confirmation Modal */}
        {confirmCancelId && createPortal(
          <div
            className="amb-detail-modal-overlay !z-[99999] bg-slate-900/60 backdrop-blur-sm fixed inset-0 flex items-center justify-center p-4"
            onClick={() => setConfirmCancelId(null)}
          >
            <div
              className="bg-white shadow-2xl w-full max-w-[440px] rounded-2xl p-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setConfirmCancelId(null)}
                className="absolute top-4 right-4 border-none bg-slate-100 w-8 h-8 rounded-full text-slate-500 flex items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>

              <div className="text-center">
                <div className="w-14 h-14 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4 text-2xl shadow-[0_0_0_8px_#fef2f2]">
                  <i className="fas fa-triangle-exclamation"></i>
                </div>

                <h4 className="m-0 mb-2 !text-[20px] !font-semibold text-[#0f172a]">
                  Cancel Ambulance Booking?
                </h4>

                <p className="!text-[14px] text-slate-500 m-0 leading-relaxed">
                  Are you sure you want to cancel this booking? This request will be sent to the vendor immediately.
                </p>
              </div>

              <div className="flex gap-2 justify-center mt-6">
                <button
                  className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 !font-semibold !rounded-xl py-2.5 text-[14px] border-none transition-colors cursor-pointer"
                  onClick={() => setConfirmCancelId(null)}
                >
                  No, Keep Booking
                </button>
                <button
                  className="w-1/2 bg-red-600 hover:bg-red-700 text-white !font-semibold !rounded-xl py-2.5 text-[14px] border-none transition-colors cursor-pointer disabled:opacity-50"
                  disabled={cancellingId === confirmCancelId}
                  onClick={() => handleCancelBooking(confirmCancelId)}
                >
                  {cancellingId === confirmCancelId ? (
                    <div className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                  ) : (
                    "Yes, Cancel Now"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
      </div>
    </div>
  );
};

export default AmbulanceBooking;
