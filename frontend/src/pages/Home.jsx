import { useContext, useState, useEffect } from "react";
import Hero from "../components/Hero";
import Promotion from "../components/Promotion";
import CategoryFilter from "../components/CategoryFilter";
import ShopGrid from "../components/ShopGrid";
import styles from "../css/Home.module.css";
import {
  FaBook,
  FaUtensils,
  FaLaptop,
  FaTshirt,
  FaDesktop,
  FaHome,
  FaPlane,
  FaCoffee,
} from "react-icons/fa";

import { GlobalContext } from "../constant/GlobalContext";
import { nigeriaInstitutions } from '../constant/data'

// Sample categories data with "All" option
const categories = [
  { id: 0, name: "All", icon: null },
  { id: 1, name: "Education", icon: <FaBook /> },
  { id: 2, name: "Food", icon: <FaUtensils /> },
  { id: 3, name: "Technology", icon: <FaLaptop /> },
  { id: 4, name: "Clothing", icon: <FaTshirt /> },
  { id: 5, name: "Electronics", icon: <FaDesktop /> },
  { id: 6, name: "Home", icon: <FaHome /> },
  { id: 7, name: "Travel", icon: <FaPlane /> },
  { id: 8, name: "Cafe", icon: <FaCoffee /> },
];

const Home = () => {
  const { shopsData, fetchShopsBySchool } = useContext(GlobalContext);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [availableSchools, setAvailableSchools] = useState([]);
  const [filteredShops, setFilteredShops] = useState([]);

  // Get all states from Nigeria institutions
  const states = Object.keys(nigeriaInstitutions);

  // Update available schools whenever state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableSchools(nigeriaInstitutions[selectedState] || []);
    } else {
      setAvailableSchools([]);
    }
    setSelectedSchool(""); // Reset selected school when state changes
  }, [selectedState]);

  // Handle filtering shops by category
  useEffect(() => {
    if (selectedSchool) {
      // If school is selected, this takes priority
      // Shops would be fetched from backend in the handleSchoolSubmit function
    } else {
      // Filter by category only when no school is selected
      const filtered =
        selectedCategory === "all"
          ? shopsData
          : shopsData.filter(
              (shop) =>
                shop.business_category.toLowerCase() ===
                selectedCategory.toLowerCase()
            );
      setFilteredShops(filtered);
    }
  }, [selectedCategory, shopsData, selectedSchool]);

  // Handle school selection submission
 const handleSchoolSubmit = async (e) => {
   e.preventDefault();
   if (selectedSchool) {
     try {
       const schoolShops = await fetchShopsBySchool(selectedSchool);
       console.log("Fetched shops:", schoolShops);

       if (Array.isArray(schoolShops) && schoolShops.length > 0) {
         setFilteredShops(schoolShops);
       } else {
         setFilteredShops([]); // Ensure empty state updates correctly
       }
     } catch (error) {
       console.error("Error fetching shops by school:", error);
       setFilteredShops([]); // Clear state on error
     }
   }
 };


  // Reset school filter
  const handleResetFilter = () => {
    setSelectedState("");
    setSelectedSchool("");
    // Reset to category filtering
    const filtered =
      selectedCategory === "all"
        ? shopsData
        : shopsData.filter(
            (shop) =>
              shop.business_category.toLowerCase() ===
              selectedCategory.toLowerCase()
          );
    setFilteredShops(filtered);
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
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
            />
          </div>
        </div>
      </section>

      <section className={styles.shopsSection}>
        <div className={styles.container}>
          <h2>
            {selectedSchool ? `Shops in ${selectedSchool}` : "Featured Shops"}
          </h2>
          {filteredShops && filteredShops.length > 0 ? (
            <ShopGrid shops={filteredShops} />
          ) : (
            <p className={styles.noShopsMessage}>
              {selectedSchool
                ? `No shops found for ${selectedSchool}`
                : "No shops available"}
            </p>
          )}
        </div>
      </section>
    </main>
  );
};

export default Home;
