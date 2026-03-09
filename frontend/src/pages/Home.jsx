// import React, {
//   useContext,
//   useState,
//   useEffect,
//   useCallback,
//   memo,
//   useMemo,
// } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//   GlobalContext,
//   useShops,
//   useShopsBySchool,
// } from "../constant/GlobalContext";
// import { nigeriaInstitutions } from "../constant/data";
// import Spinner from "../components/Spinner";
// import SEO from "../components/Metadata";
// import {
//   FaBook,
//   FaUtensils,
//   FaLaptop,
//   FaTshirt,
//   FaDesktop,
//   FaHome,
//   FaTablet,
//   FaSearch,
//   FaMapMarkerAlt,
//   FaStar,
//   FaStore,
//   FaFilter,
//   FaTimes,
//   FaClock,
//   FaShoppingCart,
// } from "react-icons/fa";
// import Swal from "sweetalert2";
// import debounce from "lodash/debounce";
// import Hero from "./components/Hero";
// import ShopCard from "./components/ShopCard";

// // Categories with icons
// const categories = [
//   { id: 0, name: "All", icon: <FaStore /> },
//   { id: 2, name: "Food", icon: <FaUtensils /> },
//   { id: 1, name: "Books", icon: <FaBook /> },
//   { id: 3, name: "Technology", icon: <FaLaptop /> },
//   { id: 4, name: "Fashion", icon: <FaTshirt /> },
//   { id: 5, name: "Accessories", icon: <FaDesktop /> },
//   { id: 6, name: "Home", icon: <FaHome /> },
//   { id: 7, name: "Electronics", icon: <FaTablet /> },
//   // { id: 8, name: "Other", icon: <FaSearch /> },
// ];

// const SHOPS_PER_PAGE = 18;

// // Category Card Component
// const CategoryCard = memo(({ category, isActive, onClick }) => (
//   <button
//     className={`
//       flex flex-col items-center justify-center gap-3 p-6 rounded-xl
//       transition-all duration-300 ease-in-out
//       border-2 ${
//         isActive
//           ? "border-yellow-500 bg-yellow-500 text-black shadow-lg shadow-yellow-500/20"
//           : "border-gray-200 bg-white text-gray-700 hover:border-yellow-500 hover:bg-gray-50"
//       }
//       group cursor-pointer
//     `}
//     onClick={() => onClick(category.name.toLowerCase())}
//   >
//     <div
//       className={`
//       text-3xl transition-transform duration-300
//       ${isActive ? "scale-110" : "group-hover:scale-110"}
//     `}
//     >
//       {category.icon}
//     </div>
//     <span className="text-sm font-semibold tracking-wide">{category.name}</span>
//   </button>
// ));

// const Home = memo(() => {
//   const { isAuthenticated } = useContext(GlobalContext);
//   const navigate = useNavigate();

//   const {
//     data: allShopsData,
//     isLoading: allShopsLoading,
//     error: allShopsError,
//   } = useShops();

//   const [filters, setFilters] = useState({
//     category: "all",
//     state: "",
//     school: "",
//   });

//   const [shopState, setShopState] = useState({
//     filteredShops: [],
//     schoolShops: [],
//     displayMode: "allShops",
//   });

//   const [uiState, setUiState] = useState({
//     productName: "",
//     isInitialized: false,
//     isLockedToInstitution: true,
//     showFilters: false,
//     currentPromoIndex: 0,
//     currentPage: 1,
//   });

//   const institution = localStorage.getItem("institution");

//   const {
//     data: schoolShopsData,
//     isLoading: schoolShopsLoading,
//     error: schoolShopsError,
//     refetch: refetchSchoolShops,
//   } = useShopsBySchool(filters.school);

//   const states = useMemo(() => Object.keys(nigeriaInstitutions), []);

//   const availableSchools = useMemo(() => {
//     if (!filters.state) return [];
//     return nigeriaInstitutions[filters.state] || [];
//   }, [filters.state]);

//   const applyFilters = useCallback((shops, category) => {
//     if (!shops || !Array.isArray(shops)) return [];
//     if (category === "all") return shops;

//     return shops.filter(
//       (shop) =>
//         shop.business_category &&
//         shop.business_category.toLowerCase() === category.toLowerCase(),
//     );
//   }, []);

