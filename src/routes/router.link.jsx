import { Route } from "react-router";
import Home2 from "../pages/home/home-4";
// Authnetication
import Login from "../pages/Authentication/login";
import ForgotPassword from "../pages/Authentication/forgot-password";
import AddmoreInfo from "../pages/Authentication/addmore-Info";
import EmailOtp from "../pages/Authentication/email-otp";
// pharmacy
import ProductDescription from "../pages/products/productdescription";
import BookinProcess from "../pages/products/bookingprocess";
import { Cart as ProductCheckout } from "../pages/products/productcheckout2";
import { LabTestCheckout } from "../pages/products/labtestcheckout";
import Payoutsuccess from "../pages/products/payoutsuccess";
import ServiceDetails from "../pages/products/servicedetails";
// Policies
import Policiess from "../pages/general/Policiess";
import ErrorPage from "../pages/general/ErrorPage";
// PROFILE
import ProfileSidebar from "../pages/profile/profilesidebar/index"; //side bar
import VendorProfile from "../pages/products/vendorprofiles";

// View Pages
import MedicineComparePage from "../pages/products/MedicineComparePage";
import CompareView from "../pages/products/package-view";
import ViewAllCategories from "../pages/products/viewallcategories";
import ViewAllPackages from "../pages/products/viewallpackages";
import ViewAllPartners from "../pages/products/viewallpartners";
import ProductsData from "../pages/products/productsdata";
import SearchOverlay from "../pages/services/Search";
import MobileCategories from "../pages/services/MobileCategories";
import AmbulanceCheckOut from "../pages/products/AmbulanceCheckOut";
import Contact from "../pages/general/Contact";
import BlogDetails from "../pages/home/home-4/BlogDetails";
import Manufactures from "../pages/products/Manufactures";
import RentalBookingProcess from "../pages/products/RentalBookingProcess";
import Compositions from "../pages/products/Compositions";
import LabTestPackageDetails from "../pages/products/LabTestPackageDetails";
import RelatedProductsView from "../pages/products/RelatedProductsView";
import BlogList from "../pages/home/home-4/BlogList";
import PrescriptionUploadPage from "../pages/products/PrescriptionUploadPage";

export const publicRoutes = [
  {
    path: "/",
    element: <Home2 />, // Main Home
    route: Route,
  },
  {
    path: "/prescription-upload",
    element: <PrescriptionUploadPage />,
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
