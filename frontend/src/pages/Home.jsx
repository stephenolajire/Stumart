import { useContext, useState, useEffect } from "react";
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

const Home = () => {
  const navigate = useNavigate();
  const {
    shopsData,
    fetchShopsBySchool,
    fetchShopData,
    loading,
    isAuthenticated,
    user,
  } = useContext(GlobalContext);

  // State variables
  const institution = localStorage.getItem("institution");
  const user_type = localStorage.getItem("user_type");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [availableSchools, setAvailableSchools] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [schoolShops, setSchoolShops] = useState([]);
  const [displayMode, setDisplayMode] = useState("allShops");
  const [productName, setProductName] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLockedToInstitution, setIsLockedToInstitution] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const shopsPerPage = 12; // Show fewer shops per page for better layout

  // Get all states from Nigeria institutions
  const states = Object.keys(nigeriaInstitutions);

  // Format category name
  const formatCategoryName = (category) => {
    if (category === "all") return "All";
    return category
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Filter shops based on category
  const applyFilters = (shops, category) => {
    if (!shops || !Array.isArray(shops)) return [];
    if (category === "all") {
      return shops;
    } else {
      return shops.filter(
        (shop) =>
          shop.business_category &&
          shop.business_category.toLowerCase() === category.toLowerCase()
      );
    }
  };

  // Change promotion slide every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  // Initial data fetch
  useEffect(() => {
    if (!isInitialized && Array.isArray(shopsData) && shopsData.length > 0) {
      if (!isAuthenticated || !institution) {
        setFilteredShops(applyFilters(shopsData, selectedCategory));
        setDisplayMode("allShops");
        setIsInitialized(true);
      }
    }
  }, [
    shopsData,
    isAuthenticated,
    institution,
    selectedCategory,
    isInitialized,
  ]);

  // Update available schools when state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableSchools(nigeriaInstitutions[selectedState] || []);

      if (
        selectedSchool &&
        !nigeriaInstitutions[selectedState].includes(selectedSchool)
      ) {
        setSelectedSchool("");
      }
    } else {
      setAvailableSchools([]);
      setSelectedSchool("");
    }
  }, [selectedState, selectedSchool]);

  // Handle authenticated user's institution
  useEffect(() => {
    const handleUserInstitution = async () => {
      if (isAuthenticated && institution && !isInitialized) {
        try {
          // Find the state for this institution
          const userState = Object.keys(nigeriaInstitutions).find((state) =>
            nigeriaInstitutions[state].includes(institution)
          );

          if (userState) {
            setSelectedState(userState);
            setSelectedSchool(institution);
          }

          // Fetch shops for user's institution
          const fetchedSchoolShops = await fetchShopsBySchool(institution);

          if (Array.isArray(fetchedSchoolShops)) {
            setSchoolShops(fetchedSchoolShops);
            const filtered = applyFilters(fetchedSchoolShops, selectedCategory);
            setFilteredShops(filtered);
            setDisplayMode("schoolShops");
          } else {
            setSchoolShops([]);
            setFilteredShops([]);
          }

          setIsInitialized(true);
        } catch (error) {
          console.error("Error fetching institution shops:", error);
          setFilteredShops(applyFilters(shopsData, selectedCategory));
          setDisplayMode("allShops");
          setIsInitialized(true);
        }
      }
    };

    handleUserInstitution();
  }, [
    isAuthenticated,
    institution,
    isInitialized,
    shopsData,
    selectedCategory,
    fetchShopsBySchool,
  ]);

  // Apply category filter when category changes
  useEffect(() => {
    if (selectedCategory.toLowerCase() === "other") {
      return;
    }

    if (displayMode === "allShops") {
      setFilteredShops(applyFilters(shopsData, selectedCategory));
    } else if (displayMode === "schoolShops") {
      setFilteredShops(applyFilters(schoolShops, selectedCategory));
    }

    // Reset to first page when filters change
    setCurrentPage(1);
  }, [selectedCategory, displayMode, shopsData, schoolShops]);

  // Request to switch institutions confirmation
  const requestInstitutionSwitch = () => {
    if (isAuthenticated && institution && isLockedToInstitution) {
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
          setIsLockedToInstitution(false);
          // Reset state but keep the current institution as the default
          setSelectedState("");
          setSelectedSchool("");
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
  };

  // Handle school selection submission
  const handleSchoolSubmit = async (e) => {
    e.preventDefault();

    // Check if user is trying to change institution while being locked
    if (
      isAuthenticated &&
      institution &&
      isLockedToInstitution &&
      selectedSchool &&
      selectedSchool !== institution
    ) {
      const switched = requestInstitutionSwitch();
      if (switched) return;
    }

    if (selectedSchool) {
      try {
        const fetchedSchoolShops = await fetchShopsBySchool(selectedSchool);

        if (Array.isArray(fetchedSchoolShops)) {
          setSchoolShops(fetchedSchoolShops);
          const filtered = applyFilters(fetchedSchoolShops, selectedCategory);
          setFilteredShops(filtered);
          setDisplayMode("schoolShops");
        } else {
          setSchoolShops([]);
          setFilteredShops([]);
        }
      } catch (error) {
        console.error("Error fetching shops by school:", error);
        setSchoolShops([]);
        setFilteredShops([]);
      }
    }
  };

  // Handle category change with navigation to Other Services
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);

    // Navigate to Other Services page if "Other" is selected
    if (category.toLowerCase() === "other") {
      if (displayMode === "schoolShops" && selectedSchool) {
        navigate(
          `/other-services?school=${encodeURIComponent(selectedSchool)}`
        );
      } else {
        navigate("/other-services");
      }
    }
  };

  // Reset school filter
  const handleResetFilter = () => {
    if (isAuthenticated && institution && isLockedToInstitution) {
      const switched = requestInstitutionSwitch();
      if (switched) return;
    }

    setSelectedState("");
    setSelectedSchool("");
    setDisplayMode("allShops");
    setSchoolShops([]);

    const filtered = applyFilters(shopsData, selectedCategory);
    setFilteredShops(filtered);
  };

  // Format the title based on current selections
  const getTitle = () => {
    const formattedCategory = formatCategoryName(selectedCategory);

    if (displayMode === "schoolShops") {
      return selectedCategory === "all" ? (
        `Shops in ${selectedSchool}`
      ) : (
        <span>
          <span className={styles.highlightCategory}>{formattedCategory}</span>{" "}
          Shops in {selectedSchool}
        </span>
      );
    } else {
      return selectedCategory === "all" ? (
        "Featured Shops"
      ) : (
        <span>
          <span className={styles.highlightCategory}>{formattedCategory}</span>{" "}
          Shops
        </span>
      );
    }
  };

  // Format the no results message
  const getNoResultsMessage = () => {
    const formattedCategory = formatCategoryName(selectedCategory);

    if (displayMode === "schoolShops") {
      return selectedCategory === "all"
        ? `No shops found for ${selectedSchool}`
        : `No ${formattedCategory} shops found for ${selectedSchool}`;
    } else {
      return selectedCategory === "all"
        ? "No shops available"
        : `No ${formattedCategory} shops available`;
    }
  };

  // Handle product search
  const handleProductSearch = async (e) => {
    e.preventDefault();
    if (!productName.trim()) return;

    if (
      isAuthenticated &&
      institution &&
      isLockedToInstitution &&
      selectedSchool &&
      selectedSchool !== institution
    ) {
      const switched = requestInstitutionSwitch();
      if (switched) return;
    }

    setIsSearching(true);
    try {
      const params = {
        product_name: productName,
        ...(selectedSchool && { institution: selectedSchool }),
        ...(selectedState && { state: selectedState }),
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
              productName,
              school: selectedSchool,
              state: selectedState,
            },
          },
        });
      } else {
        Swal.fire({
          icon: "info",
          title: "No Products Found",
          text: `No products matching "${productName}" found in the selected location.`,
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
      setIsSearching(false);
    }
  };

  // Handle state selection
  const handleStateChange = (e) => {
    const newState = e.target.value;

    if (isAuthenticated && institution && isLockedToInstitution) {
      requestInstitutionSwitch();
      return;
    }

    setSelectedState(newState);
  };

  // Handle school selection
  const handleSchoolChange = (e) => {
    const newSchool = e.target.value;

    if (
      isAuthenticated &&
      institution &&
      isLockedToInstitution &&
      newSchool !== institution
    ) {
      requestInstitutionSwitch();
      return;
    }

    setSelectedSchool(newSchool);
  };

  // Handle change school selection
  const handleChangeSchool = async () => {
    if (
      isAuthenticated &&
      institution &&
      isLockedToInstitution &&
      selectedSchool !== institution
    ) {
      const switched = requestInstitutionSwitch();
      if (switched) return;
    }

    if (selectedSchool) {
      try {
        const fetchedSchoolShops = await fetchShopsBySchool(selectedSchool);

        if (Array.isArray(fetchedSchoolShops)) {
          setSchoolShops(fetchedSchoolShops);
          const filtered = applyFilters(fetchedSchoolShops, selectedCategory);
          setFilteredShops(filtered);
          setDisplayMode("schoolShops");
        } else {
          setSchoolShops([]);
          setFilteredShops([]);

          Swal.fire({
            icon: "info",
            title: "No Shops Found",
            text: `No shops found for ${selectedSchool}.`,
          });
        }
      } catch (error) {
        console.error("Error fetching shops by school:", error);
        setSchoolShops([]);
        setFilteredShops([]);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to fetch shops. Please try again.",
        });
      }
    }
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Pagination logic
  const indexOfLastShop = currentPage * shopsPerPage;
  const indexOfFirstShop = indexOfLastShop - shopsPerPage;
  const currentShops = filteredShops?.slice(indexOfFirstShop, indexOfLastShop);
  const totalPages = Math.ceil((filteredShops?.length || 0) / shopsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <main className={styles.homeContainer}>
      {/* Hero Banner Section with Search */}
      <form onSubmit={handleProductSearch} className={styles.searchBar}>
        <input
          type="text"
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="What are you looking for?"
          className={styles.searchInput}
        />
        <button
          type="submit"
          className={styles.searchButton}
          disabled={!productName.trim() || isSearching}
        >
          {isSearching ? "Searching..." : <FaSearch />}
        </button>
      </form>
      {/* <section className={styles.heroBanner}>
        <div className={styles.heroContent}>
          <h1>Your Campus Marketplace</h1>
          <p>
            Shop from local vendors, get exclusive student discounts, and enjoy
            fast delivery right to your hostel
          </p>

          {isAuthenticated && institution && isLockedToInstitution && (
            <div className={styles.currentInstitutionLabel}>
              <FaUniversity className={styles.institutionIcon} />
              Currently shopping at <span>{institution}</span>
            </div>
          )}
        </div>
      </section> */}

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
              backgroundImage: `url(${promotions[currentPromoIndex].image})`,
              backgroundSize: "cover",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              // objectFit: "contain",
              // height: "200px",
              // width: "100%",
            }}
          >
            <h3>{promotions[currentPromoIndex].title}</h3>
            <p>{promotions[currentPromoIndex].description}</p>
            <Link
              to={promotions[currentPromoIndex].link}
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
                  index === currentPromoIndex ? styles.activeDot : ""
                }`}
                onClick={() => setCurrentPromoIndex(index)}
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
                selectedCategory === category.name.toLowerCase()
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
              {showFilters ? <FaTimes /> : <FaFilter />}{" "}
              {showFilters ? "Hide Filter" : "Filter by school"}
            </button>
          </div>

          {showFilters && (
            <div className={styles.advancedFilters}>
              <form className={styles.filterForm} onSubmit={handleSchoolSubmit}>
                <div className={styles.filterGrid}>
                  <div className={styles.filterGroup}>
                    <label htmlFor="state-select">State:</label>
                    <select
                      id="state-select"
                      value={selectedState}
                      onChange={handleStateChange}
                      disabled={
                        isAuthenticated && institution && isLockedToInstitution
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
                      value={selectedSchool}
                      onChange={handleSchoolChange}
                      disabled={
                        (isAuthenticated &&
                          institution &&
                          isLockedToInstitution) ||
                        !selectedState
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
                  {selectedSchool && (
                    <button
                      type="button"
                      onClick={handleChangeSchool}
                      className={styles.applyButton}
                    >
                      View Shops
                    </button>
                  )}

                  {(selectedState || selectedSchool) && (
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
        {loading && !isInitialized ? (
          <div className={styles.loadingContainer}>
            <Spinner />
          </div>
        ) : filteredShops && filteredShops.length > 0 ? (
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
                        {/* On small screens, we'll conditionally show less info */}
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
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
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
                        Math.abs(num - currentPage) <= 1
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
                            currentPage === number ? styles.activePage : ""
                          }`}
                        >
                          {number}
                        </button>
                      </React.Fragment>
                    ))}
                </div>

                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
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
            {(selectedState ||
              selectedSchool ||
              selectedCategory !== "all") && (
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
};

export default Home;
