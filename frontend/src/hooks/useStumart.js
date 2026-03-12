import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stumartService } from "../services/stumartService";

export const stumartKeys = {
  // Products
  allProducts: (params) => ["products-all", params],
  product: (id) => ["product", id],
  searchProducts: (params) => ["products-search", params],

  // Vendor Products
  vendorProducts: ["vendor-products"],
  specificVendorProducts: (id, page) => ["specific-vendor-products", id, page],
  productDetail: (pk) => ["product-detail", pk],

  // Shops
  vendorsByCategory: (params) => ["stumart-vendors-by-category", params],
  vendorsBySchoolAndCategory: (params) => [
    "stumart-vendors-by-school-and-category",
    params,
  ],

  // Services
  serviceDetail: (pk) => ["service-detail", pk],
  searchServices: (params) => ["services-search", params],
  searchSpecificService: (params) => ["services-search-specific", params],

  // Service Applications
  myApplications: ["applications-mine"],
  userApplications: ["applications-user"],
  vendorApplications: ["applications-vendor"],

  // Reviews
  userReviews: ["reviews-user"],
  productReviews: (productId) => ["reviews-product", productId],
  userReviewStatus: (productId) => ["reviews-status", productId],

  shopProducts: (shopId, page) => ["shop-products", shopId, page],

  // Videos
  bothVideos: ["videos-both"],
};

// ── Products ──────────────────────────────────────────────────────────────────

export const useGetAllProducts = (params) =>
  useQuery({
    queryKey: stumartKeys.allProducts(params),
    queryFn: () => stumartService.getAllProducts(params).then((r) => r.data),
  });

export const useGetProduct = (id) =>
  useQuery({
    queryKey: stumartKeys.product(id),
    queryFn: () => stumartService.getProduct(id).then((r) => r.data),
    enabled: !!id,
  });

export const useGetShopProducts = (shopId, page = 1, pageSize = 20) =>
  useQuery({
    queryKey: stumartKeys.shopProducts(shopId, page),
    queryFn: () =>
      stumartService
        .getShopProducts(shopId, { page, page_size: pageSize })
        .then((r) => ({
          products: r.data.products || [],
          details: r.data.vendor_details || {},
          pagination: r.data.pagination || {},
        })),
    enabled: !!shopId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

export const useSearchProducts = (params) =>
  useQuery({
    queryKey: stumartKeys.searchProducts(params),
    queryFn: () => stumartService.searchProducts(params).then((r) => r.data),
    enabled: !!params?.product_name || !!params?.state || !!params?.institution,
  });

// ── Vendor Products ───────────────────────────────────────────────────────────

export const useGetVendorProducts = () =>
  useQuery({
    queryKey: stumartKeys.vendorProducts,
    queryFn: () => stumartService.getVendorProducts().then((r) => r.data),
  });

export const useCreateVendorProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => stumartService.createVendorProduct(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stumartKeys.vendorProducts });
    },
  });
};

export const useGetSpecificVendorProducts = (id, page = 1, pageSize = 20) =>
  useQuery({
    queryKey: stumartKeys.specificVendorProducts(id, page), // 👈 page in key
    queryFn: () =>
      stumartService
        .getSpecificVendorProducts(id, page, pageSize)
        .then((r) => ({
          products: r.data.products || [],
          details: r.data.vendor_details || {},
          pagination: r.data.pagination || {},
        })),
    enabled: !!id,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
    placeholderData: (previousData) => previousData,
  });

// stumartKeys


export const useGetProductDetail = (pk) =>
  useQuery({
    queryKey: stumartKeys.productDetail(pk),
    queryFn: () => stumartService.getProductDetail(pk).then((r) => r.data),
    enabled: !!pk,
  });

export const useUpdateVendorProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pk, formData }) =>
      stumartService.updateVendorProduct({ pk, formData }),
    onSuccess: (_, { pk }) => {
      queryClient.invalidateQueries({
        queryKey: stumartKeys.productDetail(pk),
      });
      queryClient.invalidateQueries({ queryKey: stumartKeys.vendorProducts });
    },
  });
};

export const useDeleteVendorProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (pk) => stumartService.deleteVendorProduct(pk),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stumartKeys.vendorProducts });
    },
  });
};

