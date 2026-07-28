import { useState, useEffect } from "react";
import Slider from "react-slick";

const PRIMARY_COLOR = "#8059ca";
const PRIMARY_SECTION_BG = "#f8f4ff";
const PRIMARY_CARD_BG = "rgba(159, 100, 255, 0.16)";

export const getServiceCards = (serviceType) => {
  const serviceCards = {
    medicine: [
      {
        bgColor: "#E8F5E9",
        icon: "fas fa-file-medical",
        color: "#2E7D32",
        title: "Tell us what you need",
        content:
          "Type your medicine name or upload prescription to discover brand, generic, and similar options from trusted nearby pharmacies.",
      },
      {
        bgColor: "#FFF3E0",
        icon: "fas fa-balance-scale",
        color: "#EF6C00",
        title: (
          <>
            Compare & choose your
            <br /> best match.
          </>
        ),
        content:
          "Compare medicine prices, brands, ratings, and pharmacy options side by side to confidently choose the best option for needs.",
      },
      {
        bgColor: "#E3F2FD",
        icon: "fas fa-truck",
        color: "#1565C0",
        title: (
          <>
            Check out. We deliver the <br /> savings and your medicine.
          </>
        ),
        content:
          "Add medicines to cart, complete secure payment, and get fast doorstep delivery with safety, savings, and reliable service.",
      },
    ],

    labtests: [
      {
        bgColor: "#FCE4EC",
        icon: "fas fa-vial",
        color: "#C2185B",
        title: "Tell us what you need",
        content:
          "Search lab tests or checkup packages to find certified diagnostic centers providing accurate, reliable, timely results.",
      },
      {
        bgColor: "#E8EAF6",
        icon: "fas fa-balance-scale",
        color: "#3F51B5",
        title: (
          <>
            Compare & choose your
            <br /> best match.
          </>
        ),
        content:
          "Compare lab prices, test details, ratings, report turnaround times, and locations before selecting the best diagnostic option.",
      },
      {
        bgColor: "#E0F2F1",
        icon: "fas fa-calendar-check",
        color: "#00796B",
        title: (
          <>
            Book your test & get <br /> results.
          </>
        ),
        content:
          "Book lab tests easily, select preferred time slots, and receive accurate digital reports delivered securely on time.",
      },
    ],

    diagnostics: [
      {
        bgColor: "#FFFDE7",
        icon: "fas fa-vial",
        color: "#F9A825",
        title: "Tell us what you need",
        content:
          "Search diagnostic tests and preventive screenings to find trusted labs delivering accurate reports and professional services.",
      },
      {
        bgColor: "#E1F5FE",
        icon: "fas fa-balance-scale",
        color: "#0288D1",
        title: (
          <>
            Compare & choose your
            <br /> best match.
          </>
        ),
        content:
          "Evaluate diagnostic centers by pricing, services, ratings, report accuracy, and turnaround times before finalizing your selection.",
      },
      {
        bgColor: "#F3E5F5",
        icon: "fas fa-calendar-check",
        color: "#6A1B9A",
        title: (
          <>
            Book your test & get <br /> results.
          </>
        ),
        content:
          "Schedule diagnostic tests conveniently and receive secure, accurate medical reports digitally without delays or confusion.",
      },
    ],

    surgeries: [
      {
        bgColor: "#E0F7FA",
        icon: "fas fa-user-md",
        color: "#00838F",
        title: "Find the right surgery",
        content:
          "Search surgical procedures to find experienced hospitals and qualified surgeons best suited for your medical condition.",
      },
      {
        bgColor: "#FFF3E0",
        icon: "fas fa-balance-scale",
        color: "#FB8C00",
        title: (
          <>
            Compare hospitals & <br /> doctors.
          </>
        ),
        content:
          "Compare hospitals, doctors, success rates, treatment costs, facilities, and patient reviews before deciding on surgery.",
      },
      {
        bgColor: "#FCE4EC",
        icon: "fas fa-calendar-check",
        color: "#AD1457",
        title: (
          <>
            Book your surgery & <br /> recovery plan.
          </>
        ),
        content:
          "Book surgery with confidence, transparent pricing, expert guidance, and complete pre and post surgery support services.",
      },
    ],

    dentalservice: [
      {
        bgColor: "#E8F5E9",
        icon: "fas fa-tooth",
        color: "#388E3C",
        title: "Find dental care",
        content:
          "Book medical treatments confidently with expert consultation, personalized care plans, and professional recovery.",
      },
      {
        bgColor: "#E1F5FE",
        icon: "fas fa-balance-scale",
        color: "#0277BD",
        title: (
          <>
            Compare clinics & <br /> dentists.
          </>
        ),
        content:
          "Compare dental clinics, dentist expertise, treatment options, pricing, and verified patient reviews before choosing care.",
      },
      {
        bgColor: "#FFFDE7",
        icon: "fas fa-calendar-check",
        color: "#FBC02D",
        title: (
          <>
            Book your appointment & <br /> get treated.
          </>
        ),
        content:
          "Book dental appointments easily and receive quality treatment ensuring comfort, safety, hygiene, and long lasting healthy smiles.",
      },
    ],

    nursingcare: [
      {
        bgColor: "#E3F2FD",
        icon: "fas fa-user-nurse",
        color: "#1E88E5",
        title: "Find nursing care services",
        content:
          "Search professional nursing and home care services to support patients with compassionate, trained, and verified caregivers.",
      },
      {
        bgColor: "#F3E5F5",
        icon: "fas fa-balance-scale",
        color: "#8E24AA",
        title: (
          <>
            Compare caregivers & <br /> packages.
          </>
        ),
        content:
          "Compare caregiver profiles, qualifications, experience, service packages, schedules, and pricing to select proper nursing support.",
      },
      {
        bgColor: "#E0F2F1",
        icon: "fas fa-calendar-check",
        color: "#00695C",
        title: (
          <>
            Book nursing care & <br /> get support.
          </>
        ),
        content:
          "Schedule nursing care services conveniently and receive reliable medical assistance, monitoring, and personal support at home.",
      },
    ],

    homecare: [
      {
        bgColor: "#FFF3E0",
        icon: "fas fa-home",
        color: "#F57C00",
        title: "Find home care services",
        content:
          "Search home healthcare services providing medical support, therapy assistance, elderly care, and recovery services at home.",
      },
      {
        bgColor: "#E8EAF6",
        icon: "fas fa-balance-scale",
        color: "#3949AB",
        title: (
          <>
            Compare providers & <br /> services.
          </>
        ),
        content:
          "Compare home care providers, service quality, availability, pricing, and patient reviews before selecting suitable care.",
      },
      {
        bgColor: "#E8F5E9",
        icon: "fas fa-calendar-check",
        color: "#2E7D32",
        title: (
          <>
            Book home care & <br /> get service.
          </>
        ),
        content:
          "Book home healthcare services easily and receive professional medical care delivered safely and comfortably at home.",
      },
    ],

    medicalequipment: [
      {
        bgColor: "#FCE4EC",
        icon: "fas fa-toolbox",
        color: "#D81B60",
        title: "Find medical equipment",
        content:
          "Search medical equipment and healthcare devices from trusted suppliers offering certified products and warranty support.",
      },
      {
        bgColor: "#E0F7FA",
        icon: "fas fa-balance-scale",
        color: "#00838F",
        title: (
          <>
            Compare products & <br /> suppliers.
          </>
        ),
        content:
          "Compare equipment features, specifications, brands, pricing, warranty, and supplier reliability before any purchase.",
      },
      {
        bgColor: "#E3F2FD",
        icon: "fas fa-shopping-cart",
        color: "#1565C0",
        title: (
          <>
            Purchase equipment & <br /> get delivery.
          </>
        ),
        content:
          "Order medical equipment securely online and receive fast, reliable, and safe delivery directly to your location.",
      },
    ],

    medicaltreatment: [
      {
        bgColor: "#E1F5FE",
        icon: "fas fa-stethoscope",
        color: "#0288D1",
        title: "Find medical treatments",
        content:
          "Search specialized medical treatments and advanced therapies to find trusted treatment centers for your condition.",
      },
      {
        bgColor: "#FFFDE7",
        icon: "fas fa-balance-scale",
        color: "#F9A825",
        title: (
          <>
            Compare treatments & <br /> centers.
          </>
        ),
        content:
          "Compare treatment options, hospitals, doctors, success rates, technologies used, and overall treatment costs before deciding.",
      },
      {
        bgColor: "#F3E5F5",
        icon: "fas fa-calendar-check",
        color: "#6A1B9A",
        title: (
          <>
            Book treatment & <br /> start recovery.
          </>
        ),
        content:
          "Book medical treatments confidently with expert consultation, personalized care plans, and professional recovery.",
      },
    ],
  };

  return serviceCards[serviceType] || serviceCards.medicine;
};

