import React, { useState } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { FaPlayCircle, FaTimes, FaComments } from "react-icons/fa";
import Chatbot from "../chatbot/Chatbot";
import styles from "../css/Layout.module.css";
// import ThemeToggle from "../components/ThemeToggle";

const Layout = () => {
  const [showModal, setShowModal] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const toggleModal = () => setShowModal(!showModal);
  const toggleChat = () => setIsChatOpen(!isChatOpen);

  return (
    <div className={styles.layoutWrapper}>
      <Navigation />
      <Outlet />
      <Footer />
      {/* <ThemeToggle/> */}
      {/* Learn More Button */}
      <button
        className={styles.learnMoreBtn}
        onClick={toggleModal}
        aria-label="Learn how to use platform"
      >
        <FaPlayCircle  size={24}/>
      </button>

      <div
        className={`${styles.chatContainer} ${
          isChatOpen ? styles.open : ""
        }`}
      >
        <Chatbot />
      </div>

      {/* Video Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={toggleModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={toggleModal}
              aria-label="Close tutorial"
            >
              <FaTimes />
            </button>
            <div className={styles.videoWrapper}>
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&rel=0&modestbranding=1"
                title="Platform Tutorial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
