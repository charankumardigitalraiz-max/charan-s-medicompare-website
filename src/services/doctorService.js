import { axiosCommonInstance } from "../Apiservice.jsx";

/**
 * Fetch the list of doctors, optionally filtered by a search term.
 * 
 * @param {string} [searchTerm] - Optional name/specialty to filter doctors by
 * @returns {Promise<Object>} The raw axios response containing doctor data
 */
export const fetchDoctorsList = async (searchTerm = "") => {
  const token = localStorage.getItem("medicomparestoken");
  const url = searchTerm
    ? `doctors/list?search=${encodeURIComponent(searchTerm)}`
    : "doctors/list";

  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return axiosCommonInstance.get(url, { headers });
};
