import React, { useState } from "react";
import api from "../constant/api";
import { nigeriaInstitutions } from "../constant/data";
import Swal from "sweetalert2";
import { FaPlus, FaTrash } from "react-icons/fa";
import { nigeriaStates } from "../constant/data";
import { useNavigate } from "react-router-dom";

const CompanyRegistration = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    phone_number: "",
    state: "",
    institution: "",
  });

  const [deliveryAreas, setDeliveryAreas] = useState([""]);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset institution when state changes
      ...(name === "state" && { institution: "" }),
    }));
  };

  const addDeliveryArea = () => {
    setDeliveryAreas((prev) => [...prev, ""]);
  };

  const removeDeliveryArea = (index) => {
    if (deliveryAreas.length > 1) {
      setDeliveryAreas((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleDeliveryAreaChange = (index, value) => {
    setDeliveryAreas((prev) => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const validateForm = () => {
    const requiredFields = [
      "email",
      "password",
      "first_name",
      "last_name",
      "phone_number",
      "state",
      "institution",
    ];

    for (let field of requiredFields) {
      if (!formData[field].trim()) {
        Swal.fire({
          icon: "error",
          title: "Validation Error",
          text: `${field.replace("_", " ")} is required`,
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
        });
        return false;
      }
    }

    // Filter out empty delivery areas and check if at least one exists
    const validDeliveryAreas = deliveryAreas.filter(
      (area) => area.trim() !== ""
    );
    if (validDeliveryAreas.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "At least one delivery area is required",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return false;
    }

    // Check for valid email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please enter a valid email address",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return false;
    }

    // Check password length
    if (formData.password.length < 6) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Password must be at least 6 characters long",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Filter out empty delivery areas
      const validDeliveryAreas = deliveryAreas.filter(
        (area) => area.trim() !== ""
      );

      const submitData = {
        ...formData,
        delivery_areas: validDeliveryAreas,
      };

      const response = await api.post("company/signup/", submitData);
      console.log(response.data)
      const userId = response.data?.user?.id || response.data?.user_id;

      // Store user data in localStorage
      localStorage.setItem("user_id", userId);
      localStorage.setItem("user_type", "company");

      // Navigate to verify email
      navigate("/verify-email", {
        state: { userId },
      });

      Swal.fire({
        icon: "success",
        title: "Registration Successful!",
        text: "Your company account has been created successfully",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
      });

      // Reset form
      setFormData({
        email: "",
        password: "",
        first_name: "",
        last_name: "",
        phone_number: "",
        state: "",
        institution: "",
      });
      setDeliveryAreas([""]);
    } catch (error) {
      console.error("Registration error:", error);

      let errorMessage = "Registration failed. Please try again.";

      if (error.response?.data) {
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.email) {
          errorMessage = `Email: ${error.response.data.email[0]}`;
        } else {
          errorMessage = Object.values(error.response.data).flat().join(", ");
        }
      }

      Swal.fire({
        icon: "error",
        title: "Registration Failed",
        text: errorMessage,
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 4000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get institutions for the selected state
  const getInstitutionsForState = (stateName) => {
    if (!stateName) return [];

    // Convert state name to match the key format in nigeriaInstitutions
    const stateKey = stateName
      .replace(/\s/g, "_")
      .replace("Federal Capital Territory", "FCT_Abuja");
    return nigeriaInstitutions[stateKey] || [];
  };

  const availableInstitutions = getInstitutionsForState(formData.state);

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Company Registration
          </h2>
          <p className="text-gray-600 mt-2">
            Create your company account to start delivering services
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="first_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  First Name *
                </label>
                <input
                  type="text"
                  id="first_name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="last_name"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Last Name *
                </label>
                <input
                  type="text"
                  id="last_name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your email address"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your password (minimum 6 characters)"
                required
              />
            </div>

            <div>
              <label
                htmlFor="phone_number"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Phone Number *
              </label>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                placeholder="Enter your phone number"
                required
              />
            </div>

            {/* Location Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label
                  htmlFor="state"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  State *
                </label>
                <select
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                >
                  <option value="">Select your state</option>
                  {nigeriaStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="institution"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Institution *
                </label>
                <select
                  id="institution"
                  name="institution"
                  value={formData.institution}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                  required
                  disabled={!formData.state}
                >
                  <option value="">
                    {formData.state
                      ? "Select your institution"
                      : "Select state first"}
                  </option>
                  {availableInstitutions.map((institution, index) => (
                    <option key={index} value={institution}>
                      {institution}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Delivery Areas */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Delivery Areas *
                </label>
                <button
                  type="button"
                  onClick={addDeliveryArea}
                  className="flex items-center px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors"
                >
                  <FaPlus className="mr-1" /> Add Area
                </button>
              </div>

              <div className="space-y-3">
                {deliveryAreas.map((area, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="text"
                      value={area}
                      onChange={(e) =>
                        handleDeliveryAreaChange(index, e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                      placeholder={`Enter delivery area ${index + 1}`}
                      required={index === 0} // Make first one required
                    />
                    {deliveryAreas.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDeliveryArea(index)}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                ))}

                <div className="text-gray-500 text-sm">
                  <p>
                    Enter the areas where your company can deliver services
                    (e.g., "University of Lagos", "Victoria Island", "Ikeja",
                    etc.)
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-6 py-3 bg-yellow-500 text-white font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating Account..." : "Register Company"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompanyRegistration;
