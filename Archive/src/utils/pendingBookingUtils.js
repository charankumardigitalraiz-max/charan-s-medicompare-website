import { axiosCommonInstance } from "../Apiservice";
import { navigateToLogin } from "./redirectUtils";

const PENDING_LAB_BOOKING_KEY = "pendingLabBooking";

export const storePendingLabBooking = (payload, options = {}) => {
  try {
    localStorage.setItem(
      PENDING_LAB_BOOKING_KEY,
      JSON.stringify({
        payload,
        redirectPath: options.redirectPath || "/booking-process",
        perDayRent: options.perDayRent ?? null,
        savedAt: Date.now(),
      }),
    );
  } catch {
    // ignore storage errors
  }
};

export const getPendingLabBooking = () => {
  try {
    const raw = localStorage.getItem(PENDING_LAB_BOOKING_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.payload ? parsed : null;
  } catch {
    return null;
  }
};

export const clearPendingLabBooking = () => {
  try {
    localStorage.removeItem(PENDING_LAB_BOOKING_KEY);
  } catch {
    // ignore
  }
};

export const redirectToLoginWithPendingBooking = (
  navigate,
  payload,
  options = {},
) => {
  storePendingLabBooking(payload, options);
  const returnPath =
    window.location.pathname + window.location.search + window.location.hash;
  navigateToLogin(navigate, returnPath);
};

export const executePendingLabBooking = async (navigate) => {
  const pending = getPendingLabBooking();
  if (!pending?.payload) return false;

  const token = localStorage.getItem("medicomparestoken");
  if (!token) return false;

  const { payload, redirectPath = "/booking-process", perDayRent } = pending;
  clearPendingLabBooking();

  if (perDayRent != null && perDayRent !== "") {
    localStorage.setItem("perDayRent", String(perDayRent));
  }

  try {
    const response = await axiosCommonInstance.post(
      "cart/buynow/create",
      payload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      },
    );

    navigate(redirectPath, { state: { bookingData: response.data } });
    return true;
  } catch (error) {
    storePendingLabBooking(payload, { redirectPath, perDayRent });
    throw error;
  }
};
