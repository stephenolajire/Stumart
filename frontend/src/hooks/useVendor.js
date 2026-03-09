import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import vendorService from "../services/vendorService";

export const VENDOR_KEYS = {
  all: ["vendor"],
  dashboard: () => [...VENDOR_KEYS.all, "dashboard"],
  orders: () => [...VENDOR_KEYS.all, "orders"],
  details: () => [...VENDOR_KEYS.all, "details"],
  reviews: () => [...VENDOR_KEYS.all, "reviews"],
  picker: (orderId) => [...VENDOR_KEYS.all, "picker", orderId],
  products: () => [...VENDOR_KEYS.all, "products"],
  product: (id) => [...VENDOR_KEYS.products(), id],
  stockDetails: (id) => [...VENDOR_KEYS.products(), id, "stock"],
  stockHistory: (id) => [...VENDOR_KEYS.products(), id, "history"],
  inventory: () => [...VENDOR_KEYS.all, "inventory"],
  payments: () => [...VENDOR_KEYS.all, "payments"],
  paymentSummary: () => [...VENDOR_KEYS.payments(), "summary"],
  banks: () => [...VENDOR_KEYS.payments(), "banks"],
  withdrawalHistory: (params) => [
    ...VENDOR_KEYS.payments(),
    "withdrawals",
    params,
  ],
  withdrawalLimits: () => [...VENDOR_KEYS.payments(), "limits"],
  settings: () => [...VENDOR_KEYS.all, "settings"],
  profile: () => [...VENDOR_KEYS.all, "profile"],
  adminVendorProducts: (vendorId) => [
    ...VENDOR_KEYS.all,
    "admin",
    vendorId,
    "products",
  ],
};

export const useDashboardStats = () =>
  useQuery({
    queryKey: VENDOR_KEYS.dashboard(),
    queryFn: () => vendorService.getDashboardStats().then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

export const useVendorOrders = () =>
  useQuery({
    queryKey: VENDOR_KEYS.orders(),
    queryFn: () => vendorService.getOrders().then((r) => r.data),
    staleTime: 1000 * 60,
  });

export const useVendorDetails = () =>
  useQuery({
    queryKey: VENDOR_KEYS.details(),
    queryFn: () => vendorService.getVendorDetails().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

export const useVendorReviews = () =>
  useQuery({
    queryKey: VENDOR_KEYS.reviews(),
    queryFn: () => vendorService.getReviews().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

export const useAssignedPicker = (orderId, options = {}) =>
  useQuery({
    queryKey: VENDOR_KEYS.picker(orderId),
    queryFn: () => vendorService.getAssignedPicker(orderId).then((r) => r.data),
    enabled: !!orderId,
    ...options,
  });

export const useVendorProducts = () =>
  useQuery({
    queryKey: VENDOR_KEYS.products(),
    queryFn: () => vendorService.getProducts().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

export const useStockDetails = (productId) =>
  useQuery({
    queryKey: VENDOR_KEYS.stockDetails(productId),
    queryFn: () => vendorService.getStockDetails(productId).then((r) => r.data),
    enabled: !!productId,
  });

export const useStockHistory = (productId) =>
  useQuery({
    queryKey: VENDOR_KEYS.stockHistory(productId),
    queryFn: () => vendorService.getStockHistory(productId).then((r) => r.data),
    enabled: !!productId,
  });

export const useInventory = () =>
  useQuery({
    queryKey: VENDOR_KEYS.inventory(),
    queryFn: () => vendorService.getInventory().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

export const usePayments = () =>
  useQuery({
    queryKey: VENDOR_KEYS.payments(),
    queryFn: () => vendorService.getPayments().then((r) => r.data),
    staleTime: 1000 * 60 * 5,
  });

export const usePaymentSummary = () =>
  useQuery({
    queryKey: VENDOR_KEYS.paymentSummary(),
    queryFn: () => vendorService.getPaymentSummary().then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

export const useSupportedBanks = () =>
  useQuery({
    queryKey: VENDOR_KEYS.banks(),
    queryFn: () => vendorService.getSupportedBanks().then((r) => r.data),
    staleTime: 1000 * 60 * 60 * 24,
  });

export const useWithdrawalHistory = (params = {}) =>
  useQuery({
    queryKey: VENDOR_KEYS.withdrawalHistory(params),
    queryFn: () =>
      vendorService.getWithdrawalHistory(params).then((r) => r.data),
    staleTime: 1000 * 60 * 2,
  });

export const useWithdrawalLimits = () =>
  useQuery({
    queryKey: VENDOR_KEYS.withdrawalLimits(),
    queryFn: () => vendorService.getWithdrawalLimits().then((r) => r.data),
    staleTime: 1000 * 60 * 60,
  });

export const useSettings = () =>
  useQuery({
    queryKey: VENDOR_KEYS.settings(),
    queryFn: () => vendorService.getSettings().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

export const useVendorProfile = () =>
  useQuery({
    queryKey: VENDOR_KEYS.profile(),
    queryFn: () => vendorService.getProfile().then((r) => r.data),
    staleTime: 1000 * 60 * 10,
  });

export const useAdminVendorProducts = (vendorId) =>
  useQuery({
    queryKey: VENDOR_KEYS.adminVendorProducts(vendorId),
    queryFn: () =>
      vendorService.getAdminVendorProducts(vendorId).then((r) => r.data),
    enabled: !!vendorId,
  });

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.inventory() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.dashboard() });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => vendorService.updateProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.product(id) });
    },
  });
};

export const usePatchProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => vendorService.patchProduct(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.product(id) });
    },
  });
};

export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.inventory() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.dashboard() });
    },
  });
};

export const useUpdateStock = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, data }) =>
      vendorService.updateStock(productId, data),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.inventory() });
      queryClient.invalidateQueries({
        queryKey: VENDOR_KEYS.stockDetails(productId),
      });
      queryClient.invalidateQueries({
        queryKey: VENDOR_KEYS.stockHistory(productId),
      });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.dashboard() });
    },
  });
};

export const useUpdatePromotion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, promotionalPrice }) =>
      vendorService.updatePromotion(productId, promotionalPrice),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.inventory() });
    },
  });
};

export const useApplyBulkDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.applyBulkDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.inventory() });
    },
  });
};

export const useRemoveBulkDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.removeBulkDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.products() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.inventory() });
    },
  });
};

export const useVerifyAccount = () =>
  useMutation({
    mutationFn: vendorService.verifyAccount,
  });

export const useWithdraw = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.withdraw,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.paymentSummary() });
      queryClient.invalidateQueries({
        queryKey: VENDOR_KEYS.withdrawalHistory({}),
      });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.dashboard() });
    },
  });
};

export const useUpdateAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.updateAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.settings() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.profile() });
    },
  });
};

export const usePatchAccount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.patchAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.settings() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.profile() });
    },
  });
};

export const useUpdateStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.updateStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.settings() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.details() });
    },
  });
};

export const usePatchStore = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.patchStore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.settings() });
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.details() });
    },
  });
};

export const useUpdatePaymentInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.updatePaymentInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.settings() });
    },
  });
};

export const usePatchPaymentInfo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vendorService.patchPaymentInfo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: VENDOR_KEYS.settings() });
    },
  });
};

export const useChangePassword = () =>
  useMutation({
    mutationFn: vendorService.changePassword,
  });
