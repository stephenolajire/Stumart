import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaKey,
  FaUserCog,
  FaStore,
  FaFileInvoiceDollar,
  FaTruck,
  FaBell,
  FaSpinner,
} from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";
import api from "../constant/api";

const Settings = () => {
  const [activeSettingsTab, setActiveSettingsTab] = useState("account");
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [formData, setFormData] = useState({
    // Account settings
    firstName: "",
    lastName: "",
    email: "",
    phone: "",

    // Store settings
    storeName: "",
    storeDescription: "",
    logo: null,
    banner: null,

    // Payment settings
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    taxId: "",

    // Password
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Load settings data on component mount
  useEffect(() => {
    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    try {
      setInitialLoading(true);
      const response = await api.get("vendor/settings/");
      const data = response.data;

      setFormData((prev) => ({
        ...prev,
        // User data
        firstName: data.user.firstName || "",
        lastName: data.user.lastName || "",
        email: data.user.email || "",
        phone: data.user.phone || "",

        // Vendor data (if user is vendor)
        storeName: data.vendor.storeName || "",
        storeDescription: data.vendor.storeDescription || "",
        bankName: data.vendor.bankName || "",
        accountNumber: data.vendor.accountNumber || "",
        accountHolder: data.vendor.accountHolder || "",
      }));
    } catch (error) {
      console.error("Error loading settings:", error);
      alert("Failed to load settings data");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({
        ...formData,
        [name]: files[0],
      });
    }
  };

  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("first_name", formData.firstName);
      formDataToSend.append("last_name", formData.lastName);
      formDataToSend.append("phone_number", formData.phone);

      if (formData.logo instanceof File) {
        formDataToSend.append("profile_pic", formData.logo);
      }

      const response = await api.put("/settings/account/", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Account settings updated successfully!");
      console.log("Account updated:", response.data);
    } catch (error) {
      console.error("Error updating account:", error);
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data)
          .flat()
          .join(", ");
        alert(`Error updating account: ${errorMessages}`);
      } else {
        alert("Failed to update account settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("business_name", formData.storeName);
      formDataToSend.append("business_description", formData.storeDescription);

      if (formData.banner instanceof File) {
        formDataToSend.append("shop_image", formData.banner);
      }

      const response = await api.put("/settings/store/", formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Store settings updated successfully!");
      console.log("Store updated:", response.data);
    } catch (error) {
      console.error("Error updating store:", error);
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data)
          .flat()
          .join(", ");
        alert(`Error updating store: ${errorMessages}`);
      } else {
        alert("Failed to update store settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const paymentData = {
        bank_name: formData.bankName,
        account_name: formData.accountHolder,
      };

      const response = await api.patch("/settings/payment/", paymentData);

      alert("Payment settings updated successfully!");
      console.log("Payment updated:", response.data);
    } catch (error) {
      console.error("Error updating payment:", error);
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data)
          .flat()
          .join(", ");
        alert(`Error updating payment: ${errorMessages}`);
      } else {
        alert("Failed to update payment settings");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const passwordData = {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      };

      const response = await api.post("/settings/password/", passwordData);

      alert("Password changed successfully! Please log in again.");
      console.log("Password changed:", response.data);

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      // Optionally redirect to login page
      // window.location.href = '/login';
    } catch (error) {
      console.error("Error changing password:", error);
      if (error.response?.data) {
        const errorMessages = Object.values(error.response.data)
          .flat()
          .join(", ");
        alert(`Error changing password: ${errorMessages}`);
      } else {
        alert("Failed to change password");
      }
    } finally {
      setLoading(false);
    }
  };

  const settingsTabs = [
    { id: "account", label: "Account Information", icon: <FaUserCog /> },
    { id: "store", label: "Store Settings", icon: <FaStore /> },
    {
      id: "payment",
      label: "Payment Information",
      icon: <FaFileInvoiceDollar />,
    },
    { id: "password", label: "Change Password", icon: <FaKey /> },
  ];

  const renderSettingsContent = () => {
    if (initialLoading) {
      return (
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Loading settings...</p>
        </div>
      );
    }

    switch (activeSettingsTab) {
      case "account":
        return (
          <form onSubmit={handleAccountSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastName">Last Name</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={styles.formInput}
                disabled
              />
              <small className={styles.formHelper}>
                Email cannot be changed
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone Number</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="logo">Profile Picture</label>
              <div className={styles.fileUpload}>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  accept="image/*"
                />
                <label htmlFor="logo" className={styles.fileLabel}>
                  {formData.logo ? formData.logo.name : "Choose a file"}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? <FaSpinner className={styles.spinner} /> : <FaSave />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      case "store":
        return (
          <form onSubmit={handleStoreSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="storeName">Store Name</label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="storeDescription">Store Description</label>
              <textarea
                id="storeDescription"
                name="storeDescription"
                value={formData.storeDescription}
                onChange={handleInputChange}
                className={styles.formTextarea}
                rows="4"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="banner">Store Image</label>
              <div className={styles.fileUpload}>
                <input
                  type="file"
                  id="banner"
                  name="banner"
                  onChange={handleFileChange}
                  className={styles.fileInput}
                  accept="image/*"
                />
                <label htmlFor="banner" className={styles.fileLabel}>
                  {formData.banner ? formData.banner.name : "Choose a file"}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? <FaSpinner className={styles.spinner} /> : <FaSave />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      case "payment":
        return (
          <form onSubmit={handlePaymentSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="bankName">Bank Name</label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="accountNumber">Account Number</label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className={styles.formInput}
                disabled
              />
              <small className={styles.formHelper}>
                Contact support to update your account number
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="accountHolder">Account Holder Name</label>
              <input
                type="text"
                id="accountHolder"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? <FaSpinner className={styles.spinner} /> : <FaSave />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      case "password":
        return (
          <form onSubmit={handlePasswordSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
              <small className={styles.formHelper}>
                Password must be at least 8 characters
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className={styles.formInput}
                required
              />
            </div>

            <button
              type="submit"
              className={styles.saveButton}
              disabled={loading}
            >
              {loading ? <FaSpinner className={styles.spinner} /> : <FaSave />}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      default:
        return <div>Select a settings category</div>;
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsLayout}>
        <div className={styles.settingsSidebar}>
          <ul className={styles.settingsTabs}>
            {settingsTabs.map((tab) => (
              <li
                key={tab.id}
                className={`${styles.settingsTab} ${
                  activeSettingsTab === tab.id ? styles.activeTab : ""
                }`}
                onClick={() => setActiveSettingsTab(tab.id)}
              >
                <span className={styles.tabIcon}>{tab.icon}</span>
                <span className={styles.tabLabel}>{tab.label}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.settingsContent}>{renderSettingsContent()}</div>
      </div>
    </div>
  );
};

export default Settings;
