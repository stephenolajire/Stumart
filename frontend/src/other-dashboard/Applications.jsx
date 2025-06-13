// Applications.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/Applications.module.css";
import ApplicationCard from "./ApplicationCard";
import axios from "axios";
import api from "../constant/api";

const Applications = ({ vendor }) => {
  const [applications, setApplications] = useState([]);
  const [filteredApps, setFilteredApps] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState(null);

  const fetchApplications = async (page = 1, status = null) => {
    try {
      setIsLoading(true);
      const params = {
        page,
        limit: 10,
        ...(status && status !== "all" && { status }),
      };

      const response = await api.get("applications/", { params });
      setApplications(response.data.results);
      console.log(response.data.results)
      setFilteredApps(response.data.results);
      setTotalPages(response.data.pages);
      setCurrentPage(response.data.current_page);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch applications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = applications.filter(
        (app) =>
          app.name.toLowerCase().includes(term) ||
          app.email.toLowerCase().includes(term) ||
          app.description.toLowerCase().includes(term)
      );
      setFilteredApps(filtered);
    } else {
      setFilteredApps(applications);
    }
  }, [searchTerm, applications]);

  const handleStatusChange = async (id, newStatus, vendorResponse = "") => {
    try {
      await api.put(`applications/${id}/status/`, {
        status: newStatus,
        vendor_response: vendorResponse,
      });

      // Refresh applications after status update
      fetchApplications(currentPage, statusFilter);
    } catch (err) {
      console.error("Failed to update status:", err);
      // Handle error (show notification, etc.)
    }
  };

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={() => fetchApplications(1, statusFilter)}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={styles.applicationsContainer}>
      <header className={styles.header}>
        <h1 className={styles.title}>Service Applications</h1>
        <p className={styles.subtitle}>
          Manage all your service requests from customers
        </p>
      </header>

      <div className={styles.filters}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search applications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>

        <div className={styles.statusFilters}>
          {[
            "all",
            "pending",
            "accepted",
            "completed",
            "declined",
            "cancelled",
          ].map((status) => (
            <button
              key={status}
              className={`${styles.filterButton} ${
                statusFilter === status ? styles.active : ""
              }`}
              onClick={() => {
                setStatusFilter(status);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.loadingContainer}>
          <p>Loading applications...</p>
        </div>
      ) : (
        <>
          <div className={styles.applicationsList}>
            {filteredApps.length > 0 ? (
              filteredApps.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onStatusChange={handleStatusChange}
                />
              ))
            ) : (
              <div className={styles.noResults}>
                <p>No applications found matching your criteria.</p>
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={styles.pageButton}
              >
                Previous
              </button>
              <span className={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages}
                className={styles.pageButton}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Applications;
