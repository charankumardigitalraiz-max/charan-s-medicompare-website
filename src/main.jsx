import React, { Suspense, lazy, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./core/redux/store";
import { base_path } from "./environment";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { toast, Toaster } from "sonner";
import { onMessageListener } from "./core/redux/firebase/fcm";

const safeLazy = (importFunc) => {
  return lazy(() =>
    importFunc().catch((error) => {
      console.error("Chunk load error caught in main.jsx, reloading...", error);
      window.location.reload();
      return new Promise(() => { });
    })
  );
};

const ALLRoutes = safeLazy(() => import("./routes/router"));
import PageLoader from "./components/ui/PageLoader.jsx";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "@fortawesome/fontawesome-free/css/fontawesome.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "./assets/css/iconsax.css";
import "./assets/css/feather.css";
import "./assets/scss/main.scss";
import "./assets/css/custom.css";
import "rsuite/dist/rsuite.min.css";
import "./assets/css/healthcare-tabs.css";
import "./assets/css/product-reviews.css";
import ScrollToTop from "./feature-module/frontend/pages/ScrollUp";
import { CartProvider } from "./context/CartContext";
import { ProfileProvider } from "./context/ProfileContext";
import { LocationProvider } from "./context/LocationContext";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";
import CookieConsent from "./components/CookieConsent";
import { HelmetProvider } from "react-helmet-async";
const FCMForegroundListener = () => {
  useEffect(() => {
    const listen = async () => {
      try {
        const payload = await onMessageListener();

        const title = payload?.notification?.title || "Notification";
        const body = payload?.notification?.body;

        if (Notification.permission === 'granted') {
          try {
            const notification = new Notification(title, {
              body: body,
              icon: '/favicon.png',
              tag: 'medicompare-notification-' + Date.now(),
              requireInteraction: false,
              silent: false,
              vibrate: [200, 100, 200],
              badge: '/favicon.png',
              dir: 'ltr',
              lang: 'en-US'
            });

            setTimeout(() => {
              if (notification) {
                // Notification still exists
              }
            }, 100);
            notification.onclick = () => {
              window.focus();
              notification.close();
            };

            notification.onshow = () => { };
            notification.onerror = (error) => { };
            notification.onclose = () => { };

          } catch (error) {
            // Error creating notification
          }
        }

        listen();
      } catch (error) {
        // FCM foreground listener error
      }
    };

    listen();
  }, []);

  return null;
};

window.testNotification = () => {
  if (Notification.permission === 'granted') {
    const notification = new Notification('Test Notification', {
      body: 'This is a test system notification from MediCompare',
      icon: '/favicon.png',
      tag: 'test-notification',
      requireInteraction: true,
      silent: false
    });
  }
};

window.forceNotification = () => {
  if (Notification.permission === 'granted') {
    const notification = new Notification('FORCE TEST', {
      body: 'This should appear! Time: ' + new Date().toLocaleTimeString(),
      icon: '/favicon.png',
      tag: 'force-test-' + Date.now(),
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200]
    });

    notification.onshow = () => { };
    notification.onerror = (e) => { };
    notification.onclose = () => { };

    setTimeout(() => notification.close(), 5000);
  } else {
    Notification.requestPermission().then(permission => { });
  }
};

window.checkNotificationSettings = () => {
  if (navigator.platform.includes('Win')) { }

  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    const test = new Notification('Settings Check', {
      body: 'Testing notification system at ' + new Date().toLocaleTimeString(),
      icon: '/favicon.png',
      tag: 'settings-check-' + Date.now(),
      requireInteraction: false
    });
    setTimeout(() => test.close(), 3000);
  }
};

window.testWindowsNotification = () => {
  const notification = new Notification('Windows Test', {
    body: 'This should appear on Windows! Time: ' + new Date().toLocaleTimeString(),
    icon: '/favicon.png',
    tag: 'windows-test-' + Date.now(),
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200]
  });

  const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
  audio.play().catch(e => { });

  setTimeout(() => notification.close(), 5000);
};


const notifySuccess = (message = "Your message has been sent successfully.", title = "Success!") => {
  toast.success(title, {
    description: message,
    duration: 4000,
  });
};

const notifyError = (message = "Something went wrong. Please try again.", title = "Error!") => {
  toast.error(title, {
    description: message,
    duration: 4000,
  });
};

window.notifySuccess = notifySuccess;
window.notifyError = notifyError;
window.toast = toast;



const rootElement = document.getElementById("root");
createRoot(rootElement).render(
  <HelmetProvider>
    <Provider store={store}>
      <GoogleOAuthProvider clientId='441946198594-6h38n26b6o63diricvvsf2pmlefm6snt.apps.googleusercontent.com'>
        <LocationProvider>
          <CartProvider>
            <ProfileProvider>
              <BrowserRouter basename={base_path}>
                <FCMForegroundListener />
                <ScrollToTop />

                <Toaster />
                <Tooltip id="global-tooltip" place="top" className="global-tooltip" />
                <CookieConsent />
                <Suspense fallback={<PageLoader />}>
                  <ALLRoutes />
                </Suspense>
              </BrowserRouter>
            </ProfileProvider>
          </CartProvider>
        </LocationProvider>
      </GoogleOAuthProvider>
    </Provider>
  </HelmetProvider>
);
