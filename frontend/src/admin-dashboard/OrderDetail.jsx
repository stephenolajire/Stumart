import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../constant/api";
import { useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaTruck,
  FaBox,
  FaCalendarAlt,
  FaCreditCard,
  FaSpinner,
  FaCheck,
  FaClock,
  FaShippingFast,
  FaTimes,
  FaExclamationTriangle,
  FaReceipt,
  FaEdit,
  FaStore,
  FaTag,
  FaPalette,
} from "react-icons/fa";

const AdminOrderDetail = ({ onBack }) => {
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const { orderId } = useParams();
  const order_id = orderId;

  useEffect(() => {
    fetchOrderDetail();
  }, [order_id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`admin-orders/${order_id}/`);
      setOrderDetail(response.data);
      setStatusUpdate(response.data.status);
      setError(null);
    } catch (err) {
      setError("Failed to fetch order details. Please try again later.");
      console.error("Error fetching order details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async () => {
    try {
      setUpdateLoading(true);
      await api.put(`admin-orders/${orderId}/`, {
        status: statusUpdate,
      });
      fetchOrderDetail(); // Refresh order details after update
    } catch (err) {
      setError("Failed to update order status. Please try again later.");
      console.error("Error updating order status:", err);
    } finally {
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "COMPLETED":
        return {
          color: "bg-emerald-500 text-white",
          bgColor: "bg-emerald-50 border-emerald-200",
          textColor: "text-emerald-700",
          icon: <FaCheck className="w-4 h-4" />,
        };
      case "PENDING":
        return {
          color: "bg-amber-500 text-white",
          bgColor: "bg-amber-50 border-amber-200",
          textColor: "text-amber-700",
          icon: <FaClock className="w-4 h-4" />,
        };
      case "PROCESSING":
        return {
          color: "bg-blue-500 text-white",
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-700",
          icon: <FaSpinner className="w-4 h-4" />,
        };
      case "SHIPPED":
        return {
          color: "bg-purple-500 text-white",
          bgColor: "bg-purple-50 border-purple-200",
          textColor: "text-purple-700",
          icon: <FaShippingFast className="w-4 h-4" />,
        };
      case "CANCELLED":
        return {
          color: "bg-red-500 text-white",
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-700",
          icon: <FaTimes className="w-4 h-4" />,
        };
      default:
        return {
          color: "bg-gray-500 text-white",
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-700",
          icon: <FaClock className="w-4 h-4" />,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Order
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchOrderDetail}
            className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            <FaSpinner className="w-4 h-4 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!orderDetail) {
    return (
      <div className="text-center py-16">
        <FaBox className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Order not found</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(orderDetail.status);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-6">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <FaArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Order #{orderDetail.order_number}
            </h1>
            <p className="text-gray-500 mt-1">
              Placed on {formatDate(orderDetail.created_at)}
            </p>
          </div>
        </div>
        <div
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium ${statusConfig.color}`}
        >
          {statusConfig.icon}
          {orderDetail.status}
        </div>
      </div>

      {/* Status Update Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <FaEdit className="w-5 h-5 text-gray-500" />
          <h2 className="text-xl font-semibold text-gray-900">
            Update Order Status
          </h2>
        </div>
        <div className="flex gap-4">
          <select
            value={statusUpdate}
            onChange={(e) => setStatusUpdate(e.target.value)}
            disabled={updateLoading}
            className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 focus:bg-white transition-all duration-200"
          >
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={handleStatusChange}
            disabled={updateLoading || statusUpdate === orderDetail.status}
            className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
          >
            {updateLoading ? (
              <>
                <FaSpinner className="animate-spin w-4 h-4 mr-2 inline" />
                Updating...
              </>
            ) : (
              "Update Status"
            )}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Info & Customer */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaReceipt className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Order Information
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <FaCalendarAlt className="w-4 h-4" />
                  <span className="font-medium">Order Date</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {formatDate(orderDetail.created_at)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <FaCreditCard className="w-4 h-4" />
                  <span className="font-medium">Total Amount</span>
                </div>
                <p className="text-gray-900 font-bold text-lg">
                  ₦{orderDetail.total.toLocaleString()}
                </p>
              </div>
              <div
                className={`rounded-lg p-4 border-2 ${statusConfig.bgColor}`}
              >
                <div
                  className={`flex items-center gap-2 mb-2 ${statusConfig.textColor}`}
                >
                  {statusConfig.icon}
                  <span className="font-medium">Status</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {orderDetail.status}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaBox className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">
                Order Items
              </h2>
            </div>
            <div className="space-y-4">
              {orderDetail.items.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.product_name}
                      </h3>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaStore className="w-3 h-3" />
                          {item.vendor_name}
                        </div>
                        {item.size && (
                          <div className="flex items-center gap-1">
                            <FaTag className="w-3 h-3" />
                            Size: {item.size}
                          </div>
                        )}
                        {item.color && (
                          <div className="flex items-center gap-1">
                            <FaPalette className="w-3 h-3" />
                            Color: {item.color}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-semibold text-gray-900">
                        ₦{item.total.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {item.quantity} × ₦{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 mt-6 pt-6">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₦{orderDetail.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Fee</span>
                  <span>₦{orderDetail.shipping_fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax</span>
                  <span>₦{orderDetail.tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₦{orderDetail.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Additional Info */}
        <div className="space-y-8">
          {/* Customer Information */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaUser className="w-5 h-5 text-gray-500" />
              <h2 className="text-xl font-semibold text-gray-900">Customer</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <FaUser className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900">
                    {orderDetail.customer_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-700">{orderDetail.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <FaPhone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-gray-700">{orderDetail.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mt-1" />
                <div>
                  <p className="text-gray-700">{orderDetail.address}</p>
                  {orderDetail.room_number && (
                    <p className="text-sm text-gray-500 mt-1">
                      Room: {orderDetail.room_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Picker Information */}
          {orderDetail.picker && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaTruck className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Delivery Agent
                </h2>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <FaUser className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-900">
                    {orderDetail.picker.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-700">{orderDetail.picker.email}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          {orderDetail.transaction && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
              <div className="flex items-center gap-3 mb-6">
                <FaCreditCard className="w-5 h-5 text-gray-500" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Payment Details
                </h2>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Transaction ID</p>
                  <p className="font-mono text-gray-900">
                    {orderDetail.transaction.transaction_id}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium text-gray-900">
                    {orderDetail.transaction.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      orderDetail.transaction.status === "success"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {orderDetail.transaction.status === "success" ? (
                      <FaCheck className="w-3 h-3" />
                    ) : (
                      <FaClock className="w-3 h-3" />
                    )}
                    {orderDetail.transaction.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="text-gray-900">
                    {formatDate(orderDetail.transaction.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Amount</p>
                  <p className="font-bold text-lg text-gray-900">
                    ₦{orderDetail.transaction.amount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrderDetail;
