import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { axiosUserInstance } from "../../../../Apiservice";
import toast from "react-hot-toast";

const ConsultationModal = ({
  show,
  onClose,
  formData,
  onFormChange,
  productId,
  vendorId,
  variantId,
  formType = "consultation",
  title = "Book a Consultation",
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  if (!show) return null;

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
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          category: formData.category,
          date: formData.date,
          productId,
          vendorId,
          variantId,
          leadSource: "Website",
          leadStage: "New",
          formType,
          status: "active",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      toast.success(`${formType === "appointment" ? "Appointment" : "Consultation"} request submitted successfully!`);
      onClose();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed to submit request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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
        zIndex: "999999999",
        backdropFilter: "blur(2px)",
      }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
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
              <div className="col-md-4 d-none d-md-block">
                <img
                  src="/assets/aiDoctor.png"
                  alt=""
                  style={{
                    height: "100%",
                    width: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>

              <div className="col-md-8 bg-white p-1 p-md-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">{title}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={onClose}
                  ></button>
                </div>

                <form className="d-flex flex-column" onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Date <span className="text-danger">*</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        required
                        value={formData.date}
                        onChange={onFormChange}
                      />
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control"
                        placeholder="Enter full name"
                        required
                        value={formData.name}
                        onChange={onFormChange}
                      />
                    </div>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Mobile Number <span className="text-danger">*</span>
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control"
                        placeholder="Enter mobile number"
                        pattern="[0-9]{10}"
                        required
                        value={formData.phone}
                        onChange={onFormChange}
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">
                        Service Type <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="category"
                        className="form-control"
                        placeholder="Enter service type"
                        required
                        value={formData.category}
                        onChange={onFormChange}
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">
                      Description <span className="text-danger">*</span>
                    </label>
                    <textarea
                      name="address"
                      className="form-control"
                      rows="3"
                      placeholder="Enter Description"
                      required
                      value={formData.address}
                      onChange={onFormChange}
                    ></textarea>
                  </div>

                  <div className="d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary rounded-pill"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Submitting..." : "Submit"} <i className="fas fa-check-circle"></i>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationModal;
