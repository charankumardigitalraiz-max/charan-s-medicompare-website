import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosUserInstance } from "../../../Apiservice";
import { DatePicker } from "rsuite";
import { User, Mail, Phone, Calendar } from "react-feather";
import { handlePostLoginRedirect } from "../../../utils/redirectUtils";
import "./addmore-Info.css";

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
    <section id="signup-page">
      <div className="main-container">
        <div className="left-panel d-none d-md-block">
          <div className="left-panel-content">
            <div className="brand-header">
              <img
                src="/assets/logo-white.png"
                alt="Medi Compares Logo"
                className="brand-logo"
              />
              <div className="qr-code-container">
                <p className="qr-text text-white">
                  Scan the QR code
                  <br />
                  to get the app now
                </p>
                <img
                  src="/assets/qurcode.png"
                  alt="QR Code"
                  className="qr-image"
                />
              </div>
            </div>

            <div className="phones-display">
              <div className="particles"></div>
              <img
                src="/assets/login/front.png"
                alt="App Screen 1"
                className="phone-img phone-left"
              />
              <img
                src="/assets/login/back.png"
                alt="App Screen 2"
                className="phone-img1 phone-right"
              />
            </div>

            {/* <div className="promo-text">
              <h2 className="text-white">Speed, Easy and Fast</h2>
              <p className="text-white">Compare prices on over 50,000 medicines, lab tests, and surgeries. Get expert care delivered to your doorstep and manage your health records in one secure place.</p>
            </div> */}

            <div className="store-buttons1">
              <a
                href="https://play.google.com/store/apps?hl=en_IN&pli=1"
                target="_blank"
                className="store-btn1"
              >
                <img src="/assets/login/playstore.png" alt="Google Play Icon" />
                <div className="btn-text">
                  <span className="small-text">GET IT ON</span>
                  <span className="large-text">Google Play</span>
                </div>
              </a>
              <a
                href="https://www.apple.com/in/store"
                target="_blank"
                className="store-btn1"
              >
                <img src="/assets/login/apple.png" alt="App Store Icon" />
                <div className="btn-text">
                  <span className="small-text">Download on the</span>
                  <span className="large-text">App Store</span>
                </div>
              </a>
            </div>
          </div>
        </div>

        <div className="right-panel">
          <div className="form-container">
            <header className="form-header">
              <h1 className="auth-form-title">Add More Details</h1>
              <p>Create your account to access exclusive medical deals</p>
            </header>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="input-group1">
                  <div className="input-wrapper1">
                    <User className="input-icon" size={16} />
                    <input
                      type="text"
                      name="first_name"
                      placeholder="First name"
                      value={form.first_name}
                      onChange={(e) => handleChange(e)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group1">
                  <div className="input-wrapper1">
                    <User className="input-icon" size={16} />
                    <input
                      type="text"
                      name="last_name"
                      placeholder="Last name"
                      value={form.last_name}
                      onChange={(e) => handleChange(e)}
                      required
                    />
                  </div>
                </div>

                <div className="input-group1 full-width">
                  <div className="input-wrapper1">
                    <Mail className="input-icon" size={16} />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      required
                      value={form.email}
                      onChange={(e) => handleChange(e)}
                    />
                  </div>
                </div>

                <div className="input-group1">
                  <div className="input-wrapper1">
                    <select
                      name="gender"
                      className="form-select"
                      value={form.gender}
                      onChange={(e) => handleChange(e)}
                      required
                    >
                      <option value="">Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="input-group1">
                  <div className="input-wrapper1">
                    <Phone className="input-icon" size={16} />
                    <input
                      type="text"
                      maxLength={10}
                      name="phone"
                      placeholder="Enter Mobile Number"
                      value={localStorage.getItem("phone")}
                      readOnly
                    />
                  </div>
                </div>

                <div className="input-group1">
                  <div className="input-wrapper1 date-picker-wrapper">
                    <Calendar className="input-icon calendar-icon" size={16} />
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
                    <small
                      className="text-muted mt-1 d-block"
                      style={{ fontSize: "12px" }}
                    >
                      Age: {form.age} years
                    </small>
                  )}
                  {ageError && (
                    <small
                      className="text-danger mt-1 d-block"
                      style={{ fontSize: "10px" }}
                    >
                      {ageError}
                    </small>
                  )}
                </div>

                <div className="input-group1">
                  <div className="input-wrapper1">
                    <select
                      name="medical_condition"
                      className="form-select"
                      value={form.medical_condition}
                      onChange={handleChange}
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

              <p className="privacy-text">
                By creating an account, you agree to our{" "}
                <a
                  href="/policies/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-terms-link"
                >
                  Privacy Policy
                </a>{" "}
                &{" "}
                <a
                  href="/policies/terms-and-conditions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="auth-terms-link"
                >
                  Terms and Conditions
                </a>
              </p>

              <button type="submit" className="submit-btn" disabled={loading}>
                {loading ? "Submitting..." : "Sign Up"}
              </button>

              <div className="login-link">
                Already Have an Account? <Link to="/login">Log in</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Register;
