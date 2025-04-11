import React from "react";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import SalesChart from "./SalesChart";
import {
  FaChartBar,
  FaShoppingCart,
  FaBox,
  FaBoxes,
  FaStar,
} from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Overview = ({ stats }) => {
  return (
    <div className={styles.overviewGrid}>
      <StatCard
        title="Total Revenue"
        value={`$${stats.totalRevenue?.toLocaleString() || "0"}`}
        icon={<FaChartBar />}
        color="var(--primary-500)"
      />
      <StatCard
        title="Total Orders"
        value={stats.totalOrders || 0}
        icon={<FaShoppingCart />}
        color="var(--secondary-600)"
      />
      <StatCard
        title="Total Products"
        value={stats.totalProducts || 0}
        icon={<FaBox />}
        color="var(--primary-600)"
      />
      <StatCard
        title="Low Stock Items"
        value={stats.lowStock || 0}
        icon={<FaBoxes />}
        color="var(--warning)"
      />
      <StatCard
        title="Pending Reviews"
        value={stats.pendingReviews || 0}
        icon={<FaStar />}
        color="var(--info)"
      />
      <RevenueChart data={stats.revenueData || []} />
      <SalesChart data={stats.salesData || []} />
    </div>
  );
};

export default Overview;
