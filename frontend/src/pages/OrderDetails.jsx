// OrderDetails.js
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Truck,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import api from "../constant/api";

export default function OrderDetails() {
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    shipping: true,
    payment: true,
  });

  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef();
  const queryClient = useQueryClient();

  // Fetch order details with TanStack Query
  const {
    data: orderData,
    isLoading: loading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["orderDetails", orderNumber],
    queryFn: async () => {
      if (!orderNumber) throw new Error("Order number is required");
      const response = await api.get(`orders/${orderNumber}/`);
      return response.data;
    },
    enabled: !!orderNumber,
    staleTime: 300000, // Consider data fresh for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error("Error fetching order details:", error);
    },
  });

  // Update order status mutation (if you have this functionality)
  const updateOrderMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await api.patch(`orders/${orderNumber}/`, updateData);
      return response.data;
    },
    onSuccess: (updatedOrder) => {
      // Update the cache with new data
      queryClient.setQueryData(["orderDetails", orderNumber], updatedOrder);

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["orders"], // If you have an orders list
      });
    },
    onError: (error) => {
      console.error("Error updating order:", error);
    },
  });

  // Cancel order mutation (if you have this functionality)
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`orders/${orderNumber}/cancel/`);
      return response.data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(["orderDetails", orderNumber], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      console.error("Error cancelling order:", error);
    },
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Enhanced print handler using useReactToPrint
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Order-${orderNumber}`,
    onBeforeGetContent: () => {
      // Ensure all sections are expanded for printing
      setExpandedSections({
        items: true,
        shipping: true,
        payment: true,
      });
    },
  });

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
  };

  // Cancel order handler
  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelOrderMutation.mutate();
    }
  };

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Get status class helper
  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "COMPLETED":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-blue-100 text-blue-800 border-blue-200";
    }
  };

  // Check if order can be cancelled
  const canCancelOrder = (status) => {
    const cancellableStatuses = ["PENDING", "PROCESSING"];
    return cancellableStatuses.includes(status?.toUpperCase());
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading order details...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <p className="text-gray-600 mb-6">
                {error.response?.status === 404
                  ? "Order not found"
                  : error.message ||
                    "Failed to load order details. Please try again later."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  onClick={handleRefresh}
                  disabled={isRefetching}
                >
                  {isRefetching ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Retrying...</span>
                    </>
                  ) : (
                    "Try Again"
                  )}
                </button>
                <button
                  className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
                  onClick={() => navigate(-1)}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  // Calculate total items
  const totalItems =
    orderData.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg" ref={componentRef}>
          {/* Order Header */}
          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <h1 className="text-3xl font-bold text-gray-900">
                  Order Details
                </h1>
                {isRefetching && (
                  <RefreshCw
                    size={20}
                    className="text-amber-500 animate-spin"
                  />
                )}
              </div>
              <span
                className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium border ${getStatusClass(
                  orderData.order_status
                )}`}
              >
                {orderData.order_status}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Number</p>
                <p className="font-semibold text-gray-900">
                  {orderData.order_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Order Date</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(orderData.created_at)}
                </p>
              </div>
              {orderData.updated_at &&
                orderData.updated_at !== orderData.created_at && (
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Last Updated</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(orderData.updated_at)}
                    </p>
                  </div>
                )}
            </div>
          </div>

          {/* Order Items Section */}
          <div className="border-b border-gray-200">
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection("items")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Package className="text-amber-500" size={20} />
                  <h2 className="text-xl font-bold text-gray-900">
                    Items ({totalItems})
                  </h2>
                </div>
                {expandedSections.items ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </div>
            </div>

            {expandedSections.items && (
              <div className="px-6 pb-6">
                <div className="space-y-4">
                  {orderData.order_items &&
                    orderData.order_items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start space-x-4 p-4 bg-gray-50 rounded-xl"
                      >
                        <img
                          src={item.product?.image || "/api/placeholder/80/80"}
                          alt={item.product?.name}
                          className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                          loading="lazy"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 mb-2">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-gray-600 mb-1">
                            Quantity: {item.quantity}
                          </p>
                          {item.size && (
                            <p className="text-sm text-gray-600 mb-1">
                              Size: {item.size}
                            </p>
                          )}
                          {item.color && (
                            <p className="text-sm text-gray-600 mb-1">
                              Color: {item.color}
                            </p>
                          )}
                          {item.vendor && (
                            <p className="text-sm text-amber-600">
                              Sold by: {item.vendor}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-bold text-gray-900 mb-1">
                            ₦{item.price.toFixed(2)}
                          </p>
                          <p className="text-sm text-gray-600">
                            Subtotal: ₦{(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Shipping Section */}
          <div className="border-b border-gray-200">
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection("shipping")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Truck className="text-amber-500" size={20} />
                  <h2 className="text-xl font-bold text-gray-900">
                    Shipping Details
                  </h2>
                </div>
                {expandedSections.shipping ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </div>
            </div>

            {expandedSections.shipping && (
              <div className="px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Shipping Method
                      </p>
                      <p className="font-semibold text-gray-900">
                        {orderData.shipping_method || "Standard Delivery"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Cost</p>
                      <p className="font-semibold text-gray-900">
                        ₦{orderData.shipping_fee.toFixed(2)}
                      </p>
                    </div>
                    {orderData.tracking_number && (
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Tracking Number
                        </p>
                        <p className="font-semibold text-gray-900">
                          {orderData.tracking_number}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">
                        Delivery Address
                      </p>
                      <p className="font-semibold text-gray-900">
                        {orderData.shipping?.address || orderData.address}
                      </p>
                      {(orderData.shipping?.room_number ||
                        orderData.room_number) && (
                        <p className="text-gray-600">
                          Room:{" "}
                          {orderData.shipping?.room_number ||
                            orderData.room_number}
                        </p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Contact</p>
                      <p className="font-semibold text-gray-900">
                        {orderData.shipping?.first_name || orderData.first_name}{" "}
                        {orderData.shipping?.last_name || orderData.last_name}
                      </p>
                      <p className="text-gray-600">
                        {orderData.shipping?.phone || orderData.phone}
                      </p>
                      <p className="text-gray-600">
                        {orderData.shipping?.email || orderData.email}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Payment Section */}
          <div>
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSection("payment")}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CreditCard className="text-amber-500" size={20} />
                  <h2 className="text-xl font-bold text-gray-900">
                    Payment Information
                  </h2>
                </div>
                {expandedSections.payment ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </div>
            </div>

            {expandedSections.payment && (
              <div className="px-6 pb-8">
                {orderData.transaction && (
                  <div className="mb-8 p-4 bg-gray-50 rounded-xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Payment Method
                        </p>
                        <p className="font-semibold text-gray-900">
                          {orderData.transaction.payment_method ||
                            "Online Payment"}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">
                          Transaction ID
                        </p>
                        <p className="font-semibold text-gray-900">
                          {orderData.transaction.transaction_id}
                        </p>
                      </div>
                      {orderData.transaction.payment_status && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">
                            Payment Status
                          </p>
                          <p className="font-semibold text-gray-900">
                            {orderData.transaction.payment_status}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-6">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Subtotal</p>
                      <p className="font-semibold text-gray-900">
                        ₦{orderData.subtotal.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Shipping</p>
                      <p className="font-semibold text-gray-900">
                        ₦{orderData.shipping_fee.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-gray-600">Tax</p>
                      <p className="font-semibold text-gray-900">
                        ₦{orderData.tax.toFixed(2)}
                      </p>
                    </div>
                    {orderData.discount && orderData.discount > 0 && (
                      <div className="flex justify-between items-center">
                        <p className="text-gray-600">Discount</p>
                        <p className="font-semibold text-green-600">
                          -₦{orderData.discount.toFixed(2)}
                        </p>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-3">
                      <div className="flex justify-between items-center">
                        <p className="text-lg font-bold text-gray-900">Total</p>
                        <p className="text-2xl font-bold text-amber-600">
                          ₦{orderData.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Order Actions - Outside the print area */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg transition-colors font-semibold"
            onClick={handlePrint}
          >
            Print Order
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            onClick={handleRefresh}
            disabled={isRefetching}
          >
            {isRefetching ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Refreshing...</span>
              </>
            ) : (
              "Refresh"
            )}
          </button>
          {canCancelOrder(orderData.order_status) && (
            <button
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCancelOrder}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
            onClick={() => navigate("/orders")}
          >
            Back to Orders
          </button>
          <button
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors"
            onClick={() => navigate("/contact")}
          >
            Need Help?
          </button>
        </div>
      </div>
    </div>
  );
}
