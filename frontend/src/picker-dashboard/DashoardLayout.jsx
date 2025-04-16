// DashboardLayout.jsx
import React, { useState } from "react";
import SidebarNav from "./SidebarNav";
import styles from "./css/DashboardLayout.module.css";

const DashboardLayout = ({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className={styles.dashboardLayout}>
      <SidebarNav onToggle={(collapsed) => setSidebarCollapsed(collapsed)} />
      <main
        className={`${styles.content} ${
          sidebarCollapsed ? styles.contentCollapsed : ""
        }`}
      >
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
