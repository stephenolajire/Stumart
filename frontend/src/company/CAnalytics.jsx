import { useState } from "react";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  Users,
  Package,
  Clock,
  Star,
  DollarSign,
  Map,
  Target,
  Award,
  AlertCircle,
} from "lucide-react";

export default function AnalyticsReportsInterface() {
  const [selectedPeriod, setSelectedPeriod] = useState("last_7_days");
  const [selectedMetric, setSelectedMetric] = useState("deliveries");

  // Mock analytics data
  const analyticsData = {
    overview: {
      totalDeliveries: 1247,
      completionRate: 94.2,
      avgDeliveryTime: 28,
      customerRating: 4.7,
      totalRevenue: 156780,
      totalRiders: 24,
      activeRiders: 18,
      totalOrders: 1323,
    },
    trends: {
      deliveries: { value: 1247, change: 8.5, trend: "up" },
      revenue: { value: 156780, change: 12.3, trend: "up" },
      rating: { value: 4.7, change: -2.1, trend: "down" },
      time: { value: 28, change: -5.8, trend: "up" },
    },
    topPerformers: [
      { id: 1, name: "James Lee", deliveries: 89, rating: 4.9, revenue: 15600 },
      {
        id: 2,
        name: "Mike Johnson",
        deliveries: 78,
        rating: 4.8,
        revenue: 14200,
      },
      {
        id: 3,
        name: "David Wilson",
        deliveries: 71,
        rating: 4.6,
        revenue: 12800,
      },
      {
        id: 4,
        name: "Chris Taylor",
        deliveries: 65,
        rating: 4.7,
        revenue: 11900,
      },
      { id: 5, name: "Alex Brown", deliveries: 52, rating: 4.3, revenue: 9200 },
    ],
    timeData: [
      { time: "6:00", orders: 5, deliveries: 4 },
      { time: "8:00", orders: 18, deliveries: 16 },
      { time: "10:00", orders: 34, deliveries: 31 },
      { time: "12:00", orders: 67, deliveries: 62 },
      { time: "14:00", orders: 89, deliveries: 84 },
      { time: "16:00", orders: 73, deliveries: 69 },
      { time: "18:00", orders: 92, deliveries: 88 },
      { time: "20:00", orders: 45, deliveries: 43 },
      { time: "22:00", orders: 23, deliveries: 21 },
    ],
    areaPerformance: [
      { area: "Block A", orders: 234, avgTime: 25, rating: 4.8 },
      { area: "Block B", orders: 198, avgTime: 30, rating: 4.6 },
      { area: "Block C", orders: 167, avgTime: 22, rating: 4.9 },
      { area: "Block D", orders: 145, avgTime: 35, rating: 4.5 },
      { area: "Block E", orders: 123, avgTime: 28, rating: 4.7 },
    ],
  };

  const getTrendIcon = (trend) => {
    return trend === "up" ? (
      <TrendingUp className="w-4 h-4" />
    ) : (
      <TrendingDown className="w-4 h-4" />
    );
  };

  const getTrendColor = (trend) => {
    return trend === "up" ? "text-green-600" : "text-red-600";
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics & Reports
              </h1>
              <p className="text-gray-600">
                Track performance and generate delivery insights
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="this_month">This Month</option>
                <option value="last_month">Last Month</option>
              </select>
              <button className="bg-yellow-500 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-600" />
              </div>
              <div
                className={`flex items-center space-x-1 ${getTrendColor(
                  analyticsData.trends.deliveries.trend
                )}`}
              >
                {getTrendIcon(analyticsData.trends.deliveries.trend)}
                <span className="text-sm font-medium">
                  {analyticsData.trends.deliveries.change}%
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.overview.totalDeliveries.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm">Total Deliveries</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
              <div
                className={`flex items-center space-x-1 ${getTrendColor(
                  analyticsData.trends.revenue.trend
                )}`}
              >
                {getTrendIcon(analyticsData.trends.revenue.trend)}
                <span className="text-sm font-medium">
                  {analyticsData.trends.revenue.change}%
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              ₦{analyticsData.overview.totalRevenue.toLocaleString()}
            </h3>
            <p className="text-gray-600 text-sm">Total Revenue</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div
                className={`flex items-center space-x-1 ${getTrendColor(
                  analyticsData.trends.time.trend
                )}`}
              >
                {getTrendIcon(analyticsData.trends.time.trend)}
                <span className="text-sm font-medium">
                  {analyticsData.trends.time.change}%
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.overview.avgDeliveryTime} mins
            </h3>
            <p className="text-gray-600 text-sm">Avg Delivery Time</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-purple-600" />
              </div>
              <div
                className={`flex items-center space-x-1 ${getTrendColor(
                  analyticsData.trends.rating.trend
                )}`}
              >
                {getTrendIcon(analyticsData.trends.rating.trend)}
                <span className="text-sm font-medium">
                  {Math.abs(analyticsData.trends.rating.change)}%
                </span>
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {analyticsData.overview.customerRating}/5.0
            </h3>
            <p className="text-gray-600 text-sm">Customer Rating</p>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mb-8">
          {/* Performance Chart */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Daily Performance
              </h2>
              <select
                value={selectedMetric}
                onChange={(e) => setSelectedMetric(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
              >
                <option value="deliveries">Deliveries</option>
                <option value="orders">Orders</option>
                <option value="revenue">Revenue</option>
              </select>
            </div>

            {/* Simple Bar Chart */}
            <div className="space-y-4">
              {analyticsData.timeData.map((data, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-12 text-sm text-gray-600">{data.time}</div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <div className="flex-1 bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-yellow-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${(data.deliveries / 100) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-8">
                        {data.deliveries}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Top Performers
            </h2>
            <div className="space-y-4">
              {analyticsData.topPerformers.map((performer, index) => (
                <div
                  key={performer.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                        index === 0
                          ? "bg-yellow-500"
                          : index === 1
                          ? "bg-gray-400"
                          : index === 2
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">
                        {performer.name}
                      </p>
                      <p className="text-xs text-gray-600">
                        {performer.deliveries} deliveries
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ★ {performer.rating}
                    </p>
                    <p className="text-xs text-gray-600">
                      ₦{performer.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Area Performance & Additional Metrics */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Area Performance */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Area Performance
            </h2>
            <div className="space-y-4">
              {analyticsData.areaPerformance.map((area, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{area.area}</h3>
                    <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      ★ {area.rating}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Orders</p>
                      <p className="font-bold text-gray-900">{area.orders}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Avg Time</p>
                      <p className="font-bold text-gray-900">
                        {area.avgTime} mins
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Key Insights */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              Key Insights
            </h2>
            <div className="space-y-4">
              <div className="border border-green-200 rounded-xl p-4 bg-green-50">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-green-900">
                      Peak Performance
                    </h3>
                    <p className="text-sm text-green-700 mt-1">
                      Delivery efficiency improved by 8.5% this period. Evening
                      hours (6-8 PM) show highest order volume.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-blue-200 rounded-xl p-4 bg-blue-50">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-blue-900">
                      Optimization Opportunity
                    </h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Block D area has 35-min avg delivery time. Consider adding
                      more riders to this zone.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-yellow-200 rounded-xl p-4 bg-yellow-50">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-yellow-900">
                      Customer Satisfaction
                    </h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      94.2% completion rate with 4.7/5 average rating. James Lee
                      leads with 4.9 rating.
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-red-200 rounded-xl p-4 bg-red-50">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-red-900">
                      Area of Concern
                    </h3>
                    <p className="text-sm text-red-700 mt-1">
                      Customer rating dropped 2.1% from last period. Monitor
                      rider training and feedback.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Summary Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {analyticsData.overview.activeRiders}/
                {analyticsData.overview.totalRiders}
              </h3>
              <p className="text-gray-600 text-sm">Active Riders</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {analyticsData.overview.completionRate}%
              </h3>
              <p className="text-gray-600 text-sm">Completion Rate</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <BarChart3 className="w-8 h-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                {analyticsData.overview.totalOrders}
              </h3>
              <p className="text-gray-600 text-sm">Total Orders</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Map className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-1">5</h3>
              <p className="text-gray-600 text-sm">Coverage Areas</p>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="mt-8 bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Export Reports
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-2 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Delivery Report (PDF)</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Financial Report (Excel)</span>
            </button>
            <button className="flex items-center justify-center space-x-2 bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors">
              <Download className="w-4 h-4" />
              <span>Performance Report (CSV)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
