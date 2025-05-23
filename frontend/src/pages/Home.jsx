import {
  useContext,
  useState,
  useEffect,
  useCallback,
  memo,
  useMemo,
} from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.css";
import styles from "../css/Home.module.css";
import Spinner from "../components/Spinner";
import ourwife from "../assets/our-wife.jpg";
import abu from "../assets/abu.jpg";
import james from "../assets/james.jpg";
import {
  FaBook,
  FaUtensils,
  FaLaptop,
  FaTshirt,
  FaDesktop,
  FaHome,
  FaPlane,
  FaTablet,
  FaSearch,
  FaMapMarkerAlt,
  FaStar,
  FaUniversity,
  FaStore,
  FaChevronRight,
  FaFilter,
  FaTimes,
  FaClock,
  FaShoppingCart,
} from "react-icons/fa";
import { GlobalContext } from "../constant/GlobalContext";
import { nigeriaInstitutions } from "../constant/data";
import api from "../constant/api";
import { MEDIA_BASE_URL } from "../constant/api";
import { Link } from "react-router-dom";
import debounce from "lodash/debounce";

// Categories with icons
const categories = [
  { id: 0, name: "All", icon: <FaStore /> },
  { id: 1, name: "Books", icon: <FaBook /> },
  { id: 2, name: "Food", icon: <FaUtensils /> },
  { id: 3, name: "Technology", icon: <FaLaptop /> },
  { id: 4, name: "Fashion", icon: <FaTshirt /> },
  { id: 5, name: "Accessories", icon: <FaDesktop /> },
  { id: 6, name: "Home", icon: <FaHome /> },
  { id: 7, name: "Electronics", icon: <FaTablet /> },
  { id: 8, name: "Other", icon: <FaSearch /> },
];

// Featured deals data (previously in Promotion component)
const promotions = [
  {
    id: 1,
    title: "Back to School Sale!",
    description: "Get 20% off on all stationery items",
    link: "/category/stationery",
    gradient: "primary",
    image: ourwife,
  },
  {
    id: 2,
    title: "Food Festival Week",
    description: "Amazing deals on campus restaurants",
    link: "/category/food",
    gradient: "secondary",
    image: abu,
  },
  {
    id: 3,
    title: "Tech Gadget Fair",
    description: "Latest gadgets at student-friendly prices",
    link: "/category/tech",
    gradient: "tertiary",
    image: james,
  },
];

