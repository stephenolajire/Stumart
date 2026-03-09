import React, { useState, useRef, useContext } from "react";
import Swal from "sweetalert2";
import { Link } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import Spinner from "../components/Spinner";
import ReviewModal from "../components/ReviewModal";
import {
  FaBox,
  FaMapMarkerAlt,
  FaShoppingBag,
  FaCheckCircle,
  FaTimes,
  FaChevronDown,
  FaChevronUp,
  FaStar,
  FaCheck,
  FaClock,
  FaTruck,
  FaExclamationTriangle,
  FaCreditCard,
  FaCalendar,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { useGetOrderHistory, useInitializePayment } from "../hooks/useOrder";
import {
  useCreateVendorReview,
  useCreatePickerReview,
} from "../hooks/useStumart";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../constant/api";

const OrderHistory = () => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const printRefs = useRef({});
  const [reviewOrder, setReviewOrder] = useState(null);
  const navigate = useNavigate();

  const { isAuthenticated } = useContext(GlobalContext);
  const queryClient = useQueryClient();

  // ── Queries ───────────────────────────────────────────────────
  const { data: orders = [], isLoading: loading, error } = useGetOrderHistory();

  // ── Mutations ─────────────────────────────────────────────────
  const submitVendorReviewMutation = useCreateVendorReview();
  const submitPickerReviewMutation = useCreatePickerReview();
  const initializePaymentMutation = useInitializePayment();

  const markAsDeliveredMutation = useMutation({
    mutationFn: async (orderId) => {
      const response = await api.post(`confirm/${orderId}/`, {
        status: "DELIVERED",
      });
      return response.data;
    },
    onSuccess: (data, orderId) => {
      queryClient.setQueryData(["order-history"], (oldOrders) => {
        if (!oldOrders) return oldOrders;
        return oldOrders.map((order) =>
          order.order_number === orderId
            ? { ...order, order_status: "DELIVERED" }
            : order,
        );
      });
      Swal.fire({
        icon: "success",
        text: "Thank you for your patronage!",
        title: "Order Delivered",
        confirmButtonColor: "#111827",
      });
    },
    onError: () => {
      Swal.fire({
        icon: "error",
        title: "Status Error",
        text: "Order status failed, please try again later",
        confirmButtonColor: "#111827",
      });
    },
  });

  // ── Handlers ──────────────────────────────────────────────────
  const toggleOrderDetails = (orderId) =>
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));

  const handleMarkAsDelivered = (orderId) =>
    markAsDeliveredMutation.mutate(orderId);

  const handleContinuePayment = (order) => {
    localStorage.setItem("order_id", order.id);
    initializePaymentMutation.mutate(
      {
        order_id: order.id,
        email: order.shipping.email,
        amount: order.total * 100,
        callback_url: `${window.location.origin}/payment/verify/`,
      },
      {
        onSuccess: (data) => {
          window.location.href = data.authorization_url;
        },
        onError: (error) => {
          Swal.fire({
            icon: "error",
            title: "Payment Error",
            text:
              error.response?.data?.message ||
              "Failed to initialize payment. Please try again.",
            confirmButtonColor: "#111827",
          });
        },
      },
    );
  };

  const handleReviewSubmit = (reviews) => {
    if (!reviewOrder) return;

    const order = reviewOrder;
    const pickerId = order.picker?.profile_id;

    if (!pickerId) {
      Swal.fire({
        icon: "error",
        title: "No Picker Assigned",
        text: "This order doesn't have a picker assigned yet.",
        confirmButtonColor: "#111827",
      });
      return;
    }

    const uniqueVendorIds = [
      ...new Set(
        order.order_items?.map((item) => item.vendor_id).filter(Boolean),
      ),
    ];

    if (uniqueVendorIds.length === 0) {
      Swal.fire({
        icon: "error",
        title: "No Vendors Found",
        text: "Could not find vendors for this order.",
        confirmButtonColor: "#111827",
      });
      return;
    }

    // ✅ Fields match VendorReviewSerializer: order, vendor, rating, comment
    const vendorReviewPromises = uniqueVendorIds.map((vendorId) =>
      submitVendorReviewMutation.mutateAsync({
        order: order.id, // ✅ not order_id
        vendor: vendorId, // ✅ not vendor_id
        rating: reviews.vendor.rating,
        comment: reviews.vendor.comment,
      }),
    );

    // ✅ Fields match PickerReviewSerializer: order, picker, rating, comment
    const pickerReviewPromise = submitPickerReviewMutation.mutateAsync({
      order: order.id, // ✅ not order_id
      picker: pickerId, // ✅ not picker_id
      rating: reviews.picker.rating,
      comment: reviews.picker.comment,
    });

    Promise.all([...vendorReviewPromises, pickerReviewPromise])
      .then(() => {
        queryClient.setQueryData(["order-history"], (oldOrders) => {
          if (!oldOrders) return oldOrders;
          return oldOrders.map((o) =>
            o.id === order.id ? { ...o, reviewed: true } : o,
          );
        });
        setReviewOrder(null);
        Swal.fire({
          icon: "success",
          title: "Thank you for your reviews!",
          text:
            uniqueVendorIds.length > 1
              ? `Reviews submitted for ${uniqueVendorIds.length} vendors and 1 picker.`
              : "Reviews submitted successfully!",
          confirmButtonColor: "#111827",
        });
      })
      .catch((error) => {
        Swal.fire({
          icon: "error",
          title: "Failed to submit reviews",
          text:
            error.response?.data?.error ||
            error.message ||
            "Please try again later",
          confirmButtonColor: "#111827",
        });
      });
  };

  // ── Helpers ───────────────────────────────────────────────────
  const getStatusConfig = (status) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return {
          class: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <FaClock className="w-3 h-3" />,
        };
      case "PROCESSING":
        return {
          class: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <FaTruck className="w-3 h-3" />,
        };
      case "SHIPPED":
        return {
          class: "bg-indigo-100 text-indigo-700 border-indigo-200",
          icon: <FaTruck className="w-3 h-3" />,
        };
      case "DELIVERED":
        return {
          class: "bg-green-100 text-green-700 border-green-200",
          icon: <FaCheck className="w-3 h-3" />,
        };
      case "CANCELLED":
        return {
          class: "bg-red-100 text-red-700 border-red-200",
          icon: <FaTimes className="w-3 h-3" />,
        };
      case "COMPLETED":
        return {
          class: "bg-purple-100 text-purple-700 border-purple-200",
          icon: <FaCheckCircle className="w-3 h-3" />,
        };
      default:
        return {
          class: "bg-gray-100 text-gray-700 border-gray-200",
          icon: <FaClock className="w-3 h-3" />,
        };
    }
  };

  const formatDate = (dateString) =>
    new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(dateString));

  const isReviewSubmitting =
    submitVendorReviewMutation.isPending ||
    submitPickerReviewMutation.isPending;

  // ── Pagination ────────────────────────────────────────────────
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // ── Early returns ─────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-28">
        <Spinner />
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-28">
        <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-7xl text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaExclamationTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-sm text-gray-600">
            {error.message || "An error occurred while fetching orders"}
          </p>
        </div>
      </div>
    );

  if (orders.length === 0)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 pt-28">
        <div className="text-center bg-white rounded-xl border border-gray-200 p-8 max-w-md">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <FaShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            No Orders Yet
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6">
            You haven't placed any orders yet. Start shopping to see your orders
            here!
          </p>
          <Link
            to="/products"
            className="inline-block bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors text-sm"
          >
            Shop Now
          </Link>
        </div>
      </div>
    );

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pt-28 md:pt-4 pb-10 px-4 sm:px-6">
      <Header title="Order History" />

      <div className="w-full mx-auto space-y-4">
        {currentOrders.map((order) => {
          const statusConfig = getStatusConfig(order.order_status);

          return (
            <div
              key={order.order_number}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Order Header */}
              <div
                className="p-5 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleOrderDetails(order.order_number)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="hidden sm:flex w-12 h-12 bg-gray-900 rounded-lg items-center justify-center flex-shrink-0">
                      <FaBox className="w-6 h-6 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                          #{order.order_number}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${statusConfig.class}`}
                        >
                          {statusConfig.icon}
                          <span className="hidden sm:inline">
                            {order.order_status}
                          </span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FaCalendar className="w-3 h-3" />
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                    <div className="text-right">
                      <div className="text-xs text-gray-500 mb-0.5">Total</div>
                      <div className="font-bold text-gray-900 text-base sm:text-lg">
                        ₦{order.total.toLocaleString()}
                      </div>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full text-gray-700 hover:bg-gray-200 transition-colors">
                      {expandedOrder === order.order_number ? (
                        <FaChevronUp className="w-4 h-4" />
                      ) : (
                        <FaChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Details */}
              {expandedOrder === order.order_number && (
                <div
                  className="border-t border-gray-200 bg-gray-50"
                  ref={(el) => (printRefs.current[order.order_number] = el)}
                >
                  <div className="p-5 grid lg:grid-cols-3 gap-4">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-4">
                      {/* Shipping Details */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FaMapMarkerAlt className="w-4 h-4 text-gray-600" />
                          Shipping Details
                        </h3>
                        <div className="grid sm:grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Name:</span>
                            <span className="ml-2 text-gray-900 font-medium">
                              {order.shipping.first_name}{" "}
                              {order.shipping.last_name}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Phone:</span>
                            <span className="ml-2 text-gray-900 font-medium">
                              {order.shipping.phone}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Email:</span>
                            <span className="ml-2 text-gray-900 font-medium break-all">
                              {order.shipping.email}
                            </span>
                          </div>
                          <div className="sm:col-span-2">
                            <span className="text-gray-500">Address:</span>
                            <span className="ml-2 text-gray-900 font-medium break-words">
                              {order.shipping.address}
                              {order.shipping.room_number &&
                                ` (Room: ${order.shipping.room_number})`}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Order Items */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <FaBox className="w-4 h-4 text-gray-600" />
                          Items ({order.order_items?.length || 0})
                        </h3>
                        <div className="space-y-3">
                          {order.order_items?.map((item) => (
                            <div
                              key={item.id}
                              className="flex gap-3 pb-3 border-b border-gray-100 last:border-0 last:pb-0"
                            >
                              <div className="flex-shrink-0">
                                {item.product.image ? (
                                  <img
                                    src={item.product.image}
                                    alt={item.product.name}
                                    className="w-14 h-14 object-cover rounded-md"
                                  />
                                ) : (
                                  <div className="w-14 h-14 bg-gray-100 rounded-md flex items-center justify-center">
                                    <FaBox className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-gray-900 text-sm mb-1 line-clamp-1">
                                  {item.product.name}
                                </h4>
                                <p className="text-xs text-gray-500 mb-1">
                                  By: {item.vendor}
                                </p>
                                <div className="flex items-center justify-between">
                                  <div className="text-xs text-gray-600">
                                    {item.size && (
                                      <span>Size: {item.size}</span>
                                    )}
                                    {item.size && item.color && (
                                      <span className="mx-1">•</span>
                                    )}
                                    {item.color && (
                                      <span>Color: {item.color}</span>
                                    )}
                                  </div>
                                  <div className="text-xs font-medium text-gray-900">
                                    Qty: {item.quantity}
                                  </div>
                                </div>
                                <div className="mt-1 font-semibold text-gray-900 text-sm">
                                  ₦{item.price.toLocaleString()}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Right Column */}
                    <div className="space-y-4">
                      {/* Summary */}
                      <div className="bg-white rounded-lg border border-gray-200 p-4">
                        <h3 className="text-sm font-semibold text-gray-900 mb-3">
                          Summary
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Subtotal</span>
                            <span className="text-gray-900 font-medium">
                              ₦{order.subtotal.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Shipping</span>
                            <span className="text-gray-900 font-medium">
                              ₦{order.shipping_fee.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Tax</span>
                            <span className="text-gray-900 font-medium">
                              ₦{order.tax.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                            <span className="font-semibold text-gray-900">
                              Total
                            </span>
                            <span className="font-bold text-gray-900 text-base">
                              ₦{order.total.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        {order.order_status.toUpperCase() === "COMPLETED" &&
                          (order.reviewed ? (
                            <div className="flex items-center justify-center gap-2 px-4 py-2.5 bg-green-50 text-green-700 text-xs font-medium rounded-lg border border-green-200">
                              <FaCheckCircle className="w-4 h-4" />
                              Reviewed
                            </div>
                          ) : (
                            <button
                              className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
                              onClick={() => setReviewOrder(order)}
                              disabled={isReviewSubmitting}
                            >
                              <FaStar className="w-4 h-4" />
                              {isReviewSubmitting
                                ? "Submitting..."
                                : "Write Review"}
                            </button>
                          ))}

                        {order.order_status.toUpperCase() === "DELIVERED" &&
                          !order.confirm && (
                            <button
                              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
                              onClick={() => handleMarkAsDelivered(order.id)}
                              disabled={markAsDeliveredMutation.isPending}
                            >
                              <FaCheck className="w-4 h-4" />
                              {markAsDeliveredMutation.isPending
                                ? "Confirming..."
                                : "Confirm Delivery"}
                            </button>
                          )}

                        {order.order_status.toUpperCase() === "PENDING" && (
                          <button
                            className="w-full flex items-center justify-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors disabled:opacity-50 text-xs"
                            onClick={() => handleContinuePayment(order)}
                            disabled={initializePaymentMutation.isPending}
                          >
                            <FaCreditCard className="w-4 h-4" />
                            {initializePaymentMutation.isPending
                              ? "Processing..."
                              : "Continue Payment"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8 gap-2">
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Prev
          </button>
          <div className="flex gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === number
                      ? "bg-gray-900 text-white"
                      : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {number}
                </button>
              ),
            )}
          </div>
          <button
            onClick={() => paginate(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
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
