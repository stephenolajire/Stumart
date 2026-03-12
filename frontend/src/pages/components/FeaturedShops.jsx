import React, { useState, useCallback } from "react";
import { ChevronRight, Filter, X } from "lucide-react";
import FeaturedCard from "./FeaturedCard";
import { useGetVendorsBySchool } from "../../hooks/useHome";
import { nigeriaStates, nigeriaInstitutions } from "../../constant/data";

const FeaturedShops = ({
  shopsData: propShopsData,
  isLoading: propIsLoading,
  error: propError,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [selectedInstitution, setSelectedInstitution] = useState("");
  const [appliedInstitution, setAppliedInstitution] = useState("");

  const {
    data: contextShopsData,
    isLoading: contextIsLoading,
    error: contextError,
    refetch,
  } = useGetVendorsBySchool(appliedInstitution);

  const shopsData = propShopsData || contextShopsData;
  const isLoading =
    propIsLoading !== undefined ? propIsLoading : contextIsLoading;
  const error = propError || contextError;

  const schools = selectedState
    ? nigeriaInstitutions[selectedState.replace(/\s+/g, "_")] || []
    : [];

  const handleApplyFilter = useCallback(() => {
    if (selectedInstitution) {
      setAppliedInstitution(selectedInstitution);
      setShowFilter(false);
    }
  }, [selectedInstitution]);

  const handleClearFilter = useCallback(() => {
    setSelectedState("");
    setSelectedInstitution("");
    setAppliedInstitution("");
    setShowFilter(false);
  }, []);

  const categoriesWithVendors = shopsData?.data
    ? Object.entries(shopsData.data).filter(
        ([_, cat]) => cat.vendors?.length > 0,
      )
    : [];

  return (
    <div className="w-full bg-background py-3">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 px-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-text-primary">
                Featured <span className="text-primary">Vendors</span>
              </h1>
              <p className="text-base text-text-secondary mt-1">
                Discover amazing student-run businesses
              </p>
              <div className="h-1 w-24 bg-primary rounded-full mt-2" />
            </div>

            {/* Filter toggle — only for unauthenticated users */}
            <button
              onClick={() => setShowFilter((prev) => !prev)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              {showFilter ? (
                <X size={16} className="text-gray-600" />
              ) : (
                <Filter size={16} className="text-gray-600" />
              )}
              <span className="text-sm font-medium text-gray-700">
                {appliedInstitution ? "Filtered" : "Filter"}
              </span>
              {appliedInstitution && (
                <span className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          </div>

          {/* Collapsible filter panel */}
          <div
            className={`overflow-hidden transition-all duration-300 ${
              showFilter ? "max-h-80 opacity-100 mt-4" : "max-h-0 opacity-0"
            }`}
          >
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">
                Browse vendors by institution
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* State */}
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">
                    State
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => {
                      setSelectedState(e.target.value);
                      setSelectedInstitution("");
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select a state</option>
                    {nigeriaStates.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Institution */}
                <div>
                  <label className="text-xs text-gray-500 font-medium mb-1 block">
                    Institution
                  </label>
                  <select
                    value={selectedInstitution}
                    onChange={(e) => setSelectedInstitution(e.target.value)}
                    disabled={!selectedState}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {selectedState
                        ? "Select institution"
                        : "Select state first"}
                    </option>
                    {schools.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleApplyFilter}
                  disabled={!selectedInstitution}
                  className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Apply Filter
                </button>
                {appliedInstitution && (
                  <button
                    onClick={handleClearFilter}
                    className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
                {appliedInstitution && (
                  <span className="text-xs text-gray-500 ml-1 truncate max-w-[160px]">
                    Showing: <strong>{appliedInstitution}</strong>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="ml-4 text-base text-text-secondary font-medium">
              Loading shops...
            </p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-red-500"
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
            <p className="text-lg text-text-primary font-semibold mb-2">
              Oops! Something went wrong
            </p>
            <p className="text-sm text-text-secondary">
              Error loading shops. Please try again later.
            </p>
          </div>
        )}

        {/* Vendor list */}
        {!isLoading && !error && (
          <>
            {categoriesWithVendors.length > 0 ? (
              <div className="space-y-8">
                {categoriesWithVendors.map(([categoryKey, categoryData]) => (
                  <div key={categoryKey}>
                    <div className="flex items-center justify-between mb-4 px-4">
                      <div>
                        <h2 className="text-2xl font-bold text-text-primary capitalize">
                          {categoryData.category_name}
                          <span className="text-primary"> Vendors</span>
                        </h2>
                        <div className="h-1 w-16 bg-primary rounded-full" />
                      </div>
                      <button
                        onClick={() =>
                          (window.location.href = `/shops?category=${categoryData.category_name}`)
                        }
                        className="flex items-center gap-2 text-text-primary font-semibold text-sm"
                      >
                        <span>View All</span>
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    <div className="w-full overflow-x-auto sm:overflow-x-visible px-4 sm:px-0 pb-2">
                      <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {categoryData.vendors.map((shop) => (
                          <FeaturedCard key={shop.id} shop={shop} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <h3 className="text-xl font-bold text-text-primary mb-2">
                  No Shops Available
                </h3>
                <p className="text-sm text-text-secondary text-center">
                  {appliedInstitution
                    ? `No vendors found for ${appliedInstitution}. Try a different institution.`
                    : "No shops are available at the moment. Check back later!"}
                </p>
                {appliedInstitution && (
                  <button
                    onClick={handleClearFilter}
                    className="mt-4 px-4 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FeaturedShops;
