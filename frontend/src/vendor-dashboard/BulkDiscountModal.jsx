import React, { useState } from "react";

const BulkDiscountModal = ({ isOpen, onClose, onApplyDiscount }) => {
  const [discountType, setDiscountType] = useState("percentage");
  const [discountValue, setDiscountValue] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!discountValue || isNaN(discountValue) || discountValue <= 0) {
      setError("Please enter a valid discount value");
      return;
    }

    if (discountType === "percentage" && discountValue > 100) {
      setError("Percentage discount cannot exceed 100%");
      return;
    }

    try {
      await onApplyDiscount({
        type: discountType,
        value: parseFloat(discountValue),
      });
      onClose();
    } catch (error) {
      setError(error.message || "Failed to apply discount");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto">
        {/* Modal Header */}
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            Apply Bulk Discount
          </h2>
          <p className="text-gray-600 mt-2">
            This will apply the discount to all your products
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Discount Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Discount Type
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="percentage"
                  checked={discountType === "percentage"}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-4 h-4 text-yellow-500 bg-gray-100 border-gray-300 focus:ring-yellow-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700">Percentage (%)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="fixed"
                  checked={discountType === "fixed"}
                  onChange={(e) => setDiscountType(e.target.value)}
                  className="w-4 h-4 text-yellow-500 bg-gray-100 border-gray-300 focus:ring-yellow-500 focus:ring-2"
                />
                <span className="ml-3 text-gray-700">Fixed Amount (₦)</span>
              </label>
            </div>
          </div>

          {/* Discount Value Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {discountType === "percentage"
                ? "Discount Percentage"
                : "Discount Amount"}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              min="0"
              max={discountType === "percentage" ? "100" : undefined}
              step="0.01"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              placeholder={
                discountType === "percentage"
                  ? "Enter percentage"
                  : "Enter amount"
              }
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
              Apply Discount
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkDiscountModal;
