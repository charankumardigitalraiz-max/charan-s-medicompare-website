import React, { useState, useEffect, useRef } from "react";
import BaseModal from "../ui/BaseModal";
import { createPortal } from "react-dom";
import {
  axiosCommonInstance,
  axiosUserInstance,
} from "../../Apiservice.jsx";
import { fetchDoctorsList } from "../../services/doctorService";
import { fetchFamilyMembersList, createFamilyMember } from "../../services/familyMemberService";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import CustomDatePicker from "../ui/CustomDatePicker";
import { useResponsive } from "../../hooks/useResponsive.js";
import Select from "react-select";
import toast from "react-hot-toast";
import {
  getReferredDoctorSelectOptions,
  handleReferredDoctorInputChange,
  handleReferredDoctorSelectChange,
  referredDoctorSelectComponents,
} from "../ui/referredDoctorSelectUtils";
import { GOOGLE_MAPS_API_KEY } from "../../utils/index.js"

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
  const { isMobile, isTabletOrBelow, isTablet } = useResponsive;
  const useNativeDateInput = isMobile || isTablet || isTabletOrBelow;

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

  // const GOOGLE_MAPS_API_KEY =
  //   import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
  //   "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

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
    <BaseModal
      show={show}
      onClose={onClose}
      title={isAddingFamilyMember ? "Add New Family Member" : "Select Patient(s)"}
      size="md"
      className={isAddingFamilyMember ? "max-w-[500px]" : "max-w-[420px]"}
      bodyClassName="!p-6"
      headerClassName="border-b-0 pb-0"
      disableBackdropBlur={true}   // ← add this
      footer={
        !isAddingFamilyMember && (
          <button
            type="button"
            onClick={() => onProceed(selectedPatients, familyMembersData)}
            className="px-6 py-2 !text-sm !font-medium !rounded-full !bg-primary hover:bg-[#6f42c1] text-white border-none transition-colors"
          >
            Proceed
          </button>
        )
      }
    >
      <div id="family-member-modal-body" className="relative overflow-visible">
        {!isAddingFamilyMember ? (
          <>
            <p className="text-xs text-slate-500 mb-4">
              Please select who this lab test booking is for (you can select
              multiple).
            </p>

            <div className="flex flex-col gap-3.5 max-h-[280px] overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.5px] mt-1 mb-0.5">
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
                className={`px-3.5 py-2.5 !rounded-md !border-[1.5px] cursor-pointer flex items-center gap-2.5 transition-all duration-150 ${selectedPatients.includes("self")
                  ? "!border-primary bg-[#fdfaff]"
                  : "!border-slate-200 bg-white"
                  }`}
              >
                <input
                  type="checkbox"
                  checked={selectedPatients.includes("self")}
                  onChange={() => { }}
                  className="accent-primary w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-[13.5px] font-semibold text-slate-900">
                    Self
                  </span>
                  <span className="text-[11px] text-slate-500 ml-1.5">
                    (
                    {userProfile?.first_name
                      ? `${userProfile.first_name} ${userProfile.last_name || ""}`
                      : "Account Owner"}
                    )
                  </span>
                </div>
              </div>

              <div className="text-[11px] font-bold text-primary uppercase tracking-[0.5px] mt-3 mb-0.5">
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
                      className={`px-3.5 py-2.5 !rounded-md !border-[1.5px] m-2cursor-pointer flex items-center gap-2.5 transition-all duration-150 ${isSelected
                        ? "!border-primary bg-[#fdfaff]"
                        : "!border-slate-200 bg-white"
                        }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => { }}
                        className="accent-primary w-4 h-4 cursor-pointer"
                      />
                      <div>
                        <span className="text-[13.5px] font-semibold text-slate-900">
                          {capName}
                        </span>
                        <span className="text-[11px] text-slate-500 ml-1.5">
                          ({capRelation})
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-xs text-slate-500 py-2 text-center">
                  No saved family members found.
                </div>
              )}

              {/* Add Family Member Button */}
              <div
                onClick={() => {
                  setIsAddingFamilyMember(true);
                }}
                className="px-3.5 py-2.5 !rounded-lg !border-[1.5px] !border-dashed !border-primary !bg-white hover:bg-[#fdfaff] cursor-pointer flex items-center justify-center gap-2 transition-all duration-150 mt-2"
              >
                <i className="fas fa-plus text-primary text-sm"></i>
                <span className="!text-[13.5px] !font-semibold text-primary">
                  Add Family Member
                </span>
              </div>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="flex flex-col mb-2">
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Name
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13.5px] outline-none transition-colors focus:border-[#321961] focus:ring-1 focus:ring-[#321961]"
                  name="name"
                  placeholder="Enter Name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div
                className="flex flex-col mb-2 relative z-[9999999999]"
              >
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Date of Birth
                </label>
                {/* {useNativeDateInput ? ( */}
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#321961]"
                  style={{
                    position: "relative",
                    zIndex: 9999999999998,
                  }}
                />
                {/* // ) : ( */}

                {/* //   <CustomDatePicker
                  //     value={formData.dateOfBirth}
                  //     onChange={handleDateChange}
                  //     format="MM/dd/yyyy"
                  //     placeholder="Select Date of Birth"
                  //     style={{ width: "100%" }}
                  //     shouldDisableDate={(date) => date && date > new Date()}
                  //     cleanable
                  //     editable={false}
                  //     container={() => document.body}   // portal outside the clipping overflow container
                  //     menuStyle={{ zIndex: 9999999999999998 }} // must exceed modal's 99999999
                  //   />
                  // )} */}
                {formData.dateOfBirth && (
                  <small
                    className="mt-1 block text-[11px] text-[#321961] font-semibold"
                  >
                    Age: {calculateAge(formData.dateOfBirth)} years
                  </small>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="flex flex-col mb-2">
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Gender
                </label>
                <select
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13.5px] outline-none bg-white transition-colors focus:border-[#321961] focus:ring-1 focus:ring-[#321961]"
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

              <div className="flex flex-col mb-2">
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Referred By Doctor
                </label>
                <Select
                  name="referedByDoctor"
                  value={(() => {
                    if (!formData.referedByDoctor) return null;
                    if (formData.referedByDoctor === "self_referral") {
                      return { value: "self_referral", label: "Self Referral" };
                    }
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
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  menuPosition="fixed"
                  styles={{
                    control: (baseStyles, state) => ({
                      ...baseStyles,
                      borderColor: state.isFocused ? "#321961" : "#ccc",
                      boxShadow: state.isFocused
                        ? "0 0 0 1px #321961"
                        : "none",
                      "&:hover": { borderColor: "#321961" },
                      fontSize: "13.5px",
                      borderRadius: "20px !important"
                    }),
                    menu: (baseStyles) => ({
                      ...baseStyles,
                      zIndex: 9999999999,
                      maxHeight: "150px",
                    }),
                    menuList: (baseStyles) => ({
                      ...baseStyles,
                      maxHeight: "150px",
                    }),
                    menuPortal: (baseStyles) => ({
                      ...baseStyles,
                      zIndex: 9999999999,
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
              <div className="flex flex-col mb-2">
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Mobile
                </label>
                <input
                  type="tel"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13.5px] outline-none transition-colors focus:border-[#321961] focus:ring-1 focus:ring-[#321961]"
                  placeholder="Enter 10-digit Mobile Number"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleInputChange}
                  maxLength="10"
                  pattern="[0-9]{10}"
                  title="Mobile number must be exactly 10 digits"
                  required
                />
                {formData.mobile && formData.mobile.length > 0 && formData.mobile.length < 10 && (
                  <small className="text-red-500 mt-1 block text-[11px]">
                    Mobile number must be exactly 10 digits
                  </small>
                )}
              </div>

              <div className="flex flex-col mb-2">
                <label
                  className="block text-xs font-semibold text-slate-600 mb-1.5"
                >
                  Relationship
                </label>
                <select
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[13.5px] outline-none bg-white transition-colors focus:border-[#321961] focus:ring-1 focus:ring-[#321961]"
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

            <div className="w-full mb-3">
              <label
                className="block text-xs font-semibold text-slate-600 mb-1.5"
              >
                Location
              </label>
              <div className="relative">
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
                      className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-[13.5px] outline-none transition-colors focus:border-[#321961] focus:ring-1 focus:ring-[#321961]"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="Search by city, state, pincode, or area..."
                      required
                      autoComplete="off"
                    />
                  </Autocomplete>
                ) : (
                  <input
                    type="text"
                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-[13.5px] outline-none bg-slate-100 cursor-not-allowed"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="City / Location"
                    required
                    disabled
                  />
                )}
                <i className="fas fa-map-marker-alt absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setIsAddingFamilyMember(false)}
                className="px-6 py-2 !text-sm !font-medium !rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 !text-sm !font-medium !rounded-full !bg-[#321961] hover:bg-[#6f42c1] text-white border-none transition-colors"
              >
                {isSubmitting ? "Adding..." : "Add Profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </BaseModal>
  );

  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : null;
};

export default FamilyMemberSelectionModal;
