import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { axiosUserInstance } from "../../../../Apiservice";
import toast from "react-hot-toast";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

const getModalDetails = (type) => {
  const details = {
    medicine: {
      title: "Medicine Appointment",
      icon: "fas fa-pills",
      smallText: "Select date, time slot, and medicine details",
    },
    surgeries: {
      title: "Surgical Appointment",
      icon: "fas fa-procedures",
      smallText: "Select date, time slot, and surgery details",
    },
    labtests: {
      title: "Lab Test Appointment",
      icon: "fas fa-vials",
      smallText: "Select date, time slot, and lab test details",
    },
    diagnostics: {
      title: "Diagnostic Test Appointment",
      icon: "fas fa-notes-medical",
      smallText: "Select date, time slot, and diagnostic details",
    },
    healthcare: {
      title: "Healthcare Appointment",
      icon: "fas fa-user-md",
      smallText: "Select date, time slot, and healthcare service details",
    },
    nursingcare: {
      title: "Nursing Care Appointment",
      icon: "fas fa-hands-helping",
      smallText: "Select date, time slot, and nursing care details",
    },
    ambulanceservice: {
      title: "Ambulance Service Appointment",
      icon: "fas fa-ambulance",
      smallText: "Select date, time slot, and pickup details",
    },
    dentalservice: {
      title: "Dental Appointment",
      icon: "fas fa-tooth",
      smallText: "Select date, time slot, and dental details",
    },
    medicalequipment: {
      title: "Medical Equipment Appointment",
      icon: "fas fa-wheelchair",
      smallText: "Select date and equipment details",
    },
    medicaltreatment: {
      title: "Medical Treatment Appointment",
      icon: "fas fa-stethoscope",
      smallText: "Select date, time slot, and treatment details",
    },
    homecare: {
      title: "Homecare Appointment",
      icon: "fas fa-home",
      smallText: "Select date, time slot, and homecare details",
    },
  };

  return (
    details[type] || {
      title: "Service Appointment",
      icon: "fas fa-calendar-check",
      smallText: "Select date and time slot",
    }
  );
};

