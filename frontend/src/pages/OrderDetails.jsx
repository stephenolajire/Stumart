import { useState } from "react";
import {
  Package,
  Truck,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import styles from "../css/OrderDetails.module.css";

// Mock order data
const orderData = {
  orderNumber: "ORD-10458",
  orderDate: "2025-04-02",
  status: "Shipped",
  estimatedDelivery: "2025-04-10",
  items: [
    {
      id: 1,
      name: "Premium Gold Watch",
      price: 299.99,
      quantity: 1,
      image: "/api/placeholder/80/80",
    },
    {
      id: 2,
      name: "Leather Watch Band",
      price: 49.99,
      quantity: 2,
      image: "/api/placeholder/80/80",
    },
  ],
  shipping: {
    method: "Express Delivery",
    address: "123 Main Street, Apt 4B, New York, NY 10001",
    cost: 12.99,
  },
  payment: {
    method: "Credit Card",
    cardEnding: "4242",
    subtotal: 399.97,
    tax: 32.0,
    total: 444.96,
  },
};

export default function OrderDetails() {
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    shipping: true,
    payment: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Calculate total items
  const totalItems = orderData.items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        {/* Order Header */}
        <div className={styles.header}>
          <div className={styles.headerFlex}>
            <h1 className={styles.headerTitle}>Order Details</h1>
            <span
              className={`${styles.statusBadge} ${
                orderData.status === "Shipped"
                  ? styles.statusShipped
                  : styles.statusProcessing
              }`}
            >
              {orderData.status}
            </span>
          </div>
          <div className={styles.infoGrid}>
            <div>
              <p className={styles.infoLabel}>Order Number</p>
              <p className={styles.infoValue}>{orderData.orderNumber}</p>
            </div>
            <div>
              <p className={styles.infoLabel}>Order Date</p>
              <p className={styles.infoValue}>
                {new Date(orderData.orderDate).toLocaleDateString()}
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
              {orderData.items.map((item) => (
                <div key={item.id} className={styles.itemRow}>
                  <img
                    src={item.image}
                    alt={item.name}
                    className={styles.itemImage}
                  />
                  <div className={styles.itemDetails}>
                    <h3 className={styles.itemName}>{item.name}</h3>
                    <p className={styles.itemQuantity}>
                      Quantity: {item.quantity}
                    </p>
                  </div>
                  <div className={styles.itemPrice}>
                    <p className={styles.priceValue}>
                      ${item.price.toFixed(2)}
                    </p>
                    <p className={styles.priceSubtotal}>
                      Subtotal: ${(item.price * item.quantity).toFixed(2)}
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
                <p className={styles.infoValue}>{orderData.shipping.method}</p>
                <p className={`${styles.infoLabel} ${styles.mt4}`}>Cost</p>
                <p className={styles.infoValue}>
                  ${orderData.shipping.cost.toFixed(2)}
                </p>
              </div>
              <div>
                <p className={styles.infoLabel}>Delivery Address</p>
                <p className={styles.infoValue}>{orderData.shipping.address}</p>
                <div className={styles.deliveryEstimate}>
                  <Calendar size={18} className={styles.calendarIcon} />
                  <div>
                    <p className={styles.infoLabel}>Estimated Delivery</p>
                    <p className={styles.infoValue}>
                      {new Date(
                        orderData.estimatedDelivery
                      ).toLocaleDateString()}
                    </p>
                  </div>
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
              <div className={`${styles.paymentMethod} ${styles.mb6}`}>
                <p className={styles.infoLabel}>Payment Method</p>
                <p className={styles.infoValue}>
                  {orderData.payment.method} ending in{" "}
                  {orderData.payment.cardEnding}
                </p>
              </div>

              <div className={styles.orderSummary}>
                <div className={styles.summaryRow}>
                  <p className={styles.summaryLabel}>Subtotal</p>
                  <p className={styles.summaryValue}>
                    ${orderData.payment.subtotal.toFixed(2)}
                  </p>
                </div>
                <div className={styles.summaryRow}>
                  <p className={styles.summaryLabel}>Shipping</p>
                  <p className={styles.summaryValue}>
                    ${orderData.shipping.cost.toFixed(2)}
                  </p>
                </div>
                <div className={styles.summaryRow}>
                  <p className={styles.summaryLabel}>Tax</p>
                  <p className={styles.summaryValue}>
                    ${orderData.payment.tax.toFixed(2)}
                  </p>
                </div>
                <div className={styles.totalRow}>
                  <p className={styles.totalLabel}>Total</p>
                  <p className={styles.totalValue}>
                    ${orderData.payment.total.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Actions */}
        <div className={styles.actions}>
          <button className={styles.primaryButton}>Track Order</button>
          <button className={styles.secondaryButton}>Need Help?</button>
        </div>
      </div>
    </div>
  );
}
