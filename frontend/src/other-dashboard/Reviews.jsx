import React, { useState } from "react";
import styles from "./css/Reviews.module.css";

const Reviews = ({ vendor }) => {
  const [reviews] = useState([
    {
      id: 1,
      user: "John Doe",
      rating: 5,
      comment: "Excellent service! Very professional and timely.",
      date: "2025-04-15T10:30:00Z",
    },
    {
      id: 2,
      user: "Jane Smith",
      rating: 4,
      comment: "Good work, but could improve communication.",
      date: "2025-04-14T15:20:00Z",
    },
  ]);

  return (
    <div className={styles.reviewsContainer}>
      <header className={styles.header}>
        <h2 className={styles.title}>Customer Reviews</h2>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statValue}>4.5</span>
            <span className={styles.statLabel}>Average Rating</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statValue}>{reviews.length}</span>
            <span className={styles.statLabel}>Total Reviews</span>
          </div>
        </div>
      </header>

      <div className={styles.reviewsList}>
        {reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <h3 className={styles.reviewerName}>{review.user}</h3>
              <div className={styles.rating}>
                {[...Array(5)].map((_, index) => (
                  <span
                    key={index}
                    className={`${styles.star} ${
                      index < review.rating ? styles.filled : ""
                    }`}
                  >
                    ⭐
                  </span>
                ))}
              </div>
            </div>
            <p className={styles.reviewComment}>{review.comment}</p>
            <span className={styles.reviewDate}>
              {new Date(review.date).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
