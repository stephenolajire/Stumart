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
import WithdrawalDashboard from "../withdrawal/WithdrawalDashboard";
import {
  useDashboardStats,
  useVendorProducts,
  useVendorOrders,
  useWithdrawalHistory,
  useDeleteProduct,
  useUpdateStock,
} from "../hooks/useVendor";

const VendorDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [isOpen, setIsOpen] = useState(false);

  const navigate = useNavigate();
  const { auth } = useContext(GlobalContext);

  const {
    data: stats = {
      totalSales: 0,
      totalOrders: 0,
      totalProducts: 0,
      lowStock: 0,
      totalRevenue: 0,
      pendingReviews: 0,
      revenueData: [],
      salesData: [],
    },
    isLoading: statsLoading,
  } = useDashboardStats();

  const { data: products = [], isLoading: productsLoading } =
    useVendorProducts();
  const { data: ordersData, isLoading: ordersLoading } = useVendorOrders();
  const { data: withdrawalData } = useWithdrawalHistory();

  const orders = ordersData ?? [];
  const withdrawHistory = withdrawalData?.results ?? [];

  const isLoading = statsLoading || productsLoading || ordersLoading;

  const { mutate: deleteProduct } = useDeleteProduct();
  const { mutate: updateStock } = useUpdateStock();
  console.log("Orders:", orders);

  const toggleMenu = () => setIsOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
    window.location.reload();
  };

  useEffect(() => {
    auth();
  }, []);

  useEffect(() => {
    if (activeTab === "logout") {
      handleLogout();
    }
  }, [activeTab]);

  const handleDeleteProduct = (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#9ca3af",
      confirmButtonText: "Yes, delete it!",
    }).then((result) => {
      if (result.isConfirmed) {
        deleteProduct(id, {
          onSuccess: () => {
            Swal.fire({
              title: "Deleted!",
              text: "Your product has been deleted.",
              icon: "success",
              confirmButtonColor: "#eab308",
            });
          },
          onError: () => {
            Swal.fire({
              title: "Error",
              text: "Failed to delete product",
              icon: "error",
              confirmButtonColor: "#eab308",
            });
          },
        });
      }
    });
  };

  const handleUpdateStock = (productId, data) => {
    updateStock(
      { productId, data },
      {
        onSuccess: () => {
          Swal.fire({
            title: "Updated!",
            text: "Stock has been updated.",
            icon: "success",
            confirmButtonColor: "#eab308",
          });
        },
        onError: () => {
          Swal.fire({
            title: "Error",
            text: "Failed to update stock",
            icon: "error",
            confirmButtonColor: "#eab308",
          });
        },
      },
    );
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
        return <WithdrawalDashboard withdrawHistory={withdrawHistory} />;
      case "reviews":
        return <Reviews />;
      case "settings":
        return <Settings />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="hidden lg:flex">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
      <div className="lg:hidden flex absolute top-0 left-0">
        {isOpen && (
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            toggleMenu={toggleMenu}
          />
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
