import { axiosCommonInstance } from "../Apiservice.jsx";
import toast from "react-hot-toast";
import { redirectToLoginWithPendingBooking } from "../utils/pendingBookingUtils";
import { getOrFetchUserId } from "../utils/userService";

// ─────────────────────────────────────────────────────────────────────────────
//  ENTITY SCHEMAS (TypeScript-style JSDoc)
//  Mirrors what the backend expects. All booking calls pass through these.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @typedef {Object} BuyNowItemInput
 * @property {string|null}  [productId]
 * @property {string|null}  [variantId]
 * @property {string}        vendorId
 * @property {string|null}  [packageId]
 * @property {string}       [type]           - "normal" | "package"
 * @property {string}       [bookingType]    - "buy_now" | "cart" | "rental" | "ride"
 * @property {number}       [perDayRent]
 * @property {string|null}  [serviceFixedTypes]
 * @property {number}       [quantity]
 * @property {string|null}  [patientId]
 * @property {string}       [selectType]     - "self" | "family"
 * @property {Array}        [groupcart]
 * @property {Array}        [labTestPatients]
 * @property {string|null}  [userId]         - Authenticated user's _id (injected globally)
 */

/**
 * Entity class that normalizes and validates every booking item payload.
 * Instantiate via `new BuyNowItemEntity(data)` before sending to the API.
 */
