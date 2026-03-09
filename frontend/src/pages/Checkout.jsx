import React, { useContext, useState, useEffect } from "react";
import { GlobalContext } from "../constant/GlobalContext";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Swal from "sweetalert2";
import { useCreateOrder, useInitializePayment } from "../hooks/useOrder";

const Checkout = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    room: "",
    referralCode: "",
    saveInfo: false,
  });

  const [vendorNearby, setVendorNearby] = useState(null);

  const { useCart } = useContext(GlobalContext);
  const navigate = useNavigate();

  const {
    data: cartData,
    isLoading: cartLoading,
    error: cartError,
  } = useCart();

  const cartItems = cartData?.items || [];
  const cartSummary = cartData?.summary || {
    subTotal: 0,
    shippingFee: 0,
    tax: 0,
    takeaway: 0,
    total: 0,
  };

  const { mutate: createOrder, isPending: isCreatingOrder } = useCreateOrder();
  const { mutate: initializePayment, isPending: isInitializingPayment } =
    useInitializePayment();

  const checkDeliveryTimeAvailability = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const DELIVERY_START_HOUR = 8;
    const DELIVERY_END_HOUR = 18;

    if (currentHour >= DELIVERY_START_HOUR && currentHour < DELIVERY_END_HOUR) {
      return { available: true };
    }

    if (currentHour < DELIVERY_START_HOUR) {
      const hoursUntilStart = DELIVERY_START_HOUR - currentHour;
      const minutesUntilStart = 60 - currentMinute;
      let timeMessage;
      if (hoursUntilStart === 1 && minutesUntilStart < 60) {
        timeMessage = `${minutesUntilStart} minute${minutesUntilStart !== 1 ? "s" : ""}`;
      } else if (hoursUntilStart > 1) {
        const adjustedHours =
          minutesUntilStart === 60 ? hoursUntilStart : hoursUntilStart - 1;
        timeMessage = `${adjustedHours} hour${adjustedHours !== 1 ? "s" : ""} and ${minutesUntilStart} minute${minutesUntilStart !== 1 ? "s" : ""}`;
      } else {
        timeMessage = `${minutesUntilStart} minute${minutesUntilStart !== 1 ? "s" : ""}`;
      }
      return {
        available: false,
        type: "before",
        message: `Our delivery riders are not available yet. Please come back in ${timeMessage}.`,
        title: "Too Early for Delivery",
      };
    }

    return {
      available: false,
      type: "after",
      message:
        "Our delivery riders are no longer available for today. Please come back tomorrow after 7:00 AM.",
      title: "Delivery Hours Ended",
    };
  };

  useEffect(() => {
    const deliveryCheck = checkDeliveryTimeAvailability();
    if (!deliveryCheck.available) {
      Swal.fire({
        icon: "warning",
        title: deliveryCheck.title,
        text: deliveryCheck.message,
        confirmButtonText: "Understood",
        confirmButtonColor: "#EAB308",
        allowOutsideClick: false,
      }).then((result) => {
        if (result.isConfirmed) navigate(-1);
      });
    }
  }, []);

  const handleCheckoutError = (err) => {
    if (err.response?.data?.error_details) {
      const errorDetails = err.response.data.error_details;
      const vendorsByInstitution = errorDetails.vendors_by_institution;
      let institutionDetails = "";
      Object.entries(vendorsByInstitution).forEach(([institution, vendors]) => {
        institutionDetails += `<strong>${institution}:</strong><br>`;
        vendors.forEach((vendor) => {
          institutionDetails += `• ${vendor}<br>`;
        });
        institutionDetails += "<br>";
      });
      Swal.fire({
        icon: "error",
        title: "Order Cannot Be Processed",
        html: `<div style="text-align: left;"><p><strong>Error:</strong> ${err.response.data.message}</p><br><p><strong>Vendors by Institution:</strong></p><div style="margin-left: 10px;">${institutionDetails}</div><p><strong>Suggestion:</strong> ${errorDetails.suggestion}</p></div>`,
        confirmButtonText: "Go Back to Cart",
        confirmButtonColor: "#3085d6",
        width: "500px",
      }).then((result) => {
        if (result.isConfirmed) navigate(-1);
      });
    } else {
      const errorMessage =
        err.response?.data?.message ||
        err.response?.data?.error ||
        "An error occurred during checkout. Please try again.";
      Swal.fire({
        icon: "error",
        title: "Checkout Error",
        text: errorMessage,
        confirmButtonText: "Try Again",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const goback = () => navigate(-1);

  const formatCurrency = (amount) =>
    `₦${Number(amount)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({ ...formData, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const deliveryCheck = checkDeliveryTimeAvailability();
    if (!deliveryCheck.available) {
      Swal.fire({
        icon: "warning",
        title: deliveryCheck.title,
        text: deliveryCheck.message,
        confirmButtonText: "Understood",
        confirmButtonColor: "#EAB308",
      });
      return;
    }

    if (!cartItems.length) {
      Swal.fire({
        icon: "warning",
        title: "Empty Cart",
        text: "Your cart is empty. Please add items before checkout.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (!formData.address.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Address Required",
        text: "Please enter your delivery address.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    if (vendorNearby === null) {
      Swal.fire({
        icon: "warning",
        title: "One More Thing",
        text: "Please let us know if the vendor you're ordering from is near your location.",
        confirmButtonColor: "#EAB308",
      });
      return;
    }

    const orderData = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      room_number: formData.room,
      cart_items: cartItems.map((item) => item.id),
      subtotal: cartSummary.subTotal,
      shipping_fee: cartSummary.shippingFee,
      tax: cartSummary.tax,
      takeaway: cartSummary.takeaway,
      total: cartSummary.total,
      vendor_is_nearby: vendorNearby,
      ...(cartData?.vendors && { vendors: cartData.vendors }),
      ...(formData.referralCode.trim() && {
        referral_code: formData.referralCode.trim().toUpperCase(),
      }),
    };

    createOrder(orderData, {
      onSuccess: (data) => {
        localStorage.setItem("order_id", data.order_id);
        if (data.referral_code_applied) {
          console.log(
            `Referral code ${data.referral_code_applied} applied successfully!`,
          );
        }
        initializePayment(
          {
            order_id: data.order_id,
            email: formData.email,
            amount: cartSummary.total * 100,
            callback_url: `${window.location.origin}/payment/verify/`,
          },
          {
            onSuccess: (payData) => {
              window.location.href = payData.authorization_url;
            },
            onError: handleCheckoutError,
          },
        );
      },
      onError: handleCheckoutError,
    });
  };

  const isLoading = isCreatingOrder || isInitializingPayment || cartLoading;

  if (cartLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Checkout" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Checkout" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              Failed to load cart. Please try again.
            </p>
            <button
              onClick={() => navigate(-1)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Checkout" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const deliveryStatus = checkDeliveryTimeAvailability();

  return (
    <div className="h-auto bg-gray-50 py-4 mt-38 lg:mt-0">
      <div className="w-full mx-auto px-4 md:px-8">
        {/* Delivery Hours Banner */}
        <div className="mb-6 bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="shrink-0">
              <svg
                className="h-5 w-5 text-blue-500"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Delivery Hours:</strong> Our riders are available from
                7:00 AM to 6:00 PM daily.
                {deliveryStatus.available && (
                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    ✓ Available Now
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Information */}
                <div className="border-b border-gray-200 pb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">
                    Contact Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div className="mt-6">
                    <label
                      htmlFor="referralCode"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Referral Code{" "}
                      <span className="text-gray-500 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <input
                      type="text"
                      id="referralCode"
                      name="referralCode"
                      value={formData.referralCode}
                      onChange={handleInputChange}
                      placeholder="Enter referral code"
                      disabled={isLoading}
                      maxLength={20}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed uppercase"
                      style={{ textTransform: "uppercase" }}
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Have a referral code? Enter it here to support your
                      referrer!
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-6 border-b border-gray-200 pb-8">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Shipping Address
                  </h3>

                  <div>
                    <label
                      htmlFor="address"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Hostel Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      required
                      disabled={isLoading}
                      placeholder="Enter your hostel address"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="room"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Delivery Address
                      </label>
                      <input
                        type="text"
                        id="room"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Vendor Proximity Question */}
                <div className="space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">
                      Is this vendor near you?
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      This helps us match you with a nearby student picker if
                      one is available.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setVendorNearby(true)}
                      className={`flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 disabled:cursor-not-allowed ${
                        vendorNearby === true
                          ? "border-yellow-400 bg-yellow-50 text-yellow-800"
                          : "border-gray-200 bg-white text-gray-600 hover:border-yellow-200 hover:bg-yellow-50/40"
                      }`}
                    >
                      <span className="text-xl leading-none">📍</span>
                      <span>Yes, nearby</span>
                      {vendorNearby === true && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-yellow-400 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      )}
                    </button>

                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => setVendorNearby(false)}
                      className={`flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl border-2 font-medium text-sm transition-all duration-200 disabled:cursor-not-allowed ${
                        vendorNearby === false
                          ? "border-gray-400 bg-gray-50 text-gray-800"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl leading-none">🗺️</span>
                      <span>No, far away</span>
                      {vendorNearby === false && (
                        <span className="ml-auto w-4 h-4 rounded-full bg-gray-400 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-2.5 h-2.5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </span>
                      )}
                    </button>
                  </div>

                  {vendorNearby === true && (
                    <p className="text-xs text-yellow-700 bg-yellow-50 border border-yellow-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0">🎒</span>A student
                      picker near you may be assigned to handle this delivery.
                    </p>
                  )}
                  {vendorNearby === false && (
                    <p className="text-xs text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 flex items-start gap-1.5">
                      <span className="mt-0.5 flex-shrink-0">🛵</span>Your order
                      will be assigned to a regular delivery rider.
                    </p>
                  )}
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    type="button"
                    onClick={goback}
                    disabled={isLoading}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Back to Cart
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-linear-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Processing...
                      </span>
                    ) : (
                      "Place Order & Pay"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-8 sticky top-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">
                Order Summary
              </h3>

              <div className="space-y-4 mb-8">
                {cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="relative shrink-0">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.png";
                          }}
                        />
                        <span className="absolute -top-2 -right-2 bg-yellow-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </h4>
                        <span className="text-lg font-bold text-yellow-600">
                          {formatCurrency(Number(item.product_price))}
                        </span>
                      </div>
                    </div>
                    {item.delivery_day && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Delivery Day</span>
                          <span className="font-medium text-gray-900">
                            {item.delivery_day}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cartSummary.subTotal)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cartSummary.shippingFee)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(cartSummary.tax)}
                  </span>
                </div>
                {cartSummary.takeaway > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Takeaway Fee</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(cartSummary.takeaway)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-yellow-600">
                    {formatCurrency(cartSummary.total)}
                  </span>
                </div>
              </div>

              {vendorNearby !== null && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div
                    className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${vendorNearby ? "bg-yellow-50 text-yellow-700" : "bg-gray-50 text-gray-500"}`}
                  >
                    <span>{vendorNearby ? "📍" : "🗺️"}</span>
                    <span className="font-medium">
                      {vendorNearby
                        ? "Vendor marked as nearby"
                        : "Vendor marked as far away"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
