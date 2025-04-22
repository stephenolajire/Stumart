import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../constant/api";
import styles from "../css/ServiceApplicationSuccess.module.css";

const ServiceApplicationSuccess = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await api.get(`/service-detail/${serviceId}/`);
        setService(response.data);
      } catch (error) {
        console.error("Error fetching service details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]);

  const handleBackToServices = () => {
    navigate("/other-services");
  };

  const handleBackToHome = () => {
    navigate("/");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.successIcon}>✓</div>
        <h1>Application Submitted!</h1>

        <p className={styles.message}>
          Your application for {service?.specific_category} from{" "}
          {service?.business_name} has been submitted successfully.
        </p>

        <div className={styles.infoBox}>
          <p>What happens next?</p>
          <ul>
            <li>The service provider will review your application</li>
            <li>You will receive a call when they check their mail</li>
            <li>You can keep waiting till they call</li>
          </ul>
        </div>

        <div className={styles.buttonsContainer}>
          <button
            onClick={handleBackToServices}
            className={styles.primaryButton}
          >
            Browse More Services
          </button>
          <button onClick={handleBackToHome} className={styles.secondaryButton}>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceApplicationSuccess;