//   const visibleShops = useMemo(() => {
//     return shopState.filteredShops?.filter(
//       (shop) => shop.business_category !== "others",
//     );
//   }, [shopState.filteredShops]);

//   const totalPages = useMemo(() => {
//     return Math.ceil((visibleShops?.length || 0) / SHOPS_PER_PAGE);
//   }, [visibleShops]);

//   const currentShops = useMemo(() => {
//     const { currentPage } = uiState;
//     const indexOfLastShop = currentPage * SHOPS_PER_PAGE;
//     const indexOfFirstShop = indexOfLastShop - SHOPS_PER_PAGE;
//     return visibleShops?.slice(indexOfFirstShop, indexOfLastShop);
//   }, [visibleShops, uiState.currentPage]);

//   const formatCategoryName = useCallback((category) => {
//     if (category === "all") return "All";
//     return category
//       .split(" ")
//       .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
//       .join(" ");
//   }, []);

//   const getTitle = useCallback(() => {
//     const formattedCategory = formatCategoryName(filters.category);

//     if (shopState.displayMode === "schoolShops") {
//       return filters.category === "all" ? (
//         `All Vendors in ${filters.school}`
//       ) : (
//         <span>
//           <span className="text-yellow-500">{formattedCategory}</span> Vendors in{" "}
//           {filters.school}
//         </span>
//       );
//     } else {
//       return filters.category === "all" ? (
//         "Featured Shops"
//       ) : (
//         <span>
//           <span className="text-yellow-500">{formattedCategory}</span> Shops
//         </span>
//       );
//     }
//   }, [
//     filters.category,
//     filters.school,
//     shopState.displayMode,
//     formatCategoryName,
//   ]);

//   const getNoResultsMessage = useCallback(() => {
//     const formattedCategory = formatCategoryName(filters.category);

//     if (shopState.displayMode === "schoolShops") {
//       return filters.category === "all"
//         ? `No shops found for ${filters.school}`
//         : `No ${formattedCategory} shops found for ${filters.school}`;
//     } else {
//       return filters.category === "all"
//         ? "No shops available"
//         : `No ${formattedCategory} shops available`;
//     }
//   }, [
//     filters.category,
//     filters.school,
//     shopState.displayMode,
//     formatCategoryName,
//   ]);

//   useEffect(() => {
//     if (schoolShopsData && filters.school) {
//       setShopState((prev) => ({
//         ...prev,
//         schoolShops: schoolShopsData,
//         filteredShops: applyFilters(schoolShopsData, filters.category),
//         displayMode: "schoolShops",
//       }));
//     }
//   }, [schoolShopsData, filters.school, filters.category, applyFilters]);

//   const debouncedFilterUpdate = useMemo(
//     () =>
//       debounce(async (newFilters) => {
//         try {
//           if (newFilters.school) {
//             // Hook handles fetching
//           } else {
//             setShopState((prev) => ({
//               ...prev,
//               filteredShops: applyFilters(allShopsData, newFilters.category),
//               displayMode: "allShops",
//             }));
//           }
//         } catch (error) {
//           console.error("Error updating filters:", error);
//         }
//       }, 500),
//     [applyFilters, allShopsData],
//   );

//   useEffect(() => {
//     return () => {
//       debouncedFilterUpdate.cancel();
//     };
//   }, [debouncedFilterUpdate]);

//   useEffect(() => {
//     const initializeData = async () => {
//       if (uiState.isInitialized) return;

//       try {
//         if (isAuthenticated && institution) {
//           const userState = Object.keys(nigeriaInstitutions).find((state) =>
//             nigeriaInstitutions[state].includes(institution),
//           );

//           setFilters((prev) => ({
//             ...prev,
//             state: userState || "",
//             school: institution,
//           }));
//         } else {
//           setShopState((prev) => ({
//             ...prev,
//             filteredShops: applyFilters(allShopsData, filters.category),
//             displayMode: "allShops",
//           }));
//         }

//         setUiState((prev) => ({
//           ...prev,
//           isInitialized: true,
//         }));
//       } catch (error) {
//         console.error("Error initializing data:", error);
//         setShopState((prev) => ({
//           ...prev,
//           filteredShops: applyFilters(allShopsData, filters.category),
//           displayMode: "allShops",
//         }));

//         setUiState((prev) => ({
//           ...prev,
//           isInitialized: true,
//         }));
//       }
//     };

