import React from "react";

const VideoPopupModal = ({ show, onClose, videoSrc }) => {
  if (!show) return null;

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        // backgroundColor: "rgba(0,0,0,0.9)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: "999999999",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content border-0 shadow-lg bg-transparent"
          style={{ borderRadius: "16px", overflow: "hidden" }}
        >
          <div className="modal-header border-0 p-3 position-absolute end-0 top-0" style={{ zIndex: 1 }}>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              style={{ padding: "1.5rem" }}
            ></button>
          </div>
          <div className="modal-body p-0">
            <video
              src={videoSrc}
              controls
              autoPlay
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "90vh",
                display: "block",
                backgroundColor: "black"
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPopupModal;
