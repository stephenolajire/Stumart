import React, { useState, useEffect } from "react";
import styles from "./css/ManagePickers.module.css";
import LoadingSpinner from "./LoadingSpinner";
import api from "../constant/api";

const ManagePickers = () => {
  const [pickers, setPickers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [pickerType, setPickerType] = useState("");
  const [availability, setAvailability] = useState("");

  useEffect(() => {
    fetchPickers();
  }, [query, pickerType, availability]);

  const fetchPickers = async () => {
    try {
      setLoading(true);
      let url = "admin-pickers/";
      const params = new URLSearchParams();

      if (query) params.append("query", query);
      if (pickerType) params.append("picker_type", pickerType);
      if (availability) params.append("is_available", availability);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      console.log(`Fetching pickers with URL: ${url}`);
      const response = await api.get(url);
      setPickers(response.data);
      console.log("Pickers data received:", response.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching pickers:", err);
      setError("Failed to load pickers");
      setLoading(false);
    }
  };

  const toggleAvailability = async (picker) => {
    try {
      console.log(
        `Toggling availability for ${picker.picker_type} with ID ${picker.id}`
      );
      await api.put(`pickers/${picker.id}/${picker.picker_type}/`, {
        is_available: !picker.is_available,
      });

      // Update local state
      setPickers(
        pickers.map((p) =>
          p.id === picker.id && p.picker_type === picker.picker_type
            ? { ...p, is_available: !p.is_available }
            : p
        )
      );
    } catch (err) {
      console.error("Error updating availability status:", err);
      alert("Failed to update availability status");
    }
  };

  const toggleVerification = async (picker) => {
    try {
      console.log(
        `Toggling verification for ${picker.picker_type} with ID ${picker.id}`
      );
      await api.put(`pickers/${picker.id}/${picker.picker_type}/`, {
        is_verified: !picker.is_verified,
      });

      // Update local state
      setPickers(
        pickers.map((p) =>
          p.id === picker.id && p.picker_type === picker.picker_type
            ? { ...p, is_verified: !p.is_verified }
            : p
        )
      );
    } catch (err) {
      console.error("Error updating verification status:", err);
      alert("Failed to update verification status");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPickers();
  };

  const clearFilters = () => {
    setQuery("");
    setPickerType("");
    setAvailability("");
  };

  if (loading && pickers.length === 0) return <LoadingSpinner />;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.pickersContainer}>
      <div className={styles.headerSection}>
        <h2 className={styles.sectionTitle}>Manage Pickers</h2>
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

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
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
                      No pickers found
                    </td>
                  </tr>
                ) : (
                  pickers.map((picker) => (
                    <tr key={`${picker.id}-${picker.picker_type}`}>
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
                            onClick={() => toggleAvailability(picker)}
                            className={`${styles.actionButton} ${
                              picker.is_available
                                ? styles.makeUnavailable
                                : styles.makeAvailable
                            }`}
                          >
                            {picker.is_available
                              ? "Set Unavailable"
                              : "Set Available"}
                          </button>
                          <button
                            onClick={() => toggleVerification(picker)}
                            className={`${styles.actionButton} ${styles.verify}`}
                          >
                            {picker.is_verified ? "Unverify" : "Verify"}
                          </button>
                        </div>
                      </td>
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

export default ManagePickers;
