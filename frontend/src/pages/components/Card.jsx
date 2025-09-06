import React, { useState } from "react";
import { Heart, Star, ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";

const Card = ({ products }) => {
  // console.log("products:", products);

  // Calculate discount percentage
  const calculateDiscount = (originalPrice, promotionPrice) => {
    if (
      !promotionPrice ||
      promotionPrice <= 0 ||
      promotionPrice >= originalPrice
    ) {
      return null;
    }
    const discount = ((originalPrice - promotionPrice) / originalPrice) * 100;
    return Math.round(discount);
  };

  // Format price to Nigerian Naira
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
      {products.map((product) => {
        const discountPercentage = calculateDiscount(
          parseFloat(product.price),
          parseFloat(product.promotion_price)
        );

        return (
          <div
            key={product.id}
            className="group relative bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-amber-200"
          >
            {/* Discount Badge */}
            {discountPercentage && (
              <div className="absolute top-3 left-3 z-20">
                <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                  {discountPercentage}% OFF
                </div>
              </div>
            )}

            {/* Stock Status Badge */}
            {product.vendor_category !== "fashion" &&
              product.in_stock === 0 && (
                <div className="absolute top-3 left-3 z-20">
                  <div className="bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    Available
                  </div>
                </div>
              )}

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg"
            >
              <Heart
                className="w-4 h-4 transition-colors duration-300 text-amber-500"
              />
            </button>

            {/* Product Link Container */}
            <Link to={`/product/${product.id}`} className="block">
              {/* Product Image */}
              <div className="relative overflow-hidden bg-gray-50 aspect-square">
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>

              {/* Product Info */}
              <div className="p-3 md:p-4 space-y-2 md:space-y-3">
                {/* Product Name */}
                <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-amber-600 transition-colors duration-300 uppercase">
                  {product.name}
                </h3>

                {/* Pricing */}
                <div className="space-y-1">
                  {product.promotion_price &&
                  parseFloat(product.promotion_price) > 0 &&
                  parseFloat(product.promotion_price) <
                    parseFloat(product.price) ? (
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg font-bold text-amber-600">
                          {formatPrice(parseFloat(product.promotion_price))}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 line-through">
                          {formatPrice(parseFloat(product.price))}
                        </span>
                        <span className="text-xs text-green-600 font-medium">
                          Save {discountPercentage}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(parseFloat(product.price))}
                      </span>
                    </div>
                  )}
                </div>

                {/* Stock Info */}
                {product.vendor_category == "fashion" ? (
                  <div className="text-xs">
                    {product.in_stock > 0 ? (
                      <span className="text-green-600 font-medium">
                        In Stock
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">
                        Out of stock
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-green-600 font-medium">Available</span>
                )}
              </div>
            </Link>
          </div>
        );
      })}
    </div>
  );
};

export default Card;
