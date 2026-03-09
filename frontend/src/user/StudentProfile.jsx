import React, { useState } from "react";
import {
  FaUser,
  FaEdit,
  FaSave,
  FaTimes,
  FaSchool,
  FaGraduationCap,
  FaPhone,
  FaMapMarkerAlt,
  FaIdCard,
  FaCheckCircle,
  FaCamera,
} from "react-icons/fa";
import {
  useGetStudentDetails,
  useUpdateStudentProfile,
} from "../hooks/useUser"; // adjust path

const StudentProfile = () => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [newProfilePic, setNewProfilePic] = useState(null);

  // ── Query ──────────────────────────────────────────────
  const {
    data: profile,
    isLoading,
    error: queryError,
    isError,
  } = useGetStudentDetails();

  // ── Mutation ───────────────────────────────────────────
  const updateProfileMutation = useUpdateStudentProfile();

  // Sync formData when profile loads or edit mode is cancelled
  React.useEffect(() => {
    if (profile && !editMode) {
      setFormData({
        first_name: profile.user.first_name,
        last_name: profile.user.last_name,
        phone_number: profile.user.phone_number,
        state: profile.user.state,
        institution: profile.user.institution,
      });
    }
  }, [profile, editMode]);

  // ── Handlers ───────────────────────────────────────────
  const handleEdit = () => setEditMode(true);

  const handleCancel = () => {
    setEditMode(false);
    setNewProfilePic(null);
    if (profile) {
      setFormData({
        first_name: profile.user.first_name,
        last_name: profile.user.last_name,
        phone_number: profile.user.phone_number,
        state: profile.user.state,
        institution: profile.user.institution,
        // matric_number: profile.matric_number,
        // department: profile.department,
      });
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfilePicChange = (e) => {
    if (e.target.files?.[0]) setNewProfilePic(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updateData = new FormData();
    Object.keys(formData).forEach((key) =>
      updateData.append(key, formData[key]),
    );
    if (newProfilePic) updateData.append("profile_pic", newProfilePic);

    updateProfileMutation.mutate(updateData, {
      onSuccess: () => {
        setEditMode(false);
        setNewProfilePic(null);
      },
    });
  };

  // ── Early returns ──────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-28">
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="flex items-center justify-center gap-3">
            <div className="w-8 h-8 border-4 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-lg font-medium text-gray-700">
              Loading profile...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-28">
        <div className="max-w-md w-full bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Profile
          </h3>
          <p className="text-gray-600 mb-6">
            {queryError?.message ||
              "Failed to load profile data. Please try again."}
          </p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  // ── Render ─────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pt-28 pb-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <FaUser className="text-white" />
            </div>
            Student Profile
          </h2>
          <p className="text-gray-600 mt-2">
            Manage your personal and academic information
          </p>
        </div>

        {/* Alert Messages */}
        {updateProfileMutation.isError && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <div className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-red-700 text-sm">
              {updateProfileMutation.error?.message ||
                "Failed to update profile. Please try again."}
            </p>
          </div>
        )}

        {updateProfileMutation.isSuccess && !editMode && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
            <FaCheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <p className="text-green-700 text-sm font-medium">
              Profile updated successfully!
            </p>
          </div>
        )}

        {/* Main Profile Card */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="relative">
                {editMode ? (
                  <div className="text-center">
                    <div className="relative group">
                      <img
                        src={
                          newProfilePic
                            ? URL.createObjectURL(newProfilePic)
                            : profile.user.image_url || "/default-avatar.png"
                        }
                        alt="Profile"
                        className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-yellow-500"
                      />
                      <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <FaCamera className="w-6 h-6 text-white" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePicChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <p className="mt-2 text-xs text-gray-300">
                      Click to change
                    </p>
                  </div>
                ) : (
                  <div className="relative">
                    <img
                      src={profile.user.image_url || "/default-avatar.png"}
                      alt="Profile"
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-yellow-500"
                    />
                    <div className="absolute bottom-0 right-0 w-7 h-7 bg-green-500 border-4 border-gray-900 rounded-full"></div>
                  </div>
                )}
              </div>

              <div className="text-center sm:text-left flex-1">
                <h3 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                  {profile.user.first_name} {profile.user.last_name}
                </h3>
                <p className="text-gray-300 mb-4">{profile.user.email}</p>
                {!editMode && (
                  <button
                    onClick={handleEdit}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-all"
                  >
                    <FaEdit />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="p-6">
            {editMode ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUser className="text-yellow-600" />
                    Personal Information
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter first name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter last name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        name="phone_number"
                        value={formData.phone_number || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={formData.state || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter state"
                      />
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-gray-900 rounded-xl p-5 border border-gray-800">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaGraduationCap className="text-yellow-500" />
                    Academic Information
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Institution
                      </label>
                      <input
                        type="text"
                        name="institution"
                        value={formData.institution || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter institution"
                      />
                    </div>
                    {/* <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Matric Number
                      </label>
                      <input
                        type="text"
                        name="matric_number"
                        value={formData.matric_number || ""}
                        readOnly
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-gray-400 rounded-lg cursor-not-allowed"
                        placeholder="Matric number"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Department
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={formData.department || ""}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 text-white rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                        placeholder="Enter department"
                      />
                    </div> */}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className={`flex-1 py-3 px-6 rounded-lg font-semibold transition-all ${
                      updateProfileMutation.isPending
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
                    }`}
                  >
                    {updateProfileMutation.isPending ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <FaSave />
                        <span>Save Changes</span>
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={updateProfileMutation.isPending}
                    className="flex-1 py-3 px-6 rounded-lg font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <FaTimes />
                      <span>Cancel</span>
                    </div>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                {/* Personal Information */}
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FaUser className="text-yellow-600" />
                    Personal Information
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <FaPhone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">Phone</p>
                        <p className="font-semibold text-gray-900">
                          {profile.user.phone_number}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200">
                      <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-xs text-gray-500">State</p>
                        <p className="font-semibold text-gray-900">
                          {profile.user.state}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Academic Information */}
                <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 border border-gray-700">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FaGraduationCap className="text-yellow-500" />
                    Academic Information
                  </h4>
                  <div className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <FaSchool className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Institution</p>
                          <p className="font-semibold text-white">
                            {profile.user.institution}
                          </p>
                        </div>
                      </div>
                      {/* <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <FaGraduationCap className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-xs text-gray-400">Department</p>
                          <p className="font-semibold text-white">
                            {profile.department}
                          </p>
                        </div>
                      </div> */}
                    </div>
                    {/* <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <FaIdCard className="w-5 h-5 text-yellow-500" />
                      <div>
                        <p className="text-xs text-gray-400">Matric Number</p>
                        <p className="font-semibold text-yellow-500">
                          {profile.matric_number || "Not provided"}
                        </p>
                      </div>
                    </div> */}
                  </div>
                </div>

                {/* Account Status */}
                <div className="bg-green-50 rounded-xl p-5 border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                        <FaCheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          Account Status
                        </p>
                        <p className="text-sm text-gray-600">
                          Verified Student
                        </p>
                      </div>
                    </div>
                    <span className="bg-green-100 text-green-800 text-sm font-semibold px-3 py-1 rounded-full border border-green-300">
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
