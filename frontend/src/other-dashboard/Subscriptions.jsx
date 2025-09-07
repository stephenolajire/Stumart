import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  FaCrown,
  FaCheck,
  FaCreditCard,
  FaCalendarAlt,
  FaClock,
  FaShieldAlt,
  FaStar,
  FaRocket,
  FaSpinner,
  FaExclamationTriangle,
  FaGem,
  FaFire,
} from "react-icons/fa";
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

  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || "";
    if (name.includes("basic") || name.includes("starter"))
      return <FaShieldAlt className="w-8 h-8" />;
    if (name.includes("pro") || name.includes("professional"))
      return <FaRocket className="w-8 h-8" />;
    if (name.includes("premium") || name.includes("enterprise"))
      return <FaCrown className="w-8 h-8" />;
    return <FaGem className="w-8 h-8" />;
  };

  const getPlanGradient = (index) => {
    const gradients = [
      "from-blue-500 to-cyan-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-green-500 to-emerald-500",
    ];
    return gradients[index % gradients.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <FaSpinner className="animate-spin w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading subscription plans...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center max-w-md">
          <FaExclamationTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Error Loading Plans
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mb-6">
            <FaCrown className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Unlock premium features and take your business to the next level
            with our flexible subscription plans
          </p>
        </div>

        {/* Current Subscription Banner */}
        {currentSubscription && (
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl shadow-xl p-8 mb-12 text-white">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                  <FaCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">
                    Active Subscription
                  </h3>
                  <p className="text-green-100">
                    You're currently subscribed and enjoying premium features
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <FaCalendarAlt className="w-4 h-4" />
                    <span>
                      Expires:{" "}
                      {new Date(
                        currentSubscription.end_date
                      ).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FaClock className="w-4 h-4" />
                    <span>
                      {currentSubscription.days_remaining} days remaining
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-medium">
                    Status: {currentSubscription.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {allPlans.map((plan, index) => {
            const isPopular = index === 1; // Make second plan popular
            const gradient = getPlanGradient(index);

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all duration-300 hover:-translate-y-2 hover:shadow-3xl ${
                  isPopular ? "ring-4 ring-yellow-400 scale-105" : ""
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
                      <FaFire className="w-4 h-4" />
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div
                  className={`bg-gradient-to-r ${gradient} px-8 py-12 text-white text-center relative`}
                >
                  <div className="absolute inset-0 bg-white bg-opacity-10"></div>
                  <div className="relative z-10">
                    <div className="mb-4">{getPlanIcon(plan.name)}</div>
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-white text-opacity-90 text-sm">
                      {plan.duration}
                    </p>
                  </div>
                </div>

                {/* Plan Body */}
                <div className="p-8">
                  {/* Price */}
                  <div className="text-center mb-8">
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        ₦{plan.price?.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-gray-500 text-sm">
                      per {plan.duration?.toLowerCase()}
                    </p>
                  </div>

                  {/* Features */}
                  <div className="space-y-4 mb-8">
                    {plan.features_list?.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center">
                          <FaCheck className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <div className="space-y-4">
                    <CustomPaystackButton
                      text={
                        <div className="flex items-center justify-center gap-2">
                          <FaCreditCard className="w-4 h-4" />
                          {currentSubscription?.status === "active"
                            ? "Renew Plan"
                            : "Get Started"}
                        </div>
                      }
                      publicKey={paystackPublicKey}
                      email={user.email}
                      amount={plan.price * 100}
                      reference={`sub_${Date.now()}`}
                      onSuccess={handlePaymentSuccess}
                      metadata={{
                        plan_id: plan.id,
                        plan_name: plan.name,
                        user_id: user.id,
                      }}
                      className={`w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 ${
                        isPopular
                          ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg"
                          : `bg-gradient-to-r ${gradient} hover:shadow-lg`
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FaShieldAlt className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Secure & Reliable
            </h3>
            <p className="text-gray-600 mb-6">
              All payments are processed securely through Paystack. You can
              cancel or change your subscription at any time.
            </p>
            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <FaShieldAlt className="w-4 h-4" />
                <span>SSL Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCheck className="w-4 h-4" />
                <span>Cancel Anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <FaCreditCard className="w-4 h-4" />
                <span>Secure Payments</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscriptions;
