import React from "react";
import styles from "./css/VendorDashboard.module.css";

const StatCard = ({ title, value, icon, color }) => (
  <div className={styles.statCard}>
    <div
      className={styles.statIcon}
      style={{ backgroundColor: `${color}20`, color }}
    >
      {icon}
    </div>
    <div className={styles.statInfo}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  </div>
);

export default StatCard;
