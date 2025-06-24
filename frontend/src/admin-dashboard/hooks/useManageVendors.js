import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../constant/api";

// Query keys for better cache management
const QUERY_KEYS = {
  vendors: (filters) => ["vendors", filters],
  vendor: (id) => ["vendor", id],
};

// Fetch vendors with filters
export const useVendors = (filters = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.vendors(filters),
    queryFn: async () => {
      let url = "admin/vendors/";
      const params = new URLSearchParams();

      // Add filters to query params
      if (filters.query) params.append("query", filters.query);
      if (filters.category) params.append("category", filters.category);
      if (filters.verified) params.append("verified", filters.verified);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await api.get(url);
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    keepPreviousData: true, // Keep previous data while fetching new data
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// Fetch single vendor details
export const useVendor = (vendorId) => {
  return useQuery({
    queryKey: QUERY_KEYS.vendor(vendorId),
    queryFn: async () => {
      const response = await api.get(`admin/vendors/${vendorId}/`);
      return response.data;
    },
    enabled: !!vendorId, // Only run query if vendorId is provided
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
};

// Toggle vendor verification status
export const useToggleVendorVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, isVerified }) => {
      const response = await api.put(`vendors/${vendorId}/`, {
        is_verified: !isVerified,
      });
      return response.data;
    },
    onMutate: async ({ vendorId, isVerified }) => {
      // Cancel outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["vendors"] });

      // Snapshot the previous value
      const previousVendors = queryClient.getQueriesData({
        queryKey: ["vendors"],
      });

      // Optimistically update all vendor queries
      queryClient.setQueriesData({ queryKey: ["vendors"] }, (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((vendor) =>
          vendor.id === vendorId
            ? { ...vendor, is_verified: !isVerified }
            : vendor
        );
      });

      // Also update single vendor query if it exists
      queryClient.setQueryData(QUERY_KEYS.vendor(vendorId), (oldData) => {
        if (!oldData) return oldData;
        return { ...oldData, is_verified: !isVerified };
      });

      return { previousVendors };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates on error
      if (context?.previousVendors) {
        context.previousVendors.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error updating vendor verification:", err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
  });
};

// Delete vendor (if needed)
export const useDeleteVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vendorId) => {
      const response = await api.delete(`admin/vendors/${vendorId}/`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch vendor queries
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
    onError: (err) => {
      console.error("Error deleting vendor:", err);
    },
  });
};

// Update vendor details
export const useUpdateVendor = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ vendorId, data }) => {
      const response = await api.put(`admin/vendors/${vendorId}/`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Update the vendor in the cache
      queryClient.setQueryData(QUERY_KEYS.vendor(variables.vendorId), data);

      // Update vendor in all vendor list queries
      queryClient.setQueriesData({ queryKey: ["vendors"] }, (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((vendor) =>
          vendor.id === variables.vendorId ? data : vendor
        );
      });
    },
    onError: (err) => {
      console.error("Error updating vendor:", err);
    },
  });
};

// Custom hook for business categories (could be fetched from API if dynamic)
export const useBusinessCategories = () => {
  return {
    data: [
      "Food",
      "Clothing",
      "Electronics",
      "Books",
      "Services",
      "Health",
      "Beauty",
      "Accessories",
      "Other",
    ],
    isLoading: false,
    error: null,
  };
};
