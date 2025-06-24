import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../constant/api";

// Query keys
const QUERY_KEYS = {
  orders: (filters) => ["orders", filters],
  orderDetail: (orderId) => ["order", orderId],
};

// Fetch orders with filters
export const useOrders = (filters = {}) => {
  return useQuery({
    queryKey: QUERY_KEYS.orders(filters),
    queryFn: async () => {
      try {
        // Create URLSearchParams for query parameters
        const params = new URLSearchParams();

        // Add filters to URL params
        if (filters.query) params.append("query", filters.query);
        if (filters.status) params.append("status", filters.status);

        console.log(`Fetching orders with filters:`, filters);
        const response = await api.get("admin-orders/", { params });
        console.log("Orders data received:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching orders:", error);
        throw new Error("Failed to fetch orders. Please try again later.");
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes (orders change frequently)
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true, // Refetch when window regains focus (important for orders)
    retry: 2,
    refetchInterval: 30 * 1000, // Auto-refetch every 30 seconds for real-time updates
  });
};

// Fetch single order details
export const useOrderDetail = (orderId) => {
  return useQuery({
    queryKey: QUERY_KEYS.orderDetail(orderId),
    queryFn: async () => {
      try {
        console.log(`Fetching order detail for ID: ${orderId}`);
        const response = await api.get(`admin-orders/${orderId}/`);
        console.log("Order detail received:", response.data);
        return response.data;
      } catch (error) {
        console.error("Error fetching order detail:", error);
        throw new Error(
          "Failed to fetch order details. Please try again later."
        );
      }
    },
    enabled: !!orderId, // Only run query if orderId is provided
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });
};

// Update order status
export const useUpdateOrderStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, status, notes }) => {
      console.log(`Updating order ${orderId} status to ${status}`);

      const response = await api.patch(`admin-orders/${orderId}/status/`, {
        status,
        notes,
      });

      return response.data;
    },
    onMutate: async ({ orderId, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });

      // Snapshot the previous values
      const previousOrders = queryClient.getQueriesData({
        queryKey: ["orders"],
      });
      const previousOrderDetail = queryClient.getQueryData(["order", orderId]);

      // Optimistically update all order queries
      queryClient.setQueriesData({ queryKey: ["orders"] }, (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((order) =>
          order.id === orderId
            ? { ...order, status, updated_at: new Date().toISOString() }
            : order
        );
      });

      // Optimistically update order detail if it exists
      if (previousOrderDetail) {
        queryClient.setQueryData(["order", orderId], {
          ...previousOrderDetail,
          status,
          updated_at: new Date().toISOString(),
        });
      }

      // Return a context object with the snapshotted values
      return { previousOrders, previousOrderDetail, orderId };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrders) {
        context.previousOrders.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousOrderDetail) {
        queryClient.setQueryData(
          ["order", context.orderId],
          context.previousOrderDetail
        );
      }

      console.error("Error updating order status:", err);
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
};

// Cancel order
export const useCancelOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      console.log(`Cancelling order ${orderId} with reason: ${reason}`);

      const response = await api.patch(`admin-orders/${orderId}/cancel/`, {
        reason,
      });

      return response.data;
    },
    onMutate: async ({ orderId }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["orders"] });
      await queryClient.cancelQueries({ queryKey: ["order", orderId] });

      // Snapshot the previous values
      const previousOrders = queryClient.getQueriesData({
        queryKey: ["orders"],
      });
      const previousOrderDetail = queryClient.getQueryData(["order", orderId]);

      // Optimistically update all order queries
      queryClient.setQueriesData({ queryKey: ["orders"] }, (oldData) => {
        if (!oldData) return oldData;

        return oldData.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: "CANCELLED",
                updated_at: new Date().toISOString(),
              }
            : order
        );
      });

      // Optimistically update order detail if it exists
      if (previousOrderDetail) {
        queryClient.setQueryData(["order", orderId], {
          ...previousOrderDetail,
          status: "CANCELLED",
          updated_at: new Date().toISOString(),
        });
      }

      // Return a context object with the snapshotted values
      return { previousOrders, previousOrderDetail, orderId };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousOrders) {
        context.previousOrders.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      if (context?.previousOrderDetail) {
        queryClient.setQueryData(
          ["order", context.orderId],
          context.previousOrderDetail
        );
      }

      console.error("Error cancelling order:", err);
    },
    onSettled: (data, error, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });
    },
  });
};

// Assign picker to order
export const useAssignPickerToOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, pickerId, pickerType }) => {
      console.log(`Assigning ${pickerType} ${pickerId} to order ${orderId}`);

      const response = await api.patch(
        `admin-orders/${orderId}/assign-picker/`,
        {
          picker_id: pickerId,
          picker_type: pickerType,
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch order queries
      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["order", variables.orderId] });

      // Also invalidate picker queries if they exist
      queryClient.invalidateQueries({ queryKey: ["pickers"] });
    },
    onError: (err) => {
      console.error("Error assigning picker to order:", err);
    },
  });
};
