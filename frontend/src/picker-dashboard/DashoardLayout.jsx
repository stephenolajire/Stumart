import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import AvailableOrders from "./AvailableOrders";
import MyDeliveries from "./MyDeliveries";
import Earnings from "./Earnings";
import Reviews from "./Reviews";
import Settings from "./Settings";
import OrderDetail from "./DeliveryDetail";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";

const DashboardLayout = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const toggleMenu = () => {
    setIsMobileOpen(!isMobileOpen)
  }

  // const handleOrderSelect = (orderId) => {
  //   setSelectedOrderId(orderId);
  //   setActiveView("orderDetail");
  //   navigate("/order-detail")
  // };

  const handleBackToOrders = () => {
    setSelectedOrderId(null);
    setActiveView("availableOrders");
  };

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return <Dashboard />;
      case "availableOrders":
        return <AvailableOrders />;
      case "myDeliveries":
        return <MyDeliveries />;
      case "earnings":
        return <Earnings />;
      case "reviews":
        return <Reviews />;
      case "settings":
        return <Settings />;
      case "orderDetail":
        return (
          <OrderDetail orderId={selectedOrderId} onBack={handleBackToOrders} />
        );
      default:
        return <Dashboard onOrderSelect={handleOrderSelect} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Container - Hidden on mobile by default, shown when menu is open */}
      <div className="hidden lg:flex">
        <Sidebar toggleMenu={toggleMenu} activeView={activeView} onViewChange={handleViewChange} />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header Bar - Only visible on mobile */}
        <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">
            StuMart Picker
          </h1>
          <div className="hidden items-center space-x-2 lg:flex">
            <span className="text-sm text-gray-500 capitalize">
              {activeView.replace(/([A-Z])/g, " $1").trim()}
            </span>
          </div>

          {isMobileOpen ? (
            <X onClick={toggleMenu} />
          ) : (
            <Menu onClick={toggleMenu} />
          )}
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50">
          <div className="min-h-full">{renderContent()}</div>
          <div className="absolute left-0 top-0 z-2000 bg-white">
            {isMobileOpen && (
              <Sidebar
                activeView={activeView}
                onViewChange={handleViewChange}
                toggleMenu={toggleMenu}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
