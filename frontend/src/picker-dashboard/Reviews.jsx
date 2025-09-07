import React, { useState, useEffect } from "react";
import {
  Search,
  Star,
  Filter,
  Loader2,
  TrendingUp,
  MessageCircle,
  Users,
  BarChart3,
  Calendar,
  User,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
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
        const response = await api.get("picker/reviews/");
        console.log("Response data:", response.data);

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
        <Star
          key={index}
          className={`w-4 h-4 ${
            index < rating ? "text-yellow-500 fill-current" : "text-gray-300"
          }`}
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-medium">
            Loading reviews...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Error Loading Reviews
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Reviews and Ratings
              </h1>
              <p className="text-gray-600 mt-1">
                See what customers are saying about your delivery service
              </p>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Average Rating */}
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <Star className="w-8 h-8 mr-3 fill-current" />
              <div>
                <h3 className="text-lg font-semibold">Average Rating</h3>
                <p className="text-yellow-100 text-sm">
                  Overall customer satisfaction
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-3xl font-bold mr-3">
                {stats.average_rating.toFixed(1)}
              </span>
              <div className="flex">
                {renderStars(Math.round(stats.average_rating))}
              </div>
            </div>
          </div>

          {/* 5-Star Reviews */}
          <div className="bg-green-50 rounded-2xl p-6 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  5-Star Reviews
                </h3>
                <p className="text-2xl font-bold text-green-600">
                  {fiveStarPercentage.toFixed(0)}%
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Total Reviews */}
          <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">
                  Total Reviews
                </h3>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.total_reviews}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center mb-4">
              <BarChart3 className="w-5 h-5 text-gray-600 mr-2" />
              <h3 className="font-semibold text-gray-900">Rating Breakdown</h3>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div
                  key={rating}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center">
                    <span className="w-4 text-gray-600">{rating}</span>
                    <Star className="w-3 h-3 text-yellow-500 fill-current ml-1" />
                  </div>
                  <span className="font-medium text-gray-900">
                    {stats.rating_breakdown[rating] || 0}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center">
                <Filter className="w-5 h-5 text-gray-400 mr-3" />
                <select
                  value={filterRating}
                  onChange={(e) => setFilterRating(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                >
                  <option value="all">All Ratings</option>
                  <option value="5star">5 Star</option>
                  <option value="4star">4 Star</option>
                  <option value="3star">3 Star</option>
                  <option value="2star">2 Star</option>
                  <option value="1star">1 Star</option>
                  <option value="negative">Negative Reviews</option>
                </select>
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              >
                <option value="date">Most Recent</option>
                <option value="rating-high">Highest Rating</option>
                <option value="rating-low">Lowest Rating</option>
              </select>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="search"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors w-full sm:w-80"
              />
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-6">
          {filterReviews().length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No Reviews Found
              </h3>
              <p className="text-gray-600">
                No reviews found matching your criteria. Try adjusting your
                filters.
              </p>
            </div>
          ) : (
            filterReviews().map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mr-4">
                        <User className="w-6 h-6 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {getCustomerName(review.reviewer_name)}
                        </p>
                        <div className="flex items-center mt-1">
                          <Calendar className="w-4 h-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-500">
                            {formatDate(review.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                      <span className="ml-2 text-sm font-medium text-gray-600">
                        {review.rating}/5
                      </span>
                    </div>
                  </div>

                  <div
                    className={`cursor-pointer transition-all duration-200 ${
                      expandedReview === review.id
                        ? "text-gray-900"
                        : "text-gray-700 hover:text-gray-900"
                    }`}
                    onClick={() => toggleExpandReview(review.id)}
                  >
                    <p
                      className={`leading-relaxed ${
                        expandedReview === review.id ? "" : "line-clamp-3"
                      }`}
                    >
                      {review.comment || "No comment provided"}
                    </p>
                    {review.comment && review.comment.length > 150 && (
                      <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium mt-2">
                        {expandedReview === review.id
                          ? "Show less"
                          : "Read more"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Reviews;
