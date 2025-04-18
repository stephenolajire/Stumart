import React, { useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import ShopGrid from "../components/ShopGrid";
import api from "../constant/api";
import styles from "../css/OtherService.module.css"; // You'll need to create this CSS module

// Other service specific categories
const otherServiceCategories = [
  { value: "all", label: "All Services" },
  { value: "laundry", label: "Laundry Services" },
  { value: "note_writing", label: "Note Writing" },
  { value: "assignment_help", label: "Assignment Help" },
  { value: "barbing", label: "Barbing Services" },
  { value: "hair_styling", label: "Hair Styling" },
  { value: "printing", label: "Printing Services" },
  { value: "computer_repairs", label: "Computer Repairs" },
  { value: "phone_repairs", label: "Phone Repairs" },
  { value: "tutoring", label: "Tutoring" },
  { value: "photography", label: "Photography" },
  { value: "graphic_design", label: "Graphic Design" },
  { value: "tailoring", label: "Tailoring" },
  { value: "cleaning", label: "Cleaning Services" },
  { value: "event_planning", label: "Event Planning" },
];

const OtherService = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { shopsData, fetchShopsBySchool, loading } = useContext(GlobalContext);

  // Get school parameter from URL if it exists
  const queryParams = new URLSearchParams(location.search);
  const schoolParam = queryParams.get("school");

  const [selectedServiceCategory, setSelectedServiceCategory] = useState("all");
  const [filteredShops, setFilteredShops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper function to fetch shops based on specific category and school
  const fetchOtherServiceShops = async (
    specificCategory,
    schoolName = null
  ) => {
    setIsLoading(true);
    try {
      let shops;
      if (schoolName) {
        // Fetch school-specific shops with other service category
        const response = await api.get("/shops-by-school-and-category/", {
          params: {
            school: schoolName,
            business_category: "others",
            specific_category:
              specificCategory === "all" ? null : specificCategory,
          },
        });
        shops = response.data;
      } else {
        // Fetch all shops with "other" as main category
        const response = await api.get("shops-by-category/", {
          params: {
            business_category: "others",
            specific_category:
              specificCategory === "all" ? null : specificCategory,
          },
        });
        shops = response.data;
        console.log(response.data)
      }

      setFilteredShops(shops);
    } catch (error) {
      console.error("Error fetching other service shops:", error);
      setFilteredShops([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch based on URL parameters
  useEffect(() => {
    if (schoolParam) {
      // If we have a school parameter, fetch other service shops for that school
      fetchOtherServiceShops("all", schoolParam);
    } else {
      // Otherwise fetch all other service shops
      fetchOtherServiceShops("all");
    }
  }, [schoolParam]);

  // Handle service category change
  const handleServiceCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedServiceCategory(category);
    fetchOtherServiceShops(category, schoolParam);
  };

  // Go back to main page
  const handleBackToMain = () => {
    navigate("/");
  };

  return (
    <div className={styles.otherServiceContainer}>
      <div className={styles.header}>
        <button onClick={handleBackToMain} className={styles.backButton}>
          ← Back to Main
        </button>
        <h1>Other Services {schoolParam ? `in ${schoolParam}` : ""}</h1>
      </div>

      <div className={styles.filterContainer}>
        <label htmlFor="service-category">Filter by Service Type:</label>
        <select
          id="service-category"
          value={selectedServiceCategory}
          onChange={handleServiceCategoryChange}
          className={styles.selectInput}
        >
          {otherServiceCategories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.shopsContainer}>
        {isLoading || loading ? (
          <p className={styles.loadingMessage}>Loading services...</p>
        ) : filteredShops && filteredShops.length > 0 ? (
          <ShopGrid shops={filteredShops} />
        ) : (
          <p className={styles.noShopsMessage}>
            {selectedServiceCategory === "all"
              ? `No other services found${
                  schoolParam ? ` in ${schoolParam}` : ""
                }`
              : `No ${
                  otherServiceCategories.find(
                    (c) => c.value === selectedServiceCategory
                  )?.label || selectedServiceCategory
                } found${schoolParam ? ` in ${schoolParam}` : ""}`}
          </p>
        )}
      </div>
    </div>
  );
};

export default OtherService;
