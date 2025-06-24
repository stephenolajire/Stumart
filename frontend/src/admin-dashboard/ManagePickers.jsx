import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./css/ManagePickers.module.css";
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

  if (isLoading && !pickers.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className={styles.error}>
        <p>Failed to load pickers</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.pickersContainer}>
      <div className={styles.headerSection}>
        <div className={styles.titleSection}>
          <h2 className={styles.sectionTitle}>
            Manage Pickers
            {pickers.length > 0 && (
              <span className={styles.pickerCount}>({pickers.length})</span>
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
              placeholder="Search pickers..."
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
              value={pickerType}
              onChange={(e) => setPickerType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Picker Types</option>
              <option value="picker">Regular Pickers</option>
              <option value="student_picker">Student Pickers</option>
            </select>

            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Availability</option>
              <option value="true">Available</option>
              <option value="false">Unavailable</option>
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
        <table className={styles.pickersTable}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Type</th>
              <th>Location</th>
              <th>Phone</th>
              <th>Deliveries</th>
              <th>Rating</th>
              <th>Available</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pickers.length === 0 ? (
              <tr>
                <td colSpan="10" className={styles.noData}>
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
                    className={isUpdating ? styles.updating : ""}
                  >
                    <td>{picker.id}</td>
                    <td>{picker.name}</td>
                    <td>
                      <span
                        className={`${styles.typeBadge} ${
                          styles[picker.picker_type]
                        }`}
                      >
                        {picker.picker_type === "picker"
                          ? "Regular Picker"
                          : "Student Picker"}
                      </span>
                    </td>
                    <td>
                      {picker.picker_type === "student_picker"
                        ? `${picker.hostel_name || "N/A"} (Room ${
                            picker.room_number || "N/A"
                          })`
                        : picker.fleet_type || "N/A"}
                    </td>
                    <td>{picker.phone_number}</td>
                    <td>{picker.total_deliveries}</td>
                    <td>
                      <div className={styles.ratingContainer}>
                        <span className={styles.ratingValue}>
                          {picker.rating || 0}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`${styles.availableBadge} ${
                          picker.is_available
                            ? styles.available
                            : styles.unavailable
                        }`}
                      >
                        {picker.is_available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`${styles.verifiedBadge} ${
                          picker.is_verified
                            ? styles.verified
                            : styles.unverified
                        }`}
                      >
                        {picker.is_verified ? "Verified" : "Unverified"}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actionButtons}>
                        <button
                          onClick={() => handleToggleAvailability(picker)}
                          className={`${styles.actionButton} ${
                            picker.is_available
                              ? styles.makeUnavailable
                              : styles.makeAvailable
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
                          className={`${styles.actionButton} ${styles.verify}`}
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
  );
};

export default ManagePickers;
