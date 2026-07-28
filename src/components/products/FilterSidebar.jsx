import { useCallback, useMemo, useState, useEffect } from "react";
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
const mi_filter = "/assets/mi_filter.png";
import { axiosCommonInstance } from "../../Apiservice.jsx";

const FilterSidebar = ({
  categories,
  brands,
  types,
  compositions,
  medicineForms,
  selectedCategories,
  selectedBrands,
  selectedTypes,
  selectedForms,
  selectedComplexity,
  selectedGender,
  selectedSamples,
  selectedConditions,
  selectedCompositions,
  onCategoryToggle,
  onBrandToggle,
  onTypeToggle,
  onCompositionToggle,
  onFormToggle,
  onComplexityToggle,
  onGenderToggle,
  onSampleToggle,
  onConditionToggle,
  genderData,
  samplesData,
  conditionsData,
  defaultCategoryId,
  priceRange,
  availablePriceRange,
  onPriceRangeChange,
  service,
  isDesktopSidebarOpen,
  toggleSidebar,
  onAlphabetClick,
  alphabetData,
  complexityData,
  maincatId,
  onClearFilters,
  activeAlphabetLetter,
  userId,

  // ADD THESE
  loadMoreBrands,
  brandLoading,
  loadMoreCompositions,
  compositionLoading,
  loadMoreCategories,
  categoryLoading,
}) => {
  const [openAccordion, setOpenAccordion] = useState({
    category: true,
    price: true,
    brands: true,
    form: true,
    nature: true,
    compositions: true,
    complexity: true,
    gender: true,
    samples: true,
    conditions: true,
  });

  const toggleAccordion = (key) => {
    setOpenAccordion((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };
  const getDefaultPriceRange = (serviceType) => {
    if (serviceType === "medicine" || serviceType === "medicines") {
      return [1, 10000];
    }
    return [200, 100000];
  };

  const formatPrice = (price) => {
    if (typeof price !== "number") return "₹0";
    return `₹${price.toLocaleString("en-IN")}`;
  };

  const defaultPriceRange = getDefaultPriceRange(service);
  const defaultPriceRangeProp = priceRange || defaultPriceRange;
  const defaultAvailablePriceRange = availablePriceRange || defaultPriceRange;

  const formatter = (value) => `₹${value}`;
  const [localValue, setLocalValue] = useState(defaultPriceRangeProp);

  useEffect(() => {
    setLocalValue(defaultPriceRangeProp);
  }, [defaultPriceRangeProp]);

  const handlePriceChange = useCallback((values) => {
    setLocalValue(values);
  }, []);

  const handleAfterChange = useCallback(
    (values) => {
      onPriceRangeChange(values);
    },
    [onPriceRangeChange],
  );

  const sliderValue = useMemo(() => localValue, [localValue]);

  const HeadingName = (service) => {
    if (service === "medicines") return "MEDICINE";
    if (service === "surgeries") return "SURGERY";
    if (service === "lab-tests") return "LAB TEST";
    if (service === "diagnostics") return "DIAGNOSTIC";
    if (service === "home-care-services") return "HOME CARE SERVICE";
    if (service === "medical-equipment") return "MEDICAL EQUIPMENT";
    if (service === "nursing-care") return "NURSING CARE";
    if (service === "medical-treatment") return "MEDICAL TREATMENT";
    if (service === "healthcare") return "HEALTHCARE";
    if (service === "ambulance-service") return "AMBULANCE SERVICE";
    if (service === "dental-service") return "DENTAL SERVICE";
    return "";
  };

  const PlusMinus = ({ open }) => (
    <span
      style={{
        fontSize: "18px",
        fontWeight: "700",
        position: "relative",
        bottom: "6px",
      }}
    >
      {open ? "−" : "+"}
    </span>
  );

  const AlphabetBar = () => {
    const scrollToLetter = async (letter) => {
      if (activeAlphabetLetter === letter) {
        const element = document.getElementById(`category-${letter}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        return;
      }

      const isMobileView = window.innerWidth <= 990;
      const shouldMakeCall = (isMobileView && !isDesktopSidebarOpen) || (!isMobileView && isDesktopSidebarOpen);

      if (!shouldMakeCall) {
        if (onAlphabetClick) {
          onAlphabetClick({ data: null }, letter);
        }
        return;
      }

      const element = document.getElementById(`category-${letter}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      if (onAlphabetClick) {
        onAlphabetClick({ data: null }, letter);
      }
    };

    const getVisibleLetters = () => {
      const activeIndex = activeAlphabetLetter ? alphabetData.findIndex(item => item.value === activeAlphabetLetter) : 0;
      const range = 2;
      let start = Math.max(0, activeIndex - range);
      let end = Math.min(alphabetData.length - 1, activeIndex + range);
      if (end - start < 5) {
        if (start === 0) {
          end = Math.min(5, alphabetData.length - 1);
        } else if (end === alphabetData.length - 1) {
          start = Math.max(0, alphabetData.length - 5);
        }
      }
      return { start, end };
    };

    const { start, end } = getVisibleLetters();
    const showStartDots = start > 0;
    const showEndDots = end < alphabetData.length - 1;

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          padding: "4px 0",
          borderRadius: "8px",
          margin: "5px 0",
        }}
      >
        {showStartDots && (
          <div
            onClick={() => {
              const newActiveLetter = alphabetData[Math.max(0, start - 3)]?.value;
              scrollToLetter(newActiveLetter);
            }}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "#8059ca",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ...
          </div>
        )}

        {alphabetData.slice(start, end + 1).map((alphaItem) => (
          <div
            key={alphaItem.value}
            onClick={() => scrollToLetter(alphaItem.value)}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: `1px solid ${activeAlphabetLetter === alphaItem.value ? "#8059ca" : "#ccc"}`,
              backgroundColor: activeAlphabetLetter === alphaItem.value ? "#8059ca" : "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: activeAlphabetLetter === alphaItem.value ? "#fff" : "#8059ca",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (activeAlphabetLetter !== alphaItem.value) {
                e.target.style.backgroundColor = "#e0e0e0";
                e.target.style.color = "#8059ca";
              }
            }}
            onMouseLeave={(e) => {
              if (activeAlphabetLetter !== alphaItem.value) {
                e.target.style.backgroundColor = "#fff";
                e.target.style.color = "#8059ca";
              }
            }}
          >
            {alphaItem.label}
          </div>
        ))}

        {showEndDots && (
          <div
            onClick={() => {
              const newActiveLetter = alphabetData[Math.min(alphabetData.length - 1, end + 3)]?.value;
              scrollToLetter(newActiveLetter);
            }}
            style={{
              width: "28px",
              height: "28px",
              borderRadius: "50%",
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "12px",
              fontWeight: "600",
              color: "#8059ca",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            ...
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modern-filter-sidebar">
      <div className="card-body p-0">
        <div className="accordion-content">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "20px",
              fontSize: "17px",
              fontWeight: "600",
              color: "#000",
              cursor: "pointer",
            }}
            onClick={toggleSidebar}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span>Apply Filters</span>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {onClearFilters && (
                <button
                  type="button"
                  className="filter-clear-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClearFilters();
                  }}
                >
                  <i className="fas fa-redo me-1"></i>
                  Reset
                </button>
              )}
              {isDesktopSidebarOpen && (
                <div
                  className="bg-light"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSidebar();
                  }}
                  style={{
                    borderRadius: "50%",
                    width: "25px",
                    height: "25px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <i className="fas fa-times"></i>
                </div>
              )}
            </div>
          </div>
          <div className="modern-accordion-body bg-white">
            <div
              onClick={() => toggleAccordion("category")}
              style={{
                fontSize: "13px",
                fontWeight: "600",
                marginLeft: "15px",
                display: "flex",
                justifyContent: "space-between",
                paddingRight: "15px",
                cursor: "pointer",
                color: "#000",
              }}
            >
              {HeadingName(service)} CATEGORY
              <PlusMinus open={openAccordion.category} />
            </div>
            {openAccordion.category && <AlphabetBar />}

            {openAccordion.category &&
              (service !== "medicine" &&
                service !== "medicines") &&
              categories?.data &&
              categories?.data?.length > 0 && (
                <>
                  <div className="filter-scroll-container">
                    {categories?.data?.map((cat) => {
                      const isActive =
                        selectedCategories.includes(cat.slug);

                      const isDefaultCategory =
                        cat.slug === defaultCategoryId;

                      return (
                        <div
                          key={cat.slug}
                          className={`modern-checkbox-item ${isActive ? "active" : ""
                            } ${isDefaultCategory
                              ? "default-category"
                              : ""
                            }`}
                          onClick={() =>
                            onCategoryToggle(cat.slug)
                          }
                          style={{ marginLeft: "10px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: "5px",
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isActive}
                              disabled={isDefaultCategory}
                              readOnly
                            />

                            <span style={{ fontSize: "12px" }}>
                              {cat.name}
                            </span>
                          </div>

                          <span>
                            {cat.productCount || 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {categories?.pagination?.page <
                    categories?.pagination?.totalPages && (
                      <div style={{ padding: "10px" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();

                            if (
                              typeof loadMoreCategories ===
                              "function"
                            ) {
                              loadMoreCategories();
                            }
                          }}
                          disabled={categoryLoading}
                          className="view-more-btn"
                        >
                          {categoryLoading
                            ? "Loading..."
                            : "View More"}
                        </button>
                      </div>
                    )}
                </>
              )}

          </div>

          {/* price range sliders */}
          {/* {(service !== "medicine" && service !== "medicines") && (
            <>
              <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
              <div className="modern-accordion-body bg-white">
                <div
                  onClick={() => toggleAccordion("price")}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginLeft: "15px",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "15px",
                    cursor: "pointer",
                    color: "#000",
                  }}
                >
                  PRICE RANGE
                  <PlusMinus open={openAccordion.price} />
                </div>

                {openAccordion.price && (
                  <div className="filter-section">
                    <div
                      className="filter-section-body"
                      style={{ paddingLeft: "15px", paddingRight: "15px" }}
                    >
                      <Slider
                        range
                        tooltip={{ formatter }}
                        min={defaultAvailablePriceRange[0]}
                        max={defaultAvailablePriceRange[1]}
                        value={sliderValue}
                        onChange={handlePriceChange}
                        onAfterChange={handleAfterChange}
                        allowCross={false}
                        styles={{
                          track: {
                            backgroundColor: "#8059ca",
                            height: 4,
                          },
                          rail: {
                            backgroundColor: "#e0e0e0",
                            height: 4,
                          },
                          handle: {
                            borderColor: "#8059ca",
                            backgroundColor: "#fff",
                            width: 18,
                            height: 18,
                            marginTop: -7,
                            boxShadow: "0 2px 4px rgba(125, 46, 255, 0.3)",
                          },
                        }}
                      />
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "4px",
                            fontWeight: "500",
                          }}
                        >
                          Min
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#8059ca",
                          }}
                        >
                          {formatPrice(defaultPriceRangeProp[0])}
                        </div>
                      </div>
                      <div
                        style={{
                          color: "#999",
                          fontSize: "16px",
                          margin: "0 8px",
                        }}
                      >
                        -
                      </div>
                      <div style={{ textAlign: "center", flex: 1 }}>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#666",
                            marginBottom: "4px",
                            fontWeight: "500",
                          }}
                        >
                          Max
                        </div>
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "600",
                            color: "#8059ca",
                          }}
                        >
                          {formatPrice(defaultPriceRangeProp[1])}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )} */}

          {brands?.data?.length > 0 && (
            <>
              <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
              <div className="modern-accordion-body bg-white">
                <div
                  onClick={() => toggleAccordion("brands")}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "7px",
                    marginLeft: "15px",
                    color: "#191C1F",
                    lineHeight: "24px",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "15px",
                    cursor: "pointer",
                  }}
                >
                  POPULAR BRANDS
                  <PlusMinus open={openAccordion.brands} />
                </div>

                {openAccordion.brands && (
                  <div className="filter-scroll-container">
                    {brands?.data?.map((brand) => {
                      const isActive = selectedBrands.includes(brand.slug);
                      return (
                        <div
                          key={brand.slug}
                          className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                          onClick={() => onBrandToggle(brand.slug)}
                          style={{ marginLeft: "10px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <input type="checkbox" checked={isActive} readOnly />
                            <span style={{ fontSize: "12px", fontWeight: "500" }}>
                              {brand.name}
                            </span>
                          </div>
                          <span
                            style={{
                              backgroundColor: "#f0f0f0",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {brand.productCount || 0}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {openAccordion.brands &&
                  brands?.pagination?.page <
                  brands?.pagination?.totalPages && (
                    <div style={{ padding: "10px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          console.log("BRAND VIEW MORE");

                          if (typeof loadMoreBrands === "function") {
                            loadMoreBrands();
                          }
                        }}
                        disabled={brandLoading}
                        className="view-more-btn"
                      >
                        {
                          brandLoading
                            ? "Loading..."
                            : "View More"
                        }
                      </button>
                    </div>
                  )
                }



              </div>
            </>
          )}


          <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
          <div className="modern-accordion-body bg-white" style={{ display: complexityData.length > 0 ? "block" : "none" }}>
            <div
              onClick={() => toggleAccordion("complexity")}
              style={{
                fontSize: "13px",
                fontWeight: "600",
                marginLeft: "15px",
                display: "flex",
                justifyContent: "space-between",
                paddingRight: "15px",
                cursor: "pointer",
                color: "#000",
              }}
            >
              Complexity
              <PlusMinus open={openAccordion.complexity} />
            </div>

            {openAccordion.complexity && complexityData && complexityData.length > 0 &&
              complexityData.map((form) => {
                const isActive = Array.isArray(selectedComplexity)
                  ? selectedComplexity.includes(form.value)
                  : false;
                const toggle = onComplexityToggle || onFormToggle;
                return (
                  <div
                    key={form.value}
                    className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                    onClick={() => toggle(form.value)}
                    style={{ marginLeft: "10px" }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <input type="checkbox" checked={isActive} readOnly />
                      <span style={{ fontSize: "12px", fontWeight: "500" }}>
                        {form.label}
                      </span>
                    </div>
                    {/* <span
                      style={{
                        backgroundColor: "#f0f0f0",
                        fontSize: "12px",
                        fontWeight: "500",
                      }}
                    >
                      {form.productCount || 0}
                    </span> */}
                  </div>
                );
              })}

          </div>

          <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
          <div className="modern-accordion-body bg-white" style={{ display: genderData.length > 0 ? "block" : "none" }}>
            <div
              onClick={() => toggleAccordion("gender")}
              style={{
                fontSize: "13px",
                fontWeight: "600",
                marginLeft: "15px",
                display: "flex",
                justifyContent: "space-between",
                paddingRight: "15px",
                cursor: "pointer",
                color: "#000",
              }}
            >
              Gender
              <PlusMinus open={openAccordion.gender} />
            </div>

            {openAccordion.gender && genderData && genderData.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {genderData.map((g) => {
                  const isActive = Array.isArray(selectedGender) ? selectedGender.includes(g.value) : false;
                  const toggle = onGenderToggle || onFormToggle;
                  return (
                    <div
                      key={g.value}
                      className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                      onClick={() => toggle(g.value)}
                      style={{ marginLeft: "10px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <input type="checkbox" checked={isActive} readOnly />
                        <span style={{ fontSize: "12px", fontWeight: "500" }}>{g.label}</span>
                      </div>
                      {/* <span style={{ backgroundColor: "#f0f0f0", fontSize: "12px", fontWeight: "500" }}>{g.productCount || 0}</span> */}
                    </div>
                  );
                })}
              </div>
            )}
          </div>



          <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
          <div className="modern-accordion-body bg-white" style={{ display: samplesData.length > 0 ? "block" : "none" }}>
            <div
              onClick={() => toggleAccordion("samples")}
              style={{
                fontSize: "13px",
                fontWeight: "600",
                marginLeft: "15px",
                display: "flex",
                justifyContent: "space-between",
                paddingRight: "15px",
                cursor: "pointer",
                color: "#000",
              }}
            >
              Samples
              <PlusMinus open={openAccordion.samples} />
            </div>
            {openAccordion.samples && samplesData && samplesData.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {samplesData.map((s) => {
                  const isActive = Array.isArray(selectedSamples) ? selectedSamples.includes(s.value) : false;
                  const toggle = onSampleToggle || onFormToggle;
                  return (
                    <div
                      key={s.value}
                      className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                      onClick={() => toggle(s.value)}
                      style={{ marginLeft: "10px" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                        <input type="checkbox" checked={isActive} readOnly />
                        <span style={{ fontSize: "12px", fontWeight: "500" }}>{s.label}</span>
                      </div>
                      {/* <span style={{ backgroundColor: "#f0f0f0", fontSize: "12px", fontWeight: "500" }}>{s.productCount || 0}</span> */}
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Conditions Filter */}
          {conditionsData && conditionsData.length > 0 && (
            <>
              <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
              <div className="modern-accordion-body bg-white" style={{ display: conditionsData.length > 0 ? "block" : "none" }}>
                <div
                  onClick={() => toggleAccordion("conditions")}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "7px",
                    marginLeft: "15px",
                    // color: "#191C1F",
                    lineHeight: "24px",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "15px",
                    cursor: "pointer",
                    color: "#000",
                  }}
                >
                  Conditions
                  <PlusMinus open={openAccordion.conditions} />
                </div>
                {openAccordion.conditions && conditionsData && conditionsData.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {conditionsData.map((c) => {
                      const isActive = Array.isArray(selectedConditions) ? selectedConditions.includes(c.value) : false;
                      const toggle = onConditionToggle || onFormToggle;
                      return (
                        <div
                          key={c.value}
                          className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                          onClick={() => toggle(c.value)}
                          style={{ marginLeft: "10px" }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                            <input type="checkbox" checked={isActive} readOnly />
                            <span style={{ fontSize: "12px", fontWeight: "500" }}>{c.label}</span>
                          </div>
                          {/* <span style={{ backgroundColor: "#f0f0f0", fontSize: "12px", fontWeight: "500" }}>{c.productCount || 0}</span> */}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {types && types.length > 0 && (
            <>
              <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
              <div className="modern-accordion-body bg-white">
                <div
                  onClick={() => toggleAccordion("nature")}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "7px",
                    marginLeft: "15px",
                    color: "#191C1F",
                    lineHeight: "24px",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "15px",
                    cursor: "pointer",
                  }}
                >
                  Nature of Product
                  <PlusMinus open={openAccordion.nature} />
                </div>

                {openAccordion.nature &&
                  types?.map((type) => {
                    const isActive = selectedTypes.includes(type.value);
                    return (
                      <div
                        key={type.value}
                        className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                        onClick={() => onTypeToggle(type.value)}
                        style={{ marginLeft: "10px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <input type="checkbox" checked={isActive} readOnly />
                          <span style={{ fontSize: "12px", fontWeight: "500" }}>
                            {type.label}
                          </span>
                        </div>
                        {/* <span
                          style={{
                            backgroundColor: "#f0f0f0",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {type.productCount || 0}
                        </span> */}
                      </div>
                    )
                  })}
              </div>
            </>
          )}

          {/* Medicine Form Section - Only show for medicines with data */}
          {(service === "medicine" || service === "medicines") && medicineForms && medicineForms.length > 0 && (
            <>
              <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
              <div className="modern-accordion-body bg-white">
                <div
                  onClick={() => toggleAccordion("form")}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "7px",
                    marginLeft: "15px",
                    color: "#191C1F",
                    lineHeight: "24px",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "15px",
                    cursor: "pointer",
                  }}
                >
                  Medicine Form
                  <PlusMinus open={openAccordion.form} />
                </div>

                {openAccordion.form &&
                  medicineForms?.map((form) => {
                    const isActive = selectedForms.includes(form.value);
                    return (
                      <div
                        key={form.value}
                        className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                        onClick={() => onFormToggle(form.value)}
                        style={{ marginLeft: "10px" }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <input type="checkbox" checked={isActive} readOnly />
                          <span style={{ fontSize: "12px", fontWeight: "500" }}>
                            {form.label}
                          </span>
                        </div>
                        <span
                          style={{
                            backgroundColor: "#f0f0f0",
                            fontSize: "12px",
                            fontWeight: "500",
                          }}
                        >
                          {form.productCount || 0}
                        </span>
                      </div>
                    )
                  })}
              </div>
            </>
          )}


          {/* service === "medicine" || service === "medicines") &&  */}
          {/* Medicine Composition Section - Only show for medicines with data */}
          {(compositions && compositions?.data?.length > 0) && (
            <>
              <hr style={{ maxWidth: "100%", margin: "0px 0px 0px 0px" }} />
              <div className="modern-accordion-body bg-white">
                <div
                  onClick={() => toggleAccordion("compositions")}
                  style={{
                    fontSize: "13px",
                    fontWeight: "600",
                    marginBottom: "7px",
                    marginLeft: "15px",
                    color: "#191C1F",
                    lineHeight: "24px",
                    textAlign: "left",
                    display: "flex",
                    justifyContent: "space-between",
                    paddingRight: "15px",
                    cursor: "pointer",
                  }}
                >
                  Medicine Composition
                  <PlusMinus open={openAccordion.compositions} />
                </div>

                {openAccordion.compositions && (
                  <div className="filter-scroll-container">
                    {compositions?.data?.map((composition) => {
                      const isActive = selectedCompositions.includes(composition.slug);
                      return (
                        <div
                          key={composition.slug}
                          className={`modern-checkbox-item ${isActive ? "active" : ""} `}
                          onClick={() => onCompositionToggle(composition.slug)}
                          style={{ marginLeft: "10px" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "5px",
                            }}
                          >
                            <input type="checkbox" checked={isActive} readOnly />
                            <span style={{ fontSize: "12px", fontWeight: "500" }}>
                              {composition.name}
                            </span>
                          </div>
                          <span
                            style={{
                              backgroundColor: "#f0f0f0",
                              fontSize: "12px",
                              fontWeight: "500",
                            }}
                          >
                            {composition.productCount || 0}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {
                  compositions?.pagination?.page <
                  compositions?.pagination?.totalPages && (
                    <div style={{ padding: "10px" }}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          console.log("COMPOSITION VIEW MORE");

                          if (typeof loadMoreCompositions === "function") {
                            loadMoreCompositions();
                          }
                        }}
                        disabled={compositionLoading}
                        className="view-more-btn"
                      >
                        {
                          compositionLoading
                            ? "Loading..."
                            : "View More"
                        }
                      </button>
                    </div>
                  )
                }
              </div>

            </>
          )}


        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;