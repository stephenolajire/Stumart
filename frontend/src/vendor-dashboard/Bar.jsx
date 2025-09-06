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
import { Menu, X } from "lucide-react";
import api from "../constant/api";

const Bar = ({ activeTab, isOpen, toggleMenu }) => {
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
    <div className="bg-white shadow-md border-b border-gray-200 px-6 py-4 fixed top-0 right-0 lg:left-64 left-0 z-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">
          {getTabLabel(activeTab)}
        </h1>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 border-2 border-yellow-400">
            {details.image ? (
              <img
                src={details.image}
                alt="Vendor"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-yellow-100">
                <FaUser className="text-yellow-600 text-lg" />
              </div>
            )}
          </div>
          <span className="text-gray-700 font-medium hidden md:flex">
            {details.name || "Vendor Name"}
          </span>
          <div className="flex lg:hidden">
            {isOpen ? (
              <X onClick={()=> {toggleMenu()}}/>
            ): (
              <Menu onClick={()=> {toggleMenu()}}/>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Bar;
