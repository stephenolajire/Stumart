import React, { useState } from "react";
import styles from "./css/AdminDashboard.module.css";
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
// import ThemeToggle from "../components/ThemeToggle"
import ThemeToggle from "../components/ThemeToggle";

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
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={sidebarOpen}
        toggleSidebar={toggleSidebar}
        resetSelection={() => setSelectedItemId(null)}
      />
      <div
        className={`${styles.contentArea} ${
          sidebarOpen ? "" : styles.expanded
        }`}
      >
        <div className={styles.topBar}>
          <button className={styles.menuToggle} onClick={toggleSidebar}>
            {sidebarOpen ? "←" : "→"}
          </button>
          <h2 className={styles.pageTitle}>
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <div className={styles.adminInfo}>
            <span className={styles.adminName}>Admin</span>
            <div className={styles.adminAvatar}></div>
          </div>
        </div>
        <div className={styles.content}>{renderContent()}</div>
        <div style={{position:"fixed", right:"2rem", bottom:"2rem", zIndex:"10000"}}>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
