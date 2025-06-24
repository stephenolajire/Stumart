import React from "react";
import styles from "./css/DashboardHome.module.css";
import StatCard from "./StatCard";
import LoadingSpinner from "./LoadingSpinner";
import { useDashboardStats } from "./hooks/useDashboardStats";

const DashboardHome = () => {
  const {
    data: stats,
    isLoading,
    error,
    isError,
    refetch,
  } = useDashboardStats();

  if (isLoading) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className={styles.error}>
        <p>Failed to load dashboard statistics</p>
        <button onClick={() => refetch()} className={styles.retryButton}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Dashboard Overview</h2>
        <button
          onClick={() => refetch()}
          className={styles.refreshButton}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

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
            title="Weekly Sales"
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
