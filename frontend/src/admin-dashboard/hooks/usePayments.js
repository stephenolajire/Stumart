// hooks/usePayments.js
import { useQuery } from "@tanstack/react-query";
import api from "../../constant/api";

// Query key factory for payments
export const paymentKeys = {
  all: ["payments"],
  transactions: (filters) => [...paymentKeys.all, "transactions", filters],
};

// Fetch payment transactions with filters
const fetchPaymentTransactions = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.query) {
    params.append("query", filters.query);
  }

  if (filters.status) {
    params.append("status", filters.status);
  }

  const response = await api.get("admin-payments/", { params });
  return response.data;
};

// Hook to get payment transactions
export const usePaymentTransactions = (filters = {}) => {
  return useQuery({
    queryKey: paymentKeys.transactions(filters),
    queryFn: () => fetchPaymentTransactions(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// If you need additional payment-related queries, you can add them here
// For example, payment statistics, payment methods, etc.

// Hook to get payment statistics (example)
const fetchPaymentStats = async () => {
  const response = await api.get("admin-payments/stats/");
  return response.data;
};

export const usePaymentStats = () => {
  return useQuery({
    queryKey: [...paymentKeys.all, "stats"],
    queryFn: fetchPaymentStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
