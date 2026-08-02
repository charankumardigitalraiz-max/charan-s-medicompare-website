export const getShareUrl = (productData) => {
  if (productData?.tablet?.slug) {
    const service = productData?.tablet?.subcategorys?.category?.slug || 'medicines';
    const categories = productData?.tablet?.subcategorys?.slug || 'all';
    const path = service === categories 
      ? `${service}`
      : `${service}/${categories}`;
    return `${window.location.origin}/${path}/${productData.tablet.slug}`;
  }
  return window.location.href;
};

export const getShareText = (productData, selectedVariants) => {
  if (!productData) return "Check out this product on MediCompare";
  const tablet = productData?.tablet;
  const selectedVariantId =
    selectedVariants[tablet?._id] || tablet?.variant?.[0]?._id;
  const selectedVariant = tablet?.variant?.find(
    (v) => v._id === selectedVariantId
  );
  const price = selectedVariant?.price || tablet?.price || 0;
  return `Check out this medicine: ${tablet?.name} - ₹${price} on MediCompare`;
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
  const subject = `Check out this product on MediCompare`;
  const body = `${text}\n\n${url}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(
    subject
  )}&body=${encodeURIComponent(body)}`;
  window.location.href = emailUrl;
  onClose();
};

export const shareToTelegram = (url, text, onClose) => {
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(
    url
  )}&text=${encodeURIComponent(text)}`;
  window.open(telegramUrl, "_blank");
  onClose();
};

