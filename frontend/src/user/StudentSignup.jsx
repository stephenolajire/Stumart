import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUniversity,
  FaMapMarkerAlt,
  FaImage,
  FaList,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaHouseUser,
  FaArrowLeft,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { nigeriaStates, nigeriaInstitutions } from "../constant/data";
import logo from "../assets/stumart.jpeg";
import { useRegisterStudent } from "../hooks/useUser";

const StudentSignup = () => {
  const navigate = useNavigate();
  const { mutate: registerStudent, isPending } = useRegisterStudent();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    state: "",
    institution: "",
  });

  const [errors, setErrors] = useState({});
  const [institutions, setInstitutions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [throttleWaitTime, setThrottleWaitTime] = useState(null);
  const [throttleError, setThrottleError] = useState(null);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, institution: "" }));
    setInstitutions(nigeriaInstitutions[formData.state] || []);
  }, [formData.state]);

  const validate = () => {
    const e = {};
    if (!formData.firstName?.trim()) e.firstName = "First name is required";
    if (!formData.lastName?.trim()) e.lastName = "Last name is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) e.email = "Email is required";
    else if (!emailRegex.test(formData.email)) e.email = "Invalid email format";
    const phoneRegex = /^0[7-9]\d{9}$/;
    if (!formData.phoneNumber?.trim())
      e.phoneNumber = "Phone number is required";
    else if (!phoneRegex.test(formData.phoneNumber))
      e.phoneNumber = "Invalid phone number";
    if (!formData.state) e.state = "State is required";
    if (!formData.institution) e.institution = "Institution is required";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8) e.password = "Minimum 8 characters";
    else if (
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    )
      e.password = "Must include uppercase, lowercase, and special character";
    if (!formData.confirmPassword)
      e.confirmPassword = "Please confirm password";
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleHttpError = (error) => {
    const status = error.response?.status;
    const data = error.response?.data;
    if (data?.details) {
      const msgs = Object.entries(data.details)
        .map(([, errs]) => `• ${Array.isArray(errs) ? errs[0] : errs}`)
        .join("<br>");
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        html: msgs,
        confirmButtonColor: "#f59e0b",
      });
      return;
    }
    if (status === 429) {
      const wait = data?.wait_seconds || 60;
      setThrottleError(`Too many attempts. Wait ${wait}s`);
      setThrottleWaitTime(wait);
      const interval = setInterval(() => {
        setThrottleWaitTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setThrottleError(null);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      return;
    }
    Swal.fire({
      icon: "error",
      title: "Registration Failed",
      text: data?.error || error.message,
      confirmButtonColor: "#f59e0b",
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate() || throttleWaitTime > 0) return;
    const fd = new FormData();
    fd.append("email", formData.email);
    fd.append("username", formData.email);
    fd.append("password", formData.password);
    fd.append("first_name", formData.firstName);
    fd.append("last_name", formData.lastName);
    fd.append("phone_number", formData.phoneNumber);
    fd.append("state", formData.state);
    fd.append("institution", formData.institution);
    fd.append("user_type", "student");

    registerStudent(fd, {
      onSuccess: (data) => {
        const userId = data?.user?.id || data?.user_id;
        localStorage.setItem("user_id", userId);
        localStorage.setItem("user_type", "student");
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Check your email for verification code.",
          confirmButtonColor: "#f59e0b",
        });
        navigate("/verify-email", { state: { userId } });
      },
      onError: handleHttpError,
    });
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200";
  const labelClass = "flex items-center text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-linear-to-br from-yellow-50 via-orange-50 to-amber-50 py-8 px-4">
      <div className="w-full max-w-[600px] mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="text-center pt-8 pb-6 px-6 bg-linear-to-b from-white to-gray-50">
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="absolute left-4 top-4 text-gray-400 hover:text-gray-600 flex items-center gap-1 text-sm"
            >
              <FaArrowLeft /> Back
            </button>
            <img
              src={logo}
              alt="StuMart"
              className="w-14 h-14 mx-auto mb-3 rounded-full object-cover"
            />
            <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-full px-4 py-1.5 mb-3">
              <span className="text-lg">🎓</span>
              <span className="text-sm font-semibold text-yellow-700">
                Student Registration
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Create Student Account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Shop and get deliveries on campus
            </p>
          </div>

          <div className="px-6 pb-8 space-y-5">
            {throttleError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-600 text-sm">{throttleError}</p>
                {throttleWaitTime > 0 && (
                  <p className="text-red-500 text-xs mt-1">
                    Try again in {throttleWaitTime}s
                  </p>
                )}
              </div>
            )}

            {/* Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <FaUser className="mr-2 text-yellow-500" /> First Name
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  <FaUser className="mr-2 text-yellow-500" /> Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className={labelClass}>
                <FaEnvelope className="mr-2 text-yellow-500" /> Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className={labelClass}>
                <FaPhone className="mr-2 text-yellow-500" /> Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={inputClass}
                placeholder="08012345678"
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.phoneNumber}
                </p>
              )}
            </div>

            {/* State */}
            <div>
              <label className={labelClass}>
                <FaMapMarkerAlt className="mr-2 text-yellow-500" /> State
              </label>
              <select
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select State</option>
                {nigeriaStates.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>

            {/* Institution */}
            <div>
              <label className={labelClass}>
                <FaUniversity className="mr-2 text-yellow-500" /> Institution
              </label>
              <select
                name="institution"
                value={formData.institution}
                onChange={handleChange}
                className={inputClass}
                disabled={!formData.state}
              >
                <option value="">
                  {formData.state ? "Select Institution" : "Select state first"}
                </option>
                {institutions.map((i) => (
                  <option key={i} value={i}>
                    {i}
                  </option>
                ))}
              </select>
              {errors.institution && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.institution}
                </p>
              )}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <FaLock className="mr-2 text-yellow-500" /> Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`${inputClass} pr-10`}
                    placeholder="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                )}
              </div>
              <div>
                <label className={labelClass}>
                  <FaLock className="mr-2 text-yellow-500" /> Confirm
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`${inputClass} pr-10`}
                    placeholder="Confirm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || throttleWaitTime > 0}
              className="w-full py-3.5 rounded-xl font-semibold text-white text-base transition-all duration-200 mt-4"
              style={{
                backgroundColor:
                  isPending || throttleWaitTime > 0 ? "#d1d5db" : "#f59e0b",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {isPending
                ? "Creating Account..."
                : throttleWaitTime > 0
                  ? `Wait ${throttleWaitTime}s`
                  : "Create Student Account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a href="/login" className="text-yellow-600 font-medium">
                Log in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentSignup;
