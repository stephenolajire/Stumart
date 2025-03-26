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
} from "react-icons/fa";
import styles from "../css/SignUp.module.css";
import {
  nigeriaStates,
  nigeriaInstitutions,
  businessCategories,
  userTypes,
  fleetTypes,
} from "../constant/data";
import logo from "../assets/stumart.jpeg";

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
    shopImage: null,
    hostelName: "",
    roomNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [institutions, setInstitutions] = useState([]);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {};

    // Common validations
    if (!formData.firstName.trim())
      newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!emailRegex.test(formData.email))
      newErrors.email = "Invalid email format";

    // Phone number validation
    const phoneRegex = /^0[7-9]\d{9}$/;
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = "Phone number is required";
    else if (!phoneRegex.test(formData.phoneNumber))
      newErrors.phoneNumber = "Invalid phone number";

    // State and institution validation
    if (!formData.state) newErrors.state = "State is required";
    if (!formData.institution)
      newErrors.institution = "Institution is required";

    // User type specific validations
    if (!formData.userType) newErrors.userType = "User type is required";

    // Picker-specific validations
    if (formData.userType === "Picker") {
      if (!formData.fleetType) newErrors.fleetType = "Fleet type is required";
    }

    // Vendor-specific validations
    if (formData.userType === "Vendor") {
      if (!formData.businessName.trim())
        newErrors.businessName = "Business name is required";
      if (!formData.businessCategory)
        newErrors.businessCategory = "Business category is required";
    }

    // Student Picker-specific validations
    if (formData.userType === "Student Picker") {
      if (!formData.hostelName.trim())
        newErrors.hostelName = "Hostel name is required";
      if (!formData.roomNumber.trim())
        newErrors.roomNumber = "Room number is required";
    }

    // Password validations
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
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

    if (formData.userType === "Vendor" && !formData.shopImage) {
      newErrors.shopImage = "Shop image is required";
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

    if (name === "profilePic" || name === "shopImage") {
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
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Handle form submission
        console.log("Form submitted:", formData);
        // Add your API call here
      } catch (error) {
        console.error("Submission error:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className={styles.signupContainer}>
      <form onSubmit={handleSubmit} className={styles.signupForm}>
        <div className={styles.logoSection}>
          <img src={logo} alt="StuMart Logo" className={styles.logo} />
            <h2>Welcome to StuMart</h2>
            <p>Create an account to get started</p>
        </div> 

        {/* User Type Selection */}
        <div className={styles.formGroup}>
          <label>User Type</label>
          <select
            name="userType"
            value={formData.userType}
            onChange={handleChange}
            className={styles.formControl}
          >
            <option value="">Select User Type</option>
            {userTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.userType && (
            <span className={styles.error}>{errors.userType}</span>
          )}
        </div>

        {/* Common Fields */}
        <div className={styles.formGroup}>
          <div className={styles.nameGroup}>
            <div>
              <label>
                <FaUser /> First Name
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <span className={styles.error}>{errors.firstName}</span>
              )}
            </div>
            <div>
              <label>
                <FaUser /> Last Name
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <span className={styles.error}>{errors.lastName}</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaEnvelope /> Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={styles.formControl}
            placeholder="Enter email address"
          />
          {errors.email && <span className={styles.error}>{errors.email}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaPhone /> Phone Number
          </label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={styles.formControl}
            placeholder="Enter phone number"
          />
          {errors.phoneNumber && (
            <span className={styles.error}>{errors.phoneNumber}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaMapMarkerAlt /> State of Schooling
          </label>
          <select
            name="state"
            value={formData.state}
            onChange={handleChange}
            className={styles.formControl}
          >
            <option value="">Select State</option>
            {nigeriaStates.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          {errors.state && <span className={styles.error}>{errors.state}</span>}
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaUniversity /> Institution
          </label>
          <select
            name="institution"
            value={formData.institution}
            onChange={handleChange}
            className={styles.formControl}
            disabled={!formData.state}
          >
            <option value="">
              {formData.state ? "Select Institution" : "First select a state"}
            </option>
            {institutions.map((inst) => (
              <option key={inst} value={inst}>
                {inst}
              </option>
            ))}
          </select>
          {errors.institution && (
            <span className={styles.error}>{errors.institution}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaImage /> Profile Picture
          </label>
          <input
            type="file"
            name="profilePic"
            onChange={handleChange}
            accept="image/*"
            className={styles.formControl}
          />
          {errors.profilePic && (
            <span className={styles.error}>{errors.profilePic}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaLock /> Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={styles.formControl}
            placeholder="Enter password"
          />
          {errors.password && (
            <span className={styles.error}>{errors.password}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <label>
            <FaLock /> Confirm Password
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={styles.formControl}
            placeholder="Confirm password"
          />
          {errors.confirmPassword && (
            <span className={styles.error}>{errors.confirmPassword}</span>
          )}
        </div>

        {/* User Type Specific Fields */}
        {formData.userType === "Picker" && (
          <div className={styles.formGroup}>
            <label>Fleet Type</label>
            <select
              name="fleetType"
              value={formData.fleetType}
              onChange={handleChange}
              className={styles.formControl}
            >
              <option value="">Select Fleet Type</option>
              {fleetTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            {errors.fleetType && (
              <span className={styles.error}>{errors.fleetType}</span>
            )}
          </div>
        )}

        {formData.userType === "Vendor" && (
          <>
            <div className={styles.formGroup}>
              <label>
                <FaBuilding /> Business Name
              </label>
              <input
                type="text"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter business name"
              />
              {errors.businessName && (
                <span className={styles.error}>{errors.businessName}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>
                <FaList /> Business Category
              </label>
              <select
                name="businessCategory"
                value={formData.businessCategory}
                onChange={handleChange}
                className={styles.formControl}
              >
                <option value="">Select Business Category</option>
                {businessCategories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.businessCategory && (
                <span className={styles.error}>{errors.businessCategory}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>
                <FaList /> Shop Image
              </label>
              <input
                type="file"
                name="shopImage"
                onChange={handleChange}
                accept="image/*"
                className={styles.formControl}
                placeholder="Input Business Image"
              />
              {errors.shopImage && (
                <span className={styles.error}>{errors.shopImage}</span>
              )}
            </div>
          </>
        )}

        {formData.userType === "Student Picker" && (
          <>
            <div className={styles.formGroup}>
              <label>
                <FaHome /> Hostel Name
              </label>
              <input
                type="text"
                name="hostelName"
                value={formData.hostelName}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter hostel name"
              />
              {errors.hostelName && (
                <span className={styles.error}>{errors.hostelName}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>Room Number</label>
              <input
                type="text"
                name="roomNumber"
                value={formData.roomNumber}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter room number"
              />
              {errors.roomNumber && (
                <span className={styles.error}>{errors.roomNumber}</span>
              )}
            </div>
          </>
        )}

        <button
          type="submit"
          className={styles.submitButton}
          disabled={!isSubmitEnabled || isLoading}
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>
      </form>
    </div>
  );
};

export default Signup;
