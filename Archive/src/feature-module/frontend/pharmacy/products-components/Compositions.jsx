import { useState, useEffect, useRef } from "react";
import {
  useParams,
  useNavigate,
  Link,
  useSearchParams,
} from "react-router-dom";
import { axiosCommonInstance, imgUrl } from "../../../../Apiservice";
import toast from "react-hot-toast";
import ProductCard from "../../../../components/ui/ProductCardMC.jsx";
import Home2Header from "../../../../components/home/Header-k.jsx";
import Footer from "../../../../components/home/Footer-f.jsx";
import CategoryProvider from "../../../../components/CategoryProvider.jsx";
import PageLoader from "../../../../components/ui/PageLoader.jsx";
import doctors from "/assets/doctors.png";
import { useLocation as useLocationContext } from "../../../../context/LocationContext";
import { Offcanvas } from "../../../../components/ui/Offcanvas";
import Pagination from "../../../../components/ui/Pagination.jsx";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const Compositions = () => {
  const { compId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { selectedPincode, latitude, longitude } = useLocationContext();
  const [manufactureData, setManufactureData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const debounceTimeoutRef = useRef(null);
  const [brands, setBrands] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const brandsListRef = useRef(null);
  const priceInitializedRef = useRef(false);
  const [brandsLoading, setBrandsLoading] = useState(false);
  const [brandLoading, setBrandLoading] = useState(false);
  const [brandsPagination, setBrandsPagination] = useState(null);
  const [brandPage, setBrandPage] = useState(1);
  const [hasMoreBrands, setHasMoreBrands] = useState(false);
  const [initialDataLoading, setInitialDataLoading] = useState(true);
  const [showFilterCanvas, setShowFilterCanvas] = useState(false);
  const [ratingOptions, setRatingOptions] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [priceFilter, setPriceFilter] = useState({ min: 0, max: 1000 });
  const [visualProgress, setVisualProgress] = useState({ min: 0, max: 1000 });

  const id = compId?.split('-').pop();

  const currentPage = parseInt(searchParams.get("page")) || 1;

  useEffect(() => {
    const fetchManufactureData = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      try {
        if (searchQuery.trim()) {
          setSearchLoading(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();
        if (searchQuery.trim()) {
          params.append("search", searchQuery.trim());
        }
        if (selectedPincode) {
          params.append("location", selectedPincode);
          if (latitude && longitude) {
            params.append("lat", latitude);
            params.append("lng", longitude);
          }
        }
        params.append("page", currentPage);
        params.append("limit", 15);

        const apiUrl = `compositions/${id}?${params.toString()}`;

        const response = await axiosCommonInstance.get(apiUrl);

        if (response.data.success && response.data.data) {
          setManufactureData(response.data.data);
        } else {
          toast.error("compositions not found");
        }
      } catch (err) {
        toast.error(
          err.response?.data?.message || "Failed to fetch compositions data",
        );
      } finally {
        setLoading(false);
        setSearchLoading(false);
      }
    };

    fetchManufactureData();
  }, [id, selectedPincode, currentPage]);

  // Apply filters when any filter state changes (with debouncing)
  useEffect(() => {
    if (manufactureData) { // Only apply filters after initial data is loaded
      // Clear existing timeout
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        applyFilters();
      }, 500);
    }

    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [selectedBrands, selectedRatings, priceFilter]);

  const handleSearch = async (query) => {
    if (!query || query.trim() === "") {
      setSearchResults([]);
      setFilteredProducts([]);
      return;
    }

    setSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("search", query.trim());
      if (selectedPincode) {
        params.append("location", selectedPincode);
        if (latitude && longitude) {
          params.append("lat", latitude);
          params.append("lng", longitude);
        }
      }
      params.append("page", 1);
      params.append("limit", 15);

      const response = await axiosCommonInstance.get(
        `compositions/${id}?${params.toString()}`
      );

      const products = response?.data?.data?.products || [];
      setSearchResults(products);
      setFilteredProducts(products);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to search products",
      );
      setSearchResults([]);
      setFilteredProducts([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    if (!value || value.trim() === "") {
      setSearchResults([]);
      setFilteredProducts([]);
      setSearchLoading(false);
    } else {
      setSearchLoading(true);
      debounceTimeoutRef.current = setTimeout(() => {
        handleSearch(value);
      }, 500);
    }
  };

  const { products = [], pagination } = manufactureData || {};
  const {
    totalPages = 1,
  } = pagination || {};
  const displayProducts = searchQuery.trim() ? filteredProducts : products;
  const displayPagination = searchQuery.trim() ? null : pagination;

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    if (page === 1) {
      newParams.delete("page");
    } else {
      newParams.set("page", page.toString());
    }
    setSearchParams(newParams);
  };

  const normalizeItem = (item) => {
    const vendor = item?.vendors?.[0] || null;
    const variant = item?.tabletvariants?.[0] || null;

    const price = vendor
      ? (vendor.matchedVariantPrice ?? vendor.matchedPrice ?? vendor.price ?? 0)
      : 0;

    const discountPrice = vendor
      ? (vendor.matchedVariantDiscountPrice ??
        vendor.matchedDiscountPrice ??
        vendor.discountprice ??
        vendor.discountPrice ??
        null)
      : null;

    const discountType = vendor
      ? (vendor.matchedVariantDiscountType ?? vendor.discountType ?? null)
      : null;

    let calculatedDiscountPrice = discountPrice;
    if (discountType === "percentage" && discountPrice && discountPrice > 0) {
      calculatedDiscountPrice = price - (price * discountPrice) / 100;
    }

    const productImages =
      item?.files?.filter(Boolean)?.length
        ? item.files
        : item?.imageUrl?.filter(Boolean)?.length
          ? item.imageUrl
          : variant?.files?.filter(Boolean)?.length
            ? variant.files : "";

    return {
      ...item,
      tabletdetails: item,
      vendordetails: {
        name: vendor?.bussinessdetails?.name || vendor?.name || "",
        discountprice: calculatedDiscountPrice || 0,
        bussinessdetails: vendor?.bussinessdetails || {},
        price: price,
        bookingType: "cart",
      },
      variants: {
        _id: item._id,
        name: item.name,
        files: productImages,
        price: price,
        discountPrice: calculatedDiscountPrice || null,
        stock: 999,
        isStock: true,
      },
      vendors: item?.vendors || [],
    };
  };

  const handleProductClick = (product) => {
    navigate(`/medicines/all/${product.slug}`);
  };

  const handleCompareClick = (item) => {
    const productId =
      item?.tabletdetails?.slug || item?.tablet?.slug || item?.slug || null;

    if (!productId) {
      toast.error("Product ID not found");
      return;
    }

    const tablet = item?.tabletdetails || item?.tablet || item;
    const categorySlug = tablet?.category?.slug || tablet?.subcategorys?.category?.slug || 'medicine';
    const subcategorySlug = tablet?.subcategorys?.slug || 'tablets';

    navigate(`/${categorySlug}/${subcategorySlug}/${productId}/compare`);
  };

  const handleVendorClick = (vendor) => {
    console.log("hello vendor:", vendor);
  };

  const applyFilters = async () => {
    const hasActiveFilters = selectedBrands.length > 0 ||
      selectedRatings.length > 0 ||
      priceFilter.min > 0 ||
      priceFilter.max < priceRange.max;

    if (!hasActiveFilters) {
      try {
        setFilterLoading(true);
        const params = new URLSearchParams();
        if (selectedPincode) {
          params.append('location', selectedPincode);
          if (latitude && longitude) {
            params.append('lat', latitude);
            params.append('lng', longitude);
          }
        }
        params.append('page', currentPage);
        params.append('limit', 15);

        const apiUrl = `compositions/${id}?${params.toString()}`;
        const response = await axiosCommonInstance.get(apiUrl);

        if (response.data.success && response.data.data) {
          setManufactureData(response.data.data);
          setSearchQuery('');
          setSearchResults([]);
        }
      } catch (err) {
        toast.error(
          err?.response?.data?.message || err?.message || "Failed to fetch data",
        );
      } finally {
        setFilterLoading(false);
      }
      return;
    }

    try {
      setFilterLoading(true);

      const params = new URLSearchParams();

      if (selectedPincode) {
        params.append('location', selectedPincode);
        if (latitude && longitude) {
          params.append('lat', latitude);
          params.append('lng', longitude);
        }
      }

      params.append('page', currentPage);
      params.append('limit', 15);

      if (selectedBrands.length > 0) {
        params.append('brand', selectedBrands.join(','));
      }

      if (selectedRatings.length > 0) {
        params.append('rating', selectedRatings.join(','));
      }

      if (priceFilter.min > 0 || priceFilter.max < priceRange.max) {
        params.append('minPrice', priceFilter.min);
        params.append('maxPrice', priceFilter.max);
      }

      const apiUrl = `compositions/${id}?${params.toString()}`;
      const response = await axiosCommonInstance.get(apiUrl);

      if (response.data.success && response.data.data) {
        setManufactureData(response.data.data);
        setSearchQuery('');
        setSearchResults([]);
      } else {
        toast.error("No products found with the selected filters");
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to filter products",
      );
    } finally {
      setFilterLoading(false);
    }
  };

  const handleBrandToggle = async (brandId) => {
    const newSelection = selectedBrands.includes(brandId)
      ? selectedBrands.filter((id) => id !== brandId)
      : [...selectedBrands, brandId];

    setSelectedBrands(newSelection);
  };

  const handleRatingToggle = async (ratingValue) => {
    const newSelection = selectedRatings.includes(ratingValue)
      ? selectedRatings.filter((value) => value !== ratingValue)
      : [...selectedRatings, ratingValue];

    setSelectedRatings(newSelection);
  };

  const handlePriceFilter = async (newPriceFilter) => {
    setPriceFilter(newPriceFilter);
  };

  const getBrandsList = async (opts = {}) => {
    try {
      const params = new URLSearchParams();
      params.append("type", "composition");
      params.append("id", id);

      const limit = Number.isFinite(opts?.brandsLimit) ? opts.brandsLimit : 10;
      const page = Number.isFinite(opts?.page) ? opts.page : 1;

      params.append("brandLimit", String(limit));
      params.append("brandPage", String(page));

      const response = await axiosCommonInstance.get(
        `productcommon/filter?${params.toString()}`,
      );
      const { data } = response.data.data;
      const nextBrands = Array.isArray(data?.brands) ? data.brands : [];
      const rawPagination = data?.pagination || null;
      const nextPagination = rawPagination
        ? {
          page: rawPagination.currentPage ?? rawPagination.page,
          totalPages: rawPagination.totalPages,
          totalRecords: rawPagination.totalRecords,
          limit: rawPagination.limit,
        }
        : null;

      setBrandsPagination(nextPagination);
      setBrands((prev) => (opts?.append ? [...prev, ...nextBrands] : nextBrands));

      if (nextPagination?.page != null && nextPagination?.totalPages != null) {
        setHasMoreBrands(
          Number(nextPagination.page) < Number(nextPagination.totalPages),
        );
      } else {
        setHasMoreBrands(nextBrands.length === limit);
      }

      setRatingOptions(data?.ratingOptions || []);

      if (data?.pricerange && !priceInitializedRef.current) {
        const { minprice, maxprice } = data.pricerange;
        const range = {
          min: Math.round(Number(minprice) || 0),
          max: Math.round(Number(maxprice) || 1000),
        };
        setPriceRange(range);
        setPriceFilter(range);
        setVisualProgress(range);
        priceInitializedRef.current = true;
      }
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to load brands",
      );
    } finally {
      setInitialDataLoading(false);
      setBrandsLoading(false);
      setBrandLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      setInitialDataLoading(true);
      setBrandsLoading(true);
      setBrandsPagination(null);
      setBrandPage(1);
      setHasMoreBrands(false);
      getBrandsList({ brandsLimit: 10, page: 1, append: false });
    }
  }, [id]);

  const loadMoreBrands = () => {
    const nextPage = brandPage + 1;
    setBrandPage(nextPage);
    setBrandLoading(true);
    getBrandsList({ brandsLimit: 10, page: nextPage, append: true });
  };

  const FilterContent = () => (
    <>
      {initialDataLoading ? (
        <div className="text-center py-4">
          <div className="animate-spin inline-block w-4 h-4 border-2 border-[#8059ca] border-t-transparent rounded-full" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="p-4 rounded-lg border border-slate-200 bg-white relative">
            {filterLoading && (
              <div className="absolute top-2.5 right-2.5 z-10">
                <i className="fas fa-spinner fa-spin text-xs text-[#8059ca]"></i>
              </div>
            )}
            <div className="flex justify-between items-center">
              <label className="font-bold text-sm text-slate-800">
                Price Range
              </label>

              <button
                onClick={() => {
                  const resetRange = { min: priceRange.min, max: priceRange.max };
                  setPriceFilter(resetRange);
                  setVisualProgress(resetRange);
                  setSelectedBrands([]);
                  setSelectedRatings([]);
                }}
                className="text-xs border-none bg-transparent text-[#8059ca] cursor-pointer hover:underline"
              >
                Clear
              </button>
            </div>

            {/* Values */}
            <div className="flex justify-between text-xs text-slate-500 my-2">
              <span>₹{Math.round(priceFilter.min)}</span>
              <span>₹{Math.round(priceFilter.max)}</span>
            </div>

            {/* RangeSlider Component */}
            <div className="py-2.5">
              <Slider
                range
                min={priceRange.min}
                max={priceRange.max}
                step={1}
                allowCross={false}
                value={[priceFilter.min, priceFilter.max]}
                onChange={(value) => {
                  const newFilter = { min: Math.round(value[0]), max: Math.round(value[1]) };
                  setPriceFilter(newFilter);
                  setVisualProgress(newFilter);
                }}
                onAfterChange={(value) => {
                  const newFilter = { min: Math.round(value[0]), max: Math.round(value[1]) };
                  handlePriceFilter(newFilter);
                }}
                styles={{
                  track: {
                    backgroundColor: "#8059ca",
                    height: 6,
                  },
                  rail: {
                    backgroundColor: "#e2e8f0",
                    height: 6,
                  },
                  handle: {
                    borderColor: "#8059ca",
                    backgroundColor: "#fff",
                    width: 22,
                    height: 22,
                    marginTop: -8,
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    opacity: 1,
                    cursor: "grab",
                    touchAction: "none",
                    zIndex: 10,
                  },
                }}
              />
            </div>
          </div>
          <hr className="border-slate-200 my-4" />

          <label className="block text-base font-bold text-slate-800 mb-2">
            Ratings
          </label>

          <ul className="list-none p-0 m-0 overflow-x-hidden overflow-y-auto max-h-[180px] scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
            {ratingOptions.length === 0 ? (
              <li className="py-2 text-slate-400 text-xs">No ratings available</li>
            ) : (
              ratingOptions.map((rating) => (
                <li key={rating.value} className="py-2">
                  <div
                    className="flex items-center w-full cursor-pointer"
                    onClick={() => {
                      const checkbox = document.getElementById(
                        `rating-${rating.value}`,
                      );
                      if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                      }
                      handleRatingToggle(rating.value);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        type="checkbox"
                        id={`rating-${rating.value}`}
                        className="w-4 h-4 rounded border-gray-300 text-[#8059ca] focus:ring-[#8059ca] mr-2 cursor-pointer"
                        checked={selectedRatings.includes(rating.value)}
                        onChange={() => handleRatingToggle(rating.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="text-xs font-medium text-slate-800 flex items-center">
                        {Array.from({ length: rating.value }, (_, index) => (
                          <i key={index} className="fas fa-star text-amber-400 mr-1"></i>
                        ))}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          <hr className="border-slate-200 my-4" />
          <label className="block text-base font-bold text-slate-800 mb-2">
            Brands
          </label>

          {brandsLoading && (
            <div className="text-center py-2">
              <div className="animate-spin inline-block w-4 h-4 border-2 border-[#8059ca] border-t-transparent rounded-full" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          )}

          <ul
            ref={brandsListRef}
            className="list-none p-0 m-0 overflow-x-hidden overflow-y-auto max-h-[240px] scrollbar-thin [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full"
          >
            {brands.length === 0 ? (
              <li className="py-2 text-slate-400 text-xs">No brands available</li>
            ) : (
              brands.map((brand, index) => (
                <li key={brand._id || index} className="py-2">
                  <div
                    className="flex items-center w-full cursor-pointer"
                    onClick={() => {
                      const checkbox = document.getElementById(
                        `brand-${brand._id}`,
                      );
                      if (checkbox) {
                        checkbox.checked = !checkbox.checked;
                      }
                      handleBrandToggle(brand._id);
                    }}
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        id={`brand-${brand._id}`}
                        className="w-4 h-4 rounded border-gray-300 text-[#8059ca] focus:ring-[#8059ca] mr-2 cursor-pointer"
                        checked={selectedBrands.includes(brand._id)}
                        onChange={() => handleBrandToggle(brand._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="truncate text-xs font-medium text-slate-800">
                        {brand.name}
                        {brand.productCount !== undefined && (
                          <span className="text-[10px] text-slate-500 ml-1">
                            ({brand.productCount})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          {hasMoreBrands && (
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  loadMoreBrands();
                }}
                disabled={brandLoading}
                className="!text-xs !font-bold !text-[#8059ca] !border !border-[#8059ca]/30 !bg-purple-50/50 !py-1.5 !px-3 !rounded-lg hover:bg-[#8059ca] hover:text-white transition-all duration-200 cursor-pointer"
              >
                {brandLoading ? "Loading..." : "View More"}
              </button>
            </div>
          )}
          <hr className="border-slate-200 my-4" />
        </>
      )}
    </>
  );

  if (loading && !searchQuery.trim()) {
    return <PageLoader />;
  }

  return (
    <>
      <style>{`
        /* Slider Custom Overrides */
        .rc-slider-handle-dragging {
          box-shadow: 0 0 0 5px rgba(128, 89, 202, 0.2) !important;
        }
        .rc-slider-handle:hover {
          border-color: #8059ca !important;
        }
        .rc-slider-handle:active {
          border-color: #8059ca !important;
          box-shadow: 0 0 5px rgba(128, 89, 202, 0.5) !important;
        }
      `}</style>
      <Home2Header />
      <CategoryProvider isLoading={false} />

      <div className="relative overflow-hidden bg-[#fdfaff] pt-[35px] pb-[28px] md:pt-[35px] md:pb-[28px] bottom-[2px] z-[1]">
        <div className="absolute inset-0 z-[1] after:content-[''] after:absolute after:inset-0 after:bg-white/30">
          <img className="w-full h-full object-cover" src="/assets/Medicompares Background.png" />
        </div>
        <div className="relative z-[2] px-4 py-0 sm:pt-[27px] container mx-auto">
          <div className="mb-3">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 py-1.5 px-4 !rounded-full text-xs font-bold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all cursor-pointer"
            >
              <i className="fa-solid fa-arrow-left text-[11px]" />
              Go Back
            </button>
          </div>

          <div className="flex flex-wrap items-center">
            <div className="w-full lg:w-8/12">
              <div
                style={{ position: "relative" }}
                className="hidden lg:block"
              >
                <img
                  src={doctors}
                  style={{
                    height: "150px",
                    position: "absolute",
                    top: "0px",
                    left: "0",
                  }}
                />
              </div>
              <h2
                className="breadcrumbb-title text-dark text-center hidden lg:block relative left-[150px] !text-[30px] font-[700] text-[#0a2540]"
              >
                Trusted Excellence <br /> in Healthcare
              </h2>
            </div>
            <div className="w-full lg:w-4/12">
              <div className="bg-white rounded-[14px] p-[18px_20px] flex items-center gap-[15px] shadow-[0_12px_30px_rgba(128,89,202,0.1)] border border-purple-100/50 max-w-[360px] ml-auto lg:ml-auto lg:mt-0 mt-5 mx-auto">
                <div className="w-[60px] h-[60px] rounded-[10px] bg-purple-50 flex items-center justify-center shrink-0">
                  <i className="fas fa-flask text-[#8059ca] text-[24px]"></i>
                </div>
                <div>
                  <div className="font-[700] text-base text-black capitalize truncate max-w-[220px]">
                    {manufactureData?.name || "Composition Details"}
                  </div>
                  <div className="text-[12px] text-[#6b7280] mt-0.5">
                    Active Formulation
                  </div>
                  <div className="text-[12px] text-[#8059ca] mt-1 font-bold">
                    {products?.length || 0} Products Available
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section className="bg-white relative z-[9] md:py-[30px] py-[20px] px-0">
        <div className="flex justify-center px-5 max-w-[850px] mx-auto">
          <div className="w-full max-w-[600px]">
            <form onSubmit={(e) => e.preventDefault()}>
              <div className="bg-white !rounded-[30px] border border-slate-200 shadow-sm flex items-center p-2.5 gap-2 w-full">
                <div className="flex items-center justify-center w-6 h-6 text-slate-400">
                  <i className="fas fa-search text-sm"></i>
                </div>

                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  className="border-none outline-none flex-1 text-base text-slate-900 bg-transparent"
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {!searchLoading && searchQuery && displayProducts.length === 0 && (
        <section className="mx-2 py-5 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-slate-400 text-sm">
              No products found for "{searchQuery}"
            </p>
          </div>
        </section>
      )}

      <div className="w-full px-3 md:px-6 bg-white py-4">
        <div className="flex items-center justify-between lg:hidden mb-3">
          <button
            type="button"
            className="h-[32px] inline-flex items-center justify-center gap-1 bg-[#8059ca] text-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
            onClick={() => setShowFilterCanvas(true)}
          >
            <i className="fas fa-filter"></i>
            <span>Filter</span>
          </button>

          <button
            type="button"
            className="h-[32px] inline-flex items-center justify-center gap-1 border border-slate-300 text-slate-600 bg-white text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer"
            onClick={() => {
              setSelectedBrands([]);
              setSearchParams(new URLSearchParams());
            }}
          >
            <i className="fas fa-times"></i>
            <span>Clear All</span>
          </button>
        </div>

        <div className="flex flex-wrap gap-0">
          <div className="w-full lg:w-[300px] shrink-0 mb-4 hidden lg:block pr-4">
            <div className="bg-white rounded-lg border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4">
              {FilterContent()}
            </div>
          </div>

          <div className="flex-1 min-w-0">
            {/* Selected Filters Display */}
            {selectedBrands.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-slate-500 text-xs mr-2">Filters:</span>
                {selectedBrands.map((brandId) => {
                  const brand = brands.find(b => b._id === brandId);
                  return (
                    <span key={brandId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-100 text-slate-800 text-xs font-medium">
                      {brand?.name || brandId}
                      <i
                        className="fas fa-times text-slate-400 hover:text-slate-600 cursor-pointer ml-1 text-[10px]"
                        onClick={() => handleBrandToggle(brandId)}
                      />
                    </span>
                  );
                })}
                <button
                  className="h-[28px] inline-flex items-center justify-center border border-slate-300 text-slate-600 bg-white text-xs font-semibold px-2.5 py-1 rounded cursor-pointer"
                  onClick={() => {
                    setSelectedBrands([]);
                    setSearchParams(new URLSearchParams());
                  }}
                >
                  Clear All
                </button>
              </div>
            )}
            {searchLoading || filterLoading ? (
              <div className="text-center py-[50px]">
                <i className="fas fa-spinner fa-spin text-2xl text-slate-400"></i>
                <p className="mt-2.5 text-slate-400 text-sm">{filterLoading ? 'Filtering...' : 'Searching...'}</p>
              </div>
            ) : displayProducts && displayProducts.length > 0 ? (
              <section className="w-full">
                <div className="flex flex-wrap -mx-2">
                  {displayProducts.map((item, index) => {
                    const normalizedItem = normalizeItem(item);
                    const variants = normalizedItem.variants;
                    return (
                      <div
                        key={index}
                        className="w-1/2 md:w-1/3 lg:w-1/5 px-2 mb-4"
                      >
                        <ProductCard
                          item={normalizedItem}
                          variant={variants}
                          onProductClick={handleProductClick}
                          onCompareClick={handleCompareClick}
                          onVendorClick={handleVendorClick}
                          imgUrl={imgUrl}
                          maxStock={variants?.stock || 999}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {displayPagination && totalPages > 1 && (
                  <Pagination
                    page={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </section>
            ) : (
              <div className="flex flex-wrap">
                <div className="w-full">
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i
                        className="fas fa-box-open text-[64px] text-slate-200 mb-[20px]"
                      ></i>
                    </div>
                    <h3 className="text-slate-400 mb-3 font-medium">
                      No Products Found
                    </h3>
                    <p className="text-slate-400 text-base max-w-[600px] mx-auto mb-5">
                      No products are currently available from this composition.
                    </p>
                    <div className="flex justify-center gap-3">
                      <button
                        className="h-[38px] inline-flex items-center justify-center border border-slate-300 text-slate-600 bg-white text-xs font-semibold px-6 py-2 rounded-full cursor-pointer hover:bg-slate-50 transition-all"
                        onClick={() => window.location.reload()}
                      >
                        <i className="fas fa-redo me-2"></i>
                        Refresh
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <Offcanvas
        show={showFilterCanvas}
        onHide={() => setShowFilterCanvas(false)}
        placement="start"
        className="w-[280px] max-w-[80vw]"
        style={{ zIndex: "999999" }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Filters</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-3">
          {FilterContent()}
        </Offcanvas.Body>
      </Offcanvas>

      <Footer />
    </>
  );
};

export default Compositions;
