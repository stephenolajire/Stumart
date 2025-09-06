import { useContext, useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import Swal from "sweetalert2";
import api from "../constant/api";
import { GlobalContext } from "../constant/GlobalContext";
import { FaEye, FaEyeSlash } from "react-icons/fa";

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
  const [showPassword, setShowPassword] = useState(false);
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
        confirmButtonColor: "#f59e0b",
      });
    } catch (error) {
      console.error("OTP resend error:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to Send OTP",
        text: error.response?.data?.error || "Failed to send verification code",
        confirmButtonColor: "#f59e0b",
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
      localStorage.setItem("institution", institution);
      api.defaults.headers.common["Authorization"] = `Bearer ${access}`;
      localStorage.setItem("user_id", user_id);

      // If user is not verified, send OTP and navigate to email verification
      if (!is_verified) {
        await handleResendOTP(user_id);
        navigate("/verify-email", { state: { userId: user_id } });
        return;
      }

      // If user is a student and verified, navigate to home
      if (user_type === "admin" && is_admin == true) {
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
        if (!kyc_status || kyc_status === "rejected" || kyc_status === "none") {
          Swal.fire({
            icon: "warning",
            title: "KYC Not Submitted or Rejected",
            text: "Your KYC verification is required. Please submit your details.",
            confirmButtonColor: "#f59e0b",
          }).then(() => {
            navigate("/verify-account");
          });
          return;
        }

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
        confirmButtonColor: "#f59e0b",
      });
    } catch (error) {
      console.error("Login error:", error);

      if (error.response.status === 401) {
        Swal.fire({
          icon: "error",
          title: "Login Failed",
          text: "Invalid email or password. Please try again.",
          confirmButtonColor: "#f59e0b",
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
          confirmButtonColor: "#f59e0b",
          timer: waitSeconds * 1000,
          timerProgressBar: true,
        });
      } else if (error.message === "Network Error") {
        Swal.fire({
          icon: "error",
          title: "Network Error",
          text: "Connection Error pls try again",
          confirmButtonColor: "#f59e0b",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Logo Section */}
        <div className="text-center pt-8 pb-6 px-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-black rounded-full flex items-center justify-center">
            <div className="text-white font-bold text-sm">
              <img src="/stumart.jpeg" alt="logo" className="rounded-full"/>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-sm">
            Login to access your StuMart account
          </p>
        </div>

        {/* Form Section */}
        <div className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {throttleError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <p className="text-red-600">{throttleError}</p>
                {throttleWaitTime > 0 && (
                  <p className="text-red-500 mt-1">
                    Try again in {throttleWaitTime} seconds
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <FaEyeSlash size={18} />
                  ) : (
                    <FaEye size={18} />
                  )}
                </button>
              </div>
            </div>

            <div className="text-right">
              <NavLink
                to="/forgot-password"
                className="text-sm text-amber-600 hover:text-amber-700 font-medium transition-colors duration-200"
              >
                Forgot Password?
              </NavLink>
            </div>

            <button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] mt-6"
              disabled={isLoading || throttleWaitTime > 0}
            >
              {isLoading
                ? "Logging in..."
                : throttleWaitTime > 0
                ? `Wait ${throttleWaitTime}s`
                : "Login"}
            </button>

            <div className="text-center text-sm text-gray-600 mt-6">
              Don't have an account?{" "}
              <NavLink
                to="/register"
                className="text-amber-600 hover:text-amber-700 font-medium transition-colors duration-200"
              >
                Register here
              </NavLink>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};


export default Login;
