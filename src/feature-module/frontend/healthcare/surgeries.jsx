import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Slider from "react-slick";
import { healthcareSlickAutoplay } from "./healthcareSliderSettings.jsx";
import { Link, useNavigate } from "react-router-dom";
import { axiosCommonInstance, axiosUserInstance } from "../../../Apiservice";
import { getImageUrl } from "../../../utils/index";
import toast from "react-hot-toast";
import { CartQuantityControls } from "../../../components/ui";
import LeadModal from "../pharmacy/products-components/LeadModal.jsx";
import RentModal from "../pharmacy/products-components/RentModal.jsx";
import ConsultationModal from "../pharmacy/products-components/ConsultationModal.jsx";
import AppointmentModal from "../pharmacy/products-components/AppointmentModal.jsx";
import { useProfile } from "../../../context/ProfileContext";
import { useLocation } from "../../../context/LocationContext";
import SEOHelmet from "../../../components/SEOHelmet";
const surgeries = ({
  vendorproducts,
  topdoctors,
  categoryvendor,
  currentService,
  middleBanners,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [vendorList, setVendorList] = useState([]);
  const [categories, setCategories] = useState([]);
  const { selectedPincode } = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [showModal1, setShowModal1] = useState(false);
  const [surgeriesData, setsurgeriesData] = useState([]);
  const [doctorForm, setdoctorForm] = useState({
    name: "",
    phone: "",
    age: "",
    city: "",
    message: "",
    preferredTime: "",
    doctorId: "",
    email: "",
  });
  const INITIAL_SSA_FORM = {
    name: "",
    age: "",
    gender: "",
    phone: "",
    relation: "",
    email: "",
    surgeryType: "",
    city: "",
    condition: "",
    agree: false,
  };
  const [form, setform] = useState(INITIAL_SSA_FORM);
  // Modal states
  const [showLeadModal, setShowLeadModal] = useState(false);
  const [showRentModal, setShowRentModal] = useState(false);
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [rentProduct, setRentProduct] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [currentLeadData, setCurrentLeadData] = useState(null);
  const { profile: userProfile } = useProfile();

  // Form data states
  const INITIAL_LEAD_FORM = {
    date: "",
    name: "",
    email: "",
    mobile: "",
    policyNumber: "",
    relation: "",
    address: "",
  };
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

  const vendors = vendorproducts || [];
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem("medicomparestoken");

  const handleTabClick = async (id, index) => {
    setActiveTab(index);

    try {
      const pincodeParam = selectedPincode ? `?pincode=${selectedPincode}` : "";
      const response = await axiosCommonInstance.get(
        `service/vendor/${id}${pincodeParam}`,
      );
      const vendorProducts = response.data?.data?.vendorproducts || [];
      const mappedVendors = vendorProducts.map((item) => {
        return {
          ...item,
          bookingType: item?.bookingType || "cart",
          variants: item?.variant || [],
          stock: item?.stock,
        };
      });

      setVendorList(mappedVendors);
    } catch (err) {
      toast.error("Failed to load vendors");
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setform((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const handleChange1 = (e) => {
    const { name, value } = e.target;
    setsurgeriesData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmitLead = async (e) => {
    e.preventDefault();

    if (!isLoggedIn) {
      toast.error("Please login to submit surgery assistance request");
      navigate("/login");
      return;
    }

    if (!form.name || !form.name.trim()) {
      toast.error("Please enter your full name");
      return;
    }

    if (!form.age || Number(form.age) <= 0 || Number(form.age) > 120) {
      toast.error("Please enter a valid age (1-120)");
      return;
    }

    if (!form.gender) {
      toast.error("Please select a gender");
      return;
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!form.phone || !phoneRegex.test(form.phone)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!form.relation || !form.relation.trim()) {
      toast.error("Please enter relation");
      return;
    }

    if (form.email && form.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(form.email.trim())) {
        toast.error("Please enter a valid email address");
        return;
      }
    }

    if (!form.surgeryType) {
      toast.error("Please select a surgery type");
      return;
    }

    if (!form.city || !form.city.trim()) {
      toast.error("Please enter city / location");
      return;
    }

    if (!form.condition || !form.condition.trim()) {
      toast.error("Please enter condition / problem description");
      return;
    }

    if (!form.agree) {
      toast.error("You must agree to be contacted before submitting");
      return;
    }

    try {
      const leadPayload = {
        name: form.name.trim(),
        age: form.age,
        gender: form.gender,
        phone: form.phone.trim(),
        relation: form.relation.trim(),
        email: form.email ? form.email.trim() : "",
        address: `${form.city.trim()} - ${form.condition.trim()}`,
        city: form.city.trim(),
        surgeryType: form.surgeryType,
        condition: form.condition.trim(),
        timeline: form.timeline || "",
        category: form.category || "Surgeries",
        leadSource: "Website",
        status: "active",
      };

      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login");
        navigate("/login");
        return;
      }

      const res = await axiosUserInstance.post("lead/create", leadPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success(res?.data?.message || "Assistance request submitted successfully!");
      setform(INITIAL_SSA_FORM);
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to add lead",
      );
    }
  };

  const handleSubmitLead1 = async (e) => {
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }
    e.preventDefault();
    try {
      const leadPayload = {
        name: surgeriesData.name,
        phone: surgeriesData.phone,
        address: surgeriesData.address,
        category: surgeriesData.category,
        leadSource: "Website",
        status: "active",
      };

      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login");
        navigate("/login");
        return;
      }

      await axiosUserInstance.post("lead/create", leadPayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      toast.success("successfully");
      setsurgeriesData({
        date: "",
        time: "",
        name: "",
        phone: "",
        address: "",
        category: "",
      });
      toggleModal();
    } catch (err) {
      toast.error(
        err?.response?.data?.message || err?.message || "Failed to add lead",
      );
    }
  };

  const DoctorConsultaion = async (e) => {
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }
    e.preventDefault();
    try {
      const doctorPayload = {
        name: doctorForm.name,
        phone: doctorForm.phone,
        age: doctorForm.age,
        city: doctorForm.city,
        message: doctorForm.message,
        preferredTime: doctorForm.preferredTime,
        doctorId: doctorForm.doctorId,
        leadSource: "Website",
      };

      const token = localStorage.getItem("medicomparestoken");
      if (!token) {
        toast.error("Please login");
        navigate("/login");
        return;
      }

      const res = await axiosUserInstance.post(
        "consult-form/create",
        doctorPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      toast.success(res?.data?.message || "Consultation booked successfully!");
      setdoctorForm({
        age: "",
        message: "",
        name: "",
        phone: "",
        preferredTime: "",
        city: "",
        doctorId: "",
      });
      toggleModal1();
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || "Failed");
    }
  };

  const handleDoctorChnage = (e) => {
    const { name, value } = e.target;
    setdoctorForm((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleDoctorConsultationClick = (doctor) => {
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }

    setdoctorForm({
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      email: userProfile?.email || "",
      age: "",
      city: "",
      message: "",
      preferredTime: "",
      doctorId: doctor.id || doctor._id,
    });
    setShowModal1(true);
  };

  const toggleModal1 = () => {
    const isLoggedIn = !!localStorage.getItem("medicomparestoken");
    if (!showModal1 && !isLoggedIn) {
      toast.error("Please login");
      navigate("/login");
      return;
    }
    setShowModal1(!showModal1);
    if (!showModal1) {
      setdoctorForm({
        age: "",
        message: "",
        name: "",
        phone: "",
        preferredTime: "",
        city: "",
        doctorId: "",
      });
    }
  };

  const toggleModal = () => {
    const isLoggedIn = !!localStorage.getItem("medicomparestoken");
    if (!showModal && !isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }
    setShowModal(!showModal);
    if (!showModal) {
      setsurgeriesData({
        date: "",
        name: "",
        mobile: "",
        policyNumber: "",
        relation: "",
        address: "",
      });
    }
  };

  // Handler functions for vendor actions
  const handleAddLead = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login");
      navigate("/login");
      return;
    }

    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    setCurrentLeadData({ vendor, med, variantId });
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

  const handleBooking = async (vendor, med) => {
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
          vendorId: vendor.vendorId || vendor._id,
          packageId: null,
          type: "normal",
          bookingType: "buy_now",
        },
      ];

      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      navigate("/booking-process");
    } catch (error) {
      toast.error(
        error.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to create booking",
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleRentalBookinProcess = async (vendor, med) => {
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
          vendorId: vendor.vendorId || vendor._id,
          packageId: null,
          type: "normal",
          bookingType: "buy_now",
        },
      ];

      await axiosCommonInstance.post("cart/buynow/create", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      navigate("/rental-booking-process");
    } catch (error) {
      toast.error(
        error.response?.status === 401
          ? "Session expired. Please login again."
          : "Failed to create booking",
      );
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  };

  const handleSlots = async (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to select slot");
      navigate("/login");
      return;
    }
    await handleBooking(vendor, med);
  };

  const handleRentClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to rent equipment");
      navigate("/login");
      return;
    }

    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    const item = {
      tabletdetails: med,
      vendordetails: vendor?.bussinessdetails || vendor,
      variants: med.variant || [],
      price: med.price || 0,
      productId: med?._id || med?.id,
      vendorId: vendor?.vendorId || vendor?._id,
      variantId,
    };

    setRentProduct(item);
    setShowRentModal(true);
  };

  const handleConsultationClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    setConsultationFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      productId: med?._id || med?.id,
      vendorId: vendor?.vendorId || vendor?._id,
      variantId,
    });
    setShowConsultationModal(true);
  };

  const handleAppointmentClick = (vendor, med) => {
    if (!isLoggedIn) {
      toast.error("Please login to book appointment");
      navigate("/login");
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const variantId = med?.variant?.[0]?._id || med?.variants?.[0]?._id || null;
    setAppointmentFormData({
      date: today,
      name: userProfile
        ? `${userProfile.first_name || ""} ${userProfile.last_name || ""
          }`.trim()
        : "",
      phone: userProfile?.phone || "",
      category: "",
      address: "",
      productId: med?._id || med?.id,
      vendorId: vendor?.vendorId || vendor?._id,
      variantId,
    });
    setShowAppointmentModal(true);
  };

  // Form handlers
  const handleRentFormChange = (e) => {
    const { name, value } = e.target;
    setRentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRentSubmit = (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to book service");
      navigate("/login");
      return;
    }
    toast.success("Rental request submitted successfully!");
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
  };

  const handleConsultationFormChange = (e) => {
    const { name, value } = e.target;
    setConsultationFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleConsultationSubmit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error("Please login to book consultation");
      navigate("/login");
      return;
    }
    toast.success("Consultation request submitted successfully!");
    setShowConsultationModal(false);
    setConsultationFormData({
      date: "",
      name: "",
      phone: "",
      category: "",
      address: "",
    });
  };

  const handleAppointmentFormChange = (e) => {
    const { name, value } = e.target;
    setAppointmentFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitLeadNew = async (e) => {
    e.preventDefault();
    if (!currentLeadData?.med && !currentLeadData?.vendor) return;

    const { vendor, med } = currentLeadData;
    try {
      const token = localStorage.getItem("medicomparestoken");
      await axiosUserInstance.post(
        "lead/create",
        {
          name: leadFormData.name,
          email: leadFormData.email,
          phone: leadFormData.mobile,
          address: leadFormData.address,
          policyNumber: leadFormData.policyNumber,
          relation: leadFormData.relation,
          productId: med?._id || med?.id,
          vendorId: vendor._id || vendor.vendorId,
          variantId: null,
          leadSource: "Website",
          leadStage: "New",
          status: "active",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      toast.success("Lead added successfully!");
      setShowLeadModal(false);
      setLeadFormData(INITIAL_LEAD_FORM);
      setCurrentLeadData(null);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to add lead");
    }
  };

  const NextArrow = ({ onClick }) => {
    return (
      <div className="custom-arrow custom-next" onClick={onClick}>
        <i className="fas fa-chevron-right"></i>
      </div>
    );
  };

  const PrevArrow = ({ onClick }) => {
    return (
      <div className="custom-arrow custom-prev" onClick={onClick}>
        <i className="fas fa-chevron-left"></i>
      </div>
    );
  };

  const settings = {
    dots: false,
    infinite: false,
    slidesToShow: 5,
    slidesToScroll: 1,
    arrows: vendors.length > 1,
    rows: 1,
    ...healthcareSlickAutoplay,
    nextArrow: vendors.length > 1 ? <NextArrow /> : null,
    prevArrow: vendors.length > 1 ? <PrevArrow /> : null,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  const settings1 = {
    dots: true,
    infinite: false,
    slidesToShow: vendors.length === 1 ? 1 : 2,
    slidesToScroll: 1,
    arrows: false,
    rows: 1,
    centerMode: vendors.length === 1,
    centerPadding: "0px",
    ...healthcareSlickAutoplay,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: vendors.length === 1 ? 1 : 3,
          centerMode: vendors.length === 1,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: vendors.length === 1 ? 1 : 2,
          centerMode: vendors.length === 1,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          centerMode: true,
        },
      },
    ],
  };

  const hospitalSettings = {
    dots: false,
    infinite: false,
    slidesToShow: 5,
    slidesToScroll: 1,
    arrows: vendorList?.length > 1,
    rows: 1,
    ...healthcareSlickAutoplay,
    nextArrow: vendorList?.length > 1 ? <NextArrow /> : null,
    prevArrow: vendorList?.length > 1 ? <PrevArrow /> : null,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
        },
      },
      {
        breakpoint: 992,
        settings: {
          slidesToShow: 2,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
        },
      },
    ],
  };

  useEffect(() => {
    if (categoryvendor?.length > 0) {
      const firstId =
        categoryvendor[0]?._id ||
        categoryvendor[0]?.id ||
        categoryvendor[0]?.catId;

      handleTabClick(firstId, 0);
    }
  }, [categoryvendor]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosCommonInstance.get("allcategory/surgeries");
        const data = res.data?.data?.allcategory || [];
        setCategories(data);
      } catch (err) {
        toast.error("Fetch error: " + err.message);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (showModal || showModal1) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showModal, showModal1]);

  return (
    <>
      <SEOHelmet page="surgeries" />
      <div
        className="main-wrapper home-sixteen home-ten overflow-hidden font-poppins"
        style={{
          fontFamily: "Poppins, sans-serif",
        }}
      >
        <section
          className="px-3 py-5 bg-[#E8E4F5] bg-[url('/assets/Medicompares%20Background.png')] bg-cover bg-center bg-no-repeat"
        >
          <div className="container-fluid">
            <div className="text-center mb-3">
              <h2
                className="text-[28px] font-bold inline-block bg-gradient-to-br from-[#8059ca] to-[#6d48b8] bg-clip-text text-transparent"
              >
                Meet Our Best Surgeons
              </h2>
              <p
                className="text-[15px] font-normal text-[#64748b]"
              >
                Consult with highly qualified and experienced surgeons
              </p>
            </div>
            {/* <div className="row justify-content-center mb-4 g-3">
            <div className="col-6 col-md-3">
              <select 
                className="form-select"
                value={selectedPincode}
                onChange={(e) => setSelectedPincode(e.target.value)}
              >
                <option value="">Select PinCode</option>
                <option value="110001">110001</option>
                <option value="110002">110002</option>
                <option value="110003">110003</option>
              </select>
            </div>
            <div className="col-6 col-md-3">
              <select className="form-select">
                <option>Select Surgery</option>
              </select>
            </div>
          </div> */}
            <div
              className="doctors-slider-container px-2 w-full"
            >
              <Slider {...settings}>
                {topdoctors?.slice(0, 14)?.map((doctor) => (
                  <div
                    key={doctor.id}
                    className="custom-surgeons-slide slider-card-wrapper"
                  >
                    <div className="surgeriesCard">
                       <div className="text-center">
                        <img
                          src={
                            doctor?.profileImage?.[0]
                              ? getImageUrl(doctor.profileImage[0])
                              : "/assets/default.png"
                          }
                          alt={doctor.name}
                        />
                      </div>
                      <div className="surgeriesCard-body">
                        <h6 title={doctor.name}>
                          {doctor.name.length > 22
                            ? doctor.name.substring(0, 22) + "..."
                            : doctor.name}
                        </h6>
                        <span className="doctor-specialty">
                          {doctor.position.length > 26
                            ? doctor.position.substring(0, 26) + "..."
                            : doctor.position}
                        </span>

                        <div className="meta-group">
                          <div className="meta">
                            <i
                              className="fa fa-user-md text-[#8059ca]"
                            ></i>
                            <span className="meta-text">
                              <span className="meta-text">
                                {doctor.experience}
                              </span>
                              <span
                                className="text-[10px] text-[#9ca3af] ml-[4px]"
                              >
                                Years Experience
                              </span>
                            </span>
                          </div>
                          {doctor.ratings && (
                            <div className="meta">
                              <i
                                className="fa fa-star text-[#fbbf24]"
                              ></i>
                              <span className="meta-text">
                                <span className="meta-text">
                                  {doctor.ratings}/5{" "}
                                </span>
                                {/* <span className="meta-text">(100+ reviews)</span> */}
                              </span>
                            </div>
                          )}
                          {/* <div className="meta">
                          <i
                            className="fa fa-hospital"
                            style={{ color: "#8059ca" }}
                          ></i>
                          <span className="meta-text">Apollo Hospital</span>
                        </div> */}
                          <div className="meta" title={doctor.address}>
                            <i
                              className="fa-solid fa-location-dot text-[#8059ca]"
                            ></i>
                            <span className="meta-text">
                              {doctor.address.length > 30
                                ? doctor.address.substring(0, 30) + "..."
                                : doctor.address}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex gap-2">
                          <a
                            className="btn-call no-underline text-white"
                            href="tel:+919010357778"
                          >
                            <i className="fa fa-phone"></i>
                            Call
                          </a>
                          <button
                            className="btn-enquiry"
                            onClick={() => handleDoctorConsultationClick(doctor)}
                          >
                            Get An Enquiry
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </Slider>
            </div>
            {/* <div className="text-center mt-4">
            <button className="btn top-vendor-badge rounded-pill px-4 border">
              View All <i class="fa fa-arrow-right" aria-hidden="true"></i>
            </button>
          </div> */}
          </div>
        </section>
        {/* Short banners */}
        {middleBanners?.length > 0 && (
          <section className="section welcome-section my-4 px-2">
            <div className="container-fluid mb-4">
              <div className="text-center mb-5">
                <h2
                  className="text-[28px] font-bold text-[#1a1a1a]"
                >
                  <i className="fas fa-bolt text-warning me-2"></i>
                  Offers & Promotions
                </h2>
              </div>
              {middleBanners.length > 1 ? (
                <Slider {...settings1}>
                  {middleBanners.map((image, index) => (
                    <div key={index} className="col-lg-4 col-md-6 d-flex">
                      <img
                        src={image.src}
                        alt={image.alt}
                        loading="lazy"
                        className="px-1 rounded-[10px]"
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <div className="col-lg-12 d-flex">
                  <img
                    src={middleBanners[0]?.src}
                    alt={middleBanners[0]?.alt}
                    title={middleBanners[0]?.alt}
                    loading="lazy"
                    className="px-1 rounded-[10px]"
                  />
                </div>
              )}
            </div>
          </section>
        )}
        {vendorList && vendorList.length > 0 && (
          <section className="px-3 py-4 bg-[#EBF1F6]">
            <div className="container-fluid">
              <div className="text-center mb-4">
                <h2
                  className="text-[28px] font-bold text-[#1a1a1a]"
                >
                  Top Surgery Hospitals
                </h2>
              </div>

              {/* tabs */}
              <div className="surgeryTabs">
                {categoryvendor.map((cat, idx) => (
                  <div
                    key={cat._id || cat.id || cat.catId || idx}
                    onClick={() =>
                      handleTabClick(cat._id || cat.id || cat.catId, idx)
                    }
                    className={`surgeryTab ${idx === activeTab ? "active bg-[#e0f2fe]" : "bg-white"} px-[20px] py-[10px] rounded-[20px] border border-solid border-[#e5e7eb] text-[#28328c] text-[14px] font-semibold cursor-pointer whitespace-nowrap flex items-center gap-[8px]`}
                  >
                    {cat.name}
                  </div>
                ))}
              </div>
              <div
                className="hospital-slider-container px-[5px]"
              >
                <Slider {...hospitalSettings} className="hospital-cards-slider">
                  {vendorList?.map((item) => {
                    const vendor = item.vendors;

                    if (!vendor) return null;

                    const handleVendorClick = (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const vendorId =
                        item?.vendorId ||
                        vendor?.vendorId ||
                        vendor?._id ||
                        vendor?.businessdetails?._id ||
                        vendor?.bussinessdetails?._id;
                      if (vendorId) {
                        sessionStorage.setItem("vendorId", vendorId);
                        const name =
                          vendor?.bussinessdetails?.name ||
                          vendor?.name ||
                          "Vendor Store";
                        const vendorSlug = name
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, "");
                        navigate(`/vendor-profile/${vendorSlug}`);
                      } else {
                        toast.error("Vendor ID not found", { item, vendor });
                      }
                    };

                    return (
                      <div key={vendor._id} className="slider-card-wrapper">
                        <div className="hospitalCard">
                          <div
                            className="cursor-pointer"
                            onClick={handleVendorClick}
                          >
                            <img
                              src={getImageUrl(vendor?.bussiness_image?.url)}
                              alt={vendor?.name}
                              title={vendor?.name}
                              loading="lazy"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = "/assets/default.png";
                              }}
                            />
                          </div>

                          <div
                            className="hospitalName text-dark cursor-pointer"
                            onClick={handleVendorClick}
                            title={vendor.name}
                          >
                            {vendor.name?.length > 30
                              ? vendor.name.substring(0, 30) + "..."
                              : vendor.name}
                          </div>

                          <div className="rating">
                            <i
                              className="fa-solid fa-star text-[#fbbf24]"
                            />{" "}
                            <span className="text-[#1a1a2e] font-semibold">
                              4.5/5
                            </span>{" "}
                            <span className="text-[10px] text-[#9ca3af]">
                              (50+)
                            </span>
                          </div>
                          <div className="location" title={vendor.address}>
                            <i
                              className="fa-solid fa-location-dot text-[#8059ca]"
                            />{" "}
                            {vendor.address?.length > 45
                              ? vendor.address
                              : vendor.address || "Location not available"}
                          </div>

                          <div className="mt-auto">
                            {(() => {
                              const bookingType =
                                item.vendors?.bookingType ||
                                vendor.bookingType ||
                                "cart";
                              const med = item.tabletdetails || item;

                              if (
                                bookingType === "leads" ||
                                bookingType === "lead"
                              ) {
                                return (
                                  <button
                                    className="btn-enquiry w-100"
                                    onClick={() => handleAddLead(vendor, med)}
                                  >
                                    <i className="fas fa-file-invoice-dollar me-2"></i>
                                    Get An Enquiry
                                  </button>
                                );
                              }

                              if (bookingType === "booking") {
                                return (
                                  <button
                                    className="btn-enquiry w-100"
                                    onClick={() => handleBooking(vendor, med)}
                                  >
                                    <i className="fas fa-calendar-check me-2"></i>
                                    Book Now
                                  </button>
                                );
                              }

                              if (bookingType === "slots") {
                                return (
                                  <button
                                    className="btn-enquiry w-100"
                                    onClick={() => handleSlots(vendor, med)}
                                  >
                                    <i className="fa-solid fa-clock me-2"></i>
                                    Select Slot
                                  </button>
                                );
                              }

                              if (bookingType === "rentals") {
                                return (
                                  <button
                                    className="btn-enquiry w-100"
                                    onClick={() => handleRentalBookinProcess(vendor, med)}
                                  >
                                    <i className="fa-solid fa-clipboard-check me-2"></i>
                                    Rent
                                  </button>
                                );
                              }

                              if (bookingType === "consultation") {
                                return (
                                  <button
                                    className="btn-enquiry w-100"
                                    onClick={() =>
                                      handleConsultationClick(vendor, med)
                                    }
                                  >
                                    <i className="fa-solid fa-comments me-2"></i>
                                    Consultation
                                  </button>
                                );
                              }

                              if (bookingType === "ride") {
                                return (
                                  <button
                                    className="btn-enquiry w-100"
                                    onClick={() => handleRide(vendor, med)}
                                  >
                                    <i className="fas fa-car me-2"></i>
                                    Book Ride
                                  </button>
                                );
                              }

                              if (bookingType === "appointment") {
                                return (
                                  <button
                                    className="btn-enquiry w-100"
                                    onClick={() =>
                                      handleAppointmentClick(vendor, med)
                                    }
                                  >
                                    <i className="fa-solid fa-calendar-check me-2"></i>
                                    Book Appointment
                                  </button>
                                );
                              }

                              if (bookingType === "cart") {
                                const itemPrice = parseFloat(item?.price) || 0;
                                const itemDiscountprice =
                                  parseFloat(
                                    item?.discountprice || item?.discountPrice,
                                  ) || null;
                                const effectivePrice =
                                  itemDiscountprice && itemDiscountprice > 0
                                    ? itemDiscountprice
                                    : itemPrice;

                                return (
                                  <CartQuantityControls
                                    item={{
                                      tabletdetails: med,
                                      vendordetails:
                                        vendor?.bussinessdetails || vendor,
                                      variants:
                                        med.variant || item.variants || [],
                                      vendorId: vendor._id || vendor.vendorId,
                                      price: effectivePrice,
                                      discountprice: itemDiscountprice,
                                    }}
                                    variant={
                                      med.variant?.[0] || item.variants?.[0]
                                    }
                                    maxStock={
                                      med.variant?.[0]?.stock ||
                                      item.variants?.[0]?.stock ||
                                      999
                                    }
                                    options={{
                                      bookingType: "cart",
                                      type: "normal",
                                    }}
                                    className="vendor-cart-controls"
                                  />
                                );
                              }

                              if (bookingType === "rentals_addtocarts") {
                                const itemPrice = parseFloat(item?.price) || 0;
                                const itemDiscountprice =
                                  parseFloat(
                                    item?.discountprice || item?.discountPrice,
                                  ) || null;
                                const effectivePrice =
                                  itemDiscountprice && itemDiscountprice > 0
                                    ? itemDiscountprice
                                    : itemPrice;

                                return (
                                  <div className="flex gap-[8px]">
                                    <CartQuantityControls
                                      item={{
                                        tabletdetails: med,
                                        vendordetails:
                                          vendor?.bussinessdetails || vendor,
                                        variants:
                                          med.variant || item.variants || [],
                                        vendorId: vendor._id || vendor.vendorId,
                                        price: effectivePrice,
                                        discountprice: itemDiscountprice,
                                      }}
                                      variant={
                                        med.variant?.[0] || item.variants?.[0]
                                      }
                                      maxStock={
                                        item.stock ||
                                        med.stock ||
                                        vendor.stock ||
                                        999
                                      }
                                      options={{
                                        bookingType: "cart",
                                        type: "normal",
                                      }}
                                      className="vendor-cart-controls flex-1"
                                    />
                                    <button
                                      className="btn-enquiry flex-1"
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleRentalBookinProcess(vendor, med);
                                      }}
                                    >
                                      <i className="fa-solid fa-clipboard-check me-2"></i>
                                      Rent
                                    </button>
                                  </div>
                                );
                              }

                              return (
                                <button className="btn-enquiry w-100">
                                  Book An Appointment
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </Slider>
              </div>
            </div>
          </section>
        )}
        <section>
          <div className="container-fluid py-4">
            <div className="text-center mb-5">

              <h2 className="text-[28px] font-bold">
                <i
                  className="fa fa-bolt me-2 text-[#8059ca]"
                />
                <span
                  className="bg-gradient-to-br from-[#8059ca] to-[#6d48b8] bg-clip-text text-transparent"
                >
                  One-Stop Solution for Everything You Need
                </span>
              </h2>

            </div>
            <div className="flow-row">
              <div className="feature-item">
                <div className="icon-box bg-custom-orange">
                  <i className="fa fa-user-md" />
                </div>
                <div className="feature-title">
                  Expert Surgeons with 15+ Years of Experience
                </div>
                <div className="feature-desc">
                  Highly qualified, board-certified surgeons delivering safe
                  outcomes.
                </div>
              </div>
              <div className="mini-connector">
                <span className="mini-dot dot-purple" />
                <span className="mini-dash" />
                <span className="mini-dot dot-cyan" />
              </div>
              <div className="feature-item">
                <div className="icon-box bg-custom-red">
                  <i className="fas fa-hospital" />
                </div>
                <div className="feature-title">
                  Top JCI &amp; NABH-Accredited Hospitals
                </div>
                <div className="feature-desc">
                  Internationally recognized hospitals for quality care.
                </div>
              </div>
              <div className="mini-connector">
                <span className="mini-dot dot-cyan" />
                <span className="mini-dash" />
                <span className="mini-dot dot-purple" />
              </div>
              <div className="feature-item">
                <div className="icon-box bg-custom-blue">
                  <i className="fa fa-headphones" />
                </div>
                <div className="feature-title">
                  24×7 Personal Care
                  <br />
                  Assistance
                </div>
                <div className="feature-desc">
                  Dedicated support available any time you need it.
                </div>
              </div>
              <div className="mini-connector">
                <span className="mini-dot dot-purple" />
                <span className="mini-dash" />
                <span className="mini-dot dot-cyan" />
              </div>
              <div className="feature-item">
                <div className="icon-box bg-custom-pink">
                  <i className="fa fa-shield" />
                </div>
                <div className="feature-title">
                  Easy Insurance Claim &amp; Medical Loan Support
                </div>
                <div className="feature-desc">
                  Hassle-free insurance and financing assistance.
                </div>
              </div>
              <div className="mini-connector">
                <span className="mini-dot dot-cyan" />
                <span className="mini-dash" />
                <span className="mini-dot dot-purple" />
              </div>
              <div className="feature-item">
                <div className="icon-box bg-custom-yellow">
                  <i className="fa fa-medkit" />
                </div>
                <div className="feature-title">
                  Comprehensive Post- Surgery Care
                </div>
                <div className="feature-desc">
                  Complete care from consultation to recovery.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="pt-[20px] pb-0 px-0 bg-[#E8E4F5] bg-[url('/assets/Medicompares%20Background.png')] bg-cover bg-center bg-no-repeat relative overflow-hidden"
        >
          <style>
            {`
      @keyframes pulse {
        0%, 100% {
          transform: scale(1);
          opacity: 1;
        }
        50% {
          transform: scale(1.1);
          opacity: 0.9;
        }
      }

      @keyframes bounce {
        0%, 100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-8px);
        }
      }

      /* ============================
         RESPONSIVE (MOBILE/TABLET) 
      ============================ */
      @media (max-width: 991px) {
        .how-works-container {
          flex-direction: column !important;
          min-height: auto !important;
          gap: 40px !important;
          padding: 20px 10px !important;
        }
        .how-works-feature {
          position: static !important;
          transform: none !important;
          max-width: 320px !important;
          width: 100% !important;
          text-align: center !important;
        }
        .how-works-feature.left {
          text-align: center !important;
        }
        .how-works-feature.right {
          text-align: center !important;
        }
        .how-works-feature .card-works {
          align-items: center !important;
        }
        .how-works-center-img {
          margin-top: 20px !important;
          order: -1 !important;
        }
      }

      @media (max-width: 480px) {
        .how-works-center-img {
          width: 150px !important;
          height: 150px !important;
        }
        .how-works-feature {
          max-width: 240px !important;
        }
      }
    `}
          </style>

          <div className="container relative z-[1]">
            <h2
              className="text-[28px] font-bold inline-block w-full text-center bg-gradient-to-br from-[#8059ca] to-[#6d48b8] bg-clip-text text-transparent"
            >
              How MediCompares Works
            </h2>

            <div
              className="how-works-container relative flex justify-center items-center min-h-[600px] py-[40px] px-[20px]"
            >
              <div
                className="how-works-center-img relative w-[280px] h-[280px] rounded-[50%] overflow-hidden border-[8px] border-solid border-white shadow-[0_6px_20px_rgba(128,89,202,0.2)] z-10 bg-[#f8f4ff] mt-[190px]"
              >
                <img
                  src="https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=500&h=500&fit=crop&q=80"
                  alt="Surgical Operation"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = "/assets/img/surgery-room.png";
                  }}
                />
              </div>

              {[
                {
                  id: 1,
                  title: "Pick Your Service",
                  subtitle: "Select the specific procedure needed.",
                  position: {
                    top: "5%",
                    left: "50%",
                    transform: "translateX(-50%)",
                  },
                },
                {
                  id: 2,
                  title: "Browse Categories",
                  subtitle: "Find the surgery type you need.",
                  position: { top: "20%", left: "15%", transform: "none" },
                },
                {
                  id: 3,
                  title: "Compare Hospitals",
                  subtitle: "See prices, facilities, and ratings.",
                  position: { bottom: "20%", left: "15%", transform: "none" },
                },
                {
                  id: 4,
                  title: "Book or Get Opinion",
                  subtitle: "Choose the best center or ask experts.",
                  position: { bottom: "20%", right: "15%", transform: "none" },
                },
                {
                  id: 5,
                  title: "Check Surgery Details",
                  subtitle: "View cost, risks, and offers.",
                  position: { top: "20%", right: "15%", transform: "none" },
                },
              ].map((feature) => (
                <div
                  key={feature.id}
                  className="how-works-feature"
                  style={{
                    position: "absolute",
                    ...feature.position,
                    zIndex: 5,
                    maxWidth: "200px",
                  }}
                >
                  <svg
                    style={{
                      position: "absolute",
                      width: "100px",
                      height: "60px",
                      top: feature.id === 1 ? "100%" : "50%",
                      left:
                        feature.id === 1
                          ? "50%"
                          : feature.id <= 3
                            ? "100%"
                            : "0%",
                      transform:
                        feature.id === 1
                          ? "translateX(-50%)"
                          : feature.id <= 3
                            ? "translateY(-50%)"
                            : "translateY(-50%) translateX(-100%)",
                      overflow: "visible",
                    }}
                  >
                    <path
                      d={
                        feature.id === 1
                          ? "M 50 0 Q 50 20, 50 30"
                          : feature.id === 2
                            ? "M 0 30 Q 30 30, 50 0"
                            : feature.id === 3
                              ? "M 0 30 Q 30 30, 50 60"
                              : feature.id === 4
                                ? "M 100 30 Q 70 30, 50 60"
                                : "M 100 30 Q 70 30, 50 0"
                      }
                      stroke="rgba(128, 89, 202, 0.35)"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={feature.id === 1 ? "50" : feature.id <= 3 ? "0" : "100"}
                      cy={feature.id === 1 ? "0" : "30"}
                      r="4"
                      fill="#8059ca"
                    />
                    <circle
                      cx="50"
                      cy={
                        feature.id === 1
                          ? "30"
                          : feature.id === 3
                            ? "60"
                            : feature.id === 4
                              ? "60"
                              : feature.id === 2
                                ? "0"
                                : "0"
                      }
                      r="4"
                      fill="#6d48b8"
                    />
                  </svg>

                  {/* FEATURE BOX */}
                  <div
                    className={`bg-white rounded-[12px] p-[16px] shadow-[0_4px_12px_rgba(128,89,202,0.1)] border border-solid border-[rgba(128,89,202,0.12)] text-center ${feature.id === 1 ? "mt-[20px]" : "mt-0"}`}
                  >
                    <p
                      className="text-[16px] font-semibold text-[#1a1a1a] mb-[8px]"
                    >
                      {feature.title}
                    </p>

                    {feature.subtitle && (
                      <p
                        className="text-[13px] text-[#64748b] leading-[1.4] font-normal"
                      >
                        {feature.subtitle}
                      </p>
                    )}

                    {/* ICON */}
                    <div className="mt-[10px]">
                      <div
                        className="w-[50px] h-[50px] rounded-[50%] flex items-center justify-center bg-gradient-to-br from-[#8059ca] to-[#6d48b8]"
                        style={{
                          animation: "pulse 2s infinite",
                        }}
                      >
                        <i
                          className={`${
                            feature.id === 1
                              ? "fas fa-list-check"
                              : feature.id === 3
                                ? "fas fa-balance-scale"
                                : feature.id === 4
                                  ? "fas fa-calendar-check"
                                  : feature.id === 5
                                    ? "fas fa-file-medical"
                                    : "fas fa-search"
                          } text-[20px] text-white`}
                          style={{
                            animation: "bounce 1.5s infinite",
                          }}
                        ></i>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-4">
          <div className="container ">
            <div className="row align-items-center g-4">
              <div className="col-lg-5">
                <div className="ssa-wrapper-bg">
                  <div className="ssa-form-box">
                    <h3
                      className="mt-2 text-center text-dark font-semibold text-[20px]"
                    >
                      Smart Surgery Assistance
                    </h3>
                    <form className="p-3" onSubmit={(e) => handleSubmitLead(e)}>
                      <div className="row mb-2">
                        <div className="col-md-12">
                          <label className="mb-1">
                            <small className="text-dark">Full Name</small>
                          </label>
                          <div className="ssa-input-wrap">
                            <input
                              type="text"
                              className="ssa-input-field"
                              placeholder="Enter your full name"
                              name="name"
                              required
                              value={form.name}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-md-6">
                          <label className="mb-1">
                            <small className="text-dark">Age</small>
                          </label>
                          <div className="ssa-input-wrap">
                            <input
                              type="number"
                              className="ssa-input-field"
                              placeholder="Age"
                              name="age"
                              required
                              value={form.age || ""}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="mb-1">
                            <small className="text-dark">Gender</small>
                          </label>
                          <div className="ssa-input-wrap">
                            <select
                              className="ssa-input-field"
                              required
                              name="gender"
                              value={form.gender || ""}
                              onChange={(e) => handleChange(e)}
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-md-6">
                          <label className="mb-1">
                            <small className="text-dark">Phone Number</small>
                          </label>
                          <div className="ssa-input-wrap">
                            <input
                              type="tel"
                              className="ssa-input-field"
                              placeholder="Phone Number"
                              maxLength={10}
                              minLength={10}
                              required
                              name="phone"
                              value={form.phone}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="mb-1">
                            <small className="text-dark">Relation</small>
                          </label>
                          <div className="ssa-input-wrap">
                            <input
                              type="text"
                              className="ssa-input-field"
                              placeholder="Relation"
                              name="relation"
                              required
                              value={form.relation || ""}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-md-12">
                          <label className="mb-1">
                            <small className="text-dark">
                              Email Address (Optional)
                            </small>
                          </label>
                          <div className="ssa-input-wrap">
                            <input
                              type="email"
                              className="ssa-input-field"
                              placeholder="Email Address (Optional)"
                              name="email"
                              value={form.email || ""}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row mb-2">
                        <div className="col-md-6">
                          <label className="mb-1">
                            <small className="text-dark">Surgery Type</small>
                          </label>
                          <div className="ssa-input-wrap">
                            <select
                              className="ssa-input-field"
                              required
                              name="surgeryType"
                              value={form.surgeryType || ""}
                              onChange={(e) => handleChange(e)}
                            >
                              <option value="">Select Surgery Type</option>
                              <option value="General Surgery">
                                General Surgery
                              </option>
                              <option value="Cardiac Surgery">
                                Cardiac Surgery
                              </option>
                              <option value="Orthopedic Surgery">
                                Orthopedic Surgery
                              </option>
                              <option value="Neuro Surgery">Neuro Surgery</option>
                              <option value="ENT Surgery">ENT Surgery</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <label className="mb-1">
                            <small className="text-dark">City / Location</small>
                          </label>
                          <div className="ssa-input-wrap">
                            <input
                              type="text"
                              className="ssa-input-field"
                              placeholder="City / Location"
                              name="city"
                              required
                              value={form.city || ""}
                              onChange={(e) => handleChange(e)}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="row">
                        <div className="col-md-12">
                          <label className="mb-1">
                            <small className="text-dark">
                              Condition / Problem Description
                            </small>
                          </label>
                          <div className="ssa-input-wrap">
                            <textarea
                              className="ssa-input-field"
                              placeholder="Condition / Problem Description"
                              name="condition"
                              required
                              value={form.condition || ""}
                              onChange={(e) => handleChange(e)}
                            ></textarea>
                          </div>
                        </div>
                      </div>

                      <div className="row mb-3">
                        <div className="col-md-12 d-flex align-items-center">
                          <input
                            type="checkbox"
                            name="agree"
                            required
                            checked={form.agree || false}
                            onChange={(e) => handleChange(e)}
                          />
                          <label className="ms-1">
                            <small className="text-dark">
                              Agree to Be Contacted
                            </small>
                          </label>
                        </div>
                      </div>

                      <button className="w-100 ssa-submit-btn">Submit</button>
                    </form>
                  </div>
                </div>
              </div>
              <div className="col-lg-7">
                <div className="section-wrapper-surgery">
                  <h2
                    className="text-[28px] font-semibold text-[#1a1a1a] mb-[16px]"
                  >
                    Smart Care for Every Surgery
                  </h2>
                  <p
                    className="text-[15px] font-normal text-[#64748b] mb-[32px]"
                  >
                    Consult with expert surgeons for 1000+ surgical treatments
                    across India.
                  </p>

                  <div className="feature-itemss">
                    <div className="icon-wraps green">
                      <i className="fas fa-headset" />
                    </div>
                    <div className="featuree-content">
                      <h6>Free Consultation</h6>
                      <p>
                        Share your details and get a call from a care coordinator.
                      </p>
                    </div>
                  </div>

                  <div className="feature-itemss">
                    <div className="icon-wraps blue">
                      <i className="fas fa-users" />
                    </div>
                    <div className="featuree-content">
                      <h6>Expert Guidance</h6>
                      <p>
                        Our team understands your symptoms and recommends the
                        right treatment.
                      </p>
                    </div>
                  </div>

                  <div className="feature-itemss">
                    <div className="icon-wraps yellow">
                      <i className="fas fa-clock" />
                    </div>
                    <div className="featuree-content">
                      <h6>Quick Scheduling</h6>
                      <p>
                        Consultations and surgeries scheduled at the earliest
                        convenience.
                      </p>
                    </div>
                  </div>

                  <div className="feature-itemss last">
                    <div className="icon-wraps orange">
                      <i className="fas fa-shield-alt" />
                    </div>
                    <div className="featuree-content">
                      <h6>Post-Consultation Care Alignment</h6>
                      <p>
                        After consultation, clinical requirements and next steps
                        are aligned.
                      </p>
                    </div>
                  </div>

                  <div className="row stats-row g-3">
                    {[
                      { icon: "fa fa-users", value: "3M+", label: "Happy Patients" },
                      { icon: "fa fa-hospital", value: "150+", label: "Clinics" },
                      { icon: "fa fa-map-marker-alt", value: "30+", label: "Cities" }
                    ].map((stat, idx) => (
                      <div key={idx} className="col-md-4">
                        <div
                          className="stat-card text-center p-3 bg-white rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.05)] border border-solid border-[#e2e8f0]"
                        >
                          <div className="mb-2">
                            <i
                              className={`${stat.icon} fa-2x text-[#8059ca]`}
                            />
                          </div>
                          <h5
                            className="text-[#8059ca] font-semibold text-[22px] mb-[4px]"
                          >
                            {stat.value}
                          </h5>
                          <span
                            className="text-[13px] font-medium text-[#5c626a]"
                          >
                            {stat.label}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        {typeof document !== "undefined" &&
          showModal &&
          createPortal(
            <div
              className="modal fade show block fixed inset-0 w-full h-full backdrop-blur-[2px] overflow-y-auto bg-[rgba(0,0,0,0.88)]"
              style={{
                zIndex: "999999999",
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-lg">
                <div
                  className="modal-content shadow-lg rounded-[12px] overflow-hidden border-none"
                >
                  <div className="modal-body p-0">
                    <div className="row g-0">
                      <div className="col-md-4 d-none d-md-block">
                        <img
                          src={
                            currentService?.imageUrl
                              ? getImageUrl(currentService?.imageUrl)
                              : "/assets/img/healthcare-img.jpg"
                          }
                          alt="surgeries"
                          className="img-fluid h-100 object-cover"
                        />
                      </div>
                      <div className="col-md-8 bg-white p-1 p-md-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0">Request Callback</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={toggleModal}
                          ></button>
                        </div>

                        <form
                          className="d-flex flex-column"
                          onSubmit={DoctorConsultaion1}
                        >
                          <div className="row">
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
                                value={surgeriesData.name}
                                onChange={(e) => handleChange1(e)}
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
                                value={surgeriesData.phone}
                                onChange={(e) => handleChange1(e)}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">
                                Service Type <span className="text-danger">*</span>
                              </label>
                              <select
                                name="category"
                                className="form-control"
                                required
                                value={surgeriesData.category || ""}
                                onChange={(e) => handleChange1(e)}
                              >
                                {categories.map((cat) => (
                                  <option key={cat._id} value={cat.name}>
                                    {cat.name}
                                  </option>
                                ))}
                              </select>
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
                              value={surgeriesData.address}
                              onChange={(e) => handleChange1(e)}
                            ></textarea>
                          </div>

                          <div className="d-flex justify-content-end">
                            <button
                              type="submit"
                              className="btn btn-primary rounded-pill"
                            >
                              Submit <i className="fas fa-check-circle"></i>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
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
            setLeadFormData((p) => ({ ...p, [e.target.name]: e.target.value }))
          }
          productId={
            currentLeadData?.med?._id || currentLeadData?.med?.id || null
          }
          vendorId={
            currentLeadData?.vendor?.vendorId ||
            currentLeadData?.vendor?._id ||
            null
          }
          variantId={currentLeadData?.variantId || null}
          onSubmit={handleSubmitLeadNew}
          fixedType="surgeries"
        />
        {/* Rental Modal */}
        {rentProduct && (
          <RentModal
            show={showRentModal}
            fixedType="surgeries"
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
            onSubmit={handleRentSubmit}
            productId={rentProduct?.productId || rentProduct?.tabletdetails?._id}
            vendorId={rentProduct?.vendorId || rentProduct?.vendordetails?._id}
            variantId={rentProduct?.variantId || null}
          />
        )}
        {/* Consultation Modal */}
        <ConsultationModal
          show={showConsultationModal}
          fixedType="surgeries"
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
          onSubmit={handleConsultationSubmit}
          productId={consultationFormData.productId || null}
          vendorId={consultationFormData.vendorId || null}
          variantId={consultationFormData.variantId || null}
          title="Book a Consultation"
        />
        {/* Appointment Modal */}
        <AppointmentModal
          fixedType="surgeries"
          show={showAppointmentModal}
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
          formType="appointment"
          productId={appointmentFormData.productId || null}
          vendorId={appointmentFormData.vendorId || null}
          variantId={appointmentFormData.variantId || null}
        />
        {typeof document !== "undefined" &&
          showModal1 &&
          createPortal(
            <div
              className="modal fade show block fixed inset-0 w-full h-full backdrop-blur-[2px] overflow-y-auto bg-[rgba(0,0,0,0.88)]"
              style={{
                zIndex: "999999999",
              }}
            >
              <div className="modal-dialog modal-dialog-centered modal-md">
                <div
                  className="modal-content shadow-lg rounded-[12px] overflow-hidden border-none"
                >
                  <div className="modal-body p-0">
                    <div className="row g-0">
                      <div className="col-md-12 bg-white p-1 p-md-4">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="mb-0">Doctor Consultation</h5>
                          <button
                            type="button"
                            className="btn-close"
                            onClick={toggleModal1}
                          ></button>
                        </div>

                        <form
                          className="d-flex flex-column"
                          onSubmit={DoctorConsultaion}
                        >
                          <div className="row">
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
                                value={doctorForm.name}
                                onChange={handleDoctorChnage}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">
                                Email <span className="text-danger">*</span>
                              </label>
                              <input
                                type="email"
                                name="email"
                                className="form-control"
                                placeholder="Enter Email"
                                required
                                value={doctorForm.email}
                                onChange={handleDoctorChnage}
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
                                required
                                value={doctorForm.phone}
                                onChange={handleDoctorChnage}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">
                                Age <span className="text-danger">*</span>
                              </label>
                              <input
                                type="tel"
                                name="age"
                                className="form-control"
                                placeholder="Enter Age"
                                required
                                value={doctorForm.age}
                                onChange={handleDoctorChnage}
                              />
                            </div>
                          </div>

                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <label className="form-label">
                                City <span className="text-danger">*</span>
                              </label>
                              <input
                                type="text"
                                name="city"
                                className="form-control"
                                placeholder="Enter City"
                                required
                                value={doctorForm.city}
                                onChange={handleDoctorChnage}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <label className="form-label">
                                Preferred Time <span className="text-danger">*</span>
                              </label>
                              <input
                                type="datetime-local"
                                name="preferredTime"
                                className="form-control"
                                required
                                value={doctorForm.preferredTime}
                                onChange={handleDoctorChnage}
                              />
                            </div>
                          </div>

                          <div className="mb-3">
                            <label className="form-label">
                              Description <span className="text-danger">*</span>
                            </label>
                            <textarea
                              name="message"
                              className="form-control"
                              rows="3"
                              placeholder="Enter Description"
                              required
                              value={doctorForm.message}
                              onChange={handleDoctorChnage}
                            ></textarea>
                          </div>

                          <div className="d-flex justify-content-end">
                            <button
                              type="submit"
                              className="btn btn-primary rounded-pill"
                            >
                              Submit
                              <i className="fas fa-check-circle"></i>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
      </div>
    </>
  );
};

export default surgeries;
