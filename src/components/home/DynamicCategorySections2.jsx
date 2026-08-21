import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import { SectionProductCard2, SectionHeader } from "../ui";
import { useResponsive } from "../../hooks";

const DynamicCategorySections = ({
  sections,
  onProductClick,
  onCompareClick,
  onVendorClick,
  imgUrl,
  currentService,
  isMobile: isMobileProp,
  sliderSettings,
  liteMode = false,
}) => {
  const {
    isXs: extraSmallScreen,
    isTabletOrBelow: isSmallLaptop,
    isMobile: isMobileLocal,
    isTablet,
  } = useResponsive();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileLocal;

  // Scale slidesToShow up to 6 on large screens
  const slidesToShow = isMobile ? 2 : isTablet ? 3.5 : isSmallLaptop ? 5 : 6;

  const getServiceBackgroundIcon = (serviceSlug) => {
    const slug = (serviceSlug || "").toLowerCase();

    // Pharmacy / Medicines
    if (slug.includes("medicine") || slug.includes("pharmacy")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
          <path d="M45 15 h10 v30 h-10 z" />
          <path d="M35 35 h30 v50 c0 5-4 9-9 9 h-12 c-5 0-9-4-9-9 z" />
          <circle cx="50" cy="60" r="12" />
        </svg>
      );
    }

    // Lab Tests
    if (slug.includes("labtest") || slug.includes("lab-test")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
          <path d="M35 85 h30 v5 h-30 z" />
          <path d="M48 30 h4 v55 h-4 z" />
          <path d="M40 45 a10 10 0 0 1 20 0 c0 8-5 15-10 15 s-10-7-10-15 z" />
          <circle cx="50" cy="20" r="8" />
        </svg>
      );
    }

    // Diagnostics / Scans
    if (slug.includes("diagnostic") || slug.includes("scan")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
          <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="6" fill="none" />
          <path d="M50 15 v70 M15 50 h70" stroke="currentColor" strokeWidth="6" />
          <circle cx="50" cy="50" r="15" />
        </svg>
      );
    }

    // Home Care / Physio / Nursing
    if (slug.includes("homecare") || slug.includes("home-care") || slug.includes("nurse") || slug.includes("physio")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
          <path d="M15 45 L50 15 L85 45 V85 H60 V60 H40 V85 H15 Z" />
          <path d="M43 38 H57 V48 H43 Z" fill="white" />
        </svg>
      );
    }

    // Equipment
    if (slug.includes("equipment") || slug.includes("surgical")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
          <circle cx="35" cy="70" r="15" stroke="currentColor" strokeWidth="6" fill="none" />
          <circle cx="75" cy="70" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path d="M35 55 h35 v10 h-35 z" />
          <path d="M50 30 v25 M40 30 h20" stroke="currentColor" strokeWidth="6" />
        </svg>
      );
    }

    // Surgeries / Treatments
    if (slug.includes("surger") || slug.includes("treatment")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
          <path d="M10 50 Q30 20, 50 50 T90 50" stroke="currentColor" strokeWidth="6" fill="none" />
          <circle cx="50" cy="50" r="8" />
        </svg>
      );
    }

    // Ambulance
    if (slug.includes("ambulance")) {
      return (
        <svg viewBox="0 0 100 100" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
          <path d="M15 35 h50 l15 15 v25 h-65 z" />
          <circle cx="30" cy="75" r="10" />
          <circle cx="65" cy="75" r="10" />
          <path d="M40 45 H50 V55 H40 Z" fill="white" />
        </svg>
      );
    }

    // Default Shield
    return (
      <svg viewBox="0 0 100 120" className="w-full h-full fill-current text-[var(--color-primary-dark,#331962)]">
        <path d="M50 0 L90 20 V60 C90 85 70 108 50 115 C30 108 10 85 10 60 V20 Z" />
        <path d="M42 35 H58 V51 H74 V67 H58 V83 H42 V67 H26 V51 H42 Z" fill="white" />
      </svg>
    );
  };

  // React State for a Live Countdown Timer
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 12, seconds: 48 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 4, minutes: 12, seconds: 48 }; // Loop reset
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const NextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute right-[2px] md:right-[-15px] top-1/2 -translate-y-1/2 w-10 h-10 !rounded-full bg-white border border-slate-200 text-primary-dark shadow-md hover:bg-slate-50 hover:scale-105 transition-all z-10 flex items-center justify-center cursor-pointer"
    >
      <i className="fa-solid fa-chevron-right text-xs"></i>
    </button>
  );

  const PrevArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute left-[2px] md:left-[-15px] top-1/2 -translate-y-1/2 w-10 h-10 !rounded-full bg-white border border-slate-200 text-primary-dark shadow-md hover:bg-slate-50 hover:scale-105 transition-all z-10 flex items-center justify-center cursor-pointer"
    >
      <i className="fa-solid fa-chevron-left text-xs"></i>
    </button>
  );

  const dynamicSettings = {
    dots: false,
    arrows: true,
    infinite: false,
    speed: 500,
    slidesToShow: 6,
    slidesToScroll: 1,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    responsive: [
      { breakpoint: 1400, settings: { slidesToShow: 6 } },
      { breakpoint: 1200, settings: { slidesToShow: 4 } },
      { breakpoint: 992, settings: { slidesToShow: 3 } },
      { breakpoint: 768, settings: { slidesToShow: 2, arrows: true } },
      { breakpoint: 480, settings: { slidesToShow: 1.2, arrows: true } },
    ],
  };

  const normalizeItem = (item) => {
    const DiscusedPrice = item?.tablet?.price;

    const productDetails = item?.productDetails || {};
    const businessDetails = productDetails?.businessDetails || {};
    const vendorDetails = productDetails?.vendor || {};

    const firstVendor =
      item.vendordetails ||
      (item.vendors && item.vendors[0]) ||
      item.vendor ||
      null;

    const newApiVendor = {
      vendorId: vendorDetails._id || vendorDetails.id,
      name: businessDetails.name || vendorDetails.name || "",
      bussiness_image: businessDetails.bussiness_image || vendorDetails.bussiness_image || [],
      price: item.price || item.matchedPrice || 0,
      discountprice: item.discountPrice || item.matchedDiscountPrice || null,
      discountType: item.discountType || null,
      stock: item.stock || 999,
      bookingType: item.bookingType || "cart",
    };
    // const categoryFixedType = item?.serviceId?.fixedType;


    // console.log('normallzied product  fixedtype', categoryFixedType)

    const finalVendor = firstVendor ? {
      ...firstVendor,
      name: firstVendor.name || firstVendor.businessdetails?.name || "",
      price:
        firstVendor.price ||
        firstVendor.matchedVariantPrice ||
        firstVendor.matchedPrice ||
        firstVendor.mrp ||
        firstVendor.sellingPrice ||
        DiscusedPrice ||
        0,
    } : (vendorDetails._id ? {
      ...newApiVendor,
      name: newApiVendor.name,
      price:
        newApiVendor.price ||
        DiscusedPrice ||
        0,
    } : null);

    return {
      ...item,
      tabletdetails: item.tabletdetails || item.tablet || item,
      vendordetails: finalVendor,
      // currentService: categoryFixedType,
      variants:
        item.variants ||
        item.tablet?.variant ||
        item.tabletdetails?.variant ||
        productDetails.variants ||
        [],
    };
  };

  // Helper mapping service details to custom backgrounds and specialized GPU-accelerated animations
  const getServiceTheme = (serviceSlug = "", index) => {
    const slug = String(serviceSlug || "").toLowerCase().replace("-", "").replace("_", "");
    const themeIndex = index % 3;

    // Explicit mapping for all 10 category fixedType values from the API
    if (slug.includes("medicine")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#f6f2ff] !to-[#fbfaff] !border-[#e8dbff] !shadow-[0_15px_40px_rgba(128,89,202,0.05)]",
        bannerBg: "from-primary-dark to-[#6d4db8]",
        iconClass: "fas fa-pills text-primary-dark animate-pulse-glow",
        bubbleColor: "text-primary-dark/35",
        animationType: "medicine",
        badge: "💊 Best Prices",
        description: "Compare & buy prescription medicines from top verified pharmacies near you.",
        coverImage: "/medicine_service_cover_1785758500493.png",
      };
    } else if (slug.includes("labtest")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#f0fdfa] !to-[#fcfdfd] !border-[#b2f5ea] !shadow-[0_15px_40px_rgba(13,148,136,0.05)]",
        bannerBg: "from-[#0d9488] to-[#0f766e]",
        iconClass: "fas fa-flask text-[#0d9488] animate-pulse-glow",
        bubbleColor: "text-[#0d9488]/35",
        animationType: "diagnostics",
        badge: "🧪 Lab Offers",
        description: "Book NABL-certified lab tests at home with fast results and expert review.",
        coverImage: "/labtest_service_cover_1785758513250.png",
      };
    } else if (slug.includes("diagnostic")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#f0f8ff] !to-[#f8fbff] !border-[#cce4ff] !shadow-[0_15px_40px_rgba(59,130,246,0.05)]",
        bannerBg: "from-[#1e3a8a] via-[#3b82f6] to-[#1d4ed8]",
        iconClass: "fas fa-microscope text-[#3b82f6] animate-pulse-glow",
        bubbleColor: "text-[#3b82f6]/35",
        animationType: "diagnostics",
        badge: "🔬 Scan & Save",
        description: "MRI, CT, X-Ray & ultrasound comparisons from accredited diagnostic centres.",
        coverImage: "/diagnostic_service_cover_1785758526170.png",
      };
    } else if (slug.includes("homecare")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#fff6ed] !to-[#fffcf8] !border-[#ffe3cc] !shadow-[0_15px_40px_rgba(249,115,22,0.05)]",
        bannerBg: "from-[#f97316] to-[#ea580c]",
        iconClass: "fas fa-home text-[#f97316] animate-pulse-glow",
        bubbleColor: "text-[#f97316]/35",
        animationType: "homecare",
        badge: "🏠 Home Visit",
        description: "Professional healthcare at your doorstep — physiotherapy, nursing & more.",
        coverImage: "/homecare_service_cover_1785758536803.png",
      };
    } else if (slug.includes("nursingcare")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#eef2ff] !to-[#fafbfe] !border-[#c7d2fe] !shadow-[0_15px_40px_rgba(79,70,229,0.05)]",
        bannerBg: "from-[#4f46e5] to-[#3730a3]",
        iconClass: "fas fa-user-nurse text-[#4f46e5] animate-pulse-glow",
        bubbleColor: "text-[#4f46e5]/35",
        animationType: "homecare",
        badge: "👩‍⚕️ Verified Nurses",
        description: "Trained nursing staff & clinic services for personalised recovery care.",
        coverImage: "/homecare_service_cover_1785758536803.png",
      };
    } else if (slug.includes("dental")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#fefcd7] !to-[#fffdf5] !border-[#fef08a] !shadow-[0_15px_40px_rgba(202,138,4,0.05)]",
        bannerBg: "from-[#ca8a04] to-[#a16207]",
        iconClass: "fas fa-tooth text-[#ca8a04] animate-pulse-glow",
        bubbleColor: "text-[#ca8a04]/35",
        animationType: "homecare",
        badge: "🦷 Dental Deals",
        description: "Whitening, braces, implants & more — compare trusted dental clinics.",
        coverImage: "/homecare_service_cover_1785758536803.png",
      };
    } else if (slug.includes("equipment")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#f1f5f9] !to-[#fafbfc] !border-[#cbd5e1] !shadow-[0_15px_40px_rgba(71,85,105,0.05)]",
        bannerBg: "from-[#475569] to-[#334155]",
        iconClass: "fas fa-wheelchair text-[#475569] animate-pulse-glow",
        bubbleColor: "text-[#475569]/35",
        animationType: "medicine",
        badge: "🏥 Rent or Buy",
        description: "Hospital-grade equipment for home use — beds, wheelchairs, oxygen & more.",
        coverImage: "/equipment_service_cover_1785758548596.png",
      };
    } else if (slug.includes("treatment")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#fae8ff] !to-[#fdf4ff] !border-[#f5d0fe] !shadow-[0_15px_40px_rgba(192,132,252,0.05)]",
        bannerBg: "from-[#c084fc] to-[#a855f7]",
        iconClass: "fas fa-procedures text-[#c084fc] animate-pulse-glow",
        bubbleColor: "text-[#c084fc]/35",
        animationType: "homecare",
        badge: "💜 Certified Plans",
        description: "Explore treatment packages from certified healthcare specialists.",
        coverImage: "/homecare_service_cover_1785758536803.png",
      };
    } else if (slug.includes("surgeries") || slug.includes("surgery")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#fff5f5] !to-[#fffbfb] !border-[#fee2e2] !shadow-[0_15px_40px_rgba(220,38,38,0.05)]",
        bannerBg: "from-[#dc2626] to-[#b91c1c]",
        iconClass: "fas fa-syringe text-[#dc2626] animate-pulse-glow",
        bubbleColor: "text-[#dc2626]/35",
        animationType: "homecare",
        badge: "🔴 Expert Surgeons",
        description: "Compare surgery costs & connect with top surgeons across specialities.",
        coverImage: "/surgeries_service_cover_1785758560588.png",
      };
    } else if (slug.includes("ambulance")) {
      return {
        bgClass: "!bg-gradient-to-br !from-[#fef2f2] !to-[#fffbfa] !border-[#fee2e2] !shadow-[0_15px_40px_rgba(153,27,27,0.05)]",
        bannerBg: "from-[#991b1b] to-[#7f1d1d]",
        iconClass: "fas fa-ambulance text-[#991b1b] animate-pulse-glow",
        bubbleColor: "text-[#991b1b]/35",
        animationType: "homecare",
        badge: "🚑 24/7 Emergency",
        description: "Book verified ambulance services instantly for emergency transport.",
        coverImage: "/ambulance_service_cover_1785758575010.png",
      };
    } else {
      // Fallbacks based on themeIndex
      if (themeIndex === 0) {
        return {
          bgClass: "!bg-gradient-to-br !from-[#f6f2ff] !to-[#fbfaff] !border-[#e8dbff] !shadow-[0_15px_40px_rgba(128,89,202,0.05)]",
          bannerBg: "from-primary-dark to-[#6d4db8]",
          iconClass: "fas fa-heartbeat text-primary-dark",
          bubbleColor: "text-primary-dark/35",
          animationType: "medicine",
          badge: "⭐ Top Picks",
          description: "Discover the best healthcare options compared in one place.",
          coverImage: "/medicine_service_cover_1785758500493.png",
        };
      } else if (themeIndex === 1) {
        return {
          bgClass: "!bg-gradient-to-br !from-[#f0f8ff] !to-[#f8fbff] !border-[#cce4ff] !shadow-[0_15px_40px_rgba(59,130,246,0.05)]",
          bannerBg: "from-[#1e3a8a] via-[#3b82f6] to-[#1d4ed8]",
          iconClass: "fas fa-laptop-medical text-[#3b82f6]",
          bubbleColor: "text-[#3b82f6]/35",
          animationType: "diagnostics",
          badge: "🧪 Top Diagnost",
          description: "NABL tests and radiology comparisons from leading centers.",
          coverImage: "/diagnostic_service_cover_1785758526170.png",
        };
      } else {
        return {
          bgClass: "!bg-gradient-to-br !from-[#fff6ed] !to-[#fffcf8] !border-[#ffe3cc] !shadow-[0_15px_40px_rgba(249,115,22,0.05)]",
          bannerBg: "from-[#f97316] to-[#ea580c]",
          iconClass: "fas fa-stethoscope text-[#f97316]",
          bubbleColor: "text-[#f97316]/35",
          animationType: "homecare",
          badge: "🏠 Quality Care",
          description: "Verified doctors, nurses and care coordinators at your disposal.",
          coverImage: "/homecare_service_cover_1785758536803.png",
        };
      }
    }
  };

  const renderFloatingIcons = (animationType, colorClass) => {
    let icons = [];
    if (animationType === "medicine") {
      icons = [
        "fa-pills", "fa-capsules", "fa-prescription-bottle", "fa-tablet-alt", "fa-first-aid",
        "fa-capsules", "fa-tablets", "fa-prescription", "fa-hand-holding-medical", "fa-plus-circle",
        "fa-pills", "fa-capsules", "fa-prescription-bottle", "fa-tablet-alt", "fa-first-aid"
      ];
    } else if (animationType === "diagnostics") {
      icons = [
        "fa-flask", "fa-microscope", "fa-vial", "fa-dna", "fa-stethoscope",
        "fa-thermometer", "fa-vials", "fa-file-medical-alt", "fa-heartbeat", "fa-user-md",
        "fa-flask", "fa-microscope", "fa-vial", "fa-dna", "fa-stethoscope"
      ];
    } else if (animationType === "homecare") {
      icons = [
        "fa-heartbeat", "fa-user-nurse", "fa-ambulance", "fa-syringe", "fa-briefcase-medical",
        "fa-procedures", "fa-hand-holding-heart", "fa-clock", "fa-user-md", "fa-clinic-medical",
        "fa-heartbeat", "fa-user-nurse", "fa-ambulance", "fa-syringe", "fa-briefcase-medical"
      ];
    } else {
      icons = [
        "fa-heartbeat", "fa-pills", "fa-flask", "fa-microscope", "fa-user-nurse",
        "fa-stethoscope", "fa-first-aid", "fa-capsules", "fa-ambulance", "fa-dna",
        "fa-heartbeat", "fa-pills", "fa-flask", "fa-microscope", "fa-user-nurse"
      ];
    }

    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {icons.map((icon, i) => {
          const left = `${2 + i * 6.5}%`; // Distribute across width
          const dimension = 32 + (i % 4) * 6; // Sizes: 32px, 38px, 44px, 50px
          const rotation = (i * 24) % 360;

          return (
            <div
              key={i}
              className="absolute animate-float flex items-center justify-center rounded-2xl border border-black/5 bg-white/20 shadow-sm transition-all duration-300 hover:scale-110"
              style={{
                left: left,
                top: `${8 + (i * 17) % 75}%`,
                width: `${dimension}px`,
                height: `${dimension}px`,
                animationDelay: `${i * 0.4}s`,
                animationDuration: `${7 + (i % 3) * 4}s`
              }}
            >
              <i
                className={`fas ${icon} ${colorClass.split("/")[0]}`}
                style={{
                  fontSize: `${dimension * 0.45}px`,
                  opacity: 0.25,
                  transform: `rotate(${rotation}deg)`
                }}
              />
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      {/* Premium Injected Styles for Highly Optimized GPU-Accelerated Animations */}
      <style>{`
        @keyframes floatBubble {
          0% { transform: translate3d(0, 0, 0) rotate(0deg); }
          50% { transform: translate3d(8px, -35px, 0) rotate(4deg); }
          100% { transform: translate3d(0, 0, 0) rotate(0deg); }
        }
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.06); }
        }
        .animate-float {
          animation: floatBubble 10s ease-in-out infinite;
          will-change: transform;
        }
        .animate-gradient-bg {
          background-size: 200% 200%;
          animation: gradientMove 14s ease infinite;
          will-change: background-position;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2.5s infinite ease-in-out;
          will-change: transform, opacity;
        }
        @keyframes scanLaser {
          0% { transform: translateY(-100%); opacity: 0; }
          10%, 90% { opacity: 0.08; }
          50% { transform: translateY(100%); opacity: 0.18; }
          100% { transform: translateY(-100%); opacity: 0; }
        }
        @keyframes heartbeatPulse {
          0% { transform: scaleX(0); opacity: 0.05; transform-origin: left; }
          40% { opacity: 0.2; }
          80%, 100% { transform: scaleX(1); opacity: 0.05; transform-origin: left; }
        }
        .animate-gradient-bg {
          background-size: 200% 200%;
          animation: gradientMove 14s ease infinite;
          will-change: background-position;
        }
        .animate-pulse-glow {
          animation: pulseGlow 2.5s infinite ease-in-out;
          will-change: transform, opacity;
        }
        .laser-scan-effect {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, transparent 48%, rgba(59, 130, 246, 0.25) 50%, transparent 52%);
          pointer-events: none;
          animation: scanLaser 7s linear infinite;
          z-index: 1;
          will-change: transform, opacity;
        }
        .vital-pulse-line {
          position: absolute;
          bottom: 2px;
          left: 0;
          width: 100%;
          height: 3px;
          background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.4), transparent);
          pointer-events: none;
          animation: heartbeatPulse 4s ease-in-out infinite;
          z-index: 1;
          will-change: transform, opacity;
        }
        /* Style adjustments for custom slider arrows of react-slick to ensure they stand out */
        .dynamic-equal-slider {
          position: relative !important;
          padding: 0 10px !important;
        }
      `}</style>

      {sections &&
        sections.length > 0 &&
        sections.map((section, index) => {
          const { title, serviceId, products } = section;
          if (!products || products.length === 0) return null;

          const themeIndex = index % 3;

          const serviceSlug = currentService || serviceId?.slug || section.serviceType || "";
          const serviceTheme = getServiceTheme(serviceSlug, index);
          const colorMatch = serviceTheme.iconClass?.match(/text-\[(\#[a-fA-F0-9]+)\]/);
          const themeColor = colorMatch ? colorMatch[1] : "var(--color-primary-dark)";
          const categoryFixedType = section?.serviceId?.fixedType || "";
          return (
            <div
              key={section._id || index}
              className="w-full py-3 sm:py-4 relative overflow-hidden"
              style={{
                backgroundImage: `url('/medicompare_bg4_instant_healthcare.png')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            >
              {/* Dot Matrix Pattern (Top Left) - Matching Mockup */}
              <div className="absolute top-8 left-8 w-24 h-24 opacity-[0.07] pointer-events-none hidden md:block" style={{
                backgroundImage: "radial-gradient(var(--color-primary-dark, #331962) 2px, transparent 2px)",
                backgroundSize: "12px 12px"
              }} />

              {/* Medical Shield / Service Icon (Top Right) - Matching Mockup */}
              <div className="absolute top-6 right-8 w-24 h-28 opacity-[0.06] pointer-events-none hidden md:block">
                {getServiceBackgroundIcon(serviceSlug)}
              </div>

              <div className="max-w-full mx-auto px-2 md:px-4 relative z-10">
                {/* Rounded Inner Container Box matching mockup style */}
                <div className="py-1 px-1 md:py-1.5 md:px-2">
                  <SectionHeader
                    title={title}
                    icon={serviceTheme.iconClass || "fas fa-tag"}
                    viewAllLink={`/${currentService || serviceId?.slug || "medicine"}/all`}
                    className="mb-3 pb-2 border-b border-slate-100/50"
                  />
                  {/* Horizontal Products List Slider */}
                  <div className="relative">
                    <style>{`
                      .dynamic-equal-slider .slick-track { display: flex !important; align-items: stretch !important; }
                      .dynamic-equal-slider .slick-slide { height: auto !important; display: flex !important; flex-direction: column !important; }
                      .dynamic-equal-slider .slick-slide > div { height: 100% !important; display: flex !important; flex-direction: column !important; flex: 1 !important; }
                    `}</style>
                    <Slider {...dynamicSettings} className="dynamic-equal-slider">
                      {products.map((item, i) => {
                        const normalizedItem = normalizeItem(item);
                        const variant = Array.isArray(normalizedItem?.variants)
                          ? normalizedItem.variants[0]
                          : normalizedItem?.variants;

                        return (
                          <div key={i} className="px-2 h-full flex">
                            <SectionProductCard2
                              item={normalizedItem}
                              variant={variant}
                              imgUrl={imgUrl}
                              onProductClick={onProductClick}
                              onCompareClick={onCompareClick}
                              onVendorClick={onVendorClick}
                              maxStock={variant?.stock || 999}
                              isMobile={isMobile}
                              currentService={categoryFixedType || currentService || categoryFixedType}
                              disableTooltips={liteMode}
                              className="!h-full"
                              serviceSlug={serviceSlug}
                            />
                          </div>
                        );
                      })}
                    </Slider>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
    </>
  );
};

export default DynamicCategorySections;