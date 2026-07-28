import React, { useRef, useState, useEffect, useCallback } from "react";

const HomeProductScrollCarousel = ({
  children,
  className = "",
  autoScroll = false,
  autoScrollSpeed = 1, // px per frame (≈60 fps → ~60px/s)
}) => {
  const scrollRef = useRef(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);
  const rafRef = useRef(null);
  const isPausedRef = useRef(false);
  const resumeTimerRef = useRef(null);

  /* ── button state ─────────────────────────────────────────────────────── */
  const updateButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  /* ── auto-scroll loop ─────────────────────────────────────────────────── */
  const startLoop = useCallback(() => {
    if (!autoScroll) return;

    const tick = () => {
      const el = scrollRef.current;
      if (!isPausedRef.current && el) {
        const half = el.scrollWidth / 2;
        if (half > 10) {
          el.scrollLeft += autoScrollSpeed;

          // seamless reset when we've scrolled through the original set
          if (el.scrollLeft >= half) {
            el.scrollLeft -= half;
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [autoScroll, autoScrollSpeed]);

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  /* ── pause helpers ────────────────────────────────────────────────────── */
  const pause = useCallback(() => {
    isPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
  }, []);

  const resume = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    // small delay so manual scroll feels responsive before auto resumes
    resumeTimerRef.current = setTimeout(() => {
      isPausedRef.current = false;
    }, 1500);
  }, []);

  /* ── lifecycle ────────────────────────────────────────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return undefined;

    updateButtons();
    el.addEventListener("scroll", updateButtons, { passive: true });

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(updateButtons)
        : null;
    ro?.observe(el);

    return () => {
      el.removeEventListener("scroll", updateButtons);
      ro?.disconnect();
    };
  }, [updateButtons, children]);

  useEffect(() => {
    if (!autoScroll) return undefined;
    startLoop();
    return () => {
      stopLoop();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [autoScroll, startLoop, stopLoop]);

  /* ── manual nav (pauses auto-scroll briefly) ──────────────────────────── */
  const scrollByPage = (direction) => {
    const el = scrollRef.current;
    if (!el) return;

    pause();
    const amount = Math.max(el.clientWidth * 0.8, 220);
    el.scrollBy({ left: direction * amount, behavior: "smooth" });
    resume();
  };

  /* ── duplicate children for seamless loop ─────────────────────────────── */
  const content = autoScroll
    ? [
      ...React.Children.map(children, (child, i) =>
        React.cloneElement(child, { key: `orig-${i}` })
      ),
      ...React.Children.map(children, (child, i) =>
        React.cloneElement(child, { key: `clone-${i}`, "aria-hidden": true })
      ),
    ]
    : children;

  return (
    <div
      className={`home-product-carousel ${className}`.trim()}
      onMouseEnter={autoScroll ? pause : undefined}
      onMouseLeave={autoScroll ? resume : undefined}
      onTouchStart={autoScroll ? pause : undefined}
      onTouchEnd={autoScroll ? resume : undefined}
    >
      <button
        type="button"
        className="home-product-carousel__nav home-product-carousel__nav--prev"
        aria-label="Previous"
        onClick={() => scrollByPage(-1)}
        disabled={!canPrev && !autoScroll}
        style={autoScroll ? { opacity: 0.7 } : undefined}
      >
        <i className="fas fa-chevron-left" aria-hidden="true" />
      </button>

      <div
        ref={scrollRef}
        className="home-products-scroll-row"
        style={autoScroll ? { overflow: "hidden", scrollSnapType: "none" } : undefined}
      >
        {content}
      </div>

      <button
        type="button"
        className="home-product-carousel__nav home-product-carousel__nav--next"
        aria-label="Next"
        onClick={() => scrollByPage(1)}
        disabled={!canNext && !autoScroll}
        style={autoScroll ? { opacity: 0.7 } : undefined}
      >
        <i className="fas fa-chevron-right" aria-hidden="true" />
      </button>
    </div>
  );
};

export default HomeProductScrollCarousel;
