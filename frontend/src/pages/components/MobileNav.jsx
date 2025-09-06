import React, { use, useContext, useState } from "react";
import {
  Menu,
  Search,
  User,
  ShoppingCart,
  LogIn,
  LogOut,
  Package,
  Heart,
  ChevronDown,
  ChevronUp,
  X,
  MessageCircle,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { GlobalContext } from "../../constant/GlobalContext";
import SidebarNavigation from "./MobileSidebar";

const MobileNav = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  const toggleMenu = () => {
    setOpenMenu(!openMenu);
  };

  const { isAuthenticated, clearCache, useCart } = useContext(GlobalContext);

  const { data: cartData } = useCart();
  const count = cartData?.count || 0;

  const navigate = useNavigate();

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
    <header className="bg-white border-b border-gray-200 shadow-sm lg:hidden">
      <div className="w-[100%] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Menu Button */}
          <div className="flex">
            {/* Logo */}
            <Link to="/">
              <div className="flex items-center space-x-1">
                {/* <span className="text-2xl font-bold text-gray-900">STUMART</span> */}
                <div className="w-10 h-10 bg-orange-500 rounded-full">
                  <img
                    src="/stumart.jpeg"
                    alt="logo"
                    className="w-full h-full rounded-full"
                  />
                </div>
              </div>
            </Link>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {/* User Account */}
            <div className="relative">
              <div
                className="flex items-center space-x-2 cursor-pointer hover:text-amber-500 transition-colors"
                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
              >
                <User className="w-5 h-5" />
                {accountDropdownOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
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
                      to="#"
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

            {/* Shopping Cart */}
            <Link to="/shopping-cart">
              <button className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200">
                <ShoppingCart className="w-6 h-6" />
                {/* Cart Badge */}
                <span className="absolute top-[-1px] right-[1px] bg-orange-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {count}
                </span>
              </button>
            </Link>

            {openMenu ? (
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            ) : (
              <button className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors duration-200">
                <Menu onClick={toggleMenu} className="w-6 h-6" />
              </button>
            )}

            <div className="">
              {openMenu && (
                <SidebarNavigation close={toggleMenu} openMenu={openMenu} />
              )}
            </div>
          </div>
        </div>
      </div>
      <div>
        {/* Search Bar */}
        <div className="w-full mx-auto px-6 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 focus:bg-white transition-all duration-200 text-sm placeholder-gray-500"
              placeholder="Search products, brands and categories"
            />
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileNav;