const Home = memo(() => {
  const navigate = useNavigate();
  const { shopsData, fetchShopsBySchool, loading, isAuthenticated } =
    useContext(GlobalContext);

  // Consolidated state
  const [filters, setFilters] = useState({
    category: "all",
    state: "",
    school: "",
  });

  const [shopState, setShopState] = useState({
    filteredShops: [],
    schoolShops: [],
    displayMode: "allShops",
  });

  // UI state
  const [uiState, setUiState] = useState({
    productName: "",
    isSearching: false,
    isInitialized: false,
    isLockedToInstitution: true,
    showFilters: false,
    currentPromoIndex: 0,
    currentPage: 1,
  });

  // Constants
  const institution = localStorage.getItem("institution");
  const shopsPerPage = 12;

  // Get all states from Nigeria institutions
  const states = useMemo(() => Object.keys(nigeriaInstitutions), []);

  // Compute available schools when state changes
  const availableSchools = useMemo(() => {
    if (!filters.state) return [];
    return nigeriaInstitutions[filters.state] || [];
  }, [filters.state]);

  // Filter function - memoized to prevent recreating on every render
  const applyFilters = useCallback((shops, category) => {
    if (!shops || !Array.isArray(shops)) return [];
    if (category === "all") return shops;

    return shops.filter(
      (shop) =>
        shop.business_category &&
        shop.business_category.toLowerCase() === category.toLowerCase()
    );
  }, []);

  // Computed properties
  const totalPages = useMemo(() => {
    return Math.ceil((shopState.filteredShops?.length || 0) / shopsPerPage);
  }, [shopState.filteredShops, shopsPerPage]);

  const currentShops = useMemo(() => {
    const { currentPage } = uiState;
    const indexOfLastShop = currentPage * shopsPerPage;
    const indexOfFirstShop = indexOfLastShop - shopsPerPage;
    return shopState.filteredShops?.slice(indexOfFirstShop, indexOfLastShop);
  }, [shopState.filteredShops, uiState.currentPage, shopsPerPage]);

  // Format category name - memoized helper function
  const formatCategoryName = useCallback((category) => {
    if (category === "all") return "All";
    return category
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }, []);

  // Format title based on current selections
  const getTitle = useCallback(() => {
    const formattedCategory = formatCategoryName(filters.category);

    if (shopState.displayMode === "schoolShops") {
      return filters.category === "all" ? (
        `Shops in ${filters.school}`
      ) : (
        <span>
          <span className={styles.highlightCategory}>{formattedCategory}</span>{" "}
          Shops in {filters.school}
        </span>
      );
    } else {
      return filters.category === "all" ? (
        "Featured Shops"
      ) : (
        <span>
          <span className={styles.highlightCategory}>{formattedCategory}</span>{" "}
          Shops
        </span>
      );
    }
  }, [
    filters.category,
    filters.school,
    shopState.displayMode,
    formatCategoryName,
  ]);

  // Format the no results message
  const getNoResultsMessage = useCallback(() => {
    const formattedCategory = formatCategoryName(filters.category);

    if (shopState.displayMode === "schoolShops") {
      return filters.category === "all"
        ? `No shops found for ${filters.school}`
        : `No ${formattedCategory} shops found for ${filters.school}`;
    } else {
      return filters.category === "all"
        ? "No shops available"
        : `No ${formattedCategory} shops available`;
    }
  }, [
    filters.category,
    filters.school,
    shopState.displayMode,
    formatCategoryName,
  ]);

  // Promotion carousel timer
  useEffect(() => {
    const timer = setInterval(() => {
      setUiState((prev) => ({
        ...prev,
        currentPromoIndex: (prev.currentPromoIndex + 1) % promotions.length,
      }));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Centralized shop fetching function - memoized with useCallback
  const fetchShops = useCallback(
    async (schoolName) => {
      try {
        const fetchedShops = await fetchShopsBySchool(schoolName);

        if (Array.isArray(fetchedShops)) {
          setShopState((prev) => ({
            ...prev,
            schoolShops: fetchedShops,
            filteredShops: applyFilters(fetchedShops, filters.category),
            displayMode: "schoolShops",
          }));
          return true;
        }
        return false;
      } catch (error) {
        console.error("Error fetching shops:", error);
        return false;
      }
    },
    [fetchShopsBySchool, applyFilters, filters.category]
  );

  // Debounced filter update function - properly memoized
  const debouncedFilterUpdate = useMemo(
    () =>
      debounce(async (newFilters) => {
        try {
          if (newFilters.school) {
            await fetchShops(newFilters.school);
          } else {
            setShopState((prev) => ({
              ...prev,
              filteredShops: applyFilters(shopsData, newFilters.category),
              displayMode: "allShops",
            }));
          }
        } catch (error) {
          console.error("Error updating filters:", error);
        }
      }, 500),
    [fetchShops, applyFilters, shopsData]
  );

  // Clean up debounce on unmount
  useEffect(() => {
    return () => {
      debouncedFilterUpdate.cancel();
    };
  }, [debouncedFilterUpdate]);

  // MAIN INITIALIZATION EFFECT - consolidated from multiple effects
  useEffect(() => {
    const initializeData = async () => {
      if (uiState.isInitialized) return;

      try {
        if (isAuthenticated && institution) {
          // Find user's state
          const userState = Object.keys(nigeriaInstitutions).find((state) =>
            nigeriaInstitutions[state].includes(institution)
          );

          // Update filters with user's institution
          setFilters((prev) => ({
            ...prev,
            state: userState || "",
            school: institution,
          }));

          // Fetch shops for user's institution
          const success = await fetchShops(institution);

          if (!success) {
            // Fall back to all shops if institution fetch fails
            setShopState((prev) => ({
              ...prev,
              filteredShops: applyFilters(shopsData, filters.category),
              displayMode: "allShops",
            }));
          }
        } else {
          // Not authenticated, show all shops
          setShopState((prev) => ({
            ...prev,
            filteredShops: applyFilters(shopsData, filters.category),
            displayMode: "allShops",
          }));
        }

        // Mark initialization as complete
        setUiState((prev) => ({
          ...prev,
          isInitialized: true,
        }));
      } catch (error) {
        console.error("Error initializing data:", error);
        // Fall back to all shops on error
        setShopState((prev) => ({
          ...prev,
          filteredShops: applyFilters(shopsData, filters.category),
          displayMode: "allShops",
        }));

        setUiState((prev) => ({
          ...prev,
          isInitialized: true,
        }));
      }
    };

    initializeData();
  }, [
    isAuthenticated,
    institution,
    shopsData,
    filters.category,
    fetchShops,
    applyFilters,
    uiState.isInitialized,
  ]);

  // Apply category filter when it changes
  useEffect(() => {
    if (uiState.isInitialized && filters.category.toLowerCase() !== "other") {
      const currentShops =
        shopState.displayMode === "schoolShops"
          ? shopState.schoolShops
          : shopsData;

      setShopState((prev) => ({
        ...prev,
        filteredShops: applyFilters(currentShops, filters.category),
      }));

      // Reset to first page when filters change
      setUiState((prev) => ({
        ...prev,
        currentPage: 1,
      }));
    }
  }, [
    filters.category,
    uiState.isInitialized,
    shopState.displayMode,
    shopState.schoolShops,
    shopsData,
    applyFilters,
  ]);

  // Request to switch institutions confirmation
  const requestInstitutionSwitch = useCallback(() => {
    if (isAuthenticated && institution && uiState.isLockedToInstitution) {
      Swal.fire({
        title: "Looking for shops elsewhere?",
        text: `You're currently browsing shops at ${institution}. Would you like to look at shops in other institutions?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Yes, show me other institutions",
        cancelButtonText: "No, stay at my institution",
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
      }).then((result) => {
        if (result.isConfirmed) {
          setUiState((prev) => ({
            ...prev,
            isLockedToInstitution: false,
          }));

          // Reset state but keep the current institution as the default
          setFilters((prev) => ({
            ...prev,
            state: "",
            school: "",
          }));

          Swal.fire({
            title: "Institution filter unlocked",
            text: "You can now browse shops from any institution.",
            icon: "success",
            timer: 2000,
            showConfirmButton: false,
          });
        }
      });
      return true;
    }
    return false;
  }, [isAuthenticated, institution, uiState.isLockedToInstitution]);

  // CONSOLIDATED EVENT HANDLERS

  // Handle filter changes
  const handleFilterChange = useCallback(
    (name, value) => {
      setFilters((prev) => ({ ...prev, [name]: value }));
      debouncedFilterUpdate({ ...filters, [name]: value });
    },
    [filters, debouncedFilterUpdate]
  );

  // Handle school selection submission
  const handleSchoolSubmit = useCallback(
    async (e) => {
      e?.preventDefault();

      // Check if user is trying to change institution while being locked
      if (
        isAuthenticated &&
        institution &&
        uiState.isLockedToInstitution &&
        filters.school &&
        filters.school !== institution
      ) {
        const switched = requestInstitutionSwitch();
        if (switched) return;
      }

      if (filters.school) {
        try {
          await fetchShops(filters.school);
        } catch (error) {
          console.error("Error fetching shops by school:", error);
          setShopState((prev) => ({
            ...prev,
            schoolShops: [],
            filteredShops: [],
          }));
        }
      }
    },
    [
      isAuthenticated,
      institution,
      uiState.isLockedToInstitution,
      filters.school,
      fetchShops,
      requestInstitutionSwitch,
    ]
  );

  // Handle category change with navigation to Other Services
  const handleCategoryChange = useCallback(
    (category) => {
      setFilters((prev) => ({ ...prev, category }));

      // Navigate to Other Services page if "Other" is selected
      if (category.toLowerCase() === "other") {
        if (shopState.displayMode === "schoolShops" && filters.school) {
          navigate(
            `/other-services?school=${encodeURIComponent(filters.school)}`
          );
        } else {
          navigate("/other-services");
        }
      }
    },
    [navigate, shopState.displayMode, filters.school]
  );

  // Reset school filter
  const handleResetFilter = useCallback(() => {
    if (isAuthenticated && institution && uiState.isLockedToInstitution) {
      const switched = requestInstitutionSwitch();
      if (switched) return;
    }

    setFilters((prev) => ({
      ...prev,
      state: "",
      school: "",
    }));

    setShopState((prev) => ({
      ...prev,
      displayMode: "allShops",
      schoolShops: [],
      filteredShops: applyFilters(shopsData, filters.category),
    }));
  }, [
    isAuthenticated,
    institution,
    uiState.isLockedToInstitution,
    filters.category,
    shopsData,
    applyFilters,
    requestInstitutionSwitch,
  ]);

  // Handle product search
  const handleProductSearch = useCallback(
    async (e) => {
      e.preventDefault();
      if (!uiState.productName.trim()) return;

      if (
        isAuthenticated &&
        institution &&
        uiState.isLockedToInstitution &&
        filters.school &&
        filters.school !== institution
      ) {
        const switched = requestInstitutionSwitch();
        if (switched) return;
      }

      setUiState((prev) => ({ ...prev, isSearching: true }));

      try {
        const params = {
          product_name: uiState.productName,
          ...(filters.school && { institution: filters.school }),
          ...(filters.state && { state: filters.state }),
        };

        const response = await api.get("search-products/", { params });

        if (
          response.data &&
          response.data.products &&
          response.data.products.length > 0
        ) {
          navigate("/search", {
            state: {
              products: response.data.products,
              searchParams: {
                productName: uiState.productName,
                school: filters.school,
                state: filters.state,
              },
            },
          });
        } else {
          Swal.fire({
            icon: "info",
            title: "No Products Found",
            text: `No products matching "${uiState.productName}" found in the selected location.`,
          });
        }
      } catch (error) {
        console.error("Search error:", error);
        Swal.fire({
          icon: "error",
          title: "Search Failed",
          text: "Product not found. Please try again.",
        });
      } finally {
        setUiState((prev) => ({ ...prev, isSearching: false }));
      }
    },
    [
      uiState.productName,
      uiState.isLockedToInstitution,
      isAuthenticated,
      institution,
      filters.school,
      filters.state,
      navigate,
      requestInstitutionSwitch,
    ]
  );

  // Handle state selection
  const handleStateChange = useCallback(
    (e) => {
      const newState = e.target.value;

      if (isAuthenticated && institution && uiState.isLockedToInstitution) {
        requestInstitutionSwitch();
        return;
      }

      setFilters((prev) => ({ ...prev, state: newState, school: "" }));
    },
    [
      isAuthenticated,
      institution,
      uiState.isLockedToInstitution,
      requestInstitutionSwitch,
    ]
  );

  // Handle school selection
  const handleSchoolChange = useCallback(
    (e) => {
      const newSchool = e.target.value;

      if (
        isAuthenticated &&
        institution &&
        uiState.isLockedToInstitution &&
        newSchool !== institution
      ) {
        requestInstitutionSwitch();
        return;
      }

      setFilters((prev) => ({ ...prev, school: newSchool }));
    },
    [
      isAuthenticated,
      institution,
      uiState.isLockedToInstitution,
      requestInstitutionSwitch,
    ]
  );

  // Toggle filters visibility
  const toggleFilters = useCallback(() => {
    setUiState((prev) => ({ ...prev, showFilters: !prev.showFilters }));
  }, []);

  // Pagination handler
  const paginate = useCallback((pageNumber) => {
    setUiState((prev) => ({ ...prev, currentPage: pageNumber }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // UI COMPONENTS SECTION
  return (
    <main className={styles.homeContainer}>
      {/* Hero Banner Section with Search */}
      <form onSubmit={handleProductSearch} className={styles.searchBar}>
        <input
          type="text"
          value={uiState.productName}
          onChange={(e) =>
            setUiState((prev) => ({ ...prev, productName: e.target.value }))
          }
          placeholder="What are you looking for?"
          className={styles.searchInput}
        />
        <button
          type="submit"
          className={styles.searchButton}
          disabled={!uiState.productName.trim() || uiState.isSearching}
        >
          {uiState.isSearching ? "Searching..." : <FaSearch />}
        </button>
      </form>

      {/* Featured Deals Carousel */}
      <section className={styles.featuredDeals}>
        <div className={styles.sectionHeader}>
          <h2>Featured Deals</h2>
          <Link to="/products" className={styles.viewAll}>
            View All Products
            <FaChevronRight />
          </Link>
        </div>

        <div className={styles.dealsCarousel}>
          <div
            className={styles.dealCard}
            style={{
              backgroundImage: `url(${
                promotions[uiState.currentPromoIndex].image
              })`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
            }}
          >
            <h3>{promotions[uiState.currentPromoIndex].title}</h3>
            <p>{promotions[uiState.currentPromoIndex].description}</p>
            <Link
              to={promotions[uiState.currentPromoIndex].link}
              className={styles.dealButton}
            >
              Shop Now
            </Link>
          </div>

          <div className={styles.carouselDots}>
            {promotions.map((_, index) => (
              <button
                key={index}
                className={`${styles.dot} ${
                  index === uiState.currentPromoIndex ? styles.activeDot : ""
                }`}
                onClick={() =>
                  setUiState((prev) => ({ ...prev, currentPromoIndex: index }))
                }
                aria-label={`View promotion ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className={styles.categories}>
        <div className={styles.sectionHeader}>
          <h2>Shop By Category</h2>
        </div>

        <div className={styles.categoryGrid}>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`${styles.categoryCard} ${
                filters.category === category.name.toLowerCase()
                  ? styles.activeCategory
                  : ""
              }`}
              onClick={() => handleCategoryChange(category.name.toLowerCase())}
            >
              <div className={styles.categoryIcon}>{category.icon}</div>
              <span className={styles.categoryName}>{category.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Filter and Sort Section */}
      <section className={styles.filterSection}>
        <div className={styles.filterBar}>
          <div className={styles.filterHeader}>
            <h2>{getTitle()}</h2>
            <button onClick={toggleFilters} className={styles.filterToggle}>
              {uiState.showFilters ? <FaTimes /> : <FaFilter />}{" "}
              {uiState.showFilters ? "Hide Filter" : "Filter by school"}
            </button>
          </div>

          {uiState.showFilters && (
            <div className={styles.advancedFilters}>
              <form className={styles.filterForm} onSubmit={handleSchoolSubmit}>
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="state-select">State:</label>
                    <select
                      id="state-select"
                      value={filters.state}
                      onChange={handleStateChange}
                      disabled={
                        isAuthenticated &&
                        institution &&
                        uiState.isLockedToInstitution
                      }
                      className={styles.formSelect}
                    >
                      <option value="">-- Select State --</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label htmlFor="school-select">Institution:</label>
                    <select
                      id="school-select"
                      value={filters.school}
                      onChange={handleSchoolChange}
                      disabled={
                        (isAuthenticated &&
                          institution &&
                          uiState.isLockedToInstitution) ||
                        !filters.state
                      }
                      className={styles.formSelect}
                    >
                      <option value="">-- Select School --</option>
                      {availableSchools.map((school, index) => (
                        <option key={index} value={school}>
                          {school}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.filterButtons}>
                  {filters.school && (
                    <button
                      type="button"
                      onClick={handleSchoolSubmit}
                      className={styles.applyButton}
                    >
                      View Shops
                    </button>
                  )}

                  {(filters.state || filters.school) && (
                    <button
                      type="button"
                      onClick={handleResetFilter}
                      className={styles.resetButton}
                    >
                      Reset Filters
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </section>

      {/* Shops Grid Section */}
      <section className={styles.shopsSection}>
        {loading && !uiState.isInitialized ? (
          <div className={styles.loadingContainer}>
            <Spinner />
          </div>
        ) : shopState.filteredShops && shopState.filteredShops.length > 0 ? (
          <>
            <div className={styles.shopsGrid}>
              {currentShops.map((shop) =>
                shop.business_category !== "others" ? (
                  <div key={shop.id} className={styles.shopCard}>
                    <Link to={`/shop/${shop.id}`} className={styles.shopLink}>
                      <div className={styles.shopImage}>
                        <img
                          src={`${MEDIA_BASE_URL}${shop.shop_image}`}
                          alt={shop.business_name}
                        />
                      </div>
                      <div className={styles.shopDetails}>
                        <h3 className={styles.shopName}>
                          {shop.business_name}
                        </h3>
                        <div className={styles.shopMeta}>
                          <span className={styles.shopCategory}>
                            {shop.business_category}
                          </span>
                          <div className={styles.shopRating}>
                            <FaStar className={styles.starIcon} />
                            <span>{shop.rating}</span>
                          </div>
                        </div>
                        <div className={styles.shopLocation}>
                          <FaMapMarkerAlt className={styles.locationIcon} />
                          <span>{shop.user.institution}</span>
                        </div>
                        <div className={styles.shopDelivery}>
                          <FaClock className={styles.clockIcon} />
                          <span>15-30 mins</span>
                        </div>
                        <button className={styles.viewShopButton}>
                          <FaShoppingCart /> Shop Now
                        </button>
                      </div>
                    </Link>
                  </div>
                ) : null
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => paginate(uiState.currentPage - 1)}
                  disabled={uiState.currentPage === 1}
                  className={styles.pageButton}
                >
                  Prev
                </button>

                <div className={styles.pageNumbers}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((num) => {
                      // Show first page, last page, current page and pages around current
                      return (
                        num === 1 ||
                        num === totalPages ||
                        Math.abs(num - uiState.currentPage) <= 1
                      );
                    })
                    .map((number, index, array) => (
                      <React.Fragment key={number}>
                        {index > 0 && array[index - 1] !== number - 1 && (
                          <span className={styles.pageDots}>...</span>
                        )}
                        <button
                          onClick={() => paginate(number)}
                          className={`${styles.pageNumber} ${
                            uiState.currentPage === number
                              ? styles.activePage
                              : ""
                          }`}
                        >
                          {number}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => paginate(uiState.currentPage + 1)}
                  disabled={uiState.currentPage === totalPages}
                  className={styles.pageButton}
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className={styles.noResults}>
            <FaStore className={styles.noResultsIcon} />
            <p>{getNoResultsMessage()}</p>
            {(filters.state ||
              filters.school ||
              filters.category !== "all") && (
              <button
                onClick={handleResetFilter}
                className={styles.resetFiltersButton}
              >
                Reset Filters
              </button>
            )}
          </div>
        )}
      </section>
    </main>
  );
});

export default Home;
