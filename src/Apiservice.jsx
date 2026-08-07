import axios from "axios";
export const isProduction = import.meta.env.MODE === "production";
export const isDevMachine = import.meta.env.DEV;


// import.meta.env.VITE_API_HOST ||
// (import.meta.env.DEV
// const host = "http://192.168.0.117:9001"
// const host = "http://192.168.0.163:9001"
// const host = "http://192.168.0.115:9001";
const host = "https://api.medicompares.com";
export const baseurl = host + "/api/v1/web";
export const imgUrl = host;
export const customerWebUrl = "https://medicompares.com";

export const axiosInstance = axios.create({
  baseURL: baseurl,
});

export const axiosCommonInstance = axios.create({
  baseURL: imgUrl + "/api/v1/common/",
});

export const axiosUserInstance = axios.create({
  baseURL: imgUrl + "/api/v1/user/",
});

const handle401Error = (error) => {
  const status = error?.response?.status;
  const url = error?.config?.url || "";

  // console.log("Interceptor Error:", status, url);
  const message =
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    "Something went wrong";
  if (status === 401 && !url.includes("auth/login")) {
    localStorage.removeItem("medicomparestoken");
    localStorage.removeItem("fcmToken");

    alert(message);
    window.location.href = "/login";
    return;
  }
  if (status === 403) {
    localStorage.removeItem("medicomparestoken");
    localStorage.removeItem("fcmToken");

    alert(message);
    window.location.href = "/login";
    return;
  }

  return Promise.reject(error);
};

const getPincodeFromStorage = () => {
  try {
    const savedLocation = localStorage.getItem("selectedLocation");
    if (!savedLocation) return null;
    const locationData = JSON.parse(savedLocation);
    if (locationData.pincode) {
      return locationData.pincode;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("medicomparestoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const pincode = getPincodeFromStorage();
  if (pincode) {
    config.params = { pincode, ...config.params };
  }
  return config;
});

axiosInstance.interceptors.response.use((response) => response, handle401Error);

axiosCommonInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("medicomparestoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const pincode = getPincodeFromStorage();
  if (pincode) {
    config.params = { pincode, ...config.params };
  }
  return config;
});

axiosCommonInstance.interceptors.response.use(
  (response) => response,
  handle401Error,
);

axiosUserInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("medicomparestoken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const pincode = getPincodeFromStorage();
  if (pincode) {
    config.params = { pincode, ...config.params };
  }
  return config;
});

axiosUserInstance.interceptors.response.use(
  (response) => response,
  handle401Error,
);

let categoriesCache = null;
let categoriesPromise = null;

export const fetchCategoryList = async () => {
  if (categoriesCache) {
    return categoriesCache;
  }
  if (categoriesPromise) {
    return categoriesPromise;
  }
  categoriesPromise = axiosInstance.get("categorylist")
    .then((response) => {
      categoriesCache = response.data?.data?.categories || [];
      categoriesPromise = null;
      return categoriesCache;
    })
    .catch((error) => {
      categoriesPromise = null;
      throw error;
    });
  return categoriesPromise;
};
