import React, { useContext, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalContext, useArea } from "../constant/GlobalContext";
import { useNavigate } from "react-router-dom";
import api from "../constant/api";
import Header from "../components/Header";
import Swal from "sweetalert2";

const Checkout = () => {
  // Form states
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    room: "",
    saveInfo: false,
  });

  // Area selection states
  const [selectedAreaId, setSelectedAreaId] = useState("");
  const [showManualAddress, setShowManualAddress] = useState(false);

  const { useCart } = useContext(GlobalContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: areaData, isLoading: areaLoading } = useArea();
  // console.log("Area Data:", areaData);

  // Get cart data using the hook from context
  const {
    data: cartData,
    isLoading: cartLoading,
    error: cartError,
  } = useCart();

  // Extract cart information with fallbacks
  const cartItems = cartData?.items || [];
  const cartSummary = cartData?.summary || {
    subTotal: 0,
    shippingFee: 0,
    tax: 0,
    total: 0,
  };

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      const response = await api.post("orders/create/", orderData);
      return response.data;
    },
    onSuccess: (data) => {
      // Store order ID
      localStorage.setItem("order_id", data.order_id);
      // Initiate payment
      initializePayment({
        order_id: data.order_id,
        email: formData.email,
        amount: cartSummary.total * 100, // Paystack requires amount in kobo
        callback_url: `${window.location.origin}/payment/verify/`,
      });
    },
    onError: (error) => {
      handleCheckoutError(error);
    },
  });

  // Initialize payment mutation
  const initializePaymentMutation = useMutation({
    mutationFn: async (paymentData) => {
      const response = await api.post("payment/initialize/", paymentData);
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to Paystack payment page
      window.location.href = data.authorization_url;
    },
    onError: (error) => {
      handleCheckoutError(error);
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: async () => {
      const cartCode = localStorage.getItem("cart_code");
      if (cartCode) {
        const response = await api.delete(`clear-cart/`, {
          params: { cart_code: cartCode },
        });
        return response.data;
      }
    },
    onSuccess: () => {
      // Invalidate cart queries
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const goback = () => {
    navigate(-1);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `₦${Number(amount)
      .toFixed(2)
      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  // Handle area selection
  const handleAreaSelection = (e) => {
    const areaId = e.target.value;
    setSelectedAreaId(areaId);

    if (areaId) {
      // Find selected area and set address
      const selectedArea = areaData.find(
        (area) => area.id.toString() === areaId
      );
      if (selectedArea) {
        setFormData({
          ...formData,
          address: selectedArea.name, // Assuming area has a 'name' field
        });
      }
    } else {
      setFormData({
        ...formData,
        address: "",
      });
    }
  };

  // Toggle manual address input
  const toggleManualAddress = () => {
    setShowManualAddress(true);
    setSelectedAreaId("");
    setFormData({
      ...formData,
      address: "",
    });
  };

  // Initialize payment helper
  const initializePayment = (paymentData) => {
    initializePaymentMutation.mutate(paymentData);
  };

  // Enhanced error handling
  const handleCheckoutError = (err) => {
    console.error("Checkout error:", err);

    if (err.response?.data?.error_details) {
      // Handle the multiple institutions error specifically
      const errorDetails = err.response.data.error_details;
      const institutions = errorDetails.multiple_institutions_found;
      const vendorsByInstitution = errorDetails.vendors_by_institution;

      // Create a detailed message showing vendors by institution
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
        html: `
          <div style="text-align: left;">
            <p><strong>Error:</strong> ${err.response.data.message}</p>
            <br>
            <p><strong>Vendors by Institution:</strong></p>
            <div style="margin-left: 10px;">
              ${institutionDetails}
            </div>
            <p><strong>Suggestion:</strong> ${errorDetails.suggestion}</p>
          </div>
        `,
        confirmButtonText: "Go Back to Cart",
        confirmButtonColor: "#3085d6",
        width: "500px",
        customClass: {
          htmlContainer: "swal-html-container",
        },
      }).then((result) => {
        if (result.isConfirmed) {
          navigate(-1);
        }
      });
    } else {
      // Handle other types of errors
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate cart
    if (!cartItems.length) {
      Swal.fire({
        icon: "warning",
        title: "Empty Cart",
        text: "Your cart is empty. Please add items before checkout.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Validate address selection
    if (
      areaData &&
      areaData.length > 0 &&
      !selectedAreaId &&
      !showManualAddress
    ) {
      Swal.fire({
        icon: "warning",
        title: "Address Required",
        text: "Please select an area or enter your address manually.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    // Prepare order data
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
      total: cartSummary.total,
      // Add area_id if selected
      ...(selectedAreaId && { area_id: selectedAreaId }),
      // Add vendors information if available
      ...(cartData?.vendors && { vendors: cartData.vendors }),
    };

    // Create order
    createOrderMutation.mutate(orderData);
  };

  // Loading states
  const isLoading =
    createOrderMutation.isPending ||
    initializePaymentMutation.isPending ||
    cartLoading;

  // Show loading if cart is still loading
  if (cartLoading || areaLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Checkout" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error if cart failed to load
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
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show empty cart message
  if (!cartItems.length) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header title="Checkout" />
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <button
              onClick={() => navigate("/")}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-2 rounded-lg transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-auto bg-gray-50 py-4 mt-31 lg:mt-0">
      {/* <Header title="Checkout" /> */}

      <div className="w-full mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Information Section */}
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address Section */}
                <div className="space-y-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Shipping Address
                  </h3>

                  {/* Area Selection */}
                  {areaData && areaData.length > 0 && !showManualAddress && (
                    <div>
                      <label
                        htmlFor="area"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Select Your Area
                      </label>
                      <select
                        id="area"
                        name="area"
                        value={selectedAreaId}
                        onChange={handleAreaSelection}
                        required={!showManualAddress}
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >
                        <option value="">Select an area</option>
                        {areaData.map((area) => (
                          <option key={area.id} value={area.id}>
                            {area.name}
                          </option>
                        ))}
                      </select>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={toggleManualAddress}
                          disabled={isLoading}
                          className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Don't see your area? Enter address manually
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Manual Address Input */}
                  {(showManualAddress ||
                    (areaData && areaData.length === 0)) && (
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
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />

                      {areaData && areaData.length > 0 && showManualAddress && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowManualAddress(false);
                              setFormData({ ...formData, address: "" });
                            }}
                            disabled={isLoading}
                            className="text-amber-600 hover:text-amber-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            ← Back to area selection
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Address Display (when area is selected) */}
                  {selectedAreaId && !showManualAddress && formData.address && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Selected Address
                      </label>
                      <div className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                        {formData.address}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="room"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Room Number
                      </label>
                      <input
                        type="text"
                        id="room"
                        name="room"
                        value={formData.room}
                        onChange={handleInputChange}
                        required
                        disabled={isLoading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-200 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
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
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
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

          {/* Order summary */}
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
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.product_image}
                          alt={item.product_name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = "/placeholder-image.png"; // Add fallback image
                          }}
                        />
                        <span className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {item.product_name}
                        </h4>
                        <span className="text-lg font-bold text-amber-600">
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
                <div className="flex justify-between text-lg font-bold text-gray-900 pt-3 border-t border-gray-200">
                  <span>Total</span>
                  <span className="text-amber-600">
                    {formatCurrency(cartSummary.total)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
