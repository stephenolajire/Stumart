import React, { useState, useEffect } from "react";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUniversity,
  FaMapMarkerAlt,
  FaImage,
  FaBuilding,
  FaList,
  FaHome,
  FaLock,
  FaCreditCard,
  FaMoneyBill,
  FaEye,
  FaEyeSlash,
  FaHouseUser,
} from "react-icons/fa";
import Swal from "sweetalert2";
import {
  nigeriaStates,
  nigeriaInstitutions,
  businessCategories,
  userTypes,
  fleetTypes,
  otherBusinessCategories,
} from "../constant/data";
import logo from "../assets/stumart.jpeg";
import api from "../constant/api";
import { useNavigate } from "react-router-dom";
import { banks } from "../constant/bank";
import { NavLink } from "react-router-dom";
import CategoryDescriptionModal from "./RegistrationModal";

const Signup = () => {
  const [formData, setFormData] = useState({
    userType: "",
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    state: "",
    institution: "",
    profilePic: null,
    fleetType: "",
    businessName: "",
    businessCategory: "",
    specificCategory: "",
    shopImage: null,
    hostelName: "",
    roomNumber: "",
    matricNumber: "",
    department: "",
    accountNumber: "",
    accountName: "",
    bankName: "",
    residence: "",
  });

  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [institutions, setInstitutions] = useState([]);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherCategories, setShowOtherCategories] = useState(false);
  const [throttleError, setThrottleError] = useState(null);
  const [throttleWaitTime, setThrottleWaitTime] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [pendingCategory, setPendingCategory] = useState("");
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Error message mapping for backend errors
  const errorMessages = {
    phone_exists: "A user with this phone number already exists.",
    email_exists: "A user with this email already exists.",
    username_exists: "A user with this username already exists.",
    invalid_phone_format:
      "Phone number must be a valid Nigerian mobile number (07xxxxxxxxx, 08xxxxxxxxx, or 09xxxxxxxxx).",
    invalid_account_number: "Account number must be exactly 10 digits.",
    invalid_email_format: "Please enter a valid email address.",
    password_too_weak:
      "Password must be at least 8 characters and contain uppercase, lowercase, and special characters.",
    image_too_large: "Image file size must be less than 5MB.",
    invalid_image_format: "Only JPEG, PNG, and GIF images are allowed.",
    missing_required_field: "This field is required.",
    invalid_matric_number: "Matric number already exists or is invalid format.",
  };

  // Handle backend validation errors
  const handleBackendErrors = (errorResponse, options = { showSwal: true }) => {
    const backendErrors = {};

    if (!errorResponse?.data) return backendErrors;

    // Handle validation details containing error messages
    if (errorResponse.data.details) {
      // Map through all validation errors
      Object.entries(errorResponse.data.details).forEach(([field, errors]) => {
        if (Array.isArray(errors)) {
          backendErrors[field] = errors[0];
        }
      });

      // Show validation errors in Swal if there are any
      if (options.showSwal && Object.keys(backendErrors).length > 0) {
        const errorMessages = Object.entries(errorResponse.data.details)
          .map(([field, errors]) => `• ${errors[0]}`)
          .join("<br>");

        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          html: `The following errors occurred:<br><br>${errorMessages}`,
          confirmButtonColor: "#f59e0b", // amber-500
        });
      }
    }

    return backendErrors;
  };

  // Map frontend field names to backend field names
  const mapFieldNames = (frontendErrors) => {
    const fieldMapping = {
      firstName: "first_name",
      lastName: "last_name",
      phoneNumber: "phone_number",
      profilePic: "profile_pic",
      fleetType: "fleet_type",
      businessName: "business_name",
      businessCategory: "business_category",
      specificCategory: "specific_category",
      shopImage: "shop_image",
      hostelName: "hostel_name",
      roomNumber: "room_number",
      matricNumber: "matric_number",
      accountNumber: "account_number",
      accountName: "account_name",
      bankName: "bank_name",
      residence: "residence",
    };

    const mappedErrors = {};
    Object.keys(frontendErrors).forEach((backendField) => {
      // Find the frontend field name
      const frontendField =
        Object.keys(fieldMapping).find(
          (key) => fieldMapping[key] === backendField
        ) || backendField;

      mappedErrors[frontendField] = frontendErrors[backendField];
    });

    return mappedErrors;
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.firstName?.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!formData.residence) {
      newErrors.residence = "Residence is required";
    }
    if (!formData.lastName?.trim()) {
      newErrors.lastName = "Last name is required";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Phone number validation
    const phoneRegex = /^0[7-9]\d{9}$/;
    if (!formData.phoneNumber?.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Invalid phone number";
    }

    // State and institution validation
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.institution)
      newErrors.institution = "Institution is required";

    // User type specific validations
    if (!formData.userType) newErrors.userType = "User type is required";

    // Password validations
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (
      !/[A-Z]/.test(formData.password) || // no uppercase
      !/[a-z]/.test(formData.password) || // no lowercase
      !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) // no special char
    ) {
      newErrors.password =
        "Password must include uppercase, lowercase, and a special character";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    // File validations
    if (!formData.profilePic) {
      newErrors.profilePic = "Profile picture is required";
    }

    // User type specific validations
    switch (formData.userType) {
      case "Picker":
        if (!formData.fleetType) {
          newErrors.fleetType = "Fleet type is required";
        }
        break;

      case "Vendor":
        if (!formData.businessName?.trim()) {
          newErrors.businessName = "Business name is required";
        }
        if (!formData.businessCategory) {
          newErrors.businessCategory = "Business category is required";
        }
        if (
          formData.businessCategory === "Others" &&
          !formData.specificCategory
        ) {
          newErrors.specificCategory = "Please select a specific category";
        }
        if (!formData.shopImage) {
          newErrors.shopImage = "Shop image is required";
        }
        break;

      case "Student Picker":
        if (!formData.hostelName?.trim()) {
          newErrors.hostelName = "Hostel name is required";
        }
        if (!formData.roomNumber?.trim()) {
          newErrors.roomNumber = "Room number is required";
        }
        break;

      case "Student":
        if (!formData.matricNumber?.trim()) {
          newErrors.matricNumber = "Matric number is required";
        }
        if (!formData.department?.trim()) {
          newErrors.department = "Department is required";
        }
        break;
    }

    // Bank account validations for specific user types
    if (["Vendor", "Picker", "Student Picker"].includes(formData.userType)) {
      if (!formData.bankName) {
        newErrors.bankName = "Please select a bank";
      }
      if (!formData.accountName?.trim()) {
        newErrors.accountName = "Account name is required";
      }
      if (!/^[0-9]{10}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = "Account number must be exactly 10 digits";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Update institutions when state changes
  useEffect(() => {
    setFormData((prev) => ({ ...prev, institution: "" }));
    setInstitutions(nigeriaInstitutions[formData.state] || []);
  }, [formData.state]);

  // Check form validity for submit button
  useEffect(() => {
    setIsSubmitEnabled(validateForm());
  }, [formData]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "businessCategory") {
      if (value && value !== formData.businessCategory) {
        // Show modal for category confirmation
        setPendingCategory(value);
        setShowCategoryModal(true);
        return; // Don't update formData yet
      } else if (!value) {
        // Handle clearing the selection
        setShowOtherCategories(false);
        setFormData((prev) => ({
          ...prev,
          businessCategory: "",
          specificCategory: "",
        }));
      }
    }

    if (files) {
      setFormData((prev) => ({
        ...prev,
        [name]: files[0],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Scroll to first error field
  const scrollToFirstError = (errors) => {
    const firstErrorField = Object.keys(errors)[0];
    if (firstErrorField) {
      const errorElement = document.querySelector(
        `[name="${firstErrorField}"]`
      );
      if (errorElement) {
        errorElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        errorElement.focus();
      }
    }
  };

  // Show error notification
  const showErrorNotification = (title, message) => {
    Swal.fire({
      icon: "error",
      title,
      text: message,
      confirmButtonColor: "#f59e0b", // amber-500
    });
  };

  // Handle different HTTP status codes
  const handleHttpError = (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // First handle validation errors if they exist
    if (data?.details) {
      const errorMessages = Object.entries(data.details)
        .map(
          ([field, errors]) => `• ${Array.isArray(errors) ? errors[0] : errors}`
        )
        .join("<br>");

      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        html: `The following errors occurred:<br><br>${errorMessages}`,
        confirmButtonColor: "#f59e0b",
      });

      // Also update form errors
      const backendErrors = handleBackendErrors(error.response, {
        showSwal: false,
      });
      const mappedErrors = mapFieldNames(backendErrors);
      setErrors((prevErrors) => ({
        ...prevErrors,
        ...mappedErrors,
      }));

      return true;
    }

    // Then handle HTTP status codes with specific messages
    let title = "Error";
    let message = "An unexpected error occurred";

    switch (status) {
      case 400:
        title = "Invalid Request";
        message = data?.error || "Please check your input and try again";
        break;

      case 401:
        title = "Authentication Error";
        message = "Please check your credentials and try again";
        break;

      case 403:
        title = "Access Denied";
        message =
          data?.detail || "You don't have permission to perform this action";
        break;

      case 404:
        title = "Not Found";
        message = "The requested resource was not found";
        break;

      case 409:
        title = "Conflict";
        message =
          data?.detail || "A conflict occurred. The resource may already exist";
        break;

      case 429:
        title = "Too Many Requests";
        const waitTime = data?.wait_seconds || 60;
        message = `Too many attempts. Please wait ${waitTime} seconds before trying again`;
        setThrottleError(message);
        setThrottleWaitTime(waitTime);

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
        break;

      case 500:
        title = "Server Error";
        message = "An internal server error occurred. Please try again later";
        break;

      case 503:
        title = "Service Unavailable";
        message =
          "The service is temporarily unavailable. Please try again later";
        break;

      default:
        title = "Registration Failed";
        message =
          data?.detail || error.message || "An unexpected error occurred";
    }

    // Show error notification
    Swal.fire({
      icon: "error",
      title: title,
      text: message,
      confirmButtonColor: "#f59e0b",
    });

    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm() || throttleWaitTime > 0) return;

    setIsLoading(true);
    setThrottleError(null);
    setErrors({});

    try {
      // Create form data
      const formDataToSend = new FormData();

      // Add common user fields
      formDataToSend.append("email", formData.email);
      formDataToSend.append("username", formData.email);
      formDataToSend.append("password", formData.password);
      formDataToSend.append("first_name", formData.firstName);
      formDataToSend.append("last_name", formData.lastName);
      formDataToSend.append("phone_number", formData.phoneNumber);
      formDataToSend.append("state", formData.state);
      formDataToSend.append("institution", formData.institution);
      formDataToSend.append("residence", formData.residence);
      formDataToSend.append(
        "user_type",
        formData.userType.toLowerCase().replace(" ", "_")
      );

      // Handle profile picture
      if (formData.profilePic) {
        formDataToSend.append("profile_pic", formData.profilePic);
      }

      let endpoint = "";

      // Handle specific user types
      switch (formData.userType) {
        case "Student":
          endpoint = "/students/";
          formDataToSend.append("matric_number", formData.matricNumber);
          formDataToSend.append("department", formData.department);
          break;

        case "Vendor":
          endpoint = "/vendors/";
          formDataToSend.append("business_name", formData.businessName);
          formDataToSend.append(
            "business_category",
            formData.businessCategory.toLowerCase()
          );
          if (formData.businessCategory === "Others") {
            formDataToSend.append(
              "specific_category",
              formData.specificCategory
            );
          }
          if (formData.shopImage) {
            formDataToSend.append("shop_image", formData.shopImage);
          }
          // Add bank details
          formDataToSend.append("bank_name", formData.bankName);
          formDataToSend.append("account_name", formData.accountName);
          formDataToSend.append("account_number", formData.accountNumber);
          break;

        case "Picker":
          endpoint = "/pickers/";
          formDataToSend.append("fleet_type", formData.fleetType.toLowerCase());
          // Add bank details
          formDataToSend.append("bank_name", formData.bankName);
          formDataToSend.append("account_name", formData.accountName);
          formDataToSend.append("account_number", formData.accountNumber);
          break;

        case "Student Picker":
          endpoint = "/student-pickers/";
          formDataToSend.append("hostel_name", formData.hostelName);
          formDataToSend.append("room_number", formData.roomNumber);
          // Add bank details
          formDataToSend.append("bank_name", formData.bankName);
          formDataToSend.append("account_name", formData.accountName);
          formDataToSend.append("account_number", formData.accountNumber);
          break;

        default:
          throw new Error("Invalid user type");
      }

      const response = await api.post(endpoint, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data?.user?.id || response.data?.user_id) {
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Please check your email for verification code.",
          confirmButtonColor: "#f59e0b",
        });

        const userId = response.data?.user?.id || response.data?.user_id;

        // Store user data in localStorage
        localStorage.setItem("user_id", userId);
        localStorage.setItem("user_type", formData.userType.toLowerCase());

        // Navigate to verify email
        navigate("/verify-email", {
          state: { userId },
        });
      }
    } catch (error) {
      console.error("Error during signup:", error);
      setIsLoading(false);
      handleHttpError(error);
    }
  };

  const handleConfirmCategory = () => {
    setFormData((prev) => ({
      ...prev,
      businessCategory: pendingCategory,
      specificCategory: "", // Reset specific category when main category changes
    }));
    setShowOtherCategories(pendingCategory === "Others");
    setShowCategoryModal(false);
    setPendingCategory("");
  };

  const handleCancelCategory = () => {
    setShowCategoryModal(false);
    setPendingCategory("");
    // Reset the select element to show current value
    const selectElement = document.querySelector(
      'select[name="businessCategory"]'
    );
    if (selectElement) {
      selectElement.value = formData.businessCategory;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Logo Section */}
          <div className="text-center pt-8 pb-6 px-6 bg-gradient-to-b from-white to-gray-50">
            <img
              src={logo}
              alt="StuMart Logo"
              className="w-16 h-16 mx-auto mb-4 rounded-full object-cover"
            />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Welcome to StuMart
            </h2>
            <p className="text-gray-500 text-sm">
              Create an account to get started
            </p>
          </div>

          <div className="px-6 pb-8">
            {throttleError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-600 text-sm font-medium">
                  {throttleError}
                </p>
                {throttleWaitTime > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    Try again in {throttleWaitTime} seconds
                  </p>
                )}
              </div>
            )}

            <div className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  User Type
                </label>
                <select
                  name="userType"
                  value={formData.userType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select User Type</option>
                  {userTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.userType && (
                  <span className="text-red-500 text-sm">
                    {errors.userType}
                  </span>
                )}
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaUser className="mr-2 text-amber-500" /> First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter first name"
                  />
                  {errors.firstName && (
                    <span className="text-red-500 text-sm">
                      {errors.firstName}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaUser className="mr-2 text-amber-500" /> Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    placeholder="Enter last name"
                  />
                  {errors.lastName && (
                    <span className="text-red-500 text-sm">
                      {errors.lastName}
                    </span>
                  )}
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaEnvelope className="mr-2 text-amber-500" /> Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter email address"
                />
                {errors.email && (
                  <span className="text-red-500 text-sm">{errors.email}</span>
                )}
              </div>

              {/* Phone Number Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaPhone className="mr-2 text-amber-500" /> Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  placeholder="Enter phone number"
                />
                {errors.phoneNumber && (
                  <span className="text-red-500 text-sm">
                    {errors.phoneNumber}
                  </span>
                )}
              </div>

              {/* State Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaMapMarkerAlt className="mr-2 text-amber-500" /> State of
                  Schooling/Operating
                </label>
                <select
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select State</option>
                  {nigeriaStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
                {errors.state && (
                  <span className="text-red-500 text-sm">{errors.state}</span>
                )}
              </div>

              {/* Institution Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaUniversity className="mr-2 text-amber-500" /> Institution
                </label>
                <select
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  disabled={!formData.state}
                >
                  <option value="">
                    {formData.state
                      ? "Select Institution"
                      : "First select a state"}
                  </option>
                  {institutions.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
                {errors.institution && (
                  <span className="text-red-500 text-sm">
                    {errors.institution}
                  </span>
                )}
              </div>

              {/* Residence Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaHouseUser className="mr-2 text-amber-500" /> Residence
                </label>
                <select
                  name="residence"
                  value={formData.residence}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                >
                  <option value="">Select Residence</option>
                  <option value="on_campus">On Campus</option>
                  <option value="off_campus">Off Campus</option>
                </select>
                {errors.residence && (
                  <span className="text-red-500 text-sm">
                    {errors.residence}
                  </span>
                )}
              </div>

              {/* Profile Picture Field */}
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium text-gray-700">
                  <FaImage className="mr-2 text-amber-500" /> Profile Picture
                </label>
                <input
                  type="file"
                  name="profilePic"
                  onChange={handleChange}
                  accept="image/*"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                />
                {errors.profilePic && (
                  <span className="text-red-500 text-sm">
                    {errors.profilePic}
                  </span>
                )}
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaLock className="mr-2 text-amber-500" /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter password"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <FaEyeSlash size={18} />
                      ) : (
                        <FaEye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <span className="text-red-500 text-sm">
                      {errors.password}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-medium text-gray-700">
                    <FaLock className="mr-2 text-amber-500" /> Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Confirm password"
                    />
                    <button
                      type="button"
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors duration-200"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <FaEyeSlash size={18} />
                      ) : (
                        <FaEye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span className="text-red-500 text-sm">
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              {/* User Type Specific Fields */}
              {formData.userType === "Picker" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Fleet Type
                  </label>
                  <select
                    name="fleetType"
                    value={formData.fleetType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select Fleet Type</option>
                    {fleetTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  {errors.fleetType && (
                    <span className="text-red-500 text-sm">
                      {errors.fleetType}
                    </span>
                  )}
                </div>
              )}

              {formData.userType === "Vendor" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaBuilding className="mr-2 text-amber-500" /> Business
                      Name
                    </label>
                    <input
                      type="text"
                      name="businessName"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter business name"
                    />
                    {errors.businessName && (
                      <span className="text-red-500 text-sm">
                        {errors.businessName}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaList className="mr-2 text-amber-500" /> Business
                      Category
                    </label>
                    <select
                      name="businessCategory"
                      value={formData.businessCategory}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">Select Business Category</option>
                      {businessCategories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                    {errors.businessCategory && (
                      <span className="text-red-500 text-sm">
                        {errors.businessCategory}
                      </span>
                    )}
                  </div>

                  {showOtherCategories && (
                    <div className="space-y-2">
                      <label className="flex items-center text-sm font-medium text-gray-700">
                        <FaList className="mr-2 text-amber-500" /> Specific
                        Category
                      </label>
                      <select
                        name="specificCategory"
                        value={formData.specificCategory}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      >
                        <option value="">Select Specific Category</option>
                        {otherBusinessCategories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                      {errors.specificCategory && (
                        <span className="text-red-500 text-sm">
                          {errors.specificCategory}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaImage className="mr-2 text-amber-500" /> Shop Image
                    </label>
                    <input
                      type="file"
                      name="shopImage"
                      onChange={handleChange}
                      accept="image/*"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                      placeholder="Input Business Image"
                    />
                    {errors.shopImage && (
                      <span className="text-red-500 text-sm">
                        {errors.shopImage}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {formData.userType === "Student Picker" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaHome className="mr-2 text-amber-500" /> Hostel Name
                    </label>
                    <input
                      type="text"
                      name="hostelName"
                      value={formData.hostelName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter hostel name"
                    />
                    {errors.hostelName && (
                      <span className="text-red-500 text-sm">
                        {errors.hostelName}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Room Number
                    </label>
                    <input
                      type="text"
                      name="roomNumber"
                      value={formData.roomNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter room number"
                    />
                    {errors.roomNumber && (
                      <span className="text-red-500 text-sm">
                        {errors.roomNumber}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {formData.userType === "Student" && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaUniversity className="mr-2 text-amber-500" /> Matric
                      Number
                    </label>
                    <input
                      type="text"
                      name="matricNumber"
                      value={formData.matricNumber}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter matric number"
                    />
                    {errors.matricNumber && (
                      <span className="text-red-500 text-sm">
                        {errors.matricNumber}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-medium text-gray-700">
                      <FaList className="mr-2 text-amber-500" /> Department
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                      placeholder="Enter department"
                    />
                    {errors.department && (
                      <span className="text-red-500 text-sm">
                        {errors.department}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Account Details for Vendor, Picker, and Student Picker */}
              {["Vendor", "Picker", "Student Picker"].includes(
                formData.userType
              ) && (
                <div className="space-y-6">
                  <div className="border-t border-gray-200 pt-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Bank Account Details
                    </h3>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                          <FaMoneyBill className="mr-2 text-amber-500" /> Bank
                          Name
                        </label>
                        <select
                          name="bankName"
                          value={formData.bankName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                        >
                          <option value="">Select a bank</option>
                          {banks.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                        {errors.bankName && (
                          <span className="text-red-500 text-sm">
                            {errors.bankName}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                          <FaUser className="mr-2 text-amber-500" /> Account
                          Name
                        </label>
                        <input
                          type="text"
                          name="accountName"
                          value={formData.accountName}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter account name"
                        />
                        {errors.accountName && (
                          <span className="text-red-500 text-sm">
                            {errors.accountName}
                          </span>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label className="flex items-center text-sm font-medium text-gray-700">
                          <FaCreditCard className="mr-2 text-amber-500" />{" "}
                          Account Number
                        </label>
                        <input
                          type="text"
                          name="accountNumber"
                          value={formData.accountNumber}
                          onChange={handleChange}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter 10-digit account number"
                          maxLength="10"
                        />
                        {errors.accountNumber && (
                          <span className="text-red-500 text-sm">
                            {errors.accountNumber}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg mt-8"
                disabled={!isSubmitEnabled || isLoading || throttleWaitTime > 0}
              >
                {isLoading
                  ? "Creating Account..."
                  : throttleWaitTime > 0
                  ? `Wait ${throttleWaitTime}s`
                  : "Create Account"}
              </button>

              {/* Login Link */}
              <div className="text-center text-sm text-gray-600 mt-6">
                Already have an account?{" "}
                <NavLink
                  to="/login"
                  className="text-amber-600 hover:text-amber-700 font-medium transition-colors duration-200"
                >
                  log in
                </NavLink>
              </div>
            </div>
          </div>
        </form>

        <CategoryDescriptionModal
          category={pendingCategory}
          isOpen={showCategoryModal}
          onConfirm={handleConfirmCategory}
          onCancel={handleCancelCategory}
        />
      </div>
    </div>
  );
};

export default Signup;
