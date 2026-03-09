import api from "../constant/api";

const vendorService = {
  getDashboardStats: () => api.get("/vendor/dashboard/stats/"),

  getOrders: () => api.get("/vendor/orders/"),

  getVendorDetails: () => api.get("/vendor/details/"),

  getReviews: () => api.get("/vendor/reviews/"),

  getAssignedPicker: (orderId) =>
    api.get("/vendor/assigned-picker/", { params: { order_id: orderId } }),

  getProducts: () => api.get("/vendor/items/"),

  createProduct: (data) => api.post("/vendor/items/", data),

  updateProduct: (id, data) => api.put(`/vendor/items/${id}/`, data),

  patchProduct: (id, data) => api.patch(`/vendor/items/${id}/`, data),

  deleteProduct: (id) => api.delete(`/vendor/items/${id}/`),

  getInventory: () => api.get("/vendor/inventory/"),

  updateStock: (productId, data) =>
    api.post(`/vendor/products/${productId}/update-stock/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getStockDetails: (productId) =>
    api.get(`/vendor/products/${productId}/update-stock/`),

  getStockHistory: (productId) =>
    api.get(`/vendor/products/${productId}/stock-history/`),

  updatePromotion: (productId, promotionalPrice) =>
    api.post(`/vendor/products/${productId}/update-promotion/`, {
      promotional_price: promotionalPrice,
    }),

  applyBulkDiscount: (data) =>
    api.post("/vendor/products/bulk-discount/", data),

  removeBulkDiscount: () => api.delete("/vendor/products/bulk-discount/"),

  getPayments: () => api.get("/vendor/payments/"),

  getPaymentSummary: () => api.get("/vendor/payments/summary/"),

  getSupportedBanks: () => api.get("/vendor/payments/supported_banks/"),

  verifyAccount: (data) => api.post("/vendor/payments/verify_account/", data),

  withdraw: (data) => api.post("/vendor/payments/withdraw/", data),

  getWithdrawalHistory: (params) =>
    api.get("/vendor/payments/withdrawal_history/", { params }),

  getWithdrawalLimits: () => api.get("/vendor/payments/withdrawal_limits/"),

  getSettings: () => api.get("/vendor/settings/"),

  updateAccount: (data) =>
    api.put("/vendor/settings/account/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  patchAccount: (data) =>
    api.patch("/vendor/settings/account/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updateStore: (data) =>
    api.put("/vendor/settings/store/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  patchStore: (data) =>
    api.patch("/vendor/settings/store/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  updatePaymentInfo: (data) => api.put("/vendor/settings/payment/", data),

  patchPaymentInfo: (data) => api.patch("/vendor/settings/payment/", data),

  changePassword: (data) => api.post("/vendor/settings/password/", data),

  getProfile: () => api.get("/vendor/profile/"),

  getAdminVendorProducts: (vendorId) =>
    api.get(`/vendor/admin/${vendorId}/products/`),
};

export default vendorService;
