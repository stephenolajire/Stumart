import React, { useState, useEffect } from "react";
import {
  MapPin,
  User,
  Package,
  Check,
  Eye,
  Clock,
  CheckCircle,
  Truck,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
} from "lucide-react";
import api from "../constant/api";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";

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

const MyDeliveries = () => {
  const [deliveries, setDeliveries] = useState([]);
  const [activeTab, setActiveTab] = useState("active");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDeliveries = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`my-deliveries?status=${activeTab}`);
        setDeliveries(response.data);
      } catch (error) {
        console.error("Error fetching deliveries:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeliveries();
  }, [activeTab]);

  const handleMarkAsDelivered = async (orderId) => {
    try {
      await api.post(`orders/${orderId}/deliver/`, {
        status: "DELIVERED",
      });

      // Remove the order from active deliveries list
      setDeliveries((prevDeliveries) =>
        prevDeliveries.filter((delivery) => delivery.id !== orderId)
      );

      Toast.fire({
        icon: "success",
        title: "Order marked as delivered",
        text: "Thank you for an amazing job!",
      });
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to update status",
        text: "Please try again later",
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusStyle = (status) => {
    return status === "IN_TRANSIT"
      ? "bg-blue-100 text-blue-800 border-blue-200"
      : "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusIcon = (status) => {
    return status === "IN_TRANSIT" ? (
      <Truck className="w-3 h-3" />
    ) : (
      <CheckCircle className="w-3 h-3" />
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <Truck className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                My Deliveries
              </h1>
              <p className="text-gray-600 mt-1">
                Manage your active and completed deliveries
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === "active"
                  ? "bg-white text-yellow-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("active")}
            >
              <div className="flex items-center justify-center">
                <Clock className="w-4 h-4 mr-2" />
                Active Deliveries
              </div>
            </button>
            <button
              className={`flex-1 py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                activeTab === "completed"
                  ? "bg-white text-yellow-700 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
              onClick={() => setActiveTab("completed")}
            >
              <div className="flex items-center justify-center">
                <CheckCircle className="w-4 h-4 mr-2" />
                Completed Deliveries
              </div>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600 font-medium">
              Loading deliveries...
            </p>
          </div>
        ) : deliveries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No {activeTab === "active" ? "Active" : "Completed"} Deliveries
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              {activeTab === "active"
                ? "You don't have any active deliveries at the moment. Check available orders to start delivering!"
                : "You haven't completed any deliveries yet. Complete your first delivery to see it here."}
            </p>
          </div>
        ) : (
          /* Deliveries List */
          <div className="grid gap-6">
            {deliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Delivery Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {delivery.order_number}
                        </h3>
                        <div className="flex items-center text-yellow-100">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span className="text-sm">
                            {formatDate(delivery.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border bg-white ${getStatusStyle(
                          delivery.status
                        )}`}
                      >
                        {getStatusIcon(delivery.status)}
                        <span className="ml-1">
                          {delivery.status === "IN_TRANSIT"
                            ? "In Transit"
                            : "Delivered"}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Delivery Details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Customer
                        </span>
                        <p className="font-semibold text-gray-900 mt-1">
                          {delivery.customer_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Delivery Location
                        </span>
                        <p className="font-semibold text-gray-900 mt-1">
                          {delivery.delivery_location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <Package className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                          Items
                        </span>
                        <p className="font-semibold text-gray-900 mt-1">
                          {delivery.items_count} item(s)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="flex items-center mb-2">
                          <DollarSign className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Order Total
                          </span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">
                          ₦{delivery.total.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <div className="flex items-center mb-2">
                          <Truck className="w-4 h-4 text-gray-500 mr-2" />
                          <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                            Your Fee
                          </span>
                        </div>
                        <p className="text-lg font-bold text-green-600">
                          ₦{delivery.shipping_fee.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to={`/delivery-detail/${delivery.id}`}
                      className="flex-1"
                    >
                      <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center">
                        <Eye className="w-5 h-5 mr-2" />
                        View Details
                      </button>
                    </Link>

                    {delivery.status === "IN_TRANSIT" && (
                      <button
                        className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                        onClick={() => handleMarkAsDelivered(delivery.id)}
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyDeliveries;
