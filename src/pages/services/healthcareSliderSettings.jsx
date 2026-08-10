import React from "react";

/** Change this value to adjust all healthcare carousel / swiper autoplay timing */
export const HEALTHCARE_SLIDER_AUTOPLAY_MS = 5000;

export const HealthcareNextArrow = ({ onClick }) => (
  <div
    className="custom-arrow custom-next"
    style={{ marginRight: "20px" }}
    onClick={onClick}
  >
    <i className="fas fa-chevron-right"></i>
  </div>
);

export const HealthcarePrevArrow = ({ onClick }) => (
  <div
    className="custom-arrow custom-prev"
    style={{ marginLeft: "20px" }}
    onClick={onClick}
  >
    <i className="fas fa-chevron-left"></i>
  </div>
);

export const healthcareSlickAutoplay = {
  speed: 500,
  autoplay: true,
  autoplaySpeed: HEALTHCARE_SLIDER_AUTOPLAY_MS,
};

/** Middle offer banners — 2 slides (passed to labtests, diagnostics, etc.) */
export const getHealthcareMiddleBannerSettings = () => ({
  dots: true,
  infinite: true,
  arrows: false,
  slidesToShow: 2,
  slidesToScroll: 1,
  ...healthcareSlickAutoplay,
  nextArrow: <HealthcareNextArrow />,
  prevArrow: <HealthcarePrevArrow />,
  responsive: [
    { breakpoint: 768, settings: { slidesToShow: 1 } },
    { breakpoint: 480, settings: { slidesToShow: 1 } },
  ],
});

/** Top hero banner — 1 slide */
export const getHealthcareHeroBannerSettings = () => ({
  dots: true,
  infinite: true,
  arrows: false,
  slidesToShow: 1,
  slidesToScroll: 1,
  dotsClass: "slick-dots banner-dots",
  ...healthcareSlickAutoplay,
  nextArrow: <HealthcareNextArrow />,
  prevArrow: <HealthcarePrevArrow />,
  responsive: [
    { breakpoint: 768, settings: { slidesToShow: 1 } },
    { breakpoint: 480, settings: { slidesToShow: 1 } },
  ],
});

/** Medical equipment product row */
export const getHealthcareMedicalEquipmentSettings = () => ({
  dots: false,
  infinite: false,
  slidesToShow: 4,
  slidesToScroll: 1,
  nextArrow: <HealthcareNextArrow />,
  prevArrow: <HealthcarePrevArrow />,
  ...healthcareSlickAutoplay,
  responsive: [
    { breakpoint: 1200, settings: { slidesToShow: 3 } },
    { breakpoint: 992, settings: { slidesToShow: 2 } },
    { breakpoint: 576, settings: { slidesToShow: 1 } },
  ],
});

/** Super saving / category strip */
export const getHealthcareSuperSavingSettings = () => ({
  dots: false,
  infinite: true,
  slidesToShow: 6,
  slidesToScroll: 1,
  nextArrow: <HealthcareNextArrow />,
  prevArrow: <HealthcarePrevArrow />,
  ...healthcareSlickAutoplay,
  responsive: [
    { breakpoint: 768, settings: { slidesToShow: 3 } },
    { breakpoint: 576, settings: { slidesToShow: 2 } },
  ],
});

/** Two-slide offer strip (nursing, ambulance, medical equipment banners) */
export const getHealthcareTwoSlideOfferSettings = () => ({
  slidesToShow: 2,
  slidesToScroll: 1,
  dots: true,
  arrows: false,
  infinite: true,
  focusOnSelect: true,
  ...healthcareSlickAutoplay,
  responsive: [
    { breakpoint: 992, settings: { slidesToShow: 3 } },
    { breakpoint: 768, settings: { slidesToShow: 2 } },
    { breakpoint: 580, settings: { slidesToShow: 1 } },
  ],
});

/** Four-slide product swiper (packages, lab tests, treatments, etc.) */
export const getHealthcareSwiperSettings = ({
  navigation,
  loop = false,
  modules,
}) => ({
  modules,
  slidesPerView: 4,
  spaceBetween: 16,
  navigation,
  autoplay: {
    delay: HEALTHCARE_SLIDER_AUTOPLAY_MS,
    disableOnInteraction: false,
  },
  pagination: false,
  loop,
  breakpoints: {
    1200: { slidesPerView: 4 },
    992: { slidesPerView: 3 },
    768: { slidesPerView: 2 },
    0: { slidesPerView: 1 },
  },
});
