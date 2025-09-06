import React from "react";

const RevenueChart = ({ data }) => {
  // Find max value for scaling bars
  const maxValue = data.length > 0 ? Math.max(...data.map((d) => d.value)) : 1;

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-6">
        Revenue Trend
      </h3>

      {/* Chart Container */}
      <div className="h-64 flex items-end justify-center space-x-2 mb-4 bg-gray-50 rounded-lg p-4">
        {data.length > 0 ? (
          data.map((item, index) => (
            <div
              key={index}
              className="flex flex-col items-center flex-1 max-w-16"
            >
              {/* Bar */}
              <div className="relative flex items-end justify-center w-full">
                <div
                  className="bg-yellow-500 rounded-t-md w-full transition-all duration-500 ease-in-out hover:bg-yellow-600 cursor-pointer shadow-sm"
                  style={{
                    height: `${(item.value / maxValue) * 200}px`,
                    minHeight: "8px",
                  }}
                >
                  {/* Value tooltip on hover */}
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    ₦{item.value.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex items-center justify-center w-full h-full text-gray-400">
            <p>No data available</p>
          </div>
        )}
      </div>

      {/* Chart Labels */}
      <div className="flex justify-center space-x-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 max-w-16 text-center">
            <span className="text-sm text-gray-600 font-medium">
              {item.month}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RevenueChart;
