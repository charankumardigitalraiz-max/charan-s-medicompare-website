import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useEffect } from "react";

const Feature = () => {
  const location = useLocation();

  const { mobileSidebar } = useSelector(
    (state) => state.sidebarSlice
  );

  useEffect(() => {
  }, [location.pathname]);

  useEffect(() => {
    const handleCloseFilterClick = (event) => {
      const target = event.target;
      if (target.classList.contains("close-filter-btn")) {
        const dropdownMenu = target.closest(".dropdown-menu");
        if (dropdownMenu) {
          dropdownMenu.classList.remove("show");
          const dropdownWrapper = dropdownMenu.closest(".dropdown");
          if (dropdownWrapper) {
            const toggleButton = dropdownWrapper.querySelector("[data-toggle]");
            if (toggleButton) {
              toggleButton.classList.remove("show");
            }
          }
        }
      }
    };

    document.addEventListener("click", handleCloseFilterClick);
    return () => {
      document.removeEventListener("click", handleCloseFilterClick);
    };
  }, []);

  return (
    <div>
      <div className="main-wrapper">
        <Outlet />
      </div>
      <div
        className={`sidebar-overlay${mobileSidebar ? " opened" : ""}`}
      ></div>
    </div>
  );
};

export default Feature;
