// VendorDashboard.jsx
import React, { useState } from "react";
import Sidebar from "./SideBar";
import Home from "./Home";
import Applications from "./Applications";
import Reviews from "./Reviews";
import Settings from "./Settings";
import Chat from "./Chat";
import styles from "./css/Dashboard.module.css";

const OtherDashboard = ({ vendor }) => {
  const [activeTab, setActiveTab] = useState("home");

  // Render the appropriate component based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home vendor={vendor} />;
      case "applications":
        return <Applications vendor={vendor} />;
      case "reviews":
        return <Reviews vendor={vendor} />;
      case "settings":
        return <Settings vendor={vendor} />;
      case "chat":
        return <Chat vendor={vendor} />;
      default:
        return <Home vendor={vendor} />;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        vendor={vendor}
      />
      <main className={styles.content}>{renderContent()}</main>
    </div>
  );
};

export default OtherDashboard;
