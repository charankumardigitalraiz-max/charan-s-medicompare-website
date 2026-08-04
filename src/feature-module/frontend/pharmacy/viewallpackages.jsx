import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import { axiosCommonInstance } from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import { useLocation } from "../../../context/LocationContext.jsx";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import Pagination from "../../../components/ui/Pagination.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService.js";

const ViewAllPackages = () => {
  const navigate = useNavigate();
  const { service } = useParams();
  const { selectedPincode, latitude, longitude } = useLocation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [compareItems, setCompareItems] = useState([]);

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  const getPackageData = async (page) => {
    setLoading(true);
    let apiUrl = "packages/list";

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (selectedPincode) {
        const params = new URLSearchParams();
        params.append('pincode', selectedPincode);
        if (latitude && longitude) {
          params.append('lat', latitude);
          params.append('lng', longitude);
          params.append('page', page || pagination.page)
          params.append('limit', 12)
        }
        apiUrl += `?${params.toString()}`;
      }

      const response = await axiosCommonInstance.get(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      const packagesData =
        response.data?.list || response.data?.data?.list || [];
      setPackages(Array.isArray(packagesData) ? packagesData : []);
      setPagination(response.data?.data?.pagination || {});
      console.log(pagination)
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedCompareItems = localStorage.getItem("compareItems");
    if (savedCompareItems) {
      try {
        setCompareItems(JSON.parse(savedCompareItems));
      } catch (error) {
        toast.error("Error parsing compare items from localStorage:", error);
        localStorage.removeItem("compareItems");
      }
    }

    getPackageData();
  }, [service]);

  const handleBook = async (pkg) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("No token found. Please login again.");
        navigate("/login");
        return;
      }
      const payload = [
        {
          productId: null,
          variantId: null,
          vendorId:
            pkg.vendor?._id || pkg.vendorId || pkg.vendor?.businessDetails?._id,
          packageId: pkg._id,
          type: "package",
          bookingType: "buy_now",
        },
      ];

      const response = await axiosCommonInstance.post(
        "cart/buynow/create",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = response.data;
      navigate("/booking-process", { state: { bookingData: result } });
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Something went wrong while creating booking.");
      }
    }
  };

  const handleAddToCart = async (pkg) => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("No token found. Please login again.");
        navigate("/login");
        return;
      }
      const payload = [
        {
          productId: null,
          variantId: null,
          vendorId:
            pkg.vendor?._id || pkg.vendorId || pkg.vendor?.businessDetails?._id,
          packageId: pkg._id,
          type: "package",
        },
      ];

      const response = await axiosCommonInstance.post(
        "cart/addtocart",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      navigate("/cart");
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Something went wrong while adding to cart.");
      }
    }
  };

  const handlePageChange = (page) => {
    getPackageData(page);
  };

  const handleCompareToggle = (pkg, isChecked) => {
    let updatedItems;

    if (isChecked) {
      if (compareItems.length >= 3) {
        toast.error("You can only compare up to 3 packages!");
        return;
      }
      updatedItems = [...compareItems, pkg._id];
    } else {
      updatedItems = compareItems.filter((item) => item !== pkg._id);
    }

    setCompareItems(updatedItems);
    localStorage.setItem("compareItems", JSON.stringify(updatedItems));
  };

  const clearAllCompare = () => {
    setCompareItems([]);
    localStorage.removeItem("compareItems");
  };

  const handleCompareBar = async () => {
    try {
      const response = await axiosCommonInstance.post(
        "compare/list",
        { id: compareItems },
        { headers: { "content-type": "application/json" } },
      );

      if (response?.data?.list || response?.data?.data) {
        const dataToPass = response.data.list || response.data.data;
        navigate("/package-view", {
          state: {
            compareData: dataToPass,
            packageIds: compareItems,
          },
        });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch comparison data",
      );
    }
  };

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    await handleGeneralBookingProcess({
      productId: med?._id || med?.id || med?.name,
      variantId: effectiveVariantId || null,
      vendorId: vendor?.vendorId || vendor?._id || vendor?.businessDetails?._id,
      // servicefixedTypes: serviceDetails?.fixedType || med?.subcategorydetails?.catdetails?.fixedType || med?.subcategorydetails?.category?.fixedType || med?.category?.fixedType || "labtests",
      servicefixedTypes: serviceDetails,
      packageId: med?._id || null,
      navigate,
      redirectPath: path || "/booking-process",
    });
  };


  if (loading) {
    return <PageLoader />;
  }

  return (
    <>
      <Home2Header />
      <CategoryProvider />

      <section className="w-full py-8 pb-10 bg-[#f8f9fa]">
        <div className="w-full px-4 md:px-6 lg:px-8">
          <>
            {/* Header Row */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
              <h3 className="top-vendor-badge mb-2 text-2xl font-bold text-gray-900">
                All Packages
                  <i className="fas fa-bolt text-yellow-400 ml-2"></i>
                </h3>

                <div className="flex items-center flex-wrap gap-3">
                  <span
                    onClick={() => navigate(-1)}
                    className="top-vendor-badge cursor-pointer"
                  >
                    Go Back <i className="fa-solid fa-arrow-left ml-1"></i>
                  </span>
                </div>
              </div>

              {/* Compare Bar */}
              {packages && packages.length > 0 && compareItems.length > 0 && (
                <div className="relative w-4/5 mx-auto mb-4 px-4 py-2.5 bg-[var(--color-primary)] rounded-lg shadow-[0_4px_12px_rgba(125,46,255,0.3)] z-10">
                  <div
                    className="flex items-center justify-between w-full cursor-pointer text-white"
                    onClick={() => {
                      if (compareItems.length < 2) {
                        toast.error("Select at least 2 packages to compare");
                      } else {
                        handleCompareBar();
                      }
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="compare-label text-white font-semibold text-sm">
                        Compare :-
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <div className="hidden md:flex">
                          {compareItems.map((itemId, index) => {
                            const pkg = packages.find((p) => p._id === itemId);
                            return (
                              <div key={index} className="compare-item">
                                <span className="item-name text-white text-[13px] capitalize">
                                  {pkg?.name || `Item ${index + 1}`}
                                </span>
                                {index < compareItems.length - 1 && (
                                  <span className="item-comma text-white mx-0.5">
                                    ,
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span className="item-count text-white font-semibold text-[13px] ml-2">
                          Total ({compareItems.length})
                        </span>
                        <div className="hidden lg:flex items-center gap-1 ml-5">
                          <span className="text-white text-[13px] font-medium">
                            View More
                          </span>
                          <i
                            className="fas fa-arrow-right text-white text-[12px]"
                            style={{ animation: "slideRight 1.5s ease-in-out infinite" }}
                          ></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={clearAllCompare}
                    className="compare-clear-btn absolute right-4 top-1/2 -translate-y-1/2 w-[30px] h-[30px] rounded-full bg-white/20 border-none text-white text-xl flex items-center justify-center cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Package Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {packages.map((pkg, index) => {
                  return (
                    <div
                      key={pkg._id || index}
                      className="mb-3"
                    >
                      <div
                        className="rounded-[10px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 flex flex-col h-full cursor-pointer hover:-translate-y-1 hover:shadow-md"
                        onClick={() => navigate(`/lab-package/${pkg._id}`)}
                      >
                        {/* Image Area */}
                        <div className="relative w-full pt-[50%] overflow-hidden bg-[#f8f9fa] rounded-t-[10px]">
                          {/* Compare Toggle */}
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              const isChecked = !compareItems.includes(pkg._id);
                              handleCompareToggle(pkg, isChecked);
                            }}
                            className={!compareItems.includes(pkg._id) ? "pulse-compare-btn" : ""}
                            style={{
                              position: "absolute",
                              top: "10px",
                              right: "10px",
                              background: compareItems.includes(pkg._id)
                                ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                                : "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                              borderRadius: "30px",
                              padding: "3px 14px",
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: compareItems.includes(pkg._id)
                                ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                                : "0 4px 12px rgba(128, 89, 202, 0.4)",
                              zIndex: 10,
                              border: "1.5px solid #ffffff",
                              cursor: "pointer",
                              transition: "all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
                              transform: compareItems.includes(pkg._id) ? "scale(1.05)" : "scale(1)",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = "scale(1.12) translateY(-2px)";
                              e.currentTarget.style.boxShadow = compareItems.includes(pkg._id)
                                ? "0 8px 20px rgba(16, 185, 129, 0.45)"
                                : "0 8px 20px rgba(128, 89, 202, 0.55)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = compareItems.includes(pkg._id) ? "scale(1.05)" : "scale(1)";
                              e.currentTarget.style.boxShadow = compareItems.includes(pkg._id)
                                ? "0 4px 12px rgba(16, 185, 129, 0.3)"
                                : "0 4px 12px rgba(245, 158, 11, 0.4)";
                            }}
                            title="Compare Package"
                          >
                            <i
                              className={compareItems.includes(pkg._id) ? "fa-solid fa-circle-check" : "fa-solid fa-hand-pointer"}
                              style={{
                                fontSize: "13px",
                                color: "#ffffff",
                                transform: !compareItems.includes(pkg._id) ? "rotate(90deg)" : "none",
                                display: "inline-block",
                              }}
                            />
                            <span className="text-[11px] font-extrabold text-white uppercase tracking-wide">
                              {compareItems.includes(pkg._id) ? "Compared" : "Compare"}
                            </span>
                          </div>

                          {pkg?.files?.[0] ? (
                            <img
                              src={
                                pkg?.files?.[0]
                                  ? getImageUrl(pkg.files[0])
                                  : "/assets/default.png"
                              }
                              alt={pkg.name}
                              onError={(e) => {
                                e.target.src = "/assets/default.png";
                              }}
                              className="absolute top-0 left-0 w-full h-full object-contain"
                            />
                          ) : (
                            <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#F8F5FE] to-[#F2EDFE]">
                              <div className="w-[70px] h-[70px] border-2 border-[var(--color-primary)] rounded-[10px] flex flex-col items-center justify-center bg-white p-3">
                                <i
                                  className="isax isax-health text-[35px] text-[var(--color-primary)]"
                                ></i>
                                <span className="text-[9px] text-[var(--color-primary)] font-semibold mt-1.5 tracking-wide">
                                  PACKAGE
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Body */}
                        <div className="p-3 flex flex-col flex-grow">
                          <h6 className="mb-2 !text-[15px] !font-semibold leading-snug capitalize text-gray-900">
                            {pkg.name}
                          </h6>

                          {/* Profiles, Tests, and Parameters Details */}
                          <div className="flex flex-wrap gap-2 mb-2">
                            <div className="flex items-center gap-1 shrink-0 bg-[#F8F5FE] px-2 py-1 rounded-[5px] border border-purple-200/40">
                              <i className="isax isax-profile-2user text-[var(--color-primary)] text-[12px]"></i>
                              <span className="text-[11px] text-gray-700 font-semibold">
                                {pkg.subcategories?.length || 0} Profiles
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 bg-[#EAF3FF] px-2 py-1 rounded-[5px] border border-blue-200/40">
                              <i className="isax isax-test-tube text-[#110EFD] text-[12px]"></i>
                              <span className="text-[11px] text-gray-700 font-semibold">
                                {pkg.products?.length || 0} Tests
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0 bg-[#F1FAF3] px-2 py-1 rounded-[5px] border border-green-200/40">
                              <i className="isax isax-chart text-[#04BD6C] text-[12px]"></i>
                              <span className="text-[11px] text-gray-700 font-semibold">
                                {pkg.parameterss?.length || 0} Parameters
                              </span>
                            </div>
                          </div>

                          <div className="report-timee mb-2 text-[12px] text-gray-500">
                            <i className="fa-regular fa-file-lines mr-1" />{" "}
                            Reports in
                            <strong className="text-gray-800 ml-1">
                              {pkg?.tablets?.[0]?.reportsDuration || "N/A"}
                            </strong>
                          </div>

                          {/* Pricing */}
                          <div className="mb-3">
                            <div className="flex items-baseline gap-2">
                              {(() => {
                                const itemPrice = parseFloat(pkg?.price) || 0;
                                const itemDiscountprice =
                                  parseFloat(
                                    pkg?.discountprice || pkg?.discountPrice,
                                  ) || null;
                                const effectivePrice =
                                  itemDiscountprice && itemDiscountprice > 0
                                    ? itemDiscountprice
                                    : itemPrice;
                                let discount = 0;
                                if (
                                  itemDiscountprice &&
                                  itemDiscountprice > 0 &&
                                  itemDiscountprice !== itemPrice
                                ) {
                                  if (itemDiscountprice > itemPrice) {
                                    discount = Math.round(
                                      ((itemDiscountprice - itemPrice) /
                                        itemDiscountprice) *
                                      100,
                                    );
                                  } else {
                                    discount = Math.round(
                                      ((itemPrice - itemDiscountprice) /
                                        itemPrice) *
                                      100,
                                    );
                                  }
                                }

                                return (
                                  <>
                                    <span className="text-[18px] font-bold text-gray-900">
                                      ₹{Number(effectivePrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {itemDiscountprice &&
                                      itemDiscountprice > 0 &&
                                      itemDiscountprice !== itemPrice && (
                                        <>
                                          <span className="text-[14px] text-gray-400 line-through self-end">
                                            ₹{Number(itemPrice || 0).toFixed(2)}
                                          </span>
                                          {discount > 0 && (
                                            <div className="discountts self-end">
                                              <span className="bg-orange-500 text-white text-[12px] px-1.5 py-0.5 rounded">
                                                {discount}% Off
                                              </span>
                                            </div>
                                          )}
                                        </>
                                      )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>

                          <div className="flex w-full justify-center mb-2 mt-auto">
                            <VendorActions
                              bookingType={
                                pkg?.categories?.categoryType ||
                                "cart"
                              }
                              IsPackage={true}
                              med={pkg}
                              vendor={pkg?.vendor || {}}
                              price={parseFloat(pkg?.price) || 0}
                              calculatedDiscountPrice={parseFloat(pkg?.discountprice || pkg?.discountPrice) || null}
                              stock={pkg?.stock || 999}
                              service={pkg?.categories?.fixedType}
                              handleRentalBookinProcess=""
                              handleNavigateToBooking={handleBooking}
                              handleAddLead=""
                              handleOpenConsultationModal=""
                              handleOpenAppointmentModal=""
                              handleOpenRideModal=""
                              className="w-full"
                              containerStyle={{
                                display: "flex",
                                width: "100%",
                              }}
                            />
                          </div>

                          {/* Vendor Details */}
                          {pkg?.vendor && (
                            <div className="border-t border-gray-100 pt-2.5">
                              <div
                                className="flex items-center gap-2 cursor-pointer transition-all duration-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const vendorId =
                                    pkg.vendor?.businessDetails?.slug ||
                                    pkg.vendor?.businessDetails?.vendorId ||
                                    pkg.vendor?.businessDetails?._id ||
                                    pkg.vendor?.slug ||
                                    pkg.vendor?.vendorId ||
                                    pkg.vendor?._id;
                                  if (vendorId) {
                                    sessionStorage.setItem(
                                      "vendorId",
                                      vendorId,
                                    );
                                    const name =
                                      pkg.vendor?.bussinessdetails?.name ||
                                      pkg.vendor?.name ||
                                      "Vendor Store";
                                    const vendorSlug =
                                      pkg.vendor?.slug ||
                                      name
                                        .toLowerCase()
                                        .replace(/\s+/g, "-")
                                        .replace(/[^a-z0-9-]/g, "");
                                    navigate(`/vendor-profile/${vendorSlug}`);
                                  } else {
                                    toast.error(
                                      "Vendor information not available",
                                    );
                                  }
                                }}
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-white border border-gray-100">
                                  <img
                                    src={
                                      pkg.vendor?.businessDetails
                                        ?.bussiness_image?.url
                                        ? getImageUrl(
                                          pkg.vendor?.businessDetails
                                            ?.bussiness_image?.url,
                                        )
                                        : "/assets/default.png"
                                    }
                                    alt={pkg.vendorName || "Vendor"}
                                    title={pkg.vendorName || "Vendor"}
                                    className="w-full h-full object-contain"
                                    onError={(e) => {
                                      e.target.src = "/assets/default.png";
                                    }}
                                  />
                                </div>
                                <div className="flex-grow min-w-0">
                                  <h6
                                    className="!text-[13px] !font-semibold m-0 truncate !capitalize text-gray-900"
                                    title={
                                      pkg.vendor?.businessDetails
                                        ?.businessName ||
                                      pkg.vendor?.name ||
                                      "Vendor"
                                    }
                                  >
                                    {pkg.vendor?.businessDetails?.name ||
                                      pkg.vendor?.name ||
                                      "Vendor"}
                                  </h6>

                                  {pkg?.vendor?.businessDetails?.address && (
                                    <div
                                      className="flex items-center gap-1 mt-1 text-[11px] text-gray-500 overflow-hidden"
                                      title={
                                        pkg?.vendor?.businessDetails?.address
                                      }
                                    >
                                      <i className="isax isax-location text-[12px] text-[var(--color-primary)]"></i>
                                      <span className="truncate text-gray-700">
                                        {pkg?.vendor?.businessDetails?.address}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              <Pagination
                page={pagination?.page || 1}
                totalPages={pagination?.totalPages || 0}
                onPageChange={handlePageChange}
              />
            </>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ViewAllPackages;
