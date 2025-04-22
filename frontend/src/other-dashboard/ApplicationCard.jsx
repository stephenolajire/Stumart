// ApplicationCard.jsx
import React, { useState } from "react";
import styles from "./css/ApplicationCard.module.css";

const ApplicationCard = ({ application, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return styles.pendingBadge;
      case "accepted":
        return styles.acceptedBadge;
      case "completed":
        return styles.completedBadge;
      case "declined":
        return styles.declinedBadge;
      case "cancelled":
        return styles.cancelledBadge;
      default:
        return "";
    }
  };

  const handleStatusChange = (newStatus) => {
    onStatusChange(application.id, newStatus);
    setShowStatusMenu(false);
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div className={styles.customerInfo}>
          <h3 className={styles.customerName}>{application.name}</h3>
          <p className={styles.applicationDate}>
            Submitted: {formatDate(application.created_at)}
          </p>
        </div>

        <div className={styles.statusSection}>
          <div
            className={`${styles.statusBadge} ${getStatusBadgeClass(
              application.status
            )}`}
          >
            {application.status}
          </div>

          <div className={styles.statusDropdown}>
            <button
              className={styles.statusButton}
              onClick={() => setShowStatusMenu(!showStatusMenu)}
            >
              Update Status
            </button>

            {showStatusMenu && (
              <div className={styles.statusMenu}>
                <button
                  className={styles.statusMenuItem}
                  onClick={() => handleStatusChange("pending")}
                >
                  Pending
                </button>
                <button
                  className={styles.statusMenuItem}
                  onClick={() => handleStatusChange("accepted")}
                >
                  Accept
                </button>
                <button
                  className={styles.statusMenuItem}
                  onClick={() => handleStatusChange("completed")}
                >
                  Complete
                </button>
                <button
                  className={styles.statusMenuItem}
                  onClick={() => handleStatusChange("declined")}
                >
                  Decline
                </button>
                <button
                  className={styles.statusMenuItem}
                  onClick={() => handleStatusChange("cancelled")}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.cardPreview}>
        <div className={styles.serviceRequest}>
          <p className={styles.requestTitle}>Service Requested:</p>
          <p className={styles.requestText}>{application.description}</p>
        </div>

        <div className={styles.serviceDateSection}>
          <p className={styles.dateLabel}>Requested Date:</p>
          <p className={styles.dateValue}>
            {formatDate(application.preferred_date)}
          </p>
        </div>
      </div>

      <div className={styles.cardActions}>
        <button
          className={styles.expandButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show Less" : "Show More"}
        </button>

        <button className={styles.chatButton}>Chat with Customer</button>
      </div>

      {isExpanded && (
        <div className={styles.expandedContent}>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <p className={styles.detailLabel}>Email:</p>
              <p className={styles.detailValue}>{application.email}</p>
            </div>
            <div className={styles.detailItem}>
              <p className={styles.detailLabel}>Phone:</p>
              <p className={styles.detailValue}>{application.phone}</p>
            </div>
            <div className={styles.detailItem}>
              <p className={styles.detailLabel}>Additional Details:</p>
              <p className={styles.detailValue}>
                {application.additional_details ||
                  "No additional details provided."}
              </p>
            </div>
          </div>

          <div className={styles.responseSection}>
            <h4 className={styles.responseTitle}>Your Response</h4>
            <textarea
              className={styles.responseTextarea}
              placeholder="Enter your response to the customer..."
              rows={4}
            ></textarea>
            <button className={styles.sendResponseButton}>Send Response</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationCard;
