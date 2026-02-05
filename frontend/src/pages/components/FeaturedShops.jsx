import React, { useContext, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import FeaturedCard from "./FeaturedCard";
import { GlobalContext, useShopsBySchool } from "../../constant/GlobalContext";
import { nigeriaStates, nigeriaInstitutions } from "../../constant/data";

const FeaturedShops = ({
  shopsData: propShopsData,
  isLoading: propIsLoading,
  error: propError,
  school: propSchool,
}) => {
  const { isAuthenticated } = useContext(GlobalContext);
  const [institution, setInstitution] = useState(propSchool || "");
  const [selectedState, setSelectedState] = useState("");

  useEffect(() => {
    if (!propSchool) {
      if (isAuthenticated) {
        // For authenticated users, get institution from localStorage
        const userInstitution = localStorage.getItem("institution");
        if (userInstitution) {
          setInstitution(userInstitution);
        }
      }
      // For unauthenticated users, check if they've previously selected an institution
      else {
        const savedInstitution = localStorage.getItem("institution");
        if (savedInstitution) {
          setInstitution(savedInstitution);
        }
      }
    }
  }, [propSchool, isAuthenticated]);

  // Always fetch data - with or without institution
  // If institution is empty, backend will return all vendors
  const {
    data: contextShopsData,
    isLoading: contextIsLoading,
    error: contextError,
    refetch,
  } = useShopsBySchool(institution || null);

  const shopsData = propShopsData || contextShopsData;
  const isLoading =
    propIsLoading !== undefined ? propIsLoading : contextIsLoading;
  const error = propError || contextError;

  console.log(shopsData);

  useEffect(() => {
    if (institution && refetch) {
      refetch();
    }
  }, [institution, refetch]);

  const handleStateChange = (e) => {
    const state = e.target.value;
    setSelectedState(state);
    setInstitution(""); // Reset institution when state changes
  };

  const handleInstitutionChange = (e) => {
    const selectedInstitution = e.target.value;
    setInstitution(selectedInstitution);
    localStorage.setItem("institution", selectedInstitution);
  };

  // Get institutions for selected state
  const getInstitutionsForState = () => {
    if (!selectedState) return [];
    const stateKey = selectedState.replace(/\s+/g, "_");
    return nigeriaInstitutions[stateKey] || [];
  };

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="ml-4 text-base text-text-secondary font-medium">
              Loading shops...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-error-light/20 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-error"
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
        </div>
      </div>
    );
  }

  const categories = shopsData?.data ? Object.entries(shopsData.data) : [];
  const categoriesWithVendors = categories.filter(
    ([_, categoryData]) =>
      categoryData.vendors && categoryData.vendors.length > 0,
  );
  const displaySchool = propSchool || institution || shopsData?.school;

  return (
    <div className="w-full bg-background py-3">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="mb-8 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-3">
              Featured <span className="text-primary">Vendors</span>
            </h1>
            {displaySchool && displaySchool !== "All Schools" ? (
              <>
                <p className="text-base text-text-tertiary mt-2">
                  Showing vendors at {displaySchool}
                </p>
                {!isAuthenticated && (
                  <button
                    onClick={() => {
                      setInstitution("");
                      setSelectedState("");
                      localStorage.removeItem("institution");
                    }}
                    className="mt-3 text-sm text-primary hover:text-primary/80 
                             font-medium underline transition-colors"
                  >
                    View All Vendors / Change Institution
                  </button>
                )}
              </>
            ) : (
              <p className="text-base text-text-secondary mt-2">
                {!isAuthenticated
                  ? "Filter by institution or browse all vendors"
                  : "Discover amazing student-run businesses"}
              </p>
            )}
            <div className="flex justify-center mt-4">
              <div className="h-1 w-24 bg-primary rounded-full" />
            </div>
          </div>

          {/* Compact Filter Section for Unauthenticated Users */}
          {!isAuthenticated && (
            <div className="max-w-3xl mx-auto mt-6">
              <div className="bg-white rounded-xl shadow-md p-4">
                <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
                  {/* State Selector */}
                  <div className="flex-1">
                    <label
                      htmlFor="state-select"
                      className="block text-xs font-medium text-text-secondary mb-1"
                    >
                      State
                    </label>
                    <select
                      id="state-select"
                      value={selectedState}
                      onChange={handleStateChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                               focus:border-primary focus:outline-none focus:ring-1 
                               focus:ring-primary/30 transition-all
                               text-sm text-text-primary bg-white"
                    >
                      <option value="">All states</option>
                      {nigeriaStates.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Institution Selector */}
                  <div className="flex-1">
                    <label
                      htmlFor="institution-select"
                      className="block text-xs font-medium text-text-secondary mb-1"
                    >
                      Institution
                    </label>
                    <select
                      id="institution-select"
                      value={institution}
                      onChange={handleInstitutionChange}
                      disabled={!selectedState}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg 
                               focus:border-primary focus:outline-none focus:ring-1 
                               focus:ring-primary/30 transition-all
                               text-sm text-text-primary bg-white
                               disabled:bg-gray-50 disabled:cursor-not-allowed
                               disabled:text-text-tertiary"
                    >
                      <option value="">
                        {selectedState
                          ? "All institutions"
                          : "Select state first"}
                      </option>
                      {getInstitutionsForState().map((inst) => (
                        <option key={inst} value={inst}>
                          {inst}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clear Button */}
                  {institution && (
                    <button
                      onClick={() => {
                        setInstitution("");
                        setSelectedState("");
                        localStorage.removeItem("institution");
                      }}
                      className="px-4 py-2 text-sm font-medium text-text-secondary 
                               hover:text-text-primary border border-gray-300 
                               rounded-lg hover:bg-gray-50 transition-colors
                               whitespace-nowrap"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Shop Categories */}
        {categoriesWithVendors.length > 0 ? (
          <div className="space-y-8">
            {categoriesWithVendors.map(([categoryKey, categoryData]) => (
              <div key={categoryKey}>
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4 px-4">
                  <div>
                    <h2 className="text-2xl font-bold text-text-primary capitalize">
                      {categoryData.category_name}{" "}
                      <span className="text-primary">Vendors</span>
                    </h2>
                    <div className="h-1 w-16 bg-primary rounded-full"></div>
                  </div>
                  <button
                    onClick={() =>
                      (window.location.href = `/shops?category=${categoryData.category_name}`)
                    }
                    className="flex items-center gap-2 
                               text-text-primary
                               rounded-xl transition-all duration-200 
                               font-semibold text-sm"
                  >
                    <span>View All</span>
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Cards Container - Horizontal scroll on mobile, Grid on desktop */}
                <div className="w-full overflow-x-auto sm:overflow-x-visible px-4 sm:px-0 pb-2 hide-scrollbar">
                  <div className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 hide-scrollbar">
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
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">
              No Shops Available
            </h3>
            <p className="text-sm text-text-secondary text-center max-w-7xl">
              {displaySchool
                ? `We couldn't find any shops at ${displaySchool}. Check back later!`
                : "Please select an institution to view available shops."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedShops;
