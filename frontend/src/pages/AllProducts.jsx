import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import api from '../constant/api';
import styles from '../css/AllProducts.module.css';
import { FaFilter, FaSort, FaTimes } from 'react-icons/fa';

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('min_price') || '',
    maxPrice: searchParams.get('max_price') || '',
    sort: searchParams.get('sort') || 'newest',
    search: searchParams.get('search') || ''
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/all-products/?${params}`);
      setProducts(response.data.results);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setSearchParams(prev => {
      prev.set(name, value);
      return prev;
    });
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      sort: 'newest',
      search: ''
    });
    setSearchParams({});
  };

  return (
    <div className={styles.productsPage}>
      <div className={styles.header}>
        <h1>All Products</h1>
        <button 
          className={styles.filterToggle}
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? <FaTimes /> : <FaFilter />}
          Filters
        </button>
      </div>

      <div className={`${styles.filters} ${showFilters ? styles.show : ''}`}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="electronics">Electronics</option>
            <option value="fashion">Fashion</option>
            <option value="books">Books</option>
            {/* Add more categories */}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange('minPrice', e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange('sort', e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Best Rating</option>
          </select>
        </div>

        <button className={styles.clearFilters} onClick={clearFilters}>
          Clear Filters
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <div className={styles.productsGrid}>
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProducts;