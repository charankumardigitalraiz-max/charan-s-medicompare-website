import React, { useState, useEffect } from "react";
import { axiosUserInstance, imgUrl } from "../../../Apiservice";
import { toast } from "react-hot-toast";
import { useResponsive } from "../../../hooks/useResponsive";
import { DatePicker } from 'rsuite';

const Profile = ({ HomeNavigate, BackButton }) => {
  const [profiles, setProfile] = useState({});
  const [originalProfiles, setOriginalProfiles] = useState({});
  const [file, setFile] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dateOfBirthInput, setDateOfBirthInput] = useState(null);
  const [ageError, setAgeError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [showOtpModal, setShowOtpModal] = useState(false);
  const { isMobile } = useResponsive();

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : -1;
  };

  const isAdult = (dateOfBirth) => {
    const age = calculateAge(dateOfBirth);
    return age >= 18;
  };

  const calculateApproximateDateFromAge = (age) => {
    if (!age) return "";
    const today = new Date();
    const birthYear = today.getFullYear() - parseInt(age);
    const approximateDate = new Date(birthYear, 0, 1);
    return approximateDate.toISOString().split('T')[0];
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const token = localStorage.getItem("medicomparestoken");
    try {
      const res = await axiosUserInstance.get("profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res?.data?.data?.user || {};
      if (userData.files && userData.files.length > 0) {
        userData.image = userData.files[0];
      }
      setProfile(userData);
      setOriginalProfiles(JSON.parse(JSON.stringify(userData)));
      if (userData.age) {
        const approxDate = calculateApproximateDateFromAge(userData.age);
        setDateOfBirthInput(new Date(approxDate));
      } else {
        setDateOfBirthInput(null);
      }
    } catch (err) {
      // Profile fetch error
    }
  };

  const handleProfiles = (e) => {
    setProfile({ ...profiles, [e.target.name]: e.target.value });
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setProfile({ ...profiles, phone: value });
  };

  const handleDateOfBirthChange = (date) => {
    setDateOfBirthInput(date);

    if (date) {
      const calculatedAge = calculateAge(date);

      if (calculatedAge < 18) {
        setAgeError("You must be at least 18 years old.");
        setProfile({ ...profiles, age: "" });
      } else {
        setAgeError("");
        setProfile({ ...profiles, age: calculatedAge.toString() });
      }
    } else {
      setAgeError("");
      setProfile({ ...profiles, age: "" });
    }
  };

  const handleSendOtp = async () => {
    setIsSendingOtp(true);
    setOtpError("");
    const token = localStorage.getItem("medicomparestoken");
    try {
      const res = await axiosUserInstance.post("profile/verify-email/send-otp", { email: profiles.email }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res?.data?.success) {
        toast.success("OTP sent to your email successfully!");
        setOtpSent(true);
        setShowOtpModal(true);
      } else {
        const errorMsg = res?.data?.message || "Failed to send OTP. Please try again.";
        setOtpError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Error sending OTP.";
      setOtpError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setOtpError("Please enter OTP.");
      return;
    }
    setIsVerifyingOtp(true);
    setOtpError("");
    const token = localStorage.getItem("medicomparestoken");
    try {
      const res = await axiosUserInstance.post("profile/verify-email/verify-otp", { email: profiles.email, otp }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res?.data?.success) {
        toast.success("Email verified successfully!");
        setOtpSent(false);
        setShowOtpModal(false);
        setOtp("");
        fetchProfile(); // Refresh profile state to update verify status
      } else {
        const errorMsg = res?.data?.message || "Invalid OTP. Please try again.";
        setOtpError(errorMsg);
        toast.error(errorMsg);
      }
    } catch (err) {
      const errorMsg = err?.response?.data?.message || err?.message || "Error verifying OTP.";
      setOtpError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleSubmitProfile = async (e) => {
    e.preventDefault();
    if (dateOfBirthInput && !isAdult(dateOfBirthInput)) {
      toast.error("You must be at least 18 years old.");
      return;
    }

    const token = localStorage.getItem("medicomparestoken");

    const dataArray = new FormData();
    dataArray.append("last_name", profiles.last_name);
    dataArray.append("first_name", profiles.first_name);
    dataArray.append("email", profiles.email);
    dataArray.append("phone", profiles.phone);
    dataArray.append("gender", profiles.gender);
    dataArray.append("age", profiles.age);
    dataArray.append("medical_conditions", profiles.medical_conditions);

    try {
      await axiosUserInstance.post("profile/update", dataArray, {
        headers: { Authorization: `Bearer ${token}` },
      });

      toast.success("Profile updated successfully!");
      const currentDateInput = dateOfBirthInput;
      await fetchProfile();
      if (currentDateInput) {
        setDateOfBirthInput(currentDateInput);
      }
      setIsEditMode(false);
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleEditClick = () => {
    if (!dateOfBirthInput && profiles.age) {
      const approxDate = calculateApproximateDateFromAge(profiles.age);
      setDateOfBirthInput(new Date(approxDate));
    }
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setProfile(JSON.parse(JSON.stringify(originalProfiles)));
    setFile(null);
    setAgeError("");
    if (originalProfiles.age) {
      const approxDate = calculateApproximateDateFromAge(originalProfiles.age);
      setDateOfBirthInput(new Date(approxDate));
    } else {
      setDateOfBirthInput(null);
    }
    setIsEditMode(false);
  };

  // Shared row classes for the view-mode detail rows (keeps the same isMobile-driven mechanism)
  const rowWrapClass = `flex gap-2 py-3 px-4 text-[15px] text-slate-800 ${isMobile ? "flex-col items-start" : "flex-row items-center"
    }`;
  const rowLabelClass = `font-semibold text-slate-600 flex items-center gap-1.5 ${isMobile ? "w-full" : "min-w-[140px]"
    }`;
  const rowValueClass = `flex-1 ${isMobile ? "w-full" : "w-auto"}`;

  return (
    <>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
        <div className="flex items-center gap-3.5">
          {HomeNavigate && <HomeNavigate />}
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#321961] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
            <i className="fa-solid fa-user-gear" />
          </div>


          {/* <div className="flex flex-col gap-1">
            <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
              Profile Details
            </div>
            <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
              Update your personal information and preferences
            </p>
          </div> */}


          <div className="flex flex-col gap-1">
            <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
              Profile Details
            </div>
            <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
              Update your personal information and preferences
            </div>
          </div>
        </div>
      </div>

      {!isEditMode ? (
        /* View Mode - Profile Details Display */
        <div className="bg-white rounded-xl p-[30px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] mb-[30px]">
          {/* Edit Button */}
          <div className="mb-[25px] flex justify-end">
            <button
              type="button"
              onClick={handleEditClick}
              className="bg-[#321961] hover:bg-[#6b1fe6] text-white border-none py-2.5 px-6 !rounded-lg !text-sm !font-semibold inline-flex items-center gap-2 cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(125,46,255,0.3)] hover:shadow-[0_6px_20px_rgba(125,46,255,0.4)] hover:-translate-y-0.5"
            >
              <i className="fa-solid fa-pen"></i>
              Edit Profile
            </button>
          </div>

          {/* Profile Details Display */}
          <div className="row">

            <div className="col-12 mb-3">
              <div className={rowWrapClass}>
                <span className={rowLabelClass}>
                  <i className="fa-solid fa-user text-[12px] text-[#321961]"></i>
                  Customer ID:
                </span>
                <span className={rowValueClass}>
                  {profiles.custId || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className={rowWrapClass}>
                <span className={rowLabelClass}>
                  <i className="fa-solid fa-user text-[12px] text-[#321961]"></i>
                  First Name:
                </span>
                <span className={rowValueClass}>
                  {profiles.first_name || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className={rowWrapClass}>
                <span className={rowLabelClass}>
                  <i className="fa-solid fa-user text-[12px] text-[#321961]"></i>
                  Last Name:
                </span>
                <span className={rowValueClass}>
                  {profiles.last_name || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className={rowWrapClass}>
                <span className={rowLabelClass}>
                  <i className="fa-solid fa-phone text-[12px] text-[#321961]"></i>
                  Mobile Number:
                </span>
                <span
                  className={`flex-1 flex gap-2.5 ${isMobile ? "flex-col items-start w-full" : "flex-row items-center w-auto"
                    }`}
                >
                  <span>
                    {profiles.phone || <span className="text-slate-400 italic">Not provided</span>}
                  </span>
                  {/* {profiles.phone && (
                    <span className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${
                      profiles.mobile_verified === true ? "bg-[rgba(40,167,69,0.1)] text-green-600" : "bg-[rgba(220,53,69,0.1)] text-red-600"
                    }`}>
                      <i className={`fa-solid ${profiles.mobile_verified === true ? "fa-check-circle" : "fa-times-circle"} text-[10px]`}></i>
                      {profiles.mobile_verified === true ? "Verified" : "Unverified"}
                    </span>
                  )} */}
                </span>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className={rowWrapClass}>
                <span className={rowLabelClass}>
                  <i className="fa-solid fa-envelope text-[12px] text-[#321961]"></i>
                  Email:
                </span>
                <span
                  className={`flex-1 flex gap-2.5 overflow-hidden ${isMobile ? "flex-col items-start w-full" : "flex-row items-center w-auto"
                    }`}
                >
                  <span className={`overflow-hidden text-ellipsis whitespace-nowrap min-w-0 ${isMobile ? "w-full" : "w-auto"}`}>
                    {profiles.email || <span className="text-slate-400 italic">Not provided</span>}
                  </span>
                  {profiles.email && (
                    <span
                      className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 ${profiles.email_verified === true
                        ? "bg-[rgba(40,167,69,0.1)] text-green-600"
                        : "bg-[rgba(220,53,69,0.1)] text-red-600"
                        }`}
                    >
                      <i className={`fa-solid ${profiles.email_verified === true ? "fa-check-circle" : "fa-times-circle"} text-[10px]`}></i>
                      {profiles.email_verified === true ? "Verified" : "Unverified"}
                    </span>
                  )}
                  {profiles.email && profiles.email_verified === false && (
                    <button
                      type="button"
                      className={`btn btn-primary btn-sm shrink-0 whitespace-nowrap py-1.5 px-3.5 text-[13px] font-medium ${isMobile ? "self-start" : "self-auto"
                        }`}
                      onClick={handleSendOtp}
                      disabled={isSendingOtp}
                    >
                      {isSendingOtp ? "Sending OTP..." : "Verify Email"}
                    </button>
                  )}
                </span>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className={rowWrapClass}>
                <span className={rowLabelClass}>
                  <i className="fa-solid fa-venus-mars text-[12px] text-[#321961]"></i>
                  Gender:
                </span>
                <span className={`${rowValueClass} capitalize`}>
                  {profiles.gender || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className={rowWrapClass}>
                <span className={rowLabelClass}>
                  <i className="fa-solid fa-cake-candles text-[12px] text-[#321961]"></i>
                  Age:
                </span>
                <span className={rowValueClass}>
                  {profiles.age || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

            <div className="col-12 mb-3">
              <div className={`flex gap-2 py-3 px-4 text-[15px] text-slate-800 ${isMobile ? "flex-col items-start" : "flex-row items-start"}`}>
                <span className={`${rowLabelClass} pt-0.5`}>
                  <i className="fa-solid fa-file-medical text-[12px] text-[#321961]"></i>
                  Medical Conditions:
                </span>
                <span className={`${rowValueClass} whitespace-pre-wrap break-words`}>
                  {profiles.medical_conditions || <span className="text-slate-400 italic">Not provided</span>}
                </span>
              </div>
            </div>

          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitProfile}>
          <div className="bg-white rounded-xl p-[30px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] mb-[30px]">
            <div className="row">
              <div className="col-lg-4 col-md-6 mb-4">
                <div className="form-wrap">
                  <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-user text-[12px] text-[#321961]"></i>
                    First Name
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-lg border border-slate-200 py-3 px-[15px] text-sm transition-all duration-300 focus:border-[#321961] outline-none"
                    name="first_name"
                    value={profiles.first_name || ""}
                    onChange={handleProfiles}
                  />
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="form-wrap">
                  <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-user text-[12px] text-[#321961]"></i>
                    Last Name
                  </label>
                  <input
                    type="text"
                    className="form-control rounded-lg border border-slate-200 py-3 px-[15px] text-sm transition-all duration-300 focus:border-[#321961] outline-none"
                    name="last_name"
                    value={profiles.last_name || ""}
                    onChange={handleProfiles}
                  />
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="form-wrap">
                  <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-phone text-[12px] text-[#321961]"></i>
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    className={`form-control rounded-lg border border-slate-200 py-3 px-[15px] text-sm transition-all duration-300 outline-none ${profiles.mobile_verified === true
                      ? "bg-slate-100 cursor-not-allowed opacity-70"
                      : "bg-white cursor-text focus:border-[#321961]"
                      }`}
                    name="phone"
                    value={profiles.phone || ""}
                    onChange={handlePhoneChange}
                    onKeyPress={(e) => {
                      // Prevent non-numeric characters from being typed
                      if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight' && e.key !== 'Tab') {
                        e.preventDefault();
                      }
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    disabled={profiles.mobile_verified === true}
                  />
                  {profiles.mobile_verified === true && (
                    <div className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                      <i className="fa-solid fa-lock text-[10px]"></i>
                      Mobile number is verified and cannot be edited
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="form-wrap">
                  <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-envelope text-[12px] text-[#321961]"></i>
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control rounded-lg border border-slate-200 py-3 px-[15px] text-sm transition-all duration-300 focus:border-[#321961] outline-none"
                    name="email"
                    value={profiles.email || ""}
                    onChange={handleProfiles}
                  />
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="form-wrap">
                  <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-venus-mars text-[12px] text-[#321961]"></i>
                    Gender
                  </label>
                  <select
                    className="form-control rounded-lg border border-slate-200 py-3 px-[15px] text-sm bg-white transition-all duration-300 appearance-none focus:border-[#321961] outline-none bg-no-repeat"
                    name="gender"
                    value={profiles.gender || ""}
                    onChange={handleProfiles}
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%237d2eff' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 15px center",
                      backgroundSize: "16px 12px",
                    }}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="col-lg-4 col-md-6 mb-4">
                <div className="form-wrap">
                  <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-calendar-days text-[12px] text-[#321961]"></i>
                    Date of Birth
                  </label>
                  <DatePicker
                    value={dateOfBirthInput}
                    onChange={handleDateOfBirthChange}
                    format="MM/dd/yyyy"
                    placeholder="Select Date of Birth"
                    style={{ width: '100%' }}
                    disabledDate={(date) => date && date > new Date()}
                    cleanable
                  />
                  {profiles.age && (
                    <div className="mt-1.5 text-xs text-[#321961] flex items-center gap-1 font-medium">
                      <i className="fa-solid fa-cake-candles text-[10px]"></i>
                      Age: {profiles.age} years
                    </div>
                  )}
                  {ageError && (
                    <div className="mt-1.5 text-[10px] text-red-600 flex items-center gap-1 font-medium">
                      <i className="fa-solid fa-exclamation-triangle text-[10px]"></i>
                      {ageError}
                    </div>
                  )}
                </div>
              </div>

              <div className="col-lg-12 mb-4">
                <div className="form-wrap">
                  <label className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                    <i className="fa-solid fa-file-medical text-[12px] text-[#321961]"></i>
                    Medical Conditions / Diseases
                  </label>
                  <textarea
                    className="form-control rounded-lg border border-slate-200 py-3 px-[15px] text-sm resize-y min-h-[100px] transition-all duration-300 focus:border-[#321961] outline-none"
                    name="medical_conditions"
                    value={profiles.medical_conditions || ""}
                    onChange={handleProfiles}
                    placeholder="Enter your medical conditions or diseases"
                    rows="4"
                  />
                  <div className="mt-2 text-xs text-slate-400">
                    <i className="fa-solid fa-lightbulb me-1"></i>
                    Please list any chronic conditions, allergies, or ongoing treatments
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button Section */}
          <div className="flex justify-end gap-[15px] text-end">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 py-2 px-[30px] !rounded-md !text-base !font-semibold inline-flex items-center gap-2 cursor-pointer transition-all duration-300"
            >
              <i className="fas fa-times"></i>
              Cancel
            </button>
            <button
              type="submit"
              className="bg-[#321961] hover:bg-[#6b1fe6] text-white border-none py-2.5 px-6 !rounded-lg !text-sm !font-semibold inline-flex items-center gap-2 cursor-pointer transition-all duration-300 shadow-[0_4px_15px_rgba(125,46,255,0.3)] hover:shadow-[0_6px_20px_rgba(125,46,255,0.4)] hover:-translate-y-0.5"
            >
              <i className="fas fa-check-circle"></i>
              Update Profile
            </button>
          </div>
        </form>
      )}

      {showOtpModal && (
        <div
          onClick={() => {
            setShowOtpModal(false);
            setOtp("");
            setOtpError("");
          }}
          className="fixed inset-0 bg-[rgba(15,23,42,0.55)] backdrop-blur-[6px] z-[999999999] flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] bg-white rounded-[20px] p-6 shadow-[0_24px_60px_rgba(15,23,42,0.16)] flex flex-col gap-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-800 m-0">
                Email Verification
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowOtpModal(false);
                  setOtp("");
                  setOtpError("");
                }}
                className="bg-[#f5f3ff] border-none rounded-full w-7 h-7 flex items-center justify-center cursor-pointer text-[#321961] text-base"
              >
                &times;
              </button>
            </div>

            <p className="text-[13px] text-slate-500 m-0">
              We have sent a verification code to <strong>{profiles.email}</strong>. Please enter the OTP below.
            </p>

            <div className="flex flex-col gap-1.5">
              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-control h-11 text-sm py-2.5 px-4 rounded-[10px] border border-[#e2e0f0]"
              />
              {otpError && (
                <span className="text-xs text-red-600 mt-0.5">
                  {otpError}
                </span>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary h-11 rounded-[10px] font-semibold text-sm bg-[#321961] border-none text-white"
              onClick={handleVerifyOtp}
              disabled={isVerifyingOtp}
            >
              {isVerifyingOtp ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="flex justify-center gap-1 text-[13px]">
              <span className="text-slate-500">Didn't receive code?</span>
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp}
                className="bg-transparent border-none p-0 text-[#321961] font-semibold cursor-pointer"
              >
                {isSendingOtp ? "Sending..." : "Resend OTP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Profile;