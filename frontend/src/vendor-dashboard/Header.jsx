import React from "react";
import styles from "../css/ProductDetails.module.css";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const Header = () => {
    const navigate = useNavigate()
  return (
    <div className={styles.header}>
      <div className={styles.backButton} onClick={() => navigate('/vendor-dashboard')}>
        <FaArrowLeft size={20} />
        <span className={styles.backText}>Back</span>
      </div>
      <h2 className={styles.title}>Add Product</h2>
    </div>
  );
};

export default Header;
