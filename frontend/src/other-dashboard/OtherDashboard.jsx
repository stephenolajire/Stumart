// VendorDashboard.jsx
import React, { useState } from "react";
import Sidebar from "./SideBar";
import Home from "./Home";
import Applications from "./Applications";
import Reviews from "./Reviews";
import Settings from "./Settings";
import Message from "./VendorMessages"
import Subscriptions from "./Subscriptions";
import ThemeToggle from "../components/ThemeToggle"
// import SubscriptionPlans from "../pages/SubscriptionPlans"
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
      case "subscription":
        return <Subscriptions />;
      case "reviews":
        return <Reviews vendor={vendor} />;
      case "settings":
        return <Settings vendor={vendor} />;
      case "chat":
        return <Message/>;
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
      <div style={{position:"fixed", bottom:"2rem", right:"2rem", zIndex:"1000"}}>
        <ThemeToggle/>
      </div>
      <main className={styles.content}>{renderContent()}</main>
    </div>
  );
};

export default OtherDashboard;
