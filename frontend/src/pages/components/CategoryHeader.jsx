import React from 'react'
import { ChevronRight } from 'lucide-react';

const CategoryHeader = ({name}) => {
  return (
    <div className="flex items-center justify-between md:my-8 md:px-10 mb-4 mt-31 md:mt-4 px-4">
      <div>
        <h2 className="md:text-3xl text-2xl font-bold text-gray-900 mb-2">
          {name} <span className="text-amber-500">|</span>
          <span className="bg-gradient-to-r from-amber-500 to-amber-500 bg-clip-text text-transparent ml-2">
            Category
          </span>
        </h2>
        {/* <p className="text-gray-600">
          Trending products from your campus community
          {favoriteCount > 0 && (
            <span className="ml-2 text-orange-600 font-medium">
              • {favoriteCount} favorite{favoriteCount !== 1 ? "s" : ""}
            </span>
          )}
        </p> */}
      </div>
      <button className="group flex items-center space-x-2 text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-300">
        <span>See All</span>
        <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
      </button>
    </div>
  );
}

export default CategoryHeader
