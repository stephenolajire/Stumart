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
          {isMenuOpen ? <HiX size={24} /> : <HiMenu size={24} />}
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
          >
            Home
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
          >
            About
          </NavLink>
          <NavLink
            to="/rider"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
          >
            Service
          </NavLink>
          <NavLink
            to="/vendors"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
          >
            Vendors
          </NavLink>
          <NavLink
            to="/vendors"
            className={({ isActive }) =>
              isActive ? `${styles.link} ${styles.activeLink}` : styles.link
            }
          >
            Vendors
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
