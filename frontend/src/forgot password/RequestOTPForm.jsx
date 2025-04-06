import React, { useState } from "react";
import axios from "axios";
import styles from "./AuthForm.module.css";
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
          confirmButtonColor: "var(--primary-500)",
        }).then(() => {
          navigate("/verify-otp");
        });
      }
    } catch (error) {
      setMessage(error.response?.data?.email || "Something went wrong");
    }
  };

  return (
    <div className={styles.cont}>
      <form onSubmit={handleRequestOTP} className={styles.formContainer}>
        <h2 className={styles.heading}>Request OTP</h2>
        <input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.input}
        />
        <button type="submit" className={styles.button}>
          Send OTP
        </button>
        {message && <p className={styles.message}>{message}</p>}
      </form>
    </div>
  );
};

export default RequestOTPForm;
