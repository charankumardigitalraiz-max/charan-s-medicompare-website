import { Route } from "react-router";
import Home2 from "../feature-module/frontend/home/home-4";
// Authnetication
import Login from "../feature-module/frontend/Authentication/login/login";
import ForgotPassword from "../feature-module/frontend/Authentication/forgot-password";
import AddmoreInfo from "../feature-module/frontend/Authentication/addmore-Info";
import EmailOtp from "../feature-module/frontend/Authentication/email-otp";
// pharmacy
import ProductDescription from "../feature-module/frontend/pharmacy/productdescription";
import BookinProcess from "../feature-module/frontend/pharmacy/bookingprocess";
import { Cart as ProductCheckout } from "../feature-module/frontend/pharmacy/productcheckout";
import { LabTestCheckout } from "../feature-module/frontend/pharmacy/labtestcheckout";
import Payoutsuccess from "../feature-module/frontend/pharmacy/payoutsuccess";
import ServiceDetails from "../feature-module/frontend/pharmacy/servicedetails";
// Policies
import Policiess from "../feature-module/frontend/pages/Policiess";
import ErrorPage from "../feature-module/frontend/pages/ErrorPage";
// PROFILE
import ProfileSidebar from "../feature-module/frontend/usersprofile/profilesidebar/index"; //side bar
import VendorProfile from "../feature-module/frontend/pharmacy/vendorprofiles";

// View Pages
import MedicineComparePage from "../feature-module/frontend/pharmacy/MedicineComparePage";
import CompareView from "../feature-module/frontend/pharmacy/package-view";
import ViewAllCategories from "../feature-module/frontend/pharmacy/viewallcategories";
import ViewAllPackages from "../feature-module/frontend/pharmacy/viewallpackages";
import ViewAllPartners from "../feature-module/frontend/pharmacy/viewallpartners";
import ProductsData from "../feature-module/frontend/pharmacy/productsdata";
import SearchOverlay from "../feature-module/frontend/healthcare/Search";
import MobileCategories from "../feature-module/frontend/healthcare/MobileCategories";
import AmbulanceCheckOut from "../feature-module/frontend/healthcare/AmbulanceCheckOut";
import Contact from "../feature-module/frontend/pages/Contact";
import BlogDetails from "../feature-module/frontend/home/home-4/BlogDetails";
import Manufactures from "../feature-module/frontend/pharmacy/products-components/Manufactures";
import RentalBookingProcess from "../feature-module/frontend/pharmacy/RentalBookingProcess";
import Compositions from "../feature-module/frontend/pharmacy/products-components/Compositions";
import LabTestPackageDetails from "../feature-module/frontend/pharmacy/LabTestPackageDetails";
import RelatedProductsView from "../feature-module/frontend/pharmacy/RelatedProductsView";
import BlogList from "../feature-module/frontend/home/home-4/BlogList";
export const publicRoutes = [
  {
    path: "/",
    element: <Home2 />, // Main Home
    route: Route,
  },

  //  service Details
  {
    path: "/:service",
    element: <ServiceDetails />, // using useParams
    route: Route,
  },

  {
    path: "/:service/:id",
    element: <ProductsData />,
    route: Route,
  },

  //  DESCRIPTION
  {
    path: "/:service/:categories/:productId",
    element: <ProductDescription />,
    route: Route,
  },


  {
    path: "/:service/:categories/:productId/compare",
    element: <MedicineComparePage />,
    route: Route,
  },
  {
    path: "/booking-process/:type?",
    element: <BookinProcess />,
    route: Route,
  },
  {
    path: "/rental-booking-process",
    element: <RentalBookingProcess />,
    route: Route,
  },
  {
    path: "/manufacture/:slugAndId",
    element: <Manufactures />,
    route: Route,
  },
  {
    path: "/composition/:compId",
    element: <Compositions />,
    route: Route,
  },
  {
    path: "/search/:service",
    element: <SearchOverlay />,
    route: Route,
  },
  {
    path: "/cart",
    element: <ProductCheckout />,
    route: Route,
  },
  {
    path: "/labtest-checkout",
    element: <LabTestCheckout />,
    route: Route,
  },
  {
    path: "/ambulance-checkout",
    element: <AmbulanceCheckOut />,
    route: Route,
  },

  {
    path: "/payment-success?",
    element: <Payoutsuccess />,
    route: Route,
  },
  {
    path: "/policies/:policies",
    element: <Policiess />,
    route: Route,
  },

  {
    path: "/package-view",
    element: <CompareView />,
    route: Route,
  },

  // Lab test package details
  {
    path: "/lab-package/:packageId",
    element: <LabTestPackageDetails />,
    route: Route,
  },

  // view all categories
  {
    path: "/view-all-categories/:service",
    element: <ViewAllCategories />,
    route: Route,
  },

  // view all packages
  {
    path: "/view-all-packages",
    element: <ViewAllPackages />,
    route: Route,
  },


  // view all vendors || partners
  {
    path: "/partners/:service",
    element: <ViewAllPartners />,
    route: Route,
  },
  {
    path: "/partners",
    element: <ViewAllPartners />,
    route: Route,
  },

  // sidebars - All profile routes use ProfileSidebar with sidebar
  {
    path: "/profile-sidebar",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/my-favourites",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/family-members",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/reviews",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/referals",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/my-transactions",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/wallet",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/doctor-list",
    element: <ProfileSidebar />,
    route: Route,
  },
  // {
  //   path: "/myorders",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  {
    path: "/my-orders",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/blogs",
    element: <BlogList />,
    route: Route,
  },
  // {
  //   path: "/labtest",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  // {
  //   path: "/dental",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  // {
  //   path: "/diagnostics",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  // {
  //   path: "/medical-equipment",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  // {
  //   path: "/medical-treatments",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  // {
  //   path: "/surgeries",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  // {
  //   path: "/home-care",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  // {
  //   path: "/nursing-care",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  {
    path: "/my-reports",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/my-appointments",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/enquery-appointments",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/my-enquiries",
    element: <ProfileSidebar />,
    route: Route,
  },
  // {
  //   path: "/my-appoitments",
  //   element: <ProfileSidebar />,
  //   route: Route,
  // },
  {
    path: "/my-consultations",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/rental-booking",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/notifications",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/ticket-raised",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/manage-address",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/ambulance-booking",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/rental-booking",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/user-reviews",
    element: <ProfileSidebar />,
    route: Route,
  },
  {
    path: "/vendor-profile/:vendorSlug",
    element: <VendorProfile />,
    route: Route,
  },

  {
    path: "/mobile-categories",
    element: <MobileCategories />,
    route: Route,
  },

  {
    path: "/contact-us",
    element: <Contact />,
    route: Route,
  },

  {
    path: "/blog-details/:slug",
    element: <BlogDetails />,
    route: Route,
  },
  {
    path: "/relatedProducts/:slug",
    element: <RelatedProductsView />,
    route: Route,
  },

  //  Catch-all route
  {
    path: "*",
    element: <ErrorPage />,
    route: Route,
  },
];

export const authRoutes = [
  {
    path: "/login",
    element: <Login />,
    route: Route,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
    route: Route,
  },
  {
    path: "/addmoreInfo",
    element: <AddmoreInfo />,
    route: Route,
  },
  {
    path: "/email-otp",
    element: <EmailOtp />,
    route: Route,
  },
];
