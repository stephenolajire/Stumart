import { useQuery } from "@tanstack/react-query";
import { homeService } from "../services/homeService";

export const homeKeys = {
  vendorsByCategory: (params) => ["vendors-by-category", params],
  productsByCategory: (params) => ["products-by-category", params],
  categoriesLastFive: ["categories-last-five"],
  vendorsBySchool: (params) => ["vendors-by-school", params],
};

export const useGetVendorsByCategory = (params) =>
  useQuery({
    queryKey: homeKeys.vendorsByCategory(params),
    queryFn: () => homeService.getVendorsByCategory(params).then((r) => r.data),
    enabled: !!params?.category,
  });

export const useGetProductsByCategory = (params) =>
  useQuery({
    queryKey: homeKeys.productsByCategory(params),
    queryFn: () =>
      homeService.getProductsByCategory(params).then((r) => r.data),
    enabled: !!params?.category,
  });

export const useGetCategoriesLastFive = () =>
  useQuery({
    queryKey: homeKeys.categoriesLastFive,
    queryFn: () => homeService.getCategoriesLastFive().then((r) => r.data),
  });

export const useGetVendorsBySchool = (school) =>
  useQuery({
    queryKey: ["vendors-by-school", school],
    queryFn: () => homeService.getVendorsBySchool(school).then((r) => r.data),
    enabled: true,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
export const useGetAllVendorNames = (params) =>
  useQuery({
    queryKey: ["vendor-names", params],
    queryFn: () =>
      homeService.getAllVendorNames(params).then((res) => res.data),
    enabled: true, // public endpoint, always fetch
  });
