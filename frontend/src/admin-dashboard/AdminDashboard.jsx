import React, { useState } from "react";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
import { Routes, Route, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import ManageUsers from "./ManageUsers";
import ManageVendors from "./ManageVendors";
import ManagePickers from "./ManagePickers";
import Orders from "./Orders";
import OrderDetail from "./OrderDetail";
import Payments from "./Payments";
import VendorWallets from "./VendorWallets";
import KYCVerification from "./KYCVerification";
import Utilities from "./Utilities";
import ReferralManagement from "./ReferralPage";

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Get page title based on current route
  const getPageTitle = () => {
    const path = location.pathname;

    if (path === "/admin-dashboard") return "Dashboard";
    if (path.includes("/orders/")) return "Order Details";
    if (path.includes("/payments/vendor-wallets")) return "Vendor Wallets";
    if (path.includes("/users")) return "Manage Users";
    if (path.includes("/vendors")) return "Manage Vendors";
    if (path.includes("/pickers")) return "Manage Pickers";
    if (path.includes("/orders")) return "Orders";
    if (path.includes("/payments")) return "Payments";
    if (path.includes("/kyc")) return "KYC Verification";
    if (path.includes("/utilities")) return "Utilities";
    if (path.includes("/referrals")) return "Referral Management";

    return "Dashboard";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          {/* Left side - Menu toggle and title */}
          <div className="flex items-center space-x-4">
            {/* Mobile menu toggle */}
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>

            {/* Desktop menu toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
              aria-label="Toggle sidebar"
            >
              <FaBars size={20} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h2>
          </div>

          {/* Right side - Admin info */}
          <div className="flex items-center space-x-3">
            <span className="text-sm font-medium text-gray-700 hidden sm:block">
              Admin
            </span>
            <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
              <FaUser className="text-white text-sm" />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-6">
            <Routes>
              <Route index element={<DashboardHome />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="vendors" element={<ManageVendors />} />
              <Route path="pickers" element={<ManagePickers />} />
              <Route path="orders" element={<Orders />} />
              <Route path="orders/:orderId" element={<OrderDetail />} />
              <Route path="payments" element={<Payments />} />
              <Route
                path="payments/vendor-wallets"
                element={<VendorWallets />}
              />
              <Route path="kyc" element={<KYCVerification />} />
              <Route path="utilities" element={<Utilities />} />
              <Route path="referrals" element={<ReferralManagement />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
