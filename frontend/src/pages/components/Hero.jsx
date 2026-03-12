import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Star, ShoppingBag } from "lucide-react";
import { useGetHeroProducts } from "../../hooks/useHome";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { data, isLoading, error } = useGetHeroProducts();
  const products = data?.results || [];

  useEffect(() => {
    if (products.length === 0) return;
    const timer = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % products.length),
      5000,
    );
    return () => clearInterval(timer);
  }, [products.length]);

  const prev = () =>
    setCurrentSlide((p) => (p - 1 + products.length) % products.length);
  const next = () => setCurrentSlide((p) => (p + 1) % products.length);

  const BG =
    "relative w-full h-auto lg:h-150 pt-37 lg:pt-0 lg:pb-2 pb-5 bg-linear-to-r from-[#713a1f] via-[#753a1d] to-[#713a1f] overflow-hidden";

  if (isLoading) {
    return (
      <div className={BG}>
        <div className="flex items-center justify-center h-96">
          <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || products.length === 0) {
    return (
      <div className={BG}>
        <div className="flex items-center justify-center h-96">
          <p className="text-white text-xl">No products available</p>
        </div>
      </div>
    );
  }

  const p = products[currentSlide];
  const rating = parseFloat(p.vendor_rating) || 3.0;

  return (
    <div className={BG}>
      {/* Background decorations */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-surface rounded-full" />
        <div className="absolute top-20 right-20 w-16 h-16 bg-surface/20 rounded-lg rotate-45" />
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-surface/15 rounded-full" />
        <div className="absolute bottom-10 right-1/3 w-8 h-8 border-2 border-surface rounded-full" />
      </div>

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left — desktop only */}
            <div className="text-white z-10 hidden lg:block">
              <div className="mb-6">
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
                  <span className="text-sm font-medium">STUMART CAMPUS</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold my-4 leading-tight">
                  Shop Smart on
                  <span className="block text-primary-light">Your Campus</span>
                </h1>
                <p className="text-lg text-white/90 mb-6">
                  Connect with students, buy and sell everything you need for
                  university life
                </p>
              </div>

              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{p.name}</h3>
                    <p className="text-sm text-white/80">{p.vendor_name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-primary-light" />
                    <span>{rating.toFixed(1)} Rating</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>₦{parseInt(p.price).toLocaleString()}</span>
                  </div>
                </div>

                <p className="text-xs text-white/70 mt-2 line-clamp-2">
                  {p.description}
                </p>
              </div>
            </div>

            {/* Right — image slider */}
            <div className="relative">
              <div
                className="relative w-full h-80 lg:h-106 rounded-3xl overflow-hidden shadow-2xl cursor-pointer"
                onClick={() => (window.location.href = `/product/${p.id}`)}
              >
                <img
                  src={p.image_url || "/placeholder-shop.jpg"}
                  alt={p.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                  onError={(e) => {
                    e.target.src = "/placeholder-shop.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                {/* Mobile overlay */}
                <div className="absolute bottom-4 left-0 right-0 flex justify-center lg:hidden">
                  <div className="bg-white/95 backdrop-blur-sm rounded-xl p-1 mx-2 w-full flex flex-col">
                    <h3 className="text-text-primary text-center font-bold text-base mb-1 line-clamp-1">
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between px-4">
                      <p className="text-text-secondary text-xs">
                        {p.vendor_name}
                      </p>
                      <span className="text-primary font-bold text-base whitespace-nowrap">
                        ₦{parseInt(p.price).toLocaleString()}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-current" />
                        <span className="text-text-secondary text-xs">
                          {rating.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desktop overlay */}
                <div className="absolute bottom-6 left-6 right-6 hidden lg:block">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4">
                    <h3 className="text-text-primary font-bold text-lg">
                      {p.name}
                    </h3>
                    <p className="text-text-secondary text-sm mb-1">
                      by {p.vendor_name}
                    </p>
                    <p className="text-text-secondary text-sm mb-2 font-medium">
                      {p.vendor_institution}
                    </p>
                    <div className="flex items-center justify-between text-sm text-text-tertiary">
                      <span className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-primary fill-current" />
                        <span>{rating.toFixed(1)} rating</span>
                      </span>
                      <span className="text-primary font-bold text-lg">
                        ₦{parseInt(p.price).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Nav buttons */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors z-10"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  next();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors z-10"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-3">
                {products.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentSlide(i)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      i === currentSlide ? "bg-white w-4" : "bg-white/40"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
