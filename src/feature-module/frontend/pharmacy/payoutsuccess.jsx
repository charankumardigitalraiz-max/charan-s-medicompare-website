import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Home2Header from "../../../components/home/Header-k.jsx";
import Footer from "../../../components/home/Footer-f.jsx";
import toast from "react-hot-toast";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [productType, setProductType] = useState("package");
  const [isAmbulance, setIsAmbulance] = useState(false);
  const [isRental, setIsRental] = useState(false);
  const [isSlot, setIsSlot] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");

  useEffect(() => {
    const id = sessionStorage.getItem("orderId") || "N/A";
    setOrderId(id);
    if (id !== "N/A") sessionStorage.removeItem("orderId");

    const method = sessionStorage.getItem("paymentMethod");
    setPaymentMethod(method);

    window.dispatchEvent(new Event("paymentSuccess"));

    const type = searchParams.get("type");
    if (type === "ambulance") { setIsAmbulance(true); setProductType("ambulance"); }
    if (type === "slot") { setIsSlot(true); setProductType("slot"); }

    const orderItemsStr = sessionStorage.getItem("orderItems");
    if (orderItemsStr) {
      sessionStorage.removeItem("orderItems");
      try {
        const orderItems = JSON.parse(orderItemsStr);
        if (orderItems?.length > 0) {
          const firstItemType = orderItems[0]?.type || "package";
          setProductType(firstItemType);
          if (firstItemType === "rental") setIsRental(true);
        }
      } catch (error) {
        toast.error("Error parsing order items:", error);
      }
    }

    setCurrentDate(
      new Date().toLocaleDateString("en-US", {
        weekday: "long", year: "numeric", month: "long", day: "numeric",
      })
    );
  }, [searchParams]);

  const viewOrdersLink = isAmbulance
    ? "/ambulance-booking"
    : isRental ? "/rental-booking"
      : isSlot ? "/my-appointments"
        : "/my-orders";

  const viewOrdersLabel = isAmbulance
    ? "View Bookings"
    : isRental ? "View Rentals"
      : isSlot ? "View Appointments"
        : "View Orders";

  const successMessage = paymentMethod === "cod"
    ? "Payment will be collected at the time of delivery"
    : productType === "ambulance" ? "Your ambulance booking has been confirmed and will be processed shortly."
      : productType === "rental" ? "Your rental booking has been confirmed and will be processed shortly."
        : productType === "package" ? "Your booking has been confirmed and will be processed shortly."
          : productType === "product" ? "Your order has been confirmed and will be delivered shortly."
            : "Your order has been confirmed and will be processed shortly.";

  const nextStepTeamMsg = productType === "ambulance"
    ? "Our team will contact you to schedule your ambulance service"
    : productType === "rental" ? "Our team will contact you to schedule your rental delivery"
      : productType === "package" ? "Our team will contact you to schedule your appointment"
        : productType === "product" ? "Your order will be prepared and shipped to your address"
          : "Our team will contact you to schedule your appointment";

  const trackLabel = productType === "ambulance" ? "ambulance booking"
    : productType === "rental" ? "rental booking"
      : productType === "package" ? "booking"
        : "order";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f5fe] via-white to-[#e8f4ff]">
      <Home2Header />

      <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm p-4 overflow-y-auto flex justify-center items-start md:relative md:inset-auto md:z-auto md:bg-transparent md:backdrop-blur-none md:overflow-visible md:items-center md:py-12 md:px-4">
        <div className="w-full max-w-md md:max-w-lg my-auto md:my-0">
          <div className="bg-white rounded-[24px] shadow-[0_20px_60px_rgba(128,89,202,0.15)] overflow-hidden">

            {/* Top accent strip */}
            <div className="h-[6px] bg-gradient-to-r from-[#321961] to-[#04BD6C]" />

            <div className="p-6 md:p-10">
              {/* Success Icon */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-[#04BD6C] to-[#00a55d] flex items-center justify-center shadow-[0_8px_32px_rgba(4,189,108,0.35)]">
                    <i className="fas fa-check text-white text-[32px] md:text-[38px]" />
                  </div>
                  {/* Ripple rings */}
                  <div className="absolute inset-0 rounded-full border-2 border-[#04BD6C]/30 animate-ping" />
                  <div className="absolute -inset-3 rounded-full border border-[#04BD6C]/15 animate-ping [animation-delay:0.3s]" />
                </div>
              </div>

              {/* Title */}
              <div className="text-center mb-6">
                <h1 className="!text-2xl md:!text-3xl !font-bold !text-[#1a1a2e] mb-2">
                  {paymentMethod === "cod" ? "Order Confirmed!" : "Payment Successful!"}
                </h1>
                <p className="text-sm md:text-base text-[#666] leading-relaxed">{successMessage}</p>
              </div>

              {/* Order Details Card */}
              <div className="bg-[#f8f5fe] rounded-[16px] p-3 md:p-6 mb-6 border border-[#e8d5ff]">
                <div className="flex items-center gap-2 mb-4 pb-3 border-b border-[#e0c8ff]">
                  <i className="fas fa-receipt text-[#321961]" />
                  <h3 className="!text-sm md:!text-base !font-semibold !text-[#333] mb-0">Order Details</h3>
                </div>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center gap-4">
                    <span className="flex items-center gap-2 text-[13px] md:text-sm text-[#666] shrink-0">
                      <i className="fas fa-hashtag text-[#321961]" /> Order ID
                    </span>
                    <span className="text-[13px] md:text-sm font-semibold text-[#333] break-all text-right">{orderId}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[13px] md:text-sm text-[#666]">
                      <i className="fas fa-calendar-alt text-[#321961]" /> Order Date
                    </span>
                    <span className="text-[13px] md:text-sm font-semibold text-[#333]">{currentDate}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center gap-2 text-[13px] md:text-sm text-[#666]">
                      <i className="fas fa-check-circle text-[#321961]" /> Status
                    </span>
                    <span className="text-[12px] md:text-[13px] font-semibold text-[#04BD6C] bg-[#e8faf2] px-3 py-1 rounded-full">
                      Confirmed
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Steps Card */}
              <div className="bg-[#fffbea] rounded-[16px] p-3 md:p-6 mb-6 border border-[#ffe9a0]">
                <h4 className="flex items-center gap-2 !text-sm md:!text-[15px] !font-semibold !text-[#92600a] mb-3">
                  <i className="fas fa-info-circle" /> What's Next?
                </h4>
                <ul className="space-y-2.5">
                  {[
                    "You will receive a confirmation email shortly",
                    nextStepTeamMsg,
                    `Track your ${trackLabel} status in your account`,
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-[13px] md:text-sm text-[#555]">
                      <i className="fas fa-check text-[#04BD6C] mt-[2px] flex-shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                <Link
                  to={viewOrdersLink}
                  className="flex-1 flex items-center justify-center gap-2 !bg-[#321961] hover:!bg-[#6b44b8] !text-white !text-[13px] md:!text-[15px] !font-semibold py-2 px-4 !rounded-[10px] transition-all duration-200 !no-underline whitespace-nowrap"
                >
                  <i className="fas fa-list-alt" />
                  {viewOrdersLabel}
                </Link>
                <Link
                  to="/"
                  className="flex-1 flex items-center justify-center gap-2 !bg-white hover:!bg-[#f5f0ff] !text-[#321961] border border-[#321961] !text-[13px] md:!text-[15px] !font-semibold py-2 px-4 !rounded-[10px] transition-all duration-200 !no-underline whitespace-nowrap"
                >
                  <i className="fas fa-home" />
                  Back to Home
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PaymentSuccess;
