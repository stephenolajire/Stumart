import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
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

  const getUserTypeBadgeClass = (type) => {
    const classes = {
      student: "bg-blue-100 text-blue-800",
      vendor: "bg-green-100 text-green-800",
      picker: "bg-purple-100 text-purple-800",
      student_picker: "bg-indigo-100 text-indigo-800",
      admin: "bg-red-100 text-red-800",
    };
    return classes[type] || "bg-gray-100 text-gray-800";
  };

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
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Failed to load users</p>
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 bg-gray-50 min-h-screen">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <h2 className="text-3xl font-bold text-gray-900">Manage Users</h2>
            {users.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {users.length}
              </span>
            )}
          </div>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            disabled={isFetching}
          >
            {isRefetching ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Filter Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0 mb-4">
            <div className="flex-1 max-w-md">
              <div className="flex">
                <input
                  type="text"
                  placeholder="Search users..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  onClick={handleSearch}
                  className="px-4 py-2 bg-yellow-500 text-white rounded-r-lg hover:bg-yellow-600 transition-colors"
                >
                  Search
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-4 md:space-y-0">
            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Verification</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </select>

            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {isFetching && !isRefetching && (
        <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-40">
          <div className="bg-white px-6 py-4 rounded-lg shadow-lg">
            <span className="text-gray-700">Searching...</span>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Institution
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {isFetching ? "Searching..." : "No users found"}
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isUpdating = isUserBeingUpdated(user.id);

                  return (
                    <tr
                      key={user.id}
                      className={`hover:bg-gray-50 transition-colors ${
                        isUpdating ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {`${user.first_name} ${user.last_name}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getUserTypeBadgeClass(
                            user.user_type
                          )}`}
                        >
                          {getUserTypeLabel(user.user_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.institution || "-"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_active
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            user.is_verified
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {user.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              handleToggleUserStatus(user.id, user.is_active)
                            }
                            className={`px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 ${
                              user.is_active
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                            disabled={isUpdating}
                          >
                            {toggleUserStatusMutation.isLoading &&
                            toggleUserStatusMutation.variables?.userId ===
                              user.id
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
                            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
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
    </div>
  );
};

export default ManageUsers;
