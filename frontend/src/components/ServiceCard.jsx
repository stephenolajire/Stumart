import React from "react";
import { FaStar, FaMapMarkerAlt } from "react-icons/fa";
import { Link } from "react-router-dom";
import { MEDIA_BASE_URL } from "../constant/api";
import { User, MapPin, Star, Calendar, ArrowRight } from "lucide-react";

const ServiceCard = ({ service }) => {
  // Find the category label from the service type
  const getCategoryLabel = (categoryValue) => {
    const categories = [
      { value: "laundry", label: "Laundry Services" },
      { value: "note_writing", label: "Note Writing" },
      { value: "assignment_help", label: "Assignment Help" },
      { value: "barbing", label: "Barbing Services" },
      { value: "hair_styling", label: "Hair Styling" },
      { value: "printing", label: "Printing Services" },
      { value: "computer_repairs", label: "Computer Repairs" },
      { value: "phone_repairs", label: "Phone Repairs" },
      { value: "tutoring", label: "Tutoring" },
      { value: "photography", label: "Photography" },
      { value: "graphic_design", label: "Graphic Design" },
      { value: "tailoring", label: "Tailoring" },
      { value: "cleaning", label: "Cleaning Services" },
      { value: "event_planning", label: "Event Planning" },
    ];

    const category = categories.find((cat) => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  return (
    <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] border border-gray-100">
      {/* Service Image Container */}
      <div className="relative h-48 overflow-hidden">
        <img
          src={
            service.shop_image
              ? `${MEDIA_BASE_URL}${service.shop_image}`
              : "/default-service.jpg"
          }
          alt={service.business_name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          onError={(e) => {
            e.target.src = "/default-service.jpg";
          }}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500 text-white shadow-lg">
            {getCategoryLabel(service.specific_category)}
          </span>
        </div>

        {/* Rating Badge */}
        {service.rating > 0 && (
          <div className="absolute top-4 right-4">
            <div className="flex items-center bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 shadow-lg">
              <Star className="w-3 h-3 text-yellow-500 fill-current mr-1" />
              <span className="text-xs font-semibold text-gray-800">
                {service.rating.toFixed(1)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Service Details */}
      <div className="p-6">
        {/* Service Name */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-yellow-600 transition-colors duration-200">
          {service.business_name}
        </h3>

        {/* Provider Name */}
        <div className="flex items-center mb-3">
          <User className="w-4 h-4 text-gray-400 mr-2" />
          <p className="text-sm text-gray-600 font-medium">
            By {service.user.first_name} {service.user.last_name}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center mb-3">
          <MapPin className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-sm text-gray-600 truncate">
            {service.user.institution}
          </span>
        </div>

        {/* Rating Section */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
            <span className="text-sm font-semibold text-gray-800">
              {service.rating > 0 ? service.rating.toFixed(1) : "New"}
            </span>
            {service.total_ratings > 0 && (
              <span className="text-xs text-gray-500 ml-1">
                ({service.total_ratings} reviews)
              </span>
            )}
          </div>

          {/* Status indicator */}
          <div className="flex items-center">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            <span className="text-xs text-gray-500">Available</span>
          </div>
        </div>

        {/* Apply Button */}
        <Link
          to={`/service-application/${service.id}`}
          className="group/btn w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          <Calendar className="w-4 h-4" />
          <span>Apply for Service</span>
          <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover/btn:translate-x-1" />
        </Link>
      </div>

      {/* Hover Effect Border */}
      <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-yellow-200 transition-colors duration-300 pointer-events-none"></div>
    </div>
  );
};

export default ServiceCard;
