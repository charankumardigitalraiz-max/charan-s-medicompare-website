import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../../Apiservice.jsx";
import { fetchDoctorsList } from "../../../../services/doctorService";
import { fetchFamilyMembersList, createFamilyMember } from "../../../../services/familyMemberService";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import { DatePicker } from "rsuite";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  getReferredDoctorSelectOptions,
  handleReferredDoctorInputChange,
  handleReferredDoctorSelectChange,
  referredDoctorSelectComponents,
} from "../referredDoctorSelectUtils.jsx";

const libraries = ["places"];

const FamilyMemberSelectionModal = ({
  show,
  onClose,
  userProfile,
  selectedPatients,
  setSelectedPatients,
  onProceed,
}) => {
  const [familyMembersData, setFamilyMembersData] = useState([]);
  const [isAddingFamilyMember, setIsAddingFamilyMember] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    gender: "",
    age: "",
    dateOfBirth: null,
    mobile: "",
    location: "",
    referedByDoctor: "",
    relationship: "",
  });

  const [locationData, setLocationData] = useState({
    address: "",
    lat: null,
    lng: null,
  });

  const [ageError, setAgeError] = useState("");
  const autocompleteRef = useRef(null);

  // Doctors states
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const fetchFamilyMembers = async () => {
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (!token) return;
      const response = await fetchFamilyMembersList();
      if (response.data.success) {
        setFamilyMembersData(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching family members:", error);
    }
  };

  const fetchDoctors = async (searchTerm = "") => {
    try {
      setIsLoadingDoctors(true);
      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        setDoctors([]);
        setAllDoctors([]);
        setFilteredDoctors([]);
        return;
      }

      const response = await fetchDoctorsList(searchTerm);

      if (response.data.success) {
        const doctorsData =
          response.data?.data?.doctors ||
          response.data?.data?.familyDoctors ||
          [];

        if (searchTerm) {
          setFilteredDoctors(doctorsData);
        } else {
          setDoctors(doctorsData);
          setAllDoctors(doctorsData);
          setFilteredDoctors(doctorsData);
        }
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
      setAllDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchFamilyMembers();
      fetchDoctors();
      setIsAddingFamilyMember(false);
      // Initialize selectedPatients from sessionStorage if exists
      try {
        const personType = sessionStorage.getItem("booking_personType");
        if (personType === "self") {
          setSelectedPatients(["self"]);
        } else if (personType === "forWhom") {
          const selectedMember = sessionStorage.getItem(
            "booking_selectedFamilyMember",
          );
          if (selectedMember) {
            const parsed = JSON.parse(selectedMember);
            if (parsed && parsed.value) {
              setSelectedPatients([parsed.value]);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
  }, [show]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const sanitized = value.replace(/\D/g, "").slice(0, 10);
      setFormData((prev) => ({
        ...prev,
        [name]: sanitized,
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const handleDateChange = (date) => {
    if (date) {
      const age = calculateAge(date);
      if (age === 0) {
        toast.error("Age cannot be 0 years");
        setAgeError("Age cannot be 0 years");
        return;
      } else {
        setAgeError("");
      }
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: date,
        age: age.toString(),
      }));
    } else {
      setAgeError("");
      setFormData((prev) => ({
        ...prev,
        dateOfBirth: null,
        age: "",
      }));
    }
  };

  const handleDoctorSearch = (searchTerm) => {
    const searchStr =
      typeof searchTerm === "string" ? searchTerm : String(searchTerm || "");
    setDoctorSearchTerm(searchStr);

    if (searchStr.length >= 2) {
      fetchDoctors(searchStr);
    } else if (searchStr.length === 0) {
      if (allDoctors.length === 0) {
        fetchDoctors();
      } else {
        setFilteredDoctors(allDoctors);
      }
    }
  };

  const handleDoctorSelect = (selectedOption) => {
    if (selectedOption && selectedOption.value) {
      const doctorId = String(selectedOption.value);
      setFormData((prev) => ({
        ...prev,
        referedByDoctor: doctorId,
      }));

      const selectedDoctor = filteredDoctors.find(
        (doctor) => String(doctor._id) === doctorId,
      );

      if (selectedDoctor) {
        setAllDoctors((prev) => {
          const exists = prev.find((doctor) => String(doctor._id) === doctorId);
          if (!exists) {
            return [...prev, selectedDoctor];
          }
          return prev;
        });
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        referedByDoctor: "",
      }));
    }
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.formatted_address) {
        const loc = {
          address: place.formatted_address,
          lat: place.geometry?.location?.lat() || null,
          lng: place.geometry?.location?.lng() || null,
        };
        setLocationData(loc);
        setFormData((prev) => ({
          ...prev,
          location: place.formatted_address,
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.mobile && formData.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age === 0) {
        toast.error("Age cannot be 0 years");
        return;
      }
    }

    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to add family member");
      return;
    }

    const payload = {
      name: formData.name,
      mobile: formData.mobile,
      relationship: formData.relationship,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      referedByDoctor: formData.referedByDoctor || null,
      address: formData.location,
      location: {
        address: formData.location,
        coordinates:
          locationData.lat && locationData.lng
            ? [locationData.lng, locationData.lat]
            : [],
      },
    };

    setIsSubmitting(true);
    try {
      const res = await createFamilyMember(payload);

      if (res.data.success) {
        toast.success("Family member added successfully!");
        const newMember = res.data.data;

        // Refresh the list
        const updatedResponse = await fetchFamilyMembersList();
        const updatedList = updatedResponse.data.data || [];
        setFamilyMembersData(updatedList);

        // Find the new member's ID in the updated list or response
        const newMemberId =
          newMember?._id ||
          updatedList.find(
            (m) => m.name.toLowerCase() === formData.name.toLowerCase(),
          )?._id;

        // Select the newly added member
        if (newMemberId) {
          setSelectedPatients([...selectedPatients, newMemberId]);
        }

        // Return to checklist
        setIsAddingFamilyMember(false);

        // Reset form
        setFormData({
          name: "",
          gender: "",
          age: "",
          dateOfBirth: null,
          mobile: "",
          location: "",
          referedByDoctor: "",
          relationship: "",
        });
        setLocationData({ address: "", lat: null, lng: null });
      } else {
        toast.error(res.data.message || "Failed to add family member");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        err?.message ||
        "Failed to add family member",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!show) return null;

  const modalContent = (
    <div
      className="modal fade show"
      onClick={onClose}
      onMouseDown={onClose}
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.6)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 999999999,
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        style={{
          maxWidth: isAddingFamilyMember ? "500px" : "420px",
          transition: "max-width 0.3s ease",
        }}
      >
        <div
          className="modal-content shadow-lg border-0"
          style={{
            borderRadius: "16px",
            overflow: "hidden",
          }}
        >
          <div
            className="modal-header border-0 pb-0"
            style={{ padding: "20px 24px" }}
          >
            <h5
              className="modal-title"
              style={{ fontSize: "18px", fontWeight: "600", color: "#0f172a" }}
            >
              {isAddingFamilyMember
                ? "Add New Family Member"
                : "Select Patient(s)"}
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>

          <div className="modal-body" style={{ padding: "20px 24px" }}>
            {!isAddingFamilyMember ? (
              <>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#64748b",
                    marginBottom: "16px",
                  }}
                >
                  Please select who this lab test booking is for (you can select
                  multiple).
                </p>

                <div
                  className="d-flex flex-column gap-2"
                  style={{
                    maxHeight: "280px",
                    overflowY: "auto",
                    paddingRight: "4px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#8059ca",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginTop: "4px",
                      marginBottom: "2px",
                    }}
                  >
                    Self
                  </div>
                  {/* Self Checkbox Option */}
                  <div
                    onClick={() => {
                      if (selectedPatients.includes("self")) {
                        setSelectedPatients(
                          selectedPatients.filter((id) => id !== "self"),
                        );
                      } else {
                        setSelectedPatients([...selectedPatients, "self"]);
                      }
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: `1.5px solid ${selectedPatients.includes("self") ? "#8059ca" : "#e2e8f0"}`,
                      backgroundColor: selectedPatients.includes("self")
                        ? "#fdfaff"
                        : "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedPatients.includes("self")}
                      onChange={() => { }}
                      style={{
                        accentColor: "#8059ca",
                        width: "16px",
                        height: "16px",
                        cursor: "pointer",
                      }}
                    />
                    <div>
                      <span
                        style={{
                          fontSize: "13.5px",
                          fontWeight: "600",
                          color: "#0f172a",
                        }}
                      >
                        Self
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#64748b",
                          marginLeft: "6px",
                        }}
                      >
                        (
                        {userProfile?.first_name
                          ? `${userProfile.first_name} ${userProfile.last_name || ""}`
                          : "Account Owner"}
                        )
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      color: "#8059ca",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                      marginTop: "12px",
                      marginBottom: "2px",
                    }}
                  >
                    Family Members
                  </div>
                  {/* Family Members Checkbox Options */}
                  {familyMembersData && familyMembersData.length > 0 ? (
                    familyMembersData.map((member) => {
                      const capName = member.name
                        ? member.name
                          .split(" ")
                          .map(
                            (w) =>
                              w.charAt(0).toUpperCase() +
                              w.slice(1).toLowerCase(),
                          )
                          .join(" ")
                        : "";
                      const capRelation = member.relationship
                        ? member.relationship.charAt(0).toUpperCase() +
                        member.relationship.slice(1).toLowerCase()
                        : "Family";
                      const isSelected = selectedPatients.includes(member._id);
                      return (
                        <div
                          key={member._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedPatients(
                                selectedPatients.filter(
                                  (id) => id !== member._id,
                                ),
                              );
                            } else {
                              setSelectedPatients([
                                ...selectedPatients,
                                member._id,
                              ]);
                            }
                          }}
                          style={{
                            padding: "10px 14px",
                            borderRadius: "8px",
                            border: `1.5px solid ${isSelected ? "#8059ca" : "#e2e8f0"}`,
                            backgroundColor: isSelected ? "#fdfaff" : "#fff",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            transition: "all 0.15s ease",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => { }}
                            style={{
                              accentColor: "#8059ca",
                              width: "16px",
                              height: "16px",
                              cursor: "pointer",
                            }}
                          />
                          <div>
                            <span
                              style={{
                                fontSize: "13.5px",
                                fontWeight: "600",
                                color: "#0f172a",
                              }}
                            >
                              {capName}
                            </span>
                            <span
                              style={{
                                fontSize: "11px",
                                color: "#64748b",
                                marginLeft: "6px",
                              }}
                            >
                              ({capRelation})
                            </span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#64748b",
                        padding: "8px 0",
                        textAlign: "center",
                      }}
                    >
                      No saved family members found.
                    </div>
                  )}

                  {/* Add Family Member Button */}
                  <div
                    onClick={() => {
                      setIsAddingFamilyMember(true);
                    }}
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      border: "1.5px dashed #8059ca",
                      backgroundColor: "#fff",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      transition: "all 0.15s ease",
                      marginTop: "8px",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = "#fdfaff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = "#fff";
                    }}
                  >
                    <i
                      className="fas fa-plus"
                      style={{ color: "#8059ca", fontSize: "14px" }}
                    ></i>
                    <span
                      style={{
                        fontSize: "13.5px",
                        fontWeight: "600",
                        color: "#8059ca",
                      }}
                    >
                      Add Family Member
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label
                      className="form-label"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      placeholder="Enter Name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      style={{ fontSize: "13.5px", padding: "8px 12px" }}
                    />
                  </div>

                  <div
                    className="col-md-6 mb-2"
                    style={{ position: "relative", zIndex: 9999999999 }}
                  >
                    <label
                      className="form-label"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Date of Birth
                    </label>
                    <DatePicker
                      value={formData.dateOfBirth}
                      onChange={handleDateChange}
                      format="MM/dd/yyyy"
                      placeholder="Select Date of Birth"
                      style={{
                        width: "100%",
                      }}
                      shouldDisableDate={(date) => date && date > new Date()}
                      cleanable
                      editable={false}
                    />
                    {formData.dateOfBirth && (
                      <small
                        className="mt-1 d-block"
                        style={{
                          fontSize: "11px",
                          color: "#8059ca",
                          fontWeight: "600",
                        }}
                      >
                        Age: {calculateAge(formData.dateOfBirth)} years
                      </small>
                    )}
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label
                      className="form-label"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Gender
                    </label>
                    <select
                      className="form-select"
                      style={{ padding: "8px 12px", fontSize: "13.5px" }}
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div className="col-md-6 mb-2">
                    <label
                      className="form-label"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Referred By Doctor
                    </label>
                    <Select
                      name="referedByDoctor"
                      value={(() => {
                        if (!formData.referedByDoctor) return null;
                        const doctorId = String(formData.referedByDoctor);
                        let selectedDoctor = filteredDoctors.find(
                          (doctor) => String(doctor._id) === doctorId,
                        );
                        if (!selectedDoctor) {
                          selectedDoctor = allDoctors.find(
                            (doctor) => String(doctor._id) === doctorId,
                          );
                        }
                        if (selectedDoctor && selectedDoctor.name) {
                          return {
                            value: String(selectedDoctor._id),
                            label: `${selectedDoctor.name}${selectedDoctor["AreaOfPractice "] ? ` (${selectedDoctor["AreaOfPractice "]})` : ""}${selectedDoctor.place ? `, ${selectedDoctor.place}` : ""}`,
                          };
                        }
                        return null;
                      })()}
                      onChange={handleDoctorSelect}
                      onInputChange={handleDoctorSearch}
                      components={referredDoctorSelectComponents}
                      options={getReferredDoctorSelectOptions(
                        filteredDoctors.filter(
                          (doctor) => doctor && doctor._id && doctor.name,
                        ),
                      )}
                      placeholder={
                        isLoadingDoctors ? "Loading..." : "Select..."
                      }
                      isClearable
                      isSearchable
                      isLoading={isLoadingDoctors}
                      className="basic-select"
                      classNamePrefix="select"
                      noOptionsMessage={() =>
                        isLoadingDoctors ? "Loading..." : "No doctors found"
                      }
                      styles={{
                        control: (baseStyles, state) => ({
                          ...baseStyles,
                          borderColor: state.isFocused ? "#8059ca" : "#ccc",
                          boxShadow: state.isFocused
                            ? "0 0 0 1px #8059ca"
                            : "none",
                          "&:hover": { borderColor: "#8059ca" },
                          fontSize: "13.5px",
                        }),
                        menu: (baseStyles) => ({
                          ...baseStyles,
                          zIndex: 9999,
                          maxHeight: "150px",
                        }),
                        menuList: (baseStyles) => ({
                          ...baseStyles,
                          maxHeight: "150px",
                        }),
                        option: (baseStyles) => ({
                          ...baseStyles,
                          padding: "8px 12px",
                          fontSize: "13px",
                        }),
                      }}
                    />
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-2">
                    <label
                      className="form-label"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Mobile
                    </label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="Enter 10-digit Mobile Number"
                      name="mobile"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      maxLength="10"
                      pattern="[0-9]{10}"
                      title="Mobile number must be exactly 10 digits"
                      required
                      style={{ fontSize: "13.5px", padding: "8px 12px" }}
                    />
                    {formData.mobile && formData.mobile.length > 0 && formData.mobile.length < 10 && (
                      <small className="text-danger mt-1 d-block" style={{ fontSize: "11px" }}>
                        Mobile number must be exactly 10 digits
                      </small>
                    )}
                  </div>

                  <div className="col-md-6 mb-2">
                    <label
                      className="form-label"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Relationship
                    </label>
                    <select
                      name="relationship"
                      value={formData.relationship}
                      onChange={handleInputChange}
                      required
                      className="form-select"
                      style={{ padding: "8px 12px", fontSize: "13.5px" }}
                    >
                      <option value="">Select relationship</option>
                      <option value="Brother">Brother</option>
                      <option value="Cousin">Cousin</option>
                      <option value="Daughter">Daughter</option>
                      <option value="Father">Father</option>
                      <option value="Granddaughter">Granddaughter</option>
                      <option value="Grandfather">Grandfather</option>
                      <option value="Grandmother">Grandmother</option>
                      <option value="Grandson">Grandson</option>
                      <option value="Husband">Husband</option>
                      <option value="Me">Me</option>
                      <option value="Mother">Mother</option>
                      <option value="Other">Other</option>
                      <option value="Sister">Sister</option>
                      <option value="Son">Son</option>
                      <option value="Wife">Wife</option>
                    </select>
                  </div>
                </div>

                <div className="row">
                  <div className="col-12 mb-3">
                    <label
                      className="form-label"
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#475569",
                      }}
                    >
                      Location
                    </label>
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
                            className="form-control"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Search by city, state, pincode, or area..."
                            required
                            style={{
                              paddingLeft: "35px",
                              fontSize: "13.5px",
                              padding: "8px 12px 8px 35px",
                            }}
                            autoComplete="off"
                          />
                        </Autocomplete>
                      ) : (
                        <input
                          type="text"
                          className="form-control"
                          name="location"
                          value={formData.location}
                          onChange={handleInputChange}
                          placeholder="City / Location"
                          required
                          style={{
                            paddingLeft: "35px",
                            fontSize: "13.5px",
                            padding: "8px 12px 8px 35px",
                          }}
                          disabled
                        />
                      )}
                      <i className="fas fa-map-marker-alt position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"></i>
                    </div>
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button
                    type="button"
                    className="btn btn-light rounded-pill px-4"
                    onClick={() => setIsAddingFamilyMember(false)}
                    style={{
                      fontSize: "14px",
                      fontWeight: "500",
                      borderRadius: "50px",
                    }}
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary rounded-pill px-4"
                    disabled={isSubmitting}
                    style={{
                      backgroundColor: "#8059ca",
                      borderColor: "#8059ca",
                      fontSize: "14px",
                      fontWeight: "500",
                      color: "#fff",
                      borderRadius: "50px",
                    }}
                  >
                    {isSubmitting ? "Adding..." : "Add Profile"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {!isAddingFamilyMember && (
            <div
              className="modal-footer border-0 pt-0"
              style={{ padding: "20px 24px" }}
            >
              {/* <button
                type="button"
                className="btn btn-light rounded-pill px-4"
                onClick={onClose}
                style={{ fontSize: "14px", fontWeight: "500", borderRadius: "50px" }}
              >
                Cancel
              </button> */}
              <button
                type="button"
                className="btn btn-primary rounded-pill px-4"
                onClick={() => onProceed(selectedPatients, familyMembersData)}
                style={{
                  backgroundColor: "#8059ca",
                  borderColor: "#8059ca",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "#fff",
                  borderRadius: "50px",
                }}
              >
                Proceed
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const modalElement = (
    <>
      <style>{`
        .rs-picker {
          z-index: 9999999999 !important;
        }
        .rs-picker-popup {
          z-index: 9999999999 !important;
        }
        .rs-calendar {
          z-index: 9999999999 !important;
        }
        .rs-picker-date-menu {
          z-index: 9999999999 !important;
        }
        .rs-picker-dropdown {
          z-index: 9999999999 !important;
        }
        .pac-container { 
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
        }
      `}</style>
      {modalContent}
    </>
  );

  return typeof document !== "undefined"
    ? createPortal(modalElement, document.body)
    : null;
};

export default FamilyMemberSelectionModal;
