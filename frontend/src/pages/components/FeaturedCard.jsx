import React from "react";
import { MapPin, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { MEDIA_BASE_URL } from "../../constant/api";

const FeaturedCard = ({ shop }) => {
  const navigate = useNavigate();

  const getDisplayRating = (rating) => {
    const numRating = parseFloat(rating);
    return numRating === 0 ? 3.0 : numRating;
  };

  const handleClick = () => {
    navigate(`/shop/${shop.id}`);
  };

  return (
    <div
      onClick={handleClick}
      className="cursor-pointer group shrink-0 w-50 sm:w-auto"
    >
      {/* Shop Card */}
      <div
        className="bg-surface border-2 border-border rounded-xl overflow-hidden 
                    transition-all duration-200 hover:border-primary hover:shadow-lg 
                    hover:-translate-y-1 h-full"
      >
        {/* Shop Image */}
        <div className="relative h-35 overflow-hidden bg-surface-tertiary">
          <img
            src={shop.shop_image ? `${MEDIA_BASE_URL}${shop.shop_image}` : "/placeholder-shop.jpg"}
            alt={shop.business_name}
            className="w-full h-full object-cover transition-transform duration-500 
                     group-hover:scale-110"
            onError={(e) => {
              e.target.src = "/placeholder-shop.jpg";
            }}
          />

          {/* Verified Badge */}
          {shop.is_verified && (
            <div
              className="absolute top-2 right-2 bg-primary text-text-inverse 
                          px-2 py-0.5 rounded-full text-[10px] font-bold 
                          flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              ✓
            </div>
          )}
        </div>

        {/* Shop Info */}
        <div className="p-3">
          {/* Shop Name */}
          <h3
            className="text-base font-bold text-text-primary mb-2 line-clamp-1 
                       group-hover:text-primary transition-colors"
          >
            {shop.business_name}
          </h3>

          {/* School */}
          <div className="flex items-start gap-1 mb-2">
            {/* <MapPin size={12} className="text-primary mt-0.5 shrink-0" /> */}
            <p className="text-[13px] text-text-secondary line-clamp-2 leading-tight">
              {shop.user?.institution || "University"}
            </p>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-1 mt-1">
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={`${
                    i < Math.floor(getDisplayRating(shop.rating))
                      ? "fill-primary text-primary"
                      : "fill-border text-border"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-text-primary">
              {getDisplayRating(shop.rating).toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeaturedCard;
