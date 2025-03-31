import { useEffect, useContext } from "react";
import { Link, useParams } from "react-router-dom";
import styles from "../css/ShopDetails.module.css";
import { GlobalContext } from "../constant/GlobalContext";
import { FaBuilding } from "react-icons/fa";

// ✅ Cloudinary Base URL (Modify if needed)
const CLOUDINARY_BASE_URL = "https://res.cloudinary.com/YOUR_CLOUDINARY_NAME/";

const ShopDetails = () => {
  const { shopId } = useParams();
  const { fetchProducts, products } = useContext(GlobalContext);

  useEffect(() => {
    fetchProducts(shopId);
  }, [shopId]);

  // ✅ Ensure `products` is an array before proceeding
  if (!Array.isArray(products)) {
    return <div className={styles.loading}>Loading products ...</div>;
  }

  // ✅ If no products exist, show a fallback message
  if (products.length === 0) {
    return (
      <div className={styles.contNo}>
        <p>No product is available yet for the selected shop</p>
        <FaBuilding className={styles.storeIcon} />
      </div>
    );
  }

  // ✅ Extract Vendor Info from the First Product
  const vendor = products[0];

  return (
    <div className={styles.shopDetails}>
      <div className={styles.header}>
        <img
          src={vendor.vendor_shop_image}
          alt={vendor.vendor_name}
          className={styles.shopImage}
        />
        <div className={styles.shopInfo}>
          <h1>{vendor.vendor_name}</h1>
          <p className={styles.category}>{vendor.vendor_category}</p>
          <div className={styles.rating}>⭐ {vendor.vendor_rating}</div>
          <p className={styles.delivery}>🕒 15mins - 30mins</p>
          <p className={styles.description}>
            Discover quality {vendor.vendor_category} and excellence at{" "}
            {vendor.vendor_name}, your trusted destination for top{" "}
            {vendor.vendor_category} and services.
          </p>
        </div>
      </div>

      <div className={styles.products}>
        <h2>Products</h2>
        <div className={styles.productGrid}>
          {products.map((product) => (
            <Link to={`/product/${product.id}`}>
              <div key={product.id} className={styles.productCard}>
                <img src={product.image} alt={product.name || "Product"} />
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
