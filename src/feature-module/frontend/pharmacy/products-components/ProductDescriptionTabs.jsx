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
      <div className="card shadow-sm rounded-3">
        <div
          className="card-body pt-0"
          style={{
            backgroundColor: isTabContentOpen ? "" : "rgba(0,0,0,0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "15px 0",
              borderBottom: "1px solid #e0e0e0",
              cursor: "pointer",
            }}
            onClick={() => setIsTabContentOpen(!isTabContentOpen)}
          >
            <h5
              className="mb-0"
              style={{ fontWeight: "600", fontSize: "18px" }}
            >
              Product Description
            </h5>
            <i
              className={`fas fa-chevron-${isTabContentOpen ? "up" : "down"}`}
              style={{ fontSize: "14px", color: "#666" }}
            ></i>
          </div>

          <nav className="user-tabs mb-3">
            <ul className="nav nav-tabs nav-tabs-bottom nav-justified">
              <li className="nav-item">
                <Link
                  className={`nav-link ${activeTab === "productInfo" ? "active" : ""} ${!hasProductInfo ? "disabled" : ""}`}
                  style={{ cursor: !hasProductInfo ? "not-allowed" : "pointer" }}
                  to="#productInfo"
                  data-bs-toggle="tab"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!hasProductInfo) return;
                    setActiveTab("productInfo");
                    setShowMoreProductInfo(false);
                    setShowMoreDirections(false);
                    setShowMoreSideEffects(false);
                    setShowMorePrecautions(false);
                  }}
                >
                  {tabNamesByType[
                    product?.tablet?.subcategorys?.category?.fixedType
                  ]?.[0] || "Product Information"}
                  {!hasProductInfo && (
                    <i className="fas fa-lock ms-2" style={{ fontSize: "12px", opacity: "0.6" }}></i>
                  )}
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${activeTab === "directionss" ? "active" : ""} ${!hasDirections ? "disabled" : ""}`}
                  style={{ cursor: !hasDirections ? "not-allowed" : "pointer" }}
                  to="#directionss"
                  data-bs-toggle="tab"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!hasDirections) return;
                    setActiveTab("directionss");
                    setShowMoreProductInfo(false);
                    setShowMoreDirections(false);
                    setShowMoreSideEffects(false);
                    setShowMorePrecautions(false);
                  }}
                >
                  {tabNamesByType[
                    product?.tablet?.subcategorys?.category?.fixedType
                  ]?.[1] || "Directions of Use"}
                  {!hasDirections && (
                    <i className="fas fa-lock ms-2" style={{ fontSize: "12px", opacity: "0.6" }}></i>
                  )}
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${activeTab === "sideEffectss" ? "active" : ""} ${!hasSideEffects ? "disabled" : ""}`}
                  style={{ cursor: !hasSideEffects ? "not-allowed" : "pointer" }}
                  to="#sideEffectss"
                  data-bs-toggle="tab"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!hasSideEffects) return;
                    setActiveTab("sideEffectss");
                    setShowMoreProductInfo(false);
                    setShowMoreDirections(false);
                    setShowMoreSideEffects(false);
                    setShowMorePrecautions(false);
                  }}
                >
                  {tabNamesByType[
                    product?.tablet?.subcategorys?.category?.fixedType
                  ]?.[2] || "Side Effects"}
                  {!hasSideEffects && (
                    <i className="fas fa-lock ms-2" style={{ fontSize: "12px", opacity: "0.6" }}></i>
                  )}
                </Link>
              </li>

              <li className="nav-item">
                <Link
                  className={`nav-link ${activeTab === "precuations" ? "active" : ""} ${!hasPrecautions ? "disabled" : ""}`}
                  style={{ cursor: !hasPrecautions ? "not-allowed" : "pointer" }}
                  to="#precuations"
                  data-bs-toggle="tab"
                  onClick={(e) => {
                    e.preventDefault();
                    if (!hasPrecautions) return;
                    setActiveTab("precuations");
                    setShowMoreProductInfo(false);
                    setShowMoreDirections(false);
                    setShowMoreSideEffects(false);
                    setShowMorePrecautions(false);
                  }}
                >
                  {tabNamesByType[
                    product?.tablet?.subcategorys?.category?.fixedType
                  ]?.[3] || "Precautions"}
                  {!hasPrecautions && (
                    <i className="fas fa-lock ms-2" style={{ fontSize: "12px", opacity: "0.6" }}></i>
                  )}
                </Link>
              </li>
            </ul>
          </nav>
          {isTabContentOpen && (
            <>
              <div className="tab-content pt-0 pd-tab-scroll">
                <div
                  role="tabpanel"
                  id="productInfo"
                  className={`tab-pane fade ${activeTab === "productInfo" ? "show active" : ""}`}
                >
                  <div className="row">
                    <div className="col-md-12">
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
                                      ? !isEmptyContent
                                        ? sanitizedContent
                                        : "No Data."
                                      : !isEmptyContent
                                        ? getFirstNWords(sanitizedContent, 50)
                                        : "No Data.",
                                  }}
                                />
                              </div>

                              {productContent &&
                                hasMoreThanNWords(sanitizedContent, 50) && (
                                  <div className="pd-read-more-wrapper">
                                    <span
                                      className="pd-read-more"
                                      onClick={() => {
                                        const wasExpanded = showMoreProductInfo;
                                        setShowMoreProductInfo(
                                          !showMoreProductInfo,
                                        );
                                        if (!wasExpanded) {
                                          scrollToElement("productInfo");
                                        }
                                      }}
                                    >
                                      {showMoreProductInfo
                                        ? "View Less"
                                        : "View More"}
                                    </span>
                                  </div>
                                )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  role="tabpanel"
                  id="directionss"
                  className={`tab-pane fade ${activeTab === "directionss" ? "show active" : ""}`}
                >
                  <div className="col-md-12">
                    <div>
                      {(() => {
                        const directionsContent =
                          tablet?.directionofuse ||
                          tablet?.preparationInstructions ||
                          "";

                        const sanitizedContent = sanitizeHTML(directionsContent);
                        const finalContent =
                          sanitizedContent || getDefaultMessage(1);

                        return (
                          <>
                            <div className="product-description">
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: showMoreDirections
                                    ? finalContent
                                    : getFirstNWords(finalContent, 50),
                                }}
                              />
                            </div>

                            {directionsContent &&
                              hasMoreThanNWords(sanitizedContent, 50) && (
                                <div className="pd-read-more-wrapper">
                                  <span
                                    className="pd-read-more"
                                    onClick={() => {
                                      const wasExpanded = showMoreDirections;
                                      setShowMoreDirections(
                                        !showMoreDirections,
                                      );
                                      if (!wasExpanded) {
                                        scrollToElement("directionss");
                                      }
                                    }}
                                  >
                                    {showMoreDirections
                                      ? "View Less"
                                      : "View More"}
                                  </span>
                                </div>
                              )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                <div
                  role="tabpanel"
                  id="sideEffectss"
                  className={`tab-pane fade ${activeTab === "sideEffectss" ? "show active" : ""}`}
                >
                  <div className="col-md-12">
                    <div>
                      {!isLabTestNormalRange && (
                        <div className="product-description">
                          <div
                            dangerouslySetInnerHTML={{
                              __html: showMoreSideEffects
                                ? sanitizeHTML(tablet?.sideeffects || getDefaultMessage(2))
                                : getFirstNWords(
                                  sanitizeHTML(tablet?.sideeffects || getDefaultMessage(2)),
                                  50,
                                ),
                            }}
                          />
                        </div>
                      )}

                      {tablet?.sideeffects &&
                        hasMoreThanNWords(sanitizeHTML(tablet?.sideeffects || ""), 50) && (
                          <div className="pd-read-more-wrapper">
                            <span
                              className="pd-read-more"
                              onClick={() => {
                                const wasExpanded = showMoreSideEffects;
                                setShowMoreSideEffects(!showMoreSideEffects);
                                if (!wasExpanded) {
                                  scrollToElement("sideEffectss");
                                }
                              }}
                            >
                              {showMoreSideEffects ? "View Less" : "View More"}
                            </span>
                          </div>
                        )}
                      {tablet?.parameterss?.length > 0 && (
                        <div
                          className="pd-params-section"
                          data-aos="fade-up"
                          data-aos-delay="150"
                        >
                          <div
                            className="pd-params-header"
                            onClick={() => setIsParamsOpen(!isParamsOpen)}
                          >
                            <div className="pd-params-title">
                              <span>Test Parameters</span>
                              <span className="pd-params-badge">
                                {tablet.parameterss.length}
                              </span>
                            </div>
                            <div className="pd-params-toggle">
                              <i
                                className={`fas fa-chevron-${isParamsOpen ? "up" : "down"
                                  }`}
                              ></i>
                            </div>
                          </div>
                          {isParamsOpen && (
                            <>
                              <div className="pd-params-content">
                                <div className="pd-params-tags">
                                  {tablet.parameterss.map((param, idx) => (
                                    <span key={idx} className="pd-param-tag">
                                      {param.name}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              <div className="pd-params-table-wrapper table-responsive">
                                <table className="table table-bordered table-striped table-hover align-middle">
                                  <thead className="table-light">
                                    <tr>
                                      <th>S.No</th>
                                      <th>Parameter</th>
                                      <th>Male</th>
                                      <th>Female</th>
                                      <th>Child</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tablet.parameterss.map((param, idx) => (
                                      <tr key={idx}>
                                        <td>{idx + 1}</td>

                                        <td>{param.name}</td>

                                        <td>
                                          {param.AdultMaleRange
                                            ? `${param.AdultMaleRange} ${param.units
                                              ? `(${param.units})`
                                              : ""
                                            }`
                                            : "-"}
                                        </td>

                                        <td>
                                          {param.AdultFemaleRange
                                            ? `${param.AdultFemaleRange} ${param.units
                                              ? `(${param.units})`
                                              : ""
                                            }`
                                            : "-"}
                                        </td>

                                        <td>
                                          {param.childnormalRange
                                            ? `${param.childnormalRange} ${param.units
                                              ? `(${param.units})`
                                              : ""
                                            }`
                                            : "-"}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  role="tabpanel"
                  id="precuations"
                  className={`tab-pane fade ${activeTab === "precuations" ? "show active" : ""}`}
                >
                  <div className="row">
                    <div className="col-md-12">
                      <div className="product-description">
                        <div
                          dangerouslySetInnerHTML={{
                            __html: showMorePrecautions
                              ? sanitizeHTML(tablet?.precaution || getDefaultMessage(3))
                              : getFirstNWords(
                                sanitizeHTML(tablet?.precaution || getDefaultMessage(3)),
                                50,
                              ),
                          }}
                        />
                      </div>
                      {tablet?.precaution &&
                        hasMoreThanNWords(sanitizeHTML(tablet?.precaution || ""), 50) && (
                          <div className="pd-read-more-wrapper">
                            <span
                              className="pd-read-more"
                              onClick={() => {
                                const wasExpanded = showMorePrecautions;
                                setShowMorePrecautions(!showMorePrecautions);
                                if (!wasExpanded) {
                                  scrollToElement("precuations");
                                }
                              }}
                            >
                              {showMorePrecautions ? "View Less" : "View More"}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProductDescriptionTabs;
