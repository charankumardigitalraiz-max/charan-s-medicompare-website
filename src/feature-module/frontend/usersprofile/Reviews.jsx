import React, { useState, useEffect } from "react";
import { Link, useNavigate, } from "react-router-dom";
import { useResponsive } from "../../../hooks/useResponsive";
import { toast } from "react-hot-toast";
import { axiosInstance } from "../../../Apiservice";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

// Styles migrated to Tailwind CSS

const Reviews = ({ HomeNavigate, BackButton }) => {
  const navigate = useNavigate();
  const { isMobile } = useResponsive();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const reviewsPerPage = 5;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await axiosInstance.get("rating/get", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("medicomparestoken")}`,
          },
        });

        if (response.data?.success) {
          setReviews(response.data.data || []);
        } else {
          throw new Error(response.data?.message || "Failed to fetch reviews");
        }
      } catch (err) {
        setError("Failed to load reviews. Please try again.");
        toast.error("Failed to load reviews");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, i) =>
        i < Math.floor(rating) ? (
          <FaStar key={i} className="text-[#FFD700] text-[14px]" />
        ) : i === Math.floor(rating) && rating % 1 >= 0.5 ? (
          <FaStarHalfAlt key={i} className="text-[#FFD700] text-[14px]" />
        ) : (
          <FaRegStar key={i} className="text-[#FFD700] text-[14px]" />
        ),
      );
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const renderReviewCard = (review, index) => {
    const userAvatar = review.user?.files?.[0];
    const userName = review.user
      ? `${review.user.first_name} ${review.user.last_name}`
      : "You";

    return (
      <div className="h-full flex flex-col justify-between m-0 p-5 rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)]">
        <div>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              {userAvatar ? (
                <img src={userAvatar} className="w-10 h-10 rounded-full object-cover" alt="User" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#8059ca] text-white flex items-center justify-center text-xl uppercase shrink-0">
                  {userName?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <div>
                {/* <span className="inline-block bg-[#e8f0fe] text-[#4c6ef5] text-[11px] py-1 px-2.5 rounded font-medium mb-1">You</span> */}
                <div className="font-semibold text-[14px] capitalize text-slate-800">
                  {review?.tablet?.name?.length > 80
                    ? review?.tablet?.name.slice(0, 80) + "..."
                    : review?.tablet?.name}
                </div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="flex gap-0.5 mb-1">{renderStars(review.rating)}</div>
              <div className="text-[11px] text-slate-400">{formatDate(review.createdAt)}</div>
            </div>
          </div>

          <div className="mt-3">
            <div>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                {review?.productreviewType && (
                  <span className="text-xs py-1 px-2.5 rounded-full inline-block bg-[#e6f9ed] text-[#0f9d58]">
                    {review.productreviewType}
                  </span>
                )}

                {review.tablet?.strength && (
                  <span className="text-xs py-1 px-2.5 rounded-full inline-block bg-slate-100 text-slate-600">
                    {review.tablet.strength}
                  </span>
                )}
              </div>
            </div>

            {review.review && (
              <p className="text-[13px] text-slate-600 mt-2.5 leading-relaxed bg-[#fcfcfc] p-2.5 rounded-lg border border-slate-100 m-0">
                {review.review}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto p-[15px]">
        <div className="text-center py-10">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-4 text-slate-500">
            Loading your reviews...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[1200px] mx-auto p-[15px]">
        <div className="text-center py-10 px-5 text-red-600">
          <i className="fas fa-exclamation-circle text-[36px] mb-4 text-red-600 block"></i>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="py-2 px-4 rounded-md bg-[#8059ca] hover:bg-[#6b1fe6] text-white border-none cursor-pointer text-[13px] font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const safeReviews = Array.isArray(reviews) ? reviews : [];
  const totalReviews = safeReviews.length;
  const indexOfLastReview = currentPage * reviewsPerPage;
  const indexOfFirstReview = indexOfLastReview - reviewsPerPage;
  const currentReviews = safeReviews.slice(
    indexOfFirstReview,
    indexOfLastReview,
  );
  const totalPages = Math.ceil(totalReviews / reviewsPerPage) || 0;

  const paginate = (pageNumber) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-[15px]">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-2 mb-2 border-b border-slate-100 mt-2">
        <div className="flex items-center gap-3.5">
          {HomeNavigate && <HomeNavigate />}
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#8059ca] flex items-center justify-center text-[20px] shrink-0 border border-purple-100/50 shadow-sm">
            <i className="fa-solid fa-comment-alt" />
          </div>

          {/* <div className="flex flex-col gap-1">
            <div className="m-0 text-[#0f172a] text-[18px] md:text-[20px] tracking-tight leading-none" style={{ fontWeight: 600 }}>
              My Reviews
            </div>
            <p className="text-slate-500 text-[12px] m-0 font-medium leading-none">
              View and manage all your product reviews
            </p>
          </div> */}


          <div className="flex flex-col gap-1">
            <div className="m-0 text-[#0f172a] font-medium text-[16px] md:text-[16px] tracking-tight leading-none" >
              My Reviews
            </div>
            <div className="text-slate-500 text-[12px] m-0 font-medium leading-none">
              View and manage all your product reviews
            </div>
          </div>

        </div>
      </div>

      <div className="row">
        {currentReviews.length > 0 ? (
          currentReviews.map((review, index) => (
            <div className="col-md-6 col-12 mb-4" key={index}>
              {renderReviewCard(review, index)}
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-10 px-5 text-slate-500">
            <i className="far fa-comment-alt text-[36px] text-slate-200 mb-3 block"></i>
            <h4 className="mb-2 text-slate-700 font-medium text-base">No Reviews Yet</h4>
            <p className="mb-4 text-sm text-slate-400">You haven't reviewed any products yet.</p>
          </div>
        )}
      </div>

      {totalReviews > reviewsPerPage && (
        <div className="pagination dashboard-pagination mt-4">
          <ul className="d-flex justify-content-center align-items-center gap-1">
            <li>
              <button
                className="page-link"
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <i className="fa-solid fa-chevron-left"></i>
              </button>
            </li>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <li key={number}>
                  <button
                    className={`page-link ${currentPage === number ? "active" : ""}`}
                    onClick={() => paginate(number)}
                  >
                    {number}
                  </button>
                </li>
              ),
            )}

            <li>
              <button
                className="page-link"
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                <i className="fa-solid fa-chevron-right"></i>
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default Reviews;