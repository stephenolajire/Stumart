import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import Sidebar from "./Sidebar";
// import TopBar from "./Topbar";
import TopBar from "./Topbar";
import Bar from "./Bar";
import Overview from "./Overview";
import Products from "./Products";
import Orders from "./Orders";
import Reviews from "./Review";
import Payments from "./Payments";
import styles from "./css/VendorDashboard.module.css";
import Swal from "sweetalert2";
import Inventory from "./Inventory";
import Settings from "./Settings";

// Placeholder for API (replace with your actual API)
const api = {
  get: async (url) => {
    // Implement your API call logic here
  },
};

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    lowStock: 0,
    totalRevenue: 0,
    pendingReviews: 0,
    revenueData: [],
    salesData: [],
  });
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  const navigate = useNavigate();
  const { auth } = useContext(GlobalContext);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
    window.location.reload();
  };

  useEffect(() => {
    fetchDashboardData();
    auth();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        api.get("dashboard/stats"),
        api.get("vendor-products/"),
        api.get("orders"),
      ]);

      console.log("Stats Data:", statsRes.data);
      console.log("Products Data:", productsRes.data);
      console.log("Orders Data:", ordersRes.data);

      setStats(statsRes.data);
      setProducts(productsRes.data);
      setOrders(ordersRes.data);
    } catch (error) {
      console.error("Dashboard Data Error:", error);
      console.error("Error Response:", error.response);
      Swal.fire("Error", "Failed to fetch dashboard data", "error");
    }
  };

  const handleDeleteProduct = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--error)",
      cancelButtonColor: "var(--neutral-gray-400)",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        setProducts(products.filter((product) => product.id !== id));
        Swal.fire("Deleted!", "Your product has been deleted.", "success");
      }
    });
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview stats={stats} />;
      case "products":
        return (
          <Products products={products} onDeleteProduct={handleDeleteProduct} />
        );
      case "orders":
        return <Orders orders={orders} />;
      case "inventory":
        return <Inventory products={products} />;
      case "payments":
        return <Payments />;
      case "reviews":
        return <Reviews/>;
      case "settings":
        return <Settings />;
      case "logout":
        return (
          <button className={styles.logout} onClick={handleLogout}>
            Logout
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className={styles.mainContent}>
        <Bar activeTab={activeTab} />
        {renderContent()}
      </div>
    </div>
  );
};

export default VendorDashboard;
