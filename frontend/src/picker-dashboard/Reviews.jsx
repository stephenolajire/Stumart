import React, { useEffect, useState } from "react";
import axios from "axios";
import { Star } from "lucide-react";
import styles from "./Reviews.module.css";

const Reviews = () => {
  const [reviewsData, setReviewsData] = useState({
    average_rating: 0,
    total_reviews: 0,
    reviews: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get("/api/picker/reviews/");
        setReviewsData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching reviews:", error);
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <Star
          key={index}
          size={20}
          fill={index < rating ? "currentColor" : "none"}
          stroke={index < rating ? "currentColor" : "currentColor"}
        />
      ));
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Reviews & Ratings</h1>
      </div>

      <div className={styles.ratingOverview}>
        <div className={styles.averageRating}>
          <div className={styles.ratingValue}>
            {reviewsData.average_rating.toFixed(1)}
          </div>
          <div className={styles.ratingLabel}>Average Rating</div>
        </div>
        <div className={styles.reviewsCount}>
          <div className={styles.countValue}>{reviewsData.total_reviews}</div>
          <div className={styles.countLabel}>Total Reviews</div>
        </div>
      </div>

      <div className={styles.reviewsList}>
        {reviewsData.reviews.map((review) => (
          <div key={review.id} className={styles.reviewCard}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewerInfo}>
                <h3>{review.customer_name}</h3>
                <div className={styles.orderNumber}>
                  Order #{review.order_number}
                </div>
              </div>
              <div className={styles.ratingStars}>
                {renderStars(review.rating)}
              </div>
            </div>
            <div className={styles.reviewComment}>{review.comment}</div>
            <div className={styles.reviewDate}>{review.date}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
