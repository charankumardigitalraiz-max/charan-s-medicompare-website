import React, { useState, useEffect } from "react";

const CompareModal = ({ triggerShow = false }) => {
  const [show, setShow] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const viewCount = parseInt(localStorage.getItem("compareModalViewCount") || "0", 10);
    if (triggerShow && viewCount < 2) {
      const timer = setTimeout(() => {
        setShow(true);
        setTimeout(() => setIsVisible(true), 50);
        localStorage.setItem("compareModalViewCount", (viewCount + 1).toString());
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [triggerShow]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      setShow(false);
    }, 300);
  };

  if (!show) return null;

  return (
    <>
      <div
        className={`modal fade ${isVisible ? 'show' : ''} d-block p-2 p-md-0`}
        tabIndex="-1"
        style={{
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          zIndex: 999999999,
          display: "flex",
          alignItems: "center",
          opacity: isVisible ? 1 : 0,
          transition: "opacity 0.3s ease-in-out",
        }}
      >
        <div
          className="modal-dialog custom-modal modal-dialog-centered"
          style={{
            transform: isVisible ? 'scale(1)' : 'scale(0.9)',
            transition: "transform 0.3s ease-in-out",
          }}
        >
          <div className="modal-content">

            {/* Close Button */}
            <div className="modal-header">
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
              ></button>
            </div>

            <div className="modal-body p-0">
              <div className="compare-section bg-white">
                <div className="row align-items-center">

                  {/* Left Section */}
                  <div className="col-lg-6 col-12">
                    <h5 className="fw-bold mb-2">
                      Compare Medicines in Seconds
                    </h5>

                    <p className="text-muted small mb-4">
                      Find the best price, ratings, and availability instantly.
                    </p>

                    <div className="steps-container">

                      <div className="step-wrapper">
                        <div className="step-icon icon-purple">
                          <i className="fa fa-search"></i>
                        </div>
                        <h6 className="fw-bold mb-0">Search Medicine</h6>
                        <small className="text-muted">
                          Use search bar to find medicine.
                        </small>
                      </div>

                      <div className="step-wrapper">
                        <div className="step-icon icon-teal">
                          <i className="fa fa-check"></i>
                        </div>
                        <h6 className="fw-bold mb-0">Select Products</h6>
                        <small className="text-muted">
                          Choose medicines to compare.
                        </small>
                      </div>

                      <div className="step-wrapper">
                        <div className="step-icon icon-blue">
                          <i className="fa fa-balance-scale"></i>
                        </div>
                        <h6 className="fw-bold mb-0">Compare Options</h6>
                        <small className="text-muted">
                          View prices side-by-side.
                        </small>
                      </div>

                      <div className="step-wrapper">
                        <div className="step-icon icon-orange">
                          <i className="fa fa-shopping-cart"></i>
                        </div>
                        <h6 className="fw-bold mb-0">Add to Cart</h6>
                        <small className="text-muted">
                          Select your preferred option.
                        </small>
                      </div>

                      <div className="step-wrapper mb-0">
                        <div className="step-icon icon-light">
                          <i className="fa fa-truck"></i>
                        </div>
                        <h6 className="fw-bold mb-0">Complete Order</h6>
                        <small className="text-muted">
                          Fast & secure delivery.
                        </small>
                      </div>

                    </div>
                  </div>

                  {/* Right Section */}
                  <div className="col-md-6 text-center d-none d-md-block">
                    <img
                      src="/assets/medicicomrepage.png"
                      className="img-fluid mobile-img"
                      alt="App Preview"
                    />
                  </div>

                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Internal CSS */}
      <style>{`
        .compare-section {
          background: #f8f9fa;
          border-radius: 20px;
          padding: 25px 30px;
        }

        .steps-container {
          position: relative;
          padding-left: 60px;
        }

        .steps-container::before {
          content: "";
          position: absolute;
          left: 17px;
          top: 12px;
          bottom: 12px;
          border-left: 3px dotted #d2d2d2;
        }

        .step-wrapper {
          position: relative;
          margin-bottom: 22px;
        }

        .step-icon {
          position: absolute;
          left: -60px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 13px;
          z-index: 2;
        }

        .icon-purple { background: #7c4dff; }
        .icon-teal { background: #00bcd4; }
        .icon-blue { background: #3f51b5; }
        .icon-orange { background: #ff5722; }
        .icon-light { background: #4dd0e1; }

        .mobile-img {
          width: 100%;
          height: auto;
          max-height: 420px;
          object-fit: contain;
        }

        .custom-modal {
          max-width: 800px;
        }

        .modal-content {
          border-radius: 20px;
        }

        .modal-header {
          position: absolute;
          right: 15px;
          top: 15px;
          z-index: 10;
          border: none;
        }

        @media (min-width: 992px) {
          .compare-section {
            padding: 20px 20px;
          }
        }

        @media (max-width: 768px) {
          .custom-modal {
            max-width: 95%;
            margin: auto;
          }
        }
      `}</style>
    </>
  );
};

export default CompareModal;
