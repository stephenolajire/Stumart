import { Link } from "react-router-dom";
import styles from "../css/ShopGrid.module.css";
import { MEDIA_BASE_URL } from "../constant/api";
import { FaStore } from "react-icons/fa";

const ShopGrid = ({ shops }) => {
  return (
    <div className={styles.shopGrid}>
      {shops && shops.length > 0 ? (
        shops.map((shop) => (
          <div key={shop.id}>
            <Link to={`/shop/${shop.id}`} className={styles.shopCard}>
              <div className={styles.imageWrapper}>
                <img
                  src={`${MEDIA_BASE_URL}${shop.shop_image}`}
                  alt={shop.business_name}
                />
              </div>
              <div className={styles.shopInfo}>
                <h3>{shop.business_name}</h3>
                <p className={styles.category}>{shop.business_category}</p>
                <div className={styles.rating}>⭐ {shop.rating}</div>
                <p className={styles.delivery}>🕒 15mins - 30mins</p>
              </div>
            </Link>
          </div>
        ))
      ) : (
        <div className={styles.contNo}>
          <p>No shops available</p>
          <FaStore className={styles.storeIcon} />
        </div>
      )}
    </div>
  );
};

export default ShopGrid;
