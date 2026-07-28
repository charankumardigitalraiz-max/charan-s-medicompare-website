import React, { useState, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCartContext } from "../../context/CartContext";
import { axiosCommonInstance, axiosUserInstance } from "../../Apiservice.jsx";
import toast from "react-hot-toast";
import LeadModal from "../../feature-module/frontend/pharmacy/products-components/LeadModal.jsx";
import RentModal from "../../feature-module/frontend/pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../../feature-module/frontend/pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../../feature-module/frontend/pharmacy/products-components/AppointmentModal.jsx";
import { useProfile } from "../../context/ProfileContext";
import FamilyMemberSelectionModal from "../../feature-module/frontend/pharmacy/products-components/FamilyMemberSelectionModal.jsx";
import PrescriptionUploadModal from "../pharmacy/PrescriptionUploadModal.jsx";

const INITIAL_LEAD_FORM = {
  date: "",
  name: "",
  email: "",
  mobile: "",
  policyNumber: "",
  relation: "",
  address: "",
};

const CartQuantityControls = ({
  item,
  tabletdetails,
  variant = null,
  maxStock = null,
  options = {},
  rentAndCartButtonStyles,
  contailerStyles,
  individualStyleForCart,
  inStock = true,
  className = "",
  style = {},
  service,
}) => {
  const { addItem, userDetails, incrementItem, decrementItem, getQuantity, refreshCart, removeItem, cartItems } =
    useCartContext();
  // console.log("service", service)
  const { bookingType = "cart" } = options;
  // console.log("cartservices", service)
  const isPackage = options?.type === "package" || !!options?.packageId;
  // console.log("cartservice", service)
  const productId = isPackage
    ? null
    : item?.tabletdetails?._id ||
    item?.tabletdetails?.id ||
    item?._id ||
    item?.id;

  const packageId = isPackage
    ? item?.packageId || item?._id || item?.id
    : null;

  const maxStockQuanity = tabletdetails?.products?.stock || 999;

  const vendorId =
    item?.vendorId ||  // Explicit vendorId passed directly (highest priority - avoids bussinessdetails._id mismatch)
    item?.vendordetails?.vendorId ||
    item?.vendordetails?._id;

  const selectedVariant = isPackage ? null : (
    variant ||
    (Array.isArray(item?.variants) ? item.variants[0] : item?.variants) ||
    null
  );



  const variantId = isPackage
    ? null
    : selectedVariant?.variantId ||
    selectedVariant?._id ||
    selectedVariant?.id ||
    null;

  const getFixedType = (med) => {
    return med?.subcategoryDetails?.categoryDetails?.fixedType ||
      med?.subcategorys?.category?.fixedType ||
      med?.category?.fixedType ||
      med?.subcategorys?.category?.fixedType ||
      med?.fixedType ||
      item?.tabletdetails?.subcategoryDetails?.categoryDetails?.fixedType ||
      item?.tabletdetails?.subcategorys?.category?.fixedType ||
      item?.tabletdetails?.category?.fixedType ||
      item?.tabletdetails?.fixedType ||
      item?.fixedType ||
      item?.category?.fixedType ||
      item?.subcategorys?.category?.fixedType ||
      "medicine";
  };

  const fixedType = isPackage ? "labtests" : getFixedType(item?.tabletdetails);
  const isLabTest = service === "labtests" || service === "lab-tests" || fixedType === "labtests";

  const quantity = getQuantity(vendorId, productId, variantId, packageId);
  const effectiveMaxStock = Math.min(maxStock, maxStockQuanity);
  const atMaxStock =
    effectiveMaxStock < 999 && quantity >= effectiveMaxStock;
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [rentProduct, setRentProduct] = useState(null);
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();
  const [familyMemberModel, setFamilyMemberModel] = useState(false);
  const [familyMembersData, setFamilyMembersData] = useState([]);
  const [selectedPatients, setSelectedPatients] = useState(["self"]);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);

  // Form data states
  const [leadFormData, setLeadFormData] = useState(INITIAL_LEAD_FORM);
  const [rentFormData, setRentFormData] = useState({
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    duration: "",
    deliveryAddress: "",
  });
  const [consultationFormData, setConsultationFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });
  const [appointmentFormData, setAppointmentFormData] = useState({
    date: "",
    name: "",
    phone: "",
    category: "",
    address: "",
  });

  // console.log("descriptioon checkout", service)
  const isLoggedIn = useMemo(() => !!localStorage.getItem("medicomparestoken"), []);

  React.useEffect(() => {
    if (service) {
      let normalized = service;
      if (service === "medicines" || service === "rx-medicines" || service === "medicine") {
        normalized = "medicine";
      } else if (service === "medicalequipment" || service === "medical-equipment") {
        normalized = "medicalequipment";
      } else if (service === "labtests" || service === "lab-tests") {
        normalized = "labtests";
      }
      localStorage.setItem("fixedType", normalized);
    }
  }, [service]);

  React.useEffect(() => {
    if (bookingType === "cartslots" && familyMemberModel) {
      try {
        const personType = sessionStorage.getItem("booking_personType");
        if (personType === "self") {
          setSelectedPatients(["self"]);
        } else if (personType === "forWhom") {
          const selectedMember = sessionStorage.getItem("booking_selectedFamilyMember");
          if (selectedMember) {
            const parsed = JSON.parse(selectedMember);
            if (parsed && parsed.value) {
              setSelectedPatients([parsed.value]);
            }
          }
        }
      } catch (e) {
        console.error(e);
      }

      const fetchFamilyMembers = async () => {
        try {
          const token = localStorage.getItem("medicomparestoken");
          if (!token) return;
          const response = await axiosUserInstance.get("family-member/list", {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (response.data.success) {
            setFamilyMembersData(response.data.data || []);
          }
        } catch (error) {
          toast.error("Error fetching family members:", error);
        }
      };
      fetchFamilyMembers();
    }
  }, [familyMemberModel, service]);

  const proceedToAdd = async (prescriptionImage = null) => {
    setIsLoading(true);
    try {
      const labTestPatients = (options.bookingType === "cartslots")
        ? selectedPatients.map(id => ({
          selectType: id === "self" ? "self" : "family",
          patientId: id === "self" ? null : id
        }))
        : null;


      //       const labTestPatients = ((service === "labtests" || service === "lab-tests") && options.bookingType === "cart")
      // ? selectedPatients.map(id => ({
      //   selectType: id === "self" ? "self" : "family",
      //   patientId: id === "self" ? null : id
      // }))
      // : null;

      const addOptions = {
        ...options,
        quantity: 1,
        servicefixedTypes: service || options.servicefixedTypes || null,
        ...(labTestPatients ? { labTestPatients } : {}),
        ...(isPackage ? { packageId } : {}),
        ...(prescriptionImage ? { prescriptionImage } : {})
      };
      if (addOptions.bookingType === "rentals_addtocarts") {
        addOptions.bookingType = "cart";
      }

      let itemToCart = {}

      if (isPackage) {
        itemToCart = {
          ...item,
          packageId: packageId,
          servicefixedTypes: "labtests",
        };
      } else if (labTestPatients || isLabTest) {
        itemToCart = {
          ...item,
          servicefixedTypes: "labtests",
          // serviceType: "labtests"
        }
      } else if (service === "rx-medicines" || service === "medicines" || service === "medicine") {
        itemToCart = {
          ...item,
          servicefixedTypes: "medicine",
          // serviceType: "labtests"
        }
      }
      else if (service === "medicalequipment" || service === "medical-equipment") {
        itemToCart = {
          ...item,
          servicefixedTypes: "medicalequipment",
          // serviceType: "labtests"
        }
      } else if (service === "nursingcare") {
        itemToCart = {
          ...item,
          servicefixedTypes: "nursingcare",
          // serviceType: "labtests"
        }
      } else {
        itemToCart = {
          ...item,
          servicefixedTypes: service || null,
        };
      }

      if (prescriptionImage) {
        itemToCart.prescriptionImage = prescriptionImage;
      }

      await addItem(itemToCart, selectedVariant, addOptions);
      await refreshCart();
    } catch (error) {
      toast.error("Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  // console.log("booking type", bookingType)

  const handleAdd = async (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (isLoading) return;

    // Check if prescription is required for this tablet/medicine
    const rxRequired = tabletdetails?.prescriptionRequired === true || item?.tabletdetails?.prescriptionRequired === true;
    if (rxRequired) {
      const hasActivePrescriptionPayment = userDetails?.hasActivePrescriptionPayment;

      if (hasActivePrescriptionPayment) {
        const existingPrescriptionItem = cartItems.find(
          (cartItem) => cartItem?.prescriptionImage && cartItem?.prescriptionImage !== ""
        );
        const existingPrescription = existingPrescriptionItem?.prescriptionImage || true;
        if (bookingType === "cartslots") {
          setFamilyMemberModel(true);
        } else {
          proceedToAdd(existingPrescription);
        }
        return;
      }

      // Check if any item in the cart already has a prescription image uploaded
      const existingPrescriptionWithImage = cartItems.find(
        (cartItem) => cartItem?.prescriptionImage && cartItem?.prescriptionImage !== ""
      );
      if (existingPrescriptionWithImage) {
        const existingPrescription = existingPrescriptionWithImage.prescriptionImage;
        if (bookingType === "cartslots") {
          setFamilyMemberModel(true);
        } else {
          proceedToAdd(existingPrescription);
        }
        return;
      }

      setShowPrescriptionModal(true);
      return;
    }

    if (bookingType === "cartslots") {
      setFamilyMemberModel(true);
      return;
    }
    proceedToAdd();
  };

  const handleIncrement = async (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await incrementItem(vendorId, productId, variantId, effectiveMaxStock, packageId);
      // incrementItem already awaits refreshCart internally
    } catch (error) {
      // Error incrementing item
      toast.error("Failed to increment");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecrement = async (e) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await decrementItem(vendorId, productId, variantId, packageId);
      // decrementItem already awaits refreshCart internally
    } catch (error) {
      // Error decrementing item
      toast.error("Failed to decrement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = (cartKey) => {
    const foundItem = cartItems.find((i) => i.cartKey === cartKey) ||
      cartItems.find((i) => String(i.productId || i.tabletId) === String(productId) && String(i.vendorId) === String(vendorId));
    if (!foundItem) return;
    const pkgId = foundItem.packageId || (foundItem.type === "package" ? foundItem._id : null);
    removeItem(foundItem.vendorId, foundItem.productId, foundItem.variantId, pkgId);
  };

  // Handler for booking
  const handleBooking = async (vendor, med, test) => {
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");

      const payload = [
        {
          productId: med?._id || med?.id,
          variantId: null,
          vendorId: vendor?.vendorId || vendor?._id,
          packageId: null,
          type: "normal",
          bookingType: "buy_now",
          servicefixedTypes: service
        },
      ];

      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (window.location.pathname === "/booking-process") {
        window.location.reload();
      } else {
        navigate("/booking-process");
      }
    } catch (error) {
      toast.error(
        error.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to create booking"
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleRentalBookinProcess = async (vendor, med, item) => {
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }

    try {
      const token = localStorage.getItem("medicomparestoken");

      if (item?.perDayRent) {
        localStorage.setItem("perDayRent", item.perDayRent);
      }

      const payload = [
        {
          productId: med?._id || med?.id,
          variantId: null,
          vendorId: vendor?.vendorId || vendor?._id,
          packageId: null,
          type: "normal",
          bookingType: "buy_now",
          perDayRent: item?.perDayRent || 0,
          servicefixedTypes: service
        },
      ];

      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (window.location.pathname === "/rental-booking-process") {
        window.location.reload();
      } else {
        navigate("/rental-booking-process");
      }
    } catch (error) {
      toast.error(
        error.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to create booking"
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  // Handler for slots booking
  const handleSlots = async (vendor, med, test) => {
    if (options.handleSlots) {
      return options.handleSlots(vendor, med);
    }

    return handleBooking(vendor, med, test);
  };

  // Handler for appointment
  const handleAppointmentClick = (vendor, med) => {
    if (options.handleAppointmentClick) {
      return options.handleAppointmentClick(vendor, med);
    }

    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    setAppointmentFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
    });
    setShowAppointmentModal(true);
  };

  // Handler for rentals
  const handleRentClick = (vendor, med) => {
    if (options.handleRentClick) {
      return options.handleRentClick(vendor, med);
    }

    if (!isLoggedIn) {
      toast.error("Please login to rent equipment");
      navigate("/login");
      return;
    }

    const selectedVar =
      selectedVariant ||
      (Array.isArray(item?.variants) ? item.variants[0] : item?.variants);
    const rentItem = {
      tabletdetails: med || item?.tabletdetails,
      vendordetails: vendor || item?.vendordetails,
      variants: item?.variants || [],
      price: selectedVar?.price || med?.price || item?.price || 0,
      discountprice:
        selectedVar?.discountprice || selectedVar?.discountPrice || 0,
    };

    setRentProduct(rentItem);
    setShowRentModal(true);
  };

  // Handler for consultation
  const handleConsultationClick = (vendor, med) => {
    if (options.handleConsultationClick) {
      return options.handleConsultationClick(vendor, med);
    }

    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    setConsultationFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
    });
    setShowConsultationModal(true);
  };


  // Handler for lead
  const handleAddLead = (vendor, med) => {
    if (options.handleAddLead) {
      return options.handleAddLead(vendor, med);
    }

    if (!isLoggedIn) {
      toast.error("Please login");
      navigate("/login");
      return;
    }

    setCurrentLeadData({ vendor, med: med || item?.tabletdetails, variantId });
    const today = new Date().toISOString().split("T")[0];
    setLeadFormData({
      ...INITIAL_LEAD_FORM,
      date: today,
      relation: "self",
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      mobile: userProfile?.phone || "",
      email: userProfile?.email || "",
    });
    setShowLeadModal(true);
  };

  // Form handlers
  const handleRentFormChange = (e) => {
    const { name, value } = e.target;
    setRentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConsultationFormChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAppointmentFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const actionButtonStyle = {
    width: "100%",
    ...(rentAndCartButtonStyles || {}),
    ...(style || {}),
  };

  return (
    <>
      {bookingType === "leads" && (
        <div style={contailerStyles}>
          <button
            type="button"
            className={`vendor-action-btn vendor-lead-btn ${className}`}
            style={actionButtonStyle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAddLead(item.vendordetails, item.tabletdetails);
            }}
          >
            Get An Enquiry
          </button>
        </div>
      )}
      {bookingType === "booking" && (
        <div style={contailerStyles}>
          <button
            type="button"
            className={`vendor-action-btn vendor-add-btn ${className}`}
            style={actionButtonStyle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleBooking(item.vendordetails, item.tabletdetails, item);
            }}
          >
            <i className="fas fa-calendar-check"></i>Book
          </button>
        </div>
      )}
      {bookingType === "slots" && (
        <div style={contailerStyles}>
          <button
            type="button"
            className={`vendor-action-btn vendor-add-btn ${className}`}
            style={actionButtonStyle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSlots(item.vendordetails, item.tabletdetails, item);
            }}
          >
            <i className="fa-solid fa-clock"></i>Book Now
          </button>
        </div>
      )}
      {bookingType === "rentals" && (
        <div style={contailerStyles}>
          <button
            type="button"
            className={`vendor-action-btn vendor-rent-btn ${className}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRentalBookinProcess(item.vendordetails, item.tabletdetails, item);
            }}
            disabled={!item?.perDayRent}
            style={{
              ...actionButtonStyle,
              opacity: item?.perDayRent ? 1 : 0.6,
              cursor: item?.perDayRent ? "pointer" : "not-allowed",
            }}
          >
            <i className="fa-solid fa-clipboard-check"></i>Rent
          </button>
        </div>
      )}
      {bookingType === "consultation" && (
        <div style={contailerStyles}>
          <button
            type="button"
            className={`vendor-action-btn vendor-consultation-btn ${className}`}
            style={actionButtonStyle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleConsultationClick(item.vendordetails, item.tabletdetails);
            }}
          >
            <i className="fa-solid fa-comments"></i>Consultation
          </button>
        </div>
      )}
      {bookingType === "appointment" && (
        <div style={contailerStyles}>
          <button
            type="button"
            className={`vendor-action-btn vendor-appointment-btn ${className}`}
            style={actionButtonStyle}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleAppointmentClick(item.vendordetails, item.tabletdetails);
            }}
          >
            <i className="fa-solid fa-calendar-check"></i>Appointment
          </button>
        </div>
      )}

      {bookingType === "rentals_addtocarts" && (
        <div style={contailerStyles}>
          {inStock ? (
            quantity > 0 ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <div
                  className={`cart-qty-controls ${className}`}
                  style={individualStyleForCart}
                >
                  <button
                    className="cart-qty-btn cart-qty-decrease"
                    onClick={handleDecrement}
                    disabled={isLoading || quantity <= 0}
                  >
                    <i className="fas fa-minus"></i>
                  </button>
                  <span className="cart-qty-value">{quantity}</span>
                  <button
                    className="cart-qty-btn cart-qty-increase"
                    onClick={handleIncrement}
                    disabled={isLoading}
                  >
                    <i className="fas fa-plus"></i>
                  </button>
                </div>
                {atMaxStock && (
                  <small
                    style={{
                      display: "block",
                      textAlign: "center",
                      color: "#b45309",
                      fontSize: "11px",
                      fontWeight: 600,
                      lineHeight: 1.3,
                      maxWidth: "140px",
                    }}
                  >
                    Only {effectiveMaxStock} in stock
                  </small>
                )}
              </div>
            ) : (
              <button
                className={`vendor-action-btn vendor-add-btn ${className}`}
                onClick={handleAdd}
                disabled={isLoading}
                style={actionButtonStyle}
              >
                <i className="fas fa-shopping-cart me-2"></i>Add
              </button>
            )
          ) : (
            <button className="vendor-action-btn vendor-disabled-btn" disabled>
              <i className="fas fa-ban"></i>Unavailable
            </button>
          )}
          <button
            type="button"
            className="vendor-action-btn vendor-rent-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleRentalBookinProcess(item.vendordetails, item.tabletdetails, item);
            }}
            disabled={!item?.perDayRent}
            style={{
              ...actionButtonStyle,
              opacity: item?.perDayRent ? 1 : 0.6,
              cursor: item?.perDayRent ? "pointer" : "not-allowed",
            }}
          >
            <i className="fa-solid fa-clipboard-check"></i>Rent
          </button>
        </div>
      )}

      {bookingType === "cart" && !inStock && (
        <div style={contailerStyles}>
          <button
            type="button"
            className={`vendor-action-btn vendor-disabled-btn ${className}`}
            style={actionButtonStyle}
            disabled
          >
            <i className="fas fa-ban"></i>Unavailable
          </button>
        </div>
      )}

      {bookingType === "cart" &&
        (quantity > 0 ? (
          <div
            style={{
              ...contailerStyles,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {/* {isLabTest ? ( */}
            {/* <div style={{ ...contailerStyles, width: "100%" }}>
                <button
                  type="button"
                  className={`vendor-action-btn vendor-selected-btn ${className}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(item?.cartKey || (isPackage ? `${vendorId}_pkg_${packageId}` : variantId ? `${vendorId}_${variantId}` : `${vendorId}_${productId}`));
                  }}
                  disabled={isLoading}
                  style={{
                    ...actionButtonStyle,
                    width: "100%",
                    backgroundColor: "#10b981",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: actionButtonStyle?.borderRadius || "6px",
                    padding: actionButtonStyle?.padding || "5px 12px",
                    fontSize: actionButtonStyle?.fontSize || "11px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
                    transition: "all 0.3s ease",
                  }}
                >
                  <i className="fas fa-check me-2"></i>Selected
                </button>
              </div> */}
            {/* ) : ( */}
            <div
              className={`cart-qty-controls ${className}`}
              style={individualStyleForCart}
            >
              <button
                className="cart-qty-btn cart-qty-decrease"
                onClick={handleDecrement}
                disabled={isLoading || quantity <= 0}
              >
                <i className="fas fa-minus"></i>
              </button>
              <span className="cart-qty-value">{quantity}</span>
              <button
                className="cart-qty-btn cart-qty-increase"
                onClick={handleIncrement}
              // disabled={isLoading || atMaxStock}
              >
                <i className="fas fa-plus"></i>
              </button>
            </div>
            {/* )} */}
            {/* {atMaxStock && (
              <small
                style={{
                  display: "block",
                  textAlign: "center",
                  color: "#b45309",
                  fontSize: "11px",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  maxWidth: "140px",
                }}
              >
                Only {effectiveMaxStock} in stock
              </small>
            )} */}

          </div>
        ) : (
          <div style={contailerStyles}>
            <button
              className={`vendor-add-btn ${className}`}
              style={actionButtonStyle}
              onClick={handleAdd}
              disabled={isLoading}

            >
              <i className="fas fa-shopping-cart me-2"></i>Add
            </button>
          </div>
        ))}



      {bookingType === "cartslots" && (quantity > 0 ? (
        <div
          style={{
            ...contailerStyles,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          {/* {isLabTest ? ( */}
          <div style={{ ...contailerStyles, width: "100%" }}>
            <button
              type="button"
              className={`vendor-action-btn vendor-selected-btn ${className}`}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleRemove(item?.cartKey || (isPackage ? `${vendorId}_pkg_${packageId}` : variantId ? `${vendorId}_${variantId}` : `${vendorId}_${productId}`));
              }}
              disabled={isLoading}
              style={{
                ...actionButtonStyle,
                width: "100%",
                backgroundColor: "#10b981",
                color: "#ffffff",
                border: "none",
                borderRadius: actionButtonStyle?.borderRadius || "6px",
                padding: actionButtonStyle?.padding || "5px 12px",
                fontSize: actionButtonStyle?.fontSize || "11px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
                transition: "all 0.3s ease",
              }}
            >
              <i className="fas fa-check me-2"></i>Selected
            </button>
          </div>
          {/* // ) : (
            //   <div
            //     className={`cart-qty-controls ${className}`}
            //     style={individualStyleForCart}
            //   >
            //     <button
            //       className="cart-qty-btn cart-qty-decrease"
            //       onClick={handleDecrement}
            //       disabled={isLoading || quantity <= 0}
            //     >
            //       <i className="fas fa-minus"></i>
            //     </button>
            //     <span className="cart-qty-value">{quantity}</span>
            //     <button
            //       className="cart-qty-btn cart-qty-increase"
            //       onClick={handleIncrement}
            //     // disabled={isLoading || atMaxStock}
            //     >
            //       <i className="fas fa-plus"></i>
            //     </button>
            //   </div>
            // )} */}
          {/* {atMaxStock && (
              <small
                style={{
                  display: "block",
                  textAlign: "center",
                  color: "#b45309",
                  fontSize: "11px",
                  fontWeight: 600,
                  lineHeight: 1.3,
                  maxWidth: "140px",
                }}
              >
                Only {effectiveMaxStock} in stock
              </small>
            )} */}

        </div>
      ) : (
        <div style={contailerStyles}>
          <button
            className={`vendor-add-btn ${className}`}
            style={actionButtonStyle}
            onClick={handleAdd}
            disabled={isLoading}

          >
            <i className="fas fa-shopping-cart me-2"></i>Add
          </button>
        </div>
      ))}

      {typeof document !== "undefined" &&
        createPortal(
          <>
            {/* Lead Modal */}
            <LeadModal
              show={showLeadModal}
              onClose={() => {
                setShowLeadModal(false);
                setLeadFormData(INITIAL_LEAD_FORM);
                setCurrentLeadData(null);
              }}
              formData={leadFormData}
              onChange={(e) =>
                setLeadFormData((p) => ({
                  ...p,
                  [e.target.name]: e.target.value,
                }))
              }
              productId={
                currentLeadData?.med?._id ||
                currentLeadData?.med?.id ||
                productId
              }
              vendorId={
                currentLeadData?.vendor?.vendorId ||
                currentLeadData?.vendor?.id ||
                vendorId
              }
              variantId={currentLeadData?.variantId || variantId}
              formType="leads"
              fixedType={fixedType}
            />

            {/* Rent Modal */}
            <RentModal
              show={showRentModal}
              fixedType={fixedType}
              onClose={() => {
                setShowRentModal(false);
                setRentFormData({
                  startDate: "",
                  startTime: "",
                  endDate: "",
                  endTime: "",
                  duration: "",
                  deliveryAddress: "",
                });
                setRentProduct(null);
              }}
              rentProduct={rentProduct}
              formData={rentFormData}
              onFormChange={handleRentFormChange}
              productId={
                rentProduct?.tabletdetails?._id ||
                rentProduct?.tabletdetails?.id ||
                productId
              }
              vendorId={
                rentProduct?.vendordetails?.vendorId ||
                rentProduct?.vendordetails?.id ||
                rentProduct?.vendordetails?.vendorId ||
                vendorId
              }
              variantId={variantId}
              userProfile={userProfile}
              formType={
                bookingType === "rentals_addtocarts"
                  ? "rentals_addtocarts"
                  : "rentals"
              }
            />

            {/* Consultation Modal */}
            <ConsultationModal
              show={showConsultationModal}
              fixedType={fixedType}
              onClose={() => {
                setShowConsultationModal(false);
                setConsultationFormData({
                  date: "",
                  name: "",
                  phone: "",
                  category: "",
                  address: "",
                });
              }}
              formData={consultationFormData}
              onFormChange={handleConsultationFormChange}
              productId={productId}
              vendorId={vendorId}
              variantId={variantId}
              formType="consultation"
            />

            {/* Appointment Modal */}
            <AppointmentModal
              show={showAppointmentModal}
              fixedType={fixedType}
              onClose={() => {
                setShowAppointmentModal(false);
                setAppointmentFormData({
                  date: "",
                  name: "",
                  phone: "",
                  category: "",
                  address: "",
                });
              }}
              formData={appointmentFormData}
              onFormChange={handleAppointmentFormChange}
              productId={productId}
              vendorId={vendorId}
              variantId={variantId}
              formType="appointment"
            />

            <FamilyMemberSelectionModal
              show={familyMemberModel}
              onClose={() => setFamilyMemberModel(false)}
              userProfile={userProfile}
              selectedPatients={selectedPatients}
              setSelectedPatients={setSelectedPatients}
              onProceed={(patients, familyMembers) => {
                if (patients.length === 0) {
                  toast.error("Please select at least one patient");
                  return;
                }

                // Store in sessionStorage
                if (patients.length === 1 && patients[0] === "self") {
                  sessionStorage.setItem("booking_personType", "self");
                  sessionStorage.removeItem("booking_selectedFamilyMember");
                } else {
                  sessionStorage.setItem("booking_personType", "forWhom");
                  const familyIds = patients.filter(id => id !== "self");
                  const selectedMembers = familyMembers.filter(m => familyIds.includes(m._id));

                  if (selectedMembers.length > 0) {
                    const firstMember = selectedMembers[0];
                    const capName = firstMember.name ? firstMember.name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : "";
                    const capRelation = firstMember.relationship ? firstMember.relationship.charAt(0).toUpperCase() + firstMember.relationship.slice(1).toLowerCase() : "Family";
                    sessionStorage.setItem(
                      "booking_selectedFamilyMember",
                      JSON.stringify({
                        value: firstMember._id,
                        label: `${capName} (${capRelation})`
                      })
                    );
                  } else {
                    sessionStorage.removeItem("booking_selectedFamilyMember");
                  }
                }
                sessionStorage.setItem("booking_selectedPatients", JSON.stringify(patients));
                setFamilyMemberModel(false);
                proceedToAdd();
              }}
            />
            <PrescriptionUploadModal
              show={showPrescriptionModal}
              onClose={() => setShowPrescriptionModal(false)}
              medicineData={item.tabletdetails}
              onValidated={(imgUrl) => {
                setShowPrescriptionModal(false);
                if (bookingType === "cartslots") {
                  setFamilyMemberModel(true);
                } else {
                  proceedToAdd(imgUrl);
                }
              }}
            />
          </>,
          document.body
        )}
    </>
  );
};

export default CartQuantityControls;
