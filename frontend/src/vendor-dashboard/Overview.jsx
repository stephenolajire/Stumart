import React from "react";
import StatCard from "./StatCard";
import RevenueChart from "./RevenueChart";
import SalesChart from "./SalesChart";
import { FaChartBar, FaShoppingCart, FaBox, FaBoxes } from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Overview = ({ stats }) => {
  return (
    <div className={styles.overviewGrid}>
      <StatCard
        title="Total Sales"
        value={`$${stats.totalSales.toLocaleString()}`}
        icon={<FaChartBar />}
        color="var(--primary-500)"
      />
      <StatCard
        title="Total Orders"
        value={stats.totalOrders}
        icon={<FaShoppingCart />}
        color="var(--secondary-600)"
      />
      <StatCard
        title="Total Products"
        value={stats.totalProducts}
        icon={<FaBox />}
        color="var(--primary-600)"
      />
      <StatCard
        title="Low Stock Items"
        value={stats.lowStock}
        icon={<FaBoxes />}
        color="var(--warning)"
      />
      <RevenueChart data={stats.revenueData || []} />
      <SalesChart data={stats.salesData || []} />
    </div>
  );
};

export default Overview;
