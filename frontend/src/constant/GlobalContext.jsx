import { createContext, useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";
import { jwtDecode } from "jwt-decode";

export const GlobalContext = createContext();

// Query keys factory
const queryKeys = {
  shops: ["shops"],
  shopsBySchool: (school) => ["shops", "by-school", school],
  products: (shopId) => ["products", shopId],
  product: (productId) => ["product", productId],
  allProducts: (filters, viewMode, isAuth) => [
    "all-products",
    { ...filters, viewMode, isAuth },
  ],
  cart: (cartCode) => ["cart", cartCode],
  orders: ["orders"],
  search: (params) => ["search", params],
  videos: ["videos"],
};

// Custom hooks for each data type
export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const user_type = localStorage.getItem("user_type");

  const auth = useCallback(async () => {
    const token = localStorage.getItem("access");

    if (!token) {
      setIsAuthenticated(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      const expiryDate = decoded.exp;
      const currentTime = Date.now() / 1000;

      if (expiryDate > currentTime) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        localStorage.removeItem("access");
      }
    } catch (error) {
      console.error("Error decoding token:", error);
      setIsAuthenticated(false);
    }
  }, []);

  useEffect(() => {
    auth();
  }, [auth]);

  return { isAuthenticated, auth, user_type };
};

export const useShops = () => {
  return useQuery({
    queryKey: queryKeys.shops,
    queryFn: async () => {
      const response = await api.get("vendors/");
      return response.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes (formerly cacheTime)
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useShopsBySchool = (schoolName) => {
  return useQuery({
    queryKey: queryKeys.shopsBySchool(schoolName),
    queryFn: async () => {
      if (!schoolName) return [];
      const response = await api.get("shops-by-school/", {
        params: { school: schoolName },
      });
      return response.data || [];
    },
    enabled: !!schoolName,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useProducts = (shopId) => {
  return useQuery({
    queryKey: queryKeys.products(shopId),
    queryFn: async () => {
      const response = await api.get(`vendor-products/${shopId}`);
      return {
        products: response.data.products || response.data,
        details: response.data.vendor_details || {},
      };
    },
    enabled: !!shopId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useProduct = (productId) => {
  return useQuery({
    queryKey: queryKeys.product(productId),
    queryFn: async () => {
      const response = await api.get(`product/${productId}`);
      return response.data;
    },
    enabled: !!productId,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useAllProducts = (
  filters = {},
  viewMode = "school",
  isAuthenticated = false
) => {
  return useQuery({
    queryKey: queryKeys.allProducts(filters, viewMode, isAuthenticated),
    queryFn: async () => {
      const apiParams = new URLSearchParams();

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          apiParams.set(key, value);
        }
      });

      // Handle view mode logic
      if (isAuthenticated) {
        if (viewMode === "school") {
          apiParams.set("viewOtherProducts", "false");
        } else if (viewMode === "other") {
          apiParams.set("viewOtherProducts", "true");
        }
      }

      const response = await api.get(`/all-products/?${apiParams}`);
      const responseData = response.data;
      console.log("API Response:", responseData);

      // Handle both paginated and non-paginated responses
      const productsArray = responseData.results || responseData;

      // Extract unique categories from the products
      const uniqueCategories = [
        ...new Set(productsArray.map((product) => product.vendor_category)),
      ]
        .filter(Boolean)
        .sort();

      // Extract unique vendors from the products
      const uniqueVendors = [
        ...new Map(
          productsArray
            .filter((product) => product.vendor_name && product.vendor_id)
            .map((product) => [
              product.vendor_id,
              {
                id: product.vendor_id,
                name: product.vendor_name,
              },
            ])
        ).values(),
      ];

      // Return the complete response structure
      return {
        // For paginated responses, preserve the pagination structure
        ...responseData,
        // Ensure products is always available for backward compatibility
        products: productsArray,
        categories: uniqueCategories,
        vendors: uniqueVendors,
      };
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

export const useCart = () => {
  const getCartCode = () => localStorage.getItem("cart_code");

  return useQuery({
    queryKey: queryKeys.cart(getCartCode()),
    queryFn: async () => {
      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};
      const response = await api.get("cart/", { params });

      return {
        items: response.data.items || [],
        summary: {
          subTotal: response.data.sub_total || 0,
          shippingFee: response.data.shipping_fee || 0,
          tax: response.data.tax || 0,
          total: response.data.total || 0,
        },
        count: response.data.count || 0,
      };
    },
    staleTime: 2 * 60 * 1000, // 2 minutes for cart (more dynamic)
    gcTime: 5 * 60 * 1000,
    retry: (failureCount, error) => {
      // Don't retry on 404 errors (cart not found)
      if (error?.response?.status === 404) {
        return false;
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: true, // Refetch cart on focus
  });
};

export const useOrders = (isAuthenticated) => {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: async () => {
      const response = await api.get("orders/");
      return response.data;
    },
    enabled: isAuthenticated,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Videos hook
export const useVideos = () => {
  return useQuery({
    queryKey: queryKeys.videos,
    queryFn: async () => {
      const response = await api.get("videos/both/");
      return response.data || {};
    },
    staleTime: 30 * 60 * 1000, // 30 minutes (videos change infrequently)
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2,
    refetchOnWindowFocus: false,
  });
};

// Search hook (no caching as it's dynamic)
export const useProductSearch = () => {
  const [searchResults, setSearchResults] = useState([]);

  const searchMutation = useMutation({
    mutationFn: async (searchParams) => {
      const params = {
        product_name: searchParams.productName,
        ...(searchParams.institution && {
          institution: searchParams.institution,
        }),
        ...(searchParams.state && { state: searchParams.state }),
      };

      const response = await api.get("search-products/", { params });
      return response.data;
    },
    onSuccess: (data) => {
      if (data && data.products) {
        setSearchResults(data.products);
      } else {
        setSearchResults([]);
      }
    },
    onError: () => {
      setSearchResults([]);
    },
  });

  return {
    searchResults,
    searchProducts: searchMutation.mutate,
    isSearching: searchMutation.isPending,
    searchError: searchMutation.error,
  };
};

// Cart mutations
export const useCartMutations = () => {
  const queryClient = useQueryClient();

  const generateCartCode = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("cart_code", code);
    return code;
  }, []);

  const addToCartMutation = useMutation({
    mutationFn: async ({ productId, quantity = 1 }) => {
      const cartCode = localStorage.getItem("cart_code") || generateCartCode();
      const response = await api.post("add-to-cart/", {
        product_id: productId,
        quantity: quantity,
        cart_code: cartCode,
      });
      return response.data;
    },
    onSuccess: () => {
      // Invalidate cart query to refetch fresh data
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const removeFromCartMutation = useMutation({
    mutationFn: async (itemId) => {
      const response = await api.delete(`remove-from-cart/${itemId}/`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  const updateCartItemMutation = useMutation({
    mutationFn: async ({ itemId, quantity }) => {
      const response = await api.patch(`update-cart-item/${itemId}/`, {
        quantity: quantity,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    },
  });

  return {
    addToCart: addToCartMutation.mutate,
    removeFromCart: removeFromCartMutation.mutate,
    updateCartItem: updateCartItemMutation.mutate,
    isAddingToCart: addToCartMutation.isPending,
    isRemovingFromCart: removeFromCartMutation.isPending,
    isUpdatingCart: updateCartItemMutation.isPending,
    generateCartCode,
  };
};

export const GlobalProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const auth = useAuth();

  // Utility functions
  const clearCache = useCallback(
    (cacheType = "all") => {
      if (cacheType === "all") {
        queryClient.clear();
      } else if (cacheType === "shops") {
        queryClient.removeQueries({ queryKey: ["shops"] });
      } else if (cacheType === "products") {
        queryClient.removeQueries({ queryKey: ["products"] });
      } else if (cacheType === "allProducts") {
        queryClient.removeQueries({ queryKey: ["all-products"] });
      } else if (cacheType === "cart") {
        queryClient.removeQueries({ queryKey: ["cart"] });
      } else if (cacheType === "videos") {
        queryClient.removeQueries({ queryKey: ["videos"] });
      }
    },
    [queryClient]
  );

  const prefetchShops = useCallback(() => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.shops,
      queryFn: async () => {
        const response = await api.get("vendors/");
        return response.data;
      },
      staleTime: 10 * 60 * 1000,
    });
  }, [queryClient]);

  const contextValue = {
    // Authentication
    ...auth,

    // Utility functions
    clearCache,
    prefetchShops,
    queryClient,

    // Custom hooks (components will use these directly)
    useShops,
    useShopsBySchool,
    useProducts,
    useProduct,
    useAllProducts,
    useCart,
    useOrders,
    useProductSearch,
    useCartMutations,
    useVideos,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};
