import toast from "react-hot-toast";

/**
 * Global MediCompares Razorpay payment utility.
 *
 * @param {Object} config
 * @param {Object}   config.razorpayData         - Razorpay order data from backend (amount, currency, razorpayOrderId)
 * @param {string}   config.description          - Payment description shown in Razorpay modal
 * @param {Object}   [config.prefill]            - Prefill user info { name, contact, email }
 * @param {Function} config.onSuccess            - Called with razorpay response object after successful payment
 * @param {Function} [config.onCancel]           - Called when user closes the Razorpay modal
 * @param {Function} [config.onFailure]          - Called with Razorpay payment.failed event response
 * @param {Function} [config.setIsSubmitting]    - Setter to reset loading/submitting state on cancel/failure
 */
export const openRazorpayCheckout = ({
  razorpayData,
  description = "Order Payment",
  prefill = {},
  onSuccess,
  onCancel,
  onFailure,
  setIsSubmitting,
}) => {
  if (!window.Razorpay) {
    toast.error("Payment service not loaded. Please refresh and try again.");
    return;
  }

  const options = {
    key: "rzp_live_TB29Bn3l1ssijC",
    // key: "rzp_test_RsHwplQ9ACSY5s",
    amount: razorpayData.amount,
    currency: razorpayData.currency || "INR",
    order_id: razorpayData.razorpayOrderId,
    name: "MediCompares",
    description,
    image: "https://medicompares.com/MediCompares_Logo.png",
    handler: async function (res) {
      try {
        if (onSuccess) await onSuccess(res);
      } catch (error) {
        toast.error("Payment verification failed. Please contact support.");
        console.error("Razorpay success handler error:", error);
      }
    },
    prefill: {
      name: prefill.name || "Customer",
      contact: prefill.contact || "",
      email: prefill.email || "",
    },
    theme: { color: "#8059ca" },
    modal: {
      ondismiss: async function () {
        if (setIsSubmitting) setIsSubmitting(false);
        if (onCancel) {
          await onCancel();
        } else {
          toast.error("Payment cancelled. Please try again.");
        }
      },
    },
  };

  const paymentObject = new window.Razorpay(options);

  paymentObject.on("payment.failed", async function (response) {
    if (setIsSubmitting) setIsSubmitting(false);
    if (onFailure) {
      await onFailure(response);
    } else {
      toast.error("Payment failed. Please try again.");
    }
  });

  paymentObject.open();
};
