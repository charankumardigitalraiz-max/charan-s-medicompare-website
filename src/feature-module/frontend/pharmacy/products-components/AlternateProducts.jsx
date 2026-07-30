import { useNavigate } from "react-router-dom";
import {
  axiosCommonInstance,
} from "../../../../Apiservice.jsx";
import toast from "react-hot-toast";
import { useCart } from "../../../../hooks/useCart";
import { useAddToCart } from "../../../../hooks/useAddToCart";
import { getImageUrl } from "../../../../utils/index";
import VendorActions from "../../../../components/ui/VendorActions.jsx";
import CompareOverlayButton from "../../../../components/ui/CompareOverlayButton.jsx";
import LeadModal from "./LeadModal.jsx";
import RentModal from "./RentModal.jsx";
import ConsultationModal from "./ConsultationModal.jsx";
import AppointmentModal from "./AppointmentModal.jsx";
import { useState, useRef, useEffect } from "react";
import { redirectToLoginWithPendingBooking } from "../../../../utils/pendingBookingUtils";

const SERVICE_BOOKING_TYPES = [
  "consultation",
  "appointment",
  "ride",
  "rentals",
  "slots",
  "lead",
  "leads",
  "booking",
  "rentals_addtocarts",
  "cart",
];

const getVendorActionContext = (
  vendor,
  product,
  firstVariant,
  effectiveVariantId,
  getCartQuantity,
  productId,
) => {
  const isVariant = !!firstVariant;
  const bookingType = vendor?.bookingType || vendor?.bookingtype || null;
  let basePrice;
  let discountPrice;
  let discountType;
  let stock;

  if (isVariant && effectiveVariantId) {
    const matched = vendor?.variant?.find(
      (v) =>
        v.variantId === effectiveVariantId || v._id === effectiveVariantId,
    );
    if (matched) {
      basePrice =
        matched.price ??
        vendor?.price ??
        firstVariant?.price ??
        product?.tablet?.price ??
        0;
      discountPrice =
        matched.discountprice ??
        matched.discountPrice ??
        vendor?.discountprice ??
        vendor?.discountPrice ??
        null;
      discountType = matched.discountType ?? vendor?.discountType ?? null;
      stock = matched.stock ?? vendor?.stock ?? 0;
    } else {
      basePrice =
        vendor?.variant?.[0]?.price ??
        vendor?.price ??
        firstVariant?.price ??
        product?.tablet?.price ??
        0;
      discountPrice =
        vendor?.variant?.[0]?.discountprice ??
        vendor?.variant?.[0]?.discountPrice ??
        vendor?.discountprice ??
        vendor?.discountPrice ??
        null;
      discountType =
        vendor?.variant?.[0]?.discountType ?? vendor?.discountType ?? null;
      stock = vendor?.variant?.[0]?.stock ?? vendor?.stock ?? 0;
    }
  } else {
    basePrice = vendor?.price ?? product?.tablet?.price ?? 0;
    discountPrice = vendor?.discountprice ?? vendor?.discountPrice ?? null;
    discountType = vendor?.discountType ?? null;
    stock = vendor?.stock ?? 0;
  }

  let calculatedDiscountPrice = discountPrice;
  if (discountType === "percentage" && discountPrice && discountPrice > 0) {
    calculatedDiscountPrice =
      basePrice - (basePrice * discountPrice) / 100;
  }

  const hasValidDiscount =
    (discountType === "percentage" && discountPrice && discountPrice > 0) ||
    (discountPrice && discountPrice > 0 && discountPrice < basePrice);
  const finalPrice = hasValidDiscount ? calculatedDiscountPrice : basePrice;

  const isInStock = SERVICE_BOOKING_TYPES.includes(bookingType)
    ? true
    : stock > 0;

  let maxStock = 999;
  if (isVariant && effectiveVariantId) {
    const matchedVendorVariant = vendor?.variant?.find(
      (v) =>
        v.variantId === effectiveVariantId || v._id === effectiveVariantId,
    );
    if (matchedVendorVariant && matchedVendorVariant.isStock) {
      maxStock = matchedVendorVariant.stock ?? 0;
    } else if (
      matchedVendorVariant &&
      matchedVendorVariant.stock !== undefined
    ) {
      maxStock = matchedVendorVariant.stock ?? 999;
    } else {
      const vendorStock = vendor?.stock;
      maxStock =
        vendorStock !== undefined && vendorStock !== null ? vendorStock : 999;
    }
  } else {
    const vendorStock = vendor?.stock;
    maxStock =
      vendorStock !== undefined && vendorStock !== null ? vendorStock : 999;
  }

  const vendorId = vendor?._id || vendor?.vendorId;
  const tabletId = product?.tablet?._id || productId;
  const quantity = getCartQuantity(vendorId, tabletId, effectiveVariantId);

  return {
    bookingType,
    basePrice,
    discountPrice,
    discountType,
    finalPrice,
    stock,
    isInStock,
    maxStock,
    quantity,
    vendorId,
  };
};

