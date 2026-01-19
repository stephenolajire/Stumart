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
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaDollarSign,
  FaSync,
} from "react-icons/fa";
import LoadingSpinner from "./LoadingSpinner";
import { useOrders } from "./hooks/useOrders";

const Orders = () => {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");

  const debouncedSearch = useDebouncedCallback((value) => {
    setDebouncedQuery(value);
  }, 500);

  React.useEffect(() => {
    debouncedSearch(query);
  }, [query, debouncedSearch]);

  const filters = useMemo(
    () => ({
      query: debouncedQuery.trim(),
      status,
    }),
    [debouncedQuery, status],
  );

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
          color: "bg-emerald-100 text-emerald-700 border-emerald-200",
          icon: <FaCheck className="w-3 h-3" />,
        };
      case "PENDING":
        return {
          color: "bg-yellow-100 text-yellow-700 border-yellow-200",
          icon: <FaClock className="w-3 h-3" />,
        };
      case "IN_TRANSIT":
        return {
          color: "bg-blue-100 text-blue-700 border-blue-200",
          icon: <FaTruck className="w-3 h-3" />,
        };
      case "DELIVERED":
        return {
          color: "bg-purple-100 text-purple-700 border-purple-200",
          icon: <FaShippingFast className="w-3 h-3" />,
        };
      case "CANCELLED":
        return {
          color: "bg-red-100 text-red-700 border-red-200",
          icon: <FaTimes className="w-3 h-3" />,
        };
      default:
        return {
          color: "bg-gray-100 text-gray-700 border-gray-200",
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
      <div className="min-h-96 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
            <FaExclamationTriangle className="w-8 h-8 text-gray-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to Load Orders
          </h3>
          <p className="text-gray-600 mb-6">
            There was an error loading the orders. Please try again.
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4 sm:py-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Order Management
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Monitor and manage all customer orders
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium text-gray-700 transition-colors text-sm"
        >
          {isRefetching ? (
            <>
              <FaSpinner className="animate-spin w-4 h-4 mr-2" />
              Refreshing...
            </>
          ) : (
            <>
              <FaSync className="w-4 h-4 mr-2" />
              Refresh
            </>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
                Total Orders
              </p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">
                {orders.length}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <FaBox className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
                Completed
              </p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">
                {orders.filter((o) => o.status === "COMPLETED").length}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <FaCheck className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
                Pending
              </p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">
                {orders.filter((o) => o.status === "PENDING").length}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <FaClock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs sm:text-sm font-medium mb-1">
                In Transit
              </p>
              <p className="text-xl sm:text-3xl font-bold text-gray-900">
                {orders.filter((o) => o.status === "IN_TRANSIT").length}
              </p>
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FaTruck className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-4 sm:mb-6">
          <FaFilter className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          <h3 className="text-base sm:text-lg font-semibold text-gray-900">
            Filter & Search
          </h3>
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="relative">
              <FaSearch className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search orders..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm"
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
                className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg transition-colors text-sm"
              >
                Search
              </button>
              <button
                type="button"
                onClick={clearFilters}
                className="px-3 sm:px-4 py-2.5 sm:py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Clear
              </button>
            </div>
          </div>
        </form>

        {isFetching && !isRefetching && (
          <div className="flex items-center justify-center py-4 mt-4 border-t border-gray-200">
            <FaSpinner className="animate-spin w-5 h-5 mr-3 text-gray-600" />
            <span className="text-gray-600 font-medium text-sm">
              Searching orders...
            </span>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12 sm:py-16">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <FaBox className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
              No Orders Found
            </h3>
            <p className="text-sm sm:text-base text-gray-500">
              {isFetching
                ? "Searching for orders..."
                : "No orders match your current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                    Customer
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden md:table-cell">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                    Items
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-4 sm:px-6 py-3 sm:py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const dateTime = formatDate(order.created_at);

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-900 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm shrink-0">
                            #{order.order_number.slice(-3)}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900 truncate">
                              #{order.order_number}
                            </div>
                            <div className="text-xs text-gray-500 sm:hidden">
                              {order.customer_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden sm:table-cell">
                        <div className="text-sm text-gray-900">
                          {order.customer_name}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden md:table-cell">
                        <div className="text-sm text-gray-900">
                          {dateTime.date}
                        </div>
                        <div className="text-xs text-gray-500">
                          {dateTime.time}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusConfig.color}`}
                        >
                          {statusConfig.icon}
                          <span className="hidden sm:inline">
                            {order.status.replace("_", " ")}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap hidden lg:table-cell">
                        <div className="text-sm text-gray-900">
                          {order.items_count}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">
                          ₦{order.total.toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <Link to={`/admin-dashboard/orders/${order.id}`}>
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs sm:text-sm font-medium rounded-lg transition-colors">
                            <FaEye className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">View</span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
