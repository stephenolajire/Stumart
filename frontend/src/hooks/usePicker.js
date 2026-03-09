import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import pickerService from "../services/pickerService";

export const PICKER_KEYS = {
  all: ["picker"],
  dashboard: () => [...PICKER_KEYS.all, "dashboard"],
  availableDeliveries: (filter) => [
    ...PICKER_KEYS.all,
    "available-deliveries",
    filter,
  ],
  myDeliveries: (status) => [...PICKER_KEYS.all, "my-deliveries", status],
  orderDetail: (orderId) => [...PICKER_KEYS.all, "order", orderId],
  earnings: (period) => [...PICKER_KEYS.all, "earnings", period],
  reviews: () => [...PICKER_KEYS.all, "reviews"],
  settings: () => [...PICKER_KEYS.all, "settings"],
};

export const usePickerDashboard = () =>
  useQuery({
    queryKey: PICKER_KEYS.dashboard(),
    queryFn: () => pickerService.getDashboard().then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

export const useAvailableDeliveries = (filter = "all") =>
  useQuery({
    queryKey: PICKER_KEYS.availableDeliveries(filter),
    queryFn: () =>
      pickerService.getAvailableDeliveries(filter).then((r) => r.data),
    staleTime: 1000 * 30,
  });

export const useMyDeliveries = (deliveryStatus = "active") =>
  useQuery({
    queryKey: PICKER_KEYS.myDeliveries(deliveryStatus),
    queryFn: () =>
      pickerService.getMyDeliveries(deliveryStatus).then((r) => r.data),
    staleTime: 1000 * 60,
  });

export const useOrderDetail = (orderId) =>
  useQuery({
    queryKey: PICKER_KEYS.orderDetail(orderId),
    queryFn: () => pickerService.getOrderDetail(orderId).then((r) => r.data),
    enabled: !!orderId,
  });

export const usePickerEarnings = (period = "week") =>
  useQuery({
    queryKey: PICKER_KEYS.earnings(period),
    queryFn: () => pickerService.getEarnings(period).then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

export const usePickerReviews = () =>
  useQuery({
    queryKey: PICKER_KEYS.reviews(),
    queryFn: () => pickerService.getReviews().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

export const usePickerSettings = () =>
  useQuery({
    queryKey: PICKER_KEYS.settings(),
    queryFn: () => pickerService.getSettings().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

export const useAcceptOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => pickerService.acceptOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.all });
    },
  });
};

export const useMarkDelivered = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId) => pickerService.markDelivered(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({
        queryKey: PICKER_KEYS.myDeliveries("active"),
      });
      queryClient.invalidateQueries({
        queryKey: PICKER_KEYS.myDeliveries("completed"),
      });
      queryClient.invalidateQueries({
        queryKey: PICKER_KEYS.orderDetail(orderId),
      });
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.dashboard() });
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.earnings("week") });
    },
  });
};

export const useConfirmDelivery = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => pickerService.confirmDelivery(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: PICKER_KEYS.myDeliveries("active"),
      });
      queryClient.invalidateQueries({
        queryKey: PICKER_KEYS.myDeliveries("completed"),
      });
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.orderDetail(id) });
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.dashboard() });
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.earnings("week") });
    },
  });
};

export const useUpdatePickerSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => pickerService.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.settings() });
      queryClient.invalidateQueries({ queryKey: PICKER_KEYS.dashboard() });
    },
  });
};
