import React, { useState, useCallback, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { Link } from "react-router-dom";
import {
  FaSearch,
  FaSpinner,
  FaEye,
  FaCheck,
  FaClock,
  FaTruck,
  FaShippingFast,
  FaTimes,
  FaBox,
  FaExclamationTriangle,
  FaMousePointer,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaDollarSign,
} from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import { useOrders } from "./hooks/useOrders";

const Orders = ({ onSelectOrder }) => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  // Debounce search input for better performance
  const debouncedSearch = useDebouncedCallback((value) => {
    setDebouncedQuery(value);
  }, 500);

  // Update debounced query when query changes
  React.useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  // Memoize filters to prevent unnecessary re-renders
  const filters = useMemo(
    () => ({
      query: debouncedQuery.trim(),
      status,
    }),
    [debouncedQuery, status]
  );

  // Fetch orders with current filters
  const {
    data: orders = [],
    isLoading,
    error,
    isError,
    isFetching,
    refetch,
    isRefetching,
  } = useOrders(filters);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    // The debounced search will handle the actual filtering
  }, []);

  const clearFilters = useCallback(() => {
    setQuery("");
    setStatus("");
    setDebouncedQuery("");
  }, []);

  const getStatusConfig = useCallback((status) => {
    switch (status) {
      case "COMPLETED":
        return {
          color: "bg-emerald-500 text-white",
          bgColor: "bg-emerald-50",
          textColor: "text-emerald-700",
          icon: <FaCheck className="w-3 h-3" />,
        };
      case "PENDING":
        return {
          color: "bg-amber-500 text-white",
          bgColor: "bg-amber-50",
          textColor: "text-amber-700",
          icon: <FaClock className="w-3 h-3" />,
        };
      case "IN_TRANSIT":
        return {
          color: "bg-blue-500 text-white",
          bgColor: "bg-blue-50",
          textColor: "text-blue-700",
          icon: <FaTruck className="w-3 h-3" />,
        };
      case "DELIVERED":
        return {
          color: "bg-purple-500 text-white",
          bgColor: "bg-purple-50",
          textColor: "text-purple-700",
          icon: <FaShippingFast className="w-3 h-3" />,
        };
      case "CANCELLED":
        return {
          color: "bg-red-500 text-white",
          bgColor: "bg-red-50",
          textColor: "text-red-700",
          icon: <FaTimes className="w-3 h-3" />,
        };
      default:
        return {
          color: "bg-gray-500 text-white",
          bgColor: "bg-gray-50",
          textColor: "text-gray-700",
          icon: <FaClock className="w-3 h-3" />,
        };
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }, []);

  if (isLoading && !orders.length) return <LoadingSpinner />;

  if (isError) {
    return (
      <div className="min-h-96 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Orders
          </h3>
          <p className="text-gray-600 mb-8">
            There was an error loading the orders. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
          >
            {/* <FaRefresh className="w-4 h-4 mr-2" /> */}
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="mt-2 text-gray-600">
            Monitor and manage all customer orders
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 transition-colors duration-200"
        >
          {isRefetching ? (
            <FaSpinner className="animate-spin w-4 h-4 mr-2" />
          ) : (
            // <FaRefresh className="w-4 h-4 mr-2" />
            <p>Refresh</p>
          )}
          {isRefetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Orders</p>
              <p className="text-3xl font-bold">{orders.length}</p>
            </div>
            <FaBox className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Completed</p>
              <p className="text-3xl font-bold">
                {orders.filter((o) => o.status === "COMPLETED").length}
              </p>
            </div>
            <FaCheck className="w-8 h-8 text-emerald-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-amber-100 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold">
                {orders.filter((o) => o.status === "PENDING").length}
              </p>
            </div>
            <FaClock className="w-8 h-8 text-amber-200" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">In Transit</p>
              <p className="text-3xl font-bold">
                {orders.filter((o) => o.status === "IN_TRANSIT").length}
              </p>
            </div>
            <FaTruck className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <FaFilter className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900">
            Filter & Search
          </h3>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by order number, customer..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 focus:bg-white transition-all duration-200"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-gray-50 focus:bg-white transition-all duration-200"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_TRANSIT">In Transit</option>
              <option value="DELIVERED">Delivered</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-6 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors duration-200"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        {isFetching && !isRefetching && (
          <div className="flex items-center justify-center py-4 mt-4 border-t border-gray-100">
            <FaSpinner className="animate-spin w-5 h-5 mr-3 text-yellow-500" />
            <span className="text-gray-600 font-medium">
              Searching orders...
            </span>
          </div>
        )}
      </div>

      {/* Orders Grid */}
      <div className="grid gap-6">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-gray-100">
            <div className="w-24 h-24 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FaBox className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-500">
              {isFetching
                ? "Searching for orders..."
                : "No orders match your current filters."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const dateTime = formatDate(order.created_at);

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-xl flex items-center justify-center text-white font-bold">
                          #{order.order_number.slice(-3)}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">
                            Order #{order.order_number}
                          </h3>
                          <div className="flex items-center text-sm text-gray-500 gap-4">
                            <span className="flex items-center gap-1">
                              <FaUser className="w-3 h-3" />
                              {order.customer_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <FaCalendarAlt className="w-3 h-3" />
                              {dateTime.date} at {dateTime.time}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium text-sm ${statusConfig.color}`}
                      >
                        {statusConfig.icon}
                        {order.status.replace("_", " ")}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                          <FaBox className="w-4 h-4" />
                          Items
                        </div>
                        <p className="font-semibold text-gray-900">
                          {order.items_count}{" "}
                          {order.items_count === 1 ? "item" : "items"}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-gray-600 text-sm mb-1">
                          <FaDollarSign className="w-4 h-4" />
                          Total
                        </div>
                        <p className="font-semibold text-gray-900">
                          ₦{order.total.toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Link
                        to={`/admin-order-detail/${order.id}`}
                        className="flex-1"
                      >
                        <button className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors duration-200">
                          <FaEye className="w-4 h-4" />
                          View Details
                        </button>
                      </Link>
                      {onSelectOrder && (
                        <button
                          onClick={() => onSelectOrder(order)}
                          className="px-4 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors duration-200 flex items-center gap-2"
                        >
                          <FaMousePointer className="w-4 h-4" />
                          Select
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
