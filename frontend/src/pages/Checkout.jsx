import React, { useState } from "react";
import styles from "../css/Checkout.module.css";

const Checkout = () => {
  // Get cart items from previous page or context
  const cartItems = [
    {
      id: 1,
      name: "Artisan Gold Watch",
      price: 1299,
      quantity: 1,
      image: "/api/placeholder/80/80",
    },
    {
      id: 2,
      name: "Luxury Leather Wallet",
      price: 249,
      quantity: 2,
      image: "/api/placeholder/80/80",
    },
    {
      id: 3,
      name: "Premium Silk Scarf",
      price: 189,
      quantity: 1,
      image: "/api/placeholder/80/80",
    },
  ];

  // Calculate cart totals
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = 15;
  const tax = subtotal * 0.08;
  const total = subtotal + shipping + tax;

  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    room: "",
    // state: "",
    // zipCode: "",
    // country: "Nigeria",
    // paymentMethod: "card",
    // cardNumber: "",
    // cardExpiry: "",
    // cardCVV: "",
    saveInfo: false,
  });

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Process checkout logic here
    console.log("Checkout data:", formData);
    alert("Order placed successfully!");
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `N${amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,")}`;
  };

  return (
    <div className={styles.checkoutContainer}>
      <h2 className={styles.checkoutTitle}>Checkout</h2>

      <div className={styles.checkoutContent}>
        {/* Checkout form */}
        <div className={styles.checkoutFormContainer}>
          <form onSubmit={handleSubmit} className={styles.checkoutForm}>
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
                  <label htmlFor="city">Room Number</label>
                  <input
                    type="text"
                    id="room"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                {/* <div className={styles.formGroup}>
                  <label htmlFor="state">State</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div> */}
              </div>
            </div>

            {/* <div className={styles.formSection}>
              <h3 className={styles.sectionTitle}>Payment Method</h3>
              <div className={styles.paymentMethods}>
                <div className={styles.paymentMethod}>
                  <input
                    type="radio"
                    id="card"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === "card"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="card">Credit/Debit Card</label>
                </div>
                <div className={styles.paymentMethod}>
                  <input
                    type="radio"
                    id="paypal"
                    name="paymentMethod"
                    value="paypal"
                    checked={formData.paymentMethod === "paypal"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="paypal">PayPal</label>
                </div>
                <div className={styles.paymentMethod}>
                  <input
                    type="radio"
                    id="bank"
                    name="paymentMethod"
                    value="bank"
                    checked={formData.paymentMethod === "bank"}
                    onChange={handleInputChange}
                  />
                  <label htmlFor="bank">Bank Transfer</label>
                </div>
              </div>

              {formData.paymentMethod === "card" && (
                <div className={styles.cardDetails}>
                  <div className={styles.formGroup}>
                    <label htmlFor="cardNumber">Card Number</label>
                    <input
                      type="text"
                      id="cardNumber"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleInputChange}
                      placeholder="**** **** **** ****"
                      required
                    />
                  </div>

                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label htmlFor="cardExpiry">Expiration Date</label>
                      <input
                        type="text"
                        id="cardExpiry"
                        name="cardExpiry"
                        value={formData.cardExpiry}
                        onChange={handleInputChange}
                        placeholder="MM/YY"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label htmlFor="cardCVV">CVV</label>
                      <input
                        type="text"
                        id="cardCVV"
                        name="cardCVV"
                        value={formData.cardCVV}
                        onChange={handleInputChange}
                        placeholder="***"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.saveInfo}>
                <input
                  type="checkbox"
                  id="saveInfo"
                  name="saveInfo"
                  checked={formData.saveInfo}
                  onChange={handleInputChange}
                />
                <label htmlFor="saveInfo">
                  Save this information for next time
                </label>
              </div>
            </div> */}

            <div className={styles.formActions}>
              <button type="button" className={styles.backButton}>
                Back to Cart
              </button>
              <button type="submit" className={styles.placeOrderButton}>
                Place Order
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
                  <img src={item.image} alt={item.name} />
                  <span className={styles.itemQuantity}>{item.quantity}</span>
                </div>
                <div className={styles.itemDetails}>
                  <h4 className={styles.itemName}>{item.name}</h4>
                  <span className={styles.itemPrice}>
                    {formatCurrency(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.summaryDetails}>
            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>{formatCurrency(shipping)}</span>
            </div>
            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </div>

          <div className={styles.promoCode}>
            <input type="text" placeholder="Enter promo code" />
            <button>Apply</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
