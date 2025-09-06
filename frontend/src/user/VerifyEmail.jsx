import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../constant/api";

const VerifyEmail = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId;

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

  const [throttleError, setThrottleError] = useState(null);
  const [throttleWaitTime, setThrottleWaitTime] = useState(null);

  // Update countdown timer effect
  useEffect(() => {
    if (timeLeft === 0) {
      localStorage.removeItem("otpExpiration"); // Clear expired timer
      Swal.fire({
        icon: "error",
        title: "OTP Expired",
        text: "The verification code has expired. Please request a new one.",
        confirmButtonColor: "#f59e0b", // amber-500
      }).then(() => {
        navigate("/register");
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

  const handleThrottleError = (waitSeconds) => {
    setThrottleError("Too many attempts. Please wait before trying again.");
    setThrottleWaitTime(waitSeconds);

    const timer = setInterval(() => {
      setThrottleWaitTime((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          setThrottleError(null);
          return null;
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join("");

    if (otpString.length !== 6) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: "Please enter a complete 6-digit code",
        confirmButtonColor: "#f59e0b", // amber-500
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/verify-email/", {
        user_id: userId,
        otp: otpString,
      });

      localStorage.removeItem("otpExpiration"); // Clear timer on success

      await Swal.fire({
        icon: "success",
        title: "Email Verified!",
        text: "Your email has been verified successfully.",
        confirmButtonColor: "#f59e0b", // amber-500
      });

      navigate("/login");
    } catch (error) {
      console.error("Verification error:", error);

      if (error.response?.status === 429) {
        const waitSeconds = error.response.data.wait_seconds || 60;
        handleThrottleError(waitSeconds);

        Swal.fire({
          icon: "warning",
          title: "Too Many Attempts",
          text: `Please wait ${waitSeconds} seconds before trying again.`,
          timer: waitSeconds * 1000,
          timerProgressBar: true,
          confirmButtonColor: "#f59e0b", // amber-500
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: error.response?.data?.error || "Please try again",
          confirmButtonColor: "#f59e0b", // amber-500
        });
      }
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
        confirmButtonColor: "#f59e0b", // amber-500
      });
    } catch (error) {
      if (error.response?.status === 429) {
        const waitSeconds = error.response.data.wait_seconds || 60;
        handleThrottleError(waitSeconds);

        Swal.fire({
          icon: "warning",
          title: "Too Many Attempts",
          text: `Please wait ${waitSeconds} seconds before requesting a new code.`,
          timer: waitSeconds * 1000,
          timerProgressBar: true,
          confirmButtonColor: "#f59e0b", // amber-500
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Resend",
          text: error.response?.data?.error || "Failed to send new code",
          confirmButtonColor: "#f59e0b", // amber-500
        });
      }
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
        confirmButtonColor: "#f59e0b", // amber-500
      });
      return;
    }
    handleResendOTP();
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Verify Your Email
            </h2>
            <p className="text-gray-600">
              Please enter the 6-digit code sent to your email
            </p>
          </div>

          {/* Timer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-amber-700 font-medium">
                  Time remaining: {formatTimeLeft()}
                </span>
              </div>
            </div>
          </div>

          {/* Throttle Error */}
          {throttleError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 text-sm font-medium mb-1">
                {throttleError}
              </p>
              {throttleWaitTime > 0 && (
                <p className="text-red-600 text-sm">
                  Try again in {throttleWaitTime} seconds
                </p>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Inputs */}
            <div className="flex justify-center space-x-3">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  id={`otp-${index}`}
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 focus:outline-none transition-all duration-200 bg-white"
                  required
                  onPaste={(e) => {
                    e.preventDefault();
                    const pastedValue = e.clipboardData.getData("text");
                    if (/^\d{6}$/.test(pastedValue)) {
                      setOtp(pastedValue.split(""));
                      document.getElementById(`otp-5`).focus();
                    }
                  }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <button
              type="submit"
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all duration-200 ${
                isLoading || timeLeft === 0 || throttleWaitTime > 0
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-amber-500 hover:bg-amber-600 active:bg-amber-700 focus:ring-2 focus:ring-amber-200 focus:outline-none"
              } transform hover:scale-[1.02] active:scale-[0.98]`}
              disabled={isLoading || timeLeft === 0 || throttleWaitTime > 0}
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </div>
              ) : throttleWaitTime > 0 ? (
                `Wait ${throttleWaitTime}s`
              ) : (
                "Verify Email"
              )}
            </button>

            {/* Resend Button */}
            <button
              type="button"
              className={`w-full py-3 px-4 rounded-lg font-medium border-2 transition-all duration-200 ${
                isLoading || timeLeft > 0 || throttleWaitTime > 0
                  ? "border-gray-300 text-gray-400 cursor-not-allowed bg-gray-50"
                  : "border-amber-500 text-amber-600 hover:bg-amber-50 active:bg-amber-100 focus:ring-2 focus:ring-amber-200 focus:outline-none"
              } transform hover:scale-[1.02] active:scale-[0.98]`}
              onClick={handleResendClick}
              disabled={isLoading || timeLeft > 0 || throttleWaitTime > 0}
            >
              {throttleWaitTime > 0
                ? `Wait ${throttleWaitTime}s`
                : "Resend Code"}
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Didn't receive the code? Check your spam folder or click resend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
