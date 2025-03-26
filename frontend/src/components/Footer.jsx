import { NavLink } from 'react-router-dom';
import styles from '../css/Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerGrid}>
          {/* Company Info */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>StuMart</h3>
            <p className={styles.description}>
              Your one-stop marketplace for campus commerce, connecting students with local vendors.
            </p>
          </div>

          {/* Quick Links */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Quick Links</h3>
            <ul className={styles.linkList}>
              <li><NavLink to="/">Home</NavLink></li>
              <li><NavLink to="/shop">Shop</NavLink></li>
              <li><NavLink to="/vendors">Vendors</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
            </ul>
          </div>

          {/* Services */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Services</h3>
            <ul className={styles.linkList}>
              <li><NavLink to="/become-vendor">Become a Vendor</NavLink></li>
              <li><NavLink to="/become-rider">Become a Rider</NavLink></li>
              <li><NavLink to="/track-order">Track Order</NavLink></li>
              <li><NavLink to="/support">Support</NavLink></li>
            </ul>
          </div>

          {/* Contact */}
          <div className={styles.footerSection}>
            <h3 className={styles.sectionTitle}>Contact Us</h3>
            <ul className={styles.contactList}>
              <li>Email: support@stumart.com</li>
              <li>Phone: +234 123 456 7890</li>
              <li>Address: Your University Campus</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className={styles.bottomBar}>
          <p>&copy; {new Date().getFullYear()} StuMart. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;