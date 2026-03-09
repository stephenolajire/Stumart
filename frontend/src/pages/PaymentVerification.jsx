import React, { useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { GlobalContext, useCartMutations } from "../constant/GlobalContext";
import { useVerifyPayment } from "../hooks/useOrder";
import {
  CheckCircle,
  XCircle,
  Loader2,
  ShoppingBag,
  RefreshCw,
} from "lucide-react";

const PaymentVerification = () => {
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [orderDetails, setOrderDetails] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const { isAuthenticated } = useContext(GlobalContext);
  const { generateCartCode } = useCartMutations();

  const { mutate: verifyPayment } = useVerifyPayment();

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const reference = urlParams.get("reference");

    const verifiedReference = localStorage.getItem("verified_reference");
    if (reference && verifiedReference === reference) {
      setVerificationStatus("success");
      setOrderDetails({
        orderNumber: localStorage.getItem("verified_order_number"),
      });
      return;
    }

    if (!reference) {
      setVerificationStatus("failed");
      return;
    }

    const cart_code = localStorage.getItem("cart_code");

    verifyPayment(
      { reference, cart_code },
      {
        onSuccess: (data) => {
          if (data.status === "success") {
            localStorage.setItem("verified_reference", reference);
            localStorage.setItem("verified_order_number", data.order_number);
            localStorage.removeItem("cart_code");

            queryClient.invalidateQueries({ queryKey: ["cart"] });
            queryClient.removeQueries({ queryKey: ["cart"] });

            if (isAuthenticated) {
              queryClient.invalidateQueries({ queryKey: ["order-history"] });
            }

            setVerificationStatus("success");
            setOrderDetails({ orderNumber: data.order_number });
          } else {
            setVerificationStatus("failed");
          }
        },
        onError: (error) => {
          console.error("Payment verification error:", error);
          setVerificationStatus("failed");
        },
      },
    );
  }, [location.search]);

  const handleContinueShopping = () => navigate("/products");

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-7xl w-full">
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
          <div className="bg-white rounded-2xl mt-39 lg:mt-0 shadow-lg p-8 text-center">
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

            <button
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center"
              onClick={handleContinueShopping}
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Continue Shopping
            </button>
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
