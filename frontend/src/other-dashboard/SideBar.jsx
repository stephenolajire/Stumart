import React from "react";
import { MEDIA_BASE_URL } from "../constant/api";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  FileText,
  Star,
  MessageCircle,
  Settings,
  LogOut,
  User,
  Store,
} from "lucide-react";

const Sidebar = ({ activeTab, setActiveTab, vendor, toggleMenu }) => {
  const navigation = [
    { id: "home", label: "Dashboard", icon: BarChart3 },
    { id: "applications", label: "Applications", icon: FileText },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "chat", label: "Messages", icon: MessageCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/login");
  };

  return (
    <div className=" w-70 lg:w-80 bg-white shadow-2xl border-r border-gray-200 flex flex-col h-screen">
      {/* Vendor Header */}
      <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-8 text-white">
        <div className="flex flex-col items-center">
          {/* Vendor Logo */}
          <div className="w-20 h-20 rounded-full overflow-hidden mb-4 ring-4 ring-white ring-opacity-30 shadow-lg">
            {vendor?.shop_image ? (
              <img
                src={`${MEDIA_BASE_URL}${vendor.shop_image}`}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-full h-full bg-white bg-opacity-20 flex items-center justify-center text-2xl font-bold ${
                vendor?.shop_image ? "hidden" : "flex"
              }`}
            >
              {vendor?.business_name
                ? vendor.business_name.charAt(0).toUpperCase()
                : "V"}
            </div>
          </div>

          {/* Vendor Info */}
          <div className="text-center">
            <h3 className="text-xl font-bold mb-1 line-clamp-2">
              {vendor?.business_name || "Vendor Dashboard"}
            </h3>
            <div className="flex items-center justify-center">
              <Store className="w-4 h-4 mr-2 text-yellow-100" />
              <p className="text-yellow-100 text-sm capitalize">
                {vendor?.specific_category?.replace("_", " ") || "Business"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6">
        <ul className="space-y-2 px-4">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;

            return (
              <li key={item.id}>
                <button
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-yellow-50 text-yellow-700 shadow-md border-l-4 border-yellow-500"
                      : "text-gray-700 hover:bg-gray-50 hover:text-yellow-600"
                  }`}
                  onClick={() => {setActiveTab(item.id), toggleMenu()}}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 transition-colors ${
                      isActive
                        ? "bg-yellow-100"
                        : "bg-gray-100 group-hover:bg-yellow-50"
                    }`}
                  >
                    <IconComponent
                      className={`w-5 h-5 ${
                        isActive
                          ? "text-yellow-600"
                          : "text-gray-500 group-hover:text-yellow-500"
                      }`}
                    />
                  </div>
                  <span
                    className={`font-medium ${isActive ? "font-semibold" : ""}`}
                  >
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-yellow-500 rounded-full"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <button
          className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group"
          onClick={handleLogout}
        >
          <div className="w-10 h-10 rounded-lg bg-red-100 group-hover:bg-red-200 flex items-center justify-center mr-4 transition-colors">
            <LogOut className="w-5 h-5 text-red-600" />
          </div>
          <span className="font-medium">Log Out</span>
        </button>

        {/* Vendor Badge */}
        {/* <div className="mt-4 bg-white rounded-lg p-3 border border-gray-200">
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-xs text-gray-500">Logged in as</span>
          </div>
          <p className="text-sm font-medium text-gray-700 mt-1 truncate">
            Vendor Account
          </p>
        </div> */}
      </div>
    </div>
  );
};

export default Sidebar;
