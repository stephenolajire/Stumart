import React, { useContext } from "react";
import styles from "../css/ShoppingCart.module.css";
import { Link } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Swal from "sweetalert2";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../constant/api";

const Toast = Swal.mixin({
  toast: true,
  position: "top-right",
  iconColor: "white",
  customClass: {
    popup: "colored-toast",
  },
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const ShoppingCart = () => {
  const { useCart, useCartMutations } = useContext(GlobalContext);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Use the TanStack Query hooks
  const {
    data: cartData,
    isLoading: loading,
    error,
    refetch: refetchCart,
  } = useCart();

  const { removeFromCart, updateCartItem } = useCartMutations();

  // Extract cart data with defaults
  const cartItems = cartData?.items || [];
  const cartSummary = cartData?.summary || {
    subTotal: 0,
    shippingFee: 0,
    tax: 0,
    total: 0,
  };

  // Helper function to get cart code
  const getCartCode = () => localStorage.getItem("cart_code");

  const goBack = () => {
    navigate(-1);
  };

  // Custom mutation for updating quantity
  const updateQuantityMutation = useMutation({
    mutationFn: async ({ itemId, newQuantity }) => {
      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};

      const response = await api.put(
        `update-cart-item/${itemId}/`,
        { quantity: newQuantity },
        { params }
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate cart queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
    onError: (err) => {
      handleError("Failed to update quantity. Please try again.");
      console.error("Error updating quantity:", err);
    },
  });

  // Custom mutation for removing items
  const removeItemMutation = useMutation({
    mutationFn: async (itemId) => {
      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};

      const response = await api.delete(`remove-cart-item/${itemId}/`, {
        params,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      Toast.fire({
        icon: "success",
        title: "Item removed from cart",
      });
    },
    onError: (err) => {
      handleError("Failed to remove item");
      console.error("Error removing item:", err);
    },
  });

  // Custom mutation for clearing cart
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};

      const response = await api.delete("clear-cart/", { params });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      Toast.fire({
        icon: "success",
        title: "Cart cleared successfully",
      });
    },
    onError: (err) => {
      handleError("Failed to clear cart");
      console.error("Error clearing cart:", err);
    },
  });

  // Handle quantity change
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateQuantityMutation.mutate({ itemId, newQuantity });
  };

  // Add Toast notifications
  const handleError = (message) => {
    Toast.fire({
      icon: "error",
      title: message,
    });
  };

  // Remove item from cart
  const removeItem = (itemId) => {
    removeItemMutation.mutate(itemId);
  };

  // Clear entire cart
  const clearCart = () => {
    clearCartMutation.mutate();
  };

  // Add this function to format prices
  const formatPrice = (price) => {
    return new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);
  };

  // Handle loading state
  if (loading) {
    return (
      <div style={{ paddingTop: "10rem" }} className={styles.loading}>
        Loading your cart...
      </div>
    );
  }

  // // Handle error state
  // if (error) {
  //   return (
  //     <div style={{ paddingTop: "10rem" }} className={styles.error}>
  //       <p>Error loading cart: {error.message}</p>
  //       <button onClick={() => refetchCart()} className={styles.retryButton}>
  //         Retry
  //       </button>
  //     </div>
  //   );
  // }

  return (
    <div className={styles.cartContainer}>
      <div className={styles.cartHeaderSection}>
        <div className={styles.backButtonContainer} onClick={goBack}>
          <FaArrowLeft className={styles.backIcon} />
          <span className={styles.backText}>Back</span>
        </div>

        <h2 className={styles.cartTitle}>Your Shopping Cart</h2>

        {cartItems.length > 0 && (
          <div className={styles.cartItemCount}>
            {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
          </div>
        )}
      </div>

      {cartItems.length === 0 ? (
        <div className={styles.emptyCart}>
          <p className={styles.emptyMessage}>Your cart is empty</p>
          <Link to="/products" className={styles.primaryButton}>
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
                {item.promotion_price &&
                parseFloat(item.promotion_price) > 0 ? (
                  <div className={styles.itemPrice}>
                    <span className={styles.mobileLabel}>Promotion Price:</span>
                    <div className={styles.priceContainer}>
                      <span className={styles.promotionalPrice}>
                        ₦{formatPrice(item.promotion_price)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className={styles.itemPrice}>
                    <span className={styles.mobileLabel}>Price:</span>
                    <span>₦{formatPrice(item.product_price)}</span>
                  </div>
                )}

                {/* Item Quantity */}
                <div className={styles.itemQuantity}>
                  <span className={styles.mobileLabel}>Qty:</span>
                  <div className={styles.quantityControl}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className={styles.quantityButton}
                      disabled={
                        item.quantity <= 1 || updateQuantityMutation.isPending
                      }
                    >
                      -
                    </button>
                    <span className={styles.quantityValue}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className={styles.quantityButton}
                      disabled={updateQuantityMutation.isPending}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeItem(item.id)}
                  className={styles.removeButton}
                  aria-label="Remove item"
                  disabled={removeItemMutation.isPending}
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
            <button
              onClick={clearCart}
              className={styles.clearCartButton}
              disabled={clearCartMutation.isPending}
            >
              {clearCartMutation.isPending ? "Clearing..." : "Clear Cart"}
            </button>
            <Link to="/products" className={styles.continueShoppingButton}>
              Continue Shopping
            </Link>
          </div>

          {/* Cart Summary */}
          <div className={styles.cartSummary}>
            <h3 className={styles.summaryTitle}>Order Summary</h3>

            <div className={styles.summaryRow}>
              <span>Subtotal</span>
              <span>₦{formatPrice(cartSummary.subTotal)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Shipping</span>
              <span>₦{formatPrice(cartSummary.shippingFee)}</span>
            </div>

            <div className={styles.summaryRow}>
              <span>Tax</span>
              <span>₦{formatPrice(cartSummary.tax)}</span>
            </div>

            <div className={`${styles.summaryRow} ${styles.totalRow}`}>
              <span>Total</span>
              <span>₦{formatPrice(cartSummary.total)}</span>
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
