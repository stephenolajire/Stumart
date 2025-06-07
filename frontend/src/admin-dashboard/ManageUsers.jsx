import React, { useState, useEffect } from "react";
import styles from "./css/ManageUsers.module.css";
import axios from "axios";
import LoadingSpinner from "./LoadingSpinner";
import api from "../constant/api";

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [userType, setUserType] = useState("");
  const [verified, setVerified] = useState("");

  useEffect(() => {
    fetchUsers();
  }, [query, userType, verified]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      let url = "/users/";
      const params = new URLSearchParams();

      if (query) params.append("query", query);
      if (userType) params.append("user_type", userType);
      if (verified) params.append("verified", verified);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get('admin/users/');
      setUsers(response.data);
      // console.log(response.data)
      setLoading(false);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load users");
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      await axios.put(`users/${userId}/`, {
        is_active: !currentStatus,
      });

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, is_active: !currentStatus } : user
        )
      );
    } catch (err) {
      console.error("Error updating user status:", err);
      alert("Failed to update user status");
    }
  };

  const toggleVerificationStatus = async (userId, currentStatus) => {
    try {
      await api.put(`users/${userId}/`, {
        is_verified: !currentStatus,
      });

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === userId ? { ...user, is_verified: !currentStatus } : user
        )
      );
    } catch (err) {
      console.error("Error updating verification status:", err);
      alert("Failed to update verification status");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const clearFilters = () => {
    setQuery("");
    setUserType("");
    setVerified("");
  };

  const getUserTypeLabel = (type) => {
    const types = {
      student: "Student",
      vendor: "Vendor",
      picker: "Picker",
      student_picker: "Student Picker",
      admin: "Admin",
    };
    return types[type] || type;
  };

  if (loading && users.length === 0) return <LoadingSpinner />;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.usersContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>Manage Users</h2>
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

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
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
                  {/* <th>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="10" className={styles.noData}>
                      No users found
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{`${user.first_name} ${user.last_name}`}</td>
                      <td>{user.email}</td>
                      <td>{user.phone_number}</td>
                      <td>
                        <span
                          className={`${styles.badge} ${
                            styles[user.user_type]
                          }`}
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
                            user.is_verified
                              ? styles.verified
                              : styles.unverified
                          }`}
                        >
                          {user.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      {/* <td>
                        <div className={styles.actionButtons}>
                          <button
                            onClick={() =>
                              toggleUserStatus(user.id, user.is_active)
                            }
                            className={`${styles.actionButton} ${
                              user.is_active
                                ? styles.deactivate
                                : styles.activate
                            }`}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button
                            onClick={() =>
                              toggleVerificationStatus(
                                user.id,
                                user.is_verified
                              )
                            }
                            className={`${styles.actionButton} ${styles.verify}`}
                          >
                            {user.is_verified ? "Unverify" : "Verify"}
                          </button>
                        </div>
                      </td> */}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default ManageUsers;
