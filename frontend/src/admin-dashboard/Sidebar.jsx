import React from "react";
import {
  FaChartBar,
  FaUsers,
  FaStore,
  FaTruck,
  FaBox,
  FaMoneyBillWave,
  FaSearch,
  FaChartLine,
  FaSignOutAlt,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Sidebar = ({
  activeTab,
  setActiveTab,
  isOpen,
  toggleSidebar,
  resetSelection,
}) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <FaChartBar /> },
    { id: "users", label: "Manage Users", icon: <FaUsers /> },
    { id: "vendors", label: "Manage Vendors", icon: <FaStore /> },
    { id: "pickers", label: "Manage Pickers", icon: <FaTruck /> },
    { id: "orders", label: "Orders", icon: <FaBox /> },
    { id: "payments", label: "Payments", icon: <FaMoneyBillWave /> },
    { id: "kyc", label: "KYC Verification", icon: <FaSearch /> },
    { id: "utilities", label: "Utilities", icon: <FaChartLine /> },
  ];

  const navigate = useNavigate();

  const handleNavigate = (tabId) => {
    setActiveTab(tabId);
    resetSelection();
    // Close sidebar on mobile after navigation
    if (window.innerWidth <= 768 && isOpen) {
      toggleSidebar();
    }
  };

  const handleLogout = async () => {
    try {
      // Show confirmation dialog first
      const result = await Swal.fire({
        title: "Confirm Logout",
        text: "Are you sure you want to logout?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#eab308",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, logout",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        // Clear all authentication-related items
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        // Show success message
        await Swal.fire({
          title: "Logged Out",
          text: "You have been successfully logged out",
          icon: "success",
          confirmButtonColor: "#eab308",
          timer: 2000,
        });

        // Navigate to login
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Logout error:", error);
      Swal.fire({
        title: "Logout Failed",
        text: "Please try again",
        icon: "error",
        confirmButtonColor: "#eab308",
      });
    }
  };

  return (
    <div
      className={`h-full bg-white shadow-xl flex flex-col ${
        isOpen ? "w-64" : "w-20"
      } transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200 bg-yellow-500">
        {isOpen ? (
          <h2 className="text-white font-bold text-lg">
            STUMART{" "}
            <span className="text-yellow-200 text-sm font-normal">Admin</span>
          </h2>
        ) : (
          <h2 className="text-white font-bold text-2xl" title="STUMART Admin">
            S
          </h2>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 py-6"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="space-y-2 px-3">
          {menuItems.map((item) => (
            <li key={item.id}>
              <button
                className={`w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 group relative ${
                  activeTab === item.id
                    ? "bg-yellow-500 text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
                onClick={() => handleNavigate(item.id)}
                aria-label={item.label}
                aria-current={activeTab === item.id ? "page" : undefined}
                type="button"
              >
                <span
                  className={`text-lg flex-shrink-0 ${
                    activeTab === item.id
                      ? "text-white"
                      : "text-gray-500 group-hover:text-gray-700"
                  }`}
                >
                  {item.icon}
                </span>

                {isOpen && (
                  <span className="ml-3 font-medium truncate">
                    {item.label}
                  </span>
                )}

                {/* Tooltip for collapsed state */}
                {!isOpen && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    {item.label}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Logout */}
      <div className="border-t border-gray-200 p-3">
        <button
          className="w-full flex items-center px-3 py-3 rounded-lg text-left transition-all duration-200 group relative text-gray-600 hover:bg-red-50 hover:text-red-600"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <span className="text-lg flex-shrink-0 text-gray-500 group-hover:text-red-600">
            <FaSignOutAlt />
          </span>

          {isOpen && <span className="ml-3 font-medium">Logout</span>}

          {/* Tooltip for collapsed state */}
          {!isOpen && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
