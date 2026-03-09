import React, { useState, useEffect } from "react";
import axios from "axios";
import api from "../constant/api";
import { useParams, useNavigate } from "react-router-dom";
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

const AdminOrderDetail = () => {
  const [orderDetail, setOrderDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [updateLoading, setUpdateLoading] = useState(false);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const order_id = orderId;

  useEffect(() => {
    fetchOrderDetail();
  }, [order_id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      const response = await api.get(`admin/orders/${order_id}/`);
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
      await api.put(`admin/orders/${orderId}/`, {
        status: statusUpdate,
      });
      fetchOrderDetail();
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
          color: "bg-emerald-600 text-white",
          bgColor: "bg-emerald-50 border-emerald-200",
          textColor: "text-emerald-700",
          icon: <FaCheck className="w-4 h-4" />,
        };
      case "PENDING":
        return {
          color: "bg-yellow-600 text-white",
          bgColor: "bg-yellow-50 border-yellow-200",
          textColor: "text-yellow-700",
          icon: <FaClock className="w-4 h-4" />,
        };
      case "PROCESSING":
        return {
          color: "bg-blue-600 text-white",
          bgColor: "bg-blue-50 border-blue-200",
          textColor: "text-blue-700",
          icon: <FaSpinner className="w-4 h-4" />,
        };
      case "SHIPPED":
        return {
          color: "bg-purple-600 text-white",
          bgColor: "bg-purple-50 border-purple-200",
          textColor: "text-purple-700",
          icon: <FaShippingFast className="w-4 h-4" />,
        };
      case "CANCELLED":
        return {
          color: "bg-red-600 text-white",
          bgColor: "bg-red-50 border-red-200",
          textColor: "text-red-700",
          icon: <FaTimes className="w-4 h-4" />,
        };
      default:
        return {
          color: "bg-gray-600 text-white",
          bgColor: "bg-gray-50 border-gray-200",
          textColor: "text-gray-700",
          icon: <FaClock className="w-4 h-4" />,
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96 p-4">
        <div className="text-center">
          <FaSpinner className="animate-spin w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-600 text-base sm:text-lg">
            Loading order details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96 p-4">
        <div className="text-center max-w-4xl">
          <FaExclamationTriangle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
            Error Loading Order
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-6">{error}</p>
          <button
            onClick={fetchOrderDetail}
            className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm"
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
      <div className="text-center py-16 p-4">
        <FaBox className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-base sm:text-lg">Order not found</p>
      </div>
    );
  }

  const statusConfig = getStatusConfig(orderDetail.status);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto py-4 sm:py-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <button
              onClick={() => navigate("/admin-dashboard/orders")}
              className="inline-flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div className="min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                Order #{orderDetail.order_number}
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {formatDate(orderDetail.created_at)}
              </p>
            </div>
          </div>
          <div
            className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm ${statusConfig.color} self-start`}
          >
            {statusConfig.icon}
            <span className="whitespace-nowrap">{orderDetail.status}</span>
          </div>
        </div>
      </div>

      {/* Status Update Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <FaEdit className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Update Order Status
          </h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <select
            value={statusUpdate}
            onChange={(e) => setStatusUpdate(e.target.value)}
            disabled={updateLoading}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
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
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors text-sm whitespace-nowrap"
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Order Info & Items */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Order Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <FaReceipt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Order Information
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-2 text-xs sm:text-sm">
                  <FaCalendarAlt className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">Order Date</span>
                </div>
                <p className="text-gray-900 font-semibold text-xs sm:text-sm wrap-break-words">
                  {formatDate(orderDetail.created_at)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200">
                <div className="flex items-center gap-2 text-gray-600 mb-2 text-xs sm:text-sm">
                  <FaCreditCard className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium">Total Amount</span>
                </div>
                <p className="text-gray-900 font-bold text-base sm:text-lg">
                  ₦{orderDetail.total.toLocaleString()}
                </p>
              </div>
              <div
                className={`rounded-lg p-3 sm:p-4 border-2 ${statusConfig.bgColor}`}
              >
                <div
                  className={`flex items-center gap-2 mb-2 text-xs sm:text-sm ${statusConfig.textColor}`}
                >
                  {statusConfig.icon}
                  <span className="font-medium">Status</span>
                </div>
                <p className="text-gray-900 font-semibold text-xs sm:text-sm">
                  {orderDetail.status}
                </p>
              </div>
            </div>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <FaBox className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Order Items ({orderDetail.items.length})
              </h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              {orderDetail.items.map((item, index) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-2 text-sm sm:text-base wrap-break-words">
                        {item.product_name}
                      </h3>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <FaStore className="w-3 h-3 shrink-0" />
                          <span className="truncate">{item.vendor_name}</span>
                        </div>
                        {item.size && (
                          <div className="flex items-center gap-1">
                            <FaTag className="w-3 h-3 shrink-0" />
                            <span>Size: {item.size}</span>
                          </div>
                        )}
                        {item.color && (
                          <div className="flex items-center gap-1">
                            <FaPalette className="w-3 h-3 shrink-0" />
                            <span>Color: {item.color}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <p className="font-semibold text-gray-900 text-sm sm:text-base">
                        ₦{item.total.toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {item.quantity} × ₦{item.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t border-gray-200 mt-4 sm:mt-6 pt-4 sm:pt-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal</span>
                  <span>₦{orderDetail.subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Shipping Fee</span>
                  <span>₦{orderDetail.shipping_fee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tax</span>
                  <span>₦{orderDetail.tax.toLocaleString()}</span>
                </div>
                <div className="border-t border-gray-200 pt-2 sm:pt-3">
                  <div className="flex justify-between text-base sm:text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₦{orderDetail.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Additional Info */}
        <div className="space-y-4 sm:space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center gap-3 mb-4 sm:mb-6">
              <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                Customer
              </h2>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center gap-3">
                <FaUser className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="font-medium text-gray-900 text-sm sm:text-base wrap-break-words">
                  {orderDetail.customer_name}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-gray-700 text-sm sm:text-base wrap-break-all">
                  {orderDetail.email}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <FaPhone className="w-4 h-4 text-gray-400 shrink-0" />
                <p className="text-gray-700 text-sm sm:text-base">
                  {orderDetail.phone}
                </p>
              </div>
              <div className="flex items-start gap-3">
                <FaMapMarkerAlt className="w-4 h-4 text-gray-400 mt-1 shrink-0" />
                <div className="min-w-0">
                  <p className="text-gray-700 text-sm sm:text-base wrap-break-words">
                    {orderDetail.address}
                  </p>
                  {orderDetail.room_number && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Room: {orderDetail.room_number}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Picker Information */}
          {orderDetail.picker && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <FaTruck className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Delivery Agent
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-3">
                  <FaUser className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="font-medium text-gray-900 text-sm sm:text-base wrap-break-words">
                    {orderDetail.picker.name}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <FaEnvelope className="w-4 h-4 text-gray-400 shrink-0" />
                  <p className="text-gray-700 text-sm sm:text-base wrap-break-all">
                    {orderDetail.picker.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Information */}
          {orderDetail.transaction && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-4 sm:mb-6">
                <FaCreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                  Payment Details
                </h2>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Transaction ID
                  </p>
                  <p className="font-mono text-xs sm:text-sm text-gray-900 wrap-break-all">
                    {orderDetail.transaction.transaction_id}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Payment Method
                  </p>
                  <p className="font-medium text-gray-900 text-sm sm:text-base">
                    {orderDetail.transaction.payment_method}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Status
                  </p>
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
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Payment Date
                  </p>
                  <p className="text-gray-900 text-xs sm:text-sm wrap-wrap-break-words">
                    {formatDate(orderDetail.transaction.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 mb-1">
                    Amount
                  </p>
                  <p className="font-bold text-base sm:text-lg text-gray-900">
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
