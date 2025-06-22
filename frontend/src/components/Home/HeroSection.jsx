// components/home/HeroSection.jsx
import React from "react";
import { FaSearch } from "react-icons/fa";
import ThemeToggle from "../ThemeToggle";
import styles from "../../css/Home.module.css";

const HeroSection = ({
  productName,
  onProductNameChange,
  onProductSearch,
  isSearching,
}) => {
  return (
    <div className={styles.heroGrid}>
      <div className={styles.heroForms}>
        <form onSubmit={onProductSearch} className={styles.searchBar}>
          <input
            type="text"
            value={productName}
            onChange={(e) => onProductNameChange(e.target.value)}
            placeholder="Search for product / shop"
            className={styles.searchInput}
          />
          <button
            type="submit"
            className={styles.searchButton}
            disabled={!productName.trim() || isSearching}
          >
            {isSearching ? "..." : <FaSearch />}
          </button>
        </form>
        <ThemeToggle />
      </div>
    </div>
  );
};

export default HeroSection;
