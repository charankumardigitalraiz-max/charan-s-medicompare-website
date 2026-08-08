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
    if (serviceType === "medicine" || serviceType === "medicines" || serviceType === "rx-medicines" || serviceType === "rx-medicines-and-more") {
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
    if (service === "medicines" || service === "medicine" || service === "rx-medicines" || service === "rx-medicines-and-more") return "MEDICINE";
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
    <span className="text-[18px] font-bold leading-none text-slate-500 select-none">
      {open ? "−" : "+"}
    </span>
  );

  const CheckboxRow = ({ isActive, label, count, onClick, disabled }) => (
    <div
      className={`flex items-center justify-between py-1.5 px-2 rounded-md transition-all duration-150 group ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:bg-purple-50/50"
        }`}
      onClick={disabled ? undefined : onClick}
    >
      <div className="flex items-center gap-2.5">
        <div
          className={`w-3.5 h-3.5 rounded-[3px] flex items-center justify-center shrink-0 transition-all duration-150 ${isActive
            ? "!border-1 !border-solid !border-[#321961] !bg-[#321961]"
            : "!border-1 !border-solid !border-[#64748b] !bg-white group-hover:!border-[#321961]"
            }`}
        >
          {isActive && (
            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
            </svg>
          )}
        </div>
        <span
          className={`text-[13px] font-medium transition-colors leading-tight ${isActive ? "text-[#321961]" : "text-slate-600 group-hover:text-slate-800"
            }`}
        >
          {label}
        </span>
      </div>
      {count !== undefined && (
        <span className="text-[11px] text-slate-400 ml-1">{count}</span>
      )}
    </div>
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
      <div className="flex items-center justify-center gap-1 py-1 my-1.5 flex-wrap">
        {showStartDots && (
          <div
            onClick={() => {
              const newActiveLetter = alphabetData[Math.max(0, start - 3)]?.value;
              scrollToLetter(newActiveLetter);
            }}
            className="w-7 h-7 shrink-0 rounded-full border border-solid border-slate-300 bg-white flex items-center justify-center text-xs font-semibold text-[#321961] cursor-pointer hover:bg-slate-100 transition-all duration-200"
          >
            ...
          </div>
        )}

        {alphabetData.slice(start, end + 1).map((alphaItem) => {
          const isActive = activeAlphabetLetter === alphaItem.value;
          return (
            <div
              key={alphaItem.value}
              onClick={() => scrollToLetter(alphaItem.value)}
              className={`w-7 h-7 shrink-0 rounded-full border-1 border-primary flex items-center justify-center text-xs font-semibold cursor-pointer transition-all duration-200 ${isActive
                ? "!border-[#321961] !bg-primary text-white shadow-sm"
                : "!border-[#64748b] bg-white text-[#321961] hover:!bg-purple-50 hover:!border-[#321961]"
                }`}
            >
              {alphaItem.label}
            </div>
          );
        })}

        {showEndDots && (
          <div
            onClick={() => {
              const newActiveLetter = alphabetData[Math.min(alphabetData.length - 1, end + 3)]?.value;
              scrollToLetter(newActiveLetter);
            }}
            className="w-7 h-7 shrink-0 rounded-full border border-solid border-slate-300 bg-white flex items-center justify-center text-xs font-semibold text-[#321961] cursor-pointer hover:bg-slate-100 transition-all duration-200"
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
                  className="!text-slate-400 hover:!text-[#321961] !font-medium !text-[11px] !py-0.5 !px-2 !rounded !border !border-solid !border-slate-200 hover:!border-[#321961] !bg-transparent hover:!bg-purple-50/50 !transition-all !duration-150 flex items-center gap-1 cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onClearFilters();
                  }}
                >
                  <i className="fas fa-redo text-[9px]"></i>
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
                service !== "medicines" &&
                service !== "rx-medicines" &&
                service !== "rx-medicines-and-more") &&
              categories?.data &&
              categories?.data?.length > 0 && (
                <>
                  <div className="max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-0.5 mt-1.5">
                    {categories?.data?.map((cat) => {
                      const isActive = selectedCategories.includes(cat.slug);
                      const isDefaultCategory = cat.slug === defaultCategoryId;
                      return (
                        <CheckboxRow
                          key={cat.slug}
                          isActive={isActive}
                          label={cat.name}
                          count={`(${cat.productCount || 0})`}
                          onClick={() => onCategoryToggle(cat.slug)}
                          disabled={isDefaultCategory}
                        />
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
                            if (typeof loadMoreCategories === "function") {
                              loadMoreCategories();
                            }
                          }}
                          disabled={categoryLoading}
                          className="w-full text-center py-1.5 px-3 !rounded-lg !border !border-[#321961] !text-[#321961] hover:!bg-[#321961] hover:!text-white transition-all !text-xs !font-semibold !cursor-pointer !bg-transparent !mt-2"
                        >
                          {categoryLoading ? "Loading..." : "View More"}
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
                            backgroundColor: "#321961",
                            height: 4,
                          },
                          rail: {
                            backgroundColor: "#e0e0e0",
                            height: 4,
                          },
                          handle: {
                            borderColor: "#321961",
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
                            color: "#321961",
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
                            color: "#321961",
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
                  <div className="max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-0.5 mt-1.5">
                    {brands?.data?.map((brand) => {
                      const isActive = selectedBrands.includes(brand.slug);
                      return (
                        <CheckboxRow
                          key={brand.slug}
                          isActive={isActive}
                          label={brand.name}
                          count={`(${brand.productCount || 0})`}
                          onClick={() => onBrandToggle(brand.slug)}
                        />
                      );
                    })}
                  </div>
                )}

                {openAccordion.brands &&
                  brands?.pagination?.page <
                  brands?.pagination?.totalPages && (
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (typeof loadMoreBrands === "function") {
                            loadMoreBrands();
                          }
                        }}
                        disabled={brandLoading}
                        className="w-full text-center py-1.5 px-3 !rounded-lg !border !border-[#321961] !text-[#321961] hover:!bg-[#321961] hover:!text-white transition-all !text-xs !font-semibold !cursor-pointer !bg-transparent !mt-2"
                      >
                        {brandLoading ? "Loading..." : "View More"}
                      </button>
                    </div>
                  )
                }



              </div>
            </>
          )}


          {complexityData.length > 0 && (
            <>
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5">
                <div
                  onClick={() => toggleAccordion("complexity")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">Complexity</span>
                  <PlusMinus open={openAccordion.complexity} />
                </div>

                {openAccordion.complexity && (
                  <div className="flex flex-col gap-0.5 mt-1.5">
                    {complexityData.map((form) => {
                      const isActive = Array.isArray(selectedComplexity) ? selectedComplexity.includes(form.value) : false;
                      const toggle = onComplexityToggle || onFormToggle;
                      return (
                        <CheckboxRow
                          key={form.value}
                          isActive={isActive}
                          label={form.label}
                          onClick={() => toggle(form.value)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {genderData.length > 0 && (
            <>
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5">
                <div
                  onClick={() => toggleAccordion("gender")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">Gender</span>
                  <PlusMinus open={openAccordion.gender} />
                </div>

                {openAccordion.gender && (
                  <div className="flex flex-col gap-0.5 mt-1.5">
                    {genderData.map((g) => {
                      const isActive = Array.isArray(selectedGender) ? selectedGender.includes(g.value) : false;
                      const toggle = onGenderToggle || onFormToggle;
                      return (
                        <CheckboxRow
                          key={g.value}
                          isActive={isActive}
                          label={g.label}
                          onClick={() => toggle(g.value)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {samplesData.length > 0 && (
            <>
              <hr className="border-t border-slate-100 my-0" />
              <div className="bg-white p-2.5">
                <div
                  onClick={() => toggleAccordion("samples")}
                  className="flex justify-between items-center py-2 px-3 font-semibold text-slate-800 text-xs cursor-pointer select-none hover:bg-slate-50/50 rounded-lg transition-colors"
                >
                  <span className="uppercase tracking-wider">Samples</span>
                  <PlusMinus open={openAccordion.samples} />
                </div>
                {openAccordion.samples && (
                  <div className="flex flex-col gap-0.5 mt-1.5">
                    {samplesData.map((s) => {
                      const isActive = Array.isArray(selectedSamples) ? selectedSamples.includes(s.value) : false;
                      const toggle = onSampleToggle || onFormToggle;
                      return (
                        <CheckboxRow
                          key={s.value}
                          isActive={isActive}
                          label={s.label}
                          onClick={() => toggle(s.value)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

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
                  <div className="flex flex-col gap-0.5 mt-1.5">
                    {conditionsData.map((c) => {
                      const isActive = Array.isArray(selectedConditions) ? selectedConditions.includes(c.value) : false;
                      const toggle = onConditionToggle || onFormToggle;
                      return (
                        <CheckboxRow
                          key={c.value}
                          isActive={isActive}
                          label={c.label}
                          onClick={() => toggle(c.value)}
                        />
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
                  <div className="flex flex-col gap-0.5 mt-1.5">
                    {types?.map((type) => {
                      const isActive = selectedTypes.includes(type.value);
                      return (
                        <CheckboxRow
                          key={type.value}
                          isActive={isActive}
                          label={type.label}
                          onClick={() => onTypeToggle(type.value)}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Medicine Form Section - Only show for medicines with data */}
          {(service === "medicine" || service === "medicines" || service === "rx-medicines" || service === "rx-medicines-and-more") && medicineForms && medicineForms.length > 0 && (
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
                  <div className="flex flex-col gap-0.5 mt-1.5">
                    {medicineForms?.map((form) => {
                      const isActive = selectedForms.includes(form.value);
                      return (
                        <CheckboxRow
                          key={form.value}
                          isActive={isActive}
                          label={form.label}
                          count={`(${form.productCount || 0})`}
                          onClick={() => onFormToggle(form.value)}
                        />
                      );
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
                  <div className="max-h-[160px] overflow-y-auto pr-1 flex flex-col gap-0.5 mt-1.5">
                    {compositions?.data?.map((composition) => {
                      const isActive = selectedCompositions.includes(composition.slug);
                      return (
                        <CheckboxRow
                          key={composition.slug}
                          isActive={isActive}
                          label={composition.name}
                          count={`(${composition.productCount || 0})`}
                          onClick={() => onCompositionToggle(composition.slug)}
                        />
                      );
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
                        className="w-full text-center py-1.5 px-3 !rounded-lg !border !border-[#321961] !text-[#321961] hover:!bg-[#321961] hover:!text-white transition-all !text-xs !font-semibold !cursor-pointer !bg-transparent !mt-2"
                      >
                        {compositionLoading ? "Loading..." : "View More"}
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