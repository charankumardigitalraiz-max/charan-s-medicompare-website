import React, { useState, useEffect } from "react";
import { useResponsive } from "../../hooks/useResponsive";
import { axiosUserInstance } from "../../Apiservice";
import toast from "react-hot-toast";
import { Table, Pagination } from "../../components/ui";

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

  const headers = [
    {
      key: "createdAt",
      label: "Date",
      render: (value) => value ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "-"
    },
    {
      key: "transactionId",
      label: "Transaction ID",
      className: "font-medium text-slate-500 normal-case"
    },
    {
      key: "amount",
      label: "Amount",
      render: (value, row) => {
        const isCredit = row.type?.toLowerCase() === "credit" || row.type?.toLowerCase() === "refund";
        return (
          <span className={`font-semibold ${isCredit ? "text-emerald-500" : "text-rose-500"}`}>
            {isCredit ? "+" : "-"}₹{value.toFixed(2)}
          </span>
        );
      }
    },
    {
      key: "type",
      label: "Payment Type",
      render: (value) => {
        const isCredit = value?.toLowerCase() === "credit" || value?.toLowerCase() === "refund";
        return (
          <span
            className={`py-[3px] px-2 rounded-md text-[11px] font-bold inline-block capitalize ${isCredit ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50" : "bg-rose-50 text-rose-700 border border-rose-200/50"
              }`}
          >
            {value}
          </span>
        );
      }
    },
    {
      key: "paymentMethod",
      label: "Payment Method",
      render: (value) => <span className="capitalize">{value || "N/A"}</span>
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const isSuccess = value?.toLowerCase() === "success" || value?.toLowerCase() === "completed";
        const isFailed = value?.toLowerCase() === "failed" || value?.toLowerCase() === "failure";
        return (
          <span
            className={`py-[3px] px-2.5 rounded-full text-[11px] font-bold inline-block capitalize ${isSuccess
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/50"
              : isFailed
                ? "bg-rose-50 text-rose-700 border border-rose-200/50"
                : "bg-amber-50 text-amber-700 border border-amber-200/50"
              }`}
          >
            {value}
          </span>
        );
      }
    }
  ];

  return (
    <div className="w-full">
      <div className="py-4 md:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4">
            {BackButton && (
              <div className="col-12 mb-3">
                <BackButton />
              </div>
            )}

            {/* Header Section */}
            <div className="w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-2 border-b border-slate-100 mt-2">
                <div className="flex items-center gap-3.5">
                  {HomeNavigate && <HomeNavigate />}                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-[var(--color-primary,#4c2691)] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
                    <i className="fa-solid fa-wallet" />
                  </div>
 
                  <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                      Wallet
                    </div>
                    <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      View and manage all your Wallet
                    </div>
                  </div>
                </div>
 
                {/* Compact Current Balance on the Right */}
                <div className="flex items-center gap-3 bg-purple-50/50 border border-purple-100/60 rounded-sm px-3 py-2 self-stretch sm:self-auto justify-between sm:justify-start shadow-[0_2px_10px_rgba(128,89,202,0.02)]">
                  <div className="w-8 h-8 rounded-lg bg-[var(--color-primary,#4c2691)] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <i className="fa-solid fa-wallet text-[14px]"></i>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-slate-500 block leading-none mb-1 font-semibold uppercase tracking-wider">Balance</span>
                    <span className="text-[#0f172a] text-[15px] font-bold block leading-none">₹{balance?.toFixed(2) || "0.00"}</span>
                  </div>
                </div>
              </div>
            </div>
 
            <div className="w-full">
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
                      (e.target.style.borderColor = "var(--color-primary,#4c2691)")
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

              <div className="mt-4">
                <Table
                  headers={headers}
                  data={filterWallet}
                  emptyMessage="No transactions found."
                />
              </div>

              {/* Pagination */}
              <Pagination
                page={currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;