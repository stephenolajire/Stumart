// OrderDetails.js
import { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useReactToPrint } from "react-to-print";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Package,
  Truck,
  Calendar,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RefreshCw,
} from "lucide-react";
import styles from "../css/OrderDetails.module.css";
import api from "../constant/api";

export default function OrderDetails() {
  const [expandedSections, setExpandedSections] = useState({
    items: true,
    shipping: true,
    payment: true,
  });

  const { orderNumber } = useParams();
  const navigate = useNavigate();
  const componentRef = useRef();
  const queryClient = useQueryClient();

  // Fetch order details with TanStack Query
  const {
    data: orderData,
    isLoading: loading,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["orderDetails", orderNumber],
    queryFn: async () => {
      if (!orderNumber) throw new Error("Order number is required");
      const response = await api.get(`orders/${orderNumber}/`);
      return response.data;
    },
    enabled: !!orderNumber,
    staleTime: 300000, // Consider data fresh for 5 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error("Error fetching order details:", error);
    },
  });

  // Update order status mutation (if you have this functionality)
  const updateOrderMutation = useMutation({
    mutationFn: async (updateData) => {
      const response = await api.patch(`orders/${orderNumber}/`, updateData);
      return response.data;
    },
    onSuccess: (updatedOrder) => {
      // Update the cache with new data
      queryClient.setQueryData(["orderDetails", orderNumber], updatedOrder);

      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ["orders"], // If you have an orders list
      });
    },
    onError: (error) => {
      console.error("Error updating order:", error);
    },
  });

  // Cancel order mutation (if you have this functionality)
  const cancelOrderMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post(`orders/${orderNumber}/cancel/`);
      return response.data;
    },
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(["orderDetails", orderNumber], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
    onError: (error) => {
      console.error("Error cancelling order:", error);
    },
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Enhanced print handler using useReactToPrint
  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Order-${orderNumber}`,
    onBeforeGetContent: () => {
      // Ensure all sections are expanded for printing
      setExpandedSections({
        items: true,
        shipping: true,
        payment: true,
      });
    },
  });

  // Manual refresh handler
  const handleRefresh = () => {
    refetch();
  };

  // Cancel order handler
  const handleCancelOrder = () => {
    if (window.confirm("Are you sure you want to cancel this order?")) {
      cancelOrderMutation.mutate();
    }
  };

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

  // Check if order can be cancelled
  const canCancelOrder = (status) => {
    const cancellableStatuses = ["PENDING", "PROCESSING"];
    return cancellableStatuses.includes(status?.toUpperCase());
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
          <p>
            {error.response?.status === 404
              ? "Order not found"
              : error.message ||
                "Failed to load order details. Please try again later."}
          </p>
          <div className={styles.errorActions}>
            <button
              className={styles.primaryButton}
              onClick={handleRefresh}
              disabled={isRefetching}
            >
              {isRefetching ? (
                <>
                  <RefreshCw size={16} className={styles.spinning} />
                  Retrying...
                </>
              ) : (
                "Try Again"
              )}
            </button>
            <button
              className={styles.secondaryButton}
              onClick={() => navigate(-1)}
            >
              Go Back
            </button>
          </div>
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
            <div className={styles.headerLeft}>
              <h1 className={styles.headerTitle}>Order Details</h1>
              {isRefetching && (
                <RefreshCw
                  size={16}
                  className={`${styles.refreshIcon} ${styles.spinning}`}
                />
              )}
            </div>
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
            {orderData.updated_at &&
              orderData.updated_at !== orderData.created_at && (
                <div>
                  <p className={styles.infoLabel}>Last Updated</p>
                  <p className={styles.infoValue}>
                    {formatDate(orderData.updated_at)}
                  </p>
                </div>
              )}
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
                      loading="lazy"
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
                {orderData.tracking_number && (
                  <>
                    <p className={`${styles.infoLabel} ${styles.mt4}`}>
                      Tracking Number
                    </p>
                    <p className={styles.infoValue}>
                      {orderData.tracking_number}
                    </p>
                  </>
                )}
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
                  {orderData.transaction.payment_status && (
                    <>
                      <p className={styles.infoLabel}>Payment Status</p>
                      <p className={styles.infoValue}>
                        {orderData.transaction.payment_status}
                      </p>
                    </>
                  )}
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
                {orderData.discount && orderData.discount > 0 && (
                  <div className={styles.summaryRow}>
                    <p className={styles.summaryLabel}>Discount</p>
                    <p className={styles.summaryValue}>
                      -₦{orderData.discount.toFixed(2)}
                    </p>
                  </div>
                )}
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
          onClick={handleRefresh}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <>
              <RefreshCw size={16} className={styles.spinning} />
              Refreshing...
            </>
          ) : (
            "Refresh"
          )}
        </button>
        {canCancelOrder(orderData.order_status) && (
          <button
            className={`${styles.secondaryButton} ${styles.dangerButton}`}
            onClick={handleCancelOrder}
            disabled={cancelOrderMutation.isPending}
          >
            {cancelOrderMutation.isPending ? "Cancelling..." : "Cancel Order"}
          </button>
        )}
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
