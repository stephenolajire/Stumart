import React, { useState, useEffect, useRef } from "react";
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
  Zap,
  Phone,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import SidebarNavigation from "./MobileSidebar";
import api from "../../constant/api";
import { useCart } from "../../hooks/useCart";

const MobileNav = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Auth — same source of truth as ProtectedRoute
  const isAuthenticated = !!localStorage.getItem("access");

  // Cart count — shares same ["cart"] cache as Navigation and all other consumers
  const { cart } = useCart();
  const count = cart?.count ?? 0;

  // ── Click-outside for account dropdown ────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setAccountDropdownOpen(false);
    };
    if (accountDropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [accountDropdownOpen]);

  // ── Logout ─────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user_type");
    localStorage.removeItem("institution");
    localStorage.removeItem("guest_popup_seen");
    queryClient.clear();
    navigate("/");
    window.location.reload();
  };

  // ── Search ─────────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return alert("Please enter a search term");
    setIsSearching(true);
    try {
      const response = await api.get("/stumart/products/search/", {
        params: { product_name: searchQuery.trim() },
      });
      navigate("/search-results", {
        state: {
          products: response.data.products || [],
          searchParams: {
            productName: searchQuery.trim(),
            searchType: response.data.search_type,
            count: response.data.count || 0,
            message: response.data.message,
          },
        },
      });
    } catch (error) {
      navigate("/search-results", {
        state: {
          products: [],
          searchParams: {
            productName: searchQuery.trim(),
            count: 0,
            message: error.response?.data?.message || "No products found",
          },
        },
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm lg:hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-yellow-500 text-white text-xs py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span className="font-medium truncate">Up to 50% OFF</span>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="tel:09039672814"
              className="flex items-center space-x-1 hover:opacity-80 transition-opacity"
            >
              <Phone className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs">0900 600 0000</span>
            </a>
            <div className="flex items-center space-x-1">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              <span className="font-semibold text-xs">LIVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div className="w-full mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <div className="w-10 h-10 bg-yellow-500 rounded-full overflow-hidden">
              <img
                src="/stumart.jpeg"
                alt="logo"
                className="w-full h-full rounded-full"
              />
            </div>
          </Link>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            {/* Account dropdown */}
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex items-center space-x-1 cursor-pointer hover:text-yellow-500 transition-colors"
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
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <User className="w-4 h-4 mr-3" /> My Profile
                    </Link>
                    <Link
                      to="/order-history"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Package className="w-4 h-4 mr-3" /> My Orders
                    </Link>
                    <Link
                      to="/bookmarks"
                      onClick={() => setAccountDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      <Heart className="w-4 h-4 mr-3" /> Wishlist
                    </Link>

                    {isAuthenticated ? (
                      <>
                        <button
                          onClick={() => {
                            setAccountDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogOut className="w-4 h-4 mr-3" /> Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          onClick={() => setAccountDropdownOpen(false)}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <LogIn className="w-4 h-4 mr-3" /> Login
                        </Link>
                        <div className="border-t border-gray-100 mt-2">
                          <Link
                            to="/signup"
                            onClick={() => setAccountDropdownOpen(false)}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <LogIn className="w-4 h-4 mr-3" /> Register
                          </Link>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Cart badge */}
            <Link to="/shopping-cart">
              <button className="relative p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors">
                <ShoppingCart className="w-6 h-6" />
                {count > 0 && (
                  <span className="absolute -top-px right-px bg-yellow-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setOpenMenu(!openMenu)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              {openMenu ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>

            {openMenu && (
              <SidebarNavigation
                close={() => setOpenMenu(false)}
                openMenu={openMenu}
              />
            )}
          </div>
        </div>
      </div>

      {/* Search bar */}
      <div className="w-full mx-auto px-4 sm:px-6 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSearching}
            className={`block w-full pl-10 pr-16 py-2.5 border border-gray-300 rounded-lg bg-gray-50 focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 focus:bg-white transition-all text-sm placeholder-gray-500 ${
              isSearching ? "opacity-50 cursor-not-allowed" : ""
            }`}
            placeholder="Search products, brands and categories"
          />
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className={`px-3 py-1 mr-1 text-sm font-medium rounded-md transition-colors ${
                isSearching
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-yellow-500 text-white hover:bg-yellow-600"
              }`}
            >
              {isSearching ? "Searching..." : "Go"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default MobileNav;
