import styles from "../css/Hero.module.css";
import stumart from "../assets/stumarts.jpg";
import { Link } from "react-router-dom";
const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1>Your Campus Marketplace</h1>
          <p>
            Shop from local vendors, get exclusive student discounts, and enjoy
            fast delivery right to your hostel.{" "}
            <span>
              By supporting nearby businesses, you can access unique, quality
              products at a fraction of the cost. Whether you're looking for
              books, gadgets, clothing, or snacks, there's something for
              everyone.
            </span>
          </p>
          <Link to="/register">
            <button className={styles.ctaButton}>Start Shopping</button>
          </Link>
        </div>
        <div className={styles.imageWrapper}>
          <img src={stumart} alt="Vibrant campus marketplace" />
        </div>
      </div>
    </section>
  );
};

export default Hero;