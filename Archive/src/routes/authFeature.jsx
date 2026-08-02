
import { Outlet } from "react-router";

const AuthFeature = () => {
  return (
    <div className="account-page">
      <Outlet/>
    </div>
  );
};

export default AuthFeature;
