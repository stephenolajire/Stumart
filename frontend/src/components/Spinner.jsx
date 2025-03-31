import styles from "../css/Spinner.module.css";
import { FaStore } from "react-icons/fa";

const Spinner = () => {
  return (
    <div className={styles.shopGrid}>
      {[...Array(6)].map((_, index) => (
        <div key={index} className={styles.shopCard}>
          <div className={`${styles.imageWrapper} ${styles.skeleton}`}></div>
          <div className={styles.shopInfo}>
            <h3 className={styles.skeleton}></h3>
            <p className={`${styles.category} ${styles.skeleton}`}></p>
            <div className={`${styles.rating} ${styles.skeleton}`}></div>
            <p className={`${styles.delivery} ${styles.skeleton}`}></p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Spinner;
