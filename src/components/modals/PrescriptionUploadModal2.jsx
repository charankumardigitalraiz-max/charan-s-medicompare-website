import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { imgUrl, axiosInstance, axiosCommonInstance } from "../../Apiservice.jsx";
import BaseModal from "../ui/BaseModal.jsx";

const PrescriptionUploadModal2 = ({
  show,
  onClose,
  onValidated,
  medicineData,
  mode = "analyze",
}) => {
  const [files, setFiles] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const [noPrescription, setNoPrescription] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [showTeleconsultScreen, setShowTeleconsultScreen] = useState(false);
  const [prescriptionCharge, setPrescriptionCharge] = useState(100);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!show) {
      setFiles([]);
      setFilePreviews([]);
      setNoPrescription(false);
      setIsUploading(false);
      setAnalysisResults(null);
      setShowTeleconsultScreen(false);
      setShowSuccessScreen(false);
    }
  }, [show]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axiosCommonInstance.get("settings");
        if (response.data?.success && response.data?.data?.prescription_charge) {
          const pc = typeof response.data.data.prescription_charge === "string"
            ? JSON.parse(response.data.data.prescription_charge)
            : response.data.data.prescription_charge;
          if (pc && pc.chargeAmount !== undefined) {
            setPrescriptionCharge(pc.chargeAmount);
          }
        }
      } catch (e) {
        console.error("Failed to load settings:", e);
      }
    };
    if (show) {
      fetchSettings();
    }
  }, [show]);

  const addFiles = (selectedFiles) => {
    const validFiles = [];

    for (const f of selectedFiles) {
      if (f.size > 10 * 1024 * 1024) {
        toast.error(`File "${f.name}" is too large. Maximum size allowed is 10 MB.`);
        continue;
      }
      validFiles.push(f);

      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreviews((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(f);
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      addFiles(Array.from(e.target.files));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const clearFile = (index, e) => {
    e.stopPropagation();
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
    setFilePreviews((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async () => {
    if (noPrescription) {
      setShowSuccessScreen(true);
      return;
    }

    if (files.length === 0) {
      toast.error("Please upload at least one prescription image.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => {
        formData.append("prescription", f);
      });

      // Prepare target medicines for verification
      const medicinePayload = Array.isArray(medicineData)
        ? medicineData.map((m) => ({
          name: m.name,
          composition: m.compositions?.name || m.composition?.name || "",
        }))
        : [
          {
            name: medicineData?.name,
            composition: medicineData?.compositions?.name || medicineData?.composition?.name || "",
          },
        ];

      formData.append("medicines", JSON.stringify(medicinePayload));

      const response = await axiosInstance.post(`/cart/prescription/analyze`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        setAnalysisResults(response.data.data);
        if (response.data.data?.isValidPrescription) {
          toast.success("Prescription analyzed successfully!");
        } else {
          toast.error("Invalid prescription. Please check requirements.");
        }
      } else {
        toast.error(response.data?.message || "Prescription upload/verification failed.");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "An error occurred during verification.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!show) return null;

  if (showSuccessScreen) {
    return (
      <BaseModal
        show={show}
        onClose={onClose}
        title={
          <div className="!flex !items-center !gap-3">
            <div className="!flex !items-center !justify-center !w-9 !h-9 !rounded-[10px] !bg-emerald-50 !text-[#10b981]">
              <i className="fa-solid fa-circle-check !text-[16px]"></i>
            </div>
            <div>
              <h5 className="!mb-0 !font-semibold !text-slate-800 !text-[16px]">
                Request Submitted
              </h5>
            </div>
          </div>
        }
        size="md"
        className="!max-w-[450px]"
        bodyClassName="!p-0"
        closeButton={true}
      >
        <div className="!p-6 !bg-white !text-center">
          <div className="!flex !items-center !justify-center !mb-4 !w-16 !h-16 !rounded-full !bg-emerald-50 !text-[#10b981] mx-auto animate-bounce">
            <i className="fa-solid fa-user-doctor text-[32px]"></i>
          </div>
          <h4 className="!text-[#321961] !font-extrabold !text-[18px] !mb-2">
            Teleconsultation Requested!
          </h4>
          <p className="!text-slate-600 !text-[13px] !leading-relaxed !mb-6">
            A registered medical practitioner from Medicompares will contact you shortly on your registered mobile number to verify your details and generate a valid prescription.
          </p>
          <div className="!p-3.5 !mb-6 !rounded-xl !bg-purple-50/50 !border !border-purple-100 !text-[12px] !text-purple-800 !font-semibold">
            <i className="fa-solid fa-clock !mr-1.5"></i>
            Typically takes 15 - 30 minutes.
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              if (onValidated) {
                onValidated("payment_required", []);
              }
            }}
            className="!w-full !py-2.5 !rounded-md !bg-[#321961] !text-white !font-bold !text-[14px] hover:!opacity-90 !transition-all !border-0"
          >
            Got it, Close
          </button>
        </div>
      </BaseModal>
    );
  }

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
      size="2xl"
      className="!max-w-[950px]"
      bodyClassName="!p-0"
      closeButton={true}
    >
      <div className="!p-6 !bg-white">
        <div className="flex flex-col md:flex-row gap-5">
          {/* Left Column: Requirements Note or Options Policy / Verification Warning */}
          <div className="w-full md:w-[45%] flex flex-col">
            {analysisResults ? (
              analysisResults.isValidPrescription ? (
                <div className="!p-5 !mb-0 !rounded-xl !bg-rose-50/50 !border !border-rose-100 !text-[13px] !text-slate-600 !leading-relaxed flex-1 flex flex-col justify-between">
                  <div>
                    <div className="!flex !items-center !gap-2 !mb-2.5 !text-rose-600 !font-semibold !text-[14px]">
                      <i className="fa-solid fa-triangle-exclamation !text-[16px]"></i>
                      <span>Order Verification Warning</span>
                    </div>
                    <p className="!mb-3 !text-[12.5px] !text-slate-600 !leading-relaxed">
                      Please review the medicine verification status on the right.
                    </p>
                    <div className="!mb-3 !text-[12.5px] !text-slate-700 !leading-relaxed !font-medium bg-rose-50 border border-rose-100 rounded-lg p-2.5">
                      <strong>Important:</strong> Any items marked as <span className="text-amber-700 font-bold">"Not Matched"</span> will be automatically removed from your cart when you confirm and proceed.
                    </div>
                    <p className="!mb-0 !text-[12px] !text-slate-500 !leading-relaxed">
                      If you uploaded the wrong file, you can click <strong>"Re-upload"</strong> to choose a different prescription.
                    </p>
                  </div>
                  <div className="!text-[11px] !text-slate-400 !border-t !border-rose-100 !pt-2.5 !mt-2.5">
                    <i className="fa-solid fa-circle-info !mr-1.5 !text-rose-400"></i>
                    Only verified prescription items can be successfully processed.
                  </div>
                </div>
              ) : (
                <div className="!p-4 !mb-0 !rounded-xl !bg-purple-50/50 !border !border-purple-100 !text-[13px] !text-slate-600 !leading-relaxed flex-1 flex flex-col justify-between">
                  <div>
                    <div className="!flex !items-center !gap-2 !mb-2 !text-purple-600 !font-semibold">
                      <i className="fa-solid fa-circle-info !text-[15px]"></i>
                      <span>Prescription Requirements:</span>
                    </div>
                    <ul className="!mb-2 !pl-4 !flex !flex-col !gap-1 !list-decimal">
                      <li>Must display <span className="!font-semibold">Doctor's Name</span>.</li>
                      <li>Must display <span className="!font-semibold">Patient's Name</span>.</li>
                      <li>Must display the <span className="!font-semibold">Prescription Date</span>.</li>
                      <li><span className="!font-semibold">Do not crop</span> any part of the prescription image.</li>
                      <li>Avoid uploading <span className="!font-semibold">blurred images</span>.</li>
                    </ul>
                  </div>
                  <div className="!text-[11px] !text-slate-400 !border-t !border-purple-100 !pt-2 !mt-2">
                    <i className="fa-solid fa-prescription-bottle-medical !mr-1.5 !text-purple-400"></i>
                    Please ensure the uploaded image includes complete details of the doctor, patient, clinic visit, and medicines to be dispensed.
                  </div>
                </div>
              )
            ) : !noPrescription ? (
              <div className="!p-4 !mb-0 !rounded-xl !bg-purple-50/50 !border !border-purple-100 !text-[13px] !text-slate-600 !leading-relaxed flex-1 flex flex-col justify-between">
                <div>
                  <div className="!flex !items-center !gap-2 !mb-2 !text-purple-600 !font-semibold">
                    <i className="fa-solid fa-circle-info !text-[15px]"></i>
                    <span>Prescription Requirements:</span>
                  </div>
                  <ul className="!mb-2 !pl-4 !flex !flex-col !gap-1 !list-decimal">
                    <li>Must display <span className="!font-semibold">Doctor's Name</span>.</li>
                    <li>Must display <span className="!font-semibold">Patient's Name</span>.</li>
                    <li>Must display the <span className="!font-semibold">Prescription Date</span>.</li>
                    <li><span className="!font-semibold">Do not crop</span> any part of the prescription image.</li>
                    <li>Avoid uploading <span className="!font-semibold">blurred images</span>.</li>
                  </ul>
                </div>
                <div className="!text-[11px] !text-slate-400 !border-t !border-purple-100 !pt-2 !mt-2">
                  <i className="fa-solid fa-prescription-bottle-medical !mr-1.5 !text-purple-400"></i>
                  Please ensure the uploaded image includes complete details of the doctor, patient, clinic visit, and medicines to be dispensed.
                </div>
              </div>
            ) : (
              <div className="!p-4 !bg-amber-50/50 !border !border-amber-200 !rounded-xl !text-amber-800 !text-[12px] !leading-relaxed flex-1">
                <div className="!flex !gap-2">
                  <i className="fa-solid fa-circle-info !mt-0.5 !text-[15px]"></i>
                  <div>
                    <strong className="!block !mb-1 !font-bold !text-[13px]">Prescription Options:</strong>
                    <ul className="!pl-4 !mb-0 !list-disc !flex !flex-col !gap-1">
                      <li className="!mb-1">
                        <strong>Upload After Payment:</strong> You can proceed to checkout now and upload your prescription later from your order details page.
                      </li>
                      <li>
                        <strong>Get Doctor Prescription:</strong> Alternatively, Medicompares will arrange a doctor consultation and provide a valid prescription for all required medicines in this order for a fee of <strong>₹{prescriptionCharge}</strong>.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>          {/* Right Column: Medicines List, Dropzone & Actions / Analysis Results */}
          <div className="w-full md:w-[55%] flex flex-col justify-between">
            {analysisResults && showTeleconsultScreen ? (
              <div className="flex flex-col h-full justify-between flex-1">
                <div>
                  <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 mb-4 text-purple-800 text-[13px] text-center">
                    <div className="!flex !items-center !justify-center !mb-3 !w-12 !h-12 !rounded-full !bg-purple-100 !text-purple-600 mx-auto">
                      <i className="fa-solid fa-user-doctor text-[22px]"></i>
                    </div>
                    <h6 className="!mb-2 !font-bold !text-[#321961] !text-[15px]">
                      Teleconsultation Request
                    </h6>
                    <p className="text-[12px] text-slate-600 leading-relaxed !mb-4">
                      A registered medical practitioner from Medicompares will contact you on your registered mobile number shortly to verify details and write a valid prescription.
                    </p>
                    <div className="bg-white border border-purple-100 rounded-lg p-2.5 inline-flex items-center gap-2">
                      <span className="text-[11px] font-bold text-purple-600">Consultation Charge:</span>
                      <span className="text-[13px] font-extrabold text-[#321961]">₹{prescriptionCharge}</span>
                    </div>
                  </div>
                  <div className="text-[12px] text-slate-400 text-center leading-relaxed px-2">
                    <i className="fa-solid fa-clock mr-1"></i>
                    Typically takes 15 - 30 minutes. Your order will be created with a <span className="font-semibold text-amber-600">Pending Validation</span> status until then.
                  </div>
                </div>

                <div className="!flex !gap-3 !mt-6">
                  <button
                    type="button"
                    className="!w-1/2 !py-2.5 !rounded-sm !border !border-slate-200 !bg-white !text-slate-600 !font-semibold !text-[14px] hover:!bg-slate-50 hover:!border-slate-300 !transition-all"
                    onClick={() => setShowTeleconsultScreen(false)}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSuccessScreen(true)}
                    className="!w-1/2 !py-2.5 !rounded-sm !font-semibold !text-[14px] !text-white !transition-all !shadow-md hover:!shadow-lg !border-0 !bg-[#321961] hover:!opacity-95"
                  >
                    Proceed with Order
                  </button>
                </div>
              </div>
            ) : analysisResults ? (
              <div className="flex flex-col h-full justify-between flex-1">
                <div>
                  {analysisResults.isValidPrescription ? (
                    <div className="!mb-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 mb-4 text-emerald-800 text-[13px] flex items-center gap-2">
                        <i className="fa-solid fa-circle-check text-[16px] text-emerald-600"></i>
                        <span className="font-semibold">Prescription Validated Successfully!</span>
                      </div>

                      <span className="!block !font-semibold !mb-2 !text-[#321961] !text-[13px]">
                        Medicine Verification Status:
                      </span>
                      <div className="flex flex-col gap-2 max-h-[150px] overflow-y-auto mb-3 bg-slate-50 border border-slate-200 rounded-lg p-2.5">
                        {analysisResults.medicines?.map((med, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 bg-white rounded-md border border-slate-100 text-[12.5px]">
                            <span className="capitalize font-medium text-slate-800">{med.name}</span>
                            {med.matched ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-semibold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                <i className="fa-solid fa-check"></i> Matched
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 font-semibold text-[11px] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                                <i className="fa-solid fa-triangle-exclamation"></i> Not Matched
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="!mb-4">
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 mb-4 text-red-800 text-[13px]">
                        <div className="flex items-center gap-2 mb-1.5">
                          <i className="fa-solid fa-circle-xmark text-[16px] text-red-600"></i>
                          <span className="font-semibold">Verification Failed: Invalid Prescription</span>
                        </div>
                        <p className="text-[12px] text-red-700 !mb-0">
                          The uploaded document could not be validated as a valid prescription. Please ensure it contains all required details (Doctor's name, Patient's name, Date, etc.) and is not blurred or cropped.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Consultation option link */}
                  <div className="!mt-2 !mb-1 text-center border-t border-dashed border-slate-200 pt-3">
                    <button
                      type="button"
                      onClick={() => setShowTeleconsultScreen(true)}
                      className="text-[12.5px] text-purple-600 hover:text-purple-800 font-bold underline bg-transparent border-0 cursor-pointer p-0"
                    >
                      I don't have a prescription, I need one
                    </button>
                  </div>
                </div>

                <div className="!flex !gap-3 !mt-4">
                  <button
                    type="button"
                    className="!w-1/2 !py-2.5 !rounded-sm !border !border-slate-200 !bg-white !text-slate-600 !font-semibold !text-[14px] hover:!bg-slate-50 hover:!border-slate-300 !transition-all"
                    onClick={() => setAnalysisResults(null)}
                  >
                    {analysisResults.isValidPrescription ? "Re-upload" : "Try Again"}
                  </button>
                  <button
                    type="button"
                    disabled={!analysisResults.isValidPrescription}
                    onClick={() => onValidated(analysisResults.prescriptionImage, analysisResults.medicines)}
                    className={`!w-1/2 !py-2.5 !rounded-sm !font-semibold !text-[14px] !text-white !transition-all !shadow-md hover:!shadow-lg !border-0 ${!analysisResults.isValidPrescription
                      ? "!bg-slate-200 !text-slate-400 !cursor-not-allowed !shadow-none hover:!shadow-none"
                      : "!bg-[#321961] hover:!opacity-95"
                      }`}
                  >
                    Confirm & Proceed
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full justify-between flex-1">
                <div>
                  <div className="!mb-4 !text-[13px] !text-slate-500 !leading-relaxed">
                    {mode === "search" ? (
                      "Upload your doctor's prescription, and we will find all matching medicines and their prices for you."
                    ) : (
                      <>
                        {Array.isArray(medicineData) ? (
                          <div>
                            <span className="!block !font-semibold !mb-2 !text-[#321961] !text-[13px]">
                              The following item(s) in your cart require a valid doctor's prescription:
                            </span>
                            <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto mb-3 bg-[#faf5ff] border border-[#e9d5ff] rounded-lg p-2.5">
                              {medicineData.map((med, idx) => (
                                <div key={med._id || idx} className="flex items-center gap-2 text-[12px] font-medium text-slate-700">
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 shrink-0"></span>
                                  <span className="capitalize">{med.name}</span>
                                </div>
                              ))}
                            </div>
                            Please upload a clear photo of your prescription to verify.
                          </div>
                        ) : (
                          <>
                            This medication <strong>({medicineData?.name})</strong> requires a valid doctor's prescription.
                            Please upload a clear photo of your prescription to verify.
                          </>
                        )}
                      </>
                    )}
                  </div>

                  {/* Dropzone */}
                  {!noPrescription && (
                    <div
                      className={`!flex !flex-col !items-center !justify-center !p-3.5 !rounded-[12px] !cursor-pointer !text-center !relative !transition-all !duration-200 !min-h-[90px] ${files.length > 0 ? "!border-2 !border-purple-600 !bg-purple-50/30" : "!border-2 !border-dashed !border-slate-300 !bg-slate-50 hover:!border-purple-400 hover:!bg-slate-50/50"
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
                        multiple
                        style={{ display: "none" }}
                        onChange={handleFileChange}
                      />

                      {files.length > 0 ? (
                        <div className="!w-full !flex !flex-col !gap-2" onClick={(e) => e.stopPropagation()}>
                          <div className="grid grid-cols-4 gap-2 max-h-[100px] overflow-y-auto p-1 bg-white border border-slate-100 rounded-lg">
                            {filePreviews.map((preview, idx) => (
                              <div key={idx} className="relative group border border-slate-200 rounded-lg p-0.5 overflow-hidden max-h-[50px] flex items-center justify-center bg-slate-50">
                                <img
                                  src={preview}
                                  alt={`preview-${idx}`}
                                  className="max-h-[40px] max-w-full object-contain rounded"
                                />
                                <button
                                  onClick={(e) => clearFile(idx, e)}
                                  className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center border-0 p-0 hover:bg-red-600"
                                >
                                  <i className="fa-solid fa-xmark text-[8px]"></i>
                                </button>
                              </div>
                            ))}
                          </div>

                          <div className="max-h-[80px] overflow-y-auto flex flex-col gap-1 p-0.5">
                            {files.map((f, idx) => (
                              <div key={idx} className="!p-1.5 !flex !items-center !gap-2.5 !bg-white !border !border-slate-200 !rounded-[10px] !text-left !shadow-sm">
                                <div className="!flex !items-center !justify-center !w-8 !h-8 !rounded-[8px] !bg-blue-50 !text-blue-500 !text-[12px] !shrink-0">
                                  <i className="fa-regular fa-file-image"></i>
                                </div>

                                <div className="!flex-1 !min-w-0 !text-left">
                                  <span
                                    className="!text-slate-800 !truncate !block !text-[12px] !font-semibold !leading-tight !mb-0.5 !max-w-[140px]"
                                    title={f.name}
                                  >
                                    {f.name}
                                  </span>
                                  <span className="!text-slate-400 !block !text-[10px]">
                                    {(f.size / 1024).toFixed(1)} KB
                                  </span>
                                </div>

                                <button
                                  onClick={(e) => clearFile(idx, e)}
                                  className="!flex !items-center !justify-center !w-7 !h-7 !rounded-md !bg-red-50 !text-red-500 hover:!bg-red-100 hover:!text-red-600 !transition-all !duration-200 !border-0 !p-0 !shrink-0"
                                  title="Remove file"
                                >
                                  <i className="fa-solid fa-trash-can !text-[11px]"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="!flex !items-center !justify-center !w-8 !h-8 !rounded-full !bg-slate-100 !text-slate-400 shrink-0">
                            <i className="fa-solid fa-cloud-arrow-up !text-[14px]"></i>
                          </div>
                          <div className="text-left">
                            <span className="!text-slate-700 !text-[12px] !font-bold !block !leading-tight">
                              Click to upload or drag image(s) here
                            </span>
                            <span className="!text-slate-400 !text-[9.5px] !block !mt-0.5">
                              Supports JPEG, PNG, WebP (Max 10MB)
                            </span>
                          </div>
                        </div>
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
                            setFiles([]);
                            setFilePreviews([]);
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
                </div>

                {/* Actions */}
                <div className="!flex !gap-3 !mt-4">
                  <button
                    type="button"
                    className="!w-1/2 !py-2.5 !rounded-sm !border !border-slate-200 !bg-white !text-slate-600 !font-semibold !text-[14px] hover:!bg-slate-50 hover:!border-slate-300 !transition-all"
                    onClick={onClose}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isUploading || (files.length === 0 && !noPrescription)}
                    onClick={handleSubmit}
                    className={`!w-1/2 !py-2.5 !rounded-sm !font-semibold !text-[14px] !text-white !transition-all !shadow-md hover:!shadow-lg !border-0 ${isUploading || (files.length === 0 && !noPrescription)
                      ? "!bg-slate-200 !text-slate-400 !cursor-not-allowed !shadow-none hover:!shadow-none"
                      : "!bg-[#321961] hover:!opacity-95"
                      }`}
                  >
                    {isUploading ? (
                      <>
                        <div className="!animate-spin !rounded-full !h-4 !w-4 !border-2 !border-white !border-t-transparent !inline-block !mr-2"></div>
                        Verifying...
                      </>
                    ) : noPrescription ? (
                      "Proceed"
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </BaseModal>
  );
};

export default PrescriptionUploadModal2;
