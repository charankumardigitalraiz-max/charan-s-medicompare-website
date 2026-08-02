import React, { useEffect, useState } from "react";

export const PAGE_LOADER_IMAGE = "/MediCompares_Logo.png";

// Service Themes Mapping matching all 10 API categories
const CATEGORY_THEMES = {
  medicine: {
    image: "/assets/img/loaders/medicine_loader.png",
    color: "#8059ca",
    label: "Rx Medicines",
    bg: "from-[#f6f2ff] to-[#fbfaff]",
    subtext: "Comparing prescription medicine prices...",
  },
  labtests: {
    image: "/assets/img/loaders/labtests_loader.png",
    color: "#0d9488",
    label: "Lab Tests",
    bg: "from-[#f0fdfa] to-[#fcfdfd]",
    subtext: "Gathering verified laboratory packages...",
  },
  diagnostics: {
    image: "/assets/img/loaders/diagnostics_loader.png",
    color: "#1d4ed8",
    label: "Diagnostics",
    bg: "from-[#f0f8ff] to-[#f8fbff]",
    subtext: "Loading checkup & scan comparisons...",
  },
  homecare: {
    image: "/assets/img/loaders/homecare_loader.png",
    color: "#ea580c",
    label: "Home Care",
    bg: "from-[#fff6ed] to-[#fffcf8]",
    subtext: "Retrieving supportive nursing details...",
  },
  nursingcare: {
    image: "/assets/img/loaders/nursingcare_loader.png",
    color: "#4f46e5",
    label: "Clinics & Rehabs",
    bg: "from-[#eef2ff] to-[#fafbfe]",
    subtext: "Connecting with clinic services...",
  },
  dentalservice: {
    image: "/assets/img/loaders/dentalservice_loader.png",
    color: "#ca8a04",
    label: "Dental Care",
    bg: "from-[#fefcd7] to-[#fffdf5]",
    subtext: "Loading dental treatment details...",
  },
  medicalequipment: {
    image: "/assets/img/loaders/medicalequipment_loader.png",
    color: "#475569",
    label: "Medical Equipment",
    bg: "from-[#f1f5f9] to-[#fafbfc]",
    subtext: "Loading hospital device rentals...",
  },
  medicaltreatment: {
    image: "/assets/img/loaders/medicaltreatment_loader.png",
    color: "#c084fc",
    label: "Treatments",
    bg: "from-[#fae8ff] to-[#fdf4ff]",
    subtext: "Sourcing certified healthcare plans...",
  },
  surgeries: {
    image: "/assets/img/loaders/medicaltreatment_loader.png", // Reusing the high-quality treatment/clipboard loader
    color: "#dc2626",
    label: "Surgeries",
    bg: "from-[#fff5f5] to-[#fffbfb]",
    subtext: "Connecting with surgery advisors...",
  },
  ambulanceservice: {
    image: "/assets/img/loaders/generic_loader.png",
    color: "#991b1b",
    label: "Ambulance",
    bg: "from-[#fef2f2] to-[#fffbfa]",
    subtext: "Connecting with emergency ambulances...",
  },
};

// Helper to determine active category from URL paths
const getCategoryFromUrl = (path, search) => {
  const urlString = (path + search).toLowerCase().replace("-", "").replace("_", "");

  if (urlString.includes("medicine") || urlString.includes("rx")) return "medicine";
  if (urlString.includes("labtest")) return "labtests";
  if (urlString.includes("diagnostic")) return "diagnostics";
  if (urlString.includes("homecare") || urlString.includes("home-care")) return "homecare";
  if (urlString.includes("nursing") || urlString.includes("clinic") || urlString.includes("rehab")) return "nursingcare";
  if (urlString.includes("dental") || urlString.includes("teeth")) return "dentalservice";
  if (urlString.includes("equipment") || urlString.includes("device")) return "medicalequipment";
  if (urlString.includes("treatment")) return "medicaltreatment";
  if (urlString.includes("surger")) return "surgeries";
  if (urlString.includes("ambulance")) return "ambulanceservice";

  return null;
};

