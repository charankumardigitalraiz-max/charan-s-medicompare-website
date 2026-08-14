import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  axiosUserInstance,
  axiosCommonInstance,
  imgUrl,
} from "../../Apiservice";
import { getImageUrl } from "../../utils/index";
import { toast } from "react-hot-toast";
import { useResponsive } from "../../hooks/useResponsive";
import DOMPurify from "dompurify";
import { FaRegShareSquare, FaHeart, FaExchangeAlt, FaStar } from "react-icons/fa";
import { IoIosHeartEmpty } from "react-icons/io";
import { Tabs } from "../../components/ui";
import Pagination from "../../components/ui/Pagination.jsx";
import CompareOverlayButton from "../../components/ui/CompareOverlayButton";
import ShareModal from "../../components/products/ShareModal.jsx";
import { getShareUrl } from "../../utils/shareUtils.js";

const getSlugs = (data) => {
  let sub =
    data?.subcatdetails ||
    data?.subcategorydetails ||
    data?.subcategoryDetails ||
    data?.subcategorys;
  if (Array.isArray(sub)) {
    sub = sub[0];
  }

  const cat = sub?.catdetails || sub?.categoryDetails || sub?.category;

  return {
    category: cat?.slug,
    subcategory: sub?.slug,
    slug: data?.slug,
  };
};

