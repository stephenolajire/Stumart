import React, { useState } from "react";
import { Loader, AlertCircle, CheckCircle } from "lucide-react";
import { useArea } from "../constant/GlobalContext";
import api from "../constant/api";

const AddRider = ({ setShowAddModal, onRiderAdded }) => {
  const { data: areas, isLoading: areasLoading, error: areasError } = useArea();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    location: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null); // 'success' or 'error'
  const [submitMessage, setSubmitMessage] = useState("");

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Full name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    const phoneRegex = /^\+\d{1,4}\s?\d{6,14}$/;
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.trim())) {
      newErrors.phone =
        "Phone must start with + and contain valid digits (e.g., +234 xxx xxx xxxx)";
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = "Coverage area is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear submit status when user makes changes
    if (submitStatus) {
      setSubmitStatus(null);
      setSubmitMessage("");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSubmitMessage("");

    try {
      const response = await api.post("/riders/create/", formData);

      setSubmitStatus("success");
      setSubmitMessage("Rider added successfully!");

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        location: "",
      });

      // Call callback if provided
      if (onRiderAdded) {
        onRiderAdded(response.data.rider);
      }

      // Close modal after a delay to show success message
      setTimeout(() => {
        setShowAddModal(false);
      }, 1500);
    } catch (error) {
      setSubmitStatus("error");

      if (error.response?.data) {
        const errorData = error.response.data;

        // Handle validation errors
        if (errorData.email) {
          setErrors((prev) => ({
            ...prev,
            email: errorData.email[0] || errorData.email,
          }));
        }
        if (errorData.phone) {
          setErrors((prev) => ({
            ...prev,
            phone: errorData.phone[0] || errorData.phone,
          }));
        }
        if (errorData.name) {
          setErrors((prev) => ({
            ...prev,
            name: errorData.name[0] || errorData.name,
          }));
        }

        setSubmitMessage(
          errorData.error ||
            "Failed to add rider. Please check the form and try again."
        );
      } else {
        setSubmitMessage(
          "Network error. Please check your connection and try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading areas
  if (areasLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6 flex flex-col items-center">
          <Loader className="animate-spin text-yellow-500" size={48} />
          <p className="mt-4 text-gray-700">Loading areas...</p>
        </div>
      </div>
    );
  }

  // Error loading areas
  if (areasError) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Error</h2>
          <p className="text-red-500">
            {areasError?.data?.message ||
              "An error occurred while fetching areas."}
          </p>
          <div className="flex justify-end mt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-4 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Rider</h2>

        {/* Submit Status Message */}
        {submitStatus && (
          <div
            className={`mb-4 p-3 rounded-lg flex items-center ${
              submitStatus === "success"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {submitStatus === "success" ? (
              <CheckCircle className="w-5 h-5 mr-2" />
            ) : (
              <AlertCircle className="w-5 h-5 mr-2" />
            )}
            <span className="text-sm">{submitMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter rider's full name"
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter email address"
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none ${
                errors.phone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="+234 xxx xxx xxxx"
              disabled={isSubmitting}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          {/* Coverage Area */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Coverage Area *
            </label>
            <select
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none ${
                errors.location ? "border-red-500" : "border-gray-300"
              }`}
              disabled={isSubmitting}
            >
              <option value="">Select coverage area</option>
              {areas &&
                areas.delivery_areas &&
                areas.delivery_areas.map((area) => (
                  <option key={area.id} value={area.name}>
                    {area.name}
                  </option>
                ))}
            </select>
            {errors.location && (
              <p className="text-red-500 text-sm mt-1">{errors.location}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader className="animate-spin w-5 h-5 mr-2" />
                  Adding...
                </>
              ) : (
                "Add Rider"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRider;
