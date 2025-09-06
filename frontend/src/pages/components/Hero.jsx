import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Users,
  BookOpen,
} from "lucide-react";

const Hero = () => {
  const [currentSlide, setCurrentSlide] = useState(0);


  const universities = [
    {
      id: 1,
      name: "University of Lagos",
      shortName: "UNILAG",
      location: "Lagos State",
      image:
        "https://images.unsplash.com/photo-1562774053-701939374585?w=800&h=600&fit=crop&crop=center",
      students: "41,000+",
      description: "Leading institution in West Africa",
    },
    {
      id: 2,
      name: "University of Ibadan",
      shortName: "UI",
      location: "Oyo State",
      image:
        "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=800&h=600&fit=crop&crop=center",
      description: "Premier university in Nigeria",
    },
    {
      id: 3,
      name: "Ahmadu Bello University",
      shortName: "ABU",
      location: "Kaduna State",
      image:
        "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&h=600&fit=crop&crop=center",
      students: "35,000+",
      description: "Largest university in Nigeria",
    },
    {
      id: 4,
      name: "University of Nigeria",
      shortName: "UNN",
      location: "Enugu State",
      image:
        "https://images.unsplash.com/photo-1568792923760-d70635a89fdc?w=800&h=600&fit=crop&crop=center",
      students: "36,000+",
      description: "First indigenous university",
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % universities.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [universities.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % universities.length);
  };

  const prevSlide = () => {
    setCurrentSlide(
      (prev) => (prev - 1 + universities.length) % universities.length
    );
  };

  const currentUni = universities[currentSlide];

  return (
    <div className="relative w-full h-auto lg:h-100 mt-31 lg:mt-0 pb-2 bg-gradient-to-r from-[#713a1f] via-amber[#753a1d] to-[#713a1f] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-20 h-20 border-2 border-white rounded-full"></div>
        <div className="absolute top-20 right-20 w-16 h-16 bg-white/20 rounded-lg rotate-45"></div>
        <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white/15 rounded-full"></div>
        <div className="absolute bottom-10 right-1/3 w-8 h-8 border-2 border-white rounded-full"></div>
      </div>

      <div className="relative h-full flex items-center">
        <div className="container mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Content */}
            <div className="text-white z-10 ">
              <div className="mb-6">
                <div className="inline-block bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-4 mt-8 lg:mt-0">
                  <span className="text-sm font-medium">STUMART CAMPUS</span>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold my-4 leading-tight">
                  Shop Smart on
                  <span className="block text-yellow-200">Your Campus</span>
                </h1>
                <p className="text-lg text-white/90 mb-6 max-w-md">
                  Connect with students, buy and sell everything you need for
                  university life
                </p>
              </div>

              {/* Current University Info */}
              <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <div className="flex items-center space-x-4 mb-3">
                  <div className="bg-white/20 rounded-full p-2">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {currentUni.shortName}
                    </h3>
                    <p className="text-sm text-white/80">{currentUni.name}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-4 h-4 text-yellow-200" />
                    <span>{currentUni.location}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-yellow-200" />
                    <span>{currentUni.students} students</span>
                  </div>
                </div>

                <p className="text-xs text-white/70 mt-2">
                  {currentUni.description}
                </p>
              </div>

              {/* CTA Button */}
              <div className="flex space-x-4">
                <button className="bg-white text-orange-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors duration-300 shadow-lg">
                  SHOP NOW
                </button>
                <button className="border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white hover:text-orange-600 transition-all duration-300">
                  JOIN CAMPUS
                </button>
              </div>
            </div>

            {/* Right Content - University Image */}
            <div className="relative">
              <div className="relative w-full h-80 rounded-3xl overflow-hidden shadow-2xl">
                <img
                  src={currentUni.image}
                  alt={currentUni.name}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />

                {/* Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>

                {/* University Name Overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4">
                    <h3 className="text-gray-800 font-bold text-lg">
                      {currentUni.name}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {currentUni.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <MapPin className="w-3 h-3" />
                        <span>{currentUni.location}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{currentUni.students} students</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Arrows */}
              <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors duration-300"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 backdrop-blur-sm text-white p-2 rounded-full hover:bg-white/30 transition-colors duration-300"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {universities.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                index === currentSlide ? "bg-white" : "bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Hero;
