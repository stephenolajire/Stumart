import React from "react";
import styles from "../css/ProductDetails.module.css";
import { FaArrowLeft } from "react-icons/fa";

const Header = ({title}) => {
  return (
    <div className={styles.header}>
      <div className={styles.backButton} onClick={() => window.history.back()}>
        <FaArrowLeft size={20} />
        <span className={styles.backText}>Back</span>
      </div>
      <h2 className={styles.title}>{title}</h2>
    </div>
  );
};

export default Header;
