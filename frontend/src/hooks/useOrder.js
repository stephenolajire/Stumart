import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orderService } from "../services/orderService";

export const orderKeys = {
  detail: (orderNumber) => ["order-detail", orderNumber],
  history: ["order-history"],
  deliveryOpportunity: (uniqueCode) => ["delivery-opportunity", uniqueCode],
  deliveryConfirmation: (code) => ["delivery-confirmation", code],
  customerConfirmation: (code) => ["customer-confirmation", code],
};

// ── Queries ───────────────────────────────────────────────────

export const useGetOrderDetail = (orderNumber) =>
  useQuery({
    queryKey: orderKeys.detail(orderNumber),
    queryFn: () => orderService.getOrderDetail(orderNumber).then((r) => r.data),
    enabled: !!orderNumber,
  });

export const useGetOrderHistory = () =>
  useQuery({
    queryKey: orderKeys.history,
    queryFn: () => orderService.getOrderHistory().then((r) => r.data),
  });

export const useGetDeliveryOpportunity = (uniqueCode) =>
  useQuery({
    queryKey: orderKeys.deliveryOpportunity(uniqueCode),
    queryFn: () =>
      orderService.getDeliveryOpportunity(uniqueCode).then((r) => r.data),
    enabled: !!uniqueCode,
  });

export const useGetDeliveryConfirmation = (deliveryConfirmationCode) =>
  useQuery({
    queryKey: orderKeys.deliveryConfirmation(deliveryConfirmationCode),
    queryFn: () =>
      orderService
        .getDeliveryConfirmation(deliveryConfirmationCode)
        .then((r) => r.data),
    enabled: !!deliveryConfirmationCode,
  });

export const useGetCustomerConfirmation = (customerConfirmationCode) =>
  useQuery({
    queryKey: orderKeys.customerConfirmation(customerConfirmationCode),
    queryFn: () =>
      orderService
        .getCustomerConfirmation(customerConfirmationCode)
        .then((r) => r.data),
    enabled: !!customerConfirmationCode,
  });

// ── Mutations ─────────────────────────────────────────────────

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => orderService.createOrder(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.history });
    },
  });
};

export const useInitializePayment = () =>
  useMutation({
    mutationFn: (data) =>
      orderService.initializePayment(data).then((r) => r.data),
  });

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params) =>
      orderService.verifyPayment(params).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.history });
    },
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) =>
      orderService.cancelOrder(orderId).then((r) => r.data),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: orderKeys.history });
    },
  });
};

export const usePackOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => orderService.packOrder(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.history });
    },
  });
};

export const useAcceptDelivery = () =>
  useMutation({
    mutationFn: (data) => orderService.acceptDelivery(data).then((r) => r.data),
  });

export const useConfirmDelivery = () =>
  useMutation({
    mutationFn: (data) =>
      orderService.confirmDelivery(data).then((r) => r.data),
  });

export const useCustomerConfirmDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      orderService.customerConfirmDelivery(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.history });
    },
  });
};

export const usePayWithWallet = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => orderService.payWithWallet(data).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: orderKeys.history });
    },
  });
};
