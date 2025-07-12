// src/services/vendorApi.js
import api from "../constant/api";

// Vendor Dashboard API Service
const vendorApi = {
  // Dashboard Overview
  getDashboardStats: async () => {
    try {
      const response = await api.get("/dashboard/stats/");
      return response.data;
      console.log("Dashboard Stats:", response.data);
    } catch (error) {
      throw error;
    }
  },

  // Products
  getProducts: async () => {
    try {
      const response = await api.get("/vendor-items/");
      return response.data;
      console.log("Products:", response.data);
    } catch (error) {
      throw error;
    }
  },

  createProduct: async (productData) => {
    try {
      const response = await api.post("/vendor-items/", productData);
      return response.data;
      console.log("Created Product:", response.data);
    } catch (error) {
      throw error;
    }
  },

  updateProduct: async (productId, productData) => {
    try {
      const response = await api.put(
        `/vendor-items/${productId}/`,
        productData
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteProduct: async (productId) => {
    try {
      const response = await api.delete(`/vendor-items/${productId}/`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Orders
  getOrders: async () => {
    try {
      const response = await api.get("vendor-orders/");
      return response.data;
      console.log("Orders:", response.data);
    } catch (error) {
      throw error;
      console.error("Error fetching orders:", error);
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const response = await api.post(`/orders/${orderId}/update_status/`, {
        status,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Inventory
  getInventory: async () => {
    try {
      const response = await api.get("/inventory/");
      return response.data;
      console.log("Inventory:", response.data);
    } catch (error) {
      throw error;
    }
  },

  updateStock: async (productId, stock) => {
    try {
      const response = await api.post(`/inventory/${productId}/update_stock/`, {
        stock,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Payments
  getPayments: async () => {
    try {
      const response = await api.get("/payments/");
      return response.data;
      // console.log("Payments:", response.data);
    } catch (error) {
      throw error;
    }
  },

  getPaymentSummary: async () => {
    try {
      const response = await api.get("/payments/summary/");
      return response.data;
      // console.log("Payment Summary:", response.data);
    } catch (error) {
      throw error;
    }
  },

  requestWithdrawal: async (amount) => {
    try {
      const response = await api.post("payments/withdraw/", { amount });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getWithdrawalHistory: async () => {
    try {
      const response = await api.get("payments/withdrawal_history/");
      console.log(response.data)
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reviews
  getReviews: async () => {
    try {
      const response = await api.get("/reviews/");
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  respondToReview: async (reviewId, response) => {
    try {
      const response = await api.post(`/reviews/${reviewId}/respond/`, {
        response,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

export default vendorApi;
