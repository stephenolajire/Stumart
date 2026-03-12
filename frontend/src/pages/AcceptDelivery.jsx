import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Package,
  ArrowLeft,
  Send,
} from "lucide-react";
import api from "../constant/api";
import Swal from "sweetalert2";

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

const AcceptDelivery = () => {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();

  // ✅ Only pickup_time needed from the form now
  const [pickupTime, setPickupTime] = useState("ASAP");
  const [opportunity, setOpportunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (uniqueCode) fetchOpportunityDetails();
  }, [uniqueCode]);

  const fetchOpportunityDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`order/delivery/accept/${uniqueCode}/`);
      setOpportunity(response.data);
      setError(null);

      if (!response.data.can_accept) {
        setError(
          response.data.status === "accepted"
            ? "This delivery has already been accepted by another rider"
            : response.data.status === "expired"
              ? "This delivery opportunity has expired"
              : "This delivery is no longer available",
        );
      }
    } catch (err) {
      setError(
        err.response?.data?.error ||
          "Failed to load delivery details. Please check the link and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      // ✅ Only send unique_code and pickup_time — backend derives everything else
      const response = await api.post("order/delivery/accept/", {
        unique_code: uniqueCode,
        pickup_time: pickupTime,
      });

      if (response.data.success) {
        setSuccess(true);
        Swal.fire({
          icon: "success",
          title: "Delivery Accepted Successfully!",
          html: `
            <div class="text-left">
              <p><strong>Order:</strong> ${response.data.order_number}</p>
              <p><strong>Rider:</strong> ${response.data.rider_name}</p>
              <p><strong>Phone:</strong> ${response.data.rider_phone}</p>
              <p><strong>Pickup Time:</strong> ${response.data.pickup_time}</p>
              ${
                response.data.other_opportunities_cancelled > 0
                  ? `<p class="text-sm text-gray-600 mt-2">
                      ${response.data.other_opportunities_cancelled} other opportunities were cancelled
                    </p>`
                  : ""
              }
            </div>
          `,
          showConfirmButton: true,
          confirmButtonText: "View My Deliveries",
          allowOutsideClick: false,
        }).then((result) => {
          if (result.isConfirmed) navigate("/");
        });
      }
    } catch (err) {
      let errorMessage = "Failed to accept delivery. Please try again.";
      if (err.response?.status === 409) {
        errorMessage =
          "This delivery has already been accepted by another rider";
      } else if (err.response?.status === 410) {
        errorMessage = "This delivery opportunity has expired";
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }

      Toast.fire({
        icon: "error",
        title: "Acceptance Failed",
        text: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <p className="text-lg text-gray-600 font-medium">
            Loading delivery details...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Cannot Accept Delivery
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate(`/delivery-details/${uniqueCode}`)}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              View Details
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Delivery Accepted!
          </h1>
          <p className="text-gray-600 mb-6">
            You have successfully accepted the delivery. The customer and system
            have been notified.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate("/my-deliveries")}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              View My Deliveries
            </button>
            <button
              onClick={() => navigate("/")}
              className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!opportunity?.can_accept) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(`/delivery-details/${uniqueCode}`)}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Details
          </button>
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
              <Package className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Accept Delivery
              </h1>
              <p className="text-gray-600 mt-1">
                Order #{opportunity.order.order_number}
              </p>
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="bg-linear-to-r from-blue-500 to-blue-600 px-6 py-4 rounded-t-2xl">
            <h2 className="text-xl font-semibold text-white">Order Summary</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Customer:</span>{" "}
                  {opportunity.order.customer_name}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Phone:</span>{" "}
                  {opportunity.order.customer_phone}
                </p>
              </div>
              <div>
                <p className="text-gray-600">
                  <span className="font-medium">Value:</span> ₦
                  {opportunity.order.total_amount.toLocaleString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Created:</span>{" "}
                  {formatDate(opportunity.order.created_at)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-gray-600">
                <span className="font-medium">Delivery Address:</span>{" "}
                {opportunity.order.delivery_address}
                {opportunity.order.room_number !== "Not specified" &&
                  `, Room ${opportunity.order.room_number}`}
              </p>
            </div>
          </div>
        </div>

        {/* ✅ Picker Info Card — shown from API response, not user input */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 mb-8">
          <div className="bg-linear-to-r from-indigo-500 to-indigo-600 px-6 py-4 rounded-t-2xl">
            <h2 className="text-xl font-semibold text-white">Your Details</h2>
          </div>
          <div className="p-6 space-y-3 text-sm">
            <div className="flex items-center text-gray-700">
              <User className="w-4 h-4 mr-3 text-indigo-500" />
              <span className="font-medium mr-2">Name:</span>
              {opportunity.picker_info.name}
            </div>
            <div className="flex items-center text-gray-700">
              <Phone className="w-4 h-4 mr-3 text-indigo-500" />
              <span className="font-medium mr-2">Phone:</span>
              {opportunity.picker_info.phone}
            </div>
            <div className="flex items-center text-gray-700">
              <Package className="w-4 h-4 mr-3 text-indigo-500" />
              <span className="font-medium mr-2">Type:</span>
              {opportunity.picker_info.type.replace("_", " ")}
            </div>
          </div>
        </div>

        {/* Acceptance Form — only pickup_time */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          <div className="bg-linear-to-r from-green-500 to-green-600 px-6 py-4 rounded-t-2xl">
            <h2 className="text-xl font-semibold text-white">
              Confirm Acceptance
            </h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pickup Time */}
              <div>
                <label
                  htmlFor="pickup_time"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  <Clock className="w-4 h-4 inline mr-2" />
                  Expected Pickup Time
                </label>
                <select
                  id="pickup_time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-colors"
                >
                  <option value="ASAP">ASAP (As Soon As Possible)</option>
                  <option value="Within 15 minutes">Within 15 minutes</option>
                  <option value="Within 30 minutes">Within 30 minutes</option>
                  <option value="Within 1 hour">Within 1 hour</option>
                  <option value="Within 2 hours">Within 2 hours</option>
                  <option value="Later today">Later today</option>
                </select>
              </div>

              {/* Important Notice */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 shrink-0" />
                  <div className="text-sm text-yellow-800">
                    <h4 className="font-medium mb-1">Important Notice</h4>
                    <ul className="list-disc list-inside space-y-1">
                      <li>
                        By accepting this delivery, you commit to complete it
                        professionally
                      </li>
                      <li>Contact the customer when you're on your way</li>
                      <li>Handle items with care and deliver on time</li>
                      <li>
                        All other pending opportunities for this order will be
                        cancelled
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => navigate(`/delivery-details/${uniqueCode}`)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-linear-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Accepting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      Accept Delivery
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Expiry Warning */}
        {opportunity && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <Clock className="w-5 h-5 text-blue-600 mr-3" />
              <div className="text-sm text-blue-800">
                <span className="font-medium">Expires:</span>{" "}
                {formatDate(opportunity.expires_at)}
                <span className="block text-xs mt-1">
                  This opportunity will expire automatically if not accepted in
                  time
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AcceptDelivery;
