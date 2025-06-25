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
import styles from "../css/StudentProfile.module.css";
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
      <div style={{ marginTop: "10rem" }} className={styles.loading}>
        Loading profile...
      </div>
    );
  }

  // Handle error state
  if (isError) {
    return (
      <div className={styles.profileContainer}>
        <div className={styles.errorAlert}>
          {queryError?.message ||
            "Failed to load profile data. Please try again."}
        </div>
        <button
          onClick={() => queryClient.refetchQueries(["studentProfile"])}
          className={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  // Don't render if no profile data
  if (!profile) {
    return null;
  }

  return (
    <div className={styles.profileContainer}>
      <h2 className={styles.profileTitle}>
        <FaUser className={styles.titleIcon} />
        Student Profile
      </h2>

      {/* Show mutation error */}
      {updateProfileMutation.isError && (
        <div className={styles.errorAlert}>
          {updateProfileMutation.error?.message ||
            "Failed to update profile. Please try again."}
        </div>
      )}

      {/* Show success message */}
      {updateProfileMutation.isSuccess && !editMode && (
        <div className={styles.successAlert}>Profile updated successfully!</div>
      )}

      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.profileImageContainer}>
            {editMode ? (
              <div className={styles.imageUploadContainer}>
                <div className={styles.currentImage}>
                  {newProfilePic ? (
                    <img
                      src={URL.createObjectURL(newProfilePic)}
                      alt="New profile"
                      className={styles.profileImage}
                    />
                  ) : (
                    <img
                      src={profile.user.image_url || "/default-avatar.png"}
                      alt="Profile"
                      className={styles.profileImage}
                    />
                  )}
                </div>
                <label className={styles.uploadButton}>
                  Change Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePicChange}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            ) : (
              <img
                src={profile.user.image_url || "/default-avatar.png"}
                alt="Profile"
                className={styles.profileImage}
              />
            )}
          </div>

          <div className={styles.profileInfo}>
            <h3 className={styles.studentName}>
              {profile.user.first_name} {profile.user.last_name}
            </h3>
            <p className={styles.studentEmail}>{profile.user.email}</p>

            {!editMode && (
              <button className={styles.editButton} onClick={handleEdit}>
                <FaEdit /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className={styles.profileForm}>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state || ""}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>Institution</label>
                <input
                  type="text"
                  name="institution"
                  value={formData.institution || ""}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Matric Number</label>
                <input
                  type="text"
                  name="matric_number"
                  value={formData.matric_number || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Department</label>
              <input
                type="text"
                name="department"
                value={formData.department || ""}
                onChange={handleChange}
                required
              />
            </div>

            <div className={styles.formButtons}>
              <button
                type="submit"
                className={styles.saveButton}
                disabled={updateProfileMutation.isLoading}
              >
                {updateProfileMutation.isLoading ? (
                  "Saving..."
                ) : (
                  <>
                    <FaSave /> Save Changes
                  </>
                )}
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={handleCancel}
                disabled={updateProfileMutation.isLoading}
              >
                <FaTimesCircle /> Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.profileDetails}>
            <div className={styles.detailsSection}>
              <h4 className={styles.sectionTitle}>
                <FaUser className={styles.sectionIcon} /> Personal Information
              </h4>
              <div className={styles.detailRow}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Phone:</span>
                  <span className={styles.detailValue}>
                    {profile.user.phone_number}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>State:</span>
                  <span className={styles.detailValue}>
                    {profile.user.state}
                  </span>
                </div>
              </div>
            </div>

            <div className={styles.detailsSection}>
              <h4 className={styles.sectionTitle}>
                <FaSchool className={styles.sectionIcon} /> Academic Information
              </h4>
              <div className={styles.detailRow}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Institution:</span>
                  <span className={styles.detailValue}>
                    {profile.user.institution}
                  </span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Department:</span>
                  <span className={styles.detailValue}>
                    {profile.department}
                  </span>
                </div>
              </div>
              <div className={styles.detailRow}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Matric Number:</span>
                  <span className={styles.detailValue}>
                    {profile.matric_number || "Not provided"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfile;
