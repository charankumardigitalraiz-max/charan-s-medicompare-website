import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { axiosUserInstance, imgUrl } from "../../../Apiservice";
import { useResponsive } from "../../../hooks/useResponsive";
import { Table, Pagination } from "../../../components/ui";

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

  const headers = [
    columnConfig.date && {
      key: "createdAt",
      label: "Date",
      render: (value) => value ? new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) : "-"
    },
    columnConfig.name && {
      key: "name",
      label: "Name",
      className: "capitalize"
    },
    columnConfig.phone && {
      key: "phone",
      label: "Phone"
    },
    columnConfig.email && {
      key: "email",
      label: "Email",
      render: (value) => value || "-"
    },
    columnConfig.age && {
      key: "age",
      label: "Age"
    },
    columnConfig.city && {
      key: "city",
      label: "City"
    },
    columnConfig.doctor && {
      key: "doctor",
      label: "Doctor",
      className: "max-w-[200px] overflow-hidden",
      render: (value) => (
        <div className="flex items-center gap-2">
          {value?.profileImage?.[0] && (
            <img
              src={imgUrl + value.profileImage[0]}
              alt={value.name}
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
              {value?.name}
            </div>
            <div className="text-[11px] text-[#777] whitespace-nowrap overflow-hidden text-ellipsis font-normal">
              {value?.position}
            </div>
          </div>
        </div>
      )
    },
    columnConfig.preferredTime && {
      key: "preferredTime",
      label: "Preferred Time",
      render: (value) => (
        <span className="py-[3px] px-2 rounded text-[11px] font-semibold inline-block bg-[#e0f2fe] text-[#0369a1]">
          {value === "withinMonth"
            ? "Within Month"
            : value === "withinWeek"
              ? "Within Week"
              : value}
        </span>
      )
    },
    columnConfig.status && {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`py-[3px] px-2 rounded text-[11px] font-semibold inline-block ${value === "pending"
            ? "bg-[#fff3cd] text-[#856404]"
            : value === "confirmed"
              ? "bg-[#d4edda] text-[#155724]"
              : value === "completed"
                ? "bg-[#cce5ff] text-[#004085]"
                : "bg-[#f8d7da] text-[#721c24]"
            }`}
        >
          {value?.charAt(0).toUpperCase() + value?.slice(1)}
        </span>
      )
    }
  ].filter(Boolean);

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
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2 mt-2">
                <div className="flex items-center gap-3">
                  <i className="fa-solid fa-users text-[#321961] text-[20px] shrink-0" />

                  {/* <div className="flex flex-col gap-0.5">
                    <h4 className="m-0 text-slate-800 font-bold text-[16px] md:text-[18px] tracking-tight leading-none">
                      Consultation
                    </h4>
                    <p className="text-slate-500 text-[11px] md:text-[12px] m-0 font-medium">
                      Manage and track all your potential Consultation
                    </p>
                  </div> */}

                  <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                      Consultation
                    </div>
                    <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      Manage and track all your potential Consultation
                    </div>
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
                      className="h-[42px] rounded-sm border border-[#e0e0e0] pl-10 pr-4 text-sm w-full outline-none focus:border-[#321961] transition-colors"
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
              <div className="mt-4">
                <Table
                  headers={headers}
                  data={filteredOrders}
                  loading={loading}
                  emptyMessage="No consultations found."
                />
              </div>

              {/* Pagination */}
              <Pagination
                page={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Consultation;