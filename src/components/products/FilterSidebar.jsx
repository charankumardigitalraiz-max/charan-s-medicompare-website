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
    <div className="bg-white rounded-2xl shadow-sm border border-purple-100/55 sticky top-28 pb-4">
      <div className="p-0">
        <div className="divide-y divide-slate-100">
          <div
            className="flex justify-between items-center py-3 px-4 text-base font-bold text-slate-800 border-b border-slate-100 cursor-pointer bg-gradient-to-r from-purple-50/30 to-white"
            onClick={toggleSidebar}
          >
            <div className="flex items-center gap-2.5">
              <span>Apply Filters</span>
            </div>

            <div
              className="flex items-center gap-2"
              onClick={(e) => e.stopPropagation()}
            >
              {onClearFilters && (
                <button
                  type="button"
                  className="text-[#8059ca] hover:text-[#6d3fc7] font-semibold text-xs py-1 px-2.5 rounded-md bg-purple-50 hover:bg-purple-100 transition-colors duration-150 border-0 flex items-center gap-1.5"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClearFilters();
                  }}
                >
                  <i className="fas fa-redo text-[10px]"></i>
                  Reset
                </button>
              )}
              {isDesktopSidebarOpen && (
                <div
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full w-6 h-6 text-xs flex items-center justify-center cursor-pointer transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSidebar();
                  }}
                >
                  <i className="fas fa-times"></i>
                </div>
              )}
            </div>
          </div>
          <div className="bg-white p-2.5">
            <div
              onClick={() => toggleAccordion("category")}
              className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
            >
              <span className="uppercase tracking-wider">{HeadingName(service)} CATEGORY</span>
              <PlusMinus open={openAccordion.category} />
            </div>
            {openAccordion.category && <AlphabetBar />}

            {openAccordion.category &&
              (service !== "medicine" &&
                service !== "medicines") &&
              categories?.data &&
              categories?.data?.length > 0 && (
                <>
                  <div className="max-h-[160px] overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1 mt-1.5">
                    {categories?.data?.map((cat) => {
                      const isActive =
                        selectedCategories.includes(cat.slug);

                      const isDefaultCategory =
                        cat.slug === defaultCategoryId;

                      return (
                        <div
                          key={cat.slug}
                          className="flex items-center justify-between py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                          onClick={() =>
                            onCategoryToggle(cat.slug)
                          }
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              disabled={isDefaultCategory}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                            />

                            <span className="text-[13px] text-slate-700">
                              {cat.name}
                            </span>
                          </div>

                          <span className="text-[11px] text-slate-400">
                            ({cat.productCount || 0})
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {categories?.pagination?.page <
                    categories?.pagination?.totalPages && (
                      <div className="p-2">
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
                          className="w-full text-center py-1.5 px-3 rounded-lg border border-[#8059ca] text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all text-xs font-semibold cursor-pointer bg-transparent mt-2 block !bg-transparent hover:!bg-[#8059ca] hover:!text-white !text-[#8059ca]"
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
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5">
                <div
                  onClick={() => toggleAccordion("brands")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">POPULAR BRANDS</span>
                  <PlusMinus open={openAccordion.brands} />
                </div>

                {openAccordion.brands && (
                  <div className="max-h-[160px] overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1 mt-1.5">
                    {brands?.data?.map((brand) => {
                      const isActive = selectedBrands.includes(brand.slug);
                      return (
                        <div
                          key={brand.slug}
                          className="flex items-center justify-between py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                          onClick={() => onBrandToggle(brand.slug)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                            />
                            <span className="text-[13px] text-slate-700">
                              {brand.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            ({brand.productCount || 0})
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
                        className="w-full text-center py-1.5 px-3 rounded-lg border border-[#8059ca] text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all text-xs font-semibold cursor-pointer bg-transparent mt-2 block !bg-transparent hover:!bg-[#8059ca] hover:!text-white !text-[#8059ca]"
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


          <hr className="border-t border-slate-100 my-0" />
          <div className="bg-white p-2.5" style={{ display: complexityData.length > 0 ? "block" : "none" }}>
            <div
              onClick={() => toggleAccordion("complexity")}
              className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
            >
              <span className="uppercase tracking-wider">Complexity</span>
              <PlusMinus open={openAccordion.complexity} />
            </div>

            {openAccordion.complexity && complexityData && complexityData.length > 0 && (
              <div className="flex flex-col gap-1 mt-1.5">
                {complexityData.map((form) => {
                  const isActive = Array.isArray(selectedComplexity)
                    ? selectedComplexity.includes(form.value)
                    : false;
                  const toggle = onComplexityToggle || onFormToggle;
                  return (
                    <div
                      key={form.value}
                      className="flex items-center py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                      onClick={() => toggle(form.value)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          readOnly
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                        />
                        <span className="text-[13px] text-slate-700">
                          {form.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-t border-slate-100 my-0" />
          <div className="bg-white p-2.5" style={{ display: genderData.length > 0 ? "block" : "none" }}>
            <div
              onClick={() => toggleAccordion("gender")}
              className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
            >
              <span className="uppercase tracking-wider">Gender</span>
              <PlusMinus open={openAccordion.gender} />
            </div>

            {openAccordion.gender && genderData && genderData.length > 0 && (
              <div className="flex flex-col gap-1 mt-1.5">
                {genderData.map((g) => {
                  const isActive = Array.isArray(selectedGender) ? selectedGender.includes(g.value) : false;
                  const toggle = onGenderToggle || onFormToggle;
                  return (
                    <div
                      key={g.value}
                      className="flex items-center py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                      onClick={() => toggle(g.value)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          readOnly
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                        />
                        <span className="text-[13px] text-slate-700">{g.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <hr className="border-t border-slate-100 my-0" />
          <div className="bg-white p-2.5" style={{ display: samplesData.length > 0 ? "block" : "none" }}>
            <div
              onClick={() => toggleAccordion("samples")}
              className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
            >
              <span className="uppercase tracking-wider">Samples</span>
              <PlusMinus open={openAccordion.samples} />
            </div>
            {openAccordion.samples && samplesData && samplesData.length > 0 && (
              <div className="flex flex-col gap-1 mt-1.5">
                {samplesData.map((s) => {
                  const isActive = Array.isArray(selectedSamples) ? selectedSamples.includes(s.value) : false;
                  const toggle = onSampleToggle || onFormToggle;
                  return (
                    <div
                      key={s.value}
                      className="flex items-center py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                      onClick={() => toggle(s.value)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isActive}
                          readOnly
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                        />
                        <span className="text-[13px] text-slate-700">{s.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

          {/* Conditions Filter */}
          {conditionsData && conditionsData.length > 0 && (
            <>
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5" style={{ display: conditionsData.length > 0 ? "block" : "none" }}>
                <div
                  onClick={() => toggleAccordion("conditions")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">Conditions</span>
                  <PlusMinus open={openAccordion.conditions} />
                </div>
                {openAccordion.conditions && conditionsData && conditionsData.length > 0 && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    {conditionsData.map((c) => {
                      const isActive = Array.isArray(selectedConditions) ? selectedConditions.includes(c.value) : false;
                      const toggle = onConditionToggle || onFormToggle;
                      return (
                        <div
                          key={c.value}
                          className="flex items-center py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                          onClick={() => toggle(c.value)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                            />
                            <span className="text-[13px] text-slate-700">{c.label}</span>
                          </div>
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
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5">
                <div
                  onClick={() => toggleAccordion("nature")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">Nature of Product</span>
                  <PlusMinus open={openAccordion.nature} />
                </div>

                {openAccordion.nature && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    {types?.map((type) => {
                      const isActive = selectedTypes.includes(type.value);
                      return (
                        <div
                          key={type.value}
                          className="flex items-center py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                          onClick={() => onTypeToggle(type.value)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                            />
                            <span className="text-[13px] text-slate-700">
                              {type.label}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Medicine Form Section - Only show for medicines with data */}
          {(service === "medicine" || service === "medicines") && medicineForms && medicineForms.length > 0 && (
            <>
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5">
                <div
                  onClick={() => toggleAccordion("form")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">Medicine Form</span>
                  <PlusMinus open={openAccordion.form} />
                </div>

                {openAccordion.form && (
                  <div className="flex flex-col gap-1 mt-1.5">
                    {medicineForms?.map((form) => {
                      const isActive = selectedForms.includes(form.value);
                      return (
                        <div
                          key={form.value}
                          className="flex items-center justify-between py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                          onClick={() => onFormToggle(form.value)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                            />
                            <span className="text-[13px] text-slate-700">
                              {form.label}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            ({form.productCount || 0})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Medicine Composition Section - Only show for medicines with data */}
          {(compositions && compositions?.data?.length > 0) && (
            <>
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5">
                <div
                  onClick={() => toggleAccordion("compositions")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">Medicine Composition</span>
                  <PlusMinus open={openAccordion.compositions} />
                </div>

                {openAccordion.compositions && (
                  <div className="max-h-[160px] overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1 mt-1.5">
                    {compositions?.data?.map((composition) => {
                      const isActive = selectedCompositions.includes(composition.slug);
                      return (
                        <div
                          key={composition.slug}
                          className="flex items-center justify-between py-1 px-2 hover:bg-purple-50/40 rounded-md cursor-pointer transition-colors"
                          onClick={() => onCompositionToggle(composition.slug)}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isActive}
                              readOnly
                              className="w-3.5 h-3.5 rounded border-slate-300 text-[#8059ca] focus:ring-[#8059ca]"
                            />
                            <span className="text-[13px] text-slate-700">
                              {composition.name}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            ({composition.productCount || 0})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                )}

                {compositions?.pagination?.page <
                  compositions?.pagination?.totalPages && (
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();

                          if (typeof loadMoreCompositions === "function") {
                            loadMoreCompositions();
                          }
                        }}
                        disabled={compositionLoading}
                        className="w-full text-center font-[600] py-1.5 px-3 rounded-lg border border-[#8059ca] text-[#8059ca] hover:bg-[#8059ca] hover:text-white transition-all text-xs font-semibold cursor-pointer bg-transparent mt-2 block !bg-transparent hover:!bg-[#8059ca] hover:!text-white !text-[#8059ca]"
                      >
                        {compositionLoading
                          ? "Loading..."
                          : "View More"}
                      </button>
                    </div>
                  )}
              </div>
            </>
          )}


        </div>
      </div>
    </div>
  );
};

export default FilterSidebar;