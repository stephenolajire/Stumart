import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import {
  getVendorsByCategory,
  getProductsByCategory,
  getCategoryLatestProducts,
  getVendorsBySchool,
} from "../services/vendorHomeService";

export const useVendorsByCategory = (params, options = {}) => {
  return useQuery({
    queryKey: ["vendors", "category", params],
    queryFn: () => getVendorsByCategory(params),
    enabled: !!params.category, // Only run if category is provided
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

export const useInfiniteVendorsByCategory = (params, options = {}) => {
  return useInfiniteQuery({
    queryKey: ["vendors", "category", "infinite", params],
    queryFn: ({ pageParam = 1 }) =>
      getVendorsByCategory({ ...params, page: pageParam }),
    enabled: !!params.category,
    getNextPageParam: (lastPage) => {
      // Extract page number from next URL
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return parseInt(url.searchParams.get("page")) || undefined;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useProductsByCategory = (params, options = {}) => {
  return useQuery({
    queryKey: ["products", "category", params],
    queryFn: () => getProductsByCategory(params),
    enabled: !!params.category,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useInfiniteProductsByCategory = (params, options = {}) => {
  return useInfiniteQuery({
    queryKey: ["products", "category", "infinite", params],
    queryFn: ({ pageParam = 1 }) =>
      getProductsByCategory({ ...params, page: pageParam }),
    enabled: !!params.category,
    getNextPageParam: (lastPage) => {
      if (lastPage.next) {
        const url = new URL(lastPage.next);
        return parseInt(url.searchParams.get("page")) || undefined;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

export const useCategoryLatestProducts = (options = {}) => {
  return useQuery({
    queryKey: ["categories", "products", "latest"],
    queryFn: getCategoryLatestProducts,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (same as backend)
    ...options,
  });
};

export const useVendorsBySchool = (school, options = {}) => {
  return useQuery({
    queryKey: ["vendors", "school", school],
    queryFn: () => getVendorsBySchool(school),
    enabled: !!school,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes (same as backend)
    ...options,
  });
};
