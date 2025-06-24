import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./css/ManageUsers.module.css";
import LoadingSpinner from "./LoadingSpinner";
import {
  useUsers,
  useToggleUserStatus,
  useToggleVerificationStatus,
} from "./hooks/useManageUsers";

const ManageUsers = () => {
  const [query, setQuery] = useState("");
  const [userType, setUserType] = useState("");
  const [verified, setVerified] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input for better performance
  const debouncedSearch = useDebouncedCallback((value) => {
    setDebouncedQuery(value);
  }, 500);

  // Update debounced query when query changes
  React.useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      query: debouncedQuery.trim(),
      userType,
      verified,
    }),
    [debouncedQuery, userType, verified]
  );

  // Fetch users with current filters
  const {
    data: users = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = useUsers(filters);

  // Mutations
  const toggleUserStatusMutation = useToggleUserStatus();
  const toggleVerificationMutation = useToggleVerificationStatus();

  const handleToggleUserStatus = useCallback(
    async (userId, currentStatus) => {
      try {
        await toggleUserStatusMutation.mutateAsync({
          userId,
          isActive: currentStatus,
        });
        // Success feedback could be added here (toast notification)
      } catch (err) {
        console.error("Error updating user status:", err);
        // Error handling could be improved with toast notifications
        alert("Failed to update user status. Please try again.");
      }
    },
    [toggleUserStatusMutation]
  );

  const handleToggleVerificationStatus = useCallback(
    async (userId, currentStatus) => {
      try {
        await toggleVerificationMutation.mutateAsync({
          userId,
          isVerified: currentStatus,
        });
        // Success feedback could be added here
      } catch (err) {
        console.error("Error updating verification status:", err);
        alert("Failed to update verification status. Please try again.");
      }
    },
    [toggleVerificationMutation]
  );

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // The debounced search will handle the actual filtering
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setUserType("");
    setVerified("");
    setDebouncedQuery("");
  }, []);

  const getUserTypeLabel = useCallback((type) => {
    const types = {
      student: "Student",
      vendor: "Vendor",
      picker: "Picker",
      student_picker: "Student Picker",
      admin: "Admin",
    };
    return types[type] || type;
  }, []);

  // Check if any mutation is in progress for a specific user
  const isUserBeingUpdated = useCallback(
    (userId) => {
      return (
        (toggleUserStatusMutation.isLoading &&
          toggleUserStatusMutation.variables?.userId === userId) ||
        (toggleVerificationMutation.isLoading &&
          toggleVerificationMutation.variables?.userId === userId)
      );
    },
    [toggleUserStatusMutation, toggleVerificationMutation]
  );

  if (isLoading && !users.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className={styles.error}>
        <p>Failed to load users</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.usersContainer}>
      <div className={styles.headerSection}>
        <div className={styles.titleSection}>
          <h2 className={styles.sectionTitle}>
            Manage Users
            {users.length > 0 && (
              <span className={styles.userCount}>({users.length})</span>
            )}
          </h2>
          <button
            onClick={() => refetch()}
            className={styles.refreshButton}
            disabled={isFetching}
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <div className={styles.filterSection}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              Search
            </button>
          </form>

          <div className={styles.filterControls}>
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All User Types</option>
              <option value="student">Students</option>
              <option value="vendor">Vendors</option>
              <option value="picker">Pickers</option>
              <option value="student_picker">Student Pickers</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={verified}
              onChange={(e) => setVerified(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {isFetching && !isRefetching && (
        <div className={styles.loadingOverlay}>
          <span>Searching...</span>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>User Type</th>
              <th>Institution</th>
              <th>Joined</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan="10" className={styles.noData}>
                  {isFetching ? "Searching..." : "No users found"}
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isUpdating = isUserBeingUpdated(user.id);

                return (
                  <tr
                    key={user.id}
                    className={isUpdating ? styles.updating : ""}
                  >
                    <td>{user.id}</td>
                    <td>{`${user.first_name} ${user.last_name}`}</td>
                    <td>{user.email}</td>
                    <td>{user.phone_number}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${styles[user.user_type]}`}
                      >
                        {getUserTypeLabel(user.user_type)}
                      </span>
                    </td>
                    <td>{user.institution || "-"}</td>
                    <td>{new Date(user.date_joined).toLocaleDateString()}</td>
                    <td>
                      <span
                        className={`${styles.statusBadge} ${
                          user.is_active ? styles.active : styles.inactive
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.verifiedBadge} ${
                          user.is_verified ? styles.verified : styles.unverified
                        }`}
                      >
                        {user.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() =>
                            handleToggleUserStatus(user.id, user.is_active)
                          }
                          className={`${styles.actionButton} ${
                            user.is_active ? styles.deactivate : styles.activate
                          }`}
                          disabled={isUpdating}
                        >
                          {toggleUserStatusMutation.isLoading &&
                          toggleUserStatusMutation.variables?.userId === user.id
                            ? "Updating..."
                            : user.is_active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                        <button
                          onClick={() =>
                            handleToggleVerificationStatus(
                              user.id,
                              user.is_verified
                            )
                          }
                          className={`${styles.actionButton} ${styles.verify}`}
                          disabled={isUpdating}
                        >
                          {toggleVerificationMutation.isLoading &&
                          toggleVerificationMutation.variables?.userId ===
                            user.id
                            ? "Updating..."
                            : user.is_verified
                            ? "Unverify"
                            : "Verify"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManageUsers;
