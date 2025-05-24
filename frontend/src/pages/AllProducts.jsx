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
  const [toggleLoading, setToggleLoading] = useState(false);
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
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("viewOtherProducts") === "true" ? "other" : "school";
  });
  
  const school = localStorage.getItem("institution");
  const { isAuthenticated } = useContext(GlobalContext);
  const viewingOtherSchools = viewMode === "other";

  const handleStateChange = (state) => {
    setSelectedState(state);
    setSchools(state ? nigeriaInstitutions[state] || [] : []);
    handleFilterChange("state", state);
    handleFilterChange("school", "");
  };

  const fetchProducts = async (showToggleLoader = false) => {
    try {
      if (showToggleLoader) {
        setToggleLoading(true);
      } else {
        setLoading(true);
      }

      const apiParams = new URLSearchParams();

      // Add filter parameters
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          apiParams.set(key, value);
        }
      });

      // Handle view mode logic
      if (isAuthenticated) {
        if (viewMode === "school") {
          apiParams.set("viewOtherProducts", "false");
        } else if (viewMode === "other") {
          apiParams.set("viewOtherProducts", "true");
        }
      }

      console.log("Making API request with params:", apiParams.toString());
      
      const response = await api.get(`/all-products/?${apiParams}`);
      setProducts(response.data.results);

      const uniqueCategories = [
        ...new Set(
          response.data.results.map((product) => product.vendor_category)
        ),
      ]
        .filter(Boolean)
        .sort();
      setCategories(uniqueCategories);

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
      if (showToggleLoader) {
        setToggleLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  // 1. Initial load and filter changes (NOT view mode changes)
  useEffect(() => {
    console.log("Filter useEffect triggered");
    fetchProducts();
  }, [
    filters.category,
    filters.minPrice, 
    filters.maxPrice,
    filters.sort,
    filters.search,
    filters.school,
    filters.vendor,
    filters.state
  ]);

  // 2. Handle view mode changes specifically
  useEffect(() => {
    console.log("View mode useEffect triggered, viewMode:", viewMode);
    
    // Skip initial render - let the filter useEffect handle it
    if (loading) return;
    
    fetchProducts(true); // Use toggle loader for view mode changes
  }, [viewMode]);

  // 3. Handle authentication state changes
  useEffect(() => {
    console.log("Auth useEffect triggered, isAuthenticated:", isAuthenticated);
    
    // Only refetch if not initial load
    if (!loading) {
      fetchProducts();
    }
  }, [isAuthenticated]);

  const handleFilterChange = (name, value) => {
    console.log("Filter changed:", name, value);
    setFilters((prev) => ({ ...prev, [name]: value }));
    setSearchParams((prev) => {
      if (value) {
        prev.set(name, value);
      } else {
        prev.delete(name);
      }
      return prev;
    });
  };

  const handleViewModeChange = (newViewMode) => {
    console.log("View mode changing from", viewMode, "to", newViewMode);
    
    setViewMode(newViewMode);

    const params = new URLSearchParams(searchParams);

    if (newViewMode === "other") {
      params.set("viewOtherProducts", "true");
      // Clear school filter when switching to other schools
      if (filters.school) {
        setFilters((prev) => ({ ...prev, school: "" }));
        params.delete("school");
      }
    } else {
      params.delete("viewOtherProducts");
      // Add own school filter when switching to my school
      if (school && !filters.school) {
        setFilters((prev) => ({ ...prev, school: school }));
        params.set("school", school);
      }
    }

    setSearchParams(params);
  };

  const clearFilters = () => {
    const resetFilters = {
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      search: "",
      school: viewMode === "school" && school ? school : "", // Keep school filter for "My School" mode
      vendor: "",
      state: "",
    };

    setFilters(resetFilters);
    setSelectedState("");
    setSchools([]);

    const params = new URLSearchParams();
    if (viewMode === "other") {
      params.set("viewOtherProducts", "true");
    } else {
      params.set("viewOtherProducts", "false");
      if (school) {
        params.set("school", school);
      }
    }
    setSearchParams(params);
  };

  return (
    <div className={styles.productsPage}>
      {isAuthenticated && (
        <div className={styles.viewToggle}>
          <select
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value)}
            className={styles.viewSelect}
            disabled={toggleLoading}
          >
            <option value="school">My School Products</option>
            <option value="other">Other Schools Products</option>
          </select>
          {toggleLoading && (
            <div className={styles.toggleLoader}>
              <span>Loading...</span>
            </div>
          )}
        </div>
      )}

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
        {isAuthenticated && !viewingOtherSchools ? (
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
              Use the filter option to see other school products
            </p>
          </>
        ) : (
          <>
            <h6 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
              All products in registered schools
            </h6>
            <p
              style={{
                textAlign: "center",
                marginBottom: "1rem",
                fontSize: "1.3rem",
              }}
            >
              Use the filter option to see products from a specific school
            </p>
            {!isAuthenticated && (
              <p
                style={{
                  textAlign: "center",
                  marginBottom: "1rem",
                  fontSize: "1.3rem",
                }}
              >
                Register to see products from your school
              </p>
            )}
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
          </select>
        </div>

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

      {loading || toggleLoading ? (
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