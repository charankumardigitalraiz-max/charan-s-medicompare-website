import React, { useState, useEffect } from "react";
import { useResponsive } from "../../../hooks/useResponsive";
import { axiosUserInstance } from "../../../Apiservice";
import toast from "react-hot-toast";

// Styles migrated to Tailwind CSS

const Wallet = ({ HomeNavigate, BackButton }) => {
  const { isMobile } = useResponsive();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [wallets, setwallets] = useState([]);
  const [balance, setBalance] = useState(0);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1
  });
  const walletPerPage = 12;

  useEffect(() => {
    const getWalletAmount = async (page = 1) => {
      const token = localStorage.getItem("medicomparestoken");
      try {
        const response = await axiosUserInstance.get(`wallet/details?page=${page}&limit=${walletPerPage}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.data.success) {
          setwallets(response.data.data.transactions);
          setBalance(response.data.data.balance);
          setPagination(response.data.data.pagination);
        }
      } catch (error) {
        toast.error(error || "Error fetching wallet details:");
      }
    };
    getWalletAmount(currentPage);
  }, [currentPage]);

  const filterWallet = wallets.filter(
    (nt) =>
      nt.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > pagination.totalPages) return;
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="main-wrapper">
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            {BackButton && (
              <div className="col-12 mb-3">
                <BackButton />
              </div>
            )}

            {/* Header Section */}
            <div className="col-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5 mt-2">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-wallet text-[#8059ca] text-[20px] shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <h4 className="m-0 text-slate-800 font-bold text-[16px] md:text-[18px] tracking-tight leading-none">Wallet</h4>
                    <p className="text-slate-500 text-[11px] md:text-[12px] m-0 font-medium">
                      View and manage all your Wallet
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {HomeNavigate && <HomeNavigate />}
                </div>
              </div>
            </div>

            <div className="col-md-4 mb-3 mb-md-0">
              <div className="bg-white rounded-xl border-none shadow-[5px_4px_10px_rgba(0,0,0,0.03)] p-5">
                <div className="flex items-center">
                  <div className="w-[50px] h-[50px] rounded-[10px] bg-[rgba(125,46,255,0.1)] flex items-center justify-center mr-[15px] shrink-0">
                    <i className="fa-solid fa-wallet text-xl text-[#8059ca]"></i>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm mb-1">Current Balance</p>
                    <h3 className="text-slate-800 text-[28px] font-bold m-0">₹{balance?.toFixed(2) || "0.00"}</h3>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-12">
              {/* Search bar (kept commented out, preserved as-is from the original) */}
              {/* <div
                style={{
                  display: "flex",
                  flexDirection: isMobile ? "column" : "row",
                  gap: "12px",
                  width: isMobile ? "100%" : "auto",
                  alignItems: isMobile ? "stretch" : "center",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: isMobile ? "100%" : "250px",
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search Transaction ID..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    style={{
                      height: "42px",
                      borderRadius: "8px",
                      border: "1px solid #e0e0e0",
                      padding: "10px 15px 10px 40px",
                      fontSize: "14px",
                      transition: "all 0.3s ease",
                      width: "100%",
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                    onFocus={(e) =>
                      (e.target.style.borderColor = "#8059ca")
                    }
                    onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
                  />
                  <span
                    style={{
                      position: "absolute",
                      left: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#999",
                      pointerEvents: "none",
                    }}
                  >
                    <i className="fa-solid fa-search" />
                  </span>
                </div>
              </div> */}

              <div className="consultation-table-wrapper bg-white rounded-xl border border-[#ececf6] shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden mb-5 mt-4">
                <div className="table-responsive">
                  <table className="w-full border-collapse mb-0">
                    <thead>
                      <tr>
                        <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-[0.5px] py-3.5 px-4 border-b border-[#ececf6] text-left">Date</th>
                        <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-[0.5px] py-3.5 px-4 border-b border-[#ececf6] text-left">Transaction ID</th>
                        <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-[0.5px] py-3.5 px-4 border-b border-[#ececf6] text-left">Amount</th>
                        <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-[0.5px] py-3.5 px-4 border-b border-[#ececf6] text-left">Payment Type</th>
                        <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-[0.5px] py-3.5 px-4 border-b border-[#ececf6] text-left">Payment Method</th>
                        <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-[0.5px] py-3.5 px-4 border-b border-[#ececf6] text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterWallet.map((wallet) => {
                        const isCredit = wallet.type?.toLowerCase() === "credit" || wallet?.type?.toLowerCase() === "refund";
                        const isSuccess = wallet.status?.toLowerCase() === "success" || wallet.status?.toLowerCase() === "completed";
                        const isFailed = wallet.status?.toLowerCase() === "failed" || wallet.status?.toLowerCase() === "failure";

                        return (
                          <tr key={wallet._id} className="capitalize group hover:bg-[#faf9fe]">
                            <td className="py-3.5 px-4 text-[13px] text-[#333] border-b border-[#ececf6] align-middle group-last:border-b-0">{wallet.createdAt ? new Date(wallet.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}</td>
                            <td className="py-3.5 px-4 text-[13px] text-[#333] border-b border-[#ececf6] align-middle group-last:border-b-0 font-medium text-[#666]">{wallet.transactionId}</td>
                            <td className={`py-3.5 px-4 text-[13px] border-b border-[#ececf6] align-middle group-last:border-b-0 font-semibold ${isCredit ? "text-[#2ecc71]" : "text-[#e74c3c]"}`}>
                              {isCredit ? "+" : "-"}₹{wallet.amount.toFixed(2)}
                            </td>
                            <td className="py-3.5 px-4 text-[13px] text-[#333] border-b border-[#ececf6] align-middle group-last:border-b-0">
                              <span
                                className={`py-[3px] px-2 rounded text-[11px] font-semibold inline-block ${isCredit ? "bg-[rgba(46,204,113,0.1)] text-[#2ecc71]" : "bg-[rgba(231,76,60,0.1)] text-[#e74c3c]"
                                  }`}
                              >
                                {wallet.type}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-[13px] text-[#333] border-b border-[#ececf6] align-middle group-last:border-b-0">{wallet.paymentMethod || "N/A"}</td>
                            <td className="py-3.5 px-4 text-[13px] text-[#333] border-b border-[#ececf6] align-middle group-last:border-b-0">
                              <span
                                className={`py-[3px] px-2 rounded text-[11px] font-semibold inline-block ${isSuccess
                                  ? "bg-[#d4edda] text-[#155724]"
                                  : isFailed
                                    ? "bg-[#f8d7da] text-[#721c24]"
                                    : "bg-[#fff3cd] text-[#856404]"
                                  }`}
                              >
                                {wallet.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="pagination dashboard-pagination mt-4">
                  <ul className="d-flex justify-content-center">
                    <li>
                      <button
                        className="page-link"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        <i className="fa-solid fa-chevron-left" />
                      </button>
                    </li>

                    {Array.from({ length: pagination.totalPages }, (_, i) => {
                      const page = i + 1;
                      if (
                        page === 1 ||
                        page === pagination.totalPages ||
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
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                      >
                        <i className="fa-solid fa-chevron-right" />
                      </button>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;