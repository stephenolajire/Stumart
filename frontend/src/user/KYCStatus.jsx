import React from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/KYCStatus.module.css";
import pendingIcon from "../assets/stumart.jpeg"; // You'll need to add this icon

const KYCStatus = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusBox}>
        <img 
          src={pendingIcon} 
          alt="Pending Verification" 
          className={styles.statusIcon}
        />
        
        <h2>Verification In Progress</h2>
        
        <p className={styles.mainText}>
          Your account verification is currently under review
        </p>
        
        <div className={styles.infoBox}>
          <h3>What happens next?</h3>
          <ul>
            <li>Our team is reviewing your submitted documents</li>
            <li>This process typically takes 24-48 hours</li>
            <li>You'll receive an email once the review is complete</li>
            <li>You can check back here anytime for updates</li>
          </ul>
        </div>

        <button 
          onClick={() => window.location.reload()} 
          className={styles.refreshButton}
        >
          Check Status Again
        </button>

        <button 
          onClick={() => navigate("/")} 
          className={styles.homeButton}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
};

export default KYCStatus;