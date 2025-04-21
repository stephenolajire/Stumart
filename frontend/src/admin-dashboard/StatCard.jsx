import React from "react";
import styles from "./css/StatCard.module.css";

const StatCard = ({ title, value, icon, color }) => {
  return (
    <div className={`${styles.statCard} ${styles[color]}`}>
      <div className={styles.cardIcon}>{icon}</div>
      <div className={styles.cardContent}>
        <h4 className={styles.cardTitle}>{title}</h4>
        <p className={styles.cardValue}>{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
