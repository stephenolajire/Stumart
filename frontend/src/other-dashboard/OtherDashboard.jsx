import React, { useState } from "react";
import Sidebar from "./SideBar";
import Home from "./Home";
import Applications from "./Applications";
import Reviews from "./Reviews";
import Settings from "./Settings";
import Message from "./VendorMessages";
import Subscriptions from "./Subscriptions";
import ThemeToggle from "../components/ThemeToggle";
import { Menu, X } from "lucide-react";

const OtherDashboard = ({ vendor }) => {
  const [activeTab, setActiveTab] = useState("home");
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  // Render the appropriate component based on the active tab
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return <Home vendor={vendor} />;
      case "applications":
        return <Applications vendor={vendor} />;
      case "subscription":
        return <Subscriptions />;
      case "reviews":
        return <Reviews vendor={vendor} />;
      case "settings":
        return <Settings vendor={vendor} />;
      case "chat":
        return <Message />;
      default:
        return <Home vendor={vendor} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="hidden lg:flex">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          vendor={vendor}
          toggleMenu={toggleMenu}
        />
      </div>

      {/* Theme Toggle - Fixed Position */}
      <div className="fixed bottom-8 right-8 z-50">
        <ThemeToggle />
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-gray-50">
        <div className="fixed top-7 right-5">
          {isOpen ? <X onClick={toggleMenu} /> : <Menu onClick={toggleMenu} />}
        </div>
        <div className="flex lg:hidden absolute z-1000 top-0 left-0">
          {isOpen && (
            <Sidebar
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              vendor={vendor}
              toggleMenu={toggleMenu}
            />
          )}
        </div>
        <div className="min-h-full">{renderContent()}</div>
      </main>
    </div>
  );
};

export default OtherDashboard;
