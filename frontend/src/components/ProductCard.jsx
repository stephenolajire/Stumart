import { Link } from "react-router-dom";
import { FaStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { useState } from "react";
import styles from "../css/ProductCard.module.css";

const ProductCard = ({ product }) => {
  const {
    id,
    name,
    price,
    image_url,
    vendor_name,
    vendor_rating,
    vendor_category,
    in_stock,
    colors,
    additional_images,
    description,
    promotion_price,
  } = product;

  const [isBookmarked, setIsBookmarked] = useState(false);

  // Calculate percentage off
  const calculateDiscount = () => {
    if (!promotion_price || promotion_price <= 0 || promotion_price >= price)
      return null;
    const discount = ((price - promotion_price) / price) * 100;
    return Math.round(discount);
  };

  const discountPercentage = calculateDiscount();

  const handleBookmarkClick = (e) => {
    e.preventDefault(); // Prevent navigation to product page
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
    // Here you can add logic to save/remove bookmark from backend or localStorage
  };

  return (
    <Link to={`/product/${id}`} className={styles.productCard}>
      <div className={styles.imageWrapper}>
        <img src={image_url} alt={name} className={styles.productImage} />

        {/* Out of Stock Overlay */}
        {vendor_category !== "food" && in_stock === 0 && (
          <div className={styles.outOfStock}>
            <span>Out of Stock</span>
          </div>
        )}

        {/* Discount Badge - Circular */}
        {discountPercentage && (
          <div className={styles.discountBadge}>{discountPercentage}%</div>
        )}

        {/* Bookmark Icon */}
        <div
          className={`${styles.bookmarkIcon} ${
            isBookmarked ? styles.bookmarked : ""
          }`}
          onClick={handleBookmarkClick}
        >
          {isBookmarked ? <FaHeart /> : <FaRegHeart />}
        </div>
      </div>

      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{name}</h3>
        <p className={styles.description}>
          {description?.length > 100
            ? `${description.substring(0, 40)}...`
            : description}
        </p>

        <div className={styles.priceContainer}>
          <div className={styles.priceRow}>
            <div className={styles.prices}>
              {promotion_price &&
              promotion_price > 0 &&
              promotion_price < price ? (
                <>
                  <span className={styles.promotionPrice}>
                    ₦{Number(promotion_price).toLocaleString()}
                  </span>
                  <span className={styles.originalPrice}>
                    ₦{Number(price).toLocaleString()}
                  </span>
                </>
              ) : (
                <span className={styles.price}>
                  ₦{Number(price).toLocaleString()}
                </span>
              )}
            </div>
            {/* Uncomment if you want to show rating */}
            {/* <div className={styles.rating}>
              <FaStar className={styles.starIcon} />
              <span>{vendor_rating?.toFixed(1) || "0.0"}</span>
            </div> */}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;
