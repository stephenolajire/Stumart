// OrderHistory.jsx
import React, { useState, useRef, useContext } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useReactToPrint } from "react-to-print";
import api from "../constant/api";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import Spinner from "../components/Spinner";
import ReviewModal from "../components/ReviewModal";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";

const OrderHistory = () => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const printRefs = useRef({});
  const [reviewOrder, setReviewOrder] = useState(null);
  const navigate = useNavigate();
  const user_type = localStorage.getItem("user_type");

  const { isAuthenticated } = useContext(GlobalContext);
  const queryClient = useQueryClient();

  // Query for fetching orders
  const {
    data: orders = [],
    isLoading: loading,
    error,
    refetch: fetchOrders,
  } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const response = await api.get("orders/");
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });

  // Mutation for marking order as delivered
  const markAsDeliveredMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await api.post(`confirm/${orderId}/`, {
        status: "DELIVERED",
      });
      return response.data;
    },
    onSuccess: (data, orderId) => {
      // Update the cache optimistically
      queryClient.setQueryData(["orders"], (oldOrders) => {
        if (!oldOrders) return oldOrders;
        return oldOrders.map((order) =>
          order.order_number === orderId
            ? { ...order, order_status: "DELIVERED" }
            : order
        );
      });

      Swal.fire({
        icon: "success",
        text: "Thank you for your patronage!",
        title: "Order Delivered",
      });
    },
    onError: (error) => {
      console.error("Error marking order as delivered:", error);
      Swal.fire({
        icon: "error",
        title: "Status Error",
        text: "Order status failed, pls try again later",
      });
    },
  });

  // Mutation for canceling order
  const cancelOrderMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await api.post(`orders/${orderId}/cancel/`);
      return response.data;
    },
    onSuccess: (data, orderId) => {
      // Update the cache optimistically
      queryClient.setQueryData(["orders"], (oldOrders) => {
        if (!oldOrders) return oldOrders;
        return oldOrders.map((order) =>
          order.id === orderId ? { ...order, order_status: "CANCELLED" } : order
        );
      });

      Swal.fire({
        icon: "success",
        title: "Order Cancelled",
        text: "Your order has been cancelled successfully",
      });
    },
    onError: (error) => {
      console.error("Error cancelling order:", error);
      Swal.fire({
        icon: "error",
        title: "Cancellation Failed",
        text:
          error.response?.data?.message ||
          "Failed to cancel order. Please try again later.",
      });
    },
  });

  // Mutation for submitting reviews
  const submitReviewMutation = useMutation({
    mutationFn: async ({ orderId, reviews }) => {
      const order = orders.find((o) => o.id === orderId);
      const pickerId = order.picker?.profile_id;

      if (!pickerId) {
        throw new Error("This order doesn't have a picker assigned yet.");
      }

      // Get unique vendors from order items
      const uniqueVendors = new Set();
      order.order_items?.forEach((item) => {
        uniqueVendors.add(item.vendor_id);
      });

      // Submit review for each unique vendor with the same picker
      const reviewPromises = Array.from(uniqueVendors).map((vendorId) =>
        api.post(`submit-reviews/`, {
          order_id: orderId,
          vendor_id: vendorId,
          picker_id: pickerId,
          vendor_rating: reviews.vendor.rating,
          vendor_comment: reviews.vendor.comment,
          picker_rating: reviews.picker.rating,
          picker_comment: reviews.picker.comment,
        })
      );

      await Promise.all(reviewPromises);
      return { uniqueVendorsCount: uniqueVendors.size };
    },
    onSuccess: (data, { orderId }) => {
      // Update the cache optimistically
      queryClient.setQueryData(["orders"], (oldOrders) => {
        if (!oldOrders) return oldOrders;
        return oldOrders.map((order) =>
          order.id === orderId ? { ...order, reviewed: true } : order
        );
      });

      Swal.fire({
        icon: "success",
        title: "Thank you for your reviews!",
        text:
          data.uniqueVendorsCount > 1
            ? `Reviews submitted for ${data.uniqueVendorsCount} vendors and 1 picker.`
            : "Reviews submitted successfully!",
      });
    },
    onError: (error) => {
      console.error("Error submitting reviews:", error);
      Swal.fire({
        icon: "error",
        title: "Failed to submit reviews",
        text:
          error.response?.data?.error ||
          error.message ||
          "Please try again later",
      });
    },
  });

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const handleMarkAsDelivered = async (orderId) => {
    markAsDeliveredMutation.mutate(orderId);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      // Show confirmation dialog first
      const result = await Swal.fire({
        title: "Cancel Order?",
        text: "Are you sure you want to cancel this order? This action cannot be undone.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "var(--error)",
        cancelButtonColor: "var(--neutral-gray-400)",
        confirmButtonText: "Yes, cancel order",
        cancelButtonText: "No, keep order",
      });

      if (result.isConfirmed) {
        cancelOrderMutation.mutate(orderId);
      }
    } catch (error) {
      console.error("Error in cancel order handler:", error);
    }
  };

  const handleReviewSubmit = async (reviews) => {
    if (!reviewOrder) return;

    submitReviewMutation.mutate(
      { orderId: reviewOrder.id, reviews },
      {
        onSuccess: () => {
          setReviewOrder(null);
        },
      }
    );
  };

  const getStatusClass = (status) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "COMPLETED":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Fix: Create a separate print handler for each order
  const handlePrint = (orderId) => {
    const printHandler = useReactToPrint({
      content: () => printRefs.current[orderId],
    });
    printHandler();
  };

  // Pagination logic
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders?.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center pt-40">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-6 py-4 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-2">Error</h2>
          <p>{error.message || "An error occurred while fetching orders"}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-lg shadow-lg p-8 max-w-md mx-4">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
              <svg
                className="w-12 h-12 text-amber-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Orders Yet
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't placed any orders yet. Start shopping to see your
              orders here!
            </p>
            <Link
              to="/products"
              className="inline-block bg-amber-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-amber-600 transition-colors duration-200 shadow-md"
            >
              Shop Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4">
      <Header title="Order History" />

      <div className="w-full mx-auto space-y-6">
        {currentOrders.map((order) => (
          <div
            key={order.order_number}
            className="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div
              className="p-6 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
              onClick={() => toggleOrderDetails(order.order_number)}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Order #:</span>
                    <span className="text-amber-600 font-semibold">
                      {order.order_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">Date:</span>
                    <span className="text-gray-600">
                      {formatDate(order.created_at)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusClass(
                      order.order_status
                    )}`}
                  >
                    {order.order_status}
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">
                      Total:{" "}
                    </span>
                    <span className="text-lg font-bold text-amber-600">
                      ₦{order.total.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-center md:justify-end">
                  <div className="w-8 h-8 flex items-center justify-center bg-amber-100 rounded-full text-amber-600 font-bold text-lg">
                    {expandedOrder === order.order_number ? "−" : "+"}
                  </div>
                </div>
              </div>
            </div>

            {expandedOrder === order.order_number && (
              <div
                className="border-t border-gray-200 p-6 bg-gray-50"
                ref={(el) => (printRefs.current[order.order_number] = el)}
              >
                {/* Shipping Details */}
                <div className="bg-white rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Shipping Details
                  </h3>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Name: </span>
                      <span className="text-gray-600">
                        {order.shipping.first_name} {order.shipping.last_name}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Email: </span>
                      <span className="text-gray-600">
                        {order.shipping.email}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Phone: </span>
                      <span className="text-gray-600">
                        {order.shipping.phone}
                      </span>
                    </div>
                    <div className="md:col-span-2">
                      <span className="font-medium text-gray-700">
                        Address:{" "}
                      </span>
                      <span className="text-gray-600">
                        {order.shipping.address}
                      </span>
                    </div>
                    {order.shipping.room_number && (
                      <div>
                        <span className="font-medium text-gray-700">
                          Room/Apt:{" "}
                        </span>
                        <span className="text-gray-600">
                          {order.shipping.room_number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Order Items */}
                <div className="bg-white rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <svg
                      className="w-5 h-5 mr-2 text-amber-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                    Order Items
                  </h3>
                  <div className="space-y-4">
                    {order.order_items &&
                      order.order_items.map((item) => (
                        <div
                          key={item.id}
                          className="flex gap-4 p-3 border rounded-lg bg-gray-50"
                        >
                          <div className="flex-shrink-0">
                            {item.product.image ? (
                              <img
                                src={item.product.image}
                                alt={item.product.name}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center text-xs text-gray-500">
                                No Image
                              </div>
                            )}
                          </div>

                          <div className="flex-grow">
                            <h4 className="font-semibold text-gray-800 mb-1">
                              {item.product.name}
                            </h4>
                            <p className="text-sm text-amber-600 mb-2">
                              Sold by: {item.vendor}
                            </p>
                            {item.size && (
                              <p className="text-sm text-gray-600">
                                Size: {item.size}
                              </p>
                            )}
                            {item.color && (
                              <p className="text-sm text-gray-600">
                                Color: {item.color}
                              </p>
                            )}
                            <div className="flex justify-between items-center mt-2">
                              <p className="font-semibold text-amber-600">
                                ₦{item.price.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-600">
                                Qty: {item.quantity}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-lg p-4 mb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Order Summary
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal:</span>
                      <span className="text-gray-800">
                        ₦{order.subtotal.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping:</span>
                      <span className="text-gray-800">
                        ₦{order.shipping_fee.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tax:</span>
                      <span className="text-gray-800">
                        ₦{order.tax.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="font-semibold text-gray-800">
                        Total:
                      </span>
                      <span className="font-bold text-amber-600 text-lg">
                        ₦{order.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Actions */}
                <div className="flex flex-wrap gap-3">
                  {order.order_status.toUpperCase() === "COMPLETED" &&
                    (order.reviewed ? (
                      <span className="inline-flex items-center px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-lg">
                        <svg
                          className="w-4 h-4 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Reviewed
                      </span>
                    ) : (
                      <button
                        className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => setReviewOrder(order)}
                        disabled={submitReviewMutation.isPending}
                      >
                        {submitReviewMutation.isPending
                          ? "Submitting..."
                          : "Write Review"}
                      </button>
                    ))}

                  {order.order_status.toUpperCase() === "DELIVERED" &&
                    !order.confirm && (
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={() => handleMarkAsDelivered(order.id)}
                        disabled={markAsDeliveredMutation.isPending}
                      >
                        {markAsDeliveredMutation.isPending
                          ? "Confirming..."
                          : "Confirm"}
                      </button>
                    )}

                  {order.order_status.toUpperCase() === "PENDING" && (
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={cancelOrderMutation.isPending}
                    >
                      {cancelOrderMutation.isPending
                        ? "Cancelling..."
                        : "Cancel Order"}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Component */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8 space-x-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            &laquo; Prev
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    currentPage === number
                      ? "bg-amber-500 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-amber-50 hover:text-amber-600"
                  }`}
                >
                  {number}
                </button>
              )
            )}
          </div>

          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Next &raquo;
          </button>
        </div>
      )}

      <ReviewModal
        isOpen={!!reviewOrder}
        onClose={() => setReviewOrder(null)}
        onSubmit={handleReviewSubmit}
        order={reviewOrder || {}}
      />
    </div>
  );
};

export default OrderHistory;
