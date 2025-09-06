import React, { useState } from "react";
import axios from "axios";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const SetNewPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [throttleError, setThrottleError] = useState(null);
  const [throttleWaitTime, setThrottleWaitTime] = useState(null);
  const email = localStorage.getItem("resetEmail");
  const navigate = useNavigate();

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

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (throttleWaitTime > 0) return;

    setIsLoading(true);
    setMessage("");

    try {
      const response = await api.post("/reset-password/", {
        email,
        password,
      });

      if (response.status === 200) {
        setMessage("Password reset successfully!");
        Swal.fire({
          icon: "success",
          title: "Success",
          text: "Password reset successfully!",
          confirmButtonColor: "#eab308", // yellow-500 hex value
        }).then(() => {
          navigate("/login");
        });
        localStorage.removeItem("resetEmail");
      }
    } catch (error) {
      if (error.response?.status === 429) {
        const waitSeconds = error.response.data.wait_seconds || 60;
        handleThrottleError(waitSeconds);

        Swal.fire({
          icon: "warning",
          title: "Too Many Attempts",
          text: `Please wait ${waitSeconds} seconds before trying again.`,
          timer: waitSeconds * 1000,
          timerProgressBar: true,
          confirmButtonColor: "#eab308", // yellow-500 hex value
        });
      } else {
        setMessage(
          error.response?.data?.non_field_errors || "Failed to reset password"
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <form
          onSubmit={handleSetPassword}
          className="bg-white shadow-lg rounded-lg px-8 pt-6 pb-8 mb-4"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-6">
            Reset Password
          </h2>

          {throttleError && (
            <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-md">
              <p className="text-orange-800 text-sm font-medium">
                {throttleError}
              </p>
              {throttleWaitTime > 0 && (
                <p className="text-orange-700 text-sm mt-1">
                  Try again in {throttleWaitTime} seconds
                </p>
              )}
            </div>
          )}

          <div className="mb-6">
            <input
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed"
              disabled={throttleWaitTime > 0}
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            disabled={isLoading || throttleWaitTime > 0}
          >
            {isLoading
              ? "Resetting..."
              : throttleWaitTime > 0
              ? `Wait ${throttleWaitTime}s`
              : "Reset Password"}
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

export default SetNewPasswordForm;
