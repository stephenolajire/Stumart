import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../constant/api";
import styles from "../css/VerifyEmail.module.css";

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
        confirmButtonColor: "var(--primary-500)",
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
        confirmButtonColor: "var(--primary-500)",
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
        confirmButtonColor: "var(--primary-500)",
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
          confirmButtonColor: "var(--primary-500)",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Verification Failed",
          text: error.response?.data?.error || "Please try again",
          confirmButtonColor: "var(--primary-500)",
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
        confirmButtonColor: "var(--primary-500)",
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
          confirmButtonColor: "var(--primary-500)",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Failed to Resend",
          text: error.response?.data?.error || "Failed to send new code",
          confirmButtonColor: "var(--primary-500)",
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
        confirmButtonColor: "var(--primary-500)",
      });
      return;
    }
    handleResendOTP();
  };

  return (
    <div className={styles.verifyContainer}>
      <div className={styles.verifyBox}>
        <h2>Verify Your Email</h2>
        <p>Please enter the 6-digit code sent to your email</p>

        <div className={styles.timerContainer}>
          <span className={styles.timer}>
            Time remaining: {formatTimeLeft()}
          </span>
        </div>

        {throttleError && (
          <div className={styles.throttleError}>
            <p>{throttleError}</p>
            {throttleWaitTime > 0 && (
              <p>Try again in {throttleWaitTime} seconds</p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.verifyForm}>
          <div className={styles.otpInputs}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                id={`otp-${index}`}
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={styles.otpInput}
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
            className={styles.verifyButton}
            disabled={isLoading || timeLeft === 0 || throttleWaitTime > 0}
          >
            {isLoading
              ? "Verifying..."
              : throttleWaitTime > 0
              ? `Wait ${throttleWaitTime}s`
              : "Verify Email"}
          </button>

          <button
            type="button"
            className={styles.resendButton}
            onClick={handleResendClick}
            disabled={isLoading || timeLeft > 0 || throttleWaitTime > 0}
          >
            {throttleWaitTime > 0 ? `Wait ${throttleWaitTime}s` : "Resend Code"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
