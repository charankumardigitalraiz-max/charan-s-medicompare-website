import React, { useState, } from "react";
import { useNavigate } from "react-router-dom";
import { InputOtp } from "primereact/inputotp";
import { toast } from "react-hot-toast";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import CommonPhoneInput from "../common/common-phoneInput/commonPhoneInput";
import { getFCMToken } from "../../../core/redux/firebase/fcm";
import { handlePostLoginRedirect } from "../../../utils/redirectUtils";
import { executePendingLabBooking } from "../../../utils/pendingBookingUtils";
import "./login/login.css";

const LoginWithOtp = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loader, setLoader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileInput, setMobileInput] = useState(false)
  const [phoneInfo, setPhoneInfo] = useState({ countryCode: "", phoneNumber: "" });
  const savedPhone = localStorage.getItem("phone");

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!phoneInfo.phoneNumber || !phoneInfo.countryCode) {
      toast.error("Please enter your phone number");
      return;
    }
    setLoading(true);
    const bodyData = {
      countryCode: phoneInfo.countryCode,
      identifier: phoneInfo.phoneNumber,
      type: "phone",
      usertype: "web",
      referral: localStorage.getItem("referral") || "",
    };

    try {
      const response = await axiosUserInstance.post("auth/login", bodyData);
      const data = response.data;
      toast.success(data.message);
      localStorage.setItem("phone", phoneInfo.phoneNumber);
      localStorage.removeItem("medicomparestoken");
      localStorage.setItem("otp", data?.data?.user?.otp);
      setMobileInput(false);
    } catch (error) {
      const message =
        error.response?.data?.message || "An error occurred. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (otp.length !== 4) {
      toast.error("Please enter a valid 4-digit OTP");
      return;
    }
    if (loader) return;
    setLoader(true);

    const phone = localStorage.getItem("phone");
    if (!phone) {
      toast.error("Phone number not found");
      setLoader(false);
      return;
    }

    let fcmToken = null;
    try {
      fcmToken = await getFCMToken();
      if (fcmToken) {
        localStorage.setItem("fcmToken", fcmToken);
      }
    } catch (error) {
      console.log("Error getting FCM token:", error);
    }

    try {
      const requestData = {
        otp,
        fcmToken: fcmToken,
        usertype: "web",
        type: "phone",
        identifier: phone,
        referral: sessionStorage.getItem("referral") || "",
      };
      const { data } = await axiosUserInstance.post("auth/verify-otp", requestData);
      if (data.success) {
        localStorage.setItem("medicomparestoken", data.data.token);

        let bookingResumed = false;
        try {
          bookingResumed = await executePendingLabBooking(navigate);
        } catch {
          toast.error("Could not complete your booking. Please try again.");
        }

        window.dispatchEvent(new Event("userLoggedIn"));

        if (bookingResumed) {
          localStorage.removeItem("otp");
          return;
        }

        handlePostLoginRedirect(navigate, "/");
        const isCart = localStorage.getItem("isCart");
        if (isCart) {
          const token = localStorage.getItem("medicomparestoken");
          const headers = { "Content-Type": "application/json" };
          if (token) headers["Authorization"] = `Bearer ${token}`;
          else headers["X-Phone"] = phone;

          const cartBody = localStorage.getItem("pharmacyCart");
          if (cartBody) {
            axiosCommonInstance.post("cart/create", cartBody, {
              headers,
            }).catch(() => { });
            localStorage.removeItem("pharmacyCart");
          }
          localStorage.removeItem("isCart");
        }
        return;
      } else {
        navigate("/addmoreInfo");
      }
      localStorage.removeItem("otp");
      // sessionStorage.removeItem("referral")
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoader(false);
    }
  };

  const handleResend = async () => {
    const phone = localStorage.getItem("phone");
    const bodydata = {
      usertype: "web",
      type: "phone",
      identifier: phone,
      referral: localStorage.getItem("referral") || "",
    };

    try {
      const response = await axiosUserInstance.post(
        "auth/resend-otp",
        bodydata
      );
      toast.success(response.data.message);
      if (response.data.otp) {
        localStorage.setItem("otp", response.data.otp);
        setOtp(response.data.otp);
      } else {
        setOtp("");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to resend OTP");
      }
    }
  };



  return (
    <section className="auth-login-screen">
      <div className="auth-login-container">
        <div className="auth-form-card">
          <h1 className="auth-form-title">Verification Code</h1>

          <div className="auth-divider">
            <hr className="auth-divider-line" />
            <span className="auth-divider-text">Enter OTP sent to your phone</span>
            <hr className="auth-divider-line" />
          </div>

          <form onSubmit={mobileInput ? handleLogin : handleSubmit}>
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                {mobileInput ? (
                  <CommonPhoneInput
                    onChange={(data) => setPhoneInfo(data)}
                    placeholder="Mobile Number"
                    className="auth-mobile-input"
                  />
                ) : (
                  <div className="d-flex justify-content-center">
                    <InputOtp
                      value={otp}
                      onChange={(e) => setOtp(e.value)}
                      integerOnly
                      length={4}
                      inputStyle={{ width: "2.5rem", margin: "0 5px" }}
                    />
                  </div>
                )}
              </div>
              <p
                className={`auth-helper-text ${mobileInput ? "" : "auth-helper-text--center"}`}
              >
                {mobileInput
                  ? "Enter your mobile number to receive a 4-digit verification code"
                  : savedPhone
                    ? `Enter the code sent to +91 ${savedPhone}`
                    : "Enter the 4-digit verification code sent to your phone"}
              </p>
            </div>

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loader}
            >
              {mobileInput ? "Send OTP" : loader ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <div className="d-flex justify-content-between align-items-center mt-2 mb-2">
            {!mobileInput && (
              <button
                type="button"
                // className="fw-bold"
                onClick={handleResend}
                style={{
                  fontSize: "13px",
                  padding: "7px 14px",
                  background: "#f3f0fa",
                  border: "1.5px solid #8059ca",
                  borderRadius: "6px",
                  color: "#8059ca",
                  cursor: "pointer",
                  fontWeight: "500",
                  // boxShadow: "0 2px 5px rgba(128, 89, 202, 0.12)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#8059ca";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f0fa";
                  e.currentTarget.style.color = "#8059ca";
                }}
              >
                Resend OTP
              </button>
            )}

            {!mobileInput && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  fontSize: "13px",
                  padding: "7px 14px",
                  background: "#ffffff",
                  border: "1.5px solid #cccccc",
                  borderRadius: "6px",
                  color: "#444444",
                  fontWeight: "500",
                  cursor: "pointer",
                  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.05)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f5f5f5";
                  e.currentTarget.style.borderColor = "#999999";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#ffffff";
                  e.currentTarget.style.borderColor = "#cccccc";
                }}
              >
                Change Number
              </button>
            )}
          </div>

          <div className="auth-terms-footer">
            <p className="auth-terms-text">
              By continuing, you agree to our{" "}
              <a
                href="/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="auth-terms-link"
              >
                Privacy Policy
              </a>
              {" "} &{" "}
              <a
                href="/policies/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="auth-terms-link"
              >
                Terms and Conditions
              </a>
            </p>
          </div>
        </div>

        <div className="auth-promo-section">
          <img
            src="/assets/logo-white.png"
            alt="Medi Compares Logo"
            className="auth-brand-logo"
          />

          <div className="auth-phones-container">
            <img
              src="/assets/login/front.png"
              alt="App Screen Back"
              className="auth-phone-back"
            />
            <img
              src="/assets/login/back.png"
              alt="App Screen Front"
              className="auth-phone-front"
            />
          </div>

          <div className="auth-qr-group">
            <img
              src="/assets/qurcode.png"
              alt="QR Code"
              className="auth-qr-code"
            />
            <p className="auth-qr-text">
              Scan the QR code
              <br />
              to get the app now
            </p>
          </div>

          <div className="auth-store-buttons">
            <a
              href="https://www.apple.com/in/store"
              target="_blank"
              className="auth-store-btn"
            >
              <img
                src="/assets/login/apple.png"
                alt="Apple Logo"
                className="auth-store-icon"
              />
              <div className="auth-store-text">
                <span className="auth-store-subtitle">Download on the</span>
                <span className="auth-store-title">App Store</span>
              </div>
            </a>

            <a
              href="https://play.google.com/store/apps?hl=en_IN&pli=1"
              target="_blank"
              className="auth-store-btn"
            >
              <img
                src="/assets/login/playstore.png"
                alt="Play Store Logo"
                className="auth-store-icon"
              />
              <div className="auth-store-text">
                <span className="auth-store-subtitle">GET IT ON</span>
                <span className="auth-store-title">Google Play</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LoginWithOtp;
