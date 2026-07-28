const ShareModal = ({ show, onClose, onShare }) => {
  if (!show) return null;

  const shareOptions = [
    {
      id: "copy",
      label: "Copy ",
      icon: "fas fa-link",
      bgColor: "#f1f3f4",
      iconColor: "#5f6368",
      onClick: onShare.copy,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "fab fa-whatsapp",
      bgColor: "#25D366",
      iconColor: "white",
      onClick: onShare.whatsapp,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: "fab fa-facebook",
      bgColor: "#1877F2",
      iconColor: "white",
      onClick: onShare.facebook,
    },
    {
      id: "twitter",
      label: "X",
      icon: "fab fa-x-twitter",
      bgColor: "#000000",
      iconColor: "white",
      onClick: onShare.twitter,
    },
    {
      id: "email",
      label: "Email",
      icon: "fas fa-envelope",
      bgColor: "#f1f3f4",
      iconColor: "#5f6368",
      onClick: onShare.email,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: "fab fa-telegram",
      bgColor: "#0088cc",
      iconColor: "white",
      onClick: onShare.telegram,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: "fab fa-linkedin",
      bgColor: "#0077B5",
      iconColor: "white",
      onClick: onShare.linkedin,
    },
  ];

  return (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.85)",
        zIndex: "999999999999999",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        style={{ maxWidth: "400px", margin: "auto" }}
      >
        <div
          className="modal-content"
          style={{ borderRadius: "12px", border: "none" }}
        >
          <div
            className="modal-header"
            style={{
              borderBottom: "1px solid #e9ecef",
              padding: "20px 24px 16px",
            }}
          >
            <h5
              className="modal-title"
              style={{ fontWeight: "600", fontSize: "18px", margin: 0 }}
            >
              Share
            </h5>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              style={{ fontSize: "14px" }}
            ></button>
          </div>
          <div className="modal-body" style={{ padding: "16px" }}>
            <div className="row g-1">
              {shareOptions.map((option) => (
                <div key={option.id} className="col-3">
                  <div
                    className="d-flex flex-column align-items-center share-option"
                    onClick={option.onClick}
                    style={{
                      cursor: "pointer",
                      transition: "all 0.2s",
                      padding: "12px 8px",
                      borderRadius: "8px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "50%",
                        backgroundColor: option.bgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <i
                        className={option.icon}
                        style={{ fontSize: "20px", color: option.iconColor }}
                      ></i>
                    </div>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "500",
                        color: "#202124",
                      }}
                    >
                      {option.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;

