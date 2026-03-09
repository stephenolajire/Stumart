import React, { useState } from "react";
import {
  FaEye,
  FaSearch,
  FaBox,
  FaShippingFast,
  FaClock,
  FaCheckCircle,
} from "react-icons/fa";
import Swal from "sweetalert2";
import PickerDetailsModal from "./PickerDetailsModal";
import { useAssignedPicker } from "../hooks/useVendor";
import { usePackOrder } from "../hooks/useOrder";
import { VENDOR_KEYS } from "../hooks/useVendor";
import { useQueryClient } from "@tanstack/react-query";

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

const Orders = ({ orders }) => {
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPickerOrderId, setSelectedPickerOrderId] = useState(null);

  const queryClient = useQueryClient();

  const {
    mutate: packOrder,
    isPending: isPackingOrder,
    variables: packingVariables,
  } = usePackOrder();

  const {
    data: pickerData,
    isLoading: isLoadingPicker,
    isError: isPickerError,
  } = useAssignedPicker(selectedPickerOrderId, {
    enabled: !!selectedPickerOrderId,
  });

  const ordersArray = orders?.orders ?? orders ?? [];

  const handlePickerDetailsClick = (orderId) => {
    setSelectedPickerOrderId(orderId);
  };

  React.useEffect(() => {
    if (isPickerError && selectedPickerOrderId) {
      Toast.fire({
        icon: "error",
        title: "Failed to load picker details",
        text: "Please try again",
      });
      setSelectedPickerOrderId(null);
    }
  }, [isPickerError, selectedPickerOrderId]);

  const handlePackOrder = (orderId) => {
    packOrder(
      { order_id: orderId },
      {
        onSuccess: () => {
          Toast.fire({ icon: "success", title: "Order packed successfully" });
          queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.orders() });
        },
        onError: () => {
          Toast.fire({
            icon: "error",
            title: "Failed to pack order",
            text: "Please try again",
          });
        },
      },
    );
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
      case "in_transit":
        return "bg-indigo-100 text-indigo-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    if (!status) return <FaClock />;
    switch (status.toLowerCase()) {
      case "delivered":
      case "paid":
      case "completed":
        return <FaCheckCircle />;
      case "processing":
        return <FaBox />;
      case "shipped":
      case "in_transit":
        return <FaShippingFast />;
      case "pending":
        return <FaClock />;
      default:
        return <FaClock />;
    }
  };

  const getCustomerName = (order) => {
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
    const isThisOrderPacking =
      isPackingOrder && packingVariables?.order_id === order.id;
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
            : isThisOrderPacking
              ? "bg-yellow-300 text-yellow-800 cursor-wait"
              : "bg-yellow-500 hover:bg-yellow-600 text-white"
        }`}
        onClick={() => handlePackOrder(order.id)}
        disabled={isThisOrderPacking || isPending}
        title={isPending ? "Cannot pack pending orders" : ""}
      >
        {isThisOrderPacking ? (
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
          </select>

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
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusClass(order.order_status)}`}
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
                          disabled={
                            isLoadingPicker &&
                            selectedPickerOrderId === order.id
                          }
                        >
                          {isLoadingPicker &&
                          selectedPickerOrderId === order.id ? (
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

      {pickerData && selectedPickerOrderId && (
        <PickerDetailsModal
          picker={pickerData}
          onClose={() => setSelectedPickerOrderId(null)}
        />
      )}
    </div>
  );
};

export default Orders;
