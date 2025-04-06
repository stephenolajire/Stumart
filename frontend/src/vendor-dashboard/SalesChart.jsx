import React from "react";
import styles from "./css/VendorDashboard.module.css";

const SalesChart = ({ data }) => (
  <div className={styles.chartCard}>
    <h3>Monthly Orders</h3>
    <div className={styles.chartPlaceholder}>
      {data.map((item, index) => (
        <div
          key={index}
          className={styles.chartBar}
          style={{
            height: `${
              (item.value / Math.max(...data.map((d) => d.value))) * 100
            }%`,
            backgroundColor: "var(--secondary-700)",
          }}
        >
          <span className={styles.barValue}>{item.value}</span>
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

export default SalesChart;
