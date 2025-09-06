import { useContext, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import AOS from "aos";
import "aos/dist/aos.css";

const About = () => {
  const { isAuthenticated } = useContext(GlobalContext);
  const teamwork =
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop";
  const delivery =
    "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=400&h=300&fit=crop";
  const campus =
    "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop";

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
      easing: "ease-in-out",
      offset: 100,
    });
  }, []);

  return (
    <div className="bg-white hide-scrollbar w-full overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>

        <div
          className="relative z-10 text-center max-w-4xl mx-auto px-6"
          data-aos="fade-up"
        >
          <h1
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white to-amber-100 bg-clip-text text-transparent"
            data-aos="zoom-in"
            data-aos-delay="200"
          >
            About StuMart
          </h1>
          <p
            className="text-2xl md:text-3xl font-light mb-8 text-amber-100"
            data-aos="fade-up"
            data-aos-delay="400"
          >
            Connecting Campus Communities Through Commerce
          </p>
          <div
            className="w-32 h-1 bg-white mx-auto rounded-full"
            data-aos="fade-up"
            data-aos-delay="600"
          ></div>
        </div>

        {/* Floating Elements */}
        <div
          className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"
          data-aos="fade-right"
          data-aos-delay="800"
        ></div>
        <div
          className="absolute bottom-20 right-10 w-32 h-32 bg-white/10 rounded-full animate-pulse"
          data-aos="fade-left"
          data-aos-delay="1000"
        ></div>
        <div
          className="absolute top-1/2 left-20 w-16 h-16 bg-white/10 rounded-full animate-pulse"
          data-aos="fade-down"
          data-aos-delay="1200"
        ></div>
      </section>

      {/* Mission Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-amber-50">
        <div className="w-full mx-auto px-6 text-center">
          <div
            className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-100"
            data-aos="fade-up"
          >
            <div
              className="w-16 h-16 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-8"
              data-aos="flip-up"
              data-aos-delay="200"
            >
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h2
              className="text-4xl font-bold text-gray-900 mb-6"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              Our Mission
            </h2>
            <p
              className="text-xl leading-relaxed text-gray-700 max-w-4xl mx-auto"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              StuMart is dedicated to revolutionizing campus commerce by
              creating a seamless marketplace that connects students, local
              vendors, and delivery partners. We aim to make student life easier
              through accessible, affordable, and efficient shopping solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose StuMart Section */}
      <section className="py-20 bg-white">
        <div className="w-full mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Why Choose StuMart?
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div
              className="group bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 border border-blue-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              data-aos="fade-right"
              data-aos-delay="200"
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src={campus}
                  alt="Campus Community"
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-600/50 to-transparent"></div>
              </div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Campus-Focused
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Built specifically for university communities, understanding the
                unique needs and challenges of student life.
              </p>
            </div>

            <div
              className="group bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 border border-green-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src={teamwork}
                  alt="Student Opportunities"
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-green-600/50 to-transparent"></div>
              </div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Student Opportunities
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Creating job opportunities for students through our delivery
                partner program and vendor platform.
              </p>
            </div>

            <div
              className="group bg-gradient-to-br from-amber-50 to-yellow-50 rounded-3xl p-8 border border-amber-100 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
              data-aos="fade-left"
              data-aos-delay="600"
            >
              <div className="relative overflow-hidden rounded-2xl mb-6">
                <img
                  src={delivery}
                  alt="Quick Delivery"
                  className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-600/50 to-transparent"></div>
              </div>
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-amber-500 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-900">
                  Quick Delivery
                </h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                Fast, reliable delivery service powered by fellow students who
                know the campus inside out.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-amber-50">
        <div className="w-full mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting your campus essentials delivered is simple and
              straightforward
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-amber-500 to-orange-500 mx-auto rounded-full mt-4"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div
              className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center group hover:shadow-2xl transition-all duration-500"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
              </div>
              <div className="mt-8">
                <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-amber-200 transition-colors duration-300">
                  <svg
                    className="w-8 h-8 text-amber-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Browse & Order
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Explore products from various campus vendors and place your
                  order with just a few clicks.
                </p>
              </div>
            </div>

            <div
              className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center group hover:shadow-2xl transition-all duration-500"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
              </div>
              <div className="mt-8">
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-green-200 transition-colors duration-300">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Student Picker
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  A fellow student picker accepts your order and coordinates
                  with the vendor.
                </p>
              </div>
            </div>

            <div
              className="relative bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center group hover:shadow-2xl transition-all duration-500"
              data-aos="fade-up"
              data-aos-delay="600"
            >
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
              </div>
              <div className="mt-8">
                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors duration-300">
                  <svg
                    className="w-8 h-8 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Swift Delivery
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  Receive your order quickly at your hostel or preferred campus
                  location.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Impact Section */}
      <section className="py-20 bg-gradient-to-r from-amber-500 to-orange-500">
        <div className="w-full mx-auto px-6">
          <div className="text-center mb-12" data-aos="fade-up">
            <h2 className="text-4xl font-bold text-white mb-4">Our Impact</h2>
            <p className="text-xl text-amber-100">
              Numbers that tell our story
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div
              className="text-center group"
              data-aos="flip-left"
              data-aos-delay="200"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-amber-100 transition-colors">
                  1000+
                </h3>
                <p className="text-amber-100 text-lg font-medium">
                  Active Users
                </p>
              </div>
            </div>
            <div
              className="text-center group"
              data-aos="flip-left"
              data-aos-delay="400"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-amber-100 transition-colors">
                  50+
                </h3>
                <p className="text-amber-100 text-lg font-medium">
                  Campus Vendors
                </p>
              </div>
            </div>
            <div
              className="text-center group"
              data-aos="flip-left"
              data-aos-delay="600"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-amber-100 transition-colors">
                  100+
                </h3>
                <p className="text-amber-100 text-lg font-medium">
                  Student Pickers
                </p>
              </div>
            </div>
            <div
              className="text-center group"
              data-aos="flip-left"
              data-aos-delay="800"
            >
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/30 transition-all duration-300 transform hover:scale-105">
                <h3 className="text-4xl md:text-5xl font-bold text-white mb-2 group-hover:text-amber-100 transition-colors">
                  5000+
                </h3>
                <p className="text-amber-100 text-lg font-medium">
                  Deliveries Made
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="w-full mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Values
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                color: "amber",
                title: "Speed",
                description:
                  "Fast delivery times that fit your busy student schedule",
              },
              {
                icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                color: "green",
                title: "Reliability",
                description:
                  "Consistent service you can count on for all your campus needs",
              },
              {
                icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                color: "blue",
                title: "Community",
                description:
                  "Building stronger campus communities through commerce",
              },
              {
                icon: "M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1",
                color: "purple",
                title: "Affordability",
                description:
                  "Student-friendly pricing that won't break your budget",
              },
              {
                icon: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
                color: "red",
                title: "Care",
                description:
                  "We genuinely care about improving student life and campus experience",
              },
              {
                icon: "M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z",
                color: "indigo",
                title: "Innovation",
                description:
                  "Continuously improving our platform with cutting-edge technology",
              },
            ].map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                data-aos="zoom-in"
                data-aos-delay={index * 100}
              >
                <div
                  className={`w-12 h-12 bg-${value.color}-100 rounded-xl flex items-center justify-center mb-6`}
                >
                  <svg
                    className={`w-6 h-6 text-${value.color}-600`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={value.icon}
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">
                  {value.title}
                </h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Built for Students Section */}
      <section className="py-20 bg-white">
        <div className="w-full mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div data-aos="fade-right">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Built for Students, By Students
              </h2>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                We understand the unique challenges of campus life. That's why
                StuMart was designed from the ground up to serve the specific
                needs of university communities across Nigeria.
              </p>

              <div className="space-y-4">
                {[
                  "Student-friendly pricing",
                  "Campus-only delivery zones",
                  "24/7 customer support",
                  "Secure payment options",
                  "Real-time order tracking",
                ].map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3"
                    data-aos="fade-right"
                    data-aos-delay={index * 100}
                  >
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative" data-aos="fade-left">
              <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-3xl transform rotate-3"></div>
              <div className="relative bg-white rounded-3xl p-8 shadow-2xl border border-gray-100">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    {
                      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m3 5.197H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z",
                      gradient: "from-amber-500 to-orange-500",
                      title: "Student-Centric",
                      description: "Every decision prioritizes student needs",
                    },
                    {
                      icon: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                      gradient: "from-green-500 to-emerald-500",
                      title: "Local Impact",
                      description: "Supporting local campus businesses",
                    },
                    {
                      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                      gradient: "from-blue-500 to-purple-500",
                      title: "Trust & Safety",
                      description: "Verified students and secure transactions",
                    },
                    {
                      icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6",
                      gradient: "from-pink-500 to-rose-500",
                      title: "Growth",
                      description: "Expanding opportunities for everyone",
                    },
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="text-center"
                      data-aos="zoom-in"
                      data-aos-delay={index * 150}
                    >
                      <div
                        className={`w-16 h-16 bg-gradient-to-r ${item.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4`}
                      >
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d={item.icon}
                          ></path>
                        </svg>
                      </div>
                      <h4 className="font-bold text-gray-900 mb-2">
                        {item.title}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Meet Our Community Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="w-full mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Meet Our Community
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              The people who make StuMart possible
            </p>
            <div className="w-24 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mt-4"></div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
                gradient: "from-amber-500 to-orange-500",
                title: "Students",
                description:
                  "The heart of our platform - ordering, picking up, and delivering with ease.",
                cta: "Join as Customer",
              },
              {
                icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
                gradient: "from-green-500 to-emerald-500",
                title: "Vendors",
                description:
                  "Local businesses expanding their reach to campus communities.",
                cta: "Become a Vendor",
              },
              {
                icon: "M13 10V3L4 14h7v7l9-11h-7z",
                gradient: "from-blue-500 to-purple-500",
                title: "Delivery Partners",
                description:
                  "Student entrepreneurs earning while serving their campus community.",
                cta: "Become a Picker",
              },
            ].map((community, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center group hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2"
                data-aos="fade-up"
                data-aos-delay={index * 200}
              >
                <div
                  className={`w-20 h-20 bg-gradient-to-r ${community.gradient} rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d={community.icon}
                    ></path>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  {community.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                  {community.description}
                </p>
                <div className="text-sm text-amber-600 font-semibold">
                  {community.cta}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 bg-gradient-to-r from-gray-900 via-purple-900 to-violet-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20"></div>
        <div className="absolute inset-0 opacity-5">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="dots"
                x="0"
                y="0"
                width="60"
                height="60"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="7" cy="7" r="2" fill="white" />
                <circle cx="30" cy="7" r="2" fill="white" />
                <circle cx="53" cy="7" r="2" fill="white" />
                <circle cx="7" cy="30" r="2" fill="white" />
                <circle cx="30" cy="30" r="2" fill="white" />
                <circle cx="53" cy="30" r="2" fill="white" />
                <circle cx="7" cy="53" r="2" fill="white" />
                <circle cx="30" cy="53" r="2" fill="white" />
                <circle cx="53" cy="53" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dots)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <div
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-12 border border-white/20 shadow-2xl"
            data-aos="zoom-in"
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              Join the Campus Revolution
            </h2>
            <p
              className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto leading-relaxed"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              Whether you're a student, vendor, or potential delivery partner,
              be part of our growing community.
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              data-aos="fade-up"
              data-aos-delay="600"
            >
              {isAuthenticated ? (
                <Link to="/products">
                  <button className="group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-amber-200 focus:outline-none">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">Get Started</span>
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        ></path>
                      </svg>
                    </div>
                  </button>
                </Link>
              ) : (
                <Link to="/register">
                  <button className="group bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold py-4 px-8 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 focus:ring-4 focus:ring-amber-200 focus:outline-none">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">Get Started</span>
                      <svg
                        className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        ></path>
                      </svg>
                    </div>
                  </button>
                </Link>
              )}

              <button className="group bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-semibold py-4 px-8 rounded-2xl border border-white/30 hover:border-white/50 transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center space-x-2">
                  <span className="text-lg">Learn More</span>
                  <svg
                    className="w-5 h-5 group-hover:rotate-45 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Floating Elements */}
        <div
          className="absolute top-20 left-10 w-20 h-20 bg-white/10 rounded-full animate-bounce"
          data-aos="fade-right"
          data-aos-delay="800"
        ></div>
        <div
          className="absolute bottom-20 right-10 w-16 h-16 bg-amber-500/30 rounded-full animate-pulse"
          data-aos="fade-left"
          data-aos-delay="1000"
        ></div>
        <div
          className="absolute top-1/2 right-20 w-24 h-24 bg-orange-500/20 rounded-full animate-pulse"
          data-aos="fade-down"
          data-aos-delay="1200"
        ></div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Frequently Asked Questions
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 mx-auto rounded-full"></div>
          </div>

          <div className="space-y-6">
            {[
              {
                color: "amber",
                question: "How do I become a delivery partner?",
                answer:
                  "Simply register on our platform, verify your student status, and complete our brief orientation. You can start earning by delivering orders to fellow students on your campus.",
              },
              {
                color: "green",
                question: "What are the delivery fees?",
                answer:
                  "Our delivery fees are designed to be student-friendly, typically ranging from ₦200-₦500 depending on distance and order size. We believe in transparent, affordable pricing.",
              },
              {
                color: "blue",
                question: "Which universities do you serve?",
                answer:
                  "We're currently active in major universities across Lagos and expanding rapidly to other states. Check our coverage area during registration to see if we serve your campus.",
              },
              {
                color: "purple",
                question: "How long does delivery take?",
                answer:
                  "Most campus deliveries are completed within 30-60 minutes, depending on vendor preparation time and campus location. You'll receive real-time updates throughout the process.",
              },
            ].map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300"
                data-aos="fade-up"
                data-aos-delay={index * 150}
              >
                <div className="flex items-start space-x-4">
                  <div
                    className={`w-8 h-8 bg-${faq.color}-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1`}
                  >
                    <span className={`text-${faq.color}-600 font-bold text-sm`}>
                      Q
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {faq.question}
                    </h3>
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
