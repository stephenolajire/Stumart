import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../css/KYCStatus.module.css";
import pendingIcon from "../assets/stumart.jpeg";
import api from "../constant/api";
import Swal from "sweetalert2";

const KYCStatus = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState({
    status: "pending",
    business_category: null,
  });

  const user_id = localStorage.getItem("user_id");
  const user_type = localStorage.getItem("user_type");

  useEffect(() => {
    if (user_id && user_type) {
      handleRefreshKYC();
    }
  }, []);

  const handleRefreshKYC = async () => {
    setLoading(true);
    try {
      const response = await api.get(`kyc-status/${user_type}/${user_id}/`);

      if (response.data) {
        setKycStatus(response.data);

        if (response.data.status === "approved") {
          // Handle picker types
          if (["picker", "student_picker"].includes(user_type)) {
            Swal.fire({
              icon: "success",
              title: "Verification approved",
            });
            navigate("/picker");
          }
          // Handle vendor types
          else if (user_type === "vendor") {
            if (response.data.business_category === "other") {
              Swal.fire({
                icon: "success",
                title: "Verification approved",
              });
              navigate("/other-dashboard");
            } else {
              Swal.fire({
                icon: "success",
                title: "Verification approved",
              });
              navigate("/vendor-dashboard");
            }
          }
        } else {
          Swal.fire({
            icon: "info",
            title: "Verification pending",
            text: "Please check back later",
          });
        }
      }
    } catch (error) {
      console.error("Error fetching KYC status:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to fetch status",
        text: "Please try again later",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.statusContainer}>
      <div className={styles.statusBox}>
        <img
          src={pendingIcon}
          alt="Verification Status"
          className={styles.statusIcon}
        />

        <h2>
          {kycStatus.status === "approved"
            ? "Verification Approved"
            : "Verification In Progress"}
        </h2>

        <p className={styles.mainText}>
          {kycStatus.status === "approved"
            ? "Your account has been verified successfully"
            : "Your account verification is currently under review"}
        </p>

        {kycStatus.status !== "approved" && (
          <div className={styles.infoBox}>
            <h3>What happens next?</h3>
            <ul>
              <li>Our team is reviewing your submitted documents</li>
              <li>This process typically takes 24-48 hours</li>
              <li>You'll receive an email once the review is complete</li>
              <li>You can check back here anytime for updates</li>
            </ul>
          </div>
        )}

        <button
          onClick={handleRefreshKYC}
          className={styles.refreshButton}
          disabled={loading}
        >
          {loading ? (
            <span>
              <i className="fas fa-spinner fa-spin" /> Checking...
            </span>
          ) : (
            "Check Status Again"
          )}
        </button>
      </div>
    </div>
  );
};

export default KYCStatus;
