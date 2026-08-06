import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { axiosCommonInstance, axiosUserInstance, imgUrl } from "../../Apiservice";

import { useNavigate } from "react-router-dom";
import { getImageUrl } from "../../utils";
import VendorActions from "../ui/VendorActions.jsx";
import { useProfile } from "../../context/ProfileContext";
import BaseModal from "../ui/BaseModal.jsx";
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
        toast.error("Please login to continue");
        navigate("/login");
        return;
      }
      // User has no prescription — pass "payment_required" so the cart shows a prescription fee
      onValidated("payment_required");
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

        const response = await axiosCommonInstance.post(`${imgUrl}/api/testing/analyze`, formData);
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
              vendors: mappedVendors
            };
          }
          return {
            _id: Math.random().toString(),
            name: med.name,
            strength: med.strength || med.genericName,
            vendors: []
          };
        });
        setSearchResults(mappedResults);
        setValidationError("");
        setHasSearched(true);
        toast.success("Prescription parsed successfully!");
      } else {
        formData.append("name", medicineData?.name || "");
        formData.append("composition", medicineData?.compositions?.name || "");

        const response = await axiosCommonInstance.post(`${imgUrl}/api/testing/analyze`, formData);
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
    <BaseModal
      show={show}
      onClose={onClose}
      title={
        <div className="!flex !items-center !gap-3">
          <div className="!flex !items-center !justify-center !w-9 !h-9 !rounded-[10px] !bg-purple-50 !text-[#7c3aed]">
            <i className="fa-solid fa-file-medical !text-[16px]"></i>
          </div>
          <div>
            <h5 className="!mb-0 !font-semibold !text-slate-800 !text-[16px]">
              {mode === "search" ? "Search by Prescription" : "Upload Prescription"}
            </h5>
          </div>
        </div>
      }
      size="lg"
      className="!max-w-[620px]"
      bodyClassName="!p-0"
      closeButton={true}
    >
      <div className="!p-6 !bg-white">
        {hasSearched ? (
          <div>
            {mode === "search" ? (
              <>
                <h6 className="!mb-3 !font-semibold !text-slate-800 !text-[13px] !uppercase !tracking-wider">
                  Matching Medicines Found ({searchResults.length})
                </h6>

                {searchResults.length === 0 ? (
                  <div className="!text-center !py-8 !text-slate-400 !text-[13px]">
                    <i className="fa-solid fa-face-frown !block !mb-2 !text-[24px]"></i>
                    {validationError || "No matching medicines found in our database."}
                  </div>
                ) : (
                  <div className="!max-h-[360px] !overflow-y-auto !flex !flex-col !gap-3 !pr-1">
                    {searchResults.map((item) => (
                      <div
                        key={item._id}
                        className="!p-3.5 !border !border-slate-200 !rounded-[16px] !bg-slate-50/50 !flex !flex-col !gap-2.5"
                      >
                        {/* Medicine Info */}
                        <div className="!flex !items-center !gap-3 !min-w-0">
                          <img
                            src={getImageUrl(item.imageUrl?.[0] || item.files?.[0])}
                            alt={item.name}
                            className="!w-11 !h-11 !rounded-[8px] !object-contain !bg-white !border !border-slate-100 !p-0.5"
                            onError={(e) => { e.target.src = "/assets/default.png"; }}
                          />
                          <div className="!min-w-0 !flex-1">
                            <span className="!block !text-slate-900 !truncate !text-[13px] !font-bold !leading-tight !mb-0.5">
                              {item.name}
                            </span>
                            <span className="!text-slate-400 !truncate !block !text-[11px]">
                              {item.strength || item.form || "Medicine"}
                            </span>
                          </div>
                        </div>

                        {/* Vendors Array */}
                        {item.vendors && item.vendors.length > 0 ? (
                          <div className="!flex !flex-col !gap-2.5 !border-t !border-dashed !border-slate-200 !pt-3">
                            {item.vendors.map((v) => {
                              const originalPrice = parseFloat(v.price) || 0;
                              const discountVal = parseFloat(v.discountprice) || 0;
                              let price = originalPrice;
                              let hasDiscount = false;

                              if (discountVal > 0) {
                                const type = v.discountType?.trim().toLowerCase();
                                if (type === "percentage") {
                                  price = Number((originalPrice - (originalPrice * discountVal) / 100).toFixed(2));
                                  hasDiscount = true;
                                } else if (type === "price") {
                                  price = Number((originalPrice - discountVal).toFixed(2));
                                  hasDiscount = true;
                                } else if (discountVal < originalPrice) {
                                  price = discountVal;
                                  hasDiscount = true;
                                }
                              }
                              const serviceType = item.category?.fixedType || "medicine";
                              const bookingType = item.category?.categoryType || (serviceType === "medicine" ? "cart" : "leads");
                              return (
                                <div
                                  key={v._id}
                                  className="!flex !flex-col !p-3 !gap-2 !bg-white !rounded-xl !border !border-slate-200/80 !shadow-sm"
                                >
                                  {/* Top: Vendor Info & Price */}
                                  <div className="!flex !justify-between !items-start !gap-2">
                                    <div className="!min-w-0">
                                      <span className="!block !text-slate-900 !truncate !text-[13px] !font-bold">
                                        {v.vendor?.name || v.businessDetails?.name || "Vendor"}
                                      </span>
                                      {(v.vendor?.distance !== undefined || v.businessDetails?.distance !== undefined) && (
                                        <span className="!text-slate-400 !text-[10px]">
                                          <i className="fa-solid fa-location-dot !mr-1"></i>
                                          {v.vendor?.distance || v.businessDetails.distance} km away
                                        </span>
                                      )}
                                    </div>

                                    <div className="!text-end !shrink-0 !min-w-[60px]">
                                      {hasDiscount && (
                                        <span className="!text-slate-400 !line-through !block !text-[10px] !leading-none">
                                          ₹{originalPrice}
                                        </span>
                                      )}
                                      <span className="!text-purple-600 !block !text-[14px] !font-bold">
                                        ₹{price}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Bottom: Action Buttons */}
                                  <div className="!mt-1 !w-full">
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
                                      calculatedDiscountPrice={hasDiscount ? price : null}
                                      handleRentalBookinProcess={handleRentalBookingProcess}
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
                          <div className="!text-center !py-2 !text-slate-400 !text-[11px] !border-t !border-dashed !border-slate-200 !pt-2">
                            No local vendors available near your location.
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="!text-center !py-6">
                <div className="!inline-flex !items-center !justify-center !mb-3 !w-14 !h-14 !rounded-full !bg-red-50 !text-red-500">
                  <i className="fa-solid fa-circle-xmark !text-[28px]"></i>
                </div>
                <h6 className="!mb-2 !font-bold !text-slate-800 !text-[16px]">
                  Verification Failed
                </h6>
                <p className="!text-slate-400 !px-2 !text-[13px] !leading-normal">
                  {validationError || "Your prescription doesn't contain this medicine."}
                </p>
              </div>
            )}

            <button
              type="button"
              className="!w-full !mt-4 !py-2.5 !rounded-xl !border !border-slate-300 !bg-white !text-slate-600 !font-semibold !text-[13px] hover:!bg-slate-50 hover:!border-slate-400 !transition-all"
              onClick={() => {
                setFile(null);
                setFilePreview(null);
                setSearchResults([]);
                setValidationError("");
                setHasSearched(false);
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              Upload Another Prescription
            </button>
          </div>
        ) : (
          <>
            {/* Prescription Requirements Note */}
            {!noPrescription && (
              <div className="!p-4 !mb-4 !rounded-xl !bg-purple-50/50 !border !border-purple-100 !text-[13px] !text-slate-600 !leading-relaxed">
                <div className="!flex !items-center !gap-2 !mb-2 !text-purple-600 !font-semibold">
                  <i className="fa-solid fa-circle-info !text-[15px]"></i>
                  <span>Prescription Requirements:</span>
                </div>
                <ul className="!mb-2 !pl-4 !flex !flex-col !gap-1 !list-decimal">
                  <li>Must display <span className="!font-semibold !text-profile-primary">Doctor's Name</span>.</li>
                  <li>Must display <span className="!font-semibold !text-profile-primary">Patient's Name</span>.</li>
                  <li>Must display the <span className="!font-semibold !text-profile-primary">Prescription Date</span>.</li>
                  <li><span className="!font-semibold !text-profile-primary">Do not crop</span> any part of the prescription image.</li>
                  <li>Avoid uploading <span className="!font-semibold !text-profile-primary">blurred images</span>.</li>
                </ul>
                <div className="!text-[11px] !text-slate-400 !border-t !border-purple-100 !pt-2 !mt-2">
                  <i className="fa-solid fa-prescription-bottle-medical !mr-1.5 !text-purple-400"></i>
                  Please ensure the uploaded image includes complete details of the doctor, patient, clinic visit, and medicines to be dispensed.
                </div>
              </div>
            )}

            <p className="!mb-4 !text-[13px] !text-slate-500 !leading-relaxed">
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
                className={`!flex !flex-col !items-center !justify-center !p-6 !rounded-[16px] !cursor-pointer !text-center !relative !transition-all !duration-200 !min-h-[160px] ${file ? "!border-2 !border-purple-600 !bg-purple-50/30" : "!border-2 !border-dashed !border-slate-300 !bg-slate-50 hover:!border-purple-400 hover:!bg-slate-50/50"
                  }`}
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
                  <div className="!w-full !flex !flex-col !gap-3" onClick={(e) => e.stopPropagation()}>
                    {/* Full Image Preview */}
                    {filePreview && (
                      <div className="!flex !items-center !justify-center !p-1.5 !bg-white !border !border-slate-200 !rounded-xl !max-h-[180px] !overflow-hidden">
                        <img
                          src={filePreview}
                          alt="Prescription preview"
                          className="!max-h-[168px] !max-w-full !object-contain !rounded-lg"
                        />
                      </div>
                    )}

                    {/* File Info Bar */}
                    <div className="!p-3 !flex !items-center !gap-3 !bg-white !border !border-slate-200 !rounded-[14px] !text-left !shadow-sm">
                      {/* File Icon Badge */}
                      <div className="!flex !items-center !justify-center !w-10 !h-10 !rounded-[10px] !bg-blue-50 !text-blue-500 !text-[18px] !shrink-0">
                        <i className="fa-regular fa-file-image"></i>
                      </div>

                      {/* Info */}
                      <div className="!flex-1 !min-w-0 !text-left">
                        <span
                          className="!text-slate-800 !truncate !block !text-[13px] !font-semibold !leading-tight !mb-0.5 !max-w-[220px]"
                          title={file.name}
                        >
                          {file.name}
                        </span>
                        <span className="!text-slate-400 !block !text-[11px]">
                          {(file.size / 1024).toFixed(1)} KB
                        </span>
                      </div>

                      {/* Delete button */}
                      <button
                        onClick={clearFile}
                        className="!flex !items-center !justify-center !w-8 !h-8 !rounded-lg !bg-red-50 !text-red-500 hover:!bg-red-100 hover:!text-red-600 !transition-all !duration-200 !border-0 !p-0 !shrink-0"
                        title="Remove file"
                      >
                        <i className="fa-solid fa-trash-can !text-[12px]"></i>
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="!mb-2.5 !flex !items-center !justify-center !w-12 !h-12 !rounded-full !bg-slate-100 !text-slate-400">
                      <i className="fa-solid fa-cloud-arrow-up !text-[20px]"></i>
                    </div>
                    <span className="!text-slate-700 !text-[13px] !font-bold">
                      Click to upload or drag image here
                    </span>
                    <span className="!text-slate-400 !text-[11px] !mt-1">
                      Supports JPEG, PNG, WebP (Max 10MB)
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Checkbox: I don't have a prescription */}
            {mode !== "search" && (
              <div className="!flex !items-center !gap-2 !mt-3 !mb-2 !px-3.5 !py-2.5 !rounded-sm !bg-slate-50 !border !border-slate-200 !select-none">
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
                  className="!w-4 !h-4 !rounded !border-slate-300 !cursor-pointer !accent-purple-600"
                />
                <label
                  htmlFor="noPrescription"
                  className="!text-[13px] !font-medium !text-slate-600 !cursor-pointer !mb-0"
                >
                  I don't have a prescription
                </label>
              </div>
            )}

            {/* Info Note: Prescription Charge Policy */}
            {mode !== "search" && noPrescription && (
              <div className="!mt-3 !p-3 !bg-amber-50 !border !border-amber-200 !rounded-xl !text-amber-800 !text-[12px] !leading-relaxed">
                <div className="!flex !gap-2">
                  <i className="fa-solid fa-circle-info !mt-0.5 !text-[15px]"></i>
                  <div>
                    <strong className="!block !mb-1 !font-bold !text-[13px]">Prescription Options:</strong>
                    <ul className="!pl-4 !mb-0 !list-disc !flex !flex-col !gap-1">
                      <li className="!mb-1">
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
            <div className="!flex !gap-3 !mt-4">
              <button
                type="button"
                className="!w-1/2 !py-2.5 !rounded-xl !border !border-slate-200 !bg-white !text-slate-600 !font-semibold !text-[14px] hover:!bg-slate-50 hover:!border-slate-300 !transition-all"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading || (!file && !noPrescription)}
                onClick={handleVerify}
                className={`!w-1/2 !py-2.5 !rounded-xl !font-semibold !text-[14px] !text-white !transition-all !shadow-md hover:!shadow-lg !border-0 ${isUploading || (!file && !noPrescription)
                  ? "!bg-slate-200 !text-slate-400 !cursor-not-allowed !shadow-none hover:!shadow-none"
                  : "!bg-profile-primary hover:!bg-profile-secondary hover:!opacity-95"
                  }`}
              >
                {isUploading ? (
                  <>
                    <div className="!animate-spin !rounded-full !h-4 !w-4 !border-2 !border-white !border-t-transparent !inline-block !mr-2"></div>
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
    </BaseModal>
  );
};

export default PrescriptionUploadModal;

