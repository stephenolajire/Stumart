import React, { useState } from "react";
import { FaBars, FaTimes, FaUser } from "react-icons/fa";
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
import ThemeToggle from "../components/ThemeToggle";
import Utilities from "./Utilities";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedItemId, setSelectedItemId] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <DashboardHome />;
      case "users":
        return <ManageUsers />;
      case "vendors":
        return <ManageVendors />;
      case "pickers":
        return <ManagePickers />;
      case "orders":
        return selectedItemId ? (
          <OrderDetail
            orderId={selectedItemId}
            onBack={() => setSelectedItemId(null)}
          />
        ) : (
          <Orders onViewDetails={(id) => setSelectedItemId(id)} />
        );
      case "payments":
        return selectedItemId === "vendor-wallets" ? (
          <VendorWallets onBack={() => setSelectedItemId(null)} />
        ) : (
          <Payments onViewWallets={() => setSelectedItemId("vendor-wallets")} />
        );
      case "kyc":
        return <KYCVerification />;
      case "utilities":
        return <Utilities />;
      default:
        return <DashboardHome />;
    }
  };

  const getPageTitle = () => {
    if (selectedItemId === "vendor-wallets") return "Vendor Wallets";
    if (selectedItemId && activeTab === "orders") return "Order Details";
    return activeTab.charAt(0).toUpperCase() + activeTab.slice(1);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} 
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          toggleSidebar={toggleSidebar}
          resetSelection={() => setSelectedItemId(null)}
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
            >
              {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
            </button>

            {/* Desktop menu toggle */}
            <button
              onClick={toggleSidebar}
              className="hidden lg:block p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
          <div className="p-6">{renderContent()}</div>
        </div>

        {/* Theme Toggle */}
        <div className="fixed right-8 bottom-8 z-50">
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
