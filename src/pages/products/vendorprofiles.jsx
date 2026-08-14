import { useEffect, useState, Fragment } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Home2Header from "../../components/layout/Header-k";
import Footer from "../../components/layout/Footer-f";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
import breadcrumbBg from "/assets/Medicompares Background.png";
import doctors from "/assets/doctors.png";
import {
  axiosCommonInstance,
  axiosUserInstance,
} from "../../Apiservice.jsx";
import { getImageUrl } from "../../utils/index";
import toast from "react-hot-toast";
import PageLoader from "../../components/ui/PageLoader.jsx";
import BackButton from "../../components/ui/BackButton.jsx";
import ShareModal from "../../components/products/ShareModal.jsx";
import { getShareUrl } from "../../utils/shareUtils.js";

import CategoryProvider from "../../components/ui/CategoryProvider.jsx";
import { Offcanvas } from "../../components/ui/Offcanvas.jsx";
import { PriceDisplay, ProductImage, CompareOverlayButton, Pagination } from "../../components/ui/index.js";
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
        ? "bg-[#f5f3ff] border border-[#321961] flex-col items-start gap-1 z-20 shadow-md"
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
        className={`text-[11px] font-[500] capitalize tracking-[0.04em] whitespace-nowrap shrink-0 transition-colors ${isExpanded ? "text-[#321961]" : "text-[#6b7280]"
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
  const [shareCategoryName, setShareCategoryName] = useState(null);
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

      const categorFixedType = productData?.fixedType;

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

  const handleShare = (product, catName) => {
    setShareProductDataForModal(product);
    setShareCategoryName(catName || null);
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
                        style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(42%) saturate(4523%) hue-rotate(251deg) brightness(87%) contrast(97%)" }}
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
                                className="mr-2 rounded border-gray-300 text-[#321961] focus:ring-[#321961]"
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
              <button
                className="inline-flex items-center gap-1.5 px-4 py-1.5 !text-[12px] !font-semibold !text-white hover:!text-white !bg-primary !hover:!bg-primary-hover !border border-[#321961]/20 !hover:border-transparent !rounded-full !shadow-sm transition-all duration-250 cursor-pointer"
                onClick={() =>
                  setCategoriesToShow(
                    categoriesToShow === 6 ? categories.length : 6,
                  )
                }
              >
                {categoriesToShow === 6 ? "View More" : "View Less"}
                <i className={`fa-solid ${categoriesToShow === 6 ? "fa-chevron-down" : "fa-chevron-up"} text-[10px]`} />
              </button>
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
                        className="mr-2 rounded border-gray-300 text-[#321961] focus:ring-[#321961] cursor-pointer"
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
                className="inline-flex items-center gap-1.5 px-4 py-1.5 !text-[12px] !font-semibold !text-white hover:!text-white !bg-primary !hover:!bg-primary-hover !border border-[#321961]/20 !hover:border-transparent !rounded-full !shadow-sm transition-all duration-250 cursor-pointer"
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

      <div className="relative overflow-hidden bg-[#f9fbff] py-6 md:py-8 bottom-[2px] z-[1]">
        <div className="absolute inset-0 z-[1] after:content-[''] after:absolute after:inset-0 after:bg-white/30">
          <img className="w-full h-full object-cover" src={breadcrumbBg} />
        </div>
        <div className="relative z-[2] px-[15px] max-w-[1400px] mx-auto">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            {/* Far Left: Back Button */}
            <div className="w-full lg:w-auto shrink-0 flex justify-start">
              <BackButton className="z-[20] relative" />
            </div>

            {/* Center Content: Vendor details */}
            <div className="w-full lg:flex-1 text-center">
              <h1 className="!text-[28px] md:text-[38px] !font-[600] !text-[#0a2540] !leading-tight mb-3 !tracking-tight">
                {data?.bussinessdetails?.name || "Partner Store"}
              </h1>

              {/* Rating + Order Badges */}


              {/* Vendor address if available */}
              {data?.bussinessdetails?.address && (
                <p className="!text-[14px] !text-gray-600 !font-medium flex items-center justify-center gap-0.5 m-0 mx-auto max-w-[500px] mb-3">
                  <i className="fas fa-map-marker-alt text-[#321961] text-[14px] relative top-[-1px]" />
                  <span>{data.bussinessdetails.address}</span>
                </p>
              )}
              <div className="flex flex-wrap items-center justify-center gap-3 mb-3">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">
                  <span className="text-[#f5a623] text-sm leading-none">★</span>
                  <span className="!text-[13px] !font-bold !text-gray-800">
                    {data?.averageRating ? data.averageRating.toFixed(1) : "4.8"}
                  </span>
                  <span className="text-gray-400 text-xs">
                    ({data?.ratingCount || 0} reviews)
                  </span>
                </div>

                <div className="bg-[#321961]/10 text-[#321961] text-[12px] font-bold px-3 py-1 rounded-full border border-[#321961]/20 shadow-sm">
                  {data?.totalOrders ? `${data.totalOrders}+ Orders` : "100+ Orders"}
                </div>
              </div>
            </div>

            {/* Far Right: Large Brand Logo Container */}
            <div className="hidden lg:flex lg:w-auto shrink-0 justify-center lg:justify-end">
              <div className="w-[120px] h-[120px] md:w-[140px] md:h-[140px] rounded-[20px] p-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] border border-gray-100 flex items-center justify-center">
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
            className="inline-flex items-center gap-1 !text-xs !font-semibold px-2.5 py-1.5 !rounded bg-[#321961] !text-white hover:bg-[#6d28d9] transition-colors"
            onClick={() => setShowFilterCanvas(true)}
          >
            <i className="fas fa-filter"></i>
            <span>Filter</span>
          </button>

          <button
            type="button"
            className="inline-flex items-center gap-1 !text-xs !font-semibold px-2.5 py-1.5 !rounded bg-[#321961] !text-white hover:bg-[#6d28d9] transition-colors"
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
                          const isRoundImage = products?.category?.fixedType || activeCategory?.fixedType || tablet?.service || products?.service || "medicine";
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
                                className="w-full flex flex-col bg-white rounded-md border border-[#f1f5f9] shadow-[0_4px_18px_rgba(0,0,0,0.07)] relative overflow-hidden transition-all duration-300 hover:-translate-y-[3px] hover:!border-[#f1f5f9] hover:shadow-[0_8px_24px_rgba(128,89,202,0.15)]"
                              >
                                {/* Compare badge */}
                                <div className="absolute right-2 top-2 z-10 cursor-pointer bg-[#321961] text-white border-[1.5px] border-[#321961] rounded-[20px] w-8 h-[26px] flex items-center justify-start pl-[9px] shadow-[0_2px_8px_rgba(128,89,202,0.4)] overflow-hidden whitespace-nowrap transition-all duration-300 hover:w-[85px] group">
                                  <Link
                                    to={`/${serviceType}/${tablet?.subcategoryDetails?.slug || tablet?.subcategorys?.slug}/${tablet?.slug}/compare`}
                                    className="flex items-center text-white no-underline w-full"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <i className="fa-solid fa-right-left shrink-0 text-[11px] text-white" />
                                    <span className="opacity-0 group-hover:opacity-100 ml-1.5 text-[11px] font-semibold text-white transition-opacity duration-300">
                                      Compare
                                    </span>
                                  </Link>
                                </div>

                                {/* Image */}
                                <div
                                  className="w-full h-[130px] bg-[#f5f3ff] flex items-center justify-center p-2.5 cursor-pointer shrink-0 relative"
                                  onClick={() => handleProductClick(products)}
                                >
                                  <img
                                    src={resolveTabletImage(tablet)}
                                    alt={tablet?.name || "Product"}
                                    className={
                                      isRoundImage !== "medicine" &&
                                        isRoundImage !== "medical-equipment" &&
                                        isRoundImage !== "medicalequipment"
                                        ? "w-[100px] h-[100px] !rounded-full object-cover border-2 border-solid border-[#7d2eff]/10"
                                        : "max-h-full max-w-full object-contain"
                                    }
                                  />
                                  {/* Rating Overlay */}
                                  <div className="absolute bottom-2 left-2 bg-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-[0_2px_5px_rgba(0,0,0,0.1)] border border-[#e2e8f0] z-10" onClick={(e) => e.stopPropagation()}>
                                    <span className="text-[#fbbf24] text-[10px]">★</span>
                                    <span className="text-[#334155]">{tablet?.averageRating ? tablet.averageRating.toFixed(1) : "0.0"}</span>
                                    <span className="text-slate-400 font-normal">({tablet?.ratingCount > 0 ? tablet.ratingCount : "0"})</span>
                                  </div>
                                </div>

                                {/* Details */}
                                <div className="flex flex-col gap-1.5 p-2.5 flex-1">
                                  {/* Name */}
                                  <div
                                    className="cursor-pointer"
                                    onClick={() => handleProductClick(products)}
                                  >
                                    <p className="text-[12.5px] font-medium text-[#0f172a] m-0 leading-[1.35] capitalize overflow-hidden"
                                      style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                                      {tablet.name}
                                    </p>
                                  </div>

                                  {/* Seller & brand */}
                                  <div className="flex items-center justify-between gap-1 min-w-0">
                                    <div className="flex items-center gap-1.5 min-w-0 flex-1 overflow-hidden">
                                      {(tablet?.brands?.name || tablet?.brand?.name || tablet?.manufacture?.name) && (
                                        <span
                                          className="text-[11.5px] font-semibold text-[#334155] truncate"
                                          title={tablet?.brands?.name || tablet?.brand?.name || tablet?.manufacture?.name}
                                        >
                                          By {tablet?.brands?.name || tablet?.brand?.name || tablet?.manufacture?.name}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Product Details Grid */}
                                  <div className="product-details-grid flex flex-col gap-0.5 mt-0.5">
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

                                  {/* Pricing */}
                                  {/* <div className="flex flex-col gap-px mt-0.5">
                                    <div className="flex items-center flex-wrap gap-1">
                                      <span className="text-[13px] font-bold text-[#0f172a]">
                                        ₹{FinalAmount.toFixed(2)}
                                      </span>
                                      {hasDiscount && (
                                        <span className="text-[10px] line-through text-[#94a3b8]">
                                          ₹{Number(CurrentPrice).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                    {hasDiscount && (
                                      <span className="text-[9.5px] font-bold text-[#dc2626]">
                                        {discountPercent}% OFF
                                      </span>
                                    )}
                                  </div> */}

                                  {/* Actions */}
                                  <div className="mt-auto pt-2.5 border-t border-[#f1f5f9] flex items-center justify-between gap-2" onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center gap-2">
                                      <div
                                        className={`w-[32px] h-[32px] rounded-full flex items-center justify-center transition-all duration-200 border cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95 ${tablet.isFavorite
                                          ? "!bg-red-50 !border-red-100 !text-[#ef4444]"
                                          : "!bg-rose-50/50 !border-rose-100/60 !text-rose-500 hover:bg-[#ef4444] hover:text-white hover:border-[#ef4444]"
                                          }`}
                                        onClick={() => handleToggleFavourite(tablet._id, tablet.isFavorite)}
                                        title="Favourite"
                                      >
                                        {tablet.isFavorite ? (
                                          <FaHeart size={14} />
                                        ) : (
                                          <IoIosHeartEmpty size={14} />
                                        )}
                                      </div>
                                      <div
                                        className="w-[32px] h-[32px] rounded-full !bg-purple-50 !border !border-purple-100/60 !text-purple-600 hover:bg-[#321961] hover:text-white hover:border-[#321961] flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:scale-105 active:scale-95"
                                        onClick={() => handleShare(products, categoryName)}
                                        title="Share"
                                      >
                                        <FaRegShareSquare size={14} />
                                      </div>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => handleProductClick(products)}
                                      className="bg-[#321961] hover:bg-[#5b32a1] text-white !text-[11px] font-semibold py-1.5 px-3.5 !rounded-md transition-all duration-300 border-none cursor-pointer flex items-center gap-1.5 shadow-sm hover:shadow-[0_4px_12px_rgba(50,25,97,0.25)] hover:-translate-y-px active:translate-y-0"
                                    >
                                      <i className="fa-solid fa-eye text-[11px]" />
                                      View Details
                                    </button>
                                  </div>
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
          setShareCategoryName(null);
        }}
        shareData={
          shareProductDataForModal
            ? {
              name: shareProductDataForModal.tablet?.name || shareProductDataForModal.medicineDetails?.name || shareProductDataForModal.name,
              price: (() => {
                const tablet = shareProductDataForModal.tablet || shareProductDataForModal.medicineDetails || shareProductDataForModal;
                const variant = tablet.variant?.[0] || tablet.variants?.[0];
                return variant?.discountprice || variant?.discountPrice || variant?.price || tablet.discountprice || tablet.discountPrice || tablet.price || 0;
              })(),
              link: getShareUrl(shareProductDataForModal),
              serviceType: shareCategoryName || shareProductDataForModal.tablet?.subcategorys?.category?.name || shareProductDataForModal.medicineDetails?.subcategorys?.category?.name || "medicine"
            }
            : null
        }
      />

      <Footer />
    </>
  );
};

export default VendorProfile;
