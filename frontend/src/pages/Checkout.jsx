import React, { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import styles from "../css/Checkout.module.css";
import { GlobalContext } from "../constant/GlobalContext";
import { useNavigate } from "react-router-dom";
import api from "../constant/api";
import Header from "../components/Header";
import Swal from "sweetalert2";

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

  const { useCart } = useContext(GlobalContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Get cart data using the hook from context
  const {
    data: cartData,
    isLoading: cartLoading,
    error: cartError,
  } = useCart();

  // Extract cart information with fallbacks
  const cartItems = cartData?.items || [];
  const cartSummary = cartData?.summary || {
    subTotal: 0,
    shippingFee: 0,
    tax: 0,
    total: 0,
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const response = await api.post("orders/create/", orderData);
      return response.data;
    },
    onSuccess: (data) => {
      // Store order ID
      localStorage.setItem("order_id", data.order_id);
      // Initiate payment
      initializePayment({
        order_id: data.order_id,
        email: formData.email,
        amount: cartSummary.total * 100, // Paystack requires amount in kobo
        callback_url: `${window.location.origin}/payment/verify/`,
      });
    },
    onError: (error) => {
      handleCheckoutError(error);
    },
  });

  // Initialize payment mutation
  const initializePaymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      const response = await api.post("payment/initialize/", paymentData);
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    },
    onError: (error) => {
      handleCheckoutError(error);
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const cartCode = localStorage.getItem("cart_code");
      if (cartCode) {
        const response = await api.delete(`clear-cart/`, {
          params: { cart_code: cartCode },
        });
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

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

  // Initialize payment helper
  const initializePayment = (paymentData) => {
    initializePaymentMutation.mutate(paymentData);
  };

  // Enhanced error handling
  const handleCheckoutError = (err) => {
    console.error("Checkout error:", err);

    if (err.response?.data?.error_details) {
      // Handle the multiple institutions error specifically
      const errorDetails = err.response.data.error_details;
      const institutions = errorDetails.multiple_institutions_found;
      const vendorsByInstitution = errorDetails.vendors_by_institution;

      // Create a detailed message showing vendors by institution
      let institutionDetails = "";
      Object.entries(vendorsByInstitution).forEach(([institution, vendors]) => {
        institutionDetails += `<strong>${institution}:</strong><br>`;
        vendors.forEach((vendor) => {
          institutionDetails += `• ${vendor}<br>`;
        });
        institutionDetails += "<br>";
      });

      Swal.fire({
        icon: "error",
        title: "Order Cannot Be Processed",
        html: `
          <div style="text-align: left;">
            <p><strong>Error:</strong> ${err.response.data.message}</p>
            <br>
            <p><strong>Vendors by Institution:</strong></p>
            <div style="margin-left: 10px;">
              ${institutionDetails}
            </div>
            <p><strong>Suggestion:</strong> ${errorDetails.suggestion}</p>
          </div>
        `,
        confirmButtonText: "Go Back to Cart",
        confirmButtonColor: "#3085d6",
        width: "500px",
        customClass: {
          htmlContainer: "swal-html-container",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(-1);
        }
      });
    } else {
      // Handle other types of errors
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "An error occurred during checkout. Please try again.";

      Swal.fire({
        icon: "error",
        title: "Checkout Error",
        text: errorMessage,
        confirmButtonText: "Try Again",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate cart
    if (!cartItems.length) {
      Swal.fire({
        icon: "warning",
        title: "Empty Cart",
        text: "Your cart is empty. Please add items before checkout.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Prepare order data
    const orderData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      room_number: formData.room,
      cart_items: cartItems.map((item) => item.id),
      subtotal: cartSummary.subTotal,
      shipping_fee: cartSummary.shippingFee,
      tax: cartSummary.tax,
      total: cartSummary.total,
      // Add vendors information if available
      ...(cartData?.vendors && { vendors: cartData.vendors }),
    };

    // Create order
    createOrderMutation.mutate(orderData);
  };

  // Loading states
  const isLoading =
    createOrderMutation.isPending ||
    initializePaymentMutation.isPending ||
    cartLoading;

  // Show loading if cart is still loading
  if (cartLoading) {
    return (
      <div className={styles.checkoutContainer}>
        <Header title="Checkout" />
        <div className={styles.loadingContainer}>
          <p>Loading cart...</p>
        </div>
      </div>
    );
  }

  // Show error if cart failed to load
  if (cartError) {
    return (
      <div className={styles.checkoutContainer}>
        <Header title="Checkout" />
        <div className={styles.errorContainer}>
          <p>Failed to load cart. Please try again.</p>
          <button onClick={() => navigate(-1)}>Go Back</button>
        </div>
      </div>
    );
  }

  // Show empty cart message
  if (!cartItems.length) {
    return (
      <div className={styles.checkoutContainer}>
        <Header title="Checkout" />
        <div className={styles.emptyCartContainer}>
          <p>Your cart is empty.</p>
          <button onClick={() => navigate("/")}>Continue Shopping</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.checkoutContainer}>
      <Header title="Checkout" />

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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                    disabled={isLoading}
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
                  disabled={isLoading}
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
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                className={styles.backButton}
                onClick={goback}
                disabled={isLoading}
              >
                Back to Cart
              </button>
              <button
                type="submit"
                className={styles.placeOrderButton}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Place Order & Pay"}
              </button>
            </div>
          </form>
        </div>

        {/* Order summary */}
        <div className={styles.orderSummary}>
          <h3 className={styles.summaryTitle}>Order Summary</h3>

          <div className={styles.orderItems}>
            {cartItems.map((item) => (
              <div key={item.id}>
                <div className={styles.orderItem}>
                  <div className={styles.itemImage}>
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      onError={(e) => {
                        e.target.src = "/placeholder-image.png"; // Add fallback image
                      }}
                    />
                    <span className={styles.itemQuantity}>{item.quantity}</span>
                  </div>
                  <div className={styles.itemDetails}>
                    <h4 className={styles.itemName}>{item.product_name}</h4>
                    <span className={styles.itemPrice}>
                      {formatCurrency(Number(item.product_price))}
                    </span>
                  </div>
                </div>
                {item.delivery_day && (
                  <div className={styles.summaryRow}>
                    <span>Delivery Day</span>
                    <span>{item.delivery_day}</span>
                  </div>
                )}
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
