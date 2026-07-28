const SERVICE_ROUTE_BY_FIXED_TYPE = {
  medicine: "medicine",
  labtests: "lab-tests",
  surgeries: "surgeries",
  diagnostics: "diagnostics",
  homecare: "homecare",
  healthcare: "home-care-services",
  nursingcare: "nursing-care",
  medicalequipment: "medical-equipment",
  medicaltreatment: "medical-treatment",
  dentalservice: "dentalservice",
  ambulanceservice: "ambulanceservice",
};

const CATEGORY_FALLBACK_BY_FIXED_TYPE = {
  medicine: "tablets",
  labtests: "all",
  surgeries: "all",
  diagnostics: "all",
  homecare: "all",
  healthcare: "all",
  nursingcare: "all",
  medicalequipment: "all",
  medicaltreatment: "all",
  dentalservice: "all",
  ambulanceservice: "all",
};

const NON_MEDICINE_SERVICES = [
  "lab-tests",
  "homecare",
  "surgeries",
  "ambulance",
  "consultation",
];

export const resolveProductTablet = (product) => {
  if (!product) return null;
  if (product.rawData) return resolveProductTablet(product.rawData);
  if (product.item) return resolveProductTablet(product.item);

  const tablet =
    product.tabletdetails ||
    product.tabletDetails ||
    product.tablet ||
    (product.slug || product._id || product.id || product.name ? product : null);

  return tablet && typeof tablet === "object" ? tablet : null;
};

export const getMedicinePincodeFromStorage = () => {
  try {
    const savedLocation = localStorage.getItem("selectedLocation");
    if (!savedLocation) return null;
    const locationData = JSON.parse(savedLocation);
    if (locationData.pincode && locationData.pincode.length === 6) {
      return locationData.pincode;
    }
  } catch (e) {
    // ignore invalid localStorage payload
  }
  return null;
};

export const getProductNavigation = (
  product,
  { fallbackService = "medicine", pincode = null, includePincode = true } = {},
) => {
  const tablet = resolveProductTablet(product);
  if (!tablet) return null;

  const productSlug = tablet.slug || tablet._id || tablet.id;
  if (!productSlug) return null;

  const subcategoryData = tablet.subcategorys || tablet.subcategoryDetails;
  const categoryData =
    subcategoryData?.category ||
    subcategoryData?.categoryDetails ||
    tablet.category;

  const fixedType = categoryData?.fixedType;
  const serviceSlug =
    SERVICE_ROUTE_BY_FIXED_TYPE[fixedType] || fallbackService || "medicine";

  const categories =
    subcategoryData?.slug ||
    (subcategoryData?.name
      ? subcategoryData.name.toLowerCase().replace(/\s+/g, "-")
      : null) ||
    CATEGORY_FALLBACK_BY_FIXED_TYPE[fixedType] ||
    "tablets";

  const isMedicine = fixedType === "medicine";
  const isNonMedicineService = NON_MEDICINE_SERVICES.includes(serviceSlug);

  let url = `/${encodeURIComponent(serviceSlug)}/${encodeURIComponent(
    categories,
  )}/${encodeURIComponent(productSlug)}`;

  if (includePincode && isMedicine && !isNonMedicineService && pincode) {
    url += `?pincode=${pincode}`;
  }

  return {
    url,
    state: {
      selectedVariantId:
        tablet.variant?.[0]?._id || tablet.variants?.[0]?._id || null,
    },
  };
};

// Price calculation utilities
export const getDisplayPrice = (product, selectedVariants) => {
  const tablet = product.tablet;

  // If no variants show tablet price
  if (!tablet.variant || tablet.variant.length === 0) {
    return tablet.price;
  }

  const selectedVariantId =
    selectedVariants[tablet._id] || tablet.variant[0]._id;

  const tabletVariant = tablet.variant.find(
    (v) => v._id === selectedVariantId
  );

  return tabletVariant?.price ?? tablet.price;
};

export const getVendorPrice = (vendor, tablet, selectedVariants) => {
  const selectedVariantId =
    selectedVariants?.[tablet._id] || tablet.variant?.[0]?._id;

  // If no variants return vendor price
  if (!vendor.variant || vendor.variant.length === 0) {
    return vendor.price ?? null;
  }

  // Find matching variant (try active and in-stock first)
  let vendorVariant = vendor.variant.find(
    (v) =>
      (v.variantId === selectedVariantId || v._id === selectedVariantId) &&
      v.status === "active" &&
      v.isStock === true
  );

  // If no active/in-stock variant, try to find any matching variant
  if (!vendorVariant) {
    vendorVariant = vendor.variant.find(
      (v) => v.variantId === selectedVariantId || v._id === selectedVariantId
    );
  }

  if (vendorVariant && vendorVariant.price) {
    return vendorVariant.price;
  }

  // Fallback: return tablet variant price or vendor price
  const tabletVariant = tablet.variant?.find(
    (v) => v._id === selectedVariantId
  );
  return tabletVariant?.price ?? vendor.price ?? null;
};

