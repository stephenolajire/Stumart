// KYCVerification.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/KYCVerification.module.css";
import api from "../constant/api";
import { MEDIA_BASE_URL } from "../constant/api";

const KYCVerification = () => {
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    status: "",
    user_type: "",
  });
  const [selectedVerification, setSelectedVerification] = useState(null);
  const [updateStatus, setUpdateStatus] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchVerifications();
  }, [filter]);

  const fetchVerifications = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter.status) params.append("status", filter.status);
      if (filter.user_type) params.append("user_type", filter.user_type);

      const response = await api.get("admin-kyc-verification/", {
        params,
      });
      setVerifications(response.data);
      console.log("Fetched verifications:", response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch KYC verifications. Please try again later.");
      console.error("Error fetching verifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter((prev) => ({ ...prev, [name]: value }));
  };

  const handleViewDetails = (verification) => {
    setSelectedVerification(verification);
    setUpdateStatus(verification.verification_status);
    setRejectionReason(verification.rejection_reason || "");
  };

  const handleCloseDetails = () => {
    setSelectedVerification(null);
    setUpdateStatus("");
    setRejectionReason("");
  };

  const handleStatusUpdate = async () => {
    if (!selectedVerification) return;

    try {
      setProcessing(true);
      const payload = {
        verification_status: updateStatus,
      };

      if (updateStatus === "rejected" && rejectionReason) {
        payload.rejection_reason = rejectionReason;
      }

      await api.put(
        `admin-kyc-verification/${selectedVerification.id}/`,
        payload
      );

      // Refresh the data
      await fetchVerifications();
      handleCloseDetails();
    } catch (err) {
      setError("Failed to update verification status. Please try again later.");
      console.error("Error updating verification status:", err);
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getStatusClass = (status) => {
    switch (status) {
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

  return (
    <div className={styles.container}>
      <div className={styles.filterSection}>
        <h3>KYC Verifications</h3>
        <div className={styles.filters}>
          <div className={styles.filterItem}>
            <select
              name="status"
              value={filter.status}
              onChange={handleFilterChange}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className={styles.filterItem}>
            <select
              name="user_type"
              value={filter.user_type}
              onChange={handleFilterChange}
            >
              <option value="">All User Types</option>
              <option value="vendor">Vendors</option>
              <option value="picker">Pickers</option>
              <option value="student_picker">Student Pickers</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.loading}>Loading KYC verifications...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.verificationsTable}>
          <table>
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
              {verifications.length > 0 ? (
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
                    <td className={styles.capitalize}>
                      {verification.id_type}
                    </td>
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
              ) : (
                <tr>
                  <td colSpan="6" className={styles.noVerifications}>
                    No KYC verifications found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* KYC Verification Details Modal */}
      {selectedVerification && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalHeader}>
              <h4>KYC Verification Details</h4>
              <button
                className={styles.closeButton}
                onClick={handleCloseDetails}
              >
                ×
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.userDetails}>
                <h5>User Information</h5>
                <div className={styles.infoGrid}>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Name:</span>
                    <span>{selectedVerification.user_name}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Email:</span>
                    <span>{selectedVerification.user_email}</span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>User Type:</span>
                    <span className={styles.capitalize}>
                      {selectedVerification.user_type}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>ID Type:</span>
                    <span className={styles.capitalize}>
                      {selectedVerification.id_type}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Submission Date:</span>
                    <span>
                      {formatDate(selectedVerification.submission_date)}
                    </span>
                  </div>
                  <div className={styles.infoItem}>
                    <span className={styles.label}>Verification Date:</span>
                    <span>
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
                <h5>Verification Documents</h5>
                <div className={styles.documents}>
                  <div className={styles.document}>
                    <h6>Selfie Image</h6>
                    {selectedVerification.selfie_image ? (
                      <img
                        src={selectedVerification.selfie_image}
                        alt="Selfie"
                        className={styles.documentImage}
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
                      />
                    ) : (
                      <div className={styles.noImage}>No ID image provided</div>
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.statusUpdateSection}>
                <h5>Update Status</h5>
                <div className={styles.statusUpdate}>
                  <div className={styles.statusSelect}>
                    <select
                      value={updateStatus}
                      onChange={(e) => setUpdateStatus(e.target.value)}
                      disabled={processing}
                    >
                      <option value="pending">Pending</option>
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
                        disabled={processing}
                      />
                    </div>
                  )}

                  <button
                    className={styles.updateButton}
                    onClick={handleStatusUpdate}
                    disabled={
                      processing ||
                      updateStatus === selectedVerification.verification_status
                    }
                  >
                    {processing ? "Updating..." : "Update Status"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KYCVerification;
