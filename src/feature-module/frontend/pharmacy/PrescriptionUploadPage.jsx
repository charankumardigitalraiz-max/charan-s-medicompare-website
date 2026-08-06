import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { axiosCommonInstance, axiosUserInstance, axiosInstance, imgUrl, baseurl } from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils";
import VendorActions from "../../../components/ui/VendorActions.jsx";
import { useProfile } from "../../../context/ProfileContext";
import Home2Header from "../../../components/home/Header-k";
import Home2Footer from "../../../components/home/Footer-f";
import LeadModal from "./products-components/LeadModal.jsx";
import RentModal from "./products-components/RentModal.jsx";
import ConsultationModal from "./products-components/ConsultationModal.jsx";
import AppointmentModal from "./products-components/AppointmentModal.jsx";
import FamilyMemberSelectionModal from "./products-components/FamilyMemberSelectionModal.jsx";
import VendorsSection from "../../../components/products/VendorsSection.jsx";
import BackButton from "../../../components/ui/BackButton.jsx";
import {
  handleRentalBookingProcess,
  handleLabTestBookingProcess,
  handleGeneralBookingProcess
} from "../../../services/bookingService";

const PrescriptionUploadPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get state parameters passed from home page or use fallback defaults
  const pageState = location.state || {};
  const pincode = pageState.pincode || "";
  const lat = pageState.lat || null;
  const lng = pageState.lng || null;
  const mode = pageState.mode || "search";
  const medicineData = pageState.medicineData || null;

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [noPrescription, setNoPrescription] = useState(false);
  const [expandedVendors, setExpandedVendors] = useState({});

  const fileInputRef = useRef(null);

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

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
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
                navigate(-1);
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

        const response = await axiosInstance.post(`/prescription/analyze`, formData);
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

        const extractedMedicines = data.data?.analysis?.medicines || [];
        const mappedResults = extractedMedicines.map(med => {
          if (med.dbTablet) {
            const mappedVendors = (med.dbTablet.vendors || []).map(v => ({
              ...v,
              businessDetails: {
                name: v.vendor?.name || v.businessDetails?.name || "Vendor",
                address: v.vendor?.address || v.businessDetails?.address || "",
                distance: v.businessDetails?.distance
              }
            }));
            return {
              ...med.dbTablet,
              name: med.dbTablet.name || med.name,
              strength: med.dbTablet.strength || med.strength,
              vendors: mappedVendors,
              isDbProduct: true,
              hasVendors: mappedVendors.length > 0
            };
          }
          return {
            _id: Math.random().toString(),
            name: med.name,
            strength: med.strength || med.genericName,
            vendors: [],
            isDbProduct: false,
            hasVendors: false
          };
        });

        // Sort: 1) has vendors  2) in DB but no vendors  3) not in DB
        const sortedResults = [
          ...mappedResults.filter(r => r.isDbProduct && r.hasVendors),
          ...mappedResults.filter(r => r.isDbProduct && !r.hasVendors),
          ...mappedResults.filter(r => !r.isDbProduct),
        ];
        setSearchResults(sortedResults);
        setValidationError("");
        setHasSearched(true);
        toast.success("Prescription parsed successfully!");
      } else {
        formData.append("name", medicineData?.name || "");
        formData.append("composition", medicineData?.compositions?.name || "");

        const response = await axiosInstance.post(`/prescription/analyze`, formData);
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
          navigate(-1);
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
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans">
      <Home2Header />

      {/* Hero/Header Banner with background image */}
      <div
        className="w-full bg-cover bg-center py-6 border-b border-slate-200 relative overflow-hidden"
        style={{ backgroundImage: `url('/assets/Medicompares Background.png')` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/85 to-purple-50/75"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="relative flex items-center justify-center min-h-[44px]">
            <div className="absolute left-0">
              <BackButton />
            </div>
            <div className="text-center">
              <h1 className="!text-lg !font-bold text-slate-800 tracking-tight leading-tight mb-0">
                {mode === "search" ? "Search Medicines by Prescription" : "Upload Doctor's Prescription"}
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1 mb-0">
                Verify your prescription instantly using our secure AI analysis tool.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* Top Panel: Upload Zone and Checklist */}
          <div className="lg:col-span-12 flex flex-col md:flex-row gap-6">


            {/* Checklist guidelines */}
            <div className="bg-white border border-purple-100 rounded-md p-5 text-sm text-slate-600 leading-relaxed shadow-sm md:max-w-md w-full shrink-0">
              <div className="flex items-center gap-2 mb-3 text-purple-700 font-semibold">
                <i className="fa-solid fa-circle-info text-base"></i>
                <span>Prescription Upload Guidelines</span>
              </div>
              <ul className="pl-4 flex flex-col gap-2 list-decimal mb-0">
                <li>Doctor's signature, stamp, and clinic letterhead must be visible.</li>
                <li>Patient's full name, age, and consultation date must be clearly printed.</li>
                <li>The list of medicines, dosage, and strength should be legible.</li>
                <li>Do not crop, edit, or adjust the photo. Upload a raw, clear photograph.</li>
              </ul>
            </div>

            <div className="bg-white rounded-md border border-slate-200 p-6 shadow-sm flex-1">
              <h2 className="!text-base !font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <i className="fa-solid fa-file-medical text-purple-600"></i>
                Upload Document
              </h2>

              {/* Dropzone */}
              {!noPrescription && (
                <div
                  className={`flex flex-col items-center justify-center p-5 rounded-2xl cursor-pointer text-center relative border-2 transition-all duration-200 min-h-[140px] ${file
                    ? "border-purple-600 bg-purple-50/10 p-2"
                    : "border-dashed border-slate-300 bg-slate-50/50 hover:border-purple-400 hover:bg-slate-50"
                    }`}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => !file && fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {file ? (
                    <div className="relative group w-full flex items-center justify-center rounded-xl overflow-hidden shadow-sm max-h-[160px]" onClick={(e) => e.stopPropagation()}>
                      {filePreview && (
                        <img
                          src={filePreview}
                          alt="Prescription preview"
                          className="max-h-[150px] max-w-full object-contain rounded-lg transition-all duration-200"
                        />
                      )}

                      {/* Hover Overlay with Delete Icon */}
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex items-center justify-center rounded-xl">
                        <button
                          type="button"
                          onClick={clearFile}
                          className="flex items-center justify-center w-9 h-9 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-105 transition-all border-0 p-0 shadow-md"
                          title="Remove file"
                        >
                          <i className="fa-solid fa-trash-can text-sm"></i>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-center w-10 h-10 rounded-full bg-purple-50 text-purple-600 shadow-inner">
                        <i className="fa-solid fa-cloud-arrow-up text-lg animate-pulse"></i>
                      </div>
                      <span className="text-slate-700 text-xs font-bold block">
                        Drag & drop or <span className="text-purple-600 hover:underline">browse</span> your prescription
                      </span>
                      <span className="text-slate-400 text-[10px] mt-1 block">
                        Supports JPEG, PNG, WebP (Max 10MB)
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Checkbox: I don't have a prescription */}
              {mode !== "search" && (
                <div className="flex items-center gap-2 mt-4 px-3.5 py-3 rounded-lg bg-slate-50 border border-slate-200 select-none">
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
                    className="w-4 h-4 rounded border-slate-300 cursor-pointer accent-purple-600"
                  />
                  <label
                    htmlFor="noPrescription"
                    className="text-xs font-semibold text-slate-600 cursor-pointer mb-0"
                  >
                    I don't have a prescription
                  </label>
                </div>
              )}

              {/* Policy Notes */}
              {mode !== "search" && noPrescription && (
                <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200 rounded-xl text-amber-900 text-xs leading-relaxed shadow-sm">
                  <div className="flex gap-2">
                    <i className="fa-solid fa-circle-info mt-0.5 text-base text-amber-600"></i>
                    <div>
                      <strong className="block mb-1.5 font-bold text-sm">Prescription Options:</strong>
                      <ul className="pl-4 list-disc flex flex-col gap-1.5">
                        <li>
                          <strong>Upload After Payment:</strong> Proceed to checkout and upload the prescription later from your order details page.
                        </li>
                        <li>
                          <strong>Get Doctor Prescription:</strong> Alternatively, Medicompares will arrange a doctor consultation and provide a valid prescription in this order for a fee of <strong>₹100</strong>.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* CTA Action Buttons */}
              <div className="flex gap-4 mt-6">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="w-1/2 py-2.5 !rounded-md border border-purple-200/60 bg-purple-50 text-purple-700 font-semibold text-sm hover:bg-purple-100/80 hover:text-purple-900 transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isUploading || (!file && !noPrescription)}
                  onClick={handleVerify}
                  className={`w-1/2 py-2.5 !rounded-md !font-semibold text-sm text-white transition-all shadow-md hover:shadow-lg border-0 flex items-center justify-center gap-2 ${isUploading || (!file && !noPrescription)
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none hover:shadow-none"
                    : "bg-primary hover:bg-secondary"
                    }`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                      {mode === "search" ? "Searching..." : "Verifying..."}
                    </>
                  ) : noPrescription ? (
                    "Proceed"
                  ) : (
                    mode === "search" ? "Search Medicines" : "Verify & Add"
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Panel: Results Listing */}
          <div className={`${hasSearched && searchResults.some(r => !r.isDbProduct) ? "lg:col-span-9" : "lg:col-span-12"} bg-white rounded-2xl border border-slate-200 p-6 min-h-[400px] flex flex-col shadow-sm`}>
            <h2 className="!text-base !font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
              <i className="fa-solid fa-list-check text-purple-600"></i>
              {hasSearched ? `Matching Medicines (${searchResults.length})` : "Analysis Results"}
            </h2>

            {isUploading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-purple-600 animate-spin mb-4"></div>
                <h3 className="text-slate-800 font-bold text-base mb-1">
                  Analyzing Prescription...
                </h3>
                <p className="text-slate-400 text-xs max-w-xs leading-relaxed">
                  Our AI is extracting medicines and matching them with local pharmacies. This may take a few seconds.
                </p>
              </div>
            ) : !hasSearched ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 text-slate-300">
                  <i className="fa-solid fa-magnifying-glass text-3xl"></i>
                </div>
                <h3 className="text-slate-700 font-semibold text-base mb-1">
                  Ready to Analyze
                </h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                  Upload a clear copy of your prescription and click "Search Medicines" to view matches, prices, and checkout options.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400">
                <div className="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center mb-4">
                  <i className="fa-solid fa-face-frown text-3xl"></i>
                </div>
                <h3 className="text-slate-700 font-semibold text-base mb-1">
                  No Matching Medicines Found
                </h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
                  {validationError || "We couldn't read or match any medicines in this prescription. Please make sure the image is clear and try again."}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setFilePreview(null);
                    setSearchResults([]);
                    setValidationError("");
                    setHasSearched(false);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-6 px-4 py-2 bg-purple-50 text-purple-700 font-semibold text-xs rounded-xl shadow-sm hover:bg-purple-100 transition-all border-0"
                >
                  Upload Another Prescription
                </button>
              </div>
            ) : (
              <>
                <div className={`grid grid-cols-1 md:grid-cols-2 ${hasSearched && searchResults.some(r => !r.isDbProduct) ? "lg:grid-cols-3" : "lg:grid-cols-4"} gap-6 overflow-y-auto max-h-[700px] pr-1 pb-4`}>
                  {searchResults.filter(r => r.isDbProduct !== false).map((item) => (
                    <div
                      key={item._id}
                      className="flex flex-col bg-white rounded-lg border border-slate-200/80 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-300 w-full overflow-hidden"
                    >
                      {/* Image Container */}
                      <div className="relative w-full h-[135px] bg-slate-50 flex items-center justify-center p-2">
                        <img
                          src={getImageUrl(item.imageUrl?.[0] || item.files?.[0])}
                          alt={item.name}
                          className="object-contain max-h-[120px] max-w-full p-1"
                          onError={(e) => { e.target.src = "/assets/default.png"; }}
                        />
                      </div>

                      {/* Product Details Section */}
                      <div className="flex-1 p-3 flex flex-col gap-2">
                        <div className="text-[13px] font-semibold leading-[18px] text-slate-800 text-capitalize line-clamp-2 overflow-hidden text-ellipsis max-h-[36px] w-full" title={item.name}>
                          {item.name}
                        </div>

                        {/* Manufacturer Badge */}
                        {(item.manufacture?.name || item.brand?.name) && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[10px] text-[#321961] bg-purple-50/50 border border-purple-100 px-2 py-0.5 rounded-md font-medium tracking-wide truncate max-w-full inline-block">
                              By {item.manufacture?.name || item.brand?.name}
                            </span>
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="flex flex-col gap-1 text-xs text-slate-500 mt-1">
                          {[
                            { label: "Form", value: item.form },
                            { label: "Storage", value: item.strength },
                            { label: "Composition", value: item.composition?.name || item.genericName },
                            { label: "Packing", value: item.packagingDetails || item.package }
                          ].filter(f => f.value && String(f.value).trim() !== "").map((field, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-50/50 px-2 py-1 rounded-lg">
                              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider" style={{ whiteSpace: "nowrap" }}>
                                {field.label}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[140px]" title={field.value} style={{ textAlign: "right", textTransform: "capitalize" }}>
                                {field.value}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* MRP Display */}
                        {item.price && (
                          <div className="flex items-center gap-1.5 mt-auto pt-2 border-t border-slate-100">
                            <span className="text-slate-500 text-xs">MRP</span>
                            <span className="text-[#321961] font-bold text-[13px]">
                              ₹{Number(item.price).toFixed(2)}
                            </span>
                          </div>
                        )}

                        {item.isDbProduct === false ? (
                          <div className="text-center py-3 border-t border-dashed border-slate-200 mt-3">
                            <span className="text-red-400 text-xs font-medium">
                              <i className="fa-solid fa-circle-xmark mr-1.5"></i>This product is not available
                            </span>
                          </div>
                        ) : (item.isDbProduct === true && !item.hasVendors) ? (
                          <div className="text-center py-3 border-t border-dashed border-slate-200 mt-3">
                            <span className="text-slate-400 text-xs">
                              <i className="fa-solid fa-store-slash mr-1.5 text-amber-400"></i>No vendors available
                            </span>
                          </div>
                        ) : (
                          <div onClick={(e) => e.stopPropagation()}>
                            <VendorsSection
                              vendors={(item.vendors || []).map(v => ({
                                ...v,
                                bussinessdetails: {
                                  name: v.vendor?.name || v.bussinessdetails?.name || v.businessDetails?.name || v.name || "Vendor",
                                  bussiness_image: {
                                    url: v.vendor?.image || v.bussinessdetails?.bussiness_image?.url || v.image || ""
                                  }
                                },
                                distanceInKm: v.distanceInKm || v.vendor?.distance || v.businessDetails?.distance || v.distance
                              }))}
                              tablet={item}
                              prescription={true}
                              selectedVariants={{}}
                              selectedVendors={{}}
                              expandedVendors={expandedVendors}
                              onToggleExpand={() => setExpandedVendors(prev => ({ ...prev, [item._id]: !prev[item._id] }))}
                              getVendorPrice={(vendor) => vendor?.price || 0}
                              getQuantityForVariant={() => 0}
                              onVendorAction={() => { }}
                              service={item.category?.fixedType || "medicine"}
                              id={item.category?._id || "healthcare"}
                              navigate={navigate}
                              allVendorsCount={item.vendors?.length || 0}
                              rentAndCartButtonStyles={{
                                fontSize: "11px",
                                padding: "6px 12px",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)",
                                border: "none",
                                width: "100%"
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8 pt-6 border-t border-slate-100">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center gap-2 py-3 px-6 !rounded-xl font-semibold text-sm text-white bg-primary hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 active:shadow-md"
                    onClick={() => {
                      setFile(null);
                      setFilePreview(null);
                      setSearchResults([]);
                      setValidationError("");
                      setHasSearched(false);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    <i className="fa-solid fa-arrow-up-from-bracket text-sm" />
                    Upload Another Prescription
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Right Panel: Unavailable Products */}
          {hasSearched && searchResults.some(r => !r.isDbProduct) && (
            <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-4">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <i className="fa-solid fa-circle-xmark text-red-500 text-[11px]"></i>
                </div>
                <h4 className="text-sm font-bold text-red-600 mb-0">Unavailable Products</h4>
              </div>
              <div className="flex flex-col gap-2.5 max-h-[600px] overflow-y-auto pr-1">
                {searchResults.filter(r => !r.isDbProduct).map((item) => (
                  <div key={item._id} className="flex items-center gap-3 bg-slate-50 rounded-xl px-3.5 py-3 border border-slate-100 shadow-inner">
                    <div className="w-7 h-7 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0">
                      <i className="fa-solid fa-pills text-red-400 text-xs"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-slate-700 text-xs font-semibold truncate block leading-tight" title={item.name}>{item.name}</span>
                      {item.strength && (
                        <span className="text-slate-400 text-[10px] mt-0.5 block truncate" title={item.strength}>{item.strength}</span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 bg-red-50 border border-red-100 text-red-500 text-[9px] font-semibold px-2 py-0.5 rounded-full shrink-0">
                      <i className="fa-solid fa-ban text-[8px]"></i>
                      No Match
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>

      <Home2Footer />

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

export default PrescriptionUploadPage;
