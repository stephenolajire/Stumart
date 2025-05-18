import { useContext, useState, useEffect } from "react";
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
  const [isInitialized, setIsInitialized] = useState(false);

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

  // Function to filter shops based on category
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

  // Initial data fetch
  useEffect(() => {
    if (!isInitialized && Array.isArray(shopsData) && shopsData.length > 0) {
      // If not authenticated or no institution stored, use all shops data
      if (!isAuthenticated || !institution) {
        setFilteredShops(applyFilters(shopsData, selectedCategory));
        setDisplayMode("allShops");
        setIsInitialized(true);
      }
    }
  }, [shopsData, isAuthenticated, institution, selectedCategory, isInitialized]);

  // Update available schools whenever state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableSchools(nigeriaInstitutions[selectedState] || []);
      
      // Clear selected school only if changing to a new state
      if (selectedSchool && !nigeriaInstitutions[selectedState].includes(selectedSchool)) {
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
            // Handle case where no shops are found
            setSchoolShops([]);
            setFilteredShops([]);
          }
          
          setIsInitialized(true);
        } catch (error) {
          console.error("Error fetching institution shops:", error);
          // If there's an error, still initialize and show all shops
          setFilteredShops(applyFilters(shopsData, selectedCategory));
          setDisplayMode("allShops");
          setIsInitialized(true);
        }
      }
    };
    
    handleUserInstitution();
  }, [isAuthenticated, institution, isInitialized, shopsData, selectedCategory, fetchShopsBySchool]);

  // Apply category filter when category changes
  useEffect(() => {
    // "Other" category is handled separately
    if (selectedCategory.toLowerCase() === "other") {
      return;
    }

    if (displayMode === "allShops") {
      setFilteredShops(applyFilters(shopsData, selectedCategory));
    } else if (displayMode === "schoolShops") {
      setFilteredShops(applyFilters(schoolShops, selectedCategory));
    }
  }, [selectedCategory, displayMode, shopsData, schoolShops]);

  // Handle school selection submission
  const handleSchoolSubmit = async (e) => {
    e.preventDefault();
    if (selectedSchool) {
      try {
        const fetchedSchoolShops = await fetchShopsBySchool(selectedSchool);

        if (Array.isArray(fetchedSchoolShops)) {
          // Store the original school shops
          setSchoolShops(fetchedSchoolShops);

          // Apply category filter to school shops
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

  // Handle change school selection
  const handleChangeSchool = async () => {
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
          
          // Show message when no shops found
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
                        disabled={!selectedState} // Only disable if no state selected
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
                    
                    {selectedSchool && (
                      <button
                        type="button"
                        className={`${styles.submitButton} ${styles.changeSchoolBtn}`}
                        onClick={handleChangeSchool}
                      >
                        View Shops in This School
                      </button>
                    )}
                    
                    {((selectedState || selectedSchool) || productName) && (
                      <button
                        type="button"
                        className={styles.resetButton}
                        onClick={() => {
                          handleResetFilter();
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
            {loading && !isInitialized ? (
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
          {loading && !isInitialized ? (
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
