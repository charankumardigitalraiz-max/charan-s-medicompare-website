import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { axiosCommonInstance } from "../Apiservice.jsx";
import toast from "react-hot-toast";
import { useLocation as useLocationContext } from "./LocationContext";

const defaultCartValue = {
  _isDefault: true, // Flag to identify default value
  cartItems: [],

  isLoading: false,
  isInitialized: false,
  addItem: async () => {
    return false;
  },
  incrementItem: async () => {
    // CartProvider not initialized
  },
  decrementItem: async () => {
    // CartProvider not initialized
  },
  removeItem: async () => {
    // CartProvider not initialized
  },
  clearCart: () => {
    // CartProvider not initialized
  },
  getQuantity: () => 0,
  getTotalCount: () => 0,
  getUniqueItemCount: () => 0,
  getTotalPrice: () => 0,
  generateCartKey: () => "",
  mergeLocalCartToServer: async () => {
    // CartProvider not initialized
  },
  getCart: () => [],
  saveCart: () => {
    // CartProvider not initialized
  },
};

// Create Cart Context
const CartContext = createContext(defaultCartValue);

// Storage key
const CART_STORAGE_KEY = "cart";

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [relevantProducts, setRelevantProducts] = useState([]);
  const [walletAmount, setWalletAmount] = useState(0);
  const { selectedPincode, latitude, longitude } = useLocationContext();

  const syncInProgress = useRef(false);
  const addInProgress = useRef(new Set());
  const cartInitialized = useRef(false);
  const pincodeErrorShown = useRef(new Set());
  const lastRefreshedPincode = useRef(null);
  const cartItemsRef = useRef(cartItems);

  useEffect(() => {
    cartItemsRef.current = cartItems;
  }, [cartItems]);

  // Check if user is logged in
  const isLoggedIn = useCallback(() => {
    const token = localStorage.getItem("medicomparestoken");
    return !!token;
  }, []);

  // Get auth headers
  const getHeaders = useCallback(() => {
    const token = localStorage.getItem("medicomparestoken");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  }, []);

  // ==================== LOCAL STORAGE OPERATIONS ====================

  // Load cart from localStorage
  const loadFromLocalStorage = useCallback(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed : [];

      }
    } catch (error) {
      // Error loading cart from localStorage
    }
    return [];
  }, []);

  // Save cart to localStorage (guest cart — do not call server here; merge runs on login)
  const saveToLocalStorage = useCallback((items) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      // Error saving cart to localStorage
    }
  }, []);

  // Guest cart: localStorage first, then in-memory (cart/before must not send [])
  const getGuestCartSnapshot = useCallback(() => {
    const fromStorage = loadFromLocalStorage();
    if (fromStorage.length > 0) return fromStorage;
    if (cartItemsRef.current.length > 0) return cartItemsRef.current;
    return [];
  }, [loadFromLocalStorage]);

  const formatGuestCartForApi = useCallback((items) => {
    return items
      .map((item) => ({
        productId: item.productId || item.tabletId,
        vendorId: item.vendorId,
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
        bookingType: item.bookingType || item.bookingtype || "cart",
        type: item.type || "normal",
        packageId: item.packageId || null,
      }))
      .filter((item) => item.productId && item.vendorId);
  }, []);

  // ==================== CART KEY GENERATION ====================

  // Generate unique cart key for an item
  const generateCartKey = useCallback((vendorId, productId, variantId) => {
    if (variantId) {
      return `${vendorId}_${variantId}`;
    }
    return `${vendorId}_${productId}`;
  }, []);

  // ==================== API OPERATIONS ====================

  const fetchServerCart = useCallback(async () => {

    try {
      let response;
      if (isLoggedIn()) {
        response = await axiosCommonInstance.get("cart/list", {
          headers: getHeaders(),
          params: selectedPincode ? { pincode: selectedPincode } : {},
        });
      } else {
        const guestPayload = formatGuestCartForApi(getGuestCartSnapshot());
        response = await axiosCommonInstance.post(
          "cart/before",
          { bodyData: guestPayload },
          {
            params: selectedPincode ? { pincode: selectedPincode } : {},
          },
        );
      }
      const data = response.data?.data;

      const relevant = Array.isArray(data?.relevantProducts)
        ? data.relevantProducts
        : [];
      setRelevantProducts(relevant);

      // Extract wallet amount from API response
      const wallet = data?.walletamount || 0;
      setWalletAmount(wallet);


      // if (!isLoggedIn()) {
      //   const local = loadFromLocalStorage();
      //   if (local.length > 0) {
      //     setCartItems(local);
      //     return local; 
      //   }
      //   return [];
      // }

      if (data && Array.isArray(data.cart)) {
        const mapped = data.cart.map((item, index) => {
          // Extract all possible nested structures
          const cartId = item.cartId || item._id;
          const productDetails = item.productDetails || {};
          const tabletDetails =
            productDetails.tabletDetails || productDetails || {};
          const vendorDetails = item.vendorDetails || {};
          const businessProfile =
            vendorDetails.businessProfile ||
            vendorDetails.bussinessdetails ||
            {};
          const packageDetails = item.packageDetails || {};
          const tabletvariant = item.tabletvariantDetails || {};
          const productvariants = item.variantDetails || {};

          // Look for variant in arrays if not found directly
          const tabletVariantsArr = Array.isArray(item.variants)
            ? tabletDetails.variants
            : [];
          const productVariantsArr = Array.isArray(productDetails.variant)
            ? productDetails.variant
            : [];

          // Find the matching variant
          const foundTabletVariant = tabletvariant._id
            ? tabletvariant
            : tabletVariantsArr.find(
              (v) => String(v?._id) === String(item.variantId),
            ) || {};

          const foundProductVariant =
            productvariants._id || productvariants.variantId
              ? productvariants
              : productVariantsArr.find(
                (v) =>
                  String(v?._id || v?.variantId) === String(item.variantId),
              ) || {};

          const isPackage = item.type === "package" || !!item.packageId;
          const vendorId = item.vendorId;
          const variantId = item.variantId || null;
          const productId = isPackage
            ? null
            : item.productId ||
            tabletDetails._id ||
            productDetails._id ||
            item._id;
          const packageId =
            item.packageId || (isPackage ? packageDetails._id : null);
          const cartKey = isPackage
            ? `${vendorId}_pkg_${packageId}`
            : generateCartKey(vendorId, productId, variantId);
          const files =
            (foundTabletVariant.files?.length > 0
              ? foundTabletVariant.files
              : null) ||
            (foundProductVariant.files?.length > 0
              ? foundProductVariant.files
              : null) ||
            (tabletvariant.files?.length > 0 ? tabletvariant.files : null) ||
            (tabletDetails.files?.length > 0 ? tabletDetails.files : null) ||
            (productDetails.files?.length > 0 ? productDetails.files : null) ||
            (packageDetails.files?.length > 0 ? packageDetails.files : null) ||
            item.files ||
            [];
          const name = isPackage
            ? packageDetails.name || item.name || "Product"
            : tabletDetails.name ||
            productDetails.name ||
            item.name ||
            "Product";

          // Extract price
          const price = isPackage
            ? packageDetails.price || item.price || 0
            : foundProductVariant.price ||
            foundTabletVariant.price ||
            tabletvariant.price ||
            productvariants.price ||
            tabletDetails.price ||
            productDetails.price ||
            item.price ||
            0;
          const discountprice = isPackage
            ? packageDetails.discountprice ||
            packageDetails.discountPrice ||
            null
            : foundProductVariant.discountprice ||
            foundProductVariant.discountPrice ||
            productvariants.discountprice ||
            productvariants.discountPrice ||
            tabletvariant.discountprice ||
            tabletvariant.discountPrice ||
            productDetails.discountprice ||
            productDetails.discountPrice ||
            item.discountprice ||
            item.discountPrice ||
            null;

          const discountType = isPackage
            ? packageDetails.discountType ||
            null
            : foundProductVariant.discountType ||
            productvariants.discountType ||
            tabletvariant.discountType ||
            productDetails.discountType ||
            item.discountType ||
            null;

          // Extract vendor name
          const vendorName =
            businessProfile.name ||
            vendorDetails.name ||
            vendorDetails.businessName ||
            item.vendorName ||
            "Vendor";

          // Extract vendor image
          const vendorImage =
            businessProfile.bussiness_image?.url ||
            businessProfile.business_image?.url ||
            vendorDetails.bussiness_image?.url ||
            vendorDetails.business_image?.url ||
            vendorDetails.bussinessdetails?.bussiness_image?.url ||
            vendorDetails.businessProfile?.bussiness_image?.url ||
            item.vendorImage ||
            null;

          // Extract variant name
          const variantName =
            foundTabletVariant.name ||
            foundProductVariant.name ||
            tabletvariant.name ||
            productvariants.name ||
            item.variantName ||
            null;

          const cartItem = {
            cartId: cartId,
            _id: cartId,
            cartKey,
            productId,
            vendorId,
            variantId,
            quantity: item.quantity || 1,
            productDetails,
            name,
            price,
            discountprice, // Add discountprice to cart item
            discountType, // Add discountType to cart item
            perDayRent: tabletDetails.perDayRent || productDetails.perDayRent || item.perDayRent || null, // Add perDayRent for rental items
            files: Array.isArray(files) ? files : [],
            imageUrl: tabletDetails.imageUrl || productDetails.imageUrl || [],
            vendorName,
            vendorImage, // Add vendor image to cart item
            variantName,
            stock:
              foundProductVariant.stock ||
              foundTabletVariant.stock ||
              tabletvariant.stock ||
              item.stock ||
              999,
            slug: tabletDetails.slug || productDetails.slug || "",
            type: item.type || (isPackage ? "package" : "normal"),
            packageId: packageId,
            tabletId: isPackage ? null : tabletDetails._id || productId,
            returnDetails: productDetails.returnDetails || item.returnDetails || null,
          };

          return cartItem;
        });
        if (mapped.length > 0) return mapped;
      }

      // Guest: keep local items if API returns empty (e.g. pincode filter, empty bodyData race)
      if (!isLoggedIn()) {
        const localFallback = getGuestCartSnapshot();
        if (localFallback.length > 0) return localFallback;
      }
    } catch (error) {
      // Handle error
      if (!isLoggedIn()) {
        const localFallback = getGuestCartSnapshot();
        if (localFallback.length > 0) return localFallback;
      }
    }
    return [];
  }, [
    isLoggedIn,
    getHeaders,
    generateCartKey,
    selectedPincode,
    getGuestCartSnapshot,
    formatGuestCartForApi,
  ]);

  // Add item to server cart
  const addToServerCart = useCallback(
    async (item) => {
      if (!isLoggedIn()) {
        return false;
      }

      try {
        const payload = [
          {
            productId: item.productId || item.tabletId,
            vendorId: item.vendorId,
            variantId: item.variantId || null,
            quantity: item.quantity || 1,
            bookingType: item.bookingType || "cart",
            type: item.type || "normal",
            packageId: item.packageId || null,
            pincode: selectedPincode || null,
          },
        ];

        await axiosCommonInstance.post("cart/create", payload, {
          headers: getHeaders(),
        });
        return true;
      } catch (error) {
        // Error adding to server cart
        return false;
      }
    },
    [isLoggedIn, getHeaders, selectedPincode],
  );

  // Update item on server
  const updateServerCart = useCallback(
    async (type, productId, vendorId, variantId = null, packageId = null) => {
      if (!isLoggedIn()) return false;

      try {
        const payload = {
          type, // "increment", "decrement", or "delete"
          productId,
          vendorId,
          variantId,
          packageId,
          bookingtype: "cart",
          pincode: selectedPincode || null,
        };

        await axiosCommonInstance.post("cart/update-delete", payload, {
          headers: getHeaders(),
        });
        return true;
      } catch (error) {
        // Don't show error for 404 - might be endpoint not available
        if (error.response?.status !== 404) {
          // Error updating server cart
        }
        return false;
      }
    },
    [isLoggedIn, getHeaders, selectedPincode],
  );

  const mergeLocalCartToServer = useCallback(async () => {
    if (!isLoggedIn() || syncInProgress.current) return;

    syncInProgress.current = true;
    try {
      let localCart = getGuestCartSnapshot();
      if (localCart.length === 0) {
        syncInProgress.current = false;
        return;
      }
      saveToLocalStorage(localCart);

      // Preserve local cart items in state before merging
      setCartItems(localCart);

      // Fetch server cart first
      const serverCart = await fetchServerCart();

      // Find items to add (not already on server)
      const itemsToAdd = localCart.filter((localItem) => {
        return !serverCart.some(
          (serverItem) =>
            String(serverItem.productId || serverItem.tabletId) ===
            String(localItem.productId || localItem.tabletId) &&
            String(serverItem.vendorId) === String(localItem.vendorId) &&
            String(serverItem.variantId || "") ===
            String(localItem.variantId || ""),
        );
      });

      if (itemsToAdd.length > 0) {
        const payload = itemsToAdd.map((item) => ({
          productId: item.productId || item.tabletId,
          vendorId: item.vendorId,
          variantId: item.variantId || null,
          quantity: item.quantity || 1,
          bookingType: item.bookingType || "cart",
          type: item.type || "normal",
          packageId: item.packageId || null,
          pincode: selectedPincode || null,
        }));

        await axiosCommonInstance.post("cart/create", payload, {
          headers: getHeaders(),
        });
        toast.success(
          itemsToAdd.length === 1
            ? "Cart synced to your account"
            : `${itemsToAdd.length} items synced to your account`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 300));
      const updatedCart = await fetchServerCart();
      if (updatedCart.length > 0) {
        setCartItems(updatedCart);
        saveToLocalStorage(updatedCart);
      } else if (localCart.length > 0) {
        setCartItems(localCart);
        setTimeout(async () => {
          const retryCart = await fetchServerCart();
          if (retryCart.length > 0) {
            setCartItems(retryCart);
            saveToLocalStorage(retryCart);
          }
        }, 1000);
      }

      window.dispatchEvent(new Event("cartUpdated"));
    } catch (error) {
      const message =
        error.response?.data?.message ||
        error.message ||
        "Could not sync cart to your account";
      toast.error(message);
      const localCart = getGuestCartSnapshot();
      if (localCart.length > 0) {
        setCartItems(localCart);
      }
    } finally {
      syncInProgress.current = false;
    }
  }, [
    isLoggedIn,
    getGuestCartSnapshot,
    fetchServerCart,
    getHeaders,
    saveToLocalStorage,
    selectedPincode,
  ]);

  const refreshCart = useCallback(async () => {
    const guestBeforeFetch = !isLoggedIn() ? getGuestCartSnapshot() : [];
    if (guestBeforeFetch.length > 0) {
      saveToLocalStorage(guestBeforeFetch);
    }

    const serverCart = await fetchServerCart();

    if (isLoggedIn()) {
      setCartItems(serverCart);
      if (serverCart.length > 0) saveToLocalStorage(serverCart);
      return serverCart;
    }

    // Guest: never wipe local cart when API returns empty
    if (serverCart.length > 0) {
      setCartItems(serverCart);
      saveToLocalStorage(serverCart);
      return serverCart;
    }

    if (guestBeforeFetch.length > 0) {
      setCartItems(guestBeforeFetch);
      saveToLocalStorage(guestBeforeFetch);
      return guestBeforeFetch;
    }

    setCartItems([]);
    return [];
  }, [
    fetchServerCart,
    isLoggedIn,
    getGuestCartSnapshot,
    saveToLocalStorage,
  ]);

  // ==================== CART OPERATIONS ====================

  // Get quantity for a specific item
  const getQuantity = useCallback(
    (vendorId, productId, variantId = null) => {
      const cartKey = generateCartKey(vendorId, productId, variantId);
      const item = cartItems.find(
        (i) =>
          i.cartKey === cartKey ||
          (String(i.vendorId) === String(vendorId) &&
            String(i.productId || i.tabletId) === String(productId) &&
            String(i.variantId || "") === String(variantId || "")),
      );
      return item?.quantity || 0;
    },
    [cartItems, generateCartKey],
  );

  // Add item to cart
  const addItem = useCallback(
    async (itemData, variant = null, options = {}) => {
      // Generate cart key to check for ongoing operations
      let selectedVariant = null;

      if (variant) {
        selectedVariant = Array.isArray(variant) ? variant[0] : variant;
      } else if (
        itemData?.variants &&
        Array.isArray(itemData.variants) &&
        itemData.variants.length > 0
      ) {
        selectedVariant = itemData.variants[0];
      } else if (
        itemData?.tabletdetails?.variants &&
        Array.isArray(itemData.tabletdetails.variants) &&
        itemData.tabletdetails.variants.length > 0
      ) {
        // Variants inside tabletdetails (fallback)
        selectedVariant = itemData.tabletdetails.variants[0];
      }

      const variantId =
        selectedVariant?.variantId ||
        selectedVariant?._id ||
        selectedVariant?.id ||
        null;
      const productId =
        itemData?.tabletdetails?._id ||
        itemData?.tabletdetails?.id ||
        itemData?.productId ||
        itemData?.tabletId ||
        itemData?._id ||
        itemData?.id;

      const vendorId =
        itemData?.vendordetails?.vendorId ||
        itemData?.vendordetails?._id ||
        itemData?.vendordetails?.id ||
        itemData?.vendorId ||
        itemData?.vendor?.vendorId ||
        itemData?.vendor?._id ||
        itemData?.vendor?.id ||
        itemData?.vendorId

      const cartKey = generateCartKey(vendorId, productId, variantId);

      // Check if this item is already being added
      if (addInProgress.current.has(cartKey)) {
        return false; // Prevent duplicate API calls
      }

      if (!productId || !vendorId) {
        toast.error("Product information is incomplete");
        return false;
      }

      setIsLoading(true);
      addInProgress.current.add(cartKey);

      try {

        const quantity = options.quantity || 1;
        const existingQty = getQuantity(vendorId, productId, variantId);
        const newQty = existingQty + quantity;

        // Extract price and discountprice - check itemData first (passed from components)
        const basePrice =
          itemData?.price || // Direct price from item prop (highest priority - components pass effectivePrice here)
          selectedVariant?.price ||
          itemData?.variants?.[0]?.price ||
          itemData?.tabletdetails?.price ||
          0;

        const baseDiscountprice =
          itemData?.discountprice || // Direct discountprice from item prop (highest priority)
          itemData?.discountPrice ||
          options?.discountprice ||
          options?.discountPrice ||
          selectedVariant?.discountprice ||
          selectedVariant?.discountPrice ||
          itemData?.variants?.[0]?.discountprice ||
          itemData?.variants?.[0]?.discountPrice ||
          itemData?.tabletdetails?.discountprice ||
          itemData?.tabletdetails?.discountPrice ||
          null;

        const baseDiscountType =
          itemData?.discountType || // Direct discountType from item prop (highest priority)
          options?.discountType ||
          selectedVariant?.discountType ||
          itemData?.variants?.[0]?.discountType ||
          itemData?.tabletdetails?.discountType ||
          null;

        const effectivePrice =
          baseDiscountprice && baseDiscountprice > 0
            ? baseDiscountprice
            : basePrice;

        // Build cart item
        const newItem = {
          cartKey,
          productId,
          tabletId: productId,
          vendorId,
          variantId,
          quantity: newQty,
          name: itemData?.tabletdetails?.name || itemData?.name || "",
          slug: itemData?.tabletdetails?.slug || itemData?.slug || "",
          price: effectivePrice, // Use effective price (discountprice if available, else price)
          discountprice: baseDiscountprice, // Store original discountprice for reference
          discountType: baseDiscountType, // Store discountType for percentage calculation
          perDayRent: itemData?.perDayRent || options?.perDayRent || null, // Add perDayRent for rental items
          files:
            selectedVariant?.files ||
            itemData?.variants?.[0]?.files ||
            itemData?.files ||
            itemData?.tabletdetails?.files ||
            [],
          imageUrl: itemData?.tabletdetails?.imageUrl || itemData?.imageUrl || [], // Add imageUrl from API response
          vendorName:
            itemData?.vendordetails?.name || itemData?.vendorName || "",
          variantName:
            selectedVariant?.name || itemData?.variants?.[0]?.name || "",
          selectedVariantName:
            selectedVariant?.name || itemData?.variants?.[0]?.name || "",
          stock:
            selectedVariant?.stock ||
            itemData?.variants?.[0]?.stock ||
            itemData?.stock ||
            999,
          type: options.type || "normal",
          packageId: options.packageId || null,
          bookingType: options.bookingType || "cart",
          addedAt: new Date().toISOString(),
        };
        // Remove all existing items with the same productId (regardless of vendor)
        // This ensures only one vendor's product can be in cart at a time
        const removeExistingProduct = (items) => {
          return items.filter((i) => {
            const itemProductId = i.productId || i.tabletId;
            return String(itemProductId) !== String(productId);
          });

        };

        // Update state + localStorage from the same snapshot (avoid stale cartItems)
        let updatedCart;
        setCartItems((prev) => {
          const cleaned = removeExistingProduct(prev);
          const existingIndex = cleaned.findIndex((i) => i.cartKey === cartKey);
          if (existingIndex > -1) {
            updatedCart = [...cleaned];
            updatedCart[existingIndex] = {
              ...updatedCart[existingIndex],
              quantity: newQty,
            };
          } else {
            updatedCart = [...cleaned, newItem];
          }
          return updatedCart;
        });
        saveToLocalStorage(updatedCart);


        // Sync with server if logged in - remove existing product from server first
        if (isLoggedIn()) {
          // Remove all existing products with same productId from server
          try {
            const serverCart = await fetchServerCart();
            const itemsToRemove = serverCart.filter(
              (item) =>
                String(item.productId || item.tabletId) === String(productId) &&
                String(item.vendorId) !== String(vendorId),
            );

            // Remove each existing product from server
            for (const itemToRemove of itemsToRemove) {
              await updateServerCart(
                "delete",
                itemToRemove.productId || itemToRemove.tabletId,
                itemToRemove.vendorId,
                itemToRemove.variantId,
              );

            }

          } catch (error) {
            // Error removing existing product from server
          }

          // Now add the new item
          await addToServerCart(newItem);
          refreshCart();
          // 
        } else {
          // Check if product was replaced for guest users
          const hadExisting = cartItems.some((item) => {
            const itemProductId = item.productId || item.tabletId;
            return (
              String(itemProductId) === String(productId) &&
              String(item.vendorId) !== String(vendorId)
            );
          });
        }

        return true;
      } catch (error) {
        toast.error("Failed to add to cart");
        return false;
      } finally {
        setIsLoading(false);
        addInProgress.current.delete(cartKey); // Remove from tracking set
      }
    },
    [
      cartItems,
      generateCartKey,
      getQuantity,
      saveToLocalStorage,
      isLoggedIn,
      addToServerCart,
      fetchServerCart,
      updateServerCart,
      refreshCart,
    ],
  );

  // Increment item quantity
  const incrementItem = useCallback(
    async (
      vendorId,
      productId,
      variantId = null,
      maxStock = 999,
      packageId = null,
    ) => {
      // For packages: use packageId-based cartKey, for normal: use productId-based
      const isPackage = !!packageId && !productId;
      const cartKey = isPackage
        ? `${vendorId}_pkg_${packageId}`
        : generateCartKey(vendorId, productId, variantId);

      // Find existing item by cartKey
      const existingItem = cartItems.find((i) => i.cartKey === cartKey);
      const currentQty = existingItem?.quantity || 0;

      if (currentQty >= maxStock) {
        toast.error("Maximum stock reached");
        return false;
      }

      const newQty = currentQty + 1;
      const itemPackageId = packageId || existingItem?.packageId || null;

      let updatedCart;
      setCartItems((prev) => {
        updatedCart = prev.map((item) =>
          item.cartKey === cartKey ? { ...item, quantity: newQty } : item,
        );
        return updatedCart;
      });
      saveToLocalStorage(updatedCart);

      if (isLoggedIn()) {
        await updateServerCart(
          "increment",
          productId,
          vendorId,
          variantId,
          itemPackageId,
        );
      }

      return true;
    },
    [
      cartItems,
      generateCartKey,
      saveToLocalStorage,
      isLoggedIn,
      updateServerCart,
    ],
  );

  // Decrement item quantity
  const decrementItem = useCallback(
    async (vendorId, productId, variantId = null, packageId = null) => {
      const isPackage = !!packageId && !productId;
      const cartKey = isPackage
        ? `${vendorId}_pkg_${packageId}`
        : generateCartKey(vendorId, productId, variantId);

      // Find existing item by cartKey
      const existingItem = cartItems.find((i) => i.cartKey === cartKey);
      const currentQty = existingItem?.quantity || 0;

      if (currentQty <= 0) return false;

      const newQty = currentQty - 1;
      const itemPackageId = packageId || existingItem?.packageId || null;

      if (newQty <= 0) {
        let updatedCart;
        setCartItems((prev) => {
          updatedCart = prev.filter((item) => item.cartKey !== cartKey);
          return updatedCart;
        });
        saveToLocalStorage(updatedCart);

        if (isLoggedIn()) {
          await updateServerCart(
            "delete",
            productId,
            vendorId,
            variantId,
            itemPackageId,
          );
        }
      } else {
        let updatedCart;
        setCartItems((prev) => {
          updatedCart = prev.map((item) =>
            item.cartKey === cartKey ? { ...item, quantity: newQty } : item,
          );
          return updatedCart;
        });
        saveToLocalStorage(updatedCart);

        if (isLoggedIn()) {
          await updateServerCart(
            "decrement",
            productId,
            vendorId,
            variantId,
            itemPackageId,
          );
        }
      }

      return true;
    },
    [
      cartItems,
      generateCartKey,
      saveToLocalStorage,
      isLoggedIn,
      updateServerCart,
    ],
  );

  const removeItem = useCallback(
    async (vendorId, productId, variantId = null, packageId = null) => {
      const isPackage = !!packageId && !productId;
      const cartKey = isPackage
        ? `${vendorId}_pkg_${packageId}`
        : generateCartKey(vendorId, productId, variantId);

      const existingItem = cartItems.find((i) => i.cartKey === cartKey);
      const itemPackageId = packageId || existingItem?.packageId || null;

      let updatedCart;
      setCartItems((prev) => {
        updatedCart = prev.filter((item) => item.cartKey !== cartKey);
        return updatedCart;
      });
      saveToLocalStorage(updatedCart);

      if (isLoggedIn()) {
        await updateServerCart(
          "delete",
          productId,
          vendorId,
          variantId,
          itemPackageId,
        );
      }

      return true;
    },
    [
      cartItems,
      generateCartKey,
      saveToLocalStorage,
      isLoggedIn,
      updateServerCart,
    ],
  );

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    window.dispatchEvent(new Event("cartUpdated"));
  }, []);

  const getTotalCount = useCallback(() => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cartItems]);

  const getUniqueItemCount = useCallback(() => {
    return cartItems.length;
  }, [cartItems]);

  const getTotalPrice = useCallback(() => {
    return cartItems.reduce(
      (sum, item) => sum + (item.price || 0) * (item.quantity || 0),
      0,
    );
  }, [cartItems]);

  useEffect(() => {
    const initCart = async () => {
      // Prevent multiple initializations
      if (cartInitialized.current) return;
      cartInitialized.current = true;

      if (isLoggedIn()) {
        const serverCart = await fetchServerCart();

        if (serverCart.length > 0) {
          setCartItems(serverCart);
          saveToLocalStorage(serverCart);
        } else {
          const localCart = getGuestCartSnapshot();
          if (localCart.length > 0) {
            setCartItems(localCart);
            await mergeLocalCartToServer();
          } else {
            setCartItems([]);
          }
        }
      } else {
        const localCart = getGuestCartSnapshot();
        setCartItems(localCart);
      }
      setIsInitialized(true);
    };

    initCart();
  }, []); // Only run once on mount

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === CART_STORAGE_KEY) {
        const newCart = e.newValue ? JSON.parse(e.newValue) : [];
        setCartItems(newCart);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Clear pincode error tracking when pincode changes
  useEffect(() => {
    pincodeErrorShown.current.clear();
  }, [selectedPincode]);

  // After login: push guest cart (localStorage) to server
  const syncCartOnLogin = useCallback(async () => {
    if (!isLoggedIn() || syncInProgress.current) return;

    const localCart = getGuestCartSnapshot();
    if (localCart.length > 0) {
      saveToLocalStorage(localCart);
      await mergeLocalCartToServer();
      return;
    }

    const serverCart = await fetchServerCart();
    setCartItems(serverCart);
    if (serverCart.length > 0) {
      saveToLocalStorage(serverCart);
    }
  }, [
    isLoggedIn,
    getGuestCartSnapshot,
    mergeLocalCartToServer,
    fetchServerCart,
    saveToLocalStorage,
  ]);

  useEffect(() => {
    let previousToken = localStorage.getItem("medicomparestoken");

    const handleUserLoggedIn = () => {
      syncCartOnLogin();
    };

    const checkTokenChange = () => {
      const currentToken = localStorage.getItem("medicomparestoken");
      if (currentToken && !previousToken) {
        previousToken = currentToken;
        syncCartOnLogin();
      } else if (!currentToken && previousToken) {
        previousToken = null;
      }
    };

    window.addEventListener("userLoggedIn", handleUserLoggedIn);

    const handleTokenStorageChange = (e) => {
      if (e.key === "medicomparestoken" && e.newValue && !e.oldValue) {
        previousToken = e.newValue;
        syncCartOnLogin();
      }
    };

    window.addEventListener("storage", handleTokenStorageChange);
    const tokenCheckInterval = setInterval(checkTokenChange, 500);

    return () => {
      window.removeEventListener("userLoggedIn", handleUserLoggedIn);
      window.removeEventListener("storage", handleTokenStorageChange);
      clearInterval(tokenCheckInterval);
    };
  }, [syncCartOnLogin]);

  // Refresh cart when pincode changes (not on first app load — see lastRefreshedPincode)
  useEffect(() => {
    if (!selectedPincode || !isInitialized) return;

    // First time pincode is set after load (from saved location): skip API
    if (lastRefreshedPincode.current === null) {
      lastRefreshedPincode.current = selectedPincode;
      return;
    }

    if (lastRefreshedPincode.current === selectedPincode) return;
    lastRefreshedPincode.current = selectedPincode;

    const timeoutId = setTimeout(() => {
      if (!isLoggedIn()) {
        const snap = getGuestCartSnapshot();
        if (snap.length === 0) return;
        saveToLocalStorage(snap);
      }
      refreshCart();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [
    selectedPincode,
    isInitialized,
    refreshCart,
    isLoggedIn,
    getGuestCartSnapshot,
    saveToLocalStorage,
  ]);

  const value = {
    // State
    cartItems,
    isLoading,
    isInitialized,
    relevantProducts,
    walletAmount,
    // Operations
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    refreshCart,

    // Queries
    getQuantity,
    getTotalCount,
    getUniqueItemCount,
    getTotalPrice,

    // Location
    selectedPincode,
    latitude,
    longitude,

    // Utilities
    generateCartKey,
    mergeLocalCartToServer,

    // For backward compatibility
    getCart: () => cartItems,
    saveCart: saveToLocalStorage,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context || context._isDefault) {
    return defaultCartValue;
  }
  return context;
};

export default CartContext;
