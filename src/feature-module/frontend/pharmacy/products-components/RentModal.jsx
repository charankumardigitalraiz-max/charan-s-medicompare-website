import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import { imgUrl, axiosUserInstance } from "../../../../Apiservice";
import { getImageUrl } from "../../../../utils/index";
import toast from "react-hot-toast";
import { Autocomplete, useJsApiLoader } from "@react-google-maps/api";

const libraries = ["places"];

const getModalTitle = (type) => {
  const titles = {
    medicine: "Medicine Enquiry",
    surgeries: "Schedule Surgical Consultation",
    labtests: "Book Lab Test",
    diagnostics: "Schedule Diagnostic Test",
    healthcare: "Healthcare Service Request",
    nursingcare: "Nursing Care Service",
    ambulanceservice: "Ambulance Service Request",
    dentalservice: "Dental Service",
    medicalequipment: "Medical Equipment Enquiry",
    medicaltreatment: "Medical Treatment Consultation",
    homecare: "Homecare Service Request",
  };
  return titles[type] || "Service Request";
};

const RentModal = ({
  show,
  onClose,
  rentProduct,
  formData,
  onFormChange,
  productId,
  vendorId,
  variantId,
  userProfile,
  formType = "rentals",
  fixedType = "",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState({
    address: "",
    lat: null,
    lng: null,
  });

  const autocompleteRef = useRef(null);
  const navigate = useNavigate();

  const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    "AIzaSyBW_ML0ppoU2o_tsOmT5eMveCwCFP3AXHU";

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: libraries,
  });

  useEffect(() => {
    if (show && isLoaded) {
      detectUserLocation();
    }
  }, [show, isLoaded]);

  useEffect(() => {
    const handleScroll = (e) => {
      const isPacContainer =
        e.target?.classList?.contains &&
        e.target.classList.contains("pac-container");
      const isPacItem = e.target?.closest && e.target.closest(".pac-container");

      if (isPacContainer || isPacItem) {
        return;
      }

      if (
        document.activeElement &&
        document.activeElement.tagName === "INPUT" &&
        document.activeElement.closest(".modal")
      ) {
        document.activeElement.blur();
      }
    };

    if (show) {
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [show]);

  const getAddressFromCoordinates = async (lat, lng) => {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`,
      );
      const data = await res.json();
      if (data.status === "OK" && data.results && data.results.length > 0) {
        return data.results[0].formatted_address || "Unknown Location";
      }
      return "Unknown Location";
    } catch (err) {
      return "Location not available";
    }
  };

  const detectUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const address = await getAddressFromCoordinates(lat, lng);

        const locationData = {
          location: {
            lat,
            lng,
            address,
          },
          address: address,
          lat: lat,
          lng: lng,
        };

        setLocation(locationData);

        onFormChange({
          target: {
            name: "deliveryAddress",
            value: address,
          },
        });
      },
      () => toast.error("Location permission denied. Please allow access."),
      { enableHighAccuracy: true },
    );
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place?.geometry?.location) {
        const locationData = {
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            address: place.formatted_address || place.name || "",
          },
          address: place.formatted_address || place.name || "",
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };

        setLocation(locationData);

        onFormChange({
          target: {
            name: "deliveryAddress",
            value: locationData.address,
          },
        });
      }
    }
  };

  if (!show || !rentProduct) return null;

  const calculateDays = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1;
  };

  const calculateTotalPrice = () => {
    const days = calculateDays(formData.startDate, formData.endDate);
    const pricePerDay = rentProduct.price || rentProduct.discountprice || 0;
    return days * pricePerDay;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const token = localStorage.getItem("medicomparestoken");
    if (!token) {
      toast.error("Please login to submit");
      navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      await axiosUserInstance.post(
        "lead/create",
        {
          name: userProfile
            ? `${userProfile.first_name || null} ${
                userProfile.last_name || null
              }`.trim()
            : null,
          phone:
            formData.phone || formData.mobile || userProfile?.phone || null,
          email: formData.email || userProfile?.email || null,
          idUpload: formData.idUpload,
          address: formData.deliveryAddress,
          productId,
          vendorId,
          variantId,
          startDate: formData.startDate,
          endDate: formData.endDate,
          totalDays: calculateDays(formData.startDate, formData.endDate),
          totalPrice: calculateTotalPrice(),
          pricePerDay: rentProduct.price || rentProduct.discountprice || 0,
          date: formData.date,
          leadSource: "Website",
          leadStage: "New",
          formType,
          status: "active",
          location: location.location,
          serviceType: fixedType,
          paymentType: formData.paymentType,
          rentalPlan: formData.rentalPlan,
          fixedDeposit: formData.fixedDeposit,
          returnCharges: formData.returnCharges,
          deliveryCharges: formData.deliveryCharges,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      toast.success("Rental request submitted successfully!");
      onClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to submit rental request",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const modalContent = (
    <div
      className="modal fade show"
      style={{
        display: "block",
        backgroundColor: "rgba(0,0,0,0.88)",
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 999999999,
        backdropFilter: "blur(2px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="modal-content shadow-lg"
          style={{
            borderRadius: "12px",
            overflow: "hidden",
            border: "none",
          }}
        >
          <div className="modal-body p-0">
            <div className="row g-0">
              <div className="col-md-12 bg-white">
                <div className="p-1 p-md-4 d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">{getModalTitle(fixedType)}</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={onClose}
                    ></button>
                  </div>

                  <div
                    className="mb-3 pb-3"
                    style={{
                      borderBottom: "1px solid rgba(125, 46, 255, 0.1)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      {rentProduct.tabletdetails?.files?.[0] && (
                        <img
                          src={getImageUrl(rentProduct.tabletdetails.files[0])}
                          alt={rentProduct.tabletdetails?.name || "Product"}
                          style={{
                            width: "50px",
                            height: "50px",
                            borderRadius: "8px",
                            objectFit: "cover",
                            border: "2px solid rgba(125, 46, 255, 0.2)",
                            flexShrink: 0,
                          }}
                        />
                      )}
                      <div>
                        <h5
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            margin: 0,
                            marginBottom: "4px",
                          }}
                        >
                          {rentProduct.tabletdetails?.name || "Product"}
                        </h5>
                        <p
                          style={{
                            fontSize: "12px",
                            color: "#6b7280",
                            margin: 0,
                          }}
                        >
                          {formData.startDate && formData.endDate && (
                            <span>
                              {calculateDays(
                                formData.startDate,
                                formData.endDate,
                              )}{" "}
                              days
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  {rentProduct.vendordetails && (
                    <div
                      className="mb-3 pb-3"
                      style={{
                        borderBottom: "1px solid rgba(125, 46, 255, 0.1)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        {rentProduct.vendordetails.bussiness_image?.[0]
                          ?.url && (
                          <img
                            alt="Vendor"
                            src={getImageUrl(
                              rentProduct.vendordetails.bussiness_image[0].url,
                            )}
                            style={{
                              width: 50,
                              height: 50,
                              borderRadius: 8,
                              objectFit: "cover",
                              border: "2px solid rgba(125, 46, 255, 0.2)",
                              flexShrink: 0,
                            }}
                          />
                        )}

                        <div style={{ flex: "1 1 0%", minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 400,
                              color: "rgb(26, 26, 26)",
                              marginBottom: 4,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            {rentProduct.vendordetails.name || "Vendor"}
                          </div>

                          {rentProduct.vendordetails.address && (
                            <div
                              style={{
                                fontSize: "12px",
                                color: "rgb(107, 114, 128)",
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <i
                                className="fas fa-map-marker-alt"
                                style={{ fontSize: 10 }}
                              />
                              <span
                                style={{
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {rentProduct.vendordetails.address}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <form className="d-flex flex-column" onSubmit={handleSubmit}>
                    <div className="row g-2">
                      {fixedType == "medicalequipment" && (
                        <>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Start Date <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              name="startDate"
                              value={formData.startDate}
                              onChange={onFormChange}
                              min={new Date().toISOString().split("T")[0]}
                              required
                            />
                          </div>

                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              End Date <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              className="form-control"
                              name="endDate"
                              value={formData.endDate}
                              onChange={onFormChange}
                              min={
                                formData.startDate ||
                                new Date().toISOString().split("T")[0]
                              }
                              required
                            />
                          </div>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Phone Number{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="tel"
                              name="phone"
                              className="form-control"
                              placeholder="Enter phone number"
                              required
                              value={formData.phone}
                              onChange={onFormChange}
                            />
                          </div>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Email Address (Optional)
                            </label>
                            <input
                              type="email"
                              name="email"
                              className="form-control"
                              placeholder="your.email@example.com"
                              value={formData.email}
                              onChange={onFormChange}
                            />
                          </div>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Payment Type{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <select
                              name="paymentType"
                              className="form-select"
                              value={formData.paymentType}
                              onChange={onFormChange}
                              required
                            >
                              <option value="">Select</option>
                              <option value="one time payment">
                                One Time Payment
                              </option>
                              <option value="recurring payment">
                                Recurring Payment
                              </option>
                            </select>
                          </div>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Rental Plan <span className="text-danger">*</span>
                            </label>
                            <select
                              name="rentalPlan"
                               value={formData.rentalPlan}
                              onChange={onFormChange}
                              required
                              className="form-select"
                            >
                              <option value="">Select</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                              <option value="yearly">Yearly</option>
                            </select>
                          </div>
                          {(formData.paymentType === "recurring payment" || !formData.paymentType) && (
                          <div className="col-12 mb-3">
                            <label className="form-label">
                              {formData.rentalPlan === "yearly" 
                                ? "Fixed Yearly Deposit" 
                                : formData.rentalPlan === "monthly" 
                                ? "Fixed Monthly Deposit"
                                : formData.rentalPlan === "weekly"
                                ? "Fixed Weekly Deposit"
                                : "Fixed Deposit"} <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="fixedDeposit"
                              placeholder={`Enter ${formData.rentalPlan === "yearly" 
                                ? "yearly" 
                                : formData.rentalPlan === "monthly" 
                                ? "monthly"
                                : formData.rentalPlan === "weekly"
                                ? "weekly"
                                : ""} deposit amount`}
                              className="form-control"
                              required={formData.paymentType === "recurring payment"}
                              value={formData.fixedDeposit}
                              onChange={onFormChange}
                            />
                          </div>
                          )}
                            <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Retun Charges{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="returnCharges"
                              className="form-control"
                              placeholder="Enter Return Charges"
                              required
                              value={formData.returnCharges}
                              onChange={onFormChange}
                            />
                          </div>
                            <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Fitting/Delivery Charges{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="number"
                              name="deliveryCharges"
                              className="form-control"
                              placeholder="Enter Fitting/Delivery Charges"
                              required
                              value={formData.deliveryCharges}
                              onChange={onFormChange}
                            />
                          </div>
                          {/* <div className="col-12 mb-3">
                            <label className="form-label">
                              ID Upload <span className="text-danger">*</span>
                            </label>
                            <input
                              type="file"
                              name="idUpload"
                              className="form-control"
                              required
                              onChange={onFormChange}
                            />
                            <small className="text-muted">
                              Aadhar or PAN card
                            </small>
                          </div> */}
                          <div className="col-12 mb-3">
                            <label className="form-label">
                              Delivery Address{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div style={{ position: "relative" }}>
                              {isLoaded ? (
                                <Autocomplete
                                  onLoad={(autocomplete) =>
                                    (autocompleteRef.current = autocomplete)
                                  }
                                  onPlaceChanged={onPlaceChanged}
                                  options={{
                                    componentRestrictions: { country: "in" },
                                    fields: [
                                      "formatted_address",
                                      "geometry",
                                      "name",
                                      "place_id",
                                      "address_components",
                                    ],
                                    types: ["geocode", "establishment"],
                                  }}
                                >
                                  <input
                                    type="text"
                                    className="form-control"
                                    autoComplete="off"
                                  />
                                </Autocomplete>
                              ) : (
                                <input
                                  type="text"
                                  className="form-control"
                                  name="deliveryAddress"
                                  value={formData.deliveryAddress}
                                  onChange={onFormChange}
                                  placeholder="Loading address autocomplete..."
                                  required
                                  disabled
                                />
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {fixedType !== "medicalequipment" && (
                        <>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Date <span className="text-danger">*</span>
                            </label>
                            <input
                              type="date"
                              min={new Date().toISOString().split("T")[0]}
                              name="date"
                              className="form-control"
                              placeholder="Enter your full name"
                              required
                              value={formData.date}
                              onChange={onFormChange}
                            />
                          </div>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Full Name <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              className="form-control"
                              placeholder="Enter your full name"
                              required
                              value={formData.name}
                              onChange={onFormChange}
                            />
                          </div>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Phone Number{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="tel"
                              name="mobile"
                              className="form-control"
                              placeholder="Enter phone number"
                              required
                              value={formData.mobile}
                              onChange={onFormChange}
                            />
                          </div>
                          <div className="col-md-6 col-12 mb-3">
                            <label className="form-label">
                              Email Address (Optional)
                            </label>
                            <input
                              type="email"
                              name="email"
                              className="form-control"
                              placeholder="your.email@example.com"
                              value={formData.email}
                              onChange={onFormChange}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-md-12 mb-3">
                        <div className="form-check">
                          <input
                            type="checkbox"
                            name="agreeContact"
                            className="form-check-input"
                            id="agreeContactCheck"
                            required
                            onChange={onFormChange}
                          />
                          <label
                            className="form-check-label"
                            htmlFor="agreeContactCheck"
                          >
                            Accept Terms and Conditions{" "}
                            <span className="text-danger">*</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="text-center mt-2">
                      <button
                        type="submit"
                        className="btn btn-primary rounded-pill w-100"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? "Submitting..."
                          : "Submit Rental Request"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`.pac-container { 
          z-index: 2147483647 !important;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          margin-top: 4px;
        }
        .pac-item {
          padding: 8px 12px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .pac-item:hover {
          background-color: #f8f9fa;
        }
        .pac-item-query {
          font-size: 0.875rem;
          color: #212529;
        }
        .pac-icon {
          margin-right: 8px;
        }`}</style>
      {typeof document !== "undefined"
        ? createPortal(modalContent, document.body)
        : null}
    </>
  );
};

export default RentModal;
