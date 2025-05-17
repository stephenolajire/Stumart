// Add a debugging useEffect to help track state
  useEffect(() => {
    if (loading) {
      console.log("Loading state is true");
    } else {
      console.log("Loading state is false");
      console.log("Display mode:", displayMode);
      console.log("Filtered shops count:", filteredShops?.length || 0);
      console.log("School shops count:", schoolShops?.length || 0);
    }
  }, [loading, displayMode, filteredShops, schoolShops]);

  // Add useEffect to handle loading state completion
  useEffect(() => {
    if (!loading && filteredShops.length === 0 && shopsData && shopsData.length > 0 && displayMode === "allShops") {
      // If we're not in school shops mode and have no filtered shops but shopsData exists,
      // initialize with all shops
      setFilteredShops([...shopsData]);
    }
  }, [loading, filteredShops.length, shopsData, displayMode]);import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.css";
import Hero from "../components/Hero";
import Promotion from "../components/Promotion";
import CategoryFilter from "../components/CategoryFilter";
import ShopGrid from "../components/ShopGrid";
import styles from "../css/Home.module.css";
import Spinner from "../components/Spinner";
import {
  FaBook,
  FaUtensils,
  FaLaptop,
  FaTshirt,
  FaDesktop,
  FaHome,
  FaPlane,
  FaCoffee,
  FaTablet,
  FaSearch,
} from "react-icons/fa";
import { GlobalContext } from "../constant/GlobalContext";

import { nigeriaInstitutions } from "../constant/data";
import api from "../constant/api";

