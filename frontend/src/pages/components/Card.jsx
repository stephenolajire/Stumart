import React, { useState } from "react";
import { Heart, X, LogIn, UserPlus } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useBookmarkToggle } from "../../hooks/useBookmark";

const LoginPromptModal = ({ onClose }) => {
  const navigate = useNavigate();
  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden">
        <div className="relative bg-linear-to-br from-gray-900 to-gray-800 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="w-14 h-14 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Heart className="w-7 h-7 text-yellow-400 fill-yellow-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">
            Save this product
          </h3>
          <p className="text-gray-400 text-sm">
            Sign in to bookmark products and access them anytime.
          </p>
        </div>
        <div className="p-5 space-y-3">
          <button
            onClick={() => {
              onClose();
              navigate("/login");
            }}
            className="w-full flex items-center justify-center gap-2 bg-yellow-500 hover:bg-yellow-600 text-gray-900 font-semibold py-3 rounded-xl transition-colors"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </button>
          <button
            onClick={() => {
              onClose();
              navigate("/register");
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Create Account
          </button>
          <button
            onClick={onClose}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-1 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
};

const BookmarkButton = ({ productId, onGuestClick }) => {
  const { isBookmarked, isLoggedIn, toggle, isToggling } =
    useBookmarkToggle(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoggedIn) {
      onGuestClick();
      return;
    }
    toggle();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isToggling}
      className="absolute top-3 right-3 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg disabled:opacity-60"
      aria-label={isBookmarked ? "Remove bookmark" : "Save product"}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-300 ${isBookmarked ? "fill-yellow-500 text-yellow-500 scale-110" : "text-yellow-500"}`}
      />
    </button>
  );
};

const Card = ({ products }) => {
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price || 0);

  const calculateDiscount = (price, promoPrice) => {
    if (!promoPrice || promoPrice <= 0 || promoPrice >= price) return null;
    return Math.round(((price - promoPrice) / price) * 100);
  };

  return (
    <>
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.map((product) => {
          const price = parseFloat(product.price);
          const promoPrice = parseFloat(product.promotion_price);
          const discount = calculateDiscount(price, promoPrice);
          const isFashion = product.vendor_category === "fashion";

          return (
            <div
              key={product.id}
              className="group relative lg:rounded-lg bg-white shadow-md hover:shadow-xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-yellow-200"
            >
              {/* Discount Badge */}
              {discount && (
                <div className="absolute top-3 left-3 z-20">
                  <div className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                    {discount}% OFF
                  </div>
                </div>
              )}

              {/* Bookmark */}
              <BookmarkButton
                productId={product.id}
                onGuestClick={() => setShowLoginPrompt(true)}
              />

              <Link to={`/product/${product.id}`} className="block">
                <div className="relative overflow-hidden bg-gray-50">
                  <img
                    loading="lazy"
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-30 lg:h-40 object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => {
                      e.target.src = "/placeholder-shop.jpg";
                    }}
                  />
                </div>

                <div className="p-3 md:p-4 space-y-1 md:space-y-3">
                  <h3 className="font-medium lg:font-semibold text-gray-900 text-xs lg:text-sm line-clamp-2 group-hover:text-yellow-600 transition-colors duration-300 sm:capitalize lg:uppercase">
                    {product.name}
                  </h3>

                  <p className="text-xs text-gray-600 line-clamp-1">
                    {product.vendor_institution}
                  </p>

                  {/* Price */}
                  <div className="space-y-1">
                    {discount ? (
                      <div className="space-y-1">
                        <span className="text-base lg:text-lg font-bold text-yellow-500">
                          {formatPrice(promoPrice)}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-gray-400 line-through">
                            {formatPrice(price)}
                          </span>
                          <span className="text-xs text-green-600 font-medium">
                            -{discount}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-base lg:text-lg font-bold text-gray-900">
                        {formatPrice(price)}
                      </span>
                    )}
                  </div>

                  {/* Stock */}
                  {isFashion ? (
                    <span
                      className={`text-xs font-medium ${product.in_stock > 0 ? "text-green-600" : "text-red-500"}`}
                    >
                      {product.in_stock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  ) : (
                    <span className="text-green-600 font-medium text-xs">
                      Available
                    </span>
                  )}
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Card;
