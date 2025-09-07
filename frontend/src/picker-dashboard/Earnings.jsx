import React, { useState, useEffect } from "react";
import {
  DollarSign,
  Package,
  TrendingUp,
  Calendar,
  BarChart3,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../constant/api";

const Earnings = () => {
  const [earningsData, setEarningsData] = useState({
    total_earnings: 0,
    order_count: 0,
    average_per_order: 0,
    period: "week",
    daily_earnings: [],
  });
  const [period, setPeriod] = useState("week");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchEarningsData = async () => {
      try {
        setIsLoading(true);
        // Replace with your actual API endpoint
        const response = await api.get(`earnings/?period=${period}`);
        setEarningsData(response.data);
      } catch (error) {
        console.error("Error fetching earnings data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEarningsData();
  }, [period]);

  // For demonstration purposes using mock data
  const mockWeekData = {
    total_earnings: 10500,
    order_count: 15,
    average_per_order: 700,
    period: "week",
    daily_earnings: [
      { date: "2025-04-10", amount: 2100 },
      { date: "2025-04-11", amount: 1400 },
      { date: "2025-04-12", amount: 2100 },
      { date: "2025-04-13", amount: 700 },
      { date: "2025-04-14", amount: 1400 },
      { date: "2025-04-15", amount: 2100 },
      { date: "2025-04-16", amount: 700 },
    ],
  };

  const mockMonthData = {
    total_earnings: 42000,
    order_count: 60,
    average_per_order: 700,
    period: "month",
    daily_earnings: [
      // Month data with 30 entries
      // For simplicity, just showing mock week data
      ...mockWeekData.daily_earnings,
    ],
  };

  const mockYearData = {
    total_earnings: 504000,
    order_count: 720,
    average_per_order: 700,
    period: "year",
    daily_earnings: [],
  };

  // Use mock data for now based on selected period
  let displayData;
  if (isLoading) {
    displayData =
      period === "week"
        ? mockWeekData
        : period === "month"
        ? mockMonthData
        : mockYearData;
  } else {
    displayData = earningsData;
  }

  // Format dates for chart display
  const chartData = displayData.daily_earnings.map((item) => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));

  const periodButtons = [
    { key: "week", label: "This Week", icon: Calendar },
    { key: "month", label: "This Month", icon: Calendar },
    { key: "year", label: "This Year", icon: Calendar },
  ];

  const statsCards = [
    {
      title: "Total Earnings",
      value: `₦${displayData.total_earnings.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Completed Orders",
      value: displayData.order_count,
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Average Per Order",
      value: `₦${displayData.average_per_order.toLocaleString()}`,
      icon: TrendingUp,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <DollarSign className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
              <p className="text-gray-600 mt-1">
                Track your delivery earnings and performance
              </p>
            </div>
          </div>

          {/* Period Filters */}
          <div className="flex flex-wrap gap-3">
            {periodButtons.map((btn) => {
              const IconComponent = btn.icon;
              return (
                <button
                  key={btn.key}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    period === btn.key
                      ? "bg-yellow-500 text-white shadow-lg transform scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-yellow-300"
                  }`}
                  onClick={() => setPeriod(btn.key)}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statsCards.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className={`${stat.bgColor} rounded-2xl p-6 border border-gray-100 hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`w-12 h-12 ${stat.color} rounded-full flex items-center justify-center`}
                  >
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Earnings Breakdown
                </h2>
                <p className="text-yellow-100 text-sm">
                  Daily earnings for the selected period
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-yellow-600 animate-spin mb-4" />
                <p className="text-gray-600">Loading earnings data...</p>
              </div>
            ) : period !== "year" && chartData.length > 0 ? (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#f0f0f0"
                    />
                    <XAxis
                      dataKey="formattedDate"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#666" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#666" }}
                      tickFormatter={(value) => `₦${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [`₦${value}`, "Earnings"]}
                      labelFormatter={(label) => `Date: ${label}`}
                      contentStyle={{
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#eab308"
                      fill="#fef3c7"
                      fillOpacity={0.6}
                      strokeWidth={2}
                      activeDot={{
                        r: 6,
                        fill: "#eab308",
                        strokeWidth: 2,
                        stroke: "#fff",
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <AlertCircle className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Chart Data Available
                </h3>
                <p className="text-gray-600 text-center">
                  No detailed earnings data available for this period.
                  {period === "year" &&
                    " Yearly view shows summary statistics only."}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Additional Insights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <TrendingUp className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Performance Insights</h3>
                <p className="text-blue-100 text-sm">
                  Your delivery statistics
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Orders Completed:</span>
                <span className="font-semibold">{displayData.order_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Average per Order:</span>
                <span className="font-semibold">
                  ₦{displayData.average_per_order.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <DollarSign className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Total Earnings</h3>
                <p className="text-green-100 text-sm">
                  Your total income for {period}
                </p>
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">
              ₦{displayData.total_earnings.toLocaleString()}
            </div>
            <p className="text-green-100 text-sm">
              Great work! Keep delivering to increase your earnings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Earnings;
