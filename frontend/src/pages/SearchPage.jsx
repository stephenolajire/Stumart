import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaFilter } from "react-icons/fa";
import { useState, useEffect } from "react";
import styles from "../css/SearchPage.module.css";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products: initialProducts, searchParams } = location.state || {
    products: [],
    searchParams: {},
  };

  const [products, setProducts] = useState(initialProducts);
  const [priceRange, setPriceRange] = useState({
    min: 0,
    max: Math.max(...initialProducts.map((p) => Number(p.price))) || 100000,
  });
  const [currentPriceRange, setCurrentPriceRange] = useState({
    min: 0,
    max: Math.max(...initialProducts.map((p) => Number(p.price))) || 100000,
  });

  const handlePriceFilter = () => {
    const filtered = initialProducts.filter((product) => {
      const price = Number(product.price);
      return price >= currentPriceRange.min && price <= currentPriceRange.max;
    });
    setProducts(filtered);
  };

  const handleMinPriceChange = (e) => {
    const value = Number(e.target.value);
    if (value >= 0) {
      // Ensure value is not negative
      setCurrentPriceRange((prev) => ({
        ...prev,
        min: value || "", // Use empty string if value is 0
      }));
    }
  };

  const handleMaxPriceChange = (e) => {
    const value = Number(e.target.value);
    if (value >= currentPriceRange.min) {
      setCurrentPriceRange((prev) => ({
        ...prev,
        max: value,
      }));
    }
  };

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
    <div className={styles.searchPage}>
      <div className={styles.container}>
        <div className={styles.searchHeader}>
          <h1>Search Results</h1>
          <p>
            Showing results for "{searchParams.productName}"
            {searchParams.school && ` in ${searchParams.school}`}
            {searchParams.state && ` (${searchParams.state})`}
          </p>
        </div>

        <div className={styles.filterSection}>
          <div className={styles.priceFilter}>
            <h3>Price Range</h3>
            <div className={styles.priceInputs}>
              <div className={styles.inputGroup}>
                <label>Min (₦)</label>
                <input
                  type="number"
                  value={
                    currentPriceRange.min === 0 ? "" : currentPriceRange.min
                  }
                  onChange={handleMinPriceChange}
                  min={0}
                  max={currentPriceRange.max}
                  placeholder="0"
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Max (₦)</label>
                <input
                  type="number"
                  value={currentPriceRange.max}
                  onChange={handleMaxPriceChange}
                  min={currentPriceRange.min}
                  placeholder="Max price"
                />
              </div>
            </div>
            <button className={styles.filterButton} onClick={handlePriceFilter}>
              <FaFilter /> Apply Filter
            </button>
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
