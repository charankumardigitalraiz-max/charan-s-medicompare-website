import React, { useState, useEffect } from "react";
import { useResponsive } from "../../hooks/useResponsive";
import { axiosUserInstance } from "../../Apiservice";
import toast from "react-hot-toast";
import Pagination from "../../components/ui/Pagination.jsx";

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
        return "!bg-[rgba(46,204,113,0.1)] !text-[#2ecc71] border border-[rgba(46,204,113,0.2)]";
      case "pending":
        return "!bg-[rgba(241,196,15,0.1)] !text-[#f1c40f] border border-[rgba(241,196,15,0.2)]";
      case "failed":
        return "!bg-[rgba(231,76,60,0.1)] !text-[#e74c3c] border border-[rgba(231,76,60,0.2)]";
      default:
        return "!bg-[rgba(149,117,205,0.1)] !text-[#9575cd] border border-[rgba(149,117,205,0.2)]";
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
    <div className="w-full px-4 md:px-6 py-4">
      {BackButton && (
        <div className="mb-3">
          <BackButton />
        </div>
      )}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
        <div className="flex items-center gap-3.5">
          {HomeNavigate && <HomeNavigate />}
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[var(--color-primary,#4c2691)] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
            <i className="fa-solid fa-credit-card" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
              Transaction History
            </div>
            <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
              View and manage all your transaction history
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
              className="h-[42px] rounded-sm border border-[#e0e0e0] pl-10 pr-4 text-sm w-full outline-none focus:border-[var(--color-primary,#4c2691)] transition-colors"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none">
              <i className="fa-solid fa-search" />
            </span>
          </div>
        </div>
      </div>

      {/* Transactions List / Cards */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[var(--color-primary,#4c2691)] border-t-transparent rounded-full" role="status">
            <span className="sr-only">Loading transactions...</span>
          </div>
        </div>
      ) : currentTransactions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {currentTransactions.map((tx) => {
            const statusClass = getStatusClasses(tx.status);

            return (
              <div key={tx.id} className="flex">
                <div className="p-3 border border-slate-100 rounded-sm bg-white shadow-sm hover:shadow-md flex flex-col justify-between gap-4 w-full transition-all duration-200 ease-in-out">
                  {/* Card Header */}
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] text-[var(--color-primary,#4c2691)] flex items-center justify-center text-base shrink-0">
                        <i className="fa-solid fa-receipt" />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-bold text-[var(--color-primary,#4c2691)] block truncate">
                          {tx.orderId || tx.id}
                        </span>
                        <span className="text-[12px] text-slate-500 flex items-center gap-1">
                          <i className="fa-regular fa-clock" />
                          {tx.date || "N/A"}
                        </span>
                      </div>
                    </div>

                    {/* Order Status Badge */}
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border capitalize shrink-0 ${statusClass}`}>
                      <i
                        className={`fa-solid fa-circle text-[5px] ${tx.status?.toLowerCase() === "pending" ? "animate-pulse" : ""
                          }`}
                      />
                      {tx.status}
                    </span>
                  </div>

                  {/* Details Description */}
                  <div className="text-[13px] text-slate-700 font-medium bg-slate-50 py-2.5 px-3.5 rounded-lg border border-slate-100 truncate" title={tx.details}>
                    {tx.details}
                  </div>

                  {/* Card Footer Details Grid */}
                  <div className="grid grid-cols-3 gap-2 pt-3 border-t border-dashed border-slate-200">
                    <div className="min-w-0">
                      <span className="text-[11px] text-slate-400 block mb-0.5">
                        Payment Method
                      </span>
                      <span className="text-xs font-semibold text-slate-700 capitalize truncate block">
                        {tx.paymentMethod || "N/A"}
                      </span>
                    </div>

                    <div>
                      <span className="text-[11px] text-slate-400 block mb-0.5">
                        Payment Status
                      </span>
                      <span
                        className={`inline-flex items-center gap-1 border px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize ${tx.paymentStatus === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                          : "bg-amber-50 text-amber-700 border-amber-200/60"
                          }`}
                      >
                        {tx.paymentStatus || "pending"}
                      </span>
                    </div>

                    <div className="text-end">
                      <span className="text-[11px] text-slate-400 block mb-0.5">
                        Total Amount
                      </span>
                      <span className="text-[15px] font-bold text-green-600">
                        ₹{Number(tx.amount || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 text-slate-500">
          <i className="fa-solid fa-receipt fa-2x mb-3 text-slate-300" />
          <p className="mb-0 text-sm font-medium">
            {searchTerm || statusFilter ? "No transactions found" : "No transactions yet"}
          </p>
        </div>
      )}

      {/* Pagination */}
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
  );
};

export default Transactions;