import { useEffect, useContext } from "react";
import ProductCard from "./ProductCard.jsx";
import { ProductsDataContext } from "./ProductsDataContext.jsx";

const ProductsSection = () => {
  const context = useContext(ProductsDataContext);
  if (!context) return null;

  const {
    filteredProducts,
    isLoading,
    isFull,
    setIsFull,
    categoryName,
    selectedVariants,
    expandedVendors,
    onToggleExpand,
    onToggleFavourite,
    onShare,
    onVendorAction,
    getDisplayPrice,
    getVendorPrice,
    getQuantityForVariant,
    selectedVendors,
    service,
    id,
    navigate,
    page,
    totalPages,
    priceRange = [200, 100000],
    onPageChange,
    onSelectVariant,
    onClearFilters,
    onOpenFilterDrawer,
    isDesktopSidebarOpen: isSidebarOpen = true,
  } = context;

  useEffect(() => {
    if (window.bootstrap) {
      const timer = setTimeout(() => {
        const tooltipTriggerList = [].slice.call(
          document.querySelectorAll('[data-bs-toggle="tooltip"]')
        );
        tooltipTriggerList.forEach(function (tooltipTriggerEl) {
          const existingTooltip = window.bootstrap.Tooltip.getInstance(tooltipTriggerEl);
          if (!existingTooltip) {
            new window.bootstrap.Tooltip(tooltipTriggerEl);
          }
        });
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [filteredProducts]);

  return (
    <div>
      {/* Products Section Header - Mobile Only */}
      <div className="d-lg-none flex items-center justify-between mb-[20px] p-[16px] bg-white border border-solid border-[rgba(125,46,255,0.1)] rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-[10px]">
          <div className="flex items-center gap-2">
            {/* Mobile Filter Button */}
            {onOpenFilterDrawer && (
              <button
                type="button"
                className="flex items-center justify-center bg-[#8059ca] text-white border-none p-[8px_12px] rounded-[6px] text-[14px] font-[500] cursor-pointer transition-all duration-200 hover:bg-[#6b25e6] hover:-translate-y-[1px] hover:shadow-[0_4px_8px_rgba(125,46,255,0.3)] h-[36px] w-[36px]"
                onClick={onOpenFilterDrawer}
                title="Filters"
              >
                <i className="fas fa-filter"></i>
              </button>
            )}
            {/* Clear All Button */}
            {onClearFilters && (
              <button
                type="button"
                className="flex items-center gap-[4px] p-[6px_10px] text-[11px] rounded-[5px] font-[500] min-h-[32px] border border-solid border-[#8059ca] bg-transparent text-[#8059ca] cursor-pointer whitespace-nowrap hover:bg-[#8059ca] hover:text-white transition-all duration-200"
                onClick={onClearFilters}
              >
                <i className="fas fa-redo text-[10px]"></i>
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="row g-3">
        {isLoading && (
          <div className="col-12 flex flex-col items-center justify-center min-h-[300px] p-[20px]">
            <i className="fa fa-spinner fa-spin text-[36px] text-[#8059ca] mb-2"></i>
            <p style={{ color: "#666", fontSize: "16px" }}>Loading products...</p>
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="col-12 flex flex-col items-center justify-center min-h-[300px] p-[20px] text-center">
            <img
              src="https://cdni.iconscout.com/illustration/premium/thumb/data-not-found-illustration-svg-download-png-9404367.png"
              alt="No Data Found"
              className="w-[200px] mb-[16px]"
            />
            <h3 className="text-[18px] font-semibold mb-2">No Products Found</h3>
            <p className="text-[#666]">Try adjusting your filters to see more results</p>
          </div>
        )}

        {!isLoading &&
          filteredProducts.map((product, index) => {
            if (!product || !product.tablet || !product.tablet._id) {
              return null;
            }

            return (
              <ProductCard
                key={`${product.tablet._id}-${index}`}
                product={product}
                index={index}
                isFull={isFull}
                service={service}
                id={id}
                navigate={navigate}
                selectedVariants={selectedVariants}
                expandedVendors={expandedVendors}
                onToggleExpand={onToggleExpand}
                onToggleFavourite={onToggleFavourite}
                onShare={onShare}
                onVendorAction={onVendorAction}
                getDisplayPrice={getDisplayPrice}
                getVendorPrice={getVendorPrice}
                getQuantityForVariant={getQuantityForVariant}
                selectedVendors={selectedVendors}
                categoryName={categoryName}
                priceRange={priceRange}
                onSelectVariant={onSelectVariant}
                isSidebarOpen={isSidebarOpen}
              />
            );
          })}
      </div>

      {/* Pagination */}
      {!isLoading && totalPages > 1 && (
        <div className="pagination dashboard-pagination mt-4 mb-2" style={{ display: "flex", justifyContent: "center" }}>
          <ul className="flex items-center gap-[6px] list-none p-0 m-0">
            <li>
              <a
                className={`page-link flex items-center justify-center w-[36px] h-[36px] rounded-full border border-solid border-slate-200 text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all duration-200 cursor-pointer ${page <= 1 ? "disabled opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => page > 1 && onPageChange(page - 1)}
              >
                <i className="fa-solid fa-chevron-left" />
              </a>
            </li>

            {page > 3 && (
              <li>
                <a className="page-link flex items-center justify-center w-[36px] h-[36px] rounded-full border border-solid border-slate-200 text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all duration-200 cursor-pointer" onClick={() => onPageChange(1)}>1</a>
              </li>
            )}

            {page > 4 && (
              <li>
                <span className="page-link flex items-center justify-center w-[36px] h-[36px] text-slate-400">...</span>
              </li>
            )}

            {(() => {
              let start = Math.max(1, page - 2);
              let end = Math.min(totalPages, page + 2);
              if (start === 1) end = Math.min(5, totalPages);
              if (end === totalPages) start = Math.max(1, totalPages - 4);

              return [...Array(end - start + 1)].map((_, i) => {
                const pageNum = start + i;
                return (
                  <li key={pageNum}>
                    <a
                      className={`page-link flex items-center justify-center w-[36px] h-[36px] rounded-full border border-solid border-slate-200 text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all duration-200 cursor-pointer ${pageNum === page ? "active bg-[#8059ca] text-white" : ""}`}
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </a>
                  </li>
                );
              });
            })()}

            {page < totalPages - 3 && (
              <li>
                <span className="page-link flex items-center justify-center w-[36px] h-[36px] text-slate-400">...</span>
              </li>
            )}

            {page < totalPages - 2 && (
              <li>
                <a className="page-link flex items-center justify-center w-[36px] h-[36px] rounded-full border border-solid border-slate-200 text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all duration-200 cursor-pointer" onClick={() => onPageChange(totalPages)}>
                  {totalPages}
                </a>
              </li>
            )}

            <li>
              <a
                className={`page-link flex items-center justify-center w-[36px] h-[36px] rounded-full border border-solid border-slate-200 text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all duration-200 cursor-pointer ${page >= totalPages ? "disabled opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => page < totalPages && onPageChange(page + 1)}
              >
                <i className="fa-solid fa-chevron-right" />
              </a>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProductsSection;
