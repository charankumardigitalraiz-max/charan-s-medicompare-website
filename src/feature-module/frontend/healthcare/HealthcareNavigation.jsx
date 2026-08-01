import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getImageUrl } from "../../../utils";
import { PAGE_LOADER_IMAGE } from "../../../components/ui/PageLoader.jsx";


const HealthcareNavigation = ({ categories: propCategories, isLoading: propLoading = false }) => {
  const categories = propCategories || [];
  const tabLoading = propLoading;
  const [hasSearchBar, setHasSearchBar] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 991);

  const updateScrollButtons = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;
    setCanScrollLeft(container.scrollLeft > 4);
    setCanScrollRight(container.scrollLeft + container.clientWidth < container.scrollWidth - 4);
  }, []);

  const scrollCategoryToCenter = (itemSlug) => {
    const container = scrollRef.current;
    if (!container) return;
    const categoryElements = container.querySelectorAll('.nav-item');
    let targetElement = null;

    categoryElements.forEach((el) => {
      const navText = el.querySelector('.nav-text');
      if (navText) {
        const category = categories.find(cat => cat.slug === itemSlug);
        if (category && navText.textContent.trim() === category.name) {
          targetElement = el;
        }
      }
    });

    if (!targetElement) {
      const categoryIndex = categories.findIndex(cat => cat.slug === itemSlug);
      if (categoryIndex !== -1 && categoryElements[categoryIndex]) {
        targetElement = categoryElements[categoryIndex];
      }
    }

    if (targetElement) {
      const containerWidth = container.offsetWidth;
      const elementLeft = targetElement.offsetLeft;
      const elementWidth = targetElement.offsetWidth;
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2);

      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: "smooth",
      });
    }
  };

  const [topOffset, setTopOffset] = useState(85);

  useEffect(() => {
    const checkSearchBar = () => {
      const mobile = window.innerWidth <= 991;
      setIsMobileView(mobile);

      if (mobile) {
        const mobileHeader = document.querySelector('header.mobile-header');
        const mobileSearch = document.querySelector('section.mobile-search');

        let offset = 62;
        if (mobileHeader) {
          offset = mobileHeader.offsetHeight;
        }

        let searchBarVisible = false;
        if (mobileSearch && window.getComputedStyle(mobileSearch).display !== 'none') {
          searchBarVisible = true;
          offset += mobileSearch.offsetHeight;
        }

        setHasSearchBar(searchBarVisible);
        setTopOffset(offset);
      } else {
        const desktopHeader = document.querySelector('header.header-custom');
        if (desktopHeader) {
          setTopOffset(desktopHeader.offsetHeight);
        } else {
          setTopOffset(85);
        }
        setHasSearchBar(false);
      }
    };

    checkSearchBar();
    const interval = setInterval(checkSearchBar, 150);

    window.addEventListener("resize", checkSearchBar);
    window.addEventListener("scroll", checkSearchBar, { passive: true });

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", checkSearchBar);
      window.removeEventListener("scroll", checkSearchBar);
    };
  }, []);

  useEffect(() => {
    const updateNavHeight = () => {
      const navEl = document.querySelector('.healthcare-navigation-wrapper');
      let height = 0;
      if (navEl && window.getComputedStyle(navEl).display !== 'none') {
        height = navEl.offsetHeight;
      }
      document.documentElement.style.setProperty('--nav-height', `${height}px`);
    };

    updateNavHeight();
    const interval = setInterval(updateNavHeight, 200);
    window.addEventListener('resize', updateNavHeight);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateNavHeight);
      document.documentElement.style.setProperty('--nav-height', '0px');
    };
  }, [location.pathname, categories]);

  // Attach scroll listener to the nav list to keep arrow visibility updated
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    container.addEventListener("scroll", updateScrollButtons, { passive: true });
    // Initial check after categories render
    updateScrollButtons();
    return () => container.removeEventListener("scroll", updateScrollButtons);
  }, [updateScrollButtons, categories]);

  // Re-check on window resize
  useEffect(() => {
    window.addEventListener("resize", updateScrollButtons);
    return () => window.removeEventListener("resize", updateScrollButtons);
  }, [updateScrollButtons]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentPath = location.pathname;
      if (currentPath.startsWith('/view-all-categories/')) {
        const pathParts = currentPath.split('/');
        const serviceSlug = pathParts[2];
        if (serviceSlug) {
          const activeCategory = categories.find(item => item.slug === serviceSlug);
          if (activeCategory) {
            scrollCategoryToCenter(activeCategory.slug);
          }
        }
      } else {
        const activeCategory = categories.find(item => currentPath.startsWith(`/${item.slug}`));
        if (activeCategory) {
          scrollCategoryToCenter(activeCategory.slug);
        }
      }
      // Update arrows after auto-scroll settles
      setTimeout(updateScrollButtons, 350);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname, categories]);

  const handleCategoryClick = (item) => {
    navigate(`/${item.slug}`);
    setTimeout(() => {
      scrollCategoryToCenter(item.slug);
    }, 150);
  };

  const scrollLeft = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({
        left: container.scrollLeft - 200,
        behavior: "smooth",
      });
    }
  };

  const scrollRight = () => {
    const container = scrollRef.current;
    if (container) {
      container.scrollTo({
        left: container.scrollLeft + 200,
        behavior: "smooth",
      });
    }
  };

  const shouldShow = true;

  return (
    <div
      className={`healthcare-navigation-wrapper w-full ${shouldShow ? 'block' : 'hidden'} ${hasSearchBar ? 'has-search-bar' : ''} fixed left-0 right-0 z-[997] bg-white border-b border-solid border-[#e6e6e7] transition-all duration-300`}
      style={{
        top: `${topOffset}px`,
      }}
    >
      {/* Left scroll arrow */}
      <button
        type="button"
        className={`absolute left-[2px] top-1/2 -translate-y-1/2 bg-white border border-solid border-[#e8e8e8] text-[#555] text-[11px] w-[28px] h-[28px] flex items-center justify-center p-0 rounded-full rounded-circle shadow-[0_2px_8px_rgba(0,0,0,0.12)] cursor-pointer z-10 transition-all duration-200 hover:bg-[#f0ebff] hover:text-[#8059ca] hover:border-[#c9b5f5] hover:shadow-[0_3px_10px_rgba(128,89,202,0.2)] transition-opacity duration-200 ${canScrollLeft ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ borderRadius: "50%" }}
        onClick={scrollLeft}
        aria-label="Scroll categories left"
      >
        <i className="fa-solid fa-chevron-left"></i>
      </button>

      {tabLoading && (
        <div
          className="fixed inset-0 bg-white flex justify-center items-center z-[99999999] backdrop-blur-[2px]"
        >
          <div className="text-center">
            <img src={PAGE_LOADER_IMAGE} alt="loading..." />
          </div>
        </div>
      )}
      <div className="py-[12px] bg-white">
        <div className="container-lg-fluid">
          <div className="overflow-visible whitespace-nowrap px-[32px] flex justify-center items-center no-scrollbar w-full">
            <style>{`
              .no-scrollbar::-webkit-scrollbar {
                display: none !important;
              }
              .no-scrollbar {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
              }
            `}</style>
            <ul
              className="flex flex-row flex-nowrap overflow-x-auto overflow-y-hidden nav gap-[12px] no-scrollbar pb-[6px]"
              ref={scrollRef}
            >
              {categories.map((item) => (
                <li key={item._id} className="nav-item text-center">
                  <div
                    className={`flex items-center justify-center gap-[4px] rounded-[8px] text-[#374151] font-semibold text-[13px] px-[16px] py-[8px] border-b-[3px] border-solid border-transparent cursor-pointer transition-all duration-200 no-underline hover:bg-[#f0ebff] hover:text-[#8059ca] whitespace-nowrap ${location.pathname.startsWith(`/${item.slug}`) ||
                      (location.pathname.startsWith('/view-all-categories/') &&
                        location.pathname.split('/')[2] === item.slug)
                      ? "!border-b-[3px] !border-b-primary !text-[#8059ca] !rounded-none"
                      : ""
                      }`}
                    onClick={() => handleCategoryClick(item)}
                  >
                    <img
                      src={
                        item?.files
                          ? getImageUrl(item.files)
                          : "/assets/default.png"
                      }
                      title={item.name}
                      className="h-[20px] w-[20px] object-contain"
                      loading="lazy"
                    />
                    <span className="nav-text text-[12px]">
                      {item.name}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Right scroll arrow */}
      <button
        type="button"
        className={`absolute right-[2px] top-1/2 -translate-y-1/2 bg-white border border-solid border-[#e8e8e8] text-[#555] text-[11px] w-[28px] h-[28px] flex items-center justify-center p-0 rounded-full rounded-circle shadow-[0_2px_8px_rgba(0,0,0,0.12)] cursor-pointer z-10 transition-all duration-200 hover:bg-[#f0ebff] hover:text-[#8059ca] hover:border-[#c9b5f5] hover:shadow-[0_3px_10px_rgba(128,89,202,0.2)] transition-opacity duration-200 ${canScrollRight ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        style={{ borderRadius: "50%" }}
        onClick={scrollRight}
        aria-label="Scroll categories right"
      >
        <i className="fa-solid fa-chevron-right"></i>
      </button>
    </div >
  );
};

export default HealthcareNavigation;
