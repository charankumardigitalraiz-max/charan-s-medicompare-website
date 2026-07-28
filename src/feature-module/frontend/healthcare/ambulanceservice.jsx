import { useState, useEffect } from "react";
import AmbulanceBookingModal from "./AmbulanceBookingModal.jsx";
import { getImageUrl } from "../../../utils/index";
import { axiosCommonInstance } from "../../../Apiservice";
import toast from "react-hot-toast";
import Slider from "react-slick";
import { getHealthcareTwoSlideOfferSettings } from "./healthcareSliderSettings.jsx";
import SEOHelmet from "../../../components/SEOHelmet";
const ambulanceservice = ({
  imgUrl,
  categories,
  categories1,
  middleBanners,
  isMobile,
  selectedPincode,
  latitude,
  longitude,
  hasTopBanner = false,
}) => {
  const [expandedFaq, setExpandedFaq] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredEmergencyVehicles, setFilteredEmergencyVehicles] = useState(
    [],
  );

  const [emergencyCurrentPage, setEmergencyCurrentPage] = useState(1);
  const emergencyItemsPerPage = 8;

  const [topBookedCurrentPage, setTopBookedCurrentPage] = useState(1);
  const topBookedItemsPerPage = 4;

  const handleBookNow = (e, vehicle) => {
    e.stopPropagation();
    setSelectedCategory(vehicle);
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setSelectedCategory(null);
  };

  const handleSearch = async (query) => {
    if (!query || query.trim() === "") {
      setSearchResults([]);
      setFilteredEmergencyVehicles([]);
      return;
    }

    setIsLoading(true);
    try {
      let apiUrl = `search/ambulanceservice?search=${encodeURIComponent(query.trim())}`;
      if (selectedPincode) {
        apiUrl += `&location=${selectedPincode}`;
        if (latitude && longitude) {
          apiUrl += `&lat=${latitude}&lng=${longitude}`;
        }
      }

      const response = await axiosCommonInstance.get(apiUrl);
      const products = response?.data?.data?.products || [];
      setSearchResults(products);
      setFilteredEmergencyVehicles(products);
    } catch (error) {
      toast.error("Error searching ambulance services:", error);
      setSearchResults([]);
      setFilteredEmergencyVehicles([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (!value || value.trim() === "") {
      setSearchResults([]);
      setFilteredEmergencyVehicles([]);
    } else {
      handleSearch(value);
    }
  };

  const settings = getHealthcareTwoSlideOfferSettings();

  const faqs = [
    {
      id: 1,
      question: "What types of ambulance services does MediCompares offer?",
      answer:
        "We provide Basic Life Support (BLS), Advanced Life Support (ALS), ICU ambulances, neonatal ambulances, and non-emergency patient transport services.",
    },
    {
      id: 2,
      question: "How quickly can an ambulance reach my location?",
      answer:
        "Response times vary by location, but we aim to dispatch the nearest available ambulance immediately to ensure the fastest possible arrival.",
    },
    {
      id: 3,
      question: "Can I book an ambulance for a non-emergency situation?",
      answer:
        "Yes, you can book ambulances for routine hospital visits, patient transfers, medical appointments, and planned transportation.",
    },
    {
      id: 4,
      question: "Do the ambulances have trained medical staff?",
      answer:
        "Yes. Depending on the ambulance type, vehicles are staffed with trained EMTs, paramedics, nurses, or doctors to provide appropriate medical support.",
    },
    {
      id: 5,
      question: "Are the ambulance charges covered by insurance?",
      answer:
        "Some insurance providers cover ambulance charges for emergencies. Coverage varies by policy, so it’s recommended to confirm with your insurer.",
    },
  ];

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const emergencyTotalPages = Math.ceil(
    (filteredEmergencyVehicles.length > 0
      ? filteredEmergencyVehicles
      : categories?.length || 0) / emergencyItemsPerPage,
  );
  const emergencyStartIndex =
    (emergencyCurrentPage - 1) * emergencyItemsPerPage;
  const emergencyEndIndex = emergencyStartIndex + emergencyItemsPerPage;
  const emergencyCurrentItems =
    (filteredEmergencyVehicles.length > 0
      ? filteredEmergencyVehicles
      : categories
    )?.slice(emergencyStartIndex, emergencyEndIndex) || [];

  const topBookedTotalPages = Math.ceil(
    (categories1?.length || 0) / topBookedItemsPerPage,
  );
  const topBookedStartIndex =
    (topBookedCurrentPage - 1) * topBookedItemsPerPage;
  const topBookedEndIndex = topBookedStartIndex + topBookedItemsPerPage;
  const topBookedCurrentItems =
    categories1?.slice(topBookedStartIndex, topBookedEndIndex) || [];

  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="pagination dashboard-pagination mt-4">
        <ul className="d-flex justify-content-center align-items-center gap-1">
          <li>
            <button
              className="page-link"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="fa-solid fa-chevron-left" />
            </button>
          </li>

          {Array.from({ length: totalPages }, (_, i) => {
            const page = i + 1;

            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <li key={page}>
                  <button
                    className={`page-link ${currentPage === page ? "active" : ""
                      }`}
                    onClick={() => onPageChange(page)}
                  >
                    {page}
                  </button>
                </li>
              );
            }

            if (page === currentPage - 2 || page === currentPage + 2) {
              return (
                <li key={`dots-${page}`}>
                  <span className="page-link disabled">…</span>
                </li>
              );
            }

            return null;
          })}

          <li>
            <button
              className="page-link"
              onClick={() =>
                onPageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <i className="fa-solid fa-chevron-right" />
            </button>
          </li>
        </ul>
      </div>
    );
  };

  const PRIMARY_COLOR = "#8059ca";
  const PRIMARY_SECTION_BG = "#f8f4ff";
  const PRIMARY_DARK = "#6d48b8";
  const PRIMARY_GRADIENT = `linear-gradient(135deg, ${PRIMARY_COLOR} 0%, ${PRIMARY_DARK} 100%)`;
  const medicomparesSectionStyle = {
    backgroundColor: "#E8E4F5",
    backgroundImage: "url('/assets/Medicompares%20Background.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
  const gradientHeadingStyle = {
    background: PRIMARY_GRADIENT,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    color: PRIMARY_COLOR,
  };

  return (
    <>
      <SEOHelmet page="ambulance" />
      <section
        className={`search-section1 ${isMobile ? "hidden p-0" : "block p-[20px]"} relative mt-0 z-[9]`}
      >
        <div
          className="container-fluid px-3 px-md-4 max-w-[850px]"
        >
          <div className="row">
            <div className="col-12 mt-3">
              <div
                className="search-wrapper1 mx-auto max-w-[850px]"
              >
                <form onSubmit={(e) => e.preventDefault()}>
                  <div
                    className={`bg-white rounded-[30px] border-[1.5px] border-solid border-[#e5e7eb] shadow-[0_1px_3px_rgba(0,0,0,0.02),0_1px_2px_rgba(0,0,0,0.01)] transition-all duration-300 ease-in-out overflow-hidden relative ${isMobile ? "hidden" : "flex"} items-center p-[8px] gap-[8px]`}
                  >
                    <div
                      className="flex items-center justify-center w-[25px] h-[25px] text-[#9ca3af] shrink-0"
                    >
                      <i
                        className="fas fa-search text-[14px] text-[#9ca3af]"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Search Ambulance Services..."
                      className="search-input border-none outline-none flex-1 text-[clamp(14px,2vw,16px)] p-0 text-[#111827] bg-transparent font-inherit font-normal min-w-0"
                      value={searchQuery}
                      onChange={handleInputChange}
                    />

                    {isLoading && (
                      <div
                        className="spinner-border spinner-border-sm w-[16px] h-[16px] border-[2px]"
                        role="status"
                        style={{
                          color: PRIMARY_COLOR,
                        }}
                      >
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    )}

                  </div>
                </form>
              </div>
            </div>
          </div>
        </div >
      </section >

      <div className="d-flex justify-content-center gap-2 gap-md-4 my-3 flex-wrap px-3">
        <button
          className={`btn btn-light cursor-not-allowed ${isMobile ? "text-[12px] py-[8px] px-[14px]" : "text-[15px] py-[10px] px-[24px]"}`}
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Service is not available at the moment"
        >
          Emergency Services
        </button>

        <button
          className={`btn btn-primary ${isMobile ? "text-[12px] py-[8px] px-[14px]" : "text-[15px] py-[10px] px-[24px]"}`}
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Patient Transport Services"
        >
          Patient Transport Services
        </button>
      </div>

      {
        !isLoading && searchQuery && searchResults.length === 0 && (
          <section
            className="mx-2 py-[20px] px-0 bg-white"
          >
            <div className="container-fluid text-center">
              <p className="text-muted">
                No ambulance services found for "{searchQuery}"
              </p>
            </div>
          </section>
        )
      }

      {
        (filteredEmergencyVehicles.length > 0 ||
          (categories && categories.length > 0 && !searchQuery)) && (
          <section className="mx-2 pt-2" style={{ backgroundColor: PRIMARY_SECTION_BG }}>
            <div className="container-fluid">
              <h2
                className="text-[26px] font-semibold mb-[10px] pb-[10px] text-center"
                style={gradientHeadingStyle}
              >
                Patient Transport Services
                {filteredEmergencyVehicles.length > 0 &&
                  ` (${filteredEmergencyVehicles.length})`}
              </h2>

              <div className="row g-4">
                {emergencyCurrentItems.map((vehicle, index) => (
                  <div
                    key={emergencyStartIndex + index}
                    className="col-12 col-sm-6 col-md-3"
                  >
                    <div
                      className="ambulance-cards text-start"
                      key={vehicle._id || index}
                    >
                      <img
                        src={
                          vehicle?.tabletdetails?.files?.length
                            ? getImageUrl(vehicle.tabletdetails.files[0])
                            : "/assets/default.png"
                        }
                        className="ambulance-img"
                        alt={vehicle?.tabletdetails?.name}
                        title={vehicle?.tabletdetails?.name}
                        loading="lazy"
                      />

                      <div
                        className="text-dark text-start fw-bold mt-2 text-[13px] capitalize"
                      >
                        {vehicle?.tabletdetails?.name}
                      </div>

                      <div className="verifiedss text-start">✔ Verified</div>

                      <div className="text-muted small mt-1 text-start">
                        Facilities:
                      </div>

                      <div className="facilitiesss text-start d-flex gap-2 flex-wrap">
                        {vehicle?.tabletdetails?.facilitiesdetails?.length > 0 ? (
                          vehicle.tabletdetails.facilitiesdetails.map(
                            (facility) => (
                              <img
                                key={facility._id}
                                src={
                                  facility?.files?.[0]
                                    ? getImageUrl(facility.files[0])
                                    : "/assets/default.png"
                                }
                                className="facility-icon"
                                title={facility?.name || "Facility"}
                                alt={facility?.name || "Facility"}
                                loading="lazy"
                              />
                            ),
                          )
                        ) : (
                          <img
                            src="/assets/default.png"
                            className="facility-icon"
                            alt="No Facility"
                          />
                        )}
                      </div>

                      <button
                        className="book-btnss"
                        onClick={(e) => handleBookNow(e, vehicle)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={emergencyCurrentPage}
                totalPages={emergencyTotalPages}
                onPageChange={setEmergencyCurrentPage}
              />
            </div>
          </section>
        )
      }

      {
        categories1 && categories1.length > 0 && (
          <section
            className="mx-2 py-[20px] px-0"
            style={{ backgroundColor: PRIMARY_SECTION_BG }}
          >
            <div className="container-fluid">
              <h2
                className="text-[36px] font-bold mb-[10px] text-center"
                style={gradientHeadingStyle}
              >
                Top Most Booked Ambulances
              </h2>

              <div className="row g-4">
                {topBookedCurrentItems.map((vehicle, index) => (
                  <div
                    key={topBookedStartIndex + index}
                    className="col-12 col-sm-6 col-md-3"
                  >
                    <div
                      className="ambulance-cards text-start"
                      key={vehicle._id || index}
                    >
                      <img
                        src={
                          vehicle?.tabletdetails?.files?.length
                            ? getImageUrl(vehicle.tabletdetails.files[0])
                            : "/assets/default.png"
                        }
                        className="ambulance-img"
                        alt={vehicle?.tabletdetails?.name}
                        title={vehicle?.tabletdetails?.name}
                        loading="lazy"
                      />

                      <div
                        className="text-dark text-start fw-bold mt-2"
                        style={{ fontSize: "13px", textTransform: "capitalize" }}
                      >
                        {vehicle?.tabletdetails?.name}
                      </div>

                      <div className="verifiedss text-start">✔ Verified</div>

                      <div className="text-muted small mt-1 text-start">
                        Facilities:
                      </div>
                      <div className="facilitiesss text-start d-flex gap-2 flex-wrap">
                        {vehicle?.tabletdetails?.facilitiesdetails?.length > 0 ? (
                          vehicle.tabletdetails.facilitiesdetails.map(
                            (facility) => (
                              <img
                                key={facility._id}
                                src={
                                  facility?.files?.[0]
                                    ? getImageUrl(facility.files[0])
                                    : "/assets/default.png"
                                }
                                className="facility-icon"
                                title={facility?.name || "Facility"}
                                alt={facility?.name || "Facility"}
                                loading="lazy"
                              />
                            ),
                          )
                        ) : (
                          <img
                            src="/assets/default.png"
                            className="facility-icon"
                            alt="No Facility"
                          />
                        )}
                      </div>

                      <button
                        className="book-btnss"
                        onClick={(e) => handleBookNow(e, vehicle)}
                      >
                        Book Now
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <Pagination
                currentPage={topBookedCurrentPage}
                totalPages={topBookedTotalPages}
                onPageChange={setTopBookedCurrentPage}
              />
            </div>
          </section>
        )
      }

      {
        middleBanners?.length > 0 && (
          <section
            className="section welcome-section px-3 mt-3 "
            style={{ backgroundColor: PRIMARY_SECTION_BG, minHeight: "280px" }}
          >
            <div className="container-fluid">
              <div className="text-center mb-3">
                <h2 className="mb-3" style={{ fontSize: "28px", fontWeight: "700" }}>
                  <i className="fas fa-bolt me-2" style={{ color: PRIMARY_COLOR }} />
                  <span style={gradientHeadingStyle}>Offers & Promotions</span>
                </h2>
              </div>
              {middleBanners.length > 1 ? (
                <Slider {...settings}>
                  {middleBanners.map((image, index) => (
                    <div key={index} className="col-lg-4 col-md-6 d-flex">
                      <img
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        className="px-1"
                        style={{
                          borderRadius: "10px",
                        }}
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="col-lg-12 d-flex">
                  <img
                    src={middleBanners[0]?.src}
                    alt={middleBanners[0]?.alt}
                    title={middleBanners[0]?.alt}
                    loading="lazy"
                    className="px-1"
                    style={{ borderRadius: "10px" }}
                  />
                </div>
              )}
            </div>
          </section>
        )
      }

      {/* <section style={{ padding: "60px 0", ...medicomparesSectionStyle }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "600",
                marginBottom: "8px",
                ...gradientHeadingStyle,
              }}
            >
              Special Offers
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: "#666",
                fontWeight: "400",
              }}
            >
              Save more on emergency ambulance services
            </p>
          </div>

          <div className="row g-3 justify-content-center">
            {[
              {
                title: "Emergency Offer",
                discount: "10% off up to ₹12,000",
                code: "AMBN10",
                featured: true,
              },
              {
                title: "Quick Support",
                discount: "5% off up to ₹6,000",
                code: "AMB5",
                featured: false,
              },
              {
                title: "Medical Transport",
                discount: "10% off up to ₹10,000",
                code: "AMB10",
                featured: true,
              },
            ].map((offer, index) => (
              <div key={index} className="col-lg-4 col-md-6">
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "12px",
                    padding: "20px",
                    border: offer.featured
                      ? `2px solid ${PRIMARY_COLOR}`
                      : "1px solid rgba(128, 89, 202, 0.15)",
                    position: "relative",
                    transition: "all 0.3s ease",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {offer.featured && (
                    <div
                      style={{
                        position: "absolute",
                        top: "-8px",
                        right: "16px",
                        background: PRIMARY_GRADIENT,
                        color: "#fff",
                        padding: "4px 12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        borderRadius: "12px",
                        boxShadow: "0 2px 8px rgba(255, 193, 7, 0.3)",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                      }}
                    >
                      Popular
                    </div>
                  )}

              
                  <div
                    style={{
                      display: "flex",
                      gap: "16px",
                      alignItems: "flex-start",
                    }}
                  >
           
                    <div
                      style={{
                        width: "56px",
                        height: "56px",
                        background: PRIMARY_GRADIENT,
                        borderRadius: "12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                      }}
                    >
                      <i
                        className="fas fa-percent"
                        style={{
                          fontSize: "24px",
                          color: "#fff",
                        }}
                      />
                    </div>

                 
                    <div style={{ flex: 1 }}>
                      <h5
                        style={{
                          fontSize: "18px",
                          fontWeight: "600",
                          color: "#1a1a1a",
                          marginBottom: "6px",
                          lineHeight: "1.2",
                        }}
                      >
                        {offer.title}
                      </h5>
                      <p
                        style={{
                          fontSize: "15px",
                          fontWeight: "600",
                          color: "#333",
                          marginBottom: "8px",
                          lineHeight: "1.3",
                        }}
                      >
                        {offer.discount}
                      </p>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          background: PRIMARY_SECTION_BG,
                          padding: "6px 12px",
                          borderRadius: "6px",
                          border: "1px dashed rgba(128, 89, 202, 0.3)",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: "700",
                            color: PRIMARY_COLOR,
                            fontFamily: "monospace",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {offer.code}
                        </span>
                        <i
                          className="fas fa-copy"
                          style={{
                            fontSize: "12px",
                            color: "#999",
                            cursor: "pointer",
                          }}
                          title="Copy code"
                        />
                      </div>
                    </div>
                  </div>

              
                  <div
                    style={{
                      marginTop: "12px",
                      fontSize: "11px",
                      color: "#999",
                      fontStyle: "italic",
                    }}
                  >
                    *Terms & conditions apply
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section> */}

      <section
        className={`py-[30px] px-0 lg:py-[50px]`}
        style={medicomparesSectionStyle}
      >
        <div className="container-fluid max-w-[1320px]">
          {/* Section Header */}
          <div className="row mb-4">
            <div className="col-12 text-center">
              <div
                className="inline-flex items-center gap-[8px] bg-[rgba(128,89,202,0.1)] border border-solid border-[rgba(128,89,202,0.25)] rounded-[30px] py-[6px] px-[18px] text-[13px] font-bold tracking-[0.8px] uppercase mb-[12px] backdrop-blur-[4px]"
                style={{
                  color: PRIMARY_COLOR,
                }}
              >
                <i className="fas fa-bolt" style={{ color: "#eab308" }} /> Fast Emergency Dispatch
              </div>
              <h2
                className={`font-[750] text-center mb-[10px] tracking-[-0.5px] ${isMobile ? "text-[28px]" : "text-[38px]"}`}
                style={gradientHeadingStyle}
              >
                Booking Process
              </h2>
              <p
                className={`text-[#64748b] max-w-[600px] mx-auto leading-[1.6] ${isMobile ? "text-[14px]" : "text-[16px]"}`}
              >
                Get immediate medical transit in 3 simple steps — transparent pricing, instant assignment, and live GPS tracking.
              </p>
            </div>
          </div>

          {/* Main Outer Container */}
          <div
            className={`bg-white rounded-[24px] border border-solid border-[#e2e8f0] shadow-[0_12px_35px_rgba(128, 89, 202, 0.07)] ${isMobile ? "py-[20px] px-[16px]" : "py-[36px] px-[32px]"}`}
          >
            <div className="row align-items-center g-4">
              {/* Left Column: Clean Image Showcase Card */}
              <div className="col-lg-5 col-md-12">
                <div
                  className="bg-white rounded-[20px] p-[12px] relative shadow-[0_10px_30px_rgba(128,89,202,0.1)] border-[1.5px] border-solid border-[rgba(128,89,202,0.15)] overflow-hidden"
                >
                  {/* Floating Live Dispatch Badge Overlay */}
                  {/* <div
                    style={{
                      position: "absolute",
                      top: "24px",
                      left: "24px",
                      background: "rgba(15, 23, 42, 0.85)",
                      backdropFilter: "blur(12px)",
                      color: "#ffffff",
                      padding: "6px 14px",
                      borderRadius: "30px",
                      fontSize: "11.5px",
                      fontWeight: "700",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      border: "1px solid rgba(255, 255, 255, 0.2)",
                      zIndex: 10,
                      boxShadow: "0 4px 15px rgba(0, 0, 0, 0.25)",
                    }}
                  >
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 8px #22c55e",
                        display: "inline-block",
                      }}
                    />
                    LIVE DISPATCH ACTIVE
                  </div> */}

                  {/* Main Illustration Image */}
                  <img
                    src="/assets/img/ambulance_booking_illustration.png"
                    alt="Ambulance Booking Process Illustration"
                    className={`w-full h-auto object-cover rounded-[14px] block transition-transform duration-400 ease-in-out hover:scale-[1.02] ${isMobile ? "max-h-[320px]" : "max-h-[420px]"}`}
                  />

                  {/* Clean Bottom Feature Strip */}
                  <div
                    className="flex items-center justify-between gap-[8px] mt-[12px] pt-[4px] pb-0 px-[4px]"
                  >
                    <span
                      className="flex-1 flex items-center justify-center gap-[6px] text-[11.5px] font-[650] py-[7px] px-[8px] rounded-[10px] border border-solid border-[rgba(128, 89, 202, 0.12)]"
                      style={{
                        color: PRIMARY_COLOR,
                        background: PRIMARY_SECTION_BG,
                      }}
                    >
                      <i className="fas fa-bolt" style={{ color: "#eab308", fontSize: "12px" }} /> Fast Dispatch
                    </span>
                    <span
                      className="flex-1 flex items-center justify-center gap-[6px] text-[11.5px] font-[650] py-[7px] px-[8px] rounded-[10px] border border-solid border-[rgba(128, 89, 202, 0.12)]"
                      style={{
                        color: PRIMARY_COLOR,
                        background: PRIMARY_SECTION_BG,
                      }}
                    >
                      <i className="fas fa-map-marker-alt" style={{ color: PRIMARY_COLOR, fontSize: "12px" }} /> Live GPS
                    </span>
                    <span
                      className="flex-1 flex items-center justify-center gap-[6px] text-[11.5px] font-[650] py-[7px] px-[8px] rounded-[10px] border border-solid border-[rgba(128, 89, 202, 0.12)]"
                      style={{
                        color: PRIMARY_COLOR,
                        background: PRIMARY_SECTION_BG,
                      }}
                    >
                      <i className="fas fa-user-nurse" style={{ color: "#38bdf8", fontSize: "12px" }} /> EMT Staff
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3 Modern Step Cards */}
              <div className="col-lg-7 col-md-12">
                <div className="flex flex-col gap-[20px]">
                  {[
                    {
                      num: "01",
                      icon: "fas fa-search-location",
                      title: "Choose & Compare Ambulances",
                      description: "Select your ambulance type (BLS, ALS, ICU) and compare nearby providers instantly by fare, ratings, and arrival response times.",
                      tags: ["✓ Transparent Pricing", "✓ Nearby Vehicles"],
                    },
                    {
                      num: "02",
                      icon: "fas fa-calendar-check",
                      title: "Book Instantly & Confirm",
                      description: "Input your pickup address and destination hospital, confirm patient condition details, and choose your preferred payment option.",
                      tags: ["✓ Instant Confirmation", "✓ Secure Online / COD"],
                    },
                    {
                      num: "03",
                      icon: "fas fa-route",
                      title: "Track & Reach Safely",
                      description: "Access real-time GPS tracking, view driver and medical staff details, and share live location with family until safe hospital arrival.",
                      tags: ["✓ Live GPS Tracking", "✓ Direct Driver Contact"],
                    },
                  ].map((step) => (
                    <div
                      key={step.num}
                      className={`bg-white rounded-[20px] shadow-[0_8px_24px_rgba(128,89,202,0.06)] border-[1.5px] border-solid border-[#f1f5f9] flex items-start transition-all duration-300 ease-in-out relative overflow-hidden hover:-translate-y-[3px] hover:border-[#8059ca] hover:shadow-[0_12px_30px_rgba(128,89,202,0.15)] ${isMobile ? "p-[18px_16px] gap-[14px]" : "p-[24px] gap-[20px]"}`}
                    >
                      {/* Top Right Step Number Accent */}
                      <span
                        className="absolute top-[16px] right-[20px] text-[24px] font-black text-[rgba(128,89,202,0.15)] tracking-[-0.5px]"
                      >
                        {step.num}
                      </span>

                      {/* Step Icon */}
                      <div
                        className={`rounded-[16px] bg-gradient-to-br from-[#f3effa] to-[#e8e0fb] flex items-center justify-center shrink-0 border border-solid border-[rgba(128,89,202,0.2)] shadow-[0_4px_12px_rgba(128,89,202,0.1)] self-center ${isMobile ? "w-[54px] h-[54px]" : "w-[64px] h-[64px]"}`}
                      >
                        <i className={`${step.icon} ${isMobile ? "text-[22px]" : "text-[26px]"}`} style={{ color: PRIMARY_COLOR }} />
                      </div>

                      {/* Step Info */}
                      <div className="flex-1 min-w-0 pr-[30px]">
                        <h4
                          className={`font-semibold text-[#1e293b] mb-[6px] ${isMobile ? "text-[17px]" : "text-[19px]"}`}
                        >
                          {step.title}
                        </h4>
                        <p
                          className="text-[14px] text-[#64748b] m-0 leading-[1.6] mb-[12px]"
                        >
                          {step.description}
                        </p>
                        <div className="flex flex-wrap gap-[8px]">
                          {step.tags.map((tag, i) => (
                            <span key={i} className="text-[11.5px] font-semibold py-[3px] px-[10px] rounded-[12px]" style={{ color: PRIMARY_COLOR, background: PRIMARY_SECTION_BG }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>
      </section >

      <section style={{ padding: "60px 0", ...medicomparesSectionStyle }}>
        <div className="container">
          <div className="text-center mb-4">
            <h2
              style={{
                fontSize: "32px",
                fontWeight: "600",
                marginBottom: "8px",
                ...gradientHeadingStyle,
              }}
            >
              Why Choose Us?
            </h2>
            <p
              style={{
                fontSize: "15px",
                color: "#666",
                fontWeight: "400",
              }}
            >
              Trusted emergency ambulance services across the region
            </p>
          </div>

          <div className="row g-3">
            {[
              {
                icon: "fas fa-heartbeat",
                title: "1000+ Lives Saved",
                description:
                  "Trusted by thousands of families in emergency situations",
              },
              {
                icon: "fas fa-ambulance",
                title: "1000+ Ambulances",
                description: "Wide network of verified ambulance providers",
              },
              {
                icon: "fas fa-clock",
                title: "24/7 Availability",
                description: "Round-the-clock emergency medical services",
              },
              {
                icon: "fas fa-shield-alt",
                title: "Verified & Safe",
                description:
                  "All ambulances verified and equipped with medical staff",
              },
            ].map((item, index) => (
              <div key={index} className="col-lg-3 col-md-6">
                <div
                  className="bg-white rounded-[12px] p-[24px_20px] text-center border border-solid border-[rgba(128,89,202,0.12)] h-full transition-all duration-300 ease-in-out hover:-translate-y-[4px] hover:shadow-[0_8px_20px_rgba(128,89,202,0.15)] hover:border-[#8059ca]"
                >
                  {/* Icon */}
                  <div
                    className="w-[60px] h-[60px] rounded-[12px] flex items-center justify-center mx-auto mb-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.15)]"
                    style={{
                      background: PRIMARY_GRADIENT,
                    }}
                  >
                    <i
                      className={`${item.icon} text-[28px] text-white`}
                    />
                  </div>

                  {/* Title */}
                  <h5
                    className="text-[17px] font-semibold mb-[8px] leading-[1.3]"
                    style={{
                      color: PRIMARY_COLOR,
                    }}
                  >
                    {item.title}
                  </h5>

                  {/* Description */}
                  <p
                    className="text-[13px] text-[#666] leading-[1.5] mb-0 font-normal"
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="mx-2 py-[30px] px-0"
        style={{ backgroundColor: PRIMARY_SECTION_BG }}
      >
        <div className="container-fluid">
          <div className="row">
            <div className="col-lg-5 col-md-12 mb-4 mb-lg-0">
              <img
                src="/assets/img/bg/ambulance.webp"
                alt="Ambulance Service FAQ"
                className="img-fluid rounded w-100 d-lg-block d-none max-h-[420px] object-cover"
              />
            </div>
            <div className="col-lg-7 col-md-12">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-[12px] mb-[15px] overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
                >
                  <div
                    className="py-[14px] px-[16px] flex justify-between items-center cursor-pointer"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <h5
                      className="text-[16px] font-semibold text-[#212121] m-0 flex-1"
                    >
                      {faq.question}
                    </h5>
                    <span
                      className="text-[20px] font-semibold transition-all duration-300 ease flex items-center justify-center w-[24px] h-[24px]"
                      style={{
                        color: PRIMARY_COLOR,
                      }}
                    >
                      {expandedFaq === faq.id ? (
                        <i className="fas fa-minus"></i>
                      ) : (
                        <i className="fas fa-plus"></i>
                      )}
                    </span>
                  </div>
                  {expandedFaq === faq.id && (
                    <div
                      className="pt-0 pb-[16px] px-[16px] text-[14px] text-[#757575] leading-[1.6]"
                    >
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <AmbulanceBookingModal
        show={showBookingModal}
        onClose={closeBookingModal}
        selectedCategory={selectedCategory}
        imgUrl={imgUrl}
      />
    </>
  );
};

export default ambulanceservice;
