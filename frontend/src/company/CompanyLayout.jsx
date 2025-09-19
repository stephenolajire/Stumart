import { useState } from "react";
import CompanySidebar from "./CompanySidebar";
import { Outlet } from "react-router-dom";
import { Menu, Heart, Store } from "lucide-react";

const CompanyLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const openSidebar = () => setSidebarOpen(true);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="flex h-screen bg-gray-50">
      <CompanySidebar sidebarOpen={sidebarOpen} closeSidebar={closeSidebar} />

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-white shadow-sm">
          <button
            onClick={openSidebar}
            className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center">
            <Store className="w-8 h-8 text-green-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">
              Stumart
            </span>
          </div>
          <div className="w-10"></div>
        </div>

        <main className="flex-1 overflow-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default CompanyLayout;
