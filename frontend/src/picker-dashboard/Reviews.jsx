// Reviews.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./css/Reviews.module.css";
import { FaStar, FaStarHalfAlt } from "react-icons/fa";
import api from "../constant/api";

const Reviews = () => {
  const [reviewsData, setReviewsData] = useState({
    average_rating: 0,
    total_reviews: 0,
    reviews: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await api.get("reviews/", {});
        setReviewsData(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load reviews");
        setLoading(false);
        console.error(err);
      }
    };

    fetchReviews();
  }, []);

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className={styles.star} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className={styles.star} />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaStar key={`empty-${i}`} className={styles.emptyStar} />);
    }

    return stars;
  };

  if (loading) {
    return <div className={styles.loader}>Loading reviews...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.reviewsContainer}>
      <div className={styles.header}>
        <h2>Reviews and Ratings</h2>
        <p>See what customers are saying about your service</p>
      </div>

      <div className={styles.statsCard}>
        <div className={styles.ratingWrapper}>
          <div className={styles.ratingNumber}>
            {reviewsData.average_rating.toFixed(1)}
          </div>
          <div className={styles.starsContainer}>
            {renderStars(reviewsData.average_rating)}
          </div>
        </div>
        <div className={styles.totalReviews}>
          <span>{reviewsData.total_reviews}</span> total reviews
        </div>
      </div>

      <div className={styles.reviewsList}>
        {reviewsData.reviews.length > 0 ? (
          reviewsData.reviews.map((review) => (
            <div key={review.id} className={styles.reviewCard}>
              <div className={styles.reviewHeader}>
                <div className={styles.customerInfo}>
                  <h4>{review.customer_name}</h4>
                  <span className={styles.orderNumber}>
                    Order: {review.order_number}
                  </span>
                </div>
                <div className={styles.reviewDate}>{review.date}</div>
              </div>
              <div className={styles.reviewRating}>
                {renderStars(review.rating)}
              </div>
              <p className={styles.comment}>{review.comment}</p>
            </div>
          ))
        ) : (
          <div className={styles.noReviews}>No reviews yet.</div>
        )}
      </div>
    </div>
  );
};

export default Reviews;
