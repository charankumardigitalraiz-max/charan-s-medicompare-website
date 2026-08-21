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
        <footer className="!bg-[#321961] text-white">
          <div className="pt-10 pb-[10px]">
            <div className="w-full px-2 md:px-20">
              <div className="flex flex-wrap -mx-4 gap-y-4">
                {/* About  */}
                <div className="w-full lg:w-1/3 px-4 mb-4 lg:mb-0">
                  <div>
                    <div className="mb-3">
                      <img
                        src="/assets/logo-white.png"
                        alt="Medi Compares Logo"
                        loading="lazy"
                        className="!h-[60px] w-auto object-contain"
                      />
                    </div>
                    <h5 className="font-semibold mb-[4px] !text-white !text-[18px]">
                      Your Trusted Medicine Comparison Platform
                    </h5>
                    <p className="!text-white !text-[14px] leading-[1.8] mb-5">
                      Compare medicine prices across multiple pharmacies
                      instantly. Find the best deals, genuine medicines, and
                      affordable alternatives. Save money on your healthcare
                      while making informed decisions.
                    </p>

                    {/* Key Features */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center">
                        <i className="fas fa-check-circle mr-2 text-[#04BD6C] text-[16px]"></i>
                        <span className="!text-white/90 !text-[13px]">
                          Compare prices from 500+ pharmacies
                        </span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-check-circle mr-2 text-[#04BD6C] text-[16px]"></i>
                        <span className="!text-white/90 !text-[13px]">
                          100% genuine & verified medicines
                        </span>
                      </div>
                      <div className="flex items-center">
                        <i className="fas fa-check-circle mr-2 text-[#04BD6C] text-[16px]"></i>
                        <span className="!text-white/90 !text-[13px]">
                          Find cheaper alternatives instantly
                        </span>
                      </div>
                    </div>

                    {/* Social Icons */}
                    <div className="social-icon mt-4">
                      <ul className="list-none p-0 flex gap-[12px] m-0">
                        {socialLinks.facebook && (
                          <li>
                            <a
                              href={socialLinks.facebook}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="!w-[36px] !h-[36px] !flex !items-center !justify-center bg-white/10 !rounded-full text-white no-underline transition-all duration-300 hover:bg-[#1877F2] hover:-translate-y-[3px]"
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
                              className="!w-[36px] !h-[36px] !flex !items-center !justify-center bg-white/10 !rounded-full text-white no-underline transition-all duration-300 hover:bg-[#1DA1F2] hover:-translate-y-[3px]"
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
                              className="!w-[36px] !h-[36px] !flex !items-center !justify-center bg-white/10 !rounded-full text-white no-underline transition-all duration-300 hover:bg-[linear-gradient(45deg,#f09433_0%,#e6683c_25%,#dc2743_50%,#cc2366_75%,#bc1888_100%)] hover:-translate-y-[3px]"
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
                              className="!w-[36px] !h-[36px] !flex !items-center !justify-center bg-white/10 !rounded-full text-white no-underline transition-all duration-300 hover:bg-[#0A66C2] hover:-translate-y-[3px]"
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
                              className="!w-[36px] !h-[36px] !flex !items-center !justify-center bg-white/10 !rounded-full text-white no-underline transition-all duration-300 hover:bg-[#FF0000] hover:-translate-y-[3px]"
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
                <div className="w-full md:w-1/2 lg:w-1/6 px-4 mb-4 lg:mb-0">
                  <div>
                    <h5 className="font-semibold !mb-5 !text-white !text-[16px]">
                      Quick Links
                    </h5>
                    <ul className="list-none p-0 m-0">
                      {(categories.length > 0 ? categories : fetchedCategories).map((category) => (
                        <li key={category._id} className="mb-3">
                          <Link
                            to={`/${category.slug}`}
                            className="!text-white no-underline !text-[14px] transition-all duration-300 inline-block hover:text-gray-300"
                          >
                            <i className="fas fa-chevron-right mr-2 text-[10px]"></i>
                            {category.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Support  */}
                <div className="w-full md:w-1/2 lg:w-1/4 px-4 mb-4 lg:mb-0">
                  <div>
                    <h5 className="font-semibold !mb-5 !text-white !text-[16px]">
                      Support & Information
                    </h5>
                    <ul className="list-none p-0 m-0">
                      <li className="mb-3">
                        <Link
                          className="!text-white no-underline !text-[14px] transition-all duration-300 inline-block hover:text-gray-300"
                          to="/contact-us"
                        >
                          <i className="fas fa-chevron-right mr-2 text-[10px]"></i>
                          Contact Us
                        </Link>
                      </li>

                      {pages.length > 0 ? (
                        pages.map((p) => (
                          <li key={p._id} className="mb-3">
                            <Link
                              to={`/policies/${p.slug}`}
                              className="!text-white no-underline !text-[14px] transition-all duration-300 inline-block hover:text-gray-300"
                            >
                              <i className="fas fa-chevron-right mr-2 text-[10px]"></i>
                              {p.title}
                            </Link>
                          </li>
                        ))
                      ) : (
                        <>
                          <li className="mb-3">
                            <Link
                              to="/policies/terms-and-conditions"
                              className="!text-white no-underline !text-[14px] transition-all duration-300 inline-block hover:text-gray-300"
                            >
                              <i className="fas fa-chevron-right mr-2 text-[10px]"></i>
                              Terms & Conditions
                            </Link>
                          </li>
                          <li className="mb-3">
                            <Link
                              to="/policies/privacy-policy"
                              className="!text-white no-underline !text-[14px] transition-all duration-300 inline-block hover:text-gray-300"
                            >
                              <i className="fas fa-chevron-right mr-2 text-[10px]"></i>
                              Privacy Policy
                            </Link>
                          </li>
                          <li className="mb-3">
                            <Link
                              to="/policies/refund-policy"
                              className="!text-white no-underline !text-[14px] transition-all duration-300 inline-block hover:text-gray-300"
                            >
                              <i className="fas fa-chevron-right mr-2 text-[10px]"></i>
                              Refund Policy
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>

                {/* Newsletter & Contact Section */}
                <div className="w-full lg:w-1/4 px-4">
                  <div>
                    <h5 className="font-semibold !mb-5 !text-white !text-[16px]">
                      Contact Info
                    </h5>
                    <ul className="list-none p-0 m-0">
                      <li className="mb-3">
                        <a
                          href="tel:+919010357778"
                          className="block !text-white !text-[13px] no-underline mb-0.5 transition-all duration-300 hover:text-gray-300"
                        >
                          <i className="fas fa-phone mr-2 text-[10px]"></i>
                          +91 9010 357 778
                        </a>
                      </li>
                      <li className="mb-3">
                        <a
                          href="tel:+919010347778"
                          className="block !text-white !text-[13px] no-underline mb-0.5 transition-all duration-300 hover:text-gray-300"
                        >
                          <i className="fas fa-phone mr-2 text-[10px]"></i>
                          +91 9010 347 778
                        </a>
                      </li>
                      <li className="mb-3">
                        <a
                          href="mailto:info@medicompares.com"
                          className="block !text-white !text-[13px] no-underline mb-0.5 transition-all duration-300 hover:text-gray-300"
                        >
                          <i className="fas fa-envelope mr-2 text-[10px]"></i>
                          info@medicompares.com
                        </a>
                      </li>
                      <li className="mb-3">
                        <a
                          href="https://www.google.com/maps?q=2nd+Floor,+H.No.+10-5-2/7/92,+Banjara+Hills+Rd+No.+1,+Hyderabad,+Telangana+500004"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block !text-white !text-[13px] no-underline mb-0.5 transition-all duration-300 hover:text-gray-300"
                        >
                          <span className="!text-[13px] leading-[1.6]">
                            <i className="mr-2 fas fa-map-marker-alt"></i>
                            2nd Floor, H.No. 10-5-2/7/92, G-3,
                            <br />
                            Banjara Hills Rd No. 1, Opp. Banjara Function Hall,
                            <br />
                            Hyderabad, Telangana – 500004
                          </span>
                        </a>
                      </li>
                    </ul>

                    <div className="flex items-center gap-2 my-3">
                      <a
                        href="https://vendor.medicompares.com/register"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-[linear-gradient(135deg,#321961_0%,#822BD4_100%)] !text-white py-2 px-2.5 rounded-[25px] no-underline !text-[12px] font-semibold transition-all duration-300 border-none gap-2 whitespace-nowrap hover:opacity-90"
                      >
                        <i className="fas fa-handshake !text-[14px]" />
                        Partner with Us
                      </a>

                      <Link
                        to="/partners"
                        className="inline-flex items-center bg-[linear-gradient(135deg,#321961_0%,#822BD4_100%)] !text-white py-2 px-2.5 rounded-[25px] no-underline !text-[12px] font-semibold transition-all duration-300 border-none gap-2 whitespace-nowrap hover:opacity-90"
                      >
                        <i className="fas fa-users !text-[14px]" />
                        Explore Partners
                      </Link>
                    </div>

                    <h5 className="font-semibold !text-white !text-[16px]">
                      Stay Updated
                    </h5>
                    <p className="!text-white !text-[13px]">
                      Subscribe to get health tips, medicine price alerts, and
                      exclusive deals delivered to your inbox.
                    </p>

                    <form onSubmit={handleSubscribe} className="mb-4">
                      <div className="flex">
                        <input
                          type="email"
                          className="flex-1 bg-white/10 border border-white/20 !text-white rounded-l-[8px] !text-[12px] py-2 px-4 focus:outline-none focus:ring-1 focus:ring-[#822BD4]"
                          placeholder="Enter your email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                        <button
                          className="bg-[linear-gradient(135deg,#321961_0%,#822BD4_100%)] border-none !rounded-r-[8px] !text-white !font-semibold py-2 px-5 transition-all duration-300 hover:opacity-90"
                          type="submit"
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
          <div className="bg-black/30 border-t border-white/10 py-6">
            <div className="w-full px-2 md:px-20">
              <div className="flex flex-wrap items-center">
                <div className="w-full md:w-1/2 mb-3 md:mb-0">
                  <p className="m-0 !text-[13px] !text-white">
                    © {new Date().getFullYear()} ORU HEALTHCARE PVT LTD. All rights reserved..
                  </p>
                </div>
                <div className="w-full md:w-1/2 text-left md:text-right">
                  <div>
                    <ul className="flex justify-start md:justify-end gap-2 p-0 list-none m-0">
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
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 md:!hidden shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="py-1">
          <div className="flex justify-around items-center text-center">
            <Link to="/" className="w-1/4 flex flex-col items-center justify-center py-1 group !no-underline">
              <i className={`fa-solid fa-house text-xl mb-1 transition-colors duration-300 ${location.pathname === "/" ? "text-[#321961]" : "text-gray-400 group-hover:text-[#321961]"}`}></i>
              <span className={`text-[10px] font-semibold transition-colors duration-300 ${location.pathname === "/" ? "text-[#321961] font-bold" : "text-gray-500 group-hover:text-[#321961]"}`}>Home</span>
            </Link>

            <Link to="/mobile-categories" className="w-1/4 flex flex-col items-center justify-center py-1 group !no-underline">
              <i className={`fa-solid fa-table-cells-large text-xl mb-1 transition-colors duration-300 ${location.pathname === "/mobile-categories" ? "text-[#321961]" : "text-gray-400 group-hover:text-[#321961]"}`}></i>
              <span className={`text-[10px] font-semibold transition-colors duration-300 ${location.pathname === "/mobile-categories" ? "text-[#321961] font-bold" : "text-gray-500 group-hover:text-[#321961]"}`}>Categories</span>
            </Link>

            <div onClick={handleProfileClick} className="w-1/4 flex flex-col items-center justify-center py-1 group cursor-pointer">
              <i className={`fa-solid fa-circle-user text-xl mb-1 transition-colors duration-300 ${location.pathname === "/profile-sidebar" || location.pathname === "/login" || location.pathname === "/profile" ? "text-[#321961]" : "text-gray-400 group-hover:text-[#321961]"}`}></i>
              <span className={`text-[10px] font-semibold transition-colors duration-300 ${location.pathname === "/profile-sidebar" || location.pathname === "/login" || location.pathname === "/profile" ? "text-[#321961] font-bold" : "text-gray-500 group-hover:text-[#321961]"}`}>Profile</span>
            </div>

            <Link to="/cart" className="w-1/4 flex flex-col items-center justify-center py-1 group !no-underline">
              <i className={`fa-solid fa-cart-shopping text-xl mb-1 transition-colors duration-300 ${location.pathname === "/cart" ? "text-[#321961]" : "text-gray-400 group-hover:text-[#321961]"}`}></i>
              <span className={`text-[10px] font-semibold transition-colors duration-300 ${location.pathname === "/cart" ? "text-[#321961] font-bold" : "text-gray-500 group-hover:text-[#321961]"}`}>Cart</span>
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Home2Footer;
