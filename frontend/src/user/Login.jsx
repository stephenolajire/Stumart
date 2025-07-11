import { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../constant/api";
import styles from "../css/Login.module.css";
import logo from "../assets/stumart.jpeg";
import { GlobalContext } from "../constant/GlobalContext";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Add this import at the top

const Login = () => {
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const { auth } = useContext(GlobalContext);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [throttleError, setThrottleError] = useState(null);
  const [throttleWaitTime, setThrottleWaitTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false); // Add this new state
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResendOTP = async (userId) => {
    try {
      await api.post("/resend-otp/", { user_id: userId });

      Swal.fire({
        icon: "success",
        title: "OTP Sent!",
        text: "Please check your email for the verification code.",
        confirmButtonColor: "var(--primary-500)",
      });
    } catch (error) {
      console.error("OTP resend error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Send OTP",
        text: error.response?.data?.error || "Failed to send verification code",
        confirmButtonColor: "var(--primary-500)",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setThrottleError(null);

    try {
      const response = await api.post("/token/", formData);
      const {
        access,
        refresh,
        user_type,
        is_verified,
        kyc_status,
        user_id,
        is_admin,
        category,
        subscription,
        institution,
      } = response.data;

      console.log(response.data);

      // Store the tokens in local storage
      localStorage.setItem("user_type", user_type);
      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);
      localStorage.setItem("institution", institution); // Set default auth header for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      localStorage.setItem("user_id", user_id);

      // If user is not verified, send OTP and navigate to email verification
      if (!is_verified) {
        await handleResendOTP(user_id);
        navigate("/verify-email", { state: { userId: user_id } });
        return;
      }

      // If user is a student and verified, navigate to home
      if (user_type === "admin" && is_admin == true ) {
        navigate("/admin-dashboard");
        auth();
        return;
      }

      if (user_type === "student") {
        auth();
        navigate(from, { replace: true });
        return;
      }

      // If user is picker, student picker, or vendor, handle KYC status
      if (["picker", "student_picker", "vendor"].includes(user_type)) {
        if (!kyc_status || kyc_status === "rejected" || kyc_status === 'none') {
          Swal.fire({
            icon: "warning",
            title: "KYC Not Submitted or Rejected",
            text: "Your KYC verification is required. Please submit your details.",
            confirmButtonColor: "var(--primary-500)",
          }).then(() => {
            navigate("/verify-account");
          });
          return;
        }

        // if (kyc_status === "pending") {
        //   navigate("/kyc-status");
        //   return;
        // }

        if (
          (kyc_status === "approved" || kyc_status === "pending") &&
          user_type === "vendor" &&
          category !== "others"
        ) {
          navigate("/vendor-dashboard");
          auth();
          return;
        } else if (
          (kyc_status === "approved" || kyc_status === "pending") &&
          user_type === "vendor" &&
          category === "others"
        ) {
          if (subscription === "trial" || subscription === "active") {
            navigate("/other-dashboard");
            auth();
            return;
          } else {
            navigate("/subscription-plans");
            auth();
            return;
          }
        }
        if (kyc_status === "approved" || kyc_status === "pending") {
          if (user_type === "picker" || user_type === "student_picker") {
            navigate("/picker");
          }
        }
      }

      // Default success message
      Swal.fire({
        icon: "success",
        title: "Login Successful!",
        text: "Welcome back to StuMart",
        confirmButtonColor: "var(--primary-500)",
      });
    } catch (error) {
      console.error("Login error:", error);

      if (error.response.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "Invalid email or password. Please try again.",
          confirmButtonColor: "var(--primary-500)",
        });
        return;
      }

      // Check if it's a throttle error (status code 429)
      if (error.response?.status === 429) {
        const waitSeconds = error.response.data.wait_seconds || 60;
        setThrottleError("Too many login attempts. Please try again later.");
        setThrottleWaitTime(waitSeconds);

        // Start countdown timer
        let timeLeft = waitSeconds;
        const timer = setInterval(() => {
          timeLeft -= 1;
          setThrottleWaitTime(timeLeft);

          if (timeLeft <= 0) {
            clearInterval(timer);
            setThrottleError(null);
            setThrottleWaitTime(null);
          }
        }, 1000);

        Swal.fire({
          icon: "warning",
          title: "Too Many Attempts",
          text: `Please wait ${waitSeconds} seconds before trying again.`,
          confirmButtonColor: "var(--primary-500)",
          timer: waitSeconds * 1000,
          timerProgressBar: true,
        });
      } else if (error.message === "Network Error") {
        Swal.fire({
          icon: "error",
          title: "Network Error",
          text: "Connection Error pls try again",
          confirmButtonColor: "var(--primary-500)",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <img src={logo} alt="StuMart Logo" className={styles.logo} />
          <h1>Welcome Back</h1>
          <p>Login to access your StuMart account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {throttleError && (
            <div className={styles.throttleError}>
              <p>{throttleError}</p>
              {throttleWaitTime > 0 && (
                <p>Try again in {throttleWaitTime} seconds</p>
              )}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <div className={styles.passwordInput}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className={styles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className={styles.forgotPassword}>
            <NavLink to="/forgot-password">Forgot Password?</NavLink>
          </div>

          <button
            type="submit"
            className={styles.loginButton}
            disabled={isLoading || throttleWaitTime > 0}
          >
            {isLoading
              ? "Logging in..."
              : throttleWaitTime > 0
              ? `Wait ${throttleWaitTime}s`
              : "Login"}
          </button>

          <div className={styles.registerLink}>
            Don't have an account?{" "}
            <NavLink to="/register">Register here</NavLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
