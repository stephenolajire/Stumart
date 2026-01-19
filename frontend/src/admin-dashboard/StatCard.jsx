import React from "react";

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="group bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-gray-300 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
          <div className="text-gray-700">{icon}</div>
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">
          {value || value === 0 ? value : "N/A"}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
