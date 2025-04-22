import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import api from "../constant/api";
import styles from "../css/ServiceApplication.module.css";
import { MEDIA_BASE_URL } from "../constant/api";

const ServiceApplication = () => {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(GlobalContext);

  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: user ? `${user.first_name} ${user.last_name}` : "",
    email: user ? user.email : "",
    phone: user ? user.phone_number : "",
    description: "",
    preferredDate: "",
    additionalDetails: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        const response = await api.get(`/service-detail/${serviceId}/`);
        setService(response.data);
      } catch (error) {
        console.error("Error fetching service details:", error);
        setError("Could not load service details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [serviceId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      // You would need to create this endpoint on your backend
      await api.post("/service-application/", {
        service_id: serviceId,
        ...formData,
      });

      setSubmitSuccess(true);
      // Reset form after successful submission
      setFormData({
        ...formData,
        description: "",
        preferredDate: "",
        additionalDetails: "",
      });

      // Redirect to success page or show success message
      setTimeout(() => {
        navigate(`/service-application-success/${serviceId}`);
      }, 3000);
    } catch (error) {
      console.error("Error submitting application:", error);
      setError("Failed to submit your application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBackToServices = () => {
    navigate("/other-services");
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingMessage}>Loading service details...</div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className={styles.container}>
        <div className={styles.errorMessage}>
          {error || "Service not found. Please try again."}
        </div>
        <button onClick={handleBackToServices} className={styles.backButton}>
          Back to Services
        </button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={handleBackToServices} className={styles.backButton}>
          ← Back to Services
        </button>
        <h1>Apply for Service</h1>
      </div>

      <div className={styles.serviceInfoSection}>
        <div className={styles.serviceImageContainer}>
          <img
            src={`${MEDIA_BASE_URL}${service.shop_image}` || "/default-service.jpg"}
            alt={service.business_name}
            className={styles.serviceImage}
          />
        </div>
        <div className={styles.serviceInfo}>
          <h2>{service.business_name}</h2>
          <p className={styles.serviceCategory}>{service.specific_category}</p>
          <p className={styles.serviceProvider}>
            Provider: {service.user.first_name} {service.user.last_name}
          </p>
          <p className={styles.serviceLocation}>
            Location: {service.user.institution}
          </p>
          {/* <div className={styles.serviceRating}>
            Rating: {service.rating.toFixed(1)} ({service.total_ratings}{" "}
            reviews)
          </div> */}
        </div>
      </div>

      <div className={styles.formContainer}>
        <h3>Service Application Form</h3>

        {submitSuccess && (
          <div className={styles.successMessage}>
            Your application was submitted successfully! We'll notify the
            service provider.
          </div>
        )}

        {error && <div className={styles.errorMessage}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={!!user}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={!!user}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              disabled={!!user}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">What service do you need?</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              required
              placeholder="Please describe what you need help with..."
            ></textarea>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="preferredDate">Preferred Date & Time</label>
            <input
              type="datetime-local"
              id="preferredDate"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="additionalDetails">
              Additional Details (Optional)
            </label>
            <textarea
              id="additionalDetails"
              name="additionalDetails"
              value={formData.additionalDetails}
              onChange={handleChange}
              rows="3"
              placeholder="Any additional information the service provider should know..."
            ></textarea>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ServiceApplication;
