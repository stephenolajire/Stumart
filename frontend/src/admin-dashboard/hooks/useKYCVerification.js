// hooks/useKYCVerification.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../constant/api";

// Query key factory for KYC verifications
export const kycKeys = {
  all: ["kyc"],
  verifications: (filters) => [...kycKeys.all, "verifications", filters],
  verification: (id) => [...kycKeys.all, "verification", id],
};

// Fetch KYC verifications with filters
const fetchKYCVerifications = async (filters = {}) => {
  const params = new URLSearchParams();

  if (filters.status) {
    params.append("status", filters.status);
  }

  if (filters.user_type) {
    params.append("user_type", filters.user_type);
  }

  const response = await api.get("admin-kyc-verification/", { params });
  return response.data;
};

// Hook to get KYC verifications
export const useKYCVerifications = (filters = {}) => {
  return useQuery({
    queryKey: kycKeys.verifications(filters),
    queryFn: () => fetchKYCVerifications(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Update KYC verification status
const updateKYCStatus = async ({
  id,
  verification_status,
  rejection_reason,
}) => {
  const payload = { verification_status };

  if (verification_status === "rejected" && rejection_reason) {
    payload.rejection_reason = rejection_reason;
  }

  const response = await api.put(`admin-kyc-verification/${id}/`, payload);
  return response.data;
};

// Hook to update KYC verification status
export const useUpdateKYCStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateKYCStatus,
    onSuccess: (data, variables) => {
      // Invalidate and refetch all KYC verification queries
      queryClient.invalidateQueries({ queryKey: kycKeys.all });

      // Optionally update the cache directly for better UX
      queryClient.setQueriesData(
        { queryKey: kycKeys.verifications() },
        (oldData) => {
          if (!oldData) return oldData;

          return oldData.map((verification) =>
            verification.id === variables.id
              ? {
                  ...verification,
                  verification_status: variables.verification_status,
                  rejection_reason:
                    variables.rejection_reason || verification.rejection_reason,
                  verification_date: new Date().toISOString(),
                }
              : verification
          );
        }
      );
    },
    onError: (error) => {
      console.error("Error updating KYC status:", error);
    },
  });
};

// Fetch single KYC verification details (if needed)
const fetchKYCVerification = async (id) => {
  const response = await api.get(`admin-kyc-verification/${id}/`);
  return response.data;
};

// Hook to get single KYC verification
export const useKYCVerification = (id) => {
  return useQuery({
    queryKey: kycKeys.verification(id),
    queryFn: () => fetchKYCVerification(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
  });
};

// If you need KYC statistics, you can add them here
const fetchKYCStats = async () => {
  const response = await api.get("admin-kyc-verification/stats/");
  return response.data;
};

export const useKYCStats = () => {
  return useQuery({
    queryKey: [...kycKeys.all, "stats"],
    queryFn: fetchKYCStats,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
};