//     if (allShopsData || !allShopsLoading) {
//       initializeData();
//     }
//   }, [
//     isAuthenticated,
//     institution,
//     allShopsData,
//     allShopsLoading,
//     filters.category,
//     applyFilters,
//     uiState.isInitialized,
//   ]);

//   useEffect(() => {
//     if (uiState.isInitialized && filters.category.toLowerCase() !== "other") {
//       const currentShops =
//         shopState.displayMode === "schoolShops"
//           ? shopState.schoolShops
//           : allShopsData;

//       setShopState((prev) => ({
//         ...prev,
//         filteredShops: applyFilters(currentShops, filters.category),
//       }));

//       setUiState((prev) => ({
//         ...prev,
//         currentPage: 1,
//       }));
//     }
//   }, [
//     filters.category,
//     uiState.isInitialized,
//     shopState.displayMode,
//     shopState.schoolShops,
//     allShopsData,
//     applyFilters,
//   ]);

//   const requestInstitutionSwitch = useCallback(() => {
//     if (isAuthenticated && institution && uiState.isLockedToInstitution) {
//       Swal.fire({
//         title: "Looking for shops elsewhere?",
//         text: `You're currently browsing shops at ${institution}. Would you like to look at shops in other institutions?`,
//         icon: "question",
//         showCancelButton: true,
//         confirmButtonText: "Yes, show me other institutions",
//         cancelButtonText: "No, stay at my institution",
//         confirmButtonColor: "#eab308",
//         cancelButtonColor: "#374151",
//       }).then((result) => {
//         if (result.isConfirmed) {
//           setUiState((prev) => ({
//             ...prev,
//             isLockedToInstitution: false,
//           }));

//           setFilters((prev) => ({
//             ...prev,
//             state: "",
//             school: "",
//           }));

//           Swal.fire({
//             title: "Institution filter unlocked",
//             text: "You can now browse shops from any institution.",
//             icon: "success",
//             timer: 2000,
//             showConfirmButton: false,
//           });
//         }
//       });
//       return true;
//     }
//     return false;
//   }, [isAuthenticated, institution, uiState.isLockedToInstitution]);

//   const handleSchoolSubmit = useCallback(
//     async (e) => {
//       e?.preventDefault();

//       if (
//         isAuthenticated &&
//         institution &&
//         uiState.isLockedToInstitution &&
//         filters.school &&
//         filters.school !== institution
//       ) {
//         const switched = requestInstitutionSwitch();
//         if (switched) return;
//       }

//       if (filters.school) {
//         try {
//           await refetchSchoolShops();
//         } catch (error) {
//           console.error("Error fetching shops by school:", error);
//           setShopState((prev) => ({
//             ...prev,
//             schoolShops: [],
//             filteredShops: [],
//           }));
//         }
//       }
//     },
//     [
//       isAuthenticated,
//       institution,
//       uiState.isLockedToInstitution,
//       filters.school,
//       refetchSchoolShops,
//       requestInstitutionSwitch,
//     ],
//   );

//   const handleCategoryChange = useCallback(
//     (category) => {
//       setFilters((prev) => ({ ...prev, category }));

//       if (category.toLowerCase() === "other") {
//         if (shopState.displayMode === "schoolShops" && filters.school) {
//           navigate(
//             `/other-services?school=${encodeURIComponent(filters.school)}`,
//           );
//         } else {
//           navigate("/other-services");
//         }
//       }
//     },
//     [navigate, shopState.displayMode, filters.school],
//   );

//   const handleResetFilter = useCallback(() => {
//     if (isAuthenticated && institution && uiState.isLockedToInstitution) {
//       const switched = requestInstitutionSwitch();
//       if (switched) return;
//     }

//     setFilters((prev) => ({
//       ...prev,
//       state: "",
//       school: "",
//     }));

//     setShopState((prev) => ({
//       ...prev,
//       displayMode: "allShops",
//       schoolShops: [],
//       filteredShops: applyFilters(allShopsData, filters.category),
//     }));
//   }, [
//     isAuthenticated,
//     institution,
//     uiState.isLockedToInstitution,
//     filters.category,
//     allShopsData,
//     applyFilters,
//     requestInstitutionSwitch,
//   ]);

//   const handleStateChange = useCallback(
//     (e) => {
//       const newState = e.target.value;

//       if (isAuthenticated && institution && uiState.isLockedToInstitution) {
//         requestInstitutionSwitch();
//         return;
//       }

