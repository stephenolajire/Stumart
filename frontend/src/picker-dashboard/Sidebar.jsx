// src/components/PickerDashboard/Sidebar/Sidebar.jsx
import React, { useState, useEffect } from "react";
import styles from "./css/Sidebar.module.css";
import {
  FaHome,
  FaClipboardList,
  FaTruck,
  FaMoneyBillWave,
  FaStar,
  FaCog,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { TbLogout } from "react-icons/tb";

const Sidebar = ({ activeView, onViewChange }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if screen is mobile size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Close mobile menu when view changes
  useEffect(() => {
    if (isMobile) {
      setIsMobileMenuOpen(false);
    }
  }, [activeView, isMobile]);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

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
    <>
      {/* Mobile Menu Toggle Button */}
      {isMobile && (
        <button
          className={styles.mobileMenuToggle}
          onClick={toggleMobileMenu}
          aria-label="Toggle navigation menu"
        >
          {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      )}

      {/* Mobile Overlay */}
      {isMobile && isMobileMenuOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${styles.sidebar} ${isMobileMenuOpen ? styles.open : ""}`}
      >
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
          <button className={styles.logoutButton} onClick={handleLogout}>
            <span className={styles.icon}>
              <TbLogout />
            </span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
