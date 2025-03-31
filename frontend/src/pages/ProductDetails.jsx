import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import styles from '../css/ProductDetails.module.css';
import { GlobalContext } from '../constant/GlobalContext';

const ProductDetails = () => {
  const { productId } = useParams();
  const [quantity, setQuantity] = useState(1);
  const {fetchProduct, product,loading} = useContext(GlobalContext)

  useEffect(() => {
    fetchProduct(productId)
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
              <h3>Sold by: {product.vendor_name}</h3>
              <div className={styles.rating}>⭐ {product.vendor_rating}</div>
            </div>

            {/* <div className={styles.specifications}>
              <h3>Specifications</h3>
              <ul>
                {product.specifications.map((spec, index) => (
                  <li key={index}>{spec}</li>
                ))}
              </ul>
            </div> */}

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