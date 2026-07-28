/** Mac desktops (Chrome, Safari, Firefox, Edge) — Retina + heavy effects cause scroll jank */
export const shouldUseHomeLiteMode = () => {
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent || "";

  return (
    /Macintosh|Mac OS X|MacIntel/i.test(ua) &&
    !/iPhone|iPad|iPod|Mobile/i.test(ua)
  );
};