const DetailRow = ({ label, value, title }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  if (!value) return null;

  return (
    <div
      className={`detail-item-compact ${isExpanded ? "is-expanded" : ""} flex items-center justify-between w-full px-2 py-1 ${value.length > 25 ? "cursor-pointer" : "cursor-default"
        }`}
      onClick={(e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      title={title || value}
    >
      <span className="detail-label text-[11px] font-medium text-slate-500 capitalize tracking-[0.02em]">
        {label}
      </span>
      <span className="detail-value text-[11.5px] font-medium text-slate-800 text-right">
        {value}
      </span>
    </div>
  );
};

const Favourites = ({ HomeNavigate, BackButton }) => {
  const [favourites, setFavourites] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState("All");

  const favTabs = useMemo(() => {
    return [
      { name: "All", fixedType: "All" },
      ...services.map((service) => ({
        name: service.charAt(0).toUpperCase() + service.slice(1),
        fixedType: service,
      })),
    ];
  }, [services]);
  const [hoveredSideEffectsId, setHoveredSideEffectsId] = useState(null);
  const [hoveredPrecautionsId, setHoveredPrecautionsId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const favouritesPerPage = 8;
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProductData, setShareProductData] = useState(null);

  const handleShare = (item) => {
    setShareProductData(item);
    setShowShareModal(true);
  };

  const toSearchText = (value) => {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value.toLowerCase();
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value).toLowerCase();
    }
    if (Array.isArray(value)) {
      return value
        .map((v) => {
          if (v === null || v === undefined) return "";
          if (typeof v === "string") return v;
          if (typeof v === "number" || typeof v === "boolean") return String(v);
          return v?.name || v?.slug || v?.fixedType || "";
        })
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
    }
    if (typeof value === "object") {
      return String(value?.name || value?.slug || value?.fixedType || "").toLowerCase();
    }
    return "";
  };

  // const handleShare = async (item, e) => {
  //   if (e) e.stopPropagation();
  //   try {
  //     const serviceType = item?.category?.[0]?.fixedType || "medicine";
  //     const { category, subcategory, slug } = getSlugs(item);
  //     const url = `${window.location.origin}/${encodeURIComponent(category || serviceType)}/${encodeURIComponent(subcategory || "all")}/${encodeURIComponent(slug || item._id)}`;
  //     await navigator.clipboard.writeText(url);
  //     toast.success("Link copied to clipboard!");
  //   } catch (err) {
  //     toast.error("Failed to copy link");
  //   }
  // };

  const fetchFavourites = async () => {
    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      toast.error("Please login to view favourites");
      navigate("/login");
      return;
    }

    try {
      const response = await axiosUserInstance.get("favourite/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const favs = response.data?.data?.favourites || [];
      const allTablets = favs.flatMap((fav) => fav.tablets || []);
      const services = [
        ...new Set(
          response.data?.data?.favourites
            ?.flatMap((fav) =>
              fav.tablets?.map((tablet) => tablet.category?.[0]?.fixedType)
            )
            ?.filter(Boolean)
        ),
      ];

      setServices(services);
      setFavourites(allTablets);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Failed to load favourites.");
      }
    }
  };

  useEffect(() => {
    fetchFavourites();
  }, []);

  const handleToggleFavourite = async (itemId, isFav) => {
    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      toast.error("Please login to continue");
      navigate("/login");
      return;
    }

    try {
      const endpoint = isFav ? "favourite/remove" : "favourite/add";
      const payload = { itemId };

      await axiosUserInstance.post(endpoint, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (isFav) {
        setFavourites((prev) => prev.filter((item) => item._id !== itemId));
      } else {
        fetchFavourites();
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        navigate("/login");
      } else {
        toast.error("Something went wrong.");
      }
    }
  };

  const filteredFavourites = favourites.filter((item) => {
    if (selectedService && selectedService !== "All") {
      const fixedType = item?.category?.[0]?.fixedType;
      if (fixedType !== selectedService) return false;
    }

    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase().trim();
    const itemName = toSearchText(item?.name);
    const itemCategory = toSearchText(item?.category);
    const itemService = toSearchText(item?.service);

    return (
      itemName.includes(searchLower) ||
      itemCategory.includes(searchLower) ||
      itemService.includes(searchLower)
    );
  });

  const indexOfLastFav = currentPage * favouritesPerPage;
  const indexOfFirstFav = indexOfLastFav - favouritesPerPage;
  const currentFavourites = filteredFavourites.slice(
    indexOfFirstFav,
    indexOfLastFav,
  );
  const totalPages = Math.ceil(filteredFavourites.length / favouritesPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedService]);

  const handleProductClick = async (item, e) => {
    if (e) {
      e.preventDefault();
    }

    const productId = item?.slug || item?._id;
    if (!productId) {
      toast.error("Product ID not found");
      return;
    }

    try {
      const response = await axiosCommonInstance.get(
        `product/show/${productId}`,
      );
      const productData =
        response?.data?.data?.product ||
        response?.data?.product ||
        response?.data?.data ||
        response?.data;

      if (!productData) {
        toast.error("Product not found");
        return;
      }

      const tabletData = productData?.tablet || productData;
      const subcategoryData =
        tabletData?.subcategoryDetails || tabletData?.subcategorys;
      const categoryData =
        subcategoryData?.categoryDetails || subcategoryData?.category;
      const service =
        categoryData?.slug ||
        (categoryData?.name
          ? categoryData.name.toLowerCase().replace(/\s+/g, "-")
          : null) ||
        productData?.service ||
        tabletData?.service ||
        "medicine";
      let categories = null;
      if (subcategoryData?.slug) {
        categories = subcategoryData.slug;
      } else if (subcategoryData?.name) {
        categories = subcategoryData.name.toLowerCase().replace(/\s+/g, "-");
      } else {
        if (service === "lab-tests") {
          categories = "all";
        } else if (service === "home-care-services") {
          categories = "all";
        } else {
          categories = "tablets";
        }
      }

      if (categories === productId) {
        if (service === "lab-tests") {
          categories = "all";
        } else if (service === "home-care-services") {
          categories = "all";
        } else {
          categories = "tablets";
        }
      }

      if (!service || !categories || !productId) {
        toast.error("Product details not available");
        return;
      }

      const isMedicine =
        categoryData?.fixedType === "medicine" ||
        tabletData?.subcategorys?.category?.fixedType === "medicine" ||
        subcategoryData?.category?.fixedType === "medicine";

      const nonMedicineServices = [
        "lab-tests",
        "home-care-services",
        "surgeries",
        "ambulance",
        "consultation",
      ];
      const isNonMedicineService = nonMedicineServices.includes(service);

      let pincode = null;
      if (isMedicine && !isNonMedicineService) {
        const savedLocation = localStorage.getItem("selectedLocation");
        if (savedLocation) {
          try {
            const locationData = JSON.parse(savedLocation);
            if (locationData.pincode && locationData.pincode.length === 6) {
              pincode = locationData.pincode;
            }
          } catch (e) {
          }
        }
      }

      let url = `/${encodeURIComponent(service)}/${encodeURIComponent(categories)}/${encodeURIComponent(productId)}`;

      if (isMedicine && !isNonMedicineService && pincode) {
        url += `?pincode=${pincode}`;
      }

      navigate(url, {
        state: {
          selectedVariantId:
            item.variantId || tabletData?.variant?.[0]?._id || null,
        },
      });
    } catch (error) {
      toast.error("Failed to load product details");
    }
  };


  const sanitizeHTML = (htmlContent) => {
    if (!htmlContent) return "";

    let cleanedContent = htmlContent
      .replace(/\\n/g, ' ')
      .replace(/\\t/g, ' ')
      .replace(/\\\\/g, '')
      .replace(/\\\s*$/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    return DOMPurify.sanitize(cleanedContent, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'span', 'div'],
      ALLOWED_ATTR: ['class']
    });
  };

  const formatValue = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val).replace(/_/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
    return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
  };

  return (
    <div className="w-full px-4 md:px-6 py-4">
      {/* Header - aligned with MedicineBookings header pattern */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 mb-2 border-b border-slate-100 mt-2">
        <div className="flex items-center gap-3.5">
          {HomeNavigate && <HomeNavigate />}
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#321961] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
            <i className="fa-solid fa-heart" />
          </div>

          <div className="flex flex-col gap-1">
            <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
              My Favourites
            </div>
            <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
              View and manage all your favourite items
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[250px] shrink-0">
            <input
              type="text"
              placeholder="Search favourites..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-[42px] rounded-sm border border-[#e0e0e0] pl-10 pr-4 text-sm w-full outline-none focus:border-[#321961] transition-colors"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#999] pointer-events-none">
              <i className="fa-solid fa-search" />
            </span>
          </div>
        </div>
      </div>

      {/* Service filter tabs */}
      <div className="border-b border-slate-200 pb-1.5 mb-4">
        <Tabs
          tabs={favTabs}
          activeTab={selectedService}
          onChange={setSelectedService}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredFavourites.length === 0 ? (
          <div className="col-span-full">
            <div className="flex flex-col items-center justify-center text-center py-[60px] px-5">
              <div className="w-[200px] h-[200px] mb-[30px] flex items-center justify-center bg-slate-50 rounded-full">
                <svg
                  width="120"
                  height="120"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="opacity-60"
                >
                  <path
                    d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                    stroke="#dc3545"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </div>
              <h4 className="text-[24px] font-semibold text-slate-800 mb-2.5">
                {searchTerm ? "No Results Found" : "No Favourites Yet"}
              </h4>
              <p className="text-[16px] text-slate-500 mb-0 max-w-[400px]">
                {searchTerm
                  ? "Try adjusting your search term to find what you're looking for"
                  : "Start adding items to your favourites to see them here"}
              </p>
            </div>
          </div>
        ) : (
          currentFavourites.map((item) => {
            const serviceType = item?.category?.[0]?.fixedType || "medicine";
            const DiscountType = item?.discountType;
            const Discount = item?.discountprice;
            const CurrentPrice = item?.variant?.[0]?.price || item?.price;
            let FinalAmount;
            if (DiscountType === "percentage") {
              FinalAmount = CurrentPrice - ((Discount / 100) * CurrentPrice);
            } else if (DiscountType === "price") {
              FinalAmount = Discount;
            } else {
              FinalAmount = item?.variant?.[0]?.discountprice || item?.discountprice || CurrentPrice;
            }
            const hasDiscount = FinalAmount < CurrentPrice && FinalAmount > 0;
            const discountPercent = hasDiscount
              ? (DiscountType === "percentage" ? Math.round(Discount) : Math.round(((CurrentPrice - FinalAmount) / CurrentPrice) * 100))
              : 0;

            return (
              <div
                className="flex h-full"
                key={item._id || item.id}
              >
                <div
                  className="modern-product-card product-card-vertical h-full w-full flex flex-col cursor-pointer border border-slate-200 shadow-[0_4px_10px_rgba(0,0,0,0.05)] rounded-[10px] bg-white transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] relative"
                  onClick={() => handleProductClick(item)}
                >
                  {/* Image Container */}
                  <div className="product-image-container-vertical relative overflow-hidden rounded-t-[10px] h-[168px] flex items-center justify-center">
                    <img
                      alt={item.name}
                      title={item.name}
                      loading="lazy"
                      src={
                        item.variant &&
                          item.variant.length > 0 &&
                          item.variant[0].files &&
                          item.variant[0].files.length > 0
                          ? getImageUrl(item.variant[0].files[0])
                          : item.files && item.files.length > 0
                            ? getImageUrl(item.files[0])
                            : item.imageUrl && item.imageUrl.length > 0
                              ? getImageUrl(item.imageUrl[0])
                              : "/medicine.jpg"
                      }
                      onError={(e) => {
                        e.target.src = "/medicine.jpg";
                      }}
                      className={
                        serviceType !== "medicine" &&
                          serviceType !== "medical-equipment" &&
                          serviceType !== "medicalequipment"
                          ? "w-[120px] h-[120px] rounded-full object-cover border-2 border-solid border-[#7d2eff]/10"
                          : "max-h-[90%] max-w-[90%] object-contain"
                      }
                    />

                    {/* Rating Overlay */}
                    <div className="absolute top-2.5 left-2.5 bg-white px-2 py-0.5 rounded-full text-[11px] font-semibold flex items-center gap-1 shadow-[0_2px_5px_rgba(0,0,0,0.1)] border border-slate-200 z-10">
                      <FaStar className="text-warning text-[10px]" />
                      <span>{item?.averageRating?.toFixed(1) || "0"}</span>
                      <span className="text-slate-400 font-normal text-[10px]">
                        ({item?.ratingCount > 0 ? `${item.ratingCount}` : "0"})
                      </span>
                    </div>

                    {/* Compare Overlay Button */}
                    <CompareOverlayButton tablet={item} serviceType={serviceType} />
                  </div>

                  {/* Card Body */}
                  <div className="product-card-body !flex-1 !flex !flex-col px-2.5 py-2 gap-0.5">
                    <div className="flex items-start justify-between w-full gap-2">
                      <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                        <div
                          className="product-title text-capitalize text-[13px] font-medium leading-[1.3] m-0 text-slate-900 tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis block"
                          title={item.name || ""}
                        >
                          {item.name}
                        </div>
                        {/* Price Display */}
                        {CurrentPrice && (
                          <div className="flex items-center flex-wrap font-['Poppins'] mt-0.5 gap-1.5">
                            <span className="flex items-center gap-[3px]">
                              <span className="text-[11px] font-semibold text-slate-500">
                                MRP
                              </span>
                              <strong className="text-slate-900 text-[13px] font-bold">
                                ₹{typeof FinalAmount === "number" ? FinalAmount.toFixed(2) : FinalAmount}
                              </strong>
                            </span>
                            {hasDiscount && (
                              <>
                                <span className="text-[11px] text-slate-400 line-through">
                                  ₹{typeof CurrentPrice === "number" ? CurrentPrice.toFixed(2) : CurrentPrice}
                                </span>
                                <span className="text-[10px] font-semibold text-green-600">
                                  {discountPercent}% OFF
                                </span>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div
                        className="flex items-center gap-1 ml-2 shrink-0 mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div
                          className="w-7 h-7 !rounded-full bg-slate-100/80 hover:bg-red-50 flex items-center justify-center transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-slate-200/60 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavourite(item._id, true);
                          }}
                        >
                          <FaHeart size={16} color="#ef4444" />
                        </div>
                        <div
                          className="w-7 h-7 !rounded-full bg-slate-100/80 hover:bg-purple-50 flex items-center justify-center transition-all duration-150 shadow-[0_2px_4px_rgba(0,0,0,0.06)] border border-slate-200/60 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleShare(item);
                          }}
                        >
                          <FaRegShareSquare size={15} color="#9ca3af" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-1 min-w-0">
                      {(item?.brands?.name || item?.brand?.name || item?.manufacture?.name) && (
                        <span
                          className="text-[10.5px] text-[#321961] overflow-hidden text-ellipsis whitespace-nowrap tracking-[0.02em] bg-[#f5f3ff] px-2 py-0.5 rounded-md border border-[#7d2eff]/10 inline-block max-w-full"
                          title={item?.brands?.name || item?.brand?.name || item?.manufacture?.name}
                        >
                          By {item?.brands?.name || item?.brand?.name || item?.manufacture?.name}
                        </span>
                      )}
                    </div>

                    {/* Product Details Grid */}
                    <div className="product-details-grid flex flex-col gap-0.5 mt-1">
                      {(() => {
                        const specs = [
                          { label: "Composition", value: item?.compositions?.name || item?.compositionDetails?.name },
                          { label: "Form", value: item?.form },
                          { label: "Storage", value: item?.strength },
                          { label: "Packing", value: item?.packagingDetails },
                          { label: "Sample", value: item?.smapletype },
                          { label: "Model", value: item?.model },
                          { label: "Condition", value: item?.condition },
                          { label: "Time", value: item?.duration },
                          { label: "Complexity", value: item?.complexity },
                          { label: "Procedure", value: item?.procedureType },
                          { label: "Treatment", value: item?.treatmenttype },
                          { label: "Recovery", value: item?.recoveryTime },
                          { label: "Shift", value: item?.shiftType?.replace(/_/g, " ") },
                          { label: "Type", value: item?.nursecareType || item?.ambulancetype },
                          { label: "Gender", value: item?.gender },
                          { label: "Body", value: item?.bodypart },
                          { label: "Contrast", value: item?.iscontrast },
                          { label: "Fasting", value: item?.isFasting ? (typeof item.isFasting === "string" ? item.isFasting : "Yes") : null },
                          { label: "Param", value: item?.parameterss?.length > 0 ? `${item.parameterss.length} Tests` : null }
                        ].filter(spec => spec.value !== null && spec.value !== undefined && String(spec.value).trim() !== "");

                        return specs.slice(0, 2).map((spec, specIdx) => (
                          <DetailRow key={specIdx} label={spec.label} value={spec.value} />
                        ));
                      })()}
                    </div>

                    {/* View Details Button */}
                    <button
                      onClick={(e) => handleProductClick(item, e)}
                      className="block w-full text-center py-[4px] px-4 bg-[#321961] text-white !rounded-sm border-none !text-[12px] !font-medium transition-all duration-300 cursor-pointer !mt-auto hover:bg-[#6b1fe6] hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(125,46,255,0.3)]"
                    >
                      <i className="fa-solid fa-eye me-1.5"></i> View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
      <ShareModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareProductData(null);
        }}
        shareData={
          shareProductData
            ? {
              name: shareProductData.name,
              price: (() => {
                const variant = shareProductData.variant?.[0] || shareProductData.variants?.[0];
                return variant?.discountprice || variant?.discountPrice || variant?.price || shareProductData.discountprice || shareProductData.discountPrice || shareProductData.price || 0;
              })(),
              link: getShareUrl(shareProductData),
              serviceType: (() => {
                let sub = shareProductData.subcatdetails || shareProductData.subcategorydetails || shareProductData.subcategoryDetails || shareProductData.subcategorys;
                if (Array.isArray(sub)) sub = sub[0];
                const cat = sub?.catdetails || sub?.categoryDetails || sub?.category || (Array.isArray(shareProductData.category) ? shareProductData.category[0] : shareProductData.category);
                return cat?.name || cat?.fixedType || shareProductData.service || "medicine";
              })()
            }
            : null
        }
      />
    </div>
  );
};

export default Favourites;