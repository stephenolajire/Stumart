import React, { useState } from "react";
import {
  FaEye,
  FaSearch,
  FaBox,
  FaShippingFast,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import api from "../constant/api";
import Swal from "sweetalert2";
import PickerDetailsModal from "./PickerDetailsModal";

// Configure toast notification
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

const Orders = ({ orders, onOrderUpdate }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingOrders, setLoadingOrders] = useState(new Set());
  const [selectedPicker, setSelectedPicker] = useState(null);
  // Replace the single loading state with a Set to track multiple loading states
  const [loadingPickerDetails, setLoadingPickerDetails] = useState(new Set());

  console.log("Orders component rendered with orders:", orders);

  // Extract the orders array from the response object
  const ordersArray = orders?.orders || [];

  const packedOrders = async (orderId) => {
    setLoadingOrders((prev) => new Set([...prev, orderId]));

    try {
      const response = await api.post("pack-order/", { order_id: orderId });

      if (response.status === 200) {
        Toast.fire({
          icon: "success",
          title: "Order packed successfully",
        });

        // Call parent component's update function if provided
        if (onOrderUpdate) {
          onOrderUpdate();
        }
      } else {
        throw new Error("Failed to pack order");
      }
    } catch (error) {
      console.error("Error packing order:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to pack order",
        text: "Please try again",
      });
    } finally {
      setLoadingOrders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  const getOrderStatusClass = (status) => {
    if (!status) return "bg-gray-100 text-gray-800";

    switch (status.toLowerCase()) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "processing":
        return "bg-yellow-100 text-yellow-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FaClock />;

    switch (status.toLowerCase()) {
      case "delivered":
        return <FaCheckCircle />;
      case "paid":
        return <FaCheckCircle />;
      case "processing":
        return <FaBox />;
      case "shipped":
        return <FaShippingFast />;
      case "pending":
        return <FaClock />;
      default:
        return <FaClock />;
    }
  };

  const getCustomerName = (order) => {
    // Handle both shipping object format and direct format
    if (order.shipping?.first_name && order.shipping?.last_name) {
      return `${order.shipping.first_name} ${order.shipping.last_name}`;
    }
    if (order.first_name && order.last_name) {
      return `${order.first_name} ${order.last_name}`;
    }
    return "N/A";
  };

  const filteredOrders = ordersArray.filter((order) => {
    const customerName = getCustomerName(order);
    const matchesSearch =
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      filterStatus === "all" ||
      (order.order_status && order.order_status.toLowerCase() === filterStatus);
    return matchesSearch && matchesStatus;
  });

  const getActionButton = (order) => {
    const isLoading = loadingOrders.has(order.id);
    const isPending = order.order_status?.toLowerCase() === "pending";

    if (order.packed) {
      return (
        <button
          className="px-3 py-1.5 bg-green-100 text-green-800 text-sm font-medium rounded-md cursor-not-allowed"
          disabled
        >
          <FaShippingFast className="inline mr-1" size={12} />
          Shipped
        </button>
      );
    }

    return (
      <button
        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
          isPending
            ? "bg-gray-100 text-gray-500 cursor-not-allowed"
            : isLoading
            ? "bg-yellow-300 text-yellow-800 cursor-wait"
            : "bg-yellow-500 hover:bg-yellow-600 text-white"
        }`}
        onClick={() => packedOrders(order.id)}
        disabled={isLoading || isPending}
        title={isPending ? "Cannot pack pending orders" : ""}
      >
        {isLoading ? (
          <>
            <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-800 mr-1"></div>
            Packing...
          </>
        ) : isPending ? (
          <>
            <FaClock className="inline mr-1" size={12} />
            Pending Payment
          </>
        ) : (
          <>
            <FaBox className="inline mr-1" size={12} />
            Pack Order
          </>
        )}
      </button>
    );
  };

  // Update the handlePickerDetailsClick function
  const handlePickerDetailsClick = async (orderId) => {
    try {
      // Add this order to loading set
      setLoadingPickerDetails((prev) => new Set([...prev, orderId]));

      const response = await api.get(`assigned/picker/`, {
        params: { order_id: orderId },
      });

      if (response.status === 200) {
        setSelectedPicker(response.data);
      } else {
        throw new Error("Failed to fetch picker details");
      }
    } catch (error) {
      console.error("Error fetching picker details:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to load picker details",
        text: error.response?.data?.message || "Please try again",
      });
    } finally {
      // Remove this order from loading set
      setLoadingPickerDetails((prev) => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Filter Dropdown */}
          <select
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-gray-700"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
          </select>

          {/* Search Input */}
          <div className="relative flex-1 md:max-w-md">
            <FaSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={14}
            />
            <input
              type="search"
              placeholder="Search by customer name or order number..."
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 mb-4">
              <FaBox size={48} className="mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Orders Found
            </h3>
            <p className="text-gray-500">
              No orders found matching your criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Picker
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 transition-colors duration-150"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.order_number}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {getCustomerName(order)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      ₦{Number(order.subtotal || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {order.order_items?.length || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusClass(
                          order.order_status
                        )}`}
                      >
                        <span className="mr-1">
                          {getStatusIcon(order.order_status)}
                        </span>
                        {order.order_status || "N/A"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getActionButton(order)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.picker ? (
                        <button
                          className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium rounded-md transition-colors duration-200"
                          onClick={() => handlePickerDetailsClick(order.id)}
                          disabled={loadingPickerDetails.has(order.id)}
                        >
                          {loadingPickerDetails.has(order.id) ? (
                            <>
                              <div className="inline-block animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                              Loading...
                            </>
                          ) : (
                            <>
                              <FaEye className="mr-2" size={14} />
                              Details
                            </>
                          )}
                        </button>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No Picker Assigned
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPicker && (
        <PickerDetailsModal
          picker={selectedPicker}
          onClose={() => setSelectedPicker(null)}
        />
      )}
    </div>
  );
};

export default Orders;