export class BuyNowItemEntity {
  /**
   * @param {BuyNowItemInput} data
   */
  constructor(data) {
    this.productId = data.productId || null;
    this.variantId = data.variantId || null;
    this.vendorId = data.vendorId || "";
    this.packageId = data.packageId || null;
    this.type = data.type || "normal";
    this.bookingType = data.bookingType || "buy_now";
    this.perDayRent = Number(data.perDayRent) || 0;
    this.servicefixedTypes = data.servicefixedTypes || null;
    this.quantity = Number(data.quantity) || 1;
    this.patientId = data.patientId || null;
    this.selectType = data.selectType || "self";
    this.groupcart = data.groupcart || [];
    this.labTestPatients = data.labTestPatients || [];
    // userId is injected by the service layer — not set here directly
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  INTERNAL HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validate and normalize a raw payload array into BuyNowItemEntity instances.
 * @param {BuyNowItemInput|BuyNowItemInput[]} payload
 * @returns {BuyNowItemEntity[]}
 */
const normalizePayload = (payload) =>
  Array.isArray(payload)
    ? payload.map((item) => new BuyNowItemEntity(item))
    : [new BuyNowItemEntity(payload)];

// ─────────────────────────────────────────────────────────────────────────────
//  CORE BOOKING SERVICE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Core buy-now booking creation handler — globally reusable.
 *
 * What it does:
 *  1. Checks auth token; redirects to login if missing.
 *  2. Resolves the logged-in userId and attaches it to every payload item.
 *  3. Validates payload via BuyNowItemEntity.
 *  4. POSTs to `cart/buynow/create`.
 *  5. Navigates to redirectPath on success.
 *
 * @param {BuyNowItemInput|BuyNowItemInput[]} payload
 * @param {Function} navigate         - React Router navigate function
 * @param {string}  [redirectPath]    - Destination after success (default: "/booking-process")
 * @param {Object}  [extraParams]     - Extra options forwarded to pending booking store
 * @returns {Promise<any|null>}
 */
const getPincodeFromStorage = () => {
  try {
    const savedLocation = localStorage.getItem("selectedLocation");
    if (!savedLocation) return null;
    const locationData = JSON.parse(savedLocation);
    if (locationData.pincode && locationData.pincode.length === 6) {
      return locationData.pincode;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

export const createBuyNowBooking = async (
  payload,
  navigate,
  redirectPath = "/booking-process",
  extraParams = {}
) => {
  const token = localStorage.getItem("medicomparestoken");

  if (!token) {
    toast.error("Please login to proceed");
    redirectToLoginWithPendingBooking(navigate, payload, {
      redirectPath,
      ...extraParams,
    });
    return null;
  }

  // Normalize payload items into validated entities
  const validatedPayload = normalizePayload(payload);

  // Resolve userId globally — cached from localStorage, or fetched from profile API
  const userId = await getOrFetchUserId();

  try {
    let url = "cart/buynow/create";
    const queryParams = new URLSearchParams();
    if (userId) queryParams.append("userID", userId);

    // const pincode = getPincodeFromStorage();
    // if (pincode) queryParams.append("pincode", pincode);

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }
    const response = await axiosCommonInstance.post(
      url,
      validatedPayload,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data) {
      if (window.location.pathname === redirectPath) {
        window.location.reload();
      } else {
        navigate(redirectPath, { state: { bookingData: response.data } });
      }
    }
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      toast.error("Session expired. Please login again.");
      redirectToLoginWithPendingBooking(navigate, validatedPayload, {
        redirectPath,
        ...extraParams,
      });
    } else {
      toast.error("Failed to create booking");
      throw error;
    }
    return null;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
//  DOMAIN-SPECIFIC BOOKING FLOWS
//  All delegate to createBuyNowBooking; no direct API calls here.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Equipment Rental checkout flow.
 * Stores perDayRent in localStorage and redirects to /rental-booking-process.
 *
 * @param {{ productId: string, variantId?: string|null, vendorId: string, perDayRent?: number, navigate: Function }} params
 */
export const handleRentalBookingProcess = async ({
  productId,
  variantId = null,
  vendorId,
  perDayRent = 0,
  navigate,
  servicefixedTypes = null,
}) => {
  const payload = [
    new BuyNowItemEntity({
      productId,
      variantId,
      vendorId,
      packageId: null,
      type: "normal",
      bookingType: "buy_now",
      perDayRent: perDayRent || 0,
      servicefixedTypes
    }),
  ];

  // if (perDayRent) {
  //   localStorage.setItem("perDayRent", perDayRent);
  // }

  return createBuyNowBooking(payload, navigate, "/rental-booking-process", {
    perDayRent,
  });
};

/**
 * Lab Test booking checkout flow.
 * Supports multiple tests and multiple patients (self or family members).
 *
 * @param {{ tests: Object|Object[], vendorId: string, selectedPatients: string[], bookingType?: string, navigate: Function }} params
 */
export const handleLabTestBookingProcess = async ({
  tests,
  vendorId,
  selectedPatients,
  bookingType = "buy_now",
  navigate,
  servicefixedTypes = null,
}) => {
  const testsArray = Array.isArray(tests) ? tests : [tests];

  const labTestPatients = selectedPatients.map((id) => ({
    selectType: id === "self" ? "self" : "family",
    patientId: id === "self" ? null : id,
  }));

  const payload = testsArray.map((test) => {
    const variantId =
      test.variant?.[0]?._id ||
      test.variants?.[0]?._id ||
      test.variantId ||
      null;
    return new BuyNowItemEntity({
      productId: test._id || test.productId,
      variantId,
      vendorId,
      packageId: null,
      type: "normal",
      bookingType,
      labTestPatients,
      servicefixedTypes,
    });
  });

  return createBuyNowBooking(payload, navigate, "/booking-process");
};

/**
 * General Service booking flow.
 * Used for nursing care, doctor appointments, and custom categories.
 *
 * @param {{ productId: string, variantId?: string|null, vendorId: string, serviceFixedTypes?: string|null, navigate: Function, redirectPath?: string }} params
 */
export const handleGeneralBookingProcess = async ({
  productId,
  variantId = null,
  vendorId,
  servicefixedTypes,
  navigate,
  redirectPath = "/booking-process",
}) => {
  const payload = [
    new BuyNowItemEntity({
      productId,
      variantId,
      vendorId,
      packageId: null,
      type: "normal",
      bookingType: "buy_now",
      servicefixedTypes,
    }),
  ];

  return createBuyNowBooking(payload, navigate, redirectPath);
};
