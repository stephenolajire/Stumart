import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  User,
  MapPin,
  Package,
  Check,
  Phone,
  Calendar,
  Store,
  DollarSign,
  Home,
  Loader2,
  AlertCircle,
  Clock,
} from "lucide-react";
import api from "../constant/api";
import Swal from "sweetalert2";

const DeliveryDetail = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`orders/${orderId}/`);
        console.log("Order Data:", response.data);
        setOrderData(response.data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err.response?.data?.message || "Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const handleMarkDelivered = async () => {
    try {
      setProcessingAction(true);
      await api.post(`orders/${orderId}/deliver/`, {
        status: "DELIVERED",
      });

      Swal.fire({
        icon: "success",
        title: "Order Delivered",
        text: "Thank you for an amazing job. Go on to accept more orders",
        confirmButtonColor: "#eab308",
      });

      navigate("/my-deliveries");
    } catch (error) {
      console.error("Error marking as delivered:", error);
      Swal.fire({
        icon: "error",
        title: "Status Error",
        text: "Order status failed, please try again later",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const goBack = () => navigate(-1);

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
    switch (status) {
      case "IN_TRANSIT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={goBack}
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 ml-4">
              Order Details
            </h1>
          </div>

          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mb-4" />
            <p className="text-lg text-gray-600 font-medium">
              Loading order details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-8">
            <button
              onClick={goBack}
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Error Loading Order
            </h2>
            <p className="text-gray-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <button
              onClick={goBack}
              className="inline-flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 font-medium transition-colors mr-4"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Order #{orderData.order_number}
                  </h2>
                  <div className="flex items-center text-yellow-100">
                    <Calendar className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {formatDate(orderData.created_at)}
                    </span>
                  </div>
                </div>
              </div>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border bg-white ${getStatusStyle(
                  orderData.status
                )}`}
              >
                <Clock className="w-3 h-3 mr-1" />
                {orderData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Customer and Location Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                <User className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Customer
                </h3>
                <p className="text-sm text-gray-500">Contact information</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-900">
                  {orderData.customer.name}
                </p>
              </div>
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <p className="text-gray-700">{orderData.customer.phone}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                <MapPin className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Delivery Location
                </h3>
                <p className="text-sm text-gray-500">Drop-off address</p>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-gray-700">{orderData.customer.address}</p>
              {orderData.customer.room_number && (
                <div className="flex items-center">
                  <Home className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-gray-700">
                    Room: {orderData.customer.room_number}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
            <div className="flex items-center">
              <Package className="w-6 h-6 text-white mr-3" />
              <h3 className="text-xl font-semibold text-white">Order Items</h3>
            </div>
          </div>

          <div className="p-6">
            {orderData.vendors.map((vendor) => (
              <div key={vendor.vendor_info.id} className="mb-6 last:mb-0">
                <div className="flex items-center justify-between mb-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <Store className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        {vendor.vendor_info.name}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {vendor.vendor_info.location}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {vendor.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                          <Package className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">
                            {item.product_name}
                          </span>
                          <span className="text-gray-500 ml-2">
                            x{item.quantity}
                          </span>
                        </div>
                      </div>
                      <span className="font-semibold text-gray-900">
                        ₦{item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center mb-6">
            <DollarSign className="w-6 h-6 text-green-600 mr-3" />
            <h3 className="text-xl font-semibold text-gray-900">
              Order Summary
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                ₦{orderData.order_summary.subtotal.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Shipping Fee</span>
              <span className="font-medium text-gray-900">
                ₦{orderData.order_summary.shipping_fee.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-600">Tax</span>
              <span className="font-medium text-gray-900">
                ₦{orderData.order_summary.tax.toLocaleString()}
              </span>
            </div>
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between">
                <span className="text-lg font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-lg font-bold text-gray-900">
                  ₦{orderData.order_summary.total.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {orderData.status === "IN_TRANSIT" && (
          <div className="flex justify-center">
            <button
              onClick={handleMarkDelivered}
              disabled={processingAction}
              className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
            >
              {processingAction ? (
                <>
                  <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-6 h-6 mr-3" />
                  Mark as Delivered
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryDetail;
