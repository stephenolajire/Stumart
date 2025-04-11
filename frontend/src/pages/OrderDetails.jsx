// OrderDetails.js
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import {
  Package,
  Truck,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import styles from "../css/OrderDetails.module.css";
import api from "../constant/api";

export default function OrderDetails() {
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    shipping: true,
    payment: true,
  });

  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`orders/${orderNumber}/`);
        setOrderData(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details. Please try again later.");
        setLoading(false);
      }
    };

    if (orderNumber) {
      fetchOrderDetails();
    }
  }, [orderNumber]);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Enhanced print handler using useReactToPrint
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  // Format date helper
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  // Get status class helper
  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PENDING":
        return styles.statusPending;
      case "PROCESSING":
        return styles.statusProcessing;
      case "SHIPPED":
        return styles.statusShipped;
      case "DELIVERED":
        return styles.statusDelivered;
      case "CANCELLED":
        return styles.statusCancelled;
      case "COMPLETED":
        return styles.statusCompleted;
      default:
        return styles.statusProcessing;
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Loading order details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorState}>
          <p>{error}</p>
          <button
            className={styles.secondaryButton}
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!orderData) {
    return null;
  }

  // Calculate total items
  const totalItems =
    orderData.order_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  return (
    <div className={styles.container}>
      <div className={styles.card} ref={componentRef}>
        {/* Order Header */}
        <div className={styles.header}>
          <div className={styles.headerFlex}>
            <h1 className={styles.headerTitle}>Order Details</h1>
            <span
              className={`${styles.statusBadge} ${getStatusClass(
                orderData.order_status
              )}`}
            >
              {orderData.order_status}
            </span>
          </div>
          <div className={styles.infoGrid}>
            <div>
              <p className={styles.infoLabel}>Order Number</p>
              <p className={styles.infoValue}>{orderData.order_number}</p>
            </div>
            <div>
              <p className={styles.infoLabel}>Order Date</p>
              <p className={styles.infoValue}>
                {formatDate(orderData.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* Order Items Section */}
        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection("items")}
          >
            <div className={styles.sectionTitleWrapper}>
              <Package className={styles.sectionIcon} size={20} />
              <h2 className={styles.sectionTitle}>Items ({totalItems})</h2>
            </div>
            {expandedSections.items ? (
              <ChevronUp size={20} className={styles.sectionChevron} />
            ) : (
              <ChevronDown size={20} className={styles.sectionChevron} />
            )}
          </div>

          {expandedSections.items && (
            <div className={styles.sectionContent}>
              {orderData.order_items &&
                orderData.order_items.map((item) => (
                  <div key={item.id} className={styles.itemRow}>
                    <img
                      src={item.product?.image || "/api/placeholder/80/80"}
                      alt={item.product?.name}
                      className={styles.itemImage}
                    />
                    <div className={styles.itemDetails}>
                      <h3 className={styles.itemName}>{item.product?.name}</h3>
                      <p className={styles.itemQuantity}>
                        Quantity: {item.quantity}
                      </p>
                      {item.size && (
                        <p className={styles.itemAttribute}>
                          Size: {item.size}
                        </p>
                      )}
                      {item.color && (
                        <p className={styles.itemAttribute}>
                          Color: {item.color}
                        </p>
                      )}
                      {item.vendor && (
                        <p className={styles.itemVendor}>
                          Sold by: {item.vendor}
                        </p>
                      )}
                    </div>
                    <div className={styles.itemPrice}>
                      <p className={styles.priceValue}>
                        ₦{item.price.toFixed(2)}
                      </p>
                      <p className={styles.priceSubtotal}>
                        Subtotal: ₦{(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Shipping Section */}
        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection("shipping")}
          >
            <div className={styles.sectionTitleWrapper}>
              <Truck className={styles.sectionIcon} size={20} />
              <h2 className={styles.sectionTitle}>Shipping Details</h2>
            </div>
            {expandedSections.shipping ? (
              <ChevronUp size={20} className={styles.sectionChevron} />
            ) : (
              <ChevronDown size={20} className={styles.sectionChevron} />
            )}
          </div>

          {expandedSections.shipping && (
            <div className={`${styles.sectionContent} ${styles.shippingGrid}`}>
              <div>
                <p className={styles.infoLabel}>Shipping Method</p>
                <p className={styles.infoValue}>
                  {orderData.shipping_method || "Standard Delivery"}
                </p>
                <p className={`${styles.infoLabel} ${styles.mt4}`}>Cost</p>
                <p className={styles.infoValue}>
                  ₦{orderData.shipping_fee.toFixed(2)}
                </p>
              </div>
              <div>
                <p className={styles.infoLabel}>Delivery Address</p>
                <p className={styles.infoValue}>
                  {orderData.shipping?.address || orderData.address}
                </p>
                {(orderData.shipping?.room_number || orderData.room_number) && (
                  <p className={styles.infoValue}>
                    Room:{" "}
                    {orderData.shipping?.room_number || orderData.room_number}
                  </p>
                )}
                <div className={styles.contactInfo}>
                  <p className={styles.infoLabel}>Contact</p>
                  <p className={styles.infoValue}>
                    {orderData.shipping?.first_name || orderData.first_name}{" "}
                    {orderData.shipping?.last_name || orderData.last_name}
                  </p>
                  <p className={styles.infoValue}>
                    {orderData.shipping?.phone || orderData.phone}
                  </p>
                  <p className={styles.infoValue}>
                    {orderData.shipping?.email || orderData.email}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div className={styles.section}>
          <div
            className={styles.sectionHeader}
            onClick={() => toggleSection("payment")}
          >
            <div className={styles.sectionTitleWrapper}>
              <CreditCard className={styles.sectionIcon} size={20} />
              <h2 className={styles.sectionTitle}>Payment Information</h2>
            </div>
            {expandedSections.payment ? (
              <ChevronUp size={20} className={styles.sectionChevron} />
            ) : (
              <ChevronDown size={20} className={styles.sectionChevron} />
            )}
          </div>

          {expandedSections.payment && (
            <div className={styles.sectionContent}>
              {orderData.transaction && (
                <div className={`${styles.paymentMethod} ${styles.mb6}`}>
                  <p className={styles.infoLabel}>Payment Method</p>
                  <p className={styles.infoValue}>
                    {orderData.transaction.payment_method || "Online Payment"}
                  </p>
                  <p className={styles.infoLabel}>Transaction ID</p>
                  <p className={styles.infoValue}>
                    {orderData.transaction.transaction_id}
                  </p>
                </div>
              )}

              <div className={styles.orderSummary}>
                <div className={styles.summaryRow}>
                  <p className={styles.summaryLabel}>Subtotal</p>
                  <p className={styles.summaryValue}>
                    ₦{orderData.subtotal.toFixed(2)}
                  </p>
                </div>
                <div className={styles.summaryRow}>
                  <p className={styles.summaryLabel}>Shipping</p>
                  <p className={styles.summaryValue}>
                    ₦{orderData.shipping_fee.toFixed(2)}
                  </p>
                </div>
                <div className={styles.summaryRow}>
                  <p className={styles.summaryLabel}>Tax</p>
                  <p className={styles.summaryValue}>
                    ₦{orderData.tax.toFixed(2)}
                  </p>
                </div>
                <div className={styles.totalRow}>
                  <p className={styles.totalLabel}>Total</p>
                  <p className={styles.totalValue}>
                    ₦{orderData.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Actions - Outside the print area */}
      <div className={styles.actions}>
        <button className={styles.primaryButton} onClick={handlePrint}>
          Print Order
        </button>
        <button
          className={styles.secondaryButton}
          onClick={() => navigate("/orders")}
        >
          Back to Orders
        </button>
        <button
          className={styles.secondaryButton}
          onClick={() => navigate("/contact")}
        >
          Need Help?
        </button>
      </div>
    </div>
  );
}
