import React, { useState, useEffect } from 'react';
import CookieService from "../../utils/cookieService";

const CookieConsent = () => {
    const [showConsent, setShowConsent] = useState(false);

    useEffect(() => {
        // Check if user has already given consent
        const consentGiven = CookieService.getCookie('cookie_consent_accepted');
        if (!consentGiven) {
            // Delay showing the banner for a better UX
            const timer = setTimeout(() => {
                setShowConsent(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        CookieService.setCookie('cookie_consent_accepted', 'true', 365);
        setShowConsent(false);
    };

    const handleDecline = () => {
        // We set it to declined for 7 days so they aren't nagged immediately
        CookieService.setCookie('cookie_consent_accepted', 'declined', 7);
        setShowConsent(false);
    };

    if (!showConsent) return null;

    return (
        <>
            <style>{`
                @keyframes cookieSlideUp {
                    from { transform: translateY(100px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .cookie-animate {
                    animation: cookieSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
            <div className="fixed bottom-[20px] sm:bottom-[30px] left-0 right-0 mx-auto w-[calc(100%-32px)] sm:w-[90%] max-w-[850px] z-[9999] pointer-events-none cookie-animate">
                <div className="w-full pointer-events-auto bg-white/95 backdrop-blur-[15px] border border-gray-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex flex-col lg:flex-row items-start lg:items-center justify-between p-5 sm:p-6 lg:p-[20px_45px_20px_25px] gap-5 lg:gap-8 relative" data-aos="fade-up">
                    <div className="flex items-start sm:items-center gap-4 sm:gap-5 flex-1 min-w-0">
                        <div className="w-[48px] h-[48px] bg-gradient-to-br from-[#321961] to-[#4a268a] rounded-xl flex items-center justify-center shrink-0 shadow-md">
                            <i className="fas fa-cookie-bite text-white text-xl"></i>
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <h4 className="m-0 mb-1 text-base sm:text-lg font-bold text-[#1a1a1a]">Cookie Settings</h4>
                            <p className="m-0 text-xs sm:text-sm text-[#555] leading-relaxed max-w-full lg:max-w-[480px]">
                                We use cookies to improve your experience, analyze site traffic, and serve social media features. By clicking "Accept All", you consent to our use of cookies.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 shrink-0 w-full lg:w-auto">
                        <button onClick={handleDecline} className="py-2.5 sm:py-3 px-5 sm:px-6 !rounded-xl !text-xs sm:!text-sm !font-semibold cursor-pointer !transition-all !duration-300 !border-none flex-1 lg:flex-none !text-center !bg-black/5 !text-[#333] hover:bg-black/10 hover:-translate-y-0.5">
                            Decline Optional
                        </button>
                        <button onClick={handleAccept} className="py-2.5 sm:py-3 px-5 sm:px-6 !rounded-xl !text-xs sm:!text-sm !font-semibold cursor-pointer !transition-all !duration-300 !border-none flex-1 lg:flex-none !text-center !bg-[#321961] !text-white !shadow-[0_4px_15px_rgba(50,25,97,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(50,25,97,0.4)]">
                            Accept All
                        </button>
                    </div>
                    <button className="absolute top-[12px] sm:top-[15px] right-[12px] sm:right-[15px] !bg-transparent !border-none !text-[#999] hover:text-[#333] cursor-pointer !text-sm sm:!text-base !transition-colors !duration-300 p-[5px]" onClick={() => setShowConsent(false)} aria-label="Close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </>
    );
};

export default CookieConsent;
