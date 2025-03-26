import styles from "../css/Hero.module.css";

const Hero = () => {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h1>Your Campus Marketplace</h1>
          <p>
            "Shop from local vendors, get exclusive student discounts, and enjoy
            fast delivery right to your hostel. By supporting nearby businesses,
            you can access unique, quality products at a fraction of the cost.
            Whether you're looking for books, gadgets, clothing, or snacks,
            there's something for everyone.
          </p>
          <button className={styles.ctaButton}>Start Shopping</button>
        </div>
        <div className={styles.imageWrapper}>
          <img
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80"
            alt="Students shopping on campus"
          />
        </div>
      </div>
    </section>
  );
};

export default Hero;
