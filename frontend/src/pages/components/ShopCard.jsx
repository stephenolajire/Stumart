import React, { memo } from "react";
import { FaStar, FaMapMarkerAlt, FaClock, FaShoppingCart } from "react-icons/fa";
import { Link } from "react-router-dom";
import { MEDIA_BASE_URL } from "../../constant/api";

const ShopCard = memo(({ shop }) => (
  <div className="group bg-white rounded-xl overflow-hidden border border-gray-200 hover:border-yellow-500 transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 hover:-translate-y-1">
    <Link to={`/shop/${shop.id}`} className="block">
      {/* Shop Image */}
      <div className="relative h-48 overflow-hidden bg-gray-100">
        <img
          src={`${MEDIA_BASE_URL}${shop.shop_image}`}
          alt={shop.business_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Shop Details */}
      <div className="p-5 space-y-3">
        <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-yellow-500 transition-colors">
          {shop.business_name}
        </h3>

        {/* Meta Information */}
        <div className="flex items-center justify-between text-sm">
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
            {shop.business_category}
          </span>
          <div className="flex items-center gap-1 text-yellow-500">
            <FaStar className="text-xs" />
            <span className="font-semibold">{shop.rating}</span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-gray-600 text-sm">
          <FaMapMarkerAlt className="text-yellow-500 flex-4shrink-0" />
          <span className="truncate">{shop.user.institution}</span>
        </div>

        {/* Delivery Time */}
        {/* <div className="flex items-center gap-2 text-gray-600 text-sm">
          <FaClock className="text-yellow-500 shrink-0" />
          <span>15-30 mins</span>
        </div> */}

        {/* Shop Now Button */}
        {/* <button className="w-full mt-4 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors duration-300 flex items-center justify-center gap-2">
          <FaShoppingCart />
          <span>Shop Now</span>
        </button> */}
      </div>
    </Link>
  </div>
));

export default ShopCard;
