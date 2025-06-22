import React from "react";
import { Link } from "react-router-dom";
import { FaChevronRight } from "react-icons/fa";
import styles from "../../css/Home.module.css";

const FeaturedDeals = ({
  promotions,
  currentPromoIndex,
  onPromoIndexChange,
}) => {
  return (
    <section className={styles.featuredDeals}>
      <div className={styles.sectionHeader}>
        <h2>Featured Deals</h2>
        <Link to="/products" className={styles.viewAll}>
          View All Products
          <FaChevronRight />
        </Link>
      </div>

      <div className={styles.dealsCarousel}>
        <div
          className={styles.dealCard}
          style={{
            backgroundImage: `url(${promotions[currentPromoIndex].image})`,
            backgroundSize: "cover",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        >
          <h3>{promotions[currentPromoIndex].title}</h3>
          <p>{promotions[currentPromoIndex].description}</p>
          <Link
            to={promotions[currentPromoIndex].link}
            className={styles.dealButton}
          >
            Shop Now
          </Link>
        </div>

        <div className={styles.carouselDots}>
          {promotions.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${
                index === currentPromoIndex ? styles.activeDot : ""
              }`}
              onClick={() => onPromoIndexChange(index)}
              aria-label={`View promotion ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedDeals;
