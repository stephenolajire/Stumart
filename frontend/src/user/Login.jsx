import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../css/Login.module.css';
import logo from '../assets/stumart.jpeg';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Add login logic here
    console.log('Login data:', formData);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <img src={logo} alt="StuMart Logo" className={styles.logo} />
          <h1>Welcome Back</h1>
          <p>Login to access your StuMart account</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <div className={styles.forgotPassword}>
            <NavLink to="/forgot-password">Forgot Password?</NavLink>
          </div>

          <button type="submit" className={styles.loginButton}>
            Login
          </button>

          <div className={styles.registerLink}>
            Don't have an account?{' '}
            <NavLink to="/register">Register here</NavLink>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;