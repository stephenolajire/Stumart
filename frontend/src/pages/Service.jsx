import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../constant/api";
import styles from "../css/Service.module.css";

const Service = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchService = async () => {
    try {
      setLoading(true);
      const response = await api.get("my-submitted-applications");
      setApplications(response.data.applications || []);
      setError(null);
    } catch (err) {
      setError("Failed to fetch applications. Please try again.");
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchService();
  }, []);

  const handleChatClick = (serviceId, serviceName) => {
    // Navigate to messages page with service details
    navigate(
      `/messages?serviceId=${serviceId}&serviceName=${encodeURIComponent(
        serviceName
      )}`
    );
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "accepted":
        return styles.statusAccepted;
      case "pending":
        return styles.statusPending;
      case "rejected":
        return styles.statusRejected;
      default:
        return styles.statusDefault;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not set";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Oops! Something went wrong</h2>
          <p>{error}</p>
          <button onClick={fetchService} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Service Applications</h1>
        <p className={styles.subtitle}>
          {applications.length > 0
            ? `You have ${applications.length} submitted application${
                applications.length > 1 ? "s" : ""
              }`
            : "No applications found"}
        </p>
      </div>

      {applications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3>No Applications Yet</h3>
          <p>You haven't submitted any service applications yet.</p>
          <button
            className={styles.primaryButton}
            onClick={() => navigate("/services")}
          >
            Browse Services
          </button>
        </div>
      ) : (
        <div className={styles.applicationsGrid}>
          {applications.map((app) => (
            <div key={app.id} className={styles.applicationCard}>
              <div className={styles.cardHeader}>
                <h3 className={styles.serviceName}>{app.service_name}</h3>
                <span
                  className={`${styles.status} ${getStatusClass(app.status)}`}
                >
                  {app.status}
                </span>
              </div>

              <div className={styles.cardContent}>
                <div className={styles.field}>
                  <span className={styles.label}>Category:</span>
                  <span className={styles.value}>
                    {app.service_category.replace("_", " ").toUpperCase()}
                  </span>
                </div>

                <div className={styles.field}>
                  <span className={styles.label}>Description:</span>
                  <p className={styles.description}>{app.description}</p>
                </div>

                {app.additional_details && (
                  <div className={styles.field}>
                    <span className={styles.label}>Additional Details:</span>
                    <p className={styles.description}>
                      {app.additional_details}
                    </p>
                  </div>
                )}

                <div className={styles.dateInfo}>
                  <div className={styles.field}>
                    <span className={styles.label}>Preferred Date:</span>
                    <span className={styles.value}>
                      {formatDate(app.preferred_date)}
                    </span>
                  </div>

                  <div className={styles.field}>
                    <span className={styles.label}>Submitted:</span>
                    <span className={styles.value}>
                      {formatDate(app.created_at)}
                    </span>
                  </div>

                  {app.response_date && (
                    <div className={styles.field}>
                      <span className={styles.label}>Response Date:</span>
                      <span className={styles.value}>
                        {formatDate(app.response_date)}
                      </span>
                    </div>
                  )}

                  {app.completion_date && (
                    <div className={styles.field}>
                      <span className={styles.label}>Completion Date:</span>
                      <span className={styles.value}>
                        {formatDate(app.completion_date)}
                      </span>
                    </div>
                  )}
                </div>

                {app.vendor_response && (
                  <div className={styles.vendorResponse}>
                    <span className={styles.label}>Provider Response:</span>
                    <p className={styles.description}>{app.vendor_response}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Service;
