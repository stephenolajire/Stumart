import React, { useState, useEffect } from "react";
import { FaSearch, FaStar, FaFilter, FaSpinner } from "react-icons/fa";
import styles from "./css/Reviews.module.css";
import api from "../constant/api";

const Reviews = () => {
  const [filterRating, setFilterRating] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [expandedReview, setExpandedReview] = useState(null);

  // API data state
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({
    total_reviews: 0,
    average_rating: 0,
    rating_breakdown: {},
  });
  const [vendorInfo, setVendorInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reviews data from API
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await api.get("vendor/reviews/");

        // Since we're using axios, data is automatically parsed
        const { data } = response;

        setReviews(data.reviews || []);
        setStats({
          total_reviews: data.stats?.total_reviews || 0,
          average_rating: data.stats?.average_rating || 0,
          rating_breakdown: data.stats?.rating_breakdown || {},
        });
        setVendorInfo(data.vendor_info || {});
        setError(null);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Failed to fetch reviews. Please try again."
        );
        console.error("Error fetching reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Calculate additional stats
  const fiveStarPercentage =
    stats.total_reviews > 0
      ? ((stats.rating_breakdown[5] || 0) / stats.total_reviews) * 100
      : 0;

  const filterReviews = () => {
    return reviews
      .filter((review) => {
        const matchesSearch =
          (review.reviewer?.first_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (review.reviewer?.last_name || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          (review.comment || "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchesRating =
          filterRating === "all" ||
          (filterRating === "5star" && review.rating === 5) ||
          (filterRating === "4star" && review.rating === 4) ||
          (filterRating === "3star" && review.rating === 3) ||
          (filterRating === "2star" && review.rating === 2) ||
          (filterRating === "1star" && review.rating === 1) ||
          (filterRating === "negative" && review.rating <= 3);

        return matchesSearch && matchesRating;
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.created_at) - new Date(a.created_at);
        } else if (sortBy === "rating-high") {
          return b.rating - a.rating;
        } else if (sortBy === "rating-low") {
          return a.rating - b.rating;
        }
        return 0;
      });
  };

  const renderStars = (rating) => {
    return Array(5)
      .fill(0)
      .map((_, index) => (
        <FaStar
          key={index}
          className={index < rating ? styles.starFilled : styles.starEmpty}
        />
      ));
  };

  const toggleExpandReview = (id) => {
    setExpandedReview(expandedReview === id ? null : id);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getCustomerName = (review) => {
    if (!review) return "Anonymous";
    return review || "Anonymous";
  };

  if (loading) {
    return (
      <div className={styles.reviewsSection}>
        <div className={styles.loadingContainer}>
          <FaSpinner className={styles.spinner} />
          <p>Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.reviewsSection}>
        <div className={styles.errorContainer}>
          <p>Error loading reviews: {error}</p>
          <button
            onClick={() => window.location.reload()}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.reviewsSection}>
      {/* <div className={styles.sectionHeader}>
        {vendorInfo.business_name && (
          <p className={styles.businessName}>{vendorInfo.business_name}</p>
        )}
      </div> */}

      <div className={styles.reviewsSummary}>
        <div className={styles.summaryCard}>
          <h3>Average Rating</h3>
          <div className={styles.ratingDisplay}>
            <span className={styles.ratingNumber}>
              {stats.average_rating.toFixed(1)}
            </span>
            <div className={styles.starsContainer}>
              {renderStars(Math.round(stats.average_rating))}
            </div>
          </div>
        </div>
        <div className={styles.summaryCard}>
          <h3>5-Star Reviews</h3>
          <p className={styles.summaryValue}>
            {fiveStarPercentage.toFixed(0)}%
          </p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Total Reviews</h3>
          <p className={styles.summaryValue}>{stats.total_reviews}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Rating Breakdown</h3>
          <div className={styles.ratingBreakdown}>
            {[5, 4, 3, 2, 1].map((rating) => (
              <div key={rating} className={styles.ratingRow}>
                <span>{rating}★</span>
                <span>{stats.rating_breakdown[rating] || 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <select
            value={filterRating}
            onChange={(e) => setFilterRating(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Ratings</option>
            <option value="5star">5 Star</option>
            <option value="4star">4 Star</option>
            <option value="3star">3 Star</option>
            <option value="2star">2 Star</option>
            <option value="1star">1 Star</option>
            <option value="negative">Negative Reviews</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="date">Most Recent</option>
            <option value="rating-high">Highest Rating</option>
            <option value="rating-low">Lowest Rating</option>
          </select>
        </div>

        <div className={styles.searchContainer}>
          <FaSearch className={styles.searchIcon} />
          <input
            type="search"
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
      </div>

      <div className={styles.reviewsList}>
        {filterReviews().length === 0 ? (
          <div className={styles.noReviews}>
            <p>No reviews found matching your criteria.</p>
          </div>
        ) : (
          filterReviews().map((review) => (
            <div className={styles.reviewCard} key={review.id}>
              <div className={styles.reviewHeader}>
                <div className={styles.reviewInfo}>
                  <div className={styles.starsContainer}>
                    {renderStars(review.rating)}
                  </div>
                </div>
                <div className={styles.reviewMeta}>
                  <p className={styles.customerName}>
                    {getCustomerName(review.reviewer_name)}
                  </p>
                  <p className={styles.reviewDate}>
                    {formatDate(review.created_at)}
                  </p>
                  {/* {review.order && (
                    <p className={styles.orderId}>Order #{review.order.id}</p>
                  )} */}
                </div>
              </div>

              <div
                className={`${styles.reviewContent} ${
                  expandedReview === review.id ? styles.expanded : ""
                }`}
                onClick={() => toggleExpandReview(review.id)}
              >
                <p>{review.comment || "No comment provided"}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
