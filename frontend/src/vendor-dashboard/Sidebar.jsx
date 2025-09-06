import React from "react";
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

const Sidebar = ({ activeTab, setActiveTab, toggleMenu }) => {
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

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto z-30 shadow-xl">
      <div className="p-6 border-b border-gray-700">
        <h2 className="text-2xl font-bold text-yellow-400">Vendor Dashboard</h2>
      </div>
      <nav className="mt-6">
        {sidebarItems.map((item) => (
          <div
            key={item.id}
            className={`flex items-center px-6 py-3 mx-2 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
              activeTab === item.id
                ? "bg-yellow-500 text-gray-900 shadow-md transform scale-105"
                : "text-gray-300 hover:bg-gray-800 hover:text-white hover:transform hover:translate-x-1"
            }`}
            onClick={() => {setActiveTab(item.id), toggleMenu()}}
          >
            <span
              className={`text-lg mr-3 ${
                activeTab === item.id ? "text-gray-900" : "text-gray-400"
              }`}
            >
              {item.icon}
            </span>
            <span
              className={`font-medium ${
                activeTab === item.id ? "text-gray-900" : ""
              }`}
            >
              {item.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Bottom branding */}
      <div className="absolute bottom-4 left-6 right-6">
        <div className="text-xs text-gray-500 text-center border-t border-gray-700 pt-4">
          <p>© 2024 Vendor Portal</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
