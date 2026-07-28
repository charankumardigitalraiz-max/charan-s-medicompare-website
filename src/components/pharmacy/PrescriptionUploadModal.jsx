import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { axiosCommonInstance, axiosUserInstance } from "../../Apiservice";
import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../../utils";
import VendorActions from "../ui/VendorActions.jsx";
import { useProfile } from "../../context/ProfileContext";
import LeadModal from "../../feature-module/frontend/pharmacy/products-components/LeadModal.jsx";
import RentModal from "../../feature-module/frontend/pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../../feature-module/frontend/pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../../feature-module/frontend/pharmacy/products-components/AppointmentModal.jsx";
import FamilyMemberSelectionModal from "../../feature-module/frontend/pharmacy/products-components/FamilyMemberSelectionModal.jsx";
import {
  handleRentalBookingProcess,
  handleLabTestBookingProcess,
  handleGeneralBookingProcess
} from "../../services/bookingService";

const PrescriptionUploadModal = ({
  show,
  onClose,
  onValidated,
  medicineData,
  mode = "analyze",
  pincode,
  lat,
  lng,
}) => {
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [noPrescription, setNoPrescription] = useState(false);
  const navigate = useNavigate();

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setFile(null);
      setFilePreview(null);
      setValidationError("");
      setSearchResults([]);
      setHasSearched(false);
      setNoPrescription(false);
    }
  }, [show]);

  // Modal States & Form States
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [familyMemberModel, setFamilyMemberModel] = useState(false);

  const [currentVendor, setCurrentVendor] = useState(null);
  const [currentMed, setCurrentMed] = useState(null);
  const [currentVariantId, setCurrentVariantId] = useState(null);
  const [rentProduct, setRentProduct] = useState(null);
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();
  const [selectedPatients, setSelectedPatients] = useState(["self"]);
  const [bookingTarget, setBookingTarget] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);

  const [leadFormData, setLeadFormData] = useState({
    date: "",
    name: "",
    email: "",
    mobile: "",
    policyNumber: "",
    relation: "",
    address: "",
  });
  const [rentFormData, setRentFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    duration: "",
    deliveryAddress: "",
  });
  const [consultationFormData, setConsultationFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });
  const [appointmentFormData, setAppointmentFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });

  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  const getFixedType = (med) => {
    return med?.subcategoryDetails?.categoryDetails?.fixedType ||
      med?.subcategorys?.category?.fixedType ||
      med?.category?.fixedType ||
      "medicine";
  };

  const handleSlots = async (vendor, med, serviceType) => {
    const variantId = med.variants?.[0]?._id || med.variant?.[0]?._id || null;
    onClose();
    await handleGeneralBookingProcess({
      productId: med._id,
      variantId,
      vendorId: vendor.vendorId || vendor._id,
      servicefixedTypes: serviceType,
      navigate,
      redirectPath: "/booking-process/slot"
    });
  };

  const handleRent = async (vendor, med, serviceType) => {
    const variantId = med.variants?.[0]?._id || med.variant?.[0]?._id || null;
    onClose();
    await handleRentalBookingProcess({
      productId: med._id,
      variantId,
      vendorId: vendor.vendorId || vendor._id,
      perDayRent: vendor?.perDayRent || 0,
      navigate,
      servicefixedTypes: serviceType,
    });
  };

  const handleAddLead = (vendor, med, variantId) => {
    if (!isLoggedIn) {
      toast.error("Please login to add lead");
      navigate("/login");
      return;
    }
    const effectiveVariantId = variantId || med.variants?.[0]?._id || null;
    setCurrentLeadData({
      vendor,
      med,
      variantId: effectiveVariantId,
    });
    setCurrentVendor(vendor);
    setCurrentMed(med);
    setCurrentVariantId(effectiveVariantId);

    const today = new Date().toISOString().split("T")[0];
    setLeadFormData({
      date: today,
      relation: "self",
      name: userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "",
      mobile: userProfile?.phone || "",
      email: userProfile?.email || "",
      fixedType: getFixedType(med),
      vendorId: vendor?.vendorId || vendor?._id,
      productId: med._id,
      variantId: effectiveVariantId,
      address: "",
      policyNumber: "",
    });
    setShowLeadModal(true);
  };

  const handleRentalBookinProcess = (vendor, med, variantId, price, stock, serviceType) => {
    handleRent(vendor, med, serviceType);
  };

  const handleNavigateToBooking = async (vendor, med, variantId, price, stock, path, serviceType) => {
    const isSlots = path.includes("slot");
    if (serviceType === "labtests" || serviceType === "lab-tests") {
      setBookingTarget({ vendor, tablet: med, bookingType: "buy_now", service: serviceType });
      setSelectedTests([med]);
      setFamilyMemberModel(true);
      return;
    }
    if (isSlots) {
      await handleSlots(vendor, med, serviceType);
    } else {
      const effVariantId = variantId || med.variants?.[0]?._id || null;
      onClose();
      await handleGeneralBookingProcess({
        productId: med._id,
        variantId: effVariantId,
        vendorId: vendor.vendorId || vendor._id,
        servicefixedTypes: serviceType,
        navigate,
        redirectPath: "/booking-process"
      });
    }
  };

  const handleOpenConsultationModal = (vendor, med, variantId, price, stock, serviceType) => {
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }
    setCurrentVendor(vendor);
    setCurrentMed(med);
    setCurrentVariantId(variantId || med.variants?.[0]?._id || null);

    const today = new Date().toISOString().split("T")[0];
    setConsultationFormData({
      date: today,
      name: userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "",
      phone: userProfile?.phone || "",
      category: getFixedType(med),
      address: "",
      vendorId: vendor?.vendorId || vendor?._id,
      productId: med._id,
      variantId: variantId || null,
    });
    setShowConsultationModal(true);
  };

  const handleOpenAppointmentModal = (vendor, med, variantId, price, stock, serviceType) => {
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }
    setCurrentVendor(vendor);
    setCurrentMed(med);
    setCurrentVariantId(variantId || med.variants?.[0]?._id || null);

    const today = new Date().toISOString().split("T")[0];
    setAppointmentFormData({
      date: today,
      name: userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "",
      phone: userProfile?.phone || "",
      category: getFixedType(med),
      address: "",
      vendorId: vendor?.vendorId || vendor?._id,
      productId: med._id,
      variantId: variantId || null,
    });
    setShowAppointmentModal(true);
  };

  const handleOpenRideModal = (vendor, med, variantId, price, stock, serviceType) => {
    toast.success("Ride option selected!");
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (!currentLeadData?.med) return;
    const { vendor, med, variantId } = currentLeadData;
    try {
      const token = localStorage.getItem("medicomparestoken");
      await axiosUserInstance.post(
        "lead/create",
        {
          name: leadFormData.name,
          email: leadFormData.email,
          phone: leadFormData.mobile,
          address: leadFormData.address,
          policyNumber: leadFormData.policyNumber,
          relation: leadFormData.relation,
          productId: med._id,
          vendorId: vendor._id || vendor.vendorId,
          variantId,
          leadSource: "Website",
          leadStage: "New",
          status: "active",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      toast.success("Lead submitted successfully!");
      setShowLeadModal(false);
      setCurrentLeadData(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to add lead");
    }
  };

  const handleRentFormChange = (e) => {
    const { name, value } = e.target;
    setRentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRentSubmit = (e) => {
    e.preventDefault();
    toast.success("Rent form submitted!");
    setShowRentModal(false);
  };

  const handleConsultationFormChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConsultationSubmit = (e) => {
    e.preventDefault();
    toast.success("Consultation booked successfully!");
    setShowConsultationModal(false);
  };

  const handleAppointmentFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAppointmentSubmit = (e) => {
    e.preventDefault();
    toast.success("Appointment booked successfully!");
    setShowAppointmentModal(false);
  };

  if (!show) return null;

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Maximum size allowed is 10 MB.");
        return;
      }
      setFile(selectedFile);
      setValidationError(""); // Clear error when new file is uploaded
      setSearchResults([]);
      setHasSearched(false);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleVerify = async () => {
    if (noPrescription) {
      if (!isLoggedIn) {
        toast.error("Please login to proceed with prescription payment");
        navigate("/login");
        return;
      }

      if (!window.Razorpay) {
        toast.error("Razorpay SDK failed to load. Please check your connection.");
        return;
      }

      setIsUploading(true);
      try {
        const token = localStorage.getItem("medicomparestoken");
        const orderRes = await axiosUserInstance.post(
          "prescription/payment/create",
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!orderRes.data || !orderRes.data.success) {
          throw new Error(orderRes.data?.message || "Failed to create prescription payment order");
        }

        const orderData = orderRes.data.data;

        const options = {
          key: "rzp_live_TB29Bn3l1ssijC",
          amount: orderData.amount,
          currency: orderData.currency,
          name: "MediCompares",
          description: "Prescription Fee",
          order_id: orderData.razorpayOrderId,
          handler: async function (response) {
            try {
              const verifyRes = await axiosUserInstance.post(
                "prescription/payment/verify",
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                },
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (verifyRes.data && verifyRes.data.success) {
                toast.success("Prescription fee paid successfully!");
                onValidated(null);
              } else {
                toast.error(verifyRes.data?.message || "Prescription payment verification failed.");
              }
            } catch (err) {
              toast.error("Error verifying prescription payment.");
            } finally {
              setIsUploading(false);
            }
          },
          prefill: {
            name: userProfile ? `${userProfile.first_name || ""} ${userProfile.last_name || ""}`.trim() : "Customer",
            email: userProfile?.email || "",
            contact: userProfile?.phone || "",
          },
          theme: {
            color: "#7c3aed",
          },
          modal: {
            ondismiss: function () {
              setIsUploading(false);
              toast.error("Prescription payment cancelled.");
            },
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (err) {
        toast.error(err.message || "Error starting prescription payment.");
        setIsUploading(false);
      }
      return;
    }

    if (!file) {
      toast.error("Please upload a prescription image.");
      return;
    }

    setIsUploading(true);
    setValidationError("");
    const formData = new FormData();
    formData.append("prescription", file);

    try {
      if (mode === "search") {
        if (pincode) formData.append("pincode", pincode);
        if (lat) formData.append("lat", lat);
        if (lng) formData.append("lng", lng);

        const response = await axiosCommonInstance.post("prescription/read", formData);
        const data = response?.data;

        if (!data) {
          throw new Error("Failed to read prescription.");
        }

        if (!data.success) {
          setSearchResults([]);
          setValidationError(data.message || "Could not read matching medicines from this prescription.");
          setHasSearched(true);
          return;
        }

        setSearchResults(data.data || []);
        setValidationError("");
        setHasSearched(true);
        toast.success("Prescription parsed successfully!");
      } else {
        formData.append("name", medicineData?.name || "");
        formData.append("composition", medicineData?.compositions?.name || "");

        const response = await axiosCommonInstance.post("prescription/analyze", formData);
        const data = response?.data;

        if (!data) {
          throw new Error("Failed to analyze prescription.");
        }

        if (!data.success) {
          setValidationError(data.message || "Your prescription doesn't contain this medicine");
          setHasSearched(true);
          return;
        }

        if (data.data?.isMatched) {
          toast.success("Prescription validated successfully!");
          onValidated(data.data?.prescriptionImage || "");
        } else {
          setValidationError("Your prescription doesn't contain this medicine");
          setHasSearched(true);
        }
      }
    } catch (error) {
      toast.error(error.message || "An error occurred during verification.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const selectedFile = e.dataTransfer.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("File is too large. Maximum size allowed is 10 MB.");
        return;
      }
      setFile(selectedFile);
      setValidationError("");
      setSearchResults([]);
      setHasSearched(false);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setFilePreview(null);
    setValidationError("");
    setSearchResults([]);
    setHasSearched(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(15, 23, 42, 0.4)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 999999999,
        backdropFilter: "blur(6px)",
        transition: "opacity 0.15s linear",
      }}
    >
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div
          className="modal-content shadow-2xl"
          style={{
            borderRadius: "24px",
            border: "none",
            overflow: "hidden",
            backgroundColor: "#ffffff",
            fontFamily: "'Outfit', sans-serif",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
          }}
        >
          {/* Header */}
          <div
            className="px-4 py-3.5 d-flex justify-content-between align-items-center"
            style={{
              borderBottom: "1px solid #f1f5f9",
              backgroundColor: "#ffffff",
            }}
          >
            <div className="d-flex align-items-center gap-2" style={{
              padding: "10px"
            }}>
              <div
                className="d-flex align-items-center justify-content-center"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  backgroundColor: "#f5f3ff",
                  color: "#7c3aed",
                }}
              >
                <i className="fa-solid fa-file-medical" style={{ fontSize: "1.1rem" }}></i>
              </div>
              <div>
                <h5 className="mb-0" style={{ fontWeight: 600, color: "#0f172a", fontSize: "1.1rem" }}>
                  {mode === "search" ? "Search by Prescription" : "Upload Prescription"}
                </h5>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="d-flex align-items-center justify-content-center"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "#f1f5f9",
                border: "none",
                color: "#64748b",
                cursor: "pointer",
                transition: "all 0.2s ease",
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#e2e8f0";
                e.currentTarget.style.color = "#0f172a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f1f5f9";
                e.currentTarget.style.color = "#64748b";
              }}
            >
              <i className="fa-solid fa-xmark" style={{ fontSize: "0.95rem" }}></i>
            </button>
          </div>

          {/* Body */}
          <div className="p-4" style={{ backgroundColor: "#ffffff" }}>
            {hasSearched ? (
              <div>
                {mode === "search" ? (
                  <>
                    <h6 className="mb-3.5" style={{ fontWeight: 600, color: "#0f172a", fontSize: "0.95rem" }}>
                      Matching Medicines Found ({searchResults.length})
                    </h6>

                    {searchResults.length === 0 ? (
                      <div className="text-center py-5 text-muted" style={{ fontSize: "0.9rem" }}>
                        <i className="fa-solid fa-face-frown d-block mb-2" style={{ fontSize: "1.5rem" }}></i>
                        {validationError || "No matching medicines found in our database."}
                      </div>
                    ) : (
                      <div
                        style={{
                          maxHeight: "360px",
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                          gap: "14px",
                          paddingRight: "4px"
                        }}
                      >
                        {searchResults.map((item) => (
                          <div
                            key={item._id}
                            className="p-3"
                            style={{
                              border: "1px solid #e2e8f0",
                              borderRadius: "16px",
                              backgroundColor: "#f8fafc",
                              display: "flex",
                              flexDirection: "column",
                              gap: "10px"
                            }}
                          >
                            {/* Medicine Info */}
                            <div className="d-flex align-items-center gap-2.5 min-w-0">
                              <img
                                src={getImageUrl(item.imageUrl?.[0] || item.files?.[0])}
                                alt={item.name}
                                style={{
                                  width: "44px",
                                  height: "44px",
                                  borderRadius: "8px",
                                  objectFit: "contain",
                                  backgroundColor: "#ffffff",
                                  border: "1px solid #f1f5f9",
                                  padding: "2px"
                                }}
                                onError={(e) => { e.target.src = "/assets/default.png"; }}
                              />
                              <div className="min-w-0 flex-grow-1">
                                <span
                                  className="d-block text-dark text-truncate"
                                  style={{
                                    fontSize: "0.85rem",
                                    fontWeight: 700,
                                    lineHeight: 1.2,
                                    marginBottom: "2px"
                                  }}
                                >
                                  {item.name}
                                </span>
                                <span className="text-muted text-truncate d-block" style={{ fontSize: "0.75rem" }}>
                                  {item.strength || item.form || "Medicine"}
                                </span>
                              </div>
                            </div>

                            {/* Vendors Array */}
                            {item.vendors && item.vendors.length > 0 ? (
                              <div className="d-flex flex-column gap-2" style={{ borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
                                {item.vendors.map((v) => {
                                  const price = v.discountprice ?? v.price;
                                  const hasDiscount = v.discountprice && v.discountprice < v.price;
                                  const serviceType = item.category?.fixedType || "medicine";
                                  const bookingType = item.category?.categoryType || (serviceType === "medicine" ? "cart" : "leads");
                                  //  let serviceType = searchResults?.
                                  return (
                                    <div
                                      key={v._id}
                                      className="d-flex flex-column p-3 gap-2"
                                      style={{
                                        backgroundColor: "#ffffff",
                                        borderRadius: "12px",
                                        border: "1px solid #e2e8f0",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
                                      }}
                                    >
                                      {/* Top: Vendor Info & Price */}
                                      <div className="d-flex justify-content-between align-items-start gap-2">
                                        <div className="min-w-0">
                                          <span className="d-block text-dark text-truncate" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                                            {v.businessDetails?.name || "Vendor"}
                                          </span>
                                          {v.businessDetails?.distance !== undefined && (
                                            <span className="text-muted" style={{ fontSize: "0.7rem" }}>
                                              <i className="fa-solid fa-location-dot me-1"></i>
                                              {v.businessDetails.distance} km away
                                            </span>
                                          )}
                                        </div>

                                        <div className="text-end flex-shrink-0" style={{ minWidth: "60px" }}>
                                          {hasDiscount && (
                                            <span className="text-muted text-decoration-line-through d-block" style={{ fontSize: "0.7rem", lineHeight: 1 }}>
                                              ₹{v.price}
                                            </span>
                                          )}
                                          <span className="text-dark d-block" style={{ fontSize: "0.9rem", fontWeight: 700, color: "#7c3aed" }}>
                                            ₹{price}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Bottom: Action Buttons */}
                                      <div className="mt-1" style={{ width: "100%" }}>
                                        <VendorActions
                                          bookingType={bookingType}
                                          isInStock={v.stock !== 0}
                                          isStockFalse={v.isStock === false || v.isStock === "false" || v.stock === 0}
                                          isServiceType={bookingType !== "cart"}
                                          med={item}
                                          vendor={v}
                                          effectiveVariantId={item.variants?.[0]?._id || null}
                                          price={price}
                                          service={serviceType}
                                          calculatedDiscountPrice={v.discountprice}
                                          handleRentalBookinProcess={handleRentalBookinProcess}
                                          handleNavigateToBooking={handleNavigateToBooking}
                                          handleAddLead={handleAddLead}
                                          handleOpenConsultationModal={handleOpenConsultationModal}
                                          handleOpenAppointmentModal={handleOpenAppointmentModal}
                                          handleOpenRideModal={handleOpenRideModal}
                                          rentAndCartButtonStyles={{
                                            fontSize: "12px",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                            border: "none",
                                            width: "100%"
                                          }}
                                          containerStyle={{
                                            width: "100%",
                                            display: "flex"
                                          }}
                                          buttonStyle={{
                                            fontSize: "12px",
                                            padding: "6px 12px",
                                            borderRadius: "8px",
                                            background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                            border: "none",
                                            color: "white",
                                            width: "100%"
                                          }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                            ) : (
                              <div className="text-center py-1 text-muted" style={{ fontSize: "0.75rem", borderTop: "1px dashed #e2e8f0", paddingTop: "8px" }}>
                                No local vendors available near your location.
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <div
                      className="d-inline-flex align-items-center justify-content-center mb-3"
                      style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        backgroundColor: "#fef2f2",
                        color: "#ef4444",
                      }}
                    >
                      <i className="fa-solid fa-circle-xmark" style={{ fontSize: "2rem" }}></i>
                    </div>
                    <h6 className="mb-2" style={{ fontWeight: 700, color: "#1e293b" }}>
                      Verification Failed
                    </h6>
                    <p className="text-muted px-2" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                      {validationError || "Your prescription doesn't contain this medicine."}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  className="btn w-100 mt-4 py-2.5"
                  onClick={() => {
                    setFile(null);
                    setFilePreview(null);
                    setSearchResults([]);
                    setValidationError("");
                    setHasSearched(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  style={{
                    borderRadius: "12px",
                    border: "1px solid #cbd5e1",
                    backgroundColor: "#ffffff",
                    color: "#475569",
                    fontWeight: 600,
                    fontSize: "0.9rem",
                  }}
                >
                  Upload Another Prescription
                </button>
              </div>
            ) : (
              <>
                {/* Prescription Requirements Note */}
                {!noPrescription && (
                  <div
                    className="p-3 mb-4"
                    style={{
                      borderRadius: "12px",
                      backgroundColor: "#faf5ff",
                      borderLeft: "4px solid #7c3aed",
                      fontSize: "0.85rem",
                      color: "#475569",
                      lineHeight: "1.6",
                    }}
                  >
                    <div className="d-flex align-items-center gap-2 mb-2" style={{ color: "#7c3aed", fontWeight: "600" }}>
                      <i className="fa-solid fa-circle-info" style={{ fontSize: "1rem" }}></i>
                      <span>Prescription Requirements:</span>
                    </div>
                    <ul className="mb-2 ps-3 d-flex flex-column gap-1" style={{ listStyleType: "decimal" }}>
                      <li>Must display <strong>Doctor's Name</strong>.</li>
                      <li>Must display <strong>Patient's Name</strong>.</li>
                      <li>Must display the <strong>Prescription Date</strong>.</li>
                      <li><strong>Do not crop</strong> any part of the prescription image.</li>
                      <li>Avoid uploading <strong>blurred images</strong>.</li>
                    </ul>
                    <div style={{ fontSize: "0.8rem", color: "#64748b", borderTop: "1px solid #f3e8ff", paddingTop: "8px", marginTop: "4px" }}>
                      <i className="fa-solid fa-prescription-bottle-medical me-1.5" style={{ color: "#a78bfa" }}></i>
                      Please ensure the uploaded image includes complete details of the doctor, patient, clinic visit, and medicines to be dispensed.
                    </div>
                  </div>
                )}

                <p className="mb-4" style={{ fontSize: "0.9rem", color: "#64748b", lineHeight: 1.5 }}>
                  {mode === "search" ? (
                    "Upload your doctor's prescription, and we will find all matching medicines and their prices for you."
                  ) : (
                    <>
                      This medication <strong>({medicineData?.name})</strong> requires a valid doctor's prescription.
                      Please upload a clear photo of your prescription to verify.
                    </>
                  )}
                </p>

                {/* Dropzone */}
                {!noPrescription && (
                  <div
                    className="d-flex flex-column align-items-center justify-content-center p-4"
                    style={{
                      border: file ? "2px solid #8b5cf6" : "2px dashed #cbd5e1",
                      borderRadius: "16px",
                      cursor: "pointer",
                      textAlign: "center",
                      position: "relative",
                      backgroundColor: file ? "#faf5ff" : "#f8fafc",
                      transition: "all 0.2s ease-in-out",
                      minHeight: "160px",
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      style={{ display: "none" }}
                      onChange={handleFileChange}
                    />

                    {file ? (
                      <div className="w-100 d-flex flex-column gap-3" onClick={(e) => e.stopPropagation()}>
                        {/* Full Image Preview */}
                        {filePreview && (
                          <div
                            className="d-flex align-items-center justify-content-center p-1.5"
                            style={{
                              backgroundColor: "#ffffff",
                              border: "1px solid #e2e8f0",
                              borderRadius: "12px",
                              maxHeight: "180px",
                              overflow: "hidden"
                            }}
                          >
                            <img
                              src={filePreview}
                              alt="Prescription preview"
                              style={{
                                maxHeight: "168px",
                                maxWidth: "100%",
                                objectFit: "contain",
                                borderRadius: "8px"
                              }}
                            />
                          </div>
                        )}

                        {/* File Info Bar */}
                        <div
                          className="p-3 d-flex align-items-center gap-3"
                          style={{
                            backgroundColor: "#ffffff",
                            border: "1px solid #e2e8f0",
                            borderRadius: "14px",
                            textAlign: "left",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                          }}
                        >
                          {/* File Icon Badge */}
                          <div
                            className="d-flex align-items-center justify-content-center text-primary flex-shrink-0"
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "10px",
                              backgroundColor: "#eff6ff",
                              color: "#3b82f6",
                              fontSize: "1.2rem",
                            }}
                          >
                            <i className="fa-regular fa-file-image"></i>
                          </div>

                          {/* Info */}
                          <div className="flex-grow-1 min-w-0" style={{ textAlign: "left" }}>
                            <span
                              className="text-dark text-truncate d-block"
                              style={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                lineHeight: 1.3,
                                color: "#1e293b",
                                marginBottom: "2px",
                                maxWidth: "220px",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap"
                              }}
                              title={file.name}
                            >
                              {file.name}
                            </span>
                            <span className="text-muted d-block" style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          {/* Delete button */}
                          <button
                            onClick={clearFile}
                            className="btn d-flex align-items-center justify-content-center flex-shrink-0"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              backgroundColor: "#fef2f2",
                              color: "#ef4444",
                              border: "none",
                              padding: 0,
                              transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#fee2e2";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#fef2f2";
                            }}
                            title="Remove file"
                          >
                            <i className="fa-solid fa-trash-can" style={{ fontSize: "0.85rem" }}></i>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div
                          className="mb-2.5 d-flex align-items-center justify-content-center"
                          style={{
                            width: "48px",
                            height: "48px",
                            borderRadius: "50%",
                            backgroundColor: "#f1f5f9",
                            color: "#64748b",
                          }}
                        >
                          <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "1.25rem" }}></i>
                        </div>
                        <span className="text-slate-700" style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                          Click to upload or drag image here
                        </span>
                        <span className="text-muted mt-1" style={{ fontSize: "0.75rem" }}>
                          Supports JPEG, PNG, WebP (Max 10MB)
                        </span>
                      </>
                    )}
                  </div>
                )}

                {/* Checkbox: I don't have a prescription */}
                {mode !== "search" && (
                  <div
                    className="d-flex align-items-center gap-2 mt-3 mb-2 px-1"
                    style={{
                      userSelect: "none",
                      backgroundColor: "#f8fafc",
                      padding: "10px 14px",
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0"
                    }}
                  >
                    <input
                      type="checkbox"
                      id="noPrescription"
                      checked={noPrescription}
                      onChange={(e) => {
                        setNoPrescription(e.target.checked);
                        if (e.target.checked) {
                          setFile(null);
                          setFilePreview(null);
                          setValidationError("");
                        }
                      }}
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "4px",
                        border: "1.5px solid #cbd5e1",
                        cursor: "pointer",
                        accentColor: "#7c3aed"
                      }}
                    />
                    <label
                      htmlFor="noPrescription"
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        color: "#334155",
                        cursor: "pointer",
                        marginBottom: 0
                      }}
                    >
                      I don't have a prescription
                    </label>
                  </div>
                )}

                {/* Info Note: Prescription Charge Policy */}
                {mode !== "search" && noPrescription && (
                  <div
                    className="mt-3 p-3"
                    style={{
                      backgroundColor: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "12px",
                      color: "#b45309",
                      fontSize: "0.85rem",
                      lineHeight: "1.4"
                    }}
                  >
                    <div className="d-flex gap-2">
                      <i className="fa-solid fa-circle-info mt-1" style={{ fontSize: "1.05rem" }}></i>
                      <div>
                        <strong className="d-block mb-1" style={{ fontSize: "0.9rem" }}>Prescription Options:</strong>
                        <ul className="ps-3 mb-0" style={{ listStyleType: "disc" }}>
                          <li className="mb-1.5">
                            <strong>Upload After Payment:</strong> You can proceed to checkout now and upload your prescription later from your order details page.
                          </li>
                          <li>
                            <strong>Get Doctor Prescription:</strong> Alternatively, Medicompares will arrange a doctor consultation and provide a valid prescription for all required medicines in this order for a fee of <strong>₹100</strong>.
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="d-flex gap-3 mt-4">
                  <button
                    type="button"
                    className="btn w-50 py-2.5"
                    onClick={onClose}
                    style={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      backgroundColor: "#ffffff",
                      color: "#475569",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="btn w-50 py-2.5 text-white"
                    disabled={isUploading || (!file && !noPrescription)}
                    onClick={handleVerify}
                    style={{
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                      border: "none",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      boxShadow: "0 4px 10px rgba(124, 58, 237, 0.25)",
                    }}
                  >
                    {isUploading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {mode === "search" ? "Searching..." : "Verifying..."}
                      </>
                    ) : noPrescription ? (
                      "Proceed"
                    ) : (
                      mode === "search" ? "Search Medicines" : "Verify & Add"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal Portals */}
      {showLeadModal && (
        <LeadModal
          show={showLeadModal}
          onClose={() => setShowLeadModal(false)}
          formData={leadFormData}
          onChange={(e) => setLeadFormData((p) => ({ ...p, [e.target.name]: e.target.value }))}
          productId={currentMed?._id}
          vendorId={currentVendor?.vendorId || currentVendor?._id}
          variantId={currentVariantId}
          onSubmit={handleSubmitLead}
          fixedType={leadFormData.fixedType}
        />
      )}
      {showRentModal && (
        <RentModal
          show={showRentModal}
          onClose={() => setShowRentModal(false)}
          rentProduct={rentProduct}
          formData={rentFormData}
          onFormChange={handleRentFormChange}
          onSubmit={handleRentSubmit}
          productId={currentMed?._id}
          vendorId={currentVendor?.vendorId || currentVendor?._id}
          variantId={currentVariantId}
          fixedType={getFixedType(currentMed)}
        />
      )}
      {showConsultationModal && (
        <ConsultationModal
          show={showConsultationModal}
          onClose={() => setShowConsultationModal(false)}
          formData={consultationFormData}
          onFormChange={handleConsultationFormChange}
          onSubmit={handleConsultationSubmit}
          productId={currentMed?._id}
          vendorId={currentVendor?.vendorId || currentVendor?._id}
          variantId={currentVariantId}
          fixedType={getFixedType(currentMed)}
        />
      )}
      {showAppointmentModal && (
        <AppointmentModal
          show={showAppointmentModal}
          onClose={() => setShowAppointmentModal(false)}
          formData={appointmentFormData}
          onFormChange={handleAppointmentFormChange}
          onSubmit={handleAppointmentSubmit}
          productId={currentMed?._id}
          vendorId={currentVendor?.vendorId || currentVendor?._id}
          variantId={currentVariantId}
          title="Book an Appointment"
          fixedType={getFixedType(currentMed)}
        />
      )}
      {familyMemberModel && (
        <FamilyMemberSelectionModal
          show={familyMemberModel}
          onClose={() => setFamilyMemberModel(false)}
          userProfile={userProfile}
          selectedPatients={selectedPatients}
          setSelectedPatients={setSelectedPatients}
          onProceed={async (patients, familyMembers) => {
            if (patients.length === 0) {
              toast.error("Please select at least one patient");
              return;
            }
            setFamilyMemberModel(false);
            onClose();
            try {
              await handleLabTestBookingProcess({
                tests: selectedTests,
                vendorId: bookingTarget.vendor._id || bookingTarget.vendor.vendorId,
                selectedPatients: patients,
                bookingType: bookingTarget.bookingType || "buy_now",
                navigate,
                servicefixedTypes: bookingTarget.service
              });
            } catch (error) {
              console.error("Booking error:", error);
            }
          }}
        />
      )}
    </div>
  );
};

export default PrescriptionUploadModal;

