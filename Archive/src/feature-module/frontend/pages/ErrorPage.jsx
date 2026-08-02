import { Link } from "react-router-dom";

const ErrorPage = () => {
  return (
    <div className="container-fluid p-0">
      <div className="w-100 overflow-hidden position-relative flex-wrap d-block vh-100">
        <div className="row justify-content-center align-items-center vh-100 overflow-auto flex-wrap ">
          <div className="col-lg-8 col-md-12 text-center">
            <div className="error-info">
              <div className="error-404-img">
                <img
                  src="/assets/404error.png"
                  className="img-fluid bg-white errorimage"
                  alt="error-404-image"
                  title="error image"
                />
                <div className="error-content">
                  <h5 className="mb-2">Oops! That Page Can’t Be Found.</h5>
                  <p>The page you are looking for was never existed.</p>
                  <Link to="/" className="btn btn-primary-gradient btn-sm">
                    <i className="fas fa-home me-1"></i> Back to Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorPage;
