import React from "react";
import styles from "./css/VendorDashboard.module.css";

const RevenueChart = ({ data }) => (
  <div className={styles.chartCard}>
    <h3>Revenue Trend</h3>
    <div className={styles.chartPlaceholder}>
      {data.map((item, index) => (
        <div
          key={index}
          className={styles.chartBar}
          style={{
            height: `${
              (item.value / Math.max(...data.map((d) => d.value))) * 100
            }%`,
            backgroundColor: "var(--primary-500)",
          }}
        >
          <span className={styles.barValue}>₦{item.value}</span>
        </div>
      ))}
    </div>
    <div className={styles.chartLabels}>
      {data.map((item, index) => (
        <div key={index} className={styles.chartLabel}>
          {item.month}
        </div>
      ))}
    </div>
  </div>
);

export default RevenueChart;
