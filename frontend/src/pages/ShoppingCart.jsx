import React, { useContext } from "react";
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
      <div className="pt-40 flex items-center justify-center h-auto bg-gray-50 hide-scrollbar">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 mt-31 md:mt-0">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          {/* <div
            className="flex items-center text-gray-600 hover:text-amber-500 cursor-pointer mb-6 transition-colors duration-200"
            onClick={goBack}
          >
            <FaArrowLeft className="mr-2" />
            <span className="font-medium">Back</span>
          </div> */}

          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Your Shopping Cart
          </h2>

          {cartItems.length > 0 && (
            <div className="text-gray-600">
              {cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}
            </div>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="mb-6">
              <svg
                className="w-24 h-24 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
              <p className="text-xl text-gray-500 mb-6">Your cart is empty</p>
            </div>
            <Link
              to="/products"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 bg-white p-4 rounded-lg shadow-sm font-medium text-gray-600 border-b">
                <span className="col-span-2">Image</span>
                <span className="col-span-4">Product Name</span>
                <span className="col-span-2">Price</span>
                <span className="col-span-2">Quantity</span>
                <span className="col-span-2">Delete</span>
              </div>

              {/* Cart Items */}
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-4 md:p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Item Image */}
                    <div className="md:col-span-2 flex justify-center md:justify-start">
                      <img
                        src={item.product_image || "/api/placeholder/80/80"}
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>

                    {/* Item Name */}
                    <div className="md:col-span-4 text-center md:text-left">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {item.product_name}
                      </h3>
                      {item.size && (
                        <p className="text-sm text-gray-600">
                          Size: {item.size}
                        </p>
                      )}
                      {item.color && (
                        <p className="text-sm text-gray-600">
                          Color: {item.color}
                        </p>
                      )}
                    </div>

                    {/* Item Price */}
                    <div className="md:col-span-2 text-center md:text-left">
                      <span className="md:hidden text-sm text-gray-500 block mb-1">
                        {item.promotion_price &&
                        parseFloat(item.promotion_price) > 0
                          ? "Promotion Price:"
                          : "Price:"}
                      </span>
                      {item.promotion_price &&
                      parseFloat(item.promotion_price) > 0 ? (
                        <div>
                          <span className="font-semibold text-amber-600 text-lg">
                            ₦{formatPrice(item.promotion_price)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-semibold text-gray-900 text-lg">
                          ₦{formatPrice(item.product_price)}
                        </span>
                      )}
                    </div>

                    {/* Item Quantity */}
                    <div className="md:col-span-2 flex justify-center md:justify-start">
                      <span className="md:hidden text-sm text-gray-500 mr-2 self-center">
                        Qty:
                      </span>
                      <div className="flex items-center border border-gray-300 rounded-lg">
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors duration-200"
                          disabled={
                            item.quantity <= 1 ||
                            updateQuantityMutation.isPending
                          }
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M20 12H4"
                            />
                          </svg>
                        </button>
                        <span className="px-4 py-2 font-medium min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                          className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors duration-200"
                          disabled={updateQuantityMutation.isPending}
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <div className="md:col-span-2 flex justify-center md:justify-start">
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
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
                  </div>
                </div>
              ))}

              {/* Cart Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={clearCart}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  disabled={clearCartMutation.isPending}
                >
                  {clearCartMutation.isPending ? "Clearing..." : "Clear Cart"}
                </button>
                <Link
                  to="/products"
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors duration-200"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Cart Summary Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{formatPrice(cartSummary.subTotal)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>₦{formatPrice(cartSummary.shippingFee)}</span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>Commission</span>
                    <span>₦{formatPrice(cartSummary.tax)}</span>
                  </div>

                  <hr className="my-4" />

                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>₦{formatPrice(cartSummary.total)}</span>
                  </div>
                </div>

                <Link
                  to="/checkout"
                  className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white font-medium py-4 px-6 rounded-lg text-center block transition-colors duration-200"
                  style={{ textDecoration: "none" }}
                >
                  Proceed to Checkout
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
