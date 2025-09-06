import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const businessCategories = [
  {
    name: "Food",
    path: "/category/?category=Food",
    image:
      "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=40&h=40&fit=crop&crop=center",
    description: "Browse food items",
  },
  {
    name: "Fashion",
    path: "/category/?category=Fashion",
    image:
      "https://images.unsplash.com/photo-1445205170230-053b83016050?w=40&h=40&fit=crop&crop=center",
    description: "Browse fashion items",
  },
  {
    name: "Technology",
    path: "/category/?category=Technology",
    image:
      "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=40&h=40&fit=crop&crop=center",
    description: "Browse tech products",
  },
  {
    name: "Accessories",
    path: "/category/?category=Accessories",
    image:
      "https://images.unsplash.com/photo-1492707892479-7bc8d5a4ee93?w=40&h=40&fit=crop&crop=center",
    description: "Browse accessories",
  },
  {
    name: "Home",
    path: "/category/?category=Home",
    image:
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=40&h=40&fit=crop&crop=center",
    description: "Browse home items",
  },
  {
    name: "Books",
    path: "/category/?category=Books",
    image:
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=40&h=40&fit=crop&crop=center",
    description: "Browse books",
  },
  {
    name: "Electronics",
    path: "/category/?category=Electronics",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=40&h=40&fit=crop&crop=center",
    description: "Browse electronics",
  },
  {
    name: "Others",
    path: "/other-services",
    image:
      "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=40&h=40&fit=crop&crop=center",
    description: "Browse other services",
  },
];

const Sidebar = () => {
  const [activeCategory, setActiveCategory] = useState(null);
  const navigate = useNavigate();

  const handleNavigate = (category) => {
    navigate(category.path);
  };

  return (
    <div className="max-h-screen h-screen bg-gradient-to-b from-orange-50 to-orange-100 border-r border-orange-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white p-4 shadow-md">
        <h2 className="text-xl font-bold text-center">Categories</h2>
        <div className="w-12 h-1 bg-white/30 mx-auto mt-2 rounded-full"></div>
      </div>

      {/* Categories List */}
      <div className="flex flex-col h-full pb-20 overflow-y-auto hide-scrollbar">
        <div className="flex-1 py-4">
          {/* All Categories Item */}
          <Link to="/products">
            <div
              className={`group relative mx-3 my-2 rounded-xl transition-all duration-300 cursor-pointer
                ${
                  activeCategory === "All"
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transform scale-105"
                    : "bg-white hover:bg-orange-50 hover:shadow-md hover:transform hover:scale-102"
                }`}
              onClick={() =>
                setActiveCategory(activeCategory === "All" ? null : "All")
              }
            >
              <div className="flex items-center p-4 space-x-4">
                {/* Category Image */}
                <div
                  className={`relative overflow-hidden rounded-lg transition-all duration-300 
                    ${
                      activeCategory === "All"
                        ? "ring-2 ring-white/50"
                        : "ring-1 ring-orange-200"
                    }`}
                >
                  <img
                    src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=40&h=40&fit=crop&crop=center"
                    alt="All Categories"
                    className="w-12 h-12 object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg items-center justify-center text-white font-bold text-lg hidden">
                    A
                  </div>
                </div>

                {/* Category Name */}
                <div className="flex-1">
                  <h3
                    className={`font-semibold text-base transition-colors duration-300 
                      ${
                        activeCategory === "All"
                          ? "text-white"
                          : "text-gray-800 group-hover:text-orange-600"
                      }`}
                  >
                    All Categories
                  </h3>
                  <p
                    className={`text-sm transition-colors duration-300 
                      ${
                        activeCategory === "All"
                          ? "text-white/80"
                          : "text-gray-500"
                      }`}
                  >
                    Browse all products
                  </p>
                </div>

                {/* Arrow indicator */}
                <div
                  className={`transition-all duration-300 
                    ${
                      activeCategory === "All"
                        ? "text-white rotate-90"
                        : "text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1"
                    }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Active indicator line */}
              {activeCategory === "All" && (
                <div className="absolute left-0 top-0 w-1 h-full bg-white/30 rounded-r-full"></div>
              )}

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-300 pointer-events-none"></div>
            </div>
          </Link>

          {/* Dynamic Categories */}
          {businessCategories.map((category, index) => (
            <div
              key={category.name}
              className={`group relative mx-3 my-2 rounded-xl transition-all duration-300 cursor-pointer
                ${
                  activeCategory === category.name
                    ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg transform scale-105"
                    : "bg-white hover:bg-orange-50 hover:shadow-md hover:transform hover:scale-102"
                }`}
              onClick={() => {
                setActiveCategory(
                  activeCategory === category.name ? null : category.name
                );
                handleNavigate(category);
              }}
              style={{
                animationDelay: `${index * 50}ms`,
              }}
            >
              <div className="flex items-center p-4 space-x-4">
                {/* Category Image */}
                <div
                  className={`relative overflow-hidden rounded-lg transition-all duration-300 
                    ${
                      activeCategory === category.name
                        ? "ring-2 ring-white/50"
                        : "ring-1 ring-orange-200"
                    }
                  `}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-12 h-12 object-cover transition-transform duration-300 group-hover:scale-110"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  {/* Fallback div with gradient background */}
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-lg items-center justify-center text-white font-bold text-lg hidden">
                    {category.name.charAt(0)}
                  </div>
                </div>

                {/* Category Name */}
                <div className="flex-1">
                  <h3
                    className={`font-semibold text-base transition-colors duration-300 
                      ${
                        activeCategory === category.name
                          ? "text-white"
                          : "text-gray-800 group-hover:text-orange-600"
                      }
                    `}
                  >
                    {category.name}
                  </h3>
                  <p
                    className={`text-sm transition-colors duration-300 
                      ${
                        activeCategory === category.name
                          ? "text-white/80"
                          : "text-gray-500"
                      }
                    `}
                  >
                    {category.description}
                  </p>
                </div>

                {/* Arrow indicator */}
                <div
                  className={`transition-all duration-300 
                    ${
                      activeCategory === category.name
                        ? "text-white rotate-90"
                        : "text-gray-400 group-hover:text-orange-500 group-hover:translate-x-1"
                    }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>

              {/* Active indicator line */}
              {activeCategory === category.name && (
                <div className="absolute left-0 top-0 w-1 h-full bg-white/30 rounded-r-full"></div>
              )}

              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/0 to-amber-500/0 group-hover:from-orange-500/5 group-hover:to-amber-500/5 transition-all duration-300 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {/* Bottom decoration */}
        {/* <div className="px-4 pb-4">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl p-4 text-white text-center">
            <div className="text-sm font-medium mb-1">Explore More</div>
            <div className="text-xs opacity-90">Discover amazing deals</div>
            <div className="flex justify-center mt-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white/60 rounded-full animate-pulse"></div>
                <div
                  className="w-2 h-2 bg-white/40 rounded-full animate-pulse"
                  style={{ animationDelay: "0.2s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-white/60 rounded-full animate-pulse"
                  style={{ animationDelay: "0.4s" }}
                ></div>
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default Sidebar;
