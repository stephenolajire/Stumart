// Settings.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/Settings.module.css";
import {
  FaUser,
  FaIdCard,
  FaPhone,
  FaUniversity,
  FaMapMarkerAlt,
  FaTruck,
  FaToggleOn,
  FaToggleOff,
  FaMoneyBillWave,
} from "react-icons/fa";
import api from "../constant/api";

const Settings = () => {
  const [profileData, setProfileData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    institution: "",
    state: "",
    profile_pic: null,
    is_available: true,
    bank_name: "",
    account_number: "",
    account_name: "",
    is_verified: false,
    // Fields specific to picker type
    fleet_type: "",
    hostel_name: "",
    room_number: "",
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formChanged, setFormChanged] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [userType, setUserType] = useState("");

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        const response = await api.get("settings/", {});

        setProfileData(response.data);
        setImagePreview(response.data.profile_pic);

        // Determine user type based on data
        if ("fleet_type" in response.data) {
          setUserType("picker");
        } else if ("hostel_name" in response.data) {
          setUserType("student_picker");
        }

        setLoading(false);
      } catch (err) {
        setError("Failed to load profile data");
        setLoading(false);
        console.error(err);
      }
    };

    fetchProfileData();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === "file") {
      setProfileData({
        ...profileData,
        [name]: files[0],
      });

      // Create preview URL
      if (files && files[0]) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setImagePreview(e.target.result);
        };
        reader.readAsDataURL(files[0]);
      }
    } else {
      setProfileData({
        ...profileData,
        [name]: type === "checkbox" ? checked : value,
      });
    }

    setFormChanged(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("accessToken");

      // Create FormData for file upload
      const formData = new FormData();
      Object.keys(profileData).forEach((key) => {
        if (key === "profile_pic" && typeof profileData[key] === "object") {
          if (profileData[key]) {
            formData.append(key, profileData[key]);
          }
        } else if (profileData[key] !== null) {
          formData.append(key, profileData[key]);
        }
      });

      await axios.patch("/api/picker/settings/", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setSuccess("Profile updated successfully");
      setFormChanged(false);
    } catch (err) {
      setError("Failed to update profile");
      console.error(err);
    }
  };

  if (loading) {
    return <div className={styles.loader}>Loading profile data...</div>;
  }

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.header}>
        <h2>Account Settings</h2>
        <p>Manage your profile and account details</p>
      </div>

      {error && <div className={styles.errorMessage}>{error}</div>}
      {success && <div className={styles.successMessage}>{success}</div>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <h3>Profile Information</h3>

          <div className={styles.profileImageSection}>
            <div className={styles.profileImageContainer}>
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className={styles.profileImage}
                />
              ) : (
                <div className={styles.profileImagePlaceholder}>
                  <FaUser />
                </div>
              )}
            </div>
            <div className={styles.profileImageUpload}>
              <label htmlFor="profile_pic" className={styles.uploadButton}>
                Change Photo
              </label>
              <input
                type="file"
                id="profile_pic"
                name="profile_pic"
                accept="image/*"
                onChange={handleChange}
                className={styles.fileInput}
              />
              <p>Upload a clear photo of yourself</p>
            </div>
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.formField}>
              <label htmlFor="first_name">
                <FaUser className={styles.fieldIcon} />
                First Name
              </label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={profileData.first_name || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="last_name">
                <FaUser className={styles.fieldIcon} />
                Last Name
              </label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={profileData.last_name || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className={styles.formField}>
            <label htmlFor="phone_number">
              <FaPhone className={styles.fieldIcon} />
              Phone Number
            </label>
            <input
              type="tel"
              id="phone_number"
              name="phone_number"
              value={profileData.phone_number || ""}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.formField}>
              <label htmlFor="institution">
                <FaUniversity className={styles.fieldIcon} />
                Institution
              </label>
              <input
                type="text"
                id="institution"
                name="institution"
                value={profileData.institution || ""}
                readOnly
                className={styles.readonlyField}
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="state">
                <FaMapMarkerAlt className={styles.fieldIcon} />
                State
              </label>
              <input
                type="text"
                id="state"
                name="state"
                value={profileData.state || ""}
                readOnly
                className={styles.readonlyField}
              />
            </div>
          </div>
        </div>

        {/* Picker-specific fields */}
        {userType === "picker" && (
          <div className={styles.section}>
            <h3>Picker Details</h3>
            <div className={styles.formField}>
              <label htmlFor="fleet_type">
                <FaTruck className={styles.fieldIcon} />
                Fleet Type
              </label>
              <select
                id="fleet_type"
                name="fleet_type"
                value={profileData.fleet_type || ""}
                onChange={handleChange}
              >
                <option value="">Select Fleet Type</option>
                <option value="BICYCLE">Bicycle</option>
                <option value="MOTORCYCLE">Motorcycle</option>
                <option value="CAR">Car</option>
                <option value="FOOT">On Foot</option>
              </select>
            </div>
          </div>
        )}

        {/* Student Picker-specific fields */}
        {userType === "student_picker" && (
          <div className={styles.section}>
            <h3>Student Picker Details</h3>
            <div className={styles.fieldGroup}>
              <div className={styles.formField}>
                <label htmlFor="hostel_name">
                  <FaUniversity className={styles.fieldIcon} />
                  Hostel Name
                </label>
                <input
                  type="text"
                  id="hostel_name"
                  name="hostel_name"
                  value={profileData.hostel_name || ""}
                  onChange={handleChange}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="room_number">
                  <FaMapMarkerAlt className={styles.fieldIcon} />
                  Room Number
                </label>
                <input
                  type="text"
                  id="room_number"
                  name="room_number"
                  value={profileData.room_number || ""}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h3>Availability Settings</h3>
          <div className={styles.toggleField}>
            <div className={styles.toggleLabel}>
              <label htmlFor="is_available">Available for Deliveries</label>
              <p>Toggle this when you're ready to accept orders</p>
            </div>
            <label className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="is_available"
                name="is_available"
                checked={profileData.is_available || false}
                onChange={handleChange}
              />
              <span className={styles.toggleSlider}>
                {profileData.is_available ? (
                  <FaToggleOn className={styles.toggleIcon} />
                ) : (
                  <FaToggleOff className={styles.toggleIcon} />
                )}
              </span>
            </label>
          </div>
        </div>

        <div className={styles.section}>
          <h3>Payment Information</h3>
          <div className={styles.formField}>
            <label htmlFor="bank_name">
              <FaMoneyBillWave className={styles.fieldIcon} />
              Bank Name
            </label>
            <input
              type="text"
              id="bank_name"
              name="bank_name"
              value={profileData.bank_name || ""}
              onChange={handleChange}
            />
          </div>

          <div className={styles.fieldGroup}>
            <div className={styles.formField}>
              <label htmlFor="account_number">
                <FaIdCard className={styles.fieldIcon} />
                Account Number
              </label>
              <input
                type="text"
                id="account_number"
                name="account_number"
                value={profileData.account_number || ""}
                onChange={handleChange}
              />
            </div>

            <div className={styles.formField}>
              <label htmlFor="account_name">
                <FaUser className={styles.fieldIcon} />
                Account Name
              </label>
              <input
                type="text"
                id="account_name"
                name="account_name"
                value={profileData.account_name || ""}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className={styles.verificationStatus}>
          <div className={styles.verificationLabel}>
            <h4>Account Verification Status</h4>
            <p>Your account needs to be verified to receive payments</p>
          </div>
          <div
            className={
              profileData.is_verified
                ? styles.verificationBadgeVerified
                : styles.verificationBadgePending
            }
          >
            {profileData.is_verified ? "Verified" : "Pending"}
          </div>
        </div>

        <div className={styles.formActions}>
          <button
            type="submit"
            className={styles.saveButton}
            disabled={!formChanged}
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
