// src/components/PickerDashboard/PickerDashboard.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/DashboardLayout.module.css";
import Sidebar from "./Sidebar";
import Dashboard from "./Dashboard";
import AvailableOrders from "./AvailableOrders";
import MyDeliveries from "./MyDeliveries";
import Earnings from "./Earnings";
import Reviews from "./Reviews";
import Settings from "./Settings";
import OrderDetail from "./DeliveryDetail";
import { IoMenuOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

const DashboardLayout = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const handleViewChange = (view) => {
    setActiveView(view);
    setIsMobileSidebarOpen(false);
  };

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
    <div className={styles.dashboardContainer}>
      <div
        className={`${styles.sidebar} ${
          isMobileSidebarOpen ? styles.sidebarOpen : ""
        }`}
      >
        <Sidebar activeView={activeView} onViewChange={handleViewChange} />
      </div>
      <div
        className={styles.mobileMenuButton}
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      >
        <IoMenuOutline />
      </div>
      <div className={styles.content}>{renderContent()}</div>
    </div>
  );
};

export default DashboardLayout;
