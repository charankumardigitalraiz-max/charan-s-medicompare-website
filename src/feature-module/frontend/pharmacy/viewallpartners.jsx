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

const ViewAllPartners = () => {
  const navigate = useNavigate();
  const { service } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [partners, setPartners] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 9;

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedServices.length > 0) {
        params.append("services", selectedServices.join(","));
      }
      params.append("page", currentPage);
      params.append("limit", itemsPerPage);

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
    <ul className="list-unstyled category-listt mt-2">
      {categories.length === 0 ? (
        <li className="py-2 text-muted">No categories available</li>
      ) : (
        categories.map((cat) => (
          <li key={cat._id || cat.slug} className="py-2">
            <div className="form-check flex items-center">
              <input
                className="form-check-input me-2"
                type="checkbox"
                id={`${idPrefix}-${cat.slug}`}
                checked={selectedServices.includes(cat.slug)}
                onChange={() => toggleService(cat.slug)}
              />
              <label
                className="form-check-label flex items-center cursor-pointer flex-1"
                htmlFor={`${idPrefix}-${cat.slug}`}
              >
                <img
                  src={getImageUrl(cat.files) || "/assets/default.png"}
                  alt={cat.name}
                  className="w-6 h-6 object-contain mr-3 rounded"
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

      <div className="breadcrumb-bar">
        <div className="breadcrumbb-bggg">
          <img src={breadcrumbBg} />
        </div>
        <div className="breadcrumbb-contentt">
          <div className="row items-center justify-between min-h-[60px] lg:min-h-[60px]">
            <div className="col-lg-6">
              <button
                onClick={() => navigate(-1)}
                className="btn btn-light btn-sm inline-flex items-center gap-2 mb-2 rounded-[20px] px-4 py-[6px] font-medium border border-[#e2e8f0] bg-white shadow-sm"
              >
                <i className="fa-solid fa-arrow-left" />
                Go Back
              </button>
              <div className="relative hidden lg:block">
                <img
                  src={doctors}
                  className="h-[150px] absolute top-0 left-0"
                />
              </div>
            </div>

            <div className="col-lg-6 text-lg-end mt-3 mt-lg-0">
              <h2 className="text-dark mb-1 text-[20px] font-semibold">All Vendors</h2>
              <p className="text-secondary mb-0 text-[14px] font-medium">
                Find your desired medical providers and book healthcare services
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="content py-5">
        <div className="container-fluid">
          <div className="row">
            {/* Desktop Filter Sidebar */}
            <div className="col-lg-3 mb-4 hidden lg:block">
              <div className="filter-cardd shadow p-4 bg-white rounded">
                <div className="flex justify-between items-center mb-3">
                  <h6 className="filter-titlee mb-0">Filter By</h6>
                  {selectedServices.length > 0 && (
                    <button className="btn btn-sm btn-outline-danger" onClick={clearAllFilters}>
                      Clear All
                    </button>
                  )}
                </div>
                <label className="form-label mt-3">Categories</label>
                <CategoryCheckboxList idPrefix="cat" />
              </div>
            </div>

            {/* Main Content */}
            <div className="col-lg-9">
              {/* Mobile Filter Buttons */}
              <div className="flex items-center justify-between lg:hidden mb-3">
                <button
                  type="button"
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#filterOffcanvas"
                  aria-controls="filterOffcanvas"
                >
                  <i className="fas fa-filter"></i>
                  <span>Filter</span>
                  {selectedServices.length > 0 && (
                    <span className="badge bg-danger ms-1">{selectedServices.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-primary flex items-center gap-1"
                  onClick={clearAllFilters}
                >
                  <i className="fas fa-redo"></i>
                  <span>Clear</span>
                </button>
              </div>

              {isLoading ? (
                <div className="flex justify-center items-center min-h-[400px]">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : partners.length === 0 ? (
                <div className="text-center py-5 min-h-[300px]">
                  <img
                    src="https://cdni.iconscout.com/illustration/premium/thumb/data-not-found-illustration-svg-download-png-9404367.png"
                    alt="No Partners Found"
                    className="opacity-90 mb-5"
                  />
                  <h4 className="text-[#666] mb-2">No Partners Found</h4>
                  <p className="text-[#999]">There are no partners available at the moment.</p>
                </div>
              ) : (
                <>
                  <div className="row g-4">
                    {partners.map((partner, index) => {
                      const logoSrc = partner?.bussiness_image?.url;
                      const bannerSrc = partner?.bussiness_banner_image?.url;
                      const name = partner?.businessdetails?.name || partner?.name || "Partner Store";
                      const ProductsCount = partner?.businessdetails?.productCount || partner?.productCount || "0";
                      const address = partner?.businessdetails?.address || partner?.address || "No Address";

                      return (
                        <div className="col-lg-4 col-md-6 col-12" key={partner._id || index}>
                          <div
                            className="store-cardd shadow cursor-pointer transition-all duration-300 ease-in-out"
                            onClick={() => handlePartnerClick(partner)}
                          >
                            <div
                              className="store-bannerr"
                              style={{
                                backgroundImage: bannerSrc
                                  ? `url(${encodeURI(getImageUrl(bannerSrc))})`
                                  : `url("/assets/breadcrumb.png")`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            />
                            <div className="store-contentt">
                              <div className="store-info capitalize">
                                <img
                                  src={getImageUrl(logoSrc) || "../assets/default.png"}
                                  className="store-logoo"
                                  alt={name}
                                />
                                <div className="store-details">
                                  <div className="text-dark text-[14px] font-medium">{name}</div>
                                  <small>
                                    <i className="fas fa-map-marker-alt me-1"></i>
                                    {address.slice(0, 10)}
                                  </small>
                                </div>
                              </div>
                              <button
                                className="store-button rounded border-none"
                                style={{ backgroundColor: "#a36ff92e" }}
                                onClick={(e) => { e.stopPropagation(); handlePartnerClick(partner); }}
                              >
                                <strong className="text-primary fw-bold">{ProductsCount}</strong>{" "}
                                <span className="text-dark">Products</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {totalPages > 1 && (
                    <div className="pagination dashboard-pagination mb-4 flex justify-center mt-5">
                      <ul className="flex justify-center mb-0 gap-1">
                        <li>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <i className="fa-solid fa-chevron-left" />
                          </button>
                        </li>
                        {Array.from({ length: totalPages }, (_, i) => {
                          const page = i + 1;
                          if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                            return (
                              <li key={page}>
                                <button
                                  className={`page-link ${currentPage === page ? "active" : ""}`}
                                  onClick={() => handlePageChange(page)}
                                >
                                  {page}
                                </button>
                              </li>
                            );
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return (
                              <li key={`dots-${page}`}>
                                <span className="page-link cursor-default">...</span>
                              </li>
                            );
                          }
                          return null;
                        })}
                        <li>
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                            disabled={currentPage === totalPages}
                          >
                            <i className="fa-solid fa-chevron-right" />
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Filter Offcanvas */}
        <div
          className="offcanvas offcanvas-start w-[50%] max-w-[400px] min-w-[280px]"
          tabIndex="-1"
          id="filterOffcanvas"
          aria-labelledby="filterOffcanvasLabel"
          data-bs-backdrop="static"
          data-bs-keyboard="false"
        >
          <div className="offcanvas-header border-bottom">
            <h5 className="offcanvas-title" id="filterOffcanvasLabel">
              <i className="fas fa-filter me-2"></i> Filters
            </h5>
            <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
          </div>
          <div className="offcanvas-body">
            <div className="filter-cardd p-3">
              <div className="flex justify-between items-center mb-3">
                <h6 className="mb-0 font-bold">Filter By</h6>
                {selectedServices.length > 0 && (
                  <button className="btn btn-sm btn-outline-danger" onClick={clearAllFilters}>
                    Clear All
                  </button>
                )}
              </div>
              <label className="form-label font-medium">Categories</label>
              <CategoryCheckboxList idPrefix="mobile-cat" />
            </div>
            <div className="mt-5">
              <button className="btn btn-primary w-full py-3" data-bs-dismiss="offcanvas">
                Apply & Close
              </button>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default ViewAllPartners;
