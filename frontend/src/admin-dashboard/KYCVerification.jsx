// KYCVerification.jsx
import React, { useState, useMemo, useCallback } from "react";
import styles from "./css/KYCVerification.module.css";
import LoadingSpinner from "./LoadingSpinner";
import { MEDIA_BASE_URL } from "../constant/api";
import {
  useKYCVerifications,
  useUpdateKYCStatus,
} from "./hooks/useKYCVerification";

const KYCVerification = () => {
  const [status, setStatus] = useState("");
  const [userType, setUserType] = useState("");
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showModal, setShowModal] = useState(false);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      status,
      user_type: userType,
    }),
    [status, userType]
  );

  // Fetch KYC verifications with current filters
  const {
    data: verifications = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = useKYCVerifications(filters);

  // Mutations
  const updateStatusMutation = useUpdateKYCStatus();

  const handleViewDetails = useCallback((verification) => {
    setSelectedVerification(verification);
    setUpdateStatus(verification.verification_status);
    setRejectionReason(verification.rejection_reason || "");
    setShowModal(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setShowModal(false);
    setSelectedVerification(null);
    setUpdateStatus("");
    setRejectionReason("");
  }, []);

  const handleStatusUpdate = useCallback(async () => {
    if (!selectedVerification) return;

    try {
      const payload = {
        verification_status: updateStatus,
      };

      if (updateStatus === "rejected" && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }

      await updateStatusMutation.mutateAsync({
        id: selectedVerification.id,
        ...payload,
      });

      handleCloseDetails();
      // Success feedback could be added here (toast notification)
    } catch (err) {
      console.error("Error updating verification status:", err);
      alert("Failed to update verification status. Please try again.");
    }
  }, [
    selectedVerification,
    updateStatus,
    rejectionReason,
    updateStatusMutation,
    handleCloseDetails,
  ]);

  const clearFilters = useCallback(() => {
    setStatus("");
    setUserType("");
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return styles.statusApproved;
      case "pending":
        return styles.statusPending;
      case "rejected":
        return styles.statusRejected;
      default:
        return "";
    }
  };

  if (isLoading && !verifications.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className={styles.error}>
        <p>Failed to load KYC verifications</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.headerSection}>
        <div className={styles.titleSection}>
          <h2 className={styles.sectionTitle}>
            KYC Verifications
            {verifications.length > 0 && (
              <span className={styles.verificationCount}>
                ({verifications.length})
              </span>
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
          <div className={styles.filterControls}>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={userType}
              onChange={(e) => setUserType(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="">All User Types</option>
              <option value="vendor">Vendors</option>
              <option value="picker">Pickers</option>
              <option value="student_picker">Student Pickers</option>
            </select>

            <button onClick={clearFilters} className={styles.clearButton}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {isFetching && !isRefetching && (
        <div className={styles.loadingOverlay}>
          <span>Loading verifications...</span>
        </div>
      )}

      <div className={styles.tableContainer}>
        <table className={styles.verificationsTable}>
          <thead>
            <tr>
              <th>User</th>
              <th>User Type</th>
              <th>ID Type</th>
              <th>Submission Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {verifications.length === 0 ? (
              <tr>
                <td colSpan="6" className={styles.noData}>
                  {isFetching ? "Loading..." : "No KYC verifications found"}
                </td>
              </tr>
            ) : (
              verifications.map((verification) => (
                <tr key={verification.id}>
                  <td>
                    <div className={styles.userInfo}>
                      <p className={styles.userName}>
                        {verification.user_name}
                      </p>
                      <p className={styles.userEmail}>
                        {verification.user_email}
                      </p>
                    </div>
                  </td>
                  <td className={styles.capitalize}>
                    {verification.user_type}
                  </td>
                  <td className={styles.capitalize}>{verification.id_type}</td>
                  <td>{formatDate(verification.submission_date)}</td>
                  <td>
                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        verification.verification_status
                      )}`}
                    >
                      {verification.verification_status}
                    </span>
                  </td>
                  <td>
                    <button
                      className={styles.viewButton}
                      onClick={() => handleViewDetails(verification)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* KYC Verification Details Modal */}
      {showModal && selectedVerification && (
        <div className={styles.modalOverlay} onClick={handleCloseDetails}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>KYC Verification Details</h3>
              <button
                className={styles.closeButton}
                onClick={handleCloseDetails}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.userDetails}>
                <h5 className={styles.sectionTitle}>User Information</h5>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Name:</span>
                    <span className={styles.value}>
                      {selectedVerification.user_name}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>
                      {selectedVerification.user_email}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>User Type:</span>
                    <span className={`${styles.value} ${styles.capitalize}`}>
                      {selectedVerification.user_type}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>ID Type:</span>
                    <span className={`${styles.value} ${styles.capitalize}`}>
                      {selectedVerification.id_type}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Submission Date:</span>
                    <span className={styles.value}>
                      {formatDate(selectedVerification.submission_date)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Verification Date:</span>
                    <span className={styles.value}>
                      {formatDate(selectedVerification.verification_date)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Current Status:</span>
                    <span
                      className={`${styles.statusBadge} ${getStatusClass(
                        selectedVerification.verification_status
                      )}`}
                    >
                      {selectedVerification.verification_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.documentsSection}>
                <h5 className={styles.sectionTitle}>Verification Documents</h5>
                <div className={styles.documents}>
                  <div className={styles.document}>
                    <h6>Selfie Image</h6>
                    {selectedVerification.selfie_image ? (
                      <img
                        src={selectedVerification.selfie_image}
                        alt="Selfie"
                        className={styles.documentImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.noImage}>
                        No selfie image provided
                      </div>
                    )}
                  </div>
                  <div className={styles.document}>
                    <h6>ID Document</h6>
                    {selectedVerification.id_image ? (
                      <img
                        src={selectedVerification.id_image}
                        alt="ID Document"
                        className={styles.documentImage}
                        loading="lazy"
                      />
                    ) : (
                      <div className={styles.noImage}>No ID image provided</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.statusUpdateSection}>
                <h5 className={styles.sectionTitle}>Update Status</h5>
                <div className={styles.statusUpdate}>
                  <div className={styles.statusSelect}>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      disabled={updateStatusMutation.isLoading}
                      className={styles.filterSelect}
                    >
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {updateStatus === "rejected" && (
                    <div className={styles.rejectionReason}>
                      <label htmlFor="rejectionReason">Rejection Reason:</label>
                      <textarea
                        id="rejectionReason"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Provide a reason for rejection"
                        disabled={updateStatusMutation.isLoading}
                        className={styles.rejectionTextarea}
                      />
                    </div>
                  )}

                  <div className={styles.modalActions}>
                    <button
                      className={styles.updateButton}
                      onClick={handleStatusUpdate}
                      disabled={
                        updateStatusMutation.isLoading ||
                        updateStatus ===
                          selectedVerification.verification_status ||
                        (updateStatus === "rejected" && !rejectionReason.trim())
                      }
                    >
                      {updateStatusMutation.isLoading
                        ? "Updating..."
                        : "Update Status"}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                className={styles.closeModalButton}
                onClick={handleCloseDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;
