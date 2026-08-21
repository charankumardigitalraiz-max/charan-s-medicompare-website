import React, { useEffect, useState } from "react";
import Home2Header from "../../components/layout/Header-k";
import { useParams } from "react-router-dom";
import { axiosCommonInstance, imgUrl } from "../../Apiservice";
import { getImageUrl } from "../../utils/index";
import toast from "react-hot-toast";

const SearchOverlay = () => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [reconmended, setreconmended] = useState([]);
  const { service } = useParams();

  useEffect(() => {
    const fetchRecommended = async () => {
      setLoading(true);
      try {
        const response = await axiosCommonInstance.get(
          `categorywisesearch/product?search=&type=${service}`
        );
        const rec = response?.data?.data?.recentOrders || [];
        setreconmended(rec.length > 0 ? rec : []);
      } catch (error) {
        toast.error("Error fetching recommended data");
        setreconmended([]);
      } finally {
        setLoading(false);
      }
    };

    if (service) {
      fetchRecommended();
    }
  }, [service]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!query || query.trim().length === 0) {
        setSuggestions([]);
        setLoading(true);
        try {
          const response = await axiosCommonInstance.get(
            `categorywisesearch/product?search=&type=${service}`
          );
          const rec = response?.data?.data?.recentOrders || [];
          setreconmended(rec.length > 0 ? rec : []);
        } catch (error) {
          toast.error("Error fetching recommended data");
          setreconmended([]);
        } finally {
          setLoading(false);
        }
        return;
      }

      setLoading(true);

      try {
        const response = await axiosCommonInstance.get(
          `categorywisesearch/product?search=${query}&type=${service}`
        );

        const list = response?.data?.data?.list || [];
        const rec = response?.data?.data?.recentOrders || [];
        setSuggestions(list.length > 0 ? list : [{ noResult: true }]);
        setreconmended(rec.length > 0 ? rec : []);
      } catch (error) {
        toast.error("Error fetching search results");
        setSuggestions([{ noResult: true }]);
      } finally {
        setLoading(false);
      }
    };

    const debouncedFetch = debounce(fetchSuggestions, 100);
    debouncedFetch();

    return () => {
      if (query && query.trim().length > 0) {
        setSuggestions([]);
      }
    };
  }, [query, service]);

  const debounce = (func, delay) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => func(...args), delay);
    };
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  };

  const handleSuggestionSelect = (value) => {
    if (value !== "No results found") {
      setQuery(value);
    }
    setShowSuggestions(false);
  };
  const categoryName = service
    ?.replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <>
      <Home2Header />
      <style>{`
        .custom-scroller::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroller::-webkit-scrollbar-thumb {
          background: rgba(125, 46, 255, 0.35);
          border-radius: 999px;
        }
      `}</style>
      <div className="w-full max-w-[1000px] mx-auto min-h-screen bg-white py-6 md:py-12 px-4 md:px-20 flex justify-center items-stretch">
        <div className="w-full max-w-[844px] flex flex-col gap-3 mt-[30px] relative flex-1 max-h-[calc(100vh-4rem)] overflow-hidden">
          <div className="sticky top-3 md:top-6 z-60 bg-gradient-to-b from-white/96 via-white/96 to-transparent pb-2 mb-2">
            <div className="flex items-center relative z-10 bg-white p-2 md:p-3 rounded-2xl">
              <div
                className="flex-1 flex items-center gap-1.5 p-2 border border-[#7d2eff]/15 rounded-lg bg-[#7d2eff]/4 transition-colors duration-200 relative focus-within:border-[var(--color-primary,#4c2691)] focus-within:bg-[var(--color-primary,#4c2691)]/5"
                style={{ position: "relative" }}
              >
                <span className="w-6 h-6 inline-flex items-center justify-center text-[var(--color-primary,#4c2691)] shrink-0" aria-hidden="true">
                  <svg
                    viewBox="0 0 24 24"
                    role="presentation"
                    focusable="false"
                    className="w-full h-full fill-current"
                  >
                    <path d="M15.5 14h-.79l-.28-.27a6 6 0 1 0-.71.71l.27.28v.79l4.5 4.5 1.49-1.49-4.48-4.52zm-5.5 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8z" />
                  </svg>
                </span>

                <input
                  type="search"
                  value={query}
                  className="flex-1 border-none bg-transparent text-[#1f1533] outline-none min-w-0"
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={`Search ${categoryName}...`}
                />

                {loading && (
                  <div
                    style={{
                      position: "absolute",
                      right: "50px",
                      top: "50%",
                      transform: "translateY(-50%)",
                    }}
                  >
                    <div
                      className="spinner-border spinner-border-sm text-primary"
                      role="status"
                      style={{ width: "14px", height: "14px" }}
                    >
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                )}

                {showSuggestions && suggestions.length > 0 && (
                  <ul className="absolute top-[calc(100%+0.4rem)] left-0 w-full max-h-[380px] overflow-y-auto rounded-lg bg-white shadow-[0_16px_32px_rgba(69,33,132,0.18)] border border-[#7d2eff]/15 z-80 list-none m-0 p-px custom-scroller" role="listbox">
                    {suggestions.map((item, index) => (
                      <li
                        key={item._id || index}
                        role="option"
                        tabIndex={-1}
                        className={`flex items-center gap-2.5 py-2 px-4 text-[15px] cursor-pointer transition-all duration-200 ${
                          item.noResult
                            ? "text-[#8b7bb0] cursor-default"
                            : "text-[#281848] hover:bg-[#7d2eff]/8 hover:text-[#4c15c7]"
                        }`}
                        onMouseDown={(event) => {
                          event.preventDefault();
                          if (!item.noResult) {
                            handleSuggestionSelect(item?.tablet?.name);
                          }
                        }}
                      >
                        <div className="d-flex align-items-center">
                          {!item.noResult ? (
                            <>
                              <img
                                src={
                                  getImageUrl(
                                    item?.tablet?.variant?.[0]?.files?.[0] ||
                                    item?.tablet?.files?.[0] ||
                                    "/assets/default.png")
                                }
                                alt={item?.tablet?.name}
                                style={{
                                  width: "40px",
                                  height: "40px",
                                  borderRadius: "6px",
                                  objectFit: "contain",
                                  marginRight: "10px",
                                  backgroundColor: "#f8f9fa",
                                }}
                              />
                              <span
                                style={{
                                  fontSize: "14px",
                                  color: "#000",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  maxWidth: "200px",
                                  textTransform: "capitalize",
                                }}
                              >
                                {item?.tablet?.name}
                              </span>
                            </>
                          ) : (
                            <span className="w-100 text-center text-muted">
                              No results found
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <button
                type="button"
                className="border-none bg-transparent w-9 h-9 inline-flex items-center justify-center rounded-full text-3xl font-light text-[var(--color-primary,#4c2691)] cursor-pointer mb-3.5 d-lg-block d-none"
                onClick={handleClose}
                aria-label="Close search overlay"
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
          </div>

          <section className="flex flex-col gap-3.5 ml-2.5">
            <div className="overflow-y-auto max-h-[calc(100vh-290px)] pr-1 custom-scroller">
              {(!query || query.trim().length === 0) &&
                reconmended.length > 0 && (
                  <div className="ms-3 mb-3">
                    <h3
                      style={{
                        fontSize: "24px",
                        fontWeight: "600",
                        color: "#000",
                      }}
                    >
                      Recommended Products
                    </h3>
                  </div>
                )}
              <div className="container">
                <div className="row">
                  <div
                    className="row"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      alignItems: "stretch",
                    }}
                  >
                    {query && query.trim().length > 0
                      ? suggestions.length > 0 &&
                      !suggestions[0].noResult &&
                      suggestions.map((item) => {
                        const tablet = item?.tablet;
                        const vendors = item?.vendors || [];

                        return (
                          <div
                            key={tablet?._id}
                            className="col-xxl-4 col-md-4"
                            style={{ display: "flex", marginBottom: "20px" }}
                          >
                            <div
                              className="card shadow-sm"
                              style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <div className="card-img">
                                <img
                                  src={
                                    imgUrl +
                                    (tablet?.variant?.[0]?.files?.[0] ||
                                      tablet?.files?.[0] ||
                                      "/assets/default.png")
                                  }
                                  alt={tablet?.name}
                                  title={tablet?.name}
                                  loading="lazy"
                                  style={{
                                    height: "168px",
                                    width: "100%",
                                    objectFit: "cover",
                                    borderRadius: "8px 8px 0px 0px",
                                    overflow: "hidden",
                                  }}
                                />
                              </div>

                              <div className="card-body p-0">
                                <div className="d-flex align-items-center px-3 py-1">
                                  <span>
                                    <strong
                                      style={{
                                        color: "#000",
                                        fontSize: "14px",
                                      }}
                                    >
                                      {tablet?.name && tablet?.name.length > 18
                                        ? tablet?.name.slice(0, 18) + "..."
                                        : tablet?.name}
                                    </strong>
                                  </span>
                                  <div className="ms-auto">
                                    <i
                                      className="fa-solid fa-heart me-1"
                                      style={{
                                        color: "#A6A6A6",
                                        fontSize: "20px",
                                      }}
                                    ></i>
                                    <i
                                      className="fa-solid fa-share"
                                      style={{
                                        color: "#A6A6A6",
                                        fontSize: "20px",
                                      }}
                                    ></i>
                                  </div>
                                </div>

                                <div className="px-3" style={{ flexGrow: 1 }}>
                                  <div className="doctor-info-detail">
                                    {tablet && (
                                      <>
                                        {(tablet?.manufacture?.name ||
                                          tablet?.complexity) && (
                                            <p className="mb-1 d-flex justify-content-between align-items-center">
                                              <small style={{ color: "black" }}>
                                                {tablet?.manufacture?.name && (
                                                  <>
                                                    <i className="fas fa-industry me-1 text-primary"></i>
                                                    By{" "}
                                                    {tablet.manufacture.name
                                                      .length > 10
                                                      ? tablet.manufacture.name.slice(
                                                        0,
                                                        10
                                                      ) + "..."
                                                      : tablet.manufacture.name}
                                                  </>
                                                )}
                                                {tablet?.complexity && (
                                                  <>
                                                    {" "}
                                                    <i className="fas fa-cogs me-1 text-secondary"></i>
                                                    Complexity:{" "}
                                                    <span
                                                      className={`fw-normal ${tablet?.complexity ===
                                                          "simple"
                                                          ? "text-success"
                                                          : tablet?.complexity ===
                                                            "medium"
                                                            ? "text-warning"
                                                            : tablet?.complexity ===
                                                              "complex"
                                                              ? "text-danger"
                                                              : "text-secondary"
                                                        }`}
                                                      style={{
                                                        fontWeight: 400,
                                                      }}
                                                    >
                                                      {tablet?.complexity}
                                                    </span>
                                                  </>
                                                )}
                                              </small>
                                              <span className="d-flex align-items-center">
                                                <i
                                                  className="fas fa-star text-warning"
                                                  style={{ fontSize: "12px" }}
                                                ></i>
                                                <small className="text-black">
                                                  4.0(100+)
                                                </small>
                                              </span>
                                            </p>
                                          )}

                                        {/* Composition */}
                                        {tablet?.compositions?.name && (
                                          <p
                                            className="mb-1"
                                            style={{
                                              fontSize: "11px",
                                              color: "black",
                                            }}
                                          >
                                            <i className="fas fa-vial me-1 text-primary"></i>
                                            <span
                                              style={{ fontSize: "11px" }}
                                            >
                                              Composition
                                            </span>
                                            :{" "}
                                            {tablet.compositions.name.length >
                                              16
                                              ? tablet.compositions.name.slice(
                                                0,
                                                16
                                              ) + "..."
                                              : tablet.compositions.name}
                                          </p>
                                        )}

                                        <div className="d-flex flex-wrap">
                                          {tablet?.smapletype && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-flask me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Sample
                                                </span>
                                                : {tablet.smapletype}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.model && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-microchip me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Modal
                                                </span>
                                                :{" "}
                                                {tablet.model.length > 6
                                                  ? tablet?.model.slice(
                                                    0,
                                                    6
                                                  ) + "..."
                                                  : tablet?.model}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.condition && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-info-circle me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Condition
                                                </span>
                                                :{" "}
                                                {tablet.condition.length > 5
                                                  ? tablet?.condition.slice(
                                                    0,
                                                    5
                                                  ) + "..."
                                                  : tablet?.condition}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.duration && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-clock me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Duration
                                                </span>
                                                : {tablet.duration}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.shiftType && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-clock me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Shift
                                                </span>
                                                : {tablet.shiftType}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.nursecareType && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-clock me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Type
                                                </span>
                                                : {tablet.nursecareType}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.ambulancetype && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-ambulance me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Type
                                                </span>
                                                : {tablet.ambulancetype}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.equipmentType?.length >
                                            0 && (
                                              <div className="col-12">
                                                <div
                                                  className="mb-1 d-flex align-items-center"
                                                  style={{
                                                    fontSize: "11px",
                                                    color: "black",
                                                  }}
                                                >
                                                  <i className="fas fa-kit-medical me-1 text-primary"></i>
                                                  <span
                                                    style={{
                                                      fontSize: "11px",
                                                      fontWeight: 500,
                                                    }}
                                                  >
                                                    Equipments:
                                                  </span>
                                                </div>

                                                <div
                                                  style={{
                                                    paddingLeft: "18px",
                                                  }}
                                                >
                                                  {tablet.equipmentType
                                                    .slice(0, 3)
                                                    .map((item, index) => (
                                                      <div
                                                        key={index}
                                                        className="d-flex align-items-center mb-1"
                                                        style={{
                                                          fontSize: "11px",
                                                          color: "black",
                                                        }}
                                                      >
                                                        <i className="fas fa-check-circle me-1 text-success"></i>
                                                        {item.length > 20
                                                          ? item
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                          item.slice(1, 20) +
                                                          "..."
                                                          : item
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                          item.slice(1)}
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}

                                          {tablet?.bodypart && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-person me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Body Part
                                                </span>
                                                : {tablet.bodypart}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.iscontrast && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-adjust me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Contrast
                                                </span>
                                                :{" "}
                                                {tablet?.iscontrast
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  tablet?.iscontrast.slice(1)}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.reportsDuration && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-file-alt me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Reports
                                                </span>
                                                :{" "}
                                                {tablet.reportsDuration
                                                  .length > 5
                                                  ? tablet?.reportsDuration?.slice(
                                                    0,
                                                    5
                                                  ) + "..."
                                                  : tablet?.reportsDuration}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.gender && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-user me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Gender
                                                </span>
                                                : {tablet.gender}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.parameterss?.length >
                                            0 && (
                                              <div style={{ flex: "0 0 50%" }}>
                                                <p
                                                  className="mb-1"
                                                  style={{
                                                    fontSize: "11px",
                                                    color: "black",
                                                  }}
                                                >
                                                  <i className="fas fa-check-circle me-1 text-success"></i>
                                                  <span
                                                    style={{ fontSize: "11px" }}
                                                  >
                                                    Parameters
                                                  </span>
                                                  : {tablet.parameterss.length}
                                                </p>
                                              </div>
                                            )}

                                          {tablet?.isFasting && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-utensils me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Fasting
                                                </span>
                                                :{" "}
                                                {tablet.isFasting
                                                  ? tablet.isFasting
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                  tablet.isFasting.slice(1)
                                                  : "No Fasting"}
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {(tablet?.variant?.[0]?.price ||
                                          vendors?.[0]?.variant?.[0]
                                            ?.price) && (
                                            <div className="d-flex align-items-center mb-1">
                                              <h5
                                                className="d-flex align-items-center mb-0"
                                                style={{
                                                  color: "#000",
                                                  fontSize: "14px",
                                                }}
                                              >
                                                <strong>
                                                  ₹
                                                  {(
                                                    tablet?.variant?.[0]
                                                      ?.price ??
                                                    vendors?.[0]?.variant?.[0]
                                                      ?.price
                                                  ).toFixed(2)}
                                                </strong>
                                              </h5>
                                              <small
                                                className="ms-1"
                                                style={{
                                                  fontSize: "10px",
                                                }}
                                              >
                                                (₹
                                                {(
                                                  (tablet?.variant?.[0]
                                                    ?.price ??
                                                    vendors?.[0]?.variant?.[0]
                                                      ?.price ??
                                                    0) / 10
                                                ).toFixed(2)}
                                                )
                                              </small>
                                            </div>
                                          )}

                                        {/* select vaints */}
                                        <div
                                          style={{
                                            height:
                                              tablet?.variant?.length > 0
                                                ? "40px"
                                                : "10px",
                                            marginTop:
                                              tablet?.variant?.length > 0
                                                ? "0px"
                                                : "15px",
                                          }}
                                        >
                                          {tablet?.variant?.length > 0 && (
                                            <select
                                              className="form-select my-2"
                                              style={{
                                                width: "200px",
                                                borderColor: "#F1FAFE",
                                                background: "#F1FAFE",
                                                padding: "4px 10px",
                                                borderRadius: "4px",
                                                appearance: "auto",
                                                WebkitAppearance: "auto",
                                                MozAppearance: "auto",
                                              }}
                                            >
                                              {tablet?.variant?.map(
                                                (v) =>
                                                  v?.name &&
                                                  v?.price && (
                                                    <option key={v?._id}>
                                                      {v?.name}
                                                    </option>
                                                  )
                                              )}
                                            </select>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  <div className="d-flex align-items-center justify-content-end">
                                    <span
                                      className="fs-12 fw-medium"
                                      style={{
                                        border: "1px solid var(--color-primary,#4c2691)",
                                        borderRadius: "4px",
                                        color: "var(--color-primary,#4c2691)",
                                      }}
                                    >
                                      <img
                                        src="/assets/compare.png"
                                        loading="lazy"
                                        alt="compareimage"
                                        title="compareimage"
                                        style={{ height: "16px" }}
                                      />{" "}
                                      Compare More
                                    </span>
                                  </div>

                                  <div className="container p-0 m-0">
                                    <div className="row g-3">
                                      <swiper-container
                                        slides-per-view="auto"
                                        space-between="10"
                                        grab-cursor="true"
                                        loop="true"
                                        style={{
                                          width: "100%",
                                          padding: "10px 0",
                                        }}
                                      >
                                        {vendors
                                          .slice(0, 3)
                                          .map((vendor, index) => (
                                            <swiper-slide
                                              key={index}
                                              style={{ width: "180px" }}
                                            >
                                              <div
                                                className="border rounded d-flex align-items-center justify-content-between px-2 py-1"
                                                style={{
                                                  backgroundColor: "#fff",
                                                  boxShadow:
                                                    "0 1px 2px rgba(0,0,0,0.1)",
                                                  borderRadius: "8px",
                                                  minHeight: "80px",
                                                }}
                                              >
                                                <div className="d-flex align-items-center">
                                                  <img
                                                    src={
                                                      imgUrl +
                                                      (vendor
                                                        ?.bussinessdetails
                                                        ?.bussiness_image
                                                        ?.url ||
                                                        "/assets/default.png")
                                                    }
                                                    alt={
                                                      vendor?.bussinessdetails
                                                        ?.name
                                                    }
                                                    style={{
                                                      width: "60px",
                                                      height: "60px",
                                                      borderRadius: "6px",
                                                      backgroundColor:
                                                        "#f8f9fa",
                                                    }}
                                                  />
                                                  <div className="ms-2">
                                                    <p
                                                      className="mb-0 text-black"
                                                      style={{
                                                        fontSize: "11px",
                                                      }}
                                                    >
                                                      {vendor
                                                        ?.bussinessdetails
                                                        ?.name &&
                                                        (vendor
                                                          .bussinessdetails
                                                          .name.length > 12
                                                          ? vendor.bussinessdetails.name.slice(
                                                            0,
                                                            12
                                                          ) + "..."
                                                          : vendor
                                                            .bussinessdetails
                                                            .name)}
                                                    </p>
                                                    <p
                                                      className="mb-0 text-black fw-bold"
                                                      style={{
                                                        fontSize: "12px",
                                                        lineHeight: "14px",
                                                      }}
                                                    >
                                                      ₹
                                                      {vendor?.variant?.[0]
                                                        ?.price ?? "N/A"}
                                                    </p>
                                                    <button
                                                      type="button"
                                                      className="btn btn-sm btn-primary"
                                                      style={{
                                                        fontSize: "10px",
                                                        padding: "2px 6px",
                                                        borderRadius:
                                                          "3px !important",
                                                      }}
                                                    >
                                                      Add to cart
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            </swiper-slide>
                                          ))}
                                      </swiper-container>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                      : // Show recommended data when query is empty
                      reconmended.length > 0 &&
                      reconmended.map((item) => {
                        const tablet = item?.tablet;
                        const vendors = item?.vendors || [];

                        return (
                          <div
                            key={tablet?._id}
                            className="col-xxl-4 col-md-4"
                            style={{ display: "flex", marginBottom: "20px" }}
                          >
                            <div
                              className="card shadow-sm"
                              style={{
                                width: "100%",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <div className="card-img">
                                <img
                                  src={
                                    imgUrl +
                                    (tablet?.variant?.[0]?.files?.[0] ||
                                      tablet?.files?.[0] ||
                                      "/assets/default.png")
                                  }
                                  alt={tablet?.name}
                                  title={tablet?.name}
                                  loading="lazy"
                                  style={{
                                    height: "168px",
                                    width: "100%",
                                    objectFit: "cover",
                                    borderRadius: "8px 8px 0px 0px",
                                    overflow: "hidden",
                                  }}
                                />
                              </div>

                              <div
                                className="card-body p-0"
                                style={{
                                  flexGrow: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <div className="d-flex align-items-center px-3 py-1">
                                  <span>
                                    <strong
                                      style={{
                                        color: "#000",
                                        fontSize: "14px",
                                      }}
                                    >
                                      {tablet?.name && tablet?.name.length > 18
                                        ? tablet?.name.slice(0, 18) + "..."
                                        : tablet?.name}
                                    </strong>
                                  </span>
                                  <div className="ms-auto">
                                    <i
                                      className="fa-solid fa-heart me-1"
                                      style={{
                                        color: "#A6A6A6",
                                        fontSize: "20px",
                                      }}
                                    ></i>
                                    <i
                                      className="fa-solid fa-share"
                                      style={{
                                        color: "#A6A6A6",
                                        fontSize: "20px",
                                      }}
                                    ></i>
                                  </div>
                                </div>

                                <div className="px-3" style={{ flexGrow: 1 }}>
                                  <div className="doctor-info-detail">
                                    {tablet && (
                                      <>
                                        {(tablet?.manufacture?.name ||
                                          tablet?.complexity) && (
                                            <p className="mb-1 d-flex justify-content-between align-items-center">
                                              <small style={{ color: "black" }}>
                                                {tablet?.manufacture?.name && (
                                                  <>
                                                    <i className="fas fa-industry me-1 text-primary"></i>
                                                    By{" "}
                                                    {tablet.manufacture.name
                                                      .length > 10
                                                      ? tablet.manufacture.name.slice(
                                                        0,
                                                        10
                                                      ) + "..."
                                                      : tablet.manufacture.name}
                                                  </>
                                                )}
                                                {tablet?.complexity && (
                                                  <>
                                                    {" "}
                                                    <i className="fas fa-cogs me-1 text-secondary"></i>
                                                    Complexity:{" "}
                                                    <span
                                                      className={`fw-normal ${tablet?.complexity ===
                                                          "simple"
                                                          ? "text-success"
                                                          : tablet?.complexity ===
                                                            "medium"
                                                            ? "text-warning"
                                                            : tablet?.complexity ===
                                                              "complex"
                                                              ? "text-danger"
                                                              : "text-secondary"
                                                        }`}
                                                      style={{
                                                        fontWeight: 400,
                                                      }}
                                                    >
                                                      {tablet?.complexity}
                                                    </span>
                                                  </>
                                                )}
                                              </small>
                                              <span className="d-flex align-items-center">
                                                <i
                                                  className="fas fa-star text-warning"
                                                  style={{ fontSize: "12px" }}
                                                ></i>
                                                <small className="text-black">
                                                  4.0(100+)
                                                </small>
                                              </span>
                                            </p>
                                          )}

                                        {/* Composition */}
                                        {tablet?.compositions?.name && (
                                          <p
                                            className="mb-1"
                                            style={{
                                              fontSize: "11px",
                                              color: "black",
                                            }}
                                          >
                                            <i className="fas fa-vial me-1 text-primary"></i>
                                            <span
                                              style={{ fontSize: "11px" }}
                                            >
                                              Composition
                                            </span>
                                            :{" "}
                                            {tablet.compositions.name.length >
                                              16
                                              ? tablet.compositions.name.slice(
                                                0,
                                                16
                                              ) + "..."
                                              : tablet.compositions.name}
                                          </p>
                                        )}

                                        <div className="d-flex flex-wrap">
                                          {tablet?.smapletype && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-flask me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Sample
                                                </span>
                                                : {tablet.smapletype}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.model && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-microchip me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Modal
                                                </span>
                                                :{" "}
                                                {tablet.model.length > 6
                                                  ? tablet?.model.slice(
                                                    0,
                                                    6
                                                  ) + "..."
                                                  : tablet?.model}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.condition && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-info-circle me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Condition
                                                </span>
                                                :{" "}
                                                {tablet.condition.length > 5
                                                  ? tablet?.condition.slice(
                                                    0,
                                                    5
                                                  ) + "..."
                                                  : tablet?.condition}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.duration && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-clock me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Duration
                                                </span>
                                                : {tablet.duration}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.shiftType && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-clock me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Shift
                                                </span>
                                                : {tablet.shiftType}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.nursecareType && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-clock me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Type
                                                </span>
                                                : {tablet.nursecareType}
                                              </p>
                                            </div>
                                          )}
                                          {tablet?.ambulancetype && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-ambulance me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Type
                                                </span>
                                                : {tablet.ambulancetype}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.equipmentType?.length >
                                            0 && (
                                              <div className="col-12">
                                                <div
                                                  className="mb-1 d-flex align-items-center"
                                                  style={{
                                                    fontSize: "11px",
                                                    color: "black",
                                                  }}
                                                >
                                                  <i className="fas fa-kit-medical me-1 text-primary"></i>
                                                  <span
                                                    style={{
                                                      fontSize: "11px",
                                                      fontWeight: 500,
                                                    }}
                                                  >
                                                    Equipments:
                                                  </span>
                                                </div>

                                                <div
                                                  style={{
                                                    paddingLeft: "18px",
                                                  }}
                                                >
                                                  {tablet.equipmentType
                                                    .slice(0, 3)
                                                    .map((item, index) => (
                                                      <div
                                                        key={index}
                                                        className="d-flex align-items-center mb-1"
                                                        style={{
                                                          fontSize: "11px",
                                                          color: "black",
                                                        }}
                                                      >
                                                        <i className="fas fa-check-circle me-1 text-success"></i>
                                                        {item.length > 20
                                                          ? item
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                          item.slice(1, 20) +
                                                          "..."
                                                          : item
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                          item.slice(1)}
                                                      </div>
                                                    ))}
                                                </div>
                                              </div>
                                            )}

                                          {tablet?.bodypart && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-person me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Body Part
                                                </span>
                                                : {tablet.bodypart}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.iscontrast && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-adjust me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Contrast
                                                </span>
                                                :{" "}
                                                {tablet?.iscontrast
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  tablet?.iscontrast.slice(1)}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.reportsDuration && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-file-alt me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Reports
                                                </span>
                                                :{" "}
                                                {tablet.reportsDuration
                                                  .length > 5
                                                  ? tablet?.reportsDuration?.slice(
                                                    0,
                                                    5
                                                  ) + "..."
                                                  : tablet?.reportsDuration}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.gender && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-user me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Gender
                                                </span>
                                                : {tablet.gender}
                                              </p>
                                            </div>
                                          )}

                                          {tablet?.parameterss?.length >
                                            0 && (
                                              <div style={{ flex: "0 0 50%" }}>
                                                <p
                                                  className="mb-1"
                                                  style={{
                                                    fontSize: "11px",
                                                    color: "black",
                                                  }}
                                                >
                                                  <i className="fas fa-check-circle me-1 text-success"></i>
                                                  <span
                                                    style={{ fontSize: "11px" }}
                                                  >
                                                    Parameters
                                                  </span>
                                                  : {tablet.parameterss.length}
                                                </p>
                                              </div>
                                            )}

                                          {tablet?.isFasting && (
                                            <div style={{ flex: "0 0 50%" }}>
                                              <p
                                                className="mb-1"
                                                style={{
                                                  fontSize: "11px",
                                                  color: "black",
                                                }}
                                              >
                                                <i className="fas fa-utensils me-1 text-primary"></i>
                                                <span
                                                  style={{ fontSize: "11px" }}
                                                >
                                                  Fasting
                                                </span>
                                                :{" "}
                                                {tablet.isFasting
                                                  ? tablet.isFasting
                                                    .charAt(0)
                                                    .toUpperCase() +
                                                  tablet.isFasting.slice(1)
                                                  : "No Fasting"}
                                              </p>
                                            </div>
                                          )}
                                        </div>

                                        {(tablet?.variant?.[0]?.price ||
                                          vendors?.[0]?.variant?.[0]
                                            ?.price) && (
                                            <div className="d-flex align-items-center mb-1">
                                              <h5
                                                className="d-flex align-items-center mb-0"
                                                style={{
                                                  color: "#000",
                                                  fontSize: "14px",
                                                }}
                                              >
                                                <strong>
                                                  ₹
                                                  {(
                                                    tablet?.variant?.[0]
                                                      ?.price ??
                                                    vendors?.[0]?.variant?.[0]
                                                      ?.price
                                                  ).toFixed(2)}
                                                </strong>
                                              </h5>
                                              <small
                                                className="ms-1"
                                                style={{
                                                  fontSize: "10px",
                                                }}
                                              >
                                                (₹
                                                {(
                                                  (tablet?.variant?.[0]
                                                    ?.price ??
                                                    vendors?.[0]?.variant?.[0]
                                                      ?.price ??
                                                    0) / 10
                                                ).toFixed(2)}
                                                )
                                              </small>
                                            </div>
                                          )}

                                        {/* select vaints */}
                                        <div
                                          style={{
                                            height:
                                              tablet?.variant?.length > 0
                                                ? "40px"
                                                : "10px",
                                            marginTop:
                                              tablet?.variant?.length > 0
                                                ? "0px"
                                                : "15px",
                                          }}
                                        >
                                          {tablet?.variant?.length > 0 && (
                                            <select
                                              className="form-select my-2"
                                              style={{
                                                width: "200px",
                                                borderColor: "#F1FAFE",
                                                background: "#F1FAFE",
                                                padding: "4px 10px",
                                                borderRadius: "4px",
                                                appearance: "auto",
                                                WebkitAppearance: "auto",
                                                MozAppearance: "auto",
                                              }}
                                            >
                                              {tablet?.variant?.map(
                                                (v) =>
                                                  v?.name &&
                                                  v?.price && (
                                                    <option key={v?._id}>
                                                      {v?.name}
                                                    </option>
                                                  )
                                              )}
                                            </select>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>

                                  <div className="d-flex align-items-center justify-content-end">
                                    <span
                                      className="fs-12 fw-medium"
                                      style={{
                                        border: "1px solid var(--color-primary,#4c2691)",
                                        borderRadius: "4px",
                                        color: "var(--color-primary,#4c2691)",
                                      }}
                                    >
                                      <img
                                        src="/assets/compare.png"
                                        loading="lazy"
                                        alt="compareimage"
                                        title="compareimage"
                                        style={{ height: "16px" }}
                                      />{" "}
                                      Compare More
                                    </span>
                                  </div>

                                  <div className="container p-0 m-0">
                                    <div className="row g-3">
                                      <swiper-container
                                        slides-per-view="auto"
                                        space-between="10"
                                        grab-cursor="true"
                                        loop="true"
                                        style={{
                                          width: "100%",
                                          padding: "10px 0",
                                        }}
                                      >
                                        {vendors
                                          .slice(0, 3)
                                          .map((vendor, index) => (
                                            <swiper-slide
                                              key={index}
                                              style={{ width: "180px" }}
                                            >
                                              <div
                                                className="border rounded d-flex align-items-center justify-content-between px-2 py-1"
                                                style={{
                                                  backgroundColor: "#fff",
                                                  boxShadow:
                                                    "0 1px 2px rgba(0,0,0,0.1)",
                                                  borderRadius: "8px",
                                                  minHeight: "80px",
                                                }}
                                              >
                                                <div className="d-flex align-items-center">
                                                  <img
                                                    src={
                                                      imgUrl +
                                                      (vendor
                                                        ?.bussinessdetails
                                                        ?.bussiness_image
                                                        ?.url ||
                                                        "/assets/default.png")
                                                    }
                                                    alt={
                                                      vendor?.bussinessdetails
                                                        ?.name
                                                    }
                                                    style={{
                                                      width: "60px",
                                                      height: "60px",
                                                      borderRadius: "6px",
                                                      backgroundColor:
                                                        "#f8f9fa",
                                                    }}
                                                  />
                                                  <div className="ms-2">
                                                    <p
                                                      className="mb-0 text-black"
                                                      style={{
                                                        fontSize: "11px",
                                                      }}
                                                    >
                                                      {vendor
                                                        ?.bussinessdetails
                                                        ?.name &&
                                                        (vendor
                                                          .bussinessdetails
                                                          .name.length > 12
                                                          ? vendor.bussinessdetails.name.slice(
                                                            0,
                                                            12
                                                          ) + "..."
                                                          : vendor
                                                            .bussinessdetails
                                                            .name)}
                                                    </p>
                                                    <p
                                                      className="mb-0 text-black fw-bold"
                                                      style={{
                                                        fontSize: "12px",
                                                        lineHeight: "14px",
                                                      }}
                                                    >
                                                      ₹
                                                      {vendor?.variant?.[0]
                                                        ?.price ?? "N/A"}
                                                    </p>
                                                    <button
                                                      type="button"
                                                      className="btn btn-sm btn-primary"
                                                      style={{
                                                        fontSize: "10px",
                                                        padding: "2px 6px",
                                                        borderRadius:
                                                          "3px !important",
                                                      }}
                                                    >
                                                      Add to cart
                                                    </button>
                                                  </div>
                                                </div>
                                              </div>
                                            </swiper-slide>
                                          ))}
                                      </swiper-container>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
};

export default SearchOverlay;
