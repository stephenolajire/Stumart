import api from "../constant/api";

export const stumartService = {
  // ── Products ───────────────────────────────────────────────
  getAllProducts: (params) => api.get("/stumart/products/all/", { params }),

  getProduct: (id) => api.get(`/stumart/products/${id}/`),

  searchProducts: (params) => api.get("stumart/products/search/", { params }),

  // ── Vendor Products ────────────────────────────────────────
  getVendorProducts: () => api.get("/stumart/vendor/products/"),

  getShopProducts: (shopId, params) =>
    api.get(`/stumart/vendor/products/${shopId}`, { params }),

  createVendorProduct: (formData) =>
    api.post("/stumart/vendor/products/", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  getSpecificVendorProducts: (id) => api.get(`/stumart/vendor/products/${id}/`),

  getProductDetail: (pk) => api.get(`/stumart/vendor/products/${pk}/detail/`),

  updateVendorProduct: ({ pk, formData }) =>
    api.patch(`/stumart/vendor/products/${pk}/detail/`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  deleteVendorProduct: (pk) =>
    api.delete(`/stumart/vendor/products/${pk}/detail/`),

  // ── Shops / Vendors ────────────────────────────────────────
  getVendorsByCategory: (params) =>
    api.get("/stumart/shops/by-category/", { params }),

  getVendorsBySchoolAndCategory: (params) =>
    api.get("/stumart/shops/by-school-and-category/", { params }),

  // ── Services ───────────────────────────────────────────────
  getServiceDetail: (pk) => api.get(`/stumart/services/${pk}/`),

  searchServices: (params) => api.get("/stumart/services/search/", { params }),

  searchSpecificService: (params) =>
    api.get("/stumart/services/search/specific/", { params }),

  // ── Service Applications ───────────────────────────────────
  submitServiceApplication: (payload) =>
    api.post("/stumart/service-applications/", payload),

  getMySubmittedApplications: () =>
    api.get("/stumart/service-applications/mine/"),

  getUserServiceApplications: () =>
    api.get("/stumart/service-applications/user/"),

  getVendorServiceApplications: () =>
    api.get("/stumart/service-applications/vendor/"),

  updateApplicationStatus: ({ pk, status }) =>
    api.patch(`/stumart/service-applications/${pk}/update-status/`, { status }),

  // ── Reviews ────────────────────────────────────────────────
  createVendorReview: (payload) =>
    api.post("/stumart/reviews/vendor/", payload),

  createPickerReview: (payload) =>
    api.post("/stumart/reviews/picker/", payload),

  submitReviews: (payload) => api.post("/stumart/reviews/submit/", payload),

  getUserReviews: () => api.get("/stumart/reviews/user/"),

  // ── Product Reviews ────────────────────────────────────────
  getProductReviews: (productId) =>
    api.get(`/stumart/products/${productId}/reviews/`),

  createProductReview: ({ productId, payload }) =>
    api.post(`/stumart/products/${productId}/reviews/create/`, payload),

  updateProductReview: ({ productId, reviewId, payload }) =>
    api.patch(`/stumart/products/${productId}/reviews/${reviewId}/`, payload),

  deleteProductReview: ({ productId, reviewId }) =>
    api.delete(`/stumart/products/${productId}/reviews/${reviewId}/`),

  getUserReviewStatus: (productId) =>
    api.get(`/stumart/products/${productId}/user-review-status/`),

  // ── Videos ─────────────────────────────────────────────────
  getBothVideos: () => api.get("/stumart/videos/both/"),
}