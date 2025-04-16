import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Package, Truck, DollarSign, Star, Settings } from "lucide-react";
import styles from "./css/SidebarNav.module.css"

const SidebarNav = () => {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { path: "/picker/dashboard", icon: <Home size={20} />, label: "Home" },
    {
      path: "/picker/available-orders",
      icon: <Package size={20} />,
      label: "Available Orders",
    },
    {
      path: "/picker/my-deliveries",
      icon: <Truck size={20} />,
      label: "My Deliveries",
    },
    {
      path: "/picker/earnings",
      icon: <DollarSign size={20} />,
      label: "Earnings",
    },
    {
      path: "/picker/reviews",
      icon: <Star size={20} />,
      label: "Reviews & Ratings",
    },
    {
      path: "/picker/settings",
      icon: <Settings size={20} />,
      label: "Settings",
    },
  ];

  return (
    <div className={`${styles.sidebar} ${isCollapsed ? styles.collapsed : ""}`}>
      <div className={styles.logoContainer}>
        <h2>{!isCollapsed && "Picker Portal"}</h2>
        <button
          className={styles.toggleBtn}
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          {isCollapsed ? "→" : "←"}
        </button>
      </div>
      <nav className={styles.navMenu}>
        <ul>
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`${styles.navLink} ${
                  location.pathname === item.path ? styles.active : ""
                }`}
              >
                <span className={styles.icon}>{item.icon}</span>
                {!isCollapsed && (
                  <span className={styles.label}>{item.label}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default SidebarNav;
