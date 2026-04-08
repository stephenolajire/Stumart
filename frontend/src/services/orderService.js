import api from "../constant/api";

export const orderService = {
  createOrder: (data) => api.post("order/create/", data),

  initializePayment: (data) => api.post("order/payment/initialize/", data),

  verifyPayment: (params) => api.get("order/payment/verify/", { params }),

  payWithWallet: (data) => api.post("order/payment/wallet/", data), // ← new

  getOrderDetail: (orderNumber) => api.get(`order/${orderNumber}/`),

  getOrderHistory: () => api.get("order/history/"),

  cancelOrder: (orderId) => api.post(`order/${orderId}/cancel/`),

  packOrder: (data) => api.post("order/pack/", data),

  getDeliveryOpportunity: (uniqueCode) =>
    api.get(`order/delivery/accept/${uniqueCode}/`),

  acceptDelivery: (data) => api.post("order/delivery/accept/", data),

  getDeliveryConfirmation: (deliveryConfirmationCode) =>
    api.get(`order/delivery/confirm/${deliveryConfirmationCode}/`),

  confirmDelivery: (data) => api.post("order/delivery/confirm/", data),

  getCustomerConfirmation: (customerConfirmationCode) =>
    api.get(`order/delivery/customer-confirm/${customerConfirmationCode}/`),

  customerConfirmDelivery: (data) =>
    api.post("order/delivery/customer-confirm/", data),
};
