import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from '../css/Promotion.module.css';

const promotions = [
  {
    id: 1,
    title: "Back to School Sale!",
    description: "Get 20% off on all stationery items",
    link: "/category/stationery",
    gradient: "primary"
  },
  {
    id: 2,
    title: "Food Festival Week",
    description: "Amazing deals on campus restaurants",
    link: "/category/food",
    gradient: "secondary"
  },
  {
    id: 3,
    title: "Tech Gadget Fair",
    description: "Latest gadgets at student-friendly prices",
    link: "/category/tech",
    gradient: "tertiary"
  }
];

const Promotion = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const currentPromo = promotions[currentIndex];

  return (
    <section className={styles.promotionSection}>
      <div className={`${styles.promotionCard} ${styles[currentPromo.gradient]}`}>
        <div className={styles.content}>
          <h2>{currentPromo.title}</h2>
          <p>{currentPromo.description}</p>
          <Link to={currentPromo.link} className={styles.learnMore}>
            Learn More
          </Link>
        </div>
        <div className={styles.dots}>
          {promotions.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === currentIndex ? styles.active : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to promotion ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Promotion;