//       setFilters((prev) => ({ ...prev, state: newState, school: "" }));
//     },
//     [
//       isAuthenticated,
//       institution,
//       uiState.isLockedToInstitution,
//       requestInstitutionSwitch,
//     ],
//   );

//   const handleSchoolChange = useCallback(
//     (e) => {
//       const newSchool = e.target.value;

//       if (
//         isAuthenticated &&
//         institution &&
//         uiState.isLockedToInstitution &&
//         newSchool !== institution
//       ) {
//         requestInstitutionSwitch();
//         return;
//       }

//       setFilters((prev) => ({ ...prev, school: newSchool }));
//     },
//     [
//       isAuthenticated,
//       institution,
//       uiState.isLockedToInstitution,
//       requestInstitutionSwitch,
//     ],
//   );

//   const toggleFilters = useCallback(() => {
//     setUiState((prev) => ({ ...prev, showFilters: !prev.showFilters }));
//   }, []);

//   const paginate = useCallback((pageNumber) => {
//     setUiState((prev) => ({ ...prev, currentPage: pageNumber }));
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   }, []);

//   const isLoading = allShopsLoading || (filters.school && schoolShopsLoading);
//   const hasError = allShopsError || schoolShopsError;

//   return (
//     <main className="min-h-screen bg-white">
//       <SEO
//         title="Home - Stumart | Campus Marketplace"
//         description="StuMart - Your Campus Marketplace. Connect with student vendors, enjoy fast delivery, and access campus-specific products. Shop smart with secure payments, real-time chat, and reliable campus delivery services. Join the leading student e-commerce platform today!"
//         keywords="campus marketplace, student e-commerce, university shopping, campus delivery, student vendors, campus business, student marketplace, university E-commerce, campus food delivery, student services, campus shopping, university marketplace, student business platform, campus delivery service, student entrepreneurship"
//         url="/"
//       />

//       {/* Hero Section */}
//       <section className="mt-8">
//         <Hero />
//       </section>

//       {/* Categories Section */}
//       <section className="py-16  px-4 lg:px-0 max-w-7xl mx-auto bg-white">
//         <div className="mb-10">
//           <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
//             Shop By <span className="text-yellow-500">Category</span>
//           </h2>
//           <div className="h-1 w-24 bg-yellow-500 rounded-full"></div>
//         </div>

//         <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
//           {categories.map((category) => (
//             <CategoryCard
//               key={category.id}
//               category={category}
//               isActive={filters.category === category.name.toLowerCase()}
//               onClick={handleCategoryChange}
//             />
//           ))}
//         </div>
//       </section>

//       {/* Filter Section */}
//       <section className="max-w-7xl mx-auto px-4 lg:px-0">
//         <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
//           {/* Filter Header */}
//           <div className="flex items-center justify-between p-6 border-b border-gray-200">
//             <h2 className="text-xl md:text-3xl font-bold text-gray-900">
//               {getTitle()}
//             </h2>
//             <button
//               onClick={toggleFilters}
//               className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-yellow-500 text-gray-700 hover:text-black rounded-lg transition-all duration-300 font-medium"
//             >
//               {uiState.showFilters ? <FaTimes /> : <FaFilter />}
//               <span className="hidden sm:inline">
//                 {uiState.showFilters ? "Hide Filter" : "Filter by school"}
//               </span>
//             </button>
//           </div>

//           {/* Advanced Filters */}
//           {uiState.showFilters && (
//             <div className="p-6 bg-gray-50">
//               <form onSubmit={handleSchoolSubmit}>
//                 <div className="grid md:grid-cols-2 gap-6 mb-6">
//                   {/* State Select */}
//                   <div className="space-y-2">
//                     <label
//                       htmlFor="state-select"
//                       className="block text-sm font-semibold text-gray-700"
//                     >
//                       State
//                     </label>
//                     <select
//                       id="state-select"
//                       value={filters.state}
//                       onChange={handleStateChange}
//                       disabled={
//                         isAuthenticated &&
//                         institution &&
//                         uiState.isLockedToInstitution
//                       }
//                       className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//                     >
//                       <option value="">-- Select State --</option>
//                       {states.map((state) => (
//                         <option key={state} value={state}>
//                           {state.replace("_", " ")}
//                         </option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Institution Select */}
//                   <div className="space-y-2">
//                     <label
//                       htmlFor="school-select"
//                       className="block text-sm font-semibold text-gray-700"
//                     >
//                       Institution
//                     </label>
//                     <select
//                       id="school-select"
//                       value={filters.school}
//                       onChange={handleSchoolChange}
//                       disabled={
//                         (isAuthenticated &&
//                           institution &&
//                           uiState.isLockedToInstitution) ||
//                         !filters.state
//                       }
//                       className="w-full px-4 py-3 bg-white border border-gray-300 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all"
//                     >
//                       <option value="">-- Select School --</option>
//                       {availableSchools.map((school, index) => (
//                         <option key={index} value={school}>
//                           {school}
//                         </option>
//                       ))}
//                     </select>
//                   </div>
//                 </div>

