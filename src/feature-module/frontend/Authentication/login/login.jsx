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
      localStorage.setItem('name', response.data?.data?.user?.first_name)
      localStorage.setItem('phone', response.data.data.user.phone);
      localStorage.setItem('email', response.data.data.user.email);

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
    <section className="w-full min-h-screen flex justify-center items-center p-5 box-border bg-white">
      <div className="relative w-full max-w-[897px] min-h-[451px] h-auto bg-gradient-to-r from-[#4B22AA] via-[#341777] to-[#6941C6] rounded-[40px] shadow-[2px_4px_10px_0px_rgba(82,82,82,0.1),-1px_1px_4px_0px_rgba(0,0,0,0.24)] flex items-center overflow-hidden max-md:h-auto max-md:flex-col max-md:items-center max-md:p-2.5 max-md:max-w-full max-lg:h-auto max-lg:flex-col max-lg:items-center max-lg:pb-10 max-lg:max-w-[500px] py-6 md:py-0">
        <div className="relative w-[468px] min-h-[381px] h-auto bg-[#f9fafb] rounded-[12px] ml-[52px] my-auto px-[46px] pt-[30px] pb-[30px] flex flex-col z-10 shrink-0 max-md:my-5 max-md:mx-0 max-md:w-[95%] max-md:h-auto max-md:p-5 max-lg:my-[35px] max-lg:mx-0 max-lg:w-[90%] max-lg:h-auto">
          <h1 className="!text-[22px] !font-semibold !text-[#344055] !m-0 !mb-4 !leading-normal max-md:text-[18px] max-md:font-bold">Login with MediCompares</h1>

          <button className="flex items-center justify-center gap-2.5 w-full h-[45px] !bg-[#f9fafb] !border !border-[#d0d5dd] rounded-[8px] !text-[#1d2939] !text-[14px] !font-medium !mb-[5px] !transition-colors hover:bg-[#f0f2f5] cursor-pointer" onClick={() => login()}>
            <img
              src="assets/img/icons/google-icon.svg"
              alt="Google Logo"
              className="w-6 h-6"
            />
            <span>Continue with Google</span>
          </button>

          <div className="flex items-center justify-between mb-2 w-full">
            <hr className="grow border-none border-t border-[#7c7e80] mx-2.5" />
            <span className="text-[12px] text-[#667085] m-0 whitespace-nowrap">Or</span>
            <hr className="grow border-none border-t border-[#7c7e80] mx-2.5" />
          </div>

          <form onSubmit={handleLogin}>
            <div className="mb-5">
              <div className="mb-4">
                <CommonPhoneInput
                  onChange={(data) => setPhoneInfo(data)}
                  placeholder="Mobile Number"
                />
              </div>
              <p className="text-[12px] text-[#667085] mt-2 mb-0 ml-1 leading-[1.4] max-md:ml-0">
                OTP will be sent to this number
              </p>
            </div>

            <button
              type="submit"
              className="w-full h-10 !bg-[#512aac] hover:bg-[#422291] text-white !border-none !rounded-[8px] !text-[16px] !font-medium !mb-3.5 !transition-colors !duration-200 !disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Sending..." : "Send OTP"}
            </button>
          </form>

          <div className="mt-auto">
            <p className="text-[12px] text-[#6b7280] m-0 leading-[1.4]">
              By continuing, you agree to our{" "}
              <a
                href="/policies/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#8059ca] no-underline font-medium"
              >
                Privacy Policy
              </a>
              {" "} & {" "}
              <a
                href="/policies/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] text-[#8059ca] no-underline font-medium"
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

export default Login;
