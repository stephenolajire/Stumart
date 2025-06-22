import React from "react";
import CategoryCard from "./CategoryCard";
import styles from "../../css/Home.module.css";

const CategoriesSection = ({
  categories,
  activeCategory,
  onCategoryChange,
}) => {
  return (
    <section className={styles.categories}>
      <div className={styles.sectionHeader}>
        <h2>Shop By Category</h2>
      </div>

      <div className={styles.categoryGrid}>
        {categories.map((category) => (
          <CategoryCard
            key={category.id}
            category={category}
            isActive={activeCategory === category.name.toLowerCase()}
            onClick={onCategoryChange}
          />
        ))}
      </div>
    </section>
  );
};

export default CategoriesSection;
