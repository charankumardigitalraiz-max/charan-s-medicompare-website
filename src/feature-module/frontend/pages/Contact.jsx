import React, { useState } from "react";
import Home2Header from "../../../components/home/Header-k";
import Footer from "../../../components/home/Footer-f";
import { axiosCommonInstance } from "../../../Apiservice";
import toast, { Toaster } from "react-hot-toast";
import SEOHelmet from "../../../components/SEOHelmet";
import BackButton from "../../../components/ui/BackButton.jsx";

const Contact = () => {
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
      await axiosCommonInstance.post("contactus/create", form);
      toast.success("Message sent successfully!");
      setForm(getInitialForm());
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to send message"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <SEOHelmet page="contact" />
      <Toaster />
      <Home2Header />

      {/* Header Banner */}
      <div
        className="relative w-full overflow-hidden py-14 md:py-16 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/assets/Medicompares Background.png')" }}
      >
        <div className="relative z-10 max-w-[1400px] mx-auto px-4">
          <div className="absolute left-4 top-0">
            <BackButton className="z-20" />
          </div>
          <div className="text-center max-w-[600px] mx-auto pt-6">
            <span className="inline-block !text-[10px] !font-bold tracking-wider uppercase text-[#321961] bg-[#321961]/10 px-3 py-1 rounded-full mb-3">
              We&apos;re here to help
            </span>
            <h2 className="!text-2xl md:!text-3xl !font-bold !text-gray-900 leading-snug m-0">
              Contact Us
            </h2>
            <p className="!text-[13px] md:!text-[14px] !text-gray-500 leading-relaxed mt-2 mb-0">
              Reach out for support, partnerships, or any questions about our healthcare services.
            </p>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <section className="bg-[#f8fafc] py-12 px-4">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-4 items-stretch">

            {/* Left Column: Contact details */}
            <div className="lg:col-span-5 flex flex-col justify-start">
              <div className="mb-6">
                <span className="inline-block !text-[10px] !font-bold tracking-wider uppercase text-[#321961] bg-[#321961]/10 px-3 py-1 rounded-full mb-2">
                  Get in touch
                </span>
                <h2 className="!text-xl md:!text-2xl !font-bold !text-gray-900 m-0">
                  Have Any Question?
                </h2>
                <p className="!text-[14px] !text-gray-500 leading-relaxed mt-1 mb-0">
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
                  className="flex items-start gap-4 p-5 mb-4 bg-white rounded-sm border border-gray-100 shadow-[0_4px_16px_rgba(15,23,42,0.04)] hover:border-[#321961]/30 hover:shadow-[0_8px_24px_rgba(128,89,202,0.08)] transition-all duration-200"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#321961]/10 text-[#321961] flex items-center justify-center text-xl shrink-0">
                    <i className={`isax ${item.icon}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="!text-[15px] !font-bold !text-gray-900 m-0 mb-1">
                      {item.title}
                    </h4>
                    {item.lines?.map((line) => (
                      <p
                        key={line}
                        className="!text-[13px] !text-gray-500 leading-normal m-0"
                      >
                        {line}
                      </p>
                    ))}
                    {item.links?.map((link) => (
                      <p key={link.href} className="m-0 mt-0.5">
                        <a
                          href={link.href}
                          className="!text-[13px] !font-semibold text-[#321961] hover:text-[#6d4db8] transition-colors"
                        >
                          {link.label}
                        </a>
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Contact Form */}
            <div className="lg:col-span-7 flex">
              <div className="w-full bg-white rounded-sm  shadow-[0_8px_30px_rgba(15,23,42,0.02)] p-6 md:p-8">
                <h3 className="!text-lg md:!text-xl !font-bold !text-gray-900 m-0 mb-1">
                  Send us a message
                </h3>
                <p className="!text-[13px] !text-gray-500 m-0 mb-6">
                  We&apos;ll get back to you as soon as possible.
                </p>

                <form onSubmit={onSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { name: "name", label: "Name", type: "text", placeholder: "Enter your full name", required: true },
                      { name: "email", label: "Email", type: "email", placeholder: "Enter your email address", required: true },
                      { name: "phone", label: "Phone Number", type: "tel", placeholder: "Enter your phone number", required: true },
                      { name: "services", label: "Services", type: "text", placeholder: "What can we help you with?", required: false },
                    ].map((field) => (
                      <div key={field.name} className="flex flex-col">
                        <label className="!text-[12px] !font-semibold text-gray-700 mb-1.5">
                          {field.label}
                        </label>
                        <input
                          type={field.type}
                          name={field.name}
                          value={form[field.name]}
                          onChange={onChange}
                          placeholder={field.placeholder}
                          required={field.required}
                          className="w-full px-3.5 py-2.5 !text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-[10px] outline-none focus:border-[#321961] focus:ring-1 focus:ring-[#321961] focus:bg-white transition-all placeholder-gray-400"
                        />
                      </div>
                    ))}
                    <div className="col-span-1 md:col-span-2 flex flex-col">
                      <label className="!text-[12px] !font-semibold text-gray-700 mb-1.5">
                        Message
                      </label>
                      <textarea
                        rows={5}
                        name="message"
                        value={form.message}
                        onChange={onChange}
                        placeholder="Write your message here"
                        required
                        className="w-full px-3.5 py-2.5 !text-[13px] text-gray-900 bg-gray-50 border border-gray-200 rounded-[10px] outline-none focus:border-[#321961] focus:ring-1 focus:ring-[#321961] focus:bg-white transition-all placeholder-gray-400 resize-none min-h-[110px]"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 !text-[13px] !font-bold !text-white !rounded-[10px] border-none cursor-pointer shadow-sm transition-all duration-200 hover:-translate-y-[1px]"
                        style={{
                          backgroundColor: isSubmitting ? "#a78bfa" : "#321961",
                          boxShadow: "0 4px 12px rgba(128, 89, 202, 0.15)",
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

          {/* Map Section */}
          <div className="mt-8 md:mt-10">
            <div className="rounded-sm overflow-hidden  shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
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
      </section>

      <Footer />
    </>
  );
};

export default Contact;
