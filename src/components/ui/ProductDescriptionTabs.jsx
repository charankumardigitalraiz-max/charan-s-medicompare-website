import { Link } from "react-router-dom";
import DOMPurify from "dompurify";

const tabNamesByType = {
  medicine: [
    "Product Information",
    "Directions of Use",
    "Side Effects",
    "Precautions",
  ],
  surgeries: [
    "Surgery Information",
    "Pre Care & Post Care Surgery",
    "Risks & Side Effects",
    "Precaution Guidelines",
  ],
  labtests: [
    "Test Information",
    "Preparation Instructions",
    "Normal Range",
    "Precautions",
  ],
  diagnostics: [
    "Diagnostic Information",
    "Procedure Details",
    "Risks & Side Effects",
    "Precautions",
  ],
  healthcare: [
    "Service Information",
    "How It Works",
    "Benefits",
    "Precautions",
  ],
  nursingcare: [
    "Care Information",
    "Service Process",
    "Responsibilities",
    "Precautions",
  ],
  ambulanceservice: [
    "Service Information",
    "Coverage Area",
    "Emergency Guidelines",
    "Precautions",
  ],
  dentalservice: [
    "Treatment Information",
    "Procedure Details",
    "Risks & Side Effects",
    "After Care",
  ],
  medicalequipment: [
    "Equipment Information",
    "Usage Instructions",
    "Safety Guidelines",
    "Precautions",
  ],
  medicaltreatment: [
    "Treatment Information",
    "Procedure Steps",
    "Risks & Side Effects",
    "Precautions",
  ],
  homecare: ["Care Information", "Service Process", "Benefits", "Precautions"],
};

const defaultMessagesByType = {
  medicine: [
    "No Data.",
    "No directions of use available.",
    "No side effects information available.",
    "No precautions information available.",
  ],
  surgeries: [
    "No surgery information available.",
    "No pre care & post care surgery information available.",
    "No risks & side effects information available.",
    "No precaution guidelines available.",
  ],
  labtests: [
    "No test information available.",
    "No preparation instructions available.",
    "No normal range information available.",
    "No precautions information available.",
  ],
  diagnostics: [
    "No diagnostic information available.",
    "No procedure details available.",
    "No risks & side effects information available.",
    "No precautions information available.",
  ],
  healthcare: [
    "No service information available.",
    "No information on how it works available.",
    "No benefits information available.",
    "No precautions information available.",
  ],
  nursingcare: [
    "No care information available.",
    "No service process information available.",
    "No responsibilities information available.",
    "No precautions information available.",
  ],
  ambulanceservice: [
    "No service information available.",
    "No coverage area information available.",
    "No emergency guidelines available.",
    "No precautions information available.",
  ],
  dentalservice: [
    "No treatment information available.",
    "No procedure details available.",
    "No risks & side effects information available.",
    "No after care information available.",
  ],
  medicalequipment: [
    "No equipment information available.",
    "No usage instructions available.",
    "No safety guidelines available.",
    "No precautions information available.",
  ],
  medicaltreatment: [
    "No treatment information available.",
    "No procedure steps available.",
    "No risks & side effects information available.",
    "No precautions information available.",
  ],
  homecare: [
    "No care information available.",
    "No service process information available.",
    "No benefits information available.",
    "No precautions information available.",
  ],
};

const sanitizeHTML = (htmlContent) => {
  if (!htmlContent) return "";

  let cleanedContent = htmlContent
    .replace(/\\n/g, ' ')
    .replace(/\\t/g, ' ')
    .replace(/\\\\/g, '')
    .replace(/\\\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  return DOMPurify.sanitize(cleanedContent, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'b', 'i', 'ul', 'ol', 'li', 'span', 'div'],
    ALLOWED_ATTR: ['class']
  });
};

