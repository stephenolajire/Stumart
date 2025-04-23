import React, { useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import ServiceGrid from "../components/ServiceGrid";
import api from "../constant/api";
import styles from "../css/OtherService.module.css";
import Swal from "sweetalert2";
import { nigeriaInstitutions } from "../constant/data";

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
  const { loading } = useContext(GlobalContext);

  // Get school parameter from URL if it exists
  const queryParams = new URLSearchParams(location.search);
  const schoolParam = queryParams.get("school");

  const [selectedServiceCategory, setSelectedServiceCategory] = useState("all");
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add new state for search
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [availableSchools, setAvailableSchools] = useState([]);

  // Helper function to fetch services based on specific category and school
  const fetchOtherServices = async (specificCategory, schoolName = null) => {
    setIsLoading(true);
    try {
      let endpoint = schoolName
        ? "/shops-by-school-and-category/"
        : "/shops-by-category/";

      const params = {
        business_category: "others",
        specific_category: specificCategory === "all" ? null : specificCategory,
      };

      if (schoolName) {
        params.school = schoolName;
      }

      const response = await api.get(endpoint, { params });
      setServices(response.data);
    } catch (error) {
      console.error("Error fetching other services:", error);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data fetch based on URL parameters
  useEffect(() => {
    fetchOtherServices(selectedServiceCategory, schoolParam);
  }, [schoolParam]);

  // Update schools when state changes
  useEffect(() => {
    if (selectedState) {
      setAvailableSchools(nigeriaInstitutions[selectedState] || []);
      setSelectedSchool(""); // Reset school when state changes
    } else {
      setAvailableSchools([]);
    }
  }, [selectedState]);

  // Handle service category change
  const handleServiceCategoryChange = (e) => {
    const category = e.target.value;
    setSelectedServiceCategory(category);
    fetchOtherServices(category, schoolParam);
  };

  // Handle service search
  // Handle service search
  const handleServiceSearch = async (e) => {
    e.preventDefault();
    setIsSearching(true);
    setIsLoading(true);

    try {
      const response = await api.get("search-specific-services/", {
        params: {
          specific_category:
            selectedServiceCategory === "all" ? null : selectedServiceCategory,
          state: selectedState || null,
          institution: selectedSchool || null,
        },
      });

      // Check if response has services data
      if (
        response.data &&
        response.data.services &&
        response.data.services.length > 0
      ) {
        setServices(response.data.services); // Use response.data.services instead of response.data
        console.log(response.data.services);
      } else {
        setServices([]);
        await Swal.fire({
          icon: "info",
          title: "No Services Found",
          text: `No ${
            selectedServiceCategory === "all"
              ? "services"
              : otherServiceCategories.find(
                  (c) => c.value === selectedServiceCategory
                )?.label
          } found in the selected location.`,
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      await Swal.fire({
        icon: "error",
        title: "Search Failed",
        text: "Failed to search for services. Please try again.",
      });
    } finally {
      setIsSearching(false);
      setIsLoading(false);
    }
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

      <div className={styles.searchSection}>
        <form onSubmit={handleServiceSearch} className={styles.searchForm}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="service-category">Service Type:</label>
              <select
                id="service-category"
                value={selectedServiceCategory}
                onChange={(e) => setSelectedServiceCategory(e.target.value)}
                className={styles.selectInput}
              >
                {otherServiceCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
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
                {Object.keys(nigeriaInstitutions).map((state) => (
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
              className={styles.searchButton}
              disabled={isSearching}
            >
              {isSearching ? "Searching..." : "Search Services"}
            </button>
          </div>
        </form>
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
        ) : services && services.length > 0 ? (
          <ServiceGrid services={services} />
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
