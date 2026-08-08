import React from "react";
import BaseModal from "../../../../components/ui/BaseModal.jsx";

const ShareModal = ({ show, onClose, onShare }) => {
  const shareOptions = [
    {
      id: "copy",
      label: "Copy ",
      icon: "fas fa-link",
      bgColor: "#f1f3f4",
      iconColor: "#5f6368",
      onClick: onShare?.copy,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "fab fa-whatsapp",
      bgColor: "#25D366",
      iconColor: "white",
      onClick: onShare?.whatsapp,
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: "fab fa-facebook",
      bgColor: "#1877F2",
      iconColor: "white",
      onClick: onShare?.facebook,
    },
    {
      id: "twitter",
      label: "X",
      icon: "fab fa-x-twitter",
      bgColor: "#000000",
      iconColor: "white",
      onClick: onShare?.twitter,
    },
    {
      id: "email",
      label: "Email",
      icon: "fas fa-envelope",
      bgColor: "#f1f3f4",
      iconColor: "#5f6368",
      onClick: onShare?.email,
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: "fab fa-telegram",
      bgColor: "#0088cc",
      iconColor: "white",
      onClick: onShare?.telegram,
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: "fab fa-linkedin",
      bgColor: "#0077B5",
      iconColor: "white",
      onClick: onShare?.linkedin,
    },
  ];

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Share"
      size="sm"
      bodyClassName="p-3"
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px 8px",
        }}
      >
        {shareOptions.map((option) => (
          <div key={option.id}>
            <div
              className="share-option"
              onClick={option.onClick}
              style={{
                cursor: "pointer",
                transition: "all 0.2s",
                padding: "12px 4px",
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
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
                  textAlign: "center",
                }}
              >
                {option.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </BaseModal>
  );
};

export default ShareModal;
