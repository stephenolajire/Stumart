// pages/AllProducts.jsx
import { useState, useEffect, useCallback, useMemo, useContext } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Card from "../pages/components/Card";
import Spinner from "../components/Spinner";
import SEO from "../components/Metadata";
import Swal from "sweetalert2";
import {
  FaFilter,
  FaTimes,
  FaBox,
  FaSadTear,
  FaStore,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { nigeriaInstitutions, nigeriaStates } from "../constant/data";
import { GlobalContext } from "../constant/GlobalContext";
import { useGetAllProducts } from "../hooks/useStumart"; // ← direct hook, not from context

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedState, setSelectedState] = useState("");
  const [schools, setSchools] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // ── Auth from GlobalContext (only this — no hooks from context) ────────────
  const { isAuthenticated } = useContext(GlobalContext);

  const school = localStorage.getItem("institution");
  const navigate = useNavigate();

  // ── Filters ────────────────────────────────────────────────────────────────
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

  // ── View mode ──────────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState(() =>
    new URLSearchParams(window.location.search).get("viewOtherProducts") ===
    "true"
      ? "other"
      : "school",
  );

  const viewingOtherSchools = viewMode === "other";

  // ── Memoised query params ──────────────────────────────────────────────────
  const currentFilters = useMemo(
    () => ({
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      search: filters.search,
      school: filters.school,
      vendor: filters.vendor,
      state: filters.state,
      page: filters.page,
      viewMode,
      isAuthenticated,
    }),
    [
      filters.category,
      filters.minPrice,
      filters.maxPrice,
      filters.sort,
      filters.search,
      filters.school,
      filters.vendor,
      filters.state,
      filters.page,
      viewMode,
      isAuthenticated,
    ],
  );

  // ── Data fetching — hook called directly, NOT from GlobalContext ───────────
  const {
    data: productsData,
    isLoading: allProductsLoading,
    error: allProductsError,
    refetch: refetchProducts,
  } = useGetAllProducts(currentFilters);

  // ── Derived data ───────────────────────────────────────────────────────────
  const allProducts = productsData?.results || productsData?.products || [];
  const allProductsCategories = productsData?.categories || [];
  const allProductsVendors = productsData?.vendors || [];
  const totalProducts =
    productsData?.count || productsData?.total_products || 0;
  const nextPage = productsData?.next;
  const previousPage = productsData?.previous;

  const singleVendorInfo = useMemo(() => {
    if (!allProducts.length) return null;
    const uniqueIds = [
      ...new Set(allProducts.map((p) => p.vendor_id || p.vendorId)),
    ];
    if (uniqueIds.length === 1 && uniqueIds[0]) {
      const vendor = allProductsVendors.find((v) => v.id === uniqueIds[0]);
      return vendor ? { id: uniqueIds[0], name: vendor.name } : null;
    }
    return null;
  }, [allProducts, allProductsVendors]);

  // ── Delivery warning ───────────────────────────────────────────────────────
  const showDeliveryWarning = useCallback(() => {
    Swal.fire({
      title: "🚚 Delivery Notice",
      html: `
        <div style="text-align:center;padding:20px;">
          <div style="font-size:60px;margin-bottom:20px;">🎒📚</div>
          <h3 style="color:#e74c3c;margin-bottom:15px;">Important Delivery Information!</h3>
          <p style="font-size:16px;line-height:1.6;color:#34495e;margin-bottom:20px;">
            We only deliver within your registered school campus:
            <strong style="color:#3498db;">${school}</strong>
          </p>
          <div style="background:#fff3cd;border:1px solid #ffeaa7;border-radius:8px;padding:15px;margin:15px 0;">
            <p style="margin:0;color:#856404;font-weight:500;font-size:12px;">
              📍 If you order from other schools, make sure you're physically
              present at that school to receive your items or have someone to receive it!
            </p>
          </div>
          <p style="font-size:14px;color:#7f8c8d;margin-top:15px;">Happy shopping! 🛒✨</p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "I Understand 👍",
      confirmButtonColor: "#3498db",
      showCancelButton: true,
      cancelButtonText: "Go Back to My School",
      cancelButtonColor: "#95a5a6",
      allowOutsideClick: false,
    }).then((result) => {
      if (result.isDismissed || result.dismiss === Swal.DismissReason.cancel) {
        setViewMode("school");
        const params = new URLSearchParams(searchParams);
        params.delete("viewOtherProducts");
        if (school) {
          setFilters((prev) => ({ ...prev, school }));
          params.set("school", school);
        }
        setSearchParams(params);
      }
    });
  }, [school, searchParams, setSearchParams]);

  // ── Filter handlers ────────────────────────────────────────────────────────
  const handleStateChange = useCallback((state) => {
    setSelectedState(state);
    setSchools(state ? nigeriaInstitutions[state] || [] : []);
    handleFilterChange("state", state);
    handleFilterChange("school", "");
  }, []);

  const handleFilterChange = useCallback(
    (name, value) => {
      if (name !== "page") {
        setFilters((prev) => ({ ...prev, [name]: value, page: 1 }));
        setCurrentPage(1);
        setSearchParams((prev) => {
          value ? prev.set(name, value) : prev.delete(name);
          prev.set("page", "1");
          return prev;
        });
      } else {
        setFilters((prev) => ({ ...prev, [name]: value }));
        setCurrentPage(value);
        setSearchParams((prev) => {
          value && value > 1
            ? prev.set(name, value.toString())
            : prev.delete(name);
          return prev;
        });
      }
    },
    [setSearchParams],
  );

  const handlePageChange = useCallback(
    (newPage) => {
      handleFilterChange("page", newPage);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [handleFilterChange],
  );

  const handleViewModeChange = useCallback(
    (newViewMode) => {
      if (newViewMode === "other" && viewMode === "school")
        showDeliveryWarning();

      setToggleLoading(true);
      setViewMode(newViewMode);
      setCurrentPage(1);

      const params = new URLSearchParams(searchParams);
      params.set("page", "1");

      if (newViewMode === "other") {
        params.set("viewOtherProducts", "true");
        if (filters.school) {
          setFilters((prev) => ({ ...prev, school: "", page: 1 }));
          params.delete("school");
        }
      } else {
        params.delete("viewOtherProducts");
        if (school && !filters.school) {
          setFilters((prev) => ({ ...prev, school, page: 1 }));
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
    ],
  );

  const clearFilters = useCallback(() => {
    const reset = {
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
    setFilters(reset);
    setSelectedState("");
    setSchools([]);
    setCurrentPage(1);

    const params = new URLSearchParams();
    if (viewMode === "other") {
      params.set("viewOtherProducts", "true");
    } else {
      params.set("viewOtherProducts", "false");
      if (school) params.set("school", school);
    }
    setSearchParams(params);
  }, [viewMode, school, setSearchParams]);

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!allProductsLoading && toggleLoading) setToggleLoading(false);
  }, [allProductsLoading, toggleLoading]);

  useEffect(() => {
    if (isAuthenticated && viewMode === "school" && school && !filters.school) {
      setFilters((prev) => ({ ...prev, school }));
      setSearchParams((prev) => {
        prev.set("school", school);
        return prev;
      });
    }
  }, [isAuthenticated, viewMode, school, filters.school, setSearchParams]);

  useEffect(() => {
    if (filters.page !== currentPage) setCurrentPage(filters.page);
  }, [filters.page]);

  // ── Derived UI values ──────────────────────────────────────────────────────
  const productsCount = allProducts.length;
  const totalPages = Math.ceil(totalProducts / 18);
  const hasNextPage = !!nextPage;
  const hasPreviousPage = !!previousPage;
  const errorMessage =
    allProductsError?.message || "Failed to load products. Please try again.";

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

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 mt-38 lg:mt-0 py-4 px-4 sm:px-6 lg:px-8">
      <SEO
        title="All Products - StuMart | Campus Marketplace"
        description="Browse all products available on StuMart campus marketplace. Find textbooks, electronics, food, fashion, and more from students and vendors across Nigerian universities."
        keywords="stumart products, campus marketplace products, student products, university shopping"
        url="/products"
      />

      <div className="w-full mx-auto">
        {/* View Mode Toggle */}
        {isAuthenticated && (
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-center space-x-4">
              <select
                value={viewMode}
                onChange={(e) => handleViewModeChange(e.target.value)}
                disabled={toggleLoading || allProductsLoading}
                className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
              >
                <option value="school">My School Products</option>
                <option value="other">Other Schools Products</option>
              </select>
              {toggleLoading && (
                <div className="flex items-center text-gray-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-yellow-500 border-t-transparent mr-2" />
                  <span className="text-sm">Loading...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-row items-center justify-between mb-6">
          <div />
          <button
            className="mt-4 sm:mt-0 bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            onClick={() => setShowFilters(!showFilters)}
          >
            {showFilters ? <FaTimes /> : <FaFilter />}
            <span>Filters</span>
          </button>
        </div>

        {/* School Info */}
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
                <p className="text-yellow-600 font-medium">
                  Register to see products from your school
                </p>
              )}
            </>
          )}
        </div>

        {/* Products count */}
        {!allProductsLoading && productsCount > 0 && (
          <div className="text-center text-gray-600 text-sm mb-4">
            Showing {(currentPage - 1) * 18 + 1}–
            {Math.min(currentPage * 18, totalProducts)} of {totalProducts}{" "}
            products
            {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
          </div>
        )}

        {/* Single vendor banner */}
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

        {/* Filters panel */}
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

            {/* Category */}
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Categories</option>
              {allProductsCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, " ")}
                </option>
              ))}
            </select>

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

            {/* Price range */}
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

            {/* State */}
            <select
              value={filters.state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All States</option>
              {nigeriaStates.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </select>

            {/* School */}
            <select
              value={filters.school}
              onChange={(e) => handleFilterChange("school", e.target.value)}
              disabled={!selectedState}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Schools</option>
              {schools.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            {/* Vendor */}
            <select
              value={filters.vendor}
              onChange={(e) => handleFilterChange("vendor", e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
            >
              <option value="">All Vendors</option>
              {Array.from(
                new Map(allProductsVendors.map((v) => [v.name, v])).values(),
              ).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>

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

        {/* Content */}
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
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        ) : productsCount === 0 ? (
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
          <>
            <div className="md:px-0">
              <Card products={allProducts} />
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
                <div className="flex flex-wrap justify-center items-center space-x-1 sm:space-x-2">
                  {/* Prev */}
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

                  {/* Page numbers */}
                  <div className="flex space-x-1">
                    {currentPage > 3 && (
                      <>
                        <button
                          onClick={() => handlePageChange(1)}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >
                          1
                        </button>
                        {currentPage > 4 && (
                          <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                      </>
                    )}

                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const startPage = Math.max(
                        1,
                        Math.min(currentPage - 2, totalPages - 4),
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
                              ? "bg-yellow-500 text-white shadow-md"
                              : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}

                    {currentPage < totalPages - 2 && (
                      <>
                        {currentPage < totalPages - 3 && (
                          <span className="px-2 py-2 text-gray-500">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(totalPages)}
                          className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  {/* Next */}
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
