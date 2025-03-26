import { Link } from 'react-router-dom';
import styles from '../css/ShopGrid.module.css';

const ShopGrid = ({ shops }) => {
  return (
    <div className={styles.shopGrid}>
      {shops.map((shop) => (
        <Link to={`/shop/${shop.id}`} key={shop.id} className={styles.shopCard}>
          <div className={styles.imageWrapper}>
            <img src={shop.image} alt={shop.name} />
          </div>
          <div className={styles.shopInfo}>
            <h3>{shop.name}</h3>
            <p className={styles.category}>{shop.category}</p>
            <div className={styles.rating}>
              ⭐ {shop.rating}
            </div>
            {shop.deliveryTime && (
              <p className={styles.delivery}>🕒 {shop.deliveryTime}</p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
};

export default ShopGrid;