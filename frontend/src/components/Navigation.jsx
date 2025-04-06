import { useContext, useState } from "react";
import { Link, Navigate, NavLink, useNavigate } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi"; // Import icons
import styles from "../css/Navigation.module.css";
// import { FaCarAlt } from "react-icons/fa";
import { FaCartPlus } from "react-icons/fa";
import logo from "../assets/stumart.jpeg";
import { GlobalContext } from "../constant/GlobalContext";

const Navigation = () => {
  const navigate = useNavigate();

  const { isAuthenticated, count } = useContext(GlobalContext);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
    window.location.reload();
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <NavLink to="/" className={styles.logo}>
          <img className={styles.imgLogo} src={logo} alt="StuMart" />
        </NavLink>

        <div style={{display:"flex", flexDirection:"row"}}>
          <Link to="shopping-cart">
            <FaCartPlus
              className={styles.cartIcon}
              size={26}
              style={{
                color: "black",
                marginTop: "0.3rem",
                marginRight: "2rem",
              }}
            />
            <div className={styles.countDiv}>
              <p className={styles.count}>{count}</p>
            </div>
          </Link>
          <button className={styles.menuButton} onClick={toggleMenu}>
            {isMenuOpen ? <HiX size={32} /> : <HiMenu size={32} />}
          </button>
        </div>

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

          {isAuthenticated ? (
            <div className={styles.authButtons}>
              <NavLink className={styles.buttonFilled} onClick={handleLogout}>
                Logout
              </NavLink>
            </div>
          ) : (
            <div className={styles.authButtons}>
              <NavLink to="/login" className={styles.buttonOutline}>
                Login
              </NavLink>
              <NavLink to="/register" className={styles.buttonFilled}>
                Register
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;