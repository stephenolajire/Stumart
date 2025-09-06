import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Card from "../pages/components/Card"
import Spinner from "../components/Spinner";
import SEO from "../components/Metadata";
import Swal from "sweetalert2";
import {
  FaFilter,
  FaSort,
  FaTimes,
  FaBox,
  FaSadTear,
  FaArrowLeft,
  FaArrowRight,
  FaStore,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { nigeriaInstitutions, nigeriaStates } from "../constant/data";
import { GlobalContext } from "../constant/GlobalContext";
import Header from "../components/Header";

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedState, setSelectedState] = useState("");
  const [schools, setSchools] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [favorites, setFavorites] = useState(new Set());

  // Get auth and hooks from global context
  const { isAuthenticated, useAllProducts } = useContext(GlobalContext);

  const navigate = useNavigate();

  const toggleFavorite = (productId) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(productId)) {
      newFavorites.delete(productId);
    } else {
      newFavorites.add(productId);
    }
    setFavorites(newFavorites);
  };

  const favoriteCount = favorites.size;

  // Initialize filters from URL params
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
    search: searchParams.get("search") || "",
    school: searchParams.get("school") || "",
    vendor: searchParams.get("vendor") || "",
    state: searchParams.get("state") || "",
    page: parseInt(searchParams.get("page")) || 1,
  });

  // Initialize view mode from URL params
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("viewOtherProducts") === "true" ? "other" : "school";
  });

  const school = localStorage.getItem("institution");
  const viewingOtherSchools = viewMode === "other";

  // Memoize the current filter state to prevent unnecessary API calls
  const currentFilters = useMemo(() => {
    return {
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      search: filters.search,
      school: filters.school,
      vendor: filters.vendor,
      state: filters.state,
      page: filters.page,
    };
  }, [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    filters.search,
    filters.school,
    filters.vendor,
    filters.state,
    filters.page,
  ]);

  // Use the React Query hook for fetching products
  const {
    data: productsData,
    isLoading: allProductsLoading,
    error: allProductsError,
    refetch: refetchProducts,
  } = useAllProducts(currentFilters, viewMode, isAuthenticated);

  // Extract data from React Query response - Updated to handle paginated response
  const allProducts = productsData?.results || productsData?.products || [];
  const allProductsCategories = productsData?.categories || [];
  const allProductsVendors = productsData?.vendors || [];
  const totalProducts =
    productsData?.count || productsData?.total_products || 0;
  const nextPage = productsData?.next;
  const previousPage = productsData?.previous;

  // console.log("Products Data:", productsData);
  // console.log("All Products:", allProducts);

  // Check if all products belong to the same vendor
  const singleVendorInfo = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return null;

    // Get unique vendor IDs from products
    const uniqueVendorIds = [
      ...new Set(
        allProducts.map((product) => product.vendor_id || product.vendorId)
      ),
    ];

    // If there's only one unique vendor ID, find the vendor details
    if (uniqueVendorIds.length === 1 && uniqueVendorIds[0]) {
      const vendorId = uniqueVendorIds[0];
      const vendor = allProductsVendors.find((v) => v.id === vendorId);
      return vendor ? { id: vendorId, name: vendor.name } : null;
    }

    return null;
  }, [allProducts, allProductsVendors]);

  // Show delivery warning for other schools
  const showDeliveryWarning = useCallback(() => {
    Swal.fire({
      title: "🚚 Delivery Notice",
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; margin-bottom: 20px;">🎒📚</div>
          <h3 style="color: #e74c3c; margin-bottom: 15px;">Important Delivery Information!</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #34495e; margin-bottom: 20px;">
            We only deliver within your registered school campus: <strong style="color: #3498db;">${school}</strong>
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <p style="margin: 0; color: #856404; font-weight: 500; font-size: 12px;">
              📍 If you order from other schools, make sure you're physically present at that school to receive your items or have someone to receive it!
            </p>
          </div>
          <p style="font-size: 14px; color: #7f8c8d; margin-top: 15px;">
            Happy shopping! 🛒✨
          </p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "I Understand 👍",
      confirmButtonColor: "#3498db",
      showCancelButton: true,
      cancelButtonText: "Go Back to My School",
      cancelButtonColor: "#95a5a6",
      allowOutsideClick: false,
      customClass: {
        popup: "swal-wide",
        title: "swal-title-custom",
        htmlContainer: "swal-html-custom",
      },
      didOpen: () => {
        // Add custom styles
        const style = document.createElement("style");
        style.textContent = `
          .swal-wide {
            width: 90% !important;
            max-width: 500px !important;
          }
          .swal-title-custom {
            font-size: 24px !important;
            font-weight: bold !important;
          }
          .swal-html-custom {
            padding: 0 !important;
          }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isDismissed || result.dismiss === Swal.DismissReason.cancel) {
        // User clicked "Go Back to My School" - revert to school mode
        setViewMode("school");
        const params = new URLSearchParams(searchParams);
        params.delete("viewOtherProducts");
        if (school) {
          setFilters((prev) => ({ ...prev, school: school }));
          params.set("school", school);
        }
        setSearchParams(params);
      }
      // If user clicked "I Understand", continue with the mode change
    });
  }, [school, searchParams, setSearchParams]);

  // Handle state change for school filtering
  const handleStateChange = useCallback((state) => {
    setSelectedState(state);
    setSchools(state ? nigeriaInstitutions[state] || [] : []);
    handleFilterChange("state", state);
    handleFilterChange("school", "");
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (name, value) => {
      console.log("Filter changed:", name, value);

      // Reset to page 1 when filters change (except for page filter)
      if (name !== "page") {
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
        setCurrentPage(1);

        setSearchParams((prev) => {
          if (value) {
            prev.set(name, value);
          } else {
            prev.delete(name);
          }
          prev.set("page", "1"); // Reset to page 1
          return prev;
        });
      } else {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(value);

        setSearchParams((prev) => {
          if (value && value > 1) {
            prev.set(name, value.toString());
          } else {
            prev.delete(name);
          }
          return prev;
        });
      }
    },
    [setSearchParams]
  );

  // Handle pagination
  const handlePageChange = useCallback(
    (newPage) => {
      handleFilterChange("page", newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [handleFilterChange]
  );

  // Handle view mode changes
  const handleViewModeChange = useCallback(
    (newViewMode) => {
      console.log("View mode changing from", viewMode, "to", newViewMode);

      // Show warning when switching to other schools
      if (newViewMode === "other" && viewMode === "school") {
        showDeliveryWarning();
      }

      setToggleLoading(true);
      setViewMode(newViewMode);
      setCurrentPage(1); // Reset to page 1 when switching view modes

      const params = new URLSearchParams(searchParams);
      params.set("page", "1"); // Reset pagination

      if (newViewMode === "other") {
        params.set("viewOtherProducts", "true");
        // Clear school filter when switching to other schools
        if (filters.school) {
          setFilters((prev) => ({ ...prev, school: "", page: 1 }));
          params.delete("school");
        }
      } else {
        params.delete("viewOtherProducts");
        // Add own school filter when switching to my school
        if (school && !filters.school) {
          setFilters((prev) => ({ ...prev, school: school, page: 1 }));
          params.set("school", school);
        }
      }

      setSearchParams(params);
    },
    [
      viewMode,
      searchParams,
      filters.school,
      school,
      setSearchParams,
      showDeliveryWarning,
    ]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const resetFilters = {
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      search: "",
      school: viewMode === "school" && school ? school : "",
      vendor: "",
      state: "",
      page: 1,
    };

    setFilters(resetFilters);
    setSelectedState("");
    setSchools([]);
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (viewMode === "other") {
      params.set("viewOtherProducts", "true");
    } else {
      params.set("viewOtherProducts", "false");
      if (school) {
        params.set("school", school);
      }
    }
    setSearchParams(params);
  }, [viewMode, school, setSearchParams]);

  // Effect to stop toggle loading when main loading stops
  useEffect(() => {
    if (!allProductsLoading && toggleLoading) {
      setToggleLoading(false);
    }
  }, [allProductsLoading, toggleLoading]);

  // Effect to set school filter when authenticated and in school mode
  useEffect(() => {
    if (isAuthenticated && viewMode === "school" && school && !filters.school) {
      setFilters((prev) => ({ ...prev, school: school }));
      setSearchParams((prev) => {
        prev.set("school", school);
        return prev;
      });
    }
  }, [isAuthenticated, viewMode, school, filters.school, setSearchParams]);

  // Sync currentPage with filters.page
  useEffect(() => {
    if (filters.page !== currentPage) {
      setCurrentPage(filters.page);
    }
  }, [filters.page]);

  // Memoized products count for performance
  const productsCount = useMemo(() => allProducts.length, [allProducts.length]);

  // Memoized no products message
  const noProductsMessage = useMemo(() => {
    const hasActiveFilters =
      filters.search || filters.category || filters.state || filters.school;

    if (hasActiveFilters) {
      return (
        <>
          <FaSadTear className="text-4xl text-gray-400 mb-4" />
          No products match your current filters. Try adjusting your search
          criteria.
        </>
      );
    }

    return "No products are available at this time. Please check back later.";
  }, [filters.search, filters.category, filters.state, filters.school]);

  // Calculate pagination info
  const totalPages = Math.ceil(totalProducts / 18); // Assuming 18 products per page
  const hasNextPage = !!nextPage;
  const hasPreviousPage = !!previousPage;

  // Handle error state
  const errorMessage =
    allProductsError?.message || "Failed to load products. Please try again.";

  return (
    <div className="min-h-screen bg-gray-50 mt-31 lg:mt-0 py-4 px-4 sm:px-6 lg:px-8">
      <SEO
        title="All Products - StuMart | Campus Marketplace"
        description="Browse all products available on StuMart campus marketplace. Find textbooks, electronics, food, fashion, and more from students and vendors across Nigerian universities. Filter by school, category, price, and location."
        keywords="stumart products, campus marketplace products, student products, university shopping, campus textbooks, student electronics, campus food, university fashion, student vendors, campus delivery, buy sell students, university marketplace, student business, campus e-commerce, nigeria student shopping, campus products online, university store, student marketplace nigeria"
        url="/products"
      />

      <div className="max-w-7xl mx-auto">
        {/* View Mode Toggle */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-center space-x-4">
              <select
                value={viewMode}
                onChange={(e) => handleViewModeChange(e.target.value)}
                className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium hover:bg-amber-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
                disabled={toggleLoading || allProductsLoading}
              >
                <option value="school">My School Products</option>
                <option value="other">Other Schools Products</option>
              </select>
              {toggleLoading && (
                <div className="flex items-center text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-amber-500 border-t-transparent mr-2"></div>
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
          <Header title="All Products" />
          <button
            className="mt-4 sm:mt-0 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <FaTimes /> : <FaFilter />}
            <span>Filters</span>
          </button>
        </div>

        {/* School Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6 text-center">
          {isAuthenticated && !viewingOtherSchools ? (
            <>
              <h6 className="text-lg font-semibold text-gray-900 mb-2">
                All products in {school}
              </h6>
              <p className="text-gray-600">
                Use the filter option to see other school products
              </p>
            </>
          ) : (
            <>
              <h6 className="text-lg font-semibold text-gray-900 mb-2">
                All products in registered schools
              </h6>
              <p className="text-gray-600 mb-2">
                Use the filter option to see products from a specific school
              </p>
              {!isAuthenticated && (
                <p className="text-amber-600 font-medium">
                  Register to see products from your school
                </p>
              )}
            </>
          )}
        </div>

        {/* Products Count and Pagination Info */}
        {!allProductsLoading && productsCount > 0 && (
          <div className="text-center text-gray-600 text-sm mb-4">
            Showing {(currentPage - 1) * 18 + 1} -{" "}
            {Math.min(currentPage * 18, totalProducts)} of {totalProducts}{" "}
            products
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </div>
        )}

        {/* Single Vendor Display */}
        {singleVendorInfo && productsCount > 0 && !allProductsLoading && (
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

            {/* Category */}
            <div>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {allProductsCategories.map((category) => (
                  <option key={category} value={category}>
                    {category.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
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

            {/* State */}
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

            {/* School */}
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

            {/* Vendor */}
            <div>
              <select
                value={filters.vendor}
                onChange={(e) => handleFilterChange("vendor", e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              >
                <option value="">All Vendors</option>
                {Array.from(
                  new Map(
                    allProductsVendors.map((vendor) => [vendor.name, vendor])
                  ).values()
                ).map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>

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
        {allProductsLoading || toggleLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner />
          </div>
        ) : allProductsError ? (
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
        ) : productsCount === 0 ? (
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
          <>
            {/* Products Grid */}
            <div className=" md:px-0">
              <Card products={allProducts}/>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex flex-wrap justify-center items-center space-x-1 sm:space-x-2">
                  {/* Previous Button */}
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!hasPreviousPage || allProductsLoading}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      hasPreviousPage
                        ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <FaChevronLeft className="text-xs" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  {/* Page Numbers */}
                  <div className="flex space-x-1">
                    {/* First page */}
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          1
                        </button>
                        {currentPage > 4 && (
                          <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                      </>
                    )}

                    {/* Current page and surrounding pages */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const startPage = Math.max(
                        1,
                        Math.min(currentPage - 2, totalPages - 4)
                      );
                      const pageNum = startPage + i;

                      if (pageNum > totalPages) return null;

                      return (
                        <button
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={allProductsLoading}
                          className={`px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                            pageNum === currentPage
                              ? "bg-amber-500 text-white shadow-md"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {/* Last page */}
                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors duration-200"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!hasNextPage || allProductsLoading}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-lg font-medium transition-colors duration-200 ${
                      hasNextPage
                        ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FaChevronRight className="text-xs" />
                  </button>
                </div>

                {/* Page Info */}
                <div className="text-center text-sm text-gray-600 mt-4">
                  Page {currentPage} of {totalPages} ({totalProducts} total
                  products)
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllProducts;
