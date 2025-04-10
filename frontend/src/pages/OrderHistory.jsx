// OrderHistory.jsx
import React, { useState, useEffect } from "react";
import api from "../constant/api";
import "../css/OrderHistory.module.css";

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
        setLoading(false);
      } catch (err) {
        setError("Failed to load your order history. Please try again later.");
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const toggleOrderDetails = (orderId) => {
    if (expandedOrder === orderId) {
      setExpandedOrder(null); // collapse if already expanded
    } else {
      setExpandedOrder(orderId); // expand this order
    }
  };

  const getStatusClass = (status) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "status-pending";
      case "PROCESSING":
        return "status-processing";
      case "SHIPPED":
        return "status-shipped";
      case "DELIVERED":
        return "status-delivered";
      case "CANCELLED":
        return "status-cancelled";
       case "COMPLETED":
            return "status-completed";
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
      <div className="order-history-container">
        <div className="loading-spinner">Loading your orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="order-history-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="order-history-container">
        <div className="empty-orders">
          <h2>No Orders Yet</h2>
          <p>
            You haven't placed any orders yet. Start shopping to see your orders
            here!
          </p>
          <button className="shop-now-btn">Shop Now</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-container">
      <h1 className="order-history-title">My Orders</h1>

      <div className="orders-list">
        {orders.map((order) => (
          <div className="order-card" key={order.order_number}>
            <div
              className="order-header"
              onClick={() => toggleOrderDetails(order.order_number)}
            >
              <div className="order-summary">
                <div className="order-number">
                  <span>Order #:</span> {order.order_number}
                </div>
                <div className="order-date">
                  <span>Date:</span> {formatDate(order.created_at)}
                </div>
              </div>

              <div className="order-status-price">
                <div
                  className={`order-status ${getStatusClass(
                    order.order_status
                  )}`}
                >
                  {order.order_status}
                </div>
                <div className="order-total">
                  <span>Total:</span> ${order.total.toFixed(2)}
                </div>
              </div>

              <div className="expand-icon">
                {expandedOrder === order.order_number ? "−" : "+"}
              </div>
            </div>

            {expandedOrder === order.order_number && (
              <div className="order-details">
                <div className="shipping-details">
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

                <div className="order-items-container">
                  <h3>Order Items</h3>
                  {order.order_items &&
                    order.order_items.map((item) => (
                      <div className="order-item" key={item.id}>
                        <div className="item-image">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                            />
                          ) : (
                            <div className="no-image">No Image</div>
                          )}
                        </div>

                        <div className="item-details">
                          <h4>{item.product.name}</h4>
                          <p className="item-vendor">
                            Sold by: {item.vendor.business_name}
                          </p>
                          {item.size && <p>Size: {item.size}</p>}
                          {item.color && <p>Color: {item.color}</p>}
                          <div className="item-price-qty">
                            <p className="item-price">
                              ${item.price.toFixed(2)}
                            </p>
                            <p className="item-qty">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>

                <div className="order-summary-totals">
                  <div className="summary-line">
                    <span>Subtotal:</span>
                    <span>${order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-line">
                    <span>Shipping:</span>
                    <span>${order.shipping_fee.toFixed(2)}</span>
                  </div>
                  <div className="summary-line">
                    <span>Tax:</span>
                    <span>${order.tax.toFixed(2)}</span>
                  </div>
                  <div className="summary-line total">
                    <span>Total:</span>
                    <span>${order.total.toFixed(2)}</span>
                  </div>
                </div>

                {order.order_status.toUpperCase() === "PENDING" && (
                  <div className="order-actions">
                    <button className="cancel-order-btn">Cancel Order</button>
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
