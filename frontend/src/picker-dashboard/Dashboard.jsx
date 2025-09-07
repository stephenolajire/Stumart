import React, { useState, useEffect } from "react";
import Spinner from "../components/Spinner";
import {
  ShoppingBag,
  Truck,
  DollarSign,
  Star,
  TrendingUp,
  Clock,
  MapPin,
  Package,
  Activity,
  Eye,
} from "lucide-react";
import api from "../constant/api";
import ThemeToggle from "../components/ThemeToggle";

const Dashboard = ({ onOrderSelect }) => {
  const [dashboardData, setDashboardData] = useState({
    stats: {
      availableOrders: 0,
      activeDeliveries: 0,
      earnings: 0,
      rating: 0,
    },
    recent_orders: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const response = await api.get("picker/dashboard");
        setDashboardData(response.data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getStatusStyle = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "In Progress":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Completed":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending":
        return <Clock className="w-3 h-3" />;
      case "In Progress":
        return <Activity className="w-3 h-3" />;
      case "Completed":
        return <Package className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Spinner />
          <p className="text-gray-600 mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: "Available Orders",
      value: dashboardData.stats.availableOrders,
      icon: ShoppingBag,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Deliveries",
      value: dashboardData.stats.activeDeliveries,
      icon: Truck,
      color: "bg-orange-500",
      bgColor: "bg-orange-50",
    },
    {
      title: "Total Earnings",
      value: `₦${dashboardData.stats.earnings.toLocaleString()}`,
      icon: DollarSign,
      color: "bg-green-500",
      bgColor: "bg-green-50",
    },
    {
      title: "Rating",
      value: dashboardData.stats.rating.toFixed(1),
      icon: Star,
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Theme Toggle */}
      <div className="fixed top-8 right-8 z-50">
        <ThemeToggle />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <TrendingUp className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome back! Here's your delivery overview
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statCards.map((stat, index) => {
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

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Recent Orders</h2>
                <p className="text-yellow-100 text-sm">
                  Your latest delivery activities
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            {dashboardData.recent_orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Recent Orders
                </h3>
                <p className="text-gray-600">
                  You haven't completed any deliveries recently. Check available
                  orders to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {dashboardData.recent_orders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 cursor-pointer transition-colors duration-200 group"
                    onClick={() => onOrderSelect && onOrderSelect(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 group-hover:text-yellow-600 transition-colors">
                            {order.order_number}
                          </h4>
                          <div className="flex items-center">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusStyle(
                                order.status
                              )}`}
                            >
                              {getStatusIcon(order.status)}
                              <span className="ml-1">{order.status}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-gray-600 mb-1">
                          <Package className="w-4 h-4 mr-2" />
                          <span className="font-medium">
                            {order.vendor_name}
                          </span>
                        </div>

                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{order.delivery_location}</span>
                        </div>
                      </div>

                      <div className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Eye className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <ShoppingBag className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Find New Orders</h3>
                <p className="text-blue-100 text-sm">
                  Browse available deliveries in your area
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">
              {dashboardData.stats.availableOrders} Available
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white">
            <div className="flex items-center mb-4">
              <DollarSign className="w-8 h-8 mr-3" />
              <div>
                <h3 className="text-lg font-semibold">Your Earnings</h3>
                <p className="text-green-100 text-sm">
                  Total amount earned from deliveries
                </p>
              </div>
            </div>
            <div className="text-2xl font-bold mb-2">
              ₦{dashboardData.stats.earnings.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
