import { useEffect, useState, useMemo } from "react";
import ProductCard from "./ProductCard.jsx";
import { ViewToggleButtons, SortSelect, } from "../ui";
import Pagination from "../ui/Pagination.jsx";

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
      <div className="flex items-center gap-3 mt-2 mb-4 p-3 bg-white rounded-2xl shadow-sm border border-slate-100 lg:hidden">
        {onOpenFilterDrawer && (
          <button
            type="button"
            className="flex items-center gap-2 px-3.5 py-2 bg-[#321961] text-white border-0 !rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#6d3fc7] transition-all shrink-0"
            onClick={onOpenFilterDrawer}
          >
            <i className="fas fa-filter text-[10px]"></i>
            <span>Filter</span>
            {filteredProducts.length > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-bold">{filteredProducts.length}</span>
            )}
          </button>
        )}
        <SortSelect
          value={sortBy}
          onChange={handleSortChange}
        />
      </div>

      {/* Products Grid */}
      <div className={`grid gap-4 items-stretch ${isFull ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"}`}>
        {(isLoading || isSkeletonLoading || isSorting) && (
          isFull ? (
            Array(8).fill(0).map((_, index) => (
              <div key={index} className="w-full">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-2 flex justify-center">
                      <Skeleton height={80} width={80} className="rounded-xl" />
                    </div>
                    <div className="md:col-span-6 flex flex-col gap-2">
                      <Skeleton count={1} height={20} width="60%" />
                      <div className="flex gap-2">
                        <Skeleton height={30} width={80} />
                        <Skeleton height={30} width={80} />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Skeleton height={20} width={60} />
                        <Skeleton height={20} width={60} />
                        <Skeleton height={20} width={60} />
                      </div>
                    </div>
                    <div className="md:col-span-4">
                      <div className="flex justify-end gap-2 mb-2">
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
              <div key={index} className="w-full">
                <div className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-4">
                  <div className="relative aspect-video bg-slate-50 flex items-center justify-center rounded-xl p-4">
                    <Skeleton height="100%" width="100%" />
                  </div>
                  <div className="flex flex-col gap-2 p-2">
                    <Skeleton count={1} height={20} />
                    <Skeleton count={1} height={15} width="60%" />
                    <Skeleton count={1} height={15} width="40%" />
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {!isLoading && !isSkeletonLoading && !isSorting && sortedProducts.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl shadow-sm border border-slate-100 text-center">
            <img
              src="https://cdni.iconscout.com/illustration/premium/thumb/data-not-found-illustration-svg-download-png-9404367.png"
              alt="No Data Found"
              className="max-w-[200px] mb-4"
            />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No Products Found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filters to see more results</p>
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
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
};

export default ProductsSection;

