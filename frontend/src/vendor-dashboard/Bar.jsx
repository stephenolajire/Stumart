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

const Bar = ({ activeTab }) => {
  const getTabLabel = (tabId) => {
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

    return sidebarItems.find((item) => item.id === tabId)?.label || "";
  };

  return (
    <div className={styles.topBar}>
      <h1>{getTabLabel(activeTab)}</h1>
      <div className={styles.vendorProfile}>
        <img src="https://via.placeholder.com/40" alt="Vendor" />
        <span>Vendor Name</span>
      </div>
    </div>
  );
};

export default Bar;
