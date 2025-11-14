import React from "react";

const StatCard = ({ title, value, icon, color = "yellow" }) => {
  // Define color variants with softer, more professional colors
  const colorVariants = {
    yellow: {
      bg: "bg-gradient-to-br from-yellow-50 to-yellow-100",
      icon: "bg-yellow-500",
      iconHover: "group-hover:bg-yellow-600",
      text: "text-yellow-700",
      border: "border-yellow-200",
      shadow: "shadow-yellow-100",
    },
    blue: {
      bg: "bg-gradient-to-br from-blue-50 to-blue-100",
      icon: "bg-blue-500",
      iconHover: "group-hover:bg-blue-600",
      text: "text-blue-700",
      border: "border-blue-200",
      shadow: "shadow-blue-100",
    },
    green: {
      bg: "bg-gradient-to-br from-green-50 to-green-100",
      icon: "bg-green-500",
      iconHover: "group-hover:bg-green-600",
      text: "text-green-700",
      border: "border-green-200",
      shadow: "shadow-green-100",
    },
    red: {
      bg: "bg-gradient-to-br from-red-50 to-red-100",
      icon: "bg-red-500",
      iconHover: "group-hover:bg-red-600",
      text: "text-red-700",
      border: "border-red-200",
      shadow: "shadow-red-100",
    },
    purple: {
      bg: "bg-gradient-to-br from-purple-50 to-purple-100",
      icon: "bg-purple-500",
      iconHover: "group-hover:bg-purple-600",
      text: "text-purple-700",
      border: "border-purple-200",
      shadow: "shadow-purple-100",
    },
    orange: {
      bg: "bg-gradient-to-br from-orange-50 to-orange-100",
      icon: "bg-orange-500",
      iconHover: "group-hover:bg-orange-600",
      text: "text-orange-700",
      border: "border-orange-200",
      shadow: "shadow-orange-100",
    },
    cyan: {
      bg: "bg-gradient-to-br from-cyan-50 to-cyan-100",
      icon: "bg-cyan-500",
      iconHover: "group-hover:bg-cyan-600",
      text: "text-cyan-700",
      border: "border-cyan-200",
      shadow: "shadow-cyan-100",
    },
    indigo: {
      bg: "bg-gradient-to-br from-indigo-50 to-indigo-100",
      icon: "bg-indigo-500",
      iconHover: "group-hover:bg-indigo-600",
      text: "text-indigo-700",
      border: "border-indigo-200",
      shadow: "shadow-indigo-100",
    },
    pink: {
      bg: "bg-gradient-to-br from-pink-50 to-pink-100",
      icon: "bg-pink-500",
      iconHover: "group-hover:bg-pink-600",
      text: "text-pink-700",
      border: "border-pink-200",
      shadow: "shadow-pink-100",
    },
    teal: {
      bg: "bg-gradient-to-br from-teal-50 to-teal-100",
      icon: "bg-teal-500",
      iconHover: "group-hover:bg-teal-600",
      text: "text-teal-700",
      border: "border-teal-200",
      shadow: "shadow-teal-100",
    },
    gray: {
      bg: "bg-gradient-to-br from-gray-50 to-gray-100",
      icon: "bg-gray-500",
      iconHover: "group-hover:bg-gray-600",
      text: "text-gray-700",
      border: "border-gray-200",
      shadow: "shadow-gray-100",
    },
  };

  // Get color scheme or default to yellow
  const scheme = colorVariants[color] || colorVariants.yellow;

  return (
    <div
      className={`group relative overflow-hidden ${scheme.bg} ${scheme.border} border rounded-xl shadow-md hover:shadow-xl transition-all duration-300 ease-in-out`}
    >
      {/* Decorative background element */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white opacity-10"></div>

      <div className="relative p-6">
        <div className="flex items-start justify-between">
          {/* Icon Container */}
          <div
            className={`p-3 rounded-lg ${scheme.icon} ${scheme.iconHover} shadow-lg transition-all duration-300 transform group-hover:scale-110`}
          >
            <div className="text-white text-xl">{icon}</div>
          </div>
        </div>

        {/* Card Content */}
        <div className="mt-4 space-y-1">
          <h4 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </h4>
          <p className={`text-3xl font-bold ${scheme.text} tracking-tight`}>
            {value || value === 0 ? value : "N/A"}
          </p>
        </div>
      </div>

      {/* Bottom accent line */}
      <div
        className={`h-1 ${scheme.icon} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 ease-out origin-left`}
      ></div>
    </div>
  );
};

export default StatCard;