const AppointmentModal = ({
  show,
  onClose,
  formData,
  onFormChange,
  productId,
  vendorId,
  variantId,
  formType = "appointment",
  fixedType = "",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(
    formData?.timeSlot || "Morning",
  );
  const [selectedTiming, setSelectedTiming] = useState("");
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

  useEffect(() => {
    const handleScroll = (e) => {
      const isPacContainer =
        e.target?.classList?.contains &&
        e.target.classList.contains("pac-container");
      const isPacItem = e.target?.closest && e.target.closest(".pac-container");

      if (isPacContainer || isPacItem) {
        return;
      }

      if (
        document.activeElement &&
        document.activeElement.tagName === "INPUT" &&
        document.activeElement.closest(".modal")
      ) {
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

  const fieldStyle = {
    height: "44px",
    borderRadius: "8px",
    border: "1px solid #ddd",
  };

  const handleTimeSlotChange = (slot) => {
    setSelectedTimeSlot(slot);
    setSelectedTiming("");
    onFormChange({
      target: { name: "timeSlot", value: slot },
    });
  };

  const handleTimingChange = (timing) => {
    setSelectedTiming(timing);
    onFormChange({
      target: { name: "selectedTiming", value: timing },
    });
  };

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
            name: "address",
            value: place.formatted_address,
          },
        };
        onFormChange(syntheticEvent);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to submit");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosUserInstance.post(
        "lead/create",
        {
          name: formData.name,
          phone: formData.phone,
          category: formData.category || formData.dentalIssueType || null,
          date: formData.date,
          timeSlot: selectedTimeSlot,
          selectedTiming: formData.selectedTiming || selectedTiming || null,
          age: formData.age || null,
          address: formData.address || null,
          location: location,
          endDate: formData.endDate || null,
          startDate: formData.startDate || null,
          gender: formData.gender || null,
          homecareServiceType: formData.homecareServiceType || null,
          diagnosticType: formData.diagnosticType || null,
          testName: formData.testName || null,
          description: formData.description || null,
          bedridden: formData.bedridden || null,
          confirmInfo: formData.confirmInfo || false,
          agreeTerms: formData.agreeTerms || false,
          productId,
          vendorId,
          variantId,
          leadSource: "Website",
          leadStage: "New",
          formType,
          status: "active",
          serviceType: fixedType,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      toast.success("Appointment booked successfully!");
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to book appointment",
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
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        zIndex: 99999999999,
      }}
    >
      <style>{`
        .pac-container {
          z-index: 2147483647 !important;
        }
      `}</style>
      <div className="modal-dialog modal-dialog-centered modal-md">
        <div className="modal-content border-0 rounded-4">
          <div className="modal-body p-4 bg-white rounded-4">
            {/* Header */}
            <div className="d-flex justify-content-between mb-3">
              <div>
                <div className="d-flex align-items-center gap-2">
                  <i
                    className={`${
                      getModalDetails(fixedType).icon
                    } text-primary`}
                  ></i>
                  <h5 className="fw-bold mb-0">
                    {getModalDetails(fixedType).title}
                  </h5>
                </div>
                <p className="text-muted mb-0" style={{ fontSize: "13px" }}>
                  {getModalDetails(fixedType).smallText}
                </p>
              </div>

              <button className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              {fixedType !== "medicalequipment" && (
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select Date</label>
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    required
                    min={new Date().toISOString().split("T")[0]}
                    value={formData.date || ""}
                    onChange={onFormChange}
                    style={fieldStyle}
                  />
                </div>
              )}

              {fixedType === "medicalequipment" && (
                <div className="row">
                  <div className="mb-3 col-md-6 col-12">
                    <label className="form-label fw-semibold">Start Date</label>
                    <input
                      type="date"
                      name="startDate"
                      className="form-control"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={formData.startDate || ""}
                      onChange={onFormChange}
                      style={fieldStyle}
                    />
                  </div>

                  <div className="mb-3 col-md-6 col-12">
                    <label className="form-label fw-semibold">End Date</label>
                    <input
                      type="date"
                      name="endDate"
                      className="form-control"
                      required
                      min={
                        formData.startDate ||
                        new Date().toISOString().split("T")[0]
                      }
                      value={formData.endDate || ""}
                      onChange={onFormChange}
                      style={fieldStyle}
                    />
                  </div>
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6 col-12">
                  <div className="position-relative">
                    <input
                      type="text"
                      name="name"
                      className="form-control"
                      placeholder="Patient Name"
                      required
                      value={formData.name || ""}
                      onChange={onFormChange}
                      style={{ ...fieldStyle, paddingLeft: "40px" }}
                    />
                    <i className="fas fa-user position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  </div>
                </div>

                {fixedType !== "medicalequipment" && (
                  <div className="col-md-6 col-12">
                    <input
                      type="number"
                      name="age"
                      className="form-control"
                      placeholder="Age"
                      required
                      value={formData.age || ""}
                      onChange={onFormChange}
                      style={fieldStyle}
                    />
                  </div>
                )}

                <div className="col-md-6 col-12">
                  <div className="position-relative">
                    <input
                      type="tel"
                      name="phone"
                      className="form-control"
                      placeholder="Mobile Number"
                      required
                      value={formData.phone || ""}
                      onChange={onFormChange}
                      style={{ ...fieldStyle, paddingLeft: "40px" }}
                    />
                    <i className="fas fa-phone position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  </div>
                </div>

                {fixedType !== "medicalequipment" && (
                  <div className="col-md-6 col-12">
                    <div className="position-relative">
                      <select
                        name="gender"
                        className="form-control form-select"
                        required
                        value={formData.gender || ""}
                        onChange={onFormChange}
                        style={{ ...fieldStyle, paddingLeft: "40px" }}
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                      <i className="fas fa-venus-mars position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    </div>
                  </div>
                )}

                {fixedType === "diagnostics" && (
                  <div className="col-md-6 col-12">
                    <div className="position-relative">
                      <select
                        name="diagnosticType"
                        className="form-control form-select"
                        required
                        value={formData.diagnosticType || ""}
                        onChange={onFormChange}
                        style={{ ...fieldStyle, paddingLeft: "40px" }}
                      >
                        <option value="">Select Diagnostic</option>
                        <option value="xray">X-Ray</option>
                        <option value="mri">MRI</option>
                        <option value="ct">CT Scan</option>
                        <option value="ultrasound">Ultrasound</option>
                        <option value="ecg">ECG</option>
                        <option value="echo">Echo</option>
                      </select>
                      <i className="fas fa-notes-medical position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    </div>
                  </div>
                )}

                {fixedType === "homecare" && (
                  <div className="col-md-6 col-12">
                    <div className="position-relative">
                      <select
                        name="homecareServiceType"
                        className="form-control form-select"
                        required
                        value={formData.homecareServiceType || ""}
                        onChange={onFormChange}
                        style={{ ...fieldStyle, paddingLeft: "40px" }}
                      >
                        <option value="">Select Home Care</option>
                        <option value="Elder Care">Elder Care</option>
                        <option value="Post Surgery Care">
                          Post Surgery Care
                        </option>
                        <option value="Physiotherapy">Physiotherapy</option>
                        <option value="Nursing Care">Nursing Care</option>
                        <option value="Other">Other</option>
                      </select>
                      <i className="fas fa-home position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    </div>
                  </div>
                )}

                {fixedType === "labtests" && (
                  <div className="col-md-6 col-12">
                    <div className="position-relative">
                      <input
                        type="text"
                        name="testName"
                        className="form-control"
                        placeholder="Enter Lab Test Name"
                        required
                        value={formData.testName || ""}
                        onChange={onFormChange}
                        style={{ ...fieldStyle, paddingLeft: "40px" }}
                      />
                      <i className="fas fa-vials position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    </div>
                  </div>
                )}

                <div className="col-md-12 col-12">
                  <div className="position-relative">
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
                          types: ["geocode"],
                        }}
                      >
                        <input
                          type="text"
                          name="address"
                          className="form-control"
                          placeholder="Search by city, state, pincode, or area..."
                          required
                          value={formData.address || ""}
                          onChange={onFormChange}
                          style={{ ...fieldStyle, paddingLeft: "40px" }}
                          autoComplete="off"
                        />
                      </Autocomplete>
                    ) : (
                      <input
                        type="text"
                        name="address"
                        className="form-control"
                        placeholder="City / Location"
                        required
                        value={formData.address || ""}
                        onChange={onFormChange}
                        style={{ ...fieldStyle, paddingLeft: "40px" }}
                        disabled
                      />
                    )}
                    <i className="fas fa-location position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                  </div>
                </div>

                {fixedType == "dentalservice" && (
                  <div className="col-md-6 col-12">
                    <select
                      name="dentalIssueType"
                      className="form-control form-select"
                      required
                      value={
                        formData.dentalIssueType || formData.category || ""
                      }
                      onChange={onFormChange}
                      style={fieldStyle}
                    >
                      <option value="">Select Dental Issue Type</option>
                      <option value="General Checkup">General Checkup</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Root Canal">Root Canal</option>
                      <option value="Dental Implant">Dental Implant</option>
                      <option value="Braces">Braces</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                )}

                {fixedType == "nursingcare" && (
                  <>
                    <div>
                      <label className="form-label fw-semibold">
                        <span className="text-danger">*</span> Preferred
                        Timeline
                      </label>

                      <div
                        className="d-flex gap-2"
                        style={{ flexWrap: "nowrap", overflowX: "auto" }}
                      >
                        <button
                          type="button"
                          onClick={() => handleTimeSlotChange("Morning")}
                          className="btn border rounded-3 px-2 py-2"
                          style={{
                            flex: 1,
                            minWidth: "140px",
                            height: "44px",
                            background:
                              selectedTimeSlot === "Morning"
                                ? "#8059ca"
                                : "#fff",
                            color:
                              selectedTimeSlot === "Morning" ? "#fff" : "#333",
                            borderColor:
                              selectedTimeSlot === "Morning"
                                ? "#8059ca"
                                : "#ddd",
                          }}
                        >
                          <div>8hrs Shift</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTimeSlotChange("Afternoon")}
                          className="btn border rounded-3 px-2 py-2"
                          style={{
                            flex: 1,
                            minWidth: "140px",
                            background:
                              selectedTimeSlot === "Afternoon"
                                ? "#8059ca"
                                : "#fff",
                            color:
                              selectedTimeSlot === "Afternoon"
                                ? "#fff"
                                : "#333",
                            borderColor:
                              selectedTimeSlot === "Afternoon"
                                ? "#8059ca"
                                : "#ddd",
                          }}
                        >
                          <div>12hrs Shift</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTimeSlotChange("Evening")}
                          className="btn border rounded-3 px-2 py-2"
                          style={{
                            flex: 1,
                            minWidth: "140px",
                            background:
                              selectedTimeSlot === "Evening"
                                ? "#8059ca"
                                : "#fff",
                            color:
                              selectedTimeSlot === "Evening" ? "#fff" : "#333",
                            borderColor:
                              selectedTimeSlot === "Evening"
                                ? "#8059ca"
                                : "#ddd",
                          }}
                        >
                          <div>24hrs Shift</div>
                        </button>
                      </div>

                      <div className="mt-2">
                        {selectedTimeSlot === "Morning" && (
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleTimingChange("7AM-3PM")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "140px",
                                height: "44px",
                                background:
                                  selectedTiming === "7AM-3PM"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "7AM-3PM"
                                    ? "#fff"
                                    : "#333",
                                borderColor:
                                  selectedTiming === "7AM-3PM"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-sun text-warning"
                                style={{ marginRight: "5px" }}
                              ></i>
                              7AM-3PM
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimingChange("8AM-4PM")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "140px",
                                height: "44px",
                                background:
                                  selectedTiming === "8AM-4PM"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "8AM-4PM"
                                    ? "#fff"
                                    : "#333",
                                borderColor:
                                  selectedTiming === "8AM-4PM"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-sun text-warning"
                                style={{ marginRight: "5px" }}
                              ></i>
                              8AM-4PM
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimingChange("9AM-5PM")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "140px",
                                height: "44px",
                                background:
                                  selectedTiming === "9AM-5PM"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "9AM-5PM"
                                    ? "#fff"
                                    : "#333",
                                borderColor:
                                  selectedTiming === "9AM-5PM"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-sun text-warning"
                                style={{ marginRight: "5px" }}
                              ></i>
                              9AM-5PM
                            </button>
                          </div>
                        )}
                        {selectedTimeSlot === "Afternoon" && (
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleTimingChange("7PM-7AM")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "140px",
                                height: "44px",
                                background:
                                  selectedTiming === "7PM-7AM"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "7PM-7AM"
                                    ? "#fff"
                                    : "#333",
                                borderColor:
                                  selectedTiming === "7PM-7AM"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-moon"
                                style={{
                                  marginRight: "5px",
                                  color:
                                    selectedTiming === "7PM-7AM"
                                      ? "#fff"
                                      : "#8059ca",
                                }}
                              ></i>
                              7PM-7AM
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimingChange("8PM-8AM")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "140px",
                                height: "44px",
                                background:
                                  selectedTiming === "8PM-8AM"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "8PM-8AM"
                                    ? "#fff"
                                    : "#333",
                                borderColor:
                                  selectedTiming === "8PM-8AM"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-moon"
                                style={{
                                  marginRight: "5px",
                                  color:
                                    selectedTiming === "8PM-8AM"
                                      ? "#fff"
                                      : "#8059ca",
                                }}
                              ></i>
                              8PM-8AM
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimingChange("9PM-9AM")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "140px",
                                height: "44px",
                                background:
                                  selectedTiming === "9PM-9AM"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "9PM-9AM"
                                    ? "#fff"
                                    : "#333",
                                borderColor:
                                  selectedTiming === "9PM-9AM"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-moon "
                                style={{
                                  marginRight: "5px",
                                  color:
                                    selectedTiming === "9PM-9AM"
                                      ? "#fff"
                                      : "#8059ca",
                                }}
                              ></i>
                              9PM-9AM
                            </button>
                          </div>
                        )}
                        {selectedTimeSlot === "Evening" && (
                          <div className="d-flex gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleTimingChange("Full Day")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "120px",
                                height: "44px",
                                background:
                                  selectedTiming === "Full Day"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "Full Day"
                                    ? "#fff"
                                    : "#333",
                                borderColor:
                                  selectedTiming === "Full Day"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-clock text-info"
                                style={{ marginRight: "5px" }}
                              ></i>
                              Full Day
                            </button>
                            <button
                              type="button"
                              onClick={() => handleTimingChange("24/7")}
                              className="btn border rounded-3 px-3 py-2"
                              style={{
                                width: "120px",
                                height: "44px",
                                background:
                                  selectedTiming === "24/7"
                                    ? "#8059ca"
                                    : "#fff",
                                color:
                                  selectedTiming === "24/7" ? "#fff" : "#333",
                                borderColor:
                                  selectedTiming === "24/7"
                                    ? "#8059ca"
                                    : "#ddd",
                              }}
                            >
                              <i
                                className="fas fa-infinity text-success"
                                style={{ marginRight: "5px" }}
                              ></i>
                              24/7
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="col-md-6 col-12">
                      <label className="form-label fw-semibold">
                        <span className="text-danger">*</span> Is the patient
                        Bedridden?
                      </label>

                      <div className="d-flex gap-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="bedridden"
                            id="bedriddenYes"
                            value="Yes"
                            checked={formData.bedridden === "Yes"}
                            onChange={onFormChange}
                            required
                          />
                          <label
                            className="form-check-label"
                            htmlFor="bedriddenYes"
                          >
                            Yes
                          </label>
                        </div>

                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="radio"
                            name="bedridden"
                            id="bedriddenNo"
                            value="No"
                            checked={formData.bedridden === "No"}
                            onChange={onFormChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="bedriddenNo"
                          >
                            No
                          </label>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="mt-3">
                  <textarea
                    name="description"
                    className="form-control"
                    rows="3"
                    placeholder="Write more about your requirements..."
                    value={formData.description || ""}
                    onChange={onFormChange}
                    style={{ borderRadius: "8px", border: "1px solid #ddd" }}
                  ></textarea>
                </div>

                <div className="mt-3">
                  <div className="form-check mb-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="confirmInfo"
                      name="confirmInfo"
                      checked={!!formData.confirmInfo}
                      onChange={(e) =>
                        onFormChange({
                          target: {
                            name: "confirmInfo",
                            value: e.target.checked,
                          },
                        })
                      }
                      required
                    />
                    <label className="form-check-label" htmlFor="confirmInfo">
                      I confirm the information provided is accurate
                    </label>
                  </div>

                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="agreeTerms"
                      name="agreeTerms"
                      checked={!!formData.agreeTerms}
                      onChange={(e) =>
                        onFormChange({
                          target: {
                            name: "agreeTerms",
                            value: e.target.checked,
                          },
                        })
                      }
                      required
                    />
                    <label className="form-check-label" htmlFor="agreeTerms">
                      I agree to the{" "}
                      <a
                        href="/policies/terms-and-conditions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        Terms
                      </a>{" "}
                      &{" "}
                      <a
                        href="/policies/privacy-policy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary"
                      >
                        Privacy Policy
                      </a>
                    </label>
                  </div>
                </div>
                {fixedType == "nursingcare" && (
                  <div>
                    <span style={{color:
                    "black", fontWeight:"500"}}>Instructions :-</span>
                    <div style={{ paddingLeft: "20px", }}>
                      <li style={{ marginBottom: "5px", fontSize:"12px", color:"black" }}>
                        Do not request nurses to perform personal or household
                        tasks. They are assigned strictly for patient care only.
                      </li>
                      <li style={{ marginBottom: "5px", fontSize:"12px", color:"black" }}>
                        Do not share valuables such as cash, ATM/credit/debit
                        cards, or personal belongings with the caregiver.
                      </li>
                      <li style={{ fontSize:"12px", color:"black" }}>
                        Do not extend service hours directly with the nurse. All
                        changes or extensions must be coordinated through our
                        support team.
                      </li>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center mt-4">
                <button
                  type="submit"
                  className="btn px-5 py-2 w-100"
                  disabled={isSubmitting}
                  style={{
                    background: "#8059ca",
                    color: "#fff",
                    fontWeight: 600,
                  }}
                >
                  {isSubmitting ? "Booking..." : "Book Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`.pac-container { 
          z-index: 999999999999 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          margin-top: 4px;
          position: absolute !important;
        }
        .pac-item {
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
          font-size: 14px;
        }
        .pac-item:hover {
          background-color: #f8f9fa;
        }
        .pac-item-query {
          font-size: 0.875rem;
          color: #212529;
          font-weight: 500;
        }
        .pac-icon {
          margin-right: 8px;
        }`}</style>
      {createPortal(modalContent, document.body)}
    </>
  );
};

export default AppointmentModal;
