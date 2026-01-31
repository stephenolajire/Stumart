import React, { useContext, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import FeaturedCard from "./FeaturedCard";
import { GlobalContext, useShopsBySchool } from "../../constant/GlobalContext";

const FeaturedShops = ({
  shopsData: propShopsData,
  isLoading: propIsLoading,
  error: propError,
  school: propSchool,
}) => {
  const { isAuthenticated } = useContext(GlobalContext);
  const [institution, setInstitution] = useState(propSchool || "");

  useEffect(() => {
    if (!propSchool) {
      const userInstitution = localStorage.getItem("institution");
      if (userInstitution) {
        setInstitution(userInstitution);
      }
    }
  }, [propSchool]);

  const shouldFetchData = !propShopsData && institution;

  const {
    data: contextShopsData,
    isLoading: contextIsLoading,
    error: contextError,
    refetch,
  } = useShopsBySchool(shouldFetchData ? institution : null);

  const shopsData = propShopsData || contextShopsData;
  const isLoading =
    propIsLoading !== undefined ? propIsLoading : contextIsLoading;
  const error = propError || contextError;

  console.log(shopsData)

  useEffect(() => {
    if (shouldFetchData && institution && refetch) {
      refetch();
    }
  }, [institution, shouldFetchData, refetch]);

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
      <div className="w-full py-12">
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
    <div className="w-full bg-background py-12">
      <div className="max-w-7xl mx-auto">
        {/* Main Title */}
        <div className="mb-8 px-4">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-3">
              Featured <span className="text-primary">Vendors</span>
            </h1>
            {/* <p className="text-base text-text-secondary">
              Discover amazing student-run businesses across different
              categories
            </p> */}
            {displaySchool && (
              <p className="text-base text-text-tertiary mt-2">
                Showing vendors at {displaySchool}
              </p>
            )}
            <div className="flex justify-center mt-4">
              <div className="h-1 w-24 bg-primary rounded-full" />
            </div>
          </div>
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
                <div className="w-full overflow-x-auto sm:overflow-x-visible px-4 sm:px-0 pb-2">
                  <div
                    className="flex sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 hide-scrollbar"
                    // style={{ minWidth: "max-content" }}
                  >
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
            <p className="text-sm text-text-secondary text-center max-w-md">
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
