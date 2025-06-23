import { useContext } from "react";
import { Link, useParams } from "react-router-dom";
import { FaBuilding, FaClock, FaStar } from "react-icons/fa";
import { GlobalContext } from "../constant/GlobalContext";
import styles from "../css/ShopDetails.module.css";
import Spinner from "../components/Spinner";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";

const ShopDetails = () => {
  const { shopId } = useParams();
  const { useProducts } = useContext(GlobalContext);

  // Use the TanStack Query hook for products
  const { data: productsData, isLoading, isError, error } = useProducts(shopId);

  // Loading state
  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className={styles.errorContainer} style={{ marginTop: "10rem" }}>
        <FaBuilding size={48} className={styles.errorIcon} />
        <h2>Error loading shop details</h2>
        <p>{error?.message || "Something went wrong"}</p>
        <Link to="/" className={styles.backButton}>
          Return to Shops
        </Link>
      </div>
    );
  }

  // No data state
  if (!productsData) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
      </div>
    );
  }

  const { products, vendor_details: details } = productsData;
  // Check if details are available
  console.log(productsData)

  // No products state
  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div
        className={styles.noProductsContainer}
        style={{ marginTop: "10rem" }}
      >
        <FaBuilding size={48} className={styles.noProductsIcon} />
        <h2>No product is available yet for the selected shop</h2>
        <Link to="/" className={styles.backButton}>
          Return to Shops
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.shopDetailsContainer}>
      {/* Shop Header Section */}
      <div style={{ paddingLeft: "2rem" }}>
        <Header title={details?.business_name || "Shop Details"} />
      </div>

      <div className={styles.shopHeader}>
        <div className={styles.shopInfo}>
          <p className={styles.shopCategory}>{details?.business_category}</p>
          <p className={styles.shopDescription}>
            Discover quality {details?.business_category} and excellence at{" "}
            {details?.business_name}, your trusted destination for top{" "}
            {details?.business_category} and services.
          </p>

          <div className={styles.shopMeta}>
            <div className={styles.shopMetaItem}>
              <FaClock className={styles.icon} />
              <span>15mins - 30mins</span>
            </div>
            <div className={styles.shopMetaItem}>
              <FaStar className={styles.icon} />
              <span>{details?.rating || "New"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className={styles.productsSection}>
        <h2 className={styles.sectionTitle}>Products</h2>
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
