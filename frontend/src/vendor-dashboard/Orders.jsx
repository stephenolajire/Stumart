import React, { useState } from "react";
import { FaEye } from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";
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
    if (!status) return "";

    switch (status.toLowerCase()) {
      case "delivered":
        return styles.statusDelivered;
      case "paid":
        return styles.statusPaid;
      case "processing":
        return styles.statusProcessing;
      case "shipped":
        return styles.statusShipped;
      case "pending":
        return styles.statusPending;
      default:
        return "";
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

  const filteredOrders = orders.filter((order) => {
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
          className={`${styles.shipButton} ${styles.shipButton}`}
          disabled
        >
          Shipped
        </button>
      );
    }

    return (
      <button
        className={`${styles.updateButton} ${isPending ? styles.disabled : ""}`}
        onClick={() => packedOrders(order.id)}
        disabled={isLoading || isPending}
        title={isPending ? "Cannot pack pending orders" : ""}
      >
        {isLoading
          ? "Packing..."
          : isPending
          ? "Pending Payment"
          : "Pack Order"}
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
    <div className={styles.ordersSection}>
      <div className={styles.sectionHeader}>
        <h2 style={{ marginBottom: "2rem" }}>Order Management</h2>
        <div className={styles.orderFilters}>
          <select
            className={styles.filterSelect}
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
          <input
            type="search"
            placeholder="Search by customer name or order number..."
            className={styles.searchInput}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className={styles.tableContainer}>
        {filteredOrders.length === 0 ? (
          <div className={styles.noData}>
            <p>No orders found matching your criteria.</p>
          </div>
        ) : (
          <table className={styles.dataTable}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Items</th>
                <th>Status</th>
                <th>Actions</th>
                <th>Picker</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td className={styles.orderId}>{order.order_number}</td>
                  <td>{getCustomerName(order)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>₦{Number(order.subtotal || 0).toLocaleString()}</td>
                  <td>{order.order_items?.length || 0}</td>
                  <td>
                    <span
                      className={`${styles.status} ${getOrderStatusClass(
                        order.order_status
                      )}`}
                    >
                      {order.order_status || "N/A"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      {getActionButton(order)}
                    </div>
                  </td>
                  <td>
                    {order.picker ? (
                      <button
                        className={styles.pickerDetailsButton}
                        onClick={() => handlePickerDetailsClick(order.id)}
                        disabled={loadingPickerDetails.has(order.id)}
                      >
                        {loadingPickerDetails.has(order.id) ? (
                          "Loading..."
                        ) : (
                          <>
                            <FaEye
                              color="white"
                              size={16}
                              className={styles.viewPicker}
                            />
                            Details
                          </>
                        )}
                      </button>
                    ) : (
                      <span className={styles.noPicker}>
                        No Picker Assigned
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
