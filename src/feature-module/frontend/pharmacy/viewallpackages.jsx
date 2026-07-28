import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import { axiosCommonInstance } from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import { useLocation } from "../../../context/LocationContext";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import { handleRentalBookingProcess, handleGeneralBookingProcess } from "../../../services/bookingService";
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


  return (
    <>
      <Home2Header />
      <CategoryProvider />

      <section
        className="content-categories"
        style={{ padding: "140px 0px 40px", backgroundColor: "#f8f9fa" }}
      >
        <div className="container-fluid">
          {loading ? (
            <PageLoader />
          ) : (
            <>
              <div className="d-flex align-items-center justify-content-between flex-wrap result-wrap gap-3 mb-4">
                <h3
                  className="mb-2 top-vendor-badge"
                  style={{
                    fontSize: "24px",
                    fontWeight: "700",
                    color: "#1a1a1a",
                  }}
                >
                  All Packages
                  <i className="fas fa-bolt text-warning me-2"></i>
                </h3>

                <div className="d-flex align-items-center flex-wrap gap-3">
                  <span
                    onClick={() => navigate(-1)}
                    className="top-vendor-badge"
                    style={{
                      textDecoration: "none",
                      cursor: "pointer",
                    }}
                  >
                    Go Back <i className="fa-solid fa-arrow-left ms-1"></i>
                  </span>
                </div>
              </div>

              {packages && packages.length > 0 && compareItems.length > 0 && (
                <div
                  className="compare-bar mb-4"
                  style={{
                    position: "relative",
                    bottom: "auto",
                    left: "auto",
                    transform: "none",
                    width: "80%",
                    margin: "0 auto",
                    padding: "10px 15px",
                    backgroundColor: "#8059ca",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(125, 46, 255, 0.3)",
                    zIndex: "10",
                  }}
                >
                  <div
                    className="compare-bar-content"
                    onClick={() => {
                      if (compareItems.length < 2) {
                        toast.error("Select at least 2 packages to compare");
                      } else {
                        handleCompareBar();
                      }
                    }}
                    style={{
                      cursor: "pointer",
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      width: "100%",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <span
                        className="compare-label"
                        style={{
                          color: "#ffffff",
                          fontWeight: "600",
                          fontSize: "14px",
                        }}
                      >
                        Compare :-
                      </span>
                      <div
                        className="compare-items"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          flexWrap: "wrap",
                        }}
                      >
                        <div className="d-none d-md-flex">
                          {compareItems.map((itemId, index) => {
                            const pkg = packages.find((p) => p._id === itemId);
                            return (
                              <div key={index} className="compare-item">
                                <span
                                  className="item-name"
                                  style={{
                                    color: "#ffffff",
                                    fontSize: "13px",
                                    textTransform: "capitalize",
                                  }}
                                >
                                  {pkg?.name || `Item ${index + 1}`}
                                </span>
                                {index < compareItems.length - 1 && (
                                  <span
                                    className="item-comma"
                                    style={{
                                      color: "#ffffff",
                                      margin: "0 2px",
                                    }}
                                  >
                                    ,
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span
                          className="item-count"
                          style={{
                            color: "#ffffff",
                            fontWeight: "600",
                            fontSize: "13px",
                            marginLeft: "8px",
                          }}
                        >
                          Total ({compareItems.length})
                        </span>
                        <div
                          className="ms-5 d-none d-lg-block"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <span
                            style={{
                              color: "#ffffff",
                              fontSize: "13px",
                              fontWeight: "500",
                            }}
                          >
                            View More
                          </span>
                          <i
                            className="fas fa-arrow-right"
                            style={{
                              color: "#ffffff",
                              fontSize: "12px",
                              animation: "slideRight 1.5s ease-in-out infinite",
                            }}
                          ></i>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={clearAllCompare}
                    className="compare-clear-btn"
                    style={{
                      position: "absolute",
                      right: "15px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "rgba(255, 255, 255, 0.2)",
                      border: "none",
                      color: "#ffffff",
                      fontSize: "20px",
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    ×
                  </button>
                </div>
              )}

              <div className="row">
                {packages.map((pkg, index) => {
                  return (
                    <div
                      key={pkg._id || index}
                      className="col-lg-3 col-md-4 col-sm-6 col-12 mb-3"
                    >
                      <div
                        className="card border-0"
                        onClick={() => navigate(`/lab-package/${pkg._id}`)}
                        style={{
                          borderRadius: "10px",
                          backgroundColor: "#ffffff",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
                          transition: "all 0.3s ease",
                          display: "flex",
                          flexDirection: "column",
                          height: "100%",
                          cursor: "pointer",
                        }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: "100%",
                            paddingTop: "50%",
                            overflow: "hidden",
                            background: "#f8f9fa",
                            borderRadius: "10px 10px 0 0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
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
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: "800",
                                color: "#ffffff",
                                textTransform: "uppercase",
                                letterSpacing: "0.6px",
                              }}
                            >
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
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                width: "100%",
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                background:
                                  "linear-gradient(135deg, #F8F5FE 0%, #F2EDFE 100%)",
                              }}
                            >
                              <div
                                style={{
                                  width: "70px",
                                  height: "70px",
                                  border: "2px solid #8059ca",
                                  borderRadius: "10px",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  background: "#ffffff",
                                  padding: "12px",
                                }}
                              >
                                <i
                                  className="isax isax-health"
                                  style={{
                                    fontSize: "35px",
                                    color: "#8059ca",
                                  }}
                                ></i>
                                <span
                                  style={{
                                    fontSize: "9px",
                                    color: "#8059ca",
                                    fontWeight: "600",
                                    marginTop: "6px",
                                    letterSpacing: "0.5px",
                                  }}
                                >
                                  PACKAGE
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                        <div
                          className="card-body"
                          style={{
                            padding: "12px",
                            display: "flex",
                            flexDirection: "column",
                            flexGrow: 1,
                          }}
                        >
                          <h6
                            className="mb-2 text-dark"
                            style={{
                              fontSize: "15px",
                              fontWeight: "600",
                              lineHeight: "1.3",
                              textTransform: "capitalize",
                            }}
                          >
                            {pkg.name}
                          </h6>
                          {/* Profiles, Tests, and Parameters Details */}
                          <div
                            className="d-flex gap-2 mb-2"
                            style={{ flexWrap: "wrap" }}
                          >
                            <div
                              className="d-flex align-items-center gap-1 flex-shrink-0"
                              style={{
                                background: "#F8F5FE",
                                padding: "4px 8px",
                                borderRadius: "5px",
                                border: "1px solid rgba(125, 46, 255, 0.2)",
                              }}
                            >
                              <i
                                className="isax isax-profile-2user"
                                style={{ color: "#8059ca", fontSize: "12px" }}
                              ></i>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#333",
                                  fontWeight: "600",
                                }}
                              >
                                {pkg.subcategories?.length || 0} Profiles
                              </span>
                            </div>
                            <div
                              className="d-flex align-items-center gap-1 flex-shrink-0"
                              style={{
                                background: "#EAF3FF",
                                padding: "4px 8px",
                                borderRadius: "5px",
                                border: "1px solid rgba(17, 14, 253, 0.2)",
                              }}
                            >
                              <i
                                className="isax isax-test-tube"
                                style={{ color: "#110EFD", fontSize: "12px" }}
                              ></i>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#333",
                                  fontWeight: "600",
                                }}
                              >
                                {pkg.products?.length || 0} Tests
                              </span>
                            </div>
                            <div
                              className="d-flex align-items-center gap-1 flex-shrink-0"
                              style={{
                                background: "#F1FAF3",
                                padding: "4px 8px",
                                borderRadius: "5px",
                                border: "1px solid rgba(4, 189, 108, 0.2)",
                              }}
                            >
                              <i
                                className="isax isax-chart"
                                style={{ color: "#04BD6C", fontSize: "12px" }}
                              ></i>
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "#333",
                                  fontWeight: "600",
                                }}
                              >
                                {pkg.parameterss?.length || 0} Parameters
                              </span>
                            </div>
                          </div>

                          <div
                            className="report-timee mb-2"
                            style={{ fontSize: "12px", color: "#666" }}
                          >
                            <i className="fa-regular fa-file-lines me-1" />{" "}
                            Reports in
                            <strong
                              style={{ color: "#333", marginLeft: "4px" }}
                            >
                              {pkg?.tablets?.[0]?.reportsDuration || "N/A"}
                            </strong>
                          </div>

                          {/* Pricing */}
                          <div className="mb-3">
                            <div className="d-flex gap-2">
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
                                    <span
                                      style={{
                                        fontSize: "18px",
                                        fontWeight: "700",
                                        color: "#1a1a1a",
                                      }}
                                    >
                                      ₹{Number(effectivePrice || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    {itemDiscountprice &&
                                      itemDiscountprice > 0 &&
                                      itemDiscountprice !== itemPrice && (
                                        <>
                                          <span
                                            style={{
                                              color: "#999",
                                              textDecoration: "line-through",
                                              fontSize: "14px",
                                              alignSelf: "flex-end",
                                            }}
                                          >
                                            ₹{Number(itemPrice || 0).toFixed(2)}
                                          </span>
                                          {discount > 0 && (
                                            <div className="discountts align-self-end">
                                              <span
                                                style={{
                                                  backgroundColor: "#F97316",
                                                  color: "white",
                                                  fontSize: "12px",
                                                  padding: "2px 6px",
                                                  borderRadius: "4px",
                                                }}
                                              >
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

                          <div className="d-flex w-100 justify-content-center mb-2" style={{ marginTop: "auto", width: "100%" }}>


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
                              className="w-100"
                              containerStyle={{
                                display: "flex",
                                width: "100%",
                              }}
                            />

                          </div>

                          {/* Vendor Details */}
                          {pkg?.vendor && (
                            <div
                              style={{
                                borderTop: "1px solid #eee",
                                paddingTop: "10px",
                              }}
                            >
                              <div
                                className="d-flex align-items-center gap-2"
                                style={{
                                  cursor: "pointer",
                                  transition: "all 0.2s ease",
                                }}
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
                                <div
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "8px",
                                    overflow: "hidden",
                                    flexShrink: 0,
                                    background: "#ffffff",
                                    border: "1px solid #eee",
                                  }}
                                >
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
                                    style={{
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "contain",
                                    }}
                                    onError={(e) => {
                                      e.target.src = "/assets/default.png";
                                    }}
                                  />
                                </div>
                                <div
                                  className="flex-grow-1"
                                  style={{ minWidth: 0 }}
                                >
                                  <h6
                                    className="mb-0 text-dark"
                                    style={{
                                      fontSize: "13px",
                                      fontWeight: "600",
                                      margin: 0,
                                      overflow: "hidden",
                                      textOverflow: "ellipsis",
                                      whiteSpace: "nowrap",
                                      textTransform: "capitalize",
                                    }}
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
                                      className="d-flex align-items-center gap-1 mt-1"
                                      style={{
                                        fontSize: "11px",
                                        color: "#666",
                                        overflow: "hidden",
                                      }}
                                      title={
                                        pkg?.vendor?.businessDetails?.address
                                      }
                                    >
                                      <i
                                        className="isax isax-location"
                                        style={{
                                          fontSize: "12px",
                                          color: "#8059ca",
                                        }}
                                      ></i>
                                      <span
                                        className="text-dark"
                                        style={{
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                          whiteSpace: "nowrap",
                                        }}
                                      >
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
              {pagination && pagination.totalPages > 1 && (() => {
                console.log("pagination", pagination.totalPages)
                const currentPage = pagination.page;
                const totalPages = pagination.totalPages;

                const getPages = () => {
                  const pages = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (currentPage > 4) pages.push("...");
                    const start = Math.max(2, currentPage - 2);
                    const end = Math.min(totalPages - 1, currentPage + 2);
                    for (let i = start; i <= end; i++) pages.push(i);
                    if (currentPage < totalPages - 3) pages.push("...");
                    pages.push(totalPages);
                  }
                  return pages;
                };

                const btnBase = {
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "38px",
                  height: "38px",
                  borderRadius: "10px",
                  border: "1.5px solid #e2e8f0",
                  background: "#ffffff",
                  color: "#374151",
                  fontSize: "13px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  padding: "0 10px",
                  fontFamily: "Poppins, sans-serif",
                };

                const activeBtnStyle = {
                  ...btnBase,
                  background: "linear-gradient(135deg, #8059ca 0%, #6a3db8 100%)",
                  border: "1.5px solid #8059ca",
                  color: "#ffffff",
                  boxShadow: "0 4px 12px rgba(128, 89, 202, 0.35)",
                  fontWeight: "600",
                };

                const disabledBtnStyle = {
                  ...btnBase,
                  opacity: 0.4,
                  cursor: "not-allowed",
                };

                return (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      marginTop: "32px",
                      marginBottom: "16px",
                      flexWrap: "wrap",
                    }}
                  >
                    {/* Previous */}
                    <button
                      style={currentPage <= 1 ? disabledBtnStyle : { ...btnBase, gap: "6px" }}
                      disabled={currentPage <= 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                      onMouseEnter={(e) => {
                        if (currentPage > 1) {
                          e.currentTarget.style.borderColor = "#8059ca";
                          e.currentTarget.style.color = "#8059ca";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(128, 89, 202, 0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.color = "#374151";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <i className="fa-solid fa-chevron-left" style={{ fontSize: "11px" }}></i>
                      <span style={{ fontSize: "12px" }}>Prev</span>
                    </button>

                    {/* Page Numbers */}
                    {getPages().map((page, idx) =>
                      page === "..." ? (
                        <span
                          key={`ellipsis-${idx}`}
                          style={{
                            ...btnBase,
                            cursor: "default",
                            border: "none",
                            background: "transparent",
                            color: "#9ca3af",
                            letterSpacing: "2px",
                          }}
                        >
                          ···
                        </span>
                      ) : (
                        <button
                          key={page}
                          style={page === currentPage ? activeBtnStyle : btnBase}
                          onClick={() => handlePageChange(page)}
                          onMouseEnter={(e) => {
                            if (page !== currentPage) {
                              e.currentTarget.style.borderColor = "#8059ca";
                              e.currentTarget.style.color = "#8059ca";
                              e.currentTarget.style.boxShadow = "0 2px 8px rgba(128, 89, 202, 0.15)";
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (page !== currentPage) {
                              e.currentTarget.style.borderColor = "#e2e8f0";
                              e.currentTarget.style.color = "#374151";
                              e.currentTarget.style.boxShadow = "none";
                            }
                          }}
                        >
                          {page}
                        </button>
                      )
                    )}

                    {/* Next */}
                    <button
                      style={currentPage >= totalPages ? disabledBtnStyle : { ...btnBase, gap: "6px" }}
                      disabled={currentPage >= totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                      onMouseEnter={(e) => {
                        if (currentPage < totalPages) {
                          e.currentTarget.style.borderColor = "#8059ca";
                          e.currentTarget.style.color = "#8059ca";
                          e.currentTarget.style.boxShadow = "0 2px 8px rgba(128, 89, 202, 0.2)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.color = "#374151";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      <span style={{ fontSize: "12px" }}>Next</span>
                      <i className="fa-solid fa-chevron-right" style={{ fontSize: "11px" }}></i>
                    </button>
                  </div>
                );
              })()}
            </>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ViewAllPackages;