const PageLoader = () => {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    // 1. Try to read from sessionStorage (populated on click)
    const stored = sessionStorage.getItem("activeCategoryLoader");
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const fixedType = data.fixedType?.toLowerCase().replace("-", "").replace("_", "");

        // Find matching theme key
        const matchKey = Object.keys(CATEGORY_THEMES).find(
          (key) => fixedType.includes(key) || key.includes(fixedType)
        );

        if (matchKey && CATEGORY_THEMES[matchKey]) {
          setTheme(CATEGORY_THEMES[matchKey]);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }

    // 2. Fallback to URL detection
    const pathTheme = getCategoryFromUrl(window.location.pathname, window.location.search);
    if (pathTheme && CATEGORY_THEMES[pathTheme]) {
      setTheme(CATEGORY_THEMES[pathTheme]);
    }
  }, []);

  // Clean up stored loader state on mount so it doesn't bleed into other loadings
  useEffect(() => {
    return () => {
      sessionStorage.removeItem("activeCategoryLoader");
    };
  }, []);

  // Standard generic site spinner fallback if no category matches
  if (!theme) {
    return (
      <div
        className="flex flex-col justify-center items-center h-screen w-screen bg-slate-50/50"
      >
        <style>{`
          @keyframes bouncePulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.05); opacity: 1; }
          }
          .logo-pulse {
            animation: bouncePulse 2s infinite ease-in-out;
          }
        `}</style>
        <img
          className="logo-pulse"
          src={PAGE_LOADER_IMAGE}
          alt="Loading..."
          width={180}
          style={{ height: "auto" }}
        />
        <div className="w-12 h-1 rounded-full bg-[#8059ca]/25 overflow-hidden mt-6 relative">
          <div className="absolute top-0 left-0 h-full bg-[#8059ca] w-1/2 rounded-full animate-[loadingBar_1.5s_infinite_ease-in-out]" />
        </div>
        <style>{`
          @keyframes loadingBar {
            0% { left: -50%; }
            100% { left: 100%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col justify-center items-center h-screen w-screen bg-gradient-to-br ${theme.bg} relative overflow-hidden`}
    >
      {/* Floating dynamic backdrop glows matching category color */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-10 animate-pulse pointer-events-none"
        style={{
          backgroundColor: theme.color,
          top: "20%",
          left: "20%"
        }}
      />
      <div
        className="absolute w-[300px] h-[300px] rounded-full blur-[100px] opacity-10 animate-pulse pointer-events-none"
        style={{
          backgroundColor: theme.color,
          bottom: "20%",
          right: "20%",
          animationDelay: "1s"
        }}
      />

      <style>{`
        @keyframes customRotate {
          100% { transform: rotate(360deg); }
        }
        @keyframes customPulse {
          0%, 100% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.05); opacity: 1; }
        }
        @keyframes customProgress {
          0% { width: 0%; left: 0%; }
          50% { width: 40%; }
          100% { width: 0%; left: 100%; }
        }
        .animate-custom-rotate {
          animation: customRotate 2s linear infinite;
        }
        .animate-custom-pulse {
          animation: customPulse 1.8s ease-in-out infinite;
        }
      `}</style>

      {/* Main Glassmorphic Spinner Ring */}
      <div className="relative flex items-center justify-center w-36 h-36 mb-8">
        <div
          className="absolute inset-0 rounded-full border-[3.5px] border-t-transparent animate-custom-rotate"
          style={{ borderColor: `${theme.color}20`, borderTopColor: theme.color }}
        />
        <div
          className="absolute w-28 h-28 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden animate-custom-pulse border border-white/60"
        >
          <img
            src={theme.image}
            alt={theme.label}
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Typography */}
      <h3
        className="text-lg font-black tracking-wide mb-1.5 uppercase text-slate-800"
        style={{ color: theme.color }}
      >
        {theme.label}
      </h3>
      <p className="text-xs font-semibold text-slate-500/80 mb-6">
        {theme.subtext}
      </p>

      {/* Linear Progress Bar */}
      <div className="w-48 h-1.5 rounded-full bg-slate-200/60 overflow-hidden relative border border-white/50 shadow-inner">
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            backgroundColor: theme.color,
            width: "30%",
            animation: "customProgress 1.6s infinite ease-in-out"
          }}
        />
      </div>
    </div>
  );
};

export default PageLoader;
