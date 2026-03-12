import { useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { homeService } from "../services/homeService";
import { GlobalContext } from "../constant/GlobalContext";

export const homeKeys = {
  vendorsByCategory: (params) => ["vendors-by-category", params],
  productsByCategory: (params) => ["products-by-category", params],
  categoriesLastFive: ["categories-last-five"],
  vendorsBySchool: ["vendors-by-school"],
  heroProducts: (isAuthenticated) => ["hero-products", isAuthenticated],
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
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

export const useGetCategoriesLastFive = () =>
  useQuery({
    queryKey: homeKeys.categoriesLastFive,
    queryFn: () => homeService.getCategoriesLastFive().then((r) => r.data),
  });

export const useGetVendorsBySchool = () => {
  const { isAuthenticated } = useContext(GlobalContext);

  return useQuery({
    queryKey: [...homeKeys.vendorsBySchool, isAuthenticated],
    queryFn: () => homeService.getVendorsBySchool().then((r) => r.data),
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
};

export const useGetHeroProducts = () => {
  const { isAuthenticated } = useContext(GlobalContext);

  return useQuery({
    queryKey: homeKeys.heroProducts(isAuthenticated),
    queryFn: () => homeService.getHeroProducts().then((r) => r.data),
    staleTime: 0,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const useGetAllVendorNames = (params) =>
  useQuery({
    queryKey: ["vendor-names", params],
    queryFn: () =>
      homeService.getAllVendorNames(params).then((res) => res.data),
  });
