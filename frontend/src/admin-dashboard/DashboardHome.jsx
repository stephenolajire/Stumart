import React, { useState, useEffect } from "react";
import styles from "./css/DashboardHome.module.css";
import axios from "axios";
import StatCard from "./StatCard";
import LoadingSpinner from "./LoadingSpinner";
import api from "../constant/api";

const DashboardHome = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("admin/stats/");
        setStats(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard statistics");
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.dashboardContainer}>
      <h2 className={styles.sectionTitle}>Dashboard Overview</h2>

      <section className={styles.statsSection}>
        <h3 className={styles.subTitle}>Financial Overview</h3>
        <div className={styles.cardsGrid}>
          <StatCard
            title="Total Revenue"
            value={`₦${stats.financial_stats.total_sales.toLocaleString()}`}
            icon="💰"
            color="primary"
          />
          <StatCard
            title="Total Profit"
            value={`₦${stats.financial_stats.total_profit.toLocaleString()}`}
            icon="💰"
            color="primary"
          />
          <StatCard
            title="weekly Sales"
            value={`₦${stats.financial_stats.recent_sales.toLocaleString()}`}
            icon="💵"
            color="success"
          />
        </div>
      </section>

      <section className={styles.statsSection}>
        <h3 className={styles.subTitle}>User Statistics</h3>
        <div className={styles.cardsGrid}>
          <StatCard
            title="Total Users"
            value={stats?.user_stats?.total}
            icon="👥"
            color="primary"
          />
          <StatCard
            title="New This Week"
            value={stats?.user_stats?.new_week}
            icon="📈"
            color="success"
          />
          <StatCard
            title="New This Month"
            value={stats?.user_stats?.new_month}
            icon="📆"
            color="info"
          />
        </div>
      </section>

      <section className={styles.statsSection}>
        <h3 className={styles.subTitle}>User Breakdown</h3>
        <div className={styles.cardsGrid}>
          <StatCard
            title="Students"
            value={stats.user_stats.breakdown.students}
            icon="🎓"
            color="primary"
          />
          <StatCard
            title="Vendors"
            value={stats.user_stats.breakdown.vendors}
            icon="🏪"
            color="warning"
          />
          <StatCard
            title="Pickers"
            value={stats.user_stats.breakdown.pickers}
            icon="🚚"
            color="info"
          />
        </div>
      </section>

      <section className={styles.statsSection}>
        <h3 className={styles.subTitle}>Orders & Products</h3>
        <div className={styles.cardsGrid}>
          <StatCard
            title="Total Orders"
            value={stats.order_stats.total}
            icon="📦"
            color="primary"
          />
          <StatCard
            title="Recent Orders"
            value={stats.order_stats.recent}
            icon="🔄"
            color="success"
          />
          <StatCard
            title="Pending Orders"
            value={stats.order_stats.pending}
            icon="⏳"
            color="warning"
          />
          <StatCard
            title="Total Products"
            value={stats.product_stats.total}
            icon="🛍️"
            color="info"
          />
          <StatCard
            title="Out of Stock"
            value={stats.product_stats.out_of_stock}
            icon="❗"
            color="error"
          />
        </div>
      </section>
    </div>
  );
};

export default DashboardHome;
