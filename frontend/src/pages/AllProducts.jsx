import { useState, useEffect, useContext } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import api from "../constant/api";
import styles from "../css/AllProducts.module.css";
import { FaFilter, FaSort, FaTimes, FaBox, FaSadTear } from "react-icons/fa";
import { nigeriaInstitutions, nigeriaStates } from "../constant/data";
import { GlobalContext } from "../constant/GlobalContext";

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [selectedState, setSelectedState] = useState("");
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    minPrice: searchParams.get("minPrice") || "",
    maxPrice: searchParams.get("maxPrice") || "",
    sort: searchParams.get("sort") || "newest",
    search: searchParams.get("search") || "",
    school: searchParams.get("school") || "",
    vendor: searchParams.get("vendor") || "",
    state: searchParams.get("state") || "",
  });
  const [categories, setCategories] = useState([]);
  const school = localStorage.getItem("institution");
  const { isAuthenticated } = useContext(GlobalContext);

  // Handle state change
  const handleStateChange = (state) => {
    setSelectedState(state);
    setSchools(state ? nigeriaInstitutions[state] || [] : []);
    handleFilterChange("state", state);
    handleFilterChange("school", ""); // Reset school when state changes
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(filters);
      const response = await api.get(`/all-products/?${params}`);
      // console.log(response.data.results);
      setProducts(response.data.results);

      // Extract unique categories from products
      const uniqueCategories = [
        ...new Set(
          response.data.results.map((product) => product.vendor_category)
        ),
      ]
        .filter(Boolean)
        .sort();
      setCategories(uniqueCategories);

      // Extract unique vendors from products
      const uniqueVendors = [
        ...new Set(
          response.data.results.map((product) => ({
            id: product.vendor_id,
            name: product.vendor_name,
          }))
        ),
      ].filter((vendor) => vendor.name);

      setVendors(uniqueVendors);
      setError(null);
    } catch (err) {
      setError("Failed to fetch products");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filters]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setSearchParams((prev) => {
      prev.set(name, value);
      return prev;
    });
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      search: "",
      school: "",
      vendor: "",
      state: "",
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
      <div style={{ marginBottom: "1.5rem" }}>
        {isAuthenticated ? (
          <>
            <h6 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              All products in {school}
            </h6>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                fontSize: "1.3rem",
              }}
            >
              You can use the filter option to see other school products
            </p>
          </>
        ) : (
          <>
            <h6 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              All productts in registered schools
            </h6>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                fontSize: "1.3rem",
              }}
            >
              You the filter option to see products from a specific school
            </p>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                fontSize: "1.3rem",
              }}
            >
              Register to see products from your school 
            </p>
          </>
        )}
      </div>
      <div className={`${styles.filters} ${showFilters ? styles.show : ""}`}>
        <div className={styles.filterGroup}>
          <input
            type="text"
            placeholder="Search products..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange("category", e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <input
            type="number"
            placeholder="Min Price"
            value={filters.minPrice}
            onChange={(e) => handleFilterChange("minPrice", e.target.value)}
          />
          <input
            type="number"
            placeholder="Max Price"
            value={filters.maxPrice}
            onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
          >
            <option value="newest">Newest</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            {/* <option value="rating">Best Rating</option> */}
          </select>
        </div>

        {/* State Filter */}
        <div className={styles.filterGroup}>
          <select
            value={filters.state}
            onChange={(e) => handleStateChange(e.target.value)}
          >
            <option value="">All States</option>
            {nigeriaStates.map((state) => (
              <option key={state} value={state}>
                {state.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* School Filter */}
        <div className={styles.filterGroup}>
          <select
            value={filters.school}
            onChange={(e) => handleFilterChange("school", e.target.value)}
            disabled={!selectedState}
          >
            <option value="">All Schools</option>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </div>

        {/* Vendor Filter */}
        <div className={styles.filterGroup}>
          <select
            value={filters.vendor}
            onChange={(e) => handleFilterChange("vendor", e.target.value)}
          >
            <option value="">All Vendors</option>
            {vendors.map((vendor) => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>
        </div>
        <button className={styles.clearFilters} onClick={clearFilters}>
          Clear Filters
        </button>
      </div>
      {showFilters && (
        <div className={styles.sortBy}>
          <button className={styles.clearFilterss} onClick={clearFilters}>
            Clear Filters
          </button>
        </div>
      )}
      {loading ? (
        <Spinner />
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : products.length === 0 ? (
        <div className={styles.noProducts}>
          <FaBox className={styles.noProductsIcon} />
          <h2>No Products Found</h2>
          <p>
            {filters.search ||
            filters.category ||
            filters.state ||
            filters.school ? (
              <>
                <FaSadTear className={styles.sadIcon} />
                No products match your current filters. Try adjusting your
                search criteria.
              </>
            ) : (
              "No products are available at this time. Please check back later."
            )}
          </p>
          <button className={styles.clearButton} onClick={clearFilters}>
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProducts;
