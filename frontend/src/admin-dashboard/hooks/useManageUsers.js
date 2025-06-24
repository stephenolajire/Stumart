// hooks/useManageUsers.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../constant/api";

// Query Keys
export const USERS_QUERY_KEY = "users";

// Query function for fetching users
const fetchUsers = async ({ query, userType, verified }) => {
  let url = "admin/users/";
  const params = new URLSearchParams();

  if (query) params.append("query", query);
  if (userType) params.append("user_type", userType);
  if (verified) params.append("verified", verified);

  if (params.toString()) {
    url += `?${params.toString()}`;
  }

  const response = await api.get(url);
  return response.data;
};

// Hook for fetching users with filters
export const useUsers = (filters = {}) => {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, filters],
    queryFn: () => fetchUsers(filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes
    keepPreviousData: true, // Keep previous data while fetching new data
    refetchOnWindowFocus: false,
  });
};

// Mutation for updating user status
export const useToggleUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isActive }) => {
      const response = await api.put(`users/${userId}/`, {
        is_active: !isActive,
      });
      return response.data;
    },
    onMutate: async ({ userId, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [USERS_QUERY_KEY] });

      // Snapshot previous value
      const previousUsers = queryClient.getQueriesData({
        queryKey: [USERS_QUERY_KEY],
      });

      // Optimistically update all user queries
      queryClient.setQueriesData({ queryKey: [USERS_QUERY_KEY] }, (old) => {
        if (!old) return old;
        return old.map((user) =>
          user.id === userId ? { ...user, is_active: !isActive } : user
        );
      });

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      // Revert optimistic update on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
};

// Mutation for updating verification status
export const useToggleVerificationStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, isVerified }) => {
      const response = await api.put(`users/${userId}/`, {
        is_verified: !isVerified,
      });
      return response.data;
    },
    onMutate: async ({ userId, isVerified }) => {
      await queryClient.cancelQueries({ queryKey: [USERS_QUERY_KEY] });

      const previousUsers = queryClient.getQueriesData({
        queryKey: [USERS_QUERY_KEY],
      });

      queryClient.setQueriesData({ queryKey: [USERS_QUERY_KEY] }, (old) => {
        if (!old) return old;
        return old.map((user) =>
          user.id === userId ? { ...user, is_verified: !isVerified } : user
        );
      });

      return { previousUsers };
    },
    onError: (err, variables, context) => {
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
};
