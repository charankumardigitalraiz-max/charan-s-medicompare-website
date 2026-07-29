import React, { useEffect, useState } from "react";
import Home2Header from "../../../components/home/Header-k";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import { Link, useNavigate } from "react-router-dom";
import AmbulanceBookingModal from "./AmbulanceBookingModal";
import { axiosUserInstance } from "../../../Apiservice";
import toast from "react-hot-toast";
import { getImageUrl } from "../../../utils/imageUrl.js";
import { openRazorpayCheckout } from "../../../utils/razorpayUtils";
import { useResponsive } from "../../../hooks";

const AmbulanceCheckOut = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rideData, setRideData] = useState(null);
  const [originalPayload, setOriginalPayload] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [bookingDateTime, setBookingDateTime] = useState("");
  const [emergencyType, setEmergencyType] = useState("nonemergency");

  const { isXs: xsMobile, isMobile, isTabletOrBelow: isTablet } = useResponsive();

  useEffect(() => {
    const storedPayload = sessionStorage.getItem("ambulanceBookingData");
    const storedCategory = sessionStorage.getItem("selectedCategory");

    if (storedPayload) {
      try {
        const payload = JSON.parse(storedPayload);

        if (!payload.pickup || !payload.drop) {
          sessionStorage.removeItem("ambulanceBookingData");
          sessionStorage.removeItem("selectedCategory");
          navigate("/ambulance-service");
          return;
        }

        setOriginalPayload(payload);
        setRideData(payload);
        if (payload.paymentMethod) {
          setPaymentMethod(payload.paymentMethod);
        }
        fetchRideDetails(payload);
      } catch (error) {
        sessionStorage.removeItem("ambulanceBookingData");
        sessionStorage.removeItem("selectedCategory");
        navigate("/ambulance-service");
      }
    } else {
      navigate("/ambulance-service");
    }

    if (storedCategory) {
      try {
        const category = JSON.parse(storedCategory);
        setSelectedCategory(category);
      } catch (error) {
        sessionStorage.removeItem("selectedCategory");
      }
    }
  }, []);

  useEffect(() => {
    if (!showModal) {
      const storedPayload = sessionStorage.getItem("ambulanceBookingData");
      if (storedPayload) {
        try {
          const payload = JSON.parse(storedPayload);

          if (!payload.pickup || !payload.drop) {
            sessionStorage.removeItem("ambulanceBookingData");
            sessionStorage.removeItem("selectedCategory");
            navigate("/ambulance-service");
            return;
          }

          setOriginalPayload(payload);
          setRideData(payload);
          fetchRideDetails(payload);
        } catch (error) {
          sessionStorage.removeItem("ambulanceBookingData");
          sessionStorage.removeItem("selectedCategory");
          navigate("/ambulance-service");
        }
      } else {
        navigate("/ambulance-service");
      }
    }
  }, [showModal]);

  const fetchRideDetails = async (payload) => {
    try {
      const updatedPayload = {
        ...payload,
        emergencyType: "nonemergency",
      };
      const res = await axiosUserInstance.post("ride/search/details", updatedPayload, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
        },
      });
      if (res.data?.success && res.data?.data?.getlist) {
        setRideData(res.data.data.getlist);
      }
    } catch (error) {
    }
  };

  const handleConfirmBooking = async () => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    if (paymentMethod === "online") {
      await handleOnlinePayment();
    } else if (paymentMethod === "cod") {
      try {
        if (!originalPayload) {
          toast.error("Booking data not found. Please start a new booking.");
          sessionStorage.removeItem("ambulanceBookingData");
          sessionStorage.removeItem("selectedCategory");
          navigate("/ambulance-service");
          return;
        }

        if (!rideData) {
          toast.error("Ride details not available. Please try again.");
          return;
        }

        const orderPayload = {
          paymentMethod: "cod",
          distance: originalPayload?.distance > 100 ? originalPayload.distance / 1000 : originalPayload?.distance || rideData?.distance || 1,
          price: rideData.discountprice > 0 ? rideData.discountprice : rideData.price,
          amount: (rideData.discountprice > 0 ? rideData.discountprice * (originalPayload?.distance > 100 ? originalPayload.distance / 1000 : originalPayload?.distance || rideData?.distance || 1) : rideData.price * (originalPayload?.distance > 100 ? originalPayload.distance / 1000 : originalPayload?.distance || rideData?.distance || 1)) || originalPayload?.price || 25000,
          vendorId: rideData?.vendorId,
          productId: rideData?.tabletdetails?._id,
          emergencyType: emergencyType,
          pickup: originalPayload?.pickup,
          drop: originalPayload?.drop,
        };

        if (emergencyType === "nonemergency" && bookingDateTime) {
          orderPayload.bookingDateTime = bookingDateTime;
        }

        if (!orderPayload.pickup || !orderPayload.drop) {
          toast.error("Pickup and drop locations are required.");
          return;
        }
        if (emergencyType === "nonemergency" && !bookingDateTime) {
          toast.error("Please select booking date and time.");
          setIsSubmitting(false);
          return;
        }

        const orderRes = await axiosUserInstance.post(
          "ride/create",
          orderPayload,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
            },
          },
        );

        if (orderRes.data?.success) {
          const orderId = orderRes.data.data.orderId;
          sessionStorage.setItem("orderId", orderId);
          sessionStorage.setItem("paymentMethod", "cod");
          sessionStorage.removeItem("ambulanceBookingData");
          sessionStorage.removeItem("selectedCategory");
          navigate("/payment-success?type=ambulance");
        } else {
          toast.error("Order creation failed. Please contact support.");
        }
      } catch (error) {

        if (error.response?.status === 400) {
          toast.error("Invalid booking data. Please start a new booking.");
          sessionStorage.removeItem("ambulanceBookingData");
          sessionStorage.removeItem("selectedCategory");
          navigate("/ambulance-service");
        } else {
          toast.error("Order creation failed. Please contact support.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOnlinePayment = async () => {
    try {
      if (!originalPayload) {
        toast.error("Booking data not found. Please start a new booking.");
        sessionStorage.removeItem("ambulanceBookingData");
        sessionStorage.removeItem("selectedCategory");
        navigate("/ambulance-service");
        return;
      }

      if (!rideData) {
        toast.error("Ride details not available. Please try again.");
        return;
      }

      const orderPayload = {
        paymentMethod: "online",
        distance: originalPayload?.distance > 100 ? originalPayload.distance / 1000 : originalPayload?.distance || rideData?.distance || 1,
        price: rideData.discountprice > 0 ? rideData.discountprice : rideData.price,
        amount: (rideData.discountprice > 0 ? rideData.discountprice * (originalPayload?.distance > 100 ? originalPayload.distance / 1000 : originalPayload?.distance || rideData?.distance || 1) : rideData.price * (originalPayload?.distance > 100 ? originalPayload.distance / 1000 : originalPayload?.distance || rideData?.distance || 1)) || originalPayload?.price || 25000,
        vendorId: rideData?.vendorId,
        productId: rideData?.tabletdetails?._id,
        emergencyType: "nonemergency",
        pickup: originalPayload?.pickup,
        drop: originalPayload?.drop,
      };

      if (emergencyType === "nonemergency" && bookingDateTime) {
        orderPayload.bookingDateTime = bookingDateTime;
      }

      if (emergencyType === "nonemergency" && !bookingDateTime) {
        toast.error("Please select booking date and time.");
        setIsSubmitting(false);
        return;
      }
      if (!orderPayload.pickup || !orderPayload.drop) {
        toast.error("Pickup and drop locations are required.");
        return;
      }
      if (!orderPayload.vendorId) {
        toast.error("Service provider not available. Please try again.");
        return;
      }
      if (!orderPayload.productId) {
        toast.error("Service details not available. Please try again.");
        return;
      }
      if (orderPayload.amount > 100000 || orderPayload.amount <= 0) {
        toast.error("Invalid fare calculation. Please try again.");
        return;
      }
      const requiredFields = ['vendorId', 'productId', 'pickup', 'drop', 'paymentMethod', 'emergencyType'];
      const missingFields = requiredFields.filter(field => !orderPayload[field]);

      if (missingFields.length > 0) {
        toast.error(`Missing required information: ${missingFields.join(', ')}`);
        return;
      }
      const criticalFields = ['pickup', 'drop'];
      const invalidFields = criticalFields.filter(field => {
        const value = orderPayload[field];
        return !value || (typeof value === 'object' && (!value.address || !value.lat || !value.lng));
      });
      if (invalidFields.length > 0) {
        toast.error("Invalid location information. Please select locations again.");
        return;
      }
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Authentication token not found. Please login again.");
        navigate("/login");
        return;
      }
      const orderRes = await axiosUserInstance.post(
        "ride/create",
        orderPayload,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
          },
        },
      );

      if (!orderRes.data?.success) {
        toast.error("Order creation failed. Please contact support.");
        return;
      }

      const razorpayData = orderRes.data.data;
      const orderId =
        orderRes.data.orderId || orderRes.data._id || razorpayData?._id || razorpayData?.orderId;
      sessionStorage.setItem("orderId", orderId);
      if (!window.Razorpay) {
        toast.error("Payment service not loaded. Please refresh the page and try again.");
        return;
      }
      openRazorpayCheckout({
        razorpayData: {
          amount:
            razorpayData.amount * 100 ||
            (rideData?.price || originalPayload?.price || 25000) * 100,
          currency: razorpayData.currency || "INR",
          razorpayOrderId: razorpayData.razorpayOrderId,
        },
        description: "Ambulance Booking Payment",
        prefill: {
          name: "Customer",
          contact: "9999999999",
        },
        setIsSubmitting,
        onSuccess: async (res) => {
          const storedOrderId = sessionStorage.getItem("orderId");
          const verifyRes = await axiosUserInstance.post(
            "ride/verify-payment",
            {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              orderId: storedOrderId || "temp-order-id",
              bookingTypes: "ambulance",
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
              },
            },
          );
          if (verifyRes.data?.success) {
            sessionStorage.removeItem("ambulanceBookingData");
            sessionStorage.removeItem("selectedCategory");
            sessionStorage.setItem("paymentMethod", "online");
            navigate("/payment-success?type=ambulance");
          } else {
            toast.error("Payment verification failed. Please contact support.");
          }
        },
        onCancel: async () => {
          setIsSubmitting(false);
          const storedOrderId = sessionStorage.getItem("orderId");
          if (storedOrderId) {
            try {
              await axiosUserInstance.post(
                "ride/verify-payment",
                {
                  orderId: storedOrderId,
                  paymentStatus: "cancelled",
                  bookingTypes: "ambulance",
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
                  },
                }
              );
            } catch (e) {
              console.error("Failed to update cancelled payment status:", e);
            }
          }
          toast.error("Payment cancelled.");
        },
        onFailure: async (response) => {
          setIsSubmitting(false);
          const storedOrderId = sessionStorage.getItem("orderId");
          if (storedOrderId) {
            try {
              await axiosUserInstance.post(
                "ride/verify-payment",
                {
                  orderId: storedOrderId,
                  paymentStatus: "failed",
                  razorpay_order_id: response.error?.metadata?.order_id,
                  razorpay_payment_id: response.error?.metadata?.payment_id,
                  bookingTypes: "ambulance",
                },
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
                  },
                }
              );
            } catch (e) {
              console.error("Failed to update failed payment status:", e);
            }
          }
          toast.error(response.error?.description || "Payment failed.");
        },
      });
    } catch (error) {

      if (error.response?.status === 400) {
        toast.error("Invalid booking data. Please start a new booking.");

        sessionStorage.removeItem("ambulanceBookingData");
        sessionStorage.removeItem("selectedCategory");
        navigate("/ambulance-service");
      } else {
        toast.error("Payment initialization failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rideData) return null;

  const calculatedDistance = originalPayload?.distance || rideData?.distance || 0;
  const baseRate = rideData.price || 0;
  const effectiveRate = rideData.discountprice > 0 ? rideData.discountprice : baseRate;
  const totalAmount = effectiveRate * (calculatedDistance || 1);

  return (
    <div className="main-wrapper" style={{ backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      <Home2Header />
      <CategoryProvider />

      <div
        style={{
          display: "flex",
          flexDirection: isMobile || isTablet ? "column" : "row",
          gap: "24px",
          paddingTop: "24px",
          paddingBottom: "48px",
          background: "#f8f9fa",
          alignItems: "flex-start",
          paddingRight: isMobile ? "12px" : "30px",
          paddingLeft: isMobile ? "12px" : "30px",
          maxWidth: "1440px",
          margin: "0 auto",
        }}
      >
        {/* LEFT COLUMN: Main Card */}
        <div
          className="card shadow-sm"
          style={{
            width: isMobile || isTablet ? "100%" : "67%",
            borderRadius: "12px",
            border: "none",
            backgroundColor: "#fff",
            padding: isMobile ? "16px" : "24px",
            marginBottom: isMobile ? "20px" : "0",
            position: "relative",
          }}
        >
          {/* Back to Home Button */}
          <div style={{ paddingTop: "0px", marginBottom: "15px" }}>
            <Link
              to="/ambulance-service"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#8059ca",
                border: "1px solid #e9d5ff",
                borderRadius: "30px",
                padding: "6px 18px",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: "600",
                background: "#fdfaff",
                transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: "0 2px 5px rgba(128, 89, 202, 0.05)",
              }}
            >
              <i className="fas fa-arrow-left" style={{ fontSize: "11px" }} />
              Back to Ambulance Services
            </Link>
          </div>

          <div className="row g-3">
            {/* Vendor Details Banner */}
            {rideData?.vendordetails && (
              <div className="col-12">
                <div
                  style={{
                    borderRadius: "16px",
                    border: "1px solid #e9d5ff",
                    background: "linear-gradient(135deg, #fdfaff 0%, #f5f0ff 100%)",
                    padding: "18px 20px",
                    marginBottom: "4px",
                    boxShadow: "0 4px 16px rgba(128, 89, 202, 0.07)",
                    display: "flex",
                    alignItems: "center",
                    gap: "16px"
                  }}
                >
                  <div
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: "14px",
                      background: "#ffffff",
                      border: "1.5px solid #e9d5ff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(128,89,202,0.1)"
                    }}
                  >
                    {rideData.vendordetails?.bussiness_image?.[0] ? (
                      <img
                        src={getImageUrl(rideData.vendordetails.bussiness_image[0])}
                        alt="vendor"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <i className="fas fa-truck-medical" style={{ fontSize: "22px", color: "#8059ca" }} />
                    )}
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#8059ca", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Service Provider
                    </span>
                    <h5 style={{ margin: "2px 0 0 0", fontSize: "16px", fontWeight: "700", color: "#1e293b" }}>
                      {rideData.vendordetails.name || rideData.vendordetails.firstName || "Ambulance Provider"}
                    </h5>
                  </div>
                </div>
              </div>
            )}

            {/* Service & Route Card */}
            <div className="col-12">
              <div
                style={{
                  border: "1px solid #e9ecef",
                  borderRadius: "12px",
                  padding: "20px",
                  background: "#ffffff"
                }}
              >
                {/* Service Name & Type */}
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3" style={{ borderBottom: "1px dashed #e9ecef" }}>
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "10px",
                        background: "#f3eeff",
                        border: "1px solid #e9d5ff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#8059ca",
                        fontSize: "20px",
                        flexShrink: 0
                      }}
                    >
                      {rideData.tabletdetails?.files?.[0] ? (
                        <img
                          src={getImageUrl(rideData.tabletdetails.files[0])}
                          alt="Ambulance"
                          style={{ width: "100%", height: "100%", objectFit: "contain", borderRadius: "10px" }}
                        />
                      ) : (
                        <i className="fas fa-ambulance"></i>
                      )}
                    </div>
                    <div>
                      <h5 style={{ margin: 0, fontSize: "16px", fontWeight: "700", color: "#212529", textTransform: "capitalize" }}>
                        {rideData.tabletdetails?.name || "Ambulance Service"}
                      </h5>
                      <span className="badge mt-1" style={{ background: "#f8f9fa", color: "#495057", fontWeight: "600", fontSize: "11px", padding: "4px 10px", border: "1px solid #dee2e6" }}>
                        <i className="fas fa-ambulance me-1" style={{ color: "#8059ca" }}></i>
                        {rideData.tabletdetails?.ambulancetype || "Standard Emergency"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pickup & Drop Timeline Box */}
                <div style={{ background: "#f8f9fa", borderRadius: "10px", padding: "16px", border: "1px solid #e9ecef", marginBottom: "16px" }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span style={{ fontSize: "12px", fontWeight: "700", color: "#495057", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      Pickup & Drop Route
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowModal(true)}
                      style={{
                        background: "#ffffff",
                        border: "1px solid #8059ca",
                        borderRadius: "20px",
                        padding: "3px 12px",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#8059ca",
                        cursor: "pointer"
                      }}
                    >
                      <i className="fas fa-edit me-1"></i> Edit
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <i className="fas fa-circle mt-1" style={{ color: "#28a745", fontSize: "12px" }}></i>
                      <div>
                        <span style={{ fontSize: "11px", color: "#6c757d", fontWeight: "600", textTransform: "uppercase", display: "block" }}>Pickup Location</span>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#212529", marginTop: "2px" }}>
                          {originalPayload?.pickup?.address || "Pickup location address"}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <i className="fas fa-map-marker-alt mt-1" style={{ color: "#dc3545", fontSize: "14px" }}></i>
                      <div>
                        <span style={{ fontSize: "11px", color: "#6c757d", fontWeight: "600", textTransform: "uppercase", display: "block" }}>Drop Location</span>
                        <div style={{ fontSize: "13px", fontWeight: "600", color: "#212529", marginTop: "2px" }}>
                          {originalPayload?.drop?.address || "Drop location address"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Facilities List */}
                {rideData?.facilitiesdetails?.length > 0 && (
                  <div>
                    <h6 style={{ fontSize: "13px", fontWeight: "700", color: "#212529", marginBottom: "10px" }}>
                      Available On-Board Facilities
                    </h6>
                    <div className="row g-2">
                      {rideData.facilitiesdetails.map((facility) => (
                        <div key={facility._id} className="col-6 col-md-4">
                          <div
                            style={{
                              background: "#ffffff",
                              border: "1px solid #e9ecef",
                              borderRadius: "8px",
                              padding: "8px 10px",
                              display: "flex",
                              alignItems: "center",
                              gap: "8px"
                            }}
                          >
                            {facility?.files?.[0] ? (
                              <img
                                src={getImageUrl(facility.files[0])}
                                alt={facility?.name || "Facility"}
                                style={{ width: "24px", height: "24px", objectFit: "contain" }}
                              />
                            ) : (
                              <i className="fas fa-medkit" style={{ color: "#8059ca", fontSize: "16px" }}></i>
                            )}
                            <span style={{ fontSize: "12px", fontWeight: "600", color: "#495057" }} className="text-truncate">
                              {facility?.name || "Facility"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Bill Details & Payment */}
        <div
          style={{
            width: isMobile || isTablet ? "100%" : "33%",
            display: "flex",
            flexDirection: "column",
            gap: "20px"
          }}
        >
          {/* Bill Details Card */}
          <div
            className="card shadow-sm"
            style={{
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#fff",
              padding: "20px"
            }}
          >
            <h6 style={{ fontSize: "15px", fontWeight: "700", color: "#212529", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              Bill Details
            </h6>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#495057", alignItems: "center" }}>
                <span>Rate per km</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontWeight: "700", color: rideData.discountprice > 0 ? "#28a745" : "#212529" }}>
                    ₹{(rideData.discountprice > 0 ? rideData.discountprice : baseRate)?.toLocaleString("en-IN")}/km
                  </span>
                  {rideData.discountprice > 0 && (
                    <span style={{ textDecoration: "line-through", color: "#94a3b8", fontSize: "12px" }}>
                      ₹{baseRate?.toLocaleString("en-IN")}/km
                    </span>
                  )}

                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "#495057" }}>
                <span>Estimated Distance</span>
                <span style={{ fontWeight: "600", color: "#212529" }}>{calculatedDistance} km</span>
              </div>

              <div style={{ borderTop: "1px dashed #dee2e6", paddingTop: "10px", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#212529" }}>Total Fare</span>
                <span style={{ fontSize: "20px", fontWeight: "800", color: "#8059ca" }}>₹{totalAmount?.toLocaleString("en-IN") || 0}</span>
              </div>
            </div>

            {/* DateTime Schedule selector */}
            {emergencyType === "nonemergency" && (
              <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #f1f5f9" }}>
                <label style={{ fontSize: "12px", fontWeight: "700", color: "#495057", marginBottom: "6px", display: "block" }}>
                  <i className="fas fa-calendar-alt me-1" style={{ color: "#8059ca" }}></i> Booking Date & Time
                </label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={bookingDateTime}
                  onChange={(e) => setBookingDateTime(e.target.value)}
                  min={new Date().toISOString().slice(0, 16)}
                  style={{ borderRadius: "8px", padding: "8px 12px", border: "1px solid #ced4da", fontSize: "13px" }}
                  required
                />
              </div>
            )}
          </div>

          {/* Payment Method Card */}
          <div
            className="card shadow-sm"
            style={{
              borderRadius: "12px",
              border: "none",
              backgroundColor: "#fff",
              padding: "20px"
            }}
          >
            <h6 style={{ fontSize: "15px", fontWeight: "700", color: "#212529", marginBottom: "16px", borderBottom: "1px solid #f1f5f9", paddingBottom: "10px" }}>
              Payment Mode
            </h6>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
              {/* Online Payment */}
              <div
                onClick={() => {
                  const token = localStorage.getItem("medicomparestoken");
                  if (!token) {
                    toast.error("Please login to continue");
                    navigate("/login");
                    return;
                  }
                  setPaymentMethod("online");
                }}
                style={{
                  border: paymentMethod === "online" ? "2px solid #8059ca" : "1px solid #e9ecef",
                  background: paymentMethod === "online" ? "#f8f5ff" : "#ffffff",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fas fa-credit-card" style={{ color: "#8059ca", fontSize: "18px" }}></i>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#212529" }}>Online Payment</div>
                    <div style={{ fontSize: "11px", color: "#6c757d" }}>UPI, Credit/Debit Cards, Netbanking</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "online"}
                  onChange={() => setPaymentMethod("online")}
                  style={{ accentColor: "#8059ca" }}
                />
              </div>

              {/* Pay on Pickup COD */}
              <div
                onClick={() => {
                  const token = localStorage.getItem("medicomparestoken");
                  if (!token) {
                    toast.error("Please login to continue");
                    navigate("/login");
                    return;
                  }
                  setPaymentMethod("cod");
                }}
                style={{
                  border: paymentMethod === "cod" ? "2px solid #8059ca" : "1px solid #e9ecef",
                  background: paymentMethod === "cod" ? "#f8f5ff" : "#ffffff",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <i className="fas fa-hand-holding-usd" style={{ color: "#8059ca", fontSize: "18px" }}></i>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#212529" }}>Pay on Pickup (COD)</div>
                    <div style={{ fontSize: "11px", color: "#6c757d" }}>Pay directly to driver</div>
                  </div>
                </div>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  style={{ accentColor: "#8059ca" }}
                />
              </div>
            </div>

            <button
              onClick={handleConfirmBooking}
              disabled={isSubmitting}
              className="btn w-100"
              style={{
                background: isSubmitting ? "#6c757d" : "#8059ca",
                borderColor: "#8059ca",
                color: "#ffffff",
                fontWeight: "700",
                fontSize: "14px",
                padding: "12px",
                borderRadius: "30px"
              }}
            >
              {isSubmitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Processing...
                </>
              ) : (
                paymentMethod === "online" ? `Pay ₹${totalAmount?.toLocaleString("en-IN") || 0} Now` : "Confirm Booking"
              )}
            </button>

          </div>
        </div>
      </div>

      <AmbulanceBookingModal
        show={showModal}
        onClose={() => setShowModal(false)}
        editData={originalPayload}
        selectedCategory={selectedCategory}
      />
    </div>
  );
};

export default AmbulanceCheckOut;
