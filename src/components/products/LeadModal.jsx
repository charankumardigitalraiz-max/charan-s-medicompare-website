import { BaseModal, FormField, Button } from "../ui";

const LeadModal = ({ show, onClose, formData, onChange, onSubmit }) => {
  return (
    <BaseModal
      show={show}
      onClose={onClose}
      title="Get Quote Information"
      size="md"
    >
      <form className="d-flex flex-column" onSubmit={onSubmit}>
        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Date"
              name="date"
              type="date"
              value={formData.date}
              onChange={onChange}
              required
            />
          </div>
          <div className="col-md-6">
            <FormField
              label="Name"
              name="name"
              type="text"
              value={formData.name}
              onChange={onChange}
              placeholder="Enter full name"
              required
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Mobile Number"
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={onChange}
              placeholder="Enter 10-digit mobile number"
              pattern="[0-9]{10}"
              required
            />
          </div>
          <div className="col-md-6">
            <FormField
              label="Policy Number"
              name="policyNumber"
              type="text"
              value={formData.policyNumber}
              onChange={onChange}
              placeholder="Enter policy number"
              required
            />
          </div>
        </div>

        <div className="row">
          <div className="col-md-6">
            <FormField
              label="Relation"
              name="relation"
              type="select"
              value={formData.relation}
              onChange={onChange}
              options={[
                { value: "self", label: "Self" },
                { value: "spouse", label: "Spouse" },
                { value: "other", label: "Other" },
              ]}
              required
            />
          </div>
          <div className="col-md-12">
            <FormField
              label="Address"
              name="address"
              type="textarea"
              value={formData.address}
              onChange={onChange}
              placeholder="Enter address"
              rows={4}
              required
            />
          </div>
        </div>

        <div className="d-flex justify-content-end mt-3">
          <Button type="submit" variant="primary" className="rounded-pill">
            Save Details
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default LeadModal;

