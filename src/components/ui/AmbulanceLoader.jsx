import React from "react";

const AmbulanceLoader = () => {
  return (
    <div className="text-center py-[30px] flex flex-col items-center justify-center">
      <style>{`
        @keyframes rotate-wheel {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes flash-red {
          0%, 100% { fill: #ef4444; filter: drop-shadow(0 0 6px rgba(239, 68, 68, 0.7)); }
          50% { fill: #fee2e2; filter: none; }
        }
        @keyframes flash-blue {
          0%, 100% { fill: #dbeafe; filter: none; }
          50% { fill: #3b82f6; filter: drop-shadow(0 0 6px rgba(59, 130, 246, 0.7)); }
        }
        @keyframes bounce-body {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2.2px); }
        }
        @keyframes road-move {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        @keyframes scroll-far {
          0% { transform: translateX(0); }
          100% { transform: translateX(-200px); }
        }
        @keyframes scroll-mid {
          0% { transform: translateX(0); }
          100% { transform: translateX(-200px); }
        }
        @keyframes wind-fade {
          0% { transform: translateX(0) scaleX(0.8); opacity: 0; }
          50% { opacity: 0.6; }
          100% { transform: translateX(-30px) scaleX(1.2); opacity: 0; }
        }
        @keyframes underglow-pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
        .amb-wheel {
          transform-box: fill-box;
          transform-origin: center;
          animation: rotate-wheel 0.35s infinite linear;
        }
        .amb-siren-left {
          animation: flash-red 0.25s infinite alternate;
        }
        .amb-siren-right {
          animation: flash-blue 0.25s infinite alternate;
        }
        .amb-body-group {
          animation: bounce-body 0.18s infinite ease-in-out;
        }
        .amb-road-line {
          stroke-dasharray: 8 6;
          animation: road-move 0.15s infinite linear;
        }
        .city-far-scroll {
          animation: scroll-far 15s infinite linear;
        }
        .city-mid-scroll {
          animation: scroll-mid 8s infinite linear;
        }
        .amb-wind {
          animation: wind-fade 0.45s infinite linear;
        }
        .amb-underglow {
          animation: underglow-pulse 1.5s infinite ease-in-out;
        }
      `}</style>
      
      <div className="w-full max-w-[440px] mx-auto relative flex flex-col items-center justify-center">
        <div className="w-full h-[150px] relative flex items-center justify-center overflow-hidden rounded-[16px] bg-[#f0f9ff]">
          <svg className="w-full h-full" viewBox="0 0 200 110" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Day Time Gradients */}
              <linearGradient id="sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#bae6fd" />
                <stop offset="60%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#f0f9ff" />
              </linearGradient>
              <linearGradient id="chassis-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#f1f5f9" />
              </linearGradient>
              <linearGradient id="window-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7dd3fc" />
                <stop offset="100%" stopColor="#0284c7" />
              </linearGradient>
              <radialGradient id="neon-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#6366f1" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="siren-glow-red" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
              </radialGradient>
              <radialGradient id="siren-glow-blue" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </radialGradient>
              <linearGradient id="headlight-beam" x1="0%" y1="50%" x2="100%" y2="50%">
                <stop offset="0%" stopColor="#fef08a" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Daytime Sky Background */}
            <rect width="200" height="110" fill="url(#sky-grad)" />

            {/* Clouds backdrop */}
            <g opacity="0.5" className="amb-cloud">
              <path d="M 30,15 Q 35,10 40,15 Q 45,12 48,17 Q 52,17 51,22 L 25,22 Z" fill="#ffffff" />
              <path d="M 140,25 Q 145,20 150,25 Q 155,22 158,27 Q 162,27 161,32 L 135,32 Z" fill="#ffffff" />
            </g>

            {/* DISTANT SKYLINE (Slow Scrolling) */}
            <g className="city-far-scroll" opacity="0.3">
              <path d="M0,80 L15,80 L15,45 L30,45 L30,60 L50,60 L50,35 L70,35 L70,80 L95,80 L95,40 L115,40 L115,55 L130,55 L130,30 L150,30 L150,80 L175,80 L175,45 L190,45 L190,60 L210,60 L210,35 L230,35 L230,80 L255,80 L255,40 L275,40 L275,55 L290,55 L290,30 L310,30 L310,80 L335,80 L335,45 L350,45 L350,60 L370,60 L370,35 L390,35 L390,80 L400,80" fill="#e2e8f0" />
            </g>

            {/* MIDGROUND SKYLINE (Medium Scrolling) */}
            <g className="city-mid-scroll" opacity="0.5">
              <path d="M0,80 L25,80 L25,52 L45,52 L45,65 L60,65 L60,40 L85,40 L85,55 L100,55 L100,80 L125,80 L125,52 L145,52 L145,65 L160,65 L160,40 L185,40 L185,55 L200,55 L200,80 L225,80 L225,52 L245,52 L245,65 L260,65 L260,40 L285,40 L285,55 L300,55 L300,80 L325,80 L325,52 L345,52 L345,65 L360,65 L360,40 L385,40 L385,55 L400,55 L400,80" fill="#cbd5e1" />
              
              {/* Window lines simulating day reflections */}
              <line x1="12" y1="56" x2="12" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 3.5" />
              <line x1="18" y1="56" x2="18" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 3.5" />
              <line x1="68" y1="44" x2="68" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 4" />
              <line x1="74" y1="44" x2="74" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 4" />

              {/* Duplicated windows for seamless loop offset 200px */}
              <line x1="212" y1="56" x2="212" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 3.5" />
              <line x1="218" y1="56" x2="218" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 3.5" />
              <line x1="268" y1="44" x2="268" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 4" />
              <line x1="274" y1="44" x2="274" y2="76" stroke="#ffffff" strokeWidth="1" strokeDasharray="1.5 4" />
            </g>

            {/* Brand Purple Underglow (stands below the ambulance) */}
            <ellipse cx="90" cy="80" rx="42" ry="4" fill="url(#neon-glow)" className="amb-underglow" />

            {/* Headlight Beam Vector (extending from front of ambulance) */}
            <g className="amb-body-group">
              <polygon points="144,65 196,72 196,89 144,83" fill="url(#headlight-beam)" />
            </g>

            {/* Wind zooming lines */}
            <line x1="22" y1="36" x2="2" y2="36" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" className="amb-wind" style={{ animationDelay: "0s" }} />
            <line x1="18" y1="50" x2="4" y2="50" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" className="amb-wind" style={{ animationDelay: "0.15s" }} />
            <line x1="26" y1="62" x2="6" y2="62" stroke="#6366f1" strokeWidth="1.5" strokeLinecap="round" className="amb-wind" style={{ animationDelay: "0.3s" }} />

            {/* Animated ambulance body group */}
            <g className="amb-body-group">
              {/* Siren Radial Glow Rings */}
              <circle cx="62" cy="30" r="15" fill="url(#siren-glow-red)" className="amb-siren-left" />
              <circle cx="70" cy="30" r="15" fill="url(#siren-glow-blue)" className="amb-siren-right" />

              {/* Siren bar casing */}
              <rect x="58" y="32" width="16" height="4" rx="2" fill="#475569" />
              <path d="M 60,32 Q 64,27 68,32 Z" fill="#ef4444" className="amb-siren-left" />
              <path d="M 68,32 Q 72,27 76,32 Z" fill="#3b82f6" className="amb-siren-right" />

              {/* Sleek Aerodynamic EV Ambulance Body */}
              <path d="M 32,76 L 32,36 Q 32,34 35,34 L 105,34 Q 107,34 109,36 L 118,48 L 138,56 Q 144,58 144,63 L 144,76 Z" fill="url(#chassis-grad)" stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              
              {/* Brand Purple Body Accent Stripe */}
              <path d="M 33,58 L 143,58 L 138,56 L 108,56 L 33,56 Z" fill="var(--color-primary,#4c2691)" />

              {/* Modern Tinted Glass Windows */}
              <path d="M 104,38 L 115,38 L 123,48 L 104,48 Z" fill="url(#window-grad)" stroke="#1e293b" strokeWidth="2" strokeLinejoin="round" />
              <line x1="113" y1="38" x2="117" y2="48" stroke="#1e293b" strokeWidth="1.5" />
              
              {/* Futuristic Flush Rear Windows */}
              <rect x="42" y="40" width="18" height="12" rx="3" fill="url(#window-grad)" stroke="#1e293b" strokeWidth="1.5" />
              <rect x="68" y="40" width="18" height="12" rx="3" fill="url(#window-grad)" stroke="#1e293b" strokeWidth="1.5" />

              {/* Red Cross Emblem */}
              <circle cx="51" cy="65" r="7" fill="#ffffff" stroke="#ef4444" strokeWidth="1.5" />
              <rect x="48" y="64" width="6" height="2" rx="0.5" fill="#ef4444" />
              <rect x="50" y="62" width="2" height="6" rx="0.5" fill="#ef4444" />

              {/* Futuristic Typography */}
              <text x="64" y="68" fill="#1e293b" fontSize="6.5" fontWeight="900" fontFamily="system-ui, sans-serif" letterSpacing="0.8">RESCUE</text>

              {/* Sleek Side Mirror */}
              <path d="M 124,46 Q 127,46 126,42 L 122,42" fill="none" stroke="#1e293b" strokeWidth="1.5" />
              <rect x="125" y="40" width="2" height="5" rx="0.5" fill="#1e293b" />

              {/* LED Headlight glow and Taillight red */}
              <path d="M 144,63 Q 146,65 144,67 Z" fill="#ffffff" className="amb-siren-right" />
              <rect x="31" y="44" width="2.5" height="8" rx="0.5" fill="#ef4444" />
              
              {/* Carbon Fiber Bumpers */}
              <rect x="140" y="73" width="5" height="4" rx="1.5" fill="#475569" />
              <rect x="29" y="72" width="4" height="5" rx="1.5" fill="#475569" />
              
              {/* Sporty Wheel Fenders */}
              <path d="M 40,76 A 12,12 0 0,1 64,76" fill="none" stroke="#1e293b" strokeWidth="2.5" />
              <path d="M 98,76 A 12,12 0 0,1 122,76" fill="none" stroke="#1e293b" strokeWidth="2.5" />
            </g>

            {/* Sporty Rotating Wheels with Chrome/Indigo Trim */}
            <g className="amb-wheel">
              <circle cx="52" cy="76" r="9" fill="#1e293b" stroke="#1e293b" strokeWidth="1" />
              <circle cx="52" cy="76" r="6.5" fill="none" stroke="var(--color-primary,#4c2691)" strokeWidth="1" />
              <circle cx="52" cy="76" r="4.5" fill="#94a3b8" />
              <circle cx="52" cy="76" r="1.5" fill="#ffffff" />
              {/* Wheel Spokes */}
              <line x1="52" y1="67" x2="52" y2="85" stroke="#475569" strokeWidth="1" />
              <line x1="43" y1="76" x2="61" y2="76" stroke="#475569" strokeWidth="1" />
            </g>
            <g className="amb-wheel">
              <circle cx="110" cy="76" r="9" fill="#1e293b" stroke="#1e293b" strokeWidth="1" />
              <circle cx="110" cy="76" r="6.5" fill="none" stroke="var(--color-primary,#4c2691)" strokeWidth="1" />
              <circle cx="110" cy="76" r="4.5" fill="#94a3b8" />
              <circle cx="110" cy="76" r="1.5" fill="#ffffff" />
              {/* Wheel Spokes */}
              <line x1="110" y1="67" x2="110" y2="85" stroke="#475569" strokeWidth="1" />
              <line x1="101" y1="76" x2="119" y2="76" stroke="#475569" strokeWidth="1" />
            </g>

            {/* Highway Road Line */}
            <line x1="5" y1="86" x2="195" y2="86" stroke="#1e293b" strokeWidth="2.5" className="amb-road-line" />
            <line x1="5" y1="88" x2="195" y2="88" stroke="#cbd5e1" strokeWidth="1.5" />
          </svg>
        </div>
        <p className="text-[13px] font-bold text-[var(--color-primary,#4c2691)] animate-pulse tracking-[0.15em] mt-4 uppercase">
          Locating Responders
        </p>
        <p className="text-[11px] text-[#64748b] mt-1 text-center font-medium">
          Connecting you to the nearest live ambulance fleet...
        </p>
      </div>
    </div>
  );
};

export default AmbulanceLoader;
