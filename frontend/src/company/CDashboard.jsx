import { useState } from "react";
import {
  Truck,
  Users,
  Package,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Calendar,
  MapPin,
} from "lucide-react";

export default function DeliveryPartnerDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  // Mock data - replace with real API data
  const stats = {
    totalRiders: 24,
    activeRiders: 18,
    totalDeliveries: 156,
    completedDeliveries: 142,
    pendingDeliveries: 14,
    avgDeliveryTime: "28 mins",
    revenue: 45200,
    efficiency: 91.2,
  };

  const recentDeliveries = [
    {
      id: "ORD001",
      customer: "John Doe",
      rider: "Mike Johnson",
      status: "Delivered",
      time: "2 mins ago",
      location: "Block A, Room 205",
    },
    {
      id: "ORD002",
      customer: "Sarah Smith",
      rider: "David Wilson",
      status: "In Transit",
      time: "5 mins ago",
      location: "Block B, Room 118",
    },
    {
      id: "ORD003",
      customer: "Alex Brown",
      rider: "James Lee",
      status: "Picked Up",
      time: "12 mins ago",
      location: "Block C, Room 302",
    },
    {
      id: "ORD004",
      customer: "Emma Davis",
      rider: "Chris Taylor",
      status: "Assigned",
      time: "15 mins ago",
      location: "Block D, Room 156",
    },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case "Delivered":
        return "bg-green-100 text-green-800 border-green-200";
      case "In Transit":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Picked Up":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "Assigned":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Delivery Partner Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor your delivery operations and rider performance
          </p>
        </div>

        {/* Period Selector */}
        <div className="mb-8">
          <div className="flex space-x-2">
            {["today", "week", "month"].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedPeriod === period
                    ? "bg-yellow-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                {period === "today"
                  ? "Today"
                  : period === "week"
                  ? "This Week"
                  : "This Month"}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                +3 today
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.totalRiders}
            </h3>
            <p className="text-gray-600 text-sm">Total Riders</p>
            <div className="mt-3 text-xs text-gray-500">
              {stats.activeRiders} active now
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                +12 today
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.completedDeliveries}
            </h3>
            <p className="text-gray-600 text-sm">Completed Deliveries</p>
            <div className="mt-3 text-xs text-gray-500">
              {stats.pendingDeliveries} pending
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">
                -2 mins
              </span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.avgDeliveryTime}
            </h3>
            <p className="text-gray-600 text-sm">Avg Delivery Time</p>
            <div className="mt-3 text-xs text-gray-500">Target: 30 mins</div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-green-600 font-medium">+2.1%</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {stats.efficiency}%
            </h3>
            <p className="text-gray-600 text-sm">Delivery Efficiency</p>
            <div className="mt-3 text-xs text-gray-500">vs last period</div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Deliveries */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">
                Recent Deliveries
              </h2>
              <button className="text-yellow-600 hover:text-yellow-700 text-sm font-medium">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                      <Package className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {delivery.id}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {delivery.customer}
                      </p>
                      <p className="text-xs text-gray-500 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {delivery.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        delivery.status
                      )}`}
                    >
                      {delivery.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {delivery.rider}
                    </p>
                    <p className="text-xs text-gray-400">{delivery.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions & Performance */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <button className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                  Assign Pending Orders
                </button>
                <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                  Add New Rider
                </button>
                <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg transition-colors font-medium">
                  View Live Map
                </button>
              </div>
            </div>

            {/* Performance Overview */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Performance
              </h2>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">On-time Delivery</span>
                    <span className="font-medium text-gray-900">94%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: "94%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Customer Rating</span>
                    <span className="font-medium text-gray-900">4.8/5.0</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full"
                      style={{ width: "96%" }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Rider Utilization</span>
                    <span className="font-medium text-gray-900">75%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <button className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2">
            <BarChart3 className="w-5 h-5" />
            <span>Analytics Report</span>
          </button>
          <button className="flex-1 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-3 px-6 rounded-lg transition-colors font-medium flex items-center justify-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Schedule Management</span>
          </button>
        </div>
      </div>
    </div>
  );
}
