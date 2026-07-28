import { useCartContext } from "../context/CartContext";

/**
 * useCart - Hook for cart operations
 * Uses CartContext internally for Flipkart-like cart behavior
 * Provides backward compatibility with existing components
 */
export const useCart = () => {
  const context = useCartContext();
  
  const {
    cartItems,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    getQuantity,
    getTotalCount,
    generateCartKey,
    getCart,
    saveCart,
  } = context;

  // Backward compatible cartQuantities object
  const cartQuantities = cartItems.reduce((acc, item) => {
    acc[item.cartKey] = item.quantity;
    return acc;
  }, {});

  // Backward compatible getCartQuantity
  const getCartQuantity = (vendorId, productId, variantId = null) => {
    return getQuantity(vendorId, productId, variantId);
  };

  // Backward compatible syncCartAdd
  const syncCartAdd = async (item) => {
    const success = await addItem(
      {
        tabletdetails: { _id: item.productId || item.tabletId, name: item.name, slug: item.slug, files: item.files },
        vendordetails: { _id: item.vendorId, name: item.vendorName },
        price: item.price,
        stock: item.stock,
      },
      item.variantId ? { _id: item.variantId, name: item.variantName, price: item.price, files: item.files } : null,
      {
        quantity: item.quantity || 1,
        type: item.type,
        packageId: item.packageId,
        bookingType: item.bookingType,
      }
    );
    return { data: success ? cartItems : [] };
  };

  // Backward compatible syncCartUpdate
  const syncCartUpdate = async (type, productId, vendorId, bookingType = "cart", cartItemId = null, packageId = null, variantId = null) => {
    if (type === "increment") {
      return await incrementItem(vendorId, productId, variantId);
    } else if (type === "decrement") {
      return await decrementItem(vendorId, productId, variantId);
    } else if (type === "delete") {
      return await removeItem(vendorId, productId, variantId);
    }
    return false;
  };

  // Backward compatible getServerCartQuantity (now just uses local)
  const getServerCartQuantity = async (productId, vendorId, variantId = null) => {
    return getQuantity(vendorId, productId, variantId);
  };

  // Backward compatible getcartdetailsbyproductid
  const getcartdetailsbyproductid = (productId, vendorId, variantId = null) => {
    const cartKey = generateCartKey(vendorId, productId, variantId);
    return cartItems.find(item => 
      item.cartKey === cartKey ||
      (String(item.vendorId) === String(vendorId) &&
       String(item.productId || item.tabletId) === String(productId) &&
       String(item.variantId || "") === String(variantId || ""))
    ) || null;
  };

  return {
    // State
    cartQuantities,
    quantities: cartQuantities,
    setCartQuantities: () => {}, // No-op, state is managed by context
    setQuantities: () => {}, // No-op, state is managed by context
    
    // Operations
    getCart,
    saveCart,
    getCartQuantity,
    syncCartAdd,
    syncCartUpdate,
    getServerCartQuantity,
    getcartdetailsbyproductid,
    
    // New context methods
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    getQuantity,
    getTotalCount,
  };
};
