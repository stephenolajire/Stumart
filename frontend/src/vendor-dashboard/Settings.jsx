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
        <div className="flex flex-col items-center justify-center h-64">
          <FaSpinner className="animate-spin text-yellow-500 text-3xl mb-4" />
          <p className="text-gray-600">Loading settings...</p>
        </div>
      );
    }

    switch (activeSettingsTab) {
      case "account":
        return (
          <form onSubmit={handleAccountSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="firstName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="lastName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                disabled
              />
              <small className="text-gray-500 text-sm mt-1 block">
                Email cannot be changed
              </small>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="logo"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Profile Picture
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <label
                  htmlFor="logo"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {formData.logo ? formData.logo.name : "Choose a file"}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSave className="mr-2" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      case "store":
        return (
          <form onSubmit={handleStoreSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="storeName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                name="storeName"
                value={formData.storeName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="storeDescription"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Store Description
              </label>
              <textarea
                id="storeDescription"
                name="storeDescription"
                value={formData.storeDescription}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent resize-none"
                rows="4"
              />
            </div>

            <div>
              <label
                htmlFor="banner"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Store Image
              </label>
              <div className="relative">
                <input
                  type="file"
                  id="banner"
                  name="banner"
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
                <label
                  htmlFor="banner"
                  className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  {formData.banner ? formData.banner.name : "Choose a file"}
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSave className="mr-2" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      case "payment":
        return (
          <form onSubmit={handlePaymentSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="bankName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="accountNumber"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                disabled
              />
              <small className="text-gray-500 text-sm mt-1 block">
                Contact support to update your account number
              </small>
            </div>

            <div>
              <label
                htmlFor="accountHolder"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Account Holder Name
              </label>
              <input
                type="text"
                id="accountHolder"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSave className="mr-2" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      case "password":
        return (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="currentPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
              <small className="text-gray-500 text-sm mt-1 block">
                Password must be at least 8 characters
              </small>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <FaSpinner className="animate-spin mr-2" />
              ) : (
                <FaSave className="mr-2" />
              )}
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </form>
        );

      default:
        return (
          <div className="text-center text-gray-500 py-8">
            Select a settings category
          </div>
        );
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and store preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {settingsTabs.map((tab) => (
                  <li key={tab.id}>
                    <button
                      className={`w-full text-left px-6 py-4 hover:bg-gray-50 transition-colors ${
                        activeSettingsTab === tab.id
                          ? "bg-yellow-50 border-r-4 border-yellow-500 text-yellow-700"
                          : "text-gray-700"
                      }`}
                      onClick={() => setActiveSettingsTab(tab.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <span
                          className={`text-lg ${
                            activeSettingsTab === tab.id
                              ? "text-yellow-500"
                              : "text-gray-400"
                          }`}
                        >
                          {tab.icon}
                        </span>
                        <span className="font-medium">{tab.label}</span>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {
                    settingsTabs.find((tab) => tab.id === activeSettingsTab)
                      ?.label
                  }
                </h2>
                <div className="mt-2 h-1 w-20 bg-yellow-500 rounded"></div>
              </div>

              {renderSettingsContent()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
