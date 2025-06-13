// Home.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/Home.module.css";
import axios from "axios"; // Make sure axios is installed
import api from "../constant/api";

const Home = ({ vendor }) => {
  const [statistics, setStatistics] = useState({
    totalApplications: 0,
    pending: 0,
    accepted: 0,
    completed: 0,
    cancelled: 0,
    declined: 0,
  });

  const [monthlyData, setMonthlyData] = useState([]);
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch dashboard statistics and monthly data
    const fetchDashboardData = async () => {
      try {
        const response = await api.get(
          "other/dashboard/stats/"
        );
        setStatistics(response.data.statistics);
        setMonthlyData(response.data.monthlyData);
        console.log(response.data);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard statistics");
      }
    };

    // Fetch recent applications
    const fetchRecentApplications = async () => {
      try {
        const response = await api.get(
          "applications/recent/"
        );
        setRecentApplications(response.data);
      } catch (err) {
        console.error("Error fetching recent applications:", err);
        setError("Failed to load recent applications");
      } finally {
        setIsLoading(false);
      }
    };

    // Call both fetch functions
    fetchDashboardData();
    fetchRecentApplications();
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <p>Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Calculate the maximum application count for chart scaling
  const maxApplications = Math.max(
    ...monthlyData.map((item) => item.applications)
  );

  // Format date to readable string
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

  // Get status class for styling
  const getStatusClass = (status) => {
    switch (status) {
      case "pending":
        return styles.statusPending;
      case "accepted":
        return styles.statusAccepted;
      case "completed":
        return styles.statusCompleted;
      case "cancelled":
        return styles.statusCancelled;
      case "declined":
        return styles.statusDeclined;
      default:
        return "";
    }
  };

  return (
    <div className={styles.homeContainer}>
      <header className={styles.header}>
        <h1 className={styles.welcomeText}>Welcome, {vendor?.business_name}</h1>
        <p className={styles.dateText}>
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </header>

      <section className={styles.statsSection}>
        <h2 className={styles.sectionTitle}>Service Applications Overview</h2>
        <div className={styles.statsGrid}>
          <div className={`${styles.statCard} ${styles.totalCard}`}>
            <h3>Total Applications</h3>
            <p className={styles.statValue}>{statistics.totalApplications}</p>
          </div>
          <div className={`${styles.statCard} ${styles.pendingCard}`}>
            <h3>Pending</h3>
            <p className={styles.statValue}>{statistics.pending}</p>
          </div>
          <div className={`${styles.statCard} ${styles.acceptedCard}`}>
            <h3>Accepted</h3>
            <p className={styles.statValue}>{statistics.accepted}</p>
          </div>
          <div className={`${styles.statCard} ${styles.completedCard}`}>
            <h3>Completed</h3>
            <p className={styles.statValue}>{statistics.completed}</p>
          </div>
          <div className={`${styles.statCard} ${styles.cancelledCard}`}>
            <h3>Cancelled</h3>
            <p className={styles.statValue}>{statistics.cancelled}</p>
          </div>
          <div className={`${styles.statCard} ${styles.declinedCard}`}>
            <h3>Declined</h3>
            <p className={styles.statValue}>{statistics.declined}</p>
          </div>
        </div>
      </section>

      <section className={styles.chartSection}>
        <h2 className={styles.sectionTitle}>Monthly Applications</h2>
        <div className={styles.chartContainer}>
          <div className={styles.chart}>
            {monthlyData.map((data, index) => (
              <div key={index} className={styles.barContainer}>
                <div
                  className={styles.bar}
                  style={{
                    height: `${
                      (data.applications / (maxApplications || 1)) * 100
                    }%`,
                  }}
                >
                  <span className={styles.barValue}>{data.applications}</span>
                </div>
                <div className={styles.monthLabel}>{data.month}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.recentSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Recent Applications</h2>
        </div>
        <div className={styles.recentList}>
          {recentApplications.length > 0 ? (
            <div className={styles.applicationTable}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Date</th>
                    <th>Service</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentApplications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() =>
                        (window.location.href = `/applications/${app.id}`)
                      }
                    >
                      <td>{app.name}</td>
                      <td>{formatDate(app.created_at)}</td>
                      <td>{app.description.substring(0, 30)}...</td>
                      <td>
                        <span className={getStatusClass(app.status)}>
                          {app.status.charAt(0).toUpperCase() +
                            app.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <p>No recent applications to display.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Home;
