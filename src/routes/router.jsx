import { Route, Routes } from "react-router-dom";
import { authRoutes, publicRoutes } from "./router.link";
import Feature from "./feature";
import AuthFeature from "./authFeature";

const ALLRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<Feature />}>
        {publicRoutes.map((route, idx) => (
          <Route path={route.path} element={route.element} key={idx} />
        ))}
      </Route>

      {/* Auth Routes */}
      <Route element={<AuthFeature />}>
        {authRoutes.map((route, idx) => (
          <Route path={route.path} element={route.element} key={idx} />
        ))}
      </Route>
    </Routes>
  );
};

export default ALLRoutes;
