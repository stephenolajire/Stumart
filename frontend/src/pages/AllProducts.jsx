import { useState, useEffect, useContext, useCallback, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import styles from "../css/AllProducts.module.css";
import SEO from "../components/Metadata";
import Swal from "sweetalert2";
import {
  FaFilter,
  FaSort,
  FaTimes,
  FaBox,
  FaSadTear,
  FaArrowLeft,
  FaStore,
} from "react-icons/fa";
import { nigeriaInstitutions, nigeriaStates } from "../constant/data";
import { GlobalContext } from "../constant/GlobalContext";
import Header from "../components/Header";

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedState, setSelectedState] = useState("");
  const [schools, setSchools] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [toggleLoading, setToggleLoading] = useState(false);

  // Get auth and hooks from global context
  const { isAuthenticated, useAllProducts } = useContext(GlobalContext);

  const navigate = useNavigate();

  // Initialize filters from URL params
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

  // Initialize view mode from URL params
  const [viewMode, setViewMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("viewOtherProducts") === "true" ? "other" : "school";
  });

  const school = localStorage.getItem("institution");
  const viewingOtherSchools = viewMode === "other";

  // Memoize the current filter state to prevent unnecessary API calls
  const currentFilters = useMemo(() => {
    return {
      category: filters.category,
      minPrice: filters.minPrice,
      maxPrice: filters.maxPrice,
      sort: filters.sort,
      search: filters.search,
      school: filters.school,
      vendor: filters.vendor,
      state: filters.state,
    };
  }, [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.sort,
    filters.search,
    filters.school,
    filters.vendor,
    filters.state,
  ]);

  // Use the React Query hook for fetching products
  const {
    data: productsData,
    isLoading: allProductsLoading,
    error: allProductsError,
    refetch: refetchProducts,
  } = useAllProducts(currentFilters, viewMode, isAuthenticated);

  // Extract data from React Query response
  const allProducts = productsData?.products || [];
  const allProductsCategories = productsData?.categories || [];
  const allProductsVendors = productsData?.vendors || [];

  // Check if all products belong to the same vendor
  const singleVendorInfo = useMemo(() => {
    if (!allProducts || allProducts.length === 0) return null;

    // Get unique vendor IDs from products
    const uniqueVendorIds = [
      ...new Set(
        allProducts.map((product) => product.vendor_id || product.vendorId)
      ),
    ];

    // If there's only one unique vendor ID, find the vendor details
    if (uniqueVendorIds.length === 1 && uniqueVendorIds[0]) {
      const vendorId = uniqueVendorIds[0];
      const vendor = allProductsVendors.find((v) => v.id === vendorId);
      return vendor ? { id: vendorId, name: vendor.name } : null;
    }

    return null;
  }, [allProducts, allProductsVendors]);

  // Show delivery warning for other schools
  const showDeliveryWarning = useCallback(() => {
    Swal.fire({
      title: "🚚 Delivery Notice",
      html: `
        <div style="text-align: center; padding: 20px;">
          <div style="font-size: 60px; margin-bottom: 20px;">🎒📚</div>
          <h3 style="color: #e74c3c; margin-bottom: 15px;">Important Delivery Information!</h3>
          <p style="font-size: 16px; line-height: 1.6; color: #34495e; margin-bottom: 20px;">
            We only deliver within your registered school campus: <strong style="color: #3498db;">${school}</strong>
          </p>
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin: 15px 0;">
            <p style="margin: 0; color: #856404; font-weight: 500; font-size: 12px;">
              📍 If you order from other schools, make sure you're physically present at that school to receive your items or have someone to receive it!
            </p>
          </div>
          <p style="font-size: 14px; color: #7f8c8d; margin-top: 15px;">
            Happy shopping! 🛒✨
          </p>
        </div>
      `,
      icon: "info",
      confirmButtonText: "I Understand 👍",
      confirmButtonColor: "#3498db",
      showCancelButton: true,
      cancelButtonText: "Go Back to My School",
      cancelButtonColor: "#95a5a6",
      allowOutsideClick: false,
      customClass: {
        popup: "swal-wide",
        title: "swal-title-custom",
        htmlContainer: "swal-html-custom",
      },
      didOpen: () => {
        // Add custom styles
        const style = document.createElement("style");
        style.textContent = `
          .swal-wide {
            width: 90% !important;
            max-width: 500px !important;
          }
          .swal-title-custom {
            font-size: 24px !important;
            font-weight: bold !important;
          }
          .swal-html-custom {
            padding: 0 !important;
          }
        `;
        document.head.appendChild(style);
      },
    }).then((result) => {
      if (result.isDismissed || result.dismiss === Swal.DismissReason.cancel) {
        // User clicked "Go Back to My School" - revert to school mode
        setViewMode("school");
        const params = new URLSearchParams(searchParams);
        params.delete("viewOtherProducts");
        if (school) {
          setFilters((prev) => ({ ...prev, school: school }));
          params.set("school", school);
        }
        setSearchParams(params);
      }
      // If user clicked "I Understand", continue with the mode change
    });
  }, [school, searchParams, setSearchParams]);

  // Handle state change for school filtering
  const handleStateChange = useCallback((state) => {
    setSelectedState(state);
    setSchools(state ? nigeriaInstitutions[state] || [] : []);
    handleFilterChange("state", state);
    handleFilterChange("school", "");
  }, []);

  // Handle filter changes
  const handleFilterChange = useCallback(
    (name, value) => {
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
    },
    [setSearchParams]
  );

  // Handle view mode changes
  const handleViewModeChange = useCallback(
    (newViewMode) => {
      console.log("View mode changing from", viewMode, "to", newViewMode);

      // Show warning when switching to other schools
      if (newViewMode === "other" && viewMode === "school") {
        showDeliveryWarning();
      }

      setToggleLoading(true);
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
    },
    [
      viewMode,
      searchParams,
      filters.school,
      school,
      setSearchParams,
      showDeliveryWarning,
    ]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const resetFilters = {
      category: "",
      minPrice: "",
      maxPrice: "",
      sort: "newest",
      search: "",
      school: viewMode === "school" && school ? school : "",
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
  }, [viewMode, school, setSearchParams]);

  // Effect to stop toggle loading when main loading stops
  useEffect(() => {
    if (!allProductsLoading && toggleLoading) {
      setToggleLoading(false);
    }
  }, [allProductsLoading, toggleLoading]);

  // Effect to set school filter when authenticated and in school mode
  useEffect(() => {
    if (isAuthenticated && viewMode === "school" && school && !filters.school) {
      setFilters((prev) => ({ ...prev, school: school }));
      setSearchParams((prev) => {
        prev.set("school", school);
        return prev;
      });
    }
  }, [isAuthenticated, viewMode, school, filters.school, setSearchParams]);

  // Memoized products count for performance
  const productsCount = useMemo(() => allProducts.length, [allProducts.length]);

  // Memoized no products message
  const noProductsMessage = useMemo(() => {
    const hasActiveFilters =
      filters.search || filters.category || filters.state || filters.school;

    if (hasActiveFilters) {
      return (
        <>
          <FaSadTear className={styles.sadIcon} />
          No products match your current filters. Try adjusting your search
          criteria.
        </>
      );
    }

    return "No products are available at this time. Please check back later.";
  }, [filters.search, filters.category, filters.state, filters.school]);

  // Handle error state
  const errorMessage =
    allProductsError?.message || "Failed to load products. Please try again.";

  return (
    <div className={styles.productsPage}>
      <SEO
        title="All Products - StuMart | Campus Marketplace"
        description="Browse all products available on StuMart campus marketplace. Find textbooks, electronics, food, fashion, and more from students and vendors across Nigerian universities. Filter by school, category, price, and location."
        keywords="stumart products, campus marketplace products, student products, university shopping, campus textbooks, student electronics, campus food, university fashion, student vendors, campus delivery, buy sell students, university marketplace, student business, campus e-commerce, nigeria student shopping, campus products online, university store, student marketplace nigeria"
        url="/products"
      />

      {isAuthenticated && (
        <div className={styles.viewToggle}>
          <select
            value={viewMode}
            onChange={(e) => handleViewModeChange(e.target.value)}
            className={styles.viewSelect}
            disabled={toggleLoading || allProductsLoading}
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
        <Header title="All Products" />
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

      {/* Single Vendor Display */}
      {singleVendorInfo && productsCount > 0 && !allProductsLoading && (
        <div
          className={styles.singleVendorBanner}
          style={{
            backgroundColor: "#f8f9fa",
            border: "1px solid #e9ecef",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1.5rem",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
          }}
        >
          <FaStore style={{ color: "#007bff", fontSize: "1.2rem" }} />
          <span
            style={{
              fontSize: "1.1rem",
              fontWeight: "600",
              color: "#495057",
            }}
          >
            All products by:{" "}
            <strong style={{ color: "#007bff" }}>
              {singleVendorInfo.name}
            </strong>
          </span>
        </div>
      )}

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
            {allProductsCategories.map((category) => (
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
            {Array.from(
              new Map(
                allProductsVendors.map((vendor) => [vendor.name, vendor])
              ).values()
            ).map((vendor) => (
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

      {allProductsLoading || toggleLoading ? (
        <Spinner />
      ) : allProductsError ? (
        <div className={styles.error}>
          <p>{errorMessage}</p>
          <button
            onClick={() => refetchProducts()}
            className={styles.retryButton}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Try Again
          </button>
        </div>
      ) : productsCount === 0 ? (
        <div className={styles.noProducts}>
          <FaBox className={styles.noProductsIcon} />
          <h2>No Products Found</h2>
          <p>{noProductsMessage}</p>
        </div>
      ) : (
        <div className={styles.productsGrid}>
          {allProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProducts;
