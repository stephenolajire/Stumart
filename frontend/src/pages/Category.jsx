import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import { FaFilter, FaTimes, FaBox, FaSadTear, FaStore, FaArrowLeft } from "react-icons/fa";
import { GlobalContext } from "../constant/GlobalContext";
import { nigeriaInstitutions, nigeriaStates } from "../constant/data";
import Card from "./components/Card";
import Spinner from "../components/Spinner";

const Category = () => {
  const [searchParams] = useSearchParams();
  const [setSearchParams] = useSearchParams();
  const category = searchParams.get("category");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [schools, setSchools] = useState([]);

  const { useProductCategory, isAuthenticated } = useContext(GlobalContext);

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    vendor: searchParams.get("vendor") || "",
    state: searchParams.get("state") || "",
    school: searchParams.get("school") || "",
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
  });

  // Memoize the current filter state to prevent unnecessary API calls
  const currentFilters = useMemo(() => {
    return {
      category,
      vendor: filters.vendor,
      state: filters.state,
      school: filters.school,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
    };
  }, [
    category,
    filters.vendor,
    filters.state,
    filters.school,
    filters.search,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
  ]);

  // Use the React Query hook for fetching category products
  const {
    data: productsData,
    isLoading,
    error,
    refetch: refetchProducts,
  } = useProductCategory(currentFilters);

  // Extract data from React Query response
  const products = productsData?.data?.results || [];
  const userInstitution = productsData?.data?.user_institution || "";
  const allVendors = productsData?.data?.vendors || [];
  const totalProducts = productsData?.data?.total_products || products.length;

  // Check if all products belong to the same vendor
  const singleVendorInfo = useMemo(() => {
    if (!products || products.length === 0) return null;

    // Get unique vendor IDs from products
    const uniqueVendorIds = [
      ...new Set(
        products.map((product) => product.vendor_id || product.vendorId)
      ),
    ];

    // If there's only one unique vendor ID, find the vendor details
    if (uniqueVendorIds.length === 1 && uniqueVendorIds[0]) {
      const vendorId = uniqueVendorIds[0];
      const vendor = allVendors.find((v) => v.id === vendorId);
      return vendor ? { id: vendorId, name: vendor.name } : null;
    }

    return null;
  }, [products, allVendors]);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (name, value) => {
      console.log("Filter changed:", name, value);

      setFilters((prev) => ({ ...prev, [name]: value }));

      setSearchParams((prev) => {
        if (value) {
          prev.set(name, value);
        } else {
          prev.delete(name);
        }
        // Ensure category is always in URL
        if (category) {
          prev.set("category", category);
        }
        return prev;
      });
    },
    [setSearchParams, category]
  );

  // Handle state change for school filtering
  const handleStateChange = useCallback(
    (state) => {
      setSelectedState(state);
      setSchools(state ? nigeriaInstitutions[state] || [] : []);
      handleFilterChange("state", state);
      handleFilterChange("school", ""); // Clear school when state changes
    },
    [handleFilterChange]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const resetFilters = {
      vendor: "",
      state: "",
      school: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    };

    setFilters(resetFilters);
    setSelectedState("");
    setSchools([]);

    const params = new URLSearchParams();
    if (category) {
      params.set("category", category);
    }
    setSearchParams(params);
  }, [category, setSearchParams]);

  // Effect to initialize state and schools from URL params
  useEffect(() => {
    const stateFromUrl = searchParams.get("state");
    if (stateFromUrl && nigeriaInstitutions[stateFromUrl]) {
      setSelectedState(stateFromUrl);
      setSchools(nigeriaInstitutions[stateFromUrl]);
    }
  }, [searchParams]);

  // Memoized no products message
  const noProductsMessage = useMemo(() => {
    const hasActiveFilters =
      filters.search || filters.state || filters.school || filters.vendor;

    if (hasActiveFilters) {
      return (
        <>
          <FaSadTear className="text-4xl text-gray-400 mb-4" />
          No products match your current filters in the {category} category. Try
          adjusting your search criteria.
        </>
      );
    }

    return `No products are available in the ${category} category at this time. Please check back later.`;
  }, [filters.search, filters.state, filters.school, filters.vendor, category]);

  // Handle error state
  const errorMessage =
    error?.message || "Failed to load products. Please try again.";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 text-lg mb-4">
              ⚠️ Error Loading Products
            </div>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <button
              onClick={() => refetchProducts()}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 mt-31 lg:mt-0 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          {/* <div
            className="flex items-center text-gray-600 hover:text-amber-500 cursor-pointer mb-6 transition-colors duration-200"
            // onClick={goBack}
          >
            <FaArrowLeft className="mr-2" />
            <span className="font-medium">Back</span>
          </div> */}
          <div>
            {isAuthenticated ? (
              <h1 className="text-2xl font-bold text-gray-900">
                {category} Category in {userInstitution}
              </h1>
            ) : (
              <h1 className="text-2xl font-bold text-gray-900">
                {category} Category in All Registered Institutions
              </h1>
            )}
            <p className="text-gray-600 mt-1">
              {totalProducts} product{totalProducts !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            className="mt-4 sm:mt-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <FaTimes /> : <FaFilter />}
            <span>Filters</span>
          </button>
        </div>

        {/* Single Vendor Display */}
        {singleVendorInfo && products.length > 0 && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <FaStore className="text-blue-600 text-lg" />
              <span className="text-gray-700">
                All products by:{" "}
                <strong className="text-blue-600">
                  {singleVendorInfo.name}
                </strong>
              </span>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div
          className={`bg-white rounded-lg shadow-sm p-4 mb-6 transition-all duration-300 ${
            showFilters ? "block" : "hidden"
          }`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <div>
              <select
                value={filters.sort}
                onChange={(e) => handleFilterChange("sort", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="newest">Newest</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {/* Vendor - Always shown */}
            <div>
              <select
                value={filters.vendor}
                onChange={(e) => handleFilterChange("vendor", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">All Vendors</option>
                {Array.from(
                  new Map(
                    allVendors.map((vendor) => [vendor.name, vendor])
                  ).values()
                ).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* State - Only for unauthenticated users */}
            {!isAuthenticated && (
              <div>
                <select
                  value={filters.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  <option value="">All States</option>
                  {nigeriaStates.map((state) => (
                    <option key={state} value={state}>
                      {state.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* School - Only for unauthenticated users */}
            {!isAuthenticated && (
              <div>
                <select
                  value={filters.school}
                  onChange={(e) => handleFilterChange("school", e.target.value)}
                  disabled={!selectedState}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Schools</option>
                  {schools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Clear Filters */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Mobile Clear Filters */}
          {showFilters && (
            <div className="mt-4 flex justify-center sm:hidden">
              <button
                onClick={clearFilters}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Content Area */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="mb-6">
              <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Products Found
              </h2>
              <div className="text-gray-600">{noProductsMessage}</div>
            </div>
            <button
              onClick={clearFilters}
              className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="lg:px-0">
            <Card products={products} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Category;
