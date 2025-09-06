import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FaStore,
  FaMoneyBillWave,
  FaUsers,
  FaTruck,
  FaChartLine,
  FaShieldAlt,
} from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";
import SEO from "../components/Metadata";

const Vendors = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <SEO
        title="Become a StuMart Vendor - Sell to Students | Campus Marketplace"
        description="Join StuMart as a vendor and sell to thousands of students across campus. Free registration, 10% commission, 24-48hr payouts. Start your campus business today!"
        keywords="campus vendor, sell to students, student marketplace vendor, campus business, university marketplace, student market, campus selling, vendor registration, campus e-commerce, student business opportunity, sell on campus, campus store, university vendor, student marketplace, campus entrepreneur, sell to university students, campus retail, student customers, campus commerce, Nigeria campus business, campus food vendor, student fashion vendor, campus electronics, academic materials vendor, campus delivery business, student market access"
        url="/vendors"
      />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-amber-500 to-amber-600 text-white py-24">
        <div
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
          data-aos="fade-up"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Become a StuMart Vendor
          </h1>
          <p className="text-xl md:text-2xl text-amber-100 mb-10 max-w-3xl mx-auto">
            Expand your business reach across campus and connect with thousands
            of students
          </p>
          <NavLink
            to="/register"
            className="inline-block bg-white text-amber-600 font-bold py-4 px-8 rounded-full hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Start Selling Today
          </NavLink>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-4xl font-bold text-center text-gray-900 mb-16"
            data-aos="fade-up"
          >
            Why Sell on StuMart?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUsers className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Access Student Market
              </h3>
              <p className="text-gray-600">
                Connect directly with thousands of students on campus looking
                for your products
              </p>
            </div>
            <div
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaTruck className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Easy Delivery
              </h3>
              <p className="text-gray-600">
                Our network of student pickers handles all deliveries, so you
                can focus on your products
              </p>
            </div>
            <div
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaMoneyBillWave className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Quick Payments
              </h3>
              <p className="text-gray-600">
                Receive payments directly to your account within 24-48 hours
              </p>
            </div>
            <div
              className="bg-white rounded-2xl p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaChartLine className="text-2xl text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Business Growth
              </h3>
              <p className="text-gray-600">
                Access analytics and insights to help grow your campus business
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2
            className="text-4xl font-bold text-center text-gray-900 mb-16"
            data-aos="fade-up"
          >
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div
              className="text-center"
              data-aos="fade-right"
              data-aos-delay="100"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                1
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Register</h3>
              <p className="text-gray-600">
                Sign up as a vendor and complete your business profile
              </p>
            </div>
            <div
              className="text-center"
              data-aos="fade-right"
              data-aos-delay="200"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                2
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                List Products
              </h3>
              <p className="text-gray-600">
                Add your products with photos, descriptions, and prices
              </p>
            </div>
            <div
              className="text-center"
              data-aos="fade-right"
              data-aos-delay="300"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                3
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Receive Orders
              </h3>
              <p className="text-gray-600">
                Get notified instantly when students place orders
              </p>
            </div>
            <div
              className="text-center"
              data-aos="fade-right"
              data-aos-delay="400"
            >
              <div className="w-20 h-20 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-6 text-white text-2xl font-bold shadow-lg">
                4
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Fulfill & Earn
              </h3>
              <p className="text-gray-600">
                Prepare orders for pickup by our student pickers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Requirements Section */}
      <section className="py-20 bg-gray-50" data-aos="fade-up">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Requirements
          </h2>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg flex items-start space-x-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaStore className="text-xl text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Business Information
                </h3>
                <p className="text-gray-600">
                  Valid business name and registration details
                </p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg flex items-start space-x-6">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FaShieldAlt className="text-xl text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Verification
                </h3>
                <p className="text-gray-600">
                  Government-issued ID and proof of business ownership
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-white" data-aos="fade-up">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Pricing & Fees
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 text-center border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Registration Fee
              </h3>
              <p className="text-4xl font-bold text-green-600 mb-2">₦0</p>
              <span className="text-green-700 font-medium">Free to join</span>
            </div>
            <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-2xl p-8 text-center border-2 border-amber-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Commission Rate
              </h3>
              <p className="text-4xl font-bold text-amber-600 mb-2">10%</p>
              <span className="text-amber-700 font-medium">
                Per successful order
              </span>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 text-center border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Payout Timeline
              </h3>
              <p className="text-4xl font-bold text-blue-600 mb-2">24-48hrs</p>
              <span className="text-blue-700 font-medium">
                After order completion
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-gray-50" data-aos="fade-up">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
            Frequently Asked Questions
          </h2>
          <div className="space-y-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                How long does verification take?
              </h3>
              <p className="text-gray-600">
                Verification typically takes 1-2 business days after submitting
                all required documents.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                What products can I sell?
              </h3>
              <p className="text-gray-600">
                You can sell any legal products suitable for students, including
                food, fashion, electronics, and academic materials.
              </p>
            </div>
            <div className="bg-white rounded-2xl p-8 shadow-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                How do I receive payments?
              </h3>
              <p className="text-gray-600">
                Payments are automatically transferred to your registered bank
                account within 24-48 hours of order completion.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-20 bg-gradient-to-r from-amber-500 to-amber-600 text-white"
        data-aos="zoom-in"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Start Selling?</h2>
          <p className="text-xl text-amber-100 mb-10">
            Join our growing community of campus vendors today
          </p>
          <NavLink
            to="/register"
            className="inline-block bg-white text-amber-600 font-bold py-4 px-8 rounded-full hover:bg-gray-100 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            Become a Vendor
          </NavLink>
        </div>
      </section>
    </div>
  );
};

export default Vendors;
