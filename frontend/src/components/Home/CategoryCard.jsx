import React, { memo } from 'react';
import styles from '../../css/Home.module.css';

const CategoryCard = memo(({ category, isActive, onClick }) => (
  <button
    className={`${styles.categoryCard} ${
      isActive ? styles.activeCategory : ""
    }`}
    onClick={() => onClick(category.name.toLowerCase())}
  >
    <div className={styles.categoryIcon}>{category.icon}</div>
    <span className={styles.categoryName}>{category.name}</span>
  </button>
));

export default CategoryCard;