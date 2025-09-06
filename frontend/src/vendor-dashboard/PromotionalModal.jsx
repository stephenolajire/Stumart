import React, { useState } from "react";

const PromotionModal = ({ isOpen, onClose, product, onUpdatePromotion }) => {
  const [promotionPrice, setPromotionPrice] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!promotionPrice || isNaN(promotionPrice)) {
      setError("Please enter a valid price");
      return;
    }

    if (parseFloat(promotionPrice) >= product.price) {
      setError("Promotion price must be less than original price");
      return;
    }

    try {
      await onUpdatePromotion(product.id, promotionPrice);
      onClose();
    } catch (error) {
      setError(error.message || "Failed to update promotion price");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* Modal Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Add Promotion Price
          </h2>
          <p className="text-gray-600 mt-2">
            Original Price: ₦{product?.price}
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Promotion Price Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Promotion Price (₦)
            </label>
            <input
              type="number"
              value={promotionPrice}
              onChange={(e) => setPromotionPrice(e.target.value)}
              min="0"
              max={product?.price}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder="Enter promotion price"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {/* Button Group */}
          <div className="flex items-center justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors"
            >
              Save Promotion
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromotionModal;
