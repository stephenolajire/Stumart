import { useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "../css/ShopDetails.module.css";
import { GlobalContext } from "../constant/GlobalContext";
import { FaBuilding } from "react-icons/fa";
import { MEDIA_BASE_URL } from "../constant/api";

// Cloudinary Base URL (Modify if needed)
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/YOUR_CLOUDINARY_NAME/";

const ShopDetails = () => {
  const { shopId } = useParams();
  const { fetchProducts, products, details } = useContext(GlobalContext);

  useEffect(() => {
    fetchProducts(shopId);
  }, [shopId]);

  // Ensure `products` is an array before proceeding
  if (!Array.isArray(products.products)) {
    return <div className={styles.loading}>Loading products ...</div>;
  }

  // If no products exist, show a fallback message
  if (products.products.length === 0) {
    return (
      <div className={styles.contNo}>
        <p>No product is available yet for the selected shop</p>
        <FaBuilding className={styles.storeIcon} />
      </div>
    );
  }

  return (
    <div className={styles.shopDetails}>
      <div className={styles.header}>
        <img
          src={details.shop_image}
          alt={details.business_name} // Fixed typo here
          className={styles.shopImage}
        />
        <div className={styles.shopInfo}>
          <h1>{details.business_name}</h1>
          <p className={styles.category}>{details.business_category}</p>
          <div className={styles.rating}>⭐ {details.rating}</div>
          <p className={styles.delivery}>🕒 15mins - 30mins</p>
          <p className={styles.description}>
            Discover quality {details.business_category} and excellence at{" "}
            {details.business_name}, your trusted destination for top{" "}
            {details.business_category} and services.
          </p>
        </div>
      </div>

      <div className={styles.products}>
        <h2>Products</h2>
        <div className={styles.productGrid}>
          {products.products.map((product) => (
            <Link to={`/product/${product.id}`} key={product.id}>
              <div className={styles.productCard}>
                <img
                  src={`${MEDIA_BASE_URL}${product.image}`}
                  alt={product.name || "Product"}
                />
                <div className={styles.productInfo}>
                  <h3>
                    {product.name
                      ? product.name.length > 14
                        ? `${product.name.substring(0, 10)}...`
                        : product.name
                      : "No Name"}
                  </h3>
                  <p className={styles.price}>₦{product.price || "0.00"}</p>
                  <button className={styles.addToCart}>Add to Cart</button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