// Sample categories data with "All" option
const categories = [
  { id: 0, name: "All", icon: null },
  { id: 1, name: "Books", icon: <FaBook /> },
  { id: 2, name: "Food", icon: <FaUtensils /> },
  { id: 3, name: "Technology", icon: <FaLaptop /> },
  { id: 4, name: "Fashion", icon: <FaTshirt /> },
  { id: 5, name: "Accessories", icon: <FaDesktop /> },
  { id: 6, name: "Home", icon: <FaHome /> },
  { id: 7, name: "Electronics", icon: <FaTablet /> },
  { id: 8, name: "Other", icon: <FaSearch /> },
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
  const institution = localStorage.getItem("institution");
  const user_type = localStorage.getItem("user_type");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [availableSchools, setAvailableSchools] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [schoolShops, setSchoolShops] = useState([]); // Store original school shops
  const [displayMode, setDisplayMode] = useState("allShops"); // "allShops" or "schoolShops"
  const [productName, setProductName] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Get all states from Nigeria institutions
  const states = Object.keys(nigeriaInstitutions);

  // Utility function to capitalize and format category name
  const formatCategoryName = (category) => {
    if (category === "all") return "All";

    // Capitalize first letter of each word
    return category
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  // Initialize with all shops data - added null check and loading state check
  useEffect(() => {
    // Only update filtered shops when not loading and we have data
    if (!loading && shopsData && Array.isArray(shopsData)) {
      // Only update if we're in "allShops" mode to avoid overwriting school shops
      if (displayMode === "allShops") {
        setFilteredShops([...shopsData]);
      }
    }
  }, [shopsData, loading, displayMode]);

  // Update available schools whenever state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableSchools(nigeriaInstitutions[selectedState] || []);
    } else {
      setAvailableSchools([]);
    }
    setSelectedSchool(""); // Reset selected school when state changes
  }, [selectedState]);

  // Add effect to handle authenticated user's institution
  useEffect(() => {
    const loadInstitutionShops = async () => {
      if (isAuthenticated && institution) {
        // Fix: Define userState outside the conditional and use it consistently
        let userState = null;
        
        if (user_type === 'student') {
          userState = Object.keys(nigeriaInstitutions).find((state) =>
            nigeriaInstitutions[state].includes(institution)
          );
        }
        
        if (userState) {
          setSelectedState(userState);
          setSelectedSchool(institution); // Use institution from localStorage consistently

          try {
            const fetchedSchoolShops = await fetchShopsBySchool(institution);
            
            if (Array.isArray(fetchedSchoolShops) && fetchedSchoolShops.length > 0) {
              setSchoolShops(fetchedSchoolShops);
              // Don't use the currently selected category to avoid dependency cycle
              const filtered = applyFilters(fetchedSchoolShops, "all");
              setFilteredShops(filtered);
              setDisplayMode("schoolShops");
            } else {
              setSchoolShops([]);
              setFilteredShops([]);
              setDisplayMode("schoolShops");
            }
          } catch (error) {
            console.error("Error fetching institution shops:", error);
            // Set empty arrays to prevent loading state
            setSchoolShops([]);
            setFilteredShops([]);
          }
        }
      }
    };
    
    loadInstitutionShops();
    // Remove selectedCategory from dependencies to prevent re-fetching
    // when category changes
  }, [isAuthenticated, institution, user_type, fetchShopsBySchool]);

  // Function to filter shops based on category
  const applyFilters = (shops, category) => {
    if (!shops || !Array.isArray(shops) || shops.length === 0) return [];

    if (category === "all") {
      return [...shops]; // Return a new array to ensure React detects the change
    } else {
      return shops.filter(
        (shop) =>
          shop.business_category &&
          shop.business_category.toLowerCase() === category.toLowerCase()
      );
    }
  };

  // Apply category filter when category changes
  useEffect(() => {
    // Skip processing if not loaded yet
    if (loading) return;
    
    // "Other" category is handled separately
    if (selectedCategory.toLowerCase() === "other") {
      // Navigate will happen in handleCategoryChange
      return;
    }

    // Use the currently available shops rather than triggering new fetches
    if (displayMode === "allShops") {
      const filtered = applyFilters(shopsData, selectedCategory);
      setFilteredShops(filtered);
    } else if (displayMode === "schoolShops") {
      const filtered = applyFilters(schoolShops, selectedCategory);
      setFilteredShops(filtered);
    }
  }, [selectedCategory, displayMode, shopsData, schoolShops, loading]);

  // Handle school selection submission
  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    if (selectedSchool) {
      try {
        const fetchedSchoolShops = await fetchShopsBySchool(selectedSchool);

        if (
          Array.isArray(fetchedSchoolShops) &&
          fetchedSchoolShops.length > 0
        ) {
          // Store the original school shops
          setSchoolShops(fetchedSchoolShops);

          // Apply category filter to school shops
          const filtered = applyFilters(fetchedSchoolShops, selectedCategory);
          setFilteredShops(filtered);
          setDisplayMode("schoolShops");
        } else {
          setSchoolShops([]);
          setFilteredShops([]);
          setDisplayMode("schoolShops");
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
        // Navigate with school parameter
        navigate(
          `/other-services?school=${encodeURIComponent(selectedSchool)}`
        );
      } else {
        // Navigate without parameters
        navigate("/other-services");
      }
    }
  };

  // Reset school filter
  const handleResetFilter = () => {
    setSelectedState("");
    setSelectedSchool("");
    setDisplayMode("allShops");
    setSchoolShops([]);

    // Reset to all shops with current category filter
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

  // Format the no results message based on current selections
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
            products: response.data.products, // Access the products array
            searchParams: {
              productName,
              school: selectedSchool,
              state: selectedState,
            },
          },
        });
        console.log("Search results:", response.data.products);
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

  return (
    <main className={styles.home}>
      <Promotion />
      <Hero />

      <section className={styles.categorySection}>
        <div className={styles.container}>
          <h2>Browse By School You Are In</h2>
          <p>Explore shops based on your interests</p>
          <div className={styles.filtering}>
            <div className={styles.filterSection}>
              <div className={styles.containers}>
                <h5>Find Shops and Order</h5>
                <form
                  onSubmit={handleProductSearch}
                  className={styles.schoolFilterForm}
                >
                  <div className={styles.gridForm}>
                    <div className={styles.formGroup}>
                      <label htmlFor="product-search">Product Name:</label>
                      <input
                        type="text"
                        id="product-search"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="What are you looking for?"
                        className={styles.selectInput}
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="state-select">Select State:</label>
                      <select
                        id="state-select"
                        value={selectedState}
                        onChange={(e) => setSelectedState(e.target.value)}
                        className={styles.selectInput}
                        disabled={isAuthenticated} // Disable if authenticated
                      >
                        <option value="">-- Select State --</option>
                        {states.map((state) => (
                          <option key={state} value={state}>
                            {state.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className={styles.formGroup}>
                      <label htmlFor="school-select">Select School:</label>
                      <select
                        id="school-select"
                        value={selectedSchool}
                        onChange={(e) => setSelectedSchool(e.target.value)}
                        className={styles.selectInput}
                        disabled={isAuthenticated || !selectedState} // Disable if authenticated or no state selected
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

                  <div className={styles.buttonGroup}>
                    <button
                      type="submit"
                      className={styles.submitButton}
                      disabled={!productName.trim()}
                    >
                      {isSearching ? "Searching..." : "Search Products"}
                    </button>
                    {((!isAuthenticated && (selectedState || selectedSchool)) ||
                      productName) && (
                      <button
                        type="button"
                        className={styles.resetButton}
                        onClick={() => {
                          if (!isAuthenticated) {
                            handleResetFilter();
                          }
                          setProductName("");
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
            {loading ? (
              <Spinner />
            ) : (
              <CategoryFilter
                categories={categories}
                selectedCategory={selectedCategory}
                onSelectCategory={handleCategoryChange}
              />
            )}
          </div>
        </div>
      </section>

      <section className={styles.shopsSection}>
        <div className={styles.container}>
          <h2 className={styles.sectionTitle}>{getTitle()}</h2>
          {loading ? (
            <Spinner />
          ) : filteredShops && filteredShops.length > 0 ? (
            <ShopGrid shops={filteredShops} />
          ) : (
            <p className={styles.noShopsMessage}>{getNoResultsMessage()}</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
