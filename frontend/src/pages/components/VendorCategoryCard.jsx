import React from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Star, Phone, Mail, ShieldCheck } from "lucide-react";
import { MEDIA_BASE_URL } from "../../constant/api";


const VendorCategoryCard = ({ vendor }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/shop/${vendor.id}`);
  };

  const getDisplayRating = (rating) => {
    const numRating = parseFloat(rating);
    return numRating === 0 ? 3.0 : numRating;
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer bg-surface border-2 border-border rounded-xl 
                 overflow-hidden transition-all duration-300 hover:border-primary 
                 hover:shadow-xl hover:-translate-y-1"
    >
      {/* Vendor Image */}
      <div className="relative h-48 overflow-hidden bg-background-tertiary">
        <img
          src={
            `${MEDIA_BASE_URL}${vendor.shop_image}`
          }
          alt={vendor.business_name}
          className="w-full h-full object-cover transition-transform duration-500 
                   group-hover:scale-110"
          onError={(e) => {
            e.target.src = "/placeholder-shop.jpg";
          }}
        />

        {/* Verified Badge */}
        {vendor.is_verified && (
          <div
            className="absolute top-3 right-3 bg-primary text-text-inverse 
                        px-3 py-1 rounded-full text-xs font-bold 
                        flex items-center gap-1 shadow-lg"
          >
            <ShieldCheck size={14} />
            Verified
          </div>
        )}

        {/* Rating Badge */}
        <div
          className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm 
                        px-3 py-1 rounded-full flex items-center gap-1 shadow-lg"
        >
          <Star size={14} className="fill-primary text-primary" />
          <span className="text-sm font-bold text-text-primary">
            {getDisplayRating(vendor.rating).toFixed(1)}
          </span>
          <span className="text-xs text-text-secondary">
            ({vendor.total_ratings || 0})
          </span>
        </div>
      </div>

      {/* Vendor Info */}
      <div className="p-4">
        {/* Business Name */}
        <h3
          className="text-lg font-bold text-text-primary mb-2 line-clamp-1 
                       group-hover:text-primary transition-colors"
        >
          {vendor.business_name}
        </h3>

        {/* Description */}
        {/* {vendor.business_description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3 leading-relaxed">
            {vendor.business_description}
          </p>
        )} */}

        {/* School Location */}
        <div className="flex items-start gap-2 mb-3">
          {/* <MapPin size={16} className="text-primary mt-0.5 shrink-0" /> */}
          <p className="text-sm text-text-secondary line-clamp-2 leading-tight">
            {vendor.user?.institution || "University"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VendorCategoryCard;
