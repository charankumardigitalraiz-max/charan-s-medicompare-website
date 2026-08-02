// Responsive screen width constants (in pixels)
export const BREAKPOINTS = {
  xs: 480,   // Extra small mobile
  sm: 576,   // Small mobile/tablet transition
  md: 768,   // Medium tablet
  lg: 992,   // Large tablet / Small laptop
  xl: 1200,  // Standard desktop / Laptop
  xxl: 1400  // Large desktop / Monitor
};

// React-responsive matchMedia query strings
export const MEDIA_QUERIES = {
  xs: `(max-width: ${BREAKPOINTS.sm - 1}px)`,                         // < 576px
  sm: `(min-width: ${BREAKPOINTS.sm}px) and (max-width: ${BREAKPOINTS.md - 1}px)`, // 576px - 767px
  md: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`, // 768px - 991px
  lg: `(min-width: ${BREAKPOINTS.lg}px) and (max-width: ${BREAKPOINTS.xl - 1}px)`, // 992px - 1199px
  xl: `(min-width: ${BREAKPOINTS.xl}px) and (max-width: ${BREAKPOINTS.xxl - 1}px)`, // 1200px - 1399px
  xxl: `(min-width: ${BREAKPOINTS.xxl}px)`,                           // >= 1400px

  // Short-hand helper queries
  isMobile: `(max-width: ${BREAKPOINTS.md - 1}px)`,                   // < 768px
  isTablet: `(min-width: ${BREAKPOINTS.md}px) and (max-width: ${BREAKPOINTS.lg - 1}px)`, // 768px - 991px
  isTabletOrBelow: `(max-width: ${BREAKPOINTS.lg - 1}px)`,            // < 992px
  isDesktop: `(min-width: ${BREAKPOINTS.lg}px)`,                      // >= 992px
  isLargeDesktop: `(min-width: ${BREAKPOINTS.xl}px)`                  // >= 1200px
};
