// Price calculation utilities
export const getDisplayPrice = (product, selectedVariants) => {
  const tablet = product.tablet;
  const vendors = product.vendors || [];

  // If no variants show tablet price
  if (!tablet.variant || tablet.variant.length === 0) {
    return tablet.price;
  }

  const selectedVariantId =
    selectedVariants[tablet._id] || tablet.variant[0]._id;

  const tabletVariant = tablet.variant.find(
    (v) => v._id === selectedVariantId
  );

  for (const vendor of vendors) {
    const vendorVariant = vendor.variant.find(
      (v) =>
        (v.variantId === selectedVariantId || v._id === selectedVariantId) &&
        v.status === "active" &&
        v.isStock === true
    );

    if (vendorVariant) {
      return vendorVariant.price;
    }
  }
  return tabletVariant?.price ?? tablet.price;
};

export const getVendorPrice = (vendor, tablet, selectedVariants) => {
  const selectedVariantId =
    selectedVariants[tablet._id] || tablet.variant?.[0]?._id;

  //  no variants return vendor price
  if (!vendor.variant || vendor.variant.length === 0) {
    return vendor.price ?? "N/A";
  }

  // Find matching variant
  const vendorVariant = vendor.variant.find(
    (v) =>
      (v.variantId === selectedVariantId || v._id === selectedVariantId) &&
      v.status === "active" &&
      v.isStock === true
  );

  if (vendorVariant) return vendorVariant.price;

  //  return tablet variant price
  const tabletVariant = tablet.variant.find(
    (v) => v._id === selectedVariantId
  );
  return tabletVariant?.price ?? vendor.price ?? "N/A";
};

