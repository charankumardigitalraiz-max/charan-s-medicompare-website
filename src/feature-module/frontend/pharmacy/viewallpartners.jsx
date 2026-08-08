import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useParams, Link } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import { axiosCommonInstance, axiosInstance } from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";
import breadcrumbBg from "/assets/Medicompares Background.png";
import doctors from "/assets/doctors.png";
import toast from "react-hot-toast";
import Pagination from "../../../components/ui/Pagination.jsx";
import BackButton from "../../../components/ui/BackButton.jsx";

const ViewAllPartners = () => {
  const navigate = useNavigate();
  const { service } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedServices, setSelectedServices] = useState(() => {
    const servicesParam = searchParams.get("services");
    return servicesParam ? servicesParam.split(",").filter(Boolean) : [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(() => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  });
  const [totalPages, setTotalPages] = useState(1);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const itemsPerPage = 12;

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        limit: itemsPerPage,
      };
      if (selectedServices.length > 0) {
        params.services = selectedServices.join(",");
      }

      const response = await axiosCommonInstance.get("vendor/list", { params });
      const data = response.data?.data || {};
      setPartners(data.vendors || []);

      if (data.pagination) {
        const pag = data.pagination;
        setCurrentPage(pag.page || 1);
        setTotalPages(pag.totalPages || 1);
      }
    } catch (error) {
      toast.error("Vendor API error:", error);
      setPartners([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axiosInstance.get("categorylist");
      const { categories } = response.data?.data || {};
      setCategories(Array.isArray(categories) ? categories : []);
    } catch (err) {
      toast.error("Failed to load categories");
    }
  };

  useEffect(() => {
    if (service === "undefined") {
      navigate("/partners", { replace: true });
      return;
    }
    fetchCategories();
  }, [service, navigate]);

  useEffect(() => {
    fetchVendors();
  }, [currentPage, selectedServices]);

  useEffect(() => {
    const servicesFromUrl = searchParams.get("services")?.split(",").filter(Boolean) || [];
    const pageFromUrl = parseInt(searchParams.get("page")) || 1;
    setSelectedServices((prev) =>
      JSON.stringify(prev) === JSON.stringify(servicesFromUrl) ? prev : servicesFromUrl,
    );
    setCurrentPage((prev) => (prev === pageFromUrl ? prev : pageFromUrl));
  }, [searchParams]);

  const toggleService = (slug) => {
    setSelectedServices((prev) => {
      const updated = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        if (updated.length > 0) next.set("services", updated.join(","));
        else next.delete("services");
        next.set("page", "1");
        return next;
      });
      return updated;
    });
  };

  const clearAllFilters = () => {
    setSelectedServices([]);
    setSearchParams({ page: "1" });
  };

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", newPage.toString());
      return next;
    });
  };

  const handlePartnerClick = (partner) => {
    const name = partner?.businessdetails?.name || partner?.name || "Partner Store";
    const vendorSlug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const vendorId = partner?.vendorId || partner?.businessdetails?.vendorId;
    if (vendorId) {
      sessionStorage.setItem("vendorId", vendorId);
      navigate(`/vendor-profile/${vendorSlug}`);
    }
  };

  const CategoryCheckboxList = ({ idPrefix }) => (
    <ul className="list-none m-0 p-0 mt-2">
      {categories.length === 0 ? (
        <li className="py-2 text-gray-400 text-sm">No categories available</li>
      ) : (
        categories.map((cat) => (
          <li key={cat._id || cat.slug} className="py-2 border-b border-gray-100 last:border-0">
            <div className="flex flex-row items-center gap-2">
              <input
                className="!w-3 !h-3 accent-[#321961] cursor-pointer shrink-0"
                type="checkbox"
                id={`${idPrefix}-${cat.slug}`}
                checked={selectedServices.includes(cat.slug)}
                onChange={() => toggleService(cat.slug)}
              />
              <label
                className="flex items-center cursor-pointer flex-1 gap-2 text-[13px] text-gray-700"
                htmlFor={`${idPrefix}-${cat.slug}`}
              >
                <img
                  src={getImageUrl(cat.files) || "/assets/default.png"}
                  alt={cat.name}
                  className="w-6 h-6 object-contain rounded"
                  style={{ filter: "brightness(0) saturate(100%) invert(14%) sepia(42%) saturate(4523%) hue-rotate(251deg) brightness(87%) contrast(97%)" }}
                  onError={(e) => (e.target.src = "/assets/default.png")}
                />
                <span>{cat.name}</span>
              </label>
            </div>
          </li>
        ))
      )}
    </ul>
  );

  return (
    <>
      <Home2Header />
      <CategoryProvider />

      {/* Breadcrumb Banner */}
      <div className="relative w-full overflow-hidden" style={{ minHeight: "120px" }}>
        <img
          src={breadcrumbBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 py-5 flex items-center justify-between min-h-[120px]">
          <div className="flex flex-col gap-2">
            <BackButton className="z-20 relative" />
            {/* <div className="hidden lg:block relative h-[100px] w-[120px]">
              <img src={doctors} className="h-[130px] absolute bottom-0 left-0" alt="" />
            </div> */}
          </div>

          <div className="text-right">
            <h2 className="text-gray-900 mb-1 !text-[22px] !font-bold">All Vendors</h2>
            <p className="text-gray-600 mb-0 text-[14px] font-medium max-w-[360px]">
              Find your desired medical providers and book healthcare services
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="py-6 px-4 max-w-[1400px] mx-auto">
        <div className="flex gap-6">

          {/* Desktop Filter Sidebar */}
          <aside className="hidden lg:block w-[260px] shrink-0">
            <div className="bg-white rounded-[14px] shadow-[0_2px_12px_rgba(0,0,0,0.07)] border border-gray-100 p-5 sticky top-[90px]">
              <div className="flex justify-between items-center mb-4">
                <h6 className="text-[15px] font-bold text-gray-800 m-0">Filter By</h6>
                {selectedServices.length > 0 && (
                  <button
                    className="text-[12px] text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded-full px-3 py-1 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Categories
              </p>
              <CategoryCheckboxList idPrefix="cat" />
            </div>
          </aside>

          {/* Main Cards Area */}
          <div className="flex-1 min-w-0">

            {/* Mobile Filter Row */}
            <div className="flex items-center justify-between lg:hidden mb-4">
              <button
                type="button"
                className="flex items-center gap-2 text-[13px] font-medium bg-[#321961] !text-white !rounded-full px-4 py-2 border-none cursor-pointer"
                onClick={() => setIsMobileFilterOpen(true)}
              >
                <i className="fas fa-filter text-[11px]" />
                Filter
                {selectedServices.length > 0 && (
                  <span className="bg-red-500 text-white rounded-full text-[10px] font-bold w-5 h-5 flex items-center justify-center">
                    {selectedServices.length}
                  </span>
                )}
              </button>
              {selectedServices.length > 0 && (
                <button
                  type="button"
                  className="flex items-center gap-2 text-[13px] font-medium border border-gray-300 bg-white text-gray-600 rounded-full px-4 py-2 cursor-pointer hover:bg-gray-50"
                  onClick={clearAllFilters}
                >
                  <i className="fas fa-redo text-[11px]" />
                  Clear
                </button>
              )}
            </div>

            {/* Content */}
            {isLoading ? (
              <div className="flex justify-center items-center min-h-[400px]">
                <div className="w-10 h-10 border-4 border-[#321961] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : partners.length === 0 ? (
              <div className="text-center py-16 min-h-[300px]">
                <img
                  src="https://cdni.iconscout.com/illustration/premium/thumb/data-not-found-illustration-svg-download-png-9404367.png"
                  alt="No Partners Found"
                  className="opacity-90 mb-5 mx-auto max-w-[200px]"
                />
                <h4 className="text-gray-500 mb-2 text-[18px] font-semibold">No Partners Found</h4>
                <p className="text-gray-400 text-[14px]">There are no partners available at the moment.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {partners.map((partner, index) => {
                    const logoSrc = partner?.bussiness_image?.url;
                    const bannerSrc = partner?.bussiness_banner_image?.url;
                    const name = partner?.businessdetails?.name || partner?.name || "Partner Store";
                    const ProductsCount = partner?.businessdetails?.productCount || partner?.productCount || "0";
                    const address = partner?.businessdetails?.address || partner?.address || "No Address";

                    return (
                      <div
                        key={partner._id || index}
                        className="bg-white rounded-[14px] border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.07)] overflow-hidden cursor-pointer hover:shadow-[0_8px_24px_rgba(128,89,202,0.13)] hover:-translate-y-[2px] transition-all duration-200"
                        onClick={() => handlePartnerClick(partner)}
                      >
                        {/* Banner */}
                        <div
                          className="w-full h-[110px] bg-gray-100"
                          style={{
                            backgroundImage: bannerSrc
                              ? `url(${encodeURI(getImageUrl(bannerSrc))})`
                              : `url("/assets/breadcrumb.png")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                          }}
                        />

                        {/* Content */}
                        <div className="px-4 pb-4 pt-0">
                          {/* Logo + Info Row */}
                          <div className="flex items-start gap-3 pt-3 mb-3">
                            {/* Shifting only the logo image up over the banner */}
                            <div className="-mt-9 shrink-0 z-10 relative">
                              <img
                                src={getImageUrl(logoSrc) || "/assets/default.png"}
                                alt={name}
                                className="w-[56px] h-[56px] rounded-[10px] object-contain bg-white border border-gray-200 shadow-sm"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-gray-900 text-[14px] font-semibold capitalize truncate">
                                {name}
                              </div>
                              <small className="text-gray-500 text-[12px] flex items-center gap-1 mt-0.5">
                                <i className="fas fa-map-marker-alt text-[#321961] text-[10px] shrink-0" />
                                <span className="truncate">{address}</span>
                              </small>
                            </div>
                          </div>

                          {/* Products button */}
                          <button
                            className="w-full !rounded-[8px] py-[7px] text-[13px] font-medium border-none cursor-pointer transition-colors hover:bg-[#d4b8ff55]"
                            style={{ backgroundColor: "#a36ff92e" }}
                            onClick={(e) => { e.stopPropagation(); handlePartnerClick(partner); }}
                          >
                            <strong className="text-[#321961] font-bold">{ProductsCount}</strong>{" "}
                            <span className="text-gray-700">Products</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Pure Tailwind Mobile Filter Drawer (Hidden on Desktop) */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-[99999] lg:hidden flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-full bg-white h-full flex flex-col shadow-2xl z-10 animate-[slideIn_0.2s_ease-out]">
            <div className="flex items-center justify-between border-b border-gray-100 p-4">
              <h5 className="text-[16px] font-bold text-gray-800 flex items-center gap-2 m-0">
                <i className="fas fa-filter text-[#321961]" /> Filters
              </h5>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 border-none text-gray-600 hover:bg-gray-200 cursor-pointer"
              >
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <div className="flex justify-between items-center mb-3">
                <h6 className="mb-0 text-[14px] font-bold text-gray-800">Filter By</h6>
                {selectedServices.length > 0 && (
                  <button
                    className="text-[12px] text-red-500 border border-red-200 rounded-full px-3 py-1 bg-red-50 hover:bg-red-100 cursor-pointer"
                    onClick={clearAllFilters}
                  >
                    Clear All
                  </button>
                )}
              </div>
              <p className="text-[12px] font-semibold text-gray-500 uppercase tracking-wide mb-2">Categories</p>
              <CategoryCheckboxList idPrefix="mobile-cat" />
            </div>
            <div className="p-4 border-t border-gray-100">
              <button
                className="w-full py-3 !rounded-sm bg-[#321961] !text-white !font-semibold !text-[14px] border-none cursor-pointer hover:bg-[#6d48b8] transition-colors"
                onClick={() => setIsMobileFilterOpen(false)}
              >
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ViewAllPartners;
