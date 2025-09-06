import React from "react";

const StatCard = ({ title, value, icon, color }) => {
  // Define color variants with yellow-500 as primary
  const colorVariants = {
    yellow: "bg-yellow-500 text-white",
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    red: "bg-red-500 text-white",
    purple: "bg-purple-500 text-white",
    orange: "bg-orange-500 text-white",
    gray: "bg-gray-500 text-white",
    indigo: "bg-indigo-500 text-white",
    pink: "bg-pink-500 text-white",
    teal: "bg-teal-500 text-white",
    // Light variants
    lightYellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    lightBlue: "bg-blue-100 text-blue-800 border-blue-200",
    lightGreen: "bg-green-100 text-green-800 border-green-200",
    lightRed: "bg-red-100 text-red-800 border-red-200",
    lightPurple: "bg-purple-100 text-purple-800 border-purple-200",
    lightOrange: "bg-orange-100 text-orange-800 border-orange-200",
    lightGray: "bg-gray-100 text-gray-800 border-gray-200",
  };

  // Default to yellow if color is not provided or not found
  const cardColorClass = colorVariants[color] || colorVariants.yellow;

  return (
    <div
      className={`p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border ${cardColorClass}`}
    >
      <div className="flex items-center space-x-4">
        {/* Card Icon */}
        <div className="flex-shrink-0">
          <div className="text-3xl opacity-90">{icon}</div>
        </div>

        {/* Card Content */}
        <div className="flex-1">
          <h4 className="text-sm font-medium opacity-90 mb-1">{title}</h4>
          <p className="text-2xl font-bold">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
