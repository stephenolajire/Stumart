import { useEffect } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { 
  FaBicycle, 
  FaMoneyBillWave, 
  FaClock, 
  FaRoute, 
  FaUserGraduate, 
  FaShieldAlt,
  FaMapMarkedAlt
} from 'react-icons/fa';
import AOS from 'aos';
import 'aos/dist/aos.css';
import styles from '../css/Rider.module.css';

const Rider = () => {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <div className={styles.riderContainer}>
      <section className={styles.hero}>
        <div className={styles.container} data-aos="fade-up">
          <h1>Become a Campus Picker</h1>
          <p>Earn money by delivering to fellow students while maintaining flexibility with your studies</p>
          <NavLink to="/register" className={styles.ctaButton}>
            Join as Picker
          </NavLink>
        </div>
      </section>

      <section className={styles.benefits}>
        <div className={styles.container}>
          <h2 data-aos="fade-up">Why Become a Picker?</h2>
          <div className={styles.benefitsGrid}>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="100">
              <FaClock className={styles.icon} />
              <h3>Flexible Hours</h3>
              <p>Choose your own schedule that fits around your classes</p>
            </div>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="200">
              <FaMoneyBillWave className={styles.icon} />
              <h3>Quick Earnings</h3>
              <p>Get paid weekly with competitive delivery rates plus tips</p>
            </div>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="300">
              <FaUserGraduate className={styles.icon} />
              <h3>Student-Friendly</h3>
              <p>Perfect part-time work for students with minimal time commitment</p>
            </div>
            <div className={styles.benefitCard} data-aos="fade-up" data-aos-delay="400">
              <FaMapMarkedAlt className={styles.icon} />
              <h3>Campus Territory</h3>
              <p>Operate within familiar campus environment and nearby areas</p>
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
              <h3>Sign Up</h3>
              <p>Register as a picker and complete verification</p>
            </div>
            <div className={styles.step} data-aos="fade-right" data-aos-delay="200">
              <div className={styles.stepNumber}>2</div>
              <h3>Choose Schedule</h3>
              <p>Set your available hours and preferred delivery zones</p>
            </div>
            <div className={styles.step} data-aos="fade-right" data-aos-delay="300">
              <div className={styles.stepNumber}>3</div>
              <h3>Accept Orders</h3>
              <p>Receive delivery requests through the app</p>
            </div>
            <div className={styles.step} data-aos="fade-right" data-aos-delay="400">
              <div className={styles.stepNumber}>4</div>
              <h3>Deliver & Earn</h3>
              <p>Complete deliveries and earn money</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.requirements} data-aos="fade-up">
        <div className={styles.container}>
          <h2>Requirements</h2>
          <div className={styles.requirementsList}>
            <div className={styles.requirement}>
              <FaUserGraduate className={styles.icon} />
              <div>
                <h3>Student Status</h3>
                <p>Must be an enrolled student with valid student ID</p>
              </div>
            </div>
            <div className={styles.requirement}>
              <FaBicycle className={styles.icon} />
              <div>
                <h3>Transportation</h3>
                <p>Own or have access to a bicycle or motorcycle</p>
              </div>
            </div>
            <div className={styles.requirement}>
              <FaShieldAlt className={styles.icon} />
              <div>
                <h3>Documentation</h3>
                <p>Valid ID and proof of student status</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.earnings} data-aos="fade-up">
        <div className={styles.container}>
          <h2>Earning Potential</h2>
          <div className={styles.earningDetails}>
            <div className={styles.earning}>
              <h3>Base Rate</h3>
              <p>₦300-500</p>
              <span>Per delivery</span>
            </div>
            <div className={styles.earning}>
              <h3>Distance Bonus</h3>
              <p>+₦100</p>
              <span>Per extra kilometer</span>
            </div>
            <div className={styles.earning}>
              <h3>Peak Hours</h3>
              <p>+50%</p>
              <span>Additional earnings</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faq} data-aos="fade-up">
        <div className={styles.container}>
          <h2>Common Questions</h2>
          <div className={styles.questions}>
            <div className={styles.question}>
              <h3>What are the working hours?</h3>
              <p>You can choose your own hours and work as little or as much as you want, with peak hours during lunch and dinner times.</p>
            </div>
            <div className={styles.question}>
              <h3>How do I get paid?</h3>
              <p>Earnings are transferred to your bank account weekly, including base pay, bonuses, and tips.</p>
            </div>
            <div className={styles.question}>
              <h3>What support do I get?</h3>
              <p>We provide onboarding training, delivery bag, and 24/7 support through the app.</p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cta} data-aos="zoom-in">
        <div className={styles.container}>
          <h2>Start Earning Today</h2>
          <p>Join our network of student pickers and earn while you study</p>
          <Link to="/register" className={styles.ctaButton}>
            Apply Now
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Rider;