import React from "react";
import { Search } from "lucide-react";

const SearchBar = ({
  searchQuery,
  setSearchQuery,
  handleSearch,
  searchSuggestions,
  showSuggestions,
  handleSuggestionSelect,
  hideSuggestions,
  setShowSuggestions,
  isFetchingSuggestions,
  placeholder = "Search products, brands and categories",
  className = "",
  isMobile = false,
}) => {
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const handleInputFocus = () => {
    if (searchSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        {isMobile ? (
          <>
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={hideSuggestions}
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all duration-200 text-sm placeholder-gray-500"
              placeholder={placeholder}
            />
          </>
        ) : (
          <>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={handleInputFocus}
              onBlur={hideSuggestions}
              placeholder={placeholder}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
            <button
              onClick={handleSearch}
              className="absolute right-0 top-0 bg-amber-500 text-white px-6 py-2 rounded-r-lg hover:bg-amber-600 transition-colors"
            >
              SEARCH
            </button>
          </>
        )}
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions &&
        (searchSuggestions.length > 0 || isFetchingSuggestions) && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
            {isFetchingSuggestions ? (
              <div className="px-4 py-3 text-center text-gray-500">
                <div className="animate-spin inline-block w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full mr-2"></div>
                Searching...
              </div>
            ) : (
              <div className="py-1">
                {searchSuggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-700 flex items-center"
                  >
                    <Search className="w-4 h-4 mr-3 text-gray-400" />
                    <span>{suggestion}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
    </div>
  );
};

export default SearchBar;
