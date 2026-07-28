import { useMediaQuery } from "react-responsive";
import { MEDIA_QUERIES } from "../utils/responsive";

export const useResponsive = () => {
  const isXs = useMediaQuery({ query: MEDIA_QUERIES.xs });
  const isSm = useMediaQuery({ query: MEDIA_QUERIES.sm });
  const isMd = useMediaQuery({ query: MEDIA_QUERIES.md });
  const isLg = useMediaQuery({ query: MEDIA_QUERIES.lg });
  const isXl = useMediaQuery({ query: MEDIA_QUERIES.xl });
  const isXxl = useMediaQuery({ query: MEDIA_QUERIES.xxl });

  const isMobile = useMediaQuery({ query: MEDIA_QUERIES.isMobile });
  const isTablet = useMediaQuery({ query: MEDIA_QUERIES.isTablet });
  const isTabletOrBelow = useMediaQuery({ query: MEDIA_QUERIES.isTabletOrBelow });
  const isDesktop = useMediaQuery({ query: MEDIA_QUERIES.isDesktop });
  const isLargeDesktop = useMediaQuery({ query: MEDIA_QUERIES.isLargeDesktop });

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isXxl,
    isMobile,
    isTablet,
    isTabletOrBelow,
    isDesktop,
    isLargeDesktop
  };
};
