import { axiosUserInstance } from "../Apiservice.jsx";

/**
 * ─────────────────────────────────────────────────────────
 *  GLOBAL USER SERVICE
 *  Single source of truth for the authenticated user's identity.
 *
 *  Strategy:
 *    1. On login/profile load → call storeUserId(_id) → persists to localStorage
 *    2. On logout            → call clearUserId()     → removes from localStorage
 *    3. Anywhere in the app  → call getUserId()       → returns _id or null
 *    4. bookingService uses  → getOrFetchUserId()     → fetches from API if not cached
 * ─────────────────────────────────────────────────────────
 */

const USER_ID_KEY = "medicompares_uid";

// ─── Local Storage Helpers ────────────────────────────────

/**
 * Persist the authenticated user's _id to localStorage.
 * Call this immediately after a successful login or profile fetch.
 * @param {string} userId
 */
export const storeUserId = (userId) => {
  try {
    if (userId) {
      localStorage.setItem(USER_ID_KEY, userId);
    }
  } catch {
    // ignore storage errors
  }
};

/**
 * Read the cached userId from localStorage.
 * @returns {string|null}
 */
export const getUserId = () => {
  try {
    return localStorage.getItem(USER_ID_KEY) || null;
  } catch {
    return null;
  }
};

/**
 * Remove the cached userId from localStorage.
 * Call this on logout.
 */
export const clearUserId = () => {
  try {
    localStorage.removeItem(USER_ID_KEY);
  } catch {
    // ignore
  }
};

// ─── Profile Fetch (used internally by booking service) ───

let _profileFetchPromise = null;

/**
 * Fetch the user profile from the API and cache the userId.
 * Deduplicates concurrent calls — only one request is in-flight at a time.
 * @returns {Promise<string|null>} The user's _id or null on failure.
 */
export const fetchAndCacheUserId = async () => {
  const token = localStorage.getItem("medicomparestoken");
  if (!token) return null;

  // Return cached value immediately if already stored
  const cached = getUserId();
  if (cached) return cached;

  // Deduplicate in-flight requests
  if (_profileFetchPromise) return _profileFetchPromise;

  _profileFetchPromise = axiosUserInstance
    .get("profile", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => {
      const uid = res?.data?.data?.user?._id || null;
      if (uid) storeUserId(uid);
      return uid;
    })
    .catch(() => null)
    .finally(() => {
      _profileFetchPromise = null;
    });

  return _profileFetchPromise;
};

/**
 * Get userId from cache, or fetch from API if not yet cached.
 * This is the primary function used by bookingService and other API utilities.
 * @returns {Promise<string|null>}
 */
export const getOrFetchUserId = async () => {
  const cached = getUserId();
  if (cached) return cached;
  return fetchAndCacheUserId();
};
