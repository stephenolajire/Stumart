import React, { useState, useEffect } from "react";
import {
  Filter,
  MapPin,
  Store,
  Package,
  Eye,
  CheckCircle,
  DollarSign,
  Loader2,
  AlertCircle,
  Clock,
  ArrowRight,
} from "lucide-react";
import api from "../constant/api";
import Swal from "sweetalert2";
import { useNavigate, Link } from "react-router-dom";

const AvailableOrders = ({ onOrderSelect }) => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAvailableOrders = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`available-deliveries?filter=${filter}`);
        setOrders(response.data);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching available orders:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableOrders();
  }, [filter]);

  const handleAcceptOrder = async (orderId) => {
    try {
      await api.post(`available-delivery/${orderId}/accept/`);
      // After accepting, redirect to my deliveries or refresh the list
      Swal.fire({
        icon: "success",
        title: "Order Accepted",
        text: "You have successfully accepted the order.",
        confirmButtonColor: "#eab308",
      });
      navigate("/picker/my-deliveries");
    } catch (error) {
      console.error("Error accepting order:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to accept order",
        text: "You can not accept order now pls try again later",
        confirmButtonColor: "#ef4444",
      });
    }
  };

  const filterButtons = [
    { key: "all", label: "All Orders", icon: Package },
    { key: "nearby", label: "Nearby", icon: MapPin },
    { key: "high_value", label: "High Value", icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Available Orders
              </h1>
              <p className="text-gray-600 mt-1">
                Pick up and deliver orders to earn money
              </p>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {filterButtons.map((btn) => {
              const IconComponent = btn.icon;
              return (
                <button
                  key={btn.key}
                  className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                    filter === btn.key
                      ? "bg-yellow-500 text-white shadow-lg transform scale-105"
                      : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 hover:border-yellow-300"
                  }`}
                  onClick={() => setFilter(btn.key)}
                >
                  <IconComponent className="w-5 h-5 mr-2" />
                  {btn.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600 font-medium">
              Loading available orders...
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please wait while we fetch the latest orders
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <AlertCircle className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Available Orders
            </h3>
            <p className="text-gray-600 text-center max-w-md">
              There are no available orders matching your filter criteria at the
              moment. Check back later or try a different filter.
            </p>
            <button
              onClick={() => setFilter("all")}
              className="mt-4 inline-flex items-center px-4 py-2 text-yellow-600 hover:text-yellow-700 font-medium"
            >
              <Filter className="w-4 h-4 mr-2" />
              View All Orders
            </button>
          </div>
        ) : (
          /* Orders List */
          <div className="grid gap-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Order Header */}
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                        <Package className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">
                          {order.order_number}
                        </h3>
                        <div className="flex items-center text-yellow-100">
                          <Clock className="w-4 h-4 mr-1" />
                          <span className="text-sm">New Order</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        ₦{order.shipping_fee}
                      </div>
                      <div className="text-yellow-100 text-sm">
                        Delivery Fee
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Vendor Info */}
                  <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Store className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.vendor_name}
                      </p>
                      <p className="text-sm text-gray-500">Vendor</p>
                    </div>
                  </div>

                  {/* Location Info */}
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <MapPin className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Pickup Location
                        </p>
                        <p className="text-gray-600 text-sm">
                          {order.pickup_location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                        <MapPin className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          Delivery Location
                        </p>
                        <p className="text-gray-600 text-sm">
                          {order.delivery_location}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="flex items-center mb-3">
                      <Package className="w-5 h-5 text-gray-600 mr-2" />
                      <h4 className="font-semibold text-gray-900">
                        Order Items ({order.items.length})
                      </h4>
                    </div>

                    <div className="space-y-2 mb-3">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between items-center py-2"
                        >
                          <span className="text-gray-700">
                            {item.product_name} x{item.quantity}
                          </span>
                          <span className="font-medium text-gray-900">
                            ₦{item.price.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                      <span className="font-semibold text-gray-900">
                        Order Total:
                      </span>
                      <span className="font-bold text-lg text-gray-900">
                        ₦{order.total.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Link
                      to={`/delivery-detail/${order.id}`}
                      className="flex-1"
                    >
                      <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center">
                        <Eye className="w-5 h-5 mr-2" />
                        View Details
                      </button>
                    </Link>

                    <button
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                      onClick={() => handleAcceptOrder(order.id)}
                    >
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Accept Order
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
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

export default AvailableOrders;
