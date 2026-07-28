import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { axiosUserInstance } from "../../../../Apiservice";
import { useGoogleLogin } from "@react-oauth/google";
import CommonPhoneInput from "../../common/common-phoneInput/commonPhoneInput";
import axios from "axios";
import { getFCMToken } from "../../../../core/redux/firebase/fcm";
import { handlePostLoginRedirect } from "../../../../utils/redirectUtils";
import { executePendingLabBooking } from "../../../../utils/pendingBookingUtils";
import "./login.css";

const Login = () => {
  const [phoneInfo, setPhoneInfo] = useState({
    countryCode: "",
    phoneNumber: "",
  });

  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");

  console.log("ref", ref);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
      // referral: sessionStorage.getItem("referral") || "",
    };

    try {
      const response = await axiosUserInstance.post("auth/login", bodyData);
      const data = response.data;

      toast.success(data.message);
      localStorage.setItem("phone", phoneInfo.phoneNumber);
      localStorage.removeItem("medicomparestoken");
      localStorage.setItem("otp", data?.data?.user?.otp);

      navigate("/email-otp");
    } catch (error) {
      const message =
        error.response?.data?.message || "An error occurred. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (ref) {
      sessionStorage.setItem("referral", ref);
    }
  }, [ref]);

  const login = useGoogleLogin({
    onSuccess: (credentialResponse) => {
      const token = credentialResponse.access_token;
      const google_api =
        "https://www.googleapis.com/oauth2/v1/userinfo?alt=json";

      axios
        .get(google_api, {
          headers: { Authorization: "Bearer " + token },
        })
        .then((res) => {
          const userData = res.data;
          socialApi(userData);
        })
        .catch(() => toast.error("Google login failed"));
    },
    onError: () => toast.error("Google login failed"),
  });

  const socialApi = async (googleUser) => {
    try {
      let fcmToken = null;
      try {
        fcmToken = await getFCMToken();
        if (fcmToken) {
          localStorage.setItem("fcmToken", fcmToken);
        }
      } catch (error) {
        console.log("Error getting FCM token:", error);
      }

      const bodyData = {
        first_name: googleUser.given_name,
        email: googleUser.email,
        provider_id: googleUser.id,
        fcmToken: fcmToken,
        usertype: "web",
        referral: sessionStorage.getItem("referral") || "",
      };
      const response = await axiosUserInstance.post(
        "auth/social-login",
        bodyData,
      );
      localStorage.setItem("medicomparestoken", response.data?.data?.token);
      localStorage.removeItem("phone");
      window.dispatchEvent(new Event("userLoggedIn"));

      let bookingResumed = false;
      try {
        sessionStorage.removeItem("referral")
        bookingResumed = await executePendingLabBooking(navigate);
      } catch {
        toast.error("Could not complete your booking. Please try again.");
      }

      if (bookingResumed) return;

      handlePostLoginRedirect(navigate, "/");
    } catch (error) {
      toast.error("Social login error:", error);
      toast.error(error.response?.data?.message || "Something went wrong during social login");
    }
  };

  return (
    <section className="auth-login-screen">
      <div className="auth-login-container">
        <div className="auth-form-card">
          <h1 className="auth-form-title">Login with MediCompares</h1>

          <button className="auth-google-btn" onClick={() => login()}>
            <img
              src="assets/img/icons/google-icon.svg"
              alt="Google Logo"
              className="auth-google-icon"
            />
            <span>Continue with Google</span>
          </button>

          <div className="auth-divider">
            <hr className="auth-divider-line" />
            <span className="auth-divider-text">Or</span>
            <hr className="auth-divider-line" />
          </div>

          <form onSubmit={handleLogin}>
            <div className="auth-input-group">
              <div className="auth-input-wrapper">
                <CommonPhoneInput
                  onChange={(data) => setPhoneInfo(data)}
                  placeholder="Mobile Number"
                  className="auth-mobile-input"
                />
              </div>
              <p className="auth-helper-text">
                OTP will be sent to this number
              </p>
            </div>

            <button
              type="submit"
              className="auth-primary-btn"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>

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

export default Login;
