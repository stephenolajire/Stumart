import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  nigeriaInstitutions,
  nigeriaStates,
  businessCategories,
} from "../constant/data";
import VendorHeroSection from "./components/VendorHero";
import VendorCategoryCard from "./components/VendorCategoryCard";
import { useVendorsByCategory } from "../hooks/useVendorHome";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

const AllVendorsCategory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const institution = localStorage.getItem("institution");

  // Get initial values from URL or defaults
  const [filters, setFilters] = useState({
    category: searchParams.get("category"),
    school: searchParams.get("school") || "",
    state: searchParams.get("state") || "",
    search: searchParams.get("search") || "",
    // sort: searchParams.get("sort") || "newest",
    verified_only: searchParams.get("verified_only") === "true",
    page: parseInt(searchParams.get("page")) || 1,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  // Fetch vendors data
  const { data, isLoading, error, isFetching } = useVendorsByCategory({
    ...filters,
    page_size: 20,
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value.toString());
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      // Reset to page 1 when filters change (except pagination)
      ...(key !== "page" && { page: 1 }),
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: filters.category,
      school: institution || "",
      state: "",
      search: "",
      sort: "newest",
      verified_only: false,
      page: 1,
    });
    setSelectedState("");
  };

  const handlePageChange = (newPage) => {
    updateFilter("page", newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Get schools for selected state
  const availableSchools = selectedState
    ? nigeriaInstitutions[selectedState.replace(/\s+/g, "_")] || []
    : [];

  // Calculate total pages
  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <VendorHeroSection category={filters.category} />

      {/* Main Content */}
      <div className="w-full mx-auto py-8 px-8 md:px-4">
        {/* Header with Search and Filter Toggle */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-text-primary mb-2 capitalize">
                {filters.category} <span className="text-primary">Vendors</span>
              </h1>
              {data?.total_vendors !== undefined && (
                <p className="text-text-secondary">
                  {data.total_vendors} vendor
                  {data.total_vendors !== 1 ? "s" : ""} found
                  {filters.school && ` at ${filters.school}`}
                </p>
              )}
            </div>

            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 bg-surface 
                         border-2 border-border rounded-xl text-text-primary
                         hover:border-primary transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
              {(filters.search || filters.state || filters.verified_only) && (
                <span className="w-2 h-2 bg-primary rounded-full"></span>
              )}
            </button>
          </div>

          {/* Search Bar */}
          <div className="mt-4 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search vendors by name or description..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border-2 border-border 
                         rounded-xl text-text-primary placeholder-text-tertiary
                         focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`
              lg:w-64 shrink-0
              ${showFilters ? "block" : "hidden sm:block"}
            `}
          >
            <div className="bg-surface border-2 border-border rounded-xl p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Filters</h2>
                {(filters.search ||
                  filters.state ||
                  filters.school !== institution ||
                  filters.verified_only) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="w-full px-3 py-2 bg-background border-2 border-border 
                             rounded-lg text-text-primary focus:border-primary 
                             focus:outline-none transition-colors"
                >
                  {businessCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="w-full px-3 py-2 bg-background border-2 border-border 
                             rounded-lg text-text-primary focus:border-primary 
                             focus:outline-none transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="rating_high">Highest Rated</option>
                  <option value="rating_low">Lowest Rated</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>
              </div>

              {/* State Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    updateFilter("state", e.target.value);
                    updateFilter("school", ""); // Reset school when state changes
                  }}
                  className="w-full px-3 py-2 bg-background border-2 border-border 
                             rounded-lg text-text-primary focus:border-primary 
                             focus:outline-none transition-colors"
                >
                  <option value="">All States</option>
                  {nigeriaStates.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Filter */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  School
                </label>
                <select
                  value={filters.school}
                  onChange={(e) => updateFilter("school", e.target.value)}
                  disabled={!selectedState && !institution}
                  className="w-full px-3 py-2 bg-background border-2 border-border 
                             rounded-lg text-text-primary focus:border-primary 
                             focus:outline-none transition-colors disabled:opacity-50 
                             disabled:cursor-not-allowed"
                >
                  <option value="">All Schools</option>
                  {availableSchools.map((school) => (
                    <option key={school} value={school}>
                      {school}
                    </option>
                  ))}
                </select>
                {!selectedState && !institution && (
                  <p className="text-xs text-text-tertiary mt-1">
                    Select a state first
                  </p>
                )}
              </div>

              {/* Verified Only Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verified_only}
                    onChange={(e) =>
                      updateFilter("verified_only", e.target.checked)
                    }
                    className="w-4 h-4 text-primary bg-background border-border 
                               rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm text-text-primary font-medium">
                    Verified Vendors Only
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* Vendors Grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
                <p className="ml-4 text-lg text-text-secondary">
                  Loading vendors...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-20 h-20 bg-error-light/20 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-10 h-10 text-error"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-xl text-text-primary font-semibold mb-2">
                  Oops! Something went wrong
                </p>
                <p className="text-text-secondary">
                  {error.message || "Failed to load vendors"}
                </p>
              </div>
            ) : data?.results && data.results.length > 0 ? (
              <>
                {/* Loading Overlay */}
                {isFetching && (
                  <div className="mb-4 p-3 bg-primary/10 border-2 border-primary rounded-lg">
                    <p className="text-sm text-primary text-center">
                      Updating results...
                    </p>
                  </div>
                )}

                {/* Vendors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                  {data.results.map((vendor) => (
                    <VendorCategoryCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex flex-col sm:flex-row items-center justify-between gap-4 
                                  bg-surface border-2 border-border rounded-xl p-4"
                  >
                    <div className="text-sm text-text-secondary">
                      Showing {(filters.page - 1) * 20 + 1} to{" "}
                      {Math.min(filters.page * 20, data.count)} of {data.count}{" "}
                      vendors
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Previous Button */}
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page === 1}
                        className="flex items-center gap-1 px-3 py-2 bg-background 
                                   border-2 border-border rounded-lg text-text-primary
                                   hover:border-primary disabled:opacity-50 
                                   disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden sm:inline">Previous</span>
                      </button>

                      {/* Page Numbers */}
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = index + 1;
                          } else if (filters.page <= 3) {
                            pageNum = index + 1;
                          } else if (filters.page >= totalPages - 2) {
                            pageNum = totalPages - 4 + index;
                          } else {
                            pageNum = filters.page - 2 + index;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`
                                w-10 h-10 rounded-lg font-semibold transition-colors
                                ${
                                  pageNum === filters.page
                                    ? "bg-primary text-text-inverse"
                                    : "bg-background border-2 border-border text-text-primary hover:border-primary"
                                }
                              `}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      {/* Next Button */}
                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page === totalPages}
                        className="flex items-center gap-1 px-3 py-2 bg-background 
                                   border-2 border-border rounded-lg text-text-primary
                                   hover:border-primary disabled:opacity-50 
                                   disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="hidden sm:inline">Next</span>
                        <ChevronRight size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="w-24 h-24 bg-background-tertiary rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-12 h-12 text-text-tertiary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  No Vendors Found
                </h3>
                <p className="text-text-secondary text-center max-w-md mb-4">
                  {filters.search
                    ? `No vendors match your search "${filters.search}"`
                    : filters.school
                      ? `No ${filters.category} vendors found at ${filters.school}`
                      : `No ${filters.category} vendors available with the selected filters`}
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-primary text-text-inverse rounded-lg 
                             font-semibold hover:bg-primary-dark transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default AllVendorsCategory;
