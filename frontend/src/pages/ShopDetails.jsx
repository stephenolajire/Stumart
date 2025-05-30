import { useEffect, useContext } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FaBuilding, FaClock, FaStar, FaShoppingCart } from "react-icons/fa";
import { GlobalContext } from "../constant/GlobalContext";
import styles from "../css/ShopDetails.module.css";
import Spinner from "../components/Spinner";
import Header from "../components/Header";

const formatPrice = (price) => {
  return new Intl.NumberFormat("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price || 0);
};

const ShopDetails = () => {
  const { shopId } = useParams();
  const { fetchProducts, products, details, handleAddToCart } =
    useContext(GlobalContext);
  const navigate = useNavigate();

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleAddToCartClick = (e, productId) => {
    e.stopPropagation();
    handleAddToCart();
  };

  useEffect(() => {
    fetchProducts(shopId);
  }, []);

  // Loading state
  if (!Array.isArray(products.products)) {
    return (
      <div className={styles.loadingContainer}>
        <Spinner />
      </div>
    );
  }

  // No products state
  if (products.products.length === 0) {
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
      <Header title={details.business_name} />
      <div className={styles.shopHeader}>
        <div className={styles.shopInfo}>
          {/* <h1 className={styles.shopName}>{details.business_name}</h1> */}
          <p className={styles.shopCategory}>{details.business_category}</p>
          <p className={styles.shopDescription}>
            Discover quality {details.business_category} and excellence at{" "}
            {details.business_name}, your trusted destination for top{" "}
            {details.business_category} and services.
          </p>

          <div className={styles.shopMeta}>
            <div className={styles.shopMetaItem}>
              <FaClock className={styles.icon} />
              <span>15mins - 30mins</span>
            </div>
            <div className={styles.shopMetaItem}>
              <FaStar className={styles.icon} />
              <span>{details.rating || "New"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className={styles.productsSection}>
        <h2 className={styles.sectionTitle}>Products</h2>
        <div className={styles.productsGrid}>
          {products.products.map((product) => (
            <div
              key={product.id}
              className={styles.productCard}
              onClick={() => handleProductClick(product.id)}
            >
              <div className={styles.productImageContainer}>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className={styles.productImage}
                  />
                ) : (
                  <div className={styles.productImagePlaceholder}>
                    <FaBuilding />
                  </div>
                )}
              </div>
              <div className={styles.productDetails}>
                <h3 className={styles.productName}>{product.name}</h3>
                <p className={styles.productPrice}>
                  ₦{formatPrice(product.price)}
                </p>
                <p className={styles.productDescription}>
                  {product.description.length > 100
                    ? product.description.substring(0, 90) + "..."
                    : product.description}
                </p>

                {/* Add to Cart Button */}
                {/* <button
                  className={styles.addToCartButton}
                  onClick={(e) => handleAddToCartClick(e, product.id)}
                >
                  <FaShoppingCart className={styles.cartIcon} />
                  Add to Cart
                </button> */}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
