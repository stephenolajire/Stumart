import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const { shopsData, fetchShopsBySchool, fetchShopData, loading } =
    useContext(GlobalContext);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [availableSchools, setAvailableSchools] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);
  const [schoolShops, setSchoolShops] = useState([]); // Store original school shops
  const [displayMode, setDisplayMode] = useState("allShops"); // "allShops" or "schoolShops"

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

  // Initialize with all shops data
  useEffect(() => {
    // Set initial filtered shops to all shops
    setFilteredShops(shopsData);
  }, [shopsData]);

  // Update available schools whenever state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableSchools(nigeriaInstitutions[selectedState] || []);
    } else {
      setAvailableSchools([]);
    }
    setSelectedSchool(""); // Reset selected school when state changes
  }, [selectedState]);

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

  // Apply category filter when category changes
  useEffect(() => {
    // "Other" category is handled separately
    if (selectedCategory.toLowerCase() === "other") {
      // Navigate will happen in handleCategoryChange
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

  return (
    <main className={styles.home}>
      <Hero />
      <Promotion />

      <section className={styles.categorySection}>
        <div className={styles.container}>
          <h2>Browse by Category</h2>
          <p>Explore shops based on your interests</p>
          <div className={styles.filtering}>
            <div className={styles.filterSection}>
              <div className={styles.containers}>
                <h5>Find Shops in Your School</h5>
                <form
                  onSubmit={handleSchoolSubmit}
                  className={styles.schoolFilterForm}
                >
                  <div className={styles.gridForm}>
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
                        disabled={!selectedState}
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
                      disabled={!selectedSchool}
                    >
                      Find Shops
                    </button>
                    {(selectedState || selectedSchool) && (
                      <button
                        type="button"
                        className={styles.resetButton}
                        onClick={handleResetFilter}
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
            <Spinner/>
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