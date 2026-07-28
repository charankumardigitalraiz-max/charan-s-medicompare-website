import React, { useState } from "react";
import Home2Header from "../../../components/home/Header-k";
import Footer from "../../../components/home/Footer-f";
import { axiosCommonInstance } from "../../../Apiservice";
import toast, { Toaster } from "react-hot-toast";
import SEOHelmet from "../../../components/SEOHelmet";

const Contact = () => {
// ... form logic
  const getInitialForm = () => ({
    name: "",
    email: "",
    phone: "",
    services: "",
    message: "",
  });

  const [form, setForm] = useState(getInitialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await axiosCommonInstance.post(
        "contact-form/create",
        form,
      );
      const isSuccess = response?.data?.success !== false;
      if (isSuccess) {
        toast.success("Message sent successfully.");
        setForm(getInitialForm());
      } else {
        toast.error(response?.data?.message || "Something went wrong. Please try again.");
      }
    } catch (err) {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHelmet page="contact" />
      <Toaster />
      <Home2Header />
      <div
        className="breadcrumb-bar"
        style={{
          backgroundImage: "url('/assets/Medicompares Background.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          padding: "96px 0 36px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div className="container" style={{ position: "relative", zIndex: 1 }}>
          <div className="row justify-content-center">
            <div className="col-lg-8 col-md-10 col-12 text-center">
              <div className="page-breadcrumb">
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "1.4px",
                    textTransform: "uppercase",
                    color: "#8059ca",
                    background: "rgba(128, 89, 202, 0.1)",
                    padding: "5px 14px",
                    borderRadius: "20px",
                    marginBottom: "12px",
                  }}
                >
                  We&apos;re here to help
                </span>

                <h2
                  className="breadcrumb-title"
                  style={{
                    fontSize: "clamp(26px, 4vw, 34px)",
                    // fontWeight: 400,
                    color: "#0f172a",
                    margin: "0 0 10px",
                    lineHeight: 1.25,
                  }}
                >
                  Contact Us
                </h2>

                <p
                  style={{
                    fontSize: "15px",
                    color: "#64748b",
                    margin: "0 auto",
                    maxWidth: "460px",
                    lineHeight: 1.6,
                    fontWeight: 400,
                  }}
                >
                  Reach out for support, partnerships, or any questions about our healthcare services.
                </p>

                <div
                  style={{
                    width: "52px",
                    height: "3px",
                    borderRadius: "3px",
                    background: "linear-gradient(90deg, #8059ca, #a78bfa)",
                    margin: "18px auto 0",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>


      <section
        className="contact-section"
        style={{ padding: "48px 0 64px", }}
      >
        <div className="container">
          <div className="row g-4 align-items-stretch">
            <div className="col-lg-5 col-md-12">
              <div style={{ marginBottom: "24px" }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "11px",
                    fontWeight: 600,
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                    color: "#8059ca",
                    background: "rgba(128, 89, 202, 0.1)",
                    padding: "5px 14px",
                    borderRadius: "20px",
                    marginBottom: "12px",
                  }}
                >
                  Get in touch
                </span>
                <h2
                  style={{
                    fontSize: "clamp(22px, 3vw, 28px)",
                    fontWeight: 500,
                    color: "#0f172a",
                    margin: "0 0 8px",
                    lineHeight: 1.3,
                  }}
                >
                  Have Any Question?
                </h2>
                <p style={{ fontSize: "15px", color: "#64748b", margin: 0, lineHeight: 1.6 }}>
                  Fill out the form or reach us directly using the details below.
                </p>
              </div>

              {[
                {
                  icon: "isax-location5",
                  title: "Address",
                  lines: [
                    "2nd Floor, H.No. 10-5-2/7/92, G-3,",
                    "Banjara Hills Rd No. 1, Opp. Banjara Function Hall,",
                    "Hyderabad, Telangana – 500004",
                  ],
                },
                {
                  icon: "isax-call5",
                  title: "Phone Number",
                  links: [
                    { href: "tel:+919010357778", label: "+91 9010 357 778" },
                    { href: "tel:+919010347778", label: "+91 9010 347 778" },
                  ],
                },
                {
                  icon: "isax-sms5",
                  title: "Email Address",
                  links: [
                    { href: "mailto:info@medicompares.com", label: "info@medicompares.com" },
                  ],
                },
              ].map((item) => (
                <div
                  key={item.title}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                    padding: "18px 20px",
                    marginBottom: "14px",
                    background: "#ffffff",
                    borderRadius: "14px",
                    border: "1px solid #f1f5f9",
                    boxShadow: "0 4px 16px rgba(15, 23, 42, 0.04)",
                    transition: "all 0.25s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(128, 89, 202, 0.35)";
                    e.currentTarget.style.boxShadow = "0 8px 24px rgba(128, 89, 202, 0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#f1f5f9";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(15, 23, 42, 0.04)";
                  }}
                >
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      minWidth: "48px",
                      borderRadius: "12px",
                      background: "rgba(128, 89, 202, 0.1)",
                      color: "#8059ca",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "22px",
                    }}
                  >
                    <i className={`isax ${item.icon}`} />
                  </div>
                  <div>
                    <h4
                      style={{
                        fontSize: "16px",
                        fontWeight: 600,
                        color: "#0f172a",
                        margin: "0 0 6px",
                      }}
                    >
                      {item.title}
                    </h4>
                    {item.lines?.map((line) => (
                      <p
                        key={line}
                        style={{ fontSize: "13px", color: "#64748b", margin: 0, lineHeight: 1.55 }}
                      >
                        {line}
                      </p>
                    ))}
                    {item.links?.map((link) => (
                      <p key={link.href} style={{ margin: "0 0 4px" }}>
                        <a
                          href={link.href}
                          style={{
                            fontSize: "14px",
                            color: "#8059ca",
                            textDecoration: "none",
                            fontWeight: 500,
                          }}
                        >
                          {link.label}
                        </a>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="col-lg-7 col-md-12 d-flex">
              <div
                style={{
                  width: "100%",
                  background: "#ffffff",
                  borderRadius: "16px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 1px 2px rgba(15, 23, 42, 0.03), 0 2px 8px rgba(15, 23, 42, 0.04)",
                  padding: "28px 28px 24px",
                }}
              >
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 600,
                    color: "#0f172a",
                    margin: "0 0 6px",
                  }}
                >
                  Send us a message
                </h3>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#64748b",
                    margin: "0 0 24px",
                  }}
                >
                  We&apos;ll get back to you as soon as possible.
                </p>

                <form onSubmit={onSubmit}>
                  <div className="row g-3">
                    {[
                      { name: "name", label: "Name", type: "text", placeholder: "Enter your full name", required: true, col: 6 },
                      { name: "email", label: "Email", type: "email", placeholder: "Enter your email address", required: true, col: 6 },
                      { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter your phone number", required: true, col: 6 },
                      { name: "services", label: "Services", type: "text", placeholder: "What can we help you with?", required: false, col: 6 },
                    ].map((field) => (
                      <div key={field.name} className={`col-md-${field.col}`}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "13px",
                            fontWeight: 500,
                            color: "#334155",
                            marginBottom: "6px",
                          }}
                        >
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={onChange}
                          placeholder={field.placeholder}
                          required={field.required}
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            fontSize: "14px",
                            color: "#0f172a",
                            background: "#f8fafc",
                            border: "1px solid #e2e8f0",
                            borderRadius: "10px",
                            outline: "none",
                            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = "#8059ca";
                            e.target.style.boxShadow = "0 0 0 3px rgba(128, 89, 202, 0.12)";
                            e.target.style.background = "#fff";
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = "#e2e8f0";
                            e.target.style.boxShadow = "none";
                            e.target.style.background = "#f8fafc";
                          }}
                        />
                      </div>
                    ))}
                    <div className="col-12">
                      <label
                        style={{
                          display: "block",
                          fontSize: "13px",
                          fontWeight: 500,
                          color: "#334155",
                          marginBottom: "6px",
                        }}
                      >
                        Message
                      </label>
                      <textarea
                        rows={5}
                        name="message"
                        value={form.message}
                        onChange={onChange}
                        placeholder="Write your message here"
                        required
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          fontSize: "14px",
                          color: "#0f172a",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: "10px",
                          outline: "none",
                          resize: "none",
                          minHeight: "120px",
                          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = "#8059ca";
                          e.target.style.boxShadow = "0 0 0 3px rgba(128, 89, 202, 0.12)";
                          e.target.style.background = "#fff";
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = "#e2e8f0";
                          e.target.style.boxShadow = "none";
                          e.target.style.background = "#f8fafc";
                        }}
                      />
                    </div>
                    <div className="col-12">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        style={{
                          padding: "11px 28px",
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "#ffffff",
                          background: isSubmitting ? "#a78bfa" : "#8059ca",
                          border: "none",
                          borderRadius: "10px",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                          boxShadow: "0 2px 6px rgba(128, 89, 202, 0.2)",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSubmitting) e.currentTarget.style.background = "#6d4db8";
                        }}
                        onMouseLeave={(e) => {
                          if (!isSubmitting) e.currentTarget.style.background = "#8059ca";
                        }}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          <div className="row mt-4 mt-lg-5">
            <div className="col-12">
              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 8px 30px rgba(15, 23, 42, 0.06)",
                }}
              >
                <iframe
                  title="MediCompares office location"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.9646800885985!2d78.44641067516547!3d17.413482583478192!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb9739d018d141%3A0xca5e19ebb22674ed!2s2nd%20Floor%2C%20H%2C%20Reliance%20Majestic%2C%208-2-626%2C%20Banjara%20Hills%20Rd%20Number%201%2C%20near%20City%20Center%2C%20Avenue%204%2C%20Banjara%20Hills%2C%20Hyderabad%2C%20Telangana%20500034!5e0!3m2!1sen!2sin!4v1772098043262!5m2!1sen!2sin"
                  width="100%"
                  height={420}
                  style={{ border: 0, display: "block" }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Contact;
