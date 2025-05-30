import React, { useContext, useState } from "react";
import styles from "../css/Checkout.module.css";
import { GlobalContext } from "../constant/GlobalContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import api from "../constant/api";
import Header from "../components/Header";

const Checkout = () => {
  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    room: "",
    saveInfo: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { cartItems, cartSummary, clearCart } = useContext(GlobalContext); // Access cart items, cart summary, and clearCart function
  const navigate = useNavigate();

  const goback = () => {
    navigate(-1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${Number(amount)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create order
      const orderData = {
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        room_number: formData.room,
        cart_items: cartItems.map((item) => item.id), // Pass cart item IDs
        subtotal: cartSummary.subTotal,
        shipping_fee: cartSummary.shippingFee,
        tax: cartSummary.tax,
        total: cartSummary.total,
        vendors: cartSummary.vendors, // Include vendors information
      };

      // Create the order and get order ID
      const orderResponse = await api.post("orders/create/", orderData);
      const orderId = orderResponse.data.order_id;
      localStorage.setItem("order_id", orderId); // Store order ID in localStorage

      // Step 2: Initialize payment with Paystack
      const paymentData = {
        order_id: orderId,
        email: formData.email,
        amount: cartSummary.total * 100, // Paystack requires amount in kobo (multiply by 100)
        callback_url: `${window.location.origin}/payment/verify/`, // Frontend callback URL
      };

      const paymentResponse = await api.post(
        "payment/initialize/",
        paymentData
      );

      // Step 3: Redirect to Paystack payment page
      window.location.href = paymentResponse.data.authorization_url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err.response?.data?.error ||
          "An error occurred during checkout. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.checkoutContainer}>
      <Header title="Checkout" />

      {error && <div className={styles.errorMessage}>{error}</div>}

      <div className={styles.checkoutContent}>
        {/* Checkout form */}
        <div className={styles.checkoutFormContainer}>
          <form className={styles.checkoutForm} onSubmit={handleSubmit}>
            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Contact Information</h3>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>

            <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Shipping Address</h3>
              <div className={styles.formGroup}>
                <label htmlFor="address">Hostel Address</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="room">Room Number</label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
            </div>
            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.backButton}
                onClick={goback}
                disabled={loading}
              >
                Back to Cart
              </button>
              <button
                type="submit"
                className={styles.placeOrderButton}
                disabled={loading}
              >
                {loading ? "Processing..." : "Place Order & Pay"}
              </button>
            </div>
          </form>
        </div>

        {/* Order summary */}
        <div className={styles.orderSummary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          <div className={styles.orderItems}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.orderItem}>
                <div className={styles.itemImage}>
                  <img src={item.product_image} alt={item.product_name} />
                  <span className={styles.itemQuantity}>{item.quantity}</span>
                </div>
                <div className={styles.itemDetails}>
                  <h4 className={styles.itemName}>{item.product_name}</h4>
                  <span className={styles.itemPrice}>
                    {formatCurrency(Number(item.product_price))}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryDetails}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(cartSummary.subTotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>{formatCurrency(cartSummary.shippingFee)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>{formatCurrency(cartSummary.tax)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>{formatCurrency(cartSummary.total)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
