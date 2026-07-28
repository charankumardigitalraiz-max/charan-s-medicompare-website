import { Link, useParams } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k";
import Footer from "../../../components/home/Footer-f";
import { useEffect, useState } from "react";
import { axiosCommonInstance } from "../../../Apiservice";
import toast from "react-hot-toast";
import SEOHelmet from "../../../components/SEOHelmet";

const Terms = () => {
  const { policies } = useParams();
  const [pageData, setPageData] = useState(null);

  const seoPageMapping = {
    "terms-and-conditions": "terms",
    "privacy-policy": "privacy",
    "refund-policy": "refund",
  };
  const seoPage = seoPageMapping[policies] || policies;

  const getPolicyDetails = async () => {
    try {
      const response = await axiosCommonInstance.get(`pagedetails/${policies}`);
      const singlePage = response.data?.data?.page || null;
      setPageData(singlePage);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong"
      );
    }
  };

  useEffect(() => {
    getPolicyDetails();
  }, [policies]);

  return (
    <div key={policies}>
      <SEOHelmet page={seoPage} />
      <Home2Header />

      <div
        className="breadcrumb-bar"
        style={{
          backgroundImage: "url('/assets/Medicompares Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "96px 0 36px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="row align-items-center inner-banner">
            <div className="col-md-12 col-12 text-center">
              <nav aria-label="breadcrumb" className="page-breadcrumb">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/">
                      <i className="isax isax-home-15" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item active">
                    {pageData?.title || "Loading..."}
                  </li>
                </ol>

                <h2 className="breadcrumb-title">
                  {pageData?.title || "Loading..."}
                </h2>
              </nav>
            </div>
          </div>
        </div>
      </div>

      <section className="terms-section" style={{ background: "#f8fafc", padding: "50px 0" }}>
        <div className="container" style={{ maxWidth: "960px" }}>
          <div className="card" style={{
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 20px rgba(15, 23, 42, 0.03)",
            padding: "40px",
          }}>
            <style>{`
              .pd-desc-text {
                font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 15px !important;
                line-height: 1.6 !important;
                color: #64748b !important;
                text-align: left !important;
                font-weight: 400 !important;
              }
              .pd-desc-text * {
                font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                color: inherit !important;
                font-size: inherit !important;
                line-height: inherit !important;
                font-weight: inherit !important;
              }
              .pd-desc-text h1, .pd-desc-text h1 * {
                font-size: 26px !important;
                color: #0f172a !important;
                font-weight: 600 !important;
                margin-top: 28px !important;
                margin-bottom: 12px !important;
                line-height: 1.25 !important;
              }
              .pd-desc-text h2, .pd-desc-text h2 * {
                font-size: 20px !important;
                color: #0f172a !important;
                font-weight: 600 !important;
                margin-top: 28px !important;
                margin-bottom: 12px !important;
                line-height: 1.25 !important;
                border-bottom: 1px solid #f1f5f9 !important;
                padding-bottom: 8px !important;
              }
              .pd-desc-text h3, .pd-desc-text h3 * {
                font-size: 17px !important;
                color: #0f172a !important;
                font-weight: 600 !important;
                margin-top: 24px !important;
                margin-bottom: 10px !important;
                line-height: 1.25 !important;
              }
              .pd-desc-text p {
                font-size: 15px !important;
                margin-bottom: 16px !important;
                color: #64748b !important;
                line-height: 1.6 !important;
                font-weight: 400 !important;
              }
              .pd-desc-text ul, .pd-desc-text ol {
                padding-left: 20px !important;
                margin-bottom: 16px !important;
              }
              .pd-desc-text ul {
                list-style-type: disc !important;
              }
              .pd-desc-text ol {
                list-style-type: decimal !important;
              }
              .pd-desc-text li {
                font-size: 15px !important;
                margin-bottom: 8px !important;
                padding-left: 4px !important;
                color: #64748b !important;
                line-height: 1.6 !important;
                font-weight: 400 !important;
              }
              .pd-desc-text strong, .pd-desc-text b, .pd-desc-text strong *, .pd-desc-text b * {
                color: #0f172a !important;
                font-weight: 600 !important;
              }
              .pd-desc-text a {
                color: #8059ca !important;
                text-decoration: none !important;
                font-weight: 500 !important;
                transition: color 0.2s ease !important;
              }
              .pd-desc-text a:hover {
                color: #6d4db8 !important;
                text-decoration: underline !important;
              }
            `}</style>
            <div className="terms-content pb-0">
              <div
                className="pd-desc-text"
                dangerouslySetInnerHTML={{ __html: pageData?.content || "No content available." }}
              />
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
