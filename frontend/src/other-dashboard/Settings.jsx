import React, { useState } from 'react';
import styles from './css/Settings.module.css';

const Settings = ({ vendor }) => {
  const [formData, setFormData] = useState({
    business_name: vendor?.business_name || '',
    email: vendor?.email || '',
    phone: vendor?.phone || '',
    address: vendor?.address || '',
    specific_category: vendor?.specific_category || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Updated settings:', formData);
  };

  return (
    <div className={styles.settingsContainer}>
      <h2 className={styles.title}>Account Settings</h2>
      
      <form onSubmit={handleSubmit} className={styles.settingsForm}>
        <div className={styles.formGroup}>
          <label htmlFor="business_name">Business Name</label>
          <input
            type="text"
            id="business_name"
            value={formData.business_name}
            onChange={(e) => setFormData({...formData, business_name: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="phone">Phone Number</label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="address">Business Address</label>
          <textarea
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
          />
        </div>

        <button type="submit" className={styles.submitButton}>
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default Settings;