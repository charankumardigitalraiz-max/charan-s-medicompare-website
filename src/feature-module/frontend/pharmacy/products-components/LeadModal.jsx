import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { axiosUserInstance } from "../../../../Apiservice";
import toast from "react-hot-toast";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

const getModalTitle = (type) => {
  const titles = {
    medicine: "Medicine Enquiry",
    surgeries: "Schedule Surgical Consultation",
    labtests: "Book Lab Test",
    diagnostics: "Schedule Diagnostic Test",
    healthcare: "Healthcare Service Request",
    nursingcare: "Nursing Care Service",
    ambulanceservice: "Ambulance Service Request",
    dentalservice: "Dental Service",
    medicalequipment: "Medical Equipment Enquiry",
    medicaltreatment: "Medical Treatment Consultation",
    homecare: "Homecare Service Request",
  };
  return titles[type] || "Service Request";
};

const LeadModal = ({
  show,
  onClose,
  formData,
  onChange,
  productId,
  vendorId,
  variantId,
  formType = "leads",
  fixedType = "",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileError, setMobileError] = useState("");
  const [location, setLocation] = useState({
    address: "",
    lat: null,
    lng: null,
  });
  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        const locationData = {
          address: place.formatted_address,
          lat: place.geometry?.location?.lat() || null,
          lng: place.geometry?.location?.lng() || null,
        };

        setLocation(locationData);

        const syntheticEvent = {
          target: {
            name: "city",
            value: place.formatted_address,
          },
        };
        onChange(syntheticEvent);
      }
    }
  };

  useEffect(() => {
    const handleScroll = (e) => {
      const isPacContainer = e.target?.classList?.contains && e.target.classList.contains("pac-container");
      const isPacItem = e.target?.closest && e.target.closest(".pac-container");

      if (isPacContainer || isPacItem) {
        return;
      }

      if (document.activeElement && document.activeElement.tagName === "INPUT" && document.activeElement.closest(".modal")) {
        document.activeElement.blur();
      }
    };

    if (show) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formData.mobile || !/^[6-9]\d{9}$/.test(formData.mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosUserInstance.post(
        "lead/create",
        {
          name: formData.name,
          age: formData.age,
          gender: formData.gender,
          phone: formData.mobile,
          relation: formData.relation,
          email: formData.email,
          diagnosticType: formData.diagnosticType,
          bodyPart: formData.bodyPart,
          surgeryType: formData.surgeryType,
          city: formData.city,
          location: location,
          testName: formData.testName,
          problemDescription: formData.problem,
          preferredTimeline: formData.timeline,
          hasInsurancePolicy: formData.hasInsurance,
          policyNumber: formData.policyNumber,
          agreeToBeContacted: formData.agreeContact,
          productId,
          vendorId,
          variantId,
          leadSource: "Website",
          leadStage: "New",
          formType,
          serviceType: fixedType,
          status: "active",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success("Submitted successfully!");
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to submit lead"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.88)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 999999999,
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content shadow-lg"
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "none",
          }}
        >
          <div className="modal-body p-0">
            <div className="row g-0">
              <div className="col-md-12 bg-white">
                <div className="p-1 p-md-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">{getModalTitle(fixedType)}</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={onClose}
                    ></button>
                  </div>

                  <form className="d-flex flex-column" onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6 col-12 mb-3">
                        <label className="form-label">
                          Full Name <span className="text-danger">*</span>
                        </label>
                        <input
                          type="text"
                          name="name"
                          className="form-control"
                          placeholder="Enter your full name"
                          required
                          value={formData.name}
                          onChange={onChange}
                        />
                      </div>
                      {fixedType !== "medicalequipment" && (
                        <div className="col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Age <span className="text-danger">*</span>
                          </label>
                          <input
                            type="number"
                            name="age"
                            className="form-control"
                            placeholder="Ex: 32"
                            required
                            value={formData.age || ""}
                            onChange={onChange}
                          />
                        </div>
                      )}

                      {fixedType !== "medicalequipment" ||
                        (fixedType !== "medicine" && (
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Gender <span className="text-danger">*</span>
                            </label>
                            <select
                              name="gender"
                              className="form-control form-select leadSelect"
                              required
                              value={formData.gender || ""}
                              onChange={onChange}
                            >
                              <option value="">Select Gender</option>
                              <option value="male">Male</option>
                              <option value="female">Female</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        ))}

                      <div className="col-md-6 col-12 mb-3">
                        <label className="form-label">
                          Phone Number <span className="text-danger">*</span>
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          className={`form-control ${mobileError ? "is-invalid border-danger" : ""}`}
                          placeholder="Enter 10-digit mobile number"
                          maxLength={10}
                          required
                          value={formData.mobile || ""}
                          onChange={(e) => {
                            const rawVal = e.target.value;
                            const cleanVal = rawVal.replace(/\D/g, "").slice(0, 10);

                            if (/\D/.test(rawVal)) {
                              setMobileError("Only numbers allowed");
                            } else if (cleanVal.length > 0 && cleanVal.length < 10) {
                              setMobileError("Enter valid 10-digit mobile number");
                            } else if (cleanVal.length === 10 && !/^[6-9]\d{9}$/.test(cleanVal)) {
                              setMobileError("Mobile number must start with 6, 7, 8, or 9");
                            } else {
                              setMobileError("");
                            }

                            onChange({
                              target: {
                                name: "mobile",
                                value: cleanVal,
                              },
                            });
                          }}
                          onBlur={() => {
                            const val = formData.mobile || "";
                            if (val.length > 0 && val.length < 10) {
                              setMobileError("Enter valid 10-digit mobile number");
                            } else if (val.length === 10 && !/^[6-9]\d{9}$/.test(val)) {
                              setMobileError("Mobile number must start with 6, 7, 8, or 9");
                            }
                          }}
                        />
                        {mobileError && (
                          <small className="text-danger mt-1 d-block" style={{ fontSize: "12px", fontWeight: "500" }}>
                            {mobileError}
                          </small>
                        )}
                      </div>

                      {fixedType !== "medicalequipment" ||
                        (fixedType !== "medicine" && (
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Relation <span className="text-danger">*</span>
                            </label>
                            <select
                              name="relation"
                              className="form-control form-select leadSelect"
                              required
                              value={formData.relation}
                              onChange={onChange}
                            >
                              <option value="">Select Relation</option>
                              <option value="self">Self</option>
                              <option value="spouse">Spouse</option>
                              <option value="parent">Parent</option>
                              <option value="child">Child</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        ))}

                      <div className="col-md-6 col-12 mb-3">
                        <label className="form-label">
                          Email Address (Optional)
                        </label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          placeholder="your.email@example.com"
                          value={formData.email}
                          onChange={onChange}
                        />
                      </div>

                      {fixedType == "surgery" && (
                        <div className="col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Surgery Type <span className="text-danger">*</span>
                          </label>
                          <select
                            name="surgeryType"
                            className="form-control form-select leadSelect"
                            required
                            value={formData.surgeryType || ""}
                            onChange={onChange}
                          >
                            <option value="">Select surgery type</option>
                            <option value="general">General Surgery</option>
                            <option value="cardiac">Cardiac Surgery</option>
                            <option value="ortho">Orthopedic Surgery</option>
                            <option value="neuro">Neuro Surgery</option>
                            <option value="ent">ENT Surgery</option>
                            <option value="other">Other</option>
                          </select>
                        </div>
                      )}

                      {fixedType === "diagnostics" && (
                        <div className="col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Diagnostic Test{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            name="diagnosticType"
                            className="form-control form-select leadSelect"
                            required
                            value={formData.diagnosticType || ""}
                            onChange={onChange}
                          >
                            <option value="">Select Test</option>
                            <option value="xray">X-Ray</option>
                            <option value="mri">MRI</option>
                            <option value="ct">CT Scan</option>
                            <option value="ultrasound">Ultrasound</option>
                            <option value="ecg">ECG</option>
                            <option value="echo">Echo</option>
                          </select>
                        </div>
                      )}

                      {fixedType === "diagnostics" && (
                        <div className="col-md-6 col-12 mb-3">
                          <label className="form-label">Body Part</label>
                          <input
                            type="text"
                            name="bodyPart"
                            className="form-control"
                            placeholder="Ex: Chest, Brain, Knee"
                            value={formData.bodyPart || ""}
                            onChange={onChange}
                          />
                        </div>
                      )}

                      {fixedType == "surgeries" && (
                        <div className="col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Preferred Surgery Timeline{" "}
                            <span className="text-danger">*</span>
                          </label>
                          <select
                            name="timeline"
                            className="form-control form-select leadSelect"
                            required
                            value={formData.timeline || ""}
                            onChange={onChange}
                          >
                            <option value="">Select</option>
                            <option value="immediate">Immediate</option>
                            <option value="withinWeek">Within a Week</option>
                            <option value="withinMonth">Within a Month</option>
                            <option value="later">Later</option>
                          </select>
                        </div>
                      )}

                      <div className="col-md-6 col-12 mb-3">
                        <label className="form-label">
                          City / Location <span className="text-danger">*</span>
                        </label>
                        {isLoaded ? (
                          <Autocomplete
                            onLoad={(autocomplete) =>
                              (autocompleteRef.current = autocomplete)
                            }
                            onPlaceChanged={onPlaceChanged}
                            options={{
                              componentRestrictions: { country: "in" },
                              fields: [
                                "formatted_address",
                                "geometry",
                                "name",
                                "place_id",
                                "address_components",
                              ],
                              types: ["geocode", "establishment"],
                            }}
                          >
                            <input
                              type="text"
                              name="city"
                              className="form-control"
                              placeholder="Enter pincode, city, district, or area..."
                              required
                              value={formData.city || ""}
                              onChange={onChange}
                              autoComplete="off"
                            />
                          </Autocomplete>
                        ) : (
                          <input
                            type="text"
                            name="city"
                            className="form-control"
                            placeholder="Enter pincode, city, district, or area..."
                            required
                            value={formData.city || ""}
                            onChange={onChange}
                            disabled
                          />
                        )}
                      </div>

                      {fixedType == "labtests" && (
                        <div className="col-md-6 col-12 mb-3">
                          <label className="form-label">
                            Test Name <span className="text-danger">*</span>
                          </label>
                          <input
                            type="text"
                            name="testName"
                            className="form-control"
                            placeholder="Test Name"
                            required
                            value={formData.testName || ""}
                            onChange={onChange}
                          />
                        </div>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <label className="form-label">
                          Description
                          <span className="text-danger">*</span>
                        </label>
                        <textarea
                          name="problem"
                          className="form-control"
                          rows="3"
                          placeholder="Ex: high fever / problem details"
                          required
                          value={formData.problem || ""}
                          onChange={onChange}
                        ></textarea>
                      </div>
                    </div>

                    {fixedType == "surgeries" && (
                      <div className="row">
                        <div className="col-md-12">
                          <label className="form-label">
                            Have an Insurance Policy? (Optional)
                          </label>

                          <div className="d-flex gap-3 mb-2">
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="hasInsurance"
                                id="insuranceYes"
                                value="yes"
                                checked={formData.hasInsurance === "yes"}
                                onChange={onChange}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="insuranceYes"
                              >
                                Yes
                              </label>
                            </div>

                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="radio"
                                name="hasInsurance"
                                id="insuranceNo"
                                value="no"
                                checked={formData.hasInsurance === "no"}
                                onChange={onChange}
                              />
                              <label
                                className="form-check-label"
                                htmlFor="insuranceNo"
                              >
                                No
                              </label>
                            </div>
                          </div>
                        </div>
                        {formData.hasInsurance === "yes" && (
                          <div className="col-md-12 mb-3">
                            <label className="form-label">
                              Insurance Policy Number
                            </label>
                            <input
                              type="text"
                              name="policyNumber"
                              className="form-control"
                              placeholder="Ex: 877898495890191"
                              value={formData.policyNumber || ""}
                              onChange={onChange}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {fixedType !== "medicine" && (
                      <div className="row">
                        <div className="col-md-12 mb-3">
                          <div className="form-check">
                            <input
                              type="checkbox"
                              name="agreeContact"
                              className="form-check-input"
                              id="agreeContactCheck"
                              required
                              onChange={onChange}
                            />
                            <label
                              className="form-check-label"
                              htmlFor="agreeContactCheck"
                            >
                              Agree to Be Contacted{" "}
                              <span className="text-danger">*</span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="text-center mt-2">
                      <button
                        type="submit"
                        className="btn btn-primary rounded-pill  w-100"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`.pac-container { 
          z-index: 2147483647 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          margin-top: 4px;
        }
        .pac-item {
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .pac-item:hover {
          background-color: #f8f9fa;
        }
        .pac-item-query {
          font-size: 0.875rem;
          color: #212529;
        }
        .pac-icon {
          margin-right: 8px;
        }`}</style>
      {typeof document !== "undefined"
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
};

export default LeadModal;
