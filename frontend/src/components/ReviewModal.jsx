import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import styles from "../css/ReviewModal.module.css";

const ReviewModal = ({ isOpen, onClose, onSubmit, order }) => {
  const [reviews, setReviews] = useState({
    vendor: { rating: 0, comment: "" },
    picker: { rating: 0, comment: "" },
  });

  const handleRatingClick = (type, rating) => {
    setReviews((prev) => ({
      ...prev,
      [type]: { ...prev[type], rating },
    }));
  };

  const handleCommentChange = (type, comment) => {
    setReviews((prev) => ({
      ...prev,
      [type]: { ...prev[type], comment },
    }));
  };

  const handleSubmit = () => {
    onSubmit(reviews);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h2>Review Your Order</h2>
        <p className={styles.orderNumber}>Order #{order.order_number}</p>

        {/* Vendor Review */}
        <div className={styles.reviewSection}>
          <h3>Rate the Vendor</h3>
          <div className={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`${styles.star} ${
                  star <= reviews.vendor.rating ? styles.active : ""
                }`}
                onClick={() => handleRatingClick("vendor", star)}
              />
            ))}
          </div>
          <textarea
            placeholder="Share your experience with the vendor..."
            value={reviews.vendor.comment}
            onChange={(e) => handleCommentChange("vendor", e.target.value)}
            className={styles.reviewInput}
          />
        </div>

        {/* Picker Review */}
        <div className={styles.reviewSection}>
          <h3>Rate the Picker</h3>
          <div className={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={`${styles.star} ${
                  star <= reviews.picker.rating ? styles.active : ""
                }`}
                onClick={() => handleRatingClick("picker", star)}
              />
            ))}
          </div>
          <textarea
            placeholder="Share your experience with the delivery..."
            value={reviews.picker.comment}
            onChange={(e) => handleCommentChange("picker", e.target.value)}
            className={styles.reviewInput}
          />
        </div>

        <div className={styles.modalActions}>
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={!reviews.vendor.rating || !reviews.picker.rating}
          >
            Submit Reviews
          </button>
          <button className={styles.cancelButton} onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
