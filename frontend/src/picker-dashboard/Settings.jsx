import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  CreditCard,
  Phone,
  Building,
  MapPin,
  Truck,
  ToggleLeft,
  ToggleRight,
  DollarSign,
  Camera,
  Settings as SettingsIcon,
  Shield,
  CheckCircle,
  AlertCircle,
  Loader2,
  Save,
  Home,
} from "lucide-react";
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
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-medium">
            Loading profile data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <SettingsIcon className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Account Settings
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your profile and account details
              </p>
            </div>
          </div>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
              <p className="text-green-800">{success}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Profile Information Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
              <div className="flex items-center">
                <User className="w-6 h-6 text-white mr-3" />
                <h2 className="text-xl font-bold text-white">
                  Profile Information
                </h2>
              </div>
            </div>

            <div className="p-6">
              {/* Profile Image */}
              <div className="flex items-center space-x-6 mb-8">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-yellow-600 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      id="profile_pic"
                      name="profile_pic"
                      accept="image/*"
                      onChange={handleChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="profile_pic"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Profile Photo
                  </label>
                  <p className="text-sm text-gray-500">
                    Upload a clear photo of yourself. Click the camera icon to
                    change.
                  </p>
                </div>
              </div>

              {/* Name Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label
                    htmlFor="first_name"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <User className="w-4 h-4 mr-2" />
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={profileData.first_name || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="last_name"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={profileData.last_name || ""}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="mb-6">
                <label
                  htmlFor="phone_number"
                  className="flex items-center text-sm font-medium text-gray-700 mb-2"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={profileData.phone_number || ""}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>

              {/* Location Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="institution"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <Building className="w-4 h-4 mr-2" />
                    Institution
                  </label>
                  <input
                    type="text"
                    id="institution"
                    name="institution"
                    value={profileData.institution || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label
                    htmlFor="state"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    State
                  </label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={profileData.state || ""}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Picker-specific fields */}
          {userType === "picker" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-center">
                  <Truck className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white">
                    Picker Details
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <div>
                  <label
                    htmlFor="fleet_type"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <Truck className="w-4 h-4 mr-2" />
                    Fleet Type
                  </label>
                  <select
                    id="fleet_type"
                    name="fleet_type"
                    value={profileData.fleet_type || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  >
                    <option value="">Select Fleet Type</option>
                    <option value="BICYCLE">Bicycle</option>
                    <option value="MOTORCYCLE">Motorcycle</option>
                    <option value="CAR">Car</option>
                    <option value="FOOT">On Foot</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Student Picker-specific fields */}
          {userType === "student_picker" && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <div className="flex items-center">
                  <Home className="w-6 h-6 text-white mr-3" />
                  <h2 className="text-xl font-bold text-white">
                    Student Picker Details
                  </h2>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="hostel_name"
                      className="flex items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <Building className="w-4 h-4 mr-2" />
                      Hostel Name
                    </label>
                    <input
                      type="text"
                      id="hostel_name"
                      name="hostel_name"
                      value={profileData.hostel_name || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="room_number"
                      className="flex items-center text-sm font-medium text-gray-700 mb-2"
                    >
                      <Home className="w-4 h-4 mr-2" />
                      Room Number
                    </label>
                    <input
                      type="text"
                      id="room_number"
                      name="room_number"
                      value={profileData.room_number || ""}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Availability Settings */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <div className="flex items-center">
                <Shield className="w-6 h-6 text-white mr-3" />
                <h2 className="text-xl font-bold text-white">
                  Availability Settings
                </h2>
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <label
                    htmlFor="is_available"
                    className="text-lg font-medium text-gray-900"
                  >
                    Available for Deliveries
                  </label>
                  <p className="text-sm text-gray-600 mt-1">
                    Toggle this when you're ready to accept orders
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handleChange({
                      target: {
                        name: "is_available",
                        type: "checkbox",
                        checked: !profileData.is_available,
                      },
                    })
                  }
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 ${
                    profileData.is_available ? "bg-yellow-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                      profileData.is_available
                        ? "translate-x-7"
                        : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
              <div className="flex items-center">
                <DollarSign className="w-6 h-6 text-white mr-3" />
                <h2 className="text-xl font-bold text-white">
                  Payment Information
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label
                  htmlFor="bank_name"
                  className="flex items-center text-sm font-medium text-gray-700 mb-2"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bank_name"
                  name="bank_name"
                  value={profileData.bank_name || ""}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="account_number"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="account_number"
                    name="account_number"
                    value={profileData.account_number || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="account_name"
                    className="flex items-center text-sm font-medium text-gray-700 mb-2"
                  >
                    <User className="w-4 h-4 mr-2" />
                    Account Name
                  </label>
                  <input
                    type="text"
                    id="account_name"
                    name="account_name"
                    value={profileData.account_name || ""}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Account Verification Status
                </h3>
                <p className="text-sm text-gray-600">
                  Your account needs to be verified to receive payments
                </p>
              </div>
              <div
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  profileData.is_verified
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : "bg-yellow-100 text-yellow-800 border border-yellow-200"
                }`}
              >
                {profileData.is_verified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Pending
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!formChanged}
              className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
