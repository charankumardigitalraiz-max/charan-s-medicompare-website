import { axiosUserInstance } from "../Apiservice.jsx";

/**
 * Create a new equipment rental booking.
 * @param {Object} rentalData
 * @returns {Promise<Object>} raw axios response
 */
export const createRental = (rentalData) => axiosUserInstance.post("/rentals/create", rentalData);
