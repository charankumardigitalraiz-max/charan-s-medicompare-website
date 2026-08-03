import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosUserInstance } from "../../../Apiservice";
import { DatePicker } from "rsuite";
import { User, Mail, Phone, Calendar } from "react-feather";
import { handlePostLoginRedirect } from "../../../utils/redirectUtils";

const Register = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    first_name: "",
    email: null,
    phone: "",
    age: "",
    medical_condition: "",
    gender: "",
    referral: ""
  });
  const [loading, setLoading] = useState(false);
  const [dateOfBirthInput, setDateOfBirthInput] = useState(null);
  const [ageError, setAgeError] = useState("");

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return "";
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
    return age >= 0 ? age : -1;
  };

  const isAdult = (dateOfBirth) => {
    const age = calculateAge(dateOfBirth);
    return age >= 18;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateOfBirthChange = (date) => {
    setDateOfBirthInput(date);

    if (date) {
      const calculatedAge = calculateAge(date);

      if (calculatedAge < 18) {
        setAgeError("You must be at least 18 years.");
        setForm((prev) => ({ ...prev, age: "" }));
      } else {
        setAgeError("");
        setForm((prev) => ({ ...prev, age: calculatedAge.toString() }));
      }
    } else {
      setAgeError("");
      setForm((prev) => ({ ...prev, age: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!dateOfBirthInput) {
      toast.error("Please select your date of birth.");
      return;
    }

    if (!isAdult(dateOfBirthInput)) {
      toast.error("You must be at least 18 years old to register.");
      return;
    }

    setLoading(true);
    const bodyData = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      phone: localStorage.getItem("phone"),
      age: form.age,
      gender: form.gender,
      medical_condition: form.medical_condition,
      referral: sessionStorage.getItem("referral") || "",
    };
    try {
      const response = await axiosUserInstance.post("auth/register", bodyData);
      const data = response.data;
      localStorage.setItem("medicomparestoken", data.data.token);
      toast.success(data.message || "Registration successful!");
      setForm({
        first_name: "",
        email: "",
        age: "",
        gender: "",
        medical_condition: "",
      });
      setDateOfBirthInput(null);
      setAgeError("");
      sessionStorage.removeItem("referral")
      handlePostLoginRedirect(navigate, "/");

    } catch (error) {
      const message =
        error.response?.data?.message || "An error occurred. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const medicalConditions = [
    "Fever",
    "Cold & Cough",
    "Diabetes",
    "High Blood Pressure",
    "Asthma",
    "Heart Disease",
    "Thyroid Disorder",
    "Arthritis",
    "Back Pain",
    "Acidity / GERD",
    "Skin Allergy",
    "Dental Problem",
    "Pregnancy Care",
    "Post Surgery Care",
    "Elderly Care",
    "Other",
  ];

  return (
    <section className="w-full min-h-screen flex justify-center items-center p-5 box-border bg-white">
      <style>{`
        .date-picker-wrapper .rs-picker,
        .date-picker-wrapper .rs-picker *,
        .date-picker-wrapper .rs-picker-input-group1,
        .date-picker-wrapper .rs-picker-input-group1 *,
        .date-picker-wrapper .rs-input,
        .date-picker-wrapper .rs-input *,
        .date-picker-wrapper input {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          background: transparent !important;
        }
        .date-picker-wrapper .rs-input {
          font-size: 13px !important;
          color: #1d2939 !important;
          padding: 0 !important;
          height: 100% !important;
        }
        .date-picker-wrapper .rs-input::placeholder {
          color: #667085 !important;
        }
        .date-picker-wrapper .rs-input-group-addon {
          display: none !important;
        }
      `}</style>
      <div className="relative w-full max-w-[897px] min-h-[451px] h-auto bg-gradient-to-r from-[#4B22AA] via-[#341777] to-[#6941C6] rounded-[40px] shadow-[2px_4px_10px_0px_rgba(82,82,82,0.1),-1px_1px_4px_0px_rgba(0,0,0,0.24)] flex items-center overflow-hidden max-md:h-auto max-md:flex-col max-md:items-center max-md:p-2.5 max-md:max-w-full max-lg:h-auto max-lg:flex-col max-lg:items-center max-lg:pb-10 max-lg:max-w-[500px] py-6 md:py-0">
        <div className="relative w-[468px] min-h-[381px] h-auto bg-[#f9fafb] rounded-[12px] ml-[52px] my-auto px-[46px] pt-[30px] pb-[30px] flex flex-col z-10 shrink-0 max-md:my-5 max-md:mx-0 max-md:w-[95%] max-md:h-auto max-md:p-5 max-lg:my-[35px] max-lg:mx-0 max-lg:w-[90%] max-lg:h-auto">
          <header className="text-center mb-[20px]">
            <h1 className="!text-[22px] !font-semibold !text-[#344055] !m-0 !mb-1 !leading-normal max-md:text-[18px] max-md:font-bold">Add More Details</h1>
            <p className="text-[12px] text-[#667085] m-0">Create your account to access exclusive medical deals</p>
          </header>

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-[12px] mb-4 max-md:grid-cols-1">
              <div className="flex flex-col gap-[3px]">
                <div className="flex items-center border border-[#7c7e80] rounded-[8px] px-3 py-2 bg-[#f9fafb] h-9 transition-colors focus-within:border-[#512aac] relative">
                  <User className="text-[#667085] flex-shrink-0 min-w-[14px]" size={14} />
                  <input
                    type="text"
                    name="first_name"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={(e) => handleChange(e)}
                    className="border-none outline-none text-[13px] text-[#1d2939] w-full bg-transparent pl-2"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[3px]">
                <div className="flex items-center border border-[#7c7e80] rounded-[8px] px-3 py-2 bg-[#f9fafb] h-9 transition-colors focus-within:border-[#512aac] relative">
                  <User className="text-[#667085] flex-shrink-0 min-w-[14px]" size={14} />
                  <input
                    type="text"
                    name="last_name"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={(e) => handleChange(e)}
                    className="border-none outline-none text-[13px] text-[#1d2939] w-full bg-transparent pl-2"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[3px] col-span-2 max-md:col-span-1">
                <div className="flex items-center border border-[#7c7e80] rounded-[8px] px-3 py-2 bg-[#f9fafb] h-9 transition-colors focus-within:border-[#512aac] relative">
                  <Mail className="text-[#667085] flex-shrink-0 min-w-[14px]" size={14} />
                  <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange(e)}
                    className="border-none outline-none text-[13px] text-[#1d2939] w-full bg-transparent pl-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[3px]">
                <div className="flex items-center border border-[#7c7e80] rounded-[8px] px-3 py-2 bg-[#f9fafb] h-9 transition-colors focus-within:border-[#512aac] relative after:content-[''] after:absolute after:right-3 after:top-1/2 after:-translate-y-1/2 after:w-0 after:h-0 after:border-l-[4px] after:border-l-transparent after:border-r-[4px] after:border-r-transparent after:border-t-[4px] after:border-t-[#667085] after:pointer-events-none">
                  <select
                    name="gender"
                    value={form.gender}
                    onChange={(e) => handleChange(e)}
                    className="border-none outline-none text-[13px] text-[#1d2939] w-full bg-transparent pl-2 appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-[3px]">
                <div className="flex items-center border border-[#7c7e80] rounded-[8px] px-3 py-2 bg-[#f9fafb] h-9 transition-colors focus-within:border-[#512aac] relative">
                  <Phone className="text-[#667085] flex-shrink-0 min-w-[14px]" size={14} />
                  <input
                    type="text"
                    maxLength={10}
                    name="phone"
                    placeholder="Enter Mobile Number"
                    value={localStorage.getItem("phone")}
                    className="border-none outline-none text-[13px] text-[#1d2939] w-full bg-transparent pl-2"
                    readOnly
                  />
                </div>
              </div>

              <div className="flex flex-col gap-[3px]">
                <div className="flex items-center border border-[#7c7e80] rounded-[8px] px-3 py-2 bg-[#f9fafb] h-9 transition-colors focus-within:border-[#512aac] relative date-picker-wrapper">
                  <Calendar className="text-[#667085] flex-shrink-0 min-w-[14px] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" size={14} />
                  <DatePicker
                    value={dateOfBirthInput}
                    onChange={handleDateOfBirthChange}
                    format="MM/dd/yyyy"
                    placeholder="DOB"
                    style={{
                      width: "100%",
                      border: "none",
                      background: "transparent",
                    }}
                    disabledDate={(date) => date && date > new Date()}
                    cleanable
                    required
                  />
                </div>
                {form.age && (
                  <small className="text-muted mt-0.5 d-block text-[11px]">
                    Age: {form.age} years
                  </small>
                )}
                {ageError && (
                  <small className="text-danger mt-0.5 d-block text-[10px]">
                    {ageError}
                  </small>
                )}
              </div>

              <div className="flex flex-col gap-[3px]">
                <div className="flex items-center border border-[#7c7e80] rounded-[8px] px-3 py-2 bg-[#f9fafb] h-9 transition-colors focus-within:border-[#512aac] relative after:content-[''] after:absolute after:right-3 after:top-1/2 after:-translate-y-1/2 after:w-0 after:h-0 after:border-l-[4px] after:border-l-transparent after:border-r-[4px] after:border-r-transparent after:border-t-[4px] after:border-t-[#667085] after:pointer-events-none">
                  <select
                    name="medical_condition"
                    value={form.medical_condition}
                    onChange={handleChange}
                    className="border-none outline-none text-[13px] text-[#1d2939] w-full bg-transparent pl-2 appearance-none cursor-pointer"
                    required
                  >
                    <option value="">Medical Condition</option>
                    {medicalConditions.map((condition, index) => (
                      <option key={index} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-center mb-3">
              By creating an account, you agree to our{" "}
              <a
                href="/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-[#6941c6] no-underline font-semibold hover:underline"
              >
                Privacy Policy
              </a>{" "}
              &{" "}
              <a
                href="/policies/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] !text-[#6941c6] no-underline font-semibold hover:underline"
              >
                Terms and Conditions
              </a>
            </p>

            <button
              type="submit"
              className="w-full bg-[#6941c6] hover:bg-[#5334a0] !text-white border-none !rounded-md p-2.5 !text-[14px] font-semibold mb-4 transition-all cursor-pointer"
              disabled={loading}
            >
              {loading ? "Submitting..." : "Sign Up"}
            </button>

            <div className="text-center text-[12px] text-[#667085]">
              Already Have an Account? <Link to="/login" className="text-[#6941c6] no-underline font-semibold hover:underline">Log in</Link>
            </div>
          </form>
        </div>

        <div className="absolute top-0 left-0 w-full h-full pointer-events-none max-md:flex max-md:flex-col max-md:items-center max-md:mt-5 max-md:relative max-md:h-auto max-md:w-full max-lg:relative max-lg:h-auto max-lg:flex max-lg:flex-col max-lg:items-center max-lg:mt-5">
          <img
            src="/assets/logo-white.png"
            alt="Medi Compares Logo"
            className="absolute top-[36px] left-[699px] w-[162px] h-[61px] max-md:hidden max-lg:static max-lg:mb-5"
          />

          <div className="absolute top-[102px] left-[567px] w-[200px] h-[234px] max-md:hidden max-lg:hidden">
            <img
              src="/assets/login/front.png"
              alt="App Screen Back"
              className="absolute top-0 left-0 w-[116px] h-[234px] z-[1]"
            />
            <img
              src="/assets/login/back.png"
              alt="App Screen Front"
              className="absolute top-[29px] left-[85px] w-[88px] h-[177px]"
            />
          </div>

          <div className="absolute top-[145px] left-[754px] text-center flex flex-col items-center max-md:hidden max-lg:hidden">
            <img
              src="/assets/qurcode.png"
              alt="QR Code"
              className="w-[53px] h-[49px] mb-2.5"
            />
            <p className="text-[12px] text-white m-0 leading-[1.4] whitespace-pre-line">
              Scan the QR code
              {"\n"}
              to get the app now
            </p>
          </div>

          <div className="absolute top-[359px] left-[566px] flex gap-2.5 pointer-events-auto max-md:static max-md:flex max-md:flex-row max-md:justify-center max-md:gap-[15px] max-md:mt-0 max-lg:static max-lg:flex-row max-lg:justify-center">
            <a
              href="https://www.apple.com/in/store"
              target="_blank"
              className="flex items-center w-[150px] h-11 bg-[rgba(103,164,255,0.2)] rounded-[12px] backdrop-blur-[1px] shadow-[inset_0px_4px_50px_0px_#ffffff] no-underline px-3 transition-opacity duration-200 hover:opacity-90 max-md:w-[140px] max-md:h-10"
            >
              <img
                src="/assets/login/apple.png"
                alt="Apple Logo"
                className="w-[22px] h-[22px] mr-2 object-contain"
              />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] text-white leading-tight">Download on the</span>
                <span className="text-[14px] font-semibold text-white leading-tight">App Store</span>
              </div>
            </a>

            <a
              href="https://play.google.com/store/apps?hl=en_IN&pli=1"
              target="_blank"
              className="flex items-center w-[150px] h-11 bg-[rgba(103,164,255,0.2)] rounded-[12px] backdrop-blur-[1px] shadow-[inset_0px_4px_50px_0px_#ffffff] no-underline px-3 transition-opacity duration-200 hover:opacity-90 max-md:w-[140px] max-md:h-10"
            >
              <img
                src="/assets/login/playstore.png"
                alt="Play Store Logo"
                className="w-[22px] h-[22px] mr-2 object-contain"
              />
              <div className="flex flex-col justify-center">
                <span className="text-[9px] text-white leading-tight">GET IT ON</span>
                <span className="text-[14px] font-semibold text-white leading-tight">Google Play</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
