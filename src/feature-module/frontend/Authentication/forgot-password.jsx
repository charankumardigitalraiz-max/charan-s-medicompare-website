import { Link } from "react-router-dom";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { axiosUserInstance } from "../../../Apiservice";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Email is required");
      return;
    }
    setLoading(true);
    try {
      const bodyData = { email : email.email }; 
      const response = await axiosUserInstance.post("auth/forgot-password", bodyData);
      toast.success(response.data.message || "Password reset link sent!");
      setEmail("");
    } catch (error) {
      const message =
        error.response?.data?.message || "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container row g-0">
        {/* Left Image */}
        <div className="col-md-6 d-none d-md-flex login-left">
          <img src="/assets/logo-white.png" loading="lazy" alt="Forgot Password" />
        </div>

        {/* Right Form */}
        <div className="col-md-6 p-3 p-md-5">
          <h3 className="text-center">Forgot Password</h3>
          <p className="text-center text-muted mb-4">
            Enter your email and we will send you a link to reset your password.
          </p>
          <form onSubmit={(e)=>handleSubmit(e)}>
            <div className="mb-3">
              <input
                type="email"
                className="form-control"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="d-grid mb-3">
              <button
                className="login-btn123 text-white p-2 rounded"
                type="submit"
                disabled={loading}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
            <div className="text-center">
              <span>
                Remember Password? <Link to="/login">Login</Link>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
