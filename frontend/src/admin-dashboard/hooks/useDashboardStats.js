// hooks/useDashboardStats.js
import { useQuery } from "@tanstack/react-query";
import api from "../../constant/api";

// Query function
const fetchDashboardStats = async () => {
  const response = await api.get("admin/stats/");
  return response.data;
};

export const useDashboardStats = (options = {}) => {
  return useQuery({
    queryKey: ["dashboardStats"],
    queryFn: fetchDashboardStats,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};


