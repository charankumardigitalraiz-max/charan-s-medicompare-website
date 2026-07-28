import { Link, useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { fetchCategoryList, axiosCommonInstance, axiosInstance } from "../../Apiservice";

// Memory cache to prevent refetching settings/pages on every page route transition
let cachedSettings = null;
let cachedPages = null;
let cachedSettingsPromise = null;
let cachedPagesPromise = null;

const Home2Footer = ({ categories: propCategories }) => {
  const categories = propCategories || [];
  const [fetchedCategories, setFetchedCategories] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [socialLinks, setSocialLinks] = useState({
    facebook: "https://www.facebook.com/login",
    twitter: "https://x.com",
    instagram: "https://www.instagram.com/",
    linkedin: "https://www.linkedin.com/login",
    youtube: "https://www.youtube.com",
  });
  const [pages, setPages] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      if (cachedSettings) {
        setSocialLinks((prev) => ({
          ...prev,
          ...cachedSettings,
        }));
        return;
      }
      try {
        if (!cachedSettingsPromise) {
          cachedSettingsPromise = axiosCommonInstance.get("/settings")
            .then((response) => {
              if (response.data?.success && response.data?.data) {
                const rawSocialLinks = response.data.data.social_links;
                if (rawSocialLinks) {
                  return typeof rawSocialLinks === "string" ? JSON.parse(rawSocialLinks) : rawSocialLinks;
                }
              }
              return null;
            })
            .catch((error) => {
              console.error("Error fetching settings:", error);
              cachedSettingsPromise = null; // reset to allow retry
              return null;
            });
        }
        const parsed = await cachedSettingsPromise;
        if (parsed) {
          cachedSettings = parsed;
          setSocialLinks((prev) => ({
            ...prev,
            ...parsed,
          }));
        }
      } catch (error) {
        console.error("Error in fetchSettings effect:", error);
      }
    };

    const fetchPages = async () => {
      if (cachedPages) {
        setPages(cachedPages);
        return;
      }
      try {
        if (!cachedPagesPromise) {
          cachedPagesPromise = axiosCommonInstance.get("/pages")
            .then((response) => {
              if (response.data?.success && response.data?.data?.pages) {
                return response.data.data.pages;
              }
              return null;
            })
            .catch((error) => {
              console.error("Error fetching pages:", error);
              cachedPagesPromise = null; // reset to allow retry
              return null;
            });
        }
        const pagesData = await cachedPagesPromise;
        if (pagesData) {
          cachedPages = pagesData;
          setPages(pagesData);
        }
      } catch (error) {
        console.error("Error in fetchPages effect:", error);
      }
    };

    fetchSettings();
    fetchPages();
  }, []);

  useEffect(() => {
    if (categories.length === 0) {
      const fetchCategories = async () => {
        try {
          const categoryData = await fetchCategoryList();
          setFetchedCategories(categoryData);
        } catch (error) {
          toast.error(error.message);
        }
      };
      fetchCategories();
    }
  }, [categories.length]);

  const handleSubscribe = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error("Please enter a valid email address");
      return;
    }

    const bodyData = {
      email,
    };

    try {
      const response = await axiosInstance.post("subcribers/create", bodyData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data?.message) {
        toast.success(response.data.message);
        setEmail("");
      } else {
        toast.error("Unexpected response");
      }
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to subscribe. Please try again later");
      }
    }
  };

  const handleProfileClick = (e) => {
    e.preventDefault();
    const isLoggedIn = !!localStorage.getItem("medicomparestoken");
    if (!isLoggedIn) {
      navigate("/login");
    } else {
      navigate("/profile-sidebar");
    }
  };

  return (
    <>
      {!location.pathname.startsWith("/cart") && (
        <footer
          className="footer"
          style={{
            backgroundColor: "#331962",
            color: "#fff",
          }}
        >
          <div className="footer-top" style={{ padding: "40px 0 10px" }}>
            <div className="container-fluid px-2 px-md-5">
              <div className="row g-4">
                {/* About  */}
                <div className="col-lg-4 col-md-6 mb-4 mb-lg-0">
                  <div className="footer-widget">
                    <div className="footer-logo mb-3">
                      <img
                        src="/assets/logo-white.png"
                        alt="Medi Compares Logo"
                        loading="lazy"
                        style={{ height: "50px" }}
                      />
                    </div>
                    <h5
                      style={{
                        fontWeight: "600",
                        marginBottom: "4px",
                        color: "#fff",
                        fontSize: "18px",
                      }}
                    >
                      Your Trusted Medicine Comparison Platform
                    </h5>
                    <p
                      style={{
                        color: "white",
                        fontSize: "14px",
                        lineHeight: "1.8",
                        marginBottom: "20px",
                      }}
                    >
                      Compare medicine prices across multiple pharmacies
                      instantly. Find the best deals, genuine medicines, and
                      affordable alternatives. Save money on your healthcare
                      while making informed decisions.
                    </p>

                    {/* Key Features */}
                    <div className="d-flex flex-column gap-2">
                      <div className="d-flex align-items-center">
                        <i
                          className="fas fa-check-circle me-2"
                          style={{ color: "#04BD6C", fontSize: "16px" }}
                        ></i>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "13px",
                          }}
                        >
                          Compare prices from 500+ pharmacies
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i
                          className="fas fa-check-circle me-2"
                          style={{ color: "#04BD6C", fontSize: "16px" }}
                        ></i>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "13px",
                          }}
                        >
                          100% genuine & verified medicines
                        </span>
                      </div>
                      <div className="d-flex align-items-center">
                        <i
                          className="fas fa-check-circle me-2"
                          style={{ color: "#04BD6C", fontSize: "16px" }}
                        ></i>
                        <span
                          style={{
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "13px",
                          }}
                        >
                          Find cheaper alternatives instantly
                        </span>
                      </div>
                    </div>

                    {/* Social Icons */}
                    <div className="social-icon mt-4">
                      <ul
                        style={{
                          listStyle: "none",
                          padding: 0,
                          display: "flex",
                          gap: "12px",
                          margin: 0,
                        }}
                      >
                        {socialLinks.facebook && (
                          <li>
                            <a
                              href={socialLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: "50%",
                                color: "#fff",
                                textDecoration: "none",
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#1877F2";
                                e.target.style.transform = "translateY(-3px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background =
                                  "rgba(255,255,255,0.1)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              <i className="fab fa-facebook-f" />
                            </a>
                          </li>
                        )}
                        {socialLinks.twitter && (
                          <li>
                            <a
                              href={socialLinks.twitter}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: "50%",
                                color: "#fff",
                                textDecoration: "none",
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#1DA1F2";
                                e.target.style.transform = "translateY(-3px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background =
                                  "rgba(255,255,255,0.1)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              <i className="fab fa-twitter" />
                            </a>
                          </li>
                        )}
                        {socialLinks.instagram && (
                          <li>
                            <a
                              href={socialLinks.instagram}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: "50%",
                                color: "#fff",
                                textDecoration: "none",
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background =
                                  "linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)";
                                e.target.style.transform = "translateY(-3px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background =
                                  "rgba(255,255,255,0.1)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              <i className="fab fa-instagram" />
                            </a>
                          </li>
                        )}
                        {socialLinks.linkedin && (
                          <li>
                            <a
                              href={socialLinks.linkedin}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: "50%",
                                color: "#fff",
                                textDecoration: "none",
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#0A66C2";
                                e.target.style.transform = "translateY(-3px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background =
                                  "rgba(255,255,255,0.1)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              <i className="fab fa-linkedin-in" />
                            </a>
                          </li>
                        )}
                        {socialLinks.youtube && (
                          <li>
                            <a
                              href={socialLinks.youtube}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{
                                width: "36px",
                                height: "36px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: "rgba(255,255,255,0.1)",
                                borderRadius: "50%",
                                color: "#fff",
                                textDecoration: "none",
                                transition: "all 0.3s",
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = "#FF0000";
                                e.target.style.transform = "translateY(-3px)";
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.background =
                                  "rgba(255,255,255,0.1)";
                                e.target.style.transform = "translateY(0)";
                              }}
                            >
                              <i className="fab fa-youtube" />
                            </a>
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Quick Links  */}
                <div className="col-lg-2 col-md-6 mb-4 mb-lg-0">
                  <div className="footer-widget">
                    <h5
                      className="footer-title"
                      style={{
                        fontWeight: "600",
                        marginBottom: "20px",
                        color: "#fff",
                        fontSize: "16px",
                      }}
                    >
                      Quick Links
                    </h5>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {(categories.length > 0 ? categories : fetchedCategories).map((category) => (
                        <li key={category._id} style={{ marginBottom: "12px" }}>
                          <Link
                            to={`/${category.slug}`}
                            style={{
                              color: "white",
                              textDecoration: "none",
                              fontSize: "14px",
                              transition: "all 0.3s",
                              display: "inline-block",
                            }}
                          >
                            <i
                              className="fas fa-chevron-right me-2"
                              style={{ fontSize: "10px" }}
                            ></i>
                            {category.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Support  */}
                <div className="col-lg-3 col-md-6 mb-4 mb-lg-0">
                  <div className="footer-widget">
                    <h5
                      className="footer-title"
                      style={{
                        fontWeight: "600",
                        marginBottom: "20px",
                        color: "#fff",
                        fontSize: "16px",
                      }}
                    >
                      Support & Information
                    </h5>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {/* <li style={{ marginBottom: "12px" }}>
                        <Link
                          style={{
                            color: "white",
                            textDecoration: "none",
                            fontSize: "14px",
                            transition: "all 0.3s",
                            display: "inline-block",
                          }}
                        >
                          <i
                            className="fas fa-chevron-right me-2"
                            style={{ fontSize: "10px" }}
                          ></i>
                          About Us
                        </Link>
                      </li>
                      <li style={{ marginBottom: "12px" }}>
                        <Link
                          style={{
                            color: "white",
                            textDecoration: "none",
                            fontSize: "14px",
                            transition: "all 0.3s",
                            display: "inline-block",
                          }}
                        >
                          <i
                            className="fas fa-chevron-right me-2"
                            style={{ fontSize: "10px" }}
                          ></i>
                          How It Works
                        </Link>
                      </li> */}
                      <li style={{ marginBottom: "12px" }}>
                        <Link
                          style={{
                            color: "white",
                            textDecoration: "none",
                            fontSize: "14px",
                            transition: "all 0.3s",
                            display: "inline-block",
                          }}
                          to="/contact-us"
                        >
                          <i
                            className="fas fa-chevron-right me-2"
                            style={{ fontSize: "10px" }}
                          ></i>
                          Contact Us
                        </Link>
                      </li>

                      {pages.length > 0 ? (
                        pages.map((p) => (
                          <li key={p._id} style={{ marginBottom: "12px" }}>
                            <Link
                              to={`/policies/${p.slug}`}
                              style={{
                                color: "white",
                                textDecoration: "none",
                                fontSize: "14px",
                                transition: "all 0.3s",
                                display: "inline-block",
                              }}
                            >
                              <i
                                className="fas fa-chevron-right me-2"
                                style={{ fontSize: "10px" }}
                              ></i>
                              {p.title}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <>
                          <li style={{ marginBottom: "12px" }}>
                            <Link
                              to="/policies/terms-and-conditions"
                              style={{
                                color: "white",
                                textDecoration: "none",
                                fontSize: "14px",
                                transition: "all 0.3s",
                                display: "inline-block",
                              }}
                            >
                              <i
                                className="fas fa-chevron-right me-2"
                                style={{ fontSize: "10px" }}
                              ></i>
                              Terms & Conditions
                            </Link>
                          </li>
                          <li style={{ marginBottom: "12px" }}>
                            <Link
                              to="/policies/privacy-policy"
                              style={{
                                color: "white",
                                textDecoration: "none",
                                fontSize: "14px",
                                transition: "all 0.3s",
                                display: "inline-block",
                              }}
                            >
                              <i
                                className="fas fa-chevron-right me-2"
                                style={{ fontSize: "10px" }}
                              ></i>
                              Privacy Policy
                            </Link>
                          </li>
                          <li style={{ marginBottom: "12px" }}>
                            <Link
                              to="/policies/refund-policy"
                              style={{
                                color: "white",
                                textDecoration: "none",
                                fontSize: "14px",
                                transition: "all 0.3s",
                                display: "inline-block",
                              }}
                            >
                              <i
                                className="fas fa-chevron-right me-2"
                                style={{ fontSize: "10px" }}
                              ></i>
                              Refund Policy
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Newsletter & Contact Section */}
                <div className="col-lg-3 col-md-6">
                  <div className="footer-widget">
                    <h5
                      className="footer-title"
                      style={{
                        fontWeight: "600",
                        marginBottom: "20px",
                        color: "#fff",
                        fontSize: "16px",
                      }}
                    >
                      Contact Info
                    </h5>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      <li style={{ marginBottom: "12px" }}>
                        <a
                          href="tel:+919010357778"
                          className="d-block"
                          style={{
                            color: "white",
                            fontSize: "13px",
                            textDecoration: "none",
                            marginBottom: "2px",
                            transition: "all 0.3s",
                          }}
                        >
                          <i
                            className="fas fa-phone me-2"
                            style={{ fontSize: "10px" }}
                          ></i>
                          +91 9010 357 778
                        </a>
                      </li>
                      <li style={{ marginBottom: "12px" }}>
                        <a
                          href="tel:+919010347778"
                          className="d-block"
                          style={{
                            color: "white",
                            fontSize: "13px",
                            textDecoration: "none",
                            marginBottom: "2px",
                            transition: "all 0.3s",
                          }}
                        >
                          <i
                            className="fas fa-phone me-2"
                            style={{ fontSize: "10px" }}
                          ></i>
                          +91 9010 347 778
                        </a>
                      </li>
                      <li style={{ marginBottom: "12px" }}>
                        <a
                          href="mailto:info@medicompares.com"
                          className="d-block"
                          style={{
                            color: "white",
                            fontSize: "13px",
                            textDecoration: "none",
                            marginBottom: "2px",
                            transition: "all 0.3s",
                          }}
                        >
                          <i
                            className="fas fa-envelope me-2"
                            style={{ fontSize: "10px" }}
                          ></i>
                          info@medicompares.com
                        </a>
                      </li>
                      <li style={{ marginBottom: "12px" }}>
                        <a
                          href="https://www.google.com/maps?q=2nd+Floor,+H.No.+10-5-2/7/92,+Banjara+Hills+Rd+No.+1,+Hyderabad,+Telangana+500004"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="d-block"
                          style={{
                            color: "white",
                            fontSize: "13px",
                            textDecoration: "none",
                            marginBottom: "2px",
                            transition: "all 0.3s",
                          }}
                        >
                          <small
                            style={{
                              fontSize: 13,
                              lineHeight: 1.6,
                            }}
                          >
                            <i className="me-2 fas fa-map-marker-alt"></i>
                            2nd Floor, H.No. 10-5-2/7/92, G-3,
                            <br />
                            Banjara Hills Rd No. 1, Opp. Banjara Function Hall,
                            <br />
                            Hyderabad, Telangana – 500004
                          </small>
                        </a>
                      </li>
                    </ul>

                    <div className="d-flex align-items-center gap-2 my-3">
                      <a
                        href="https://vendor.medicompares.com/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="d-inline-flex align-items-center"
                        style={{
                          background:
                            "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
                          color: "#fff",
                          padding: "10px 10px",
                          borderRadius: "25px",
                          textDecoration: "none",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.3s",
                          border: "none",
                          gap: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <i
                          className="fas fa-handshake"
                          style={{ fontSize: "14px" }}
                        />
                        Partner with Us
                      </a>

                      <Link
                        to="/partners"
                        className="d-inline-flex align-items-center"
                        style={{
                          background:
                            "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
                          color: "#fff",
                          padding: "10px 10px",
                          borderRadius: "25px",
                          textDecoration: "none",
                          fontSize: "12px",
                          fontWeight: "600",
                          transition: "all 0.3s",
                          border: "none",
                          gap: "8px",
                          whiteSpace: "nowrap",
                        }}
                      >
                        <i
                          className="fas fa-users"
                          style={{ fontSize: "14px" }}
                        />
                        Explore Partners
                      </Link>
                    </div>

                    <h5
                      className="footer-title"
                      style={{
                        fontWeight: "600",
                        color: "#fff",
                        fontSize: "16px",
                      }}
                    >
                      Stay Updated
                    </h5>
                    <p
                      style={{
                        color: "white",
                        fontSize: "13px",
                      }}
                    >
                      Subscribe to get health tips, medicine price alerts, and
                      exclusive deals delivered to your inbox.
                    </p>

                    <form onSubmit={handleSubscribe} className="mb-4">
                      <div className="input-group">
                        <input
                          type="email"
                          className="form-control footer-email"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          style={{
                            background: "rgba(255,255,255,0.1)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            color: "#fff",
                            borderRadius: "8px 0 0 8px",
                            fontSize: "12px",
                            padding: "8px 15px",
                          }}
                        />
                        <button
                          className="btn"
                          type="submit"
                          style={{
                            background:
                              "linear-gradient(135deg, #8059ca 0%, #822BD4 100%)",
                            border: "none",
                            borderRadius: "0 8px 8px 0",
                            color: "#fff",
                            fontWeight: "600",
                            padding: "10px 20px",
                            transition: "all 0.3s",
                          }}
                        >
                          Subscribe
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div
            className="footer-bottom"
            style={{
              background: "rgba(0,0,0,0.3)",
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: "25px 0",
            }}
          >
            <div className="container-fluid px-2 px-md-5">
              <div className="row align-items-center">
                <div className="col-md-6 mb-3 mb-md-0">
                  <p
                    style={{
                      margin: 0,
                      fontSize: "13px",
                      color: "white",
                    }}
                  >
                    © {new Date().getFullYear()} ORU HEALTHCARE PVT LTD. All rights reserved..
                  </p>
                </div>
                <div className="col-md-6 text-md-end">
                  <div className="copyright-menu">
                    <ul className="payment-method d-flex justify-content-end gap-2 p-0">
                      <li>
                        <img src="/assets/img/icons/card-01.svg" alt="Img" />
                      </li>
                      <li>
                        <img src="/assets/img/icons/card-02.svg" alt="Img" />
                      </li>
                      <li>
                        <img src="/assets/img/icons/card-03.svg" alt="Img" />
                      </li>
                      <li>
                        <img src="/assets/img/icons/card-04.svg" alt="Img" />
                      </li>
                      <li>
                        <img src="/assets/img/icons/card-05.svg" alt="Img" />
                      </li>
                      <li>
                        <img src="/assets/img/icons/card-06.svg" alt="Img" />
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}
      {/* Mobile Footer */}
      <footer className="mobile-footer d-md-none">
        <div style={{ padding: "3px" }}>
          <div className="row text-center">
            <div className="col-3 footer-item">
              <Link to="/">
                <img src="/assets/home.png" alt="home" loading="lazy" />
              </Link>
              <div>Home</div>
            </div>

            <div className="col-3 footer-item">
              <Link to="/mobile-categories">
                <img
                  src="/assets/bullets.png"
                  alt="Categories"
                  loading="lazy"
                />
              </Link>
              <div>Categories</div>
            </div>

            <div className="col-3 footer-item">
              <div onClick={handleProfileClick} style={{ cursor: "pointer" }}>
                <img src="/assets/user.png" alt="Profile" loading="lazy" />
              </div>
              <div>Profile</div>
            </div>

            <div className="col-3 footer-item">
              <Link to="/cart">
                <img
                  src="/assets/shopping-cart.png"
                  alt="Cart"
                  loading="lazy"
                />
              </Link>
              <div>Cart</div>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home2Footer;
