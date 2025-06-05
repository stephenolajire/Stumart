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
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768 && isOpen) {
      toggleSidebar();
    }
  };

  const handleBackdropClick = (e) => {
    // Close sidebar when clicking backdrop on mobile
    if (e.target === e.currentTarget && window.innerWidth <= 768) {
      toggleSidebar();
    }
  };

  return (
    <div
      className={`${styles.sidebar} ${isOpen ? "" : styles.collapsed}`}
      onClick={handleBackdropClick}
    >
      <div className={styles.sidebarHeader}>
        {isOpen ? (
          <h2 className={styles.logoText}>
            STUMART <span>Admin</span>
          </h2>
        ) : (
          <h2 className={styles.logoIcon} title="STUMART Admin">
            S
          </h2>
        )}
      </div>

      <nav
        className={styles.sidebarNav}
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className={styles.navList}>
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.navItem} ${
                  activeTab === item.id ? styles.active : ""
                }`}
                onClick={() => handleNavigate(item.id)}
                data-tooltip={item.label}
                aria-label={item.label}
                aria-current={activeTab === item.id ? "page" : undefined}
                type="button"
              >
                <span className={styles.icon} aria-hidden="true">
                  {item.icon}
                </span>
                {isOpen && <span className={styles.label}>{item.label}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.sidebarFooter}>
        <button
          className={styles.logoutButton}
          data-tooltip="Logout"
          aria-label="Logout"
          type="button"
          onClick={() => {
            // Add your logout logic here
            console.log("Logout clicked");
          }}
        >
          <span className={styles.icon} aria-hidden="true">
            🚪
          </span>
          {isOpen && <span className={styles.label}>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
