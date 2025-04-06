import styles from "../css/CategoryFilter.module.css";

const CategoryFilter = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <div className={styles.categoryFilter}>
      {categories.map((category) => (
        <button
          key={category.id}
          className={`${styles.categoryButton} ${
            selectedCategory === category.name.toLowerCase()
              ? styles.active
              : ""
          }`}
          onClick={() => onSelectCategory(category.name.toLowerCase())}
        >
          {category.icon && (
            <span className={styles.icon}>{category.icon}</span>
          )}
          {category.name}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;