export const getServiceFooterText = (serviceType) => {
  const footerTexts = {
    medicine: "Start now, it's free, fast, and made for your health needs.",
    labtests: "Start now, it's free, fast, and get your test results quickly.",
    diagnostics:
      "Start now, it's free, fast, and find the best diagnostic centers.",
    surgeries: "Start now, it's free, fast, and find the best surgical care.",
    dentalservice: "Start now, it's free, fast, and get your perfect smile.",
    nursingcare:
      "Start now, it's free, fast, and get professional care at home.",
    homecare:
      "Start now, it's free, fast, and get quality healthcare delivered.",
    medicalequipment:
      "Start now, it's free, fast, and find the best medical equipment.",
    medicaltreatment:
      "Start now, it's free, fast, and begin your recovery journey.",
  };

  return footerTexts[serviceType] || footerTexts.medicine;
};

const ServiceCards = ({ serviceType, liteMode = false }) => {
  const [isMobile, setIsMobile] = useState(false);
  const sliderSettings = {
    dots: false,
    arrows: false,
    infinite: !liteMode,
    autoplay: !liteMode,
    autoplaySpeed: 2000,
    speed: liteMode ? 300 : 500,
    slidesToShow: 1,
    slidesToScroll: 1,
  };

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const [hoveredIndex, setHoveredIndex] = useState(null);
  const cards = getServiceCards(serviceType);
  const footerText = getServiceFooterText(serviceType);

  const renderCard = (card, idx) => (
    <div
      key={idx}
      className={isMobile && !liteMode ? "px-2" : isMobile ? "" : "col-md-4 col-sm-6"}
    >
      <div
        className={`description-item tooltip-container${liteMode ? " service-card-lite" : ""}`}
        style={{
          background: PRIMARY_CARD_BG,
          display: "flex",
          justifyContent: "space-between",
          cursor: "pointer",
          position: "relative",
          zIndex: !liteMode && hoveredIndex === idx ? 12 : "auto",
        }}
        onMouseEnter={() => !liteMode && setHoveredIndex(idx)}
        onMouseLeave={() => !liteMode && setHoveredIndex(null)}
        onClick={() =>
          isMobile && !liteMode
            ? setHoveredIndex(hoveredIndex === idx ? null : idx)
            : null
        }
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <span>
            <i
              className={card.icon}
              style={{ fontSize: "32px", color: PRIMARY_COLOR }}
            ></i>
          </span>
          <h4>
            <a style={{ fontSize: "14px" }}>{card.title}</a>
          </h4>
        </div>
        <i
          className={
            hoveredIndex === idx
              ? `fa-solid fa-${isMobile ? "arrow-up" : "chevron-up"} me-4`
              : `fa-solid fa-${isMobile ? "arrow-down" : "chevron-down"} me-4`
          }
        ></i>

        <div
          className="tooltip-content"
          style={
            isMobile && !liteMode
              ? {
                opacity: hoveredIndex === idx ? 1 : 0,
                visibility: hoveredIndex === idx ? "visible" : "hidden",
              }
              : undefined
          }
        >
          <div className="tooltip-text">{card.content}</div>
        </div>
      </div>
    </div>
  );

  return (
    <section
      className={`service-cards-section py-3${hoveredIndex !== null && !liteMode ? " is-tooltip-active" : ""}`}
      style={{
        backgroundColor: PRIMARY_SECTION_BG,
        position: "relative",
        zIndex: hoveredIndex !== null && !liteMode ? 12 : "auto",
        overflow: "visible",
      }}
    >
      <style>
        {`
    .service-cards-section .slick-list,
    .service-cards-section .slick-track {
      overflow: visible !important;
    }
  `}
      </style>
      <div className="container">
        <div className="medical-descriptions">
          {isMobile ? (
            liteMode ? (
              <div className="service-cards-stack d-flex flex-column gap-2">
                {cards.map((card, idx) => renderCard(card, idx))}
              </div>
            ) : (
              <Slider {...sliderSettings}>
                {cards.map((card, idx) => renderCard(card, idx))}
              </Slider>
            )
          ) : (
            <div className="row">
              {cards.map((card, idx) => renderCard(card, idx))}
            </div>
          )}
        </div>

        <h3
          className="text-center my-3"
          style={{ textTransform: "capitalize", color: PRIMARY_COLOR }}
        >
          {footerText}
        </h3>
      </div>
    </section>
  );
};

export default ServiceCards;
