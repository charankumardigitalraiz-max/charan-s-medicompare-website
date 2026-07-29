import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { axiosUserInstance } from "../../../Apiservice";
import { useResponsive } from "../../../hooks/useResponsive";
import { Modal } from "react-bootstrap";

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

  return (
    <div
      className="main-wrapper"
      style={{ paddingTop: isMobile ? "-200px" : "-50px" }}
    >
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            {BackButton && (
              <div className="col-12 mb-3">
                <BackButton />
              </div>
            )}
            <div className="col-lg-12">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
                <div className="flex items-center gap-3.5">
                  {HomeNavigate && <HomeNavigate />}
                  <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
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
                  <div className="relative w-full sm:w-[260px] shrink-0">
                    <input
                      type="text"
                      placeholder="Search by Name..."
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

              <div className="profile-table-wrapper">
                <div className="table-responsive">
                  <table className="profile-table">
                    <thead>
                      <tr>
                        {columnConfig.date && <th>Date</th>}
                        {columnConfig.name && <th>Name</th>}
                        {columnConfig.email && <th>Email</th>}
                        {columnConfig.phone && <th>Phone</th>}
                        {columnConfig.age && <th>Age</th>}
                        {columnConfig.gender && <th>Gender</th>}
                        {columnConfig.price && <th>Price</th>}
                        {columnConfig.serviceType && <th>Service Type</th>}
                        <th className="text-center">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="100%" className="text-center py-3">
                            Loading...
                          </td>
                        </tr>
                      ) : filteredOrders.length > 0 ? (
                        filteredOrders.map((lead) => (
                          <tr key={lead._id}>
                            {columnConfig.date && (
                              <td>
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
                            {columnConfig.name && <td style={{ textTransform: "capitalize" }}>{lead.name}</td>}
                            {columnConfig.email && <td>{lead.email}</td>}
                            {columnConfig.phone && <td>{lead.phone}</td>}
                            {columnConfig.age && <td>{lead.age}</td>}
                            {columnConfig.gender && <td>{lead.gender}</td>}
                            {columnConfig.price && (
                              <td>
                                {lead.productdetails?.discountprice ? (
                                  <span style={{ fontWeight: "600" }}>
                                    ₹{lead.productdetails.discountprice.toLocaleString()}
                                  </span>
                                ) : (
                                  <span style={{ fontWeight: "600" }}>
                                    ₹{lead.productdetails?.price?.toLocaleString() || "N/A"}
                                  </span>
                                )}
                              </td>
                            )}
                            {columnConfig.serviceType && (
                              <td style={{ textTransform: "capitalize" }}>
                                <span style={{
                                  padding: "3px 8px",
                                  borderRadius: "4px",
                                  fontSize: "11px",
                                  fontWeight: "600",
                                  backgroundColor: "#e0f2fe",
                                  color: "#0369a1",
                                  display: "inline-block"
                                }}>
                                  {lead.serviceType}
                                </span>
                              </td>
                            )}
                            <td className="text-center">
                              <button
                                className="btn btn-sm btn-light"
                                title="View Lead"
                                onClick={() => viewLead(lead)}
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
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="100%" className="text-center py-3">
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
                              className={`page-link ${currentPage === page ? "active" : ""
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
        {showModal && (
          <div
            onClick={closeModal}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(15, 23, 42, 0.55)",
              backdropFilter: "blur(6px)",
              WebkitBackdropFilter: "blur(6px)",
              zIndex: 999999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "760px",
                background: "#ffffff",
                borderRadius: "16px",
                overflow: "hidden",
                boxShadow: "0 24px 60px rgba(15, 23, 42, 0.22)",
              }}
            >
              {selectedLead && (
                <div style={{ background: "#ffffff", borderRadius: "16px", overflow: "hidden" }}>
                  {/* HEADER */}
                  <div
                    style={{
                      padding: "20px 24px",
                      borderBottom: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: "#ffffff",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2" style={{ gap: "10px" }}>
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
                    </div>
                    <button
                      type="button"
                      onClick={closeModal}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: "50%",
                        width: "32px",
                        height: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        color: "#64748b",
                        fontSize: "14px",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <i className="fas fa-times" />
                    </button>
                  </div>

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
                        <div className="d-flex align-items-center gap-3">
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
                                color: "#8059ca",
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
                                color: "#8059ca",
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
                                color: "#8059ca",
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
                              color: "#8059ca",
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
                        <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#8059ca", marginBottom: "12px" }}>
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
                        <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#8059ca", marginBottom: "12px" }}>
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
                          <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#8059ca", marginBottom: "12px" }}>
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
                          <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#8059ca", marginBottom: "12px" }}>
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
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Enquiries;
