import { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { FaStore, FaMoneyBillWave, FaUsers, FaTruck, FaChartLine, FaShieldAlt } from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import styles from '../css/Vendor.module.css';

const Vendors = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  return (
    <div className={styles.vendorContainer}>
      <section className={styles.hero}>
        <div className={styles.container} data-aos="fade-up">
          <h1>Become a StuMart Vendor</h1>
          <p>Expand your business reach across campus and connect with thousands of students</p>
          <NavLink to="/register" className={styles.ctaButton}>
            Start Selling Today
          </NavLink>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.container}>
          <h2 data-aos="fade-up">Why Sell on StuMart?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="100">
              <FaUsers className={styles.icon} />
              <h3>Access Student Market</h3>
              <p>Connect directly with thousands of students on campus looking for your products</p>
            </div>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="200">
              <FaTruck className={styles.icon} />
              <h3>Easy Delivery</h3>
              <p>Our network of student pickers handles all deliveries, so you can focus on your products</p>
            </div>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="300">
              <FaMoneyBillWave className={styles.icon} />
              <h3>Quick Payments</h3>
              <p>Receive payments directly to your account within 24-48 hours</p>
            </div>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="400">
              <FaChartLine className={styles.icon} />
              <h3>Business Growth</h3>
              <p>Access analytics and insights to help grow your campus business</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.howItWorks}>
        <div className={styles.container}>
          <h2 data-aos="fade-up">How It Works</h2>
          <div className={styles.steps}>
            <div className={styles.step} data-aos="fade-right" data-aos-delay="100">
              <div className={styles.stepNumber}>1</div>
              <h3>Register</h3>
              <p>Sign up as a vendor and complete your business profile</p>
            </div>
            <div className={styles.step} data-aos="fade-right" data-aos-delay="200">
              <div className={styles.stepNumber}>2</div>
              <h3>List Products</h3>
              <p>Add your products with photos, descriptions, and prices</p>
            </div>
            <div className={styles.step} data-aos="fade-right" data-aos-delay="300">
              <div className={styles.stepNumber}>3</div>
              <h3>Receive Orders</h3>
              <p>Get notified instantly when students place orders</p>
            </div>
            <div className={styles.step} data-aos="fade-right" data-aos-delay="400">
              <div className={styles.stepNumber}>4</div>
              <h3>Fulfill & Earn</h3>
              <p>Prepare orders for pickup by our student pickers</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.requirements} data-aos="fade-up">
        <div className={styles.container}>
          <h2>Requirements</h2>
          <div className={styles.requirementsList}>
            <div className={styles.requirement}>
              <FaStore className={styles.icon} />
              <div>
                <h3>Business Information</h3>
                <p>Valid business name and registration details</p>
              </div>
            </div>
            <div className={styles.requirement}>
              <FaShieldAlt className={styles.icon} />
              <div>
                <h3>Verification</h3>
                <p>Government-issued ID and proof of business ownership</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.pricing} data-aos="fade-up">
        <div className={styles.container}>
          <h2>Pricing & Fees</h2>
          <div className={styles.pricingDetails}>
            <div className={styles.fee}>
              <h3>Registration Fee</h3>
              <p>₦0</p>
              <span>Free to join</span>
            </div>
            <div className={styles.fee}>
              <h3>Commission Rate</h3>
              <p>10%</p>
              <span>Per successful order</span>
            </div>
            <div className={styles.fee}>
              <h3>Payout Timeline</h3>
              <p>24-48hrs</p>
              <span>After order completion</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faq} data-aos="fade-up">
        <div className={styles.container}>
          <h2>Frequently Asked Questions</h2>
          <div className={styles.questions}>
            <div className={styles.question}>
              <h3>How long does verification take?</h3>
              <p>Verification typically takes 1-2 business days after submitting all required documents.</p>
            </div>
            <div className={styles.question}>
              <h3>What products can I sell?</h3>
              <p>You can sell any legal products suitable for students, including food, fashion, electronics, and academic materials.</p>
            </div>
            <div className={styles.question}>
              <h3>How do I receive payments?</h3>
              <p>Payments are automatically transferred to your registered bank account within 24-48 hours of order completion.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta} data-aos="zoom-in">
        <div className={styles.container}>
          <h2>Ready to Start Selling?</h2>
          <p>Join our growing community of campus vendors today</p>
          <NavLink to="/register" className={styles.ctaButton}>
            Become a Vendor
          </NavLink>
        </div>
      </section>
    </div>
  );
};

export default Vendors;