import React from "react";
// import { usePaystackPayment } from "react-paystack";
import styles from "../css/SubscriptionPlans.module.css";

const CustomPaystackButton = ({
  text,
  publicKey,
  email,
  amount,
  reference,
  metadata,
  onSuccess,
}) => {
  const config = {
    reference,
    email,
    amount,
    publicKey,
    metadata,
  };

//   const initializePayment = usePaystackPayment(config);

  const handlePaymentInitialization = () => {
    // initializePayment(onSuccess, () => {
    //   // Handle closed payment
    //   console.log("Payment closed");
    // });
  };

  return (
    <button
      type="button"
      className={styles.subscribeButton}
      onClick={handlePaymentInitialization}
    >
      {text}
    </button>
  );
};

export default CustomPaystackButton;
