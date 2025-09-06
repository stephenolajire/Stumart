import React, { useState } from "react";
import { FaStar } from "react-icons/fa";
import { Star, X, MessageCircle, User, Truck, Send } from "lucide-react";

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

  const StarRating = ({ rating, onRatingClick, type }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingClick(type, star)}
          className="transition-transform duration-150 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-yellow-400 rounded"
        >
          <FaStar
            className={`w-8 h-8 transition-colors duration-200 ${
              star <= rating
                ? "text-yellow-500"
                : "text-gray-300 hover:text-yellow-400"
            }`}
          />
        </button>
      ))}
      <span className="ml-2 text-sm text-gray-600">
        {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Not rated"}
      </span>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-8 py-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Review Your Order
                </h2>
                <p className="text-yellow-100">Order #{order.order_number}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-colors duration-200"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          {/* Vendor Review Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Rate the Vendor
                </h3>
                <p className="text-sm text-gray-600">
                  How was your experience with the seller?
                </p>
              </div>
            </div>

            <div className="mb-4">
              <StarRating
                rating={reviews.vendor.rating}
                onRatingClick={handleRatingClick}
                type="vendor"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your experience with the vendor
              </label>
              <textarea
                placeholder="Tell others about the product quality, vendor communication, and overall experience..."
                value={reviews.vendor.comment}
                onChange={(e) => handleCommentChange("vendor", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Picker Review Section */}
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Rate the Picker
                </h3>
                <p className="text-sm text-gray-600">
                  How was your delivery experience?
                </p>
              </div>
            </div>

            <div className="mb-4">
              <StarRating
                rating={reviews.picker.rating}
                onRatingClick={handleRatingClick}
                type="picker"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Share your delivery experience
              </label>
              <textarea
                placeholder="Tell others about the delivery speed, picker communication, and handling of your order..."
                value={reviews.picker.comment}
                onChange={(e) => handleCommentChange("picker", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              onClick={handleSubmit}
              disabled={!reviews.vendor.rating || !reviews.picker.rating}
              className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] disabled:transform-none disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              <span>Submit Reviews</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-4 px-8 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>

          {/* Helper Text */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Star className="w-5 h-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-semibold text-blue-900 mb-1">
                  Help others make better choices
                </h4>
                <p className="text-sm text-blue-700">
                  Your honest feedback helps improve the marketplace experience
                  for everyone. Both ratings are required to submit your review.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
