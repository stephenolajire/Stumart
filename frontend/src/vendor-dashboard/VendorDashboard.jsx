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
import Swal from "sweetalert2";
import Inventory from "./Inventory";
import Settings from "./Settings";
import vendorApi from "../user/services/vendorApi";
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
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

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
        const withdrawalData = await vendorApi.getWithdrawalHistory();
        setWithrawalHistory(withdrawalData);
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

      Swal.fire({
        title: "Error",
        text: "Failed to fetch dashboard data",
        icon: "error",
        confirmButtonColor: "#eab308",
      });
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
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await vendorApi.deleteProduct(id);
          setProducts(products.filter((product) => product.id !== id));
          Swal.fire({
            title: "Deleted!",
            text: "Your product has been deleted.",
            icon: "success",
            confirmButtonColor: "#eab308",
          });
        } catch (error) {
          console.error("Delete Error:", error);
          Swal.fire({
            title: "Error",
            text: "Failed to delete product",
            icon: "error",
            confirmButtonColor: "#eab308",
          });
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
      Swal.fire({
        title: "Updated!",
        text: "Stock has been updated.",
        icon: "success",
        confirmButtonColor: "#eab308",
      });
    } catch (error) {
      console.error("Update Stock Error:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to update stock",
        icon: "error",
        confirmButtonColor: "#eab308",
      });
    }
  };

  const handleRespondToReview = async (reviewId, response) => {
    try {
      await vendorApi.respondToReview(reviewId, response);
      // You would need to update the Reviews component to reflect this change
      Swal.fire({
        title: "Success",
        text: "Response submitted",
        icon: "success",
        confirmButtonColor: "#eab308",
      });
    } catch (error) {
      console.error("Review Response Error:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to submit response",
        icon: "error",
        confirmButtonColor: "#eab308",
      });
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      );
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
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="lg:hidden flex absolute top-0 left-0">
        {isOpen && (
          <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} toggleMenu={toggleMenu}/>
        )}
      </div>
      <div className="lg:ml-64 ml-0">
        <Bar activeTab={activeTab} toggleMenu={toggleMenu} isOpen={isOpen} />
        <div className="pt-20 pb-6">
          <div className="w-full mx-auto">{renderContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default VendorDashboard;
