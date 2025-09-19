import React, { useState, useEffect } from "react";
import {
  Package,
  User,
  MapPin,
  Clock,
  Shuffle,
  UserCheck,
  Filter,
  AlertCircle,
  CheckCircle,
  Timer,
  Phone,
  Navigation,
  Loader2,
  DollarSign,
  Calendar,
  Truck,
} from "lucide-react";
import api from "../constant/api";
import Swal from "sweetalert2";
import {
  useAllAvailableDeliveries,
  useAllRiders,
} from "../constant/GlobalContext";

// Create toast mixin configuration
const Toast = Swal.mixin({
  toast: true,
  position: "top-right",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export default function OrderAssignmentInterface() {
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [selectedRider, setSelectedRider] = useState("");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);

  const {
    data: ordersData,
    isLoading: isLoadingOrders,
    error: ordersError,
  } = useAllAvailableDeliveries();

  // Fetch available riders
  const {
    data: ridersData,
    isLoading: isLoadingRiders,
    error: ridersError,
  } = useAllRiders();
  const availableRiders = Array.isArray(ridersData)
    ? ridersData
    : ridersData?.results || [];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const handleSelectOrder = (orderId) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    setSelectedOrders(
      selectedOrders.length === pendingOrders.length
        ? []
        : pendingOrders.map((o) => o.id)
    );
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const createdAt = new Date(dateString);
    const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} mins ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  if (isLoadingOrders) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
          <p className="text-lg text-gray-600 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Order Assignment
          </h1>
          <p className="text-gray-600">
            Assign pending orders to available riders
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingOrders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Available Riders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {availableRiders.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingOrders.filter((o) => o.priority === "high").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <Timer className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₦
                  {pendingOrders
                    .reduce((sum, order) => sum + (order.total || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Pending Orders */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Pending Orders
                </h2>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {ordersData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                    <AlertCircle className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No Pending Orders
                  </h3>
                  <p className="text-gray-600 text-center max-w-md">
                    There are no pending orders to assign at the moment. New
                    orders will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 p-6">
                  {ordersData.map((order) => (
                    <div
                      key={order.id}
                      className={`border rounded-xl p-4 transition-all cursor-pointer ${
                        selectedOrders.includes(order.id)
                          ? "border-yellow-500 bg-yellow-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => handleSelectOrder(order.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={selectedOrders.includes(order.id)}
                            onChange={() => handleSelectOrder(order.id)}
                            className="w-4 h-4 text-yellow-500 border-gray-300 rounded focus:ring-yellow-500"
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {order.order_number || `ORD${order.id}`}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {order.customer_name}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getPriorityColor(
                              order.priority || "medium"
                            )}`}
                          >
                            {order.priority || "medium"}
                          </span>
                          <span className="text-sm text-gray-500">
                            {getTimeAgo(order.created_at)}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                          <p className="flex items-center text-gray-600">
                            <MapPin className="w-4 h-4 mr-2" />
                            {order.delivery_location}
                          </p>
                          <p className="flex items-center text-gray-600">
                            <Phone className="w-4 h-4 mr-2" />
                            {order.customer_phone || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-2">
                          <p className="text-gray-600">
                            <span className="font-medium">
                              {order.items_count || 1}
                            </span>{" "}
                            items •
                            <span className="font-medium text-green-600">
                              {" "}
                              ₦{(order.total || 0).toLocaleString()}
                            </span>
                          </p>
                          <p className="flex items-center text-gray-600">
                            <Clock className="w-4 h-4 mr-2" />
                            {order.estimated_time || "30 mins"} •{" "}
                            {order.distance || "1.0 km"}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs text-gray-500">
                          Created: {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Riders */}
          <div className="bg-white rounded-2xl shadow-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Available Riders
              </h2>
            </div>

            <div className="p-6">
              {isLoadingRiders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 text-yellow-600 animate-spin" />
                </div>
              ) : availableRiders.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No riders available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {availableRiders.map((rider) => (
                    <div
                      key={rider.id}
                      className="border border-gray-200 rounded-xl p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {rider.name}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center">
                              <MapPin className="w-3 h-3 mr-1" />
                              {rider.current_location || rider.currentLocation}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            ★ {rider.rating}
                          </p>
                          <p className="text-xs text-gray-500">
                            {rider.completed_today || rider.completedToday}{" "}
                            today
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <p className="text-gray-600 flex items-center">
                          <Navigation className="w-3 h-3 mr-1" />
                          {rider.estimated_arrival ||
                            rider.estimatedArrival}{" "}
                          away
                        </p>
                        <button
                          onClick={() => {
                            setSelectedRider(rider.id.toString());
                            setShowAssignModal(true);
                          }}
                          className="text-yellow-600 hover:text-yellow-700 font-medium"
                        >
                          Assign Orders
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Manual Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Assign to Rider
              </h2>
              <p className="text-gray-600 mb-6">
                Assign {selectedOrders.length} selected order(s) to a specific
                rider
              </p>

              <div className="space-y-4 mb-6">
                <label className="block text-sm font-medium text-gray-700">
                  Select Rider
                </label>
                <select
                  value={selectedRider}
                  onChange={(e) => setSelectedRider(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none"
                >
                  <option value="">Choose a rider...</option>
                  {availableRiders.map((rider) => (
                    <option key={rider.id} value={rider.id}>
                      {rider.name} -{" "}
                      {rider.current_location || rider.currentLocation} (★{" "}
                      {rider.rating})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleManualAssign}
                  disabled={!selectedRider}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg transition-colors"
                >
                  Assign Orders
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
