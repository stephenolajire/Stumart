import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useVerifyEmail, useResendOtp } from "../hooks/useUser";

const VerifyEmail = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const location = useLocation();
  const navigate = useNavigate();
  const userId = location.state?.userId || localStorage.getItem("user_id");

  const { mutate: verifyEmail, isPending: isVerifying } = useVerifyEmail();
  const { mutate: resendOtp, isPending: isResending } = useResendOtp();

  const isLoading = isVerifying || isResending;

  // Initialize timer from localStorage or set new expiration
  const [timeLeft, setTimeLeft] = useState(() => {
    const stored = localStorage.getItem("otpExpiration");
    if (stored) {
      const remaining = Math.round((parseInt(stored) - Date.now()) / 1000);
      return remaining > 0 ? remaining : 0;
    }
    const expiration = Date.now() + 10 * 60 * 1000;
    localStorage.setItem("otpExpiration", expiration.toString());
    return 600;
  });

  const [throttleError, setThrottleError] = useState(null);
  const [throttleWaitTime, setThrottleWaitTime] = useState(null);

  // Countdown timer
  useEffect(() => {
    if (timeLeft === 0) {
      localStorage.removeItem("otpExpiration");
      Swal.fire({
        icon: "error",
        title: "OTP Expired",
        text: "The verification code has expired. Please request a new one.",
        confirmButtonColor: "#eab308",
      }).then(() => handleResendOTP());
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, navigate]);

  const formatTimeLeft = () => {
    const m = Math.floor(timeLeft / 60);
    const s = timeLeft % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleChange = (index, value) => {
    if (value && !/^\d+$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    if (/^\d{6}$/.test(pasted)) {
      setOtp(pasted.split(""));
      document.getElementById("otp-5")?.focus();
    }
  };

  const handleThrottleError = (waitSeconds) => {
    setThrottleError("Too many attempts. Please wait before trying again.");
    setThrottleWaitTime(waitSeconds);
    const timer = setInterval(() => {
      setThrottleWaitTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setThrottleError(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      Swal.fire({
        icon: "error",
        title: "Invalid OTP",
        text: "Please enter a complete 6-digit code",
        confirmButtonColor: "#eab308",
      });
      return;
    }

    verifyEmail(
      { user_id: userId, otp: otpString },
      {
        onSuccess: () => {
          localStorage.removeItem("otpExpiration");
          Swal.fire({
            icon: "success",
            title: "Email Verified!",
            text: "Your email has been verified successfully.",
            confirmButtonColor: "#eab308",
          }).then(() => navigate("/login"));
        },
        onError: (error) => {
          if (error.response?.status === 429) {
            const wait = error.response.data.wait_seconds || 60;
            handleThrottleError(wait);
            Swal.fire({
              icon: "warning",
              title: "Too Many Attempts",
              text: `Please wait ${wait} seconds before trying again.`,
              timer: wait * 1000,
              timerProgressBar: true,
              confirmButtonColor: "#eab308",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Verification Failed",
              text: error.response?.data?.error || "Please try again",
              confirmButtonColor: "#eab308",
            });
          }
        },
      },
    );
  };

  const handleResendOTP = () => {
    resendOtp(
      { user_id: userId },
      {
        onSuccess: () => {
          const newExpiration = Date.now() + 10 * 60 * 1000;
          localStorage.setItem("otpExpiration", newExpiration.toString());
          setTimeLeft(600);
          setOtp(["", "", "", "", "", ""]);
          Swal.fire({
            icon: "success",
            title: "OTP Resent",
            text: "A new verification code has been sent to your email.",
            confirmButtonColor: "#eab308",
          });
        },
        onError: (error) => {
          if (error.response?.status === 429) {
            const wait = error.response.data.wait_seconds || 60;
            handleThrottleError(wait);
            Swal.fire({
              icon: "warning",
              title: "Too Many Attempts",
              text: `Please wait ${wait} seconds before requesting a new code.`,
              timer: wait * 1000,
              timerProgressBar: true,
              confirmButtonColor: "#eab308",
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Failed to Resend",
              text: error.response?.data?.error || "Failed to send new code",
              confirmButtonColor: "#eab308",
            });
          }
        },
      },
    );
  };

  const handleResendClick = () => {
    if (timeLeft > 0) {
      Swal.fire({
        icon: "info",
        title: "Please Wait",
        text: `You can request a new code in ${formatTimeLeft()}`,
        confirmButtonColor: "#eab308",
      });
      return;
    }
    handleResendOTP();
  };

  const timerPercent = (timeLeft / 600) * 100;
  const timerColor =
    timeLeft > 120 ? "#eab308" : timeLeft > 30 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-4xl">
        {/* Card */}
        <div className="bg-surface rounded-2xl shadow-lg border border-border overflow-hidden">
          {/* Top accent bar */}
          <div className="h-1 bg-background-tertiary">
            <div
              className="h-full transition-all duration-1000"
              style={{ width: `${timerPercent}%`, backgroundColor: timerColor }}
            />
          </div>

          <div className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-text-primary mb-1">
                Verify Your Email
              </h2>
              <p className="text-text-secondary text-sm">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Timer */}
            <div
              className="rounded-xl p-4 mb-6 flex items-center justify-between"
              style={{
                backgroundColor: `${timerColor}15`,
                border: `1px solid ${timerColor}40`,
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: timerColor }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: timerColor }}
                >
                  Code expires in
                </span>
              </div>
              <span
                className="text-lg font-bold tabular-nums"
                style={{ color: timerColor }}
              >
                {formatTimeLeft()}
              </span>
            </div>

            {/* Throttle Error */}
            {throttleError && (
              <div className="bg-error/10 border border-error/30 rounded-xl p-4 mb-6">
                <p className="text-error text-sm font-medium">
                  {throttleError}
                </p>
                {throttleWaitTime > 0 && (
                  <p className="text-error/70 text-xs mt-1">
                    Try again in {throttleWaitTime}s
                  </p>
                )}
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* OTP Inputs */}
              <div className="flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    type="text"
                    id={`otp-${index}`}
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="w-[38px] h-12 sm:w-12 sm:h-14 text-center text-xl font-bold border-2 rounded-xl transition-all duration-200 outline-none bg-background-secondary text-text-primary"
                    style={{
                      borderColor: digit ? "#eab308" : "var(--color-border)",
                      boxShadow: digit
                        ? "0 0 0 3px rgba(234,179,8,0.15)"
                        : "none",
                    }}
                    required
                  />
                ))}
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isLoading || timeLeft === 0 || throttleWaitTime > 0}
                className="w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2"
                style={{
                  backgroundColor:
                    isLoading || timeLeft === 0 || throttleWaitTime > 0
                      ? "var(--color-border-dark)"
                      : "var(--color-primary)",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  boxShadow:
                    !isLoading && timeLeft > 0
                      ? "0 4px 14px rgba(234,179,8,0.35)"
                      : "none",
                }}
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : throttleWaitTime > 0 ? (
                  `Wait ${throttleWaitTime}s`
                ) : (
                  "Verify Email"
                )}
              </button>

              {/* Resend Button */}
              <button
                type="button"
                onClick={handleResendClick}
                disabled={isLoading || throttleWaitTime > 0}
                className="w-full py-3.5 rounded-xl font-semibold border-2 transition-all duration-200"
                style={{
                  borderColor:
                    timeLeft > 0 || throttleWaitTime > 0
                      ? "var(--color-border)"
                      : "var(--color-primary)",
                  color:
                    timeLeft > 0 || throttleWaitTime > 0
                      ? "var(--color-text-tertiary)"
                      : "var(--color-primary)",
                  backgroundColor: "transparent",
                  cursor:
                    isLoading || throttleWaitTime > 0
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {isResending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : throttleWaitTime > 0 ? (
                  `Wait ${throttleWaitTime}s`
                ) : timeLeft > 0 ? (
                  `Resend in ${formatTimeLeft()}`
                ) : (
                  "Resend Code"
                )}
              </button>
            </form>

            {/* Footer note */}
            <p className="text-center text-xs text-text-tertiary mt-6">
              Didn't receive the code? Check your spam folder or click resend.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;
