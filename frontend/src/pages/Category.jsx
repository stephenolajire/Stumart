import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSearchParams } from "react-router-dom";
import { FaFilter, FaTimes, FaBox, FaSadTear, FaStore } from "react-icons/fa";
import { GlobalContext } from "../constant/GlobalContext";
import { nigeriaInstitutions, nigeriaStates } from "../constant/data";
import Card from "./components/Card";
import Spinner from "../components/Spinner";
import Pagination from "../company/Pagination";
import { useGetProductsByCategory } from "../hooks/useHome";

const Category = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get("category");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [schools, setSchools] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const { isAuthenticated } = useContext(GlobalContext);

  const [filters, setFilters] = useState({
    vendor: searchParams.get("vendor") || "",
    search: searchParams.get("search") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
    // only relevant for unauthenticated users
    state: searchParams.get("state") || "",
    school: searchParams.get("school") || "",
  });

  const currentFilters = useMemo(
    () => ({
      category,
      vendor: filters.vendor,
      search: filters.search,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      page: currentPage,
      // strip location filters for authenticated users
      state: isAuthenticated ? "" : filters.state,
      school: isAuthenticated ? "" : filters.school,
    }),
    [
      category,
      filters.vendor,
      filters.search,
      filters.minPrice,
      filters.maxPrice,
      filters.sort,
      filters.state,
      filters.school,
      currentPage,
      isAuthenticated,
    ],
  );

  const {
    data: productsData,
    isLoading,
    error,
    refetch: refetchProducts,
  } = useGetProductsByCategory(currentFilters);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const products = productsData?.results || [];
  const userInstitution = productsData?.user_institution || "";
  const allVendors = productsData?.vendors || [];
  const totalProducts = productsData?.total_products || products.length;

  const singleVendorInfo = useMemo(() => {
    if (!products.length) return null;
    const uniqueIds = [
      ...new Set(products.map((p) => p.vendor_id || p.vendorId)),
    ];
    if (uniqueIds.length === 1 && uniqueIds[0]) {
      const vendor = allVendors.find((v) => v.id === uniqueIds[0]);
      return vendor ? { id: uniqueIds[0], name: vendor.name } : null;
    }
    return null;
  }, [products, allVendors]);

  const handleFilterChange = useCallback(
    (name, value) => {
      setFilters((prev) => ({ ...prev, [name]: value }));
      setCurrentPage(1);
      setSearchParams((prev) => {
        value ? prev.set(name, value) : prev.delete(name);
        if (category) prev.set("category", category);
        prev.delete("page");
        return prev;
      });
    },
    [setSearchParams, category],
  );

  const handleStateChange = useCallback(
    (state) => {
      setSelectedState(state);
      setSchools(state ? nigeriaInstitutions[state] || [] : []);
      handleFilterChange("state", state);
      handleFilterChange("school", "");
    },
    [handleFilterChange],
  );

  const clearFilters = useCallback(() => {
    setFilters({
      vendor: "",
      state: "",
      school: "",
      search: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
    });
    setSelectedState("");
    setSchools([]);
    setCurrentPage(1);
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    setSearchParams(params);
  }, [category, setSearchParams]);

  useEffect(() => {
    const stateFromUrl = searchParams.get("state");
    if (stateFromUrl && nigeriaInstitutions[stateFromUrl]) {
      setSelectedState(stateFromUrl);
      setSchools(nigeriaInstitutions[stateFromUrl]);
    }
  }, [searchParams]);

  const noProductsMessage = useMemo(() => {
    const hasActiveFilters =
      filters.search || filters.state || filters.school || filters.vendor;
    if (hasActiveFilters) {
      return (
        <>
          <FaSadTear className="text-4xl text-gray-400 mb-4" />
          No products match your current filters in the {category} category.
        </>
      );
    }
    return `No products are available in the ${category} category at this time.`;
  }, [filters.search, filters.state, filters.school, filters.vendor, category]);

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
        <div className="w-full mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-red-500 text-lg mb-4">
              Error Loading Products
            </div>
            <p className="text-gray-600 mb-6">
              {error?.message || "Failed to load products. Please try again."}
            </p>
            <button
              onClick={() => refetchProducts()}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4 mt-38 lg:mt-0 sm:px-6 lg:px-8">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-2xl capitalize font-bold text-gray-900">
              {category} Category
              {isAuthenticated && userInstitution && ` in ${userInstitution}`}
            </h1>
            <p className="text-gray-600 mt-1">
              {totalProducts} product{totalProducts !== 1 ? "s" : ""} found
            </p>
          </div>
          <button
            className="mt-4 sm:mt-0 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <FaTimes /> : <FaFilter />}
            <span>Filters</span>
          </button>
        </div>

        {/* Single Vendor Banner */}
        {singleVendorInfo && products.length > 0 && (
          <div className="bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-6">
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

        {/* Filters */}
        <div
          className={`bg-white rounded-lg shadow-sm p-4 mb-6 transition-all duration-300 ${showFilters ? "block" : "hidden"}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange("sort", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>

            {/* Vendor */}
            <select
              value={filters.vendor}
              onChange={(e) => handleFilterChange("vendor", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Vendors</option>
              {Array.from(
                new Map(allVendors.map((v) => [v.name, v])).values(),
              ).map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </option>
              ))}
            </select>

            {/* Price */}
            <div className="flex space-x-2">
              <input
                type="number"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
              />
            </div>

            {/* State & School — unauthenticated only */}
            {!isAuthenticated && (
              <>
                <select
                  value={filters.state}
                  onChange={(e) => handleStateChange(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                >
                  <option value="">All States</option>
                  {nigeriaStates.map((state) => (
                    <option key={state} value={state}>
                      {state.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.school}
                  onChange={(e) => handleFilterChange("school", e.target.value)}
                  disabled={!selectedState}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">All Schools</option>
                  {schools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
              </>
            )}

            {/* Clear */}
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Products */}
        {products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FaBox className="text-6xl text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              No Products Found
            </h2>
            <div className="text-gray-600 mb-6">{noProductsMessage}</div>
            <button
              onClick={clearFilters}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
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

      <Pagination
        count={productsData?.count || 0}
        next={productsData?.next || null}
        previous={productsData?.previous || null}
        currentPage={currentPage}
        onPageChange={handlePageChange}
        resultsPerPage={18}
      />
    </div>
  );
};

export default Category;
