import { useLocation, useNavigate} from "react-router-dom";
import { FaArrowLeft, FaFilter, FaSearch, FaStore } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import Header from "../components/Header";
import Card from "./components/Card";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products: initialProducts, searchParams } = location.state || {
    products: [],
    searchParams: {},
  };


  // Calculate initial min and max from products
  const initialMin =
    initialProducts.length > 0
      ? Math.min(...initialProducts.map((p) => Number(p.price))) || 0
      : 0;
  const initialMax =
    initialProducts.length > 0
      ? Math.max(...initialProducts.map((p) => Number(p.price))) || 100000
      : 100000;

  const [products, setProducts] = useState(initialProducts);
  const [priceRange, setPriceRange] = useState([initialMin, initialMax]);
  const [selectedShop, setSelectedShop] = useState("all");

  // Add state for progress tracking
  const [progress, setProgress] = useState({
    start: 0,
    end: 100,
  });

  // Get unique shop names from products
  const shopNames = useMemo(() => {
    if (!initialProducts.length) return [{ id: "all", name: "All Shops" }];

    const shops = initialProducts.map((product) => ({
      id: product.vendor?.id,
      name: product.vendor_name,
    }));
    return [
      { id: "all", name: "All Shops" },
      ...Array.from(new Set(shops.map(JSON.stringify))).map(JSON.parse),
    ];
  }, [initialProducts]);

  // Get unique states and institutions for advanced filtering
  const availableStates = useMemo(() => {
    if (!initialProducts.length) return [];

    const states = initialProducts
      .map((product) => product.vendor?.state)
      .filter((state) => state)
      .filter((state, index, arr) => arr.indexOf(state) === index);

    return states;
  }, [initialProducts]);

  const availableInstitutions = useMemo(() => {
    if (!initialProducts.length) return [];

    const institutions = initialProducts
      .map((product) => product.vendor?.institution)
      .filter((institution) => institution)
      .filter((institution, index, arr) => arr.indexOf(institution) === index);

    return institutions;
  }, [initialProducts]);

  const handlePriceChange = (newRange) => {
    // Prevent min from exceeding max
    if (newRange[0] > newRange[1]) return;

    setPriceRange(newRange);

    // Calculate progress percentages for the range track
    const totalRange = initialMax - initialMin;
    const startProgress =
      totalRange > 0 ? ((newRange[0] - initialMin) / totalRange) * 100 : 0;
    const endProgress =
      totalRange > 0 ? ((newRange[1] - initialMin) / totalRange) * 100 : 100;

    setProgress({ start: startProgress, end: endProgress });

    // Filter products by both price and shop
    const filtered = (products.length > 0 ? products : initialProducts).filter(
      (product) => {
        const price = Number(product.price);
        const matchesPrice = price >= newRange[0] && price <= newRange[1];
        const matchesShop =
          selectedShop === "all" || product.vendor_name === selectedShop;
        return matchesPrice && matchesShop;
      }
    );
    setProducts(filtered);
  };

  // Add shop filter handler
  const handleShopFilter = (shopName) => {
    setSelectedShop(shopName);

    const baseProducts =
      initialProducts.length > 0 ? initialProducts : products;
    const filtered = baseProducts.filter((product) => {
      const price = Number(product.price);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesShop =
        shopName === "all" || product.vendor_name === shopName;
      return matchesPrice && matchesShop;
    });
    setProducts(filtered);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setProducts(initialProducts);
    setPriceRange([initialMin, initialMax]);
    setSelectedShop("all");
    setProgress({ start: 0, end: 100 });
  };

  // Format price for display
  const formatPrice = (price) => `₦${Number(price).toLocaleString()}`;

  // Show no results message
  if (
    (!initialProducts || initialProducts.length === 0) &&
    !searchParams?.message
  ) {
    return (
      <div className="min-h-screen bg-gray-50 pt-12">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Products Found
              </h2>
              <p className="text-gray-600 mb-6">
                We couldn't find any products matching your search criteria.
              </p>
              <button
                className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200"
                onClick={() => navigate("/")}
              >
                <FaArrowLeft className="mr-2" /> Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen mt-31 lg:mt-0 bg-gray-50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Header title ="" />
          <div className="space-y-2 -mt-8">
            <p className="text-gray-600 lg:text-lg text-base">
              Showing results for "{searchParams?.productName || searchQuery}"
              {searchParams?.count !== undefined && (
                <span className="ml-2 text-sm bg-amber-100 text-amber-800 px-2 py-1 rounded-full">
                  {searchParams.count} found
                </span>
              )}
            </p>
            {searchParams?.searchType === "vendor" && (
              <p className="text-sm text-blue-600 flex items-center">
                <FaStore className="mr-1" />
                Results include products from vendors matching your search
              </p>
            )}
            {searchParams?.message && (
              <p className="text-orange-600 text-sm">{searchParams.message}</p>
            )}
          </div>
        </div>

        {/* Filters Section */}
        {initialProducts.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FaFilter className="mr-2 text-amber-500" />
                  Filter by Shop
                </h3>
                <select
                  value={selectedShop}
                  onChange={(e) => handleShopFilter(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900 shadow-sm transition-colors duration-200"
                >
                  {shopNames.map((shop) => (
                    <option key={shop.id} value={shop.name}>
                      {shop.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Price Range Filter
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                      {formatPrice(priceRange[0])}
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
                      {formatPrice(priceRange[1])}
                    </span>
                  </div>
                  <div
                    className="relative h-6 range-progress range-progress-start"
                    style={{
                      "--range-progress": `${progress.end}%`,
                      "--range-progress-start": `${progress.start}%`,
                    }}
                  >
                    {/* Track */}
                    <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2"></div>

                    {/* Active range */}
                    <div
                      className="absolute top-1/2 h-2 bg-amber-500 rounded-full transform -translate-y-1/2"
                      style={{
                        left: `${progress.start}%`,
                        width: `${progress.end - progress.start}%`,
                      }}
                    ></div>

                    {/* Min slider */}
                    <input
                      type="range"
                      min={initialMin}
                      max={initialMax}
                      value={priceRange[0]}
                      onChange={(e) =>
                        handlePriceChange([
                          Number(e.target.value),
                          priceRange[1],
                        ])
                      }
                      className="absolute top-1/2 left-0 right-0 w-full h-2 bg-transparent appearance-none cursor-pointer transform -translate-y-1/2 range-slider range-slider-min"
                    />

                    {/* Max slider */}
                    <input
                      type="range"
                      min={initialMin}
                      max={initialMax}
                      value={priceRange[1]}
                      onChange={(e) =>
                        handlePriceChange([
                          priceRange[0],
                          Number(e.target.value),
                        ])
                      }
                      className="absolute top-1/2 left-0 right-0 w-full h-2 bg-transparent appearance-none cursor-pointer transform -translate-y-1/2 range-slider range-slider-max"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Clear filters button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200"
              >
                Clear All Filters
              </button>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="pb-12">
          {products.length > 0 ? (
            <Card products={products} />
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  No products match your filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your search criteria or clearing the filters to
                  see more results.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={clearAllFilters}
                    className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors duration-200 inline-flex items-center justify-center"
                  >
                    <FaArrowLeft className="mr-2" /> Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