// ── Shops / Vendors ───────────────────────────────────────────────────────────

export const useGetStumartVendorsByCategory = (params) =>
  useQuery({
    queryKey: stumartKeys.vendorsByCategory(params),
    queryFn: () =>
      stumartService.getVendorsByCategory(params).then((r) => r.data),
    enabled: !!params?.category,
  });

export const useGetVendorsBySchoolAndCategory = (params) =>
  useQuery({
    queryKey: stumartKeys.vendorsBySchoolAndCategory(params),
    queryFn: () =>
      stumartService.getVendorsBySchoolAndCategory(params).then((r) => r.data),
    enabled: !!params?.school && !!params?.category,
  });

// ── Services ──────────────────────────────────────────────────────────────────

export const useGetServiceDetail = (pk) =>
  useQuery({
    queryKey: stumartKeys.serviceDetail(pk),
    queryFn: () => stumartService.getServiceDetail(pk).then((r) => r.data),
    enabled: !!pk,
  });

export const useSearchServices = (params) =>
  useQuery({
    queryKey: stumartKeys.searchServices(params),
    queryFn: () => stumartService.searchServices(params).then((r) => r.data),
    enabled: !!params?.q,
  });

export const useSearchSpecificService = (params) =>
  useQuery({
    queryKey: stumartKeys.searchSpecificService(params),
    queryFn: () =>
      stumartService.searchSpecificService(params).then((r) => r.data),
    enabled: !!params?.q,
  });

// ── Service Applications ──────────────────────────────────────────────────────

export const useSubmitServiceApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => stumartService.submitServiceApplication(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stumartKeys.myApplications });
      queryClient.invalidateQueries({ queryKey: stumartKeys.userApplications });
    },
  });
};

export const useGetMySubmittedApplications = () =>
  useQuery({
    queryKey: stumartKeys.myApplications,
    queryFn: () =>
      stumartService.getMySubmittedApplications().then((r) => r.data),
  });

export const useGetUserServiceApplications = () =>
  useQuery({
    queryKey: stumartKeys.userApplications,
    queryFn: () =>
      stumartService.getUserServiceApplications().then((r) => r.data),
  });

export const useGetVendorServiceApplications = () =>
  useQuery({
    queryKey: stumartKeys.vendorApplications,
    queryFn: () =>
      stumartService.getVendorServiceApplications().then((r) => r.data),
  });

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pk, status }) =>
      stumartService.updateApplicationStatus({ pk, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: stumartKeys.vendorApplications,
      });
      queryClient.invalidateQueries({ queryKey: stumartKeys.userApplications });
    },
  });
};

// ── Reviews ───────────────────────────────────────────────────────────────────

export const useCreateVendorReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => stumartService.createVendorReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stumartKeys.userReviews });
    },
  });
};

export const useGetProductReviews = (productId) =>
  useQuery({
    queryKey: stumartKeys.productReviews(productId),
    queryFn: () =>
      stumartService.getProductReviews(productId).then((r) => r.data),
    enabled: !!productId,
  });

export const useCreateProductReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, payload }) =>
      stumartService.createProductReview(productId, payload),
    onSuccess: (_, { productId }) => {
      queryClient.invalidateQueries({
        queryKey: stumartKeys.productReviews(productId),
      });
      queryClient.invalidateQueries({
        queryKey: stumartKeys.userReviewStatus(productId),
      });
    },
  });
};

export const useGetUserReviewStatus = (productId) =>
  useQuery({
    queryKey: stumartKeys.userReviewStatus(productId),
    queryFn: () =>
      stumartService.getUserReviewStatus(productId).then((r) => r.data),
    enabled: !!productId,
  });

export const useCreatePickerReview = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => stumartService.createPickerReview(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stumartKeys.userReviews });
    },
  });
};

export const useGetUserReviews = () =>
  useQuery({
    queryKey: stumartKeys.userReviews,
    queryFn: () => stumartService.getUserReviews().then((r) => r.data),
  });

export const useSubmitReviews = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload) => stumartService.submitReviews(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: stumartKeys.userReviews });
    },
  });
};
