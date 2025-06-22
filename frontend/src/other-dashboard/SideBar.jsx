// Sidebar.jsx
import React from "react";
import styles from "./css/Sidebar.module.css";
import { MEDIA_BASE_URL } from "../constant/api";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ activeTab, setActiveTab, vendor }) => {
  const navigation = [
    { id: "home", label: "Dashboard", icon: "📊" },
    { id: "applications", label: "Applications", icon: "📝" },
    // { id: "subscription", label: "Subscription", icon: "💳"},
    { id: "reviews", label: "Reviews", icon: "⭐" },
    { id: "chat", label: "Messages", icon: "💬" },
    { id: "settings", label: "Settings", icon: "⚙️" },

  ];

  const navigate =  useNavigate()
  const handleLogout = () => {
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    navigate('/login')
  }

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <div className={styles.vendorLogo}>
          {vendor ?.shop_image ? (
            <img src={`${MEDIA_BASE_URL}${vendor.shop_image}`} alt={vendor.business_name} />
          ) : (
            <div className={styles.placeholderLogo}>
              {vendor?.business_name.charAt(0)}
            </div>
          )}
        </div>
        <h3 className={styles.vendorName}>{vendor?.business_name}</h3>
        <p className={styles.vendorCategory}>{vendor?.specific_category}</p>
      </div>

      <nav className={styles.navigation}>
        <ul>
          {navigation.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.navItem} ${
                  activeTab === item.id ? styles.active : ""
                }`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <button className={styles.logoutButton} onClick={handleLogout}>
          <span className={styles.logoutIcon}>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
