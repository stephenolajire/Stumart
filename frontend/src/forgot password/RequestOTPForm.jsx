import React, { useState } from "react";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const RequestOTPForm = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleRequestOTP = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("request-otp/", { email });
      localStorage.setItem("resetEmail", email);
      setMessage(response.data.message);
      if (response.status === 200) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "OTP has been sent successfully!",
          confirmButtonColor: "#eab308", // yellow-500 hex value
        }).then(() => {
          navigate("/verify-otp");
        });
      }
    } catch (error) {
      setMessage(error.response?.data?.email || "Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <form
          onSubmit={handleRequestOTP}
          className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Request OTP
          </h2>
          <div className="mb-6">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200"
          >
            Send OTP
          </button>
          {message && (
            <p className="mt-4 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-md py-2 px-3">
              {message}
            </p>
          )}
        </form>
      </div>
    </div>
  );
};

export default RequestOTPForm;
