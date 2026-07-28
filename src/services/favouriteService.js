import { axiosUserInstance } from "../Apiservice.jsx";

/**
 * Fetch the user's list of favourite products.
 * @returns {Promise<Object>} raw axios response
 */
export const fetchFavouriteList = () => axiosUserInstance.get("favourite/list");

/**
 * Add a product to the user's favourites.
 * @param {Object} params
 * @param {string} params.itemId
 * @returns {Promise<Object>} raw axios response
 */
export const addFavourite = (params) => axiosUserInstance.post("favourite/add", params);

/**
 * Remove a product from the user's favourites.
 * @param {Object} params
 * @param {string} params.itemId
 * @returns {Promise<Object>} raw axios response
 */
export const removeFavourite = (params) => axiosUserInstance.post("favourite/remove", params);
