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
} from "lucide-react";
import api from "../constant/api";

const DeliveryConfirmation = () => {
  const { deliveryCode: urlDeliveryCode } = useParams();
  const [deliveryCode, setDeliveryCode] = useState("");
  const [deliveryData, setDeliveryData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  // Extract delivery code from URL parameter or fallback to manual entry
  useEffect(() => {
    if (urlDeliveryCode) {
      const code = decodeURIComponent(urlDeliveryCode);
      setDeliveryCode(code);
      fetchDeliveryDetails(code);
    } else {
      // No code in URL, user needs to enter manually
      setError("Please enter your delivery confirmation code below.");
    }
  }, [urlDeliveryCode]);

  const fetchDeliveryDetails = async (code) => {
    if (!code) return;

    setLoading(true);
    setError("");

    const delivery_confirmation_code = code;

    try {
      const response = await api.get(
        `delivery/confirm/${delivery_confirmation_code}/`
      );
      const data = response.data;

      if (response.status === 200) {
        setDeliveryData(data);
      } else {
        setError(data.error || "Failed to fetch delivery details");
      }
    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelivery = async () => {
    if (!deliveryCode) return;

    setConfirming(true);
    setError("");

    try {
      const response = await api.post("delivery/confirm/", {
        delivery_confirmation_code: deliveryCode,
      });

      if (response.status === 200) {
        const data = response.data;
        setSuccess(
          `Delivery confirmed successfully! Customer confirmation code: ${data.customer_confirmation_code}`
        );
        setConfirmed(true);
        setDeliveryData((prev) => ({
          ...prev,
          can_confirm: false,
          opportunity_status: "completed",
          order_status: "DELIVERED",
        }));
      } else {
        const data = response.data;
        setError(data.error || "Failed to confirm delivery");
      }

    } catch (err) {
      setError("Network error. Please check your connection.");
    } finally {
      setConfirming(false);
    }
  };

  const handleCodeSubmit = () => {
    if (deliveryCode.trim()) {
      fetchDeliveryDetails(deliveryCode.trim());
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
            Delivery Confirmation
          </h1>
          <p className="text-gray-600">
            Confirm successful delivery of your order
          </p>
        </div>

        {/* Code Input Form - Only show if no code in URL */}
        {!deliveryData && !loading && !urlDeliveryCode && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Enter Delivery Confirmation Code
            </h2>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="code"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Delivery Confirmation Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={deliveryCode}
                  onChange={(e) => setDeliveryCode(e.target.value)}
                  placeholder="Enter your delivery confirmation code"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                />
              </div>
              <button
                onClick={handleCodeSubmit}
                disabled={!deliveryCode.trim()}
                className="w-full bg-yellow-500 text-white py-3 px-6 rounded-lg font-semibold hover:bg-yellow-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Check Delivery Details
              </button>
            </div>
          </div>
        )}

        {/* Loading State - Show when fetching initial data */}
        {loading && !deliveryData && (
          <div className="flex justify-center items-center py-12">
            <Loader className="w-8 h-8 text-yellow-500 animate-spin" />
            <span className="ml-2 text-gray-600">
              Loading delivery details...
            </span>
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

        {/* Delivery Details */}
        {deliveryData && (
          <div className="space-y-6">
            {/* Status Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Delivery Status
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Opportunity Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        deliveryData.opportunity_status === "completed"
                          ? "bg-green-100 text-green-800"
                          : deliveryData.opportunity_status === "accepted"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {deliveryData.opportunity_status.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Order Status:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        deliveryData.order_status === "DELIVERED"
                          ? "bg-green-100 text-green-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {deliveryData.order_status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Confirmation
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Can Confirm:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        deliveryData.can_confirm
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {deliveryData.can_confirm ? "YES" : "NO"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {deliveryData.can_confirm
                      ? "Ready for delivery confirmation"
                      : "Cannot confirm delivery at this time"}
                  </p>
                </div>
              </div>
            </div>

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
                      {deliveryData.order.order_number}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Customer Name
                    </label>
                    <p className="text-gray-900">
                      {deliveryData.order.customer_name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      {deliveryData.order.customer_phone}
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Total Amount
                    </label>
                    <p className="text-lg font-semibold text-yellow-600">
                      {formatCurrency(deliveryData.order.total_amount)}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Order Created
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-500" />
                      {formatDate(deliveryData.order.created_at)}
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
                  {deliveryData.order.delivery_address}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Room:</span>{" "}
                  {deliveryData.order.room_number}
                </p>
              </div>
            </div>

            {/* Rider Information */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                <User className="w-6 h-6 text-yellow-500 mr-2" />
                Rider Information
              </h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Rider Name
                    </label>
                    <p className="text-gray-900">
                      {deliveryData.rider_info.name}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Phone Number
                    </label>
                    <p className="text-gray-900 flex items-center">
                      <Phone className="w-4 h-4 mr-2 text-gray-500" />
                      {deliveryData.rider_info.phone}
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
                      {formatDate(deliveryData.rider_info.accepted_at)}
                    </p>
                  </div>
                  {deliveryData.rider_info.pickup_time && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Pickup Time
                      </label>
                      <p className="text-gray-900 flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-gray-500" />
                        {formatDate(deliveryData.rider_info.pickup_time)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Confirmation Button */}
            {deliveryData.can_confirm && !confirmed && (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <h3 className="text-xl font-semibold mb-4 text-gray-800">
                  Confirm Delivery
                </h3>
                <p className="text-gray-600 mb-6">
                  Click the button below to confirm that this order has been
                  successfully delivered.
                </p>
                <button
                  onClick={confirmDelivery}
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
                      <CheckCircle className="w-5 h-5 mr-2" />
                      Confirm Delivery
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Already Confirmed Message */}
            {!deliveryData.can_confirm &&
              deliveryData.order_status === "DELIVERED" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    Delivery Already Confirmed
                  </h3>
                  <p className="text-green-700">
                    This order has already been marked as delivered and
                    confirmed.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliveryConfirmation;
