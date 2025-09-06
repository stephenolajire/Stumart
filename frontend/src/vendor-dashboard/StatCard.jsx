import React from "react";

const StatCard = ({ title, value, icon, color }) => {
  // Define color mappings for consistent styling
  const colorClasses = {
    yellow: {
      bg: "bg-yellow-50",
      iconBg: "bg-yellow-100",
      iconText: "text-yellow-600",
      border: "border-yellow-200",
    },
    blue: {
      bg: "bg-blue-50",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
      border: "border-blue-200",
    },
    orange: {
      bg: "bg-orange-50",
      iconBg: "bg-orange-100",
      iconText: "text-orange-600",
      border: "border-orange-200",
    },
    green: {
      bg: "bg-green-50",
      iconBg: "bg-green-100",
      iconText: "text-green-600",
      border: "border-green-200",
    },
    purple: {
      bg: "bg-purple-50",
      iconBg: "bg-purple-100",
      iconText: "text-purple-600",
      border: "border-purple-200",
    },
    cyan: {
      bg: "bg-cyan-50",
      iconBg: "bg-cyan-100",
      iconText: "text-cyan-600",
      border: "border-cyan-200",
    },
  };

  // Default to yellow if color not found
  const colorClass = colorClasses[color] || colorClasses.yellow;

  return (
    <div
      className={`bg-white rounded-lg shadow-lg p-6 border ${colorClass.border} hover:shadow-xl transition-shadow duration-300`}
    >
      <div className="flex items-center space-x-4">
        <div
          className={`w-12 h-12 rounded-full ${colorClass.iconBg} flex items-center justify-center`}
        >
          <span className={`text-xl ${colorClass.iconText}`}>{icon}</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
