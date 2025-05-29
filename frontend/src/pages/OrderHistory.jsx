// OrderHistory.jsx
import React, { useState, useEffect, useRef, useContext } from "react";
import { useReactToPrint } from "react-to-print";
import api from "../constant/api";
import style from "../css/OrderHistory.module.css";
import Swal from "sweetalert2"; // Add this import
import { Link } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import Spinner from "../components/Spinner";
import ReviewModal from "../components/ReviewModal";

const OrderHistory = () => {
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [ordersPerPage] = useState(5);
  const printRefs = useRef({});
  const [reviewOrder, setReviewOrder] = useState(null);

  const { orders, setOrders, loading, error } = useContext(GlobalContext);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
  };

  const handleMarkAsDelivered = async (orderId) => {
    try {
      // Use the actual orderId parameter instead of the 'order' object
      await api.post(`confirm/${orderId}/`, {
        status: "DELIVERED",
      });

      // Update the local state to reflect the change
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_number === orderId
            ? { ...order, order_status: "DELIVERED" }
            : order
        )
      );

      Swal.fire({
        icon: "success",
        text: "Thank you for your patronage!",
        title: "Order Delivered",
      });
      window.location.reload();
    } catch (error) {
      console.error("Error marking order as delivered:", error);
      Swal.fire({
        icon: "error",
        title: "Status Error",
        text: "Order status failed, pls try again later",
      });
    }
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
        // Send cancel request to API
        await api.post(`orders/${orderId}/cancel/`);

        // Update local state
        setOrders((prevOrders) =>
          prevOrders.map((order) =>
            order.id === orderId
              ? { ...order, order_status: "CANCELLED" }
              : order
          )
        );

        // Show success message
        await Swal.fire({
          icon: "success",
          title: "Order Cancelled",
          text: "Your order has been cancelled successfully",
        });
        fetchOrders(); // Refresh the order list
      }
    } catch (error) {
      console.error("Error cancelling order:", error);
      Swal.fire({
        icon: "error",
        title: "Cancellation Failed",
        text:
          error.response?.data?.message ||
          "Failed to cancel order. Please try again later.",
      });
    }
  };

  const handleReviewSubmit = async (reviews) => {
    try {
      // Submit vendor review
      await api.post(`vendor-reviews/`, {
        order_id: reviewOrder.id,
        vendor_id: reviewOrder.vendor_id,
        rating: reviews.vendor.rating,
        comment: reviews.vendor.comment,
      });

      // Submit picker review
      await api.post(`picker-reviews/`, {
        order_id: reviewOrder.id,
        picker_id: reviewOrder.picker_id,
        rating: reviews.picker.rating,
        comment: reviews.picker.comment,
      });

      Toast.fire({
        icon: "success",
        title: "Thank you for your reviews!",
      });

      // Update local state to show review submitted
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === reviewOrder.id ? { ...order, reviewed: true } : order
        )
      );
    } catch (error) {
      console.error("Error submitting reviews:", error);
      Toast.fire({
        icon: "error",
        title: "Failed to submit reviews",
        text: "Please try again later",
      });
    }
    setReviewOrder(null);
  };

  const getStatusClass = (status) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return style.statusPending;
      case "PROCESSING":
        return style.statusProcessing;
      case "SHIPPED":
        return style.statusShipped;
      case "DELIVERED":
        return style.statusDelivered;
      case "CANCELLED":
        return style.statusCancelled;
      case "COMPLETED":
        return style.statusCompleted;
      default:
        return "";
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
  const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(orders.length / ordersPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className={style.orderHistoryContainer}>
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className={style.orderHistoryContainer}>
        <div className={style.errorMessage}>{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className={style.orderHistoryContainer}>
        <div className={style.emptyOrders}>
          <h2>No Orders Yet</h2>
          <p>
            You haven't placed any orders yet. Start shopping to see your orders
            here!
          </p>
          <Link to="/products" className={style.shopNowBtn}>
            Shop Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={style.orderHistoryContainer}>
      <h1 className={style.orderHistoryTitle}>My Orders</h1>

      <div className={style.ordersList}>
        {currentOrders.map((order) => (
          <div className={style.orderCard} key={order.order_number}>
            <div
              className={style.orderHeader}
              onClick={() => toggleOrderDetails(order.order_number)}
            >
              <div className={style.orderSummary}>
                <div className={style.orderNumber}>
                  <span>Order #:</span> {order.order_number}
                </div>
                <div className={style.orderDate}>
                  <span>Date:</span> {formatDate(order.created_at)}
                </div>
              </div>

              <div className={style.orderStatusPrice}>
                <div
                  className={`${style.orderStatus} ${getStatusClass(
                    order.order_status
                  )}`}
                >
                  {order.order_status}
                </div>
                <div className={style.orderTotal}>
                  <span>Total:</span> ₦{order.total.toFixed(2)}
                </div>
              </div>

              <div className={style.expandIcon}>
                {expandedOrder === order.order_number ? "−" : "+"}
              </div>
            </div>

            {expandedOrder === order.order_number && (
              <div
                className={style.orderDetails}
                ref={(el) => (printRefs.current[order.order_number] = el)}
              >
                <div className={style.shippingDetails}>
                  <h3>Shipping Details</h3>
                  <p>
                    <strong>Name:</strong> {order.shipping.first_name}{" "}
                    {order.shipping.last_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.shipping.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.shipping.phone}
                  </p>
                  <p>
                    <strong>Address:</strong> {order.shipping.address}
                  </p>
                  {order.shipping.room_number && (
                    <p>
                      <strong>Room/Apt:</strong> {order.shipping.room_number}
                    </p>
                  )}
                </div>

                <div className={style.orderItemsContainer}>
                  <h3>Order Items</h3>
                  {order.order_items &&
                    order.order_items.map((item) => (
                      <div className={style.orderItem} key={item.id}>
                        <div className={style.itemImage}>
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                            />
                          ) : (
                            <div className={style.noImage}>No Image</div>
                          )}
                        </div>

                        <div className={style.itemDetails}>
                          <h4>{item.product.name}</h4>
                          <p className={style.itemVendor}>
                            Sold by: {item.vendor}
                          </p>
                          {item.size && <p>Size: {item.size}</p>}
                          {item.color && <p>Color: {item.color}</p>}
                          <div className={style.itemPriceQty}>
                            <p className={style.itemPrice}>
                              ₦{item.price.toFixed(2)}
                            </p>
                            <p className={style.itemQty}>
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className={style.orderSummaryTotals}>
                  <div className={style.summaryLine}>
                    <span>Subtotal:</span>
                    <span>₦{order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className={style.summaryLine}>
                    <span>Shipping:</span>
                    <span>₦{order.shipping_fee.toFixed(2)}</span>
                  </div>
                  <div className={style.summaryLine}>
                    <span>Tax:</span>
                    <span>₦{order.tax.toFixed(2)}</span>
                  </div>
                  <div className={`${style.summaryLine} ${style.total}`}>
                    <span>Total:</span>
                    <span>₦{order.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className={style.orderActions}>
                  {order.order_status.toUpperCase() === "COMPLETED" &&
                    (order.reviewed ? (
                      <span className={style.reviewedBadge}>Reviewed</span>
                    ) : (
                      <button
                        className={style.reviewButton}
                        onClick={() => setReviewOrder(order)}
                      >
                        Write Review
                      </button>
                    ))}
                  {order.order_status.toUpperCase() === "DELIVERED" &&
                    !order.confirm && (
                      <button
                        className={style.confirmOrderBtn}
                        onClick={() => handleMarkAsDelivered(order.id)}
                      >
                        Confirm
                      </button>
                    )}
                  {order.order_status.toUpperCase() === "PENDING" && (
                    <button
                      className={style.cancelOrderBtn}
                      onClick={() => handleCancelOrder(order.id)}
                    >
                      Cancel Order
                    </button>
                  )}
                  {order.order_status.toUpperCase() !== "PENDING" && (
                    <button
                      className={style.cancelOrderBtn}
                      onClick={() => handlePrint(order.order_number)}
                    >
                      Print Receipt
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
        <div className={style.pagination}>
          <button
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className={style.paginationButton}
          >
            &laquo; Prev
          </button>

          <div className={style.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(
              (number) => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`${style.pageNumber} ${
                    currentPage === number ? style.activePage : ""
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
            className={style.paginationButton}
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