const ProductDescriptionTabs = ({
  isTabContentOpen,
  setIsTabContentOpen,
  activeTab,
  setActiveTab,
  showMoreProductInfo,
  setShowMoreProductInfo,
  showMoreDirections,
  setShowMoreDirections,
  showMoreSideEffects,
  setShowMoreSideEffects,
  showMorePrecautions,
  setShowMorePrecautions,
  tablet,
  product,
  getFirstNWords,
  hasMoreThanNWords,
  scrollToElement,
  isParamsOpen,
  setIsParamsOpen,
}) => {
  const productType =
    product?.tablet?.subcategorys?.category?.fixedType || "medicine";

  const isLabTestNormalRange =
    productType === "labtests" && activeTab === "sideEffectss";

  const getDefaultMessage = (tabIndex) => {
    return (
      defaultMessagesByType[productType]?.[tabIndex] ||
      defaultMessagesByType.medicine[tabIndex] ||
      "No information available."
    );
  };

  const hasProductInfo = !!(tablet?.description && tablet?.description !== "<p><br></p>" && typeof tablet.description === "string" && tablet.description.trim() !== "");
  const hasDirections = !!(tablet?.directionofuse || tablet?.preparationInstructions);
  const hasSideEffects = !!(tablet?.sideeffects || tablet?.parameterss?.length > 0);
  const hasPrecautions = !!tablet?.precaution;

  const tabs = [
    { id: "productInfo", label: tabNamesByType[productType]?.[0] || "Product Information", has: hasProductInfo },
    { id: "directionss", label: tabNamesByType[productType]?.[1] || "Directions of Use", has: hasDirections },
    { id: "sideEffectss", label: tabNamesByType[productType]?.[2] || "Side Effects", has: hasSideEffects },
    { id: "precuations", label: tabNamesByType[productType]?.[3] || "Precautions", has: hasPrecautions },
  ];

  return (
    <>
      <style>
        {`
    .product-description {
          font-size: 13px;
          font-family: "Poppins", sans-serif;
          line-height: 1.6;
          color: #222;       
          font-weight: 400;    
        }

        .product-description p,
        .product-description div,
        .product-description span,
        .product-description li,
        .product-description em {
          font-size: inherit;
          font-family: inherit;
          color: inherit;
          font-weight: inherit;
          margin: 0;
          padding: 0;
        }

        .product-description ul,
        .product-description ol {
          margin: 8px 0;
          padding-left: 20px;
        }

        .product-description li {
          margin: 4px 0;
          padding-left: 5px;
          list-style-position: outside;
        }

        .product-description ul li {
          list-style-type: disc;
        }

         .product-description ol li {
          list-style-type: decimal;
        }

        .product-description li[data-list="bullet"] {
          list-style-type: disc !important;
        }

        .product-description li[data-list="ordered"] {
          list-style-type: decimal !important;
        }

        .product-description .ql-ui {
          display: none !important;
        }

        .product-description p + p {
          margin-top: 6px;
        }

                `}
      </style>
      <div className="bg-white rounded-sm mt-4 shadow-sm border border-gray-100 overflow-hidden mb-4">
        {/* Toggle Bar */}
        <div
          className={`flex items-center justify-between px-5 py-4 border-b border-gray-200 cursor-pointer ${isTabContentOpen ? "bg-white" : "bg-black/[0.02]"}`}
          onClick={() => setIsTabContentOpen(!isTabContentOpen)}
        >
          <h5 className="m-0 !font-semibold !text-lg text-gray-800">Product Description</h5>
          <i
            className={`fas fa-chevron-${isTabContentOpen ? "up" : "down"} text-sm text-gray-500`}
          ></i>
        </div>

        <div className={`px-5 pb-5 ${isTabContentOpen ? "" : "bg-black/[0.02]"}`}>
          {/* Navigation Tabs - Emulating the .user-tabs .nav-tabs design */}
          <div
            className="flex overflow-x-auto whitespace-nowrap pb-2.5 gap-2 [&::-webkit-scrollbar]:!hidden md:bg-white md:p-1 md:border md:border-solid md:border-gray-200 md:rounded-md md:flex md:flex-row mt-4 mb-4"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {(() => {
              const tabIcons = {
                productInfo: "fa-solid fa-circle-info",
                directionss: "fa-solid fa-hand-holding-medical",
                sideEffectss: "fa-solid fa-triangle-exclamation",
                precuations: "fa-solid fa-user-shield",
              };

              return tabs.map((tab) => (
                <button
                  key={tab.id}
                  disabled={!tab.has}
                  onClick={(e) => {
                    e.preventDefault();
                    if (!tab.has) return;
                    setActiveTab(tab.id);
                    setShowMoreProductInfo(false);
                    setShowMoreDirections(false);
                    setShowMoreSideEffects(false);
                    setShowMorePrecautions(false);
                  }}
                  className={`flex-1 text-center whitespace-nowrap !text-[12.5px] md:!text-[13px] !font-bold py-2.5 px-4 transition-all duration-200 cursor-pointer
                    border border-solid md:border-t-transparent md:border-x-transparent md:border-b-2 md:rounded-none
                    ${activeTab === tab.id
                      ? "!bg-[#321961] !text-white !border-[#321961] md:!bg-purple-50/30 md:!text-[#321961] md:!border-b-[#321961] !rounded-sm md:!rounded-none"
                      : tab.has
                        ? "!bg-white !text-[#012047] !border-slate-200/80 hover:!text-[#321961] hover:!bg-slate-55 md:!bg-transparent md:!border-b-transparent md:hover:!bg-gray-50/50 !rounded-sm md:!rounded-none"
                        : "!bg-slate-50/30 !text-gray-300 !border-slate-100/50 cursor-not-allowed md:!bg-transparent md:!border-b-transparent !rounded-sm md:!rounded-none"
                    }`}
                >
                  <div className="flex items-center justify-center gap-1.5">
                    <i className={`${tabIcons[tab.id] || "fa-solid fa-circle-info"} text-[12px] opacity-90`}></i>
                    <span>{tab.label}</span>
                    {!tab.has && (
                      <i className="fas fa-lock text-[11px] opacity-60"></i>
                    )}
                  </div>
                </button>
              ));
            })()}
          </div>

          {/* Tab Content */}
          {isTabContentOpen && (
            <div className="tab-content pt-0">
              {/* Product Info */}
              {activeTab === "productInfo" && (
                <div>
                  {(() => {
                    const productContent = tablet?.description || "";
                    const isEmptyContent =
                      !productContent ||
                      productContent === "<p><br></p>" ||
                      productContent.trim() === "";
                    const sanitizedContent = sanitizeHTML(productContent);
                    return (
                      <>
                        <div className="product-description">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: showMoreProductInfo
                                ? !isEmptyContent ? sanitizedContent : "No Data."
                                : !isEmptyContent ? getFirstNWords(sanitizedContent, 50) : "No Data.",
                            }}
                          />
                        </div>
                        {productContent && hasMoreThanNWords(sanitizedContent, 50) && (
                          <div className="mt-3">
                            <span
                              className="text-xs font-semibold text-[#321961] hover:underline cursor-pointer"
                              onClick={() => {
                                const wasExpanded = showMoreProductInfo;
                                setShowMoreProductInfo(!showMoreProductInfo);
                                if (!wasExpanded) scrollToElement("productInfo");
                              }}
                            >
                              {showMoreProductInfo ? "View Less" : "View More"}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Directions */}
              {activeTab === "directionss" && (
                <div>
                  {(() => {
                    const directionsContent =
                      tablet?.directionofuse || tablet?.preparationInstructions || "";
                    const sanitizedContent = sanitizeHTML(directionsContent);
                    const finalContent = sanitizedContent || getDefaultMessage(1);
                    return (
                      <>
                        <div className="product-description">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: showMoreDirections ? finalContent : getFirstNWords(finalContent, 50),
                            }}
                          />
                        </div>
                        {directionsContent && hasMoreThanNWords(sanitizedContent, 50) && (
                          <div className="mt-3">
                            <span
                              className="text-xs font-semibold text-[#321961] hover:underline cursor-pointer"
                              onClick={() => {
                                const wasExpanded = showMoreDirections;
                                setShowMoreDirections(!showMoreDirections);
                                if (!wasExpanded) scrollToElement("directionss");
                              }}
                            >
                              {showMoreDirections ? "View Less" : "View More"}
                            </span>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Side Effects */}
              {activeTab === "sideEffectss" && (
                <div>
                  {!isLabTestNormalRange && (
                    <div className="product-description">
                      <div
                        dangerouslySetInnerHTML={{
                          __html: showMoreSideEffects
                            ? sanitizeHTML(tablet?.sideeffects || getDefaultMessage(2))
                            : getFirstNWords(sanitizeHTML(tablet?.sideeffects || getDefaultMessage(2)), 50),
                        }}
                      />
                    </div>
                  )}
                  {tablet?.sideeffects && hasMoreThanNWords(sanitizeHTML(tablet?.sideeffects || ""), 50) && (
                    <div className="mt-3 mb-4">
                      <span
                        className="text-xs font-semibold text-[#321961] hover:underline cursor-pointer"
                        onClick={() => {
                          const wasExpanded = showMoreSideEffects;
                          setShowMoreSideEffects(!showMoreSideEffects);
                          if (!wasExpanded) scrollToElement("sideEffectss");
                        }}
                      >
                        {showMoreSideEffects ? "View Less" : "View More"}
                      </span>
                    </div>
                  )}
                  {tablet?.parameterss?.length > 0 && (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
                      <div
                        className="flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200 cursor-pointer"
                        onClick={() => setIsParamsOpen(!isParamsOpen)}
                      >
                        <div className="flex items-center gap-2.5 font-semibold text-sm text-gray-800">
                          <span>Test Parameters</span>
                          <span className="bg-[#321961] text-white px-2 py-0.5 rounded-full text-xs font-bold">
                            {tablet.parameterss.length}
                          </span>
                        </div>
                        <i className={`fas fa-chevron-${isParamsOpen ? "up" : "down"} text-xs text-gray-400`}></i>
                      </div>
                      {isParamsOpen && (
                        <div className="p-4">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {tablet.parameterss.map((param, idx) => (
                              <span key={idx} className="bg-purple-50 text-[#321961] px-3 py-1 rounded-md text-xs font-medium border border-purple-100">
                                {param.name}
                              </span>
                            ))}
                          </div>
                          <div className="overflow-x-auto w-full">
                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200 text-gray-600 font-semibold">
                                  <th className="text-left px-3 py-2">S.No</th>
                                  <th className="text-left px-3 py-2">Parameter</th>
                                  <th className="text-left px-3 py-2">Male</th>
                                  <th className="text-left px-3 py-2">Female</th>
                                  <th className="text-left px-3 py-2">Child</th>
                                </tr>
                              </thead>
                              <tbody>
                                {tablet.parameterss.map((param, idx) => (
                                  <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                                    <td className="px-3 py-2 border-b border-gray-100 text-gray-500">{idx + 1}</td>
                                    <td className="px-3 py-2 border-b border-gray-100 font-medium text-gray-800">{param.name}</td>
                                    <td className="px-3 py-2 border-b border-gray-100 text-gray-600">
                                      {param.AdultMaleRange ? `${param.AdultMaleRange} ${param.units ? `(${param.units})` : ""}` : "-"}
                                    </td>
                                    <td className="px-3 py-2 border-b border-gray-100 text-gray-600">
                                      {param.AdultFemaleRange ? `${param.AdultFemaleRange} ${param.units ? `(${param.units})` : ""}` : "-"}
                                    </td>
                                    <td className="px-3 py-2 border-b border-gray-100 text-gray-600">
                                      {param.childnormalRange ? `${param.childnormalRange} ${param.units ? `(${param.units})` : ""}` : "-"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Precautions */}
              {activeTab === "precuations" && (
                <div>
                  <div className="product-description">
                    <div
                      dangerouslySetInnerHTML={{
                        __html: showMorePrecautions
                          ? sanitizeHTML(tablet?.precaution || getDefaultMessage(3))
                          : getFirstNWords(sanitizeHTML(tablet?.precaution || getDefaultMessage(3)), 50),
                      }}
                    />
                  </div>
                  {tablet?.precaution && hasMoreThanNWords(sanitizeHTML(tablet?.precaution || ""), 50) && (
                    <div className="mt-3">
                      <span
                        className="text-xs font-semibold text-[#321961] hover:underline cursor-pointer"
                        onClick={() => {
                          const wasExpanded = showMorePrecautions;
                          setShowMorePrecautions(!showMorePrecautions);
                          if (!wasExpanded) scrollToElement("precuations");
                        }}
                      >
                        {showMorePrecautions ? "View Less" : "View More"}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDescriptionTabs;
