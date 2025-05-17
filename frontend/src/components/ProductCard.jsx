import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
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
    description
  } = product;

  return (
    <Link to={`/product/${id}`} className={styles.productCard}>
      <div className={styles.imageWrapper}>
        <img 
          src={image_url} 
          alt={name} 
          className={styles.productImage}
        />
        {in_stock <= 0 && (
          <div className={styles.outOfStock}>Out of Stock</div>
        )}
        {colors?.length > 0 && (
          <div className={styles.colorBadge}>
            {colors.length} {colors.length === 1 ? 'color' : 'colors'}
          </div>
        )}
      </div>
      
      <div className={styles.productInfo}>
        <h3 className={styles.productName}>{name}</h3>
        <p className={styles.description}>{description}</p>
        
        <div className={styles.priceRow}>
          <span className={styles.price}>₦{Number(price).toLocaleString()}</span>
          <div className={styles.rating}>
            <FaStar className={styles.starIcon} />
            <span>{vendor_rating?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        
        {/* <div className={styles.vendorInfo}>
          <p className={styles.vendorName}>{vendor_name}</p>
          <p className={styles.category}>{vendor_category}</p>
          <div className={styles.stock}>
            {in_stock > 0 ? `${in_stock} in stock` : 'Out of stock'}
          </div>
        </div> */}
      </div>
    </Link>
  );
};

export default ProductCard;