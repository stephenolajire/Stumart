import React, { useState } from "react";
import axios from "axios";
import styles from "./AuthForm.module.css";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const SetNewPasswordForm = () => {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const email = localStorage.getItem("resetEmail");
  const navigate = useNavigate()

  const handleSetPassword = async (e) => {
    e.preventDefault();
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
          navigate("/login")
        });
        localStorage.removeItem("resetEmail")
      }
    } catch (error) {
      setMessage(
        error.response?.data?.non_field_errors || "Failed to reset password"
      );
    }
  };

  return (
    <div className={styles.cont}>
      <form onSubmit={handleSetPassword} className={styles.formContainer}>
        <h2 className={styles.heading}>Reset Password</h2>
        <input
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Submit
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </form>
    </div>
  );
};

export default SetNewPasswordForm;
