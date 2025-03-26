import { useState } from "react";
import { NavLink } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi"; // Import icons
import styles from "../css/Navigation.module.css";
import logo from "../assets/stumart.jpeg"

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <NavLink to="/" className={styles.logo}>
          <img className={styles.imgLogo} src={logo} alt="StuMart" />
          StuMart
        </NavLink>

        <button className={styles.menuButton} onClick={toggleMenu}>
          {isMenuOpen ? <HiX size={32} /> : <HiMenu size={32} />}
        </button>

        <div
          className={`${styles.navLinks} ${
            isMenuOpen ? styles.navLinksActive : ""
          }`}
        >
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
            onClick={() => setIsMenuOpen(false)}
          >
            About
          </NavLink>
          <NavLink
            to="/rider"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Rider
          </NavLink>
          <NavLink
            to="/vendors"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Vendors
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
            onClick={() => setIsMenuOpen(false)}
          >
            Contact Us
          </NavLink>

          <div className={styles.authButtons}>
            <NavLink to="/login" className={styles.buttonOutline}>
              Login
            </NavLink>
            <NavLink to="/register" className={styles.buttonFilled}>
              Register
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
