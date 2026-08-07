import { useState, useEffect } from "react";
import Slider from "react-slick";

const PRIMARY_COLOR = "#321961";
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
  const normalizedType = String(serviceType || "").toLowerCase().replace(/-/g, "").replace(/_/g, "");

  const footerTexts = {
    medicine: "Rx & Prescription Medicines in Hyderabad | 24 Hour Pharmacy Near Me",
    rxmedicines: "Rx & Prescription Medicines in Hyderabad | 24 Hour Pharmacy Near Me",
    medicines: "Rx & Prescription Medicines in Hyderabad | 24 Hour Pharmacy Near Me",

    labtests: "Lab Tests & NABL Accredited Diagnostic Labs in Hyderabad | Book Now",
    labtest: "Lab Tests & NABL Accredited Diagnostic Labs in Hyderabad | Book Now",

    diagnostics: "Diagnostics & NABL Accredited Labs in Hyderabad | Expert Medical Care",
    diagnostic: "Diagnostics & NABL Accredited Labs in Hyderabad | Expert Medical Care",

    homecare: "Home Nursing Care in Hyderabad | Elderly & Senior Care Services",
    nursingcare: "Home Nursing Care in Hyderabad | Elderly & Senior Care Services",

    ambulanceservice: "Best Ambulance Service in Hyderabad | 24/7 Emergency Response",
    ambulance: "Best Ambulance Service in Hyderabad | 24/7 Emergency Response",

    clinicsandrehabs: "Home Care Agency in Hyderabad | Senior & Elderly Care Services",
    clinics: "Home Care Agency in Hyderabad | Senior & Elderly Care Services",
    clinic: "Home Care Agency in Hyderabad | Senior & Elderly Care Services",

    dentalservice: "Best Dental Implants & Cosmetic Dentistry in Hyderabad | Book Now",
    dental: "Best Dental Implants & Cosmetic Dentistry in Hyderabad | Book Now",

    medicaltreatment: "Healthcare Services & Treatments in Hyderabad | Specialist Doctors",
    treatments: "Healthcare Services & Treatments in Hyderabad | Specialist Doctors",
    treatment: "Healthcare Services & Treatments in Hyderabad | Specialist Doctors",

    surgeries: "Surgical Procedures in Hyderabad | Laparoscopic, Robotic & Ortho Surgery",
    surgery: "Surgical Procedures in Hyderabad | Laparoscopic, Robotic & Ortho Surgery",

    medicalequipment: "Medical Equipment & Pharmacy Near Me in Hyderabad | 24 Hour Store",
  };

  return footerTexts[normalizedType] || footerTexts[serviceType] || footerTexts.medicine;
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
      className={isMobile ? "w-full px-2" : "w-full md:w-1/3 sm:w-1/2 px-2.5 mb-4"}
    >
      <div
        className={`group relative flex flex-col justify-between cursor-pointer mb-2.5 p-3 rounded-[14px] shadow-[0px_4px_14px_0px_rgba(226,237,255,0.08)] transition-all duration-500 bg-[rgba(159,100,255,0.12)] ${!isMobile ? "hover:-translate-y-2.5" : ""}`}
        style={{
          zIndex: hoveredIndex === idx ? 12 : "auto",
        }}
        onMouseEnter={() => !isMobile && setHoveredIndex(idx)}
        onMouseLeave={() => !isMobile && setHoveredIndex(null)}
        onClick={() =>
          isMobile
            ? setHoveredIndex(hoveredIndex === idx ? null : idx)
            : null
        }
      >
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center w-full min-w-0">
            <span className="w-[45px] h-[45px] md:w-[50px] md:h-[50px] border border-[#eef1f6] rounded-[10px] mr-3 shrink-0 flex items-center justify-center bg-white shadow-sm">
              <i
                className={card.icon}
                style={{ fontSize: isMobile ? "24px" : "25px", color: PRIMARY_COLOR }}
              ></i>
            </span>
            <h4 className="mb-0 !text-[11px] md:!text-[15.5px] !font-medium !text-gray-900">
              <span className="text-gray-900 leading-snug block">{card.title}</span>
            </h4>
          </div>

          <i
            className={`fa-solid fa-chevron-${hoveredIndex === idx ? "up" : "down"} ml-2 text-xs text-gray-500`}
          ></i>
        </div>

        {isMobile && hoveredIndex === idx && (
          <div className="mt-2.5 pt-2.5 border-t border-[#321961]/15 text-[11px] leading-relaxed text-gray-700 text-left">
            {card.content}
          </div>
        )}

        {!isMobile && (
          <div
            className={`absolute top-[calc(100%+12px)] left-1/2 -translate-x-1/2 bg-white text-[#333] py-3 px-4 rounded-xl shadow-[0_8px_24px_rgba(0,0,0,0.15)] min-w-[280px] max-w-[350px] pointer-events-none transition-all duration-300 ease-out z-[999999] border border-slate-100 after:content-[''] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-b-white after:drop-shadow-[0_2px_4px_rgba(0,0,0,0.1)] ${hoveredIndex === idx
              ? "opacity-100 visible translate-y-0"
              : "opacity-0 invisible translate-y-2.5"
              }`}
          >
            <div className="text-xs leading-relaxed text-gray-600 text-left">{card.content}</div>
          </div>
        )}
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
      }}
    >
      <style>
        {`
    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}
      </style>
      <div className="max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8">
        <div className="medical-descriptions">
          {isMobile ? (
            <Slider {...sliderSettings}>
              {cards.map((card, idx) => renderCard(card, idx))}
            </Slider>
          ) : (
            <div className="flex flex-wrap -mx-2.5">
              {cards.map((card, idx) => renderCard(card, idx))}
            </div>
          )}
        </div>

        <h1
          className="text-center !text-[18px] md:!text-xl !font-semibold  my-3"
          style={{ textTransform: "capitalize", color: PRIMARY_COLOR }}
        >
          {footerText}
        </h1>
      </div>
    </section>
  );
};

export default ServiceCards;
