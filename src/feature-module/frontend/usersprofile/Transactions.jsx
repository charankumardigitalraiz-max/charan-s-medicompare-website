import React, { useState, useEffect } from "react";
import { useResponsive } from "../../../hooks/useResponsive";
import { axiosUserInstance } from "../../../Apiservice";
import toast from "react-hot-toast";

const Transactions = ({ HomeNavigate, BackButton }) => {
  const { isMobile } = useResponsive();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("new");
  const transactionsPerPage = 10;

  const fetchOrders = async (page = 1, search = "") => {
    const token = localStorage.getItem("medicomparestoken");
    setLoading(true);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: transactionsPerPage.toString(),
        search: search || "",
      });

      const res = await axiosUserInstance.get(
        `orders/transaction/list?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const txList = res?.data?.data?.transactions || [];
      const pagination = res?.data?.data?.pagination || {};

      setOrders(txList);
      setTotalPages(pagination.totalPages || 1);
    } catch (err) {
      toast.error("Error fetching transactions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, searchTerm);
  }, [currentPage, searchTerm]);

  const currentTransactions = orders.map((tx) => {
    const txDate = tx.createdAt ? new Date(tx.createdAt) : new Date();
    const formattedDate = txDate.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });

    return {
      id: `#${tx.orderId}`,
      type: tx.bookingType ? tx.bookingType.replace(/_/g, ' ') : "Purchase",
      details: tx.bookingType === "cart" ? `Cart Order - #${tx.orderId}` : `Order - #${tx.orderId}`,
      date: formattedDate,
      amount: tx.amount || 0,
      status: tx.orderStatus || "pending",
      paymentMethod: tx.paymentMethod || "N/A",
      orderId: tx.orderId,
      paymentStatus: tx.paymentStatus || "pending",
      paymentId: tx.paymentId || null,
      razorpayOrderId: tx.razorpayOrderId || null,
      rawDate: tx.createdAt
    };
  });

  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "bg-[rgba(46,204,113,0.1)] text-[#2ecc71] border border-[rgba(46,204,113,0.2)]";
      case "pending":
        return "bg-[rgba(241,196,15,0.1)] text-[#f1c40f] border border-[rgba(241,196,15,0.2)]";
      case "failed":
        return "bg-[rgba(231,76,60,0.1)] text-[#e74c3c] border border-[rgba(231,76,60,0.2)]";
      default:
        return "bg-[rgba(149,117,205,0.1)] text-[#9575cd] border border-[rgba(149,117,205,0.2)]";
    }
  };

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages || pageNumber === currentPage) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getPaginationRange = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="w-full">
      <div className="col-lg-12">
        {BackButton && (
          <div className="col-12 mb-3">
            <BackButton />
          </div>
        )}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 mt-2">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-credit-card text-[#8059ca] text-[20px] shrink-0" />
            <div className="flex flex-col gap-0.5">
              <h4 className="m-0 text-slate-800 font-bold text-[18px] md:text-[20px] tracking-tight leading-none">Transaction History</h4>
              <p className="text-slate-500 text-[12px] md:text-[13px] m-0 font-medium">
                View and manage all your transaction history
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[260px] shrink-0">
              <input
                type="text"
                placeholder="Search by Order ID..."
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

        {/* Transactions List / Cards */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading transactions...</span>
            </div>
          </div>
        ) : currentTransactions.length > 0 ? (
          <div className="row g-4 mb-4">
            {currentTransactions.map((tx) => {
              const statusClass = getStatusClasses(tx.status);

              return (
                <div className="col-md-6 col-12" key={tx.id}>
                  <div className="p-5 border border-slate-100 rounded-[14px] bg-white shadow-[0_4px_16px_rgba(0,0,0,0.04)] flex flex-col justify-between gap-3.5 h-full transition-all duration-200 ease-in-out">
                    {/* Card Header */}
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="d-flex align-items-center gap-2">
                        <div className="w-[38px] h-[38px] rounded-[10px] bg-[#f3e8ff] text-[#8059ca] flex items-center justify-center text-[15px] shrink-0">
                          <i className="fa-solid fa-receipt" />
                        </div>
                        <div>
                          <span className="text-[14px] font-bold text-[#8059ca] block">
                            {tx.orderId || tx.id}
                          </span>
                          <span className="text-[12px] text-slate-500">
                            <i className="fa-regular fa-clock me-1"></i>
                            {tx.date || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Order Status Badge */}
                      <span className={`badge d-inline-flex align-items-center gap-1.5 px-3 py-1.5 rounded-[20px] text-[12px] font-semibold capitalize ${statusClass}`}>
                        <i
                          className={`fa-solid fa-circle text-[6px] ${
                            tx.status?.toLowerCase() === "pending"
                              ? "animate-pulse"
                              : ""
                          }`}
                        />
                        {tx.status}
                      </span>
                    </div>

                    {/* Details Description */}
                    <div className="text-[13px] text-slate-700 font-medium bg-slate-50 py-2.5 px-3.5 rounded-lg border border-slate-100">
                      {tx.details}
                    </div>

                    {/* Card Footer Details Grid */}
                    <div className="row g-2 pt-2 border-t border-dashed border-slate-200">
                      <div className="col-4">
                        <span className="text-[11px] text-slate-500 block">
                          Payment Method
                        </span>
                        <span className="text-[13px] font-semibold text-slate-900 capitalize">
                          {tx.paymentMethod || "N/A"}
                        </span>
                      </div>

                      <div className="col-4">
                        <span className="text-[11px] text-slate-500 block">
                          Payment Status
                        </span>
                        <span
                          className={`badge d-inline-flex align-items-center gap-1 mt-1 border px-2 py-[3px] rounded-[20px] text-[11px] font-semibold capitalize ${
                            tx.paymentStatus === "paid"
                              ? "bg-[rgba(46,204,113,0.1)] text-[#2ecc71] border-[rgba(46,204,113,0.2)]"
                              : "bg-[rgba(241,196,15,0.1)] text-[#f1c40f] border-[rgba(241,196,15,0.2)]"
                          }`}
                        >
                          {tx.paymentStatus || "pending"}
                        </span>
                      </div>

                      <div className="col-4 text-end">
                        <span className="text-[11px] text-slate-500 block">
                          Total Amount
                        </span>
                        <span className="text-[15px] font-bold text-green-600">
                          ₹{tx.amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-5 bg-white rounded-lg border text-slate-500">
            <i className="fa-solid fa-receipt fa-2x mb-3 text-muted" />
            <p className="mb-0 text-[14px] font-medium">
              {searchTerm || statusFilter ? "No transactions found" : "No transactions yet"}
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination dashboard-pagination mt-4">
            <ul className="d-flex justify-content-center align-items-center gap-1">
              <li>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <i className="fa-solid fa-chevron-left" />
                </button>
              </li>

              {getPaginationRange().map((item, index) => (
                <li key={index}>
                  {item === "..." ? (
                    <span className="px-2 text-muted text-[14px]">...</span>
                  ) : (
                    <button
                      className={`page-link ${currentPage === item ? "active" : ""}`}
                      onClick={() => handlePageChange(item)}
                    >
                      {item}
                    </button>
                  )}
                </li>
              ))}

              <li>
                <button
                  className="page-link"
                  onClick={() => handlePageChange(currentPage + 1)}
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

export default Transactions;