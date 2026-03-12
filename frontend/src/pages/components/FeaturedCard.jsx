import React, { useState } from "react";
import { Star, Heart, X, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MEDIA_BASE_URL } from "../../constant/api";
import { useVendorBookmarkToggle } from "../../hooks/useVendorBookmark";

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
            Save this vendor
          </h3>
          <p className="text-gray-400 text-sm">
            Sign in to bookmark vendors and access them anytime.
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
            <LogIn className="w-4 h-4" />
            Sign In
          </button>
          <button
            onClick={() => {
              onClose();
              navigate("/register");
            }}
            className="w-full flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Create Account
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

const VendorBookmarkButton = ({ vendorId, onGuestClick }) => {
  const { isBookmarked, isLoggedIn, toggle, isToggling } =
    useVendorBookmarkToggle(vendorId);

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
      className="absolute top-2 left-2 z-20 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-300 shadow-lg disabled:opacity-60"
      aria-label={isBookmarked ? "Remove vendor bookmark" : "Save vendor"}
    >
      <Heart
        className={`w-4 h-4 transition-all duration-300 ${
          isBookmarked
            ? "fill-yellow-500 text-yellow-500 scale-110"
            : "text-yellow-500"
        }`}
      />
    </button>
  );
};

const FeaturedCard = ({ shop }) => {
  const navigate = useNavigate();
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const displayRating = parseFloat(shop.rating) || 3.0;

  return (
    <>
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}

      <div
        onClick={() => navigate(`/shop/${shop.id}`)}
        className="cursor-pointer group shrink-0 w-48 sm:w-auto"
      >
        <div className="bg-surface border-2 border-border rounded-xl overflow-hidden transition-all duration-200 hover:border-primary hover:shadow-lg hover:-translate-y-1 h-full">
          {/* Shop Image */}
          <div className="relative h-35 overflow-hidden bg-surface-tertiary">
            <img
              src={
                shop.shop_image
                  ? `${MEDIA_BASE_URL}${shop.shop_image}`
                  : "/placeholder-shop.jpg"
              }
              alt={shop.business_name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={(e) => {
                e.target.src = "/placeholder-shop.jpg";
              }}
            />
            <VendorBookmarkButton
              vendorId={shop.id}
              onGuestClick={() => setShowLoginPrompt(true)}
            />
          </div>

          {/* Shop Info */}
          <div className="p-3">
            <h3 className="text-base font-bold text-text-primary mb-2 line-clamp-1 group-hover:text-primary transition-colors">
              {shop.business_name}
            </h3>

            <p className="text-[13px] text-text-secondary line-clamp-1 mb-2">
              {shop.institution || "University"}
            </p>

            <div className="flex items-center gap-1 mt-1">
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={
                      i < Math.floor(displayRating)
                        ? "fill-primary text-primary"
                        : "fill-border text-border"
                    }
                  />
                ))}
              </div>
              <span className="text-xs font-semibold text-text-primary">
                {displayRating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FeaturedCard;
