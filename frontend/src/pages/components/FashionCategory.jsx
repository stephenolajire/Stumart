import { useContext, useState } from "react";
import Card from "./Card";
import { ChevronRight } from "lucide-react";
import { GlobalContext } from "../../constant/GlobalContext";
import { useNavigate } from "react-router-dom";

const HomeCategory = () => {
  const { useAllCategoryFive } = useContext(GlobalContext);
  const { data: homeData, isLoading, error } = useAllCategoryFive();
  const navigate = useNavigate()

  const handleSeeMore = (category_name) => {
    navigate(`/category/?category=${category_name}`)
  }

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white pb-12">
        <div className="w-full mx-auto p-4">
          <div className="text-center">Loading categories...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-white pb-12">
        <div className="w-full mx-auto p-4">
          <div className="text-center text-red-500">
            Error loading categories
          </div>
        </div>
      </div>
    );
  }

  // Get all categories from the API response
  const categories = homeData?.data ? Object.entries(homeData.data) : [];

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white pb-12 mt-5">
      <div className="w-full mx-auto">
        {categories.map(([categoryKey, categoryData]) => {
          // Skip categories with no products
          if (!categoryData.products || categoryData.products.length === 0) {
            return null;
          }

          return (
            <div key={categoryKey} className="mb-12">
              {/* Category Header */}
              <div className="flex items-center justify-between mb-6 px-4">
                <h2 className="text-2xl font-bold text-gray-800 capitalize">
                  {categoryData.category_name} | Category
                </h2>
                <button
                  onClick={() => handleSeeMore(categoryData.category_name)}
                  className="flex items-center text-orange-500 hover:text-orange-600 transition-colors"
                >
                  <span className="mr-1">See All</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Category Products */}
              <div className="px-4">
                <Card products={categoryData.products} />
              </div>
            </div>
          );
        })}

        {/* Show message if no categories have products */}
        {categories.every(
          ([_, categoryData]) =>
            !categoryData.products || categoryData.products.length === 0
        ) && (
          <div className="text-center py-12">
            <p className="text-gray-500">
              No products available in any category
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeCategory;
