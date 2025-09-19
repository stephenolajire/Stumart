import {
  Heart,
  X,
  Home,
  User,
  MessageCircle,
  HeartHandshake,
  LogOut,
  Clock,
  Bed,
  Store,
  TrendingUp,
  Package,
  LassoSelect,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";

const CompanySidebar = ({ sidebarOpen, closeSidebar }) => {
  const navigationItems = [
    { name: "Dashboard", href: "/company/", icon: Home },
    // { name: "Analytics", href: "/company/analytics", icon: TrendingUp },
    { name: "Orders", href: "/company/order", icon: Package },
    { name: "Pickers", href: "/company/picker", icon: LassoSelect },
    { name: "Deliveries", href: "/company/deliveries", icon: Truck },
  ];

  const [isActive, setIsActive] = useState(false);

  const handleActive = (active) => {
    setIsActive(active);
  };

  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("refresh");
    localStorage.removeItem("access");
    navigate("/login");
  };

  return (
    <div
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <div className="flex items-center">
          <Store className="w-8 h-8 text-yellow-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">Stumart</span>
        </div>
        <button
          onClick={closeSidebar}
          className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 lg:hidden"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* User Profile Section */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">John Doe</p>
            <p className="text-xs text-gray-500">Delivery Company</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="mt-4 px-2">
        <div className="space-y-1">
          {navigationItems.map((item) => (
            <NavLink
              onClick={() => {
                handleActive(true), closeSidebar();
              }}
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-yellow-50 text-yellow-700 border-r-4 border-yellow-600"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`
              }
            >
              <item.icon
                className={`mr-3 h-5 w-5 transition-colors ${
                  isActive
                    ? "text-yellow-600"
                    : "text-gray-400 group-hover:text-gray-500"
                }`}
              />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom section */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="group flex w-full items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-gray-500" />
          Sign out
        </button>
      </div>
    </div>
  );
};

export default CompanySidebar;
