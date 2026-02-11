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
import { NavLink, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();

  const menuItems = [
    { path: "/admin-dashboard", label: "Dashboard", icon: <FaChartBar /> },
    {
      path: "/admin-dashboard/users",
      label: "Manage Users",
      icon: <FaUsers />,
    },
    {
      path: "/admin-dashboard/vendors",
      label: "Manage Vendors",
      icon: <FaStore />,
    },
    {
      path: "/admin-dashboard/pickers",
      label: "Manage Pickers",
      icon: <FaTruck />,
    },
    { path: "/admin-dashboard/orders", label: "Orders", icon: <FaBox /> },
    {
      path: "/admin-dashboard/payments",
      label: "Payments",
      icon: <FaMoneyBillWave />,
    },
    {
      path: "/admin-dashboard/kyc",
      label: "KYC Verification",
      icon: <FaSearch />,
    },
    {
      path: "/admin-dashboard/utilities",
      label: "Utilities",
      icon: <FaChartLine />,
    },
    {
      path: "/admin-dashboard/referrals",
      label: "Referrals",
      icon: <FaChartLine />,
    },
  ];

  const handleLogout = async () => {
    try {
      const result = await Swal.fire({
        title: "Confirm Logout",
        text: "Are you sure you want to logout?",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: "#111827",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Yes, logout",
        cancelButtonText: "Cancel",
      });

      if (result.isConfirmed) {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        await Swal.fire({
          title: "Logged Out",
          text: "You have been successfully logged out",
          icon: "success",
          confirmButtonColor: "#111827",
          timer: 2000,
        });

        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Logout error:", error);
      Swal.fire({
        title: "Logout Failed",
        text: "Please try again",
        icon: "error",
        confirmButtonColor: "#111827",
      });
    }
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when clicking a link
    if (window.innerWidth < 1024 && isOpen) {
      toggleSidebar();
    }
  };

  return (
    <div
      className={`h-full bg-white border-r border-gray-200 flex flex-col ${
        isOpen ? "w-64" : "w-20"
      } transition-all duration-300`}
    >
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        {isOpen ? (
          <div className="text-center">
            <h2 className="text-gray-900 font-bold text-xl tracking-tight">
              STUMART
            </h2>
            <p className="text-xs text-gray-500 font-medium">Admin Panel</p>
          </div>
        ) : (
          <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
            <h2 className="text-white font-bold text-xl" title="STUMART Admin">
              S
            </h2>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav
        className="flex-1 py-4 overflow-y-auto"
        role="navigation"
        aria-label="Main navigation"
      >
        <ul className="space-y-1 px-3">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                end={item.path === "/admin-dashboard"}
                onClick={handleLinkClick}
                className={({ isActive }) =>
                  `w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                    isActive
                      ? "bg-gray-900 text-white"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`text-base shrink-0 ${
                        isActive
                          ? "text-white"
                          : "text-gray-500 group-hover:text-gray-700"
                      }`}
                    >
                      {item.icon}
                    </span>

                    {isOpen && (
                      <span className="ml-3 font-medium text-sm truncate">
                        {item.label}
                      </span>
                    )}

                    {/* Tooltip for collapsed state */}
                    {!isOpen && (
                      <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
                        {item.label}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer - Logout */}
      <div className="border-t border-gray-200 p-3">
        <button
          className="w-full flex items-center px-3 py-2.5 rounded-lg text-left transition-all duration-200 group relative text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          onClick={handleLogout}
          aria-label="Logout"
        >
          <span className="text-base shrink-0 text-gray-500 group-hover:text-gray-700">
            <FaSignOutAlt />
          </span>

          {isOpen && <span className="ml-3 font-medium text-sm">Logout</span>}

          {/* Tooltip for collapsed state */}
          {!isOpen && (
            <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 shadow-lg">
              Logout
            </div>
          )}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
