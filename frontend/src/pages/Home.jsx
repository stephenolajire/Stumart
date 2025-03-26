import { useState } from 'react';
import Hero from '../components/Hero';
import Promotion from '../components/Promotion';
import CategoryFilter from '../components/CategoryFilter';
import ShopGrid from '../components/ShopGrid';
import styles from '../css/Home.module.css';
import {
  FaBook,
  FaUtensils,
  FaLaptop,
  FaTshirt,
  FaDesktop,
  FaHome,
  FaPlane,
  FaCoffee,
} from "react-icons/fa";

import shopsData from '../constant/ShopData';

// Sample categories data
const categories= [
  { id: 1, name: 'Education', icon: <FaBook /> },
  { id: 2, name: 'Food', icon: <FaUtensils /> },
  { id: 3, name: 'Technology', icon: <FaLaptop /> },
  { id: 4, name: 'Clothing', icon: <FaTshirt /> },
  { id: 5, name: 'Electronics', icon: <FaDesktop /> },
  { id: 6, name: 'Home', icon: <FaHome /> },
  { id: 7, name: 'Travel', icon: <FaPlane /> },
  { id: 8, name: 'Cafe', icon: <FaCoffee /> },
];

const Home = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredShops = selectedCategory === 'all' 
    ? shopsData 
    : shopsData.filter(shop => shop.category.toLowerCase() === selectedCategory.toLowerCase());

  return (
    <main className={styles.home}>
      <Hero />
      <Promotion />
      
      <section className={styles.categorySection}>
        <div className={styles.container}>
          <h2>Browse by Category</h2>
          <p>Explore shops based on your interests</p>
          <CategoryFilter 
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
        </div>
      </section>

      <section className={styles.shopsSection}>
        <div className={styles.container}>
          <h2>Featured Shops</h2>
          <ShopGrid shops={filteredShops} />
        </div>
      </section>
    </main>
  );
};

export default Home;