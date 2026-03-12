import React from "react";
import { ChevronRight } from "lucide-react";
import FeaturedCard from "./FeaturedCard";
import { useGetVendorsBySchool } from "../../hooks/useHome";

const FeaturedShops = ({
  shopsData: propShopsData,
  isLoading: propIsLoading,
  error: propError,
}) => {
  const {
    data: contextShopsData,
    isLoading: contextIsLoading,
    error: contextError,
  } = useGetVendorsBySchool();

  const shopsData = propShopsData || contextShopsData;
  const isLoading =
    propIsLoading !== undefined ? propIsLoading : contextIsLoading;
  const error = propError || contextError;

  if (isLoading) {
    return (
      <div className="w-full py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-center py-12">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
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

  const categoriesWithVendors = shopsData?.data
    ? Object.entries(shopsData.data).filter(
        ([_, cat]) => cat.vendors?.length > 0,
      )
    : [];

  return (
    <div className="w-full bg-background py-3">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 px-4 text-center max-w-3xl mx-auto">
          <h1 className="text-2xl md:text-4xl font-bold text-text-primary mb-3">
            Featured <span className="text-primary">Vendors</span>
          </h1>
          <p className="text-base text-text-secondary mt-2">
            Discover amazing student-run businesses
          </p>
          <div className="flex justify-center mt-4">
            <div className="h-1 w-24 bg-primary rounded-full" />
          </div>
        </div>

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
              No shops are available at the moment. Check back later!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedShops;
