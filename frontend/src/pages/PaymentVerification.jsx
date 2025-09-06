import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import api from "../constant/api";
import { GlobalContext, useCartMutations } from "../constant/GlobalContext";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingBag,
  Receipt,
  RefreshCw,
} from "lucide-react";

const PaymentVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Access the context for authentication and other utilities
  const { isAuthenticated } = useContext(GlobalContext);

  // Use the cart mutations hook for cart operations
  const { generateCartCode } = useCartMutations();

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

          // Invalidate cart queries to refresh cart data across the app
          queryClient.invalidateQueries({ queryKey: ["cart"] });

          // Also clear all cart-related cache to ensure fresh data
          queryClient.removeQueries({ queryKey: ["cart"] });

          // Update state with order details
          setVerificationStatus("success");
          setOrderDetails({
            orderNumber: response.data.order_number,
          });

          // If user is authenticated, also invalidate orders to refresh order list
          if (isAuthenticated) {
            queryClient.invalidateQueries({ queryKey: ["orders"] });
          }
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
  }, [location.search, queryClient, isAuthenticated]); // Added dependencies

  const handleContinueShopping = () => {
    navigate("/products");
  };

  const handleViewOrder = () => {
    navigate(`/orders/${orderDetails.orderNumber}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {verificationStatus === "verifying" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-yellow-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Verifying your payment...
              </h2>
              <p className="text-gray-600">
                Please wait while we confirm your transaction with Paystack.
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-yellow-500 h-2 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        )}

        {verificationStatus === "success" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-8">
              <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Payment Successful!
              </h2>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 font-medium">
                  Order #{orderDetails?.orderNumber}
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Successfully processed
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Your order has been successfully processed. You will receive a
                confirmation email shortly with all the details.
              </p>
            </div>

            <div className="space-y-3">
              <button
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                onClick={handleContinueShopping}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continue Shopping
              </button>

              {/* Only show view order button if user is authenticated */}
              {/* {isAuthenticated && (
                <button
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                  onClick={handleViewOrder}
                >
                  <Receipt className="w-5 h-5 mr-2" />
                  View Order Details
                </button>
              )} */}
            </div>
          </div>
        )}

        {verificationStatus === "failed" && (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="mb-8">
              <div className="mx-auto w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                Payment Failed
              </h2>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 font-medium">
                  Transaction could not be verified
                </p>
                <p className="text-red-600 text-sm mt-1">
                  Please try again or contact support
                </p>
              </div>
              <p className="text-gray-600 leading-relaxed">
                We couldn't verify your payment. This could be due to a
                cancellation or an issue with the payment processor.
              </p>
            </div>

            <div className="space-y-3">
              <button
                className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
                onClick={() => navigate("/checkout")}
              >
                <RefreshCw className="w-5 h-5 mr-2" />
                Try Again
              </button>

              <button
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center"
                onClick={handleContinueShopping}
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                Continue Shopping
              </button>
            </div>
          </div>
        )}

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Need help? Contact our support team for assistance.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentVerification;
