import React, { useState } from "react";

const CustomerReviewsSuccessModal = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <style>{`
        body{
            background:#f5f6f8;
        }

        .custom-modal-content{
            border-radius:16px;
            padding:10px;
        }

        .review-card{
            background:#fff;
            border-radius:12px;
            padding:18px;
            box-shadow:0 2px 12px rgba(0,0,0,0.05);
            height:100%;
            display:flex;
            flex-direction:column;
            justify-content:space-between;
        }
        .review-header{
            display:flex;
            align-items:flex-start;
            gap:12px;
        }

        .review-header img{
            width:40px;
            height:40px;
            border-radius:8px;
            border: 1px solid gray;
            object-fit:contain;
        }

        .review-title {
            font-weight: 600;
            margin-bottom: 3px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap; 
        }
              .review-card {
                  background: #fcfcfc;
                  border-radius: 12px;
                  padding: 12px;
              margin-bottom: 10px;
                  border: 1px solid #e9e6e6;  
                  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
              }
              .review-card:hover {
                  border-color: #ddd;
                  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
              }
             .stars{
            color:#ffc107;
            font-size:14px;
            margin-top:5px;
        }

        textarea{
            resize:none;
            border-radius:8px;
            font-size:14px;
        }
     
        .modal-body {
    max-height: 400px;
    overflow-y: auto;
}

        .submit-btn{
            background:linear-gradient(90deg,#7b3fe4,#9b5cff);
            border:none;
            font-size:18px;
            padding: 10px;
            color:#fff;
            width:100%;
        }
        .modal-subtitle{
            font-size:14px;
            color:#888;
            margin-top:-6px;
        }

          @media (max-width: 768px) {
              .modal-ttile {
                  font-size: 10px;
              }
          }
          .modal-ttile {
                  font-size: 22px;
                  }
    
        .modal-backdrop-custom{
            position:fixed;
            top:0;
            left:0;
            width:100%;
            height:100%;
            background:rgba(0,0,0,0.5);
            z-index:1040;
        }
      `}</style>

      <div className="text-center mt-5">
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Open Review Modal
        </button>
      </div>

      {showModal && (
        <>
          <div className="modal-backdrop-custom"></div>

          <div
            className="modal d-block"
            tabIndex="-1"
            style={{
              // zIndex: 1050,
              display: "block",
              backgroundColor: "rgba(0,0,0,0.86)",
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              zIndex: "999999999",
              backdropFilter: "blur(2px)",
            }}
          >
            <div className="modal-dialog modal-dialog-centered custom-modal-dialog">
              <div className="modal-content custom-modal-content">
                <div className="modal-header border-0 mb-0 pb-0">
                  <div>
                    <h4 className="mb-2 modal-ttile">
                      Product Ratings & Reviews
                    </h4>
                    <div className="modal-subtitle">
                      Your feedback helps others make informed decisions
                    </div>
                  </div>

                  <button
                    type="button"
                    style={{ fontSize: "10px" }}
                    className="btn-close bg-light rounded"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>

                <div className="modal-body">
                  <div className="row g-2">
                    <div className="col-12">
                      <div className="review-card">
                        <div className="mb-2">
                          <div className="review-header">
                            <img
                              src="https://cdn-icons-png.flaticon.com/512/2966/2966327.png"
                              alt=""
                            />
                            <div className="flex-grow-1">
                              <div className="review-title">
                                Dextromethorphan
                              </div>
                              <div className="stars">
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="fas fa-star"></i>
                                <i className="far fa-star"></i>
                                <i className="far fa-star"></i>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Share your experience..."
                          ></textarea>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button className="submit-btn mb-0">Submit</button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default CustomerReviewsSuccessModal;
