import { useEffect, useState, Fragment } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import breadcrumbBg from "/assets/Medicompares Background.png";
import doctors from "/assets/doctors.png";
import {
  axiosCommonInstance,
  axiosUserInstance,
} from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import PageLoader from "../../../components/ui/PageLoader.jsx";
import BackButton from "../../../components/ui/BackButton.jsx";
import ShareModal from "./products-components/ShareModal.jsx";
import {
  getShareUrl,
  copyToClipboard,
  getShareText,
  shareToWhatsApp,
  shareToFacebook,
  shareToTwitter,
  shareToLinkedIn,
  shareToTelegram,
  shareToEmail,
} from "./utils/shareUtils.js";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import { Offcanvas } from "../../../components/ui/Offcanvas";
import { PriceDisplay, ProductImage, CompareOverlayButton, Pagination } from "../../../components/ui";
import { getDisplayPrice } from "./utils/productUtils.js";
import { FaRegShareSquare, FaHeart, FaExchangeAlt, FaStar } from "react-icons/fa";
import { IoIosHeartEmpty } from "react-icons/io";

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

  const isClickable = value.length > 25;

  return (
    <div
      className={`group rounded-[6px] transition-all duration-200 min-h-[22px] min-w-0 relative flex px-2 py-1 w-full hover:bg-[#f5f3ff] hover:border-purple-200 ${isExpanded
        ? "bg-[#f5f3ff] border border-[#8059ca] flex-col items-start gap-1 z-20 shadow-md"
        : "flex-row items-center justify-between gap-[6px]"
        } ${isClickable ? "cursor-pointer" : "cursor-default"}`}
      onClick={(e) => {
        if (!isClickable) return;
        e.stopPropagation();
        setIsExpanded(!isExpanded);
      }}
      title={title || value}
    >
      <span
        className={`text-[11px] font-[500] capitalize tracking-[0.04em] whitespace-nowrap shrink-0 transition-colors ${isExpanded ? "text-[#8059ca]" : "text-[#6b7280]"
          }`}
      >
        {label}
      </span>
      <span
        className={`text-[11.5px] font-[500] text-[#1f2937] leading-[1.2] transition-all ${isExpanded
          ? "text-left whitespace-normal max-w-full break-all"
          : "text-right whitespace-nowrap flex-1 min-w-0 overflow-hidden text-ellipsis"
          }`}
      >
        {value}
      </span>
    </div>
  );
};

