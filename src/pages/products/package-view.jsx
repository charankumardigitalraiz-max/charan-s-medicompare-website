import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosCommonInstance, imgUrl } from "../../Apiservice.jsx";
import { getImageUrl } from "../../utils/index";
import Home2Header from "../../components/layout/Header-k";
import Footer from "../../components/layout/Footer-f";
import breadcrumbBg2 from "/assets/img/bg/breadcrumb-bg-02.png";
import breadcrumbBg1 from "/assets/img/bg/breadcrumb-bg-01.png";
import breadcrumbBg3 from "/assets/img/bg/breadcrumb-icon.png";
import breadcrumbBg4 from "/assets/img/bg/breadcrumb-icon.png";
import CategoryProvider from "../../components/ui/CategoryProvider.jsx";
import { useResponsive } from "../../hooks";
import VendorActions from "../../components/ui/VendorActions.jsx";

const CompareView = () => {
  const [categories, setCategories] = useState([]);
  const { isMobile } = useResponsive();

  // useEffect(() => {
  //   const fetchCategories = async () => {
  //     try {
  //       const response = await axiosCommonInstance.get("categorylist");
  //       const { categories: categoryData } = response.data.data;
  //       setCategories(categoryData);
  //     } catch (err) {
  //       // Error fetching categories
  //     }
  //   };
  //   fetchCategories();
  // }, []);

  const navigate = useNavigate();
  const location = useLocation();

  const [cart, setCart] = useState({});
  const [comparisonData, setComparisonData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPackageIds, setSelectedPackageIds] = useState([]);

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");
  console.log("comparisonData", comparisonData)
  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem("healthCart");
    if (savedCart) setCart(JSON.parse(savedCart));
  }, []);

  const navigationData = location.state?.compareData;

  useEffect(() => {
    const ids =
      location.state?.packageIds ||
      JSON.parse(localStorage.getItem("compareItems") || "[]");
    setSelectedPackageIds(ids);

    if (navigationData) {
      if (Array.isArray(navigationData) && navigationData.length > 0) {
        setComparisonData(navigationData);
        setLoading(false);
      } else if (navigationData.list && Array.isArray(navigationData.list)) {
        setComparisonData(navigationData.list);
        setLoading(false);
      } else if (navigationData.data && Array.isArray(navigationData.data)) {
        setComparisonData(navigationData.data);
        setLoading(false);
      } else if (ids.length > 0) {
        fetchComparisonData(ids);
      } else {
        navigate("/");
      }
    } else if (ids.length > 0) {
      fetchComparisonData(ids);
    } else {
      navigate("/");
    }
  }, []);

  const fetchComparisonData = async (packageIds) => {
    try {
      setLoading(true);
      const response = await axiosCommonInstance.post("compare/list", {
        id: packageIds,
      });
      const data = response.data.list || response.data.data || [];
      setComparisonData(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to fetch comparison data"
      );
    } finally {
      setLoading(false);
    }
  };

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
          vendorId: pkg.vendor?._id || pkg.vendorId,
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
        }
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

  const handleBooking = async (vendor, med, effectiveVariantId, price, stock, path, servicePassed) => {
    await handleBook(med);
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
          vendorId: pkg.vendor?._id || pkg.vendorId,
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
        }
      );

      const result = response.data;
      navigate("/cart");
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Something went wrong while creating booking.");
      }
    }
  };

  //  removal
  const handleRemoveFromComparison = (packageId) => {
    const updatedData = comparisonData.filter((pkg) => pkg._id !== packageId);
    setComparisonData(updatedData);
    const updatedIds = selectedPackageIds.filter((id) => id !== packageId);
    setSelectedPackageIds(updatedIds);
    localStorage.setItem("compareItems", JSON.stringify(updatedIds));
  };

  const safeComparisonData = Array.isArray(comparisonData)
    ? comparisonData
    : [];

  return (
    <div className="main-wrapper">
      <Home2Header />
      <CategoryProvider categories={categories} />

      <div className="breadcrumb-bar" style={{ marginTop: "0px", backgroundImage: "url('/assets/Medicompares Background.png')", backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }}>
        <div className="container">
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 d-flex flex-column align-items-start position-relative">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-light btn-sm d-inline-flex align-items-center gap-2 mb-3"
                style={{
                  borderRadius: "20px",
                  padding: "6px 16px",
                  fontWeight: "500",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)"
                }}
              >
                <i className="fa-solid fa-arrow-left" />
                Go Back
              </button>
              <div className="text-center w-100">
                <h2 className="section-title" >
                  Compare Health Packages
                </h2>
                <p className="section-subtitle" >
                  Choose the perfect health check-up package for you
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="content doctor-content">
        <div className="container">

          {/* <div className="row">
            <div className="col-12">
              <div className="section-header text-center mb-5">
                <h2 className="section-title">
                  Popular Health Checkup Packages
                </h2>
                <p className="section-subtitle">
                  Choose the perfect health check-up package for you
                </p>
              </div>
            </div>
          </div> */}

          <div className="compare-section">
            {isMobile && safeComparisonData.length > 0 && (
              <div className="text-center mb-3">
                <span className="badge bg-purple-50 text-purple-700 px-3 py-2 rounded-pill font-medium" style={{ fontSize: "11px", border: "1px solid rgba(128, 89, 202, 0.2)" }}>
                  <i className="fa-solid fa-arrows-left-right me-1"></i> Swipe horizontally to compare packages
                </span>
              </div>
            )}

            <div
              className={isMobile ? "d-flex overflow-auto pb-4 gap-3 snap-x scroll-smooth" : "row"}
              style={isMobile ? {
                scrollSnapType: "x mandatory",
                scrollbarWidth: "none",
                msOverflowStyle: "none",
                paddingLeft: "15px",
                paddingRight: "15px",
              } : {}}
            >
              {safeComparisonData.length === 0 ? (
                <div className="col-12 text-center mt-5">
                  <h4 className="font-semibold text-gray-700">No packages selected for comparison.</h4>
                  <button
                    className="btn btn-dark rounded-pill mt-3 px-4 py-2"
                    onClick={() => navigate(-1)}
                  >
                    <i className="fa fa-arrow-left me-2"></i> Go Back
                  </button>
                </div>
              ) : (
                safeComparisonData.map((pkg) => (
                  <div
                    key={pkg._id}
                    className={isMobile ? "snap-align-start shrink-0 mb-2" : "col-lg-4 col-md-6 col-sm-12 col-12 mb-4"}
                    style={isMobile ? {
                      width: "86%",
                      scrollSnapAlign: "start",
                    } : {}}
                  >
                    <div 
                      className="package-card h-100" 
                      onClick={() => navigate(`/lab-package/${pkg._id}`)} 
                      style={{ 
                        cursor: "pointer",
                        borderRadius: "10px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
                        overflow: "hidden",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        flexDirection: "column",
                      }}
                    >
                      <div className="package-image position-relative" style={{ height: isMobile ? "140px" : "180px", background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", padding: "15px", borderBottom: "1px solid #f1f5f9" }}>
                        {/* Remove from comparison button */}
                        <div
                          className="package-cross-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromComparison(pkg._id);
                          }}
                          style={{
                            position: "absolute",
                            right: "10px",
                            top: "10px",
                            width: "28px",
                            height: "28px",
                            borderRadius: "50%",
                            background: "#ffffff",
                            color: "#94a3b8",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                            cursor: "pointer",
                            zIndex: 10,
                            border: "1px solid #e2e8f0",
                          }}
                        >
                          <i className="fa-solid fa-xmark" style={{ fontSize: "13px" }}></i>
                        </div>

                        <img
                          src={
                            pkg.files?.[0] ? getImageUrl(pkg.files[0]) : getImageUrl(pkg.image)
                          }
                          alt={pkg.name}
                          title={pkg.name}
                          loading="lazy"
                          style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
                        />
                      </div>

                      <div className="package-content p-4" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div className="package-header d-flex flex-column gap-1.5">
                          <h3 style={{ fontSize: isMobile ? "15px" : "17px", fontWeight: "500", color: "#1e293b", margin: 0 }}>{pkg.name}</h3>
                          <div className="price-section d-flex align-items-baseline gap-2 flex-wrap">
                            {(() => {
                              const itemPrice = parseFloat(pkg?.price) || 0;
                              const itemDiscountprice = parseFloat(pkg?.discountprice || pkg?.discountPrice) || null;
                              const effectivePrice = (itemDiscountprice && itemDiscountprice > 0) ? itemDiscountprice : itemPrice;

                              let discount = 0;
                              if (itemDiscountprice && itemDiscountprice > 0 && itemDiscountprice !== itemPrice) {
                                if (itemDiscountprice > itemPrice) {
                                  discount = Math.round(((itemDiscountprice - itemPrice) / itemDiscountprice) * 100);
                                } else {
                                  discount = Math.round(((itemPrice - itemDiscountprice) / itemPrice) * 100);
                                }
                              }

                              return (
                                <>
                                  <span
                                    className="price"
                                    style={{ fontSize: isMobile ? "16px" : "18px", fontWeight: "600", color: "#321961" }}
                                  >
                                    ₹{Number(effectivePrice || 0).toFixed(2)}
                                  </span>
                                  {itemDiscountprice && itemDiscountprice > 0 && itemDiscountprice !== itemPrice && (
                                    <>
                                      <span
                                        style={{
                                          fontSize: "12px",
                                          color: "#94a3b8",
                                          textDecoration: "line-through",
                                          fontWeight: "400"
                                        }}
                                      >
                                        ₹{Number(itemPrice || 0).toFixed(2)}
                                      </span>
                                      {discount > 0 && (
                                        <span
                                          style={{
                                            fontSize: "11px",
                                            color: "#321961",
                                            fontWeight: "500",
                                            background: "#f3e8ff",
                                            padding: "1px 5px",
                                            borderRadius: "3px",
                                          }}
                                        >
                                          {discount}% off
                                        </span>
                                      )}
                                    </>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>

                        <hr className="hrline my-3" style={{ borderTop: "1px solid #f1f5f9" }} />

                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "10px" }}
                        >
                          <div style={{ flexShrink: 0 }}>
                            <img
                              src={
                                pkg.vendor?.businessDetails?.bussiness_image
                                  ?.url
                                  ? getImageUrl(
                                    pkg.vendor?.businessDetails?.bussiness_image
                                      ?.url)
                                  : "/assets/default.png"
                              }
                              alt={pkg.vendorName}
                              title={pkg.vendorName}
                              loading="lazy"
                              style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "6px",
                                objectFit: "cover",
                                border: "1px solid #e2e8f0"
                              }}
                            />
                          </div>
                          <div>
                            <div style={{ fontSize: isMobile ? "12px" : "13px", fontWeight: "500", color: "#334155" }}>
                              {pkg?.vendor?.businessDetails?.name}
                            </div>
                            <div
                              style={{
                                fontSize: isMobile ? "11px" : "12px",
                                display: "flex",
                                alignItems: "center",
                                gap: "4px",
                                color: "#64748b",
                                marginTop: "1px",
                              }}
                            >
                              <i className="fa-solid fa-map-marker-alt" style={{ color: "#cbd5e1" }}></i>
                              <span className="text-truncate" style={{ maxWidth: isMobile ? "180px" : "280px" }}>
                                {pkg?.vendor?.businessDetails?.address}
                              </span>
                            </div>
                          </div>
                        </div>

                        {pkg.subcategories?.length > 0 && (
                          <>
                            <hr className="hrline my-3" style={{ borderTop: "1px solid #f1f5f9" }} />
                            <div className="profiles-section">
                              <h4 style={{ fontSize: "11px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }} className="d-flex align-items-center gap-1.5 mb-2">
                                <i className="fa-solid fa-user-doctor" style={{ color: "#321961", fontSize: "10px" }}></i>
                                {pkg.subcategories.length} Profile{pkg.subcategories.length > 1 ? "s" : ""}
                              </h4>

                              <div className="scrollable-content" style={{ maxHeight: "110px", overflowY: "auto" }}>
                                <ul className="points-list m-0 p-0" style={{ listStyle: "none" }}>
                                  {pkg.subcategories.map((profile, index) => (
                                    <li key={index} className="point-item d-flex align-items-center gap-2 mb-1">
                                      <span className="point-icon" style={{ fontSize: "11px", color: "#321961" }}>✓</span>
                                      <span className="point-text" style={{ fontSize: "12px", color: "#475569", fontWeight: "400" }}>
                                        {profile?.name}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        )}

                        {pkg.tablets?.length > 0 && (
                          <>
                            <hr className="hrline my-3" style={{ borderTop: "1px solid #f1f5f9" }} />
                            <div className="tests-section">
                              <h4 style={{ fontSize: "11px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }} className="d-flex align-items-center gap-1.5 mb-2">
                                <i className="fa-solid fa-vial" style={{ color: "#321961", fontSize: "10px" }}></i>
                                {pkg.tablets.length} Test{pkg.tablets.length > 1 ? "s" : ""}
                              </h4>

                              <div className="scrollable-content" style={{ maxHeight: "110px", overflowY: "auto" }}>
                                <ul className="points-list m-0 p-0" style={{ listStyle: "none" }}>
                                  {pkg.tablets.map((test, index) => (
                                    <li key={index} className="point-item d-flex align-items-center gap-2 mb-1">
                                      <span className="point-icon" style={{ fontSize: "11px", color: "#321961" }}>✓</span>
                                      <span className="point-text" style={{ fontSize: "12px", color: "#475569", fontWeight: "400" }}>
                                        {test.name}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        )}

                        {pkg.parameterss?.length > 0 && (
                          <>
                            <hr className="hrline my-3" style={{ borderTop: "1px solid #f1f5f9" }} />
                            <div className="tests-section">
                              <h4 style={{ fontSize: "11px", fontWeight: "600", color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }} className="d-flex align-items-center gap-1.5 mb-2">
                                <i className="fa-solid fa-flask" style={{ color: "#321961", fontSize: "10px" }}></i>
                                {pkg.parameterss.length} Parameter{pkg.parameterss.length > 1 ? "s" : ""}
                              </h4>

                              <div className="scrollable-content" style={{ maxHeight: "110px", overflowY: "auto" }}>
                                <ul className="points-list m-0 p-0" style={{ listStyle: "none" }}>
                                  {pkg.parameterss.map((test, index) => (
                                    <li key={index} className="point-item d-flex align-items-center gap-2 mb-1">
                                      <span className="point-icon" style={{ fontSize: "11px", color: "#321961" }}>✓</span>
                                      <span className="point-text" style={{ fontSize: "12px", color: "#475569", fontWeight: "400" }}>
                                        {test.name}
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </>
                        )}

                        <div className="action-buttons w-100 mt-auto pt-4">
                          <VendorActions
                            bookingType={
                              pkg?.categories?.categoryType ||
                              pkg?.category?.categoryType ||
                              "cart"
                            }
                            IsPackage={true}
                            med={pkg}
                            vendor={pkg?.vendor || {}}
                            price={parseFloat(pkg?.price) || 0}
                            calculatedDiscountPrice={parseFloat(pkg?.discountprice || pkg?.discountPrice) || null}
                            stock={pkg?.stock || 999}
                            service={pkg?.categories?.fixedType || pkg?.category?.fixedType}
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
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <Footer categories={categories} />
      </div>
    </div>
  );
};

export default CompareView;
