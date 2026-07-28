import { useEffect, useState, useMemo } from "react";
import ProductCard from "./ProductCard.jsx";
import { ViewToggleButtons, SortSelect, } from "../ui";

import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const ProductsSection = ({
  filteredProducts,
  isLoading,
  isSkeletonLoading,
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
  onOpenFilterDrawer,
  isSidebarOpen = true
}) => {
  const [sortBy, setSortBy] = useState("");
  const [isSorting, setIsSorting] = useState(false);
  // console.log("service from products section", filteredProducts)
  const handleSortChange = (event) => {
    const newSortBy = event.target.value;
    setIsSorting(true);
    setSortBy(newSortBy);
    setTimeout(() => {
      setIsSorting(false);
    }, 500);
  };

  const sortedProducts = useMemo(() => {
    if (!sortBy || filteredProducts.length === 0) return filteredProducts;

    const sortedProducts = [...filteredProducts];

    switch (sortBy) {
      case "price_low":
        sortedProducts.sort((a, b) => {
          const priceA = getDisplayPrice(a) || 0;
          const priceB = getDisplayPrice(b) || 0;
          return priceA - priceB;
        });
        break;
      case "price_high":
        sortedProducts.sort((a, b) => {
          const priceA = getDisplayPrice(a) || 0;
          const priceB = getDisplayPrice(b) || 0;
          return priceB - priceA;
        });
        break;
      case "popularity":
        sortedProducts.sort((a, b) => {
          const popularityA = a.tablet?.popularity || a.popularity || 0;
          const popularityB = b.tablet?.popularity || b.popularity || 0;
          return popularityB - popularityA;
        });
        break;
      case "newest":
        sortedProducts.sort((a, b) => {
          const dateA = new Date(a.tablet?.createdAt || a.createdAt || 0);
          const dateB = new Date(b.tablet?.createdAt || b.createdAt || 0);
          return dateB - dateA;
        });
        break;
      default:
        break;
    }

    return sortedProducts;
  }, [filteredProducts, sortBy, getDisplayPrice]);

  return (
    <div>
      {/* Products Section Header */}
      <div className="products-section-header">
        <div className="products-count">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2 mobile-filter-buttons-container">
              {/* Mobile Filter Button */}
              {onOpenFilterDrawer && (
                <button
                  type="button"
                  className="mobile-filter-toggle-btn-inline"
                  onClick={onOpenFilterDrawer}
                >
                  <i className="fas fa-filter"></i>
                  <span>Filter</span>
                  {filteredProducts.length > 0 && (
                    <span className="filter-count-badge-inline">{filteredProducts.length}</span>
                  )}
                </button>
              )}
              {/* Sort Select - Mobile */}
              <div className="d-block d-lg-none">
                <SortSelect
                  value={sortBy}
                  onChange={handleSortChange}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="d-flex align-items-center gap-3">
          {/* Sort Select - Desktop */}
          <div className="d-none d-lg-block">
            <SortSelect
              value={sortBy}
              onChange={handleSortChange}
            />
          </div>
          <ViewToggleButtons isFull={isFull} onToggle={setIsFull} />
        </div>
      </div>

      {/* Products Grid */}
      <div className="row g-2 products-grid-row">
        {(isLoading || isSkeletonLoading || isSorting) && (
          isFull ? (
            Array(8).fill(0).map((_, index) => (
              <div key={index} className="col-12 mb-2">
                <div className="product-carddd" style={{ border: '1px solid #eee', padding: '10px', borderRadius: '8px' }}>
                  <div className="row align-items-center">
                    <div className="col-md-2 d-flex justify-content-center">
                      <Skeleton height={80} width={80} />
                    </div>
                    <div className="col-md-6">
                      <Skeleton count={1} height={20} width="60%" style={{ marginBottom: '10px' }} />
                      <div className="d-flex gap-2">
                        <Skeleton height={30} width={80} />
                        <Skeleton height={30} width={80} />
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        <Skeleton height={20} width={60} />
                        <Skeleton height={20} width={60} />
                        <Skeleton height={20} width={60} />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="d-flex justify-content-end gap-2 mb-2">
                        <Skeleton circle height={35} width={35} />
                        <Skeleton circle height={35} width={35} />
                        <Skeleton circle height={35} width={35} />
                      </div>
                      <Skeleton count={2} height={40} style={{ marginBottom: '5px' }} />
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            Array(8).fill(0).map((_, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4 col-xl-3">
                <div className="product-card">
                  <div className="product-img">
                    <Skeleton height={200} />
                  </div>
                  <div className="product-content">
                    <Skeleton count={1} height={20} style={{ marginBottom: '10px' }} />
                    <Skeleton count={1} height={15} width="60%" style={{ marginBottom: '10px' }} />
                    <Skeleton count={1} height={15} width="40%" />
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {!isLoading && !isSkeletonLoading && !isSorting && sortedProducts.length === 0 && (
          <div className="col-12 products-empty">
            <img
              src="https://cdni.iconscout.com/illustration/premium/thumb/data-not-found-illustration-svg-download-png-9404367.png"
              alt="No Data Found"
            />
            <h3>No Products Found</h3>
            <p>Try adjusting your filters to see more results</p>
          </div>
        )}

        {!isLoading && !isSkeletonLoading && !isSorting &&
          sortedProducts.map((product, index) => {
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
      {!isLoading && !isSkeletonLoading && totalPages > 0 && sortedProducts.length > 0 && (
        <div className="pagination dashboard-pagination" style={{ marginTop: "40px", marginBottom: "20px", display: "flex", justifyContent: "center" }}>
          <ul>
            <li>
              <a
                className={`page-link ${page <= 1 ? "disabled" : ""}`}
                onClick={() => page > 1 && onPageChange(page - 1)}
                style={{
                  cursor: page <= 1 ? "not-allowed" : "pointer",
                  opacity: page <= 1 ? 0.5 : 1
                }}
              >
                <i className="fa-solid fa-chevron-left" />
              </a>
            </li>

            {totalPages > 1 && page > 3 && (
              <li>
                <a className="page-link" onClick={() => onPageChange(1)}>1</a>
              </li>
            )}

            {totalPages > 1 && page > 4 && (
              <li>
                <span className="page-link">...</span>
              </li>
            )}

            {(() => {
              if (totalPages === 1) {
                return (
                  <li>
                    <a className="page-link active">1</a>
                  </li>
                );
              }

              let start = Math.max(1, page - 2);
              let end = Math.min(totalPages, page + 2);
              if (start === 1) end = Math.min(5, totalPages);
              if (end === totalPages) start = Math.max(1, totalPages - 4);

              return [...Array(end - start + 1)].map((_, i) => {
                const pageNum = start + i;
                return (
                  <li key={pageNum}>
                    <a
                      className={`page-link ${pageNum === page ? "active" : ""}`}
                      onClick={() => onPageChange(pageNum)}
                    >
                      {pageNum}
                    </a>
                  </li>
                );
              });
            })()}

            {totalPages > 1 && page < totalPages - 3 && (
              <li>
                <span className="page-link">...</span>
              </li>
            )}

            {totalPages > 1 && page < totalPages - 2 && (
              <li>
                <a className="page-link" onClick={() => onPageChange(totalPages)}>
                  {totalPages}
                </a>
              </li>
            )}

            <li>
              <a
                className={`page-link ${page >= totalPages ? "disabled" : ""}`}
                onClick={() => page < totalPages && onPageChange(page + 1)}
                style={{
                  cursor: page >= totalPages ? "not-allowed" : "pointer",
                  opacity: page >= totalPages ? 0.5 : 1
                }}
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

