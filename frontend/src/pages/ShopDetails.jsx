import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import styles from "../css/ShopDetails.module.css";
import { shopsDetails } from "../constant/ShopDetails";

const ShopDetails = () => {
  const { shopId } = useParams();
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const currentShop = shopsDetails.find((s) => s.id === parseInt(shopId));
      setShop(currentShop);
      setLoading(false);
    }, 1000);
  }, [shopId]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  if (!shop) {
    return <div className={styles.error}>Shop not found</div>;
  }

  return (
    <div className={styles.shopDetails}>
      <div className={styles.header}>
        <img src={shop.image} alt={shop.name} className={styles.shopImage} />
        <div className={styles.shopInfo}>
          <h1>{shop.name}</h1>
          <p className={styles.category}>{shop.category}</p>
          <div className={styles.rating}>⭐ {shop.rating}</div>
          <p className={styles.delivery}>🕒 {shop.deliveryTime}</p>
          <p className={styles.description}>{shop.description}</p>
        </div>
      </div>

      <div className={styles.products}>
        <h2>Products</h2>
        <div className={styles.productGrid}>
          {shop.products &&
            shop.products.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <img src={product.image} alt={product.name} />
                <div className={styles.productInfo}>
                  {product.name && product.name.length > 14 ? (
                    <h3>{product.name.substring(0, 10)}...</h3>
                  ) : (
                    <h3>{product.name}</h3>
                  )}
                  <p className={styles.price}>₦{product.price}</p>
                  <button className={styles.addToCart}>Add to Cart</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default ShopDetails;
