import toast from "react-hot-toast";
import { fetchCategoryList } from "../Apiservice.jsx";

const PRODUCTION_URL = "https://medicompares.com";

let globalCategories = [];
try {
  fetchCategoryList()
    .then((categories) => {
      globalCategories = categories || [];
    })
    .catch(() => { });
} catch (e) {
  // ignore
}

export const getShareUrl = (productData) => {
  if (!productData) return PRODUCTION_URL;
  const tablet = productData.tablet || productData.medicineDetails || productData;
  if (tablet?.slug) {
    // Resolve subcategory block
    let sub = tablet.subcategorys || tablet.subcategory || productData.subcatdetails || productData.subcategorydetails || productData.subcategoryDetails || tablet.subcategorys?.category?.slug;
    if (Array.isArray(sub)) sub = sub[0];

    // Resolve category block
    const cat = sub?.category ||
      sub?.catdetails ||
      sub?.categoryDetails ||
      (Array.isArray(tablet.category) ? tablet.category[0] : tablet.category) ||
      (Array.isArray(productData.category) ? productData.category[0] : productData.category);

    const service = cat?.slug ||
      cat?.fixedType ||
      tablet.subcategorys?.category?.slug ||
      tablet.subcategory?.category?.slug ||
      tablet.category?.slug ||
      productData.category?.slug ||
      tablet.fixedType ||
      productData.service ||
      tablet.subcategorys?.category?.fixedType ||
      tablet.subcategory?.category?.fixedType ||
      'medicines';

    const categories = sub?.slug ||
      sub?.fixedType ||
      cat?.slug ||
      tablet.subcategorys?.slug ||
      tablet.subcategory?.slug ||
      tablet.subcategorys?.fixedType ||
      tablet.subcategory?.fixedType ||
      tablet.category?.slug ||
      productData.category?.slug ||
      'all'

    const path = service === categories
      ? `${service}`
      : `${service}/${categories}`;
    return `${PRODUCTION_URL}/${path}/${tablet.slug}`;
  }
  // For non-product pages, always use the production domain (global URL)
  return `${PRODUCTION_URL}${window.location.pathname}${window.location.search}${window.location.hash}`;
};

export const getCleanServiceName = (serviceKey) => {
  if (!serviceKey) return "Product";
  const cleanKey = serviceKey.toLowerCase().replace(/[-_]/g, "").trim();

  if (globalCategories && globalCategories.length > 0) {
    const matchedCategory = globalCategories.find(
      (cat) =>
        (cat.fixedType && cat.fixedType.toLowerCase().replace(/[-_]/g, "") === cleanKey) ||
        (cat.slug && cat.slug.toLowerCase().replace(/[-_]/g, "") === cleanKey) ||
        (cat.name && cat.name.toLowerCase().replace(/[-_]/g, "") === cleanKey)
    );
    if (matchedCategory && matchedCategory.name) {
      return matchedCategory.name;
    }
  }

  // Fallback to static mapping if categories aren't loaded yet or match isn't found
  const key = serviceKey.toLowerCase().replace(/[-_]/g, "");

  if (key.includes("medicine")) return "Medicine";
  if (key.includes("lab") || key.includes("diagnostic") || key.includes("test")) return "Lab Test";
  if (key.includes("dental")) return "Dental Service";
  if (key.includes("nursing") || key.includes("nurse")) return "Nursing Care";
  if (key.includes("equipment")) return "Medical Equipment";
  if (key.includes("rehab") || key.includes("clinic")) return "Clinic & Rehab";
  if (key.includes("surgery") || key.includes("surgical")) return "Surgery";
  if (key.includes("homecare")) return "Home Care";
  if (key.includes("ambulance")) return "Ambulance";
  if (key.includes("treatment")) return "Medical Treatment";

  return serviceKey
    .replace(/[-_]/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export const getShareText = (productData, selectedVariants, serviceType) => {
  if (!productData) return "Check out this product on MediCompares";
  const tablet = productData.tablet || productData;
  if (!tablet) return "Check out this product on MediCompares";

  let serviceName = "Product";
  if (serviceType) {
    serviceName = getCleanServiceName(serviceType);
  } else {
    // Dynamic database names are prioritized to support admin-panel changes
    const dbName = tablet.subcategorys?.category?.name ||
      tablet.subcategory?.category?.name ||
      tablet.category?.name ||
      tablet.subcategorys?.name ||
      tablet.subcategory?.name ||
      "";
    if (dbName) {
      serviceName = dbName;
    } else {
      const categorySlug = tablet.subcategorys?.category?.slug ||
        tablet.subcategory?.category?.slug ||
        tablet.subcategorys?.category?.fixedType ||
        tablet.subcategory?.category?.fixedType ||
        tablet.fixedType ||
        tablet.category?.slug ||
        tablet.category ||
        "";
      serviceName = getCleanServiceName(categorySlug);
    }
  }

  // Handle selected variants
  const selectedVariantId =
    (selectedVariants && tablet._id && selectedVariants[tablet._id]) ||
    tablet.variant?.[0]?._id ||
    tablet.variants?.[0]?._id;

  const selectedVariant = tablet.variant?.find((v) => v._id === selectedVariantId) ||
    tablet.variants?.find((v) => v._id === selectedVariantId);

  let price = 0;
  if (selectedVariant) {
    price = selectedVariant.discountprice || selectedVariant.discountPrice || selectedVariant.price || 0;
  } else {
    price = tablet.discountprice || tablet.discountPrice || tablet.price || 0;
  }

  // Fallback to vendor prices if price is still 0 or null
  if (!price || price === 0) {
    const vendors = productData.vendors || tablet.vendors || [];
    const firstVendor = vendors[0];
    if (firstVendor) {
      const matchedVendorVariant = firstVendor.variant?.find(
        (v) => v.variantId === selectedVariantId || v._id === selectedVariantId
      );
      const vendorPrice = matchedVendorVariant?.price || firstVendor.price;
      const vendorDiscountPrice = matchedVendorVariant?.discountprice || matchedVendorVariant?.discountPrice || firstVendor.discountprice || firstVendor.discountPrice;

      const effectiveVendorPrice = vendorDiscountPrice || vendorPrice;
      if (effectiveVendorPrice) {
        price = effectiveVendorPrice;
      }
    }
  }

  price = price || 0;

  const formattedServiceName = serviceName;

  if (formattedServiceName.toLowerCase() === "medicine") {
    return `Check out this ${formattedServiceName}: ${tablet.name || "Product"} - ₹${price} on MediCompare`;
  } else {
    return `Check out this ${formattedServiceName}: ${tablet.name || "Product"} on MediCompare`;
  }
};

export const shareToWhatsApp = (url, text, onClose) => {
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
    text + " " + url
  )}`;
  window.open(whatsappUrl, "_blank");
  onClose();
};

export const shareToLinkedIn = (url, text, onClose) => {
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
    url
  )}&title=${encodeURIComponent(text)}`;
  window.open(linkedinUrl, "_blank");
  onClose();
};

