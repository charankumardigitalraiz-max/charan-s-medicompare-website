import { axiosUserInstance } from "../Apiservice.jsx";

/**
 * Fetch the list of family members for the authenticated user.
 * 
 * @returns {Promise<Object>} The raw axios response containing family members
 */
export const fetchFamilyMembersList = async () => {
  const token = localStorage.getItem("medicomparestoken");
  const headers = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return axiosUserInstance.get("family-member/list", { headers });
};

/**
 * Create a new family member profile.
 * 
 * @param {Object} payload - The family member data (name, mobile, relationship, dateOfBirth, gender, etc.)
 * @returns {Promise<Object>} The raw axios response of the creation request
 */
export const createFamilyMember = async (payload) => {
  const token = localStorage.getItem("medicomparestoken");
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return axiosUserInstance.post("family-member/create", payload, { headers });
};
