import React, { useState, useEffect } from "react";
import { FaSearch, FaStar, FaFilter, FaSpinner } from "react-icons/fa";
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
          className={`${
            index < rating ? "text-yellow-500" : "text-gray-300"
          } text-sm`}
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
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <FaSpinner className="animate-spin text-yellow-500 text-3xl mb-4" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        <div className="flex flex-col items-center justify-center h-64">
          <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg mb-4">
            <p>Error loading reviews: {error}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Business Name Header */}
      {vendorInfo.business_name && (
        <div className="mb-6">
          <p className="text-lg font-medium text-gray-700">
            {vendorInfo.business_name}
          </p>
        </div>
      )}

      {/* Reviews Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Average Rating
          </h3>
          <div className="flex items-center space-x-3">
            <span className="text-3xl font-bold text-gray-900">
              {stats.average_rating.toFixed(1)}
            </span>
            <div className="flex space-x-1">
              {renderStars(Math.round(stats.average_rating))}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            5-Star Reviews
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {fiveStarPercentage.toFixed(0)}%
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Total Reviews
          </h3>
          <p className="text-3xl font-bold text-gray-900">
            {stats.total_reviews}
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-purple-500">
          <h3 className="text-sm font-medium text-gray-600 mb-3">
            Rating Breakdown
          </h3>
          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <div
                key={rating}
                className="flex justify-between items-center text-sm"
              >
                <span className="text-gray-600">{rating}★</span>
                <span className="font-medium text-gray-900">
                  {stats.rating_breakdown[rating] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
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
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="date">Most Recent</option>
              <option value="rating-high">Highest Rating</option>
              <option value="rating-low">Lowest Rating</option>
            </select>
          </div>

          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="search"
              placeholder="Search reviews..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent w-full md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {filterReviews().length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow-md text-center">
            <div className="text-gray-400 mb-4">
              <FaSearch className="mx-auto text-4xl" />
            </div>
            <p className="text-gray-600 text-lg">
              No reviews found matching your criteria.
            </p>
          </div>
        ) : (
          filterReviews().map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                <div className="flex items-start space-x-4 mb-4 md:mb-0">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {getCustomerName(review.reviewer_name)
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="flex space-x-1 mb-2">
                      {renderStars(review.rating)}
                    </div>
                    <p className="font-medium text-gray-900 mb-1">
                      {getCustomerName(review.reviewer_name)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    {review.rating} Star{review.rating !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              <div
                className={`text-gray-700 leading-relaxed cursor-pointer transition-all duration-200 ${
                  expandedReview === review.id
                    ? ""
                    : "line-clamp-3 hover:text-gray-900"
                }`}
                onClick={() => toggleExpandReview(review.id)}
              >
                <p>{review.comment || "No comment provided"}</p>
                {review.comment && review.comment.length > 200 && (
                  <button className="text-yellow-500 hover:text-yellow-600 text-sm mt-2 font-medium">
                    {expandedReview === review.id ? "Show less" : "Read more"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Reviews;
