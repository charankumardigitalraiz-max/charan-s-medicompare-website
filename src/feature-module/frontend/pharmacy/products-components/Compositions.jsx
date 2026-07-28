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
import { Offcanvas } from "react-bootstrap";
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
        params.append("limit", 20);

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

      // Set new timeout to apply filters after 500ms
      debounceTimeoutRef.current = setTimeout(() => {
        applyFilters();
      }, 500);
    }

    // Cleanup function
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
      params.append("limit", 20);

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
    currentPage: apiCurrentPage = 1,
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
    // Check if any filters are actually active
    const hasActiveFilters = selectedBrands.length > 0 ||
      selectedRatings.length > 0 ||
      priceFilter.min > 0 ||
      priceFilter.max < priceRange.max;

    // If no filters are active, fetch initial data instead
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
        params.append('limit', 20);

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
      params.append('limit', 20);

      // Apply all active filters
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

  const handleBrandToggle = async (brandId, brandName) => {
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

      // Always pass brandLimit + brandPage (server-side paging)
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

      // Decide if we should show "View More" even when backend doesn't send pagination.
      // Priority:
      // 1) If backend sends pagination, use it.
      // 2) Else, assume "more exists" when we received a full page (limit items).
      if (nextPagination?.page != null && nextPagination?.totalPages != null) {
        setHasMoreBrands(
          Number(nextPagination.page) < Number(nextPagination.totalPages),
        );
      } else {
        setHasMoreBrands(nextBrands.length === limit);
      }

      setRatingOptions(data?.ratingOptions || []);

      // Set price range from API response
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
          <div className="spinner-border spinner-border-sm" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <>

          <div
            style={{
              padding: "16px",
              borderRadius: "8px",
              border: "1px solid #e5e7eb",
              backgroundColor: "#fff",
              position: "relative"
            }}
          >
            {filterLoading && (
              <div
                style={{
                  position: "absolute",
                  top: "8px",
                  right: "8px",
                  zIndex: 10
                }}
              >
                <i className="fas fa-spinner fa-spin" style={{ fontSize: "12px", color: "#3b82f6" }}></i>
              </div>
            )}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}
            >
              <label style={{ fontWeight: 600, fontSize: "15px" }}>
                Price Range
              </label>

              <button
                onClick={() => {
                  // Reset all filters
                  const resetRange = { min: priceRange.min, max: priceRange.max };
                  setPriceFilter(resetRange);
                  setVisualProgress(resetRange);
                  setSelectedBrands([]);
                  setSelectedRatings([]);
                }}
                style={{
                  fontSize: "12px",
                  border: "none",
                  background: "transparent",
                  color: "#3b82f6",
                  cursor: "pointer"
                }}
              >
                Clear
              </button>
            </div>

            {/* Values */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "13px",
                color: "#6b7280",
                margin: "8px 0 12px"
              }}
            >
              <span>₹{Math.round(priceFilter.min)}</span>
              <span>₹{Math.round(priceFilter.max)}</span>
            </div>

            {/* CRangeSlider Component */}
            <div style={{ padding: "10px 0" }}>
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
                    backgroundColor: "#8059ca",
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

            {/* Bottom Labels */}
            {/* <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "10px"
              }}
            >
              <div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>Min</div>
                <div style={{ fontWeight: 600 }}>₹{Math.round(priceFilter.min)}</div>
              </div>

              <div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>Max</div>
                <div style={{ fontWeight: 600 }}>₹{Math.round(priceFilter.max)}</div>
              </div>
            </div> */}
          </div>
          <hr />

          <label
            className="form-label"
            style={{ fontSize: "16px", fontWeight: "600" }}
          >
            Ratings
          </label>

          <ul
            className="list-unstyled filter-scroll-list"
            style={{
              overflowX: "hidden",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#94a3b8 #e5e7eb",
              maxHeight: "180px",
            }}
          >
            {ratingOptions.length === 0 ? (
              <li className="py-2 text-muted">No ratings available</li>
            ) : (
              ratingOptions.map((rating) => (
                <li key={rating.value} className="py-2">
                  <div
                    className="d-flex align-items-center w-100"
                    style={{ cursor: "pointer" }}
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
                    <div className="d-flex align-items-center flex-grow-1">
                      <input
                        type="checkbox"
                        id={`rating-${rating.value}`}
                        className="form-check-input me-2"
                        style={{ cursor: "pointer" }}
                        checked={selectedRatings.includes(rating.value)}
                        onChange={() => handleRatingToggle(rating.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#000",
                        }}
                      >
                        {Array.from({ length: rating.value }, (_, index) => (
                          <i key={index} className="fas fa-star text-warning me-1"></i>
                        ))}
                        {/* {rating.label} */}
                      </span>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
          <hr />
          <label
            className="form-label"
            style={{ fontSize: "16px", fontWeight: "600" }}
          >
            Brands
          </label>

          {brandsLoading && (
            <div className="text-center py-2">
              <div className="spinner-border spinner-border-sm" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}

          <ul
            ref={brandsListRef}
            className="list-unstyled filter-scroll-list"
            style={{
              overflowX: "hidden",
              overflowY: "auto",
              scrollbarWidth: "thin",
              scrollbarColor: "#94a3b8 #e5e7eb",
              maxHeight: "240px",
            }}
          >
            {brands.length === 0 ? (
              <li className="py-2 text-muted">No brands available</li>
            ) : (
              brands.map((brand, index) => (
                <li key={brand._id || index} className="py-2">
                  <div
                    className="d-flex align-items-center w-100"
                    style={{ cursor: "pointer" }}
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
                    <div className="d-flex align-items-center flex-grow-1 text-truncate">
                      <input
                        type="checkbox"
                        id={`brand-${brand._id}`}
                        className="form-check-input me-2"
                        style={{ cursor: "pointer" }}
                        checked={selectedBrands.includes(brand._id)}
                        onChange={() => handleBrandToggle(brand._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span
                        className="text-truncate"
                        style={{
                          fontSize: "13px",
                          fontWeight: "500",
                          color: "#000",
                        }}
                      >
                        {brand.name}
                        {brand.productCount !== undefined && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "#6b7280",
                              marginLeft: "4px",
                            }}
                          >
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
                className="view-more-btn"
              >
                {brandLoading ? "Loading..." : "View More"}
              </button>
            </div>
          )}
          <hr />
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
        .custom-shift {
          position: relative;
        }

        @media (min-width: 768px) {
          .custom-shift {
            left: 150px;
          }
          
        }

        @media (max-width: 767px) {
          .custom-shift {
            left: 0;
          }
        }

        .search-body {
          background: #ffffff;
          position: relative;
          z-index: 9;
        }

        @media (min-width: 768px) {
          .search-body {
            padding: 30px;
          }
        }

        @media (max-width: 767px) {
          .search-body {
          padding: 20px 0px;
          }
        }

        /* Slider Custom Styles */
        .rc-slider-handle-dragging {
          box-shadow: 0 0 0 5px rgba(59, 130, 246, 0.2) !important;
        }
        .rc-slider-handle:hover {
          border-color: #2563eb !important;
        }
        .rc-slider-handle:active {
          border-color: #2563eb !important;
          box-shadow: 0 0 5px rgba(59, 130, 246, 0.5) !important;
        }

        .filter-scroll-list::-webkit-scrollbar {
          width: 6px;
        }

        .filter-scroll-list::-webkit-scrollbar-track {
          background: #e5e7eb;
          border-radius: 999px;
        }

        .filter-scroll-list::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 999px;
        }
      `}</style>
      <Home2Header />
      <CategoryProvider isLoading={false} />

      <div
        className="breadcrumb-bar"
        style={{
          backgroundImage: "url('/assets/Medicompares Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="breadcrumbb-contentt">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <nav aria-label="breadcrumb d-none d-lg-block">
                <ol className="breadcrumb d-flex align-items-center mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/" className="text-decoration-none">
                      <i className="fa fa-home me-1" />
                      Home
                    </Link>
                  </li>
                  <li
                    className="breadcrumb-item active text-primary"
                    aria-current="page"
                  >
                    Composition
                  </li>
                </ol>
              </nav>
              <div
                style={{ position: "relative" }}
                className="d-none d-lg-block"
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
              <h2 className="breadcrumbb-title text-dark text-center custom-shift">
                Trusted Excellence <br /> in Healthcare
              </h2>
            </div>
          </div>
        </div>
      </div>


      <section className="search-body">
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: "0 20px",
            maxWidth: "850px",
            margin: "0 auto",
          }}
        >
          <div
            className="search-wrapper1"
            style={{ width: "100%", maxWidth: "600px" }}
          >
            <form onSubmit={(e) => e.preventDefault()}>
              <div
                style={{
                  background: "#ffffff",
                  borderRadius: "30px",
                  border: "1.5px solid #e5e7eb",
                  boxShadow:
                    "0 1px 3px rgba(0, 0, 0, 0.02), 0 1px 2px rgba(0, 0, 0, 0.01)",
                  display: "flex",
                  alignItems: "center",
                  padding: "8px",
                  gap: "8px",
                  width: "100%",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "25px",
                    height: "25px",
                    color: "#9ca3af",
                  }}
                >
                  <i className="fas fa-search" style={{ fontSize: "14px" }}></i>
                </div>

                <input
                  type="text"
                  placeholder="Search medicines..."
                  value={searchQuery}
                  onChange={handleInputChange}
                  style={{
                    border: "none",
                    outline: "none",
                    flex: 1,
                    fontSize: "16px",
                    color: "#111827",
                    background: "transparent",
                  }}
                />
              </div>
            </form>
          </div>
        </div>
      </section>

      {!searchLoading && searchQuery && displayProducts.length === 0 && (
        <section
          className="mx-2"
          style={{ padding: "20px 0", backgroundColor: "#ffffff" }}
        >
          <div className="container-fluid text-center">
            <p className="text-muted">
              No products found for "{searchQuery}"
            </p>
          </div>
        </section>
      )}

      <div className="container-fluid" style={{ background: "#f8f9fa" }}>
        <div className="d-flex align-items-center justify-content-between d-lg-none mb-3 mobile-filter-buttons-container">
          <button
            type="button"
            className="btn btn-sm btn-primary d-flex align-items-center gap-1"
            onClick={() => setShowFilterCanvas(true)}
          >
            <i className="fas fa-filter"></i>
            <span>Filter</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
            onClick={() => {
              setSelectedBrands([]);
              setSearchParams(new URLSearchParams());
            }}
          >
            <i className="fas fa-times"></i>
            <span>Clear All</span>
          </button>
        </div>

        <div className="row">
          <div className="col-lg-3 mb-4 d-none d-lg-block">
            <div className="card shadow-sm p-3">
              {FilterContent()}
            </div>
          </div>

          <div className="col-lg-9">
            {/* Selected Filters Display */}
            {selectedBrands.length > 0 && (
              <div className="mb-3 d-flex flex-wrap align-items-center gap-2">
                <span className="text-muted me-2">Filters:</span>
                {selectedBrands.map((brandId) => {
                  const brand = brands.find(b => b._id === brandId);
                  return (
                    <span key={brandId} className="badge bg-light text-dark d-flex align-items-center gap-1">
                      {brand?.name || brandId}
                      <button
                        className="btn-close btn-close-sm"
                        onClick={() => handleBrandToggle(brandId)}
                        style={{ fontSize: "10px" }}
                      />
                    </span>
                  );
                })}
                <button
                  className="btn btn-sm btn-outline-secondary"
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

              <div style={{ textAlign: 'center', padding: '50px' }}>
                <i className="fas fa-spinner fa-spin" style={{ fontSize: '24px', color: '#6b7280' }}></i>
                <p style={{ marginTop: '10px', color: '#6b7280' }}>{filterLoading ? 'Filtering...' : 'Searching...'}</p>
              </div>
            ) : displayProducts && displayProducts.length > 0 ? (
              <section
                style={{
                  borderRadius: "10px",
                }}
                className="m-0 m-md-2"
              >
                <div className="row">
                  {displayProducts.map((item, index) => {
                    const normalizedItem = normalizeItem(item);
                    const variants = normalizedItem.variants;
                    return (
                      <div
                        key={index}
                        className="col-xl-3 col-lg-3 col-md-4 col-sm-6 col-6 mb-3"
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

                {/* Pagination - only show for manufacture data, not search results */}
                {displayPagination && totalPages > 1 && (
                  <div className="pagination dashboard-pagination mt-0">
                    <ul className="d-flex justify-content-center align-items-center gap-1">
                      <li>
                        <button
                          className="page-link"
                          onClick={() =>
                            handlePageChange(Math.max(currentPage - 1, 1))
                          }
                          disabled={currentPage === 1}
                        >
                          <i className="fa-solid fa-chevron-left" />
                        </button>
                      </li>

                      {Array.from({ length: totalPages }, (_, i) => {
                        const page = i + 1;

                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <li key={page}>
                              <button
                                className={`page-link ${currentPage === page ? "active" : ""
                                  }`}
                                onClick={() => handlePageChange(page)}
                              >
                                {page}
                              </button>
                            </li>
                          );
                        }

                        if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <li key={`dots-${page}`}>
                              <span className="page-link disabled">…</span>
                            </li>
                          );
                        }

                        return null;
                      })}

                      <li>
                        <button
                          className="page-link"
                          onClick={() =>
                            handlePageChange(Math.min(currentPage + 1, totalPages))
                          }
                          disabled={currentPage === totalPages}
                        >
                          <i className="fa-solid fa-chevron-right" />
                        </button>
                      </li>
                    </ul>
                  </div>
                )}
              </section>
            ) : (
              <div className="row">
                <div className="col-12">
                  <div className="text-center py-5">
                    <div className="mb-4">
                      <i
                        className="fas fa-box-open"
                        style={{
                          fontSize: "64px",
                          color: "#dee2e6",
                          marginBottom: "20px"
                        }}
                      ></i>
                    </div>
                    <h3 className="text-muted mb-3" style={{ fontWeight: "500" }}>
                      No Products Found
                    </h3>
                    <p className="text-muted" style={{ fontSize: "16px", maxWidth: "600px", margin: "0 auto 20px auto" }}>
                      No products are currently available from this composition.
                    </p>
                    <div className="d-flex justify-content-center gap-3">
                      {/* <button 
                    className="btn btn-primary"
                    onClick={() => navigate('/medicines/all')}
                    style={{
                      borderRadius: "25px",
                      padding: "10px 24px",
                      fontSize: "14px"
                    }}
                  >
                    <i className="fas fa-pills me-2"></i>
                    Browse All Medicines
                  </button> */}
                      <button
                        className="btn btn-outline-secondary"
                        onClick={() => window.location.reload()}
                        style={{
                          borderRadius: "25px",
                          padding: "10px 24px",
                          fontSize: "14px"
                        }}
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
        className="w-75 w-md-50"
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
