import { useCartContext } from "../context/CartContext";
import toast from "react-hot-toast";

export const useAddToCart = () => {
  const { addItem, getQuantity, cartItems } = useCartContext();

  /**
   * @param {Object} item 
   * @param {Object} variant 
   * @param {Object} options
   */
  const addToCart = async (item, variant = null, options = {}) => {
    try {
      const success = await addItem(item, variant, options);
      
      return success;
    } catch (error) {
      toast.error("Failed to add to cart");
      return false;
    }
  };

  const setCartQuantities = () => {};

  return {
    addToCart,
    getQuantity,
    cartItems,
    setCartQuantities,
  };
};
