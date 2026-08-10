import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Home2Header from "../../../components/layout/Header-k";
import Footer from "../../../components/layout/Footer-f";
import Profile from "../Profile";
import Reviews from "../Reviews";
import Favourites from "../Favourites";
import Leads from "../Leads";
import toast from "react-hot-toast";
import { axiosUserInstance } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import Address from "../Addresses";
import Notifications from "../Notifications";
import Transactions from "../Transactions";
import { useResponsive } from "../../../hooks/useResponsive";
import Referral from "../Referals";
// import Appoitments from "../Appoitments";
import FamilyMembers from "../FamilyMembers";
import Wallet from "../Wallet";
import MyReports from "../MyReports";
import TicketIssues from "../TicketIssues";

// Services & Bookings imports from orders-bookings
import AmbulanceBooking from "../orders-bookings/Ambulance-booking";
import RentalBooking from "../orders-bookings/RentalBooking";
import Consultation from "../Consultation";
import AppointmentsOrders from "../orders-bookings/Appointment-Order";
import CartAndBookingOrders from "../orders-bookings/CartAndBookingOrders";
import { fetchCategoryList } from "../../../Apiservice";

const ProfileSideBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState([]);
  const [file, setFile] = useState(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isOrdersBookingOpen, setIsOrdersBookingOpen] = useState(true);
  const { isMobile, isXs: extrasmall } = useResponsive();
  const [ServiceTabs, setServiceTabs] = useState([]);

  useEffect(() => {
    fetchCategoryList().then((data) => {
      const allType = { fixedType: "all", name: "All", categoryType: "all" };
      setServiceTabs([allType, ...data]);
    });
  }, [fetchCategoryList]);

  // Map URL paths to section IDs
  const pathToSectionMap = {
    "/profile-sidebar": "profile",
    "/my-favourites": "favourites",
    "/family-members": "family-members",
    "/doctor-list": "doctor-list",
    "/myorders": "myorders",
    "/my-reports": "myreports",
    "/my-enquiries": "my-enquiries",
    "/ticket-raised": "ticket-raised",
    "/my-appointments": "AppointmentsOrders",
    "/my-consultations": "my-consultations",
    "/rental-booking": "rental-booking",
    "/notifications": "notifications",
    "/my-transactions": "my-transactions",
    "/wallet": "wallet",
    "/manage-address": "manage-address",
    "/ambulance-booking": "ambulance-booking",
    "/reviews": "reviews",
    "/referals": "referals",
    // "/enquery-appointments": "enquery-appointments",
    "/my-orders": "my-orders",
    "/labtest": "labtest",
    "/dental": "dental",
    "/diagnostics": "diagnostics",
    "/medical-equipment": "medical-equipment",
    "/medical-treatments": "medical-treatments",
    "/surgeries": "surgeries",
    "/home-care": "home-care",
    "/nursing-care": "nursing-care",
  };

  // Map section IDs to URL paths
  const sectionToPathMap = {
    profile: "/profile-sidebar",
    "family-members": "/family-members",
    "doctor-list": "/doctor-list",
    favourites: "/my-favourites",
    "ticket-raised": "/ticket-raised",
    myorders: "/myorders",
    myreports: "/my-reports",
    "my-enquiries": "/my-enquiries",
    AppointmentsOrders: "/my-appointments",
    "my-consultations": "/my-consultations",
    "rental-booking": "/rental-booking",
    notifications: "/notifications",
    "my-transactions": "/my-transactions",
    // "enquery-appointments": "/enquery-appointments",
    wallet: "/wallet",
    "manage-address": "/manage-address",
    "ambulance-booking": "/ambulance-booking",
    reviews: "/reviews",
    referals: "/referals",
    "my-orders": "/my-orders",
    labtest: "/labtest",
    surgeries: "/surgeries",
    "home-care": "/home-care",
    "nursing-care": "/nursing-care",
  };

  const activeSection = pathToSectionMap[location.pathname] || "profile";

  const handleLogout = async (e) => {
    e.preventDefault();
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;
    try {
      const token = localStorage.getItem("medicomparestoken");
      if (token) {
        await axiosUserInstance.post(
          "auth/logout",
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (error) {
      toast.error("Logout API error:", error);
    } finally {
      localStorage.removeItem("cart");
      localStorage.removeItem("pharmacyCart");
      localStorage.removeItem("medicomparestoken");
      localStorage.removeItem("fcmToken");
      localStorage.removeItem("compareItems");
      window.dispatchEvent(new Event("cartUpdated"));
      navigate("/");
    }
  };

  const handleSectionChange = (section, e) => {
    e.preventDefault();
    const path = sectionToPathMap[section];
    if (path) navigate(path);
  };

  useEffect(() => { fetchProfile(); }, []);

  useEffect(() => {
    document.body.style.overflow = isMobileDrawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isMobileDrawerOpen]);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [location.pathname]);

  const fetchProfile = async () => {
    const token = localStorage.getItem("medicomparestoken");
    try {
      const res = await axiosUserInstance.get("profile", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = res?.data?.data?.user || {};
      if (userData.files && userData.files.length > 0) {
        userData.image = userData.files[0];
      }
      setProfile(userData);
    } catch (err) {
      // Profile fetch error
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    if (selectedFile) {
      const previewUrl = URL.createObjectURL(selectedFile);
      setProfile({ ...profile, image: previewUrl });
      const token = localStorage.getItem("medicomparestoken");
      const dataArray = new FormData();
      dataArray.append("last_name", profile.last_name);
      dataArray.append("first_name", profile.first_name);
      dataArray.append("email", profile.email);
      dataArray.append("phone", profile.phone);
      dataArray.append("gender", profile.gender);
      dataArray.append("age", profile.age);
      dataArray.append("medical_conditions", profile.medical_conditions);
      dataArray.append("image", selectedFile);
      try {
        await axiosUserInstance.post("profile/update", dataArray, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Profile image updated successfully!");
        window.location.reload();
        setFile(null);
      } catch (error) {
        toast.error("An error occurred while updating image. Please try again.");
        fetchProfile();
      }
    }
  };

  const HomeNavigate = () => null;

  // Reusable Sidebar Content Component
  const SidebarContent = ({ onItemClick }) => (
    <>
      {/* Profile Header Section */}
      <div
        className="widget-profile pro-widget-content relative overflow-hidden rounded-sm"
        style={{
          background: "linear-gradient(135deg, #fbfafd 0%, #f5f0ff 100%)",
          padding: isMobile ? "16px" : "18px 16px",
          border: "1px solid #e9e4f5",
        }}
      >
        {/* Profile Info */}
        <div className="profile-info-widget relative flex items-center gap-3.5 text-left">
          {/* Avatar */}
          <div className="profile-avatar-container relative inline-block mb-0">
            <Link to="/profile-sidebar" className="block" onClick={onItemClick}>
              {profile?.image ? (
                <img
                  className="avatar-img rounded-full shadow-md block mx-auto"
                  src={
                    profile.image.startsWith("blob:")
                      ? profile.image
                      : getImageUrl(profile.image)
                  }
                  loading="lazy"
                  alt={profile.first_name}
                  title={profile.first_name}
                  style={{
                    width: isMobile ? "64px" : "72px",
                    height: isMobile ? "64px" : "72px",
                    objectFit: "cover",
                    border: "2.5px solid #321961",
                    boxShadow: "0 4px 15px rgba(128,89,202,0.12)",
                  }}
                />
              ) : (
                <div
                  className="avatar-placeholder rounded-full flex items-center justify-center shadow-md mx-auto"
                  style={{
                    width: isMobile ? "64px" : "72px",
                    height: isMobile ? "64px" : "72px",
                    background: "linear-gradient(135deg, #321961 0%, #9b5dff 100%)",
                    color: "#ffffff",
                    fontWeight: "700",
                    fontSize: isMobile ? "24px" : "28px",
                    textTransform: "uppercase",
                    border: "2.5px solid #321961",
                    boxShadow: "0 4px 15px rgba(128,89,202,0.12)",
                  }}
                  title={profile?.first_name}
                >
                  {profile?.first_name?.charAt(0)}
                </div>
              )}
            </Link>

            {/* Camera edit button */}
            <label
              htmlFor="sidebar-image-upload"
              className="avatar-edit-btn absolute flex items-center justify-center rounded-full cursor-pointer transition-all duration-300 z-10"
              style={{
                bottom: "0px",
                right: "-2px",
                width: "22px",
                height: "22px",
                backgroundColor: "white",
                color: "#321961",
                fontSize: "10px",
                border: "1.5px solid #321961",
                boxShadow: "0 3px 8px rgba(0,0,0,0.2)",
              }}
              title="Update profile picture"
            >
              <i className="fa-solid fa-camera" />
            </label>

            <input
              id="sidebar-image-upload"
              type="file"
              name="image"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Profile Details */}
          <div className="profile-det-info min-w-0 flex-1">
            <h3
              className="m-0 truncate"
              style={{
                fontSize: isMobile ? "16px" : "16px",
                fontWeight: "600",
                color: "#1e1b4b",
                letterSpacing: "-0.2px",
              }}
            >
              <Link
                to="/profile-sidebar"
                onClick={onItemClick}
                style={{ color: "#1e1b4b", textDecoration: "none" }}
              >
                {profile?.first_name?.charAt(0).toUpperCase() +
                  profile?.first_name?.slice(1)}{" "}
                ({profile?.custId})
              </Link>
            </h3>

            {/* Email badge */}
            <div className="profile-email-badge mt-1 flex justify-start">
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-[18px] max-w-full"
                style={{
                  backgroundColor: "rgba(128,89,202,0.06)",
                  color: "#321961",
                  fontWeight: "500",
                  fontSize: isMobile ? "11px" : "12px",
                  border: "1px solid rgba(128,89,202,0.12)",
                }}
              >
                <i className="fa-solid fa-envelope mr-1.5" style={{ fontSize: "10px" }} />
                <small className="truncate" style={{ maxWidth: isMobile ? "140px" : "170px" }}>
                  {profile?.email}
                </small>
              </span>
            </div>

            {/* Status */}
            <div className="profile-status mt-1 flex items-center justify-start">
              <span
                className="inline-flex items-center"
                style={{ color: "#6b7280", fontSize: "11px", fontWeight: "500" }}
              >
                <i
                  className="fa-solid fa-circle mr-1"
                  style={{ fontSize: "6px", color: "#4cd964", animation: "pulse 2s infinite" }}
                />
                Active Now
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="dashboard-widget mt-4 overflow-hidden">
        <nav className="dashboard-menu">
          <ul className="list-none p-0 m-0 flex flex-col gap-1">
            {[
              { id: "my-orders", label: "My Orders", icon: "isax isax-bag" },
              { id: "AppointmentsOrders", label: "Appointments", icon: "isax isax-calendar-2" },
              { id: "rental-booking", label: "Rental Booking", icon: "isax isax-box" },
              { id: "ambulance-booking", label: "Ambulance Booking", icon: "isax isax-truck-fast" },
              { id: "profile", label: "My Profile", icon: "isax isax-profile-circle" },
              { id: "family-members", label: "Manage Family Members", icon: "isax isax-user" },
              { id: "myreports", label: "My Reports", icon: "isax isax-document" },
              { id: "my-enquiries", label: "My Enquiries", icon: "isax isax-message-question" },
              { id: "my-consultations", label: "My Consultations", icon: "isax isax-message-question" },
              { id: "favourites", label: "My Favourites", icon: "isax isax-heart" },
              { id: "my-transactions", label: "My Transactions", icon: "isax isax-card-pos" },
              { id: "ticket-raised", label: "Ticket Raised", icon: "isax isax-ticket" },
              { id: "notifications", label: "Notifications", icon: "isax isax-notification" },
              { id: "wallet", label: "Wallet", icon: "isax isax-wallet-3" },
              { id: "manage-address", label: "Addresses", icon: "isax isax-location" },
              { id: "reviews", label: "Reviews", icon: "isax isax-star" },
              { id: "referals", label: "Refer & Earn", icon: "isax isax-user-add" },
            ].map((item) => {
              const itemPath = sectionToPathMap[item.id];
              const isActive = activeSection === item.id;
              return (
                <li key={item.id} className="nav-item">
                  <Link
                    to={itemPath || "#"}
                    onClick={(e) => {
                      handleSectionChange(item.id, e);
                      if (onItemClick) onItemClick();
                    }}
                    className="flex items-center py-2.5 px-3.5 no-underline rounded-xl transition-all duration-200 group"
                    style={{
                      color: isActive ? "#321961" : "#4a5568",
                      backgroundColor: isActive ? "rgba(128,89,202,0.08)" : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "rgba(128,89,202,0.04)";
                        e.currentTarget.style.color = "#321961";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = "transparent";
                        e.currentTarget.style.color = "#4a5568";
                      }
                    }}
                  >
                    <i
                      className={`${item.icon} mr-3 transition-colors duration-200 ${isActive ? "!text-[#321961]" : "!text-slate-400 group-hover:!text-[#321961]"}`}
                      style={{ fontSize: "18px", width: "22px" }}
                    />
                    <span
                      className="text-[13.5px] flex-1 transition-all duration-200"
                      style={{ fontWeight: isActive ? "600" : "500" }}
                    >
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}

            {/* Logout */}
            <li className="nav-item border-t border-[#f1effc] mt-2 pt-2">
              <a
                href="#"
                onClick={(e) => {
                  handleLogout(e);
                  if (onItemClick) onItemClick();
                }}
                className="flex items-center py-2.5 px-3.5 no-underline rounded-xl !text-[#ff4757] cursor-pointer transition-all duration-200 hover:bg-[#fff0f2]"
              >
                <i
                  className="isax isax-logout mr-3 !text-[#ff4757]"
                  style={{ fontSize: "18px", width: "22px" }}
                />
                <span className="text-[13.5px] font-semibold">Logout</span>
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );

  return (
    <div className="main-wrapper">
      <Home2Header />

      {/* Mobile Drawer Overlay */}
      {isMobileDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-[99999] transition-opacity duration-300"
          onClick={() => setIsMobileDrawerOpen(false)}
        />
      )}

      {/* Mobile Side Drawer */}
      <div
        className={`lg:hidden mobile-profile-drawer ${isMobileDrawerOpen ? "open" : ""
          } fixed top-0 left-0 w-[280px] max-w-[85vw] h-screen bg-white z-[100000] overflow-y-auto shadow-[2px_0_10px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
        style={{
          transform: isMobileDrawerOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        {/* Drawer Header */}
        <div
          className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
          style={{
            background: "linear-gradient(135deg, #321961 0%, #9b5dff 100%)",
            borderBottom: "1px solid rgba(255,255,255,0.15)",
          }}
        >
          <div className="flex items-center gap-2">
            <i className="fa-solid fa-bars-staggered text-white" style={{ fontSize: "16px" }} />
            <h5 className="m-0 text-[17px] font-semibold text-white">My Account</h5>
          </div>
          <button
            onClick={() => setIsMobileDrawerOpen(false)}
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: "rgba(255,255,255,0.15)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "white",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.3)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.15)";
            }}
            aria-label="Close menu"
          >
            <i className="fa-solid fa-times" style={{ fontSize: "14px" }}></i>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="p-4">
          <SidebarContent onItemClick={() => setIsMobileDrawerOpen(false)} />
        </div>
      </div>

      {/* Page Content */}
      <div className="content doctor-content !pb-12 !pt-4 lg:!pt-6 !px-4 md:!px-6 !bg-white min-h-[calc(100vh-200px)]">
        <div className="max-w-[1400px] mx-auto w-full">
          <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
            {/* Sidebar — desktop only */}
            <div className="hidden lg:block w-[300px] shrink-0 sticky top-[calc(var(--header-height,0px)+var(--nav-height,0px)+16px)]">
              <div className="profile-sidebar doctor-sidebar profile-sidebar-new bg-white rounded-sm shadow-[0_10px_30px_rgba(128,89,202,0.06)] border border-[#f1effc] p-3 overflow-hidden">
                <SidebarContent />
              </div>
            </div>

            {/* Main Content */}
            <div className="w-full flex-1">
              {activeSection === "profile" && (
                <Profile onProfileUpdate={fetchProfile} HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "favourites" && (
                <Favourites HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "family-members" && (
                <FamilyMembers HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "myreports" && (
                <MyReports HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "reviews" && (
                <Reviews HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "referals" && (
                <Referral HomeNavigate={HomeNavigate} profile={profile} />
              )}
              {activeSection === "notifications" && (
                <Notifications HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "my-transactions" && (
                <Transactions HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "wallet" && (
                <Wallet HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "my-enquiries" && (
                <Leads HomeNavigate={HomeNavigate} />
              )}
              {/* {activeSection === "enquery-appointments" && (
                <Appoitments HomeNavigate={HomeNavigate} />
              )} */}
              {activeSection === "AppointmentsOrders" && (
                <AppointmentsOrders
                  HomeNavigate={HomeNavigate}
                  ServiceTabs={ServiceTabs}
                />
              )}
              {activeSection === "my-consultations" && (
                <Consultation HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "ticket-raised" && (
                <TicketIssues HomeNavigate={HomeNavigate} />
              )}
              {activeSection === "ambulance-booking" && (
                <AmbulanceBooking
                  HomeNavigate={HomeNavigate}
                  ServiceTabs={ServiceTabs}
                />
              )}
              {activeSection === "rental-booking" && (
                <RentalBooking
                  HomeNavigate={HomeNavigate}
                  ServiceTabs={ServiceTabs}
                />
              )}
              {activeSection === "my-orders" && (
                <CartAndBookingOrders
                  HomeNavigate={HomeNavigate}
                  ServiceTabs={ServiceTabs}
                />
              )}
              {activeSection === "manage-address" && (
                <Address HomeNavigate={HomeNavigate} />
              )}
            </div>
          </div>
        </div>
      </div>


      {/* Mobile Floating Menu Button */}
      <button
        onClick={() => setIsMobileDrawerOpen(true)}
        className="lg:hidden fixed bottom-20 right-6 w-12 h-12 !rounded-[20px] bg-gradient-to-br from-[#321961] to-[#9b5dff] text-white border border-white/20 flex items-center justify-center cursor-pointer shadow-[0_8px_20px_rgba(128,89,202,0.35)] transition-all duration-300 z-[99999] hover:scale-105 active:scale-95"
        aria-label="Open menu"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="16" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      <Footer />
    </div>
  );
};

export default ProfileSideBar;
