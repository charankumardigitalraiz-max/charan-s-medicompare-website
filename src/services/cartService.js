import { axiosCommonInstance } from "../Apiservice.jsx";

/**
 * Retrieve the user's server-side cart.
 * @returns {Promise<Object>} raw axios response
 */
export const fetchCartList = () => axiosCommonInstance.get("cart/list");

/**
 * Synchronize local guest cart with user server-side cart.
 * @param {Array} cartData
 * @returns {Promise<Object>} raw axios response
 */
export const syncCartCreate = (cartData) => axiosCommonInstance.post("cart/create", cartData);
