import React, { useState } from "react";
import axios from "axios";
import styles from "./AuthForm.module.css";
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
          confirmButtonColor: "var(--primary-500)",
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
          confirmButtonColor: "var(--primary-500)",
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
    <div className={styles.cont}>
      <form onSubmit={handleSetPassword} className={styles.formContainer}>
        <h2 className={styles.heading}>Reset Password</h2>

        {throttleError && (
          <div className={styles.throttleError}>
            <p>{throttleError}</p>
            {throttleWaitTime > 0 && (
              <p>Try again in {throttleWaitTime} seconds</p>
            )}
          </div>
        )}

        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
          disabled={throttleWaitTime > 0}
        />

        <button
          type="submit"
          className={styles.button}
          disabled={isLoading || throttleWaitTime > 0}
        >
          {isLoading
            ? "Resetting..."
            : throttleWaitTime > 0
            ? `Wait ${throttleWaitTime}s`
            : "Reset Password"}
        </button>

        {message && <p className={styles.message}>{message}</p>}
      </form>
    </div>
  );
};

export default SetNewPasswordForm;
