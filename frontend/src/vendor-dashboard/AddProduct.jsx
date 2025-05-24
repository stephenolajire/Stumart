import { useState, useEffect, useContext, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import api from "../constant/api";
import styles from "../css/AllProducts.module.css";
import {
  FaFilter,
  FaSort,
  FaTimes,
  FaBox,
  FaSadTear,
  FaInfoCircle,
} from "react-icons/fa";
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
  const [viewOtherProducts, setViewOtherProducts] = useState(
    searchParams.get("viewOtherProducts") === "true" || false
  );
  const [userInstitutionProductCount, setUserInstitutionProductCount] =
    useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
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

  // Handle state change
  const handleStateChange = (state) => {
    setSelectedState(state);
    setSchools(state ? nigeriaInstitutions[state] || [] : []);
    handleFilterChange("state", state);
    handleFilterChange("school", ""); // Reset school when state changes
  };

  // Add view type to URL params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewOther = params.get("viewOtherProducts") === "true";
    setViewOtherProducts(viewOther);
  }, []);

  // Modified fetchProducts function
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...filters,
        viewOtherProducts: (viewMode === "other").toString(),
      });

      const response = await api.get(`/all-products/?${params.toString()}`);
      setProducts(response.data.results || []);
      setTotalProducts(response.data.total_products || 0);

      if (response.data.user_institution_product_count !== undefined) {
        setUserInstitutionProductCount(
          response.data.user_institution_product_count
        );
      }

      // Extract categories and vendors
      const uniqueCategories = [
        ...new Set(
          response.data.results
            .map((product) => product.vendor_category)
            .filter(Boolean)
        ),
      ].sort();

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
      console.error("Fetch error:", err);
      setError("Failed to fetch products");
    } finally {
      setLoading(false);
    }
  }, [filters, viewMode]); // Add viewMode to dependencies

  // Add an effect to handle view mode changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams);

    if (viewMode === "other") {
      params.set("viewOtherProducts", "true");
    } else {
      params.delete("viewOtherProducts");
    }

    setSearchParams(params);
    fetchProducts();
  }, [viewMode, setSearchParams]);

  // Modified useEffect for fetching
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, viewOtherProducts]);

  const handleFilterChange = (name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set(name, value);
      if (viewOtherProducts) {
        params.set("viewOtherProducts", "true");
      }
      return params;
    });
  };

  // Updated clearFilters function to accept a parameter
  const clearFilters = (maintainViewOtherProducts = false) => {
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

    // Use the parameter instead of the state value to avoid timing issues
    setSearchParams(
      maintainViewOtherProducts ? { viewOtherProducts: "true" } : {}
    );
  };

  // Modify handleViewOtherProducts
  const handleViewOtherProducts = useCallback(() => {
    setViewMode("other");
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
  }, []);

  // Modify handleBackToMySchool
  const handleBackToMySchool = useCallback(() => {
    setViewMode("school");
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
  }, []);

  // Determine header content based on authentication and view mode
  const getHeaderContent = () => {
    if (!isAuthenticated) {
      return {
        title: "All products in registered schools",
        subtitle:
          "Use the filter option to see products from a specific school or",
        subtitle2: "Register to see products from your school",
      };
    }

    if (viewOtherProducts) {
      return {
        title: "Products from all schools",
        subtitle: `Showing ${totalProducts} products from all registered schools`,
        subtitle2:
          userInstitutionProductCount === 0
            ? "Your school currently has no products listed"
            : `Your school (${school}) has ${userInstitutionProductCount} products`,
      };
    }

    return {
      title: `All products in ${school}`,
      subtitle:
        userInstitutionProductCount === 0
          ? "Your school currently has no products listed"
          : `Showing ${totalProducts} products from your school`,
      subtitle2:
        userInstitutionProductCount === 0
          ? "Click below to explore products from other schools"
          : "Use the filter option to see other school products",
    };
  };

  const headerContent = getHeaderContent();

  // Show information banner when user's school has no products
  const showNoProductsBanner = () => {
    return (
      isAuthenticated &&
      !viewOtherProducts &&
      userInstitutionProductCount === 0 &&
      products.length === 0
    );
  };

  return (
    <div className={styles.productsPage}>
      {isAuthenticated && (
        <div className={styles.viewToggle}>
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value)}
            className={styles.viewSelect}
          >
            <option value="school">My School Products</option>
            <option value="other">Other Schools Products</option>
          </select>
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
        <h6 style={{ textAlign: "center", marginBottom: "0.5rem" }}>
          {headerContent.title}
        </h6>
        <p
          style={{
            textAlign: "center",
            marginBottom: "1rem",
            fontSize: "1.3rem",
          }}
        >
          {headerContent.subtitle}
        </p>
        {headerContent.subtitle2 && (
          <p
            style={{
              textAlign: "center",
              marginBottom: "1rem",
              fontSize: "1.3rem",
            }}
          >
            {headerContent.subtitle2}
          </p>
        )}

        {/* Show information banner for users with no products in their school */}
        {showNoProductsBanner() && (
          <div
            style={{
              backgroundColor: "#e7f3ff",
              border: "1px solid #b3d9ff",
              borderRadius: "8px",
              padding: "15px",
              margin: "15px auto",
              maxWidth: "600px",
              textAlign: "center",
            }}
          >
            <FaInfoCircle style={{ color: "#0066cc", marginRight: "8px" }} />
            <strong>No products available in your school yet.</strong>
            <br />
            <span style={{ fontSize: "0.9rem", color: "#666" }}>
              Explore products from other schools while waiting for vendors in
              your school to list their products.
            </span>
          </div>
        )}

        {/* Show navigation buttons for authenticated users */}
        {isAuthenticated && (
          <div style={{ textAlign: "center", marginBottom: "1rem" }}>
            {!viewOtherProducts ? (
              <button
                onClick={handleViewOtherProducts}
                className={styles.switchViewButton}
                style={{
                  padding: "10px 20px",
                  backgroundColor:
                    userInstitutionProductCount === 0 ? "#28a745" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "1rem",
                  fontWeight:
                    userInstitutionProductCount === 0 ? "bold" : "normal",
                }}
              >
                {userInstitutionProductCount === 0
                  ? "Explore Products from Other Schools"
                  : "View Other Schools Products"}
              </button>
            ) : (
              <button
                onClick={handleBackToMySchool}
                className={styles.switchViewButton}
                style={{
                  padding: "10px 20px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Back to My School Products
              </button>
            )}
          </div>
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
            {schools.map((institutionName) => (
              <option key={institutionName} value={institutionName}>
                {institutionName}
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
        <button className={styles.clearFilters} onClick={() => clearFilters()}>
          Clear Filters
        </button>
      </div>

      {showFilters && (
        <div className={styles.sortBy}>
          <button
            className={styles.clearFilterss}
            onClick={() => clearFilters()}
          >
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
            ) : isAuthenticated &&
              !viewOtherProducts &&
              userInstitutionProductCount === 0 ? (
              <>
                Your school doesn't have any products listed yet.
                <br />
                Explore products from other schools or encourage vendors in your
                school to start listing their products.
              </>
            ) : (
              "No products are available at this time. Please check back later."
            )}
          </p>
          {isAuthenticated && !viewOtherProducts && (
            <button
              className={styles.clearButton}
              onClick={handleViewOtherProducts}
              style={{
                marginTop: "15px",
                padding: "12px 24px",
                backgroundColor: "#28a745",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "1rem",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Explore Other Schools Products
            </button>
          )}
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
