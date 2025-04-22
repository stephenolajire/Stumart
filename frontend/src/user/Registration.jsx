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
} from "react-icons/fa";
import Swal from "sweetalert2";
import styles from "../css/SignUp.module.css";
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
  });

  const navigate = useNavigate();

  const [errors, setErrors] = useState({});
  const [institutions, setInstitutions] = useState([]);
  const [isSubmitEnabled, setIsSubmitEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showOtherCategories, setShowOtherCategories] = useState(false);

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

    // Picker-specific validations
    if (formData.userType === "Picker") {
      if (!formData.fleetType) newErrors.fleetType = "Fleet type is required";
    }

    // Vendor-specific validations
    if (formData.userType === "Vendor") {
      if (!formData.businessName.trim()) {
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
    }

    // Student Picker-specific validations
    if (formData.userType === "Student Picker") {
      if (!formData.hostelName.trim())
        newErrors.hostelName = "Hostel name is required";
      if (!formData.roomNumber.trim())
        newErrors.roomNumber = "Room number is required";
    }

    // Student-specific validations
    if (formData.userType === "Student") {
      if (!formData.matricNumber.trim()) {
        newErrors.matricNumber = "Matric number is required";
      }
      if (!formData.department.trim()) {
        newErrors.department = "Department is required";
      }
    }

    // Bank account validations for Vendor, Picker, and Student Picker
    if (["Vendor", "Picker", "Student Picker"].includes(formData.userType)) {
      if (!formData.bankName) {
        newErrors.bankName = "Please select a bank";
      }
      if (!formData.accountName.trim()) {
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
      setShowOtherCategories(value === "Others");
    }

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
        // Create form data
        const formDataToSend = new FormData();

        // Add all user fields
        const userData = {
          email: formData.email,
          username: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          phone_number: formData.phoneNumber,
          state: formData.state,
          institution: formData.institution,
          user_type: formData.userType.toLowerCase().replace(" ", "_"),
        };

        // Append each user field separately
        Object.keys(userData).forEach((key) => {
          formDataToSend.append(`user.${key}`, userData[key]);
        });

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
              // Use the value from the selected option
              formDataToSend.append(
                "specific_category",
                formData.specificCategory // This will now be the value like "laundry", "note_writing", etc.
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
            formDataToSend.append(
              "fleet_type",
              formData.fleetType.toLowerCase()
            );
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

        // Log form data for debugging
        for (let pair of formDataToSend.entries()) {
          console.log(pair[0], pair[1]);
        }

        const response = await api.post(endpoint, formDataToSend, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.data?.user_id) {
          await Swal.fire({
            icon: "success",
            title: "Registration Successful!",
            text: "Please check your email for verification code.",
            confirmButtonColor: "var(--primary-500)",
          });

          // Navigate to verify email with user ID
          navigate("/verify-email", {
            state: { userId: response.data.user_id },
          });
        }
      } catch (error) {
        console.error("Registration error:", error);

        // Handle different types of errors
        const errorMessage =
          error.response?.data?.detail ||
          error.response?.data?.message ||
          Object.values(error.response?.data || {})[0]?.[0] ||
          error.message ||
          "Registration failed. Please try again.";

        Swal.fire({
          icon: "error",
          title: "Registration Failed",
          text: errorMessage,
          confirmButtonColor: "var(--primary-500)",
        });
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
            <FaMapMarkerAlt /> State of Schooling/Operating
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

            {showOtherCategories && (
              <div className={styles.formGroup}>
                <label>
                  <FaList /> Specific Category
                </label>
                <select
                  name="specificCategory"
                  value={formData.specificCategory}
                  onChange={handleChange}
                  className={styles.formControl}
                >
                  <option value="">Select Specific Category</option>
                  {otherBusinessCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.specificCategory && (
                  <span className={styles.error}>
                    {errors.specificCategory}
                  </span>
                )}
              </div>
            )}

            <div className={styles.formGroup}>
              <label>
                <FaImage /> Shop Image
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

        {formData.userType === "Student" && (
          <>
            <div className={styles.formGroup}>
              <label>
                <FaUniversity /> Matric Number
              </label>
              <input
                type="text"
                name="matricNumber"
                value={formData.matricNumber}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter matric number"
              />
              {errors.matricNumber && (
                <span className={styles.error}>{errors.matricNumber}</span>
              )}
            </div>
            <div className={styles.formGroup}>
              <label>
                <FaList /> Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter department"
              />
              {errors.department && (
                <span className={styles.error}>{errors.department}</span>
              )}
            </div>
          </>
        )}

        {/* Bank Account Details for Vendor, Picker, and Student Picker */}
        {["Vendor", "Picker", "Student Picker"].includes(formData.userType) && (
          <>
            <div className={styles.formGroup}>
              <label>
                <FaMoneyBill /> Bank Name
              </label>
              <select
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className={styles.formControl}
              >
                <option value="">Select a bank</option>
                {banks.map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
              {errors.bankName && (
                <span className={styles.error}>{errors.bankName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                <FaUser /> Account Name
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter account name"
              />
              {errors.accountName && (
                <span className={styles.error}>{errors.accountName}</span>
              )}
            </div>

            <div className={styles.formGroup}>
              <label>
                <FaCreditCard /> Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className={styles.formControl}
                placeholder="Enter 10-digit account number"
                maxLength="10"
              />
              {errors.accountNumber && (
                <span className={styles.error}>{errors.accountNumber}</span>
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
