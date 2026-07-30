import React, { useState, useEffect } from "react";
import { axiosCommonInstance } from "../../../Apiservice";
import LocationModal from "../../../components/LocationModal";
import { useResponsive } from "../../../hooks/useResponsive";
import toast from "react-hot-toast";
import BaseModal from "../../../components/ui/BaseModal"

// Styles migrated to Tailwind CSS

const Address = ({ HomeNavigate, BackButton }) => {
  const { isMobile } = useResponsive();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleEditAddress = (address) => {
    setEditingAddress(address);
    setShowLocationModal(true);
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setShowLocationModal(true);
  };

  const handleCloseModal = () => {
    setShowLocationModal(false);
    setEditingAddress(null);
  };

  const handleSaveAddress = async () => {
    setShowLocationModal(false);
    setEditingAddress(null);
    await loadSavedAddresses();
    setCurrentPage(1);
  };

  const loadSavedAddresses = async () => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) return;

      const response = await axiosCommonInstance.get("address/list", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const addresses = response.data?.data?.address || [];

      setSavedAddresses(addresses);
    } catch (error) {
      toast.error(error)
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (!window.confirm("Are you sure you want to delete this address?"))
      return;

    try {
      const token = localStorage.getItem("medicomparestoken");
      const response = await axiosCommonInstance.post(
        `address/delete/${addressId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 200) {
        setSavedAddresses((prev) =>
          prev.filter((addr) => addr._id !== addressId),
        );
        const totalPages = Math.ceil((savedAddresses.length - 1) / itemsPerPage);
        if (currentPage > totalPages && totalPages > 0) {
          setCurrentPage(totalPages);
        }
      }
    } catch (error) {

    }
  };

  useEffect(() => {
    loadSavedAddresses();
  }, []);

  const totalPages = Math.ceil(savedAddresses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAddresses = savedAddresses.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const getAddressIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "home":
        return "fa-solid fa-house";
      case "work":
        return "fa-solid fa-building";
      case "office":
        return "fa-solid fa-briefcase";
      default:
        return "fa-solid fa-location-dot";
    }
  };

  return (
    <div className="main-wrapper">
      <div className="content doctor-content">
        <div className="container">
          <div className="row">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-5 mb-6 border-b border-slate-100 mt-2">
              <div className="flex items-center gap-3.5">
                {HomeNavigate && <HomeNavigate />}
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
                  <i className="fa-solid fa-map-location-dot" />
                </div>


                {/* <div className="flex flex-col gap-1">
                  <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                    My Address
                  </div>
                  <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                    Manage your saved delivery Address
                  </p>
                </div> */}


                <div className="flex flex-col gap-1">
                  <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                    My Address
                  </div>
                  <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                    Manage your saved delivery Address
                  </div>
                </div>



              </div>
            </div>

            <div className="row g-4">
              {savedAddresses.length > 0 ? (
                <>
                  <div className="col-lg-4 col-md-6 col-12">
                    <div
                      className="profile-card-add"
                      onClick={() => handleAddAddress()}
                    >
                      <div className="w-[60px] h-[60px] rounded-full bg-[rgba(13,110,253,0.1)] flex items-center justify-center mb-[15px]">
                        <i className="fa-solid fa-plus text-2xl text-[#0d6efd]"></i>
                      </div>
                      <h6 className="text-[#444] text-[15px] mb-1 font-[600]">Add New Address</h6>
                    </div>
                  </div>
                  {currentAddresses.map((addr) => (
                    <div key={addr._id} className="col-lg-4 col-md-6 col-12 ">
                      <div className="profile-card">
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="profile-card-badge">
                            <i
                              className={`${getAddressIcon(addr.addressType)} me-2`}
                            ></i>{" "}
                            {addr.addressType || "Address"}
                          </div>
                          <div className="flex gap-2">
                            <i
                              className="fa-solid fa-pen cursor-pointer text-[13px] w-7 h-7 rounded-full bg-[#f8f9fa] text-[#666] inline-flex items-center justify-center transition-all duration-200 ease hover:bg-[#e8f0fe] hover:text-[#1a73e8]"
                              onClick={() => handleEditAddress(addr)}
                            ></i>
                            <i
                              className="fa-solid fa-trash cursor-pointer text-[13px] w-7 h-7 rounded-full bg-[#f8f9fa] text-[#666] inline-flex items-center justify-center transition-all duration-200 ease hover:bg-[#fce8e6] hover:text-[#d93025]"
                              onClick={() => handleDeleteAddress(addr._id)}
                            ></i>
                          </div>
                        </div>

                        <div className="font-semibold text-[15px] text-[#333] mt-[15px]">
                          {addr.name || "User"}
                        </div>

                        <div className="text-[13px] text-[#666] mt-2 leading-[1.5]">
                          {addr.houseNo ? `${addr.houseNo}, ` : ""}
                          {addr.street ? `${addr.street}, ` : ""}
                          {addr.area ? `${addr.area}, ` : ""}
                          {addr.city ? `${addr.city}, ` : ""}
                          {addr.state ? `${addr.state} ` : ""}
                          {addr.pincode ? `- ${addr.pincode}` : ""}
                          <br />
                          {addr.location?.address && (
                            <small className="text-muted">
                              ({addr.location.address})
                            </small>
                          )}
                        </div>

                        <div className="mt-3">
                          <a
                            href={
                              addr.location?.coordinates?.length === 2 &&
                                addr.location.coordinates[0] &&
                                addr.location.coordinates[1]
                                ? `https://www.google.com/maps/search/?api=1&query=${addr.location.coordinates[1]},${addr.location.coordinates[0]}`
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                  addr.location?.address ||
                                  `${addr.houseNo || ""} ${addr.street || ""} ${addr.area || ""} ${addr.city || ""} ${addr.state || ""} ${addr.pincode || ""}`.trim(),
                                )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-[#faf8ff] border border-[#e1d5f5] text-[#8059ca] no-underline font-semibold text-xs inline-flex items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ease w-full hover:bg-[#8059ca] hover:text-white hover:border-[#8059ca] hover:no-underline"
                          >
                            <i className="fa-solid fa-location-dot me-1"></i>{" "}
                            View in Maps
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <div className="col-12">
                  <div className="col-lg-4 col-md-6 col-12 mx-auto">
                    <div
                      className="profile-card-add"
                      onClick={() => handleAddAddress()}
                    >
                      <div className="w-[60px] h-[60px] rounded-full bg-[rgba(13,110,253,0.1)] flex items-center justify-center mb-[15px]">
                        <i className="fa-solid fa-plus text-2xl text-[#0d6efd]"></i>
                      </div>
                      <h6 className="text-[#444] text-[15px] mb-1 font-[600]">Add New Address</h6>
                      <p className="text-muted text-center small mt-2">
                        You haven't saved any addresses yet.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {savedAddresses.length > 6 && totalPages > 1 && (
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


      {showLocationModal && (
        <LocationModal
          showModal={showLocationModal}
          onClose={handleCloseModal}
          onSaveAddress={handleSaveAddress}
          editingAddress={editingAddress}
        />
      )}
    </div>
  );
};

export default Address;