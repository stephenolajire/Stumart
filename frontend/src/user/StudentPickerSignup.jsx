import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaUniversity,
  FaMapMarkerAlt,
  FaImage,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaHouseUser,
  FaArrowLeft,
  FaMoneyBill,
  FaCreditCard,
  FaHome,
  FaStore,
  FaCheckCircle,
  FaSearch,
} from "react-icons/fa";
import Swal from "sweetalert2";
import { nigeriaStates, nigeriaInstitutions } from "../constant/data";
import logo from "../assets/stumart.jpeg";
import { banks } from "../constant/bank";
import { useRegisterStudentPicker } from "../hooks/useUser";
import { useGetAllVendorNames } from "../hooks/useHome";

// ── Vendor Selector ───────────────────────────────────────
const VendorSelector = ({ institution, selectedVendors, onToggle }) => {
  const [search, setSearch] = useState("");
  const [expandedCat, setExpandedCat] = useState(null);

  const { data, isLoading } = useGetAllVendorNames(
    institution ? { school: institution } : {},
  );

  // data.vendors is already grouped: { food: [{id, business_name}], ... }
  const grouped = data?.vendors || {};
  const categories = Object.keys(grouped);

  // Filter vendors by search across all categories
  const filteredGrouped = search
    ? Object.fromEntries(
        categories
          .map((cat) => [
            cat,
            grouped[cat].filter((v) =>
              v.business_name.toLowerCase().includes(search.toLowerCase()),
            ),
          ])
          .filter(([, vendors]) => vendors.length > 0),
      )
    : grouped;

  const filteredCategories = Object.keys(filteredGrouped);

  if (!institution) {
    return (
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center text-sm text-purple-600">
        Select your state and institution first to see nearby vendors.
      </div>
    );
  }

  const handleSelectAll = () => {
    filteredCategories.forEach((cat) =>
      filteredGrouped[cat].forEach((v) => {
        if (!selectedVendors.includes(v.id)) onToggle(v.id);
      }),
    );
  };

  const handleClearAll = () => {
    filteredCategories.forEach((cat) =>
      filteredGrouped[cat].forEach((v) => {
        if (selectedVendors.includes(v.id)) onToggle(v.id);
      }),
    );
  };

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Search bar */}
      <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <FaSearch className="text-gray-400 text-sm flex-shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search vendors..."
          className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
        />
        {selectedVendors.length > 0 && (
          <span className="text-xs bg-purple-500 text-white rounded-full px-2 py-0.5 flex-shrink-0">
            {selectedVendors.length} selected
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 text-center text-gray-400 text-sm">
          Loading nearby vendors...
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="p-6 text-center text-gray-400 text-sm">
          {search
            ? "No vendors match your search."
            : "No vendors found for this institution."}
        </div>
      ) : (
        <div className="max-h-72 overflow-y-auto">
          {filteredCategories.map((cat) => {
            const vendorsInCat = filteredGrouped[cat];
            const isExpanded = expandedCat === cat || !!search;
            const selectedInCat = vendorsInCat.filter((v) =>
              selectedVendors.includes(v.id),
            ).length;

            return (
              <div key={cat}>
                {/* Category header */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedCat(expandedCat === cat ? null : cat)
                  }
                  className="w-full flex items-center justify-between px-4 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors border-b border-gray-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      {cat}
                    </span>
                    {selectedInCat > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-600 rounded-full px-1.5 py-0.5 font-medium">
                        {selectedInCat} ✓
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {vendorsInCat.length} vendors
                    </span>
                    <span className="text-gray-400 text-xs">
                      {isExpanded ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {/* Vendors list */}
                {isExpanded &&
                  vendorsInCat.map((vendor) => {
                    const isSelected = selectedVendors.includes(vendor.id);
                    return (
                      <button
                        type="button"
                        key={vendor.id}
                        onClick={() => onToggle(vendor.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition-colors border-b border-gray-50 text-left"
                      >
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <FaStore className="text-purple-400 text-xs" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {vendor.business_name}
                          </p>
                          <p className="text-xs text-gray-400 capitalize">
                            {vendor.business_category}
                          </p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            isSelected
                              ? "bg-purple-500 border-purple-500"
                              : "border-gray-300"
                          }`}
                        >
                          {isSelected && (
                            <svg
                              className="w-3 h-3 text-white"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}

      {/* Select all / clear */}
      {filteredCategories.length > 0 && (
        <div className="p-2 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleSelectAll}
            className="text-xs text-purple-600 font-medium hover:underline"
          >
            Select all
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="text-xs text-gray-400 font-medium hover:underline"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────
const StudentPickerSignup = () => {
  const navigate = useNavigate();
  const { mutate: registerStudentPicker, isPending } =
    useRegisterStudentPicker();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    state: "",
    institution: "",
    profilePic: null,
    hostelName: "",
    roomNumber: "",
    accountNumber: "",
    accountName: "",
    bankName: "",
    residence: "",
  });

  const [selectedVendors, setSelectedVendors] = useState([]);
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

  const toggleVendor = (vendorId) => {
    setSelectedVendors((prev) =>
      prev.includes(vendorId)
        ? prev.filter((id) => id !== vendorId)
        : [...prev, vendorId],
    );
  };

  const validate = () => {
    const e = {};
    if (!formData.firstName?.trim()) e.firstName = "First name is required";
    if (!formData.lastName?.trim()) e.lastName = "Last name is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) e.email = "Email is required";
    else if (!emailRegex.test(formData.email)) e.email = "Invalid email";
    const phoneRegex = /^0[7-9]\d{9}$/;
    if (!formData.phoneNumber?.trim()) e.phoneNumber = "Phone required";
    else if (!phoneRegex.test(formData.phoneNumber))
      e.phoneNumber = "Invalid phone";
    if (!formData.state) e.state = "State is required";
    if (!formData.institution) e.institution = "Institution is required";
    if (!formData.residence) e.residence = "Residence is required";
    if (!formData.profilePic) e.profilePic = "Profile picture is required";
    if (!formData.hostelName?.trim()) e.hostelName = "Hostel name is required";
    if (!formData.roomNumber?.trim()) e.roomNumber = "Room number is required";
    if (!formData.password) e.password = "Password is required";
    else if (formData.password.length < 8) e.password = "Minimum 8 characters";
    else if (
      !/[A-Z]/.test(formData.password) ||
      !/[a-z]/.test(formData.password) ||
      !/[!@#$%^&*(),.?":{}|<>]/.test(formData.password)
    )
      e.password = "Must include uppercase, lowercase, special char";
    if (!formData.confirmPassword) e.confirmPassword = "Confirm password";
    else if (formData.password !== formData.confirmPassword)
      e.confirmPassword = "Passwords do not match";
    if (!formData.bankName) e.bankName = "Select a bank";
    if (!formData.accountName?.trim()) e.accountName = "Account name required";
    if (!/^[0-9]{10}$/.test(formData.accountNumber))
      e.accountNumber = "Must be 10 digits";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prev) => ({ ...prev, [name]: files ? files[0] : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleHttpError = (error) => {
    const httpStatus = error.response?.status;
    const data = error.response?.data;
    if (data?.details) {
      const msgs = Object.entries(data.details)
        .map(([, errs]) => `• ${Array.isArray(errs) ? errs[0] : errs}`)
        .join("<br>");
      Swal.fire({
        icon: "error",
        title: "Validation Failed",
        html: msgs,
        confirmButtonColor: "#8b5cf6",
      });
      return;
    }
    if (httpStatus === 429) {
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
      confirmButtonColor: "#8b5cf6",
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
    fd.append("residence", formData.residence);
    fd.append("user_type", "student_picker");
    fd.append("hostel_name", formData.hostelName);
    fd.append("room_number", formData.roomNumber);
    fd.append("bank_name", formData.bankName);
    fd.append("account_name", formData.accountName);
    fd.append("account_number", formData.accountNumber);
    // Send each vendor id individually so Django can parse as list
    selectedVendors.forEach((id) => fd.append("preferred_vendors", id));
    if (formData.profilePic) fd.append("profile_pic", formData.profilePic);

    registerStudentPicker(fd, {
      onSuccess: (data) => {
        const userId = data?.user?.id || data?.user_id;
        localStorage.setItem("user_id", userId);
        localStorage.setItem("user_type", "student_picker");
        Swal.fire({
          icon: "success",
          title: "Registration Successful!",
          text: "Check your email for verification code.",
          confirmButtonColor: "#8b5cf6",
        });
        navigate("/verify-email", { state: { userId } });
      },
      onError: handleHttpError,
    });
  };

  const inputClass =
    "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200";
  const labelClass = "flex items-center text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-violet-50 to-fuchsia-50 py-8 px-4">
      <div className="w-full max-w-[600px] mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
        >
          {/* Header */}
          <div className="text-center pt-8 pb-6 px-6 bg-gradient-to-b from-white to-gray-50 relative">
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
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 rounded-full px-4 py-1.5 mb-3">
              <span className="text-lg">🎒</span>
              <span className="text-sm font-semibold text-purple-700">
                Student Picker Registration
              </span>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              Create Student Picker Account
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Earn by delivering within your hostel
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
                  <FaUser className="mr-2 text-purple-500" />
                  First Name
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
                  <FaUser className="mr-2 text-purple-500" />
                  Last Name
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
                <FaEnvelope className="mr-2 text-purple-500" />
                Email
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
                <FaPhone className="mr-2 text-purple-500" />
                Phone Number
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

            {/* State & Institution */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <FaMapMarkerAlt className="mr-2 text-purple-500" />
                  State
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
              <div>
                <label className={labelClass}>
                  <FaUniversity className="mr-2 text-purple-500" />
                  Institution
                </label>
                <select
                  name="institution"
                  value={formData.institution}
                  onChange={handleChange}
                  className={inputClass}
                  disabled={!formData.state}
                >
                  <option value="">
                    {formData.state ? "Select" : "State first"}
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
            </div>

            {/* Residence */}
            <div>
              <label className={labelClass}>
                <FaHouseUser className="mr-2 text-purple-500" />
                Residence
              </label>
              <select
                name="residence"
                value={formData.residence}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Residence</option>
                <option value="on_campus">On Campus</option>
                <option value="off_campus">Off Campus</option>
              </select>
              {errors.residence && (
                <p className="text-red-500 text-xs mt-1">{errors.residence}</p>
              )}
            </div>

            {/* Hostel Details */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaHome className="text-purple-500" /> Hostel Details
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    <FaHome className="mr-2 text-purple-500" />
                    Hostel Name
                  </label>
                  <input
                    type="text"
                    name="hostelName"
                    value={formData.hostelName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Hostel name"
                  />
                  {errors.hostelName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.hostelName}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Room Number</label>
                  <input
                    type="text"
                    name="roomNumber"
                    value={formData.roomNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g. A101"
                  />
                  {errors.roomNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.roomNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Picture */}
            <div>
              <label className={labelClass}>
                <FaImage className="mr-2 text-purple-500" />
                Profile Picture
              </label>
              <input
                type="file"
                name="profilePic"
                onChange={handleChange}
                accept="image/*"
                className={`${inputClass} file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700`}
              />
              {errors.profilePic && (
                <p className="text-red-500 text-xs mt-1">{errors.profilePic}</p>
              )}
            </div>

            {/* Vendor Selection */}
            <div className="border-t border-gray-100 pt-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                  <FaStore className="text-purple-500" /> Select Nearby Vendors
                </h3>
                <span className="text-xs text-gray-400">(Optional)</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Choose vendors near your hostel you'd like to pick orders from.
                Select as many as you want.
              </p>
              <VendorSelector
                institution={formData.institution}
                selectedVendors={selectedVendors}
                onToggle={toggleVendor}
              />
              {selectedVendors.length > 0 && (
                <p className="text-xs text-purple-600 mt-2 flex items-center gap-1">
                  <FaCheckCircle /> {selectedVendors.length} vendor
                  {selectedVendors.length > 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Bank Details */}
            <div className="border-t border-gray-100 pt-5">
              <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaMoneyBill className="text-purple-500" /> Bank Account Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className={labelClass}>
                    <FaMoneyBill className="mr-2 text-purple-500" />
                    Bank Name
                  </label>
                  <select
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    className={inputClass}
                  >
                    <option value="">Select Bank</option>
                    {banks.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                  {errors.bankName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bankName}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    <FaUser className="mr-2 text-purple-500" />
                    Account Name
                  </label>
                  <input
                    type="text"
                    name="accountName"
                    value={formData.accountName}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="Account name"
                  />
                  {errors.accountName && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.accountName}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>
                    <FaCreditCard className="mr-2 text-purple-500" />
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="10-digit account number"
                    maxLength="10"
                  />
                  {errors.accountNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.accountNumber}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  <FaLock className="mr-2 text-purple-500" />
                  Password
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
                  <FaLock className="mr-2 text-purple-500" />
                  Confirm
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
                  isPending || throttleWaitTime > 0 ? "#d1d5db" : "#8b5cf6",
                cursor: isPending ? "not-allowed" : "pointer",
              }}
            >
              {isPending
                ? "Creating Account..."
                : throttleWaitTime > 0
                  ? `Wait ${throttleWaitTime}s`
                  : "Create Student Picker Account"}
            </button>

            <p className="text-center text-sm text-gray-500">
              Already have an account?{" "}
              <a href="/login" className="text-purple-600 font-medium">
                Log in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StudentPickerSignup;
