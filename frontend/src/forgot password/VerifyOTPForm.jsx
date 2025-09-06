import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../constant/api";
import OtpInput from "react-otp-input";

const VerifyOTPForm = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const email = localStorage.getItem("resetEmail");

  // Initialize timeLeft from localStorage or set new expiration
  const [timeLeft, setTimeLeft] = useState(() => {
    const storedExpiration = localStorage.getItem("otpExpiration");
    if (storedExpiration) {
      const timeRemaining = Math.round(
        (parseInt(storedExpiration) - Date.now()) / 1000
      );
      return timeRemaining > 0 ? timeRemaining : 0;
    }
    // Set new expiration time if none exists
    const expirationTime = Date.now() + 10 * 60 * 1000; // 10 minutes from now
    localStorage.setItem("otpExpiration", expirationTime.toString());
    return 600;
  });

  // Update countdown timer effect
  useEffect(() => {
    if (timeLeft === 0) {
      localStorage.removeItem("otpExpiration"); // Clear expired timer
      Swal.fire({
        icon: "error",
        title: "OTP Expired",
        text: "The verification code has expired. Please request a new one.",
        confirmButtonColor: "#eab308", // yellow-500 hex value
      }).then(() => {
        navigate("/forgot-password");
      });
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  // Format time remaining
  const formatTimeLeft = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  const handleChange = (index, value) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: "Please enter a complete 6-digit code",
        confirmButtonColor: "#eab308", // yellow-500 hex value
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("verify-otp/", {
        email: email,
        code: otpString,
      });

      await Swal.fire({
        icon: "success",
        title: "Email Verified!",
        text: "Your email has been verified successfully.",
        confirmButtonColor: "#eab308", // yellow-500 hex value
      });

      localStorage.removeItem("otpExpiration");
      // localStorage.removeItem("resetEmail")

      navigate("/reset-password");
    } catch (error) {
      console.error("Verification error:", error);
      Swal.fire({
        icon: "error",
        title: "Verification Failed",
        text: error.response?.data?.error || "Please try again",
        confirmButtonColor: "#eab308", // yellow-500 hex value
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      await api.post("/resend-otp/", { user_id: userId });

      // Set new expiration time
      const newExpirationTime = Date.now() + 10 * 60 * 1000;
      localStorage.setItem("otpExpiration", newExpirationTime.toString());

      setTimeLeft(600); // Reset timer
      setOtp(["", "", "", "", "", ""]); // Clear OTP inputs

      Swal.fire({
        icon: "success",
        title: "OTP Resent",
        text: "A new verification code has been sent to your email.",
        confirmButtonColor: "#eab308", // yellow-500 hex value
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Failed to Resend",
        text: error.response?.data?.error || "Failed to send new code",
        confirmButtonColor: "#eab308", // yellow-500 hex value
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendClick = () => {
    if (timeLeft > 0) {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const timeString = `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;

      Swal.fire({
        icon: "info",
        title: "Please Wait",
        text: `You can request a new code in ${timeString}`,
        confirmButtonColor: "#eab308", // yellow-500 hex value
      });
      return;
    }
    handleResendOTP();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-600 mb-6">
              Please enter the 6-digit code sent to your email
            </p>
          </div>

          <div className="text-center mb-6">
            <span
              className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                timeLeft > 60
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              Time remaining: {formatTimeLeft()}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center space-x-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  id={`otp-${index}`}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-bold border-2 border-gray-300 rounded-lg focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500 focus:outline-none transition-colors duration-200"
                  required
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedValue = e.clipboardData.getData("text");
                    if (/^\d{6}$/.test(pastedValue)) {
                      setOtp(pastedValue.split(""));
                      document.getElementById(`otp-6`).focus(); // Focus last input
                    }
                  }}
                />
              ))}
            </div>

            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              disabled={isLoading || timeLeft === 0}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </button>

            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-yellow-500 rounded-md shadow-sm text-sm font-medium text-yellow-600 bg-white hover:bg-yellow-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              onClick={handleResendClick}
              disabled={isLoading}
            >
              Resend Code
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPForm;
