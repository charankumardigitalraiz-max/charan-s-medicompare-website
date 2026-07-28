import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { axiosUserInstance, imgUrl } from "../../../Apiservice";
import { useResponsive } from "../../../hooks/useResponsive";

// Styles migrated to Tailwind CSS

const Consultation = ({ HomeNavigate, BackButton }) => {
  const [leadslist, setleadslist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { isMobile } = useResponsive();
  const ordersPerPage = 10;

  const getLeadsData = async (page = 1, search = "") => {
    const token = localStorage.getItem("medicomparestoken");
    setLoading(true);

    try {
      const res = await axiosUserInstance.get(
        `consult-form/list?page=${page}&limit=${ordersPerPage}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setleadslist(res?.data?.data?.list || []);
      setTotalPages(res?.data?.data?.pagination?.totalPages || 1);
      setCurrentPage(res?.data?.data?.pagination?.page || 1);
    } catch (err) {
      // Error fetching leads
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      getLeadsData(currentPage, searchTerm);
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [currentPage, searchTerm]);

  const filteredOrders = leadslist;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const columnConfig = {
    date: filteredOrders.some((l) => l.createdAt),
    name: filteredOrders.some((l) => l.name),
    phone: filteredOrders.some((l) => l.phone),
    email: filteredOrders.some((l) => l.email),
    age: filteredOrders.some((l) => l.age !== null && l.age !== undefined),
    city: filteredOrders.some((l) => l.city),
    doctor: filteredOrders.some((l) => l.doctor),
    status: filteredOrders.some((l) => l.status),
    preferredTime: filteredOrders.some((l) => l.preferredTime),
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
                  <i className="fa-solid fa-users text-[#8059ca] text-[20px] shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <h4 className="m-0 text-slate-800 font-bold text-[16px] md:text-[18px] tracking-tight leading-none">
                      Consultation
                    </h4>
                    <p className="text-slate-500 text-[11px] md:text-[12px] m-0 font-medium">
                      Manage and track all your potential Consultation
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-[250px] shrink-0">
                    <input
                      type="text"
                      placeholder="Search by Name..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="h-[42px] rounded-lg border border-[#e0e0e0] pl-10 pr-4 text-sm w-full outline-none focus:border-[#8059ca] transition-colors"
                    />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none">
                      <i className="fa-solid fa-search" />
                    </span>
                  </div>
                  {HomeNavigate && <HomeNavigate />}
                </div>
              </div>
            </div>

            <div className="col-lg-12">
              <div className="bg-white rounded-xl border border-[#ececf6] shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden mb-5">
                <div className="table-responsive">
                  <table className="w-full border-collapse [&_tr:last-child_td]:border-b-0">
                    <thead>
                      <tr>
                        {columnConfig.date && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Date
                          </th>
                        )}
                        {columnConfig.name && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Name
                          </th>
                        )}
                        {columnConfig.phone && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Phone
                          </th>
                        )}
                        {columnConfig.email && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Email
                          </th>
                        )}
                        {columnConfig.age && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Age
                          </th>
                        )}
                        {columnConfig.city && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            City
                          </th>
                        )}
                        {columnConfig.doctor && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Doctor
                          </th>
                        )}
                        {columnConfig.preferredTime && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Preferred Time
                          </th>
                        )}
                        {columnConfig.status && (
                          <th className="bg-[#fbfbfe] text-[#777] text-[11px] font-semibold uppercase tracking-wide px-4 py-3.5 border-b border-[#ececf6] text-left">
                            Status
                          </th>
                        )}
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td
                            colSpan="100%"
                            className="text-center py-3 text-[13px] text-[#333] border-b border-[#ececf6]"
                          >
                            Loading...
                          </td>
                        </tr>
                      ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((lead) => (
                          <tr key={lead._id} className="hover:bg-[#faf9fe]">
                            {columnConfig.date && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle">
                                {new Date(lead.createdAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  },
                                )}
                              </td>
                            )}
                            {columnConfig.name && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle capitalize">
                                {lead.name}
                              </td>
                            )}
                            {columnConfig.phone && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle">
                                {lead.phone}
                              </td>
                            )}
                            {columnConfig.email && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle">
                                {lead.email || "-"}
                              </td>
                            )}
                            {columnConfig.age && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle">
                                {lead.age}
                              </td>
                            )}
                            {columnConfig.city && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle">
                                {lead.city}
                              </td>
                            )}
                            {columnConfig.doctor && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle max-w-[200px] overflow-hidden">
                                <div className="flex items-center gap-2">
                                  {lead.doctor?.profileImage?.[0] && (
                                    <img
                                      src={imgUrl + lead.doctor.profileImage[0]}
                                      alt={lead.doctor.name}
                                      className="w-8 h-8 rounded-full object-cover shrink-0"
                                    />
                                  )}
                                  <div className="min-w-0 flex-1 overflow-hidden">
                                    <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                                      {lead.doctor?.name}
                                    </div>
                                    <div className="text-[11px] text-[#777] whitespace-nowrap overflow-hidden text-ellipsis">
                                      {lead.doctor?.position}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            )}
                            {columnConfig.preferredTime && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle">
                                <span className="py-[3px] px-2 rounded text-[11px] font-semibold inline-block bg-[#e0f2fe] text-[#0369a1]">
                                  {lead.preferredTime === "withinMonth"
                                    ? "Within Month"
                                    : lead.preferredTime === "withinWeek"
                                      ? "Within Week"
                                      : lead.preferredTime}
                                </span>
                              </td>
                            )}
                            {columnConfig.status && (
                              <td className="px-4 py-3.5 text-[13px] text-[#333] border-b border-[#ececf6] align-middle">
                                <span
                                  className={`py-[3px] px-2 rounded text-[11px] font-semibold inline-block ${
                                    lead.status === "pending"
                                      ? "bg-[#fff3cd] text-[#856404]"
                                      : lead.status === "confirmed"
                                        ? "bg-[#d4edda] text-[#155724]"
                                        : lead.status === "completed"
                                          ? "bg-[#cce5ff] text-[#004085]"
                                          : "bg-[#f8d7da] text-[#721c24]"
                                  }`}
                                >
                                  {lead.status?.charAt(0).toUpperCase() +
                                    lead.status?.slice(1)}
                                </span>
                              </td>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="100%"
                            className="text-center py-3 text-[13px] text-[#333] border-b border-[#ececf6]"
                          >
                            No data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {totalPages > 1 && (
                <div className="pagination dashboard-pagination mt-4">
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
                              className={`page-link ${
                                currentPage === page ? "active" : ""
                              }`}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      }
                      if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
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
                          handlePageChange(
                            Math.min(currentPage + 1, totalPages),
                          )
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
        </div>
      </div>
    </div>
  );
};

export default Consultation;