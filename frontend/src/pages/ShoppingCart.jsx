import React, { useState, useEffect, useContext } from "react";
import styles from "../css/ShoppingCart.module.css";
import { Link } from "react-router-dom";
// import axios from "axios";
import api from "../constant/api";
import { GlobalContext } from "../constant/GlobalContext";
import { useNavigate } from "react-router-dom";

const ShoppingCart = () => {
//   const [cartItems, setCartItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  const {cartItems, cartSummary, fetchCartData, loading, error, getCartCode, setError,setCartItems} = useContext(GlobalContext)

  // Calculate cart totals
  const subtotal = cartItems.reduce(
    (total, item) => total + parseFloat(item.product_price) * item.quantity,
    0
  );

  // console.log (cartSummary)

  const navigate = useNavigate();

  const goBack = () => {
    navigate(-1);
  };

  // Handle quantity change
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1) return;

    try {
      // Determine if we need to use cart_code parameter
      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};

      await api.put(
        `update-cart-item/${itemId}/`,
        { quantity: newQuantity },
        { params }
      );

      // Update local state to avoid refetching
      setCartItems(
        cartItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                quantity: newQuantity,
                total_price: item.product_price * newQuantity,
              }
            : item
        )
      );
      fetchCartData()
    } catch (err) {
      setError("Failed to update quantity. Please try again.");
      console.error("Error updating quantity:", err);
    }
  };

  // Remove item from cart
  const removeItem = async (itemId) => {
    try {
      // Determine if we need to use cart_code parameter
      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};

      await api.delete(`remove-cart-item/${itemId}/`, { params });

      // Update local state
      setCartItems(cartItems.filter((item) => item.id !== itemId));
      fetchCartData();
    } catch (err) {
      setError("Failed to remove item. Please try again.");
      console.error("Error removing item:", err);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      // Determine if we need to use cart_code parameter
      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};

      await api.delete("clear-cart/", { params });

      // Update local state
      setCartItems([]);
      fetchCartData();
    } catch (err) {
      setError("Failed to clear cart. Please try again.");
      console.error("Error clearing cart:", err);
    }
  };

  // Load cart data on component mount
  useEffect(() => {
    fetchCartData();
  }, []);

  if (loading) {
    return <div style={{paddingTop:"10rem"}} className={styles.loading}>Loading your cart...</div>;
  }

  return (
    <div className={styles.cartContainer}>
      <h2 className={styles.cartTitle}>Your Shopping Cart</h2>

      {cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <p className={styles.emptyMessage}>Your cart is empty</p>
          <Link to="/" className={styles.primaryButton}>
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className={styles.cartContent}>
          {/* Cart Header */}
          <div className={`${styles.cartHeader} ${styles.desktopOnly}`}>
            <span>Image</span>
            <span>Product Name</span>
            <span>Price</span>
            <span>Quantity</span>
            <span>Subtotal</span>
            <span>Delete</span>
          </div>

          {/* Cart Items */}
          <div className={styles.cartItemsList}>
            {cartItems.map((item) => (
              <div key={item.id} className={styles.cartItem}>
                {/* Item Image */}
                <div className={styles.itemImage}>
                  <img
                    src={item.product_image || "/api/placeholder/80/80"}
                    alt={item.product_name}
                  />
                </div>

                {/* Item Name */}
                <div className={styles.itemName}>
                  <h3>{item.product_name}</h3>
                  {item.size && (
                    <p className={styles.itemDetail}>Size: {item.size}</p>
                  )}
                  {item.color && (
                    <p className={styles.itemDetail}>Color: {item.color}</p>
                  )}
                </div>

                {/* Item Price */}
                <div className={styles.itemPrice}>
                  <span className={styles.mobileLabel}>Price:</span>
                  <span>{item.product_price}</span>
                </div>

                {/* Item Quantity */}
                <div className={styles.itemQuantity}>
                  <span className={styles.mobileLabel}>Qty:</span>
                  <div className={styles.quantityControl}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={styles.quantityButton}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className={styles.quantityValue}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={styles.quantityButton}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Item Subtotal */}
                <div className={styles.itemSubtotal}>
                  <span className={styles.mobileLabel}>Subtotal:</span>
                  <span>{cartSummary.subtotal}</span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className={styles.removeButton}
                  aria-label="Remove item"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6l12 12"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          {/* Cart Actions */}
          <div className={styles.cartActions}>
            <button onClick={clearCart} className={styles.clearCartButton}>
              Clear Cart
            </button>
            <button onClick={goBack} className={styles.continueShoppingButton}>
              Continue Shopping
            </button>
          </div>

          {/* Cart Summary */}
          <div className={styles.cartSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>{cartSummary.subTotal}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>{cartSummary.shippingFee}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>{cartSummary.tax}</span>
            </div>

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>{cartSummary.total}</span>
            </div>

            <button className={styles.checkoutButton}>
              <Link
                to="/checkout"
                className={styles.checkoutLink}
                style={{ textDecoration: "none" }}
              >
                Proceed to Checkout
              </Link>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoppingCart;
