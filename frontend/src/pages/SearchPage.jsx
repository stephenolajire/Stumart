import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilter } from "react-icons/fa";
import { useState, useEffect, useMemo } from "react";
import styles from "../css/SearchPage.module.css";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import Header from "../components/Header";

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
      <div className={styles.searchPage}>
        <div className={styles.container}>
          <div className={styles.noResults}>
            <h2>No Products Found</h2>
            <p>We couldn't find any products matching your search criteria.</p>
            <button className={styles.backButton} onClick={() => navigate("/")}>
              <FaArrowLeft /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.searchPage} style={{marginTop: "3rem"}}>
      <div className={styles.container}>
        <div className={styles.searchHeader}>
          <Header title="Search Results"/>
          <p>
            Showing results for "{searchParams.productName}"
            {searchParams.school && ` in ${searchParams.school}`}
            {searchParams.state && ` (${searchParams.state})`}
          </p>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.filterControls}>
            <div className={styles.shopFilter}>
              <h3>Filter by Shop</h3>
              <select
                value={selectedShop}
                onChange={(e) => handleShopFilter(e.target.value)}
                className={styles.shopSelect}
              >
                {shopNames.map((shop) => (
                  <option key={shop.id} value={shop.name}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.priceFilter}>
              <h3>Price Range Filter</h3>
              <div className={styles.rangeContainer}>
                <div className={styles.rangeLabels}>
                  <span>{formatPrice(priceRange[0])}</span>
                  <span>{formatPrice(priceRange[1])}</span>
                </div>
                <div
                  className={styles.rangeSlider}
                  style={{
                    "--range-progress": `${progress.end}%`,
                    "--range-progress-start": `${progress.start}%`,
                  }}
                >
                  <div className={styles.track} />
                  <div
                    className={styles.range}
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
                    className={`${styles.slider} ${styles.minSlider}`}
                  />
                  <input
                    type="range"
                    min={initialMin}
                    max={initialMax}
                    value={priceRange[1]}
                    onChange={(e) =>
                      handlePriceChange([priceRange[0], Number(e.target.value)])
                    }
                    className={`${styles.slider} ${styles.maxSlider}`}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SearchPage;
