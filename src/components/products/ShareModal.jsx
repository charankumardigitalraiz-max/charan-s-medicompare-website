import { BaseModal } from "../ui";
import { createShareHandler, createNormalizedShareHandler } from "../../utils/shareUtils.js";

const ShareModal = ({ show, onClose, onShare: customOnShare, product, selectedVariants, serviceType, shareData }) => {
  let onShare = customOnShare;
  if (!onShare) {
    if (shareData) {
      onShare = createNormalizedShareHandler(shareData, onClose);
    } else if (product) {
      onShare = createShareHandler(product, selectedVariants, onClose, serviceType);
    }
  }

  const shareOptions = [
    {
      id: "copy",
      label: "Copy",
      icon: "fas fa-link",
      bgColor: "#f1f3f4",
      iconColor: "#5f6368",
      onClick: () => onShare?.copy?.(),
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      icon: "fab fa-whatsapp",
      bgColor: "#25D366",
      iconColor: "white",
      onClick: () => onShare?.whatsapp?.(),
    },
    {
      id: "facebook",
      label: "Facebook",
      icon: "fab fa-facebook",
      bgColor: "#1877F2",
      iconColor: "white",
      onClick: () => onShare?.facebook?.(),
    },
    {
      id: "twitter",
      label: "X",
      icon: "fab fa-x-twitter",
      bgColor: "#000000",
      iconColor: "white",
      onClick: () => onShare?.twitter?.(),
    },
    {
      id: "email",
      label: "Email",
      icon: "fas fa-envelope",
      bgColor: "#f1f3f4",
      iconColor: "#5f6368",
      onClick: () => onShare?.email?.(),
    },
    {
      id: "telegram",
      label: "Telegram",
      icon: "fab fa-telegram",
      bgColor: "#0088cc",
      iconColor: "white",
      onClick: () => onShare?.telegram?.(),
    },
    {
      id: "linkedin",
      label: "LinkedIn",
      icon: "fab fa-linkedin",
      bgColor: "#0077B5",
      iconColor: "white",
      onClick: () => onShare?.linkedin?.(),
    },
  ];

  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Share"
      size="sm"
      className=""
      bodyClassName="p-3"
    >
      <div className="grid grid-cols-4 gap-2">
        {shareOptions.map((option) => (
          <div
            key={option.id}
            className="flex flex-col items-center hover:bg-slate-50 transition-colors duration-200 share-option"
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
              />
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
        ))}
      </div>
    </BaseModal>
  );
};

export default ShareModal;

