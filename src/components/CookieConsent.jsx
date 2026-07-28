import React, { useState, useEffect } from 'react';
import CookieService from "../utils/cookieService";
import './CookieConsent.css';

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
        <div className="cookie-consent-wrapper">
            <div className="cookie-consent-banner" data-aos="fade-up">
                <div className="cookie-content">
                    <div className="cookie-icon">
                        <i className="fas fa-cookie-bite"></i>
                    </div>
                    <div className="cookie-text">
                        <h4>Cookie Settings</h4>
                        <p>
                            We use cookies to improve your experience, analyze site traffic, and serve social media features. By clicking "Accept All", you consent to our use of cookies.
                        </p>
                    </div>
                </div>
                <div className="cookie-actions">
                    <button onClick={handleDecline} className="cookie-btn btn-decline">
                        Decline Optional
                    </button>
                    <button onClick={handleAccept} className="cookie-btn btn-accept">
                        Accept All
                    </button>
                </div>
                <button className="cookie-close" onClick={() => setShowConsent(false)} aria-label="Close">
                    <i className="fas fa-times"></i>
                </button>
            </div>
        </div>
    );
};

export default CookieConsent;
