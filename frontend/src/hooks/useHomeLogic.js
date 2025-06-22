// hooks/useHomeLogic.js
import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import { nigeriaInstitutions } from "../constant/data";
import debounce from "lodash/debounce";
import Swal from "sweetalert2";

const SHOPS_PER_PAGE = 12;

export const useHomeLogic = () => {
  const {
    shopsData,
    searchResults,
    fetchShopsBySchool,
    searchProducts,
    loading,
    error,
    isAuthenticated,
    clearError,
  } = useContext(GlobalContext);

  const navigate = useNavigate();
  const institution = localStorage.getItem("institution");

  // Consolidated state
  const [filters, setFilters] = useState({
    category: "all",
    state: "",
    school: "",
  });

  const [shopState, setShopState] = useState({
    filteredShops: [],
    schoolShops: [],
    displayMode: "allShops",
  });

  const [uiState, setUiState] = useState({
    productName: "",
    isSearching: false,
    isInitialized: false,
    isLockedToInstitution: true,
    showFilters: false,
    currentPromoIndex: 0,
    currentPage: 1,
  });

  // Get all states from Nigeria institutions
  const states = useMemo(() => Object.keys(nigeriaInstitutions), []);

  // Compute available schools when state changes
  const availableSchools = useMemo(() => {
    if (!filters.state) return [];
    return nigeriaInstitutions[filters.state] || [];
  }, [filters.state]);

  // Filter function - memoized to prevent recreating on every render
  const applyFilters = useCallback((shops, category) => {
    if (!shops || !Array.isArray(shops)) return [];
    if (category === "all") return shops;

    return shops.filter(
      (shop) =>
        shop.business_category &&
        shop.business_category.toLowerCase() === category.toLowerCase()
    );
  }, []);

  // Computed properties
  const totalPages = useMemo(() => {
    return Math.ceil((shopState.filteredShops?.length || 0) / SHOPS_PER_PAGE);
  }, [shopState.filteredShops]);

  const currentShops = useMemo(() => {
    const { currentPage } = uiState;
    const indexOfLastShop = currentPage * SHOPS_PER_PAGE;
    const indexOfFirstShop = indexOfLastShop - SHOPS_PER_PAGE;
    return shopState.filteredShops?.slice(indexOfFirstShop, indexOfLastShop);
  }, [shopState.filteredShops, uiState.currentPage]);

  // Format category name - memoized helper function
  const formatCategoryName = useCallback((category) => {
    if (category === "all") return "All";
    return category
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  // Format title based on current selections
  const getTitle = useCallback(() => {
    const formattedCategory = formatCategoryName(filters.category);

    if (shopState.displayMode === "schoolShops") {
      return filters.category === "all"
        ? `Shops in ${filters.school}`
        : `${formattedCategory} Shops in ${filters.school}`;
    } else {
      return filters.category === "all"
        ? "Featured Shops"
        : `${formattedCategory} Shops`;
    }
  }, [
    filters.category,
    filters.school,
    shopState.displayMode,
    formatCategoryName,
  ]);

  // Format the no results message
  const getNoResultsMessage = useCallback(() => {
    const formattedCategory = formatCategoryName(filters.category);

    if (shopState.displayMode === "schoolShops") {
      return filters.category === "all"
        ? `No shops found for ${filters.school}`
        : `No ${formattedCategory} shops found for ${filters.school}`;
    } else {
      return filters.category === "all"
        ? "No shops available"
        : `No ${formattedCategory} shops available`;
    }
  }, [
    filters.category,
    filters.school,
    shopState.displayMode,
    formatCategoryName,
  ]);

  // Centralized shop fetching function using GlobalContext
  const fetchShops = useCallback(
    async (schoolName) => {
      try {
        const fetchedShops = await fetchShopsBySchool(schoolName);

        if (Array.isArray(fetchedShops)) {
          setShopState((prev) => ({
            ...prev,
            schoolShops: fetchedShops,
            filteredShops: applyFilters(fetchedShops, filters.category),
            displayMode: "schoolShops",
          }));
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error fetching shops:", error);
        return false;
      }
    },
    [fetchShopsBySchool, applyFilters, filters.category]
  );

  // Debounced filter update function
  const debouncedFilterUpdate = useMemo(
    () =>
      debounce(async (newFilters) => {
        try {
          if (newFilters.school) {
            await fetchShops(newFilters.school);
          } else {
            setShopState((prev) => ({
              ...prev,
              filteredShops: applyFilters(shopsData, newFilters.category),
              displayMode: "allShops",
            }));
          }
        } catch (error) {
          console.error("Error updating filters:", error);
        }
      }, 500),
    [fetchShops, applyFilters, shopsData]
  );

  // Request to switch institutions confirmation
  const requestInstitutionSwitch = useCallback(() => {
    if (isAuthenticated && institution && uiState.isLockedToInstitution) {
      Swal.fire({
        title: "Looking for shops elsewhere?",
        text: `You're currently browsing shops at ${institution}. Would you like to look at shops in other institutions?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, show me other institutions",
        cancelButtonText: "No, stay at my institution",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          setUiState((prev) => ({
            ...prev,
            isLockedToInstitution: false,
          }));

          setFilters((prev) => ({
            ...prev,
            state: "",
            school: "",
          }));

          Swal.fire({
            title: "Institution filter unlocked",
            text: "You can now browse shops from any institution.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
      return true;
    }
    return false;
  }, [isAuthenticated, institution, uiState.isLockedToInstitution]);

  // Event handlers
  const handleProductNameChange = useCallback((value) => {
    setUiState((prev) => ({ ...prev, productName: value }));
  }, []);

  const handlePromoIndexChange = useCallback((index) => {
    setUiState((prev) => ({ ...prev, currentPromoIndex: index }));
  }, []);

  const handleCategoryChange = useCallback(
    (category) => {
      setFilters((prev) => ({ ...prev, category }));

      if (category.toLowerCase() === "other") {
        if (shopState.displayMode === "schoolShops" && filters.school) {
          navigate(
            `/other-services?school=${encodeURIComponent(filters.school)}`
          );
        } else {
          navigate("/other-services");
        }
      }
    },
    [navigate, shopState.displayMode, filters.school]
  );

  const handleStateChange = useCallback(
    (e) => {
      const newState = e.target.value;

      if (isAuthenticated && institution && uiState.isLockedToInstitution) {
        requestInstitutionSwitch();
        return;
      }

      setFilters((prev) => ({ ...prev, state: newState, school: "" }));
    },
    [
      isAuthenticated,
      institution,
      uiState.isLockedToInstitution,
      requestInstitutionSwitch,
    ]
  );

  const handleSchoolChange = useCallback(
    (e) => {
      const newSchool = e.target.value;

      if (
        isAuthenticated &&
        institution &&
        uiState.isLockedToInstitution &&
        newSchool !== institution
      ) {
        requestInstitutionSwitch();
        return;
      }

      setFilters((prev) => ({ ...prev, school: newSchool }));
    },
    [
      isAuthenticated,
      institution,
      uiState.isLockedToInstitution,
      requestInstitutionSwitch,
    ]
  );

  const handleSchoolSubmit = useCallback(
    async (e) => {
      e?.preventDefault();

      if (
        isAuthenticated &&
        institution &&
        uiState.isLockedToInstitution &&
        filters.school &&
        filters.school !== institution
      ) {
        const switched = requestInstitutionSwitch();
        if (switched) return;
      }

      if (filters.school) {
        try {
          await fetchShops(filters.school);
        } catch (error) {
          console.error("Error fetching shops by school:", error);
          setShopState((prev) => ({
            ...prev,
            schoolShops: [],
            filteredShops: [],
          }));
        }
      }
    },
    [
      isAuthenticated,
      institution,
      uiState.isLockedToInstitution,
      filters.school,
      fetchShops,
      requestInstitutionSwitch,
    ]
  );

  const handleResetFilter = useCallback(() => {
    if (isAuthenticated && institution && uiState.isLockedToInstitution) {
      const switched = requestInstitutionSwitch();
      if (switched) return;
    }

    setFilters((prev) => ({
      ...prev,
      state: "",
      school: "",
    }));

    setShopState((prev) => ({
      ...prev,
      displayMode: "allShops",
      schoolShops: [],
      filteredShops: applyFilters(shopsData, filters.category),
    }));
  }, [
    isAuthenticated,
    institution,
    uiState.isLockedToInstitution,
    filters.category,
    shopsData,
    applyFilters,
    requestInstitutionSwitch,
  ]);

  const handleProductSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!uiState.productName.trim()) return;

      if (
        isAuthenticated &&
        institution &&
        uiState.isLockedToInstitution &&
        filters.school &&
        filters.school !== institution
      ) {
        const switched = requestInstitutionSwitch();
        if (switched) return;
      }

      setUiState((prev) => ({ ...prev, isSearching: true }));

      try {
        const searchParams = {
          productName: uiState.productName,
          ...(filters.school && { institution: filters.school }),
          ...(filters.state && { state: filters.state }),
        };

        const result = await searchProducts(searchParams);

        if (result.success && result.products && result.products.length > 0) {
          navigate("/search", {
            state: {
              products: result.products,
              searchParams: {
                productName: uiState.productName,
                school: filters.school,
                state: filters.state,
              },
            },
          });
        } else {
          Swal.fire({
            icon: "info",
            title: "No Products Found",
            text:
              result.message ||
              `No products matching "${uiState.productName}" found in the selected location.`,
          });
        }
      } catch (error) {
        console.error("Search error:", error);
        Swal.fire({
          icon: "error",
          title: "Search Error",
          text: "An error occurred while searching. Please try again.",
        });
      } finally {
        setUiState((prev) => ({ ...prev, isSearching: false }));
      }
    },
    [
      uiState.productName,
      uiState.isLockedToInstitution,
      isAuthenticated,
      institution,
      filters.school,
      filters.state,
      navigate,
      requestInstitutionSwitch,
      searchProducts,
    ]
  );

  const toggleFilters = useCallback(() => {
    setUiState((prev) => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  const paginate = useCallback((pageNumber) => {
    setUiState((prev) => ({ ...prev, currentPage: pageNumber }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Effects
  useEffect(() => {
    const timer = setInterval(() => {
      setUiState((prev) => ({
        ...prev,
        currentPromoIndex: (prev.currentPromoIndex + 1) % 3, // Assuming 3 promotions
      }));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      debouncedFilterUpdate.cancel();
    };
  }, [debouncedFilterUpdate]);

  // Main initialization effect
  useEffect(() => {
    const initializeData = async () => {
      if (uiState.isInitialized) return;

      try {
        if (isAuthenticated && institution) {
          const userState = Object.keys(nigeriaInstitutions).find((state) =>
            nigeriaInstitutions[state].includes(institution)
          );

          setFilters((prev) => ({
            ...prev,
            state: userState || "",
            school: institution,
          }));

          const success = await fetchShops(institution);

          if (!success) {
            setShopState((prev) => ({
              ...prev,
              filteredShops: applyFilters(shopsData, filters.category),
              displayMode: "allShops",
            }));
          }
        } else {
          setShopState((prev) => ({
            ...prev,
            filteredShops: applyFilters(shopsData, filters.category),
            displayMode: "allShops",
          }));
        }

        setUiState((prev) => ({
          ...prev,
          isInitialized: true,
        }));
      } catch (error) {
        console.error("Error initializing data:", error);
        setShopState((prev) => ({
          ...prev,
          filteredShops: applyFilters(shopsData, filters.category),
          displayMode: "allShops",
        }));

        setUiState((prev) => ({
          ...prev,
          isInitialized: true,
        }));
      }
    };

    initializeData();
  }, [
    isAuthenticated,
    institution,
    shopsData,
    filters.category,
    fetchShops,
    applyFilters,
    uiState.isInitialized,
  ]);

  // Apply category filter when it changes
  useEffect(() => {
    if (uiState.isInitialized && filters.category.toLowerCase() !== "other") {
      const currentShops =
        shopState.displayMode === "schoolShops"
          ? shopState.schoolShops
          : shopsData;

      setShopState((prev) => ({
        ...prev,
        filteredShops: applyFilters(currentShops, filters.category),
      }));

      setUiState((prev) => ({
        ...prev,
        currentPage: 1,
      }));
    }
  }, [
    filters.category,
    uiState.isInitialized,
    shopState.displayMode,
    shopState.schoolShops,
    shopsData,
    applyFilters,
  ]);

  // Clear errors
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  return {
    // State
    filters,
    shopState,
    uiState,

    // Computed values
    states,
    availableSchools,
    totalPages,
    currentShops,

    // Functions
    getTitle,
    getNoResultsMessage,

    // Handlers
    handleProductNameChange,
    handlePromoIndexChange,
    handleCategoryChange,
    handleStateChange,
    handleSchoolChange,
    handleSchoolSubmit,
    handleResetFilter,
    handleProductSearch,
    toggleFilters,
    paginate,

    // Context values
    loading,
    error,
    isAuthenticated,
    institution,
  };
};
