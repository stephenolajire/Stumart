import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import LoadingSpinner from "./LoadingSpinner";
import {
  usePickers,
  useTogglePickerAvailability,
  useTogglePickerVerification,
} from "./hooks/useManagePickers";

const ManagePickers = () => {
  const [query, setQuery] = useState("");
  const [pickerType, setPickerType] = useState("");
  const [availability, setAvailability] = useState("");
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
      picker_type: pickerType,
      is_available: availability,
    }),
    [debouncedQuery, pickerType, availability]
  );

  // Fetch pickers with current filters
  const {
    data: pickers = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = usePickers(filters);

  // Mutations
  const toggleAvailabilityMutation = useTogglePickerAvailability();
  const toggleVerificationMutation = useTogglePickerVerification();

  const handleToggleAvailability = useCallback(
    async (picker) => {
      try {
        await toggleAvailabilityMutation.mutateAsync({
          pickerId: picker.id,
          pickerType: picker.picker_type,
          isAvailable: !picker.is_available,
        });
        // Success feedback could be added here (toast notification)
      } catch (err) {
        console.error("Error updating availability status:", err);
        alert("Failed to update availability status. Please try again.");
      }
    },
    [toggleAvailabilityMutation]
  );

  const handleToggleVerification = useCallback(
    async (picker) => {
      try {
        await toggleVerificationMutation.mutateAsync({
          pickerId: picker.id,
          pickerType: picker.picker_type,
          isVerified: !picker.is_verified,
        });
        // Success feedback could be added here (toast notification)
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
    setPickerType("");
    setAvailability("");
    setDebouncedQuery("");
  }, []);

  // Check if availability is being updated for a specific picker
  const isAvailabilityBeingUpdated = useCallback(
    (pickerId, pickerType) => {
      return (
        toggleAvailabilityMutation.isLoading &&
        toggleAvailabilityMutation.variables?.pickerId === pickerId &&
        toggleAvailabilityMutation.variables?.pickerType === pickerType
      );
    },
    [toggleAvailabilityMutation]
  );

  // Check if verification is being updated for a specific picker
  const isVerificationBeingUpdated = useCallback(
    (pickerId, pickerType) => {
      return (
        toggleVerificationMutation.isLoading &&
        toggleVerificationMutation.variables?.pickerId === pickerId &&
        toggleVerificationMutation.variables?.pickerType === pickerType
      );
    },
    [toggleVerificationMutation]
  );

  const getPickerTypeBadgeClass = (type) => {
    return type === "picker"
      ? "bg-blue-100 text-blue-800"
      : "bg-purple-100 text-purple-800";
  };

  if (isLoading && !pickers.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p className="font-medium">Failed to load pickers</p>
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
            <h2 className="text-3xl font-bold text-gray-900">Manage Pickers</h2>
            {pickers.length > 0 && (
              <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
                {pickers.length}
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
                  placeholder="Search pickers..."
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
              value={pickerType}
              onChange={(e) => setPickerType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Picker Types</option>
              <option value="picker">Regular Pickers</option>
              <option value="student_picker">Student Pickers</option>
            </select>

            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Availability</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
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
                  ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deliveries
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Available
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
              {pickers.length === 0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    {isFetching ? "Searching..." : "No pickers found"}
                  </td>
                </tr>
              ) : (
                pickers.map((picker) => {
                  const isAvailabilityUpdating = isAvailabilityBeingUpdated(
                    picker.id,
                    picker.picker_type
                  );
                  const isVerificationUpdating = isVerificationBeingUpdated(
                    picker.id,
                    picker.picker_type
                  );
                  const isUpdating =
                    isAvailabilityUpdating || isVerificationUpdating;

                  return (
                    <tr
                      key={`${picker.id}-${picker.picker_type}`}
                      className={`hover:bg-gray-50 transition-colors ${
                        isUpdating ? "opacity-50" : ""
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {picker.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {picker.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPickerTypeBadgeClass(
                            picker.picker_type
                          )}`}
                        >
                          {picker.picker_type === "picker"
                            ? "Regular Picker"
                            : "Student Picker"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {picker.picker_type === "student_picker"
                          ? `${picker.hostel_name || "N/A"} (Room ${
                              picker.room_number || "N/A"
                            })`
                          : picker.fleet_type || "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {picker.phone_number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {picker.total_deliveries}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {picker.rating || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            picker.is_available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {picker.is_available ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            picker.is_verified
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {picker.is_verified ? "Verified" : "Unverified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleAvailability(picker)}
                            className={`px-3 py-1 text-sm rounded transition-colors disabled:opacity-50 ${
                              picker.is_available
                                ? "bg-orange-500 text-white hover:bg-orange-600"
                                : "bg-green-500 text-white hover:bg-green-600"
                            }`}
                            disabled={isUpdating}
                          >
                            {isAvailabilityUpdating
                              ? "Updating..."
                              : picker.is_available
                              ? "Set Unavailable"
                              : "Set Available"}
                          </button>
                          <button
                            onClick={() => handleToggleVerification(picker)}
                            className="px-3 py-1 bg-yellow-500 text-white text-sm rounded hover:bg-yellow-600 transition-colors disabled:opacity-50"
                            disabled={isUpdating}
                          >
                            {isVerificationUpdating
                              ? "Updating..."
                              : picker.is_verified
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

export default ManagePickers;
