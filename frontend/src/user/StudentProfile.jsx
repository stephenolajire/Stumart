import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  FaUser,
  FaEdit,
  FaSave,
  FaTimesCircle,
  FaSchool,
  FaGraduationCap,
} from "react-icons/fa";
import api from "../constant/api";

const StudentProfile = () => {
  const queryClient = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [newProfilePic, setNewProfilePic] = useState(null);

  // Fetch student profile using TanStack Query
  const {
    data: profile,
    isLoading,
    error: queryError,
    isError,
  } = useQuery({
    queryKey: ["studentProfile"],
    queryFn: async () => {
      const response = await api.get("student-details/");
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    onSuccess: (data) => {
      // Initialize form data when profile is loaded
      setFormData({
        first_name: data.user.first_name,
        last_name: data.user.last_name,
        phone_number: data.user.phone_number,
        state: data.user.state,
        institution: data.user.institution,
        matric_number: data.matric_number,
        department: data.department,
      });
    },
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await api.patch("update-student-profile/", updateData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Update the cache with new data
      queryClient.setQueryData(["studentProfile"], data);
      setEditMode(false);
      setNewProfilePic(null);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    },
  });

  // Initialize form data when profile is loaded (for when query succeeds)
  React.useEffect(() => {
    if (profile && !editMode) {
      setFormData({
        first_name: profile.user.first_name,
        last_name: profile.user.last_name,
        phone_number: profile.user.phone_number,
        state: profile.user.state,
        institution: profile.user.institution,
        matric_number: profile.matric_number,
        department: profile.department,
      });
    }
  }, [profile, editMode]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
    setNewProfilePic(null);
    // Reset form data to original values
    if (profile) {
      setFormData({
        first_name: profile.user.first_name,
        last_name: profile.user.last_name,
        phone_number: profile.user.phone_number,
        state: profile.user.state,
        institution: profile.user.institution,
        matric_number: profile.matric_number,
        department: profile.department,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleProfilePicChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setNewProfilePic(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const updateData = new FormData();

    // Add all form fields to FormData
    Object.keys(formData).forEach((key) => {
      updateData.append(key, formData[key]);
    });

    // Add profile pic if changed
    if (newProfilePic) {
      updateData.append("profile_pic", newProfilePic);
    }

    updateProfileMutation.mutate(updateData);
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xl font-medium text-gray-700">
              Loading profile...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Profile
            </h3>
            <p className="text-gray-600 mb-6">
              {queryError?.message ||
                "Failed to load profile data. Please try again."}
            </p>
            <button
              onClick={() => queryClient.refetchQueries(["studentProfile"])}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-[1.02] focus:ring-4 focus:ring-amber-200 focus:outline-none"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Don't render if no profile data
  if (!profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br mt-5 md:mt-0 from-amber-50 via-orange-50 to-yellow-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-2 flex items-center justify-center">
            <FaUser className="mr-3 text-amber-500" />
            Student Profile
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-yellow-500 mx-auto rounded-full"></div>
        </div>

        {/* Alert Messages */}
        {updateProfileMutation.isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <p className="text-red-700 font-medium">
                {updateProfileMutation.error?.message ||
                  "Failed to update profile. Please try again."}
              </p>
            </div>
          </div>
        )}

        {updateProfileMutation.isSuccess && !editMode && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-500 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                ></path>
              </svg>
              <p className="text-green-700 font-medium">
                Profile updated successfully!
              </p>
            </div>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-amber-500 to-yellow-500 px-8 pt-8 pb-4">
            <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
              {/* Profile Image */}
              <div className="relative">
                {editMode ? (
                  <div className="text-center">
                    <div className="relative">
                      {newProfilePic ? (
                        <img
                          src={URL.createObjectURL(newProfilePic)}
                          alt="New profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        />
                      ) : (
                        <img
                          src={profile.user.image_url || "/default-avatar.png"}
                          alt="Profile"
                          className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        />
                      )}
                    </div>
                    <label className="mt-3 inline-block bg-white text-amber-600 font-semibold py-2 px-4 rounded-lg shadow-md hover:shadow-lg cursor-pointer transition-all duration-200 transform hover:scale-105">
                      Change Image
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePicChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                ) : (
                  <img
                    src={profile.user.image_url || "/default-avatar.png"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                )}
              </div>

              {/* Profile Info */}
              <div className="text-center md:text-left text-white">
                <h3 className="text-3xl font-bold mb-1">
                  {profile.user.first_name} {profile.user.last_name}
                </h3>
                <p className="text-amber-100 text-lg mb-4">
                  {profile.user.email}
                </p>

                {!editMode && (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center space-x-2 bg-white text-amber-600 font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-white focus:ring-opacity-50"
                  >
                    <FaEdit className="text-lg" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-8">
            {editMode ? (
              /* Edit Form */
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaUser className="mr-3 text-amber-500" />
                    Personal Information
                  </h4>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="Enter your first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="Enter your last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="Enter your state"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information Section */}
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaGraduationCap className="mr-3 text-amber-500" />
                    Academic Information
                  </h4>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Institution
                      </label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="Enter your institution"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Matric Number
                      </label>
                      <input
                        type="text"
                        readOnly
                        name="matric_number"
                        value={formData.matric_number || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="Enter your matric number"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all duration-200 bg-white shadow-sm"
                        placeholder="Enter your department"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isLoading}
                    className={`flex-1 py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 shadow-lg ${
                      updateProfileMutation.isLoading
                        ? "bg-gray-400 cursor-not-allowed shadow-none"
                        : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:from-amber-700 active:to-yellow-700 focus:ring-4 focus:ring-amber-200 focus:outline-none hover:shadow-xl"
                    } transform hover:scale-[1.02] active:scale-[0.98]`}
                  >
                    {updateProfileMutation.isLoading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <FaSave />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isLoading}
                    className="flex-1 py-4 px-6 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] focus:ring-4 focus:ring-gray-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <FaTimesCircle />
                      <span>Cancel</span>
                    </div>
                  </button>
                </div>
              </form>
            ) : (
              /* Profile Details View */
              <div className="space-y-8">
                {/* Personal Information Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaUser className="mr-3 text-amber-500" />
                    Personal Information
                  </h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <div>
                          <span className="block text-sm font-medium text-gray-500">
                            Phone
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {profile.user.phone_number}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <div>
                          <span className="block text-sm font-medium text-gray-500">
                            State
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {profile.user.state}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information Section */}
                <div className="bg-amber-50 rounded-2xl p-6 border border-amber-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <FaSchool className="mr-3 text-amber-500" />
                    Academic Information
                  </h4>
                  <div className="grid gap-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <div>
                            <span className="block text-sm font-medium text-gray-500">
                              Institution
                            </span>
                            <span className="text-lg font-semibold text-gray-900">
                              {profile.user.institution}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                          <div>
                            <span className="block text-sm font-medium text-gray-500">
                              Department
                            </span>
                            <span className="text-lg font-semibold text-gray-900">
                              {profile.department}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-4 border border-amber-100 shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
                        <div>
                          <span className="block text-sm font-medium text-gray-500">
                            Matric Number
                          </span>
                          <span className="text-lg font-semibold text-gray-900">
                            {profile.matric_number || "Not provided"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
                  <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                    <FaGraduationCap className="mr-3 text-blue-500" />
                    Account Status
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                      <span className="text-lg font-medium text-gray-900">
                        Verified Student
                      </span>
                    </div>
                    <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full border border-green-200">
                      Active
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
