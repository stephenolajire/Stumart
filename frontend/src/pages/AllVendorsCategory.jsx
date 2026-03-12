import React, { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import {
  nigeriaInstitutions,
  nigeriaStates,
  businessCategories,
} from "../constant/data";
import VendorHeroSection from "./components/VendorHero";
import VendorCategoryCard from "./components/VendorCategoryCard";
import { useGetVendorsByCategory } from "../hooks/useHome";
import { GlobalContext } from "../constant/GlobalContext";
import { Search, Filter, X, ChevronLeft, ChevronRight } from "lucide-react";

const AllVendorsCategory = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated } = useContext(GlobalContext);

  const [filters, setFilters] = useState({
    category: searchParams.get("category"),
    school: searchParams.get("school") || "",
    state: searchParams.get("state") || "",
    search: searchParams.get("search") || "",
    sort: searchParams.get("sort") || "random",
    verified_only: searchParams.get("verified_only") === "true",
    page: parseInt(searchParams.get("page")) || 1,
  });

  const [showFilters, setShowFilters] = useState(false);
  const [selectedState, setSelectedState] = useState("");

  const { data, isLoading, error, isFetching } = useGetVendorsByCategory({
    ...filters,
    page_size: 20,
  });

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
      ...(key !== "page" && { page: 1 }),
    }));
  };

  const clearFilters = () => {
    setFilters({
      category: filters.category,
      school: "",
      state: "",
      search: "",
      sort: "random",
      verified_only: false,
      page: 1,
    });
    setSelectedState("");
  };

  const handlePageChange = (newPage) => {
    updateFilter("page", newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const availableSchools = selectedState
    ? nigeriaInstitutions[selectedState.replace(/\s+/g, "_")] || []
    : [];

  const totalPages = data?.count ? Math.ceil(data.count / 20) : 1;

  return (
    <div className="min-h-screen bg-background">
      <VendorHeroSection category={filters.category} />

      <div className="w-full mx-auto py-8 px-8 md:px-4">
        {/* Header */}
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
                  {!isAuthenticated &&
                    filters.school &&
                    ` at ${filters.school}`}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="sm:hidden flex items-center gap-2 px-4 py-2 bg-surface border-2 border-border rounded-xl text-text-primary hover:border-primary transition-colors"
            >
              <Filter size={18} />
              <span>Filters</span>
              {(filters.search || filters.verified_only) && (
                <span className="w-2 h-2 bg-primary rounded-full" />
              )}
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary"
              size={20}
            />
            <input
              type="text"
              placeholder="Search vendors by name..."
              value={filters.search}
              onChange={(e) => updateFilter("search", e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-surface border-2 border-border rounded-xl text-text-primary placeholder-text-tertiary focus:border-primary focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          <aside
            className={`lg:w-64 shrink-0 ${showFilters ? "block" : "hidden sm:block"}`}
          >
            <div className="bg-surface border-2 border-border rounded-xl p-4 sticky top-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Filters</h2>
                {(filters.search || filters.state || filters.verified_only) && (
                  <button
                    onClick={clearFilters}
                    className="text-sm text-primary hover:text-primary-dark flex items-center gap-1"
                  >
                    <X size={14} /> Clear
                  </button>
                )}
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Category
                </label>
                <select
                  value={filters.category}
                  onChange={(e) => updateFilter("category", e.target.value)}
                  className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition-colors"
                >
                  {businessCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort */}
              <div className="mb-4">
                <label className="block text-sm font-semibold text-text-primary mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter("sort", e.target.value)}
                  className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="random">Default</option>
                  <option value="rating_high">Highest Rated</option>
                  <option value="rating_low">Lowest Rated</option>
                  <option value="name_asc">Name (A-Z)</option>
                  <option value="name_desc">Name (Z-A)</option>
                </select>
              </div>

              {/* State & School — only for unauthenticated users */}
              {!isAuthenticated && (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      State
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        updateFilter("state", e.target.value);
                        updateFilter("school", "");
                      }}
                      className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition-colors"
                    >
                      <option value="">All States</option>
                      {nigeriaStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-semibold text-text-primary mb-2">
                      School
                    </label>
                    <select
                      value={filters.school}
                      onChange={(e) => updateFilter("school", e.target.value)}
                      disabled={!selectedState}
                      className="w-full px-3 py-2 bg-background border-2 border-border rounded-lg text-text-primary focus:border-primary focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="">All Schools</option>
                      {availableSchools.map((school) => (
                        <option key={school} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                    {!selectedState && (
                      <p className="text-xs text-text-tertiary mt-1">
                        Select a state first
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Verified Only */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.verified_only}
                    onChange={(e) =>
                      updateFilter("verified_only", e.target.checked)
                    }
                    className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2"
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
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="ml-4 text-lg text-text-secondary">
                  Loading vendors...
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-20">
                <p className="text-xl text-text-primary font-semibold mb-2">
                  Oops! Something went wrong
                </p>
                <p className="text-text-secondary">
                  {error.message || "Failed to load vendors"}
                </p>
              </div>
            ) : data?.results?.length > 0 ? (
              <>
                {isFetching && (
                  <div className="mb-4 p-3 bg-primary/10 border-2 border-primary rounded-lg">
                    <p className="text-sm text-primary text-center">
                      Updating results...
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                  {data.results.map((vendor) => (
                    <VendorCategoryCard key={vendor.id} vendor={vendor} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border-2 border-border rounded-xl p-4">
                    <div className="text-sm text-text-secondary">
                      Showing {(filters.page - 1) * 20 + 1} to{" "}
                      {Math.min(filters.page * 20, data.count)} of {data.count}{" "}
                      vendors
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePageChange(filters.page - 1)}
                        disabled={filters.page === 1}
                        className="flex items-center gap-1 px-3 py-2 bg-background border-2 border-border rounded-lg text-text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={18} />
                        <span className="hidden sm:inline">Previous</span>
                      </button>

                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, totalPages))].map((_, index) => {
                          let pageNum;
                          if (totalPages <= 5) pageNum = index + 1;
                          else if (filters.page <= 3) pageNum = index + 1;
                          else if (filters.page >= totalPages - 2)
                            pageNum = totalPages - 4 + index;
                          else pageNum = filters.page - 2 + index;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-10 h-10 rounded-lg font-semibold transition-colors ${
                                pageNum === filters.page
                                  ? "bg-primary text-text-inverse"
                                  : "bg-background border-2 border-border text-text-primary hover:border-primary"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => handlePageChange(filters.page + 1)}
                        disabled={filters.page === totalPages}
                        className="flex items-center gap-1 px-3 py-2 bg-background border-2 border-border rounded-lg text-text-primary hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  No Vendors Found
                </h3>
                <p className="text-text-secondary text-center max-w-md mb-4">
                  {filters.search
                    ? `No vendors match "${filters.search}"`
                    : `No ${filters.category} vendors available with the selected filters`}
                </p>
                <button
                  onClick={clearFilters}
                  className="px-6 py-2 bg-primary text-text-inverse rounded-lg font-semibold hover:bg-primary-dark transition-colors"
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
