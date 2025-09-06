import { useState, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import api from "../constant/api";
import React from "react";

export const useUnifiedSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
 

  const navigate = useNavigate();
  const { user } = useContext(GlobalContext);

  // Memoize search parameters
  const searchParams = useMemo(
    () => ({
      productName: searchQuery.trim(),
      institution: user?.institution || null,
      state: user?.state || null,
    }),
    [searchQuery, user?.institution, user?.state]
  );

  // Use useQuery instead of useMutation
  const {
    data: searchData,
    isLoading: isSearching,
    refetch: refetchSearch,
  } = useQuery({
    queryKey: ["search", searchParams],
    queryFn: async () => {
      if (!searchParams.productName) return { products: [] };

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
    enabled: !!searchParams.productName, // Only run when there's a search query
  });

  const searchResults = searchData?.products || [];

  // Handle search query change with debouncing
  const handleSearchChange = (value) => {
    setSearchQuery(value);

    // Handle suggestions logic here...
  };

  // Handle search submission
  const handleSearch = (customQuery = null) => {
    const query = customQuery || searchQuery;
    if (!query.trim()) return;

    setSearchQuery(query.trim());
    setShowSuggestions(false);

    // Navigation will happen in useEffect when results change
  };

  // Navigate when search results change
  React.useEffect(() => {
    if (searchQuery.trim() && searchData) {
      navigate("/search-results", {
        state: {
          products: searchResults,
          searchParams,
        },
      });
    }
  }, [searchData, searchQuery, searchParams, navigate, searchResults]);

  return {
    searchQuery,
    setSearchQuery: handleSearchChange,
    searchResults,
    isSearching,
    handleSearch,
    refetchSearch, // Expose refetch function
  };
};
