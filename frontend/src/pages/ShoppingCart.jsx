import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { useCart } from "../hooks/useCart";

const Toast = Swal.mixin({
  toast: true,
  position: "top-right",
  iconColor: "white",
  customClass: { popup: "colored-toast" },
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const ShoppingCart = () => {
  const navigate = useNavigate();
  // const MEDIA_BASE_URL = "https://res.cloudinary.com/dldk7qyai";

  const {
    cart,
    isLoading,
    updateCartItem,
    isUpdatingItem,
    removeCartItem,
    isRemovingItem,
    clearCart,
    isClearingCart,
  } = useCart();

  const cartItems = cart?.items || [];
  const subTotal = cart?.sub_total || 0;
  const shippingFee = cart?.shipping_fee || 0;
  const tax = cart?.tax || 0;
  const takeaway = cart?.takeaway || 0;
  const total = cart?.total || 0;

  // Check if all items are gifts
  const allItemsAreGifts =
    cartItems.length > 0 && cartItems.every((item) => item.is_gift);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price || 0);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    updateCartItem(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId) => {
    removeCartItem(itemId);
    Toast.fire({ icon: "success", title: "Item removed from cart" });
  };

  const handleClearCart = () => {
    clearCart();
    Toast.fire({ icon: "success", title: "Cart cleared successfully" });
  };

  if (isLoading) {
    return (
      <div className="pt-40 flex items-center justify-center h-auto bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-yellow-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 mt-38 md:mt-0">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="mb-8">
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
              className="inline-block bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Desktop Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 bg-white p-4 rounded-lg shadow-sm font-medium text-gray-600 border-b">
                <span className="col-span-2">Image</span>
                <span className="col-span-4">Product Name</span>
                <span className="col-span-2">Price</span>
                <span className="col-span-2">Quantity</span>
                <span className="col-span-2">Delete</span>
              </div>

              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-lg shadow-sm p-4 md:p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Image */}
                    <div className="md:col-span-2 flex justify-center md:justify-start">
                      <img
                        src={
                          item.product_image
                            ? item.product_image
                            : "/api/placeholder/80/80"
                        }
                        alt={item.product_name}
                        className="w-20 h-20 object-cover rounded-lg border"
                      />
                    </div>

                    {/* Name */}
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

                    {/* Price */}
                    <div className="md:col-span-2 text-center md:text-left">
                      <span className="md:hidden text-sm text-gray-500 block mb-1">
                        {item.promotion_price &&
                        parseFloat(item.promotion_price) > 0
                          ? "Promotion Price:"
                          : "Price:"}
                      </span>
                      {item.promotion_price &&
                      parseFloat(item.promotion_price) > 0 ? (
                        <span className="font-semibold text-yellow-600 text-lg">
                          ₦{formatPrice(item.promotion_price)}
                        </span>
                      ) : (
                        <span className="font-semibold text-gray-900 text-lg">
                          ₦{formatPrice(item.product_price)}
                        </span>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 flex justify-center md:justify-start">
                      <span className="md:hidden text-sm text-gray-500 mr-2 self-center">
                        Qty:
                      </span>
                      {item.is_gift ? (
                        <span className="px-4 py-2 font-medium text-center bg-gray-100 rounded-lg text-gray-700">
                          {item.quantity}
                        </span>
                      ) : (
                        <div className="flex items-center border border-gray-300 rounded-lg">
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity - 1)
                            }
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-l-lg transition-colors duration-200"
                            disabled={item.quantity <= 1 || isUpdatingItem}
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
                          <span className="px-4 py-2 font-medium min-w-12 text-center">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              handleUpdateQuantity(item.id, item.quantity + 1)
                            }
                            className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-r-lg transition-colors duration-200"
                            disabled={isUpdatingItem}
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
                      )}
                    </div>

                    {/* Remove */}
                    <div className="md:col-span-2 flex justify-center md:justify-start">
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                        aria-label="Remove item"
                        disabled={isRemovingItem}
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
                  onClick={handleClearCart}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  disabled={isClearingCart}
                >
                  {isClearingCart ? "Clearing..." : "Clear Cart"}
                </button>
                <Link
                  to="/products"
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-6 rounded-lg text-center transition-colors duration-200"
                >
                  Continue Shopping
                </Link>
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
                <h3 className="text-xl font-bold text-gray-900 mb-6">
                  Order Summary
                </h3>

                <div className="space-y-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>₦{formatPrice(subTotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping</span>
                    <span>₦{formatPrice(shippingFee)}</span>
                  </div>
                  {!allItemsAreGifts && (
                    <div className="flex justify-between text-gray-600">
                      <span>Service Charge</span>
                      <span>₦{formatPrice(tax)}</span>
                    </div>
                  )}
                  {takeaway > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Takeaway Fee</span>
                      <span>₦{formatPrice(takeaway)}</span>
                    </div>
                  )}
                  <hr className="my-4" />
                  <div className="flex justify-between text-lg font-bold text-gray-900">
                    <span>Total</span>
                    <span>
                      ₦{formatPrice(allItemsAreGifts ? total - tax : total)}
                    </span>
                  </div>
                </div>

                {!allItemsAreGifts && (
                  <Link
                    to="/checkout"
                    className="w-full mt-6 bg-yellow-500 hover:bg-yellow-600 text-white font-medium py-4 px-6 rounded-lg text-center block transition-colors duration-200"
                    style={{ textDecoration: "none" }}
                  >
                    Proceed to Checkout
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShoppingCart;