export const shareToFacebook = (url, onClose) => {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    url
  )}`;
  window.open(facebookUrl, "_blank");
  onClose();
};

export const shareToTwitter = (url, text, onClose) => {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    text
  )}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, "_blank");
  onClose();
};

export const copyToClipboard = async (url, onClose) => {
  try {
    await navigator.clipboard.writeText(url);
    onClose();
  } catch (err) {
    throw new Error("Failed to copy link");
  }
};

export const shareToEmail = (url, text, onClose) => {
  try {
    const subject = `Check out this product on MediCompares`;
    const body = `${text}\n\n${url}`;

    // Detect mobile devices
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (isMobile) {
      const emailUrl = `mailto:?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      const a = document.createElement("a");
      a.href = emailUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Fallback for desktop: open Gmail Web compose in a new tab
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&su=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, "_blank");
    }

    if (onClose) onClose();
  } catch (err) {
    console.error("Email share error:", err);
    if (onClose) onClose();
  }
};

export const shareToTelegram = (url, text, onClose) => {
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    url
  )}&text=${encodeURIComponent(text)}`;
  window.open(telegramUrl, "_blank");
  onClose();
};

export const createShareHandler = (productData, selectedVariants, onClose, serviceType) => {
  const url = getShareUrl(productData);
  const text = getShareText(productData, selectedVariants, serviceType);

  return {
    copy: async () => {
      try {
        await copyToClipboard(url, () => {
          toast.success("Link copied to clipboard!");
          if (onClose) onClose();
        });
      } catch (err) {
        toast.error("Failed to copy link");
      }
    },
    whatsapp: () => shareToWhatsApp(url, text, onClose),
    facebook: () => shareToFacebook(url, onClose),
    twitter: () => shareToTwitter(url, text, onClose),
    email: () => shareToEmail(url, text, onClose),
    telegram: () => shareToTelegram(url, text, onClose),
    linkedin: () => shareToLinkedIn(url, text, onClose),
  };
};

export const createNormalizedShareHandler = (shareData, onClose) => {
  const { name = "Product", price = 0, link = window.location.href, serviceType = "Product" } = shareData || {};

  const formattedServiceName = getCleanServiceName(serviceType);

  let text = "";
  if (formattedServiceName.toLowerCase() === "medicine") {
    text = `Check out this ${formattedServiceName}: ${name} - ₹${price} on MediCompares`;
  } else {
    text = `Check out this ${formattedServiceName}: ${name} on MediCompares`;
  }

  return {
    copy: async () => {
      try {
        await copyToClipboard(link, () => {
          toast.success("Link copied to clipboard!");
          if (onClose) onClose();
        });
      } catch (err) {
        toast.error("Failed to copy link");
      }
    },
    whatsapp: () => shareToWhatsApp(link, text, onClose),
    facebook: () => shareToFacebook(link, onClose),
    twitter: () => shareToTwitter(link, text, onClose),
    email: () => shareToEmail(link, text, onClose),
    telegram: () => shareToTelegram(link, text, onClose),
    linkedin: () => shareToLinkedIn(link, text, onClose),
  };
};

