import React, { useState, useContext, useMemo } from "react";
import Footer from "../components/nav/Footer";
import { Outlet } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";
import Navigation from "../pages/components/DesktopNav";
import Sidebar from "../pages/components/Sidebar";
import MobileNav from "../pages/components/MobileNav";

const Layout = () => {
  const [showModal, setShowModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  return (
    <div className="hide-scrollbar">
      <div className="flex flex-row bg-gray-100">
        {/* Sidebar */}
        <div className="w-[250px] hidden lg:flex max-h-screen fixed top-0 left-0">
          <Sidebar />
        </div>

        {/* Main content column */}
        <div className="flex-1 min-w-0 lg:ml-[250px] flex flex-col">
          {/* Fixed top nav */}
          <div className="fixed top-0 right-0 left-0 lg:left-[250px] z-50 bg-white">
            <Navigation />
            <MobileNav />
          </div>

          {/* Page content — pushed below the fixed nav */}
          <div className="mt-[116px] w-full min-w-0 overflow-x-hidden">
            <Outlet />
          </div>

          <Footer />
        </div>
      </div>
    </div>
  );
};

export default Layout;
