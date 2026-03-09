import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilter, FaSearch, FaStore } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import Card from "./components/Card";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // ✅ Read directly from navigation state — Navigation.jsx already fetched
  const { searchParams, products: stateProducts = [] } = location.state || {};
  const initialProducts = stateProducts;

  const initialMin =
    initialProducts.length > 0
      ? Math.min(...initialProducts.map((p) => Number(p.price))) || 0
      : 0;
  const initialMax =
    initialProducts.length > 0
      ? Math.max(...initialProducts.map((p) => Number(p.price))) || 100000
      : 100000;

  const [products, setProducts] = useState([]);
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedShop, setSelectedShop] = useState("all");
  const [progress, setProgress] = useState({ start: 0, end: 100 });

  useEffect(() => {
    if (initialProducts.length > 0) {
      setProducts(initialProducts);
      setPriceRange([initialMin, initialMax]);
    }
  }, [initialProducts.length]);

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

  const handlePriceChange = (newRange) => {
    if (newRange[0] > newRange[1]) return;

    setPriceRange(newRange);

    const totalRange = initialMax - initialMin;
    const startProgress =
      totalRange > 0 ? ((newRange[0] - initialMin) / totalRange) * 100 : 0;
    const endProgress =
      totalRange > 0 ? ((newRange[1] - initialMin) / totalRange) * 100 : 100;

    setProgress({ start: startProgress, end: endProgress });

    const filtered = initialProducts.filter((product) => {
      const price = Number(product.price);
      const matchesPrice = price >= newRange[0] && price <= newRange[1];
      const matchesShop =
        selectedShop === "all" || product.vendor_name === selectedShop;
      return matchesPrice && matchesShop;
    });
    setProducts(filtered);
  };

  const handleShopFilter = (shopName) => {
    setSelectedShop(shopName);
    const filtered = initialProducts.filter((product) => {
      const price = Number(product.price);
      const matchesPrice = price >= priceRange[0] && price <= priceRange[1];
      const matchesShop =
        shopName === "all" || product.vendor_name === shopName;
      return matchesPrice && matchesShop;
    });
    setProducts(filtered);
  };

  const clearAllFilters = () => {
    setProducts(initialProducts);
    setPriceRange([initialMin, initialMax]);
    setSelectedShop("all");
    setProgress({ start: 0, end: 100 });
  };

  const formatPrice = (price) => `₦${Number(price).toLocaleString()}`;

  // ── No state at all ───────────────────────────────────────────
  if (!location.state || !searchParams) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-4xl w-full">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            No Search Results
          </h2>
          <p className="text-gray-600 mb-6">
            Please search for a product from the home page.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
          >
            <FaArrowLeft className="mr-2" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  // ── No products found ─────────────────────────────────────────
  if (initialProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 mt-38 lg:mt-0">
        <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
              <FaSearch className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                No Products Found
              </h2>
              <p className="text-gray-600 mb-2">
                We couldn't find any products matching{" "}
                <span className="font-semibold">
                  "{searchParams?.productName}"
                </span>
              </p>
              {searchParams?.message && (
                <p className="text-orange-600 text-sm mb-6">
                  {searchParams.message}
                </p>
              )}
              <button
                className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
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

  // ── Results ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen mt-38 lg:mt-0 bg-gray-50">
      <div className="w-full mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search meta */}
        <div className="mb-8">
          <div className="space-y-2 pt-5">
            <p className="text-gray-600 lg:text-lg text-base">
              Showing results for{" "}
              <span className="font-semibold">
                "{searchParams?.productName}"
              </span>
              {searchParams?.count !== undefined && (
                <span className="ml-2 text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
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

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Shop filter */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FaFilter className="mr-2 text-yellow-500" />
                Filter by Shop
              </h3>
              <select
                value={selectedShop}
                onChange={(e) => handleShopFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white text-gray-900 shadow-sm transition-colors"
              >
                {shopNames.map((shop) => (
                  <option key={shop.id} value={shop.name}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Price range filter */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Price Range Filter
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-medium text-gray-700">
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                    {formatPrice(priceRange[0])}
                  </span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full">
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
                  <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-200 rounded-full transform -translate-y-1/2" />
                  <div
                    className="absolute top-1/2 h-2 bg-yellow-500 rounded-full transform -translate-y-1/2"
                    style={{
                      left: `${progress.start}%`,
                      width: `${progress.end - progress.start}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={initialMin}
                    max={initialMax}
                    value={priceRange[0]}
                    onChange={(e) =>
                      handlePriceChange([Number(e.target.value), priceRange[1]])
                    }
                    className="absolute top-1/2 left-0 right-0 w-full h-2 bg-transparent appearance-none cursor-pointer transform -translate-y-1/2 range-slider range-slider-min"
                  />
                  <input
                    type="range"
                    min={initialMin}
                    max={initialMax}
                    value={priceRange[1]}
                    onChange={(e) =>
                      handlePriceChange([priceRange[0], Number(e.target.value)])
                    }
                    className="absolute top-1/2 left-0 right-0 w-full h-2 bg-transparent appearance-none cursor-pointer transform -translate-y-1/2 range-slider range-slider-max"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>

        {/* Product grid */}
        <div className="pb-12">
          {products.length > 0 ? (
            <Card products={products} />
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl mx-auto">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  No products match your filters
                </h3>
                <p className="text-gray-600 mb-6">
                  Try adjusting your filters or clearing them to see more
                  results.
                </p>
                <div className="space-y-3">
                  <button
                    onClick={clearAllFilters}
                    className="w-full px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white font-medium rounded-lg transition-colors"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors inline-flex items-center justify-center"
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
