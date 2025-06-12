import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./css/SubscriptionPlans.module.css";
import CustomPaystackButton from "../components/CustomPaystackButon";
import api from "../constant/api";

const Subscriptions = () => {
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [user, setUser] = useState({});
  const [allPlans, setAllPlans] = useState([]);

  const fetchAllplans = async () => {
    const response = await api.get("allplans");
    setAllPlans(response.data);
    console.log(response.data);
  };

  // Replace with your actual Paystack public key
  const paystackPublicKey = "pk_test_your_paystack_public_key";

  useEffect(() => {
    // Check if user is a vendor with 'others' category
    const checkVendorCategory = async () => {
      try {
        const res = await api.get("vendor/profile/", {});
        console.log(res);
        setUser(res.data.user);

        if (res.data.business_category !== "others") {
          // Redirect if not an 'others' category vendor
          navigate("/");
        }
      } catch (err) {
        setError("Error fetching vendor profile");
      }
    };

    const fetchSubscriptionData = async () => {
      try {
        // Fetch subscription plans
        const plansRes = await api.get("subscription/", {});
        setPlans(plansRes.data);
        console.log(plansRes.data);

        // Fetch current subscription if any
        try {
          const subRes = await api.get("subscriptions/current/", {});
          setCurrentSubscription(subRes.data);
        } catch (err) {
          // It's okay if there's no subscription yet
          console.log("No current subscription");
        }
      } catch (err) {
        setError("Error fetching subscription data");
      } finally {
        setLoading(false);
      }
    };

    checkVendorCategory();
    fetchSubscriptionData();
  }, [navigate]);

  useEffect(() => {
    fetchAllplans();
  }, []);

  const handlePaymentSuccess = async (response) => {
    try {
      const planId = response.metadata.plan_id;

      await api.post("subscriptions/subscribe/", {
        plan_id: planId,
        payment_reference: response.reference,
      });

      // Refresh subscription data
      const subRes = await api.get("subscriptions/current/", {});
      setCurrentSubscription(subRes.data);

      alert("Subscription successful!");
    } catch (err) {
      setError("Error processing subscription");
    }
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  if (error) return <div className={styles.error}>{error}</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>Subscription Plans</h2>
        <p className={styles.subtitle}>
          Choose the perfect subscription plan for your business
        </p>

        {currentSubscription && (
          <div className={styles.currentSubscription}>
            <h3 className={styles.currentTitle}>Current Subscription</h3>
            <p className={styles.subscriptionInfo}>
              Status:{" "}
              <span className={styles.capitalize}>
                {currentSubscription.status}
              </span>
            </p>
            <p className={styles.subscriptionInfo}>
              Expires:{" "}
              {new Date(currentSubscription.end_date).toLocaleDateString()}
            </p>
            <p className={styles.subscriptionInfo}>
              Days remaining: {currentSubscription.days_remaining}
            </p>
          </div>
        )}
      </div>

      <div className={styles.plansGrid}>
        {allPlans.map((plan) => (
          <div key={plan.id} className={styles.planCard}>
            <h3 className={styles.planName}>{plan.name}</h3>
            <p className={styles.planDuration}>{plan.duration}</p>
            <div className={styles.priceContainer}>
              <span className={styles.price}>₦{plan.price}</span>
            </div>
            <ul className={styles.featuresList}>
              {plan.features_list.map((feature, idx) => (
                <li key={idx} className={styles.featureItem}>
                  <svg
                    className={styles.checkIcon}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  <span className={styles.featureText}>{feature}</span>
                </li>
              ))}
            </ul>

            <CustomPaystackButton
              text={
                currentSubscription?.status === "active"
                  ? "Renew Subscription"
                  : "Subscribe Now"
              }
              publicKey={paystackPublicKey}
              email={user.email}
              amount={plan.price * 100} // Paystack amount is in kobo
              reference={`sub_${Date.now()}`}
              onSuccess={handlePaymentSuccess}
              metadata={{
                plan_id: plan.id,
                plan_name: plan.name,
                user_id: user.id,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default Subscriptions;
