import { axiosCommonInstance } from "../Apiservice.jsx";

const buildFilterQuery = (params) => {
  const q = new URLSearchParams();
  if (params.serviceType) q.set("serviceType", params.serviceType);
  if (params.maincatId) q.set("maincatId", params.maincatId);
  q.set("asortby", "a");
  if (params.userId) q.set("userId", params.userId);
  if (params.bpage) q.set("bpage", params.bpage);
  if (params.blimit) q.set("blimit", params.blimit);
  if (params.cpage) q.set("cpage", params.cpage);
  if (params.climit) q.set("climit", params.climit);
  if (params.catpage) q.set("catpage", params.catpage);
  if (params.catlimit) q.set("catlimit", params.catlimit);
  return `category/search/filter/?${q.toString()}`;
};

/**
 * Search/list products with full filter + pagination payload.
 * @param {Object} body
 * @param {string|null} [userId]
 * @returns {Promise<Object>} raw axios response
 */
export const searchProducts = (body, userId) => {
  const url = userId ? `category/search?userId=${userId}` : "category/search";
  return axiosCommonInstance.post(url, body);
};

/**
 * Fetch filter sidebar data (categories, brands, compositions, types, etc.)
 * @param {Object} params
 * @returns {Promise<Object>} raw axios response
 */
export const fetchFilterData = (params) =>
  axiosCommonInstance.get(buildFilterQuery(params));

/**
 * Load the next page of brands for the filter sidebar.
 * @param {Object} params
 * @returns {Promise<Object>} raw axios response
 */
export const fetchMoreBrands = (params) =>
  axiosCommonInstance.get(buildFilterQuery(params));

/**
 * Load the next page of compositions for the filter sidebar.
 * @param {Object} params
 * @returns {Promise<Object>} raw axios response
 */
export const fetchMoreCompositions = (params) =>
  axiosCommonInstance.get(buildFilterQuery(params));

/**
 * Load the next page of categories for the filter sidebar.
 * @param {Object} params
 * @returns {Promise<Object>} raw axios response
 */
export const fetchMoreCategories = (params) =>
  axiosCommonInstance.get(buildFilterQuery(params));

/**
 * Fetch general product presentation details by ID.
 * @param {string} productId
 * @param {Record<string, any>} params - query string parameters
 * @returns {Promise<Object>} raw axios response
 */
export const fetchProductShow = (productId, params) => {
  const q = new URLSearchParams(params).toString();
  return axiosCommonInstance.get(`product/show/${productId}${q ? `?${q}` : ""}`);
};

/**
 * Fetch granular variant & vendor details for a product by ID.
 * @param {string} productDetailsId
 * @param {Record<string, any>} params - query string parameters
 * @returns {Promise<Object>} raw axios response
 */
export const fetchProductDetails = (productDetailsId, params) => {
  const q = new URLSearchParams(params).toString();
  return axiosCommonInstance.get(`product/details/${productDetailsId}${q ? `?${q}` : ""}`);
};
