import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import styles from "../css/PaymentVerification.module.css";
import api from "../constant/api";

const PaymentVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the reference from the URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const reference = urlParams.get("reference");

        // Check if this payment was already verified
        const verifiedReference = localStorage.getItem("verified_reference");
        if (reference && verifiedReference === reference) {
          setVerificationStatus("success");
          setOrderDetails({
            orderNumber: localStorage.getItem("verified_order_number"),
          });
          return; // Skip API call if already verified
        }

        // Get cart_code from localStorage
        const cart_code = localStorage.getItem("cart_code");

        if (!reference) {
          setVerificationStatus("failed");
          return;
        }

        // Call the backend to verify the payment, including cart_code
        const response = await api.get(
          `payment/verify/?reference=${reference}&cart_code=${cart_code}`
        );

        if (response.data.status === "success") {
          // Store verification data in localStorage
          localStorage.setItem("verified_reference", reference);
          localStorage.setItem(
            "verified_order_number",
            response.data.order_number
          );

          // Clear the cart from localStorage after successful payment
          localStorage.removeItem("cart_code");

          // Update state with order details
          setVerificationStatus("success");
          setOrderDetails({
            orderNumber: response.data.order_number,
          });

          // Removed the window.location.reload() that was causing multiple verifications
        } else {
          setVerificationStatus("failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setVerificationStatus("failed");
      }
    };

    verifyPayment();

    // Cleanup function when component unmounts
    return () => {
      // We can choose to keep or remove the verification data
      // Uncomment these if you want to clear on unmount:
      // localStorage.removeItem("verified_reference");
      // localStorage.removeItem("verified_order_number");
    };
  }, [location.search]); // Added location.search as dependency to re-run if URL changes

  const handleContinueShopping = () => {
    navigate(-1);
  };

  const handleViewOrder = () => {
    navigate(`/orders/${orderDetails.orderNumber}`);
  };

  return (
    <div className={styles.verificationContainer}>
      {verificationStatus === "verifying" && (
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <h2>Verifying your payment...</h2>
          <p>Please wait while we confirm your transaction with Paystack.</p>
        </div>
      )}

      {verificationStatus === "success" && (
        <div className={styles.successState}>
          <div className={styles.checkmark}>✓</div>
          <h2>Payment Successful!</h2>
          <p>
            Your order #{orderDetails?.orderNumber} has been successfully
            processed. You will receive a confirmation email shortly.
          </p>
          <div className={styles.actionButtons}>
            <button
              className={styles.continueShoppingButton}
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}

      {verificationStatus === "failed" && (
        <div className={styles.failedState}>
          <div className={styles.errorMark}>✕</div>
          <h2>Payment Failed</h2>
          <p>
            We couldn't verify your payment. This could be due to a cancellation
            or an issue with the payment processor.
          </p>
          <div className={styles.actionButtons}>
            <button
              className={styles.tryAgainButton}
              onClick={() => navigate("/checkout")}
            >
              Try Again
            </button>
            <button
              className={styles.continueShoppingButton}
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentVerification;
