import React, { useContext, useState } from "react";
import {
  Search,
  User,
  HelpCircle,
  ShoppingCart,
  Phone,
  Zap,
  Settings,
  LogOut,
  Heart,
  Package,
  CreditCard,
  MapPin,
  Headphones,
  FileText,
  Gift,
  Truck,
  LogIn,
  MessageCircle,
} from "lucide-react";
import { Link, Links, useNavigate } from "react-router-dom";
import { GlobalContext } from "../../constant/GlobalContext";

const Navigation = () => {
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [quickLinksDropdownOpen, setQuickLinksDropdownOpen] = useState(false);

  const { isAuthenticated, useCart, clearCache } = useContext(GlobalContext);

  const navigate = useNavigate();

  // Use the TanStack Query hook for cart data
  const { data: cartData } = useCart();
  const count = cartData?.count || 0;

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user_type");
    localStorage.removeItem("institution");

    // Clear all cached data on logout
    clearCache("all");

    navigate("/");
    window.location.reload();
  };

  return (
    <div className="hidden lg:block ">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-orange-500 text-white text-sm py-2 px-10 max-w-[83rem] ">
        <div className="flex justify-between items-center w-full mx-auto">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Student Week: Up to 50% OFF</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white/20 rounded"></div>
              <span>Download App for Better Deals</span>
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Call for Deals: 0900 600 0000</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>LIVE NOW</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="bg-white shadow-sm py-3 max-w-[83.5rem] px-10">
        <div className="flex items-center justify-between w-full mx-auto">
          {/* Logo */}
          <Link to="/">
            <div className="flex items-center">
              <div className=" text-white p-2 rounded-lg mr-2">
                <div className="w-10 h-10 flex items-center justify-center font-bold text-sm">
                  <img
                    src="/stumart.jpeg"
                    alt="logo"
                    className="w-full h-full rounded-full"
                  />
                </div>
              </div>
              <span className="text-xl font-bold text-gray-800">StuMart</span>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, brands and categories"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button className="absolute right-0 top-0 bg-yellow-500 text-white px-6 py-2 rounded-r-lg hover:bg-amber-600 transition-colors">
                SEARCH
              </button>
            </div>
          </div>

          {/* Right Side Menu */}
          <div className="flex items-center space-x-6">
            {/* Account Dropdown */}
            <div className="relative">
              <div
                className="flex items-center space-x-2 cursor-pointer hover:text-amber-500 transition-colors"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              >
                <User className="w-5 h-5" />
                <span className="text-base">Account</span>
                <div className="w-3 h-3 border-b-2 border-r-2 border-gray-400 transform rotate-45 translate-y-[-2px]"></div>
              </div>

              {accountDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm text-gray-600">Welcome!</p>
                      <p className="text-sm font-medium">
                        Sign in to your account
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-3" />
                      My Profile
                    </Link>
                    <Link
                      to="/order-history"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Package className="w-4 h-4 mr-3" />
                      My Orders
                    </Link>
                    <Link
                      to="#"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Heart className="w-4 h-4 mr-3" />
                      Wishlist
                    </Link>
                    {isAuthenticated ? (
                      <div>
                        <Link
                          to="/messages"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <MessageCircle className="w-4 h-4 mr-3" />
                          Messages
                        </Link>
                        <Link
                          to="/"
                          onClick={handleLogout}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut className="w-4 h-4 mr-3" />
                          Logout
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <Link
                          to="/login"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogIn className="w-4 h-4 mr-3" />
                          Login
                        </Link>
                        <div className="border-t border-gray-100 mt-2">
                          <Link
                            to="/register"
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            Register
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Links Dropdown */}
            <div className="relative">
              <div
                className="flex items-center space-x-2 cursor-pointer hover:text-amber-500 transition-colors"
                onClick={() =>
                  setQuickLinksDropdownOpen(!quickLinksDropdownOpen)
                }
              >
                <HelpCircle className="w-5 h-5" />
                <span className="text-base">Quick Links</span>
                <div className="w-3 h-3 border-b-2 border-r-2 border-gray-400 transform rotate-45 translate-y-[-2px]"></div>
              </div>

              {quickLinksDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <Link
                      to="/about"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Headphones className="w-4 h-4 mr-3" />
                      About
                    </Link>
                    <Link
                      to="/rider"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Truck className="w-4 h-4 mr-3" />
                      Rider
                    </Link>
                    <Link
                      to="/vendors"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Gift className="w-4 h-4 mr-3" />
                      Vendors
                    </Link>

                    <Link
                      to="/contact"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Phone className="w-4 h-4 mr-3" />
                      Contact Us
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Cart */}
            <Link to="/shopping-cart">
              <div className="flex relative items-center space-x-1 cursor-pointer hover:text-amber-500 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                <span className="text-base">Cart</span>
                <div className="bg-amber-500 text-white text-sm w-4 h-4 flex rounded-full items-center justify-center absolute right-8 -top-1">
                  <p className="text-center mx-auto items-center justify-center">
                    {count}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navigation;
