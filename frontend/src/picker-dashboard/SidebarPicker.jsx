import React from "react";
import {
  Home,
  ClipboardList,
  Truck,
  DollarSign,
  Star,
  Settings,
  LogOut,
} from "lucide-react";

const SidebarPicker = ({ activeView, onViewChange, toggleMenu }) => {
  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    window.location.href = "/login";
  };

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Home },
    { id: "availableOrders", label: "Available Orders", icon: ClipboardList },
    { id: "myDeliveries", label: "My Deliveries", icon: Truck },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "reviews", label: "Reviews", icon: Star },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="h-screen w-64 bg-black text-white flex flex-col shadow-2xl">
      {/* Logo Section */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-500rounded-lg flex items-center justify-center shadow-lg">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-yellow-500">StuMart</h1>
            <p className="text-xs text-gray-400">Delivery Partner</p>
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => {
                    onViewChange(item.id);
                    toggleMenu?.();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 group relative
                    ${
                      isActive
                        ? "bg-yellow-500shadow-lg shadow-teal-500/25"
                        : "hover:bg-gray-900"
                    }
                  `}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full" />
                  )}

                  {/* Icon */}
                  <IconComponent
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive
                        ? "text-white"
                        : "text-gray-400 group-hover:text-yellow-500group-hover:scale-110"
                    }`}
                  />

                  {/* Label */}
                  <span
                    className={`flex-1 text-left font-medium text-sm ${
                      isActive
                        ? "text-white"
                        : "text-gray-300 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Section */}
      <div className="p-4 border-t border-slate-700/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg
            bg-slate-800/50 hover:bg-red-600/20 border border-slate-700 hover:border-red-500/50
            transition-all duration-200 group"
        >
          <LogOut className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
          <span className="flex-1 text-left font-medium text-sm text-slate-300 group-hover:text-red-400 transition-colors">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
};

export default SidebarPicker;
