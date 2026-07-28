import React, { useEffect, useState, useMemo } from "react";
import { useResponsive } from "../../../../hooks";
import { format } from "date-fns";
import { getImageUrl } from "../../../../utils/index";
import { Link } from "react-router";

const STAR_LEVELS = [5, 4, 3, 2, 1];

const renderStars = (rating = 0, className = "") => {
  const rounded = Math.round(rating);
  return (
    <div className={`cr-stars ${className}`} aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <i
          key={star}
          className={`fas fa-star ${star <= rounded ? "cr-star-filled" : "cr-star-empty"}`}
        />
      ))}
    </div>
  );
};

const Reviews = ({ reviews = [] }) => {
  const { isMobile } = useResponsive();
  const [loading, setLoading] = useState(true);
  const [allReviews, setAllReviews] = useState(reviews);
  const [visibleReviews, setVisibleReviews] = useState(4);

  useEffect(() => {
    if (reviews?.length > 0) {
      setAllReviews(reviews);
    } else {
      setAllReviews([]);
    }
    setLoading(false);
  }, [reviews]);

  const ratingStats = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let totalRating = 0;

    allReviews.forEach((review) => {
      const rating = Math.min(5, Math.max(1, Math.round(review.rating || 0)));
      counts[rating] = (counts[rating] || 0) + 1;
      totalRating += review.rating || 0;
    });

    const total = allReviews.length;
    const average = total > 0 ? totalRating / total : 0;

    return { counts, total, average };
  }, [allReviews]);

  const handleLoadMore = () => {
    setVisibleReviews((prev) => prev + 6);
  };

  const getInitials = (name) =>
    name?.charAt(0)?.toUpperCase() || "U";

  return (
    <section className="cr-section product-reviews-section mt-5">
      <div className="cr-section-header rp-section-header">
        <div className="cr-section-title-wrap rp-section-title-wrap">
          <span className="cr-section-accent rp-section-accent" aria-hidden="true" />
          <div
            style={{
              fontSize: isMobile ? "20px" : "20px",
              fontWeight: 500,
              color: "#0f172a",
              margin: 0,
            }}
          >
            Customer Reviews
          </div>
          {!loading && allReviews.length > 0 && (
            <span className="cr-section-count rp-section-count">
              {allReviews.length}
            </span>
          )}
        </div>
      </div>

      <div className="cr-layout product-reviews-container">
        <div className="cr-main product-reviews-content">
          {!loading && allReviews.length > 0 && (
            <div className="cr-summary">
              <div className="cr-summary-score">
                <div className="cr-summary-number">
                  {ratingStats.average.toFixed(1)}
                </div>
                {renderStars(ratingStats.average, "cr-stars--lg")}
                <p className="cr-summary-based">
                  Based on {ratingStats.total}{" "}
                  {ratingStats.total === 1 ? "review" : "reviews"}
                </p>
              </div>

              <div className="cr-summary-bars">
                {STAR_LEVELS.map((star) => {
                  const count = ratingStats.counts[star] || 0;
                  const percent =
                    ratingStats.total > 0
                      ? Math.round((count / ratingStats.total) * 100)
                      : 0;

                  return (
                    <div key={star} className="cr-bar-row">
                      <span className="cr-bar-label">{star}</span>
                      <i className="fas fa-star cr-bar-star" aria-hidden="true" />
                      <div className="cr-bar-track">
                        <div
                          className="cr-bar-fill"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                      <span className="cr-bar-percent">{percent}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="product-reviews-list cr-review-list">
            {loading ? (
              [1, 2, 3, 4].map((item) => (
                  <div key={item} className="cr-skeleton-card">
                    <div className="cr-skeleton-top">
                      <div className="cr-skeleton-avatar" />
                      <div className="cr-skeleton-meta">
                        <div className="cr-skeleton-line cr-skeleton-line--short" />
                        <div className="cr-skeleton-line" />
                      </div>
                    </div>
                    <div className="cr-skeleton-stars" />
                    <div className="cr-skeleton-line" />
                    <div className="cr-skeleton-line cr-skeleton-line--medium" />
                  </div>
                ))
            ) : allReviews.length === 0 ? (
              <div className="product-reviews-empty cr-review-list-full">
                <div className="cr-empty-card">
                  <div className="cr-empty-icon">
                    <i className="far fa-comment-dots" aria-hidden="true" />
                  </div>
                  <div className="cr-empty-title">No reviews yet</div>
                  <p className="cr-empty-text">
                    Be the first to share your experience with this product
                    after your purchase.
                  </p>
                  <div className="cr-empty-stars" aria-hidden="true">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <i key={i} className="far fa-star" />
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              allReviews.slice(0, visibleReviews).map((review) => {
                const reviewDate = review.createdAt
                  ? new Date(review.createdAt)
                  : new Date();
                const formattedDate = format(reviewDate, "dd MMM yyyy");
                const userName =
                  review.userId?.first_name?.trim() || "Customer";

                return (
                  <article key={review._id} className="cr-review-card">
                    <div className="cr-review-card-top">
                      <div className="cr-reviewer">
                        <div className="cr-reviewer-avatar">
                          {review.userId?.files?.length > 0 ? (
                            <img
                              src={getImageUrl(review.userId.files[0])}
                              alt={userName}
                            />
                          ) : (
                            getInitials(userName)
                          )}
                        </div>
                        <div className="cr-reviewer-info">
                          <span className="cr-reviewer-name">{userName}</span>
                          <span className="cr-review-date">{formattedDate}</span>
                        </div>
                      </div>
                      {renderStars(review.rating || 0)}
                    </div>

                    {(review.userId?.email_verified ||
                      review.is_verified_purchase) && (
                      <span className="cr-verified-badge">
                        <i className="fas fa-check-circle" aria-hidden="true" />
                        {review.is_verified_purchase
                          ? "Verified Purchase"
                          : "Verified Customer"}
                      </span>
                    )}

                    {review.title && (
                      <div className="cr-review-title">{review.title}</div>
                    )}

                    {review.review?.trim() && (
                      <p className="cr-review-body">{review.review}</p>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {allReviews.length > visibleReviews && (
            <div className="cr-load-more-wrap">
              <button
                type="button"
                onClick={handleLoadMore}
                className="cr-load-more-btn"
              >
                Show more reviews
                <i className="fas fa-chevron-down" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {!isMobile && (
          <aside className="product-reviews-sidebar cr-sidebar">
            <div className="cr-side-card cr-side-card--primary">
              <div className="cr-side-card-icon">
                <i className="fas fa-tags" aria-hidden="true" />
              </div>
              <div className="cr-side-card-title">Special Offer</div>
              <p className="cr-side-card-text">
                Get 20% off on your next purchase. Use code SAVE20
              </p>
              <Link to="/" className="cr-side-card-btn cr-side-card-btn--light">
                Shop Now
              </Link>
            </div>

            <div className="cr-side-card">
              <div className="cr-side-card-icon cr-side-card-icon--muted">
                <i className="fas fa-shield-alt" aria-hidden="true" />
              </div>
              <div className="cr-side-card-title">Secure Payment</div>
              <p className="cr-side-card-text">
                100% secure and encrypted transactions on every order.
              </p>
            </div>

            <div className="cr-side-card">
              <div className="cr-side-card-icon cr-side-card-icon--muted">
                <i className="fas fa-headset" aria-hidden="true" />
              </div>
              <div className="cr-side-card-title">Need Help?</div>
              <p className="cr-side-card-text">
                Our support team is available around the clock.
              </p>
              <Link to="/contact-us" className="cr-side-card-btn">
                Contact Support
              </Link>
            </div>
          </aside>
        )}
      </div>

      <style>{`
        .cr-section {
          margin-top: 8px;
        }

        .cr-section-header {
          margin-bottom: 16px;
          padding-bottom: 14px;
          border-bottom: 1px solid #ede9f5;
        }

        .cr-section-count {
          background: #f3f0fa;
          color: #8059ca;
          font-size: 12px;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 20px;
          flex-shrink: 0;
          line-height: 1.2;
        }

        .cr-layout {
          display: flex;
          gap: 24px;
          align-items: flex-start;
        }

        .cr-main {
          flex: 1;
          min-width: 0;
        }

        .cr-summary {
          display: flex;
          flex-wrap: wrap;
          gap: 24px;
          align-items: center;
          padding: 20px;
          margin-bottom: 20px;
          background: linear-gradient(135deg, #fdfbff 0%, #f8f4ff 100%);
          border: 1px solid #e8dff8;
          border-radius: 12px;
        }

        .cr-summary-score {
          display: flex;
          flex-direction: column;
          align-items: center;
          min-width: 120px;
          padding-right: 8px;
        }

        .cr-summary-number {
          font-size: 32px;
          font-weight: 500;
          color: #8059ca;
          line-height: 1;
          margin-bottom: 6px;
        }

        .cr-summary-based {
          font-size: 12px;
          font-weight: 400;
          color: #667085;
          margin: 8px 0 0;
        }

        .cr-summary-bars {
          flex: 1;
          min-width: 220px;
        }

        .cr-bar-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 6px;
        }

        .cr-bar-row:last-child {
          margin-bottom: 0;
        }

        .cr-bar-label {
          width: 10px;
          font-size: 12px;
          font-weight: 400;
          color: #667085;
          text-align: right;
        }

        .cr-bar-star {
          font-size: 10px;
          color: #8059ca;
        }

        .cr-bar-track {
          flex: 1;
          height: 8px;
          background: #ede9f5;
          border-radius: 999px;
          overflow: hidden;
        }

        .cr-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #8059ca 0%, #9b7ad4 100%);
          border-radius: 999px;
          transition: width 0.3s ease;
        }

        .cr-bar-percent {
          width: 34px;
          font-size: 11px;
          font-weight: 400;
          color: #667085;
          text-align: right;
        }

        .cr-stars {
          display: inline-flex;
          align-items: center;
          gap: 2px;
        }

        .cr-stars i {
          font-size: 13px;
        }

        .cr-stars--lg i {
          font-size: 16px;
        }

        .cr-star-filled {
          color: #8059ca;
        }

        .cr-star-empty {
          color: #d5d9d9;
        }

        .cr-review-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px;
          margin-top: 0 !important;
        }

        .cr-review-list-full {
          grid-column: 1 / -1;
        }

        .cr-review-card {
          background: #fff;
          border: 1px solid #eef0f3;
          border-radius: 12px;
          padding: 16px 18px;
          height: 100%;
          display: flex;
          flex-direction: column;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }

        .cr-review-card:hover {
          border-color: #e0d4f5;
          box-shadow: 0 4px 14px rgba(128, 89, 202, 0.08);
        }

        .cr-review-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 10px;
        }

        .cr-reviewer {
          display: flex;
          align-items: center;
          gap: 10px;
          min-width: 0;
        }

        .cr-reviewer-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8059ca 0%, #6d48b8 100%);
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          overflow: hidden;
          text-transform: uppercase;
        }

        .cr-reviewer-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .cr-reviewer-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .cr-reviewer-name {
          font-size: 14px;
          font-weight: 500;
          color: #2d3748;
          text-transform: capitalize;
        }

        .cr-review-date {
          font-size: 11px;
          font-weight: 400;
          color: #98a2b3;
        }

        .cr-verified-badge {
          display: inline-flex;
          align-items: center;
          align-self: flex-start;
          width: fit-content;
          max-width: 100%;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
          color: #8059ca;
          background: #f3f0fa;
          border-radius: 20px;
          padding: 4px 10px;
          margin-bottom: 10px;
          white-space: nowrap;
        }

        .cr-verified-badge i {
          font-size: 11px;
        }

        .cr-review-title {
          font-size: 13px;
          font-weight: 500;
          color: #2d3748;
          margin: 0 0 8px;
          line-height: 1.4;
        }

        .cr-review-body {
          font-size: 13px;
          font-weight: 400;
          line-height: 1.5;
          color: #666;
          margin: 0;
          word-wrap: break-word;
          flex: 1;
        }

        .cr-load-more-wrap {
          text-align: center;
          margin-top: 20px;
        }

        .cr-load-more-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          color: #8059ca;
          border: 1.5px solid #8059ca;
          border-radius: 8px;
          padding: 9px 18px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cr-load-more-btn:hover {
          background: #8059ca;
          color: #fff;
        }

        .cr-load-more-btn i {
          font-size: 10px;
        }

        .cr-empty-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 40px 24px;
          border: 1px dashed #d8ccf0;
          border-radius: 12px;
          background: linear-gradient(180deg, #fdfbff 0%, #f8f4ff 100%);
        }

        .cr-empty-icon {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: #fff;
          border: 1px solid #e8dff8;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #8059ca;
          font-size: 22px;
          margin-bottom: 14px;
        }

        .cr-empty-title {
          font-size: 16px;
          font-weight: 500;
          color: #2d3748;
          margin: 0 0 8px;
        }

        .cr-empty-text {
          font-size: 13px;
          font-weight: 400;
          line-height: 1.55;
          color: #667085;
          max-width: 380px;
          margin: 0 0 14px;
        }

        .cr-empty-stars {
          display: flex;
          gap: 6px;
        }

        .cr-empty-stars i {
          font-size: 15px;
          color: #d5d9d9;
        }

        .cr-skeleton-card {
          padding: 18px;
          border: 1px solid #eef0f3;
          border-radius: 12px;
          background: #fff;
          height: 100%;
        }

        .cr-skeleton-top {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
        }

        .cr-skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          flex-shrink: 0;
          background: linear-gradient(90deg, #f2f4f7 25%, #e4e7ec 50%, #f2f4f7 75%);
          background-size: 200% 100%;
          animation: cr-shimmer 1.4s infinite;
        }

        .cr-skeleton-meta {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding-top: 4px;
        }

        .cr-skeleton-stars {
          width: 100px;
          height: 12px;
          border-radius: 6px;
          margin-bottom: 12px;
          background: linear-gradient(90deg, #f2f4f7 25%, #e4e7ec 50%, #f2f4f7 75%);
          background-size: 200% 100%;
          animation: cr-shimmer 1.4s infinite;
        }

        .cr-skeleton-line {
          height: 10px;
          border-radius: 6px;
          background: linear-gradient(90deg, #f2f4f7 25%, #e4e7ec 50%, #f2f4f7 75%);
          background-size: 200% 100%;
          animation: cr-shimmer 1.4s infinite;
        }

        .cr-skeleton-line--short {
          width: 40%;
        }

        .cr-skeleton-line--medium {
          width: 75%;
        }

        @keyframes cr-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .cr-sidebar {
          width: 280px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cr-side-card {
          background: #fff;
          border: 1px solid #eef0f3;
          border-radius: 12px;
          padding: 18px;
          text-align: center;
        }

        .cr-side-card--primary {
          background: linear-gradient(135deg, #8059ca 0%, #6d48b8 100%);
          border: none;
          color: #fff;
        }

        .cr-side-card--primary .cr-side-card-title,
        .cr-side-card--primary .cr-side-card-text {
          color: #fff;
        }

        .cr-side-card-icon {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          margin-bottom: 10px;
        }

        .cr-side-card-icon--muted {
          background: #f3f0fa;
          color: #8059ca;
        }

        .cr-side-card-title {
          font-size: 14px;
          font-weight: 500;
          color: #2d3748;
          margin: 0 0 6px;
        }

        .cr-side-card-text {
          font-size: 12px;
          font-weight: 400;
          line-height: 1.5;
          color: #667085;
          margin: 0 0 14px;
        }

        .cr-side-card-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 9px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          background: #8059ca;
          color: #fff !important;
          border: none;
          transition: background 0.2s ease;
        }

        .cr-side-card-btn:hover {
          background: #6b21d6;
          color: #fff !important;
        }

        .cr-side-card-btn--light {
          background: #fff;
          color: #8059ca !important;
        }

        .cr-side-card-btn--light:hover {
          background: #f8f4ff;
          color: #6b21d6 !important;
        }

        @media (max-width: 768px) {
          .cr-layout {
            flex-direction: column;
          }

          .cr-summary {
            flex-direction: column;
            align-items: stretch;
            padding: 16px;
          }

          .cr-summary-score {
            padding-right: 0;
            padding-bottom: 12px;
            border-bottom: 1px solid #e8dff8;
          }

          .cr-review-list {
            grid-template-columns: 1fr;
          }

          .cr-review-card-top {
            flex-direction: column;
            gap: 8px;
          }
        }

        @media (min-width: 769px) and (max-width: 1100px) {
          .cr-review-list {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </section>
  );
};

export default Reviews;
