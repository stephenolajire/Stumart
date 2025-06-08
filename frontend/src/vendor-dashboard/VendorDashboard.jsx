import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import Sidebar from "./Sidebar";
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
import vendorApi from "../services/vendorApi";
import ThemeToggle from "../components/ThemeToggle";

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
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawHistory, setWithrawalHistory] = useState([]);

  const navigate = useNavigate();
  const { auth } = useContext(GlobalContext);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
    window.location.reload();
  };

  useEffect(() => {
    fetchDashboardData();
    auth();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fixed: Only fetch the data that exists, handle withdrawals separately if needed
      const [statsData, productsData, ordersData] = await Promise.all([
        vendorApi.getDashboardStats(),
        vendorApi.getProducts(),
        vendorApi.getOrders(),
      ]);

      // console.log("Stats Data:", statsData); // Debug log
      // console.log("Products Data:", productsData); // Debug log
      // console.log("Orders Data:", ordersData); // Debug log

      setStats(statsData);
      setProducts(productsData);
      setOrders(ordersData);

      // Handle withdrawal history separately if the API exists
      try {
        const withdrawData = await vendorApi.getWithdrawals();
        setWithrawalHistory(withdrawData);
      } catch (withdrawError) {
        console.warn("Withdrawal data not available:", withdrawError);
        setWithrawalHistory([]);
      }
    } catch (error) {
      console.error("Dashboard Data Error:", error);
      console.error("Error Response:", error.response);

      // More detailed error logging
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Status Text:", error.response.statusText);
        console.error("Response Data:", error.response.data);
      }

      Swal.fire("Error", "Failed to fetch dashboard data", "error");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDeleteProduct = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "var(--error)",
      cancelButtonColor: "var(--neutral-gray-400)",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await vendorApi.deleteProduct(id);
          setProducts(products.filter((product) => product.id !== id));
          Swal.fire("Deleted!", "Your product has been deleted.", "success");
        } catch (error) {
          console.error("Delete Error:", error);
          Swal.fire("Error", "Failed to delete product", "error");
        }
      }
    });
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      await vendorApi.updateStock(productId, newStock);
      setProducts(
        products.map((product) =>
          product.id === productId ? { ...product, stock: newStock } : product
        )
      );
      Swal.fire("Updated!", "Stock has been updated.", "success");
    } catch (error) {
      console.error("Update Stock Error:", error);
      Swal.fire("Error", "Failed to update stock", "error");
    }
  };

  const handleRespondToReview = async (reviewId, response) => {
    try {
      await vendorApi.respondToReview(reviewId, response);
      // You would need to update the Reviews component to reflect this change
      Swal.fire("Success", "Response submitted", "success");
    } catch (error) {
      console.error("Review Response Error:", error);
      Swal.fire("Error", "Failed to submit response", "error");
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return <div className={styles.loading}>Loading...</div>;
    }

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
        return (
          <Inventory products={products} onUpdateStock={handleUpdateStock} />
        );
      case "payments":
        return <Payments />;
      case "reviews":
        return <Reviews onRespondToReview={handleRespondToReview} />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  // Add useEffect to watch for activeTab changes
  useEffect(() => {
    if (activeTab === "logout") {
      handleLogout();
    }
  }, [activeTab]);

  return (
    <div className={styles.dashboardContainer}>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div style={{position:"fixed", bottom:"2rem", right:"2rem"}}>
        <ThemeToggle/>
      </div>
      <div className={styles.mainContent}>
        <Bar activeTab={activeTab} />
        {renderContent()}
      </div>
    </div>
  );
};

export default VendorDashboard;
