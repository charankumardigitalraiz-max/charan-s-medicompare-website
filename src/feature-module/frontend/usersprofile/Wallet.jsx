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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
                <div className="flex items-center gap-3.5">
                  {HomeNavigate && <HomeNavigate />}
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
                    <i className="fa-solid fa-wallet" />
                  </div>


                  {/* <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                      Wallet
                    </div>
                    <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      View and manage all your Wallet
                    </p>
                  </div> */}




                  <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                      Wallet
                    </div>
                    <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      View and manage all your Wallet
                    </div>
                  </div>


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

              <div className="profile-table-wrapper mt-4">
                <div className="table-responsive">
                  <table className="profile-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Transaction ID</th>
                        <th>Amount</th>
                        <th>Payment Type</th>
                        <th>Payment Method</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filterWallet.map((wallet) => {
                        const isCredit = wallet.type?.toLowerCase() === "credit" || wallet?.type?.toLowerCase() === "refund";
                        const isSuccess = wallet.status?.toLowerCase() === "success" || wallet.status?.toLowerCase() === "completed";
                        const isFailed = wallet.status?.toLowerCase() === "failed" || wallet.status?.toLowerCase() === "failure";

                        return (
                          <tr key={wallet._id} className="capitalize">
                            <td>{wallet.createdAt ? new Date(wallet.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"}</td>
                            <td className="font-medium text-[#666]">{wallet.transactionId}</td>
                            <td className={`font-semibold ${isCredit ? "text-[#2ecc71]" : "text-[#e74c3c]"}`}>
                              {isCredit ? "+" : "-"}₹{wallet.amount.toFixed(2)}
                            </td>
                            <td>
                              <span
                                className={`py-[3px] px-2 rounded text-[11px] font-semibold inline-block ${isCredit ? "bg-[rgba(46,204,113,0.1)] text-[#2ecc71]" : "bg-[rgba(231,76,60,0.1)] text-[#e74c3c]"
                                  }`}
                              >
                                {wallet.type}
                              </span>
                            </td>
                            <td>{wallet.paymentMethod || "N/A"}</td>
                            <td>
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