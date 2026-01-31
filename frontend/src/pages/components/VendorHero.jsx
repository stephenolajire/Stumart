import React from "react";

const VendorHeroSection = ({ category }) => {
  // Category-specific hero configurations
  const categoryHeroes = {
    Food: {
      image:
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=400&fit=crop",
      title: "Delicious Food Delivered",
      subtitle: "Discover amazing food vendors on campus",
      gradient: "from-orange-500/90 to-red-600/90",
    },
    Fashion: {
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop",
      title: "Campus Fashion Trends",
      subtitle: "Find the latest styles from student vendors",
      gradient: "from-pink-500/90 to-purple-600/90",
    },
    Technology: {
      image:
        "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200&h=400&fit=crop",
      title: "Tech Solutions",
      subtitle: "Get the best tech products and services",
      gradient: "from-blue-500/90 to-indigo-600/90",
    },
    Accessories: {
      image:
        "https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=1200&h=400&fit=crop",
      title: "Stylish Accessories",
      subtitle: "Complete your look with unique accessories",
      gradient: "from-yellow-500/90 to-orange-600/90",
    },
    Home: {
      image:
        "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=1200&h=400&fit=crop",
      title: "Home Essentials",
      subtitle: "Everything you need for your space",
      gradient: "from-green-500/90 to-teal-600/90",
    },
    Books: {
      image:
        "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=1200&h=400&fit=crop",
      title: "Academic Resources",
      subtitle: "Find textbooks and study materials",
      gradient: "from-indigo-500/90 to-blue-600/90",
    },
    Electronics: {
      image:
        "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=400&fit=crop",
      title: "Latest Electronics",
      subtitle: "Shop for gadgets and devices",
      gradient: "from-cyan-500/90 to-blue-600/90",
    },
    Others: {
      image:
        "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1200&h=400&fit=crop",
      title: "Explore More",
      subtitle: "Discover unique products and services",
      gradient: "from-purple-500/90 to-pink-600/90",
    },
  };

  const hero = categoryHeroes[category] || categoryHeroes.Others;

  return (
    <div className="relative h-78 sm:h-90 md:h-120 w-full overflow-hidden mt-38 lg:mt-30">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
        style={{
          backgroundImage: `url(${hero.image})`,
          backgroundSize: "contain",
        }}
      />

      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 w-full h-auto lg:h-150 pt-37 lg:pt-0 lg:pb-2 pb-5 bg-linear-to-r from-[#713a1f] via-yellow[#753a1d] to-[#713a1f] overflow-hidden`}
      />

      {/* Decorative Pattern Overlay */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 flex flex-col justify-center items-center text-center">
        <div className="animate-fade-in">
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-4 
                         drop-shadow-lg"
          >
            {hero.title}
          </h1>
          <p
            className="text-lg sm:text-xl md:text-2xl text-white/90 mb-6 
                        drop-shadow-md max-w-2xl"
          >
            {hero.subtitle}
          </p>

          {/* Category Badge */}
          <div
            className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 
                          backdrop-blur-sm border-2 border-white/30 rounded-full"
          >
            <svg
              className="w-5 h-5 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-white font-semibold">
              {category} Category
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Wave Decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="var(--color-background)"
            className="transition-colors duration-300"
          />
        </svg>
      </div>
    </div>
  );
};

export default VendorHeroSection;
