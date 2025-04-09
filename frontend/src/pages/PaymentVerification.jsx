import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import styles from "../css/PaymentVerification.module.css";
import api from "../constant/api";

const PaymentVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  localStorage.getItem("cart_code")

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        // Get the reference from the URL query parameters
        const urlParams = new URLSearchParams(location.search);
        const reference = urlParams.get("reference");

        if (!reference) {
          setVerificationStatus("failed");
          return;
        }

        // Call the backend to verify the payment
        const response = await api.get(
          `payment/verify/?reference=${reference}`
        );

        if (response.data.status === "success") {
          setVerificationStatus("success");
          setOrderDetails({
            orderNumber: response.data.order_number,
          });
        } else {
          setVerificationStatus("failed");
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setVerificationStatus("failed");
      }
    };

    verifyPayment();
  }, [location.search]);

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
              className={styles.viewOrderButton}
              onClick={handleViewOrder}
            >
              View Order
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
