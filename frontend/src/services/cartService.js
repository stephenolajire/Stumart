// services/cartService.js
// cart_code removed — the JWT in the Authorization header identifies the user.
import api from "../constant/api";

export const cartService = {
  getCart: () => api.get("/cart/"),

  addToCart: (payload) => api.post("/cart/add/", payload),

  updateCartItem: (itemId, payload) =>
    api.put(`/cart/item/${itemId}/update/`, payload),

  removeCartItem: (itemId) => api.delete(`/cart/item/${itemId}/remove/`),

  clearCart: () => api.delete("/cart/clear/"),
};
