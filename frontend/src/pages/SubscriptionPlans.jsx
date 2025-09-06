import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CustomPaystackButton from "../components/CustomPaystackButon";
import api from "../constant/api";
import {
  Crown,
  Check,
  Calendar,
  Clock,
  Star,
  Zap,
  Shield,
  Loader2,
  AlertCircle,
  CheckCircle,
  RefreshCw,
} from "lucide-react";

const SubscriptionPlans = () => {
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
    const name = planName.toLowerCase();
    if (name.includes("premium") || name.includes("pro")) return Crown;
    if (name.includes("basic") || name.includes("starter")) return Shield;
    return Star;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-100";
      case "expired":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-yellow-600 animate-spin mx-auto mb-4" />
          <p className="text-lg text-gray-600 font-medium">
            Loading subscription plans...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-6">
            <Crown className="w-8 h-8 text-yellow-600" />
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Subscription Plans
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Choose the perfect subscription plan for your business and unlock
            powerful features
          </p>
        </div>

        {/* Current Subscription */}
        {currentSubscription && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-12 border border-gray-100">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Current Subscription
                </h3>
                <p className="text-gray-600">Manage your active subscription</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Status
                  </span>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(
                    currentSubscription.status
                  )}`}
                >
                  {currentSubscription.status}
                </span>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-2">
                  <Calendar className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Expires
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(currentSubscription.end_date).toLocaleDateString()}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center mb-2">
                  <Clock className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Days Remaining
                  </span>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {currentSubscription.days_remaining} days
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {allPlans.map((plan) => {
            const IconComponent = getPlanIcon(plan.name);
            const isPopular =
              plan.name.toLowerCase().includes("premium") ||
              plan.name.toLowerCase().includes("pro");

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg overflow-hidden border-2 transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${
                  isPopular ? "border-yellow-400" : "border-gray-100"
                }`}
              >
                {/* Popular Badge */}
                {isPopular && (
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                      Most Popular
                    </div>
                  </div>
                )}

                {/* Plan Header */}
                <div
                  className={`px-8 py-8 text-center ${
                    isPopular
                      ? "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"
                      : "bg-gray-50"
                  }`}
                >
                  <div
                    className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      isPopular ? "bg-white bg-opacity-20" : "bg-white"
                    }`}
                  >
                    <IconComponent
                      className={`w-8 h-8 ${
                        isPopular ? "text-white" : "text-yellow-600"
                      }`}
                    />
                  </div>

                  <h3
                    className={`text-2xl font-bold mb-2 ${
                      isPopular ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {plan.name}
                  </h3>

                  <p
                    className={`text-sm ${
                      isPopular ? "text-yellow-100" : "text-gray-600"
                    }`}
                  >
                    {plan.duration}
                  </p>
                </div>

                {/* Pricing */}
                <div className="px-8 py-6 text-center border-b border-gray-100">
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-sm text-gray-500 mr-1">₦</span>
                    <span className="text-4xl font-bold text-gray-900">
                      {plan.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600">One-time payment</p>
                </div>

                {/* Features */}
                <div className="px-8 py-6">
                  <ul className="space-y-4">
                    {plan.features_list.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <div className="flex-shrink-0 w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                          <Check className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-gray-700 text-sm leading-relaxed">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Subscribe Button */}
                <div className="px-8 py-6">
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
                    className={`w-full py-3 px-6 rounded-lg font-semibold text-center transition-all duration-200 transform hover:scale-105 active:scale-95 ${
                      isPopular
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white shadow-lg"
                        : "bg-gray-900 hover:bg-gray-800 text-white"
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-gray-600 mb-4">
            Need help choosing the right plan?
          </p>
          <button className="inline-flex items-center text-yellow-600 hover:text-yellow-700 font-medium">
            Contact Support
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;
