import React, { useState, useEffect } from "react";
import {
  Home,
  ClipboardList,
  Truck,
  DollarSign,
  Star,
  Settings,
  Menu,
  X,
  LogOut,
  Package,
} from "lucide-react";

const Sidebar = ({ activeView, onViewChange, toggleMenu }) => {
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "availableOrders", label: "Available Orders", icon: ClipboardList },
    { id: "myDeliveries", label: "My Deliveries", icon: Truck },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <>
      {/* Logo Section */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-8 text-white">
        <div className="flex items-center mb-2">
          <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">StuMart</h2>
          </div>
        </div>
        <p className="text-yellow-100 text-sm">Picker Dashboard</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;

            return (
              <li key={item.id}>
                <button
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-yellow-50 text-yellow-700 shadow-md border-l-4 border-yellow-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-yellow-600"
                  }`}
                  onClick={() => {onViewChange(item.id), toggleMenu()}}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                      isActive
                        ? "bg-yellow-100"
                        : "bg-gray-100 group-hover:bg-yellow-50"
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-yellow-600"
                          : "text-gray-500 group-hover:text-yellow-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-medium ${isActive ? "font-semibold" : ""}`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-yellow-500 rounded-full"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          onClick={handleLogout}
        >
          <div className="w-10 h-10 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center mr-4 transition-colors">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <span className="font-medium">Logout</span>
        </button>

        {/* Picker Badge */}
        <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center">
            <Truck className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-xs text-gray-500">Logged in as</span>
          </div>
          <p className="text-sm font-medium text-gray-700 mt-1">
            Delivery Partner
          </p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
