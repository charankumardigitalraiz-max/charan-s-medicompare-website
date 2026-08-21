import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { InputOtp } from "primereact/inputotp";
import { toast } from "react-hot-toast";
import { axiosCommonInstance, axiosUserInstance } from "../../Apiservice";
import CommonPhoneInput from "../common/common-phoneInput/commonPhoneInput";
import { getFCMToken } from "../../core/redux/firebase/fcm";
import { handlePostLoginRedirect } from "../../utils/redirectUtils";
import { executePendingLabBooking } from "../../utils/pendingBookingUtils";

const LoginWithOtp = () => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [loader, setLoader] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mobileInput, setMobileInput] = useState(false);
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
      localStorage.setItem('name', data?.data?.user?.first_name)
      localStorage.setItem('phone', data.data.user.phone);
      localStorage.setItem('email', data.data.user.email);
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
    <section className="w-full min-h-screen flex justify-center items-center p-5 box-border bg-white">
      <div className="relative w-full max-w-[897px] min-h-[451px] h-auto bg-gradient-to-r from-[#4B22AA] via-[#341777] to-[#6941C6] rounded-[40px] shadow-[2px_4px_10px_0px_rgba(82,82,82,0.1),-1px_1px_4px_0px_rgba(0,0,0,0.24)] flex items-center overflow-hidden max-md:h-auto max-md:flex-col max-md:items-center max-md:p-2.5 max-md:max-w-full max-lg:h-auto max-lg:flex-col max-lg:items-center max-lg:pb-10 max-lg:max-w-[500px] py-6 md:py-0">
        <div className="relative w-[468px] min-h-[381px] h-auto bg-[#f9fafb] rounded-[12px] ml-[52px] my-auto px-[46px] pt-[30px] pb-[30px] flex flex-col z-10 shrink-0 max-md:my-5 max-md:mx-0 max-md:w-[95%] max-md:h-auto max-md:p-5 max-lg:my-[35px] max-lg:mx-0 max-lg:w-[90%] max-lg:h-auto">
          <h1 className="!text-[22px] !font-semibold !text-[#344055] m-0 mb-4 leading-normal max-md:text-[18px] max-md:font-bold">Verification Code</h1>

          <div className="flex items-center justify-between mb-2 w-full">
            <hr className="grow border-none border-t border-[#7c7e80] mx-2.5" />
            <span className="text-[12px] text-[#667085] m-0 whitespace-nowrap">Enter OTP sent to your phone</span>
            <hr className="grow border-none border-t border-[#7c7e80] mx-2.5" />
          </div>

          <form onSubmit={mobileInput ? handleLogin : handleSubmit}>
            <div className="mb-5">
              <div className="mb-4">
                {mobileInput ? (
                  <CommonPhoneInput
                    onChange={(data) => setPhoneInfo(data)}
                    placeholder="Mobile Number"
                  />
                ) : (
                  <div className="flex justify-center">
                    <InputOtp
                      value={otp}
                      onChange={(e) => setOtp(e.value)}
                      integerOnly
                      length={4}
                      inputTemplate={({ props, events }) => (
                        <input
                          {...props}
                          {...events}
                          style={{
                            width: "3rem",
                            height: "3.2rem",
                            margin: "0 6px",
                            border: "1px solid #d1d5db",
                            borderRadius: "8px",
                            textAlign: "center",
                            fontSize: "1.25rem",
                            outline: "none",
                            color: "#333"
                          }}
                          className="border border-[#d1d5db] focus:border-[var(--color-primary,#4c2691)] focus:ring-1 focus:ring-[var(--color-primary,#4c2691)] rounded-[8px]"
                        />
                      )}
                    />
                  </div>
                )}
              </div>
              <p
                className={`text-[12px] text-[#667085] mt-2 mb-0 ml-1 leading-[1.4] max-md:ml-0 ${mobileInput ? "" : "text-center"}`}
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
              className="w-full h-10 bg-[#512aac] hover:bg-[#422291] text-white border-none !rounded-md text-[16px] font-medium mb-3.5 transition-colors duration-200 disabled:opacity-50 cursor-pointer"
              disabled={loader}
            >
              {mobileInput ? "Send OTP" : loader ? "Verifying..." : "Verify OTP"}
            </button>
          </form>

          <div className="flex justify-between items-center mt-2 mb-1 gap-3">
            {!mobileInput && (
              <button
                type="button"
                onClick={handleResend}
                style={{
                  fontSize: "13px",
                  padding: "7px 14px",
                  background: "#f3f0fa",
                  border: "1.5px solid var(--color-primary,#4c2691)",
                  borderRadius: "6px",
                  color: "var(--color-primary,#4c2691)",
                  cursor: "pointer",
                  fontWeight: "500",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-primary,#4c2691)";
                  e.currentTarget.style.color = "#ffffff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#f3f0fa";
                  e.currentTarget.style.color = "var(--color-primary,#4c2691)";
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

          <div className="mt-auto">
            <p className="text-[12px] text-[#6b7280] m-0 leading-[1.4]">
              By continuing, you agree to our{" "}
              <a
                href="/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[var(--color-primary,#4c2691)] no-underline font-medium"
              >
                Privacy Policy
              </a>
              {" "} & {" "}
              <a
                href="/policies/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[var(--color-primary,#4c2691)] no-underline font-medium"
              >
                Terms and Conditions
              </a>
            </p>
          </div>
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
            <div className="w-[53px] h-[53px] bg-white rounded p-0.5 mb-2.5 flex items-center justify-center">
              <QRCodeSVG
                value="https://play.google.com/store/apps/details?id=com.medicompares.medicompares"
                size={49}
                level="H"
                imageSettings={{
                  src: "/favicon.png",
                  height: 11,
                  width: 11,
                  excavate: true,
                }}
              />
            </div>
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
              href="https://play.google.com/store/apps/details?id=com.medicompares.medicompares"
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

export default LoginWithOtp;
