import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Package,
  MapPin,
  User,
  Phone,
  Clock,
  DollarSign,
  Calendar,
  Store,
  AlertCircle,
  CheckCircle,
  Loader2,
  Truck,
  Timer,
} from "lucide-react";
import api from "../constant/api";
import Swal from "sweetalert2";

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

const DeliveryDetails = () => {
  const { uniqueCode } = useParams();
  const navigate = useNavigate();
  const [opportunity, setOpportunity] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (uniqueCode) {
      fetchDeliveryDetails();
    }
  }, [uniqueCode]);

  const fetchDeliveryDetails = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`delivery-details/${uniqueCode}/`);
      setOpportunity(response.data);
      setError(null);
    } catch (error) {
      console.error("Error fetching delivery details:", error);
      setError(
        error.response?.data?.error ||
          "Failed to load delivery details. Please check the link and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "accepted":
        return "bg-green-100 text-green-800 border-green-200";
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-200";
      case "expired":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Timer className="w-4 h-4" />;
      case "accepted":
        return <CheckCircle className="w-4 h-4" />;
      case "cancelled":
      case "expired":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const handleAcceptDelivery = () => {
    if (opportunity && opportunity.can_accept) {
      navigate(`/accept-delivery/${uniqueCode}`);
    } else {
      Toast.fire({
        icon: "warning",
        title: "Cannot Accept",
        text: "This delivery opportunity is no longer available",
      });
    }
  };

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
        <div className="max-w-md mx-auto text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Delivery Not Found
          </h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!opportunity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Delivery Opportunity
              </h1>
              <p className="text-gray-600 mt-1">
                Order #{opportunity.order.order_number}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between mb-6">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusColor(
                opportunity.status
              )}`}
            >
              {getStatusIcon(opportunity.status)}
              <span className="ml-2 capitalize">{opportunity.status}</span>
            </span>

            <div className="text-sm text-gray-600">
              Code:{" "}
              <span className="font-mono font-semibold">
                {opportunity.opportunity_code}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Information Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Order Information
                </h2>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="flex items-center mb-3">
                      <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Order Date
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatDate(opportunity.order.created_at)}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center mb-3">
                      <DollarSign className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Order Value
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-green-600">
                      ₦{opportunity.order.total_amount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center mb-3">
                    <Store className="w-5 h-5 text-gray-400 mr-2" />
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                      Vendors
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {opportunity.order.vendors.map((vendor, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                      >
                        {vendor}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-4">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Truck className="w-5 h-5 mr-2" />
                  Delivery Details
                </h2>
              </div>

              <div className="p-6">
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center mb-3">
                      <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Pickup Location
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {opportunity.order.pickup_location}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center mb-3">
                      <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Delivery Address
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {opportunity.order.delivery_address}
                    </p>
                    {opportunity.order.room_number !== "Not specified" && (
                      <p className="text-sm text-gray-600 mt-1">
                        Room: {opportunity.order.room_number}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center mb-3">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        Customer
                      </span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {opportunity.order.customer_name}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center mt-1">
                      <Phone className="w-4 h-4 mr-1" />
                      {opportunity.order.customer_phone}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Panel */}
          <div className="space-y-6">
            {/* Availability Status */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Availability Status
              </h3>

              {opportunity.can_accept ? (
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-green-600 mb-2">
                    Available for Pickup
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    This delivery is ready to be accepted
                  </p>

                  <button
                    onClick={handleAcceptDelivery}
                    className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  >
                    Accept Delivery
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                  <h4 className="text-lg font-semibold text-red-600 mb-2">
                    No Longer Available
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    {opportunity.status === "accepted"
                      ? "This delivery has already been accepted by another rider"
                      : opportunity.status === "expired"
                      ? "This delivery opportunity has expired"
                      : "This delivery is no longer available"}
                  </p>

                  <button
                    onClick={() => navigate("/")}
                    className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    Go Home
                  </button>
                </div>
              )}
            </div>

            {/* Opportunity Info */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Opportunity Info
              </h3>

              <div className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Picker Type
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1 capitalize">
                    {opportunity.picker_info.type.replace("_", " ")}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Assigned To
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {opportunity.picker_info.name}
                  </p>
                </div>

                <div>
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Expires At
                  </span>
                  <p className="text-sm font-semibold text-gray-900 mt-1">
                    {formatDate(opportunity.expires_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryDetails;
