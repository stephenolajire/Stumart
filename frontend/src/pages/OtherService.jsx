import React, { useContext, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import ServiceGrid from "../components/ServiceGrid";
import api from "../constant/api";
import Swal from "sweetalert2";
import { nigeriaInstitutions } from "../constant/data";
import Header from "../components/Header";
import SEO from "../components/Metadata";
import { Search, Filter, MapPin, Building, Tag, RefreshCw } from "lucide-react";

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
          confirmButtonColor: "#eab308",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      await Swal.fire({
        icon: "error",
        title: "Search Failed",
        text: "Failed to search for services. Please try again.",
        confirmButtonColor: "#ef4444",
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
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Other Services - Campus Marketplace | StuMart"
        description="Discover diverse campus services including laundry, tutoring, printing, barbing, hair styling, computer repairs, phone repairs, photography, graphic design, tailoring, cleaning, event planning and more at your university through StuMart"
        keywords="campus services, student services, university services, universuty laundry services, university tutoring, university printing services, university barbing services, university hair styling, university computer repairs, university phone repairs, university photography services, university graphic design, university tailoring services, university cleaning services, university event planning, university assignment help, university note writing, university campus marketplace, university student marketplace, university marketplace, campus business, student entrepreneurs, campus delivery, Nigeria universities, student life services, campus convenience"
        url="/other-services"
      />

      {/* Header Section */}
      <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-lg">
        <Header
          title={`Other Services ${schoolParam ? `in ${schoolParam}` : ""}`}
        />
      </div>

      <div className="w-full mx-auto py-8">
        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <div className="flex items-center mb-6">
            <Search className="w-6 h-6 text-yellow-600 mr-3" />
            <h2 className="text-2xl font-bold text-gray-900">Find Services</h2>
          </div>

          <form onSubmit={handleServiceSearch}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Service Type */}
              <div className="space-y-2">
                <label
                  htmlFor="service-category"
                  className="flex items-center text-sm font-medium text-gray-700"
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Service Type
                </label>
                <select
                  id="service-category"
                  value={selectedServiceCategory}
                  onChange={(e) => setSelectedServiceCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                >
                  {otherServiceCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* State Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="state-select"
                  className="flex items-center text-sm font-medium text-gray-700"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Select State
                </label>
                <select
                  id="state-select"
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
                >
                  <option value="">-- Select State --</option>
                  {Object.keys(nigeriaInstitutions).map((state) => (
                    <option key={state} value={state}>
                      {state.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </div>

              {/* School Selection */}
              <div className="space-y-2">
                <label
                  htmlFor="school-select"
                  className="flex items-center text-sm font-medium text-gray-700"
                >
                  <Building className="w-4 h-4 mr-2" />
                  Select School
                </label>
                <select
                  id="school-select"
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className={`w-full px-4 py-3 border border-gray-300 rounded-lg transition-colors ${
                    !selectedState
                      ? "bg-gray-100 cursor-not-allowed"
                      : "focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                  }`}
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

            {/* Search Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isSearching}
                className="inline-flex items-center px-8 py-3 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                {isSearching ? (
                  <>
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5 mr-2" />
                    Search Services
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center">
              <Filter className="w-5 h-5 text-gray-600 mr-3" />
              <label
                htmlFor="filter-category"
                className="text-sm font-medium text-gray-700 mr-4"
              >
                Filter by Service Type:
              </label>
            </div>
            <div className="flex-1 max-w-xs">
              <select
                id="filter-category"
                value={selectedServiceCategory}
                onChange={handleServiceCategoryChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 transition-colors"
              >
                {otherServiceCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {isLoading || loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-600 mb-4"></div>
              <p className="text-lg text-gray-600 font-medium">
                Loading services...
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Please wait while we fetch the latest services
              </p>
            </div>
          ) : services && services.length > 0 ? (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {services.length} Service{services.length !== 1 ? "s" : ""}{" "}
                  Found
                </h3>
                <div className="text-sm text-gray-500">
                  {selectedServiceCategory !== "all" && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {
                        otherServiceCategories.find(
                          (c) => c.value === selectedServiceCategory
                        )?.label
                      }
                    </span>
                  )}
                </div>
              </div>
              <ServiceGrid services={services} />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Services Found
              </h3>
              <p className="text-gray-600 text-center max-w-md">
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
              <p className="text-sm text-gray-500 mt-2">
                Try adjusting your search criteria or browse other categories
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OtherService;
