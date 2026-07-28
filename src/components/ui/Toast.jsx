import React, { useState, useEffect } from 'react';

const toastListeners = new Set();

const triggerToast = (type, message, options = {}) => {
  const id = Math.random().toString(36).substring(2, 9);
  toastListeners.forEach(listener => listener({ action: 'add', type, message, options, id }));
  return id;
};

export const toast = {
  success: (message, options) => triggerToast('success', message, options),
  error: (message, options) => triggerToast('error', message, options),
  warning: (message, options) => triggerToast('warning', message, options),
  info: (message, options) => triggerToast('info', message, options),
  custom: (message, options) => triggerToast('custom', message, options),
  dismiss: (id) => {
    toastListeners.forEach(listener => listener({ action: 'dismiss', id }));
  },
};

// Expose globally
if (typeof window !== 'undefined') {
  window.toast = toast;
}

export default toast;

export const Toaster = () => {
  const [toasts, setToasts] = useState([]);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const handleToastEvent = (event) => {
      if (event.action === 'add') {
        const newToast = {
          id: event.id,
          type: event.type,
          message: event.message,
          options: event.options,
        };
        setToasts((prev) => [...prev, newToast]);

        const duration = event.options?.duration || 4000;
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== event.id));
        }, duration);
      } else if (event.action === 'dismiss') {
        setToasts((prev) => prev.filter((t) => t.id !== event.id));
      }
    };

    toastListeners.add(handleToastEvent);
    return () => {
      toastListeners.delete(handleToastEvent);
    };
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const total = toasts.length;

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 2147483647,
        width: '380px',
        minHeight: '80px',
        pointerEvents: total > 0 ? 'auto' : 'none',
      }}
    >
      {toasts.map((t, idx) => {
        const isSuccess = t.type === 'success';
        const isError = t.type === 'error';
        const isWarning = t.type === 'warning';
        const isInfo = t.type === 'info';

        let accentColor = '#ccc';
        let glowColor = 'rgba(204, 204, 204, 0.15)';
        let titleColor = '#1f2937';
        let bgTint = 'rgba(255, 255, 255, 0.9)';
        let titleText = t.options?.title || '';

        if (isSuccess) {
          accentColor = '#10b981'; // Modern Emerald Green
          glowColor = 'rgba(16, 185, 129, 0.3)';
          titleColor = '#065f46';
          bgTint = 'rgba(240, 253, 250, 0.95)'; // Very subtle emerald tint
          if (!titleText) titleText = 'Success!';
        } else if (isError) {
          accentColor = '#ef4444'; // Modern Red
          glowColor = 'rgba(239, 68, 68, 0.3)';
          titleColor = '#991b1b';
          bgTint = 'rgba(254, 242, 242, 0.95)'; // Very subtle red tint
          if (!titleText) titleText = 'Error!';
        } else if (isWarning) {
          accentColor = '#f59e0b'; // Amber
          glowColor = 'rgba(245, 158, 11, 0.3)';
          titleColor = '#92400e';
          bgTint = 'rgba(255, 251, 235, 0.95)'; // Very subtle amber tint
          if (!titleText) titleText = 'Warning!';
        } else if (isInfo) {
          accentColor = '#3b82f6'; // Blue
          glowColor = 'rgba(59, 130, 246, 0.3)';
          titleColor = '#1e40af';
          bgTint = 'rgba(239, 246, 255, 0.95)'; // Very subtle blue tint
          if (!titleText) titleText = 'Info!';
        }

        let messageText = '';
        if (typeof t.message === 'string') {
          messageText = t.message;
        } else if (t.options?.description) {
          messageText = t.options.description;
        }

        const fromFront = total - 1 - idx;
        const isFront = fromFront === 0;

        let translateY = 0;
        let scale = 1;
        let opacity = 1;

        if (!isHovered) {
          if (fromFront >= 3) {
            opacity = 0;
            translateY = -30;
            scale = 0.85;
          } else {
            translateY = fromFront * -10;
            scale = 1 - fromFront * 0.04;
            opacity = 1;
          }
        } else {
          translateY = fromFront * 84;
          scale = 1;
          opacity = 1;
        }

        const isCustomElement = typeof t.message === 'function' || React.isValidElement(t.message);

        return (
          <div
            key={t.id}
            style={{
              position: 'absolute',
              top: '0',
              right: '0',
              left: '0',
              minHeight: '72px',
              height: 'auto',
              backgroundColor: bgTint,
              backdropFilter: 'blur(10px) saturate(190%)',
              border: `1px solid ${isSuccess ? 'rgba(16, 185, 129, 0.15)' : isError ? 'rgba(239, 68, 68, 0.15)' : 'rgba(226, 232, 240, 0.8)'}`,
              borderRadius: '20px', // Highly premium rounded corners
              boxShadow: isFront
                ? '0 12px 30px -10px rgba(0, 0, 0, 0.08), 0 4px 12px -5px rgba(0, 0, 0, 0.03)'
                : '0 4px 12px -2px rgba(0, 0, 0, 0.02)',
              padding: '12px 40px 12px 20px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              boxSizing: 'border-box',
              zIndex: total - fromFront,
              opacity: opacity,
              transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
              transformOrigin: 'top center',
              transition: 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.45s cubic-bezier(0.16, 1, 0.3, 1), scale 0.45s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.3s ease',
              pointerEvents: isHovered || isFront ? 'auto' : 'none',
            }}
          >
            {/* Inner Content - Hide text content for stacked background toasts unless hovered */}
            <div
              style={{
                opacity: isHovered || isFront ? 1 : 0,
                transition: 'opacity 0.25s ease',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
              }}
            >
              {isCustomElement ? (
                typeof t.message === 'function' ? t.message(t.id) : t.message
              ) : (
                <>
                  {/* Glowing Accent Bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: '12px',
                      top: '12px',
                      bottom: '12px',
                      width: '5px',
                      borderRadius: '9999px',
                      backgroundColor: accentColor,
                      boxShadow: `0 0 8px ${glowColor}`, /* Premium glow effect */
                    }}
                  />

                  {/* Text Content */}
                  <div style={{ paddingLeft: '8px' }}>
                    <div
                      style={{
                        color: titleColor,
                        fontWeight: '750',
                        fontSize: '14.5px',
                        lineHeight: '1.2',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {titleText}
                    </div>
                    {messageText && (
                      <div
                        style={{
                          color: '#555555',
                          fontSize: '12.5px',
                          fontWeight: '500',
                          marginTop: '3.5px',
                          lineHeight: '1.3',
                          whiteSpace: 'normal',
                          wordBreak: 'break-word',
                        }}
                      >
                        {messageText}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Close Button - Only clickable on front or expanded toasts */}
            {(isHovered || isFront) && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  dismiss(t.id);
                }}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '21px',
                  background: 'transparent',
                  border: 'none',
                  color: '#a0aec0',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  transition: 'background-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                  e.currentTarget.style.color = '#1f2937';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#a0aec0';
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
