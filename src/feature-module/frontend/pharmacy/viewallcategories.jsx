import { Link, useNavigate, useParams } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import CategoryProvider from "../../../components/CategoryProvider.jsx";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { axiosCommonInstance } from "../../../Apiservice.jsx";
import { getImageUrl } from "../../../utils/index";

const colorSchemes = [
  { iconColor: "#8059ca", bg: "linear-gradient(135deg, #F8F5FE 0%, #E8D5FF 100%)" },
  { iconColor: "#110EFD", bg: "linear-gradient(135deg, #EAF3FF 0%, #D4E8FF 100%)" },
  { iconColor: "#04BD6C", bg: "linear-gradient(135deg, #F1FAF3 0%, #D4F4E0 100%)" },
  { iconColor: "#FF6B6B", bg: "linear-gradient(135deg, #FFF5F5 0%, #FFE5E5 100%)" },
  { iconColor: "#FFA726", bg: "linear-gradient(135deg, #FFF8E1 0%, #FFE5B4 100%)" },
  { iconColor: "#26A69A", bg: "linear-gradient(135deg, #E0F2F1 0%, #B2DFDB 100%)" },
];

const ViewAllCategories = () => {
  const navigate = useNavigate();
  const { service } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const categoriesPerPage = 18;

  const getCategoryData = async (page = 1) => {
    const params = {
      type: "website",
      positiontype: "top,bottom",
      page: page,
      limit: categoriesPerPage,
    };
    setLoading(true);
    try {
      const response = await axiosCommonInstance.get(
        `allcategory/slug/${service}`,
        { params },
      );
      const { allcategory, pagination } = response.data.data;
      setCategories(allcategory || []);
      setTotalPages(pagination?.totalPages || 1);
      setCurrentPage(pagination?.page || 1);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getCategoryData(currentPage);
  }, [service, currentPage]);

  const handleCategoryClick = (item) => {
    navigate(`/${service}/all?maincategories=${item.slug}`);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const categoryName = service
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <Home2Header />
      <CategoryProvider />
      <section className="content-categories pt-[150px] pb-5">
        <div className="container-fluid">
          <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
            <h3 className="mb-2 top-vendor-badge">
              <i className="fas fa-bolt mr-2"></i>
              {categoryName}
            </h3>

            <div className="flex items-center flex-wrap gap-3">
              <span
                onClick={() => navigate(-1)}
                className="top-vendor-badge cursor-pointer no-underline"
              >
                Go Back <i className="fa-solid fa-arrow-left ms-1"></i>
              </span>
            </div>
          </div>

          <div className="row g-2">
            {loading ? (
              <div className="col-12 text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 mb-0">Loading categories...</p>
              </div>
            ) : categories && categories.length > 0 ? (
              categories.map((cat, index) => {
                const colors = colorSchemes[index % colorSchemes.length];
                return (
                  <div
                    className="col-lg-2 col-md-3 col-4 col-sm-6"
                    key={cat._id || index}
                    onClick={() => handleCategoryClick(cat)}
                  >
                    <div className="h-100 rounded-[18px] p-[1px]">
                      <div
                        className="card border-0 h-100 rounded-[16px] bg-white overflow-hidden relative transition-all duration-300 ease-in-out hover:-translate-y-2"
                        style={{
                          border: "1px solid rgba(0,0,0,0.04)",
                          boxShadow: "0 10px 30px rgba(25, 25, 46, 0.08)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow = `0 18px 35px ${colors.iconColor}25`;
                          const accent = e.currentTarget.querySelector(".card-accent-bar");
                          if (accent) accent.style.transform = "scaleX(1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.boxShadow = "0 10px 30px rgba(25, 25, 46, 0.08)";
                          const accent = e.currentTarget.querySelector(".card-accent-bar");
                          if (accent) accent.style.transform = "scaleX(0)";
                        }}
                      >
                        <div
                          className="card-accent-bar absolute top-0 left-0 right-0 h-[4px] transition-transform duration-300 origin-left scale-x-0"
                          style={{
                            background: `linear-gradient(90deg, ${colors.iconColor}, ${colors.iconColor}55)`,
                          }}
                        ></div>

                        <div className="card-body flex flex-col items-center justify-center text-center px-3 py-[24px] gap-3 min-h-[150px]">
                          {/* Icon */}
                          <div
                            className="w-[60px] h-[60px] rounded-[18px] flex items-center justify-center relative"
                            style={{
                              background: colors.bg,
                              boxShadow: `0 12px 24px ${colors.iconColor}20`,
                            }}
                          >
                            <div className="absolute inset-[6px] rounded-[14px] bg-white opacity-60"></div>
                            <img
                              src={getImageUrl(cat?.files?.[0]) || "/assets/default.png"}
                              loading="lazy"
                              title={cat?.name}
                              alt={cat?.name}
                              className="w-[30px] h-[30px] object-contain relative z-[2]"
                            />
                          </div>

                          <h6 className="mb-0 text-[12px] font-semibold text-[#1a1a1a] leading-[1.35] min-h-[32px] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden text-center">
                            {cat?.name || "No Category"}
                          </h6>

                          <p className="mb-0 text-[11px] text-[#7a7a7a]">Explore now</p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-12 text-center py-5">
                <h5>No Data Available</h5>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="pagination dashboard-pagination mt-4">
              <ul className="flex justify-center items-center gap-1">
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
                  if (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  ) {
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
                    onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fa-solid fa-chevron-right" />
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
};

export default ViewAllCategories;
