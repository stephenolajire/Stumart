import { createContext, useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import api from "./api";
import { jwtDecode } from "jwt-decode";

export const GlobalContext = createContext();

export const GlobalProvider = ({ children }) => {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const user_type = localStorage.getItem("user_type");

  // Data states
  const [shopsData, setShopsData] = useState([]);
  const [products, setProducts] = useState([]);
  const [product, setProduct] = useState([]);
  const [details, setDetails] = useState({});
  const [cartItems, setCartItems] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  // AllProducts specific states
  const [allProducts, setAllProducts] = useState([]);
  const [allProductsVendors, setAllProductsVendors] = useState([]);
  const [allProductsCategories, setAllProductsCategories] = useState([]);
  const [allProductsLoading, setAllProductsLoading] = useState(false);
  const [allProductsError, setAllProductsError] = useState(null);

  // UI states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [count, setCount] = useState(0);
  const [cartSummary, setCartSummary] = useState({
    subTotal: 0,
    shippingFee: 0,
    tax: 0,
    total: 0,
  });

  // Refs to prevent unnecessary re-renders and API calls
  const hasFetchedShops = useRef(false);
  const hasFetchedCart = useRef(false);
  const lastFetchTimestamp = useRef({});
  const lastAllProductsFetchParams = useRef("");
  const lastAllProductsFetchTimestamp = useRef(0);

  // Enhanced cache with TTL (Time To Live)
  const [cache, setCache] = useState({
    shops: { data: null, timestamp: null, ttl: 5 * 60 * 1000 }, // 5 minutes
    products: {},
    shopsBySchool: {},
    allProducts: {}, // Cache for all products with different filter combinations
  });

  // Helper function to check if cache is valid
  const isCacheValid = useCallback((cacheItem, ttl = 5 * 60 * 1000) => {
    if (!cacheItem || !cacheItem.timestamp) return false;
    return Date.now() - cacheItem.timestamp < ttl;
  }, []);

  // Helper function to generate cache key for all products
  const generateAllProductsCacheKey = useCallback(
    (filters, viewMode, isAuth) => {
      const sortedFilters = Object.keys(filters)
        .sort()
        .reduce((result, key) => {
          if (filters[key]) {
            result[key] = filters[key];
          }
          return result;
        }, {});

      return JSON.stringify({
        ...sortedFilters,
        viewMode,
        isAuthenticated: isAuth,
      });
    },
    []
  );

  const getCartCode = () => {
    return localStorage.getItem("cart_code");
  };

  // Authentication function
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

  // Fetch all products with filters, caching, and duplicate request prevention
  const fetchAllProducts = useCallback(
    async (filters = {}, viewMode = "school", forceRefresh = false) => {
      const now = Date.now();

      // Generate current parameters string for comparison
      const currentParams = generateAllProductsCacheKey(
        filters,
        viewMode,
        isAuthenticated
      );

      // Prevent duplicate requests within 1 second
      if (
        !forceRefresh &&
        lastAllProductsFetchParams.current === currentParams &&
        now - lastAllProductsFetchTimestamp.current < 1000
      ) {
        return {
          products: allProducts,
          categories: allProductsCategories,
          vendors: allProductsVendors,
        };
      }

      // Check cache first (unless forcing refresh)
      if (
        !forceRefresh &&
        cache.allProducts[currentParams] &&
        isCacheValid(cache.allProducts[currentParams])
      ) {
        const cachedData = cache.allProducts[currentParams];

        setAllProducts(cachedData.data.products);
        setAllProductsCategories(cachedData.data.categories);
        setAllProductsVendors(cachedData.data.vendors);
        setAllProductsError(null);

        return cachedData.data;
      }

      // Update tracking variables
      lastAllProductsFetchParams.current = currentParams;
      lastAllProductsFetchTimestamp.current = now;

      try {
        setAllProductsLoading(true);
        setAllProductsError(null);

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

        console.log("Making API request with params:", apiParams.toString());

        const response = await api.get(`/all-products/?${apiParams}`);
        const productsData = response.data.results;

        const uniqueCategories = [
          ...new Set(productsData.map((product) => product.vendor_category)),
        ]
          .filter(Boolean)
          .sort();

        const uniqueVendors = [
          ...new Set(
            productsData.map((product) => ({
              id: product.vendor_id,
              name: product.vendor_name,
            }))
          ),
        ].filter((vendor) => vendor.name);

        // Update state
        setAllProducts(productsData);
        setAllProductsCategories(uniqueCategories);
        setAllProductsVendors(uniqueVendors);
        setAllProductsError(null);

        const resultData = {
          products: productsData,
          categories: uniqueCategories,
          vendors: uniqueVendors,
        };

        // Cache the results
        setCache((prev) => ({
          ...prev,
          allProducts: {
            ...prev.allProducts,
            [currentParams]: {
              data: resultData,
              timestamp: now,
              ttl: 5 * 60 * 1000, // 5 minutes
            },
          },
        }));

        return resultData;
      } catch (err) {
        const errorMessage = "Failed to fetch products";
        setAllProductsError(errorMessage);
        console.error("API Error:", err);

        return {
          products: [],
          categories: [],
          vendors: [],
          error: errorMessage,
        };
      } finally {
        setAllProductsLoading(false);
      }
    },
    [
      allProducts,
      allProductsCategories,
      allProductsVendors,
      cache.allProducts,
      generateAllProductsCacheKey,
      isCacheValid,
      isAuthenticated,
    ]
  );

  // Debounce utility function
  const debounce = useCallback((func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }, []);

  // Debounced version of fetchAllProducts for search input
  const debouncedFetchAllProducts = useCallback(
    debounce((filters, viewMode, forceRefresh = false) => {
      fetchAllProducts(filters, viewMode, forceRefresh);
    }, 300),
    [fetchAllProducts]
  );

  // Clear all products cache
  const clearAllProductsCache = useCallback(() => {
    setCache((prev) => ({
      ...prev,
      allProducts: {},
    }));
    lastAllProductsFetchParams.current = "";
    lastAllProductsFetchTimestamp.current = 0;
  }, []);

  // Reset all products state
  const resetAllProductsState = useCallback(() => {
    setAllProducts([]);
    setAllProductsVendors([]);
    setAllProductsCategories([]);
    setAllProductsError(null);
    setAllProductsLoading(false);
  }, []);

  // Fetch all shops data with proper caching and duplicate request prevention
  const fetchShopData = useCallback(
    async (forceRefresh = false) => {
      const now = Date.now();
      const cacheKey = "vendors";

      // Prevent duplicate requests within 1 second
      if (
        lastFetchTimestamp.current[cacheKey] &&
        now - lastFetchTimestamp.current[cacheKey] < 1000
      ) {
        return shopsData;
      }

      // Check cache first
      if (!forceRefresh && isCacheValid(cache.shops) && cache.shops.data) {
        if (shopsData.length === 0) {
          setShopsData(cache.shops.data);
        }
        return cache.shops.data;
      }

      // If already fetched and not forcing refresh, return existing data
      if (!forceRefresh && hasFetchedShops.current && shopsData.length > 0) {
        return shopsData;
      }

      lastFetchTimestamp.current[cacheKey] = now;
      setLoading(true);

      try {
        const response = await api.get("/vendors");
        if (response.data) {
          setShopsData(response.data);
          setCache((prev) => ({
            ...prev,
            shops: {
              data: response.data,
              timestamp: now,
              ttl: 5 * 60 * 1000,
            },
          }));
          hasFetchedShops.current = true;
          setError(null);
          return response.data;
        }
      } catch (error) {
        setError("Failed to fetch shops data");
        console.error("Error fetching shops:", error);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [cache.shops, isCacheValid, shopsData]
  );

  // Initialize shops data only once
  useEffect(() => {
    if (!hasFetchedShops.current) {
      fetchShopData();
    }
  }, []); // Empty dependency array - only run once

  // Fetch shops by school with proper caching
  const fetchShopsBySchool = useCallback(
    async (schoolName, forceRefresh = false) => {
      if (!schoolName) return [];

      const cacheKey = schoolName.toLowerCase();
      const now = Date.now();

      // Prevent duplicate requests
      if (
        lastFetchTimestamp.current[`school_${cacheKey}`] &&
        now - lastFetchTimestamp.current[`school_${cacheKey}`] < 1000
      ) {
        return cache.shopsBySchool[cacheKey]?.data || [];
      }

      // Check cache
      if (
        !forceRefresh &&
        cache.shopsBySchool[cacheKey] &&
        isCacheValid(cache.shopsBySchool[cacheKey])
      ) {
        return cache.shopsBySchool[cacheKey].data;
      }

      lastFetchTimestamp.current[`school_${cacheKey}`] = now;
      setLoading(true);

      try {
        const response = await api.get("shops-by-school/", {
          params: { school: schoolName },
        });

        const data = response.data || [];

        // Update cache with timestamp
        setCache((prev) => ({
          ...prev,
          shopsBySchool: {
            ...prev.shopsBySchool,
            [cacheKey]: {
              data: data,
              timestamp: now,
              ttl: 5 * 60 * 1000,
            },
          },
        }));

        setError(null);
        return data;
      } catch (err) {
        setError(`Failed to fetch shops for ${schoolName}`);
        console.error("Error fetching shops by school:", err);
        return [];
      } finally {
        setLoading(false);
      }
    },
    [cache.shopsBySchool, isCacheValid]
  );

  // Fetch products for a specific shop with proper caching
  const fetchProducts = useCallback(
    async (shopId, forceRefresh = false) => {
      if (!shopId) return;

      const cacheKey = shopId.toString();
      const now = Date.now();

      // Prevent duplicate requests
      if (
        lastFetchTimestamp.current[`products_${cacheKey}`] &&
        now - lastFetchTimestamp.current[`products_${cacheKey}`] < 1000
      ) {
        return cache.products[cacheKey]?.data;
      }

      // Check cache
      if (
        !forceRefresh &&
        cache.products[cacheKey] &&
        isCacheValid(cache.products[cacheKey])
      ) {
        const cachedData = cache.products[cacheKey].data;
        setProducts(cachedData.products);
        setDetails(cachedData.details);
        return cachedData;
      }

      lastFetchTimestamp.current[`products_${cacheKey}`] = now;
      setLoading(true);

      try {
        const response = await api.get(`vendor-products/${shopId}`);
        if (response.status === 200) {
          const productsData = response.data;
          const vendorDetails = response.data.vendor_details;

          setProducts(productsData);
          setDetails(vendorDetails);

          const dataToCache = {
            products: productsData,
            details: vendorDetails,
          };

          // Update cache with timestamp
          setCache((prev) => ({
            ...prev,
            products: {
              ...prev.products,
              [cacheKey]: {
                data: dataToCache,
                timestamp: now,
                ttl: 3 * 60 * 1000, // 3 minutes for products
              },
            },
          }));

          setError(null);
          return dataToCache;
        }
      } catch (error) {
        setError("Failed to fetch products");
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    },
    [cache.products, isCacheValid]
  );

  // Fetch single product with caching
  const fetchProduct = useCallback(
    async (productId, forceRefresh = false) => {
      if (!productId) return;

      const cacheKey = `single_${productId}`;
      const now = Date.now();

      // Prevent duplicate requests
      if (
        lastFetchTimestamp.current[cacheKey] &&
        now - lastFetchTimestamp.current[cacheKey] < 1000
      ) {
        return cache.products[cacheKey]?.data;
      }

      // Check cache
      if (
        !forceRefresh &&
        cache.products[cacheKey] &&
        isCacheValid(cache.products[cacheKey], 2 * 60 * 1000)
      ) {
        // 2 minutes for single product
        const cachedData = cache.products[cacheKey].data;
        setProduct(cachedData);
        return cachedData;
      }

      lastFetchTimestamp.current[cacheKey] = now;
      setLoading(true);

      try {
        const response = await api.get(`product/${productId}`);
        if (response.data) {
          setProduct(response.data);

          // Update cache with timestamp
          setCache((prev) => ({
            ...prev,
            products: {
              ...prev.products,
              [cacheKey]: {
                data: response.data,
                timestamp: now,
                ttl: 2 * 60 * 1000,
              },
            },
          }));

          setError(null);
          return response.data;
        }
      } catch (error) {
        setError("Failed to fetch product details");
        console.error("Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    },
    [cache.products, isCacheValid]
  );

  // Search products (no caching needed as search is dynamic)
  const searchProducts = useCallback(
    async (searchParams) => {
      setLoading(true);
      try {
        const params = {
          product_name: searchParams.productName,
          ...(searchParams.institution && {
            institution: searchParams.institution,
          }),
          ...(searchParams.state && { state: searchParams.state }),
        };

        const response = await api.get("search-products/", { params });

        if (response.data && response.data.products) {
          setSearchResults(response.data.products);
          setError(null);
          return {
            success: true,
            products: response.data.products,
            count: response.data.products.length,
          };
        } else {
          setSearchResults([]);
          return {
            success: false,
            message: `No products matching "${searchParams.productName}" found in the selected location.`,
          };
        }
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);

        let errorMessage = "Product is not available.";
        if (isAuthenticated && error.status === 404) {
          errorMessage = "Product not found in your school.";
        }

        return {
          success: false,
          message: errorMessage,
          error: error,
        };
      } finally {
        setLoading(false);
      }
    },
    [isAuthenticated]
  );

  // Cart functions
  const generateCartCode = useCallback(() => {
    const code = Math.random().toString(36).substring(2, 10);
    localStorage.setItem("cart_code", code);
    return code;
  }, []);

  const fetchCartData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    const cacheKey = "cart";

    // Prevent duplicate requests within 500ms
    if (
      !forceRefresh &&
      lastFetchTimestamp.current[cacheKey] &&
      now - lastFetchTimestamp.current[cacheKey] < 500
    ) {
      return;
    }

    // If already fetched cart and not forcing refresh, skip
    if (!forceRefresh && hasFetchedCart.current) {
      return;
    }

    lastFetchTimestamp.current[cacheKey] = now;

    try {
      setLoading(true);

      const cartCode = getCartCode();
      const params = cartCode ? { cart_code: cartCode } : {};

      const response = await api.get("cart/", { params });

      setCartItems(response.data.items || []);
      setCartSummary({
        subTotal: response.data.sub_total || 0,
        shippingFee: response.data.shipping_fee || 0,
        tax: response.data.tax || 0,
        total: response.data.total || 0,
      });
      setCount(response.data.count || 0);
      setError(null);
      hasFetchedCart.current = true;

      return response.data;
    } catch (err) {
      setError("Failed to load cart. Please try again.");
      console.error("Error fetching cart:", err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const incrementCount = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const addToCart = useCallback(
    async (productId, quantity = 1) => {
      try {
        setLoading(true);

        const cartCode = getCartCode() || generateCartCode();
        const response = await api.post("add-to-cart/", {
          product_id: productId,
          quantity: quantity,
          cart_code: cartCode,
        });

        if (response.status === 200 || response.status === 201) {
          // Reset cart fetch flag to allow fresh data
          hasFetchedCart.current = false;
          // Refresh cart data
          await fetchCartData(true);
          incrementCount();
          return { success: true, message: "Item added to cart successfully" };
        }
      } catch (error) {
        console.error("Error adding to cart:", error);
        return { success: false, message: "Failed to add item to cart" };
      } finally {
        setLoading(false);
      }
    },
    [fetchCartData, generateCartCode, incrementCount]
  );

  const removeFromCart = useCallback(
    async (itemId) => {
      try {
        setLoading(true);

        const response = await api.delete(`remove-from-cart/${itemId}/`);

        if (response.status === 200) {
          hasFetchedCart.current = false;
          await fetchCartData(true);
          return { success: true, message: "Item removed from cart" };
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        return { success: false, message: "Failed to remove item from cart" };
      } finally {
        setLoading(false);
      }
    },
    [fetchCartData]
  );

  const updateCartItemQuantity = useCallback(
    async (itemId, quantity) => {
      try {
        setLoading(true);

        const response = await api.patch(`update-cart-item/${itemId}/`, {
          quantity: quantity,
        });

        if (response.status === 200) {
          hasFetchedCart.current = false;
          await fetchCartData(true);
          return { success: true, message: "Cart updated successfully" };
        }
      } catch (error) {
        console.error("Error updating cart:", error);
        return { success: false, message: "Failed to update cart" };
      } finally {
        setLoading(false);
      }
    },
    [fetchCartData]
  );

  // Clear cache function
  const clearCache = useCallback(
    (cacheType = "all") => {
      if (cacheType === "all") {
        setCache({
          shops: { data: null, timestamp: null, ttl: 5 * 60 * 1000 },
          products: {},
          shopsBySchool: {},
          allProducts: {},
        });
        // Reset fetch flags
        hasFetchedShops.current = false;
        hasFetchedCart.current = false;
        lastFetchTimestamp.current = {};
        lastAllProductsFetchParams.current = "";
        lastAllProductsFetchTimestamp.current = 0;
      } else if (cacheType === "shops") {
        setCache((prev) => ({
          ...prev,
          shops: { data: null, timestamp: null, ttl: 5 * 60 * 1000 },
        }));
        hasFetchedShops.current = false;
      } else if (cacheType === "products") {
        setCache((prev) => ({
          ...prev,
          products: {},
        }));
      } else if (cacheType === "shopsBySchool") {
        setCache((prev) => ({
          ...prev,
          shopsBySchool: {},
        }));
      } else if (cacheType === "allProducts") {
        clearAllProductsCache();
      }
    },
    [clearAllProductsCache]
  );

  // Clear errors
  const clearError = useCallback(() => {
    setError(null);
    setAllProductsError(null);
  }, []);

  // Initialize cart data only when needed
  useEffect(() => {
    if ((isAuthenticated || getCartCode()) && !hasFetchedCart.current) {
      fetchCartData();
    }
  }, [isAuthenticated]); // Removed fetchCartData from dependencies


  // Fetch orders for authenticated users
  const [orders, setOrders] = useState([]);
  const fetchOrders = async () => {
      try {
        const response = await api.get("orders/");
        setOrders(response.data);
        setLoading(false);
        // console.log(response.data);
      } catch (err) {
        setError("Failed to load your order history. Please try again later.");
        setLoading(false);
      }
    };

  useEffect(()=>{
    if (orders.length === 0) {
      fetchOrders()
    }
  }, [])

  const contextValue = {
    // Authentication
    isAuthenticated,
    auth,
    user_type,

    // Data
    shopsData,
    products,
    product,
    details,
    cartItems,
    searchResults,
    count,
    cartSummary,

    // AllProducts specific data
    allProducts,
    allProductsVendors,
    allProductsCategories,
    allProductsLoading,
    allProductsError,

    // UI States
    loading,
    error,

    // Shop functions
    fetchShopData,
    fetchShopsBySchool,

    // Product functions
    fetchProducts,
    fetchProduct,
    searchProducts,

    // AllProducts functions
    fetchAllProducts,
    debouncedFetchAllProducts,
    clearAllProductsCache,
    resetAllProductsState,

    // Cart functions
    generateCartCode,
    getCartCode,
    fetchCartData,
    addToCart,
    removeFromCart,
    updateCartItemQuantity,
    incrementCount,

    // Utility functions
    clearCache,
    clearError,
    setError,
    setCartItems,

    // order history
    orders,
    setOrders,
  };

  return (
    <GlobalContext.Provider value={contextValue}>
      {children}
    </GlobalContext.Provider>
  );
};
