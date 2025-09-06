import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilter } from "react-icons/fa";
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
    Math.min(...initialProducts.map((p) => Number(p.price))) || 0;
  const initialMax =
    Math.max(...initialProducts.map((p) => Number(p.price))) || 100000;

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
    // Prevent min from exceeding max
    if (newRange[0] > newRange[1]) return;

    setPriceRange(newRange);

    // Calculate progress percentages for the range track
    const totalRange = initialMax - initialMin;
    const startProgress = ((newRange[0] - initialMin) / totalRange) * 100;
    const endProgress = ((newRange[1] - initialMin) / totalRange) * 100;

    setProgress({ start: startProgress, end: endProgress });

    // Filter products by both price and shop
    const filtered = initialProducts.filter((product) => {
      const price = Number(product.price);
      const matchesPrice = price >= newRange[0] && price <= newRange[1];
      const matchesShop =
        selectedShop === "all" || product.vendor_name === selectedShop;
      return matchesPrice && matchesShop;
    });
    setProducts(filtered);
  };

  // Add shop filter handler
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

  // Format price for display
  const formatPrice = (price) => `₦${Number(price).toLocaleString()}`;

  if (!initialProducts || initialProducts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 pt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
    <div className="min-h-screen bg-gray-50" style={{ marginTop: "3rem" }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Header title="Search Results" />
          <p className="text-gray-600 mt-2 text-lg">
            Showing results for "{searchParams.productName}"
            {searchParams.school && ` in ${searchParams.school}`}
            {searchParams.state && ` (${searchParams.state})`}
          </p>
        </div>

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
                      handlePriceChange([Number(e.target.value), priceRange[1]])
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
                      handlePriceChange([priceRange[0], Number(e.target.value)])
                    }
                    className="absolute top-1/2 left-0 right-0 w-full h-2 bg-transparent appearance-none cursor-pointer transform -translate-y-1/2 range-slider range-slider-max"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pb-12">
          <Card products={products} />
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
