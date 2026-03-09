import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useRequestOtp } from "../hooks/useUser";

const RequestOTPForm = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();
  const { mutate: requestOtp, isPending } = useRequestOtp();

  const handleRequestOTP = (e) => {
    e.preventDefault();
    requestOtp(
      { email },
      {
        onSuccess: () => {
          localStorage.setItem("resetEmail", email);
          Swal.fire({
            icon: "success",
            title: "Success",
            text: "OTP has been sent successfully!",
            confirmButtonColor: "#eab308",
          }).then(() => navigate("/verify-otp"));
        },
        onError: (error) => {
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.response?.data?.email || "Something went wrong",
            confirmButtonColor: "#eab308",
          });
        },
      },
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl w-full space-y-8">
        <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4">
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
            onClick={handleRequestOTP}
            disabled={isPending}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending ? "Sending..." : "Send OTP"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RequestOTPForm;
