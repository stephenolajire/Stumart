import React, { useState } from "react";
import { FaSearch, FaReply, FaStar, FaFilter } from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Reviews = () => {
  const [filterRating, setFilterRating] = useState("all");
  const [filterResponded, setFilterResponded] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [expandedReview, setExpandedReview] = useState(null);

  // Mock reviews data
  const reviews = [
    {
      id: 1,
      productId: "P1001",
      productName: "Premium Coffee Maker",
      customerName: "Sarah Johnson",
      date: "2025-03-28",
      rating: 5,
      content:
        "This coffee maker is amazing! The temperature control is perfect and it makes delicious coffee every time. I love the design and how easy it is to clean.",
      responded: true,
      response:
        "Thank you for your wonderful review, Sarah! We're thrilled that you're enjoying your Premium Coffee Maker.",
    },
    {
      id: 2,
      productId: "P1002",
      productName: "Smart Blender Pro",
      customerName: "Michael Thompson",
      date: "2025-03-25",
      rating: 2,
      content:
        "Disappointed with this purchase. The blender is very noisy and doesn't blend smoothly. The app connection is unreliable too.",
      responded: false,
      response: "",
    },
    {
      id: 3,
      productId: "P1003",
      productName: "Ergonomic Office Chair",
      customerName: "Emily Davis",
      date: "2025-03-20",
      rating: 4,
      content:
        "Very comfortable chair that has helped with my back pain. The only reason I'm not giving 5 stars is because assembly was quite difficult.",
      responded: true,
      response:
        "Thanks for your feedback, Emily! We appreciate the 4-star review and we're working on improving our assembly instructions.",
    },
    {
      id: 4,
      productId: "P1004",
      productName: "Wireless Headphones",
      customerName: "Robert Wilson",
      date: "2025-03-18",
      rating: 5,
      content:
        "Excellent sound quality and very comfortable to wear for long periods. Battery life is impressive too!",
      responded: false,
      response: "",
    },
    {
      id: 5,
      productId: "P1005",
      productName: "Smart Home Hub",
      customerName: "Jennifer Brown",
      date: "2025-03-15",
      rating: 3,
      content:
        "The device works well most of the time but has connectivity issues with some of my other smart devices. Customer service was helpful but couldn't fully resolve the problem.",
      responded: true,
      response:
        "Hi Jennifer, thank you for your honest feedback. We'd like to follow up with you to see if we can resolve the connectivity issues you're experiencing. Our support team will contact you soon.",
    },
    {
      id: 6,
      productId: "P1001",
      productName: "Premium Coffee Maker",
      customerName: "David Martinez",
      date: "2025-03-10",
      rating: 1,
      content:
        "Arrived damaged and stopped working after three uses. Very disappointed with the quality.",
      responded: true,
      response:
        "David, we're very sorry to hear about your experience. We've sent you a replacement unit and would like to offer a partial refund for the inconvenience.",
    },
  ];

  // Calculate review stats
  const averageRating =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const fiveStarCount = reviews.filter((review) => review.rating === 5).length;
  const fiveStarPercentage = (fiveStarCount / reviews.length) * 100;
  const unrepliedCount = reviews.filter((review) => !review.responded).length;

  const filterReviews = () => {
    return reviews
      .filter((review) => {
        const matchesSearch =
          review.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          review.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          review.content.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRating =
          filterRating === "all" ||
          (filterRating === "5star" && review.rating === 5) ||
          (filterRating === "4star" && review.rating === 4) ||
          (filterRating === "3star" && review.rating === 3) ||
          (filterRating === "2star" && review.rating === 2) ||
          (filterRating === "1star" && review.rating === 1) ||
          (filterRating === "negative" && review.rating <= 3);

        const matchesResponded =
          filterResponded === "all" ||
          (filterResponded === "responded" && review.responded) ||
          (filterResponded === "unreplied" && !review.responded);

        return matchesSearch && matchesRating && matchesResponded;
      })
      .sort((a, b) => {
        if (sortBy === "date") {
          return new Date(b.date) - new Date(a.date);
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

  return (
    <div className={styles.reviewsSection}>
      <div className={styles.sectionHeader}>
        <h2 style={{ marginBottom: "2rem" }}>Reviews & Ratings</h2>
      </div>

      <div className={styles.reviewsSummary}>
        <div className={styles.summaryCard}>
          <h3>Average Rating</h3>
          <div className={styles.ratingDisplay}>
            <span className={styles.ratingNumber}>
              {averageRating.toFixed(1)}
            </span>
            <div className={styles.starsContainer}>
              {renderStars(Math.round(averageRating))}
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
          <p className={styles.summaryValue}>{reviews.length}</p>
        </div>
        <div className={styles.summaryCard}>
          <h3>Awaiting Response</h3>
          <p className={styles.summaryValue}>{unrepliedCount}</p>
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
            value={filterResponded}
            onChange={(e) => setFilterResponded(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Reviews</option>
            <option value="responded">Responded</option>
            <option value="unreplied">Awaiting Response</option>
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
        {filterReviews().map((review) => (
          <div className={styles.reviewCard} key={review.id}>
            <div className={styles.reviewHeader}>
              <div className={styles.reviewInfo}>
                <h3>{review.productName}</h3>
                <div className={styles.starsContainer}>
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className={styles.reviewMeta}>
                <p className={styles.customerName}>{review.customerName}</p>
                <p className={styles.reviewDate}>
                  {new Date(review.date).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div
              className={`${styles.reviewContent} ${
                expandedReview === review.id ? styles.expanded : ""
              }`}
              onClick={() => toggleExpandReview(review.id)}
            >
              <p>{review.content}</p>
            </div>

            {review.responded && (
              <div className={styles.responseContainer}>
                <div className={styles.responseHeader}>
                  <FaReply /> <span>Your Response</span>
                </div>
                <p className={styles.responseContent}>{review.response}</p>
              </div>
            )}

            <div className={styles.reviewActions}>
              {!review.responded ? (
                <button className={styles.replyButton}>
                  <FaReply /> Reply to Review
                </button>
              ) : (
                <button className={styles.editReplyButton}>
                  Edit Response
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Reviews;
