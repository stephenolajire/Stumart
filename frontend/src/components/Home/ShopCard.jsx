import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { 
  FaStar, 
  FaMapMarkerAlt, 
  FaClock, 
  FaShoppingCart 
} from 'react-icons/fa';
import { MEDIA_BASE_URL } from '../../constant/api';
import styles from '../../css/Home.module.css';

const ShopCard = memo(({ shop }) => (
  <div className={styles.shopCard}>
    <Link to={`/shop/${shop.id}`} className={styles.shopLink}>
      <div className={styles.shopImage}>
        <img
          src={`${MEDIA_BASE_URL}${shop.shop_image}`}
          alt={shop.business_name}
        />
      </div>
      <div className={styles.shopDetails}>
        <h3 className={styles.shopName}>{shop.business_name}</h3>
        <div className={styles.shopMeta}>
          <span className={styles.shopCategory}>{shop.business_category}</span>
          <div className={styles.shopRating}>
            <FaStar className={styles.starIcon} />
            <span>{shop.rating}</span>
          </div>
        </div>
        <div className={styles.shopLocation}>
          <FaMapMarkerAlt className={styles.locationIcon} />
          <span>{shop.user.institution}</span>
        </div>
        <div className={styles.shopDelivery}>
          <FaClock className={styles.clockIcon} />
          <span>15-30 mins</span>
        </div>
        <button className={styles.viewShopButton}>
          <FaShoppingCart /> Shop Now
        </button>
      </div>
    </Link>
  </div>
));

export default ShopCard;