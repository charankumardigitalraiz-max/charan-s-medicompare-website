import React, { useState, useEffect } from 'react';
import CookieService from "../utils/cookieService";

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
                    from { transform: translate(-50%, 100px); opacity: 0; }
                    to { transform: translate(-50%, 0); opacity: 1; }
                }
                .cookie-animate {
                    animation: cookieSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
            <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 w-[90%] max-w-[800px] z-[9999] pointer-events-none cookie-animate">
                <div className="pointer-events-auto bg-white/85 backdrop-blur-[15px] border border-white/30 rounded-md shadow-[0_15px_35px_rgba(0,0,0,0.1)] flex flex-col md:flex-row items-start md:items-center justify-between p-6 md:p-[25px_40px_25px_25px] gap-5 md:gap-[30px] relative" data-aos="fade-up">
                    <div className="flex items-center gap-5">
                        <div className="w-[50px] h-[50px] bg-gradient-to-br from-[#8059ca] to-[#8059ca] rounded-[12px] flex items-center justify-center shrink-0">
                            <i className="fas fa-cookie-bite text-white text-2xl"></i>
                        </div>
                        <div className="text-left">
                            <h4 className="m-0 mb-1 text-lg font-bold text-[#1a1a1a]">Cookie Settings</h4>
                            <p className="m-0 text-sm text-[#555] leading-relaxed max-w-full md:max-w-[450px]">
                                We use cookies to improve your experience, analyze site traffic, and serve social media features. By clicking "Accept All", you consent to our use of cookies.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 shrink-0 w-full md:w-auto">
                        <button onClick={handleDecline} className="py-3 px-6 !rounded-xl !text-sm !font-semibold cursor-pointer !transition-all !duration-300 !border-none flex-1 md:flex-none !text-center !bg-black/5 !text-[#333] hover:bg-black/10 hover:-translate-y-0.5">
                            Decline Optional
                        </button>
                        <button onClick={handleAccept} className="py-3 px-6 !rounded-xl !text-sm !font-semibold cursor-pointer !transition-all !duration-300 !border-none flex-1 md:flex-none !text-center !bg-[#8059ca] !text-white !shadow-[0_4px_15px_rgba(13,110,253,0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(13,110,253,0.4)]">
                            Accept All
                        </button>
                    </div>
                    <button className="absolute top-[15px] right-[15px] !bg-transparent !border-none !text-[#999] hover:text-[#333] cursor-pointer !text-base !transition-colors !duration-300 p-[5px]" onClick={() => setShowConsent(false)} aria-label="Close">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </>
    );
};

export default CookieConsent;
