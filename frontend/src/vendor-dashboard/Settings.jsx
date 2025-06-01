import React, { useState } from "react";
import {
  FaSave,
  FaKey,
  FaUserCog,
  FaStore,
  FaFileInvoiceDollar,
  FaTruck,
  FaBell,
} from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Settings = () => {
  const [activeSettingsTab, setActiveSettingsTab] = useState("account");
  const [formData, setFormData] = useState({
    // Account settings
    firstName: "John",
    lastName: "Smith",
    email: "johnsmith@example.com",
    phone: "+1 (555) 123-4567",

    // Store settings
    storeName: "John's Electronics",
    storeDescription:
      "Premium electronics and accessories at affordable prices",
    logo: null,
    banner: null,

    // Payment settings
    bankName: "National Bank",
    accountNumber: "****4567",
    accountHolder: "John Smith",
    taxId: "123-45-6789",

    // Shipping settings
    freeShippingThreshold: "100",
    processingTime: "1-2",
    internationalShipping: true,

    // Notification settings
    emailNotifications: true,
    orderNotifications: true,
    reviewNotifications: true,
    promotionalEmails: false,

    // Password
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

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

  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Settings updated successfully!");
  };

  const settingsTabs = [
    { id: "account", label: "Account Information", icon: <FaUserCog /> },
    { id: "store", label: "Store Settings", icon: <FaStore /> },
    {
      id: "payment",
      label: "Payment Information",
      icon: <FaFileInvoiceDollar />,
    },
    { id: "shipping", label: "Shipping Settings", icon: <FaTruck /> },
    { id: "notifications", label: "Notifications", icon: <FaBell /> },
    { id: "password", label: "Change Password", icon: <FaKey /> },
  ];

  const renderSettingsContent = () => {
    switch (activeSettingsTab) {
      case "account":
        return (
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="firstName">First Name</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                className={styles.formInput}
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
              />
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
              />
            </div>

            <button type="submit" className={styles.saveButton}>
              <FaSave /> Save Changes
            </button>
          </form>
        );

      case "store":
        return (
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="storeName">Store Name</label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                className={styles.formInput}
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
              <label htmlFor="logo">Store Logo</label>
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

            <div className={styles.formGroup}>
              <label htmlFor="banner">Store Banner</label>
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

            <button type="submit" className={styles.saveButton}>
              <FaSave /> Save Changes
            </button>
          </form>
        );

      case "payment":
        return (
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="bankName">Bank Name</label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className={styles.formInput}
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
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="taxId">Tax ID / SSN</label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleInputChange}
                className={styles.formInput}
              />
            </div>

            <button type="submit" className={styles.saveButton}>
              <FaSave /> Save Changes
            </button>
          </form>
        );

      case "shipping":
        return (
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label htmlFor="freeShippingThreshold">
                Free Shipping Threshold ($)
              </label>
              <input
                type="number"
                id="freeShippingThreshold"
                name="freeShippingThreshold"
                value={formData.freeShippingThreshold}
                onChange={handleInputChange}
                className={styles.formInput}
                min="0"
                step="0.01"
              />
              <small className={styles.formHelper}>
                Set to 0 for no free shipping
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="processingTime">
                Processing Time (Business Days)
              </label>
              <input
                type="text"
                id="processingTime"
                name="processingTime"
                value={formData.processingTime}
                onChange={handleInputChange}
                className={styles.formInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="internationalShipping"
                  checked={formData.internationalShipping}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                Enable International Shipping
              </label>
            </div>

            <button type="submit" className={styles.saveButton}>
              <FaSave /> Save Changes
            </button>
          </form>
        );

      case "notifications":
        return (
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="emailNotifications"
                  checked={formData.emailNotifications}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                Email Notifications
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="orderNotifications"
                  checked={formData.orderNotifications}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                New Order Notifications
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="reviewNotifications"
                  checked={formData.reviewNotifications}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                New Review Notifications
              </label>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  name="promotionalEmails"
                  checked={formData.promotionalEmails}
                  onChange={handleInputChange}
                  className={styles.checkbox}
                />
                Promotional Emails
              </label>
            </div>

            <button type="submit" className={styles.saveButton}>
              <FaSave /> Save Changes
            </button>
          </form>
        );

      case "password":
        return (
          <form onSubmit={handleSubmit} className={styles.settingsForm}>
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

            <button type="submit" className={styles.saveButton}>
              <FaSave /> Save Changes
            </button>
          </form>
        );

      default:
        return <div>Select a settings category</div>;
    }
  };

  return (
    <div className={styles.settingsContainer}>
      {/* <h2 className={styles.sectionTitle}>Settings</h2> */}

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
