import React from "react";
import {
  FaHome,
  FaBox,
  FaShoppingCart,
  FaBoxes,
  FaCreditCard,
  FaStar,
  FaCog,
  FaUser,
} from "react-icons/fa";
import styles from "./css/VendorDashboard.module.css";

const Sidebar = ({ activeTab, setActiveTab }) => {
  const sidebarItems = [
    { id: "overview", label: "Home", icon: <FaHome /> },
    { id: "products", label: "Products", icon: <FaBox /> },
    { id: "orders", label: "Orders", icon: <FaShoppingCart /> },
    { id: "inventory", label: "Inventory", icon: <FaBoxes /> },
    { id: "payments", label: "Payments", icon: <FaCreditCard /> },
    { id: "reviews", label: "Reviews & Ratings", icon: <FaStar /> },
    { id: "settings", label: "Settings", icon: <FaCog /> },
    { id: "logout", label: "Logout", icon: <FaUser /> },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logoContainer}>
        <h2 className={styles.logo}>Vendor Dashboard</h2>
      </div>
      <div className={styles.navigation}>
        {sidebarItems.map((item) => (
          <div
            key={item.id}
            className={`${styles.sidebarItem} ${
              activeTab === item.id ? styles.active : ""
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            <span className={styles.icon}>{item.icon}</span>
            <span className={styles.label}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
