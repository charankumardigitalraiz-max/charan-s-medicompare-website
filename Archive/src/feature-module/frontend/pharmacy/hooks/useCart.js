import { useState, useEffect } from "react";
import { axiosCommonInstance } from "../../../../Apiservice.jsx";
import toast from "react-hot-toast";

export const useCart = () => {
  const [cartQuantities, setCartQuantities] = useState({});
  const [quantities, setQuantities] = useState({});

  const getCart = () => {
    const cart = localStorage.getItem("cart");
    return cart ? JSON.parse(cart) : [];
  };

  const saveCart = (cart) => {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const getcartdetailsbyproductid = async (productId, vendorId) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return null;
    try {
      const response = await axiosCommonInstance.get(
        `cart/detail/${productId}/${vendorId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      return response.data.data.cart[0];
    } catch (error) {
      return null;
    }
  };

  const getServerCartQuantity = async (productId, vendorId, type) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return null;

    try {
      const cartDetails = await getcartdetailsbyproductid(productId, vendorId);
      if (type === "increment" || type === "decrement") {
        return cartDetails?.quantity || 0;
      }
      return cartDetails?.quantity || 0;
    } catch (error) {
      return 0;
    }
  };

  const getCartQuantity = (vendorId, productId, variantId) => {
    const key = variantId
      ? `${vendorId}_${variantId}`
      : `${vendorId}_${productId}`;
    const token = localStorage.getItem("medicomparestoken");

    // Logged-in user
    if (token) {
      return cartQuantities[key] || 0;
    }

    // Guest user (localStorage cart)
    const cartlist = getCart();
    const foundItem = cartlist.find((item) => {
      if (variantId) {
        return item.variantId === variantId && item.vendorId === vendorId;
      }
      return item.tabletId === productId && item.vendorId === vendorId;
    });
    return foundItem ? foundItem.quantity || 0 : 0;
  };

  const syncCartAdd = async (item) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return;

    try {
      const response = await axiosCommonInstance.post(
        "cart/addtocart",
        [item],
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data;
    } catch (err) {
      toast.error("Failed to add item to server cart");
      throw err;
    }
  };

  const syncCartUpdate = async (type, productId, vendorId, bookingType) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return;
    const payload = {
      type,
      productId,
      vendorId,
      bookingtype: bookingType || "cart",
    };
    try {
      await axiosCommonInstance.post("cart/update-delete", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
    } catch (err) {
      // Failed to update/delete cart
      toast.error("Failed to update cart on server");
      throw err;
    }
  };

  // Keep quantities synced across tabs/components
  useEffect(() => {
    const updateCartQuantities = () => {
      const token = localStorage.getItem("medicomparestoken");
      if (token) {
        // For logged-in users, quantities are managed via cartQuantities state
        // which gets updated when cart operations happen
      } else {
        // For guest users, sync from localStorage
        const cart = getCart();
        const quantities = {};
        cart.forEach((item) => {
          if (item.variantId) {
            const key = `${item.vendorId}_${item.variantId}`;
            quantities[key] = item.quantity;
          }
          // Also maintain backward compatibility
          if (item.tabletId && item.vendorId) {
            quantities[`${item.tabletId}_${item.vendorId}`] = item.quantity;
          }
        });
        setCartQuantities(quantities);
        setQuantities(quantities);
      }
    };

    updateCartQuantities();
    window.addEventListener("cartUpdated", updateCartQuantities);

    return () => {
      window.removeEventListener("cartUpdated", updateCartQuantities);
    };
  }, []);

  // Merge local cart to server on login
  useEffect(() => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return;
    const local = getCart();
    if (!Array.isArray(local) || local.length === 0) return;

    (async () => {
      try {
        const cartForAPI = local.map((item) => ({
          cartKey:
            item.cartKey ||
            `${item.vendorId}_${item.variantId || item.tabletId}`,
          id: item.id || item.tabletId || "",
          name: item.name || "",
          slug: item.slug || "",
          price: item.price || 0,
          quantity: item.quantity || 1,
          vendorId: item.vendorId || "",
          variantId: item.variantId || null,
          productId: item.productId || item.tabletId || "",
          bookingType: item.bookingType || "cart",
          type: item.type || "normal",
        }));

        await axiosCommonInstance.post("cart/create", cartForAPI, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        localStorage.removeItem("cart");
        window.dispatchEvent(new Event("cartUpdated"));
      } catch (err) {
        // Failed to merge local cart into server
      }
    })();
  }, []);

  return {
    cartQuantities,
    setCartQuantities,
    quantities,
    setQuantities,
    getCart,
    saveCart,
    getCartQuantity,
    syncCartAdd,
    syncCartUpdate,
    getServerCartQuantity,
  };
};