const CollapsibleVendorList = ({
  vendors,
  handleVendorClick,
  renderVendorAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const vendorCount = vendors ? vendors.length : 0;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        if (event.target.closest(".modal") || event.target.closest(".modal-backdrop")) {
          return;
        }
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="w-full relative">
      {/* Collapsible Trigger Header */}
      <div
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="flex items-center justify-between py-2 px-3 bg-purple-50/40 hover:bg-purple-50 border border-purple-100 rounded-sm cursor-pointer select-none transition-all duration-200"
      >
        <span className="text-xs font-bold text-[#8059ca]">
          {vendorCount} {vendorCount === 1 ? "Vendor" : "Vendors"} Available
        </span>
        <i
          className={`fas fa-chevron-${isOpen ? "up" : "down"} text-[10px] text-[#8059ca] transition-transform duration-200`}
        ></i>
      </div>

      {/* Expanded Vendor List + action button */}
      {isOpen && (
        <div
          className="absolute bottom-[calc(100%+6px)] left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-[99] p-1.5 flex flex-col gap-1.5 mb-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="max-h-[220px] overflow-y-auto flex flex-col gap-1">
            {vendorCount === 0 ? (
              <div className="w-full py-3 text-center text-slate-400 text-xs">
                No vendor available
              </div>
            ) : (
              vendors.map((vendor, idx) => {
                const vendorImage =
                  getImageUrl(vendor?.bussinessdetails?.bussiness_image?.url) ||
                  "/assets/default.png";
                const vendorName = vendor?.bussinessdetails?.name || "N/A";
                const vendorAddress = vendor?.bussinessdetails?.address || "N/A";

                const basePrice = parseFloat(vendor?.price || 0);
                const discountPrice = parseFloat(vendor?.discountprice || vendor?.discountPrice || 0);
                const discountType = vendor?.discountType;

                let finalPrice = basePrice;
                let hasDiscount = false;

                if (discountType === "percentage" && discountPrice > 0) {
                  finalPrice = basePrice - (basePrice * discountPrice) / 100;
                  hasDiscount = true;
                } else if (discountPrice > 0 && discountPrice < basePrice) {
                  finalPrice = discountPrice;
                  hasDiscount = true;
                }

                return (
                  <div
                    key={vendor?._id || idx}
                    className="flex items-center gap-2 py-1.5 px-2 rounded-md transition-colors hover:bg-purple-50/30"
                  >
                    <div
                      className="flex-1 min-w-0 flex items-center gap-2 cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVendorClick(vendor);
                      }}
                    >
                      <div className="shrink-0">
                        <img
                          src={vendorImage}
                          alt={vendorName}
                          className="w-7 h-7 object-contain rounded border border-slate-200 p-0.5 bg-white"
                          onError={(e) => {
                            e.target.src = "/assets/default.png";
                          }}
                        />
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="text-[11px] font-bold text-slate-700 truncate">
                          {vendorName}
                        </div>
                        <div className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5 truncate">
                          <i className="fas fa-map-marker-alt text-[8px] text-[#8059ca] shrink-0"></i>
                          <span className="truncate">{vendorAddress}</span>
                        </div>

                        {basePrice > 0 && (
                          <div className="flex items-baseline gap-1 mt-0.5">
                            <span className="text-[10px] font-bold text-slate-800">
                              ₹{finalPrice.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <span className="text-[9px] text-slate-400 line-through">
                                ₹{basePrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    {renderVendorAction && (
                      <div
                        className="shrink-0 w-[82px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {renderVendorAction(vendor)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const AlternateProducts = ({
  relatedproducts = [],
  service,
  isMobile = false,
  isLoggedIn = false,
  userProfile = null,
  composition
}) => {
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };
  const { getCartQuantity, incrementItem, decrementItem } = useCart();
  const { addToCart } = useAddToCart();

  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [currentModalData, setCurrentModalData] = useState(null);

  const [rentalFormData, setRentalFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    deliveryAddress: "",
  });
  const [consultationFormData, setConsultationFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });
  const [appointmentFormData, setAppointmentFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });
  const [leadFormData, setLeadFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    address: "",
    policyNumber: "",
    relation: "",
  });

  const handleRentalFormChange = (e) => {
    const { name, value } = e.target;
    setRentalFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleConsultationFormChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAppointmentFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLeadFormChange = (e) => {
    const { name, value } = e.target;
    setLeadFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleVendorClick = (vendor) => {
    const vendorId =
      vendor?._id ||
      vendor?.businessdetails?._id ||
      vendor?.bussinessdetails?._id;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      const name =
        vendor?.bussinessdetails?.name || vendor?.name || "Vendor Store";
      const vendorSlug = name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  const hasValidImage = (product) => {
    const tablet = product?.tablet || {};

    if (
      tablet.imageUrl &&
      Array.isArray(tablet.imageUrl) &&
      tablet.imageUrl.length > 0
    ) {
      return true;
    }

    if (tablet.variant && Array.isArray(tablet.variant)) {
      for (const variant of tablet.variant) {
        if (
          variant.imageUrl &&
          Array.isArray(variant.imageUrl) &&
          variant.imageUrl.length > 0
        ) {
          return true;
        }
      }
    }

    return false;
  };

  const validProducts = relatedproducts.filter((product) =>
    hasValidImage(product),
  );

  if (!validProducts || validProducts.length === 0) {
    return null;
  }

  return (
    <div className={isMobile ? "mt-0" : "mt-5"}>
      <div className="flex justify-between items-center gap-3 mb-4 pb-3.5 border-b border-[#ede9f5]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-1.5 h-7 rounded-full bg-gradient-to-b from-[#8059ca] to-[#5a3a9c] shrink-0" aria-hidden="true" />
          <div className="text-[20px] !font-[500] text-slate-800 margin-0">
            Alternate Products
          </div>
          <div className="bg-[#8059ca]/10 text-[#8059ca] text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 leading-none">
            {validProducts.length}
          </div>
        </div>

        <button
          type="button"
          className="text-xs font-bold text-white bg-gradient-to-r from-[#8059ca] to-[#6d48b8] hover:shadow-md hover:shadow-purple-500/20 active:scale-[0.98] py-1.5 px-3.5 !rounded-md inline-flex items-center gap-1.5 transition-all duration-300 cursor-pointer border-none"
          onClick={() => {
            const firstProduct = relatedproducts[0];
            const firstProductComp = firstProduct?.tablet?.compositions || firstProduct?.tablet?.composition;
            const compSlug = composition || (firstProductComp?._id && firstProductComp?.name
              ? `${firstProductComp.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}-${firstProductComp._id}`
              : firstProductComp);

            if (compSlug && compSlug !== "N/A") {
              navigate(`/composition/${compSlug}`);
            } else {
              toast.error("Composition page not found");
            }
          }}
        >
          View All
          <i className="fas fa-arrow-right text-[10px]" aria-hidden="true" />
        </button>
      </div>

      <div className="relative w-full">
        {/* Scroll Left Button */}
        <button
          type="button"
          onClick={scrollLeft}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 !rounded-full bg-white border border-purple-200/50 shadow-md text-[#8059ca] flex items-center justify-center cursor-pointer transition-all hover:bg-[#8059ca] hover:text-white"
        >
          <i className="fa-solid fa-chevron-left text-[14px]"></i>
        </button>

        {/* Scroll Right Button */}
        <button
          type="button"
          onClick={scrollRight}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 !rounded-full bg-white border border-purple-200/50 shadow-md text-[#8059ca] flex items-center justify-center cursor-pointer transition-all hover:bg-[#8059ca] hover:text-white"
        >
          <i className="fa-solid fa-chevron-right text-[14px]"></i>
        </button>

        <div
          ref={scrollRef}
          className="grid grid-auto-cols-[250px] grid-flow-col gap-4 overflow-x-auto overflow-y-hidden pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden"
          style={{
            gridAutoColumns: "250px",
            gridAutoFlow: "column",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {relatedproducts
            .filter((product) => hasValidImage(product))
            .map((product, index) => {
              const firstVariant = product?.tablet?.variant?.[0];
              const firstVendor = product?.vendors?.[0];
              const variantImageFile =
                firstVariant?.files?.[0] ||
                firstVariant?.frontImage?.[0] ||
                product?.tablet?.files?.[0] ||
                null;

              const variantImageUrl =
                firstVariant?.imageUrl?.[0] ||
                product?.tablet?.imageUrl?.[0] ||
                null;

              const allImageFiles = variantImageFile
                ? [variantImageFile]
                : variantImageUrl
                  ? [variantImageUrl]
                  : [];

              const variantImage = allImageFiles[0]
                ? allImageFiles[0].startsWith("/")
                  ? getImageUrl(allImageFiles[0])
                  : allImageFiles[0]
                : "/assets/default.png";
              const bookingType =
                firstVendor?.bookingType || firstVendor?.bookingtype || null;
              const isVariant = !!firstVariant;
              const basePrice = isVariant
                ? (firstVendor?.variant?.[0]?.price ??
                  firstVendor?.price ??
                  firstVariant?.price ??
                  product?.tablet?.price ??
                  0)
                : (firstVendor?.price ?? product?.tablet?.price ?? 0);

              const discountPrice = isVariant
                ? (firstVendor?.variant?.[0]?.discountprice ??
                  firstVendor?.variant?.[0]?.discountPrice ??
                  firstVendor?.discountprice ??
                  firstVendor?.discountPrice ??
                  null)
                : (firstVendor?.discountprice ??
                  firstVendor?.discountPrice ??
                  null);
              const discountType = isVariant
                ? (firstVendor?.variant?.[0]?.discountType ??
                  firstVendor?.discountType ??
                  null)
                : (firstVendor?.discountType ??
                  null);

              let calculatedDiscountPrice = discountPrice;
              if (discountType === "percentage" && discountPrice && discountPrice > 0) {
                calculatedDiscountPrice = basePrice - (basePrice * discountPrice / 100);
              }

              const hasValidDiscount =
                (discountType === "percentage" && discountPrice && discountPrice > 0) ||
                (discountPrice && discountPrice > 0 && discountPrice < basePrice);
              const finalPrice = hasValidDiscount ? calculatedDiscountPrice : basePrice;
              const originalPrice = hasValidDiscount ? basePrice : null;
              let discountPercent = 0;
              if (hasValidDiscount) {
                if (discountType === "percentage") {
                  discountPercent = discountPrice;
                } else {
                  discountPercent = Math.round(
                    ((basePrice - discountPrice) / basePrice) * 100,
                  );
                }
              }

              const stock = isVariant
                ? (firstVendor?.variant?.[0]?.stock ?? firstVendor?.stock ?? 0)
                : (firstVendor?.stock ?? 0);

              const serviceBookingTypes = [
                "consultation",
                "appointment",
                "ride",
                "rentals",
                "slots",
                "lead",
                "leads",
                "booking",
                "rentals_addtocarts",
                "cart",
              ];
              const isServiceTypeForStock =
                serviceBookingTypes.includes(bookingType);
              const isInStock = isServiceTypeForStock ? true : stock > 0;
              const effectiveVariantId = firstVariant?._id || null;
              const quantity = getCartQuantity(
                firstVendor?._id || firstVendor?.vendorId,
                product?.tablet?._id || product?._id,
                effectiveVariantId,
              );
              let maxStock = 999;
              if (isVariant && effectiveVariantId) {
                const matchedVendorVariant = firstVendor?.variant?.find(
                  (v) =>
                    v.variantId === effectiveVariantId ||
                    v._id === effectiveVariantId,
                );
                if (matchedVendorVariant && matchedVendorVariant.isStock) {
                  maxStock = matchedVendorVariant.stock ?? 0;
                } else if (
                  matchedVendorVariant &&
                  matchedVendorVariant.stock !== undefined
                ) {
                  maxStock = matchedVendorVariant.stock ?? 999;
                } else {
                  const vendorStock = firstVendor?.stock;
                  maxStock =
                    vendorStock !== undefined && vendorStock !== null
                      ? vendorStock
                      : 999;
                }
              } else {
                const vendorStock = firstVendor?.stock;
                maxStock =
                  vendorStock !== undefined && vendorStock !== null
                    ? vendorStock
                    : 999;
              }

              const composition = product?.tablet?.compositions || "N/A";
              const productSlug = product?.tablet?.slug;
              const productId = product?.tablet?._id || product?._id;
              const productType =
                product?.tablet?.subcategorys?.category?.fixedType || "";
              const categoryData = product?.tablet?.subcategorys?.category;
              const subcategoryData = product?.tablet?.subcategorys;
              const productService =
                categoryData?.slug ||
                (categoryData?.name
                  ? categoryData.name.toLowerCase().replace(/\s+/g, "-")
                  : null) ||
                categoryData?.fixedType ||
                service ||
                "medicines";
              const categories =
                subcategoryData?.slug ||
                (subcategoryData?.name
                  ? subcategoryData.name.toLowerCase().replace(/\s+/g, "-")
                  : null) ||
                productSlug;

              const handleProductClick = () => {
                if (productService && categories && (productSlug || productId)) {
                  navigate(
                    `/${encodeURIComponent(productService)}/${encodeURIComponent(
                      categories,
                    )}/${encodeURIComponent(productSlug || productId)}`,
                    {
                      state: {
                        selectedVariantId: firstVariant?._id || null,
                      },
                    },
                  );
                } else {
                  navigate(`/${productService}/${productSlug || productId}`);
                }
              };

              const bookingRedirectPath =
                bookingType === "slots"
                  ? "/booking-process/slot"
                  : "/booking-process";

              const handleNavigateToBooking = async (vendor) => {
                const payload = [
                  {
                    productId: product?.tablet?._id || productId,
                    variantId: effectiveVariantId,
                    vendorId: vendor?._id || vendor?.vendorId,
                    packageId: null,
                    type: "normal",
                    bookingType: "buy_now",
                  },
                ];
                const token = localStorage.getItem("medicomparestoken");

                if (!token) {
                  toast.error("Please login to proceed");
                  redirectToLoginWithPendingBooking(navigate, payload, {
                    redirectPath: bookingRedirectPath,
                  });
                  return;
                }

                try {
                  const response = await axiosCommonInstance.post(
                    "cart/buynow/create",
                    payload,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  navigate(bookingRedirectPath, {
                    state: { bookingData: response.data },
                  });
                } catch (error) {
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    redirectToLoginWithPendingBooking(navigate, payload, {
                      redirectPath: bookingRedirectPath,
                    });
                  } else {
                    toast.error("Failed to create booking");
                  }
                }
              };

              const handleRentalBookinProcess = async (vendor) => {
                const payload = [
                  {
                    productId: product?.tablet?._id || productId,
                    variantId: effectiveVariantId,
                    vendorId: vendor?._id || vendor?.vendorId,
                    packageId: null,
                    type: "normal",
                    bookingType: "buy_now",
                    perDayRent: vendor?.perDayRent || 0,
                    servicefixedTypes: service
                  },
                ];
                const token = localStorage.getItem("medicomparestoken");

                if (!token) {
                  toast.error("Please login to proceed");
                  redirectToLoginWithPendingBooking(navigate, payload, {
                    redirectPath: "/rental-booking-process",
                    perDayRent: vendor?.perDayRent || 0,
                  });
                  return;
                }

                try {
                  if (vendor?.perDayRent) {
                    localStorage.setItem("perDayRent", vendor.perDayRent);
                  }

                  const response = await axiosCommonInstance.post(
                    "cart/buynow/create",
                    payload,
                    {
                      headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                      },
                    },
                  );

                  navigate("/rental-booking-process", {
                    state: { bookingData: response.data },
                  });
                } catch (error) {
                  if (error.response?.status === 401) {
                    toast.error("Session expired. Please login again.");
                    redirectToLoginWithPendingBooking(navigate, payload, {
                      redirectPath: "/rental-booking-process",
                      perDayRent: vendor?.perDayRent || 0,
                    });
                  } else {
                    toast.error("Failed to create booking");
                  }
                }
              };

              const handleAddLead = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
                if (!isLoggedIn) {
                  toast.error("Please login");
                  navigate("/login");
                  return;
                }

                setLeadFormData({
                  name: userProfile
                    ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
                      }`.trim()
                    : "",
                  email: userProfile?.email || "",
                  mobile: userProfile?.phone || "",
                  address: userProfile?.address || "",
                  policyNumber: "",
                  relation: "",
                });

                setCurrentModalData({
                  vendor,
                  med: product?.tablet || product,
                  variantId: effectiveVariantId,
                  matchedVariant: {
                    price: vendorCtx.basePrice,
                    stock: vendorCtx.stock,
                  },
                });
                setShowLeadModal(true);
              };

              const handleOpenRentalModal = () => {
                if (!isLoggedIn) {
                  toast.error("Please login to rent");
                  navigate("/login");
                  return;
                }

                setRentalFormData({
                  startDate: "",
                  startTime: "",
                  endDate: "",
                  endTime: "",
                  deliveryAddress: userProfile?.address || "",
                });

                const selectedVar = product?.tablet?.variant?.find(
                  (v) => v._id === effectiveVariantId,
                );
                setCurrentModalData({
                  vendor: firstVendor,
                  med: product?.tablet || product,
                  effectiveVariantId,
                  price: basePrice,
                  stock,
                  selectedVar,
                });
                setShowRentModal(true);
              };

              const handleOpenConsultationModal = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
                if (!isLoggedIn) {
                  toast.error("Please login to book consultation");
                  navigate("/login");
                  return;
                }

                const today = new Date().toISOString().split("T")[0];
                setConsultationFormData({
                  date: today,
                  name: userProfile
                    ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
                      }`.trim()
                    : "",
                  phone: userProfile?.phone || "",
                  category: "",
                  address: userProfile?.address || "",
                });

                setCurrentModalData({
                  vendor,
                  med: product?.tablet || product,
                  effectiveVariantId,
                  price: vendorCtx.basePrice,
                  stock: vendorCtx.stock,
                });
                setShowConsultationModal(true);
              };

              const handleOpenAppointmentModal = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
                if (!isLoggedIn) {
                  toast.error("Please login to book appointment");
                  navigate("/login");
                  return;
                }

                const today = new Date().toISOString().split("T")[0];
                setAppointmentFormData({
                  date: today,
                  name: userProfile
                    ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
                      }`.trim()
                    : "",
                  phone: userProfile?.phone || "",
                  category: "",
                  address: userProfile?.address || "",
                });

                setCurrentModalData({
                  vendor,
                  med: product?.tablet || product,
                  effectiveVariantId,
                  price: vendorCtx.basePrice,
                  stock: vendorCtx.stock,
                });
                setShowAppointmentModal(true);
              };

              const handleAddToCart = async () => {
                localStorage.setItem("isCart", true);
                const selectedVar = product?.tablet?.variant?.find(
                  (v) => v._id === effectiveVariantId,
                );
                const inStock = !!(
                  (selectedVar && selectedVar.stock && selectedVar.stock > 0) ||
                  firstVendor?.stock > 0 ||
                  product?.tablet?.stock > 0
                );
                if (!inStock) {
                  toast.error("Item is out of stock");
                  return;
                }
                const finalPrice =
                  discountPrice && discountPrice > 0 ? discountPrice : basePrice;
                const item = {
                  tabletdetails: product?.tablet || product,
                  vendordetails: firstVendor?.bussinessdetails || firstVendor,
                  variants: product?.tablet?.variant || [],
                  price: finalPrice,
                  discountprice: discountPrice,
                  discountType: discountType,
                };

                await addToCart(item, selectedVar, {
                  bookingType: "cart",
                  type: "normal",
                });
              };

              const handleSingleAddToCart = async () => {
                localStorage.setItem("isCart", true);
                const inStock = !!(
                  product?.tablet?.stock > 0 || firstVendor?.stock > 0
                );
                if (!inStock) {
                  toast.error("Item is out of stock");
                  return;
                }
                const finalPrice =
                  discountPrice && discountPrice > 0 ? discountPrice : basePrice;
                const item = {
                  tabletdetails: product?.tablet || product,
                  vendordetails: firstVendor?.bussinessdetails || firstVendor,
                  variants: [],
                  price: finalPrice,
                  discountprice: discountPrice,
                  discountType: discountType,
                };

                await addToCart(item, null, {
                  bookingType: "cart",
                  type: "normal",
                });
              };

              const renderVendorActionButton = (vendor) => {
                const vendorCtx = getVendorActionContext(
                  vendor,
                  product,
                  firstVariant,
                  effectiveVariantId,
                  getCartQuantity,
                  productId,
                );
                const {
                  bookingType: vendorBookingType,
                  isInStock: vendorInStock,
                  maxStock: vendorMaxStock,
                  finalPrice: vendorFinalPrice,
                  discountPrice: vendorDiscountPrice,
                } = vendorCtx;

                return (
                  <VendorActions
                    bookingType={vendorBookingType}
                    isInStock={vendorInStock}
                    med={product?.tablet || product}
                    vendor={vendor || vendor || {}}
                    effectiveVariantId={effectiveVariantId}
                    price={vendorFinalPrice}
                    stock={vendorMaxStock}
                    rentPerDay={vendor?.perDayRent}
                    service={product?.tablet?.category?.fixedType}
                    calculatedDiscountPrice={vendorDiscountPrice}
                    handleRentalBookinProcess={handleRentalBookinProcess}
                    handleNavigateToBooking={handleNavigateToBooking}
                    handleAddLead={handleAddLead}
                    handleOpenConsultationModal={handleOpenConsultationModal}
                    handleOpenAppointmentModal={handleOpenAppointmentModal}
                    handleAddToCart={handleAddToCart}
                    handleSingleAddToCart={handleSingleAddToCart}
                    className="w-full"
                    containerStyle={{
                      display: "flex",
                      flexDirection: vendorBookingType === "rentals_addtocarts" ? "column" : "row",
                      width: "100%",
                      gap: "8px",
                      alignItems: "center",
                    }}
                    buttonStyle={{
                      flex: 1,
                    }}
                    rentAndCartButtonStyles={{
                      flex: 1,
                    }}
                  />
                );
              };

              return (
                <div
                  key={product._id || product?.tablet?._id || index}
                  className="w-[250px] border border-slate-200/80 !rounded-md overflow-visible bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(128,89,202,0.12)] cursor-pointer flex flex-col h-full relative transition-all duration-300"
                >
                  {product?.tablet?.medicineType && (
                    <div
                      className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-rose-600 text-white text-[9px] font-extrabold py-0.5 px-2 rounded-full uppercase tracking-wider z-10 shadow-sm"
                    >
                      {product.tablet.medicineType}
                    </div>
                  )}

                  <div
                    className="relative w-full h-[150px] bg-gradient-to-br from-purple-50/10 to-slate-50/50 p-2 flex items-center justify-center overflow-hidden shrink-0 rounded-t-xl"
                    onClick={handleProductClick}
                  >
                    <img
                      src={variantImage}
                      title={product?.tablet?.name || "Product"}
                      alt={product?.tablet?.name || "Product"}
                      className="max-w-full max-h-full h-auto w-auto object-contain mix-blend-multiply transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src = "/medicine.jpg";
                      }}
                    />
                    {productSlug && (
                      <CompareOverlayButton tablet={product?.tablet} serviceType={productService} />
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between">
                    <div className="flex flex-col gap-1 mb-1">
                      {product?.tablet?.manufacture?.name && (
                        <div className="flex">
                          <span
                            className="text-[9px] text-[#8059ca] bg-[#8059ca]/10 border border-[#8059ca]/15 px-1.5 py-0.5 !rounded-md font-bold tracking-wide truncate max-w-full"
                            title={product.tablet.manufacture.name}
                          >
                            By {product.tablet.manufacture.name}
                          </span>
                        </div>
                      )}
                      <h6
                        className="!text-[13px] !font-semibold text-slate-800 margin-0 leading-normal line-clamp-2 overflow-hidden text-ellipsis h-5 hover:text-[#8059ca] transition-colors"
                        onClick={handleProductClick}
                      >
                        {(() => {
                          const name = product?.tablet?.name || "Product Name";
                          const capitalizedName = typeof name === 'string' ? name.charAt(0).toUpperCase() + name.slice(1) : name;
                          return capitalizedName;
                        })()}
                      </h6>
                    </div>

                    {typeof finalPrice === "number" && finalPrice > 0 && (
                      <div className="flex items-baseline gap-1.5 mb-2.5 flex-wrap">
                        <span className="text-[14px] font-extrabold text-[#8059ca]">
                          ₹{finalPrice.toFixed(2)}
                        </span>
                        {originalPrice && originalPrice > finalPrice && (
                          <>
                            <span className="text-[11px] text-slate-400 line-through">
                              ₹{originalPrice.toFixed(2)}
                            </span>
                            {discountPercent > 0 && (
                              <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100/50 px-1 py-0.5 !rounded-md">
                                {discountPercent}% OFF
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    )}

                    {(product?.tablet?.reportsDuration ||
                      product?.tablet?.reportDuration) && (
                        <div className="flex items-center gap-1.5 mb-3 text-[11px] text-slate-500">
                          <i className="fas fa-file-alt text-[#8059ca] text-[11px] shrink-0"></i>
                          <span>
                            Reports in{" "}
                            <strong>
                              {product?.tablet?.reportsDuration ||
                                product?.tablet?.reportDuration}
                            </strong>
                          </span>
                        </div>
                      )}

                    {(() => {
                      const tablet = product?.tablet || {};
                      const availableKeys = [];

                      if (tablet.form) {
                        availableKeys.push({
                          icon: "fas fa-pills",
                          label: "Form",
                          value: tablet.form,
                        });
                      }
                      if (tablet.complexity) {
                        availableKeys.push({
                          icon: "fas fa-cogs",
                          label: "Complexity",
                          value: tablet.complexity,
                          color:
                            tablet.complexity === "simple"
                              ? "#059669"
                              : tablet.complexity === "medium"
                                ? "#d97706"
                                : tablet.complexity === "complex"
                                  ? "#dc2626"
                                  : "#666",
                        });
                      }
                      if (tablet.treatmenttype) {
                        availableKeys.push({
                          icon: "fas fa-tooth",
                          label: "Treatment Type",
                          value: tablet.treatmenttype,
                        });
                      }
                      if (tablet.gender) {
                        availableKeys.push({
                          icon: "fas fa-venus-mars",
                          label: "Gender",
                          value: tablet.gender,
                        });
                      }
                      if (tablet.smapletype) {
                        availableKeys.push({
                          icon: "fas fa-flask",
                          label: "Sample Type",
                          value: tablet.smapletype,
                        });
                      }
                      if (tablet.isFasting) {
                        availableKeys.push({
                          icon: "fas fa-moon",
                          label: "Fasting",
                          value:
                            tablet.isFasting?.charAt(0)?.toUpperCase() +
                            tablet.isFasting?.slice(1) || "No Fasting",
                        });
                      }
                      if (tablet.duration) {
                        availableKeys.push({
                          icon: "fas fa-clock",
                          label: "Duration",
                          value: tablet.duration,
                        });
                      }
                      if (tablet.bodypart) {
                        availableKeys.push({
                          icon: "fas fa-person",
                          label: "Body Part",
                          value: tablet.bodypart,
                        });
                      }
                      if (tablet.compositions?.name) {
                        availableKeys.push({
                          icon: "fas fa-vial",
                          label: "Composition",
                          value:
                            tablet.compositions.name.length > 20
                              ? tablet.compositions.name.slice(0, 20) + "..."
                              : tablet.compositions.name,
                        });
                      }

                      const keysToShow = availableKeys.slice(0, 3);

                      return keysToShow.length > 0 ? (
                        <div className="flex flex-col gap-1 mb-3 text-[10.5px] text-slate-500">
                          {keysToShow.map((key, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-1.5"
                            >
                              <i
                                className={`${key.icon} text-[#8059ca] text-[9.5px] w-3 shrink-0`}
                              ></i>
                              <span className="flex items-center gap-1 flex-wrap">
                                <strong>{key.label}:</strong>
                                <span
                                  style={{
                                    color: key.color || "#666",
                                    textTransform: key.color
                                      ? "capitalize"
                                      : "none",
                                  }}
                                >
                                  {key.value}
                                </span>
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : null;
                    })()}

                    <div className="flex flex-col w-full mt-auto relative">
                      <CollapsibleVendorList
                        vendors={product?.vendors}
                        handleVendorClick={handleVendorClick}
                        renderVendorAction={renderVendorActionButton}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Modals */}
      {showLeadModal && currentModalData && (
        <LeadModal
          show={showLeadModal}
          onClose={() => {
            setShowLeadModal(false);
            setLeadFormData({
              name: "",
              email: "",
              mobile: "",
              address: "",
              policyNumber: "",
              relation: "",
            });
            setCurrentModalData(null);
          }}
          formData={leadFormData}
          onChange={handleLeadFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.variantId}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
          formType="leads"
        />
      )}

      {showRentModal && currentModalData && (
        <RentModal
          show={showRentModal}
          onClose={() => {
            setShowRentModal(false);
            setRentalFormData({
              startDate: "",
              startTime: "",
              endDate: "",
              endTime: "",
              deliveryAddress: "",
            });
            setCurrentModalData(null);
          }}
          rentProduct={{
            tabletdetails: currentModalData.med,
            vendordetails:
              currentModalData.vendor?.bussinessdetails ||
              currentModalData.vendor,
            price: currentModalData.price,
          }}
          formData={rentalFormData}
          onFormChange={handleRentalFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          userProfile={userProfile}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
        />
      )}

      {showConsultationModal && currentModalData && (
        <ConsultationModal
          show={showConsultationModal}
          onClose={() => {
            setShowConsultationModal(false);
            setConsultationFormData({
              date: "",
              name: "",
              phone: "",
              category: "",
              address: "",
            });
            setCurrentModalData(null);
          }}
          formData={consultationFormData}
          onFormChange={handleConsultationFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
          formType="consultation"
          title="Book a Consultation"
        />
      )}

      {showAppointmentModal && currentModalData && (
        <AppointmentModal
          show={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setAppointmentFormData({
              date: "",
              name: "",
              phone: "",
              category: "",
              address: "",
            });
            setCurrentModalData(null);
          }}
          formData={appointmentFormData}
          onFormChange={handleAppointmentFormChange}
          productId={currentModalData.med?._id || currentModalData.med?.id}
          vendorId={
            currentModalData.vendor?.vendorId || currentModalData.vendor?._id
          }
          variantId={currentModalData.effectiveVariantId}
          fixedType={
            currentModalData.med?.subcategorys?.category?.fixedType ||
            service ||
            "pharmacy"
          }
          formType="appointment"
        />
      )}
    </div>
  );
};

export default AlternateProducts;
