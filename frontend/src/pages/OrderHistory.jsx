// OrderHistory.jsx
import React, { useState, useEffect } from "react";
import api from "../constant/api";
import style from "../css/OrderHistory.module.css";

const OrderHistory = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await api.get("orders/");
        setOrders(response.data);
        console.log(response.data);
        setLoading(false);
      } catch (err) {
        setError("Failed to load your order history. Please try again later.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder((prev) => (prev === orderId ? null : orderId));
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

  if (loading) {
    return (
      <div className={style.orderHistoryContainer}>
        <div className={style.loadingSpinner}>Loading your orders...</div>
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
          <button className={style.shopNowBtn}>Shop Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className={style.orderHistoryContainer}>
      <h1 className={style.orderHistoryTitle}>My Orders</h1>

      <div className={style.ordersList}>
        {orders.map((order) => (
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
                  <span>Total:</span> ${order.total.toFixed(2)}
                </div>
              </div>

              <div className={style.expandIcon}>
                {expandedOrder === order.order_number ? "−" : "+"}
              </div>
            </div>

            {expandedOrder === order.order_number && (
              <div className={style.orderDetails}>
                <div className={style.shippingDetails}>
                  <h3>Shipping Details</h3>
                  <p>
                    <strong>Name:</strong> {order.first_name} {order.last_name}
                  </p>
                  <p>
                    <strong>Email:</strong> {order.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {order.phone}
                  </p>
                  <p>
                    <strong>Address:</strong> {order.address}
                  </p>
                  {order.room_number && (
                    <p>
                      <strong>Room/Apt:</strong> {order.room_number}
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
                            Sold by: {item.vendor.business_name}
                          </p>
                          {item.size && <p>Size: {item.size}</p>}
                          {item.color && <p>Color: {item.color}</p>}
                          <div className={style.itemPriceQty}>
                            <p className={style.itemPrice}>
                              ${item.price.toFixed(2)}
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
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className={style.summaryLine}>
                    <span>Shipping:</span>
                    <span>${order.shipping_fee.toFixed(2)}</span>
                  </div>
                  <div className={style.summaryLine}>
                    <span>Tax:</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className={`${style.summaryLine} ${style.total}`}>
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {order.order_status.toUpperCase() === "PENDING" && (
                  <div className={style.orderActions}>
                    <button className={style.cancelOrderBtn}>
                      Cancel Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderHistory;
