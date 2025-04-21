import React from "react";
import styles from "./css/Sidebar.module.css";

const Sidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  toggleSidebar,
  resetSelection,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Manage Users", icon: "👥" },
    { id: "vendors", label: "Manage Vendors", icon: "🏪" },
    { id: "pickers", label: "Manage Pickers", icon: "🚚" },
    { id: "orders", label: "Orders", icon: "📦" },
    { id: "payments", label: "Payments", icon: "💰" },
    { id: "kyc", label: "KYC Verification", icon: "🔍" },
  ];

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    resetSelection();
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? "" : styles.collapsed}`}>
      <div className={styles.sidebarHeader}>
        {isOpen ? (
          <h2 className={styles.logoText}>
            STUMART <span>Admin</span>
          </h2>
        ) : (
          <h2 className={styles.logoIcon}>S</h2>
        )}
      </div>
      <nav className={styles.sidebarNav}>
        <ul className={styles.navList}>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.navItem} ${
                  activeTab === item.id ? styles.active : ""
                }`}
                onClick={() => handleNavigate(item.id)}
              >
                <span className={styles.icon}>{item.icon}</span>
                {isOpen && <span className={styles.label}>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div className={styles.sidebarFooter}>
        <button className={styles.logoutButton}>
          <span className={styles.icon}>🚪</span>
          {isOpen && <span className={styles.label}>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