//                 {/* Filter Buttons */}
//                 <div className="flex flex-wrap gap-3">
//                   {filters.school && (
//                     <button
//                       type="button"
//                       onClick={handleSchoolSubmit}
//                       className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-lg transition-colors duration-300"
//                     >
//                       View Shops
//                     </button>
//                   )}

//                   {(filters.state || filters.school) && (
//                     <button
//                       type="button"
//                       onClick={handleResetFilter}
//                       className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors duration-300"
//                     >
//                       Reset Filters
//                     </button>
//                   )}
//                 </div>
//               </form>
//             </div>
//           )}
//         </div>
//       </section>

//       {/* Shops Grid Section */}
//       <section className="py-12 max-w-7xl mx-auto px-4 lg:px-0">
//         {isLoading && !uiState.isInitialized ? (
//           <div className="flex items-center justify-center py-20">
//             <Spinner />
//           </div>
//         ) : hasError ? (
//           <div className="text-center py-20">
//             <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
//               <FaStore className="text-4xl text-gray-400" />
//             </div>
//             <p className="text-xl text-gray-600">
//               No Verified shops found in the selected school.
//             </p>
//           </div>
//         ) : shopState.filteredShops && shopState.filteredShops.length > 0 ? (
//           <>
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
//               {currentShops.map((shop) => (
//                 <ShopCard key={shop.id} shop={shop} />
//               ))}
//             </div>

//             {/* Pagination */}
//             {totalPages > 1 && (
//               <div className="flex items-center justify-center gap-2 mt-12">
//                 <button
//                   onClick={() => paginate(uiState.currentPage - 1)}
//                   disabled={uiState.currentPage === 1}
//                   className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-yellow-500 hover:text-black hover:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
//                 >
//                   Prev
//                 </button>

//                 <div className="flex items-center gap-2">
//                   {Array.from({ length: totalPages }, (_, i) => i + 1)
//                     .filter((num) => {
//                       return (
//                         num === 1 ||
//                         num === totalPages ||
//                         Math.abs(num - uiState.currentPage) <= 1
//                       );
//                     })
//                     .map((number, index, array) => (
//                       <React.Fragment key={number}>
//                         {index > 0 && array[index - 1] !== number - 1 && (
//                           <span className="text-gray-400 px-2">...</span>
//                         )}
//                         <button
//                           onClick={() => paginate(number)}
//                           className={`
//                             px-4 py-2 rounded-lg font-medium transition-all duration-300
//                             ${
//                               uiState.currentPage === number
//                                 ? "bg-yellow-500 text-black scale-110 shadow-lg shadow-yellow-500/30"
//                                 : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
//                             }
//                           `}
//                         >
//                           {number}
//                         </button>
//                       </React.Fragment>
//                     ))}
//                 </div>

//                 <button
//                   onClick={() => paginate(uiState.currentPage + 1)}
//                   disabled={uiState.currentPage === totalPages}
//                   className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-yellow-500 hover:text-black hover:border-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-medium"
//                 >
//                   Next
//                 </button>
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="text-center py-20">
//             <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
//               <FaStore className="text-5xl text-gray-400" />
//             </div>
//             <p className="text-2xl text-gray-700 mb-6">
//               {getNoResultsMessage()}
//             </p>
//             {(filters.state ||
//               filters.school ||
//               filters.category !== "all") && (
//               <button
//                 onClick={handleResetFilter}
//                 className="px-8 py-4 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors duration-300"
//               >
//                 Switch Institution
//               </button>
//             )}
//           </div>
//         )}
//       </section>
//     </main>
//   );
// });

// export default Home;
