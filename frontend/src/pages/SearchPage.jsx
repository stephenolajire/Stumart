import { useLocation, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import styles from "../css/SearchPage.module.css";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { products, searchParams } = location.state || {
    products: [],
    searchParams: {},
  };

  if (!products || products.length === 0) {
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
