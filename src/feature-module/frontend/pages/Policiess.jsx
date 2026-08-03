import { Link, useParams } from "react-router-dom";
import Home2Header from "../../../components/home/Header-k";
import Footer from "../../../components/home/Footer-f";
import { useEffect, useState } from "react";
import { axiosCommonInstance } from "../../../Apiservice";
import toast from "react-hot-toast";
import SEOHelmet from "../../../components/SEOHelmet";
import BackButton from "../../../components/ui/BackButton.jsx";

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

      {/* Breadcrumb Banner */}
      <div
        className="relative w-full overflow-hidden py-10 md:py-12 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/Medicompares Background.png')" }}
      >
        <div className="relative z-10 max-w-[1400px] mx-auto px-4">
          <div className="absolute left-4 top-0">
            <BackButton className="z-20" />
          </div>
          <h2 className="!text-2xl md:!text-3xl !font-semibold !text-[#0a2540] text-center m-0 w-full pt-6">
            {pageData?.title || "Loading..."}
          </h2>
        </div>
      </div>

      {/* Policy Details Section */}
      <section className="bg-[#f8fafc] py-12 px-4">
        <div className="max-w-[960px] mx-auto">
          <div className="bg-white rounded-[16px] border border-gray-200 shadow-[0_4px_20px_rgba(15,23,42,0.03)] p-6 md:p-10">
            <div
              className="text-gray-600 leading-relaxed !text-[14px] prose max-w-none prose-slate prose-headings:!text-[#0f172a] prose-headings:!font-semibold prose-h1:!text-[18px] prose-h1:!font-bold prose-h2:!text-[19px] prose-h2:!font-bold prose-h3:!text-[14px] prose-a:text-[#321961] hover:prose-a:text-[#6d4db8] prose-a:no-underline hover:prose-a:underline prose-p:my-0.5 prose-p:leading-normal prose-li:my-0.5 prose-ul:list-disc prose-ol:list-decimal [&_h2_*]:!text-[19px] [&_h2_*]:!font-bold [&_h1_*]:!text-[18px] [&_h1_*]:!font-bold [&_h3_*]:!text-[14px]"
              dangerouslySetInnerHTML={{ __html: pageData?.content || "No content available." }}
            />
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Terms;
