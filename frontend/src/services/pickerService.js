import api from "../constant/api";

const pickerService = {
  getDashboard: () => api.get("/picker/dashboard/"),

  getAvailableDeliveries: (filter = "all") =>
    api.get("/picker/available-deliveries/", { params: { filter } }),

  acceptOrder: (orderId) =>
    api.post(`/picker/available-delivery/${orderId}/accept/`),

  getMyDeliveries: (deliveryStatus = "active") =>
    api.get("/picker/my-deliveries/", { params: { status: deliveryStatus } }),

  markDelivered: (orderId) => api.post(`/picker/orders/${orderId}/deliver/`),

  getOrderDetail: (orderId) => api.get(`/picker/orders/${orderId}/`),

  getEarnings: (period = "week") =>
    api.get("/picker/earnings/", { params: { period } }),

  getReviews: () => api.get("/picker/reviews/"),

  getSettings: () => api.get("/picker/settings/"),

  updateSettings: (data) =>
    api.patch("/picker/settings/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),

  confirmDelivery: (id) => api.post(`/picker/confirm/${id}/`),
};

export default pickerService;
