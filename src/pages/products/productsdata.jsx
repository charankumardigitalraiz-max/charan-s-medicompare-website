import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Home2Header from "../../components/layout/Header-k";
import Footer from "../../components/layout/Footer-f";
import CategoryProvider from "../../components/ui/CategoryProvider.jsx";
import {
  axiosCommonInstance,
  axiosUserInstance,
} from "../../Apiservice.jsx";
import toast from "react-hot-toast";
import {
  FilterSidebar,
  ProductsSection,
  LeadModal,
  ShareModal,
} from "../../components/products/index.js";

import { useCart } from "../../hooks/useCart.js";
import {
  getDisplayPrice,
  getVendorPrice,
  createShareHandler,
  getShareUrl,
} from "../../utils/index.js";
import { redirectToLoginWithPendingBooking } from "../../utils/pendingBookingUtils.js";
import {
  SearchInput,
  ViewToggleButtons,
  SortSelect,
} from "../../components/ui/index.js";
import { useAddToCart } from "../../hooks/useAddToCart.js";
import { CartQuantityControls } from "../../components/ui/index.js";
import { useResponsive } from "../../hooks/index.js";
import { useProfile } from "../../context/ProfileContext.jsx";
import { useLocation } from "../../context/LocationContext.jsx";
import { handleGeneralBookingProcess } from "../../services/bookingService.js";

