import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../constant/api";

// Query keys
const QUERY_KEYS = {
  pickers: (filters) => ["pickers", filters],
};

// Fetch pickers with filters
export const usePickers = (filters = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.pickers(filters),
    queryFn: async () => {
      try {
        let url = "admin-pickers/";
        const params = new URLSearchParams();

        // Add filters to URL params
        if (filters.query) params.append("query", filters.query);
        if (filters.picker_type)
          params.append("picker_type", filters.picker_type);
        if (filters.is_available)
          params.append("is_available", filters.is_available);

        if (params.toString()) {
          url += `?${params.toString()}`;
        }

        console.log(`Fetching pickers with URL: ${url}`);
        const response = await api.get(url);
        console.log("Pickers data received:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching pickers:", error);
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
};

// Toggle picker availability
export const useTogglePickerAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pickerId, pickerType, isAvailable }) => {
      console.log(
        `Toggling availability for ${pickerType} with ID ${pickerId} to ${isAvailable}`
      );

      const response = await api.put(`pickers/${pickerId}/${pickerType}/`, {
        is_available: isAvailable,
      });

      return response.data;
    },
    onMutate: async ({ pickerId, pickerType, isAvailable }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["pickers"] });

      // Snapshot the previous value
      const previousPickers = queryClient.getQueriesData({
        queryKey: ["pickers"],
      });

      // Optimistically update all picker queries
      queryClient.setQueriesData({ queryKey: ["pickers"] }, (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((picker) =>
          picker.id === pickerId && picker.picker_type === pickerType
            ? { ...picker, is_available: isAvailable }
            : picker
        );
      });

      // Return a context object with the snapshotted value
      return { previousPickers };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPickers) {
        context.previousPickers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error updating availability status:", err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["pickers"] });
    },
  });
};

// Toggle picker verification
export const useTogglePickerVerification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ pickerId, pickerType, isVerified }) => {
      console.log(
        `Toggling verification for ${pickerType} with ID ${pickerId} to ${isVerified}`
      );

      const response = await api.put(`pickers/${pickerId}/${pickerType}/`, {
        is_verified: isVerified,
      });

      return response.data;
    },
    onMutate: async ({ pickerId, pickerType, isVerified }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["pickers"] });

      // Snapshot the previous value
      const previousPickers = queryClient.getQueriesData({
        queryKey: ["pickers"],
      });

      // Optimistically update all picker queries
      queryClient.setQueriesData({ queryKey: ["pickers"] }, (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((picker) =>
          picker.id === pickerId && picker.picker_type === pickerType
            ? { ...picker, is_verified: isVerified }
            : picker
        );
      });

      // Return a context object with the snapshotted value
      return { previousPickers };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousPickers) {
        context.previousPickers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      console.error("Error updating verification status:", err);
    },
    onSettled: () => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["pickers"] });
    },
  });
};
