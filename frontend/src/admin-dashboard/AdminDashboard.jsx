import React, { useState } from "react";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
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

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Determine active tab based on current route
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.includes("/vendors")) return "vendors";
    if (path.includes("/users")) return "users";
    if (path.includes("/pickers")) return "pickers";
    if (path.includes("/orders")) return "orders";
    if (path.includes("/payments")) return "payments";
    if (path.includes("/kyc")) return "kyc";
    if (path.includes("/utilities")) return "utilities";
    return "dashboard";
  };

  const handleTabChange = (tabId) => {
    switch (tabId) {
      case "dashboard":
        navigate("/admin-dashboard");
        break;
      case "users":
        navigate("/admin-dashboard/users");
        break;
      case "vendors":
        navigate("/admin-dashboard/vendors");
        break;
      case "pickers":
        navigate("/admin-dashboard/pickers");
        break;
      case "orders":
        navigate("/admin-dashboard/orders");
        break;
      case "payments":
        navigate("/admin-dashboard/payments");
        break;
      case "kyc":
        navigate("/admin-dashboard/kyc");
        break;
      case "utilities":
        navigate("/admin-dashboard/utilities");
        break;
      default:
        navigate("/admin-dashboard");
    }
  };

  const getPageTitle = () => {
    const activeTab = getActiveTab();
    const path = location.pathname;

    // Check for specific nested routes
    if (path.includes("/orders/") && path !== "/admin-dashboard/orders") {
      return "Order Details";
    }
    if (path.includes("/payments/vendor-wallets")) {
      return "Vendor Wallets";
    }

    const titles = {
      dashboard: "Dashboard",
      users: "Manage Users",
      vendors: "Manage Vendors",
      pickers: "Manage Pickers",
      orders: "Orders",
      payments: "Payments",
      kyc: "KYC Verification",
      utilities: "Utilities",
    };
    return titles[activeTab] || "Dashboard";
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <Sidebar
          activeTab={getActiveTab()}
          setActiveTab={handleTabChange}
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? "lg:ml-0" : "lg:ml-0"
        }`}
      >
        {/* Top Bar */}
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-4 flex items-center justify-between">
          {/* Left side - Menu toggle and title */}
          <div className="flex items-center space-x-4">
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
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