const VendorProfile = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [VendorData, setVendorData] = useState([]); // all cards
  const [data, setdata] = useState([]); // vendor Details
  const [loading, setLoading] = useState(true); // loading state
  const [productsLoading, setProductsLoading] = useState(false); // products section loading

  const [categories, setCategories] = useState([]);
  const [Brands, setBrands] = useState([]);
  const [activeCategory, setActiveCategory] = useState({
    id: null,
    slug: null,
  });
  const [selectedSubcategories, setSelectedSubcategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesToShow, setCategoriesToShow] = useState(6);
  const [brandsToShow, setBrandsToShow] = useState(6);
  const [initialDataLoading, setInitialDataLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [itemsPerPage] = useState(9);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPagesFromApi, setTotalPagesFromApi] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareProductDataForModal, setShareProductDataForModal] =
    useState(null);
  const isLoggedIn = !!localStorage.getItem("medicomparestoken");
  const [showFilterCanvas, setShowFilterCanvas] = useState(false);

  const fetchFavoritesAndUpdateProducts = async (products) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) return;

    try {
      const response = await axiosUserInstance.get("favourite/list", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const favs = response.data?.data?.favourites || [];
      const favoriteTabletIds = new Set();
      favs.forEach((fav) => {
        if (fav.tablets && Array.isArray(fav.tablets)) {
          fav.tablets.forEach((tablet) => {
            if (tablet._id) {
              favoriteTabletIds.add(tablet._id);
            }
          });
        }
      });

      const updatedProducts = products.map((product) => {
        const tablet = product?.medicineDetails || product?.tablet;
        if (tablet?._id && favoriteTabletIds.has(tablet._id)) {
          return {
            ...product,
            medicineDetails: { ...tablet, isFavorite: true },
            tablet: { ...tablet, isFavorite: true },
          };
        }
        return {
          ...product,
          medicineDetails: { ...tablet, isFavorite: false },
          tablet: { ...tablet, isFavorite: false },
        };
      });

      setVendorData(updatedProducts);
    } catch (error) {
      toast.error("Error fetching favorites:", error);
    }
  };

  const getVendorDatas = async (
    subcategorySlugs = null,
    brandSlugs = null,
    isInitialLoad = false,
    page = 1,
    limit = itemsPerPage,
  ) => {
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setProductsLoading(true);
    }

    const _id = sessionStorage.getItem("vendorId");
    if (!_id) {
      toast.error("Vendor ID not found. Please try again.");
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setProductsLoading(false);
      }
      return;
    }
    try {
      const params = new URLSearchParams();
      if (subcategorySlugs) params.append("subcategory", subcategorySlugs);
      if (brandSlugs) params.append("brand", brandSlugs);
      params.append("page", page);
      params.append("limit", limit);

      const url = `/vendor/show/${_id}?${params.toString()}`;
      console.log("url", url);
      const response = await axiosCommonInstance.get(url);
      const responseData = response?.data?.data;
      const products = responseData?.products || [];
      const paginationData = responseData?.pagination || {};

      setVendorData(products);
      setdata(responseData?.vendor);
      if (paginationData.total !== undefined) {
        setTotalItems(paginationData.total);
      }
      if (paginationData.totalPages !== undefined) {
        setTotalPagesFromApi(paginationData.totalPages);
      }

      if (isLoggedIn) {
        await fetchFavoritesAndUpdateProducts(products);
      }

      if (isInitialLoad) {
        setLoading(false);
      } else {
        setProductsLoading(false);
      }
    } catch (error) {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setProductsLoading(false);
      }
      if (error.response?.status === 404) {
        toast.error("Vendor not found. The vendor may have been removed.");
      } else {
        toast.error("Error fetching vendor data. Please try again.");
      }
    }
  };

  const handleSubcategoryToggle = (subcategorySlug) => {
    setSelectedSubcategories((prev) => {
      const newSelection = prev.includes(subcategorySlug)
        ? prev.filter((slug) => slug !== subcategorySlug)
        : [...prev, subcategorySlug];

      setCurrentPage(1);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('page');
      setSearchParams(newSearchParams);

      const subcategoryParams =
        newSelection.length > 0 ? newSelection.join(",") : null;
      const brandParams =
        selectedBrands.length > 0 ? selectedBrands.join(",") : null;
      getVendorDatas(subcategoryParams, brandParams, false, 1, itemsPerPage);

      return newSelection;
    });
  };

  const handleBrandToggle = (brandSlug) => {
    setSelectedBrands((prev) => {
      const newSelection = prev.includes(brandSlug)
        ? prev.filter((slug) => slug !== brandSlug)
        : [...prev, brandSlug];

      // Reset to page 1 and update URL
      setCurrentPage(1);
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('page');
      setSearchParams(newSearchParams);

      const subcategoryParams =
        selectedSubcategories.length > 0
          ? selectedSubcategories.join(",")
          : null;
      const brandParams =
        newSelection.length > 0 ? newSelection.join(",") : null;
      getVendorDatas(subcategoryParams, brandParams, false, 1, itemsPerPage);

      return newSelection;
    });
  };

  const getCategoriesList = async () => {
    try {
      const vendorId = sessionStorage.getItem("vendorId");
      const url = vendorId
        ? `vendor/filter?vendorId=${vendorId}`
        : "vendor/filter";
      const response = await axiosCommonInstance.get(url);
      const { categories, brands } = response.data.data;
      setCategories(categories);
      setBrands(brands);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    } finally {
      setInitialDataLoading(false);
    }
  };

  const getSubcategoriesLsit = async (slug) => {
    if (!slug) return;

    setLoadingCategories(true);
    try {
      const response = await axiosCommonInstance.get(`vendor/filter/${slug}`);
      setSubcategories(response.data.data.subcategory);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (activeCategory.slug) {
      getSubcategoriesLsit(activeCategory.slug);
    }
  }, [activeCategory.slug]);

  useEffect(() => {
    getVendorDatas(null, null, true, currentPage, itemsPerPage);
    getCategoriesList();
  }, []);

  const totalPages =
    totalPagesFromApi || Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = VendorData;

  const handlePageChange = (page) => {
    setCurrentPage(page);

    const newSearchParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newSearchParams.delete('page');
    } else {
      newSearchParams.set('page', page.toString());
    }
    setSearchParams(newSearchParams);

    window.scrollTo({ top: 0, behavior: "smooth" });
    const subcategoryParams =
      selectedSubcategories.length > 0 ? selectedSubcategories.join(",") : null;
    const brandParams =
      selectedBrands.length > 0 ? selectedBrands.join(",") : null;
    getVendorDatas(subcategoryParams, brandParams, false, page, itemsPerPage);
  };

  const handleProductClick = async (product) => {
    const tablet = product?.medicineDetails || product?.tablet;
    if (!tablet) {
      toast.error("No tablet data found in product:", product);
      return;
    }

    const productId = tablet?.slug;
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

      const categories =
        subcategoryData?.slug ||
        tabletData?.slug ||
        (subcategoryData?.name
          ? subcategoryData.name.toLowerCase().replace(/\s+/g, "-")
          : null);

      if (service && categories && productId) {
        navigate(
          `/${encodeURIComponent(service)}/${encodeURIComponent(
            categories,
          )}/${encodeURIComponent(productId)}`,
          {
            state: {
              selectedVariantId: tablet?.variant?.[0]?._id || null,
            },
          },
        );
      } else {
        toast.error("Product details not available");
      }
    } catch (error) {
      toast.error("Failed to load product details");
    }
  };

  const handleToggleFavourite = async (tabletId, currentStatus) => {
    if (!isLoggedIn) {
      toast.error("Please login to manage favourites");
      navigate("/login");
      return;
    }

    const token = localStorage.getItem("medicomparestoken");

    setVendorData((prev) =>
      prev.map((product) => {
        const tablet = product?.medicineDetails || product?.tablet;
        if (tablet?._id === tabletId) {
          return {
            ...product,
            medicineDetails: { ...tablet, isFavorite: !currentStatus },
            tablet: { ...tablet, isFavorite: !currentStatus },
          };
        }
        return product;
      }),
    );

    try {
      const endpoint = currentStatus ? "favourite/remove" : "favourite/add";
      await axiosUserInstance.post(
        endpoint,
        { itemId: tabletId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
    } catch (error) {
      setVendorData((prev) =>
        prev.map((product) => {
          const tablet = product?.medicineDetails || product?.tablet;
          if (tablet?._id === tabletId) {
            return {
              ...product,
              medicineDetails: { ...tablet, isFavorite: currentStatus },
              tablet: { ...tablet, isFavorite: currentStatus },
            };
          }
          return product;
        }),
      );
      toast.error(
        error.response?.status === 401
          ? "Session expired"
          : "Something went wrong",
      );
    }
  };

  const createShareHandler = (productData, selectedVariants = {}) => {
    const url = getShareUrl(productData);
    const text = getShareText(productData, selectedVariants);

    return {
      copy: async () => {
        try {
          await copyToClipboard(url, () => {
            toast.success("Link copied to clipboard!");
          });
        } catch (err) {
          toast.error("Failed to copy link");
        }
      },
      whatsapp: () =>
        shareToWhatsApp(url, text, () => setShowShareModal(false)),
      facebook: () => shareToFacebook(url, () => setShowShareModal(false)),
      twitter: () => shareToTwitter(url, text, () => setShowShareModal(false)),
      linkedin: () =>
        shareToLinkedIn(url, text, () => setShowShareModal(false)),
      telegram: () =>
        shareToTelegram(url, text, () => setShowShareModal(false)),
      email: () => shareToEmail(url, text, () => setShowShareModal(false)),
    };
  };

  const resolveTabletImage = (tablet) => {
    // Check variant level files first
    if (
      Array.isArray(tablet?.tabletvariant?.[0]?.files) &&
      tablet.tabletvariant[0].files.length > 0
    ) {
      const imageFile = tablet.tabletvariant[0].files[0];
      return getImageUrl(imageFile);
    }

    // Check tablet level files
    if (Array.isArray(tablet?.files) && tablet.files.length > 0) {
      const imageFile = tablet.files[0];
      return getImageUrl(imageFile);
    }

    // Check variant level imageUrl
    if (
      Array.isArray(tablet?.tabletvariant?.[0]?.imageUrl) &&
      tablet.tabletvariant[0].imageUrl.length > 0
    ) {
      const imageUrl = tablet.tabletvariant[0].imageUrl[0];
      return getImageUrl(imageUrl);
    }

    // Check tablet level imageUrl
    if (Array.isArray(tablet?.imageUrl) && tablet.imageUrl.length > 0) {
      const imageUrl = tablet.imageUrl[0];
      return getImageUrl(imageUrl);
    }

    return "/assets/default.png";
  };

  const handleShare = (product) => {
    setShareProductDataForModal({
      tablet: product?.medicineDetails || product?.tablet || product,
    });
    setShowShareModal(true);
  };

  const hasValidImage = (tablet) => {
    if (!tablet) return false;

    // Check tablet level files
    if (
      tablet.files &&
      Array.isArray(tablet.files) &&
      tablet.files.length > 0
    ) {
      return true;
    }

    // Check tablet level imageUrl
    if (
      tablet.imageUrl &&
      Array.isArray(tablet.imageUrl) &&
      tablet.imageUrl.length > 0
    ) {
      return true;
    }

    // Check variant level files and imageUrls
    if (tablet.tabletvariant && Array.isArray(tablet.tabletvariant)) {
      for (const variant of tablet.tabletvariant) {
        // Check variant files
        if (
          variant.files &&
          Array.isArray(variant.files) &&
          variant.files.length > 0
        ) {
          return true;
        }

        // Check variant imageUrl
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

  //  filter
  const FilterContent = () => (
    <>
      {initialDataLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin inline-block w-4 h-4 border-2 border-solid border-current border-r-transparent rounded-full align-text-bottom" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <label
            className="block mb-2 text-[16px] font-[600]"
          >
            Categories
          </label>

          <ul
            className="list-none p-0 m-0 mt-2 max-h-[300px] overflow-x-hidden overflow-y-auto scrollbar-none"
          >
            {categories.length === 0 ? (
              <li className="py-2 text-[#6b7280]">No categories available</li>
            ) : (
              categories.slice(0, categoriesToShow).map((cat, index) => (
                <li key={cat._id || index} className="py-2">
                  <div
                    className="flex items-center w-full cursor-pointer"
                    onClick={() => {
                      if (activeCategory.id === cat._id) {
                        setActiveCategory({ id: null, slug: null });
                      } else {
                        setActiveCategory({ id: cat._id, slug: cat.slug });
                      }
                    }}
                  >
                    <div className="flex items-center grow truncate">
                      <img
                        src={
                          cat?.files?.[0]
                            ? getImageUrl(cat.files[0])
                            : "/assets/default.png"
                        }
                        alt={cat.name}
                        title={cat.name}
                        className="w-6 h-6 object-contain mr-[10px] rounded-[4px] font-[500]"
                      />
                      <span
                        className="truncate text-[13px] font-[500] text-black"
                      >
                        {cat.name}
                      </span>
                    </div>

                    <div className="shrink-0 ml-3">
                      {loadingCategories && activeCategory.id === cat._id ? (
                        <div
                          className="animate-spin inline-block w-4 h-4 border-2 border-solid border-current border-r-transparent rounded-full align-text-bottom"
                          role="status"
                        >
                          <span className="sr-only">Loading...</span>
                        </div>
                      ) : (
                        <i
                          className={`fa-solid ${activeCategory.id === cat._id
                            ? "fa-minus"
                            : "fa-plus"
                            } text-[12px]`}
                        />
                      )}
                    </div>
                  </div>

                  {activeCategory.id === cat._id && (
                    <ul className="list-none p-0 m-0 pl-4 !mt-2">
                      {subcategories?.length > 0 ? (
                        subcategories?.map((sub) => (
                          <li
                            key={sub._id || sub.slug}
                            className="py-1 text-[#6b7280] cursor-pointer"
                          >
                            <label
                              className="flex items-center !gap-[10px] !text-[14px] !font-[500] !text-[#374151] !cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={selectedSubcategories.includes(
                                  sub.slug,
                                )}
                                className="mr-2 rounded border-gray-300 text-[#8059ca] focus:ring-[#8059ca]"
                                onChange={() =>
                                  handleSubcategoryToggle(sub.slug)
                                }
                              />
                              {sub.name}
                            </label>
                          </li>
                        ))
                      ) : (
                        <li
                          className="py-1 text-[#6b7280] text-[12px]"
                        >
                          No subcategories found
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              ))
            )}
          </ul>
          {categories.length > categoriesToShow && (
            <div className="text-center mt-2">
              <span
                className="text-[#8059ca] cursor-pointer text-[12px] underline hover:text-[#6d28d9] transition-colors"
                onClick={() =>
                  setCategoriesToShow(
                    categoriesToShow === 6 ? categories.length : 6,
                  )
                }
              >
                {categoriesToShow === 6 ? "View More" : "View Less"}
              </span>
            </div>
          )}

          {/* <hr className="my-2" />
          <div className="filter-range-wrapper p-0 m-0">
            <label className="form-label mb-2">Price Range</label>

            <Slider min={0} max={100} defaultValue={50} />
            <div className="d-flex justify-content-between mt-2">
              <span>₹120</span>
              <span>₹100</span>
            </div>
          </div> */}
          <hr className="border-gray-200 my-4" />
          <label
            className="block mb-2 text-[16px] font-[600]"
          >
            Brands
          </label>
          <ul
            className="list-none p-0 m-0 mt-2 max-h-[300px] overflow-x-hidden overflow-y-auto scrollbar-none"
          >
            {Brands.length === 0 ? (
              <li className="py-2 text-[#6b7280]">No brands available</li>
            ) : (
              Brands.slice(0, brandsToShow).map((brand, index) => (
                <li key={brand._id || brand.slug || index} className="py-2">
                  <div
                    className="flex items-center w-full cursor-pointer"
                    onClick={() => {
                      const checkbox = document.getElementById(
                        `brand-${brand.slug}`,
                      );
                      if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                      }
                      handleBrandToggle(brand.slug);
                    }}
                  >
                    <div className="flex items-center gap-1 grow truncate">
                      <input
                        type="checkbox"
                        id={`brand-${brand.slug}`}
                        className="mr-2 rounded border-gray-300 text-[#8059ca] focus:ring-[#8059ca] cursor-pointer"
                        checked={selectedBrands.includes(brand.slug)}
                        onChange={() => handleBrandToggle(brand.slug)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        className="truncate !text-[13px] !font-[500] text-black cursor-pointer"
                      >
                        {brand.name}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          {Brands.length > brandsToShow && (
            <div className="text-center mt-3">
              <button
                className="inline-flex items-center gap-1.5 px-4 py-1.5 !text-[12px] !font-semibold !text-[#8059ca] hover:!text-white !bg-[#8059ca]/10 !hover:!bg-[#8059ca] !border border-[#8059ca]/20 !hover:border-transparent !rounded-full !shadow-sm transition-all duration-250 cursor-pointer"
                onClick={() =>
                  setBrandsToShow(brandsToShow === 6 ? Brands.length : 6)
                }
              >
                <span>{brandsToShow === 6 ? "View More" : "View Less"}</span>
                <i className={`fa-solid ${brandsToShow === 6 ? "fa-chevron-down" : "fa-chevron-up"} text-[10px]`} />
              </button>
            </div>
          )}
          <hr className="border-gray-200 my-4" />
        </>
      )}
    </>
  );

  if (loading || initialDataLoading) {
    return <PageLoader />;
  }

  return (
    <>
      <style jsx>{`
        body {
          overflow-x: clip !important;
        }
        .list-unstyled::-webkit-scrollbar {
          width: 4px;
        }
        .list-unstyled::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        .list-unstyled::-webkit-scrollbar-thumb {
          background: #ccc;
          border-radius: 2px;
        }
        .list-unstyled::-webkit-scrollbar-thumb:hover {
          background: #aaa;
        }
      `}</style>
      <Home2Header />
      <CategoryProvider />

      <div className="relative overflow-hidden bg-[#f9fbff] py-10 md:py-12 bottom-[2px] z-[1]">
        <div className="absolute inset-0 z-[1] after:content-[''] after:absolute after:inset-0 after:bg-white/30">
          <img className="w-full h-full object-cover" src={breadcrumbBg} />
        </div>
        <div className="relative z-[2] px-[15px] max-w-[1400px] mx-auto">
          <div className="mb-5">
            <BackButton className="z-[20] relative" />
          </div>
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            {/* Left side: Vendor details directly on the hero banner */}
            <div className="w-full lg:w-2/3 text-center lg:text-left">
              <h1 className="!text-[28px] md:text-[38px] !font-[600] !text-[#0a2540] !leading-tight mb-3 !tracking-tight">
                {data?.bussinessdetails?.name || "Partner Store"}
              </h1>

              {/* Rating + Order Badges */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-3">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-[#f5a623] text-sm leading-none">★</span>
                  <span className="!text-[13px] !font-bold !text-gray-800">
                    {data?.averageRating ? data.averageRating.toFixed(1) : "4.8"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    ({data?.ratingCount || 0} reviews)
                  </span>
                </div>

                <div className="bg-[#8059ca]/10 text-[#8059ca] text-[12px] font-bold px-3 py-1 rounded-full border border-[#8059ca]/20 shadow-sm">
                  {data?.totalOrders ? `${data.totalOrders}+ Orders` : "100+ Orders"}
                </div>
              </div>

              {/* Vendor address if available */}
              {data?.bussinessdetails?.address && (
                <p className="!text-[14px] !text-gray-600 !font-medium !flex !items-center !justify-center lg:!justify-start !gap-1.5 m-0 max-w-[500px]">
                  <i className="fas fa-map-marker-alt text-[#8059ca] text-[13px]" />
                  <span>{data.bussinessdetails.address}</span>
                </p>
              )}
            </div>

            {/* Right side: Large Brand Logo Container */}
            <div className="w-full lg:w-1/3 shrink-0">
              <div className="w-[140px] h-[140px] md:w-[160px] md:h-[160px] bg-white rounded-[20px] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center mx-auto lg:ml-auto">
                <img
                  className="max-w-full max-h-full object-contain"
                  src={
                    getImageUrl(
                      data?.bussinessdetails?.bussiness_image?.[0]?.url,
                    ) || "/assets/default.png"
                  }
                  alt={data?.bussinessdetails?.name}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-5 mt-4">
        <div className="flex items-center justify-between lg:hidden mb-3 mobile-filter-buttons-container">
          <button
            type="button"
            className="inline-flex items-center gap-1 !text-xs !font-semibold px-2.5 py-1.5 !rounded bg-[#8059ca] !text-white hover:bg-[#6d28d9] transition-colors"
            onClick={() => setShowFilterCanvas(true)}
          >
            <i className="fas fa-filter"></i>
            <span>Filter</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 !text-xs !font-semibold px-2.5 py-1.5 !rounded bg-[#8059ca] !text-white hover:bg-[#6d28d9] transition-colors"
          >
            <i className="fas fa-redo"></i>
            <span>Clear</span>
          </button>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-3 mb-4 hidden lg:block sticky top-[100px] self-start z-10">
            <div className="card shadow-sm p-3 border-none rounded-[14px]">
              {FilterContent()}
            </div>
          </div>

          <div className="col-span-12 lg:col-span-9">
            {/* Selected Filters Display */}
            {(selectedSubcategories.length > 0 ||
              selectedBrands.length > 0) && (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  {selectedSubcategories.map((slug, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-[#b284fe38] rounded-[16px] p-[4px_10px] text-[12px] text-black cursor-pointer whitespace-nowrap"
                    >
                      {subcategories.find((sub) => sub.slug === slug)?.name ||
                        slug}
                      <button
                        className="bg-transparent border-none p-0 ml-1 text-gray-500 text-[10px] leading-[1] hover:text-gray-900 cursor-pointer"
                        onClick={() => handleSubcategoryToggle(slug)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {selectedBrands.map((slug, index) => (
                    <div
                      key={index}
                      className="flex items-center bg-[#f8f9fa] rounded-[16px] p-[4px_10px] text-[12px] cursor-pointer whitespace-nowrap"
                    >
                      {Brands.find((brand) => brand.slug === slug)?.name || slug}
                      <button
                        className="bg-transparent border-none p-0 ml-1 text-gray-500 text-[10px] leading-[1] hover:text-gray-900 cursor-pointer"
                        onClick={() => handleBrandToggle(slug)}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    className="inline-block text-xs font-semibold border border-gray-300 text-gray-700 px-2.5 py-1 rounded hover:bg-gray-50 transition-colors cursor-pointer"
                    onClick={() => {
                      setSelectedSubcategories([]);
                      setSelectedBrands([]);
                      // Reset to page 1 and update URL
                      setCurrentPage(1);
                      const newSearchParams = new URLSearchParams(searchParams);
                      newSearchParams.delete('page');
                      setSearchParams(newSearchParams);
                      getVendorDatas(null, null, false, 1, itemsPerPage);
                    }}
                  >
                    Clear All
                  </button>
                </div>
              )}

            {productsLoading ? (
              <div className="text-center py-5">
                <div className="animate-spin inline-block w-8 h-8 border-4 border-solid border-current border-r-transparent rounded-full" role="status">
                  <span className="sr-only">Loading products...</span>
                </div>
                <p className="mt-3 mb-0">Loading products...</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
                {currentProducts?.length > 0 ? (
                  (() => {
                    // Group products by category name
                    const grouped = currentProducts
                      .filter((products) => {
                        const tablet = products?.medicineDetails || products?.tablet;
                        return hasValidImage(tablet);
                      })
                      .reduce((groups, product) => {
                        const categoryObj = product?.category || product?.medicineDetails?.category || product?.tablet?.category;
                        const categoryName = categoryObj?.name || "Other Products";
                        if (!groups[categoryName]) {
                          groups[categoryName] = [];
                        }
                        groups[categoryName].push(product);
                        return groups;
                      }, {});

                    return Object.entries(grouped).map(([categoryName, productsList]) => (
                      <Fragment key={categoryName}>
                        {/* Section Header */}
                        <div className="col-span-full mt-4 mb-2">
                          <h3
                            className="!text-[18px] !font-[700] !text-[#0f172a] !border-l-4 !border-l-[#b284fe] !pl-[12px] !mb-[15px] tracking-[-0.01em]"
                          >
                            {categoryName}
                          </h3>
                        </div>

                        {/* Products under this category */}
                        {productsList.map((products, index) => {
                          const tablet = products?.medicineDetails || products?.tablet;
                          if (!tablet?._id) return null;
                          const serviceType = activeCategory?.slug || tablet?.service || products?.service || "medicine";
                          const normalizedProductForPrice = {
                            ...products,
                            tablet: products?.tablet || products?.medicineDetails
                          };
                          // const currentPrice = getDisplayPrice(normalizedProductForPrice, {});
                          const DiscountType = products?.discountType;
                          const Discount = products?.discountprice;
                          const CurrentPrice = products?.price
                          let FinalAmount;
                          if (DiscountType === "percentage") {
                            FinalAmount = CurrentPrice - ((Discount / 100) * CurrentPrice);
                          } else if (DiscountType === "price") {
                            FinalAmount = Discount;
                          } else {
                            FinalAmount = CurrentPrice
                          }
                          const hasDiscount = FinalAmount < CurrentPrice && FinalAmount > 0;
                          const discountPercent = hasDiscount
                            ? (DiscountType === "percentage" ? Math.round(Discount) : Math.round(((CurrentPrice - FinalAmount) / CurrentPrice) * 100))
                            : 0;

                          console.log(DiscountType, CurrentPrice)

                          return (
                            <div
                              key={tablet._id || `product-${index}`}
                              className="flex h-full"
                            >
                              <div
                                className="modern-product-card flex flex-col cursor-pointer w-full min-h-0 border border-[#dee2e6] shadow-[0_4px_10px_rgba(0,0,0,0.05)] rounded-[10px] bg-white transition-all duration-[400ms] ease-[cubic-bezier(0.25,0.8,0.25,1)] hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                                onClick={() => handleProductClick(products)}
                              // style={{
                              //   display: "flex",
                              //   flexDirection: "column",
                              //   cursor: "pointer",
                              //   height: "100%",
                              //   minHeight: "auto",
                              //   border: "1px solid #dee2e6",
                              //   boxShadow: "0 4px 10px rgba(0, 0, 0, 0.05)",
                              //   borderRadius: "10px",
                              //   backgroundColor: "#ffffff",
                              //   transition: "all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)"
                              // }}
                              >
                                {/* Image Container */}
                                <div className="product-image-container-vertical relative overflow-hidden bg-[#f8fafc] rounded-t-[10px]">
                                  <ProductImage
                                    src={resolveTabletImage(tablet)}
                                    alt={tablet?.name || "Product"}
                                    containerStyle={{ height: "168px", padding: "8px" }}
                                  />

                                  {/* Rating Overlay */}
                                  <div
                                    className="absolute top-[10px] left-[10px] bg-white px-2 py-0.5 rounded-[20px] text-[11px] font-[600] flex items-center gap-1 shadow-[0_2px_5px_rgba(0,0,0,0.1)] border border-[#e0e0e0] z-10"
                                  >
                                    <FaStar
                                      className="text-[#ffc107] text-[10px]"
                                    />
                                    <span>{tablet?.averageRating?.toFixed(1) || "0"}</span>
                                    <span
                                      className="text-[#9ca3af] font-[400] text-[10px]"
                                    >
                                      ({tablet?.ratingCount > 0 ? `${tablet.ratingCount}` : "0"})
                                    </span>
                                  </div>

                                  {/* Compare Overlay Button */}
                                  <CompareOverlayButton
                                    tablet={tablet}
                                    serviceType={serviceType}
                                  />
                                </div>

                                {/* Card Body */}
                                <div
                                  className="flex-grow flex flex-col gap-0.5 p-[8px_10px]"
                                >
                                  <div className="flex items-start justify-between w-full gap-2">
                                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                      <div
                                        className="product-title text-capitalize text-[13px] font-[500] leading-[1.3] m-0 text-[#0f172a] tracking-[-0.01em] whitespace-nowrap overflow-hidden text-ellipsis block"
                                        title={tablet.name || ""}
                                      >
                                        {tablet.name}
                                      </div>
                                    </div>

                                    <div
                                      className="flex items-center gap-1 ml-2 shrink-0 mt-[2px]"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div
                                        className="action-icon-btn cursor-pointer p-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleToggleFavourite(tablet._id, tablet.isFavorite);
                                        }}
                                      >
                                        {tablet.isFavorite ? (
                                          <FaHeart size={16} color="#ef4444" />
                                        ) : (
                                          <IoIosHeartEmpty size={16} color="#9ca3af" />
                                        )}
                                      </div>
                                      <div
                                        className="action-icon-btn cursor-pointer p-1"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleShare(products);
                                        }}
                                      >
                                        <FaRegShareSquare size={15} color="#9ca3af" />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between gap-1 min-w-0">
                                    {(tablet?.brands?.name || tablet?.brand?.name || tablet?.manufacture?.name) && (
                                      <span
                                        className="text-[10.5px] text-[#8059ca] overflow-hidden text-ellipsis whitespace-nowrap tracking-[0.02em] bg-[#f5f3ff] px-2 py-0.5 rounded-[6px] border border-[rgba(125,46,255,0.1)] inline-block max-w-full"
                                        title={tablet?.brands?.name || tablet?.brand?.name || tablet?.manufacture?.name}
                                      >
                                        By {tablet?.brands?.name || tablet?.brand?.name || tablet?.manufacture?.name}
                                      </span>
                                    )}
                                  </div>

                                  {/* Product Details Grid */}
                                  <div className="product-details-grid flex flex-col gap-0.5">
                                    {(() => {
                                      const specs = [
                                        { label: "Composition", value: tablet?.compositions?.name },
                                        { label: "Form", value: tablet?.form },
                                        { label: "Storage", value: tablet?.strength },
                                        { label: "Packing", value: tablet?.packagingDetails },
                                        { label: "Sample", value: tablet?.smapletype },
                                        { label: "Model", value: tablet?.model },
                                        { label: "Condition", value: tablet?.condition },
                                        { label: "Time", value: tablet?.duration },
                                        { label: "Complexity", value: tablet?.complexity },
                                        { label: "Procedure", value: tablet?.procedureType },
                                        { label: "Treatment", value: tablet?.treatmenttype },
                                        { label: "Recovery", value: tablet?.recoveryTime },
                                        { label: "Shift", value: tablet?.shiftType?.replace(/_/g, " ") },
                                        { label: "Type", value: tablet?.nursecareType || tablet?.ambulancetype },
                                        { label: "Gender", value: tablet?.gender },
                                        { label: "Body", value: tablet?.bodypart },
                                        { label: "Contrast", value: tablet?.iscontrast },
                                        { label: "Fasting", value: tablet?.isFasting ? (typeof tablet.isFasting === "string" ? tablet.isFasting : "Yes") : null },
                                        { label: "Param", value: tablet?.parameterss?.length > 0 ? `${tablet.parameterss.length} Tests` : null }
                                      ].filter(spec => spec.value !== null && spec.value !== undefined && String(spec.value).trim() !== "");

                                      return specs.slice(0, 2).map((spec, specIdx) => (
                                        <DetailRow key={specIdx} label={spec.label} value={spec.value} />
                                      ));
                                    })()}
                                  </div>

                                  {/* Equipments Section */}
                                  {tablet?.equipmentType?.length > 0 && (
                                    <div className="mt-2 pt-2 border-t border-dashed border-t-[#eaeaea]">
                                      <div className="mb-1 flex items-center text-[11px] text-[#6b7280]">
                                        <span className="text-[11px] font-[600] uppercase tracking-[0.02em]">Equipments:</span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {tablet.equipmentType.slice(0, 3).map((item, index) => (
                                          <span key={index} className="bg-gray-100 text-gray-700 border border-gray-200 px-2 py-0.5 text-[9px] rounded-[4px]">
                                            {item}
                                          </span>
                                        ))}
                                        {tablet.equipmentType.length > 3 && (
                                          <span className="bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 text-[9px] rounded-[4px]">
                                            +{tablet.equipmentType.length - 3} More
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </Fragment>
                    ));
                  })()
                ) : (
                  <p className="text-center mt-4 text-[20px]">
                    No data found
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 mb-4">
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>

      <Offcanvas
        show={showFilterCanvas}
        onHide={() => setShowFilterCanvas(false)}
        placement="start"
        className="!w-3/4 md:!w-1/2 z-[999999]"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-3">
          {FilterContent()}
        </Offcanvas.Body>
      </Offcanvas>

      <ShareModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareProductDataForModal(null);
        }}
        onShare={
          shareProductDataForModal
            ? (() => {
              const relatedProductData = {
                tablet: shareProductDataForModal.tablet,
              };
              const relatedSelectedVariants = shareProductDataForModal.tablet
                ?._id
                ? {
                  [shareProductDataForModal.tablet._id]:
                    shareProductDataForModal.tablet.variant?.[0]?._id,
                }
                : {};
              return createShareHandler(
                relatedProductData,
                relatedSelectedVariants,
              );
            })()
            : handleShare
        }
      />

      <Footer />
    </>
  );
};

export default VendorProfile;
