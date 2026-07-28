import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import { axiosCommonInstance } from "../Apiservice.jsx";
import { toast } from "sonner";
import { useLocation as useLocationContext } from "./LocationContext";

const defaultCartValue = {
  _isDefault: true, // Flag to identify default value
  cartItems: [],
  billingSummary: {},
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
  const [cartBilling, setCartBilling] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [relevantProducts, setRelevantProducts] = useState([]);
  const [couponDetails, setCouponDetails] = useState({});
  const [walletAmount, setWalletAmount] = useState(0);
  const [serviceFeeDetails, setServiceFeeDetails] = useState(null);
  const [vendorLocation, setVendorLocation] = useState(null)
  const [ServiceCartCount, setServiceCartCount] = useState(null);
  const [userDetails, setUserDetails] = useState(null)

  const { selectedPincode, latitude, longitude } = useLocationContext();
  const syncInProgress = useRef(false);
  const addInProgress = useRef(new Set());
  const cartInitialized = useRef(false);
  const pincodeErrorShown = useRef(new Set());
  const lastRefreshedPincode = useRef(null);
  const cartItemsRef = useRef(cartItems);
  const [serviceDetails, setServiceDetails] = useState(null);
  const lastFetchedTimeRef = useRef(0);
  const cachedCartItemsRef = useRef(null);

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
        servicefixedTypes: item.servicefixedTypes || item.serviceType || item.serviceTypes || null,
        serviceType: item.serviceType || item.servicefixedTypes || item.serviceTypes || null,
      }))
      .filter((item) => (item.productId || item.packageId) && item.vendorId);
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
  // Track active fetch promise and params to deduplicate concurrent requests
  const activeFetchPromiseRef = useRef(null);
  const lastFetchParamsRef = useRef(null);

  const fetchServerCart = useCallback(async () => {
    let cartType = null;
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      cartType = searchParams.get("carttype") || searchParams.get("cartType");
      if (cartType) {
        cartType = cartType.toLowerCase().trim();
        if (cartType === "medicines") {
          cartType = "medicine";
        }
      }
      if (!cartType) {
        const path = window.location.pathname.toLowerCase();
        if (path.includes("labtest") || path.includes("lab-test")) {
          cartType = "labtests";
        } else if (path.includes("medicalequipment") || path.includes("medical-equipment")) {
          cartType = "medicalequipment";
        } else if (path.includes("medicines") || path.includes("medicine") || path.includes("pharmacy")) {
          cartType = "medicine";
        }
      }
      // if (!cartType) {
      //   const localFixedType = localStorage.getItem("fixedType");
      //   if (localFixedType) {
      //     cartType = localFixedType;
      //   }
      // }
    }
    const token = localStorage.getItem("medicomparestoken");
    const key = `${token || "guest"}_${selectedPincode || ""}_${cartType || ""}`;

    const now = Date.now();
    if (cachedCartItemsRef.current && lastFetchParamsRef.current === key && (now - lastFetchedTimeRef.current < 2000)) {
      return cachedCartItemsRef.current;
    }

    if (activeFetchPromiseRef.current && lastFetchParamsRef.current === key) {
      return activeFetchPromiseRef.current;
    }

    const executeFetch = async () => {
      try {
        let response;
        if (isLoggedIn()) {
          const params = {
            ...(selectedPincode ? { pincode: selectedPincode } : {}),
            ...(cartType ? { cartType } : {}),
          };
          response = await axiosCommonInstance.get("cart/list", {
            headers: getHeaders(),
            params,
          });
        } else {
          const guestPayload = formatGuestCartForApi(getGuestCartSnapshot());
          const params = {
            ...(selectedPincode ? { pincode: selectedPincode } : {}),
            ...(cartType ? { cartType } : {}),
          };
          response = await axiosCommonInstance.post(
            "cart/before",
            { bodyData: guestPayload },
            {
              params,
            },
          );
        }
        const data = response.data?.data;

        const resolveProductFixedType = (p) => {
          return (
            p?.tabletDetails?.subcategoryDetails?.categoryDetails?.fixedType ||
            p?.tabletDetails?.subcategorys?.category?.fixedType ||
            p?.tabletDetails?.category?.fixedType ||
            p?.tabletDetails?.fixedType ||
            localStorage.getItem("fixedType") ||
            "medicine"
          );
        };
        const relevant = Array.isArray(data?.relevantProducts)
          ? data.relevantProducts.map((p) => ({
            ...p,
            resolvedFixedType: resolveProductFixedType(p),
          }))
          : [];

        //         const relevant = Array.isArray(data?.relevantProducts)
        // ? data.relevantProducts.map((p) => ({
        //   ...p,
        //   resolvedFixedType: resolveProductFixedType(p),
        // }))
        // : [];
        setUserDetails(data?.user)
        setRelevantProducts(relevant);
        setServiceDetails(data?.serviceFee || null);
        const coupons = data?.couponlist || data?.couponList || {};
        setCouponDetails(coupons);
        setServiceCartCount(data?.countByServiceType)
        // Extract wallet amount from API response
        const wallet = data?.walletamount || 0;
        setWalletAmount(wallet);

        // Extract service fee details (e.g. homeVisitFee for lab tests)
        const feeDetails =
          data?.serviceFeeDetails ||
          data?.servicefeedetails ||
          null;
        setServiceFeeDetails(feeDetails);

        setCartBilling(data?.billingSummary || null);
        // setVendorLocation(data?.vendorDetails)
        if (data && Array.isArray(data.cart)) {
          let rawCart = data.cart;
          // DEBUG: log to find where serviceFeeDetails lives
          // console.log("[CartContext] data keys:", Object.keys(data));
          // console.log("[CartContext] serviceFee from API:", data?.serviceFee);
          const isGrouped = rawCart.length > 0 && Array.isArray(rawCart[0].items);

          if (isGrouped) {
            const flatMerged = [];
            let extractedFeeDetails = null;
            let letvendorLocation = null;
            rawCart.forEach(group => {
              // Pick up serviceFeeDetails from the group itself or its items
              if (!serviceDetails) {
                extractedFeeDetails =
                  group.serviceFeeDetails ||
                  group.servicefeedetails ||
                  group.items?.[0]?.serviceFeeDetails ||
                  group.items?.[0]?.servicefeedetails ||
                  group.items?.[0]?.vendorDetails?.serviceFeeDetails ||
                  group.items?.[0]?.vendorDetails?.servicefeedetails ||
                  null;
              }
              letvendorLocation = group?.items?.[0]?.vendorDetails?.businessProfile?.location || group?.items?.[0]?.vendorDetails?.location || null;

              const patientInfo = {
                selectType: group.type || (group.patientId ? "family" : "self"),
                patientId: group.patientId || null,
                patientDetails: {
                  ...(group.patientDetails || {}),
                  selectType: group.type || (group.patientId ? "family" : "self"),
                  patientId: group.patientId || null
                }
              };

              group.items.forEach(item => {
                const productId = item.productId;
                const vendorId = item.vendorId;
                const variantId = item.variantId || null;
                const isPackage = item.type === "package" || !!item.packageId;
                const packageId = item.packageId || null;

                const existing = flatMerged.find(x => {
                  const xIsPackage = x.type === "package" || !!x.packageId;
                  if (isPackage && xIsPackage) {
                    return String(x.packageId) === String(packageId) &&
                      String(x.vendorId) === String(vendorId);
                  }
                  return String(x.productId) === String(productId) &&
                    String(x.vendorId) === String(vendorId) &&
                    String(x.variantId || "") === String(variantId || "");
                });

                if (existing) {
                  if (!existing.labTestPatients.some(p => String(p.patientId) === String(patientInfo.patientId) && p.selectType === patientInfo.selectType)) {
                    existing.labTestPatients.push(patientInfo);
                    existing.quantity = existing.labTestPatients.length;
                    existing.serviceDetails = serviceDetails;
                  }
                } else {
                  flatMerged.push({
                    ...item,
                    quantity: 1,
                    labTestPatients: [patientInfo],
                    serviceDetails: serviceDetails,
                    vendorLocation: letvendorLocation
                  });
                }
              });
            });

            // If we found serviceFeeDetails inside the groups/items, update state
            if (extractedFeeDetails) {
              setServiceFeeDetails(extractedFeeDetails);
            }
            if (letvendorLocation) {
              setVendorLocation(letvendorLocation)
            }

            rawCart = flatMerged;
          } else {
            // Non-grouped: scan raw items for serviceFeeDetails
            const itemFeeDetails =
              data.cart?.[0]?.serviceFeeDetails ||
              data.cart?.[0]?.servicefeedetails ||
              data.cart?.[0]?.vendorDetails?.serviceFeeDetails ||
              data.cart?.[0]?.vendorDetails?.servicefeedetails ||
              serviceDetails ||
              null;
            if (itemFeeDetails) {
              setServiceFeeDetails(itemFeeDetails);
            }
            const itemVendorLoc = data.cart?.[0]?.items?.[0]?.vendorDetails?.businessProfile?.location || data.cart?.[0]?.vendorDetails?.location || null;
            // console.log("itemVendorLoc", itemVendorLoc)
            if (itemVendorLoc) {
              setVendorLocation(itemVendorLoc);
            }
          }

          const mapped = rawCart.map((item, index) => {
            const cartId = item.cartId || item._id;
            const productDetails = item.productDetails || {};
            const tabletDetails =
              productDetails.tabletDetails || productDetails || {};
            // console.log("tablet details", tabletDetails)
            const vendorDetails = item.vendorDetails || {};
            const businessProfile =
              vendorDetails.businessProfile ||
              vendorDetails.bussinessdetails ||
              vendorDetails ||
              {};

            const isPackage = item.type === "package" || !!item.packageId;
            const packageDetails = item.packageDetails || {};
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
              : variantId
                ? `${vendorId}_${variantId}`
                : `${vendorId}_${productId}`;

            const productvariants = productDetails.variants?.[0] || {};
            const tabletvariant = tabletDetails.variants?.[0] || {};

            const foundProductVariant = variantId
              ? productDetails.variants?.find((v) => String(v._id) === String(variantId)) || {}
              : productvariants;

            const foundTabletVariant = variantId
              ? tabletDetails.variants?.find((v) => String(v._id) === String(variantId)) || {}
              : tabletvariant;

            const varientDetails = {
              name:
                item?.varientDetails?.name ||
                item?.variantDetails?.name ||
                item?.tabletvariantDetails?.name ||
                foundTabletVariant?.name ||
                foundProductVariant?.name ||
                tabletvariant?.name ||
                productvariants?.name ||
                null,
              image:
                item?.varientDetails?.image ||
                item?.varientDetails?.files ||
                item?.variantDetails?.files ||
                item?.variantDetails?.image ||
                item?.tabletvariantDetails?.files ||
                item?.tabletvariantDetails?.image ||
                foundProductVariant?.files ||
                foundTabletVariant?.files ||
                null,
              discountprice:
                item?.varientDetails?.discountprice ??
                item?.variantDetails?.discountprice ??
                item?.tabletvariantDetails?.discountprice ??
                foundProductVariant?.discountprice ??
                foundTabletVariant?.discountprice ??
                null,
              price:
                item?.varientDetails?.price ??
                item?.variantDetails?.price ??
                item?.tabletvariantDetails?.price ??
                foundProductVariant?.price ??
                foundTabletVariant?.price ??
                null,
              discountType:
                item?.varientDetails?.discountType ||
                item?.variantDetails?.discountType ||
                item?.tabletvariantDetails?.discountType ||
                foundProductVariant?.discountType ||
                foundTabletVariant?.discountType ||
                null,
            };

            const price = isPackage
              ? packageDetails.price || item.price || 0
              : (varientDetails.price !== null && varientDetails.price !== undefined && Number(varientDetails.price) > 0)
                ? Number(varientDetails.price)
                : (foundProductVariant.price || foundTabletVariant.price || tabletvariant.price || productvariants.price || tabletDetails.price || productDetails.price || item.price || 0);

            const discountprice = isPackage
              ? packageDetails.discountprice ||
              packageDetails.discountPrice ||
              item.discountprice ||
              item.discountPrice ||
              null
              : (varientDetails.discountprice !== null && varientDetails.discountprice !== undefined && Number(varientDetails.discountprice) > 0)
                ? Number(varientDetails.discountprice)
                : (foundProductVariant.discountprice ||
                  foundProductVariant.discountPrice ||
                  productvariants.discountprice ||
                  productvariants.discountPrice ||
                  tabletvariant.discountprice ||
                  tabletvariant.discountPrice ||
                  productDetails.discountprice ||
                  productDetails.discountPrice ||
                  item.discountprice ||
                  item.discountPrice ||
                  null);

            const discountType = isPackage
              ? packageDetails.discountType || null
              : varientDetails.discountType ||
              foundProductVariant.discountType ||
              productvariants.discountType ||
              tabletvariant.discountType ||
              productDetails.discountType ||
              item.discountType ||
              null;

            const variantImageCandidate = varientDetails.image;
            let variantImages = [];
            if (Array.isArray(variantImageCandidate) && variantImageCandidate.length > 0) {
              variantImages = variantImageCandidate;
            } else if (typeof variantImageCandidate === "string" && variantImageCandidate.trim() !== "") {
              variantImages = [variantImageCandidate];
            }

            const files = isPackage
              ? (packageDetails.files?.length > 0 ? packageDetails.files : null) ||
              productDetails.files ||
              item.files ||
              []
              : variantImages.length > 0
                ? variantImages
                : foundProductVariant.files ||
                productvariants.files ||
                tabletDetails.files ||
                productDetails.files ||
                item.files ||
                [];

            const vendorName =
              businessProfile.name ||
              vendorDetails.name ||
              vendorDetails.businessName ||
              item.vendorName ||
              "Vendor";

            let producImage;
            if (isPackage) {
              producImage = packageDetails?.files?.length > 0 ? packageDetails.files : [];
            } else if (variantImages.length > 0) {
              producImage = variantImages;
            } else if (tabletDetails?.imageUrl?.length > 0) {
              producImage = tabletDetails?.imageUrl;
            } else if (tabletDetails?.files?.length > 0) {
              producImage = tabletDetails?.files;
            } else if (tabletDetails?.variant?.[0]?.files?.length > 0) {
              producImage = tabletDetails?.variant?.[0]?.files;
            } else {
              producImage = [];
            }

            const vendorImage =
              businessProfile.bussiness_image?.url ||
              businessProfile.business_image?.url ||
              vendorDetails.bussiness_image?.url ||
              vendorDetails.business_image?.url ||
              vendorDetails.bussinessdetails?.bussiness_image?.url ||
              vendorDetails.businessProfile?.bussiness_image?.url ||
              item.vendorImage ||
              null;

            const variantName = varientDetails.name || item.variantName || null;

            const baseName = isPackage
              ? packageDetails.name || item.name || "Package"
              : tabletDetails.name || productDetails.name || item.name || "";

            let name = baseName;
            // if (variantName && variantName.trim() && !baseName.toLowerCase().includes(variantName.toLowerCase())) {
            //   name = `${baseName} (${variantName})`;
            // }

            const cartItem = {
              cartId: cartId,
              _id: cartId,
              cartKey,
              productId,
              vendorId,
              variantId,
              quantity: item.quantity || 1,
              productDetails,
              packageDetails: isPackage ? packageDetails : {},
              name,
              price,
              discountprice,
              discountType,
              perDayRent: tabletDetails.perDayRent || productDetails.perDayRent || item.perDayRent || null,
              files: Array.isArray(files) ? files : [],
              imageUrl: producImage || [],
              vendorName,
              vendorImage,
              variantName,
              varientDetails,
              prescriptionImage: item?.prescriptionImage || null,
              hasActivePrescriptionPayment: tabletDetails?.hasActivePrescriptionPayment || false,
              stock:
                foundProductVariant.stock ||
                foundTabletVariant.stock ||
                tabletvariant.stock ||
                item.stock ||
                999,
              slug: tabletDetails.slug || productDetails.slug || "",
              billingSummary: item.billingSummary || null,
              type: item.type || (isPackage ? "package" : "normal"),
              packageId: packageId,
              tabletId: isPackage ? null : tabletDetails._id || productId,
              returnDetails: productDetails.returnDetails || item.returnDetails || null,
              labTestPatients: item.labTestPatients || [],
              serviceType: item.serviceType || item.serviceTypes || item.servicefixedTypes || null,
              serviceTypes: item.serviceTypes || item.serviceType || item.servicefixedTypes || null,
              servicefixedTypes: item.servicefixedTypes || item.serviceType || item.serviceTypes || null,
            };

            return cartItem;
          });
          if (mapped.length > 0) return mapped;
        }

        if (!isLoggedIn()) {
          const localFallback = getGuestCartSnapshot();
          if (localFallback.length > 0) return localFallback;
        }
      } catch (error) {
        if (!isLoggedIn()) {
          const localFallback = getGuestCartSnapshot();
          if (localFallback.length > 0) return localFallback;
        }
      }
      return [];
    };

    lastFetchParamsRef.current = key;
    const promise = executeFetch().then((result) => {
      cachedCartItemsRef.current = result;
      lastFetchedTimeRef.current = Date.now();
      return result;
    }).finally(() => {
      if (lastFetchParamsRef.current === key) {
        activeFetchPromiseRef.current = null;
      }
    });

    activeFetchPromiseRef.current = promise;
    return promise;
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
      lastFetchedTimeRef.current = 0;
      if (!isLoggedIn()) {
        return false;
      }

      const searchParams = new URLSearchParams(window.location.search);
      let cartType = searchParams.get("carttype") || searchParams.get("cartType") || item.servicefixedTypes || item.serviceType || item.serviceTypes;
      if (cartType) {
        cartType = cartType.toLowerCase().trim();
        if (cartType === "medicines") {
          cartType = "medicine";
        }
      }

      try {
        const payload = [];
        payload.push({
          productId: item.productId || item.tabletId,
          vendorId: item.vendorId,
          variantId: item.variantId || null,
          quantity: item.quantity || 1,
          bookingType: item.bookingType || "cart",
          type: item.type || "normal",
          packageId: item.packageId || null,
          pincode: selectedPincode || null,
          labTestPatients: item.labTestPatients || null,
          serviceType: cartType,
          servicefixedTypes: item?.servicefixedTypes,
          prescriptionImage: item.prescriptionImage || null,
        });


        console.log("cart", payload)
        const isRental =
          item.bookingType === "rentals" ||
          item.bookingType === "rentals_addtocarts" ||
          item.bookingType === "rental" ||
          cartType === "medicalequipment";

        const endpoint = "cart/create";

        await axiosCommonInstance.post(endpoint, payload, {
          headers: getHeaders(),
        });
        return true;
      } catch (error) {
        let errorMsg = error.response?.data?.message || "Failed to add to cart";
        if (errorMsg.includes("only the same vendor and service type") || errorMsg.includes("same vendor and service type")) {
          errorMsg = "Your cart can only contain items from the same vendor and service type (e.g. lab tests from the same lab). Please clear your current cart or complete your order first.";
        }
        toast.error(errorMsg);
        return false;
      }
    },
    [isLoggedIn, getHeaders, selectedPincode],
  );

  // Update item on server
  const updateServerCart = useCallback(
    async (type, productId, vendorId, variantId = null, packageId = null) => {
      lastFetchedTimeRef.current = 0;
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
        // NOTE: Do NOT call fetchServerCart() here unawaited — it fires a stray background GET
        // that races with other cart operations. Callers (incrementItem, decrementItem, removeItem)
        // handle refreshCart() themselves after this returns.
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
        let cartType = null;
        if (typeof window !== "undefined") {
          const searchParams = new URLSearchParams(window.location.search);
          cartType = searchParams.get("carttype") || searchParams.get("cartType");
          if (cartType) {
            cartType = cartType.toLowerCase().trim();
            if (cartType === "medicines") {
              cartType = "medicine";
            }
          }
          if (!cartType) {
            const path = window.location.pathname.toLowerCase();
            if (path.includes("labtest") || path.includes("lab-test")) {
              cartType = "labtests";
            } else if (path.includes("medicalequipment") || path.includes("medical-equipment")) {
              cartType = "medicalequipment";
            } else if (path.includes("medicines") || path.includes("medicine") || path.includes("pharmacy")) {
              cartType = "medicine";
            }
          }
        }

        const standardPayload = [];
        const rentalPayload = [];

        itemsToAdd.forEach((item) => {
          const payloadItem = {
            productId: item.productId || item.tabletId,
            vendorId: item.vendorId,
            variantId: item.variantId || null,
            quantity: item.quantity || 1,
            bookingType: item.bookingType || "cart",
            type: item.type || "normal",
            packageId: item.packageId || null,
            pincode: selectedPincode || null,
            servicefixedTypes: item.servicefixedTypes || item.servicefixedtype || item.serviceFixedType || item.serviceFixedTypes || item.servicesFixedType || null,
            serviceType: item.serviceType || item.servicefixedTypes || item.servicefixedtype || item.serviceFixedType || item.serviceFixedTypes || item.servicesFixedType || null,
          };

          const isRental =
            item.bookingType === "rentals" ||
            item.bookingType === "rentals_addtocarts" ||
            item.bookingType === "rental" ||
            cartType === "medicalequipment";

          if (isRental) {
            rentalPayload.push(payloadItem);
          } else {
            standardPayload.push(payloadItem);
          }
        });

        if (standardPayload.length > 0) {
          await axiosCommonInstance.post("cart/create", standardPayload, {
            headers: getHeaders(),
          });
        }

        if (rentalPayload.length > 0) {
          await axiosCommonInstance.post("cart/create", rentalPayload, {
            headers: getHeaders(),
          });
        }

        toast.success(
          itemsToAdd.length === 1
            ? "Cart synced to your account"
            : `${itemsToAdd.length} items synced to your account`,
        );
        localStorage.removeItem("cart");
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
    lastFetchedTimeRef.current = 0;
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
    (vendorId, productId, variantId = null, packageId = null) => {
      const isPackage = !!packageId && !productId;
      const cartKey = isPackage
        ? `${vendorId}_pkg_${packageId}`
        : generateCartKey(vendorId, productId, variantId);
      const item = cartItems.find(
        (i) =>
          i.cartKey === cartKey ||
          (isPackage
            ? String(i.vendorId) === String(vendorId) && String(i.packageId || "") === String(packageId)
            : String(i.vendorId) === String(vendorId) &&
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
      const isPackage = options.type === "package" || !!options.packageId;
      const packageId = isPackage ? (options.packageId || itemData.packageId || itemData._id) : null;
      const productId = isPackage
        ? null
        : itemData?.tabletdetails?._id ||
        itemData?.tabletdetails?.id ||
        itemData?.productId ||
        itemData?.tabletId ||
        itemData?._id ||
        itemData?.id;

      const vendorId =
        itemData?.vendorId ||  // Explicit vendorId field (highest priority - VendorActions passes vendor._id here)
        itemData?.vendordetails?.vendorId ||
        itemData?.vendordetails?._id ||
        itemData?.vendordetails?.id ||
        itemData?.vendor?.vendorId ||
        itemData?.vendor?._id ||
        itemData?.vendor?.id;

      const cartKey = isPackage
        ? `${vendorId}_pkg_${packageId}`
        : generateCartKey(vendorId, productId, variantId);

      // Check if this item is already being added
      if (addInProgress.current.has(cartKey)) {
        return false; // Prevent duplicate API calls
      }

      if ((!isPackage && !productId) || !vendorId) {
        toast.error("Product information is incomplete");
        return false;
      }

      setIsLoading(true);
      addInProgress.current.add(cartKey);

      try {

        const quantity = options.quantity || 1;
        const existingQty = getQuantity(vendorId, productId, variantId, packageId);
        const newQty = existingQty + quantity;

        // Resolve service type/fixed type from multiple sources
        const getResolvedServiceType = () => {
          // 1. Direct from options
          const fromOptions = options.servicefixedTypes || options.servicesFixedType || options.serviceFixedType || options.serviceFixedTypes || options.serviceType || options.serviceTypes;
          if (fromOptions) return fromOptions;

          // 2. Direct from itemData
          const fromItem = itemData.servicefixedTypes || itemData.servicesFixedType || itemData.serviceFixedType || itemData.serviceFixedTypes || itemData.serviceType || itemData.serviceTypes || itemData.service || itemData.bookingType;
          if (fromItem) return fromItem;

          // 3. Inside productDetails/tabletdetails/packageDetails
          const fromDetails = itemData.productDetails?.servicefixedTypes || itemData.productDetails?.serviceFixedType || itemData.productDetails?.servicesFixedType || itemData.productDetails?.serviceFixedTypes || itemData.productDetails?.fixedType || itemData.productDetails?.fixedtype ||
            itemData.tabletdetails?.subcategoryDetails?.categoryDetails?.fixedType || itemData.tabletdetails?.fixedType ||
            itemData.packageDetails?.fixedType ||
            itemData.productDetails?.tabletDetails?.subcategoryDetails?.categoryDetails?.fixedType;
          if (fromDetails) return fromDetails;

          // 4. URL/Pathname Fallback
          if (typeof window !== "undefined") {
            const searchParams = new URLSearchParams(window.location.search);
            const typeParam = searchParams.get("carttype") || searchParams.get("cartType") || searchParams.get("service") || searchParams.get("type");
            if (typeParam) return typeParam;

            const path = window.location.pathname.toLowerCase();
            if (path.includes("labtest") || path.includes("lab-test")) return "labtests";
            if (path.includes("medicalequipment") || path.includes("medical-equipment") || path.includes("rental")) return "medicalequipment";
            if (path.includes("medicines") || path.includes("medicine") || path.includes("pharmacy")) return "medicine";
            if (path.includes("dental")) return "dental";
            if (path.includes("nursing")) return "nursingcare";
            if (path.includes("homecare") || path.includes("home-care")) return "homecare";
            if (path.includes("treatment")) return "medicaltreatment";
            if (path.includes("surgery") || path.includes("surgeries")) return "surgeries";
          }

          return null;
        };

        const resolvedServiceType = getResolvedServiceType();
        let normalizedServiceType = resolvedServiceType;
        if (typeof normalizedServiceType === "string") {
          normalizedServiceType = normalizedServiceType.toLowerCase().trim();
          if (normalizedServiceType === "medicines") {
            normalizedServiceType = "medicine";
          }
        }

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
          packageId: packageId || null,
          bookingType: options.bookingType || "cart",
          addedAt: new Date().toISOString(),
          labTestPatients: options.labTestPatients || itemData.labTestPatients || null,
          servicefixedTypes: normalizedServiceType || null,
          serviceType: normalizedServiceType || null,
          serviceTypes: normalizedServiceType || null,
          prescriptionImage: options.prescriptionImage || itemData.prescriptionImage || null,
        };
        // Remove all existing items with the same productId (regardless of vendor)
        // This ensures only one vendor's product can be in cart at a time
        const removeExistingProduct = (items) => {
          if (isPackage) {
            return items.filter((i) => {
              const itemPackageId = i.packageId;
              return String(itemPackageId) !== String(packageId);
            });
          }
          return items.filter((i) => {
            const itemProductId = i.productId || i.tabletId;
            return String(itemProductId) !== String(productId);
          });

        };

        // Sync with server if logged in - remove existing product from server first
        if (isLoggedIn()) {
          // Use local cartItems state to find existing items with the same product but different vendor.
          // This avoids an unnecessary GET (fetchServerCart) before the POST (addToServerCart),
          // keeping the API order clean: POST cart/create → GET cart/list (from proceedToAdd's refreshCart).
          try {
            const itemsToRemove = cartItems.filter(
              (item) =>
                isPackage
                  ? String(item.packageId) === String(packageId) && String(item.vendorId) !== String(vendorId)
                  : String(item.productId || item.tabletId) === String(productId) && String(item.vendorId) !== String(vendorId),
            );

            // Remove each existing product from server
            for (const itemToRemove of itemsToRemove) {
              await updateServerCart(
                "delete",
                itemToRemove.productId || itemToRemove.tabletId,
                itemToRemove.vendorId,
                itemToRemove.variantId,
                itemToRemove.packageId,
              );
            }
          } catch (error) {
            // Error removing existing product from server
          }

          // Now add the new item
          const success = await addToServerCart(newItem);
          if (!success) {
            return false;
          }
          // NOTE: Do NOT call refreshCart() here — it races against the optimistic setCartItems
          // below and causes the cart UI to flicker back to "Add" before the server response maps.
          // The caller (proceedToAdd in CartQuantityControls) handles the refresh after addItem returns.
        } else {
          // Check if product was replaced for guest users
          const hadExisting = cartItems.some((item) => {
            return isPackage
              ? String(item.packageId) === String(packageId) && String(item.vendorId) !== String(vendorId)
              : String(item.productId || item.tabletId) === String(productId) && String(item.vendorId) !== String(vendorId);
          });
        }

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
        toast.success(`${newItem.name || "Item"} added to cart`);

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
      updateServerCart,
    ],
  );

  // Increment item quantity
  const incrementItem = useCallback(
    async (
      vendorId,
      productId,
      variantId = null,
      // maxStock = 999,
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

      // if (currentQty >= maxStock) {
      //   toast.error("Maximum stock reached");
      //   return false;
      // }

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

      toast.success(`Incremented ${existingItem?.name || "item"} quantity`);

      if (isLoggedIn()) {
        await updateServerCart(
          "increment",
          productId,
          vendorId,
          variantId,
          itemPackageId,
        );
        await refreshCart();
      }

      return true;
    },
    [
      cartItems,
      generateCartKey,
      saveToLocalStorage,
      isLoggedIn,
      updateServerCart,
      refreshCart,
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
        toast.success(`${existingItem?.name || "Item"} removed from cart`);

        if (isLoggedIn()) {
          await updateServerCart(
            "delete",
            productId,
            vendorId,
            variantId,
            itemPackageId,
          );
          await refreshCart();
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
        toast.success(`Decremented ${existingItem?.name || "item"} quantity`);

        if (isLoggedIn()) {
          await updateServerCart(
            "decrement",
            productId,
            vendorId,
            variantId,
            itemPackageId,
          );
          await refreshCart();
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
      refreshCart,
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
      toast.success(`${existingItem?.name || "Item"} removed from cart`);

      if (isLoggedIn()) {
        await updateServerCart(
          "delete",
          productId,
          vendorId,
          variantId,
          itemPackageId,
        );
        await refreshCart();
      }

      return true;
    },
    [
      cartItems,
      generateCartKey,
      saveToLocalStorage,
      isLoggedIn,
      updateServerCart,
      refreshCart,
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

  }, [
    selectedPincode,
    isInitialized,
    refreshCart,
    isLoggedIn,
    getGuestCartSnapshot,
    saveToLocalStorage,
  ]);

  // Sync cart automatically on SPA routing/navigation changes (ignoring page param changes)
  useEffect(() => {
    let lastUrl = window.location.href;

    const handleUrlChange = () => {
      const currentUrl = window.location.href;
      const prevUrlObj = new URL(lastUrl);
      const currUrlObj = new URL(currentUrl);

      // Check if they are on the same pathname and only "page" search param has changed
      const pathnameChanged = prevUrlObj.pathname !== currUrlObj.pathname;
      
      // Compare search params excluding the 'page' parameter
      const prevParams = new URLSearchParams(prevUrlObj.search);
      const currParams = new URLSearchParams(currUrlObj.search);
      prevParams.delete('page');
      currParams.delete('page');

      const queryParamsChanged = prevParams.toString() !== currParams.toString();

      lastUrl = currentUrl;

      // If only page param changed (no pathname or other search filter changes), skip calling refreshCart
      if (!pathnameChanged && !queryParamsChanged) {
        return;
      }

      refreshCart();
    };

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleUrlChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleUrlChange();
    };

    window.addEventListener("popstate", handleUrlChange);

    return () => {
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, [refreshCart]);

  const value = {
    // State
    cartItems,
    cartBilling,
    isLoading,
    isInitialized,
    relevantProducts,
    couponDetails,
    walletAmount,
    serviceFeeDetails,
    serviceDetails,
    vendorLocation,
    // Operations
    userDetails,
    addItem,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    refreshCart,
    ServiceCartCount,
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