const ProductsData = () => {
  let { service, id } = useParams();
  const navigate = useNavigate();
  const { selectedPincode, latitude, longitude } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const maincategories = searchParams.get("maincategories"); // 'some-slug'
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const urlCats = searchParams.get("categories");
    if (urlCats) return urlCats.split(",");
    if (id && id !== "all") return [id];
    if (maincategories) return [maincategories];
    return [];
  });
  const [selectedBrands, setSelectedBrands] = useState(() => {
    const urlBrands = searchParams.get("brands");
    if (urlBrands) return urlBrands.split(",");
    return id === "all" ? [] : id ? [id] : [];
  });
  const [selectedCompositions, setSelectedCompositions] = useState(() => {
    const urlCompositions = searchParams.get("compositions");
    if (urlCompositions) return urlCompositions.split(",");
    return id === "all" ? [] : id ? [id] : [];
  });
  const [page, setPage] = useState(() => {
    const pageParam = searchParams.get('page');
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [limit, setLimit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState({});
  const [selectedVendors, setSelectedVendors] = useState({});
  const [categories, setCategories] = useState([]);
  // const [brands, setBrands] = useState([]);
  const [brands, setBrands] = useState({
    data: [],
    pagination: {},
  });
  const [complexity, setComplexity] = useState([]);
  const [gender, setGender] = useState([]);
  const [samples, setSamples] = useState([]);
  const [types, setTypes] = useState([]);
  const [conditions, setConditions] = useState([]);
  // const [compositions, setCompositions] = useState([]);
  const [compositions, setCompositions] = useState({
    data: [],
    pagination: {},
  });
  const [alphabetData, setAlphabetData] = useState([]);
  const [isAlphabetFilterActive, setIsAlphabetFilterActive] = useState(false);
  const [activeAlphabetLetter, setActiveAlphabetLetter] = useState(null);
  const [isAlphabetApiCallInProgress, setIsAlphabetApiCallInProgress] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState(
    searchParams.get("types") ? searchParams.get("types").split(",") : [],
  );
  const [medicineForms, setMedicineForms] = useState([]);
  const [selectedForms, setSelectedForms] = useState(
    searchParams.get("forms") ? searchParams.get("forms").split(",") : [],
  );
  const [selectedComplexity, setSelectedComplexity] = useState(
    searchParams.get("complexity") ? searchParams.get("complexity").split(",") : [],
  );
  const [selectedGender, setSelectedGender] = useState(
    searchParams.get("gender") ? searchParams.get("gender").split(",") : [],
  );
  const [selectedSamples, setSelectedSamples] = useState(
    searchParams.get("samples") ? searchParams.get("samples").split(",") : [],
  );
  const [selectedConditions, setSelectedConditions] = useState(
    searchParams.get("conditions") ? searchParams.get("conditions").split(",") : [],
  );
  const [productsList, setProductsList] = useState([]);
  const [isFull, setIsFull] = useState(false);
  const [sortOption, setSortOption] = useState("");
  const token = localStorage.getItem("medicomparestoken");
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareProductData, setShareProductData] = useState(null);
  const [fixedType, setFixedType] = useState("")
  const [leadFormData, setLeadFormData] = useState({
    date: "",
    name: "",
    mobile: "",
    policyNumber: "",
    relation: "",
    address: "",
  });
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();
  const [userId, setUserId] = useState(userProfile?._id || null);
  const [expandedVendors, setExpandedVendors] = useState({});
  const [totalCount, setTotalCount] = useState(0);

  const [brandPage, setBrandPage] = useState(1);
  const [compositionPage, setCompositionPage] = useState(1);
  const [categoryPage, setCategoryPage] = useState(1);

  const [brandLoading, setBrandLoading] = useState(false);
  const [compositionLoading, setCompositionLoading] = useState(false);

  const [categoryLoading, setCategoryLoading] = useState(false);
  const [fixedTypeKey, setFixedTypeKey] = useState(null);
  const loadMoreBrands = async () => {
    try {
      if (brandLoading) return;
      const nextPage = brandPage + 1;
      setBrandLoading(true);
      const response = await axiosCommonInstance.get(
        `category/search/filter/?serviceType=${service}&maincatId=${maincategories || id || null}&asortby=a&bpage=${nextPage}&blimit=10`
      );

      const newBrands = response?.data?.data?.brands;

      if (!newBrands?.data?.length) {
        setBrandLoading(false);
        return;
      }

      setBrands((prev) => ({
        ...newBrands,
        data: [...prev.data, ...newBrands.data],
      }));

      setBrandPage(nextPage);

    } catch (error) {
      console.log(error);
    } finally {
      setBrandLoading(false);
    }
  };



  const loadMoreCompositions = async () => {
    try {

      if (compositionLoading) return;

      const nextPage = compositionPage + 1;

      setCompositionLoading(true);

      const response = await axiosCommonInstance.get(
        `category/search/filter/?serviceType=${service}&maincatId=${maincategories || id || null}&asortby=a&cpage=${nextPage}&climit=10`
      );

      const newCompositions = response?.data?.data?.compositions;

      if (!newCompositions?.data?.length) {
        setCompositionLoading(false);
        return;
      }

      setCompositions((prev) => ({
        ...newCompositions,
        data: [...prev.data, ...newCompositions.data],
      }));

      setFixedType(response?.data?.data?.services?.fixedType)

      setCompositionPage(nextPage);

    } catch (error) {
      console.log(error);
    } finally {
      setCompositionLoading(false);
    }
  };

  const loadMoreCategories = async () => {
    try {
      if (categoryLoading) return;

      const nextPage = categoryPage + 1;

      setCategoryLoading(true);

      const response = await axiosCommonInstance.get(
        `category/search/filter/?serviceType=${service}&maincatId=${maincategories || id || null}&asortby=a&catpage=${nextPage}&catlimit=10`
      );

      const newCategories = response?.data?.data?.category;

      if (!newCategories?.data?.length) {
        setCategoryLoading(false);
        return;
      }

      setCategories((prev) => ({
        ...newCategories,
        data: [...prev.data, ...newCategories.data],
      }));

      setCategoryPage(nextPage);

    } catch (error) {
      console.log(error);
    } finally {
      setCategoryLoading(false);
    }
  };

  const getDefaultPriceRange = (serviceType) => {
    if (serviceType === "medicine" || serviceType === "medicines" || serviceType === "rx-medicines" || serviceType === "rx-medicines-and-more") {
      return [1, 10000];
    }
    return [200, 100000];
  };
  const placeholderText = (service) => {
    if (service === "lab-tests") {
      return "Search any lab tests"
    } else if (service === "medicine" || service === "medicines" || service === "rx-medicines" || service === "rx-medicines-and-more") {
      return "Search any Medicines"
    } else if (service === "surgeries") {
      return "Search any Surgery"
    } else if (service === "diagnostics") {
      return "Search any Diagnostics"
    }
    else if (service === "medicalequipment") {
      return "Search any Medicale Euipment"
    } else if (service === "home-care") {
      return "Search any Home Care "
    }
    else if (service === "nursing-care") {
      return "Search any Nursing Care"
    }
    else if (service === "medical-equipment") {
      return "Search any Medical Equipment"
    }
    else if (service === "medical-treatment") {
      return "Search any Medical Treatment"
    }
    else if (service === "dental-service") {
      return "Search any Dental Service"
    }
    else {
      return "Search any Medicines"
    }
  }
  const defaultPriceRange = useMemo(
    () => getDefaultPriceRange(service),
    [service],
  );

  const [priceRange, setPriceRange] = useState(() =>
    getDefaultPriceRange(service),
  );
  const [availablePriceRange, setAvailablePriceRange] = useState(() =>
    getDefaultPriceRange(service),
  );
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true); // Desktop sidebar toggle
  const { isTablet } = useResponsive();
  const [activeTab, setActiveTab] = useState("best-match");
  const [defaultCategoryFromUrl, setDefaultCategoryFromUrl] = useState(null);

  const debounceRef = useRef(null);

  const fetchingRef = useRef(false);
  const requestIdRef = useRef(0);
  const alphabetApiCallRef = useRef(false);
  const skipDebouncedProductsFetchRef = useRef(false);

  useEffect(() => {
    if (isFilterDrawerOpen) {
      document.body.classList.add("filter-drawer-open");
    } else {
      document.body.classList.remove("filter-drawer-open");
    }
    return () => {
      document.body.classList.remove("filter-drawer-open");
    };
  }, [isFilterDrawerOpen]);

  const {
    cartQuantities,
    setCartQuantities,
    getCart,
    saveCart,
    getCartQuantity,
    syncCartUpdate,
    getServerCartQuantity,
  } = useCart();

  const { addToCart } = useAddToCart();

  const getAllData = async (targetPage = page) => {
    if (alphabetApiCallRef.current) {
      return;
    }
    fetchingRef.current = true;
    setIsLoading(true);
    const currentRequestId = ++requestIdRef.current;
    setProductsList([]);

    try {
      // Use the route parameter 'service' directly to prevent incorrect filtering when navigating back
      if (searchTerm) {
        targetPage = 1
      }
      const requestBody = {
        userId: userId || userProfile?._id || null,
        maincatId: (service === "medicine" || service === "medicines" || service === "rx-medicines-and-more" || service === "rx-medicines") ? (maincategories || id || 'all' || null) : null,
        categoryId: (service === "medicine" || service === "medicines" || service === "rx-medicines" || service === "rx-medicines-and-more") ? [] : selectedCategories.length ? selectedCategories : (id && id !== "all") ? [id] : maincategories ? [maincategories] : [],
        brandId: selectedBrands.length ? selectedBrands : [],
        type: selectedTypes.length ? selectedTypes : [],
        medicineform: selectedForms.length ? selectedForms : [],
        composition: selectedCompositions.length ? selectedCompositions : [],
        complexity: selectedComplexity.length ? selectedComplexity : [],
        gender: selectedGender.length ? selectedGender : [],
        samples: selectedSamples.length ? selectedSamples : [],
        conditions: selectedConditions.length ? selectedConditions : [],
        serviceType: service,
        activeCategoryType: activeTab ? activeTab : "best-match",
        search: searchTerm,
        page: targetPage,
        limit: limit,
        asortby: isAlphabetFilterActive && activeAlphabetLetter ? activeAlphabetLetter.toLowerCase() : null,
        sortBy: sortOption || null, // ✅ send current sort to backend

      };

      if (selectedPincode) {
        requestBody.location = selectedPincode;
        if (latitude && longitude) {
          requestBody.lat = latitude;
          requestBody.lng = longitude;
        }
      }

      const response = await axiosCommonInstance.post("category/search", requestBody);

      if (currentRequestId !== requestIdRef.current) {
        return;
      }

      if (!response.data?.success) {
        if (currentRequestId === requestIdRef.current) {
          setProductsList([]);
        }
        return;
      }

      if (response.data.success) {
        const products = response.data.data?.products || [];
        const serviceDetails = response?.data?.data?.service?.fixedType
        setFixedTypeKey(serviceDetails);
        const pg = response.data.data?.pagination;
        if (currentRequestId === requestIdRef.current) {
          if (pg) {
            setLimit(pg.limit || limit);
            setTotalPages(Math.max(1, parseInt(pg.pages) || 1));
            setTotalCount(pg.total || products?.length || 0);
          } else {
            const totalCount = response.data.data?.total || products?.length || 0;
            setTotalCount(totalCount);
            const calculatedPages = Math.max(1, Math.ceil(totalCount / limit));
            setTotalPages(calculatedPages);
          }
        }

        if (!Array.isArray(products) || products.length === 0) {
          setProductsList([]);
          return;
        }


        const productsWithVendor = products.map((product) => {
          const firstVendor =
            product?.vendordetails ||
            (product?.vendors && product.vendors[0]) ||
            product?.vendor ||
            null;
          if (!firstVendor) return product;
          return {
            ...product,
            primaryVendor: {
              ...firstVendor,
              vendorId:
                firstVendor.vendorId || firstVendor._id || firstVendor.id,
              name:
                firstVendor.name ||
                firstVendor.vendorName ||
                firstVendor?.bussinessdetails?.name ||
                "",
              price:
                firstVendor.price ||
                firstVendor.matchedVariantPrice ||
                firstVendor.matchedPrice ||
                firstVendor.mrp ||
                firstVendor.sellingPrice ||
                0,
            },
          };
        });

        if (currentRequestId === requestIdRef.current) {
          setProductsList(productsWithVendor);
        }
        if (products.length > 0) {
          const prices = [];
          products.forEach((product) => {
            const price = getDisplayPrice(product, {});
            if (price && price > 0 && typeof price === "number") {
              prices.push(price);
            }
            product?.vendors?.forEach((vendor) => {
              const vendorPrice = getVendorPrice(vendor, product.tablet, {});
              if (
                vendorPrice &&
                vendorPrice > 0 &&
                typeof vendorPrice === "number"
              ) {
                prices.push(vendorPrice);
              }
            });
          });
          if (prices.length > 0) {
            const serviceMin = defaultPriceRange[0];
            const serviceMax = defaultPriceRange[1];
            const minPrice = Math.max(
              serviceMin,
              Math.floor(Math.min(...prices)),
            );
            const actualMaxPrice = Math.ceil(Math.max(...prices));
            const sliderMax = Math.max(actualMaxPrice, serviceMax);
            setAvailablePriceRange([minPrice, sliderMax]);
            setPriceRange(defaultPriceRange);
          } else {
            setAvailablePriceRange(defaultPriceRange);
            setPriceRange(defaultPriceRange);
          }
        }
      }
    } catch (error) {
      if (currentRequestId === requestIdRef.current) {
        toast.error(
          `Error fetching data: ${error.response?.data?.message || error.message || error
          }`,
        );
      }
    } finally {
      if (currentRequestId === requestIdRef.current) {
        fetchingRef.current = false;
        setIsLoading(false);
      }
    }
  };



  const handleAlphabetClick = async (data, letter) => {
    alphabetApiCallRef.current = true;
    setIsAlphabetFilterActive(true);
    setActiveAlphabetLetter(letter);
    setPage(1);

    setIsAlphabetApiCallInProgress(true);

    if (!data || !data.data) {
      try {
        // Use the route parameter 'service' directly to prevent incorrect filtering when navigating back
        const requestBody = {
          userId: userId || userProfile?._id || null,
          maincatId: (service === "medicine" || service === "medicines" || service === "rx-medicines" || service === "rx-medicines-and-more") ? (maincategories || id || null) : null,
          categoryId: [],
          brandId: [],
          type: [],
          medicineform: [],
          composition: [],
          serviceType: service,
          activeCategoryType: "best-match",
          page: 1,
          limit: limit,
          asortby: letter.toLowerCase(),
        };

        // Add location parameter if available
        if (selectedPincode) {
          requestBody.location = selectedPincode;
          if (latitude && longitude) {
            requestBody.lat = latitude;
            requestBody.lng = longitude;
          }
        }

        const response = await axiosCommonInstance.post("category/search", requestBody);

        if (response.data?.data?.category) {
          setCategories(response.data.data.category);
        }
        if (response.data?.data?.brands) {
          setBrands(response.data.data.brands);
        }
        // if (response.data?.data?.complexity) {
        //   setComplexity(response.data.data?.complexity || []);
        // }
        // if (response.data?.data?.gender) {
        //   setGender(response.data.data.gender || []);
        // }
        // if (response.data?.data?.samples) {
        //   setSamples(response.data.data.samples || []);
        // }
        // if (response.data?.data?.conditions) {
        //   setConditions(response.data.data.conditions || []);
        // }
        // if (response.data?.data?.type) {
        //   setTypes(response.data.data.type);
        // }
        // if (response.data?.data?.medicineform) {
        //   setMedicineForms(response.data.data.medicineform);
        // }
        // if (response.data?.data?.compositions) {
        //   setCompositions(response.data.data.compositions);
        // }

        if (response.data?.data?.products) {
          const products = response.data.data.products || [];
          const serviceDetails = response?.data?.data?.service?.fixedType
          setFixedTypeKey(serviceDetails);
          // Handle pagination first to ensure totalCount is always set
          const pg = response.data?.data?.pagination;
          if (pg && pg.pages) {
            setPage(pg.page || page);
            setLimit(pg.limit || limit);
            setTotalPages(Math.max(1, parseInt(pg.pages) || 1));
            setTotalCount(pg.total || products?.length || 0);
          } else {
            const totalCount = response.data?.data?.total || products?.length || 0;
            setTotalCount(totalCount);
            const calculatedPages = Math.max(1, Math.ceil(totalCount / limit));
            setTotalPages(calculatedPages);
          }

          if (!Array.isArray(products) || products.length === 0) {
            setProductsList([]);
            alphabetApiCallRef.current = false;
            setIsAlphabetApiCallInProgress(false);
            return;
          }

          const productsWithVendor = products.map((product) => {
            const firstVendor =
              (product?.vendors && product.vendors[0]) ||
              product?.vendordetails ||
              product?.vendor ||
              null;
            if (!firstVendor) return product;
            return {
              ...product,
              primaryVendor: {
                ...firstVendor,
                vendorId:
                  firstVendor.vendorId || firstVendor._id || firstVendor.id,
                name:
                  firstVendor.name ||
                  firstVendor.vendorName ||
                  firstVendor?.bussinessdetails?.name ||
                  "",
                price:
                  firstVendor.price ||
                  firstVendor.matchedVariantPrice ||
                  firstVendor.matchedPrice ||
                  firstVendor.mrp ||
                  firstVendor.sellingPrice ||
                  0,
              },
            };
          });

          setProductsList(productsWithVendor);
        }
      } catch (error) {
      } finally {
        alphabetApiCallRef.current = false;
        setIsAlphabetApiCallInProgress(false);
      }
      return;
    }

    if (data?.data?.category) {
      setCategories(data.data.category);
    }
    if (data?.data?.brands) {
      setBrands(data.data.brands);
    }
    if (data?.data?.type) {
      setTypes(data.data.type);
    }
    // if (data?.data?.complexity) {
    //   setComplexity(data.data.complexity || []);
    // }
    // if (data?.data?.gender) {
    //   setGender(data.data.gender || []);
    // }
    // if (data?.data?.samples) {
    //   setSamples(data.data.samples || []);
    // }
    // if (data?.data?.conditions) {
    //   setConditions(data.data.conditions || []);
    // }

    if (data?.data?.medicineform) {
      setMedicineForms(data.data.medicineform);
    }
    if (data?.data?.compositions) {
      setCompositions(data.data.compositions);
    }

    if (data?.data?.products) {
      const products = data.data.products || [];

      // Handle pagination if available in data parameter
      if (data?.data?.pagination) {
        const pg = data.data.pagination;
        if (pg.pages) {
          setPage(pg.page || page);
          setLimit(pg.limit || limit);
          setTotalPages(Math.max(1, parseInt(pg.pages) || 1));
          setTotalCount(pg.total || products?.length || 0);
        } else {
          const totalCount = data.data.total || products?.length || 0;
          setTotalCount(totalCount);
          const calculatedPages = Math.max(1, Math.ceil(totalCount / limit));
          setTotalPages(calculatedPages);
        }
      } else if (data?.data?.total !== undefined) {
        // If total is available but no pagination object
        setTotalCount(data.data.total || products?.length || 0);
        const calculatedPages = Math.max(1, Math.ceil((data.data.total || products?.length || 0) / limit));
        setTotalPages(calculatedPages);
      } else {
        // Fallback: set count based on products length
        setTotalCount(products?.length || 0);
        const calculatedPages = Math.max(1, Math.ceil((products?.length || 0) / limit));
        setTotalPages(calculatedPages);
      }

      if (!Array.isArray(products) || products.length === 0) {
        setProductsList([]);
        return;
      }

      const productsWithVendor = products.map((product) => {
        const firstVendor =
          product?.vendordetails ||
          (product?.vendors && product.vendors[0]) ||
          product?.vendor ||
          null;
        if (!firstVendor) return product;
        return {
          ...product,
          primaryVendor: {
            ...firstVendor,
            vendorId:
              firstVendor.vendorId || firstVendor._id || firstVendor.id,
            name:
              firstVendor.name ||
              firstVendor.vendorName ||
              firstVendor?.bussinessdetails?.name ||
              "",
            price:
              firstVendor.price ||
              firstVendor.matchedVariantPrice ||
              firstVendor.matchedPrice ||
              firstVendor.mrp ||
              firstVendor.sellingPrice ||
              0,
          },
        };
      });

      setProductsList(productsWithVendor);
    }
  };



  const getCategoryAndBrandData = async () => {
    try {
      const response = await axiosCommonInstance.get(
        `category/search/filter/?serviceType=${service}&maincatId=${maincategories || id || null}&asortby=a`,
      );
      const filterData = response.data?.data || {};
      setCategories(filterData.category || []);
      // setBrands(filterData.brands || []);
      setBrands(filterData.brands || {
        data: [],
        pagination: {},
      });
      setTypes(filterData.type || []);
      setMedicineForms(filterData.medicineform || []);
      // setCompositions(filterData.compositions || []);
      setCompositions(filterData.compositions || {
        data: [],
        pagination: {},
      });
      setAlphabetData(filterData.alpha || []);
      setComplexity(filterData.complexity || []);
      setGender(filterData.gender || []);
      setSamples(filterData.sampletypes || []);
      setConditions(filterData.conditions || []);
    } catch (error) {
      setCategories([]);
      setBrands([]);
      setTypes([]);
      setMedicineForms([]);
      setCompositions([]);
      setAlphabetData([]);
      setComplexity([]);
      setGender([]);
      setSamples([]);
      setConditions([]);
      toast.error("Error fetching category data");
    }
  };

  /** Load filter sidebar + products in parallel (faster than sequential calls). */
  const loadFiltersAndProducts = async () => {
    skipDebouncedProductsFetchRef.current = true;
    try {
      await Promise.all([getCategoryAndBrandData(), getAllData()]);
    } finally {
      skipDebouncedProductsFetchRef.current = false;
    }
  };

  useEffect(() => {
    loadFiltersAndProducts();
  }, [service, id, maincategories, userId]);

  const handleCategoryClickCheckbox = (catId) => {
    if (catId === id && id !== "all") {
      toast.info("Main category cannot be deselected");
      return;
    }
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updatedCategories = [];
    if (selectedCategories.includes(catId)) {
      updatedCategories = selectedCategories.filter((cat) => cat !== catId);
      if (id && id !== "all" && !updatedCategories.includes(id)) {
        updatedCategories.push(id);
      }
    } else {
      updatedCategories = [...selectedCategories, catId];
      if (id && id !== "all" && !updatedCategories.includes(id)) {
        updatedCategories.push(id);
      }
    }

    setPage(1);
    setSelectedCategories(updatedCategories);

    if (updatedCategories.length > 0) {
      searchParams.set("categories", updatedCategories.join(","));
    } else {
      searchParams.delete("categories");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleBrandClickCheckbox = (brandId) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updatedBrands = [];
    if (selectedBrands.includes(brandId)) {
      updatedBrands = selectedBrands.filter((brand) => brand !== brandId);
      if (id && id !== "all" && !updatedBrands.includes(id)) {
        updatedBrands.push(id);
      }
    } else {
      updatedBrands = [...selectedBrands, brandId];
      if (id && id !== "all" && !updatedBrands.includes(id)) {
        updatedBrands.push(id);
      }
    }

    setPage(1);
    setSelectedBrands(updatedBrands);

    if (updatedBrands.length > 0) {
      searchParams.set("brands", updatedBrands.join(","));
    } else {
      searchParams.delete("brands");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleCompositionClickCheckbox = (compositionId) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updatedComposiitions = [];
    if (selectedCompositions.includes(compositionId)) {
      updatedComposiitions = selectedCompositions.filter((composition) => composition !== compositionId);
      if (id && id !== "all" && !updatedComposiitions.includes(id)) {
        updatedComposiitions.push(id);
      }
    } else {
      updatedComposiitions = [...selectedCompositions, compositionId];
      if (id && id !== "all" && !updatedComposiitions.includes(id)) {
        updatedComposiitions.push(id);
      }
    }

    setPage(1);
    setSelectedCompositions(updatedComposiitions);

    if (updatedComposiitions.length > 0) {
      searchParams.set("compositions", updatedComposiitions.join(","));
    } else {
      searchParams.delete("compositions");
    }
    setSearchParams(searchParams, { replace: true });
  };


  // Price functions using utils
  const getDisplayPriceForProduct = (product) =>
    getDisplayPrice(product, selectedVariants);

  const getVendorPriceForProduct = (vendor, tablet) =>
    getVendorPrice(vendor, tablet, selectedVariants);

  // Initialize URL parameters on component mount only
  useEffect(() => {
    const urlCats = searchParams.get("categories");
    const urlBrands = searchParams.get("brands");
    const urlTypes = searchParams.get("types");
    const urlForms = searchParams.get("forms");
    const urlCompositions = searchParams.get("compositions");

    if (urlCats) {
      const urlCategories = urlCats.split(",");
      setSelectedCategories(urlCategories);
      if (urlCategories.length > 0) {
        setDefaultCategoryFromUrl(urlCategories[0]);
      }
    } else if (id && id !== "all") {
      setSelectedCategories([id]);
      setDefaultCategoryFromUrl(id);
    } else if (maincategories) {
      setSelectedCategories([maincategories]);
      setDefaultCategoryFromUrl(maincategories);
    }

    if (urlBrands) {
      setSelectedBrands(urlBrands.split(","));
    }
    if (urlTypes) {
      setSelectedTypes(urlTypes.split(","));
    }
    if (urlForms) {
      setSelectedForms(urlForms.split(","));
    }
    if (urlCompositions) {
      setSelectedCompositions(urlCompositions.split(","));
    }
    const urlComplexity = searchParams.get("complexity");
    if (urlComplexity) {
      setSelectedComplexity(urlComplexity.split(","));
    }
    const urlGender = searchParams.get("gender");
    if (urlGender) {
      setSelectedGender(urlGender.split(","));
    }
    const urlSamples = searchParams.get("samples");
    if (urlSamples) {
      setSelectedSamples(urlSamples.split(","));
    }
    const urlConditions = searchParams.get("conditions");
    if (urlConditions) {
      setSelectedConditions(urlConditions.split(","));
    }
  }, []); // Empty dependency array - run only once on mount

  const handleSelectVariant = async (variantId, tablet) => {
    const token = localStorage.getItem("medicomparestoken");
    const previousVariantId = selectedVariants[tablet._id];

    if (previousVariantId === variantId) return;

    setSelectedVariants((prev) => ({
      ...prev,
      [tablet._id]: variantId,
    }));

    setSelectedVendors((prev) => {
      const newState = { ...prev };
      delete newState[tablet._id];
      return newState;
    });

    const cart = getCart();
    const updatedCart = cart.filter((item) => item.tabletId !== tablet._id);
    saveCart(updatedCart);

    if (token) {
      const cartItemsToRemove = cart.filter(
        (item) => item.tabletId === tablet._id,
      );
      for (const item of cartItemsToRemove) {
        try {
          await syncCartUpdate("delete", tablet._id, item.vendorId, "cart");
        } catch (err) {
          // Error removing cart item from server
        }
      }
    }

    // Update cart quantities when variant changes
    setCartQuantities((prev) => {
      const newState = { ...prev };
      const cartItems = cart.filter((item) => item.tabletId === tablet._id);
      cartItems.forEach((item) => {
        if (item.vendorId && item.variantId) {
          const key = `${item.vendorId}_${item.variantId}`;
          delete newState[key];
        }
      });
      if (previousVariantId) {
        Object.keys(newState).forEach((key) => {
          if (key.endsWith(`_${previousVariantId}`)) {
            delete newState[key];
          }
        });
      }
      return newState;
    });

    // Dispatch event to update cart across components
    window.dispatchEvent(new Event("cartUpdated"));
  };

  const handleToggleFavourite = async (itemId) => {
    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to manage favourites");
      navigate("/login");
      return;
    }

    const item = productsList.find((p) => p?.tablet?._id === itemId);
    if (!item) return;

    const newStatus = !item?.tablet?.isFavorite;

    setProductsList((prev) =>
      prev.map((p) =>
        p?.tablet?._id === itemId
          ? { ...p, tablet: { ...p.tablet, isFavorite: newStatus } }
          : p,
      ),
    );

    try {
      const endpoint = newStatus ? "favourite/add" : "favourite/remove";
      await axiosUserInstance.post(
        endpoint,
        { itemId },
        { headers: { Authorization: `Bearer ${token}` } },
      );
    } catch (error) {
      setProductsList((prev) =>
        prev.map((p) => {
          if (p?.tablet?._id === itemId) {
            return {
              ...p,
              tablet: { ...p.tablet, isFavorite: item?.tablet?.isFavorite },
            };
          }
          return p;
        }),
      );
      toast.error(error.response?.data?.message || "Something went wrong");
    }
  };

  // Use global addToCart hook
  const handleAddToCart = async (tablet, vendor) => {
    const variantId = selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
    if (!variantId) return;

    const matchedVendorVariant = vendor?.variant?.find(
      (v) => v.variantId === variantId,
    );
    const inStock = !!(
      matchedVendorVariant &&
      matchedVendorVariant.isStock &&
      (matchedVendorVariant.stock ?? 0) > 0
    );
    if (!inStock) {
      toast.error("Item is out of stock");
      return;
    }

    setSelectedVendors((prev) => ({
      ...prev,
      [tablet._id]: vendor._id,
    }));

    const selectedVariant = tablet.variant?.find((v) => v._id === variantId);

    // Prepare item for global addToCart hook
    const item = {
      tabletdetails: tablet,
      vendordetails: vendor?.bussinessdetails || vendor,
      variants: tablet.variant,
      price: matchedVendorVariant?.price || tablet.price || 0,
    };

    // Use global addToCart hook
    await addToCart(item, selectedVariant, {
      bookingType: "cart",
      type: "normal",
    });
  };

  const handleTypeClickCheckbox = (value) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updatedTypes = [];
    if (selectedTypes.includes(value)) {
      updatedTypes = selectedTypes.filter((t) => t !== value);
    } else {
      updatedTypes = [...selectedTypes, value];
    }

    setPage(1);
    setSelectedTypes(updatedTypes);

    if (updatedTypes.length > 0) {
      searchParams.set("types", updatedTypes.join(","));
    } else {
      searchParams.delete("types");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleFormClickCheckbox = (value) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updatedForms = [];
    if (selectedForms.includes(value)) {
      updatedForms = selectedForms.filter((f) => f !== value);
    } else {
      updatedForms = [...selectedForms, value];
    }

    setPage(1);
    setSelectedForms(updatedForms);

    if (updatedForms.length > 0) {
      searchParams.set("forms", updatedForms.join(","));
    } else {
      searchParams.delete("forms");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleComplexityClickCheckbox = (value) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updated = [];
    if (selectedComplexity.includes(value)) {
      updated = selectedComplexity.filter((v) => v !== value);
    } else {
      updated = [...selectedComplexity, value];
    }

    setPage(1);
    setSelectedComplexity(updated);

    if (updated.length > 0) {
      searchParams.set("complexity", updated.join(","));
    } else {
      searchParams.delete("complexity");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleGenderClickCheckbox = (value) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updated = [];
    if (selectedGender.includes(value)) {
      updated = selectedGender.filter((v) => v !== value);
    } else {
      updated = [...selectedGender, value];
    }

    setPage(1);
    setSelectedGender(updated);

    if (updated.length > 0) {
      searchParams.set("gender", updated.join(","));
    } else {
      searchParams.delete("gender");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleSampleClickCheckbox = (value) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updated = [];
    if (selectedSamples.includes(value)) {
      updated = selectedSamples.filter((v) => v !== value);
    } else {
      updated = [...selectedSamples, value];
    }

    setPage(1);
    setSelectedSamples(updated);

    if (updated.length > 0) {
      searchParams.set("samples", updated.join(","));
    } else {
      searchParams.delete("samples");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleConditionClickCheckbox = (value) => {
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    let updated = [];
    if (selectedConditions.includes(value)) {
      updated = selectedConditions.filter((v) => v !== value);
    } else {
      updated = [...selectedConditions, value];
    }

    setPage(1);
    setSelectedConditions(updated);

    if (updated.length > 0) {
      searchParams.set("conditions", updated.join(","));
    } else {
      searchParams.delete("conditions");
    }
    setSearchParams(searchParams, { replace: true });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLeadFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const toggleModal = () => {
    setShowModal(!showModal);
    if (!showModal) {
      setLeadFormData({
        date: "",
        name: "",
        mobile: "",
        policyNumber: "",
        relation: "",
        address: "",
      });
      setCurrentLeadData(null);
    }
  };

  const handleClearFilters = () => {
    let defaultCategoryToPreserve = null;

    if (defaultCategoryFromUrl) {
      defaultCategoryToPreserve = defaultCategoryFromUrl;
    } else if (id && id !== "all") {
      defaultCategoryToPreserve = id;
    }

    if (defaultCategoryToPreserve) {
      setSelectedCategories([defaultCategoryToPreserve]);
    } else {
      setSelectedCategories([]);
    }

    // Reset other filters
    setSearchTerm("");
    setIsAlphabetFilterActive(false);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;
    setPriceRange(defaultPriceRange);
    setSelectedVariants({});
    setSelectedVendors({});
    setSelectedBrands([]);
    setSelectedCompositions([]);
    setSelectedTypes([]);
    setSelectedForms([]);
    setSelectedComplexity([]);
    setSelectedGender([]);
    setSelectedSamples([]);
    setSelectedConditions([]);
    // Reset alphabet filter
    setIsAlphabetFilterActive(false);
    // setActiveAlphabetLetter(null);
    setActiveAlphabetLetter(null);
    alphabetApiCallRef.current = false;


    // Clear search params
    const params = new URLSearchParams();
    if (defaultCategoryToPreserve) {
      params.set("categories", defaultCategoryToPreserve);
    }
    setSearchParams(params, { replace: true });

    // Reset to page 1
    setPage(1);
  };

  const onClearFilters = { handleClearFilters };
  // onClearFilters = { handleClearFilters }

  const handleAddLead = async (vendor, tablet) => {
    if (!token) {
      toast.error("Please login");
      navigate("/login");
      return;
    }

    const variantId = selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
    const selectedVariant = tablet.variant?.find((v) => v._id === variantId);
    const matchedVendorVariant = vendor?.variant?.find(
      (v) => v.variantId === variantId || v._id === variantId,
    );

    setCurrentLeadData({
      vendor,
      tablet,
      variantId,
      matchedVariant: matchedVendorVariant,
      selectedVariant,
    });

    if (userProfile) {
      setLeadFormData({
        date: new Date().toISOString().split("T")[0],
        name:
          `${userProfile.first_name || ""} ${userProfile.last_name || ""
            }`.trim() || "",
        mobile: userProfile.phone || "",
        policyNumber: "",
        relation: "self",
        address: "",
      });
    } else {
      setLeadFormData({
        date: new Date().toISOString().split("T")[0],
        name: "",
        mobile: "",
        policyNumber: "",
        relation: "self",
        address: "",
      });
    }

    setShowModal(true);
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();

    if (!currentLeadData || !currentLeadData.tablet) return;

    const { vendor, tablet, variantId } = currentLeadData;

    try {
      const leadPayload = {
        name: leadFormData.name,
        email: leadFormData.email || "",
        phone: leadFormData.mobile,
        address: leadFormData.address,
        policyNumber: leadFormData.policyNumber,
        relation: leadFormData.relation,
        productId: tablet._id,
        vendorId: vendor._id,
        variantId: variantId,
        leadSource: "Website",
        leadStage: "New",
        status: "active",
      };

      if (!token) {
        toast.error("Please login");
        navigate("/login");
        setShowModal(false);
        return;
      }

      await axiosUserInstance.post("lead/create", leadPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("Lead added successfully!");
      setShowModal(false);
      setLeadFormData({
        date: "",
        name: "",
        mobile: "",
        policyNumber: "",
        relation: "",
        address: "",
      });
      setCurrentLeadData(null);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to add lead",
      );
    }
  };

  const handleBooking = async (vendor, tablet, servicePassed) => {
    const variantId =
      selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
    await handleGeneralBookingProcess({
      productId: tablet._id,
      variantId,
      vendorId: vendor._id,
      servicefixedTypes: servicePassed || fixedType || fixedTypeKey || service,
      navigate,
    });
  };

  const handleRide = async (vendor, tablet) => {
    if (!token) {
      toast.error("Please login to add ride");
      navigate("/login");
      return;
    }

    const variantId = selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
    const matchedVendorVariant = vendor?.variant?.find(
      (v) => v.variantId === variantId,
    );

    const newItem = {
      cartKey: `${vendor._id}_${variantId}`,
      id: tablet._id || "",
      name: tablet.name || "",
      slug: tablet.slug || "",
      price: matchedVendorVariant?.price || tablet.price || 0,
      quantity: 1,
      vendorId: vendor._id,
      vendorName: vendor?.bussinessdetails?.name || "",
      productId: tablet._id,
      variantId: variantId,
      bookingType: "ride",
      type: "normal",
      packageId: null,
    };

    try {
      toast.success("Added to ride");
    } catch (err) {
      toast.error("Failed to add ride");
    }
  };



  // Update userId when userProfile changes
  useEffect(() => {
    if (userProfile) {
      setUserId(userProfile._id);
    } else {
      setUserId(null);
    }
  }, [userProfile]);

  // Use global cart hooks for increment
  const increaseQty = async (tabletId, vendorId) => {
    const product = productsList.find((p) => p.tablet._id === tabletId);
    if (!product) return;

    const selectedVariantId =
      selectedVariants[tabletId] || product?.tablet?.variant?.[0]?._id;
    const vendor = product?.vendors?.find((v) => v._id === vendorId);
    if (!vendor) return;

    const matchedVendorVariant = vendor?.variant?.find(
      (v) => v.variantId === selectedVariantId || v._id === selectedVariantId,
    );
    const maxStock =
      matchedVendorVariant && matchedVendorVariant.isStock
        ? (matchedVendorVariant.stock ?? 0)
        : 999;

    const token = localStorage.getItem("medicomparestoken");
    const key = `${vendorId}_${selectedVariantId}`;

    if (!token) {
      // Guest user - use localStorage
      const cart = getCart();
      const cartItem = cart.find(
        (i) =>
          i.tabletId === tabletId &&
          i.vendorId === vendorId &&
          i.variantId === selectedVariantId,
      );

      if (cartItem) {
        if (maxStock > 0 && cartItem.quantity >= maxStock) {
          toast.error("Maximum stock reached");
          return;
        }
        cartItem.quantity = Math.min((cartItem.quantity || 0) + 1, maxStock);
      } else {
        // If not in cart, add it using global hook
        const item = {
          tabletdetails: product.tablet,
          vendordetails: vendor?.bussinessdetails || vendor,
          variants: product.tablet.variant,
        };
        const variant = product.tablet.variant?.find(
          (v) => v._id === selectedVariantId,
        );
        await addToCart(item, variant, { bookingType: "cart", type: "normal" });
        return;
      }

      saveCart(cart);
      setCartQuantities((prev) => ({ ...prev, [key]: cartItem.quantity }));
      toast.success("Quantity updated!");
    } else {
      // Logged-in user - use server sync
      try {
        const currentQty = await getServerCartQuantity(tabletId, vendorId);
        const nextQty = Math.min((currentQty || 0) + 1, maxStock);

        if (currentQty >= maxStock) {
          toast.error("Maximum stock reached");
          return;
        }

        await syncCartUpdate("increment", tabletId, vendorId, "cart");
        setCartQuantities((prev) => ({ ...prev, [key]: nextQty }));
        toast.success("Quantity updated!");
      } catch (err) {
        toast.error("Failed to update quantity");
      }
    }
  };

  // Use global cart hooks for decrement
  const decreaseQty = async (tabletId, vendorId) => {
    const product = productsList.find((p) => p.tablet._id === tabletId);
    if (!product) return;

    const selectedVariantId =
      selectedVariants[tabletId] || product?.tablet?.variant?.[0]?._id;
    const key = `${vendorId}_${selectedVariantId}`;

    const token = localStorage.getItem("medicomparestoken");

    if (!token) {
      // Guest user - use localStorage
      const cart = getCart();
      const cartItem = cart.find(
        (i) =>
          i.tabletId === tabletId &&
          i.vendorId === vendorId &&
          i.variantId === selectedVariantId,
      );

      if (!cartItem) return;

      if (cartItem.quantity > 1) {
        cartItem.quantity -= 1;
        saveCart(cart);
        setCartQuantities((prev) => ({ ...prev, [key]: cartItem.quantity }));
        toast.success("Quantity updated!");
      } else {
        // Remove from cart if quantity becomes 0
        const updatedCart = cart.filter(
          (i) =>
            !(
              i.tabletId === tabletId &&
              i.vendorId === vendorId &&
              i.variantId === selectedVariantId
            ),
        );
        saveCart(updatedCart);
        setCartQuantities((prev) => {
          const newState = { ...prev };
          delete newState[key];
          return newState;
        });
        toast.success("Item removed from cart");
      }
    } else {
      // Logged-in user - use server sync
      try {
        const currentQty = await getServerCartQuantity(tabletId, vendorId);
        const nextQty = Math.max((currentQty || 0) - 1, 0);

        if (nextQty > 0) {
          await syncCartUpdate("decrement", tabletId, vendorId, "cart");
        } else {
          await syncCartUpdate("delete", tabletId, vendorId, "cart");
        }

        setCartQuantities((prev) => {
          const newState = { ...prev };
          if (nextQty <= 0) {
            delete newState[key];
          } else {
            newState[key] = nextQty;
          }
          return newState;
        });
        toast.success("Quantity updated!");
      } catch (err) {
        toast.error("Failed to update quantity");
      }
    }
  };

  const getQuantityForVariant = (tablet, vendor) => {
    if (!vendor) return 0;
    const variantId = selectedVariants[tablet._id] || tablet.variant?.[0]?._id;
    return getCartQuantity(vendor._id, tablet._id, variantId);
  };

  useEffect(() => {
    const newDefaultRange = getDefaultPriceRange(service);
    setPriceRange(newDefaultRange);
    setAvailablePriceRange(newDefaultRange);
  }, [id, service]);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (alphabetApiCallRef.current || skipDebouncedProductsFetchRef.current) {
      return;
    }

    debounceRef.current = setTimeout(() => {
      getAllData(page);
    }, 100);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [
    selectedCategories,
    selectedBrands,
    selectedTypes,
    selectedForms,
    selectedCompositions,
    selectedComplexity,
    selectedGender,
    selectedSamples,
    selectedConditions,
    page,
    activeTab,
    isAlphabetFilterActive,
    selectedPincode,
    latitude,
    longitude,
    searchTerm,
    sortOption
  ]);


  useEffect(() => {
    const currentParams = new URLSearchParams(window.location.search);
    const currentPageInUrl = currentParams.get('page');
    const targetPageStr = page > 1 ? page.toString() : null;

    if (currentPageInUrl !== targetPageStr) {
      if (targetPageStr) {
        currentParams.set('page', targetPageStr);
      } else {
        currentParams.delete('page');
      }
      setSearchParams(currentParams, { replace: true });
    }
  }, [page, setSearchParams]);

  const filteredProducts = useMemo(() => {
    let products = productsList.filter((product) => {

      let matchesPrice = true;
      const isDefaultRange =
        priceRange[0] === defaultPriceRange[0] &&
        priceRange[1] === defaultPriceRange[1];
      if (isDefaultRange) {
        matchesPrice = true;
      } else {
        const vendors = product?.vendors || [];

        if (vendors.length > 0) {
          let hasPriceInRange = false;
          let hasAnyValidPrice = false;

          for (const vendor of vendors) {
            const vendorPrice = getVendorPrice(
              vendor,
              product.tablet,
              selectedVariants,
            );
            if (
              typeof vendorPrice === "number" &&
              !isNaN(vendorPrice) &&
              vendorPrice > 0
            ) {
              hasAnyValidPrice = true;
              if (
                vendorPrice >= priceRange[0] &&
                vendorPrice <= priceRange[1]
              ) {
                hasPriceInRange = true;
                break; // Found a vendor with price in range, include this product
              }
            }
          }
          matchesPrice = hasPriceInRange || !hasAnyValidPrice;
        } else {
          const productPrice = getDisplayPrice(product, selectedVariants);
          if (
            typeof productPrice === "number" &&
            !isNaN(productPrice) &&
            productPrice > 0
          ) {
            matchesPrice =
              productPrice >= priceRange[0] && productPrice <= priceRange[1];
          } else {
            matchesPrice = true;
          }
        }
      }

      return matchesPrice;
    });

    if (sortOption && products.length > 0) {
      const sortedProducts = [...products]; // Create a copy to avoid mutating original

      switch (sortOption) {
        case "price_low":
          sortedProducts.sort((a, b) => {
            const priceA = getDisplayPrice(a, selectedVariants) || 0;
            const priceB = getDisplayPrice(b, selectedVariants) || 0;
            return priceA - priceB; // Low to High
          });
          break;

        case "price_high":
          sortedProducts.sort((a, b) => {
            const priceA = getDisplayPrice(a, selectedVariants) || 0;
            const priceB = getDisplayPrice(b, selectedVariants) || 0;
            return priceB - priceA; // High to Low
          });
          break;

        case "newest":
          sortedProducts.sort((a, b) => {
            const dateA = new Date(a?.tablet?.createdAt || a?.createdAt || 0);
            const dateB = new Date(b?.tablet?.createdAt || b?.createdAt || 0);
            return dateB - dateA;
          });
          break;

        case "popularity":
          sortedProducts.sort((a, b) => {
            const ratingA = a?.tablet?.rating || a?.rating || 0;
            const ratingB = b?.tablet?.rating || b?.rating || 0;
            const reviewsA = a?.tablet?.reviewsCount || a?.reviewsCount || 0;
            const reviewsB = b?.tablet?.reviewsCount || b?.reviewsCount || 0;
            if (ratingB !== ratingA) {
              return ratingB - ratingA;
            }
            return reviewsB - reviewsA;
          });
          break;

        default:
          break;
      }

      return sortedProducts;
    }

    return products;
  }, [productsList, sortOption, selectedVariants, priceRange]);

  const currentCategory = categories?.data?.find((cat) => cat._id === id) || {
    name: "Products",
  };
  const categoryName =
    currentCategory.name ||
    service?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) ||
    "Products";

  const tabs = [
    { id: "best-match", label: "Best Match", defaultSelected: true },
    { id: "newest", label: "Newest", defaultSelected: false },
    { id: "top-rated", label: "Top Rated", defaultSelected: false },
    // { id: "cheapest-price", label: "Cheapest Price", defaultSelected: false },
    // { id: "bestprice", label: "Best Price", defaultSelected: false },
  ];

  return (
    <>
      <Home2Header />
      <CategoryProvider />
      <div className="py-6 md:py-12 bg-gradient-to-br from-[#f8f9fa] to-white min-h-screen">
        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 mb-4 md:mb-6">
          <SearchInput
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsAlphabetFilterActive(false);
              setActiveAlphabetLetter(null);
              alphabetApiCallRef.current = false;
            }}
            placeholder={placeholderText(service)}
            onClear={() => {
              setSearchTerm("");
              setIsAlphabetFilterActive(false);
              setActiveAlphabetLetter(null);
              alphabetApiCallRef.current = false;
            }}
          />
        </div>

        <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
          {isFilterDrawerOpen && (
            <div
              className="lg:hidden fixed inset-0 bg-black/50 z-[9999] transition-opacity duration-300"
              onClick={() => setIsFilterDrawerOpen(false)}
            ></div>
          )}

          <div className={`lg:hidden flex flex-col fixed top-0 left-0 w-3/4 max-w-[320px] h-full bg-white z-[9999] shadow-[2px_0_10px_rgba(0,0,0,0.1)] overflow-hidden transition-transform duration-300 ${isFilterDrawerOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="flex items-center justify-between p-[12px_14px] border-b border-[#e0e0e0] bg-primary shrink-0 min-h-[48px] sticky top-0 z-[9999]">
              <h4 className="!text-base !font-semibold m-0 text-white">Filters</h4>
              <button
                className="w-8 h-8 !rounded-full border border-white/30 bg-white/15 text-white flex items-center justify-center cursor-pointer text-[13px] transition-all duration-150 hover:bg-white/28"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-0 min-h-0 pb-[100px]">
              <FilterSidebar
                categories={categories}
                brands={brands}
                types={types}
                compositions={compositions}
                medicineForms={medicineForms}
                productsList={productsList}
                filteredProducts={filteredProducts}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                selectedTypes={selectedTypes}
                selectedForms={selectedForms}
                selectedCompositions={selectedCompositions}
                onCompositionToggle={handleCompositionClickCheckbox}
                onCategoryToggle={handleCategoryClickCheckbox}
                onBrandToggle={handleBrandClickCheckbox}
                onTypeToggle={handleTypeClickCheckbox}
                onFormToggle={handleFormClickCheckbox}
                selectedComplexity={selectedComplexity}
                onComplexityToggle={handleComplexityClickCheckbox}
                genderData={gender}
                samplesData={samples}
                selectedGender={selectedGender}
                onGenderToggle={handleGenderClickCheckbox}
                selectedSamples={selectedSamples}
                onSampleToggle={handleSampleClickCheckbox}
                conditionsData={conditions}
                selectedConditions={selectedConditions}
                onConditionToggle={handleConditionClickCheckbox}
                // selectedComplexity={selectedComplexity}
                // onComplexityToggle={handleComplexityClickCheckbox}
                onClearFilters={handleClearFilters}
                defaultCategoryId={id}
                priceRange={priceRange}
                availablePriceRange={availablePriceRange}
                onPriceRangeChange={setPriceRange}
                filteredProductsCount={filteredProducts.length}
                totalProductsCount={productsList.length}
                onApplyFilters={() => setIsFilterDrawerOpen(false)}
                searchTerm={searchTerm}
                service={fixedTypeKey}
                maincatId={maincategories || id || null}
                onAlphabetClick={handleAlphabetClick}
                alphabetData={alphabetData}
                complexityData={complexity}
                activeAlphabetLetter={activeAlphabetLetter}
                userId={userId}

                loadMoreBrands={loadMoreBrands}
                brandLoading={brandLoading}

                loadMoreCompositions={loadMoreCompositions}
                compositionLoading={compositionLoading}

                loadMoreCategories={loadMoreCategories}
                categoryLoading={categoryLoading}
              />
            </div>
            {/* Footer buttons outside scrollable content */}
            <div className="flex gap-[6px] p-[10px_12px] border-t border-[#e0e0e0] bg-white shrink-0 shadow-[0_-2px_10px_rgba(0,0,0,0.1)] sticky bottom-0 z-[9999]">
              <button
                className="flex-1 p-[8px_10px] !bg-primary !rounded-lg text-[12px] font-[500] cursor-pointer border-none flex items-center justify-center min-h-[36px] !text-white"
                onClick={() => {
                  handleClearFilters();
                  setIsFilterDrawerOpen(false);
                }}
              >
                Clear All
              </button>
              {/* <button
                className="filter-apply-btn-mobile"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                Apply Filters
              </button> */}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Desktop Filter Sidebar */}
            <div
              className={`hidden lg:block lg:col-span-1 mb-4 lg:mb-0 transition-all duration-300 ${isDesktopSidebarOpen ? "" : "!hidden"}`}
            >
              <FilterSidebar
                categories={categories}
                brands={brands}
                types={types}
                compositions={compositions}
                medicineForms={medicineForms}
                productsList={productsList}
                filteredProducts={filteredProducts}
                selectedCategories={selectedCategories}
                selectedBrands={selectedBrands}
                selectedTypes={selectedTypes}
                selectedForms={selectedForms}
                selectedCompositions={selectedCompositions}
                onCompositionToggle={handleCompositionClickCheckbox}
                onCategoryToggle={handleCategoryClickCheckbox}
                onBrandToggle={handleBrandClickCheckbox}
                onTypeToggle={handleTypeClickCheckbox}
                onFormToggle={handleFormClickCheckbox}
                onClearFilters={handleClearFilters}
                genderData={gender}
                selectedGender={selectedGender}
                samplesData={samples}
                onGenderToggle={handleGenderClickCheckbox}
                selectedSamples={selectedSamples}
                onSampleToggle={handleSampleClickCheckbox}
                conditionsData={conditions}
                selectedConditions={selectedConditions}
                onConditionToggle={handleConditionClickCheckbox}
                selectedComplexity={selectedComplexity}
                onComplexityToggle={handleComplexityClickCheckbox}
                defaultCategoryId={id}
                priceRange={priceRange}
                availablePriceRange={availablePriceRange}
                onPriceRangeChange={setPriceRange}
                filteredProductsCount={filteredProducts.length}
                totalProductsCount={productsList.length}
                searchTerm={searchTerm}
                service={fixedTypeKey}
                isDesktopSidebarOpen={isDesktopSidebarOpen}
                toggleSidebar={() =>
                  setIsDesktopSidebarOpen(!isDesktopSidebarOpen)
                }
                maincatId={maincategories || id || null}
                onAlphabetClick={handleAlphabetClick}
                alphabetData={alphabetData}
                complexityData={complexity}
                activeAlphabetLetter={activeAlphabetLetter}
                userId={userId}
                loadMoreBrands={loadMoreBrands}
                brandLoading={brandLoading}
                loadMoreCompositions={loadMoreCompositions}
                compositionLoading={compositionLoading}
                loadMoreCategories={loadMoreCategories}
                categoryLoading={categoryLoading}
              />
            </div>

            <div
              className={
                isDesktopSidebarOpen ? "lg:col-span-3 col-span-1" : "lg:col-span-4 col-span-1"
              }
            >
              <div className="hidden lg:flex w-full mb-5">
                <div className="flex items-center justify-between flex-wrap gap-3 w-full">
                  {!isDesktopSidebarOpen && (
                    <button
                      className="flex items-center gap-2 p-[4px_8px] !bg-[#321961] text-white border-none !rounded-lg !text-[14px] !font-[500] cursor-pointer transition-all duration-200 shrink-0 hover:bg-[#6b25e6] hover:-translate-y-px hover:shadow-[0_4px_8px_rgba(125,46,255,0.3)]"
                      onClick={() => setIsDesktopSidebarOpen(true)}
                    >
                      <i className="fas fa-filter"></i>
                      <span>Show Filters</span>
                    </button>
                  )}

                  <div className="hidden lg:flex flex-1 justify-end items-center gap-3 min-w-0">
                    {/* {isDesktopSidebarOpen && (
                    <ViewToggleButtons
                      isFull={isFull}
                      onToggle={setIsFull}
                      className=""
                      style={{ flexShrink: 0 }}
                    />
                  )} */}
                    <div
                      style={{
                        flex: 1,
                        display: "flex",
                        border: "1px solid #e0e0e0",
                        borderRadius: "6px",
                        overflow: "hidden",
                        height: "31px",
                        maxWidth: "60%",
                      }}
                    >
                      {tabs.map((tab) => (
                        <div
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                          }}
                          style={{
                            fontSize: "12px",
                            fontWeight: "500",
                            color: activeTab === tab.id ? "#ffffff" : "#321961",
                            backgroundColor:
                              activeTab === tab.id ? "#321961" : "transparent",
                            padding: "4px 12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            flex: 1,
                            whiteSpace: "nowrap",
                            transition: "all 0.2s ease",
                            borderRight:
                              tab.id !== tabs[tabs.length - 1].id
                                ? "1px solid #e0e0e0"
                                : "none",
                          }}
                        >
                          {tab.label}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div
                className="hidden lg:flex justify-start items-center gap-5 mb-2.5"
              >
                <div
                  className="text-sm font-semibold text-gray-900"
                >
                  Total {totalCount || 0}{" "}
                  {(totalCount || 0) === 1 ? "Item" : "Items"}
                </div>
                <SortSelect
                  style={{
                    width: "auto",
                    minWidth: "120px",
                    maxWidth: "180px",
                    flexShrink: 0,
                  }}
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                // onChange={(e) => handleSortOptionChange(e.target.value)}
                />

                {searchTerm && searchTerm.trim() && (
                  <div
                    className="flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-100 rounded-md text-xs text-gray-700 font-medium shrink-0"
                  >
                    <span>Search:</span>
                    <span className="text-[#321961] font-semibold">
                      "{searchTerm}"
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        setIsAlphabetFilterActive(false);
                        setActiveAlphabetLetter(null);
                        alphabetApiCallRef.current = false;
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        color: "#666",
                        cursor: "pointer",
                        padding: "0 4px",
                        fontSize: "14px",
                        lineHeight: "1",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      title="Clear search"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* {(selectedCategories.length > 1 ||
                  searchTerm.trim().length > 0) && ( */}
                {/* <button
                  type="button"
                  onClick={handleClearFilters}
                  style={{
                    border: "none",
                    color: "#000",
                    fontSize: "12px",
                    borderRadius: "6px",
                    fontWeight: "500",
                    flexShrink: 0,
                    lineHeight: "30px",
                    backgroundColor: "transparent",
                  }}
                >
                  <u>Clear All</u>
                </button> */}
                {/* )} */}
              </div>

              <ProductsSection
                filteredProducts={filteredProducts}
                isLoading={isLoading}
                isSkeletonLoading={isAlphabetApiCallInProgress}
                isFull={isFull}
                setIsFull={setIsFull}
                categoryName={categoryName}
                selectedVariants={selectedVariants}
                expandedVendors={expandedVendors}
                isSidebarOpen={isDesktopSidebarOpen}
                // containerStyles={{}}
                rentAndCartButtonStyles={{
                  fontSize: "10px",
                  padding: "3px 5px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  minWidth: "90px", width: "100%"
                }}
                contailerStyles={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0px 5px",
                  minWidth: "100px",
                  width: "100%",
                  gap: "3px"
                }}
                individualStyleForCart={{
                  display: "flex",
                  flexDirection: "flex flex-wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "2px 10px",
                  minWidth: "100px",
                  width: "100%",
                  gap: "4px",
                  borderRadius: "50px",
                  border: "1px solid #321961",
                  background: "#fdfaff",
                  boxShadow: "0 2px 5px rgba(125, 46, 255, 0.1)"
                }}
                onToggleExpand={(productId) => {
                  const isCurrentlyExpanded = expandedVendors[productId];
                  setExpandedVendors((prev) => ({
                    ...prev,
                    [productId]: !isCurrentlyExpanded,
                  }));
                }}
                onToggleFavourite={handleToggleFavourite}
                onShare={(product) => {
                  setShareProductData(product);
                  setShowShareModal(true);
                }}
                onVendorAction={(action, vendor, tablet, bookingType, servicePassed) => {
                  if (action === "lead") handleAddLead(vendor, tablet);
                  else if (action === "booking") handleBooking(vendor, tablet, servicePassed);
                  else if (action === "ride") handleRide(vendor, tablet);
                  else if (action === "add") handleAddToCart(tablet, vendor);
                  else if (action === "increase")
                    increaseQty(tablet._id, vendor._id);
                  else if (action === "decrease")
                    decreaseQty(tablet._id, vendor._id);
                }}
                getDisplayPrice={getDisplayPriceForProduct}
                getVendorPrice={getVendorPriceForProduct}
                getQuantityForVariant={getQuantityForVariant}
                selectedVendors={selectedVendors}
                service={fixedTypeKey}
                id={id}
                navigate={navigate}
                page={page}
                totalPages={totalPages}
                priceRange={priceRange}
                onPageChange={(p) => {
                  setPage(p);
                  getAllData(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                onSelectVariant={handleSelectVariant}
                onOpenFilterDrawer={() => setIsFilterDrawerOpen(true)}
                sortOption={sortOption}
                onSortChange={(e) => setSortOption(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />

      <LeadModal
        show={showModal}
        onClose={toggleModal}
        formData={leadFormData}
        onChange={handleChange}
        onSubmit={handleSubmitLead}
      />

      <ShareModal
        show={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareProductData(null);
        }}
        shareData={
          shareProductData
            ? {
              name: shareProductData.tablet?.name || shareProductData.name,
              price: (() => {
                const tablet = shareProductData.tablet || shareProductData;
                const vId = selectedVariants[tablet._id];
                const variant = tablet.variant?.find((v) => v._id === vId) || tablet.variants?.find((v) => v._id === vId);
                let p = variant?.discountprice || variant?.discountPrice || variant?.price || tablet.discountprice || tablet.discountPrice || tablet.price || 0;
                if (!p || p === 0) {
                  const firstVendor = shareProductData.vendors?.[0] || tablet.vendors?.[0];
                  if (firstVendor) {
                    const matched = firstVendor.variant?.find((v) => v.variantId === vId || v._id === vId);
                    p = matched?.discountprice || matched?.discountPrice || matched?.price || firstVendor.discountprice || firstVendor.discountPrice || firstVendor.price || 0;
                  }
                }
                return p || 0;
              })(),
              link: getShareUrl(shareProductData),
              serviceType: fixedTypeKey
            }
            : null
        }
      />
    </>
  );
};

export default ProductsData;

