import { useState, useEffect } from "react";
import AmbulanceBookingModal from "../../components/modals/AmbulanceBookingModal.jsx";
import { getImageUrl } from "../../utils/index";
import { axiosCommonInstance } from "../../Apiservice";
import toast from "react-hot-toast";
import Slider from "react-slick";
import { getHealthcareTwoSlideOfferSettings } from "./healthcareSliderSettings.jsx";
import SEOHelmet from "../../components/ui/SEOHelmet";
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
      <div className="!flex !justify-center !items-center !mt-8">
        <ul className="!flex !justify-center !items-center !gap-2 !p-0 !m-0 !list-none">
          <li>
            <button
              className="!w-9 !h-9 !flex !items-center !justify-center !rounded-xl !border !border-solid !border-gray-200 !bg-white !text-gray-600 hover:!bg-[#321961]/10 hover:!text-[#321961] disabled:!opacity-40 disabled:!cursor-not-allowed !transition-all !duration-300"
              onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
            >
              <i className="fa-solid fa-chevron-left !text-[12px]" />
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
                    className={`!w-9 !h-9 !flex !items-center !justify-center !rounded-xl !border !border-solid !text-[13px] !font-medium !transition-all !duration-300 ${currentPage === page
                      ? "!bg-[#321961] !text-white !border-[#321961]"
                      : "!bg-white !text-gray-700 !border-gray-200 hover:!bg-[#321961]/10 hover:!text-[#321961]"
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
                  <span className="!w-9 !h-9 !flex !items-center !justify-center !text-gray-400">…</span>
                </li>
              );
            }

            return null;
          })}

          <li>
            <button
              className="!w-9 !h-9 !flex !items-center !justify-center !rounded-xl !border !border-solid !border-gray-200 !bg-white !text-gray-600 hover:!bg-[#321961]/10 hover:!text-[#321961] disabled:!opacity-40 disabled:!cursor-not-allowed !transition-all !duration-300"
              onClick={() =>
                onPageChange(Math.min(currentPage + 1, totalPages))
              }
              disabled={currentPage === totalPages}
            >
              <i className="fa-solid fa-chevron-right !text-[12px]" />
            </button>
          </li>
        </ul>
      </div>
    );
  };

  const PRIMARY_COLOR = "#321961";
  const PRIMARY_SECTION_BG = "#f8f4ff";
  const PRIMARY_DARK = "#6d48b8";

  return (
    <>
      <SEOHelmet page="ambulance" />
      <section
        className={`!relative !z-[9] !mt-0 ${isMobile ? "!hidden !p-0" : "!block !p-5"}`}
      >
        <div className="container-fluid !px-3 md:!px-4 !max-w-[850px] !mx-auto">
          <div className="!w-full !mt-3">
            <div className="!mx-auto !max-w-[850px]">
              <form onSubmit={(e) => e.preventDefault()}>
                <div
                  className={`!bg-white !rounded-[30px] !border !border-solid !border-[#e5e7eb] !shadow-[0_1px_3px_rgba(0,0,0,0.02)] !transition-all !duration-300 !overflow-hidden !relative ${isMobile ? "!hidden" : "!flex"
                    } !items-center !p-2 !gap-2`}
                >
                  <div className="!flex !items-center !justify-center !w-[25px] !h-[25px] !text-[#9ca3af] !shrink-0">
                    <i className="fas fa-search !text-[14px] !text-[#9ca3af]" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search Ambulance Services..."
                    className="!border-none !outline-none !flex-1 !text-[15px] !p-0 !text-[#111827] !bg-transparent !font-normal !min-w-0"
                    value={searchQuery}
                    onChange={handleInputChange}
                  />

                  {isLoading && (
                    <div
                      className="!w-4 !h-4 !border-2 !border-solid !border-[#321961] !border-t-transparent !rounded-full !animate-spin"
                      role="status"
                    >
                      <span className="sr-only">Loading...</span>
                    </div>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      <div className="!flex !justify-center !gap-3 md:!gap-4 !my-6 !flex-wrap !px-3">
        <button
          className="!flex !items-center !gap-2 !py-2.5 !px-5 !text-[13px] md:!text-[14px] !font-medium !rounded-[8px] !border !border-solid !border-gray-200 !bg-gray-50 !text-gray-400 !cursor-not-allowed !transition-all !duration-300"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Service is not available at the moment"
        >
          <i className="fas fa-heartbeat !text-[14px]" />
          Emergency Services
        </button>

        <button
          className="!flex !items-center !gap-2 !py-2.5 !px-5 !text-[13px] md:!text-[14px] !font-medium !rounded-[8px] !bg-[#321961] !text-white hover:!bg-[#6d48b8] hover:!-translate-y-[1px] !shadow-[0_4px_12px_rgba(128,89,202,0.18)] hover:!shadow-[0_6px_16px_rgba(128,89,202,0.25)] !transition-all !duration-300 !border-none !cursor-pointer"
          data-tooltip-id="global-tooltip"
          data-tooltip-content="Patient Transport Services"
        >
          <i className="fas fa-ambulance !text-[14px]" />
          Patient Transport Services
        </button>
      </div>

      {!isLoading && searchQuery && searchResults.length === 0 && (
        <section className="!mx-2 !py-5 !px-0 !bg-white">
          <div className="container-fluid !text-center">
            <p className="!text-gray-500 !m-0">
              No ambulance services found for "{searchQuery}"
            </p>
          </div>
        </section>
      )}

      {(filteredEmergencyVehicles.length > 0 ||
        (categories && categories.length > 0 && !searchQuery)) && (
          <section className="!mx-2 !pt-4 !pb-6 !bg-[#f8f4ff] !rounded-2xl">
            <div className="container-fluid !px-4 md:!px-6 !mx-auto">
              <h2 className="!text-[24px] md:!text-[28px] !font-semibold !mb-6 !text-center !bg-gradient-to-br !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent">
                Patient Transport Services
                {filteredEmergencyVehicles.length > 0 &&
                  ` (${filteredEmergencyVehicles.length})`}
              </h2>

              <div className="!grid !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-4 !gap-6">
                {emergencyCurrentItems.map((vehicle, index) => (
                  <div key={emergencyStartIndex + index} className="!w-full">
                    <div className="!bg-white !rounded-md !p-4 !shadow-[0_4px_16px_rgba(0,0,0,0.04)] !border !border-solid !border-gray-100 hover:!shadow-lg hover:!-translate-y-1 !transition-all !duration-300 !flex !flex-col !justify-between !h-full">
                      <div>
                        <div className="!relative !w-full !h-36 !overflow-hidden !rounded-xl">
                          <img
                            src={
                              vehicle?.tabletdetails?.files?.length
                                ? getImageUrl(vehicle.tabletdetails.files[0])
                                : "/assets/default.png"
                            }
                            className="!w-full !h-full !object-cover"
                            alt={vehicle?.tabletdetails?.name}
                            title={vehicle?.tabletdetails?.name}
                            loading="lazy"
                          />
                          <div className="!absolute !top-2 !right-2 !z-10 !text-[10px] !font-semibold !text-emerald-600 !bg-emerald-50/95 !backdrop-blur-[2px] !py-0.5 !px-2 !rounded-full !shadow-sm">
                            ✔ Verified
                          </div>
                        </div>

                        <div className="!text-gray-900 !text-left !font-medium !mt-3 !text-[14px] !capitalize !leading-snug">
                          {vehicle?.tabletdetails?.name}
                        </div>

                        <div className="!text-gray-400 !text-[12px] !mt-3 !text-left">
                          Facilities:
                        </div>

                        <div className="!flex !gap-2 !mt-1.5 !flex-wrap">
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
                                  className="!w-6 !h-6 !rounded-md !object-contain !border !border-solid !border-gray-100 !p-0.5"
                                  title={facility?.name || "Facility"}
                                  alt={facility?.name || "Facility"}
                                  loading="lazy"
                                />
                              ),
                            )
                          ) : (
                            <img
                              src="/assets/default.png"
                              className="!w-6 !h-6 !rounded-md !object-contain !border !border-solid !border-gray-100 !p-0.5"
                              alt="No Facility"
                            />
                          )}
                        </div>
                      </div>

                      <button
                        className="!w-full !mt-4 !py-2 !rounded-lg !bg-[#321961] hover:!bg-[#6d48b8] !text-white !font-semibold !text-[13px] !transition-all !duration-300 !border-none !cursor-pointer"
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
        )}

      {categories1 && categories1.length > 0 && (
        <section className="!mx-2 !py-8 !px-0 !bg-[#f8f4ff] !rounded-2xl !mt-6">
          <div className="container-fluid !px-4 md:!px-6 !mx-auto">
            <h2 className="!text-[24px] md:!text-[28px] !font-semibold !mb-6 !text-center !bg-gradient-to-br !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent">
              Top Most Booked Ambulances
            </h2>

            <div className="!grid !grid-cols-1 sm:!grid-cols-2 md:!grid-cols-4 !gap-6">
              {topBookedCurrentItems.map((vehicle, index) => (
                <div key={topBookedStartIndex + index} className="!w-full">
                  <div className="!bg-white !rounded-2xl !p-4 !shadow-[0_4px_16px_rgba(0,0,0,0.04)] !border !border-solid !border-gray-100 hover:!shadow-lg hover:!-translate-y-1 !transition-all !duration-300 !flex !flex-col !justify-between !h-full">
                    <div>
                      <div className="!relative !w-full !h-36 !overflow-hidden !rounded-xl">
                        <img
                          src={
                            vehicle?.tabletdetails?.files?.length
                              ? getImageUrl(vehicle.tabletdetails.files[0])
                              : "/assets/default.png"
                          }
                          className="!w-full !h-full !object-cover"
                          alt={vehicle?.tabletdetails?.name}
                          title={vehicle?.tabletdetails?.name}
                          loading="lazy"
                        />
                        <div className="!absolute !top-2 !right-2 !z-10 !text-[10px] !font-semibold !text-emerald-600 !bg-emerald-50/95 !backdrop-blur-[2px] !py-0.5 !px-2 !rounded-full !shadow-sm">
                          ✔ Verified
                        </div>
                      </div>

                      <div className="!text-gray-900 !text-left !font-medium !mt-3 !text-[14px] !capitalize !leading-snug">
                        {vehicle?.tabletdetails?.name}
                      </div>

                      <div className="!text-gray-400 !text-[12px] !mt-3 !text-left">
                        Facilities:
                      </div>
                      <div className="!flex !gap-2 !mt-1.5 !flex-wrap">
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
                                className="!w-6 !h-6 !rounded-md !object-contain !border !border-solid !border-gray-100 !p-0.5"
                                title={facility?.name || "Facility"}
                                alt={facility?.name || "Facility"}
                                loading="lazy"
                              />
                            ),
                          )
                        ) : (
                          <img
                            src="/assets/default.png"
                            className="!w-6 !h-6 !rounded-md !object-contain !border !border-solid !border-gray-100 !p-0.5"
                            alt="No Facility"
                          />
                        )}
                      </div>
                    </div>

                    <button
                      className="!w-full !mt-4 !py-1 !rounded-sm !bg-[#321961] hover:!bg-[#6d48b8] !text-white !font-semibold !text-[13px] !transition-all !duration-300 !border-none !cursor-pointer"
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
      )}

      {middleBanners?.length > 0 && (
        <section className="!py-8 !px-3 !bg-[#f8f4ff] !rounded-2xl !mt-6">
          <div className="container-fluid !px-4 md:!px-6 !mx-auto">
            <div className="!text-center !mb-6">
              <h2 className="!text-[24px] md:!text-[28px] !font-semibold !bg-gradient-to-br !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent">
                <i className="fas fa-bolt !mr-2 !text-[#321961]" />
                Offers & Promotions
              </h2>
            </div>
            {middleBanners.length > 1 ? (
              <Slider {...settings}>
                {middleBanners.map((image, index) => (
                  <div key={index} className="!px-2">
                    <img
                      src={image.src}
                      alt={image.alt}
                      loading="lazy"
                      className="!w-full !h-auto !rounded-xl !object-cover"
                    />
                  </div>
                ))}
              </Slider>
            ) : (
              <div className="!w-full">
                <img
                  src={middleBanners[0]?.src}
                  alt={middleBanners[0]?.alt}
                  title={middleBanners[0]?.alt}
                  loading="lazy"
                  className="!w-full !h-auto !rounded-xl !object-cover"
                />
              </div>
            )}
          </div>
        </section>
      )}

      <section className="!py-16 !bg-[#E8E4F5] bg-[url('/assets/Medicompares%20Background.png')] !bg-cover !bg-center !bg-no-repeat !rounded-2xl !mx-2 !mt-6">
        <div className="container-fluid !px-4 md:!px-6 !mx-auto !max-w-[1320px]">
          {/* Section Header */}
          <div className="!text-center !mb-10">
            <div className="!inline-flex !items-center !gap-2 !bg-[#321961]/10 !border !border-solid !border-[#321961]/25 !rounded-full !py-1.5 !px-4 !text-[12px] !font-bold !tracking-wider !uppercase !text-[#321961] !mb-3">
              <i className="fas fa-bolt !text-yellow-500" /> Fast Emergency Dispatch
            </div>
            <h2 className="!text-[28px] md:!text-[32px] !font-semibold !bg-gradient-to-br !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent !mb-2">
              Booking Process
            </h2>
            <p className="!text-gray-500 !max-w-[600px] !mx-auto !leading-relaxed !mt-2 !text-[14px] md:!text-[16px]">
              Get immediate medical transit in 3 simple steps — transparent pricing, instant assignment, and live GPS tracking.
            </p>
          </div>

          {/* Main Outer Container */}
          <div className="!bg-white !rounded-3xl !border !border-solid !border-gray-200 !shadow-[0_12px_35px_rgba(128,89,202,0.05)] !p-6 md:!p-10">
            <div className="!flex !flex-col lg:!flex-row !items-stretch !gap-8">

              {/* Left Column: Clean Image Showcase Card */}
              <div className="!w-full lg:!w-5/12 !flex !flex-col !justify-center">
                <div className="!bg-white !rounded-2xl !p-3 !shadow-[0_10px_30px_rgba(128,89,202,0.06)] !border !border-solid !border-[#321961]/15 !overflow-hidden">
                  <img
                    src="/assets/img/ambulance_booking_illustration.png"
                    alt="Ambulance Booking Process Illustration"
                    className={`!w-full !h-auto !object-cover !rounded-xl !block !transition-transform !duration-300 hover:!scale-[1.02] ${isMobile ? "!max-h-[320px]" : "!max-h-[420px]"
                      }`}
                  />

                  {/* Clean Bottom Feature Strip */}
                  <div className="!flex !items-center !justify-between !gap-2 !mt-3">
                    <span className="!flex-1 !flex !items-center !justify-center !gap-1.5 !text-[11.5px] !font-medium !py-2 !px-2 !rounded-lg !border !border-solid !border-[#321961]/15 !bg-[#f8f4ff] !text-[#321961]">
                      <i className="fas fa-bolt !text-yellow-500 !text-[12px]" /> Fast Dispatch
                    </span>
                    <span className="!flex-1 !flex !items-center !justify-center !gap-1.5 !text-[11.5px] !font-medium !py-2 !px-2 !rounded-lg !border !border-solid !border-[#321961]/15 !bg-[#f8f4ff] !text-[#321961]">
                      <i className="fas fa-map-marker-alt !text-[#321961] !text-[12px]" /> Live GPS
                    </span>
                    <span className="!flex-1 !flex !items-center !justify-center !gap-1.5 !text-[11.5px] !font-medium !py-2 !px-2 !rounded-lg !border !border-solid !border-[#321961]/15 !bg-[#f8f4ff] !text-[#321961]">
                      <i className="fas fa-user-nurse !text-sky-400 !text-[12px]" /> EMT Staff
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: 3 Modern Step Cards */}
              <div className="!w-full lg:!w-7/12">
                <div className="!flex !flex-col !gap-5 !h-full !justify-between">
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
                      className="!bg-white !rounded-sm !shadow-[0_8px_24px_rgba(128,89,202,0.04)] !border !border-solid !border-gray-100 !flex !items-start !transition-all !duration-300 !relative !overflow-hidden hover:!-translate-y-1 hover:!border-[#321961] hover:!shadow-[0_12px_30px_rgba(128,89,202,0.1)] !p-5 md:!p-6 !gap-4 md:!gap-5"
                    >
                      <span className="!absolute !top-4 !right-5 !text-[24px] !font-mono !font-bold !text-[#321961]/10">
                        {step.num}
                      </span>

                      <div className="!w-14 !h-14 !rounded-xl !bg-[#f8f4ff] !flex !items-center !justify-center !shrink-0 !border !border-solid !border-[#321961]/20 !shadow-sm !self-center">
                        <i className={`${step.icon} !text-[22px] !text-[#321961]`} />
                      </div>

                      <div className="!flex-1 !min-w-0 !pr-6">
                        <div className="!font-medium !text-gray-900 !mb-1 !text-[16px] md:!text-[18px]">
                          {step.title}
                        </div>
                        <p className="!text-[13.5px] !text-gray-500 !m-0 !leading-relaxed !mb-2.5">
                          {step.description}
                        </p>
                        <div className="!flex !flex-wrap !gap-2">
                          {step.tags.map((tag, i) => (
                            <span key={i} className="!text-[11px] !font-medium !py-0.5 !px-2.5 !rounded-full !text-[#321961] !bg-[#f8f4ff]">
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
      </section>

      <section className="!py-16 !bg-[#E8E4F5] bg-[url('/assets/Medicompares%20Background.png')] !bg-cover !bg-center !bg-no-repeat !rounded-2xl !mx-2 !mt-6">
        <div className="container-fluid !px-4 md:!px-6 !mx-auto">
          <div className="!text-center !mb-10">
            <h2 className="!text-[28px] md:!text-[32px] !font-semibold !bg-gradient-to-br !from-[#321961] !to-[#6d48b8] !bg-clip-text !text-transparent !mb-2">
              Why Choose Us?
            </h2>
            <p className="!text-[15px] !text-gray-600 !font-normal !m-0">
              Trusted emergency ambulance services across the region
            </p>
          </div>

          <div className="!grid !grid-cols-1 sm:!grid-cols-2 lg:!grid-cols-4 !gap-6">
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
              <div key={index} className="!w-full">
                <div className="!bg-white !rounded-sm !p-6 !text-center !border !border-solid !border-gray-100 !h-full !transition-all !duration-300 hover:!-translate-y-1 hover:!shadow-[0_8px_20px_rgba(128,89,202,0.1)] hover:!border-[#321961]">
                  <div className="!w-12 !h-12 !rounded-xl !flex !items-center !justify-center !mx-auto !mb-4 !shadow-sm !bg-gradient-to-br !from-[#321961] !to-[#6d48b8]">
                    <i className={`${item.icon} !text-[20px] !text-white`} />
                  </div>

                  <h5 className="!text-[16px] !font-medium !mb-2 !leading-snug !text-[#321961]">
                    {item.title}
                  </h5>

                  <p className="!text-[13px] !text-gray-500 !leading-relaxed !mb-0 !font-normal">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="!mx-2 !py-10 !px-0 !bg-[#f8f4ff] !rounded-2xl !mt-6">
        <div className="container-fluid !px-4 md:!px-6 !mx-auto">
          <div className="!flex !flex-col lg:!flex-row !items-stretch !gap-8">
            <div className="!w-full lg:!w-5/12 !hidden lg:!block">
              <img
                src="/assets/img/bg/ambulance.webp"
                alt="Ambulance Service FAQ"
                className="!w-full !h-full !rounded-2xl !max-h-[420px] !object-cover !shadow-sm"
              />
            </div>
            <div className="!w-full lg:!w-7/12 !space-y-4">
              {faqs.map((faq) => (
                <div
                  key={faq.id}
                  className="!bg-white !rounded-xl !overflow-hidden !shadow-[0_2px_10px_rgba(0,0,0,0.03)] !border !border-solid !border-gray-100"
                >
                  <div
                    className="!py-3.5 !px-4 !flex !justify-between !items-center !cursor-pointer"
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <div className="!text-[15px] !font-medium !text-gray-900 !m-0 !flex-1">
                      {faq.question}
                    </div>
                    <span className="!text-[16px] !font-bold !transition-all !duration-300 !flex !items-center !justify-center !w-6 !h-6 !text-[#321961]">
                      {expandedFaq === faq.id ? (
                        <i className="fas fa-minus"></i>
                      ) : (
                        <i className="fas fa-plus"></i>
                      )}
                    </span>
                  </div>
                  {expandedFaq === faq.id && (
                    <div className="!pt-0 !pb-4 !px-4 !text-[13px] !text-gray-500 !leading-relaxed">
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
