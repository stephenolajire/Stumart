import React, { useState } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { FaPlayCircle, FaTimes } from "react-icons/fa";
import styles from "./Layout.module.css";

const Layout = () => {
  const [showModal, setShowModal] = useState(false);

  const toggleModal = () => setShowModal(!showModal);

  return (
    <div className={styles.layoutWrapper}>
      <Navigation />
      <Outlet />
      <Footer />

      {/* Learn More Button */}
      <button
        className={styles.learnMoreBtn}
        onClick={toggleModal}
        aria-label="Learn how to use platform"
      >
        <FaPlayCircle /> Learn More
      </button>

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
