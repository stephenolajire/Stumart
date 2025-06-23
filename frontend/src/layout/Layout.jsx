import React, { useState, useContext, useMemo } from "react";
import Navigation from "../components/nav/Navigation";
import Footer from "../components/nav/Footer";
import { Outlet } from "react-router-dom";
import { FaPlayCircle, FaTimes, FaComments } from "react-icons/fa";
import Chatbot from "../chatbot/Chatbot";
import styles from "../css/Layout.module.css";
import { GlobalContext } from "../constant/GlobalContext";

const Layout = () => {
  const [showModal, setShowModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Use TanStack Query hook for videos
  const { useVideos } = useContext(GlobalContext);
  const {
    data: videos = {},
    isLoading: videosLoading,
    isError: videosError,
    error: videosErrorDetails,
  } = useVideos();

  const toggleModal = () => {
    setShowModal(!showModal);
    if (showVideoModal) setShowVideoModal(false);
  };

  const toggleChat = () => setIsChatOpen(!isChatOpen);

  const handleVideoSelect = (video) => {
    setSelectedVideo(video);
    setShowModal(false);
    setShowVideoModal(true);
  };

  // Memoize video options to avoid unnecessary recalculations
  const videoOptions = useMemo(() => {
    if (!videos.register_video && !videos.product_video) {
      return [];
    }

    return [
      {
        title: "Register as Vendor",
        video: videos.register_video?.video_secure_url,
      },
      {
        title: "Register as Picker",
        video: videos.register_video?.video_secure_url,
      },
      {
        title: "Register as Customer",
        video: videos.register_video?.video_secure_url,
      },
      {
        title: "Add Product Tutorial",
        video: videos.product_video?.video_secure_url,
      },
    ].filter((option) => option.video); // Filter out options without video URLs
  }, [videos]);

  return (
    <div className={styles.layoutWrapper}>
      <Navigation />
      <Outlet />
      <Footer />

      <Chatbot />

      {/* Learn More Button */}
      <button
        className={styles.learnMoreBtn}
        onClick={toggleModal}
        aria-label="Learn how to use platform"
      >
        <FaPlayCircle size={24} />
      </button>

      {/* Selection Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={toggleModal}>
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={toggleModal}
              aria-label="Close selection"
            >
              <FaTimes />
            </button>
            <div className={styles.optionsGrid}>
              {videosLoading ? (
                <div>Loading videos...</div>
              ) : videosError ? (
                <div>Error loading videos. Please try again later.</div>
              ) : videoOptions.length > 0 ? (
                videoOptions.map((option, index) => (
                  <button
                    key={index}
                    className={styles.optionButton}
                    onClick={() => handleVideoSelect(option.video)}
                    disabled={!option.video}
                  >
                    <FaPlayCircle className={styles.optionIcon} />
                    <span>{option.title}</span>
                  </button>
                ))
              ) : (
                <div>No videos available at the moment.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowVideoModal(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeBtn}
              onClick={() => setShowVideoModal(false)}
              aria-label="Close video"
            >
              <FaTimes />
            </button>
            <div className={styles.videoWrapper}>
              <video controls autoPlay>
                <source src={selectedVideo} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
