import React, { useState, useEffect } from "react";
import { axiosUserInstance, imgUrl } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import { useResponsive } from "../../../hooks/useResponsive";
import toast from "react-hot-toast";
import BaseModal from "../../../components/ui/BaseModal";
import Pagination from "../../../components/ui/Pagination.jsx";

// Styles migrated to Tailwind CSS

const MyReports = ({ HomeNavigate }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModel, setShowModel] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showPdfModel, setShowPdfModel] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const { isMobile } = useResponsive();
  const ordersPerPage = 4;

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
        `orders/reports/list?${params.toString()}`,
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
      const matchesOrderId = order.orderItemId
        ?.toLowerCase()
        .includes(searchLower);

      const matchesItemName =
        order.packageDetails?.some((item) => {
          const itemName = item?.name || "";
          return itemName.toLowerCase().includes(searchLower);
        }) ||
        order.productDetails?.tabletdetails?.name
          ?.toLowerCase()
          .includes(searchLower);

      if (!matchesOrderId && !matchesItemName) return false;
    }

    const orderStatus = order.orderStatus?.toLowerCase() || "";

    switch (selectedTab) {
      case "all":
        return true;
      case "delivered":
        return orderStatus === "completed" || orderStatus === "delivered";
      case "cancelled":
        return orderStatus === "cancelled" || orderStatus === "canceled";
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedTab]);

  const resolveOrderImage = (order) => {
    const firstItem = order.items?.[0];
    if (!firstItem) return "/assets/default.png";

    if (firstItem.type === "package" && firstItem.packageDetails?.length > 0) {
      const item = firstItem.packageDetails[0];
      if (Array.isArray(item?.files) && item.files.length > 0) {
        return getImageUrl(item.files[0]);
      }
    }

    if (
      firstItem.type === "normal" &&
      firstItem.productDetails?.tabletdetails?.files?.length > 0
    ) {
      return getImageUrl(firstItem.productDetails.tabletdetails.files[0]);
    }

    return "/assets/default.png";
  };

  return (
    <div className="w-full">
      <div className="col-lg-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
          <div className="flex items-center gap-3.5">
            {HomeNavigate && <HomeNavigate />}
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#321961] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
              <i className="fa-solid fa-shopping-bag" />
            </div>

            {/* <div className="flex flex-col gap-1">
              <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                My Reports
              </div>
              <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                View and manage all your reports
              </p>
            </div> */}




            <div className="flex flex-col gap-1">
              <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                My Reports
              </div>
              <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                View and manage all your reports
              </div>
            </div>


          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[250px] shrink-0">
              <input
                type="text"
                placeholder="Search by Order ID or Item Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-[42px] rounded-sm border border-[#e0e0e0] pl-10 pr-4 text-sm w-full outline-none focus:border-[#321961] transition-colors"
              />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none">
                <i className="fa-solid fa-search" />
              </span>
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentOrders.map((order, index) => {
                const orderStatus = order.orderStatus?.toLowerCase() || "";
                const isProcessing =
                  orderStatus === "new" || orderStatus === "pending";
                const isDelivered =
                  orderStatus === "completed" || orderStatus === "delivered";
                const isCancelled =
                  orderStatus === "cancelled" || orderStatus === "canceled";

                return (
                  <div key={index} className="w-full">
                    <div className="h-full flex flex-col justify-between bg-white rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_24px_rgba(128,89,202,0.12)] border border-slate-100 hover:border-[#c0a6f3] transition-all duration-300 p-4 m-0">
                      {/* Card Header */}
                      <div className="flex justify-between items-center mb-3 border-b border-[#f0f0f0] pb-2.5">
                        <div className="text-[14px] font-semibold text-slate-800">
                          #{order.orderDetails?.orderId || "N/A"}
                        </div>
                        {(() => {
                          const hasPendingReport = order.items?.some((item) =>
                            item.patients?.some((p) => !p?.reports?.reportFile)
                          );
                          return (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${!hasPendingReport
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-amber-100 text-amber-700"
                                }`}
                            >
                              {!hasPendingReport ? "READY" : "PENDING"}
                            </span>
                          );
                        })()}
                      </div>

                      {/* Card Body */}
                      <div className="flex items-start gap-3 flex-grow">
                        <div
                          onClick={() => handleView(order)}
                          className="cursor-pointer shrink-0"
                        >
                          <img
                            src={resolveOrderImage(order)}
                            className="w-20 h-20 object-contain rounded-lg border border-[#f0f0f0] bg-[#fafafa] p-1"
                            alt="Product"
                            onError={(e) => {
                              e.currentTarget.src = "/assets/default.png";
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div
                            className="cursor-pointer text-[14px] font-bold text-slate-800 mb-2 whitespace-nowrap overflow-hidden text-ellipsis"
                            onClick={() => handleView(order)}
                          >
                            {(() => {
                              if (!order.items || order.items.length === 0) return "Lab Reports";
                              const firstItem = order.items[0];
                              const firstTitle = firstItem.type === "package"
                                ? firstItem.packageDetails?.[0]?.name
                                : firstItem.productDetails?.tabletdetails?.name || "Lab Test";

                              const otherItemsCount = order.items.length - 1;
                              return otherItemsCount > 0 ? `${firstTitle} (+${otherItemsCount} more)` : firstTitle;
                            })()}
                          </div>

                          <div className="flex flex-col gap-1">
                            <div className="text-[12px] mb-0.5">
                              <span className="text-[#777]">Doctor: </span>
                              <span className="font-medium text-[#333]">{order.orderDetails?.doctorName || "N/A"}</span>
                            </div>
                            <div className="text-[12px] mb-0.5">
                              <span className="text-[#777]">Lab: </span>
                              <span className="font-medium text-[#333]">
                                {(() => {
                                  const firstItem = order.items?.[0];
                                  return firstItem?.packageDetails?.[0]?.vendorDetails?.[0]?.name ||
                                    firstItem?.productDetails?.vendorDetails?.[0]?.name ||
                                    "N/A";
                                })()}
                              </span>
                            </div>
                            <div className="text-[12px]">
                              <span className="text-[#777]">Patient: </span>
                              <span className="capitalize font-semibold text-[#321961]">
                                {(() => {
                                  // Get a list of all distinct patient names across all items in this order
                                  const patientNames = [];
                                  order.items?.forEach((item) => {
                                    item.patients?.forEach((p) => {
                                      const pName = p?.patient?.name || `${order.userDetails?.first_name || ""} ${order.userDetails?.last_name || ""}`.trim();
                                      if (pName && !patientNames.includes(pName)) {
                                        patientNames.push(pName);
                                      }
                                    });
                                  });

                                  if (patientNames.length === 0) return "N/A";
                                  const firstPatientName = patientNames[0];
                                  const otherPatientsCount = patientNames.length - 1;
                                  return otherPatientsCount > 0 ? `${firstPatientName} (+${otherPatientsCount} more)` : firstPatientName;
                                })()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-dashed border-[#f0f0f0]">
                        <div className="text-[12px] text-slate-500 font-medium m-0">
                          {order?.updatedAt
                            ? new Date(order.updatedAt).toLocaleDateString(
                              "en-GB",
                            )
                            : "N/A"}
                        </div>
                        <button
                          className="flex gap-1.5 items-center !bg-primary !rounded-md !text-[11px] px-3 py-[6px] border border-[#321961] !text-white bg-transparent font-semibold hover:bg-[#321961] hover:text-white transition-colors"
                          onClick={() => handleView(order)}
                        >
                          <i className="fas fa-file-pdf"></i>
                          View Report
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-5">
              <div className="empty-state">
                <i className="fa-solid fa-file-medical fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">No reports found</h5>
                <p className="text-muted">
                  You haven't Received any reports yet.
                </p>
              </div>
            </div>
          )}
        </div>

        {showModel && (
          <BaseModal
            show={showModel}
            onClose={() => setShowModel(false)}
            title="Patient Reports Details"
            size="md"
            bodyClassName="!p-4 bg-slate-50"
          >
            <div className="flex flex-col gap-3">
              {(() => {
                const patientCards = [];
                selectedOrder?.items?.forEach((item) => {
                  item.patients?.forEach((patient, idx) => {
                    const name = patient?.patient?.name || `${selectedOrder.userDetails?.first_name || ""} ${selectedOrder.userDetails?.last_name || ""}`.trim() || "N/A";
                    const relation = patient?.patient?.relationship || "Self";
                    const testName = item.type === "package"
                      ? item.packageDetails?.[0]?.name
                      : item.productDetails?.tabletdetails?.name || "Lab Test";
                    const hasReport = !!patient?.reports?.reportFile;

                    patientCards.push(
                      <div
                        key={`${item.orderItemId}-${idx}`}
                        className="bg-white border border-slate-200 rounded-sm p-4 flex justify-between items-center transition-all shadow-sm"
                      >
                        <div className="min-w-0 flex-1 pr-3">
                          <div className="font-bold text-[14px] text-slate-800 capitalize">
                            {name}
                          </div>
                          <div className="text-[12px] text-slate-500 mt-1">
                            Relation: <span className="font-semibold text-slate-700">{relation}</span>
                          </div>
                          <div className="text-[12px] text-slate-500 mt-0.5">
                            Test: <span className="font-semibold text-slate-700">{testName}</span>
                          </div>
                        </div>

                        <div className="shrink-0">
                          {hasReport ? (
                            <button
                              type="button"
                              className="btn btn-sm flex items-center gap-1.5 bg-[#321961] text-white font-semibold text-[12px] px-3.5 py-2 rounded-sm border-none hover:bg-[#6b1fe6] transition-colors"
                              onClick={() => {
                                const rawPath = patient.reports.reportFile;
                                const fullUrl = rawPath.startsWith("http://") || rawPath.startsWith("https://")
                                  ? rawPath
                                  : `${imgUrl}/${rawPath.startsWith("/") ? rawPath.slice(1) : rawPath}`;
                                setPdfUrl(fullUrl);
                                setPdfLoading(true);
                                setShowPdfModel(true);
                              }}
                            >
                              <i className="fas fa-eye text-[11px]"></i>
                              View Report
                            </button>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[11px] font-semibold px-3 py-1.5 rounded-sm border border-slate-200 inline-block">
                              Not Ready
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  });
                });

                return patientCards.length > 0 ? patientCards : (
                  <div className="text-center text-muted py-4">No patients registered for this order</div>
                );
              })()}
            </div>
          </BaseModal>
        )}

        {showPdfModel && (
          <BaseModal
            show={showPdfModel}
            onClose={() => setShowPdfModel(false)}
            title="View Report PDF"
            size="xl"
            bodyClassName="!p-0 h-[80vh]"
          >
            <div className="w-full h-full bg-[#fafafa] relative">
              {pdfLoading && (
                <div className="flex justify-center items-center h-full absolute inset-0 bg-[#fafafa] z-10">
                  <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading report...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading report...</p>
                  </div>
                </div>
              )}

              {pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="Patient Report PDF"
                  width="100%"
                  height="100%"
                  className={`border-none ${pdfLoading ? "hidden" : "block"}`}
                  onLoad={() => setPdfLoading(false)}
                />
              ) : (
                <div className="p-3 text-center text-muted">No report file available</div>
              )}
            </div>
          </BaseModal>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default MyReports;