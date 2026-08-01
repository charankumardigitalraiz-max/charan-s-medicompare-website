import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import BaseModal from "../../../components/ui/BaseModal";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { useResponsive } from "../../../hooks/useResponsive";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";
import CustomDatePicker from "../../../components/ui/CustomDatePicker";
import Select from "react-select";
import toast from "react-hot-toast";
import Pagination from "../../../components/ui/Pagination.jsx";

const libraries = ["places"];

const FamilyMembers = ({ HomeNavigate, BackButton }) => {
  const { isMobile } = useResponsive();
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);
  const [doctorSearchTerm, setDoctorSearchTerm] = useState("");
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [membersPerPage, setMembersPerPage] = useState(4);
  const [totalMembers, setTotalMembers] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [memberSearchTerm, setMemberSearchTerm] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
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

  const [ageError, setAgeError] = useState("");
  const [locationData, setLocationData] = useState({
    address: "",
    lat: null,
    lng: null,
  });

  const autocompleteRef = useRef(null);

  const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  const token = localStorage.getItem("medicomparestoken");

  const headers = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };

  const fetchFamilyMembers = async (
    page = currentPage,
    limit = membersPerPage,
    search = memberSearchTerm,
  ) => {
    try {
      setIsLoadingMembers(true);
      const token = localStorage.getItem("medicomparestoken");
      const url = `family-member/list?page=${page}&limit=${limit}&search=${encodeURIComponent(search || "")}`;
      const response = await axiosUserInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const rawData = response.data?.data;
      const members = Array.isArray(rawData)
        ? rawData
        : rawData?.members || rawData?.list || [];

      const pagination = response.data?.pagination || response.data?.data?.pagination || {};

      let total = pagination.total;
      let calculatedTotalPages = pagination.totalPages;

      if (total === undefined || total === null) {
        if (page === 1 && members.length < limit) {
          total = members.length;
        } else {
          total = (page - 1) * limit + members.length + (members.length === limit ? 1 : 0);
        }
        calculatedTotalPages = Math.ceil(total / limit) || 1;
      }

      setFamilyMembers(members);
      setTotalMembers(total);
      setTotalPages(calculatedTotalPages);
      if (pagination.page) {
        setCurrentPage(pagination.page);
      }
    } catch (error) {
      setFamilyMembers([]);
      setTotalMembers(0);
      setTotalPages(1);
    } finally {
      setIsLoadingMembers(false);
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
        setIsLoadingDoctors(false);
        return;
      }

      const url = searchTerm
        ? `doctors/list?search=${encodeURIComponent(searchTerm)}`
        : "doctors/list";

      const response = await axiosCommonInstance.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

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
      toast.error("Error fetching doctors:", error);
      setDoctors([]);
      setAllDoctors([]);
      setFilteredDoctors([]);
    } finally {
      setIsLoadingDoctors(false);
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

  useEffect(() => {
    fetchFamilyMembers(currentPage, membersPerPage, memberSearchTerm);
  }, [currentPage, membersPerPage, memberSearchTerm]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const paginate = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const handleSearchChange = (e) => {
    setMemberSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleLimitChange = (e) => {
    const newLimit = Number(e.target.value);
    setMembersPerPage(newLimit);
    setCurrentPage(1);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this family member?")) {
      try {
        await axiosUserInstance.post(`family-member/delete/${id}`, {}, headers);
        fetchFamilyMembers(currentPage, membersPerPage, memberSearchTerm);
      } catch (error) { }
    }
  };

  const handleEdit = (member) => {
    setIsEditMode(true);
    setEditingId(member._id);
    setAgeError("");

    setFormData({
      name: member.name,
      gender: member.gender,
      age: calculateAge(member.dateOfBirth).toString(),
      dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
      mobile: member.mobile,
      location: member.address || "",
      referedByDoctor: member.referedByDoctor || member.doctorDetails?._id || "",
      relationship: member.relationship,
    });

    setLocationData({
      address: member.address || "",
      lat: member.location?.coordinates?.[1] || null,
      lng: member.location?.coordinates?.[0] || null,
    });

    setShowModal(true);
  };

  const handleAdd = () => {
    setIsEditMode(false);
    setEditingId(null);
    setAgeError("");

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

    setLocationData({
      address: "",
      lat: null,
      lng: null,
    });

    setShowModal(true);
  };

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.dateOfBirth) {
      const age = calculateAge(formData.dateOfBirth);
      if (age === 0) {
        if (window.toast) {
          window.toast.error("Age cannot be 0 years");
        } else {
          alert("Age cannot be 0 years");
        }
        return;
      }
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

    try {
      if (isEditMode && editingId) {
        await axiosUserInstance.post(
          `family-member/update/${editingId}`,
          payload,
          headers,
        );
      } else {
        await axiosUserInstance.post("family-member/create", payload, headers);
      }
      fetchFamilyMembers(currentPage, membersPerPage, memberSearchTerm);
      setShowModal(false);
      setAgeError("");
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

      setLocationData({
        address: "",
        lat: null,
        lng: null,
      });
    } catch (error) { }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setAgeError("");
  };

  const getDoctorNameById = (doctorId) => {
    if (!doctorId) return "N/A";
    const doctor = doctors.find((doc) => doc._id === doctorId);
    if (doctor) return doctor.name;

    const doctorByName = doctors.find((doc) => doc.name === doctorId);
    if (doctorByName) return doctorByName.name;

    const memberWithDoctor = familyMembers.find(
      (member) => member.doctorDetails && member.doctorDetails._id === doctorId,
    );

    if (memberWithDoctor && memberWithDoctor.doctorDetails) {
      return memberWithDoctor.doctorDetails.name;
    }
    return doctorId;
  };

  const calculateAge = (dateOfBirth) => {
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
        if (window.toast) {
          window.toast.error("Age cannot be 0 years");
        } else {
          alert("Age cannot be 0 years");
        }
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

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();

      if (place?.formatted_address) {
        const locationData = {
          address: place.formatted_address,
          lat: place.geometry?.location?.lat() || null,
          lng: place.geometry?.location?.lng() || null,
        };

        setLocationData(locationData);

        setFormData((prev) => ({
          ...prev,
          location: place.formatted_address,
        }));
      }
    }
  };

  const getRandomColor = () => {
    return "#" + Math.floor(Math.random() * 16777215).toString(16);
  };

  const getPaginationRange = () => {
    const delta = 1;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div className="w-full">
      <div className="w-full">
        {BackButton && (
          <div className="w-full mb-3">
            <BackButton />
          </div>
        )}

        {/* Header Section - Matches Transactions component style */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 mb-3 border-b border-slate-100 mt-2">
          <div className="flex items-center gap-3.5">
            {HomeNavigate && <HomeNavigate />}
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
              <i className="fa-solid fa-users" />
            </div>


            {/* <div className="flex flex-col gap-1">
              <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
                Manage Family Members
              </div>
              <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                Manage and track all your family members' details
              </p>
            </div> */}


            <div className="flex flex-col gap-1">
              <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
                Manage Family Members
              </div>
              <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
                Manage and track all your family members' details
              </div>
            </div>


          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-[220px] shrink-0">
              <input
                type="text"
                placeholder="Search family member..."
                value={memberSearchTerm}
                onChange={handleSearchChange}
                className="h-[38px] rounded-lg border border-slate-200 pl-9 pr-3 text-[13px] w-full outline-none bg-slate-50 hover:bg-white hover:border-[#8059ca] focus:bg-white focus:border-[#8059ca] transition-all duration-200"
              />
              <span className="absolute left-[12px] top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[13px]">
                <i className="fa-solid fa-search" />
              </span>
            </div>
            <button
              className="h-[38px] inline-flex items-center justify-center gap-1.5 whitespace-nowrap bg-[#8059ca] hover:bg-[#6a4ab0] text-white px-4 py-2 !rounded-md text-sm font-medium transition-all duration-200"
              onClick={handleAdd}
            >
              <i className="fa-solid fa-plus" />
              <span>Add Family Member</span>
            </button>
          </div>
        </div>

        {/* Family Members List */}
        {isLoadingMembers ? (
          <div className="text-center py-10 flex justify-center items-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-[#8059ca] border-t-transparent rounded-full" role="status">
              <span className="sr-only">Loading family members...</span>
            </div>
          </div>
        ) : familyMembers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {familyMembers.map((member) => (
                <div className="w-full" key={member._id}>
                  <div className="p-3 border border-slate-100 rounded-md bg-white shadow-sm hover:shadow-md flex flex-col justify-between gap-4 h-full transition-all duration-200 ease-in-out">
                    {/* Card Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#f3e8ff] text-[#8059ca] flex items-center justify-center text-base font-semibold shrink-0">
                          {member?.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div className="min-w-0">
                          <span className="text-sm font-semibold text-slate-800 block capitalize truncate">
                            {member.name}
                          </span>
                          <span className="text-[11px] text-[#8059ca] font-semibold uppercase tracking-wide">
                            {member.relationship}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-1.5 shrink-0">
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition-colors"
                          onClick={() => handleEdit(member)}
                          title="Edit"
                        >
                          <i className="fa-solid fa-pen text-slate-500 text-xs" />
                        </button>
                        <button
                          type="button"
                          className="w-8 h-8 rounded-full border border-slate-200 hover:border-red-200 flex items-center justify-center hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(member._id)}
                          title="Delete"
                        >
                          <i className="fa-solid fa-trash text-red-500 text-xs" />
                        </button>
                      </div>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-4 gap-x-3 gap-y-3 pt-3 border-t border-dashed border-slate-200">
                      <div className="col-span-1">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Gender</span>
                        <span className="text-[13px] font-medium text-slate-700">{member.gender || "N/A"}</span>
                      </div>

                      <div className="col-span-1">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Age</span>
                        <span className="text-[13px] font-medium text-slate-700">
                          {member.dateOfBirth ? `${calculateAge(member.dateOfBirth)} Yrs` : "N/A"}
                        </span>
                      </div>

                      <div className="col-span-2 min-w-0">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Mobile</span>
                        <span className="text-[13px] font-medium text-slate-700 truncate block" title={member.mobile}>
                          {member.mobile || "N/A"}
                        </span>
                      </div>

                      <div className="col-span-4 min-w-0">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Referred Doctor</span>
                        <span
                          className="text-[13px] font-medium text-slate-700 block truncate"
                          title={member.doctorDetails?.name || getDoctorNameById(member.referedByDoctor)}
                        >
                          {member.doctorDetails?.name
                            ? `${member.doctorDetails.name}${member.doctorDetails["AreaOfPractice "] ? ` (${member.doctorDetails["AreaOfPractice "]})` : ""}${member.doctorDetails.place ? `, ${member.doctorDetails.place}` : ""}`
                            : getDoctorNameById(member.referedByDoctor) || "N/A"}
                        </span>
                      </div>

                      <div className="col-span-4 min-w-0">
                        <span className="text-[11px] text-slate-500 block mb-0.5">Location</span>
                        <span className="text-[13px] font-medium text-slate-700 block truncate" title={member.address}>
                          {member.address || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={currentPage} totalPages={totalPages} onPageChange={paginate} />

            {/* Per page selector */}
            <div className="flex justify-center items-center gap-3 mt-3">
              <span className="text-slate-500 text-sm">
                Showing {totalMembers > 0 ? (currentPage - 1) * membersPerPage + 1 : 0} - {Math.min(currentPage * membersPerPage, totalMembers)} of {totalMembers} members
              </span>
              <div className="flex items-center gap-1">
                <label className="text-sm text-slate-600 mb-0">Per page:</label>
                <select
                  className="form-select form-select-sm w-[70px] rounded-md text-sm cursor-pointer border border-slate-200 px-2 py-1"
                  value={membersPerPage}
                  onChange={handleLimitChange}
                >
                  <option value={4}>4</option>
                  <option value={8}>8</option>
                  <option value={12}>12</option>
                  <option value={20}>20</option>
                </select>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-5 bg-white rounded-lg border text-slate-500">
            <i className="fa-solid fa-users fa-2x mb-3 text-slate-400" />
            <p className="mb-0 text-[14px] font-medium">
              {memberSearchTerm
                ? "No family members found matching your search."
                : "No family members found. Add your first family member!"}
            </p>
          </div>
        )}
      </div>

      {/* Modal */}
      {typeof document !== "undefined" && createPortal(
        <BaseModal
          show={showModal}
          onClose={handleCloseModal}
          title={isEditMode ? "Edit Family Member" : "Add New Family Member"}
          size="md"
          className="max-w-md mx-auto"
          bodyClassName="!p-6"
        >
          <div id="family-member-modal-body" className="relative overflow-visible">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent"
                    name="name"
                    placeholder="Enter Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="mb-2 relative z-[9999999999]">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
                  {/* <CustomDatePicker
                    value={formData.dateOfBirth}
                    onChange={handleDateChange}
                    format="MM/dd/yyyy"
                    placeholder="Select Date of Birth"
                    className="w-full"
                    shouldDisableDate={(date) => date && date > new Date()}
                    cleanable
                    editable={false}
                    container={() => document.getElementById("family-member-modal-body") || document.body}
                  /> */}
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
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8059ca]"
                    style={{
                      position: "relative",
                      zIndex: 9999999999998,
                    }}
                  />
                  {formData.dateOfBirth && (
                    <small className="mt-2 mb-0 text-primary block">
                      Age: {calculateAge(formData.dateOfBirth)} years
                    </small>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent"
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

                <div className="mb-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Referred By Doctor</label>
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

                      if (!selectedDoctor && editingId) {
                        const editingMember = familyMembers.find(
                          (m) => String(m._id) === String(editingId)
                        );
                        if (
                          editingMember &&
                          editingMember.doctorDetails &&
                          String(editingMember.doctorDetails._id) === doctorId
                        ) {
                          selectedDoctor = editingMember.doctorDetails;
                        }
                      }

                      if (
                        selectedDoctor &&
                        selectedDoctor.name &&
                        typeof selectedDoctor.name === "string"
                      ) {
                        return {
                          value: String(selectedDoctor._id),
                          label: `${selectedDoctor.name}${selectedDoctor["AreaOfPractice "] ? ` (${selectedDoctor["AreaOfPractice "]})` : ""}${selectedDoctor.place ? `, ${selectedDoctor.place}` : ""}`,
                        };
                      }

                      return null;
                    })()}
                    onChange={handleDoctorSelect}
                    onInputChange={handleDoctorSearch}
                    options={filteredDoctors
                      .filter(
                        (doctor) =>
                          doctor &&
                          doctor._id &&
                          doctor.name &&
                          typeof doctor.name === "string",
                      )
                      .map((doctor) => ({
                        value: String(doctor._id),
                        label: `${doctor.name}${doctor["AreaOfPractice "] ? ` (${doctor["AreaOfPractice "]})` : ""}${doctor.place ? `, ${doctor.place}` : ""}`,
                      }))}
                    placeholder={
                      isLoadingDoctors
                        ? "Loading doctors..."
                        : "Select a doctor..."
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
                        borderColor: state.isFocused ? "#2684ff" : "#ccc",
                        boxShadow: state.isFocused
                          ? "0 0 0 1px #2684ff"
                          : "none",
                        "&:hover": {
                          borderColor: "#2684ff",
                        },
                        height: "38px",
                        minHeight: "38px",
                      }),
                      menu: (baseStyles) => ({
                        ...baseStyles,
                        zIndex: 9999999999,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }),
                      menuList: (baseStyles) => ({
                        ...baseStyles,
                        maxHeight: "200px",
                        overflowY: "auto",
                      }),
                      menuPortal: (baseStyles) => ({
                        ...baseStyles,
                        zIndex: 9999999999,
                      }),
                      option: (baseStyles) => ({
                        ...baseStyles,
                        padding: "8px 12px",
                        fontSize: "14px",
                      }),
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="mb-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Mobile</label>
                  <input
                    type="tel"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent"
                    placeholder="Enter Mobile Number"
                    name="mobile"
                    value={formData.mobile}
                    onChange={handleInputChange}
                    maxLength="10"
                    pattern="[0-9]{10}"
                    title="Mobile number must be exactly 10 digits"
                    required
                  />
                </div>

                <div className="mb-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Relationship</label>
                  <select
                    name="relationship"
                    value={formData.relationship}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent"
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

              <div className="mb-3">
                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
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
                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent pl-10"
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
                      className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8059ca] focus:border-transparent pl-10"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="City / Location"
                      required
                      disabled
                    />
                  )}
                  <i className="fas fa-location absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
                </div>
              </div>

              <div className="text-end mt-4">
                <button
                  type="submit"
                  className="bg-[#8059ca] hover:bg-[#6a4ab0] text-white px-6 py-2 !rounded-md !text-sm !font-medium !transition-all !duration-200"
                >
                  {isEditMode ? "Update" : "Add"} Profile
                </button>
              </div>
            </form>
          </div>
        </BaseModal>,
        document.body
      )}

    </div>
  );
};

export default FamilyMembers;