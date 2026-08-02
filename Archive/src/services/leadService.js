import { axiosUserInstance } from "../Apiservice.jsx";

/**
 * Submit a sales or booking lead.
 * @param {Object} leadPayload
 * @returns {Promise<Object>} raw axios response
 */
export const createLead = (leadPayload) => axiosUserInstance.post("lead/create", leadPayload);
