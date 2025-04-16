// src/components/PickerDashboard/Sidebar/Sidebar.jsx
import React from "react";
import styles from "./css/Sidebar.module.css";
import {
  FaHome,
  FaClipboardList,
  FaTruck,
  FaMoneyBillWave,
  FaStar,
  FaCog,
} from "react-icons/fa";
import { TbLogout } from "react-icons/tb";

const Sidebar = ({ activeView, onViewChange }) => {
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaHome /> },
    {
      id: "availableOrders",
      label: "Available Orders",
      icon: <FaClipboardList />,
    },
    { id: "myDeliveries", label: "My Deliveries", icon: <FaTruck /> },
    { id: "earnings", label: "Earnings", icon: <FaMoneyBillWave /> },
    { id: "reviews", label: "Reviews", icon: <FaStar /> },
    { id: "settings", label: "Settings", icon: <FaCog /> },
  ];

  return (
    <div className={styles.sidebar}>
      <div className={styles.logo}>
        <h2>StuMart</h2>
        <p>Picker Dashboard</p>
      </div>

      <nav className={styles.nav}>
        <ul>
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                className={`${styles.navItem} ${
                  activeView === item.id ? styles.active : ""
                }`}
                onClick={() => onViewChange(item.id)}
              >
                <span className={styles.icon}>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className={styles.logout}>
        <button className={styles.logoutButton}>
          <span className={styles.icon}>
            <TbLogout />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
