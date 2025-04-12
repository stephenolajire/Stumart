import React, { useEffect, useState } from "react";
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
import styles from "./css/VendorDashboard.module.css"
import api from "../constant/api";

const Bar = ({ activeTab }) => {
  const [details, setDetails] = useState({});

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

  const getTabLabel = (tabId) => {
    return sidebarItems.find((item) => item.id === tabId)?.label || "";
  };

  const getDetails = async () => {
    try {
      const response = await api.get("/vendor-details/");
      // console.log(response.data);
      setDetails(response.data);
    } catch (error) {
      console.error("Error fetching vendor details:", error);
    }
  };

  useEffect(() => {
    getDetails();
  }, []);

  return (
    <div className={styles.topBar}>
      <h1>{getTabLabel(activeTab)}</h1>
      <div className={styles.vendorProfile}>
        <img src={details.image} alt="Vendor" />
        <span>{details.name || "Vendor Name"}</span>
      </div>
    </div>
  );
};

export default Bar;
