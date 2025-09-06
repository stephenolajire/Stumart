import { useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  FaBicycle,
  FaMoneyBillWave,
  FaClock,
  FaRoute,
  FaUserGraduate,
  FaShieldAlt,
  FaMapMarkedAlt,
} from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";
import SEO from "../components/Metadata";

const Rider = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 mt-31 md:mt-0">
      <SEO
        title="Become a Campus Picker - StuMart | Campus Marketplace"
        description="Join StuMart as a campus picker and earn ₦300-500 per delivery with flexible hours that fit your student schedule. Deliver to fellow students while studying. Apply now!"
        keywords="campus picker, student delivery job, part time job for students, campus delivery, student picker, earn money while studying, flexible student job, delivery partner, student income, campus earnings, university delivery, student work, Nigeria student jobs, campus marketplace delivery, student entrepreneurship, delivery service jobs, student side hustle, campus work opportunity, university part time job, student delivery partner"
        url="/rider"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white py-20 px-4 ">
        <div className="w-full mx-auto text-center" data-aos="fade-up">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Become a Campus Picker
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-amber-100 max-w-3xl mx-auto">
            Earn money by delivering to fellow students while maintaining
            flexibility with your studies
          </p>
          <NavLink
            to="/register"
            className="inline-block bg-white text-amber-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-amber-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Join as Picker
          </NavLink>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16"
            data-aos="fade-up"
          >
            Why Become a Picker?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaClock className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Flexible Hours
              </h3>
              <p className="text-gray-600">
                Choose your own schedule that fits around your classes
              </p>
            </div>
            <div
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaMoneyBillWave className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Quick Earnings
              </h3>
              <p className="text-gray-600">
                Get paid weekly with competitive delivery rates plus tips
              </p>
            </div>
            <div
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUserGraduate className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Student-Friendly
              </h3>
              <p className="text-gray-600">
                Perfect part-time work for students with minimal time commitment
              </p>
            </div>
            <div
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 text-center"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaMapMarkedAlt className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Campus Territory
              </h3>
              <p className="text-gray-600">
                Operate within familiar campus environment and nearby areas
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2
            className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16"
            data-aos="fade-up"
          >
            How It Works
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div
              className="text-center relative"
              data-aos="fade-right"
              data-aos-delay="100"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">Sign Up</h3>
              <p className="text-gray-600">
                Register as a picker and complete verification
              </p>
            </div>
            <div
              className="text-center relative"
              data-aos="fade-right"
              data-aos-delay="200"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Choose Schedule
              </h3>
              <p className="text-gray-600">
                Set your available hours and preferred delivery zones
              </p>
            </div>
            <div
              className="text-center relative"
              data-aos="fade-right"
              data-aos-delay="300"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Accept Orders
              </h3>
              <p className="text-gray-600">
                Receive delivery requests through the app
              </p>
            </div>
            <div
              className="text-center relative"
              data-aos="fade-right"
              data-aos-delay="400"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-4">
                Deliver & Earn
              </h3>
              <p className="text-gray-600">
                Complete deliveries and earn money
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="bg-gray-50 py-20 px-4" data-aos="fade-up">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">
            Requirements
          </h2>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaUserGraduate className="text-2xl text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    Status
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Must be an enrolled student with valid student ID or a staff
                    of the school
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <FaShieldAlt className="text-2xl text-amber-600" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 mb-3">
                    Documentation
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    Valid ID and proof of student status
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Earnings Section */}
      <section className="bg-white py-20 px-4" data-aos="fade-up">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">
            Earning Potential
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-lg font-semibold mb-4 text-amber-100">
                Base Rate
              </h3>
              <p className="text-4xl font-bold mb-2">₦300-500</p>
              <span className="text-amber-100">Per delivery</span>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-lg font-semibold mb-4 text-green-100">
                Distance Bonus
              </h3>
              <p className="text-4xl font-bold mb-2">+₦100</p>
              <span className="text-green-100">Per extra kilometer</span>
            </div>
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-8 rounded-2xl text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <h3 className="text-lg font-semibold mb-4 text-purple-100">
                Peak Hours
              </h3>
              <p className="text-4xl font-bold mb-2">+50%</p>
              <span className="text-purple-100">Additional earnings</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4" data-aos="zoom-in">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-gray-800 mb-16">
            Common Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                What are the working hours?
              </h3>
              <p className="text-gray-600 leading-relaxed pl-5">
                You can choose your own hours and work as little or as much as
                you want, with peak hours during lunch and dinner times.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                How do I get paid?
              </h3>
              <p className="text-gray-600 leading-relaxed pl-5">
                Earnings are transferred to your bank account weekly, including
                base pay, bonuses, and tips.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-3"></span>
                What support do I get?
              </h3>
              <p className="text-gray-600 leading-relaxed pl-5">
                We provide onboarding training, delivery bag, and 24/7 support
                through the app.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white py-20 px-4"
        data-aos="zoom-in"
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Earning Today
          </h2>
          <p className="text-xl md:text-2xl mb-8 text-amber-100 max-w-2xl mx-auto">
            Join our network of student pickers and earn while you study
          </p>
          <Link
            to="/register"
            className="inline-block bg-white text-amber-600 px-10 py-4 rounded-full font-bold text-xl hover:bg-amber-50 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Rider;
