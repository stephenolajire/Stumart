import { use, useContext, useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import styles from "../css/About.module.css";
import teamwork from "../assets/student.jpeg";
import delivery from "../assets/del.jpeg";
import campus from "../assets/uni.jpeg";
import { Link } from "react-router-dom";
import { GlobalContext } from "../constant/GlobalContext";

const About = () => {
  const { isAuthenticated } = useContext(GlobalContext);
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  return (
    <div className={styles.aboutContainer}>
      <section className={styles.hero} data-aos="fade-down">
        <h1>About StuMart</h1>
        <p>Connecting Campus Communities Through Commerce</p>
      </section>

      <section className={styles.mission} data-aos="fade-up">
        <div className={styles.container}>
          <h2>Our Mission</h2>
          <p>
            StuMart is dedicated to revolutionizing campus commerce by creating
            a seamless marketplace that connects students, local vendors, and
            delivery partners. We aim to make student life easier through
            accessible, affordable, and efficient shopping solutions.
          </p>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.container}>
          <div className={styles.featureCard} data-aos="fade-up">
            <img src={campus} alt="Campus Community" />
            <h3>Campus-Focused</h3>
            <p>
              Built specifically for university communities, understanding the
              unique needs and challenges of student life.
            </p>
          </div>

          <div className={styles.featureCard} data-aos="fade-up">
            <img src={teamwork} alt="Student Opportunities" />
            <h3>Student Opportunities</h3>
            <p>
              Creating job opportunities for students through our delivery
              partner program and vendor platform.
            </p>
          </div>

          <div className={styles.featureCard} data-aos="fade-in">
            <img src={delivery} alt="Quick Delivery" />
            <h3>Quick Delivery</h3>
            <p>
              Fast, reliable delivery service powered by fellow students who
              know the campus inside out.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.howItWorks} data-aos="fade-up">
        <div className={styles.container}>
          <h2>How It Works</h2>
          <div className={styles.steps}>
            <div
              className={styles.step}
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className={styles.stepNumber}>1</div>
              <h3>Browse & Order</h3>
              <p>
                Explore products from various campus vendors and place your
                order with just a few clicks.
              </p>
            </div>

            <div
              className={styles.step}
              data-aos="zoom-in"
              data-aos-delay="200"
            >
              <div className={styles.stepNumber}>2</div>
              <h3>Student Picker</h3>
              <p>
                A fellow student picker accepts your order and coordinates with
                the vendor.
              </p>
            </div>

            <div
              className={styles.step}
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <div className={styles.stepNumber}>3</div>
              <h3>Swift Delivery</h3>
              <p>
                Receive your order quickly at your hostel or preferred campus
                location.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.stats} data-aos="fade-up">
        <div className={styles.container}>
          <div className={styles.stat}>
            <h3>1000+</h3>
            <p>Active Users</p>
          </div>
          <div className={styles.stat}>
            <h3>50+</h3>
            <p>Campus Vendors</p>
          </div>
          <div className={styles.stat}>
            <h3>100+</h3>
            <p>Student Pickers</p>
          </div>
          <div className={styles.stat}>
            <h3>5000+</h3>
            <p>Deliveries Made</p>
          </div>
        </div>
      </section>

      <section className={styles.cta} data-aos="zoom-in">
        <div className={styles.containers}>
          <h2>Join the Campus Revolution</h2>
          <p>
            Whether you're a student, vendor, or potential delivery partner, be
            part of our growing community.
          </p>
          {isAuthenticated ? (
            <Link to="/products">
              <button className={styles.ctaButton}>Get Started</button>
            </Link>
          ) : (
            <Link to="/register">
              <button className={styles.ctaButton}>Get Started</button>
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default About;
