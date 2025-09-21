import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Package,
  MapPin,
  Phone,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader,
  Star,
  ThumbsUp,
} from "lucide-react";
import api from "../constant/api";

const CustomerOrderConfirmation = () => {
  const { customerConfirmationCode: urlCustomerCode } = useParams();
  const [customerCode, setCustomerCode] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Extract customer confirmation code from URL parameter or fallback to manual entry
  useEffect(() => {
    if (urlCustomerCode) {
      const code = decodeURIComponent(urlCustomerCode);
      setCustomerCode(code);
      fetchOrderDetails(code);
    } else {
      setError("Please enter your order confirmation code below.");
    }
  }, [urlCustomerCode]);

  const fetchOrderDetails = async (code) => {
    if (!code) return;

    setLoading(true);
    setError("");

    try {
      const customer_confirmation_code = code;
      const response = await api.get(
        `customer/confirm-order/${customer_confirmation_code}/`
      );
      const data = response.data;

      if (response.status === 200) {
        setOrderData(data);
        if (data.already_confirmed) {
          setConfirmed(true);
          setSuccess("This order has already been confirmed. Thank you!");
        }
      } else {
        setError(data.error || "Failed to fetch order details");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const confirmOrderReceipt = async () => {
    if (!customerCode) return;

    setConfirming(true);
    setError("");

    try {
      const response = await api.post("customer/confirm-order/", {
        customer_confirmation_code: customerCode,
      });

      const data = response.data;

      if (response.status === 200) {
        setSuccess(
          "Thank you for confirming your order! Payment has been processed to all parties."
        );
        setConfirmed(true);
        setOrderData((prev) => ({
          ...prev,
          can_confirm: false,
          already_confirmed: true,
          order_status: "COMPLETED",
        }));
      } else {
        setError(data.error || "Failed to confirm order receipt");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setConfirming(false);
    }
  };

  const handleCodeSubmit = () => {
    if (customerCode.trim()) {
      fetchOrderDetails(customerCode.trim());
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCurrency = (amount) => {
    return `₦${parseFloat(amount).toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Package className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Confirm Order Receipt
          </h1>
          <p className="text-gray-600">
            Please confirm that you have received your order
          </p>
        </div>

        {/* Code Input Form - Only show if no code in URL */}
        {!orderData && !loading && !urlCustomerCode && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Enter Order Confirmation Code
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Order Confirmation Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                  placeholder="Enter your order confirmation code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <button
                onClick={handleCodeSubmit}
                disabled={!customerCode.trim()}
                className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Check Order Details
              </button>
            </div>
          </div>
        )}

        {/* Loading State - Show when fetching initial data */}
        {loading && !orderData && (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
            <span className="ml-2 text-gray-600">Loading order details...</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
              <span className="text-green-700">{success}</span>
            </div>
          </div>
        )}

        {/* Order Details */}
        {orderData && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Order Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Delivery Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        orderData.opportunity_status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {orderData.opportunity_status?.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Order Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        orderData.order_status === "COMPLETED"
                          ? "bg-green-100 text-green-800"
                          : orderData.order_status === "DELIVERED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {orderData.order_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Confirmation Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Can Confirm:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        orderData.can_confirm
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {orderData.can_confirm ? "YES" : "NO"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Already Confirmed:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        orderData.already_confirmed
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {orderData.already_confirmed ? "YES" : "NO"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            {orderData.can_confirm && !confirmed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <div className="flex items-start">
                  <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3 mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                      Important Notice
                    </h3>
                    <p className="text-yellow-700 mb-3">
                      By confirming this order, you acknowledge that:
                    </p>
                    <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside">
                      <li>You have received your complete order</li>
                      <li>All items are in satisfactory condition</li>
                      <li>
                        Payment will be released to vendors and delivery
                        partners
                      </li>
                      <li>This action cannot be undone</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Order Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <Package className="w-6 h-6 text-yellow-500 mr-2" />
                Order Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Order Number
                    </label>
                    <p className="text-lg font-semibold text-gray-900">
                      {orderData.order.order_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Customer Name
                    </label>
                    <p className="text-gray-900">
                      {orderData.order.customer_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      {orderData.order.customer_phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Total Amount
                    </label>
                    <p className="text-lg font-semibold text-yellow-600">
                      {formatCurrency(orderData.order.total_amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Shipping Fee
                    </label>
                    <p className="text-gray-900">
                      {formatCurrency(orderData.order.shipping_fee)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Order Created
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      {formatDate(orderData.order.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <MapPin className="w-6 h-6 text-yellow-500 mr-2" />
                Delivery Address
              </h3>
              <div className="space-y-2">
                <p className="text-gray-900">
                  {orderData.order.delivery_address}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Room:</span>{" "}
                  {orderData.order.room_number}
                </p>
              </div>
            </div>

            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <User className="w-6 h-6 text-yellow-500 mr-2" />
                Delivery Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Delivered By
                    </label>
                    <p className="text-gray-900">{orderData.rider_info.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      {orderData.rider_info.phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Accepted At
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      {formatDate(orderData.rider_info.accepted_at)}
                    </p>
                  </div>
                  {orderData.delivered_at && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Delivered At
                      </label>
                      <p className="text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        {formatDate(orderData.delivered_at)}
                      </p>
                    </div>
                  )}
                  {orderData.rider_info.pickup_time && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Pickup Time
                      </label>
                      <p className="text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        {orderData.rider_info.pickup_time}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            {orderData.can_confirm && !confirmed && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Confirm Order Receipt
                </h3>
                <p className="text-gray-600 mb-6">
                  Please confirm that you have received your order and are
                  satisfied with the delivery. This will release payment to
                  vendors and delivery partners.
                </p>
                <button
                  onClick={confirmOrderReceipt}
                  disabled={confirming}
                  className="bg-yellow-500 text-white py-3 px-8 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center mx-auto"
                >
                  {confirming ? (
                    <>
                      <Loader className="w-5 h-5 mr-2 animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <ThumbsUp className="w-5 h-5 mr-2" />
                      Confirm Order Received
                    </>
                  )}
                </button>
                <p className="text-xs text-gray-500 mt-4">
                  By clicking confirm, you agree that you have received your
                  order in good condition
                </p>
              </div>
            )}

            {/* Already Confirmed Message */}
            {orderData.already_confirmed && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Order Already Confirmed
                </h3>
                <p className="text-green-700 mb-4">
                  Thank you! You have already confirmed receipt of this order.
                </p>
                <div className="bg-white rounded-lg p-4 border border-green-100">
                  <p className="text-green-800 font-medium mb-2">
                    What happens next:
                  </p>
                  <ul className="text-green-700 text-sm space-y-1 list-disc list-inside text-left">
                    <li>Payment has been released to vendors</li>
                    <li>Delivery partner has been compensated</li>
                    <li>
                      You can leave reviews for vendors and delivery service
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Cannot Confirm Message */}
            {!orderData.can_confirm && !orderData.already_confirmed && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                  Cannot Confirm Yet
                </h3>
                <p className="text-yellow-700 mb-4">
                  This order cannot be confirmed at this time.
                </p>
                <div className="bg-white rounded-lg p-4 border border-yellow-100">
                  <p className="text-yellow-800 font-medium mb-2">
                    Possible reasons:
                  </p>
                  <ul className="text-yellow-700 text-sm space-y-1 list-disc list-inside text-left">
                    <li>Order has not been delivered yet</li>
                    <li>Delivery confirmation is pending from rider</li>
                    <li>Order is still in transit</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Call to Action for Reviews */}
            {confirmed && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <Star className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-blue-800 mb-2">
                  Share Your Experience
                </h3>
                <p className="text-blue-700 mb-4">
                  Help other customers by rating your experience with the
                  vendors and delivery service.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    Rate Vendors
                  </button>
                  <button className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors">
                    Rate Delivery
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerOrderConfirmation;
