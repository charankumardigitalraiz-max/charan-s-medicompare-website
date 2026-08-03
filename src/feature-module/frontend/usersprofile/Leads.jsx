import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { axiosUserInstance } from "../../../Apiservice";
import { useResponsive } from "../../../hooks/useResponsive";
import BaseModal from "../../../components/ui/BaseModal";
import { Table, Pagination } from "../../../components/ui";

const Enquiries = ({ HomeNavigate, BackButton }) => {
  const [leadslist, setleadslist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showModal, setShowModal] = useState(false);

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
        `lead/list?page=${page}&limit=${ordersPerPage}&search=${encodeURIComponent(search)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      setleadslist(res?.data?.data?.leads || []);
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

  const viewLead = (lead) => {
    setSelectedLead(lead);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLead(null);
  };

  const columnConfig = {
    date: filteredOrders.some((l) => l.createdAt),
    name: filteredOrders.some((l) => l.name),
    phone: filteredOrders.some((l) => l.phone),
    relation: filteredOrders.some((l) => l.relation),
    email: filteredOrders.some((l) => l.email),
    age: filteredOrders.some((l) => l.age !== null && l.age !== undefined),
    gender: filteredOrders.some((l) => l.gender),
    price: filteredOrders.some(
      (l) => l.productdetails?.price || l.productdetails?.discountprice,
    ),
    serviceType: filteredOrders.some((l) => l.serviceType),
    status: filteredOrders.some((l) => l.status),
    city: filteredOrders.some((l) => l.city),
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
    columnConfig.email && {
      key: "email",
      label: "Email"
    },
    columnConfig.phone && {
      key: "phone",
      label: "Phone"
    },
    columnConfig.age && {
      key: "age",
      label: "Age"
    },
    columnConfig.gender && {
      key: "gender",
      label: "Gender",
      className: "capitalize"
    },
    columnConfig.price && {
      key: "price",
      label: "Price",
      render: (_, row) => row.productdetails?.discountprice ? (
        <span className="font-semibold">
          ₹{row.productdetails.discountprice.toLocaleString()}
        </span>
      ) : (
        <span className="font-semibold">
          ₹{row.productdetails?.price?.toLocaleString() || "N/A"}
        </span>
      )
    },
    columnConfig.serviceType && {
      key: "serviceType",
      label: "Service Type",
      render: (value) => (
        <span className="py-[3px] px-2 rounded text-[11px] font-semibold inline-block capitalize bg-[#e0f2fe] text-[#0369a1]">
          {value}
        </span>
      )
    },
    {
      key: "actions",
      label: "Action",
      className: "text-center",
      render: (_, row) => (
        <button
          className="btn btn-sm btn-light hover:bg-slate-100"
          title="View Lead"
          onClick={() => viewLead(row)}
          style={{
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            padding: "0",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer"
          }}
        >
          <i className="fas fa-eye"></i>
        </button>
      )
    }
  ].filter(Boolean);

  return (
    <div className="!w-full">
      <div className="!py-4 md:!py-6">
        <div className="!max-w-7xl !mx-auto !px-4 sm:!px-6 lg:!px-8">
          <div className="!flex !flex-col !gap-4">
            {BackButton && (
              <div className="col-12 mb-3">
                <BackButton />
              </div>
            )}
            <div className="!w-full">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
                <div className="flex items-center gap-3.5">
                  {HomeNavigate && <HomeNavigate />}
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#321961] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
                    <i className="fa-solid fa-users" />
                  </div>



                  {/* <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                      Enquiries
                    </div>
                    <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      Manage and track all your potential Enquiries
                    </p>
                  </div> */}



                  <div className="flex flex-col gap-1">
                    <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                      Enquiries
                    </div>
                    <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                      Manage and track all your potential Enquiries
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
                </div>
              </div>

              <div className="mt-4">
                <Table
                  headers={headers}
                  data={filteredOrders}
                  loading={loading}
                  emptyMessage="No enquiries found."
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


        {showModal && (

          <BaseModal
            show={showModal}
            onClose={() => setShowModal(false)}
            title={
              <div className="flex items-center gap-2" style={{ gap: "10px" }}>
                <h5 style={{ margin: 0, fontWeight: "700", fontSize: "18px", color: "#0f172a" }}>
                  Enquiry Details
                </h5>
                <span
                  style={{
                    fontSize: "12px",
                    background: "#f1f5f9",
                    color: "#64748b",
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontWeight: "600",
                  }}
                >
                  #{selectedLead._id ? selectedLead._id.slice(-8).toUpperCase() : "N/A"}
                </span>
              </div>}
            size="xl"
            // className="max-w-md mx-auto"
            bodyClassName="!p-2"
          >


            {/* BODY CONTENT */}
            <div style={{ padding: "24px", maxHeight: "75vh", overflowY: "auto" }}>
              {/* PRODUCT CARD */}
              {selectedLead.productdetails?.tabletdetails?.[0] && (
                <div
                  style={{
                    background: "#faf5ff",
                    border: "1px solid #f3e8ff",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    marginBottom: "20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "12px",
                  }}
                >
                  <div className="flex items-center gap-3">
                    {selectedLead.productdetails?.tabletdetails?.[0]?.files?.length > 0 ? (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: "#ffffff",
                          border: "1px solid #e9d5ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#321961",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        <img src={selectedLead.productdetails?.tabletdetails?.[0]?.files?.[0]} alt="" />
                      </div>
                    ) : selectedLead.productdetails?.tabletdetails?.[0]?.imageUrl?.length > 0 ? (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: "#ffffff",
                          border: "1px solid #e9d5ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#321961",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        <img src={selectedLead.productdetails?.tabletdetails?.[0]?.imageUrl?.[0]} alt="" />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          background: "#ffffff",
                          border: "1px solid #e9d5ff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#321961",
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        <i className="fas fa-box" />
                      </div>
                    )}

                    <div>
                      <div style={{ fontSize: "14px", fontWeight: "700", color: "#1e1b4b", textTransform: "capitalize" }}>
                        {selectedLead.productdetails?.tabletdetails?.[0]?.name}
                      </div>
                      <div style={{ fontSize: "12px", color: "#6b21a8" }}>Requested Product / Item</div>
                    </div>
                  </div>
                  {selectedLead.leadStage && (
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        padding: "3px 10px",
                        borderRadius: "20px",
                        background: "#ffffff",
                        color: "#321961",
                        border: "1px solid #e9d5ff",
                        textTransform: "capitalize",
                      }}
                    >
                      {selectedLead.leadStage}
                    </span>
                  )}
                </div>
              )}

              {/* TWO COLUMN DETAILS GRID */}
              <div className="row g-4">
                {/* PERSONAL INFO */}
                <div className="col-md-6 col-12">
                  <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#321961", marginBottom: "12px" }}>
                    Personal Information
                  </h6>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      { label: "Name", value: selectedLead.name || "N/A" },
                      { label: "Phone", value: selectedLead.phone || "N/A" },
                      { label: "Email", value: selectedLead.email || "N/A" },
                      { label: "Age", value: selectedLead.age || "N/A" },
                      ...(selectedLead.gender ? [{ label: "Gender", value: selectedLead.gender }] : []),
                      ...(selectedLead.relation ? [{ label: "Relation", value: selectedLead.relation }] : []),
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "6px", borderBottom: "1px solid #f8fafc" }}>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>{label}</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", textTransform: "capitalize" }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SERVICE DETAILS */}
                <div className="col-md-6 col-12">
                  <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#321961", marginBottom: "12px" }}>
                    Service Information
                  </h6>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {[
                      {
                        label: "Category",
                        value: selectedLead.serviceType
                          ? selectedLead.serviceType.charAt(0).toUpperCase() + selectedLead.serviceType.slice(1)
                          : "N/A",
                      },
                      {
                        label: "Vendor",
                        value: selectedLead.vendorassined
                          ? selectedLead.vendorassined.charAt(0).toUpperCase() + selectedLead.vendorassined.slice(1)
                          : "N/A",
                      },
                      {
                        label: "Source",
                        value: selectedLead.leadSource
                          ? selectedLead.leadSource.charAt(0).toUpperCase() + selectedLead.leadSource.slice(1)
                          : "N/A",
                      },
                      {
                        label: "Type",
                        value: selectedLead.leadType
                          ? selectedLead.leadType.charAt(0).toUpperCase() + selectedLead.leadType.slice(1)
                          : "N/A",
                      },
                      {
                        label: "Date",
                        value: selectedLead.createdAt
                          ? new Date(selectedLead.createdAt).toLocaleDateString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          : "N/A",
                      },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "6px", borderBottom: "1px solid #f8fafc" }}>
                        <span style={{ fontSize: "13px", color: "#64748b" }}>{label}</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", textTransform: "capitalize" }}>{value}</span>
                      </div>
                    ))}

                    {/* City / Location (Stacked for long addresses) */}
                    <div style={{ paddingBottom: "6px", borderBottom: "1px solid #f8fafc" }}>
                      <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "4px" }}>City / Location</div>
                      <div style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a", lineHeight: "1.4", wordBreak: "break-word" }}>
                        {selectedLead.city || selectedLead.location?.address || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VARIANT DETAILS */}
                {selectedLead?.variantDetails && Object.keys(selectedLead.variantDetails).length > 0 && (
                  <div className="col-12">
                    <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#321961", marginBottom: "12px" }}>
                      Variant Details
                    </h6>
                    <div style={{ display: "flex", gap: "24px", flexWrap: "wrap", background: "#f8fafc", padding: "12px 16px", borderRadius: "10px" }}>
                      <div>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Variant</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{selectedLead.variantDetails.name || "N/A"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Price</span>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#0f172a" }}>{selectedLead.variantDetails.price ? `₹${selectedLead.variantDetails.price}` : "N/A"}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>Discounted</span>
                        <span style={{ fontSize: "13px", fontWeight: "700", color: "#16a34a" }}>{selectedLead.variantDetails.discountprice ? `₹${selectedLead.variantDetails.discountprice}` : "N/A"}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ADDITIONAL NOTES */}
                {(selectedLead.problemDescription || selectedLead.preferredTimeline || selectedLead.policyNumber) && (
                  <div className="col-12">
                    <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#321961", marginBottom: "12px" }}>
                      Additional Notes
                    </h6>
                    <div style={{ background: "#f8fafc", padding: "14px 16px", borderRadius: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {selectedLead.policyNumber && (
                        <div style={{ fontSize: "13px" }}>
                          <strong style={{ color: "#64748b" }}>Insurance Policy: </strong>
                          <span style={{ fontWeight: "600", color: "#0f172a" }}>{selectedLead.policyNumber}</span>
                        </div>
                      )}
                      {selectedLead.preferredTimeline && (
                        <div style={{ fontSize: "13px" }}>
                          <strong style={{ color: "#64748b" }}>Preferred Timeline: </strong>
                          <span style={{ fontWeight: "600", color: "#0f172a" }}>{selectedLead.preferredTimeline}</span>
                        </div>
                      )}
                      {selectedLead.problemDescription && (
                        <div style={{ fontSize: "13px" }}>
                          <strong style={{ color: "#64748b", display: "block", marginBottom: "2px" }}>Description: </strong>
                          <span style={{ color: "#334155", lineHeight: "1.5" }}>{selectedLead.problemDescription}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </BaseModal>
        )}
      </div>
    </div>
  );
};

export default Enquiries;
