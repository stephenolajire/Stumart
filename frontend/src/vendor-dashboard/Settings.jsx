import React, { useState, useEffect } from "react";
import {
  FaSave,
  FaKey,
  FaUserCog,
  FaStore,
  FaFileInvoiceDollar,
  FaSpinner,
} from "react-icons/fa";
import {
  useSettings,
  usePatchAccount,
  usePatchStore,
  usePatchPaymentInfo,
  useChangePassword,
} from "../hooks/useVendor";

const Settings = () => {
  const [activeSettingsTab, setActiveSettingsTab] = useState("account");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    storeName: "",
    storeDescription: "",
    logo: null,
    banner: null,
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { data: settingsData, isLoading: initialLoading } = useSettings();

  const { mutate: patchAccount, isPending: isSavingAccount } =
    usePatchAccount();
  const { mutate: patchStore, isPending: isSavingStore } = usePatchStore();
  const { mutate: patchPayment, isPending: isSavingPayment } =
    usePatchPaymentInfo();
  const { mutate: changePassword, isPending: isChangingPassword } =
    useChangePassword();

  useEffect(() => {
    if (!settingsData) return;
    const { user, vendor } = settingsData;
    setFormData((prev) => ({
      ...prev,
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      storeName: vendor?.storeName || "",
      storeDescription: vendor?.storeDescription || "",
      bankName: vendor?.bankName || "",
      accountNumber: vendor?.accountNumber || "",
      accountHolder: vendor?.accountHolder || "",
    }));
  }, [settingsData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files?.[0]) setFormData((prev) => ({ ...prev, [name]: files[0] }));
  };

  const getErrorMessage = (error) => {
    if (error?.response?.data) {
      return Object.values(error.response.data).flat().join(", ");
    }
    return "An unexpected error occurred";
  };

  const handleAccountSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("first_name", formData.firstName);
    data.append("last_name", formData.lastName);
    data.append("phone_number", formData.phone);
    if (formData.logo instanceof File)
      data.append("profile_pic", formData.logo);

    patchAccount(data, {
      onSuccess: () => alert("Account settings updated successfully!"),
      onError: (error) =>
        alert(`Error updating account: ${getErrorMessage(error)}`),
    });
  };

  const handleStoreSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("business_name", formData.storeName);
    data.append("business_description", formData.storeDescription);
    if (formData.banner instanceof File)
      data.append("shop_image", formData.banner);

    patchStore(data, {
      onSuccess: () => alert("Store settings updated successfully!"),
      onError: (error) =>
        alert(`Error updating store: ${getErrorMessage(error)}`),
    });
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    patchPayment(
      { bank_name: formData.bankName, account_name: formData.accountHolder },
      {
        onSuccess: () => alert("Payment settings updated successfully!"),
        onError: (error) =>
          alert(`Error updating payment: ${getErrorMessage(error)}`),
      },
    );
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    changePassword(
      {
        current_password: formData.currentPassword,
        new_password: formData.newPassword,
        confirm_password: formData.confirmPassword,
      },
      {
        onSuccess: () => {
          alert("Password changed successfully! Please log in again.");
          setFormData((prev) => ({
            ...prev,
            currentPassword: "",
            newPassword: "",
            confirmPassword: "",
          }));
        },
        onError: (error) =>
          alert(`Error changing password: ${getErrorMessage(error)}`),
      },
    );
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

  const SaveButton = ({ isPending }) => (
    <button
      type="submit"
      disabled={isPending}
      className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
    >
      {isPending ? (
        <FaSpinner className="animate-spin mr-2" />
      ) : (
        <FaSave className="mr-2" />
      )}
      {isPending ? "Saving..." : "Save Changes"}
    </button>
  );

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent";
  const disabledInputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500";

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
                  className={inputClass}
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
                  className={inputClass}
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
                className={disabledInputClass}
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
                className={inputClass}
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

            <SaveButton isPending={isSavingAccount} />
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
                className={inputClass}
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
                className={`${inputClass} resize-none`}
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

            <SaveButton isPending={isSavingStore} />
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
                className={inputClass}
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
                className={disabledInputClass}
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
                className={inputClass}
                required
              />
            </div>

            <SaveButton isPending={isSavingPayment} />
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
                className={inputClass}
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
                className={inputClass}
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
                className={inputClass}
                required
              />
            </div>

            <SaveButton isPending={isChangingPassword} />
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
      <div className="w-full mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">
            Manage your account and store preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                          className={`text-lg ${activeSettingsTab === tab.id ? "text-yellow-500" : "text-gray-400"}`}
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
