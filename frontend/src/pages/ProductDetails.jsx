import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../css/ProductDetails.module.css';

// Sample product data
const productData = {
  id: 1,
  name: "Jollof Rice",
  price: 1500,
  image: "/images/products/jollof-rice.jpg",
  description: "Nigerian jollof rice with chicken",
  category: "Food",
  shop: {
    id: 1,
    name: "Campus Bites",
    rating: 4.5
  },
  specifications: [
    "Served with chicken",
    "Comes with salad",
    "Contains vegetables"
  ]
};

const ProductDetails = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setProduct(productData);
      setLoading(false);
    }, 1000);
  }, [productId]);

  if (loading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.productDetails}>
      <div className={styles.container}>
        <div className={styles.productGrid}>
          <div className={styles.imageSection}>
            <img src={product.image} alt={product.name} />
          </div>

          <div className={styles.infoSection}>
            <h1>{product.name}</h1>
            <p className={styles.price}>₦{product.price}</p>
            <p className={styles.description}>{product.description}</p>

            <div className={styles.shopInfo}>
              <h3>Sold by: {product.shop.name}</h3>
              <div className={styles.rating}>⭐ {product.shop.rating}</div>
            </div>

            <div className={styles.specifications}>
              <h3>Specifications</h3>
              <ul>
                {product.specifications.map((spec, index) => (
                  <li key={index}>{spec}</li>
                ))}
              </ul>
            </div>

            <div className={styles.addToCart}>
              <div className={styles.quantity}>
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity === 1}
                >
                  -
                </button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity(q => q + 1)}>+</button>
              </div>
              <button className={styles.addButton}>
                Add to Cart - ₦{product.price * quantity}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;