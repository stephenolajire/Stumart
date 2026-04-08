import React, { useState, useContext, useMemo } from "react";
// import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";
import { Outlet } from "react-router-dom";
// import { FaPlayCircle, FaTimes, FaComments } from "react-icons/fa";
// import Chatbot from "../chatbot/Chatbot";
// import styles from "../css/Layout.module.css";
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
      <div className="flex flex-row gap-10 bg-gray-100">
        <div className="w-[250px] hidden lg:flex max-h-screen fixed">
          <Sidebar />
        </div>
        <div className="flex-1 lg:ml-[250px]">
          <div className="fixed z-1000 flex-1 w-full bg-white">
            <Navigation />
            <MobileNav />
          </div>
          <div className="lg:mt-29">
            <Outlet />
          </div>
        </div>
      </div>
      <div className="flex-1 lg:ml-[250px] ">
        <Footer />
      </div>
    </div>
  );
};

export default Layout;
