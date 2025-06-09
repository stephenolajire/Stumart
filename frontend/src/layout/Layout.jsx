import React, { useState, useEffect } from "react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { Outlet } from "react-router-dom";
import { FaPlayCircle, FaTimes, FaComments } from "react-icons/fa";
import Chatbot from "../chatbot/Chatbot";
import styles from "../css/Layout.module.css";
// import vendorReg from "../assets/registration.mp4"
// import pickerReg from "../assets/registration.mp4";
// import customerReg from "../assets/registration.mp4";
// import addProduct from "../assets/addproduct.mp4";
import api from "../constant/api";

const Layout = () => {
  const [showModal, setShowModal] = useState(false);

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [videos, setVideos] = useState({})

  const vendorReg = videos.register_video.video_secure_url
  const pickerReg = videos.register_video.video_secure_url;
  const customerReg = videos.register_video.video_secure_url;
  const addProduct = videos.product_video.video_secure_url;

 const fetchVideos = async() => {
  const response = await api.get('videos/both/')
  if (response.data) {
    setVideos(response.data)
    console.log(response.data)
  }
 }

 useEffect(()=> {
  fetchVideos()
 }, [])

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

  const videoOptions = [
    { title: "Register as Vendor", video: vendorReg },
    { title: "Register as Picker", video: pickerReg },
    { title: "Register as Customer", video: customerReg },
    { title: "Add Product Tutorial", video: addProduct },
  ];

  return (
    <div className={styles.layoutWrapper}>
      <Navigation />
      <Outlet />
      <Footer />

      <Chatbot/>

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
              {videoOptions.map((option, index) => (
                <button
                  key={index}
                  className={styles.optionButton}
                  onClick={() => handleVideoSelect(option.video)}
                >
                  <FaPlayCircle className={styles.optionIcon} />
                  <span>{option.title}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && selectedVideo && (
        <div className={styles.modalOverlay} onClick={() => setShowVideoModal(false)}>
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