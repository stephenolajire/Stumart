import { useState } from "react";
import {
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaInstagram,
  FaTwitter,
  FaTiktok,
} from "react-icons/fa";
import styles from "../css/Contact.module.css";
import api from "../constant/api";
import Swal from "sweetalert2";
import Header from "../components/Header";
import SEO from "../components/Metadata";

const Contact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [status, setStatus] = useState({
    submitted: false,
    submitting: false,
    info: { error: false, msg: null },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus((prevStatus) => ({ ...prevStatus, submitting: true }));

    try {
      const response = await api.post("contact/", formData);

      if (response.status === 201) {
        setStatus({
          submitted: true,
          submitting: false,
          info: { error: false, msg: "Message sent successfully!" },
        });

        // Reset form
        setFormData({
          name: "",
          email: "",
          subject: "",
          message: "",
        });

        Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Your message has been sent successfully.",
        });
      }
    } catch (error) {
      setStatus({
        submitted: false,
        submitting: false,
        info: {
          error: true,
          msg:
            error.response?.data?.message ||
            "Failed to send message. Please try again.",
        },
      });

      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to send message. Please try again.",
      });
    }
  };

  return (
    <div className={styles.contactContainer} style={{ marginTop: "2.5rem" }}>
      <SEO
        title="Contact Us - StuMart | Get Help & Support"
        description="Contact StuMart support team for help with your campus marketplace experience. Get in touch via email, phone, or social media. We're here to assist with orders, vendor inquiries, and technical support."
        keywords="stumart contact, campus marketplace support, student marketplace help, contact stumart team, stumart customer service, campus marketplace contact, student support, university marketplace help, stumart email, stumart phone, campus delivery support, student marketplace customer service, stumart assistance, contact us stumart"
        url="/contact"
      />
      <section className={styles.hero}>
        <div className={styles.container}>
          <h1>Contact Us</h1>
          <p style={{ marginBottom: "2rem" }}>
            Get in touch with our support team
          </p>
        </div>
      </section>

      <section className={styles.contactSection} style={{ marginTop: "-3rem" }}>
        <div className={styles.container}>
          <div className={styles.contactGrid}>
            <div className={styles.contactInfo}>
              <h2>Get In Touch</h2>
              <p>Have questions about StuMart? We're here to help!</p>

              <div className={styles.infoItems}>
                <div className={styles.infoItem}>
                  <FaEnvelope className={styles.icon} />
                  <div>
                    <h3>Email</h3>
                    <p>stumartstorejv@gmail.com</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <FaPhone className={styles.icon} />
                  <div>
                    <h3>Phone</h3>
                    <p>+234 800 STUMART</p>
                  </div>
                </div>

                <div className={styles.infoItem}>
                  <FaMapMarkerAlt className={styles.icon} />
                  <div>
                    <h3>Office</h3>
                    <p>Student Union Building, Main Campus</p>
                  </div>
                </div>
              </div>

              <div className={styles.socialLinks}>
                <h3>Follow Us</h3>
                <div className={styles.socialIcons}>
                  {/* <a
                    href="https://wa.me/234XXXXXXXXX"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaWhatsapp />
                  </a> */}
                  <a
                    href="https://www.instagram.com/stumart.store?igsh=MWQzNnQ3dmVtaWVjdA=="
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram />
                  </a>
                  {/* <a
                    href="https://twitter.com/stumart"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTwitter />
                  </a> */}
                  <a
                    href="https://www.tiktok.com/@stumart6?_t=ZM-8wbSLyqeS3S&_r=1"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTiktok />
                  </a>
                </div>
              </div>
            </div>

            <div className={styles.contactForm}>
              <h2>Send Us a Message</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label htmlFor="name">Full Name</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="subject">Subject</label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className={styles.submitButton}
                  disabled={status.submitting}
                >
                  {status.submitting ? "Sending..." : "Send Message"}
                </button>

                {status.info.msg && (
                  <div
                    className={`${styles.message} ${
                      status.info.error ? styles.error : styles.success
                    }`}
                  >
                    {status.info.msg}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Contact;
