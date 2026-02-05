import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Star,
  ShoppingBag,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../../constant/api";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fetch food products using TanStack Query
  const {
    data: productData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["food-products"],
    queryFn: async () => {
      const response = await api.get("product-category/?category=Food");
      return response.data;
    },
    staleTime: 60 * 60 * 1000, // 60 minutes
    gcTime: 60 * 60 * 1000,
  });

  const products = productData?.results || [];

  useEffect(() => {
    if (products.length > 0) {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % products.length);
      }, 5000);

      return () => clearInterval(timer);
    }
  }, [products.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % products.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + products.length) % products.length);
  };

  const handleProductClick = (productId) => {
    // Navigate to product details page
    window.location.href = `/product/${productId}`;
    // Or if you're using React Router: navigate(`/product-details/${productId}`);
  };

  if (isLoading) {
    return (
      <div className="relative w-full h-auto lg:h-100 mt-31 lg:mt-0 pb-2 bg-linear-to-r from-primary-dark via-accent-dark to-primary-dark overflow-hidden">
        <div className="flex items-center justify-center h-96">
          <div className="text-text-inverse text-xl">Loading products...</div>
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className="relative w-full h-auto lg:h-100 mt-31 lg:mt-0 pb-2 bg-linear-to-r from-primary-dark via-accent-dark to-primary-dark overflow-hidden">
        <div className="flex items-center justify-center h-96">
          <div className="text-text-inverse text-xl">No products available</div>
        </div>
      </div>
    );
  }

  const currentProduct = products[currentSlide];

  return (
    <div className="relative w-full h-auto lg:h-150 pt-37 lg:pt-0 lg:pb-2 pb-5 bg-linear-to-r from-[#713a1f] via-yellow[#753a1d] to-[#713a1f] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-surface rounded-full"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-surface/20 rounded-radius-lg rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-surface/15 rounded-full"></div>
        <div className="absolute bottom-10 right-1/3 w-8 h-8 border-2 border-surface rounded-full"></div>
      </div>

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content - Desktop Only */}
            <div className="text-text-inverse z-10 hidden lg:block">
              <div className="mb-6">
                <div className="inline-block bg-surface/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4 mt-8 lg:mt-0">
                  <span className="text-sm font-medium">STUMART CAMPUS</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold my-4 leading-tight">
                  Shop Smart on
                  <span className="block text-primary-light">Your Campus</span>
                </h1>
                <p className="text-lg text-text-inverse/90 mb-6">
                  Connect with students, buy and sell everything you need for
                  university life
                </p>
              </div>

              {/* Current Product Info - Desktop */}
              <div className="bg-surface/15 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="bg-surface/20 rounded-full p-2">
                    <ShoppingBag className="w-5 h-5 text-text-inverse" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{currentProduct.name}</h3>
                    <p className="text-sm text-text-inverse/80">
                      {currentProduct.vendor_name}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-primary-light" />
                    <span>{currentProduct.vendor_rating} Rating</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-primary-light" />
                    <span>
                      ₦{parseInt(currentProduct.price).toLocaleString()}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-text-inverse/70 mt-2 line-clamp-2">
                  {currentProduct.description}
                </p>
              </div>

              {/* CTA Button */}
              {/* <div className="flex space-x-4">
                <button
                  onClick={() => handleProductClick(currentProduct.id)}
                  className="bg-surface text-primary px-8 py-3 rounded-radius-xl font-semibold hover:bg-surface-hover transition-colors duration-300 shadow-lg"
                >
                  VIEW PRODUCT
                </button>
                <button className="border-2 border-surface text-text-inverse px-8 py-3 rounded-radius-xl font-semibold hover:bg-surface hover:text-primary transition-all duration-300">
                  BROWSE MORE
                </button>
              </div> */}
            </div>

            {/* Right Content - Product Image */}
            <div className="relative">
              <div
                className="relative w-full h-80 lg:h-106 rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
                onClick={() => handleProductClick(currentProduct.id)}
              >
                <img
                  src={currentProduct.image_url}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent"></div>

                {/* Mobile Content - Only show on small screens */}

                <div className="absolute bottom-4 left-0 right-0 flex justify-center lg:hidden">
                  <div className="bg-surface/95 backdrop-blur-sm rounded-xl p-1 mx-2 w-full flex flex-col ">
                    <h3 className="text-text-primary text-center font-bold text-base mb-1 line-clamp-1">
                      {currentProduct.name}
                    </h3>
                    {/* <p className="text-text-secondary text-xs mb-2 text-center">
                      {currentProduct.vendor_institution}
                      </p> */}
                    <div className="flex items-center justify-between px-4">
                      <p className="text-text-secondary text-xs text-center">
                        {currentProduct.vendor_name}
                      </p>
                      <span className="text-primary font-bold text-base whitespace-nowrap">
                        ₦{parseInt(currentProduct.price).toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-current" />
                        <span className="text-text-secondary text-xs">
                          {currentProduct.vendor_rating}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop Content - Show vendor info */}
                <div className="absolute bottom-6 left-6 right-6 hidden lg:block">
                  <div className="bg-surface/90 backdrop-blur-sm rounded-2xl p-4">
                    <h3 className="text-text-primary font-bold text-lg">
                      {currentProduct.name}
                    </h3>
                    <p className="text-text-secondary text-sm mb-2">
                      by {currentProduct.vendor_name}
                    </p>
                    <p className="text-text-secondary text-sm mb-2 font-medium">
                      {currentProduct.vendor_institution}
                    </p>
                    <div className="flex items-center justify-between text-sm text-text-tertiary">
                      <span className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-primary fill-current" />
                        <span>{currentProduct.vendor_rating} rating</span>
                      </span>
                      <span className="text-primary font-bold text-lg">
                        ₦{parseInt(currentProduct.price).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-text-tertiary mt-1">
                      Delivery: {currentProduct.delivery_day}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevSlide();
                }}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-surface/20 backdrop-blur-sm text-text-inverse p-2 rounded-full hover:bg-surface/30 transition-colors duration-300 z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextSlide();
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-surface/20 backdrop-blur-sm text-text-inverse p-2 rounded-full hover:bg-surface/30 transition-colors duration-300 z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
